
# Cloudflare-vless-trojan

**Languages / زبان‌ها:** [English](#english) | [فارسی](#persian)

> English first, Persian (فارسی) below. / ابتدا انگلیسی، سپس فارسی در ادامه.

---

<a id="english"></a>

# Method 1: Cloudflare workers/pages proxy script V2026.9

### 1. This project supports local deployment only
### 2. All configuration is edited locally; no subscription servers, subscription converters or other third-party external links are used
### 3. No need to worry that a subscription-server or converter author can see your node subscription info in their backend
--------------------------------
## Features:
#### 1. Made for lazy beginners! Default nodes use official CF IPs, so there is no need to keep updating subscriptions to get client-side preferred IPs
#### 2. To reduce extra cost for beginners, a custom domain is not recommended; you may still use one if you really want to
#### 3. After clicking the deploy button on CF you can craft nodes by hand or use the share links; set at most one uuid/password and change nothing else
#### 4. Workers mode (custom domain only): supports vless+ws+tls, trojan+ws+tls, vless+ws and trojan+ws proxy nodes
#### 5. Pages mode: supports vless+ws+tls and trojan+ws+tls proxy nodes
#### 6. Supports single-node links, aggregated generic node links, aggregated generic node subscriptions, sing-box node subscriptions and clash node subscriptions
-------------------------------------------------------------

### Community: [Yongge's Blog](https://ygkkk.blogspot.com), [Yongge's YouTube channel](https://www.youtube.com/@ygkkk), [Yongge's TG group](https://t.me/+jZHc6-A-1QQ5ZGVl), [Yongge's TG channel](https://t.me/+DkC9ZZUgEFQzMTZl)

## Section documentation

- [Vless_workers_pages](Vless_workers_pages/README.md): VLESS Workers/Pages script
- [Trojan_workers_pages](Trojan_workers_pages/README.md): Trojan Workers/Pages script
- [s5http_wkpgs](s5http_wkpgs/README.md): Socks5/Http local proxy (server + client)
- [cf](cf/README.md): preferred-IP speed test tool

--------------------------------

## 1. Variables you can set for CF Vless nodes

| Purpose | Variable name | Value requirement | Default value | Required? |
| :--- | :--- | :--- | :--- | :--- |
| 1. The required uuid | uuid (lowercase) | Must follow the uuid format | The shared "everyone rides" uuid: 86c50e3a-5b87-49dd-bd20-03c7f2735e40 | Recommended |
| 2. Let the global node reach CF-hosted websites | proxyip (lowercase) | Port 443: IPv4 address, [IPv6 address] or domain. Other ports: IPv4:port, [IPv6]:port or domain:port | proxyip: built into the script | Optional |
| 3. Subscription nodes: preferred IPs | ip1 to ip13 (13 in total) | Official CF IPs, CF reverse-proxy IPs, CF preferred domains | ygkkk's official CF domain | Optional |
| 4. Subscription nodes: ports of the preferred IPs | pt1 to pt13 (13 in total) | The 13 standard CF ports, or any port of your reverse-proxy IP | The 13 standard CF ports | Optional |


## 2. Variables you can set for CF Trojan nodes

| Purpose | Variable name | Value requirement | Default value | Required? |
| :--- | :--- | :--- | :--- | :--- |
| 1. The required password | pswd (lowercase) | Letters and digits recommended | The shared "everyone rides" password: trojan | Recommended |
| 2. Let the global node reach CF-hosted websites | proxyip (lowercase) | Port 443: IPv4 address, [IPv6 address] or domain. Other ports: IPv4:port, [IPv6]:port or domain:port | proxyip: built into the script | Optional |
| 3. Subscription nodes: preferred IPs | ip1 to ip13 (13 in total) | Official CF IPs, CF reverse-proxy IPs, CF preferred domains | ygkkk's official CF domain | Optional |
| 4. Subscription nodes: ports of the preferred IPs | pt1 to pt13 (13 in total) | The 13 standard CF ports, or any port of your reverse-proxy IP | The 13 standard CF ports | Optional |

#### Special notes on the IP and port variables of subscription nodes (3 and 4) [beginners can ignore variables 3 and 4 and keep the defaults]

1. Remember: you only need to set ip1–ip13 and pt1–pt13 when you insist on using a subscription-type client AND want to change the preferred IPs

2. ip1–ip7 / pt1–pt7 only support non-TLS nodes on the 80-series ports in the subscription share links

3. ip8–ip13 / pt8–pt13 only support TLS nodes on the 443-series ports in the subscription share links

4. For official IPs you do not need to set ports (the 13 standard CF ports are already set). For reverse-proxy IPs you must toggle TLS separately and the port variables must be set as well

5. For subscription-node variable settings see this [video tutorial](https://youtu.be/8s-ELRuFaeE?si=MjhcKbt20d2Q2eqp&t=447)

---------------------------------

## 3. Custom proxyip

Although the script ships with proxyips from other contributors, it also supports a custom proxyip.

IPv4, IPv6 and domain forms are supported (for port 443 you may omit `:port`).

1. Global-node variable form (described in sections 1 and 2 above):

| proxyip port | IPv4 form | IPv6 form | Domain form |
| :--- | :--- | :--- | :--- |
| Port 443 | IPv4 address | [IPv6 address] | domain |
| Other ports | IPv4 address:port | [IPv6 address]:port | domain:port |

2. Single-node path form:

| proxyip port | IPv4 form | IPv6 form | Domain form |
| :--- | :--- | :--- | :--- |
| Port 443 | /pyip=IPv4 address | /pyip=[IPv6 address] | /pyip=domain |
| Other ports | /pyip=IPv4 address:port | /pyip=[IPv6 address]:port | /pyip=domain:port |

Notes:

1. Changing the proxyip via a single node's path only affects the single node currently being configured in the client; other single nodes and subscription nodes are not affected

2. Changing the proxyip via the global variable affects all nodes that do not set a proxyip in their path

3. When a node's path contains the ```/pyip=``` keyword, that node uses only the proxyip from its path and the global proxyip has no effect

---------------------------------

## 4. No socks5 needed! Beginners can use the reality protocol to build their own proxyip and 80-series/443-series any-port reverse-proxy IPs in one click

A pure-IPv6 VPS that is close to your location, cheap and with plenty of traffic is recommended. Avoid IPv4 where possible, because IPv4 reverse-proxy IPs are very likely to be scanned by others and end up in their free or paid reverse-proxy IP pools. If you must use IPv4, keep an eye on your VPS traffic: both proxyip and client-side preferred IPs consume VPS traffic.

Recommended scripts for building proxyip and reverse-proxy IPs: [x-ui-yg script](https://github.com/yonggekkk/x-ui-yg), [sing-box-yg script](https://github.com/yonggekkk/sing-box-yg)

See the [advanced video tutorial 1](https://youtu.be/QOnMVULADko) and [advanced video tutorial 2](https://youtu.be/CVZStM0t8BA)

-------------------------------------------

## 5. View the configuration info and share links

CF Vless: enter `https://` + pages domain or custom domain + `/` + your custom uuid in the browser address bar

CF Trojan: enter `https://` + pages domain or custom domain + `/` + your custom password in the browser address bar

Notes:

1. If both the pages domain and the custom domain are blocked, you must turn on a proxy to open them

2. When using a custom domain, the configuration info and share links under the pages domain remain usable

---------------------------------

## 6. Preferred IP usage

CF official preferred 80-series ports: 80, 8080, 8880, 2052, 2082, 2086, 2095

CF official preferred 443-series ports: 443, 2053, 2083, 2087, 2096, 8443

If you do not need the highest speed every day or a specific country, just use the default official CF IPs or domain; there is no need to change them.

Easy-to-remember official CF IPs for lazy users are listed below. They support switching among the 13 standard ports and are nicknamed "the never-dying IPs at the front line":

104.16.0.0

104.17.0.0

104.18.0.0

104.19.0.0

104.20.0.0

104.21.0.0

104.22.0.0

104.24.0.0

104.25.0.0

104.26.0.0

104.27.0.0

172.66.0.0

172.67.0.0

162.159.0.0

2606:4700::0 (requires an IPv6 environment)

CDN preferred domain: yg1.ygkkk.dpdns.org (the 1 in yg1 can be any number from 1 to 11)

---------------------------------

## 7. Recommended clients

#### Benefit of enabling Fragment: it ignores TLS blocking of blocked domains, so blocked domains such as workers can also support TLS nodes.

#### Tip: custom domains or pages domains that are not TLS-blocked can use TLS nodes without enabling Fragment

Clients that currently support this feature (click the name to go to the official download page):

1. Android: [v2rayNG](https://github.com/2dust/v2rayNG/tags), [Nekobox](https://github.com/starifly/NekoBoxForAndroid/releases), [Karing](https://github.com/KaringX/karing/tags); all clash/mihomo and sing-box clients work too

2. Windows: [v2rayN](https://github.com/2dust/v2rayN/tags), [Hiddify](https://github.com/hiddify/hiddify-next/tags), [Karing](https://github.com/KaringX/karing/tags); all clash/mihomo and sing-box clients work too

3. Apple iOS: Karing, Hiddify Proxy & VPN, Shadowrocket, Streisand

4. Soft routers: passwall, ssr-plus, homeproxy

Note: Shadowrocket, v2box, v2rayN and v2rayNG force TLS on for trojan+ws, which breaks trojan+ws. Also, clash subscriptions contain no trojan+ws nodes. This is stated here for your information.

For client usage questions see [CF vless/trojan permanent free node tutorial (6): Node not working? Where is the problem? Multi-platform free client setup guide and pitfalls](https://youtu.be/8E0l0nQWLxs)

---------------------------------

### CF video tutorial collection:

Latest, 2026.9.19: [A new era of CF free nodes: ignore the 1101 error, lean Workers+Pages deployment, and another look at the secrets of CF nodes](https://youtu.be/KWtqRFbi568)

[🥇 The 9 biggest problems when setting up a proxy: #4 misleads 99% of people online! #1 makes everyone struggle endlessly! Packed from start to finish!](https://youtu.be/pJwJBqBkcfw)

Highly recommended: [CF vless/trojan permanent free node tutorial (4): official preferred IPs vs. preferred reverse-proxy IPs vs. preferred domains, and why ProxyIP exists](https://youtu.be/NaLd-orwFUE)

Highly recommended: [CF vless/trojan permanent free node tutorial (6): Node not working? Where is the problem? Multi-platform free client setup guide and pitfalls](https://youtu.be/8E0l0nQWLxs)

Advanced: [CF vless/trojan permanent free node final tutorial (7): a truly "fixed IP" demonstrated exclusively, fixing twitch/chatgpt client errors; make your own reverse-proxy IP and ProxyIP in one click; the risk of others scanning your IP](https://youtu.be/QOnMVULADko)

Advanced: [CF vless/trojan permanent free node final tutorial (8): build your own all-port ProxyIP that also supports client-side preferred reverse-proxy IPs, the final self-hosted reverse-proxy IP tutorial](https://youtu.be/CVZStM0t8BA)

[Live-stream highlights: the four main characteristics of CF workers vless free nodes, and the problem of nodes being cut off or blocked](https://youtu.be/9OHGpWlfdJ0)

---------------------------------


# Method 2: Cloudflare Socks5/Http local proxy script
### Works with Workers domains, Pages domains and custom domains
### Three selectable proxy modes: ECH-TLS, plain TLS and no TLS, to counter all kinds of blocking

#### The script or Docker image below, ```ygkkk/cfsh```, is recommended for local platforms such as soft routers. Script shortcut: bash cfsh.sh

```
curl -sSL https://raw.githubusercontent.com/yonggekkk/Cloudflare_vless_trojan/main/s5http_wkpgs/cfsh.sh -o cfsh.sh && chmod +x cfsh.sh && bash cfsh.sh
```

| Purpose | Variable name | Value requirement | Default value | Required? |
| :--- | :--- | :--- | :--- | :--- |
| 1. CF server domain:port | cf_domain | domain:443-series or 80-series port | None; you must obtain a workers/pages/custom domain from CF | Required |
| 2. CF server key | token | Letters and digits identical to the server's | No key | Optional |
| 3. Local client IP port | client_ip | Between 10000 and 65000 | 30000 | Optional |
| 4. Preferred IP/domain | cf_cdnip | A CF preferred IP or preferred domain | yg(any number 1-13).ygkkk.dpdns.org; China Mobile mostly lands in Hong Kong, Telecom/Unicom mostly land in Japan/Singapore | Optional; the preferred domain ```cloudflare-ech.com``` is also recommended and mostly lands in the US/Europe |
| 5. Specify ProxyIP | pyip | ipv4, [ipv6] or domain | Use the server's ProxyIP | Optional |
| 6. Specify DNS DoH | dns | DNS in DoH format | dns.alidns.com/dns-query | Optional |
| 7. ECH switch | enable_ech | y = on, n = off | ECH on | Optional |
| 8. Split-routing switch | cnrule | y = domestic/foreign split proxy, n = global proxy | Domestic/foreign split proxy | Optional |

| Key points for the three modes | ECH-TLS | Plain TLS | No TLS |
| :--- | :--- | :--- | :--- |
| 1. cf_domain (CF server domain:port) | workers/pages/custom domain:443-series port | pages/custom domain:443-series port | workers domain:80-series port |
| 2. enable_ech (ECH switch) | y (on) | n (off) | y (on) / n (off) |

Notes:

CF 80-series ports: 80 (recommended), 8080, 8880, 2052, 2082, 2086, 2095

CF 443-series ports: 443 (recommended), 2053, 2083, 2087, 2096, 8443

Recommended IP lookup for non-CF websites (shows a CF 104.28/2a09 IP): https://www.whatismyip.com

Recommended IP lookup for CF websites (shows the proxyip's IP): https://ip.sb

Whether the ProxyIP works decides whether you can reach CF-hosted websites such as the CF website itself, X (Twitter), ChatGPT, etc.

Video tutorial: [CF Socks5/Http free proxy tutorial: the pros and cons of ECH Workers; three proxy modes with multi-port reuse, and client-side custom proxyip](https://youtu.be/Y_SHcD3prt8)


<img width="1182" height="517" alt="e5dfbfd7c9e6f15d4bd1c8409eecdffc" src="https://github.com/user-attachments/assets/ac0bcef0-54f9-4290-8c04-f84bbbe1cdf8" />

-------------------------------------------------------------

### Thank you for your support! Donate via WeChat to Yongge ygkkk
![41440820a366deeb8109db5610313a1](https://github.com/user-attachments/assets/7dbaa3b1-cce4-415a-b46e-049531cf4d0d)

-------------------------------------------------------------

### Code sources: [ca110us](https://github.com/ca110us/epeius), [emn178](https://github.com/emn178/js-sha256/blob/master/src/sha256.js), [3Kmfi6HP](https://github.com/3Kmfi6HP/EDtunnel), [badafans](https://github.com/badafans/Cloudflare-IP-SpeedTest), [XIU2](https://github.com/XIU2/CloudflareSpeedTest)
### Disclaimer: all code comes from the GitHub community and was integrated with ChatGPT


---------------------------------------------------------------------

<a id="persian"></a>

<div dir="rtl">

# روش ۱: اسکریپت پراکسی Cloudflare workers/pages نسخه‌ی V2026.9

### ۱. این پروژه فقط از استقرار محلی پشتیبانی می‌کند
### ۲. همه‌ی تنظیمات به‌صورت محلی ویرایش می‌شوند؛ از سرویس‌های اشتراک، مبدل اشتراک یا لینک‌های خارجی شخص ثالث استفاده نمی‌شود
### ۳. نگران نباشید که سازنده‌ی سرویس اشتراک یا مبدل اشتراک بتواند اطلاعات اشتراک نودهای شما را در پشت‌صحنه ببیند
--------------------------------
## ویژگی‌ها:
#### ۱. مخصوص کاربران مبتدی و تنبل! نودهای پیش‌فرض از IPهای رسمی CF استفاده می‌کنند، پس لازم نیست برای گرفتن IP بهینه‌ی سمت کلاینت مدام اشتراک را به‌روز کنید
#### ۲. برای کم کردن هزینه‌ی اضافه برای مبتدی‌ها، استفاده از دامنه‌ی سفارشی توصیه نمی‌شود؛ اگر حتماً بخواهید می‌توانید از آن استفاده کنید
#### ۳. بعد از زدن دکمه‌ی Deploy در CF می‌توانید نودها را دستی بسازید یا از لینک‌های اشتراک‌گذاری استفاده کنید؛ حداکثر یک uuid/گذرواژه تنظیم کنید و بقیه را تغییر ندهید
#### ۴. حالت Workers (فقط با دامنه‌ی سفارشی): از نودهای vless+ws+tls ،trojan+ws+tls ،vless+ws و trojan+ws پشتیبانی می‌کند
#### ۵. حالت Pages: از نودهای vless+ws+tls و trojan+ws+tls پشتیبانی می‌کند
#### ۶. پشتیبانی از لینک نود تکی، لینک نود تجمیعی عمومی، اشتراک نود تجمیعی عمومی، اشتراک نود sing-box و اشتراک نود clash
-------------------------------------------------------------

### ارتباط با جامعه: [وبلاگ یونگ‌گه](https://ygkkk.blogspot.com)، [کانال یوتیوب یونگ‌گه](https://www.youtube.com/@ygkkk)، [گروه تلگرام یونگ‌گه](https://t.me/+jZHc6-A-1QQ5ZGVl)، [کانال تلگرام یونگ‌گه](https://t.me/+DkC9ZZUgEFQzMTZl)

--------------------------------

## مستندات هر بخش

- [Vless_workers_pages](Vless_workers_pages/README.md): اسکریپت VLESS برای Workers/Pages
- [Trojan_workers_pages](Trojan_workers_pages/README.md): اسکریپت Trojan برای Workers/Pages
- [s5http_wkpgs](s5http_wkpgs/README.md): پراکسی محلی Socks5/Http (سرور + کلاینت)
- [cf](cf/README.md): ابزار تست سرعت IP بهینه

## ۱: متغیرهای قابل تنظیم برای نود CF Vless

| کاربرد متغیر | نام متغیر | الزام مقدار | مقدار پیش‌فرض | الزام |
| :--- | :--- | :--- | :--- | :--- |
| ۱. uuid ضروری | uuid (حروف کوچک) | باید با قالب استاندارد uuid مطابقت داشته باشد | uuid عمومی مشترک: 86c50e3a-5b87-49dd-bd20-03c7f2735e40 | توصیه می‌شود |
| ۲. دسترسی نود سراسری به سایت‌های پشت CF | proxyip (حروف کوچک) | پورت 443: آدرس IPv4، [آدرس IPv6] یا دامنه. پورت‌های دیگر: IPv4:پورت، [IPv6]:پورت یا دامنه:پورت | proxyip: داخل خود اسکریپت موجود است | اختیاری |
| ۳. نودهای اشتراک: IPهای بهینه | ip1 تا ip13 (جمعاً ۱۳ عدد) | IP رسمی CF، IP پراکسی معکوس CF، دامنه‌ی بهینه‌ی CF | دامنه‌ی رسمی CF از ygkkk | اختیاری |
| ۴. نودهای اشتراک: پورت مربوط به IPهای بهینه | pt1 تا pt13 (جمعاً ۱۳ عدد) | ۱۳ پورت استاندارد CF یا هر پورتِ IP پراکسی معکوس | ۱۳ پورت استاندارد CF | اختیاری |


## ۲: متغیرهای قابل تنظیم برای نود CF Trojan

| کاربرد متغیر | نام متغیر | الزام مقدار | مقدار پیش‌فرض | الزام |
| :--- | :--- | :--- | :--- | :--- |
| ۱. گذرواژه‌ی ضروری | pswd (حروف کوچک) | حروف و اعداد توصیه می‌شود | گذرواژه‌ی عمومی مشترک: trojan | توصیه می‌شود |
| ۲. دسترسی نود سراسری به سایت‌های پشت CF | proxyip (حروف کوچک) | پورت 443: آدرس IPv4، [آدرس IPv6] یا دامنه. پورت‌های دیگر: IPv4:پورت، [IPv6]:پورت یا دامنه:پورت | proxyip: داخل خود اسکریپت موجود است | اختیاری |
| ۳. نودهای اشتراک: IPهای بهینه | ip1 تا ip13 (جمعاً ۱۳ عدد) | IP رسمی CF، IP پراکسی معکوس CF، دامنه‌ی بهینه‌ی CF | دامنه‌ی رسمی CF از ygkkk | اختیاری |
| ۴. نودهای اشتراک: پورت مربوط به IPهای بهینه | pt1 تا pt13 (جمعاً ۱۳ عدد) | ۱۳ پورت استاندارد CF یا هر پورتِ IP پراکسی معکوس | ۱۳ پورت استاندارد CF | اختیاری |

#### نکات ویژه درباره‌ی متغیرهای IP و پورت در نودهای اشتراک (۳ و ۴) [مبتدی‌ها می‌توانند متغیرهای ۳ و ۴ را نادیده بگیرند و مقادیر پیش‌فرض را استفاده کنند]

۱. به یاد داشته باشید: فقط وقتی که حتماً می‌خواهید از کلاینت‌های مبتنی بر اشتراک استفاده کنید و همچنین بخواهید IP بهینه را عوض کنید، باید ip1 تا ip13 و pt1 تا pt13 را تنظیم کنید

۲. ip1 تا ip7 و pt1 تا pt7 در لینک‌های اشتراک‌گذاری اشتراک فقط از نودهای بدون TLS روی پورت‌های سری ۸۰ پشتیبانی می‌کنند

۳. ip8 تا ip13 و pt8 تا pt13 در لینک‌های اشتراک‌گذاری اشتراک فقط از نودهای TLS روی پورت‌های سری ۴۴۳ پشتیبانی می‌کنند

۴. برای IP رسمی نیازی به تنظیم پورت نیست (۱۳ پورت استاندارد CF از قبل تنظیم شده‌اند). برای IP پراکسی معکوس باید TLS را جداگانه روشن/خاموش کنید و متغیرهای پورت را هم حتماً تنظیم کنید

۵. برای تنظیم متغیرهای نودهای اشتراک می‌توانید به این [آموزش ویدیویی](https://youtu.be/8s-ELRuFaeE?si=MjhcKbt20d2Q2eqp&t=447) مراجعه کنید

---------------------------------

## ۳: proxyip سفارشی

هرچند اسکریپت به‌طور پیش‌فرض proxyip چند نفر دیگر را دارد، از proxyip سفارشی هم پشتیبانی می‌کند.

سه شکل IPv4 ،IPv6 و دامنه پشتیبانی می‌شود (وقتی پورت 443 است، نوشتن `:پورت` لازم نیست).

۱. به‌صورت متغیر نود سراسری (در بخش‌های ۱ و ۲ بالا توضیح داده شد):

| پورت proxyip | شکل IPv4 | شکل IPv6 | شکل دامنه |
| :--- | :--- | :--- | :--- |
| پورت 443 | آدرس IPv4 | [آدرس IPv6] | دامنه |
| پورت‌های غیر از 443 | آدرس IPv4:پورت | [آدرس IPv6]:پورت | دامنه:پورت |

۲. به‌صورت مسیر (path) نود تکی:

| پورت proxyip | شکل IPv4 | شکل IPv6 | شکل دامنه |
| :--- | :--- | :--- | :--- |
| پورت 443 | /pyip=آدرس IPv4 | /pyip=[آدرس IPv6] | /pyip=دامنه |
| پورت‌های غیر از 443 | /pyip=آدرس IPv4:پورت | /pyip=[آدرس IPv6]:پورت | /pyip=دامنه:پورت |

توجه:

۱. تغییر proxyip از راه path نود تکی فقط روی همان نود تکی که اکنون در کلاینت تنظیم می‌کنید اثر دارد و روی نودهای تکی دیگر یا نودهای اشتراک اثری ندارد

۲. تغییر proxyip از راه متغیر سراسری روی همه‌ی نودهایی که در path خود proxyip تنظیم نکرده‌اند اثر می‌گذارد

۳. وقتی در path یک نود عبارت ```/pyip=``` وجود داشته باشد، آن نود فقط از proxyip موجود در path استفاده می‌کند و proxyip سراسری بی‌اثر است

---------------------------------

## ۴: بدون نیاز به socks5! مبتدی‌ها با پروتکل reality با یک کلیک proxyip و IP پراکسی معکوس برای هر پورت سری ۸۰ و سری ۴۴۳ بسازند

پیشنهاد می‌شود یک VPS فقط-IPv6 بگیرید که به موقعیت شما نزدیک، ارزان و پرترافیک باشد. تا جای ممکن از IPv4 استفاده نکنید، چون IPv4های پراکسی معکوس با احتمال زیادی توسط دیگران اسکن می‌شوند و به پایگاه IPهای پراکسی معکوس رایگان یا پولی آن‌ها اضافه می‌شوند. اگر ناچار از IPv4 هستید، مراقب ترافیک VPS خود باشید: هم proxyip و هم IPهای بهینه‌ی سمت کلاینت از ترافیک VPS مصرف می‌کنند.

اسکریپت‌های پیشنهادی برای ساخت proxyip و IP پراکسی معکوس: [اسکریپت x-ui-yg](https://github.com/yonggekkk/x-ui-yg)، [اسکریپت sing-box-yg](https://github.com/yonggekkk/sing-box-yg)

برای مراحل کار به [آموزش ویدیویی پیشرفته ۱](https://youtu.be/QOnMVULADko) و [آموزش ویدیویی پیشرفته ۲](https://youtu.be/CVZStM0t8BA) نگاه کنید

-------------------------------------------

## ۵: مشاهده‌ی اطلاعات پیکربندی و لینک‌های اشتراک‌گذاری

CF Vless: در نوار آدرس مرورگر بنویسید `https://` + دامنه‌ی pages یا دامنه‌ی سفارشی + `/` + uuid سفارشی خود

CF Trojan: در نوار آدرس مرورگر بنویسید `https://` + دامنه‌ی pages یا دامنه‌ی سفارشی + `/` + گذرواژه‌ی سفارشی خود

توجه:

۱. اگر هم دامنه‌ی pages و هم دامنه‌ی سفارشی مسدود شده باشند، برای باز کردن آن‌ها باید پراکسی روشن کنید

۲. هنگام استفاده از دامنه‌ی سفارشی، اطلاعات پیکربندی و لینک‌های اشتراک‌گذاری روی دامنه‌ی pages همچنان قابل استفاده‌اند

---------------------------------

## ۶: کاربرد IP بهینه

پورت‌های بهینه‌ی رسمی CF سری ۸۰: 80، 8080، 8880، 2052، 2082، 2086، 2095

پورت‌های بهینه‌ی رسمی CF سری ۴۴۳: 443، 2053، 2083، 2087، 2096، 8443

اگر نیازی ندارید هر روز به بیشترین سرعت برسید یا کشور مشخصی را انتخاب کنید، همان IP یا دامنه‌ی رسمی پیش‌فرض CF را استفاده کنید؛ لازم نیست آن را عوض کنید.

IPهای رسمی CF که به‌راحتی به خاطر سپرده می‌شوند و برای کاربران تنبل توصیه می‌شوند در زیر آمده‌اند. آن‌ها امکان جابه‌جایی بین ۱۳ پورت استاندارد را دارند و به «IPهای همیشه‌زنده‌ی خط مقدم» معروف‌اند:

104.16.0.0

104.17.0.0

104.18.0.0

104.19.0.0

104.20.0.0

104.21.0.0

104.22.0.0

104.24.0.0

104.25.0.0

104.26.0.0

104.27.0.0

172.66.0.0

172.67.0.0

162.159.0.0

2606:4700::0 (نیازمند محیط IPv6)

دامنه‌ی بهینه‌ی CDN: yg1.ygkkk.dpdns.org (عدد 1 در yg1 را می‌توان با هر عددی از 1 تا 11 عوض کرد)

---------------------------------

## ۷: کلاینت‌های پیشنهادی

#### مزیت روشن کردن Fragment: مسدودسازی TLS روی دامنه‌های مسدود شده را دور می‌زند، بنابراین دامنه‌های مسدودشده‌ای مثل workers هم می‌توانند از نودهای TLS پشتیبانی کنند.

#### نکته: دامنه‌ی سفارشی یا دامنه‌ی pages که TLS آن مسدود نشده باشد، بدون روشن کردن Fragment هم با نودهای TLS کار می‌کند

کلاینت‌هایی که فعلاً از این قابلیت پشتیبانی می‌کنند (با کلیک روی نام، به صفحه‌ی دانلود رسمی می‌روید):

۱. اندروید: [v2rayNG](https://github.com/2dust/v2rayNG/tags)، [Nekobox](https://github.com/starifly/NekoBoxForAndroid/releases)، [Karing](https://github.com/KaringX/karing/tags)؛ همه‌ی کلاینت‌های clash/mihomo و sing-box هم مناسب‌اند

۲. ویندوز: [v2rayN](https://github.com/2dust/v2rayN/tags)، [Hiddify](https://github.com/hiddify/hiddify-next/tags)، [Karing](https://github.com/KaringX/karing/tags)؛ همه‌ی کلاینت‌های clash/mihomo و sing-box هم مناسب‌اند

۳. آیفون/آیپد (iOS): Karing، Hiddify Proxy & VPN، Shadowrocket، Streisand

۴. روتر نرم‌افزاری (soft router): passwall، ssr-plus، homeproxy

توجه: کلاینت‌های Shadowrocket ،v2box ،v2rayN و v2rayNG برای trojan+ws به‌اجبار TLS را روشن می‌کنند و باعث می‌شود trojan+ws کار نکند. همچنین اشتراک clash نود trojan+ws ندارد. این موضوع برای اطلاع شما ذکر شد.

برای مشکلات استفاده از کلاینت به [آموزش نود رایگان دائمی CF vless/trojan (قسمت ۶): نود کار نمی‌کند؟ مشکل از کجاست؟ راهنمای تنظیم کلاینت‌های رایگان چندپلتفرمی و نکات مهم](https://youtu.be/8E0l0nQWLxs) نگاه کنید

---------------------------------

### مجموعه‌ی آموزش‌های ویدیویی CF:

جدیدترین، ۲۰۲۶.۹.۱۹: [دوره‌ی تازه‌ی نودهای رایگان CF: نادیده گرفتن خطای 1101، استقرار ساده‌ی Workers+Pages و بررسی دوباره‌ی رازهای نودهای CF](https://youtu.be/KWtqRFbi568)

[🥇 رتبه‌بندی ۹ مشکل بزرگ راه‌اندازی پراکسی: رتبه‌ی ۴ ٪۹۹ مردم را گمراه کرده! رتبه‌ی ۱ همه را خسته کرده! از اول تا آخر پر از نکته!](https://youtu.be/pJwJBqBkcfw)

قویاً توصیه می‌شود: [آموزش نود رایگان دائمی CF vless/trojan (قسمت ۴): رابطه و ویژگی‌های IP رسمی بهینه، IP پراکسی معکوس بهینه و دامنه‌ی بهینه؛ دلیل وجود ProxyIP](https://youtu.be/NaLd-orwFUE)

قویاً توصیه می‌شود: [آموزش نود رایگان دائمی CF vless/trojan (قسمت ۶): نود کار نمی‌کند؟ مشکل از کجاست؟ راهنمای تنظیم کلاینت‌های رایگان چندپلتفرمی و نکات مهم](https://youtu.be/8E0l0nQWLxs)

پیشرفته: [آموزش نهایی نود رایگان دائمی CF vless/trojan (قسمت ۷): نمایش انحصاری «IP ثابت» واقعی، رفع خطای کلاینت‌های twitch و chatgpt؛ ساخت IP پراکسی معکوس و ProxyIP با یک کلیک؛ افشای خطر اسکن شدن IP شما توسط دیگران](https://youtu.be/QOnMVULADko)

پیشرفته: [آموزش نهایی نود رایگان دائمی CF vless/trojan (قسمت ۸): ساخت ProxyIP شخصی برای همه‌ی پورت‌ها با پشتیبانی از IP پراکسی معکوس بهینه در کلاینت؛ آموزش نهایی ساخت IP پراکسی معکوس شخصی](https://youtu.be/CVZStM0t8BA)

[مرور برگزیده‌ی پخش زنده: چهار ویژگی اصلی نودهای رایگان CF workers vless و مشکل قطع یا مسدود شدن نود](https://youtu.be/9OHGpWlfdJ0)

---------------------------------


# روش ۲: اسکریپت پراکسی محلی Socks5/Http روی Cloudflare
### پشتیبانی از دامنه‌ی Workers، دامنه‌ی Pages و دامنه‌ی سفارشی
### سه حالت پراکسی قابل انتخاب: ECH-TLS، TLS عادی و بدون TLS، برای مقابله با انواع مسدودسازی

#### اسکریپت یا ایمیج Docker زیر، ```ygkkk/cfsh```، برای پلتفرم‌های محلی مثل روتر نرم‌افزاری توصیه می‌شود. میان‌بر اسکریپت: bash cfsh.sh

</div>

```
curl -sSL https://raw.githubusercontent.com/yonggekkk/Cloudflare_vless_trojan/main/s5http_wkpgs/cfsh.sh -o cfsh.sh && chmod +x cfsh.sh && bash cfsh.sh
```

<div dir="rtl">

| کاربرد متغیر | نام متغیر | الزام مقدار | مقدار پیش‌فرض | الزام |
| :--- | :--- | :--- | :--- | :--- |
| ۱. دامنه:پورت سرور CF | cf_domain | دامنه:پورت سری ۴۴۳ یا سری ۸۰ | ندارد؛ باید دامنه‌ی workers/pages/سفارشی را از CF بگیرید | الزامی |
| ۲. کلید سرور CF | token | حروف و اعداد یکسان با سرور | بدون کلید | اختیاری |
| ۳. IP و پورت محلی کلاینت | client_ip | بین 10000 تا 65000 | 30000 | اختیاری |
| ۴. تعیین IP/دامنه‌ی بهینه | cf_cdnip | IP بهینه یا دامنه‌ی بهینه‌ی CF | yg(هر عدد از 1 تا 13).ygkkk.dpdns.org؛ چاینا موبایل معمولاً به هنگ‌کنگ و تلکام/یونیکام معمولاً به ژاپن و سنگاپور می‌رسند | اختیاری؛ دامنه‌ی بهینه‌ی ```cloudflare-ech.com``` هم توصیه می‌شود و معمولاً به آمریکا و اروپا می‌رسد |
| ۵. تعیین ProxyIP | pyip | ipv4 یا [ipv6] یا دامنه | استفاده از ProxyIP سمت سرور | اختیاری |
| ۶. تعیین DoH برای DNS | dns | DNS با قالب DoH | dns.alidns.com/dns-query | اختیاری |
| ۷. کلید ECH | enable_ech | y = روشن، n = خاموش | ECH روشن | اختیاری |
| ۸. کلید مسیریابی تفکیکی | cnrule | y = پراکسی تفکیکی داخلی/خارجی، n = پراکسی سراسری | پراکسی تفکیکی داخلی/خارجی | اختیاری |

| نکات کلیدی تنظیم سه حالت | ECH-TLS | TLS عادی | بدون TLS |
| :--- | :--- | :--- | :--- |
| ۱. cf_domain (دامنه:پورت سرور CF) | دامنه‌ی workers/pages/سفارشی:پورت سری ۴۴۳ | دامنه‌ی pages/سفارشی:پورت سری ۴۴۳ | دامنه‌ی workers:پورت سری ۸۰ |
| ۲. enable_ech (کلید ECH) | y (روشن) | n (خاموش) | y (روشن) / n (خاموش) |

توجه:

پورت‌های سری ۸۰ در CF: 80 (توصیه می‌شود)، 8080، 8880، 2052، 2082، 2086، 2095

پورت‌های سری ۴۴۳ در CF: 443 (توصیه می‌شود)، 2053، 2083، 2087، 2096، 8443

سایت پیشنهادی برای دیدن IP در سایت‌های غیر CF (IP از نوع 104.28/2a09 مربوط به CF را نشان می‌دهد): https://www.whatismyip.com

سایت پیشنهادی برای دیدن IP در سایت‌های CF (IP مربوط به proxyip را نشان می‌دهد): https://ip.sb

معتبر بودن ProxyIP تعیین می‌کند که آیا به سایت‌های پشت CF مثل خود وب‌سایت CF، X (توییتر)، ChatGPT و مانند آن‌ها دسترسی دارید یا نه

آموزش ویدیویی: [آموزش پراکسی رایگان CF Socks5/Http: مزایا و معایب ECH Workers؛ پشتیبانی از سه حالت پراکسی با استفاده‌ی مشترک از چند پورت، و proxyip سفارشی در سمت کلاینت](https://youtu.be/Y_SHcD3prt8)

</div>


<img width="1182" height="517" alt="e5dfbfd7c9e6f15d4bd1c8409eecdffc" src="https://github.com/user-attachments/assets/ac0bcef0-54f9-4290-8c04-f84bbbe1cdf8" />

-------------------------------------------------------------

<div dir="rtl">

### از حمایت شما سپاسگزاریم! حمایت مالی از طریق WeChat به یونگ‌گه ygkkk

</div>

![41440820a366deeb8109db5610313a1](https://github.com/user-attachments/assets/7dbaa3b1-cce4-415a-b46e-049531cf4d0d)

-------------------------------------------------------------

<div dir="rtl">

### منبع کدها: [ca110us](https://github.com/ca110us/epeius)، [emn178](https://github.com/emn178/js-sha256/blob/master/src/sha256.js)، [3Kmfi6HP](https://github.com/3Kmfi6HP/EDtunnel)، [badafans](https://github.com/badafans/Cloudflare-IP-SpeedTest)، [XIU2](https://github.com/XIU2/CloudflareSpeedTest)
### سلب مسئولیت: همه‌ی کدها از جامعه‌ی GitHub گرفته شده و با ChatGPT یکپارچه شده‌اند

</div>
