FROM node:4.8.3
# Set one or more individual labels
LABEL maintainer="Martijn Biesbroek"
EXPOSE 3000

# we assume your bundle dir is the current dir on the docker host, lets copy it to the container
ADD . /meteorQRS  
# cd into the new directory, and go to the server folder
WORKDIR /meteorQRS/programs/server

# make sure all the NPM modules are downloaded again (via the settings in the package.json file in the server bundle\...\server folder)
RUN npm install \
  && npm cache clear

# cd to the dir where the startup script is
WORKDIR /meteorQRS

## the settings.json file has been linked (via a volume from windows to linux) to the /meteorQRS/config directory. startNode.sh will execute node including the settings.json
CMD ["bash", "./startNode.sh"]