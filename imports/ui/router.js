Router.configure({
  layoutTemplate : 'layout',
  loadingTemplate: 'loading',
  notFoundTemplate: 'notFound'
});

Router.route('/', function () {
  this.render('homeAbout');
});


//IFrame integration routes
Router.route('/hub');
Router.route('/app');
Router.route('/dashboard');
Router.route('/1chart');
Router.route('/multipleCharts');

//DIV tag integration routes

Router.route('/divSheet');
Router.route('/multipleDivs');
Router.route('/multipleDivsAndCustomControls');

//generic routes
Router.route('/appList');
Router.route('/QRS.pathList');


// Router.route('/orders', {
//   name : "orders",  
//   waitOn: function() {
//     return Meteor.subscribe('orders');
//   }
// }),

// Router.route('/ordersByPickUpDay');

// Router.route("/addProduct", {
//   name : "addProduct"  
// });

// Router.route('editProduct', {
//   path: '/editProduct/:_id',
//   data: function() { return ProductList.findOne(this.params._id); }
// }),




