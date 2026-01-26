@echo off
setlocal enableextensions

for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$ip = $null; $cfg = Get-NetIPConfiguration; $wifi = $cfg | Where-Object { $_.InterfaceAlias -eq 'Wi-Fi' -and $_.IPv4Address } | Select-Object -First 1; if ($wifi) { $ip = $wifi.IPv4Address[0].IPAddress } else { $best = $cfg | Where-Object { $_.IPv4DefaultGateway -and $_.IPv4Address -and $_.InterfaceAlias -notmatch 'Proton|VPN|TAP|WireGuard' } | Select-Object -First 1; if ($best) { $ip = $best.IPv4Address[0].IPAddress } else { $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Sort-Object -Property IPAddress | Select-Object -First 1 -ExpandProperty IPAddress) } } ; $ip"`) do set PC_IP=%%i

if "%PC_IP%"=="" set PC_IP=192.168.1.69

echo.
echo ===============================================
echo  LAN: ouvre ce lien sur ton telephone:
echo  http://%PC_IP%:3000
echo ===============================================
echo.
echo Backend API: http://%PC_IP%:8000
echo.
echo Lancement des serveurs...
echo.

start "Backend" cmd /k "cd /d backend && python manage.py runserver 0.0.0.0:8000"
start "Frontend" cmd /k "cd /d frontend && npm start"

endlocal
