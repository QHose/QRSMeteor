Accounts.onCreateUser(function (options, user) {
    user.profile = {};
    // create a empty array to avoid the Exception while invoking method 'adminCheckAdmin'
    user.emails = [];
    console.log('here');
    if (Meteor.users.find().count()===0) {
        user.roles = ['admin'];
    }

    return user;
});

ServiceConfiguration.configurations.upsert({
  service: "facebook"
}, {
  $set: {
    appId : Meteor.settings.private.facebook.clientId,
    loginStyle: "popup",
    secret: Meteor.settings.private.facebook.secret
  }
});

ServiceConfiguration.configurations.upsert({
  service: "google"
}, {
  $set: {
    clientId: Meteor.settings.private.google.clientId,
    loginStyle: "popup",
    secret: Meteor.settings.private.google.secret
  }
});


// // first, remove configuration entry in case service is already configured
// ServiceConfiguration.configurations.remove({
//   service: "google"
// });
// ServiceConfiguration.configurations.insert({
//   service: "google",
//   clientId: "411682799732-r38hgfr9nlh0c0udigt4ln23ma8db93k.apps.googleusercontent.com",
//   loginStyle: "popup",
//   secret: "YCP43OPc_-tGlVqvj-o-hbu1"
// });