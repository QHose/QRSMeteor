import { Mongo } from 'meteor/mongo';

export const APILogs = new Mongo.Collection('apiLogs');

export function REST_Log(call, userId = 'Not defined') {
    call.createDate = new Date();
    call.generationUserId = userId;
    APILogs.insert(call);
}