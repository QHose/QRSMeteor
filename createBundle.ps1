$BUILD_DIR = "..\qrsbuild"
$BASE_APP_NAME = "qrsmeteor"
$VERSION = "1.0.0"
$DOCKER_TAG = "qhose/" + $BASE_APP_NAME + ":" + $VERSION
$PORT = 80

# echo "STEP delete old build files"
Remove-Item $BUILD_DIR\* -recurse -Force

# echo "STEP build new meteor bundle"
meteor build --architecture=os.linux.x86_64 --allow-superuser --directory $BUILD_DIR

echo "STEP copy dockerfile, settings.json and certificates to bundle folder"
Copy-Item Dockerfile $BUILD_DIR\bundle
# Copy-Item *.pem $BUILD_DIR\bundle
Copy-Item settings.json $BUILD_DIR\bundle
Copy-Item run.sh $BUILD_DIR\bundle

echo  "STEP go to bundle dir" 
cd "$BUILD_DIR\bundle"

echo "STEP build the Dockerfile (which has been copied already in the bundle dir)"
$buildArg = $BASE_APP_NAME + ":" + $VERSION
echo "STEP Building Dockerfile via command: docker build -t $buildArg"
docker build "-t" "$buildArg" "."

#for testing only, remove
cd "C:\Users\mbj\Documents\GitHub\QRSMeteor"
