**English** | [فارسی](./README.fa.md)

# CF-Workers-CheckSocks5

![demo](./demo.png)

A proxy availability checker built on Cloudflare Workers. The project runs from a single `_worker.js` and supports SOCKS5, HTTP, HTTPS, TURN and SSTP proxy checks, with single and batch checking in the web UI, domain resolution, exit IP information, map display, result filtering and export.

> The current source has no built-in `TOKEN` authentication. Once deployed to a public domain, anyone who can reach it can use the check API. If you need private use, add access control on the Cloudflare side or extend the authentication logic yourself.

## Features

- Supports five proxy protocols: `socks5://`, `http://`, `https://`, `turn://` and `sstp://`.
- Supports proxies without authentication, `username:password` authentication, and IPv4, domain names and bracketed IPv6 addresses.
- TURN checks use the TCP Allocation / CONNECT / ConnectionBind flow, with support for unauthenticated TURN servers and long-term credentials.
- SSTP checks use an HTTPS SSTP handshake and PPP / IPCP link setup, then read exit information through a TCP connection inside PPP.
- Supports single and batch checks; batch mode automatically de-duplicates, resolves domain names and validates concurrently.
- Resolves domain names to A / AAAA records, preferring Cloudflare DoH and falling back to Google DoH.
- Shows proxy exit information, including exit IP, region, ASN, carrier, risk tags and response time.
- Shows the exit location on a Leaflet / OpenStreetMap map.
- Filters results, and copies valid results to the clipboard or exports them as TXT / CSV.
- Supports light and dark themes, history, a visitor counter and a custom footer.
- Bilingual UI: Persian (default, RTL) and English (LTR), switchable from the header.

## Live demo

Demo: <https://check.socks5.cmliussss.net>

## Deployment

The UI texts live in `locales/fa.json` and `locales/en.json`, which are imported by `_worker.js`. Deploy with Wrangler so that these files are bundled together with the Worker; pasting `_worker.js` alone into the dashboard editor no longer works.

### Cloudflare Workers

1. Install Wrangler: `npm install -g wrangler`.
2. Sign in with `wrangler login`.
3. Run `wrangler deploy` in the project root (the existing `wrangler.toml` points to `_worker.js`).
4. Open the Worker domain to use the checker page.

### Cloudflare Pages

Make sure the deployment root contains `_worker.js` and the `locales/` directory, and deploy with `wrangler pages deploy .` so that the imported locale files are bundled into the Pages Worker entry.

There is no extra build step, and the project does not depend on a `package.json`.

## Environment variables

The current source only reads the following environment variable:

| Name | Description | Example | Required |
| --- | --- | --- | --- |
| `BEIAN` | Custom page footer HTML. When unset, the default footer is used, containing the project link, the visitor count and the maintainer link. A custom footer is shown as-is and is not translated. | `© 2026 Example.com · ICP number` | No |

## Supported proxy formats

```text
socks5://host:1080
socks5://username:password@host:1080
socks5://username:password@[2001:db8::1]:1080
http://host:80
http://username:password@host:80
https://host:443
https://username:password@host:443
turn://host:3478
turn://username:password@host:3478
sstp://host:443
sstp://username:password@host:443
```

When the web UI input has no protocol prefix, `socks5://` is assumed. Default ports:

| Protocol | Default port |
| --- | --- |
| `socks5` | `1080` |
| `http` | `80` |
| `https` | `443` |
| `turn` | `3478` |
| `sstp` | `443` |

### TURN support notes

A `turn://` target is checked as a TURN-over-TCP server. The Worker first connects to the TURN server, then reaches `www.iplocate.io:443` through the TURN TCP relay, and finally reads the exit IP information.

The current TURN implementation has these limits:

- Supports RFC 6062 style TCP Allocation, CreatePermission, CONNECT and ConnectionBind.
- Supports unauthenticated servers. If the server returns a `401` authentication challenge and the link provides `username:password`, the handshake continues with long-term credential authentication.
- The exit-check address is resolved to IPv4 before the TURN CONNECT is issued. TURN UDP relay is not used, and `turns://` is not supported.
- The host in `turn://` can be an IP or a domain name; when the port is omitted, `3478` is used.

### SSTP support notes

An `sstp://` target is checked as an SSTP-over-TLS server. The Worker first establishes the SSTP HTTP tunnel, completes PPP / IPCP negotiation, then builds a TCP connection inside PPP to `www.iplocate.io:443`, and finally reads the exit IP information.

The current SSTP implementation has these limits:

- Supports unauthenticated SSTP servers. If PPP negotiation requires authentication, only PAP is supported, using the `username:password` from the link.
- The exit-check address is resolved to IPv4 before the TCP connection inside PPP is established; SSTP checks currently depend on the server assigning an IPv4 address.
- The host in `sstp://` can be an IP or a domain name; when the port is omitted, `443` is used.

## API

All JSON endpoints carry CORS response headers and support `OPTIONS` preflight requests.

### `GET /check`

Checks whether a single proxy is usable. The Worker opens a connection to `www.iplocate.io` through the proxy and reads the exit IP information returned by that service.

The request parameters can be written in the following ways:

