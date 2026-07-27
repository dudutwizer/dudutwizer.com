---
title: 'How This Site Is Built'
date: 2026-07-26T12:00:00+03:00
draft: false
summary: 'A static Hugo site on GitHub Pages, fronted by Cloudflare, with zero backend - except one small Worker for the chat.'
categories:
  - Meta
tags:
  - Hugo
  - Static Site
  - GitHub Pages
  - Cloudflare
---

This site has almost no moving parts on purpose. It's a static site I fully own, it costs effectively nothing to run, and there's no database, no server to patch, and no third-party CMS deciding my content's fate. Here's the whole thing.

## The stack

- **[Hugo](https://gohugo.io)** builds the site from Markdown. Every post you see is a `.md` file with a bit of front matter.
- **[PaperMod](https://github.com/adityatelange/hugo-PaperMod)** is the base theme, with my own layout overrides on top - a custom homepage, this page's layout, and a few tweaked partials. The type is set in **Geist**.
- **[GitHub Pages](https://pages.github.com)** hosts it. Hugo publishes straight into a `docs/` folder, and Pages serves that folder. Push to the repo and the new build is live.
- **[Cloudflare](https://www.cloudflare.com)** sits in front for DNS and SSL on the custom domain (a `CNAME` file pins `dudutwizer.com`).

That's the entire hosting story: write Markdown, `hugo`, commit, push.

## The only dynamic bits

A static site can still feel alive without a backend:

- The **GitHub contribution graph** on the homepage is fetched client-side from a public contributions API and drawn into a small CSS grid - no build step, no server, and it scales to fit any screen.
- The **"Chat with my AI"** widget is the one real integration. It talks to an [xpander](https://xpander.ai) agent, but a static page can't hold an API key safely - so there's exactly one tiny piece of compute involved: a Cloudflare Worker. I wrote that up separately in [how the chatbot works without leaking the key](/blogs/chatbot-static-site-cloudflare-worker/).

## Why bother

Because I've watched too many personal sites die inside someone else's platform. This one is a folder of Markdown and a theme. If every service it touches disappeared tomorrow, I could rebuild and redeploy it in minutes, anywhere. Own your platform - it's the same thing I say about [AI stacks](/blogs/own-your-ai-stack/), just smaller.
