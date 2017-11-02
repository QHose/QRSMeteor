Echo install choco
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"

Echo install software
choco install 7zip.install firefox googlechrome visualstudiocode adobereader qdir logfusion meteor github-desktop git -params '"/GitAndUnixToolsOnPath"' -y
