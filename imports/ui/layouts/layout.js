import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { senseConfig as config } from '/imports/api/config';

import './layout.html';
import './presentation.html';
import './presentation';
import '../checkConfig.html';
import '/imports/ui/nav.html';
import '/imports/ui/nav.js';
// import './pages/modals.html';

const webIntegrationDemo = 'http://' + Meteor.settings.public.webIntegrationHost + ':' + Meteor.settings.public.webIntegrationDemoPort;

Template.layout.helpers({
    NoSenseConnection() {
        return Session.get('NoSenseConnection');
    }
});

Template.impressFooter.helpers({
    nav() {
        let nav = {
            'Developer': {
                previous: {
                    text: 'PREVIOUS: Self Service',
                    link: `/selfService`
                },
                next: {
                    text: 'NEXT: Deep Dive Qlik APIs',
                    link: '/documentation'
                }
            },
            'Hosting Ops Professional': {
                previous: {
                    text: 'PREVIOUS: Home',
                    link: '/'
                },
                next: {
                    text: 'NEXT: Resources',
                    link: '/documentation?tab=video'
                }
            },
            'CTO': {
                previous: {
                    text: 'PREVIOUS: Self Service',
                    link: `/selfService`
                },
                next: {
                    text: 'NEXT: Resources',
                    link: '/documentation?tab=video'
                }
            }
        }
        if (
            localStorage.userRole === 'Developer' ||
            localStorage.userRole === 'Hosting Ops Professional' ||
            localStorage.userRole === 'CTO'
        ) {
            return nav[localStorage.userRole];
        } else {
            return false;
        }
    }
});

Template.SSBIFooter.helpers({
    nav() {
        let nav = {
            'Developer': {
                previous: {
                    text: 'PREVIOUS: Embed Qlik Sense',
                    link: `${webIntegrationDemo}`
                },
                next: {
                    text: 'NEXT: SAAS Provisioning',
                    link: '/impress'
                }
            },
            'Product Owner': {
                previous: {
                    text: 'PREVIOUS: Embed Qlik Sense',
                    link: `${webIntegrationDemo}`
                },
                next: {
                    text: 'NEXT: Resources',
                    link: '/documentation?tab=video'
                }
            },
            'Business Analyst': {
                previous: {
                    text: 'PREVIOUS: Home',
                    link: '/'
                },
                next: {
                    text: 'NEXT: Resources',
                    link: '/documentation?tab=video'
                }
            },
            'CTO': {
                previous: {
                    text: 'PREVIOUS: Embed Qlik Sense',
                    link: `${webIntegrationDemo}`
                },
                next: {
                    text: 'NEXT: SAAS Provisioning',
                    link: '/impress'
                }
            },
            'C-Level executive, non-technical': {
                previous: {
                    text: 'PREVIOUS: Embed Qlik Sense',
                    link: `${webIntegrationDemo}`
                },
                next: {
                    text: 'EXIT APP Head out to OEM.QLIK.COM',
                    link: 'http://oem.qlik.com'
                }
            },
        }
        if (
            localStorage.userRole === 'Developer' ||
            localStorage.userRole === 'Product Owner' ||
            localStorage.userRole === 'Business Analyst' ||
            localStorage.userRole === 'CTO' ||
            localStorage.userRole === 'C-Level executive, non-technical'
        ) {
            return nav[localStorage.userRole];
        } else {
            return false;
        }
    }
});

Template.documentationFooter.helpers({
    nav() {
        let nav = {
            'Developer': {
                previous: {
                    text: 'PREVIOUS: Deep Dive Qlik APIs',
                    link: '/documentation'
                },
                next: {
                    text: 'EXIT APP Head out to OEM.QLIK.COM',
                    link: 'http://oem.qlik.com'
                }
            },
            'Product Owner': {
                previous: {
                    text: 'PREVIOUS: Self Service',
                    link: `/selfService`
                },
                next: {
                    text: 'EXIT APP Head out to OEM.QLIK.COM',
                    link: 'http://oem.qlik.com'
                }
            },
            'Hosting Ops Professional': {
                previous: {
                    text: 'PREVIOUS: SAAS Provisioning',
                    link: '/impress'
                },
                next: {
                    text: 'EXIT APP Head out to OEM.QLIK.COM',
                    link: 'http://oem.qlik.com'
                }
            },
            'Business Analyst': {
                previous: {
                    text: 'PREVIOUS: Self Service',
                    link: `/selfService`
                },
                next: {
                    text: 'EXIT APP Head out to OEM.QLIK.COM',
                    link: 'http://oem.qlik.com'
                }
            },
            'CTO': {
                previous: {
                    text: 'PREVIOUS: SAAS Provisioning',
                    link: '/impress'
                },
                next: {
                    text: 'EXIT APP Head out to OEM.QLIK.COM',
                    link: 'http://oem.qlik.com'
                }
            }
        }
        if (
            localStorage.userRole === 'Developer' ||
            localStorage.userRole === 'Product Owner' ||
            localStorage.userRole === 'Hosting Ops Professional' ||
            localStorage.userRole === 'Business Analyst' ||
            localStorage.userRole === 'CTO'
        ) {
            return nav[localStorage.userRole];
        } else {
            return false;
        }
    }
});

Template.loginDimmer.onRendered(function() {
    Template.instance().$('.dimmer')
        .dimmer('show');
});

Template.modalSaaSautomation.onRendered(function() {
    this.$('.ui.embed').embed();
});


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

Template.layout.events({
    'keydown, click': function(event, template) {
        Template.instance().$('*').popup('remove popup')
    },
    'click .stepByStep' () {
        $('.ui.modal.stepByStep')
            .modal('show')
            .modal('refresh')
            .modal('refresh');
    },
    'click .howDoesSaaSAutomationWork' () {
        $('.ui.modal.howDoesSaaSAutomationWork')
            .modal('show')
            .modal('refresh')
            .modal('refresh');
    },
    'click .selfservice' () {
        $('.ui.modal.SSBI')
            .modal('show')
            .modal('refresh')
            .modal('refresh');
    },
    'click .APIAutomation' () {
        $('.ui.modal.APIAutomation')
            .modal('show')
            .modal('refresh')
            .modal('refresh');
    },
})

Template.layout.onCreated(function() {
    //see https://guide.meteor.com/data-loading.html
    this.subscribe('streams');
    this.subscribe('customers');

    const templateAppsHandle = Meteor.subscribe('templateApps');
    const apiLogsHandle = Meteor.subscribe('apiLogs');
    const customersHandle = Meteor.subscribe('customers', { //http://stackoverflow.com/questions/28621132/meteor-subscribe-callback
        onReady: function() {
            // if (freshEnvironment()) {
            //     console.log('There is a freshEnvironment');
            //     insertTemplateAndDummyCustomers()
            //     Session.setAuth('currentStep', 3);
            // };
        },
        onError: function() { console.log("onError", arguments); }
    });
});