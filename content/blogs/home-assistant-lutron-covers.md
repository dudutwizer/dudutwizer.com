---
title: 'My Home Assistant Setup, and the Lutron Shade Automation I Love'
date: 2026-07-26T11:00:00+03:00
draft: false
summary: 'Home Assistant on a Raspberry Pi 4, Lutron shades, an agent plugin, and the sun-tracking cover automation that quietly runs my windows for me.'
categories:
  - Homelab
tags:
  - Home Assistant
  - Lutron
  - Automation
  - Homelab
---

The best home automation is the kind you stop noticing. Mine runs on a [Raspberry Pi 4](https://www.raspberrypi.com) tucked in a closet, running [Home Assistant](https://www.home-assistant.io), and the automation I love most is the one that runs my [Lutron](https://www.lutron.com) shades so I never touch them.

## The box

A Raspberry Pi 4 running Home Assistant OS. That's it. It's low-power, silent, and it has been more reliable than half the cloud services it replaced. Everything local, everything mine.

## Lutron shades as "covers"

Home Assistant speaks to my Lutron hub over the local integration, and every shade shows up as a `cover` entity I can position from 0 (closed) to 100 (open). Once they're entities, they're just variables the house can reason about.

## The automation I love: shades that follow the sun

The trick is not "open at 8, close at 8." The trick is letting the shades track the actual sun so the room is never glaring or baking, and I never think about it.

```yaml
automation:
  - alias: "Shades track the sun"
    trigger:
      - platform: numeric_state
        entity_id: sun.sun
        attribute: elevation
        below: 25            # low sun = direct glare
    condition:
      - condition: numeric_state
        entity_id: sun.sun
        attribute: azimuth
        above: 200           # sun swung around to the west windows
    action:
      - service: cover.set_cover_position
        target:
          entity_id: cover.living_room_shades
        data:
          position: 30       # drop to 30% - kill the glare, keep the view

  - alias: "Morning: let the light in"
    trigger:
      - platform: sun
        event: sunrise
        offset: "+00:20:00"
    action:
      - service: cover.open_cover
        target:
          entity_id: cover.bedroom_shades

  - alias: "Sunset: privacy"
    trigger:
      - platform: sun
        event: sunset
    action:
      - service: cover.close_cover
        target:
          entity_id: cover.living_room_shades
```

The result: the shades ease down when the afternoon sun hits the west windows so the room never turns into an oven, open gently after sunrise so I wake up to daylight, and close for privacy at dusk. I haven't reached for a shade control in months.

> This is the shape of my automation - swap in your own entity IDs, angles, and offsets. Sun azimuth/elevation depend on your latitude and which way your windows face.

## Letting an agent drive the house

The newer piece: an OpenClaw plugin sitting on top of Home Assistant, so I can talk to the house in plain language - "close everything on the west side, it's too bright" - and it maps that to the right `cover` calls. It's the same idea I chase at work: agents that take real, multi-step actions across real systems, just pointed at my living room instead of an enterprise.

The other half of the homelab, [self-hosting Immich on EC2](/blogs/self-hosting-immich-ec2-s3/), is written up here.
