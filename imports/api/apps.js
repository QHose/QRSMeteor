import { Mongo } from 'meteor/mongo';
 
export const Apps = new Mongo.Collection('apps');
export const TemplateApps = new Mongo.Collection('templateApps');