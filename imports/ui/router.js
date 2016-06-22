

Router.configure({
  layoutTemplate : 'layout',
  // loadingTemplate: 'loading',
  notFoundTemplate: 'notFound'
});

Router.route('/', function () {
  this.render('generation');
});

Router.route('/SSO', function(){
	console.log('router: the request is: '+ req);
	var req = this.request;
	console.log(this);

});
Router.route('/users');
Router.route('/APILogs');
Router.route('/generation');
Router.route('/securityRules');
Router.route('/QMC');

