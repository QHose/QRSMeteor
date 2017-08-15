import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { senseConfig as config } from '/imports/api/config.js';
import { Session } from 'meteor/session';
// import { Apps, TemplateApps } from '/imports/api/apps.js'
// import { Customers, dummyCustomers } from '../api/customers.js';
// import { Streams } from '/imports/api/streams.js'
const Cookies = require('js-cookie');

Template.nav.helpers({
    isDemoPage() {
        return Router.current().route.getName() === 'generation';
    },
});

Template.SSBINav.helpers({
    userRole() {
        let role = setUserRole();
        return role;
    },
});
Template.ImpressNav.helpers({
    userRole() {        
        let role = setUserRole();
        return role;
    },
});
Template.documentationNav.helpers({
    userRole() {
        let role = setUserRole();
        return role;
    },
});
Template.SSBINav.onRendered(function() {
    this.$('.header .dropdown-toggle').dropdown()
    this.$('.header .dropdown-toggle').on('click', function(){
        $('.header .dropdown-menu').toggle()
    });
    if (localStorage.userRole) {
        this.$(`.navbar-right .dropdown-menu li a[data="${localStorage.userRole}"]`).parent().addClass('active')
    }
    this.$('.header .dropdown-menu a').on('click', function(){
        role = $(this).attr("data")
        Session.set('userRole', role);
        $('.dropdown-menu li').removeClass('active')
        $(this).parent().addClass('active');
        $('.header .dropdown-menu').toggle()
    });
});
Template.ImpressNav.onRendered(function() {
    this.$('.header .dropdown-toggle').dropdown()
    this.$('.header .dropdown-toggle').on('click', function(){
        $('.header .dropdown-menu').toggle()
    });
    if (localStorage.userRole) {
        this.$(`.navbar-right .dropdown-menu li a[data="${localStorage.userRole}"]`).parent().addClass('active')
    }
    this.$('.header .dropdown-menu a').on('click', function(){
        role = $(this).attr("data")
        Session.set('userRole', role);
        $('.dropdown-menu li').removeClass('active')
        $(this).parent().addClass('active');
        $('.header .dropdown-menu').toggle()
    });
});
Template.documentationNav.onRendered(function() {
    let tab = getQueryParams('tab');
    if (tab==='video') {
        this.$('.navbar-left li').removeClass('active');
        this.$('.navbar-left li[data-tab="video"]').addClass('active')
    }
    if (localStorage.userRole) {
        this.$(`.navbar-right .dropdown-menu li a[data="${localStorage.userRole}"]`).parent().addClass('active')
    }
    this.$('.header .dropdown-toggle').dropdown()
    this.$('.header .dropdown-toggle').on('click', function(){
        $('.header .dropdown-menu').toggle()
    });
    this.$('.header .dropdown-menu a').on('click', function(){
        role = $(this).attr("data")
        Session.set('userRole', role);
        $('.dropdown-menu li').removeClass('active')
        $(this).parent().addClass('active');
        $('.header .dropdown-menu').toggle()
    });
});
Template.SSBINav.events({
    // 'click .header .dropdown-toggle' () {
    //     $('.header .dropdown-menu').toggle()
    // },
});

Template.yourSaasPlatformMenu.onRendered(function() {
    this.$('.ui.dropdown')
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