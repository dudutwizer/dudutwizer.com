---
title: 'My Home Assistant Setup, and the Blinds That Track the Sun'
date: 2026-07-26T11:00:00+03:00
draft: false
summary: 'Home Assistant OS on a Raspberry Pi 4, seven Lutron Caséta blinds driven by the Adaptive Cover integration, and an OpenClaw agent living on the Pi as an add-on.'
categories:
  - Homelab
tags:
  - Home Assistant
  - Lutron
  - Automation
  - Homelab
---

The best home automation is the kind you stop noticing. Mine runs on a [Raspberry Pi 4](https://www.raspberrypi.com) tucked in a closet, running [Home Assistant](https://www.home-assistant.io) OS, and the automation I love most is the one that runs my [Lutron](https://www.lutron.com) blinds so I never touch them.

## The box

A Raspberry Pi 4 running Home Assistant OS, with more radios hanging off it than a Cold War embassy: a SONOFF Zigbee dongle for ZHA, the Matter server add-on, Whisper running local speech-to-text, and go2rtc restreaming the cameras. Daily backups at 3am, updates on a schedule. It's low-power, silent, and it has been more reliable than half the cloud services it replaced.

## Lutron blinds as "covers"

Home Assistant talks to the Lutron Caséta hub over the local integration, and each of the seven blinds - living room, master bedroom, office, bathroom - shows up as a `cover` entity positionable from 0 to 100. Once they're entities, they're just variables the house can reason about.

## The automation I love: blinds that follow the sun

My first version of this was hand-written YAML with sun-elevation triggers. I don't run that anymore, and you shouldn't either - someone already solved this properly. [Adaptive Cover](https://github.com/basbruss/adaptive-cover) is a HACS integration that does the actual solar geometry: you tell it which way each window faces, and it continuously computes the right cover position from the sun's real azimuth and elevation at your location.

My windows face two directions, so there are two profiles:

- **Street side** - windows at azimuth ~103° (east-southeast), catching morning sun
- **Alameda side** - windows at azimuth ~203° (south-southwest), catching the afternoon blast

Each profile drives its group of Lutron covers. When the sun swings into a facade's field of view, those blinds ease down just enough to kill the direct light; as it moves off, they drift back open. It isn't "close at 3pm" - it's a continuous position that tracks the actual sun, so the room is never glaring and never a cave. At sunset everything returns to open, and I haven't reached for a blind control in months.

The integration handles the parts you'd get wrong in DIY YAML: interpolating position between sun events, per-window field-of-view math, and not spamming the motors with one-percent adjustments (it moves the blinds only when the computed position changes meaningfully).

## The rest of the automations

The honest list is less glamorous and more useful: a webhook-triggered morning routine (lights and AC on) and a "bye" routine that shuts it all down, an alert if the baby's room creeps above temperature - with the AC told to behave, battery warnings for the iPads before they die mid-use, and camera motion alerts with an actionable notification whose best button is "shut up for 3 hours."

## Letting an agent live on the Pi

The newest piece: an [OpenClaw](https://github.com/techartdev/OpenClawHomeAssistant) agent runs directly on the Pi as a Home Assistant add-on. It gets a long-lived HA token and auto-configures MCP against Home Assistant, so I can tell it things like "close everything on the west side, it's too bright" and it maps that to the right `cover` calls - plus it can reach the rest of my network when I need it to. It's the same idea I chase at work: agents that take real, multi-step actions across real systems, just pointed at my living room instead of an enterprise.

The other half of the homelab, [self-hosting Immich on EC2](/blogs/self-hosting-immich-ec2-s3/), is written up here.
