import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { senseConfig as config } from '/imports/api/config';
import '/imports/ui/UIHelpers';

// import 'impress';
import './impress.html';
import './integrationTopics.html';
import './integrationTopics.js';
import './integrationTopics.css';
import './impress.css';

var api = {};

Template.integrationTopics.onCreated(function() {
    document.addEventListener("impress:stepenter", function(event) {
        var data_type = $(".active").attr("data-type");
        if (data_type == 'portfolio') {
            $(".active .small").show();
            $(".active .large").hide();
        } else if (data_type == 'portfolio-gallery') {
            $(".small").hide();
            $(".large").show();
        }
    }, false);

})

Template.integrationTopics.onRendered(function() {
    impressInitialized = Session.get('impressInitialized');
    if (!impressInitialized) {
        console.log('impress was NOT yet initialized');
        api = impress();
        api.init();
        Session.set('impressInitialized', true);
    } else {
        console.log('impress was ALREADY initialized');
        location.reload();
    }

    Template.instance()
        .$('.ui.embed')
        .embed();
})

Template.impress.onDestroyed(function() {
    $('body').attr('style', 'height: 100%;');
})
