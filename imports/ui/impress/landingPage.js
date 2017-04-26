import { senseConfig } from '/imports/api/config.js';

Template.landingPage.onRendered(function() {
    this.$('.ui.accordion')
        .accordion();
    Session.set('landingPageAlreadySeen', true);
})

Template.landingPage.events({
    'click #start': function(event) {
        event.preventDefault() // to stop the browser from hijacking the event
        Router.go('slideGenerator'); //GO TO THE SLIDE GENERATOR
    }
})

var appId = Meteor.settings.public.IntegrationPresentationApp;
var IntegrationPresentationSelectionSheet = Meteor.settings.public.IntegrationPresentationSelectionSheet; //'DYTpxv'; selection sheet of the slide generator
var slideObject = Meteor.settings.public.IntegrationPresentationSlideObject;

Template.landingPage.helpers({
    slideObjectURL: function() {
        return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + 'anon' + '/single/?appid=' + appId + '&obj='+slideObject;
    }
})
