var require = meteorInstall({"lib":{"yogiben.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/yogiben.js                                                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// import { Customers } from '/imports/api/customers';                                                                 // 1
// AdminConfig = {                                                                                                     // 4
//     collections: {                                                                                                  // 5
//         Customers: {                                                                                                // 6
//             collectionObject: Customers,                                                                            // 7
//         }                                                                                                           // 8
//     },                                                                                                              // 9
//     userSchema: new SimpleSchema({                                                                                  // 10
//         'profile.gender': {                                                                                         // 11
//             type: String,                                                                                           // 12
//             allowedValues: ['male', 'female']                                                                       // 13
//         }                                                                                                           // 14
//     })                                                                                                              // 15
// };                                                                                                                  // 16
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"imports":{"api":{"server":{"QPSFunctions.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/server/QPSFunctions.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _regenerator = require("babel-runtime/regenerator");                                                               //
                                                                                                                       //
var _regenerator2 = _interopRequireDefault(_regenerator);                                                              //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
var module1 = module;                                                                                                  // 1
module1.export({                                                                                                       // 1
    createVirtualProxies: function () {                                                                                // 1
        return createVirtualProxies;                                                                                   // 1
    },                                                                                                                 // 1
    getVirtualProxies: function () {                                                                                   // 1
        return getVirtualProxies;                                                                                      // 1
    },                                                                                                                 // 1
    logoutUser: function () {                                                                                          // 1
        return logoutUser;                                                                                             // 1
    },                                                                                                                 // 1
    getRedirectURL: function () {                                                                                      // 1
        return getRedirectURL;                                                                                         // 1
    }                                                                                                                  // 1
});                                                                                                                    // 1
var Meteor = void 0;                                                                                                   // 1
module1.watch(require("meteor/meteor"), {                                                                              // 1
    Meteor: function (v) {                                                                                             // 1
        Meteor = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var Customers = void 0,                                                                                                // 1
    dummyCustomers = void 0,                                                                                           // 1
    dummyCustomer = void 0;                                                                                            // 1
module1.watch(require("/imports/api/customers"), {                                                                     // 1
    Customers: function (v) {                                                                                          // 1
        Customers = v;                                                                                                 // 1
    },                                                                                                                 // 1
    dummyCustomers: function (v) {                                                                                     // 1
        dummyCustomers = v;                                                                                            // 1
    },                                                                                                                 // 1
    dummyCustomer: function (v) {                                                                                      // 1
        dummyCustomer = v;                                                                                             // 1
    }                                                                                                                  // 1
}, 1);                                                                                                                 // 1
var REST_Log = void 0;                                                                                                 // 1
module1.watch(require("/imports/api/APILogs"), {                                                                       // 1
    REST_Log: function (v) {                                                                                           // 1
        REST_Log = v;                                                                                                  // 1
    }                                                                                                                  // 1
}, 2);                                                                                                                 // 1
var gitHubLinks = void 0;                                                                                              // 1
module1.watch(require("/imports/ui/UIHelpers"), {                                                                      // 1
    gitHubLinks: function (v) {                                                                                        // 1
        gitHubLinks = v;                                                                                               // 1
    }                                                                                                                  // 1
}, 3);                                                                                                                 // 1
var senseConfig = void 0,                                                                                              // 1
    enigmaServerConfig = void 0,                                                                                       // 1
    authHeaders = void 0,                                                                                              // 1
    QRSconfig = void 0,                                                                                                // 1
    qliksrv = void 0,                                                                                                  // 1
    QRSCertConfig = void 0,                                                                                            // 1
    configCerticates = void 0,                                                                                         // 1
    validateJSON = void 0;                                                                                             // 1
module1.watch(require("/imports/api/config.js"), {                                                                     // 1
    senseConfig: function (v) {                                                                                        // 1
        senseConfig = v;                                                                                               // 1
    },                                                                                                                 // 1
    enigmaServerConfig: function (v) {                                                                                 // 1
        enigmaServerConfig = v;                                                                                        // 1
    },                                                                                                                 // 1
    authHeaders: function (v) {                                                                                        // 1
        authHeaders = v;                                                                                               // 1
    },                                                                                                                 // 1
    QRSconfig: function (v) {                                                                                          // 1
        QRSconfig = v;                                                                                                 // 1
    },                                                                                                                 // 1
    qrsSrv: function (v) {                                                                                             // 1
        qliksrv = v;                                                                                                   // 1
    },                                                                                                                 // 1
    QRSCertConfig: function (v) {                                                                                      // 1
        QRSCertConfig = v;                                                                                             // 1
    },                                                                                                                 // 1
    configCerticates: function (v) {                                                                                   // 1
        configCerticates = v;                                                                                          // 1
    },                                                                                                                 // 1
    validateJSON: function (v) {                                                                                       // 1
        validateJSON = v;                                                                                              // 1
    }                                                                                                                  // 1
}, 4);                                                                                                                 // 1
var lodash = void 0;                                                                                                   // 1
module1.watch(require("lodash"), {                                                                                     // 1
    "default": function (v) {                                                                                          // 1
        lodash = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 5);                                                                                                                 // 1
                                                                                                                       //
var fs = require('fs-extra');                                                                                          // 15
                                                                                                                       //
var path = require('path');                                                                                            // 16
                                                                                                                       //
var os = require('os');                                                                                                // 17
                                                                                                                       //
var ip = require('ip'); //                                                                                             // 18
// ─── IMPORT CONFIG FOR QLIK SENSE QRS ───────────────────────────────────────────                                    // 21
//                                                                                                                     // 22
                                                                                                                       //
                                                                                                                       //
_ = lodash; //                                                                                                         // 36
// ─── CREATE VIRTUAL PROXIES ─────────────────────────────────────────────────────                                    // 39
//                                                                                                                     // 40
// http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-Virtual-Proxy-Create.htm
                                                                                                                       //
function createVirtualProxies() {                                                                                      // 43
    var file, proxySettings, _iterator, _isArray, _i, _ref, vpToCreate, existingProxies, found, virtualProxy, createVirtualProxy;
                                                                                                                       //
    return _regenerator2.default.async(function () {                                                                   // 43
        function createVirtualProxies$(_context) {                                                                     // 43
            while (1) {                                                                                                // 43
                switch (_context.prev = _context.next) {                                                               // 43
                    case 0:                                                                                            // 43
                        createVirtualProxy = function () {                                                             // 84
                            function createVirtualProxy(virtualProxy) {                                                // 43
                                // get id of local node so we can link the virtual proxy to a load balancing node      // 86
                                virtualProxy.loadBalancingServerNodes = [{                                             // 87
                                    id: getServerNodeConfiguration().id                                                // 88
                                }];                                                                                    // 87
                                                                                                                       //
                                try {                                                                                  // 90
                                    check(virtualProxy, Object);                                                       // 91
                                    console.log('------CREATE VIRTUAL PROXY: ', virtualProxy.prefix);                  // 92
                                    var request = qliksrv + '/qrs/virtualproxyconfig/';                                // 94
                                    response = HTTP.call('POST', request, {                                            // 95
                                        params: {                                                                      // 96
                                            xrfkey: senseConfig.xrfkey                                                 // 97
                                        },                                                                             // 96
                                        'npmRequestOptions': configCerticates,                                         // 99
                                        data: virtualProxy                                                             // 100
                                    });                                                                                // 95
                                    return response.data;                                                              // 102
                                } catch (err) {                                                                        // 103
                                    console.error('create virtual proxy failed', err);                                 // 104
                                } // }                                                                                 // 105
                                                                                                                       //
                            }                                                                                          // 107
                                                                                                                       //
                            return createVirtualProxy;                                                                 // 43
                        }();                                                                                           // 43
                                                                                                                       //
                        console.log('------------------------------------');                                           // 44
                        console.log('CREATE VIRTUAL PROXIES');                                                         // 45
                        console.log('------------------------------------');                                           // 46
                        file = path.join(Meteor.settings.broker.automationBaseFolder, 'proxy', 'import', 'virtualProxySettings.json');
                        _context.prev = 5;                                                                             // 43
                        _context.next = 8;                                                                             // 43
                        return _regenerator2.default.awrap(fs.readJson(file));                                         // 43
                                                                                                                       //
                    case 8:                                                                                            // 43
                        proxySettings = _context.sent;                                                                 // 50
                        _context.prev = 9;                                                                             // 43
                        validateJSON(proxySettings);                                                                   // 52
                        _context.next = 16;                                                                            // 43
                        break;                                                                                         // 43
                                                                                                                       //
                    case 13:                                                                                           // 43
                        _context.prev = 13;                                                                            // 43
                        _context.t0 = _context["catch"](9);                                                            // 43
                        throw new Error('Cant read the virtual proxy definitions file: virtualProxySettings.json in your automation folder');
                                                                                                                       //
                    case 16:                                                                                           // 43
                        _iterator = proxySettings, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();
                                                                                                                       //
                    case 17:                                                                                           // 43
                        if (!_isArray) {                                                                               // 43
                            _context.next = 23;                                                                        // 43
                            break;                                                                                     // 43
                        }                                                                                              // 43
                                                                                                                       //
                        if (!(_i >= _iterator.length)) {                                                               // 43
                            _context.next = 20;                                                                        // 43
                            break;                                                                                     // 43
                        }                                                                                              // 43
                                                                                                                       //
                        return _context.abrupt("break", 34);                                                           // 43
                                                                                                                       //
                    case 20:                                                                                           // 43
                        _ref = _iterator[_i++];                                                                        // 43
                        _context.next = 27;                                                                            // 43
                        break;                                                                                         // 43
                                                                                                                       //
                    case 23:                                                                                           // 43
                        _i = _iterator.next();                                                                         // 43
                                                                                                                       //
                        if (!_i.done) {                                                                                // 43
                            _context.next = 26;                                                                        // 43
                            break;                                                                                     // 43
                        }                                                                                              // 43
                                                                                                                       //
                        return _context.abrupt("break", 34);                                                           // 43
                                                                                                                       //
                    case 26:                                                                                           // 43
                        _ref = _i.value;                                                                               // 43
                                                                                                                       //
                    case 27:                                                                                           // 43
                        vpToCreate = _ref;                                                                             // 58
                                                                                                                       //
                        if (vpToCreate.websocketCrossOriginWhiteList) {                                                // 59
                            vpToCreate.websocketCrossOriginWhiteList.push(Meteor.settings.public.qlikSenseHost);       // 60
                            vpToCreate.websocketCrossOriginWhiteList.push(ip.address());                               // 61
                            vpToCreate.websocketCrossOriginWhiteList.push(os.hostname());                              // 62
                        }                                                                                              // 63
                                                                                                                       //
                        existingProxies = getVirtualProxies(); // CHECK IF VIRT. PROXY ALREADY EXISTS IN SENSE         // 64
                                                                                                                       //
                        found = existingProxies.some(function (existingVP) {                                           // 67
                            return existingVP.prefix === vpToCreate.prefix;                                            // 68
                        });                                                                                            // 69
                                                                                                                       //
                        if (!found) {                                                                                  // 70
                            virtualProxy = createVirtualProxy(vpToCreate); // THE VIRTUAL PROXY HAS BEEN CREATED, NOW LINK IT TO THE CENTRAL PROXY
                                                                                                                       //
                            linkVirtualProxyToProxy(virtualProxy);                                                     // 73
                        } else {                                                                                       // 74
                            console.log('Virtual proxy ' + vpToCreate.prefix + ' already existed. We do not update existing ones.');
                        }                                                                                              // 76
                                                                                                                       //
                    case 32:                                                                                           // 43
                        _context.next = 17;                                                                            // 43
                        break;                                                                                         // 43
                                                                                                                       //
                    case 34:                                                                                           // 43
                        _context.next = 40;                                                                            // 43
                        break;                                                                                         // 43
                                                                                                                       //
                    case 36:                                                                                           // 43
                        _context.prev = 36;                                                                            // 43
                        _context.t1 = _context["catch"](5);                                                            // 43
                        console.error(_context.t1);                                                                    // 79
                        throw new Error('unable to create virtual proxies', _context.t1);                              // 43
                                                                                                                       //
                    case 40:                                                                                           // 43
                    case "end":                                                                                        // 43
                        return _context.stop();                                                                        // 43
                }                                                                                                      // 43
            }                                                                                                          // 43
        }                                                                                                              // 43
                                                                                                                       //
        return createVirtualProxies$;                                                                                  // 43
    }(), null, this, [[5, 36], [9, 13]]);                                                                              // 43
}                                                                                                                      // 43
                                                                                                                       //
// http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-Virtual-Proxy-Link.htm 
function linkVirtualProxyToProxy(virtualProxy) {                                                                       // 111
    // console.log('linkVirtualProxyToProxy', virtualProxy.id);                                                        // 112
    // GET ID OF PROXY ON THIS HOST                                                                                    // 114
    var proxyId = getProxyId(); // GET THE CONFIG OF THE PROXY (WHICH CONTAINS VIRTUAL PROXIES)                        // 115
                                                                                                                       //
    var proxyConfig = getProxyServiceConfiguration(proxyId); // ADD THE NEW VIRTUAL PROXY TO THE EXISTING PROXY LIST   // 117
                                                                                                                       //
    proxyConfig.settings.virtualProxies.push(virtualProxy); //UPDATE SOME PROXY SETTINGS                               // 119
                                                                                                                       //
    proxyConfig.settings.unencryptedListenPort = Meteor.settings.public.qlikSensePort; //HTTP                          // 122
                                                                                                                       //
    proxyConfig.settings.listenPort = Meteor.settings.public.qlikSensePortSecure; //HTTPS                              // 123
                                                                                                                       //
    proxyConfig.settings.allowHttp = Meteor.settings.public.qlikSenseAllowHTTP; //OVERWRITE THE SETTINGS WITH THE COMPLETE UPDATED OBJECT.
                                                                                                                       //
    updateProxy(proxyId, proxyConfig);                                                                                 // 127
}                                                                                                                      // 128
                                                                                                                       //
function updateProxy(proxyId, proxyConfig) {                                                                           // 130
    try {                                                                                                              // 131
        check(proxyId, String);                                                                                        // 132
        check(proxyConfig, Object);                                                                                    // 133
        console.log('proxyConfig', proxyConfig.settings.virtualProxies);                                               // 134
        var request = qliksrv + '/qrs/proxyservice/' + proxyId;                                                        // 136
        response = HTTP.call('PUT', request, {                                                                         // 137
            params: {                                                                                                  // 138
                xrfkey: senseConfig.xrfkey                                                                             // 139
            },                                                                                                         // 138
            'npmRequestOptions': configCerticates,                                                                     // 141
            data: proxyConfig                                                                                          // 142
        });                                                                                                            // 137
    } catch (err) {                                                                                                    // 144
        console.error('create virtual proxy failed', err);                                                             // 145
    }                                                                                                                  // 146
}                                                                                                                      // 147
                                                                                                                       //
function getProxyId() {                                                                                                // 149
    try {                                                                                                              // 150
        var request = qliksrv + '/qrs/proxyservice/?xrfkey=' + senseConfig.xrfkey;                                     // 151
        response = HTTP.call('GET', request, {                                                                         // 152
            'npmRequestOptions': configCerticates                                                                      // 153
        });                                                                                                            // 152
        return response.data[0].id;                                                                                    // 155
    } catch (err) {                                                                                                    // 156
        console.error('create virtual proxy failed', err);                                                             // 157
    }                                                                                                                  // 158
}                                                                                                                      // 159
                                                                                                                       //
function getProxyServiceConfiguration(proxyId) {                                                                       // 161
    try {                                                                                                              // 163
        check(proxyId, String);                                                                                        // 164
        var request = qliksrv + '/qrs/proxyservice/' + proxyId + '?xrfkey=' + senseConfig.xrfkey;                      // 166
        response = HTTP.call('GET', request, {                                                                         // 167
            'npmRequestOptions': configCerticates                                                                      // 168
        }); //SAVE RPOXY CONFIG TO THE EXPORT FOLDER                                                                   // 167
                                                                                                                       //
        var file = path.join(Meteor.settings.broker.automationBaseFolder, 'proxy', 'export', 'proxyServiceConfiguration.json');
        fs.outputFile(file, JSON.stringify(response.data, null, 2), 'utf-8');                                          // 173
        return response.data;                                                                                          // 175
    } catch (err) {                                                                                                    // 176
        console.error('create virtual proxy failed', err);                                                             // 177
    }                                                                                                                  // 178
}                                                                                                                      // 179
                                                                                                                       //
function getVirtualProxies() {                                                                                         // 181
    // console.log('--------------------------GET VIRTUAL PROXIES');//                                                 // 182
    try {                                                                                                              // 183
        var request = qliksrv + '/qrs/virtualproxyconfig/';                                                            // 184
        response = HTTP.call('GET', request, {                                                                         // 185
            params: {                                                                                                  // 186
                xrfkey: senseConfig.xrfkey                                                                             // 187
            },                                                                                                         // 186
            npmRequestOptions: configCerticates                                                                        // 189
        });                                                                                                            // 185
        var file = path.join(Meteor.settings.broker.automationBaseFolder, 'proxy', 'export', 'virtualProxyServiceConfiguration.json'); // SAVE PROXY FILE TO DISK
                                                                                                                       //
        fs.outputFile(file, JSON.stringify(response.data, null, 2), 'utf-8');                                          // 195
        return response.data;                                                                                          // 196
    } catch (err) {                                                                                                    // 197
        console.error('create virtual proxy failed', err);                                                             // 198
    }                                                                                                                  // 199
}                                                                                                                      // 200
                                                                                                                       //
// function getCentralProxy() {                                                                                        // 202
//     console.log('getCentralProxy: GET /qrs/ServerNodeConfiguration?filter=isCentral')                               // 203
// }                                                                                                                   // 204
function getServerNodeConfiguration() {                                                                                // 207
    try {                                                                                                              // 208
        var request = qliksrv + '/qrs/servernodeconfiguration/local?xrfkey=' + senseConfig.xrfkey;                     // 209
        response = HTTP.call('GET', request, {                                                                         // 210
            'npmRequestOptions': configCerticates                                                                      // 211
        });                                                                                                            // 210
        return response.data;                                                                                          // 213
    } catch (err) {                                                                                                    // 214
        console.error('create virtual proxy failed', err);                                                             // 215
    }                                                                                                                  // 216
} //                                                                                                                   // 217
// ─── METEOR METHODS ─────────────────────────────────────────────────────────────                                    // 220
//                                                                                                                     // 221
                                                                                                                       //
                                                                                                                       //
Meteor.methods({                                                                                                       // 224
    currentlyLoggedInUser: function () {                                                                               // 225
        // console.log("Meteor will now look which user is currently logged in, and request a ticket for this ID, and add his group memberships.");
        var call = {};                                                                                                 // 227
        call.action = 'STEP 3: Server received request to create ticket';                                              // 228
        call.request = 'Meteor server received a incoming method call from the browser. The meteor server will now look which user is currently logged in, and create a ticket for this ID, and add his group memberships.';
        REST_Log(call, Meteor.userId()); // first find the customers that have a logged in users (mongo returns a complete document)
                                                                                                                       //
        var customer = Customers.findOne({                                                                             // 233
            generationUserId: Meteor.userId(),                                                                         // 234
            'users.currentlyLoggedIn': true                                                                            // 235
        }); // console.log('In our local database we can find the customer with the currentlyLoggedIn set to true for user: ' + loggedInUser + ', the customer which contains the user that the user selected with the dropdown: ', customer);
        // now we have the document, we can look in the array of users, to find the one that is logged in.             // 239
                                                                                                                       //
        var user;                                                                                                      // 240
                                                                                                                       //
        if (!customer) {                                                                                               // 241
            // if no user is selected, just insert john as a dummy                                                     // 241
            // const error = 'You have not selected a user you want to simulate the Single Sign on with. For demo purposes we now selected John for you. You can also select your own user in step 4 of the SaaS demo';
            var response = {}; // console.log('dummyCustomer :', dummyCustomer);                                       // 243
                                                                                                                       //
            response.user = dummyCustomer.user;                                                                        // 245
            response.customer = dummyCustomer; // throw new Meteor.Warning('No user', error);                          // 246
        } else {                                                                                                       // 248
            var user = _.find(customer.users, {                                                                        // 249
                'currentlyLoggedIn': true                                                                              // 250
            });                                                                                                        // 249
                                                                                                                       //
            var response = {};                                                                                         // 252
            response.user = user;                                                                                      // 253
            response.customer = customer;                                                                              // 254
        } // console.log('the response is: ', response);                                                               // 255
                                                                                                                       //
                                                                                                                       //
        return response;                                                                                               // 257
    },                                                                                                                 // 258
    getRedirectUrl: function (proxyRestUri, targetId, loggedInUser) {                                                  // 259
        var response = Meteor.call('currentlyLoggedInUser');                                                           // 260
        var customer = response.customer;                                                                              // 261
        var user = response.user; // console.log('UserID currently logged in in the demo platform: ' + loggedInUser + '. Meteor server side thinks the meteor.userId is ' + Meteor.userId() + '. We use this as the UDC name');
        // Create a paspoort (ticket) request: user directory, user identity and attributes                            // 265
                                                                                                                       //
        var passport = {                                                                                               // 266
            'UserDirectory': Meteor.userId(),                                                                          // 267
            // Specify a dummy value to ensure userID's are unique E.g. "Dummy", or in my case, I use the logged in user, so each user who uses the demo can logout only his users, or the name of the customer domain if you need a Virtual proxy per customer
            'UserId': user.name,                                                                                       // 268
            // the current user that we are going to login with                                                        // 268
            'Attributes': [{                                                                                           // 269
                'group': customer.name.toUpperCase()                                                                   // 270
            }, // attributes supply the group membership from the source system to Qlik Sense                          // 269
            {                                                                                                          // 272
                'group': user.country.toUpperCase()                                                                    // 273
            }, {                                                                                                       // 272
                'group': user.group.toUpperCase()                                                                      // 276
            }]                                                                                                         // 275
        }; // console.log('Request ticket for this user passport": ', passport);                                       // 266
        // logging only                                                                                                // 282
                                                                                                                       //
        var call = {};                                                                                                 // 283
        call.action = 'STEP 4: User and group information received from customer database, now we can request a ticket';
        call.url = gitHubLinks.createpassport;                                                                         // 285
        call.request = 'Request ticket for this user and his groups (an array of values which you can use in the security rules): ": ' + JSON.stringify(passport);
        REST_Log(call, Meteor.userId());                                                                               // 287
        return getRedirectURL(passport, proxyRestUri, targetId, Meteor.userId());                                      // 289
    },                                                                                                                 // 290
    getTicketNumber: function (userProperties, virtualProxy) {                                                         // 291
        // only get a ticket number for a SPECIFIC virtual proxy                                                       // 291
        try {                                                                                                          // 292
            // check(userProperties.user, String);                                                                     // 293
            check(userProperties.group, String);                                                                       // 294
        } catch (err) {                                                                                                // 295
            throw new Meteor.Error('Failed to login into Qlik Sense via a ticket', 'Please go to the landing page and select your group. We could not request a ticket because the userId or groups (technical, generic) are not provided');
        }                                                                                                              // 297
                                                                                                                       //
        var passport = {                                                                                               // 298
            'UserDirectory': Meteor.userId(),                                                                          // 299
            // Specify a dummy value to ensure userID's are unique E.g. "Dummy", or in my case, I use the logged in user, so each user who uses the demo can logout only his users, or the name of the customer domain if you need a Virtual proxy per customer
            'UserId': Meteor.userId(),                                                                                 // 300
            // the current user that we are going to login with                                                        // 300
            'Attributes': [{                                                                                           // 301
                'group': 'slideGenerator'                                                                              // 302
            }, // attributes supply the group membership from the source system to Qlik Sense                          // 301
            {                                                                                                          // 304
                'group': userProperties.group                                                                          // 305
            }, {                                                                                                       // 304
                'group': 'ITALY'                                                                                       // 308
            }]                                                                                                         // 307
        }; //get the ticket number and return it to the client                                                         // 298
                                                                                                                       //
        return Meteor.call('requestTicketWithPassport', virtualProxy, passport);                                       // 313
    },                                                                                                                 // 314
    //only for demo purposes! never supply groups from the client...                                                   // 315
    requestTicketWithPassport: function (virtualProxy, passport) {                                                     // 316
        console.log('getTicketNumber passport', passport); // http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-ProxyServiceAPI-Authentication-Ticket-Add.htm
                                                                                                                       //
        var proxyGetTicketURI = 'https://' + senseConfig.host + ':' + Meteor.settings.private.proxyPort + '/qps/' + virtualProxy + '/ticket'; // "proxyRestUri": "https://ip-172-31-22-22.eu-central-1.compute.internal:4243/qps/meteor/",
                                                                                                                       //
        try {                                                                                                          // 321
            var response = HTTP.call('POST', proxyGetTicketURI, {                                                      // 322
                'npmRequestOptions': configCerticates,                                                                 // 323
                headers: authHeaders,                                                                                  // 324
                params: {                                                                                              // 325
                    'xrfkey': senseConfig.xrfkey                                                                       // 326
                },                                                                                                     // 325
                data: passport // the user and group info for which we want to create a ticket                         // 328
                                                                                                                       //
            });                                                                                                        // 322
        } catch (err) {                                                                                                // 330
            console.error('REST call to request a ticket failed', err);                                                // 331
            throw new Meteor.Error('Request ticket failed', err.message);                                              // 332
        }                                                                                                              // 333
                                                                                                                       //
        return response.data.Ticket;                                                                                   // 334
    },                                                                                                                 // 335
    resetLoggedInUser: function () {                                                                                   // 336
        // console.log("***Method resetLoggedInUsers");                                                                // 337
        // console.log('call the QPS logout api, to invalidate the session cookie for each user in our local database');
        // reset the local database. set all users to not logged in. We need this code because we do a simulation of the login and not a real end user login.
        Customers.find({                                                                                               // 341
            'generationUserId': Meteor.userId()                                                                        // 342
        }).forEach(function (customer) {                                                                               // 341
            var updatedUsers = _.map(customer.users, function (user) {                                                 // 345
                if (user) {                                                                                            // 346
                    user.currentlyLoggedIn = false;                                                                    // 347
                } // and just logout everybody in the user list                                                        // 348
                                                                                                                       //
                                                                                                                       //
                logoutUser(Meteor.userId(), user.name);                                                                // 351
                return user;                                                                                           // 352
            });                                                                                                        // 353
                                                                                                                       //
            Customers.update(customer._id, {                                                                           // 355
                $set: {                                                                                                // 356
                    users: updatedUsers                                                                                // 357
                }                                                                                                      // 356
            });                                                                                                        // 355
        }); // logoutUser(Meteor.userId(), Meteor.userId()); //logout the user for the slide generator                 // 360
    },                                                                                                                 // 362
    logoutPresentationUser: function (UDC, name) {                                                                     // 363
        console.log('logoutPresentationUser(UDC, name)', UDC, name);                                                   // 364
        logoutUser(UDC, name, Meteor.settings.public.slideGenerator.virtualProxy);                                     // 365
    },                                                                                                                 // 366
    logoutVirtualProxyClientUsageUser: function (UDC, name) {                                                          // 367
        console.log('logout virtual proxy client usuage User(UDC, name)', UDC, name);                                  // 368
        logoutUser(UDC, name, Meteor.settings.public.virtualProxyClientUsage);                                         // 369
    },                                                                                                                 // 370
    simulateUserLogin: function (name) {                                                                               // 371
        check(name, String);                                                                                           // 372
        Meteor.call('resetLoggedInUser'); // console.log('*** Reset all logged in user done, now write in our local database the name for the current simulated user: generationUserId: ' + Meteor.userId() + ' & users.name:' + name);
                                                                                                                       //
        var query = [{                                                                                                 // 375
            'generationUserId': Meteor.userId(),                                                                       // 376
            'users.name': name                                                                                         // 377
        }, {                                                                                                           // 375
            $set: {                                                                                                    // 379
                'users.$.currentlyLoggedIn': true                                                                      // 380
            }                                                                                                          // 379
        }];                                                                                                            // 378
        Customers.update({                                                                                             // 384
            'generationUserId': Meteor.userId(),                                                                       // 385
            'users.name': name                                                                                         // 386
        }, {                                                                                                           // 384
            $set: {                                                                                                    // 388
                'users.$.currentlyLoggedIn': true                                                                      // 389
            }                                                                                                          // 388
        }, {}, function (error, numberAffectedDocuments) {                                                             // 387
            if (numberAffectedDocuments === 0) {                                                                       // 392
                // if nothing is updated, insert some dummy customers                                                  // 392
                // console.log('simulateUserLogin numberAffectedDocuments: ', numberAffectedDocuments);                // 393
                // name does not yet exist in the customers created by the current demo user. So insert our dummy customers.numberAffectedDocuments
                insertDummyCustomers(Meteor.userId());                                                                 // 395
                Customers.update({                                                                                     // 396
                    'generationUserId': Meteor.userId(),                                                               // 397
                    'users.name': name                                                                                 // 398
                }, {                                                                                                   // 396
                    $set: {                                                                                            // 400
                        'users.$.currentlyLoggedIn': true                                                              // 401
                    }                                                                                                  // 400
                });                                                                                                    // 399
            }                                                                                                          // 404
        });                                                                                                            // 405
    }                                                                                                                  // 406
});                                                                                                                    // 224
Meteor.methods({                                                                                                       // 409
    'resetPasswordOrCreateUser': function (user) {                                                                     // 410
        try {                                                                                                          // 411
            // console.log('reset the password of the user before logging him in');                                    // 412
            check(user.email, String);                                                                                 // 413
            check(user.password, String);                                                                              // 414
        } catch (err) {                                                                                                // 415
            throw new Meteor.Error('Missing Qlik.com user data', 'The user misses important information from its Qlik.com account');
        }                                                                                                              // 418
                                                                                                                       //
        var userExists = Accounts.findUserByEmail(user.email);                                                         // 419
        var userId = {};                                                                                               // 420
                                                                                                                       //
        if (user.email === 'mbj@qlik.com') {                                                                           // 421
            throw new Meteor.Error('Admin account', 'Please login as a different user on Qlik.com');                   // 422
        } else if (userExists) {                                                                                       // 423
            // console.log('########### found user, now reset his password: ', userExists);                            // 424
            userId = userExists._id;                                                                                   // 425
            Accounts.setPassword(userId, user.password);                                                               // 426
        } else {                                                                                                       // 427
            userId = Accounts.createUser(user);                                                                        // 428
            Roles.addUsersToRoles(userId, ['untrusted'], 'GLOBAL'); // https://github.com/alanning/meteor-roles        // 429
        }                                                                                                              // 430
                                                                                                                       //
        return userId;                                                                                                 // 431
    }                                                                                                                  // 432
});                                                                                                                    // 409
                                                                                                                       //
function insertDummyCustomers(generationUserId) {                                                                      // 435
    // console.log('insertDummyCustomers called for generationUserId: ', generationUserId);                            // 436
    _.each(dummyCustomers, function (customer) {                                                                       // 437
        customer.generationUserId = generationUserId;                                                                  // 438
        Customers.insert(customer);                                                                                    // 439
    });                                                                                                                // 440
} //Each proxy has its own session cookie, so you have to logout the users per proxy used.                             // 441
                                                                                                                       //
                                                                                                                       //
function logoutUser(UDC, name, proxy) {                                                                                // 444
    if (!proxy) {                                                                                                      // 445
        proxy = senseConfig.virtualProxyClientUsage;                                                                   // 446
    } // use use the proxy for the dummy users from step 4                                                             // 447
    // console.log('******** QPS Functions: logout the current: ' + name + ' on proxy: ' + proxy);                     // 448
                                                                                                                       //
                                                                                                                       //
    if (name) {                                                                                                        // 450
        // //console.log('Make QPS-logout call, We authenticate to Sense using the options (including a certificate) object in the HTTPs call: '); //, configCerticates);
        // //console.log('Meteor tries to logout the user on this URL: https://' + senseConfig.SenseServerInternalLanIP + ':4243/qps/' + senseConfig.virtualProxyClientUsage + '/user/' + senseConfig.UDC + '/' + name);
        try {                                                                                                          // 453
            var call = {};                                                                                             // 454
            call.action = 'Logout user: ' + name;                                                                      // 455
            call.url = gitHubLinks.logoutUser;                                                                         // 456
            call.request = 'https://' + senseConfig.SenseServerInternalLanIP + ':4243/qps/' + proxy + '/user/' + UDC + '/' + name + '?xrfkey=' + senseConfig.xrfkey;
            call.response = HTTP.call('DELETE', call.request, {                                                        // 458
                'npmRequestOptions': configCerticates                                                                  // 459
            });                                                                                                        // 458
            REST_Log(call, UDC); // the UDC is the by definition the userId of meteor in our approach...               // 462
            // console.log('The HTTP REQUEST to Sense QPS API:', call.request);                                        // 463
            // console.log('The HTTP RESPONSE from Sense QPS API: ', call.response);                                   // 464
        } catch (err) {                                                                                                // 465
            console.error(err);                                                                                        // 466
            throw new Meteor.Error('Logout user failed', err.message);                                                 // 467
        }                                                                                                              // 468
    }                                                                                                                  // 469
}                                                                                                                      // 470
                                                                                                                       //
function getRedirectURL(passport, proxyRestUri, targetId, generationUserId) {                                          // 473
    check(passport, Object);                                                                                           // 474
    check(proxyRestUri, String);                                                                                       // 475
    check(targetId, String);                                                                                           // 476
    check(generationUserId, String); // console.log('entered server side requestTicket module for user and passport', passport, proxyRestUri);
    // see https://help.qlik.com/en-US/sense-developer/3.0/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-ProxyServiceAPI-Authentication-Ticket-Add.htm
                                                                                                                       //
    var ticketRequestBody = passport;                                                                                  // 482
    ticketRequestBody.TargetId = targetId; // console.log('The passport for requesting a ticket: ', passport);         // 483
                                                                                                                       //
    try {                                                                                                              // 486
        var call = {};                                                                                                 // 487
        call.action = 'STEP 5: Request ticket at endpoint received from Sense: ' + proxyRestUri;                       // 488
        call.request = proxyRestUri + 'ticket'; // we use the proxy rest uri which we got from the redirect from the proxy (the first bounce)
                                                                                                                       //
        call.url = gitHubLinks.requestTicket;                                                                          // 490
        call.response = HTTP.call('POST', call.request, {                                                              // 491
            'npmRequestOptions': configCerticates,                                                                     // 492
            headers: authHeaders,                                                                                      // 493
            params: {                                                                                                  // 494
                'xrfkey': senseConfig.xrfkey                                                                           // 495
            },                                                                                                         // 494
            data: passport // the user and group info for which we want to create a ticket                             // 497
                                                                                                                       //
        });                                                                                                            // 491
        REST_Log(call, generationUserId);                                                                              // 499
    } catch (err) {                                                                                                    // 500
        console.error('REST call to request a ticket failed', err);                                                    // 501
        throw new Meteor.Error('Request ticket failed', err.message);                                                  // 502
    } // console.log('The HTTP REQUEST to Sense QPS API:', call.request);                                              // 503
    // console.log('The HTTP RESPONSE from Sense QPS API: ', call.response);                                           // 506
                                                                                                                       //
                                                                                                                       //
    var ticketResponse = call.response.data;                                                                           // 507
    call.action = 'STEP 6: Use response from our ticket request to create redirect url';                               // 508
    call.request = 'Use the redirect url we got back and the ticket string to make a redirect url for the client. Format: ' + ticketResponse.TargetUri + '?QlikTicket=' + ticketResponse.Ticket + '. JSON received: ' + ticketResponse;
    REST_Log(call); // Build redirect URL for the client including the ticket                                          // 510
                                                                                                                       //
    if (ticketResponse.TargetUri.indexOf('?') > 0) {                                                                   // 514
        redirectURI = ticketResponse.TargetUri + '&QlikTicket=' + ticketResponse.Ticket;                               // 515
    } else {                                                                                                           // 516
        redirectURI = ticketResponse.TargetUri + '?QlikTicket=' + ticketResponse.Ticket;                               // 517
    }                                                                                                                  // 518
                                                                                                                       //
    if (!redirectURI) {                                                                                                // 520
        redirectURI = 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxyClientUsage + '/' + hub;
    } // console.log('Meteor server side created this redirect url: ', redirectURI);                                   // 522
                                                                                                                       //
                                                                                                                       //
    return redirectURI;                                                                                                // 524
}                                                                                                                      // 525
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"QRSAPI.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/server/QRSAPI.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var module1 = module;                                                                                                  // 1
module1.export({                                                                                                       // 1
    myQRS: function () {                                                                                               // 1
        return myQRS;                                                                                                  // 1
    }                                                                                                                  // 1
});                                                                                                                    // 1
var Meteor = void 0;                                                                                                   // 1
module1.watch(require("meteor/meteor"), {                                                                              // 1
    Meteor: function (v) {                                                                                             // 1
        Meteor = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var http = void 0;                                                                                                     // 1
module1.watch(require("meteor/meteor"), {                                                                              // 1
    http: function (v) {                                                                                               // 1
        http = v;                                                                                                      // 1
    }                                                                                                                  // 1
}, 1);                                                                                                                 // 1
var configCerticates = void 0,                                                                                         // 1
    senseConfig = void 0,                                                                                              // 1
    authHeaders = void 0,                                                                                              // 1
    qrsSrv = void 0;                                                                                                   // 1
module1.watch(require("/imports/api/config"), {                                                                        // 1
    configCerticates: function (v) {                                                                                   // 1
        configCerticates = v;                                                                                          // 1
    },                                                                                                                 // 1
    senseConfig: function (v) {                                                                                        // 1
        senseConfig = v;                                                                                               // 1
    },                                                                                                                 // 1
    authHeaders: function (v) {                                                                                        // 1
        authHeaders = v;                                                                                               // 1
    },                                                                                                                 // 1
    qrsSrv: function (v) {                                                                                             // 1
        qrsSrv = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 2);                                                                                                                 // 1
                                                                                                                       //
var myQRS = function () {                                                                                              // 10
    function myQRSMain() {                                                                                             // 10
        this.get = function () {                                                                                       // 12
            function get(path) {                                                                                       // 12
                var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};                   // 12
                var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};                     // 12
                var endpoint = checkPath(path);                                                                        // 13
                console.log('QRS module received GET request for endpoint', endpoint); // copy the params to one object
                                                                                                                       //
                var newParams = Object.assign({                                                                        // 17
                    xrfkey: senseConfig.xrfkey                                                                         // 17
                }, params);                                                                                            // 17
                                                                                                                       //
                try {                                                                                                  // 18
                    var response = HTTP.get(endpoint, {                                                                // 19
                        npmRequestOptions: configCerticates,                                                           // 20
                        params: newParams,                                                                             // 21
                        data: {}                                                                                       // 22
                    });                                                                                                // 19
                    return response.data;                                                                              // 24
                } catch (err) {                                                                                        // 25
                    var error = 'QRS HTTP GET FAILED FOR ' + endpoint;                                                 // 26
                    console.error(err);                                                                                // 27
                    throw new Meteor.Error(500, error);                                                                // 28
                }                                                                                                      // 29
            }                                                                                                          // 30
                                                                                                                       //
            return get;                                                                                                // 12
        }();                                                                                                           // 12
                                                                                                                       //
        this.post = function () {                                                                                      // 32
            function post(path) {                                                                                      // 32
                var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};                   // 32
                var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};                     // 32
                var endpoint = checkPath(path); // copy the params to one object                                       // 33
                                                                                                                       //
                var newParams = Object.assign({                                                                        // 36
                    'xrfkey': senseConfig.xrfkey                                                                       // 36
                }, params);                                                                                            // 36
                                                                                                                       //
                try {                                                                                                  // 37
                    var response = HTTP.post(endpoint, {                                                               // 38
                        npmRequestOptions: configCerticates,                                                           // 39
                        params: newParams,                                                                             // 40
                        data: data                                                                                     // 41
                    });                                                                                                // 38
                    return response.data;                                                                              // 43
                } catch (err) {                                                                                        // 44
                    console.error('HTTP POST FAILED FOR ' + endpoint, err);                                            // 45
                }                                                                                                      // 46
            }                                                                                                          // 47
                                                                                                                       //
            return post;                                                                                               // 32
        }();                                                                                                           // 32
                                                                                                                       //
        this.del = function () {                                                                                       // 49
            function del(path) {                                                                                       // 49
                var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};                   // 49
                var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};                     // 49
                var endpoint = checkPath(path);                                                                        // 50
                console.log('endpoint', endpoint);                                                                     // 51
                console.log('data', data); // copy the params to one object.                                           // 52
                                                                                                                       //
                var newParams = Object.assign({                                                                        // 55
                    xrfkey: senseConfig.xrfkey                                                                         // 55
                }, params);                                                                                            // 55
                                                                                                                       //
                try {                                                                                                  // 56
                    var response = HTTP.del(endpoint, {                                                                // 57
                        npmRequestOptions: configCerticates,                                                           // 58
                        params: newParams,                                                                             // 59
                        data: data                                                                                     // 60
                    }); // console.log('response', response)                                                           // 57
                                                                                                                       //
                    return response.data;                                                                              // 63
                } catch (err) {                                                                                        // 64
                    console.error('QRS HTTP DEL FAILED FOR ' + endpoint, err);                                         // 65
                }                                                                                                      // 66
            }                                                                                                          // 67
                                                                                                                       //
            return del;                                                                                                // 49
        }();                                                                                                           // 49
                                                                                                                       //
        this.put = function () {                                                                                       // 69
            function put(path) {                                                                                       // 69
                var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};                   // 69
                var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};                     // 69
                var endpoint = checkPath(path); // copy the params to one object                                       // 70
                                                                                                                       //
                var newParams = Object.assign({                                                                        // 73
                    'xrfkey': senseConfig.xrfkey                                                                       // 73
                }, params);                                                                                            // 73
                                                                                                                       //
                try {                                                                                                  // 74
                    var response = HTTP.put(endpoint, {                                                                // 75
                        npmRequestOptions: configCerticates,                                                           // 76
                        params: newParams,                                                                             // 77
                        data: data                                                                                     // 78
                    });                                                                                                // 75
                    return response.data;                                                                              // 80
                } catch (err) {                                                                                        // 81
                    console.error('HTTP PUT FAILED FOR ' + endpoint, err);                                             // 82
                }                                                                                                      // 83
            }                                                                                                          // 84
                                                                                                                       //
            return put;                                                                                                // 69
        }();                                                                                                           // 69
    }                                                                                                                  // 86
                                                                                                                       //
    return myQRSMain;                                                                                                  // 10
}();                                                                                                                   // 10
                                                                                                                       //
function checkPath(path) {                                                                                             // 88
    try {                                                                                                              // 89
        check(path, String);                                                                                           // 90
    } catch (err) {                                                                                                    // 91
        throw Error("QRS module can use path: " + path + " for the QRS API, settings.json correct?");                  // 92
    }                                                                                                                  // 93
                                                                                                                       //
    return qrsSrv + path;                                                                                              // 94
}                                                                                                                      // 95
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"QRSFunctionsApp.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/server/QRSFunctionsApp.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _regenerator = require("babel-runtime/regenerator");                                                               //
                                                                                                                       //
var _regenerator2 = _interopRequireDefault(_regenerator);                                                              //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
module.export({                                                                                                        // 1
    uploadAndPublishTemplateApps: function () {                                                                        // 1
        return uploadAndPublishTemplateApps;                                                                           // 1
    },                                                                                                                 // 1
    generateStreamAndApp: function () {                                                                                // 1
        return generateStreamAndApp;                                                                                   // 1
    },                                                                                                                 // 1
    setAppIDs: function () {                                                                                           // 1
        return setAppIDs;                                                                                              // 1
    },                                                                                                                 // 1
    createAppConnections: function () {                                                                                // 1
        return createAppConnections;                                                                                   // 1
    },                                                                                                                 // 1
    createAppConnection: function () {                                                                                 // 1
        return createAppConnection;                                                                                    // 1
    },                                                                                                                 // 1
    copyApp: function () {                                                                                             // 1
        return copyApp;                                                                                                // 1
    },                                                                                                                 // 1
    getApps: function () {                                                                                             // 1
        return getApps;                                                                                                // 1
    },                                                                                                                 // 1
    deleteApp: function () {                                                                                           // 1
        return deleteApp;                                                                                              // 1
    },                                                                                                                 // 1
    publishApp: function () {                                                                                          // 1
        return publishApp;                                                                                             // 1
    },                                                                                                                 // 1
    importApp: function () {                                                                                           // 1
        return importApp;                                                                                              // 1
    }                                                                                                                  // 1
});                                                                                                                    // 1
var Meteor = void 0;                                                                                                   // 1
module.watch(require("meteor/meteor"), {                                                                               // 1
    Meteor: function (v) {                                                                                             // 1
        Meteor = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var http = void 0;                                                                                                     // 1
module.watch(require("meteor/meteor"), {                                                                               // 1
    http: function (v) {                                                                                               // 1
        http = v;                                                                                                      // 1
    }                                                                                                                  // 1
}, 1);                                                                                                                 // 1
var Apps = void 0,                                                                                                     // 1
    TemplateApps = void 0,                                                                                             // 1
    GeneratedResources = void 0;                                                                                       // 1
module.watch(require("/imports/api/apps"), {                                                                           // 1
    Apps: function (v) {                                                                                               // 1
        Apps = v;                                                                                                      // 1
    },                                                                                                                 // 1
    TemplateApps: function (v) {                                                                                       // 1
        TemplateApps = v;                                                                                              // 1
    },                                                                                                                 // 1
    GeneratedResources: function (v) {                                                                                 // 1
        GeneratedResources = v;                                                                                        // 1
    }                                                                                                                  // 1
}, 2);                                                                                                                 // 1
var QSStream = void 0;                                                                                                 // 1
module.watch(require("/imports/api/server/QRSFunctionsStream"), {                                                      // 1
    "*": function (v) {                                                                                                // 1
        QSStream = v;                                                                                                  // 1
    }                                                                                                                  // 1
}, 3);                                                                                                                 // 1
var gitHubLinks = void 0;                                                                                              // 1
module.watch(require("/imports/ui/UIHelpers"), {                                                                       // 1
    gitHubLinks: function (v) {                                                                                        // 1
        gitHubLinks = v;                                                                                               // 1
    }                                                                                                                  // 1
}, 4);                                                                                                                 // 1
var Streams = void 0;                                                                                                  // 1
module.watch(require("/imports/api/streams"), {                                                                        // 1
    Streams: function (v) {                                                                                            // 1
        Streams = v;                                                                                                   // 1
    }                                                                                                                  // 1
}, 5);                                                                                                                 // 1
var Customers = void 0;                                                                                                // 1
module.watch(require("/imports/api/customers"), {                                                                      // 1
    Customers: function (v) {                                                                                          // 1
        Customers = v;                                                                                                 // 1
    }                                                                                                                  // 1
}, 6);                                                                                                                 // 1
var createVirtualProxies = void 0;                                                                                     // 1
module.watch(require("/imports/api/server/QPSFunctions"), {                                                            // 1
    createVirtualProxies: function (v) {                                                                               // 1
        createVirtualProxies = v;                                                                                      // 1
    }                                                                                                                  // 1
}, 7);                                                                                                                 // 1
                                                                                                                       //
var qlikHDRServer = void 0,                                                                                            // 1
    senseConfig = void 0,                                                                                              // 1
    enigmaServerConfig = void 0,                                                                                       // 1
    authHeaders = void 0,                                                                                              // 1
    qrsSrv = void 0,                                                                                                   // 1
    qrs = void 0,                                                                                                      // 1
    QRSconfig = void 0,                                                                                                // 1
    _SSBIApp = void 0,                                                                                                 // 1
    configCerticates = void 0,                                                                                         // 1
    _slideGeneratorAppId = void 0;                                                                                     // 1
                                                                                                                       //
module.watch(require("/imports/api/config.js"), {                                                                      // 1
    qlikHDRServer: function (v) {                                                                                      // 1
        qlikHDRServer = v;                                                                                             // 1
    },                                                                                                                 // 1
    senseConfig: function (v) {                                                                                        // 1
        senseConfig = v;                                                                                               // 1
    },                                                                                                                 // 1
    enigmaServerConfig: function (v) {                                                                                 // 1
        enigmaServerConfig = v;                                                                                        // 1
    },                                                                                                                 // 1
    authHeaders: function (v) {                                                                                        // 1
        authHeaders = v;                                                                                               // 1
    },                                                                                                                 // 1
    qrsSrv: function (v) {                                                                                             // 1
        qrsSrv = v;                                                                                                    // 1
    },                                                                                                                 // 1
    qrs: function (v) {                                                                                                // 1
        qrs = v;                                                                                                       // 1
    },                                                                                                                 // 1
    QRSconfig: function (v) {                                                                                          // 1
        QRSconfig = v;                                                                                                 // 1
    },                                                                                                                 // 1
    _SSBIApp: function (v) {                                                                                           // 1
        _SSBIApp = v;                                                                                                  // 1
    },                                                                                                                 // 1
    configCerticates: function (v) {                                                                                   // 1
        configCerticates = v;                                                                                          // 1
    },                                                                                                                 // 1
    _slideGeneratorAppId: function (v) {                                                                               // 1
        _slideGeneratorAppId = v;                                                                                      // 1
    }                                                                                                                  // 1
}, 8);                                                                                                                 // 1
var APILogs = void 0,                                                                                                  // 1
    REST_Log = void 0;                                                                                                 // 1
module.watch(require("/imports/api/APILogs"), {                                                                        // 1
    APILogs: function (v) {                                                                                            // 1
        APILogs = v;                                                                                                   // 1
    },                                                                                                                 // 1
    REST_Log: function (v) {                                                                                           // 1
        REST_Log = v;                                                                                                  // 1
    }                                                                                                                  // 1
}, 9);                                                                                                                 // 1
var lodash = void 0;                                                                                                   // 1
module.watch(require("lodash"), {                                                                                      // 1
    "default": function (v) {                                                                                          // 1
        lodash = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 10);                                                                                                                // 1
_ = lodash; //                                                                                                         // 48
// ─── INSTALL NPM MODULES ────────────────────────────────────────────────────────                                    // 51
//                                                                                                                     // 52
                                                                                                                       //
var path = require('path');                                                                                            // 53
                                                                                                                       //
var fs = require('fs-extra');                                                                                          // 54
                                                                                                                       //
var enigma = require('enigma.js');                                                                                     // 55
                                                                                                                       //
var promise = require('bluebird');                                                                                     // 56
                                                                                                                       //
var request = require('request');                                                                                      // 57
                                                                                                                       //
var sanitize = require("sanitize-filename"); //                                                                        // 58
// ─── UPLOAD APPS FOR THE INITIAL SETUP OF QLIK SENSE ─────────────────────────                                       // 62
//                                                                                                                     // 63
// UPLOAD TEMPLATES APPS FROM FOLDER, AND PUBLISH INTO THE TEMPLATES STREAM                                            // 66
                                                                                                                       //
                                                                                                                       //
function uploadAndPublishTemplateApps() {                                                                              // 67
    var _this = this;                                                                                                  // 67
                                                                                                                       //
    var newFolder, everyOneStreamId, templateStreamId, APIAppsStreamID, appsInFolder;                                  // 67
    return _regenerator2.default.async(function () {                                                                   // 67
        function uploadAndPublishTemplateApps$(_context2) {                                                            // 67
            while (1) {                                                                                                // 67
                switch (_context2.prev = _context2.next) {                                                             // 67
                    case 0:                                                                                            // 67
                        console.log('------------------------------------');                                           // 68
                        console.log('uploadAndPublishTemplateApps');                                                   // 69
                        console.log('------------------------------------');                                           // 70
                        newFolder = path.join(Meteor.settings.broker.automationBaseFolder, 'apps');                    // 71
                        console.log('uploadAndPublishTemplateApps: Read all files in the template apps folder "' + newFolder + '" and upload them to Qlik Sense.'); //GET THE ID OF THE IMPORTANT STREAMS (streams that QRSMeteor needs)
                                                                                                                       //
                        everyOneStreamId = QSStream.getStreamByName(Meteor.settings.public.EveryoneAppStreamName).id;  // 75
                        templateStreamId = QSStream.getStreamByName(Meteor.settings.public.TemplateAppStreamName).id;  // 76
                        APIAppsStreamID = QSStream.getStreamByName(Meteor.settings.public.APIAppStreamName).id;        // 77
                        _context2.prev = 8;                                                                            // 67
                        check(newFolder, String);                                                                      // 79
                        check(everyOneStreamId, String);                                                               // 80
                        check(templateStreamId, String);                                                               // 81
                        check(APIAppsStreamID, String);                                                                // 82
                        _context2.next = 19;                                                                           // 67
                        break;                                                                                         // 67
                                                                                                                       //
                    case 15:                                                                                           // 67
                        _context2.prev = 15;                                                                           // 67
                        _context2.t0 = _context2["catch"](8);                                                          // 67
                        console.error('You did not specify the templateAppsFrom, everyone, api apps or template stream name in the settings.json file?');
                        throw new Meteor.Error('Missing Settings', 'You did not specify the everone, api apps or template stream name in the settings.json file?');
                                                                                                                       //
                    case 19:                                                                                           // 67
                        _context2.next = 21;                                                                           // 67
                        return _regenerator2.default.awrap(fs.readdir(newFolder));                                     // 67
                                                                                                                       //
                    case 21:                                                                                           // 67
                        appsInFolder = _context2.sent;                                                                 // 89
                        _context2.next = 24;                                                                           // 67
                        return _regenerator2.default.awrap(Promise.all(appsInFolder.map(function () {                  // 67
                            function _callee(QVF) {                                                                    // 92
                                var appName, filePath, appId, copiedAppId;                                             // 92
                                return _regenerator2.default.async(function () {                                       // 92
                                    function _callee$(_context) {                                                      // 92
                                        while (1) {                                                                    // 92
                                            switch (_context.prev = _context.next) {                                   // 92
                                                case 0:                                                                // 92
                                                    _context.prev = 0;                                                 // 92
                                                    //GET THE NAME OF THE APP AND CREATE A FILEPATH                    // 94
                                                    appName = QVF.substr(0, QVF.indexOf('.'));                         // 95
                                                    filePath = path.join(newFolder, QVF); //ONLY UPLOAD APPS IF THEY DO NOT ALREADY EXIST
                                                                                                                       //
                                                    if (getApps(appName).length) {                                     // 92
                                                        _context.next = 10;                                            // 92
                                                        break;                                                         // 92
                                                    }                                                                  // 92
                                                                                                                       //
                                                    _context.next = 6;                                                 // 92
                                                    return _regenerator2.default.awrap(uploadApp(filePath, appName));  // 92
                                                                                                                       //
                                                case 6:                                                                // 92
                                                    appId = _context.sent;                                             // 101
                                                                                                                       //
                                                    //BASED ON THE APP WE WANT TO PUBLISH IT INTO A DIFFERENT STREAM                      
                                                    if (appName === 'SSBI') {                                          // 104
                                                        //should be published in the everyone stream                   // 104
                                                        _SSBIApp = appId; // for the client side HTML/IFrames etc.                                
                                                                                                                       //
                                                        publishApp(appId, appName, everyOneStreamId);                  // 106
                                                    } else if (appName === 'Sales') {                                  // 107
                                                        //THIS ONE NEEDS TO BE COPIED AND PUBLISHED INTO 2 STREAMS: AS TEMPLATE AND FOR THE EVERYONE STREAM.
                                                        publishApp(appId, appName, everyOneStreamId);                  // 108
                                                        copiedAppId = copyApp(appId, appName);                         // 109
                                                        publishApp(copiedAppId, appName, templateStreamId);            // 110
                                                    } else if (appName === 'Slide generator') {                        // 111
                                                        _slideGeneratorAppId = appId, publishApp(appId, appName, APIAppsStreamID);
                                                    } else {                                                           // 114
                                                        //Insert into template apps stream                             // 115
                                                        publishApp(appId, appName, templateStreamId);                  // 116
                                                    }                                                                  // 117
                                                                                                                       //
                                                    _context.next = 11;                                                // 92
                                                    break;                                                             // 92
                                                                                                                       //
                                                case 10:                                                               // 92
                                                    console.log('App ' + appName + ' already exists in Qlik Sense');   // 119
                                                                                                                       //
                                                case 11:                                                               // 92
                                                    ;                                                                  // 120
                                                    _context.next = 18;                                                // 92
                                                    break;                                                             // 92
                                                                                                                       //
                                                case 14:                                                               // 92
                                                    _context.prev = 14;                                                // 92
                                                    _context.t0 = _context["catch"](0);                                // 92
                                                    console.error(_context.t0);                                        // 122
                                                    throw new Meteor.Error('Unable to upload the app to Qlik Sense. ', _context.t0);
                                                                                                                       //
                                                case 18:                                                               // 92
                                                case "end":                                                            // 92
                                                    return _context.stop();                                            // 92
                                            }                                                                          // 92
                                        }                                                                              // 92
                                    }                                                                                  // 92
                                                                                                                       //
                                    return _callee$;                                                                   // 92
                                }(), null, _this, [[0, 14]]);                                                          // 92
                            }                                                                                          // 92
                                                                                                                       //
                            return _callee;                                                                            // 92
                        }())));                                                                                        // 92
                                                                                                                       //
                    case 24:                                                                                           // 67
                        return _context2.abrupt("return", _context2.sent);                                             // 67
                                                                                                                       //
                    case 25:                                                                                           // 67
                    case "end":                                                                                        // 67
                        return _context2.stop();                                                                       // 67
                }                                                                                                      // 67
            }                                                                                                          // 67
        }                                                                                                              // 67
                                                                                                                       //
        return uploadAndPublishTemplateApps$;                                                                          // 67
    }(), null, this, [[8, 15]]);                                                                                       // 67
}                                                                                                                      // 67
                                                                                                                       //
function generateStreamAndApp(customers, generationUserId) {                                                           // 128
    var templateApps, _iterator, _isArray, _i, _ref, customer, _iterator2, _isArray2, _i2, _ref2, _templateApp;        // 128
                                                                                                                       //
    return _regenerator2.default.async(function () {                                                                   // 128
        function generateStreamAndApp$(_context3) {                                                                    // 128
            while (1) {                                                                                                // 128
                switch (_context3.prev = _context3.next) {                                                             // 128
                    case 0:                                                                                            // 128
                        // console.log('METHOD called: generateStreamAndApp for the template apps as stored in the database of the fictive OEM');
                        templateApps = checkTemplateAppExists(generationUserId); //is a template app selected, and does the guid still exist in Sense? if yes, return the valid templates
                                                                                                                       //
                        checkCustomersAreSelected(customers); //have we selected a  customer to do the generation for?
                                                                                                                       //
                        _iterator = customers, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();
                                                                                                                       //
                    case 3:                                                                                            // 128
                        if (!_isArray) {                                                                               // 128
                            _context3.next = 9;                                                                        // 128
                            break;                                                                                     // 128
                        }                                                                                              // 128
                                                                                                                       //
                        if (!(_i >= _iterator.length)) {                                                               // 128
                            _context3.next = 6;                                                                        // 128
                            break;                                                                                     // 128
                        }                                                                                              // 128
                                                                                                                       //
                        return _context3.abrupt("break", 32);                                                          // 128
                                                                                                                       //
                    case 6:                                                                                            // 128
                        _ref = _iterator[_i++];                                                                        // 128
                        _context3.next = 13;                                                                           // 128
                        break;                                                                                         // 128
                                                                                                                       //
                    case 9:                                                                                            // 128
                        _i = _iterator.next();                                                                         // 128
                                                                                                                       //
                        if (!_i.done) {                                                                                // 128
                            _context3.next = 12;                                                                       // 128
                            break;                                                                                     // 128
                        }                                                                                              // 128
                                                                                                                       //
                        return _context3.abrupt("break", 32);                                                          // 128
                                                                                                                       //
                    case 12:                                                                                           // 128
                        _ref = _i.value;                                                                               // 128
                                                                                                                       //
                    case 13:                                                                                           // 128
                        customer = _ref;                                                                               // 133
                        _iterator2 = templateApps, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();
                                                                                                                       //
                    case 15:                                                                                           // 128
                        if (!_isArray2) {                                                                              // 128
                            _context3.next = 21;                                                                       // 128
                            break;                                                                                     // 128
                        }                                                                                              // 128
                                                                                                                       //
                        if (!(_i2 >= _iterator2.length)) {                                                             // 128
                            _context3.next = 18;                                                                       // 128
                            break;                                                                                     // 128
                        }                                                                                              // 128
                                                                                                                       //
                        return _context3.abrupt("break", 30);                                                          // 128
                                                                                                                       //
                    case 18:                                                                                           // 128
                        _ref2 = _iterator2[_i2++];                                                                     // 128
                        _context3.next = 25;                                                                           // 128
                        break;                                                                                         // 128
                                                                                                                       //
                    case 21:                                                                                           // 128
                        _i2 = _iterator2.next();                                                                       // 128
                                                                                                                       //
                        if (!_i2.done) {                                                                               // 128
                            _context3.next = 24;                                                                       // 128
                            break;                                                                                     // 128
                        }                                                                                              // 128
                                                                                                                       //
                        return _context3.abrupt("break", 30);                                                          // 128
                                                                                                                       //
                    case 24:                                                                                           // 128
                        _ref2 = _i2.value;                                                                             // 128
                                                                                                                       //
                    case 25:                                                                                           // 128
                        _templateApp = _ref2;                                                                          // 134
                        _context3.next = 28;                                                                           // 128
                        return _regenerator2.default.awrap(generateAppForTemplate(_templateApp, customer, generationUserId));
                                                                                                                       //
                    case 28:                                                                                           // 128
                        _context3.next = 15;                                                                           // 128
                        break;                                                                                         // 128
                                                                                                                       //
                    case 30:                                                                                           // 128
                        _context3.next = 3;                                                                            // 128
                        break;                                                                                         // 128
                                                                                                                       //
                    case 32:                                                                                           // 128
                        ;                                                                                              // 137
                                                                                                                       //
                    case 33:                                                                                           // 128
                    case "end":                                                                                        // 128
                        return _context3.stop();                                                                       // 128
                }                                                                                                      // 128
            }                                                                                                          // 128
        }                                                                                                              // 128
                                                                                                                       //
        return generateStreamAndApp$;                                                                                  // 128
    }(), null, this);                                                                                                  // 128
}                                                                                                                      // 128
                                                                                                                       //
;                                                                                                                      // 138
                                                                                                                       //
function setAppIDs(params) {                                                                                           // 140
    console.log('------------------------------------');                                                               // 141
    console.log('SET APP IDs');                                                                                        // 142
    console.log('------------------------------------');                                                               // 143
                                                                                                                       //
    try {                                                                                                              // 144
        console.log('check if all settings.json parameters are set...');                                               // 145
        check(Meteor.settings.public.slideGenerator, {                                                                 // 146
            name: String,                                                                                              // 147
            stream: String,                                                                                            // 148
            selectionSheet: String,                                                                                    // 149
            dataObject: String,                                                                                        // 150
            slideObject: String,                                                                                       // 151
            virtualProxy: String                                                                                       // 152
        });                                                                                                            // 146
        check(Meteor.settings.public.SSBI, {                                                                           // 154
            name: String,                                                                                              // 155
            stream: String,                                                                                            // 156
            sheetId: String                                                                                            // 157
        });                                                                                                            // 154
    } catch (err) {                                                                                                    // 159
        console.error('Missing parameters in your settings.json file for the SSBI or slidegenerator...', err);         // 160
    }                                                                                                                  // 161
                                                                                                                       //
    try {                                                                                                              // 163
        var slideGeneratorApps = getApps(Meteor.settings.public.slideGenerator.name, Meteor.settings.public.slideGenerator.stream);
        var SSBIApps = getApps(Meteor.settings.public.SSBI.name, Meteor.settings.public.SSBI.stream);                  // 165
                                                                                                                       //
        if (slideGeneratorApps.length > 1) {                                                                           // 166
            throw new Error('Can not automatically set the app ID for the slide generator. You have not one but you have multiple slide generator apps under the name ' + Meteor.settings.public.slideGenerator.name + ' in the stream ' + Meteor.settings.public.slideGenerator.stream);
        }                                                                                                              // 168
                                                                                                                       //
        if (SSBIApps.length > 1) {                                                                                     // 169
            throw new Error('Can not automatically set the app ID for the Self Service BI app. You have not one but you have multiple Self Service apps under the name ' + Meteor.settings.public.SSBI.name + ' in the stream ' + Meteor.settings.public.SSBI.stream);
        }                                                                                                              // 171
                                                                                                                       //
        senseConfig.SSBIApp = SSBIApps[0].id; //                                                                       // 172
                                                                                                                       //
        console.log('The SSBI app id has been set to ', senseConfig.SSBIApp);                                          // 173
        senseConfig.slideGeneratorAppId = slideGeneratorApps[0].id;                                                    // 175
        console.log('The slide generator app id has been set to ', senseConfig.slideGeneratorAppId);                   // 176
    } catch (err) {                                                                                                    // 177
        console.error(err);                                                                                            // 178
        throw new Meteor.Error('The slideGenerator or Self Service BI app can not be found in Qlik sense, or you did not have all parameters set as defined in the the settings.json example file.', err);
    }                                                                                                                  // 180
}                                                                                                                      // 181
                                                                                                                       //
function generateAppForTemplate(templateApp, customer, generationUserId) {                                             // 184
    var call, streamId, customerDataFolder, newAppId, result, publishedAppId, _call;                                   // 184
                                                                                                                       //
    return _regenerator2.default.async(function () {                                                                   // 184
        function generateAppForTemplate$(_context4) {                                                                  // 184
            while (1) {                                                                                                // 184
                switch (_context4.prev = _context4.next) {                                                             // 184
                    case 0:                                                                                            // 184
                        console.log('--------------------------GENERATE APPS FOR TEMPLATE'); // console.log(templateApp);
                        // console.log('############## START CREATING THE TEMPLATE ' + templateApp.name + ' FOR THIS CUSTOMER: ' + customer.name + ' FOR generationUserId: ' + generationUserId);
                                                                                                                       //
                        call = {};                                                                                     // 188
                        call.action = 'Start of generation of app ' + templateApp.name + ' for ' + customer.name;      // 189
                        call.createdBy = generationUserId;                                                             // 190
                        call.request = 'Start creating app ' + templateApp.name + ' for customer ' + customer.name;    // 191
                        REST_Log(call, generationUserId);                                                              // 192
                        _context4.prev = 6;                                                                            // 184
                        streamId = checkStreamStatus(customer, generationUserId); //create a stream for the customer if it not already exists 
                                                                                                                       //
                        _context4.next = 10;                                                                           // 184
                        return _regenerator2.default.awrap(createDirectory(customer.name));                            // 184
                                                                                                                       //
                    case 10:                                                                                           // 184
                        customerDataFolder = _context4.sent;                                                           // 196
                        _context4.next = 13;                                                                           // 184
                        return _regenerator2.default.awrap(createAppConnection('folder', customer.name, customerDataFolder));
                                                                                                                       //
                    case 13:                                                                                           // 184
                        newAppId = copyApp(templateApp.id, templateApp.name, generationUserId);                        // 198
                        result = reloadAppAndReplaceScriptviaEngine(newAppId, templateApp.name, streamId, customer, customerDataFolder, '', generationUserId);
                        publishedAppId = publishApp(newAppId, templateApp.name, streamId, customer.name, generationUserId); //logging only
                                                                                                                       //
                        _call = {};                                                                                    // 203
                        _call.action = 'Finished generation for ' + customer.name;                                     // 204
                        _call.request = templateApp.name + ' has been created and reloaded with data from the ' + customer.name + ' database';
                        REST_Log(_call, generationUserId);                                                             // 206
                        console.log('############## FINISHED CREATING THE TEMPLATE ' + templateApp.name + ' FOR THIS CUSTOMER: ' + customer.name);
                        GeneratedResources.insert({                                                                    // 208
                            'generationUserId': generationUserId,                                                      // 209
                            'customer': customer.name,                                                                 // 210
                            'streamId': streamId,                                                                      // 211
                            'appId': newAppId                                                                          // 212
                        });                                                                                            // 208
                        _context4.next = 28;                                                                           // 184
                        break;                                                                                         // 184
                                                                                                                       //
                    case 24:                                                                                           // 184
                        _context4.prev = 24;                                                                           // 184
                        _context4.t0 = _context4["catch"](6);                                                          // 184
                        console.error('Failed to generate...', _context4.t0);                                          // 215
                        throw new Meteor.Error('Generation failed', 'The server has an internal error, please check the server command logs');
                                                                                                                       //
                    case 28:                                                                                           // 184
                        return _context4.abrupt("return");                                                             // 184
                                                                                                                       //
                    case 29:                                                                                           // 184
                    case "end":                                                                                        // 184
                        return _context4.stop();                                                                       // 184
                }                                                                                                      // 184
            }                                                                                                          // 184
        }                                                                                                              // 184
                                                                                                                       //
        return generateAppForTemplate$;                                                                                // 184
    }(), null, this, [[6, 24]]);                                                                                       // 184
}                                                                                                                      // 184
                                                                                                                       //
; //Example to demo that you can also use the Engine API to get all the apps, or reload an app, set the script etc.    // 219
//source based on loic's work: https://github.com/pouc/qlik-elastic/blob/master/app.js                                 // 223
                                                                                                                       //
function reloadAppAndReplaceScriptviaEngine(appId, newAppName, streamId, customer, customerDataFolder, scriptReplace, generationUserId) {
    var config, qix, call, qConnectionId, script, replaceScript;                                                       // 224
    return _regenerator2.default.async(function () {                                                                   // 224
        function reloadAppAndReplaceScriptviaEngine$(_context5) {                                                      // 224
            while (1) {                                                                                                // 224
                switch (_context5.prev = _context5.next) {                                                             // 224
                    case 0:                                                                                            // 224
                        replaceScript = function () {                                                                  // 300
                            function replaceScript(script) {                                                           // 224
                                //var scriptMarker = '§dummyDatabaseString§';                                          // 301
                                // if you want to replace the database connection per customer use the script below.   // 302
                                //return doc.setScript(script.replace(scriptMarker, scriptReplace)).then(function (result) {
                                //you can also change the sense database connection: https://github.com/mindspank/qsocks/blob/master/examples/App/create-dataconnection.js
                                return script;                                                                         // 305
                            }                                                                                          // 306
                                                                                                                       //
                            return replaceScript;                                                                      // 224
                        }();                                                                                           // 224
                                                                                                                       //
                        console.log('--------------------------REPLACE SCRIPT AND RELOAD APP'); //set the app ID to be used in the enigma connection to the engine API
                                                                                                                       //
                        config = Object.assign({}, enigmaServerConfig);                                                // 228
                        config.appId = appId;                                                                          // 229
                        _context5.prev = 4;                                                                            // 224
                        check(appId, String);                                                                          // 232
                        check(customer.name, String);                                                                  // 233
                        check(customerDataFolder, String);                                                             // 234
                        check(generationUserId, String); //connect to the engine                                       // 235
                                                                                                                       //
                        _context5.next = 11;                                                                           // 224
                        return _regenerator2.default.awrap(enigma.getService('qix', config));                          // 224
                                                                                                                       //
                    case 11:                                                                                           // 224
                        qix = _context5.sent;                                                                          // 237
                        call = {};                                                                                     // 238
                        call.action = 'Connect to Qlik Sense';                                                         // 239
                        call.request = 'Connect to Engine API (using Enigma.js) using an appId: ' + appId;             // 240
                        call.url = gitHubLinks.replaceAndReloadApp;                                                    // 241
                        REST_Log(call, generationUserId);                                                              // 242
                        _context5.prev = 17;                                                                           // 224
                        //create folder connection                                                                     // 245
                        console.log('create folder connection, if you see a warning below that means the connection already existed.');
                        _context5.next = 21;                                                                           // 224
                        return _regenerator2.default.awrap(qix.app.createConnection({                                  // 224
                            "qName": customer.name,                                                                    // 248
                            "qType": "folder",                                                                         // 249
                            "qConnectionString": customerDataFolder                                                    // 250
                        }));                                                                                           // 247
                                                                                                                       //
                    case 21:                                                                                           // 224
                        qConnectionId = _context5.sent;                                                                // 247
                        call = {};                                                                                     // 252
                        call.action = 'Create data/folder connection';                                                 // 253
                        call.url = '';                                                                                 // 254
                        call.request = 'Link to a folder on the server where users can put files/QVD, or create a REST/ODBC/OLEDB... database connection.';
                        call.response = 'created folder connection: ' + qConnectionId;                                 // 256
                        console.log('created folder connection: ', qConnectionId);                                     // 257
                        _context5.next = 33;                                                                           // 224
                        break;                                                                                         // 224
                                                                                                                       //
                    case 30:                                                                                           // 224
                        _context5.prev = 30;                                                                           // 224
                        _context5.t0 = _context5["catch"](17);                                                         // 224
                        console.info('No issue, existing customer so his data folder connection already exists', _context5.t0);
                                                                                                                       //
                    case 33:                                                                                           // 224
                        _context5.next = 35;                                                                           // 224
                        return _regenerator2.default.awrap(qix.app.getScript());                                       // 224
                                                                                                                       //
                    case 35:                                                                                           // 224
                        script = _context5.sent;                                                                       // 263
                        call = {};                                                                                     // 264
                        call.action = 'Get data load script';                                                          // 265
                        call.url = gitHubLinks.getScript;                                                              // 266
                        call.request = 'We extracted the following load script from the app';                          // 267
                        call.response = script;                                                                        // 268
                        REST_Log(call, generationUserId); //set the new script                                         // 269
                                                                                                                       //
                        call = {};                                                                                     // 272
                        _context5.next = 45;                                                                           // 224
                        return _regenerator2.default.awrap(qix.app.setScript(replaceScript(script)));                  // 224
                                                                                                                       //
                    case 45:                                                                                           // 224
                        call.response = _context5.sent;                                                                // 273
                        //we now just include the old script in this app                                               // 273
                        call.action = 'Insert customer specific data load script for its database';                    // 274
                        call.url = gitHubLinks.setScript;                                                              // 275
                        call.request = 'The script of the app has been replaced with a customer specific one. Normally you would replace the database connection for each customer. Or you can insert a customer specific script to enable customization per customer. ';
                        REST_Log(call, generationUserId); //reload the app                                             // 277
                                                                                                                       //
                        call = {};                                                                                     // 280
                        _context5.next = 53;                                                                           // 224
                        return _regenerator2.default.awrap(qix.app.doReload());                                        // 224
                                                                                                                       //
                    case 53:                                                                                           // 224
                        call.response = _context5.sent;                                                                // 281
                        call.action = 'Reload the app';                                                                // 282
                        call.url = gitHubLinks.reloadApp;                                                              // 283
                        call.request = 'Has the app been reloaded with customer specific data?';                       // 284
                        REST_Log(call, generationUserId); //save the app                                               // 285
                                                                                                                       //
                        call = {};                                                                                     // 288
                        call.action = 'Save app';                                                                      // 289
                        call.url = gitHubLinks.saveApp;                                                                // 290
                        call.request = 'App with GUID ' + appId + ' has been saved to disk';                           // 291
                        REST_Log(call, generationUserId);                                                              // 292
                        _context5.next = 65;                                                                           // 224
                        return _regenerator2.default.awrap(qix.app.doSave());                                          // 224
                                                                                                                       //
                    case 65:                                                                                           // 224
                        REST_Log(call, generationUserId);                                                              // 295
                        _context5.next = 71;                                                                           // 224
                        break;                                                                                         // 224
                                                                                                                       //
                    case 68:                                                                                           // 224
                        _context5.prev = 68;                                                                           // 224
                        _context5.t1 = _context5["catch"](4);                                                          // 224
                        console.error('error in reloadAppAndReplaceScriptviaEngine via Enigma.JS, did you used the correct schema definition in the settings.json file?', _context5.t1);
                                                                                                                       //
                    case 71:                                                                                           // 224
                    case "end":                                                                                        // 224
                        return _context5.stop();                                                                       // 224
                }                                                                                                      // 224
            }                                                                                                          // 224
        }                                                                                                              // 224
                                                                                                                       //
        return reloadAppAndReplaceScriptviaEngine$;                                                                    // 224
    }(), null, this, [[4, 68], [17, 30]]);                                                                             // 224
}                                                                                                                      // 224
                                                                                                                       //
function createAppConnections() {                                                                                      // 308
    var senseDemoMaterials, _iterator3, _isArray3, _i3, _ref3, c;                                                      // 308
                                                                                                                       //
    return _regenerator2.default.async(function () {                                                                   // 308
        function createAppConnections$(_context6) {                                                                    // 308
            while (1) {                                                                                                // 308
                switch (_context6.prev = _context6.next) {                                                             // 308
                    case 0:                                                                                            // 308
                        console.log('------------------------------------');                                           // 309
                        console.log('create app connections');                                                         // 310
                        console.log('------------------------------------'); //create the default demo import folder where all the csv and qvf files are...
                                                                                                                       //
                        senseDemoMaterials = path.join(Meteor.absolutePath, 'Sense Demo materials');                   // 313
                        console.log('senseDemoMaterials', senseDemoMaterials);                                         // 314
                        _context6.next = 7;                                                                            // 308
                        return _regenerator2.default.awrap(createAppConnection('folder', 'Import demo', senseDemoMaterials));
                                                                                                                       //
                    case 7:                                                                                            // 308
                        _iterator3 = Meteor.settings.broker.dataConnections, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();
                                                                                                                       //
                    case 8:                                                                                            // 308
                        if (!_isArray3) {                                                                              // 308
                            _context6.next = 14;                                                                       // 308
                            break;                                                                                     // 308
                        }                                                                                              // 308
                                                                                                                       //
                        if (!(_i3 >= _iterator3.length)) {                                                             // 308
                            _context6.next = 11;                                                                       // 308
                            break;                                                                                     // 308
                        }                                                                                              // 308
                                                                                                                       //
                        return _context6.abrupt("break", 23);                                                          // 308
                                                                                                                       //
                    case 11:                                                                                           // 308
                        _ref3 = _iterator3[_i3++];                                                                     // 308
                        _context6.next = 18;                                                                           // 308
                        break;                                                                                         // 308
                                                                                                                       //
                    case 14:                                                                                           // 308
                        _i3 = _iterator3.next();                                                                       // 308
                                                                                                                       //
                        if (!_i3.done) {                                                                               // 308
                            _context6.next = 17;                                                                       // 308
                            break;                                                                                     // 308
                        }                                                                                              // 308
                                                                                                                       //
                        return _context6.abrupt("break", 23);                                                          // 308
                                                                                                                       //
                    case 17:                                                                                           // 308
                        _ref3 = _i3.value;                                                                             // 308
                                                                                                                       //
                    case 18:                                                                                           // 308
                        c = _ref3;                                                                                     // 316
                        _context6.next = 21;                                                                           // 308
                        return _regenerator2.default.awrap(createAppConnection(c.type, c.name, c.connectionString));   // 308
                                                                                                                       //
                    case 21:                                                                                           // 308
                        _context6.next = 8;                                                                            // 308
                        break;                                                                                         // 308
                                                                                                                       //
                    case 23:                                                                                           // 308
                    case "end":                                                                                        // 308
                        return _context6.stop();                                                                       // 308
                }                                                                                                      // 308
            }                                                                                                          // 308
        }                                                                                                              // 308
                                                                                                                       //
        return createAppConnections$;                                                                                  // 308
    }(), null, this);                                                                                                  // 308
}                                                                                                                      // 308
                                                                                                                       //
function createAppConnection(type, name, path) {                                                                       // 321
    var config, qix, qConnectionId;                                                                                    // 321
    return _regenerator2.default.async(function () {                                                                   // 321
        function createAppConnection$(_context7) {                                                                     // 321
            while (1) {                                                                                                // 321
                switch (_context7.prev = _context7.next) {                                                             // 321
                    case 0:                                                                                            // 321
                        //set the app ID to be used in the enigma connection to the engine API                         // 323
                        config = Object.assign({}, enigmaServerConfig);                                                // 324
                        config.appId = getApps('sales', 'Everyone')[0].id;                                             // 325
                        console.log('createAppConnection: ' + type + ' ' + name + ' ' + path + ' using the sales app in the everyone stream to create the connection: ' + config.appId);
                                                                                                                       //
                        try {                                                                                          // 327
                            check(type, String);                                                                       // 328
                            check(path, String);                                                                       // 329
                            check(name, String);                                                                       // 330
                            check(config.appId, String);                                                               // 331
                        } catch (error) {                                                                              // 332
                            console.error('Missing parameters to create a data connection', error);                    // 333
                        }                                                                                              // 334
                                                                                                                       //
                        _context7.prev = 4;                                                                            // 321
                        _context7.next = 7;                                                                            // 321
                        return _regenerator2.default.awrap(enigma.getService('qix', config));                          // 321
                                                                                                                       //
                    case 7:                                                                                            // 321
                        qix = _context7.sent;                                                                          // 338
                        //create folder connection                                                                     // 340
                        console.log('create folder connection, if you see a warning below that means the connection already existed.');
                        _context7.next = 11;                                                                           // 321
                        return _regenerator2.default.awrap(qix.app.createConnection({                                  // 321
                            "qName": name,                                                                             // 343
                            "qType": type,                                                                             // 344
                            "qConnectionString": path                                                                  // 345
                        }));                                                                                           // 342
                                                                                                                       //
                    case 11:                                                                                           // 321
                        qConnectionId = _context7.sent;                                                                // 342
                        console.log('created folder connection: ', qConnectionId);                                     // 347
                        _context7.next = 18;                                                                           // 321
                        break;                                                                                         // 321
                                                                                                                       //
                    case 15:                                                                                           // 321
                        _context7.prev = 15;                                                                           // 321
                        _context7.t0 = _context7["catch"](4);                                                          // 321
                        console.error('Failed to create data connection', _context7.t0);                               // 349
                                                                                                                       //
                    case 18:                                                                                           // 321
                    case "end":                                                                                        // 321
                        return _context7.stop();                                                                       // 321
                }                                                                                                      // 321
            }                                                                                                          // 321
        }                                                                                                              // 321
                                                                                                                       //
        return createAppConnection$;                                                                                   // 321
    }(), null, this, [[4, 15]]);                                                                                       // 321
}                                                                                                                      // 321
                                                                                                                       //
function deleteDirectoryAndDataConnection(customerName) {                                                              // 353
    console.log('deleteDirectoryAndDataConnection'); //@TODO a bit dangerous, so better to do by hand. Make sure you can't delete root folder... 
    // https://stackoverflow.com/questions/18052762/remove-directory-which-is-not-empty                                // 356
}                                                                                                                      // 357
                                                                                                                       //
function createDirectory(customerName) {                                                                               // 359
    var filename, dir;                                                                                                 // 359
    return _regenerator2.default.async(function () {                                                                   // 359
        function createDirectory$(_context8) {                                                                         // 359
            while (1) {                                                                                                // 359
                switch (_context8.prev = _context8.next) {                                                             // 359
                    case 0:                                                                                            // 359
                        console.log('createDirectory TURNED OFF!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!', customerName);   // 360
                        _context8.prev = 1;                                                                            // 359
                        check(customerName, String);                                                                   // 362
                        filename = sanitize(customerName);                                                             // 363
                        dir = path.join(Meteor.settings.broker.customerDataDir, customerName);                         // 364
                        console.log('Meteor.settings.broker.customerDataDir', dir);                                    // 365
                        _context8.next = 8;                                                                            // 359
                        return _regenerator2.default.awrap(fs.ensureDir(dir));                                         // 359
                                                                                                                       //
                    case 8:                                                                                            // 359
                        return _context8.abrupt("return", dir);                                                        // 359
                                                                                                                       //
                    case 11:                                                                                           // 359
                        _context8.prev = 11;                                                                           // 359
                        _context8.t0 = _context8["catch"](1);                                                          // 359
                        throw new Meteor.Error('Failed to create directory for ', customerName);                       // 359
                                                                                                                       //
                    case 14:                                                                                           // 359
                    case "end":                                                                                        // 359
                        return _context8.stop();                                                                       // 359
                }                                                                                                      // 359
            }                                                                                                          // 359
        }                                                                                                              // 359
                                                                                                                       //
        return createDirectory$;                                                                                       // 359
    }(), null, this, [[1, 11]]);                                                                                       // 359
}                                                                                                                      // 359
                                                                                                                       //
function checkCustomersAreSelected(customers) {                                                                        // 374
    if (!customers.length) {                                                                                           // 375
        // = 0                                                                                                         // 375
        throw new Meteor.Error('No customers', 'user has not specified at least one customer for which an app can be generated');
    }                                                                                                                  // 377
}                                                                                                                      // 378
                                                                                                                       //
; // CHECK IF SELECTED TEMPLATE APP EXISTS IN QLIK SENSE                                                               // 378
//These are the apps that the OEM partner has in his database, but do they still exists on the qliks sense side?       // 381
                                                                                                                       //
function checkTemplateAppExists(generationUserId) {                                                                    // 382
    var templateApps = TemplateApps.find({                                                                             // 383
        'generationUserId': Meteor.userId()                                                                            // 384
    }).fetch();                                                                                                        // 383
                                                                                                                       //
    if (templateApps.length === 0) {                                                                                   // 387
        //user has not specified a template                                                                            // 387
        throw new Meteor.Error('No Template', 'user has not specified a template for which apps can be generated');    // 388
    }                                                                                                                  // 389
                                                                                                                       //
    currentAppsInSense = getApps();                                                                                    // 391
                                                                                                                       //
    if (!currentAppsInSense) {                                                                                         // 392
        throw new Meteor.Error('No apps have been received from Qlik Sense. Therefore you have selected a Qlik Sense App: ' + templateApp.name + ' with guid: ' + templateApp.id + ' which does not exist in Sense anymore. Have you deleted the template in Sense?');
    }                                                                                                                  // 394
                                                                                                                       //
    _.each(templateApps, function (templateApp) {                                                                      // 395
        var templateFound = _.some(currentAppsInSense, ['id', templateApp.id]);                                        // 396
                                                                                                                       //
        if (!templateFound) {                                                                                          // 398
            throw new Meteor.Error('You have selected a Qlik Sense App: ' + templateApp.name + ' with guid: ' + templateApp.id + ' which does not exist in Sense anymore. Have you deleted the template in Sense?');
        } else {// console.log('checkTemplateAppExists: True, template guid exist: ', templateApp.id);                 // 400
        }                                                                                                              // 402
    });                                                                                                                // 403
                                                                                                                       //
    return templateApps;                                                                                               // 404
}                                                                                                                      // 405
                                                                                                                       //
; //                                                                                                                   // 405
// ─── UPLOAD APP ─────────────────────────────────────────────────────────────────                                    // 408
//                                                                                                                     // 409
                                                                                                                       //
function uploadApp(filePath, appName) {                                                                                // 412
    return _regenerator2.default.async(function () {                                                                   // 412
        function uploadApp$(_context9) {                                                                               // 412
            while (1) {                                                                                                // 412
                switch (_context9.prev = _context9.next) {                                                             // 412
                    case 0:                                                                                            // 412
                        console.log('Upload app: ' + appName + ' from path: ' + filePath);                             // 413
                        _context9.next = 3;                                                                            // 412
                        return _regenerator2.default.awrap(new Promise(function (resolve, reject) {                    // 412
                            var formData = {                                                                           // 415
                                my_file: fs.createReadStream(filePath)                                                 // 416
                            };                                                                                         // 415
                            request.post({                                                                             // 419
                                url: qlikHDRServer + '/qrs/app/upload?name=' + appName + '&xrfkey=' + senseConfig.xrfkey,
                                headers: {                                                                             // 421
                                    'Content-Type': 'application/vnd.qlik.sense.app',                                  // 422
                                    'hdr-usr': senseConfig.headerValue,                                                // 423
                                    'X-Qlik-xrfkey': senseConfig.xrfkey                                                // 424
                                },                                                                                     // 421
                                formData: formData                                                                     // 426
                            }, function (error, res, body) {                                                           // 419
                                if (!error) {                                                                          // 428
                                    var appId = JSON.parse(body).id;                                                   // 429
                                    console.log('Uploaded "' + appName + '.qvf" to Qlik Sense and got appID: ' + appId);
                                    resolve(appId);                                                                    // 431
                                } else {                                                                               // 432
                                    console.error("Failed to upload app" + appName, error);                            // 433
                                    reject(error);                                                                     // 434
                                }                                                                                      // 435
                            });                                                                                        // 436
                        }));                                                                                           // 437
                                                                                                                       //
                    case 3:                                                                                            // 412
                        return _context9.abrupt("return", _context9.sent);                                             // 412
                                                                                                                       //
                    case 4:                                                                                            // 412
                    case "end":                                                                                        // 412
                        return _context9.stop();                                                                       // 412
                }                                                                                                      // 412
            }                                                                                                          // 412
        }                                                                                                              // 412
                                                                                                                       //
        return uploadApp$;                                                                                             // 412
    }(), null, this);                                                                                                  // 412
} //                                                                                                                   // 412
// ─── COPYAPP ────────────────────────────────────────────────────────────────────                                    // 440
//                                                                                                                     // 441
                                                                                                                       //
                                                                                                                       //
function copyApp(guid, name, generationUserId) {                                                                       // 444
    check(guid, String);                                                                                               // 445
    check(name, String); // console.log('QRS Functions copy App, copy the app id: ' + guid + ' to app with name: ', name);
                                                                                                                       //
    var call = {};                                                                                                     // 448
                                                                                                                       //
    try {                                                                                                              // 450
        call.request = qrsSrv + '/qrs/app/' + guid + '/copy';                                                          // 451
        call.response = HTTP.post(call.request, {                                                                      // 452
            'npmRequestOptions': configCerticates,                                                                     // 453
            params: {                                                                                                  // 454
                'xrfkey': senseConfig.xrfkey,                                                                          // 455
                "name": name                                                                                           // 456
            },                                                                                                         // 454
            data: {}                                                                                                   // 458
        });                                                                                                            // 452
        REST_Log(call, generationUserId);                                                                              // 462
        var newGuid = call.response.data.id; // console.log('Step 2: the new app id is: ', newGuid);                   // 463
        //addTag('App', newGuid);                                                                                      // 465
                                                                                                                       //
        return newGuid;                                                                                                // 466
    } catch (err) {                                                                                                    // 467
        console.error(err);                                                                                            // 468
        call.action = 'Copy app FAILED';                                                                               // 469
        call.response = err.message;                                                                                   // 470
        REST_Log(call, generationUserId);                                                                              // 471
        throw new Meteor.Error('Copy app for selected customers failed', err.message);                                 // 472
    }                                                                                                                  // 473
}                                                                                                                      // 474
                                                                                                                       //
; //                                                                                                                   // 474
// ─── CHECKSTREAMSTATUS ──────────────────────────────────────────────────────────                                    // 477
//                                                                                                                     // 478
                                                                                                                       //
function checkStreamStatus(customer, generationUserId) {                                                               // 481
    // console.log('checkStreamStatus for: ' + customer.name);                                                         // 482
    var stream = Streams.findOne({                                                                                     // 483
        name: customer.name                                                                                            // 484
    }); //Find the stream for the name of the customer in Mongo, and get his Id from the returned object               // 483
                                                                                                                       //
    var streamId = '';                                                                                                 // 486
                                                                                                                       //
    if (stream) {                                                                                                      // 487
        // console.log('Stream already exists: ', stream.id);                                                          // 488
        streamId = stream.id;                                                                                          // 489
    } else {                                                                                                           // 490
        // console.log('No stream for customer exist, so create one: ' + customer.name);                               // 491
        streamId = QSStream.createStream(customer.name, generationUserId).id; // console.log('Step 1: the (new) stream ID for ' + customer.name + ' is: ', streamId);
    }                                                                                                                  // 494
                                                                                                                       //
    return streamId;                                                                                                   // 496
} // export function getAppsViaEngine() {                                                                              // 497
//     // console.log('server: QSSOCKS getApps');                                                                      // 501
//     return qsocks.Connect(engineConfig)                                                                             // 502
//         .then(function(global) {                                                                                    // 503
//             //We can now interact with the global class, for example fetch the document list.                       // 504
//             //qsocks mimics the Engine API, refer to the Engine API documentation or the engine api explorer for available methods.
//             global.getDocList()                                                                                     // 506
//                 .then(function(docList) {                                                                           // 507
//                     return docList;                                                                                 // 508
//                 });                                                                                                 // 509
//         });                                                                                                         // 511
// };                                                                                                                  // 512
// http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-Get-All-As-Full.htm
//                                                                                                                     // 517
// ─── GETAPPS ────────────────────────────────────────────────────────────────────                                    // 518
//                                                                                                                     // 519
                                                                                                                       //
                                                                                                                       //
function getApps(name, stream) {                                                                                       // 521
    var path = '/qrs/app/full'; //if a name/stream is provided only search the apps with this name                     // 522
                                                                                                                       //
    if (name) {                                                                                                        // 525
        path += "?filter=Name eq '" + name + "'";                                                                      // 526
                                                                                                                       //
        if (stream) {                                                                                                  // 527
            path += " and stream.name eq '" + stream + "'";                                                            // 528
        }                                                                                                              // 529
    }                                                                                                                  // 530
                                                                                                                       //
    var call = {                                                                                                       // 532
        action: 'Get list of apps',                                                                                    // 533
        request: path                                                                                                  // 534
    }; // REST_Log(call,generationUserId);                                                                             // 532
                                                                                                                       //
    return qrs.get(call.request);                                                                                      // 537
}                                                                                                                      // 538
                                                                                                                       //
; //                                                                                                                   // 538
// ─── DELETEAPP ──────────────────────────────────────────────────────────────────                                    // 541
//                                                                                                                     // 542
                                                                                                                       //
function deleteApp(guid) {                                                                                             // 545
    var generationUserId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'Not defined';          // 545
    console.log('QRSApp deleteApp: ', guid);                                                                           // 546
                                                                                                                       //
    try {                                                                                                              // 547
        var call = {};                                                                                                 // 548
        call.request = qrsSrv + '/qrs/app/' + guid;                                                                    // 549
        call.response = HTTP.del(call.request, {                                                                       // 550
            params: {                                                                                                  // 551
                xrfkey: senseConfig.xrfkey                                                                             // 552
            },                                                                                                         // 551
            npmRequestOptions: configCerticates,                                                                       // 554
            data: {}                                                                                                   // 555
        }); // Meteor.call('updateLocalSenseCopy');                                                                    // 550
        //logging only                                                                                                 // 559
                                                                                                                       //
        call.action = 'Delete app';                                                                                    // 560
        call.url = gitHubLinks.deleteApp;                                                                              // 561
        call.response = call.response;                                                                                 // 562
        REST_Log(call, generationUserId);                                                                              // 563
        return call.response;                                                                                          // 564
    } catch (err) {                                                                                                    // 565
        console.error(err);                                                                                            // 566
        throw new Meteor.Error('App delete failed', err.message);                                                      // 567
    }                                                                                                                  // 568
}                                                                                                                      // 569
                                                                                                                       //
; //                                                                                                                   // 569
// ─── PUBLISHAPP ─────────────────────────────────────────────────────────────────                                    // 573
//                                                                                                                     // 574
                                                                                                                       //
function publishApp(appGuid, appName, streamId, customerName, generationUserId) {                                      // 577
    console.log('Publish app: ' + appName + ' to stream: ' + streamId);                                                // 578
    check(appGuid, String);                                                                                            // 579
    check(appName, String);                                                                                            // 580
    check(streamId, String);                                                                                           // 581
                                                                                                                       //
    try {                                                                                                              // 583
        var call = {};                                                                                                 // 584
        call.request = qrsSrv + '/qrs/app/' + appGuid + '/publish?name=' + appName + '&stream=' + streamId;            // 585
        call.response = HTTP.put(call.request, {                                                                       // 586
            params: {                                                                                                  // 587
                xrfkey: senseConfig.xrfkey                                                                             // 588
            },                                                                                                         // 587
            npmRequestOptions: configCerticates,                                                                       // 590
            data: {}                                                                                                   // 591
        }); //logging into database                                                                                    // 586
                                                                                                                       //
        call.action = 'Publish app';                                                                                   // 596
        call.url = gitHubLinks.publishApp;                                                                             // 597
        REST_Log(call, generationUserId);                                                                              // 598
        return call.response;                                                                                          // 599
    } catch (err) {                                                                                                    // 600
        console.error(err); // // IF APP ALREADY EXISTED TRY TO PUBLISH OVERWRITE IT (REPLACE)                         // 601
        // if(err.response.statusCode == 400){                                                                         // 604
        //     replaceApp()                                                                                            // 605
        // }                                                                                                           // 606
        // console.error('statusCode:', err.response.statusCode);                                                      // 607
        // console.info('Try to PUBLISH OVERWRITE THE APP, SINCE IT WAS ALREADY PUBLISHED');                           // 608
                                                                                                                       //
        throw new Meteor.Error('Publication of app ' + appName + ' for customer ' + customerName + ' failed: ', err.message);
    }                                                                                                                  // 610
}                                                                                                                      // 611
                                                                                                                       //
; // REPLACE APP                                                                                                       // 611
// export function replaceApp(targetApp, replaceByApp, generationUserId) {                                             // 614
//     console.log('Function: Replace app: ' + targetApp + ' by app ' + targetApp);                                    // 615
//     check(appGuid, String);                                                                                         // 616
//     check(replaceByApp, String);                                                                                    // 617
//     try {                                                                                                           // 619
//         const result = HTTP.put(qlikHDRServer + '/qrs/app/' + replaceByApp + '/replace?app=' + targetApp + '&xrfkey=' + senseConfig.xrfkey, {
//             headers: {                                                                                              // 621
//                 'hdr-usr': senseConfig.headerValue,                                                                 // 622
//                 'X-Qlik-xrfkey': senseConfig.xrfkey                                                                 // 623
//             }                                                                                                       // 624
//         });                                                                                                         // 625
//         //logging into database                                                                                     // 627
//         const call = {};                                                                                            // 628
//         call.action = 'Replace app';                                                                                // 629
//         call.request = 'HTTP.put(' + qlikHDRServer + '/qrs/app/' + replaceByApp + '/replace?app=' + targetApp + '&xrfkey=' + senseConfig.xrfkey;
//         call.response = result;                                                                                     // 631
//         call.url = 'http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-App-Replace.htm';
//         REST_Log(call, generationUserId);                                                                           // 633
//         return result;                                                                                              // 634
//     } catch (err) {                                                                                                 // 635
//         console.error(err);                                                                                         // 636
//         throw new Meteor.Error('Publication of app ' + appName + ' for customer ' + customerName + ' failed: ', err.message);
//     }                                                                                                               // 638
// };                                                                                                                  // 639
// function createTag(name) {                                                                                          // 642
//     check(name, String);                                                                                            // 643
//     // console.log('QRS Functions Appp, create a tag: ' + name);                                                    // 644
//     try {                                                                                                           // 646
//         const result = HTTP.post(qlikHDRServer + '/qrs/Tag', {                                                      // 647
//             headers: authHeaders,                                                                                   // 648
//             params: {                                                                                               // 649
//                 'xrfkey': senseConfig.xrfkey                                                                        // 650
//             },                                                                                                      // 651
//             data: {                                                                                                 // 652
//                 "name": name                                                                                        // 653
//             }                                                                                                       // 654
//         })                                                                                                          // 655
//         //logging only                                                                                              // 657
//         const call = {};                                                                                            // 658
//         call.action = 'create Tag';                                                                                 // 659
//         call.request = 'HTTP.get(http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/tag';
//         call.response = result;                                                                                     // 661
//         REST_Log(call, generationUserId);                                                                           // 662
//         return result;                                                                                              // 664
//     } catch (err) {                                                                                                 // 665
//         console.error(err);                                                                                         // 666
//         throw new Meteor.Error('Tag: ' + name + ' create failed ', err.message);                                    // 667
//     }                                                                                                               // 668
// };                                                                                                                  // 669
// function addTag(type, guid, tagName) {                                                                              // 671
//     check(type, String);                                                                                            // 672
//     check(guid, String);                                                                                            // 673
//     //check if tag with tagName already exists                                                                      // 675
//     var selectionId = createSelection(type, guid);                                                                  // 677
//     addTagViaSyntheticToType('App', selectionId, tagGuid)                                                           // 678
// }                                                                                                                   // 680
// function createSelection(type, guid) {                                                                              // 682
//     check(type, String);                                                                                            // 683
//     check(guid, String);                                                                                            // 684
//     console.log('QRS Functions APP, create selection for type: ', type + ' ' + guid);                               // 685
//     try {                                                                                                           // 687
//         const result = HTTP.post(qlikHDRServer + '/qrs/Selection', {                                                // 688
//             headers: authHeaders,                                                                                   // 689
//             params: {                                                                                               // 690
//                 'xrfkey': senseConfig.xrfkey                                                                        // 691
//             },                                                                                                      // 692
//             data: {                                                                                                 // 693
//                 items: [{                                                                                           // 694
//                     type: type,                                                                                     // 695
//                     objectID: guid                                                                                  // 696
//                 }]                                                                                                  // 697
//             }                                                                                                       // 698
//         })                                                                                                          // 699
//         console.log('the result of selection for type: ', type + ' ' + guid);                                       // 700
//         console.log(result);                                                                                        // 701
//         return result.id;                                                                                           // 702
//     } catch (err) {                                                                                                 // 703
//         console.error(err);                                                                                         // 704
//         throw new Meteor.Error('Selection: ' + type + ' failed for guid ' + guid, err.message);                     // 705
//     }                                                                                                               // 706
// };                                                                                                                  // 707
// function deleteSelection(selectionId) {                                                                             // 709
//     check(selectionId, String);                                                                                     // 710
//     console.log('QRS Functions APP, deleteSelection selection for selectionId: ', selectionId);                     // 711
//     try {                                                                                                           // 713
//         const result = HTTP.delete(qlikHDRServer + '/qrs/Selection/' + selectionId, {                               // 714
//             headers: authHeaders,                                                                                   // 715
//             params: {                                                                                               // 716
//                 'xrfkey': senseConfig.xrfkey                                                                        // 717
//             }                                                                                                       // 718
//         })                                                                                                          // 719
//         console.log(result);                                                                                        // 720
//         return result.id;                                                                                           // 721
//     } catch (err) {                                                                                                 // 722
//         console.error(err);                                                                                         // 723
//         throw new Meteor.Error('Selection delete failed: ', err.message);                                           // 724
//     }                                                                                                               // 725
// };                                                                                                                  // 726
// function buildModDate() {                                                                                           // 728
//     var d = new Date();                                                                                             // 729
//     return d.toISOString();                                                                                         // 730
// }                                                                                                                   // 731
// function addTagViaSyntheticToType(type, selectionId, tagGuid) {                                                     // 733
//     check(type, String);                                                                                            // 734
//     check(guid, String);                                                                                            // 735
//     console.log('QRS Functions Appp, Update all entities of a specific type: ' + type + ' in the selection set identified by {id} ' + selectionId + ' based on an existing synthetic object. : ');
//     try {                                                                                                           // 738
//         const result = HTTP.put(qlikHDRServer + '/qrs/Selection/' + selectionId + '/' + type + '/synthetic', {      // 739
//             headers: authHeaders,                                                                                   // 740
//             params: {                                                                                               // 741
//                 'xrfkey': senseConfig.xrfkey                                                                        // 742
//             },                                                                                                      // 743
//             data: {                                                                                                 // 744
//                 "latestModifiedDate": buildModDate(),                                                               // 745
//                 "properties": [{                                                                                    // 746
//                     "name": "refList_Tag",                                                                          // 747
//                     "value": {                                                                                      // 748
//                         "added": [tagGuid]                                                                          // 749
//                     },                                                                                              // 750
//                     "valueIsModified": true                                                                         // 751
//                 }],                                                                                                 // 752
//                 "type": type                                                                                        // 753
//             }                                                                                                       // 754
//         })                                                                                                          // 755
//         console.log('the result of selection for type: ', type + ' ' + guid);                                       // 756
//         console.log(result);                                                                                        // 757
//         return result;                                                                                              // 758
//     } catch (err) {                                                                                                 // 759
//         console.error(err);                                                                                         // 760
//         throw new Meteor.Error('Selection: ' + type + ' failed for guid ' + guid, err.message);                     // 761
//     }                                                                                                               // 762
// };                                                                                                                  // 763
// async function uploadPublishTemplateApps() {                                                                        // 766
//     //check if template apps have been uploaded and published in the templates stream                               // 767
//     // if (true) { // (!Apps.find({ "stream.name": "Templates" }).count()) {                                        // 768
//     console.warn('no template apps found, so upload from the templates dir.');                                      // 769
//     var folder = Meteor.settings.private.templateAppsFrom;                                                          // 770
//     // var folder = await copyTemplatesToQRSFolder();                                                               // 771
//     console.log('apps folder', folder);                                                                             // 772
//     uploadAndPublishApps(folder);                                                                                   // 773
//     // } else {}                                                                                                    // 774
// }                                                                                                                   // 775
// //upload and publish all apps found in the folder to the templates stream                                           // 777
// async function copyTemplatesToQRSFolder() {                                                                         // 778
//     var newFolder = Meteor.settings.private.templateAppsTo + '\\' + process.env.USERDOMAIN + '\\' + process.env.USERNAME;
//     try {                                                                                                           // 780
//         await fs.copy(Meteor.settings.private.templateAppsFrom, newFolder, {                                        // 781
//             overwrite: true                                                                                         // 782
//         }); //"QLIK-AB0Q2URN5T\\Qlikexternal",                                                                      // 783
//         return newFolder                                                                                            // 784
//     } catch (err) {                                                                                                 // 785
//         console.error('error copy Templates from ' + Meteor.settings.private.templateAppsFrom + ' To QRSFolder ' + Meteor.settings.private.templateAppsDir, err);
//     }                                                                                                               // 787
// }                                                                                                                   // 788
// For a system service account, the app must be in the %ProgramData%\Qlik\Sense\Repository\DefaultApps folder.        // 790
// For any other account, the app must be in the %ProgramData%\Qlik\Sense\Apps\<login domain>\<login user> folder.     // 791
//so you have to copy your apps there first. in a fresh sense installation.                                            // 792
                                                                                                                       //
function importApp(fileName, name) {// check(fileName, String);                                                        // 793
    // check(name, String);                                                                                            // 795
    // console.log('QRS Functions import App, with name ' + name + ', with fileName: ', fileName);                     // 796
    // try {                                                                                                           // 798
    //     const call = {};                                                                                            // 799
    //     call.action = 'Import app';                                                                                 // 800
    //     call.url = 'http://help.qlik.com/en-US/sense-developer/3.2/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-App-Import-App.htm'
    //     call.request = qlikHDRServer + '/qrs/app/import?keepData=true&name=' + name + '&xrfkey=' + senseConfig.xrfkey; //using header auth.
    //     call.response = HTTP.post(call.request, {                                                                   // 803
    //         headers: {                                                                                              // 804
    //             'hdr-usr': senseConfig.headerValue,                                                                 // 805
    //             'X-Qlik-xrfkey': senseConfig.xrfkey                                                                 // 806
    //         },                                                                                                      // 807
    //         data: '"Sales.qvf"'                                                                                     // 808
    //     });                                                                                                         // 809
    //     REST_Log(call, generationUserId);                                                                           // 811
    //     var newGuid = call.response.data.id;                                                                        // 812
    //     return newGuid;                                                                                             // 813
    // } catch (err) {                                                                                                 // 814
    //     console.error(err);                                                                                         // 815
    //     const call = {};                                                                                            // 816
    //     call.action = 'Import app FAILED';                                                                          // 817
    //     call.response = err.message;                                                                                // 818
    //     REST_Log(call, generationUserId);                                                                           // 819
    //     throw new Meteor.Error('Import app failed', err.message);                                                   // 820
    // }                                                                                                               // 821
                                                                                                                       //
    var generationUserId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'no user set';          // 793
}                                                                                                                      // 822
                                                                                                                       //
; //https://www.npmjs.com/package/request#forms                                                                        // 822
// function uploadApp(filePath, fileSize, appName) {                                                                   // 825
//     console.log('QRS Functions upload App, with name ' + appName + ', with fileSize: ', fileSize + ' and filePath ' + filePath);
//     var formData = {                                                                                                // 827
//         my_file: fs.createReadStream(filePath)                                                                      // 828
//     };                                                                                                              // 829
//     request.post({                                                                                                  // 830
//         url: qlikHDRServer + '/qrs/app/upload?name=' + appName + '&xrfkey=' + senseConfig.xrfkey,                   // 831
//         headers: {                                                                                                  // 832
//             'Content-Type': 'application/vnd.qlik.sense.app',                                                       // 833
//             'hdr-usr': senseConfig.headerValue,                                                                     // 834
//             'X-Qlik-xrfkey': senseConfig.xrfkey                                                                     // 835
//         },                                                                                                          // 836
//         formData: formData                                                                                          // 837
//     }, function optionalCallback(err, httpResponse, body) {                                                         // 838
//         if (err) {                                                                                                  // 839
//             return console.error('upload failed:', err);                                                            // 840
//         }                                                                                                           // 841
//         console.log('Upload successful!  Server responded with:', body);                                            // 842
//     });                                                                                                             // 843
// }                                                                                                                   // 844
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"QRSFunctionsCustomProperties.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/server/QRSFunctionsCustomProperties.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({                                                                                                        // 1
    createCustomProperty: function () {                                                                                // 1
        return createCustomProperty;                                                                                   // 1
    },                                                                                                                 // 1
    upsertCustomPropertyByName: function () {                                                                          // 1
        return upsertCustomPropertyByName;                                                                             // 1
    },                                                                                                                 // 1
    deleteCustomProperty: function () {                                                                                // 1
        return deleteCustomProperty;                                                                                   // 1
    },                                                                                                                 // 1
    getCustomProperties: function () {                                                                                 // 1
        return getCustomProperties;                                                                                    // 1
    }                                                                                                                  // 1
});                                                                                                                    // 1
var Meteor = void 0;                                                                                                   // 1
module.watch(require("meteor/meteor"), {                                                                               // 1
    Meteor: function (v) {                                                                                             // 1
        Meteor = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var myQRS = void 0;                                                                                                    // 1
module.watch(require("/imports/api/server/QRSAPI"), {                                                                  // 1
    myQRS: function (v) {                                                                                              // 1
        myQRS = v;                                                                                                     // 1
    }                                                                                                                  // 1
}, 1);                                                                                                                 // 1
var senseConfig = void 0,                                                                                              // 1
    qrs = void 0;                                                                                                      // 1
module.watch(require("/imports/api/config.js"), {                                                                      // 1
    senseConfig: function (v) {                                                                                        // 1
        senseConfig = v;                                                                                               // 1
    },                                                                                                                 // 1
    qrs: function (v) {                                                                                                // 1
        qrs = v;                                                                                                       // 1
    }                                                                                                                  // 1
}, 2);                                                                                                                 // 1
                                                                                                                       //
var fs = require('fs-extra');                                                                                          // 8
                                                                                                                       //
var path = require('path');                                                                                            // 9
                                                                                                                       //
function createCustomProperty(name, newProperty) {                                                                     // 17
    console.log('------------------------------------');                                                               // 18
    console.log('createCustomProperty', name + ' ' + newProperty.toString());                                          // 19
    console.log('------------------------------------');                                                               // 20
                                                                                                                       //
    try {                                                                                                              // 22
        check(name, String);                                                                                           // 23
        check(newProperty, Object);                                                                                    // 24
    } catch (err) {                                                                                                    // 25
        throw new Meteor.Error('createCustomProperty: Missing values', 'You did not specify a name or choice values for the custom property');
    }                                                                                                                  // 27
                                                                                                                       //
    var result = qrs.post('/qrs/CustomPropertyDefinition', null, newProperty);                                         // 29
    console.log('result of create custom property: ', result);                                                         // 30
}                                                                                                                      // 31
                                                                                                                       //
function upsertCustomPropertyByName(name, choiceValues) {                                                              // 33
    try {                                                                                                              // 34
        check(name, String);                                                                                           // 35
        check(choiceValues, Array);                                                                                    // 36
    } catch (err) {                                                                                                    // 37
        throw new Meteor.Error('upsertCustomPropertyByName: Missing values', 'You did not specify a name or update object for the custom property');
    }                                                                                                                  // 39
                                                                                                                       //
    try {                                                                                                              // 41
        var newProperty = {                                                                                            // 42
            "name": name,                                                                                              // 43
            "valueType": "Text",                                                                                       // 44
            "objectTypes": ["App", "ContentLibrary", "DataConnection", "ReloadTask", "Stream", "User"],                // 45
            "choiceValues": choiceValues                                                                               // 46
        };                                                                                                             // 42
        var existingProperty = getCustomProperties(name)[0];                                                           // 49
                                                                                                                       //
        if (existingProperty) {                                                                                        // 50
            //update it                                                                                                // 50
            var updatedProperty = Object.assign(existingProperty, newProperty);                                        // 51
            var result = qrs.put('/qrs/CustomPropertyDefinition/' + updatedProperty.id, null, updatedProperty); //you can only update when you supply the original modified date, otherwise you get a 409 error. 
                                                                                                                       //
            console.log('Custom property update: ', result);                                                           // 53
        } else {                                                                                                       // 54
            //create a new one                                                                                         // 54
            createCustomProperty(name, newProperty);                                                                   // 55
        }                                                                                                              // 56
    } catch (error) {                                                                                                  // 57
        console.log('error upserting custom property', error);                                                         // 58
    }                                                                                                                  // 59
}                                                                                                                      // 60
                                                                                                                       //
function deleteCustomProperty(name) {                                                                                  // 62
    console.log('deleteCustomProperty(name)', name);                                                                   // 63
    var customProperty = getCustomProperties(name)[0];                                                                 // 65
                                                                                                                       //
    if (customProperty) {                                                                                              // 66
        var result = qrs.del('/qrs/CustomPropertyDefinition/' + customProperty.id);                                    // 67
        console.log('result after delete', result);                                                                    // 68
    }                                                                                                                  // 69
}                                                                                                                      // 71
                                                                                                                       //
function getCustomProperties(name) {                                                                                   // 73
    var filter = name ? {                                                                                              // 74
        filter: "Name eq '" + name + "'"                                                                               // 75
    } : null;                                                                                                          // 74
    var customProperties = qrs.get('/qrs/CustomPropertyDefinition/full', filter);                                      // 77
    var file = path.join(Meteor.settings.broker.automationBaseFolder, 'customProperties', 'export', 'ExtractedCustomProperties.json'); // SAVE FILE TO DISK
                                                                                                                       //
    fs.outputFile(file, JSON.stringify(customProperties, null, 2), 'utf-8');                                           // 82
    return customProperties;                                                                                           // 84
}                                                                                                                      // 85
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"QRSFunctionsExtension.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/server/QRSFunctionsExtension.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _regenerator = require("babel-runtime/regenerator");                                                               //
                                                                                                                       //
var _regenerator2 = _interopRequireDefault(_regenerator);                                                              //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
module.export({                                                                                                        // 1
    uploadExtensions: function () {                                                                                    // 1
        return uploadExtensions;                                                                                       // 1
    }                                                                                                                  // 1
});                                                                                                                    // 1
var Meteor = void 0;                                                                                                   // 1
module.watch(require("meteor/meteor"), {                                                                               // 1
    Meteor: function (v) {                                                                                             // 1
        Meteor = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var myQRS = void 0;                                                                                                    // 1
module.watch(require("/imports/api/server/QRSAPI"), {                                                                  // 1
    myQRS: function (v) {                                                                                              // 1
        myQRS = v;                                                                                                     // 1
    }                                                                                                                  // 1
}, 1);                                                                                                                 // 1
                                                                                                                       //
var qlikHDRServer = void 0,                                                                                            // 1
    senseConfig = void 0,                                                                                              // 1
    enigmaServerConfig = void 0,                                                                                       // 1
    authHeaders = void 0,                                                                                              // 1
    qrsSrv = void 0,                                                                                                   // 1
    QRSconfig = void 0,                                                                                                // 1
    _SSBIApp = void 0,                                                                                                 // 1
    configCerticates = void 0,                                                                                         // 1
    _slideGeneratorAppId = void 0;                                                                                     // 1
                                                                                                                       //
module.watch(require("/imports/api/config.js"), {                                                                      // 1
    qlikHDRServer: function (v) {                                                                                      // 1
        qlikHDRServer = v;                                                                                             // 1
    },                                                                                                                 // 1
    senseConfig: function (v) {                                                                                        // 1
        senseConfig = v;                                                                                               // 1
    },                                                                                                                 // 1
    enigmaServerConfig: function (v) {                                                                                 // 1
        enigmaServerConfig = v;                                                                                        // 1
    },                                                                                                                 // 1
    authHeaders: function (v) {                                                                                        // 1
        authHeaders = v;                                                                                               // 1
    },                                                                                                                 // 1
    qrsSrv: function (v) {                                                                                             // 1
        qrsSrv = v;                                                                                                    // 1
    },                                                                                                                 // 1
    QRSconfig: function (v) {                                                                                          // 1
        QRSconfig = v;                                                                                                 // 1
    },                                                                                                                 // 1
    _SSBIApp: function (v) {                                                                                           // 1
        _SSBIApp = v;                                                                                                  // 1
    },                                                                                                                 // 1
    configCerticates: function (v) {                                                                                   // 1
        configCerticates = v;                                                                                          // 1
    },                                                                                                                 // 1
    _slideGeneratorAppId: function (v) {                                                                               // 1
        _slideGeneratorAppId = v;                                                                                      // 1
    }                                                                                                                  // 1
}, 2);                                                                                                                 // 1
                                                                                                                       //
//                                                                                                                     // 22
// ─── INSTALL NPM MODULES ────────────────────────────────────────────────────────                                    // 23
//                                                                                                                     // 24
var fs = require('fs-extra');                                                                                          // 26
                                                                                                                       //
var path = require('path');                                                                                            // 27
                                                                                                                       //
var enigma = require('enigma.js');                                                                                     // 28
                                                                                                                       //
var promise = require('bluebird');                                                                                     // 29
                                                                                                                       //
var request = require('request');                                                                                      // 30
                                                                                                                       //
var qrs = new myQRS(); // export async function automaticUploadExtensions() {                                          // 31
//     console.log('Automatically download the extensions from Github and upload to Qlik Sense');                      // 34
//     var url = 'https://github.com/kai/qlik-sense-timeline.git';                                                     // 35
//     var req = request.get(url);                                                                                     // 36
//     console.log('req', req)                                                                                         // 37
// }                                                                                                                   // 39
                                                                                                                       //
function uploadExtensions() {                                                                                          // 41
    var _this = this;                                                                                                  // 41
                                                                                                                       //
    var extensionsFolder, extensions;                                                                                  // 41
    return _regenerator2.default.async(function () {                                                                   // 41
        function uploadExtensions$(_context2) {                                                                        // 41
            while (1) {                                                                                                // 41
                switch (_context2.prev = _context2.next) {                                                             // 41
                    case 0:                                                                                            // 41
                        console.log('--------------------------UPLOAD EXTENSIONS'); // LOAD ALL EXTENSIONS IN FOLDER   // 42
                                                                                                                       //
                        extensionsFolder = '';                                                                         // 44
                        _context2.prev = 2;                                                                            // 41
                        extensionsFolder = path.join(Meteor.settings.broker.automationBaseFolder, 'extensions');       // 46
                        console.log('extensionsFolder', extensionsFolder);                                             // 47
                        _context2.next = 7;                                                                            // 41
                        return _regenerator2.default.awrap(fs.readdir(extensionsFolder));                              // 41
                                                                                                                       //
                    case 7:                                                                                            // 41
                        extensions = _context2.sent;                                                                   // 48
                        _context2.next = 13;                                                                           // 41
                        break;                                                                                         // 41
                                                                                                                       //
                    case 10:                                                                                           // 41
                        _context2.prev = 10;                                                                           // 41
                        _context2.t0 = _context2["catch"](2);                                                          // 41
                        throw error('error loading all extensions in folder.', _context2.t0);                          // 41
                                                                                                                       //
                    case 13:                                                                                           // 41
                        _context2.next = 15;                                                                           // 41
                        return _regenerator2.default.awrap(Promise.all(extensions.map(function () {                    // 41
                            function _callee(extension) {                                                              // 54
                                var filePath, result;                                                                  // 54
                                return _regenerator2.default.async(function () {                                       // 54
                                    function _callee$(_context) {                                                      // 54
                                        while (1) {                                                                    // 54
                                            switch (_context.prev = _context.next) {                                   // 54
                                                case 0:                                                                // 54
                                                    console.log('Current extension', extension);                       // 55
                                                    _context.prev = 1;                                                 // 54
                                                    //CREATE A FILEPATH                                                // 57
                                                    filePath = path.join(extensionsFolder, extension); //UPLOAD THE APP, GET THE APP ID BACK
                                                                                                                       //
                                                    _context.next = 5;                                                 // 54
                                                    return _regenerator2.default.awrap(uploadExtension('', filePath));
                                                                                                                       //
                                                case 5:                                                                // 54
                                                    result = _context.sent;                                            // 61
                                                    _context.next = 12;                                                // 54
                                                    break;                                                             // 54
                                                                                                                       //
                                                case 8:                                                                // 54
                                                    _context.prev = 8;                                                 // 54
                                                    _context.t0 = _context["catch"](1);                                // 54
                                                    console.error(_context.t0);                                        // 63
                                                    throw new Meteor.Error('Unable to upload the app to Qlik Sense. ', _context.t0);
                                                                                                                       //
                                                case 12:                                                               // 54
                                                case "end":                                                            // 54
                                                    return _context.stop();                                            // 54
                                            }                                                                          // 54
                                        }                                                                              // 54
                                    }                                                                                  // 54
                                                                                                                       //
                                    return _callee$;                                                                   // 54
                                }(), null, _this, [[1, 8]]);                                                           // 54
                            }                                                                                          // 54
                                                                                                                       //
                            return _callee;                                                                            // 54
                        }())));                                                                                        // 54
                                                                                                                       //
                    case 15:                                                                                           // 41
                    case "end":                                                                                        // 41
                        return _context2.stop();                                                                       // 41
                }                                                                                                      // 41
            }                                                                                                          // 41
        }                                                                                                              // 41
                                                                                                                       //
        return uploadExtensions$;                                                                                      // 41
    }(), null, this, [[2, 10]]);                                                                                       // 41
}                                                                                                                      // 41
                                                                                                                       //
function uploadExtension(password, filePath) {                                                                         // 71
    var formData;                                                                                                      // 71
    return _regenerator2.default.async(function () {                                                                   // 71
        function uploadExtension$(_context3) {                                                                         // 71
            while (1) {                                                                                                // 71
                switch (_context3.prev = _context3.next) {                                                             // 71
                    case 0:                                                                                            // 71
                        console.log('uploadApp: try to upload extension from path: ' + filePath);                      // 73
                        formData = {                                                                                   // 74
                            my_file: fs.createReadStream(filePath)                                                     // 75
                        }; // qrs.post('/qrs/extension/upload?pwd=' + password, data)                                  // 74
                                                                                                                       //
                        _context3.next = 4;                                                                            // 71
                        return _regenerator2.default.awrap(new Promise(function (resolve, reject) {                    // 71
                            request.post({                                                                             // 81
                                url: qlikHDRServer + '/qrs/extension/upload?&xrfkey=' + senseConfig.xrfkey,            // 82
                                //removed password parameter, assume blank                                             // 82
                                headers: {                                                                             // 83
                                    'hdr-usr': senseConfig.headerValue,                                                // 84
                                    'X-Qlik-xrfkey': senseConfig.xrfkey                                                // 85
                                },                                                                                     // 83
                                formData: formData                                                                     // 87
                            }, function (error, res, body) {                                                           // 81
                                if (!error) {                                                                          // 89
                                    try {                                                                              // 90
                                        var id = JSON.parse(body).id;                                                  // 91
                                        console.log('Uploaded "' + path.basename(filePath) + ' to Qlik Sense and got id: ' + id); //
                                    } catch (err) {                                                                    // 93
                                        console.log('Qlik Sense reported: ', body);                                    // 94
                                    }                                                                                  // 95
                                                                                                                       //
                                    resolve();                                                                         // 96
                                } else {                                                                               // 97
                                    reject(error);                                                                     // 98
                                }                                                                                      // 99
                            });                                                                                        // 100
                        }));                                                                                           // 101
                                                                                                                       //
                    case 4:                                                                                            // 71
                        return _context3.abrupt("return", _context3.sent);                                             // 71
                                                                                                                       //
                    case 5:                                                                                            // 71
                    case "end":                                                                                        // 71
                        return _context3.stop();                                                                       // 71
                }                                                                                                      // 71
            }                                                                                                          // 71
        }                                                                                                              // 71
                                                                                                                       //
        return uploadExtension$;                                                                                       // 71
    }(), null, this);                                                                                                  // 71
}                                                                                                                      // 71
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"QRSFunctionsLicense.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/server/QRSFunctionsLicense.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({                                                                                                        // 1
    getLicense: function () {                                                                                          // 1
        return getLicense;                                                                                             // 1
    },                                                                                                                 // 1
    insertLicense: function () {                                                                                       // 1
        return insertLicense;                                                                                          // 1
    },                                                                                                                 // 1
    insertUserAccessRule: function () {                                                                                // 1
        return insertUserAccessRule;                                                                                   // 1
    },                                                                                                                 // 1
    getSystemRules: function () {                                                                                      // 1
        return getSystemRules;                                                                                         // 1
    },                                                                                                                 // 1
    saveSystemRules: function () {                                                                                     // 1
        return saveSystemRules;                                                                                        // 1
    }                                                                                                                  // 1
});                                                                                                                    // 1
var Meteor = void 0;                                                                                                   // 1
module.watch(require("meteor/meteor"), {                                                                               // 1
    Meteor: function (v) {                                                                                             // 1
        Meteor = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var myQRS = void 0;                                                                                                    // 1
module.watch(require("/imports/api/server/QRSAPI"), {                                                                  // 1
    myQRS: function (v) {                                                                                              // 1
        myQRS = v;                                                                                                     // 1
    }                                                                                                                  // 1
}, 1);                                                                                                                 // 1
var senseConfig = void 0,                                                                                              // 1
    qrs = void 0;                                                                                                      // 1
module.watch(require("/imports/api/config.js"), {                                                                      // 1
    senseConfig: function (v) {                                                                                        // 1
        senseConfig = v;                                                                                               // 1
    },                                                                                                                 // 1
    qrs: function (v) {                                                                                                // 1
        qrs = v;                                                                                                       // 1
    }                                                                                                                  // 1
}, 2);                                                                                                                 // 1
                                                                                                                       //
var fs = require('fs-extra');                                                                                          // 4
                                                                                                                       //
var path = require('path'); //                                                                                         // 5
// ─── IMPORT CONFIG FOR QLIK SENSE QRS AND ENGINE API ────────────────────────────                                    // 9
//                                                                                                                     // 10
                                                                                                                       //
                                                                                                                       //
var demoUserAccessRule = "SAAS DEMO - License rule to grant user access"; // http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-License-Add.htm //
                                                                                                                       //
function getLicense() {                                                                                                // 22
    var lic = qrs.get('/qrs/license');                                                                                 // 23
    return lic;                                                                                                        // 24
}                                                                                                                      // 25
                                                                                                                       //
function insertLicense() {                                                                                             // 27
    console.log('------------------------------------');                                                               // 28
    console.log('INSERT LICENSE');                                                                                     // 29
    console.log('------------------------------------');                                                               // 30
    var existingLicense = qrs.get('/qrs/license');                                                                     // 31
    var newLicense = Meteor.settings.private.license;                                                                  // 32
                                                                                                                       //
    try {                                                                                                              // 34
        console.log('check if all settings.json parameters are set...');                                               // 35
        check(Meteor.settings.private.license, {                                                                       // 36
            serial: String,                                                                                            // 37
            name: String,                                                                                              // 38
            organization: String                                                                                       // 39
        });                                                                                                            // 36
        check(Meteor.settings.private.LicenseControlNumber, Number);                                                   // 41
    } catch (err) {                                                                                                    // 42
        console.error('Missing parameters in your settings.json file for your Qlik Sense license', err);               // 43
    }                                                                                                                  // 44
                                                                                                                       //
    if (!existingLicense) {                                                                                            // 46
        // try {                                                                                                       // 47
        //     console.log('Update the existing license');                                                             // 48
        //     newLicense.id = existingLicense.id;                                                                     // 49
        //     var response = qrs.del('/qrs/license/' + existingLicense.id);                                           // 50
        //     // var response = qrs.put('/qrs/license/' + newLicense.id, newLicense, { control: Meteor.settings.private.LicenseControlNumber });
        //     // console.error('Stop license insertion, license for ' + lic.organization + ' is already included: ', lic.serial);
        //     // throw Error('You are trying to insert a license while the Qlik Sense is already licensed, please remove the existing one in the QMC');
        // } catch (err) {                                                                                             // 54
        //     // lic did not already exist.                                                                           // 55
        // }                                                                                                           // 56
        var response = qrs.post('/qrs/license', {                                                                      // 57
            control: Meteor.settings.private.LicenseControlNumber                                                      // 57
        }, newLicense);                                                                                                // 57
        console.log('No existing license present, therefore inserted license into Qlik Sense.');                       // 58
    }                                                                                                                  // 59
}                                                                                                                      // 60
                                                                                                                       //
function insertUserAccessRule() {                                                                                      // 62
    console.log('insert UserAccess Rule for all users');                                                               // 63
    var licenseRule = {                                                                                                // 64
        "name": demoUserAccessRule,                                                                                    // 65
        "category": "License",                                                                                         // 66
        "rule": "((user.name like \"*\"))",                                                                            // 67
        "type": "Custom",                                                                                              // 68
        "privileges": ["create", "read", "update"],                                                                    // 69
        "resourceFilter": "License.UserAccessGroup_507c9aa5-8812-44d9-ade8-32809785eecf",                              // 70
        "actions": 1,                                                                                                  // 71
        "ruleContext": "QlikSenseOnly",                                                                                // 72
        "disabled": false,                                                                                             // 73
        "comment": "Rule to set up automatic user access for each user that has received a ticket via your SaaS platform",
        "disabledActions": ["useaccesstype"]                                                                           // 75
    };                                                                                                                 // 64
    var ruleExist = getSystemRules(demoUserAccessRule);                                                                // 77
                                                                                                                       //
    if (typeof ruleExist[0] == 'undefined' || ruleExist.length === 0) {                                                // 78
        console.log('Create a new user license rule since it did not exist.');                                         // 79
        var response = qrs.post('/qrs/SystemRule', null, licenseRule);                                                 // 80
    }                                                                                                                  // 81
}                                                                                                                      // 82
                                                                                                                       //
function getSystemRules(name) {                                                                                        // 84
    console.log('Get system rules with name: ' + name);                                                                // 85
    var filter = name ? {                                                                                              // 87
        filter: "Name eq '" + name + "'"                                                                               // 87
    } : null;                                                                                                          // 87
    var rules = qrs.get('/qrs/SystemRule/full', filter);                                                               // 88
    var file = path.join(Meteor.settings.broker.automationBaseFolder, 'securityrules', 'export', 'ExtractedSystemRules.json'); // SAVE FILE TO DISK
                                                                                                                       //
    fs.outputFile(file, JSON.stringify(rules, null, 2), 'utf-8');                                                      // 93
    return rules;                                                                                                      // 95
}                                                                                                                      // 96
                                                                                                                       //
function saveSystemRules() {                                                                                           // 97
    var rules = qrs.get('/qrs/SystemRule');                                                                            // 98
    var file = path.join(Meteor.settings.broker.automationBaseFolder, 'securityrules', 'export', 'ExtractedSystemRules.json'); // SAVE FILE TO DISK
                                                                                                                       //
    fs.outputFile(file, JSON.stringify(rules, null, 2), 'utf-8');                                                      // 103
}                                                                                                                      // 104
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"QRSFunctionsStream.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/server/QRSFunctionsStream.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({                                                                                                        // 1
    initSenseStreams: function () {                                                                                    // 1
        return initSenseStreams;                                                                                       // 1
    },                                                                                                                 // 1
    deleteStream: function () {                                                                                        // 1
        return deleteStream;                                                                                           // 1
    },                                                                                                                 // 1
    getStreamByName: function () {                                                                                     // 1
        return getStreamByName;                                                                                        // 1
    },                                                                                                                 // 1
    getStreams: function () {                                                                                          // 1
        return getStreams;                                                                                             // 1
    },                                                                                                                 // 1
    createStream: function () {                                                                                        // 1
        return createStream;                                                                                           // 1
    }                                                                                                                  // 1
});                                                                                                                    // 1
var Meteor = void 0;                                                                                                   // 1
module.watch(require("meteor/meteor"), {                                                                               // 1
    Meteor: function (v) {                                                                                             // 1
        Meteor = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var GeneratedResources = void 0;                                                                                       // 1
module.watch(require("/imports/api/apps.js"), {                                                                        // 1
    GeneratedResources: function (v) {                                                                                 // 1
        GeneratedResources = v;                                                                                        // 1
    }                                                                                                                  // 1
}, 1);                                                                                                                 // 1
var gitHubLinks = void 0;                                                                                              // 1
module.watch(require("/imports/ui/UIHelpers"), {                                                                       // 1
    gitHubLinks: function (v) {                                                                                        // 1
        gitHubLinks = v;                                                                                               // 1
    }                                                                                                                  // 1
}, 2);                                                                                                                 // 1
var senseConfig = void 0,                                                                                              // 1
    authHeaders = void 0,                                                                                              // 1
    qrsSrv = void 0,                                                                                                   // 1
    qrs = void 0,                                                                                                      // 1
    configCerticates = void 0;                                                                                         // 1
module.watch(require("/imports/api/config.js"), {                                                                      // 1
    senseConfig: function (v) {                                                                                        // 1
        senseConfig = v;                                                                                               // 1
    },                                                                                                                 // 1
    authHeaders: function (v) {                                                                                        // 1
        authHeaders = v;                                                                                               // 1
    },                                                                                                                 // 1
    qrsSrv: function (v) {                                                                                             // 1
        qrsSrv = v;                                                                                                    // 1
    },                                                                                                                 // 1
    qrs: function (v) {                                                                                                // 1
        qrs = v;                                                                                                       // 1
    },                                                                                                                 // 1
    configCerticates: function (v) {                                                                                   // 1
        configCerticates = v;                                                                                          // 1
    }                                                                                                                  // 1
}, 3);                                                                                                                 // 1
var REST_Log = void 0;                                                                                                 // 1
module.watch(require("/imports/api/APILogs"), {                                                                        // 1
    REST_Log: function (v) {                                                                                           // 1
        REST_Log = v;                                                                                                  // 1
    }                                                                                                                  // 1
}, 4);                                                                                                                 // 1
var qlikServer = 'http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy; //
// ─── CREATE STREAMS FOR THE INITIAL SETUP OF QLIK SENSE ─────────────────────────                                    // 13
//                                                                                                                     // 14
                                                                                                                       //
function initSenseStreams() {                                                                                          // 17
    console.log('------------------------------------');                                                               // 18
    console.log('Create initial streams');                                                                             // 19
    console.log('------------------------------------');                                                               // 20
                                                                                                                       //
    for (var _iterator = Meteor.settings.public.StreamsToCreateAutomatically, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;                                                                                                      // 22
                                                                                                                       //
        if (_isArray) {                                                                                                // 22
            if (_i >= _iterator.length) break;                                                                         // 22
            _ref = _iterator[_i++];                                                                                    // 22
        } else {                                                                                                       // 22
            _i = _iterator.next();                                                                                     // 22
            if (_i.done) break;                                                                                        // 22
            _ref = _i.value;                                                                                           // 22
        }                                                                                                              // 22
                                                                                                                       //
        var streamName = _ref;                                                                                         // 22
                                                                                                                       //
        try {                                                                                                          // 23
            console.log('Try to create stream: ' + streamName + ' if it not already exists');                          // 24
                                                                                                                       //
            if (!getStreamByName(streamName)) {                                                                        // 25
                createStream(streamName);                                                                              // 26
            }                                                                                                          // 27
        } catch (err) {                                                                                                // 28
            console.log(err);                                                                                          // 29
        }                                                                                                              // 30
    }                                                                                                                  // 31
}                                                                                                                      // 32
                                                                                                                       //
function deleteStream(guid, generationUserId) {                                                                        // 39
    console.log('deleteStream: ', guid);                                                                               // 40
                                                                                                                       //
    try {                                                                                                              // 41
        var request = qrsSrv + '/qrs/stream/' + guid;                                                                  // 43
        var response = HTTP.del(request, {                                                                             // 44
            'npmRequestOptions': configCerticates                                                                      // 45
        }); // Logging                                                                                                 // 44
                                                                                                                       //
        var call = {};                                                                                                 // 49
        call.action = 'Delete stream';                                                                                 // 50
        call.request = "HTTP.del(" + qlikServer + '/qrs/stream/' + guid + '?xrfkey=' + senseConfig.xrfkey;             // 51
        call.response = response;                                                                                      // 52
        REST_Log(call, generationUserId);                                                                              // 53
        Meteor.call('updateLocalSenseCopy');                                                                           // 54
        return response;                                                                                               // 55
    } catch (err) {// console.error(err);                                                                              // 56
        // throw new Meteor.Error('Delete stream failed', err.message);                                                // 58
    }                                                                                                                  // 59
}                                                                                                                      // 60
                                                                                                                       //
; //                                                                                                                   // 60
// ─── GET STREAM BY NAME ────────────────────────────────────────────────────────────                                 // 64
//                                                                                                                     // 65
                                                                                                                       //
function getStreamByName(name) {                                                                                       // 68
    try {                                                                                                              // 69
        var request = qrsSrv + "/qrs/stream/full?filter=Name eq '" + name + "'";                                       // 70
        var response = HTTP.get(request, {                                                                             // 71
            params: {                                                                                                  // 72
                xrfkey: senseConfig.xrfkey                                                                             // 72
            },                                                                                                         // 72
            npmRequestOptions: configCerticates,                                                                       // 73
            data: {}                                                                                                   // 74
        });                                                                                                            // 71
        return response.data[0];                                                                                       // 77
    } catch (err) {                                                                                                    // 78
        console.error(err);                                                                                            // 79
        throw Error('get streamByName failed', err.message);                                                           // 80
    }                                                                                                                  // 81
}                                                                                                                      // 82
                                                                                                                       //
function getStreams() {                                                                                                // 89
    try {                                                                                                              // 90
        var call = {};                                                                                                 // 91
        call.action = 'Get list of streams';                                                                           // 92
        call.request = qrsSrv + '/qrs/stream/full';                                                                    // 93
        call.response = HTTP.get(call.request, {                                                                       // 94
            params: {                                                                                                  // 95
                xrfkey: senseConfig.xrfkey                                                                             // 95
            },                                                                                                         // 95
            npmRequestOptions: configCerticates,                                                                       // 96
            data: {}                                                                                                   // 97
        }); // REST_Log(call);                                                                                         // 94
                                                                                                                       //
        return call.response.data;                                                                                     // 100
    } catch (err) {                                                                                                    // 101
        console.error(err);                                                                                            // 102
        throw new Meteor.Error('getStreams failed', err.message);                                                      // 103
    }                                                                                                                  // 104
}                                                                                                                      // 105
                                                                                                                       //
; //                                                                                                                   // 105
// ─── CREATE STREAM ──────────────────────────────────────────────────────────────                                    // 108
//                                                                                                                     // 109
                                                                                                                       //
function createStream(name, generationUserId) {                                                                        // 112
    console.log('QRS Functions Stream, create the stream with name', name);                                            // 113
                                                                                                                       //
    try {                                                                                                              // 116
        check(name, String);                                                                                           // 117
        var response = qrs.post('/qrs/stream', null, {                                                                 // 118
            name: name                                                                                                 // 118
        }); // Meteor.call('updateLocalSenseCopy');                                                                    // 118
        //logging                                                                                                      // 121
                                                                                                                       //
        var call = {                                                                                                   // 122
            action: 'Create stream',                                                                                   // 123
            url: gitHubLinks.createStream,                                                                             // 124
            request: "HTTP.post(qlikServer + '/qrs/stream', { headers: " + JSON.stringify(authHeaders) + ", params: { 'xrfkey': " + senseConfig.xrfkey + "}, data: { name: " + name + "}}) --> USE OF HEADER AUTH ONLY FOR DEMO/REVERSE PROXY PURPOSES",
            response: response                                                                                         // 126
        };                                                                                                             // 122
        REST_Log(call, generationUserId);                                                                              // 129
        console.log('Create stream call.response;', call.response);                                                    // 130
        return call.response;                                                                                          // 131
    } catch (err) {                                                                                                    // 132
        console.error(err);                                                                                            // 133
        throw new Meteor.Error('Create stream failed ', err.message);                                                  // 134
    }                                                                                                                  // 135
}                                                                                                                      // 136
                                                                                                                       //
;                                                                                                                      // 136
Meteor.methods({                                                                                                       // 139
    deleteStream: function (guid) {                                                                                    // 140
        check(guid, String); //logging only                                                                            // 141
                                                                                                                       //
        var call = {};                                                                                                 // 143
        call.action = 'Delete stream';                                                                                 // 144
        call.request = 'Delete stream: ' + guid;                                                                       // 145
        REST_Log(call);                                                                                                // 146
        var id = deleteStream(guid, Meteor.userId());                                                                  // 148
        Meteor.call('updateLocalSenseCopy');                                                                           // 149
        return id;                                                                                                     // 150
    },                                                                                                                 // 151
    createStream: function (name) {                                                                                    // 152
        var streamId = createStream(name);                                                                             // 153
        Meteor.call('updateLocalSenseCopy'); //store in the database that the user generated something, so we can later on remove it.
                                                                                                                       //
        GeneratedResources.insert({                                                                                    // 157
            'generationUserId': Meteor.userId(),                                                                       // 158
            'customer': null,                                                                                          // 159
            'streamId': streamId.data.id,                                                                              // 160
            'appId': null                                                                                              // 161
        });                                                                                                            // 157
        return streamId;                                                                                               // 163
    },                                                                                                                 // 164
    getStreams: function () {                                                                                          // 165
        return getStreams();                                                                                           // 166
    }                                                                                                                  // 167
});                                                                                                                    // 139
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"QRSFunctionsSystemRules.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/server/QRSFunctionsSystemRules.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _regenerator = require("babel-runtime/regenerator");                                                               //
                                                                                                                       //
var _regenerator2 = _interopRequireDefault(_regenerator);                                                              //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
module.export({                                                                                                        // 1
    getSecurityRules: function () {                                                                                    // 1
        return getSecurityRules;                                                                                       // 1
    },                                                                                                                 // 1
    disableDefaultSecurityRules: function () {                                                                         // 1
        return disableDefaultSecurityRules;                                                                            // 1
    },                                                                                                                 // 1
    createSecurityRules: function () {                                                                                 // 1
        return createSecurityRules;                                                                                    // 1
    }                                                                                                                  // 1
});                                                                                                                    // 1
var Meteor = void 0;                                                                                                   // 1
module.watch(require("meteor/meteor"), {                                                                               // 1
    Meteor: function (v) {                                                                                             // 1
        Meteor = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var qrs = void 0,                                                                                                      // 1
    validateJSON = void 0;                                                                                             // 1
module.watch(require("/imports/api/config.js"), {                                                                      // 1
    qrs: function (v) {                                                                                                // 1
        qrs = v;                                                                                                       // 1
    },                                                                                                                 // 1
    validateJSON: function (v) {                                                                                       // 1
        validateJSON = v;                                                                                              // 1
    }                                                                                                                  // 1
}, 1);                                                                                                                 // 1
var QSLic = void 0;                                                                                                    // 1
module.watch(require("/imports/api/server/QRSFunctionsLicense"), {                                                     // 1
    "*": function (v) {                                                                                                // 1
        QSLic = v;                                                                                                     // 1
    }                                                                                                                  // 1
}, 2);                                                                                                                 // 1
                                                                                                                       //
// import { APILogs } from '/imports/api/APILogs';                                                                     // 4
var fs = require('fs-extra');                                                                                          // 5
                                                                                                                       //
var path = require('path');                                                                                            // 6
                                                                                                                       //
function getSecurityRules(name) {                                                                                      // 14
    return QSLic.getSystemRules(name);                                                                                 // 15
}                                                                                                                      // 16
                                                                                                                       //
function disableDefaultSecurityRules() {                                                                               // 18
    console.log('------------------------------------');                                                               // 19
    console.log('disable Default SecurityRules');                                                                      // 20
    console.log('------------------------------------');                                                               // 21
                                                                                                                       //
    for (var _iterator = Meteor.settings.security.rulesToDisable, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;                                                                                                      // 23
                                                                                                                       //
        if (_isArray) {                                                                                                // 23
            if (_i >= _iterator.length) break;                                                                         // 23
            _ref = _iterator[_i++];                                                                                    // 23
        } else {                                                                                                       // 23
            _i = _iterator.next();                                                                                     // 23
            if (_i.done) break;                                                                                        // 23
            _ref = _i.value;                                                                                           // 23
        }                                                                                                              // 23
                                                                                                                       //
        var ruleName = _ref;                                                                                           // 23
        console.log('From Meteor.settings.security.rulesToDisable, Disable security rule: ', ruleName);                // 24
        var ruleDefinition = QSLic.getSystemRules(ruleName)[0];                                                        // 26
                                                                                                                       //
        if (ruleDefinition) {                                                                                          // 27
            ruleDefinition.disabled = true;                                                                            // 28
            var response = qrs.put('/qrs/SystemRule/' + ruleDefinition.id, null, ruleDefinition);                      // 29
        } else {                                                                                                       // 30
            console.warn('The system rule does not exist in Sense: ' + ruleName);                                      // 31
        }                                                                                                              // 32
    }                                                                                                                  // 33
                                                                                                                       //
    ;                                                                                                                  // 33
}                                                                                                                      // 34
                                                                                                                       //
function createSecurityRules() {                                                                                       // 36
    var file, securityRules;                                                                                           // 36
    return _regenerator2.default.async(function () {                                                                   // 36
        function createSecurityRules$(_context) {                                                                      // 36
            while (1) {                                                                                                // 36
                switch (_context.prev = _context.next) {                                                               // 36
                    case 0:                                                                                            // 36
                        console.log('------------------------------------');                                           // 37
                        console.log('create security rules in Qlik Sense based on import file');                       // 38
                        console.log('------------------------------------');                                           // 39
                        file = path.join(Meteor.settings.broker.automationBaseFolder, 'securityrules', 'import', 'securityRuleSettings.json'); // READ THE FILE 
                                                                                                                       //
                        _context.next = 6;                                                                             // 36
                        return _regenerator2.default.awrap(fs.readJson(file));                                         // 36
                                                                                                                       //
                    case 6:                                                                                            // 36
                        securityRules = _context.sent;                                                                 // 44
                        _context.prev = 7;                                                                             // 36
                        validateJSON(securityRules);                                                                   // 46
                        _context.next = 14;                                                                            // 36
                        break;                                                                                         // 36
                                                                                                                       //
                    case 11:                                                                                           // 36
                        _context.prev = 11;                                                                            // 36
                        _context.t0 = _context["catch"](7);                                                            // 36
                        throw new Error('Cant read the security rule definitions file: ' + file);                      // 36
                                                                                                                       //
                    case 14:                                                                                           // 36
                        securityRules.forEach(function (rule) {                                                        // 51
                            //check if the rule already exists in Sense                                                // 52
                            if (!QSLic.getSystemRules(rule.name).length) {                                             // 53
                                //if not exist, create it                                                              // 54
                                var response = qrs.post('/qrs/SystemRule', null, rule);                                // 55
                            } else {                                                                                   // 56
                                console.log('Security rule "' + rule.name + '" already existed');                      // 57
                            }                                                                                          // 58
                        });                                                                                            // 59
                                                                                                                       //
                    case 15:                                                                                           // 36
                    case "end":                                                                                        // 36
                        return _context.stop();                                                                        // 36
                }                                                                                                      // 36
            }                                                                                                          // 36
        }                                                                                                              // 36
                                                                                                                       //
        return createSecurityRules$;                                                                                   // 36
    }(), null, this, [[7, 11]]);                                                                                       // 36
}                                                                                                                      // 36
                                                                                                                       //
function stringToJSON(myString) {                                                                                      // 62
    var myJSONString = JSON.stringify(myString);                                                                       // 63
    var myEscapedJSONString = myJSONString.replace(/\\n/g, "\\n").replace(/\\'/g, "\\'").replace(/\\"/g, '\\"').replace(/\\&/g, "\\&").replace(/\\r/g, "\\r").replace(/\\t/g, "\\t").replace(/\\b/g, "\\b").replace(/\\f/g, "\\f");
    console.log('myEscapedJSONString', myEscapedJSONString);                                                           // 73
}                                                                                                                      // 74
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"APILogs.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/APILogs.js                                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({                                                                                                        // 1
    APILogs: function () {                                                                                             // 1
        return APILogs;                                                                                                // 1
    },                                                                                                                 // 1
    REST_Log: function () {                                                                                            // 1
        return REST_Log;                                                                                               // 1
    }                                                                                                                  // 1
});                                                                                                                    // 1
var Mongo = void 0;                                                                                                    // 1
module.watch(require("meteor/mongo"), {                                                                                // 1
    Mongo: function (v) {                                                                                              // 1
        Mongo = v;                                                                                                     // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var APILogs = new Mongo.Collection('apiLogs');                                                                         // 3
                                                                                                                       //
function REST_Log(call) {                                                                                              // 5
    var userId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'Not defined';                    // 5
    call.createDate = new Date();                                                                                      // 6
    call.generationUserId = userId;                                                                                    // 7
                                                                                                                       //
    if (Meteor.isServer) {                                                                                             // 8
        APILogs.rawCollection().insert(call);                                                                          // 9
    } else {                                                                                                           // 10
        APILogs.insert(call);                                                                                          // 11
    }                                                                                                                  // 12
                                                                                                                       //
    return;                                                                                                            // 13
}                                                                                                                      // 15
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"apps.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/apps.js                                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({                                                                                                        // 1
  Apps: function () {                                                                                                  // 1
    return Apps;                                                                                                       // 1
  },                                                                                                                   // 1
  TemplateApps: function () {                                                                                          // 1
    return TemplateApps;                                                                                               // 1
  },                                                                                                                   // 1
  GeneratedResources: function () {                                                                                    // 1
    return GeneratedResources;                                                                                         // 1
  }                                                                                                                    // 1
});                                                                                                                    // 1
var Mongo = void 0;                                                                                                    // 1
module.watch(require("meteor/mongo"), {                                                                                // 1
  Mongo: function (v) {                                                                                                // 1
    Mongo = v;                                                                                                         // 1
  }                                                                                                                    // 1
}, 0);                                                                                                                 // 1
var Apps = new Mongo.Collection('apps');                                                                               // 3
var TemplateApps = new Mongo.Collection('templateApps');                                                               // 4
var GeneratedResources = new Mongo.Collection('generatedResources');                                                   // 5
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"config.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/config.js                                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _regenerator = require("babel-runtime/regenerator");                                                               //
                                                                                                                       //
var _regenerator2 = _interopRequireDefault(_regenerator);                                                              //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
module.export({                                                                                                        // 1
    senseConfig: function () {                                                                                         // 1
        return senseConfig;                                                                                            // 1
    },                                                                                                                 // 1
    missingParameters: function () {                                                                                   // 1
        return missingParameters;                                                                                      // 1
    },                                                                                                                 // 1
    compareKeys: function () {                                                                                         // 1
        return compareKeys;                                                                                            // 1
    }                                                                                                                  // 1
});                                                                                                                    // 1
var Mongo = void 0;                                                                                                    // 1
module.watch(require("meteor/mongo"), {                                                                                // 1
    Mongo: function (v) {                                                                                              // 1
        Mongo = v;                                                                                                     // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var Random = void 0;                                                                                                   // 1
module.watch(require("meteor/random"), {                                                                               // 1
    Random: function (v) {                                                                                             // 1
        Random = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 1);                                                                                                                 // 1
                                                                                                                       //
var _ = void 0;                                                                                                        // 1
                                                                                                                       //
module.watch(require("meteor/underscore"), {                                                                           // 1
    "default": function (v) {                                                                                          // 1
        _ = v;                                                                                                         // 1
    }                                                                                                                  // 1
}, 2);                                                                                                                 // 1
                                                                                                                       //
var _QIXSchema = require('/node_modules/enigma.js/schemas/qix/12.20.0/schema.json'); //This is the config that we need to make available on the client (the webpage)
                                                                                                                       //
                                                                                                                       //
if (Meteor.isClient) {                                                                                                 // 11
    var _senseConfig = {                                                                                               // 12
        "host": Meteor.settings.public.qlikSenseHost,                                                                  // 13
        "port": Meteor.settings.public.qlikSensePort,                                                                  // 14
        "virtualProxyClientUsage": Meteor.settings.public.virtualProxyClientUsage,                                     // 15
        "virtualProxySlideGenerator": Meteor.settings.public.slideGenerator.virtualProxy,                              // 16
        "webIntegrationDemoPort": Meteor.settings.public.webIntegrationDemoPort,                                       // 17
        "QIXSchema": _QIXSchema //ssbi and slide generator app id are set automatically on main.js (client side, via a call to the server)
        // config.SSBIAppId =                                                                                          // 20
        // config.slideGeneratorAppId =                                                                                // 21
                                                                                                                       //
    };                                                                                                                 // 12
} //SERVER SIDE                                                                                                        // 23
                                                                                                                       //
                                                                                                                       //
if (Meteor.isServer) {                                                                                                 // 27
    var validateJSON = function (body) {                                                                               // 27
        try {                                                                                                          // 144
            var data = JSON.parse(body); // if came to here, then valid                                                // 145
                                                                                                                       //
            return data;                                                                                               // 147
        } catch (e) {                                                                                                  // 148
            // failed to parse                                                                                         // 149
            return null;                                                                                               // 150
        }                                                                                                              // 151
    };                                                                                                                 // 152
                                                                                                                       //
    var generateXrfkey = function () {                                                                                 // 27
        return Random.hexString(16);                                                                                   // 165
    }; // //https://www.npmjs.com/package/qrs                                                                          // 166
    //HEADER AUTHENTICATION                                                                                            // 169
                                                                                                                       //
                                                                                                                       //
    module.export({                                                                                                    // 1
        authHeaders: function () {                                                                                     // 1
            return authHeaders;                                                                                        // 1
        },                                                                                                             // 1
        _certs: function () {                                                                                          // 1
            return _certs;                                                                                             // 1
        },                                                                                                             // 1
        configCerticates: function () {                                                                                // 1
            return configCerticates;                                                                                   // 1
        },                                                                                                             // 1
        enigmaServerConfig: function () {                                                                              // 1
            return enigmaServerConfig;                                                                                 // 1
        },                                                                                                             // 1
        validateJSON: function () {                                                                                    // 1
            return validateJSON;                                                                                       // 1
        },                                                                                                             // 1
        engineConfig: function () {                                                                                    // 1
            return engineConfig;                                                                                       // 1
        },                                                                                                             // 1
        qlikHDRServer: function () {                                                                                   // 1
            return qlikHDRServer;                                                                                      // 1
        },                                                                                                             // 1
        qrsSrv: function () {                                                                                          // 1
            return qrsSrv;                                                                                             // 1
        },                                                                                                             // 1
        qrs: function () {                                                                                             // 1
            return qrs;                                                                                                // 1
        },                                                                                                             // 1
        QRSconfig: function () {                                                                                       // 1
            return QRSconfig;                                                                                          // 1
        }                                                                                                              // 1
    });                                                                                                                // 1
    var crypto = void 0;                                                                                               // 1
    module.watch(require("crypto"), {                                                                                  // 1
        "default": function (v) {                                                                                      // 1
            crypto = v;                                                                                                // 1
        }                                                                                                              // 1
    }, 3);                                                                                                             // 1
    var myQRS = void 0;                                                                                                // 1
    module.watch(require("/imports/api/server/QRSAPI"), {                                                              // 1
        myQRS: function (v) {                                                                                          // 1
            myQRS = v;                                                                                                 // 1
        }                                                                                                              // 1
    }, 4);                                                                                                             // 1
    console.log('This Sense SaaS demo tool uses this config as defined in the settings-XYZ.json file in the root folder: ', Meteor.settings.private);
                                                                                                                       //
    var fs = require('fs-extra');                                                                                      // 30
                                                                                                                       //
    var path = require('path'); // import fs from 'fs';                                                                // 31
                                                                                                                       //
                                                                                                                       //
    var bluebird = require('bluebird');                                                                                // 36
                                                                                                                       //
    var WebSocket = require('ws');                                                                                     // 37
                                                                                                                       //
    var _senseConfig = {                                                                                               // 39
        "host": Meteor.settings.public.qlikSenseHost,                                                                  // 40
        "SenseServerInternalLanIP": Meteor.settings.private.SenseServerInternalLanIP,                                  // 41
        "port": Meteor.settings.public.qlikSensePort,                                                                  // 42
        "useSSL": Meteor.settings.private.useSSL,                                                                      // 43
        "xrfkey": generateXrfkey(),                                                                                    // 44
        "virtualProxy": Meteor.settings.private.virtualProxy,                                                          // 45
        //used to connect via REST to Sense, we authenticate via a http header. not for production!!!                  // 45
        "virtualProxyClientUsage": Meteor.settings.public.virtualProxyClientUsage,                                     // 46
        "headerKey": Meteor.settings.private.headerKey,                                                                // 47
        "headerValue": process.env.USERDOMAIN + '\\' + process.env.USERNAME,                                           // 48
        //"QLIK-AB0Q2URN5T\\Qlikexternal",                                                                             // 48
        "isSecure": Meteor.settings.private.isSecure,                                                                  // 49
        "qrsPort": Meteor.settings.private.qrsPort,                                                                    // 50
        "enginePort": Meteor.settings.private.enginePort                                                               // 51
    };                                                                                                                 // 39
                                                                                                                       //
    if (missingParameters(_senseConfig)) {                                                                             // 54
        throw 'Missing parameters in _senseConfig, you did not populate the settings.json file in the project root of MeteorQRS, or with docker: did you mount the volume with the config including the settings.json file? (with the correct name)';
    }                                                                                                                  // 56
                                                                                                                       //
    if (!_senseConfig.host) {                                                                                          // 58
        throw new Meteor.Error('You have not started this meteor project with: meteor --settings settings-development.json ? You missed the reference to this settings file, or it is empty?');
    } //CONFIG FOR HTTP MODULE WITH HEADER AUTH (TO MAKE REST CALLS TO SENSE VIA HTTP CALLS)                           // 60
                                                                                                                       //
                                                                                                                       //
    var authHeaders = {                                                                                                // 63
        'hdr-usr': _senseConfig.headerValue,                                                                           // 64
        'X-Qlik-xrfkey': _senseConfig.xrfkey //                                                                        // 65
                                                                                                                       //
    };                                                                                                                 // 63
                                                                                                                       //
    if (!Meteor.settings.private.certificatesDirectory) {                                                              // 67
        Meteor.settings.private.certificatesDirectory = 'C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates';
        console.log('Meteor.settings.private.certificatesDirectory was empty, setting it to default: ', Meteor.settings.broker.customerDataDir);
    }                                                                                                                  // 70
                                                                                                                       //
    var _certs = {                                                                                                     // 71
        ca: fs.readFileSync(Meteor.settings.private.certificatesDirectory + '/root.pem'),                              // 72
        key: fs.readFileSync(Meteor.settings.private.certificatesDirectory + '/client_key.pem'),                       // 73
        cert: fs.readFileSync(Meteor.settings.private.certificatesDirectory + '/client.pem') //if you use windows and this tool runs on the same machine, you can keep the parameters empty
        // and we use the user the node service runs under...                                                          // 78
                                                                                                                       //
    };                                                                                                                 // 71
    var qlikUserDomain = '';                                                                                           // 79
    var qlikUser = '';                                                                                                 // 80
                                                                                                                       //
    if (!Meteor.settings.broker.connectToSenseAsUserDirectory) {                                                       // 82
        qlikUserDomain = process.env.USERDOMAIN;                                                                       // 83
        qlikUser = process.env.USERNAME;                                                                               // 84
    } else {                                                                                                           // 85
        qlikUserDomain = Meteor.settings.broker.connectToSenseAsUserDirectory;                                         // 86
        qlikUser = Meteor.settings.broker.connectToSenseAsUser;                                                        // 87
    }                                                                                                                  // 88
                                                                                                                       //
    var configCerticates = {                                                                                           // 90
        rejectUnauthorized: false,                                                                                     // 91
        hostname: _senseConfig.SenseServerInternalLanIP,                                                               // 92
        headers: {                                                                                                     // 93
            'x-qlik-xrfkey': _senseConfig.xrfkey,                                                                      // 94
            'X-Qlik-User': "UserDirectory=" + qlikUserDomain + ";UserId=" + qlikUser,                                  // 95
            //`UserDirectory=INTERNAL;UserId=sa_repository` you need to give this user extra roles before this works   // 95
            'Content-Type': 'application/json'                                                                         // 96
        },                                                                                                             // 93
        key: _certs.key,                                                                                               // 98
        cert: _certs.cert,                                                                                             // 99
        ca: _certs.ca                                                                                                  // 100
    };                                                                                                                 // 90
    console.log('configCerticates: we connect to Qlik Sense using these credentials: ', configCerticates); //used for engimaJS, the engine API javascript wrapper
                                                                                                                       //
    var _engineConfig = {                                                                                              // 105
        host: _senseConfig.SenseServerInternalLanIP,                                                                   // 106
        isSecure: _senseConfig.isSecure,                                                                               // 107
        port: Meteor.settings.private.enginePort,                                                                      // 108
        headers: {                                                                                                     // 109
            'X-Qlik-User': "UserDirectory=" + qlikUserDomain + ";UserId=" + qlikUser                                   // 110
        },                                                                                                             // 109
        ca: _certs.ca,                                                                                                 // 112
        key: _certs.key,                                                                                               // 113
        cert: _certs.cert,                                                                                             // 114
        passphrase: Meteor.settings.private.passphrase,                                                                // 115
        rejectUnauthorized: false,                                                                                     // 116
        // Don't reject self-signed certs                                                                              // 116
        appname: null,                                                                                                 // 117
        QIXSchema: _QIXSchema                                                                                          // 118
    };                                                                                                                 // 105
    var enigmaServerConfig = {                                                                                         // 121
        schema: _engineConfig.QIXSchema,                                                                               // 122
        // appId: appId,                                                                                               // 123
        session: {                                                                                                     // 124
            host: _engineConfig.host,                                                                                  // 125
            port: _engineConfig.port                                                                                   // 126
        },                                                                                                             // 124
        Promise: bluebird,                                                                                             // 128
        createSocket: function (url) {                                                                                 // 129
            return new WebSocket(url, {                                                                                // 130
                ca: _certs.ca,                                                                                         // 131
                key: _certs.key,                                                                                       // 132
                cert: _certs.cert,                                                                                     // 133
                headers: {                                                                                             // 134
                    'X-Qlik-User': "UserDirectory=" + qlikUserDomain + ";UserId=" + qlikUser                           // 135
                }                                                                                                      // 134
            });                                                                                                        // 130
        }                                                                                                              // 138
    };                                                                                                                 // 121
    var engineConfig = _engineConfig;                                                                                  // 155
    var qlikHDRServer = 'http://' + _senseConfig.SenseServerInternalLanIP + ':' + _senseConfig.port + '/' + _senseConfig.virtualProxy;
    var qrsSrv = 'https://' + _senseConfig.SenseServerInternalLanIP + ':' + _senseConfig.qrsPort;                      // 160
    var qrs = new myQRS();                                                                                             // 162
    var QRSconfig = {                                                                                                  // 170
        authentication: 'header',                                                                                      // 171
        host: _senseConfig.host,                                                                                       // 172
        port: _senseConfig.port,                                                                                       // 173
        useSSL: false,                                                                                                 // 174
        virtualProxy: _senseConfig.virtualProxy,                                                                       // 175
        //header proxy                                                                                                 // 175
        headerKey: _senseConfig.headerKey,                                                                             // 176
        headerValue: _senseConfig.headerValue //'mydomain\\justme'                                                     // 177
                                                                                                                       //
    };                                                                                                                 // 170
                                                                                                                       //
    try {                                                                                                              // 180
        Meteor.startup(function () {                                                                                   // 181
            function _callee() {                                                                                       // 181
                var file, exampleSettingsFile, keysEqual;                                                              // 181
                return _regenerator2.default.async(function () {                                                       // 181
                    function _callee$(_context) {                                                                      // 181
                        while (1) {                                                                                    // 181
                            switch (_context.prev = _context.next) {                                                   // 181
                                case 0:                                                                                // 181
                                    console.log('------------------------------------');                               // 182
                                    console.log('Validate settings.json parameters');                                  // 183
                                    console.log('------------------------------------');                               // 184
                                    Meteor.absolutePath = path.resolve('.').split(path.sep + '.meteor')[0];            // 185
                                    console.log('Meteor tries to find the settings.json file in Meteor.absolutePath:', Meteor.absolutePath);
                                    file = path.join(Meteor.absolutePath, 'settings-development-example.json'); // READ THE FILE 
                                                                                                                       //
                                    _context.next = 8;                                                                 // 181
                                    return _regenerator2.default.awrap(fs.readJson(file));                             // 181
                                                                                                                       //
                                case 8:                                                                                // 181
                                    exampleSettingsFile = _context.sent;                                               // 190
                                    _context.prev = 9;                                                                 // 181
                                    validateJSON(exampleSettingsFile);                                                 // 192
                                    _context.next = 16;                                                                // 181
                                    break;                                                                             // 181
                                                                                                                       //
                                case 13:                                                                               // 181
                                    _context.prev = 13;                                                                // 181
                                    _context.t0 = _context["catch"](9);                                                // 181
                                    throw new Error('Meteor wants to check your settings.json with the parameters in the example settings.json in the project root. Error: Cant read the example settings definitions file (not valid JSON): ' + file);
                                                                                                                       //
                                case 16:                                                                               // 181
                                    keysEqual = compareKeys(Meteor.settings, exampleSettingsFile);                     // 197
                                    console.log('Settings file has all the keys as specified in the example json file?', keysEqual);
                                                                                                                       //
                                    if (keysEqual) {                                                                   // 181
                                        _context.next = 21;                                                            // 181
                                        break;                                                                         // 181
                                    }                                                                                  // 181
                                                                                                                       //
                                    console.error("Settings file incomplete, Please verify if you have all the keys as specified in the settings-development-example.json in the project root folder. In my dev environment: C:UsersQlikexternalDocumentsGitHubQRSMeteor");
                                    throw new Error("Settings file incomplete, Please verify if you have all the keys as specified in the settings-development-example.json in the project root folder. In my dev environment: C:UsersQlikexternalDocumentsGitHubQRSMeteor");
                                                                                                                       //
                                case 21:                                                                               // 181
                                case "end":                                                                            // 181
                                    return _context.stop();                                                            // 181
                            }                                                                                          // 181
                        }                                                                                              // 181
                    }                                                                                                  // 181
                                                                                                                       //
                    return _callee$;                                                                                   // 181
                }(), null, this, [[9, 13]]);                                                                           // 181
            }                                                                                                          // 181
                                                                                                                       //
            return _callee;                                                                                            // 181
        }());                                                                                                          // 181
    } catch (error) {                                                                                                  // 205
        throw new Error(error);                                                                                        // 206
    }                                                                                                                  // 207
} //exit server side config                                                                                            // 208
                                                                                                                       //
                                                                                                                       //
var senseConfig = _senseConfig;                                                                                        // 210
                                                                                                                       //
function missingParameters(obj) {                                                                                      // 227
    for (var key in meteorBabelHelpers.sanitizeForInObject(obj)) {                                                     // 228
        if (obj[key] !== null && obj[key] != "") return false;                                                         // 229
    }                                                                                                                  // 231
                                                                                                                       //
    return true;                                                                                                       // 232
}                                                                                                                      // 233
                                                                                                                       //
function compareKeys(a, b) {                                                                                           // 235
    var aKeys = Object.keys(a).sort();                                                                                 // 236
    var bKeys = Object.keys(b).sort();                                                                                 // 237
    return JSON.stringify(aKeys) === JSON.stringify(bKeys);                                                            // 238
}                                                                                                                      // 239
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"customers.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/customers.js                                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({                                                                                                        // 1
    Customers: function () {                                                                                           // 1
        return Customers;                                                                                              // 1
    },                                                                                                                 // 1
    dummyCustomer: function () {                                                                                       // 1
        return dummyCustomer;                                                                                          // 1
    },                                                                                                                 // 1
    dummyCustomers: function () {                                                                                      // 1
        return dummyCustomers;                                                                                         // 1
    }                                                                                                                  // 1
});                                                                                                                    // 1
var Mongo = void 0;                                                                                                    // 1
module.watch(require("meteor/mongo"), {                                                                                // 1
    Mongo: function (v) {                                                                                              // 1
        Mongo = v;                                                                                                     // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var Customers = new Mongo.Collection('customers');                                                                     // 2
Meteor.methods({                                                                                                       // 4
    updateUserForCustomer: function (updatedUser) {                                                                    // 5
        var selection = {                                                                                              // 6
            'generationUserId': Meteor.userId(),                                                                       // 7
            'users.name': updatedUser.name                                                                             // 8
        };                                                                                                             // 6
        Customers.update(selection, {                                                                                  // 10
            $set: {                                                                                                    // 11
                'users.$': updatedUser                                                                                 // 11
            }                                                                                                          // 11
        });                                                                                                            // 11
    }                                                                                                                  // 12
});                                                                                                                    // 4
Customers.attachSchema(new SimpleSchema({                                                                              // 15
    name: {                                                                                                            // 16
        type: String,                                                                                                  // 17
        label: "Customer name"                                                                                         // 18
    },                                                                                                                 // 16
    checked: {                                                                                                         // 20
        type: Boolean,                                                                                                 // 21
        label: "Selected for the generation?",                                                                         // 22
        optional: true,                                                                                                // 23
        defaultValue: true                                                                                             // 24
    },                                                                                                                 // 20
    createdAt: {                                                                                                       // 26
        type: Date,                                                                                                    // 27
        label: "Date created",                                                                                         // 28
        optional: true                                                                                                 // 29
    },                                                                                                                 // 26
    createdBy: {                                                                                                       // 31
        type: Object,                                                                                                  // 32
        label: "Date created",                                                                                         // 33
        optional: true                                                                                                 // 34
    },                                                                                                                 // 31
    generationUserId: {                                                                                                // 36
        type: String,                                                                                                  // 37
        autoValue: function () {                                                                                       // 38
            return this.userId;                                                                                        // 39
        }                                                                                                              // 40
    },                                                                                                                 // 36
    users: {                                                                                                           // 42
        type: [Object],                                                                                                // 43
        optional: true                                                                                                 // 44
    },                                                                                                                 // 42
    "users.$": {                                                                                                       // 46
        type: Object                                                                                                   // 47
    },                                                                                                                 // 46
    "users.$.name": {                                                                                                  // 49
        type: String                                                                                                   // 50
    },                                                                                                                 // 49
    "users.$.group": {                                                                                                 // 52
        type: String,                                                                                                  // 53
        allowedValues: ['Consumer', 'Contributor', 'Developer', 'Admin', 'Global auditor']                             // 54
    },                                                                                                                 // 52
    "users.$.currentlyLoggedIn": {                                                                                     // 56
        type: Boolean,                                                                                                 // 57
        optional: true                                                                                                 // 58
    },                                                                                                                 // 56
    "users.$.country": {                                                                                               // 60
        type: String,                                                                                                  // 61
        allowedValues: ['Germany', 'United States', 'Italy']                                                           // 62
    }                                                                                                                  // 60
}));                                                                                                                   // 15
var dummyCustomer = {                                                                                                  // 66
    "name": faker.company.companyName(),                                                                               // 67
    "checked": true,                                                                                                   // 68
    "user": {                                                                                                          // 69
        "name": 'John',                                                                                                // 70
        "group": "Consumer",                                                                                           // 71
        "currentlyLoggedIn": false,                                                                                    // 72
        "country": "Germany"                                                                                           // 73
    }                                                                                                                  // 69
};                                                                                                                     // 66
var dummyCustomers = [{                                                                                                // 77
    "name": faker.company.companyName(),                                                                               // 78
    "checked": true,                                                                                                   // 79
    "users": [{                                                                                                        // 80
        "name": 'John',                                                                                                // 81
        "group": "Consumer",                                                                                           // 82
        "currentlyLoggedIn": false,                                                                                    // 83
        "country": "Germany"                                                                                           // 84
    }, {                                                                                                               // 80
        "name": 'Linda',                                                                                               // 86
        "group": "Contributor",                                                                                        // 87
        "currentlyLoggedIn": false,                                                                                    // 88
        "country": "United States"                                                                                     // 89
    }, {                                                                                                               // 85
        "name": 'Martin',                                                                                              // 91
        "group": "Developer",                                                                                          // 92
        "currentlyLoggedIn": false,                                                                                    // 93
        "country": "Italy"                                                                                             // 94
    }, {                                                                                                               // 90
        "name": 'Paul',                                                                                                // 96
        "group": "Admin",                                                                                              // 97
        "currentlyLoggedIn": false,                                                                                    // 98
        "country": "Italy"                                                                                             // 99
    }]                                                                                                                 // 95
}, {                                                                                                                   // 77
    "name": faker.company.companyName(),                                                                               // 102
    "checked": true,                                                                                                   // 103
    "users": [{                                                                                                        // 104
        "name": faker.name.findName(),                                                                                 // 105
        "group": "Consumer",                                                                                           // 106
        "currentlyLoggedIn": false,                                                                                    // 107
        "country": "Italy"                                                                                             // 108
    }]                                                                                                                 // 104
}, {                                                                                                                   // 101
    "name": faker.company.companyName(),                                                                               // 111
    "checked": true,                                                                                                   // 112
    "users": [{                                                                                                        // 113
        "name": faker.name.findName(),                                                                                 // 114
        "group": "Consumer",                                                                                           // 115
        "currentlyLoggedIn": false,                                                                                    // 116
        "country": "Italy"                                                                                             // 117
    }] // {                                                                                                            // 113
    //     "name": "QPMG Accountants",                                                                                 // 121
    //     "checked": true,                                                                                            // 122
    //     "users": [{                                                                                                 // 123
    //         "name": "Ron",                                                                                          // 124
    //         "group": "Global Auditor",                                                                              // 125
    //         "currentlyLoggedIn": false,                                                                             // 126
    //         "country": "Italy"                                                                                      // 127
    //     }]                                                                                                          // 128
    // }                                                                                                               // 129
    // { "name": "A&R Partners", "checked": true },                                                                    // 134
    //     { "name": "A2Z Solutions", "checked": true },                                                               // 135
    //     { "name": "Aaron D. Meyer & Associates", "checked": true },                                                 // 136
    //     { "name": "Aaron Products", "checked": true },                                                              // 137
    // { "name": "Active Data", "checked": true },                                                                     // 138
    // { "name": "Ben and Jerry’s", "checked": true },                                                                 // 139
    // { "name": "Benedict", "checked": true },                                                                        // 140
    // { "name": "Bizmarts", "checked": true },                                                                        // 141
    // { "name": "C & C  Design", "checked": true },                                                                   // 142
    // { "name": "C & J Engineering", "checked": true },                                                               // 143
    // { "name": "CAF Systemhaus", "checked": true },                                                                  // 144
    // { "name": "CAM Group", "checked": true },                                                                       // 145
    // { "name": "Caribian Specialties", "checked": true },                                                            // 146
    // { "name": "City Fresh Foods", "checked": true },                                                                // 147
    // { "name": "Clearout", "checked": true },                                                                        // 148
    // { "name": "David Spencer Ltd.", "checked": true },                                                              // 149
    // { "name": "Dayton Malleable Inc.", "checked": true },                                                           // 150
    // { "name": "DCP Research", "checked": true },                                                                    // 151
    // { "name": "DCS International", "checked": true },                                                               // 152
    // { "name": "DCS Laboratory", "checked": true },                                                                  // 153
    // { "name": "Deak-Perera Group.", "checked": true },                                                              // 154
    // { "name": "Earth", "checked": true },                                                                           // 155
    // { "name": "eDistrict", "checked": true },                                                                       // 156
    // { "name": "EDP", "checked": true },                                                                             // 157
    // { "name": "Ethyl Corporation", "checked": true },                                                               // 158
    // { "name": "Federal Focus", "checked": true },                                                                   // 159
    // { "name": "Fill It", "checked": true },                                                                         // 160
    // { "name": "Filmotype", "checked": true },                                                                       // 161
    // { "name": "Fins", "checked": true },                                                                            // 162
    // { "name": "Gate", "checked": true },                                                                            // 163
    // { "name": "Gulf and Western Industries", "checked": true },                                                     // 164
    // { "name": "Harte-Hanks (formerly Locator)", "checked": true },                                                  // 165
    // { "name": "Harvard Trust Company", "checked": true },                                                           // 166
    // { "name": "HCHS", "checked": true },                                                                            // 167
    // { "name": "Healtheon", "checked": true },                                                                       // 168
    // { "name": "Hetrick Systems", "checked": true },                                                                 // 169
    // { "name": "Home Team", "checked": true },                                                                       // 170
    // { "name": "Homebound", "checked": true },                                                                       // 171
    // { "name": "IBVA", "checked": true },                                                                            // 172
    // { "name": "Icon", "checked": true },                                                                            // 173
    // { "name": "Icon Site Builders", "checked": true },                                                              // 174
    // { "name": "Idyllwild", "checked": true },                                                                       // 175
    // { "name": "J. S. Lee Associates", "checked": true },                                                            // 176
    // { "name": "K International", "checked": true },                                                                 // 177
    // { "name": "K.C. Irving", "checked": true },                                                                     // 178
    // { "name": "Kari & Associates", "checked": true },                                                               // 179
    // { "name": "Karsing", "checked": true },                                                                         // 180
    // { "name": "Kazinformcom", "checked": true },                                                                    // 181
    // { "name": "KentISP", "checked": true },                                                                         // 182
    // { "name": "Kool-Seal", "checked": true },                                                                       // 183
    // { "name": "Laker Airways", "checked": true },                                                                   // 184
    // { "name": "Livermore  Laboratories (LSLI)", "checked": true },                                                  // 185
    // { "name": "LiveWire BBS and   Favourite Links", "checked": true },                                              // 186
    // { "name": "MATRIX", "checked": true },                                                                          // 187
    // { "name": "Miles Laboratories, Inc.", "checked": true },                                                        // 188
    // { "name": "NACSCORP", "checked": true },                                                                        // 189
    // { "name": "Onestar", "checked": true },                                                                         // 190
    // { "name": "Pace", "checked": true },                                                                            // 191
    // { "name": "Pacific Group", "checked": true },                                                                   // 192
    // { "name": "Pacific Matics", "checked": true },                                                                  // 193
    // { "name": "Pacific Sierra Research", "checked": true },                                                         // 194
    // { "name": "Pacific Voice", "checked": true },                                                                   // 195
    // { "name": "Pacific West Enterprises", "checked": true },                                                        // 196
    // { "name": "PacificServ", "checked": true },                                                                     // 197
    // { "name": "Panngea", "checked": true },                                                                         // 198
    // { "name": "PAP (Maintenance)", "checked": true },                                                               // 199
    // { "name": "Paracel", "checked": true },                                                                         // 200
    // { "name": "Patient", "checked": true },                                                                         // 201
    // { "name": "Pinnacle Micro", "checked": true },                                                                  // 202
    // { "name": "QualServe", "checked": true },                                                                       // 203
    // { "name": "Quantum 4Xyte  Architects", "checked": true },                                                       // 204
    // { "name": "Qwest", "checked": true },                                                                           // 205
    // { "name": "R&R Group", "checked": true },                                                                       // 206
    // { "name": "R.J. Matter & Associates", "checked": true },                                                        // 207
    // { "name": "Ra Co Amo", "checked": true },                                                                       // 208
    // { "name": "RC", "checked": true },                                                                              // 209
    // { "name": "Ready-to-Run", "checked": true },                                                                    // 210
    // { "name": "Remedy", "checked": true },                                                                          // 211
    // { "name": "Renegade info Crew", "checked": true },                                                              // 212
    // { "name": "Reuters Usability Group", "checked": true },                                                         // 213
    // { "name": "ReviewBooth", "checked": true },                                                                     // 214
    // { "name": "RFI Corporation", "checked": true },                                                                 // 215
    // { "name": "Road Warrior International", "checked": true },                                                      // 216
    // { "name": "Robust Code", "checked": true },                                                                     // 217
    // { "name": "Sage", "checked": true },                                                                            // 218
    // { "name": "Sagent", "checked": true },                                                                          // 219
    // { "name": "Salamander Junction", "checked": true },                                                             // 220
    // { "name": "Satronix", "checked": true },                                                                        // 221
    // { "name": "Satyam", "checked": true },                                                                          // 222
    // { "name": "Scientific Atlanta", "checked": true },                                                              // 223
    // { "name": "ScotGold Products", "checked": true },                                                               // 224
    // { "name": "Screen Saver.com", "checked": true },                                                                // 225
    // { "name": "Sifton Properties Limited", "checked": true },                                                       // 226
    // { "name": "Sigma", "checked": true },                                                                           // 227
    // { "name": "Signature", "checked": true },                                                                       // 228
    // { "name": "SignatureFactory", "checked": true },                                                                // 229
    // { "name": "Soloman Brothers", "checked": true },                                                                // 230
    // { "name": "Southern Company", "checked": true },                                                                // 231
    // { "name": "Stone Consolidated Corporation", "checked": true },                                                  // 232
    // { "name": "Talou", "checked": true },                                                                           // 233
    // { "name": "Tampere", "checked": true },                                                                         // 234
    // { "name": "Tandy Corporation", "checked": true },                                                               // 235
    // { "name": "Tangent", "checked": true },                                                                         // 236
    // { "name": "Tao Group", "checked": true },                                                                       // 237
    // { "name": "Target Marketing", "checked": true },                                                                // 238
    // { "name": "Team ASA", "checked": true },                                                                        // 239
    // { "name": "Team Financial Management Systems", "checked": true },                                               // 240
    // { "name": "Teca-Print", "checked": true },                                                                      // 241
    // { "name": "Time Warner", "checked": true },                                                                     // 242
    // { "name": "Towmotor Corporation", "checked": true },                                                            // 243
    // { "name": "Tredegar Company", "checked": true },                                                                // 244
    // { "name": "Trend Line Corporation", "checked": true },                                                          // 245
    // { "name": "U. S. Exchange", "checked": true },                                                                  // 246
    // { "name": "Unison Management Concepts", "checked": true },                                                      // 247
    // { "name": "United States  (USIT)", "checked": true },                                                           // 248
    // { "name": "UUmail", "checked": true },                                                                          // 249
    // { "name": "ValiCert", "checked": true },                                                                        // 250
    // { "name": "Valley  Solutions", "checked": true },                                                               // 251
    // { "name": "Valpatken", "checked": true },                                                                       // 252
    // { "name": "Vanstar", "checked": true },                                                                         // 253
    // { "name": "Venable", "checked": true },                                                                         // 254
    // { "name": "Venred", "checked": true },                                                                          // 255
    // { "name": "Watcom International", "checked": true },                                                            // 256
    // { "name": "Xentec", "checked": true },                                                                          // 257
    // { "name": "Xilinx", "checked": true },                                                                          // 258
    // { "name": "XVT", "checked": true },                                                                             // 259
    // { "name": "Zero Assumption Recovery", "checked": true },                                                        // 260
    // { "name": "Zilog", "checked": true },                                                                           // 261
    // { "name": "Zitel", "checked": true },                                                                           // 262
                                                                                                                       //
}];                                                                                                                    // 110
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"streams.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/streams.js                                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({                                                                                                        // 1
  Streams: function () {                                                                                               // 1
    return Streams;                                                                                                    // 1
  }                                                                                                                    // 1
});                                                                                                                    // 1
var Mongo = void 0;                                                                                                    // 1
module.watch(require("meteor/mongo"), {                                                                                // 1
  Mongo: function (v) {                                                                                                // 1
    Mongo = v;                                                                                                         // 1
  }                                                                                                                    // 1
}, 0);                                                                                                                 // 1
var Streams = new Mongo.Collection('streams');                                                                         // 3
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup":{"accounts-config.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/startup/accounts-config.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AccountsTemplates.configure({                                                                                          // 2
    // Behavior                                                                                                        // 3
    confirmPassword: false,                                                                                            // 4
    enablePasswordChange: true,                                                                                        // 5
    forbidClientAccountCreation: false,                                                                                // 6
    overrideLoginErrors: true,                                                                                         // 7
    sendVerificationEmail: false,                                                                                      // 8
    lowercaseUsername: false,                                                                                          // 9
    focusFirstInput: true,                                                                                             // 10
    // Appearance                                                                                                      // 12
    showAddRemoveServices: false,                                                                                      // 13
    showForgotPasswordLink: false,                                                                                     // 14
    showLabels: true,                                                                                                  // 15
    showPlaceholders: true,                                                                                            // 16
    showResendVerificationEmailLink: false,                                                                            // 17
    // Client-side Validation                                                                                          // 19
    continuousValidation: false,                                                                                       // 20
    negativeFeedback: false,                                                                                           // 21
    negativeValidation: true,                                                                                          // 22
    positiveValidation: true,                                                                                          // 23
    positiveFeedback: true,                                                                                            // 24
    showValidating: true,                                                                                              // 25
    // // Privacy Policy and Terms of Use                                                                              // 27
    // privacyUrl: 'privacy',                                                                                          // 28
    // termsUrl: 'terms-of-use',                                                                                       // 29
    // Redirects                                                                                                       // 31
    homeRoutePath: '/',                                                                                                // 32
    redirectTimeout: 4000,                                                                                             // 33
    // // Hooks                                                                                                        // 35
    // onLogoutHook: myLogoutFunc,                                                                                     // 36
    // onSubmitHook: mySubmitFunc,                                                                                     // 37
    // preSignUpHook: myPreSubmitFunc,                                                                                 // 38
    // postSignUpHook: myPostSubmitFunc,                                                                               // 39
    // Texts                                                                                                           // 41
    texts: {                                                                                                           // 42
        button: {                                                                                                      // 43
            signUp: "Register now to start using the Qlik Sense SaaS demo"                                             // 44
        },                                                                                                             // 43
        socialSignUp: "Register",                                                                                      // 46
        socialIcons: {                                                                                                 // 47
            "meteor-developer": "fa fa-rocket"                                                                         // 48
        },                                                                                                             // 47
        title: {                                                                                                       // 50
            forgotPwd: "Recover Your Password"                                                                         // 51
        }                                                                                                              // 50
    }                                                                                                                  // 42
});                                                                                                                    // 2
AccountsTemplates.configureRoute('signIn');                                                                            // 56
AccountsTemplates.configureRoute('changePwd'); // AccountsTemplates.configureRoute('enrollAccount');                   // 57
// AccountsTemplates.configureRoute('forgotPwd');                                                                      // 59
// AccountsTemplates.configureRoute('resetPwd');                                                                       // 60
                                                                                                                       //
AccountsTemplates.configureRoute('signUp');                                                                            // 61
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"ui":{"UIHelpers.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/ui/UIHelpers.js                                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({                                                                                                        // 1
    gitHubLinks: function () {                                                                                         // 1
        return gitHubLinks;                                                                                            // 1
    }                                                                                                                  // 1
});                                                                                                                    // 1
var Apps = void 0,                                                                                                     // 1
    TemplateApps = void 0;                                                                                             // 1
module.watch(require("/imports/api/apps"), {                                                                           // 1
    Apps: function (v) {                                                                                               // 1
        Apps = v;                                                                                                      // 1
    },                                                                                                                 // 1
    TemplateApps: function (v) {                                                                                       // 1
        TemplateApps = v;                                                                                              // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var Streams = void 0;                                                                                                  // 1
module.watch(require("/imports/api/streams"), {                                                                        // 1
    Streams: function (v) {                                                                                            // 1
        Streams = v;                                                                                                   // 1
    }                                                                                                                  // 1
}, 1);                                                                                                                 // 1
var Customers = void 0;                                                                                                // 1
module.watch(require("/imports/api/customers"), {                                                                      // 1
    Customers: function (v) {                                                                                          // 1
        Customers = v;                                                                                                 // 1
    }                                                                                                                  // 1
}, 2);                                                                                                                 // 1
var senseConfig = void 0;                                                                                              // 1
module.watch(require("/imports/api/config"), {                                                                         // 1
    senseConfig: function (v) {                                                                                        // 1
        senseConfig = v;                                                                                               // 1
    }                                                                                                                  // 1
}, 3);                                                                                                                 // 1
var gitHubLinks = {                                                                                                    // 17
    createStream: 'https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsStream.js#L53',       // 18
    copyApp: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L175",              // 19
    replaceAndReloadApp: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L69",   // 20
    publishApp: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L281",           // 21
    requestTicket: "https://github.com/QHose/QRSMeteor/blob/50bf903dc67d8d1b3757b572e8b2dedbb63202da/imports/api/server/QPSFunctions.js#L213",
    createPasport: "https://github.com/QHose/QRSMeteor/blob/50bf903dc67d8d1b3757b572e8b2dedbb63202da/imports/api/server/QPSFunctions.js#L56",
    redirectURLReceived: "https://github.com/QHose/QRSMeteor/blob/master/imports/SSO/client/SSO.js#L88",               // 24
    deleteApp: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L263",            // 25
    logoutUser: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QPSFunctions.js#L174",              // 26
    saveApp: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L127",              // 27
    getScript: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L94",             // 28
    setScript: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L106",            // 29
    reloadApp: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L119"             // 30
};                                                                                                                     // 17
                                                                                                                       //
if (Meteor.isClient) {                                                                                                 // 33
    var freshEnvironment = function () {                                                                               // 33
        if (!Customers.find().count() && !TemplateApps.find().count()) {                                               // 253
            // Session.set('currentStep', 0);                                                                          // 254
            return true;                                                                                               // 255
        }                                                                                                              // 256
    };                                                                                                                 // 257
                                                                                                                       //
    var currentStep = function () {                                                                                    // 33
        // console.log('the current step session', Session.get('currentStep'));//                                      // 289
        //step 0: fresh/resetted environment                                                                           // 291
        if (freshEnvironment()) {                                                                                      // 292
            return 0;                                                                                                  // 293
        } //step 1 insert customers                                                                                    // 294
        else if (Session.get('currentStep') === 1) {                                                                   // 292
                Router.go('users');                                                                                    // 297
                return 1;                                                                                              // 298
            } //step 2 there are customers, but no template                                                            // 299
            else if ( // (Customers.find().count() && !TemplateApps.find().count()) &&                                 // 296
                Session.get('currentStep') === 2) {                                                                    // 303
                    return 2;                                                                                          // 304
                } //step 3                                                                                             // 305
                else if ( // Customers.find().count() &&                                                               // 301
                    // TemplateApps.find().count() &&                                                                  // 309
                    Session.get('currentStep') === 3 && !Session.equals('loadingIndicator', 'loading')) {              // 310
                        // console.log('loading indicator is ', Session.get('loadingIndicator') )                      // 312
                        return 3;                                                                                      // 313
                    } //step 4                                                                                         // 314
                    else if (Session.get('currentStep') === 4 // &&                                                    // 307
                        // Customers.find().count() &&                                                                 // 319
                        // TemplateApps.find().count()                                                                 // 320
                        ) {                                                                                            // 316
                                return 4;                                                                              // 322
                            } else if (Session.equals('loadingIndicator', 'loading')) {                                // 323
                            return;                                                                                    // 324
                        } else {                                                                                       // 325
                            Session.set('currentStep', 3);                                                             // 326
                            return 3;                                                                                  // 327
                        }                                                                                              // 328
    };                                                                                                                 // 329
                                                                                                                       //
    module.export({                                                                                                    // 1
        freshEnvironment: function () {                                                                                // 1
            return freshEnvironment;                                                                                   // 1
        },                                                                                                             // 1
        currentStep: function () {                                                                                     // 1
            return currentStep;                                                                                        // 1
        }                                                                                                              // 1
    });                                                                                                                // 1
                                                                                                                       //
    var Cookies = require('js-cookie'); // console.log('Setup generic helper functions, for functions every template needs');
                                                                                                                       //
                                                                                                                       //
    Template.registerHelper('formatDate', function (date) {                                                            // 37
        return moment(date).format('DD-MM-YYYY');                                                                      // 38
    }); // // Template.registerHelper('formatNumber', function(myNumber) {                                             // 40
    //     var commaFormat = d3.format(",");                                                                           // 43
    //     // The expression /,/g is a regular expression that matches all commas.                                     // 44
    //     return commaFormat(myNumber)                                                                                // 45
    //         .replace(/,/g, ".");                                                                                    // 46
    // });                                                                                                             // 47
                                                                                                                       //
    Template.registerHelper('URL_Youtube_howToDemo', function () {                                                     // 49
        return 'https://www.youtube.com/embed/OulQS-1fH-A?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk';                    // 50
    });                                                                                                                // 51
    Template.registerHelper('URL_Youtube_quickIntro', function () {                                                    // 52
        return '';                                                                                                     // 53
    });                                                                                                                // 54
    Template.registerHelper('URL_Youtube_1mflashyIntro', function () {                                                 // 56
        return 'https://www.youtube.com/embed/W3gDKdv6K8Y';                                                            // 57
    });                                                                                                                // 58
    Template.registerHelper('URL_Youtube_playlist', function () {                                                      // 60
        return 'https://www.youtube.com/playlist?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk';                             // 61
    });                                                                                                                // 62
    Template.registerHelper('URL_Youtube_integrated_flow', function () {                                               // 63
        return "https://www.youtube.com/embed/M49nv6on5Eg?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk";                    // 64
    });                                                                                                                // 65
    Template.registerHelper('URL_Youtube_generic_security_intro', function () {                                        // 67
        return "https://www.youtube.com/embed/sdCVsMzTf64";                                                            // 68
    });                                                                                                                // 69
    Template.registerHelper('URL_Youtube_webintegration_introduction', function () {                                   // 72
        return "https://www.youtube.com/embed/zuNvZ_UTmow?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk";                    // 73
    }); //QAP                                                                                                          // 74
                                                                                                                       //
    Template.registerHelper('URL_Youtube_webintegration_extended', function () {                                       // 77
        return "https://www.youtube.com/embed/yLTqzftDa7s";                                                            // 78
    });                                                                                                                // 79
    Template.registerHelper('URL_Youtube_architecture_introduction', function () {                                     // 81
        return "https://www.youtube.com/embed/sv5nKDvmRPI?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk";                    // 82
    });                                                                                                                // 83
    Template.registerHelper('URL_Youtube_security_introduction', function () {                                         // 85
        return "https://www.youtube.com/embed/XJ9dOHoMiXE?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk";                    // 86
    });                                                                                                                // 87
    Template.registerHelper('URL_Youtube_security_deepDive', function () {                                             // 89
        return "https://www.youtube.com/embed/iamo6RLc5Pg";                                                            // 90
    });                                                                                                                // 91
    Template.registerHelper('URL_Youtube_concept_behind', function () {                                                // 93
        return "https://www.youtube.com/embed/1PjcTFnC4Mo";                                                            // 94
    });                                                                                                                // 95
    Template.registerHelper('doc_demo_manual', function () {                                                           // 97
        return '/docs/How to demo the Qlik Sense SaaS demo platform.pdf';                                              // 98
    });                                                                                                                // 99
    Template.registerHelper('doc_sec_function_task_matrix', function () {                                              // 101
        return '/docs/QlikSense Authorizations - Function and Tasks_Demo.xlsx';                                        // 102
    });                                                                                                                // 103
    Template.registerHelper('doc_securtityIntegration', function () {                                                  // 105
        return 'https://community.qlik.com/docs/DOC-17599';                                                            // 106
    });                                                                                                                // 107
    Template.registerHelper('doc_processIntegration', function () {                                                    // 108
        return 'https://community.qlik.com/docs/DOC-17831';                                                            // 109
    });                                                                                                                // 110
    Template.registerHelper('doc_integrationOverview', function () {                                                   // 113
        return 'https://community.qlik.com/docs/DOC-9533';                                                             // 114
    });                                                                                                                // 115
    Template.registerHelper('doc_sourceCode', function () {                                                            // 117
        return '/docs/Qlik Sense SaaS demo tool documentation of source code.docx';                                    // 118
    });                                                                                                                // 119
    Template.registerHelper('doc_demo_setup_instructions', function () {                                               // 121
        return '/docs/Qlik Sense SaaS demo tool setup instructions.docx';                                              // 122
    });                                                                                                                // 123
    Template.registerHelper('doc_webIntegration', function () {                                                        // 125
        return 'https://community.qlik.com/docs/DOC-17834';                                                            // 126
    });                                                                                                                // 127
    Template.registerHelper('doc_dataIntegration', function () {                                                       // 128
        return 'https://onedrive.live.com/view.aspx?cid=0805405928a75727&id=documents&resid=805405928A75727%211330&app=OneNote&authkey=!ANwk5S8KPC__-dw&&wd=target%28%2F%2FEMBEDDED%20ANALYTICS.one%7Cbf2972be-48a0-46fa-af7a-f6d2f80cf06b%2FData%20integration%20Combine%20sources%20into%20one%20associative%20model%7Ce669a0a2-9a83-470e-aae8-ba63ac500038%2F%29';
    });                                                                                                                // 130
    Template.registerHelper('seq_ticketing_flow', function () {                                                        // 132
        return "http://knsv.github.io/mermaid/live_editor/#/view/c2VxdWVuY2VEaWFncmFtCkJyb3dzZXItPj5NZXRlb3Igd2ViIGludGVncmF0aW9uIGRlbW86IFVzZXIgbG9ncyBpbiBpbnRvIE1ldGVvciAKQnJvd3Nlci0-PiBQcm94eTogSUZyYW1lIHRyaWVzIHRvIG9wZW4gU2Vuc2UgY29udGVudCB2aWEgbGluayB0aGF0IGNvbnRhaW5zIC9wcm94eS8KUHJveHktPj5NZXRlb3IgU1NPIGNsaWVudDogUmVkaXJlY3QgcmVxdWVzdCB0byB3ZWJwYWdlIG9uIHRoZSBjbGllbnQgKGNsaWVudCBzaWRlIHJvdXRlKS4KCk5vdGUgcmlnaHQgb2YgUHJveHk6IFByb3h5IGFsc28gaW5jbHVkZXMgdGFyZ2V0SWQgPSA8SUQgZm9yIHRoZSBvcmlnaW5hbCBVUkkgdGhhdCB0aGUgdXNlciB0cmllcyB0byBhY2Nlc3M-LCBhbmQgcHJveHlSZXN0VXJpID0gPHRoZSBVUkkgd2hlcmUgdGhlIGF1dGhlbnRpY2F0aW9uIG1vZHVsZSBjYW4gYWNjZXNzIHRoZSBSRVNUIEFQST4KTWV0ZW9yIFNTTyBjbGllbnQtPk1ldGVvciBzZXJ2ZXI6ICBjbGllbnQgY2FsbHMgKHVzZXIgYXdhcmUpIHNlcnZlciBzaWRlIG1ldGhvZApOb3RlIHJpZ2h0IG9mIE1ldGVvciBzZXJ2ZXI6IFNpbmNlIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIGluIE1ldGVvciwgd2UgY2FuIHJlcXVlc3QgdGhlIHVzZXJJRCBhbmQgZ3JvdXAgbWVtYmVyc2hpcCBmcm9tIHRoZSBNZXRlb3Igc2Vzc2lvbi4gVHJ1c3QgbWVjaGFuaXNtOiBTZXJ2ZXIgaW1wb3J0ZWQgUWxpayBTZW5zZSBjbGllbnQgY2VydGlmaWNhdGUuCk1ldGVvciBzZXJ2ZXItPj5RUFMgQVBJOiBSZXF1ZXN0IHRpY2tldCBhdCBRUFMgQVBJLCBwcm92aWRlIHRoZSB1c2VySWQgYW5kIGdyb3VwcyBpbiBKU09OLgpOb3RlIHJpZ2h0IG9mIE1ldGVvciBzZXJ2ZXI6IE9wdGlvbmFsbHkgaW5jbHVkZSB0aGUgcmVkaXJlY3QgcGFyYW1ldGVyIHRvIGZvcndhcmQgdGhlIHVzZXIgYmFjayB0byB0aGUgcGFnZSBoZSBpbml0aWFsbHkgdHJpZWQgdG8gYWNjZXNzLgpRUFMgQVBJLS0-Pk1ldGVvciBzZXJ2ZXI6IFFQUyBBUEkgcmV0dXJucyBhIHRpY2tldCBudW1iZXIgKGFuZCBwb3NzaWJseSByZWRpcmVjdCBVUkwpIHdoaWNoIHlvdSBoYXZlIHRvIGFwcGVuZCBpbiB0aGUgVVJMIApNZXRlb3Igc2VydmVyLS0-PiBNZXRlb3Igd2ViIGludGVncmF0aW9uIGRlbW86IENyZWF0ZSBhIHJlZGlyZWN0IFVSTCB3aGljaCB0aGUgY2xpZW50IGNvZGUgY2FuIHB1dCBpbiB0aGUgYnJvd3NlciBVUkwgYmFyLiAKTm90ZSByaWdodCBvZiBNZXRlb3Igd2ViIGludGVncmF0aW9uIGRlbW86IENsaWVudCBzaWRlIGNvZGUsIHJlcGxhY2VzIHRoZSB1cmwgaW4gYnJvd3NlciwgYW5kIGZvcndhcmRzIHRoZSB1c2VyIHRvIFFsaWsgU2Vuc2UuIFVzZXIgbm93IHJlY2VpdmVzIGEgUWxpayBTZW5zZSBzZXNzaW9uIGNvb2tpZSAoc2VlIHZpcnR1YWwgcHJveHkgY29uZmlnKSwgYW5kIGFuZCBzdWNoIHNpbmdsZSBzaWduIG9uIGlzIGNvbmZpZ3VyZWQu";
    });                                                                                                                // 134
    Template.registerHelper('github_create_stream', function () {                                                      // 136
        return gitHubLinks.createStream;                                                                               // 137
    });                                                                                                                // 138
    Template.registerHelper('github_copy_app', function () {                                                           // 140
        return gitHubLinks.copyApp;                                                                                    // 141
    });                                                                                                                // 142
    Template.registerHelper('github_replace_and_reload_app', function () {                                             // 144
        return gitHubLinks.replaceAndReloadApp;                                                                        // 145
    });                                                                                                                // 146
    Template.registerHelper('github_publish_app', function () {                                                        // 148
        return gitHubLinks.publishApp;                                                                                 // 149
    });                                                                                                                // 150
    Template.registerHelper('github_logout_user', function () {                                                        // 152
        return "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QPSFunctions.js#L18";                // 153
    });                                                                                                                // 154
    Template.registerHelper('senseServerHub', function () {                                                            // 156
        return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxyClientUsage + '/hub';
    });                                                                                                                // 158
    Template.registerHelper('senseServerDevHub', function () {                                                         // 160
        return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxyClientUsage + '/dev-hub';
    });                                                                                                                // 162
    Template.registerHelper('senseServerQMC', function () {                                                            // 164
        return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxyClientUsage + '/qmc';
    });                                                                                                                // 166
    Template.registerHelper('senseServer', function () {                                                               // 168
        return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxyClientUsage;      // 169
    });                                                                                                                // 170
    Template.registerHelper('webIntegrationDemo', function () {                                                        // 172
        return 'http://' + Meteor.settings.public.webIntegrationHost + ':' + Meteor.settings.public.webIntegrationDemoPort;
    }); //Integration presentation Iframe selector                                                                     // 174
                                                                                                                       //
    Template.registerHelper('IFrameURLChapterSelection', function () {                                                 // 177
        var appId = Cookies.get('slideGeneratorAppId'); //senseConfig.slideGeneratorAppId;                             // 178
                                                                                                                       //
        var IntegrationPresentationSelectionSheet = Meteor.settings.public.slideGenerator.selectionSheet; //'DYTpxv'; selection sheet of the slide generator
                                                                                                                       //
        var proxy = Meteor.settings.public.slideGenerator.virtualProxy;                                                // 180
        return 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + proxy + '/single/?appid=' + appId + '&sheet=' + IntegrationPresentationSelectionSheet + '&opt=currsel';
    }); // Template.registerHelper('authenticatedSlideGenerator', function() {                                         // 182
    //     return Session.get('authenticatedSlideGenerator');                                                          // 185
    // });                                                                                                             // 186
                                                                                                                       //
    Template.registerHelper('shrinkForSlideSorter', function () {                                                      // 188
        return Cookies.get('showSlideSorter') === "true" ? "shrink" : ""; //                                           // 189
    });                                                                                                                // 190
    Template.registerHelper('groupSelectedSlideGenerator', function () {                                               // 192
        return Session.get('groupForPresentation'); //user selected a presentation type?                               // 193
    }); //role that defines your role in the whole integration.qlik.com site, based on this we make selections in the slide generator.
                                                                                                                       //
    Template.registerHelper('mainUserRole', function () {                                                              // 197
        return Cookies.get('currentMainRole');                                                                         // 198
    });                                                                                                                // 199
    Template.registerHelper('isSelected', function () {                                                                // 201
        return someValue ? 'selected' : '';                                                                            // 202
    });                                                                                                                // 203
    Template.registerHelper('customers', function () {                                                                 // 205
        return Customers.find({});                                                                                     // 206
    }); //used for Aldeed autoform                                                                                     // 207
                                                                                                                       //
    Template.registerHelper("Customers", Customers);                                                                   // 210
    Template.registerHelper('noCustomers', function () {                                                               // 212
        return !Customers.find({}).count();                                                                            // 213
    });                                                                                                                // 215
    Template.registerHelper('noTemplateApps', function () {                                                            // 217
        return !TemplateApps.find({}).count();                                                                         // 218
    }); //generic helpers to return the collection to the blaze template                                               // 220
                                                                                                                       //
    Template.registerHelper('customersCollection', function () {                                                       // 223
        return Customers.find({}, {                                                                                    // 224
            sort: {                                                                                                    // 225
                checked: -1                                                                                            // 226
            }                                                                                                          // 225
        });                                                                                                            // 224
    });                                                                                                                // 229
    Template.registerHelper('templateAppsCollection', function () {                                                    // 231
        return TemplateApps.find();                                                                                    // 232
    });                                                                                                                // 233
    Template.registerHelper('appsCollection', function () {                                                            // 235
        return Apps.find();                                                                                            // 236
    });                                                                                                                // 237
    Template.registerHelper('streamsCollection', function () {                                                         // 239
        return Streams.find();                                                                                         // 240
    });                                                                                                                // 241
    Template.registerHelper('freshEnvironment', function () {                                                          // 243
        return freshEnvironment();                                                                                     // 244
    });                                                                                                                // 245
    Template.registerHelper('loading', function () {                                                                   // 247
        // console.log('loading indicator in helper is: ', Session.get('loadingIndicator'));                           // 248
        return Session.get('loadingIndicator');                                                                        // 249
    });                                                                                                                // 250
    ;                                                                                                                  // 257
    Template.registerHelper('readyToSelectTemplate', function () {                                                     // 259
        return currentStep() === 2;                                                                                    // 260
    });                                                                                                                // 261
    Template.registerHelper('templateButNoCustomer', function () {                                                     // 263
        return !Customers.find().count() && TemplateApps.find().count();                                               // 264
    });                                                                                                                // 267
    Template.registerHelper('readyToGenerate', function () {                                                           // 269
        return currentStep() === 3 && !Session.equals('loadingIndicator', 'loading');                                  // 270
    });                                                                                                                // 271
    Template.registerHelper('step3', function () {                                                                     // 273
        return Session.get('currentStep') === 3;                                                                       // 274
    });                                                                                                                // 275
    Template.registerHelper('step3or4', function () {                                                                  // 277
        return Session.get('currentStep') === 3 || Session.get('currentStep') === 4 || Session.equals('loadingIndicator', 'loading');
    });                                                                                                                // 281
    Template.registerHelper('stepEqualTo', function (stepNr) {                                                         // 283
        // console.log('value of currentStep() ', currentStep());                                                      // 284
        return currentStep() === stepNr;                                                                               // 285
    });                                                                                                                // 286
    Template.registerHelper('generationFinished', function () {                                                        // 331
        return Session.equals('loadingIndicator', 'loading') || Session.get('generated?');                             // 332
    });                                                                                                                // 333
    Template.registerHelper('readyToTestSSO', function () {                                                            // 335
        return currentStep() === 4;                                                                                    // 336
    });                                                                                                                // 337
    Template.registerHelper('and', function (a, b) {                                                                   // 339
        return a && b;                                                                                                 // 340
    });                                                                                                                // 341
    Template.registerHelper('or', function (a, b) {                                                                    // 342
        return a || b;                                                                                                 // 343
    });                                                                                                                // 344
}                                                                                                                      // 346
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"server":{"accounts.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/accounts.js                                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// ServiceConfiguration.configurations.upsert({                                                                        // 1
//     service: "facebook"                                                                                             // 2
// }, {                                                                                                                // 3
//     $set: {                                                                                                         // 4
//         appId: Meteor.settings.private.facebook.clientId,                                                           // 5
//         loginStyle: "popup",                                                                                        // 6
//         secret: Meteor.settings.private.facebook.secret                                                             // 7
//     }                                                                                                               // 8
// });                                                                                                                 // 9
// ServiceConfiguration.configurations.upsert({                                                                        // 11
//     service: "github"                                                                                               // 12
// }, {                                                                                                                // 13
//     $set: {                                                                                                         // 14
//         clientId: Meteor.settings.private.github.clientId,                                                          // 15
//         loginStyle: "popup",                                                                                        // 16
//         secret: Meteor.settings.private.github.secret                                                               // 17
//     }                                                                                                               // 18
// });                                                                                                                 // 19
// ServiceConfiguration.configurations.upsert({                                                                        // 21
//     service: "linkedin"                                                                                             // 22
// },{                                                                                                                 // 23
//     loginStyle: "popup",                                                                                            // 24
//     service: "linkedin",                                                                                            // 25
//     clientId: Meteor.settings.private.linkedin.clientId,                                                            // 26
//     secret: Meteor.settings.private.linkedin.secret,                                                                // 27
// });                                                                                                                 // 28
// ServiceConfiguration.configurations.upsert({                                                                        // 31
//     service: "twitter"                                                                                              // 32
// },{                                                                                                                 // 33
//     service: "twitter",                                                                                             // 34
//     consumerKey: Meteor.settings.private.twitter.clientId,                                                          // 35
//     loginStyle: "popup",                                                                                            // 36
//     secret: Meteor.settings.private.twitter.secret                                                                  // 37
// });                                                                                                                 // 38
// ServiceConfiguration.configurations.upsert({                                                                        // 41
//     service: "google"                                                                                               // 42
// }, {                                                                                                                // 43
//     $set: {                                                                                                         // 44
//         clientId: Meteor.settings.private.google.clientId,                                                          // 45
//         loginStyle: "popup",                                                                                        // 46
//         secret: Meteor.settings.private.google.secret                                                               // 47
//     }                                                                                                               // 48
// });                                                                                                                 // 49
var numberOfUsers = Meteor.users.find().count();                                                                       // 52
console.log('Checking the user accounts, number of users is: ' + numberOfUsers);                                       // 53
                                                                                                                       //
if (!numberOfUsers) {                                                                                                  // 55
    var id = Accounts.createUser({                                                                                     // 56
        username: 'demo',                                                                                              // 57
        email: 'demo@qlik.com',                                                                                        // 58
        password: 'schiphol',                                                                                          // 59
        profile: {                                                                                                     // 60
            name: 'Qlik test user'                                                                                     // 60
        }                                                                                                              // 60
    });                                                                                                                // 56
    console.log('user created with id: ', id);                                                                         // 62
    Roles.addUsersToRoles(id, 'test', Roles.GLOBAL_GROUP);                                                             // 63
    id = Accounts.createUser({                                                                                         // 65
        username: 'admin',                                                                                             // 66
        email: 'mbj@qlik.com',                                                                                         // 67
        password: 'Qlik456464',                                                                                        // 68
        profile: {                                                                                                     // 69
            name: 'Qlik admin user'                                                                                    // 69
        }                                                                                                              // 69
    });                                                                                                                // 65
    console.log('user created with id: ', id);                                                                         // 71
    Roles.addUsersToRoles(id, 'admin', Roles.GLOBAL_GROUP);                                                            // 72
}                                                                                                                      // 73
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"proxy.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/proxy.js                                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
//SETUP PROXY SERVER TO RUN METEOR QRS AND WEB INTEGRATION DEMO BOTH ON PORT 80                                        // 1
var proxy = require('redbird')({                                                                                       // 3
  port: Meteor.settings.public.proxyPort,                                                                              // 3
  ntlm: true,                                                                                                          // 3
  bunyan: false                                                                                                        // 3
}); //bunyan:true for logging output in the console                                                                    // 3
// Route to any local ip, for example from docker containers.                                                          // 4
                                                                                                                       //
                                                                                                                       //
proxy.register(Meteor.settings.public.qlikSenseHost, "http://localhost:3000"); //need subdomain otherwise meteor root-URL does not work
                                                                                                                       //
proxy.register(Meteor.settings.public.webIntegrationHost, "http://localhost:3030"); //need subdomain otherwise meteor root-URL does not work
                                                                                                                       //
proxy.register('slides.qlik.com', "http://localhost:3060"); //need subdomain otherwise meteor root-URL does not work   // 8
                                                                                                                       //
proxy.register('integration.qlik.com', "http://localhost:3000"); //need subdomain otherwise meteor root-URL does not work
                                                                                                                       //
proxy.register('saasdemo.qlik.com', "http://localhost:3000"); //need subdomain otherwise meteor root-URL does not work
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/publications.js                                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var Apps = void 0,                                                                                                     // 1
    TemplateApps = void 0,                                                                                             // 1
    GeneratedResources = void 0;                                                                                       // 1
module.watch(require("/imports/api/apps"), {                                                                           // 1
    Apps: function (v) {                                                                                               // 1
        Apps = v;                                                                                                      // 1
    },                                                                                                                 // 1
    TemplateApps: function (v) {                                                                                       // 1
        TemplateApps = v;                                                                                              // 1
    },                                                                                                                 // 1
    GeneratedResources: function (v) {                                                                                 // 1
        GeneratedResources = v;                                                                                        // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var Streams = void 0;                                                                                                  // 1
module.watch(require("/imports/api/streams"), {                                                                        // 1
    Streams: function (v) {                                                                                            // 1
        Streams = v;                                                                                                   // 1
    }                                                                                                                  // 1
}, 1);                                                                                                                 // 1
var Customers = void 0;                                                                                                // 1
module.watch(require("/imports/api/customers"), {                                                                      // 1
    Customers: function (v) {                                                                                          // 1
        Customers = v;                                                                                                 // 1
    }                                                                                                                  // 1
}, 2);                                                                                                                 // 1
var APILogs = void 0;                                                                                                  // 1
module.watch(require("/imports/api/APILogs"), {                                                                        // 1
    APILogs: function (v) {                                                                                            // 1
        APILogs = v;                                                                                                   // 1
    }                                                                                                                  // 1
}, 3);                                                                                                                 // 1
var moment = void 0;                                                                                                   // 1
module.watch(require("moment"), {                                                                                      // 1
    "default": function (v) {                                                                                          // 1
        moment = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 4);                                                                                                                 // 1
//only fill the local mongoDB that runs in the browser with data that belongs to the user...                           // 8
//https://www.meteor.com/tutorials/blaze/publish-and-subscribe                                                         // 9
Meteor.publish('apps', function (generatedAppsFromUser) {                                                              // 10
    if (Roles.userIsInRole(this.userId, ['admin'], Roles.GLOBAL_GROUP)) {                                              // 11
        return Apps.find();                                                                                            // 12
    } else {                                                                                                           // 14
        //console.log('Client subscribed to collection, with these generated app ids: ', generatedAppsFromUser);       // 15
        if (!generatedAppsFromUser) {                                                                                  // 16
            generatedAppsFromUser = []; // console.log('##### No generated resources exists yet, so only show the template apps')
        } else {// console.log('### publication recevied these generated app ids for the user: ', generatedAppsFromUser);
            }                                                                                                          // 21
                                                                                                                       //
        return Apps.find({                                                                                             // 22
            $or: [{                                                                                                    // 23
                "id": {                                                                                                // 23
                    "$in": generatedAppsFromUser                                                                       // 23
                }                                                                                                      // 23
            }, {                                                                                                       // 23
                "stream.name": "Templates" //, { "stream.name": "Everyone" }                                           // 23
                                                                                                                       //
            }]                                                                                                         // 23
        });                                                                                                            // 22
    }                                                                                                                  // 26
                                                                                                                       //
    this.ready();                                                                                                      // 27
});                                                                                                                    // 28
Meteor.publish('streams', function (generatedStreamsFromUser) {                                                        // 30
    if (Roles.userIsInRole(this.userId, ['admin'], Roles.GLOBAL_GROUP)) {                                              // 31
        return Streams.find();                                                                                         // 32
    } else {                                                                                                           // 34
        if (!generatedStreamsFromUser) {                                                                               // 35
            generatedStreamsFromUser = [];                                                                             // 36
        }                                                                                                              // 37
                                                                                                                       //
        return Streams.find({                                                                                          // 38
            $or: [{                                                                                                    // 39
                "id": {                                                                                                // 39
                    "$in": generatedStreamsFromUser                                                                    // 39
                }                                                                                                      // 39
            }, {                                                                                                       // 39
                "name": "Templates" //, { "name": "Everyone" }                                                         // 39
                                                                                                                       //
            }]                                                                                                         // 39
        });                                                                                                            // 38
    }                                                                                                                  // 43
                                                                                                                       //
    this.ready();                                                                                                      // 44
});                                                                                                                    // 45
Meteor.publish('templateApps', function () {                                                                           // 46
    return TemplateApps.find({                                                                                         // 47
        'generationUserId': this.userId                                                                                // 47
    });                                                                                                                // 47
    this.ready();                                                                                                      // 48
});                                                                                                                    // 49
Meteor.publish('generatedResources', function () {                                                                     // 51
    return GeneratedResources.find({                                                                                   // 52
        'generationUserId': this.userId                                                                                // 52
    });                                                                                                                // 52
    this.ready();                                                                                                      // 53
});                                                                                                                    // 54
Meteor.publish('customers', function () {                                                                              // 56
    return Customers.find({                                                                                            // 57
        'generationUserId': this.userId                                                                                // 57
    });                                                                                                                // 57
    this.ready();                                                                                                      // 58
});                                                                                                                    // 59
Meteor.publish('apiLogs', function () {                                                                                // 61
    // const selector = {                                                                                              // 62
    //     "createDate": {                                                                                             // 63
    //         $lt: new Date(),                                                                                        // 64
    //         $gte: new Date(new Date().setDate(new Date().getDate() - 0.05))  //show only the last hour  of api logs
    //     }                                                                                                           // 66
    //};                                                                                                               // 67
    //     today: function() {                                                                                         // 68
    //     var now = moment().toDate();                                                                                // 69
    //     return Posts.find({createdAt : { $gte : now }});                                                            // 70
    // }                                                                                                               // 71
    var selector = {                                                                                                   // 73
        sort: {                                                                                                        // 74
            createDate: -1                                                                                             // 74
        },                                                                                                             // 74
        limit: 30                                                                                                      // 75
    };                                                                                                                 // 73
    return APILogs.find({                                                                                              // 78
        'generationUserId': this.userId                                                                                // 78
    }, selector);                                                                                                      // 78
    this.ready();                                                                                                      // 79
});                                                                                                                    // 80
Meteor.publish('users', function () {                                                                                  // 82
    //See https://github.com/alanning/meteor-roles                                                                     // 83
    if (Roles.userIsInRole(this.userId, ['admin'], Roles.GLOBAL_GROUP)) {                                              // 84
        return Meteor.users.find();                                                                                    // 85
    } else {                                                                                                           // 86
        // user not authorized. do not publish secrets                                                                 // 87
        this.stop();                                                                                                   // 88
        return;                                                                                                        // 89
    }                                                                                                                  // 90
});                                                                                                                    // 91
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"restEndpoints.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/restEndpoints.js                                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
//https://atmospherejs.com/simple/json-routes                                                                          // 1
JsonRoutes.add("get", "/OneCustomerWithUsers", function (req, res, next) {                                             // 3
    // var id = req.params.id;                                                                                         // 4
    var sampleData = customer1;                                                                                        // 5
    JsonRoutes.sendResult(res, {                                                                                       // 7
        data: customer1                                                                                                // 8
    });                                                                                                                // 7
});                                                                                                                    // 10
JsonRoutes.add("get", "/multipleCustomersWithUsers", function (req, res, next) {                                       // 12
    // var id = req.params.id;                                                                                         // 13
    var sampleData = [customer1, customer2];                                                                           // 14
    JsonRoutes.sendResult(res, {                                                                                       // 16
        data: [customer1, customer2]                                                                                   // 17
    });                                                                                                                // 16
});                                                                                                                    // 19
var customer1 = {                                                                                                      // 21
    "_id": "EXpapRzZXc52B3joK",                                                                                        // 22
    "name": "Ullrich - Barrows",                                                                                       // 23
    "checked": true,                                                                                                   // 24
    "users": [{                                                                                                        // 25
        "name": "John",                                                                                                // 26
        "group": "Consumer",                                                                                           // 27
        "currentlyLoggedIn": false,                                                                                    // 28
        "country": "Germany"                                                                                           // 29
    }, {                                                                                                               // 25
        "name": "Linda",                                                                                               // 31
        "group": "Contributor",                                                                                        // 32
        "currentlyLoggedIn": false,                                                                                    // 33
        "country": "United States"                                                                                     // 34
    }, {                                                                                                               // 30
        "name": "Martin",                                                                                              // 36
        "group": "Developer",                                                                                          // 37
        "currentlyLoggedIn": false,                                                                                    // 38
        "country": "Italy"                                                                                             // 39
    }, {                                                                                                               // 35
        "name": "Paul",                                                                                                // 41
        "group": "Admin",                                                                                              // 42
        "currentlyLoggedIn": false,                                                                                    // 43
        "country": "Italy"                                                                                             // 44
    }],                                                                                                                // 40
    "generationUserId": "rZPZYbaWM33ZHNr6Z"                                                                            // 46
};                                                                                                                     // 21
var customer2 = {                                                                                                      // 49
    "_id": "EXpapRzZXc52B3joK",                                                                                        // 50
    "name": "Ullrich - Barrows",                                                                                       // 51
    "checked": true,                                                                                                   // 52
    "users": [{                                                                                                        // 53
        "name": "John",                                                                                                // 54
        "group": "Consumer",                                                                                           // 55
        "currentlyLoggedIn": false,                                                                                    // 56
        "country": "Germany"                                                                                           // 57
    }, {                                                                                                               // 53
        "name": "Linda",                                                                                               // 59
        "group": "Contributor",                                                                                        // 60
        "currentlyLoggedIn": false,                                                                                    // 61
        "country": "United States"                                                                                     // 62
    }, {                                                                                                               // 58
        "name": "Martin",                                                                                              // 64
        "group": "Developer",                                                                                          // 65
        "currentlyLoggedIn": false,                                                                                    // 66
        "country": "Italy"                                                                                             // 67
    }, {                                                                                                               // 63
        "name": "Paul",                                                                                                // 69
        "group": "Admin",                                                                                              // 70
        "currentlyLoggedIn": false,                                                                                    // 71
        "country": "Italy"                                                                                             // 72
    }],                                                                                                                // 68
    "generationUserId": "rZPZYbaWM33ZHNr6Z"                                                                            // 74
};                                                                                                                     // 49
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"routes.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/routes.js                                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var REST_Log = void 0;                                                                                                 // 1
module.watch(require("/imports/api/APILogs"), {                                                                        // 1
    REST_Log: function (v) {                                                                                           // 1
        REST_Log = v;                                                                                                  // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
Router.route('/updateSenseInfo/apps', function (request, response, next) {                                             // 3
    // console.log('++++++++++++We got an incoming REST Call from the Sense Notification handler for APPS, this means the Sense Repository has changed');
    //logging only                                                                                                     // 5
    // var call = {};                                                                                                  // 6
    // call.action = 'Notification apps'                                                                               // 7
    // call.request = 'We got an incoming REST Call from the Sense Notification handler for APPS, this means the Sense Repository has changed';
    // REST_Log(call);                                                                                                 // 9
    Meteor.call('updateLocalSenseCopyApps');                                                                           // 10
}, {                                                                                                                   // 11
    where: 'server'                                                                                                    // 11
});                                                                                                                    // 11
Router.route('/updateSenseInfo/streams', function (request, response, next) {                                          // 13
    // console.log('++++++++++++We got an incoming REST Call from the Sense Notification handler for STREAMS, this means the Sense Repository has changed');
    //logging only                                                                                                     // 15
    // var call = {};                                                                                                  // 16
    // call.action = 'Notification streams'                                                                            // 17
    // call.request = 'We got an incoming REST Call from the Sense Notification handler for APPS, this means the Sense Repository has changed';
    // REST_Log(call);                                                                                                 // 19
    Meteor.call('updateLocalSenseCopyStreams');                                                                        // 20
}, {                                                                                                                   // 21
    where: 'server'                                                                                                    // 21
});                                                                                                                    // 21
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"seeds.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/seeds.js                                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var Customers = void 0;                                                                                                // 1
module.watch(require("../imports/api/customers.js"), {                                                                 // 1
  Customers: function (v) {                                                                                            // 1
    Customers = v;                                                                                                     // 1
  }                                                                                                                    // 1
}, 0);                                                                                                                 // 1
var customers = // [{"name":"A&R Partners","checked":true},                                                            // 3
// {"name":"A2Z Solutions","checked":true},                                                                            // 5
// {"name":"Aaron D. Meyer & Associates","checked":true},                                                              // 6
// {"name":"Aaron Products","checked":true},                                                                           // 7
// {"name":"Active Data","checked":true},                                                                              // 8
// {"name":"Ben and Jerry’s","checked":true},                                                                          // 9
// {"name":"Benedict","checked":true},                                                                                 // 10
// {"name":"Bizmarts","checked":true},                                                                                 // 11
// {"name":"C & C  Design","checked":true},                                                                            // 12
// {"name":"C & J Engineering","checked":true},                                                                        // 13
// {"name":"CAF Systemhaus","checked":true},                                                                           // 14
// {"name":"CAM Group","checked":true},                                                                                // 15
// {"name":"Caribian Specialties","checked":true},                                                                     // 16
// {"name":"City Fresh Foods","checked":true},                                                                         // 17
// {"name":"Clearout","checked":true},                                                                                 // 18
// {"name":"David Spencer Ltd.","checked":true},                                                                       // 19
// {"name":"Dayton Malleable Inc.","checked":true},                                                                    // 20
// {"name":"DCP Research","checked":true},                                                                             // 21
// {"name":"DCS International","checked":true},                                                                        // 22
// {"name":"DCS Laboratory","checked":true},                                                                           // 23
// {"name":"Deak-Perera Group.","checked":true},                                                                       // 24
// {"name":"Earth","checked":true},                                                                                    // 25
// {"name":"eDistrict","checked":true},                                                                                // 26
// {"name":"EDP","checked":true},                                                                                      // 27
// {"name":"Ethyl Corporation","checked":true},                                                                        // 28
// {"name":"Federal Focus","checked":true},                                                                            // 29
// {"name":"Fill It","checked":true},                                                                                  // 30
// {"name":"Filmotype","checked":true},                                                                                // 31
// {"name":"Fins","checked":true},                                                                                     // 32
// {"name":"Gate","checked":true},                                                                                     // 33
// {"name":"Gulf and Western Industries","checked":true},                                                              // 34
// {"name":"Harte-Hanks (formerly Locator)","checked":true},                                                           // 35
// {"name":"Harvard Trust Company","checked":true},                                                                    // 36
// {"name":"HCHS","checked":true},                                                                                     // 37
// {"name":"Healtheon","checked":true},                                                                                // 38
// {"name":"Hetrick Systems","checked":true},                                                                          // 39
// {"name":"Home Team","checked":true},                                                                                // 40
// {"name":"Homebound","checked":true},                                                                                // 41
// {"name":"IBVA","checked":true},                                                                                     // 42
// {"name":"Icon","checked":true},                                                                                     // 43
// {"name":"Icon Site Builders","checked":true},                                                                       // 44
// {"name":"Idyllwild","checked":true},                                                                                // 45
// {"name":"J. S. Lee Associates","checked":true},                                                                     // 46
// {"name":"K International","checked":true},                                                                          // 47
// {"name":"K.C. Irving","checked":true},                                                                              // 48
// {"name":"Kari & Associates","checked":true},                                                                        // 49
// {"name":"Karsing","checked":true},                                                                                  // 50
// {"name":"Kazinformcom","checked":true},                                                                             // 51
// {"name":"KentISP","checked":true},                                                                                  // 52
// {"name":"Kool-Seal","checked":true},                                                                                // 53
// {"name":"Laker Airways","checked":true},                                                                            // 54
// {"name":"Livermore  Laboratories (LSLI)","checked":true},                                                           // 55
// {"name":"LiveWire BBS and   Favourite Links","checked":true},                                                       // 56
// {"name":"MATRIX","checked":true},                                                                                   // 57
// {"name":"Miles Laboratories, Inc.","checked":true},                                                                 // 58
// {"name":"NACSCORP","checked":true},                                                                                 // 59
// {"name":"Onestar","checked":true},                                                                                  // 60
// {"name":"Pace","checked":true},                                                                                     // 61
// {"name":"Pacific Group","checked":true},                                                                            // 62
// {"name":"Pacific Matics","checked":true},                                                                           // 63
// {"name":"Pacific Sierra Research","checked":true},                                                                  // 64
// {"name":"Pacific Voice","checked":true},                                                                            // 65
// {"name":"Pacific West Enterprises","checked":true},                                                                 // 66
// {"name":"PacificServ","checked":true},                                                                              // 67
// {"name":"Panngea","checked":true},                                                                                  // 68
// {"name":"PAP (Maintenance)","checked":true},                                                                        // 69
// {"name":"Paracel","checked":true},                                                                                  // 70
// {"name":"Patient","checked":true},                                                                                  // 71
// {"name":"Pinnacle Micro","checked":true},                                                                           // 72
// {"name":"QualServe","checked":true},                                                                                // 73
// {"name":"Quantum 4Xyte  Architects","checked":true},                                                                // 74
// {"name":"Qwest","checked":true},                                                                                    // 75
// {"name":"R&R Group","checked":true},                                                                                // 76
// {"name":"R.J. Matter & Associates","checked":true},                                                                 // 77
// {"name":"Ra Co Amo","checked":true},                                                                                // 78
// {"name":"RC","checked":true},                                                                                       // 79
// {"name":"Ready-to-Run","checked":true},                                                                             // 80
// {"name":"Remedy","checked":true},                                                                                   // 81
// {"name":"Renegade info Crew","checked":true},                                                                       // 82
// {"name":"Reuters Usability Group","checked":true},                                                                  // 83
// {"name":"ReviewBooth","checked":true},                                                                              // 84
// {"name":"RFI Corporation","checked":true},                                                                          // 85
// {"name":"Road Warrior International","checked":true},                                                               // 86
// {"name":"Robust Code","checked":true},                                                                              // 87
// {"name":"Sage","checked":true},                                                                                     // 88
// {"name":"Sagent","checked":true},                                                                                   // 89
// {"name":"Salamander Junction","checked":true},                                                                      // 90
// {"name":"Satronix","checked":true},                                                                                 // 91
// {"name":"Satyam","checked":true},                                                                                   // 92
// {"name":"Scientific Atlanta","checked":true},                                                                       // 93
// {"name":"ScotGold Products","checked":true},                                                                        // 94
// {"name":"Screen Saver.com","checked":true},                                                                         // 95
// {"name":"Sifton Properties Limited","checked":true},                                                                // 96
// {"name":"Sigma","checked":true},                                                                                    // 97
// {"name":"Signature","checked":true},                                                                                // 98
// {"name":"SignatureFactory","checked":true},                                                                         // 99
// {"name":"Soloman Brothers","checked":true},                                                                         // 100
// {"name":"Southern Company","checked":true},                                                                         // 101
// {"name":"Stone Consolidated Corporation","checked":true},                                                           // 102
// {"name":"Talou","checked":true},                                                                                    // 103
// {"name":"Tampere","checked":true},                                                                                  // 104
// {"name":"Tandy Corporation","checked":true},                                                                        // 105
// {"name":"Tangent","checked":true},                                                                                  // 106
// {"name":"Tao Group","checked":true},                                                                                // 107
// {"name":"Target Marketing","checked":true},                                                                         // 108
// {"name":"Team ASA","checked":true},                                                                                 // 109
// {"name":"Team Financial Management Systems","checked":true},                                                        // 110
// {"name":"Teca-Print","checked":true},                                                                               // 111
// {"name":"Time Warner","checked":true},                                                                              // 112
// {"name":"Towmotor Corporation","checked":true},                                                                     // 113
// {"name":"Tredegar Company","checked":true},                                                                         // 114
// {"name":"Trend Line Corporation","checked":true},                                                                   // 115
// {"name":"U. S. Exchange","checked":true},                                                                           // 116
// {"name":"Unison Management Concepts","checked":true},                                                               // 117
// {"name":"United States  (USIT)","checked":true},                                                                    // 118
// {"name":"UUmail","checked":true},                                                                                   // 119
// {"name":"ValiCert","checked":true},                                                                                 // 120
// {"name":"Valley  Solutions","checked":true},                                                                        // 121
// {"name":"Valpatken","checked":true},                                                                                // 122
// {"name":"Vanstar","checked":true},                                                                                  // 123
// {"name":"Venable","checked":true},                                                                                  // 124
// {"name":"Venred","checked":true},                                                                                   // 125
// {"name":"Watcom International","checked":true},                                                                     // 126
// {"name":"Xentec","checked":true},                                                                                   // 127
// {"name":"Xilinx","checked":true},                                                                                   // 128
// {"name":"XVT","checked":true},                                                                                      // 129
// {"name":"Zero Assumption Recovery","checked":true},                                                                 // 130
// {"name":"Zilog","checked":true},                                                                                    // 131
// {"name":"Zitel","checked":true},                                                                                    // 132
// {"name":"Zocalo","checked":true}]                                                                                   // 133
[{                                                                                                                     // 134
  "name": "Shell",                                                                                                     // 134
  "collection": "Shell"                                                                                                // 134
}, {                                                                                                                   // 134
  "name": "Esso",                                                                                                      // 135
  "collection": "Esso"                                                                                                 // 135
}, {                                                                                                                   // 135
  "name": "BP",                                                                                                        // 136
  "collection": "BP"                                                                                                   // 136
}]; //if (Customers.find().count() === 0){                                                                             // 136
// _.each(customers, function(customer){                                                                               // 139
//  Customers.insert(customer);                                                                                        // 140
//    console.log("Inserted "+ customer.name);                                                                         // 141
// })                                                                                                                  // 142
//}                                                                                                                    // 143
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"main.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/main.js                                                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _regenerator = require("babel-runtime/regenerator");                                                               //
                                                                                                                       //
var _regenerator2 = _interopRequireDefault(_regenerator);                                                              //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
var Meteor = void 0;                                                                                                   // 1
module.watch(require("meteor/meteor"), {                                                                               // 1
    Meteor: function (v) {                                                                                             // 1
        Meteor = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var http = void 0;                                                                                                     // 1
module.watch(require("meteor/meteor"), {                                                                               // 1
    http: function (v) {                                                                                               // 1
        http = v;                                                                                                      // 1
    }                                                                                                                  // 1
}, 1);                                                                                                                 // 1
var Apps = void 0,                                                                                                     // 1
    TemplateApps = void 0,                                                                                             // 1
    GeneratedResources = void 0;                                                                                       // 1
module.watch(require("/imports/api/apps"), {                                                                           // 1
    Apps: function (v) {                                                                                               // 1
        Apps = v;                                                                                                      // 1
    },                                                                                                                 // 1
    TemplateApps: function (v) {                                                                                       // 1
        TemplateApps = v;                                                                                              // 1
    },                                                                                                                 // 1
    GeneratedResources: function (v) {                                                                                 // 1
        GeneratedResources = v;                                                                                        // 1
    }                                                                                                                  // 1
}, 2);                                                                                                                 // 1
var APILogs = void 0,                                                                                                  // 1
    REST_Log = void 0;                                                                                                 // 1
module.watch(require("/imports/api/APILogs"), {                                                                        // 1
    APILogs: function (v) {                                                                                            // 1
        APILogs = v;                                                                                                   // 1
    },                                                                                                                 // 1
    REST_Log: function (v) {                                                                                           // 1
        REST_Log = v;                                                                                                  // 1
    }                                                                                                                  // 1
}, 3);                                                                                                                 // 1
var Streams = void 0;                                                                                                  // 1
module.watch(require("/imports/api/streams"), {                                                                        // 1
    Streams: function (v) {                                                                                            // 1
        Streams = v;                                                                                                   // 1
    }                                                                                                                  // 1
}, 4);                                                                                                                 // 1
var Customers = void 0;                                                                                                // 1
module.watch(require("/imports/api/customers"), {                                                                      // 1
    Customers: function (v) {                                                                                          // 1
        Customers = v;                                                                                                 // 1
    }                                                                                                                  // 1
}, 5);                                                                                                                 // 1
var QSApp = void 0;                                                                                                    // 1
module.watch(require("/imports/api/server/QRSFunctionsApp"), {                                                         // 1
    "*": function (v) {                                                                                                // 1
        QSApp = v;                                                                                                     // 1
    }                                                                                                                  // 1
}, 6);                                                                                                                 // 1
var QSStream = void 0;                                                                                                 // 1
module.watch(require("/imports/api/server/QRSFunctionsStream"), {                                                      // 1
    "*": function (v) {                                                                                                // 1
        QSStream = v;                                                                                                  // 1
    }                                                                                                                  // 1
}, 7);                                                                                                                 // 1
var QSLic = void 0;                                                                                                    // 1
module.watch(require("/imports/api/server/QRSFunctionsLicense"), {                                                     // 1
    "*": function (v) {                                                                                                // 1
        QSLic = v;                                                                                                     // 1
    }                                                                                                                  // 1
}, 8);                                                                                                                 // 1
var QSProxy = void 0;                                                                                                  // 1
module.watch(require("/imports/api/server/QPSFunctions"), {                                                            // 1
    "*": function (v) {                                                                                                // 1
        QSProxy = v;                                                                                                   // 1
    }                                                                                                                  // 1
}, 9);                                                                                                                 // 1
var QSSystem = void 0;                                                                                                 // 1
module.watch(require("/imports/api/server/QRSFunctionsSystemRules"), {                                                 // 1
    "*": function (v) {                                                                                                // 1
        QSSystem = v;                                                                                                  // 1
    }                                                                                                                  // 1
}, 10);                                                                                                                // 1
var QSExtensions = void 0;                                                                                             // 1
module.watch(require("/imports/api/server/QRSFunctionsExtension"), {                                                   // 1
    "*": function (v) {                                                                                                // 1
        QSExtensions = v;                                                                                              // 1
    }                                                                                                                  // 1
}, 11);                                                                                                                // 1
var QSCustomProps = void 0;                                                                                            // 1
module.watch(require("/imports/api/server/QRSFunctionsCustomProperties"), {                                            // 1
    "*": function (v) {                                                                                                // 1
        QSCustomProps = v;                                                                                             // 1
    }                                                                                                                  // 1
}, 12);                                                                                                                // 1
var senseConfig = void 0,                                                                                              // 1
    authHeaders = void 0;                                                                                              // 1
module.watch(require("/imports/api/config"), {                                                                         // 1
    senseConfig: function (v) {                                                                                        // 1
        senseConfig = v;                                                                                               // 1
    },                                                                                                                 // 1
    authHeaders: function (v) {                                                                                        // 1
        authHeaders = v;                                                                                               // 1
    }                                                                                                                  // 1
}, 13);                                                                                                                // 1
module.watch(require("/imports/startup/accounts-config.js"));                                                          // 1
var shell = void 0;                                                                                                    // 1
module.watch(require("node-powershell"), {                                                                             // 1
    "default": function (v) {                                                                                          // 1
        shell = v;                                                                                                     // 1
    }                                                                                                                  // 1
}, 14);                                                                                                                // 1
//stop on unhandled errors                                                                                             // 33
process.on('unhandledRejection', function (up) {                                                                       // 34
    throw up;                                                                                                          // 34
}); //import config for Qlik Sense QRS and Engine API.                                                                 // 34
                                                                                                                       //
var path = require('path');                                                                                            // 42
                                                                                                                       //
Meteor.startup(function () {                                                                                           // 45
    process.env.ROOT_URL = 'http://' + Meteor.settings.public.qlikSenseHost;                                           // 46
    console.log('********* We expect Qlik Sense to run on host: ', process.env.ROOT_URL + ':' + Meteor.settings.public.qlikSensePort); // console.log('********* For END USERS we expect Sense to run on host: ', Meteor.settings.public.qlikSenseHost + ':' + Meteor.settings.public.qlikSensePort);
                                                                                                                       //
    initQlikSense();                                                                                                   // 49
    removeGeneratedResources();                                                                                        // 50
    optimizeMongoDB();                                                                                                 // 51
}); //                                                                                                                 // 52
// ─── SETUP QLIK SENSE AFTER A CLEAN QlIK SENSE INSTALL ─────────────────────────────────────                         // 56
//                                                                                                                     // 57
//Check if Qlik Sense has been properly setup for this MeteorQRS tool.                                                 // 59
                                                                                                                       //
function initQlikSense() {                                                                                             // 60
    var QlikConfigured;                                                                                                // 60
    return _regenerator2.default.async(function () {                                                                   // 60
        function initQlikSense$(_context) {                                                                            // 60
            while (1) {                                                                                                // 60
                switch (_context.prev = _context.next) {                                                               // 60
                    case 0:                                                                                            // 60
                        console.log('------------------------------------');                                           // 61
                        console.log('INIT QLIK SENSE');                                                                // 62
                        console.log('Project root folder: ', Meteor.absolutePath);                                     // 63
                                                                                                                       //
                        if (!Meteor.settings.broker.automationBaseFolder) {                                            // 64
                            Meteor.settings.broker.automationBaseFolder = path.join(Meteor.absolutePath, '.automation');
                            console.log('Meteor.settings.broker.automationBaseFolder was empty, setting it to default: ', Meteor.settings.broker.automationBaseFolder);
                        }                                                                                              // 67
                                                                                                                       //
                        if (!Meteor.settings.broker.customerDataDir) {                                                 // 68
                            Meteor.settings.broker.customerDataDir = path.join(Meteor.absolutePath, 'customerData');   // 69
                            console.log('Meteor.settings.broker.customerDataDir was empty, setting it to default: ', Meteor.settings.broker.customerDataDir);
                        }                                                                                              // 71
                                                                                                                       //
                        console.log('------------------------------------');                                           // 72
                        Meteor.call('updateLocalSenseCopy');                                                           // 73
                        _context.prev = 7;                                                                             // 60
                        //By checking if a stream exist we try to figure out if this is a fresh or already existing Qlik Sense installation.
                        QlikConfigured = QSStream.getStreamByName(Meteor.settings.public.TemplateAppStreamName);       // 77
                                                                                                                       //
                        if (!(!QlikConfigured || Meteor.settings.broker.runInitialQlikSenseSetup)) {                   // 60
                            _context.next = 34;                                                                        // 60
                            break;                                                                                     // 60
                        }                                                                                              // 60
                                                                                                                       //
                        console.log('Template stream does not yet exist or the runInitialQlikSenseSetup setting has been set to true, so we expect to have a fresh Qlik Sense installation for which we now automatically populate with the apps, streams, license, security rules etc.');
                                                                                                                       //
                        if (!Meteor.settings.qlikSense.installQlikSense) {                                             // 60
                            _context.next = 16;                                                                        // 60
                            break;                                                                                     // 60
                        }                                                                                              // 60
                                                                                                                       //
                        installQlikSense();                                                                            // 81
                        _context.next = 15;                                                                            // 60
                        return _regenerator2.default.awrap(timeout(1000 * 60 * 20));                                   // 60
                                                                                                                       //
                    case 15:                                                                                           // 60
                        //wait 20 minutes till the Qlik Sense installation has completed...                            
                        QSLic.insertLicense();                                                                         // 83
                                                                                                                       //
                    case 16:                                                                                           // 60
                        QSLic.insertUserAccessRule();                                                                  // 85
                        QSSystem.disableDefaultSecurityRules();                                                        // 86
                        _context.next = 20;                                                                            // 60
                        return _regenerator2.default.awrap(QSProxy.createVirtualProxies());                            // 60
                                                                                                                       //
                    case 20:                                                                                           // 60
                        _context.next = 22;                                                                            // 60
                        return _regenerator2.default.awrap(timeout(4000));                                             // 60
                                                                                                                       //
                    case 22:                                                                                           // 60
                        _context.next = 24;                                                                            // 60
                        return _regenerator2.default.awrap(QSSystem.createSecurityRules());                            // 60
                                                                                                                       //
                    case 24:                                                                                           // 60
                        QSStream.initSenseStreams();                                                                   // 90
                        _context.next = 27;                                                                            // 60
                        return _regenerator2.default.awrap(QSApp.uploadAndPublishTemplateApps());                      // 60
                                                                                                                       //
                    case 27:                                                                                           // 60
                        QSApp.setAppIDs();                                                                             // 92
                        _context.next = 30;                                                                            // 60
                        return _regenerator2.default.awrap(QSApp.createAppConnections());                              // 60
                                                                                                                       //
                    case 30:                                                                                           // 60
                        //import extra connections                                                                     // 93
                        QSExtensions.uploadExtensions();                                                               // 94
                        QSLic.saveSystemRules();                                                                       // 95
                        _context.next = 35;                                                                            // 60
                        break;                                                                                         // 60
                                                                                                                       //
                    case 34:                                                                                           // 60
                        //set the app Id for the self service bi and the slide generator app, for use in the IFrames etc.    
                        QSApp.setAppIDs();                                                                             // 98
                                                                                                                       //
                    case 35:                                                                                           // 60
                        _context.next = 40;                                                                            // 60
                        break;                                                                                         // 60
                                                                                                                       //
                    case 37:                                                                                           // 60
                        _context.prev = 37;                                                                            // 60
                        _context.t0 = _context["catch"](7);                                                            // 60
                        console.error('Main.js, initQlikSense: Failed to run the initialization of Qlik Sense', _context.t0);
                                                                                                                       //
                    case 40:                                                                                           // 60
                    case "end":                                                                                        // 60
                        return _context.stop();                                                                        // 60
                }                                                                                                      // 60
            }                                                                                                          // 60
        }                                                                                                              // 60
                                                                                                                       //
        return initQlikSense$;                                                                                         // 60
    }(), null, this, [[7, 37]]);                                                                                       // 60
} //helper functions to await a set timeout                                                                            // 60
                                                                                                                       //
                                                                                                                       //
function timeout(ms) {                                                                                                 // 107
    return new Promise(function (resolve) {                                                                            // 108
        return setTimeout(resolve, ms);                                                                                // 108
    });                                                                                                                // 108
}                                                                                                                      // 109
                                                                                                                       //
function sleep(fn) {                                                                                                   // 110
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {          // 110
        args[_key - 1] = arguments[_key];                                                                              // 110
    }                                                                                                                  // 110
                                                                                                                       //
    return _regenerator2.default.async(function () {                                                                   // 110
        function sleep$(_context2) {                                                                                   // 110
            while (1) {                                                                                                // 110
                switch (_context2.prev = _context2.next) {                                                             // 110
                    case 0:                                                                                            // 110
                        _context2.next = 2;                                                                            // 110
                        return _regenerator2.default.awrap(timeout(3000));                                             // 110
                                                                                                                       //
                    case 2:                                                                                            // 110
                        return _context2.abrupt("return", fn.apply(undefined, args));                                  // 110
                                                                                                                       //
                    case 3:                                                                                            // 110
                    case "end":                                                                                        // 110
                        return _context2.stop();                                                                       // 110
                }                                                                                                      // 110
            }                                                                                                          // 110
        }                                                                                                              // 110
                                                                                                                       //
        return sleep$;                                                                                                 // 110
    }(), null, this);                                                                                                  // 110
} //                                                                                                                   // 110
// ─── INSTALL QLIK SENSE ───────────────────────────────────────────────────────────                                  // 116
//                                                                                                                     // 117
                                                                                                                       //
                                                                                                                       //
var exec = require('child_process').execFile;                                                                          // 120
                                                                                                                       //
var installQlikSense = function () {                                                                                   // 121
    console.log("Start installation of Qlik Sense via a silent script... please wait 15 minutes to complete... (we use this is a safe assumption that is has finished before we move on). Be aware of screens popping up which request extra info..."); // let ps = new shell({
    //     executionPolicy: 'Bypass',                                                                                  // 125
    //     noProfile: true                                                                                             // 126
    // });                                                                                                             // 127
    // var folder = Meteor.settings.qlikSense.sharedPersistanceFolder;                                                 // 128
    // var name = Meteor.settings.qlikSense.sharedPersistanceFolderName;                                               // 129
    // // ps.addCommand('Write-Host Creating a shared folder on: ' + folder);                                          // 131
    // ps.addCommand('New-Item "C:\\test" –type directory');                                                           // 132
    // // ps.addCommand('New-SmbShare –Name ' + name + ' –Path ' + folder + ' –FullAccess Everyone  ')                 // 133
    // ps.invoke()                                                                                                     // 135
    //     .then(output => {                                                                                           // 136
    //         console.log(output);                                                                                    // 137
    //     })                                                                                                          // 138
    //     .catch(err => {                                                                                             // 139
    //         console.error('Installation of Qlik Sense failed, make sure you check the log file in GitHub\QRSMeteor\.automation\InstallationSoftware\log.txt', err)
    //         ps.dispose();                                                                                           // 141
    //     });                                                                                                         // 142
                                                                                                                       //
    var executable = 'startSilentInstall.ps1';                                                                         // 144
    var installer = path.join(Meteor.settings.broker.automationBaseFolder, 'InstallationSoftware', executable);        // 145
    exec(installer, function (err, data) {                                                                             // 146
        if (err) {} else {                                                                                             // 147
            console.log('installation of Qlik Sense success, reponse from the Qlik Sense installer: ' + data.toString());
        }                                                                                                              // 149
    });                                                                                                                // 150
}; //                                                                                                                  // 151
// ─── REMOVE STREAMS AND APPS CREATED DURING THE SAAS DEMO ───────────────────────                                    // 155
//                                                                                                                     // 156
                                                                                                                       //
                                                                                                                       //
function removeGeneratedResources() {                                                                                  // 158
    // console.log('remove the all generated resources on each server start');                                         // 159
    // Meteor.setTimeout(function() {                                                                                  // 160
    //     console.log('remove all generated resources in mongo and qlik sense periodically by making use of a server side timer');
    //     Meteor.call('removeGeneratedResources', {});                                                                // 162
    // }, 0); //remove all logs directly at startup                                                                    // 163
    if (Meteor.settings.broker.automaticCleanUpGeneratedApps === "Yes") {                                              // 164
        Meteor.setInterval(function () {                                                                               // 165
            console.log('remove all generated resources in mongo and qlik sense periodically by making use of a server side timer');
            Meteor.call('removeGeneratedResources', {});                                                               // 167
        }, 1 * 86400000); //remove all logs/apps/streams every 1 day                                                   // 168
    }                                                                                                                  // 169
}                                                                                                                      // 170
                                                                                                                       //
function optimizeMongoDB() {                                                                                           // 172
    // console.log('## setting up mongo indexes on generationUserId in the generated resources, customers and other collections, to increase mongo performance');
    TemplateApps._ensureIndex({                                                                                        // 174
        "generationUserId": 1,                                                                                         // 175
        "id": 1                                                                                                        // 176
    });                                                                                                                // 174
                                                                                                                       //
    GeneratedResources._ensureIndex({                                                                                  // 178
        "generationUserId": 1,                                                                                         // 179
        "id": 1                                                                                                        // 180
    });                                                                                                                // 178
                                                                                                                       //
    Apps._ensureIndex({                                                                                                // 182
        "id": 1                                                                                                        // 183
    });                                                                                                                // 182
                                                                                                                       //
    Customers._ensureIndex({                                                                                           // 185
        "generationUserId": 1                                                                                          // 186
    });                                                                                                                // 185
                                                                                                                       //
    Streams._ensureIndex({                                                                                             // 188
        "id": 1                                                                                                        // 189
    });                                                                                                                // 188
                                                                                                                       //
    APILogs._ensureIndex({                                                                                             // 191
        "createdBy": 1                                                                                                 // 192
    });                                                                                                                // 191
                                                                                                                       //
    APILogs._ensureIndex({                                                                                             // 194
        "createDate": 1                                                                                                // 195
    });                                                                                                                // 194
} //                                                                                                                   // 197
// ─── GET AN UPDATE WHEN QLIK SENSE HAS CHANGED ──────────────────────────────────                                    // 200
//                                                                                                                     // 201
// function createNotificationListeners() {                                                                            // 204
//     //Create notification listener in Qlik sense https://help.qlik.com/en-US/sense-developer/3.1/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-Notification-Remove-Change-Subscription.htm
//     //console.log('********* On meteor startup, Meteor tool registers itself at Qlik Sense to get notifications from Sense on changes to apps and streams.');
//     //console.log('********* we try to register a notification on this URL: HTTP post to http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/notification?name=app');
//     //console.log('********* The notification URL for Streams is: ' + Meteor.settings.private.notificationURL + '/streams');
//     try {                                                                                                           // 210
//         const resultApp = HTTP.post('http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/notification?name=app', {
//             headers: authHeaders,                                                                                   // 212
//             params: { 'xrfkey': senseConfig.xrfkey },                                                               // 213
//             data: Meteor.settings.private.notificationURL + '/apps'                                                 // 214
//         })                                                                                                          // 215
//         const resultStream = HTTP.post('http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/notification?name=stream', {
//                 headers: authHeaders,                                                                               // 218
//                 params: { 'xrfkey': senseConfig.xrfkey },                                                           // 219
//                 data: Meteor.settings.private.notificationURL + '/streams'                                          // 220
//             })                                                                                                      // 221
//             //console.log('Register notication success');                                                           // 222
//             // //console.log('the result from sense register App notification was: ', resultApp);                   // 223
//             // //console.log('the result from sense register Stream notification was: ', resultStream);             // 224
//     } catch (err) {                                                                                                 // 225
//         console.error('Create notification subscription in sense qrs failed', err);                                 // 226
//         // throw new Meteor.Error('Create notification subscription in sense qrs failed', err);                     // 227
//     }                                                                                                               // 228
// }                                                                                                                   // 229
//                                                                                                                     // 231
// ─── METEOR METHODS ─────────────────────────────────────────────────────────────                                    // 232
//                                                                                                                     // 233
                                                                                                                       //
                                                                                                                       //
Meteor.methods({                                                                                                       // 236
    getAppIDs: function () {                                                                                           // 237
        return {                                                                                                       // 238
            SSBI: senseConfig.SSBIApp,                                                                                 // 239
            // QSApp.getApps(Meteor.settings.public.SSBI.name, Meteor.settings.public.SSBI.stream)[0].id,              // 239
            slideGenerator: senseConfig.slideGeneratorAppId //QSApp.getApps(Meteor.settings.public.slideGenerator.name, Meteor.settings.public.slideGenerator.stream)[0].id
                                                                                                                       //
        };                                                                                                             // 238
    },                                                                                                                 // 242
    generateStreamAndApp: function () {                                                                                // 243
        function _callee(customers) {                                                                                  // 236
            var customerNames;                                                                                         // 236
            return _regenerator2.default.async(function () {                                                           // 236
                function _callee$(_context3) {                                                                         // 236
                    while (1) {                                                                                        // 236
                        switch (_context3.prev = _context3.next) {                                                     // 236
                            case 0:                                                                                    // 236
                                _context3.prev = 0;                                                                    // 236
                                check(customers, Array);                                                               // 245
                                _context3.next = 7;                                                                    // 236
                                break;                                                                                 // 236
                                                                                                                       //
                            case 4:                                                                                    // 236
                                _context3.prev = 4;                                                                    // 236
                                _context3.t0 = _context3["catch"](0);                                                  // 236
                                throw new Meteor.Error('Missing field', 'No customers supplied for the generation of apps.');
                                                                                                                       //
                            case 7:                                                                                    // 236
                                // first clean the environment                                                         // 249
                                Meteor.call('removeGeneratedResources', {                                              // 250
                                    'generationUserId': Meteor.userId()                                                // 251
                                });                                                                                    // 250
                                _context3.next = 10;                                                                   // 236
                                return _regenerator2.default.awrap(QSApp.generateStreamAndApp(customers, this.userId));
                                                                                                                       //
                            case 10:                                                                                   // 236
                                //then, create the new stuff                                                           // 253
                                console.log('################## Meteor.settings.multiTenantScenario', Meteor.settings.multiTenantScenario);
                                                                                                                       //
                                try {                                                                                  // 256
                                    if (!Meteor.settings.multiTenantScenario) {                                        // 257
                                        //on premise installation for a single tenant (e.g. with MS Active Directory)  // 257
                                        customerNames = customers.map(function (c) {                                   // 258
                                            return c.name;                                                             // 259
                                        });                                                                            // 260
                                        console.log('customerNames', customerNames);                                   // 262
                                        QSCustomProps.upsertCustomPropertyByName('customer', customerNames); //for non OEM scenarios (with MS AD), people like to use custom properties for authorization instead of the groups via a ticket.
                                    }                                                                                  // 264
                                } catch (error) {                                                                      // 265
                                    console.log('error to create custom properties', error);                           // 266
                                }                                                                                      // 267
                                                                                                                       //
                                Meteor.call('updateLocalSenseCopy');                                                   // 269
                                                                                                                       //
                            case 13:                                                                                   // 236
                            case "end":                                                                                // 236
                                return _context3.stop();                                                               // 236
                        }                                                                                              // 236
                    }                                                                                                  // 236
                }                                                                                                      // 236
                                                                                                                       //
                return _callee$;                                                                                       // 236
            }(), null, this, [[0, 4]]);                                                                                // 236
        }                                                                                                              // 236
                                                                                                                       //
        return _callee;                                                                                                // 236
    }(),                                                                                                               // 236
    resetEnvironment: function () {                                                                                    // 271
        Meteor.call('resetLoggedInUser'); //logout all users before removing all the current customers. This to prevent the screen stays logged in at an old user.
                                                                                                                       //
        Meteor.call('removeGeneratedResources', {                                                                      // 273
            'generationUserId': Meteor.userId()                                                                        // 274
        });                                                                                                            // 273
        TemplateApps.remove({                                                                                          // 276
            'generationUserId': Meteor.userId()                                                                        // 277
        });                                                                                                            // 276
        Customers.remove({                                                                                             // 279
            'generationUserId': Meteor.userId()                                                                        // 280
        });                                                                                                            // 279
        APILogs.remove({                                                                                               // 282
            'generationUserId': Meteor.userId()                                                                        // 283
        });                                                                                                            // 282
                                                                                                                       //
        if (!Meteor.settings.multiTenantScenario) {                                                                    // 285
            //on premise installation for a single tenant (e.g. with MS Active Directory)                              // 285
            QSCustomProps.deleteCustomProperty('customers');                                                           // 286
        }                                                                                                              // 287
    },                                                                                                                 // 288
    upsertTemplate: function (selector, currentApp) {                                                                  // 289
        console.log('upsert template');                                                                                // 290
        TemplateApps.upsert(selector, {                                                                                // 291
            $set: {                                                                                                    // 292
                name: currentApp.name,                                                                                 // 293
                id: currentApp.id,                                                                                     // 294
                generationUserId: Meteor.userId()                                                                      // 295
            }                                                                                                          // 292
        });                                                                                                            // 291
    },                                                                                                                 // 298
    removeTemplate: function (selector, currentApp) {                                                                  // 299
        console.log('remove template');                                                                                // 300
        TemplateApps.remove(selector);                                                                                 // 301
    },                                                                                                                 // 302
    removeGeneratedResources: function (generationUserSelection) {                                                     // 303
        //console.log('remove GeneratedResources method, before we make new ones');                                    // 304
        //logging only                                                                                                 // 305
        if (generationUserSelection) {                                                                                 // 306
            var call = {};                                                                                             // 307
            call.action = 'Remove generated resources';                                                                // 308
            call.request = 'Remove all apps and streams in Qlik Sense for userId: ' + generationUserSelection.generationUserId;
            REST_Log(call, generationUserSelection);                                                                   // 310
        }                                                                                                              // 311
                                                                                                                       //
        GeneratedResources.find(generationUserSelection).forEach(function (resource) {                                 // 312
            // this.unblock()                                                                                          // 314
            //console.log('resetEnvironment for userId', Meteor.userId());generationUserSelection.generationUserId     // 315
            //If not selection was given, we want to reset the whole environment, so also delete the streams.          // 317
            // if (!generationUserSelection.generationUserId) {                                                        // 318
            try {                                                                                                      // 319
                Meteor.call('deleteStream', resource.streamId); //added random company names, so this should not be an issue //26-9 can't delete stream, because each user creates a stream with the same name...
            } catch (err) {} //console.error('No issue, but you can manually remove this id from the generated database. We got one resource in the generated list, that has already been removed manually', resource);
            //don't bother if generated resources do not exists, just continue                                         // 323
            // }                                                                                                       // 324
            //delete apps always                                                                                       // 325
                                                                                                                       //
                                                                                                                       //
            try {                                                                                                      // 326
                Meteor.call('deleteApp', resource.appId);                                                              // 327
            } catch (err) {//console.error('No issue, but you can manually remove this id from the generated database. We got one resource in the generated list, that has already been removed manually', resource);
            }                                                                                                          // 330
        });                                                                                                            // 331
        GeneratedResources.remove(generationUserSelection);                                                            // 332
        APILogs.remove(generationUserSelection);                                                                       // 333
    },                                                                                                                 // 334
    copyApp: function (guid, name) {                                                                                   // 335
        check(guid, String);                                                                                           // 336
        check(name, String);                                                                                           // 337
        var id = QSApp.copyApp(guid, name);                                                                            // 338
        Meteor.call('updateLocalSenseCopy');                                                                           // 339
        return id;                                                                                                     // 340
    },                                                                                                                 // 341
    copyAppSelectedCustomers: function (currentApp) {                                                                  // 342
        //the app the user clicked on                                                                                  // 342
        if (!currentApp) {                                                                                             // 343
            throw new Meteor.Error('No App selected to copy');                                                         // 344
        }                                                                                                              // 345
                                                                                                                       //
        ;                                                                                                              // 345
        customers = Customers.find({                                                                                   // 347
            'generationUserId': Meteor.userId(),                                                                       // 348
            checked: true                                                                                              // 349
        }); //all selected customers                                                                                   // 347
                                                                                                                       //
        if (!customers) {                                                                                              // 351
            throw new Meteor.Error('No customers selected to copy the app for');                                       // 352
        }                                                                                                              // 353
                                                                                                                       //
        ;                                                                                                              // 353
        customers.forEach(function (customer) {                                                                        // 355
            var newAppId = Meteor.call('copyApp', currentApp.id, customer.name + '-' + currentApp.name);               // 357
            Meteor.call('updateLocalSenseCopy'); //store in the database that the user generated something, so we can later on remove it.
                                                                                                                       //
            GeneratedResources.insert({                                                                                // 361
                'generationUserId': Meteor.userId(),                                                                   // 362
                'customer': null,                                                                                      // 363
                'streamId': null,                                                                                      // 364
                'appId': newAppId                                                                                      // 365
            });                                                                                                        // 361
        });                                                                                                            // 367
    },                                                                                                                 // 368
    deleteApp: function (guid) {                                                                                       // 369
        check(guid, String);                                                                                           // 370
                                                                                                                       //
        if (guid !== Meteor.settings.public.templateAppId) {                                                           // 371
            //logging only                                                                                             // 372
            var call = {};                                                                                             // 373
            call.action = 'Delete app';                                                                                // 374
            call.request = 'Delete app: ' + guid;                                                                      // 375
            REST_Log(call);                                                                                            // 376
            var id = QSApp.deleteApp(guid);                                                                            // 378
            Meteor.call('updateLocalSenseCopy');                                                                       // 379
            return id;                                                                                                 // 380
        } else {                                                                                                       // 381
            throw new Meteor.Error("you can't delete the template app with guid: ", guid);                             // 382
        }                                                                                                              // 383
    },                                                                                                                 // 384
    removeAllCustomers: function () {                                                                                  // 385
        return Customers.remove({                                                                                      // 386
            'generationUserId': Meteor.userId()                                                                        // 387
        });                                                                                                            // 386
    }                                                                                                                  // 389
});                                                                                                                    // 236
Meteor.methods({                                                                                                       // 392
    updateLocalSenseCopyApps: function () {                                                                            // 393
        //delete the local content of the database before updating it                                                  // 394
        Apps.remove({}); //Update the Apps with fresh info from Sense                                                  // 395
                                                                                                                       //
        _.each(QSApp.getApps(), function (app) {                                                                       // 398
            Apps.insert(app);                                                                                          // 399
        });                                                                                                            // 400
    },                                                                                                                 // 401
    updateLocalSenseCopyStreams: function () {                                                                         // 402
        //delete the local content of the database before updating it                                                  // 403
        Streams.remove({}); //Update the Streams with fresh info from Sense                                            // 404
                                                                                                                       //
        _.each(QSStream.getStreams(), function (stream) {                                                              // 407
            Streams.insert(stream);                                                                                    // 408
        });                                                                                                            // 409
    },                                                                                                                 // 410
    updateLocalSenseCopy: function () {                                                                                // 411
        // //console.log('Method: update the local mongoDB with fresh data from Qlik Sense: call QRS API getStreams and getApps');
        //delete the local content of the database before updating it                                                  // 413
        Apps.remove({});                                                                                               // 414
        Streams.remove({}); //Update the Apps and Streams with fresh info from Sense                                   // 415
                                                                                                                       //
        _.each(QSApp.getApps(), function (app) {                                                                       // 418
            Apps.insert(app);                                                                                          // 419
        });                                                                                                            // 420
                                                                                                                       //
        _.each(QSStream.getStreams(), function (stream) {                                                              // 422
            Streams.insert(stream);                                                                                    // 423
        });                                                                                                            // 424
    },                                                                                                                 // 425
    getSecurityRules: function () {                                                                                    // 426
        return QSSystem.getSecurityRules();                                                                            // 427
    }                                                                                                                  // 428
}); // checkSenseIsReady() {                                                                                           // 392
//     //console.log('Method: checkSenseIsReady, TRY TO SEE IF WE CAN CONNECT TO QLIK SENSE ENGINE VIA QSOCKS');       // 435
//     // try {                                                                                                        // 437
//     // qsocks.Connect(engineConfig)                                                                                 // 438
//     //     .then(function(global) {                                                                                 // 439
//     //         // Connected                                                                                         // 440
//     //         //console.log('Meteor is connected via Qsocks to Sense Engine API using certificate authentication');
//     //         return true;                                                                                         // 442
//     //     }, function(err) {                                                                                       // 443
//     //         // Something went wrong                                                                              // 444
//     //         console.error('Meteor could not connect to Sense with the config settings specified. The error is: ', err.message);
//     //         console.error('the settings are: ', engineConfig)                                                    // 446
//     //         return false                                                                                         // 447
//     //         // throw new Meteor.Error('Could not connect to Sense Engine API', err.message);                     // 448
//     //     });                                                                                                      // 449
//     //TRY TO SEE IF WE CAN CONNECT TO SENSE VIA HTTP                                                                // 451
//     try{                                                                                                            // 452
//         const result = HTTP.get('http://' + senseConfig.SenseServerInternalLanIP +':' + senseConfig.port + '/'+ senseConfig.virtualProxy + '/qrs/app/full', { //?xrfkey=' + senseConfig.xrfkey, {
//             headers: authHeaders,                                                                                   // 454
//             params: { 'xrfkey': senseConfig.xrfkey }                                                                // 455
//         })//http get                                                                                                // 456
//         //console.log(result);                                                                                      // 457
//         if(result.statuscode === 200){                                                                              // 458
//             //console.log('We got a result back from Sense with statuscode 200: Success')                           // 459
//             return true;}                                                                                           // 460
//         else{return false}                                                                                          // 461
//     } catch (err) {                                                                                                 // 462
//         return false;                                                                                               // 463
//         // throw new Meteor.Error('Could not connect via HTTP to Qlik Sense: Is Sense running? Are the firewalls open? Have you exported the certificate for this host? virtualProxy setup?');
//     }                                                                                                               // 465
// }                                                                                                                   // 466
//GET APPS USING QSOCKS (FOR DEMO PURPOSE ONLY, CAN ALSO BE DONE WITH QRS API)                                         // 468
// getApps() {                                                                                                         // 469
//     return QSApp.getApps();                                                                                         // 470
//     // appListSync = Meteor.wrapAsync(qsocks.Connect(engineConfig)                                                  // 471
//     //     .then(function(global) {                                                                                 // 472
//     //         global.getDocList()                                                                                  // 473
//     //             .then(function(docList) {                                                                        // 474
//     //                 return (docList);                                                                            // 475
//     //             });                                                                                              // 476
//     //     })                                                                                                       // 477
//     //     .catch(err => {                                                                                          // 478
//     //         throw new Meteor.Error(err)                                                                          // 479
//     //     }));                                                                                                     // 480
//     // result = appListSync();                                                                                      // 481
//     // return result;                                                                                               // 482
// },                                                                                                                  // 484
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("./lib/yogiben.js");
require("./server/accounts.js");
require("./server/proxy.js");
require("./server/publications.js");
require("./server/restEndpoints.js");
require("./server/routes.js");
require("./server/seeds.js");
require("./server/main.js");
//# sourceMappingURL=app.js.map
