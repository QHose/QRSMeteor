import {
    Meteor
} from 'meteor/meteor';
import {
    Customers,
    dummyCustomers,
    dummyCustomer
} from '/imports/api/customers';
import {
    REST_Log
} from '/imports/api/APILogs';
import {
    gitHubLinks
} from '/imports/ui/UIHelpers';
var fs = require('fs-extra');
const path = require('path');
var os = require('os');

//
// ─── IMPORT CONFIG FOR QLIK SENSE QRS ───────────────────────────────────────────
//


import {
    senseConfig,
    enigmaServerConfig,
    authHeaders,
    QRSconfig,
    qrsSrv as qliksrv,
    QRSCertConfig,
    configCerticates,
    validateJSON
} from '/imports/api/config.js';
import lodash from 'lodash';
_ = lodash;

//
// ─── CREATE VIRTUAL PROXIES ─────────────────────────────────────────────────────
//

// http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-Virtual-Proxy-Create.htm
export async function createVirtualProxies() {
    console.log('------------------------------------');
    console.log('CREATE VIRTUAL PROXIES');
    console.log('------------------------------------');
    var file = path.join(Meteor.settings.broker.automationBaseFolder, 'proxy', 'import', 'virtualProxySettings.json');
    try {
        // READ THE PROXY FILE 
        var proxySettings = await fs.readJson(file);
        try {
            validateJSON(proxySettings)
        } catch (err) {
            throw new Error('Cant read the virtual proxy definitions file: virtualProxySettings.json in your automation folder')
        }

        //FOR EACH PROXY FOUND IN THE INPUTFILE (vpToCreate), CREATE IT IN SENSE        
        for (var vpToCreate of proxySettings) {
            if (vpToCreate.websocketCrossOriginWhiteList) {
                vpToCreate.websocketCrossOriginWhiteList.push(Meteor.settings.public.host);
                vpToCreate.websocketCrossOriginWhiteList.push(os.hostname());
            }
            var existingProxies = getVirtualProxies();

            // CHECK IF VIRT. PROXY ALREADY EXISTS IN SENSE
            var found = existingProxies.some(function(existingVP) {
                return existingVP.prefix === vpToCreate.prefix;
            });
            if (!found) {
                var virtualProxy = createVirtualProxy(vpToCreate);
                // THE VIRTUAL PROXY HAS BEEN CREATED, NOW LINK IT TO THE CENTRAL PROXY
                linkVirtualProxyToProxy(virtualProxy);
            } else {
                console.log('Virtual proxy ' + vpToCreate.prefix + ' already existed. We do not update existing ones.');
            }
        }
    } catch (err) {
        console.error(err)
        throw new Error('unable to create virtual proxies', err);
    }


    function createVirtualProxy(virtualProxy) {

        // get id of local node so we can link the virtual proxy to a load balancing node 
        virtualProxy.loadBalancingServerNodes = [{
            id: getServerNodeConfiguration().id
        }];
        try {
            check(virtualProxy, Object);
            console.log('------CREATE VIRTUAL PROXY: ', virtualProxy.prefix);

            var request = qliksrv + '/qrs/virtualproxyconfig/';
            response = HTTP.call('POST', request, {
                params: {
                    xrfkey: senseConfig.xrfkey
                },
                'npmRequestOptions': configCerticates,
                data: virtualProxy
            });
            return response.data;
        } catch (err) {
            console.error('create virtual proxy failed', err);
        }
        // }
    }
}

// http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-Virtual-Proxy-Link.htm 
function linkVirtualProxyToProxy(virtualProxy) {
    // console.log('linkVirtualProxyToProxy', virtualProxy.id);

    // GET ID OF PROXY ON THIS HOST
    var proxyId = getProxyId();
    // GET THE CONFIG OF THE PROXY (WHICH CONTAINS VIRTUAL PROXIES)
    var proxyConfig = getProxyServiceConfiguration(proxyId)
        // ADD THE NEW VIRTUAL PROXY TO THE EXISTING PROXY LIST
    proxyConfig.settings.virtualProxies.push(virtualProxy)
        //OVERWRITE THE SETTINGS WITH THE COMPLETE UPDATED OBJECT, IN PRODUCTION MAKE SURE YOU ADD THE CHANGEDATE (SEE HELP)
    updateProxy(proxyId, proxyConfig)
}

