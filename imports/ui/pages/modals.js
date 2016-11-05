import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

Template.modals.events({
    'click .stepByStep' () {
        $('.ui.modal.stepByStep')
            .modal('show');
    },
    'click .howDoesSaaSAutomationWork' () {
        $('.ui.modal.howDoesSaaSAutomationWork')
            .modal('show');
    }
})