import {
    Meteor
} from 'meteor/meteor';
import './methods.js';
import {
    http
} from 'meteor/meteor';
import {
    Apps,
    TemplateApps,
    GeneratedResources
} from '/imports/api/apps';
import { SenseSelections } from '/imports/api/logger';
import {
    APILogs,
    REST_Log
} from '/imports/api/APILogs';

//import meteor collections
import {
    Streams
} from '/imports/api/streams';
import {
    Customers
} from '/imports/api/customers';

import * as QSApp from '/imports/api/server/QRSFunctionsApp';
import * as QSStream from '/imports/api/server/QRSFunctionsStream';
import * as QSLic from '/imports/api/server/QRSFunctionsLicense';
import * as QSProxy from '/imports/api/server/QPSFunctions';
import * as QSSystem from '/imports/api/server/QRSFunctionsSystemRules';
import * as QSExtensions from '/imports/api/server/QRSFunctionsExtension';
import * as QSCustomProps from '/imports/api/server/QRSFunctionsCustomProperties';

var logger = require("onepresales-es-logger")("SlideExplorer");

//stop on unhandled errors
process.on('unhandledRejection', up => {
    throw up
})

//import config for Qlik Sense QRS and Engine API.
import {
    senseConfig,
    authHeaders
} from '/imports/api/config';
import '/imports/startup/accounts-config.js';
const path = require('path');
var fs = require('fs-extra');

//
// ─── METEOR METHODS ─────────────────────────────────────────────────────────────
//


