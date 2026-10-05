// =====================================================================
//  Personalized & hardened Cloudflare Worker script - TROJAN edition (Iran-oriented)
//  Env vars:
//    pswd      REQUIRED. Your password: 8+ chars, only A-Z a-z 0-9 . _ ~ -   (it is also the secret URL path)
//    proxyip   optional, comma-separated  host[:port]  /  [ipv6]:port   (retry reverse-proxy IPs)
//    cdnip     optional, address used in the single-node links (default: the worker's own host)
//    ip1..ip13 / pt1..pt13   preferred addresses / ports for the sub nodes. ip1-7 = non-TLS, ip8-13 = TLS.
//                            No defaults in code: a slot without ipN is skipped, a missing ptN = 80 (non-TLS) / 443 (TLS).
//    decoy     optional, hostname to reverse-proxy for unknown paths (default: nginx-style 404)
//  Note: Trojan here is TCP only (no UDP). The generated configs contain NO dns/rules: set client DNS to TCP/DoH through the proxy yourself.
// =====================================================================
// @ts-ignore
import { connect } from "cloudflare:sockets";

// Protocol name kept escaped (same trick as the original) so the literal word is not in the source.
const P = "\u0074\u0072\u006F\u006A\u0061\u006E";

// Reverse-proxy IPs used on retry (needed to reach Cloudflare-hosted sites). Replace with ones you trust.
const DEFAULT_PROXY_IPS = [
  "146.103.96.115", "188.253.26.217", "146.103.96.238", "146.103.96.50", "103.137.248.227",
  "146.103.96.164", "80.240.141.242", "188.226.163.149", "95.85.42.135", "186.190.213.143",
  "188.166.73.154", "103.137.248.22", "103.137.248.229",
];


const WS_OPEN = 1;
const WS_CLOSING = 2;
const PSWD_RE = /^[A-Za-z0-9._~-]{8,}$/;

// ---------------------------------------------------------------- SHA-224 (WebCrypto has no SHA-224)
const K256 = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function sha224hex(str) {
  const msg = new TextEncoder().encode(str);
  const len = msg.length;
  const total = ((len + 9 + 63) >> 6) << 6;
  const buf = new Uint8Array(total);
  buf.set(msg);
  buf[len] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(total - 8, Math.floor((len * 8) / 4294967296));
  dv.setUint32(total - 4, (len * 8) >>> 0);
  let h = [0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939, 0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4];
  const w = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let o = 0; o < total; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K256[i] + w[i]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h = [(h[0] + a) | 0, (h[1] + b) | 0, (h[2] + c) | 0, (h[3] + d) | 0, (h[4] + e) | 0, (h[5] + f) | 0, (h[6] + g) | 0, (h[7] + hh) | 0];
  }
  return h.slice(0, 7).map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

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
  const pswd = String(env.pswd || "");
  const proxySrc = env.proxyip ? String(env.proxyip).split(",") : DEFAULT_PROXY_IPS;
  const proxyList = proxySrc.map((s) => s.trim()).filter(Boolean).map((s) => parseHostPort(s));
  const addrs = [], ports = [];
  for (let i = 0; i < 13; i++) {
    addrs.push(String(env[`ip${i + 1}`] || "").trim());
    ports.push(String(env[`pt${i + 1}`] || "").trim());
  }
  return {
    pswd,
    hash: PSWD_RE.test(pswd) ? sha224hex(pswd) : "",
    proxyList, addrs, ports,
    cdnip: String(env.cdnip || "").trim(),
    decoy: env.decoy || "",
  };
}

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
      if (!cfg.hash) {
        return new Response("pswd is not set or too weak: use 8+ chars from A-Z a-z 0-9 . _ ~ -", { status: 500 });
      }
      const url = new URL(request.url);
      if (request.headers.get("Upgrade") !== "websocket") {
        return await handleHttp(request, url, cfg);
      }
      // Optional per-connection proxy override:  /pyip=host[:port]
      // (applies to this connection only; never touches global state)
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
  const base = `/${cfg.pswd}`;
  const p = url.pathname;
  const ok = (body, type = "text/plain") =>
    new Response(body, { status: 200, headers: { "Content-Type": `${type};charset=utf-8` } });

  if (p === base) return ok(renderPage(cfg, host), "text/html");
  if (p.startsWith(base + "/")) {
    const key = p.slice(base.length + 1);
    if (Object.prototype.hasOwnProperty.call(ROUTES, key)) {
      const [scope, kind] = ROUTES[key];
      const nodes = buildNodes(cfg, host, scope === "tls");
      if (kind === "share") return ok(shareSub(nodes, cfg.pswd, host));
      if (kind === "clash") return ok(clashConfig(nodes, cfg.pswd, host));
      return ok(singboxConfig(nodes, cfg.pswd, host), "application/json");
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
    all.push({ name: `CF_T${i + 1}_${addr}_${port}`, addr, port, tls });
  }
  if (!all.some((n) => n.tls)) all.push({ name: `CF_T8_${host}_443`, addr: host, port: "443", tls: true });
  if (!tlsOnly && !all.some((n) => !n.tls)) all.unshift({ name: `CF_T1_${host}_80`, addr: host, port: "80", tls: false });
  return tlsOnly ? all.filter((n) => n.tls) : all;
}

