import { senseConfig, authHeaders } from '/imports/api/config.js';
import { REST_Log } from '/imports/api/APILogs';

Template.landingPage.onCreated(function() {
    //set a var so the sso ticket request page knows he has to login the real user and not some dummy user of step 4
    //after the user is redirected to the sso page, we put this var to false. in that way we can still request dummy users for step 4 of the demo
    // Session.setAuth('loginUserForPresentation', true);
    Session.setAuth('groupForPresentation', null);
    console.log('first logout the current presentation user in Qlik Sense. This enables him to reselect the user type');
    Meteor.call('logoutPresentationUser', Meteor.userId(), Meteor.userId()); //udc and user are the same for presentation users
    // logoutCurrentSenseUserClientSide();
})

function logoutCurrentSenseUserClientSide() {
    //http://help.qlik.com/en-US/sense-developer/3.2/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-ProxyServiceAPI-Personal-Delete.htm
    try {
        // const call = {};
        const RESTCALL = 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + Meteor.settings.public.IntegrationPresentationProxy + '/qps/user';
        // $.ajax({
        //     method: 'DELETE',
        //     url: RESTCALL
        // }).done(function(res) {
        //     //logging only
        //     call.action = 'Logout current Qlik Sense user'; //
        //     call.request = RESTCALL;
        //     call.url = 'http://help.qlik.com/en-US/sense-developer/3.2/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-ProxyServiceAPI-Personal-Delete.htm';
        //     call.response = res;
        //     REST_Log(call, Meteor.userId());
        // });

        $.ajax({
            url: 'http://presales1:81/presentation/qps/user', //RESTCALL,
            type: 'DELETE',
            success: function(result) {
                // Do something with the result
            }
        });
    } catch (err) {
        console.error(err);
        throw new Meteor.Error('Failed to logout the user via the personal API', err.message);
    }
}

Template.selectSlide.onRendered(function() {
    this.$('.ui.accordion')
        .accordion();
})
Template.selectSlide.helpers({
    slideObjectURL: function() {
        return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + Meteor.settings.public.IntegrationPresentationProxy + '/single/?appid=' + appId + '&obj=' + slideObject;
    }
})

Template.landingPage.onRendered(function() {
    //show a popup so the user can select whether he is technical or not...
    this.$('#userSelectPresentationModal').modal('show')
        .modal({
            observeChanges: true,
            onDeny: function() {
                console.log('group has been set to TECHNICAL, we use this group to request a ticket in Qlik Sense. Using Section access we limit what a user can see. Now the iframe can be shown which tries to open the presentation virtual proxy');
                Session.setAuth('groupForPresentation', 'TECHNICAL');
            },
            onApprove: function() {
                Session.setAuth('groupForPresentation', 'GENERIC');
                console.log('group has been set to GENERIC. This group is used in the ticket to limit section access (Rows)');
            }
        });
    refreshModal();

    function refreshModal() {
        Meteor.setTimeout(function() { refreshModal() }, 1);
        this.$('#userSelectPresentationModal').modal('refresh');
    }

    console.log('LandingPage.js: set landingPageAlreadySeen to true');
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
