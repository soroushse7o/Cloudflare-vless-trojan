:: --------------------------------------------------------------
::	Proje: CloudflareSpeedTest - be-roz-resani-ye khodkar-e 3Proxy
::	Noskhe: 1.0.6
::	Nevisande: XIU2
::	Proje: https://github.com/XIU2/CloudflareSpeedTest
:: --------------------------------------------------------------
@echo off
Setlocal Enabledelayedexpansion

:: Barresi mikonim aya dastresi-ye Administrator darim

>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system" 

if '%errorlevel%' NEQ '0' (  
    goto UACPrompt  
) else ( goto gotAdmin )  

:: Yek script-e vbs minevisim ta in script (bat) ra ba dastresi-ye Administrator ejra konad

:UACPrompt  
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs" 
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs" 
    "%temp%\getadmin.vbs" 
    exit /B  

:: Agar script-e vbs-e movaghat vojud darad, hazf mikonim
  
:gotAdmin  
    if exist "%temp%\getadmin.vbs" ( del "%temp%\getadmin.vbs" )  
    pushd "%CD%" 
    CD /D "%~dp0" 


:: Bala: barresi-ye dastresi-ye Administrator (agar nadashtim migirim). Paein: code-e asli-ye script


:: Agar file-e nowip_3proxy.txt vojud nadarad yani avvalin bar ast ke script ejra mishavad
if not exist "nowip_3proxy.txt" (
    echo Kar-e in script: bad az test-e sorat, sari-tarin IP ra migirad va IP-ye ghadimi-ye Cloudflare CDN dar file-e tanzimat-e 3Proxy ra avaz mikonad.
    echo Mitavanad hame-ye IP-haye Cloudflare CDN ra be sari-tarin IP redirect konad va hame-ye sait-haye Cloudflare CDN ra yek-jaa sari konad.
    echo Ghabl az estefade in ra bekhanid: https://github.com/XIU2/CloudflareSpeedTest/discussions/71
    echo.
    set /p nowip="IP-ye Cloudflare CDN ke felan 3Proxy estefade mikonad ra vared konid va Enter bezanid (dafe-ye bad lazem nist):"
    echo !nowip!>nowip_3proxy.txt
    echo.
)  

:: IP-ye Cloudflare CDN ke felan estefade mishavad ra az file-e nowip_3proxy.txt migirim
set /p nowip=<nowip_3proxy.txt
echo Shoro-e test-e sorat...


:: In RESET baraye kasani ast ke "ta vaghti IP-ye monaseb peyda nashode test-e dobare anjam shavad" ra mikhahand
:: Agar in ghabeliat ra mikhahid, se ta goto :STOP-e paein ra be goto :RESET tabdil konid
:RESET


:: Inja mitavanid parametr-haye ejra-ye CFST ra ezafe ya taghir dahid. echo.| baraye in ast ke khodkar Enter bezanad va barname kharej shavad (dige lazem nist -p 0 bezarid)
:: -nomenu: menu-ye avval namayesh dade nemishavad
echo.|cfst.exe -nomenu -o "result_3proxy.txt"


:: Barresi mikonim file-e natije vojud darad ya na; agar nadarad yani natije 0 ast
if not exist result_3proxy.txt (
    echo.
    echo Tedad-e IP-haye natije-ye CFST 0 ast, marahel-e bad ra rad mikonim...
    goto :STOP
)

:: Sari-tarin IP ra az avvalin radif migirim
for /f "skip=1 tokens=1 delims=," %%i in ('more result_3proxy.txt') do (
    SET bestip=%%i
    goto :END
)

:END

:: Barresi mikonim IP-ye jadid khali nabashad va ba IP-ye ghadimi yeksan nabashad
if "%bestip%"=="" (
    echo.
    echo Tedad-e IP-haye natije-ye CFST 0 ast, marahel-e bad ra rad mikonim...
    goto :STOP
)
if "%bestip%"=="%nowip%" (
    echo.
    echo IP-ye jadid ba IP-ye ghadimi yeksan ast, niaz be taghir nist...
    goto :STOP
)


:: Code-e zir baraye halat-e "ta vaghti IP-ye monaseb peyda nashode test-e dobare anjam shavad" lazem ast
:: Vaghti hadd-e aghal-e sorat-e download moshakhas shode ama hich IP-i hame-ye shart-ha ra nadashte bashad, CFST hame-ye IP-ha ra khoroji midahad
:: Pas vaghti az parametr-e -sl estefade mikonid, bayad :: ebteda-ye khat-haye zir ra bardarid ta tedad-e khat-haye file barresi shavad (masalan tedad-e download 10 ast, adad ra 11 gozashte shavad)
::set /a v=0
::for /f %%a in ('type result_3proxy.txt') do set /a v+=1
::if %v% GTR 11 (
::    echo.
::    echo CFST hich IP-i ke hame-ye shart-ha ra dashte bashad peyda nakard, test-e dobare...
::    goto :RESET
::)


echo %bestip%>nowip_3proxy.txt
echo.
echo IP-ye ghadimi: %nowip%
echo IP-ye jadid: %bestip%



:: Lotfan "D:\Program Files\3Proxy" ra be masir-e nasb-e 3Proxy-ye khodetan tabdil konid
CD /d "D:\Program Files\3Proxy"
:: Ghabl az ejra-ye in script motmaen shavid 3Proxy dorost kar mikonad!



echo.
echo Shoro-e backup-giri az file-e 3proxy.cfg (3proxy.cfg_backup)...
copy 3proxy.cfg 3proxy.cfg_backup
echo.
echo Shoro-e jaygozini...
(
    for /f "tokens=*" %%i in (3proxy.cfg_backup) do (
        set s=%%i
        set s=!s:%nowip%=%bestip%!
        echo !s!
        )
)>3proxy.cfg

net stop 3proxy
net start 3proxy

echo Tamam shod...
echo.
:STOP
pause
