import { senseConfig } from '/imports/api/config.js';


Template.landingPage.onCreated(function() {
    //set a var so the sso ticket request page knows he has to login the real user and not some dummy user of step 4
    //after the user is redirected to the sso page, we put this var to false. in that way we can still request dummy users for step 4 of the demo
    Session.setAuth('loginUserForPresentation', true);
    console.log('landingPage ONCREATED, loginUserForPresentation: ', Session.get('loginUserForPresentation'));
})

Template.selectSlide.onRendered(function() {
    this.$('.ui.accordion')
        .accordion();
})

Template.landingPage.onRendered(function() {
    //show a popup so the user can select whether he is technical or not...
    this.$('#userSelectPresentationModal').modal('show')
        .modal({
            observeChanges: true,
            onDeny: function() {
                console.log('group has been set to technical, now the iframe can be shown which tries to open the presentation virtual proxy');
                Session.setAuth('groupForPresentation', 'technical');
            },
            onApprove: function() {
                Session.setAuth('groupForPresentation', 'general');
            }
        });
    refreshModal();

    function refreshModal() {
        Meteor.setTimeout(function() { refreshModal() }, 1);
        this.$('#userSelectPresentationModal').modal('refresh');
    }

    Session.set('landingPageAlreadySeen', true);
})

Template.integrationSlideContent.helpers({

})


Template.landingPage.events({
    'click #start': function(event) {
        event.preventDefault() // to stop the browser from hijacking the event
        Router.go('slideGenerator'); //GO TO THE SLIDE GENERATOR
    }
})

Template.userSelectPresentationModal.onRendered(function() {
    console.log('modal rendered');
})

var appId = Meteor.settings.public.IntegrationPresentationApp;
var IntegrationPresentationSelectionSheet = Meteor.settings.public.IntegrationPresentationSelectionSheet; //'DYTpxv'; selection sheet of the slide generator
var slideObject = Meteor.settings.public.IntegrationPresentationSlideObject;

Template.landingPage.helpers({
    slideObjectURL: function() {
        return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + Meteor.settings.public.IntegrationPresentationProxy + '/single/?appid=' + appId + '&obj=' + slideObject;
    }
})
