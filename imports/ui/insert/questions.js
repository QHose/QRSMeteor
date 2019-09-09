import SimpleSchema from 'simpl-schema';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';

const FieldValueIs = new Mongo.Collection('FieldValueIs');
FieldValueIs.attachSchema(new SimpleSchema({
  a: {
    type: String,
    allowedValues: ['foo', 'bar']
  },
  b: {
    type: String
  }
}, { tracker: Tracker }));