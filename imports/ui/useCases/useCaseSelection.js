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
var Reveal = require('reveal.js');
var qix = null;

var possibleRoles = [
    "Developer",
    "Hosting Ops",
    "Business Analyst",
    "CTO",
    "C-Level - non-technical"
];

export async function initQlikSense() {


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
    Session.set("showSelector", false);
    

    $(".ui.dropdown").dropdown("refresh");
    var textToShow = Cookies.get('currentMainRole') ? Cookies.get('currentMainRole') : 'Your role?'
    $(".ui.dropdown").dropdown("set selected", textToShow);

    !function(){
        var w = window,
        d = w.document;
    
        if( w.onfocusin === undefined ){
            d.addEventListener('focus' ,addPolyfill ,true);
            d.addEventListener('blur' ,addPolyfill ,true);
            d.addEventListener('focusin' ,removePolyfill ,true);
            d.addEventListener('focusout' ,removePolyfill ,true);
        }
        function addPolyfill(e){
            var type = e.type === 'focus' ? 'focusin' : 'focusout';
            var event = new CustomEvent(type, { bubbles:true, cancelable:false });
            event.c1Generated = true;
            e.target.dispatchEvent( event );
        }
        function removePolyfill(e){
    if(!e.c1Generated){ // focus after focusin, so chrome will the first time trigger tow times focusin
        d.removeEventListener('focus' ,addPolyfill ,true);
        d.removeEventListener('blur' ,addPolyfill ,true);
        d.removeEventListener('focusin' ,removePolyfill ,true);
        d.removeEventListener('focusout' ,removePolyfill ,true);
    }
    setTimeout(function(){
        d.removeEventListener('focusin' ,removePolyfill ,true);
        d.removeEventListener('focusout' ,removePolyfill ,true);
    });
    }
    }();
    
    function hasClass(el, className) {
        if (el.classList) {
            return el.classList.contains(className);
        } else {
            return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
        }
    }
    
    var menuItems1 = document.querySelectorAll('#flyoutnavkbfixed li.has-submenu');
    var timer1, timer2;
    
    Array.prototype.forEach.call(menuItems1, function(el, i){
            el.addEventListener("mouseover", function(event){
                    this.className = "has-submenu open";
                    clearTimeout(timer1);
            });
            el.addEventListener("mouseout", function(event){
                    timer1 = setTimeout(function(event){
                            var opennav = document.querySelector("#flyoutnavkbfixed .has-submenu.open");
                            opennav.className = "has-submenu";
                            opennav.querySelector('a').setAttribute('aria-expanded', "false");
                    }, 1000);
            });
            el.querySelector('a').addEventListener("click",  function(event){
                if (this.parentNode.className == "has-submenu") {
                    this.parentNode.className = "has-submenu open";
                    this.setAttribute('aria-expanded', "true");
                } else {
                    this.parentNode.className = "has-submenu";
                    this.setAttribute('aria-expanded', "false");
                }
                event.preventDefault();
            });
            var links = el.querySelectorAll('a');
            Array.prototype.forEach.call(links, function(el, i){
                el.addEventListener("focus", function() {
                    if (timer2) {
                        clearTimeout(timer2);
                        timer2 = null;
                    }
                });
                el.addEventListener("blur", function(event) {
                    timer2 = setTimeout(function () {
                        var opennav = document.querySelector("#flyoutnavkbfixed .has-submenu.open")
                        if (opennav) {
                            opennav.className = "has-submenu";
                            opennav.querySelector('a').setAttribute('aria-expanded', "false");
                        }
                    }, 10);
                });
            });
    });

})

//
// ─── SLIDE GENERATOR BUTTON CLICK ─────────────────────────────────────────────────────────────────────
//

Template.useCaseSelection.events({
    "click .button.slides": async function (e, t) {
        Session.set("showSelector", true);
        Router.go("slides");
            
    },
    "click #videoButton": async function (e, t) {
        nav.selectMenuItemInSense("*Video overview:*");
    },
    "click a": async function (e, t) { //if anaything happens with the dropdown box... adjust the selection, and get new slides.
        var selectedRole = e.currentTarget.id;
        Cookies.set("currentMainRole", selectedRole);
        await setSelectionInSense("Partial Workshop", selectedRole);

        //get slides
        await getAllSlides();

        Router.go("slides");
        Session.set("showSelector", false);
        ////go to the first slide after a data refresh.           
        Reveal.slide(0); 
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
        console.log('result of setting a selection in Sense', result)
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
var sectionBreakerConfig = true;
export async function getAllSlides(insertSectionBreakers = sectionBreakerConfig) {
    var qix = await getQix();
    //insert breakers before a change of topic? YES/NO... breakers are annoying when you make a menu selection or want to link to a sheet
    sectionBreakerConfig = insertSectionBreakers;
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
    try {
        qix.app.on('changed', async () => {
            // console.log('QIX instance change event received, so get the new data set out of Qlik Sense, and store the current selection in the database.');
            await getCurrentSelections();
            // Session.set("slideHeaders", null); //reset the slideheaders to ensure all slide content templates are re-rendered.
            // Meteor.setTimeout(async function wait() {
            //     await getAllSlides();
            //     Reveal.slide(0); //go to the first slide after a data refresh.           
            // }, 100)
        });
    } catch (error) {
        console.error('failed to set change listener: ', error);
    }
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