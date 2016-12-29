import { senseConfig } from '/imports/api/config.js';
var qsocks = require('qsocks');
import './integrationTopics.js';
import lodash from 'lodash';
_ = lodash;

const enigma = require('enigma');
var appId = 'f094b3f0-529f-4c4d-9a60-a1305c8c19b0';

Template.integrationTopicsCircular.helpers({
    mainTopics() {
        return Session.get('mainTopics');
    },
    topics() {
        return Session.get('integrationTopics');
    },
    level: function(level) {
        var row = this;
        level -= 1;
        return row[level].qText
    },
    itemsOfLevel: function(level) {
        // console.log('all items of level', this);
        level -= 2; //get the name of the parent
        var parent = this[level].qText;
        if (parent) {
          return getLocalValuesOfLevel(parent); //using the parent, get all items that have this name as parent
        }
    },
    XValue(index) {
        return 1200 * index;
    },
    test(){
      console.log('test this', this);
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
        if (row[1].qText === parentText) {
          if(row[2].qText){result.push(row[2].qText)}
        }
    })
    // console.log('level3Data:', result);
    return result;
}


Template.integrationTopicsCircular.onRendered(function() {
    getTableWithEnigma(appId);
    getLevel1And2(appId);
})

Template.integrationTopicsCircular.onRendered(function() {
    api = impress();
    api.init();
    setCurrentSlideEventHelper();
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


function getTableWithEnigma(appId) {

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

function getLevel1And2(appId) {

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
