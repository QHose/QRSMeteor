import '/imports/ui/useCases/useCaseSelection.html';
import '/imports/ui/slideGenerator/slides.html';
import '/imports/ui/slideGenerator/slides';
import '/imports/ui/slideGenerator/slides.css';
import * as nav from '/imports/ui/nav';
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


var possibleRoles = ['Developer', 'Product Owner', 'Hosting Ops', 'Business Analyst', 'CTO', 'C-Level, non-technical'];

// ONCREATED
Template.useCaseSelection.onCreated(async function() {
    const apiLogsHandle = Meteor.subscribe('apiLogs');
    qix = await makeSureSenseIsConnected();
    await setChangeListener(qix);
})

//make sure you go to the first slide when we have new slide data
Tracker.autorun(() => {
    console.log('------------------------------------');
    console.log('We got new slide data, so go to the first slide');
    console.log('------------------------------------');
    Session.get('slideHeaders');
    Meteor.setTimeout(function() {
        Reveal.slide(0);
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
    console.log('textToShow', textToShow)
    $(".ui.dropdown").dropdown("set selected", textToShow);

    $('.ui.dropdown')
        .dropdown({
            async onChange(group, text, selItem) {
                // Meteor.call('logoutPresentationUser', Meteor.userId(), Meteor.userId()); //udc and user are the same for presentation user                    
                Cookies.set('currentMainRole', group);
                console.log('qix', qix)
                await setSelectionInSense('Partial Workshop', group)
                    // await setSlideContentInSession(group);
                console.log('Content has been received, now show the slides')
                Meteor.setTimeout(function() {
                    console.log('Router: Go to slides ');
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
        console.log('nav.VIDEO_OVERVIEW', nav.VIDEO_OVERVIEW)
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
        await getAllSlides(qix, true);
    } catch (error) {
        var message = 'Can not connect to the Qlik Sense Engine API via enigmaJS, or group is not provided';
        console.error(message, error);
        sAlert.error(message, error);
    };
}

export async function getQix() {
    var ticket = await getTicket();
    console.log('getQix with ticket:', ticket)
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
                'notification:*': (event, data) => {
                    console.log('Engima: event ' + event, 'Engima: data ' + JSON.stringify(data))
                    var call = {};
                    call.action = 'Engine API reponse';
                    call.url = '';
                    call.request = 'Engima.js event: ' + event;
                    call.response = data;
                    REST_Log(call, Meteor.userId());
                }
            },
            handleLog: (message) => console.log('Engima: ' + message),
        };
        return await enigma.getService('qix', config);
    } catch (error) {
        console.error('failed to get Qix ', error);
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
    console.log('headers', headers)
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
                    qFieldDefs: ['Level 2']
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

var sectionBreakerConfig = true;
export async function getAllSlides(qix, insertSectionBreakers = sectionBreakerConfig) {
    console.log('getAllSlides: insertSectionBreakers', insertSectionBreakers)
        //insert breakers before a change of topic? YES/NO... breakers are annoying when you make a menu selection or want to link to a sheet
    sectionBreakerConfig = insertSectionBreakers;
    var table = insertSectionBreakers ? await getAllSlideHeaders(qix) : await getAllSlideHeadersPlain(qix);
    Session.set('slideHeaders', table);

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
                    qFieldDefs: ['Level 2']
                }
            }, {
                qDef: {
                    qFieldDefs: ['Level 3']
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
    Session.set('slideData', sessionData[0].qMatrix);
    console.log('slide data', Session.get('slideData'));
}

export async function setChangeListener(qix) {
    try {
        qix.app.on('changed', async() => {
            console.log('QIX instance change event received, so get the new data set out of Qlik Sense');
            await getAllSlides(qix);
            Reveal.slide(0);

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