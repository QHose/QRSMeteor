import { senseConfig } from '/imports/api/config.js';
import './ppt_integration.html';

import lodash from 'lodash';
_ = lodash;
var showdown = require('showdown');
var converter = new showdown.Converter();
const enigma = require('enigma');
var appId = Meteor.settings.public.IntegrationPresenatationApp;

Template.ppt_integrationMain.helpers({
    mainTopics() {
        // console.log('ppt main, mainTopics is:',Session.get('mainTopics').length);
        return Session.get('mainTopics');
    },
    appURL() {
        return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + 'anon' + '/single/?appid=' + appId + '&obj=RZuJ&opt=currsel';
    }
})

// Template.ppt_integrationMain.onRendered(function() {
//     getLevel1And2();
// })

Template.ppt_integrationMain.events({
    'click .launch': function(event) {
        $('.ui.sidebar')
            .sidebar('toggle');
    }
})

Template.ppt_integration.helpers({
    mainTopics() {
        return Session.get('mainTopics');
    },
    topics() {
        return Session.get('integrationTopics');
    },
    level: function(level) {
        return textOfLevel(this, level);
    },
    chapterSlide(currentRow) {
        // console.log('newTopic helper, currentRow, ', currentRow);
        if (typeof(currentRow) === 'string') { //we got a chapter slide
            // console.log('we found a chapter slide', currentRow);
            return true
        }
    },
    itemsOfLevel: function(level) {
        var parents = this[level - 3].qText + this[level - 2].qText; //get the names of the parents
        if (parents) {
            // console.log('Parent is not empty:', parents);
            return getLocalValuesOfLevel(parents); //using the parent, get all items that have this name as parent
        }
    },
    loading() {
        return Session.get('slideLoading');
    },
    XValue(index) {
        return 1100 * index;
    },
    formatted(text) {
        if (youtube_parser(text)) { //youtube video url
            // console.log('found an youtube link so embed with the formatting of semantic ui', text)
            var videoId = youtube_parser(text);
            var html = '<div class="ui embed" style="margin-left: 50px, padding-top: 80px" data-source="youtube" data-id="' + videoId + '" data-icon="video" data-placeholder="images/API.png"></div>'
                // console.log('generated video link: ', html);
            return html;
        } else if (checkTextIsImage(text)) { //image
            // console.log('found an image', text)
            return '<img class="ui centered image" style="margin-top: 20px" src="images/' + text + '">'
        } else if (text.startsWith('<')) { //custom HTML
            return text;
        } else { //text 
            // console.log('Markdown converter: ', converter.makeHtml(text));
            // return converter.makeHtml(text) 
            var result = converter.makeHtml(text);
            // return result;
            return '<div class="item" style="margin-left: 160px"><h3>' + result + '</h3></div>';
        }
    },
    visibility(currentSlide) {
        return slideIsVisible(currentSlide) ? 'visible' : 'hidden';
    },
    stepVisible(currentSlide) {
        return slideIsVisible(currentSlide) ? 'step' : '';
    }
});

function textOfLevel(row, level) {
    level -= 1
    return row[level].qText
}

function slideIsVisible(currentSlide) {
    // var allSlides = Session.get('selectedDataSet'); //all slides
    //     var result = allSlides.find(function(slide) {
    //         var test = getLevel1and2Names(slide) === getLevel1and2Names(currentSlide)
    //         return test;    
    //     });
    //     return result;
    return true;
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
    var topics = Session.get('integrationTopics');
    var level3Data = _.filter(topics, function(row) {
            var parents = row[0].qText + row[1].qText;
            if (parents === parentText) {
                if (row[2].qText) { result.push(row[2].qText) }
            }
        })
        // console.log('level3Data:', result);
    return result;
}


Template.ppt_integration.onRendered(function() {
    getLevel1to3('integrationTopics');
    // getLevel1to3('selectedDataSet');
    getLevel1And2();
    appChangeListener();
})

