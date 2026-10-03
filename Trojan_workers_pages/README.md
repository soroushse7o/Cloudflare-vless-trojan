# Trojan_workers_pages

Trojan proxy script for Cloudflare Workers and Pages.

## Purpose

Runs a Trojan-over-WebSocket node on Cloudflare. It serves a bilingual (fa/en) info page with share links and subscriptions at `https://<domain>/<password>`.

## Files

| File | Role |
| :--- | :--- |
| `_worker.js` | Bilingual (fa/en) build for **Pages**. **This is the file to deploy.** |
| `_worker-manual.js` | Same bilingual code, used for **Workers**. Keep it identical to `_worker.js`. |

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
- None. Both files are plain readable JavaScript (no obfuscation step).

## Notes

- The default password `trojan` is shared publicly; set your own.
- After editing `_worker-manual.js`, copy it over `_worker.js` so Pages and Workers stay identical.

## Runtime region

`wrangler.workers.toml` sets a Placement Hint (`[placement] region = "azure:westeurope"`) so the Worker runs in the Cloudflare data center closest to Azure West Europe. Deploy with `npx wrangler deploy -c wrangler.workers.toml`. In the dashboard, set the same under Worker Settings > Placement, if the region option is shown. Change the region value in the file to use another cloud region.

## Default preferred address

All built-in preferred addresses (`CDNIP` and `IP1`-`IP13` at the top of the script) are set to `tiny-waterfall-5581.soroushsevo1.workers.dev`. Override them with the `cdnip` and `ip1`-`ip13` variables, or edit the values in both `_worker.js` and `_worker-manual.js`.
