

$a = "a" 
$BUILD_DIR = "..\build"

$BASE_APP_NAME = "QRSmeteor"
$VERSION = "1.0.0"
$DOCKER_TAG = "qhose/" + $BASE_APP_NAME + ":" + $VERSION
$PORT = 80

# Remove-Item $BUILD_DIR\* -recurse -Force
# meteor build --architecture=os.linux.x86_64 --allow-superuser --directory $BUILD_DIR
Copy-Item Dockerfile $BUILD_DIR\bundle
Copy-Item *.pem $BUILD_DIR\bundle
cd $BUILD_DIR
# "docker build -t $(DOCKER_TAG):$(VERSION) ."
