// import meteor collections
import { Apps, TemplateApps } from '/imports/api/apps';
import { Streams } from '/imports/api/streams';
import { Customers } from '/imports/api/customers';
import { senseConfig } from '/imports/api/config';

if (Meteor.isClient) {
    console.log('Setup generic helper functions, for functions every template needs');
    // Template.registerHelper('formatDate', function(date) {
    //     // console.log('in formate Date helper'+ date);
    //     // return formatDate(date);
    //     return formatDate(date);
    // });

    // // Template.registerHelper('formatNumber', function(myNumber) {
    //     var commaFormat = d3.format(",");
    //     // The expression /,/g is a regular expression that matches all commas.
    //     return commaFormat(myNumber)
    //         .replace(/,/g, ".");
    // });

    Template.registerHelper('URL_howDoesSaaSAutomationWork', function() {
        return 'wVVbP7a5-I8';
    });

    Template.registerHelper('doc_securtityIntegration', function() {
        return 'https://onedrive.live.com/redir?page=view&resid=805405928A75727!1330&authkey=!ANwk5S8KPC__-dw&wd=target%28EMBEDDED%20ANALYTICS.one%7CBF2972BE-48A0-46FA-AF7A-F6D2F80CF06B%2FSecurity%20integration%3A%20Provide%20Single%20Sign%20On%20and%20share%20access%20rights%7C51692548-CA14-46D7-BCE5-69C1473E44BD%2F%29
onenote:https://d.docs.live.net/0805405928a75727/OneNote/Publications/QlikSense/EMBEDDED%20ANALYTICS.one#Security%20integration%20Provide%20Single%20Sign%20On%20and%20share%20access%20rights&section-id={BF2972BE-48A0-46FA-AF7A-F6D2F80CF06B}&page-id={51692548-CA14-46D7-BCE5-69C1473E44BD}&end';
    });

    Template.registerHelper('senseServerHub', function() {
        return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxyClientUsage + '/hub';
    });

    Template.registerHelper('senseServerQMC', function() {
        return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxyClientUsage + '/qmc';
    });

    Template.registerHelper('webIntegrationDemo', function() {
        return 'http://' + Meteor.settings.public.webIntegrationHost + ':' + Meteor.settings.public.webIntegrationDemoPort;
    });


    Template.registerHelper('isSelected', function(someValue) {
        return someValue ? 'selected' : '';
    });

    Template.registerHelper('customers', function() {
        return Customers.find({}, { sort: { checked: -1 } });
    });

    //used for Aldeed autoform
    Template.registerHelper("Customers", Customers);

    Template.registerHelper('noCustomers', function() {
        return !Customers.find({})
            .count();
    });

    Template.registerHelper('noTemplateApps', function() {
        return !TemplateApps.find({})
            .count();
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

    Template.registerHelper('freshEnvironment', function() {
        return !Customers.find()
            .count() && !TemplateApps.find()
            .count()
    });

    Template.registerHelper('readyToSelectTemplate', function() {
        return Customers.find()
            .count() && !TemplateApps.find()
            .count()
    });

    Template.registerHelper('templateButNoCustomer', function() {
        return !Customers.find()
            .count() && TemplateApps.find()
            .count()
    });

    Template.registerHelper('readyToGenerate', function() {
        return Customers.find({})
            .count() && TemplateApps.find()
            .count() && !Session.get('generated?') && !Session.equals('loadingIndicator', 'loading');
    });

    Template.registerHelper('generationFinished', function() {
        return (Session.equals('loadingIndicator', 'loading') || Session.get('generated?'));
    });

    Template.registerHelper('readyToTestSSO', function() {
        return Session.get('generated?')&&Customers.find()
            .count() && TemplateApps.find()
            .count();
    });

}
