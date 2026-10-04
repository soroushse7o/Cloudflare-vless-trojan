# __TITLE__ — نسخه‌ی ایران

**[فارسی](#فارسی) · [English](#english)**

---

<a id="فارسی"></a>

<div dir="rtl">

# راهنمای فارسی

## فهرست
1. [این پروژه چیست؟](#fa-about)
2. [فایل‌ها](#fa-files)
3. [پیش‌نیازها](#fa-req)
4. [دیپلوی](#fa-deploy) — داشبورد، Wrangler، Pages
5. [متغیرهای محیطی (env)](#fa-env)
6. [آدرس‌های اشتراک و کلاینت‌ها](#fa-sub)
7. [آدرس بهینه](#fa-scan)
8. [ProxyIP و `/pyip=`](#fa-proxyip)
9. [شخصی‌سازی داخل کد](#fa-custom)
10. [دامنه‌ی سفارشی](#fa-domain)
11. [چک‌لیست امنیتی](#fa-sec)
12. [عیب‌یابی](#fa-trouble)
13. [محدودیت‌ها و نکات قانونی](#fa-limits)
14. [تغییرات نسبت به نسخه‌ی اصلی و اعتبار](#fa-credits)

<a id="fa-about"></a>
## این پروژه چیست؟

یک اسکریپت Cloudflare Worker (نسخه‌ی **Trojan**) که پراکسی روی WebSocket می‌سازد و همراه آن صفحه‌ی کانفیگ دوزبانه (فارسی/انگلیسی) و لینک‌های اشتراک برای v2ray، Clash-meta و sing-box تولید می‌کند. نسخه‌ی اصلی برای کاربران چینی بهینه شده بود؛ این نسخه برای ایران بازنویسی و امن‌تر شده است:

- قواعد مسیریابی و DNS برای **ایران** (`.ir`، `geosite-ir`، `geoip-ir`، `GEOIP,IR`) به‌جای چین.
- رفع آسیب‌پذیری `/pyip=` (تغییر سراسری ProxyIP توسط افراد ناشناس)، نشت `request.cf`، XSS در صفحه‌ی کانفیگ و چند باگ مدیریت خطا.
- پاسخ پیش‌فرض مسیرهای ناشناس: صفحه‌ی ۴۰۴ شبیه nginx (یا reverse-proxy به یک سایت دلخواه با `decoy`).
- تولید کانفیگ‌ها از روی یک لیست نود به‌جای کپی‌پیست ۱۳ باره؛ کد حدود ۶۰۰ خط است.
- نام همه‌ی env varها با نسخه‌ی قبلی سازگار است.
- فقط TCP (بدون UDP). رمز، هم پسورد پراکسی است و هم مسیر مخفی صفحه‌ی کانفیگ؛ بدون تنظیم `pswd` ورکر اجرا نمی‌شود (رمز پیش‌فرض ضعیف `trojan` حذف شد).

<a id="fa-files"></a>
## فایل‌ها

| فایل | کاربرد |
|---|---|
| `_worker.js` | اسکریپت **Trojan** (همین پوشه) |
| `README.md` | همین راهنما |

> اسکنر آدرس بهینه (`cf_scan.py`) در پوشه‌ی جداگانه‌ی خودش است و برای هر دو نسخه کار می‌کند. نسخه‌ی VLESS هم پوشه‌ی جدا دارد؛ لازم نیست هر دو را دیپلوی کنی.

<a id="fa-req"></a>
## پیش‌نیازها

- حساب Cloudflare (پلن رایگان کافی است).
- (اختیاری ولی توصیه‌شده) یک **دامنه‌ی شخصی** روی Cloudflare؛ دامنه‌ی `workers.dev` در بسیاری از شبکه‌ها فیلتر است.
- برای دیپلوی با خط فرمان: Node.js و npm (روی اوبونتو: `sudo apt install nodejs npm`).

<a id="fa-deploy"></a>
## دیپلوی

### روش ۱: داشبورد Cloudflare (ساده‌ترین)

1. وارد **Workers & Pages** شو و **Create → Create Worker** را بزن، یک نام بده و **Deploy** کن.
2. **Edit code** را بزن، کل کد پیش‌فرض را پاک کن و محتوای `_worker.js` را جایگزین کن، بعد **Deploy**.
3. به **Settings → Variables and Secrets** برو و متغیرها را اضافه کن (بخش [env](#fa-env)). حداقل لازم: `pswd`. مقدار آن را از نوع **Secret** بساز.
4. دوباره **Deploy** کن. آدرس صفحه‌ی کانفیگ:
   `https://<نام>.<ساب‌دامین‌شما>.workers.dev/<pswd>`

ساخت مقدار امن:

```bash
# letters/digits only, satisfies the password rule
openssl rand -hex 12
```

### روش ۲: Wrangler (خط فرمان)

```bash
mkdir my-worker && cd my-worker
# _worker.js را اینجا کپی کن
cat > wrangler.toml <<'EOF'
name = "my-worker"
main = "_worker.js"
compatibility_date = "2025-01-01"

[vars]
cdnip = "www.speedtest.net"
# ip1 = "..."   pt1 = "80"      ... (بخش آدرس بهینه)
EOF

npx wrangler login
npx wrangler secret put pswd
npx wrangler deploy
```

> اگر دسترسی به API کلودفلر از شبکه‌ات محدود است، wrangler را از طریق پراکسی/VPN اجرا کن.

### روش ۳: Cloudflare Pages

1. یک پوشه بساز و `_worker.js` را (با همین نام دقیق) داخلش بگذار.
2. در **Workers & Pages → Create → Pages → Upload assets** پوشه را آپلود و Deploy کن.
3. در **Settings → Variables and Secrets** (محیط Production) متغیرها را اضافه کن و پروژه را **دوباره Deploy** کن (در Pages تغییر متغیرها فقط بعد از دیپلوی جدید اعمال می‌شود).
4. صفحه‌ی کانفیگ روی `*.pages.dev` یا دامنه‌ی سفارشی در دسترس است. روی هاست‌هایی که `workers.dev` ندارند فقط **نودهای TLS** نمایش و تولید می‌شوند.

### تست سریع بعد از دیپلوی

```bash
# باید 404 شبیه nginx بدهد (ورکر زنده است و چیزی لو نمی‌دهد)
curl -i https://YOUR-HOST/anything

# باید 101 Switching Protocols بدهد (مسیر WebSocket سالم است)
curl -i -N https://YOUR-HOST/?ed=2560 \
  -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: SGVsbG8gd29ybGQhIQ=="
```

<a id="fa-env"></a>
## متغیرهای محیطی (env)

همه‌ی مقدارها رشته هستند. هر چیزی که تنظیم نکنی، از مقدار پیش‌فرض ابتدای فایل استفاده می‌کند.

| متغیر | اجباری | توضیح |
|---|---|---|
| `pswd` | **بله** | رمز؛ حداقل ۸ کاراکتر از `A-Z a-z 0-9 . _ ~ -`. هم رمز پراکسی است هم مسیر مخفی صفحه‌ی کانفیگ. بدون آن ورکر خطای ۵۰۰ می‌دهد |
| `proxyip` | خیر | یک یا چند ProxyIP جداشده با کاما، مثل `1.2.3.4:443,[2606:4700::1]:443,example.com`. اگر پورت ننویسی ۴۴۳ است |
| `cdnip` | خیر | آدرسی که در **لینک‌های تکی** صفحه‌ی کانفیگ (پورت‌های ۸۸۸۰ و ۸۴۴۳) به‌جای آدرس سرور می‌آید |
| `ip1` … `ip7` | خیر | آدرس بهینه‌ی ۷ نود **بدون TLS** (پورت‌های HTTP) |
| `ip8` … `ip13` | خیر | آدرس بهینه‌ی ۶ نود **TLS** (پورت‌های HTTPS) |
| `pt1` … `pt13` | خیر | پورت هر نود. پیش‌فرض: `80, 8080, 8880, 2052, 2082, 2086, 2095` و `443, 8443, 2053, 2083, 2087, 2096` |
| `decoy` | خیر | نام یک دامنه (بدون `https://`) که مسیرهای ناشناس را به آن reverse-proxy می‌کند. خالی = صفحه‌ی ۴۰۴ nginx |

مثال `wrangler.toml` با آدرس‌های بهینه:

```toml
[vars]
cdnip = "www.speedtest.net"
ip1 = "www.speedtest.net"
pt1 = "80"
ip8 = "104.18.2.3"
pt8 = "443"
proxyip = "203.0.113.10:443,203.0.113.11:443"
decoy = "www.example.com"
```

<a id="fa-sub"></a>
## آدرس‌های اشتراک و کلاینت‌ها

بعد از دیپلوی (جای `KEY` همان `pswd` است):

| آدرس | محتوا |
|---|---|
| `/KEY` | صفحه‌ی کانفیگ (دوزبانه) |
| `/KEY/ty` | اشتراک تجمیعی base64 — ۱۳ نود |
| `/KEY/cl` | کانفیگ Clash-meta — فقط ۶ نود TLS (خروجی Trojan در Clash همیشه TLS است) |
| `/KEY/sb` | کانفیگ sing-box — ۱۳ نود |
| `/KEY/pty` · `/KEY/pcl` · `/KEY/psb` | همان‌ها ولی فقط ۶ نود TLS |

- روی `workers.dev` صفحه هر دو دسته نود (TLS و بدون TLS) را نشان می‌دهد؛ روی دامنه‌ی سفارشی فقط TLS.
- `/KEY/ty` را به‌عنوان **Subscription** در کلاینت‌هایی مثل v2rayNG، Hiddify، NekoBox یا sing-box اضافه کن. برای Clash از `/KEY/cl` و برای sing-box از `/KEY/sb` استفاده کن.
- نودهای **TLS** معمولاً بدون **Fragment** در ایران پایدار نیستند؛ اگر کلاینتت گزینه‌ی Fragment دارد روشنش کن.
- مسیر WebSocket همیشه `/?ed=2560` است.
- پیکربندی sing-box برای نسخه‌های **۱٫۱۱ تا ۱٫۱۲** نوشته شده؛ نسخه‌های جدیدتر برای فرمت قدیمی DNS هشدار deprecated می‌دهند.
- **UDP پشتیبانی نمی‌شود** (Discord، تماس صوتی/تصویری و QUIC کار نمی‌کنند). DNS در کانفیگ‌های تولیدشده از داخل تونل با TCP/DoH انجام می‌شود.

<a id="fa-scan"></a>
## آدرس بهینه

«آدرس بهینه» آدرسی (دامنه یا IP کلودفلر) است که کلاینت به آن وصل می‌شود و هدر `Host` ورکر تو را می‌فرستد. اینکه کدام آدرس کار کند به ISP و نوع اتصال تو بستگی دارد؛ پس باید خودت اسکن کنی.

اسکریپت `cf_scan.py` (در پوشه‌ی اسکنر) این کار را انجام می‌دهد و خروجی را مستقیم در قالب env می‌دهد:

```bash
python3 cf_scan.py --worker proxy.example.com
# خروجی (worker_vars.txt):  ip1 = "..."  pt1 = "80"  ...  ip13 = "..."  pt13 = "2096"
```

خروجی را در Variables داشبورد یا `[vars]` در `wrangler.toml` بگذار. جزئیات در README اسکنر است. توجه: هر تست اسکنر یک درخواست به ورکر تو حساب می‌شود.

<a id="fa-proxyip"></a>
## ProxyIP و `/pyip=`

ورکرهای کلودفلر نمی‌توانند مستقیم به بعضی مقصدها (به‌خصوص سایت‌های پشت خود کلودفلر) وصل شوند. وقتی اتصال مستقیم داده‌ای برنگرداند، ورکر **یک بار دیگر از طریق ProxyIP** تلاش می‌کند.

- لیست پیش‌فرض داخل کد (`DEFAULT_PROXY_IPS`) مال دیگران است و روی ترافیک غیر-TLS می‌تواند محتوا را ببیند. **با IPهای مطمئن یا خودت جایگزینش کن** (`proxyip` در env).
- در هر retry یکی از لیست تصادفی انتخاب می‌شود.
- برای یک اتصال خاص می‌توانی ProxyIP را در مسیر کلاینت تعیین کنی: path را `/pyip=1.2.3.4:443?ed=2560` بگذار. این فقط برای همان اتصال (و فقط بعد از احراز هویت) اعمال می‌شود و فقط IP/دامنه‌ی معتبر را می‌پذیرد.

<a id="fa-custom"></a>
## شخصی‌سازی داخل کد

مقدارهای ابتدای فایل پیش‌فرض‌ها هستند و env آن‌ها را override می‌کند:

| چه چیزی | کجا |
|---|---|
| لیست ProxyIP | `DEFAULT_PROXY_IPS` |
| آدرس‌ها و پورت‌های پیش‌فرض | `DEFAULT_CDNIP`، `DEFAULT_ADDRS` (۱۳ تا)، `DEFAULT_PORTS` |
| محاسبه‌ی هش رمز | تابع `sha224hex` (SHA-224 داخلی؛ WebCrypto آن را ندارد) |
| rule-setهای sing-box ایران | `GEOSITE_IR_URL`، `GEOIP_IR_URL` (قبل از استفاده زنده بودنشان را چک کن) |
| قوانین Clash | تابع `clashConfig` ← بخش `rules:` |
| قوانین و DNS در sing-box | تابع `singboxConfig` ← `dns.rules` و `route.rules` |
| نام نودها | `buildNodes` ← فیلد `name` |
| نودهای بدون TLS یا TLS | `buildNodes` (۷ اول بدون TLS، ۶ تای آخر TLS) |
| متن و ظاهر صفحه | `renderPage` (متغیر `note` برای خطوط بالای صفحه) |
| صفحه‌ی ۴۰۴ | تابع `notFound` |

مثال‌ها:

- **دامنه‌ای را مستقیم (بدون پراکسی) کنی:** در `singboxConfig` داخل `route.rules` و `dns.rules` به `domain_suffix` اضافه کن (مثل `[".ir", ".example.com"]`) و در `clashConfig` یک خط `- DOMAIN-SUFFIX,example.com,DIRECT` قبل از `MATCH` بگذار.
- **چند کاربر:** Trojan در این اسکریپت فقط یک رمز دارد. برای کاربر جدا، یک ورکر جدا با رمز دیگر دیپلوی کن.
- **پنهان‌تر شدن:** `decoy` را روی یک سایت معمولی بگذار تا مسیرهای ناشناس محتوای واقعی برگردانند.
- **اضافه‌کردن نود:** تعداد نودها در کد ثابت ۱۳ است؛ برای تغییر باید حلقه‌ی `buildNodes` و آرایه‌های پیش‌فرض را گسترش بدهی.

نام پروتکل در کد عمداً به‌صورت escape (`\u...`) نوشته شده تا خود کلمه در سورس نباشد؛ هنگام ویرایش ثابت `P` را تغییر نده.

<a id="fa-domain"></a>
## دامنه‌ی سفارشی

1. دامنه‌ات را به Cloudflare اضافه کن (NS را عوض کن).
2. Worker → **Settings → Domains & Routes → Add → Custom domain** و یک ساب‌دامین مثل `proxy.example.com` بده (رکورد پروکسی‌شده/نارنجی خودکار ساخته می‌شود).
3. در کلاینت `host` و `sni` را همان دامنه بگذار؛ صفحه‌ی کانفیگ این را خودکار می‌سازد.

<a id="fa-sec"></a>
## چک‌لیست امنیتی

- [ ] `pswd` را تغییر دادم و به‌صورت **Secret** ذخیره کردم.
- [ ] آدرس `/KEY` و لینک‌های اشتراک را فقط به افراد مورد اعتماد دادم؛ هر کس آن را داشته باشد می‌تواند از ورکر استفاده کند.
- [ ] ProxyIPها را با IPهای مطمئن جایگزین کردم.
- [ ] مسیر ناشناس فقط ۴۰۴ یا صفحه‌ی `decoy` برمی‌گرداند و چیزی لو نمی‌دهد.
- [ ] اگر مقدار `pswd` جایی منتشر شد (چت، مخزن عمومی)، فوراً عوضش کردم.
- [ ] کد را با مقدارهای حساس واقعی داخلش در مخزن عمومی نگذاشتم.

<a id="fa-trouble"></a>
## عیب‌یابی

| علامت | علت محتمل | راه‌حل |
|---|---|---|
| صفحه‌ی ۵۰۰ با `pswd is not set or too weak` | متغیر ست نشده یا فرمت غلط | رمز با ۸ کاراکتر یا بیشتر از `A-Z a-z 0-9 . _ ~ -` بگذار |
| `/KEY` ۴۰۴ می‌دهد | مسیر اشتباه یا Secret جدید deploy نشده | مقدار دقیق `pswd` را بررسی و دوباره Deploy کن (در Pages: دیپلوی جدید) |
| صفحه باز می‌شود ولی اتصال برقرار نمی‌شود | آدرس بهینه یا پورت از ISP تو بسته است | اسکنر را اجرا و ip/pt را عوض کن |
| فقط نودهای بدون TLS کار می‌کنند | دامنه/SNI فیلتر است | دامنه‌ی سفارشی بگیر و Fragment را روشن کن |
| نودهای TLS کار نمی‌کنند | کلاینت Fragment ندارد یا خاموش است | Fragment را فعال یا کلاینت را عوض کن |
| وصل می‌شود ولی بعضی سایت‌ها باز نمی‌شوند | مقصد پشت کلودفلر است و ProxyIP خراب است | `proxyip` را با IP سالم عوض کن |
| دانلود rule-set در sing-box خطا می‌دهد | آدرس rule-set یا دسترسی jsDelivr | آدرس‌ها را بررسی کن یا اول بدون این قوانین وصل شو |
| دامنه‌های بهینه اشتباه resolve می‌شوند | مسمومیت DNS ISP | در `ip1..ip13` به‌جای دامنه IP بگذار (`cf_scan.py --use-ip`) |
| خطای `1101` یا `Exceeded` در کلودفلر | خطای اجرا یا محدودیت پلن | لاگ را با `npx wrangler tail` ببین و محدودیت‌ها را چک کن |

<a id="fa-limits"></a>
## محدودیت‌ها و نکات قانونی

- پلن رایگان Workers سقف درخواست روزانه دارد (در زمان نگارش حدود ۱۰۰٬۰۰۰ در روز؛ هر اتصال WebSocket یک درخواست حساب می‌شود). مقدار فعلی را در مستندات Cloudflare چک کن.
- Cloudflare ممکن است استفاده‌ی حجیم یا شبیه سرویس عمومی پراکسی را محدود کند. مسئولیت استفاده با خودت است؛ شرایط استفاده‌ی Cloudflare و قوانین محل زندگی‌ات را بررسی کن و ورکر را عمومی نکن.
- این ابزار گمنامی کامل نمی‌دهد: ترافیک از زیرساخت Cloudflare و حساب تو عبور می‌کند.

<a id="fa-credits"></a>
## تغییرات نسبت به نسخه‌ی اصلی و اعتبار

بر پایه‌ی پروژه‌های متن‌باز edgetunnel و مخزن Cloudflare-vless-trojan ساخته شده است؛ شرایط مجوز پروژه‌ی اصلی را رعایت کن. تغییرات این نسخه: ایرانی‌سازی، رفع آسیب‌پذیری‌ها و باگ‌ها، بازسازی کد، صفحه‌ی دوزبانه، و SHA-224 داخلی به‌جای کتابخانه‌ی js-sha256 که حدود ۶۵۰ خط بود.

</div>

---

<a id="english"></a>

# English guide

## Contents
1. [What is this?](#en-about)
2. [Files](#en-files)
3. [Requirements](#en-req)
4. [Deploy](#en-deploy) — dashboard, Wrangler, Pages
5. [Environment variables](#en-env)
6. [Subscription URLs & clients](#en-sub)
7. [Preferred addresses](#en-scan)
8. [ProxyIP and `/pyip=`](#en-proxyip)
9. [Customizing the code](#en-custom)
10. [Custom domain](#en-domain)
11. [Security checklist](#en-sec)
12. [Troubleshooting](#en-trouble)
13. [Limits & legal notes](#en-limits)
14. [Changes from upstream & credits](#en-credits)

<a id="en-about"></a>
## What is this?

A Cloudflare Worker script (**Trojan** edition) that provides a WebSocket-based proxy, a bilingual (fa/en) config page, and subscription links for v2ray-style clients, Clash-meta and sing-box. The upstream script was tuned for users in China; this edition is reworked for Iran and hardened:

- Routing/DNS rules for **Iran** (`.ir`, `geosite-ir`, `geoip-ir`, `GEOIP,IR`) instead of China.
- Fixes for the `/pyip=` flaw (anyone could globally change the ProxyIP), the `request.cf` leak, XSS in the config page, and several error-handling bugs.
- Unknown paths return an nginx-style 404 (or reverse-proxy a site of your choice via `decoy`).
- Configs are generated from one node list instead of 13 copy-pasted blocks; the code is ~600 lines.
- All env var names stay compatible with the previous version.
- TCP only (no UDP). The password is both the proxy password and the secret path of the config page; the worker refuses to run without `pswd` (the weak default `trojan` was removed).

<a id="en-files"></a>
## Files

| File | Purpose |
|---|---|
| `_worker.js` | the **Trojan** script (this folder) |
| `README.md` | this guide |

> The preferred-address scanner (`cf_scan.py`) lives in its own folder and works with both editions. The VLESS edition has its own folder too; you don't need to deploy both.

<a id="en-req"></a>
## Requirements

- A Cloudflare account (free plan is enough).
- (Optional but recommended) your own **domain** on Cloudflare — `workers.dev` is filtered on many networks.
- For CLI deploys: Node.js and npm (Ubuntu: `sudo apt install nodejs npm`).

<a id="en-deploy"></a>
## Deploy

### Option 1: Cloudflare dashboard (easiest)

1. Go to **Workers & Pages → Create → Create Worker**, name it, **Deploy**.
2. Click **Edit code**, delete the template, paste the contents of `_worker.js`, **Deploy**.
3. Open **Settings → Variables and Secrets** and add variables (see [env](#en-env)). Minimum: `pswd`, created as a **Secret**.
4. Deploy again. Your config page:
   `https://<name>.<your-subdomain>.workers.dev/<pswd>`

Generate a safe value:

```bash
# letters/digits only, satisfies the password rule
openssl rand -hex 12
```

### Option 2: Wrangler (CLI)

```bash
mkdir my-worker && cd my-worker
# copy _worker.js here
cat > wrangler.toml <<'EOF'
name = "my-worker"
main = "_worker.js"
compatibility_date = "2025-01-01"

[vars]
cdnip = "www.speedtest.net"
# ip1 = "..."   pt1 = "80"      ... (see preferred addresses)
EOF

npx wrangler login
npx wrangler secret put pswd
npx wrangler deploy
```

> If the Cloudflare API is blocked on your network, run wrangler through a proxy/VPN.

### Option 3: Cloudflare Pages

1. Create a folder and put `_worker.js` inside it (exact name).
2. **Workers & Pages → Create → Pages → Upload assets**, upload the folder and deploy.
3. Add variables under **Settings → Variables and Secrets** (Production) and **redeploy** (Pages applies variable changes only on a new deployment).
4. The config page is served on `*.pages.dev` or your custom domain. On hosts that don't contain `workers.dev`, only **TLS nodes** are shown/generated.

### Quick test after deploying

```bash
# should return an nginx-style 404 (worker is alive, nothing leaked)
curl -i https://YOUR-HOST/anything

# should return 101 Switching Protocols (WebSocket path is healthy)
curl -i -N https://YOUR-HOST/?ed=2560 \
  -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: SGVsbG8gd29ybGQhIQ=="
```

<a id="en-env"></a>
## Environment variables

All values are strings. Anything you don't set falls back to the defaults at the top of the file.

| Variable | Required | Description |
|---|---|---|
| `pswd` | **yes** | Password; 8+ chars from `A-Z a-z 0-9 . _ ~ -`. It is both the proxy password and the secret path of the config page. Without it the worker returns 500 |
| `proxyip` | no | One or more ProxyIPs, comma-separated, e.g. `1.2.3.4:443,[2606:4700::1]:443,example.com`. Port defaults to 443 |
| `cdnip` | no | Address used in the **single-node links** (ports 8880 / 8443) on the config page |
| `ip1` … `ip7` | no | Preferred address of the 7 **non-TLS** nodes (HTTP ports) |
| `ip8` … `ip13` | no | Preferred address of the 6 **TLS** nodes (HTTPS ports) |
| `pt1` … `pt13` | no | Port of each node. Defaults: `80, 8080, 8880, 2052, 2082, 2086, 2095` and `443, 8443, 2053, 2083, 2087, 2096` |
| `decoy` | no | Hostname (no `https://`) to reverse-proxy for unknown paths. Empty = nginx-style 404 |

Example `wrangler.toml` with preferred addresses:

```toml
[vars]
cdnip = "www.speedtest.net"
ip1 = "www.speedtest.net"
pt1 = "80"
ip8 = "104.18.2.3"
pt8 = "443"
proxyip = "203.0.113.10:443,203.0.113.11:443"
decoy = "www.example.com"
```

<a id="en-sub"></a>
## Subscription URLs & clients

After deploying (`KEY` is your `pswd`):

| URL | Content |
|---|---|
| `/KEY` | Config page (bilingual) |
| `/KEY/ty` | Aggregated base64 subscription — 13 nodes |
| `/KEY/cl` | Clash-meta config — only the 6 TLS nodes (Trojan in Clash is always TLS) |
| `/KEY/sb` | sing-box config — 13 nodes |
| `/KEY/pty` · `/KEY/pcl` · `/KEY/psb` | Same, but only the 6 TLS nodes |

- On `workers.dev` the page shows both node groups (TLS and non-TLS); on a custom domain only TLS.
- Add `/KEY/ty` as a **Subscription** in clients such as v2rayNG, Hiddify, NekoBox or sing-box. Use `/KEY/cl` for Clash and `/KEY/sb` for sing-box.
- **TLS** nodes are usually unreliable in Iran without **Fragment**; enable it if your client has it.
- The WebSocket path is always `/?ed=2560`.
- The sing-box config targets versions **1.11–1.12**; newer versions warn about the legacy DNS format.
- **UDP is not supported** (Discord, voice/video calls and QUIC won't work). In the generated configs DNS goes through the tunnel over TCP/DoH.

<a id="en-scan"></a>
## Preferred addresses

A "preferred address" is the domain or Cloudflare IP your client connects to while sending your worker's `Host`. Which ones work depends on your ISP and connection type, so scan from your own network.

`cf_scan.py` (in the scanner folder) does this and outputs ready-to-use env lines:

```bash
python3 cf_scan.py --worker proxy.example.com
# output (worker_vars.txt):  ip1 = "..."  pt1 = "80"  ...  ip13 = "..."  pt13 = "2096"
```

Paste the output into the dashboard Variables or the `[vars]` block of `wrangler.toml`. Details are in the scanner's README. Note: every scanner probe counts as a request to your worker.

<a id="en-proxyip"></a>
## ProxyIP and `/pyip=`

Workers can't connect directly to some destinations (notably sites behind Cloudflare itself). If the direct connection returns no data, the worker **retries once through a ProxyIP**.

- The default list in the code (`DEFAULT_PROXY_IPS`) belongs to third parties and can read non-TLS traffic. **Replace it with IPs you trust** (`proxyip` env).
- One entry from the list is picked at random on every retry.
- To pick a ProxyIP for a single connection, set the client path to `/pyip=1.2.3.4:443?ed=2560`. It applies to that connection only (and only after authentication) and accepts only a valid IP/hostname.

<a id="en-custom"></a>
## Customizing the code

The constants at the top are defaults; env vars override them:

| What | Where |
|---|---|
| ProxyIP list | `DEFAULT_PROXY_IPS` |
| Default addresses/ports | `DEFAULT_CDNIP`, `DEFAULT_ADDRS` (13), `DEFAULT_PORTS` |
| Password hash | `sha224hex` (built-in SHA-224; WebCrypto lacks it) |
| sing-box Iran rule-sets | `GEOSITE_IR_URL`, `GEOIP_IR_URL` (verify they're alive before use) |
| Clash rules | `clashConfig` → `rules:` section |
| sing-box rules & DNS | `singboxConfig` → `dns.rules` and `route.rules` |
| Node names | `buildNodes` → `name` |
| Which nodes are TLS/non-TLS | `buildNodes` (first 7 non-TLS, last 6 TLS) |
| Page text and look | `renderPage` (the `note` variable holds the top lines) |
| 404 page | `notFound` |

Recipes:

- **Send a domain direct (bypass the proxy):** add it to the `domain_suffix` arrays in `singboxConfig` (`dns.rules` and `route.rules`, e.g. `[".ir", ".example.com"]`) and add `- DOMAIN-SUFFIX,example.com,DIRECT` before `MATCH` in `clashConfig`.
- **Several users:** this Trojan script supports a single password. For separate users, deploy another worker with a different password.
- **Look more ordinary:** set `decoy` to a normal site so unknown paths return real content.
- **Changing the node count:** it is fixed at 13; extend the `buildNodes` loop and the default arrays to change it.

The protocol name is intentionally written as `\u...` escapes so the literal word isn't in the source; leave the `P` constant as it is when editing.

<a id="en-domain"></a>
## Custom domain

1. Add your domain to Cloudflare (switch its nameservers).
2. Worker → **Settings → Domains & Routes → Add → Custom domain**, e.g. `proxy.example.com` (a proxied/orange record is created automatically).
3. Use the same domain as `host` and `sni` in the client; the config page does this for you.

<a id="en-sec"></a>
## Security checklist

- [ ] I changed `pswd` and stored it as a **Secret**.
- [ ] I only share the `/KEY` page and subscription links with people I trust — anyone holding them can use the worker.
- [ ] I replaced the ProxyIPs with ones I trust.
- [ ] Unknown paths return only the 404 / `decoy` page and reveal nothing.
- [ ] If `pswd` ever leaked (chat, public repo), I rotated it immediately.
- [ ] I don't publish the code with real secrets inside it.

<a id="en-trouble"></a>
## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| 500 with `pswd is not set or too weak` | variable missing or wrong format | use 8+ characters from `A-Z a-z 0-9 . _ ~ -` |
| `/KEY` returns 404 | wrong path, or the new Secret wasn't deployed | verify the exact `pswd` and redeploy (Pages: new deployment) |
| Page loads but connections fail | preferred address/port blocked by your ISP | run the scanner, change ip/pt |
| Only non-TLS nodes work | domain/SNI is filtered | use a custom domain and enable Fragment |
| TLS nodes don't work | client lacks Fragment or it's off | enable Fragment or switch client |
| Connects but some sites fail | destination is behind Cloudflare and the ProxyIP is bad | set a healthy `proxyip` |
| sing-box rule-set download errors | rule-set URL or jsDelivr access | verify the URLs, or connect first without those rules |
| Preferred domains resolve wrongly | ISP DNS poisoning | use IPs in `ip1..ip13` (`cf_scan.py --use-ip`) |
| Cloudflare `1101` / `Exceeded` | runtime error or plan limit | check `npx wrangler tail` and your plan limits |

<a id="en-limits"></a>
## Limits & legal notes

- The free Workers plan has a daily request cap (about 100,000/day at the time of writing; each WebSocket connection counts as one request). Check Cloudflare's current limits.
- Cloudflare may restrict heavy or public-proxy-like usage. Use is at your own responsibility; review Cloudflare's terms and your local law, and don't make the worker public.
- This does not give you full anonymity: traffic passes through Cloudflare's infrastructure and your account.

<a id="en-credits"></a>
## Changes from upstream & credits

Built on the open-source edgetunnel work and the Cloudflare-vless-trojan repository; follow the original project's license terms. Changes here: Iran localization, vulnerability and bug fixes, code restructuring, bilingual page, and a built-in SHA-224 replacing the ~650-line bundled js-sha256 library.
