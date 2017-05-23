import { Template } from 'meteor/templating';
import { Customers, dummyCustomers } from '/imports/api/customers';
import { Session } from 'meteor/session';
import { senseConfig as config } from '/imports/api/config';
import '/imports/ui/UIHelpers';


import './generation.html';
import './steps.js';

import { Apps, TemplateApps, GeneratedResources } from '/imports/api/apps';
import { APILogs } from '/imports/api/APILogs';
import { Streams } from '/imports/api/streams';
import './customer';
import './OEMPartnerSide/OEMPartner';
import moment from 'moment';

Template.generationApps.helpers({
    countApps() {
        return Apps.find()
            .count();
    },
    appSettings: function() {
        console.log('client generation helper: get app table, the config used to generate the URLs to Sense: ', config);
        return {
            collection: Apps,
            rowsPerPage: 5,
            showFilter: true,
            showColumnToggles: true,
            // fields: ['customer', 'telephone', 'email', 'status', 'itemCount', 'deliveryDate', 'remarks'],

            fields: [{
                    key: 'name',
                    label: 'App',
                    fn: function(value, object, key) {
                        if (Session.get('currentStep') === 4 && Session.get('currentUser')) {
                            return new Spacebars.SafeString('<a href=http://' + config.host + ':' + config.port + '/' + config.virtualProxyClientUsage + '/sense/app/' + object.id + ' target="_blank">' + value + '</a>');
                        } else {
                            return object.name
                        }
                    }
                }, {
                    key: 'id',
                    label: 'Guid',
                    hidden: true,
                    fn: function(value) {
                        return new Spacebars.SafeString('<a href=http://' + config.host + ':' + config.port + '/' + config.virtualProxyClientUsage + '/sense/app/' + value + ' target="_blank">' + value + '</a>');
                    }
                },
                { key: 'description', label: 'description', hidden: true }, {
                    key: 'modifiedDate',
                    label: 'ModifiedDate',
                    hidden: true,
                    fn: function(value) {
                        return moment(value)
                            .format('DD-MM-YYYY');
                    }
                }, {
                    key: 'stream.name',
                    label: 'Stream',
                    sortOrder: 1,
                    fn: function(value, object) {
                        return value;
                    }
                }, {
                    key: 'published',
                    label: 'Published',
                    hidden: true
                }, {
                    key: 'lastReloadTime',
                    label: 'Last reload',
                    hidden: true,
                    fn: function(value) {
                        return moment(value)
                            .format('MMMM Do YYYY, h:mm:ss a');
                    }
                }, {
                    key: 'fileSize',
                    label: 'File size',
                    hidden: true,
                    fn: function(value) {
                        return value / 1000000
                    }
                },
                //  {
                //     key: 'copyApp',
                //     label: 'Copy app selected customers',
                //     hidden: true,
                //     fn: function() {
                //         return new Spacebars.SafeString('<i class="copy icon"></i>')
                //     }
                // }, 
                // {
                //     key: 'deleteApp',
                //     label: 'Delete app',
                //     hidden: true,
                //     fn: function() {
                //         return new Spacebars.SafeString('<i class="remove circle icon"></i>')
                //     }
                // }, 
                // {
                //     key: 'markAsTemplate',
                //     label: 'Template app for generation?',
                //     fn: function() {
                //         return new Spacebars.SafeString('<i class="add circle icon"></i>')
                //     }
                // }
            ]
        };
    },
})

Template.generationStreams.helpers({
    countStreams() {
        return Streams.find()
            .count();
    },
    streamSettings: function() {
        return {
            collection: Streams,
            rowsPerPage: 5,
            showFilter: true,
            showColumnToggles: true,
            fields: [{
                    key: 'name',
                    label: 'Stream',
                    fn: function(value, object, key) {
                        if (Session.get('currentStep') === 4 && Session.get('currentUser')) {
                            return new Spacebars.SafeString('<a href=http://' + config.host + ':' + config.port + '/' + config.virtualProxyClientUsage + '/hub/stream/' + object.id + ' target="_blank">' + value + '</a>');
                        } else {
                            return object.name
                        }
                    }
                },
                // { key: 'id', label: 'Guid' }, 
                {
                    key: 'id',
                    label: 'Guid',
                    hidden: true
                }, {
                    key: 'createdDate',
                    label: 'Created date',
                    hidden: true,
                    fn: function(value, object) {
                        return moment(value)
                            .format('DD-MM-YYYY');
                    }
                }, 
                // {
                //     key: 'deleteStream',
                //     label: 'Delete',
                //     hidden: true,
                //     fn: function() {
                //         return new Spacebars.SafeString('<i class="remove circle icon markAsTemplate"></i>')
                //     }
                // },
            ]
        };
    }
})

