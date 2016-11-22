import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import '/imports/ui/UIHelpers';
import './login.html';
import './userOverview.html';
import './userOverview';


Template.signup.events({
  'submit form' ( event, template ) {
    event.preventDefault();
    
    let email    = template.find( "[name='emailAddress']" ).value,
        password = template.find( "[name='password']" ).value;
    
    Accounts.createUser( { email: email, password: password }, ( error ) => {
      if ( error ) {
        console.error( error.reason );
      }
    });
  }
});