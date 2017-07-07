$BUILD_DIR = "..\qrsbuild"
$BUNDLE_DIR = "..\qrsbuild\bundle"
$BASE_APP_NAME = "qrsmeteor"
$VERSION = "1.0.0"
$DOCKER_TAG = "qhose/" + $BASE_APP_NAME + ":" + $VERSION

echo "STEP delete old build files"
Remove-Item $BUNDLE_DIR* -recurse -Force

echo "STEP build new meteor bundle"
meteor build --architecture=os.linux.x86_64 --allow-superuser --directory $BUILD_DIR

echo "STEP copy dockerfile to bundle folder, so docker can build the image"
Copy-Item Dockerfile $BUNDLE_DIR
# Copy-Item *.pem $RUNCONFIG_DIR
# Copy-Item settings.json $RUNCONFIG_DIR
# Copy-Item run.sh $RUNCONFIG_DIR

echo  "STEP go to bundle dir" 
cd "$BUNDLE_DIR"

echo "STEP build the Dockerfile (which has been copied already in the bundle dir)"
$buildArg = $BASE_APP_NAME + ":" + $VERSION
echo "STEP Building Dockerfile via command: docker build -t $buildArg"
docker build "-t" "$buildArg" "."

echo "docker push qhose/qrsmeteor:1.0.0"
docker push "$DOCKER_TAG" 

#at the end, go back to the folder where we started
cd "C:\Users\mbj\Documents\GitHub\QRSMeteor"