Template.generation.events({
    'click .reactive-table tbody tr': function(event) {
            var currentApp = this;
            console.log(event);

            // if (event.target.className == "markAsTemplate") {
            //     console.log('markAsTemplate app clicked: ' + currentApp.name);
            //     TemplateApps.upsert(currentApp._id, {
            //         $set: {
            //             name: currentApp.name,
            //             id: currentApp.id,
            //             generationUserId: Meteor.userId(),
            //             checked: !this.checked
            //         },
            //     });
            // }

            //Copy APP
            if (event.target.className === "copyApp") {
                console.log('Copy app clicked: ' + currentApp.name);

                Meteor.call('copyAppSelectedCustomers', currentApp, (error, result) => { //contains QVF guid of the current iteration over the apps  
                        if (error) {
                            sAlert.error(error);
                        } else {
                            sAlert.success("QVF '" + currentApp.name + " copied in Qlik Sense via the QRS API for each of the selected customers");
                        }
                    }) //method call 
            }

            //DELETE APP
            if (event.target.className === "deleteApp") {
                console.log('delete app clicked: ' + currentApp.name);
                Meteor.call('deleteApp', this.id, (error, result) => {
                        if (error) {
                            sAlert.error(error);
                            console.log(error);
                        } else {
                            console.log('app removed');
                            sAlert.success("APP " + currentApp.name + " deleted in Qlik Sense via the QRS API");
                        }
                    }) //method call 
            } //end if delete button is clicked 

            //DELETE Stream
            if (event.target.className == "deleteStream") {
                var currentStream = this;
                console.log('delete stream clicked: ' + currentStream.name);
                Meteor.call('deleteStream', this.id, (error, result) => {
                        if (error) {
                            sAlert.error(error);
                            console.log(error);
                        } else {
                            console.log('Stream removed');
                            sAlert.success('Stream: ' + currentStream.name + " deleted in Qlik Sense via the QRS API");
                        }
                    }) //method call 
            } //delete stream event target

        } //'click .reactive-table tbody tr        
}); //end Meteor events

export var updateSenseInfo = function() {
    Meteor.call('updateLocalSenseCopy');
};

//this code gets executed if the page has been loaded, so a good moment to Connect to Sense a get the most recent apps and streams
Template.generation.onRendered(function() {
    if (!Session.get('currentStep')) {
        Session.set('currentStep', 1);
    }
    updateSenseInfo();

    console.log('generated onRendered: Check if we have a connection to Sense?');
    // $('.dimmer')
    //     .dimmer('show');
    Meteor.call('getStreams', (error, result) => {
        if (error) {
            console.error(error);
            Session.set('NoSenseConnection', true);
            sAlert.error("We can't connect to Qlik Sense, is your Sense VM running, all services started?, virtual proxy 'hdr' configured? Did you export the certificates and referred to them in the settings-XYZ.json in your project root? Also check the host/port (Qlik Sense) settings. Make sure you check the problem solving chapters in the installation manual (documentation-generic tab).");
        } else {
            var message = "Connected to Qlik Sense via the REST and websocket APIs. We registered a QRS notification event to ensure this MeteorJs platform automatically updates when Qlik Sense changes.";
            console.log(message);
            // sAlert.success(message);
            Session.set('NoSenseConnection', false);
        }
    });

})

Template.QlikSense.onRendered(function() {
    this.$('.ui.accordion')
        .accordion();
})


Template.generation.onCreated(function() {
    // this.subscribe('streams');
    // this.subscribe('customers');

    var self = this;
    self.autorun(function() {
        self.subscribe('generatedResources', function() {
            // console.log('generatedResources changed, so update the apps subscription');
            Tracker.autorun(function() {
                const generatedAppsFromUser = GeneratedResources.find()
                    .map(function(resource) {
                        return resource.appId;
                    });
                // console.log('onCreated generatedResources are: ', generatedAppsFromUser);
                //now get all the apps from Qlik Sense, but filter them so that only the apps are show which the current user has generated
                Meteor.subscribe('apps', generatedAppsFromUser);
            })

            //do the same but now for the streams
            Tracker.autorun(function() {
                const generatedStreamsFromUser = GeneratedResources.find()
                    .map(function(resource) {
                        return resource.streamId;
                    })
                Meteor.subscribe('streams', generatedStreamsFromUser);
            });
        })
    })
})

Template.generationStreams.onRendered(function() {
    this.$('.title')
        .popup({
            title: 'Streams',
            content: 'Via the QRS API we obtained the list of streams. Streams are a way to group apps that share a common purpose. In our case we give each customer its own stream.',
            delay: {
                show: 1500,
                hide: 0
            }
        });
})

Template.generationApps.onRendered(function() {
    this.$('.title')
        .popup({
            title: 'Apps',
            content: 'Via the QRS API we obtained the list of apps (dashboards). The app is at the core of Qlik Sense. An app is loaded with data, and the visualizations the app contains allow your customers to explore the data.',
            delay: {
                show: 1500,
                hide: 0
            }
        });
})
