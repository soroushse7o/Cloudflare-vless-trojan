# Cloudflare Install Wizard

**Languages / زبان‌ها:** [English](#english) | [فارسی](#persian)

> English first, Persian (فارسی) below. / ابتدا انگلیسی، سپس فارسی در ادامه.

---

<a id="english"></a>

## English

A small, single-file Cloudflare Worker that installs the
[Cloudflare-vless-trojan](https://github.com/soroushse7o/Cloudflare-vless-trojan)
proxy script on your own Cloudflare account in one click. You paste an API token, pick the
installation method and the protocol, press **Install**, and get a **Private Link** to your node page.

### Features

- Four-step guided page, bilingual (English / Persian) with RTL support.
- Install as **Cloudflare Workers** or **Cloudflare Pages**.
- Protocol dropdown: **VLESS** or **Trojan**.
- Credentials (`uuid` for VLESS, `pswd` for Trojan) are generated randomly for every install and set automatically.
- Status bar: Standby, Deploying, Success, Error, with clear error messages (invalid token, missing permissions, network error, rate limit, and more).
- No dependencies, no build step, no database.

### Privacy

- Nothing is stored. There is no KV, no database and no logging.
- Your token is used only for the requests made during that install, directly against the Cloudflare API, and is never returned to the page.
- The generated uuid/password is shown once on screen and lives only in your deployed Worker/Pages variables.
- Deploy the wizard on **your own** account if you want full control. Never paste a token into a wizard you do not trust.

### Files

| File | Role |
| :--- | :--- |
| `_worker.js` | The whole wizard (page + API). This is the file to deploy. |
| `README.md` | This document. |

### Deploy the wizard

**Option A: Cloudflare Pages with Git (recommended)**

1. Cloudflare dashboard, Workers & Pages, Create, Pages, Connect to Git, choose this repository.
2. Framework preset: `None`. Build command: empty. Build output directory: `/`.
3. Save and Deploy. Open the `*.pages.dev` address.

**Option B: Cloudflare Workers (copy and paste)**

1. Workers & Pages, Create, Create Worker, Deploy the default, then Edit code.
2. Replace everything with the content of `_worker.js`, then Deploy.

### Usage

1. Sign up for a Cloudflare account and verify it.
2. Open **Create a token** on the wizard page, then **Continue to summary**, **Create Token**, and copy the token.
3. Paste the token, choose Workers or Pages, choose VLESS or Trojan, and press **Install**.
4. When the status turns to **Success**, open the **Private Link**. It looks like `https://<name>.<subdomain>.workers.dev/<uuid>` (or `.pages.dev`).

### API token permissions

The token link on the page pre-selects: Workers Scripts (edit), Workers KV Storage (edit), Pages (edit), DNS (edit), User Details (read).
The wizard currently uses Workers Scripts, Pages and User Details. If you create the token by hand, give it at least these.

### Notes

- The installed script is downloaded from the `SOURCES` list at the top of `_worker.js`. Edit the URLs there to use your own fork or a fixed commit.
- Workers mode: TLS nodes need a custom domain, as described in the main project. Pages mode supports TLS nodes.
- If the account has no `workers.dev` subdomain, the wizard creates a random one.
- If the token can access several accounts, the first account is used.
- You can delete the token on the Cloudflare dashboard after installation.
- Installed Workers and Pages run with the runtime region hint `azure:westeurope`. Change or clear `PLACEMENT_REGION` at the top of `_worker.js`. For Pages the hint is applied best-effort: if the API rejects it, the install still succeeds.

---

<a id="persian"></a>

<div dir="rtl">

## فارسی

یک Worker کوچک و تک‌فایل برای کلادفلر که اسکریپت پراکسی
[Cloudflare-vless-trojan](https://github.com/soroushse7o/Cloudflare-vless-trojan)
را با یک کلیک روی حساب کلادفلر خودتان نصب می‌کند. توکن API را می‌چسبانید، روش نصب و پروتکل را انتخاب می‌کنید،
**نصب** را می‌زنید و یک **لینک خصوصی** به صفحه‌ی نود خودتان می‌گیرید.

### امکانات

- صفحه‌ی چهار مرحله‌ای، دوزبانه (فارسی / انگلیسی) با پشتیبانی از راست‌به‌چپ.
- نصب به‌صورت **Cloudflare Workers** یا **Cloudflare Pages**.
- دراپ‌دان پروتکل: **VLESS** یا **Trojan**.
- اطلاعات ورود (`uuid` برای VLESS و `pswd` برای Trojan) برای هر نصب تصادفی ساخته و خودکار تنظیم می‌شود.
- نوار وضعیت: آماده‌باش، در حال نصب، موفق، خطا، همراه با پیام‌های روشن (توکن نامعتبر، دسترسی ناکافی، خطای شبکه، محدودیت نرخ و غیره).
- بدون وابستگی، بدون build و بدون دیتابیس.

### حریم خصوصی

- هیچ چیزی ذخیره نمی‌شود: نه KV، نه دیتابیس و نه لاگ.
- توکن شما فقط برای درخواست‌های همان نصب و مستقیم با API کلادفلر استفاده می‌شود و هرگز به صفحه برنمی‌گردد.
- uuid یا رمز ساخته‌شده یک‌بار روی صفحه نمایش داده می‌شود و فقط در متغیرهای Worker یا Pages شما می‌ماند.
- اگر کنترل کامل می‌خواهید، wizard را روی حساب **خودتان** دپلوی کنید و هرگز توکن را در wizard غیرقابل‌اعتماد وارد نکنید.

### فایل‌ها

| فایل | نقش |
| :--- | :--- |
| `_worker.js` | کل wizard (صفحه و API). همین فایل دپلوی می‌شود. |
| `README.md` | همین راهنما. |

### دپلوی wizard

**روش الف: Cloudflare Pages با Git (پیشنهادی)**

1. داشبورد کلادفلر، Workers & Pages، Create، Pages، Connect to Git و انتخاب همین ریپو.
2. Framework preset: ‏`None`، Build command: خالی، Build output directory: ‏`/`.
3. Save and Deploy و باز کردن آدرس `*.pages.dev`.

**روش ب: Cloudflare Workers (کپی و پیست)**

1. Workers & Pages، Create، Create Worker، Deploy و سپس Edit code.
2. همه‌ی محتوا را با محتوای `_worker.js` جایگزین کنید و Deploy بزنید.

### نحوه‌ی استفاده

1. در Cloudflare ثبت‌نام کنید و حساب را تأیید کنید.
2. در صفحه‌ی wizard روی **ساخت توکن** بزنید، سپس **Continue to summary** و **Create Token** و توکن را کپی کنید.
3. توکن را بچسبانید، Workers یا Pages را انتخاب کنید، VLESS یا Trojan را انتخاب کنید و **نصب** را بزنید.
4. وقتی وضعیت **موفق** شد، **لینک خصوصی** را باز کنید. شکلش `https://<name>.<subdomain>.workers.dev/<uuid>` است (یا `.pages.dev`).

### دسترسی‌های توکن

لینک ساخت توکن در صفحه این دسترسی‌ها را از قبل انتخاب می‌کند: Workers Scripts (edit)، Workers KV Storage (edit)، Pages (edit)، DNS (edit) و User Details (read).
wizard فعلاً از Workers Scripts، Pages و User Details استفاده می‌کند. اگر توکن را دستی می‌سازید، حداقل همین‌ها را بدهید.

### نکته‌ها

- اسکریپت نصب‌شونده از فهرست `SOURCES` در بالای `_worker.js` دانلود می‌شود. برای استفاده از فورک خودتان یا یک commit ثابت، آدرس‌ها را همان‌جا عوض کنید.
- حالت Workers: طبق پروژه‌ی اصلی، نودهای TLS دامنه‌ی سفارشی می‌خواهند. حالت Pages از نودهای TLS پشتیبانی می‌کند.
- اگر حساب subdomain از نوع `workers.dev` نداشته باشد، wizard یکی تصادفی می‌سازد.
- اگر توکن به چند حساب دسترسی داشته باشد، اولین حساب استفاده می‌شود.
- بعد از نصب می‌توانید توکن را از داشبورد کلادفلر حذف کنید.
- Workers و Pages نصب‌شده با Placement Hint برابر `azure:westeurope` اجرا می‌شوند. مقدار `PLACEMENT_REGION` بالای `_worker.js` را می‌توانید عوض یا خالی کنید. برای Pages اعمال آن تلاشی (best-effort) است: اگر API آن را رد کند، نصب بازهم موفق می‌شود.

</div>
