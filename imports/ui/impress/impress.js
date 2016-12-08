import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { senseConfig as config } from '/imports/api/config';
import '/imports/ui/UIHelpers';

import 'impress';
import './impress.html';
import './impress.css';

var api = {};

Template.impress.onCreated(function() {
    location.reload();
})

Template.impress.onRendered(function() {
    api = impress();
    api.init();

    Template.instance()
        .$('.ui.embed')
        .embed();
})

Template.impress.onDestroyed(function() {
    console.log('impress onDestroyed');
    $('body').attr('style', 'height: 100%;');
})
