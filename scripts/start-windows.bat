@echo off
setlocal
cd /d "%~dp0"

set PORT=8080
if not "%PORT_OVERRIDE%"=="" set PORT=%PORT_OVERRIDE%

if not exist "Hakilidia-Racing.exe" (
	echo Hakilidia-Racing.exe est introuvable dans ce dossier.
	exit /b 1
)

echo Demarrage sur http://localhost:%PORT%
start "" "http://localhost:%PORT%"
"Hakilidia-Racing.exe" -p %PORT% -i 127.0.0.1 .
