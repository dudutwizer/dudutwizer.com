---
title: 'Self-Hosting Immich on EC2, with the Photo Library on S3'
date: 2026-07-26T10:00:00+03:00
draft: false
summary: 'How I run my own Google Photos: Immich on a Graviton EC2 box, originals on an S3 rclone mount, hot data on EBS, private over Tailscale, with a real Let''s Encrypt cert and zero open ports.'
categories:
  - Homelab
tags:
  - Immich
  - Self-hosting
  - AWS
  - Tailscale
  - Cloudflare
---

I stopped renting my own memories. Google Photos is a great product, but it is a subscription that only ever gets more expensive, and every photo I take lives on someone else's terms. So I moved the whole library to [Immich](https://immich.app), self-hosted, with the originals in S3 where storage grows without me ever resizing anything.

Here is the architecture, as it actually runs.

## The shape of it

- **Compute:** a `t4g.medium` (Graviton/ARM) EC2 instance on Ubuntu 24.04, running the standard Immich Docker Compose stack out of `/opt/immich` - server, machine-learning container, Immich's Postgres image (with vector search built in), Valkey, and Traefik in front.
- **Storage:** split in two, on purpose. Originals live in an S3 bucket mounted into the filesystem; the hot data lives on a dedicated EBS volume. More on why below.
- **Private access:** the whole thing sits on my [Tailscale](https://tailscale.com) tailnet. My phone uploads over the tailnet; nothing is exposed to the internet - not even port 443.
- **Real TLS anyway:** Traefik carries a genuine Let's Encrypt certificate for the private hostname, issued via DNS challenge - so the mobile app gets clean HTTPS with zero open ports.

## Storage: S3 for the library, EBS for the hot path

My first instinct was "put everything on S3." That's the wrong split. Postgres and thumbnails want real disk latency; originals are big, sequential, write-once blobs. So:

- A **dedicated EBS data volume** is mounted at `/mnt/immich-data` and holds Immich's `UPLOAD_LOCATION` - thumbnails, encoded video, upload staging, profile data, database backups - plus the Postgres data directory (and the swap file, because a 4 GB ARM box appreciates one).
- An **S3 bucket is rclone-mounted** at `/mnt/immich-library` and bind-mounted into the container as `/data/library` - which is exactly the subfolder where Immich puts your originals after ingest. The mount is a proper systemd unit, not a `--daemon` flag in someone's shell history:

```ini
# /etc/systemd/system/immich-library.service (the shape of it)
[Service]
ExecStart=rclone mount s3-remote:my-photos-bucket /mnt/immich-library \
  --allow-other --vfs-cache-mode writes
```

The result: the library - the part that actually grows forever - costs S3 prices and never needs a volume resize. The parts that need to be fast sit on a modest EBS volume that hasn't moved past halfway. Immich itself is none the wiser; it sees `/data` and `/data/library` as ordinary directories.

```yaml
# docker-compose environment, the parts that matter
UPLOAD_LOCATION: /mnt/immich-data/immich     # EBS: thumbs, encoded video, staging
DB_DATA_LOCATION: /mnt/immich-data/postgres  # EBS: Postgres wants a real disk
# /mnt/immich-library (S3 via rclone) -> /data/library  # originals
```

## Private by default - actually private

The instance is a Tailscale node. My phone and laptops reach it at its tailnet address, the Immich app syncs over it (the server logs are full of `100.x.x.x` client addresses), and there is no public ingress at all.

The clever bit is TLS. I wanted the mobile app talking to a proper HTTPS endpoint, not a self-signed cert - but I also wasn't going to open port 80 for an ACME HTTP challenge. Traefik solves it with a **DNS-01 challenge**: the hostname's DNS lives at Cloudflare, Traefik proves ownership by writing a DNS record through the Cloudflare API, and Let's Encrypt hands over a real certificate for a machine no one on the internet can reach. Cloudflare never proxies a byte of traffic - it's just the DNS pen that signs the paperwork.

```yaml
# traefik.yml - the whole trick
certificatesResolvers:
  letsencrypt:
    acme:
      dnsChallenge:
        provider: cloudflare
```

## What it costs

A small ARM instance, a modest EBS volume, and S3 for the originals at cents per GB. The machine-learning container runs face and object recognition locally - it is genuinely as good as the big-cloud photo search now, and it runs on my box, on my photos. Compared to a photos subscription that scales with your library forever, it pays for itself quickly - and I own every byte.

If you want the other half of my homelab, the [Home Assistant writeup](/blogs/home-assistant-lutron-covers/) is here.
