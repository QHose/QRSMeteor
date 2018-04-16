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
import {
    APILogs,
    REST_Log
} from '/imports/api/APILogs';
const enigma = require('enigma.js');
const Cookies = require('js-cookie');
var Reveal = require('reveal');
var IntegrationPresentationSelectionSheet = Meteor.settings.public.slideGenerator.selectionSheet; //'DYTpxv'; selection sheet of the slide generator
var slideObject = Meteor.settings.public.slideGenerator.dataObject;
var app = null;
var qix = null;

//var possibleRoles = ['Developer', 'Product Owner', 'Hosting Ops', 'Business Analyst', 'CTO', 'C-Level, non-technical'];
var possibleRoles = ['Developer', 'Hosting Ops', 'Business Analyst', 'CTO', 'C-Level, non-technical'];

// ONCREATED
Template.useCaseSelection.onCreated(async function() {
    // const apiLogsHandle = Meteor.subscribe('apiLogs');
    // Session.set('selectionMade', false);

    //wait a bit, so Meteor can login, before requesting a ticket...
    Meteor.setTimeout(async function() {
        //connect to qlik sense 
        qix = await makeSureSenseIsConnected();
        // make sure we get a signal if something changes in qlik sense, like a selection in the iframe menu
        await setChangeListener(qix);

        //see if the user started up this screen, with a selection parameter
        var value = getQueryParams('selection');
        // console.log('getQueryParams return value', value)
        //if we found a value, get the selection object from mongoDB and next call the sense selection api to make the selection
        if (value) {
            console.log('%%%%%%%%%%  Slides oncreated: Query string found: ', value);
            await nav.selectViaQueryId(value)
                // get the data and go to the slides
            await getAllSlides();
            // after we got all data in an array from sense, change the router/browser to the slides page
            Router.go("slides");
        } else {
            // console.log('no query selection parameter found');
        }
    }, 0);

})

// Replace with more Meteor approach
function getQueryParams(name, url) {
    // console.log('getQueryParams(name, url)', name + ' ' + url);
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

//make sure you go to the first slide when we have new slide data
Tracker.autorun(() => {
    Session.get('slideHeaders');
    Meteor.setTimeout(function() {
        try {
            Reveal.slide(0);
        } catch (error) {}
    }, 500);
});
// ONRENDERED.
Template.useCaseSelection.onRendered(async function() {
    $('body').addClass('mainLandingImage');

    //fill the dropdown using a array of values
    $.each(possibleRoles, function(i, item) {
        $('#bodyDropdown').append($('<option>', {
            value: item,
            text: item
        }));
    });

    $(".ui.dropdown").dropdown("refresh");
    var textToShow = Cookies.get('currentMainRole') ? Cookies.get('currentMainRole') : 'Your role?'
        // console.log('textToShow', textToShow)
    $(".ui.dropdown").dropdown("set selected", textToShow);

    $('.ui.dropdown')
        .dropdown({
            async onChange(group, text, selItem) {
                // Meteor.call('logoutPresentationUser', Meteor.userId(), Meteor.userId()); //udc and user are the same for presentation user                    
                Cookies.set('currentMainRole', group);
                await setSelectionInSense('Partial Workshop', group)
                    // await setSlideContentInSession(group);
                    // console.log('Content has been received, now show the slides')
                Meteor.setTimeout(function() {
                    // console.log('Router: Go to slides ');
                    Router.go('slides');
                }, 200)
            }
        })
})

//
// ─── SLIDE GENERATOR BUTTON CLICK ─────────────────────────────────────────────────────────────────────
//

Template.useCaseSelection.events({
    'click .button.slides': async function(e, t) {
        // await Meteor.callPromise('logoutPresentationUser', Meteor.userId(), Meteor.userId()); //udc and user are the same for presentation user                    
        await setSlideContentInSession('TECHNICAL');
        Router.go('slides');

        setTimeout(function() {
            nav.showSlideSelector();
        }, 100);
    },
    'click #videoButton': async function(e, t) {
        nav.selectMenuItemInSense(nav.VIDEO_OVERVIEW);
    }
});


async function setSelectionInSense(field, value) {
    console.log('setSelectionInSense field:' + field + ' value:' + value);
    try {
        var qix = await getQix();
        console.log('qix', qix)
        var myField = await qix.app.getField(field);
        console.log('resources Field', myField);
        var result = await myField.selectValues(
            [{
                "qText": value
            }]
        )
        console.log('result of setting a selection in Sense', result)
    } catch (error) {
        console.error('Error making selection in Sense ', error);
    }
}

async function getTicket() {
    return await Meteor.callPromise('getTicketNumber', { group: 'notProvided' }, Meteor.settings.public.slideGenerator.virtualProxy);
}

async function makeSureSenseIsConnected() {
    return await getQix();
}

async function setSlideContentInSession(group) {
    console.log('Try getting the slide data for group', group)
    try {
        check(group, String);
        Cookies.set('currentMainRole', group);
        var qix = await getQix();
        await getAllSlides(true);
    } catch (error) {
        var message = 'Can not connect to the Qlik Sense Engine API via enigmaJS, or group is not provided';
        console.error(message, error);
        sAlert.error(message, error);
    };
}

export async function getQix(ticket=null) {
    // console.log('getQix with ticket:', ticket)
    try {
        const config = {
            schema: senseConfig.QIXSchema,
            appId: senseConfig.slideGeneratorAppId,
            session: { //https://github.com/qlik-oss/enigma.js/blob/master/docs/qix/configuration.md#example-using-nodejs
                host: senseConfig.host,
                prefix: Meteor.settings.public.slideGenerator.virtualProxy,
                port: senseConfig.port,
                unsecure: true,
                urlParams: {
                    qlikTicket: ticket
                }
            },
            listeners: {
                'notification:*': async (event, data) => {
                    // console.log('Engima notification received, event: ' + event + ' & data: ', data)
                    if (data.mustAuthenticate || event==='OnSessionTimedOut') { //if the user is not authenticated anymore request a new ticket and get a new connection
                        var ticket = await getTicket();
                        getQix(ticket);
                    }
                    else 
                    var call = {};
                    call.action = "Engine API listener";
                    call.url = '';
                    call.request = 'Engima.js event: ' + event;
                    call.response = data;
                    REST_Log(call, Meteor.userId());
                },
            },
            handleLog: (message) => {
                // console.log('Engima handleLog: ', message);
                var call = {};
                call.action = 'Engine API handleLog';
                call.url = '';
                call.request = 'Engima.js log: ';
                call.response = message;
                REST_Log(call, Meteor.userId());
            }
        };
        return await enigma.getService('qix', config);
    } catch (error) {
        console.error('Qlik Sense Qix error ', error);
        sAlert.error(error.message)
        location.reload();        
    }

}

//ONDESTROYED
Template.useCaseSelection.onDestroyed(function() {
    $('body').removeClass('mainLandingImage');
});

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
    //get all level 1 and 2 fields in a table: these are the individual slides (titles). The bullets are contained in level 3.    
    // return insertSectionBreakers(await getAllSlideHeadersPlain(qix));
    var headers = await getAllSlideHeadersPlain(qix);
    // console.log('headers', headers)
    var headersWithBreakers = insertSectionBreakers(headers);
    console.log('headersWithBreakers', headersWithBreakers)
    return headersWithBreakers;
}

