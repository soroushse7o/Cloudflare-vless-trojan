# Vless_workers_pages

VLESS proxy script for Cloudflare Workers and Pages.

## Purpose

Runs a VLESS-over-WebSocket node on Cloudflare. It also serves a bilingual (fa/en) info page with share links and subscriptions at `https://<domain>/<uuid>`.

## Files

| File | Role |
| :--- | :--- |
| `_worker.js` | Bilingual (fa/en) build for **Pages**. **This is the file to deploy.** |
| `_worker-manual.js` | Same bilingual code, used for **Workers**. Keep it identical to `_worker.js`. |
| `File-notes.txt` | Short bilingual notes and tutorial video links. |

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
- None. Both files are plain readable JavaScript (no obfuscation step).

## Notes

- Workers mode needs a custom domain for TLS nodes; Pages mode supports TLS nodes only.
- The info page switches between Persian (RTL) and English (LTR); browsers with a Persian locale open in Persian.
- After editing `_worker-manual.js`, copy it over `_worker.js` so Pages and Workers stay identical.
- Keep the default shared `uuid` only for testing; set your own.

## Runtime region

`wrangler.workers.toml` sets a Placement Hint (`[placement] region = "azure:norwayeast"`) so the Worker runs in the Cloudflare data center closest to Azure Norway East. Deploy with `npx wrangler deploy -c wrangler.workers.toml`. In the dashboard, set the same under Worker Settings > Placement, if the region option is shown. Change the region value in the file to use another cloud region.

## Default preferred address

All built-in preferred addresses (`CDNIP` and `IP1`-`IP13` at the top of the script) are set to `tiny-waterfall-5581.soroushsevo1.workers.dev`. Override them with the `cdnip` and `ip1`-`ip13` variables, or edit the values in both `_worker.js` and `_worker-manual.js`.
