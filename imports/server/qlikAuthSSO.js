import { Meteor } from 'meteor/meteor';
import qlikauth from 'qlik-auth';
import { Apps, TemplateApps } from '/imports/api/apps.js'
import { Customers, dummyCustomers } from '../api/customers.js';
import { Streams } from '/imports/api/streams.js'
import { senseConfig, engineConfig, certs, authHeaders } from '/imports/api/config.js';


Picker.route('/sso', function(params, request, response, next) {
    console.log("Meteor's authentication module qlikAuthSSO.js receiced the forwarded request from Qlik Sense proxy. Meteor will now look which user is currently logged in, and request a ticket for this ID, and add his group memberships");
    // console.log(request);

    // var user = Customers.findOne({'users.currentlyLoggedIn':true}).users[0];
    console.log('the simulated login received from the database: '); //, user);

    //Define user directory, user identity and attributes
    var profile = {
        'UserDirectory': senseConfig.host, //'2008ENT',
        'UserId':  'john', //Session.get('currentUser'),
        'Attributes': [{ 'group': 'Shell' }]
    }
    console.log('Request ticket for this profile: ', profile);
    var options = {
            'Certificate': senseConfig.cert, //'C:/Users/Qlik/Meteor projects/qlikauth-meteor/node_modules/qlik-auth/client.pfx',
            'PassPhrase': ''
        }
        //Make call for ticket request
    qlikauth.requestTicket(request, response, profile, options);
});