Meteor.methods({
    getSenseSelectionObject(id) {
        console.log('------------------------------------');
        console.log('getSenseSelectionObject for id', id)
        console.log('------------------------------------');
        check(id, String);
        var result = SenseSelections.findOne({
            _id: id
        });
        console.log('result of get selection by id', result)
        return result;
    },
    getAppIDs() {
        return {
            SSBI: senseConfig.SSBIApp, // QSApp.getApps(Meteor.settings.public.SSBI.name, Meteor.settings.public.SSBI.stream)[0].id,
            slideGenerator: senseConfig.slideGeneratorAppId //QSApp.getApps(Meteor.settings.public.slideGenerator.name, Meteor.settings.public.slideGenerator.stream)[0].id
        };
    },
    async generateStreamAndApp(customers) {
        try {
            check(customers, Array);
        } catch (error) {
            throw new Meteor.Error('Missing field', 'No customers supplied for the generation of apps.');
        }
        // first clean the environment
        Meteor.call('removeGeneratedResources', {
            'generationUserId': Meteor.userId()
        });
        await QSApp.generateStreamAndApp(customers, this.userId); //then, create the new stuff

        try {
            if (!Meteor.settings.broker.qlikSense.multiTenantScenario) { //on premise installation for a single tenant (e.g. with MS Active Directory)
                var customerNames = customers.map(function(c) {
                    return c.name;
                });
                QSCustomProps.upsertCustomPropertyByName('customer', customerNames); //for non OEM scenarios (with MS AD), people like to use custom properties for authorization instead of the groups via a ticket.
            }
        } catch (error) {
            console.log('error to create custom properties', error);
        }

        Meteor.call('updateLocalSenseCopy');
    },
    resetEnvironment() {
        Meteor.call('resetLoggedInUser'); //logout all users before removing all the current customers. This to prevent the screen stays logged in at an old user.
        Meteor.call('removeGeneratedResources', {
            'generationUserId': Meteor.userId()
        });
        TemplateApps.remove({
            'generationUserId': Meteor.userId()
        });
        Customers.remove({
            'generationUserId': Meteor.userId()
        });
        APILogs.remove({
            'generationUserId': Meteor.userId()
        });
        if (!Meteor.settings.broker.qlikSense.multiTenantScenario) { //on premise installation for a single tenant (e.g. with MS Active Directory)
            QSCustomProps.deleteCustomProperty('customers');
        }
    },
    upsertTemplate(selector, currentApp) {
        console.log('user ' + Meteor.userId() + ' selected a template app: ' + currentApp.name)
        TemplateApps.upsert(selector, {
            $set: {
                name: currentApp.name,
                id: currentApp.id,
                generationUserId: Meteor.userId(),
            },
        });
    },
    removeTemplate(selector, currentApp) {
        console.log('remove template')
        TemplateApps.remove(selector);
    },
    removeGeneratedResources(generationUserSelection) {
        //console.log('remove GeneratedResources method, before we make new ones');
        //logging only
        if (generationUserSelection) {
            const call = {};
            call.action = 'Remove generated resources';
            call.request = 'Remove all apps and streams in Qlik Sense for userId: ' + generationUserSelection.generationUserId;
            REST_Log(call, generationUserSelection);
        }
        GeneratedResources.find(generationUserSelection)
            .forEach(function(resource) {
                // this.unblock()
                //console.log('resetEnvironment for userId', Meteor.userId());generationUserSelection.generationUserId

                //If not selection was given, we want to reset the whole environment, so also delete the streams.
                // if (!generationUserSelection.generationUserId) {
                try {
                    Meteor.call('deleteStream', resource.streamId); //added random company names, so this should not be an issue //26-9 can't delete stream, because each user creates a stream with the same name...
                } catch (err) {
                    //console.error('No issue, but you can manually remove this id from the generated database. We got one resource in the generated list, that has already been removed manually', resource);
                } //don't bother if generated resources do not exists, just continue
                // }
                //delete apps always
                try {
                    Meteor.call('deleteApp', resource.appId);
                } catch (err) {
                    //console.error('No issue, but you can manually remove this id from the generated database. We got one resource in the generated list, that has already been removed manually', resource);
                }
            })
        GeneratedResources.remove(generationUserSelection);
        APILogs.remove(generationUserSelection);
    },
    copyApp(guid, name) {
        check(guid, String);
        check(name, String);
        const id = QSApp.copyApp(guid, name);
        Meteor.call('updateLocalSenseCopy');
        return id;
    },
    copyAppSelectedCustomers(currentApp) { //the app the user clicked on
        if (!currentApp) {
            throw new Meteor.Error('No App selected to copy')
        };

        customers = Customers.find({
            'generationUserId': Meteor.userId(),
            checked: true
        }); //all selected customers
        if (!customers) {
            throw new Meteor.Error('No customers selected to copy the app for')
        };

        customers
            .forEach(customer => {
                const newAppId = Meteor.call('copyApp', currentApp.id, customer.name + '-' + currentApp.name);
                Meteor.call('updateLocalSenseCopy');

                //store in the database that the user generated something, so we can later on remove it.
                GeneratedResources.insert({
                    'generationUserId': Meteor.userId(),
                    'customer': null,
                    'streamId': null,
                    'appId': newAppId
                });
            });
    },
    deleteApp(guid) {
        check(guid, String);
        if (guid !== Meteor.settings.public.templateAppId) {
            //logging only
            const call = {};
            call.action = 'Delete app';
            call.request = 'Delete app: ' + guid;
            REST_Log(call);

            const id = QSApp.deleteApp(guid);
            Meteor.call('updateLocalSenseCopy');
            return id;
        } else {
            throw new Meteor.Error("you can't delete the template app with guid: ", guid);
        }
    },
    removeAllCustomers: function() {
        return Customers.remove({
            'generationUserId': Meteor.userId()
        });
    },
    s3Logger(message, data) {
        logger.info(message, data);
    }
})

Meteor.methods({
    updateLocalSenseCopyApps() {
        //delete the local content of the database before updating it
        Apps.remove({});

        //Update the Apps with fresh info from Sense
        _.each(QSApp.getApps(), app => {
            Apps.insert(app);
        });
    },
    updateLocalSenseCopyStreams() {
        //delete the local content of the database before updating it
        Streams.remove({});

        //Update the Streams with fresh info from Sense
        _.each(QSStream.getStreams(), stream => {
            Streams.insert(stream);
        });
    },
    updateLocalSenseCopy() {
        // //console.log('Method: update the local mongoDB with fresh data from Qlik Sense: call QRS API getStreams and getApps');
        //delete the local content of the database before updating it
        Apps.remove({});
        Streams.remove({});

        //Update the Apps and Streams with fresh info from Sense
        _.each(QSApp.getApps(), app => {
            Apps.insert(app);
        });

        _.each(QSStream.getStreams(), stream => {
            Streams.insert(stream);
        });
    },
    getSecurityRules() {
        return QSSystem.getSecurityRules();
    }
});