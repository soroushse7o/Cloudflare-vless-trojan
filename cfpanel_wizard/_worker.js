// Maintained & updated by soroushse7o — https://github.com/soroushse7o/
// Project: https://github.com/soroushse7o/Cloudflare-vless-trojan/
//
// Install Wizard — single-file Cloudflare Worker (UI + stateless API).
// Nothing is stored: the token is used only for the requests made while installing.
// ویزارد نصب — یک Worker تک‌فایل. هیچ داده‌ای ذخیره نمی‌شود.

const API = "https://api.cloudflare.com/client/v4";

const GH = "https://raw.githubusercontent.com/soroushse7o/Cloudflare-vless-trojan/";
const VLESS_DIR = GH + "refs/heads/main/Vless_workers_pages/";
const TROJAN_DIR = GH + "refs/heads/main/Trojan_workers_pages/";
const PAGES_FILE = "_worker.js";         
const WORKERS_FILE = "_worker.js"; // Workers build: readable bilingual module (same logic as _worker.js)

const SOURCES = {
  vless: {
    variable: "uuid",
    pages: [VLESS_DIR + PAGES_FILE, VLESS_DIR + WORKERS_FILE],
    workers: [VLESS_DIR + WORKERS_FILE, VLESS_DIR + PAGES_FILE],
  },
  trojan: {
    variable: "pswd",
    pages: [TROJAN_DIR + PAGES_FILE, TROJAN_DIR + WORKERS_FILE],
    workers: [TROJAN_DIR + WORKERS_FILE, TROJAN_DIR + PAGES_FILE],
  },
};

// Runtime placement hint: run Workers/Pages Functions in the Cloudflare data center with the
// lowest latency to this cloud region. Set to "" to disable.
// ریجن اجرای Worker/Pages (Placement Hint): نزدیک‌ترین دیتاسنتر کلادفلر به این ریجن. برای غیرفعال‌سازی خالی بگذارید.
const PLACEMENT_REGION = "azure:westeurope";

// Extra variables injected into the uploaded project: Workers get all 13 pairs, Pages only the first 6.
const EXTRA_IPS = [
  ["spring.io", "80"], ["www.dictionary.com", "8080"], ["www.cambridge.org", "8880"],
  ["www.pitchbook.com", "2052"], ["www.codeforces.com", "2082"], ["pitchbook.com", "2086"],
  ["www.spring.io", "2095"], ["www.momentjs.com", "443"], ["www.greylock.com", "8443"],
  ["producthunt.com", "2053"], ["jquery.com", "2083"], ["pandas.pydata.org", "2087"],
  ["www.merriam-webster.com", "2096"],
];
const CDNIP = "www.momentjs.com";
function extraVars(method) {
  const n = method === "pages" ? 6 : 13;
  const vars = {};
  EXTRA_IPS.slice(0, n).forEach(([ip, pt], i) => {
    vars["ip" + (i + 1)] = ip;
    vars["pt" + (i + 1)] = pt;
  });
  vars.cdnip = CDNIP;
  return vars;
}

// Minimal browser-global shim for scripts written for Pages that touch `window` at top level.
const SHIM = "globalThis.window = globalThis.window || globalThis;\n";

class ApiError extends Error {
  constructor(code, status = 400, detail = "") {
    super(code);
    this.code = code;
    this.status = status;
    this.detail = String(detail || "").slice(0, 300);
  }
}

// ---------- helpers ----------

