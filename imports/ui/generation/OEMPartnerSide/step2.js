import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { senseConfig } from '/imports/api/config.js';
import { Apps, TemplateApps, GeneratedResources } from '/imports/api/apps.js'
import { Customers, dummyCustomers } from '/imports/api/customers.js';
import { Streams } from '/imports/api/streams.js'
import { APILogs } from '/imports/api/APILogs';
import './step2.html';

Template.step2.helpers({
    appsInTemplateStream() {
        return Apps.find({ "stream.name": Meteor.settings.public.TemplateAppStreamName });
    },
})

Template.step2.onRendered(function() {
    const templateAppsHandle = Meteor.subscribe('templateApps', { //http://stackoverflow.com/questions/28621132/meteor-subscribe-callback
        onReady: function() {

        },
        onError: function() { console.log("onError", arguments); }
    });
})

Template.templateCheckBox.helpers({
    checked() {
        var selectedTemplates = TemplateApps.find().fetch();
        var templateSelected = _.some(selectedTemplates, ['id', this.id]);
        return templateSelected ? 'checked' : '';
    },
})

Template.templateCheckBox.events({
    'change .checkbox.template' (event, template) {
        var currentApp = this;
        var selector = {
            'generationUserId': Meteor.userId(),
            'id': currentApp.id
        };

        if (event.target.checked) {
            Meteor.call('upsertTemplate', selector, currentApp);

        } else {
            Meteor.call('removeTemplate', selector, currentApp);
        }
    }
})

Template.templateOverview.helpers({
    templateApps() {
        return TemplateApps.find();
    },
    NrTemplates() {
        return TemplateApps.find()
            .count();
    },
})

Template.templateOverview.events({
    'click .removeTemplateApp' () {
        TemplateApps.remove(this._id);
    },

})

Template.templateOverview.onRendered(function() {
    this.$('.ui.accordion')
        .accordion();
})