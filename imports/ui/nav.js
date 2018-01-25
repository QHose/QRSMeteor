import {
    Meteor
} from 'meteor/meteor';
import {
    Template
} from 'meteor/templating';
import {
    senseConfig
} from '/imports/api/config.js';
const enigma = require('enigma.js');
import {
    getQix
} from '/imports/ui/useCases/useCaseSelection';

import {
    Session
} from 'meteor/session';
import * as slideApp from '/imports/ui/useCases/useCaseSelection';
import './nav.html';
const Cookies = require('js-cookie');
export var VIDEO_OVERVIEW = 'Video overview';
export var WEB_INTEGRATION = 'Options to embed Qlik Sense: from simple to advanced use cases';

Template.nav.helpers({
    isPage(page) {
        if (Router.current().route)
            return Router.current().route.getName() === page;
    }
});


Template.nav.onRendered(function() {
    this.$('.selectSlides')
        .transition({
            animation: 'bounce',
            duration: '16s'
        });
});

//
// ─── CLICK EVENTS ON MENU ITEMS ─────────────────────────────────────────────────
//


Template.nav.events({
    'click a': function(event, template) {
        event.preventDefault();
        var menuItem = event.currentTarget.id;
        switch (menuItem) {
            case 'home':
                FlowRouter.go('useCaseSelection');
                break;
            case 'SSBI':
                selectMenuItemInSense('What is governed self service?')
                break;
            case 'generation':
                selectMenuItemInSense('Qlik Sense SaaS provisioning demo');
                break;
            case 'embedding':
                selectMenuItemInSense(WEB_INTEGRATION);
                // window.location.replace('http://' + Meteor.settings.public.webIntegrationHost + ':' + Meteor.settings.public.webIntegrationDemoPort);
                break;
            case 'video':
                selectMenuItemInSense(VIDEO_OVERVIEW);
                break;
            case 'sheetSelector':
                showSlideSelector()
                break;
        }
    }
});

export function showSlideSelector() {
    $('.ui.modal.sheetSelector')
        .modal('show')
        .css({
            position: "fixed",
            top: '260px',
            'min-height': '500px'
        })
        .modal({
            onVisible: function() {
                $(".ui.modal.sheetSelector").modal("refresh");
            },
            onHide: function() {
                console.log('hidden');
                abortQlikModalState();
            },
            // onShow: function() {
            //     console.log('shown');
            // },
        })

}
async function abortQlikModalState() {
    console.log('slide selection modal closed');
    var ticket = 'dummy, user should already be authenticated at this point...'
    var qix = await getQix(ticket);
    qix.app.abortModal(true);
}

export async function selectViaQueryId(mongoId) {
    console.log('selectViaQueryId(mongoId)', mongoId);
    var qSelection = await Meteor.callPromise('getSenseSelectionObject', mongoId)
    console.log('qSelection result from mongoDB', qSelection)
    if (qSelection) {
        await makeSelectionInFields(qSelection.selection);
    } else {
        sAlert.warning('We could not retreive a stored selection for this id...')
    }
}

// if people click on a menu item, you want a specific slide to be selected, so the slide is the value to search for...
export async function selectMenuItemInSense(slide) {
    console.log('selectMenuItemInSense - slide', slide)
    Cookies.set('currentMainRole', 'TECHNICAL');
    var selection = [{
        "qText": slide
    }]
    await makeSelectionInField("Level 2", selection);
    Meteor.setTimeout(function() {
        FlowRouter.go('slides');
    }, 200)
}


export async function makeSelectionInField(fieldName, value) {
    console.log('makeSelectionInField', fieldName + ' : ' + value.toString());
    try {
        var qix = await slideApp.getQix();
        var myField = await qix.app.getField(fieldName);
        var result = await myField.selectValues(value);
    } catch (error) {
        var message = 'makeSelectionInField: Can not connect to the Qlik Sense Engine API via enigmaJS';
        console.error(message + ' Sense reported the following error: ', error);
        location.reload(); //reload the page
        sAlert.error(message, error);
    };

}

//array of qSelections
export async function makeSelectionInFields(selections) {
    console.log('makeSelectionInFields(selections)', selections);
    //for each qField
    selections.forEach(function(selectionField) {
        console.log('selectionField', selectionField)
            //for each selected value (qSelectedFieldSelectionInfo) (e.g. country can have germany and france selected)
        var selectValues = [];
        selectionField.qSelectedFieldSelectionInfo.forEach(function(fieldValue) {
            console.log('fieldValue', fieldValue)
            selectValues.push({
                "qText": fieldValue.qName,
                "qIsNumeric": false,
                "qNumber": 0
            })
            console.log('selectValues', selectValues)
        })
        makeSelectionInField(selectionField.qField, selectValues);
    });
}