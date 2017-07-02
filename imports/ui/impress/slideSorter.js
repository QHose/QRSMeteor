import { Template } from 'meteor/templating';
var Cookies = require('js-cookie');
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

Template.ppt_slideSorter.onDestroyed(function() {
    Cookies.set('showSlideSorter', 'false');
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
    Meteor.setTimeout(function() {
        $('.ui.embed').embed();
    }, 3000)
    Meteor.setTimeout(function() {
        $('.ui.embed').embed();
    }, 10000)
}

Template.ppt_slideSorter.events({
    'click .home.button' (event, template) {
        console.log('try to close the window, so the user sees the navigation screen on other tab');
        event.preventDefault();
        window.close();
    },
    'click .step' (event, template) {
        console.log('Data context of the slide (received from Qlik Sense Engine API) ', this);

        var $slide = $(event.target).closest(".step");
        if(event.target.className !== 'video icon' && event.target.nodeName !== 'A') { //do not close the zoomed slide, if users click a video or a link
            //zoom the slide if the user clicked on it.
            $slide.toggleClass("zoomOut");
        }

        //make sure all code gets highlighted using highlight.js
        $slide.find('pre code').each(function(i, block) {
            hljs.highlightBlock(block);
        });

        // $('.ui.embed').embed();

        //ensure all links open on a new tab
        $slide.find('a[href^="http://"], a[href^="https://"]').attr('target', '_blank');
    }
})

//Make sure the presentation/landingpage is initialized again also when you close the browser...

var hotcodepush = false;

Reload._onMigrate(function() {
    hotcodepush = true;
    return [true];
});


//Make sure the presentation/landingpage is initialized again.
window.addEventListener('beforeunload', function(e) {
        if(!hotcodepush) {
            Cookies.set('showSlideSorter', 'false');
        }
        if(hotcodepush) console.log("SlideSorter: Hot code reload");
    })
    //END init code
