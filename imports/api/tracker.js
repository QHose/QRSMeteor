import { Mongo } from 'meteor/mongo';

//stores all the clicks and slides shown
export const Logger = new Mongo.Collection('logger');