import { senseConfig } from '/imports/api/config.js';
import './ppt_integration.html';

// import lodash from 'lodash';
// _ = lodash;

const enigma = require('enigma');
var appId = 'f094b3f0-529f-4c4d-9a60-a1305c8c19b0';

Template.ppt_integrationMain.helpers({
    mainTopics() {
        // console.log('ppt main, mainTopics is:',Session.get('mainTopics').length);
        return Session.get('mainTopics');
    }
})

Template.ppt_integrationMain.onRendered(function() {
    getLevel1And2();
})

Template.ppt_integration.helpers({
    mainTopics() {
        return Session.get('mainTopics');
    },
    topics() {
        return Session.get('integrationTopics');
    },
    level: function(level) {
        // console.log('level helper', this);
        var row = this;
        level -= 1
        return row[level].qText
    },
    itemsOfLevel: function(level) {
        var parents = this[level - 3].qText + this[level - 2].qText; //get the names of the parents
        if (parents) {
            // console.log('Parent is not empty:', parents);
            return getLocalValuesOfLevel(parents); //using the parent, get all items that have this name as parent
        }
    },
    XValue(index) {
        return 1200 * index;
    }
});

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
    getTableWithEnigma();
    getLevel1And2();
    appChangeListener()

    Template.instance()
        .$('.ui.embed')
        .embed();
})

Template.ppt_integration.onRendered(function() {

                Meteor.setTimeout(function() { impress().init(); }, 1000);

    // Tracker.autorun(function() {
    //     var topics = Session.get('integrationTopics');
    //     if (topics) {
    //         console.log('impress initialized, topics');
    //         Meteor.setTimeout(function() { impress().init(); }, 0);
    //     } else {
    //         console.log('wait to init impress, topics not yet loaded');
    //     }
    // })

    // setCurrentSlideEventHelper();
    // impressInitialized = Session.get('impressInitialized');
    // if (!impressInitialized) {
    //     console.log('impress was NOT yet initialized');
    //     api = impress();
    //     api.init();
    //     Session.set('impressInitialized', true);
    // } else {
    //     console.log('impress was ALREADY initialized');
    //     // location.reload();
    // }

    Template.instance()
        .$('.ui.embed')
        .embed();
})

var appChangeListener = function appChangeListener() {
    $.get('https://unpkg.com/enigma.js/schemas/qix/3.1/schema.json')
        .then(qixschema => {
            enigma.getService('qix', {
                    schema: qixschema,
                    appId: appId,
                    session: { //https://github.com/qlik-oss/enigma.js/blob/master/docs/qix/configuration.md#example-using-nodejs
                        host: senseConfig.host,
                        prefix: senseConfig.virtualProxyClientUsage,
                        port: senseConfig.port,
                        unsecure: true
                    }
                })
                .then(qix => {
                    qix.app.on('changed', () => {
                        console.log('Instance was changed');
                        location.reload();
                        // getTableWithEnigma();
                        // getLevel1And2();
                    });
                })
        })
}

function getValuesOfLevel(level2Text) {

    $.get('https://unpkg.com/enigma.js/schemas/qix/3.1/schema.json')
        .then(qixschema => {

            enigma.getService('qix', {
                    schema: qixschema,
                    appId: appId,
                    session: { //https://github.com/qlik-oss/enigma.js/blob/master/docs/qix/configuration.md#example-using-nodejs
                        host: senseConfig.host,
                        prefix: senseConfig.virtualProxyClientUsage,
                        port: senseConfig.port,
                        unsecure: true
                    }
                })
                .then(qix => {

                    qix.app.createSessionObject({
                            qInfo: { qType: 'cube' },
                            qHyperCubeDef: {
                                qDimensions: [{
                                    qDef: { qFieldDefs: ['Level 3'] }
                                }],
                                qMeasures: [{
                                    qDef: {
                                        // qLabel: 'Number of Beers',
                                        qDef: "=Count({<[Level 2]={'" + level2Text + "'}>}1)"
                                    }
                                }]
                            }
                        })
                        .then(model => {
                            model.getHyperCubeData('/qHyperCubeDef', [{ qTop: 0, qLeft: 0, qWidth: 3, qHeight: 3333 }]).then(data => {
                                console.log('Result set from Qlik Sense:', data);
                                var table = data[0].qMatrix;
                                console.log('Level 3 data', table);
                                Session.set('level3Data', table)
                            })
                        })

                })

        })


}


function getTableWithEnigma() {

    $.get('https://unpkg.com/enigma.js/schemas/qix/3.1/schema.json')
        .then(qixschema => {

            enigma.getService('qix', {
                    schema: qixschema,
                    appId: appId,
                    session: { //https://github.com/qlik-oss/enigma.js/blob/master/docs/qix/configuration.md#example-using-nodejs
                        host: senseConfig.host,
                        prefix: senseConfig.virtualProxyClientUsage,
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
                                // console.log('Data set contained in QMatrix', table);
                                Session.set('integrationTopics', table)
                            })
                        })

                })

        })


}

function getLevel1And2() {

    $.get('https://unpkg.com/enigma.js/schemas/qix/3.1/schema.json')
        .then(qixschema => {

            enigma.getService('qix', {
                    schema: qixschema,
                    appId: appId,
                    session: { //https://github.com/qlik-oss/enigma.js/blob/master/docs/qix/configuration.md#example-using-nodejs
                        host: senseConfig.host,
                        prefix: senseConfig.virtualProxyClientUsage,
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
                                Session.set('mainTopics', table)
                            })
                        })

                })

        })


}

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
