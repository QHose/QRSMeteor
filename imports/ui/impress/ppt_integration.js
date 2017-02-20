import { senseConfig } from '/imports/api/config.js';
import './ppt_integration.html';
import lodash from 'lodash';
import hljs from 'highlight.js'
_ = lodash;

// var hljs = require('hljs');
var showdown = require('showdown');
var converter = new showdown.Converter();
const enigma = require('enigma');
var appId = Meteor.settings.public.IntegrationPresenatationApp;

Template.ppt_integrationMain.onRendered(function() {
    // Session.set('clickedInSelection', false);
    this.$('.ui.sidebar')
        .sidebar('toggle');
})
Template.ppt_integration.onRendered(function() {
    Session.set('slideLoading', true);
    getLevel1to3('integrationTopics');
    getLevel1And2();
    appChangeListener();
})



Template.ppt_integrationMain.helpers({
    showPresentation() {
        // console.log('show the IFRAME');
        return Session.get('showPresentation'); //&& Session.get('clickedInSelection');
    },
    IFrameURLChapterSelection() {
        return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + 'anon' + '/single/?appid=' + appId + '&obj=RZuJ&opt=currsel';
    }
})

Template.ppt_integrationMain.events({
    'click .launch': function(event) {
        // console.log('button clicked');
        $('.ui.sidebar')
            .sidebar('toggle');
    },
    'click .button': function(event) {
        console.log('button clicked');
        $('.ui.sidebar')
            .sidebar('toggle');
        Session.set('showPresentation', true);
    },
    // 'click .sidebar': function(event) {
    //     console.log('user clicked in the iframe with the seletions');
    //     Session.set('clickedInSelection', true);
    // },
    'mouseover .sidebar.integration': function(event) {
        Session.set('showPresentation', false);
    },
    'mouseout .sidebar.integration': function(event) {
        Session.set('showPresentation', true);
    }
})

Template.ppt_integration.helpers({
    mainTopics() {
        return Session.get('mainTopics'); //only the level 1 and 2 colums, we need this for the headers of the slide
    },
    topics() {
        return Session.get('integrationTopics'); //all level 1 2 and 3 data, we need level 3 for the bullets/images of the slide
    },
    level: function(level) {
        return textOfLevel(this, level);
    },
    chapterSlide(currentRow) {
        if (typeof(currentRow) === 'string') { //we got a chapter slide
            // console.log('we found a chapter slide', currentRow);
            return true
        }
    },
    itemsOfLevel: function(level) { //get all child items of a specific level, normally you will insert level 3 
        var parents = this[level - 3].qText + this[level - 2].qText; //get the names of the parents of the current slide (level 1 and 2)
        if (parents) {
            // console.log('Parent is not empty:', parents);
            return getLocalValuesOfLevel(parents); //using the parent, get all items that have this name as parent
        }
    },
    loading() {
        return Session.get('slideLoading');
    },
    XValue(index) {
        return 2000 * index;
    },
    formatted(text) {
        if (youtube_parser(text)) { //youtube video url
            // console.log('found an youtube link so embed with the formatting of semantic ui', text)
            var videoId = youtube_parser(text);
            var html = '<div class="ui embed" data-source="youtube" data-id="' + videoId + '" data-icon="video" data-placeholder="images/youtube.jpg"></div>'
                // console.log('generated video link: ', html);
            return html;
        } else if (text.startsWith('<')) { //custom HTML
            return text;
        } else if (checkTextIsImage(text)) { //image
            // console.log('found an image', text)
            return '<img class="ui massive centered image"  src="images/' + text + '">'
        } else { //text 
            // console.log('Markdown converter: ', converter.makeHtml(text));
            var result = converter.makeHtml(text);
            return '<div class="markdownItem">' + result + '</div>';
        }
    }
});

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

    $.get('https://unpkg.com/enigma.js/schemas/qix/3.1/schema.json')
        .then(qixschema => {

            enigma.getService('qix', {
                    schema: qixschema,
                    appId: appId,
                    session: { //https://github.com/qlik-oss/enigma.js/blob/master/docs/qix/configuration.md#example-using-nodejs
                        host: senseConfig.host,
                        prefix: 'anon',
                        port: senseConfig.port,
                        unsecure: true
                    }
                })
                .then(qix => {
                    qix.app.getObject('pskL') //get an existing object out of an app, if you import an app this stays the same
                        .then(model => {
                            model.getHyperCubeData('/qHyperCubeDef', [{ qTop: 0, qLeft: 0, qWidth: 3, qHeight: 1000 }]).then(data => {
                                // console.log('Result set from Qlik Sense:', data);
                                var table = data[0].qMatrix;
                                var tableWithChapters = insertSectionBreakers(table);
                                console.log('mainTopics, chapters added and now stored in in session var mainTopics', tableWithChapters);
                                Session.set('mainTopics', tableWithChapters)
                                Meteor.setTimeout(function() {

                                    impress().init();
                                    impress().goto(0);
                                    Session.set('slideLoading', false);
                                    $('.ui.embed').embed();

                                    $('pre code').each(function(i, block) {
                                        hljs.highlightBlock(block);
                                    });
                                }, 1000);
                            })
                        })

                })

        })


}


