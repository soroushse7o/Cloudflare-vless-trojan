:: --------------------------------------------------------------
::	Proje: CloudflareSpeedTest - be-roz-resani-ye khodkar-e Hosts
::	Noskhe: 1.0.5
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


:: Agar file-e nowip_hosts.txt vojud nadarad yani avvalin bar ast ke script ejra mishavad
if not exist "nowip_hosts.txt" (
    echo Kar-e in script: bad az test-e sorat, sari-tarin IP ra migirad va IP-ye ghadimi-ye Cloudflare CDN dar Hosts ra avaz mikonad.
    echo Ghabl az estefade in ra bekhanid: https://github.com/XIU2/CloudflareSpeedTest/issues/42#issuecomment-768273768
    echo.
    echo Baraye avvalin bar, aval hame-ye IP-haye Cloudflare CDN dar Hosts ra be yek IP-ye yeksan tabdil konid.
    set /p nowip="Hamin IP-ye Cloudflare CDN ra vared konid va Enter bezanid (dafe-ye bad lazem nist):"
    echo !nowip!>nowip_hosts.txt
    echo.
)  

:: IP-ye Cloudflare CDN ke felan dar Hosts hast ra az file-e nowip_hosts.txt migirim
set /p nowip=<nowip_hosts.txt
echo Shoro-e test-e sorat...


:: In RESET baraye kasani ast ke "ta vaghti IP-ye monaseb peyda nashode test-e dobare anjam shavad" ra mikhahand
:: Agar in ghabeliat ra mikhahid, se ta goto :STOP-e paein ra be goto :RESET tabdil konid
:RESET


:: Inja mitavanid parametr-haye ejra-ye CFST ra ezafe ya taghir dahid. echo.| baraye in ast ke khodkar Enter bezanad va barname kharej shavad (dige lazem nist -p 0 bezarid)
:: -nomenu: menu-ye avval namayesh dade nemishavad
echo.|cfst.exe -nomenu -o "result_hosts.txt"


:: Barresi mikonim file-e natije vojud darad ya na; agar nadarad yani natije 0 ast
if not exist result_hosts.txt (
    echo.
    echo Tedad-e IP-haye natije-ye CFST 0 ast, marahel-e bad ra rad mikonim...
    goto :STOP
)

:: Sari-tarin IP ra az avvalin radif migirim
for /f "skip=1 tokens=1 delims=," %%i in ('more result_hosts.txt') do (
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
::for /f %%a in ('type result_hosts.txt') do set /a v+=1
::if %v% GTR 11 (
::    echo.
::    echo CFST hich IP-i ke hame-ye shart-ha ra dashte bashad peyda nakard, test-e dobare...
::    goto :RESET
::)


echo %bestip%>nowip_hosts.txt
echo.
echo IP-ye ghadimi: %nowip%
echo IP-ye jadid: %bestip%

CD /d "C:\Windows\System32\drivers\etc"
echo.
echo Shoro-e backup-giri az file-e Hosts (hosts_backup)...
copy hosts hosts_backup
echo.
echo Shoro-e jaygozini...
(
    for /f "tokens=*" %%i in (hosts_backup) do (
        set s=%%i
        set s=!s:%nowip%=%bestip%!
        echo !s!
        )
)>hosts

echo Tamam shod...
echo.
:STOP
pause
