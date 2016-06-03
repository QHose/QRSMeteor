import { Template } from 'meteor/templating';
import { Customers, dummyCustomers } from '../api/customers.js';
import { Session } from 'meteor/session';
import { config } from '/imports/api/clientConfig.js';
// import * from '/lib/globalHelpers.js';

import './body.html';
import { Apps, TemplateApps } from '/imports/api/apps.js'
import { Streams } from '/imports/api/streams.js'
import './customer.js';
import moment from 'moment';
import lodash from 'lodash';

_ = lodash;

Template.body.helpers({
    customers() {
        return Customers.find({}, { sort: { checked: -1 } });
    },
    // apps(){
    //   //return Session.get('qApps'); 
    //   return Apps.find();
    // },
    templateApps() {
        return TemplateApps.find();
    },
    countStreams() {
        return Streams.find()
            .count();
    },
    countApps() {
        return Apps.find()
            .count();
    },
    formatDate(date) {
        return moment(date)
            .format('DD-MM-YYYY');
    },
    appSettings: function() {
        return {
            collection: Apps,
            rowsPerPage: 20,
            showFilter: true,
            showColumnToggles: true,
            // fields: ['customer', 'telephone', 'email', 'status', 'itemCount', 'deliveryDate', 'remarks'],
            fields: [
                { key: 'qDocName', label: 'App' }, {
                    key: 'qDocId',
                    label: 'Guid',
                    fn: function(value) {
                        // return new Spacebars.SafeString('<a href=http://'+config.host+'/'+config.virtualProxy+'/sense/app/'+value+'>'+value+'</a>');
                        return new Spacebars.SafeString('<a href=http://' + config.host + '/sense/app/' + value + ' target="_blank">' + value + '</a>');
                    }
                },
                { key: 'qMeta.description', label: 'description', hidden: true }, {
                    key: 'qMeta.modifiedDate',
                    label: 'ModifiedDate',
                    hidden: true,
                    fn: function(value) {
                        return moment(value)
                            .format('DD-MM-YYYY');
                    }
                }, {
                    key: 'qMeta.stream.name',
                    label: 'Stream',
                    fn: function(value, object) {
                        return value;
                    }
                },
                { key: 'qMeta.published', label: 'Published', hidden: true }, {
                    key: 'qLastReloadTime',
                    label: 'Last reload',
                    hidden: true,
                    fn: function(value) {
                        return moment(value)
                            .format('DD-MM-YYYY');
                    }
                },
                // { key: 'qConnectedUsers', label: 'ConnectedUsers' },
                {
                    key: 'qMeta.qFileSize',
                    label: 'File size',
                    hidden: true,
                    fn: function(value) {
                        return value / 1000000
                    }
                }, {
                    key: 'copyApp',
                    label: 'Copy app',
                    fn: function() {
                        return new Spacebars.SafeString('<i class="copy icon"></i>')
                    }
                }, {
                    key: 'deleteApp',
                    label: 'Delete app',
                    fn: function() {
                        return new Spacebars.SafeString('<i class="remove circle icon"></i>')
                    }
                }, {
                    key: 'markAsTemplate',
                    label: 'Template app for generation?',
                    fn: function() {
                        return new Spacebars.SafeString('<i class="add circle icon"></i>')
                    }
                },
                // { key: 'update', label: 'Bekijk bestelling', fn: function(){return 'Bekijk'} }, // { key: 'update', label: 'Ga naar bestelling', fn: function (value) {
                //  return new Spacebars.SafeString("<a href="+Router.route['bestelling'].path({_id:value})+">details</a>");
                // }}
            ]
        };
    }, //app settings
    streamSettings: function() {
        return {
            collection: Streams,
            rowsPerPage: 20,
            showFilter: true,
            showColumnToggles: true,
            fields: [
                { key: 'name', label: 'Stream' },
                // { key: 'id', label: 'Guid' }, 
                {
                    key: 'id',
                    label: 'Guid',
                    fn: function(value) {
                        return new Spacebars.SafeString('<a href=http://' + config.host + '/hub/stream/' + value + ' target="_blank">' + value + '</a>');
                    }
                }, {
                    key: 'createdDate',
                    label: 'Created date',
                    fn: function(value, object) {
                        return moment(value)
                            .format('DD-MM-YYYY');
                    }
                }, {
                    key: 'deleteStream',
                    label: 'Delete',
                    fn: function() {
                        return new Spacebars.SafeString('<i class="remove circle icon"></i>')
                    }
                },
            ]
        };
    }
});

