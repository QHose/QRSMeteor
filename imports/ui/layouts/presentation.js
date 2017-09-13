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

/**
 * detect IE
 * returns version of IE or false, if browser is not Internet Explorer
 */
export function isIEorEDGE() {
    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    var edge = ua.indexOf('Edge/');
    if (edge > 0) {
        // Edge (IE 12+) => return version number
        return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }

    // other browser
    return false;
}

function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? true : false;
}

export function unsupportedBrowser() {
    // console.log('unsupported browser?', isIEorEDGE() || isMobile());
    return isIEorEDGE() || isMobile();
}