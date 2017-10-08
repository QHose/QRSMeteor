$SHARED_NAME = "QlikSenseShare"
$SHARED_FOLDER = "C:\"+$SHARED_NAME
Write-Host 'Creating a shared folder on' $SHARED_FOLDER
New-Item $SHARED_FOLDER –type directory
New-SmbShare –Name $SHARED_NAME –Path $SHARED_FOLDER –FullAccess Everyone  

# & 'c:\Qlik Sense Server.exe' -s -repair -l ".\log.txt" spc='.\spc.cfg' userwithdomain='QLIK-AB0Q2URN5T\Qlikexternal' userpassword='Database3'