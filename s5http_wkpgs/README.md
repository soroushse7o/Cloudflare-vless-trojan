English (EN)
S5/HTTP Local Proxy for Cloudflare Workers & Pages (s5http_wkpgs)
This repository contains the s5http_wkpgs toolset, designed to integrate with the main Cloudflare-vless-trojan project. This tool allows you to convert your Cloudflare Workers or Pages configurations directly into a local Socks5 or HTTP proxy on your machine or router.
Overview and Purpose
Unlike the main scripts that run on Cloudflare's Edge servers, s5http_wkpgs is meant to be run locally (e.g., via Docker or bash scripts on Linux systems or soft routers). It acts as an alternative to standard client software like v2rayN or Clash.
By running this locally, you can direct traffic from your local network directly to your Cloudflare Worker/Pages setup without needing an intermediate client application for routing.
Prerequisites
 * An Active Cloudflare Worker or Page: You must have already deployed the main Cloudflare-vless-trojan script on Cloudflare (via Workers or Pages) and possess a working domain (e.g., xxxx.workers.dev or a custom domain).
 * Linux Terminal Access: This script must be executed on a Linux server, a Linux personal computer, or a Linux-based router.
Usage (Running the Script)
A shell script (cfsh.sh) is provided in this repository for quick deployment.
To download and run this script in a Linux terminal, use the following command:
curl -sL https://raw.githubusercontent.com/soroushse7o/Cloudflare-vless-trojan/refs/heads/main/s5http_wkpgs/cfsh.sh -o cfsh.sh && bash cfsh.sh

