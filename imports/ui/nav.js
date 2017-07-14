import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { senseConfig as config } from '/imports/api/config.js';
// import { Apps, TemplateApps } from '/imports/api/apps.js'
// import { Customers, dummyCustomers } from '../api/customers.js';
// import { Streams } from '/imports/api/streams.js'

Template.nav.helpers({
    isDemoPage() {
        return Router.current().route.getName() === 'generation';
    },
});

Template.SSBINav.helpers({
    userRole() {
        console.log(11111)
        let role = 'Select a role'
        if (Session.get('userRole')) {
            role = Session.get('userRole')
            $('.dropdown-menu li').find(role).parent().addClass('active')
        } else {
            Session.set('userRole', role);
        }
        return role;
    },
});

Template.SSBINav.onRendered(function() {
    // this.$('.self-service.header .dropdown-toggle').dropdown()
    this.$('.dropdown-toggle').dropdown()
    this.$('.dropdown-menu a').on('click', function(){
        console.log(444)
        role = $(this).attr("data")
        console.log(role);
        Session.set('userRole', role);
        // Set the active class
        $('.dropdown-menu li').removeClass('active')
        $(this).parent().addClass('active');
    });
});

Template.yourSaasPlatformMenu.onRendered(function() {
    this.$('.ui.dropdown')
        .dropdown()
});