Template.ppt_integration.onRendered(function() {
    Session.set('slideLoading', true);
    Meteor.setTimeout(function() {
        // console.log('iterate over Code element');
        $('code').each(function(i, obj) {
            // console.log('convert Code element', obj);
            autoindent(obj);
        });

        $('pre').addClass('prettyprint');

        PR.prettyPrint();

        $('.ui.embed')
            .embed();

        impress().init();
        Session.set('slideLoading', false);

    }, 5000);
})

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
                        console.log('QIX instance change event received, so get the new data set out of Qlik Sense');
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
                                }],
                                qMeasures: [{
                                    qDef: {
                                        qLabel: 'Count',
                                        qDef: "=Sum(1)"
                                    }
                                }]
                            }
                        })
                        .then(model => {
                            model.getHyperCubeData('/qHyperCubeDef', [{ qTop: 0, qLeft: 0, qWidth: 3, qHeight: 3333 }]).then(data => {
                                console.log('Result set from Qlik Sense:', data);
                                var table = data[0].qMatrix;
                                console.log('Level ' + level + ' data:', table);
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
                                console.log('New data received, chapters added and now stored in in session var ', sessionName);
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
    console.log('table with chapters is', newTableWithChapter);
    return newTableWithChapter;
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

                    qix.app.createSessionObject({
                            qInfo: { qType: 'cube' },
                            qHyperCubeDef: {
                                qDimensions: [{
                                    qDef: { qFieldDefs: ['Level 1'] }
                                }, {
                                    qDef: { qFieldDefs: ['Level 2'] }
                                }],
                                qMeasures: [{
                                    qDef: {
                                        qLabel: 'Count of level 1',
                                        qDef: '=Count(1)'
                                    }
                                }],
                            }
                        })
                        .then(model => {
                            model.getHyperCubeData('/qHyperCubeDef', [{ qTop: 0, qLeft: 0, qWidth: 3, qHeight: 3333 }]).then(data => {
                                // console.log('Result set from Qlik Sense:', data);
                                var table = data[0].qMatrix;
                                // console.log('Main levels contained in QMatrix', table);
                                var tableWithChapters = insertSectionBreakers(table);
                                console.log('mainTopics, chapters added and now stored in in session var mainTopics');
                                Session.set('mainTopics', tableWithChapters)
                            })
                        })

                })

        })


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


//examples only

function exampleAlex() {
    $.get('https://unpkg.com/enigma.js/schemas/qix/3.1/schema.json')
        .then(qixschema => {

            enigma.getService('qix', {
                    schema: qixschema,
                    appId: 'b82e6aa9-04a3-4573-b3da-201cab14dfca',
                    session: {
                        host: 'branch.qlik.com',
                        prefix: '/anon/',

                    }
                })
                .then(qix => {

                    qix.app.createSessionObject({
                            qInfo: { qType: 'cube' },
                            qHyperCubeDef: {
                                qDimensions: [{
                                    qDef: { qFieldDefs: ['Dim1'] }
                                }, {
                                    qDef: { qFieldDefs: ['Dim2'] }
                                }, {
                                    qDef: { qFieldDefs: ['Dim3'] }
                                }]
                            }
                        })
                        .then(model => {
                            model.getHyperCubeData('/qHyperCubeDef', [{ qTop: 0, qLeft: 0, qWidth: 3, qHeight: 3333 }]).then(data => {
                                console.log(data)
                            })
                        })

                })

        })
}

//http://playground.qlik.com/learn/engine/hypercube
//https://gist.github.com/mindspank/58b3080a342b1cd937e6
//https://help.qlik.com/en-US/sense-developer/3.1/Subsystems/EngineAPI/Content/WorkingWithAppsAndVisualizations/CreateVisualizations/create-hypercube.htm
function createCube(app) {
    // Create a Generic Session Object
    app.createSessionObject({
        qInfo: {
            qType: 'mycubiecube'
        },
        // A HyperCube Structure
        qHyperCubeDef: {
            "qDimensions": [{
                "qDef": {
                    "qFieldDefs": [
                        "Level 1"
                    ]
                }
            }, {
                "qDef": {
                    "qFieldDefs": [
                        "Level 3"
                    ]
                }
            }, {
                "qDef": {
                    "qFieldDefs": [
                        "Level 3"
                    ]
                }
            }],
            qMeasures: [{
                qDef: {
                    qLabel: 'Count of level 1',
                    qDef: '=Count(1)'
                }
            }],
            qInitialDataFetch: [{
                qWidth: 10,
                qHeight: 4000,
                qTop: 0,
                qLeft: 0
            }]
        },
        // Independent calculation using a ValueExpression
        total: {
            qValueExpression: { qExpr: "=Count(1)" }
        }

    }).then(function(cube) {
        return cube.getLayout().then(function(layout) {
            return console.log('result of cube: ', layout);
        })
    })
}


function createList(app) {
    //Define our listbox definition.
    //Optional parameters has been omitted
    //Refer to documentation for a full list of properties
    //https://help.qlik.com/sense/en-us/developer/Subsystems/EngineAPI/Content/GenericObject/PropertyLevel/ListObjectDef.htm
    var obj = {
        "qInfo": {
            "qId": "LB01",
            "qType": "ListObject"
        },
        "qListObjectDef": {
            "qDef": {
                "qFieldDefs": [
                    "Month"
                ],
                "qFieldLabels": [
                    "Month"
                ],
                "qSortCriterias": [{
                    "qSortByExpression": -1,
                    "qExpression": {
                        "qv": "=sum([Sales Amount])"
                    }
                }]
            },
            "qInitialDataFetch": [{
                "qTop": 0,
                "qLeft": 0,
                "qHeight": 100,
                "qWidth": 2
            }],
            "qExpressions": [{
                "qExpr": "=sum([Sales Amount])"
            }]
        }
    };

    //Create the listbox as a session object which will persist over the session and then be deleted.
    app.createSessionObject(obj).then(function(list) {

        //List has been created and handle returned.
        //Get the layout of the listobject.
        list.getLayout().then(function(layout) {
            //Layout, model and data is retured.
            console.log(layout)
        })
    })

}