function updateProxy(proxyId, proxyConfig) {
    try {
        check(proxyId, String);
        check(proxyConfig, Object);
        // console.log('proxyConfig', proxyConfig.settings.virtualProxies)

        var request = qliksrv + '/qrs/proxyservice/' + proxyId;
        response = HTTP.call('PUT', request, {
            params: {
                xrfkey: senseConfig.xrfkey
            },
            'npmRequestOptions': configCerticates,
            data: proxyConfig
        });
    } catch (err) {
        console.error('create virtual proxy failed', err);
    }
}

function getProxyId() {
    try {
        var request = qliksrv + '/qrs/proxyservice/?xrfkey=' + senseConfig.xrfkey;
        response = HTTP.call('GET', request, {
            'npmRequestOptions': configCerticates,
        });
        return response.data[0].id;
    } catch (err) {
        console.error('create virtual proxy failed', err);
    }
}

function getProxyServiceConfiguration(proxyId) {

    try {
        check(proxyId, String);

        var request = qliksrv + '/qrs/proxyservice/' + proxyId + '?xrfkey=' + senseConfig.xrfkey;
        response = HTTP.call('GET', request, {
            'npmRequestOptions': configCerticates,
        });
        return response.data;
    } catch (err) {
        console.error('create virtual proxy failed', err);
    }
}

export function getVirtualProxies() {
    // console.log('--------------------------GET VIRTUAL PROXIES');//
    try {
        var request = qliksrv + '/qrs/virtualproxyconfig/';
        response = HTTP.call('GET', request, {
            params: {
                xrfkey: senseConfig.xrfkey
            },
            npmRequestOptions: configCerticates,
        });

        var file = path.join(Meteor.settings.broker.automationBaseFolder, 'proxy', 'export', 'ExtractedvirtualProxyDefinitions.json');

        // SAVE PROXY FILE TO DISK
        fs.outputFile(file, JSON.stringify(response.data, null, 2), 'utf-8');
        return response.data;
    } catch (err) {
        console.error('create virtual proxy failed', err);
    }
}

// function getCentralProxy() {
//     console.log('getCentralProxy: GET /qrs/ServerNodeConfiguration?filter=isCentral')
// }


function getServerNodeConfiguration() {
    try {
        var request = qliksrv + '/qrs/servernodeconfiguration/local?xrfkey=' + senseConfig.xrfkey;
        response = HTTP.call('GET', request, {
            'npmRequestOptions': configCerticates,
        });
        return response.data;
    } catch (err) {
        console.error('create virtual proxy failed', err);
    }
}

//
// ─── METEOR METHODS ─────────────────────────────────────────────────────────────
//


