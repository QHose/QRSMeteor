import '/imports/ui/useCases/useCaseSelection.html';
import './SSBI/SSBI.js';
import { Session } from 'meteor/session';
const Cookies = require('js-cookie');

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
    
    if (localStorage.userRole) {
        this.$(`.description .dropdown-menu li a[data="${localStorage.userRole}"]`).parent().addClass('active')
        // this.$(`.description .dropdown-menu li a[data="Business Analyst"]`).parent().addClass('active')
    }

    this.$('.dropdown-menu a').on('click', function(){
        role = $(this).attr("data")
        // Session.set('userRole', role);
        localStorage['userRole'] = role;
        // Set the active class
        $('.dropdown-menu li').removeClass('active')
        $(this).parent().addClass('active');
        // switch (role) {
        //     case 'Developer':
        //         console.log(1);
        //         Router.go('/webIntegrationDemo');
        //         break;
        //     case 'Product Owner':
        //         console.log(2);
        //         Router.go('/webIntegrationDemo');
        //         break;
        //     case 'Hosting Ops Professional':
        //         console.log(3);
        //         Router.go('/impress');
        //         break;
        //     case 'Business Analyst':
        //         console.log(4);
        //         Router.go('/selfService');
        //         break;
        //     case 'C-Level executive, non-technical':
        //         console.log(5);
        //         Router.go('/selfService');
        //         break;
        // }
        // if (role==='Developer') {
        //     console.log(1);
        //     Router.go('/webIntegrationDemo');
        // }
    });
})

Template.useCaseSelection.helpers({
    tasks: [
        { text: 'This is task 1' },
        { text: 'This is task 2' },
        { text: 'This is task 3' },
    ],
    userRole() {
        let role = setUserRole();
        return role;
    },
    appURL() {
        return Session.get('appUrl');
    },
});

function setUserRole() {
    let role = 'Select a role'
    // if (Session.get('userRole')) {
    //     role = Session.get('userRole')
    //     $('.dropdown-menu li').find(role).parent().addClass('active')
    // } else {
    //     Session.set('userRole', role);
    // }         
    if (localStorage.userRole) {
        role = localStorage.userRole
    } else {
        localStorage['userRole'] = role;
    }
    return role;
}
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
