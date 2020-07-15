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

Router.route('/', async function () {
    var selection = this.params.query.selection
    if (selection) {
        await initQlikSense();
        await nav.selectViaQueryId(selection);
        // get the data and go to the slides
        await getAllSlides();
        // after we got all data in an array from sense, change the router/browser to the slides page
        Router.go("slides");
    }
    else {
        Router.go('useCaseSelection');
    }
});

Router.route('/useCaseSelection', async function () {
    var selection = this.params.query.selection
    if (selection) {
        await initQlikSense();
        await nav.selectViaQueryId(selection);
        // get the data and go to the slides
        await getAllSlides();
        // after we got all data in an array from sense, change the router/browser to the slides page
        Router.go("slides");
    }
    else {
        this.layout('containerlayout');
        this.render('useCaseSelection');
    }
});


//GENERATION
Router.route('/generation');
Router.route('/generation_embedded', {
    template: 'generation',
    layoutTemplate: 'emptyContainerLayout'
});
Router.route('/users', {
    template: 'users',
    layoutTemplate: 'emptyContainerLayout'
});

//SELF SERVICE
Router.route('/selfService', function () {
    this.layout('SSBILayout');
    this.render('nav', { to: 'nav' });
    this.render('SSBIUsers', { to: 'aside' });
    // this.render('SSBIFooter', { to: 'footer' });
    this.render('SSBISenseApp');
});

Router.route('/selfService_embedded', function () {
    this.layout('SSBILayout');
    this.render('SSBIUsers', { to: 'aside' });
    this.render('SSBISenseApp');
});


//API
Router.route('/APILogs');
Router.route('/API_embedded', {
    template: 'APILogs',
    layoutTemplate: 'SSOLayout'
});

Router.route('/ApiLogsTable');
Router.route('/ApiLogsTable_embedded', {
    template: 'ApiLogsTable',
    layoutTemplate: 'SSOLayout'
});
//SECURITY
Router.route('/introductionSecurity');
Router.route('/security_embedded', {
    template: 'introductionSecurity',
    layoutTemplate: 'SSOLayout'
});

//WEB
Router.route('/webIntegration');
Router.route('/webIntegration_embedded', {
    template: 'webIntegration',
    layoutTemplate: 'SSOLayout'
});

//ARCHITECTURE
Router.route('/architecture');
Router.route('/architecture_embedded', {
    template: 'architecture',
    layoutTemplate: 'SSOLayout'
});

//generic overview
Router.route('/generic_links_embedded', {
    template: 'genericDocumentation',
    layoutTemplate: 'SSOLayout'
});

Router.route('/sequenceDiagramOverview');
Router.route('/sequenceDiagramGeneration');
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

Router.route('/documentation', {
    template: 'documentation',
    layoutTemplate: 'containerlayout'
});

Router.route('/templateOverview', {
    template: 'templateOverview',
    layoutTemplate: 'SSOLayout'
});

Router.route('/securityRules', {
    template: 'securityRules',
    layoutTemplate: 'SSOLayout'
});


Router.route('/QMC', {
    template: 'QMC',
    layoutTemplate: 'SSOLayout'
});

