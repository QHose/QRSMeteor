<<<<<<< HEAD
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
=======
import {
    Template
} from 'meteor/templating';
import {
    Meteor
} from 'meteor/meteor';
import {
    Session
} from 'meteor/session';
import {
    senseConfig as config
} from '/imports/api/config';
>>>>>>> simplify-settings-file

import './layout.html';
import './presentation.html';
import './presentation';
import '../checkConfig.html';
import '/imports/ui/nav.html';
import '/imports/ui/nav.js';
import {
    getQix
} from '/imports/ui/useCases/useCaseSelection';


Template.layout.helpers({
    NoSenseConnection() {
        return Session.get('NoSenseConnection');
    },
    slideShowActive() {
        console.log('Router.current().route.getName()', Router.current().route.getName())
        return Router.current().route.getName() === 'slides';
    }
});

<<<<<<< HEAD
=======
Template.emptyLayout.onRendered(function() {
    Template.instance().$('.dimmer')
        .dimmer('show');
});


>>>>>>> simplify-settings-file
Template.loginDimmer.onRendered(function() {
    Template.instance().$('.dimmer')
        .dimmer('show');
});

Template.modalSaaSautomation.onRendered(function() {
    this.$('.ui.embed').embed();
});

Template.emptyContainerLayout.events({
    'keydown, click': function(event, template) {
        Template.instance().$('*').popup('remove popup')
    }
})

Template.footer.helpers({
    permaLinkSelectionId() {
        return Session.get('currentSelectionId');
    },
    slideShowActive() {
        return Router.current().route.getName() === 'slides';
    }
});

Template.layout.events({
    'keydown, click': function(event, template) {
        Template.instance().$('*').popup('remove popup')
    },
    'click .stepByStep' () {
        $('.ui.modal.stepByStep')
            .modal('show')
            .modal('refresh')
            .modal('refresh');
    },
    'click .howDoesSaaSAutomationWork' () {
        $('.ui.modal.howDoesSaaSAutomationWork')
            .modal('show')
            .modal('refresh')
            .modal('refresh');
    },
    'click .selfservice' () {
        $('.ui.modal.SSBI')
            .modal('show')
            .modal('refresh')
            .modal('refresh');
    },
    'click .APIAutomation' () {
        $('.ui.modal.APIAutomation')
            .modal('show')
            .modal('refresh')
            .modal('refresh');
    },
})

Template.layout.onCreated(function() {
    //see https://guide.meteor.com/data-loading.html
    this.subscribe('streams');
    this.subscribe('customers');

    const templateAppsHandle = Meteor.subscribe('templateApps');
    const apiLogsHandle = Meteor.subscribe('apiLogs');
    const senseSelectionsHandle = Meteor.subscribe('SenseSelections');
    const customersHandle = Meteor.subscribe('customers', { //http://stackoverflow.com/questions/28621132/meteor-subscribe-callback
        onReady: function() {
            // if (freshEnvironment()) {
            //     console.log('There is a freshEnvironment');
            //     insertTemplateAndDummyCustomers()
            //     Session.setAuth('currentStep', 3);
            // };
        },
        onError: function() {
            console.log("onError", arguments);
        }
    });
});


// Template.slideSelectionSheet.onRendered(function() {
//     $('#sheetSelector').modal({
//         // onHide: async function() {
//         //     await abortQlikModalState();
//         // },
//         onHidden: async function() {
//             console.log('------------------------------------');
//             console.log('on hidden clicked');
//             console.log('------------------------------------');
//             await abortQlikModalState();
//         },
//         onHide: function() {
//             console.log('hidden');

//         },
//         onShow: function() {
//             console.log('shown');
//         },
//     })
// })