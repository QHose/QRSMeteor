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
var IntegrationPresentationSortedDataObject = Meteor.settings.public.slideGenerator.dataObject; //'pskL';//a table object in the saas presentation qvf, that ensures the slides are in the correct load order. better would be to load this in this order in the API call.
var IntegrationPresentationSelectionSheet = Meteor.settings.public.slideGenerator.selectionSheet; //'DYTpxv'; selection sheet of the slide generator
var slideObject = Meteor.settings.public.slideGenerator.dataObject;


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

    // setTimeout(function() {
    $(".ui.dropdown").dropdown("refresh");
    var textToShow = Cookies.get('currentMainRole') ? Cookies.get('currentMainRole') : 'Your role?'
    console.log('textToShow', textToShow)
    $(".ui.dropdown").dropdown("set selected", textToShow);
    // }, 0)

    // setTimeout(function() {
    $('.ui.dropdown')
        .dropdown({
            async onChange(group, text, selItem) {
                Meteor.call('logoutPresentationUser', Meteor.userId(), Meteor.userId()); //udc and user are the same for presentation user                    
                Cookies.set('currentMainRole', group);
                var app = await setSlideContentInSession(group);
                await setSelectionInSense(app, 'Resources', group)
                Router.go('slides');
            }
        })
        // }, 100)
})

async function setSelectionInSense(app, field, value) {
    console.log('setSelectionInSense $(field) and  $(value)')
    console.log('app', app)
    try {
        // var layout = await app.getAppLayout();
        // console.log('layout', layout)
        var field = await app.getField({
            "qFieldName": "Resources"
        })
        console.log('resourceField', field);
        // var result = await field.select({
        //     "qMatch": "Resources"
        // })


    } catch (error) {
        console.log('------------------------------------');
        console.error(error);
        console.log('------------------------------------');
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
            handleLog: (message) => console.log('Engima: ' + message),
        };
        var qix = await enigma.getService('qix', config);
        console.log('Recieved qix object: ', qix)

        //get the slide content and register an event handler, so we know when Qlik Sense changed and can update the screen... with new content. Its fine if it runs in parallel
        await Promise.all([
            getAllSlideHeaders(qix),
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
        console.log('clicked slides button');
        console.log('logoutPresentationUser');
        await Meteor.callPromise('logoutPresentationUser', Meteor.userId(), Meteor.userId()); //udc and user are the same for presentation user                    
        console.log('setSlideContentInSession')
        await setSlideContentInSession('TECHNICAL');
        console.log('router go to slides');
        Router.go('slides');
    }
});

//
// ─── MAIN TOPICS LEVEL 1 AND 2 ─────────────────────────────────────────────────
//
async function getAllSlideHeaders(qix) {
    var model = await qix.app.getObject(IntegrationPresentationSortedDataObject) //get an existing object out of an app, if you import an app this stays the same
    var data = await model.getHyperCubeData('/qHyperCubeDef', [{
        qTop: 0,
        qLeft: 0,
        qWidth: 3,
        qHeight: 1000
    }]);
    var table = data[0].qMatrix;
    var tableWithChapters = insertSectionBreakers(table);
    console.log('Received a table of data via the Engine API, now the slides can be created by impress.js', tableWithChapters);
    Session.set('slideHeaders', tableWithChapters)
}
//
// ─── GET LEVEL 1 TO 3 ────────────────────────────────────────────
//

async function getAllSlides(qix) {
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
}

function setChangeListener(qix) {
    qix.app.on('changed', () => {
        console.log('QIX instance change event received, so get the new data set out of Qlik Sense');
        getAllSlideHeaders(qix);
        getAllSlides(qix);
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