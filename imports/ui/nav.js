import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { senseConfig as config } from '/imports/api/config.js';
import { Session } from 'meteor/session';
// import { Apps, TemplateApps } from '/imports/api/apps.js'
// import { Customers, dummyCustomers } from '../api/customers.js';
// import { Streams } from '/imports/api/streams.js'
const Cookies = require('js-cookie');

Template.nav.helpers({
    isSaaSDemoPage() {
        return Router.current().route.getName() === 'generation' || Router.current().route.getName() === 'SaaSIntroduction';
    },
    isDocumentationPage() {
        return Router.current().route.getName() === 'documentation';
    },
    isSelfServicePage() {
        return Router.current().route.getName() === 'selfService';
    },
    isVideoPage() {
        return Router.current().route.getName() === 'videoOverview';
    },
    isMainLandingPage() {
        return !Router.current().route.getName() || Router.current().route.getName() === 'useCaseSelection';
    },
    userRole() {
        let role = setUserRole();
        return role;
    },
});


Template.nav.onRendered(function() {

    this.$('.header .dropdown-toggle').dropdown()
    this.$('.header .dropdown-toggle').on('click', function() {
        $('.header .dropdown-menu').toggle()
    });
    if (localStorage.userRole) {
        this.$(`.navbar-right .dropdown-menu li a[data="${localStorage.userRole}"]`).parent().addClass('active')
    }
    this.$('.header .dropdown-menu a').on('click', function() {
        role = $(this).attr("data")
        Session.set('userRole', role);
        $('.dropdown-menu li').removeClass('active')
        $(this).parent().addClass('active');
        $('.header .dropdown-menu').toggle()
    });
});


Template.yourSaasPlatformMenu.onRendered(function() {
    this.$('.ui.dropdown.saasDemo')
        .dropdown()
});

function setUserRole() {
    let role = 'Select a role'
    if (localStorage.userRole) {
        role = localStorage.userRole
    } else {
        localStorage['userRole'] = role;
    }
    return role;
}

// Replace with more Meteor approach
function getQueryParams(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}