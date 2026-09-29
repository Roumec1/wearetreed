// Only our own site may submit the form (plus Vercel preview deploys).
const ALLOWED = [/^https:\/\/([a-z0-9-]+\.)*wearetreed\.com$/i, /^https:\/\/[a-z0-9-]+\.vercel\.app$/i];

// Per-IP throttle (best effort — lives as long as a warm serverless instance).
const HITS = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

const SPAM_WORDS = /\b(seo|backlinks?|casino|crypto|bitcoin|forex|viagra|cialis|loan|guest ?post|rank(ing)? (your|on)|web ?traffic|telegram|whatsapp me|onlyfans|porn|betting)\b/i;

function originOf(req) {
  if (req.headers.origin) return req.headers.origin;
  try { return new URL(req.headers.referer).origin; } catch { return ''; }
}

function spamReason(req, b) {
  if (b._gotcha) return 'honeypot';
  const elapsed = Number(b._elapsed);
  if (!Number.isFinite(elapsed) || elapsed < 3000) return 'too-fast';
  const text = [b.name, b.company, b.message].filter(Boolean).join(' ');
  if (/[Ѐ-ӿ一-鿿]/.test(text)) return 'script';
  if (/https?:\/\/|www\./i.test(b.name || '') || /https?:\/\/|www\./i.test(b.company || '')) return 'link-in-name';
  if (((b.message || '').match(/https?:\/\//gi) || []).length >= 2) return 'links';
  if (SPAM_WORDS.test(text)) return 'keywords';
  return null;
}

function rateLimited(ip) {
  const now = Date.now();
  const recent = (HITS.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  HITS.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

export default async function handler(req, res) {
  const origin = originOf(req);
  const allowed = ALLOWED.some((re) => re.test(origin));

  if (allowed && req.headers.origin) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Real browsers always send Origin/Referer on a form POST; scripts hitting the API directly don't.
  if (!allowed) {
    console.warn('contact: blocked origin', origin || '(none)');
    return res.status(403).json({ error: 'Forbidden' });
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    console.warn('contact: rate limited', ip);
    return res.status(429).json({ error: 'Too many requests' });
  }

  const b = req.body || {};
  const { name, email, message, company, quantity, timeline } = b;

  // Spam: pretend success so bots don't adapt, but send nothing.
  const reason = spamReason(req, b);
  if (reason) {
    console.warn('contact: spam dropped —', reason, email);
    return res.status(200).json({ success: true });
  }

  if (!name || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (String(name).length > 120 || String(email).length > 160 || String(company || '').length > 160 ||
      String(message || '').length > 5000) {
    return res.status(400).json({ error: 'Input too long' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) {
    console.error('RESEND_API_KEY not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Leads go to the company mailbox (hardcoded so a stale CONTACT_EMAIL env var can't redirect them).
  const TO_EMAIL = 'plant@wearetreed.com';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'wearetreed Web <onboarding@resend.dev>',
        to: [TO_EMAIL],
        reply_to: email,
        subject: `Nová poptávka — ${name}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px">
            <h2 style="color:#3C5F27;margin-bottom:1.5rem">Nová poptávka z webu</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:.5rem 0;color:#666;width:120px"><strong>Jméno:</strong></td><td>${escapeHtml(name)}</td></tr>
              <tr><td style="padding:.5rem 0;color:#666"><strong>Email:</strong></td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
              ${company ? `<tr><td style="padding:.5rem 0;color:#666"><strong>Společnost:</strong></td><td>${escapeHtml(company)}</td></tr>` : ''}
              ${quantity ? `<tr><td style="padding:.5rem 0;color:#666"><strong>Množství:</strong></td><td>${escapeHtml(quantity)}</td></tr>` : ''}
              ${timeline ? `<tr><td style="padding:.5rem 0;color:#666"><strong>Termín:</strong></td><td>${escapeHtml(timeline)}</td></tr>` : ''}
            </table>
            ${message ? `<div style="margin-top:1.5rem;padding:1rem;background:#F0EFE9;border-left:3px solid #3C5F27;white-space:pre-wrap"><strong>Zpráva:</strong><br>${escapeHtml(message)}</div>` : ''}
            <p style="margin-top:2rem;font-size:.8rem;color:#999">Odesláno z kontaktního formuláře na wearetreed.com</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Send error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
