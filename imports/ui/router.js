// var Cookies = require('js-cookie');

FlowRouter.route('/', {
    name: 'root',
    action() {
        BlazeLayout.render('App_body', { main: 'slides' });
    }
});
FlowRouter.route('/useCaseSelection', {
    name: 'root',
    action() {
        BlazeLayout.render('App_body', { main: 'slides' });
    }
});
