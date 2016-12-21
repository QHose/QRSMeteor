import './steps.html';
import { currentStep } from '/imports/ui/UIHelpers'

Template.steps.helpers({
    stepStatus(stepNr) {
        if(currentStep() === 0 && stepNr === 1){
            return 'active'
        }
        else if (currentStep() === stepNr ) {
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
            content: "If you just started, you can insert some fictitious customers and an app. In Step 3, we will give your customers a private copy of this app.  In Step 4, you can test...",
            delay: {
                show: 500,
                hide: 0
            }
        });
})
