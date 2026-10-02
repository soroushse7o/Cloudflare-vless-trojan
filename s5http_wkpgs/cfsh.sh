#!/bin/bash
export LANG=en_US.UTF-8
arch="$(uname -m)"
case "$arch" in
x86_64|x64|amd64)   cpu=amd64 ;;
i386|i686)          cpu=386 ;;
armv8|armv8l|arm64|aarch64) cpu=arm64 ;;
armv7l)             cpu=arm ;;
mips64le)           cpu=mips64le ;;
mips64)             cpu=mips64 ;;
mips|mipsle)        cpu=mipsle ;;
*)
echo "Current architecture $arch is not supported | معماری فعلی $arch پشتیبانی نمی‌شود" && exit
;;
esac
INIT_SYSTEM=$(cat /proc/1/comm 2>/dev/null)
showports(){
if [ "$INIT_SYSTEM" = "systemd" ]; then
ports=$(ps aux | grep "$HOME/cfs5http/cfwp" 2>/dev/null | grep -v grep | sed -n 's/.*client_ip=:\([0-9]\+\).*/\1/p')
else
ports=$(ps w | grep "$HOME/cfs5http/cfwp" 2>/dev/null | grep -v grep | sed -n 's/.*client_ip=:\([0-9]\+\).*/\1/p')
fi
}
showmenu(){
showports
if [ -n "$ports" ]; then
echo "Running node ports | پورت‌های نودهای در حال اجرا:"
echo "$ports" | while IFS= read -r port; do
echo "  - $port"
done
else
echo "No nodes installed | هیچ نودی نصب نشده است"
fi
}
delsystem(){
local port=$1
if [ "$INIT_SYSTEM" = "systemd" ]; then
systemctl stop "cf_${port}.service" >/dev/null 2>&1
systemctl disable "cf_${port}.service" >/dev/null 2>&1
rm -f "/etc/systemd/system/cf_${port}.service"
systemctl daemon-reload >/dev/null 2>&1
else
/etc/init.d/cf_$port stop >/dev/null 2>&1
/etc/init.d/cf_$port disable >/dev/null 2>&1
rm -f /etc/init.d/cf_$port
killall -9 cf_$port >/dev/null 2>&1
fi
}
echo "================================================================"
echo "Yongge GitHub project / پروژه‌ی گیت‌هاب یونگ‌گه : github.com/yonggekkk"
echo "Yongge Blogger blog / وبلاگ یونگ‌گه : ygkkk.blogspot.com"
echo "Yongge YouTube channel / کانال یوتیوب یونگ‌گه : www.youtube.com/@ygkkk"
echo "================================================================"
echo "Cloudflare Socks5/Http local proxy script | اسکریپت پراکسی محلی Socks5/Http برای Cloudflare"
echo "Supports: Workers domain, Pages domain, custom domain | پشتیبانی: دامنه‌ی Workers، دامنه‌ی Pages، دامنه‌ی سفارشی"
echo "Optional: ECH-TLS, plain TLS or no TLS proxy modes to counter blocking | اختیاری: سه حالت ECH-TLS، TLS عادی و بدون TLS برای مقابله با مسدودسازی"
echo "Script shortcut / میان‌بر اسکریپت : bash cfsh.sh"
echo "================================================================"
echo "1. Add a CF-Socks5/Http node | افزودن نود CF-Socks5/Http"
echo "2. View a node's config and logs | مشاهده‌ی پیکربندی و لاگ یک نود"
echo "3. Delete a node | حذف یک نود"
echo "4. Uninstall all nodes | حذف کامل همه‌ی نودها"
echo "5. Exit | خروج"
echo
showmenu
echo
read -p "Select [1-5] | انتخاب کنید [1-5]: " menu
if [ "$menu" = "1" ]; then
mkdir -p "$HOME/cfs5http"
if [ ! -s "$HOME/cfs5http/cfwp" ]; then
curl -L -o "$HOME/cfs5http/cfwp" -# --retry 2 --insecure https://raw.githubusercontent.com/yonggekkk/Cloudflare-vless-trojan/main/s5http_wkpgs/linux-$cpu
chmod +x "$HOME/cfs5http/cfwp"
fi
echo
read -p "1. CF workers/pages/custom domain (format: domain:443-series or 80-series port) | دامنه‌ی CF workers/pages/سفارشی (قالب: دامنه:پورت‌های سری 443 یا سری 80): " menu
cf_domain="$menu"
echo
read -p "2. Token (Enter = no token) | کلید/توکن (Enter = بدون کلید): " menu
token="${menu:-}"
echo
read -p "3. Local client port (Enter = 30000) | پورت محلی کلاینت (Enter = 30000): " menu
port="${menu:-30000}"
echo
read -p "4. Preferred IP/domain for the client (Enter = yg1.ygkkk.dpdns.org) | IP/دامنه‌ی بهینه برای کلاینت (Enter = yg1.ygkkk.dpdns.org): " menu
cf_cdnip="${menu:-yg1.ygkkk.dpdns.org}"
echo
read -p "5. ProxyIP (Enter = use the server-side ProxyIP) | ProxyIP (Enter = استفاده از ProxyIP سمت سرور): " menu
pyip="${menu:-}"
echo
read -p "6. DoH server (Enter = dns.alidns.com/dns-query) | سرور DoH (Enter = dns.alidns.com/dns-query): " menu
dns="${menu:-dns.alidns.com/dns-query}"
echo
read -p "7. ECH switch (y = on, n = off, Enter = on) | ECH (y = روشن، n = خاموش، Enter = روشن): " menu
enable_ech=$([ -z "$menu" ] || [ "$menu" = y ] && echo y || echo n)
echo
read -p "8. Split-routing switch (y = domestic/foreign split, n = global proxy, Enter = split) | مسیریابی تفکیکی (y = تفکیک داخلی/خارجی، n = پراکسی سراسری، Enter = تفکیکی): " menu
cnrule=$([ -z "$menu" ] || [ "$menu" = y ] && echo y || echo n)
echo
SCRIPT="$HOME/cfs5http/cf_$port.sh"
LOG="$HOME/cfs5http/$port.log"
cat > "$SCRIPT" << EOF
#!/bin/bash
[ -f /proc/1/comm ] && INIT_SYSTEM=\$(cat /proc/1/comm)
CMD="$HOME/cfs5http/cfwp \
client_ip=:$port \
dns=$dns \
cf_domain=$cf_domain \
cf_cdnip=$cf_cdnip \
token=$token \
enable_ech=$enable_ech \
cnrule=$cnrule \
pyip=$pyip"
if [ "\$INIT_SYSTEM" = "systemd" ]; then
exec \$CMD > $LOG 2>&1
else
nohup \$CMD > "$LOG" 2>&1 &
fi
EOF
chmod +x "$SCRIPT"
if [ "$INIT_SYSTEM" = "systemd" ]; then
cat > "/etc/systemd/system/cf_$port.service" << EOF
[Unit]
Description=CF $port Service
After=network.target
[Service]
Type=simple
ExecStart=/bin/bash -c $SCRIPT
Restart=always
RestartSec=5
[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload >/dev/null 2>&1
systemctl start "cf_$port.service" >/dev/null 2>&1
systemctl enable "cf_$port.service" >/dev/null 2>&1
elif [ "$INIT_SYSTEM" = "procd" ]; then
cat > "/etc/init.d/cf_$port" << EOF
#!/bin/sh /etc/rc.common
START=99
STOP=10
USE_PROCD=1
SCRIPT="$HOME/cfs5http/cf_$port.sh"
start_service() {
procd_open_instance
procd_set_param command /bin/sh -c "sleep 10 && /bin/bash \"$SCRIPT\""
procd_set_param respawn
procd_close_instance
}
EOF
chmod +x "/etc/init.d/cf_$port"
/etc/init.d/cf_$port start >/dev/null 2>&1
/etc/init.d/cf_$port enable >/dev/null 2>&1
else
bash "$SCRIPT"
echo "You can add /bin/bash $SCRIPT to startup manually | می‌توانید /bin/bash $SCRIPT را دستی به راه‌اندازی خودکار اضافه کنید"
fi
sleep 5 && echo "Installed, the Socks5/Http node is running. Run bash cfsh.sh and choose 2 to view its config and logs | نصب انجام شد و نود Socks5/Http در حال اجراست. برای دیدن پیکربندی و لاگ، bash cfsh.sh را اجرا کنید و گزینه‌ی 2 را بزنید" 
echo
until grep -q '服务端域名与端口\|客户端地址与端口\|运行中的优选IP' "$HOME/cfs5http/$port.log" 2>/dev/null; do sleep 1; done; head -n 16 "$HOME/cfs5http/$port.log" 2>/dev/null | grep '服务端域名与端口\|客户端地址与端口\|运行中的优选IP'
echo
elif [ "$menu" = "2" ]; then
showmenu
echo
read -p "Port of the node to view (config and logs) | پورت نودی که می‌خواهید پیکربندی و لاگ آن را ببینید: " port
{ echo "Config and logs of the node on port ${port} | پیکربندی و لاگ نود روی پورت ${port}:" ; echo "------------------------------------"; sed -n '1,16p' "$HOME/cfs5http/$port.log" | grep '服务端域名与端口\|客户端地址与端口\|运行中的优选IP' ; echo "------------------------------------" ; sed '1,16d' "$HOME/cfs5http/$port.log" | tail -n 10; }
echo
elif [ "$menu" = "3" ]; then
showmenu
echo
read -p "Port of the node to delete | پورت نودی که می‌خواهید حذف شود: " port
delsystem "$port"
pid=$(lsof -t -i :$port)
kill -9 $pid >/dev/null 2>&1
rm -rf "$HOME/cfs5http/$port.log" "$HOME/cfs5http/cf_$port.sh"
echo "The process on port $port has been terminated | فرایند پورت $port متوقف شد"
elif [ "$menu" = "4" ]; then
showmenu
echo
read -p "Uninstall all nodes? (y/n) | همه‌ی نودها حذف شوند؟ (y/n): " menu
if [ "$menu" != "y" ]; then
echo "Cancelled | لغو شد" && exit
fi
echo "$ports" | while IFS= read -r port; do
delsystem "$port"
done
ps | grep '[c]fwp' | awk '{print $1}' | xargs -r kill -9
rm -rf "$HOME/cfs5http" cfsh.sh china_ipv4.txt china_ipv6.txt
echo "All nodes uninstalled | همه‌ی نودها حذف شدند"
else
exit
fi
