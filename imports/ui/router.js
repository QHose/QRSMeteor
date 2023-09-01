var Cookies = require('js-cookie');
import { initQlikSense, getAllSlides } from '/imports/ui/useCases/useCaseSelection.js';
import * as nav from "/imports/ui/nav.js";

//Layout Configuration. http://stackoverflow.com/questions/28864942/meteor-use-2-different-layouts-ironrouter
Router.configure({
    layoutTemplate: 'containerlayout',
    notFoundTemplate: 'notFound',
});

Router.route('/slides', {
    template: 'slides',
    layoutTemplate: 'emptyLayout'
});

Router.route('/', async function() {
    var selection = this.params.query.selection
    if (selection) {
        await initQlikSense();
        await nav.selectViaQueryId(selection);
        // get the data and go to the slides
        await getAllSlides(false);
        // after we got all data in an array from sense, change the router/browser to the slides page
        Router.go("slides");
    } else {
        Router.go('useCaseSelection');
    }
});

Router.route('/useCaseSelection', async function() {
    var selection = this.params.query.selection
    if (selection) {
        await initQlikSense();
        await nav.selectViaQueryId(selection);
        // get the data and go to the slides
        await getAllSlides(false);
        // after we got all data in an array from sense, change the router/browser to the slides page
        Router.go("slides");
    } else {
        this.layout('containerlayout');
        this.render('useCaseSelection');
    }
});

Router.route('/legal');

Router.route('/notFound');
Router.route('/userOverview');
Router.route('/homeAbout');
Router.route('/introduction');
Router.route('/SecurityDeepDive');

//VIDEO OVERVIEW
Router.route('/videoOverview', {
    template: 'videoOverview',
    layoutTemplate: 'containerlayout'
});
Router.route('/videoOverview_embedded', {
    template: 'videoOverview',
    layoutTemplate: 'SSOLayout'
});

Router.route('/templateOverview', {
    template: 'templateOverview',
    layoutTemplate: 'SSOLayout'
});

//users for the slide generator have their own virtual proxy redirect path
Router.route('/presentationsso', {
    template: 'SSO',
    layoutTemplate: 'SSOLayout'
});

//SLIDE GENERATOR LANDING PAGES
Router.route('/presentation', {
    template: 'landingPage',
    layoutTemplate: 'presentationLayout'
});

Router.route('/integration', {
    template: 'landingPage',
    layoutTemplate: 'presentationLayout'
});




//redirect users from saasdemo.qlik.com to integration.qlik.com
if (window.location.href.indexOf("saasdemo") > -1) {
    // var newURL = 'http://'+window.location.protocol + "//" + window.location.host + "/" + window.location.pathname;
    window.location = "http://integration.qlik.com" + window.location.pathname;
}