Main Variables and Settings (cfsh.sh)
Upon running the script, you may be prompted to enter information, or you might want to manually customize certain parameters. Here are the most important variables the script accepts:
 * Cloudflare Server Domain (cf_domain): (Required)
   * This is the address of your Worker or Pages. It must include the port (typically 80 or 443 ports).
   * Example: my-worker.username.workers.dev:443
 * Password or UUID (token): (Optional)
   * If you defined a password (for Trojan) or a UUID (for VLESS) in your main Worker file, you must enter it here.
 * Local Client Port and IP (client_ip): (Optional)
   * The local port on your system where the proxy will listen for traffic.
   * Default Value: 30000 (range between 10000 and 65000).
   * If this is set to 30000, upon successful execution, your local proxy will be active at 127.0.0.1:30000 (Socks5/HTTP).
 * Clean IP or Domain (cf_cdnip): (Optional)
   * You can input a clean Cloudflare IP or an optimized domain to improve speed.
   * Main Project Default: yg1.ygkkk.dpdns.org (typically connects to Japan, Singapore, or Hong Kong).
   * Suggestion for heavily filtered internet: cloudflare-ech.com (for connecting to Europe/US).
 * Proxy IP Setting (pyip): (Optional)
   * If you want to route through a specific IP to access blocked sites like ChatGPT, enter it here (IPv4, IPv6, or domain). If left blank, it uses the server's default setting (your Cloudflare Worker).
 * DNS over HTTPS Setting (dns): (Optional)
   * Default: [dns.alidns.com/dns-query](https://dns.alidns.com/dns-query)
How to Use the Proxy
Once the script runs successfully, a port will be opened on your system (e.g., 127.0.0.1:30000). You can now:
 * Configure this IP and port as a Socks5 or HTTP proxy in your operating system's network settings to route your entire system through the free internet.
 * Connect applications that support Socks5 (like Telegram) directly to this port.
 * If you installed this script on a soft router (e.g., with OpenWrt firmware), you can configure tools like passwall or ssr-plus to route all your home network traffic through this port.
فارسی (FA)
پروکسی محلی S5/HTTP برای کلادفلر ورکرز و پیجز (s5http_wkpgs)
این مخزن حاوی مجموعه ابزار s5http_wkpgs است که برای کار در کنار پروژه اصلی Cloudflare-vless-trojan طراحی شده است. این ابزار به شما اجازه می‌دهد پیکربندی‌های Cloudflare Workers یا Pages خود را مستقیماً به یک پروکسی محلی Socks5 یا HTTP روی دستگاه یا روتر خود تبدیل کنید.
بررسی اجمالی و هدف
برخلاف اسکریپت‌های اصلی که روی سرورهای لبه (Edge) کلادفلر اجرا می‌شوند، s5http_wkpgs برای اجرای محلی (Local) طراحی شده است (مثلاً از طریق داکر یا اسکریپت‌های لینوکسی روی روترهای نرم‌افزاری). این بخش به عنوان جایگزینی برای برنامه‌های کلاینت رایج مانند v2rayN یا Clash عمل می‌کند.
با اجرای این اسکریپت به صورت محلی، می‌توانید ترافیک شبکه داخلی خود را مستقیماً و بدون نیاز به برنامه‌های واسط، به سمت گره (Node) کلادفلر خود هدایت کنید.
پیش‌نیازها
۱. داشتن یک Worker یا Page کلادفلر فعال: شما باید ابتدا اسکریپت اصلی پروژه Cloudflare-vless-trojan را روی کلادفلر خود (از طریق بخش Workers یا Pages) مستقر کرده باشید و یک دامنه (مثل xxxx.workers.dev یا دامنه شخصی) داشته باشید.
۲. دسترسی به ترمینال لینوکس: این اسکریپت باید روی یک سرور لینوکسی، سیستم شخصی لینوکسی یا روتر لینوکسی اجرا شود.
نحوه استفاده (اجرای اسکریپت)
یک اسکریپت بش (cfsh.sh) در این مخزن برای اجرای سریع ابزار آماده شده است.
برای دانلود و اجرای این اسکریپت در ترمینال لینوکس، از دستور زیر استفاده کنید:
curl -sL https://raw.githubusercontent.com/soroushse7o/Cloudflare-vless-trojan/refs/heads/main/s5http_wkpgs/cfsh.sh -o cfsh.sh && bash cfsh.sh

متغیرها و تنظیمات اصلی (cfsh.sh)
پس از اجرای اسکریپت، ممکن است از شما خواسته شود تا اطلاعاتی را وارد کنید و یا شما بخواهید برخی پارامترها را به صورت دستی شخصی‌سازی کنید. در اینجا مهم‌ترین متغیرهایی که این اسکریپت می‌پذیرد آورده شده است:
۱. دامنه سرور کلادفلر (cf_domain): (اجباری)
*   این همان آدرس Worker یا Pages شماست. باید شامل پورت هم باشد (پورت‌های سری 80 یا 443).
*   مثال: my-worker.username.workers.dev:443
۲. رمز عبور یا UUID (token): (اختیاری)
*   اگر در فایل اصلی ورکر خود رمز عبور (برای Trojan) یا UUID (برای VLESS) تعریف کرده‌اید، باید همان را اینجا وارد کنید.
۳. پورت و آی‌پی کلاینت محلی (client_ip): (اختیاری)
*   پورت محلی روی سیستم شما که قرار است ترافیک روی آن شنود شود.
*   مقدار پیش‌فرض: 30000 (بازه بین 10000 تا 65000).
*   اگر این مقدار 30000 باشد، بعد از اجرای موفق، پروکسی محلی شما روی آدرس 127.0.0.1:30000 (Socks5/HTTP) فعال خواهد شد.
۴. آی‌پی یا دامنه تمیز (cf_cdnip): (اختیاری)
*   شما می‌توانید یک IP تمیز کلادفلر یا یک دامنه بهینه‌‌شده وارد کنید تا سرعت بهتری داشته باشید.
*   پیش‌فرض پروژه اصلی: yg1.ygkkk.dpdns.org (عموماً به ژاپن، سنگاپور یا هنگ‌کنگ وصل می‌شود).
*   پیشنهاد برای اینترنت‌های شدیداً فیلتر شده: cloudflare-ech.com (برای اتصال به اروپا/آمریکا).
۵. تنظیم پروکسی آی‌پی (pyip): (اختیاری)
*   اگر می‌خواهید برای باز کردن سایت‌های تحریمی مثل ChatGPT از IP خاصی عبور کنید، آن را اینجا وارد کنید (IPv4، IPv6 یا دامنه). اگر خالی بگذارید، از تنظیمات خود سرور (همان ورکر کلادفلر) استفاده می‌کند.
۶. تنظیم DNS روی حالت DoH (dns): (اختیاری)
*   پیش‌فرض: [dns.alidns.com/dns-query](https://dns.alidns.com/dns-query)
چگونه از آن استفاده کنیم؟
زمانی که اسکریپت با موفقیت اجرا شد، یک پورت روی سیستم شما باز می‌شود (مثلاً 127.0.0.1:30000). حالا می‌توانید:
 * در تنظیمات شبکه سیستم‌عامل خود (بخش Proxy)، این IP و پورت را به عنوان Socks5 یا HTTP پروکسی تنظیم کنید تا کل سیستم شما به اینترنت آزاد متصل شود.
 * تلگرام یا سایر اپلیکیشن‌هایی که از Socks5 پشتیبانی می‌کنند را مستقیماً به این پورت متصل کنید.
 * اگر این اسکریپت را روی یک روتر نرم‌افزاری (مثلاً با فریم‌ور OpenWrt) نصب کرده‌اید، می‌توانید ابزارهایی مانند passwall یا ssr-plus را تنظیم کنید تا کل ترافیک خانه‌تان از این پورت عبور کند.
