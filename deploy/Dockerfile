# deploy/Dockerfile
# Dockerfile for your app.
# Change "QRSMeteor" in the Dockerfile to your app's name
FROM node:4.4.7-slim
MAINTAINER Martijn Biesbroek
RUN apt-get install -y curl
RUN curl https://install.meteor.com/ | /bin/sh

ADD . /opt/QRSMeteor/app

# Install NPM packages
WORKDIR /opt/QRSMeteor/app/programs/server
RUN npm install
# Set environment variables 
WORKDIR /opt/QRSMeteor/app
ENV PORT 80
ENV ROOT_URL http://127.0.0.1
ENV MONGO_URL mongodb://mongo_instance:27017/QRSMeteor
# Expose port 80
EXPOSE 80
# Start the app
CMD node ./main.js