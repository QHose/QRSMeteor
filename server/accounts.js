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