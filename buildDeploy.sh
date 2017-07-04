#!/bin/bash
echo START create meteor node image.
## Author: Martijn Biesbroek based on Mark Shust <mark@shust.com>
## Version: 1.0.0
## Repo: https://github.com/markoshust/docker-meteor
## Description: Script for bundling, building & deploying a Meteor app with Docker
## script will be executed in the meteor project dir.


TARGET=$1
VERSION=$2
BASE_APP_NAME=QRSmeteor
APP_DIR=$PWD
BUILD_DIR=../build
DOCKER_TAG=qhose/$BASE_APP_NAME:$VERSION
NODE_ENV=production
PORT=80

PRODUCTION_APP_NAME=$BASE_APP_NAME
PRODUCTION_GIT_TAG=$VERSION
PRODUCTION_ROOT_URL=http://integration.qlik.com
PRODUCTION_SSH_CONN=production@bar.com
PRODUCTION_METEOR_SETTINGS=$(cat settings.json)
PRODUCTION_MONGO_URL="mongodb://heroku_r1wrm527:kcedtl5po5bna0qbj2rouo8cau@ds145892.mlab.com:45892/heroku_r1wrm527"

# STAGING_APP_NAME=$BASE_APP_NAME-staging
# STAGING_GIT_TAG=$VERSION-staging
# STAGING_ROOT_URL=https://staging.bar.com
# STAGING_SSH_CONN=staging@bar.com
# STAGING_METEOR_SETTINGS=$(cat ./.config/settings-staging.json)
# STAGING_MONGO_URL=$PRODUCTION_MONGO_URL

if [ -z "$TARGET" ]; then
  echo 'Missing deployment target. Possible values: staging, production'
  exit 0
elif [ -z "$VERSION" ]; then
  echo 'Missing version number. Ex. 1.0.0'
  exit 0
fi

case "$TARGET" in
  'staging' | 'production')
    if [ "$TARGET" = 'staging' ]; then
      APP_NAME=$STAGING_APP_NAME
      GIT_TAG=$STAGING_GIT_TAG
      ROOT_URL=$STAGING_ROOT_URL
      SSH_CONN=$STAGING_SSH_CONN
      METEOR_SETTINGS=$STAGING_METEOR_SETTINGS
      MONGO_URL=$STAGING_MONGO_URL
    elif [ "$TARGET" = 'production' ]; then
      APP_NAME=$PRODUCTION_APP_NAME
      GIT_TAG=$PRODUCTION_GIT_TAG
      ROOT_URL=$PRODUCTION_ROOT_URL
      SSH_CONN=$PRODUCTION_SSH_CONN
      METEOR_SETTINGS=$PRODUCTION_METEOR_SETTINGS
      MONGO_URL=$PRODUCTION_MONGO_URL
    fi
    echo "Building & deploying $DOCKER_TAG to $TARGET"
    echo ""
    ;;
  *)
    echo 'Invalid deployment target. Possible values: staging, production'
    exit 0
    ;;
esac

# echo remove all meteor dev_bundle files in the .meteor\local directory to prevent the EISDIR issue 
# $ find . -type f -name foo\* -exec rm {} \;
echo remove the complete build dir $BUILD_DIR 
rm -rf $BUILD_DIR

meteor npm install

echo "Building Meteor bundle to $BUILD_DIR"
meteor build --architecture=os.linux.x86_64 --allow-superuser --server=$ROOT_URL --directory $BUILD_DIR
