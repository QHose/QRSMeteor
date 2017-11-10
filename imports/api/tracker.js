import { Mongo } from 'meteor/mongo';

//stores all the clicks and slides shown
export const Tracker = new Mongo.Collection('tracker');