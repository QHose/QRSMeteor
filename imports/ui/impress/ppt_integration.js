import { senseConfig } from '/imports/api/config.js';
// import { config } from '/imports/ui/impress/landingPage.js';

import lodash from 'lodash';
import hljs from 'highlight.js';
_ = lodash;
var Cookies = require('js-cookie');
var showdown = require('showdown');
var converter = new showdown.Converter();
const enigma = require('enigma.js');
// The QIX schema needed by enigma.js
const qixschema = senseConfig.QIXSchema;
var appId = Session.get('SlideGeneratorAppId');
var IntegrationPresentationSortedDataObject = Meteor.settings.public.slideGenerator.dataObject; //'pskL';//a table object in the saas presentation qvf, that ensures the slides are in the correct load order. better would be to load this in this order in the API call.
var slideWidth = 2000;

const config = {
    schema: qixschema,
    appId: appId,
    session: { //https://github.com/qlik-oss/enigma.js/blob/master/docs/qix/configuration.md#example-using-nodejs
        host: senseConfig.host,
        prefix: Meteor.settings.public.IntegrationPresentationProxy,
        port: senseConfig.port,
        unsecure: true
    },
};

Template.ppt_integration.onRendered(function() {
    initializePresentation();
})


Template.ppt_integration.onCreated(function() {
    clearSlideCache()
})

export function clearSlideCache() {
    console.log('clear the previously loaded slides from memory, the browser session object');
    Session.set('mainTopics', null);
    Session.set('integrationTopics', null);
}
export function initializePresentation() {
    Session.set('slideLoading', true);
    getLevel1to3('integrationTopics');
    getLevel1And2();
    appChangeListener();

    $('#impress').on('impress:stepenter', function() {
        // $('.slideContent').css({ "visibility": "visible" });
        var step = $(this);

        //ensure we only show the content of the current step via IF condition in the template (only show content if slideNr = currentSlide)
        var activeStep = $(this).find('.active.step').attr('id');
        //convert the id value step-2 to 2
        var activeStepNr = activeStep.substr(activeStep.indexOf("-") + 1);
        Session.set('activeStepNr', activeStepNr);
    });

}
Template.ppt_integration.onDestroyed(function() {
    Cookies.set('showSlideSorter', 'false');
})

Template.integrationSlideContent.onRendered(function() {
    if (Cookies.get('showSlideSorter') !== 'true') { //slide show is active, first hide everything, then fade in.
        $('.slideContent').css({ "visibility": "hidden" });
    }

    Meteor.setTimeout(function() {
        // console.log('render slide content without animations?', Cookies.get('showSlideSorter'));
        if (Cookies.get('showSlideSorter') !== 'true') { //only do animations for the slide show, not the slide overview
            // $('.slideContent').css({ "visibility": "hidden" }); //prevent an issue when impress has qlik sense embedded via iframes... show all slide content in the slideSorter

            initCodeHighLightAndYouTube(this);

            this.$('.markdownItem, .videoPlaceholder, iframe, img').transition({
                animation: 'fade in',
                duration: '3s',
            });

            this.$('blockquote').transition({
                animation: 'fade in',
                duration: '5s',
            });
            //ensure all links open on a new tab
            this.$('a[href^="http://"], a[href^="https://"]').attr('target', '_blank');
        }
    }, 100);

})

export function initCodeHighLightAndYouTube(selection) {
    //init the youtube videos via semanticUI
    selection.$('.ui.embed').embed();
    //make sure all code gets highlighted using highlight.js
    selection.$('pre code').each(function(i, block) {
        hljs.highlightBlock(block);
    });
}

//both the slidesorter and pptintegration use the helpers below
Template.registerHelper('chapterSlide', function(currentRow) {
    if (typeof(currentRow) === 'string') { //we got a chapter slide
        // console.log('we found a chapter slide', currentRow);
        return true
    }
});

Template.registerHelper('mainTopics', function() {
    return Session.get('mainTopics'); //only the level 1 and 2 colums, we need this for the headers of the slide
});
Template.registerHelper('loadingSlides', function() {
    return Session.get('slideLoading');
})

Template.registerHelper('XValue', function(index) {
    return setXValue(index);
});

Template.registerHelper('thankYouXvalue', function(currentSlideNumber) {
    return Session.get('currentSlideNumber') * slideWidth;

});

