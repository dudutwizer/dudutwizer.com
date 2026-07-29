// Cloudflare Worker proxy for the dudutwizer.com chat widget.
// The browser NEVER sees the xpander key; it lives only as this Worker's secret.
//   browser  ->  POST /api/chat { message, conversationId? }  ->  this Worker
//            ->  xpander gateway stream (x-api-key)  ->  SSE piped back to the browser.
// Secrets/vars:  XPANDER_API_KEY (secret), XPANDER_AGENT_URL, ALLOWED_ORIGIN.
// XPANDER_AGENT_URL = https://api.xpander.ai/v1/agents/<agent-id>/gateway/invoke/stream

const HITS = new Map();
function rateLimited(ip) {
  const now = Date.now(), win = 60_000, max = 20;
  const rec = HITS.get(ip);
  if (!rec || now - rec.t > win) { HITS.set(ip, { t: now, n: 1 }); return false; }
  rec.n += 1;
  return rec.n > max;
}

function cors(origin, allowed) {
  const ok = origin === allowed || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const co = cors(origin, env.ALLOWED_ORIGIN);
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { ...co, 'Content-Type': 'application/json' } });

    if (request.method === 'OPTIONS') return new Response(null, { headers: co });
    const url = new URL(request.url);
    if (request.method !== 'POST' || !url.pathname.endsWith('/chat')) return json({ error: 'not found' }, 404);

    const ip = request.headers.get('CF-Connecting-IP') || 'anon';
    if (rateLimited(ip)) return json({ error: 'rate limited' }, 429);
    if (!env.XPANDER_API_KEY || !env.XPANDER_AGENT_URL) return json({ error: 'not configured' }, 503);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400); }
    const message = (body && typeof body.message === 'string' ? body.message : '').slice(0, 2000);
    if (!message) return json({ error: 'empty message' }, 400);

    // Every website visitor is UNAUTHENTICATED. The Worker forces this identity server-side (the
    // browser is never trusted to claim otherwise) and appends it to the prompt so the agent always
    // knows it's talking to an anonymous public visitor, not David or a signed-in teammate.
    const UNAUTH_CONTEXT =
      "\n\n(Context: this message is from an UNAUTHENTICATED public visitor on dudutwizer.com - " +
      "not David and not a signed-in teammate. You are David's public website assistant: answer questions " +
      "about David and xpander and help the visitor book a meeting. Never perform internal or authenticated " +
      'actions, and never reveal private data.)';
    const input = {
      text: message + UNAUTH_CONTEXT,
      user: {
        id: 'anonymous',
        email: '',
        first_name: 'Website',
        last_name: 'Visitor',
        role: 'member',
        is_super_admin: false,
        additional_attributes: { authenticated: false, source: 'dudutwizer.com public site' },
      },
    };
    // Conversation continuity: the gateway keys memory off the TOP-LEVEL `id` (same id across
    // turns = one conversation). The widget sends a stable per-session id.
    const payload = { input };
    if (body.conversationId && typeof body.conversationId === 'string') payload.id = body.conversationId.slice(0, 128);

    let upstream;
    try {
      upstream = await fetch(env.XPANDER_AGENT_URL, {
        method: 'POST',
        headers: {
          'x-api-key': env.XPANDER_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(payload),
      });
    } catch {
      return json({ error: 'upstream unreachable' }, 502);
    }
    if (!upstream.ok || !upstream.body) return json({ error: 'agent error' }, 502);

    // Pipe the SSE stream straight through - the browser parses `chunk` / `task_finished`.
    return new Response(upstream.body, {
      headers: { ...co, 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    });
  },
};
