import '/imports/ui/useCases/useCaseSelection';
import './slideSelectionSheet.html';


Template.slideSelectionSheet.onRendered(function() {
	Session.set('iframeTemplate', 'slideFrameWait');
    console.log("onRendered slideSelectionSheet");
});

Template.slideSelectionSheet.helpers({
    active: function() {
      return Session.get('iframeTemplate');
    }
});

Template.slideSelectionSheet.events({
    'click .ui.positive.button': function(event, template) {
        event.preventDefault();
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

export async function renderIframe() {
	console.log("renderIframe");
	Session.set('iframeTemplate', 'slideFrame');
}