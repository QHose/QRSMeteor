import {
    Template
} from 'meteor/templating';
import {
    Customers,
    dummyCustomers
} from '/imports/api/customers';
import {
    Session
} from 'meteor/session';
import {
    senseConfig
} from '/imports/api/config';
import '/imports/ui/UIHelpers';
import _ from 'meteor/underscore';
import {
    insertTemplateAndDummyCustomers
} from '/imports/ui/generation/OEMPartnerSide/OEMPartner';

import './SSBI.html';

var server, QMCUrl, hubUrl, sheetUrl, appUrl = '';

Template.SSBISenseApp.helpers({
    show() {
        // console.log('SSBISenseApp helper, show iframe?: ', showIFrame());
        return Session.get('currentUser') && !Session.equals('loadingIndicator', 'loading') ? 'Yes' : null;
    }
});




Template.SSBIUsers.onCreated(function () {
    Session.set('loadingIndicator', '');
    Session.set('currentUser', null);
    server = senseConfig.host + ':' + senseConfig.port + '/' + Meteor.settings.public.slideGenerator.virtualProxy;

    if (Meteor.settings.public.useSSL) {
        server = 'https://' + server;
    } else {
        server = 'http://' + server;
    }
    // console.log('server', server)
    QMCUrl = server + '/qmc';
    hubUrl = server + '/hub';
    sheetUrl = server + '/sense/app/' + Session.get('SSBIAppId');
    // console.log('sheetUrl', sheetUrl)
    appUrl = server + "/sense/app/" + Session.get('SSBIAppId') + "/sheet/" + Meteor.settings.public.SSBI.sheetId + "/state/analysis";
    // console.log('SSBIApp URL', appUrl);

})

Template.SSBISenseIFrame.onRendered(function () {
    this.$('.IFrameSense')
        .transition('slide in right');
})

Template.SSBISenseIFrame.helpers({
    appURL() {
        // console.log('SSBISenseIFrame helper: de app url is: ', Session.get('appUrl'));
        return Session.get('IFrameUrl');
    }
});

Template.senseButtons.onRendered(function() {

    this.$('.senseButtons')
        .transition('scale in');
})


Template.SSBISenseIFrame.events({
'click .selfservice '() {
        $('.ui.modal.SSBI')
            .modal('show')
            .modal('refresh')
            .modal('refresh');
    },
})

Template.SSBIUsers.onRendered(function () {
    this.$('.ui.accordion')
        .accordion();

        this.$('.SSBIUsers')
        .transition('scale in');
})

Template.SSBIUsers.helpers({
    currentUser() {
        if (Session.get('currentUser')) {
            return '(' + Session.get('currentUser') + ' currently logged in)';
        }
    },
    user() {
        return Session.get('currentUser');
    },
    showSenseButtons() {
        return Session.get('currentUser') && !Session.equals('loadingIndicator', 'loading') ? 'Yes' : null;
    }
})



Template.SSBIUsers.events({
    'click .consumer'() {
        var passport = {
            'UserDirectory': Meteor.userId(),
            'UserId': 'John',
            'Attributes': [{
                'group': 'CONSUMER'
            },
            {
                'group': 'GERMANY'
            },
            ],
        };
        login(passport);
    },
    'click .contributor'() {
        var passport = {
            'UserDirectory': Meteor.userId(),
            'UserId': 'Linda',
            'Attributes': [{
                'group': 'CONTRIBUTOR'
            },
            {
                'group': 'UNITED STATES'
            },
            ],
        };
        login(passport)
    },
    'click .developer'() {
        var passport = {
            'UserDirectory': Meteor.userId(),
            'UserId': 'Martin',
            'Attributes': [{
                'group': 'DEVELOPER'
            }],
        };
        login(passport);
    },
    'click .admin'(e, t) {
        var passport = {
            'UserDirectory': Meteor.userId(),
            'UserId': 'Paul',
            'Attributes': [{
                'group': 'ADMIN'
            },
            {
                'group': 'ITALY'
            },
            ],
        };
        login(passport);
    },
    'click .hub '() {
        Session.set('IFrameUrl', hubUrl);
    },
    'click .sheet '() {
        Session.set('IFrameUrl', sheetUrl);
    },
    'click .app '() {
        Session.set('IFrameUrl', appUrl);
    },
    'click .QMC '() {
        Session.set('IFrameUrl', QMCUrl);
    }
});