function randomString(length, alphabet) {
  const limit = 256 - (256 % alphabet.length);
  let out = "";
  while (out.length < length) {
    for (const b of crypto.getRandomValues(new Uint8Array(length * 2))) {
      if (b < limit && out.length < length) out += alphabet[b % alphabet.length];
    }
  }
  return out;
}
// Fully random UUID: all 128 bits random (no fixed version/variant bits), formatted 8-4-4-4-12.
function randomUUID() {
  const h = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// Neutral random project/worker name: never contains "vless" or "trojan".
const NAME_A = ["amber", "blue", "calm", "dawn", "ember", "frost", "gold", "jade", "lunar", "maple", "north", "olive", "pearl", "quiet", "river", "silver", "terra", "violet", "willow", "zen"];
const NAME_B = ["app", "site", "note", "page", "board", "desk", "lab", "hub", "space", "studio", "shop", "blog", "docs", "tool"];
function pick(list) {
  return list[crypto.getRandomValues(new Uint32Array(1))[0] % list.length];
}
function neutralName() {
  return `${pick(NAME_A)}-${pick(NAME_B)}-${randomString(6, LOWER)}`;
}

const LOWER = "abcdefghijklmnopqrstuvwxyz0123456789";
const ALNUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function cf(path, token, { method = "GET", json: body, form } = {}) {
  const headers = { authorization: "Bearer " + token };
  let payload;
  if (body !== undefined) {
    headers["content-type"] = "application/json";
    payload = JSON.stringify(body);
  } else if (form) {
    payload = form;
  }
  let res, data;
  try {
    res = await fetch(API + path, { method, headers, body: payload, signal: AbortSignal.timeout(30000) });
    data = await res.json();
  } catch {
    throw new ApiError("NETWORK", 502);
  }
  if (res.ok && data.success) return data.result;
  const first = (data.errors && data.errors[0]) || {};
  const code =
    res.status === 401 ? "TOKEN_INVALID" :
    res.status === 403 ? "PERMISSION" :
    res.status === 429 ? "RATE_LIMIT" : "CF_ERROR";
  throw new ApiError(code, res.status, first.message);
}

async function fetchSource(urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) continue;
      const text = await res.text();
      if (text.length > 1000 && !text.trimStart().startsWith("<")) return text;
    } catch {
      /* try next source */
    }
  }
  throw new ApiError("SOURCE_FETCH", 502);
}

// ---------- install flow ----------

async function deployWorkers(token, accountId, name, code, variable, secret, extra = {}) {
  const form = new FormData();
  form.append(
    "metadata",
    new Blob(
      [JSON.stringify({
        main_module: "worker.js",
        compatibility_date: "2025-01-01",
        bindings: [
          { type: "plain_text", name: variable, text: secret },
          ...Object.entries(extra).map(([k, v]) => ({ type: "plain_text", name: k, text: v })),
        ],
        ...(PLACEMENT_REGION ? { placement: { region: PLACEMENT_REGION } } : {}),
      })],
      { type: "application/json" }
    ),
    "metadata.json"
  );
  form.append("worker.js", new Blob([code], { type: "application/javascript+module" }), "worker.js");
  await cf(`/accounts/${accountId}/workers/scripts/${name}`, token, { method: "PUT", form });

  // account-level workers.dev subdomain (create one if the account has none)
  let sub = "";
  try {
    sub = (await cf(`/accounts/${accountId}/workers/subdomain`, token)).subdomain || "";
  } catch (e) {
    if (!(e instanceof ApiError) || (e.status !== 404 && e.code !== "CF_ERROR")) throw e;
  }
  for (let i = 0; !sub && i < 3; i++) {
    const candidate = "w" + randomString(10, LOWER);
    try {
      sub = (await cf(`/accounts/${accountId}/workers/subdomain`, token, { method: "PUT", json: { subdomain: candidate } })).subdomain;
    } catch (e) {
      if (!(e instanceof ApiError) || e.code !== "CF_ERROR" || i === 2) throw e;
    }
  }
  await cf(`/accounts/${accountId}/workers/scripts/${name}/subdomain`, token, {
    method: "POST",
    json: { enabled: true, previews_enabled: false },
  });
  return `${name}.${sub}.workers.dev`;
}

async function deployPages(token, accountId, name, code, variable, secret, extra = {}) {
  const project = await cf(`/accounts/${accountId}/pages/projects`, token, {
    method: "POST",
    json: {
      name,
      production_branch: "main",
      deployment_configs: { production: { env_vars: { [variable]: { type: "plain_text", value: secret }, ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, { type: "plain_text", value: v }])) } } },
    },
  });
  // Best-effort: set the placement hint for Pages Functions. A rejection here must not break the install.
  if (PLACEMENT_REGION) {
    try {
      await cf(`/accounts/${accountId}/pages/projects/${name}`, token, {
        method: "PATCH",
        json: { deployment_configs: {
          production: { placement: { region: PLACEMENT_REGION } },
          preview: { placement: { region: PLACEMENT_REGION } },
        } },
      });
    } catch {
      /* placement is an optimization; continue without it */
    }
  }
  const form = new FormData();
  form.append("manifest", "{}");
  form.append("branch", "main");
  form.append("_worker.js", new Blob([code], { type: "application/javascript" }), "_worker.js");
  await cf(`/accounts/${accountId}/pages/projects/${name}/deployments`, token, { method: "POST", form });
  return (project && project.subdomain) || `${name}.pages.dev`;
}

