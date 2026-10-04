<div align="center">

# Cloudflare-vless-trojan

**نصب شخصی روی حساب خودتان، با یک کلیک و بدون دانش فنی**
**Your own private install on your own Cloudflare account — one click, no technical knowledge**

[🚀 ویزارد نصب / Install Wizard](https://wizard.cfpanel-se7o.workers.dev/)

[فارسی](#فارسی) · [English](#english)

</div>

---

<a id="فارسی"></a>

<div dir="rtl">

## فارسی

### این پروژه چیست؟

اسکریپت‌های VLESS و Trojan برای Cloudflare Workers/Pages همراه با یک **ویزارد نصب**. ویزارد کاری می‌کند که یک کاربر عادی بدون کپی‌کردن کد، بدون ویرایش متغیرها و بدون کار با ترمینال، پروژه را **روی حساب کلادفلر خودش** نصب کند.

### نصب در ۴ مرحله

1. در Cloudflare [ثبت‌نام](https://dash.cloudflare.com/sign-up) کنید و حساب را تأیید کنید.
2. [ویزارد نصب](https://wizard.cfpanel-se7o.workers.dev/) را باز کنید و از همان صفحه روی لینک **ساخت توکن** بزنید. در صفحه‌ی کلادفلر روی **Continue to summary** و بعد **Create Token** بزنید و توکن را کپی کنید. (دسترسی‌های لازم از قبل در لینک تنظیم شده‌اند.)
3. توکن را در ویزارد بچسبانید، روش نصب (**Workers** یا **Pages**) و پروتکل (**VLESS** یا **Trojan**) را انتخاب کنید و **نصب** را بزنید.
4. بعد از چند ثانیه یک **لینک خصوصی (Private Link)** می‌گیرید. این لینک همان **پنل دریافت کانفیگ‌ها و اشتراک** شماست. آن را کپی و در جای امن نگه دارید.

### بعد از نصب چه چیزی می‌گیرم؟

- یک لینک خصوصی به شکل `https://<دامنه‌ی-شما>/<uuid-یا-رمز>` که پنل شما را باز می‌کند.
- در پنل: لینک تکی نودها، لینک و اشتراک تجمیعی، و اشتراک **sing-box** و **clash** (برای کلاینت‌هایی که اشتراک می‌خواهند).
- مقدار uuid (برای VLESS) یا رمز عبور (برای Trojan) که ویزارد نمایش می‌دهد؛ همان بخش آخر لینک است.

> اگر لینک را گم کردید، uuid یا رمز را می‌توانید در داشبورد کلادفلر، بخش **Variables** همان Worker یا پروژه‌ی Pages پیدا کنید (نام متغیر: `uuid` برای VLESS و `pswd` برای Trojan).

### Workers یا Pages؟

| | Workers | Pages |
|---|---|---|
| آدرس | `*.workers.dev` | `*.pages.dev` |
| متغیرهای IP/پورت | هر ۱۳ جفت (`ip1..ip13` و `pt1..pt13`) | ۶ جفت اول (`ip1..ip6` و `pt1..pt6`) |
| `cdnip` | ✔ | ✔ |

اگر یکی از دو آدرس در شبکه‌ی شما مسدود بود، روش دیگر را امتحان کنید. اگر مشکل اتصال TLS دارید، در کلاینت گزینه‌ی **Fragment** را روشن کنید.

### حریم خصوصی و امنیت

- ویزارد **هیچ داده‌ای ذخیره نمی‌کند**. توکن شما فقط برای درخواست‌های همین نصب و مستقیم به API کلادفلر استفاده می‌شود.
- توکن تا وقتی صفحه را نبسته‌اید یا رفرش نکرده‌اید در کادر می‌ماند تا اگر خواستید دوباره نصب کنید، لازم نباشد دوباره واردش کنید. با بستن یا رفرش صفحه پاک می‌شود.
- هر نصب **کاملاً رندوم** است: uuid یا رمز تصادفی، و نام Worker/Pages تصادفی و خنثی (بدون کلمه‌های vless و trojan).
- پس از پایان کار، اگر می‌خواهید، توکن را از [داشبورد کلادفلر](https://dash.cloudflare.com/profile/api-tokens) حذف کنید.

### کلاینت‌های پیشنهادی

- **اندروید:** [v2rayNG](https://github.com/2dust/v2rayNG/tags)، [NekoBox](https://github.com/starifly/NekoBoxForAndroid/releases)، [Karing](https://github.com/KaringX/karing/tags)
- **ویندوز:** [v2rayN](https://github.com/2dust/v2rayN/tags)، [Hiddify](https://github.com/hiddify/hiddify-next/tags)، [Karing](https://github.com/KaringX/karing/tags)
- **iOS:** Karing، Hiddify، Shadowrocket، Streisand

همه‌ی کلاینت‌های clash/mihomo و sing-box هم مناسب‌اند. نکته: بعضی کلاینت‌ها (Shadowrocket، v2box، v2rayN، v2rayNG) برای `trojan+ws` به‌اجبار TLS را روشن می‌کنند و همین می‌تواند باعث کار نکردن نودهای بدون TLS شود؛ اشتراک clash هم نود `trojan+ws` ندارد.

### نصب دستی و متغیرها (پیشرفته)

کاربران عادی به این بخش نیازی ندارند؛ ویزارد همه‌ی این‌ها را خودکار انجام می‌دهد.

| متغیر | کاربرد | توضیح |
|---|---|---|
| `uuid` | VLESS | uuid شما؛ ویزارد یک مقدار رندوم می‌سازد |
| `pswd` | Trojan | رمز عبور؛ ویزارد یک مقدار رندوم می‌سازد |
| `proxyip` | اختیاری | برای دسترسی به سایت‌های پشت CF. پورت 443: `IPv4` / `[IPv6]` / دامنه. پورت‌های دیگر: `IPv4:پورت` / `[IPv6]:پورت` / `دامنه:پورت` |
| `ip1`..`ip13` / `pt1`..`pt13` | اختیاری | IP یا دامنه‌ی بهینه و پورت آن‌ها برای نودهای اشتراک |
| `cdnip` | اختیاری | دامنه‌ی بهینه‌ی پیش‌فرض |

- `ip1..ip7` و `pt1..pt7` نودهای **بدون TLS** (پورت‌های سری ۸۰: 80، 8080، 8880، 2052، 2082، 2086، 2095) را می‌سازند.
- `ip8..ip13` و `pt8..pt13` نودهای **TLS** (پورت‌های سری ۴۴۳: 443، 2053، 2083، 2087، 2096، 8443) را می‌سازند.
- **proxyip برای یک نود:** در مسیر (path) نود بنویسید `/pyip=آدرس` (یا `/pyip=آدرس:پورت`). اگر `/pyip=` در مسیر باشد، proxyip سراسری برای آن نود نادیده گرفته می‌شود.

### ساختار پروژه

| پوشه | محتوا |
|---|---|
| `cfpanel_wizard` | ویزارد نصب (یک فایل Worker) |
| `Vless_workers_pages` | اسکریپت VLESS برای Workers/Pages |
| `Trojan_workers_pages` | اسکریپت Trojan برای Workers/Pages |
| `s5http_wkpgs` | پراکسی محلی Socks5/Http (سرور + کلاینت) |
| `CF-Workers-CheckSocks5` | ابزار بررسی Socks5 |
| `clean-cf-ipfinder+SpeedTest` | یافتن IP تمیز کلادفلر و تست سرعت |

### ابزارهای جانبی

این ابزارها برای نصب با ویزارد لازم نیستند و برای کاربران پیشرفته‌ترند.

#### [s5http_wkpgs](https://github.com/soroushse7o/Cloudflare-vless-trojan/tree/main/s5http_wkpgs)
پراکسی محلی **Socks5/Http** روی Cloudflare (بخش سرور روی Workers/Pages و بخش کلاینت روی دستگاه خودتان). سه حالت دارد: **ECH-TLS**، **TLS عادی** و **بدون TLS**. اسکریپت نصب روی لینوکس/روتر و ایمیج Docker هم دارد. توضیح کامل و متغیرها در README همان پوشه است.

#### [CF-Workers-CheckSocks5](https://github.com/soroushse7o/Cloudflare-vless-trojan/tree/main/CF-Workers-CheckSocks5)
یک Worker برای **بررسی سالم بودن پراکسی‌های Socks5**. آن را روی حساب خودتان اجرا می‌کنید، آدرس پراکسی را می‌دهید و نتیجه‌ی اتصال را می‌بینید. به کار شما می‌آید وقتی از پراکسی Socks5 شخصی استفاده می‌کنید.

#### [clean-cf-ipfinder+SpeedTest](https://github.com/soroushse7o/Cloudflare-vless-trojan/tree/main/clean-cf-ipfinder%2BSpeedTest)
ابزار پیدا کردن **IP تمیز کلادفلر** و **تست سرعت** آن‌ها (بر پایه‌ی CloudflareSpeedTest). IPهای سالم و سریع را روی شبکه‌ی خودتان پیدا می‌کنید و می‌توانید در متغیرهای `ip1..ip13` یا `cdnip` استفاده کنید.

### اجرای نسخه‌ی شخصی ویزارد (اختیاری)

اگر نمی‌خواهید از ویزارد عمومی استفاده کنید، یک Worker جدید در حساب خودتان بسازید و محتوای فایل ویزارد (`_worker.js` داخل پوشه‌ی `cfpanel_wizard`) را در آن قرار دهید. ویزارد خودش اسکریپت‌ها را از همین مخزن می‌گیرد.

### سلب مسئولیت

استفاده از این پروژه با مسئولیت خود شماست. قوانین کشور محل زندگی و [شرایط استفاده‌ی Cloudflare](https://www.cloudflare.com/terms/) را رعایت کنید.

</div>

---

<a id="english"></a>

## English

### What is this?

VLESS and Trojan scripts for Cloudflare Workers/Pages, plus an **Install Wizard**. The wizard lets a regular user install the project **on their own Cloudflare account** without copying code, editing variables or touching a terminal.

### Install in 4 steps

1. [Sign up](https://dash.cloudflare.com/sign-up) for a Cloudflare account and verify it.
2. Open the [Install Wizard](https://wizard.cfpanel-se7o.workers.dev/) and click **Create a token** on that page. On the Cloudflare page click **Continue to summary**, then **Create Token**, and copy the token. (The required permissions are already set in the link.)
3. Paste the token into the wizard, choose the method (**Workers** or **Pages**) and protocol (**VLESS** or **Trojan**), then press **Install**.
4. After a few seconds you get a **Private Link**. It is your **panel for getting configs and subscriptions**. Copy it and keep it somewhere safe.

### What do I get?

- A private link like `https://<your-domain>/<uuid-or-password>` that opens your panel.
- In the panel: single-node links, aggregated links and subscriptions, plus **sing-box** and **clash** subscriptions (for clients that need one).
- The uuid (VLESS) or password (Trojan) shown by the wizard — it is the last part of the link.

> If you lose the link, you can find the uuid or password in the Cloudflare dashboard under **Variables** of that Worker or Pages project (variable name: `uuid` for VLESS, `pswd` for Trojan).

### Workers or Pages?

| | Workers | Pages |
|---|---|---|
| Address | `*.workers.dev` | `*.pages.dev` |
| IP/port variables | all 13 pairs (`ip1..ip13`, `pt1..pt13`) | first 6 pairs (`ip1..ip6`, `pt1..pt6`) |
| `cdnip` | ✔ | ✔ |

If one address is blocked on your network, try the other method. If you have TLS connection problems, enable **Fragment** in your client.

### Privacy & security

- The wizard **stores nothing**. Your token is only used for the requests of this install, sent directly to the Cloudflare API.
- The token stays in the input box until you close or refresh the page, so you can install again without re-entering it. Closing or refreshing clears it.
- Every install is **completely random**: random uuid or password, and a random neutral Worker/Pages name (no "vless" or "trojan" in it).
- When you are done, you can delete the token from the [Cloudflare dashboard](https://dash.cloudflare.com/profile/api-tokens).

### Recommended clients

- **Android:** [v2rayNG](https://github.com/2dust/v2rayNG/tags), [NekoBox](https://github.com/starifly/NekoBoxForAndroid/releases), [Karing](https://github.com/KaringX/karing/tags)
- **Windows:** [v2rayN](https://github.com/2dust/v2rayN/tags), [Hiddify](https://github.com/hiddify/hiddify-next/tags), [Karing](https://github.com/KaringX/karing/tags)
- **iOS:** Karing, Hiddify, Shadowrocket, Streisand

All clash/mihomo and sing-box clients work too. Note: some clients (Shadowrocket, v2box, v2rayN, v2rayNG) force TLS on for `trojan+ws`, which can break non-TLS nodes; clash subscriptions contain no `trojan+ws` nodes.

### Manual install & variables (advanced)

Regular users don't need this section — the wizard does all of it automatically.

| Variable | Used for | Notes |
|---|---|---|
| `uuid` | VLESS | your uuid; the wizard generates a random one |
| `pswd` | Trojan | password; the wizard generates a random one |
| `proxyip` | optional | reach CF-hosted sites. Port 443: `IPv4` / `[IPv6]` / domain. Other ports: `IPv4:port` / `[IPv6]:port` / `domain:port` |
| `ip1`..`ip13` / `pt1`..`pt13` | optional | preferred IPs/domains and their ports for subscription nodes |
| `cdnip` | optional | default preferred domain |

- `ip1..ip7` / `pt1..pt7` build the **non-TLS** nodes (80-series ports: 80, 8080, 8880, 2052, 2082, 2086, 2095).
- `ip8..ip13` / `pt8..pt13` build the **TLS** nodes (443-series ports: 443, 2053, 2083, 2087, 2096, 8443).
- **proxyip for a single node:** put `/pyip=address` (or `/pyip=address:port`) in the node's path. When `/pyip=` is present, the global proxyip is ignored for that node.

### Project structure

| Folder | Contents |
|---|---|
| `cfpanel_wizard` | the Install Wizard (a single Worker file) |
| `Vless_workers_pages` | VLESS script for Workers/Pages |
| `Trojan_workers_pages` | Trojan script for Workers/Pages |
| `s5http_wkpgs` | local Socks5/Http proxy (server + client) |
| `CF-Workers-CheckSocks5` | Socks5 checker tool |
| `clean-cf-ipfinder+SpeedTest` | clean Cloudflare IP finder and speed test |

### Extra tools

These are not needed for the wizard install and are meant for more advanced users.

#### [s5http_wkpgs](https://github.com/soroushse7o/Cloudflare-vless-trojan/tree/main/s5http_wkpgs)
A local **Socks5/Http** proxy on Cloudflare (the server part runs on Workers/Pages, the client part on your own device). Three modes: **ECH-TLS**, **plain TLS** and **no TLS**. It also has an install script for Linux/routers and a Docker image. Full details and variables are in that folder's README.

#### [CF-Workers-CheckSocks5](https://github.com/soroushse7o/Cloudflare-vless-trojan/tree/main/CF-Workers-CheckSocks5)
A Worker that **checks whether Socks5 proxies work**. You run it on your own account, enter a proxy address and see the connection result. Handy if you use a personal Socks5 proxy.

#### [clean-cf-ipfinder+SpeedTest](https://github.com/soroushse7o/Cloudflare-vless-trojan/tree/main/clean-cf-ipfinder%2BSpeedTest)
A tool to find **clean Cloudflare IPs** and **speed-test** them (based on CloudflareSpeedTest). It finds healthy, fast IPs on your own network, which you can use in the `ip1..ip13` or `cdnip` variables.

### Run your own copy of the wizard (optional)

If you'd rather not use the public wizard, create a new Worker in your own account and paste in the wizard file (`_worker.js` inside `cfpanel_wizard`). The wizard fetches the scripts from this repository by itself.

### Disclaimer

Use at your own risk. Follow your local laws and the [Cloudflare Terms of Service](https://www.cloudflare.com/terms/).

---

## Credits / اعتبار

- **Maintained & updated by** [soroushse7o](https://github.com/soroushse7o/) — [project page](https://github.com/soroushse7o/Cloudflare-vless-trojan/)
- **Original author / نویسنده‌ی اصلی:** [yonggekkk (ygkkk)](https://github.com/yonggekkk/Cloudflare_vless_trojan)
- **Code sources / منابع کد:** [ca110us](https://github.com/ca110us/epeius), [emn178](https://github.com/emn178/js-sha256/blob/master/src/sha256.js), [3Kmfi6HP](https://github.com/3Kmfi6HP/EDtunnel), [badafans](https://github.com/badafans/Cloudflare-IP-SpeedTest), [XIU2](https://github.com/XIU2/CloudflareSpeedTest)
