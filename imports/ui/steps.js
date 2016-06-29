import { Template } from 'meteor/templating';
import { Customers } from '../api/customers.js';
import { TemplateApps } from '../api/apps.js';
import './steps.html';

Template.steps.helpers({
    completedStep1() {
        var status = TemplateApps.find()
            .count() ? 'completed' : 'active';
        return status
    },
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
    completedStep4() {                
        //if generation is running or has run
        return (Session.equals('loadingIndicator', 'loading') || Session.get('generated?')) ? 'completed' : 'active';
    },
    completedStep5() {        
        return Session.get('generated?') ? 'completed' : 'active';
    },
});
