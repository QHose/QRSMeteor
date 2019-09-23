import '/imports/ui/useCases/useCaseSelection.html';
import '/imports/ui/slideGenerator/slides.html';
import '/imports/ui/slideGenerator/slides';
import '/imports/ui/slideGenerator/slides.css';
import * as nav from "/imports/ui/nav.js";
import { SenseSelections } from '/imports/api/logger';
import './SSBI/SSBI.js';
import {
    Session
} from 'meteor/session';
import {
    senseConfig
} from '/imports/api/config.js';

const enigma = require('enigma.js');
const Cookies = require('js-cookie');
var Reveal = require('reveal.js');
var qix = null;

export var possibleRoles = [
    "Developer",
    "Hosting Ops",
    "Business Analyst",
    "CTO",
    "C-Level - non-technical"
];

export async function initQlikSense() {
    //wait a bit, so Meteor can login, before requesting a ticket...

    //connect to qlik sense
    qix = await makeSureSenseIsConnected();
    // make sure we get a signal if something changes in qlik sense, like a selection in the iframe menu
    await setChangeListener(
        qix
    );
}



//make sure you go to the first slide when we have new slide data
Tracker.autorun(() => {
    Session.get('slideHeaders');
    Meteor.setTimeout(function () {
        try {
            Reveal.slide(0);
        } catch (error) { }
    }, 500);
});
// ONRENDERED.
Template.useCaseSelection.onRendered(async function () {

    //fill the dropdown using a array of values
    $.each(possibleRoles, function (i, item) {
        $('#bodyDropdown').append($('<option>', {
            value: item,
            text: item
        }));
    });

    $(".ui.dropdown").dropdown("refresh");
    var textToShow = Cookies.get('currentMainRole') ? Cookies.get('currentMainRole') : 'Your role?'
    $(".ui.dropdown").dropdown("set selected", textToShow);

})

//
// ─── SLIDE GENERATOR BUTTON CLICK ─────────────────────────────────────────────────────────────────────
//

Template.useCaseSelection.events({
    "click .button.slides": async function (e, t) {
        Session.set("sheetSelectorSeen", false);
        Router.go("slides");

        setTimeout(function () {
            nav.showSlideSelector();
        }, 100);
    },
    "click #videoButton": async function (e, t) {
        nav.selectMenuItemInSense("*Video overview:*");
    },
    "blur .ui.dropdown.selection .menu": async function (e, t) { //if anything happens with the dropdown box... adjust the selection, and get new slides.
        var selectedRole = t.$(".ui.dropdown").find(":selected").val();
        Session.set("sheetSelectorSeen", true);
        Cookies.set("currentMainRole", selectedRole);
        await setSelectionInSense("Partial Workshop", selectedRole);
        // Meteor.setTimeout(function() {
        Router.go("questions");
        // }, 200);

    }
});


async function setSelectionInSense(field, value) {
    console.log('setSelectionInSense field:' + field + ' value:' + value);
    try {
        var qix = await getQix();
        console.log('qix', qix)
        await qix.app.clearAll();
        var myField = await qix.app.getField(field);
        var result = await myField.selectValues(
            [{
                "qText": value
            }]
        )
    } catch (error) {
        console.error('Error making selection in Sense ', error);
    }
}

async function getTicket() {
    try {
        return await Meteor.callPromise('getTicketNumber', { group: 'notProvided' }, Meteor.settings.public.slideGenerator.virtualProxy);
    } catch (error) {
        var message = 'We could not setup single sing on with Qlik Sense. See your console window for more information';
        console.error(message, error);
        sAlert.error('Could not connect to Qlik Sense.');
    }
}

async function makeSureSenseIsConnected() {
    return await getQix(await getTicket());
}

export async function getQix(ticket = null) {
    // console.log('getQix with ticket:', ticket)
    try {
        const config = {
            schema: senseConfig.QIXSchema,
            appId: senseConfig.slideGeneratorAppId,
            session: { //https://github.com/qlik-oss/enigma.js/blob/master/docs/qix/configuration.md#example-using-nodejs
                host: senseConfig.host,
                prefix: Meteor.settings.public.slideGenerator.virtualProxy,
                port: senseConfig.port,
                secure: Meteor.settings.public.useSSL,
                urlParams: {
                    qlikTicket: ticket
                }
            },
            listeners: {
                'notification:*': async (event, data) => {
                    // console.log('Engima notification received, event: ' + event + ' & data: ', data)
                    if (data.mustAuthenticate || event === 'OnSessionTimedOut') { //if the user is not authenticated anymore request a new ticket and get a new connection
                        var ticket = await getTicket();
                        getQix(ticket);
                    } else {
                        // var call = {};
                        // call.action = "Engine API listener";
                        // call.url = '';
                        // call.request = 'Engima.js event: ' + event;
                        // call.response = data;
                        // REST_Log(call, Meteor.userId());
                    }
                },
            },
            handleLog: (message) => {
                // console.log('Engima handleLog: ', message);
                // var call = {};
                // call.action = 'Engine API handleLog';
                // call.url = '';
                // call.request = 'Engima.js log: ';
                // call.response = message;
                // REST_Log(call, Meteor.userId());
            }
        };
        // console.log('config to connect from the browser to Qlik Sense engine:', config)
        return await enigma.getService('qix', config);
    } catch (error) {
        console.error('Qlik Sense Qix error ', error);
        sAlert.error(error.message)
        window.location.href = window.location.origin;
    }

}

