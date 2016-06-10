import { Template } from 'meteor/templating';

import './layout.html';

Template.layout.helpers({
    senseConnection() {
        const instance = Template.instance();
        console.log('Layout helper: the value senseConnection:', Session.get('senseConnection')); 
        // return instance.connection.get();
        return Session.get('senseConnection');
    }
});