---
title: "My Homelab in 2026: Nodes, Network, Apps, and AI"
description: "A tour of my homelab — four Proxmox nodes across two continents, a UniFi network with proper VLANs, the self-hosted apps I run, and the AI infrastructure I've built on top."
date: 2026-09-03
tags: ["homelab", "proxmox", "unifi", "tailscale", "docker", "self-hosting", "home assistant", "ai"]
published: true
heroImage: ../../assets/images/dell-micro-stack.jpg
heroImageAlt: Three Dell OptiPlex Micro nodes stacked on a shelf
---

My homelab started in 2023 with a few low-power boxes. It's grown since — but it hasn't changed philosophy. It's still built on small Dell OptiPlex micros instead of rack-mount enterprise hardware. What's changed is how much the fleet now does: my own UniFi network with real VLANs, four Proxmox nodes spread across two continents, a mesh VPN connecting all of it, a pile of Docker services, and an AI layer that runs my coding agents for me.

This is the 2026 overview.

## Approach

- Small, low-power compute nodes instead of one big server
- Four Proxmox nodes across the UK and South Africa
- One private mesh network (Tailscale) covering every machine
- A UniFi network at home with segmented VLANs
- Cloudflare Tunnel for the small set of services that need to be public
- Google Drive as the backup edge for the Proxmox nodes

## Compute: four Proxmox nodes

All four run Proxmox VE 9. All four are Dell OptiPlex micros — small, quiet, low-power, reliable.

| Node | Location | Hardware | Job |
| --- | --- | --- | --- |
| `pve1host-uk` | UK, with me | Dell OptiPlex 7040 · i7-6700T · 32 GB | Main homelab: Docker VM, Home Assistant, Syncthing, Scrypted |
| `pve2host-uk` | UK, with me | Dell OptiPlex 7040 · i7-6700T · 32 GB | Coding VM + Windows 11 VM |
| `pve4host-sa` | Jeffreys Bay, parents | Dell OptiPlex 3050 · i7-6700 · 16 GB | Parents' Home Assistant + Docker VM, Tailscale exit node |
| `pve3host-sa` | Bloemfontein, at Johan | Dell OptiPlex 3050 · i7-6700 · 24 GB | DStv Tailscale exit node (currently offline) |

### pve1host-uk — the main node

Hosts the Docker workhorse `pve1docker`, a Ubuntu VM that runs most of my containerised services and acts as the primary controller for the whole fleet. Also runs the primary Home Assistant, a Syncthing container for my Obsidian vaults, and Scrypted for camera/HomeKit streaming.

### pve2host-uk — the coding node

Hosts `pve2code`, my Ubuntu coding VM (T3 Code server, local Postgres for app development) and a Windows 11 VM that I keep powered off to save energy.

### pve4host-sa — the parents' node

Runs my parents' Home Assistant, a small Docker VM that hosts the family business vault (shared with them over Syncthing), and advertises itself as a Tailscale exit node — which is how I watch regional content and keep a safe route home from anywhere.

### Around the fleet

- **Hetzner cloud VM** — Ubuntu 24.04 with PostgreSQL (the Garmin + finance data warehouse) and a Mumble voice server.
- **Oracle cloud VM** — currently unreachable; the SSH access is being recovered.
- **HP ProLiant MicroServer** at my parents — the NAS/storage box, running Syncthing mirrors of family laptops with a weekly Google Drive backup and SMART disk monitoring.
- **GoFlix** — a managed Plex/media account on Ultra.cc, with Deluge and automated media cleanups.
- **Raspberry Pi** — an old tailnet member, kept on the weekly maintenance rotation.

## Network: UniFi + Tailscale + Cloudflare

### UniFi at home

My own network is UniFi, with a **UDM Pro** as the control centre. Right now it manages about 46 clients across a USW Lite 8 PoE switch, a U6 Enterprise access point, and a U6 Lite on the stairs. Two WAN connections for failover, a WireGuard network for remote users, and a single place to see every device and block what shouldn't be there.

The network is split into VLANs so devices only talk to what they need to:

| Network | VLAN | Subnet | Purpose |
| --- | ---: | --- | --- |
| VL1 Core | untagged | `192.168.1.1/24` | main trusted devices |
| VL2 Wifi | 2 | `192.168.2.1/24` | wireless clients |
| VL3 IOT | 3 | `192.168.3.1/24` | smart-home devices, rate-limited |
| VL4 Cameras | 4 | `192.168.4.1/24` | camera segment |
| VL50 Guests | 50 | `192.168.50.1/24` | guest access |
| VL100 Homelab | 100 | `192.168.100.1/25` | server and homelab segment |

