import { Mongo } from 'meteor/mongo';
 
export const Apps = new Mongo.Collection('apps');
export const TemplateApps = new Mongo.Collection('templateApps');
export const GeneratedResources = new Mongo.Collection('generatedResources');

Meteor.startup(function () {  
  TemplateApps._ensureIndex({ "generationUserId": 1});
  GeneratedResources._ensureIndex({ "generationUserId": 1});
});