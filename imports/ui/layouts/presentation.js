Template.presentationLayout.onRendered(function() {
    var landingPageAlreadySeen = Session.get('landingPageAlreadySeen');
    // console.log('ppt_integrationMain onRendered. landingPageAlreadySeen:', Session.get('landingPageAlreadySeen'));
    if (landingPageAlreadySeen) {
    } else { // console.log('user has NOT already seen the landing page, so route him to this page to select a workshop expertise level.');
        Router.go('presentation'); //GO TO THE SLIDE landing page first
    }
});

Template.presentationLayout.onDestroyed(function() {
    var landingPageAlreadySeen = Session.get('landingPageAlreadySeen');
    // console.log('user left the slide generator, make sure he gets the landing page next time');
    // console.log('ppt_integrationMain onDestroyed. landingPageAlreadySeen:', landingPageAlreadySeen);
    Session.set('landingPageAlreadySeen', false);
});

Template.presentationLayout.helpers({
    showPresentation() {
        // console.log('show the IFRAME');
        return Session.get('showPresentation'); //&& Session.get('clickedInSelection');
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
        $('.ui.sidebar')
            .sidebar('toggle');
        Session.set('showPresentation', true);
    },
    // 'mouseover .sidebar.integration': function(event) {
    //     Session.set('showPresentation', false);
    // },
    // 'mouseout .sidebar.integration': function(event) {
    //     Session.set('showPresentation', true);
    // }
})
