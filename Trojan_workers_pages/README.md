# Trojan_workers_pages

Trojan proxy script for Cloudflare Workers and Pages.

## Purpose

Runs a Trojan-over-WebSocket node on Cloudflare. It serves a bilingual (fa/en) info page with share links and subscriptions at `https://<domain>/<password>`.

## Files

| File | Role |
| :--- | :--- |
| `_worker.js` | Obfuscated build. **This is the file to deploy.** |
| `_worker明.js` | Readable reference build with the same logic. |

## Usage

Deployment and the info page work exactly as in [Vless_workers_pages](../Vless_workers_pages/README.md#usage), with the password in place of the uuid.

## Variables

| Name | Purpose |
| :--- | :--- |
| `pswd` | Node password (replaces `uuid` from the VLESS script). |
| `proxyip`, `ip1`-`ip13`, `pt1`-`pt13`, `cdnip` | Same meaning as in the VLESS script. |

Full table: [main README](../README.md#2-variables-you-can-set-for-cf-trojan-nodes).

## Dependencies

- Cloudflare Workers runtime with `cloudflare:sockets`.
- Optional for rebuilding: `javascript-obfuscator`.

## Notes

- The default password `trojan` is shared publicly; set your own.
- Rebuild example: `javascript-obfuscator "Trojan_workers_pages/_worker明.js" --output Trojan_workers_pages/_worker.js`
