

Router.configure({
  layoutTemplate : 'layout',
  // loadingTemplate: 'loading',
  notFoundTemplate: 'notFound'
});

Router.route('/', function () {
  this.render('generation');
});

Router.route('/users');
Router.route('/generation');
Router.route('/securityRules');
Router.route('/QMC');

