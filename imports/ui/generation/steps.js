import './steps.html';
import { currentStep } from '/imports/ui/UIHelpers'

Template.steps.helpers({
    stepStatus(stepNr) {
        if (currentStep() === stepNr) {
            if (stepNr === 4 && Session.get('currentUser')) {
                return 'completed';
            } else {
                return 'active'
            }

        } else if (stepNr < currentStep()) {
            return 'completed';
        } else {
            return '';
        }
    }
})


Template.steps.onRendered(function() {
    this.$('.step')
        .popup({
            title: 'Demo steps',
            content: "This demo simulates your SaaS platform's admin console. In order to finish the demo, you must complete these 4 steps. If you just started we already selected some dummy customers and a an app. In step 3 we will give each of your customers a private copy of this app. In step 4 you can test Qlik Sense embedded with some users.",
            delay: {
                show: 500,
                hide: 0
            }
        });
})
