Echo install choco
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"

Echo install software
choco install github-desktop git -params '"/GitAndUnixToolsOnPath"' -y
choco install meteor 7zip.install firefox googlechrome visualstudiocode adobereader openoffice notepadplusplus qdir logfusion dotnet4.5.2 lastpass microsoft-build-tools vcbuildtools -y

choco install nodejs --version 8.8.1 -y

c:\windows\syswow64\WindowsPowerShell\v1.0\powershell.exe -command set-executionpolicy remotesigned

@echo off
echo.
echo Refreshing PATH from registry

:: Get System PATH
for /f "tokens=3*" %%A in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path') do set syspath=%%A%%B

:: Get User Path
for /f "tokens=3*" %%A in ('reg query "HKCU\Environment" /v Path') do set userpath=%%A%%B

:: Set Refreshed Path
set PATH=%userpath%;%syspath%

echo Refreshed PATH
echo %PATH%

echo clone GitHub projects
git clone https://GitHub.com/QHose/QRSMeteor.git --branch simplify-settings-file c:\GitHub\QRSMeteor
git clone https://GitHub.com/QHose/senseWebIntegration.git c:\GitHub\SenseWebIntegration

echo install module to read json files via node (to be able to set env. vars.)
npm install -g json

echo install windows build tools
npm install --global windows-build-tools

echo install qrsmeteor npm modules
cd c:\GitHub\QRSMeteor
meteor npm install --save


echo install sensewebintegration npm modules
cd c:\GitHub\SenseWebIntegration
meteor npm install --save

