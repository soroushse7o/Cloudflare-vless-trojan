# CloudflareSpeedTest - اسکریپت‌ها (نسخه‌ی فینگلیش)

این پوشه شامل اسکریپت‌هایی است که **CFST** را صدا می‌زنند و **قابلیت‌های شخصی‌سازی‌شده‌ی بیشتری** به آن اضافه می‌کنند.

> [!TIP]
> CFST عمداً یک **برنامه‌ی خط فرمان** است تا با نرم‌افزارها و اسکریپت‌های دیگر به‌راحتی ترکیب شود. اسکریپت‌ها CFST را اجرا می‌کنند، نتیجه را می‌خوانند و **خودتان تصمیم می‌گیرید** با آن چه کنید (مثلاً ویرایش Hosts).

> [!IMPORTANT]
> همه‌ی اسکریپت‌ها CFST را با پارامتر **`-nomenu`** اجرا می‌کنند تا «منوی صفحه‌ی اول» نمایش داده نشود و اسکریپت بدون پرسش و پاسخ کار کند. اگر خودتان اسکریپت می‌نویسید، همین پارامتر را اضافه کنید.

> [!NOTE]
> متن‌ها و پیام‌های داخل اسکریپت‌ها عمداً **فینگلیش** (فارسی با حروف لاتین) هستند تا در ترمینال‌ها و کنسول‌های ویندوز دچار مشکل رمزگذاری (encoding) نشوند. فقط فایل‌های README فارسی هستند.

****

## 📑 cfst_hosts.sh / cfst_hosts.bat / cfst_hosts_mac.sh

CFST را اجرا می‌کند، سریع‌ترین IP را می‌گیرد و IP قدیمی Cloudflare CDN را در فایل Hosts عوض می‌کند.

- `cfst_hosts.sh` برای لینوکس، `cfst_hosts_mac.sh` برای macOS و `cfst_hosts.bat` برای ویندوز است.
- بار اول از شما می‌خواهد IP فعلی Cloudflare در Hosts را وارد کنید (همه‌ی IPهای Cloudflare در Hosts باید یکی باشند). این IP در `nowip_hosts.txt` ذخیره می‌شود.
- پیش از تغییر، از Hosts نسخه‌ی پشتیبان (`hosts_backup`) می‌گیرد.
- اسکریپت‌ها باید با دسترسی مدیر (root / Administrator) اجرا شوند.

> **نویسنده:** [@XIU2](https://github.com/xiu2)  
> **راهنما:** https://github.com/XIU2/CloudflareSpeedTest/discussions/312

****

## 📑 cfst_3proxy.bat

CFST را اجرا می‌کند و IP قدیمی Cloudflare CDN را در فایل تنظیمات 3Proxy با سریع‌ترین IP عوض می‌کند. با این کار می‌توانید همه‌ی IPهای Cloudflare را به سریع‌ترین IP هدایت کنید و دیگر لازم نیست دامنه‌ها را یکی‌یکی به Hosts اضافه کنید.

> قبل از استفاده، مسیر `D:\Program Files\3Proxy` داخل اسکریپت را به مسیر نصب 3Proxy خودتان تغییر دهید.

> **نویسنده:** [@XIU2](https://github.com/xiu2)  
> **راهنما:** https://github.com/XIU2/CloudflareSpeedTest/discussions/71

****

## 📑 cfst_ddns.sh / cfst_ddns.bat

اگر دامنه‌ی شما روی **Cloudflare** است، با API رسمی آن می‌توانید رکورد DNS را خودکار روی سریع‌ترین IP تنظیم کنید.

- در لینوکس تنظیمات از فایل `cfst_ddns.conf` خوانده می‌شود (`FOLDER`، `ZONE_ID`، `DNS_RECORDS_ID`، `KEY`، `EMAIL`، `TYPE`، `NAME`، `TTL`، `PROXIED`).
- اگر `EMAIL` خالی باشد، از روش **API Token** و در غیر این صورت از روش **API Key** استفاده می‌شود.
- در نسخه‌ی ویندوز، مقادیر `ZONE_ID`، `DNS_RECORD_ID`، `EMAIL-E-HESAB`، `API-KEY-E-ghabli` و `DOMAIN-E-KAMEL` داخل خود فایل `.bat` باید با مقادیر واقعی جایگزین شوند.

> **نویسنده:** [@XIU2](https://github.com/xiu2)  
> **راهنما:** https://github.com/XIU2/CloudflareSpeedTest/discussions/481

****

## 📑 cfst_dnspod.sh

اگر دامنه‌ی شما روی **DNSPod** است، با API آن رکورد A و AAAA را روی سریع‌ترین IP (IPv4 و IPv6) به‌روز می‌کند. مقادیر `API_TOKEN`، `DOMAIN` و `SUB_DOMAIN` از متغیرهای محیطی خوانده می‌شوند و برنامه‌ی `jq` لازم است.

> **نویسنده:** [@imashen](https://github.com/imashen)  
> **راهنما:** https://github.com/XIU2/CloudflareSpeedTest/pull/533

****

## 📑 cfst_dnsmasq.sh

CFST را اجرا می‌کند و سریع‌ترین IP را برای همه‌ی دامنه‌های فایل `site.conf` در فایل تنظیمات dnsmasq می‌نویسد، سپس سرویس dnsmasq را ری‌استارت می‌کند. برای IPv6 خطوط کامنت‌شده را فعال کنید.

> **نویسنده:** [@Sving1024](https://github.com/Sving1024)  
> **راهنما:** https://github.com/XIU2/CloudflareSpeedTest/discussions/566

****

## نکته‌ها برای نوشتن اسکریپت شخصی

- فایل نتیجه همیشه ستون اول = IP است و خط اول سرستون (header) است؛ پس سریع‌ترین IP در خط دوم است (`sed -n "2,1p"` یا `skip=1` در bat).
- برای خروجی ساده‌ی فقط-IP می‌توانید از `-otxt result.txt` استفاده کنید (هر خط یک IP).
- برای خروجی قابل‌پردازش با برنامه‌ها از `-ojson result.json` استفاده کنید.
- همیشه `-nomenu` را بگذارید.

## پیشنهاد و گزارش مشکل

اگر مشکلی داشتید، اول در صفحه‌ی راهنمای همان اسکریپت (لینک‌های بالا) ببینید کسی پرسیده است یا نه؛ در غیر این صورت همان‌جا کامنت بگذارید.
