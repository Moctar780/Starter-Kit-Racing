@echo off
setlocal
set PORT=8080
if not "%PORT_OVERRIDE%"=="" set PORT=%PORT_OVERRIDE%
echo Demarrage sur http://localhost:%PORT%
npm start
