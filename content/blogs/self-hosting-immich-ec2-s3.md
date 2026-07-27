---
title: 'Self-Hosting Immich on EC2 with Unlimited S3 Storage'
date: 2026-07-26T10:00:00+03:00
draft: false
summary: 'How I run my own Google Photos: Immich on a Linux EC2 box, photos on an S3 mount for effectively unlimited storage, private over Tailscale, with SSL at Cloudflare.'
categories:
  - Homelab
tags:
  - Immich
  - Self-hosting
  - AWS
  - Tailscale
  - Cloudflare
---

I stopped renting my own memories. Google Photos is a great product, but it is a subscription that only ever gets more expensive, and every photo I take lives on someone else's terms. So I moved the whole library to [Immich](https://immich.app), self-hosted, with storage that is effectively unlimited and costs me pennies per GB.

Here is the architecture I landed on.

## The shape of it

- **Compute:** a Linux EC2 instance runs Immich in Docker.
- **Storage:** photos and videos don't live on the instance's disk. An S3 bucket is mounted into the filesystem, so Immich writes to a normal path while the bytes actually land in S3. Storage grows without me ever resizing a volume.
- **Private access:** the whole thing sits on my [Tailscale](https://tailscale.com) tailnet, so from any of my devices it's just a private hostname, no ports exposed to the internet.
- **Public + SSL:** [Cloudflare](https://www.cloudflare.com) terminates TLS and fronts the one hostname I do want reachable, so the mobile app has a clean HTTPS endpoint.

## Storage: the S3 mount

This is the part that makes it "unlimited." Instead of a big EBS volume I have to grow and pay for whether it's full or not, I mount an S3 bucket into the filesystem and point Immich's upload location at it.

```bash
# Mount the bucket into a local path (rclone or mountpoint-s3 both work)
rclone mount photos-bucket:immich /mnt/immich \
  --vfs-cache-mode writes \
  --allow-other \
  --daemon
```

Immich then treats `/mnt/immich` like any other directory. Uploads, thumbnails, and the ML-generated data all flow to S3. I pay for exactly the bytes I store, lifecycle rules push old originals to cheaper storage classes, and I never think about disk size again.

> Illustrative config - tune the cache mode, storage class, and IAM policy to your own setup before you rely on it.

## Immich itself

Standard Immich `docker-compose`, with the upload location pointed at the mount:

```yaml
services:
  immich-server:
    image: ghcr.io/immich-app/immich-server:release
    environment:
      UPLOAD_LOCATION: /mnt/immich
      DB_PASSWORD: ${DB_PASSWORD}
    volumes:
      - /mnt/immich:/usr/src/app/upload
    restart: always
```

Postgres and Redis run alongside it. The machine-learning container handles face and object recognition - it is genuinely as good as the big-cloud photo search now, and it runs on my box, on my photos.

## Private by default, public where I choose

Everything is reachable over Tailscale first. My phone, my laptop, and my other machines all see Immich at a stable private hostname with no public exposure at all. For the one case where I want a clean public endpoint (sharing an album, the mobile app off my tailnet), Cloudflare sits in front and handles SSL, so there is never a raw origin certificate to manage.

## What it costs

Effectively: a small EC2 instance, plus S3 at a few cents per GB per month with lifecycle rules doing the heavy lifting. Compared to a photos subscription that scales with your library forever, it pays for itself quickly - and I own every byte.

If you want the other half of my homelab, the [Home Assistant and Lutron writeup](/blogs/home-assistant-lutron-covers/) is here.
