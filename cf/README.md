# cf

Cloudflare preferred-IP speed test helper.

## Purpose

Finds low-latency Cloudflare IPs for use in the `ip1`-`ip13` variables or client configs, grouped by US, Asia and Europe.

## Files

| File | Role |
| :--- | :--- |
| `cf.sh` | Interactive launcher (IPv4 / IPv6 / both / reset). |
| `amd64`, `arm64` | Prebuilt test binaries picked by CPU architecture. |
| `ips-v4.txt`, `ips-v6.txt` | Cloudflare IP ranges to scan. |
| `locations.json` | Data-center code to region/city mapping used to group results. |

## Usage

```
bash cf.sh
```

Choose 1 (IPv4), 2 (IPv6), 3 (both), 4 (reset downloaded files) or 5 (exit). The top 3 results per region are printed.

## Dependencies

- Linux, `bash`, `curl`, `awk`.
- Missing helper files are downloaded from the upstream repository on first run.

## Notes

- Turn off any proxy before testing, or results will be wrong.
- Results depend on your ISP; re-run from the network you will actually use.
- Reset (option 4) deletes the binary, data files and `cf.sh` itself.
