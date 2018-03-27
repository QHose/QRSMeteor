FROM node:8.8.1
# Set one or more individual labels
LABEL maintainer="Martijn Biesbroek"
EXPOSE 3000

# we assume your bundle dir is the current dir on the docker host, lets copy it to the container
# so in my case . refers to C:\Users\Qlikexternal\Documents\GitHub\QRSMeteor\.build\bundle
# in the container we will create a new directory meteorQRS and copy the contents of C:\Users\Qlikexternal\Documents\GitHub\QRSMeteor\.build\bundle to it. 
ADD . /meteorQRS

# add a settings-example file to the container, the source code uses this file to validate if the user specified all keys in his settings file.
ADD ./settings-development-example.json /meteorQRS/programs/server/

# cd into the new directory, and go to the server folder
WORKDIR /meteorQRS/programs/server

# make sure all the NPM modules are downloaded again (via the settings in the package.json file in the server bundle\...\server folder)
RUN npm install

# cd to the dir where the startup script is
WORKDIR /meteorQRS

## the settings.json file has been linked (via a volume from windows to linux) to the /meteorQRS/config directory. startNode.sh will execute node including the settings.json
CMD ["bash", "./startNode.sh"]