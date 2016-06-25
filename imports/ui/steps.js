import { Template } from 'meteor/templating';
import { Customers } from '../api/customers.js';
import { TemplateApps } from '../api/apps.js';
import './steps.html';

Template.steps.helpers({
    completedStep2() {
        var status = Customers.find()
            .count() ? 'completed' : 'active';
        return status
    },
    completedStep3() {
        var status = TemplateApps.find()
            .count() ? 'completed' : 'active';
        return status
    },
    completedStep1() {
        var status = TemplateApps.find()
            .count() ? 'completed' : 'active';
        return status
    }
});