```text
/check?socks5=proxy.example.com:1080
/check?http=proxy.example.com:80
/check?https=proxy.example.com:443
/check?turn=turn.example.com:3478
/check?sstp=vpn:vpn@vpn205396913.opengw.net:1922

/check?proxy=socks5://user:pass@proxy.example.com:1080
/check?proxy=http://proxy.example.com:80
/check?proxy=https://proxy.example.com:443
/check?proxy=turn://user:pass@turn.example.com:3478
/check?proxy=sstp://vpn:vpn@vpn890321947.opengw.net:1630
/check/proxy=socks5://proxy.example.com:1080
```

Example response:

```json
{
  "candidate": "proxy.example.com:1080",
  "type": "socks5",
  "username": null,
  "password": null,
  "hostname": "proxy.example.com",
  "port": 1080,
  "link": "socks5://proxy.example.com:1080",
  "success": true,
  "responseTime": 523,
  "exit": {
    "ip": "203.0.113.10",
    "rir": "APNIC",
    "is_datacenter": true,
    "is_proxy": false,
    "is_vpn": false,
    "asn": {
      "asn": 64500,
      "org": "Example Network"
    },
    "location": {
      "country": "Japan",
      "country_code": "JP",
      "city": "Tokyo",
      "latitude": 35.6895,
      "longitude": 139.6917
    }
  }
}
```

On failure, the response contains `success: false` and an `error` field.

### `GET /resolve`

Resolves a domain name or proxy link into a list of checkable `host:port` entries.

Parameter aliases:

- `proxyip`
- `target`
- `host`

Example:

```bash
curl "https://your-worker.example.workers.dev/resolve?proxyip=socks5://proxy.example.com:1080"
```

Example response:

```json
[
  "198.51.100.10:1080",
  "[2001:db8::10]:1080"
]
```

Resolution rules:

- If the input is already an IPv4 or IPv6 address, the original target and port are returned as-is.
- If the input is a domain name, its A / AAAA records are resolved.
- When no port is given, the resolve endpoint defaults to `443`.

### `POST /resolve-batch`

Resolves targets in bulk, up to `50` per request.

The request body accepts `targets` or `proxyips`:

```json
{
  "targets": [
    "socks5://proxy-a.example.com:1080",
    "proxy-b.example.com:1080"
  ]
}
```

Example response:

```json
{
  "results": [
    {
      "input": "proxy-b.example.com:1080",
      "targets": [
        "198.51.100.20:1080"
      ]
    }
  ]
}
```

## Using the web UI

1. Open the deployed Worker domain.
2. Enter a proxy link, `IP:port`, `domain:port` or an authenticated proxy address in the input box.
3. For batch checking, turn on "Batch check" and paste multiple lines of targets.
4. Click "Start checking".
5. When the check finishes, filter by all / valid / failed / risk rating, protocol and country or region, and export the valid results.

You can also trigger a single check directly through the URL path:

```text
https://your-worker.example.workers.dev/socks5://proxy.example.com:1080
```

## Runtime parameters

Main limits and timeouts in the source:

| Parameter | Current value | Description |
| --- | --- | --- |
| `CHECK_TIMEOUT_MS` | `12000` | Total timeout for a single proxy check |
| `CONNECT_TIMEOUT_MS` | `9999` | Proxy connection and handshake timeout |
| `READ_TIMEOUT_MS` | `8000` | Timeout for reading the remote response |
| `MAX_RESPONSE_BYTES` | `96 KiB` | Maximum bytes read from the exit information response |
| `RESOLVE_BATCH_LIMIT` | `50` | Maximum targets per batch resolve request |
| Frontend check concurrency | `32` | Concurrency of batch checks in the web UI |

## Notes

- The TCP socket capability of Cloudflare Workers is provided by `cloudflare:sockets`; make sure your deployment environment supports outbound Workers TCP connections.
- The check logic tunnels through the proxy to `www.iplocate.io`, so the result reflects the proxy's availability and exit information when reaching that target service.
- TURN checks require the TURN server to support TCP relay / CONNECT; TURN services that only support UDP relay will fail the check.
- SSTP checks require the server to support SSTP over TLS, PPP / IPCP and IPv4 assignment; only PAP authentication is supported, not other PPP methods such as MS-CHAP.
- Be careful with real proxy credentials on a public deployment; the page and API currently have no access token protection.
- Large batch checks may be affected by Cloudflare Workers execution time, concurrency limits and the availability of external DNS / APIs.

## License

This project is released under the [GNU General Public License v3.0](./LICENSE).

## Open-source references

- [CF-Workers-HTTPS](https://github.com/ToiCF/CF-Workers-HTTPS)
- [CF-Workers-TURN](https://github.com/ToiCF/CF-Workers-TURN)
- [CF-Workers-SoftEther](https://github.com/ToiCF/CF-Workers-SoftEther)

## Acknowledgements

- [@Alexandre_Kojeve](https://t.me/Alexandre_Kojeve)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [iplocate.io](https://www.iplocate.io/)
- [Cloudflare DNS](https://cloudflare-dns.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Leaflet](https://leafletjs.com/)
