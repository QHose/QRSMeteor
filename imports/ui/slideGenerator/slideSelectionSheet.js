import './slideSelectionSheet.html';

Template.slideSelectionSheet.onRendered(function() {
   console.log("here");
});


Template.slideSelectionSheet.events({
    'click .ui.positive.button': function(event, template) {
        event.preventDefault();
        console.log("click");
        $('.reveal').css({
			top: '0px'
		});

		$('html').css({
			overflow: 'hidden'
		});
		$('body').css({
			overflow: 'hidden'
		});
    }
});