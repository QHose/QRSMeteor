    // import meteor collections
    import { Apps, TemplateApps } from '/imports/api/apps';
    import { Streams } from '/imports/api/streams';
    import { Customers } from '/imports/api/customers';
    import { senseConfig } from '/imports/api/config';

    export var gitHubLinks = {
            createStream: 'https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsStream.js#L48',
            copyApp: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L278",
            replaceAndReloadApp: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L69",
            publishApp: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L376",
            requestTicket: "https://github.com/QHose/QRSMeteor/blob/50bf903dc67d8d1b3757b572e8b2dedbb63202da/imports/api/server/QPSFunctions.js#L205",
            createPasport: "https://github.com/QHose/QRSMeteor/blob/50bf903dc67d8d1b3757b572e8b2dedbb63202da/imports/api/server/QPSFunctions.js#L56",
            redirectURLReceived: "https://github.com/QHose/QRSMeteor/blob/master/imports/SSO/client/SSO.js#L88",
            deleteApp: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L366",
            logoutUser: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QPSFunctions.js#L174",
            saveApp:"https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L124",
            getScript: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L94",
            setScript: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L105",
            reloadApp: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L117",
        };

    if (Meteor.isClient) {
        // console.log('Setup generic helper functions, for functions every template needs');
        Template.registerHelper('formatDate', function(date) {
            return moment(date)
                .format('DD-MM-YYYY');
        });

        // // Template.registerHelper('formatNumber', function(myNumber) {
        //     var commaFormat = d3.format(",");
        //     // The expression /,/g is a regular expression that matches all commas.
        //     return commaFormat(myNumber)
        //         .replace(/,/g, ".");
        // });

        Template.registerHelper('URL_Youtube_howToDemo', function() {
            return 'https://www.youtube.com/watch?v=1PjcTFnC4Mo';
        });
        Template.registerHelper('URL_Youtube_quickIntro', function() {
            return '';
        });

        Template.registerHelper('URL_Youtube_1mflashyIntro', function() {
            return 'https://www.youtube.com/embed/W3gDKdv6K8Y';
        });

        Template.registerHelper('URL_Youtube_playlist', function() {
            return 'https://www.youtube.com/playlist?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk';
        });
        Template.registerHelper('URL_Youtube_integrated_flow', function() {
            return "https://www.youtube.com/embed/M49nv6on5Eg?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk";
        });

        Template.registerHelper('URL_Youtube_generic_security_intro', function() {
            return "https://www.youtube.com/embed/sdCVsMzTf64";
        });


        Template.registerHelper('URL_Youtube_webintegration_introduction', function() {
            return "https://www.youtube.com/embed/zuNvZ_UTmow?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk";
        });

        //QAP
        Template.registerHelper('URL_Youtube_webintegration_extended', function() {
            return "https://www.youtube.com/embed/yLTqzftDa7s";
        });

        Template.registerHelper('URL_Youtube_architecture_introduction', function() {
            return "https://www.youtube.com/embed/sv5nKDvmRPI?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk";
        });

        Template.registerHelper('URL_Youtube_security_introduction', function() {
            return "https://www.youtube.com/embed/XJ9dOHoMiXE?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk";
        });

        Template.registerHelper('URL_Youtube_security_deepDive', function() {
            return "https://www.youtube.com/embed/0E9i5Pf2Hjg";
        });

        Template.registerHelper('URL_Youtube_concept_behind', function() {
            return "https://www.youtube.com/embed/1PjcTFnC4Mo";
        });

        Template.registerHelper('doc_demo_manual', function() {
            return '/docs/How to demo the Qlik Sense SaaS demo platform.pdf';
        });

        Template.registerHelper('doc_sec_function_task_matrix', function() {
            return '/docs/QlikSense Authorizations - Function and Tasks_Demo.xlsx';
        });

        Template.registerHelper('doc_securtityIntegration', function() {
            return 'https://community.qlik.com/docs/DOC-17599';
        });
        Template.registerHelper('doc_processIntegration', function() {
            return 'https://community.qlik.com/docs/DOC-17831';
        });


        Template.registerHelper('doc_integrationOverview', function() {
            return 'https://community.qlik.com/docs/DOC-9533';
        });

        Template.registerHelper('doc_sourceCode', function() {
            return '/docs/Qlik Sense SaaS demo tool documentation of source code.docx';
        });

        Template.registerHelper('doc_demo_setup_instructions', function() {
            return '/docs/Qlik Sense SaaS demo tool setup instructions.docx';
        });

        Template.registerHelper('doc_webIntegration', function() {
            return 'https://community.qlik.com/docs/DOC-17834';
        });
        Template.registerHelper('doc_dataIntegration', function() {
            return 'https://onedrive.live.com/view.aspx?cid=0805405928a75727&id=documents&resid=805405928A75727%211330&app=OneNote&authkey=!ANwk5S8KPC__-dw&&wd=target%28%2F%2FEMBEDDED%20ANALYTICS.one%7Cbf2972be-48a0-46fa-af7a-f6d2f80cf06b%2FData%20integration%20Combine%20sources%20into%20one%20associative%20model%7Ce669a0a2-9a83-470e-aae8-ba63ac500038%2F%29';
        });

        Template.registerHelper('seq_ticketing_flow', function() {
            return "http://knsv.github.io/mermaid/live_editor/#/view/c2VxdWVuY2VEaWFncmFtCkJyb3dzZXItPj5NZXRlb3Igd2ViIGludGVncmF0aW9uIGRlbW86IFVzZXIgbG9ncyBpbiBpbnRvIE1ldGVvciAKQnJvd3Nlci0-PiBQcm94eTogSUZyYW1lIHRyaWVzIHRvIG9wZW4gU2Vuc2UgY29udGVudCB2aWEgbGluayB0aGF0IGNvbnRhaW5zIC9wcm94eS8KUHJveHktPj5NZXRlb3IgU1NPIGNsaWVudDogUmVkaXJlY3QgcmVxdWVzdCB0byB3ZWJwYWdlIG9uIHRoZSBjbGllbnQgKGNsaWVudCBzaWRlIHJvdXRlKS4KCk5vdGUgcmlnaHQgb2YgUHJveHk6IFByb3h5IGFsc28gaW5jbHVkZXMgdGFyZ2V0SWQgPSA8SUQgZm9yIHRoZSBvcmlnaW5hbCBVUkkgdGhhdCB0aGUgdXNlciB0cmllcyB0byBhY2Nlc3M-LCBhbmQgcHJveHlSZXN0VXJpID0gPHRoZSBVUkkgd2hlcmUgdGhlIGF1dGhlbnRpY2F0aW9uIG1vZHVsZSBjYW4gYWNjZXNzIHRoZSBSRVNUIEFQST4KTWV0ZW9yIFNTTyBjbGllbnQtPk1ldGVvciBzZXJ2ZXI6ICBjbGllbnQgY2FsbHMgKHVzZXIgYXdhcmUpIHNlcnZlciBzaWRlIG1ldGhvZApOb3RlIHJpZ2h0IG9mIE1ldGVvciBzZXJ2ZXI6IFNpbmNlIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIGluIE1ldGVvciwgd2UgY2FuIHJlcXVlc3QgdGhlIHVzZXJJRCBhbmQgZ3JvdXAgbWVtYmVyc2hpcCBmcm9tIHRoZSBNZXRlb3Igc2Vzc2lvbi4gVHJ1c3QgbWVjaGFuaXNtOiBTZXJ2ZXIgaW1wb3J0ZWQgUWxpayBTZW5zZSBjbGllbnQgY2VydGlmaWNhdGUuCk1ldGVvciBzZXJ2ZXItPj5RUFMgQVBJOiBSZXF1ZXN0IHRpY2tldCBhdCBRUFMgQVBJLCBwcm92aWRlIHRoZSB1c2VySWQgYW5kIGdyb3VwcyBpbiBKU09OLgpOb3RlIHJpZ2h0IG9mIE1ldGVvciBzZXJ2ZXI6IE9wdGlvbmFsbHkgaW5jbHVkZSB0aGUgcmVkaXJlY3QgcGFyYW1ldGVyIHRvIGZvcndhcmQgdGhlIHVzZXIgYmFjayB0byB0aGUgcGFnZSBoZSBpbml0aWFsbHkgdHJpZWQgdG8gYWNjZXNzLgpRUFMgQVBJLS0-Pk1ldGVvciBzZXJ2ZXI6IFFQUyBBUEkgcmV0dXJucyBhIHRpY2tldCBudW1iZXIgKGFuZCBwb3NzaWJseSByZWRpcmVjdCBVUkwpIHdoaWNoIHlvdSBoYXZlIHRvIGFwcGVuZCBpbiB0aGUgVVJMIApNZXRlb3Igc2VydmVyLS0-PiBNZXRlb3Igd2ViIGludGVncmF0aW9uIGRlbW86IENyZWF0ZSBhIHJlZGlyZWN0IFVSTCB3aGljaCB0aGUgY2xpZW50IGNvZGUgY2FuIHB1dCBpbiB0aGUgYnJvd3NlciBVUkwgYmFyLiAKTm90ZSByaWdodCBvZiBNZXRlb3Igd2ViIGludGVncmF0aW9uIGRlbW86IENsaWVudCBzaWRlIGNvZGUsIHJlcGxhY2VzIHRoZSB1cmwgaW4gYnJvd3NlciwgYW5kIGZvcndhcmRzIHRoZSB1c2VyIHRvIFFsaWsgU2Vuc2UuIFVzZXIgbm93IHJlY2VpdmVzIGEgUWxpayBTZW5zZSBzZXNzaW9uIGNvb2tpZSAoc2VlIHZpcnR1YWwgcHJveHkgY29uZmlnKSwgYW5kIGFuZCBzdWNoIHNpbmdsZSBzaWduIG9uIGlzIGNvbmZpZ3VyZWQu";
        });

        Template.registerHelper('github_create_stream', function() {
            return gitHubLinks.createStream;
        });

        Template.registerHelper('github_copy_app', function() {
            return gitHubLinks.copyApp;
        });

        Template.registerHelper('github_replace_and_reload_app', function() {
            return gitHubLinks.replaceAndReloadApp;
        });

        Template.registerHelper('github_publish_app', function() {
            return gitHubLinks.publishApp;
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

        Template.registerHelper('senseServer', function() {
            return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxyClientUsage;
        });

        Template.registerHelper('webIntegrationDemo', function() {
            return 'http://' + Meteor.settings.public.webIntegrationHost + ':' + Meteor.settings.public.webIntegrationDemoPort;
        });

        //Integration presentation Iframe selector
        var appId = Meteor.settings.public.IntegrationPresentationApp;
        var IntegrationPresentationSelectionSheet = Meteor.settings.public.IntegrationPresentationSelectionSheet; //'DYTpxv'; selection sheet of the slide generator
        var proxy = Meteor.settings.public.IntegrationPresentationProxy;
        Template.registerHelper('IFrameURLChapterSelection', function() {
            return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + proxy + '/single/?appid=' + appId + '&sheet=' + IntegrationPresentationSelectionSheet + '&opt=currsel';
        });

        Template.registerHelper('authenticatedSlideGenerator', function(someValue) {
            return Session.get('authenticatedSlideGenerator');

        });

        Template.registerHelper('userSelectedPresentationType', function(someValue) {
            return Session.get('groupForPresentation'); //user selected a presentation type?
        });

        Template.registerHelper('isSelected', function(someValue) {
            return someValue ? 'selected' : '';
        });

        Template.registerHelper('customers', function() {
            return Customers.find({});
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
            return freshEnvironment();
        });

        Template.registerHelper('loading', function() {
            // console.log('loading indicator in helper is: ', Session.get('loadingIndicator'));
            return Session.get('loadingIndicator');
        });

        export function freshEnvironment() {
            if (!Customers.find().count() && !TemplateApps.find().count()) {
                // Session.set('currentStep', 0);
                return true
            }
        };

        Template.registerHelper('readyToSelectTemplate', function() {
            return currentStep() === 2
        });

        Template.registerHelper('templateButNoCustomer', function() {
            return !Customers.find()
                .count() && TemplateApps.find()
                .count()
        });

        Template.registerHelper('readyToGenerate', function() {
            return currentStep() === 3 && !Session.equals('loadingIndicator', 'loading');
        });

        Template.registerHelper('step3', function() {
            return Session.get('currentStep') === 3
        });

        Template.registerHelper('step3or4', function() {
            return Session.get('currentStep') === 3 ||
                Session.get('currentStep') === 4 ||
                Session.equals('loadingIndicator', 'loading')
        });

        Template.registerHelper('stepEqualTo', function(stepNr) {
            // console.log('value of currentStep() ', currentStep());
            return currentStep() === stepNr;
        });

        export function currentStep() {
            // console.log('the current step session', Session.get('currentStep'));//

            //step 0: fresh/resetted environment
            if (freshEnvironment()) {
                return 0
            }
            //step 1 insert customers
            else if (Session.get('currentStep') === 1) {
                Router.go('users');
                return 1
            }
            //step 2 there are customers, but no template
            else if (
                // (Customers.find().count() && !TemplateApps.find().count()) &&
                Session.get('currentStep') === 2) {
                return 2
            }
            //step 3
            else if (
                // Customers.find().count() && 
                // TemplateApps.find().count() && 
                Session.get('currentStep') === 3 &&
                !Session.equals('loadingIndicator', 'loading')) {
                // console.log('loading indicator is ', Session.get('loadingIndicator') )
                return 3
            }
            //step 4
            else if (
                Session.get('currentStep') === 4
                // &&
                // Customers.find().count() &&
                // TemplateApps.find().count()
            ) {
                return 4;
            } else if (Session.equals('loadingIndicator', 'loading')) {
                return;
            } else {
                Session.set('currentStep', 3);
                return 3;
            }
        }

        Template.registerHelper('generationFinished', function() {
            return (Session.equals('loadingIndicator', 'loading') || Session.get('generated?'));
        });

        Template.registerHelper('readyToTestSSO', function() {
            return currentStep() === 4
        });

        Template.registerHelper('and', (a, b) => {
            return a && b;
        });
        Template.registerHelper('or', (a, b) => {
            return a || b;
        });

    }
