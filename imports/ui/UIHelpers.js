//import meteor collections
import { Apps, TemplateApps } from '/imports/api/apps';
import { Streams } from '/imports/api/streams';
import { Customers } from '/imports/api/customers';

import * as QSApp from '/imports/api/QRSFunctionsApp';

if (Meteor.isClient) {
	console.log('Setup generic helper functions, for functions every template needs');
    Template.registerHelper('formatDate', function(date) {
        // console.log('in formate Date helper'+ date);
        // return formatDate(date);
        return formatDate(date);
    });

    Template.registerHelper('formatNumber', function(myNumber) {
        var commaFormat = d3.format(",");
        // The expression /,/g is a regular expression that matches all commas.
        return commaFormat(myNumber)
            .replace(/,/g, ".");
    });

    Template.registerHelper('isSelected', function(someValue) {
        return someValue ? 'selected' : '';
    });

    Template.registerHelper('noCustomers', function() {
        return !Customers.find({})
            .count();
    });

    Template.registerHelper('noTemplateApps', function() {
        return !TemplateApps.find({})
            .count();
    });

    Template.registerHelper('noSenseConnection', function() {
        if(!QSApp.getApps()){
        	console.error('No connection to Sense possible');        	
        }
    });

    //generic helpers to return the collection to the blaze template
    Template.registerHelper('customersCollection', function() {
        return Customers.find({}, { sort: { checked: -1 } });
    });

    Template.registerHelper('templateAppsCollection', function() {
        return TemplateApps.find();
    });

    Template.registerHelper('appsCollection', function() {
        return Apps.find();
    });

    Template.registerHelper('streamsCollection', function() {
        return Streams.find();
    });

    Template.registerHelper('engineConfigCollection', function() {
        return EngineConfig
    });
}
