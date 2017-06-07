import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { senseConfig as config } from '/imports/api/config';

import './impress.css'; //slides you see when you start the multi tenant demo
import './impressJSModifiedSource.js'
import { initializePresentation } from './ppt_integration'

//for the slide sorter we needed to create a different template since the layout is different. But all logic comes from the ppt_integration part. 
// There you will also see the Template.registerHelpers

Template.ppt_slideSorter.onRendered(function() {
    initializePresentation();
    //after the page is loaded, ensure the slides have proper margins, and remove the scrollbar
    Meteor.setTimeout(function() {
        this.$('.step')
            .attr('style', 'margin-top: 40px; max-height: 100%;')
        this.$('.slideContent').css({ "visibility": "visible" });
    }, 1000);
})

// Template.slideSorter.onDestroyed(function() {
//     $('body').attr('style', 'height: 100%;');
// })
