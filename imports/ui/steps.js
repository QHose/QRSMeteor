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


Template.steps.onRendered(function() {
    this.$('.step')
        .popup({
            title: 'Demo steps',
            content: 'This demo simulates the SaaS platform admin console of an OEM partner. In order to finish the demo, you must complete the following steps. If you just started we already selected some dummy customers and a an app. In step 3 we will give each of your customers a private copy of this app. In step 4 you can test Qlik Sense embedded with some users.',
            delay: {
                show: 500,
                hide: 0
            }
        });
})

