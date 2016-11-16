import '/imports/ui/useCases/useCaseSelection.html';
import './SSBI/SSBI.js';



Template.useCaseSelection.events({

})


Template.useCaseSelection.onRendered(function() {
    this.$('.special.cards .image').dimmer({
        on: 'hover'
    });
})
