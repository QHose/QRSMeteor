Template.presentationLayout.onDestroyed(function() {
    var landingPageAlreadySeen = Session.get('landingPageAlreadySeen');
    // console.log('user left the slide generator, make sure he gets the landing page next time');
    // console.log('slidegeneratorSlidesMain onDestroyed. landingPageAlreadySeen:', landingPageAlreadySeen);
    Session.set('landingPageAlreadySeen', false);
});

Template.presentationLayout.helpers({
    showPresentation() {
        // console.log('show the IFRAME');
        return Session.get('showPresentation'); //&& Session.get('clickedInSelection');
    },
    userSelectionMade() {
        return Session.get('groupForPresentation'); //if the user selected a presentation type try to login
    },
    unsupportedBrowser() {
        return unsupportedBrowser();
    }
})


Template.presentationLayout.events({
    'click .launch': function(event) {
        console.log('button launch nav clicked');
        $('.ui.sidebar')
            .sidebar('toggle');
    },
    'click .button createSlides': function(event) {
        console.log('button createSlides clicked');
        Session.set('showPresentation', true);
    }
})