//Layout Configuration. http://stackoverflow.com/questions/28864942/meteor-use-2-different-layouts-ironrouter
Router.configure({
    layoutTemplate: 'layout',
    notFoundTemplate: 'notFound',
});


//make sure certain path are for authenticated users only
Router.plugin('ensureSignedIn', {
    only: ['generation', 'users', 'SSO']
});


//map paths to blaze templates
Router.route('/', function() {
    this.render('introduction');
});

Router.route('/users');
Router.route('/homeAbout');
Router.route('/APILogs');
Router.route('/ApiLogsTable');
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
Router.route('/legal');
Router.route('/documentation');
Router.route('/templateOverview');
Router.route('/useCaseSelection');

//Single sing on integration route, this is the route you configure in Qlik sense proxy
Router.route('/SSO', {
	template: 'SSO',
    layoutTemplate: 'SSOLayout'
});

// Router.route('/register');
// Router.route('/login');

Router.route('/start', function () {
  // use the template named ApplicationLayout for our layout
  this.layout('ApplicationLayout');

  // render the Post template into the "main" region
  // {{> yield}}
  this.render('Post');

  // render the PostAside template into the yield region named "aside" 
  // {{> yield "aside"}}
  this.render('PostAside', {to: 'aside'});

  // render the PostFooter template into the yield region named "footer" 
  // {{> yield "footer"}}
  this.render('PostFooter', {to: 'footer'});

});