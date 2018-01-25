Template.slidegeneratorSlidesMain.onRendered(function() {
    var landingPageAlreadySeen = Session.get('landingPageAlreadySeen');
    // console.log('slidegeneratorSlidesMain onRendered. landingPageAlreadySeen:', Session.get('landingPageAlreadySeen'));
    if (landingPageAlreadySeen) {} else { // console.log('user has NOT already seen the landing page, so route him to this page to select a workshop expertise level.');
        FlowRouter.go('presentation'); //GO TO THE SLIDE landing page first
    }
});