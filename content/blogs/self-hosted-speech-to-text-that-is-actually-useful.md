---
title: 'Self-Hosted Speech-to-Text That Is Actually Useful'
date: 2026-08-19T10:00:00+03:00
draft: false
summary: 'parrot: a minimal macOS dictation daemon. Hold Fn, speak, release - text appears at your cursor. Whisper on the Apple Neural Engine, fully on-device, running as a login daemon - plus a hotword hack that routes "Jarvis, ..." straight into Claude Code.'
categories:
  - Homelab
tags:
  - Self-hosting
  - Speech-to-Text
  - Whisper
  - macOS
  - Dictation
  - Claude Code
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

## Pick your model

`parrot models` manages the Whisper variants:

| Model | Size | Notes |
|---|---|---|
| `whisper-base.en` | 145 MB | default, English, instant |
| `whisper-small.en` | 488 MB | better accuracy, still fast |
| `whisper-large-v3-turbo` | 1.6 GB | multilingual, the one I run |

I run `large-v3-turbo` as my daily driver. It handles my accent and the occasional Hebrew far better than the small English models. If you dictate in English only and want the smallest footprint, `base.en` is genuinely fine.

## From CLI tool to login daemon

Running `parrot` in a terminal tab is fine for trying it out, but a dictation hotkey has to be *always* there - not "there if I remembered to start it." parrot ships this as a subcommand:

```sh
parrot install --launch-at-login
```

That writes a plain LaunchAgent plist to `~/Library/LaunchAgents/com.digimata.parrot.plist` and bootstraps it with `launchctl` - no `SMAppService` framework ceremony, just the honest mechanism. (Pedantry corner: a LaunchAgent, not a LaunchDaemon - it runs in your user session, which it needs for mic access and event injection.) The generated plist gives you:

- `RunAtLoad` - starts at login
- `KeepAlive: {SuccessfulExit: false}` - launchd resurrects it if it crashes, but respects a clean exit
- `ProcessType: Interactive` - scheduled like a foreground app, so transcription doesn't get throttled as background work
- stdout/stderr to `/tmp/parrot.out.log` and `/tmp/parrot.err.log`

I made one manual edit: the stock plist runs the default model, and I wanted the big one pinned. So my `ProgramArguments` reads:

```xml
<array>
    <string>/usr/local/bin/parrot</string>
    <string>run</string>
    <string>--skip-doctor</string>
    <string>--model</string>
    <string>whisper-large-v3-turbo</string>
</array>
```

After swapping the binary or the plist, one command cycles it:

```sh
launchctl kickstart -k gui/$UID/com.digimata.parrot
```

Ten seconds later the log says `✓ whisper-large-v3-turbo ready` and the Fn key is live again.

## The Jarvis hack: dictation that can act

Here is where open source pays rent. The codebase is small enough to read in an evening, so mine is a local fork with one extra behavior: if a transcript *starts with the word "Jarvis"*, it doesn't get typed at the cursor - it gets executed.

The routing lives in a ~50-line `JarvisRouter` that hooks the transcription callback:

```swift
if let jarvisCommand = JarvisRouter.stripHotword(text) {
    JarvisRouter.dispatch(jarvisCommand)   // fire-and-forget
} else {
    TextInjector.inject(text)              // normal dictation
}
```

`stripHotword` checks for a leading "jarvis" (case-insensitive, tolerant of the comma Whisper likes to add), strips it, and returns the rest. `dispatch` launches `~/.parrot-jarvis/run.sh` as a detached process - fire-and-forget, so the hotkey loop never blocks on whatever the command ends up doing.

The wrapper script is where it gets fun. It quotes the dictated text zsh-safely, then uses AppleScript to open a **visible Terminal window running Claude Code** with the prompt:

```sh
shell_cmd="cd ~/Developer && claude --dangerously-skip-permissions <the dictated prompt>"
osascript -e 'tell application "Terminal" to activate' \
          -e "tell application \"Terminal\" to do script \"$shell_cmd\""
```

So I hold Fn and say *"Jarvis, check why the deploy failed and fix it"* - and a Terminal window opens with an agent already working on it. Every dispatch is appended to `~/.parrot-jarvis/jarvis.log`, so there's an audit trail of everything my voice has kicked off.

Two honest caveats. First, `--dangerously-skip-permissions` is doing load-bearing work: there is no one at the keyboard to click "allow," so the agent runs unattended - I accept that tradeoff on my own machine, scoped to my dev directory. Second, a hotword is an attack surface: anyone who can play audio near my Mac can talk to it. Same class of problem as "Hey Siri, unlock the door" - know your threat model.

While I was in there I made one more quality-of-life change to `TextInjector`: every transcript is also mirrored to the clipboard before injection. CGEvent typing occasionally gets dropped by some Electron apps, and sometimes I release Fn with no text field focused - now the utterance is always one Cmd+V away instead of gone.

Try doing any of this with a closed-source dictation subscription.

## The performance impact

Numbers from my machine (M5 Pro, 64 GB), pulled from the daemon's own logs - the last 137 real dictations, not a benchmark:

- **Transcription latency:** 0.77s average, 4.24s worst case - for utterances averaging **15.3 seconds** of speech. That's roughly 20× real-time, and it's the *turbo* large model, multilingual.
- **Memory:** ~220 MB resident with the model loaded and hot. The 1.6 GB of weights live in `~/Documents/huggingface` on disk (1.7 GB total with tokenizer and config) and are mapped in for the Neural Engine rather than sitting in the process heap.
- **Idle cost: zero.** 0.0% CPU while waiting - it's just an event tap watching for Fn. No fans, no battery story, nothing in Activity Monitor to notice.
- **Startup:** the model loads once at login (a few seconds for turbo) and stays resident. Every dictation after that pays only the transcription time.

The practical experience: I release the Fn key and the text is at my cursor in under a second, usually before I've moved my eyes back to the screen. On-device stopped being the compromise option a while ago.

## Own the stack

Speech-to-text stopped being a hard problem worth renting. The models are open, the hardware in your laptop is more than enough, a 7 MB daemon closes the gap - and because the daemon is open source, "dictation" quietly became "a voice interface to my agents." That last part is not on any pricing page.
