import { Meteor } from 'meteor/meteor';
import express from 'express';
import onepresalesServerAuth from 'onepresales-server-auth';


export function setupApi() {

  const app = express();
  onepresalesServerAuth(app, { relayState: '/slides' } );

  WebApp.connectHandlers.use(app);
}