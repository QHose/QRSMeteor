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

