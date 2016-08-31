//import meteor collections
import { Apps, TemplateApps, GeneratedResources } from '/imports/api/apps';
import { Streams } from '/imports/api/streams';
import { Customers } from '/imports/api/customers';
import { APILogs } from '/imports/api/APILogs';


Meteor.publish('apps', function() {
    if (Roles.userIsInRole(this.userId, ['admin'], Roles.GLOBAL_GROUP)) {
        return Apps.find();

    } else {
        const generatedAppsFromUser = GeneratedResources.find({ generationUserId: this.userId })
            .map(function(resource) {
                return resource.appId;
            });

        return Apps.find({
            $or: [{ "id": { "$in": generatedAppsFromUser } }, { "stream.name": "Templates" }]
        });
    }
});

Meteor.publish('streams', function() {
    if (Roles.userIsInRole(this.userId, ['admin'], Roles.GLOBAL_GROUP)) {
        return Apps.find();

    } else {
        const generatedStreamsFromUser = GeneratedResources.find({ generationUserId: this.userId })
            .map(function(resource) {
                return resource.streamId;
            })
        return Streams.find({
            $or: [{ "id": { "$in": generatedStreamsFromUser } }, { "name": "Templates" }]
        });
    }
});
Meteor.publish('templateApps', function() {
    return TemplateApps.find();
});

Meteor.publish('generatedResources', function() {
    return GeneratedResources.find({});
});

Meteor.publish('customers', function() {
    return Customers.find();
});

Meteor.publish('apiLogs', function() {
    return APILogs.find();
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