Template.SSBIUsers.onCreated(function () {
    Session.set('appUrl', appUrl);
})



Template.userCards.onRendered(function () {
    this.$('.dimmable.image').dimmer({
        on: 'hover'
    });
    this.$('.column')
        .transition('scale in');

    this.$("#flyoutnavkbfixed").focus();

    !function () {
        var w = window,
            d = w.document;

        if (w.onfocusin === undefined) {
            d.addEventListener('focus', addPolyfill, true);
            d.addEventListener('blur', addPolyfill, true);
            d.addEventListener('focusin', removePolyfill, true);
            d.addEventListener('focusout', removePolyfill, true);
        }
        function addPolyfill(e) {
            var type = e.type === 'focus' ? 'focusin' : 'focusout';
            var event = new CustomEvent(type, { bubbles: true, cancelable: false });
            event.c1Generated = true;
            e.target.dispatchEvent(event);
        }
        function removePolyfill(e) {
            if (!e.c1Generated) { // focus after focusin, so chrome will the first time trigger tow times focusin
                d.removeEventListener('focus', addPolyfill, true);
                d.removeEventListener('blur', addPolyfill, true);
                d.removeEventListener('focusin', removePolyfill, true);
                d.removeEventListener('focusout', removePolyfill, true);
            }
            setTimeout(function () {
                d.removeEventListener('focusin', removePolyfill, true);
                d.removeEventListener('focusout', removePolyfill, true);
            });
        }
    }();

    function hasClass(el, className) {
        if (el.classList) {
            return el.classList.contains(className);
        } else {
            return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
        }
    }

    var menuItems1 = document.querySelectorAll('#flyoutnavkbfixed li.has-submenu');
    var timer1, timer2;

    Array.prototype.forEach.call(menuItems1, function (el, i) {
        el.addEventListener("mouseover", function (event) {
            this.className = "has-submenu open";
            clearTimeout(timer1);
        });
        el.addEventListener("mouseout", function (event) {
            timer1 = setTimeout(function (event) {
                var opennav = document.querySelector("#flyoutnavkbfixed .has-submenu.open");
                opennav.className = "has-submenu";
                opennav.querySelector('a').setAttribute('aria-expanded', "false");
            }, 1000);
        });
        el.querySelector('a').addEventListener("click", function (event) {
            if (this.parentNode.className == "has-submenu") {
                this.parentNode.className = "has-submenu open";
                this.setAttribute('aria-expanded', "true");
            } else {
                this.parentNode.className = "has-submenu";
                this.setAttribute('aria-expanded', "false");
            }
            event.preventDefault();
        });
        var links = el.querySelectorAll('a');
        Array.prototype.forEach.call(links, function (el, i) {
            el.addEventListener("focus", function () {
                if (timer2) {
                    clearTimeout(timer2);
                    timer2 = null;
                }
            });
            el.addEventListener("blur", function (event) {
                timer2 = setTimeout(function () {
                    var opennav = document.querySelector("#flyoutnavkbfixed .has-submenu.open")
                    if (opennav) {
                        opennav.className = "has-submenu";
                        opennav.querySelector('a').setAttribute('aria-expanded', "false");
                    }
                }, 10);
            });
        });
    });
})

