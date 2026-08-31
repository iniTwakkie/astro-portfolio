---
title: Homelab setup (Part1)
description: An updated overview of my homelab — the low-power compute nodes, NAS storage, and remote access that keep my setup simple but powerful.
date: 2023-04-03
published: true
---

Working from home (and building side projects) pushed me into running my own homelab. For me it's not about having servers for the sake of it — it's reliable compute, storage, and remote access that I control, without complicating day-to-day use.

## Approach

- Small, low-power compute nodes instead of one big server
- Easy remote access for me and family (Tailscale + exit nodes)
- NAS for large media and backups
- Cloud-first for everyday documents and email
- A small public layer for internet-facing services

## Compute: 4 nodes

![Dell OptiPlex Micro Stack](/images/dell-micro-stack.jpg)

Four Dell OptiPlex 7040 Micro nodes (i7-6700T, 32GB RAM) — small, quiet, low power, and reliable.

- 2 at home: one runs Linux workloads, one runs Windows workloads.
- 2 at my parents and brother's place: lets them run home services if they want, and gives me reliable Tailscale exit nodes.

## Storage: 2 NAS devices

Daily documents and email stay in Google Drive. The NAS layer handles large storage, owned media, and Plex. One NAS at home, one at my parents.

## Public-facing: 2 small VMs

Two small VMs handle anything that needs to be reachable from the internet, keeping my home network separated from the public side.

## Virtualisation

My home Linux node runs two VMs: one for Docker containers and services, and one dedicated coding environment. Keeps things separated and easy to rebuild.

## Why it works

Reliable compute without enterprise hardware, easy to grow, solid remote access, and a clean split between home, family, and public services.