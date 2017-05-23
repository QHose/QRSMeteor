import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { senseConfig as config } from '/imports/api/config';
import { unsupportedBrowser } from '/imports/ui/layouts/layout';
import '/imports/ui/UIHelpers';

import './impress.html';
import './ppt_integration.html';
import './ppt_integration';
import './integrationMain.html';
import './integrationMain';
import './slideSorter.html';
import './slideSorter';

import './landingPage.html';
import './landingPage.js';

import './impress.css'; //slides you see when you start the multi tenant demo
import './impressJSModifiedSource.js'

var api = {};
Template.impress.onCreated(function() {
    if(unsupportedBrowser()) {
        console.log('this browser is not supported, so skip the slides');
        Router.go('generation');
    }
})

Template.impress.onRendered(function() {
    impressInitialized = Session.get('impressInitialized');
    if(!impressInitialized) {
        // console.log('impress was NOT yet initialized');
        api = impress();
        api.init();
        Session.set('impressInitialized', true);
    } else {
        // console.log('impress was ALREADY initialized');
        location.reload();
    }

    Template.instance()
        .$('.ui.embed')
        .embed();
})

Template.impress.onDestroyed(function() {
    $('body').attr('style', 'height: 100%;');
})
