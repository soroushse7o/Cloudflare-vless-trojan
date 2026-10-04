// =====================================================================
//  Personalized & hardened Cloudflare Worker script (Iran-oriented)
//  Env vars (all optional, same names as the original script):
//    uuid      one or more comma-separated UUIDs (first one is used for links)
//    proxyip   one or more comma-separated  host[:port]  /  [ipv6]:port
//    cdnip     optional, address used in the single-node links (default: the worker's own host)
//    ip1..ip13 / pt1..pt13   preferred addresses / ports for the sub nodes. ip1-7 = non-TLS, ip8-13 = TLS.
//                            No defaults in code: a slot without ipN is skipped, a missing ptN = 80 (non-TLS) / 443 (TLS).
//    doh       DNS-over-HTTPS endpoint used for UDP/53
//    decoy     hostname to reverse-proxy for unknown paths (default: nginx-style 404)
// =====================================================================
// @ts-ignore
import { connect } from "cloudflare:sockets";

// Protocol name kept escaped (same trick as the original) so the literal word is not in the source.
const P = "\u0076\u006c\u0065\u0073\u0073";

// !!! CHANGE THIS (or set env.uuid). Generate: crypto.randomUUID() in any browser console.
const DEFAULT_UUID = "5b9f3c1e-7a42-4d6b-9e08-2c1d4f7a8b30";

// Reverse-proxy IPs used on retry (needed to reach Cloudflare-hosted sites). Replace with ones you trust.
const DEFAULT_PROXY_IPS = [
  "146.103.96.115", "188.253.26.217", "146.103.96.238", "146.103.96.50", "103.137.248.227",
  "146.103.96.164", "80.240.141.242", "188.226.163.149", "95.85.42.135", "186.190.213.143",
  "188.166.73.154", "103.137.248.22", "103.137.248.229",
];

const DEFAULT_DOH = "https://cloudflare-dns.com/dns-query";

const WS_OPEN = 1;
const WS_CLOSING = 2;

// ---------------------------------------------------------------- config
function parseHostPort(s, defPort = 443) {
  s = String(s).trim();
  let m = s.match(/^\[(.+)\](?::(\d+))?$/);
  if (m) return { host: m[1], port: Number(m[2] || defPort) };
  m = s.match(/^([^:]+)(?::(\d+))?$/);
  if (m) return { host: m[1], port: Number(m[2] || defPort) };
  return { host: s, port: defPort }; // bare ipv6
}

