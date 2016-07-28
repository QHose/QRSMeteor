// ServiceConfiguration.configurations.upsert({
//   service: "facebook"
// }, {
//   $set: {
//     appId : Meteor.settings.private.facebook.clientId,
//     loginStyle: "popup",
//     secret: Meteor.settings.private.facebook.secret
//   }
// });

ServiceConfiguration.configurations.upsert({
  service: "google"
}, {
  $set: {
    clientId: Meteor.settings.private.google.clientId,
    loginStyle: "popup",
    secret: Meteor.settings.private.google.secret
  }
});
