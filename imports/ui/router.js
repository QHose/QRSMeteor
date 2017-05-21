var Cookies = require('js-cookie');

//Layout Configuration. http://stackoverflow.com/questions/28864942/meteor-use-2-different-layouts-ironrouter
Router.configure({
    layoutTemplate: 'layout',
    notFoundTemplate: 'notFound',
});

//redirect users from saasdemo.qlik.com to integration.qlik.com
if (window.location.href.indexOf("saasdemo") > -1) {
    // var newURL = 'http://'+window.location.protocol + "//" + window.location.host + "/" + window.location.pathname;
    window.location = "http://integration.qlik.com" + window.location.pathname;
}

//make sure certain path are for authenticated users only
Router.plugin('ensureSignedIn', {
    // only: ['generation', 'users', 'SSO', 'useCaseSelection', 'integration', 'selfService', 'slides', 'presentation']
    except: [undefined, 'useCaseSelection', 'documentation', 'atSignIn', 'atSignUp', 'atForgotPassword']
});

// this hook will run on almost all routes
// Router.onBeforeAction(mustBeSignedIn, { except: [undefined, 'useCaseSelection', 'documentation', 'login', 'signup', 'forgotPassword'] });
Router.onBeforeAction(mustBeSignedIn, { only: ['test'] });

function mustBeSignedIn() {
    var routeName = Router.current().route.getName();
    console.log('mustBeSignedIn called hook for route: ', routeName);
    var QlikUserProfile = Cookies.get('CSUser');
    if (!QlikUserProfile) {
        //if user is not logged in, redirect to Qliks login page, after it we can read the cookie.
        //             // similar behavior as an HTTP redirect
        console.log('The user tried to open: ' + routeName + ' but first ensure the users logs in at Qlik.com');
        var uri = "http://localhost:3000/"+routeName;
        var encodedReturnURI = encodeURIComponent(uri);
        console.log('encodeURIComponent:', encodedReturnURI);
        var QlikSSO = "https://login.qlik.com/login.aspx?returnURL="+encodedReturnURI;
        window.location.replace(QlikSSO); //
    } else {
        var [username, firstName, lastName, emailAddress, contactID, accountID, ulcLevels, hash] = QlikUserProfile.split('&');
        const user = {
            email: emailAddress,
            profile: {
                name: { first: firstName, last: lastName },
            },
            roles: ulcLevels,
        };
        console.log('the user has got a QLIK PROFILE', user, 'Now try to create the user in our local MONGODB or just log him in with a server only stored password');


        // const user = {
        //     email: 'TEST@MAIL.com',
        //     profile: {
        //         name: { first: 'DUMMY', last: 'lastName' },
        //     },
        //     roles: ['TESTGROUP'],
        // };
        try {
            Meteor.call('createAndLoginUser', user);
            this.next();
        } catch (err) {
            sAlert.error(err.message)
        }
    }
    this.next();
};

// //map paths to blaze templates
Router.route('/', function() {
    this.layout('oneColumnCenteredLayout');
    this.render('useCaseSelection');
});

Router.route('/users');
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
