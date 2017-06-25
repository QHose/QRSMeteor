import '/imports/ui/useCases/useCaseSelection.html';
import './SSBI/SSBI.js';



Template.useCaseSelection.events({
    'click .webIntegrationDemo' () {
        login('John');
    },
})


Template.useCaseSelection.onRendered(function() {
    this.$('.cards .card').css('visibility', 'hidden'); //hide cards before we can fade them in

    this.$('.cards .card')
        .transition({
            animation: 'fade in',
            reverse: 'auto', // default setting
            interval: 800,
            duration: 2000
        });

    this.$('.special.cards .image').dimmer({
        on: 'hover'
    });
})

function login(user) {
    console.log('login ', user, Meteor.userId());
    try {

        Meteor.call('simulateUserLogin', user, (error, result) => {
            if(error) {
                sAlert.error(error);
                console.log(error);
            } else {
                console.log('All other users logged out, and we inserted the new user ' + user + ' in the local database');
                sAlert.success(user + ' is now logged in to Qlik Sense');
            }
        })
    } catch(err) {
        sAlert.error(err.message);
    }
};
