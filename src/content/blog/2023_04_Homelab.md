---
title: "My Homelab in 2026: Nodes, Network, Apps, and AI"
description: "A tour of my homelab — a handful of low-power Proxmox nodes across two continents, a UniFi network, the self-hosted apps I run, and the AI infrastructure I've built on top."
date: 2026-09-03
tags: ["homelab", "proxmox", "unifi", "tailscale", "docker", "self-hosting", "home assistant", "ai"]
published: true
heroImage: ../../assets/images/dell-micro-stack.jpg
heroImageAlt: A small stack of compact desktop PCs
---

My homelab started in 2023 with a few low-power boxes. It's grown since — but it hasn't changed philosophy. It's still built on small mini PCs instead of rack-mount enterprise hardware. What's changed is how much the fleet now does: my own UniFi network with real VLANs, a handful of Proxmox nodes spread across two continents, a mesh VPN connecting all of it, a pile of self-hosted apps, and an AI layer that runs my coding agents for me.

This is the 2026 overview.

## Approach

- Small, low-power compute nodes instead of one big server
- A few Proxmox nodes across the UK and South Africa
- One private mesh network (Tailscale) covering every machine
- A UniFi network at home with segmented VLANs
- Cloudflare Tunnel for the small set of services that need to be public
- Cloud storage as the backup edge

## Compute: a handful of Proxmox nodes

Nothing exotic — every node is a low-power desktop mini PC running Proxmox VE. They're cheap, quiet, and sip power, and there are enough of them that losing any one box isn't an incident.

- **The main node at home.** Hosts the Docker workhorse — a VM running most of my containerised services and the control point for the whole fleet — plus my home automation instance and file sync.
- **The coding node at home.** Dev VMs and app servers, including my coding-agent setup and a local database for development.
- **A node at family in South Africa.** Runs their home automation and a small Docker VM, and acts as a Tailscale exit node — a stable route home from anywhere.
- **A couple of small cloud VMs** for the things that need a fixed public presence (a database and a voice server).
- **An old NAS at my parents' place** for family file storage and backups.

## Network: UniFi + Tailscale + Cloudflare

### UniFi at home

My network is UniFi, with a **UDM Pro** as the control centre. A couple of access points cover the house, and everything — Wi-Fi, smart-home devices, cameras, guests, and the homelab itself — sits on its own VLAN so devices only talk to what they actually need to. Two WAN connections give me automatic failover, and there's a single place to see every device and block what shouldn't be there.

### Tailscale as the backbone

The clever bit is how the whole fleet is glued together: **Tailscale**. Every node — the Proxmox hosts, VMs, cloud servers, my laptop, my phone — lives on one private mesh network. Services bind to tailnet addresses rather than the public internet, and the exit node in South Africa gives me (and family) a reliable way to reach everything from anywhere.

### Cloudflare Tunnel for the public side

Anything that genuinely needs to be reachable from the internet goes through a **Cloudflare Tunnel**, so no ports are opened on the home router. Public hostnames terminate on the tunnel and reach the apps internally, with Cloudflare Access in front of anything sensitive.

## Apps running

One Docker VM runs the bulk of my services. The standouts:

| App | What it does |
| --- | --- |
| **Homarr** | dashboard landing page for the lab |
| **n8n** | workflow automation between services |
| **Forgejo** | self-hosted Git |
| **Prefect** | scheduled data pipelines for my personal and finance data |
| **Syncthing** | real-time sync of my notes vaults |
| **ntfy** | self-hosted push notifications |
| **Uptime Kuma** | uptime monitoring across the fleet |
| **Beszel** | lightweight resource monitoring |
| **Wiki.js** | internal documentation |
| **IT-Tools** | the everyday utilities |

A cloud VM hosts the database that the pipelines feed into, plus the voice server.

## AI infrastructure

This is the part that's grown the most. I've built a small AI layer across the fleet:

**Coding agents from anywhere.** The heart of this is **T3 Code** — a self-hosted coding server that powers an iOS app. It runs on a couple of machines on the tailnet, so there's always one reachable and the app can talk to whichever is available. That means I can delegate coding work to my real infrastructure from my phone, wherever I am. Both instances carry the usual provider CLIs — Claude Code, Codex, OpenCode Go — all authenticated locally.

**Persistent remote-control agents.** Claude Code and Codex run as always-on services across a few nodes, so sessions survive reboots and disconnects. Effectively a set of on-call coding agents I can call on at any time.

**A contained agent for family.** On the South Africa node there's a locked-down agent that works only inside a shared family notes vault — scoped by filesystem and firewall rules so it can never reach the rest of the network.

**An AI routing policy.** Instead of one model doing everything, I route work deliberately: one agent orchestrates and owns the final answer; a cheaper model handles bulk work; and harder models are the escalation path for high-risk changes. Everything auto-updates on a schedule.

## Storage and backup

- Every VM is snapshotted weekly and pushed to cloud storage.
- The NAS at my parents' place mirrors the family laptops and pushes a weekly copy to the cloud.
- My notes vaults sync live, with a version-controlled weekly backup.
- Disk health is monitored continuously on the storage boxes.

## Home automation

Home Assistant runs on its own VM and has become the thing the family actually notices. A Zigbee coordinator handles the wireless sensors and switches, Matter covers the newer smart-home gear, and a HomeKit bridge selectively exposes the useful stuff to Apple Home — the climate control, the appliances, the sensors, and the TVs.

## Why it works

The same reasons as 2023, just scaled up:

- **Low-power nodes, not one big server** — reliable without enterprise hardware or enterprise power bills.
- **A mesh VPN as the backbone** — Tailscale makes remote access a solved problem, and exit nodes turn family machines into part of my network.
- **Cloudflare as the edge** — public services without poking holes in the home firewall.
- **Segmented networking** — VLANs keep IoT, cameras, guests, and servers apart, manageable from one controller.
- **AI as infrastructure** — the agents, watchdogs, and routing policy have turned my homelab into a place that actively builds things, not just hosts them.