var appChangeListener = function appChangeListener() {
    $.get('https://unpkg.com/enigma.js/schemas/qix/3.1/schema.json')
        .then(qixschema => {
            enigma.getService('qix', {
                    schema: qixschema,
                    appId: appId,
                    session: { //https://github.com/qlik-oss/enigma.js/blob/master/docs/qix/configuration.md#example-using-nodejs
                        host: senseConfig.host,
                        prefix: 'anon',
                        port: senseConfig.port,
                        unsecure: true
                    }
                })
                .then(qix => {
                    qix.app.on('changed', () => {
                        // console.log('QIX instance change event received, so get the new data set out of Qlik Sense');
                        // getLevel1to3('selectedDataSet');
                        location.reload();
                    });
                })
        })
}

function getValuesOfLevel(level) {
    console.log('getLocalValuesOfLevel: ', level);
    $.get('https://unpkg.com/enigma.js/schemas/qix/3.1/schema.json')
        .then(qixschema => {

            enigma.getService('qix', {
                    schema: qixschema,
                    appId: appId,
                    session: { //https://github.com/qlik-oss/enigma.js/blob/master/docs/qix/configuration.md#example-using-nodejs
                        host: senseConfig.host,
                        prefix: 'anon',
                        port: senseConfig.port,
                        unsecure: true
                    }
                })
                .then(qix => {

                    qix.app.createSessionObject({
                            qInfo: { qType: 'cube' },
                            qHyperCubeDef: {
                                qDimensions: [{
                                    qDef: { qFieldDefs: [level] }
                                }]
                            }
                        })
                        .then(model => {
                            model.getHyperCubeData('/qHyperCubeDef', [{ qTop: 0, qLeft: 0, qWidth: 3, qHeight: 3333 }]).then(data => {
                                // console.log('Result set from Qlik Sense:', data);
                                var table = data[0].qMatrix;
                                // console.log('Level ' + level + ' data:', table);
                                Session.set('level3Data', table)
                            })
                        })

                })

        })


}

function getLevel1to3(sessionName) {
    $.get('https://unpkg.com/enigma.js/schemas/qix/3.1/schema.json')
        .then(qixschema => {

            enigma.getService('qix', {
                    schema: qixschema,
                    appId: appId,
                    session: { //https://github.com/qlik-oss/enigma.js/blob/master/docs/qix/configuration.md#example-using-nodejs
                        host: senseConfig.host,
                        prefix: 'anon',
                        port: senseConfig.port,
                        unsecure: true
                    }
                })
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
                        })

                })

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
function autoindent(code_elem) {
    // Grab the lines
    var textContent = document.textContent === null ? 'textContent' : 'innerText';
    var lines = code_elem[textContent].split(/\r?\n/),
        fragment = document.createDocumentFragment(),
        dummy, space_width, i, prefix_len, line_elem;

    // Calculate the width of white space
    // Assume that inline element inherit styles from parent (<code>)
    dummy = document.createElement('span');
    code_elem.appendChild(dummy);
    // offsetWidth includes padding and border, explicitly override the style:
    dummy.style.cssText = 'border:0;padding:0;';
    dummy[textContent] = '          ';
    space_width = dummy.offsetWidth / 10;
    // Wipe contents
    code_elem.innerHTML = '';

    for (i = 0; i < lines.length; i++) {
        // NOTE: All preceeding white space (including tabs is included)
        prefix_len = /^\s*/.exec(lines[i])[0].length;
        line_elem = fragment.appendChild(document.createElement('div'));
        line_elem.style.marginLeft = space_width * prefix_len + 'px';
        line_elem[textContent] = lines[i].substring(prefix_len);
    }
    code_elem.appendChild(fragment);
}
