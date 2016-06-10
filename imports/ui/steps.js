import { Template } from 'meteor/templating';
import { Customers } from '../api/customers.js';
import { TemplateApps } from '../api/apps.js';
import './steps.html';

Template.steps.helpers({
    completedStep1() {
        return Customers.find().count() ? 'Completed':'';
    },
    completedStep2() {
        return TemplateApps.find()
            .count() ? 'Completed':'';
    }
});