[English](./README.en.md) | **فارسی**

# CF-Workers-CheckSocks5

![demo]
<p align="center">
  <a href="https://square-night-ef7e.cfpanel-se7o.workers.dev/" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-Online-brightgreen?style=for-the-badge" alt="Live Demo">
  </a>
</p>

ابزاری مبتنی بر Cloudflare Workers برای بررسی دسترس‌پذیری پروکسی. هسته‌ی پروژه یک فایل `_worker.js` است و از بررسی پروکسی‌های SOCKS5، HTTP، HTTPS، TURN و SSTP پشتیبانی می‌کند. رابط وب امکان بررسی تکی و دسته‌ای، تحلیل (resolve) دامنه، نمایش اطلاعات IP خروجی، نمایش موقعیت روی نقشه، فیلتر کردن نتایج و برون‌بری آن‌ها را فراهم می‌کند.

> در سورس فعلی احراز هویت `TOKEN` وجود ندارد. بعد از استقرار روی یک دامنه‌ی عمومی، هر کسی که به آن دسترسی داشته باشد می‌تواند از API بررسی استفاده کند. اگر استفاده‌ی خصوصی می‌خواهید، سمت Cloudflare کنترل دسترسی اضافه کنید یا منطق احراز هویت را خودتان توسعه دهید.

## ویژگی‌ها

- پشتیبانی از پنج پروتکل پروکسی: `socks5://`، `http://`، `https://`، `turn://` و `sstp://`.
- پشتیبانی از پروکسی بدون احراز هویت، احراز هویت `username:password`، و نیز IPv4، نام دامنه و IPv6 داخل براکت.
- بررسی TURN با جریان TCP Allocation / CONNECT / ConnectionBind انجام می‌شود و سرورهای TURN بدون احراز هویت و با اعتبارنامه‌ی بلندمدت (long-term credentials) پشتیبانی می‌شوند.
- بررسی SSTP با دست‌دهی SSTP روی HTTPS و برقراری لینک PPP / IPCP انجام می‌شود و اطلاعات خروجی از طریق یک اتصال TCP داخل PPP خوانده می‌شود.
- پشتیبانی از بررسی تکی و دسته‌ای؛ در حالت دسته‌ای، موارد تکراری خودکار حذف می‌شوند، دامنه‌ها resolve می‌شوند و اعتبارسنجی هم‌زمان انجام می‌شود.
- تبدیل دامنه به رکوردهای A / AAAA، با اولویت Cloudflare DoH و بازگشت به Google DoH در صورت شکست.
- نمایش اطلاعات خروجی پروکسی، شامل IP خروجی، منطقه، ASN، اپراتور، برچسب‌های ریسک و زمان پاسخ.
- نمایش موقعیت خروجی روی نقشه‌ی Leaflet / OpenStreetMap.
- فیلتر کردن نتایج، کپی نتایج معتبر در کلیپ‌بورد یا برون‌بری آن‌ها به‌صورت TXT / CSV.
- پشتیبانی از تم روشن و تیره، تاریخچه، شمارنده‌ی بازدید و فوتر سفارشی.
- رابط دوزبانه: فارسی (پیش‌فرض، راست‌به‌چپ) و انگلیسی (چپ‌به‌راست)، با امکان تغییر زبان از بالای صفحه.

## نمونه‌ی آنلاین

