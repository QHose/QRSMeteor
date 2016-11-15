import '/imports/ui/useCases/useCaseSelection.html';


Template.useCaseSelection.events({

})


Template.useCaseSelection.onRendered(function() {
    this.$('.special.cards .image').dimmer({
        on: 'hover'
    });
})
