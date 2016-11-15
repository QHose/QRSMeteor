import './step4.html';

Template.step4.onRendered(function() {
    this.$('.ui.accordion')
        .accordion();

    this.$('.step4')
        .transition('scale in');
})