// Single sing on integration route, this is the route you configure in Qlik sense proxy
Router.route('/SSO', {
    template: 'SSO',
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

Router.route('/slideSorter', {
    template: 'ppt_slideSorter',
    layoutTemplate: 'presentationLayout'
});

//START THE SLIDE SHOW
Router.route('/slideGenerator', {
    template: 'slidegeneratorSlidesMain',
    layoutTemplate: 'presentationLayout'
});




//redirect users from saasdemo.qlik.com to integration.qlik.com
if (window.location.href.indexOf("saasdemo") > -1) {
    // var newURL = 'http://'+window.location.protocol + "//" + window.location.host + "/" + window.location.pathname;
    window.location = "http://integration.qlik.com" + window.location.pathname;
}

//disabled to ensure we only use anonymous users via https://github.com/artwells/meteor-accounts-guest/
// // Load a authentication check handler, depending on which domain it runs.
// if (window.location.href.indexOf("qlik.com") > -1) {
//     Router.onBeforeAction(mustBeSignedInQlik, { except: [undefined, 'documentation'] });

//     // Router.onBeforeAction(mustBeSignedInQlik, { only: ['test'] });
//     // Router.onBeforeAction(mustBeSignedIn, { except: [undefined, 'documentation'] });
//     //     //make sure certain path are for authenticated users only if the demo runs outside of Qlik.com
//     // Router.plugin('ensureSignedIn', {
//     //     // only: ['generation', 'users', 'SSO', 'useCaseSelection', 'integration', 'selfService', 'slides', 'presentation']
//     //     except: [undefined, 'test', 'useCaseSelection', 'documentation', 'atSignIn', 'atSignUp', 'atForgotPassword']
//     // });

// } else { //localhost dev environment
//     Router.onBeforeAction(mustBeSignedInDEV, { except: [undefined, 'documentation'] });
// }

function mustBeSignedInDEV() {
    var user = {
        // email: "mbj2@test.com",
        email: "mbj2@qlik.com",
        "profile": { "name": { "first": "Martijn", "last": "Biesbroek" } },
        roles: ["Base"], // Array.from("Base,Employee,CPEFEmployee"),
        password: "test"
    };

    addRolesBasedonEmail(user);

    // "Logout"-Hook: Manual implementation, wait a bit to prevent multiple page loads, because the database needs to be update
    Tracker.autorun(function () {
        console.log('------------------------------------');
        console.log('tracker: login status changed...', Meteor.userId());
        console.log('------------------------------------');
        if (!Meteor.userId()) {
            Meteor.setTimeout(loginDEV.bind(null, user), 3000);
        }
    });

    this.next();
};

function loginDEV(user) {
    if (!Meteor.userId()) { //if not yet logged in into Meteor, create a new meteor account, or log him via a token.
        console.log('user is not yet logged in into meteor', user);

        Meteor.call('resetPasswordOrCreateUser', user, function (err, res) {
            if (err) {
                sAlert.error(err.message);
                console.error(err);
            } else {
                console.log('------------------------------------');
                console.log('password reset..');
                console.log('------------------------------------');
                Meteor.loginWithPassword(user.email, user.password, function (err, res) { //
                    if (err) {
                        sAlert.error(err.message);
                        console.error(err);
                    } else {
                        sAlert.success('You are now logged in with your Qlik.com account. You now have your "private demo environment". So feel free to create/change/delete anything you would like...');
                        console.log('user successfully logged in', Meteor.userId());
                    }
                });
            }
        })
    }
}

function mustBeSignedInQlik() {
    // "Logout"-Hook: Manual implementation, wait a bit to prevent multiple page loads, because the database needs to be update
    Logger.autorun(function () {
        if (!Meteor.userId()) {
            Meteor.setTimeout(loginQlik, 0); //give the browser some time to log the user in...
        }
    });

    this.next();


};

//THE CODE BELOW IS JUST TO SIMULATE A SSO IF YOU ALREADY LOGGED IN INTO QLIK.COM. THIS CODE IS UNSECURE AND CAN'T BE USED FOR REAL PRODUCTION ENVIRONMENTS.... WE SET THE GROUPS ON THE CLIENT SIDE ETC. THIS IS UNSECURE. BUT FINE FOR THIS DEMO TOOL.
function loginQlik() {
    //rerun this function anytime something happens with the login state
    var routeName = Router.current().route.getName();
    console.log('mustBeSignedIn via Qlik.com for route: ', routeName);
    var QlikUserProfile = Cookies.get('CSUser'); //only availalbe on Qlik.com domains
    var loggedInUser = Meteor.userId();
    console.log('QlikUserProfile: ', QlikUserProfile);

    if (!QlikUserProfile) {
        //if user is not logged in, redirect to Qliks login page, after it we can read the cookie.
        var uri = Meteor.absoluteUrl() + routeName;
        console.log('The user tried to open: ' + uri);
        var encodedReturnURI = encodeURIComponent(uri);
        var QlikSSO = "https://login.qlik.com/login.aspx?returnURL=" + encodedReturnURI;
        console.log('User has no Qlik.com cookie, so send him to: ', QlikSSO);
        window.location.replace(QlikSSO);
    } else if (!loggedInUser) { //if not yet logged in into Meteor, create a new meteor account, or log him via a token.
        console.log('user is not yet logged in into meteor');
        // QlikUserProfile:  username=bieshosetest&firstName=test&lastName=test&emailAddress=bieshose@gmail.com&contactID=&accountID=&ulcLevels=Base&country=Angola&hash=xS9zTEOE7vSgTVXycUr99UFLc78=
        var [username, firstName, lastName, emailAddress, contactID, accountID, ulcLevels, country, hash] = QlikUserProfile.split('&');

        const user = {
            email: emailAddress.substr(emailAddress.indexOf("=") + 1),
            profile: {
                name: {
                    first: firstName.substr(firstName.indexOf("=") + 1),
                    last: lastName.substr(lastName.indexOf("=") + 1),
                    contactID: contactID ? contactID.substr(contactID.indexOf("=") + 1) : '',
                    accountID: accountID ? accountID.substr(accountID.indexOf("=") + 1) : '',
                },
            },
            roles: '', //JSON.parse("[" + ulcLevels.substr(ulcLevels.indexOf("=") + 1) + "]"),
            password: emailAddress.substr(emailAddress.indexOf("=") + 1), //no need for a real password mechanism. People just need a login to have their own demo space
        };

        addRolesBasedonEmail(user);

        console.log('the user has got a QLIK PROFILE', user, 'Now try to create the user in our local MONGODB or just log him in with a server only stored password');
        //unsafe code, only sufficient for our simple demo site
        Meteor.call('resetPasswordOrCreateUser', user, function (err, res) {
            if (err) {
                console.error(err);
            } else {
                Meteor.loginWithPassword(user.email, user.password, function (err, res) { //
                    if (err) {
                        sAlert.error('Error logging you in...', err.message);
                        console.error(err);
                    } else {
                        sAlert.success('You are now logged in with your Qlik.com account. You now have your "private demo environment". So feel free to create/change/delete anything you would like...');
                        console.log('user successfully logged in', Meteor.userId());
                    }
                });
            }
        })
    }
}

function addRolesBasedonEmail(user) {
    var email = user.email;
    var name = email.substring(0, email.lastIndexOf("@"));
    var domain = email.substring(email.lastIndexOf("@") + 1);
    if (domain === "qlik.com" || domain === "qliktech.com") {
        user.roles = ['qlik']; //unsecure off course, this is only for user friendliness reasons to prevent dead links to confluence content.
    }
}