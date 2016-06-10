import '../imports/ui/generation.js';
import '/imports/ui/UIHelpers';
import '/imports/ui/customer.js';
import '/imports/ui/OEMPartner.js';
import '/imports/ui/steps.js';
import '/imports/ui/router.js';
import '/imports/ui/layout.js';
import '/imports/ui/pages/homeAbout.html';
import '/imports/ui/pages/QMC.html';
import '/imports/ui/pages/securityRules.html';
import '/imports/ui/notFound.html';


import { Template } from 'meteor/templating';
import { Apps, TemplateApps } from '/imports/api/apps.js'
import { Streams } from '/imports/api/streams.js'
import { EngineConfig } from '/imports/api/config.js'

import moment from 'moment';
import lodash from 'lodash';
_ = lodash;


Meteor.startup(function () {
console.log('configure sAlert');
    sAlert.config({
        effect: 'genie',
        // position: 'top',
        timeout: 6000,
        html: false,
        onRouteClose: true,
        stack: true,
        // or you can pass an object:
        // stack: {
        //     spacing: 10 // in px
        //     limit: 3 // when fourth alert appears all previous ones are cleared
        // }
        offset: 0, // in px - will be added to first alert (bottom or top - depends of the position in config)
        beep: false,
        // examples:
        // beep: '/beep.mp3'  // or you can pass an object:
        // beep: {
        //     info: '/beep-info.mp3',
        //     error: '/beep-error.mp3',
        //     success: '/beep-success.mp3',
        //     warning: '/beep-warning.mp3'
        // }
        onClose: _.noop //
        // examples:
        // onClose: function() {
        //     /* Code here will be executed once the alert closes. */
        // }
    });

});