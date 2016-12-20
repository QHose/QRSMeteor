import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { senseConfig as config } from '/imports/api/config';
import '/imports/ui/UIHelpers';

import 'impress';
import './impress.html';
import './impress.css';

var api = {};

Template.impress.onCreated(function() {})

Template.impress.onRendered(function() {
    impressInitialized = Session.get('impressInitialized');
    if (!impressInitialized) {
        console.log('impress was NOT yet initialized');
        api = impress();
        api.init();
        Session.set('impressInitialized', true);
    } else {
        console.log('impress was ALREADY initialized');
        location.reload();
    }    

    Template.instance()
        .$('.ui.embed')
        .embed();
})

Template.impress.onDestroyed(function() {
    $('body').attr('style', 'height: 100%;');
})
