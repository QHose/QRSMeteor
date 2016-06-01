Meteor.publish('apps', function() {
    return Apps.find();
});