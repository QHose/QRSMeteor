import { Template } from 'meteor/templating';
import { Customers, dummyCustomers } from '../api/customers';
import { Session } from 'meteor/session';
import { config } from '/imports/api/clientConfig';
// import '/imports/ui/UIHelpers';


import './body.html';
import { Apps, TemplateApps } from '/imports/api/apps'
import { Streams } from '/imports/api/streams'
import './customer';
import './OEMPartner';
import moment from 'moment';
import lodash from 'lodash';

_ = lodash;

Template.body.helpers({
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
            rowsPerPage: 10,
            showFilter: true,
            showColumnToggles: true,
            // fields: ['customer', 'telephone', 'email', 'status', 'itemCount', 'deliveryDate', 'remarks'],
            fields: [
                { key: 'name', label: 'App' }, {
                    key: 'id',
                    label: 'Guid',
                    fn: function(value) {
                        // return new Spacebars.SafeString('<a href=http://'+config.host+'/'+config.virtualProxy+'/sense/app/'+value+'>'+value+'</a>');
                        return new Spacebars.SafeString('<a href=http://' + config.host + '/sense/app/' + value + ' target="_blank">' + value + '</a>');
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
                    fn: function(value, object) {
                        return value;
                    }
                },
                { key: 'published', label: 'Published', hidden: true }, {
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
                    key: 'fileSize  ',
                    label: 'File size',
                    hidden: true,
                    fn: function(value) {
                        return value / 1000000
                    }
                }, {
                    key: 'copyApp',
                    label: 'Copy app selected customers',
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
            rowsPerPage: 10,
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
                sAlert.success("QVF '" + currentApp.qDocName + " copied in the QMC for each of the selected customers");
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
}); //end Meteor events

export var updateSenseInfo = function updateSenseInfo() {
    Meteor.setTimeout(() => {
        updateSenseInfo2()
    }, 3000)
};

var updateSenseInfo2 = function updateSenseInfo2() {
    Meteor.call('updateAppsCollection');
};

Template.body.onCreated(function() {
    console.log('template created, so load the current info from Sense using the QRS API WITHOUT DELAY');
    updateSenseInfo2();

})
