---
title: 'Get iOS Push Notifications When Your Agent Finishes (or Fails)'
date: 2026-07-27T09:00:00+03:00
draft: false
summary: "Wire an xpander agent's success/error webhook into hark.ryan.ceo and your phone buzzes the moment a long-running agent task finishes - no polling, no forgotten tabs."
categories:
  - xpander
tags:
  - xpander
  - AI Agents
  - iOS
  - Notifications
  - Product
---

Agent tasks are not instant. Some finish in three seconds, some run for twenty minutes while an agent crawls a repo, calls six tools, and writes a report. The annoying part isn't the wait, it's babysitting it: keeping a tab open, alt-tabbing back every so often, refreshing to see if it's done yet.

I fixed this in about two minutes with a setting that's already sitting in every xpander agent's configuration screen: **Notify**. Point it at [hark.ryan.ceo](https://hark.ryan.ceo) and every task completion (or failure) shows up as a real push notification on your iPhone, with zero code and no server of your own.

Here's the whole setup.

## What hark.ryan.ceo actually is

[hark.ryan.ceo](https://hark.ryan.ceo) is a tiny, purpose-built service: it hands you a unique webhook URL, and anything you `POST` to that URL turns into an iOS push notification on your phone. That's the entire product. No account dashboards to configure, no SDK to embed, no APNs certificates to manage yourself. You get a URL that looks like:

```text
https://hark.ryan.ceo/hooks/whk_E_UPMb48W9ChBCl6nUPlu2qL
```

Anything that can fire a webhook can now reach your lock screen. Which is exactly what an agent's task lifecycle can do.

## Where this lives in xpander: the agent's Notify settings

Every xpander agent has a **Notify** section right in its settings, next to the security controls (max tool calls per task, per-task and per-agent budgets, budget alerts). It's built around two lifecycle events:

- **On success** - fires when a task completes successfully.
- **On error** - fires when a task errors, fails, or is stopped.

For each one you pick a channel - **Email**, **Webhook**, or **Slack** - and for Webhook you drop in a destination URL plus optional custom headers. Toggle **On success** on, select **Webhook**, paste your hark.ryan.ceo hook URL, and you're done:

```text
NOTIFY
  On success  [x]  -> Webhook -> https://hark.ryan.ceo/hooks/whk_E_UPMb48W9ChBCl6nUPlu2qL
  On error    [ ]  -> (leave off, or wire a second hook)
```

No redeploy, no restart. The agent starts posting to that URL on its very next completed task.

## Setting it up, step by step

1. **Get a hook.** Open [hark.ryan.ceo](https://hark.ryan.ceo), install the companion iOS app, and grab your personal webhook URL (`https://hark.ryan.ceo/hooks/whk_...`). It's unique to you - anyone who has it can push to your phone, so treat it like a secret.
2. **Open your agent's settings in xpander** and scroll to the **Notify** block.
3. **Turn on "On success"** and choose **Webhook** as the channel.
4. **Paste the hark.ryan.ceo URL** into the destination field. Add any headers if your setup needs them (most people won't).
5. **Turn on "On error" too**, ideally pointed at the same hook (or a second one) so failures buzz you just as reliably as successes - a silent failure is worse than no notification at all.
6. **Kick off a task** and watch your phone. That's the whole loop.

You can do the same for **Slack** or **Email** channels on the same screen if you want redundancy - I run Webhook-to-hark as my primary and leave Slack on for a written trail in a channel.

## Why this is worth the two minutes

- **No polling.** You stop refreshing a dashboard to check if a background research task or a multi-step tool chain has wrapped up.
- **No infrastructure.** hark.ryan.ceo *is* the notification backend. Xpander already tracks task success/failure natively, so this is two settings meeting each other, not a new service to run.
- **Fail-loud by default.** Wiring "On error" is the real value here - agents that quietly stop mid-task are the ones that cost you the most time to notice. A push notification the second something breaks turns a "why didn't this run overnight" investigation into a five-second glance at your lock screen.
- **Per-agent granularity.** Because Notify lives on each agent's own settings, your noisy background crawler and your careful production agent can have completely different notification rules.

That's it - one webhook field, pointed at a service built to do exactly one thing well, and every agent task you kick off now taps you on the shoulder when it's actually done.
