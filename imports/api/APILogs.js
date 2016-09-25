import { Mongo } from 'meteor/mongo';

export const APILogs = new Mongo.Collection('apiLogs');

export function REST_Log(call, userId = 'Not defined') {
    call.createDate = new Date();
    call.createdBy = userId;
    if (Meteor.isServer) {
        APILogs.rawCollection().insert(call);
    } else {
        APILogs.insert(call);
    }
    return;

}
