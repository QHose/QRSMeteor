import '/imports/ui/useCases/useCaseSelection.html';
import '/imports/ui/slideGenerator/slides.html';
import '/imports/ui/slideGenerator/slides';
import '/imports/ui/slideGenerator/slides.css';
// import { getQlikSenseSessionForGroup } from '/imports/ui/impress/landingPage';
import './SSBI/SSBI.js';
import {
    Session
} from 'meteor/session';
import {
    senseConfig
} from '/imports/api/config.js';
const enigma = require('enigma.js');
const Cookies = require('js-cookie');
var IntegrationPresentationSelectionSheet = Meteor.settings.public.slideGenerator.selectionSheet; //'DYTpxv'; selection sheet of the slide generator
var slideObject = Meteor.settings.public.slideGenerator.dataObject;
var app = null;


var possibleRoles = ['Developer', 'TECHNICAL', 'GENERIC', 'Product Owner', 'Hosting Ops', 'Business Analyst', 'CTO', 'C-Level, non-technical'];

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
                Meteor.call('logoutPresentationUser', Meteor.userId(), Meteor.userId()); //udc and user are the same for presentation user                    
                Cookies.set('currentMainRole', group);
                var app = await setSlideContentInSession(group);
                await setSelectionInSense(app, 'Partial Workshop', group)
                Router.go('slides');
            }
        })
})

async function setSelectionInSense(app, field, value) {
    console.log('setSelectionInSense field:' + field + ' value:' + value);
    console.log('app', app)
    try {
        // var layout = await app.getAppLayout();
        var myField = await app.getField(field);
        console.log('resources Field', myField);
        var result = await myField.selectValues(
            [{
                "qText": value
            }]
        )
        console.log('result', result)


    } catch (error) {
        console.error(error);
    }
}

async function setSlideContentInSession(group) {
    Cookies.set('currentMainRole', 'TECHNICAL');
    check(group, String);
    try {
        // get a valid ticket
        var userProperties = {
            group: group
        };
        var ticket = await Meteor.callPromise('getTicketNumber', userProperties, Meteor.settings.public.slideGenerator.virtualProxy);

        var qix = await getQix(ticket);

        //get the slide content and register an event handler, so we know when Qlik Sense changed and can update the screen... with new content. Its fine if it runs in parallel
        await Promise.all([
            getAllSlides(qix),
            setChangeListener(qix),
        ]);

        return qix.app;
    } catch (error) {
        var message = 'Can not connect to the Qlik Sense Engine API via enigmaJS';
        console.error(message, error);
        sAlert.error(message, error);
    };
}

export async function getQix(ticket) {
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
            // 'notification:*': (event, data) => console.log('Engima: event ' + event, 'Engima: data ' + data),
        },
        // handleLog: (message) => console.log('Engima: ' + message),
    };
    return await enigma.getService('qix', config);
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
// ─── EVENTS ─────────────────────────────────────────────────────────────────────
//

Template.useCaseSelection.events({
    'click .button.slides': async function(e, t) {
        await Meteor.callPromise('logoutPresentationUser', Meteor.userId(), Meteor.userId()); //udc and user are the same for presentation user                    
        await setSlideContentInSession('TECHNICAL');
        Router.go('slides');
    }
});

//
// ─── MAIN TOPICS LEVEL 1 AND 2 ─────────────────────────────────────────────────
//
async function getAllSlideHeaders(qix) {
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
    var tableWithChapters = insertSectionBreakers(sessionData[0].qMatrix);
    console.log('tableWithChapters', tableWithChapters)
    Session.set('slideHeaders', tableWithChapters)
}
//
// ─── GET LEVEL 1 TO 3 ────────────────────────────────────────────
//

export async function getAllSlides(qix) {
    await getAllSlideHeaders(qix);
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
    qix.app.on('changed', async() => {
        console.log('QIX instance change event received, so get the new data set out of Qlik Sense');
        await getAllSlides(qix);
    });
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