Template.senseButtons.onRendered(function () {
    this.$('.SenseIframe')
        .transition('swing up');

    !function () {
        var w = window,
            d = w.document;

        if (w.onfocusin === undefined) {
            d.addEventListener('focus', addPolyfill, true);
            d.addEventListener('blur', addPolyfill, true);
            d.addEventListener('focusin', removePolyfill, true);
            d.addEventListener('focusout', removePolyfill, true);
        }
        function addPolyfill(e) {
            var type = e.type === 'focus' ? 'focusin' : 'focusout';
            var event = new CustomEvent(type, { bubbles: true, cancelable: false });
            event.c1Generated = true;
            e.target.dispatchEvent(event);
        }
        function removePolyfill(e) {
            if (!e.c1Generated) { // focus after focusin, so chrome will the first time trigger tow times focusin
                d.removeEventListener('focus', addPolyfill, true);
                d.removeEventListener('blur', addPolyfill, true);
                d.removeEventListener('focusin', removePolyfill, true);
                d.removeEventListener('focusout', removePolyfill, true);
            }
            setTimeout(function () {
                d.removeEventListener('focusin', removePolyfill, true);
                d.removeEventListener('focusout', removePolyfill, true);
            });
        }
    }();

    function hasClass(el, className) {
        if (el.classList) {
            return el.classList.contains(className);
        } else {
            return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
        }
    }

    var menuItems1 = document.querySelectorAll('#flyoutnavkbfixed li.has-submenu');
    var timer1, timer2;

    Array.prototype.forEach.call(menuItems1, function (el, i) {
        el.addEventListener("mouseover", function (event) {
            this.className = "has-submenu open";
            clearTimeout(timer1);
        });
        el.addEventListener("mouseout", function (event) {
            timer1 = setTimeout(function (event) {
                var opennav = document.querySelector("#flyoutnavkbfixed .has-submenu.open");
                opennav.className = "has-submenu";
                opennav.querySelector('a').setAttribute('aria-expanded', "false");
            }, 1000);
        });
        el.querySelector('a').addEventListener("click", function (event) {
            if (this.parentNode.className == "has-submenu") {
                this.parentNode.className = "has-submenu open";
                this.setAttribute('aria-expanded', "true");
            } else {
                this.parentNode.className = "has-submenu";
                this.setAttribute('aria-expanded', "false");
            }
            event.preventDefault();
        });
        var links = el.querySelectorAll('a');
        Array.prototype.forEach.call(links, function (el, i) {
            el.addEventListener("focus", function () {
                if (timer2) {
                    clearTimeout(timer2);
                    timer2 = null;
                }
            });
            el.addEventListener("blur", function (event) {
                timer2 = setTimeout(function () {
                    var opennav = document.querySelector("#flyoutnavkbfixed .has-submenu.open")
                    if (opennav) {
                        opennav.className = "has-submenu";
                        opennav.querySelector('a').setAttribute('aria-expanded', "false");
                    }
                }, 10);
            });
        });
    });
})

async function login(passport) {
    try {
        //logout the current user in the browser via a server side call
        // var currentUser = getCurrentUserLoggedInSense()
        // console.log('currentUser', currentUser)
        Meteor.call('logoutPresentationUser', Meteor.userId(), Session.get('currentUser'));

        Session.set('currentUser', passport.UserId);
        //update the user collection for the saas provisioning demo, to keep in sync... 
        var URLtoOpen = Session.get('appUrl');
        var ticket = await Meteor.callPromise('requestTicketWithPassport', Meteor.settings.public.slideGenerator.virtualProxy, passport);
        console.log('------------------------------------');
        console.log('requesting requestTicketWithPassport at virtual proxy: ' + Meteor.settings.public.slideGenerator.virtualProxy + ' with passport: ' + JSON.stringify(passport));
        console.log('------------------------------------');
        URLtoOpen += '?QlikTicket=' + ticket;
        console.log('login: the url to open is: ', URLtoOpen);

        // getCurrentUserLoggedInSense();
        // sAlert.success(passport.UserId + ' is now logged in into Qlik Sense');
        Session.set('IFrameUrl', URLtoOpen);
        // $('.SSBI .image.' + passport.UserId).css('background', '#62AC1E');
    } catch (err) {
        console.error(err);
        sAlert.error('Login error', err.message);
    }
};


async function getCurrentUserLoggedInSense() {
    try {
        const RESTCALL = 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + Meteor.settings.public.slideGenerator.virtualProxy + '/qps/user';
        console.log('REST call to logout the user: ', RESTCALL)
        var result = await HTTP.getPromise(RESTCALL)
        console.log('current user in Sense', result);
    } catch (err) {
        console.error(err);
        sAlert.Error('Failed to get the user via the personal API', err.message);
    }
}