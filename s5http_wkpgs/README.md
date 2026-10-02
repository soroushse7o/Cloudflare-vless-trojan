# s5http_wkpgs

Local Socks5/HTTP proxy that tunnels through a Cloudflare Worker or Pages deployment.

## Purpose

Two halves of one setup: a server-side Worker (`_worker.js`) and a client-side installer (`cfsh.sh`) that runs a prebuilt local proxy binary.

## Files

| File | Role |
| :--- | :--- |
| `_worker.js` | Server side. Deploy to Cloudflare Workers/Pages. |
| `cfsh.sh` | Client-side menu: add, inspect, delete, uninstall nodes. |
| `linux-amd64`, `linux-arm64` | Prebuilt client binaries downloaded by `cfsh.sh`. |

## Usage

1. Deploy `_worker.js`. Edit `pyip` (custom ProxyIP) and `token` (optional shared secret) at the top.
2. On the client machine run `bash cfsh.sh` and choose **Add a node**.
3. Point apps at the local Socks5/HTTP port (default `30000`).

Prompt values (`cf_domain`, `token`, `client_ip`, `cf_cdnip`, `pyip`, `dns`, `enable_ech`, `cnrule`) and the three TLS modes are tabulated in the [main README](../README.md#method-2-cloudflare-sockshttp-local-proxy-script).

## Dependencies

- Linux with `curl`; systemd or OpenWrt-style init for service management.
- CPU: amd64, arm64 (the script also maps 386/arm/mips names, but no binaries for them are shipped here).
- Docker image alternative: `ygkkk/cfsh`.

## Notes

- `token` must match on server and client.
- `cfsh.sh` filters the binary's own log lines with Chinese search patterns; these are functional and must not be translated.
- Nodes are installed under `$HOME/cfs5http` and run as `cf_<port>` services.
