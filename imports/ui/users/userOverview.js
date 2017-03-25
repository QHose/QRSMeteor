import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

Template.userOverview.helpers({
            users() {
                var users = Meteor.users.find().fetch();
                if (users) {
                    console.log('users received: ', users);
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
                        { key: 'emails.0.address', label: 'Email' },
                        { key: 'services.google.email', label: 'GMail adress' },
                        { key: 'profile.name', label: 'Gmail name' },
                        { key: 'services.google.locale', label: 'Country locale' }, {
                            key: 'services.google.picture',
                            label: 'Image',
                            fn: function(value, object, key) {
                                return value ? new Spacebars.SafeString('<img class="ui tiny image" src="' + value + '">'):'';
                                }

                            },
                        ]
                        // fields: [{
                        //     key: 'name',
                        //     label: 'name',
                        //     sortOrder: 1,
                        //     sortDirection: 'descending'
                        // }, 'rule', 'resourceFilter', 'comment'],
                    };
                }
            })

        Template.layout.onCreated(function() {
            //see https://guide.meteor.com/data-loading.html
            Meteor.subscribe("users");
        })