async function install(token, method, protocol) {
  const source = SOURCES[protocol];

  try {
    const verified = await cf("/user/tokens/verify", token);
    if (!verified || verified.status !== "active") throw new ApiError("TOKEN_INVALID", 401);
  } catch (e) {
    if (e instanceof ApiError && [400, 401, 403].includes(e.status)) throw new ApiError("TOKEN_INVALID", 401);
    throw e;
  }

  const accounts = await cf("/accounts", token);
  if (!accounts || !accounts.length) throw new ApiError("NO_ACCOUNT", 404);
  const accountId = accounts[0].id;

  const code = await fetchSource(source[method]);

  // random credentials, generated per install and never stored
  const secret = protocol === "vless" ? randomUUID() : randomString(24, ALNUM);
  const name = neutralName();

  const extra = extraVars(method);
  let host;
  if (method === "pages") {
    host = await deployPages(token, accountId, name, code, source.variable, secret, extra);
  } else {
    try {
      host = await deployWorkers(token, accountId, name, code, source.variable, secret, extra);
    } catch (e) {
      // Workers validates the script by running its global scope; browser-only globals
      // (e.g. `window`) throw there. Retry once with a small shim prepended.
      if (e instanceof ApiError && /is not defined/.test(e.detail)) {
        host = await deployWorkers(token, accountId, name, SHIM + code, source.variable, secret, extra);
      } else {
        throw e;
      }
    }
  }

  return { link: `https://${host}/${secret}`, secret, name };
}

async function handleInstall(request, url) {
  if (request.method !== "POST") return json({ ok: false, code: "BAD_REQUEST" }, 405);
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return json({ ok: false, code: "FORBIDDEN" }, 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, code: "BAD_REQUEST" }, 400);
  }
  const token = String(body.token || "").trim();
  if (!token) return json({ ok: false, code: "TOKEN_EMPTY" }, 400);
  if (!/^[A-Za-z0-9_-]{20,120}$/.test(token)) return json({ ok: false, code: "TOKEN_INVALID" }, 400);
  if (!["workers", "pages"].includes(body.method) || !SOURCES[body.protocol]) {
    return json({ ok: false, code: "BAD_REQUEST" }, 400);
  }

  try {
    return json({ ok: true, ...(await install(token, body.method, body.protocol)) });
  } catch (e) {
    if (e instanceof ApiError) return json({ ok: false, code: e.code, detail: e.detail }, e.status);
    return json({ ok: false, code: "UNKNOWN" }, 500);
  }
}

// ---------- page ----------

