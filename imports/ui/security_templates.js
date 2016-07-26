// import { Accounts } from 'meteor/accounts-base';
// import { Template } from 'meteor/templating';
// import { Meteor } from 'meteor/meteor';
// import { senseConfig } from '/imports/api/config.js';

// Template.register.events({
//     'submit form': function(event) {
//         event.preventDefault();
//         var email = $('[name=email]')
//             .val();
//         var password = $('[name=password]')
//             .val();
//         Accounts.createUser({
//             email: email,
//             password: password
//         }, function(error) {
//             if (error) {
//                 console.log(error.reason); // Output error if registration fails
//             } else {
//                 Router.go("home"); // Redirect user if registration succeeds
//             }
//         });
//         Router.go('generation');
//     }
// });


// Template.login.events({
//     'submit form': function(event) {
//         event.preventDefault();
//         var email = $('[name=email]')
//             .val();
//         var password = $('[name=password]')
//             .val();
//         Meteor.loginWithPassword(email, password, function(error) {
//             if (error) {
//                 console.log(error.reason);
//             } else {
//                 Router.go("home");
//             }
//         });
//     }
// })
