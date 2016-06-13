// Template.generation.onRendered(function() {
//     console.log("Meteor SSO module received a forwarded request form the Qlik Sense proxy. This code gets executed if this SSO page has been loaded, so a good moment to get the current simulated logged in user, and request a ticket via a meteor method on the server")
//     current = Session.get('currentUser');
//     console.log('SSO client page, the current simulated user logged in for which we request a ticket is: '+currentUser);

//     // Meteor.call('SSO', Session.get('currentUser'), (error, result) => {
//     //     if (error) {
//     //         sAlert.error(error);
//     //         console.log(error);
//     //     } else {
//     //         console.log('User succesfully authenticated here in Meteor, and forwarded back to Qlik Sense with a valid ticket');
//     //         sAlert.success("User succesfully authenticated here in Meteor, and forwarded back to Qlik Sense with a valid ticket");
//     //     }
//     // })
// });
