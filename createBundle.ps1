$BASE_APP_NAME = "qrsmeteor"
$BUILD_DIR = "..\qrsbuild"
$BUNDLE_DIR = "..\qrsbuild\bundle"
$VERSION = "1.0.0"
$DOCKER_TAG = "qhose/" + $BASE_APP_NAME + ":" + $VERSION

echo "STEP delete old build files"
Remove-Item $BUNDLE_DIR* -recurse -Force

echo "STEP build new meteor bundle"
meteor build --architecture=os.linux.x86_64 --allow-superuser --directory $BUILD_DIR

echo "STEP copy dockerfile to bundle folder, so docker can build the image"
Copy-Item Dockerfile $BUNDLE_DIR
Copy-Item startNode.sh $BUNDLE_DIR

echo  "STEP go to bundle dir" 
cd "$BUNDLE_DIR"

echo "STEP build the Dockerfile (which has been copied already in the bundle dir)"
echo "STEP Building Dockerfile via command: docker build -t $DOCKER_TAG"
docker build "-t" "$DOCKER_TAG" "."

echo "docker push qhose/qrsmeteor:1.0.0"
docker push "$DOCKER_TAG" 

#at the end, go back to the folder where we started
cd "C:\Users\mbj\Documents\GitHub\QRSMeteor"