Meteor.methods({
    currentlyLoggedInUser() {
        // console.log("Meteor will now look which user is currently logged in, and request a ticket for this ID, and add his group memberships.");
        var call = {};
        call.action = 'STEP 3: Server received request to create ticket';
        call.request = 'Meteor server received a incoming method call from the browser. The meteor server will now look which user is currently logged in, and create a ticket for this ID, and add his group memberships.';
        REST_Log(call, Meteor.userId());

        // first find the customers that have a logged in users (mongo returns a complete document)
        var customer = Customers.findOne({
            generationUserId: Meteor.userId(),
            'users.currentlyLoggedIn': true
        });
        // console.log('In our local database we can find the customer with the currentlyLoggedIn set to true for user: ' + loggedInUser + ', the customer which contains the user that the user selected with the dropdown: ', customer);

        // now we have the document, we can look in the array of users, to find the one that is logged in.
        var user;
        if (!customer) { // if no user is selected, just insert john as a dummy
            // const error = 'You have not selected a user you want to simulate the Single Sign on with. For demo purposes we now selected John for you. You can also select your own user in step 4 of the SaaS demo';
            var response = {};
            // console.log('dummyCustomer :', dummyCustomer);
            response.user = dummyCustomer.user;
            response.customer = dummyCustomer;
            // throw new Meteor.Warning('No user', error);
        } else {
            var user = _.find(customer.users, {
                'currentlyLoggedIn': true
            });
            var response = {};
            response.user = user;
            response.customer = customer;
        }
        // console.log('the response is: ', response);
        return response;
    },
    getRedirectUrl(proxyRestUri, targetId, loggedInUser) {
        var response = Meteor.call('currentlyLoggedInUser');
        var customer = response.customer;
        var user = response.user;

        // console.log('UserID currently logged in in the demo platform: ' + loggedInUser + '. Meteor server side thinks the meteor.userId is ' + Meteor.userId() + '. We use this as the UDC name');
        // Create a paspoort (ticket) request: user directory, user identity and attributes
        var passport = {
            'UserDirectory': Meteor.userId(), // Specify a dummy value to ensure userID's are unique E.g. "Dummy", or in my case, I use the logged in user, so each user who uses the demo can logout only his users, or the name of the customer domain if you need a Virtual proxy per customer
            'UserId': user.name, // the current user that we are going to login with
            'Attributes': [{
                    'group': customer.name.toUpperCase()
                }, // attributes supply the group membership from the source system to Qlik Sense
                {
                    'group': user.country.toUpperCase()
                },
                {
                    'group': user.group.toUpperCase()
                },
            ],
        };
        // console.log('Request ticket for this user passport": ', passport);

        // logging only
        var call = {};
        call.action = 'STEP 4: User and group information received from customer database, now we can request a ticket';
        call.url = gitHubLinks.createpassport;
        call.request = 'Request ticket for this user and his groups (an array of values which you can use in the security rules): ": ' + JSON.stringify(passport);
        REST_Log(call, Meteor.userId());

        return getRedirectURL(passport, proxyRestUri, targetId, Meteor.userId());
    },
    getTicketNumber(userProperties, virtualProxy) { // only get a ticket number for a SPECIFIC virtual proxy
        try {
            // check(userProperties.user, String);
            check(userProperties.group, String);
        } catch (err) {
            throw new Meteor.Error('Failed to login into Qlik Sense via a ticket', 'Please go to the landing page and select your group. We could not request a ticket because the userId or groups (technical, generic) are not provided');
        }
        var passport = {
            'UserDirectory': Meteor.userId(), // Specify a dummy value to ensure userID's are unique E.g. "Dummy", or in my case, I use the logged in user, so each user who uses the demo can logout only his users, or the name of the customer domain if you need a Virtual proxy per customer
            'UserId': Meteor.userId(), // the current user that we are going to login with
            'Attributes': [{
                    'group': 'slideGenerator'
                }, // attributes supply the group membership from the source system to Qlik Sense
                {
                    'group': userProperties.group
                },
                {
                    'group': 'ITALY'
                }, // make sure the row level demo works by passing this
            ],
        };
        console.log('getTicketNumber passport', passport)

        //@TODO add extra group memberships based on meteor.groups via allanning roles

        // http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-ProxyServiceAPI-Authentication-Ticket-Add.htm
        var proxyGetTicketURI = 'https://' + senseConfig.host + ':' + Meteor.settings.private.proxyPort + '/qps/' + virtualProxy + '/ticket'; // "proxyRestUri": "https://ip-172-31-22-22.eu-central-1.compute.internal:4243/qps/meteor/",
        try {
            var response = HTTP.call('POST', proxyGetTicketURI, {
                'npmRequestOptions': configCerticates,
                headers: authHeaders,
                params: {
                    'xrfkey': senseConfig.xrfkey
                },
                data: passport, // the user and group info for which we want to create a ticket
            });
        } catch (err) {
            console.error('REST call to request a ticket failed', err);
            throw new Meteor.Error('Request ticket failed', err.message);
        }

        // console.log('The HTTP REQUEST to Sense QPS API:', call.request);
        // console.log('The HTTP RESPONSE from Sense QPS API: ', call.response);
        return response.data.Ticket;
    },
    resetLoggedInUser() {
        // console.log("***Method resetLoggedInUsers");
        // console.log('call the QPS logout api, to invalidate the session cookie for each user in our local database');

        // reset the local database. set all users to not logged in. We need this code because we do a simulation of the login and not a real end user login.
        Customers.find({
                'generationUserId': Meteor.userId()
            })
            .forEach(function(customer) {
                var updatedUsers = _.map(customer.users, function(user) {
                    if (user) {
                        user.currentlyLoggedIn = false;
                    }

                    // and just logout everybody in the user list
                    logoutUser(Meteor.userId(), user.name);
                    return user;
                });

                Customers.update(customer._id, {
                    $set: {
                        users: updatedUsers
                    },
                });
            });
        // logoutUser(Meteor.userId(), Meteor.userId()); //logout the user for the slide generator
    },
    logoutPresentationUser(UDC, name) {
        console.log('logoutPresentationUser(UDC, name)', UDC, name);
        logoutUser(UDC, name, Meteor.settings.public.slideGenerator.virtualProxy);
    },
    simulateUserLogin(name) {
        check(name, String);
        Meteor.call('resetLoggedInUser');
        // console.log('*** Reset all logged in user done, now write in our local database the name for the current simulated user: generationUserId: ' + Meteor.userId() + ' & users.name:' + name);
        var query = [{
            'generationUserId': Meteor.userId(),
            'users.name': name
        }, {
            $set: {
                'users.$.currentlyLoggedIn': true,
            },
        }, ];

        Customers.update({
            'generationUserId': Meteor.userId(),
            'users.name': name
        }, {
            $set: {
                'users.$.currentlyLoggedIn': true,
            },
        }, {}, function(error, numberAffectedDocuments) {
            if (numberAffectedDocuments === 0) { // if nothing is updated, insert some dummy customers
                // console.log('simulateUserLogin numberAffectedDocuments: ', numberAffectedDocuments);
                // name does not yet exist in the customers created by the current demo user. So insert our dummy customers.numberAffectedDocuments
                insertDummyCustomers(Meteor.userId());
                Customers.update({
                    'generationUserId': Meteor.userId(),
                    'users.name': name
                }, {
                    $set: {
                        'users.$.currentlyLoggedIn': true,
                    },
                });
            }
        });
    },
});

