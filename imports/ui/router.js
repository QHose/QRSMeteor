Router.configure({
    layoutTemplate: 'layout',
    // loadingTemplate: 'loading',
    notFoundTemplate: 'notFound',
    // yieldTemplates: {
    //     nav: { to: 'nav' },
    //     footer: { to: 'footer' },
    // }
});

Router.plugin('ensureSignedIn', {
    // only: ['generation', 'users']
});

Router.route('/', function() {
    this.render('introduction');
});

Router.route('/users');
Router.route('/homeAbout');
Router.route('/APILogs');
Router.route('/introduction');
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

// Router.route('/register');
// Router.route('/login');

