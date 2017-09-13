import { Template } from 'meteor/templating';
var Cookies = require('js-cookie');
import { senseConfig as config } from '/imports/api/config';

import './impress.css'; //slides you see when you start the multi tenant demo
import './impressJSModifiedSource.js'
import hljs from 'highlight.js';
import { initializePresentation, clearSlideCache, initCodeHighLightAndYouTube } from './slidegeneratorSlides'

//for the slide sorter we needed to create a different template since the layout is different. But all logic comes from the slidegeneratorSlides part. 
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
    // initializeSorter();
    // init();
})

Template.slideSorter.events({
    'click .miniSlide' (event, template) {
        event.preventDefault();
        console.log('click event', event)
            // reset();
        var $slide = $(event.target).closest(".step");
        var $doc = $(document);
        var centerX = $doc.width() / 2;
        var centerY = $doc.height() / 2;
        var origX = $slide.position().left + $slide.width()/2;
        var origY = $slide.position().top  + $slide.height()/2;
        var deltaX = centerX - origX; //compare center with center... 
        var deltaY = centerY - origY; 

        console.log('original pos:', origX, origY, $slide.position());
        console.log('center is ', centerX, centerY);
        console.log('Delta movement:', deltaX, deltaY);

        // testDiv = document.getElementById('testDiv');
        // $slide.attr('style', CSS.translate3d(-300, 100, 0, 500));
        $slide.attr('style', CSS.zoomTo(deltaX, deltaY, 2, 2000));  


    },
})

// `computeWindowScale` counts the scale factor between window size and size
// defined for the presentation in the config.
// function computeWindowScale(config) {
//     var hScale = window.innerHeight / config.height,
//         wScale = window.innerWidth / config.width,
//         scale = hScale > wScale ? wScale : hScale;

//     if(config.maxScale && scale > config.maxScale) {
//         scale = config.maxScale;
//     }

//     if(config.minScale && scale < config.minScale) {
//         scale = config.minScale;
//     }

//     return scale;
// };



//after the page is loaded, ensure the slides have proper margins, and remove the scrollbar
function init() {
    Meteor.setTimeout(function() {
        this.$('.step')
            .attr('style', 'margin-top: 40px; max-height: 100%;');
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
        event.preventDefault();
        console.log('Data context of the slide (received from Qlik Sense Engine API) ', this);
        var selection = window.getSelection(); //prevent the slide closes when the user wants to select text.

        var $slide = $(event.target).closest(".step");
        if (event.target.className !== 'video icon' && event.target.nodeName !== 'A') { //do not close the zoomed slide, if users click a video or a link
            //zoom the slide if the user clicked on it.
            $slide.toggleClass("zoomOut");
        }

        //make sure all code gets highlighted using highlight.js
        $slide.find('pre code').each(function(i, block) {
            hljs.highlightBlock(block);
        });

        // $('.ui.embed').embed(); //creates the issue that you can't click to start an embedded video

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
        if (!hotcodepush) {
            Cookies.set('showSlideSorter', 'false');
        }
        if (hotcodepush) console.log("SlideSorter: Hot code reload");
    })
<<<<<<< HEAD
    //END init code
=======
    //END init code
<<<<<<< HEAD

var CSS = {
    /**
     * Generates CSS3's translate3d transformation style for Opera, Chrome/Safari, Firefox and IE
     * 
     * @method translate3d
     * @param {Number} x The X axis coordinate
     * @param {Number} y The Y axis coordinate
     * @param {Number} z The Z axis coordinate
     * @param {Number} t The transition time / animation duration, defaults to 0
     * @return {String} The css style code
     */
    translate3d: function(x, y, z, t) {
        t = (typeof t === "undefined") ? 0 : t; //defaults to 0
        var tr = '-webkit-transform: translate3d(' + x + 'px, ' + y + 'px, ' + z + 'px); -webkit-transition: ' + t + 'ms;' +
            '-moz-transform: translate3d(' + x + 'px, ' + y + 'px, ' + z + 'px); -moz-transition: ' + t + 'ms;' +
            '-ms-transform: translate3d(' + x + 'px, ' + y + 'px, ' + z + 'px); -ms-transition: ' + t + 'ms;' +
            '-o-transform: translate(' + x + 'px, ' + y + 'px); -o-transition: ' + t + 'ms;' +
            'transform: translate3d(' + x + 'px, ' + y + 'px, ' + z + 'px); transition: ' + t + 'ms;';

        return tr;
    },

    /**
     * Generates CSS3's scale3d transformation style for Opera, Chrome/Safari, Firefox and IE
     * The scaling is symetric, with the same value for width and height
     * 
     * @method scale3d
     * @param {Number} s The scale
     * @param {Number} t The transition time / animation duration, defaults to 0
     * @return {String} The css style code
     */
    scale3d: function(s, t) {
        t = (typeof t === "undefined") ? 0 : t; //defaults to 0
        var tr = '-webkit-transform: scale3d(' + s + ', ' + s + ', 1); -webkit-transition: ' + t + 'ms;' +
            '-moz-transform: scale3d(' + s + ', ' + s + ', 1); -moz-transition: ' + t + 'ms;' +
            '-ms-transform: scale3d(' + s + ', ' + s + ', 1); -ms-transition: ' + t + 'ms;' +
            '-o-transform: scale(' + s + '); -o-transition: ' + t + 'ms;' +
            'transform: scale3d(' + s + ', ' + s + ', 1); transition: ' + t + 'ms;';

        return tr
    },

    /**
     * Used to move a scaled element using translate, while keeping the scale
     * Generates the required CSS3 style for Opera, Chrome/Safari, Firefox and IE
     * 
     * @method zoomTo
     * @param {Number} x The X axis coordinate of the transformation
     * @param {Number} y The Y axis coordinate of the transformation
     * @param {Number} s The scale of the element (symetric, with the same value for width and height)
     * @param {Number} t The transition time / animation duration, defaults to 0
     * @return The css style code
     */
    zoomTo: function(x, y, s, t) {
        s = (typeof s === "undefined") ? 2 : s; //defaults to 2
        t = (typeof t === "undefined") ? 0 : t; //defaults to 0

        var tr = '-webkit-transform: translate3d(' + x + 'px, ' + y + 'px, 0px) scale3d(' + s + ', ' + s + ', 1);' +
            '-moz-transform: translate3d(' + x + 'px, ' + y + 'px, 0px) scale3d(' + s + ', ' + s + ', 1);' +
            '-ms-transform: translate3d(' + x + 'px, ' + y + 'px, 0px) scale3d(' + s + ', ' + s + ', 1);' +
            '-o-transform: translate(' + x + 'px, ' + y + 'px) scale(' + s + ');' +
            'transform: translate3d(' + x + 'px, ' + y + 'px, 0px) scale3d(' + s + ', ' + s + ', 1);' +
            '-webkit-transition: ' + t + 'ms;' +
            '-moz-transition: ' + t + 'ms;' +
            '-ms-transition: ' + t + 'ms;' +
            '-o-transition: ' + t + 'ms;' +
            'transition: ' + t + 'ms;';

        return tr;
    }
}
=======
>>>>>>> master
>>>>>>> docker
