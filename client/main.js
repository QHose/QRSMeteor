import '../imports/ui/generation.js';
import '/imports/ui/UIHelpers';
import '/imports/ui/customer.js';
import '/imports/ui/OEMPartner.js';
import '/imports/ui/steps.js';
import '/imports/ui/router.js';
import '/imports/ui/layout.html';
import '/imports/ui/layout.js';
import '/imports/ui/pages/introduction.html';
import '/imports/ui/pages/introduction.js';
import '/imports/ui/pages/webIntegration.html';
import '/imports/ui/pages/webIntegration.js';
import '/imports/ui/pages/introductionSecurity.html';
import '/imports/ui/pages/introductionSecurity.js';
import '/imports/ui/pages/homeAbout.html';
import '/imports/ui/pages/homeAbout.js';
import '/imports/ui/pages/homeAbout.css';
import '/imports/ui/pages/QMC.html';
import '/imports/ui/notFound.html';
import '/imports/ui/nav.html';
import '/imports/ui/nav.js';
import '/imports/ui/users.html';
import '/imports/ui/users.js';
import '/imports/ui/pages/APILogs.html';
import '/imports/ui/pages/APILogs.js';
import '/imports/ui/simulateUserLogin.html';
import '/imports/ui/simulateUserLogin.js';
import '/imports/ui/pages/securityRules.html';
import '/imports/ui/pages/securityRules.js';
import '/imports/startup/accounts-config.js';


import { Template } from 'meteor/templating';
import { Apps, TemplateApps } from '/imports/api/apps';
import { Customers } from '/imports/api/customers';
import { Streams } from '/imports/api/streams'
import { APILogs } from '/imports/api/APILogs'

import moment from 'moment';
import lodash from 'lodash';
_ = lodash;


Meteor.startup(function() {
    // console.log('configure sAlert, the popup messaging service');
    sAlert.config({
        effect: 'genie',
        // position: 'top',
        timeout: 7000,
        html: false,
        onRouteClose: true,
        stack: true,
        offset: 0, // in px - will be added to first alert (bottom or top - depends of the position in config)
        beep: false,

        onClose: _.noop //

    });

      
    AutoForm.setDefaultTemplate("semanticUI");
    

});
