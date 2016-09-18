//import meteor collections
import { Apps, TemplateApps, GeneratedResources } from '/imports/api/apps';
import { Streams } from '/imports/api/streams';
import { Customers } from '/imports/api/customers';
import { APILogs } from '/imports/api/APILogs';
import moment from 'moment';

//only fill the local mongoDB that runs in the browser with data that belongs to the user...
//https://www.meteor.com/tutorials/blaze/publish-and-subscribe
Meteor.publish('apps', function(generatedAppsFromUser) {
    if (Roles.userIsInRole(this.userId, ['admin'], Roles.GLOBAL_GROUP)) {
        return Apps.find();

    } else {
        console.log('Client subscribed to collection, with these generated app ids: ', generatedAppsFromUser);
        if (!generatedAppsFromUser) {
            generatedAppsFromUser = [];
            // console.log('##### No generated resources exists yet, so only show the template apps')
        } else {
            // console.log('### publication recevied these generated app ids for the user: ', generatedAppsFromUser);
        }
        return Apps.find({
            $or: [{ "id": { "$in": generatedAppsFromUser } }, { "stream.name": "Templates" }, { "stream.name": "Everyone" }]
        });
    }
    this.ready();
});

Meteor.publish('streams', function(generatedStreamsFromUser) {
    if (Roles.userIsInRole(this.userId, ['admin'], Roles.GLOBAL_GROUP)) {
        return Streams.find();

    } else {
        if (!generatedStreamsFromUser) {
            generatedStreamsFromUser = [];
        }
        return Streams.find({
            $or: [{ "id": { "$in": generatedStreamsFromUser } }, { "name": "Templates" }, { "name": "Everyone" }]
        });

    }
    this.ready();
});
Meteor.publish('templateApps', function() {
    return TemplateApps.find();
    this.ready();
});

Meteor.publish('generatedResources', function() {
    return GeneratedResources.find({ 'generationUserId': this.userId });
    this.ready();
});

Meteor.publish('customers', function() {
    return Customers.find({ 'generationUserId': this.userId });
    this.ready();
});

Meteor.publish('apiLogs', function() {
    const selector = {
        "createDate": {
            $lt: new Date(),
            $gte: new Date(new Date().setDate(new Date().getDate() - 1))  //show only the last day  of api logs
        }
    };
    return APILogs.find(selector);
    this.ready();
});

Meteor.publish('users', function() {
    //See https://github.com/alanning/meteor-roles
    if (Roles.userIsInRole(this.userId, ['admin'], Roles.GLOBAL_GROUP)) {
        return APILogs.find();
    } else {
        // user not authorized. do not publish secrets
        this.stop();
        return;
    }
});