Template.body.events({
    'submit .new-customer' (event) {
        // Prevent default browser form submit
        event.preventDefault();
        // Get value from form element
        const target = event.target;
        const customerName = target.text.value;
        // Insert a task into the collection
        Customers.insert({
            name: customerName,
            createdAt: new Date(), // current time
        });
        // Clear form
        target.text.value = '';
    },
    'click .generateStreamAndApp' () {
        console.log('click event generateStreamAndApp');

        var selectedCustomers = Customers.find({ checked: true })
            .fetch();
        // console.log('get customers from database, and pass them to the generateStreamAndApp method', selectedCustomers);

        Meteor.call('generateStreamAndApp', selectedCustomers, function(err, result) {
            if (err) {
                sAlert.error(err);
                console.log(err);
            } else {
                console.log('generateStreamAndApp succes', result);
                sAlert.success('Streams and apps created, and apps have been published into the stream of the customer ');
                updateSenseInfo();
            }
        });
    },
    //   //DELETE APP
    //   'click .reactive-table tbody tr .deleteApp'(){    
    // // checks if the actual clicked element has the class `delete`
    // if (event.target.className == "deleteApp") {
    //   console.log('delte app clicked',this);
    // }
    // },
    'click .reactive-table tbody tr': function(event) {
            var currentApp = this;
            // console.log(event);

            if (event.target.className == "markAsTemplate") {
                console.log('markAsTemplate app clicked: ' + currentApp.qDocName);
                TemplateApps.upsert(currentApp._id, {
                    $set: {
                        name: currentApp.qDocName,
                        guid: currentApp.qDocId,
                        checked: !this.checked
                    },
                });
            }

            //Copy APP
            if (event.target.className === "copyApp") {
                console.log('Copy app clicked: ' + currentApp.qDocName);

                Meteor.call('copyAppSelectedCustomers', currentApp); //contains QVF guid of the current iteration over the apps    
                sAlert.success("QVF '" + currentApp.qDocName + " copied in the QMC");
                updateSenseInfo();

            }


            //DELETE APP
            if (event.target.className === "deleteApp") {
                console.log('delete app clicked: ' + currentApp.qDocName);
                Meteor.call('deleteApp', this.qDocId, (error, result) => {
                        if (error) {
                            sAlert.error(error);
                            console.log(error);
                        } else {
                            console.log('app removed');
                            sAlert.success("APP " + currentApp.qDocName + " deleted in the QMC");
                            updateSenseInfo();

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
                            sAlert.success('Stream: ' + currentStream.name + " deleted in the QMC");
                            updateSenseInfo();
                        }
                    }) //method call 
            } //delete stream event target

        } //'click .reactive-table tbody tr
        ,
    'click .removeTemplateApp' () {
        TemplateApps.remove(this._id);
    },
    'click .insertDummyCustomers' () {
        _.each(dummyCustomers, function(customer) {
            Customers.insert(customer);
            console.log("Inserted " + customer.name);
        })
    },
    'click .deleteAllCustomers' () {
        console.log('delete all dummyCustomers clicked');
        Meteor.call('removeAllCustomers');
    },
    'click .toggleAllCustomers' () {
        console.log('deSelect all dummyCustomers clicked');

        _.each(Customers.find({})
            .fetch(),
            function(customer) {
                Customers.update(customer._id, {
                    $set: { checked: !customer.checked },
                });
            })
    }
}); //end Meteor events

export var updateSenseInfo = function updateSenseInfo() {
    Meteor.setTimeout(() => {
        updateSenseInfo2()
    }, 8000)
};

var updateSenseInfo2 = function updateSenseInfo2() {

    // Meteor.call('updateAppsCollection', function(error, docList){
    Meteor.call('getApps', function(error, docList) {
        if (error) {
            throw new Meteor.Error('Unable to get the apps from Qlik Sense', error.message);
            console.error(error);
        } else {
            console.log('Sense changed, so we called meteor.method to update the information we have about APPS');
            // Delete all existing apps from database
            Apps.find()
                .forEach(function(app) {
                    Apps.remove(app._id);
                });

            //insert all docs into the database
            docList.forEach(function(doc) {
                Apps.insert(doc);
            })
        }
    });

    Meteor.call('getStreams', function(error, streams) {
        if (error) {
            throw new Meteor.Error('Unable to get the streams from Qlik Sense', error.message);
        } else {
            console.log('new streams received from Sense, so update the local mongoDB information we have about Streams');

            // Delete all existing streams from database
            Streams.find()
                .forEach(function(stream) {
                    Streams.remove(stream._id);
                });

            //insert all docs into the database
            streams.forEach(function(stream) {
                // console.log(stream);
                Streams.insert(stream);
            })
        }
    });

};

Template.body.onCreated(function() {
    console.log('template created, so load the current info from Sense using the QRS API WITHOUT DELAY');
    updateSenseInfo2();

})

Template.body.onRendered(function() {
    this.$(".dropdown")
        .dropdown();
});
