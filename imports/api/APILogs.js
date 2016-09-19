import { Mongo } from 'meteor/mongo';
 
export const APILogs = new Mongo.Collection('apiLogs'); 

Meteor.startup(function () {  
  APILogs._ensureIndex({ "createdBy": 1});
  APILogs._ensureIndex({ "createDate": 1});
});

export function REST_Log(call, userId='Not defined'){
	call.createDate = new Date();
	call.createdBy = userId
	APILogs.insert(call);
	return;
}
