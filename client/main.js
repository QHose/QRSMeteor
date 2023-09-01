import '/imports/ui/router.js';
import '/imports/ui/UIHelpers';
import '/imports/ui/layouts/layout.js';
import '/imports/ui/layouts/regionLayout.js';
import '/imports/ui/notFound.html';
import '/imports/ui/useCases/useCaseSelection.js';
import '/imports/ui/pages/legal.html';
import { senseConfig } from '/imports/api/config';
import { initQlikSense } from "/imports/ui/useCases/useCaseSelection";

var Cookies = require('js-cookie');

import {
    Template
} from 'meteor/templating';
import {
    Apps,
    TemplateApps
} from '/imports/api/apps';
import {
    Session
} from 'meteor/session';


import moment from 'moment';

Meteor.startup(async function() {
    // console.log('configure sAlert, the popup messaging service');
    //https://atmospherejs.com/juliancwirko/s-alert
    sAlert.config({
        effect: 'stackslide',
        position: 'top-right',
        timeout: 9000,
        html: false,
        onRouteClose: false,
        stack: true,
        offset: 100, // in px - will be added to first alert (bottom or top - depends of the position in config)
        beep: false,
        onClose: _.noop
    });
    AutoForm.setDefaultTemplate("semanticUI");

    Meteor.call('getAppIDs', async function(error, IDs) {
        if (error) {
            alert('Error', error);
        } else {
            try {
                senseConfig.SSBIAppId = IDs.SSBI;
                senseConfig.slideGeneratorAppId = IDs.slideGenerator;
                Session.set('SSBIAppId', IDs.SSBI);
                Cookies.set('slideGeneratorAppId', IDs.slideGenerator);
                console.log('If the browser loads the appplication, we make an api call to get the appId to be used for the slide generator: ' + IDs.slideGenerator + ' and the self service BI app: ' + IDs.SSBI);
                check(senseConfig.SSBIAppId, String);
                check(senseConfig.slideGeneratorAppId, String);

                console.log('now make a connection to the slide generator app to get the slide data');
                await initQlikSense();

            } catch (error) {
                var m = 'We could not retreive the app ids for the slide generator or the SSBI app. Did you forget to use the correct name for the SSBI or slidegenerator app in the settings.json file, are your apps in the correct stream? Did you forget to run once with "initializeQlikSense:true" in the settings.json? Check the server logs, most problems arise from the wrong hostnames, or no certificates.';
                sAlert.error('Could not make a websocket connection from the browser using EngimaJS to Qlik Sense', error);
                console.error(m + ' with error ' + error);
            }
        }
    });
});

// //google analytics, only if running on qlik.com
// if (window.location.href.indexOf("qlik.com") > -1) {
//     (function(i, s, o, g, r, a, m) {
//         i['GoogleAnalyticsObject'] = r;
//         i[r] = i[r] || function() {
//             (i[r].q = i[r].q || []).push(arguments)
//         }, i[r].l = 1 * new Date();
//         a = s.createElement(o),
//             m = s.getElementsByTagName(o)[0];
//         a.async = 1;
//         a.src = g;
//         m.parentNode.insertBefore(a, m)
//     })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

//     ga('create', 'UA-82055118-1', 'auto');
//     ga('send', 'pageview');
// }