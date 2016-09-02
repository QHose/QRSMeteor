import { Mongo } from 'meteor/mongo';
 
export const APILogs = new Mongo.Collection('apiLogs');

export function REST_Log(call){
	call.createDate = new Date();
	call.createdBy = this.userId;
	APILogs.insert(call);

}