The clever bit is the way the whole fleet is glued together: **Tailscale**. Every node — Proxmox hosts, VMs, cloud servers, my laptop, my phone — is on one private tailnet. Services bind to tailnet addresses, not the public internet, and the exit nodes in South Africa give family members a stable path home (and me a reliable way to reach everything from anywhere).

### Cloudflare Tunnel for the public side

Anything that genuinely needs to be reachable from the internet goes through a **Cloudflare Tunnel** — so no ports are opened on the home router. Public hostnames like `ntfy.danienell.com`, `family.danienell.com` (my genealogy platform), `n8n.danienell.com`, and `git.danienell.com` terminate on the tunnel and reach Docker containers internally. Cloudflare Access sits in front of the sensitive ones.

## Apps running

`pve1docker` runs the bulk of my containers under `/srv/docker`. The standouts:

| App | What it does |
| --- | --- |
| **Homarr** | dashboard landing page for the lab |
| **n8n** | workflow automation |
| **Forgejo** | self-hosted Git |
| **Prefect** | data orchestration — the Xero and Garmin ETL pipelines |
| **Gramps Web** | family genealogy, behind Cloudflare Access |
| **ntfy** | self-hosted push notifications, 30-day archive |
| **Uptime Kuma** | uptime monitoring across the fleet |
| **Beszel** | lightweight resource monitoring |
| **Syncthing** | real-time sync for my Obsidian vaults |
| **13ft**, **IT-Tools** | the small utilities |
| **wiki.js**, **Bookstack** | documentation |
| **Homebridge** | (retired — Home Assistant replaced it) |

On the cloud side, Hetzner runs the PostgreSQL data warehouse that Prefect feeds — Garmin health data, activity telemetry, and the Xero finance pipeline — plus the Mumble server. The GoFlix media account handles Plex and the download pipeline.

## AI infrastructure

This is the part that's grown the most. I've built a small AI layer across the fleet:

**T3 Code servers.** I run two T3 Code instances (on `pve1docker` and `pve2code`), each bound to a tailnet-only address on port 3773. That's what powers the T3 iOS app — it lets me work on code from my phone against real infrastructure. Both instances carry the provider CLIs: Claude Code, Codex, and OpenCode Go, all authenticated locally.

**Persistent remote-control agents.** Claude Code runs as a `systemd` + tmux service on several nodes so sessions survive reboots and SSH disconnects. The fleet also runs standalone Codex with two-minute watchdog daemons on the controller and the Hetzner VM — effectively always-on coding agents I can call on.

**A contained agent for family.** On the parents' node, my father runs his own Claude Code session against a shared Obsidian vault — as a dedicated `nn-agent` user, locked down with filesystem ACLs and iptables rules so it can only reach that vault, never the rest of the network.

**An AI routing policy.** Instead of one model doing everything, I route work deliberately: Codex orchestrates and owns the final answer; OpenCode Go handles cheap bulk work; Claude Sonnet does substantial coding; Opus is the escalation model for high-risk changes. Everything is auto-updated every three days.

## Storage and backup

- Every Proxmox VM is snapshotted weekly and pushed to Google Drive via rclone (keep-last 3).
- The HP MicroServer at my parents mirrors the family laptops to disk and pushes the `Storage` share to Google Drive every Sunday.
- My Obsidian vaults sync live through Syncthing, with a version-controlled weekly Git backup.
- SMART monitoring runs continuously on all three MicroServer disks.

## Home automation

Home Assistant runs on its own HAOS VM, and it's become the thing the family actually notices. Zigbee2MQTT with an SMLIGHT SLZB-06Mu coordinator handles the Zigbee devices; Matter handles the SONOFF air-quality monitors and Meross plugs; and a HomeKit bridge selectively exposes the safe stuff to Apple Home — the air conditioners, the tumble dryer, the smoke/CO alarm, the air purifier, and the kitchen and bedroom TVs.

## Why it works

The same reasons as 2023, just scaled up:

- **Low-power nodes, not one big server** — reliable without enterprise hardware or enterprise power bills.
- **A mesh VPN as the backbone** — Tailscale makes remote access a solved problem, and exit nodes turn family machines into part of my network.
- **Cloudflare as the edge** — public services without poking holes in the home firewall.
- **Segmented networking** — VLANs keep IoT, cameras, guests, and servers apart, and it's all manageable from one UniFi controller.
- **AI as infrastructure** — the agents, watchdogs, and routing policy have turned my homelab into a place that actively builds things, not just hosts them.