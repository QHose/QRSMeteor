FROM node:4.8.3
# Set one or more individual labels
LABEL maintainer="Martijn Biesbroek"

ADD . /qrsbundle
WORKDIR /qrsbundle/programs/server
RUN npm install \
  && npm cache clear
WORKDIR /qrsbundle
EXPOSE 3000
## the settings.json file has been copied to the directory. Run.sh will execute node including the settings.json
CMD bash ./run.sh
# CMD ["node", "main.js"]