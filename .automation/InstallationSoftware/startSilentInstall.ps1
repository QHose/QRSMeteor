$SHARED_NAME = "QlikSenseShare"
$SHARED_FOLDER = "C:\" + $SHARED_NAME
Write-Host 'Creating a shared folder on' $SHARED_FOLDER
New-Item $SHARED_FOLDER –type directory
New-SmbShare –Name $SHARED_NAME –Path $SHARED_FOLDER –FullAccess Everyone  

$Username = "qService"
$Password = "Qlik123"

$group = "Administrators"

$adsi = [ADSI]"WinNT://$env:COMPUTERNAME"
$existing = $adsi.Children | where {$_.SchemaClassName -eq 'user' -and $_.Name -eq $Username }

if ($existing -eq $null) {

    Write-Host "Creating new local user $Username."
    & NET USER $Username $Password /add /y /expires:never
    
    Write-Host "Adding local user $Username to $group."
    & NET LOCALGROUP $group $Username /add

}
else {
    Write-Host "Setting password for existing local user $Username."
    $existing.SetPassword($Password)
}

Write-Host "Ensuring password for $Username never expires."
& WMIC USERACCOUNT WHERE "Name='$Username'" SET PasswordExpires=FALSE

$url = "https://qliktechnologies365-my.sharepoint.com/personal/mbj_qlik_com/_layouts/15/guestaccess.aspx?docid=07856511345d94c879526d0704de32982&authkey=AeXFme3frDQT9_63NE_-XOY"
$QlikSenseInstaller = "$SHARED_FOLDER\Qlik_Sense_setup.exe"
$start_time = Get-Date

Write-Host 'Download and start Qlik Sense installer...'
$ProgressPreference = 'SilentlyContinue'
# Invoke-WebRequest -Uri $url -OutFile $QlikSenseInstaller
Write-Output "Time taken: $((Get-Date).Subtract($start_time).Seconds) second(s)"


& $QlikSenseInstaller -s -l ".\log.txt" spc='.\spc.cfg' userwithdomain="$env:COMPUTERNAME\$Username" userpassword=$Password
Write-Output "Qlik Sense is installer is now running in the background, please wait 20 minutes... If ready you will see the shortcuts on your desktop. Try to open the QMC, but don't do anything... Next you can start QRSSTART.BAT for the second time. Make sure you adjust the settings-...Json file. set installQlikSense to false."