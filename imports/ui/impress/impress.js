import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { senseConfig as config } from '/imports/api/config';
import '/imports/ui/UIHelpers';

import 'impress';
import './impress.html';
import './impress.css';

var api = {};

Template.impress.onCreated(function() {})

Template.impress.onRendered(function() {
    impressInitialized = Session.get('impressInitialized');
    if (!impressInitialized) {
        console.log('impress was NOT yet initialized');
        impress().init();
        Session.set('impressInitialized', true);
    } else {
        console.log('impress was ALREADY initialized');
        location.reload();
    }

    Template.instance()
        .$('.ui.embed')
        .embed();

    Meteor.setTimeout(function() {
        this.$('.slide.one')
            .popup({
                title: 'Start the presentation',
                content: 'Press right on your keyboard'
            })
    }, 2000)

    $(window).on('keydown, click', function(e) {
        $('.slide').popup('remove popup');
    });
})

Template.impress.events({
    'click, keydown': function(event, template) {
        console.log('key down', event);
    },
})

Template.impress.onDestroyed(function() {
    console.log('impress onDestroyed');
    $('body').attr('style', 'height: 100%;');
})
