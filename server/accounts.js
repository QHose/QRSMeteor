// ServiceConfiguration.configurations.upsert({
//     service: "facebook"
// }, {
//     $set: {
//         appId: Meteor.settings.private.facebook.clientId,
//         loginStyle: "popup",
//         secret: Meteor.settings.private.facebook.secret
//     }
// });

// ServiceConfiguration.configurations.upsert({
//     service: "github"
// }, {
//     $set: {
//         clientId: Meteor.settings.private.github.clientId,
//         loginStyle: "popup",
//         secret: Meteor.settings.private.github.secret
//     }
// });

// ServiceConfiguration.configurations.upsert({
//     service: "linkedin"
// },{
//     loginStyle: "popup",
//     service: "linkedin",
//     clientId: Meteor.settings.private.linkedin.clientId,
//     secret: Meteor.settings.private.linkedin.secret,
// });


// ServiceConfiguration.configurations.upsert({
//     service: "twitter"  
// },{
//     service: "twitter",
//     consumerKey: Meteor.settings.private.twitter.clientId,
//     loginStyle: "popup",
//     secret: Meteor.settings.private.twitter.secret
// });


// ServiceConfiguration.configurations.upsert({
//     service: "google"
// }, {
//     $set: {
//         clientId: Meteor.settings.private.google.clientId,
//         loginStyle: "popup",
//         secret: Meteor.settings.private.google.secret
//     }
// });


const numberOfUsers = Meteor.users.find().count();
console.log('Checking the user accounts, number of users is: ' + numberOfUsers)

if (!numberOfUsers) {
    var id = Accounts.createUser({
        username: 'demo',
        email: 'demo@qlik.com',
        password: 'schiphol',
        profile: { name: 'Qlik test user' }
    });
    console.log('user created with id: ', id);
    Roles.addUsersToRoles(id, 'test', Roles.GLOBAL_GROUP);

    id = Accounts.createUser({
        username: 'admin',
        email: 'mbj@qlik.com',
        password: 'Qlik456464',
        profile: { name: 'Qlik admin user' }
    });
    console.log('user created with id: ', id);
    Roles.addUsersToRoles(id, 'admin', Roles.GLOBAL_GROUP);
}
