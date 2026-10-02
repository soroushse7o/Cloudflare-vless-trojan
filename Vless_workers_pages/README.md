# Vless_workers_pages

VLESS proxy script for Cloudflare Workers and Pages.

## Purpose

Runs a VLESS-over-WebSocket node on Cloudflare. It also serves a bilingual (fa/en) info page with share links and subscriptions at `https://<domain>/<uuid>`.

## Files

| File | Role |
| :--- | :--- |
| `_worker.js` | Obfuscated build. **This is the file to deploy.** |
| `_worker明.js` | Readable reference build with the same logic. Edit this one, then re-obfuscate. |
| `文件使用说明.txt` | Short bilingual notes and tutorial video links. |

## Usage

1. Create a Worker or a Pages project and upload/paste `_worker.js`.
2. Set the variables below (all optional; defaults work).
3. Open `https://<domain>/<uuid>` to get the node link and subscriptions.

Step-by-step deployment: see the [deployment guide](../‎⁨راهنمای-کامل-دپلوی-و-تنظیمات⁩.md) (Persian) and the variable tables in the [main README](../README.md#1-variables-you-can-set-for-cf-vless-nodes).

## Variables

| Name | Purpose |
| :--- | :--- |
| `uuid` | User ID of the node. |
| `proxyip` | Reverse-proxy IP used to reach Cloudflare-hosted sites. |
| `ip1`-`ip13`, `pt1`-`pt13` | Preferred IPs and ports for subscription output. |
| `cdnip` | Default preferred domain. |

Rules for `ip`/`pt` pairs are documented once in the main README.

## Dependencies

- Cloudflare Workers runtime with the `cloudflare:sockets` module.
- Optional for rebuilding the obfuscated file: `javascript-obfuscator` (Node.js).

## Notes

- Workers mode needs a custom domain for TLS nodes; Pages mode supports TLS nodes only.
- The info page switches between Persian (RTL) and English (LTR); browsers with a Persian locale open in Persian.
- Rebuild example: `javascript-obfuscator "Vless_workers_pages/_worker明.js" --output Vless_workers_pages/_worker.js`
- Keep the default shared `uuid` only for testing; set your own.
