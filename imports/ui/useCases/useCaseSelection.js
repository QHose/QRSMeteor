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

    console.log('Cookies.get(\'currentMainRole\')', Cookies.get('currentMainRole'))
    $('.ui.dropdown')
        .dropdown();

    $.each(possibleRoles, function(i, item) {
        $('#bodyDropdown').append($('<option>', {
            value: item,
            text: item
        }));
    });

    setTimeout(function() {
        $(".ui.dropdown").dropdown("refresh");
        $(".ui.dropdown").dropdown("set selected", Cookies.get('currentMainRole'));
    }, 0)

    setTimeout(function() {
        $('.ui.dropdown')
            .dropdown({
                async onChange(group, text, selItem) {
                    Meteor.call('logoutPresentationUser', Meteor.userId(), Meteor.userId()); //udc and user are the same for presentation user                    
                    Cookies.set('currentMainRole', group);
                    await setSlideContentInSession(group);
                    Router.go('slides');
                }
            })
    }, 1000)
})

async function setSlideContentInSession(group) {
    try {
        // get a valid ticket
        var userProperties = {
            group: group
        };
        var ticket = await Meteor.callPromise('getTicketNumber', userProperties);

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
                'notification:*': (event, data) => console.log('Engima: event ' + event, 'Engima: data ' + data),
            },
            handleLog: (message) => console.log('Engima: ' + message),
            //http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-Msgs-Proxy-Clients-OnAuthenticationInformation.htm
            // listeners: {
            //     'notification:OnAuthenticationInformation': (authInfo) => {
            //         // console.log('authInfo', authInfo)
            //         if (authInfo.mustAuthenticate) {
            //             location.href = authInfo.loginUri;
            //         }
            //     },
            // }
        };
        var qix = await enigma.getService('qix', config);
        console.log('Recieved qix object: ', qix)
        getAllSlideHeaders(qix);
        getAllSlides(qix);
        setChangeListener(qix);

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



// export async function getQlikSenseSessionForGroup(group) {
//     // console.log('Slide generator landing page: checking Qlik Sense access... is the user logged in using the QPS API OnAuthenticationInformation?');
//     var userProperties = {
//         group: group
//     };

//     var ticket = await Meteor.callPromise('getTicketNumber', userProperties);
//     console.log('Requested ticket from Qlik Sense server, so client can login without redirects...', ticket)

//     const enigmaConfig = {
//         schema: senseConfig.QIXSchema,
//         appId: senseConfig.slideGeneratorAppId,
//         session: { //https://github.com/qlik-oss/enigma.js/blob/master/docs/qix/configuration.md#example-using-nodejs
//             host: senseConfig.host,
//             prefix: Meteor.settings.public.slideGenerator.virtualProxy,
//             port: senseConfig.port,
//             unsecure: true,
//             urlParams: {
//                 qlikTicket: ticket
//             }
//         },
//         listeners: {
//             'notification:*': (event, data) => console.log('Engima: event ' + event, 'Engima: data ' + data),
//         },
//         handleLog: (message) => console.log('Engima: ' + message),
//         //http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-Msgs-Proxy-Clients-OnAuthenticationInformation.htm
//         // listeners: {
//         //     'notification:OnAuthenticationInformation': (authInfo) => {
//         //         // console.log('authInfo', authInfo)
//         //         if (authInfo.mustAuthenticate) {
//         //             location.href = authInfo.loginUri;
//         //         }
//         //     },
//         // }
//     };

//     console.log('We connect to Qlik Sense using enigma config', enigmaConfig)

//     return await enigma.getService('qix', enigmaConfig)
//         .then(qix => {
//             console.log('user is authenticated in Qlik Sense. QIX object:', qix);
//             Session.set('userLoggedInSense', true);
//             // logoutCurrentSenseUserClientSide(); //gives error 500

//         }).catch((error) => {
//             console.info('info: No QIX connection for user, user not yet able to connect to the app via the enigma.js: ', error);
//         });

// }