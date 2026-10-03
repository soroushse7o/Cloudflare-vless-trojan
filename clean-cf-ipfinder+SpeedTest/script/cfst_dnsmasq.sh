#!/usr/bin/env bash
PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin:~/bin
export PATH
# --------------------------------------------------------------
#	Proje: CloudflareSpeedTest - be-roz-resani-ye khodkar-e file-e tanzimat-e dnsmasq
#	Noskhe: 1.0.1
#	Nevisande: XIU2,Sving1024
#	Proje: https://github.com/XIU2/CloudflareSpeedTest
# --------------------------------------------------------------

_UPDATE() {
	echo -e "Shoro-e test-e sorat..."
	BESTIP=""
	BESTIP_IPV6="::"
	# Inja mitavanid parametr-haye ejra-ye CFST ra ezafe ya taghir dahid
	# -nomenu: menu-ye avval namayesh dade nemishavad (script bayad bedun-e porsesh ejra shavad)
	./cfst -nomenu -o "result_hosts.txt"
	# Baraye test-e IPv6 comment-e khat-e zir ra bardarid
	#./cfst -nomenu -o "result_hosts_ipv6.txt" -f ipv6.txt

	# Agar mikhahid "ta vaghti IP-ye monaseb peyda nashode test-e dobare anjam shavad", do ta exit 0 ra be _UPDATE tabdil konid
	[[ ! -e "result_hosts.txt" ]] && echo "Tedad-e IP-haye natije-ye CFST 0 ast, marahel-e bad ra rad mikonim..." && exit 0

	# Code-e zir baraye halat-e "ta vaghti IP-ye monaseb peyda nashode test-e dobare anjam shavad" lazem ast
	# Vaghti hadd-e aghal-e sorat-e download moshakhas shode ama hich IP-i hame-ye shart-ha ra nadashte bashad, CFST hame-ye IP-ha ra khoroji midahad
	# Pas vaghti az parametr-e -sl estefade mikonid, bayad # ebteda-ye khat-e zir ra bardarid ta tedad-e khat-haye file barresi shavad (masalan tedad-e download 10 ast, adad ra 11 gozashte shavad)
	#[[ $(cat result_hosts.txt|wc -l) > 11 ]] && echo "CFST hich IP-i ke hame-ye shart-ha ra dashte bashad peyda nakard, test-e dobare..." && _UPDATE

	BESTIP=$(sed -n "2,1p" result_hosts.txt | awk -F, '{print $1}')
	# Baraye test-e IPv6 comment-e khat-e zir ra bardarid
	#BESTIP_IPV6=$(sed -n "2,1p" result_hosts_ipv6.txt | awk -F, '{print $1}')

	if [[ -z "${BESTIP}" ]]; then
		echo "Tedad-e IP-haye natije-ye CFST 0 ast, marahel-e bad ra rad mikonim..."
		exit 0
	fi
	echo ${BESTIP} > nowip_hosts.txt
	echo -e "IP-ye bartar (IPv4): ${BESTIP}\n"
	# Baraye test-e IPv6 comment-e khat-e zir ra bardarid
	#echo -e "IP-ye bartar (IPv6): ${BESTIP_IPV6}\n"

    [[ -f cloudflare.conf ]] && rm cloudflare.conf

    cat site.conf | while read domain
    do
        if [[ ${domain:0:1} != "#" && ${domain} != "" ]]; then 
			echo "address=/${domain}/${BESTIP}" >> "cloudflare.conf"
			echo "address=/${domain}/${BESTIP_IPV6}" >> "cloudflare.conf"
		fi
    done

    [[ -f /etc/dnsmasq.d/cloudflare.conf ]] && rm /etc/dnsmasq.d/cloudflare.conf
    cp cloudflare.conf /etc/dnsmasq.d/cloudflare.conf
    systemctl restart dnsmasq.service
}

_UPDATE
