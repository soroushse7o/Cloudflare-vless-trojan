#!/bin/bash
export LANG=en_US.UTF-8
case "$(uname -m)" in
	x86_64 | x64 | amd64 )
	cpu=amd64
	;;
	i386 | i686 )
        cpu=386
	;;
	armv8 | armv8l | arm64 | aarch64 )
        cpu=arm64
	;;
	armv7l )
        cpu=arm
	;;
        mips64le )
        cpu=mips64le
	;;
        mips64 )
        cpu=mips64
	;;
        mips )
        cpu=mipsle
	;;
        mipsle )
        cpu=mipsle
	;;
	* )
	echo "Current architecture $(uname -m) is not supported | معماری فعلی $(uname -m) پشتیبانی نمی‌شود"
	exit
	;;
esac

result(){
awk -F ',' '$2 ~ /BGI|YCC|YVR|YWG|YHZ|YOW|YYZ|YUL|YXE|STI|SDQ|GUA|KIN|GDL|MEX|QRO|SJU|MGM|ANC|PHX|LAX|SMF|SAN|SFO|SJC|DEN|JAX|MIA|TLH|TPA|ATL|HNL|ORD|IND|BGR|BOS|DTW|MSP|MCI|STL|OMA|LAS|EWR|ABQ|BUF|CLT|RDU|CLE|CMH|OKC|PDX|PHL|PIT|FSD|MEM|BNA|AUS|DFW|IAH|MFE|SAT|SLC|IAD|ORF|RIC|SEA/ {print $0}' $ip.csv | sort -t ',' -k5,5n | head -n 3 > US-$ip.csv
awk -F ',' '$2 ~ /CGP|DAC|JSR|PBH|BWN|PNH|GUM|HKG|AMD|BLR|BBI|IXC|MAA|HYD|CNN|KNU|COK|CCU|BOM|NAG|DEL|PAT|DPS|CGK|JOG|FUK|OKA|KIX|NRT|ALA|NQZ|ICN|VTE|MFM|JHB|KUL|KCH|MLE|ULN|MDL|RGN|KTM|ISB|KHI|LHE|CGY|CEB|MNL|CRK|KJA|SVX|SIN|CMB|KHH|TPE|BKK|CNX|URT|TAS|DAD|HAN|SGN/ {print $0}' $ip.csv | sort -t ',' -k5,5n | head -n 3 > AS-$ip.csv
awk -F ',' '$2 ~ /TIA|VIE|MSQ|BRU|SOF|ZAG|LCA|PRG|CPH|TLL|HEL|BOD|LYS|MRS|CDG|TBS|TXL|DUS|FRA|HAM|MUC|STR|ATH|SKG|BUD|KEF|ORK|DUB|MXP|PMO|FCO|RIX|VNO|LUX|KIV|AMS|SKP|OSL|WAW|LIS|OTP|DME|LED|KLD|BEG|BTS|BCN|MAD|GOT|ARN|GVA|ZRH|IST|ADB|KBP|EDI|LHR|MAN/ {print $0}' $ip.csv | sort -t ',' -k5,5n | head -n 3 > EU-$ip.csv
}

#if timeout 3 ping -c 2 google.com &> /dev/null; then
#echo "A proxy is enabled on this network, please turn it off for accurate results | روی این شبکه پراکسی روشن است، برای دقت نتیجه آن را خاموش کنید"
#else
#echo "No proxy detected, continuing... | پراکسی خاموش است، ادامه می‌دهیم..."
#fi

if timeout 3 ping -c 2 2400:3200::1 &> /dev/null; then
echo "This network supports IPv4+IPv6 | این شبکه از IPv4+IPv6 پشتیبانی می‌کند"
else
echo "This network supports IPv4 only | این شبکه فقط از IPv4 پشتیبانی می‌کند"
fi
rm -rf 6.csv 4.csv
echo "Yongge GitHub project / پروژه‌ی گیت‌هاب یونگ‌گه : github.com/yonggekkk"
echo "Yongge Blogger blog / وبلاگ یونگ‌گه : ygkkk.blogspot.com"
echo "Yongge YouTube channel / کانال یوتیوب یونگ‌گه : www.youtube.com/@ygkkk"
echo
echo "If you see \"run error\": check the network/dependencies! Run it once through a proxy first, afterwards just use the shortcut: bash cf.sh"
echo "اگر «خطا در اجرا» دیدید: شبکه و وابستگی‌ها را بررسی کنید! یک بار با پراکسی اجرا کنید و بعد از آن فقط از میان‌بر استفاده کنید: bash cf.sh"
echo
echo "Select the optimization type | نوع بهینه‌سازی را انتخاب کنید"
echo "1. IPv4 only | فقط IPv4"
echo "2. IPv6 only | فقط IPv6"
echo "3. IPv4 + IPv6 | هر دو IPv4 و IPv6"
echo "4. Reset config files | بازنشانی فایل‌های پیکربندی"
echo "5. Exit | خروج"
read -p "Select [1-5] | انتخاب کنید [1-5]: " menu
if [ ! -e cf ]; then
curl -L -o cf -# --retry 2 --insecure https://raw.githubusercontent.com/yonggekkk/Cloudflare_vless_trojan/main/cf/$cpu
chmod +x cf
fi
if [ ! -e locations.json ]; then
curl -s -o locations.json https://raw.githubusercontent.com/yonggekkk/Cloudflare_vless_trojan/main/cf/locations.json
fi
if [ ! -e ips-v4.txt ]; then
curl -s -o ips-v4.txt https://raw.githubusercontent.com/yonggekkk/Cloudflare_vless_trojan/main/cf/ips-v4.txt
fi
if [ ! -e ips-v6.txt ]; then
curl -s -o ips-v6.txt https://raw.githubusercontent.com/yonggekkk/Cloudflare_vless_trojan/main/cf/ips-v6.txt
fi
if [ "$menu" = "1" ]; then
ip=4
./cf -ips 4 -outfile 4.csv
result
elif [ "$menu" = "2" ]; then
ip=6
./cf -ips 6 -outfile 6.csv
result
elif [ "$menu" = "3" ]; then
ip=4
./cf -ips 4 -outfile 4.csv
result
ip=6
./cf -ips 6 -outfile 6.csv
result
elif [ "$menu" = "4" ]; then
rm -rf 6.csv 4.csv locations.json ips-v4.txt ips-v6.txt cf cf.sh
echo "Reset successful | با موفقیت بازنشانی شد" && exit
else
exit
fi
clear
if [ -e 4.csv ]; then
echo "Best available IPv4 nodes (top 3) | بهترین نودهای IPv4 (۳ نود برتر):"
echo "US IPv4 results | نتایج IPv4 آمریکا:"
cat US-4.csv
echo
echo "Asia IPv4 results | نتایج IPv4 آسیا:"
cat AS-4.csv
echo
echo "Europe IPv4 results | نتایج IPv4 اروپا:"
cat EU-4.csv
fi
if [ -e 6.csv ]; then
echo "Best available IPv6 nodes (top 3) | بهترین نودهای IPv6 (۳ نود برتر):"
echo "US IPv6 results | نتایج IPv6 آمریکا:"
cat US-6.csv
echo
echo "Asia IPv6 results | نتایج IPv6 آسیا:"
cat AS-6.csv
echo
echo "Europe IPv6 results | نتایج IPv6 اروپا:"
cat EU-6.csv
fi
if [ ! -e 4.csv ] && [ ! -e 6.csv ]; then
echo "Run error, please check the network/dependencies | خطا در اجرا، شبکه و وابستگی‌ها را بررسی کنید"
fi
