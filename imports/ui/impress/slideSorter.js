import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { senseConfig as config } from '/imports/api/config';

import './impress.css'; //slides you see when you start the multi tenant demo
import './impressJSModifiedSource.js'


Template.slideSorter.onRendered(function() {
})

Template.slideSorter.onDestroyed(function() {
    $('body').attr('style', 'height: 100%;');
})
