import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { senseConfig as config } from '/imports/api/config.js';
// import { Apps, TemplateApps } from '/imports/api/apps.js'
// import { Customers, dummyCustomers } from '../api/customers.js';
// import { Streams } from '/imports/api/streams.js'

Template.nav.helpers({
	webIntegrationServerURL() {
        return 'http://'+ window.location.hostname+':'+Meteor.settings.public.webIntegrationDemoPort;
    },
});

Template.nav.onRendered(function() {
    this.$('.ui.menu')
    .popup({
        position: 'bottom left',
        delay: {
            show: 300,
            hide: 800
        }
    }

    )
});