export async function getAllSlideHeadersPlain(qix) {
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
                    "qSortCriterias": [
                        {
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
                        }
                    ],
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
    // sessionModel.close();
    return sessionData[0].qMatrix;
}
//
// ─── GET LEVEL 1 TO 3 ────────────────────────────────────────────
//

//by default add extra slides (extra items in the data array), so you will get nice dynamic chapter breakers
var sectionBreakerConfig = true;
export async function getAllSlides(insertSectionBreakers = sectionBreakerConfig) {
    console.log('getAllSlides: insertSectionBreakers', insertSectionBreakers)
    var qix = await getQix();
    //insert breakers before a change of topic? YES/NO... breakers are annoying when you make a menu selection or want to link to a sheet
    sectionBreakerConfig = insertSectionBreakers;
    var table = insertSectionBreakers ? await getAllSlideHeaders(qix) : await getAllSlideHeadersPlain(qix);
    Session.set('slideHeaders', table);
}


export async function getComment(qix) {
    console.log('getComment');

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
    console.log('sessionModel', sessionModel)
    console.log('slide Comment', Session.get('slideComment'));
}

export async function setChangeListener(qix) {
    try {
        qix.app.on('changed', async() => {
            console.log('QIX instance change event received, so get the new data set out of Qlik Sense, and store the current selection in the database.');
            await getCurrentSelections();
            Session.set("slideHeaders", null); //reset the slideheaders to ensure all slide content templates are re-rendered.
            await getAllSlides();
            Reveal.slide(0); //go to the first slide after a data refresh.
        });

    } catch (error) {
        console.error('failed to set change listener: ', error);
    }
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

function textOfLevel(row, level) {
    level -= 1
    return row[level].qText
}

//http://help.qlik.com/en-US/sense-developer/September2017/Subsystems/EngineAPI/Content/DiscoveringAndAnalysing/MakeSelections/get-current-selections.htm
async function getCurrentSelections() {
    console.log('function: getCurrentSelections');
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
        }, function(err, currentSelectionId) {
            if (err) { console.error('Failed to store the selection in mongoDb') }
            console.log('New selection has been stored in MongoDB with currentSelectionId', currentSelectionId)
            Session.set('currentSelectionId', currentSelectionId);
            return currentSelections;
        });
    } catch (error) {
        var message = 'getCurrentSelections: Can not connect to the Qlik Sense Engine API via enigmaJS';
        console.error(message, error);
        sAlert.error(message, error);
    };
}