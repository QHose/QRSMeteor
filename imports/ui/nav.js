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
    Session
} from 'meteor/session';
import * as slideApp from '/imports/ui/useCases/useCaseSelection';

const Cookies = require('js-cookie');
export var VIDEO_OVERVIEW = 'Video overview';

Template.nav.helpers({
    // isSaaSDemoPage() {
    //     return Router.current().route.getName() === 'generation' || Router.current().route.getName() === 'SaaSIntroduction';
    // },
    // isDocumentationPage() {
    //     return Router.current().route.getName() === 'documentation';
    // },
    // isSelfServicePage() {
    //     return Router.current().route.getName() === 'selfService';
    // },
    // isVideoPage() {
    //     return Router.current().route.getName() === VIDEO_OVERVIEW;
    // },
    // isMainLandingPage() {
    //     return !Router.current().route.getName() || Router.current().route.getName() === 'useCaseSelection';
    // },
    isPage(page) {
        if (Router.current().route)
            return Router.current().route.getName() === page;
    },
    userRole() {
        let role = setUserRole();
        return role;
    },
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
                selectMenuItemInSense('LET’S DO A GOVERNED SELF SERVICE DEMO?')
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
            }
        })

    // $(".ui.modal.sheetSelector")
    //     .modal({
    //         onVisible: function() {
    //             $(".ui.modal.sheetSelector").modal("refresh");
    //         }
    //     })
    //     .modal("show");
}

Template.yourSaasPlatformMenu.onRendered(function() {
    this.$('.ui.dropdown.saasDemo')
        .dropdown()
});

export async function selectMenuItemInSense(slide) {
    console.log('selectMenuItemInSense - slide', slide)
    Cookies.set('currentMainRole', 'TECHNICAL');
    try {
        // get a valid ticket, if you select a menu item you want to navigate as an expert user...
        var userProperties = {
            group: 'Technical'
        };
        var ticket = await Meteor.callPromise('getTicketNumber', userProperties, Meteor.settings.public.slideGenerator.virtualProxy);
        var qix = await slideApp.getQix(ticket);
        var myField = await qix.app.getField('Level 2');
        var result = await myField.selectValues(
            [{
                "qText": slide
            }]
        )
        await slideApp.getAllSlides(qix, false);
        // await slideApp.setChangeListener(qix)
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