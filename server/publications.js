//import meteor collections
import { Apps, TemplateApps, GeneratedResources } from '/imports/api/apps';
import { Streams } from '/imports/api/streams';
import { Customers } from '/imports/api/customers';
import { APILogs } from '/imports/api/APILogs';


Meteor.publish('apps', function() {
    return Apps.find();
});

Meteor.publish('streams', function() {
    return Streams.find();
});

Meteor.publish('templateApps', function() {
    return TemplateApps.find();
});

Meteor.publish('generatedResources', function() {
    return GeneratedResources.find();
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
