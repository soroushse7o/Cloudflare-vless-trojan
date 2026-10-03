#!/usr/bin/env bash
PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin:~/bin
export PATH
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
# --------------------------------------------------------------
#	Proje: CloudflareSpeedTest - be-roz-resani-ye khodkar-e Hosts
#	Noskhe: 1.0.4
#	Nevisande: XIU2
#	Proje: https://github.com/XIU2/CloudflareSpeedTest
# --------------------------------------------------------------

_CHECK() {
	while true
		do
		if [[ ! -e "nowip_hosts.txt" ]]; then
			echo -e "Kar-e in script: bad az test-e sorat, sari-tarin IP ra migirad va IP-ye ghadimi-ye Cloudflare CDN dar Hosts ra avaz mikonad.\nGhabl az estefade in ra bekhanid: https://github.com/XIU2/CloudflareSpeedTest/issues/42#issuecomment-768273848"
			echo -e "Baraye avvalin bar, aval hame-ye IP-haye Cloudflare CDN dar Hosts ra be yek IP-ye yeksan tabdil konid."
			read -e -p "Hamin IP-ye Cloudflare CDN ra vared konid va Enter bezanid (dafe-ye bad lazem nist): " NOWIP
			if [[ ! -z "${NOWIP}" ]]; then
				echo ${NOWIP} > nowip_hosts.txt
				break
			else
				echo "In IP nemitavanad khali bashad!"
			fi
		else
			break
		fi
	done
}

_UPDATE() {
	echo -e "Shoro-e test-e sorat..."
	NOWIP=$(head -1 nowip_hosts.txt)

	# Inja mitavanid parametr-haye ejra-ye CFST ra ezafe ya taghir dahid
	# -nomenu: menu-ye avval namayesh dade nemishavad (script bayad bedun-e porsesh ejra shavad)
	./cfst -nomenu -o "result_hosts.txt"

	# Agar mikhahid "ta vaghti IP-ye monaseb peyda nashode test-e dobare anjam shavad", do ta exit 0 ra be _UPDATE tabdil konid
	[[ ! -e "result_hosts.txt" ]] && echo "Tedad-e IP-haye natije-ye CFST 0 ast, marahel-e bad ra rad mikonim..." && exit 0

	# Code-e zir baraye halat-e "ta vaghti IP-ye monaseb peyda nashode test-e dobare anjam shavad" lazem ast
	# Vaghti hadd-e aghal-e sorat-e download moshakhas shode ama hich IP-i hame-ye shart-ha ra nadashte bashad, CFST hame-ye IP-ha ra khoroji midahad
	# Pas vaghti az parametr-e -sl estefade mikonid, bayad # ebteda-ye khat-e zir ra bardarid ta tedad-e khat-haye file barresi shavad (masalan tedad-e download 10 ast, adad ra 11 gozashte shavad)
	#[[ $(cat result_hosts.txt|wc -l) > 11 ]] && echo "CFST hich IP-i ke hame-ye shart-ha ra dashte bashad peyda nakard, test-e dobare..." && _UPDATE


	BESTIP=$(sed -n "2,1p" result_hosts.txt | awk -F, '{print $1}')
	if [[ -z "${BESTIP}" ]]; then
		echo "Tedad-e IP-haye natije-ye CFST 0 ast, marahel-e bad ra rad mikonim..."
		exit 0
	fi
	echo ${BESTIP} > nowip_hosts.txt
	echo -e "\nIP-ye ghadimi: ${NOWIP}\nIP-ye jadid: ${BESTIP}\n"

	echo "Shoro-e backup-giri az file-e Hosts (hosts_backup)..."
	\cp -f /etc/hosts /etc/hosts_backup

	echo -e "Shoro-e jaygozini..."
	sed -i 's/'${NOWIP}'/'${BESTIP}'/g' /etc/hosts
	echo -e "Tamam shod..."
}

_CHECK
_UPDATE
