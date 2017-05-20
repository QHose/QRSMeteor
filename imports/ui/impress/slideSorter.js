import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { senseConfig as config } from '/imports/api/config';

import './impress.css'; //slides you see when you start the multi tenant demo
import './impressJSModifiedSource.js'


Template.slideSorter.onRendered(function() {
    Template.instance()
        .$('.ui.embed')
        .embed();
    api = impress();
    // api.init();
    // document.body.classList.add("impress-disabled");
    // document.body.classList.remove("impress-enabled");
})

Template.slideSorter.onDestroyed(function() {
    $('body').attr('style', 'height: 100%;');
})