Meteor.methods({
    'resetPasswordOrCreateUser' (user) {
        try {
            // console.log('reset the password of the user before logging him in');
            check(user.email, String);
            check(user.password, String);
        } catch (err) {
            throw new Meteor.Error('Missing Qlik.com user data',
                'The user misses important information from its Qlik.com account');
        }
        const userExists = Accounts.findUserByEmail(user.email);
        var userId = {};
        if (user.email === 'mbj@qlik.com') {
            throw new Meteor.Error('Admin account', 'Please login as a different user on Qlik.com');
        } else if (userExists) {
            // console.log('########### found user, now reset his password: ', userExists);
            userId = userExists._id;
            Accounts.setPassword(userId, user.password);
        } else {
            userId = Accounts.createUser(user);
            Roles.addUsersToRoles(userId, ['untrusted'], 'GLOBAL'); // https://github.com/alanning/meteor-roles
        }
        return userId;
    },
});

function insertDummyCustomers(generationUserId) {
    // console.log('insertDummyCustomers called for generationUserId: ', generationUserId);
    _.each(dummyCustomers, function(customer) {
        customer.generationUserId = generationUserId;
        Customers.insert(customer);
    });
}

//Each proxy has its own session cookie, so you have to logout the users per proxy used.
export function logoutUser(UDC, name, proxy) {
    if (!proxy) {
        proxy = senseConfig.virtualProxyClientUsage;
    } // use use the proxy for the dummy users from step 4
    // console.log('******** QPS Functions: logout the current: ' + name + ' on proxy: ' + proxy);

    if (name) {
        // //console.log('Make QPS-logout call, We authenticate to Sense using the options (including a certificate) object in the HTTPs call: '); //, configCerticates);
        // //console.log('Meteor tries to logout the user on this URL: https://' + senseConfig.SenseServerInternalLanIP + ':4243/qps/' + senseConfig.virtualProxyClientUsage + '/user/' + senseConfig.UDC + '/' + name);
        try {
            const call = {};
            call.action = 'Logout user: ' + name;
            call.url = gitHubLinks.logoutUser;
            call.request = 'https://' + senseConfig.SenseServerInternalLanIP + ':4243/qps/' + proxy + '/user/' + UDC + '/' + name + '?xrfkey=' + senseConfig.xrfkey;
            call.response = HTTP.call('DELETE', call.request, {
                'npmRequestOptions': configCerticates
            });

            REST_Log(call, UDC); // the UDC is the by definition the userId of meteor in our approach...
            // console.log('The HTTP REQUEST to Sense QPS API:', call.request);
            // console.log('The HTTP RESPONSE from Sense QPS API: ', call.response);
        } catch (err) {
            console.error(err);
            throw new Meteor.Error('Logout user failed', err.message);
        }
    }
}

