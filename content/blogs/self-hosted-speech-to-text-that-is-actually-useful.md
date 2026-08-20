---
title: 'Self-Hosted Speech-to-Text That Is Actually Useful'
date: 2026-08-19T10:00:00+03:00
draft: false
summary: 'parrot: a minimal macOS dictation daemon. Hold Fn, speak, release - text appears at your cursor. Whisper running on the Apple Neural Engine, fully on-device, no cloud, no subscription.'
categories:
  - Homelab
tags:
  - Self-hosting
  - Speech-to-Text
  - Whisper
  - macOS
  - Dictation
---

Most speech-to-text products follow the same playbook: your voice goes to someone else's server, gets transcribed on someone else's GPU, and comes back with a monthly invoice attached. The good ones are genuinely good - and they still lose me at the part where my microphone is a subscription.

So here is the setup I actually use, every day, on my Mac: [parrot](https://github.com/digimata/parrot), a minimal open-source dictation daemon. The whole product is one sentence:

> Hold Fn, speak, release. Text appears at the cursor.

That's it. No app window, no account, no cloud. A small pill at the bottom of the screen shows when the mic is hot, and the transcribed text lands in whatever app has focus - terminal, browser, Slack, an IDE.

## Why this one

I have tried the "AI dictation" apps. What kept bothering me is how much machinery they wrap around a fundamentally local problem. Apple Silicon has a Neural Engine sitting right there; Whisper is open source; the only hard parts are audio capture, a global hotkey, and injecting text at the cursor. parrot does exactly those things and nothing else:

- **Swift**, single SPM executable - the binary is ~7 MB
- **WhisperKit** - Whisper inference via CoreML, accelerated on the Apple Neural Engine
- **AVAudioEngine** for mic capture, **CGEventTap** for the Fn-hold hotkey, **CGEvent** to type the result at your cursor

Audio never leaves the machine. There is no telemetry, no login, and nothing to renew. The models are the open-source Whisper weights, pulled once from Hugging Face and cached locally.

## Install

```sh
curl -fsSL https://digimata.github.io/parrot/install.sh | sh
parrot setup      # walks through mic + accessibility permissions
```

Requires macOS 14+ on Apple Silicon. First run downloads the default model (`whisper-base.en`, 145 MB), and you're dictating.

If you want it always on:

```sh
parrot install --launch-at-login
```

That drops a LaunchAgent so the daemon starts at login and quietly waits for the Fn key.

## Pick your model

`parrot models` manages the Whisper variants:

| Model | Size | Notes |
|---|---|---|
| `whisper-base.en` | 145 MB | default, English, instant |
| `whisper-small.en` | 488 MB | better accuracy, still fast |
| `whisper-large-v3-turbo` | 1.6 GB | multilingual, the one I run |

I run `large-v3-turbo` as my daily driver. On an M-series ANE it transcribes a few seconds of speech in well under a second, and it handles my accent and the occasional Hebrew far better than the small English models. If you dictate in English only and want the smallest footprint, `base.en` is genuinely fine.

## The part I like most

The codebase is small enough to read in an evening - and small enough to hack. Mine is a local build with a few extra routines wired in, so dictation isn't just typing: it can route what I say into my own assistant instead of the frontmost app. Try doing that with a closed-source dictation subscription.

That's the whole point of tools like this. Speech-to-text stopped being a hard problem worth renting. The models are open, the hardware in your laptop is more than enough, and a 7 MB daemon closes the gap. Own the stack.
