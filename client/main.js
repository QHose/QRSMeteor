import '/imports/ui/router.js';
import '/imports/ui/generation/generation.js';
import '/imports/ui/UIHelpers';
import '/imports/ui/generation/customer.js';
import '/imports/ui/layouts/layout.js';
import '/imports/ui/layouts/regionLayout.js';
import '/imports/ui/pages/introduction.html';
import '/imports/ui/pages/introduction.js';
import '/imports/ui/pages/webIntegration.html';
import '/imports/ui/pages/webIntegration.js';
import '/imports/ui/pages/introductionSecurity.html';
import '/imports/ui/pages/introductionSecurity.js';
import '/imports/ui/pages/QMC.html';
import '/imports/ui/users/login.js'
import '/imports/ui/notFound.html';
import '/imports/ui/useCases/useCaseSelection.js';
import '/imports/ui/generation/OEMPartnerSide/users.js';
import '/imports/ui/impress/impress.js';
import '/imports/SSO/client/SSO.html';
import '/imports/SSO/client/SSO.js';
import '/imports/ui/pages/legal.html';
import '/imports/ui/pages/documentation.html';
import '/imports/ui/pages/documentation.js';
import '/imports/ui/pages/APILogs.html';
import '/imports/ui/pages/videoOverview.html';
import '/imports/ui/pages/APILogs.js';
import '/imports/ui/pages/videoOverview.html';
import '/imports/ui/pages/videoOverview.js';
import '/imports/ui/pages/architecture.html';
import '/imports/ui/pages/architecture.js';
import '/imports/ui/pages/securityRules.html';
import '/imports/ui/pages/securityRules.js';
import '/imports/startup/accounts-config.js';

import { Template } from 'meteor/templating';
import { Apps, TemplateApps } from '/imports/api/apps';
import { Customers } from '/imports/api/customers';
import { Streams } from '/imports/api/streams'
import { APILogs } from '/imports/api/APILogs'
import { Session } from 'meteor/session';

import moment from 'moment';

Meteor.startup(function() {
    // console.log('configure sAlert, the popup messaging service');
    sAlert.config({
        effect: 'genie',
        position: 'top',
        timeout: 9000,
        html: false,
        onRouteClose: true,
        stack: true,
        offset: 0, // in px - will be added to first alert (bottom or top - depends of the position in config)
        beep: false,

        onClose: _.noop //

    });
    AutoForm.setDefaultTemplate("semanticUI");
});

//google analytics, only if running on qlik.com
if (window.location.href.indexOf("qlik.com") > -1) {
    (function(i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r;
        i[r] = i[r] || function() {
            (i[r].q = i[r].q || []).push(arguments)
        }, i[r].l = 1 * new Date();
        a = s.createElement(o),
            m = s.getElementsByTagName(o)[0];
        a.async = 1;
        a.src = g;
        m.parentNode.insertBefore(a, m)
    })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

    ga('create', 'UA-82055118-1', 'auto');
    ga('send', 'pageview');
}