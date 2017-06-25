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
        initializeSorter();
        // init();
    })
    // Template.ppt_slideSorter.events({
    //     'click .home.button' (e, template) {
    //         e.preventDefault();
    //         console.log('click event', e)
    //         reset();
    //         cardInFocus = this;
    //         var $doc = $(document);
    //         var centerX = $doc.width() / 2;
    //         var centerY = $doc.height() / 2;
    //         var $card = $(this);
    //         var origX = $card.data('orig-x');
    //         var origY = $card.data('orig-y');
    //         console.log('original pos:', origX, origY);
    //         console.log('center is ', centerX, centerY);
    //         console.log('NEW pos:', centerX - origX, centerY - origY);

//         $(this).transition({ x: 100, y: 400 });

//         // $(this).transition({ x: centerX - origX, y: centerY - origY });
//     },
// })

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

function initializeSorter() {
    // var $cards = $('.miniSlide');
    // var cardInFocus = null;


    // $cards.each(function(index, elem) {
    //     var $elem = $(elem);
    //     var pos = $elem.position();
    //     $(elem).data('orig-x', pos.left);
    //     $(elem).data('orig-y', pos.top);
    // });

    // var reset = function() {
    //     if(cardInFocus) {
    //         $(cardInFocus).transition({ x: 0, y: 0 });
    //     };
    // };

    // $cards.focus(function(e) {
    //     console.log('focus event', e)
    //     reset();
    //     cardInFocus = this;
    //     var $doc = $(document);
    //     var centerX = window.innerWidth / 2; //$doc.width() / 2;
    //     var centerY = window.innerHeight / 2; //$doc.height() / 2;
    //     var $card = $(this);
    //     var origX = $card.data('orig-x');
    //     var origY = $card.data('orig-y');
    //     console.log('original pos:', origX, origY);
    //     console.log('center is ', centerX, centerY);
    //     console.log('move by:', centerX - origX - 250, centerY - origY);

    //     // $(this).transition({ x: 100, y: 400 });

    //     $(this).transition({ x: centerX - origX, y: centerY - origY });
    // });

    // $cards.blur(function(e) {
    //     reset();
    // });

}

//after the page is loaded, ensure the slides have proper margins, and remove the scrollbar
function init() {
    Meteor.setTimeout(function() {
        this.$('.step')
            .attr('style', 'margin-top: 40px; max-height: 100%;');
    }, 1000);
    Meteor.setTimeout(function() {
        $('.ui.embed').embed();
    }, 3000)
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
        if(event.target.className !== 'video icon' && event.target.nodeName !== 'A') { //do not close the zoomed slide, if users click a video or a link
            //zoom the slide if the user clicked on it.
            $slide.toggleClass("zoomOut");
        }

        //make sure all code gets highlighted using highlight.js
        $slide.find('pre code').each(function(i, block) {
            hljs.highlightBlock(block);
        });

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

$(function() {
    var $cards = $('.card');
    var cardInFocus = null;


    $cards.each(function(index, elem) {
        var $elem = $(elem);
        var pos = $elem.position();
        $(elem).data('orig-x', pos.left);
        $(elem).data('orig-y', pos.top);
    });

    var reset = function() {
        if(cardInFocus) {
            $(cardInFocus).transition({ x: 0, y: 0 });
        };
    };

    $cards.focus(function(e) {
        console.log('card in focus', this);
        reset();
        cardInFocus = this;
        var $doc = $(document);
        var centerX = $doc.width() / 2;
        var centerY = $doc.height() / 2;
        var $card = $(this);
        var origX = $card.data('orig-x');
        var origY = $card.data('orig-y');
        $(this).transition({ x: centerX - origX, y: centerY - origY });
    });

    $cards.blur(function(e) {
        reset();
    });

});
