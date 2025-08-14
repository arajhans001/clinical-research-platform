// api/perplexity.ts
export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return new Response('Missing PERPLEXITY_API_KEY', { status: 500 });

  const payload = await req.json();

  const r = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await r.text();
  return new Response(text, {
    status: r.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
