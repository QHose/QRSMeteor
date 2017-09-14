var Reveal = require('reveal');
import 'reveal/index.css';
// import 'reveal/theme/default.css';
import lodash from 'lodash';
import hljs from 'highlight.js';
_ = lodash;
var Cookies = require('js-cookie');
var showdown = require('showdown');
var converter = new showdown.Converter();
var numberOfActiveSlides = 5;


Template.slides.onRendered(function() {
    console.log('slides rendered');

    Reveal.addEventListener('ready', function(event) {
        Session.set('activeStepNr', 0);
        console.log('------------------------------------');
        console.log('Reveal is ready to be used');
        console.log('------------------------------------');
    });

    Reveal.initialize({
        width: "80%",
        height: "80%",
        embedded: false,
        controls: true,
        progress: true,
        history: true,
        center: true,
        autoPlayMedia: true,
        viewDistance: 3,
        // default/cube/page/concave/zoom/linear/fade/none 
        transition: 'Slide', // none/fade/slide/convex/concave/zoom     
        transitionSpeed: 'default', // default/fast/slow   
        previewLinks: false,
        slideNumber: true

    });

    Reveal.addEventListener('slidechanged', function(evt) {
        Session.set('activeStepNr', evt.indexh);
        $('.ui.embed').embed();
    });
})

Template.slides.events({
    'contextmenu *': function(e, t) {
        e.stopPropagation();
        console.log('template instance:\n', t);
        console.log('data context:\n', Blaze.getData(e.currentTarget));
    }
});

//
// ─── HELPERS ────────────────────────────────────────────────────────────────────
//

Template.slide.helpers({
    active(slideNr) {
        var activeSlide = Session.get('activeStepNr');
        var active = slideNr < activeSlide + numberOfActiveSlides && slideNr > activeSlide - numberOfActiveSlides;
        return active;
    }
});



Template.registerHelper('slideHeaders', function() {
    return Session.get('slideHeaders'); //only the level 1 and 2 colums, we need this for the headers of the slide
});

Template.registerHelper('slideData', function() {
    return Session.get('slideData'); //all the level 1, 2, 3 data
});

Template.registerHelper('level', function(level, slide) {
    return textOfLevel(slide, level);
});
Template.registerHelper('step', function() {
    return Session.get('activeStepNr');
});

//will be used in a slideContent block like {{#each item in itemsOfLevel 3 slide}}
Template.registerHelper('itemsOfLevel', function(level, slide) {
    //get all child items of a specific level, normally you will insert level 3 
    var parents = slide[level - 3].qText + slide[level - 2].qText; //get the names of the parents of the current slide (level 1 and 2)
    if (parents) {
        return getLocalValuesOfLevel(parents); //using the parent, get all items that have this name as parent
    }
})

Template.registerHelper('formatted', function(text) {
    if (youtube_parser(text)) { //youtube video url
        // console.log('found an youtube link so embed with the formatting of semantic ui', text)
        var videoId = youtube_parser(text);
        var html = '<div class="ui container videoPlaceholder"><div class="ui embed" data-source="youtube" data-id="' + videoId + '" data-icon="video" data-placeholder="images/youtube.jpg"></div></div>'
            // console.log('generated video link: ', html);
        return html;
        // } else if (text.startsWith('<iframe')) { //replace src by data-src to ensure lazy loading
        //     console.log('------------------------------------');
        //     console.log('------------------------------------');
        //     return text.replace("src=", "data-src=");
    } else if (text.startsWith('<')) { //custom HTML
        return text;
    } else if (checkTextIsImage(text)) { //image
        // console.log('found an image', text)
        return '<img class="ui huge centered integration image"  src="images/' + text + '">'
    } else { //text, convert the text (which can include markdown syntax) to valid HTML
        var result = converter.makeHtml(text);
        if (result.substring(1, 11) === 'blockquote') {
            return '<div class="ui green very padded segment">' + result + '</div>';
        } else {
            return '<div class="markdownItem">' + result + '</div>';
        }
    }
})




//
// ─── FUNCTIONS TO GET LEVEL AND CONTENT OF A SLIDE ───────────────────────────────────────────
//


var getLocalValuesOfLevel = function(parentText) {
    // console.log('get all level 3 for level 2 with text:', parentText);
    var result = [];
    var topics = Session.get('slideData');
    var level3Data = _.filter(topics, function(row) {
            var parents = row[0].qText + row[1].qText;
            if (parents === parentText) { //if the current level 1 and 2 combination matches 
                if (row[2].qText) {
                    result.push(row[2].qText)
                } //add the level 3 value to the new level3Data array
            }
        })
        // console.log('level3Data:', result);
    return result;
}


function textOfLevel(row, level) {
    level -= 1
    return row[level].qText
}

function youtube_parser(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    // console.log('de url '+ url + ' is een match met youtube? '+ (match && match[7].length == 11));
    return (match && match[7].length == 11) ? match[7] : false;
}

function checkTextIsImage(text) {
    return (text.match(/\.(jpeg|jpg|gif|png)$/) != null);
}