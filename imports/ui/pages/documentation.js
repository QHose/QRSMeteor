import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

Template.documentation.onRendered(function() {
    let tab = getQueryParams('tab');
    if (tab==='video') {
        this.$('.menu .item').removeClass('active');
        this.$('.menu .item[data-tab="seven"]').addClass('active')
        this.$('.ui.bottom.attached.tab.segment').removeClass('active');
        this.$('.ui.bottom.attached.tab.segment[data-tab="seven"]').addClass('active')
    }
    this.$('.menu .item')
        .tab();
});

Template.documentation.helpers({
    tabOneActive() {
        let role = 'Select a role'
        // if (Session.get('userRole')) {
        //     role = Session.get('userRole')
        //     $('.dropdown-menu li').find(role).parent().addClass('active')
        // } else {
        //     Session.set('userRole', role);
        // }    
        if (localStorage.userRole) {
            role = localStorage.userRole
            $('.dropdown-menu li').find(role).parent().addClass('active')
        } else {
            localStorage['userRole'] = role;
        }
        return role;
    },
    isTabArchitecture() {
        let tab = getQueryParams('tab');
        return (tab==='video')? null : 'active';
    },
    isTabVideo() {
        let tab = getQueryParams('tab');
        return (tab==='video')? 'active' : null;
    }
});

// @TODO Replace
function getQueryParams(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}