Echo install choco
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command " [System.Net.ServicePointManager]::SecurityProtocol = 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"

Echo install software
choco install meteor github-desktop googlechrome git -params '"/GitAndUnixToolsOnPath"' dotnet4.5.2 visualstudiocode logfusion microsoft-build-tools vcbuildtools -y
REM choco install firefox adobereader openoffice qdir notepadplusplus lastpass 7zip.install -y
REM choco install vlc skype adobereader googlechrome avgantivirusfree 7zip.install dropbox lastpass onedrive -y
REM choco install nodejs --version 8.8.1 -y

c:\windows\syswow64\WindowsPowerShell\v1.0\powershell.exe -command set-executionpolicy remotesigned

echo refresh environment variables and paths
call refreshenv

echo clone GitHub projects
REM git clone https://GitHub.com/QHose/QRSMeteor.git --branch simplify-settings-file c:\GitHub\QRSMeteor
git clone https://GitHub.com/QHose/QRSMeteor.git --branch master c:\GitHub\QRSMeteor
git clone https://GitHub.com/QHose/senseWebIntegration.git c:\GitHub\SenseWebIntegration

echo install qrsmeteor npm modules
cd c:\GitHub\QRSMeteor
call meteor npm install --save


echo install sensewebintegration npm modules
cd c:\GitHub\SenseWebIntegration
call meteor npm install --save

