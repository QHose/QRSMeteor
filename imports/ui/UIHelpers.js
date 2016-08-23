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


    Template.registerHelper('URL_Youtube_playlist', function() {
        return 'https://www.youtube.com/playlist?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk';
    });


    Template.registerHelper('URL_howDoesSaaSAutomationWork', function() {
        return 'wVVbP7a5-I8';
    });

    Template.registerHelper('doc_securtityIntegration', function() {
        return 'https://onedrive.live.com/view.aspx?cid=0805405928a75727&id=documents&resid=805405928A75727%211330&app=OneNote&authkey=!ANwk5S8KPC__-dw&&wd=target%28%2F%2FEMBEDDED%20ANALYTICS.one%7Cbf2972be-48a0-46fa-af7a-f6d2f80cf06b%2FSecurity%20integration%20Provide%20Single%20Sign%20On%20and%20share%20access%20%7C4a2a16e2-5900-4967-97f9-b2d824c7bee1%2F%29';
    });
    Template.registerHelper('doc_processIntegration', function() {
        return 'https://onedrive.live.com/view.aspx?cid=0805405928a75727&id=documents&resid=805405928A75727%211330&app=OneNote&authkey=!ANwk5S8KPC__-dw&&wd=target%28%2F%2FEMBEDDED%20ANALYTICS.one%7Cbf2972be-48a0-46fa-af7a-f6d2f80cf06b%2FProcess%20integration%20and%20automation%20using%20API%27s%7C269d7763-b98f-4b15-aeb1-6d983b91edc0%2F%29';
    });


    Template.registerHelper('doc_integrationOverview', function() {
        return 'https://onedrive.live.com/view.aspx?cid=0805405928a75727&id=documents&resid=805405928A75727%211330&app=OneNote&authkey=!ANwk5S8KPC__-dw&&wd=target%28%2F%2FEMBEDDED%20ANALYTICS.one%7Cbf2972be-48a0-46fa-af7a-f6d2f80cf06b%2FIntegration%20overview%20-%20Embedded%20analytics%7C4c1bc9c6-3f43-4565-b397-cd6dafe3578b%2F%29';
    });

    Template.registerHelper('doc_sourceCode', function() {
        return 'https://1drv.ms/u/s!AidXpyhZQAUIijLcJOUvCjwv__nc?wd=target%28EMBEDDED%20ANALYTICS.one%7CBF2972BE-48A0-46FA-AF7A-F6D2F80CF06B%2FQlik%20Sense%20SaaS%20demo%20tool%20documentation%20of%20source%20code%7C126C382E-2F4C-4875-9969-7BFEBABDA7C8%2F%29';
    });

    Template.registerHelper('doc_webIntegration', function() {
        return 'https://onedrive.live.com/view.aspx?cid=0805405928a75727&id=documents&resid=805405928A75727%211330&app=OneNote&authkey=!ANwk5S8KPC__-dw&&wd=target%28%2F%2FEMBEDDED%20ANALYTICS.one%7Cbf2972be-48a0-46fa-af7a-f6d2f80cf06b%2FWeb%20integration%20embed%20Sense%20charts%20or%20data%20inside%20your%20%7C00dd03fd-8c4e-48ce-92b2-54b4cab815e6%2F%29';
    });
    Template.registerHelper('doc_dataIntegration', function() {
        return 'https://onedrive.live.com/view.aspx?cid=0805405928a75727&id=documents&resid=805405928A75727%211330&app=OneNote&authkey=!ANwk5S8KPC__-dw&&wd=target%28%2F%2FEMBEDDED%20ANALYTICS.one%7Cbf2972be-48a0-46fa-af7a-f6d2f80cf06b%2FData%20integration%20Combine%20sources%20into%20one%20associative%20model%7Ce669a0a2-9a83-470e-aae8-ba63ac500038%2F%29';
    });

    Template.registerHelper('senseServerHub', function() {
        return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxyClientUsage + '/hub';
    });

    Template.registerHelper('senseServerDevHub', function() {
        return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxyClientUsage + '/dev-hub';
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
        return Session.get('generated?') && Customers.find()
            .count() && TemplateApps.find()
            .count();
    });

}
