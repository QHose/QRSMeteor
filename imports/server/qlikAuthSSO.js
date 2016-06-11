import { Meteor } from 'meteor/meteor';
import qlikauth from 'qlik-auth';
import { senseConfig, engineConfig, certs, authHeaders } from '/imports/api/config.js';


Picker.route( '/sso', function( params, request, response, next ) {
  console.log("Meteor's authentication module qlikAuthSSO.js receiced the forwarded request from Qlik Sense proxy. Meteor will now look which user is currently logged in, and request a ticket for this ID, and add his group memberships");
  console.log(request);

  	//Define user directory, user identity and attributes
      var profile = {
        'UserDirectory': 'QLIK', 
        'UserId': 'rikard',
        'Attributes': [{'Group': 'Shell'}]
      }
     
     var options = {
       'Certificate': senseConfig.cert, //'C:/Users/Qlik/Meteor projects/qlikauth-meteor/node_modules/qlik-auth/client.pfx',
       'PassPhrase': ''
     }
      //Make call for ticket request
      qlikauth.requestTicket(request, response, profile, options);
});