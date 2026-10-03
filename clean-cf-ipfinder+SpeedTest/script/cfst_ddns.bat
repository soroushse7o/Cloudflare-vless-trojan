:: --------------------------------------------------------------
::	Proje: CloudflareSpeedTest - be-roz-resani-ye khodkar-e rekord-e DNS
::	Noskhe: 1.0.6
::	Nevisande: XIU2
::	Proje: https://github.com/XIU2/CloudflareSpeedTest
:: --------------------------------------------------------------
@echo off
Setlocal Enabledelayedexpansion

:: Inja mitavanid parametr-haye ejra-ye CFST ra ezafe ya taghir dahid. echo.| baraye in ast ke khodkar Enter bezanad va barname kharej shavad (dige lazem nist -p 0 bezarid)
:: -nomenu: menu-ye avval namayesh dade nemishavad
echo.|cfst.exe -nomenu -o "result_ddns.txt"

:: Barresi mikonim file-e natije vojud darad ya na; agar nadarad yani natije 0 ast
if not exist result_ddns.txt (
    echo.
    echo Tedad-e IP-haye natije-ye CFST 0 ast, marahel-e bad ra rad mikonim...
    goto :END
)

for /f "skip=1 tokens=1 delims=," %%i in (result_ddns.txt) do (
    Echo %%i
    if "%%i"=="" (
        echo.
        echo Tedad-e IP-haye natije-ye CFST 0 ast, marahel-e bad ra rad mikonim...
        goto :END
    )
::  Raveshe API Key - dastresi-ye kamel
    curl -X PUT "https://api.cloudflare.com/client/v4/zones/ZONE_ID/dns_records/DNS_RECORD_ID" ^
            -H "X-Auth-Email: EMAIL-E-HESAB" ^
            -H "X-Auth-Key: API-KEY-E-ghabli" ^
            -H "Content-Type: application/json" ^
            --data "{\"type\":\"A\",\"name\":\"DOMAIN-E-KAMEL\",\"content\":\"%%i\",\"ttl\":1,\"proxied\":true}"
::  Raveshe API Token - dastresi-ye sefareshi. Agar mikhahid az in raveshe estefade konid, bala ra hazf ya comment konid va "::" ebteda-ye khat-haye zir ra bardarid.
::    curl -X PUT "https://api.cloudflare.com/client/v4/zones/ZONE_ID/dns_records/DNS_RECORD_ID" ^
::            -H "Authorization: Bearer API-TOKEN-E-ghabli" ^
::            -H "Content-Type: application/json" ^
::            --data "{\"type\":\"A\",\"name\":\"DOMAIN-E-KAMEL\",\"content\":\"%%i\",\"ttl\":1,\"proxied\":true}"

        goto :END
)
:END
pause
