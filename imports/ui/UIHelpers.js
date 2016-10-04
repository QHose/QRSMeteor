// import meteor collections
import { Apps, TemplateApps } from '/imports/api/apps';
import { Streams } from '/imports/api/streams';
import { Customers } from '/imports/api/customers';
import { senseConfig } from '/imports/api/config';

if (Meteor.isClient) {
    // console.log('Setup generic helper functions, for functions every template needs');
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

    Template.registerHelper('URL_Youtube_integrated_flow', function() {
        return "https://www.youtube.com/embed/l7W8u7VipiE?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk";
    });


    Template.registerHelper('URL_Youtube_webintegration_introduction', function() {
        return "https://www.youtube.com/embed/V_rajm0F2h4?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk";
    });

    Template.registerHelper('URL_Youtube_architecture_introduction', function() {
        return "https://www.youtube.com/embed/sv5nKDvmRPI?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk";
    });

    Template.registerHelper('URL_Youtube_security_introduction', function() {
        return "https://www.youtube.com/embed/XJ9dOHoMiXE?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk";
    });

    Template.registerHelper('URL_Youtube_security_deepDive', function() {
        return "https://www.youtube.com/embed/k9zYr9eJk0w?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk";
    });

    Template.registerHelper('URL_Youtube_concept_behind', function() {
        return "https://www.youtube.com/embed/JwBOco6fozo?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk";
    });


    Template.registerHelper('URL_howDoesSaaSAutomationWork', function() { //concept behind the demo
        return 'JwBOco6fozo';
    });

    Template.registerHelper('doc_demo_manual', function() { //concept behind the demo
        return 'https://onedrive.live.com/view.aspx?cid=0805405928a75727&id=documents&resid=805405928A75727%211330&app=OneNote&authkey=!ANwk5S8KPC__-dw&&wd=target%28%2F%2FEMBEDDED%20ANALYTICS.one%7Cbf2972be-48a0-46fa-af7a-f6d2f80cf06b%2FHow%20to%20demo%20the%20Qlik%20Sense%20SaaS%20demo%20platform%7Cdb26fbc0-5631-4532-b719-a7cd4e6b7f55%2F%29';
    });





    Template.registerHelper('doc_securtityIntegration', function() {
        return 'https://onedrive.live.com/view.aspx?cid=0805405928a75727&id=documents&resid=805405928A75727%211330&app=OneNote&authkey=!ANwk5S8KPC__-dw&&wd=target%28%2F%2FEMBEDDED%20ANALYTICS.one%7Cbf2972be-48a0-46fa-af7a-f6d2f80cf06b%2FSecurity%20integration%20Provide%20Single%20Sign%20On%20and%20share%20access%20%7Cecde3e29-5853-49a7-a29c-47851b46fc41%2F%29';
    });
    Template.registerHelper('doc_processIntegration', function() {
        return 'https://onedrive.live.com/view.aspx?cid=0805405928a75727&id=documents&resid=805405928A75727%211330&app=OneNote&authkey=!ANwk5S8KPC__-dw&&wd=target%28%2F%2FEMBEDDED%20ANALYTICS.one%7Cbf2972be-48a0-46fa-af7a-f6d2f80cf06b%2FProcess%20integration%20and%20automation%20using%20API%27s%7C269d7763-b98f-4b15-aeb1-6d983b91edc0%2F%29';
    });


    Template.registerHelper('doc_integrationOverview', function() {
        return 'https://onedrive.live.com/view.aspx?cid=0805405928a75727&id=documents&resid=805405928A75727%211330&app=OneNote&authkey=!ANwk5S8KPC__-dw&&wd=target%28%2F%2FEMBEDDED%20ANALYTICS.one%7Cbf2972be-48a0-46fa-af7a-f6d2f80cf06b%2FIntegration%20overview%20-%20Embedded%20analytics%7C4c1bc9c6-3f43-4565-b397-cd6dafe3578b%2F%29';
    });

    Template.registerHelper('doc_sourceCode', function() {
        return 'https://onedrive.live.com/view.aspx?cid=0805405928a75727&id=documents&resid=805405928A75727%211330&app=OneNote&authkey=!ANwk5S8KPC__-dw&&wd=target%28%2F%2FEMBEDDED%20ANALYTICS.one%7Cbf2972be-48a0-46fa-af7a-f6d2f80cf06b%2FQlik%20Sense%20SaaS%20demo%20tool%20documentation%20of%20source%20code%7C126c382e-2f4c-4875-9969-7bfebabda7c8%2F%29';
    });

    Template.registerHelper('doc_webIntegration', function() {
        return 'https://onedrive.live.com/view.aspx?cid=0805405928a75727&id=documents&resid=805405928A75727%211330&app=OneNote&authkey=!ANwk5S8KPC__-dw&&wd=target%28%2F%2FEMBEDDED%20ANALYTICS.one%7Cbf2972be-48a0-46fa-af7a-f6d2f80cf06b%2FWeb%20integration%20embed%20Sense%20charts%20or%20data%20inside%20your%20%7C1e0df32c-d6be-4944-a4e6-6cea57447a59%2F%29';
    });
    Template.registerHelper('doc_dataIntegration', function() {
        return 'https://onedrive.live.com/view.aspx?cid=0805405928a75727&id=documents&resid=805405928A75727%211330&app=OneNote&authkey=!ANwk5S8KPC__-dw&&wd=target%28%2F%2FEMBEDDED%20ANALYTICS.one%7Cbf2972be-48a0-46fa-af7a-f6d2f80cf06b%2FData%20integration%20Combine%20sources%20into%20one%20associative%20model%7Ce669a0a2-9a83-470e-aae8-ba63ac500038%2F%29';
    });

    Template.registerHelper('seq_ticketing_flow', function() {
        return "http://knsv.github.io/mermaid/live_editor/#/view/c2VxdWVuY2VEaWFncmFtCkJyb3dzZXItPj5NZXRlb3Igd2ViIGludGVncmF0aW9uIGRlbW86IFVzZXIgbG9ncyBpbiBpbnRvIE1ldGVvciAKQnJvd3Nlci0-PiBQcm94eTogSUZyYW1lIHRyaWVzIHRvIG9wZW4gU2Vuc2UgY29udGVudCB2aWEgbGluayB0aGF0IGNvbnRhaW5zIC9wcm94eS8KUHJveHktPj5NZXRlb3IgU1NPIGNsaWVudDogUmVkaXJlY3QgcmVxdWVzdCB0byB3ZWJwYWdlIG9uIHRoZSBjbGllbnQgKGNsaWVudCBzaWRlIHJvdXRlKS4KCk5vdGUgcmlnaHQgb2YgUHJveHk6IFByb3h5IGFsc28gaW5jbHVkZXMgdGFyZ2V0SWQgPSA8SUQgZm9yIHRoZSBvcmlnaW5hbCBVUkkgdGhhdCB0aGUgdXNlciB0cmllcyB0byBhY2Nlc3M-LCBhbmQgcHJveHlSZXN0VXJpID0gPHRoZSBVUkkgd2hlcmUgdGhlIGF1dGhlbnRpY2F0aW9uIG1vZHVsZSBjYW4gYWNjZXNzIHRoZSBSRVNUIEFQST4KTWV0ZW9yIFNTTyBjbGllbnQtPk1ldGVvciBzZXJ2ZXI6ICBjbGllbnQgY2FsbHMgKHVzZXIgYXdhcmUpIHNlcnZlciBzaWRlIG1ldGhvZApOb3RlIHJpZ2h0IG9mIE1ldGVvciBzZXJ2ZXI6IFNpbmNlIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIGluIE1ldGVvciwgd2UgY2FuIHJlcXVlc3QgdGhlIHVzZXJJRCBhbmQgZ3JvdXAgbWVtYmVyc2hpcCBmcm9tIHRoZSBNZXRlb3Igc2Vzc2lvbi4gVHJ1c3QgbWVjaGFuaXNtOiBTZXJ2ZXIgaW1wb3J0ZWQgUWxpayBTZW5zZSBjbGllbnQgY2VydGlmaWNhdGUuCk1ldGVvciBzZXJ2ZXItPj5RUFMgQVBJOiBSZXF1ZXN0IHRpY2tldCBhdCBRUFMgQVBJLCBwcm92aWRlIHRoZSB1c2VySWQgYW5kIGdyb3VwcyBpbiBKU09OLgpOb3RlIHJpZ2h0IG9mIE1ldGVvciBzZXJ2ZXI6IE9wdGlvbmFsbHkgaW5jbHVkZSB0aGUgcmVkaXJlY3QgcGFyYW1ldGVyIHRvIGZvcndhcmQgdGhlIHVzZXIgYmFjayB0byB0aGUgcGFnZSBoZSBpbml0aWFsbHkgdHJpZWQgdG8gYWNjZXNzLgpRUFMgQVBJLS0-Pk1ldGVvciBzZXJ2ZXI6IFFQUyBBUEkgcmV0dXJucyBhIHRpY2tldCBudW1iZXIgKGFuZCBwb3NzaWJseSByZWRpcmVjdCBVUkwpIHdoaWNoIHlvdSBoYXZlIHRvIGFwcGVuZCBpbiB0aGUgVVJMIApNZXRlb3Igc2VydmVyLS0-PiBNZXRlb3Igd2ViIGludGVncmF0aW9uIGRlbW86IENyZWF0ZSBhIHJlZGlyZWN0IFVSTCB3aGljaCB0aGUgY2xpZW50IGNvZGUgY2FuIHB1dCBpbiB0aGUgYnJvd3NlciBVUkwgYmFyLiAKTm90ZSByaWdodCBvZiBNZXRlb3Igd2ViIGludGVncmF0aW9uIGRlbW86IENsaWVudCBzaWRlIGNvZGUsIHJlcGxhY2VzIHRoZSB1cmwgaW4gYnJvd3NlciwgYW5kIGZvcndhcmRzIHRoZSB1c2VyIHRvIFFsaWsgU2Vuc2UuIFVzZXIgbm93IHJlY2VpdmVzIGEgUWxpayBTZW5zZSBzZXNzaW9uIGNvb2tpZSAoc2VlIHZpcnR1YWwgcHJveHkgY29uZmlnKSwgYW5kIGFuZCBzdWNoIHNpbmdsZSBzaWduIG9uIGlzIGNvbmZpZ3VyZWQu";
    });

    Template.registerHelper('github_create_stream', function() {
        return "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsStream.js#L48";
    });

    Template.registerHelper('github_copy_app', function() {
        return "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L278";
    });

    Template.registerHelper('github_replace_and_reload_app', function() {
        return "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L69";
    });

    Template.registerHelper('github_publish_app', function() {
        return "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L376";
    });

    Template.registerHelper('github_logout_user', function() {
        return "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QPSFunctions.js#L18";
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
