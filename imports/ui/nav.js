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

const Cookies = require('js-cookie');
export var VIDEO_OVERVIEW = 'Video overview';

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
            duration: '9s'
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
                Router.go('useCaseSelection');
                break;
            case 'SSBI':
                selectMenuItemInSense('What is governed self service?')
                break;
            case 'generation':
                selectMenuItemInSense('Qlik Sense SaaS provisioning demo');
                break;
            case 'embedding':
                selectMenuItemInSense('Qlik Sense SaaS provisioning demo');
                window.location.replace('http://' + Meteor.settings.public.webIntegrationHost + ':' + Meteor.settings.public.webIntegrationDemoPort);
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
            top: '30%',
            height: window.innerHeight * 0.85
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

Template.yourSaasPlatformMenu.onRendered(function() {
    this.$('.ui.dropdown.saasDemo')
        .dropdown()
});

export async function selectMenuItemInSense(slide) {
    console.log('selectMenuItemInSense - slide', slide)
    Cookies.set('currentMainRole', 'TECHNICAL');
    try {
        var qix = await slideApp.getQix();
        var myField = await qix.app.getField('Level 2');
        var result = await myField.selectValues(
            [{
                "qText": slide
            }]
        )
        Router.go('slides');
    } catch (error) {
        var message = 'Can not connect to the Qlik Sense Engine API via enigmaJS';
        console.error(message, error);
        sAlert.error(message, error);
    };
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