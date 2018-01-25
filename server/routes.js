// import { REST_Log } from '/imports/api/APILogs';

// Router.route('/updateSenseInfo/apps', function(request, response, next) {
//      // console.log('++++++++++++We got an incoming REST Call from the Sense Notification handler for APPS, this means the Sense Repository has changed');
//      //logging only
//      // var call = {};
//      // call.action = 'Notification apps'
//      // call.request = 'We got an incoming REST Call from the Sense Notification handler for APPS, this means the Sense Repository has changed';
//      // REST_Log(call);
//      Meteor.call('updateLocalSenseCopyApps');
//  }, { where: 'server' });

//  Router.route('/updateSenseInfo/streams', function(request, response, next) {
//      // console.log('++++++++++++We got an incoming REST Call from the Sense Notification handler for STREAMS, this means the Sense Repository has changed');
//      //logging only
//      // var call = {};
//      // call.action = 'Notification streams'
//      // call.request = 'We got an incoming REST Call from the Sense Notification handler for APPS, this means the Sense Repository has changed';
//      // REST_Log(call);
//      Meteor.call('updateLocalSenseCopyStreams');
//  }, { where: 'server' });