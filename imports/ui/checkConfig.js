import './checkConfig.html';

Template.checkConfig.onCreated(function() {
  const instance = this;
  instance.connection = new ReactiveVar();
  console.log('UI HELPER: Check if we have a connection to Sense?');
  Meteor.call('getStreams', (error, result) => {
    if (error) {      
      console.error(error);
      instance.connection.set(false);
      Session.set('senseConnection', false);
      sAlert.error("We can't connect to Qlik Sense, is sense running, virtual proxy configured?");
    } else {
      console.log('OK: This tool can connect to Qlik Sense, we tested the HTTP REST CALL by getting the applist');
      sAlert.info('We are connected to Qlik Sense via HTTP REST Calls')
      instance.connection.set(true);
      Session.set('senseConnection', true);
    }
  });
});