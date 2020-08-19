import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { senseConfig as config } from '/imports/api/config.js';

import './simulateUserLogin.html';

Template.simulateUserLogin.helpers({
    currentUser() {
        return Session.get('currentUser');
    }
})


Template.simulateUserLogin.events({
    'click .selectRole a'(event, template) {
        var currentUser =  event.currentTarget.id;
        Session.set('currentUser', currentUser);
        // console.log('click event: user made a selection in the simulateUserLogin box, for user: ' + currentUser + ' with Meteor.userId():' + Meteor.userId());
        try {
            Meteor.call('simulateUserLogin', currentUser);
        } catch (err) {
            sAlert.error(err.message);
        }
        template.$( ".has-submenu.open" ).removeClass( "open" )
    }
});


Template.simulateUserLogin.onRendered(function () {
    console.log('user from session: ', Session.get('currentUser'))
    this.$('.ui.dropdown').dropdown({ 'set selected': 'A' });
    this.$('.ui.dropdown').dropdown('refresh');

    this.$('.message')
        .transition('scale in');
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
});
