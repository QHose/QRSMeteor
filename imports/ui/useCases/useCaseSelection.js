import '/imports/ui/useCases/useCaseSelection.html';
import './SSBI/SSBI.js';
import { Session } from 'meteor/session';

Template.useCaseSelection.events({
    'click .webIntegrationDemo' () {
        login('John');
    },
})

Template.useCaseSelection.onRendered(function() {
    this.$('.cards .card').css('visibility', 'hidden');

    this.$('.cards .card')
        .transition({
            animation: 'fade in',
            reverse: 'auto', // default setting
            interval: 800,
            duration  : 2000
        });

      this.$('.special.cards .image').dimmer({
        on: 'hover'
    });
    
    this.$('.dropdown-menu a').on('click', function(){
        role = $(this).attr("data")
        console.log(role);
        Session.set('userRole', role);
        // Set the active class
        $('.dropdown-menu li').removeClass('active')
        $(this).parent().addClass('active');
    });
})

Template.useCaseSelection.helpers({
    tasks: [
        { text: 'This is task 1' },
        { text: 'This is task 2' },
        { text: 'This is task 3' },
    ],
    userRole() {
        let role = 'Select a role'
        if (Session.get('userRole')) {
            role = Session.get('userRole')
            $('.dropdown-menu li').find(role).parent().addClass('active')
        } else {
            Session.set('userRole', role);
        }
        return role;
    },
    appURL() {
        return Session.get('appUrl');
    },
});

function login(user) {
    console.log('login ', user, Meteor.userId());
    try {

        Meteor.call('simulateUserLogin', user, (error, result) => {
            if(error) {
                sAlert.error(error);
                console.log(error);
            } else {
                console.log('All other users logged out, and we inserted the new user ' + user + ' in the local database');
                sAlert.success(user + ' is now logged in into Qlik Sense');
            }
        })
    } catch(err) {
        sAlert.error(err.message);
    }
};
