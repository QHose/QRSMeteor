echo clone github projects
git clone https://github.com/QHose/QRSMeteor.git --branch simplify-settings-file c:\github\QRSMeteor
git clone https://github.com/QHose/senseWebIntegration.git c:\github\SenseWebIntegration

echo install qrsmeteor npm modules
cd c:\github\QRSMeteor
meteor npm install --save


echo install sensewebintegration npm modules
cd c:\github\SenseWebIntegration
meteor npm install --save