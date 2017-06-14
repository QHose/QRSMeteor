Template.ppt_integrationMain.onRendered(function() {
    var landingPageAlreadySeen = Session.get('landingPageAlreadySeen');
    // console.log('ppt_integrationMain onRendered. landingPageAlreadySeen:', Session.get('landingPageAlreadySeen'));
    if (landingPageAlreadySeen) {
    } else { // console.log('user has NOT already seen the landing page, so route him to this page to select a workshop expertise level.');
        Router.go('presentation'); //GO TO THE SLIDE landing page first
    }
});