Template.registerHelper('slideSorter', function() {
    return Cookies.get('showSlideSorter') === "true" ? "shrink" : "";
});

Template.integrationSlide.helpers({
    level(level, slide) {
        return textOfLevel(slide, level);
    },
    step() {
        return Session.get('activeStepNr');
    }
})

//active slide gets set via impress.js, that fires an event. see ppt_integration.onRendered
//for performance reasons we only do all our formatting etc when the slide is active.
//but for the slide sorter we need all content to be loaded in one go...
//show the slide if the slide is active, but in case of the slide sorter all slides should be presented at once. This is a performance tweak...
Template.registerHelper('slideActive', function(slideNr) {
    return (Session.get('activeStepNr') >= slideNr + 1) || Cookies.get('showSlideSorter') === 'true';
});

Template.integrationSlideContent.helpers({
    itemsOfLevel: function(level, slide) { //get all child items of a specific level, normally you will insert level 3 
        var parents = slide[level - 3].qText + slide[level - 2].qText; //get the names of the parents of the current slide (level 1 and 2)
        if (parents) {
            // console.log('Parent is not empty:', parents);
            return getLocalValuesOfLevel(parents); //using the parent, get all items that have this name as parent
        }
    },
    formatted(text) {
        if (youtube_parser(text)) { //youtube video url
            // console.log('found an youtube link so embed with the formatting of semantic ui', text)
            var videoId = youtube_parser(text);
            var html = '<div class="ui container videoPlaceholder"><div class="ui embed" data-source="youtube" data-id="' + videoId + '" data-icon="video" data-placeholder="images/youtube.jpg"></div></div>'
                // console.log('generated video link: ', html);
            return html;
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
    }
})

function setXValue(index) {
    Session.set('currentSlideNumber', index);
    return slideWidth * index;
}

function textOfLevel(row, level) {
    level -= 1
    return row[level].qText
}

function getLevel1and2Names(slide) {
    return slide[0].qText + '-' + slide[1].qText;
}

function checkTextIsImage(text) {
    return (text.match(/\.(jpeg|jpg|gif|png)$/) != null);
}

function youtube_parser(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    // console.log('de url '+ url + ' is een match met youtube? '+ (match && match[7].length == 11));
    return (match && match[7].length == 11) ? match[7] : false;
}

var setCurrentSlideEventHelper = function() {
    $(document).on('impress:stepenter', function(e) {
        var currentSlide = $(e.target).attr('id');
        Session.set('currentSlide', currentSlide);
    });
}

var getLocalValuesOfLevel = function(parentText) {
    // console.log('get all level 3 for level 2 with text:', parentText);
    var result = [];
    var topics = Session.get('integrationTopics'); //the level 1 and 2 values
    var level3Data = _.filter(topics, function(row) {
            var parents = row[0].qText + row[1].qText;
            if (parents === parentText) { //if the current level 1 and 2 combination matches 
                if (row[2].qText) { result.push(row[2].qText) } //add the level 3 value to the new level3Data array
            }
        })
        // console.log('level3Data:', result);
    return result;
}

function getLevel1And2() {

    // Set up connection to QIX, see https://github.com/mindspank/enigma-table-rows-example/blob/master/index.js

    enigma.getService('qix', config)
        .then(qix => {
            qix.app.getObject(IntegrationPresentationSortedDataObject) //get an existing object out of an app, if you import an app this stays the same
                .then(model => {
                    model.getHyperCubeData('/qHyperCubeDef', [{ qTop: 0, qLeft: 0, qWidth: 3, qHeight: 1000 }]).then(data => {
                        // console.log('Result set from Qlik Sense:', data);
                        var table = data[0].qMatrix;
                        var tableWithChapters = insertSectionBreakers(table);
                        console.log('Received a table of data via the Engine API, now the slides can be created by impress.js', tableWithChapters);
                        Session.set('mainTopics', tableWithChapters)
                        Meteor.setTimeout(function() {
                            if (Cookies.get('showSlideSorter') !== 'true') { //do not initialize impress so we can use the mobile device layout of impress to get all the slide under each other
                                // console.log('Show slideSorter NOT selected, so initialize impress.js');
                                impress().init();
                                impress().goto(0);
                            }
                            Session.set('slideLoading', false);
                        }, 2000);
                    })
                })
        }).catch((error) => {
            console.error('ERROR getting level 1 and 2 from the app via the enigma.js: ', error);
            throw new Meteor.Error(error);
        });
}


var appChangeListener = function appChangeListener() {
    enigma.getService('qix', config)
        .then(qix => {
            qix.app.on('changed', () => {
                // console.log('QIX instance change event received, so get the new data set out of Qlik Sense');
                location.reload(); //reload the browser
            });
        }).catch((error) => {
            console.error('ERROR in the appChangeListener via the enigma.js: ', error);
            throw new Meteor.Error(error);
        });
}

// function getValuesOfLevel(level) {
//     enigma.getService('qix', config)
//         .then(qix => {
//             qix.app.createSessionObject({
//                     qInfo: { qType: 'cube' },
//                     qHyperCubeDef: {
//                         qDimensions: [{
//                             qDef: { qFieldDefs: [level] }
//                         }]
//                     }
//                 })
//                 .then(model => {
//                     model.getHyperCubeData('/qHyperCubeDef', [{ qTop: 0, qLeft: 0, qWidth: 3, qHeight: 3333 }]).then(data => {
//                         // console.log('Result set from Qlik Sense:', data);
//                         var table = data[0].qMatrix;
//                         // console.log('Level ' + level + ' data:', table);
//                         Session.set('level3Data', table)
//                     })
//                 })
//         })
// }

function getLevel1to3(sessionName) {
    enigma.getService('qix', config)
        .then(qix => {

            qix.app.createSessionObject({
                    qInfo: { qType: 'cube' },
                    qHyperCubeDef: {
                        qDimensions: [{
                            qDef: { qFieldDefs: ['Level 1'] }
                        }, {
                            qDef: { qFieldDefs: ['Level 2'] }
                        }, {
                            qDef: { qFieldDefs: ['Level 3'] }
                        }]
                    }
                })
                .then(model => {
                    model.getHyperCubeData('/qHyperCubeDef', [{ qTop: 0, qLeft: 0, qWidth: 3, qHeight: 3333 }]).then(data => {
                        // console.log('Result set from Qlik Sense:', data);
                        var table = data[0].qMatrix;
                        var tableWithChapters = insertSectionBreakers(table);
                        // console.log('New data received, chapters added and now stored in in session var ', sessionName);
                        Session.set(sessionName, tableWithChapters);
                    })
                }).catch((error) => {
                    console.error('ERROR getting level 1 to 3 from the app via the enigma.js: ', error);
                    throw new Meteor.Error(error);
                });

        })
}

function insertSectionBreakers(table) {
    var currentLevel1, previousLevel1 = '';
    var newTableWithChapter = [];

    table.forEach(function(currentRow) {
        var currentLevel1 = textOfLevel(currentRow, 1);
        if (previousLevel1 !== currentLevel1) {
            newTableWithChapter.push(currentLevel1)
            previousLevel1 = currentLevel1;
        }
        newTableWithChapter.push(currentRow);
    });
    // console.log('table with chapters is', newTableWithChapter);
    return newTableWithChapter;
}



/**
 * Auto-indent overflowing lines
 * @author Rob W http://stackoverflow.com/u/938089
 * @param code_elem HTMLCodeElement (or any element containing *plain text*)
 */
// function autoindent(code_elem) {
//     // Grab the lines
//     var textContent = document.textContent === null ? 'textContent' : 'innerText';
//     var lines = code_elem[textContent].split(/\r?\n/),
//         fragment = document.createDocumentFragment(),
//         dummy, space_width, i, prefix_len, line_elem;

//     // Calculate the width of white space
//     // Assume that inline element inherit styles from parent (<code>)
//     dummy = document.createElement('span');
//     code_elem.appendChild(dummy);
//     // offsetWidth includes padding and border, explicitly override the style:
//     dummy.style.cssText = 'border:0;padding:0;';
//     dummy[textContent] = '          ';
//     space_width = dummy.offsetWidth / 10;
//     // Wipe contents
//     code_elem.innerHTML = '';

//     for (i = 0; i < lines.length; i++) {
//         // NOTE: All preceeding white space (including tabs is included)
//         prefix_len = /^\s*/.exec(lines[i])[0].length;
//         line_elem = fragment.appendChild(document.createElement('div'));
//         line_elem.style.marginLeft = space_width * prefix_len + 'px';
//         line_elem[textContent] = lines[i].substring(prefix_len);
//     }
//     code_elem.appendChild(fragment);
// }