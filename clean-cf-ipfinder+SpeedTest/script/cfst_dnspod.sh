#!/bin/bash

# --------------------------------------------------------------
#	Proje: CloudflareSpeedTest - be-roz-resani-ye khodkar-e DNSPod
#	Noskhe: 1.0.0
#	Nevisande: imashen
# --------------------------------------------------------------

# Pak kardan-e file-haye bajamande az ejra-ye ghabli
rm -f result4.csv result6.csv
# Etelaat-e API-ye DNSPod
dnspod_token="${API_TOKEN}"
dnspod_domain="${DOMAIN}"
dnspod_record="${SUB_DOMAIN}"

# Adres-e API-ye DNSPod
dnspod_api_url="https://dnsapi.cn"

# Record_line-e pishfarz-e DNSPod ("default" be zaban-e chini) be soorat-e URL-encode shode
# (chon API-ye DNSPod hamin meghdar ra mikhahad va script bayad faghat ASCII bashad)
dnspod_line="%E9%BB%98%E8%AE%A4"

# Gereftan-e ID-ye rekord
get_record_id() {
    local record_type=$1
    local response
    response=$(curl -s -X POST -d "login_token=$dnspod_token&format=json&domain=$dnspod_domain&record_type=$record_type" "$dnspod_api_url/Record.List")
    local record_id
    record_id=$(echo "$response" | jq -r --arg type "$record_type" '.records[] | select(.type == $type) | .id')
    echo "$record_id"
}

# Sakhtan-e rekord-e DNS
create_dns_record() {
    local record_type=$1
    local ip_address=$2
    local response
    response=$(curl -s -X POST -d "login_token=$dnspod_token&format=json&domain=$dnspod_domain&sub_domain=$dnspod_record&record_type=$record_type&record_line=$dnspod_line&value=$ip_address" "$dnspod_api_url/Record.Create")
    local record_id
    record_id=$(echo "$response" | jq -r '.record.id')
    echo "$record_id"
}

# Be-roz-resani-ye rekord-e DNS
update_dns_record() {
    local record_id=$1
    local record_type=$2
    local ip_address=$3
    curl -s -X POST -d "login_token=$dnspod_token&format=json&domain=$dnspod_domain&record_id=$record_id&sub_domain=$dnspod_record&record_type=$record_type&record_line=$dnspod_line&value=$ip_address" "$dnspod_api_url/Record.Modify"
}

# Ejra-ye CFST baraye IPv4
./cfst -nomenu -f ip.txt -n 500 -o result4.csv

# Khandan-e file-e CSV va estekhraj-e behtarin IPv4
preferred_ipv4=$(awk -F, 'NR==2 {print $1}' result4.csv)

# Barresi mikonim aya IPv4 gerefte shode ast
if [ -z "$preferred_ipv4" ]; then
  echo "Failed to get the preferred IPv4 address."
else
  echo "BETTER IPv4: $preferred_ipv4"

  # Gereftan-e ID-ye rekord-e IPv4
  ipv4_record_id=$(get_record_id "A")

  if [ -n "$ipv4_record_id" ]; then
    # Be-roz-resani-ye rekord-e IPv4
    update_dns_record "$ipv4_record_id" "A" "$preferred_ipv4"
    echo "Updated DNSPod record with IPv4: $preferred_ipv4"
  else
    # Sakhtan-e rekord-e IPv4
    new_ipv4_record_id=$(create_dns_record "A" "$preferred_ipv4")
    if [ -n "$new_ipv4_record_id" ]; then
      echo "Created DNSPod record with IPv4: $preferred_ipv4"
    else
      echo "Failed to create DNSPod record with IPv4."
    fi
  fi
fi

# Ejra-ye CFST baraye IPv6
./cfst -nomenu -f ipv6.txt -n 500 -o result6.csv

# Khandan-e file-e CSV va estekhraj-e behtarin IPv6
preferred_ipv6=$(awk -F, 'NR==2 {print $1}' result6.csv)

# Barresi mikonim aya IPv6 gerefte shode ast
if [ -z "$preferred_ipv6" ]; then
  echo "Failed to get the preferred IPv6 address."
else
  echo "BETTER IPv6: $preferred_ipv6"

  # Gereftan-e ID-ye rekord-e IPv6
  ipv6_record_id=$(get_record_id "AAAA")

  if [ -n "$ipv6_record_id" ]; then
    # Be-roz-resani-ye rekord-e IPv6
    update_dns_record "$ipv6_record_id" "AAAA" "$preferred_ipv6"
    echo "Updated DNSPod record with IPv6: $preferred_ipv6"
  else
    # Sakhtan-e rekord-e IPv6
    new_ipv6_record_id=$(create_dns_record "AAAA" "$preferred_ipv6")
    if [ -n "$new_ipv6_record_id" ]; then
      echo "Created DNSPod record with IPv6: $preferred_ipv6"
    else
      echo "Failed to create DNSPod record with IPv6."
    fi
  fi
fi
