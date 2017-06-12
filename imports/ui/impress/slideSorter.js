import { Template } from 'meteor/templating';
import { senseConfig as config } from '/imports/api/config';

import './impress.css'; //slides you see when you start the multi tenant demo
import './impressJSModifiedSource.js'
import hljs from 'highlight.js';
import { initializePresentation, clearSlideCache, initCodeHighLightAndYouTube } from './ppt_integration'

//for the slide sorter we needed to create a different template since the layout is different. But all logic comes from the ppt_integration part. 
// There you will also see the Template.registerHelpers


Template.ppt_slideSorter.onCreated(function() {
    clearSlideCache();
})

Template.ppt_slideSorter.onRendered(function() {
    initializePresentation();
    init();
})

Template.slideSorter.onRendered(function() {
    initializePresentation();
    init();
})

//after the page is loaded, ensure the slides have proper margins, and remove the scrollbar
function init() {
    Meteor.setTimeout(function() {
        this.$('.step')
            // .removeClass("integration")
            .attr('style', 'margin-top: 40px; max-height: 100%;');
        // this.$('.slideContent').css({ "visibility": "visible" });
    }, 1000);
}

Template.ppt_slideSorter.events({
    'click .step' (event, template) {
        console.log('Data context of the slide (received from Qlik Sense Engine API) ', this);
        var $slide = $(event.target).closest(".step");
        // console.log('closest element: ', element);

        //zoom the slide if the user clicked on it.
        $slide.toggleClass("zoomOut");

        $slide.find('.ui.embed').embed();
        //make sure all code gets highlighted using highlight.js
        $slide.find('pre code').each(function(i, block) {
            hljs.highlightBlock(block);
        });
    }
})