//HELPERS
Template.useCaseSelection.helpers({
    userRole() {
        return Cookies.get('currentMainRole');
    }
});


//
// ─── MAIN TOPICS LEVEL 1 AND 2 ─────────────────────────────────────────────────
//
export async function getAllSlideHeaders(qix) {
    if (!qix) {
        qix = await getQix();
    }
    //get all level 1 and 2 fields in a table: these are the individual slides (titles). The bullets are contained in level 3.    
    var headers = await getAllSlideHeadersPlain(qix);
    // var headersWithBreakers = insertSectionBreakers(headers);
    return headers;
}

export async function getAllSlideHeadersPlain(qix) {
    if (!qix) {
        qix = await getQix();
    }
    //get all level 1 and 2 fields in a table: these are the individual slides (titles). The bullets are contained in level 3.
    var sessionModel = await qix.app.createSessionObject({
        qInfo: {
            qType: 'cube'
        },
        qHyperCubeDef: {
            qDimensions: [{
                qDef: {
                    qFieldDefs: ['Level 1']
                }
            }, {
                qDef: {
                    qFieldDefs: ['Level 2'],
                    "qSortCriterias": [{
                        "qSortByState": 0,
                        "qSortByFrequency": 0,
                        "qSortByNumeric": 0,
                        "qSortByAscii": 0,
                        "qSortByLoadOrder": 1,
                        "qSortByExpression": 1,
                        "qExpression": {
                            "qv": "max(CSVRowNo)"
                        },
                        "qSortByGreyness": 0
                    }],
                }
            }]
        }
    });
    sessionData = await sessionModel.getHyperCubeData('/qHyperCubeDef', [{
        qTop: 0,
        qLeft: 0,
        qWidth: 3,
        qHeight: 3333
    }]);
    return sessionData[0].qMatrix;
}
//
// ─── GET LEVEL 1 TO 3 ────────────────────────────────────────────
//

//by default add extra slides (extra items in the data array), so you will get nice dynamic chapter breakers
export async function getAllSlides(insertSectionBreakers = false) {
    var qix = await getQix();
    //insert breakers before a change of topic? YES/NO... breakers are annoying when you make a menu selection or want to link to a sheet
    var table = insertSectionBreakers ? await getAllSlideHeaders(qix) : await getAllSlideHeadersPlain(qix);
    Session.set('slideHeaders', table);
}


export async function getComment(qix) {
    var sessionModel = await qix.app.createSessionObject({
        qInfo: {
            qType: 'cube'
        },
        qHyperCubeDef: {
            qDimensions: [{
                qDef: {
                    qFieldDefs: ['Comment']
                }
            }]
        }
    });
    sessionData = await sessionModel.getHyperCubeData('/qHyperCubeDef', [{
        qTop: 0,
        qLeft: 0,
        qWidth: 3,
        qHeight: 3333
    }]);
    Session.set('slideComment', sessionData[0].qMatrix);
    // console.log('sessionModel', sessionModel)
    // console.log('slide Comment', Session.get('slideComment'));
}

export async function setChangeListener(qix) {
    // console.log('We are connected to Qlik Sense via the APIs, now setChangeListener', qix)
    // try {
    //     qix.app.on('changed', async () => {
    //         // console.log('QIX instance change event received, so get the new data set out of Qlik Sense, and store the current selection in the database.');
    //         await getCurrentSelections();
    //         Session.set("slideHeaders", null); //reset the slideheaders to ensure all slide content templates are re-rendered.
    //         Meteor.setTimeout(async function wait() {
    //             await getAllSlides();
    //             Reveal.slide(0); //go to the first slide after a data refresh.           
    //         }, 100)
    //     });
    // } catch (error) {
    //     console.error('failed to set change listener: ', error);
    // }
}

function insertSectionBreakers(table) {
    var currentLevel1, previousLevel1 = '';
    var newTableWithChapter = [];

    table.forEach(function (currentRow) {
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

function textOfLevel(row, level) {
    level -= 1
    return row[level].qText
}

//http://help.qlik.com/en-US/sense-developer/September2017/Subsystems/EngineAPI/Content/DiscoveringAndAnalysing/MakeSelections/get-current-selections.htm
async function getCurrentSelections() {
    // console.log('function: getCurrentSelections');
    try {
        var qix = await getQix();
        var genericObject = await qix.app.createSessionObject({
            qInfo: {
                qType: 'SessionLists'
            },
            "qSelectionObjectDef": {}
        });
        // console.log("sessionObject", genericObject);

        var layout = await genericObject.getLayout();
        // console.log('genericObject layout', layout)
        var currentSelections = layout.qSelectionObject.qSelections;
        SenseSelections.insert({
            userId: Meteor.userId,
            userName: Meteor.user().profile.name,
            eventType: "selectionChanged",
            selection: currentSelections,
            selectionDate: new Date() // current time
        }, function (err, currentSelectionId) {
            if (err) { console.error('Failed to store the selection in mongoDb') }
            Session.set('currentSelectionId', currentSelectionId);
            return currentSelections;
        });
    } catch (error) {
        var message = 'getCurrentSelections: Can not connect to the Qlik Sense Engine API via enigmaJS';
        console.error(message, error);
        sAlert.error(message, error);
    };
}