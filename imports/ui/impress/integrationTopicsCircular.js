import { senseConfig, engineConfig, certs, authHeaders } from '/imports/api/config.js';
var qsocks = require('qsocks');
import './integrationTopics.js';
import lodash from 'lodash';
_ = lodash;

const enigma = require('enigma');
var appId = 'f094b3f0-529f-4c4d-9a60-a1305c8c19b0';

Template.integrationTopicsCircular.helpers({
   topics() {
        console.log('integrationTopicsCircular helper get topics');
        return Session.get('integrationTopics');
    },
    level: function(row) {
        console.log('row is ', row);
        // level -= 1;
        // return row[level].qText
    },
    allItemsOfLevel: function(level) {
      console.log('all items of level helper');
        var topics = Session.get(integrationTopics);
    },
    XValue(index) {
      console.log('xvalue helper, x:', index);
        return 1200 * index;
    }
});

Template.integrationTopicsCircular.onRendered(function() {
  api = impress();
        api.init();
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


    getTableWithEnigma(appId);
    // exampleAlex();
    // qSocksGetTable('371e1116-02ef-4030-be06-13e8342b6340');
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
                                        qDef: "=Count({<[Level 2]={'"+level2Text+"'}>}1)"
                                    }
                                }]
                            }
                        })
                        .then(model => {
                            model.getHyperCubeData('/qHyperCubeDef', [{ qTop: 0, qLeft: 0, qWidth: 3, qHeight: 3333 }]).then(data => {
                                console.log('Result set from Qlik Sense:', data);
                                var table = data[0].qMatrix;
                                console.log('Data set contained in QMatrix', table);
                                Session.set('integrationTopics', table)
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
                                console.log('Result set from Qlik Sense:', data);
                                var table = data[0].qMatrix;
                                console.log('Data set contained in QMatrix', table);
                                Session.set('integrationTopics', table)
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
function qSocksGetTable(appId) {
    var config = {
        host: senseConfig.host,
        port: senseConfig.port,
        isSecure: false,
        origin: 'localhost'
    };

    qsocks.Connect(config)
        .then(function(global) {
            console.log('connected to Qsocks');
            _global = global;
            return global.openDoc(appId, '', '', '', true) //global.openDoc(appId), this code opens the app without data, that is faster!
        })
        .then(function(app) {
            console.log('** QSocks opened the app and now tries to get a hypercube from app: ', appId);
            // createList(app);
            createCube(app);
        })
        .catch((error) => {
            console.error('error while getting the table from the app: ', error);
            throw new Meteor.error(error);
        });
}

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
