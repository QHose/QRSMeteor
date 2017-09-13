import '/imports/ui/useCases/useCaseSelection.html';
// import { getQlikSenseSessionForGroup } from '/imports/ui/impress/landingPage';
import './SSBI/SSBI.js';
import {
    Session
} from 'meteor/session';
import {
    senseConfig
} from '/imports/api/config.js';
const Cookies = require('js-cookie');
var possibleRoles = ['Developer', 'Product Owner', 'Hosting Ops', 'Business Analyst', 'CTO', 'C-Level, non-technical'];

// ONRENDERED
Template.useCaseSelection.onRendered(function() {
    $('body').addClass('mainLandingImage');

    console.log('Cookies.get(\'currentMainRole\')', Cookies.get('currentMainRole'))
    $('.ui.dropdown')
        .dropdown({
            onChange(value, text, selItem) {
                Cookies.set('currentMainRole', value);
                console.log('currentMainRole', value);
            }
        })
    setTimeout(function() {
        $(".ui.dropdown").dropdown("refresh");
        $(".ui.dropdown").dropdown("set selected", Cookies.get('currentMainRole'));
    }, 1000)

    $.each(possibleRoles, function(i, item) {
        $('#bodyDropdown').append($('<option>', {
            value: item,
            text: item
        }));
    });

})


//ONDESTROYED
Template.useCaseSelection.onDestroyed(function() {
    $('body').removeClass('mainLandingImage');
});

//HELPERS
Template.useCaseSelection.helpers({
    userRole() {
        return Cookies.get('currentMainRole');
    }
});

export async function getQlikSenseSessionForGroup(group) {
    // console.log('Slide generator landing page: checking Qlik Sense access... is the user logged in using the QPS API OnAuthenticationInformation?');
    var userProperties = {
        group: group
    };

    var ticket = await Meteor.callPromise('getTicketNumber', userProperties);
    console.log('Requested ticket from Qlik Sense server, so client can login without redirects...', ticket)

    const enigmaConfig = {
        schema: qixschema,
        appId: senseConfig.slideGeneratorAppId,
        session: { //https://github.com/qlik-oss/enigma.js/blob/master/docs/qix/configuration.md#example-using-nodejs
            host: senseConfig.host,
            prefix: Meteor.settings.public.slideGenerator.virtualProxy,
            port: senseConfig.port,
            unsecure: true,
            urlParams: {
                qlikTicket: ticket
            }
        },
        listeners: {
            'notification:*': (event, data) => console.log('Engima: event ' + event, 'Engima: data ' + data),
        },
        handleLog: (message) => console.log('Engima: ' + message),
        //http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-Msgs-Proxy-Clients-OnAuthenticationInformation.htm
        // listeners: {
        //     'notification:OnAuthenticationInformation': (authInfo) => {
        //         // console.log('authInfo', authInfo)
        //         if (authInfo.mustAuthenticate) {
        //             location.href = authInfo.loginUri;
        //         }
        //     },
        // }
    };

    console.log('We connect to Qlik Sense using enigma config', enigmaConfig)

    enigma.getService('qix', enigmaConfig)
        .then(qix => {
            console.log('user is authenticated in Qlik Sense. QIX object:', qix);
            Session.set('userLoggedInSense', true);
            // logoutCurrentSenseUserClientSide(); //gives error 500

        }).catch((error) => {
            console.info('info: No QIX connection for user, user not yet able to connect to the app via the enigma.js: ', error);
        });

}