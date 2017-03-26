ServiceConfiguration.configurations.upsert({
  service: "facebook"
}, {
  $set: {
    appId : Meteor.settings.private.facebook.clientId,
    loginStyle: "popup",
    secret: Meteor.settings.private.facebook.secret
  }
});

// "AccountsUiConfig": {
//       "passwordSignupFields": "USERNAME_AND_OPTIONAL_EMAIL",
//       "requestPermissions": {
//         "facebook": [
//           "email",
//           "user_friends",
//           "friends_events",
//           "friends_location",
//           "friends_about_me",
//           "friends_status"
//         ]
//       }


ServiceConfiguration.configurations.remove({
  service: "linkedin"
});
ServiceConfiguration.configurations.insert({
service: "linkedin",
clientId: "",
secret: ""
});

// first, remove configuration entry in case service is already configured
ServiceConfiguration.configurations.remove({
  service: "twitter"
});
ServiceConfiguration.configurations.insert({
  service: "twitter",
  consumerKey: Meteor.settings.private.twitter.clientId,
  loginStyle: "popup",
  secret: Meteor.settings.private.twitter.secret
});

const numberOfUsers = Meteor.users.find().count();
console.log('Checking the user accounts, number of users is: '+ numberOfUsers )

if (!numberOfUsers) {
    var id= Accounts.createUser({
        username: 'demo',
        email: 'demo@qlik.com',
        password: 'schiphol',
        profile: { name: 'Qlik test user' }
    });
	console.log('user created with id: ', id);	
	Roles.addUsersToRoles(id, 'test', Roles.GLOBAL_GROUP);

	id= Accounts.createUser({
        username: 'admin',
        email: 'mbj@qlik.com',
        password: 'Qlik456464',
        profile: { name: 'Qlik admin user' }
    });
	console.log('user created with id: ', id);	
	Roles.addUsersToRoles(id, 'admin', Roles.GLOBAL_GROUP);
}

ServiceConfiguration.configurations.upsert({
    service: "google"
}, {
    $set: {
        clientId: Meteor.settings.private.google.clientId,
        loginStyle: "popup",
        secret: Meteor.settings.private.google.secret
    }
});