// based on Rikard Braathen's QlikAuth module
export function getRedirectURL(passport, proxyRestUri, targetId, generationUserId) {
    check(passport, Object);
    check(proxyRestUri, String);
    check(targetId, String);
    check(generationUserId, String);

    // console.log('entered server side requestTicket module for user and passport', passport, proxyRestUri);
    // see https://help.qlik.com/en-US/sense-developer/3.0/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-ProxyServiceAPI-Authentication-Ticket-Add.htm

    var ticketRequestBody = passport;
    ticketRequestBody.TargetId = targetId;
    // console.log('The passport for requesting a ticket: ', passport);

    try {
        var call = {};
        call.action = 'STEP 5: Request ticket at endpoint received from Sense: ' + proxyRestUri;
        call.request = proxyRestUri + 'ticket'; // we use the proxy rest uri which we got from the redirect from the proxy (the first bounce)
        call.url = gitHubLinks.requestTicket;
        call.response = HTTP.call('POST', call.request, {
            'npmRequestOptions': configCerticates,
            headers: authHeaders,
            params: {
                'xrfkey': senseConfig.xrfkey
            },
            data: passport, // the user and group info for which we want to create a ticket
        });
        REST_Log(call, generationUserId);
    } catch (err) {
        console.error('REST call to request a ticket failed', err);
        throw new Meteor.Error('Request ticket failed', err.message);
    }

    // console.log('The HTTP REQUEST to Sense QPS API:', call.request);
    // console.log('The HTTP RESPONSE from Sense QPS API: ', call.response);
    var ticketResponse = call.response.data;
    call.action = 'STEP 6: Use response from our ticket request to create redirect url';
    call.request = 'Use the redirect url we got back and the ticket string to make a redirect url for the client. Format: ' + ticketResponse.TargetUri + '?QlikTicket=' + ticketResponse.Ticket + '. JSON received: ' + ticketResponse;
    REST_Log(call);


    // Build redirect URL for the client including the ticket
    if (ticketResponse.TargetUri.indexOf('?') > 0) {
        redirectURI = ticketResponse.TargetUri + '&QlikTicket=' + ticketResponse.Ticket;
    } else {
        redirectURI = ticketResponse.TargetUri + '?QlikTicket=' + ticketResponse.Ticket;
    }

    if (!redirectURI) {
        redirectURI = 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxyClientUsage + '/' + hub;
    }
    // console.log('Meteor server side created this redirect url: ', redirectURI);
    return redirectURI;
}