//Layout Configuration. http://stackoverflow.com/questions/28864942/meteor-use-2-different-layouts-ironrouter
Router.configure({
    layoutTemplate: 'layout',
    notFoundTemplate: 'notFound',
});


//make sure certain path are for authenticated users only
Router.plugin('ensureSignedIn', {
    only: ['generation', 'users', 'SSO', 'useCaseSelection']
});


// //map paths to blaze templates
Router.route('/', function() {
    this.render('introduction');
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

//Single sing on integration route, this is the route you configure in Qlik sense proxy
Router.route('/ppt_integration', {
    template: 'ppt_integration',
    layoutTemplate: 'SSOLayout'
});

Router.route('/SSO', {
    template: 'SSO',
    layoutTemplate: 'SSOLayout'
});

Router.route('/impress', {
    template: 'impress',
    layoutTemplate: 'SSOLayout'
});

Router.route('/integration', {
    template: 'ppt_integrationMain',
    // layoutTemplate: 'SSOLayout'
});
Router.route('/integrationTopicsCircular', {
    template: 'integrationTopicsCircular',
    layoutTemplate: 'SSOLayout'
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



Router.route('/signup');

// Router.route('/register');
// Router.route('/login');