const HTML = `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Install Wizard</title>
<style>
:root{--bg1:#0a1633;--bg2:#12306b;--card:#070f24;--line:#2d4a8f;--acc:#5b8cff;--fg:#e8eefc;--mute:#8fa3cc;--ok:#3ddc97;--err:#ff6b6b;--warn:#ffc857}
*{box-sizing:border-box}
@font-face{font-family:V;src:local("Vazirmatn"),local("Vazirmatn UI")}
html,body{margin:0;min-height:100%}
body{background:linear-gradient(180deg,var(--bg1),var(--bg2));color:var(--fg);font:16px/1.9 V,Tahoma,system-ui,-apple-system,"Segoe UI",sans-serif;padding:max(16px,env(safe-area-inset-top)) 16px max(24px,env(safe-area-inset-bottom))}
main{max-width:560px;margin:0 auto}
header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
h1{font-size:1.5rem;margin:0}
.lang{background:none;border:1px solid var(--line);color:var(--fg);border-radius:999px;padding:4px 14px;font:inherit;cursor:pointer}
ol{padding-inline-start:1.4em;margin:12px 0 24px}
li{margin:6px 0}
a{color:var(--acc);cursor:pointer;text-decoration:none}
.field{position:relative;display:flex;align-items:center;background:var(--card);border-radius:18px;padding:0 14px;margin-bottom:14px;border:1px solid transparent}
.field:focus-within{border-color:var(--line)}
.field svg{flex:none;width:22px;height:22px;stroke:var(--mute);fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.field input,.field select{flex:1;min-width:0;background:none;border:0;outline:0;color:var(--fg);font:inherit;padding:16px 10px}
.field input[dir=ltr]{text-align:start}
.field select{appearance:none;-webkit-appearance:none;cursor:pointer}
.field select option{background:#0b1b3a;color:var(--fg)}
.eye{background:none;border:0;padding:6px;cursor:pointer;display:flex}
.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.install{display:block;margin:10px auto 22px;background:transparent;color:var(--acc);border:2px solid var(--acc);border-radius:16px;padding:10px 34px;font:inherit;font-weight:700;cursor:pointer}
.install:disabled{opacity:.5;cursor:default}
.status{background:var(--card);border-radius:18px;padding:16px 18px;min-height:96px}
.st{display:flex;align-items:center;gap:12px;font-family:ui-monospace,Menlo,Consolas,monospace}
.dots{display:flex;gap:5px;direction:ltr}
.dots i{width:14px;height:14px;border-radius:50%;background:var(--acc);opacity:.45}
.dots i:nth-child(2){opacity:.75}.dots i:nth-child(3){opacity:1}
.deploying .dots i{background:var(--warn);animation:p 1s infinite}
.deploying .dots i:nth-child(2){animation-delay:.2s}.deploying .dots i:nth-child(3){animation-delay:.4s}
.success .dots i{background:var(--ok);opacity:1}
.error .dots i{background:var(--err);opacity:1}
@keyframes p{50%{opacity:.2}}
.msg{margin-top:10px;color:var(--mute);font-size:.92rem;word-break:break-word}
.error .msg{color:var(--err)}
.res{margin-top:12px;font-size:.92rem}
.res .lbl{color:var(--mute)}
.res code{display:block;direction:ltr;text-align:left;background:#0d1a38;border-radius:10px;padding:8px 10px;margin:4px 0 10px;word-break:break-all;font-size:.85rem}
.copy{background:var(--acc);color:#fff;border:0;border-radius:10px;padding:4px 14px;font:inherit;cursor:pointer}
.note a{color:var(--acc)}
.links{margin:0 0 4px;font-size:.92rem}
.note{margin-top:16px;text-align:center;color:var(--mute);font-size:.82rem}
.hidden{display:none}
</style>
</head>
<body>
<main>
<header><h1 id="title"></h1><button class="lang" id="lang" type="button"></button></header>
<p class="links"><a href="https://github.com/soroushse7o/" target="_blank" rel="noopener noreferrer" id="tgh1"></a> · <a href="https://github.com/soroushse7o/Cloudflare-vless-trojan/" target="_blank" rel="noopener noreferrer" id="tgh2"></a></p>
<ol id="steps"></ol>
<form id="f" autocomplete="off">
<label class="field">
<svg viewBox="0 0 24 24"><circle cx="7.5" cy="12" r="3.5"/><path d="M11 12h10M17 12v3M20 12v2"/></svg>
<input id="token" type="password" dir="ltr" spellcheck="false" autocapitalize="off" autocorrect="off" autocomplete="off">
<button class="eye" id="eye" type="button"><svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button>
</label>
<div class="row">
<label class="field"><svg viewBox="0 0 24 24"><path d="M6 21v-7M6 14l-3-3M6 14l3-3M18 3v7M18 10l-3 3M18 10l3 3M12 4v16"/></svg>
<select id="method"><option value="workers">Cloudflare Workers</option><option value="pages">Cloudflare Pages</option></select></label>
<label class="field"><svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>
<select id="protocol"><option value="vless">VLESS</option><option value="trojan">Trojan</option></select></label>
</div>
<button class="install" id="go" type="submit"></button>
</form>
<div class="status" id="status">
<div class="st"><span class="dots"><i></i><i></i><i></i></span><span id="stext"></span></div>
<div class="msg hidden" id="smsg"></div>
<div class="res hidden" id="res">
<div class="lbl" id="llink"></div><code id="link"></code>
<div class="lbl" id="lsecret"></div><code id="secret"></code>
<button class="copy" id="copy" type="button"></button>
</div>
</div>
<p class="note" id="note"></p>
<p class="note" id="gh"><a href="https://github.com/soroushse7o/" target="_blank" rel="noopener noreferrer" id="gh1"></a> · <a href="https://github.com/soroushse7o/Cloudflare-vless-trojan/" target="_blank" rel="noopener noreferrer" id="gh2"></a></p>
</main>
<script>
(function(){
var TOKEN_URL='https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=%5B%7B%22key%22%3A%22workers_scripts%22%2C%22type%22%3A%22edit%22%7D%2C%7B%22key%22%3A%22workers_kv_storage%22%2C%22type%22%3A%22edit%22%7D%2C%7B%22key%22%3A%22page%22%2C%22type%22%3A%22edit%22%7D%2C%7B%22key%22%3A%22dns%22%2C%22type%22%3A%22edit%22%7D%2C%7B%22key%22%3A%22user_details%22%2C%22type%22%3A%22read%22%7D%5D&accountId=*&zoneId=all&name=panel-wizard';
var SIGNUP_URL='https://dash.cloudflare.com/sign-up';
var L={
en:{title:"Install Wizard",lang:"فارسی",
s1:'<a data-l="signup">Sign up</a> a Cloudflare account and verify it.',
s2:'<a data-l="token">Create a token</a>, you should <b>Continue to summary</b>, <b>Create Token</b> and copy it.',
s3:"Paste it here, choose installation method and install.",
s4:"After installation you get a <b>Private Link</b> which enables one-click installation.",
ph:"Cloudflare API Token",eye:"Show / hide token",install:"Install",
standby:"Standby",deploying:"Deploying...",success:"Success",error:"Error",
link:"Private Link",uuid:"UUID",pswd:"Password",copy:"Copy",copied:"Copied",
note:"Nothing is stored. Your token is only used for this install, directly against Cloudflare.",
gh1:"GitHub page",gh2:"Project on GitHub",
e_TOKEN_EMPTY:"Enter your Cloudflare API token.",
e_TOKEN_INVALID:"The token is invalid or expired. Create a new one with the link in step 2.",
e_PERMISSION:"The token does not have enough permissions. Create it with the link in step 2.",
e_NETWORK:"Network error: could not reach Cloudflare. Try again.",
e_RATE_LIMIT:"Too many requests. Wait a moment and try again.",
e_NO_ACCOUNT:"No Cloudflare account was found for this token.",
e_SOURCE_FETCH:"Could not download the script from GitHub. Try again later.",
e_CF_ERROR:"Cloudflare returned an error.",
e_BAD_REQUEST:"Invalid request.",e_FORBIDDEN:"Invalid request.",e_UNKNOWN:"Unknown error."},
fa:{title:"ویزارد نصب",lang:"English",
s1:'<a data-l="signup">ثبت‌نام</a> در Cloudflare و تأیید حساب.',
s2:'<a data-l="token">ساخت توکن</a>؛ روی <b>Continue to summary</b> و سپس <b>Create Token</b> بزنید و توکن را کپی کنید.',
s3:"توکن را اینجا بچسبانید، روش نصب را انتخاب کنید و نصب را بزنید.",
s4:"بعد از نصب یک <b>لینک خصوصی</b> (Private Link) می‌گیرید که نصب یک‌کلیکی را ممکن می‌کند.",
ph:"توکن API کلادفلر",eye:"نمایش / مخفی کردن توکن",install:"نصب",
standby:"آماده‌باش",deploying:"در حال نصب...",success:"موفق",error:"خطا",
link:"لینک خصوصی",uuid:"UUID",pswd:"رمز عبور",copy:"کپی",copied:"کپی شد",
note:"هیچ داده‌ای ذخیره نمی‌شود. توکن فقط برای همین نصب و مستقیم با کلادفلر استفاده می‌شود.",
gh1:"پیج گیت‌هاب",gh2:"پروژه در گیت‌هاب",
e_TOKEN_EMPTY:"توکن API کلادفلر را وارد کنید.",
e_TOKEN_INVALID:"توکن نامعتبر یا منقضی است. با لینک مرحله ۲ یک توکن جدید بسازید.",
e_PERMISSION:"دسترسی توکن کافی نیست. آن را با لینک مرحله ۲ بسازید.",
e_NETWORK:"خطای شبکه: ارتباط با کلادفلر برقرار نشد. دوباره تلاش کنید.",
e_RATE_LIMIT:"تعداد درخواست‌ها زیاد است. کمی صبر کنید و دوباره تلاش کنید.",
e_NO_ACCOUNT:"حسابی برای این توکن پیدا نشد.",
e_SOURCE_FETCH:"دریافت اسکریپت از GitHub ناموفق بود. بعداً دوباره تلاش کنید.",
e_CF_ERROR:"کلادفلر خطا برگرداند.",
e_BAD_REQUEST:"درخواست نامعتبر است.",e_FORBIDDEN:"درخواست نامعتبر است.",e_UNKNOWN:"خطای ناشناخته."}
};
var $=function(i){return document.getElementById(i)};
var lang="fa";
var st="standby",errRes=null,result=null,busy=false;
function t(k){return L[lang][k]}
function errText(r){var m=t("e_"+r.code)||t("e_UNKNOWN");return r.detail?m+" ("+r.detail+")":m}
function render(){
 var h=document.documentElement;h.lang=lang;h.dir=lang==="fa"?"rtl":"ltr";
 $("title").textContent=t("title");$("lang").textContent=t("lang");
 $("steps").innerHTML="<li>"+t("s1")+"</li><li>"+t("s2")+"</li><li>"+t("s3")+"</li><li>"+t("s4")+"</li>";
 var as=$("steps").querySelectorAll("a");
 for(var i=0;i<as.length;i++){as[i].href=as[i].getAttribute("data-l")==="token"?TOKEN_URL:SIGNUP_URL;as[i].target="_blank";as[i].rel="noopener noreferrer"}
 $("token").placeholder=t("ph");$("eye").setAttribute("aria-label",t("eye"));
 $("go").textContent=t("install");$("note").textContent=t("note");
 $("gh1").textContent=t("gh1");$("gh2").textContent=t("gh2");$("tgh1").textContent=t("gh1");$("tgh2").textContent=t("gh2");
 $("status").className="status "+st;$("stext").textContent=t(st);
 var m=$("smsg");
 if(st==="error"&&errRes){m.textContent=errText(errRes);m.classList.remove("hidden")}else m.classList.add("hidden");
 var r=$("res");
 if(st==="success"&&result){
  r.classList.remove("hidden");$("llink").textContent=t("link");$("link").textContent=result.link;
  $("lsecret").textContent=t(result.protocol==="vless"?"uuid":"pswd");$("secret").textContent=result.secret;
  $("copy").textContent=t("copy");
 }else r.classList.add("hidden");
}
$("lang").onclick=function(){lang=lang==="fa"?"en":"fa";render()};
$("eye").onclick=function(){var i=$("token");i.type=i.type==="password"?"text":"password"};
$("copy").onclick=function(){
 if(!result)return;
 navigator.clipboard.writeText(result.link).then(function(){
  $("copy").textContent=t("copied");setTimeout(function(){$("copy").textContent=t("copy")},1500)});
};
$("f").onsubmit=function(e){
 e.preventDefault();
 if(busy)return;
 var token=$("token").value.trim();
 if(!token){st="error";errRes={code:"TOKEN_EMPTY"};render();return}
 busy=true;$("go").disabled=true;st="deploying";errRes=null;result=null;render();
 var protocol=$("protocol").value;
 fetch("/api/install",{method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({token:token,method:$("method").value,protocol:protocol})})
 .then(function(r){return r.json()})
 .then(function(d){
  if(d.ok){st="success";result={link:d.link,secret:d.secret,protocol:protocol}}
  else{st="error";errRes=d}
 })
 .catch(function(){st="error";errRes={code:"NETWORK"}})
 .then(function(){busy=false;$("go").disabled=false;render()});
};
render();
})();
</script>
</body>
</html>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/api/install") return handleInstall(request, url);
    if (url.pathname === "/") {
      return new Response(HTML, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
          "referrer-policy": "no-referrer",
          "content-security-policy":
            "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
        },
      });
    }
    return new Response("Not found", { status: 404 });
  },
};
