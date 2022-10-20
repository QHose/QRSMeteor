    cd C:\GitHub\QRSMeteor
    $PROJECT_ROOT = (Get-Item -Path ".\" -Verbose).FullName
    echo "Build tool project root directory: "$PROJECT_ROOT
    $BASE_APP_NAME = "integrationv2"
    $BUILD_DIR = ".\.build"
    $BUNDLE_DIR = $BUILD_DIR+"\bundle"
    $VERSION = Get-Date -format yyyyMMdd-Hmm
    $DOCKER_TAG = "qhose/" + $BASE_APP_NAME + ":" + $VERSION
    Write-Host "Creating a new QRSMeteor docker image, and publish it to docker hub: $DOCKER_TAG"
    
    function Remove-PathToLongDirectory 
    {
        Param(
            [string]$directory
        )
    
        # create a temporary (empty) directory
        $parent = [System.IO.Path]::GetTempPath()
        [string] $name = [System.Guid]::NewGuid()
        $tempDirectory = New-Item -ItemType Directory -Path (Join-Path $parent $name)
    
        robocopy /MIR $tempDirectory.FullName $directory | out-null
        Remove-Item $directory -Force -Recurse | out-null
        Remove-Item $tempDirectory -Force -Recurse | out-null
    }
    
    # echo "STEP delete old build files"
    # Remove-PathToLongDirectory $BUILD_DIR -recurse

    # echo "STEP build new meteor bundle"
    # meteor build --architecture=os.linux.x86_64 --allow-superuser --directory $BUILD_DIR

    echo "STEP copy dockerfile to bundle folder, so docker can build the image"
    Copy-Item Dockerfile $BUNDLE_DIR
    Copy-Item startNode.sh $BUNDLE_DIR
    Copy-Item settings-development-example.json $BUNDLE_DIR    

    echo  "STEP go to bundle dir" 
    cd "$BUNDLE_DIR"

    echo "STEP build the Dockerfile (which has been copied already in the bundle dir)"
    echo "STEP Building Dockerfile via command: docker build -t $DOCKER_TAG"
    docker build "-t" "$DOCKER_TAG" "."

    echo "docker push $DOCKER_TAG"
    docker push "$DOCKER_TAG" 

    #at the end, go back to the folder where we started
    cd $PROJECT_ROOT