function loadConfig(env) {
  const uuids = String(env.uuid || DEFAULT_UUID).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const proxySrc = env.proxyip ? String(env.proxyip).split(",") : DEFAULT_PROXY_IPS;
  const proxyList = proxySrc.map((s) => s.trim()).filter(Boolean).map((s) => parseHostPort(s));
  const addrs = [], ports = [];
  for (let i = 0; i < 13; i++) {
    addrs.push(String(env[`ip${i + 1}`] || "").trim());
    ports.push(String(env[`pt${i + 1}`] || "").trim());
  }
  return {
    uuids, proxyList, addrs, ports,
    cdnip: String(env.cdnip || "").trim(),
    doh: env.doh || DEFAULT_DOH,
    decoy: env.decoy || "",
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function pickProxy(override, list) {
  if (override) return override;
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

// ---------------------------------------------------------------- entry
export default {
  async fetch(request, env) {
    try {
      const cfg = loadConfig(env);
      if (!cfg.uuids.length || !cfg.uuids.every((u) => UUID_RE.test(u))) {
        return new Response("uuid is not valid", { status: 500 });
      }
      const url = new URL(request.url);
      if (request.headers.get("Upgrade") !== "websocket") {
        return await handleHttp(request, url, cfg);
      }
      // Optional per-connection proxy override:  /pyip=host[:port]
      // (only used after the client authenticates; never touches global state)
      let override = null;
      const i = url.pathname.indexOf("/pyip=");
      if (i !== -1) {
        const v = decodeURIComponent(url.pathname.slice(i + 6));
        if (/^(\[[0-9a-f:.]+\]|[a-z0-9.-]+)(:\d{1,5})?$/i.test(v)) override = parseHostPort(v);
      }
      return await wsHandler(request, cfg, override);
    } catch (err) {
      console.error(err);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

// ---------------------------------------------------------------- plain HTTP side
const ROUTES = {
  ty: ["all", "share"], cl: ["all", "clash"], sb: ["all", "singbox"],
  pty: ["tls", "share"], pcl: ["tls", "clash"], psb: ["tls", "singbox"],
};

async function handleHttp(request, url, cfg) {
  const host = url.hostname;
  const uuid = cfg.uuids[0];
  const base = `/${uuid}`;
  const p = url.pathname;
  const ok = (body, type = "text/plain") =>
    new Response(body, { status: 200, headers: { "Content-Type": `${type};charset=utf-8` } });

  if (p === base) return ok(renderPage(cfg, host), "text/html");
  if (p.startsWith(base + "/")) {
    const key = p.slice(base.length + 1);
    if (Object.prototype.hasOwnProperty.call(ROUTES, key)) {
      const [scope, kind] = ROUTES[key];
      const nodes = buildNodes(cfg, host, scope === "tls");
      if (kind === "share") return ok(shareSub(nodes, uuid, host));
      if (kind === "clash") return ok(clashConfig(nodes, uuid, host));
      return ok(singboxConfig(nodes, uuid, host), "application/json");
    }
  }

  // Unknown path: optional decoy reverse-proxy, otherwise a boring nginx-style 404.
  if (cfg.decoy && (request.method === "GET" || request.method === "HEAD")) {
    const r = await fetch("https://" + cfg.decoy + url.pathname + url.search, {
      method: request.method,
      headers: { "user-agent": request.headers.get("user-agent") || "Mozilla/5.0" },
      redirect: "manual",
    });
    if (r.status >= 300 && r.status < 400) return notFound();
    return r;
  }
  return notFound();
}

function notFound() {
  return new Response(
    "<html>\r\n<head><title>404 Not Found</title></head>\r\n<body>\r\n<center><h1>404 Not Found</h1></center>\r\n<hr><center>nginx</center>\r\n</body>\r\n</html>\r\n",
    { status: 404, headers: { "content-type": "text/html" } }
  );
}

// ---------------------------------------------------------------- nodes / subscriptions
// Nodes come ONLY from the ip1..ip13 / pt1..pt13 variables (slots 1-7 = non-TLS, 8-13 = TLS).
// A slot without ipN is skipped; a missing ptN falls back to 80 (non-TLS) / 443 (TLS).
// If a mode ends up with no node at all, the worker's own host is used as a fallback.
function buildNodes(cfg, host, tlsOnly) {
  const all = [];
  for (let i = 0; i < 13; i++) {
    const addr = cfg.addrs[i];
    if (!addr) continue;
    const tls = i >= 7;
    const port = cfg.ports[i] || (tls ? "443" : "80");
    all.push({ name: `CF_V${i + 1}_${addr}_${port}`, addr, port, tls });
  }
  if (!all.some((n) => n.tls)) all.push({ name: `CF_V8_${host}_443`, addr: host, port: "443", tls: true });
  if (!tlsOnly && !all.some((n) => !n.tls)) all.unshift({ name: `CF_V1_${host}_80`, addr: host, port: "80", tls: false });
  return tlsOnly ? all.filter((n) => n.tls) : all;
}

function nodeLink(n, uuid, host) {
  const sec = n.tls ? `tls&sni=${host}` : "none";
  return `${P}://${uuid}@${n.addr}:${n.port}?encryption=none&security=${sec}&fp=randomized&type=ws&host=${host}&path=%2F%3Fed%3D2560#${n.name}`;
}

function shareSub(nodes, uuid, host) {
  return btoa(nodes.map((n) => nodeLink(n, uuid, host)).join("\n"));
}

function clashConfig(nodes, uuid, host) {
  const q = JSON.stringify;
  const names = nodes.map((n) => `    - ${q(n.name)}`).join("\n");
  const proxies = nodes
    .map((n) =>
      [
        `- name: ${q(n.name)}`,
        `  type: ${P}`,
        `  server: ${q(n.addr.replace(/[\[\]]/g, ""))}`,
        `  port: ${n.port}`,
        `  uuid: ${uuid}`,
        `  udp: false`,
        `  tls: ${n.tls}`,
        ...(n.tls ? [`  servername: ${host}`] : []),
        `  network: ws`,
        `  ws-opts:`,
        `    path: "/?ed=2560"`,
        `    headers:`,
        `      Host: ${host}`,
      ].join("\n")
    )
    .join("\n\n");

  return `port: 7890
allow-lan: true
mode: rule
log-level: info
unified-delay: true
global-client-fingerprint: chrome

proxies:
${proxies}

proxy-groups:
- name: Load-Balance
  type: load-balance
  url: http://www.gstatic.com/generate_204
  interval: 300
  proxies:
${names}

- name: Auto-Select
  type: url-test
  url: http://www.gstatic.com/generate_204
  interval: 300
  tolerance: 50
  proxies:
${names}

- name: 🌍Select-Proxy
  type: select
  proxies:
    - Load-Balance
    - Auto-Select
    - DIRECT
${names}

rules:
  - MATCH,🌍Select-Proxy`;
}

function singboxConfig(nodes, uuid, host) {
  const tags = nodes.map((n) => n.name);
  const outbounds = nodes.map((n) => {
    const o = {
      type: P,
      tag: n.name,
      server: n.addr.replace(/[\[\]]/g, ""),
      server_port: Number(n.port),
      uuid,
      packet_encoding: "packetaddr",
      transport: { type: "ws", path: "/?ed=2560", headers: { Host: [host] } },
    };
    if (n.tls) {
      o.tls = { enabled: true, server_name: host, insecure: false, utls: { enabled: true, fingerprint: "chrome" } };
    }
    return o;
  });

  // Intentionally minimal: nodes + selector + tun plumbing only.
  // No DNS section and no routing/region rules - add those in your client.
  const cfg = {
    log: { disabled: false, level: "info", timestamp: true },
    experimental: {
      clash_api: { external_controller: "127.0.0.1:9090", external_ui: "ui", secret: "", default_mode: "Rule" },
      cache_file: { enabled: true, path: "cache.db" },
    },
    inbounds: [
      {
        type: "tun",
        tag: "tun-in",
        address: ["172.19.0.1/30", "fd00::1/126"],
        auto_route: true,
        strict_route: true,
      },
    ],
    outbounds: [
      { tag: "select", type: "selector", default: "auto", outbounds: ["auto", ...tags] },
      ...outbounds,
      { tag: "direct", type: "direct" },
      {
        tag: "auto",
        type: "urltest",
        outbounds: tags,
        url: "https://www.gstatic.com/generate_204",
        interval: "1m",
        tolerance: 50,
        interrupt_exist_connections: false,
      },
    ],
    route: {
      auto_detect_interface: true,
      final: "select",
      rules: [
        { inbound: "tun-in", action: "sniff" },
        { protocol: "dns", action: "hijack-dns" },
      ],
    },
  };
  return JSON.stringify(cfg, null, 2);
}

// ---------------------------------------------------------------- HTML config page
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const bi = (fa, en) => `<span class="fa">${fa}</span><span class="en">${en}</span>`;
const copyBtn = (text) => `<button class="btn btn-primary" data-copy="${esc(text)}">${bi("کپی لینک", "Click to copy link")}</button>`;

const PAGE_SCRIPT = `
(function () {
  var s = null;
  try { s = localStorage.getItem('lang'); } catch (e) {}
  var l = s || (((navigator.language || '').toLowerCase().indexOf('fa') === 0) ? 'fa' : 'en');
  document.documentElement.className = 'lang-' + l;
})();
function toggleLang() {
  var l = document.documentElement.className === 'lang-fa' ? 'en' : 'fa';
  document.documentElement.className = 'lang-' + l;
  try { localStorage.setItem('lang', l); } catch (e) {}
}
function copyText(t) {
  function done() { alert(document.documentElement.className === 'lang-fa' ? 'لینک در کلیپ‌بورد کپی شد' : 'Copied to clipboard'); }
  function fallback() {
    var i = document.createElement('textarea');
    i.style.cssText = 'position:fixed;opacity:0';
    i.value = t;
    document.body.appendChild(i);
    i.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    document.body.removeChild(i);
  }
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(done, fallback);
  else fallback();
}
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-copy]');
  if (b) copyText(b.getAttribute('data-copy'));
});
`;

function linkTable(headHtml, valueHtml, text) {
  return `<table class="table"><thead><tr><th>${headHtml}</th></tr></thead><tbody><tr>${
    valueHtml ? `<td class="limited-width">${esc(valueHtml)}</td>` : ""
  }<td>${copyBtn(text)}</td></tr></tbody></table>`;
}

function renderPage(cfg, host) {
  const uuid = cfg.uuids[0];
  const isWorkers = host.includes("workers.dev");
  const cdn = cfg.cdnip || host;
  const wsLink = `${P}://${uuid}@${cdn}:8880?encryption=none&security=none&type=ws&host=${host}&path=%2F%3Fed%3D2560#${host}`;
  const tlsLink = `${P}://${uuid}@${cdn}:8443?encryption=none&security=tls&type=ws&host=${host}&sni=${host}&fp=random&path=%2F%3Fed%3D2560#${host}`;
  const base = `https://${host}/${uuid}`;
  const allNodes = buildNodes(cfg, host, false);
  const tlsNodes = buildNodes(cfg, host, true);
  const portsOf = (nodes, tls) => nodes.filter((n) => n.tls === tls).map((n) => n.port);
  const httpPorts = portsOf(allNodes, false).join("، ");
  const httpPortsEn = portsOf(allNodes, false).join(", ");
  const httpsPorts = portsOf(allNodes, true).join("، ");
  const httpsPortsEn = portsOf(allNodes, true).join(", ");

  const params = (portsFa, portsEn, tls) => `
<h5>${bi("پارامترهای کلاینت:", "Client parameters:")}</h5>
<ul>
  <li>${bi("آدرس (address): دامنه‌ی سفارشی، دامنه/IP بهینه یا IP پراکسی معکوس", "Address: custom domain, preferred domain/IP, or reverse-proxy IP")}</li>
  <li>${bi("پورت (port): " + portsFa, "Port: " + portsEn)}</li>
  <li>${bi("شناسه‌ی کاربر (uuid):", "User ID (uuid):")} ${esc(uuid)}</li>
  <li>${bi("پروتکل انتقال (network): ws", "Transport (network): ws")}</li>
  <li>${bi("دامنه‌ی پوششی (host):", "Camouflage domain (host):")} ${esc(host)}</li>
  <li>${bi("مسیر (path):", "Path:")} /?ed=2560</li>
  <li>${bi("امنیت انتقال (TLS): " + (tls ? "روشن" : "خاموش"), "Transport security (TLS): " + (tls ? "on" : "off"))}</li>
  ${tls ? `<li>${bi("رد کردن اعتبارسنجی گواهی (allowInsecure): false", "Skip certificate verification (allowInsecure): false")}</li>` : ""}
</ul><hr><br>`;

  const subs = (prefix, nodes) => `
${linkTable(bi("لینک اشتراک‌گذاری تجمیعی (ورود مستقیم به کلاینت):", "Aggregated share link (import directly):"), "", shareSub(nodes, uuid, host))}
${linkTable(bi("لینک اشتراک تجمیعی:", "Aggregated subscription link:"), `${base}/${prefix}ty`, `${base}/${prefix}ty`)}
${linkTable("Clash-meta " + bi("لینک اشتراک:", "subscription link:"), `${base}/${prefix}cl`, `${base}/${prefix}cl`)}
${linkTable("Sing-box " + bi("لینک اشتراک:", "subscription link:"), `${base}/${prefix}sb`, `${base}/${prefix}sb`)}`;

  const note = [
    `${bi("گیت‌هاب پروژه", "Project GitHub")}: https://github.com/soroushse7o`,
    `${bi("ProxyIP های فعال", "Active ProxyIPs")}: ${esc(cfg.proxyList.map((p) => p.host + ":" + p.port).join(" , "))}`,
  ].join("<br>");

  let body;
  if (isWorkers) {
    body = `
<h3>1: CF-workers-${P}+ws ${bi("نود", "node")}</h3>
${linkTable(bi("TLS خاموش است؛ مسدودسازی دامنه را دور می‌زند", "TLS is off; bypasses domain blocking"), wsLink, wsLink)}
${params(httpPorts, httpPortsEn, false)}
<h3>2: CF-workers-${P}+ws+tls ${bi("نود", "node")}</h3>
${linkTable(bi("TLS روشن است. اگر کلاینت از Fragment پشتیبانی می‌کند روشنش کنید", "TLS is on. Enable Fragment if your client supports it"), tlsLink, tlsLink)}
${params(httpsPorts, httpsPortsEn, true)}
<h3>3: ${bi("لینک‌های اشتراک تجمیعی، Clash-meta و Sing-box:", "Aggregated, Clash-meta and Sing-box subscription links:")}</h3>
<p>${bi("هر اشتراک ۱۳ نود (TLS و بدون TLS) دارد. دامنه‌ی workers.dev ممکن است فیلتر باشد؛ برای به‌روزرسانی اشتراک به پراکسی نیاز دارید. بدون پشتیبانی Fragment نودهای TLS کار نمی‌کنند.", "Each subscription has 13 nodes (TLS + non-TLS). workers.dev may be filtered, so updating the subscription may need a proxy. TLS nodes need Fragment support.")}</p>
${subs("", allNodes)}`;
  } else {
    body = `
<h3>1: CF-pages/workers/${bi("دامنه‌ی سفارشی", "custom-domain")}-${P}+ws+tls ${bi("نود", "node")}</h3>
${linkTable(bi("TLS روشن است. اگر کلاینت از Fragment پشتیبانی می‌کند روشنش کنید", "TLS is on. Enable Fragment if your client supports it"), tlsLink, tlsLink)}
${params(httpsPorts, httpsPortsEn, true)}
<h3>2: ${bi("لینک‌های اشتراک تجمیعی، Clash-meta و Sing-box:", "Aggregated, Clash-meta and Sing-box subscription links:")}</h3>
<p>${bi("اشتراک‌های زیر فقط ۶ نود پورت TLS دارند", "The subscriptions below contain only the 6 TLS port nodes")}</p>
${subs("p", tlsNodes)}`;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Proxy</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
<style>
.limited-width { max-width: 200px; overflow: auto; word-wrap: break-word; }
html.lang-fa .en, html.lang-en .fa { display: none; }
html.lang-fa body { direction: rtl; text-align: right; }
html.lang-fa td, html.lang-fa th, html.lang-fa li, html.lang-fa p { unicode-bidi: plaintext; }
#langBtn { position: fixed; top: 8px; right: 8px; z-index: 9999; }
</style>
<script>${PAGE_SCRIPT}</script>
</head>
<body>
<button id="langBtn" class="btn btn-sm btn-outline-secondary" onclick="toggleLang()">فارسی / English</button>
<div class="container"><div class="row"><div class="col-md-12">
<br><br>
<h1>Cloudflare-workers/pages-${P} ${bi("اسکریپت پراکسی", "Proxy Script")}</h1>
<hr><p>${note}</p><hr><br>
${body}
<br><br>
</div></div></div>
</body>
</html>`;
}

// ---------------------------------------------------------------- WebSocket side
async function wsHandler(request, cfg, proxyOverride) {
  // @ts-ignore
  const pair = new WebSocketPair();
  const [client, webSocket] = Object.values(pair);
  webSocket.accept();

  let address = "";
  let portLog = "";
  const log = (info, event) => console.log(`[${address}:${portLog}] ${info}`, event || "");
  const early = request.headers.get("sec-websocket-protocol") || "";
  const readable = makeReadableWebSocketStream(webSocket, early, log);

  const remote = { value: null };
  let udpWrite = null;
  let isDns = false;

  readable
    .pipeTo(
      new WritableStream({
        async write(chunk) {
          if (isDns && udpWrite) return udpWrite(chunk);
          if (remote.value) {
            const w = remote.value.writable.getWriter();
            await w.write(chunk);
            w.releaseLock();
            return;
          }
          const h = parseHeader(chunk, cfg.uuids);
          if (h.hasError) throw new Error(h.message);

          address = h.addressRemote;
          portLog = `${h.portRemote}--${Math.random()} ${h.isUDP ? "udp" : "tcp"}`;
          if (h.isUDP) {
            if (h.portRemote !== 53) throw new Error("UDP proxy only enabled for DNS (port 53)");
            isDns = true;
          }
          const respHeader = new Uint8Array([h.version, 0]);
          const raw = chunk.slice(h.rawDataIndex);

          if (isDns) {
            udpWrite = handleUDPOutBound(webSocket, respHeader, cfg.doh, log).write;
            udpWrite(raw);
            return;
          }
          handleTCPOutBound(remote, h.addressRemote, h.portRemote, raw, webSocket, respHeader, cfg, proxyOverride, log);
        },
        close() { log("readableWebSocketStream is close"); },
        abort(reason) { log("readableWebSocketStream is abort", JSON.stringify(reason)); },
      })
    )
    .catch((err) => log("readableWebSocketStream pipeTo error", err));

  // @ts-ignore
  return new Response(null, { status: 101, webSocket: client });
}

const IPV4_RE = /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;

async function handleTCPOutBound(remote, addr, port, raw, ws, respHeader, cfg, proxyOverride, log) {
  async function connectAndWrite(address, port) {
    // Workers cannot connect() straight to some IPs; sslip.io maps www.<ip>.sslip.io -> <ip>.
    if (IPV4_RE.test(address)) address = `www.${address}.sslip.io`;
    const s = connect({ hostname: address, port: Number(port) });
    remote.value = s;
    log(`connected to ${address}:${port}`);
    const w = s.writable.getWriter();
    await w.write(raw); // first write, normally TLS client hello
    w.releaseLock();
    return s;
  }

  // If the direct socket yields no data (or fails), retry through a reverse-proxy IP.
  async function retry() {
    const p = pickProxy(proxyOverride, cfg.proxyList);
    const s = p ? await connectAndWrite(p.host, p.port) : await connectAndWrite(addr, port);
    s.closed
      .catch((e) => console.log("retry tcpSocket closed error", e))
      .finally(() => safeCloseWebSocket(ws));
    remoteSocketToWS(s, ws, respHeader, null, log);
  }

  try {
    const s = await connectAndWrite(addr, port);
    remoteSocketToWS(s, ws, respHeader, retry, log);
  } catch (e) {
    log("connect failed, retrying via proxy", String(e));
    try { await retry(); } catch (e2) { log("retry failed", String(e2)); safeCloseWebSocket(ws); }
  }
}

function makeReadableWebSocketStream(ws, earlyDataHeader, log) {
  let cancelled = false;
  return new ReadableStream({
    start(controller) {
      ws.addEventListener("message", (event) => {
        if (cancelled) return;
        controller.enqueue(event.data);
      });
      ws.addEventListener("close", () => {
        safeCloseWebSocket(ws);
        if (cancelled) return;
        controller.close();
      });
      ws.addEventListener("error", (err) => {
        log("webSocketServer has error");
        controller.error(err);
      });
      const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
      if (error) controller.error(error);
      else if (earlyData) controller.enqueue(earlyData);
    },
    pull() {},
    cancel(reason) {
      if (cancelled) return;
      log(`ReadableStream was canceled, due to ${reason}`);
      cancelled = true;
      safeCloseWebSocket(ws);
    },
  });
}

const HEX = Array.from({ length: 256 }, (_, i) => (i + 256).toString(16).slice(1));
function bytesToUuid(a) {
  const h = Array.from(a, (b) => HEX[b]).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function parseHeader(buf, uuids) {
  if (!(buf instanceof ArrayBuffer) || buf.byteLength < 24) return { hasError: true, message: "invalid data" };
  const v = new Uint8Array(buf);
  const version = v[0];
  if (!uuids.includes(bytesToUuid(v.subarray(1, 17)))) return { hasError: true, message: "invalid user" };

  const optLen = v[17];
  const cmdIdx = 18 + optLen;
  const cmd = v[cmdIdx];
  let isUDP = false;
  if (cmd === 2) isUDP = true;
  else if (cmd !== 1) return { hasError: true, message: `command ${cmd} is not supported (01-tcp, 02-udp)` };

  const portIdx = cmdIdx + 1;
  const portRemote = (v[portIdx] << 8) | v[portIdx + 1];
  let p = portIdx + 2;
  const type = v[p++];
  let addr = "";
  switch (type) {
    case 1: // ipv4
      addr = Array.from(v.subarray(p, p + 4)).join(".");
      p += 4;
      break;
    case 2: { // domain
      const len = v[p++];
      addr = new TextDecoder().decode(v.subarray(p, p + len));
      p += len;
      break;
    }
    case 3: { // ipv6
      const dv = new DataView(buf, p, 16);
      const parts = [];
      for (let i = 0; i < 8; i++) parts.push(dv.getUint16(i * 2).toString(16));
      addr = parts.join(":");
      p += 16;
      break;
    }
    default:
      return { hasError: true, message: `invalid addressType ${type}` };
  }
  if (!addr) return { hasError: true, message: `addressValue is empty, addressType is ${type}` };
  return { hasError: false, addressRemote: addr, portRemote, rawDataIndex: p, version, isUDP };
}

async function remoteSocketToWS(remoteSocket, ws, respHeader, retry, log) {
  let hasIncomingData = false;
  let header = respHeader;
  await remoteSocket.readable
    .pipeTo(
      new WritableStream({
        async write(chunk, controller) {
          hasIncomingData = true;
          if (ws.readyState !== WS_OPEN) {
            controller.error("webSocket.readyState is not open, maybe close");
            return;
          }
          if (header) {
            ws.send(await new Blob([header, chunk]).arrayBuffer());
            header = null;
          } else {
            ws.send(chunk);
          }
        },
        close() { log(`remote readable closed, hasIncomingData=${hasIncomingData}`); },
        abort(reason) { console.error("remote readable abort", reason); },
      })
    )
    .catch((error) => {
      console.error("remoteSocketToWS exception", error && error.stack ? error.stack : error);
      safeCloseWebSocket(ws);
    });

  if (hasIncomingData === false && retry) {
    log("retry");
    retry().catch((e) => { log("retry failed", String(e)); safeCloseWebSocket(ws); });
  }
}

function base64ToArrayBuffer(b64) {
  if (!b64) return { error: null };
  try {
    b64 = b64.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    return { earlyData: Uint8Array.from(bin, (c) => c.charCodeAt(0)).buffer, error: null };
  } catch (error) {
    return { error };
  }
}

function safeCloseWebSocket(socket) {
  try {
    if (socket.readyState === WS_OPEN || socket.readyState === WS_CLOSING) socket.close();
  } catch (error) {
    console.error("safeCloseWebSocket error", error);
  }
}

// DNS-only UDP (port 53) via DoH. Known limitation: assumes each WS message holds whole UDP packets.
function handleUDPOutBound(ws, respHeader, dohURL, log) {
  let headerSent = false;
  const transform = new TransformStream({
    transform(chunk, controller) {
      for (let i = 0; i < chunk.byteLength; ) {
        const len = new DataView(chunk.slice(i, i + 2)).getUint16(0);
        controller.enqueue(new Uint8Array(chunk.slice(i + 2, i + 2 + len)));
        i += 2 + len;
      }
    },
  });

  transform.readable
    .pipeTo(
      new WritableStream({
        async write(chunk) {
          const resp = await fetch(dohURL, {
            method: "POST",
            headers: { "content-type": "application/dns-message" },
            body: chunk,
          });
          const result = await resp.arrayBuffer();
          const size = result.byteLength;
          const sizeBuf = new Uint8Array([(size >> 8) & 0xff, size & 0xff]);
          if (ws.readyState === WS_OPEN) {
            log(`doh success, dns message length is ${size}`);
            if (headerSent) {
              ws.send(await new Blob([sizeBuf, result]).arrayBuffer());
            } else {
              ws.send(await new Blob([respHeader, sizeBuf, result]).arrayBuffer());
              headerSent = true;
            }
          }
        },
      })
    )
    .catch((e) => log("dns udp has error " + e));

  const writer = transform.writable.getWriter();
  return { write(chunk) { writer.write(chunk); } };
}
