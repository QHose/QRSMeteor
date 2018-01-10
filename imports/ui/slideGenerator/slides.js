var Reveal = require('reveal');
import './reveal.css';
// import 'reveal/theme/default.css';
import lodash from 'lodash';
import hljs from 'highlight.js';
import { Tracker } from '/imports/api/tracker';

_ = lodash;
var Cookies = require('js-cookie');
var showdown = require('showdown');
var converter = new showdown.Converter();
var numberOfActiveSlides = 5;

Template.slides.onCreated(function() {
    $('body').css({
        overflow: 'hidden',
    });
})

Template.slides.onDestroyed(function() {
    $('body').css({
        overflow: 'auto',
    });
})

Template.slides.onRendered(function() {
    // console.log('slides template rendered');
    if (!Session.get('slideData')) {
        console.log('------------------------------------');
        console.log('No slide data present in session, reroute the use back to the useCaseSelection screen.');
        console.log('------------------------------------');
        Router.go('useCaseSelection');
        return;
    }
    initializeReveal();
});

function initializeReveal() {
    window.Reveal = Reveal;
    // console.log('initializeReveal', Reveal);
    Reveal.initialize({
        width: window.innerWidth - 80,
        embedded: true,
        controls: true,
        center: false,
        autoPlayMedia: false,
        fragments: false,
        // autoSlide: 1000,
        loop: false,
        transition: 'slide', // none/fade/slide/convex/concave/zoom     
        previewLinks: false,
        slideNumber: true
    });

    Session.set('activeStepNr', 0);
    Reveal.addEventListener('slidechanged', function(evt) {
        console.log('!!!!!!!!!!! Slide changed: active slide: ', evt.indexh);
        Session.set('activeStepNr', evt.indexh);
        $('.ui.embed').embed();
        // $(window).scrollTop(0); //does not work
    });
}

// Template.slides.events({
//     'contextmenu *': function(e, t) {
//         e.stopPropagation();
//         console.log('template instance:\n', t);
//         console.log('data context:\n', Blaze.getData(e.currentTarget));
//     }
// });

//
// ─── SLIDE CONTENT ──────────────────────────────────────────────────────────────────────
//

Template.slideContent.onRendered(function() {
    this.subscribe('tracker');
    Tracker.insert({
        userId: Meteor.userId,
        userName: Meteor.user().profile.name,
        counter: 1,
        eventType: 'slideRendered',
        topic: this.data.slide[0].qText,
        slide: this.data.slide[1].qText,
        viewDate: new Date(), // current time
    });

    Meteor.setTimeout(function() {
        //embed youtube containers in a nice box without loading all content
        this.$('.ui.embed').embed({
            autoplay: true
        });
        //make sure all code gets highlighted using highlight.js
        this.$('pre code').each(function(i, block) {
            hljs.highlightBlock(block);
        });
        //ensure all links open on a new tab
        this.$('a[href^="http://"], a[href^="https://"]').attr('target', '_blank');
    }, 1000);
});

Template.slideContent.events({
    'click a': function(e, t) {
        e.stopPropagation();
        Tracker.insert({
            userId: Meteor.userId,
            userName: Meteor.user().profile.name,
            counter: 1,
            eventType: 'linkClick',
            topic: this.data.slide[0].qText,
            slide: this.data.slide[1].qText,
            linkName: e.currentTarget.innerText,
            viewDate: new Date(), // current time
        });
    }
});

//
// ─── HELPERS ────────────────────────────────────────────────────────────────────
//

Template.slide.helpers({
    active(slideNr) {
        var activeSlide = Session.get('activeStepNr');
        // console.log('activeSlide', activeSlide)
        var active = slideNr < activeSlide + numberOfActiveSlides && slideNr > activeSlide - numberOfActiveSlides;
        // console.log('active', active)
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
    var commentMarker = '!comment';
    var embeddedImageMarker = `!embeddedImage`

    //
    // ─── YOUTUBE ────────────────────────────────────────────────────────────────────
    //
    if (youtube_parser(text)) { //youtube video url
        // console.log('found an youtube link so embed with the formatting of semantic ui', text)
        var videoId = youtube_parser(text);
        var html = '<div class="ui container videoPlaceholder"><div class="ui embed" data-source="youtube" data-id="' + videoId + '" data-icon="video" data-placeholder="images/youtube.jpg"></div></div>'
            // console.log('generated video link: ', html);
        return html;
    }

    //
    // ─── IFRAME ─────────────────────────────────────────────────────────────────────
    //
    else if (text.startsWith('iframe ')) { //if a text starts with IFRAME: we convert it into an IFRAME with a class that sets the width and height etc...
        var sourceURL = text.substr(text.indexOf(' ') + 1);
        return '<iframe src="' + sourceURL + '" allowfullscreen="allowfullscreen" frameborder="0"></iframe>';
    }

    //
    // ─── COMMENT ────────────────────────────────────────────────────────────────────
    //
    else if (text.startsWith(commentMarker)) { //vertical slide with comments
        var textAfterCommentMarker = text.split(commentMarker).pop();
        var messagebox = `
        <section class="commentBox">
            <div class="ui icon message">
            <i class="help icon"></i>
            <div class="content">
            <div class="header">
                Let's explain what we mean here...
            </div>
                 ` + converter.makeHtml(textAfterCommentMarker) + `
            </div>
        </div>
        </section>`; //select all text after the !comment... and print it in a nice text box

        return messagebox;
    }

    //
    // ─── IMAGE ──────────────────────────────────────────────────────────────────────
    //        
    else if (checkTextIsImage(text)) {
        return '<div class="ui container"> <img class="ui massive rounded bordered image"  style="width: 100%;" src="images/' + text + '"/></div>';
    } else if (text.startsWith(embeddedImageMarker)) { //embedded image in text
        var textMarker = text.split(embeddedImageMarker).pop();
        return '<img class="ui massive rounded bordered image"  alt="Embedded Image" src="data:image/png;base64,' + textMarker + '"/>';
    }

    //
    // ─── CUSTOM HTML ────────────────────────────────────────────────────────────────
    //
    else if (text.startsWith('<')) { //custom HTML
        return text;
    }

    //
    // ─── TEXT TO BE CONVERTED TO VIA MARKDOWN ───────────────────────────────────────
    //        
    else { //text, convert the text (which can include markdown syntax) to valid HTML
        var result = converter.makeHtml(text);
        if (result.substring(1, 11) === 'blockquote') {
            return '<div class="ui green very padded segment">' + result + '</div>';
        } else {
            return result;
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