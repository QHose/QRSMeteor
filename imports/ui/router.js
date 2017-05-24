var Cookies = require('js-cookie');

//Layout Configuration. http://stackoverflow.com/questions/28864942/meteor-use-2-different-layouts-ironrouter
Router.configure({
    layoutTemplate: 'layout',
    notFoundTemplate: 'notFound',
});

//redirect users from saasdemo.qlik.com to integration.qlik.com
if(window.location.href.indexOf("saasdemo") > -1) {
    // var newURL = 'http://'+window.location.protocol + "//" + window.location.host + "/" + window.location.pathname;
    window.location = "http://integration.qlik.com" + window.location.pathname;
}

// Load a authentication check handler, depending on which domain it runs.
if(window.location.href.indexOf("qlik.com") > -1) {
    Router.onBeforeAction(mustBeSignedInQlik, { except: [undefined, 'documentation'] });

    // Router.onBeforeAction(mustBeSignedInQlik, { only: ['test'] });
    // Router.onBeforeAction(mustBeSignedIn, { except: [undefined, 'documentation'] });
    //     //make sure certain path are for authenticated users only if the demo runs outside of Qlik.com
    // Router.plugin('ensureSignedIn', {
    //     // only: ['generation', 'users', 'SSO', 'useCaseSelection', 'integration', 'selfService', 'slides', 'presentation']
    //     except: [undefined, 'test', 'useCaseSelection', 'documentation', 'atSignIn', 'atSignUp', 'atForgotPassword']
    // });

} else { //localhost dev environment
    Router.onBeforeAction(mustBeSignedInDEV, { except: [undefined, 'documentation'] });
}

function mustBeSignedInDEV() {
    var user = {
        email: "mbj2@qlik.com",
        "profile": { "name": { "first": "Martijn", "last": "Biesbroek" } },
        roles: ["Base"], // Array.from("Base,Employee,CPEFEmployee"),
        password: "test"
    };

    // "Logout"-Hook: Manual implementation, wait a bit to prevent multiple page loads, because the database needs to be update
    Tracker.autorun(function() {
        if(!Meteor.userId()) {
            Meteor.setTimeout(loginDEV.bind(null, user), 500);
        }
    });

    this.next();
};

function loginDEV(user) {
    if(!Meteor.userId()) { //if not yet logged in into Meteor, create a new meteor account, or log him via a token.
        console.log('user is not yet logged in into meteor', user);

        Meteor.call('resetPasswordOrCreateUser', user, function(err, res) {
            if(err) {
                sAlert.error(err.message);
                console.error(err);
            } else {
                Meteor.loginWithPassword(user.email, user.password, function(err, res) { //
                    if(err) {
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
    Tracker.autorun(function() {
        if(!Meteor.userId()) {
            Meteor.setTimeout(loginQlik, 0); //give the browser some time to log the user in...
        }
    });

    this.next();


};

function loginQlik() {
    //rerun this function anytime something happens with the login state
    var routeName = Router.current().route.getName();
    console.log('mustBeSignedIn via Qlik.com for route: ', routeName);
    var QlikUserProfile = Cookies.get('CSUser'); //only availalbe on Qlik.com domains
    var loggedInUser = Meteor.userId();
    console.log('QlikUserProfile: ', QlikUserProfile);

    if(!QlikUserProfile) {
        //if user is not logged in, redirect to Qliks login page, after it we can read the cookie.
        var uri = Meteor.absoluteUrl() + routeName;
        console.log('The user tried to open: ' + uri);
        var encodedReturnURI = encodeURIComponent(uri);
        var QlikSSO = "https://login.qlik.com/login.aspx?returnURL=" + encodedReturnURI;
        console.log('User has not Qlik.com cookie, so send him to: ', QlikSSO);
        window.location.replace(QlikSSO);
    } else if(!loggedInUser) { //if not yet logged in into Meteor, create a new meteor account, or log him via a token.
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
            // roles: "", //JSON.parse("[" + ulcLevels.substr(ulcLevels.indexOf("=") + 1) + "]"),
            password: emailAddress.substr(emailAddress.indexOf("=") + 1), //no need for a real password mechanism. People just need a login to have their own demo space
        };
        console.log('the user has got a QLIK PROFILE', user, 'Now try to create the user in our local MONGODB or just log him in with a server only stored password');
        //unsafe code, only sufficient for our simple demo site
        Meteor.call('resetPasswordOrCreateUser', user, function(err, res) {
            if(err) {
                console.error(err);
            } else {
                Meteor.loginWithPassword(user.email, user.password, function(err, res) { //
                    if(err) {
                        console.error(err);
                    } else {
                        console.log('user successfully logged in', Meteor.userId());
                    }
                });
            }
        })
    }
}

// //map paths to blaze templates
Router.route('/', function() {
    this.layout('oneColumnCenteredLayout');
    this.render('useCaseSelection');
});

Router.route('/users');
Router.route('/notFound');
Router.route('/userOverview');
Router.route('/homeAbout');
Router.route('/APILogs');
Router.route('/ApiLogsTable');
Router.route('/introduction');
Router.route('/videoOverview');
Router.route('/introductionExtended');
Router.route('/introductionSecurity');
Router.route('/SecurityDeepDive');
Router.route('/generation');
Router.route('/securityRules');
Router.route('/QMC');
Router.route('/webIntegration');
Router.route('/architecture');
Router.route('/sequenceDiagramOverview');
Router.route('/sequenceDiagramGeneration');
Router.route('/legal');
// Router.route('/documentation');
Router.route('/documentation', {
    template: 'documentation',
    layoutTemplate: 'layoutDocumentation'
});

Router.route('/templateOverview');

Router.route('/ppt_integration', {
    template: 'ppt_integration',
    layoutTemplate: 'SSOLayout'
});

Router.route('/test', {
    template: 'generation',
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

Router.route('/impress', {
    template: 'impress',
    layoutTemplate: 'SSOLayout'
});

Router.route('/slideSorter', {
    template: 'slideSorter',
    layoutTemplate: 'SSOLayout'
});


Router.route('/presentation', {
    template: 'landingPage',
    layoutTemplate: 'presentationLayout'
});

Router.route('/slideGenerator', {
    template: 'ppt_integrationMain',
    layoutTemplate: 'presentationLayout'
});

//slide deck integration
Router.route('/integration', {
    template: 'landingPage',
    layoutTemplate: 'presentationLayout'
});
Router.route('/slides', {
    template: 'landingPage',
    layoutTemplate: 'presentationLayout'
});


Router.route('/useCaseSelection', function() {
    this.layout('oneColumnCenteredLayout');
    this.render('useCaseSelection');
});



Router.route('/selfService', function() {
    this.layout('regionLayout');
    this.render('SSBINav', { to: 'nav' });
    this.render('SSBIUsers', { to: 'aside' });
    this.render('SSBISenseApp');
});


// Router.route('/signup');

// Router.route('/register');
// Router.route('/login');
