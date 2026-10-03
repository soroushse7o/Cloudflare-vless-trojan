#!/usr/bin/env bash
PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin:~/bin
export PATH
# --------------------------------------------------------------
#	Proje: CloudflareSpeedTest - be-roz-resani-ye khodkar-e rekord-e DNS
#	Noskhe: 1.0.5
#	Nevisande: XIU2
#	Proje: https://github.com/XIU2/CloudflareSpeedTest
# --------------------------------------------------------------

_READ() {
	[[ ! -e "cfst_ddns.conf" ]] && echo -e "[Khata] File-e tanzimat vojud nadarad [cfst_ddns.conf] !" && exit 1
	CONFIG=$(cat "cfst_ddns.conf")
	FOLDER=$(echo "${CONFIG}"|grep 'FOLDER='|awk -F '=' '{print $NF}')
	[[ -z "${FOLDER}" ]] && echo -e "[Khata] Mored-e tanzimat [FOLDER] vojud nadarad !" && exit 1
	ZONE_ID=$(echo "${CONFIG}"|grep 'ZONE_ID='|awk -F '=' '{print $NF}')
	[[ -z "${ZONE_ID}" ]] && echo -e "[Khata] Mored-e tanzimat [ZONE_ID] vojud nadarad !" && exit 1
	DNS_RECORDS_ID=$(echo "${CONFIG}"|grep 'DNS_RECORDS_ID='|awk -F '=' '{print $NF}')
	[[ -z "${DNS_RECORDS_ID}" ]] && echo -e "[Khata] Mored-e tanzimat [DNS_RECORDS_ID] vojud nadarad !" && exit 1
	KEY=$(echo "${CONFIG}"|grep 'KEY='|awk -F '=' '{print $NF}')
	[[ -z "${KEY}" ]] && echo -e "[Khata] Mored-e tanzimat [KEY] vojud nadarad !" && exit 1
	EMAIL=$(echo "${CONFIG}"|grep 'EMAIL='|awk -F '=' '{print $NF}')
	[[ -z "${EMAIL}" ]] && echo -e "[Ettela] Mored-e tanzimat [EMAIL] vojud nadarad, az raveshe [API Key] be raveshe [API Token] taghir mikonim!"
	TYPE=$(echo "${CONFIG}"|grep 'TYPE='|awk -F '=' '{print $NF}')
	[[ -z "${TYPE}" ]] && echo -e "[Khata] Mored-e tanzimat [TYPE] vojud nadarad !" && exit 1
	NAME=$(echo "${CONFIG}"|grep 'NAME='|awk -F '=' '{print $NF}')
	[[ -z "${NAME}" ]] && echo -e "[Khata] Mored-e tanzimat [NAME] vojud nadarad !" && exit 1
	TTL=$(echo "${CONFIG}"|grep 'TTL='|awk -F '=' '{print $NF}')
	[[ -z "${TTL}" ]] && echo -e "[Khata] Mored-e tanzimat [TTL] vojud nadarad !" && exit 1
	PROXIED=$(echo "${CONFIG}"|grep 'PROXIED='|awk -F '=' '{print $NF}')
	[[ -z "${PROXIED}" ]] && echo -e "[Khata] Mored-e tanzimat [PROXIED] vojud nadarad !" && exit 1
}

_UPDATE() {
	# Inja mitavanid parametr-haye ejra-ye CFST ra ezafe ya taghir dahid
	# -nomenu: menu-ye avval namayesh dade nemishavad (script bayad bedun-e porsesh ejra shavad)
	./cfst -nomenu -o "result_ddns.txt"

	# Barresi mikonim file-e natije vojud darad ya na; agar nadarad yani natije 0 ast
	[[ ! -e "result_ddns.txt" ]] && echo "Tedad-e IP-haye natije-ye CFST 0 ast, marahel-e bad ra rad mikonim..." && exit 0

	CONTENT=$(sed -n "2,1p" result_ddns.txt | awk -F, '{print $1}')
	if [[ -z "${CONTENT}" ]]; then
		echo "Tedad-e IP-haye natije-ye CFST 0 ast, marahel-e bad ra rad mikonim..."
		exit 0
	fi
	# Agar motagheyyer-e EMAIL khali bashad yani bayad az raveshe API Token estefade shavad
	if [[ -n "${EMAIL}" ]]; then
		# Raveshe API Key (dastresi-ye kamel)
		curl -X PUT "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${DNS_RECORDS_ID}" \
			-H "X-Auth-Email: ${EMAIL}" \
			-H "X-Auth-Key: ${KEY}" \
			-H "Content-Type: application/json" \
			--data "{\"type\":\"${TYPE}\",\"name\":\"${NAME}\",\"content\":\"${CONTENT}\",\"ttl\":${TTL},\"proxied\":${PROXIED}}"
	else
		# Raveshe API Token (dastresi-ye sefareshi)
		curl -X PUT "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${DNS_RECORDS_ID}" \
			-H "Authorization: Bearer ${KEY}" \
			-H "Content-Type: application/json" \
			--data "{\"type\":\"${TYPE}\",\"name\":\"${NAME}\",\"content\":\"${CONTENT}\",\"ttl\":${TTL},\"proxied\":${PROXIED}}"
	fi
}

_READ
cd "${FOLDER}"
_UPDATE
