Echo install choco
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"

Echo install software
choco install meteor github-desktop git -params '"/GitAndUnixToolsOnPath"' dotnet4.5.2 visualstudiocode logfusion microsoft-build-tools vcbuildtools -y
REM choco install firefox googlechrome visualstudiocode logfusion microsoft-build-tools adobereader openoffice qdir notepadplusplus lastpass 7zip.install vcbuildtools -y

REM choco install nodejs --version 8.8.1 -y

c:\windows\syswow64\WindowsPowerShell\v1.0\powershell.exe -command set-executionpolicy remotesigned

echo refresh environment variables and paths
call refreshenv

echo clone GitHub projects
git clone https://GitHub.com/QHose/QRSMeteor.git --branch simplify-settings-file c:\GitHub\QRSMeteor
git clone https://GitHub.com/QHose/senseWebIntegration.git c:\GitHub\SenseWebIntegration

echo install qrsmeteor npm modules
cd c:\GitHub\QRSMeteor
call meteor npm install --save


echo install sensewebintegration npm modules
cd c:\GitHub\SenseWebIntegration
call meteor npm install --save