Demo:
[**مشاهده دموی زنده**](https://square-night-ef7e.cfpanel-se7o.workers.dev/)

## استقرار

متن‌های رابط کاربری در `locales/fa.json` و `locales/en.json` قرار دارند و `_worker.js` آن‌ها را import می‌کند. برای استقرار از Wrangler استفاده کنید تا این فایل‌ها همراه Worker باندل شوند؛ کپی کردن فقط `_worker.js` در ویرایشگر داشبورد دیگر کافی نیست.

### Cloudflare Workers

1. Wrangler را نصب کنید: `npm install -g wrangler`.
2. با `wrangler login` وارد حساب خود شوید.
3. در ریشه‌ی پروژه دستور `wrangler deploy` را اجرا کنید (فایل `wrangler.toml` موجود به `_worker.js` اشاره می‌کند).
4. آدرس Worker را باز کنید تا صفحه‌ی بررسی نمایش داده شود.

### Cloudflare Pages

مطمئن شوید ریشه‌ی استقرار شامل `_worker.js` و پوشه‌ی `locales/` است و با دستور `wrangler pages deploy .` استقرار را انجام دهید تا فایل‌های زبان import‌شده داخل Worker صفحه‌ها باندل شوند.

پروژه مرحله‌ی build اضافه‌ای ندارد و به `package.json` وابسته نیست.

## متغیرهای محیطی

سورس فعلی فقط متغیر محیطی زیر را می‌خواند:

| نام متغیر | توضیح | مثال | اجباری |
| --- | --- | --- | --- |
| `BEIAN` | HTML سفارشی فوتر صفحه. اگر تنظیم نشود، فوتر پیش‌فرض شامل لینک پروژه، تعداد بازدید و لینک نگه‌دارنده نمایش داده می‌شود. فوتر سفارشی همان‌طور که هست نمایش داده می‌شود و ترجمه نمی‌شود. | `© 2026 Example.com · ICP number` | خیر |

## قالب‌های پشتیبانی‌شده‌ی پروکسی

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

اگر ورودی در رابط وب پیشوند پروتکل نداشته باشد، به‌طور پیش‌فرض `socks5://` در نظر گرفته می‌شود. پورت‌های پیش‌فرض:

| پروتکل | پورت پیش‌فرض |
| --- | --- |
| `socks5` | `1080` |
| `http` | `80` |
| `https` | `443` |
| `turn` | `3478` |
| `sstp` | `443` |

### توضیحات پشتیبانی از TURN

هدف‌های `turn://` به‌عنوان سرور TURN over TCP بررسی می‌شوند. Worker ابتدا به سرور TURN وصل می‌شود، سپس از طریق رله‌ی TCP آن به `www.iplocate.io:443` دسترسی پیدا می‌کند و در پایان اطلاعات IP خروجی را می‌خواند.

پیاده‌سازی فعلی TURN محدودیت‌های زیر را دارد:

- از TCP Allocation، CreatePermission، CONNECT و ConnectionBind به سبک RFC 6062 پشتیبانی می‌کند.
- از سرورهای بدون احراز هویت پشتیبانی می‌کند؛ اگر سرور چالش احراز هویت `401` برگرداند و در لینک `username:password` داده شده باشد، دست‌دهی با اعتبارنامه‌ی بلندمدت ادامه پیدا می‌کند.
- آدرس بررسی خروجی قبل از ارسال TURN CONNECT به IPv4 تبدیل می‌شود؛ رله‌ی UDP در TURN استفاده نمی‌شود و `turns://` هم پشتیبانی نمی‌شود.
- میزبان در `turn://` می‌تواند IP یا دامنه باشد و اگر پورت نوشته نشود، `3478` استفاده می‌شود.

### توضیحات پشتیبانی از SSTP

هدف‌های `sstp://` به‌عنوان سرور SSTP over TLS بررسی می‌شوند. Worker ابتدا تونل HTTP مربوط به SSTP را برقرار می‌کند، مذاکره‌ی PPP / IPCP را کامل می‌کند، سپس داخل PPP یک اتصال TCP به `www.iplocate.io:443` می‌سازد و در پایان اطلاعات IP خروجی را می‌خواند.

پیاده‌سازی فعلی SSTP محدودیت‌های زیر را دارد:

- از سرورهای SSTP بدون احراز هویت پشتیبانی می‌کند؛ اگر مذاکره‌ی PPP احراز هویت بخواهد، فقط PAP با `username:password` داده‌شده در لینک پشتیبانی می‌شود.
- آدرس بررسی خروجی قبل از برقراری اتصال TCP داخل PPP به IPv4 تبدیل می‌شود؛ بررسی SSTP فعلاً به این وابسته است که سرور یک آدرس IPv4 اختصاص دهد.
- میزبان در `sstp://` می‌تواند IP یا دامنه باشد و اگر پورت نوشته نشود، `443` استفاده می‌شود.

## API

همه‌ی endpointهای JSON هدرهای CORS دارند و از درخواست preflight با متد `OPTIONS` پشتیبانی می‌کنند.

### `GET /check`

بررسی می‌کند که یک پروکسی قابل‌استفاده است یا نه. Worker از طریق پروکسی به `www.iplocate.io` وصل می‌شود و اطلاعات IP خروجی را که آن سرویس برمی‌گرداند می‌خواند.

پارامترهای درخواست به این شکل‌ها پذیرفته می‌شوند:

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

نمونه‌ی پاسخ:

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

در صورت شکست، پاسخ شامل `success: false` و فیلد `error` است.

### `GET /resolve`

یک دامنه یا لینک پروکسی را به فهرستی از `host:port` قابل‌بررسی تبدیل می‌کند.

نام‌های جایگزین پارامتر:

- `proxyip`
- `target`
- `host`

مثال:

```bash
curl "https://your-worker.example.workers.dev/resolve?proxyip=socks5://proxy.example.com:1080"
```

نمونه‌ی پاسخ:

```json
[
  "198.51.100.10:1080",
  "[2001:db8::10]:1080"
]
```

قواعد تحلیل:

- اگر ورودی از قبل IPv4 یا IPv6 باشد، هدف و پورت اصلی همان‌طور که هست برگردانده می‌شود.
- اگر ورودی دامنه باشد، رکوردهای A / AAAA آن resolve می‌شوند.
- اگر پورتی داده نشود، endpoint تحلیل به‌طور پیش‌فرض از `443` استفاده می‌کند.

### `POST /resolve-batch`

هدف‌ها را به‌صورت دسته‌ای resolve می‌کند؛ حداکثر `50` مورد در هر درخواست.

بدنه‌ی درخواست می‌تواند `targets` یا `proxyips` باشد:

```json
{
  "targets": [
    "socks5://proxy-a.example.com:1080",
    "proxy-b.example.com:1080"
  ]
}
```

نمونه‌ی پاسخ:

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

## استفاده از رابط وب

1. آدرس Worker مستقرشده را باز کنید.
2. در کادر ورودی یک لینک پروکسی، `IP:پورت`، `دامنه:پورت` یا آدرس پروکسی همراه با احراز هویت وارد کنید.
3. برای بررسی دسته‌ای، «بررسی دسته‌ای» را روشن کنید و چند خط هدف را paste کنید.
4. روی «شروع بررسی» کلیک کنید.
5. پس از پایان بررسی، می‌توانید بر اساس همه / معتبر / ناموفق / رتبه‌ی ریسک، پروتکل و کشور یا منطقه فیلتر کنید و نتایج معتبر را برون‌بری بگیرید.

همچنین می‌توانید بررسی تکی را مستقیماً از طریق مسیر URL اجرا کنید:

```text
https://your-worker.example.workers.dev/socks5://proxy.example.com:1080
```

## پارامترهای اجرا

محدودیت‌ها و timeoutهای اصلی در سورس:

| پارامتر | مقدار فعلی | توضیح |
| --- | --- | --- |
| `CHECK_TIMEOUT_MS` | `12000` | timeout کل برای بررسی یک پروکسی |
| `CONNECT_TIMEOUT_MS` | `9999` | timeout اتصال به پروکسی و دست‌دهی |
| `READ_TIMEOUT_MS` | `8000` | timeout خواندن پاسخ سرور مقصد |
| `MAX_RESPONSE_BYTES` | `96 KiB` | حداکثر بایت قابل‌خواندن از پاسخ اطلاعات خروجی |
| `RESOLVE_BATCH_LIMIT` | `50` | حداکثر تعداد هدف در هر درخواست resolve دسته‌ای |
| هم‌زمانی بررسی در فرانت‌اند | `32` | تعداد بررسی‌های هم‌زمان در حالت دسته‌ای رابط وب |

## نکات مهم

- قابلیت TCP Socket در Cloudflare Workers توسط `cloudflare:sockets` فراهم می‌شود؛ مطمئن شوید محیط استقرار شما از اتصال‌های TCP خروجی Workers پشتیبانی می‌کند.
- منطق بررسی، پروکسی را به‌عنوان تونل برای دسترسی به `www.iplocate.io` به کار می‌برد؛ بنابراین نتیجه، دسترس‌پذیری و اطلاعات خروجی پروکسی را هنگام دسترسی به همان سرویس مقصد نشان می‌دهد.
- بررسی TURN به این وابسته است که سرور TURN از TCP relay / CONNECT پشتیبانی کند؛ سرویس‌های TURN که فقط UDP relay دارند در بررسی شکست می‌خورند.
- بررسی SSTP نیازمند آن است که سرور از SSTP over TLS، PPP / IPCP و اختصاص IPv4 پشتیبانی کند؛ فقط احراز هویت PAP پشتیبانی می‌شود و روش‌های دیگر PPP مانند MS-CHAP پشتیبانی نمی‌شوند.
- در استقرار عمومی با نام کاربری و رمز پروکسی‌های واقعی محتاط باشید؛ صفحه و API فعلاً با توکن دسترسی محافظت نمی‌شوند.
- بررسی‌های دسته‌ای حجیم ممکن است تحت تأثیر زمان اجرا، هم‌زمانی و دسترس‌پذیری DNS/APIهای خارجی در Cloudflare Workers قرار بگیرند.

## مجوز

این پروژه تحت [GNU General Public License v3.0](./LICENSE) منتشر شده است.

## منابع متن‌باز مورد استفاده

- [CF-Workers-HTTPS](https://github.com/ToiCF/CF-Workers-HTTPS)
- [CF-Workers-TURN](https://github.com/ToiCF/CF-Workers-TURN)
- [CF-Workers-SoftEther](https://github.com/ToiCF/CF-Workers-SoftEther)

## قدردانی

- [@Alexandre_Kojeve](https://t.me/Alexandre_Kojeve)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [iplocate.io](https://www.iplocate.io/)
- [Cloudflare DNS](https://cloudflare-dns.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Leaflet](https://leafletjs.com/)
