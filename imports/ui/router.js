

Router.configure({
  layoutTemplate : 'layout',
  // loadingTemplate: 'loading',
  notFoundTemplate: 'notFound'
});

Router.route('/', function () {
  this.render('generation');
});

Router.route('/SSOClient', function(){
	console.log('router: the request is: '+ req);
	var req = this.request;
	console.log(this);

});
Router.route('/users');
Router.route('/homeAbout');
Router.route('/APILogs');
Router.route('/introduction');
Router.route('/generation');
Router.route('/securityRules');
Router.route('/QMC');

