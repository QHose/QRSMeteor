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
// if(window.location.href.indexOf("qlik.com") > -1) {
// Router.onBeforeAction(mustBeSignedIn, { only: ['test'] });

Router.onBeforeAction(mustBeSignedIn, { except: [undefined, 'documentation'] });

// } else {
//     //     //make sure certain path are for authenticated users only if the demo runs outside of Qlik.com
// Router.plugin('ensureSignedIn', {
//     // only: ['generation', 'users', 'SSO', 'useCaseSelection', 'integration', 'selfService', 'slides', 'presentation']
//     except: [undefined, 'test', 'useCaseSelection', 'documentation', 'atSignIn', 'atSignUp', 'atForgotPassword']
// });
// }

function mustBeSignedIn() {
    var routeName = Router.current().route.getName();
    console.log('mustBeSignedIn called hook for route: ', routeName);
    var QlikUserProfile = Cookies.get('CSUser'); //only availalbe on Qlik.com domains
    console.log('QlikUserProfile: ', QlikUserProfile);
    if(!QlikUserProfile) {
        //if user is not logged in, redirect to Qliks login page, after it we can read the cookie.
        var uri = Meteor.absoluteUrl() + routeName;
        console.log('The user tried to open: ' + uri + ' but first ensure the users logs in at Qlik.com');
        var encodedReturnURI = encodeURIComponent(uri);
        var QlikSSO = "https://login.qlik.com/login.aspx?returnURL=" + encodedReturnURI;
        console.log(QlikSSO);
        window.location.replace(QlikSSO); //
    } else if(!Meteor.user()) { //if not yet logged in into Meteor, create a new meteor account, or log him via a token.
        console.log('user is not yet logged in into meteor');
        var [username, firstName, lastName, emailAddress, contactID, accountID, ulcLevels, hash, uid] = QlikUserProfile.split('&');
        var user = {
            email: "martijn.biesbroedmkjlkjljkljkfasddffk@qlik.com",
            // "profile": { "name": { "first": "firstName=Martijn", "last": "lastName=Biesbroek" } },
            roles: "test", // Array.from("Base,Employee,CPEFEmployee"),
            hash: "test"
        };
        const user = {
            email: emailAddress.substr(emailAddress.indexOf("=") + 1),
            profile: {
                name: {
                    first: firstName.substr(firstName.indexOf("=") + 1),
                    last: lastName.substr(lastName.indexOf("=") + 1),
                },
            },
            roles: "", //SON.parse("[" + ulcLevels.substr(ulcLevels.indexOf("=") + 1) + "]");,
            hash: hash.substr(hash.indexOf("=") + 1),
        };
        console.log('the user has got a QLIK PROFILE', user, 'Now try to create the user in our local MONGODB or just log him in with a server only stored password');
        Meteor.loginWithPassword(user.email, user.hash, function(err, res) { //
            if(err) {
                console.error(err);
                user.password = user.hash;
                Accounts.createUser(user);
            } else {
                console.log(res);
            }
        });
        // loginUser(user, routeName);
    }
    this.next();
};

function loginUser(user, routeName) {
    console.log('function login user', user, routeName);
    Meteor.call('createAndLoginUser', user, function(err, userId) {
        if(err) {
            sAlert.error('Failed to login via Qlik.com', err.message);
            console.error(err);
            Router.go('notFound');
        } else {
            console.log('user created in our local mongoDB');
            Meteor.loginWithPassword(userId, user.hash, function(err, res) {
                if(err) {
                    console.error(err);
                } else {
                    console.log(res);
                }
            });
        }
    });
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
Router.route('/documentation');
Router.route('/templateOverview');

Router.route('/ppt_integration', {
    template: 'ppt_integration',
    layoutTemplate: 'SSOLayout'
});

Router.route('/test', {
    template: 'videoOverview',
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
