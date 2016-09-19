import { Mongo } from 'meteor/mongo';
 
export const Streams = new Mongo.Collection('streams');

Meteor.startup(function() {
    Streams._ensureIndex({ "id": 1 });
});
