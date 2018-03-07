import '/imports/ui/useCases/useCaseSelection';
import './slideSelectionSheet.html';

const Cookies = require('js-cookie');

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

        var user = JSON.parse(Cookies.get('user'));
        var logData = {
            currentSelectionId: Session.get('currentSelectionId'),
            qlikID: user.qlikID,
            accountid: user.accountid,
            email: user.email
        };
        Meteor.call('s3Logger', "startpresentation", logData);
    }
});

export async function renderIframe() {
    console.log("renderIframe");
    Session.set('iframeTemplate', 'slideFrame');
}

