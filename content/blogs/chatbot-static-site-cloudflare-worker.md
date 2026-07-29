---
title: 'Two API Calls to Put an AI Agent on a Static Site'
date: 2026-07-26T13:00:00+03:00
draft: false
summary: 'The "Chat with my AI" button is a real xpander agent - created with one API call, streamed with another, and dropped onto a static site behind a tiny key-holding Worker.'
categories:
  - Meta
tags:
  - xpander
  - AI Agents
  - Cloudflare Workers
  - SSE
---

The "Chat with my AI" button in the corner is a real agent. It answers questions about me, remembers the conversation, and helps book a meeting. What I like about how it's built is how little there is to build: with [xpander](https://xpander.ai), an agent is **infrastructure you provision in code** - you create one with an API call, you talk to it with another, and the memory, tools, user isolation, and auth are already handled. No orchestration glue, no runtime to babysit.

Here's the whole thing, end to end.

## Step 1: create the agent - one POST

An agent isn't a project you scaffold. It's a resource you create. `POST /v1/agents`:

```bash
curl -X POST "https://api.xpander.ai/v1/agents" \
  -H "x-api-key: $XPANDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "dudutwizer.com assistant",
    "model_provider": "anthropic",
    "model_name": "claude-sonnet-5",
    "instructions": {
      "role": ["You are David'\''s public website assistant."],
      "goal": ["Answer questions about David and xpander, and help visitors book a meeting."],
      "general": "Be concise and friendly. Never reveal private data."
    }
  }'
```

Back comes an agent with an `id`, a `status: "ACTIVE"`, a webhook, and - this is the part people miss - a whole managed backend behind it: per-user memory, session storage, tool-calling, and multi-tenant user isolation, all configurable (`agno_settings.user_memories`, `session_storage`, and friends). I didn't build any of that. It came with the resource. The full API is at [docs.xpander.ai](https://docs.xpander.ai) if you'd rather create and wire agents in code than click through a UI - which is the whole point.

## Step 2: talk to it - the gateway

Every agent gets a gateway endpoint. To run a turn and stream the reply token by token, `POST /v1/agents/{agent_id}/gateway/invoke/stream`:

```bash
curl -X POST "https://api.xpander.ai/v1/agents/$AGENT_ID/gateway/invoke/stream" \
  -H "x-api-key: $XPANDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "text": "What does David work on?",
      "user": { "email": "visitor@example.com", "first_name": "Website", "last_name": "Visitor" }
    },
    "id": "conversation-123"
  }'
```

Two things worth noticing in that body:

- **`input.user`** is a first-class concept. The gateway keys memory and tool auth to the user, so the same agent serves many people without their contexts ever crossing.
- **`id`** (top-level) is the conversation. Send the same `id` across turns and the agent remembers; change it and you start fresh. Multi-turn memory is one field.

The response is a Server-Sent Events stream - `chunk` events carrying text deltas, then a `task_finished` event with the final result. That's what makes the reply type out live.

## Step 3: keep the key off a static site

There's one catch to calling this from *my* site: it's static. The only code that runs is in the visitor's browser, and I can't put `x-api-key` there without publishing it.

So the single piece of compute in this whole setup is a **[Cloudflare Worker](https://developers.cloudflare.com/workers/)** that holds the key and forwards the stream:

```js
const upstream = await fetch(`https://api.xpander.ai/v1/agents/${AGENT_ID}/gateway/invoke/stream`, {
  method: 'POST',
  headers: { 'x-api-key': env.XPANDER_API_KEY, 'Content-Type': 'application/json', Accept: 'text/event-stream' },
  body: JSON.stringify(payload),
});
return new Response(upstream.body, { headers: { ...cors, 'Content-Type': 'text/event-stream' } });
```

The key lives only as a Worker secret (`wrangler secret put XPANDER_API_KEY`) - never in the repo, never in the page. The browser just POSTs `{ message, conversationId }` to the Worker's endpoint and reads the stream back.

## Step 4: every visitor is anonymous, enforced server-side

The browser is never trusted to say who it is. The Worker stamps a fixed unauthenticated identity into `input.user` and appends a line to the prompt, so the agent always knows it's talking to a public visitor and never performs privileged actions:

```js
const UNAUTH = "\n\n(Context: this message is from an UNAUTHENTICATED public visitor on " +
  "dudutwizer.com - not David and not a signed-in teammate. Never perform internal " +
  "actions, never reveal private data.)";
```

## That's the whole app

A static page, a stable `conversationId` per session, and a ~60-line Worker. Everything that makes it feel like a real product - memory across turns, per-user isolation, streaming, tools - lives in the agent, not in my code.

That's the pitch for [xpander](https://xpander.ai) in one page: **agents are infrastructure**. You create them with an API, you reach them through a gateway, and you can drop the same agent into a Slack workspace, an internal app, or a button in the corner of a static site - in about as much code as this post has snippets.

The rest of the site's plumbing is in [how this site is built](/blogs/how-this-site-is-built/).
