import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

Template.userOverview.helpers({
    users() {
    	var users = Meteor.users.find().fetch();
    	if(users){
    		// console.log('users received: ', users);
    		return users
    	}
    },
    userTableSettings: function() {
        return {
            rowsPerPage: 100,
            responsive: true,
            autoWidth: true,
            showFilter: true,
            showColumnToggles: false,
            fields: ['username', 
            {key:'emails.0.address',
            label: 'email'}
            , 'profile.name']
            // fields: [{
            //     key: 'name',
            //     label: 'name',
            //     sortOrder: 1,
            //     sortDirection: 'descending'
            // }, 'rule', 'resourceFilter', 'comment'],
        };
    },

})

Template.layout.onCreated(function() {
    //see https://guide.meteor.com/data-loading.html
    this.subscribe('users');
})
