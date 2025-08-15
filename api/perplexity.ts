// /api/perplexity.ts  (Vercel serverless Edge function)
export const config = { runtime: 'edge' };

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',              // or your domain
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: Request) {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    const key = process.env.PERPLEXITY_API_KEY;
    if (!key) {
      return new Response(JSON.stringify({ error: 'Missing PERPLEXITY_API_KEY' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    const payload = await req.json().catch(() => null);
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    const upstream = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  } catch (err: any) {
    // See error in Vercel > Project > Functions > Logs
    console.error('Perplexity proxy error:', err);
    return new Response(JSON.stringify({ error: 'Proxy error', message: String(err?.message || err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }
}
