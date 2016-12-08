import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { senseConfig as config } from '/imports/api/config';
import '/imports/ui/UIHelpers';

import 'impress';
import './impress.html';
import './impress.css';

var api ={};

Template.impress.onCreated(function() {
        location.reload();

    // $('body').addClass('impress-supported impress-enabled impress-on-questions');
})

Template.impress.onRendered(function() {
    console.log('impress onRendered');
     api = impress();
    console.log('impress API: ', api);
    api.init();

    Template.instance()
        .$('.ui.embed')
        .embed();

    this.$('.slide')
        .transition('scale in');
})

Template.impress.onDestroyed(function() {
    console.log('impress onDestroyed');
    // $('body').removeClass('impress-supported impress-enabled impress-on-questions');
    // api = null;
})
