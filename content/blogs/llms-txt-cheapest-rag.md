---
title: "llms.txt Is the Cheapest RAG You'll Ever Ship"
date: 2026-07-28T21:30:00-07:00
draft: false
summary: "My site's chat agent answers with exact deep links to my posts - no search tool, no vector database. It reads /llms.txt at prompt time, and the whole 'retrieval pipeline' is one HTTP GET."
categories:
  - Meta
tags:
  - xpander
  - AI Agents
  - llms.txt
  - RAG
---

Ask the chat widget on this site for "the link to the iOS push post" and it answers with the exact URL, instantly. There is no search tool behind that. No vector database, no embeddings, no retrieval pipeline. The agent simply *knows* my site - because at prompt-build time it reads one file: [`/llms.txt`](/llms.txt).

## The two pieces

**Piece one: [llms.txt](https://llmstxt.org).** An emerging convention: a markdown file at your site root that summarizes who you are and lists your content as links with one-line descriptions - written for LLMs instead of crawlers. Mine is the whole site in ~4 KB: bio, contact, and every post grouped by theme.

**Piece two: a dynamic prompt.** In [xpander](https://xpander.ai), an agent's system prompt doesn't have to be static text. You can attach a *dynamic context* hook - a small Python function that runs in a sandbox (no secrets, no env) every time the agent builds its prompt, and whatever it returns gets appended:

```python
def xpander_dynamic_prompt() -> str:
    import urllib.request
    with urllib.request.urlopen("https://dudutwizer.com/llms.txt", timeout=20) as res:
        text = res.read().decode("utf-8", errors="replace")
    return f"Live context:\n{text[:4000]}"
```

That's the entire integration. Five lines. Every conversation starts with a fresh copy of the site's index already in the agent's head, and the "sync pipeline" is my normal deploy: push to `main`, GitHub Pages serves the new `llms.txt`, and the very next chat turn knows about the new post. The file *is* the database.

## Why this beats a search tool

Give the agent a `search_my_site` tool instead, and every question about my content costs an extra round trip: the model decides to call the tool, emits the call, waits for results, then reasons over them. That's a full additional inference pass - thousands of tokens of tool schema, query, and results - plus seconds of latency, *per lookup*. And the model has to decide to search; when it doesn't, it hallucinates a plausible-looking URL, which is worse than no answer.

With the index in the prompt, there is no decision to get wrong. The link is just *there*, in context, spelled correctly, on turn one.

## Why this beats RAG

RAG earns its complexity when the corpus doesn't fit in context. Mine is 30 posts. A vector database for 30 documents is a pipeline you babysit - embedding model, chunking strategy, index sync on every publish, retrieval that mostly returns what a table of contents would have told you - to approximate what one curated markdown file does exactly. Retrieval can miss; a table of contents can't.

The token math is boring, which is the point. My `llms.txt` is ~4 KB - roughly a thousand tokens riding along in the system prompt. At current input pricing (with prompt caching doing its thing) that's a rounding error per conversation - cheaper than a single search-tool round trip, never mind the standing cost of a retrieval stack.

## The honest boundaries

- **This is an index, not a corpus.** The agent knows what exists and where; for the full text of a post it can still fetch the URL. For a site, that's exactly the right division of labor.
- **It stops scaling eventually.** At hundreds of documents you're curating a table of contents of tables of contents, and real retrieval starts paying rent. Start with the file; graduate when you must.
- **Budget the truncation.** My hook caps at 4,000 characters, so the file is written to front-load identity and use relative links to stay inside the window. If your context file is bigger than your cap, the cap wins and you won't notice - until the agent doesn't know about your newest content.

## The pattern, generalized

"Fetch a small, curated, always-current document at prompt time" is not a website trick - it's the cheapest possible form of grounding. A team roster, a status page, a price list, a changelog: anything small enough to curate and important enough to be *always* right belongs in the prompt, not behind a retrieval hop. You already maintain the source of truth; just serve it where the agent can read it.

The rest of how this chat works - the one-POST agent, the key-holding Worker, the SSE stream - is in [Two API Calls to Put an AI Agent on a Static Site](/blogs/chatbot-static-site-cloudflare-worker/).