function nodeLink(n, pswd, host) {
  const sec = n.tls ? `tls&sni=${host}` : "none";
  return `${P}://${pswd}@${n.addr}:${n.port}?security=${sec}&fp=chrome&type=ws&host=${host}&path=%2F%3Fed%3D2560#${n.name}`;
}

function shareSub(nodes, pswd, host) {
  return btoa(nodes.map((n) => nodeLink(n, pswd, host)).join("\n"));
}

// Clash's Trojan outbound is always TLS, so only TLS nodes are emitted (same as the original).
function clashConfig(nodes, pswd, host) {
  const q = JSON.stringify;
  const tlsNodes = nodes.filter((n) => n.tls);
  const names = tlsNodes.map((n) => `    - ${q(n.name)}`).join("\n");
  const proxies = tlsNodes
    .map((n) =>
      [
        `- name: ${q(n.name)}`,
        `  type: ${P}`,
        `  server: ${q(n.addr.replace(/[\[\]]/g, ""))}`,
        `  port: ${n.port}`,
        `  password: ${pswd}`,
        `  udp: false`,
        `  sni: ${host}`,
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

function singboxConfig(nodes, pswd, host) {
  const tags = nodes.map((n) => n.name);
  const outbounds = nodes.map((n) => {
    const o = {
      type: P,
      tag: n.name,
      server: n.addr.replace(/[\[\]]/g, ""),
      server_port: Number(n.port),
      password: pswd,
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

function linkTable(headHtml, valueText, text) {
  return `<table class="table"><thead><tr><th>${headHtml}</th></tr></thead><tbody><tr>${
    valueText ? `<td class="limited-width">${esc(valueText)}</td>` : ""
  }<td>${copyBtn(text)}</td></tr></tbody></table>`;
}

function renderPage(cfg, host) {
  const pswd = cfg.pswd;
  const isWorkers = host.includes("workers.dev");
  const cdn = cfg.cdnip || host;
  const wsLink = `${P}://${pswd}@${cdn}:8880?security=none&type=ws&host=${host}&path=%2F%3Fed%3D2560#${host}`;
  const tlsLink = `${P}://${pswd}@${cdn}:8443?security=tls&type=ws&host=${host}&sni=${host}&fp=chrome&path=%2F%3Fed%3D2560#${host}`;
  const base = `https://${host}/${pswd}`;
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
  <li>${bi("رمز عبور (password):", "Password:")} ${esc(pswd)}</li>
  <li>${bi("پروتکل انتقال (network): ws", "Transport (network): ws")}</li>
  <li>${bi("دامنه‌ی پوششی (host):", "Camouflage domain (host):")} ${esc(host)}</li>
  <li>${bi("مسیر (path):", "Path:")} /?ed=2560</li>
  <li>${bi("امنیت انتقال (TLS): " + (tls ? "روشن" : "خاموش"), "Transport security (TLS): " + (tls ? "on" : "off"))}</li>
  ${tls ? `<li>SNI: ${esc(host)}</li><li>${bi("رد کردن اعتبارسنجی گواهی (allowInsecure): false", "Skip certificate verification (allowInsecure): false")}</li>` : ""}
</ul><hr><br>`;

  const subs = (prefix, nodes, clNote) => `
${linkTable(bi("لینک اشتراک‌گذاری تجمیعی (ورود مستقیم به کلاینت):", "Aggregated share link (import directly):"), "", shareSub(nodes, pswd, host))}
${linkTable(bi("لینک اشتراک تجمیعی:", "Aggregated subscription link:"), `${base}/${prefix}ty`, `${base}/${prefix}ty`)}
${linkTable("Clash-meta " + bi("لینک اشتراک:", "subscription link:") + clNote, `${base}/${prefix}cl`, `${base}/${prefix}cl`)}
${linkTable("Sing-box " + bi("لینک اشتراک:", "subscription link:"), `${base}/${prefix}sb`, `${base}/${prefix}sb`)}`;

  const note = [
    `${bi("گیت‌هاب پروژه", "Project GitHub")}: https://github.com/soroushse7o`,
    `${bi("ProxyIP های فعال", "Active ProxyIPs")}: ${esc(cfg.proxyList.map((p) => p.host + ":" + p.port).join(" , "))}`,
  ].join("<br>");

  const clNote = ` <small>(${bi("فقط نودهای TLS", "TLS nodes only")})</small>`;
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
<p>${bi("هر اشتراک ۱۳ نود (TLS و بدون TLS) دارد؛ اشتراک Clash فقط نودهای TLS دارد. دامنه‌ی workers.dev ممکن است فیلتر باشد؛ برای به‌روزرسانی اشتراک به پراکسی نیاز دارید. بدون پشتیبانی Fragment نودهای TLS کار نمی‌کنند. UDP پشتیبانی نمی‌شود.", "Each subscription has 13 nodes (TLS + non-TLS); the Clash one has TLS nodes only. workers.dev may be filtered, so updating the subscription may need a proxy. TLS nodes need Fragment support. UDP is not supported.")}</p>
${subs("", allNodes, clNote)}`;
  } else {
    body = `
<h3>1: CF-pages/workers/${bi("دامنه‌ی سفارشی", "custom-domain")}-${P}+ws+tls ${bi("نود", "node")}</h3>
${linkTable(bi("TLS روشن است. اگر کلاینت از Fragment پشتیبانی می‌کند روشنش کنید", "TLS is on. Enable Fragment if your client supports it"), tlsLink, tlsLink)}
${params(httpsPorts, httpsPortsEn, true)}
<h3>2: ${bi("لینک‌های اشتراک تجمیعی، Clash-meta و Sing-box:", "Aggregated, Clash-meta and Sing-box subscription links:")}</h3>
<p>${bi("اشتراک‌های زیر فقط ۶ نود پورت TLS دارند. UDP پشتیبانی نمی‌شود.", "The subscriptions below contain only the 6 TLS port nodes. UDP is not supported.")}</p>
${subs("p", tlsNodes, "")}`;
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

  readable
    .pipeTo(
      new WritableStream({
        async write(chunk) {
          if (remote.value) {
            const w = remote.value.writable.getWriter();
            await w.write(chunk);
            w.releaseLock();
            return;
          }
          const h = parseHeader(chunk, cfg.hash);
          if (h.hasError) throw new Error(h.message);
          address = h.addressRemote;
          portLog = `${h.portRemote}--${Math.random()} tcp`;
          handleTCPOutBound(remote, h.addressRemote, h.portRemote, chunk.slice(h.rawDataIndex), webSocket, cfg, proxyOverride, log);
        },
        close() { log("readableWebSocketStream is closed"); },
        abort(reason) { log("readableWebSocketStream is aborted", JSON.stringify(reason)); },
      })
    )
    .catch((err) => log("readableWebSocketStream pipeTo error", err));

  // @ts-ignore
  return new Response(null, { status: 101, webSocket: client });
}

// Trojan request:  hex(sha224(password)) CRLF | cmd(1) atyp(1) addr port(2) | CRLF | payload
function parseHeader(buf, hash) {
  if (!(buf instanceof ArrayBuffer) || buf.byteLength < 64) return { hasError: true, message: "invalid data" };
  const v = new Uint8Array(buf);
  if (v[56] !== 0x0d || v[57] !== 0x0a) return { hasError: true, message: "invalid header format (missing CR LF)" };
  let got = "";
  for (let i = 0; i < 56; i++) got += String.fromCharCode(v[i]);
  if (!safeEqual(got, hash)) return { hasError: true, message: "invalid password" };

  let p = 58;
  const cmd = v[p++];
  if (cmd !== 1) return { hasError: true, message: "unsupported command, only TCP (CONNECT) is allowed" };
  const atype = v[p++];
  let addr = "";
  switch (atype) {
    case 1: // ipv4
      addr = Array.from(v.subarray(p, p + 4)).join(".");
      p += 4;
      break;
    case 3: { // domain
      const len = v[p++];
      addr = new TextDecoder().decode(v.subarray(p, p + len));
      p += len;
      break;
    }
    case 4: { // ipv6
      if (p + 16 > buf.byteLength) return { hasError: true, message: "invalid data" };
      const dv = new DataView(buf, p, 16);
      const parts = [];
      for (let i = 0; i < 8; i++) parts.push(dv.getUint16(i * 2).toString(16));
      addr = parts.join(":");
      p += 16;
      break;
    }
    default:
      return { hasError: true, message: `invalid addressType ${atype}` };
  }
  if (!addr) return { hasError: true, message: `address is empty, addressType is ${atype}` };
  const portRemote = (v[p] << 8) | v[p + 1];
  p += 2;
  if (v[p] !== 0x0d || v[p + 1] !== 0x0a) return { hasError: true, message: "invalid request (missing CR LF after port)" };
  return { hasError: false, addressRemote: addr, portRemote, rawDataIndex: p + 2 };
}

const IPV4_RE = /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;

async function handleTCPOutBound(remote, addr, port, raw, ws, cfg, proxyOverride, log) {
  // Workers cannot connect() straight to some IPs; sslip.io maps www.<ip>.sslip.io -> <ip>.
  const dest = IPV4_RE.test(addr) ? `www.${addr}.sslip.io` : addr;

  async function connectAndWrite(address, port) {
    const s = connect({ hostname: address, port: Number(port) });
    remote.value = s;
    log(`connected to ${address}:${port}`);
    const w = s.writable.getWriter();
    await w.write(raw); // first payload (normally the TLS client hello)
    w.releaseLock();
    return s;
  }

  // If the direct socket yields no data (or fails), retry through a reverse-proxy IP.
  async function retry() {
    const p = pickProxy(proxyOverride, cfg.proxyList);
    const s = p ? await connectAndWrite(p.host, p.port) : await connectAndWrite(dest, port);
    s.closed
      .catch((e) => console.log("retry tcpSocket closed error", e))
      .finally(() => safeCloseWebSocket(ws));
    remoteSocketToWS(s, ws, null, log);
  }

  try {
    const s = await connectAndWrite(dest, port);
    remoteSocketToWS(s, ws, retry, log);
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
        log("webSocketServer error");
        controller.error(err);
      });
      const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
      if (error) controller.error(error);
      else if (earlyData) controller.enqueue(earlyData);
    },
    pull() {},
    cancel(reason) {
      if (cancelled) return;
      log(`readableStream was canceled, due to ${reason}`);
      cancelled = true;
      safeCloseWebSocket(ws);
    },
  });
}

async function remoteSocketToWS(remoteSocket, ws, retry, log) {
  let hasIncomingData = false;
  await remoteSocket.readable
    .pipeTo(
      new WritableStream({
        async write(chunk, controller) {
          hasIncomingData = true;
          if (ws.readyState !== WS_OPEN) {
            controller.error("webSocket connection is not open");
            return;
          }
          ws.send(chunk);
        },
        close() { log(`remoteSocket.readable is closed, hasIncomingData: ${hasIncomingData}`); },
        abort(reason) { console.error("remoteSocket.readable abort", reason); },
      })
    )
    .catch((error) => {
      console.error("remoteSocketToWS error:", error && error.stack ? error.stack : error);
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
