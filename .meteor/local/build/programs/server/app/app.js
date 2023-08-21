var require = meteorInstall({"lib":{"yogiben.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// lib/yogiben.js                                                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// import { Customers } from '/imports/api/customers';
// AdminConfig = {
//     collections: {
//         Customers: {
//             collectionObject: Customers,
//         }
//     },
//     userSchema: new SimpleSchema({
//         'profile.gender': {
//             type: String,
//             allowedValues: ['male', 'female']
//         }
//     })
// };
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"imports":{"api":{"server":{"QPSFunctions.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/server/QPSFunctions.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const module1 = module;
module1.export({
  createVirtualProxies: () => createVirtualProxies,
  getVirtualProxies: () => getVirtualProxies,
  logoutUser: () => logoutUser,
  getRedirectURL: () => getRedirectURL
});
let Meteor;
module1.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Customers, dummyCustomers, dummyCustomer;
module1.watch(require("/imports/api/customers"), {
  Customers(v) {
    Customers = v;
  },

  dummyCustomers(v) {
    dummyCustomers = v;
  },

  dummyCustomer(v) {
    dummyCustomer = v;
  }

}, 1);
let REST_Log;
module1.watch(require("/imports/api/APILogs"), {
  REST_Log(v) {
    REST_Log = v;
  }

}, 2);
let gitHubLinks;
module1.watch(require("/imports/ui/UIHelpers"), {
  gitHubLinks(v) {
    gitHubLinks = v;
  }

}, 3);
let senseConfig, authHeaders, qliksrv, configCerticates, validateJSON;
module1.watch(require("/imports/api/config.js"), {
  senseConfig(v) {
    senseConfig = v;
  },

  authHeaders(v) {
    authHeaders = v;
  },

  qrsSrv(v) {
    qliksrv = v;
  },

  configCerticates(v) {
    configCerticates = v;
  },

  validateJSON(v) {
    validateJSON = v;
  }

}, 4);
let lodash;
module1.watch(require("lodash"), {
  default(v) {
    lodash = v;
  }

}, 5);

var fs = require("fs-extra");

const path = require("path");

var os = require("os");

var ip = require("ip"); // const token = require("./token");


const {
  v4: uuidv4
} = require("uuid"); //
// ─── IMPORT CONFIG FOR QLIK SENSE QRS ───────────────────────────────────────────
//


_ = lodash; //
// ─── CREATE VIRTUAL PROXIES ─────────────────────────────────────────────────────
//
// http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-Virtual-Proxy-Create.htm

function createVirtualProxies() {
  return Promise.asyncApply(() => {
    console.log("------------------------------------");
    console.log("CREATE VIRTUAL PROXIES");
    console.log("------------------------------------");
    var file = path.join(Meteor.settings.broker.automationBaseFolder, "proxy", "import", "virtualProxySettings.json");

    try {
      // READ THE PROXY FILE
      var proxySettings = Promise.await(fs.readJson(file));

      try {
        validateJSON(proxySettings);
      } catch (err) {
        throw new Error("Cant read the virtual proxy definitions file: virtualProxySettings.json in your automation folder");
      } //FOR EACH PROXY FOUND IN THE INPUTFILE (vpToCreate), CREATE IT IN SENSE. We also put the current ip/host in the list of sense since in most cases this tool runs on the same machine as sense.


      for (var vpToCreate of proxySettings) {
        if (vpToCreate.websocketCrossOriginWhiteList) {
          vpToCreate.websocketCrossOriginWhiteList.push(Meteor.settings.public.qlikSenseHost);
          vpToCreate.websocketCrossOriginWhiteList.push(ip.address());
          vpToCreate.websocketCrossOriginWhiteList.push(os.hostname());
        }

        var existingProxies = getVirtualProxies(); // CHECK IF VIRT. PROXY ALREADY EXISTS IN SENSE

        var found = existingProxies.some(function (existingVP) {
          return existingVP.prefix === vpToCreate.prefix;
        });

        if (!found) {
          var virtualProxy = createVirtualProxy(vpToCreate); // THE VIRTUAL PROXY HAS BEEN CREATED, NOW LINK IT TO THE CENTRAL PROXY

          linkVirtualProxyToProxy(virtualProxy);
        } else {
          console.log("Virtual proxy " + vpToCreate.prefix + " already existed. We do not update existing ones.");
        }
      }
    } catch (err) {
      console.error(err);
      throw new Error("unable to create virtual proxies", err);
    }

    function createVirtualProxy(virtualProxy) {
      // get id of local node so we can link the virtual proxy to a load balancing node
      virtualProxy.loadBalancingServerNodes = [{
        id: getServerNodeConfiguration().id
      }];

      try {
        check(virtualProxy, Object);
        console.log("------CREATE VIRTUAL PROXY: ", virtualProxy.prefix);
        var request = qliksrv + "/qrs/virtualproxyconfig/";
        response = HTTP.call("POST", request, {
          params: {
            xrfkey: senseConfig.xrfkey
          },
          npmRequestOptions: configCerticates,
          data: virtualProxy
        });
        return response.data;
      } catch (err) {
        console.error("create virtual proxy failed", err);
      } // }

    }
  });
}

// http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-Virtual-Proxy-Link.htm
function linkVirtualProxyToProxy(virtualProxy) {
  // console.log('linkVirtualProxyToProxy', virtualProxy.id);
  // GET ID OF PROXY ON THIS HOST
  var proxyId = getProxyId(); // GET THE CONFIG OF THE PROXY (WHICH CONTAINS VIRTUAL PROXIES)

  var proxyConfig = getProxyServiceConfiguration(proxyId); // ADD THE NEW VIRTUAL PROXY TO THE EXISTING PROXY LIST

  proxyConfig.settings.virtualProxies.push(virtualProxy);

  try {
    check(Meteor.settings.public.qlikSensePort, Number);
    check(Meteor.settings.public.qlikSensePortSecure, Number);
    check(Meteor.settings.broker.qlikSense.proxyAllowHTTP, Boolean);
  } catch (error) {
    console.error("settings file incomplete, your are missing the qliksenseport, qlikSensePortSecure or proxyAllowHTTP");
  } //UPDATE SOME PROXY SETTINGS


  console.log("UPDATE SOME PROXY SETTINGS...");
  proxyConfig.settings.unencryptedListenPort = Meteor.settings.public.qlikSensePort; //HTTP

  proxyConfig.settings.listenPort = Meteor.settings.public.qlikSensePortSecure; //HTTPS

  proxyConfig.settings.allowHttp = Meteor.settings.broker.qlikSense.proxyAllowHTTP; //OVERWRITE THE SETTINGS WITH THE COMPLETE UPDATED OBJECT.

  updateProxy(proxyId, proxyConfig);
}

function updateProxy(proxyId, proxyConfig) {
  try {
    check(proxyId, String);
    check(proxyConfig, Object); // console.log('proxyConfig', proxyConfig.settings.virtualProxies)

    var request = qliksrv + "/qrs/proxyservice/" + proxyId;
    response = HTTP.call("PUT", request, {
      params: {
        xrfkey: senseConfig.xrfkey
      },
      npmRequestOptions: configCerticates,
      data: proxyConfig
    });
  } catch (err) {
    console.error("update proxy failed", err);
  }
}

function getProxyId() {
  try {
    var request = qliksrv + "/qrs/proxyservice/?xrfkey=" + senseConfig.xrfkey;
    response = HTTP.call("GET", request, {
      npmRequestOptions: configCerticates
    });
    return response.data[0].id;
  } catch (err) {
    console.error("get proxyId failed", err);
  }
}

function getProxyServiceConfiguration(proxyId) {
  try {
    check(proxyId, String);
    var request = qliksrv + "/qrs/proxyservice/" + proxyId + "?xrfkey=" + senseConfig.xrfkey;
    response = HTTP.call("GET", request, {
      npmRequestOptions: configCerticates
    }); //SAVE RPOXY CONFIG TO THE EXPORT FOLDER

    var file = path.join(Meteor.settings.broker.automationBaseFolder, "proxy", "export", "proxyServiceConfiguration.json");
    fs.outputFile(file, JSON.stringify(response.data, null, 2), "utf-8");
    return response.data;
  } catch (err) {
    console.error("create virtual proxy failed", err);
  }
}

function getVirtualProxies() {
  // console.log('--------------------------GET VIRTUAL PROXIES');//
  try {
    var request = qliksrv + "/qrs/virtualproxyconfig/";
    response = HTTP.call("GET", request, {
      params: {
        xrfkey: senseConfig.xrfkey
      },
      npmRequestOptions: configCerticates
    });
    var file = path.join(Meteor.settings.broker.automationBaseFolder, "proxy", "export", "virtualProxyServiceConfiguration.json"); // SAVE PROXY FILE TO DISK

    fs.outputFile(file, JSON.stringify(response.data, null, 2), "utf-8");
    return response.data;
  } catch (err) {
    console.error("create virtual proxy failed", err);
  }
}

// function getCentralProxy() {
//     console.log('getCentralProxy: GET /qrs/ServerNodeConfiguration?filter=isCentral')
// }
function getServerNodeConfiguration() {
  try {
    var request = qliksrv + "/qrs/servernodeconfiguration/local?xrfkey=" + senseConfig.xrfkey;
    response = HTTP.call("GET", request, {
      npmRequestOptions: configCerticates
    });
    return response.data;
  } catch (err) {
    console.error("create virtual proxy failed", err);
  }
} //
// ─── METEOR METHODS ─────────────────────────────────────────────────────────────
//


Meteor.methods({
  currentlyLoggedInUser() {
    // console.log("Meteor will now look which user is currently logged in, and request a ticket for this ID, and add his group memberships.");
    var call = {};
    call.action = "STEP 3: Server received request to create ticket";
    call.request = "Meteor server received a incoming method call from the browser. The meteor server will now look which user is currently logged in, and create a ticket for this ID, and add his group memberships.";
    REST_Log(call, Meteor.userId()); // first find the customers that have a logged in users (mongo returns a complete document)

    var customer = Customers.findOne({
      generationUserId: Meteor.userId(),
      "users.currentlyLoggedIn": true
    }); // console.log('In our local database we can find the customer with the currentlyLoggedIn set to true for user: ' + loggedInUser + ', the customer which contains the user that the user selected with the dropdown: ', customer);
    // now we have the document, we can look in the array of users, to find the one that is logged in.

    var user;

    if (!customer) {
      // if no user is selected, just insert john as a dummy
      // const error = 'You have not selected a user you want to simulate the Single Sign on with. For demo purposes we now selected John for you. You can also select your own user in step 4 of the SaaS demo';
      var response = {}; // console.log('dummyCustomer :', dummyCustomer);

      response.user = dummyCustomer.user;
      response.customer = dummyCustomer; // throw new Meteor.Warning('No user', error);
    } else {
      var user = _.find(customer.users, {
        currentlyLoggedIn: true
      });

      var response = {};
      response.user = user;
      response.customer = customer;
    } // console.log('the response is: ', response);


    return response;
  },

  getRedirectUrl(proxyRestUri, targetId, loggedInUser) {
    var response = Meteor.call("currentlyLoggedInUser");
    var customer = response.customer;
    var user = response.user;
    console.log("UserID currently logged in in the demo platform: " + loggedInUser + ". Meteor server side thinks the meteor.userId is " + Meteor.userId() + ". We use this as the UDC name"); // Create a paspoort (ticket) request: user directory, user identity and attributes

    var passport = {
      UserDirectory: Meteor.userId(),
      // Specify a dummy value to ensure userID's are unique E.g. "Dummy", or in my case, I use the logged in user, so each user who uses the demo can logout only his users, or the name of the customer domain if you need a Virtual proxy per customer
      UserId: user.name,
      // the current user that we are going to login with
      Attributes: [{
        group: customer.name.toUpperCase()
      }, // attributes supply the group membership from the source system to Qlik Sense
      {
        group: user.country.toUpperCase()
      }, {
        group: user.group.toUpperCase()
      }]
    };
    console.log('Request ticket for this user passport": ', passport); // logging only

    var call = {};
    call.action = "STEP 4: User and group information received from customer database, now we can request a ticket";
    call.url = gitHubLinks.createpassport;
    call.request = 'Request ticket for this user and his groups (an array of values which you can use in the security rules): ": ' + JSON.stringify(passport);
    REST_Log(call, Meteor.userId());
    return getRedirectURL(passport, proxyRestUri, targetId, Meteor.userId());
  },

  getTicketNumber(userProperties, virtualProxy) {
    // only get a ticket number for a SPECIFIC virtual proxy
    console.log('getTicketNumber using properties:');
    console.log('virtualProxy', virtualProxy);
    console.log('userProperties', userProperties);

    try {
      check(userProperties.group, String);
      check(virtualProxy, String);
      check(Meteor.userId(), String);
    } catch (err) {
      throw new Meteor.Error("Failed to login into Qlik Sense via a ticket", "We could not request a ticket because the userId or groups (technical, generic) or virtual proxy, or UDC (your Meteor userId, are you not yet logged into Meteor?) are not provided");
    }

    var passport = {
      UserDirectory: Meteor.userId(),
      // Specify a dummy value to ensure userID's are unique E.g. "Dummy", or in my case, I use the logged in user, so each user who uses the demo can logout only his users, or the name of the customer domain if you need a Virtual proxy per customer
      UserId: Meteor.userId(),
      // the current user that we are going to login with
      Attributes: [{
        group: "slideGenerator"
      }, // attributes supply the group membership from the source system to Qlik Sense
      {
        group: userProperties.group
      }, {
        group: "ITALY"
      }]
    }; //get the ticket number and return it to the client

    return Meteor.call("requestTicketWithPassport", virtualProxy, passport);
  },

  //only for demo purposes! never supply groups from the client...
  requestTicketWithPassport(virtualProxy, passport) {
    console.log('getTicketNumber passport', passport); // var rootCas = require("ssl-root-cas").create();//
    // default for all https requests
    // (whether using https directly, request, or another module)
    // require("https").globalAgent.options.ca = rootCas;
    // http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-ProxyServiceAPI-Authentication-Ticket-Add.htm

    var proxyGetTicketURI = "https://" + senseConfig.SenseServerInternalLanIP + ":" + Meteor.settings.private.proxyPort + "/qps/" + virtualProxy + "/ticket"; // "proxyRestUri": "https://ip-172-31-22-22.eu-central-1.compute.internal:4243/qps/meteor/",
    // console.log('proxyGetTicketURI', proxyGetTicketURI)

    try {
      var response = HTTP.call("POST", proxyGetTicketURI, {
        npmRequestOptions: configCerticates,
        headers: authHeaders,
        params: {
          xrfkey: senseConfig.xrfkey
        },
        data: passport // the user and group info for which we want to create a ticket

      });
    } catch (err) {
      console.error("REST call to request a ticket failed. PLEASE EXPORT AND IMPORT CERTIFICATES FROM QMC FOR THE CORRECT HOSTNAME", err);
      throw new Meteor.Error("Request ticket failed", err.message);
    }

    return response.data.Ticket;
  },

  //https://qlik.dev/authenticate/jwt/create-signed-tokens-for-jwt-authorization
  getJWTToken(passport) {
    console.log("get JWT with passport", passport);

    try {
      const uuid = uuidv4();
      const sub = `sub_${uuid}`;
      const name = passport.UserId;
      const email = `${uuid}@demo.anon`;
      const groups = passport.Groups;
      const genT = token.generate(sub, name, email, groups);
      console.log("🚀 ~ file: QPSFunctions.js:423 ~ getJWTToken ~ genT:", genT);
      return genT;
    } catch (err) {
      console.error("unable to generate JWT token, did you supply the correct public.pem and private.pem in the dir: " + Meteor.settings.private.certificatesDirectory, err);
      throw new Meteor.Error("generate jwt token failed", err.message);
    }
  },

  resetLoggedInUser() {
    // console.log("***Method resetLoggedInUsers");
    // console.log('call the QPS logout api, to invalidate the session cookie for each user in our local database');
    // reset the local database. set all users to not logged in. We need this code because we do a simulation of the login and not a real end user login.
    Customers.find({
      generationUserId: Meteor.userId()
    }).forEach(function (customer) {
      var updatedUsers = _.map(customer.users, function (user) {
        if (user) {
          user.currentlyLoggedIn = false;
        } // and just logout everybody in the user list


        logoutUser(Meteor.userId(), user.name);
        return user;
      });

      Customers.update(customer._id, {
        $set: {
          users: updatedUsers
        }
      });
    }); // logoutUser(Meteor.userId(), Meteor.userId()); //logout the user for the slide generator
  },

  logoutPresentationUser(UDC, name) {
    console.log("logoutPresentationUser(UDC, name)", UDC, name);
    logoutUser(UDC, name, Meteor.settings.public.slideGenerator.virtualProxy);
  },

  logoutVirtualProxyClientUsageUser(UDC, name) {
    console.log("logout virtual proxy client usuage User(UDC, name)", UDC, name);
    logoutUser(UDC, name, Meteor.settings.public.virtualProxyClientUsage);
  },

  simulateUserLogin(name) {
    check(name, String);
    Meteor.call("resetLoggedInUser"); // console.log('*** Reset all logged in user done, now write in our local database the name for the current simulated user: generationUserId: ' + Meteor.userId() + ' & users.name:' + name);

    var query = [{
      generationUserId: Meteor.userId(),
      "users.name": name
    }, {
      $set: {
        "users.$.currentlyLoggedIn": true
      }
    }];
    Customers.update({
      generationUserId: Meteor.userId(),
      "users.name": name
    }, {
      $set: {
        "users.$.currentlyLoggedIn": true
      }
    }, {}, function (error, numberAffectedDocuments) {
      if (numberAffectedDocuments === 0) {
        // if nothing is updated, insert some dummy customers
        // console.log('simulateUserLogin numberAffectedDocuments: ', numberAffectedDocuments);
        // name does not yet exist in the customers created by the current demo user. So insert our dummy customers.numberAffectedDocuments
        insertDummyCustomers(Meteor.userId());
        Customers.update({
          generationUserId: Meteor.userId(),
          "users.name": name
        }, {
          $set: {
            "users.$.currentlyLoggedIn": true
          }
        });
      }
    });
  }

});
Meteor.methods({
  resetPasswordOrCreateUser(user) {
    try {
      // console.log('reset the password of the user before logging him in');
      check(user.email, String);
      check(user.password, String);
    } catch (err) {
      throw new Meteor.Error("Missing Qlik.com user data", "The user misses important information from its Qlik.com account");
    }

    const userExists = Accounts.findUserByEmail(user.email);
    var userId = {};

    if (userExists) {
      // console.log('########### found user, now reset his password: ', userExists);
      userId = userExists._id;
      Accounts.setPassword(userId, user.password);
    } else {
      userId = Accounts.createUser(user);
      Roles.addUsersToRoles(userId, ["untrusted"], "GLOBAL"); // https://github.com/alanning/meteor-roles
    }

    return userId;
  }

});

function insertDummyCustomers(generationUserId) {
  // console.log('insertDummyCustomers called for generationUserId: ', generationUserId);
  _.each(dummyCustomers, function (customer) {
    customer.generationUserId = generationUserId;
    Customers.insert(customer);
  });
} //Each proxy has its own session cookie, so you have to logout the users per proxy used.


function logoutUser(UDC, name, proxy) {
  if (!proxy) {
    proxy = senseConfig.virtualProxyClientUsage;
  } // use use the proxy for the dummy users from step 4
  // console.log('******** QPS Functions: logout the current: ' + name + ' on proxy: ' + proxy);


  if (name) {
    // //console.log('Make QPS-logout call, We authenticate to Sense using the options (including a certificate) object in the HTTPs call: '); //, configCerticates);
    // //console.log('Meteor tries to logout the user on this URL: https://' + senseConfig.SenseServerInternalLanIP + ':4243/qps/' + senseConfig.virtualProxyClientUsage + '/user/' + senseConfig.UDC + '/' + name);
    try {
      const call = {};
      call.action = "Logout user: " + name;
      call.url = gitHubLinks.logoutUser;
      call.request = "https://" + senseConfig.SenseServerInternalLanIP + ":4243/qps/" + proxy + "/user/" + UDC + "/" + name + "?xrfkey=" + senseConfig.xrfkey;
      call.response = HTTP.call("DELETE", call.request, {
        npmRequestOptions: configCerticates
      });
      REST_Log(call, UDC); // the UDC is the by definition the userId of meteor in our approach...
      // console.log('The HTTP REQUEST to Sense QPS API:', call.request);
      // console.log('The HTTP RESPONSE from Sense QPS API: ', call.response);
    } catch (err) {
      console.error(err);
      throw new Meteor.Error("Logout user failed", err.message);
    }
  }
}

function getRedirectURL(passport, proxyRestUri, targetId, generationUserId) {
  try {
    check(passport, Object);
    check(proxyRestUri, String);
    check(targetId, String);
    check(generationUserId, String);
  } catch (error) {
    throw new Meteor.error("Request ticket failed", "You did not specify a pasport, proxyUri, targetId  or generationUserID", error);
  } // console.log('entered server side requestTicket module for user and passport', passport, proxyRestUri);
  // see https://help.qlik.com/en-US/sense-developer/3.0/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-ProxyServiceAPI-Authentication-Ticket-Add.htm


  var ticketRequestBody = passport;
  ticketRequestBody.TargetId = targetId; // console.log('The passport for requesting a ticket: ', passport);

  try {
    var call = {};
    call.action = "STEP 5: Request ticket at endpoint received from Sense";
    call.request = proxyRestUri + "ticket"; // we use the proxy rest uri which we got from the redirect from the proxy (the first bounce)

    call.url = gitHubLinks.requestTicket;
    call.response = HTTP.call("POST", call.request, {
      npmRequestOptions: configCerticates,
      headers: authHeaders,
      params: {
        xrfkey: senseConfig.xrfkey
      },
      data: passport // the user and group info for which we want to create a ticket

    });
    REST_Log(call, generationUserId);
  } catch (err) {
    console.error("REST call to request a ticket failed", err);
    throw new Meteor.Error("Request ticket failed via getRedirectURL", err.message);
  }

  console.log("The HTTP REQUEST to Sense QPS API:", call.request);
  console.log("The HTTP RESPONSE from Sense QPS API: ", call.response);
  var ticketResponse = call.response.data;
  call.action = "STEP 6: Use response from our ticket request to create redirect url";
  call.request = "Use the redirect url we got back and the ticket string to make a redirect url for the client. Format: " + ticketResponse.TargetUri + "?QlikTicket=" + ticketResponse.Ticket + ". JSON received: " + ticketResponse; // REST_Log(call);
  // Build redirect URL for the client including the ticket

  if (ticketResponse.TargetUri.indexOf("?") > 0) {
    redirectURI = ticketResponse.TargetUri + "&QlikTicket=" + ticketResponse.Ticket;
  } else {
    redirectURI = ticketResponse.TargetUri + "?QlikTicket=" + ticketResponse.Ticket;
  }

  if (!redirectURI) {
    if (Meteor.settings.public.useSSL) {
      redirectURI = "https://" + senseConfig.host + ":" + senseConfig.qlikSensePortSecure + "/" + senseConfig.virtualProxyClientUsage + "/" + hub;
    } else {
      redirectURI = "http://" + senseConfig.host + ":" + senseConfig.port + "/" + senseConfig.virtualProxyClientUsage + "/" + hub;
    }
  }

  console.log("Meteor server side created this redirect url: ", redirectURI);
  return redirectURI;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"QRSAPI.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/server/QRSAPI.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const module1 = module;
module1.export({
  myQRS: () => myQRS
});
let Meteor;
module1.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let http;
module1.watch(require("meteor/meteor"), {
  http(v) {
    http = v;
  }

}, 1);
let configCerticates, senseConfig, authHeaders, qrsSrv;
module1.watch(require("/imports/api/config"), {
  configCerticates(v) {
    configCerticates = v;
  },

  senseConfig(v) {
    senseConfig = v;
  },

  authHeaders(v) {
    authHeaders = v;
  },

  qrsSrv(v) {
    qrsSrv = v;
  }

}, 2);

var myQRS = function myQRSMain() {
  this.get = function get(path, params = {}, data = {}) {
    var endpoint = checkPath(path);
    console.log('QRS module received GET request for endpoint', endpoint); // copy the params to one object

    var newParams = Object.assign({
      xrfkey: senseConfig.xrfkey
    }, params);

    try {
      var response = HTTP.get(endpoint, {
        npmRequestOptions: configCerticates,
        params: newParams,
        data: {}
      });

      try {
        console.log('QRS GET result: response.data length: ', response.data.length);
        return response.data;
      } catch (error) {
        console.log('------------------------------------');
        console.error('We did not get any data back from Qlik Sense (empty array). If you do not expect this, make sure you check the udc, username in the settings file.');
        console.log('------------------------------------');
      }
    } catch (err) {
      var error = 'QRS HTTP GET FAILED FOR ' + endpoint;
      console.error(err);
      throw new Meteor.Error(500, 'This node server can not connect to Qlik Sense. Sometimes you have to wait 10 minutes after restarting... ' + error);
    }
  };

  this.post = function post(path, params = {}, data = {}) {
    var endpoint = checkPath(path); // copy the params to one object

    var newParams = Object.assign({
      'xrfkey': senseConfig.xrfkey
    }, params);

    try {
      var response = HTTP.post(endpoint, {
        npmRequestOptions: configCerticates,
        params: newParams,
        data: data
      });
      return response.data;
    } catch (err) {
      console.error('HTTP POST FAILED FOR ' + endpoint, err);
    }
  };

  this.del = function del(path, params = {}, data = {}) {
    var endpoint = checkPath(path);
    console.log('endpoint', endpoint);
    console.log('data', data); // copy the params to one object.

    var newParams = Object.assign({
      xrfkey: senseConfig.xrfkey
    }, params);

    try {
      var response = HTTP.del(endpoint, {
        npmRequestOptions: configCerticates,
        params: newParams,
        data: data
      }); // console.log('response', response)

      return response.data;
    } catch (err) {
      console.error('QRS HTTP DEL FAILED FOR ' + endpoint, err);
    }
  };

  this.put = function put(path, params = {}, data = {}) {
    var endpoint = checkPath(path); // copy the params to one object

    var newParams = Object.assign({
      'xrfkey': senseConfig.xrfkey
    }, params);

    try {
      var response = HTTP.put(endpoint, {
        npmRequestOptions: configCerticates,
        params: newParams,
        data: data
      });
      return response.data;
    } catch (err) {
      console.error('HTTP PUT FAILED FOR ' + endpoint, err);
    }
  };
};

function checkPath(path) {
  console.log('checkPath: path', path);
  console.log('checkPath: qrsSrv', qrsSrv);

  try {
    check(path, String);
    check(qrsSrv, String);
  } catch (err) {
    throw Error("QRS module can not use an empty server: " + qrsSrv + " or path: " + path + " for the QRS API, settings.json correct?");
  }

  return qrsSrv + path;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"QRSFunctionsApp.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/server/QRSFunctionsApp.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  uploadAndPublishTemplateApps: () => uploadAndPublishTemplateApps,
  generateStreamAndApp: () => generateStreamAndApp,
  setAppIDs: () => setAppIDs,
  createAppConnections: () => createAppConnections,
  createAppConnection: () => createAppConnection,
  copyApp: () => copyApp,
  getApps: () => getApps,
  deleteApp: () => deleteApp,
  publishApp: () => publishApp,
  importApp: () => importApp
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let http;
module.watch(require("meteor/meteor"), {
  http(v) {
    http = v;
  }

}, 1);
let Apps, TemplateApps, GeneratedResources;
module.watch(require("/imports/api/apps"), {
  Apps(v) {
    Apps = v;
  },

  TemplateApps(v) {
    TemplateApps = v;
  },

  GeneratedResources(v) {
    GeneratedResources = v;
  }

}, 2);
let QSStream;
module.watch(require("/imports/api/server/QRSFunctionsStream"), {
  "*"(v) {
    QSStream = v;
  }

}, 3);
let gitHubLinks;
module.watch(require("/imports/ui/UIHelpers"), {
  gitHubLinks(v) {
    gitHubLinks = v;
  }

}, 4);
let Streams;
module.watch(require("/imports/api/streams"), {
  Streams(v) {
    Streams = v;
  }

}, 5);
let Customers;
module.watch(require("/imports/api/customers"), {
  Customers(v) {
    Customers = v;
  }

}, 6);
let createVirtualProxies;
module.watch(require("/imports/api/server/QPSFunctions"), {
  createVirtualProxies(v) {
    createVirtualProxies = v;
  }

}, 7);

let qlikHDRServer, senseConfig, enigmaServerConfig, qrsSrv, qrs, configCerticates, _slideGeneratorAppId;

module.watch(require("/imports/api/config.js"), {
  qlikHDRServer(v) {
    qlikHDRServer = v;
  },

  senseConfig(v) {
    senseConfig = v;
  },

  enigmaServerConfig(v) {
    enigmaServerConfig = v;
  },

  qrsSrv(v) {
    qrsSrv = v;
  },

  qrs(v) {
    qrs = v;
  },

  configCerticates(v) {
    configCerticates = v;
  },

  _slideGeneratorAppId(v) {
    _slideGeneratorAppId = v;
  }

}, 8);
let APILogs, REST_Log;
module.watch(require("/imports/api/APILogs"), {
  APILogs(v) {
    APILogs = v;
  },

  REST_Log(v) {
    REST_Log = v;
  }

}, 9);
let lodash;
module.watch(require("lodash"), {
  default(v) {
    lodash = v;
  }

}, 10);
_ = lodash; //
// ─── INSTALL NPM MODULES ────────────────────────────────────────────────────────
//

const path = require('path');

const fs = require('fs-extra');

const enigma = require('enigma.js');

var promise = require('bluebird');

var request = require('request');

var sanitize = require("sanitize-filename"); //
// ─── UPLOAD APPS FOR THE INITIAL SETUP OF QLIK SENSE ─────────────────────────
//
// UPLOAD TEMPLATES APPS FROM FOLDER, AND PUBLISH INTO THE TEMPLATES STREAM


function uploadAndPublishTemplateApps() {
  return Promise.asyncApply(() => {
    console.log('------------------------------------');
    console.log('uploadAndPublishTemplateApps');
    console.log('------------------------------------');
    var newFolder = path.join(Meteor.settings.broker.automationBaseFolder, 'apps');
    console.log('uploadAndPublishTemplateApps: Read all files in the template apps folder "' + newFolder + '" and upload them to Qlik Sense.'); //GET THE ID OF THE IMPORTANT STREAMS (streams that QRSMeteor needs)

    var everyOneStreamId = QSStream.getStreamByName(Meteor.settings.broker.qlikSense.EveryoneAppStreamName).id;
    var templateStreamId = QSStream.getStreamByName(Meteor.settings.public.TemplateAppStreamName).id;
    var APIAppsStreamID = QSStream.getStreamByName(Meteor.settings.broker.qlikSense.APIAppStreamName).id;

    try {
      check(newFolder, String);
      check(everyOneStreamId, String);
      check(templateStreamId, String);
      check(APIAppsStreamID, String);
    } catch (err) {
      console.error('You did not specify the templateAppsFrom, everyone, api apps or template stream name in the settings.json file?');
      throw new Meteor.Error('Missing Settings', 'You did not specify the everone, api apps or template stream name in the settings.json file?');
    } // LOAD ALL SENSE APPS IN FOLDER


    var appsInFolder = Promise.await(fs.readdir(newFolder)); // FOR EACH APP FOUND: PUBLISH IT    

    return Promise.await(Promise.all(appsInFolder.map(QVF => Promise.asyncApply(() => {
      try {
        //GET THE NAME OF THE APP AND CREATE A FILEPATH
        var appName = QVF.substr(0, QVF.indexOf('.'));
        var filePath = path.join(newFolder, QVF); //ONLY UPLOAD APPS IF THEY DO NOT ALREADY EXIST

        if (!getApps(appName).length) {
          //UPLOAD THE APP, GET THE APP ID BACK
          var appId = Promise.await(uploadApp(filePath, appName)); //BASED ON THE APP WE WANT TO PUBLISH IT INTO A DIFFERENT STREAM                      

          if (appName === 'SSBI') {
            //should be published in the everyone stream
            _SSBIApp = appId; // for the client side HTML/IFrames etc.                                

            publishApp(appId, appName, everyOneStreamId);
          } else if (appName === 'Sales') {
            //THIS ONE NEEDS TO BE COPIED AND PUBLISHED INTO 2 STREAMS: AS TEMPLATE AND FOR THE EVERYONE STREAM.
            publishApp(appId, appName, everyOneStreamId);
            var copiedAppId = copyApp(appId, appName);
            publishApp(copiedAppId, appName, templateStreamId);
          } else if (appName === 'Slide generator') {
            _slideGeneratorAppId = appId, publishApp(appId, appName, APIAppsStreamID);
          } else {
            //Insert into template apps stream
            publishApp(appId, appName, templateStreamId);
          }
        } else {
          console.log('App ' + appName + ' already exists in Qlik Sense');
        }

        ;
      } catch (err) {
        console.error(err);
        throw new Meteor.Error('Unable to upload the app to Qlik Sense. ', err);
      }
    }))));
  });
}

function generateStreamAndApp(customers, generationUserId) {
  return Promise.asyncApply(() => {
    console.log('METHOD called: generateStreamAndApp for the template apps as stored in the database of the fictive OEM');

    try {
      var templateApps = checkTemplateAppExists(generationUserId); //is a template app selected, and does the guid still exist in Sense? if yes, return the valid templates

      checkCustomersAreSelected(customers); //have we selected a  customer to do the generation for?

      console.log('------------------------------------');
      console.log('start generation for ', customers);
      console.log('------------------------------------');

      for (const customer of customers) {
        for (const templateApp of templateApps) {
          Promise.await(generateAppForTemplate(templateApp, customer, generationUserId));
        }
      }

      ;
    } catch (error) {
      console.error(error);
    }
  });
}

;

function setAppIDs(params) {
  console.log('------------------------------------');
  console.log('SET APP IDs');
  console.log('------------------------------------');

  try {
    console.log('check if all settings.json parameters are set...');
    check(Meteor.settings.public.slideGenerator, {
      name: String,
      stream: String,
      selectionSheet: String,
      dataObject: String,
      slideObject: String,
      virtualProxy: String
    });
    check(Meteor.settings.public.SSBI, {
      name: String,
      stream: String,
      sheetId: String,
      appId: String
    });
  } catch (err) {
    console.error('Missing parameters in your settings.json file for the SSBI or slidegenerator...', err);
  }

  try {
    var slideGeneratorApps = getApps(Meteor.settings.public.slideGenerator.name, Meteor.settings.public.slideGenerator.stream);
    var SSBIApps = getApps(Meteor.settings.public.SSBI.name, Meteor.settings.public.SSBI.stream);

    if (slideGeneratorApps.length > 1) {
      throw new Error('Can not automatically set the app ID for the slide generator. You have not one but you have multiple slide generator apps under the name ' + Meteor.settings.public.slideGenerator.name + ' in the stream ' + Meteor.settings.public.slideGenerator.stream);
    }

    if (SSBIApps.length > 1) {
      throw new Error('Can not automatically set the app ID for the Self Service BI app. You have not one but you have multiple Self Service apps under the name ' + Meteor.settings.public.SSBI.name + ' in the stream ' + Meteor.settings.public.SSBI.stream);
    }

    senseConfig.SSBIApp = SSBIApps[0].id; //

    console.log('The SSBI app id has been set to ', senseConfig.SSBIApp);
    senseConfig.slideGeneratorAppId = slideGeneratorApps[0].id;
    console.log('The slide generator app id has been set to ', senseConfig.slideGeneratorAppId);
    console.log('------------------------------------');
    console.log('YOU HAVE SUCCESFULLY STARTED QRSMETEOR, WE ARE CONNECTED TO QLIK SENSE');
    console.log('------------------------------------');
  } catch (err) {
    console.error(err);
    throw new Meteor.Error('The slideGenerator or Self Service BI app can not be found in Qlik sense, or you did not have all parameters set as defined in the the settings.json example file.', err);
  }
}

function generateAppForTemplate(templateApp, customer, generationUserId) {
  return Promise.asyncApply(() => {
    console.log('--------------------------GENERATE APPS FOR TEMPLATE'); // console.log(templateApp);
    // console.log('############## START CREATING THE TEMPLATE ' + templateApp.name + ' FOR THIS CUSTOMER: ' + customer.name + ' FOR generationUserId: ' + generationUserId);

    const call = {};
    call.action = 'Start of generation of app ' + templateApp.name + ' for ' + customer.name;
    call.createdBy = generationUserId;
    call.request = 'Start creating app ' + templateApp.name + ' for customer ' + customer.name;
    REST_Log(call, generationUserId);

    try {
      var streamId = checkStreamStatus(customer, generationUserId); //create a stream for the customer if it not already exists 

      var customerDataFolder = Promise.await(createDirectory(customer.name)); //for data like XLS/qvd specific for a customer

      if (Meteor.settings.broker.createDataConnectionPerCustomer) {
        Promise.await(createAppConnection('folder', customer.name, customerDataFolder));
      }

      var newAppId = copyApp(templateApp.id, templateApp.name, generationUserId);
      var result = reloadAppAndReplaceScriptviaEngine(newAppId, templateApp.name, streamId, customer, customerDataFolder, '', generationUserId);
      var publishedAppId = publishApp(newAppId, templateApp.name, streamId, customer.name, generationUserId); //logging only

      const call = {};
      call.action = 'Finished generation for ' + customer.name;
      call.request = templateApp.name + ' has been created and reloaded with data from the ' + customer.name + ' database';
      REST_Log(call, generationUserId);
      console.log('############## FINISHED CREATING THE TEMPLATE ' + templateApp.name + ' FOR THIS CUSTOMER: ' + customer.name);
      GeneratedResources.insert({
        'generationUserId': generationUserId,
        'customer': customer.name,
        'streamId': streamId,
        'appId': newAppId
      });
    } catch (err) {
      console.error('Failed to generate...', err);
      throw new Meteor.Error('Generation failed', 'The server has an internal error, please check the server command logs');
    }

    return;
  });
}

; //Example to demo that you can also use the Engine API to get all the apps, or reload an app, set the script etc.
//source based on loic's work: https://github.com/pouc/qlik-elastic/blob/master/app.js

function reloadAppAndReplaceScriptviaEngine(appId, newAppName, streamId, customer, customerDataFolder, scriptReplace, generationUserId) {
  return Promise.asyncApply(() => {
    console.log('--------------------------REPLACE SCRIPT AND RELOAD APP'); //set the app ID to be used in the enigma connection to the engine API

    var config = Object.assign({}, enigmaServerConfig);
    config.appId = appId;

    try {
      process.on('unhandledRejection', up => {//ignore 
      });
      check(appId, String);
      check(customer.name, String);
      check(customerDataFolder, String);
      check(generationUserId, String); //connect to the engine

      var qix = Promise.await(enigma.getService('qix', config));
      var call = {};
      call.action = 'Connect to Qlik Sense';
      call.request = 'Connect to Engine API (using Enigma.js) using an appId: ' + appId;
      call.url = gitHubLinks.replaceAndReloadApp;
      REST_Log(call, generationUserId);
      /* try {
          //create folder connection 
          console.log('create folder connection, if you see a warning below that means the connection already existed.');
          var qConnectionId = await qix.createConnection({
              "qName": customer.name,
              "qType": "folder",
              "qConnectionString": customerDataFolder
          })
          var call = {};
          call.action = 'Create data/folder connection';
          call.url = '';
          call.request = 'Link to a folder on the server where users can put files/QVD, or create a REST/ODBC/OLEDB... database connection.';
          call.response = 'created folder connection: ' + qConnectionId;
          console.log('created folder connection: ', qConnectionId);
      } catch (error) {
          console.info('No issue, existing customer so his data folder connection already exists', error);
      } */
      //get the script

      var script = Promise.await(qix.getScript());
      var call = {};
      call.action = 'Get data load script';
      call.url = gitHubLinks.getScript;
      call.request = 'We extracted the following load script from the app';
      call.response = script;
      REST_Log(call, generationUserId); //set the new script

      var call = {};
      call.response = Promise.await(qix.setScript(replaceScript(script))); //we now just include the old script in this app

      call.action = 'Insert customer specific data load script for its database';
      call.url = gitHubLinks.setScript;
      call.request = 'The script of the app has been replaced with a customer specific one. Normally you would replace the database connection for each customer. Or you can insert a customer specific script to enable customization per customer. ';
      REST_Log(call, generationUserId); //reload the app

      var call = {};
      call.response = Promise.await(qix.doReload());
      call.action = 'Reload the app';
      call.url = gitHubLinks.reloadApp;
      call.request = 'Has the app been reloaded with customer specific data?';
      REST_Log(call, generationUserId); //save the app

      var call = {};
      call.action = 'Save app';
      call.url = gitHubLinks.saveApp;
      call.request = 'App with GUID ' + appId + ' has been saved to disk';
      REST_Log(call, generationUserId);
      Promise.await(qix.doSave());
      REST_Log(call, generationUserId);
      process.on('unhandledRejection', up => {
        throw up;
      });
    } catch (error) {
      console.error('error in reloadAppAndReplaceScriptviaEngine via Enigma.JS, did you used the correct schema definition in the settings.json file?', error);
    }

    function replaceScript(script) {
      //var scriptMarker = '§dummyDatabaseString§';
      // if you want to replace the database connection per customer use the script below.
      //return doc.setScript(script.replace(scriptMarker, scriptReplace)).then(function (result) {
      //you can also change the sense database connection: https://github.com/mindspank/qsocks/blob/master/examples/App/create-dataconnection.js
      return script;
    }
  });
}

function createAppConnections() {
  return Promise.asyncApply(() => {
    console.log('------------------------------------');
    console.log('create app connections');
    console.log('------------------------------------'); //create the default demo import folder where all the csv and qvf files are...

    var senseDemoMaterials = path.join(Meteor.absolutePath, 'Sense Demo materials');
    console.log('senseDemoMaterials', senseDemoMaterials);
    Promise.await(createAppConnection('folder', 'Import demo', senseDemoMaterials));

    for (let c of Meteor.settings.broker.dataConnections) {
      Promise.await(createAppConnection(c.type, c.name, c.connectionString));
    }
  });
}

function createAppConnection(type, name, path) {
  return Promise.asyncApply(() => {
    //set the app ID to be used in the enigma connection to the engine API
    var config = Object.assign({}, enigmaServerConfig);
    config.appId = getApps('sales', 'Everyone')[0].id;
    console.log('createAppConnection: ' + type + ' ' + name + ' ' + path + ' using the sales app in the everyone stream to create the connection: ' + config.appId);

    try {
      check(type, String);
      check(path, String);
      check(name, String);
      check(config.appId, String);
    } catch (error) {
      console.error('Missing parameters to create a data connection', error);
    }

    try {
      //connect to the engine
      var qix = Promise.await(enigma.getService('qix', config)); //create folder connection 

      console.log('create folder connection, if you see a warning below that means the connection already existed.');
      var qConnectionId = Promise.await(qix.createConnection({
        "qName": name,
        "qType": type,
        "qConnectionString": path
      }));
      console.log('created folder connection: ', qConnectionId);
    } catch (error) {
      console.error('Failed to create data connection', error);
    }
  });
}

function deleteDirectoryAndDataConnection(customerName) {
  console.log('deleteDirectoryAndDataConnection'); //@TODO a bit dangerous, so better to do by hand. Make sure you can't delete root folder... 
  // https://stackoverflow.com/questions/18052762/remove-directory-which-is-not-empty
}

function createDirectory(customerName) {
  return Promise.asyncApply(() => {
    console.log('createDirectory ', customerName);

    try {
      check(customerName, String);
      var filename = sanitize(customerName);
      const dir = path.join(Meteor.settings.broker.customerDataDir, customerName);
      console.log('Meteor.settings.broker.customerDataDir', dir);
      Promise.await(fs.ensureDir(dir));
      return dir;
    } catch (error) {
      throw new Meteor.Error('Failed to create directory for ', customerName);
    }
  });
}

function checkCustomersAreSelected(customers) {
  if (!customers.length) {
    // = 0
    throw new Meteor.Error('No customers', 'user has not specified at least one customer for which an app can be generated');
  }
}

; // CHECK IF SELECTED TEMPLATE APP EXISTS IN QLIK SENSE
//These are the apps that the OEM partner has in his database, but do they still exists on the qliks sense side?

function checkTemplateAppExists(generationUserId) {
  console.log('------------------------------------');
  console.log('checkTemplateAppExists for userID ', generationUserId);
  console.log('------------------------------------');
  var templateApps = TemplateApps.find({
    'generationUserId': Meteor.userId()
  }).fetch();
  return templateApps; // console.log('templateApps found: ', templateApps)
  // if (templateApps.length === 0) { //user has not specified a template
  //     throw new Meteor.Error('No Template', 'user has not specified a template for which apps can be generated');
  // }
  // currentAppsInSense = getApps();
  // if (!currentAppsInSense) {
  //     throw new Meteor.Error('No apps have been received from Qlik Sense. Therefore you have selected a Qlik Sense App: ' + templateApp.name + ' with guid: ' + templateApp.id + ' which does not exist in Sense anymore. Have you deleted the template in Sense?');
  // }
  // _.each(templateApps, function(templateApp) {
  //     console.log('templateApp in MongoDB: ', templateApp)
  //     var templateFound = _.some(currentAppsInSense, ['id', templateApp.id]);
  //     if (!templateFound) {
  //         console.log('------------------------------------');
  //         console.log('!! template app exists in mongoDB but not in Qlik Sense');
  //         console.log('------------------------------------');
  //         throw new Meteor.Error('You have selected a Qlik Sense App: ' + templateApp.name + ' with guid: ' + templateApp.id + ' which does not exist in Sense anymore. Have you deleted the template in Sense?');
  //     } else {
  //         console.log('checkTemplateAppExists: True, template guid exist: ', templateApp.id);
  //     }
  // })
  // return templateApps;
}

; //
// ─── UPLOAD APP ─────────────────────────────────────────────────────────────────
//

function uploadApp(filePath, appName) {
  return Promise.asyncApply(() => {
    console.log('Upload app: ' + appName + ' from path: ' + filePath + ' via header authentication server: ' + qlikHDRServer);
    return Promise.await(new Promise(function (resolve, reject) {
      var formData = {
        my_file: fs.createReadStream(filePath)
      };

      try {
        request.post({
          url: qlikHDRServer + '/qrs/app/upload?name=' + appName + '&xrfkey=' + senseConfig.xrfkey,
          headers: {
            'Content-Type': 'application/vnd.qlik.sense.app',
            'hdr-usr': senseConfig.headerValue,
            'X-Qlik-xrfkey': senseConfig.xrfkey
          },
          formData: formData
        }, function (error, res, body) {
          if (!error) {
            var appId = JSON.parse(body).id;
            console.log('Uploaded "' + appName + '.qvf" to Qlik Sense and got appID: ' + appId);
            resolve(appId);
          } else {
            console.error("Failed to upload app" + appName, error);
            reject(error);
          }
        });
      } catch (error) {
        console.error('failed to upload app', error);
      }
    }));
  });
} //
// ─── COPYAPP ────────────────────────────────────────────────────────────────────
//


function copyApp(guid, name, generationUserId) {
  check(guid, String);
  check(name, String); // console.log('QRS Functions copy App, copy the app id: ' + guid + ' to app with name: ', name);

  const call = {};

  try {
    call.request = qrsSrv + '/qrs/app/' + guid + '/copy';
    call.response = HTTP.post(call.request, {
      'npmRequestOptions': configCerticates,
      params: {
        'xrfkey': senseConfig.xrfkey,
        "name": name
      },
      data: {}
    });
    REST_Log(call, generationUserId);
    var newGuid = call.response.data.id; // console.log('Step 2: the new app id is: ', newGuid);
    //addTag('App', newGuid);

    return newGuid;
  } catch (err) {
    console.error(err);
    call.action = 'Copy app FAILED';
    call.response = err.message;
    REST_Log(call, generationUserId);
    throw new Meteor.Error('Copy app for selected customers failed', err.message);
  }
}

; //
// ─── CHECKSTREAMSTATUS ──────────────────────────────────────────────────────────
//

function checkStreamStatus(customer, generationUserId) {
  console.log('checkStreamStatus for: ' + customer.name); //first update the list of streams we have from Sense. (we keep a private copy, which should reflect the state of Sense)

  Meteor.call('updateLocalSenseCopyStreams');
  var stream = Streams.findOne({
    name: customer.name
  }); //Find the stream for the name of the customer in Mongo, and get his Id from the returned object

  var streamId = '';

  if (stream) {
    console.log('Stream already exists: ', stream.id);
    streamId = stream.id;
  } else {
    console.log('No stream for customer exist, so create one: ' + customer.name);
    streamId = QSStream.createStream(customer.name, generationUserId).id;
    console.log('Step 1: the (new) stream ID for ' + customer.name + ' is: ', streamId);
  }

  return streamId;
} //
// ─── GETAPPS ────────────────────────────────────────────────────────────────────
//    


function getApps(name, stream) {
  console.log('getApps ' + name + ' with stream: ' + stream);
  var path = '/qrs/app/full'; //if a name/stream is provided only search the apps with this name

  if (name) {
    path += "?filter=Name eq '" + name + "'";

    if (stream) {
      path += " and stream.name eq '" + stream + "'";
      console.log('getApps(name: ' + name + ' and stream ' + stream + ' via API path: ' + path);
    }
  } else {
    console.log('getApps via API path: ' + path);
  }

  var call = {
    action: 'Get list of apps',
    request: path
  }; // REST_Log(call,generationUserId);

  try {
    return qrs.get(call.request);
  } catch (error) {
    console.error('Error while getting the apps via the QRS API: we can not connect to Qlik Sense');
    console.log(error);
  }
}

; //
// ─── DELETEAPP ──────────────────────────────────────────────────────────────────
//

function deleteApp(guid, generationUserId = 'Not defined') {
  console.log('QRSApp deleteApp: ', guid);

  try {
    const call = {};
    call.request = qrsSrv + '/qrs/app/' + guid;
    call.response = HTTP.del(call.request, {
      params: {
        xrfkey: senseConfig.xrfkey
      },
      npmRequestOptions: configCerticates,
      data: {}
    }); // Meteor.call('updateLocalSenseCopy');
    //logging only

    call.action = 'Delete app';
    call.url = gitHubLinks.deleteApp;
    call.response = call.response;
    REST_Log(call, generationUserId);
    return call.response;
  } catch (err) {
    console.error(err);
    throw new Meteor.Error('App delete failed', err.message);
  }
}

; //
// ─── PUBLISHAPP ─────────────────────────────────────────────────────────────────
//

function publishApp(appGuid, appName, streamId, customerName, generationUserId) {
  console.log('Publish app: ' + appName + ' to stream: ' + streamId);
  check(appGuid, String);
  check(appName, String);
  check(streamId, String);

  try {
    const call = {};
    call.request = qrsSrv + '/qrs/app/' + appGuid + '/publish?name=' + appName + '&stream=' + streamId;
    call.response = HTTP.put(call.request, {
      params: {
        xrfkey: senseConfig.xrfkey
      },
      npmRequestOptions: configCerticates,
      data: {}
    }); //logging into database

    call.action = 'Publish app';
    call.url = gitHubLinks.publishApp;
    REST_Log(call, generationUserId);
    return call.response;
  } catch (err) {
    console.error(err); // // IF APP ALREADY EXISTED TRY TO PUBLISH OVERWRITE IT (REPLACE)
    // if(err.response.statusCode == 400){
    //     replaceApp()
    // }
    // console.error('statusCode:', err.response.statusCode);
    // console.info('Try to PUBLISH OVERWRITE THE APP, SINCE IT WAS ALREADY PUBLISHED');

    throw new Meteor.Error('Publication of app ' + appName + ' for customer ' + customerName + ' failed: ', err.message);
  }
}

; // REPLACE APP 
// export function replaceApp(targetApp, replaceByApp, generationUserId) {
//     console.log('Function: Replace app: ' + targetApp + ' by app ' + targetApp);
//     check(appGuid, String);
//     check(replaceByApp, String);
//     try {
//         const result = HTTP.put(qlikHDRServer + '/qrs/app/' + replaceByApp + '/replace?app=' + targetApp + '&xrfkey=' + senseConfig.xrfkey, {
//             headers: {
//                 'hdr-usr': senseConfig.headerValue,
//                 'X-Qlik-xrfkey': senseConfig.xrfkey
//             }
//         });
//         //logging into database
//         const call = {};
//         call.action = 'Replace app';
//         call.request = 'HTTP.put(' + qlikHDRServer + '/qrs/app/' + replaceByApp + '/replace?app=' + targetApp + '&xrfkey=' + senseConfig.xrfkey;
//         call.response = result;
//         call.url = 'http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-App-Replace.htm';
//         REST_Log(call, generationUserId);
//         return result;
//     } catch (err) {
//         console.error(err);
//         throw new Meteor.Error('Publication of app ' + appName + ' for customer ' + customerName + ' failed: ', err.message);
//     }
// };
// function createTag(name) {
//     check(name, String);
//     // console.log('QRS Functions Appp, create a tag: ' + name);
//     try {
//         const result = HTTP.post(qlikHDRServer + '/qrs/Tag', {
//             headers: authHeaders,
//             params: {
//                 'xrfkey': senseConfig.xrfkey
//             },
//             data: {
//                 "name": name
//             }
//         })
//         //logging only
//         const call = {};
//         call.action = 'create Tag';
//         call.request = 'HTTP.get(http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/tag';
//         call.response = result;
//         REST_Log(call, generationUserId);
//         return result;
//     } catch (err) {
//         console.error(err);
//         throw new Meteor.Error('Tag: ' + name + ' create failed ', err.message);
//     }
// };
// function addTag(type, guid, tagName) {
//     check(type, String);
//     check(guid, String);
//     //check if tag with tagName already exists
//     var selectionId = createSelection(type, guid);
//     addTagViaSyntheticToType('App', selectionId, tagGuid)
// }
// function createSelection(type, guid) {
//     check(type, String);
//     check(guid, String);
//     console.log('QRS Functions APP, create selection for type: ', type + ' ' + guid);
//     try {
//         const result = HTTP.post(qlikHDRServer + '/qrs/Selection', {
//             headers: authHeaders,
//             params: {
//                 'xrfkey': senseConfig.xrfkey
//             },
//             data: {
//                 items: [{
//                     type: type,
//                     objectID: guid
//                 }]
//             }
//         })
//         console.log('the result of selection for type: ', type + ' ' + guid);
//         console.log(result);
//         return result.id;
//     } catch (err) {
//         console.error(err);
//         throw new Meteor.Error('Selection: ' + type + ' failed for guid ' + guid, err.message);
//     }
// };
// function deleteSelection(selectionId) {
//     check(selectionId, String);
//     console.log('QRS Functions APP, deleteSelection selection for selectionId: ', selectionId);
//     try {
//         const result = HTTP.delete(qlikHDRServer + '/qrs/Selection/' + selectionId, {
//             headers: authHeaders,
//             params: {
//                 'xrfkey': senseConfig.xrfkey
//             }
//         })
//         console.log(result);
//         return result.id;
//     } catch (err) {
//         console.error(err);
//         throw new Meteor.Error('Selection delete failed: ', err.message);
//     }
// };
// function buildModDate() {
//     var d = new Date();
//     return d.toISOString();
// }
// function addTagViaSyntheticToType(type, selectionId, tagGuid) {
//     check(type, String);
//     check(guid, String);
//     console.log('QRS Functions Appp, Update all entities of a specific type: ' + type + ' in the selection set identified by {id} ' + selectionId + ' based on an existing synthetic object. : ');
//     try {
//         const result = HTTP.put(qlikHDRServer + '/qrs/Selection/' + selectionId + '/' + type + '/synthetic', {
//             headers: authHeaders,
//             params: {
//                 'xrfkey': senseConfig.xrfkey
//             },
//             data: {
//                 "latestModifiedDate": buildModDate(),
//                 "properties": [{
//                     "name": "refList_Tag",
//                     "value": {
//                         "added": [tagGuid]
//                     },
//                     "valueIsModified": true
//                 }],
//                 "type": type
//             }
//         })
//         console.log('the result of selection for type: ', type + ' ' + guid);
//         console.log(result);
//         return result;
//     } catch (err) {
//         console.error(err);
//         throw new Meteor.Error('Selection: ' + type + ' failed for guid ' + guid, err.message);
//     }
// };
// async function uploadPublishTemplateApps() {
//     //check if template apps have been uploaded and published in the templates stream
//     // if (true) { // (!Apps.find({ "stream.name": "Templates" }).count()) {
//     console.warn('no template apps found, so upload from the templates dir.');
//     var folder = Meteor.settings.private.templateAppsFrom;
//     // var folder = await copyTemplatesToQRSFolder();
//     console.log('apps folder', folder);
//     uploadAndPublishApps(folder);
//     // } else {}
// }
// //upload and publish all apps found in the folder to the templates stream
// async function copyTemplatesToQRSFolder() {
//     var newFolder = Meteor.settings.private.templateAppsTo + '\\' + process.env.USERDOMAIN + '\\' + process.env.USERNAME;
//     try {
//         await fs.copy(Meteor.settings.private.templateAppsFrom, newFolder, {
//             overwrite: true
//         }); //"QLIK-AB0Q2URN5T\\Qlikexternal",
//         return newFolder
//     } catch (err) {
//         console.error('error copy Templates from ' + Meteor.settings.private.templateAppsFrom + ' To QRSFolder ' + Meteor.settings.private.templateAppsDir, err);
//     }
// }
// For a system service account, the app must be in the %ProgramData%\Qlik\Sense\Repository\DefaultApps folder.
// For any other account, the app must be in the %ProgramData%\Qlik\Sense\Apps\<login domain>\<login user> folder.
//so you have to copy your apps there first. in a fresh sense installation.

function importApp(fileName, name, generationUserId = 'no user set') {// check(fileName, String);
  // check(name, String);
  // console.log('QRS Functions import App, with name ' + name + ', with fileName: ', fileName);
  // try {
  //     const call = {};
  //     call.action = 'Import app';
  //     call.url = 'http://help.qlik.com/en-US/sense-developer/3.2/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-App-Import-App.htm'
  //     call.request = qlikHDRServer + '/qrs/app/import?keepData=true&name=' + name + '&xrfkey=' + senseConfig.xrfkey; //using header auth.
  //     call.response = HTTP.post(call.request, {
  //         headers: {
  //             'hdr-usr': senseConfig.headerValue,
  //             'X-Qlik-xrfkey': senseConfig.xrfkey
  //         },
  //         data: '"Sales.qvf"'
  //     });
  //     REST_Log(call, generationUserId);
  //     var newGuid = call.response.data.id;
  //     return newGuid;
  // } catch (err) {
  //     console.error(err);
  //     const call = {};
  //     call.action = 'Import app FAILED';
  //     call.response = err.message;
  //     REST_Log(call, generationUserId);
  //     throw new Meteor.Error('Import app failed', err.message);
  // }
}

; //https://www.npmjs.com/package/request#forms
// function uploadApp(filePath, fileSize, appName) {
//     console.log('QRS Functions upload App, with name ' + appName + ', with fileSize: ', fileSize + ' and filePath ' + filePath);
//     var formData = {
//         my_file: fs.createReadStream(filePath)
//     };
//     request.post({
//         url: qlikHDRServer + '/qrs/app/upload?name=' + appName + '&xrfkey=' + senseConfig.xrfkey,
//         headers: {
//             'Content-Type': 'application/vnd.qlik.sense.app',
//             'hdr-usr': senseConfig.headerValue,
//             'X-Qlik-xrfkey': senseConfig.xrfkey
//         },
//         formData: formData
//     }, function optionalCallback(err, httpResponse, body) {
//         if (err) {
//             return console.error('upload failed:', err);
//         }
//         console.log('Upload successful!  Server responded with:', body);
//     });
// }
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"QRSFunctionsCustomProperties.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/server/QRSFunctionsCustomProperties.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  createCustomProperty: () => createCustomProperty,
  upsertCustomPropertyByName: () => upsertCustomPropertyByName,
  deleteCustomProperty: () => deleteCustomProperty,
  getCustomProperties: () => getCustomProperties
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let myQRS;
module.watch(require("/imports/api/server/QRSAPI"), {
  myQRS(v) {
    myQRS = v;
  }

}, 1);
let senseConfig, qrs;
module.watch(require("/imports/api/config.js"), {
  senseConfig(v) {
    senseConfig = v;
  },

  qrs(v) {
    qrs = v;
  }

}, 2);

var fs = require('fs-extra');

const path = require('path');

function createCustomProperty(name, newProperty) {
  console.log('------------------------------------');
  console.log('createCustomProperty', name + ' ' + newProperty.toString());
  console.log('------------------------------------');

  try {
    check(name, String);
    check(newProperty, Object);
  } catch (err) {
    throw new Meteor.Error('createCustomProperty: Missing values', 'You did not specify a name or choice values for the custom property');
  }

  var result = qrs.post('/qrs/CustomPropertyDefinition', null, newProperty);
  console.log('result of create custom property: ', result);
}

function upsertCustomPropertyByName(name, choiceValues) {
  try {
    check(name, String);
    check(choiceValues, Array);
  } catch (err) {
    throw new Meteor.Error('upsertCustomPropertyByName: Missing values', 'You did not specify a name or update object for the custom property');
  }

  try {
    var newProperty = {
      "name": name,
      "valueType": "Text",
      "objectTypes": ["App", "ContentLibrary", "DataConnection", "ReloadTask", "Stream", "User"],
      "choiceValues": choiceValues
    };
    var existingProperty = getCustomProperties(name)[0];

    if (existingProperty) {
      //update it
      var updatedProperty = Object.assign(existingProperty, newProperty);
      var result = qrs.put('/qrs/CustomPropertyDefinition/' + updatedProperty.id, null, updatedProperty); //you can only update when you supply the original modified date, otherwise you get a 409 error. 

      console.log('Custom property update: ', result);
    } else {
      //create a new one
      createCustomProperty(name, newProperty);
    }
  } catch (error) {
    console.log('error upserting custom property', error);
  }
}

function deleteCustomProperty(name) {
  console.log('deleteCustomProperty(name)', name);
  var customProperty = getCustomProperties(name)[0];

  if (customProperty) {
    var result = qrs.del('/qrs/CustomPropertyDefinition/' + customProperty.id);
    console.log('result after delete', result);
  }
}

function getCustomProperties(name) {
  var filter = name ? {
    filter: "Name eq '" + name + "'"
  } : null;
  var customProperties = qrs.get('/qrs/CustomPropertyDefinition/full', filter);
  var file = path.join(Meteor.settings.broker.automationBaseFolder, 'customProperties', 'export', 'ExtractedCustomProperties.json'); // SAVE FILE TO DISK

  fs.outputFile(file, JSON.stringify(customProperties, null, 2), 'utf-8');
  return customProperties;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"QRSFunctionsExtension.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/server/QRSFunctionsExtension.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  uploadExtensions: () => uploadExtensions
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let myQRS;
module.watch(require("/imports/api/server/QRSAPI"), {
  myQRS(v) {
    myQRS = v;
  }

}, 1);
let qlikHDRServer, senseConfig;
module.watch(require("/imports/api/config.js"), {
  qlikHDRServer(v) {
    qlikHDRServer = v;
  },

  senseConfig(v) {
    senseConfig = v;
  }

}, 2);

//
// ─── INSTALL NPM MODULES ────────────────────────────────────────────────────────
//
const fs = require('fs-extra');

const path = require('path');

const enigma = require('enigma.js');

var promise = require('bluebird');

var request = require('request');

var qrs = new myQRS(); // export async function automaticUploadExtensions() {
//     console.log('Automatically download the extensions from Github and upload to Qlik Sense');
//     var url = 'https://github.com/kai/qlik-sense-timeline.git';
//     var req = request.get(url);
//     console.log('req', req)
// }

function uploadExtensions() {
  return Promise.asyncApply(() => {
    console.log('--------------------------UPLOAD EXTENSIONS'); // LOAD ALL EXTENSIONS IN FOLDER

    var extensionsFolder = '';

    try {
      extensionsFolder = path.join(Meteor.settings.broker.automationBaseFolder, 'extensions');
      console.log('extensionsFolder', extensionsFolder);
      var extensions = Promise.await(fs.readdir(extensionsFolder));
    } catch (err) {
      throw error('error loading all extensions in folder.', err);
    } // FOR EACH EXTENSION FOUND, UPLOAD IT    


    Promise.await(Promise.all(extensions.map(extension => Promise.asyncApply(() => {
      console.log('Current extension', extension);

      try {
        //CREATE A FILEPATH          
        var filePath = path.join(extensionsFolder, extension); //UPLOAD THE APP, GET THE APP ID BACK

        var result = Promise.await(uploadExtension('', filePath));
      } catch (err) {
        console.error(err);
        throw new Meteor.Error('Unable to upload the app to Qlik Sense. ', err);
      }
    }))));
  });
}

function uploadExtension(password, filePath) {
  return Promise.asyncApply(() => {
    console.log('uploadExtension: try to upload extension from path: ' + filePath);
    var formData = {
      my_file: fs.createReadStream(filePath)
    }; // qrs.post('/qrs/extension/upload?pwd=' + password, data)

    return Promise.await(new Promise(function (resolve, reject) {
      request.post({
        url: qlikHDRServer + '/qrs/extension/upload?&xrfkey=' + senseConfig.xrfkey,
        //removed password parameter, assume blank
        headers: {
          'hdr-usr': senseConfig.headerValue,
          'X-Qlik-xrfkey': senseConfig.xrfkey
        },
        formData: formData
      }, function (error, res, body) {
        if (!error) {
          try {
            var id = JSON.parse(body).id;
            console.log('Uploaded "' + path.basename(filePath) + ' to Qlik Sense.'); //
          } catch (err) {
            console.log('Qlik Sense reported: ', body);
          }

          resolve();
        } else {
          reject(error);
        }
      });
    }));
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"QRSFunctionsLicense.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/server/QRSFunctionsLicense.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  getLicense: () => getLicense,
  insertLicense: () => insertLicense,
  insertUserAccessRule: () => insertUserAccessRule,
  getSystemRules: () => getSystemRules,
  saveSystemRules: () => saveSystemRules
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let myQRS;
module.watch(require("/imports/api/server/QRSAPI"), {
  myQRS(v) {
    myQRS = v;
  }

}, 1);
let senseConfig, qrs;
module.watch(require("/imports/api/config.js"), {
  senseConfig(v) {
    senseConfig = v;
  },

  qrs(v) {
    qrs = v;
  }

}, 2);

var fs = require('fs-extra');

const path = require('path'); //
// ─── IMPORT CONFIG FOR QLIK SENSE QRS AND ENGINE API ────────────────────────────
//


var demoUserAccessRule = "SAAS DEMO - License rule to grant user access"; // http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-License-Add.htm //

function getLicense() {
  var lic = qrs.get('/qrs/license');
  return lic;
}

function insertLicense() {
  console.log('------------------------------------');
  console.log('INSERT LICENSE');
  console.log('------------------------------------');
  var existingLicense = qrs.get('/qrs/license');
  var newLicense = Meteor.settings.private.license;

  try {
    console.log('check if all settings.json parameters are set...');
    check(Meteor.settings.private.license, {
      serial: String,
      name: String,
      organization: String
    });
    check(Meteor.settings.private.LicenseControlNumber, Number);
  } catch (err) {
    console.error('Missing parameters in your settings.json file for your Qlik Sense license', err);
  }

  if (!existingLicense) {
    console.log('No existing license present, therefore inserted license into Qlik Sense.'); // try {
    //     console.log('Update the existing license');
    //     newLicense.id = existingLicense.id;
    //     var response = qrs.del('/qrs/license/' + existingLicense.id);
    //     // var response = qrs.put('/qrs/license/' + newLicense.id, newLicense, { control: Meteor.settings.private.LicenseControlNumber });
    //     // console.error('Stop license insertion, license for ' + lic.organization + ' is already included: ', lic.serial);
    //     // throw Error('You are trying to insert a license while the Qlik Sense is already licensed, please remove the existing one in the QMC');
    // } catch (err) {
    //     // lic did not already exist.
    // }

    var response = qrs.post('/qrs/license', {
      control: Meteor.settings.private.LicenseControlNumber
    }, newLicense);
  }
}

function insertUserAccessRule() {
  console.log('insert UserAccess Rule for all users');
  var licenseRule = {
    "name": demoUserAccessRule,
    "category": "License",
    "rule": "((user.name like \"*\"))",
    "type": "Custom",
    "privileges": ["create", "read", "update"],
    "resourceFilter": "License.UserAccessGroup_507c9aa5-8812-44d9-ade8-32809785eecf",
    "actions": 1,
    "ruleContext": "QlikSenseOnly",
    "disabled": false,
    "comment": "Rule to set up automatic user access for each user that has received a ticket via your SaaS platform",
    "disabledActions": ["useaccesstype"]
  };
  var ruleExist = getSystemRules(demoUserAccessRule);

  if (typeof ruleExist[0] == 'undefined' || ruleExist.length === 0) {
    console.log('Create a new user license rule since it did not exist.');
    var response = qrs.post('/qrs/SystemRule', null, licenseRule);
  }
}

function getSystemRules(name) {
  console.log('Get system rules with name: ' + name);
  var filter = name ? {
    filter: "Name eq '" + name + "'"
  } : null;
  var rules = qrs.get('/qrs/SystemRule/full', filter);
  var file = path.join(Meteor.settings.broker.automationBaseFolder, 'securityrules', 'export', 'ExtractedSystemRules.json'); // SAVE FILE TO DISK

  fs.outputFile(file, JSON.stringify(rules, null, 2), 'utf-8');
  return rules;
}

function saveSystemRules() {
  var file = path.join(Meteor.settings.broker.automationBaseFolder, 'securityrules', 'export', 'ExtractedSystemRules.json');
  console.log('------------------------------------');
  console.log('Save all system rules in ' + file);
  console.log('------------------------------------');
  var rules = qrs.get('/qrs/SystemRule');

  try {
    // SAVE FILE TO DISK
    fs.outputFile(file, JSON.stringify(rules, null, 2), 'utf-8');
  } catch (error) {
    console.error('unable to save systemrules, does the directory exist? Check your automationBaseFolder in your settings.json file, ', error);
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"QRSFunctionsStream.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/server/QRSFunctionsStream.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  initSenseStreams: () => initSenseStreams,
  deleteStream: () => deleteStream,
  getStreamByName: () => getStreamByName,
  getStreams: () => getStreams,
  createStream: () => createStream
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let GeneratedResources;
module.watch(require("/imports/api/apps.js"), {
  GeneratedResources(v) {
    GeneratedResources = v;
  }

}, 1);
let gitHubLinks;
module.watch(require("/imports/ui/UIHelpers"), {
  gitHubLinks(v) {
    gitHubLinks = v;
  }

}, 2);
let senseConfig, authHeaders, qrsSrv, qrs, configCerticates;
module.watch(require("/imports/api/config.js"), {
  senseConfig(v) {
    senseConfig = v;
  },

  authHeaders(v) {
    authHeaders = v;
  },

  qrsSrv(v) {
    qrsSrv = v;
  },

  qrs(v) {
    qrs = v;
  },

  configCerticates(v) {
    configCerticates = v;
  }

}, 3);
let REST_Log;
module.watch(require("/imports/api/APILogs"), {
  REST_Log(v) {
    REST_Log = v;
  }

}, 4);
const qlikServer = 'http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy; //
// ─── CREATE STREAMS FOR THE INITIAL SETUP OF QLIK SENSE ─────────────────────────
//

function initSenseStreams() {
  console.log('------------------------------------');
  console.log('Create initial streams');
  console.log('------------------------------------');

  for (const streamName of Meteor.settings.broker.qlikSense.StreamsToCreateAutomatically) {
    try {
      console.log('Try to create stream: ' + streamName + ' if it not already exists');

      if (!getStreamByName(streamName)) {
        createStream(streamName);
      }
    } catch (err) {
      console.log(err);
    }
  }
}

function deleteStream(guid, generationUserId) {
  console.log('deleteStream: ', guid);

  try {
    var request = qrsSrv + '/qrs/stream/' + guid;
    var response = HTTP.del(request, {
      'npmRequestOptions': configCerticates
    }); // Logging

    const call = {};
    call.action = 'Delete stream';
    call.request = "HTTP.del(" + qlikServer + '/qrs/stream/' + guid + '?xrfkey=' + senseConfig.xrfkey;
    call.response = response;
    REST_Log(call, generationUserId);
    Meteor.call('updateLocalSenseCopy');
    return response;
  } catch (err) {// console.error(err);
    // throw new Meteor.Error('Delete stream failed', err.message);
  }
}

; //
// ─── GET STREAM BY NAME ────────────────────────────────────────────────────────────
//

function getStreamByName(name) {
  try {
    var request = qrsSrv + "/qrs/stream/full?filter=Name eq '" + name + "'";
    console.log('getStreamByName request', request);
    var response = HTTP.get(request, {
      params: {
        xrfkey: senseConfig.xrfkey
      },
      npmRequestOptions: configCerticates,
      data: {}
    });
    return response.data[0];
  } catch (err) {
    console.error(err);
    throw Error('get streamByName failed', err.message);
  }
}

function getStreams() {
  try {
    const call = {};
    call.action = 'Get list of streams';
    call.request = qrsSrv + '/qrs/stream/full';
    call.response = HTTP.get(call.request, {
      params: {
        xrfkey: senseConfig.xrfkey
      },
      npmRequestOptions: configCerticates,
      data: {}
    }); // REST_Log(call);        

    return call.response.data;
  } catch (err) {
    console.error(err);
    throw new Meteor.Error('getStreams failed', err.message);
  }
}

; //
// ─── CREATE STREAM ──────────────────────────────────────────────────────────────
//

function createStream(name, generationUserId) {
  console.log('QRS Functions Stream, create the stream with name', name);

  try {
    check(name, String);
    var response = qrs.post('/qrs/stream', null, {
      name: name
    }); // Meteor.call('updateLocalSenseCopy');
    //logging

    const call = {
      action: 'Create stream',
      url: gitHubLinks.createStream,
      request: "HTTP.post(qlikServer + '/qrs/stream', { headers: " + JSON.stringify(authHeaders) + ", params: { 'xrfkey': " + senseConfig.xrfkey + "}, data: { name: " + name + "}}) --> USE OF HEADER AUTH ONLY FOR DEMO/REVERSE PROXY PURPOSES",
      response: response
    };
    REST_Log(call, generationUserId);
    console.log('Create stream call.response;', call.response);
    return call.response;
  } catch (err) {
    console.error(err);
    throw new Meteor.Error('Create stream failed ', err.message);
  }
}

;
Meteor.methods({
  deleteStream(guid) {
    check(guid, String); //logging only

    const call = {};
    call.action = 'Delete stream';
    call.request = 'Delete stream: ' + guid;
    REST_Log(call);
    const id = deleteStream(guid, Meteor.userId());
    Meteor.call('updateLocalSenseCopy');
    return id;
  },

  createStream(name) {
    const streamId = createStream(name);
    Meteor.call('updateLocalSenseCopy'); //store in the database that the user generated something, so we can later on remove it.

    GeneratedResources.insert({
      'generationUserId': Meteor.userId(),
      'customer': null,
      'streamId': streamId.data.id,
      'appId': null
    });
    return streamId;
  },

  getStreams() {
    return getStreams();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"QRSFunctionsSystemRules.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/server/QRSFunctionsSystemRules.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  getSecurityRules: () => getSecurityRules,
  disableDefaultSecurityRules: () => disableDefaultSecurityRules,
  createSecurityRules: () => createSecurityRules
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let qrs, validateJSON;
module.watch(require("/imports/api/config.js"), {
  qrs(v) {
    qrs = v;
  },

  validateJSON(v) {
    validateJSON = v;
  }

}, 1);
let QSLic;
module.watch(require("/imports/api/server/QRSFunctionsLicense"), {
  "*"(v) {
    QSLic = v;
  }

}, 2);

// import { APILogs } from '/imports/api/APILogs';
var fs = require('fs-extra');

const path = require('path');

function getSecurityRules(name) {
  return QSLic.getSystemRules(name);
}

function disableDefaultSecurityRules() {
  console.log('------------------------------------');
  console.log('disable Default SecurityRules');
  console.log('------------------------------------');

  for (let ruleName of Meteor.settings.security.rulesToDisable) {
    console.log('From Meteor.settings.security.rulesToDisable, Disable security rule: ', ruleName);
    var ruleDefinition = QSLic.getSystemRules(ruleName)[0];

    if (ruleDefinition) {
      ruleDefinition.disabled = true;
      var response = qrs.put('/qrs/SystemRule/' + ruleDefinition.id, null, ruleDefinition);
    } else {
      console.warn('The system rule does not exist in Sense: ' + ruleName);
    }
  }

  ;
}

function createSecurityRules() {
  return Promise.asyncApply(() => {
    console.log('------------------------------------');
    console.log('create security rules in Qlik Sense based on import file');
    console.log('------------------------------------');
    var file = path.join(Meteor.settings.broker.automationBaseFolder, 'securityrules', 'import', 'securityRuleSettings.json'); // READ THE FILE 

    var securityRules = Promise.await(fs.readJson(file));

    try {
      validateJSON(securityRules);
    } catch (err) {
      throw new Error('Cant read the security rule definitions file: ' + file);
    }

    securityRules.forEach(function (rule) {
      //check if the rule already exists in Sense
      if (!QSLic.getSystemRules(rule.name).length) {
        //if not exist, create it
        var response = qrs.post('/qrs/SystemRule', null, rule);
      } else {
        console.log('Security rule "' + rule.name + '" already existed');
      }
    });
  });
}

function stringToJSON(myString) {
  var myJSONString = JSON.stringify(myString);
  var myEscapedJSONString = myJSONString.replace(/\\n/g, "\\n").replace(/\\'/g, "\\'").replace(/\\"/g, '\\"').replace(/\\&/g, "\\&").replace(/\\r/g, "\\r").replace(/\\t/g, "\\t").replace(/\\b/g, "\\b").replace(/\\f/g, "\\f");
  console.log('myEscapedJSONString', myEscapedJSONString);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"APILogs.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/APILogs.js                                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  APILogs: () => APILogs,
  REST_Log: () => REST_Log
});
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
const APILogs = new Mongo.Collection('apiLogs');

function REST_Log(call, userId = 'Not defined') {
  call.createDate = new Date();
  call.generationUserId = userId;
  APILogs.insert(call);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"apps.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/apps.js                                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Apps: () => Apps,
  TemplateApps: () => TemplateApps,
  GeneratedResources: () => GeneratedResources
});
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
const Apps = new Mongo.Collection('apps');
const TemplateApps = new Mongo.Collection('templateApps');
const GeneratedResources = new Mongo.Collection('generatedResources');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"config.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/config.js                                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  senseConfig: () => senseConfig,
  missingParameters: () => missingParameters
});
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 1);

let _;

module.watch(require("meteor/underscore"), {
  default(v) {
    _ = v;
  }

}, 2);

const _QIXSchema = require('enigma.js/schemas/3.2.json'); //This is the config that we need to make available on the client (the webpage)


if (Meteor.isClient) {
  var _senseConfig = {
    "host": Meteor.settings.public.qlikSenseHost,
    "port": Meteor.settings.public.qlikSensePort,
    "useSSL": Meteor.settings.public.useSSL,
    "virtualProxyClientUsage": Meteor.settings.public.virtualProxyClientUsage,
    "virtualProxySlideGenerator": Meteor.settings.public.slideGenerator.virtualProxy,
    "webIntegrationDemoPort": Meteor.settings.public.webIntegrationDemoPort,
    "QIXSchema": _QIXSchema //ssbi and slide generator app id are set automatically on main.js (client side, via a call to the server)
    // config.SSBIAppId = 
    // config.slideGeneratorAppId = 

  };
} //SERVER SIDE


if (Meteor.isServer) {
  module.export({
    authHeaders: () => authHeaders,
    validateJSON: () => validateJSON,
    QRSconfig: () => QRSconfig
  });
  let sslRootCas;
  module.watch(require("ssl-root-cas"), {
    default(v) {
      sslRootCas = v;
    }

  }, 3);
  let crypto;
  module.watch(require("crypto"), {
    default(v) {
      crypto = v;
    }

  }, 4);
  let myQRS;
  module.watch(require("/imports/api/server/QRSAPI"), {
    myQRS(v) {
      myQRS = v;
    }

  }, 5);
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
  sslRootCas.inject();
  console.log('This tool uses this config as defined in the settings-XYZ.json file in the root folder: ', Meteor.settings);

  var fs = require('fs-extra');

  const path = require('path');

  var os = require('os'); // import fs from 'fs';


  const bluebird = require('bluebird');

  const WebSocket = require('ws');

  if (!Meteor.settings.public.qlikSenseHost) {
    Meteor.settings.public.qlikSenseHost = os.hostname();
  }

  if (!Meteor.settings.public.SenseServerInternalLanIP) {
    Meteor.settings.public.SenseServerInternalLanIP = os.hostname();
  }

  if (!Meteor.settings.public.webIntegrationHost) {
    Meteor.settings.public.webIntegrationHost = os.hostname();
  }

  var _senseConfig = {
    "host": Meteor.settings.public.qlikSenseHost,
    "SenseServerInternalLanIP": Meteor.settings.public.SenseServerInternalLanIP,
    "port": Meteor.settings.public.qlikSensePort,
    "useSSL": Meteor.settings.public.useSSL,
    "xrfkey": generateXrfkey(),
    "virtualProxy": Meteor.settings.private.virtualProxy,
    //used to connect via REST to Sense, we authenticate via a http header. not for production!!!
    "virtualProxyClientUsage": Meteor.settings.public.virtualProxyClientUsage,
    "headerKey": Meteor.settings.private.headerKey,
    "headerValue": process.env.USERDOMAIN + '\\' + process.env.USERNAME,
    //"QLIK-AB0Q2URN5T\\Qlikexternal",
    "isSecure": Meteor.settings.private.isSecure,
    "qrsPort": Meteor.settings.private.qrsPort,
    "enginePort": Meteor.settings.private.enginePort
  };

  if (missingParameters(_senseConfig)) {
    throw new Meteor.Error('Missing parameters in _senseConfig, you did not populate the settings.json file in the project root of MeteorQRS, or with docker: did you mount the volume with the config including the settings.json file? (with the correct name)');
  }

  if (!_senseConfig.host) {
    throw new Meteor.Error('You have not started this meteor project with: meteor --settings settings-development.json ? You missed the reference to this settings file, or it is empty?');
  } //CONFIG FOR HTTP MODULE WITH HEADER AUTH (TO MAKE REST CALLS TO SENSE VIA HTTP CALLS).


  const authHeaders = {
    'hdr-usr': _senseConfig.headerValue,
    'X-Qlik-xrfkey': _senseConfig.xrfkey //

  };

  if (!Meteor.settings.private.certificatesDirectory) {
    Meteor.settings.private.certificatesDirectory = 'C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates';
    console.log('Meteor.settings.private.certificatesDirectory was empty, setting it to default: ', Meteor.settings.private.certificatesDirectory);
  }

  try {
    module.export({
      _certs: () => _certs,
      configCerticates: () => configCerticates,
      enigmaServerConfig: () => enigmaServerConfig,
      engineConfig: () => engineConfig,
      qlikHDRServer: () => qlikHDRServer,
      qrsSrv: () => qrsSrv,
      qrs: () => qrs
    });
    const _certs = {
      ca: fs.readFileSync(Meteor.settings.private.certificatesDirectory + '/root.pem'),
      key: fs.readFileSync(Meteor.settings.private.certificatesDirectory + '/client_key.pem'),
      cert: fs.readFileSync(Meteor.settings.private.certificatesDirectory + '/client.pem') //if you use windows and this tool runs on the same machine, you can keep the parameters empty
      // and we use the user the node service runs under... .

    };
    var qlikUserDomain = '';
    var qlikUser = '';

    if (!Meteor.settings.broker.qlikSense.connectToSenseAsUserDirectory) {
      qlikUserDomain = process.env.USERDOMAIN;
      qlikUser = process.env.USERNAME;
    } else {
      qlikUserDomain = Meteor.settings.broker.qlikSense.connectToSenseAsUserDirectory;
      qlikUser = Meteor.settings.broker.qlikSense.connectToSenseAsUser;
    }

    var configCerticates = {
      rejectUnauthorized: false,
      hostname: _senseConfig.SenseServerInternalLanIP,
      headers: {
        'x-qlik-xrfkey': _senseConfig.xrfkey,
        'X-Qlik-User': `UserDirectory=${qlikUserDomain};UserId=${qlikUser}`,
        //`UserDirectory=INTERNAL;UserId=sa_repository` you need to give this user extra roles before this works
        'Content-Type': 'application/json'
      },
      key: _certs.key,
      cert: _certs.cert,
      ca: _certs.ca
    };
    console.log('configCerticates: we connect to Qlik Sense via certificates using these credentials: ', configCerticates); //used for engimaJS, the engine API javascript wrapper

    var _engineConfig = {
      host: _senseConfig.SenseServerInternalLanIP,
      isSecure: _senseConfig.isSecure,
      port: Meteor.settings.private.enginePort,
      headers: {
        'X-Qlik-User': `UserDirectory=${qlikUserDomain};UserId=${qlikUser}`
      },
      ca: _certs.ca,
      key: _certs.key,
      cert: _certs.cert,
      passphrase: Meteor.settings.private.passphrase,
      rejectUnauthorized: false,
      // Don't reject self-signed certs
      appname: null,
      QIXSchema: _QIXSchema
    };
    const enigmaServerConfig = {
      schema: _engineConfig.QIXSchema,
      // appId: appId,
      session: {
        host: _engineConfig.host,
        port: _engineConfig.port
      },
      Promise: bluebird,

      createSocket(url) {
        return new WebSocket(url, {
          ca: _certs.ca,
          key: _certs.key,
          cert: _certs.cert,
          headers: {
            'X-Qlik-User': `UserDirectory=${qlikUserDomain};UserId=${qlikUser}`
          }
        });
      }

    };
    const engineConfig = _engineConfig;
    const qlikHDRServer = 'http://' + _senseConfig.SenseServerInternalLanIP + ':' + _senseConfig.port + '/' + _senseConfig.virtualProxy;
    const qrsSrv = 'https://' + _senseConfig.SenseServerInternalLanIP + ':' + _senseConfig.qrsPort;
    const qrs = new myQRS();
  } catch (error) {
    console.warn('Make sure you run the "QRS START.BAT" as administrator? Please note that Qlik Sense is not installed, or certificate directory wrong in the settings.json file.'); // throw new Meteor.Error(500, 'We can not connect to Sense yet: Because we can not find the Sense certificates yet in the ' + Meteor.settings.private.certificatesDirectory + '. This can happen if Sense has not yet been installed....');
  } //END CODE THAT NEEDS CERTIFICATES


  function generateXrfkey() {
    return Random.hexString(16);
  }

  function validateJSON(body) {
    try {
      var data = JSON.parse(body); // if came to here, then valid

      return data;
    } catch (e) {
      // failed to parse
      return null;
    }
  }

  const QRSconfig = {
    authentication: 'header',
    host: _senseConfig.host,
    port: _senseConfig.port,
    useSSL: false,
    virtualProxy: _senseConfig.virtualProxy,
    //header proxy
    headerKey: _senseConfig.headerKey,
    headerValue: _senseConfig.headerValue //'mydomain\\justme'

  };

  try {
    Meteor.startup(function () {
      return Promise.asyncApply(() => {
        console.log('------------------------------------');
        console.log('Validate settings.json parameters');
        console.log('------------------------------------');
        Meteor.absolutePath = path.resolve('.').split(path.sep + '.meteor')[0];
        console.log('Meteor tries to find the settings-development-example.json file in Meteor.absolutePath:', Meteor.absolutePath);
        var file = path.join(Meteor.absolutePath, 'settings-development-example.json'); // READ THE FILE 

        try {
          var exampleSettingsFile = Promise.await(fs.readJson(file));
          console.log('TCL: exampleSettingsFile', exampleSettingsFile);
        } catch (error) {
          throw new Error('Meteor can not find your example settings file: ' + file);
        } // VALIDATE JSON OF SETTINGS FILE AGAINST EXAMPLE SETTINGS FILE


        try {
          validateJSON(exampleSettingsFile);
        } catch (err) {
          console.log(err);
          throw new Error('Meteor wants to check your settings.json with the parameters in the example settings.json in the project root. Error: Cant read the example settings definitions file (not valid JSON): ' + file, err);
        }

        var keysEqual = compareKeys(Meteor.settings, exampleSettingsFile);
        console.log('Settings file has all the keys as specified in the example json file?', keysEqual);

        if (!keysEqual) {
          throw new Error('Settings.json file does not have all keys as defined in the settings-development-example.json (in your project root), Please verify if you have all the keys as specified in the settings-development-example.json in the project root folder. In my dev environment: C:\\Users\\Qlikexternal\\Documents\\GitHub\\QRSMeteor');
        }
      });
    });
  } catch (error) {
    throw new Error(error);
  }
} //exit server side config


const senseConfig = _senseConfig;

function missingParameters(obj) {
  for (var key in obj) {
    if (obj[key] !== null && obj[key] != "") return false;
  }

  return true;
}

function hasSameProps(obj1, obj2) {
  return Object.keys(obj1).every(function (prop) {
    return obj2.hasOwnProperty(prop);
  });
}

function compareKeys(...objects) {
  const allKeys = objects.reduce((keys, object) => keys.concat(Object.keys(object)), []);
  const union = new Set(allKeys);
  return objects.every(object => union.size === Object.keys(object).length);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"customers.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/customers.js                                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Customers: () => Customers,
  dummyCustomer: () => dummyCustomer,
  dummyCustomers: () => dummyCustomers
});
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
const Customers = new Mongo.Collection('customers');
Meteor.methods({
  updateUserForCustomer(updatedUser) {
    var selection = {
      'generationUserId': Meteor.userId(),
      'users.name': updatedUser.name
    };
    Customers.update(selection, {
      $set: {
        'users.$': updatedUser
      }
    });
  }

});
Customers.attachSchema(new SimpleSchema({
  name: {
    type: String,
    label: "Customer name"
  },
  checked: {
    type: Boolean,
    label: "Selected for the generation?",
    optional: true,
    defaultValue: true
  },
  createdAt: {
    type: Date,
    label: "Date created",
    optional: true
  },
  createdBy: {
    type: Object,
    label: "Date created",
    optional: true
  },
  generationUserId: {
    type: String,
    autoValue: function () {
      return this.userId;
    }
  },
  users: {
    type: [Object],
    optional: true
  },
  "users.$": {
    type: Object
  },
  "users.$.name": {
    type: String
  },
  "users.$.group": {
    type: String,
    allowedValues: ['Consumer', 'Contributor', 'Developer', 'Admin', 'Global auditor']
  },
  "users.$.currentlyLoggedIn": {
    type: Boolean,
    optional: true
  },
  "users.$.country": {
    type: String,
    allowedValues: ['Germany', 'United States', 'Italy']
  }
}));
const dummyCustomer = {
  "name": faker.company.companyName(),
  "checked": true,
  "user": {
    "name": 'John',
    "group": "Consumer",
    "currentlyLoggedIn": false,
    "country": "Germany"
  }
};
const dummyCustomers = [{
  "name": faker.company.companyName(),
  "checked": true,
  "users": [{
    "name": 'John',
    "group": "Consumer",
    "currentlyLoggedIn": false,
    "country": "Germany"
  }, {
    "name": 'Linda',
    "group": "Contributor",
    "currentlyLoggedIn": false,
    "country": "United States"
  }, {
    "name": 'Martin',
    "group": "Developer",
    "currentlyLoggedIn": false,
    "country": "Italy"
  }, {
    "name": 'Paul',
    "group": "Admin",
    "currentlyLoggedIn": false,
    "country": "Italy"
  }]
}, {
  "name": faker.company.companyName(),
  "checked": true,
  "users": [{
    "name": faker.name.findName(),
    "group": "Consumer",
    "currentlyLoggedIn": false,
    "country": "Italy"
  }]
}, {
  "name": faker.company.companyName(),
  "checked": true,
  "users": [{
    "name": faker.name.findName(),
    "group": "Consumer",
    "currentlyLoggedIn": false,
    "country": "Italy"
  }] // {
  //     "name": "QPMG Accountants",
  //     "checked": true,
  //     "users": [{
  //         "name": "Ron",
  //         "group": "Global Auditor",
  //         "currentlyLoggedIn": false,
  //         "country": "Italy"
  //     }]
  // }
  // { "name": "A&R Partners", "checked": true },
  //     { "name": "A2Z Solutions", "checked": true },
  //     { "name": "Aaron D. Meyer & Associates", "checked": true },
  //     { "name": "Aaron Products", "checked": true },
  // { "name": "Active Data", "checked": true },
  // { "name": "Ben and Jerry’s", "checked": true },
  // { "name": "Benedict", "checked": true },
  // { "name": "Bizmarts", "checked": true },
  // { "name": "C & C  Design", "checked": true },
  // { "name": "C & J Engineering", "checked": true },
  // { "name": "CAF Systemhaus", "checked": true },
  // { "name": "CAM Group", "checked": true },
  // { "name": "Caribian Specialties", "checked": true },
  // { "name": "City Fresh Foods", "checked": true },
  // { "name": "Clearout", "checked": true },
  // { "name": "David Spencer Ltd.", "checked": true },
  // { "name": "Dayton Malleable Inc.", "checked": true },
  // { "name": "DCP Research", "checked": true },
  // { "name": "DCS International", "checked": true },
  // { "name": "DCS Laboratory", "checked": true },
  // { "name": "Deak-Perera Group.", "checked": true },
  // { "name": "Earth", "checked": true },
  // { "name": "eDistrict", "checked": true },
  // { "name": "EDP", "checked": true },
  // { "name": "Ethyl Corporation", "checked": true },
  // { "name": "Federal Focus", "checked": true },
  // { "name": "Fill It", "checked": true },
  // { "name": "Filmotype", "checked": true },
  // { "name": "Fins", "checked": true },
  // { "name": "Gate", "checked": true },
  // { "name": "Gulf and Western Industries", "checked": true },
  // { "name": "Harte-Hanks (formerly Locator)", "checked": true },
  // { "name": "Harvard Trust Company", "checked": true },
  // { "name": "HCHS", "checked": true },
  // { "name": "Healtheon", "checked": true },
  // { "name": "Hetrick Systems", "checked": true },
  // { "name": "Home Team", "checked": true },
  // { "name": "Homebound", "checked": true },
  // { "name": "IBVA", "checked": true },
  // { "name": "Icon", "checked": true },
  // { "name": "Icon Site Builders", "checked": true },
  // { "name": "Idyllwild", "checked": true },
  // { "name": "J. S. Lee Associates", "checked": true },
  // { "name": "K International", "checked": true },
  // { "name": "K.C. Irving", "checked": true },
  // { "name": "Kari & Associates", "checked": true },
  // { "name": "Karsing", "checked": true },
  // { "name": "Kazinformcom", "checked": true },
  // { "name": "KentISP", "checked": true },
  // { "name": "Kool-Seal", "checked": true },
  // { "name": "Laker Airways", "checked": true },
  // { "name": "Livermore  Laboratories (LSLI)", "checked": true },
  // { "name": "LiveWire BBS and   Favourite Links", "checked": true },
  // { "name": "MATRIX", "checked": true },
  // { "name": "Miles Laboratories, Inc.", "checked": true },
  // { "name": "NACSCORP", "checked": true },
  // { "name": "Onestar", "checked": true },
  // { "name": "Pace", "checked": true },
  // { "name": "Pacific Group", "checked": true },
  // { "name": "Pacific Matics", "checked": true },
  // { "name": "Pacific Sierra Research", "checked": true },
  // { "name": "Pacific Voice", "checked": true },
  // { "name": "Pacific West Enterprises", "checked": true },
  // { "name": "PacificServ", "checked": true },
  // { "name": "Panngea", "checked": true },
  // { "name": "PAP (Maintenance)", "checked": true },
  // { "name": "Paracel", "checked": true },
  // { "name": "Patient", "checked": true },
  // { "name": "Pinnacle Micro", "checked": true },
  // { "name": "QualServe", "checked": true },
  // { "name": "Quantum 4Xyte  Architects", "checked": true },
  // { "name": "Qwest", "checked": true },
  // { "name": "R&R Group", "checked": true },
  // { "name": "R.J. Matter & Associates", "checked": true },
  // { "name": "Ra Co Amo", "checked": true },
  // { "name": "RC", "checked": true },
  // { "name": "Ready-to-Run", "checked": true },
  // { "name": "Remedy", "checked": true },
  // { "name": "Renegade info Crew", "checked": true },
  // { "name": "Reuters Usability Group", "checked": true },
  // { "name": "ReviewBooth", "checked": true },
  // { "name": "RFI Corporation", "checked": true },
  // { "name": "Road Warrior International", "checked": true },
  // { "name": "Robust Code", "checked": true },
  // { "name": "Sage", "checked": true },
  // { "name": "Sagent", "checked": true },
  // { "name": "Salamander Junction", "checked": true },
  // { "name": "Satronix", "checked": true },
  // { "name": "Satyam", "checked": true },
  // { "name": "Scientific Atlanta", "checked": true },
  // { "name": "ScotGold Products", "checked": true },
  // { "name": "Screen Saver.com", "checked": true },
  // { "name": "Sifton Properties Limited", "checked": true },
  // { "name": "Sigma", "checked": true },
  // { "name": "Signature", "checked": true },
  // { "name": "SignatureFactory", "checked": true },
  // { "name": "Soloman Brothers", "checked": true },
  // { "name": "Southern Company", "checked": true },
  // { "name": "Stone Consolidated Corporation", "checked": true },
  // { "name": "Talou", "checked": true },
  // { "name": "Tampere", "checked": true },
  // { "name": "Tandy Corporation", "checked": true },
  // { "name": "Tangent", "checked": true },
  // { "name": "Tao Group", "checked": true },
  // { "name": "Target Marketing", "checked": true },
  // { "name": "Team ASA", "checked": true },
  // { "name": "Team Financial Management Systems", "checked": true },
  // { "name": "Teca-Print", "checked": true },
  // { "name": "Time Warner", "checked": true },
  // { "name": "Towmotor Corporation", "checked": true },
  // { "name": "Tredegar Company", "checked": true },
  // { "name": "Trend Line Corporation", "checked": true },
  // { "name": "U. S. Exchange", "checked": true },
  // { "name": "Unison Management Concepts", "checked": true },
  // { "name": "United States  (USIT)", "checked": true },
  // { "name": "UUmail", "checked": true },
  // { "name": "ValiCert", "checked": true },
  // { "name": "Valley  Solutions", "checked": true },
  // { "name": "Valpatken", "checked": true },
  // { "name": "Vanstar", "checked": true },
  // { "name": "Venable", "checked": true },
  // { "name": "Venred", "checked": true },
  // { "name": "Watcom International", "checked": true },
  // { "name": "Xentec", "checked": true },
  // { "name": "Xilinx", "checked": true },
  // { "name": "XVT", "checked": true },
  // { "name": "Zero Assumption Recovery", "checked": true },
  // { "name": "Zilog", "checked": true },
  // { "name": "Zitel", "checked": true },

}];
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"logger.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/logger.js                                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Logger: () => Logger,
  SenseSelections: () => SenseSelections
});
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
const Logger = new Mongo.Collection('logger');
const SenseSelections = new Mongo.Collection('senseSelections');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"streams.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/streams.js                                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Streams: () => Streams
});
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
const Streams = new Mongo.Collection('streams');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup":{"accounts-config.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/startup/accounts-config.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AccountsTemplates.configure({
  // Behavior
  confirmPassword: false,
  enablePasswordChange: true,
  forbidClientAccountCreation: false,
  overrideLoginErrors: true,
  sendVerificationEmail: false,
  lowercaseUsername: false,
  focusFirstInput: true,
  // Appearance
  showAddRemoveServices: false,
  showForgotPasswordLink: false,
  showLabels: true,
  showPlaceholders: true,
  showResendVerificationEmailLink: false,
  // Client-side Validation
  continuousValidation: false,
  negativeFeedback: false,
  negativeValidation: true,
  positiveValidation: true,
  positiveFeedback: true,
  showValidating: true,
  // // Privacy Policy and Terms of Use
  // privacyUrl: 'privacy',
  // termsUrl: 'terms-of-use',
  // Redirects
  homeRoutePath: '/',
  redirectTimeout: 4000,
  // // Hooks
  // onLogoutHook: myLogoutFunc,
  // onSubmitHook: mySubmitFunc,
  // preSignUpHook: myPreSubmitFunc,
  // postSignUpHook: myPostSubmitFunc,
  // Texts
  texts: {
    button: {
      signUp: "Register now to start using the Qlik Sense SaaS demo"
    },
    socialSignUp: "Register",
    socialIcons: {
      "meteor-developer": "fa fa-rocket"
    },
    title: {
      forgotPwd: "Recover Your Password"
    }
  }
});
AccountsTemplates.configureRoute('signIn');
AccountsTemplates.configureRoute('changePwd'); // AccountsTemplates.configureRoute('enrollAccount');
// AccountsTemplates.configureRoute('forgotPwd');
// AccountsTemplates.configureRoute('resetPwd');

AccountsTemplates.configureRoute('signUp');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"ui":{"UIHelpers.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/ui/UIHelpers.js                                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  gitHubLinks: () => gitHubLinks
});
let Apps, TemplateApps;
module.watch(require("/imports/api/apps"), {
  Apps(v) {
    Apps = v;
  },

  TemplateApps(v) {
    TemplateApps = v;
  }

}, 0);
let Streams;
module.watch(require("/imports/api/streams"), {
  Streams(v) {
    Streams = v;
  }

}, 1);
let Customers;
module.watch(require("/imports/api/customers"), {
  Customers(v) {
    Customers = v;
  }

}, 2);
let senseConfig;
module.watch(require("/imports/api/config"), {
  senseConfig(v) {
    senseConfig = v;
  }

}, 3);
var gitHubLinks = {
  createStream: 'https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsStream.js#L113',
  copyApp: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L477",
  replaceAndReloadApp: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L275",
  publishApp: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L604",
  requestTicket: "https://github.com/QHose/QRSMeteor/blob/50bf903dc67d8d1b3757b572e8b2dedbb63202da/imports/api/server/QPSFunctions.js#L205",
  createPasport: "https://github.com/QHose/QRSMeteor/blob/50bf903dc67d8d1b3757b572e8b2dedbb63202da/imports/api/server/QPSFunctions.js#L56",
  redirectURLReceived: "https://github.com/QHose/QRSMeteor/blob/master/imports/SSO/client/SSO.js#L100",
  deleteApp: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L570",
  logoutUser: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QPSFunctions.js#L461",
  saveApp: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L300",
  getScript: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L275",
  setScript: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L288",
  reloadApp: "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QRSFunctionsApp.js#L292"
};

if (Meteor.isClient) {
  module.export({
    freshEnvironment: () => freshEnvironment,
    currentStep: () => currentStep
  });

  var Cookies = require('js-cookie'); // console.log('Setup generic helper functions, for functions every template needs');


  Template.registerHelper('formatDate', function (date) {
    return moment(date).format('DD-MM-YYYY');
  }); // // Template.registerHelper('formatNumber', function(myNumber) {
  //     var commaFormat = d3.format(",");
  //     // The expression /,/g is a regular expression that matches all commas.
  //     return commaFormat(myNumber)
  //         .replace(/,/g, ".");
  // });

  Template.registerHelper('URL_Youtube_howToDemo', function () {
    return 'https://www.youtube.com/embed/OulQS-1fH-A?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk';
  });
  Template.registerHelper('URL_Youtube_quickIntro', function () {
    return '';
  });
  Template.registerHelper('URL_Youtube_1mflashyIntro', function () {
    return 'https://www.youtube.com/embed/W3gDKdv6K8Y';
  });
  Template.registerHelper('URL_Youtube_playlist', function () {
    return 'https://www.youtube.com/playlist?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk';
  });
  Template.registerHelper('URL_Youtube_integrated_flow', function () {
    return "https://www.youtube.com/embed/M49nv6on5Eg?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk";
  });
  Template.registerHelper('URL_Youtube_generic_security_intro', function () {
    return "https://www.youtube.com/embed/sdCVsMzTf64";
  });
  Template.registerHelper('URL_Youtube_webintegration_introduction', function () {
    return "https://www.youtube.com/embed/zuNvZ_UTmow?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk";
  }); //QAP

  Template.registerHelper('URL_Youtube_webintegration_extended', function () {
    return "https://www.youtube.com/embed/yLTqzftDa7s";
  });
  Template.registerHelper('URL_Youtube_architecture_introduction', function () {
    return "https://www.youtube.com/embed/sv5nKDvmRPI?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk";
  });
  Template.registerHelper('URL_Youtube_security_introduction', function () {
    return "https://www.youtube.com/embed/XJ9dOHoMiXE?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk";
  });
  Template.registerHelper('URL_Youtube_security_deepDive', function () {
    return "https://www.youtube.com/embed/iamo6RLc5Pg";
  });
  Template.registerHelper('URL_Youtube_concept_behind', function () {
    return "https://www.youtube.com/embed/1PjcTFnC4Mo";
  });
  Template.registerHelper('doc_demo_manual', function () {
    return '/docs/How to demo the Qlik Sense SaaS demo platform.pdf';
  });
  Template.registerHelper('doc_sec_function_task_matrix', function () {
    return '/docs/QlikSense Authorizations - Function and Tasks_Demo.xlsx';
  });
  Template.registerHelper('doc_securtityIntegration', function () {
    return 'https://community.qlik.com/docs/DOC-17599';
  });
  Template.registerHelper('doc_processIntegration', function () {
    return 'https://community.qlik.com/docs/DOC-17831';
  });
  Template.registerHelper('doc_integrationOverview', function () {
    return 'https://community.qlik.com/docs/DOC-9533';
  });
  Template.registerHelper('doc_sourceCode', function () {
    return '/docs/Qlik Sense SaaS demo tool documentation of source code.docx';
  });
  Template.registerHelper('doc_demo_setup_instructions', function () {
    return '/docs/Qlik Sense SaaS demo tool setup instructions.docx';
  });
  Template.registerHelper('doc_webIntegration', function () {
    return 'https://community.qlik.com/docs/DOC-17834';
  });
  Template.registerHelper('doc_dataIntegration', function () {
    return 'https://onedrive.live.com/view.aspx?cid=0805405928a75727&id=documents&resid=805405928A75727%211330&app=OneNote&authkey=!ANwk5S8KPC__-dw&&wd=target%28%2F%2FEMBEDDED%20ANALYTICS.one%7Cbf2972be-48a0-46fa-af7a-f6d2f80cf06b%2FData%20integration%20Combine%20sources%20into%20one%20associative%20model%7Ce669a0a2-9a83-470e-aae8-ba63ac500038%2F%29';
  });
  Template.registerHelper('seq_ticketing_flow', function () {
    return "http://knsv.github.io/mermaid/live_editor/#/view/c2VxdWVuY2VEaWFncmFtCkJyb3dzZXItPj5NZXRlb3Igd2ViIGludGVncmF0aW9uIGRlbW86IFVzZXIgbG9ncyBpbiBpbnRvIE1ldGVvciAKQnJvd3Nlci0-PiBQcm94eTogSUZyYW1lIHRyaWVzIHRvIG9wZW4gU2Vuc2UgY29udGVudCB2aWEgbGluayB0aGF0IGNvbnRhaW5zIC9wcm94eS8KUHJveHktPj5NZXRlb3IgU1NPIGNsaWVudDogUmVkaXJlY3QgcmVxdWVzdCB0byB3ZWJwYWdlIG9uIHRoZSBjbGllbnQgKGNsaWVudCBzaWRlIHJvdXRlKS4KCk5vdGUgcmlnaHQgb2YgUHJveHk6IFByb3h5IGFsc28gaW5jbHVkZXMgdGFyZ2V0SWQgPSA8SUQgZm9yIHRoZSBvcmlnaW5hbCBVUkkgdGhhdCB0aGUgdXNlciB0cmllcyB0byBhY2Nlc3M-LCBhbmQgcHJveHlSZXN0VXJpID0gPHRoZSBVUkkgd2hlcmUgdGhlIGF1dGhlbnRpY2F0aW9uIG1vZHVsZSBjYW4gYWNjZXNzIHRoZSBSRVNUIEFQST4KTWV0ZW9yIFNTTyBjbGllbnQtPk1ldGVvciBzZXJ2ZXI6ICBjbGllbnQgY2FsbHMgKHVzZXIgYXdhcmUpIHNlcnZlciBzaWRlIG1ldGhvZApOb3RlIHJpZ2h0IG9mIE1ldGVvciBzZXJ2ZXI6IFNpbmNlIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIGluIE1ldGVvciwgd2UgY2FuIHJlcXVlc3QgdGhlIHVzZXJJRCBhbmQgZ3JvdXAgbWVtYmVyc2hpcCBmcm9tIHRoZSBNZXRlb3Igc2Vzc2lvbi4gVHJ1c3QgbWVjaGFuaXNtOiBTZXJ2ZXIgaW1wb3J0ZWQgUWxpayBTZW5zZSBjbGllbnQgY2VydGlmaWNhdGUuCk1ldGVvciBzZXJ2ZXItPj5RUFMgQVBJOiBSZXF1ZXN0IHRpY2tldCBhdCBRUFMgQVBJLCBwcm92aWRlIHRoZSB1c2VySWQgYW5kIGdyb3VwcyBpbiBKU09OLgpOb3RlIHJpZ2h0IG9mIE1ldGVvciBzZXJ2ZXI6IE9wdGlvbmFsbHkgaW5jbHVkZSB0aGUgcmVkaXJlY3QgcGFyYW1ldGVyIHRvIGZvcndhcmQgdGhlIHVzZXIgYmFjayB0byB0aGUgcGFnZSBoZSBpbml0aWFsbHkgdHJpZWQgdG8gYWNjZXNzLgpRUFMgQVBJLS0-Pk1ldGVvciBzZXJ2ZXI6IFFQUyBBUEkgcmV0dXJucyBhIHRpY2tldCBudW1iZXIgKGFuZCBwb3NzaWJseSByZWRpcmVjdCBVUkwpIHdoaWNoIHlvdSBoYXZlIHRvIGFwcGVuZCBpbiB0aGUgVVJMIApNZXRlb3Igc2VydmVyLS0-PiBNZXRlb3Igd2ViIGludGVncmF0aW9uIGRlbW86IENyZWF0ZSBhIHJlZGlyZWN0IFVSTCB3aGljaCB0aGUgY2xpZW50IGNvZGUgY2FuIHB1dCBpbiB0aGUgYnJvd3NlciBVUkwgYmFyLiAKTm90ZSByaWdodCBvZiBNZXRlb3Igd2ViIGludGVncmF0aW9uIGRlbW86IENsaWVudCBzaWRlIGNvZGUsIHJlcGxhY2VzIHRoZSB1cmwgaW4gYnJvd3NlciwgYW5kIGZvcndhcmRzIHRoZSB1c2VyIHRvIFFsaWsgU2Vuc2UuIFVzZXIgbm93IHJlY2VpdmVzIGEgUWxpayBTZW5zZSBzZXNzaW9uIGNvb2tpZSAoc2VlIHZpcnR1YWwgcHJveHkgY29uZmlnKSwgYW5kIGFuZCBzdWNoIHNpbmdsZSBzaWduIG9uIGlzIGNvbmZpZ3VyZWQu";
  });
  Template.registerHelper('github_create_stream', function () {
    return gitHubLinks.createStream;
  });
  Template.registerHelper('github_copy_app', function () {
    return gitHubLinks.copyApp;
  });
  Template.registerHelper('github_replace_and_reload_app', function () {
    return gitHubLinks.replaceAndReloadApp;
  });
  Template.registerHelper('github_publish_app', function () {
    return gitHubLinks.publishApp;
  });
  Template.registerHelper('github_logout_user', function () {
    return "https://github.com/QHose/QRSMeteor/blob/master/imports/api/server/QPSFunctions.js#L18";
  });
  Template.registerHelper('senseServerHub', function () {
    return 'https://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxyClientUsage + '/hub';
  });
  Template.registerHelper('senseServerDevHub', function () {
    return 'https://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxyClientUsage + '/dev-hub';
  });
  Template.registerHelper('senseServerQMC', function () {
    return 'https://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxyClientUsage + '/qmc';
  });
  Template.registerHelper('senseServer', function () {
    return 'https://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxyClientUsage;
  });
  Template.registerHelper('webIntegrationDemo', function () {
    return 'https://' + Meteor.settings.public.webIntegrationHost + ':' + Meteor.settings.public.webIntegrationDemoPort;
  }); //Integration presentation Iframe selector

  Template.registerHelper('IFrameURLChapterSelection', function () {
    var appId = Cookies.get('slideGeneratorAppId'); //senseConfig.slideGeneratorAppId;

    var IntegrationPresentationSelectionSheet = Meteor.settings.public.slideGenerator.selectionSheet; //'DYTpxv'; selection sheet of the slide generator

    var proxy = Meteor.settings.public.slideGenerator.virtualProxy;
    var url = senseConfig.host + ':' + senseConfig.port + '/' + proxy + '/single/?appid=' + appId + '&sheet=' + IntegrationPresentationSelectionSheet + '&opt=currsel';

    if (Meteor.settings.public.useSSL) {
      return 'https://' + url;
    } else {
      return 'http://' + url;
    }
  }); // Template.registerHelper('authenticatedSlideGenerator', function() {
  //     return Session.get('authenticatedSlideGenerator');
  // });

  Template.registerHelper('shrinkForSlideSorter', function () {
    return Cookies.get('showSlideSorter') === "true" ? "shrink" : ""; //
  });
  Template.registerHelper('groupSelectedSlideGenerator', function () {
    return Session.get('groupForPresentation'); //user selected a presentation type?
  }); //role that defines your role in the whole integration.qlik.com site, based on this we make selections in the slide generator.

  Template.registerHelper('mainUserRole', function () {
    return Cookies.get('currentMainRole');
  });
  Template.registerHelper('isSelected', function () {
    return someValue ? 'selected' : '';
  });
  Template.registerHelper('customers', function () {
    return Customers.find({});
  }); //used for Aldeed autoform

  Template.registerHelper("Customers", Customers);
  Template.registerHelper('noCustomers', function () {
    return !Customers.find({}).count();
  });
  Template.registerHelper('noTemplateApps', function () {
    return !TemplateApps.find({}).count();
  }); //generic helpers to return the collection to the blaze template

  Template.registerHelper('customersCollection', function () {
    return Customers.find({}, {
      sort: {
        checked: -1
      }
    });
  });
  Template.registerHelper('templateAppsCollection', function () {
    return TemplateApps.find();
  });
  Template.registerHelper('appsCollection', function () {
    return Apps.find();
  });
  Template.registerHelper('streamsCollection', function () {
    return Streams.find();
  });
  Template.registerHelper('freshEnvironment', function () {
    return freshEnvironment();
  });
  Template.registerHelper('loading', function () {
    // console.log('loading indicator in helper is: ', Session.get('loadingIndicator'));
    return Session.get('loadingIndicator');
  });

  function freshEnvironment() {
    if (!Customers.find().count() && !TemplateApps.find().count()) {
      // Session.set('currentStep', 0);
      return true;
    }
  }

  ;
  Template.registerHelper('readyToSelectTemplate', function () {
    return currentStep() === 2;
  });
  Template.registerHelper('templateButNoCustomer', function () {
    return !Customers.find().count() && TemplateApps.find().count();
  });
  Template.registerHelper('readyToGenerate', function () {
    return currentStep() === 3 && !Session.equals('loadingIndicator', 'loading');
  });
  Template.registerHelper('step3', function () {
    return Session.get('currentStep') === 3;
  });
  Template.registerHelper('step3or4', function () {
    return Session.get('currentStep') === 3 || Session.get('currentStep') === 4 || Session.equals('loadingIndicator', 'loading');
  });
  Template.registerHelper('stepEqualTo', function (stepNr) {
    // console.log('value of currentStep() ', currentStep());
    return currentStep() === stepNr;
  });

  function currentStep() {
    // console.log('the current step session', Session.get('currentStep'));//
    //step 0: fresh/resetted environment
    if (freshEnvironment()) {
      return 0;
    } //step 1 insert customers
    else if (Session.get('currentStep') === 1) {
        Router.go('users');
        return 1;
      } //step 2 there are customers, but no template
      else if ( // (Customers.find().count() && !TemplateApps.find().count()) &&
        Session.get('currentStep') === 2) {
          return 2;
        } //step 3
        else if ( // Customers.find().count() && 
          // TemplateApps.find().count() && 
          Session.get('currentStep') === 3 && !Session.equals('loadingIndicator', 'loading')) {
            // console.log('loading indicator is ', Session.get('loadingIndicator') )
            return 3;
          } //step 4
          else if (Session.get('currentStep') === 4 // &&
            // Customers.find().count() &&
            // TemplateApps.find().count()
            ) {
                return 4;
              } else if (Session.equals('loadingIndicator', 'loading')) {
              return;
            } else {
              Session.set('currentStep', 3);
              return 3;
            }
  }

  Template.registerHelper('generationFinished', function () {
    return Session.equals('loadingIndicator', 'loading') || Session.get('generated?');
  });
  Template.registerHelper('readyToTestSSO', function () {
    return currentStep() === 4;
  });
  Template.registerHelper('and', (a, b) => {
    return a && b;
  });
  Template.registerHelper('or', (a, b) => {
    return a || b;
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"server":{"accounts.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/accounts.js                                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// ServiceConfiguration.configurations.upsert({
//     service: "facebook"
// }, {
//     $set: {
//         appId: Meteor.settings.private.facebook.clientId,
//         loginStyle: "popup",
//         secret: Meteor.settings.private.facebook.secret
//     }
// });
// ServiceConfiguration.configurations.upsert({
//     service: "github"
// }, {
//     $set: {
//         clientId: Meteor.settings.private.github.clientId,
//         loginStyle: "popup",
//         secret: Meteor.settings.private.github.secret
//     }
// });
// ServiceConfiguration.configurations.upsert({
//     service: "linkedin"
// },{
//     loginStyle: "popup",
//     service: "linkedin",
//     clientId: Meteor.settings.private.linkedin.clientId,
//     secret: Meteor.settings.private.linkedin.secret,
// });
// ServiceConfiguration.configurations.upsert({
//     service: "twitter"  
// },{
//     service: "twitter",
//     consumerKey: Meteor.settings.private.twitter.clientId,
//     loginStyle: "popup",
//     secret: Meteor.settings.private.twitter.secret
// });
// ServiceConfiguration.configurations.upsert({
//     service: "google"
// }, {
//     $set: {
//         clientId: Meteor.settings.private.google.clientId,
//         loginStyle: "popup",
//         secret: Meteor.settings.private.google.secret
//     }
// });
const numberOfUsers = Meteor.users.find().count();
console.log('Checking the user accounts, number of users is: ' + numberOfUsers);

if (!numberOfUsers) {
  var id = Accounts.createUser({
    username: 'demo',
    email: 'demo@qlik.com',
    password: 'schiphol',
    profile: {
      name: 'Qlik test user'
    }
  });
  console.log('user created with id: ', id);
  Roles.addUsersToRoles(id, 'test', Roles.GLOBAL_GROUP);
  id = Accounts.createUser({
    username: 'admin',
    email: 'test@test.com',
    //these are just dummies
    password: 'Qlik456464',
    profile: {
      name: 'Qlik admin user'
    }
  });
  console.log('user created with id: ', id);
  Roles.addUsersToRoles(id, 'admin', Roles.GLOBAL_GROUP);
} //enable anon access: https://atmospherejs.com/artwells/accounts-guest


AccountsGuest.enabled = true;
AccountsGuest.anonymous = true;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods.js                                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
module.watch(require("./methods.js"));
let http;
module.watch(require("meteor/meteor"), {
  http(v) {
    http = v;
  }

}, 1);
let Apps, TemplateApps, GeneratedResources;
module.watch(require("/imports/api/apps"), {
  Apps(v) {
    Apps = v;
  },

  TemplateApps(v) {
    TemplateApps = v;
  },

  GeneratedResources(v) {
    GeneratedResources = v;
  }

}, 2);
let SenseSelections;
module.watch(require("/imports/api/logger"), {
  SenseSelections(v) {
    SenseSelections = v;
  }

}, 3);
let APILogs, REST_Log;
module.watch(require("/imports/api/APILogs"), {
  APILogs(v) {
    APILogs = v;
  },

  REST_Log(v) {
    REST_Log = v;
  }

}, 4);
let Streams;
module.watch(require("/imports/api/streams"), {
  Streams(v) {
    Streams = v;
  }

}, 5);
let Customers;
module.watch(require("/imports/api/customers"), {
  Customers(v) {
    Customers = v;
  }

}, 6);
let QSApp;
module.watch(require("/imports/api/server/QRSFunctionsApp"), {
  "*"(v) {
    QSApp = v;
  }

}, 7);
let QSStream;
module.watch(require("/imports/api/server/QRSFunctionsStream"), {
  "*"(v) {
    QSStream = v;
  }

}, 8);
let QSLic;
module.watch(require("/imports/api/server/QRSFunctionsLicense"), {
  "*"(v) {
    QSLic = v;
  }

}, 9);
let QSProxy;
module.watch(require("/imports/api/server/QPSFunctions"), {
  "*"(v) {
    QSProxy = v;
  }

}, 10);
let QSSystem;
module.watch(require("/imports/api/server/QRSFunctionsSystemRules"), {
  "*"(v) {
    QSSystem = v;
  }

}, 11);
let QSExtensions;
module.watch(require("/imports/api/server/QRSFunctionsExtension"), {
  "*"(v) {
    QSExtensions = v;
  }

}, 12);
let QSCustomProps;
module.watch(require("/imports/api/server/QRSFunctionsCustomProperties"), {
  "*"(v) {
    QSCustomProps = v;
  }

}, 13);
let senseConfig, authHeaders;
module.watch(require("/imports/api/config"), {
  senseConfig(v) {
    senseConfig = v;
  },

  authHeaders(v) {
    authHeaders = v;
  }

}, 14);
module.watch(require("/imports/startup/accounts-config.js"));
//stop on unhandled errors
process.on('unhandledRejection', up => {
  throw up;
}); //import config for Qlik Sense QRS and Engine API.

const path = require('path');

var fs = require('fs-extra');

var marked = require('marked'); //
// ─── METEOR METHODS ─────────────────────────────────────────────────────────────
//


var showdown = require("showdown");

var converter = new showdown.Converter();
Meteor.methods({
  getHTMLFromMarkdownUrl(url) {
    // console.log('get markdown from the server: '+url)
    var markdownResult = HTTP.get(url); // var HTMLresult = converter.makeHtml(markdownResult.content);

    var HTMLresult = marked.parse(markdownResult.content);
    return HTMLresult;
  },

  getSenseSelectionObject(id) {
    // console.log('------------------------------------');
    // console.log('getSenseSelectionObject for id', id)
    // console.log('------------------------------------');
    check(id, String);
    var result = SenseSelections.findOne({
      _id: id
    });
    console.log('result of get selection by id', result);
    return result;
  },

  getAppIDs() {
    return {
      SSBI: senseConfig.SSBIApp,
      // QSApp.getApps(Meteor.settings.public.SSBI.name, Meteor.settings.public.SSBI.stream)[0].id,
      slideGenerator: senseConfig.slideGeneratorAppId //QSApp.getApps(Meteor.settings.public.slideGenerator.name, Meteor.settings.public.slideGenerator.stream)[0].id

    };
  },

  generateStreamAndApp(customers) {
    return Promise.asyncApply(() => {
      try {
        check(customers, Array);
      } catch (error) {
        throw new Meteor.Error('Missing field', 'No customers supplied for the generation of apps.');
      } // first clean the environment


      Meteor.call('removeGeneratedResources', {
        'generationUserId': Meteor.userId()
      });
      Promise.await(QSApp.generateStreamAndApp(customers, this.userId)); //then, create the new stuff

      try {
        if (!Meteor.settings.broker.qlikSense.multiTenantScenario) {
          //on premise installation for a single tenant (e.g. with MS Active Directory)
          var customerNames = customers.map(function (c) {
            return c.name;
          });
          QSCustomProps.upsertCustomPropertyByName('customer', customerNames); //for non OEM scenarios (with MS AD), people like to use custom properties for authorization instead of the groups via a ticket.
        }
      } catch (error) {
        console.log('error to create custom properties', error);
      }

      Meteor.call('updateLocalSenseCopy');
    });
  },

  resetEnvironment() {
    Meteor.call('resetLoggedInUser'); //logout all users before removing all the current customers. This to prevent the screen stays logged in at an old user.

    Meteor.call('removeGeneratedResources', {
      'generationUserId': Meteor.userId()
    });
    TemplateApps.remove({
      'generationUserId': Meteor.userId()
    });
    Customers.remove({
      'generationUserId': Meteor.userId()
    });
    APILogs.remove({
      'generationUserId': Meteor.userId()
    });

    if (!Meteor.settings.broker.qlikSense.multiTenantScenario) {
      //on premise installation for a single tenant (e.g. with MS Active Directory)
      QSCustomProps.deleteCustomProperty('customers');
    }
  },

  upsertTemplate(selector, currentApp) {
    console.log('user ' + Meteor.userId() + ' selected a template app: ' + currentApp.name);
    TemplateApps.upsert(selector, {
      $set: {
        name: currentApp.name,
        id: currentApp.id,
        generationUserId: Meteor.userId()
      }
    });
  },

  removeTemplate(selector, currentApp) {
    console.log('remove template');
    TemplateApps.remove(selector);
  },

  removeGeneratedResources(generationUserSelection) {
    //console.log('remove GeneratedResources method, before we make new ones');
    //logging only
    if (generationUserSelection) {
      const call = {};
      call.action = 'Remove generated resources';
      call.request = 'Remove all apps and streams in Qlik Sense for userId: ' + generationUserSelection.generationUserId;
      REST_Log(call, generationUserSelection);
    }

    GeneratedResources.find(generationUserSelection).forEach(function (resource) {
      // this.unblock()
      //console.log('resetEnvironment for userId', Meteor.userId());generationUserSelection.generationUserId
      //If not selection was given, we want to reset the whole environment, so also delete the streams.
      // if (!generationUserSelection.generationUserId) {
      try {
        Meteor.call('deleteStream', resource.streamId); //added random company names, so this should not be an issue //26-9 can't delete stream, because each user creates a stream with the same name...
      } catch (err) {} //console.error('No issue, but you can manually remove this id from the generated database. We got one resource in the generated list, that has already been removed manually', resource);
      //don't bother if generated resources do not exists, just continue
      // }
      //delete apps always


      try {
        Meteor.call('deleteApp', resource.appId);
      } catch (err) {//console.error('No issue, but you can manually remove this id from the generated database. We got one resource in the generated list, that has already been removed manually', resource);
      }
    });
    GeneratedResources.remove(generationUserSelection);
    APILogs.remove(generationUserSelection);
  },

  copyApp(guid, name) {
    check(guid, String);
    check(name, String);
    const id = QSApp.copyApp(guid, name);
    Meteor.call('updateLocalSenseCopy');
    return id;
  },

  copyAppSelectedCustomers(currentApp) {
    //the app the user clicked on        
    if (!currentApp) {
      throw new Meteor.Error('No App selected to copy');
    }

    ;
    customers = Customers.find({
      'generationUserId': Meteor.userId(),
      checked: true
    }); //all selected customers

    if (!customers) {
      throw new Meteor.Error('No customers selected to copy the app for');
    }

    ;
    customers.forEach(customer => {
      const newAppId = Meteor.call('copyApp', currentApp.id, customer.name + '-' + currentApp.name);
      Meteor.call('updateLocalSenseCopy'); //store in the database that the user generated something, so we can later on remove it.

      GeneratedResources.insert({
        'generationUserId': Meteor.userId(),
        'customer': null,
        'streamId': null,
        'appId': newAppId
      });
    });
  },

  deleteApp(guid) {
    check(guid, String);

    if (guid !== Meteor.settings.public.templateAppId) {
      //logging only
      const call = {};
      call.action = 'Delete app';
      call.request = 'Delete app: ' + guid;
      REST_Log(call);
      const id = QSApp.deleteApp(guid);
      Meteor.call('updateLocalSenseCopy');
      return id;
    } else {
      throw new Meteor.Error("you can't delete the template app with guid: ", guid);
    }
  },

  removeAllCustomers: function () {
    return Customers.remove({
      'generationUserId': Meteor.userId()
    });
  }
});
Meteor.methods({
  updateLocalSenseCopyApps() {
    //delete the local content of the database before updating it
    Apps.remove({}); //Update the Apps with fresh info from Sense        

    _.each(QSApp.getApps(), app => {
      Apps.insert(app);
    });
  },

  updateLocalSenseCopyStreams() {
    //delete the local content of the database before updating it        
    Streams.remove({}); //Update the Streams with fresh info from Sense        

    _.each(QSStream.getStreams(), stream => {
      Streams.insert(stream);
    });
  },

  updateLocalSenseCopy() {
    // //console.log('Method: update the local mongoDB with fresh data from Qlik Sense: call QRS API getStreams and getApps');
    //delete the local content of the database before updating it
    Apps.remove({});
    Streams.remove({}); //Update the Apps and Streams with fresh info from Sense        

    _.each(QSApp.getApps(), app => {
      Apps.insert(app);
    });

    _.each(QSStream.getStreams(), stream => {
      Streams.insert(stream);
    });
  },

  getSecurityRules() {
    return QSSystem.getSecurityRules();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"proxy.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/proxy.js                                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
//SETUP PROXY SERVER TO RUN METEOR QRS AND WEB INTEGRATION DEMO BOTH ON PORT 80
// var proxy = require('redbird')({ port: Meteor.settings.public.proxyPort, ntlm: true, bunyan: false }); //bunyan:true for logging output in the console    
// Route to any local ip, for example from docker containers.
// Meteor.startup(() => {
//     proxy.register(Meteor.settings.public.qlikSenseHost, "http://localhost:3000"); //need subdomain otherwise meteor root-URL does not work
//     proxy.register(Meteor.settings.public.webIntegrationHost, "http://localhost:3030"); //need subdomain otherwise meteor root-URL does not work
//     proxy.register('slides.qlik.com', "http://localhost:3060"); //need subdomain otherwise meteor root-URL does not work
//     proxy.register('integration.qlik.com', "http://localhost:3000"); //need subdomain otherwise meteor root-URL does not work
//     proxy.register('saasdemo.qlik.com', "http://localhost:3000"); //need subdomain otherwise meteor root-URL does not work
// });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/publications.js                                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Apps, TemplateApps, GeneratedResources;
module.watch(require("/imports/api/apps"), {
  Apps(v) {
    Apps = v;
  },

  TemplateApps(v) {
    TemplateApps = v;
  },

  GeneratedResources(v) {
    GeneratedResources = v;
  }

}, 0);
let Streams;
module.watch(require("/imports/api/streams"), {
  Streams(v) {
    Streams = v;
  }

}, 1);
let Customers;
module.watch(require("/imports/api/customers"), {
  Customers(v) {
    Customers = v;
  }

}, 2);
let APILogs;
module.watch(require("/imports/api/APILogs"), {
  APILogs(v) {
    APILogs = v;
  }

}, 3);
let Logger, SenseSelections;
module.watch(require("/imports/api/logger"), {
  Logger(v) {
    Logger = v;
  },

  SenseSelections(v) {
    SenseSelections = v;
  }

}, 4);
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 5);
Meteor.publish('Logger', function () {
  return Logger.find();
  this.ready();
}); // Meteor.publish('SenseSelections', function() {
//     return SenseSelections.find({ 'userId': this.userId });
//     this.ready();
// });
//only fill the local mongoDB that runs in the browser with data that belongs to the user...
//https://www.meteor.com/tutorials/blaze/publish-and-subscribe

Meteor.publish('apps', function (generatedAppsFromUser) {
  if (Roles.userIsInRole(this.userId, ['admin'], Roles.GLOBAL_GROUP)) {
    return Apps.find();
  } else {
    //console.log('Client subscribed to collection, with these generated app ids: ', generatedAppsFromUser);
    if (!generatedAppsFromUser) {
      generatedAppsFromUser = []; // console.log('##### No generated resources exists yet, so only show the template apps')
    } else {// console.log('### publication recevied these generated app ids for the user: ', generatedAppsFromUser);
      }

    return Apps.find({
      $or: [{
        "id": {
          "$in": generatedAppsFromUser
        }
      }, {
        "stream.name": "Templates" //, { "stream.name": "Everyone" }

      }]
    });
  }

  this.ready();
});
Meteor.publish('streams', function (generatedStreamsFromUser) {
  if (Roles.userIsInRole(this.userId, ['admin'], Roles.GLOBAL_GROUP)) {
    return Streams.find();
  } else {
    if (!generatedStreamsFromUser) {
      generatedStreamsFromUser = [];
    }

    return Streams.find({
      $or: [{
        "id": {
          "$in": generatedStreamsFromUser
        }
      }, {
        "name": "Templates" //, { "name": "Everyone" }

      }]
    });
  }

  this.ready();
});
Meteor.publish('templateApps', function () {
  return TemplateApps.find({
    'generationUserId': this.userId
  });
  this.ready();
});
Meteor.publish('generatedResources', function () {
  return GeneratedResources.find({
    'generationUserId': this.userId
  });
  this.ready();
});
Meteor.publish('customers', function () {
  return Customers.find({
    'generationUserId': this.userId
  });
  this.ready();
});
Meteor.publish('apiLogs', function () {
  // const selector = {
  //     "createDate": {
  //         $lt: new Date(),
  //         $gte: new Date(new Date().setDate(new Date().getDate() - 0.05))  //show only the last hour  of api logs
  //     }
  //};
  //     today: function() {
  //     var now = moment().toDate();
  //     return Posts.find({createdAt : { $gte : now }});
  // }
  const selector = {
    sort: {
      createDate: -1
    },
    limit: 15
  };
  return APILogs.find({
    'generationUserId': this.userId
  }, selector);
  this.ready();
});
Meteor.publish('users', function () {
  //See https://github.com/alanning/meteor-roles
  if (Roles.userIsInRole(this.userId, ['admin'], Roles.GLOBAL_GROUP)) {
    return Meteor.users.find();
  } else {
    // user not authorized. do not publish secrets
    this.stop();
    return;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"restEndpoints.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/restEndpoints.js                                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
//https://atmospherejs.com/simple/json-routes
JsonRoutes.add("get", "/OneCustomerWithUsers", function (req, res, next) {
  // var id = req.params.id;
  var sampleData = customer1;
  JsonRoutes.sendResult(res, {
    data: customer1
  });
});
JsonRoutes.add("get", "/multipleCustomersWithUsers", function (req, res, next) {
  // var id = req.params.id;
  var sampleData = [customer1, customer2];
  JsonRoutes.sendResult(res, {
    data: [customer1, customer2]
  });
});
var customer1 = {
  "_id": "EXpapRzZXc52B3joK",
  "name": "Ullrich - Barrows",
  "checked": true,
  "users": [{
    "name": "John",
    "group": "Consumer",
    "currentlyLoggedIn": false,
    "country": "Germany"
  }, {
    "name": "Linda",
    "group": "Contributor",
    "currentlyLoggedIn": false,
    "country": "United States"
  }, {
    "name": "Martin",
    "group": "Developer",
    "currentlyLoggedIn": false,
    "country": "Italy"
  }, {
    "name": "Paul",
    "group": "Admin",
    "currentlyLoggedIn": false,
    "country": "Italy"
  }],
  "generationUserId": "rZPZYbaWM33ZHNr6Z"
};
var customer2 = {
  "_id": "EXpapRzZXc52B3joK",
  "name": "Ullrich - Barrows",
  "checked": true,
  "users": [{
    "name": "John",
    "group": "Consumer",
    "currentlyLoggedIn": false,
    "country": "Germany"
  }, {
    "name": "Linda",
    "group": "Contributor",
    "currentlyLoggedIn": false,
    "country": "United States"
  }, {
    "name": "Martin",
    "group": "Developer",
    "currentlyLoggedIn": false,
    "country": "Italy"
  }, {
    "name": "Paul",
    "group": "Admin",
    "currentlyLoggedIn": false,
    "country": "Italy"
  }],
  "generationUserId": "rZPZYbaWM33ZHNr6Z"
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"routes.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/routes.js                                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let REST_Log;
module.watch(require("/imports/api/APILogs"), {
  REST_Log(v) {
    REST_Log = v;
  }

}, 0);
Router.route('/updateSenseInfo/apps', function (request, response, next) {
  // console.log('++++++++++++We got an incoming REST Call from the Sense Notification handler for APPS, this means the Sense Repository has changed');
  //logging only
  // var call = {};
  // call.action = 'Notification apps'
  // call.request = 'We got an incoming REST Call from the Sense Notification handler for APPS, this means the Sense Repository has changed';
  // REST_Log(call);
  Meteor.call('updateLocalSenseCopyApps');
}, {
  where: 'server'
});
Router.route('/updateSenseInfo/streams', function (request, response, next) {
  // console.log('++++++++++++We got an incoming REST Call from the Sense Notification handler for STREAMS, this means the Sense Repository has changed');
  //logging only
  // var call = {};
  // call.action = 'Notification streams'
  // call.request = 'We got an incoming REST Call from the Sense Notification handler for APPS, this means the Sense Repository has changed';
  // REST_Log(call);
  Meteor.call('updateLocalSenseCopyStreams');
}, {
  where: 'server'
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"seeds.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/seeds.js                                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Customers;
module.watch(require("../imports/api/customers.js"), {
  Customers(v) {
    Customers = v;
  }

}, 0);
var customers = // [{"name":"A&R Partners","checked":true},
// {"name":"A2Z Solutions","checked":true},
// {"name":"Aaron D. Meyer & Associates","checked":true},
// {"name":"Aaron Products","checked":true},
// {"name":"Active Data","checked":true},
// {"name":"Ben and Jerry’s","checked":true},
// {"name":"Benedict","checked":true},
// {"name":"Bizmarts","checked":true},
// {"name":"C & C  Design","checked":true},
// {"name":"C & J Engineering","checked":true},
// {"name":"CAF Systemhaus","checked":true},
// {"name":"CAM Group","checked":true},
// {"name":"Caribian Specialties","checked":true},
// {"name":"City Fresh Foods","checked":true},
// {"name":"Clearout","checked":true},
// {"name":"David Spencer Ltd.","checked":true},
// {"name":"Dayton Malleable Inc.","checked":true},
// {"name":"DCP Research","checked":true},
// {"name":"DCS International","checked":true},
// {"name":"DCS Laboratory","checked":true},
// {"name":"Deak-Perera Group.","checked":true},
// {"name":"Earth","checked":true},
// {"name":"eDistrict","checked":true},
// {"name":"EDP","checked":true},
// {"name":"Ethyl Corporation","checked":true},
// {"name":"Federal Focus","checked":true},
// {"name":"Fill It","checked":true},
// {"name":"Filmotype","checked":true},
// {"name":"Fins","checked":true},
// {"name":"Gate","checked":true},
// {"name":"Gulf and Western Industries","checked":true},
// {"name":"Harte-Hanks (formerly Locator)","checked":true},
// {"name":"Harvard Trust Company","checked":true},
// {"name":"HCHS","checked":true},
// {"name":"Healtheon","checked":true},
// {"name":"Hetrick Systems","checked":true},
// {"name":"Home Team","checked":true},
// {"name":"Homebound","checked":true},
// {"name":"IBVA","checked":true},
// {"name":"Icon","checked":true},
// {"name":"Icon Site Builders","checked":true},
// {"name":"Idyllwild","checked":true},
// {"name":"J. S. Lee Associates","checked":true},
// {"name":"K International","checked":true},
// {"name":"K.C. Irving","checked":true},
// {"name":"Kari & Associates","checked":true},
// {"name":"Karsing","checked":true},
// {"name":"Kazinformcom","checked":true},
// {"name":"KentISP","checked":true},
// {"name":"Kool-Seal","checked":true},
// {"name":"Laker Airways","checked":true},
// {"name":"Livermore  Laboratories (LSLI)","checked":true},
// {"name":"LiveWire BBS and   Favourite Links","checked":true},
// {"name":"MATRIX","checked":true},
// {"name":"Miles Laboratories, Inc.","checked":true},
// {"name":"NACSCORP","checked":true},
// {"name":"Onestar","checked":true},
// {"name":"Pace","checked":true},
// {"name":"Pacific Group","checked":true},
// {"name":"Pacific Matics","checked":true},
// {"name":"Pacific Sierra Research","checked":true},
// {"name":"Pacific Voice","checked":true},
// {"name":"Pacific West Enterprises","checked":true},
// {"name":"PacificServ","checked":true},
// {"name":"Panngea","checked":true},
// {"name":"PAP (Maintenance)","checked":true},
// {"name":"Paracel","checked":true},
// {"name":"Patient","checked":true},
// {"name":"Pinnacle Micro","checked":true},
// {"name":"QualServe","checked":true},
// {"name":"Quantum 4Xyte  Architects","checked":true},
// {"name":"Qwest","checked":true},
// {"name":"R&R Group","checked":true},
// {"name":"R.J. Matter & Associates","checked":true},
// {"name":"Ra Co Amo","checked":true},
// {"name":"RC","checked":true},
// {"name":"Ready-to-Run","checked":true},
// {"name":"Remedy","checked":true},
// {"name":"Renegade info Crew","checked":true},
// {"name":"Reuters Usability Group","checked":true},
// {"name":"ReviewBooth","checked":true},
// {"name":"RFI Corporation","checked":true},
// {"name":"Road Warrior International","checked":true},
// {"name":"Robust Code","checked":true},
// {"name":"Sage","checked":true},
// {"name":"Sagent","checked":true},
// {"name":"Salamander Junction","checked":true},
// {"name":"Satronix","checked":true},
// {"name":"Satyam","checked":true},
// {"name":"Scientific Atlanta","checked":true},
// {"name":"ScotGold Products","checked":true},
// {"name":"Screen Saver.com","checked":true},
// {"name":"Sifton Properties Limited","checked":true},
// {"name":"Sigma","checked":true},
// {"name":"Signature","checked":true},
// {"name":"SignatureFactory","checked":true},
// {"name":"Soloman Brothers","checked":true},
// {"name":"Southern Company","checked":true},
// {"name":"Stone Consolidated Corporation","checked":true},
// {"name":"Talou","checked":true},
// {"name":"Tampere","checked":true},
// {"name":"Tandy Corporation","checked":true},
// {"name":"Tangent","checked":true},
// {"name":"Tao Group","checked":true},
// {"name":"Target Marketing","checked":true},
// {"name":"Team ASA","checked":true},
// {"name":"Team Financial Management Systems","checked":true},
// {"name":"Teca-Print","checked":true},
// {"name":"Time Warner","checked":true},
// {"name":"Towmotor Corporation","checked":true},
// {"name":"Tredegar Company","checked":true},
// {"name":"Trend Line Corporation","checked":true},
// {"name":"U. S. Exchange","checked":true},
// {"name":"Unison Management Concepts","checked":true},
// {"name":"United States  (USIT)","checked":true},
// {"name":"UUmail","checked":true},
// {"name":"ValiCert","checked":true},
// {"name":"Valley  Solutions","checked":true},
// {"name":"Valpatken","checked":true},
// {"name":"Vanstar","checked":true},
// {"name":"Venable","checked":true},
// {"name":"Venred","checked":true},
// {"name":"Watcom International","checked":true},
// {"name":"Xentec","checked":true},
// {"name":"Xilinx","checked":true},
// {"name":"XVT","checked":true},
// {"name":"Zero Assumption Recovery","checked":true},
// {"name":"Zilog","checked":true},
// {"name":"Zitel","checked":true},
// {"name":"Zocalo","checked":true}]
[{
  "name": "Shell",
  "collection": "Shell"
}, {
  "name": "Esso",
  "collection": "Esso"
}, {
  "name": "BP",
  "collection": "BP"
}]; //if (Customers.find().count() === 0){ 
// _.each(customers, function(customer){
//  Customers.insert(customer);
//    console.log("Inserted "+ customer.name);
// })
//}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"main.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/main.js                                                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let http;
module.watch(require("meteor/meteor"), {
  http(v) {
    http = v;
  }

}, 1);
let Apps, TemplateApps, GeneratedResources;
module.watch(require("/imports/api/apps"), {
  Apps(v) {
    Apps = v;
  },

  TemplateApps(v) {
    TemplateApps = v;
  },

  GeneratedResources(v) {
    GeneratedResources = v;
  }

}, 2);
let APILogs, REST_Log;
module.watch(require("/imports/api/APILogs"), {
  APILogs(v) {
    APILogs = v;
  },

  REST_Log(v) {
    REST_Log = v;
  }

}, 3);
let WebApp;
module.watch(require("meteor/webapp"), {
  WebApp(v) {
    WebApp = v;
  }

}, 4);
let Streams;
module.watch(require("/imports/api/streams"), {
  Streams(v) {
    Streams = v;
  }

}, 5);
let Customers;
module.watch(require("/imports/api/customers"), {
  Customers(v) {
    Customers = v;
  }

}, 6);
let QSApp;
module.watch(require("/imports/api/server/QRSFunctionsApp"), {
  "*"(v) {
    QSApp = v;
  }

}, 7);
let QSStream;
module.watch(require("/imports/api/server/QRSFunctionsStream"), {
  "*"(v) {
    QSStream = v;
  }

}, 8);
let QSLic;
module.watch(require("/imports/api/server/QRSFunctionsLicense"), {
  "*"(v) {
    QSLic = v;
  }

}, 9);
let QSProxy;
module.watch(require("/imports/api/server/QPSFunctions"), {
  "*"(v) {
    QSProxy = v;
  }

}, 10);
let QSSystem;
module.watch(require("/imports/api/server/QRSFunctionsSystemRules"), {
  "*"(v) {
    QSSystem = v;
  }

}, 11);
let QSExtensions;
module.watch(require("/imports/api/server/QRSFunctionsExtension"), {
  "*"(v) {
    QSExtensions = v;
  }

}, 12);
let QSCustomProps;
module.watch(require("/imports/api/server/QRSFunctionsCustomProperties"), {
  "*"(v) {
    QSCustomProps = v;
  }

}, 13);
let senseConfig, authHeaders;
module.watch(require("/imports/api/config"), {
  senseConfig(v) {
    senseConfig = v;
  },

  authHeaders(v) {
    authHeaders = v;
  }

}, 14);
module.watch(require("/imports/startup/accounts-config.js"));
let shell;
module.watch(require("node-powershell"), {
  default(v) {
    shell = v;
  }

}, 15);

var os = require('os'); //stop on unhandled errors


process.on("unhandledRejection", up => {
  throw up;
}); //import config for Qlik Sense QRS and Engine API.

const path = require("path");

var fs = require("fs-extra");

var connectHandler = WebApp.connectHandlers; // get meteor-core's connect-implementation
// attach connect-style middleware for response header injection

Meteor.startup(function () {
  WebApp.addHtmlAttributeHook(() => ({
    lang: 'en'
  }));
  connectHandler.use(function (req, res, next) {
    res.setHeader('access-control-allow-origin', '*');
    return next();
  });
});
Meteor.startup(function () {
  return Promise.asyncApply(() => {
    // process.env.ROOT_URL = "http://" + Meteor.settings.public.qlikSenseHost;
    // console.log(
    //     "********* We expect Qlik Sense to run on host: ",
    //     process.env.ROOT_URL + ":" + Meteor.settings.public.qlikSensePort
    // );
    // console.log('********* For END USERS we expect Sense to run on host: ', Meteor.settings.public.qlikSenseHost + ':' + Meteor.settings.public.qlikSensePort);
    Promise.await(initQlikSense());
    removeGeneratedResources();
    optimizeMongoDB();
  });
}); //
// ─── SETUP QLIK SENSE AFTER A CLEAN QlIK SENSE INSTALL ─────────────────────────────────────
//
//Check if Qlik Sense has been properly setup for this MeteorQRS tool..

function initQlikSense() {
  return Promise.asyncApply(() => {
    console.log("------------------------------------");
    console.log("INIT QLIK SENSE");
    console.log("Project root folder: ", Meteor.absolutePath);

    if (!Meteor.settings.broker.automationBaseFolder) {
      Meteor.settings.broker.automationBaseFolder = path.join(Meteor.absolutePath, ".automation");
      console.log("Meteor.settings.broker.automationBaseFolder was empty, setting it to default: ", Meteor.settings.broker.automationBaseFolder);
    }

    if (!Meteor.settings.broker.customerDataDir) {
      Meteor.settings.broker.customerDataDir = path.join(Meteor.absolutePath, "customerData");
      console.log("Meteor.settings.broker.customerDataDir was empty, setting it to default: ", Meteor.settings.broker.customerDataDir);
    }

    try {
      if (Meteor.settings.broker.runInitialQlikSenseSetup) {
        console.log("The runInitialQlikSenseSetup setting has been set to true, so we expect to have a fresh Qlik Sense installation for which we now automatically populate with the apps, streams, license, security rules etc.");

        if (Meteor.settings.broker.qlikSense.installQlikSense) {
          Promise.await(installQlikSense()); // await timeout(1000 * 60 * 20); //wait 20 minutes till the Qlik Sense installation has completed...
        }

        QSLic.insertLicense();
        QSLic.insertUserAccessRule();
        QSSystem.disableDefaultSecurityRules();
        Promise.await(QSProxy.createVirtualProxies());
        Promise.await(timeout(4000)); //wait till the proxy has restarted...

        Promise.await(QSSystem.createSecurityRules());
        QSStream.initSenseStreams();
        Promise.await(QSApp.uploadAndPublishTemplateApps());
        QSApp.setAppIDs();
        Promise.await(QSApp.createAppConnections()); //import extra connections

        QSExtensions.uploadExtensions();
        QSLic.saveSystemRules();
      } else {
        //set the app Id for the self service bi and the slide generator app, for use in the IFrames etc.
        QSApp.setAppIDs();
      } //now qlik sense has been installed, we can try to connect, and load the streams and apps into our mongoDB


      Meteor.call("updateLocalSenseCopy");
    } catch (error) {
      console.error("Main.js, initQlikSense: Failed to run the initialization of Qlik Sense. Most likely reason is that Qlik Sense has not been installed, wrong hostnames, wrong cert directory...", error);
    }
  });
} //helper functions to await a set timeout


function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sleep(fn, ...args) {
  return Promise.asyncApply(() => {
    Promise.await(timeout(3000));
    return fn(...args);
  });
} //
// ─── INSTALL QLIK SENSE ───────────────────────────────────────────────────────────
//


var installQlikSense = function () {
  return Promise.asyncApply(() => {
    console.log("installQlikSense is true in the settings file so start creating the config file for the Sense silent script..."); //we dynamically populate the Qlik sense silent installation config file, the hostname is the variable... Because we create a folder share with this name

    var configFile = `<?xml version="1.0"?>
    <SharedPersistenceConfiguration xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <DbUserName>username</DbUserName>
    <DbUserPassword>password</DbUserPassword>
    <DbHost>` + os.hostname() + `</DbHost>
    <DbPort>4432</DbPort>
    <RootDir>\\\\` + os.hostname() + `\\QlikSenseShare</RootDir>
    <StaticContentRootDir>\\\\` + os.hostname() + `\\QlikSenseShare\\StaticContent</StaticContentRootDir>
    <CustomDataRootDir>\\\\` + os.hostname() + `\\QlikSenseShare\\CustomData</CustomDataRootDir>
    <ArchivedLogsDir>\\\\` + os.hostname() + `\\QlikSenseShare\\ArchivedLogs</ArchivedLogsDir>
    <AppsDir>\\\\` + os.hostname() + `\\QlikSenseShare\\Apps</AppsDir>
    <CreateCluster>true</CreateCluster>
    <InstallLocalDb>true</InstallLocalDb>
    <ConfigureDbListener>false</ConfigureDbListener>
    <ListenAddresses>*</ListenAddresses>
    <IpRange>0.0.0.0/0</IpRange>
    </SharedPersistenceConfiguration>`; //SAVE Silent install CONFIG TO THE EXPORT FOLDER

    var file = path.join(Meteor.settings.broker.automationBaseFolder, "InstallationSoftware", "spc.cfg");
    fs.outputFile(file, configFile, "utf-8");
    console.log("------------------------------------");
    console.log('config file created! you can now run the "start.bat" in the "C:\\GitHub\QRSMeteor\\.automation\\InstallationSoftware" folder as administrator');
    console.error("We now create an error to ensure QRSMeteor stops further setup.  To test the Sense installation, you can open the QMC (also check the hostname). The QMC will ask for you license. But do not do anything like inserting the license. QRSMeteor will do this for you.");
    console.log("------------------------------------");
    throw new Error("Dummy error to make sure QRSMeteor stops running..."); //removed auto install of sense, to prevent an issue with the rights...
    // var executable = 'startSilentInstall.ps1';
    // var installer = path.join(Meteor.settings.broker.automationBaseFolder, 'InstallationSoftware', executable);
    // console.log('installer', installer)
    // await new Promise(function(resolve, reject) {
    //     try {
    //         var spawn = require("child_process").spawn,
    //             child;
    //         child = spawn("powershell.exe", [installer]);
    //         child.stdout.on("data", function(data) {
    //             console.log("Powershell Data: " + data);
    //         });
    //         child.stderr.on("data", function(data) {
    //             console.error("Powershell Errors: " + data);
    //             return reject('Error in running the silent installation script of qlik sense...');
    //         });
    //         child.on("exit", function() {
    //             console.log("Powershell Script finished");
    //             return resolve("Powershell Script finished");
    //         });
    //         child.stdin.end(); //end input.
    //     } catch (error) {
    //         console.error('error in calling the start of silent install of qlik sense, ', error);
    //     }
    // });
  });
}; // let ps = new shell({
//     executionPolicy: 'Bypass',
//     noProfile: true
// });
// var folder = Meteor.settings.broker.qlikSense.sharedPersistanceFolder;
// var name = Meteor.settings.broker.qlikSense.sharedPersistanceFolderName;
// // ps.addCommand('Write-Host Creating a shared folder on: ' + folder);
// ps.addCommand('New-Item "C:\\test" –type directory');
// // ps.addCommand('New-SmbShare –Name ' + name + ' –Path ' + folder + ' –FullAccess Everyone  ')
// ps.invoke()
//     .then(output => {
//         console.log(output);
//     })
//     .catch(err => {
//         console.error('Installation of Qlik Sense failed, make sure you check the log file in GitHub\QRSMeteor\.automation\InstallationSoftware\log.txt', err)
//         ps.dispose();
//     });
//
// ─── REMOVE STREAMS AND APPS CREATED DURING THE SAAS DEMO ───────────────────────
//


function removeGeneratedResources() {
  // console.log('remove the all generated resources on each server start');
  // Meteor.setTimeout(function() {
  //     console.log('remove all generated resources in mongo and qlik sense periodically by making use of a server side timer');
  //     Meteor.call('removeGeneratedResources', {});
  // }, 0); //remove all logs directly at startup
  if (Meteor.settings.broker.automaticCleanUpGeneratedApps === "Yes") {
    Meteor.setInterval(function () {
      console.log("remove all generated resources in mongo and qlik sense periodically by making use of a server side timer");
      Meteor.call("removeGeneratedResources", {});
    }, 1 * 86400000); //remove all logs/apps/streams every 1 day
  }
}

function optimizeMongoDB() {
  // console.log('## setting up mongo indexes on generationUserId in the generated resources, customers and other collections, to increase mongo performance');
  TemplateApps._ensureIndex({
    generationUserId: 1,
    id: 1
  });

  GeneratedResources._ensureIndex({
    generationUserId: 1,
    id: 1
  });

  Apps._ensureIndex({
    id: 1
  });

  Customers._ensureIndex({
    generationUserId: 1
  });

  Streams._ensureIndex({
    id: 1
  });

  APILogs._ensureIndex({
    createdBy: 1
  });

  APILogs._ensureIndex({
    createDate: 1
  });
} //
// ─── GET AN UPDATE WHEN QLIK SENSE HAS CHANGED ──────────────────────────────────
//
// function createNotificationListeners() {
//     //Create notification listener in Qlik sense https://help.qlik.com/en-US/sense-developer/3.1/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-Notification-Remove-Change-Subscription.htm
//     //console.log('********* On meteor startup, Meteor tool registers itself at Qlik Sense to get notifications from Sense on changes to apps and streams.');
//     //console.log('********* we try to register a notification on this URL: HTTP post to http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/notification?name=app');
//     //console.log('********* The notification URL for Streams is: ' + Meteor.settings.private.notificationURL + '/streams');
//     try {
//         const resultApp = HTTP.post('http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/notification?name=app', {
//             headers: authHeaders,
//             params: { 'xrfkey': senseConfig.xrfkey },
//             data: Meteor.settings.private.notificationURL + '/apps'
//         })
//         const resultStream = HTTP.post('http://' + senseConfig.SenseServerInternalLanIP + ':' + senseConfig.port + '/' + senseConfig.virtualProxy + '/qrs/notification?name=stream', {
//                 headers: authHeaders,
//                 params: { 'xrfkey': senseConfig.xrfkey },
//                 data: Meteor.settings.private.notificationURL + '/streams'
//             })
//             //console.log('Register notication success');
//             // //console.log('the result from sense register App notification was: ', resultApp);
//             // //console.log('the result from sense register Stream notification was: ', resultStream);
//     } catch (err) {
//         console.error('Create notification subscription in sense qrs failed', err);
//         // throw new Meteor.Error('Create notification subscription in sense qrs failed', err);
//     }
// }
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/lib/yogiben.js");
require("/server/accounts.js");
require("/server/methods.js");
require("/server/proxy.js");
require("/server/publications.js");
require("/server/restEndpoints.js");
require("/server/routes.js");
require("/server/seeds.js");
require("/server/main.js");
//# sourceURL=meteor://💻app/app/app.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvbGliL3lvZ2liZW4uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3NlcnZlci9RUFNGdW5jdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3NlcnZlci9RUlNBUEkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3NlcnZlci9RUlNGdW5jdGlvbnNBcHAuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3NlcnZlci9RUlNGdW5jdGlvbnNDdXN0b21Qcm9wZXJ0aWVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL2FwaS9zZXJ2ZXIvUVJTRnVuY3Rpb25zRXh0ZW5zaW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL2FwaS9zZXJ2ZXIvUVJTRnVuY3Rpb25zTGljZW5zZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvc2VydmVyL1FSU0Z1bmN0aW9uc1N0cmVhbS5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvc2VydmVyL1FSU0Z1bmN0aW9uc1N5c3RlbVJ1bGVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL2FwaS9BUElMb2dzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL2FwaS9hcHBzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL2FwaS9jb25maWcuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2N1c3RvbWVycy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvbG9nZ2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL2FwaS9zdHJlYW1zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL3N0YXJ0dXAvYWNjb3VudHMtY29uZmlnLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL3VpL1VJSGVscGVycy5qcyIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL2FjY291bnRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvbWV0aG9kcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL3Byb3h5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvcHVibGljYXRpb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvcmVzdEVuZHBvaW50cy5qcyIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL3JvdXRlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL3NlZWRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvbWFpbi5qcyJdLCJuYW1lcyI6WyJtb2R1bGUxIiwibW9kdWxlIiwiZXhwb3J0IiwiY3JlYXRlVmlydHVhbFByb3hpZXMiLCJnZXRWaXJ0dWFsUHJveGllcyIsImxvZ291dFVzZXIiLCJnZXRSZWRpcmVjdFVSTCIsIk1ldGVvciIsIndhdGNoIiwicmVxdWlyZSIsInYiLCJDdXN0b21lcnMiLCJkdW1teUN1c3RvbWVycyIsImR1bW15Q3VzdG9tZXIiLCJSRVNUX0xvZyIsImdpdEh1YkxpbmtzIiwic2Vuc2VDb25maWciLCJhdXRoSGVhZGVycyIsInFsaWtzcnYiLCJjb25maWdDZXJ0aWNhdGVzIiwidmFsaWRhdGVKU09OIiwicXJzU3J2IiwibG9kYXNoIiwiZGVmYXVsdCIsImZzIiwicGF0aCIsIm9zIiwiaXAiLCJ2NCIsInV1aWR2NCIsIl8iLCJjb25zb2xlIiwibG9nIiwiZmlsZSIsImpvaW4iLCJzZXR0aW5ncyIsImJyb2tlciIsImF1dG9tYXRpb25CYXNlRm9sZGVyIiwicHJveHlTZXR0aW5ncyIsInJlYWRKc29uIiwiZXJyIiwiRXJyb3IiLCJ2cFRvQ3JlYXRlIiwid2Vic29ja2V0Q3Jvc3NPcmlnaW5XaGl0ZUxpc3QiLCJwdXNoIiwicHVibGljIiwicWxpa1NlbnNlSG9zdCIsImFkZHJlc3MiLCJob3N0bmFtZSIsImV4aXN0aW5nUHJveGllcyIsImZvdW5kIiwic29tZSIsImV4aXN0aW5nVlAiLCJwcmVmaXgiLCJ2aXJ0dWFsUHJveHkiLCJjcmVhdGVWaXJ0dWFsUHJveHkiLCJsaW5rVmlydHVhbFByb3h5VG9Qcm94eSIsImVycm9yIiwibG9hZEJhbGFuY2luZ1NlcnZlck5vZGVzIiwiaWQiLCJnZXRTZXJ2ZXJOb2RlQ29uZmlndXJhdGlvbiIsImNoZWNrIiwiT2JqZWN0IiwicmVxdWVzdCIsInJlc3BvbnNlIiwiSFRUUCIsImNhbGwiLCJwYXJhbXMiLCJ4cmZrZXkiLCJucG1SZXF1ZXN0T3B0aW9ucyIsImRhdGEiLCJwcm94eUlkIiwiZ2V0UHJveHlJZCIsInByb3h5Q29uZmlnIiwiZ2V0UHJveHlTZXJ2aWNlQ29uZmlndXJhdGlvbiIsInZpcnR1YWxQcm94aWVzIiwicWxpa1NlbnNlUG9ydCIsIk51bWJlciIsInFsaWtTZW5zZVBvcnRTZWN1cmUiLCJxbGlrU2Vuc2UiLCJwcm94eUFsbG93SFRUUCIsIkJvb2xlYW4iLCJ1bmVuY3J5cHRlZExpc3RlblBvcnQiLCJsaXN0ZW5Qb3J0IiwiYWxsb3dIdHRwIiwidXBkYXRlUHJveHkiLCJTdHJpbmciLCJvdXRwdXRGaWxlIiwiSlNPTiIsInN0cmluZ2lmeSIsIm1ldGhvZHMiLCJjdXJyZW50bHlMb2dnZWRJblVzZXIiLCJhY3Rpb24iLCJ1c2VySWQiLCJjdXN0b21lciIsImZpbmRPbmUiLCJnZW5lcmF0aW9uVXNlcklkIiwidXNlciIsImZpbmQiLCJ1c2VycyIsImN1cnJlbnRseUxvZ2dlZEluIiwiZ2V0UmVkaXJlY3RVcmwiLCJwcm94eVJlc3RVcmkiLCJ0YXJnZXRJZCIsImxvZ2dlZEluVXNlciIsInBhc3Nwb3J0IiwiVXNlckRpcmVjdG9yeSIsIlVzZXJJZCIsIm5hbWUiLCJBdHRyaWJ1dGVzIiwiZ3JvdXAiLCJ0b1VwcGVyQ2FzZSIsImNvdW50cnkiLCJ1cmwiLCJjcmVhdGVwYXNzcG9ydCIsImdldFRpY2tldE51bWJlciIsInVzZXJQcm9wZXJ0aWVzIiwicmVxdWVzdFRpY2tldFdpdGhQYXNzcG9ydCIsInByb3h5R2V0VGlja2V0VVJJIiwiU2Vuc2VTZXJ2ZXJJbnRlcm5hbExhbklQIiwicHJpdmF0ZSIsInByb3h5UG9ydCIsImhlYWRlcnMiLCJtZXNzYWdlIiwiVGlja2V0IiwiZ2V0SldUVG9rZW4iLCJ1dWlkIiwic3ViIiwiZW1haWwiLCJncm91cHMiLCJHcm91cHMiLCJnZW5UIiwidG9rZW4iLCJnZW5lcmF0ZSIsImNlcnRpZmljYXRlc0RpcmVjdG9yeSIsInJlc2V0TG9nZ2VkSW5Vc2VyIiwiZm9yRWFjaCIsInVwZGF0ZWRVc2VycyIsIm1hcCIsInVwZGF0ZSIsIl9pZCIsIiRzZXQiLCJsb2dvdXRQcmVzZW50YXRpb25Vc2VyIiwiVURDIiwic2xpZGVHZW5lcmF0b3IiLCJsb2dvdXRWaXJ0dWFsUHJveHlDbGllbnRVc2FnZVVzZXIiLCJ2aXJ0dWFsUHJveHlDbGllbnRVc2FnZSIsInNpbXVsYXRlVXNlckxvZ2luIiwicXVlcnkiLCJudW1iZXJBZmZlY3RlZERvY3VtZW50cyIsImluc2VydER1bW15Q3VzdG9tZXJzIiwicmVzZXRQYXNzd29yZE9yQ3JlYXRlVXNlciIsInBhc3N3b3JkIiwidXNlckV4aXN0cyIsIkFjY291bnRzIiwiZmluZFVzZXJCeUVtYWlsIiwic2V0UGFzc3dvcmQiLCJjcmVhdGVVc2VyIiwiUm9sZXMiLCJhZGRVc2Vyc1RvUm9sZXMiLCJlYWNoIiwiaW5zZXJ0IiwicHJveHkiLCJ0aWNrZXRSZXF1ZXN0Qm9keSIsIlRhcmdldElkIiwicmVxdWVzdFRpY2tldCIsInRpY2tldFJlc3BvbnNlIiwiVGFyZ2V0VXJpIiwiaW5kZXhPZiIsInJlZGlyZWN0VVJJIiwidXNlU1NMIiwiaG9zdCIsImh1YiIsInBvcnQiLCJteVFSUyIsImh0dHAiLCJteVFSU01haW4iLCJnZXQiLCJlbmRwb2ludCIsImNoZWNrUGF0aCIsIm5ld1BhcmFtcyIsImFzc2lnbiIsImxlbmd0aCIsInBvc3QiLCJkZWwiLCJwdXQiLCJ1cGxvYWRBbmRQdWJsaXNoVGVtcGxhdGVBcHBzIiwiZ2VuZXJhdGVTdHJlYW1BbmRBcHAiLCJzZXRBcHBJRHMiLCJjcmVhdGVBcHBDb25uZWN0aW9ucyIsImNyZWF0ZUFwcENvbm5lY3Rpb24iLCJjb3B5QXBwIiwiZ2V0QXBwcyIsImRlbGV0ZUFwcCIsInB1Ymxpc2hBcHAiLCJpbXBvcnRBcHAiLCJBcHBzIiwiVGVtcGxhdGVBcHBzIiwiR2VuZXJhdGVkUmVzb3VyY2VzIiwiUVNTdHJlYW0iLCJTdHJlYW1zIiwicWxpa0hEUlNlcnZlciIsImVuaWdtYVNlcnZlckNvbmZpZyIsInFycyIsIl9zbGlkZUdlbmVyYXRvckFwcElkIiwiQVBJTG9ncyIsImVuaWdtYSIsInByb21pc2UiLCJzYW5pdGl6ZSIsIm5ld0ZvbGRlciIsImV2ZXJ5T25lU3RyZWFtSWQiLCJnZXRTdHJlYW1CeU5hbWUiLCJFdmVyeW9uZUFwcFN0cmVhbU5hbWUiLCJ0ZW1wbGF0ZVN0cmVhbUlkIiwiVGVtcGxhdGVBcHBTdHJlYW1OYW1lIiwiQVBJQXBwc1N0cmVhbUlEIiwiQVBJQXBwU3RyZWFtTmFtZSIsImFwcHNJbkZvbGRlciIsInJlYWRkaXIiLCJQcm9taXNlIiwiYWxsIiwiUVZGIiwiYXBwTmFtZSIsInN1YnN0ciIsImZpbGVQYXRoIiwiYXBwSWQiLCJ1cGxvYWRBcHAiLCJfU1NCSUFwcCIsImNvcGllZEFwcElkIiwiY3VzdG9tZXJzIiwidGVtcGxhdGVBcHBzIiwiY2hlY2tUZW1wbGF0ZUFwcEV4aXN0cyIsImNoZWNrQ3VzdG9tZXJzQXJlU2VsZWN0ZWQiLCJ0ZW1wbGF0ZUFwcCIsImdlbmVyYXRlQXBwRm9yVGVtcGxhdGUiLCJzdHJlYW0iLCJzZWxlY3Rpb25TaGVldCIsImRhdGFPYmplY3QiLCJzbGlkZU9iamVjdCIsIlNTQkkiLCJzaGVldElkIiwic2xpZGVHZW5lcmF0b3JBcHBzIiwiU1NCSUFwcHMiLCJTU0JJQXBwIiwic2xpZGVHZW5lcmF0b3JBcHBJZCIsImNyZWF0ZWRCeSIsInN0cmVhbUlkIiwiY2hlY2tTdHJlYW1TdGF0dXMiLCJjdXN0b21lckRhdGFGb2xkZXIiLCJjcmVhdGVEaXJlY3RvcnkiLCJjcmVhdGVEYXRhQ29ubmVjdGlvblBlckN1c3RvbWVyIiwibmV3QXBwSWQiLCJyZXN1bHQiLCJyZWxvYWRBcHBBbmRSZXBsYWNlU2NyaXB0dmlhRW5naW5lIiwicHVibGlzaGVkQXBwSWQiLCJuZXdBcHBOYW1lIiwic2NyaXB0UmVwbGFjZSIsImNvbmZpZyIsInByb2Nlc3MiLCJvbiIsInVwIiwicWl4IiwiZ2V0U2VydmljZSIsInJlcGxhY2VBbmRSZWxvYWRBcHAiLCJzY3JpcHQiLCJnZXRTY3JpcHQiLCJzZXRTY3JpcHQiLCJyZXBsYWNlU2NyaXB0IiwiZG9SZWxvYWQiLCJyZWxvYWRBcHAiLCJzYXZlQXBwIiwiZG9TYXZlIiwic2Vuc2VEZW1vTWF0ZXJpYWxzIiwiYWJzb2x1dGVQYXRoIiwiYyIsImRhdGFDb25uZWN0aW9ucyIsInR5cGUiLCJjb25uZWN0aW9uU3RyaW5nIiwicUNvbm5lY3Rpb25JZCIsImNyZWF0ZUNvbm5lY3Rpb24iLCJkZWxldGVEaXJlY3RvcnlBbmREYXRhQ29ubmVjdGlvbiIsImN1c3RvbWVyTmFtZSIsImZpbGVuYW1lIiwiZGlyIiwiY3VzdG9tZXJEYXRhRGlyIiwiZW5zdXJlRGlyIiwiZmV0Y2giLCJyZXNvbHZlIiwicmVqZWN0IiwiZm9ybURhdGEiLCJteV9maWxlIiwiY3JlYXRlUmVhZFN0cmVhbSIsImhlYWRlclZhbHVlIiwicmVzIiwiYm9keSIsInBhcnNlIiwiZ3VpZCIsIm5ld0d1aWQiLCJjcmVhdGVTdHJlYW0iLCJhcHBHdWlkIiwiZmlsZU5hbWUiLCJjcmVhdGVDdXN0b21Qcm9wZXJ0eSIsInVwc2VydEN1c3RvbVByb3BlcnR5QnlOYW1lIiwiZGVsZXRlQ3VzdG9tUHJvcGVydHkiLCJnZXRDdXN0b21Qcm9wZXJ0aWVzIiwibmV3UHJvcGVydHkiLCJ0b1N0cmluZyIsImNob2ljZVZhbHVlcyIsIkFycmF5IiwiZXhpc3RpbmdQcm9wZXJ0eSIsInVwZGF0ZWRQcm9wZXJ0eSIsImN1c3RvbVByb3BlcnR5IiwiZmlsdGVyIiwiY3VzdG9tUHJvcGVydGllcyIsInVwbG9hZEV4dGVuc2lvbnMiLCJleHRlbnNpb25zRm9sZGVyIiwiZXh0ZW5zaW9ucyIsImV4dGVuc2lvbiIsInVwbG9hZEV4dGVuc2lvbiIsImJhc2VuYW1lIiwiZ2V0TGljZW5zZSIsImluc2VydExpY2Vuc2UiLCJpbnNlcnRVc2VyQWNjZXNzUnVsZSIsImdldFN5c3RlbVJ1bGVzIiwic2F2ZVN5c3RlbVJ1bGVzIiwiZGVtb1VzZXJBY2Nlc3NSdWxlIiwibGljIiwiZXhpc3RpbmdMaWNlbnNlIiwibmV3TGljZW5zZSIsImxpY2Vuc2UiLCJzZXJpYWwiLCJvcmdhbml6YXRpb24iLCJMaWNlbnNlQ29udHJvbE51bWJlciIsImNvbnRyb2wiLCJsaWNlbnNlUnVsZSIsInJ1bGVFeGlzdCIsInJ1bGVzIiwiaW5pdFNlbnNlU3RyZWFtcyIsImRlbGV0ZVN0cmVhbSIsImdldFN0cmVhbXMiLCJxbGlrU2VydmVyIiwic3RyZWFtTmFtZSIsIlN0cmVhbXNUb0NyZWF0ZUF1dG9tYXRpY2FsbHkiLCJnZXRTZWN1cml0eVJ1bGVzIiwiZGlzYWJsZURlZmF1bHRTZWN1cml0eVJ1bGVzIiwiY3JlYXRlU2VjdXJpdHlSdWxlcyIsIlFTTGljIiwicnVsZU5hbWUiLCJzZWN1cml0eSIsInJ1bGVzVG9EaXNhYmxlIiwicnVsZURlZmluaXRpb24iLCJkaXNhYmxlZCIsIndhcm4iLCJzZWN1cml0eVJ1bGVzIiwicnVsZSIsInN0cmluZ1RvSlNPTiIsIm15U3RyaW5nIiwibXlKU09OU3RyaW5nIiwibXlFc2NhcGVkSlNPTlN0cmluZyIsInJlcGxhY2UiLCJNb25nbyIsIkNvbGxlY3Rpb24iLCJjcmVhdGVEYXRlIiwiRGF0ZSIsIm1pc3NpbmdQYXJhbWV0ZXJzIiwiUmFuZG9tIiwiX1FJWFNjaGVtYSIsImlzQ2xpZW50IiwiX3NlbnNlQ29uZmlnIiwid2ViSW50ZWdyYXRpb25EZW1vUG9ydCIsImlzU2VydmVyIiwiUVJTY29uZmlnIiwic3NsUm9vdENhcyIsImNyeXB0byIsImVudiIsImluamVjdCIsImJsdWViaXJkIiwiV2ViU29ja2V0Iiwid2ViSW50ZWdyYXRpb25Ib3N0IiwiZ2VuZXJhdGVYcmZrZXkiLCJoZWFkZXJLZXkiLCJVU0VSRE9NQUlOIiwiVVNFUk5BTUUiLCJpc1NlY3VyZSIsInFyc1BvcnQiLCJlbmdpbmVQb3J0IiwiX2NlcnRzIiwiZW5naW5lQ29uZmlnIiwiY2EiLCJyZWFkRmlsZVN5bmMiLCJrZXkiLCJjZXJ0IiwicWxpa1VzZXJEb21haW4iLCJxbGlrVXNlciIsImNvbm5lY3RUb1NlbnNlQXNVc2VyRGlyZWN0b3J5IiwiY29ubmVjdFRvU2Vuc2VBc1VzZXIiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJfZW5naW5lQ29uZmlnIiwicGFzc3BocmFzZSIsImFwcG5hbWUiLCJRSVhTY2hlbWEiLCJzY2hlbWEiLCJzZXNzaW9uIiwiY3JlYXRlU29ja2V0IiwiaGV4U3RyaW5nIiwiZSIsImF1dGhlbnRpY2F0aW9uIiwic3RhcnR1cCIsInNwbGl0Iiwic2VwIiwiZXhhbXBsZVNldHRpbmdzRmlsZSIsImtleXNFcXVhbCIsImNvbXBhcmVLZXlzIiwib2JqIiwiaGFzU2FtZVByb3BzIiwib2JqMSIsIm9iajIiLCJrZXlzIiwiZXZlcnkiLCJwcm9wIiwiaGFzT3duUHJvcGVydHkiLCJvYmplY3RzIiwiYWxsS2V5cyIsInJlZHVjZSIsIm9iamVjdCIsImNvbmNhdCIsInVuaW9uIiwiU2V0Iiwic2l6ZSIsInVwZGF0ZVVzZXJGb3JDdXN0b21lciIsInVwZGF0ZWRVc2VyIiwic2VsZWN0aW9uIiwiYXR0YWNoU2NoZW1hIiwiU2ltcGxlU2NoZW1hIiwibGFiZWwiLCJjaGVja2VkIiwib3B0aW9uYWwiLCJkZWZhdWx0VmFsdWUiLCJjcmVhdGVkQXQiLCJhdXRvVmFsdWUiLCJhbGxvd2VkVmFsdWVzIiwiZmFrZXIiLCJjb21wYW55IiwiY29tcGFueU5hbWUiLCJmaW5kTmFtZSIsIkxvZ2dlciIsIlNlbnNlU2VsZWN0aW9ucyIsIkFjY291bnRzVGVtcGxhdGVzIiwiY29uZmlndXJlIiwiY29uZmlybVBhc3N3b3JkIiwiZW5hYmxlUGFzc3dvcmRDaGFuZ2UiLCJmb3JiaWRDbGllbnRBY2NvdW50Q3JlYXRpb24iLCJvdmVycmlkZUxvZ2luRXJyb3JzIiwic2VuZFZlcmlmaWNhdGlvbkVtYWlsIiwibG93ZXJjYXNlVXNlcm5hbWUiLCJmb2N1c0ZpcnN0SW5wdXQiLCJzaG93QWRkUmVtb3ZlU2VydmljZXMiLCJzaG93Rm9yZ290UGFzc3dvcmRMaW5rIiwic2hvd0xhYmVscyIsInNob3dQbGFjZWhvbGRlcnMiLCJzaG93UmVzZW5kVmVyaWZpY2F0aW9uRW1haWxMaW5rIiwiY29udGludW91c1ZhbGlkYXRpb24iLCJuZWdhdGl2ZUZlZWRiYWNrIiwibmVnYXRpdmVWYWxpZGF0aW9uIiwicG9zaXRpdmVWYWxpZGF0aW9uIiwicG9zaXRpdmVGZWVkYmFjayIsInNob3dWYWxpZGF0aW5nIiwiaG9tZVJvdXRlUGF0aCIsInJlZGlyZWN0VGltZW91dCIsInRleHRzIiwiYnV0dG9uIiwic2lnblVwIiwic29jaWFsU2lnblVwIiwic29jaWFsSWNvbnMiLCJ0aXRsZSIsImZvcmdvdFB3ZCIsImNvbmZpZ3VyZVJvdXRlIiwiY3JlYXRlUGFzcG9ydCIsInJlZGlyZWN0VVJMUmVjZWl2ZWQiLCJmcmVzaEVudmlyb25tZW50IiwiY3VycmVudFN0ZXAiLCJDb29raWVzIiwiVGVtcGxhdGUiLCJyZWdpc3RlckhlbHBlciIsImRhdGUiLCJtb21lbnQiLCJmb3JtYXQiLCJJbnRlZ3JhdGlvblByZXNlbnRhdGlvblNlbGVjdGlvblNoZWV0IiwiU2Vzc2lvbiIsInNvbWVWYWx1ZSIsImNvdW50Iiwic29ydCIsImVxdWFscyIsInN0ZXBOciIsIlJvdXRlciIsImdvIiwic2V0IiwiYSIsImIiLCJudW1iZXJPZlVzZXJzIiwidXNlcm5hbWUiLCJwcm9maWxlIiwiR0xPQkFMX0dST1VQIiwiQWNjb3VudHNHdWVzdCIsImVuYWJsZWQiLCJhbm9ueW1vdXMiLCJRU0FwcCIsIlFTUHJveHkiLCJRU1N5c3RlbSIsIlFTRXh0ZW5zaW9ucyIsIlFTQ3VzdG9tUHJvcHMiLCJtYXJrZWQiLCJzaG93ZG93biIsImNvbnZlcnRlciIsIkNvbnZlcnRlciIsImdldEhUTUxGcm9tTWFya2Rvd25VcmwiLCJtYXJrZG93blJlc3VsdCIsIkhUTUxyZXN1bHQiLCJjb250ZW50IiwiZ2V0U2Vuc2VTZWxlY3Rpb25PYmplY3QiLCJnZXRBcHBJRHMiLCJtdWx0aVRlbmFudFNjZW5hcmlvIiwiY3VzdG9tZXJOYW1lcyIsInJlc2V0RW52aXJvbm1lbnQiLCJyZW1vdmUiLCJ1cHNlcnRUZW1wbGF0ZSIsInNlbGVjdG9yIiwiY3VycmVudEFwcCIsInVwc2VydCIsInJlbW92ZVRlbXBsYXRlIiwicmVtb3ZlR2VuZXJhdGVkUmVzb3VyY2VzIiwiZ2VuZXJhdGlvblVzZXJTZWxlY3Rpb24iLCJyZXNvdXJjZSIsImNvcHlBcHBTZWxlY3RlZEN1c3RvbWVycyIsInRlbXBsYXRlQXBwSWQiLCJyZW1vdmVBbGxDdXN0b21lcnMiLCJ1cGRhdGVMb2NhbFNlbnNlQ29weUFwcHMiLCJhcHAiLCJ1cGRhdGVMb2NhbFNlbnNlQ29weVN0cmVhbXMiLCJ1cGRhdGVMb2NhbFNlbnNlQ29weSIsInB1Ymxpc2giLCJyZWFkeSIsImdlbmVyYXRlZEFwcHNGcm9tVXNlciIsInVzZXJJc0luUm9sZSIsIiRvciIsImdlbmVyYXRlZFN0cmVhbXNGcm9tVXNlciIsImxpbWl0Iiwic3RvcCIsIkpzb25Sb3V0ZXMiLCJhZGQiLCJyZXEiLCJuZXh0Iiwic2FtcGxlRGF0YSIsImN1c3RvbWVyMSIsInNlbmRSZXN1bHQiLCJjdXN0b21lcjIiLCJyb3V0ZSIsIndoZXJlIiwiV2ViQXBwIiwic2hlbGwiLCJjb25uZWN0SGFuZGxlciIsImNvbm5lY3RIYW5kbGVycyIsImFkZEh0bWxBdHRyaWJ1dGVIb29rIiwibGFuZyIsInVzZSIsInNldEhlYWRlciIsImluaXRRbGlrU2Vuc2UiLCJvcHRpbWl6ZU1vbmdvREIiLCJydW5Jbml0aWFsUWxpa1NlbnNlU2V0dXAiLCJpbnN0YWxsUWxpa1NlbnNlIiwidGltZW91dCIsIm1zIiwic2V0VGltZW91dCIsInNsZWVwIiwiZm4iLCJhcmdzIiwiY29uZmlnRmls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O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFFQTtBQUNBO0FBRUE7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBOztBQUNPLFNBQVN3RSxTQUFULENBQW1CeUcsUUFBbkIsRUFBNkJoTSxJQUE3QixFQUFtQ1osbUJBQW1CLGFBQXRELEVBQXFFLENBQ3hFO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDSDs7QUFBQSxDLENBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEk7Ozs7Ozs7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LEVBQVk7QUFBQ0MsZ0JBQVVELENBQVY7QUFBWTs7QUFBMUIsQ0FBcEQsRUFBZ0YsQ0FBaEY7QUFFZCxJQUFJMk4sWUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFBQyxVQUFPLE9BQVI7QUFBZ0IsZ0JBQWE7QUFBN0IsQ0FBRCxFQUNBO0FBQUMsVUFBTyxNQUFSO0FBQWUsZ0JBQWE7QUFBNUIsQ0FEQSxFQUVBO0FBQUMsVUFBTyxJQUFSO0FBQWEsZ0JBQWE7QUFBMUIsQ0FGQSxDQW5JQSxDLENBdUlBO0FBQ0M7QUFDQztBQUNGO0FBQ0M7QUFDRCxHOzs7Ozs7Ozs7OztB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R0F4QyxVQUFRc1gsWUFBUixDQUFxQjtBQUNqQnpOLGdCQUFZO0FBREssR0FBckI7QUFHSCxDLENBRUQ7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEkiLCJmaWxlIjoiL2FwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGltcG9ydCB7IEN1c3RvbWVycyB9IGZyb20gJy9pbXBvcnRzL2FwaS9jdXN0b21lcnMnO1xuXG5cbi8vIEFkbWluQ29uZmlnID0ge1xuLy8gICAgIGNvbGxlY3Rpb25zOiB7XG4vLyAgICAgICAgIEN1c3RvbWVyczoge1xuLy8gICAgICAgICAgICAgY29sbGVjdGlvbk9iamVjdDogQ3VzdG9tZXJzLFxuLy8gICAgICAgICB9XG4vLyAgICAgfSxcbi8vICAgICB1c2VyU2NoZW1hOiBuZXcgU2ltcGxlU2NoZW1hKHtcbi8vICAgICAgICAgJ3Byb2ZpbGUuZ2VuZGVyJzoge1xuLy8gICAgICAgICAgICAgdHlwZTogU3RyaW5nLFxuLy8gICAgICAgICAgICAgYWxsb3dlZFZhbHVlczogWydtYWxlJywgJ2ZlbWFsZSddXG4vLyAgICAgICAgIH1cbi8vICAgICB9KVxuLy8gfTtcbiIsImltcG9ydCB7IE1ldGVvciB9IGZyb20gXCJtZXRlb3IvbWV0ZW9yXCI7XG5pbXBvcnQge1xuICBDdXN0b21lcnMsXG4gIGR1bW15Q3VzdG9tZXJzLFxuICBkdW1teUN1c3RvbWVyLFxufSBmcm9tIFwiL2ltcG9ydHMvYXBpL2N1c3RvbWVyc1wiO1xuaW1wb3J0IHsgUkVTVF9Mb2cgfSBmcm9tIFwiL2ltcG9ydHMvYXBpL0FQSUxvZ3NcIjtcbmltcG9ydCB7IGdpdEh1YkxpbmtzIH0gZnJvbSBcIi9pbXBvcnRzL3VpL1VJSGVscGVyc1wiO1xudmFyIGZzID0gcmVxdWlyZShcImZzLWV4dHJhXCIpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xudmFyIG9zID0gcmVxdWlyZShcIm9zXCIpO1xudmFyIGlwID0gcmVxdWlyZShcImlwXCIpO1xuLy8gY29uc3QgdG9rZW4gPSByZXF1aXJlKFwiLi90b2tlblwiKTtcbmNvbnN0IHsgdjQ6IHV1aWR2NCB9ID0gcmVxdWlyZShcInV1aWRcIik7XG5cblxuLy9cbi8vIOKUgOKUgOKUgCBJTVBPUlQgQ09ORklHIEZPUiBRTElLIFNFTlNFIFFSUyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbi8vXG5cbmltcG9ydCB7XG4gIHNlbnNlQ29uZmlnLFxuICBhdXRoSGVhZGVycyxcbiAgcXJzU3J2IGFzIHFsaWtzcnYsXG4gIGNvbmZpZ0NlcnRpY2F0ZXMsXG4gIHZhbGlkYXRlSlNPTixcbn0gZnJvbSBcIi9pbXBvcnRzL2FwaS9jb25maWcuanNcIjtcbmltcG9ydCBsb2Rhc2ggZnJvbSBcImxvZGFzaFwiO1xuXyA9IGxvZGFzaDtcblxuLy9cbi8vIOKUgOKUgOKUgCBDUkVBVEUgVklSVFVBTCBQUk9YSUVTIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuLy9cblxuLy8gaHR0cDovL2hlbHAucWxpay5jb20vZW4tVVMvc2Vuc2UtZGV2ZWxvcGVyL0p1bmUyMDE3L1N1YnN5c3RlbXMvUmVwb3NpdG9yeVNlcnZpY2VBUEkvQ29udGVudC9SZXBvc2l0b3J5U2VydmljZUFQSS9SZXBvc2l0b3J5U2VydmljZUFQSS1WaXJ0dWFsLVByb3h5LUNyZWF0ZS5odG1cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVWaXJ0dWFsUHJveGllcygpIHtcbiAgY29uc29sZS5sb2coXCItLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cIik7XG4gIGNvbnNvbGUubG9nKFwiQ1JFQVRFIFZJUlRVQUwgUFJPWElFU1wiKTtcbiAgY29uc29sZS5sb2coXCItLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cIik7XG4gIHZhciBmaWxlID0gcGF0aC5qb2luKFxuICAgIE1ldGVvci5zZXR0aW5ncy5icm9rZXIuYXV0b21hdGlvbkJhc2VGb2xkZXIsXG4gICAgXCJwcm94eVwiLFxuICAgIFwiaW1wb3J0XCIsXG4gICAgXCJ2aXJ0dWFsUHJveHlTZXR0aW5ncy5qc29uXCJcbiAgKTtcbiAgdHJ5IHtcbiAgICAvLyBSRUFEIFRIRSBQUk9YWSBGSUxFXG4gICAgdmFyIHByb3h5U2V0dGluZ3MgPSBhd2FpdCBmcy5yZWFkSnNvbihmaWxlKTtcbiAgICB0cnkge1xuICAgICAgdmFsaWRhdGVKU09OKHByb3h5U2V0dGluZ3MpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIkNhbnQgcmVhZCB0aGUgdmlydHVhbCBwcm94eSBkZWZpbml0aW9ucyBmaWxlOiB2aXJ0dWFsUHJveHlTZXR0aW5ncy5qc29uIGluIHlvdXIgYXV0b21hdGlvbiBmb2xkZXJcIlxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvL0ZPUiBFQUNIIFBST1hZIEZPVU5EIElOIFRIRSBJTlBVVEZJTEUgKHZwVG9DcmVhdGUpLCBDUkVBVEUgSVQgSU4gU0VOU0UuIFdlIGFsc28gcHV0IHRoZSBjdXJyZW50IGlwL2hvc3QgaW4gdGhlIGxpc3Qgb2Ygc2Vuc2Ugc2luY2UgaW4gbW9zdCBjYXNlcyB0aGlzIHRvb2wgcnVucyBvbiB0aGUgc2FtZSBtYWNoaW5lIGFzIHNlbnNlLlxuICAgIGZvciAodmFyIHZwVG9DcmVhdGUgb2YgcHJveHlTZXR0aW5ncykge1xuICAgICAgaWYgKHZwVG9DcmVhdGUud2Vic29ja2V0Q3Jvc3NPcmlnaW5XaGl0ZUxpc3QpIHtcbiAgICAgICAgdnBUb0NyZWF0ZS53ZWJzb2NrZXRDcm9zc09yaWdpbldoaXRlTGlzdC5wdXNoKFxuICAgICAgICAgIE1ldGVvci5zZXR0aW5ncy5wdWJsaWMucWxpa1NlbnNlSG9zdFxuICAgICAgICApO1xuICAgICAgICB2cFRvQ3JlYXRlLndlYnNvY2tldENyb3NzT3JpZ2luV2hpdGVMaXN0LnB1c2goaXAuYWRkcmVzcygpKTtcbiAgICAgICAgdnBUb0NyZWF0ZS53ZWJzb2NrZXRDcm9zc09yaWdpbldoaXRlTGlzdC5wdXNoKG9zLmhvc3RuYW1lKCkpO1xuICAgICAgfVxuICAgICAgdmFyIGV4aXN0aW5nUHJveGllcyA9IGdldFZpcnR1YWxQcm94aWVzKCk7XG5cbiAgICAgIC8vIENIRUNLIElGIFZJUlQuIFBST1hZIEFMUkVBRFkgRVhJU1RTIElOIFNFTlNFXG4gICAgICB2YXIgZm91bmQgPSBleGlzdGluZ1Byb3hpZXMuc29tZShmdW5jdGlvbiAoZXhpc3RpbmdWUCkge1xuICAgICAgICByZXR1cm4gZXhpc3RpbmdWUC5wcmVmaXggPT09IHZwVG9DcmVhdGUucHJlZml4O1xuICAgICAgfSk7XG4gICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgIHZhciB2aXJ0dWFsUHJveHkgPSBjcmVhdGVWaXJ0dWFsUHJveHkodnBUb0NyZWF0ZSk7XG4gICAgICAgIC8vIFRIRSBWSVJUVUFMIFBST1hZIEhBUyBCRUVOIENSRUFURUQsIE5PVyBMSU5LIElUIFRPIFRIRSBDRU5UUkFMIFBST1hZXG4gICAgICAgIGxpbmtWaXJ0dWFsUHJveHlUb1Byb3h5KHZpcnR1YWxQcm94eSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICBcIlZpcnR1YWwgcHJveHkgXCIgK1xuICAgICAgICAgICAgdnBUb0NyZWF0ZS5wcmVmaXggK1xuICAgICAgICAgICAgXCIgYWxyZWFkeSBleGlzdGVkLiBXZSBkbyBub3QgdXBkYXRlIGV4aXN0aW5nIG9uZXMuXCJcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmFibGUgdG8gY3JlYXRlIHZpcnR1YWwgcHJveGllc1wiLCBlcnIpO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlVmlydHVhbFByb3h5KHZpcnR1YWxQcm94eSkge1xuICAgIC8vIGdldCBpZCBvZiBsb2NhbCBub2RlIHNvIHdlIGNhbiBsaW5rIHRoZSB2aXJ0dWFsIHByb3h5IHRvIGEgbG9hZCBiYWxhbmNpbmcgbm9kZVxuICAgIHZpcnR1YWxQcm94eS5sb2FkQmFsYW5jaW5nU2VydmVyTm9kZXMgPSBbXG4gICAgICB7XG4gICAgICAgIGlkOiBnZXRTZXJ2ZXJOb2RlQ29uZmlndXJhdGlvbigpLmlkLFxuICAgICAgfSxcbiAgICBdO1xuICAgIHRyeSB7XG4gICAgICBjaGVjayh2aXJ0dWFsUHJveHksIE9iamVjdCk7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tLUNSRUFURSBWSVJUVUFMIFBST1hZOiBcIiwgdmlydHVhbFByb3h5LnByZWZpeCk7XG5cbiAgICAgIHZhciByZXF1ZXN0ID0gcWxpa3NydiArIFwiL3Fycy92aXJ0dWFscHJveHljb25maWcvXCI7XG4gICAgICByZXNwb25zZSA9IEhUVFAuY2FsbChcIlBPU1RcIiwgcmVxdWVzdCwge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICB4cmZrZXk6IHNlbnNlQ29uZmlnLnhyZmtleSxcbiAgICAgICAgfSxcbiAgICAgICAgbnBtUmVxdWVzdE9wdGlvbnM6IGNvbmZpZ0NlcnRpY2F0ZXMsXG4gICAgICAgIGRhdGE6IHZpcnR1YWxQcm94eSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiY3JlYXRlIHZpcnR1YWwgcHJveHkgZmFpbGVkXCIsIGVycik7XG4gICAgfVxuICAgIC8vIH1cbiAgfVxufVxuXG4vLyBodHRwOi8vaGVscC5xbGlrLmNvbS9lbi1VUy9zZW5zZS1kZXZlbG9wZXIvSnVuZTIwMTcvU3Vic3lzdGVtcy9SZXBvc2l0b3J5U2VydmljZUFQSS9Db250ZW50L1JlcG9zaXRvcnlTZXJ2aWNlQVBJL1JlcG9zaXRvcnlTZXJ2aWNlQVBJLVZpcnR1YWwtUHJveHktTGluay5odG1cbmZ1bmN0aW9uIGxpbmtWaXJ0dWFsUHJveHlUb1Byb3h5KHZpcnR1YWxQcm94eSkge1xuICAvLyBjb25zb2xlLmxvZygnbGlua1ZpcnR1YWxQcm94eVRvUHJveHknLCB2aXJ0dWFsUHJveHkuaWQpO1xuXG4gIC8vIEdFVCBJRCBPRiBQUk9YWSBPTiBUSElTIEhPU1RcbiAgdmFyIHByb3h5SWQgPSBnZXRQcm94eUlkKCk7XG4gIC8vIEdFVCBUSEUgQ09ORklHIE9GIFRIRSBQUk9YWSAoV0hJQ0ggQ09OVEFJTlMgVklSVFVBTCBQUk9YSUVTKVxuICB2YXIgcHJveHlDb25maWcgPSBnZXRQcm94eVNlcnZpY2VDb25maWd1cmF0aW9uKHByb3h5SWQpO1xuICAvLyBBREQgVEhFIE5FVyBWSVJUVUFMIFBST1hZIFRPIFRIRSBFWElTVElORyBQUk9YWSBMSVNUXG4gIHByb3h5Q29uZmlnLnNldHRpbmdzLnZpcnR1YWxQcm94aWVzLnB1c2godmlydHVhbFByb3h5KTtcblxuICB0cnkge1xuICAgIGNoZWNrKE1ldGVvci5zZXR0aW5ncy5wdWJsaWMucWxpa1NlbnNlUG9ydCwgTnVtYmVyKTtcbiAgICBjaGVjayhNZXRlb3Iuc2V0dGluZ3MucHVibGljLnFsaWtTZW5zZVBvcnRTZWN1cmUsIE51bWJlcik7XG4gICAgY2hlY2soTWV0ZW9yLnNldHRpbmdzLmJyb2tlci5xbGlrU2Vuc2UucHJveHlBbGxvd0hUVFAsIEJvb2xlYW4pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICBcInNldHRpbmdzIGZpbGUgaW5jb21wbGV0ZSwgeW91ciBhcmUgbWlzc2luZyB0aGUgcWxpa3NlbnNlcG9ydCwgcWxpa1NlbnNlUG9ydFNlY3VyZSBvciBwcm94eUFsbG93SFRUUFwiXG4gICAgKTtcbiAgfVxuXG4gIC8vVVBEQVRFIFNPTUUgUFJPWFkgU0VUVElOR1NcbiAgY29uc29sZS5sb2coXCJVUERBVEUgU09NRSBQUk9YWSBTRVRUSU5HUy4uLlwiKTtcbiAgcHJveHlDb25maWcuc2V0dGluZ3MudW5lbmNyeXB0ZWRMaXN0ZW5Qb3J0ID1cbiAgICBNZXRlb3Iuc2V0dGluZ3MucHVibGljLnFsaWtTZW5zZVBvcnQ7IC8vSFRUUFxuICBwcm94eUNvbmZpZy5zZXR0aW5ncy5saXN0ZW5Qb3J0ID0gTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5xbGlrU2Vuc2VQb3J0U2VjdXJlOyAvL0hUVFBTXG4gIHByb3h5Q29uZmlnLnNldHRpbmdzLmFsbG93SHR0cCA9XG4gICAgTWV0ZW9yLnNldHRpbmdzLmJyb2tlci5xbGlrU2Vuc2UucHJveHlBbGxvd0hUVFA7XG5cbiAgLy9PVkVSV1JJVEUgVEhFIFNFVFRJTkdTIFdJVEggVEhFIENPTVBMRVRFIFVQREFURUQgT0JKRUNULlxuICB1cGRhdGVQcm94eShwcm94eUlkLCBwcm94eUNvbmZpZyk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVByb3h5KHByb3h5SWQsIHByb3h5Q29uZmlnKSB7XG4gIHRyeSB7XG4gICAgY2hlY2socHJveHlJZCwgU3RyaW5nKTtcbiAgICBjaGVjayhwcm94eUNvbmZpZywgT2JqZWN0KTtcbiAgICAvLyBjb25zb2xlLmxvZygncHJveHlDb25maWcnLCBwcm94eUNvbmZpZy5zZXR0aW5ncy52aXJ0dWFsUHJveGllcylcblxuICAgIHZhciByZXF1ZXN0ID0gcWxpa3NydiArIFwiL3Fycy9wcm94eXNlcnZpY2UvXCIgKyBwcm94eUlkO1xuICAgIHJlc3BvbnNlID0gSFRUUC5jYWxsKFwiUFVUXCIsIHJlcXVlc3QsIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICB4cmZrZXk6IHNlbnNlQ29uZmlnLnhyZmtleSxcbiAgICAgIH0sXG4gICAgICBucG1SZXF1ZXN0T3B0aW9uczogY29uZmlnQ2VydGljYXRlcyxcbiAgICAgIGRhdGE6IHByb3h5Q29uZmlnLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKFwidXBkYXRlIHByb3h5IGZhaWxlZFwiLCBlcnIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFByb3h5SWQoKSB7XG4gIHRyeSB7XG4gICAgdmFyIHJlcXVlc3QgPSBxbGlrc3J2ICsgXCIvcXJzL3Byb3h5c2VydmljZS8/eHJma2V5PVwiICsgc2Vuc2VDb25maWcueHJma2V5O1xuICAgIHJlc3BvbnNlID0gSFRUUC5jYWxsKFwiR0VUXCIsIHJlcXVlc3QsIHtcbiAgICAgIG5wbVJlcXVlc3RPcHRpb25zOiBjb25maWdDZXJ0aWNhdGVzLFxuICAgIH0pO1xuICAgIHJldHVybiByZXNwb25zZS5kYXRhWzBdLmlkO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiZ2V0IHByb3h5SWQgZmFpbGVkXCIsIGVycik7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0UHJveHlTZXJ2aWNlQ29uZmlndXJhdGlvbihwcm94eUlkKSB7XG4gIHRyeSB7XG4gICAgY2hlY2socHJveHlJZCwgU3RyaW5nKTtcblxuICAgIHZhciByZXF1ZXN0ID1cbiAgICAgIHFsaWtzcnYgK1xuICAgICAgXCIvcXJzL3Byb3h5c2VydmljZS9cIiArXG4gICAgICBwcm94eUlkICtcbiAgICAgIFwiP3hyZmtleT1cIiArXG4gICAgICBzZW5zZUNvbmZpZy54cmZrZXk7XG4gICAgcmVzcG9uc2UgPSBIVFRQLmNhbGwoXCJHRVRcIiwgcmVxdWVzdCwge1xuICAgICAgbnBtUmVxdWVzdE9wdGlvbnM6IGNvbmZpZ0NlcnRpY2F0ZXMsXG4gICAgfSk7XG5cbiAgICAvL1NBVkUgUlBPWFkgQ09ORklHIFRPIFRIRSBFWFBPUlQgRk9MREVSXG4gICAgdmFyIGZpbGUgPSBwYXRoLmpvaW4oXG4gICAgICBNZXRlb3Iuc2V0dGluZ3MuYnJva2VyLmF1dG9tYXRpb25CYXNlRm9sZGVyLFxuICAgICAgXCJwcm94eVwiLFxuICAgICAgXCJleHBvcnRcIixcbiAgICAgIFwicHJveHlTZXJ2aWNlQ29uZmlndXJhdGlvbi5qc29uXCJcbiAgICApO1xuICAgIGZzLm91dHB1dEZpbGUoZmlsZSwgSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UuZGF0YSwgbnVsbCwgMiksIFwidXRmLThcIik7XG5cbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcihcImNyZWF0ZSB2aXJ0dWFsIHByb3h5IGZhaWxlZFwiLCBlcnIpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRWaXJ0dWFsUHJveGllcygpIHtcbiAgLy8gY29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tR0VUIFZJUlRVQUwgUFJPWElFUycpOy8vXG4gIHRyeSB7XG4gICAgdmFyIHJlcXVlc3QgPSBxbGlrc3J2ICsgXCIvcXJzL3ZpcnR1YWxwcm94eWNvbmZpZy9cIjtcbiAgICByZXNwb25zZSA9IEhUVFAuY2FsbChcIkdFVFwiLCByZXF1ZXN0LCB7XG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgeHJma2V5OiBzZW5zZUNvbmZpZy54cmZrZXksXG4gICAgICB9LFxuICAgICAgbnBtUmVxdWVzdE9wdGlvbnM6IGNvbmZpZ0NlcnRpY2F0ZXMsXG4gICAgfSk7XG5cbiAgICB2YXIgZmlsZSA9IHBhdGguam9pbihcbiAgICAgIE1ldGVvci5zZXR0aW5ncy5icm9rZXIuYXV0b21hdGlvbkJhc2VGb2xkZXIsXG4gICAgICBcInByb3h5XCIsXG4gICAgICBcImV4cG9ydFwiLFxuICAgICAgXCJ2aXJ0dWFsUHJveHlTZXJ2aWNlQ29uZmlndXJhdGlvbi5qc29uXCJcbiAgICApO1xuXG4gICAgLy8gU0FWRSBQUk9YWSBGSUxFIFRPIERJU0tcbiAgICBmcy5vdXRwdXRGaWxlKGZpbGUsIEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLmRhdGEsIG51bGwsIDIpLCBcInV0Zi04XCIpO1xuICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiY3JlYXRlIHZpcnR1YWwgcHJveHkgZmFpbGVkXCIsIGVycik7XG4gIH1cbn1cblxuLy8gZnVuY3Rpb24gZ2V0Q2VudHJhbFByb3h5KCkge1xuLy8gICAgIGNvbnNvbGUubG9nKCdnZXRDZW50cmFsUHJveHk6IEdFVCAvcXJzL1NlcnZlck5vZGVDb25maWd1cmF0aW9uP2ZpbHRlcj1pc0NlbnRyYWwnKVxuLy8gfVxuXG5mdW5jdGlvbiBnZXRTZXJ2ZXJOb2RlQ29uZmlndXJhdGlvbigpIHtcbiAgdHJ5IHtcbiAgICB2YXIgcmVxdWVzdCA9XG4gICAgICBxbGlrc3J2ICtcbiAgICAgIFwiL3Fycy9zZXJ2ZXJub2RlY29uZmlndXJhdGlvbi9sb2NhbD94cmZrZXk9XCIgK1xuICAgICAgc2Vuc2VDb25maWcueHJma2V5O1xuICAgIHJlc3BvbnNlID0gSFRUUC5jYWxsKFwiR0VUXCIsIHJlcXVlc3QsIHtcbiAgICAgIG5wbVJlcXVlc3RPcHRpb25zOiBjb25maWdDZXJ0aWNhdGVzLFxuICAgIH0pO1xuICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiY3JlYXRlIHZpcnR1YWwgcHJveHkgZmFpbGVkXCIsIGVycik7XG4gIH1cbn1cblxuLy9cbi8vIOKUgOKUgOKUgCBNRVRFT1IgTUVUSE9EUyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbi8vXG5cbk1ldGVvci5tZXRob2RzKHtcbiAgY3VycmVudGx5TG9nZ2VkSW5Vc2VyKCkge1xuICAgIC8vIGNvbnNvbGUubG9nKFwiTWV0ZW9yIHdpbGwgbm93IGxvb2sgd2hpY2ggdXNlciBpcyBjdXJyZW50bHkgbG9nZ2VkIGluLCBhbmQgcmVxdWVzdCBhIHRpY2tldCBmb3IgdGhpcyBJRCwgYW5kIGFkZCBoaXMgZ3JvdXAgbWVtYmVyc2hpcHMuXCIpO1xuICAgIHZhciBjYWxsID0ge307XG4gICAgY2FsbC5hY3Rpb24gPSBcIlNURVAgMzogU2VydmVyIHJlY2VpdmVkIHJlcXVlc3QgdG8gY3JlYXRlIHRpY2tldFwiO1xuICAgIGNhbGwucmVxdWVzdCA9XG4gICAgICBcIk1ldGVvciBzZXJ2ZXIgcmVjZWl2ZWQgYSBpbmNvbWluZyBtZXRob2QgY2FsbCBmcm9tIHRoZSBicm93c2VyLiBUaGUgbWV0ZW9yIHNlcnZlciB3aWxsIG5vdyBsb29rIHdoaWNoIHVzZXIgaXMgY3VycmVudGx5IGxvZ2dlZCBpbiwgYW5kIGNyZWF0ZSBhIHRpY2tldCBmb3IgdGhpcyBJRCwgYW5kIGFkZCBoaXMgZ3JvdXAgbWVtYmVyc2hpcHMuXCI7XG4gICAgUkVTVF9Mb2coY2FsbCwgTWV0ZW9yLnVzZXJJZCgpKTtcblxuICAgIC8vIGZpcnN0IGZpbmQgdGhlIGN1c3RvbWVycyB0aGF0IGhhdmUgYSBsb2dnZWQgaW4gdXNlcnMgKG1vbmdvIHJldHVybnMgYSBjb21wbGV0ZSBkb2N1bWVudClcbiAgICB2YXIgY3VzdG9tZXIgPSBDdXN0b21lcnMuZmluZE9uZSh7XG4gICAgICBnZW5lcmF0aW9uVXNlcklkOiBNZXRlb3IudXNlcklkKCksXG4gICAgICBcInVzZXJzLmN1cnJlbnRseUxvZ2dlZEluXCI6IHRydWUsXG4gICAgfSk7XG4gICAgLy8gY29uc29sZS5sb2coJ0luIG91ciBsb2NhbCBkYXRhYmFzZSB3ZSBjYW4gZmluZCB0aGUgY3VzdG9tZXIgd2l0aCB0aGUgY3VycmVudGx5TG9nZ2VkSW4gc2V0IHRvIHRydWUgZm9yIHVzZXI6ICcgKyBsb2dnZWRJblVzZXIgKyAnLCB0aGUgY3VzdG9tZXIgd2hpY2ggY29udGFpbnMgdGhlIHVzZXIgdGhhdCB0aGUgdXNlciBzZWxlY3RlZCB3aXRoIHRoZSBkcm9wZG93bjogJywgY3VzdG9tZXIpO1xuXG4gICAgLy8gbm93IHdlIGhhdmUgdGhlIGRvY3VtZW50LCB3ZSBjYW4gbG9vayBpbiB0aGUgYXJyYXkgb2YgdXNlcnMsIHRvIGZpbmQgdGhlIG9uZSB0aGF0IGlzIGxvZ2dlZCBpbi5cbiAgICB2YXIgdXNlcjtcbiAgICBpZiAoIWN1c3RvbWVyKSB7XG4gICAgICAvLyBpZiBubyB1c2VyIGlzIHNlbGVjdGVkLCBqdXN0IGluc2VydCBqb2huIGFzIGEgZHVtbXlcbiAgICAgIC8vIGNvbnN0IGVycm9yID0gJ1lvdSBoYXZlIG5vdCBzZWxlY3RlZCBhIHVzZXIgeW91IHdhbnQgdG8gc2ltdWxhdGUgdGhlIFNpbmdsZSBTaWduIG9uIHdpdGguIEZvciBkZW1vIHB1cnBvc2VzIHdlIG5vdyBzZWxlY3RlZCBKb2huIGZvciB5b3UuIFlvdSBjYW4gYWxzbyBzZWxlY3QgeW91ciBvd24gdXNlciBpbiBzdGVwIDQgb2YgdGhlIFNhYVMgZGVtbyc7XG4gICAgICB2YXIgcmVzcG9uc2UgPSB7fTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdkdW1teUN1c3RvbWVyIDonLCBkdW1teUN1c3RvbWVyKTtcbiAgICAgIHJlc3BvbnNlLnVzZXIgPSBkdW1teUN1c3RvbWVyLnVzZXI7XG4gICAgICByZXNwb25zZS5jdXN0b21lciA9IGR1bW15Q3VzdG9tZXI7XG4gICAgICAvLyB0aHJvdyBuZXcgTWV0ZW9yLldhcm5pbmcoJ05vIHVzZXInLCBlcnJvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB1c2VyID0gXy5maW5kKGN1c3RvbWVyLnVzZXJzLCB7XG4gICAgICAgIGN1cnJlbnRseUxvZ2dlZEluOiB0cnVlLFxuICAgICAgfSk7XG4gICAgICB2YXIgcmVzcG9uc2UgPSB7fTtcbiAgICAgIHJlc3BvbnNlLnVzZXIgPSB1c2VyO1xuICAgICAgcmVzcG9uc2UuY3VzdG9tZXIgPSBjdXN0b21lcjtcbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2coJ3RoZSByZXNwb25zZSBpczogJywgcmVzcG9uc2UpO1xuICAgIHJldHVybiByZXNwb25zZTtcbiAgfSxcbiAgZ2V0UmVkaXJlY3RVcmwocHJveHlSZXN0VXJpLCB0YXJnZXRJZCwgbG9nZ2VkSW5Vc2VyKSB7XG4gICAgdmFyIHJlc3BvbnNlID0gTWV0ZW9yLmNhbGwoXCJjdXJyZW50bHlMb2dnZWRJblVzZXJcIik7XG4gICAgdmFyIGN1c3RvbWVyID0gcmVzcG9uc2UuY3VzdG9tZXI7XG4gICAgdmFyIHVzZXIgPSByZXNwb25zZS51c2VyO1xuXG4gICAgY29uc29sZS5sb2coXG4gICAgICBcIlVzZXJJRCBjdXJyZW50bHkgbG9nZ2VkIGluIGluIHRoZSBkZW1vIHBsYXRmb3JtOiBcIiArXG4gICAgICAgIGxvZ2dlZEluVXNlciArXG4gICAgICAgIFwiLiBNZXRlb3Igc2VydmVyIHNpZGUgdGhpbmtzIHRoZSBtZXRlb3IudXNlcklkIGlzIFwiICtcbiAgICAgICAgTWV0ZW9yLnVzZXJJZCgpICtcbiAgICAgICAgXCIuIFdlIHVzZSB0aGlzIGFzIHRoZSBVREMgbmFtZVwiXG4gICAgKTtcbiAgICAvLyBDcmVhdGUgYSBwYXNwb29ydCAodGlja2V0KSByZXF1ZXN0OiB1c2VyIGRpcmVjdG9yeSwgdXNlciBpZGVudGl0eSBhbmQgYXR0cmlidXRlc1xuICAgIHZhciBwYXNzcG9ydCA9IHtcbiAgICAgIFVzZXJEaXJlY3Rvcnk6IE1ldGVvci51c2VySWQoKSwgLy8gU3BlY2lmeSBhIGR1bW15IHZhbHVlIHRvIGVuc3VyZSB1c2VySUQncyBhcmUgdW5pcXVlIEUuZy4gXCJEdW1teVwiLCBvciBpbiBteSBjYXNlLCBJIHVzZSB0aGUgbG9nZ2VkIGluIHVzZXIsIHNvIGVhY2ggdXNlciB3aG8gdXNlcyB0aGUgZGVtbyBjYW4gbG9nb3V0IG9ubHkgaGlzIHVzZXJzLCBvciB0aGUgbmFtZSBvZiB0aGUgY3VzdG9tZXIgZG9tYWluIGlmIHlvdSBuZWVkIGEgVmlydHVhbCBwcm94eSBwZXIgY3VzdG9tZXJcbiAgICAgIFVzZXJJZDogdXNlci5uYW1lLCAvLyB0aGUgY3VycmVudCB1c2VyIHRoYXQgd2UgYXJlIGdvaW5nIHRvIGxvZ2luIHdpdGhcbiAgICAgIEF0dHJpYnV0ZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGdyb3VwOiBjdXN0b21lci5uYW1lLnRvVXBwZXJDYXNlKCksXG4gICAgICAgIH0sIC8vIGF0dHJpYnV0ZXMgc3VwcGx5IHRoZSBncm91cCBtZW1iZXJzaGlwIGZyb20gdGhlIHNvdXJjZSBzeXN0ZW0gdG8gUWxpayBTZW5zZVxuICAgICAgICB7XG4gICAgICAgICAgZ3JvdXA6IHVzZXIuY291bnRyeS50b1VwcGVyQ2FzZSgpLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZ3JvdXA6IHVzZXIuZ3JvdXAudG9VcHBlckNhc2UoKSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfTtcbiAgICBjb25zb2xlLmxvZygnUmVxdWVzdCB0aWNrZXQgZm9yIHRoaXMgdXNlciBwYXNzcG9ydFwiOiAnLCBwYXNzcG9ydCk7XG5cbiAgICAvLyBsb2dnaW5nIG9ubHlcbiAgICB2YXIgY2FsbCA9IHt9O1xuICAgIGNhbGwuYWN0aW9uID1cbiAgICAgIFwiU1RFUCA0OiBVc2VyIGFuZCBncm91cCBpbmZvcm1hdGlvbiByZWNlaXZlZCBmcm9tIGN1c3RvbWVyIGRhdGFiYXNlLCBub3cgd2UgY2FuIHJlcXVlc3QgYSB0aWNrZXRcIjtcbiAgICBjYWxsLnVybCA9IGdpdEh1YkxpbmtzLmNyZWF0ZXBhc3Nwb3J0O1xuICAgIGNhbGwucmVxdWVzdCA9XG4gICAgICAnUmVxdWVzdCB0aWNrZXQgZm9yIHRoaXMgdXNlciBhbmQgaGlzIGdyb3VwcyAoYW4gYXJyYXkgb2YgdmFsdWVzIHdoaWNoIHlvdSBjYW4gdXNlIGluIHRoZSBzZWN1cml0eSBydWxlcyk6IFwiOiAnICtcbiAgICAgIEpTT04uc3RyaW5naWZ5KHBhc3Nwb3J0KTtcbiAgICBSRVNUX0xvZyhjYWxsLCBNZXRlb3IudXNlcklkKCkpO1xuXG4gICAgcmV0dXJuIGdldFJlZGlyZWN0VVJMKHBhc3Nwb3J0LCBwcm94eVJlc3RVcmksIHRhcmdldElkLCBNZXRlb3IudXNlcklkKCkpO1xuICB9LFxuICBnZXRUaWNrZXROdW1iZXIodXNlclByb3BlcnRpZXMsIHZpcnR1YWxQcm94eSkge1xuICAgIC8vIG9ubHkgZ2V0IGEgdGlja2V0IG51bWJlciBmb3IgYSBTUEVDSUZJQyB2aXJ0dWFsIHByb3h5XG4gICAgY29uc29sZS5sb2coJ2dldFRpY2tldE51bWJlciB1c2luZyBwcm9wZXJ0aWVzOicpXG4gICAgY29uc29sZS5sb2coJ3ZpcnR1YWxQcm94eScsIHZpcnR1YWxQcm94eSlcbiAgICBjb25zb2xlLmxvZygndXNlclByb3BlcnRpZXMnLCB1c2VyUHJvcGVydGllcylcbiAgICB0cnkge1xuICAgICAgY2hlY2sodXNlclByb3BlcnRpZXMuZ3JvdXAsIFN0cmluZyk7XG4gICAgICBjaGVjayh2aXJ0dWFsUHJveHksIFN0cmluZyk7XG4gICAgICBjaGVjayhNZXRlb3IudXNlcklkKCksIFN0cmluZyk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFxuICAgICAgICBcIkZhaWxlZCB0byBsb2dpbiBpbnRvIFFsaWsgU2Vuc2UgdmlhIGEgdGlja2V0XCIsXG4gICAgICAgIFwiV2UgY291bGQgbm90IHJlcXVlc3QgYSB0aWNrZXQgYmVjYXVzZSB0aGUgdXNlcklkIG9yIGdyb3VwcyAodGVjaG5pY2FsLCBnZW5lcmljKSBvciB2aXJ0dWFsIHByb3h5LCBvciBVREMgKHlvdXIgTWV0ZW9yIHVzZXJJZCwgYXJlIHlvdSBub3QgeWV0IGxvZ2dlZCBpbnRvIE1ldGVvcj8pIGFyZSBub3QgcHJvdmlkZWRcIlxuICAgICAgKTtcbiAgICB9XG4gICAgdmFyIHBhc3Nwb3J0ID0ge1xuICAgICAgVXNlckRpcmVjdG9yeTogTWV0ZW9yLnVzZXJJZCgpLCAvLyBTcGVjaWZ5IGEgZHVtbXkgdmFsdWUgdG8gZW5zdXJlIHVzZXJJRCdzIGFyZSB1bmlxdWUgRS5nLiBcIkR1bW15XCIsIG9yIGluIG15IGNhc2UsIEkgdXNlIHRoZSBsb2dnZWQgaW4gdXNlciwgc28gZWFjaCB1c2VyIHdobyB1c2VzIHRoZSBkZW1vIGNhbiBsb2dvdXQgb25seSBoaXMgdXNlcnMsIG9yIHRoZSBuYW1lIG9mIHRoZSBjdXN0b21lciBkb21haW4gaWYgeW91IG5lZWQgYSBWaXJ0dWFsIHByb3h5IHBlciBjdXN0b21lclxuICAgICAgVXNlcklkOiBNZXRlb3IudXNlcklkKCksIC8vIHRoZSBjdXJyZW50IHVzZXIgdGhhdCB3ZSBhcmUgZ29pbmcgdG8gbG9naW4gd2l0aFxuICAgICAgQXR0cmlidXRlczogW1xuICAgICAgICB7XG4gICAgICAgICAgZ3JvdXA6IFwic2xpZGVHZW5lcmF0b3JcIixcbiAgICAgICAgfSwgLy8gYXR0cmlidXRlcyBzdXBwbHkgdGhlIGdyb3VwIG1lbWJlcnNoaXAgZnJvbSB0aGUgc291cmNlIHN5c3RlbSB0byBRbGlrIFNlbnNlXG4gICAgICAgIHtcbiAgICAgICAgICBncm91cDogdXNlclByb3BlcnRpZXMuZ3JvdXAsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBncm91cDogXCJJVEFMWVwiLFxuICAgICAgICB9LCAvLyBtYWtlIHN1cmUgdGhlIHJvdyBsZXZlbCBkZW1vIHdvcmtzIGJ5IHBhc3NpbmcgdGhpc1xuICAgICAgXSxcbiAgICB9O1xuICAgIC8vZ2V0IHRoZSB0aWNrZXQgbnVtYmVyIGFuZCByZXR1cm4gaXQgdG8gdGhlIGNsaWVudFxuICAgIHJldHVybiBNZXRlb3IuY2FsbChcInJlcXVlc3RUaWNrZXRXaXRoUGFzc3BvcnRcIiwgdmlydHVhbFByb3h5LCBwYXNzcG9ydCk7XG4gIH0sXG4gIC8vb25seSBmb3IgZGVtbyBwdXJwb3NlcyEgbmV2ZXIgc3VwcGx5IGdyb3VwcyBmcm9tIHRoZSBjbGllbnQuLi5cbiAgcmVxdWVzdFRpY2tldFdpdGhQYXNzcG9ydCh2aXJ0dWFsUHJveHksIHBhc3Nwb3J0KSB7XG4gICAgY29uc29sZS5sb2coJ2dldFRpY2tldE51bWJlciBwYXNzcG9ydCcsIHBhc3Nwb3J0KTtcbiAgICAvLyB2YXIgcm9vdENhcyA9IHJlcXVpcmUoXCJzc2wtcm9vdC1jYXNcIikuY3JlYXRlKCk7Ly9cblxuICAgIC8vIGRlZmF1bHQgZm9yIGFsbCBodHRwcyByZXF1ZXN0c1xuXG4gICAgLy8gKHdoZXRoZXIgdXNpbmcgaHR0cHMgZGlyZWN0bHksIHJlcXVlc3QsIG9yIGFub3RoZXIgbW9kdWxlKVxuICAgIC8vIHJlcXVpcmUoXCJodHRwc1wiKS5nbG9iYWxBZ2VudC5vcHRpb25zLmNhID0gcm9vdENhcztcblxuICAgIC8vIGh0dHA6Ly9oZWxwLnFsaWsuY29tL2VuLVVTL3NlbnNlLWRldmVsb3Blci9KdW5lMjAxNy9TdWJzeXN0ZW1zL1Byb3h5U2VydmljZUFQSS9Db250ZW50L1Byb3h5U2VydmljZUFQSS9Qcm94eVNlcnZpY2VBUEktUHJveHlTZXJ2aWNlQVBJLUF1dGhlbnRpY2F0aW9uLVRpY2tldC1BZGQuaHRtXG4gICAgdmFyIHByb3h5R2V0VGlja2V0VVJJID1cbiAgICAgIFwiaHR0cHM6Ly9cIiArXG4gICAgICBzZW5zZUNvbmZpZy5TZW5zZVNlcnZlckludGVybmFsTGFuSVAgK1xuICAgICAgXCI6XCIgK1xuICAgICAgTWV0ZW9yLnNldHRpbmdzLnByaXZhdGUucHJveHlQb3J0ICtcbiAgICAgIFwiL3Fwcy9cIiArXG4gICAgICB2aXJ0dWFsUHJveHkgK1xuICAgICAgXCIvdGlja2V0XCI7IC8vIFwicHJveHlSZXN0VXJpXCI6IFwiaHR0cHM6Ly9pcC0xNzItMzEtMjItMjIuZXUtY2VudHJhbC0xLmNvbXB1dGUuaW50ZXJuYWw6NDI0My9xcHMvbWV0ZW9yL1wiLFxuICAgIC8vIGNvbnNvbGUubG9nKCdwcm94eUdldFRpY2tldFVSSScsIHByb3h5R2V0VGlja2V0VVJJKVxuICAgIHRyeSB7XG4gICAgICB2YXIgcmVzcG9uc2UgPSBIVFRQLmNhbGwoXCJQT1NUXCIsIHByb3h5R2V0VGlja2V0VVJJLCB7XG4gICAgICAgIG5wbVJlcXVlc3RPcHRpb25zOiBjb25maWdDZXJ0aWNhdGVzLFxuICAgICAgICBoZWFkZXJzOiBhdXRoSGVhZGVycyxcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgeHJma2V5OiBzZW5zZUNvbmZpZy54cmZrZXksXG4gICAgICAgIH0sXG4gICAgICAgIGRhdGE6IHBhc3Nwb3J0LCAvLyB0aGUgdXNlciBhbmQgZ3JvdXAgaW5mbyBmb3Igd2hpY2ggd2Ugd2FudCB0byBjcmVhdGUgYSB0aWNrZXRcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgXCJSRVNUIGNhbGwgdG8gcmVxdWVzdCBhIHRpY2tldCBmYWlsZWQuIFBMRUFTRSBFWFBPUlQgQU5EIElNUE9SVCBDRVJUSUZJQ0FURVMgRlJPTSBRTUMgRk9SIFRIRSBDT1JSRUNUIEhPU1ROQU1FXCIsXG4gICAgICAgIGVyclxuICAgICAgKTtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCJSZXF1ZXN0IHRpY2tldCBmYWlsZWRcIiwgZXJyLm1lc3NhZ2UpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5UaWNrZXQ7XG4gIH0sXG4gIC8vaHR0cHM6Ly9xbGlrLmRldi9hdXRoZW50aWNhdGUvand0L2NyZWF0ZS1zaWduZWQtdG9rZW5zLWZvci1qd3QtYXV0aG9yaXphdGlvblxuICBnZXRKV1RUb2tlbihwYXNzcG9ydCkge1xuICAgIGNvbnNvbGUubG9nKFwiZ2V0IEpXVCB3aXRoIHBhc3Nwb3J0XCIsIHBhc3Nwb3J0KTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCB1dWlkID0gdXVpZHY0KCk7XG4gICAgICBjb25zdCBzdWIgPSBgc3ViXyR7dXVpZH1gO1xuICAgICAgY29uc3QgbmFtZSA9IHBhc3Nwb3J0LlVzZXJJZDtcbiAgICAgIGNvbnN0IGVtYWlsID0gYCR7dXVpZH1AZGVtby5hbm9uYDtcbiAgICAgIGNvbnN0IGdyb3VwcyA9IHBhc3Nwb3J0Lkdyb3VwcztcblxuICAgICAgY29uc3QgZ2VuVCA9IHRva2VuLmdlbmVyYXRlKHN1YiwgbmFtZSwgZW1haWwsIGdyb3Vwcyk7XG4gICAgICBjb25zb2xlLmxvZyhcIvCfmoAgfiBmaWxlOiBRUFNGdW5jdGlvbnMuanM6NDIzIH4gZ2V0SldUVG9rZW4gfiBnZW5UOlwiLCBnZW5UKVxuICAgICAgcmV0dXJuIGdlblQ7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICBcInVuYWJsZSB0byBnZW5lcmF0ZSBKV1QgdG9rZW4sIGRpZCB5b3Ugc3VwcGx5IHRoZSBjb3JyZWN0IHB1YmxpYy5wZW0gYW5kIHByaXZhdGUucGVtIGluIHRoZSBkaXI6IFwiK01ldGVvci5zZXR0aW5ncy5wcml2YXRlLmNlcnRpZmljYXRlc0RpcmVjdG9yeSxcbiAgICAgICAgZXJyXG4gICAgICApO1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcImdlbmVyYXRlIGp3dCB0b2tlbiBmYWlsZWRcIiwgZXJyLm1lc3NhZ2UpO1xuICAgIH1cbiAgfSxcbiAgcmVzZXRMb2dnZWRJblVzZXIoKSB7XG4gICAgLy8gY29uc29sZS5sb2coXCIqKipNZXRob2QgcmVzZXRMb2dnZWRJblVzZXJzXCIpO1xuICAgIC8vIGNvbnNvbGUubG9nKCdjYWxsIHRoZSBRUFMgbG9nb3V0IGFwaSwgdG8gaW52YWxpZGF0ZSB0aGUgc2Vzc2lvbiBjb29raWUgZm9yIGVhY2ggdXNlciBpbiBvdXIgbG9jYWwgZGF0YWJhc2UnKTtcblxuICAgIC8vIHJlc2V0IHRoZSBsb2NhbCBkYXRhYmFzZS4gc2V0IGFsbCB1c2VycyB0byBub3QgbG9nZ2VkIGluLiBXZSBuZWVkIHRoaXMgY29kZSBiZWNhdXNlIHdlIGRvIGEgc2ltdWxhdGlvbiBvZiB0aGUgbG9naW4gYW5kIG5vdCBhIHJlYWwgZW5kIHVzZXIgbG9naW4uXG4gICAgQ3VzdG9tZXJzLmZpbmQoe1xuICAgICAgZ2VuZXJhdGlvblVzZXJJZDogTWV0ZW9yLnVzZXJJZCgpLFxuICAgIH0pLmZvckVhY2goZnVuY3Rpb24gKGN1c3RvbWVyKSB7XG4gICAgICB2YXIgdXBkYXRlZFVzZXJzID0gXy5tYXAoY3VzdG9tZXIudXNlcnMsIGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgdXNlci5jdXJyZW50bHlMb2dnZWRJbiA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYW5kIGp1c3QgbG9nb3V0IGV2ZXJ5Ym9keSBpbiB0aGUgdXNlciBsaXN0XG4gICAgICAgIGxvZ291dFVzZXIoTWV0ZW9yLnVzZXJJZCgpLCB1c2VyLm5hbWUpO1xuICAgICAgICByZXR1cm4gdXNlcjtcbiAgICAgIH0pO1xuXG4gICAgICBDdXN0b21lcnMudXBkYXRlKGN1c3RvbWVyLl9pZCwge1xuICAgICAgICAkc2V0OiB7XG4gICAgICAgICAgdXNlcnM6IHVwZGF0ZWRVc2VycyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIC8vIGxvZ291dFVzZXIoTWV0ZW9yLnVzZXJJZCgpLCBNZXRlb3IudXNlcklkKCkpOyAvL2xvZ291dCB0aGUgdXNlciBmb3IgdGhlIHNsaWRlIGdlbmVyYXRvclxuICB9LFxuICBsb2dvdXRQcmVzZW50YXRpb25Vc2VyKFVEQywgbmFtZSkge1xuICAgIGNvbnNvbGUubG9nKFwibG9nb3V0UHJlc2VudGF0aW9uVXNlcihVREMsIG5hbWUpXCIsIFVEQywgbmFtZSk7XG4gICAgbG9nb3V0VXNlcihVREMsIG5hbWUsIE1ldGVvci5zZXR0aW5ncy5wdWJsaWMuc2xpZGVHZW5lcmF0b3IudmlydHVhbFByb3h5KTtcbiAgfSxcbiAgbG9nb3V0VmlydHVhbFByb3h5Q2xpZW50VXNhZ2VVc2VyKFVEQywgbmFtZSkge1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgXCJsb2dvdXQgdmlydHVhbCBwcm94eSBjbGllbnQgdXN1YWdlIFVzZXIoVURDLCBuYW1lKVwiLFxuICAgICAgVURDLFxuICAgICAgbmFtZVxuICAgICk7XG4gICAgbG9nb3V0VXNlcihVREMsIG5hbWUsIE1ldGVvci5zZXR0aW5ncy5wdWJsaWMudmlydHVhbFByb3h5Q2xpZW50VXNhZ2UpO1xuICB9LFxuICBzaW11bGF0ZVVzZXJMb2dpbihuYW1lKSB7XG4gICAgY2hlY2sobmFtZSwgU3RyaW5nKTtcbiAgICBNZXRlb3IuY2FsbChcInJlc2V0TG9nZ2VkSW5Vc2VyXCIpO1xuICAgIC8vIGNvbnNvbGUubG9nKCcqKiogUmVzZXQgYWxsIGxvZ2dlZCBpbiB1c2VyIGRvbmUsIG5vdyB3cml0ZSBpbiBvdXIgbG9jYWwgZGF0YWJhc2UgdGhlIG5hbWUgZm9yIHRoZSBjdXJyZW50IHNpbXVsYXRlZCB1c2VyOiBnZW5lcmF0aW9uVXNlcklkOiAnICsgTWV0ZW9yLnVzZXJJZCgpICsgJyAmIHVzZXJzLm5hbWU6JyArIG5hbWUpO1xuICAgIHZhciBxdWVyeSA9IFtcbiAgICAgIHtcbiAgICAgICAgZ2VuZXJhdGlvblVzZXJJZDogTWV0ZW9yLnVzZXJJZCgpLFxuICAgICAgICBcInVzZXJzLm5hbWVcIjogbmFtZSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgICRzZXQ6IHtcbiAgICAgICAgICBcInVzZXJzLiQuY3VycmVudGx5TG9nZ2VkSW5cIjogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXTtcblxuICAgIEN1c3RvbWVycy51cGRhdGUoXG4gICAgICB7XG4gICAgICAgIGdlbmVyYXRpb25Vc2VySWQ6IE1ldGVvci51c2VySWQoKSxcbiAgICAgICAgXCJ1c2Vycy5uYW1lXCI6IG5hbWUsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICAkc2V0OiB7XG4gICAgICAgICAgXCJ1c2Vycy4kLmN1cnJlbnRseUxvZ2dlZEluXCI6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAge30sXG4gICAgICBmdW5jdGlvbiAoZXJyb3IsIG51bWJlckFmZmVjdGVkRG9jdW1lbnRzKSB7XG4gICAgICAgIGlmIChudW1iZXJBZmZlY3RlZERvY3VtZW50cyA9PT0gMCkge1xuICAgICAgICAgIC8vIGlmIG5vdGhpbmcgaXMgdXBkYXRlZCwgaW5zZXJ0IHNvbWUgZHVtbXkgY3VzdG9tZXJzXG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJ3NpbXVsYXRlVXNlckxvZ2luIG51bWJlckFmZmVjdGVkRG9jdW1lbnRzOiAnLCBudW1iZXJBZmZlY3RlZERvY3VtZW50cyk7XG4gICAgICAgICAgLy8gbmFtZSBkb2VzIG5vdCB5ZXQgZXhpc3QgaW4gdGhlIGN1c3RvbWVycyBjcmVhdGVkIGJ5IHRoZSBjdXJyZW50IGRlbW8gdXNlci4gU28gaW5zZXJ0IG91ciBkdW1teSBjdXN0b21lcnMubnVtYmVyQWZmZWN0ZWREb2N1bWVudHNcbiAgICAgICAgICBpbnNlcnREdW1teUN1c3RvbWVycyhNZXRlb3IudXNlcklkKCkpO1xuICAgICAgICAgIEN1c3RvbWVycy51cGRhdGUoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGdlbmVyYXRpb25Vc2VySWQ6IE1ldGVvci51c2VySWQoKSxcbiAgICAgICAgICAgICAgXCJ1c2Vycy5uYW1lXCI6IG5hbWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAkc2V0OiB7XG4gICAgICAgICAgICAgICAgXCJ1c2Vycy4kLmN1cnJlbnRseUxvZ2dlZEluXCI6IHRydWUsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gIH0sXG59KTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuICByZXNldFBhc3N3b3JkT3JDcmVhdGVVc2VyKHVzZXIpIHtcbiAgICB0cnkge1xuICAgICAgLy8gY29uc29sZS5sb2coJ3Jlc2V0IHRoZSBwYXNzd29yZCBvZiB0aGUgdXNlciBiZWZvcmUgbG9nZ2luZyBoaW0gaW4nKTtcbiAgICAgIGNoZWNrKHVzZXIuZW1haWwsIFN0cmluZyk7XG4gICAgICBjaGVjayh1c2VyLnBhc3N3b3JkLCBTdHJpbmcpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcbiAgICAgICAgXCJNaXNzaW5nIFFsaWsuY29tIHVzZXIgZGF0YVwiLFxuICAgICAgICBcIlRoZSB1c2VyIG1pc3NlcyBpbXBvcnRhbnQgaW5mb3JtYXRpb24gZnJvbSBpdHMgUWxpay5jb20gYWNjb3VudFwiXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCB1c2VyRXhpc3RzID0gQWNjb3VudHMuZmluZFVzZXJCeUVtYWlsKHVzZXIuZW1haWwpO1xuICAgIHZhciB1c2VySWQgPSB7fTtcblxuICAgIGlmICh1c2VyRXhpc3RzKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZygnIyMjIyMjIyMjIyMgZm91bmQgdXNlciwgbm93IHJlc2V0IGhpcyBwYXNzd29yZDogJywgdXNlckV4aXN0cyk7XG4gICAgICB1c2VySWQgPSB1c2VyRXhpc3RzLl9pZDtcbiAgICAgIEFjY291bnRzLnNldFBhc3N3b3JkKHVzZXJJZCwgdXNlci5wYXNzd29yZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVzZXJJZCA9IEFjY291bnRzLmNyZWF0ZVVzZXIodXNlcik7XG4gICAgICBSb2xlcy5hZGRVc2Vyc1RvUm9sZXModXNlcklkLCBbXCJ1bnRydXN0ZWRcIl0sIFwiR0xPQkFMXCIpOyAvLyBodHRwczovL2dpdGh1Yi5jb20vYWxhbm5pbmcvbWV0ZW9yLXJvbGVzXG4gICAgfVxuICAgIHJldHVybiB1c2VySWQ7XG4gIH0sXG59KTtcblxuZnVuY3Rpb24gaW5zZXJ0RHVtbXlDdXN0b21lcnMoZ2VuZXJhdGlvblVzZXJJZCkge1xuICAvLyBjb25zb2xlLmxvZygnaW5zZXJ0RHVtbXlDdXN0b21lcnMgY2FsbGVkIGZvciBnZW5lcmF0aW9uVXNlcklkOiAnLCBnZW5lcmF0aW9uVXNlcklkKTtcbiAgXy5lYWNoKGR1bW15Q3VzdG9tZXJzLCBmdW5jdGlvbiAoY3VzdG9tZXIpIHtcbiAgICBjdXN0b21lci5nZW5lcmF0aW9uVXNlcklkID0gZ2VuZXJhdGlvblVzZXJJZDtcbiAgICBDdXN0b21lcnMuaW5zZXJ0KGN1c3RvbWVyKTtcbiAgfSk7XG59XG5cbi8vRWFjaCBwcm94eSBoYXMgaXRzIG93biBzZXNzaW9uIGNvb2tpZSwgc28geW91IGhhdmUgdG8gbG9nb3V0IHRoZSB1c2VycyBwZXIgcHJveHkgdXNlZC5cbmV4cG9ydCBmdW5jdGlvbiBsb2dvdXRVc2VyKFVEQywgbmFtZSwgcHJveHkpIHtcbiAgaWYgKCFwcm94eSkge1xuICAgIHByb3h5ID0gc2Vuc2VDb25maWcudmlydHVhbFByb3h5Q2xpZW50VXNhZ2U7XG4gIH0gLy8gdXNlIHVzZSB0aGUgcHJveHkgZm9yIHRoZSBkdW1teSB1c2VycyBmcm9tIHN0ZXAgNFxuICAvLyBjb25zb2xlLmxvZygnKioqKioqKiogUVBTIEZ1bmN0aW9uczogbG9nb3V0IHRoZSBjdXJyZW50OiAnICsgbmFtZSArICcgb24gcHJveHk6ICcgKyBwcm94eSk7XG5cbiAgaWYgKG5hbWUpIHtcbiAgICAvLyAvL2NvbnNvbGUubG9nKCdNYWtlIFFQUy1sb2dvdXQgY2FsbCwgV2UgYXV0aGVudGljYXRlIHRvIFNlbnNlIHVzaW5nIHRoZSBvcHRpb25zIChpbmNsdWRpbmcgYSBjZXJ0aWZpY2F0ZSkgb2JqZWN0IGluIHRoZSBIVFRQcyBjYWxsOiAnKTsgLy8sIGNvbmZpZ0NlcnRpY2F0ZXMpO1xuICAgIC8vIC8vY29uc29sZS5sb2coJ01ldGVvciB0cmllcyB0byBsb2dvdXQgdGhlIHVzZXIgb24gdGhpcyBVUkw6IGh0dHBzOi8vJyArIHNlbnNlQ29uZmlnLlNlbnNlU2VydmVySW50ZXJuYWxMYW5JUCArICc6NDI0My9xcHMvJyArIHNlbnNlQ29uZmlnLnZpcnR1YWxQcm94eUNsaWVudFVzYWdlICsgJy91c2VyLycgKyBzZW5zZUNvbmZpZy5VREMgKyAnLycgKyBuYW1lKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY2FsbCA9IHt9O1xuICAgICAgY2FsbC5hY3Rpb24gPSBcIkxvZ291dCB1c2VyOiBcIiArIG5hbWU7XG4gICAgICBjYWxsLnVybCA9IGdpdEh1YkxpbmtzLmxvZ291dFVzZXI7XG4gICAgICBjYWxsLnJlcXVlc3QgPVxuICAgICAgICBcImh0dHBzOi8vXCIgK1xuICAgICAgICBzZW5zZUNvbmZpZy5TZW5zZVNlcnZlckludGVybmFsTGFuSVAgK1xuICAgICAgICBcIjo0MjQzL3Fwcy9cIiArXG4gICAgICAgIHByb3h5ICtcbiAgICAgICAgXCIvdXNlci9cIiArXG4gICAgICAgIFVEQyArXG4gICAgICAgIFwiL1wiICtcbiAgICAgICAgbmFtZSArXG4gICAgICAgIFwiP3hyZmtleT1cIiArXG4gICAgICAgIHNlbnNlQ29uZmlnLnhyZmtleTtcbiAgICAgIGNhbGwucmVzcG9uc2UgPSBIVFRQLmNhbGwoXCJERUxFVEVcIiwgY2FsbC5yZXF1ZXN0LCB7XG4gICAgICAgIG5wbVJlcXVlc3RPcHRpb25zOiBjb25maWdDZXJ0aWNhdGVzLFxuICAgICAgfSk7XG5cbiAgICAgIFJFU1RfTG9nKGNhbGwsIFVEQyk7IC8vIHRoZSBVREMgaXMgdGhlIGJ5IGRlZmluaXRpb24gdGhlIHVzZXJJZCBvZiBtZXRlb3IgaW4gb3VyIGFwcHJvYWNoLi4uXG4gICAgICAvLyBjb25zb2xlLmxvZygnVGhlIEhUVFAgUkVRVUVTVCB0byBTZW5zZSBRUFMgQVBJOicsIGNhbGwucmVxdWVzdCk7XG4gICAgICAvLyBjb25zb2xlLmxvZygnVGhlIEhUVFAgUkVTUE9OU0UgZnJvbSBTZW5zZSBRUFMgQVBJOiAnLCBjYWxsLnJlc3BvbnNlKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCJMb2dvdXQgdXNlciBmYWlsZWRcIiwgZXJyLm1lc3NhZ2UpO1xuICAgIH1cbiAgfVxufVxuXG4vLyBiYXNlZCBvbiBSaWthcmQgQnJhYXRoZW4ncyBRbGlrQXV0aCBtb2R1bGVcbmV4cG9ydCBmdW5jdGlvbiBnZXRSZWRpcmVjdFVSTChcbiAgcGFzc3BvcnQsXG4gIHByb3h5UmVzdFVyaSxcbiAgdGFyZ2V0SWQsXG4gIGdlbmVyYXRpb25Vc2VySWRcbikge1xuICB0cnkge1xuICAgIGNoZWNrKHBhc3Nwb3J0LCBPYmplY3QpO1xuICAgIGNoZWNrKHByb3h5UmVzdFVyaSwgU3RyaW5nKTtcbiAgICBjaGVjayh0YXJnZXRJZCwgU3RyaW5nKTtcbiAgICBjaGVjayhnZW5lcmF0aW9uVXNlcklkLCBTdHJpbmcpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHRocm93IG5ldyBNZXRlb3IuZXJyb3IoXG4gICAgICBcIlJlcXVlc3QgdGlja2V0IGZhaWxlZFwiLFxuICAgICAgXCJZb3UgZGlkIG5vdCBzcGVjaWZ5IGEgcGFzcG9ydCwgcHJveHlVcmksIHRhcmdldElkICBvciBnZW5lcmF0aW9uVXNlcklEXCIsXG4gICAgICBlcnJvclxuICAgICk7XG4gIH1cblxuICAvLyBjb25zb2xlLmxvZygnZW50ZXJlZCBzZXJ2ZXIgc2lkZSByZXF1ZXN0VGlja2V0IG1vZHVsZSBmb3IgdXNlciBhbmQgcGFzc3BvcnQnLCBwYXNzcG9ydCwgcHJveHlSZXN0VXJpKTtcbiAgLy8gc2VlIGh0dHBzOi8vaGVscC5xbGlrLmNvbS9lbi1VUy9zZW5zZS1kZXZlbG9wZXIvMy4wL1N1YnN5c3RlbXMvUHJveHlTZXJ2aWNlQVBJL0NvbnRlbnQvUHJveHlTZXJ2aWNlQVBJL1Byb3h5U2VydmljZUFQSS1Qcm94eVNlcnZpY2VBUEktQXV0aGVudGljYXRpb24tVGlja2V0LUFkZC5odG1cblxuICB2YXIgdGlja2V0UmVxdWVzdEJvZHkgPSBwYXNzcG9ydDtcbiAgdGlja2V0UmVxdWVzdEJvZHkuVGFyZ2V0SWQgPSB0YXJnZXRJZDtcbiAgLy8gY29uc29sZS5sb2coJ1RoZSBwYXNzcG9ydCBmb3IgcmVxdWVzdGluZyBhIHRpY2tldDogJywgcGFzc3BvcnQpO1xuXG4gIHRyeSB7XG4gICAgdmFyIGNhbGwgPSB7fTtcbiAgICBjYWxsLmFjdGlvbiA9IFwiU1RFUCA1OiBSZXF1ZXN0IHRpY2tldCBhdCBlbmRwb2ludCByZWNlaXZlZCBmcm9tIFNlbnNlXCI7XG4gICAgY2FsbC5yZXF1ZXN0ID0gcHJveHlSZXN0VXJpICsgXCJ0aWNrZXRcIjsgLy8gd2UgdXNlIHRoZSBwcm94eSByZXN0IHVyaSB3aGljaCB3ZSBnb3QgZnJvbSB0aGUgcmVkaXJlY3QgZnJvbSB0aGUgcHJveHkgKHRoZSBmaXJzdCBib3VuY2UpXG4gICAgY2FsbC51cmwgPSBnaXRIdWJMaW5rcy5yZXF1ZXN0VGlja2V0O1xuICAgIGNhbGwucmVzcG9uc2UgPSBIVFRQLmNhbGwoXCJQT1NUXCIsIGNhbGwucmVxdWVzdCwge1xuICAgICAgbnBtUmVxdWVzdE9wdGlvbnM6IGNvbmZpZ0NlcnRpY2F0ZXMsXG4gICAgICBoZWFkZXJzOiBhdXRoSGVhZGVycyxcbiAgICAgIHBhcmFtczoge1xuICAgICAgICB4cmZrZXk6IHNlbnNlQ29uZmlnLnhyZmtleSxcbiAgICAgIH0sXG4gICAgICBkYXRhOiBwYXNzcG9ydCwgLy8gdGhlIHVzZXIgYW5kIGdyb3VwIGluZm8gZm9yIHdoaWNoIHdlIHdhbnQgdG8gY3JlYXRlIGEgdGlja2V0XG4gICAgfSk7XG4gICAgUkVTVF9Mb2coY2FsbCwgZ2VuZXJhdGlvblVzZXJJZCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJSRVNUIGNhbGwgdG8gcmVxdWVzdCBhIHRpY2tldCBmYWlsZWRcIiwgZXJyKTtcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFxuICAgICAgXCJSZXF1ZXN0IHRpY2tldCBmYWlsZWQgdmlhIGdldFJlZGlyZWN0VVJMXCIsXG4gICAgICBlcnIubWVzc2FnZVxuICAgICk7XG4gIH1cblxuICBjb25zb2xlLmxvZyhcIlRoZSBIVFRQIFJFUVVFU1QgdG8gU2Vuc2UgUVBTIEFQSTpcIiwgY2FsbC5yZXF1ZXN0KTtcbiAgY29uc29sZS5sb2coXCJUaGUgSFRUUCBSRVNQT05TRSBmcm9tIFNlbnNlIFFQUyBBUEk6IFwiLCBjYWxsLnJlc3BvbnNlKTtcbiAgdmFyIHRpY2tldFJlc3BvbnNlID0gY2FsbC5yZXNwb25zZS5kYXRhO1xuICBjYWxsLmFjdGlvbiA9XG4gICAgXCJTVEVQIDY6IFVzZSByZXNwb25zZSBmcm9tIG91ciB0aWNrZXQgcmVxdWVzdCB0byBjcmVhdGUgcmVkaXJlY3QgdXJsXCI7XG4gIGNhbGwucmVxdWVzdCA9XG4gICAgXCJVc2UgdGhlIHJlZGlyZWN0IHVybCB3ZSBnb3QgYmFjayBhbmQgdGhlIHRpY2tldCBzdHJpbmcgdG8gbWFrZSBhIHJlZGlyZWN0IHVybCBmb3IgdGhlIGNsaWVudC4gRm9ybWF0OiBcIiArXG4gICAgdGlja2V0UmVzcG9uc2UuVGFyZ2V0VXJpICtcbiAgICBcIj9RbGlrVGlja2V0PVwiICtcbiAgICB0aWNrZXRSZXNwb25zZS5UaWNrZXQgK1xuICAgIFwiLiBKU09OIHJlY2VpdmVkOiBcIiArXG4gICAgdGlja2V0UmVzcG9uc2U7XG4gIC8vIFJFU1RfTG9nKGNhbGwpO1xuXG4gIC8vIEJ1aWxkIHJlZGlyZWN0IFVSTCBmb3IgdGhlIGNsaWVudCBpbmNsdWRpbmcgdGhlIHRpY2tldFxuICBpZiAodGlja2V0UmVzcG9uc2UuVGFyZ2V0VXJpLmluZGV4T2YoXCI/XCIpID4gMCkge1xuICAgIHJlZGlyZWN0VVJJID1cbiAgICAgIHRpY2tldFJlc3BvbnNlLlRhcmdldFVyaSArIFwiJlFsaWtUaWNrZXQ9XCIgKyB0aWNrZXRSZXNwb25zZS5UaWNrZXQ7XG4gIH0gZWxzZSB7XG4gICAgcmVkaXJlY3RVUkkgPVxuICAgICAgdGlja2V0UmVzcG9uc2UuVGFyZ2V0VXJpICsgXCI/UWxpa1RpY2tldD1cIiArIHRpY2tldFJlc3BvbnNlLlRpY2tldDtcbiAgfVxuXG4gIGlmICghcmVkaXJlY3RVUkkpIHtcbiAgICBpZiAoTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy51c2VTU0wpIHtcbiAgICAgIHJlZGlyZWN0VVJJID1cbiAgICAgICAgXCJodHRwczovL1wiICtcbiAgICAgICAgc2Vuc2VDb25maWcuaG9zdCArXG4gICAgICAgIFwiOlwiICtcbiAgICAgICAgc2Vuc2VDb25maWcucWxpa1NlbnNlUG9ydFNlY3VyZSArXG4gICAgICAgIFwiL1wiICtcbiAgICAgICAgc2Vuc2VDb25maWcudmlydHVhbFByb3h5Q2xpZW50VXNhZ2UgK1xuICAgICAgICBcIi9cIiArXG4gICAgICAgIGh1YjtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVkaXJlY3RVUkkgPVxuICAgICAgICBcImh0dHA6Ly9cIiArXG4gICAgICAgIHNlbnNlQ29uZmlnLmhvc3QgK1xuICAgICAgICBcIjpcIiArXG4gICAgICAgIHNlbnNlQ29uZmlnLnBvcnQgK1xuICAgICAgICBcIi9cIiArXG4gICAgICAgIHNlbnNlQ29uZmlnLnZpcnR1YWxQcm94eUNsaWVudFVzYWdlICtcbiAgICAgICAgXCIvXCIgK1xuICAgICAgICBodWI7XG4gICAgfVxuICB9XG4gIGNvbnNvbGUubG9nKFwiTWV0ZW9yIHNlcnZlciBzaWRlIGNyZWF0ZWQgdGhpcyByZWRpcmVjdCB1cmw6IFwiLCByZWRpcmVjdFVSSSk7XG4gIHJldHVybiByZWRpcmVjdFVSSTtcbn1cbiIsImltcG9ydCB7XG4gICAgTWV0ZW9yLFxufSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7XG4gICAgaHR0cCxcbn0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5cbmltcG9ydCB7XG4gICAgY29uZmlnQ2VydGljYXRlcyxcbiAgICBzZW5zZUNvbmZpZyxcbiAgICBhdXRoSGVhZGVycyxcbiAgICBxcnNTcnZcbn0gZnJvbSAnL2ltcG9ydHMvYXBpL2NvbmZpZyc7XG5cbmV4cG9ydCB2YXIgbXlRUlMgPSBmdW5jdGlvbiBteVFSU01haW4oKSB7XG5cbiAgICB0aGlzLmdldCA9IGZ1bmN0aW9uIGdldChwYXRoLCBwYXJhbXMgPSB7fSwgZGF0YSA9IHt9KSB7XG4gICAgICAgIHZhciBlbmRwb2ludCA9IGNoZWNrUGF0aChwYXRoKTtcbiAgICAgICAgY29uc29sZS5sb2coJ1FSUyBtb2R1bGUgcmVjZWl2ZWQgR0VUIHJlcXVlc3QgZm9yIGVuZHBvaW50JywgZW5kcG9pbnQpO1xuXG4gICAgICAgIC8vIGNvcHkgdGhlIHBhcmFtcyB0byBvbmUgb2JqZWN0XG4gICAgICAgIHZhciBuZXdQYXJhbXMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgICAgIHhyZmtleTogc2Vuc2VDb25maWcueHJma2V5XG4gICAgICAgIH0sIHBhcmFtcyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBIVFRQLmdldChlbmRwb2ludCwge1xuICAgICAgICAgICAgICAgIG5wbVJlcXVlc3RPcHRpb25zOiBjb25maWdDZXJ0aWNhdGVzLFxuICAgICAgICAgICAgICAgIHBhcmFtczogbmV3UGFyYW1zLFxuICAgICAgICAgICAgICAgIGRhdGE6IHt9LFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1FSUyBHRVQgcmVzdWx0OiByZXNwb25zZS5kYXRhIGxlbmd0aDogJywgcmVzcG9uc2UuZGF0YS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1dlIGRpZCBub3QgZ2V0IGFueSBkYXRhIGJhY2sgZnJvbSBRbGlrIFNlbnNlIChlbXB0eSBhcnJheSkuIElmIHlvdSBkbyBub3QgZXhwZWN0IHRoaXMsIG1ha2Ugc3VyZSB5b3UgY2hlY2sgdGhlIHVkYywgdXNlcm5hbWUgaW4gdGhlIHNldHRpbmdzIGZpbGUuJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xuICAgICAgICAgICAgfSAgICAgICAgICAgXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgdmFyIGVycm9yID0gJ1FSUyBIVFRQIEdFVCBGQUlMRUQgRk9SICcgKyBlbmRwb2ludDtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCAnVGhpcyBub2RlIHNlcnZlciBjYW4gbm90IGNvbm5lY3QgdG8gUWxpayBTZW5zZS4gU29tZXRpbWVzIHlvdSBoYXZlIHRvIHdhaXQgMTAgbWludXRlcyBhZnRlciByZXN0YXJ0aW5nLi4uICcgKyBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy5wb3N0ID0gZnVuY3Rpb24gcG9zdChwYXRoLCBwYXJhbXMgPSB7fSwgZGF0YSA9IHt9KSB7XG4gICAgICAgIHZhciBlbmRwb2ludCA9IGNoZWNrUGF0aChwYXRoKTtcblxuICAgICAgICAvLyBjb3B5IHRoZSBwYXJhbXMgdG8gb25lIG9iamVjdFxuICAgICAgICB2YXIgbmV3UGFyYW1zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgICAgICAneHJma2V5Jzogc2Vuc2VDb25maWcueHJma2V5XG4gICAgICAgIH0sIHBhcmFtcyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBIVFRQLnBvc3QoZW5kcG9pbnQsIHtcbiAgICAgICAgICAgICAgICBucG1SZXF1ZXN0T3B0aW9uczogY29uZmlnQ2VydGljYXRlcyxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IG5ld1BhcmFtcyxcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdIVFRQIFBPU1QgRkFJTEVEIEZPUiAnICsgZW5kcG9pbnQsIGVycik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy5kZWwgPSBmdW5jdGlvbiBkZWwocGF0aCwgcGFyYW1zID0ge30sIGRhdGEgPSB7fSkge1xuICAgICAgICB2YXIgZW5kcG9pbnQgPSBjaGVja1BhdGgocGF0aCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdlbmRwb2ludCcsIGVuZHBvaW50KVxuICAgICAgICBjb25zb2xlLmxvZygnZGF0YScsIGRhdGEpXG5cbiAgICAgICAgLy8gY29weSB0aGUgcGFyYW1zIHRvIG9uZSBvYmplY3QuXG4gICAgICAgIHZhciBuZXdQYXJhbXMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgICAgIHhyZmtleTogc2Vuc2VDb25maWcueHJma2V5XG4gICAgICAgIH0sIHBhcmFtcyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBIVFRQLmRlbChlbmRwb2ludCwge1xuICAgICAgICAgICAgICAgIG5wbVJlcXVlc3RPcHRpb25zOiBjb25maWdDZXJ0aWNhdGVzLFxuICAgICAgICAgICAgICAgIHBhcmFtczogbmV3UGFyYW1zLFxuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdyZXNwb25zZScsIHJlc3BvbnNlKVxuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignUVJTIEhUVFAgREVMIEZBSUxFRCBGT1IgJyArIGVuZHBvaW50LCBlcnIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMucHV0ID0gZnVuY3Rpb24gcHV0KHBhdGgsIHBhcmFtcyA9IHt9LCBkYXRhID0ge30pIHtcbiAgICAgICAgdmFyIGVuZHBvaW50ID0gY2hlY2tQYXRoKHBhdGgpO1xuXG4gICAgICAgIC8vIGNvcHkgdGhlIHBhcmFtcyB0byBvbmUgb2JqZWN0XG4gICAgICAgIHZhciBuZXdQYXJhbXMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgICAgICd4cmZrZXknOiBzZW5zZUNvbmZpZy54cmZrZXlcbiAgICAgICAgfSwgcGFyYW1zKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciByZXNwb25zZSA9IEhUVFAucHV0KGVuZHBvaW50LCB7XG4gICAgICAgICAgICAgICAgbnBtUmVxdWVzdE9wdGlvbnM6IGNvbmZpZ0NlcnRpY2F0ZXMsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiBuZXdQYXJhbXMsXG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignSFRUUCBQVVQgRkFJTEVEIEZPUiAnICsgZW5kcG9pbnQsIGVycik7XG4gICAgICAgIH1cbiAgICB9O1xuXG59O1xuXG5mdW5jdGlvbiBjaGVja1BhdGgocGF0aCkge1xuICAgIGNvbnNvbGUubG9nKCdjaGVja1BhdGg6IHBhdGgnLCBwYXRoKTtcbiAgICBjb25zb2xlLmxvZygnY2hlY2tQYXRoOiBxcnNTcnYnLCBxcnNTcnYpO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgY2hlY2socGF0aCwgU3RyaW5nKTtcbiAgICAgICAgY2hlY2socXJzU3J2LCBTdHJpbmcpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB0aHJvdyBFcnJvcihcIlFSUyBtb2R1bGUgY2FuIG5vdCB1c2UgYW4gZW1wdHkgc2VydmVyOiBcIiArIHFyc1NydiArIFwiIG9yIHBhdGg6IFwiICsgcGF0aCArIFwiIGZvciB0aGUgUVJTIEFQSSwgc2V0dGluZ3MuanNvbiBjb3JyZWN0P1wiKVxuICAgIH1cbiAgICByZXR1cm4gcXJzU3J2ICsgcGF0aDtcbn0iLCJpbXBvcnQge1xuICAgIE1ldGVvclxufSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7XG4gICAgaHR0cFxufSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7XG4gICAgQXBwcyxcbiAgICBUZW1wbGF0ZUFwcHMsXG4gICAgR2VuZXJhdGVkUmVzb3VyY2VzXG59IGZyb20gJy9pbXBvcnRzL2FwaS9hcHBzJztcbmltcG9ydCAqIGFzIFFTU3RyZWFtIGZyb20gJy9pbXBvcnRzL2FwaS9zZXJ2ZXIvUVJTRnVuY3Rpb25zU3RyZWFtJztcbmltcG9ydCB7XG4gICAgZ2l0SHViTGlua3Ncbn0gZnJvbSAnL2ltcG9ydHMvdWkvVUlIZWxwZXJzJztcblxuLy9pbXBvcnQgbWV0ZW9yIGNvbGxlY3Rpb25zXG5pbXBvcnQge1xuICAgIFN0cmVhbXNcbn0gZnJvbSAnL2ltcG9ydHMvYXBpL3N0cmVhbXMnO1xuaW1wb3J0IHtcbiAgICBDdXN0b21lcnNcbn0gZnJvbSAnL2ltcG9ydHMvYXBpL2N1c3RvbWVycyc7XG5cbmltcG9ydCB7XG4gICAgY3JlYXRlVmlydHVhbFByb3hpZXNcbn0gZnJvbSAnL2ltcG9ydHMvYXBpL3NlcnZlci9RUFNGdW5jdGlvbnMnO1xuXG5cbi8vaW1wb3J0IGNvbmZpZyBmb3IgUWxpayBTZW5zZSBRUlMgYW5kIEVuZ2luZSBBUEkvL1xuaW1wb3J0IHtcbiAgICBxbGlrSERSU2VydmVyLCAvLyBRbGlrIHNlbnNlIFFSUyBlbmRwb2ludCB2aWEgaGVhZGVyIGF1dGhlbnRpY2F0aW9uXG4gICAgc2Vuc2VDb25maWcsXG4gICAgZW5pZ21hU2VydmVyQ29uZmlnLFxuICAgIHFyc1NydixcbiAgICBxcnMsXG4gICAgY29uZmlnQ2VydGljYXRlcyxcbiAgICBfc2xpZGVHZW5lcmF0b3JBcHBJZFxufSBmcm9tICcvaW1wb3J0cy9hcGkvY29uZmlnLmpzJztcbmltcG9ydCB7XG4gICAgQVBJTG9ncyxcbiAgICBSRVNUX0xvZ1xufSBmcm9tICcvaW1wb3J0cy9hcGkvQVBJTG9ncyc7XG5pbXBvcnQgbG9kYXNoIGZyb20gJ2xvZGFzaCc7XG5fID0gbG9kYXNoO1xuXG4vL1xuLy8g4pSA4pSA4pSAIElOU1RBTEwgTlBNIE1PRFVMRVMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4vL1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKTtcbmNvbnN0IGVuaWdtYSA9IHJlcXVpcmUoJ2VuaWdtYS5qcycpO1xudmFyIHByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xudmFyIHJlcXVlc3QgPSByZXF1aXJlKCdyZXF1ZXN0Jyk7XG52YXIgc2FuaXRpemUgPSByZXF1aXJlKFwic2FuaXRpemUtZmlsZW5hbWVcIik7XG5cblxuLy9cbi8vIOKUgOKUgOKUgCBVUExPQUQgQVBQUyBGT1IgVEhFIElOSVRJQUwgU0VUVVAgT0YgUUxJSyBTRU5TRSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbi8vXG5cblxuLy8gVVBMT0FEIFRFTVBMQVRFUyBBUFBTIEZST00gRk9MREVSLCBBTkQgUFVCTElTSCBJTlRPIFRIRSBURU1QTEFURVMgU1RSRUFNXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBsb2FkQW5kUHVibGlzaFRlbXBsYXRlQXBwcygpIHtcbiAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJyk7XG4gICAgY29uc29sZS5sb2coJ3VwbG9hZEFuZFB1Ymxpc2hUZW1wbGF0ZUFwcHMnKTtcbiAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJyk7XG4gICAgdmFyIG5ld0ZvbGRlciA9IHBhdGguam9pbihNZXRlb3Iuc2V0dGluZ3MuYnJva2VyLmF1dG9tYXRpb25CYXNlRm9sZGVyLCAnYXBwcycpO1xuICAgIGNvbnNvbGUubG9nKCd1cGxvYWRBbmRQdWJsaXNoVGVtcGxhdGVBcHBzOiBSZWFkIGFsbCBmaWxlcyBpbiB0aGUgdGVtcGxhdGUgYXBwcyBmb2xkZXIgXCInICsgbmV3Rm9sZGVyICsgJ1wiIGFuZCB1cGxvYWQgdGhlbSB0byBRbGlrIFNlbnNlLicpO1xuXG4gICAgLy9HRVQgVEhFIElEIE9GIFRIRSBJTVBPUlRBTlQgU1RSRUFNUyAoc3RyZWFtcyB0aGF0IFFSU01ldGVvciBuZWVkcylcbiAgICB2YXIgZXZlcnlPbmVTdHJlYW1JZCA9IFFTU3RyZWFtLmdldFN0cmVhbUJ5TmFtZShNZXRlb3Iuc2V0dGluZ3MuYnJva2VyLnFsaWtTZW5zZS5FdmVyeW9uZUFwcFN0cmVhbU5hbWUpLmlkO1xuICAgIHZhciB0ZW1wbGF0ZVN0cmVhbUlkID0gUVNTdHJlYW0uZ2V0U3RyZWFtQnlOYW1lKE1ldGVvci5zZXR0aW5ncy5wdWJsaWMuVGVtcGxhdGVBcHBTdHJlYW1OYW1lKS5pZDtcbiAgICB2YXIgQVBJQXBwc1N0cmVhbUlEID0gUVNTdHJlYW0uZ2V0U3RyZWFtQnlOYW1lKE1ldGVvci5zZXR0aW5ncy5icm9rZXIucWxpa1NlbnNlLkFQSUFwcFN0cmVhbU5hbWUpLmlkO1xuICAgIHRyeSB7XG4gICAgICAgIGNoZWNrKG5ld0ZvbGRlciwgU3RyaW5nKTtcbiAgICAgICAgY2hlY2soZXZlcnlPbmVTdHJlYW1JZCwgU3RyaW5nKTtcbiAgICAgICAgY2hlY2sodGVtcGxhdGVTdHJlYW1JZCwgU3RyaW5nKTtcbiAgICAgICAgY2hlY2soQVBJQXBwc1N0cmVhbUlELCBTdHJpbmcpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdZb3UgZGlkIG5vdCBzcGVjaWZ5IHRoZSB0ZW1wbGF0ZUFwcHNGcm9tLCBldmVyeW9uZSwgYXBpIGFwcHMgb3IgdGVtcGxhdGUgc3RyZWFtIG5hbWUgaW4gdGhlIHNldHRpbmdzLmpzb24gZmlsZT8nKTtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignTWlzc2luZyBTZXR0aW5ncycsICdZb3UgZGlkIG5vdCBzcGVjaWZ5IHRoZSBldmVyb25lLCBhcGkgYXBwcyBvciB0ZW1wbGF0ZSBzdHJlYW0gbmFtZSBpbiB0aGUgc2V0dGluZ3MuanNvbiBmaWxlPycpO1xuICAgIH1cblxuICAgIC8vIExPQUQgQUxMIFNFTlNFIEFQUFMgSU4gRk9MREVSXG4gICAgdmFyIGFwcHNJbkZvbGRlciA9IGF3YWl0IGZzLnJlYWRkaXIobmV3Rm9sZGVyKTtcblxuICAgIC8vIEZPUiBFQUNIIEFQUCBGT1VORDogUFVCTElTSCBJVCAgICBcbiAgICByZXR1cm4gYXdhaXQgUHJvbWlzZS5hbGwoYXBwc0luRm9sZGVyLm1hcChhc3luYyhRVkYpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vR0VUIFRIRSBOQU1FIE9GIFRIRSBBUFAgQU5EIENSRUFURSBBIEZJTEVQQVRIXG4gICAgICAgICAgICB2YXIgYXBwTmFtZSA9IFFWRi5zdWJzdHIoMCwgUVZGLmluZGV4T2YoJy4nKSk7XG4gICAgICAgICAgICB2YXIgZmlsZVBhdGggPSBwYXRoLmpvaW4obmV3Rm9sZGVyLCBRVkYpO1xuXG4gICAgICAgICAgICAvL09OTFkgVVBMT0FEIEFQUFMgSUYgVEhFWSBETyBOT1QgQUxSRUFEWSBFWElTVFxuICAgICAgICAgICAgaWYgKCFnZXRBcHBzKGFwcE5hbWUpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIC8vVVBMT0FEIFRIRSBBUFAsIEdFVCBUSEUgQVBQIElEIEJBQ0tcbiAgICAgICAgICAgICAgICB2YXIgYXBwSWQgPSBhd2FpdCB1cGxvYWRBcHAoZmlsZVBhdGgsIGFwcE5hbWUpO1xuXG4gICAgICAgICAgICAgICAgLy9CQVNFRCBPTiBUSEUgQVBQIFdFIFdBTlQgVE8gUFVCTElTSCBJVCBJTlRPIEEgRElGRkVSRU5UIFNUUkVBTSAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoYXBwTmFtZSA9PT0gJ1NTQkknKSB7IC8vc2hvdWxkIGJlIHB1Ymxpc2hlZCBpbiB0aGUgZXZlcnlvbmUgc3RyZWFtXG4gICAgICAgICAgICAgICAgICAgIF9TU0JJQXBwID0gYXBwSWQ7IC8vIGZvciB0aGUgY2xpZW50IHNpZGUgSFRNTC9JRnJhbWVzIGV0Yy4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBwdWJsaXNoQXBwKGFwcElkLCBhcHBOYW1lLCBldmVyeU9uZVN0cmVhbUlkKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFwcE5hbWUgPT09ICdTYWxlcycpIHsgLy9USElTIE9ORSBORUVEUyBUTyBCRSBDT1BJRUQgQU5EIFBVQkxJU0hFRCBJTlRPIDIgU1RSRUFNUzogQVMgVEVNUExBVEUgQU5EIEZPUiBUSEUgRVZFUllPTkUgU1RSRUFNLlxuICAgICAgICAgICAgICAgICAgICBwdWJsaXNoQXBwKGFwcElkLCBhcHBOYW1lLCBldmVyeU9uZVN0cmVhbUlkKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvcGllZEFwcElkID0gY29weUFwcChhcHBJZCwgYXBwTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIHB1Ymxpc2hBcHAoY29waWVkQXBwSWQsIGFwcE5hbWUsIHRlbXBsYXRlU3RyZWFtSWQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYXBwTmFtZSA9PT0gJ1NsaWRlIGdlbmVyYXRvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgX3NsaWRlR2VuZXJhdG9yQXBwSWQgPSBhcHBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1Ymxpc2hBcHAoYXBwSWQsIGFwcE5hbWUsIEFQSUFwcHNTdHJlYW1JRCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy9JbnNlcnQgaW50byB0ZW1wbGF0ZSBhcHBzIHN0cmVhbVxuICAgICAgICAgICAgICAgICAgICBwdWJsaXNoQXBwKGFwcElkLCBhcHBOYW1lLCB0ZW1wbGF0ZVN0cmVhbUlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBcHAgJyArIGFwcE5hbWUgKyAnIGFscmVhZHkgZXhpc3RzIGluIFFsaWsgU2Vuc2UnKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdVbmFibGUgdG8gdXBsb2FkIHRoZSBhcHAgdG8gUWxpayBTZW5zZS4gJywgZXJyKVxuICAgICAgICB9XG4gICAgfSkpXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZVN0cmVhbUFuZEFwcChjdXN0b21lcnMsIGdlbmVyYXRpb25Vc2VySWQpIHtcbiAgICBjb25zb2xlLmxvZygnTUVUSE9EIGNhbGxlZDogZ2VuZXJhdGVTdHJlYW1BbmRBcHAgZm9yIHRoZSB0ZW1wbGF0ZSBhcHBzIGFzIHN0b3JlZCBpbiB0aGUgZGF0YWJhc2Ugb2YgdGhlIGZpY3RpdmUgT0VNJyk7XG5cbiAgICB0cnkge1xuICAgICAgICB2YXIgdGVtcGxhdGVBcHBzID0gY2hlY2tUZW1wbGF0ZUFwcEV4aXN0cyhnZW5lcmF0aW9uVXNlcklkKTsgLy9pcyBhIHRlbXBsYXRlIGFwcCBzZWxlY3RlZCwgYW5kIGRvZXMgdGhlIGd1aWQgc3RpbGwgZXhpc3QgaW4gU2Vuc2U/IGlmIHllcywgcmV0dXJuIHRoZSB2YWxpZCB0ZW1wbGF0ZXNcbiAgICAgICAgY2hlY2tDdXN0b21lcnNBcmVTZWxlY3RlZChjdXN0b21lcnMpOyAvL2hhdmUgd2Ugc2VsZWN0ZWQgYSAgY3VzdG9tZXIgdG8gZG8gdGhlIGdlbmVyYXRpb24gZm9yP1xuXG4gICAgICAgIGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgICAgICAgY29uc29sZS5sb2coJ3N0YXJ0IGdlbmVyYXRpb24gZm9yICcsIGN1c3RvbWVycyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgICAgICAgZm9yIChjb25zdCBjdXN0b21lciBvZiBjdXN0b21lcnMpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgdGVtcGxhdGVBcHAgb2YgdGVtcGxhdGVBcHBzKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZ2VuZXJhdGVBcHBGb3JUZW1wbGF0ZSh0ZW1wbGF0ZUFwcCwgY3VzdG9tZXIsIGdlbmVyYXRpb25Vc2VySWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH1cblxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldEFwcElEcyhwYXJhbXMpIHtcbiAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJyk7XG4gICAgY29uc29sZS5sb2coJ1NFVCBBUFAgSURzJyk7XG4gICAgY29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdjaGVjayBpZiBhbGwgc2V0dGluZ3MuanNvbiBwYXJhbWV0ZXJzIGFyZSBzZXQuLi4nKVxuICAgICAgICBjaGVjayhNZXRlb3Iuc2V0dGluZ3MucHVibGljLnNsaWRlR2VuZXJhdG9yLCB7XG4gICAgICAgICAgICBuYW1lOiBTdHJpbmcsXG4gICAgICAgICAgICBzdHJlYW06IFN0cmluZyxcbiAgICAgICAgICAgIHNlbGVjdGlvblNoZWV0OiBTdHJpbmcsXG4gICAgICAgICAgICBkYXRhT2JqZWN0OiBTdHJpbmcsXG4gICAgICAgICAgICBzbGlkZU9iamVjdDogU3RyaW5nLFxuICAgICAgICAgICAgdmlydHVhbFByb3h5OiBTdHJpbmdcbiAgICAgICAgfSk7XG4gICAgICAgIGNoZWNrKE1ldGVvci5zZXR0aW5ncy5wdWJsaWMuU1NCSSwge1xuICAgICAgICAgICAgbmFtZTogU3RyaW5nLFxuICAgICAgICAgICAgc3RyZWFtOiBTdHJpbmcsXG4gICAgICAgICAgICBzaGVldElkOiBTdHJpbmcsXG4gICAgICAgICAgICBhcHBJZDogU3RyaW5nXG4gICAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdNaXNzaW5nIHBhcmFtZXRlcnMgaW4geW91ciBzZXR0aW5ncy5qc29uIGZpbGUgZm9yIHRoZSBTU0JJIG9yIHNsaWRlZ2VuZXJhdG9yLi4uJywgZXJyKVxuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIHZhciBzbGlkZUdlbmVyYXRvckFwcHMgPSBnZXRBcHBzKE1ldGVvci5zZXR0aW5ncy5wdWJsaWMuc2xpZGVHZW5lcmF0b3IubmFtZSwgTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5zbGlkZUdlbmVyYXRvci5zdHJlYW0pO1xuICAgICAgICB2YXIgU1NCSUFwcHMgPSBnZXRBcHBzKE1ldGVvci5zZXR0aW5ncy5wdWJsaWMuU1NCSS5uYW1lLCBNZXRlb3Iuc2V0dGluZ3MucHVibGljLlNTQkkuc3RyZWFtKTtcbiAgICAgICAgaWYgKHNsaWRlR2VuZXJhdG9yQXBwcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhbiBub3QgYXV0b21hdGljYWxseSBzZXQgdGhlIGFwcCBJRCBmb3IgdGhlIHNsaWRlIGdlbmVyYXRvci4gWW91IGhhdmUgbm90IG9uZSBidXQgeW91IGhhdmUgbXVsdGlwbGUgc2xpZGUgZ2VuZXJhdG9yIGFwcHMgdW5kZXIgdGhlIG5hbWUgJyArIE1ldGVvci5zZXR0aW5ncy5wdWJsaWMuc2xpZGVHZW5lcmF0b3IubmFtZSArICcgaW4gdGhlIHN0cmVhbSAnICsgTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5zbGlkZUdlbmVyYXRvci5zdHJlYW0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChTU0JJQXBwcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhbiBub3QgYXV0b21hdGljYWxseSBzZXQgdGhlIGFwcCBJRCBmb3IgdGhlIFNlbGYgU2VydmljZSBCSSBhcHAuIFlvdSBoYXZlIG5vdCBvbmUgYnV0IHlvdSBoYXZlIG11bHRpcGxlIFNlbGYgU2VydmljZSBhcHBzIHVuZGVyIHRoZSBuYW1lICcgKyBNZXRlb3Iuc2V0dGluZ3MucHVibGljLlNTQkkubmFtZSArICcgaW4gdGhlIHN0cmVhbSAnICsgTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5TU0JJLnN0cmVhbSk7XG4gICAgICAgIH1cbiAgICAgICAgc2Vuc2VDb25maWcuU1NCSUFwcCA9IFNTQklBcHBzWzBdLmlkOyAvL1xuICAgICAgICBjb25zb2xlLmxvZygnVGhlIFNTQkkgYXBwIGlkIGhhcyBiZWVuIHNldCB0byAnLCBzZW5zZUNvbmZpZy5TU0JJQXBwKTtcblxuICAgICAgICBzZW5zZUNvbmZpZy5zbGlkZUdlbmVyYXRvckFwcElkID0gc2xpZGVHZW5lcmF0b3JBcHBzWzBdLmlkO1xuICAgICAgICBjb25zb2xlLmxvZygnVGhlIHNsaWRlIGdlbmVyYXRvciBhcHAgaWQgaGFzIGJlZW4gc2V0IHRvICcsIHNlbnNlQ29uZmlnLnNsaWRlR2VuZXJhdG9yQXBwSWQpO1xuICAgICAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdZT1UgSEFWRSBTVUNDRVNGVUxMWSBTVEFSVEVEIFFSU01FVEVPUiwgV0UgQVJFIENPTk5FQ1RFRCBUTyBRTElLIFNFTlNFJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ1RoZSBzbGlkZUdlbmVyYXRvciBvciBTZWxmIFNlcnZpY2UgQkkgYXBwIGNhbiBub3QgYmUgZm91bmQgaW4gUWxpayBzZW5zZSwgb3IgeW91IGRpZCBub3QgaGF2ZSBhbGwgcGFyYW1ldGVycyBzZXQgYXMgZGVmaW5lZCBpbiB0aGUgdGhlIHNldHRpbmdzLmpzb24gZXhhbXBsZSBmaWxlLicsIGVycik7XG4gICAgfVxufVxuXG5cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlQXBwRm9yVGVtcGxhdGUodGVtcGxhdGVBcHAsIGN1c3RvbWVyLCBnZW5lcmF0aW9uVXNlcklkKSB7XG4gICAgY29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tR0VORVJBVEUgQVBQUyBGT1IgVEVNUExBVEUnKTtcbiAgICAvLyBjb25zb2xlLmxvZyh0ZW1wbGF0ZUFwcCk7XG4gICAgLy8gY29uc29sZS5sb2coJyMjIyMjIyMjIyMjIyMjIFNUQVJUIENSRUFUSU5HIFRIRSBURU1QTEFURSAnICsgdGVtcGxhdGVBcHAubmFtZSArICcgRk9SIFRISVMgQ1VTVE9NRVI6ICcgKyBjdXN0b21lci5uYW1lICsgJyBGT1IgZ2VuZXJhdGlvblVzZXJJZDogJyArIGdlbmVyYXRpb25Vc2VySWQpO1xuICAgIGNvbnN0IGNhbGwgPSB7fTtcbiAgICBjYWxsLmFjdGlvbiA9ICdTdGFydCBvZiBnZW5lcmF0aW9uIG9mIGFwcCAnICsgdGVtcGxhdGVBcHAubmFtZSArICcgZm9yICcgKyBjdXN0b21lci5uYW1lO1xuICAgIGNhbGwuY3JlYXRlZEJ5ID0gZ2VuZXJhdGlvblVzZXJJZDtcbiAgICBjYWxsLnJlcXVlc3QgPSAnU3RhcnQgY3JlYXRpbmcgYXBwICcgKyB0ZW1wbGF0ZUFwcC5uYW1lICsgJyBmb3IgY3VzdG9tZXIgJyArIGN1c3RvbWVyLm5hbWU7XG4gICAgUkVTVF9Mb2coY2FsbCwgZ2VuZXJhdGlvblVzZXJJZCk7XG5cbiAgICB0cnkge1xuICAgICAgICB2YXIgc3RyZWFtSWQgPSBjaGVja1N0cmVhbVN0YXR1cyhjdXN0b21lciwgZ2VuZXJhdGlvblVzZXJJZCkgLy9jcmVhdGUgYSBzdHJlYW0gZm9yIHRoZSBjdXN0b21lciBpZiBpdCBub3QgYWxyZWFkeSBleGlzdHMgXG4gICAgICAgIHZhciBjdXN0b21lckRhdGFGb2xkZXIgPSBhd2FpdCBjcmVhdGVEaXJlY3RvcnkoY3VzdG9tZXIubmFtZSk7IC8vZm9yIGRhdGEgbGlrZSBYTFMvcXZkIHNwZWNpZmljIGZvciBhIGN1c3RvbWVyXG4gICAgICAgIGlmIChNZXRlb3Iuc2V0dGluZ3MuYnJva2VyLmNyZWF0ZURhdGFDb25uZWN0aW9uUGVyQ3VzdG9tZXIpXG4gICAgICAgICB7YXdhaXQgY3JlYXRlQXBwQ29ubmVjdGlvbignZm9sZGVyJywgY3VzdG9tZXIubmFtZSwgY3VzdG9tZXJEYXRhRm9sZGVyKTt9XG4gICAgICAgIHZhciBuZXdBcHBJZCA9IGNvcHlBcHAodGVtcGxhdGVBcHAuaWQsIHRlbXBsYXRlQXBwLm5hbWUsIGdlbmVyYXRpb25Vc2VySWQpO1xuICAgICAgICB2YXIgcmVzdWx0ID0gcmVsb2FkQXBwQW5kUmVwbGFjZVNjcmlwdHZpYUVuZ2luZShuZXdBcHBJZCwgdGVtcGxhdGVBcHAubmFtZSwgc3RyZWFtSWQsIGN1c3RvbWVyLCBjdXN0b21lckRhdGFGb2xkZXIsICcnLCBnZW5lcmF0aW9uVXNlcklkKTtcbiAgICAgICAgdmFyIHB1Ymxpc2hlZEFwcElkID0gcHVibGlzaEFwcChuZXdBcHBJZCwgdGVtcGxhdGVBcHAubmFtZSwgc3RyZWFtSWQsIGN1c3RvbWVyLm5hbWUsIGdlbmVyYXRpb25Vc2VySWQpO1xuXG4gICAgICAgIC8vbG9nZ2luZyBvbmx5XG4gICAgICAgIGNvbnN0IGNhbGwgPSB7fTtcbiAgICAgICAgY2FsbC5hY3Rpb24gPSAnRmluaXNoZWQgZ2VuZXJhdGlvbiBmb3IgJyArIGN1c3RvbWVyLm5hbWU7XG4gICAgICAgIGNhbGwucmVxdWVzdCA9IHRlbXBsYXRlQXBwLm5hbWUgKyAnIGhhcyBiZWVuIGNyZWF0ZWQgYW5kIHJlbG9hZGVkIHdpdGggZGF0YSBmcm9tIHRoZSAnICsgY3VzdG9tZXIubmFtZSArICcgZGF0YWJhc2UnO1xuICAgICAgICBSRVNUX0xvZyhjYWxsLCBnZW5lcmF0aW9uVXNlcklkKTtcbiAgICAgICAgY29uc29sZS5sb2coJyMjIyMjIyMjIyMjIyMjIEZJTklTSEVEIENSRUFUSU5HIFRIRSBURU1QTEFURSAnICsgdGVtcGxhdGVBcHAubmFtZSArICcgRk9SIFRISVMgQ1VTVE9NRVI6ICcgKyBjdXN0b21lci5uYW1lKTtcbiAgICAgICAgR2VuZXJhdGVkUmVzb3VyY2VzLmluc2VydCh7XG4gICAgICAgICAgICAnZ2VuZXJhdGlvblVzZXJJZCc6IGdlbmVyYXRpb25Vc2VySWQsXG4gICAgICAgICAgICAnY3VzdG9tZXInOiBjdXN0b21lci5uYW1lLFxuICAgICAgICAgICAgJ3N0cmVhbUlkJzogc3RyZWFtSWQsXG4gICAgICAgICAgICAnYXBwSWQnOiBuZXdBcHBJZFxuICAgICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGdlbmVyYXRlLi4uJywgZXJyKTtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignR2VuZXJhdGlvbiBmYWlsZWQnLCAnVGhlIHNlcnZlciBoYXMgYW4gaW50ZXJuYWwgZXJyb3IsIHBsZWFzZSBjaGVjayB0aGUgc2VydmVyIGNvbW1hbmQgbG9ncycpO1xuICAgIH1cbiAgICByZXR1cm47XG59O1xuXG5cbi8vRXhhbXBsZSB0byBkZW1vIHRoYXQgeW91IGNhbiBhbHNvIHVzZSB0aGUgRW5naW5lIEFQSSB0byBnZXQgYWxsIHRoZSBhcHBzLCBvciByZWxvYWQgYW4gYXBwLCBzZXQgdGhlIHNjcmlwdCBldGMuXG4vL3NvdXJjZSBiYXNlZCBvbiBsb2ljJ3Mgd29yazogaHR0cHM6Ly9naXRodWIuY29tL3BvdWMvcWxpay1lbGFzdGljL2Jsb2IvbWFzdGVyL2FwcC5qc1xuYXN5bmMgZnVuY3Rpb24gcmVsb2FkQXBwQW5kUmVwbGFjZVNjcmlwdHZpYUVuZ2luZShhcHBJZCwgbmV3QXBwTmFtZSwgc3RyZWFtSWQsIGN1c3RvbWVyLCBjdXN0b21lckRhdGFGb2xkZXIsIHNjcmlwdFJlcGxhY2UsIGdlbmVyYXRpb25Vc2VySWQpIHtcbiAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1SRVBMQUNFIFNDUklQVCBBTkQgUkVMT0FEIEFQUCcpO1xuXG4gICAgLy9zZXQgdGhlIGFwcCBJRCB0byBiZSB1c2VkIGluIHRoZSBlbmlnbWEgY29ubmVjdGlvbiB0byB0aGUgZW5naW5lIEFQSVxuICAgIHZhciBjb25maWcgPSBPYmplY3QuYXNzaWduKHt9LCBlbmlnbWFTZXJ2ZXJDb25maWcpO1xuICAgIGNvbmZpZy5hcHBJZCA9IGFwcElkO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgcHJvY2Vzcy5vbigndW5oYW5kbGVkUmVqZWN0aW9uJywgdXAgPT4geyAvL2lnbm9yZSBcbiAgICAgICAgfSlcbiAgICAgICAgY2hlY2soYXBwSWQsIFN0cmluZyk7XG4gICAgICAgIGNoZWNrKGN1c3RvbWVyLm5hbWUsIFN0cmluZyk7XG4gICAgICAgIGNoZWNrKGN1c3RvbWVyRGF0YUZvbGRlciwgU3RyaW5nKTtcbiAgICAgICAgY2hlY2soZ2VuZXJhdGlvblVzZXJJZCwgU3RyaW5nKTtcblxuICAgICAgICAvL2Nvbm5lY3QgdG8gdGhlIGVuZ2luZVxuICAgICAgICB2YXIgcWl4ID0gYXdhaXQgZW5pZ21hLmdldFNlcnZpY2UoJ3FpeCcsIGNvbmZpZyk7XG4gICAgICAgIHZhciBjYWxsID0ge307XG4gICAgICAgIGNhbGwuYWN0aW9uID0gJ0Nvbm5lY3QgdG8gUWxpayBTZW5zZSc7XG4gICAgICAgIGNhbGwucmVxdWVzdCA9ICdDb25uZWN0IHRvIEVuZ2luZSBBUEkgKHVzaW5nIEVuaWdtYS5qcykgdXNpbmcgYW4gYXBwSWQ6ICcgKyBhcHBJZDtcbiAgICAgICAgY2FsbC51cmwgPSBnaXRIdWJMaW5rcy5yZXBsYWNlQW5kUmVsb2FkQXBwO1xuICAgICAgICBSRVNUX0xvZyhjYWxsLCBnZW5lcmF0aW9uVXNlcklkKTtcblxuICAgICAgICAvKiB0cnkge1xuICAgICAgICAgICAgLy9jcmVhdGUgZm9sZGVyIGNvbm5lY3Rpb24gXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnY3JlYXRlIGZvbGRlciBjb25uZWN0aW9uLCBpZiB5b3Ugc2VlIGEgd2FybmluZyBiZWxvdyB0aGF0IG1lYW5zIHRoZSBjb25uZWN0aW9uIGFscmVhZHkgZXhpc3RlZC4nKTtcbiAgICAgICAgICAgIHZhciBxQ29ubmVjdGlvbklkID0gYXdhaXQgcWl4LmNyZWF0ZUNvbm5lY3Rpb24oe1xuICAgICAgICAgICAgICAgIFwicU5hbWVcIjogY3VzdG9tZXIubmFtZSxcbiAgICAgICAgICAgICAgICBcInFUeXBlXCI6IFwiZm9sZGVyXCIsXG4gICAgICAgICAgICAgICAgXCJxQ29ubmVjdGlvblN0cmluZ1wiOiBjdXN0b21lckRhdGFGb2xkZXJcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB2YXIgY2FsbCA9IHt9O1xuICAgICAgICAgICAgY2FsbC5hY3Rpb24gPSAnQ3JlYXRlIGRhdGEvZm9sZGVyIGNvbm5lY3Rpb24nO1xuICAgICAgICAgICAgY2FsbC51cmwgPSAnJztcbiAgICAgICAgICAgIGNhbGwucmVxdWVzdCA9ICdMaW5rIHRvIGEgZm9sZGVyIG9uIHRoZSBzZXJ2ZXIgd2hlcmUgdXNlcnMgY2FuIHB1dCBmaWxlcy9RVkQsIG9yIGNyZWF0ZSBhIFJFU1QvT0RCQy9PTEVEQi4uLiBkYXRhYmFzZSBjb25uZWN0aW9uLic7XG4gICAgICAgICAgICBjYWxsLnJlc3BvbnNlID0gJ2NyZWF0ZWQgZm9sZGVyIGNvbm5lY3Rpb246ICcgKyBxQ29ubmVjdGlvbklkO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2NyZWF0ZWQgZm9sZGVyIGNvbm5lY3Rpb246ICcsIHFDb25uZWN0aW9uSWQpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKCdObyBpc3N1ZSwgZXhpc3RpbmcgY3VzdG9tZXIgc28gaGlzIGRhdGEgZm9sZGVyIGNvbm5lY3Rpb24gYWxyZWFkeSBleGlzdHMnLCBlcnJvcik7XG4gICAgICAgIH0gKi9cblxuICAgICAgICAvL2dldCB0aGUgc2NyaXB0XG4gICAgICAgIHZhciBzY3JpcHQgPSBhd2FpdCBxaXguZ2V0U2NyaXB0KCk7XG4gICAgICAgIHZhciBjYWxsID0ge307XG4gICAgICAgIGNhbGwuYWN0aW9uID0gJ0dldCBkYXRhIGxvYWQgc2NyaXB0JztcbiAgICAgICAgY2FsbC51cmwgPSBnaXRIdWJMaW5rcy5nZXRTY3JpcHQ7XG4gICAgICAgIGNhbGwucmVxdWVzdCA9ICdXZSBleHRyYWN0ZWQgdGhlIGZvbGxvd2luZyBsb2FkIHNjcmlwdCBmcm9tIHRoZSBhcHAnO1xuICAgICAgICBjYWxsLnJlc3BvbnNlID0gc2NyaXB0O1xuICAgICAgICBSRVNUX0xvZyhjYWxsLCBnZW5lcmF0aW9uVXNlcklkKTtcblxuICAgICAgICAvL3NldCB0aGUgbmV3IHNjcmlwdFxuICAgICAgICB2YXIgY2FsbCA9IHt9O1xuICAgICAgICBjYWxsLnJlc3BvbnNlID0gYXdhaXQgcWl4LnNldFNjcmlwdChyZXBsYWNlU2NyaXB0KHNjcmlwdCkpIC8vd2Ugbm93IGp1c3QgaW5jbHVkZSB0aGUgb2xkIHNjcmlwdCBpbiB0aGlzIGFwcFxuICAgICAgICBjYWxsLmFjdGlvbiA9ICdJbnNlcnQgY3VzdG9tZXIgc3BlY2lmaWMgZGF0YSBsb2FkIHNjcmlwdCBmb3IgaXRzIGRhdGFiYXNlJztcbiAgICAgICAgY2FsbC51cmwgPSBnaXRIdWJMaW5rcy5zZXRTY3JpcHQ7XG4gICAgICAgIGNhbGwucmVxdWVzdCA9ICdUaGUgc2NyaXB0IG9mIHRoZSBhcHAgaGFzIGJlZW4gcmVwbGFjZWQgd2l0aCBhIGN1c3RvbWVyIHNwZWNpZmljIG9uZS4gTm9ybWFsbHkgeW91IHdvdWxkIHJlcGxhY2UgdGhlIGRhdGFiYXNlIGNvbm5lY3Rpb24gZm9yIGVhY2ggY3VzdG9tZXIuIE9yIHlvdSBjYW4gaW5zZXJ0IGEgY3VzdG9tZXIgc3BlY2lmaWMgc2NyaXB0IHRvIGVuYWJsZSBjdXN0b21pemF0aW9uIHBlciBjdXN0b21lci4gJztcbiAgICAgICAgUkVTVF9Mb2coY2FsbCwgZ2VuZXJhdGlvblVzZXJJZCk7XG5cbiAgICAgICAgLy9yZWxvYWQgdGhlIGFwcFxuICAgICAgICB2YXIgY2FsbCA9IHt9O1xuICAgICAgICBjYWxsLnJlc3BvbnNlID0gYXdhaXQgcWl4LmRvUmVsb2FkKClcbiAgICAgICAgY2FsbC5hY3Rpb24gPSAnUmVsb2FkIHRoZSBhcHAnO1xuICAgICAgICBjYWxsLnVybCA9IGdpdEh1YkxpbmtzLnJlbG9hZEFwcDtcbiAgICAgICAgY2FsbC5yZXF1ZXN0ID0gJ0hhcyB0aGUgYXBwIGJlZW4gcmVsb2FkZWQgd2l0aCBjdXN0b21lciBzcGVjaWZpYyBkYXRhPyc7XG4gICAgICAgIFJFU1RfTG9nKGNhbGwsIGdlbmVyYXRpb25Vc2VySWQpO1xuXG4gICAgICAgIC8vc2F2ZSB0aGUgYXBwXG4gICAgICAgIHZhciBjYWxsID0ge307XG4gICAgICAgIGNhbGwuYWN0aW9uID0gJ1NhdmUgYXBwJ1xuICAgICAgICBjYWxsLnVybCA9IGdpdEh1YkxpbmtzLnNhdmVBcHA7XG4gICAgICAgIGNhbGwucmVxdWVzdCA9ICdBcHAgd2l0aCBHVUlEICcgKyBhcHBJZCArICcgaGFzIGJlZW4gc2F2ZWQgdG8gZGlzayc7XG4gICAgICAgIFJFU1RfTG9nKGNhbGwsIGdlbmVyYXRpb25Vc2VySWQpO1xuICAgICAgICBhd2FpdCBxaXguZG9TYXZlKCk7XG5cbiAgICAgICAgUkVTVF9Mb2coY2FsbCwgZ2VuZXJhdGlvblVzZXJJZCk7XG4gICAgICAgIHByb2Nlc3Mub24oJ3VuaGFuZGxlZFJlamVjdGlvbicsIHVwID0+IHsgdGhyb3cgdXAgfSlcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdlcnJvciBpbiByZWxvYWRBcHBBbmRSZXBsYWNlU2NyaXB0dmlhRW5naW5lIHZpYSBFbmlnbWEuSlMsIGRpZCB5b3UgdXNlZCB0aGUgY29ycmVjdCBzY2hlbWEgZGVmaW5pdGlvbiBpbiB0aGUgc2V0dGluZ3MuanNvbiBmaWxlPycsIGVycm9yKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXBsYWNlU2NyaXB0KHNjcmlwdCkge1xuICAgICAgICAvL3ZhciBzY3JpcHRNYXJrZXIgPSAnwqdkdW1teURhdGFiYXNlU3RyaW5nwqcnO1xuICAgICAgICAvLyBpZiB5b3Ugd2FudCB0byByZXBsYWNlIHRoZSBkYXRhYmFzZSBjb25uZWN0aW9uIHBlciBjdXN0b21lciB1c2UgdGhlIHNjcmlwdCBiZWxvdy5cbiAgICAgICAgLy9yZXR1cm4gZG9jLnNldFNjcmlwdChzY3JpcHQucmVwbGFjZShzY3JpcHRNYXJrZXIsIHNjcmlwdFJlcGxhY2UpKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgLy95b3UgY2FuIGFsc28gY2hhbmdlIHRoZSBzZW5zZSBkYXRhYmFzZSBjb25uZWN0aW9uOiBodHRwczovL2dpdGh1Yi5jb20vbWluZHNwYW5rL3Fzb2Nrcy9ibG9iL21hc3Rlci9leGFtcGxlcy9BcHAvY3JlYXRlLWRhdGFjb25uZWN0aW9uLmpzXG4gICAgICAgIHJldHVybiBzY3JpcHQ7XG4gICAgfVxufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUFwcENvbm5lY3Rpb25zKCkge1xuICAgIGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgICBjb25zb2xlLmxvZygnY3JlYXRlIGFwcCBjb25uZWN0aW9ucycpO1xuICAgIGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgICAvL2NyZWF0ZSB0aGUgZGVmYXVsdCBkZW1vIGltcG9ydCBmb2xkZXIgd2hlcmUgYWxsIHRoZSBjc3YgYW5kIHF2ZiBmaWxlcyBhcmUuLi5cbiAgICB2YXIgc2Vuc2VEZW1vTWF0ZXJpYWxzID0gcGF0aC5qb2luKE1ldGVvci5hYnNvbHV0ZVBhdGgsICdTZW5zZSBEZW1vIG1hdGVyaWFscycpO1xuICAgIGNvbnNvbGUubG9nKCdzZW5zZURlbW9NYXRlcmlhbHMnLCBzZW5zZURlbW9NYXRlcmlhbHMpXG4gICAgYXdhaXQgY3JlYXRlQXBwQ29ubmVjdGlvbignZm9sZGVyJywgJ0ltcG9ydCBkZW1vJywgc2Vuc2VEZW1vTWF0ZXJpYWxzKTtcblxuICAgIGZvciAobGV0IGMgb2YgTWV0ZW9yLnNldHRpbmdzLmJyb2tlci5kYXRhQ29ubmVjdGlvbnMpIHtcbiAgICAgICAgYXdhaXQgY3JlYXRlQXBwQ29ubmVjdGlvbihjLnR5cGUsIGMubmFtZSwgYy5jb25uZWN0aW9uU3RyaW5nKTtcbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVBcHBDb25uZWN0aW9uKHR5cGUsIG5hbWUsIHBhdGgpIHtcblxuICAgIC8vc2V0IHRoZSBhcHAgSUQgdG8gYmUgdXNlZCBpbiB0aGUgZW5pZ21hIGNvbm5lY3Rpb24gdG8gdGhlIGVuZ2luZSBBUElcbiAgICB2YXIgY29uZmlnID0gT2JqZWN0LmFzc2lnbih7fSwgZW5pZ21hU2VydmVyQ29uZmlnKTtcbiAgICBjb25maWcuYXBwSWQgPSBnZXRBcHBzKCdzYWxlcycsICdFdmVyeW9uZScpWzBdLmlkO1xuICAgIGNvbnNvbGUubG9nKCdjcmVhdGVBcHBDb25uZWN0aW9uOiAnICsgdHlwZSArICcgJyArIG5hbWUgKyAnICcgKyBwYXRoICsgJyB1c2luZyB0aGUgc2FsZXMgYXBwIGluIHRoZSBldmVyeW9uZSBzdHJlYW0gdG8gY3JlYXRlIHRoZSBjb25uZWN0aW9uOiAnICsgY29uZmlnLmFwcElkKTtcbiAgICB0cnkge1xuICAgICAgICBjaGVjayh0eXBlLCBTdHJpbmcpO1xuICAgICAgICBjaGVjayhwYXRoLCBTdHJpbmcpO1xuICAgICAgICBjaGVjayhuYW1lLCBTdHJpbmcpO1xuICAgICAgICBjaGVjayhjb25maWcuYXBwSWQsIFN0cmluZyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignTWlzc2luZyBwYXJhbWV0ZXJzIHRvIGNyZWF0ZSBhIGRhdGEgY29ubmVjdGlvbicsIGVycm9yKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICAvL2Nvbm5lY3QgdG8gdGhlIGVuZ2luZVxuICAgICAgICB2YXIgcWl4ID0gYXdhaXQgZW5pZ21hLmdldFNlcnZpY2UoJ3FpeCcsIGNvbmZpZyk7XG5cbiAgICAgICAgLy9jcmVhdGUgZm9sZGVyIGNvbm5lY3Rpb24gXG4gICAgICAgIGNvbnNvbGUubG9nKCdjcmVhdGUgZm9sZGVyIGNvbm5lY3Rpb24sIGlmIHlvdSBzZWUgYSB3YXJuaW5nIGJlbG93IHRoYXQgbWVhbnMgdGhlIGNvbm5lY3Rpb24gYWxyZWFkeSBleGlzdGVkLicpO1xuXG4gICAgICAgIHZhciBxQ29ubmVjdGlvbklkID0gYXdhaXQgcWl4LmNyZWF0ZUNvbm5lY3Rpb24oe1xuICAgICAgICAgICAgXCJxTmFtZVwiOiBuYW1lLFxuICAgICAgICAgICAgXCJxVHlwZVwiOiB0eXBlLFxuICAgICAgICAgICAgXCJxQ29ubmVjdGlvblN0cmluZ1wiOiBwYXRoXG4gICAgICAgIH0pXG4gICAgICAgIGNvbnNvbGUubG9nKCdjcmVhdGVkIGZvbGRlciBjb25uZWN0aW9uOiAnLCBxQ29ubmVjdGlvbklkKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gY3JlYXRlIGRhdGEgY29ubmVjdGlvbicsIGVycm9yKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRlbGV0ZURpcmVjdG9yeUFuZERhdGFDb25uZWN0aW9uKGN1c3RvbWVyTmFtZSkge1xuICAgIGNvbnNvbGUubG9nKCdkZWxldGVEaXJlY3RvcnlBbmREYXRhQ29ubmVjdGlvbicpO1xuICAgIC8vQFRPRE8gYSBiaXQgZGFuZ2Vyb3VzLCBzbyBiZXR0ZXIgdG8gZG8gYnkgaGFuZC4gTWFrZSBzdXJlIHlvdSBjYW4ndCBkZWxldGUgcm9vdCBmb2xkZXIuLi4gXG4gICAgLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTgwNTI3NjIvcmVtb3ZlLWRpcmVjdG9yeS13aGljaC1pcy1ub3QtZW1wdHlcbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlRGlyZWN0b3J5KGN1c3RvbWVyTmFtZSkge1xuICAgIGNvbnNvbGUubG9nKCdjcmVhdGVEaXJlY3RvcnkgJywgY3VzdG9tZXJOYW1lKVxuICAgIHRyeSB7XG4gICAgICAgIGNoZWNrKGN1c3RvbWVyTmFtZSwgU3RyaW5nKTtcbiAgICAgICAgdmFyIGZpbGVuYW1lID0gc2FuaXRpemUoY3VzdG9tZXJOYW1lKTtcbiAgICAgICAgY29uc3QgZGlyID0gcGF0aC5qb2luKE1ldGVvci5zZXR0aW5ncy5icm9rZXIuY3VzdG9tZXJEYXRhRGlyLCBjdXN0b21lck5hbWUpO1xuICAgICAgICBjb25zb2xlLmxvZygnTWV0ZW9yLnNldHRpbmdzLmJyb2tlci5jdXN0b21lckRhdGFEaXInLCBkaXIpXG4gICAgICAgIGF3YWl0IGZzLmVuc3VyZURpcihkaXIpXG4gICAgICAgIHJldHVybiBkaXI7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignRmFpbGVkIHRvIGNyZWF0ZSBkaXJlY3RvcnkgZm9yICcsIGN1c3RvbWVyTmFtZSk7XG4gICAgfVxuXG59XG5cbmZ1bmN0aW9uIGNoZWNrQ3VzdG9tZXJzQXJlU2VsZWN0ZWQoY3VzdG9tZXJzKSB7XG4gICAgaWYgKCFjdXN0b21lcnMubGVuZ3RoKSB7IC8vID0gMFxuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdObyBjdXN0b21lcnMnLCAndXNlciBoYXMgbm90IHNwZWNpZmllZCBhdCBsZWFzdCBvbmUgY3VzdG9tZXIgZm9yIHdoaWNoIGFuIGFwcCBjYW4gYmUgZ2VuZXJhdGVkJyk7XG4gICAgfVxufTtcblxuLy8gQ0hFQ0sgSUYgU0VMRUNURUQgVEVNUExBVEUgQVBQIEVYSVNUUyBJTiBRTElLIFNFTlNFXG4vL1RoZXNlIGFyZSB0aGUgYXBwcyB0aGF0IHRoZSBPRU0gcGFydG5lciBoYXMgaW4gaGlzIGRhdGFiYXNlLCBidXQgZG8gdGhleSBzdGlsbCBleGlzdHMgb24gdGhlIHFsaWtzIHNlbnNlIHNpZGU/XG5mdW5jdGlvbiBjaGVja1RlbXBsYXRlQXBwRXhpc3RzKGdlbmVyYXRpb25Vc2VySWQpIHtcbiAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJyk7XG4gICAgY29uc29sZS5sb2coJ2NoZWNrVGVtcGxhdGVBcHBFeGlzdHMgZm9yIHVzZXJJRCAnLCBnZW5lcmF0aW9uVXNlcklkKVxuICAgIGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcblxuICAgIHZhciB0ZW1wbGF0ZUFwcHMgPSBUZW1wbGF0ZUFwcHMuZmluZCh7XG4gICAgICAgICAgICAnZ2VuZXJhdGlvblVzZXJJZCc6IE1ldGVvci51c2VySWQoKVxuICAgICAgICB9KVxuICAgICAgICAuZmV0Y2goKTtcbiAgICByZXR1cm4gdGVtcGxhdGVBcHBzO1xuXG4gICAgLy8gY29uc29sZS5sb2coJ3RlbXBsYXRlQXBwcyBmb3VuZDogJywgdGVtcGxhdGVBcHBzKVxuXG4gICAgLy8gaWYgKHRlbXBsYXRlQXBwcy5sZW5ndGggPT09IDApIHsgLy91c2VyIGhhcyBub3Qgc3BlY2lmaWVkIGEgdGVtcGxhdGVcbiAgICAvLyAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignTm8gVGVtcGxhdGUnLCAndXNlciBoYXMgbm90IHNwZWNpZmllZCBhIHRlbXBsYXRlIGZvciB3aGljaCBhcHBzIGNhbiBiZSBnZW5lcmF0ZWQnKTtcbiAgICAvLyB9XG5cbiAgICAvLyBjdXJyZW50QXBwc0luU2Vuc2UgPSBnZXRBcHBzKCk7XG4gICAgLy8gaWYgKCFjdXJyZW50QXBwc0luU2Vuc2UpIHtcbiAgICAvLyAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignTm8gYXBwcyBoYXZlIGJlZW4gcmVjZWl2ZWQgZnJvbSBRbGlrIFNlbnNlLiBUaGVyZWZvcmUgeW91IGhhdmUgc2VsZWN0ZWQgYSBRbGlrIFNlbnNlIEFwcDogJyArIHRlbXBsYXRlQXBwLm5hbWUgKyAnIHdpdGggZ3VpZDogJyArIHRlbXBsYXRlQXBwLmlkICsgJyB3aGljaCBkb2VzIG5vdCBleGlzdCBpbiBTZW5zZSBhbnltb3JlLiBIYXZlIHlvdSBkZWxldGVkIHRoZSB0ZW1wbGF0ZSBpbiBTZW5zZT8nKTtcbiAgICAvLyB9XG5cbiAgICAvLyBfLmVhY2godGVtcGxhdGVBcHBzLCBmdW5jdGlvbih0ZW1wbGF0ZUFwcCkge1xuICAgIC8vICAgICBjb25zb2xlLmxvZygndGVtcGxhdGVBcHAgaW4gTW9uZ29EQjogJywgdGVtcGxhdGVBcHApXG4gICAgLy8gICAgIHZhciB0ZW1wbGF0ZUZvdW5kID0gXy5zb21lKGN1cnJlbnRBcHBzSW5TZW5zZSwgWydpZCcsIHRlbXBsYXRlQXBwLmlkXSk7XG5cbiAgICAvLyAgICAgaWYgKCF0ZW1wbGF0ZUZvdW5kKSB7XG4gICAgLy8gICAgICAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJyk7XG4gICAgLy8gICAgICAgICBjb25zb2xlLmxvZygnISEgdGVtcGxhdGUgYXBwIGV4aXN0cyBpbiBtb25nb0RCIGJ1dCBub3QgaW4gUWxpayBTZW5zZScpO1xuICAgIC8vICAgICAgICAgY29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xuICAgIC8vICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignWW91IGhhdmUgc2VsZWN0ZWQgYSBRbGlrIFNlbnNlIEFwcDogJyArIHRlbXBsYXRlQXBwLm5hbWUgKyAnIHdpdGggZ3VpZDogJyArIHRlbXBsYXRlQXBwLmlkICsgJyB3aGljaCBkb2VzIG5vdCBleGlzdCBpbiBTZW5zZSBhbnltb3JlLiBIYXZlIHlvdSBkZWxldGVkIHRoZSB0ZW1wbGF0ZSBpbiBTZW5zZT8nKTtcbiAgICAvLyAgICAgfSBlbHNlIHtcbiAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKCdjaGVja1RlbXBsYXRlQXBwRXhpc3RzOiBUcnVlLCB0ZW1wbGF0ZSBndWlkIGV4aXN0OiAnLCB0ZW1wbGF0ZUFwcC5pZCk7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9KVxuICAgIC8vIHJldHVybiB0ZW1wbGF0ZUFwcHM7XG59O1xuXG4vL1xuLy8g4pSA4pSA4pSAIFVQTE9BRCBBUFAg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4vL1xuXG5cbmFzeW5jIGZ1bmN0aW9uIHVwbG9hZEFwcChmaWxlUGF0aCwgYXBwTmFtZSkge1xuICAgIGNvbnNvbGUubG9nKCdVcGxvYWQgYXBwOiAnICsgYXBwTmFtZSArICcgZnJvbSBwYXRoOiAnICsgZmlsZVBhdGggKyAnIHZpYSBoZWFkZXIgYXV0aGVudGljYXRpb24gc2VydmVyOiAnICsgcWxpa0hEUlNlcnZlcik7XG4gICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICB2YXIgZm9ybURhdGEgPSB7XG4gICAgICAgICAgICBteV9maWxlOiBmcy5jcmVhdGVSZWFkU3RyZWFtKGZpbGVQYXRoKVxuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXF1ZXN0LnBvc3Qoe1xuICAgICAgICAgICAgICAgIHVybDogcWxpa0hEUlNlcnZlciArICcvcXJzL2FwcC91cGxvYWQ/bmFtZT0nICsgYXBwTmFtZSArICcmeHJma2V5PScgKyBzZW5zZUNvbmZpZy54cmZrZXksXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3ZuZC5xbGlrLnNlbnNlLmFwcCcsXG4gICAgICAgICAgICAgICAgICAgICdoZHItdXNyJzogc2Vuc2VDb25maWcuaGVhZGVyVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICdYLVFsaWsteHJma2V5Jzogc2Vuc2VDb25maWcueHJma2V5XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmb3JtRGF0YTogZm9ybURhdGFcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKGVycm9yLCByZXMsIGJvZHkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcHBJZCA9IEpTT04ucGFyc2UoYm9keSkuaWQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdVcGxvYWRlZCBcIicgKyBhcHBOYW1lICsgJy5xdmZcIiB0byBRbGlrIFNlbnNlIGFuZCBnb3QgYXBwSUQ6ICcgKyBhcHBJZCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYXBwSWQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gdXBsb2FkIGFwcFwiICsgYXBwTmFtZSwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignZmFpbGVkIHRvIHVwbG9hZCBhcHAnLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbi8vXG4vLyDilIDilIDilIAgQ09QWUFQUCDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbi8vXG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNvcHlBcHAoZ3VpZCwgbmFtZSwgZ2VuZXJhdGlvblVzZXJJZCkge1xuICAgIGNoZWNrKGd1aWQsIFN0cmluZyk7XG4gICAgY2hlY2sobmFtZSwgU3RyaW5nKTtcbiAgICAvLyBjb25zb2xlLmxvZygnUVJTIEZ1bmN0aW9ucyBjb3B5IEFwcCwgY29weSB0aGUgYXBwIGlkOiAnICsgZ3VpZCArICcgdG8gYXBwIHdpdGggbmFtZTogJywgbmFtZSk7XG4gICAgY29uc3QgY2FsbCA9IHt9O1xuXG4gICAgdHJ5IHtcbiAgICAgICAgY2FsbC5yZXF1ZXN0ID0gcXJzU3J2ICsgJy9xcnMvYXBwLycgKyBndWlkICsgJy9jb3B5JztcbiAgICAgICAgY2FsbC5yZXNwb25zZSA9IEhUVFAucG9zdChjYWxsLnJlcXVlc3QsIHtcbiAgICAgICAgICAgICducG1SZXF1ZXN0T3B0aW9ucyc6IGNvbmZpZ0NlcnRpY2F0ZXMsXG4gICAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgICAgICAneHJma2V5Jzogc2Vuc2VDb25maWcueHJma2V5LFxuICAgICAgICAgICAgICAgIFwibmFtZVwiOiBuYW1lXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGF0YToge31cbiAgICAgICAgfSk7XG5cblxuICAgICAgICBSRVNUX0xvZyhjYWxsLCBnZW5lcmF0aW9uVXNlcklkKTtcbiAgICAgICAgdmFyIG5ld0d1aWQgPSBjYWxsLnJlc3BvbnNlLmRhdGEuaWQ7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdTdGVwIDI6IHRoZSBuZXcgYXBwIGlkIGlzOiAnLCBuZXdHdWlkKTtcbiAgICAgICAgLy9hZGRUYWcoJ0FwcCcsIG5ld0d1aWQpO1xuICAgICAgICByZXR1cm4gbmV3R3VpZDtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICBjYWxsLmFjdGlvbiA9ICdDb3B5IGFwcCBGQUlMRUQnO1xuICAgICAgICBjYWxsLnJlc3BvbnNlID0gZXJyLm1lc3NhZ2U7XG4gICAgICAgIFJFU1RfTG9nKGNhbGwsIGdlbmVyYXRpb25Vc2VySWQpO1xuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdDb3B5IGFwcCBmb3Igc2VsZWN0ZWQgY3VzdG9tZXJzIGZhaWxlZCcsIGVyci5tZXNzYWdlKTtcbiAgICB9XG59O1xuXG4vL1xuLy8g4pSA4pSA4pSAIENIRUNLU1RSRUFNU1RBVFVTIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuLy9cblxuXG5mdW5jdGlvbiBjaGVja1N0cmVhbVN0YXR1cyhjdXN0b21lciwgZ2VuZXJhdGlvblVzZXJJZCkge1xuICAgIGNvbnNvbGUubG9nKCdjaGVja1N0cmVhbVN0YXR1cyBmb3I6ICcgKyBjdXN0b21lci5uYW1lKTtcbiAgICAvL2ZpcnN0IHVwZGF0ZSB0aGUgbGlzdCBvZiBzdHJlYW1zIHdlIGhhdmUgZnJvbSBTZW5zZS4gKHdlIGtlZXAgYSBwcml2YXRlIGNvcHksIHdoaWNoIHNob3VsZCByZWZsZWN0IHRoZSBzdGF0ZSBvZiBTZW5zZSlcbiAgICBNZXRlb3IuY2FsbCgndXBkYXRlTG9jYWxTZW5zZUNvcHlTdHJlYW1zJyk7XG5cbiAgICB2YXIgc3RyZWFtID0gU3RyZWFtcy5maW5kT25lKHtcbiAgICAgICAgbmFtZTogY3VzdG9tZXIubmFtZVxuICAgIH0pOyAvL0ZpbmQgdGhlIHN0cmVhbSBmb3IgdGhlIG5hbWUgb2YgdGhlIGN1c3RvbWVyIGluIE1vbmdvLCBhbmQgZ2V0IGhpcyBJZCBmcm9tIHRoZSByZXR1cm5lZCBvYmplY3RcbiAgICB2YXIgc3RyZWFtSWQgPSAnJztcbiAgICBpZiAoc3RyZWFtKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdTdHJlYW0gYWxyZWFkeSBleGlzdHM6ICcsIHN0cmVhbS5pZCk7XG4gICAgICAgIHN0cmVhbUlkID0gc3RyZWFtLmlkO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdObyBzdHJlYW0gZm9yIGN1c3RvbWVyIGV4aXN0LCBzbyBjcmVhdGUgb25lOiAnICsgY3VzdG9tZXIubmFtZSk7XG4gICAgICAgIHN0cmVhbUlkID0gUVNTdHJlYW0uY3JlYXRlU3RyZWFtKGN1c3RvbWVyLm5hbWUsIGdlbmVyYXRpb25Vc2VySWQpLmlkO1xuICAgICAgICBjb25zb2xlLmxvZygnU3RlcCAxOiB0aGUgKG5ldykgc3RyZWFtIElEIGZvciAnICsgY3VzdG9tZXIubmFtZSArICcgaXM6ICcsIHN0cmVhbUlkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3RyZWFtSWQ7XG59XG5cbi8vXG4vLyDilIDilIDilIAgR0VUQVBQUyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbi8vICAgIFxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QXBwcyhuYW1lLCBzdHJlYW0pIHtcbiAgICBjb25zb2xlLmxvZygnZ2V0QXBwcyAnICsgbmFtZSArICcgd2l0aCBzdHJlYW06ICcgKyBzdHJlYW0pO1xuICAgIHZhciBwYXRoID0gJy9xcnMvYXBwL2Z1bGwnO1xuXG4gICAgLy9pZiBhIG5hbWUvc3RyZWFtIGlzIHByb3ZpZGVkIG9ubHkgc2VhcmNoIHRoZSBhcHBzIHdpdGggdGhpcyBuYW1lXG4gICAgaWYgKG5hbWUpIHtcbiAgICAgICAgcGF0aCArPSBcIj9maWx0ZXI9TmFtZSBlcSAnXCIgKyBuYW1lICsgXCInXCJcbiAgICAgICAgaWYgKHN0cmVhbSkge1xuICAgICAgICAgICAgcGF0aCArPSBcIiBhbmQgc3RyZWFtLm5hbWUgZXEgJ1wiICsgc3RyZWFtICsgXCInXCJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdnZXRBcHBzKG5hbWU6ICcgKyBuYW1lICsgJyBhbmQgc3RyZWFtICcgKyBzdHJlYW0gKyAnIHZpYSBBUEkgcGF0aDogJyArIHBhdGgpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2dldEFwcHMgdmlhIEFQSSBwYXRoOiAnICsgcGF0aCk7XG4gICAgfVxuXG4gICAgdmFyIGNhbGwgPSB7XG4gICAgICAgIGFjdGlvbjogJ0dldCBsaXN0IG9mIGFwcHMnLFxuICAgICAgICByZXF1ZXN0OiBwYXRoXG4gICAgfTtcbiAgICAvLyBSRVNUX0xvZyhjYWxsLGdlbmVyYXRpb25Vc2VySWQpO1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBxcnMuZ2V0KGNhbGwucmVxdWVzdCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igd2hpbGUgZ2V0dGluZyB0aGUgYXBwcyB2aWEgdGhlIFFSUyBBUEk6IHdlIGNhbiBub3QgY29ubmVjdCB0byBRbGlrIFNlbnNlJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICB9XG59O1xuXG4vL1xuLy8g4pSA4pSA4pSAIERFTEVURUFQUCDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbi8vXG5cblxuZXhwb3J0IGZ1bmN0aW9uIGRlbGV0ZUFwcChndWlkLCBnZW5lcmF0aW9uVXNlcklkID0gJ05vdCBkZWZpbmVkJykge1xuICAgIGNvbnNvbGUubG9nKCdRUlNBcHAgZGVsZXRlQXBwOiAnLCBndWlkKTtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBjYWxsID0ge307XG4gICAgICAgIGNhbGwucmVxdWVzdCA9IHFyc1NydiArICcvcXJzL2FwcC8nICsgZ3VpZDtcbiAgICAgICAgY2FsbC5yZXNwb25zZSA9IEhUVFAuZGVsKGNhbGwucmVxdWVzdCwge1xuICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgeHJma2V5OiBzZW5zZUNvbmZpZy54cmZrZXlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBucG1SZXF1ZXN0T3B0aW9uczogY29uZmlnQ2VydGljYXRlcyxcbiAgICAgICAgICAgIGRhdGE6IHt9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIE1ldGVvci5jYWxsKCd1cGRhdGVMb2NhbFNlbnNlQ29weScpO1xuICAgICAgICAvL2xvZ2dpbmcgb25seVxuICAgICAgICBjYWxsLmFjdGlvbiA9ICdEZWxldGUgYXBwJztcbiAgICAgICAgY2FsbC51cmwgPSBnaXRIdWJMaW5rcy5kZWxldGVBcHA7XG4gICAgICAgIGNhbGwucmVzcG9uc2UgPSBjYWxsLnJlc3BvbnNlO1xuICAgICAgICBSRVNUX0xvZyhjYWxsLCBnZW5lcmF0aW9uVXNlcklkKTtcbiAgICAgICAgcmV0dXJuIGNhbGwucmVzcG9uc2U7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignQXBwIGRlbGV0ZSBmYWlsZWQnLCBlcnIubWVzc2FnZSk7XG4gICAgfVxufTtcblxuXG4vL1xuLy8g4pSA4pSA4pSAIFBVQkxJU0hBUFAg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4vL1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBwdWJsaXNoQXBwKGFwcEd1aWQsIGFwcE5hbWUsIHN0cmVhbUlkLCBjdXN0b21lck5hbWUsIGdlbmVyYXRpb25Vc2VySWQpIHtcbiAgICBjb25zb2xlLmxvZygnUHVibGlzaCBhcHA6ICcgKyBhcHBOYW1lICsgJyB0byBzdHJlYW06ICcgKyBzdHJlYW1JZCk7XG4gICAgY2hlY2soYXBwR3VpZCwgU3RyaW5nKTtcbiAgICBjaGVjayhhcHBOYW1lLCBTdHJpbmcpO1xuICAgIGNoZWNrKHN0cmVhbUlkLCBTdHJpbmcpO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY2FsbCA9IHt9O1xuICAgICAgICBjYWxsLnJlcXVlc3QgPSBxcnNTcnYgKyAnL3Fycy9hcHAvJyArIGFwcEd1aWQgKyAnL3B1Ymxpc2g/bmFtZT0nICsgYXBwTmFtZSArICcmc3RyZWFtPScgKyBzdHJlYW1JZDtcbiAgICAgICAgY2FsbC5yZXNwb25zZSA9IEhUVFAucHV0KGNhbGwucmVxdWVzdCwge1xuICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgeHJma2V5OiBzZW5zZUNvbmZpZy54cmZrZXlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBucG1SZXF1ZXN0T3B0aW9uczogY29uZmlnQ2VydGljYXRlcyxcbiAgICAgICAgICAgIGRhdGE6IHt9XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgLy9sb2dnaW5nIGludG8gZGF0YWJhc2VcbiAgICAgICAgY2FsbC5hY3Rpb24gPSAnUHVibGlzaCBhcHAnO1xuICAgICAgICBjYWxsLnVybCA9IGdpdEh1YkxpbmtzLnB1Ymxpc2hBcHA7XG4gICAgICAgIFJFU1RfTG9nKGNhbGwsIGdlbmVyYXRpb25Vc2VySWQpO1xuICAgICAgICByZXR1cm4gY2FsbC5yZXNwb25zZTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuXG4gICAgICAgIC8vIC8vIElGIEFQUCBBTFJFQURZIEVYSVNURUQgVFJZIFRPIFBVQkxJU0ggT1ZFUldSSVRFIElUIChSRVBMQUNFKVxuICAgICAgICAvLyBpZihlcnIucmVzcG9uc2Uuc3RhdHVzQ29kZSA9PSA0MDApe1xuICAgICAgICAvLyAgICAgcmVwbGFjZUFwcCgpXG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gY29uc29sZS5lcnJvcignc3RhdHVzQ29kZTonLCBlcnIucmVzcG9uc2Uuc3RhdHVzQ29kZSk7XG4gICAgICAgIC8vIGNvbnNvbGUuaW5mbygnVHJ5IHRvIFBVQkxJU0ggT1ZFUldSSVRFIFRIRSBBUFAsIFNJTkNFIElUIFdBUyBBTFJFQURZIFBVQkxJU0hFRCcpO1xuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdQdWJsaWNhdGlvbiBvZiBhcHAgJyArIGFwcE5hbWUgKyAnIGZvciBjdXN0b21lciAnICsgY3VzdG9tZXJOYW1lICsgJyBmYWlsZWQ6ICcsIGVyci5tZXNzYWdlKTtcbiAgICB9XG59O1xuXG4vLyBSRVBMQUNFIEFQUCBcbi8vIGV4cG9ydCBmdW5jdGlvbiByZXBsYWNlQXBwKHRhcmdldEFwcCwgcmVwbGFjZUJ5QXBwLCBnZW5lcmF0aW9uVXNlcklkKSB7XG4vLyAgICAgY29uc29sZS5sb2coJ0Z1bmN0aW9uOiBSZXBsYWNlIGFwcDogJyArIHRhcmdldEFwcCArICcgYnkgYXBwICcgKyB0YXJnZXRBcHApO1xuLy8gICAgIGNoZWNrKGFwcEd1aWQsIFN0cmluZyk7XG4vLyAgICAgY2hlY2socmVwbGFjZUJ5QXBwLCBTdHJpbmcpO1xuXG4vLyAgICAgdHJ5IHtcbi8vICAgICAgICAgY29uc3QgcmVzdWx0ID0gSFRUUC5wdXQocWxpa0hEUlNlcnZlciArICcvcXJzL2FwcC8nICsgcmVwbGFjZUJ5QXBwICsgJy9yZXBsYWNlP2FwcD0nICsgdGFyZ2V0QXBwICsgJyZ4cmZrZXk9JyArIHNlbnNlQ29uZmlnLnhyZmtleSwge1xuLy8gICAgICAgICAgICAgaGVhZGVyczoge1xuLy8gICAgICAgICAgICAgICAgICdoZHItdXNyJzogc2Vuc2VDb25maWcuaGVhZGVyVmFsdWUsXG4vLyAgICAgICAgICAgICAgICAgJ1gtUWxpay14cmZrZXknOiBzZW5zZUNvbmZpZy54cmZrZXlcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgfSk7XG5cbi8vICAgICAgICAgLy9sb2dnaW5nIGludG8gZGF0YWJhc2Vcbi8vICAgICAgICAgY29uc3QgY2FsbCA9IHt9O1xuLy8gICAgICAgICBjYWxsLmFjdGlvbiA9ICdSZXBsYWNlIGFwcCc7XG4vLyAgICAgICAgIGNhbGwucmVxdWVzdCA9ICdIVFRQLnB1dCgnICsgcWxpa0hEUlNlcnZlciArICcvcXJzL2FwcC8nICsgcmVwbGFjZUJ5QXBwICsgJy9yZXBsYWNlP2FwcD0nICsgdGFyZ2V0QXBwICsgJyZ4cmZrZXk9JyArIHNlbnNlQ29uZmlnLnhyZmtleTtcbi8vICAgICAgICAgY2FsbC5yZXNwb25zZSA9IHJlc3VsdDtcbi8vICAgICAgICAgY2FsbC51cmwgPSAnaHR0cDovL2hlbHAucWxpay5jb20vZW4tVVMvc2Vuc2UtZGV2ZWxvcGVyL0p1bmUyMDE3L1N1YnN5c3RlbXMvUmVwb3NpdG9yeVNlcnZpY2VBUEkvQ29udGVudC9SZXBvc2l0b3J5U2VydmljZUFQSS9SZXBvc2l0b3J5U2VydmljZUFQSS1BcHAtUmVwbGFjZS5odG0nO1xuLy8gICAgICAgICBSRVNUX0xvZyhjYWxsLCBnZW5lcmF0aW9uVXNlcklkKTtcbi8vICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbi8vICAgICB9IGNhdGNoIChlcnIpIHtcbi8vICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuLy8gICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdQdWJsaWNhdGlvbiBvZiBhcHAgJyArIGFwcE5hbWUgKyAnIGZvciBjdXN0b21lciAnICsgY3VzdG9tZXJOYW1lICsgJyBmYWlsZWQ6ICcsIGVyci5tZXNzYWdlKTtcbi8vICAgICB9XG4vLyB9O1xuXG5cbi8vIGZ1bmN0aW9uIGNyZWF0ZVRhZyhuYW1lKSB7XG4vLyAgICAgY2hlY2sobmFtZSwgU3RyaW5nKTtcbi8vICAgICAvLyBjb25zb2xlLmxvZygnUVJTIEZ1bmN0aW9ucyBBcHBwLCBjcmVhdGUgYSB0YWc6ICcgKyBuYW1lKTtcblxuLy8gICAgIHRyeSB7XG4vLyAgICAgICAgIGNvbnN0IHJlc3VsdCA9IEhUVFAucG9zdChxbGlrSERSU2VydmVyICsgJy9xcnMvVGFnJywge1xuLy8gICAgICAgICAgICAgaGVhZGVyczogYXV0aEhlYWRlcnMsXG4vLyAgICAgICAgICAgICBwYXJhbXM6IHtcbi8vICAgICAgICAgICAgICAgICAneHJma2V5Jzogc2Vuc2VDb25maWcueHJma2V5XG4vLyAgICAgICAgICAgICB9LFxuLy8gICAgICAgICAgICAgZGF0YToge1xuLy8gICAgICAgICAgICAgICAgIFwibmFtZVwiOiBuYW1lXG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgIH0pXG5cbi8vICAgICAgICAgLy9sb2dnaW5nIG9ubHlcbi8vICAgICAgICAgY29uc3QgY2FsbCA9IHt9O1xuLy8gICAgICAgICBjYWxsLmFjdGlvbiA9ICdjcmVhdGUgVGFnJztcbi8vICAgICAgICAgY2FsbC5yZXF1ZXN0ID0gJ0hUVFAuZ2V0KGh0dHA6Ly8nICsgc2Vuc2VDb25maWcuU2Vuc2VTZXJ2ZXJJbnRlcm5hbExhbklQICsgJzonICsgc2Vuc2VDb25maWcucG9ydCArICcvJyArIHNlbnNlQ29uZmlnLnZpcnR1YWxQcm94eSArICcvcXJzL3RhZyc7XG4vLyAgICAgICAgIGNhbGwucmVzcG9uc2UgPSByZXN1bHQ7XG4vLyAgICAgICAgIFJFU1RfTG9nKGNhbGwsIGdlbmVyYXRpb25Vc2VySWQpO1xuXG4vLyAgICAgICAgIHJldHVybiByZXN1bHQ7XG4vLyAgICAgfSBjYXRjaCAoZXJyKSB7XG4vLyAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbi8vICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignVGFnOiAnICsgbmFtZSArICcgY3JlYXRlIGZhaWxlZCAnLCBlcnIubWVzc2FnZSk7XG4vLyAgICAgfVxuLy8gfTtcblxuLy8gZnVuY3Rpb24gYWRkVGFnKHR5cGUsIGd1aWQsIHRhZ05hbWUpIHtcbi8vICAgICBjaGVjayh0eXBlLCBTdHJpbmcpO1xuLy8gICAgIGNoZWNrKGd1aWQsIFN0cmluZyk7XG5cbi8vICAgICAvL2NoZWNrIGlmIHRhZyB3aXRoIHRhZ05hbWUgYWxyZWFkeSBleGlzdHNcblxuLy8gICAgIHZhciBzZWxlY3Rpb25JZCA9IGNyZWF0ZVNlbGVjdGlvbih0eXBlLCBndWlkKTtcbi8vICAgICBhZGRUYWdWaWFTeW50aGV0aWNUb1R5cGUoJ0FwcCcsIHNlbGVjdGlvbklkLCB0YWdHdWlkKVxuXG4vLyB9XG5cbi8vIGZ1bmN0aW9uIGNyZWF0ZVNlbGVjdGlvbih0eXBlLCBndWlkKSB7XG4vLyAgICAgY2hlY2sodHlwZSwgU3RyaW5nKTtcbi8vICAgICBjaGVjayhndWlkLCBTdHJpbmcpO1xuLy8gICAgIGNvbnNvbGUubG9nKCdRUlMgRnVuY3Rpb25zIEFQUCwgY3JlYXRlIHNlbGVjdGlvbiBmb3IgdHlwZTogJywgdHlwZSArICcgJyArIGd1aWQpO1xuXG4vLyAgICAgdHJ5IHtcbi8vICAgICAgICAgY29uc3QgcmVzdWx0ID0gSFRUUC5wb3N0KHFsaWtIRFJTZXJ2ZXIgKyAnL3Fycy9TZWxlY3Rpb24nLCB7XG4vLyAgICAgICAgICAgICBoZWFkZXJzOiBhdXRoSGVhZGVycyxcbi8vICAgICAgICAgICAgIHBhcmFtczoge1xuLy8gICAgICAgICAgICAgICAgICd4cmZrZXknOiBzZW5zZUNvbmZpZy54cmZrZXlcbi8vICAgICAgICAgICAgIH0sXG4vLyAgICAgICAgICAgICBkYXRhOiB7XG4vLyAgICAgICAgICAgICAgICAgaXRlbXM6IFt7XG4vLyAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4vLyAgICAgICAgICAgICAgICAgICAgIG9iamVjdElEOiBndWlkXG4vLyAgICAgICAgICAgICAgICAgfV1cbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgfSlcbi8vICAgICAgICAgY29uc29sZS5sb2coJ3RoZSByZXN1bHQgb2Ygc2VsZWN0aW9uIGZvciB0eXBlOiAnLCB0eXBlICsgJyAnICsgZ3VpZCk7XG4vLyAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4vLyAgICAgICAgIHJldHVybiByZXN1bHQuaWQ7XG4vLyAgICAgfSBjYXRjaCAoZXJyKSB7XG4vLyAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbi8vICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignU2VsZWN0aW9uOiAnICsgdHlwZSArICcgZmFpbGVkIGZvciBndWlkICcgKyBndWlkLCBlcnIubWVzc2FnZSk7XG4vLyAgICAgfVxuLy8gfTtcblxuLy8gZnVuY3Rpb24gZGVsZXRlU2VsZWN0aW9uKHNlbGVjdGlvbklkKSB7XG4vLyAgICAgY2hlY2soc2VsZWN0aW9uSWQsIFN0cmluZyk7XG4vLyAgICAgY29uc29sZS5sb2coJ1FSUyBGdW5jdGlvbnMgQVBQLCBkZWxldGVTZWxlY3Rpb24gc2VsZWN0aW9uIGZvciBzZWxlY3Rpb25JZDogJywgc2VsZWN0aW9uSWQpO1xuXG4vLyAgICAgdHJ5IHtcbi8vICAgICAgICAgY29uc3QgcmVzdWx0ID0gSFRUUC5kZWxldGUocWxpa0hEUlNlcnZlciArICcvcXJzL1NlbGVjdGlvbi8nICsgc2VsZWN0aW9uSWQsIHtcbi8vICAgICAgICAgICAgIGhlYWRlcnM6IGF1dGhIZWFkZXJzLFxuLy8gICAgICAgICAgICAgcGFyYW1zOiB7XG4vLyAgICAgICAgICAgICAgICAgJ3hyZmtleSc6IHNlbnNlQ29uZmlnLnhyZmtleVxuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICB9KVxuLy8gICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHQpO1xuLy8gICAgICAgICByZXR1cm4gcmVzdWx0LmlkO1xuLy8gICAgIH0gY2F0Y2ggKGVycikge1xuLy8gICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4vLyAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ1NlbGVjdGlvbiBkZWxldGUgZmFpbGVkOiAnLCBlcnIubWVzc2FnZSk7XG4vLyAgICAgfVxuLy8gfTtcblxuLy8gZnVuY3Rpb24gYnVpbGRNb2REYXRlKCkge1xuLy8gICAgIHZhciBkID0gbmV3IERhdGUoKTtcbi8vICAgICByZXR1cm4gZC50b0lTT1N0cmluZygpO1xuLy8gfVxuXG4vLyBmdW5jdGlvbiBhZGRUYWdWaWFTeW50aGV0aWNUb1R5cGUodHlwZSwgc2VsZWN0aW9uSWQsIHRhZ0d1aWQpIHtcbi8vICAgICBjaGVjayh0eXBlLCBTdHJpbmcpO1xuLy8gICAgIGNoZWNrKGd1aWQsIFN0cmluZyk7XG4vLyAgICAgY29uc29sZS5sb2coJ1FSUyBGdW5jdGlvbnMgQXBwcCwgVXBkYXRlIGFsbCBlbnRpdGllcyBvZiBhIHNwZWNpZmljIHR5cGU6ICcgKyB0eXBlICsgJ8KgaW4gdGhlIHNlbGVjdGlvbiBzZXQgaWRlbnRpZmllZCBiecKge2lkfSAnICsgc2VsZWN0aW9uSWQgKyAnwqBiYXNlZCBvbiBhbiBleGlzdGluZyBzeW50aGV0aWMgb2JqZWN0LsKgOiAnKTtcblxuLy8gICAgIHRyeSB7XG4vLyAgICAgICAgIGNvbnN0IHJlc3VsdCA9IEhUVFAucHV0KHFsaWtIRFJTZXJ2ZXIgKyAnL3Fycy9TZWxlY3Rpb24vJyArIHNlbGVjdGlvbklkICsgJy8nICsgdHlwZSArICcvc3ludGhldGljJywge1xuLy8gICAgICAgICAgICAgaGVhZGVyczogYXV0aEhlYWRlcnMsXG4vLyAgICAgICAgICAgICBwYXJhbXM6IHtcbi8vICAgICAgICAgICAgICAgICAneHJma2V5Jzogc2Vuc2VDb25maWcueHJma2V5XG4vLyAgICAgICAgICAgICB9LFxuLy8gICAgICAgICAgICAgZGF0YToge1xuLy8gICAgICAgICAgICAgICAgIFwibGF0ZXN0TW9kaWZpZWREYXRlXCI6IGJ1aWxkTW9kRGF0ZSgpLFxuLy8gICAgICAgICAgICAgICAgIFwicHJvcGVydGllc1wiOiBbe1xuLy8gICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJyZWZMaXN0X1RhZ1wiLFxuLy8gICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIFwiYWRkZWRcIjogW3RhZ0d1aWRdXG4vLyAgICAgICAgICAgICAgICAgICAgIH0sXG4vLyAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVJc01vZGlmaWVkXCI6IHRydWVcbi8vICAgICAgICAgICAgICAgICB9XSxcbi8vICAgICAgICAgICAgICAgICBcInR5cGVcIjogdHlwZVxuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICB9KVxuLy8gICAgICAgICBjb25zb2xlLmxvZygndGhlIHJlc3VsdCBvZiBzZWxlY3Rpb24gZm9yIHR5cGU6ICcsIHR5cGUgKyAnICcgKyBndWlkKTtcbi8vICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbi8vICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbi8vICAgICB9IGNhdGNoIChlcnIpIHtcbi8vICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuLy8gICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdTZWxlY3Rpb246ICcgKyB0eXBlICsgJyBmYWlsZWQgZm9yIGd1aWQgJyArIGd1aWQsIGVyci5tZXNzYWdlKTtcbi8vICAgICB9XG4vLyB9O1xuXG5cbi8vIGFzeW5jIGZ1bmN0aW9uIHVwbG9hZFB1Ymxpc2hUZW1wbGF0ZUFwcHMoKSB7XG4vLyAgICAgLy9jaGVjayBpZiB0ZW1wbGF0ZSBhcHBzIGhhdmUgYmVlbiB1cGxvYWRlZCBhbmQgcHVibGlzaGVkIGluIHRoZSB0ZW1wbGF0ZXMgc3RyZWFtXG4vLyAgICAgLy8gaWYgKHRydWUpIHsgLy8gKCFBcHBzLmZpbmQoeyBcInN0cmVhbS5uYW1lXCI6IFwiVGVtcGxhdGVzXCIgfSkuY291bnQoKSkge1xuLy8gICAgIGNvbnNvbGUud2Fybignbm8gdGVtcGxhdGUgYXBwcyBmb3VuZCwgc28gdXBsb2FkIGZyb20gdGhlIHRlbXBsYXRlcyBkaXIuJyk7XG4vLyAgICAgdmFyIGZvbGRlciA9IE1ldGVvci5zZXR0aW5ncy5wcml2YXRlLnRlbXBsYXRlQXBwc0Zyb207XG4vLyAgICAgLy8gdmFyIGZvbGRlciA9IGF3YWl0IGNvcHlUZW1wbGF0ZXNUb1FSU0ZvbGRlcigpO1xuLy8gICAgIGNvbnNvbGUubG9nKCdhcHBzIGZvbGRlcicsIGZvbGRlcik7XG4vLyAgICAgdXBsb2FkQW5kUHVibGlzaEFwcHMoZm9sZGVyKTtcbi8vICAgICAvLyB9IGVsc2Uge31cbi8vIH1cblxuLy8gLy91cGxvYWQgYW5kIHB1Ymxpc2ggYWxsIGFwcHMgZm91bmQgaW4gdGhlIGZvbGRlciB0byB0aGUgdGVtcGxhdGVzIHN0cmVhbVxuLy8gYXN5bmMgZnVuY3Rpb24gY29weVRlbXBsYXRlc1RvUVJTRm9sZGVyKCkge1xuLy8gICAgIHZhciBuZXdGb2xkZXIgPSBNZXRlb3Iuc2V0dGluZ3MucHJpdmF0ZS50ZW1wbGF0ZUFwcHNUbyArICdcXFxcJyArIHByb2Nlc3MuZW52LlVTRVJET01BSU4gKyAnXFxcXCcgKyBwcm9jZXNzLmVudi5VU0VSTkFNRTtcbi8vICAgICB0cnkge1xuLy8gICAgICAgICBhd2FpdCBmcy5jb3B5KE1ldGVvci5zZXR0aW5ncy5wcml2YXRlLnRlbXBsYXRlQXBwc0Zyb20sIG5ld0ZvbGRlciwge1xuLy8gICAgICAgICAgICAgb3ZlcndyaXRlOiB0cnVlXG4vLyAgICAgICAgIH0pOyAvL1wiUUxJSy1BQjBRMlVSTjVUXFxcXFFsaWtleHRlcm5hbFwiLFxuLy8gICAgICAgICByZXR1cm4gbmV3Rm9sZGVyXG4vLyAgICAgfSBjYXRjaCAoZXJyKSB7XG4vLyAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2Vycm9yIGNvcHkgVGVtcGxhdGVzIGZyb20gJyArIE1ldGVvci5zZXR0aW5ncy5wcml2YXRlLnRlbXBsYXRlQXBwc0Zyb20gKyAnIFRvIFFSU0ZvbGRlciAnICsgTWV0ZW9yLnNldHRpbmdzLnByaXZhdGUudGVtcGxhdGVBcHBzRGlyLCBlcnIpO1xuLy8gICAgIH1cbi8vIH1cblxuLy8gRm9yIGEgc3lzdGVtIHNlcnZpY2UgYWNjb3VudCwgdGhlIGFwcCBtdXN0IGJlIGluIHRoZSAlUHJvZ3JhbURhdGElXFxRbGlrXFxTZW5zZVxcUmVwb3NpdG9yeVxcRGVmYXVsdEFwcHMgZm9sZGVyLlxuLy8gRm9yIGFueSBvdGhlciBhY2NvdW50LCB0aGUgYXBwIG11c3QgYmUgaW4gdGhlICVQcm9ncmFtRGF0YSVcXFFsaWtcXFNlbnNlXFxBcHBzXFw8bG9naW4gZG9tYWluPlxcPGxvZ2luIHVzZXI+IGZvbGRlci5cbi8vc28geW91IGhhdmUgdG8gY29weSB5b3VyIGFwcHMgdGhlcmUgZmlyc3QuIGluIGEgZnJlc2ggc2Vuc2UgaW5zdGFsbGF0aW9uLlxuZXhwb3J0IGZ1bmN0aW9uIGltcG9ydEFwcChmaWxlTmFtZSwgbmFtZSwgZ2VuZXJhdGlvblVzZXJJZCA9ICdubyB1c2VyIHNldCcpIHtcbiAgICAvLyBjaGVjayhmaWxlTmFtZSwgU3RyaW5nKTtcbiAgICAvLyBjaGVjayhuYW1lLCBTdHJpbmcpO1xuICAgIC8vIGNvbnNvbGUubG9nKCdRUlMgRnVuY3Rpb25zIGltcG9ydCBBcHAsIHdpdGggbmFtZSAnICsgbmFtZSArICcsIHdpdGggZmlsZU5hbWU6ICcsIGZpbGVOYW1lKTtcblxuICAgIC8vIHRyeSB7XG4gICAgLy8gICAgIGNvbnN0IGNhbGwgPSB7fTtcbiAgICAvLyAgICAgY2FsbC5hY3Rpb24gPSAnSW1wb3J0IGFwcCc7XG4gICAgLy8gICAgIGNhbGwudXJsID0gJ2h0dHA6Ly9oZWxwLnFsaWsuY29tL2VuLVVTL3NlbnNlLWRldmVsb3Blci8zLjIvU3Vic3lzdGVtcy9SZXBvc2l0b3J5U2VydmljZUFQSS9Db250ZW50L1JlcG9zaXRvcnlTZXJ2aWNlQVBJL1JlcG9zaXRvcnlTZXJ2aWNlQVBJLUFwcC1JbXBvcnQtQXBwLmh0bSdcbiAgICAvLyAgICAgY2FsbC5yZXF1ZXN0ID0gcWxpa0hEUlNlcnZlciArICcvcXJzL2FwcC9pbXBvcnQ/a2VlcERhdGE9dHJ1ZSZuYW1lPScgKyBuYW1lICsgJyZ4cmZrZXk9JyArIHNlbnNlQ29uZmlnLnhyZmtleTsgLy91c2luZyBoZWFkZXIgYXV0aC5cbiAgICAvLyAgICAgY2FsbC5yZXNwb25zZSA9IEhUVFAucG9zdChjYWxsLnJlcXVlc3QsIHtcbiAgICAvLyAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAvLyAgICAgICAgICAgICAnaGRyLXVzcic6IHNlbnNlQ29uZmlnLmhlYWRlclZhbHVlLFxuICAgIC8vICAgICAgICAgICAgICdYLVFsaWsteHJma2V5Jzogc2Vuc2VDb25maWcueHJma2V5XG4gICAgLy8gICAgICAgICB9LFxuICAgIC8vICAgICAgICAgZGF0YTogJ1wiU2FsZXMucXZmXCInXG4gICAgLy8gICAgIH0pO1xuXG4gICAgLy8gICAgIFJFU1RfTG9nKGNhbGwsIGdlbmVyYXRpb25Vc2VySWQpO1xuICAgIC8vICAgICB2YXIgbmV3R3VpZCA9IGNhbGwucmVzcG9uc2UuZGF0YS5pZDtcbiAgICAvLyAgICAgcmV0dXJuIG5ld0d1aWQ7XG4gICAgLy8gfSBjYXRjaCAoZXJyKSB7XG4gICAgLy8gICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAvLyAgICAgY29uc3QgY2FsbCA9IHt9O1xuICAgIC8vICAgICBjYWxsLmFjdGlvbiA9ICdJbXBvcnQgYXBwIEZBSUxFRCc7XG4gICAgLy8gICAgIGNhbGwucmVzcG9uc2UgPSBlcnIubWVzc2FnZTtcbiAgICAvLyAgICAgUkVTVF9Mb2coY2FsbCwgZ2VuZXJhdGlvblVzZXJJZCk7XG4gICAgLy8gICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ0ltcG9ydCBhcHAgZmFpbGVkJywgZXJyLm1lc3NhZ2UpO1xuICAgIC8vIH1cbn07XG5cbi8vaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2UvcmVxdWVzdCNmb3Jtc1xuLy8gZnVuY3Rpb24gdXBsb2FkQXBwKGZpbGVQYXRoLCBmaWxlU2l6ZSwgYXBwTmFtZSkge1xuLy8gICAgIGNvbnNvbGUubG9nKCdRUlMgRnVuY3Rpb25zIHVwbG9hZCBBcHAsIHdpdGggbmFtZSAnICsgYXBwTmFtZSArICcsIHdpdGggZmlsZVNpemU6ICcsIGZpbGVTaXplICsgJyBhbmQgZmlsZVBhdGggJyArIGZpbGVQYXRoKTtcbi8vICAgICB2YXIgZm9ybURhdGEgPSB7XG4vLyAgICAgICAgIG15X2ZpbGU6IGZzLmNyZWF0ZVJlYWRTdHJlYW0oZmlsZVBhdGgpXG4vLyAgICAgfTtcbi8vICAgICByZXF1ZXN0LnBvc3Qoe1xuLy8gICAgICAgICB1cmw6IHFsaWtIRFJTZXJ2ZXIgKyAnL3Fycy9hcHAvdXBsb2FkP25hbWU9JyArIGFwcE5hbWUgKyAnJnhyZmtleT0nICsgc2Vuc2VDb25maWcueHJma2V5LFxuLy8gICAgICAgICBoZWFkZXJzOiB7XG4vLyAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3ZuZC5xbGlrLnNlbnNlLmFwcCcsXG4vLyAgICAgICAgICAgICAnaGRyLXVzcic6IHNlbnNlQ29uZmlnLmhlYWRlclZhbHVlLFxuLy8gICAgICAgICAgICAgJ1gtUWxpay14cmZrZXknOiBzZW5zZUNvbmZpZy54cmZrZXlcbi8vICAgICAgICAgfSxcbi8vICAgICAgICAgZm9ybURhdGE6IGZvcm1EYXRhXG4vLyAgICAgfSwgZnVuY3Rpb24gb3B0aW9uYWxDYWxsYmFjayhlcnIsIGh0dHBSZXNwb25zZSwgYm9keSkge1xuLy8gICAgICAgICBpZiAoZXJyKSB7XG4vLyAgICAgICAgICAgICByZXR1cm4gY29uc29sZS5lcnJvcigndXBsb2FkIGZhaWxlZDonLCBlcnIpO1xuLy8gICAgICAgICB9XG4vLyAgICAgICAgIGNvbnNvbGUubG9nKCdVcGxvYWQgc3VjY2Vzc2Z1bCEgIFNlcnZlciByZXNwb25kZWQgd2l0aDonLCBib2R5KTtcbi8vICAgICB9KTtcbi8vIH0iLCJpbXBvcnQge1xuICAgIE1ldGVvclxufSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7XG4gICAgbXlRUlNcbn0gZnJvbSAnL2ltcG9ydHMvYXBpL3NlcnZlci9RUlNBUEknO1xuXG52YXIgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcblxuaW1wb3J0IHtcbiAgICBzZW5zZUNvbmZpZyxcbiAgICBxcnNcbn0gZnJvbSAnL2ltcG9ydHMvYXBpL2NvbmZpZy5qcyc7XG5cbi8vIGh0dHA6Ly9oZWxwLnFsaWsuY29tL2VuLVVTL3NlbnNlLWRldmVsb3Blci9KdW5lMjAxNy9TdWJzeXN0ZW1zL1JlcG9zaXRvcnlTZXJ2aWNlQVBJL0NvbnRlbnQvUmVwb3NpdG9yeVNlcnZpY2VBUEkvUmVwb3NpdG9yeVNlcnZpY2VBUEktQ3VzdG9tLVByb3BlcnR5LUFkZC5odG1cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDdXN0b21Qcm9wZXJ0eShuYW1lLCBuZXdQcm9wZXJ0eSkge1xuICAgIGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgICBjb25zb2xlLmxvZygnY3JlYXRlQ3VzdG9tUHJvcGVydHknLCBuYW1lICsgJyAnICsgbmV3UHJvcGVydHkudG9TdHJpbmcoKSlcbiAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJyk7XG5cbiAgICB0cnkge1xuICAgICAgICBjaGVjayhuYW1lLCBTdHJpbmcpO1xuICAgICAgICBjaGVjayhuZXdQcm9wZXJ0eSwgT2JqZWN0KTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignY3JlYXRlQ3VzdG9tUHJvcGVydHk6IE1pc3NpbmcgdmFsdWVzJywgJ1lvdSBkaWQgbm90IHNwZWNpZnkgYSBuYW1lIG9yIGNob2ljZSB2YWx1ZXMgZm9yIHRoZSBjdXN0b20gcHJvcGVydHknKTtcbiAgICB9XG5cbiAgICB2YXIgcmVzdWx0ID0gcXJzLnBvc3QoJy9xcnMvQ3VzdG9tUHJvcGVydHlEZWZpbml0aW9uJywgbnVsbCwgbmV3UHJvcGVydHkpO1xuICAgIGNvbnNvbGUubG9nKCdyZXN1bHQgb2YgY3JlYXRlIGN1c3RvbSBwcm9wZXJ0eTogJywgcmVzdWx0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVwc2VydEN1c3RvbVByb3BlcnR5QnlOYW1lKG5hbWUsIGNob2ljZVZhbHVlcykge1xuICAgIHRyeSB7XG4gICAgICAgIGNoZWNrKG5hbWUsIFN0cmluZyk7XG4gICAgICAgIGNoZWNrKGNob2ljZVZhbHVlcywgQXJyYXkpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCd1cHNlcnRDdXN0b21Qcm9wZXJ0eUJ5TmFtZTogTWlzc2luZyB2YWx1ZXMnLCAnWW91IGRpZCBub3Qgc3BlY2lmeSBhIG5hbWUgb3IgdXBkYXRlIG9iamVjdCBmb3IgdGhlIGN1c3RvbSBwcm9wZXJ0eScpO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIHZhciBuZXdQcm9wZXJ0eSA9IHtcbiAgICAgICAgICAgIFwibmFtZVwiOiBuYW1lLFxuICAgICAgICAgICAgXCJ2YWx1ZVR5cGVcIjogXCJUZXh0XCIsXG4gICAgICAgICAgICBcIm9iamVjdFR5cGVzXCI6IFtcIkFwcFwiLCBcIkNvbnRlbnRMaWJyYXJ5XCIsIFwiRGF0YUNvbm5lY3Rpb25cIiwgXCJSZWxvYWRUYXNrXCIsIFwiU3RyZWFtXCIsIFwiVXNlclwiXSxcbiAgICAgICAgICAgIFwiY2hvaWNlVmFsdWVzXCI6IGNob2ljZVZhbHVlc1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGV4aXN0aW5nUHJvcGVydHkgPSBnZXRDdXN0b21Qcm9wZXJ0aWVzKG5hbWUpWzBdO1xuICAgICAgICBpZiAoZXhpc3RpbmdQcm9wZXJ0eSkgeyAvL3VwZGF0ZSBpdFxuICAgICAgICAgICAgdmFyIHVwZGF0ZWRQcm9wZXJ0eSA9IE9iamVjdC5hc3NpZ24oZXhpc3RpbmdQcm9wZXJ0eSwgbmV3UHJvcGVydHkpO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHFycy5wdXQoJy9xcnMvQ3VzdG9tUHJvcGVydHlEZWZpbml0aW9uLycgKyB1cGRhdGVkUHJvcGVydHkuaWQsIG51bGwsIHVwZGF0ZWRQcm9wZXJ0eSk7IC8veW91IGNhbiBvbmx5IHVwZGF0ZSB3aGVuIHlvdSBzdXBwbHkgdGhlIG9yaWdpbmFsIG1vZGlmaWVkIGRhdGUsIG90aGVyd2lzZSB5b3UgZ2V0IGEgNDA5IGVycm9yLiBcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdDdXN0b20gcHJvcGVydHkgdXBkYXRlOiAnLCByZXN1bHQpO1xuICAgICAgICB9IGVsc2UgeyAvL2NyZWF0ZSBhIG5ldyBvbmVcbiAgICAgICAgICAgIGNyZWF0ZUN1c3RvbVByb3BlcnR5KG5hbWUsIG5ld1Byb3BlcnR5KTtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdlcnJvciB1cHNlcnRpbmcgY3VzdG9tIHByb3BlcnR5JywgZXJyb3IpO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlbGV0ZUN1c3RvbVByb3BlcnR5KG5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnZGVsZXRlQ3VzdG9tUHJvcGVydHkobmFtZSknLCBuYW1lKTtcblxuICAgIHZhciBjdXN0b21Qcm9wZXJ0eSA9IGdldEN1c3RvbVByb3BlcnRpZXMobmFtZSlbMF07XG4gICAgaWYgKGN1c3RvbVByb3BlcnR5KSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBxcnMuZGVsKCcvcXJzL0N1c3RvbVByb3BlcnR5RGVmaW5pdGlvbi8nICsgY3VzdG9tUHJvcGVydHkuaWQpO1xuICAgICAgICBjb25zb2xlLmxvZygncmVzdWx0IGFmdGVyIGRlbGV0ZScsIHJlc3VsdCk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXN0b21Qcm9wZXJ0aWVzKG5hbWUpIHtcbiAgICB2YXIgZmlsdGVyID0gbmFtZSA/IHtcbiAgICAgICAgZmlsdGVyOiBcIk5hbWUgZXEgJ1wiICsgbmFtZSArIFwiJ1wiXG4gICAgfSA6IG51bGw7XG4gICAgdmFyIGN1c3RvbVByb3BlcnRpZXMgPSBxcnMuZ2V0KCcvcXJzL0N1c3RvbVByb3BlcnR5RGVmaW5pdGlvbi9mdWxsJywgZmlsdGVyKTtcblxuICAgIHZhciBmaWxlID0gcGF0aC5qb2luKE1ldGVvci5zZXR0aW5ncy5icm9rZXIuYXV0b21hdGlvbkJhc2VGb2xkZXIsICdjdXN0b21Qcm9wZXJ0aWVzJywgJ2V4cG9ydCcsICdFeHRyYWN0ZWRDdXN0b21Qcm9wZXJ0aWVzLmpzb24nKTtcblxuICAgIC8vIFNBVkUgRklMRSBUTyBESVNLXG4gICAgZnMub3V0cHV0RmlsZShmaWxlLCBKU09OLnN0cmluZ2lmeShjdXN0b21Qcm9wZXJ0aWVzLCBudWxsLCAyKSwgJ3V0Zi04Jyk7XG5cbiAgICByZXR1cm4gY3VzdG9tUHJvcGVydGllcztcbn0iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IG15UVJTIH0gZnJvbSAnL2ltcG9ydHMvYXBpL3NlcnZlci9RUlNBUEknO1xuXG5cbi8vXG4vLyDilIDilIDilIAgSU1QT1JUIENPTkZJRyBGT1IgUUxJSyBTRU5TRSBRUlMgQU5EIEVOR0lORSBBUEkg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4vL1xuXG5cbmltcG9ydCB7XG4gICAgcWxpa0hEUlNlcnZlciwgLy8gUWxpayBzZW5zZSBRUlMgZW5kcG9pbnQgdmlhIGhlYWRlciBhdXRoZW50aWNhdGlvblxuICAgIHNlbnNlQ29uZmlnLFxufSBmcm9tICcvaW1wb3J0cy9hcGkvY29uZmlnLmpzJztcblxuLy9cbi8vIOKUgOKUgOKUgCBJTlNUQUxMIE5QTSBNT0RVTEVTIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuLy9cblxuY29uc3QgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IGVuaWdtYSA9IHJlcXVpcmUoJ2VuaWdtYS5qcycpO1xudmFyIHByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xudmFyIHJlcXVlc3QgPSByZXF1aXJlKCdyZXF1ZXN0Jyk7XG52YXIgcXJzID0gbmV3IG15UVJTKCk7XG5cbi8vIGV4cG9ydCBhc3luYyBmdW5jdGlvbiBhdXRvbWF0aWNVcGxvYWRFeHRlbnNpb25zKCkge1xuLy8gICAgIGNvbnNvbGUubG9nKCdBdXRvbWF0aWNhbGx5IGRvd25sb2FkIHRoZSBleHRlbnNpb25zIGZyb20gR2l0aHViIGFuZCB1cGxvYWQgdG8gUWxpayBTZW5zZScpO1xuLy8gICAgIHZhciB1cmwgPSAnaHR0cHM6Ly9naXRodWIuY29tL2thaS9xbGlrLXNlbnNlLXRpbWVsaW5lLmdpdCc7XG4vLyAgICAgdmFyIHJlcSA9IHJlcXVlc3QuZ2V0KHVybCk7XG4vLyAgICAgY29uc29sZS5sb2coJ3JlcScsIHJlcSlcblxuLy8gfVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBsb2FkRXh0ZW5zaW9ucygpIHtcbiAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1VUExPQUQgRVhURU5TSU9OUycpO1xuICAgIC8vIExPQUQgQUxMIEVYVEVOU0lPTlMgSU4gRk9MREVSXG4gICAgdmFyIGV4dGVuc2lvbnNGb2xkZXIgPSAnJztcbiAgICB0cnkge1xuICAgICAgICBleHRlbnNpb25zRm9sZGVyID0gcGF0aC5qb2luKE1ldGVvci5zZXR0aW5ncy5icm9rZXIuYXV0b21hdGlvbkJhc2VGb2xkZXIsICdleHRlbnNpb25zJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdleHRlbnNpb25zRm9sZGVyJywgZXh0ZW5zaW9uc0ZvbGRlcilcbiAgICAgICAgdmFyIGV4dGVuc2lvbnMgPSBhd2FpdCBmcy5yZWFkZGlyKGV4dGVuc2lvbnNGb2xkZXIpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB0aHJvdyBlcnJvcignZXJyb3IgbG9hZGluZyBhbGwgZXh0ZW5zaW9ucyBpbiBmb2xkZXIuJywgZXJyKTtcbiAgICB9XG5cbiAgICAvLyBGT1IgRUFDSCBFWFRFTlNJT04gRk9VTkQsIFVQTE9BRCBJVCAgICBcbiAgICBhd2FpdCBQcm9taXNlLmFsbChleHRlbnNpb25zLm1hcChhc3luYyhleHRlbnNpb24pID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ0N1cnJlbnQgZXh0ZW5zaW9uJywgZXh0ZW5zaW9uKVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy9DUkVBVEUgQSBGSUxFUEFUSCAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBmaWxlUGF0aCA9IHBhdGguam9pbihleHRlbnNpb25zRm9sZGVyLCBleHRlbnNpb24pO1xuXG4gICAgICAgICAgICAvL1VQTE9BRCBUSEUgQVBQLCBHRVQgVEhFIEFQUCBJRCBCQUNLXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gYXdhaXQgdXBsb2FkRXh0ZW5zaW9uKCcnLCBmaWxlUGF0aCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignVW5hYmxlIHRvIHVwbG9hZCB0aGUgYXBwIHRvIFFsaWsgU2Vuc2UuICcsIGVycilcbiAgICAgICAgfVxuICAgIH0pKVxuXG59XG5cblxuYXN5bmMgZnVuY3Rpb24gdXBsb2FkRXh0ZW5zaW9uKHBhc3N3b3JkLCBmaWxlUGF0aCkge1xuXG4gICAgY29uc29sZS5sb2coJ3VwbG9hZEV4dGVuc2lvbjogdHJ5IHRvIHVwbG9hZCBleHRlbnNpb24gZnJvbSBwYXRoOiAnICsgZmlsZVBhdGgpO1xuICAgIHZhciBmb3JtRGF0YSA9IHtcbiAgICAgICAgbXlfZmlsZTogZnMuY3JlYXRlUmVhZFN0cmVhbShmaWxlUGF0aClcbiAgICB9O1xuXG4gICAgLy8gcXJzLnBvc3QoJy9xcnMvZXh0ZW5zaW9uL3VwbG9hZD9wd2Q9JyArIHBhc3N3b3JkLCBkYXRhKVxuICAgIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICByZXF1ZXN0LnBvc3Qoe1xuICAgICAgICAgICAgdXJsOiBxbGlrSERSU2VydmVyICsgJy9xcnMvZXh0ZW5zaW9uL3VwbG9hZD8meHJma2V5PScgKyBzZW5zZUNvbmZpZy54cmZrZXksIC8vcmVtb3ZlZCBwYXNzd29yZCBwYXJhbWV0ZXIsIGFzc3VtZSBibGFua1xuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICdoZHItdXNyJzogc2Vuc2VDb25maWcuaGVhZGVyVmFsdWUsXG4gICAgICAgICAgICAgICAgJ1gtUWxpay14cmZrZXknOiBzZW5zZUNvbmZpZy54cmZrZXlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmb3JtRGF0YTogZm9ybURhdGFcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyb3IsIHJlcywgYm9keSkge1xuICAgICAgICAgICAgaWYgKCFlcnJvcikge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpZCA9IEpTT04ucGFyc2UoYm9keSkuaWQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdVcGxvYWRlZCBcIicgKyBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKSArICcgdG8gUWxpayBTZW5zZS4nKTsgLy9cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1FsaWsgU2Vuc2UgcmVwb3J0ZWQ6ICcsIGJvZHkpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbn0iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IG15UVJTIH0gZnJvbSAnL2ltcG9ydHMvYXBpL3NlcnZlci9RUlNBUEknO1xuXG52YXIgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcblxuXG4vL1xuLy8g4pSA4pSA4pSAIElNUE9SVCBDT05GSUcgRk9SIFFMSUsgU0VOU0UgUVJTIEFORCBFTkdJTkUgQVBJIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuLy9cblxuXG5pbXBvcnQge1xuICAgIHNlbnNlQ29uZmlnLFxuICAgIHFyc1xufSBmcm9tICcvaW1wb3J0cy9hcGkvY29uZmlnLmpzJztcblxudmFyIGRlbW9Vc2VyQWNjZXNzUnVsZSA9IFwiU0FBUyBERU1PIC0gTGljZW5zZSBydWxlIHRvIGdyYW50IHVzZXIgYWNjZXNzXCI7XG5cbi8vIGh0dHA6Ly9oZWxwLnFsaWsuY29tL2VuLVVTL3NlbnNlLWRldmVsb3Blci9KdW5lMjAxNy9TdWJzeXN0ZW1zL1JlcG9zaXRvcnlTZXJ2aWNlQVBJL0NvbnRlbnQvUmVwb3NpdG9yeVNlcnZpY2VBUEkvUmVwb3NpdG9yeVNlcnZpY2VBUEktTGljZW5zZS1BZGQuaHRtIC8vXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMaWNlbnNlKCkge1xuICAgIHZhciBsaWMgPSBxcnMuZ2V0KCcvcXJzL2xpY2Vuc2UnKTtcbiAgICByZXR1cm4gbGljO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0TGljZW5zZSgpIHtcbiAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJyk7XG4gICAgY29uc29sZS5sb2coJ0lOU0VSVCBMSUNFTlNFJyk7XG4gICAgY29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xuICAgIHZhciBleGlzdGluZ0xpY2Vuc2UgPSBxcnMuZ2V0KCcvcXJzL2xpY2Vuc2UnKTtcbiAgICB2YXIgbmV3TGljZW5zZSA9IE1ldGVvci5zZXR0aW5ncy5wcml2YXRlLmxpY2Vuc2U7XG5cbiAgICB0cnkge1xuICAgICAgICBjb25zb2xlLmxvZygnY2hlY2sgaWYgYWxsIHNldHRpbmdzLmpzb24gcGFyYW1ldGVycyBhcmUgc2V0Li4uJylcbiAgICAgICAgY2hlY2soTWV0ZW9yLnNldHRpbmdzLnByaXZhdGUubGljZW5zZSwge1xuICAgICAgICAgICAgc2VyaWFsOiBTdHJpbmcsXG4gICAgICAgICAgICBuYW1lOiBTdHJpbmcsXG4gICAgICAgICAgICBvcmdhbml6YXRpb246IFN0cmluZ1xuICAgICAgICB9KTtcbiAgICAgICAgY2hlY2soTWV0ZW9yLnNldHRpbmdzLnByaXZhdGUuTGljZW5zZUNvbnRyb2xOdW1iZXIsIE51bWJlcik7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ01pc3NpbmcgcGFyYW1ldGVycyBpbiB5b3VyIHNldHRpbmdzLmpzb24gZmlsZSBmb3IgeW91ciBRbGlrIFNlbnNlIGxpY2Vuc2UnLCBlcnIpXG4gICAgfVxuXG4gICAgaWYgKCFleGlzdGluZ0xpY2Vuc2UpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ05vIGV4aXN0aW5nIGxpY2Vuc2UgcHJlc2VudCwgdGhlcmVmb3JlIGluc2VydGVkIGxpY2Vuc2UgaW50byBRbGlrIFNlbnNlLicpXG4gICAgICAgICAgICAvLyB0cnkge1xuICAgICAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKCdVcGRhdGUgdGhlIGV4aXN0aW5nIGxpY2Vuc2UnKTtcbiAgICAgICAgICAgIC8vICAgICBuZXdMaWNlbnNlLmlkID0gZXhpc3RpbmdMaWNlbnNlLmlkO1xuICAgICAgICAgICAgLy8gICAgIHZhciByZXNwb25zZSA9IHFycy5kZWwoJy9xcnMvbGljZW5zZS8nICsgZXhpc3RpbmdMaWNlbnNlLmlkKTtcbiAgICAgICAgICAgIC8vICAgICAvLyB2YXIgcmVzcG9uc2UgPSBxcnMucHV0KCcvcXJzL2xpY2Vuc2UvJyArIG5ld0xpY2Vuc2UuaWQsIG5ld0xpY2Vuc2UsIHsgY29udHJvbDogTWV0ZW9yLnNldHRpbmdzLnByaXZhdGUuTGljZW5zZUNvbnRyb2xOdW1iZXIgfSk7XG4gICAgICAgICAgICAvLyAgICAgLy8gY29uc29sZS5lcnJvcignU3RvcCBsaWNlbnNlIGluc2VydGlvbiwgbGljZW5zZSBmb3IgJyArIGxpYy5vcmdhbml6YXRpb24gKyAnIGlzIGFscmVhZHkgaW5jbHVkZWQ6ICcsIGxpYy5zZXJpYWwpO1xuICAgICAgICAgICAgLy8gICAgIC8vIHRocm93IEVycm9yKCdZb3UgYXJlIHRyeWluZyB0byBpbnNlcnQgYSBsaWNlbnNlIHdoaWxlIHRoZSBRbGlrIFNlbnNlIGlzIGFscmVhZHkgbGljZW5zZWQsIHBsZWFzZSByZW1vdmUgdGhlIGV4aXN0aW5nIG9uZSBpbiB0aGUgUU1DJyk7XG4gICAgICAgICAgICAvLyB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIC8vICAgICAvLyBsaWMgZGlkIG5vdCBhbHJlYWR5IGV4aXN0LlxuICAgICAgICAgICAgLy8gfVxuICAgICAgICB2YXIgcmVzcG9uc2UgPSBxcnMucG9zdCgnL3Fycy9saWNlbnNlJywgeyBjb250cm9sOiBNZXRlb3Iuc2V0dGluZ3MucHJpdmF0ZS5MaWNlbnNlQ29udHJvbE51bWJlciB9LCBuZXdMaWNlbnNlKTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRVc2VyQWNjZXNzUnVsZSgpIHtcbiAgICBjb25zb2xlLmxvZygnaW5zZXJ0IFVzZXJBY2Nlc3MgUnVsZSBmb3IgYWxsIHVzZXJzJyk7XG4gICAgdmFyIGxpY2Vuc2VSdWxlID0ge1xuICAgICAgICBcIm5hbWVcIjogZGVtb1VzZXJBY2Nlc3NSdWxlLFxuICAgICAgICBcImNhdGVnb3J5XCI6IFwiTGljZW5zZVwiLFxuICAgICAgICBcInJ1bGVcIjogXCIoKHVzZXIubmFtZSBsaWtlIFxcXCIqXFxcIikpXCIsXG4gICAgICAgIFwidHlwZVwiOiBcIkN1c3RvbVwiLFxuICAgICAgICBcInByaXZpbGVnZXNcIjogW1wiY3JlYXRlXCIsIFwicmVhZFwiLCBcInVwZGF0ZVwiXSxcbiAgICAgICAgXCJyZXNvdXJjZUZpbHRlclwiOiBcIkxpY2Vuc2UuVXNlckFjY2Vzc0dyb3VwXzUwN2M5YWE1LTg4MTItNDRkOS1hZGU4LTMyODA5Nzg1ZWVjZlwiLFxuICAgICAgICBcImFjdGlvbnNcIjogMSxcbiAgICAgICAgXCJydWxlQ29udGV4dFwiOiBcIlFsaWtTZW5zZU9ubHlcIixcbiAgICAgICAgXCJkaXNhYmxlZFwiOiBmYWxzZSxcbiAgICAgICAgXCJjb21tZW50XCI6IFwiUnVsZSB0byBzZXQgdXAgYXV0b21hdGljIHVzZXIgYWNjZXNzIGZvciBlYWNoIHVzZXIgdGhhdCBoYXMgcmVjZWl2ZWQgYSB0aWNrZXQgdmlhIHlvdXIgU2FhUyBwbGF0Zm9ybVwiLFxuICAgICAgICBcImRpc2FibGVkQWN0aW9uc1wiOiBbXCJ1c2VhY2Nlc3N0eXBlXCJdXG4gICAgfVxuICAgIHZhciBydWxlRXhpc3QgPSBnZXRTeXN0ZW1SdWxlcyhkZW1vVXNlckFjY2Vzc1J1bGUpO1xuICAgIGlmICh0eXBlb2YgcnVsZUV4aXN0WzBdID09ICd1bmRlZmluZWQnIHx8IHJ1bGVFeGlzdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0NyZWF0ZSBhIG5ldyB1c2VyIGxpY2Vuc2UgcnVsZSBzaW5jZSBpdCBkaWQgbm90IGV4aXN0LicpO1xuICAgICAgICB2YXIgcmVzcG9uc2UgPSBxcnMucG9zdCgnL3Fycy9TeXN0ZW1SdWxlJywgbnVsbCwgbGljZW5zZVJ1bGUpO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN5c3RlbVJ1bGVzKG5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnR2V0IHN5c3RlbSBydWxlcyB3aXRoIG5hbWU6ICcgKyBuYW1lKTtcblxuICAgIHZhciBmaWx0ZXIgPSBuYW1lID8geyBmaWx0ZXI6IFwiTmFtZSBlcSAnXCIgKyBuYW1lICsgXCInXCIgfSA6IG51bGw7XG4gICAgdmFyIHJ1bGVzID0gcXJzLmdldCgnL3Fycy9TeXN0ZW1SdWxlL2Z1bGwnLCBmaWx0ZXIpO1xuXG4gICAgdmFyIGZpbGUgPSBwYXRoLmpvaW4oTWV0ZW9yLnNldHRpbmdzLmJyb2tlci5hdXRvbWF0aW9uQmFzZUZvbGRlciwgJ3NlY3VyaXR5cnVsZXMnLCAnZXhwb3J0JywgJ0V4dHJhY3RlZFN5c3RlbVJ1bGVzLmpzb24nKTtcblxuICAgIC8vIFNBVkUgRklMRSBUTyBESVNLXG4gICAgZnMub3V0cHV0RmlsZShmaWxlLCBKU09OLnN0cmluZ2lmeShydWxlcywgbnVsbCwgMiksICd1dGYtOCcpO1xuXG4gICAgcmV0dXJuIHJ1bGVzO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNhdmVTeXN0ZW1SdWxlcygpIHtcbiAgICB2YXIgZmlsZSA9IHBhdGguam9pbihNZXRlb3Iuc2V0dGluZ3MuYnJva2VyLmF1dG9tYXRpb25CYXNlRm9sZGVyLCAnc2VjdXJpdHlydWxlcycsICdleHBvcnQnLCAnRXh0cmFjdGVkU3lzdGVtUnVsZXMuanNvbicpO1xuICAgIGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgICBjb25zb2xlLmxvZygnU2F2ZSBhbGwgc3lzdGVtIHJ1bGVzIGluICcrZmlsZSk7XG4gICAgY29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xuICAgIHZhciBydWxlcyA9IHFycy5nZXQoJy9xcnMvU3lzdGVtUnVsZScpO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgLy8gU0FWRSBGSUxFIFRPIERJU0tcbiAgICAgICAgZnMub3V0cHV0RmlsZShmaWxlLCBKU09OLnN0cmluZ2lmeShydWxlcywgbnVsbCwgMiksICd1dGYtOCcpOyAgICAgICAgXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcigndW5hYmxlIHRvIHNhdmUgc3lzdGVtcnVsZXMsIGRvZXMgdGhlIGRpcmVjdG9yeSBleGlzdD8gQ2hlY2sgeW91ciBhdXRvbWF0aW9uQmFzZUZvbGRlciBpbiB5b3VyIHNldHRpbmdzLmpzb24gZmlsZSwgJywgZXJyb3IpO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IEdlbmVyYXRlZFJlc291cmNlcyB9IGZyb20gJy9pbXBvcnRzL2FwaS9hcHBzLmpzJztcbmltcG9ydCB7IGdpdEh1YkxpbmtzIH0gZnJvbSAnL2ltcG9ydHMvdWkvVUlIZWxwZXJzJztcblxuLy8gaW1wb3J0IGNvbmZpZyBmb3IgUWxpayBTZW5zZSBRUlMgYW5kIEVuZ2luZSBBUElcbmltcG9ydCB7IHNlbnNlQ29uZmlnLCBhdXRoSGVhZGVycywgcXJzU3J2LCBxcnMsIGNvbmZpZ0NlcnRpY2F0ZXMgfSBmcm9tICcvaW1wb3J0cy9hcGkvY29uZmlnLmpzJztcbmltcG9ydCB7IFJFU1RfTG9nIH0gZnJvbSAnL2ltcG9ydHMvYXBpL0FQSUxvZ3MnO1xuXG5jb25zdCBxbGlrU2VydmVyID0gJ2h0dHA6Ly8nICsgc2Vuc2VDb25maWcuU2Vuc2VTZXJ2ZXJJbnRlcm5hbExhbklQICsgJzonICsgc2Vuc2VDb25maWcucG9ydCArICcvJyArIHNlbnNlQ29uZmlnLnZpcnR1YWxQcm94eTtcblxuXG4vL1xuLy8g4pSA4pSA4pSAIENSRUFURSBTVFJFQU1TIEZPUiBUSEUgSU5JVElBTCBTRVRVUCBPRiBRTElLIFNFTlNFIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuLy9cblxuXG5leHBvcnQgZnVuY3Rpb24gaW5pdFNlbnNlU3RyZWFtcygpIHtcbiAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJyk7XG4gICAgY29uc29sZS5sb2coJ0NyZWF0ZSBpbml0aWFsIHN0cmVhbXMnKTtcbiAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJyk7XG5cbiAgICBmb3IgKGNvbnN0IHN0cmVhbU5hbWUgb2YgTWV0ZW9yLnNldHRpbmdzLmJyb2tlci5xbGlrU2Vuc2UuU3RyZWFtc1RvQ3JlYXRlQXV0b21hdGljYWxseSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1RyeSB0byBjcmVhdGUgc3RyZWFtOiAnICsgc3RyZWFtTmFtZSArICcgaWYgaXQgbm90IGFscmVhZHkgZXhpc3RzJyk7XG4gICAgICAgICAgICBpZiAoIWdldFN0cmVhbUJ5TmFtZShzdHJlYW1OYW1lKSkge1xuICAgICAgICAgICAgICAgIGNyZWF0ZVN0cmVhbShzdHJlYW1OYW1lKVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vXG4vLyDilIDilIDilIAgR0VORVJJQyBTVFJFQU0gRlVOQ1RJT05TIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuLy9cblxuXG5leHBvcnQgZnVuY3Rpb24gZGVsZXRlU3RyZWFtKGd1aWQsIGdlbmVyYXRpb25Vc2VySWQpIHtcbiAgICBjb25zb2xlLmxvZygnZGVsZXRlU3RyZWFtOiAnLCBndWlkKTtcbiAgICB0cnkge1xuXG4gICAgICAgIHZhciByZXF1ZXN0ID0gcXJzU3J2ICsgJy9xcnMvc3RyZWFtLycgKyBndWlkO1xuICAgICAgICB2YXIgcmVzcG9uc2UgPSBIVFRQLmRlbChyZXF1ZXN0LCB7XG4gICAgICAgICAgICAnbnBtUmVxdWVzdE9wdGlvbnMnOiBjb25maWdDZXJ0aWNhdGVzLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBMb2dnaW5nXG4gICAgICAgIGNvbnN0IGNhbGwgPSB7fTtcbiAgICAgICAgY2FsbC5hY3Rpb24gPSAnRGVsZXRlIHN0cmVhbSc7XG4gICAgICAgIGNhbGwucmVxdWVzdCA9IFwiSFRUUC5kZWwoXCIgKyBxbGlrU2VydmVyICsgJy9xcnMvc3RyZWFtLycgKyBndWlkICsgJz94cmZrZXk9JyArIHNlbnNlQ29uZmlnLnhyZmtleTtcbiAgICAgICAgY2FsbC5yZXNwb25zZSA9IHJlc3BvbnNlO1xuICAgICAgICBSRVNUX0xvZyhjYWxsLCBnZW5lcmF0aW9uVXNlcklkKTtcbiAgICAgICAgTWV0ZW9yLmNhbGwoJ3VwZGF0ZUxvY2FsU2Vuc2VDb3B5Jyk7XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgLy8gY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAvLyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdEZWxldGUgc3RyZWFtIGZhaWxlZCcsIGVyci5tZXNzYWdlKTtcbiAgICB9XG59O1xuXG5cbi8vXG4vLyDilIDilIDilIAgR0VUIFNUUkVBTSBCWSBOQU1FIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuLy9cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3RyZWFtQnlOYW1lKG5hbWUpIHtcbiAgICB0cnkge1xuICAgICAgICB2YXIgcmVxdWVzdCA9IHFyc1NydiArIFwiL3Fycy9zdHJlYW0vZnVsbD9maWx0ZXI9TmFtZSBlcSAnXCIgKyBuYW1lICsgXCInXCI7XG4gICAgICAgIGNvbnNvbGUubG9nKCdnZXRTdHJlYW1CeU5hbWUgcmVxdWVzdCcsIHJlcXVlc3QpXG4gICAgICAgIHZhciByZXNwb25zZSA9IEhUVFAuZ2V0KHJlcXVlc3QsIHtcbiAgICAgICAgICAgIHBhcmFtczogeyB4cmZrZXk6IHNlbnNlQ29uZmlnLnhyZmtleSB9LFxuICAgICAgICAgICAgbnBtUmVxdWVzdE9wdGlvbnM6IGNvbmZpZ0NlcnRpY2F0ZXMsXG4gICAgICAgICAgICBkYXRhOiB7fVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YVswXTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB0aHJvdyBFcnJvcignZ2V0IHN0cmVhbUJ5TmFtZSBmYWlsZWQnLCBlcnIubWVzc2FnZSk7XG4gICAgfVxufVxuXG4vL1xuLy8g4pSA4pSA4pSAIEdFVCBTVFJFQU1TIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuLy9cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3RyZWFtcygpIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBjYWxsID0ge307XG4gICAgICAgIGNhbGwuYWN0aW9uID0gJ0dldCBsaXN0IG9mIHN0cmVhbXMnO1xuICAgICAgICBjYWxsLnJlcXVlc3QgPSBxcnNTcnYgKyAnL3Fycy9zdHJlYW0vZnVsbCc7XG4gICAgICAgIGNhbGwucmVzcG9uc2UgPSBIVFRQLmdldChjYWxsLnJlcXVlc3QsIHtcbiAgICAgICAgICAgIHBhcmFtczogeyB4cmZrZXk6IHNlbnNlQ29uZmlnLnhyZmtleSB9LFxuICAgICAgICAgICAgbnBtUmVxdWVzdE9wdGlvbnM6IGNvbmZpZ0NlcnRpY2F0ZXMsXG4gICAgICAgICAgICBkYXRhOiB7fVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gUkVTVF9Mb2coY2FsbCk7ICAgICAgICBcbiAgICAgICAgcmV0dXJuIGNhbGwucmVzcG9uc2UuZGF0YTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdnZXRTdHJlYW1zIGZhaWxlZCcsIGVyci5tZXNzYWdlKTtcbiAgICB9XG59O1xuXG4vL1xuLy8g4pSA4pSA4pSAIENSRUFURSBTVFJFQU0g4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4vL1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdHJlYW0obmFtZSwgZ2VuZXJhdGlvblVzZXJJZCkge1xuICAgIGNvbnNvbGUubG9nKCdRUlMgRnVuY3Rpb25zIFN0cmVhbSwgY3JlYXRlIHRoZSBzdHJlYW0gd2l0aCBuYW1lJywgbmFtZSk7XG5cblxuICAgIHRyeSB7XG4gICAgICAgIGNoZWNrKG5hbWUsIFN0cmluZyk7XG4gICAgICAgIHZhciByZXNwb25zZSA9IHFycy5wb3N0KCcvcXJzL3N0cmVhbScsIG51bGwsIHsgbmFtZTogbmFtZSB9KTtcblxuICAgICAgICAvLyBNZXRlb3IuY2FsbCgndXBkYXRlTG9jYWxTZW5zZUNvcHknKTtcbiAgICAgICAgLy9sb2dnaW5nXG4gICAgICAgIGNvbnN0IGNhbGwgPSB7XG4gICAgICAgICAgICBhY3Rpb246ICdDcmVhdGUgc3RyZWFtJyxcbiAgICAgICAgICAgIHVybDogZ2l0SHViTGlua3MuY3JlYXRlU3RyZWFtLFxuICAgICAgICAgICAgcmVxdWVzdDogXCJIVFRQLnBvc3QocWxpa1NlcnZlciArICcvcXJzL3N0cmVhbScsIHsgaGVhZGVyczogXCIgKyBKU09OLnN0cmluZ2lmeShhdXRoSGVhZGVycykgKyBcIiwgcGFyYW1zOiB7ICd4cmZrZXknOiBcIiArIHNlbnNlQ29uZmlnLnhyZmtleSArIFwifSwgZGF0YTogeyBuYW1lOiBcIiArIG5hbWUgKyBcIn19KSAtLT4gVVNFIE9GIEhFQURFUiBBVVRIIE9OTFkgRk9SIERFTU8vUkVWRVJTRSBQUk9YWSBQVVJQT1NFU1wiLFxuICAgICAgICAgICAgcmVzcG9uc2U6IHJlc3BvbnNlXG4gICAgICAgIH07XG5cbiAgICAgICAgUkVTVF9Mb2coY2FsbCwgZ2VuZXJhdGlvblVzZXJJZCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdDcmVhdGUgc3RyZWFtIGNhbGwucmVzcG9uc2U7JywgY2FsbC5yZXNwb25zZSlcbiAgICAgICAgcmV0dXJuIGNhbGwucmVzcG9uc2U7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignQ3JlYXRlIHN0cmVhbSBmYWlsZWQgJywgZXJyLm1lc3NhZ2UpO1xuICAgIH1cbn07XG5cblxuTWV0ZW9yLm1ldGhvZHMoe1xuICAgIGRlbGV0ZVN0cmVhbShndWlkKSB7XG4gICAgICAgIGNoZWNrKGd1aWQsIFN0cmluZyk7XG4gICAgICAgIC8vbG9nZ2luZyBvbmx5XG4gICAgICAgIGNvbnN0IGNhbGwgPSB7fTtcbiAgICAgICAgY2FsbC5hY3Rpb24gPSAnRGVsZXRlIHN0cmVhbSc7XG4gICAgICAgIGNhbGwucmVxdWVzdCA9ICdEZWxldGUgc3RyZWFtOiAnICsgZ3VpZDtcbiAgICAgICAgUkVTVF9Mb2coY2FsbCk7XG5cbiAgICAgICAgY29uc3QgaWQgPSBkZWxldGVTdHJlYW0oZ3VpZCwgTWV0ZW9yLnVzZXJJZCgpKTtcbiAgICAgICAgTWV0ZW9yLmNhbGwoJ3VwZGF0ZUxvY2FsU2Vuc2VDb3B5Jyk7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9LFxuICAgIGNyZWF0ZVN0cmVhbShuYW1lKSB7XG4gICAgICAgIGNvbnN0IHN0cmVhbUlkID0gY3JlYXRlU3RyZWFtKG5hbWUpO1xuICAgICAgICBNZXRlb3IuY2FsbCgndXBkYXRlTG9jYWxTZW5zZUNvcHknKTtcblxuICAgICAgICAvL3N0b3JlIGluIHRoZSBkYXRhYmFzZSB0aGF0IHRoZSB1c2VyIGdlbmVyYXRlZCBzb21ldGhpbmcsIHNvIHdlIGNhbiBsYXRlciBvbiByZW1vdmUgaXQuXG4gICAgICAgIEdlbmVyYXRlZFJlc291cmNlcy5pbnNlcnQoe1xuICAgICAgICAgICAgJ2dlbmVyYXRpb25Vc2VySWQnOiBNZXRlb3IudXNlcklkKCksXG4gICAgICAgICAgICAnY3VzdG9tZXInOiBudWxsLFxuICAgICAgICAgICAgJ3N0cmVhbUlkJzogc3RyZWFtSWQuZGF0YS5pZCxcbiAgICAgICAgICAgICdhcHBJZCc6IG51bGxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzdHJlYW1JZDtcbiAgICB9LFxuICAgIGdldFN0cmVhbXMoKSB7XG4gICAgICAgIHJldHVybiBnZXRTdHJlYW1zKCk7XG4gICAgfVxufSk7IiwiaW1wb3J0IHtcbiAgICBNZXRlb3Jcbn0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG4vLyBpbXBvcnQgeyBBUElMb2dzIH0gZnJvbSAnL2ltcG9ydHMvYXBpL0FQSUxvZ3MnO1xudmFyIGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKTtcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5cbmltcG9ydCB7XG4gICAgcXJzLFxuICAgIHZhbGlkYXRlSlNPTlxufSBmcm9tICcvaW1wb3J0cy9hcGkvY29uZmlnLmpzJztcbmltcG9ydCAqIGFzIFFTTGljIGZyb20gJy9pbXBvcnRzL2FwaS9zZXJ2ZXIvUVJTRnVuY3Rpb25zTGljZW5zZSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZWN1cml0eVJ1bGVzKG5hbWUpIHtcbiAgICByZXR1cm4gUVNMaWMuZ2V0U3lzdGVtUnVsZXMobmFtZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkaXNhYmxlRGVmYXVsdFNlY3VyaXR5UnVsZXMoKSB7XG4gICAgY29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xuICAgIGNvbnNvbGUubG9nKCdkaXNhYmxlIERlZmF1bHQgU2VjdXJpdHlSdWxlcycpXG4gICAgY29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xuXG4gICAgZm9yIChsZXQgcnVsZU5hbWUgb2YgTWV0ZW9yLnNldHRpbmdzLnNlY3VyaXR5LnJ1bGVzVG9EaXNhYmxlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGcm9tIE1ldGVvci5zZXR0aW5ncy5zZWN1cml0eS5ydWxlc1RvRGlzYWJsZSwgRGlzYWJsZSBzZWN1cml0eSBydWxlOiAnLCBydWxlTmFtZSlcblxuICAgICAgICB2YXIgcnVsZURlZmluaXRpb24gPSBRU0xpYy5nZXRTeXN0ZW1SdWxlcyhydWxlTmFtZSlbMF07XG4gICAgICAgIGlmIChydWxlRGVmaW5pdGlvbikge1xuICAgICAgICAgICAgcnVsZURlZmluaXRpb24uZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gcXJzLnB1dCgnL3Fycy9TeXN0ZW1SdWxlLycgKyBydWxlRGVmaW5pdGlvbi5pZCwgbnVsbCwgcnVsZURlZmluaXRpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdUaGUgc3lzdGVtIHJ1bGUgZG9lcyBub3QgZXhpc3QgaW4gU2Vuc2U6ICcgKyBydWxlTmFtZSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlU2VjdXJpdHlSdWxlcygpIHtcbiAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJyk7XG4gICAgY29uc29sZS5sb2coJ2NyZWF0ZSBzZWN1cml0eSBydWxlcyBpbiBRbGlrIFNlbnNlIGJhc2VkIG9uIGltcG9ydCBmaWxlJyk7XG4gICAgY29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xuXG4gICAgdmFyIGZpbGUgPSBwYXRoLmpvaW4oTWV0ZW9yLnNldHRpbmdzLmJyb2tlci5hdXRvbWF0aW9uQmFzZUZvbGRlciwgJ3NlY3VyaXR5cnVsZXMnLCAnaW1wb3J0JywgJ3NlY3VyaXR5UnVsZVNldHRpbmdzLmpzb24nKTtcblxuICAgIC8vIFJFQUQgVEhFIEZJTEUgXG4gICAgdmFyIHNlY3VyaXR5UnVsZXMgPSBhd2FpdCBmcy5yZWFkSnNvbihmaWxlKTtcbiAgICB0cnkge1xuICAgICAgICB2YWxpZGF0ZUpTT04oc2VjdXJpdHlSdWxlcylcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW50IHJlYWQgdGhlIHNlY3VyaXR5IHJ1bGUgZGVmaW5pdGlvbnMgZmlsZTogJyArIGZpbGUpO1xuICAgIH1cblxuICAgIHNlY3VyaXR5UnVsZXMuZm9yRWFjaChmdW5jdGlvbihydWxlKSB7XG4gICAgICAgIC8vY2hlY2sgaWYgdGhlIHJ1bGUgYWxyZWFkeSBleGlzdHMgaW4gU2Vuc2VcbiAgICAgICAgaWYgKCFRU0xpYy5nZXRTeXN0ZW1SdWxlcyhydWxlLm5hbWUpLmxlbmd0aCkge1xuICAgICAgICAgICAgLy9pZiBub3QgZXhpc3QsIGNyZWF0ZSBpdFxuICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gcXJzLnBvc3QoJy9xcnMvU3lzdGVtUnVsZScsIG51bGwsIHJ1bGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1NlY3VyaXR5IHJ1bGUgXCInICsgcnVsZS5uYW1lICsgJ1wiIGFscmVhZHkgZXhpc3RlZCcpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHN0cmluZ1RvSlNPTihteVN0cmluZykge1xuICAgIHZhciBteUpTT05TdHJpbmcgPSBKU09OLnN0cmluZ2lmeShteVN0cmluZyk7XG4gICAgdmFyIG15RXNjYXBlZEpTT05TdHJpbmcgPSBteUpTT05TdHJpbmcucmVwbGFjZSgvXFxcXG4vZywgXCJcXFxcblwiKVxuICAgICAgICAucmVwbGFjZSgvXFxcXCcvZywgXCJcXFxcJ1wiKVxuICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcXFxcXCInKVxuICAgICAgICAucmVwbGFjZSgvXFxcXCYvZywgXCJcXFxcJlwiKVxuICAgICAgICAucmVwbGFjZSgvXFxcXHIvZywgXCJcXFxcclwiKVxuICAgICAgICAucmVwbGFjZSgvXFxcXHQvZywgXCJcXFxcdFwiKVxuICAgICAgICAucmVwbGFjZSgvXFxcXGIvZywgXCJcXFxcYlwiKVxuICAgICAgICAucmVwbGFjZSgvXFxcXGYvZywgXCJcXFxcZlwiKTtcblxuICAgIGNvbnNvbGUubG9nKCdteUVzY2FwZWRKU09OU3RyaW5nJywgbXlFc2NhcGVkSlNPTlN0cmluZylcbn0iLCJpbXBvcnQgeyBNb25nbyB9IGZyb20gJ21ldGVvci9tb25nbyc7XG5cbmV4cG9ydCBjb25zdCBBUElMb2dzID0gbmV3IE1vbmdvLkNvbGxlY3Rpb24oJ2FwaUxvZ3MnKTtcblxuZXhwb3J0IGZ1bmN0aW9uIFJFU1RfTG9nKGNhbGwsIHVzZXJJZCA9ICdOb3QgZGVmaW5lZCcpIHtcbiAgICBjYWxsLmNyZWF0ZURhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIGNhbGwuZ2VuZXJhdGlvblVzZXJJZCA9IHVzZXJJZDtcbiAgICBBUElMb2dzLmluc2VydChjYWxsKTtcbn0iLCJpbXBvcnQgeyBNb25nbyB9IGZyb20gJ21ldGVvci9tb25nbyc7XG5cbmV4cG9ydCBjb25zdCBBcHBzID0gbmV3IE1vbmdvLkNvbGxlY3Rpb24oJ2FwcHMnKTtcbmV4cG9ydCBjb25zdCBUZW1wbGF0ZUFwcHMgPSBuZXcgTW9uZ28uQ29sbGVjdGlvbigndGVtcGxhdGVBcHBzJyk7XG5leHBvcnQgY29uc3QgR2VuZXJhdGVkUmVzb3VyY2VzID0gbmV3IE1vbmdvLkNvbGxlY3Rpb24oJ2dlbmVyYXRlZFJlc291cmNlcycpO1xuXG4iLCJpbXBvcnQge1xuICAgIE1vbmdvXG59IGZyb20gJ21ldGVvci9tb25nbyc7XG5pbXBvcnQge1xuICAgIFJhbmRvbVxufSBmcm9tICdtZXRlb3IvcmFuZG9tJztcbmltcG9ydCBfIGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcbmNvbnN0IF9RSVhTY2hlbWEgPSByZXF1aXJlKCdlbmlnbWEuanMvc2NoZW1hcy8zLjIuanNvbicpO1xuXG4vL1RoaXMgaXMgdGhlIGNvbmZpZyB0aGF0IHdlIG5lZWQgdG8gbWFrZSBhdmFpbGFibGUgb24gdGhlIGNsaWVudCAodGhlIHdlYnBhZ2UpXG5pZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gICAgdmFyIF9zZW5zZUNvbmZpZyA9IHtcbiAgICAgICAgXCJob3N0XCI6IE1ldGVvci5zZXR0aW5ncy5wdWJsaWMucWxpa1NlbnNlSG9zdCxcbiAgICAgICAgXCJwb3J0XCI6IE1ldGVvci5zZXR0aW5ncy5wdWJsaWMucWxpa1NlbnNlUG9ydCxcbiAgICAgICAgXCJ1c2VTU0xcIjogTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy51c2VTU0wsXG4gICAgICAgIFwidmlydHVhbFByb3h5Q2xpZW50VXNhZ2VcIjogTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy52aXJ0dWFsUHJveHlDbGllbnRVc2FnZSxcbiAgICAgICAgXCJ2aXJ0dWFsUHJveHlTbGlkZUdlbmVyYXRvclwiOiBNZXRlb3Iuc2V0dGluZ3MucHVibGljLnNsaWRlR2VuZXJhdG9yLnZpcnR1YWxQcm94eSxcbiAgICAgICAgXCJ3ZWJJbnRlZ3JhdGlvbkRlbW9Qb3J0XCI6IE1ldGVvci5zZXR0aW5ncy5wdWJsaWMud2ViSW50ZWdyYXRpb25EZW1vUG9ydCxcbiAgICAgICAgXCJRSVhTY2hlbWFcIjogX1FJWFNjaGVtYSxcbiAgICAgICAgLy9zc2JpIGFuZCBzbGlkZSBnZW5lcmF0b3IgYXBwIGlkIGFyZSBzZXQgYXV0b21hdGljYWxseSBvbiBtYWluLmpzIChjbGllbnQgc2lkZSwgdmlhIGEgY2FsbCB0byB0aGUgc2VydmVyKVxuICAgICAgICAvLyBjb25maWcuU1NCSUFwcElkID0gXG4gICAgICAgIC8vIGNvbmZpZy5zbGlkZUdlbmVyYXRvckFwcElkID0gXG4gICAgfTtcbn1cblxuXG4vL1NFUlZFUiBTSURFXG5pZiAoTWV0ZW9yLmlzU2VydmVyKSB7XG4gICAgcHJvY2Vzcy5lbnZbJ05PREVfVExTX1JFSkVDVF9VTkFVVEhPUklaRUQnXSA9ICcwJztcbiAgICBpbXBvcnQgc3NsUm9vdENhcyBmcm9tICdzc2wtcm9vdC1jYXMnO1xuICAgIHNzbFJvb3RDYXMuaW5qZWN0KCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ1RoaXMgdG9vbCB1c2VzIHRoaXMgY29uZmlnIGFzIGRlZmluZWQgaW4gdGhlIHNldHRpbmdzLVhZWi5qc29uIGZpbGUgaW4gdGhlIHJvb3QgZm9sZGVyOiAnLCBNZXRlb3Iuc2V0dGluZ3MpO1xuICAgIGltcG9ydCBjcnlwdG8gZnJvbSAnY3J5cHRvJztcbiAgICB2YXIgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG4gICAgdmFyIG9zID0gcmVxdWlyZSgnb3MnKTtcbiAgICAvLyBpbXBvcnQgZnMgZnJvbSAnZnMnO1xuICAgIGltcG9ydCB7XG4gICAgICAgIG15UVJTXG4gICAgfSBmcm9tICcvaW1wb3J0cy9hcGkvc2VydmVyL1FSU0FQSSc7XG4gICAgY29uc3QgYmx1ZWJpcmQgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuICAgIGNvbnN0IFdlYlNvY2tldCA9IHJlcXVpcmUoJ3dzJyk7XG5cbiAgICBpZiAoIU1ldGVvci5zZXR0aW5ncy5wdWJsaWMucWxpa1NlbnNlSG9zdCkge1xuICAgICAgICBNZXRlb3Iuc2V0dGluZ3MucHVibGljLnFsaWtTZW5zZUhvc3QgPSBvcy5ob3N0bmFtZSgpO1xuICAgIH1cbiAgICBpZiAoIU1ldGVvci5zZXR0aW5ncy5wdWJsaWMuU2Vuc2VTZXJ2ZXJJbnRlcm5hbExhbklQKSB7XG4gICAgICAgIE1ldGVvci5zZXR0aW5ncy5wdWJsaWMuU2Vuc2VTZXJ2ZXJJbnRlcm5hbExhbklQID0gb3MuaG9zdG5hbWUoKTtcbiAgICB9XG4gICAgaWYgKCFNZXRlb3Iuc2V0dGluZ3MucHVibGljLndlYkludGVncmF0aW9uSG9zdCkge1xuICAgICAgICBNZXRlb3Iuc2V0dGluZ3MucHVibGljLndlYkludGVncmF0aW9uSG9zdCA9IG9zLmhvc3RuYW1lKCk7XG4gICAgfVxuXG4gICAgdmFyIF9zZW5zZUNvbmZpZyA9IHtcbiAgICAgICAgXCJob3N0XCI6IE1ldGVvci5zZXR0aW5ncy5wdWJsaWMucWxpa1NlbnNlSG9zdCxcbiAgICAgICAgXCJTZW5zZVNlcnZlckludGVybmFsTGFuSVBcIjogTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5TZW5zZVNlcnZlckludGVybmFsTGFuSVAsXG4gICAgICAgIFwicG9ydFwiOiBNZXRlb3Iuc2V0dGluZ3MucHVibGljLnFsaWtTZW5zZVBvcnQsXG4gICAgICAgIFwidXNlU1NMXCI6IE1ldGVvci5zZXR0aW5ncy5wdWJsaWMudXNlU1NMLFxuICAgICAgICBcInhyZmtleVwiOiBnZW5lcmF0ZVhyZmtleSgpLFxuICAgICAgICBcInZpcnR1YWxQcm94eVwiOiBNZXRlb3Iuc2V0dGluZ3MucHJpdmF0ZS52aXJ0dWFsUHJveHksIC8vdXNlZCB0byBjb25uZWN0IHZpYSBSRVNUIHRvIFNlbnNlLCB3ZSBhdXRoZW50aWNhdGUgdmlhIGEgaHR0cCBoZWFkZXIuIG5vdCBmb3IgcHJvZHVjdGlvbiEhIVxuICAgICAgICBcInZpcnR1YWxQcm94eUNsaWVudFVzYWdlXCI6IE1ldGVvci5zZXR0aW5ncy5wdWJsaWMudmlydHVhbFByb3h5Q2xpZW50VXNhZ2UsXG4gICAgICAgIFwiaGVhZGVyS2V5XCI6IE1ldGVvci5zZXR0aW5ncy5wcml2YXRlLmhlYWRlcktleSxcbiAgICAgICAgXCJoZWFkZXJWYWx1ZVwiOiBwcm9jZXNzLmVudi5VU0VSRE9NQUlOICsgJ1xcXFwnICsgcHJvY2Vzcy5lbnYuVVNFUk5BTUUsIC8vXCJRTElLLUFCMFEyVVJONVRcXFxcUWxpa2V4dGVybmFsXCIsXG4gICAgICAgIFwiaXNTZWN1cmVcIjogTWV0ZW9yLnNldHRpbmdzLnByaXZhdGUuaXNTZWN1cmUsXG4gICAgICAgIFwicXJzUG9ydFwiOiBNZXRlb3Iuc2V0dGluZ3MucHJpdmF0ZS5xcnNQb3J0LFxuICAgICAgICBcImVuZ2luZVBvcnRcIjogTWV0ZW9yLnNldHRpbmdzLnByaXZhdGUuZW5naW5lUG9ydFxuICAgIH07XG5cbiAgICBpZiAobWlzc2luZ1BhcmFtZXRlcnMoX3NlbnNlQ29uZmlnKSkge1xuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdNaXNzaW5nIHBhcmFtZXRlcnMgaW4gX3NlbnNlQ29uZmlnLCB5b3UgZGlkIG5vdCBwb3B1bGF0ZSB0aGUgc2V0dGluZ3MuanNvbiBmaWxlIGluIHRoZSBwcm9qZWN0IHJvb3Qgb2YgTWV0ZW9yUVJTLCBvciB3aXRoIGRvY2tlcjogZGlkIHlvdSBtb3VudCB0aGUgdm9sdW1lIHdpdGggdGhlIGNvbmZpZyBpbmNsdWRpbmcgdGhlIHNldHRpbmdzLmpzb24gZmlsZT8gKHdpdGggdGhlIGNvcnJlY3QgbmFtZSknKTtcbiAgICB9XG5cbiAgICBpZiAoIV9zZW5zZUNvbmZpZy5ob3N0KSB7XG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ1lvdSBoYXZlIG5vdCBzdGFydGVkIHRoaXMgbWV0ZW9yIHByb2plY3Qgd2l0aDogbWV0ZW9yIC0tc2V0dGluZ3Mgc2V0dGluZ3MtZGV2ZWxvcG1lbnQuanNvbiA/IFlvdSBtaXNzZWQgdGhlIHJlZmVyZW5jZSB0byB0aGlzIHNldHRpbmdzIGZpbGUsIG9yIGl0IGlzIGVtcHR5PycpO1xuICAgIH1cblxuICAgIC8vQ09ORklHIEZPUiBIVFRQIE1PRFVMRSBXSVRIIEhFQURFUiBBVVRIIChUTyBNQUtFIFJFU1QgQ0FMTFMgVE8gU0VOU0UgVklBIEhUVFAgQ0FMTFMpLlxuICAgIGV4cG9ydCBjb25zdCBhdXRoSGVhZGVycyA9IHtcbiAgICAgICAgICAgICdoZHItdXNyJzogX3NlbnNlQ29uZmlnLmhlYWRlclZhbHVlLFxuICAgICAgICAgICAgJ1gtUWxpay14cmZrZXknOiBfc2Vuc2VDb25maWcueHJma2V5XG4gICAgICAgIH0gLy9cbiAgICBpZiAoIU1ldGVvci5zZXR0aW5ncy5wcml2YXRlLmNlcnRpZmljYXRlc0RpcmVjdG9yeSkge1xuICAgICAgICBNZXRlb3Iuc2V0dGluZ3MucHJpdmF0ZS5jZXJ0aWZpY2F0ZXNEaXJlY3RvcnkgPSAnQzpcXFxcUHJvZ3JhbURhdGFcXFxcUWxpa1xcXFxTZW5zZVxcXFxSZXBvc2l0b3J5XFxcXEV4cG9ydGVkIENlcnRpZmljYXRlc1xcXFwuTG9jYWwgQ2VydGlmaWNhdGVzJztcbiAgICAgICAgY29uc29sZS5sb2coJ01ldGVvci5zZXR0aW5ncy5wcml2YXRlLmNlcnRpZmljYXRlc0RpcmVjdG9yeSB3YXMgZW1wdHksIHNldHRpbmcgaXQgdG8gZGVmYXVsdDogJywgTWV0ZW9yLnNldHRpbmdzLnByaXZhdGUuY2VydGlmaWNhdGVzRGlyZWN0b3J5KVxuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIGV4cG9ydCBjb25zdCBfY2VydHMgPSB7XG4gICAgICAgICAgICBjYTogZnMucmVhZEZpbGVTeW5jKE1ldGVvci5zZXR0aW5ncy5wcml2YXRlLmNlcnRpZmljYXRlc0RpcmVjdG9yeSArICcvcm9vdC5wZW0nKSxcbiAgICAgICAgICAgIGtleTogZnMucmVhZEZpbGVTeW5jKE1ldGVvci5zZXR0aW5ncy5wcml2YXRlLmNlcnRpZmljYXRlc0RpcmVjdG9yeSArICcvY2xpZW50X2tleS5wZW0nKSxcbiAgICAgICAgICAgIGNlcnQ6IGZzLnJlYWRGaWxlU3luYyhNZXRlb3Iuc2V0dGluZ3MucHJpdmF0ZS5jZXJ0aWZpY2F0ZXNEaXJlY3RvcnkgKyAnL2NsaWVudC5wZW0nKSxcbiAgICAgICAgfVxuXG4gICAgICAgIC8vaWYgeW91IHVzZSB3aW5kb3dzIGFuZCB0aGlzIHRvb2wgcnVucyBvbiB0aGUgc2FtZSBtYWNoaW5lLCB5b3UgY2FuIGtlZXAgdGhlIHBhcmFtZXRlcnMgZW1wdHlcbiAgICAgICAgLy8gYW5kIHdlIHVzZSB0aGUgdXNlciB0aGUgbm9kZSBzZXJ2aWNlIHJ1bnMgdW5kZXIuLi4gLlxuICAgICAgICB2YXIgcWxpa1VzZXJEb21haW4gPSAnJztcbiAgICAgICAgdmFyIHFsaWtVc2VyID0gJyc7XG5cbiAgICAgICAgaWYgKCFNZXRlb3Iuc2V0dGluZ3MuYnJva2VyLnFsaWtTZW5zZS5jb25uZWN0VG9TZW5zZUFzVXNlckRpcmVjdG9yeSkge1xuICAgICAgICAgICAgcWxpa1VzZXJEb21haW4gPSBwcm9jZXNzLmVudi5VU0VSRE9NQUlOO1xuICAgICAgICAgICAgcWxpa1VzZXIgPSBwcm9jZXNzLmVudi5VU0VSTkFNRTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHFsaWtVc2VyRG9tYWluID0gTWV0ZW9yLnNldHRpbmdzLmJyb2tlci5xbGlrU2Vuc2UuY29ubmVjdFRvU2Vuc2VBc1VzZXJEaXJlY3Rvcnk7XG4gICAgICAgICAgICBxbGlrVXNlciA9IE1ldGVvci5zZXR0aW5ncy5icm9rZXIucWxpa1NlbnNlLmNvbm5lY3RUb1NlbnNlQXNVc2VyXG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgdmFyIGNvbmZpZ0NlcnRpY2F0ZXMgPSB7XG4gICAgICAgICAgICByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgaG9zdG5hbWU6IF9zZW5zZUNvbmZpZy5TZW5zZVNlcnZlckludGVybmFsTGFuSVAsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgJ3gtcWxpay14cmZrZXknOiBfc2Vuc2VDb25maWcueHJma2V5LFxuICAgICAgICAgICAgICAgICdYLVFsaWstVXNlcic6IGBVc2VyRGlyZWN0b3J5PSR7cWxpa1VzZXJEb21haW59O1VzZXJJZD0ke3FsaWtVc2VyfWAsIC8vYFVzZXJEaXJlY3Rvcnk9SU5URVJOQUw7VXNlcklkPXNhX3JlcG9zaXRvcnlgIHlvdSBuZWVkIHRvIGdpdmUgdGhpcyB1c2VyIGV4dHJhIHJvbGVzIGJlZm9yZSB0aGlzIHdvcmtzXG4gICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGtleTogX2NlcnRzLmtleSxcbiAgICAgICAgICAgIGNlcnQ6IF9jZXJ0cy5jZXJ0LFxuICAgICAgICAgICAgY2E6IF9jZXJ0cy5jYVxuICAgICAgICB9O1xuICAgICAgICBjb25zb2xlLmxvZygnY29uZmlnQ2VydGljYXRlczogd2UgY29ubmVjdCB0byBRbGlrIFNlbnNlIHZpYSBjZXJ0aWZpY2F0ZXMgdXNpbmcgdGhlc2UgY3JlZGVudGlhbHM6ICcsIGNvbmZpZ0NlcnRpY2F0ZXMpO1xuXG4gICAgICAgIC8vdXNlZCBmb3IgZW5naW1hSlMsIHRoZSBlbmdpbmUgQVBJIGphdmFzY3JpcHQgd3JhcHBlclxuICAgICAgICB2YXIgX2VuZ2luZUNvbmZpZyA9IHtcbiAgICAgICAgICAgIGhvc3Q6IF9zZW5zZUNvbmZpZy5TZW5zZVNlcnZlckludGVybmFsTGFuSVAsXG4gICAgICAgICAgICBpc1NlY3VyZTogX3NlbnNlQ29uZmlnLmlzU2VjdXJlLFxuICAgICAgICAgICAgcG9ydDogTWV0ZW9yLnNldHRpbmdzLnByaXZhdGUuZW5naW5lUG9ydCxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAnWC1RbGlrLVVzZXInOiBgVXNlckRpcmVjdG9yeT0ke3FsaWtVc2VyRG9tYWlufTtVc2VySWQ9JHtxbGlrVXNlcn1gLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNhOiBfY2VydHMuY2EsXG4gICAgICAgICAgICBrZXk6IF9jZXJ0cy5rZXksXG4gICAgICAgICAgICBjZXJ0OiBfY2VydHMuY2VydCxcbiAgICAgICAgICAgIHBhc3NwaHJhc2U6IE1ldGVvci5zZXR0aW5ncy5wcml2YXRlLnBhc3NwaHJhc2UsXG4gICAgICAgICAgICByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlLCAvLyBEb24ndCByZWplY3Qgc2VsZi1zaWduZWQgY2VydHNcbiAgICAgICAgICAgIGFwcG5hbWU6IG51bGwsXG4gICAgICAgICAgICBRSVhTY2hlbWE6IF9RSVhTY2hlbWFcbiAgICAgICAgfTtcblxuICAgICAgICBleHBvcnQgY29uc3QgZW5pZ21hU2VydmVyQ29uZmlnID0ge1xuICAgICAgICAgICAgc2NoZW1hOiBfZW5naW5lQ29uZmlnLlFJWFNjaGVtYSxcbiAgICAgICAgICAgIC8vIGFwcElkOiBhcHBJZCxcbiAgICAgICAgICAgIHNlc3Npb246IHtcbiAgICAgICAgICAgICAgICBob3N0OiBfZW5naW5lQ29uZmlnLmhvc3QsXG4gICAgICAgICAgICAgICAgcG9ydDogX2VuZ2luZUNvbmZpZy5wb3J0LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFByb21pc2U6IGJsdWViaXJkLFxuICAgICAgICAgICAgY3JlYXRlU29ja2V0KHVybCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgV2ViU29ja2V0KHVybCwge1xuICAgICAgICAgICAgICAgICAgICBjYTogX2NlcnRzLmNhLFxuICAgICAgICAgICAgICAgICAgICBrZXk6IF9jZXJ0cy5rZXksXG4gICAgICAgICAgICAgICAgICAgIGNlcnQ6IF9jZXJ0cy5jZXJ0LFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnWC1RbGlrLVVzZXInOiBgVXNlckRpcmVjdG9yeT0ke3FsaWtVc2VyRG9tYWlufTtVc2VySWQ9JHtxbGlrVXNlcn1gLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIGhhbmRsZUxvZzogbG9nUm93ID0+IGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KGxvZ1JvdykpLFxuICAgICAgICB9XG5cbiAgICAgICAgLy9mb3IgZW5pZ21hLmpzXG4gICAgICAgIGV4cG9ydCBjb25zdCBlbmdpbmVDb25maWcgPSBfZW5naW5lQ29uZmlnO1xuICAgICAgICAvL2ZvciBnZW5lcmFsIChtb3N0bHkgY2xpZW50IHNpZGUpIHN0dWZmXG5cbiAgICAgICAgLy8gUWxpayBzZW5zZSBRUlMgZW5kcG9pbnQgdmlhIGhlYWRlciBhdXRoZW50aWNhdGlvblxuICAgICAgICBleHBvcnQgY29uc3QgcWxpa0hEUlNlcnZlciA9ICdodHRwOi8vJyArIF9zZW5zZUNvbmZpZy5TZW5zZVNlcnZlckludGVybmFsTGFuSVAgKyAnOicgKyBfc2Vuc2VDb25maWcucG9ydCArICcvJyArIF9zZW5zZUNvbmZpZy52aXJ0dWFsUHJveHk7XG4gICAgICAgIGV4cG9ydCBjb25zdCBxcnNTcnYgPSAnaHR0cHM6Ly8nICsgX3NlbnNlQ29uZmlnLlNlbnNlU2VydmVySW50ZXJuYWxMYW5JUCArICc6JyArIF9zZW5zZUNvbmZpZy5xcnNQb3J0O1xuXG4gICAgICAgIGV4cG9ydCBjb25zdCBxcnMgPSBuZXcgbXlRUlMoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLndhcm4oJ01ha2Ugc3VyZSB5b3UgcnVuIHRoZSBcIlFSUyBTVEFSVC5CQVRcIiBhcyBhZG1pbmlzdHJhdG9yPyBQbGVhc2Ugbm90ZSB0aGF0IFFsaWsgU2Vuc2UgaXMgbm90IGluc3RhbGxlZCwgb3IgY2VydGlmaWNhdGUgZGlyZWN0b3J5IHdyb25nIGluIHRoZSBzZXR0aW5ncy5qc29uIGZpbGUuJyk7XG4gICAgICAgIC8vIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCAnV2UgY2FuIG5vdCBjb25uZWN0IHRvIFNlbnNlIHlldDogQmVjYXVzZSB3ZSBjYW4gbm90IGZpbmQgdGhlIFNlbnNlIGNlcnRpZmljYXRlcyB5ZXQgaW4gdGhlICcgKyBNZXRlb3Iuc2V0dGluZ3MucHJpdmF0ZS5jZXJ0aWZpY2F0ZXNEaXJlY3RvcnkgKyAnLiBUaGlzIGNhbiBoYXBwZW4gaWYgU2Vuc2UgaGFzIG5vdCB5ZXQgYmVlbiBpbnN0YWxsZWQuLi4uJyk7XG5cbiAgICB9IC8vRU5EIENPREUgVEhBVCBORUVEUyBDRVJUSUZJQ0FURVNcblxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlWHJma2V5KCkge1xuICAgICAgICByZXR1cm4gUmFuZG9tLmhleFN0cmluZygxNik7XG4gICAgfVxuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlSlNPTihib2R5KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IEpTT04ucGFyc2UoYm9keSk7XG4gICAgICAgICAgICAvLyBpZiBjYW1lIHRvIGhlcmUsIHRoZW4gdmFsaWRcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBmYWlsZWQgdG8gcGFyc2VcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gLy9odHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9xcnNcbiAgICAvL0hFQURFUiBBVVRIRU5USUNBVElPTlxuICAgIGV4cG9ydCBjb25zdCBRUlNjb25maWcgPSB7XG4gICAgICAgIGF1dGhlbnRpY2F0aW9uOiAnaGVhZGVyJyxcbiAgICAgICAgaG9zdDogX3NlbnNlQ29uZmlnLmhvc3QsXG4gICAgICAgIHBvcnQ6IF9zZW5zZUNvbmZpZy5wb3J0LFxuICAgICAgICB1c2VTU0w6IGZhbHNlLFxuICAgICAgICB2aXJ0dWFsUHJveHk6IF9zZW5zZUNvbmZpZy52aXJ0dWFsUHJveHksIC8vaGVhZGVyIHByb3h5XG4gICAgICAgIGhlYWRlcktleTogX3NlbnNlQ29uZmlnLmhlYWRlcktleSxcbiAgICAgICAgaGVhZGVyVmFsdWU6IF9zZW5zZUNvbmZpZy5oZWFkZXJWYWx1ZSwgLy8nbXlkb21haW5cXFxcanVzdG1lJ1xuICAgIH07XG5cbiAgICB0cnkge1xuICAgICAgICBNZXRlb3Iuc3RhcnR1cChhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdWYWxpZGF0ZSBzZXR0aW5ncy5qc29uIHBhcmFtZXRlcnMnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgICAgICAgICAgIE1ldGVvci5hYnNvbHV0ZVBhdGggPSBwYXRoLnJlc29sdmUoJy4nKS5zcGxpdChwYXRoLnNlcCArICcubWV0ZW9yJylbMF07XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnTWV0ZW9yIHRyaWVzIHRvIGZpbmQgdGhlIHNldHRpbmdzLWRldmVsb3BtZW50LWV4YW1wbGUuanNvbiBmaWxlIGluIE1ldGVvci5hYnNvbHV0ZVBhdGg6JywgTWV0ZW9yLmFic29sdXRlUGF0aClcbiAgICAgICAgICAgIHZhciBmaWxlID0gcGF0aC5qb2luKE1ldGVvci5hYnNvbHV0ZVBhdGgsICdzZXR0aW5ncy1kZXZlbG9wbWVudC1leGFtcGxlLmpzb24nKTtcdFx0XHRcblxuICAgICAgICAgICAgLy8gUkVBRCBUSEUgRklMRSBcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdmFyIGV4YW1wbGVTZXR0aW5nc0ZpbGUgPSBhd2FpdCBmcy5yZWFkSnNvbihmaWxlKTsgICAgICAgICAgICAgICAgXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdUQ0w6IGV4YW1wbGVTZXR0aW5nc0ZpbGUnLCBleGFtcGxlU2V0dGluZ3NGaWxlKVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGVvciBjYW4gbm90IGZpbmQgeW91ciBleGFtcGxlIHNldHRpbmdzIGZpbGU6ICcgKyBmaWxlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVkFMSURBVEUgSlNPTiBPRiBTRVRUSU5HUyBGSUxFIEFHQUlOU1QgRVhBTVBMRSBTRVRUSU5HUyBGSUxFXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhbGlkYXRlSlNPTihleGFtcGxlU2V0dGluZ3NGaWxlKVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGVvciB3YW50cyB0byBjaGVjayB5b3VyIHNldHRpbmdzLmpzb24gd2l0aCB0aGUgcGFyYW1ldGVycyBpbiB0aGUgZXhhbXBsZSBzZXR0aW5ncy5qc29uIGluIHRoZSBwcm9qZWN0IHJvb3QuIEVycm9yOiBDYW50IHJlYWQgdGhlIGV4YW1wbGUgc2V0dGluZ3MgZGVmaW5pdGlvbnMgZmlsZSAobm90IHZhbGlkIEpTT04pOiAnICsgZmlsZSwgZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGtleXNFcXVhbCA9IGNvbXBhcmVLZXlzKE1ldGVvci5zZXR0aW5ncywgZXhhbXBsZVNldHRpbmdzRmlsZSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnU2V0dGluZ3MgZmlsZSBoYXMgYWxsIHRoZSBrZXlzIGFzIHNwZWNpZmllZCBpbiB0aGUgZXhhbXBsZSBqc29uIGZpbGU/Jywga2V5c0VxdWFsKVxuICAgICAgICAgICAgaWYgKCFrZXlzRXF1YWwpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NldHRpbmdzLmpzb24gZmlsZSBkb2VzIG5vdCBoYXZlIGFsbCBrZXlzIGFzIGRlZmluZWQgaW4gdGhlIHNldHRpbmdzLWRldmVsb3BtZW50LWV4YW1wbGUuanNvbiAoaW4geW91ciBwcm9qZWN0IHJvb3QpLCBQbGVhc2UgdmVyaWZ5IGlmIHlvdSBoYXZlIGFsbCB0aGUga2V5cyBhcyBzcGVjaWZpZWQgaW4gdGhlIHNldHRpbmdzLWRldmVsb3BtZW50LWV4YW1wbGUuanNvbiBpbiB0aGUgcHJvamVjdCByb290IGZvbGRlci4gSW4gbXkgZGV2IGVudmlyb25tZW50OiBDOlxcXFxVc2Vyc1xcXFxRbGlrZXh0ZXJuYWxcXFxcRG9jdW1lbnRzXFxcXEdpdEh1YlxcXFxRUlNNZXRlb3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvcik7XG4gICAgfVxufSAvL2V4aXQgc2VydmVyIHNpZGUgY29uZmlnXG5cbmV4cG9ydCBjb25zdCBzZW5zZUNvbmZpZyA9IF9zZW5zZUNvbmZpZztcblxuZXhwb3J0IGZ1bmN0aW9uIG1pc3NpbmdQYXJhbWV0ZXJzKG9iaikge1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgaWYgKG9ialtrZXldICE9PSBudWxsICYmIG9ialtrZXldICE9IFwiXCIpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBoYXNTYW1lUHJvcHMob2JqMSwgb2JqMikge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmoxKS5ldmVyeShmdW5jdGlvbihwcm9wKSB7XG4gICAgICAgIHJldHVybiBvYmoyLmhhc093blByb3BlcnR5KHByb3ApO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBjb21wYXJlS2V5cyguLi5vYmplY3RzKSB7XG4gICAgY29uc3QgYWxsS2V5cyA9IG9iamVjdHMucmVkdWNlKChrZXlzLCBvYmplY3QpID0+IGtleXMuY29uY2F0KE9iamVjdC5rZXlzKG9iamVjdCkpLCBbXSk7XG4gICAgY29uc3QgdW5pb24gPSBuZXcgU2V0KGFsbEtleXMpO1xuICAgIHJldHVybiBvYmplY3RzLmV2ZXJ5KG9iamVjdCA9PiB1bmlvbi5zaXplID09PSBPYmplY3Qua2V5cyhvYmplY3QpLmxlbmd0aCk7XG59IiwiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuZXhwb3J0IGNvbnN0IEN1c3RvbWVycyA9IG5ldyBNb25nby5Db2xsZWN0aW9uKCdjdXN0b21lcnMnKTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuICAgICAgICB1cGRhdGVVc2VyRm9yQ3VzdG9tZXIodXBkYXRlZFVzZXIpIHtcbiAgICAgICAgICAgIHZhciBzZWxlY3Rpb24gPSB7XG4gICAgICAgICAgICAgICAgJ2dlbmVyYXRpb25Vc2VySWQnOiBNZXRlb3IudXNlcklkKCksXG4gICAgICAgICAgICAgICAgJ3VzZXJzLm5hbWUnOiB1cGRhdGVkVXNlci5uYW1lXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgQ3VzdG9tZXJzLnVwZGF0ZShcbiAgICAgICAgICAgICAgICBzZWxlY3Rpb24sIHsgJHNldDogeyAndXNlcnMuJCc6IHVwZGF0ZWRVc2VyIH0gfSk7XG4gICAgICAgIH0sXG4gICAgfSlcblxuQ3VzdG9tZXJzLmF0dGFjaFNjaGVtYShuZXcgU2ltcGxlU2NoZW1hKHtcbiAgICBuYW1lOiB7XG4gICAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgICAgbGFiZWw6IFwiQ3VzdG9tZXIgbmFtZVwiXG4gICAgfSxcbiAgICBjaGVja2VkOiB7XG4gICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgIGxhYmVsOiBcIlNlbGVjdGVkIGZvciB0aGUgZ2VuZXJhdGlvbj9cIixcbiAgICAgICAgb3B0aW9uYWw6IHRydWUsXG4gICAgICAgIGRlZmF1bHRWYWx1ZTogdHJ1ZVxuICAgIH0sXG4gICAgY3JlYXRlZEF0OiB7XG4gICAgICAgIHR5cGU6IERhdGUsXG4gICAgICAgIGxhYmVsOiBcIkRhdGUgY3JlYXRlZFwiLFxuICAgICAgICBvcHRpb25hbDogdHJ1ZVxuICAgIH0sXG4gICAgY3JlYXRlZEJ5OiB7XG4gICAgICAgIHR5cGU6IE9iamVjdCxcbiAgICAgICAgbGFiZWw6IFwiRGF0ZSBjcmVhdGVkXCIsXG4gICAgICAgIG9wdGlvbmFsOiB0cnVlXG4gICAgfSxcbiAgICBnZW5lcmF0aW9uVXNlcklkOiB7XG4gICAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgICAgYXV0b1ZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnVzZXJJZDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgdXNlcnM6IHtcbiAgICAgICAgdHlwZTogW09iamVjdF0sXG4gICAgICAgIG9wdGlvbmFsOiB0cnVlXG4gICAgfSxcbiAgICBcInVzZXJzLiRcIjoge1xuICAgICAgICB0eXBlOiBPYmplY3RcbiAgICB9LFxuICAgIFwidXNlcnMuJC5uYW1lXCI6IHtcbiAgICAgICAgdHlwZTogU3RyaW5nXG4gICAgfSxcbiAgICBcInVzZXJzLiQuZ3JvdXBcIjoge1xuICAgICAgICB0eXBlOiBTdHJpbmcsXG4gICAgICAgIGFsbG93ZWRWYWx1ZXM6IFsnQ29uc3VtZXInLCAnQ29udHJpYnV0b3InLCAnRGV2ZWxvcGVyJywgJ0FkbWluJywgJ0dsb2JhbCBhdWRpdG9yJ11cbiAgICB9LFxuICAgIFwidXNlcnMuJC5jdXJyZW50bHlMb2dnZWRJblwiOiB7XG4gICAgICAgIHR5cGU6IEJvb2xlYW4sXG4gICAgICAgIG9wdGlvbmFsOiB0cnVlXG4gICAgfSxcbiAgICBcInVzZXJzLiQuY291bnRyeVwiOiB7XG4gICAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgICAgYWxsb3dlZFZhbHVlczogWydHZXJtYW55JywgJ1VuaXRlZCBTdGF0ZXMnLCAnSXRhbHknXVxuICAgIH1cbn0pKTtcblxuZXhwb3J0IGNvbnN0IGR1bW15Q3VzdG9tZXIgPSB7XG4gICAgXCJuYW1lXCI6IGZha2VyLmNvbXBhbnkuY29tcGFueU5hbWUoKSxcbiAgICBcImNoZWNrZWRcIjogdHJ1ZSxcbiAgICBcInVzZXJcIjoge1xuICAgICAgICBcIm5hbWVcIjogJ0pvaG4nLFxuICAgICAgICBcImdyb3VwXCI6IFwiQ29uc3VtZXJcIixcbiAgICAgICAgXCJjdXJyZW50bHlMb2dnZWRJblwiOiBmYWxzZSxcbiAgICAgICAgXCJjb3VudHJ5XCI6IFwiR2VybWFueVwiXG4gICAgfVxufTtcblxuZXhwb3J0IGNvbnN0IGR1bW15Q3VzdG9tZXJzID0gW3tcbiAgICAgICAgXCJuYW1lXCI6IGZha2VyLmNvbXBhbnkuY29tcGFueU5hbWUoKSxcbiAgICAgICAgXCJjaGVja2VkXCI6IHRydWUsXG4gICAgICAgIFwidXNlcnNcIjogW3tcbiAgICAgICAgICAgIFwibmFtZVwiOiAnSm9obicsXG4gICAgICAgICAgICBcImdyb3VwXCI6IFwiQ29uc3VtZXJcIixcbiAgICAgICAgICAgIFwiY3VycmVudGx5TG9nZ2VkSW5cIjogZmFsc2UsXG4gICAgICAgICAgICBcImNvdW50cnlcIjogXCJHZXJtYW55XCJcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgXCJuYW1lXCI6ICdMaW5kYScsXG4gICAgICAgICAgICBcImdyb3VwXCI6IFwiQ29udHJpYnV0b3JcIixcbiAgICAgICAgICAgIFwiY3VycmVudGx5TG9nZ2VkSW5cIjogZmFsc2UsXG4gICAgICAgICAgICBcImNvdW50cnlcIjogXCJVbml0ZWQgU3RhdGVzXCJcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgXCJuYW1lXCI6ICdNYXJ0aW4nLFxuICAgICAgICAgICAgXCJncm91cFwiOiBcIkRldmVsb3BlclwiLFxuICAgICAgICAgICAgXCJjdXJyZW50bHlMb2dnZWRJblwiOiBmYWxzZSxcbiAgICAgICAgICAgIFwiY291bnRyeVwiOiBcIkl0YWx5XCJcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgXCJuYW1lXCI6ICdQYXVsJyxcbiAgICAgICAgICAgIFwiZ3JvdXBcIjogXCJBZG1pblwiLFxuICAgICAgICAgICAgXCJjdXJyZW50bHlMb2dnZWRJblwiOiBmYWxzZSxcbiAgICAgICAgICAgIFwiY291bnRyeVwiOiBcIkl0YWx5XCJcbiAgICAgICAgfV1cbiAgICB9LCB7XG4gICAgICAgIFwibmFtZVwiOiBmYWtlci5jb21wYW55LmNvbXBhbnlOYW1lKCksXG4gICAgICAgIFwiY2hlY2tlZFwiOiB0cnVlLFxuICAgICAgICBcInVzZXJzXCI6IFt7XG4gICAgICAgICAgICBcIm5hbWVcIjogZmFrZXIubmFtZS5maW5kTmFtZSgpLFxuICAgICAgICAgICAgXCJncm91cFwiOiBcIkNvbnN1bWVyXCIsXG4gICAgICAgICAgICBcImN1cnJlbnRseUxvZ2dlZEluXCI6IGZhbHNlLFxuICAgICAgICAgICAgXCJjb3VudHJ5XCI6IFwiSXRhbHlcIlxuICAgICAgICB9XVxuICAgIH0sIHtcbiAgICAgICAgXCJuYW1lXCI6IGZha2VyLmNvbXBhbnkuY29tcGFueU5hbWUoKSxcbiAgICAgICAgXCJjaGVja2VkXCI6IHRydWUsXG4gICAgICAgIFwidXNlcnNcIjogW3tcbiAgICAgICAgICAgIFwibmFtZVwiOiBmYWtlci5uYW1lLmZpbmROYW1lKCksXG4gICAgICAgICAgICBcImdyb3VwXCI6IFwiQ29uc3VtZXJcIixcbiAgICAgICAgICAgIFwiY3VycmVudGx5TG9nZ2VkSW5cIjogZmFsc2UsXG4gICAgICAgICAgICBcImNvdW50cnlcIjogXCJJdGFseVwiXG4gICAgICAgIH1dXG4gICAgfVxuICAgIC8vIHtcbiAgICAvLyAgICAgXCJuYW1lXCI6IFwiUVBNRyBBY2NvdW50YW50c1wiLFxuICAgIC8vICAgICBcImNoZWNrZWRcIjogdHJ1ZSxcbiAgICAvLyAgICAgXCJ1c2Vyc1wiOiBbe1xuICAgIC8vICAgICAgICAgXCJuYW1lXCI6IFwiUm9uXCIsXG4gICAgLy8gICAgICAgICBcImdyb3VwXCI6IFwiR2xvYmFsIEF1ZGl0b3JcIixcbiAgICAvLyAgICAgICAgIFwiY3VycmVudGx5TG9nZ2VkSW5cIjogZmFsc2UsXG4gICAgLy8gICAgICAgICBcImNvdW50cnlcIjogXCJJdGFseVwiXG4gICAgLy8gICAgIH1dXG4gICAgLy8gfVxuXG5cblxuXG4gICAgLy8geyBcIm5hbWVcIjogXCJBJlIgUGFydG5lcnNcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyAgICAgeyBcIm5hbWVcIjogXCJBMlogU29sdXRpb25zXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8gICAgIHsgXCJuYW1lXCI6IFwiQWFyb24gRC4gTWV5ZXIgJiBBc3NvY2lhdGVzXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8gICAgIHsgXCJuYW1lXCI6IFwiQWFyb24gUHJvZHVjdHNcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIkFjdGl2ZSBEYXRhXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJCZW4gYW5kIEplcnJ54oCZc1wiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiQmVuZWRpY3RcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIkJpem1hcnRzXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJDICYgQyAgRGVzaWduXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJDICYgSiBFbmdpbmVlcmluZ1wiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiQ0FGIFN5c3RlbWhhdXNcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIkNBTSBHcm91cFwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiQ2FyaWJpYW4gU3BlY2lhbHRpZXNcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIkNpdHkgRnJlc2ggRm9vZHNcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIkNsZWFyb3V0XCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJEYXZpZCBTcGVuY2VyIEx0ZC5cIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIkRheXRvbiBNYWxsZWFibGUgSW5jLlwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiRENQIFJlc2VhcmNoXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJEQ1MgSW50ZXJuYXRpb25hbFwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiRENTIExhYm9yYXRvcnlcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIkRlYWstUGVyZXJhIEdyb3VwLlwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiRWFydGhcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcImVEaXN0cmljdFwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiRURQXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJFdGh5bCBDb3Jwb3JhdGlvblwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiRmVkZXJhbCBGb2N1c1wiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiRmlsbCBJdFwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiRmlsbW90eXBlXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJGaW5zXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJHYXRlXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJHdWxmIGFuZCBXZXN0ZXJuIEluZHVzdHJpZXNcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIkhhcnRlLUhhbmtzIChmb3JtZXJseSBMb2NhdG9yKVwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiSGFydmFyZCBUcnVzdCBDb21wYW55XCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJIQ0hTXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJIZWFsdGhlb25cIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIkhldHJpY2sgU3lzdGVtc1wiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiSG9tZSBUZWFtXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJIb21lYm91bmRcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIklCVkFcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIkljb25cIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIkljb24gU2l0ZSBCdWlsZGVyc1wiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiSWR5bGx3aWxkXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJKLiBTLiBMZWUgQXNzb2NpYXRlc1wiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiSyBJbnRlcm5hdGlvbmFsXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJLLkMuIElydmluZ1wiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiS2FyaSAmIEFzc29jaWF0ZXNcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIkthcnNpbmdcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIkthemluZm9ybWNvbVwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiS2VudElTUFwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiS29vbC1TZWFsXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJMYWtlciBBaXJ3YXlzXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJMaXZlcm1vcmUgIExhYm9yYXRvcmllcyAoTFNMSSlcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIkxpdmVXaXJlIEJCUyBhbmQgICBGYXZvdXJpdGUgTGlua3NcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIk1BVFJJWFwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiTWlsZXMgTGFib3JhdG9yaWVzLCBJbmMuXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJOQUNTQ09SUFwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiT25lc3RhclwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiUGFjZVwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiUGFjaWZpYyBHcm91cFwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiUGFjaWZpYyBNYXRpY3NcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlBhY2lmaWMgU2llcnJhIFJlc2VhcmNoXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJQYWNpZmljIFZvaWNlXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJQYWNpZmljIFdlc3QgRW50ZXJwcmlzZXNcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlBhY2lmaWNTZXJ2XCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJQYW5uZ2VhXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJQQVAgKE1haW50ZW5hbmNlKVwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiUGFyYWNlbFwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiUGF0aWVudFwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiUGlubmFjbGUgTWljcm9cIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlF1YWxTZXJ2ZVwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiUXVhbnR1bSA0WHl0ZSAgQXJjaGl0ZWN0c1wiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiUXdlc3RcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlImUiBHcm91cFwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiUi5KLiBNYXR0ZXIgJiBBc3NvY2lhdGVzXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJSYSBDbyBBbW9cIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlJDXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJSZWFkeS10by1SdW5cIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlJlbWVkeVwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiUmVuZWdhZGUgaW5mbyBDcmV3XCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJSZXV0ZXJzIFVzYWJpbGl0eSBHcm91cFwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiUmV2aWV3Qm9vdGhcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlJGSSBDb3Jwb3JhdGlvblwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiUm9hZCBXYXJyaW9yIEludGVybmF0aW9uYWxcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlJvYnVzdCBDb2RlXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJTYWdlXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJTYWdlbnRcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlNhbGFtYW5kZXIgSnVuY3Rpb25cIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlNhdHJvbml4XCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJTYXR5YW1cIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlNjaWVudGlmaWMgQXRsYW50YVwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiU2NvdEdvbGQgUHJvZHVjdHNcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlNjcmVlbiBTYXZlci5jb21cIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlNpZnRvbiBQcm9wZXJ0aWVzIExpbWl0ZWRcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlNpZ21hXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJTaWduYXR1cmVcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlNpZ25hdHVyZUZhY3RvcnlcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlNvbG9tYW4gQnJvdGhlcnNcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlNvdXRoZXJuIENvbXBhbnlcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlN0b25lIENvbnNvbGlkYXRlZCBDb3Jwb3JhdGlvblwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiVGFsb3VcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlRhbXBlcmVcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlRhbmR5IENvcnBvcmF0aW9uXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJUYW5nZW50XCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJUYW8gR3JvdXBcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlRhcmdldCBNYXJrZXRpbmdcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlRlYW0gQVNBXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJUZWFtIEZpbmFuY2lhbCBNYW5hZ2VtZW50IFN5c3RlbXNcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlRlY2EtUHJpbnRcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlRpbWUgV2FybmVyXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJUb3dtb3RvciBDb3Jwb3JhdGlvblwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiVHJlZGVnYXIgQ29tcGFueVwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiVHJlbmQgTGluZSBDb3Jwb3JhdGlvblwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiVS4gUy4gRXhjaGFuZ2VcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlVuaXNvbiBNYW5hZ2VtZW50IENvbmNlcHRzXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJVbml0ZWQgU3RhdGVzICAoVVNJVClcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlVVbWFpbFwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiVmFsaUNlcnRcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlZhbGxleSAgU29sdXRpb25zXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJWYWxwYXRrZW5cIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlZhbnN0YXJcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlZlbmFibGVcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlZlbnJlZFwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiV2F0Y29tIEludGVybmF0aW9uYWxcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlhlbnRlY1wiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiWGlsaW54XCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG4gICAgLy8geyBcIm5hbWVcIjogXCJYVlRcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlplcm8gQXNzdW1wdGlvbiBSZWNvdmVyeVwiLCBcImNoZWNrZWRcIjogdHJ1ZSB9LFxuICAgIC8vIHsgXCJuYW1lXCI6IFwiWmlsb2dcIiwgXCJjaGVja2VkXCI6IHRydWUgfSxcbiAgICAvLyB7IFwibmFtZVwiOiBcIlppdGVsXCIsIFwiY2hlY2tlZFwiOiB0cnVlIH0sXG5dXG4iLCJpbXBvcnQgeyBNb25nbyB9IGZyb20gJ21ldGVvci9tb25nbyc7XG5cbi8vc3RvcmVzIGFsbCB0aGUgY2xpY2tzIGFuZCBzbGlkZXMgc2hvd25cbmV4cG9ydCBjb25zdCBMb2dnZXIgPSBuZXcgTW9uZ28uQ29sbGVjdGlvbignbG9nZ2VyJyk7XG5leHBvcnQgY29uc3QgU2Vuc2VTZWxlY3Rpb25zID0gbmV3IE1vbmdvLkNvbGxlY3Rpb24oJ3NlbnNlU2VsZWN0aW9ucycpOyIsImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJztcbiBcbmV4cG9ydCBjb25zdCBTdHJlYW1zID0gbmV3IE1vbmdvLkNvbGxlY3Rpb24oJ3N0cmVhbXMnKTtcbiIsIlxuQWNjb3VudHNUZW1wbGF0ZXMuY29uZmlndXJlKHtcbiAgICAvLyBCZWhhdmlvclxuICAgIGNvbmZpcm1QYXNzd29yZDogZmFsc2UsXG4gICAgZW5hYmxlUGFzc3dvcmRDaGFuZ2U6IHRydWUsXG4gICAgZm9yYmlkQ2xpZW50QWNjb3VudENyZWF0aW9uOiBmYWxzZSxcbiAgICBvdmVycmlkZUxvZ2luRXJyb3JzOiB0cnVlLFxuICAgIHNlbmRWZXJpZmljYXRpb25FbWFpbDogZmFsc2UsXG4gICAgbG93ZXJjYXNlVXNlcm5hbWU6IGZhbHNlLFxuICAgIGZvY3VzRmlyc3RJbnB1dDogdHJ1ZSxcblxuICAgIC8vIEFwcGVhcmFuY2VcbiAgICBzaG93QWRkUmVtb3ZlU2VydmljZXM6IGZhbHNlLFxuICAgIHNob3dGb3Jnb3RQYXNzd29yZExpbms6IGZhbHNlLFxuICAgIHNob3dMYWJlbHM6IHRydWUsXG4gICAgc2hvd1BsYWNlaG9sZGVyczogdHJ1ZSxcbiAgICBzaG93UmVzZW5kVmVyaWZpY2F0aW9uRW1haWxMaW5rOiBmYWxzZSxcblxuICAgIC8vIENsaWVudC1zaWRlIFZhbGlkYXRpb25cbiAgICBjb250aW51b3VzVmFsaWRhdGlvbjogZmFsc2UsXG4gICAgbmVnYXRpdmVGZWVkYmFjazogZmFsc2UsXG4gICAgbmVnYXRpdmVWYWxpZGF0aW9uOiB0cnVlLFxuICAgIHBvc2l0aXZlVmFsaWRhdGlvbjogdHJ1ZSxcbiAgICBwb3NpdGl2ZUZlZWRiYWNrOiB0cnVlLFxuICAgIHNob3dWYWxpZGF0aW5nOiB0cnVlLFxuXG4gICAgLy8gLy8gUHJpdmFjeSBQb2xpY3kgYW5kIFRlcm1zIG9mIFVzZVxuICAgIC8vIHByaXZhY3lVcmw6ICdwcml2YWN5JyxcbiAgICAvLyB0ZXJtc1VybDogJ3Rlcm1zLW9mLXVzZScsXG5cbiAgICAvLyBSZWRpcmVjdHNcbiAgICBob21lUm91dGVQYXRoOiAnLycsXG4gICAgcmVkaXJlY3RUaW1lb3V0OiA0MDAwLFxuXG4gICAgLy8gLy8gSG9va3NcbiAgICAvLyBvbkxvZ291dEhvb2s6IG15TG9nb3V0RnVuYyxcbiAgICAvLyBvblN1Ym1pdEhvb2s6IG15U3VibWl0RnVuYyxcbiAgICAvLyBwcmVTaWduVXBIb29rOiBteVByZVN1Ym1pdEZ1bmMsXG4gICAgLy8gcG9zdFNpZ25VcEhvb2s6IG15UG9zdFN1Ym1pdEZ1bmMsXG5cbiAgICAvLyBUZXh0c1xuICAgIHRleHRzOiB7XG4gICAgICBidXR0b246IHtcbiAgICAgICAgICBzaWduVXA6IFwiUmVnaXN0ZXIgbm93IHRvIHN0YXJ0IHVzaW5nIHRoZSBRbGlrIFNlbnNlIFNhYVMgZGVtb1wiXG4gICAgICB9LFxuICAgICAgc29jaWFsU2lnblVwOiBcIlJlZ2lzdGVyXCIsXG4gICAgICBzb2NpYWxJY29uczoge1xuICAgICAgICAgIFwibWV0ZW9yLWRldmVsb3BlclwiOiBcImZhIGZhLXJvY2tldFwiXG4gICAgICB9LFxuICAgICAgdGl0bGU6IHtcbiAgICAgICAgICBmb3Jnb3RQd2Q6IFwiUmVjb3ZlciBZb3VyIFBhc3N3b3JkXCJcbiAgICAgIH0sXG4gICAgfSxcbn0pO1xuXG5BY2NvdW50c1RlbXBsYXRlcy5jb25maWd1cmVSb3V0ZSgnc2lnbkluJyk7XG5BY2NvdW50c1RlbXBsYXRlcy5jb25maWd1cmVSb3V0ZSgnY2hhbmdlUHdkJyk7XG4vLyBBY2NvdW50c1RlbXBsYXRlcy5jb25maWd1cmVSb3V0ZSgnZW5yb2xsQWNjb3VudCcpO1xuLy8gQWNjb3VudHNUZW1wbGF0ZXMuY29uZmlndXJlUm91dGUoJ2ZvcmdvdFB3ZCcpO1xuLy8gQWNjb3VudHNUZW1wbGF0ZXMuY29uZmlndXJlUm91dGUoJ3Jlc2V0UHdkJyk7XG5BY2NvdW50c1RlbXBsYXRlcy5jb25maWd1cmVSb3V0ZSgnc2lnblVwJyk7XG5cbiIsIiAgICAvLyBpbXBvcnQgbWV0ZW9yIGNvbGxlY3Rpb25zXG4gICAgaW1wb3J0IHtcbiAgICAgICAgQXBwcyxcbiAgICAgICAgVGVtcGxhdGVBcHBzXG4gICAgfSBmcm9tICcvaW1wb3J0cy9hcGkvYXBwcyc7XG4gICAgaW1wb3J0IHtcbiAgICAgICAgU3RyZWFtc1xuICAgIH0gZnJvbSAnL2ltcG9ydHMvYXBpL3N0cmVhbXMnO1xuICAgIGltcG9ydCB7XG4gICAgICAgIEN1c3RvbWVyc1xuICAgIH0gZnJvbSAnL2ltcG9ydHMvYXBpL2N1c3RvbWVycyc7XG4gICAgaW1wb3J0IHtcbiAgICAgICAgc2Vuc2VDb25maWdcbiAgICB9IGZyb20gJy9pbXBvcnRzL2FwaS9jb25maWcnO1xuXG5cbiAgICBleHBvcnQgdmFyIGdpdEh1YkxpbmtzID0ge1xuICAgICAgICBjcmVhdGVTdHJlYW06ICdodHRwczovL2dpdGh1Yi5jb20vUUhvc2UvUVJTTWV0ZW9yL2Jsb2IvbWFzdGVyL2ltcG9ydHMvYXBpL3NlcnZlci9RUlNGdW5jdGlvbnNTdHJlYW0uanMjTDExMycsXG4gICAgICAgIGNvcHlBcHA6IFwiaHR0cHM6Ly9naXRodWIuY29tL1FIb3NlL1FSU01ldGVvci9ibG9iL21hc3Rlci9pbXBvcnRzL2FwaS9zZXJ2ZXIvUVJTRnVuY3Rpb25zQXBwLmpzI0w0NzdcIixcbiAgICAgICAgcmVwbGFjZUFuZFJlbG9hZEFwcDogXCJodHRwczovL2dpdGh1Yi5jb20vUUhvc2UvUVJTTWV0ZW9yL2Jsb2IvbWFzdGVyL2ltcG9ydHMvYXBpL3NlcnZlci9RUlNGdW5jdGlvbnNBcHAuanMjTDI3NVwiLFxuICAgICAgICBwdWJsaXNoQXBwOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9RSG9zZS9RUlNNZXRlb3IvYmxvYi9tYXN0ZXIvaW1wb3J0cy9hcGkvc2VydmVyL1FSU0Z1bmN0aW9uc0FwcC5qcyNMNjA0XCIsXG4gICAgICAgIHJlcXVlc3RUaWNrZXQ6IFwiaHR0cHM6Ly9naXRodWIuY29tL1FIb3NlL1FSU01ldGVvci9ibG9iLzUwYmY5MDNkYzY3ZDhkMWIzNzU3YjU3MmU4YjJkZWRiYjYzMjAyZGEvaW1wb3J0cy9hcGkvc2VydmVyL1FQU0Z1bmN0aW9ucy5qcyNMMjA1XCIsXG4gICAgICAgIGNyZWF0ZVBhc3BvcnQ6IFwiaHR0cHM6Ly9naXRodWIuY29tL1FIb3NlL1FSU01ldGVvci9ibG9iLzUwYmY5MDNkYzY3ZDhkMWIzNzU3YjU3MmU4YjJkZWRiYjYzMjAyZGEvaW1wb3J0cy9hcGkvc2VydmVyL1FQU0Z1bmN0aW9ucy5qcyNMNTZcIixcbiAgICAgICAgcmVkaXJlY3RVUkxSZWNlaXZlZDogXCJodHRwczovL2dpdGh1Yi5jb20vUUhvc2UvUVJTTWV0ZW9yL2Jsb2IvbWFzdGVyL2ltcG9ydHMvU1NPL2NsaWVudC9TU08uanMjTDEwMFwiLFxuICAgICAgICBkZWxldGVBcHA6IFwiaHR0cHM6Ly9naXRodWIuY29tL1FIb3NlL1FSU01ldGVvci9ibG9iL21hc3Rlci9pbXBvcnRzL2FwaS9zZXJ2ZXIvUVJTRnVuY3Rpb25zQXBwLmpzI0w1NzBcIixcbiAgICAgICAgbG9nb3V0VXNlcjogXCJodHRwczovL2dpdGh1Yi5jb20vUUhvc2UvUVJTTWV0ZW9yL2Jsb2IvbWFzdGVyL2ltcG9ydHMvYXBpL3NlcnZlci9RUFNGdW5jdGlvbnMuanMjTDQ2MVwiLFxuICAgICAgICBzYXZlQXBwOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9RSG9zZS9RUlNNZXRlb3IvYmxvYi9tYXN0ZXIvaW1wb3J0cy9hcGkvc2VydmVyL1FSU0Z1bmN0aW9uc0FwcC5qcyNMMzAwXCIsXG4gICAgICAgIGdldFNjcmlwdDogXCJodHRwczovL2dpdGh1Yi5jb20vUUhvc2UvUVJTTWV0ZW9yL2Jsb2IvbWFzdGVyL2ltcG9ydHMvYXBpL3NlcnZlci9RUlNGdW5jdGlvbnNBcHAuanMjTDI3NVwiLFxuICAgICAgICBzZXRTY3JpcHQ6IFwiaHR0cHM6Ly9naXRodWIuY29tL1FIb3NlL1FSU01ldGVvci9ibG9iL21hc3Rlci9pbXBvcnRzL2FwaS9zZXJ2ZXIvUVJTRnVuY3Rpb25zQXBwLmpzI0wyODhcIixcbiAgICAgICAgcmVsb2FkQXBwOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9RSG9zZS9RUlNNZXRlb3IvYmxvYi9tYXN0ZXIvaW1wb3J0cy9hcGkvc2VydmVyL1FSU0Z1bmN0aW9uc0FwcC5qcyNMMjkyXCIsXG4gICAgfTtcblxuICAgIGlmIChNZXRlb3IuaXNDbGllbnQpIHtcbiAgICAgICAgdmFyIENvb2tpZXMgPSByZXF1aXJlKCdqcy1jb29raWUnKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZygnU2V0dXAgZ2VuZXJpYyBoZWxwZXIgZnVuY3Rpb25zLCBmb3IgZnVuY3Rpb25zIGV2ZXJ5IHRlbXBsYXRlIG5lZWRzJyk7XG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdmb3JtYXREYXRlJywgZnVuY3Rpb24oZGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIG1vbWVudChkYXRlKVxuICAgICAgICAgICAgICAgIC5mb3JtYXQoJ0RELU1NLVlZWVknKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gLy8gVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ2Zvcm1hdE51bWJlcicsIGZ1bmN0aW9uKG15TnVtYmVyKSB7XG4gICAgICAgIC8vICAgICB2YXIgY29tbWFGb3JtYXQgPSBkMy5mb3JtYXQoXCIsXCIpO1xuICAgICAgICAvLyAgICAgLy8gVGhlIGV4cHJlc3Npb24gLywvZyBpcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0aGF0IG1hdGNoZXMgYWxsIGNvbW1hcy5cbiAgICAgICAgLy8gICAgIHJldHVybiBjb21tYUZvcm1hdChteU51bWJlcilcbiAgICAgICAgLy8gICAgICAgICAucmVwbGFjZSgvLC9nLCBcIi5cIik7XG4gICAgICAgIC8vIH0pO1xuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdVUkxfWW91dHViZV9ob3dUb0RlbW8nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAnaHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQvT3VsUVMtMWZILUE/bGlzdD1QTHFKZnFnUjYyY1ZBWnhTMzRXR25CeWpBU0tyR2YwRnBrJztcbiAgICAgICAgfSk7XG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdVUkxfWW91dHViZV9xdWlja0ludHJvJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdVUkxfWW91dHViZV8xbWZsYXNoeUludHJvJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2h0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkL1czZ0RLZHY2SzhZJztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ1VSTF9Zb3V0dWJlX3BsYXlsaXN0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2h0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3BsYXlsaXN0P2xpc3Q9UExxSmZxZ1I2MmNWQVp4UzM0V0duQnlqQVNLckdmMEZwayc7XG4gICAgICAgIH0pO1xuICAgICAgICBUZW1wbGF0ZS5yZWdpc3RlckhlbHBlcignVVJMX1lvdXR1YmVfaW50ZWdyYXRlZF9mbG93JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC9NNDludjZvbjVFZz9saXN0PVBMcUpmcWdSNjJjVkFaeFMzNFdHbkJ5akFTS3JHZjBGcGtcIjtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ1VSTF9Zb3V0dWJlX2dlbmVyaWNfc2VjdXJpdHlfaW50cm8nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBcImh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkL3NkQ1ZzTXpUZjY0XCI7XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ1VSTF9Zb3V0dWJlX3dlYmludGVncmF0aW9uX2ludHJvZHVjdGlvbicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiaHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQvenVOdlpfVVRtb3c/bGlzdD1QTHFKZnFnUjYyY1ZBWnhTMzRXR25CeWpBU0tyR2YwRnBrXCI7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vUUFQXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdVUkxfWW91dHViZV93ZWJpbnRlZ3JhdGlvbl9leHRlbmRlZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiaHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQveUxUcXpmdERhN3NcIjtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ1VSTF9Zb3V0dWJlX2FyY2hpdGVjdHVyZV9pbnRyb2R1Y3Rpb24nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBcImh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkL3N2NW5LRHZtUlBJP2xpc3Q9UExxSmZxZ1I2MmNWQVp4UzM0V0duQnlqQVNLckdmMEZwa1wiO1xuICAgICAgICB9KTtcblxuICAgICAgICBUZW1wbGF0ZS5yZWdpc3RlckhlbHBlcignVVJMX1lvdXR1YmVfc2VjdXJpdHlfaW50cm9kdWN0aW9uJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC9YSjlkT0hvTWlYRT9saXN0PVBMcUpmcWdSNjJjVkFaeFMzNFdHbkJ5akFTS3JHZjBGcGtcIjtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ1VSTF9Zb3V0dWJlX3NlY3VyaXR5X2RlZXBEaXZlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC9pYW1vNlJMYzVQZ1wiO1xuICAgICAgICB9KTtcblxuICAgICAgICBUZW1wbGF0ZS5yZWdpc3RlckhlbHBlcignVVJMX1lvdXR1YmVfY29uY2VwdF9iZWhpbmQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBcImh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkLzFQamNURm5DNE1vXCI7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdkb2NfZGVtb19tYW51YWwnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAnL2RvY3MvSG93IHRvIGRlbW8gdGhlIFFsaWsgU2Vuc2UgU2FhUyBkZW1vIHBsYXRmb3JtLnBkZic7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdkb2Nfc2VjX2Z1bmN0aW9uX3Rhc2tfbWF0cml4JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gJy9kb2NzL1FsaWtTZW5zZSBBdXRob3JpemF0aW9ucyAtIEZ1bmN0aW9uIGFuZCBUYXNrc19EZW1vLnhsc3gnO1xuICAgICAgICB9KTtcblxuICAgICAgICBUZW1wbGF0ZS5yZWdpc3RlckhlbHBlcignZG9jX3NlY3VydGl0eUludGVncmF0aW9uJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2h0dHBzOi8vY29tbXVuaXR5LnFsaWsuY29tL2RvY3MvRE9DLTE3NTk5JztcbiAgICAgICAgfSk7XG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdkb2NfcHJvY2Vzc0ludGVncmF0aW9uJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2h0dHBzOi8vY29tbXVuaXR5LnFsaWsuY29tL2RvY3MvRE9DLTE3ODMxJztcbiAgICAgICAgfSk7XG5cblxuICAgICAgICBUZW1wbGF0ZS5yZWdpc3RlckhlbHBlcignZG9jX2ludGVncmF0aW9uT3ZlcnZpZXcnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAnaHR0cHM6Ly9jb21tdW5pdHkucWxpay5jb20vZG9jcy9ET0MtOTUzMyc7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdkb2Nfc291cmNlQ29kZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICcvZG9jcy9RbGlrIFNlbnNlIFNhYVMgZGVtbyB0b29sIGRvY3VtZW50YXRpb24gb2Ygc291cmNlIGNvZGUuZG9jeCc7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdkb2NfZGVtb19zZXR1cF9pbnN0cnVjdGlvbnMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAnL2RvY3MvUWxpayBTZW5zZSBTYWFTIGRlbW8gdG9vbCBzZXR1cCBpbnN0cnVjdGlvbnMuZG9jeCc7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdkb2Nfd2ViSW50ZWdyYXRpb24nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAnaHR0cHM6Ly9jb21tdW5pdHkucWxpay5jb20vZG9jcy9ET0MtMTc4MzQnO1xuICAgICAgICB9KTtcbiAgICAgICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ2RvY19kYXRhSW50ZWdyYXRpb24nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAnaHR0cHM6Ly9vbmVkcml2ZS5saXZlLmNvbS92aWV3LmFzcHg/Y2lkPTA4MDU0MDU5MjhhNzU3MjcmaWQ9ZG9jdW1lbnRzJnJlc2lkPTgwNTQwNTkyOEE3NTcyNyUyMTEzMzAmYXBwPU9uZU5vdGUmYXV0aGtleT0hQU53azVTOEtQQ19fLWR3JiZ3ZD10YXJnZXQlMjglMkYlMkZFTUJFRERFRCUyMEFOQUxZVElDUy5vbmUlN0NiZjI5NzJiZS00OGEwLTQ2ZmEtYWY3YS1mNmQyZjgwY2YwNmIlMkZEYXRhJTIwaW50ZWdyYXRpb24lMjBDb21iaW5lJTIwc291cmNlcyUyMGludG8lMjBvbmUlMjBhc3NvY2lhdGl2ZSUyMG1vZGVsJTdDZTY2OWEwYTItOWE4My00NzBlLWFhZTgtYmE2M2FjNTAwMDM4JTJGJTI5JztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ3NlcV90aWNrZXRpbmdfZmxvdycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiaHR0cDovL2tuc3YuZ2l0aHViLmlvL21lcm1haWQvbGl2ZV9lZGl0b3IvIy92aWV3L2MyVnhkV1Z1WTJWRWFXRm5jbUZ0Q2tKeWIzZHpaWEl0UGo1TlpYUmxiM0lnZDJWaUlHbHVkR1ZuY21GMGFXOXVJR1JsYlc4NklGVnpaWElnYkc5bmN5QnBiaUJwYm5SdklFMWxkR1Z2Y2lBS1FuSnZkM05sY2kwLVBpQlFjbTk0ZVRvZ1NVWnlZVzFsSUhSeWFXVnpJSFJ2SUc5d1pXNGdVMlZ1YzJVZ1kyOXVkR1Z1ZENCMmFXRWdiR2x1YXlCMGFHRjBJR052Ym5SaGFXNXpJQzl3Y205NGVTOEtVSEp2ZUhrdFBqNU5aWFJsYjNJZ1UxTlBJR05zYVdWdWREb2dVbVZrYVhKbFkzUWdjbVZ4ZFdWemRDQjBieUIzWldKd1lXZGxJRzl1SUhSb1pTQmpiR2xsYm5RZ0tHTnNhV1Z1ZENCemFXUmxJSEp2ZFhSbEtTNEtDazV2ZEdVZ2NtbG5hSFFnYjJZZ1VISnZlSGs2SUZCeWIzaDVJR0ZzYzI4Z2FXNWpiSFZrWlhNZ2RHRnlaMlYwU1dRZ1BTQThTVVFnWm05eUlIUm9aU0J2Y21sbmFXNWhiQ0JWVWtrZ2RHaGhkQ0IwYUdVZ2RYTmxjaUIwY21sbGN5QjBieUJoWTJObGMzTS1MQ0JoYm1RZ2NISnZlSGxTWlhOMFZYSnBJRDBnUEhSb1pTQlZVa2tnZDJobGNtVWdkR2hsSUdGMWRHaGxiblJwWTJGMGFXOXVJRzF2WkhWc1pTQmpZVzRnWVdOalpYTnpJSFJvWlNCU1JWTlVJRUZRU1Q0S1RXVjBaVzl5SUZOVFR5QmpiR2xsYm5RdFBrMWxkR1Z2Y2lCelpYSjJaWEk2SUNCamJHbGxiblFnWTJGc2JITWdLSFZ6WlhJZ1lYZGhjbVVwSUhObGNuWmxjaUJ6YVdSbElHMWxkR2h2WkFwT2IzUmxJSEpwWjJoMElHOW1JRTFsZEdWdmNpQnpaWEoyWlhJNklGTnBibU5sSUhSb1pTQjFjMlZ5SUdseklHRnNjbVZoWkhrZ2JHOW5aMlZrSUdsdUlHbHVJRTFsZEdWdmNpd2dkMlVnWTJGdUlISmxjWFZsYzNRZ2RHaGxJSFZ6WlhKSlJDQmhibVFnWjNKdmRYQWdiV1Z0WW1WeWMyaHBjQ0JtY205dElIUm9aU0JOWlhSbGIzSWdjMlZ6YzJsdmJpNGdWSEoxYzNRZ2JXVmphR0Z1YVhOdE9pQlRaWEoyWlhJZ2FXMXdiM0owWldRZ1VXeHBheUJUWlc1elpTQmpiR2xsYm5RZ1kyVnlkR2xtYVdOaGRHVXVDazFsZEdWdmNpQnpaWEoyWlhJdFBqNVJVRk1nUVZCSk9pQlNaWEYxWlhOMElIUnBZMnRsZENCaGRDQlJVRk1nUVZCSkxDQndjbTkyYVdSbElIUm9aU0IxYzJWeVNXUWdZVzVrSUdkeWIzVndjeUJwYmlCS1UwOU9MZ3BPYjNSbElISnBaMmgwSUc5bUlFMWxkR1Z2Y2lCelpYSjJaWEk2SUU5d2RHbHZibUZzYkhrZ2FXNWpiSFZrWlNCMGFHVWdjbVZrYVhKbFkzUWdjR0Z5WVcxbGRHVnlJSFJ2SUdadmNuZGhjbVFnZEdobElIVnpaWElnWW1GamF5QjBieUIwYUdVZ2NHRm5aU0JvWlNCcGJtbDBhV0ZzYkhrZ2RISnBaV1FnZEc4Z1lXTmpaWE56TGdwUlVGTWdRVkJKTFMwLVBrMWxkR1Z2Y2lCelpYSjJaWEk2SUZGUVV5QkJVRWtnY21WMGRYSnVjeUJoSUhScFkydGxkQ0J1ZFcxaVpYSWdLR0Z1WkNCd2IzTnphV0pzZVNCeVpXUnBjbVZqZENCVlVrd3BJSGRvYVdOb0lIbHZkU0JvWVhabElIUnZJR0Z3Y0dWdVpDQnBiaUIwYUdVZ1ZWSk1JQXBOWlhSbGIzSWdjMlZ5ZG1WeUxTMC1QaUJOWlhSbGIzSWdkMlZpSUdsdWRHVm5jbUYwYVc5dUlHUmxiVzg2SUVOeVpXRjBaU0JoSUhKbFpHbHlaV04wSUZWU1RDQjNhR2xqYUNCMGFHVWdZMnhwWlc1MElHTnZaR1VnWTJGdUlIQjFkQ0JwYmlCMGFHVWdZbkp2ZDNObGNpQlZVa3dnWW1GeUxpQUtUbTkwWlNCeWFXZG9kQ0J2WmlCTlpYUmxiM0lnZDJWaUlHbHVkR1ZuY21GMGFXOXVJR1JsYlc4NklFTnNhV1Z1ZENCemFXUmxJR052WkdVc0lISmxjR3hoWTJWeklIUm9aU0IxY213Z2FXNGdZbkp2ZDNObGNpd2dZVzVrSUdadmNuZGhjbVJ6SUhSb1pTQjFjMlZ5SUhSdklGRnNhV3NnVTJWdWMyVXVJRlZ6WlhJZ2JtOTNJSEpsWTJWcGRtVnpJR0VnVVd4cGF5QlRaVzV6WlNCelpYTnphVzl1SUdOdmIydHBaU0FvYzJWbElIWnBjblIxWVd3Z2NISnZlSGtnWTI5dVptbG5LU3dnWVc1a0lHRnVaQ0J6ZFdOb0lITnBibWRzWlNCemFXZHVJRzl1SUdseklHTnZibVpwWjNWeVpXUXVcIjtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ2dpdGh1Yl9jcmVhdGVfc3RyZWFtJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2l0SHViTGlua3MuY3JlYXRlU3RyZWFtO1xuICAgICAgICB9KTtcblxuICAgICAgICBUZW1wbGF0ZS5yZWdpc3RlckhlbHBlcignZ2l0aHViX2NvcHlfYXBwJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2l0SHViTGlua3MuY29weUFwcDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ2dpdGh1Yl9yZXBsYWNlX2FuZF9yZWxvYWRfYXBwJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2l0SHViTGlua3MucmVwbGFjZUFuZFJlbG9hZEFwcDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ2dpdGh1Yl9wdWJsaXNoX2FwcCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdpdEh1YkxpbmtzLnB1Ymxpc2hBcHA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdnaXRodWJfbG9nb3V0X3VzZXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBcImh0dHBzOi8vZ2l0aHViLmNvbS9RSG9zZS9RUlNNZXRlb3IvYmxvYi9tYXN0ZXIvaW1wb3J0cy9hcGkvc2VydmVyL1FQU0Z1bmN0aW9ucy5qcyNMMThcIjtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ3NlbnNlU2VydmVySHViJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2h0dHBzOi8vJyArIHNlbnNlQ29uZmlnLmhvc3QgKyAnOicgKyBzZW5zZUNvbmZpZy5wb3J0ICsgJy8nICsgc2Vuc2VDb25maWcudmlydHVhbFByb3h5Q2xpZW50VXNhZ2UgKyAnL2h1Yic7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdzZW5zZVNlcnZlckRldkh1YicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICdodHRwczovLycgKyBzZW5zZUNvbmZpZy5ob3N0ICsgJzonICsgc2Vuc2VDb25maWcucG9ydCArICcvJyArIHNlbnNlQ29uZmlnLnZpcnR1YWxQcm94eUNsaWVudFVzYWdlICsgJy9kZXYtaHViJztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ3NlbnNlU2VydmVyUU1DJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2h0dHBzOi8vJyArIHNlbnNlQ29uZmlnLmhvc3QgKyAnOicgKyBzZW5zZUNvbmZpZy5wb3J0ICsgJy8nICsgc2Vuc2VDb25maWcudmlydHVhbFByb3h5Q2xpZW50VXNhZ2UgKyAnL3FtYyc7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdzZW5zZVNlcnZlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICdodHRwczovLycgKyBzZW5zZUNvbmZpZy5ob3N0ICsgJzonICsgc2Vuc2VDb25maWcucG9ydCArICcvJyArIHNlbnNlQ29uZmlnLnZpcnR1YWxQcm94eUNsaWVudFVzYWdlO1xuICAgICAgICB9KTtcblxuICAgICAgICBUZW1wbGF0ZS5yZWdpc3RlckhlbHBlcignd2ViSW50ZWdyYXRpb25EZW1vJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2h0dHBzOi8vJyArIE1ldGVvci5zZXR0aW5ncy5wdWJsaWMud2ViSW50ZWdyYXRpb25Ib3N0ICsgJzonICsgTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy53ZWJJbnRlZ3JhdGlvbkRlbW9Qb3J0O1xuICAgICAgICB9KTtcblxuICAgICAgICAvL0ludGVncmF0aW9uIHByZXNlbnRhdGlvbiBJZnJhbWUgc2VsZWN0b3JcbiAgICAgICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ0lGcmFtZVVSTENoYXB0ZXJTZWxlY3Rpb24nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBhcHBJZCA9IENvb2tpZXMuZ2V0KCdzbGlkZUdlbmVyYXRvckFwcElkJyk7IC8vc2Vuc2VDb25maWcuc2xpZGVHZW5lcmF0b3JBcHBJZDtcbiAgICAgICAgICAgIHZhciBJbnRlZ3JhdGlvblByZXNlbnRhdGlvblNlbGVjdGlvblNoZWV0ID0gTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5zbGlkZUdlbmVyYXRvci5zZWxlY3Rpb25TaGVldDsgLy8nRFlUcHh2Jzsgc2VsZWN0aW9uIHNoZWV0IG9mIHRoZSBzbGlkZSBnZW5lcmF0b3JcbiAgICAgICAgICAgIHZhciBwcm94eSA9IE1ldGVvci5zZXR0aW5ncy5wdWJsaWMuc2xpZGVHZW5lcmF0b3IudmlydHVhbFByb3h5O1xuICAgICAgICAgICAgdmFyIHVybCA9IHNlbnNlQ29uZmlnLmhvc3QgKyAnOicgKyBzZW5zZUNvbmZpZy5wb3J0ICsgJy8nICsgcHJveHkgKyAnL3NpbmdsZS8/YXBwaWQ9JyArIGFwcElkICsgJyZzaGVldD0nICsgSW50ZWdyYXRpb25QcmVzZW50YXRpb25TZWxlY3Rpb25TaGVldCArICcmb3B0PWN1cnJzZWwnO1xuICAgICAgICAgICAgaWYgKE1ldGVvci5zZXR0aW5ncy5wdWJsaWMudXNlU1NMKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdodHRwczovLycgKyB1cmw7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAnaHR0cDovLycgKyB1cmw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdhdXRoZW50aWNhdGVkU2xpZGVHZW5lcmF0b3InLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gICAgIHJldHVybiBTZXNzaW9uLmdldCgnYXV0aGVudGljYXRlZFNsaWRlR2VuZXJhdG9yJyk7XG4gICAgICAgIC8vIH0pO1xuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdzaHJpbmtGb3JTbGlkZVNvcnRlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIENvb2tpZXMuZ2V0KCdzaG93U2xpZGVTb3J0ZXInKSA9PT0gXCJ0cnVlXCIgPyBcInNocmlua1wiIDogXCJcIjsgLy9cbiAgICAgICAgfSk7XG5cbiAgICAgICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ2dyb3VwU2VsZWN0ZWRTbGlkZUdlbmVyYXRvcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIFNlc3Npb24uZ2V0KCdncm91cEZvclByZXNlbnRhdGlvbicpOyAvL3VzZXIgc2VsZWN0ZWQgYSBwcmVzZW50YXRpb24gdHlwZT9cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy9yb2xlIHRoYXQgZGVmaW5lcyB5b3VyIHJvbGUgaW4gdGhlIHdob2xlIGludGVncmF0aW9uLnFsaWsuY29tIHNpdGUsIGJhc2VkIG9uIHRoaXMgd2UgbWFrZSBzZWxlY3Rpb25zIGluIHRoZSBzbGlkZSBnZW5lcmF0b3IuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdtYWluVXNlclJvbGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBDb29raWVzLmdldCgnY3VycmVudE1haW5Sb2xlJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdpc1NlbGVjdGVkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gc29tZVZhbHVlID8gJ3NlbGVjdGVkJyA6ICcnO1xuICAgICAgICB9KTtcblxuICAgICAgICBUZW1wbGF0ZS5yZWdpc3RlckhlbHBlcignY3VzdG9tZXJzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gQ3VzdG9tZXJzLmZpbmQoe30pO1xuICAgICAgICB9KTtcblxuICAgICAgICAvL3VzZWQgZm9yIEFsZGVlZCBhdXRvZm9ybVxuICAgICAgICBUZW1wbGF0ZS5yZWdpc3RlckhlbHBlcihcIkN1c3RvbWVyc1wiLCBDdXN0b21lcnMpO1xuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdub0N1c3RvbWVycycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICFDdXN0b21lcnMuZmluZCh7fSlcbiAgICAgICAgICAgICAgICAuY291bnQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ25vVGVtcGxhdGVBcHBzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gIVRlbXBsYXRlQXBwcy5maW5kKHt9KVxuICAgICAgICAgICAgICAgIC5jb3VudCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvL2dlbmVyaWMgaGVscGVycyB0byByZXR1cm4gdGhlIGNvbGxlY3Rpb24gdG8gdGhlIGJsYXplIHRlbXBsYXRlXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdjdXN0b21lcnNDb2xsZWN0aW9uJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gQ3VzdG9tZXJzLmZpbmQoe30sIHtcbiAgICAgICAgICAgICAgICBzb3J0OiB7XG4gICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ6IC0xXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCd0ZW1wbGF0ZUFwcHNDb2xsZWN0aW9uJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gVGVtcGxhdGVBcHBzLmZpbmQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ2FwcHNDb2xsZWN0aW9uJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gQXBwcy5maW5kKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdzdHJlYW1zQ29sbGVjdGlvbicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIFN0cmVhbXMuZmluZCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBUZW1wbGF0ZS5yZWdpc3RlckhlbHBlcignZnJlc2hFbnZpcm9ubWVudCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGZyZXNoRW52aXJvbm1lbnQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ2xvYWRpbmcnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdsb2FkaW5nIGluZGljYXRvciBpbiBoZWxwZXIgaXM6ICcsIFNlc3Npb24uZ2V0KCdsb2FkaW5nSW5kaWNhdG9yJykpO1xuICAgICAgICAgICAgcmV0dXJuIFNlc3Npb24uZ2V0KCdsb2FkaW5nSW5kaWNhdG9yJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGV4cG9ydCBmdW5jdGlvbiBmcmVzaEVudmlyb25tZW50KCkge1xuICAgICAgICAgICAgaWYgKCFDdXN0b21lcnMuZmluZCgpLmNvdW50KCkgJiYgIVRlbXBsYXRlQXBwcy5maW5kKCkuY291bnQoKSkge1xuICAgICAgICAgICAgICAgIC8vIFNlc3Npb24uc2V0KCdjdXJyZW50U3RlcCcsIDApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ3JlYWR5VG9TZWxlY3RUZW1wbGF0ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRTdGVwKCkgPT09IDJcbiAgICAgICAgfSk7XG5cbiAgICAgICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ3RlbXBsYXRlQnV0Tm9DdXN0b21lcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICFDdXN0b21lcnMuZmluZCgpXG4gICAgICAgICAgICAgICAgLmNvdW50KCkgJiYgVGVtcGxhdGVBcHBzLmZpbmQoKVxuICAgICAgICAgICAgICAgIC5jb3VudCgpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdyZWFkeVRvR2VuZXJhdGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50U3RlcCgpID09PSAzICYmICFTZXNzaW9uLmVxdWFscygnbG9hZGluZ0luZGljYXRvcicsICdsb2FkaW5nJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdzdGVwMycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIFNlc3Npb24uZ2V0KCdjdXJyZW50U3RlcCcpID09PSAzXG4gICAgICAgIH0pO1xuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdzdGVwM29yNCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIFNlc3Npb24uZ2V0KCdjdXJyZW50U3RlcCcpID09PSAzIHx8XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5nZXQoJ2N1cnJlbnRTdGVwJykgPT09IDQgfHxcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmVxdWFscygnbG9hZGluZ0luZGljYXRvcicsICdsb2FkaW5nJylcbiAgICAgICAgfSk7XG5cbiAgICAgICAgVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ3N0ZXBFcXVhbFRvJywgZnVuY3Rpb24oc3RlcE5yKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygndmFsdWUgb2YgY3VycmVudFN0ZXAoKSAnLCBjdXJyZW50U3RlcCgpKTtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50U3RlcCgpID09PSBzdGVwTnI7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGV4cG9ydCBmdW5jdGlvbiBjdXJyZW50U3RlcCgpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCd0aGUgY3VycmVudCBzdGVwIHNlc3Npb24nLCBTZXNzaW9uLmdldCgnY3VycmVudFN0ZXAnKSk7Ly9cblxuICAgICAgICAgICAgLy9zdGVwIDA6IGZyZXNoL3Jlc2V0dGVkIGVudmlyb25tZW50XG4gICAgICAgICAgICBpZiAoZnJlc2hFbnZpcm9ubWVudCgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vc3RlcCAxIGluc2VydCBjdXN0b21lcnNcbiAgICAgICAgICAgIGVsc2UgaWYgKFNlc3Npb24uZ2V0KCdjdXJyZW50U3RlcCcpID09PSAxKSB7XG4gICAgICAgICAgICAgICAgUm91dGVyLmdvKCd1c2VycycpO1xuICAgICAgICAgICAgICAgIHJldHVybiAxXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvL3N0ZXAgMiB0aGVyZSBhcmUgY3VzdG9tZXJzLCBidXQgbm8gdGVtcGxhdGVcbiAgICAgICAgICAgIGVsc2UgaWYgKFxuICAgICAgICAgICAgICAgIC8vIChDdXN0b21lcnMuZmluZCgpLmNvdW50KCkgJiYgIVRlbXBsYXRlQXBwcy5maW5kKCkuY291bnQoKSkgJiZcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmdldCgnY3VycmVudFN0ZXAnKSA9PT0gMikge1xuICAgICAgICAgICAgICAgIHJldHVybiAyXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvL3N0ZXAgM1xuICAgICAgICAgICAgZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgLy8gQ3VzdG9tZXJzLmZpbmQoKS5jb3VudCgpICYmIFxuICAgICAgICAgICAgICAgIC8vIFRlbXBsYXRlQXBwcy5maW5kKCkuY291bnQoKSAmJiBcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmdldCgnY3VycmVudFN0ZXAnKSA9PT0gMyAmJlxuICAgICAgICAgICAgICAgICFTZXNzaW9uLmVxdWFscygnbG9hZGluZ0luZGljYXRvcicsICdsb2FkaW5nJykpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnbG9hZGluZyBpbmRpY2F0b3IgaXMgJywgU2Vzc2lvbi5nZXQoJ2xvYWRpbmdJbmRpY2F0b3InKSApXG4gICAgICAgICAgICAgICAgcmV0dXJuIDNcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vc3RlcCA0XG4gICAgICAgICAgICBlbHNlIGlmIChcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmdldCgnY3VycmVudFN0ZXAnKSA9PT0gNFxuICAgICAgICAgICAgICAgIC8vICYmXG4gICAgICAgICAgICAgICAgLy8gQ3VzdG9tZXJzLmZpbmQoKS5jb3VudCgpICYmXG4gICAgICAgICAgICAgICAgLy8gVGVtcGxhdGVBcHBzLmZpbmQoKS5jb3VudCgpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gNDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoU2Vzc2lvbi5lcXVhbHMoJ2xvYWRpbmdJbmRpY2F0b3InLCAnbG9hZGluZycpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLnNldCgnY3VycmVudFN0ZXAnLCAzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gMztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdnZW5lcmF0aW9uRmluaXNoZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAoU2Vzc2lvbi5lcXVhbHMoJ2xvYWRpbmdJbmRpY2F0b3InLCAnbG9hZGluZycpIHx8IFNlc3Npb24uZ2V0KCdnZW5lcmF0ZWQ/JykpO1xuICAgICAgICB9KTtcblxuICAgICAgICBUZW1wbGF0ZS5yZWdpc3RlckhlbHBlcigncmVhZHlUb1Rlc3RTU08nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50U3RlcCgpID09PSA0XG4gICAgICAgIH0pO1xuXG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdhbmQnLCAoYSwgYikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGEgJiYgYjtcbiAgICAgICAgfSk7XG4gICAgICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdvcicsIChhLCBiKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYSB8fCBiO1xuICAgICAgICB9KTtcblxuICAgIH0iLCIvLyBTZXJ2aWNlQ29uZmlndXJhdGlvbi5jb25maWd1cmF0aW9ucy51cHNlcnQoe1xuLy8gICAgIHNlcnZpY2U6IFwiZmFjZWJvb2tcIlxuLy8gfSwge1xuLy8gICAgICRzZXQ6IHtcbi8vICAgICAgICAgYXBwSWQ6IE1ldGVvci5zZXR0aW5ncy5wcml2YXRlLmZhY2Vib29rLmNsaWVudElkLFxuLy8gICAgICAgICBsb2dpblN0eWxlOiBcInBvcHVwXCIsXG4vLyAgICAgICAgIHNlY3JldDogTWV0ZW9yLnNldHRpbmdzLnByaXZhdGUuZmFjZWJvb2suc2VjcmV0XG4vLyAgICAgfVxuLy8gfSk7XG5cbi8vIFNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zLnVwc2VydCh7XG4vLyAgICAgc2VydmljZTogXCJnaXRodWJcIlxuLy8gfSwge1xuLy8gICAgICRzZXQ6IHtcbi8vICAgICAgICAgY2xpZW50SWQ6IE1ldGVvci5zZXR0aW5ncy5wcml2YXRlLmdpdGh1Yi5jbGllbnRJZCxcbi8vICAgICAgICAgbG9naW5TdHlsZTogXCJwb3B1cFwiLFxuLy8gICAgICAgICBzZWNyZXQ6IE1ldGVvci5zZXR0aW5ncy5wcml2YXRlLmdpdGh1Yi5zZWNyZXRcbi8vICAgICB9XG4vLyB9KTtcblxuLy8gU2VydmljZUNvbmZpZ3VyYXRpb24uY29uZmlndXJhdGlvbnMudXBzZXJ0KHtcbi8vICAgICBzZXJ2aWNlOiBcImxpbmtlZGluXCJcbi8vIH0se1xuLy8gICAgIGxvZ2luU3R5bGU6IFwicG9wdXBcIixcbi8vICAgICBzZXJ2aWNlOiBcImxpbmtlZGluXCIsXG4vLyAgICAgY2xpZW50SWQ6IE1ldGVvci5zZXR0aW5ncy5wcml2YXRlLmxpbmtlZGluLmNsaWVudElkLFxuLy8gICAgIHNlY3JldDogTWV0ZW9yLnNldHRpbmdzLnByaXZhdGUubGlua2VkaW4uc2VjcmV0LFxuLy8gfSk7XG5cblxuLy8gU2VydmljZUNvbmZpZ3VyYXRpb24uY29uZmlndXJhdGlvbnMudXBzZXJ0KHtcbi8vICAgICBzZXJ2aWNlOiBcInR3aXR0ZXJcIiAgXG4vLyB9LHtcbi8vICAgICBzZXJ2aWNlOiBcInR3aXR0ZXJcIixcbi8vICAgICBjb25zdW1lcktleTogTWV0ZW9yLnNldHRpbmdzLnByaXZhdGUudHdpdHRlci5jbGllbnRJZCxcbi8vICAgICBsb2dpblN0eWxlOiBcInBvcHVwXCIsXG4vLyAgICAgc2VjcmV0OiBNZXRlb3Iuc2V0dGluZ3MucHJpdmF0ZS50d2l0dGVyLnNlY3JldFxuLy8gfSk7XG5cblxuLy8gU2VydmljZUNvbmZpZ3VyYXRpb24uY29uZmlndXJhdGlvbnMudXBzZXJ0KHtcbi8vICAgICBzZXJ2aWNlOiBcImdvb2dsZVwiXG4vLyB9LCB7XG4vLyAgICAgJHNldDoge1xuLy8gICAgICAgICBjbGllbnRJZDogTWV0ZW9yLnNldHRpbmdzLnByaXZhdGUuZ29vZ2xlLmNsaWVudElkLFxuLy8gICAgICAgICBsb2dpblN0eWxlOiBcInBvcHVwXCIsXG4vLyAgICAgICAgIHNlY3JldDogTWV0ZW9yLnNldHRpbmdzLnByaXZhdGUuZ29vZ2xlLnNlY3JldFxuLy8gICAgIH1cbi8vIH0pO1xuXG5cbmNvbnN0IG51bWJlck9mVXNlcnMgPSBNZXRlb3IudXNlcnMuZmluZCgpLmNvdW50KCk7XG5jb25zb2xlLmxvZygnQ2hlY2tpbmcgdGhlIHVzZXIgYWNjb3VudHMsIG51bWJlciBvZiB1c2VycyBpczogJyArIG51bWJlck9mVXNlcnMpXG5cbmlmICghbnVtYmVyT2ZVc2Vycykge1xuICAgIHZhciBpZCA9IEFjY291bnRzLmNyZWF0ZVVzZXIoe1xuICAgICAgICB1c2VybmFtZTogJ2RlbW8nLFxuICAgICAgICBlbWFpbDogJ2RlbW9AcWxpay5jb20nLFxuICAgICAgICBwYXNzd29yZDogJ3NjaGlwaG9sJyxcbiAgICAgICAgcHJvZmlsZTogeyBuYW1lOiAnUWxpayB0ZXN0IHVzZXInIH1cbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZygndXNlciBjcmVhdGVkIHdpdGggaWQ6ICcsIGlkKTtcbiAgICBSb2xlcy5hZGRVc2Vyc1RvUm9sZXMoaWQsICd0ZXN0JywgUm9sZXMuR0xPQkFMX0dST1VQKTtcblxuICAgIGlkID0gQWNjb3VudHMuY3JlYXRlVXNlcih7XG4gICAgICAgIHVzZXJuYW1lOiAnYWRtaW4nLFxuICAgICAgICBlbWFpbDogJ3Rlc3RAdGVzdC5jb20nLCAvL3RoZXNlIGFyZSBqdXN0IGR1bW1pZXNcbiAgICAgICAgcGFzc3dvcmQ6ICdRbGlrNDU2NDY0JyxcbiAgICAgICAgcHJvZmlsZTogeyBuYW1lOiAnUWxpayBhZG1pbiB1c2VyJyB9XG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coJ3VzZXIgY3JlYXRlZCB3aXRoIGlkOiAnLCBpZCk7XG4gICAgUm9sZXMuYWRkVXNlcnNUb1JvbGVzKGlkLCAnYWRtaW4nLCBSb2xlcy5HTE9CQUxfR1JPVVApO1xufVxuXG4vL2VuYWJsZSBhbm9uIGFjY2VzczogaHR0cHM6Ly9hdG1vc3BoZXJlanMuY29tL2FydHdlbGxzL2FjY291bnRzLWd1ZXN0XG5BY2NvdW50c0d1ZXN0LmVuYWJsZWQgPSB0cnVlO1xuQWNjb3VudHNHdWVzdC5hbm9ueW1vdXMgPSB0cnVlOyIsImltcG9ydCB7XG4gICAgTWV0ZW9yXG59IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0ICcuL21ldGhvZHMuanMnO1xuaW1wb3J0IHtcbiAgICBodHRwXG59IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHtcbiAgICBBcHBzLFxuICAgIFRlbXBsYXRlQXBwcyxcbiAgICBHZW5lcmF0ZWRSZXNvdXJjZXNcbn0gZnJvbSAnL2ltcG9ydHMvYXBpL2FwcHMnO1xuaW1wb3J0IHsgU2Vuc2VTZWxlY3Rpb25zIH0gZnJvbSAnL2ltcG9ydHMvYXBpL2xvZ2dlcic7XG5pbXBvcnQge1xuICAgIEFQSUxvZ3MsXG4gICAgUkVTVF9Mb2dcbn0gZnJvbSAnL2ltcG9ydHMvYXBpL0FQSUxvZ3MnO1xuXG4vL2ltcG9ydCBtZXRlb3IgY29sbGVjdGlvbnNcbmltcG9ydCB7XG4gICAgU3RyZWFtc1xufSBmcm9tICcvaW1wb3J0cy9hcGkvc3RyZWFtcyc7XG5pbXBvcnQge1xuICAgIEN1c3RvbWVyc1xufSBmcm9tICcvaW1wb3J0cy9hcGkvY3VzdG9tZXJzJztcblxuaW1wb3J0ICogYXMgUVNBcHAgZnJvbSAnL2ltcG9ydHMvYXBpL3NlcnZlci9RUlNGdW5jdGlvbnNBcHAnO1xuaW1wb3J0ICogYXMgUVNTdHJlYW0gZnJvbSAnL2ltcG9ydHMvYXBpL3NlcnZlci9RUlNGdW5jdGlvbnNTdHJlYW0nO1xuaW1wb3J0ICogYXMgUVNMaWMgZnJvbSAnL2ltcG9ydHMvYXBpL3NlcnZlci9RUlNGdW5jdGlvbnNMaWNlbnNlJztcbmltcG9ydCAqIGFzIFFTUHJveHkgZnJvbSAnL2ltcG9ydHMvYXBpL3NlcnZlci9RUFNGdW5jdGlvbnMnO1xuaW1wb3J0ICogYXMgUVNTeXN0ZW0gZnJvbSAnL2ltcG9ydHMvYXBpL3NlcnZlci9RUlNGdW5jdGlvbnNTeXN0ZW1SdWxlcyc7XG5pbXBvcnQgKiBhcyBRU0V4dGVuc2lvbnMgZnJvbSAnL2ltcG9ydHMvYXBpL3NlcnZlci9RUlNGdW5jdGlvbnNFeHRlbnNpb24nO1xuaW1wb3J0ICogYXMgUVNDdXN0b21Qcm9wcyBmcm9tICcvaW1wb3J0cy9hcGkvc2VydmVyL1FSU0Z1bmN0aW9uc0N1c3RvbVByb3BlcnRpZXMnO1xuXG4vL3N0b3Agb24gdW5oYW5kbGVkIGVycm9yc1xucHJvY2Vzcy5vbigndW5oYW5kbGVkUmVqZWN0aW9uJywgdXAgPT4ge1xuICAgIHRocm93IHVwXG59KVxuXG4vL2ltcG9ydCBjb25maWcgZm9yIFFsaWsgU2Vuc2UgUVJTIGFuZCBFbmdpbmUgQVBJLlxuaW1wb3J0IHtcbiAgICBzZW5zZUNvbmZpZyxcbiAgICBhdXRoSGVhZGVyc1xufSBmcm9tICcvaW1wb3J0cy9hcGkvY29uZmlnJztcbmltcG9ydCAnL2ltcG9ydHMvc3RhcnR1cC9hY2NvdW50cy1jb25maWcuanMnO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBmcyA9IHJlcXVpcmUoJ2ZzLWV4dHJhJyk7XG52YXIgbWFya2VkID0gcmVxdWlyZSgnbWFya2VkJyk7XG5cbi8vXG4vLyDilIDilIDilIAgTUVURU9SIE1FVEhPRFMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4vL1xuXG52YXIgc2hvd2Rvd24gPSByZXF1aXJlKFwic2hvd2Rvd25cIik7XG52YXIgY29udmVydGVyID0gbmV3IHNob3dkb3duLkNvbnZlcnRlcigpO1xuXG5NZXRlb3IubWV0aG9kcyh7XG4gICAgZ2V0SFRNTEZyb21NYXJrZG93blVybCh1cmwpe1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnZ2V0IG1hcmtkb3duIGZyb20gdGhlIHNlcnZlcjogJyt1cmwpXG4gICAgICAgIHZhciBtYXJrZG93blJlc3VsdCA9IEhUVFAuZ2V0KHVybCkgXG4gICAgICAgIC8vIHZhciBIVE1McmVzdWx0ID0gY29udmVydGVyLm1ha2VIdG1sKG1hcmtkb3duUmVzdWx0LmNvbnRlbnQpO1xuICAgICAgICB2YXIgSFRNTHJlc3VsdCA9IG1hcmtlZC5wYXJzZShtYXJrZG93blJlc3VsdC5jb250ZW50KTtcbiAgICAgICAgcmV0dXJuIEhUTUxyZXN1bHQ7ICAgICAgICBcbiAgICB9LFxuICAgIGdldFNlbnNlU2VsZWN0aW9uT2JqZWN0KGlkKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2dldFNlbnNlU2VsZWN0aW9uT2JqZWN0IGZvciBpZCcsIGlkKVxuICAgICAgICAvLyBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJyk7XG4gICAgICAgIGNoZWNrKGlkLCBTdHJpbmcpO1xuICAgICAgICB2YXIgcmVzdWx0ID0gU2Vuc2VTZWxlY3Rpb25zLmZpbmRPbmUoe1xuICAgICAgICAgICAgX2lkOiBpZFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5sb2coJ3Jlc3VsdCBvZiBnZXQgc2VsZWN0aW9uIGJ5IGlkJywgcmVzdWx0KVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG4gICAgZ2V0QXBwSURzKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgU1NCSTogc2Vuc2VDb25maWcuU1NCSUFwcCwgLy8gUVNBcHAuZ2V0QXBwcyhNZXRlb3Iuc2V0dGluZ3MucHVibGljLlNTQkkubmFtZSwgTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5TU0JJLnN0cmVhbSlbMF0uaWQsXG4gICAgICAgICAgICBzbGlkZUdlbmVyYXRvcjogc2Vuc2VDb25maWcuc2xpZGVHZW5lcmF0b3JBcHBJZCAvL1FTQXBwLmdldEFwcHMoTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5zbGlkZUdlbmVyYXRvci5uYW1lLCBNZXRlb3Iuc2V0dGluZ3MucHVibGljLnNsaWRlR2VuZXJhdG9yLnN0cmVhbSlbMF0uaWRcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGFzeW5jIGdlbmVyYXRlU3RyZWFtQW5kQXBwKGN1c3RvbWVycykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY2hlY2soY3VzdG9tZXJzLCBBcnJheSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdNaXNzaW5nIGZpZWxkJywgJ05vIGN1c3RvbWVycyBzdXBwbGllZCBmb3IgdGhlIGdlbmVyYXRpb24gb2YgYXBwcy4nKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBmaXJzdCBjbGVhbiB0aGUgZW52aXJvbm1lbnRcbiAgICAgICAgTWV0ZW9yLmNhbGwoJ3JlbW92ZUdlbmVyYXRlZFJlc291cmNlcycsIHtcbiAgICAgICAgICAgICdnZW5lcmF0aW9uVXNlcklkJzogTWV0ZW9yLnVzZXJJZCgpXG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCBRU0FwcC5nZW5lcmF0ZVN0cmVhbUFuZEFwcChjdXN0b21lcnMsIHRoaXMudXNlcklkKTsgLy90aGVuLCBjcmVhdGUgdGhlIG5ldyBzdHVmZlxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoIU1ldGVvci5zZXR0aW5ncy5icm9rZXIucWxpa1NlbnNlLm11bHRpVGVuYW50U2NlbmFyaW8pIHsgLy9vbiBwcmVtaXNlIGluc3RhbGxhdGlvbiBmb3IgYSBzaW5nbGUgdGVuYW50IChlLmcuIHdpdGggTVMgQWN0aXZlIERpcmVjdG9yeSlcbiAgICAgICAgICAgICAgICB2YXIgY3VzdG9tZXJOYW1lcyA9IGN1c3RvbWVycy5tYXAoZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYy5uYW1lO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFFTQ3VzdG9tUHJvcHMudXBzZXJ0Q3VzdG9tUHJvcGVydHlCeU5hbWUoJ2N1c3RvbWVyJywgY3VzdG9tZXJOYW1lcyk7IC8vZm9yIG5vbiBPRU0gc2NlbmFyaW9zICh3aXRoIE1TIEFEKSwgcGVvcGxlIGxpa2UgdG8gdXNlIGN1c3RvbSBwcm9wZXJ0aWVzIGZvciBhdXRob3JpemF0aW9uIGluc3RlYWQgb2YgdGhlIGdyb3VwcyB2aWEgYSB0aWNrZXQuXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZXJyb3IgdG8gY3JlYXRlIGN1c3RvbSBwcm9wZXJ0aWVzJywgZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgTWV0ZW9yLmNhbGwoJ3VwZGF0ZUxvY2FsU2Vuc2VDb3B5Jyk7XG4gICAgfSxcbiAgICByZXNldEVudmlyb25tZW50KCkge1xuICAgICAgICBNZXRlb3IuY2FsbCgncmVzZXRMb2dnZWRJblVzZXInKTsgLy9sb2dvdXQgYWxsIHVzZXJzIGJlZm9yZSByZW1vdmluZyBhbGwgdGhlIGN1cnJlbnQgY3VzdG9tZXJzLiBUaGlzIHRvIHByZXZlbnQgdGhlIHNjcmVlbiBzdGF5cyBsb2dnZWQgaW4gYXQgYW4gb2xkIHVzZXIuXG4gICAgICAgIE1ldGVvci5jYWxsKCdyZW1vdmVHZW5lcmF0ZWRSZXNvdXJjZXMnLCB7XG4gICAgICAgICAgICAnZ2VuZXJhdGlvblVzZXJJZCc6IE1ldGVvci51c2VySWQoKVxuICAgICAgICB9KTtcbiAgICAgICAgVGVtcGxhdGVBcHBzLnJlbW92ZSh7XG4gICAgICAgICAgICAnZ2VuZXJhdGlvblVzZXJJZCc6IE1ldGVvci51c2VySWQoKVxuICAgICAgICB9KTtcbiAgICAgICAgQ3VzdG9tZXJzLnJlbW92ZSh7XG4gICAgICAgICAgICAnZ2VuZXJhdGlvblVzZXJJZCc6IE1ldGVvci51c2VySWQoKVxuICAgICAgICB9KTtcbiAgICAgICAgQVBJTG9ncy5yZW1vdmUoe1xuICAgICAgICAgICAgJ2dlbmVyYXRpb25Vc2VySWQnOiBNZXRlb3IudXNlcklkKClcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghTWV0ZW9yLnNldHRpbmdzLmJyb2tlci5xbGlrU2Vuc2UubXVsdGlUZW5hbnRTY2VuYXJpbykgeyAvL29uIHByZW1pc2UgaW5zdGFsbGF0aW9uIGZvciBhIHNpbmdsZSB0ZW5hbnQgKGUuZy4gd2l0aCBNUyBBY3RpdmUgRGlyZWN0b3J5KVxuICAgICAgICAgICAgUVNDdXN0b21Qcm9wcy5kZWxldGVDdXN0b21Qcm9wZXJ0eSgnY3VzdG9tZXJzJyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHVwc2VydFRlbXBsYXRlKHNlbGVjdG9yLCBjdXJyZW50QXBwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCd1c2VyICcgKyBNZXRlb3IudXNlcklkKCkgKyAnIHNlbGVjdGVkIGEgdGVtcGxhdGUgYXBwOiAnICsgY3VycmVudEFwcC5uYW1lKVxuICAgICAgICBUZW1wbGF0ZUFwcHMudXBzZXJ0KHNlbGVjdG9yLCB7XG4gICAgICAgICAgICAkc2V0OiB7XG4gICAgICAgICAgICAgICAgbmFtZTogY3VycmVudEFwcC5uYW1lLFxuICAgICAgICAgICAgICAgIGlkOiBjdXJyZW50QXBwLmlkLFxuICAgICAgICAgICAgICAgIGdlbmVyYXRpb25Vc2VySWQ6IE1ldGVvci51c2VySWQoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgcmVtb3ZlVGVtcGxhdGUoc2VsZWN0b3IsIGN1cnJlbnRBcHApIHtcbiAgICAgICAgY29uc29sZS5sb2coJ3JlbW92ZSB0ZW1wbGF0ZScpXG4gICAgICAgIFRlbXBsYXRlQXBwcy5yZW1vdmUoc2VsZWN0b3IpO1xuICAgIH0sXG4gICAgcmVtb3ZlR2VuZXJhdGVkUmVzb3VyY2VzKGdlbmVyYXRpb25Vc2VyU2VsZWN0aW9uKSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ3JlbW92ZSBHZW5lcmF0ZWRSZXNvdXJjZXMgbWV0aG9kLCBiZWZvcmUgd2UgbWFrZSBuZXcgb25lcycpO1xuICAgICAgICAvL2xvZ2dpbmcgb25seVxuICAgICAgICBpZiAoZ2VuZXJhdGlvblVzZXJTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbGwgPSB7fTtcbiAgICAgICAgICAgIGNhbGwuYWN0aW9uID0gJ1JlbW92ZSBnZW5lcmF0ZWQgcmVzb3VyY2VzJztcbiAgICAgICAgICAgIGNhbGwucmVxdWVzdCA9ICdSZW1vdmUgYWxsIGFwcHMgYW5kIHN0cmVhbXMgaW4gUWxpayBTZW5zZSBmb3IgdXNlcklkOiAnICsgZ2VuZXJhdGlvblVzZXJTZWxlY3Rpb24uZ2VuZXJhdGlvblVzZXJJZDtcbiAgICAgICAgICAgIFJFU1RfTG9nKGNhbGwsIGdlbmVyYXRpb25Vc2VyU2VsZWN0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBHZW5lcmF0ZWRSZXNvdXJjZXMuZmluZChnZW5lcmF0aW9uVXNlclNlbGVjdGlvbilcbiAgICAgICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uKHJlc291cmNlKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcy51bmJsb2NrKClcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdyZXNldEVudmlyb25tZW50IGZvciB1c2VySWQnLCBNZXRlb3IudXNlcklkKCkpO2dlbmVyYXRpb25Vc2VyU2VsZWN0aW9uLmdlbmVyYXRpb25Vc2VySWRcblxuICAgICAgICAgICAgICAgIC8vSWYgbm90IHNlbGVjdGlvbiB3YXMgZ2l2ZW4sIHdlIHdhbnQgdG8gcmVzZXQgdGhlIHdob2xlIGVudmlyb25tZW50LCBzbyBhbHNvIGRlbGV0ZSB0aGUgc3RyZWFtcy5cbiAgICAgICAgICAgICAgICAvLyBpZiAoIWdlbmVyYXRpb25Vc2VyU2VsZWN0aW9uLmdlbmVyYXRpb25Vc2VySWQpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBNZXRlb3IuY2FsbCgnZGVsZXRlU3RyZWFtJywgcmVzb3VyY2Uuc3RyZWFtSWQpOyAvL2FkZGVkIHJhbmRvbSBjb21wYW55IG5hbWVzLCBzbyB0aGlzIHNob3VsZCBub3QgYmUgYW4gaXNzdWUgLy8yNi05IGNhbid0IGRlbGV0ZSBzdHJlYW0sIGJlY2F1c2UgZWFjaCB1c2VyIGNyZWF0ZXMgYSBzdHJlYW0gd2l0aCB0aGUgc2FtZSBuYW1lLi4uXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5lcnJvcignTm8gaXNzdWUsIGJ1dCB5b3UgY2FuIG1hbnVhbGx5IHJlbW92ZSB0aGlzIGlkIGZyb20gdGhlIGdlbmVyYXRlZCBkYXRhYmFzZS4gV2UgZ290IG9uZSByZXNvdXJjZSBpbiB0aGUgZ2VuZXJhdGVkIGxpc3QsIHRoYXQgaGFzIGFscmVhZHkgYmVlbiByZW1vdmVkIG1hbnVhbGx5JywgcmVzb3VyY2UpO1xuICAgICAgICAgICAgICAgIH0gLy9kb24ndCBib3RoZXIgaWYgZ2VuZXJhdGVkIHJlc291cmNlcyBkbyBub3QgZXhpc3RzLCBqdXN0IGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgIC8vZGVsZXRlIGFwcHMgYWx3YXlzXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgTWV0ZW9yLmNhbGwoJ2RlbGV0ZUFwcCcsIHJlc291cmNlLmFwcElkKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmVycm9yKCdObyBpc3N1ZSwgYnV0IHlvdSBjYW4gbWFudWFsbHkgcmVtb3ZlIHRoaXMgaWQgZnJvbSB0aGUgZ2VuZXJhdGVkIGRhdGFiYXNlLiBXZSBnb3Qgb25lIHJlc291cmNlIGluIHRoZSBnZW5lcmF0ZWQgbGlzdCwgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIHJlbW92ZWQgbWFudWFsbHknLCByZXNvdXJjZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgR2VuZXJhdGVkUmVzb3VyY2VzLnJlbW92ZShnZW5lcmF0aW9uVXNlclNlbGVjdGlvbik7XG4gICAgICAgIEFQSUxvZ3MucmVtb3ZlKGdlbmVyYXRpb25Vc2VyU2VsZWN0aW9uKTtcbiAgICB9LFxuICAgIGNvcHlBcHAoZ3VpZCwgbmFtZSkge1xuICAgICAgICBjaGVjayhndWlkLCBTdHJpbmcpO1xuICAgICAgICBjaGVjayhuYW1lLCBTdHJpbmcpO1xuICAgICAgICBjb25zdCBpZCA9IFFTQXBwLmNvcHlBcHAoZ3VpZCwgbmFtZSk7XG4gICAgICAgIE1ldGVvci5jYWxsKCd1cGRhdGVMb2NhbFNlbnNlQ29weScpO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfSxcbiAgICBjb3B5QXBwU2VsZWN0ZWRDdXN0b21lcnMoY3VycmVudEFwcCkgeyAvL3RoZSBhcHAgdGhlIHVzZXIgY2xpY2tlZCBvbiAgICAgICAgXG4gICAgICAgIGlmICghY3VycmVudEFwcCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignTm8gQXBwIHNlbGVjdGVkIHRvIGNvcHknKVxuICAgICAgICB9O1xuXG4gICAgICAgIGN1c3RvbWVycyA9IEN1c3RvbWVycy5maW5kKHtcbiAgICAgICAgICAgICdnZW5lcmF0aW9uVXNlcklkJzogTWV0ZW9yLnVzZXJJZCgpLFxuICAgICAgICAgICAgY2hlY2tlZDogdHJ1ZVxuICAgICAgICB9KTsgLy9hbGwgc2VsZWN0ZWQgY3VzdG9tZXJzXG4gICAgICAgIGlmICghY3VzdG9tZXJzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdObyBjdXN0b21lcnMgc2VsZWN0ZWQgdG8gY29weSB0aGUgYXBwIGZvcicpXG4gICAgICAgIH07XG5cbiAgICAgICAgY3VzdG9tZXJzXG4gICAgICAgICAgICAuZm9yRWFjaChjdXN0b21lciA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3QXBwSWQgPSBNZXRlb3IuY2FsbCgnY29weUFwcCcsIGN1cnJlbnRBcHAuaWQsIGN1c3RvbWVyLm5hbWUgKyAnLScgKyBjdXJyZW50QXBwLm5hbWUpO1xuICAgICAgICAgICAgICAgIE1ldGVvci5jYWxsKCd1cGRhdGVMb2NhbFNlbnNlQ29weScpO1xuXG4gICAgICAgICAgICAgICAgLy9zdG9yZSBpbiB0aGUgZGF0YWJhc2UgdGhhdCB0aGUgdXNlciBnZW5lcmF0ZWQgc29tZXRoaW5nLCBzbyB3ZSBjYW4gbGF0ZXIgb24gcmVtb3ZlIGl0LlxuICAgICAgICAgICAgICAgIEdlbmVyYXRlZFJlc291cmNlcy5pbnNlcnQoe1xuICAgICAgICAgICAgICAgICAgICAnZ2VuZXJhdGlvblVzZXJJZCc6IE1ldGVvci51c2VySWQoKSxcbiAgICAgICAgICAgICAgICAgICAgJ2N1c3RvbWVyJzogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgJ3N0cmVhbUlkJzogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgJ2FwcElkJzogbmV3QXBwSWRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlQXBwKGd1aWQpIHtcbiAgICAgICAgY2hlY2soZ3VpZCwgU3RyaW5nKTtcbiAgICAgICAgaWYgKGd1aWQgIT09IE1ldGVvci5zZXR0aW5ncy5wdWJsaWMudGVtcGxhdGVBcHBJZCkge1xuICAgICAgICAgICAgLy9sb2dnaW5nIG9ubHlcbiAgICAgICAgICAgIGNvbnN0IGNhbGwgPSB7fTtcbiAgICAgICAgICAgIGNhbGwuYWN0aW9uID0gJ0RlbGV0ZSBhcHAnO1xuICAgICAgICAgICAgY2FsbC5yZXF1ZXN0ID0gJ0RlbGV0ZSBhcHA6ICcgKyBndWlkO1xuICAgICAgICAgICAgUkVTVF9Mb2coY2FsbCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGlkID0gUVNBcHAuZGVsZXRlQXBwKGd1aWQpO1xuICAgICAgICAgICAgTWV0ZW9yLmNhbGwoJ3VwZGF0ZUxvY2FsU2Vuc2VDb3B5Jyk7XG4gICAgICAgICAgICByZXR1cm4gaWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwieW91IGNhbid0IGRlbGV0ZSB0aGUgdGVtcGxhdGUgYXBwIHdpdGggZ3VpZDogXCIsIGd1aWQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICByZW1vdmVBbGxDdXN0b21lcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gQ3VzdG9tZXJzLnJlbW92ZSh7XG4gICAgICAgICAgICAnZ2VuZXJhdGlvblVzZXJJZCc6IE1ldGVvci51c2VySWQoKVxuICAgICAgICB9KTtcbiAgICB9XG59KVxuXG5NZXRlb3IubWV0aG9kcyh7XG4gICAgdXBkYXRlTG9jYWxTZW5zZUNvcHlBcHBzKCkge1xuICAgICAgICAvL2RlbGV0ZSB0aGUgbG9jYWwgY29udGVudCBvZiB0aGUgZGF0YWJhc2UgYmVmb3JlIHVwZGF0aW5nIGl0XG4gICAgICAgIEFwcHMucmVtb3ZlKHt9KTtcblxuICAgICAgICAvL1VwZGF0ZSB0aGUgQXBwcyB3aXRoIGZyZXNoIGluZm8gZnJvbSBTZW5zZSAgICAgICAgXG4gICAgICAgIF8uZWFjaChRU0FwcC5nZXRBcHBzKCksIGFwcCA9PiB7XG4gICAgICAgICAgICBBcHBzLmluc2VydChhcHApO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHVwZGF0ZUxvY2FsU2Vuc2VDb3B5U3RyZWFtcygpIHtcbiAgICAgICAgLy9kZWxldGUgdGhlIGxvY2FsIGNvbnRlbnQgb2YgdGhlIGRhdGFiYXNlIGJlZm9yZSB1cGRhdGluZyBpdCAgICAgICAgXG4gICAgICAgIFN0cmVhbXMucmVtb3ZlKHt9KTtcblxuICAgICAgICAvL1VwZGF0ZSB0aGUgU3RyZWFtcyB3aXRoIGZyZXNoIGluZm8gZnJvbSBTZW5zZSAgICAgICAgXG4gICAgICAgIF8uZWFjaChRU1N0cmVhbS5nZXRTdHJlYW1zKCksIHN0cmVhbSA9PiB7XG4gICAgICAgICAgICBTdHJlYW1zLmluc2VydChzdHJlYW0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHVwZGF0ZUxvY2FsU2Vuc2VDb3B5KCkge1xuICAgICAgICAvLyAvL2NvbnNvbGUubG9nKCdNZXRob2Q6IHVwZGF0ZSB0aGUgbG9jYWwgbW9uZ29EQiB3aXRoIGZyZXNoIGRhdGEgZnJvbSBRbGlrIFNlbnNlOiBjYWxsIFFSUyBBUEkgZ2V0U3RyZWFtcyBhbmQgZ2V0QXBwcycpO1xuICAgICAgICAvL2RlbGV0ZSB0aGUgbG9jYWwgY29udGVudCBvZiB0aGUgZGF0YWJhc2UgYmVmb3JlIHVwZGF0aW5nIGl0XG4gICAgICAgIEFwcHMucmVtb3ZlKHt9KTtcbiAgICAgICAgU3RyZWFtcy5yZW1vdmUoe30pO1xuXG4gICAgICAgIC8vVXBkYXRlIHRoZSBBcHBzIGFuZCBTdHJlYW1zIHdpdGggZnJlc2ggaW5mbyBmcm9tIFNlbnNlICAgICAgICBcbiAgICAgICAgXy5lYWNoKFFTQXBwLmdldEFwcHMoKSwgYXBwID0+IHtcbiAgICAgICAgICAgIEFwcHMuaW5zZXJ0KGFwcCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF8uZWFjaChRU1N0cmVhbS5nZXRTdHJlYW1zKCksIHN0cmVhbSA9PiB7XG4gICAgICAgICAgICBTdHJlYW1zLmluc2VydChzdHJlYW0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGdldFNlY3VyaXR5UnVsZXMoKSB7XG4gICAgICAgIHJldHVybiBRU1N5c3RlbS5nZXRTZWN1cml0eVJ1bGVzKCk7XG4gICAgfVxufSk7IiwiLy9TRVRVUCBQUk9YWSBTRVJWRVIgVE8gUlVOIE1FVEVPUiBRUlMgQU5EIFdFQiBJTlRFR1JBVElPTiBERU1PIEJPVEggT04gUE9SVCA4MFxuXG4vLyB2YXIgcHJveHkgPSByZXF1aXJlKCdyZWRiaXJkJykoeyBwb3J0OiBNZXRlb3Iuc2V0dGluZ3MucHVibGljLnByb3h5UG9ydCwgbnRsbTogdHJ1ZSwgYnVueWFuOiBmYWxzZSB9KTsgLy9idW55YW46dHJ1ZSBmb3IgbG9nZ2luZyBvdXRwdXQgaW4gdGhlIGNvbnNvbGUgICAgXG4vLyBSb3V0ZSB0byBhbnkgbG9jYWwgaXAsIGZvciBleGFtcGxlIGZyb20gZG9ja2VyIGNvbnRhaW5lcnMuXG5cbi8vIE1ldGVvci5zdGFydHVwKCgpID0+IHtcbi8vICAgICBwcm94eS5yZWdpc3RlcihNZXRlb3Iuc2V0dGluZ3MucHVibGljLnFsaWtTZW5zZUhvc3QsIFwiaHR0cDovL2xvY2FsaG9zdDozMDAwXCIpOyAvL25lZWQgc3ViZG9tYWluIG90aGVyd2lzZSBtZXRlb3Igcm9vdC1VUkwgZG9lcyBub3Qgd29ya1xuLy8gICAgIHByb3h5LnJlZ2lzdGVyKE1ldGVvci5zZXR0aW5ncy5wdWJsaWMud2ViSW50ZWdyYXRpb25Ib3N0LCBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAzMFwiKTsgLy9uZWVkIHN1YmRvbWFpbiBvdGhlcndpc2UgbWV0ZW9yIHJvb3QtVVJMIGRvZXMgbm90IHdvcmtcbi8vICAgICBwcm94eS5yZWdpc3Rlcignc2xpZGVzLnFsaWsuY29tJywgXCJodHRwOi8vbG9jYWxob3N0OjMwNjBcIik7IC8vbmVlZCBzdWJkb21haW4gb3RoZXJ3aXNlIG1ldGVvciByb290LVVSTCBkb2VzIG5vdCB3b3JrXG4vLyAgICAgcHJveHkucmVnaXN0ZXIoJ2ludGVncmF0aW9uLnFsaWsuY29tJywgXCJodHRwOi8vbG9jYWxob3N0OjMwMDBcIik7IC8vbmVlZCBzdWJkb21haW4gb3RoZXJ3aXNlIG1ldGVvciByb290LVVSTCBkb2VzIG5vdCB3b3JrXG4vLyAgICAgcHJveHkucmVnaXN0ZXIoJ3NhYXNkZW1vLnFsaWsuY29tJywgXCJodHRwOi8vbG9jYWxob3N0OjMwMDBcIik7IC8vbmVlZCBzdWJkb21haW4gb3RoZXJ3aXNlIG1ldGVvciByb290LVVSTCBkb2VzIG5vdCB3b3JrXG4vLyB9KTsiLCIvL2ltcG9ydCBtZXRlb3IgY29sbGVjdGlvbnNcbmltcG9ydCB7IEFwcHMsIFRlbXBsYXRlQXBwcywgR2VuZXJhdGVkUmVzb3VyY2VzIH0gZnJvbSAnL2ltcG9ydHMvYXBpL2FwcHMnO1xuaW1wb3J0IHsgU3RyZWFtcyB9IGZyb20gJy9pbXBvcnRzL2FwaS9zdHJlYW1zJztcbmltcG9ydCB7IEN1c3RvbWVycyB9IGZyb20gJy9pbXBvcnRzL2FwaS9jdXN0b21lcnMnO1xuaW1wb3J0IHsgQVBJTG9ncyB9IGZyb20gJy9pbXBvcnRzL2FwaS9BUElMb2dzJztcbmltcG9ydCB7IExvZ2dlciwgU2Vuc2VTZWxlY3Rpb25zIH0gZnJvbSAnL2ltcG9ydHMvYXBpL2xvZ2dlcic7XG5pbXBvcnQgbW9tZW50IGZyb20gJ21vbWVudCc7XG5cblxuXG5NZXRlb3IucHVibGlzaCgnTG9nZ2VyJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIExvZ2dlci5maW5kKCk7XG4gICAgdGhpcy5yZWFkeSgpO1xufSk7XG5cbi8vIE1ldGVvci5wdWJsaXNoKCdTZW5zZVNlbGVjdGlvbnMnLCBmdW5jdGlvbigpIHtcbi8vICAgICByZXR1cm4gU2Vuc2VTZWxlY3Rpb25zLmZpbmQoeyAndXNlcklkJzogdGhpcy51c2VySWQgfSk7XG4vLyAgICAgdGhpcy5yZWFkeSgpO1xuLy8gfSk7XG5cbi8vb25seSBmaWxsIHRoZSBsb2NhbCBtb25nb0RCIHRoYXQgcnVucyBpbiB0aGUgYnJvd3NlciB3aXRoIGRhdGEgdGhhdCBiZWxvbmdzIHRvIHRoZSB1c2VyLi4uXG4vL2h0dHBzOi8vd3d3Lm1ldGVvci5jb20vdHV0b3JpYWxzL2JsYXplL3B1Ymxpc2gtYW5kLXN1YnNjcmliZVxuTWV0ZW9yLnB1Ymxpc2goJ2FwcHMnLCBmdW5jdGlvbihnZW5lcmF0ZWRBcHBzRnJvbVVzZXIpIHtcbiAgICBpZiAoUm9sZXMudXNlcklzSW5Sb2xlKHRoaXMudXNlcklkLCBbJ2FkbWluJ10sIFJvbGVzLkdMT0JBTF9HUk9VUCkpIHtcbiAgICAgICAgcmV0dXJuIEFwcHMuZmluZCgpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnQ2xpZW50IHN1YnNjcmliZWQgdG8gY29sbGVjdGlvbiwgd2l0aCB0aGVzZSBnZW5lcmF0ZWQgYXBwIGlkczogJywgZ2VuZXJhdGVkQXBwc0Zyb21Vc2VyKTtcbiAgICAgICAgaWYgKCFnZW5lcmF0ZWRBcHBzRnJvbVVzZXIpIHtcbiAgICAgICAgICAgIGdlbmVyYXRlZEFwcHNGcm9tVXNlciA9IFtdO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJyMjIyMjIE5vIGdlbmVyYXRlZCByZXNvdXJjZXMgZXhpc3RzIHlldCwgc28gb25seSBzaG93IHRoZSB0ZW1wbGF0ZSBhcHBzJylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCcjIyMgcHVibGljYXRpb24gcmVjZXZpZWQgdGhlc2UgZ2VuZXJhdGVkIGFwcCBpZHMgZm9yIHRoZSB1c2VyOiAnLCBnZW5lcmF0ZWRBcHBzRnJvbVVzZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBBcHBzLmZpbmQoe1xuICAgICAgICAgICAgJG9yOiBbeyBcImlkXCI6IHsgXCIkaW5cIjogZ2VuZXJhdGVkQXBwc0Zyb21Vc2VyIH0gfSwgeyBcInN0cmVhbS5uYW1lXCI6IFwiVGVtcGxhdGVzXCIgfSAvLywgeyBcInN0cmVhbS5uYW1lXCI6IFwiRXZlcnlvbmVcIiB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLnJlYWR5KCk7XG59KTtcblxuTWV0ZW9yLnB1Ymxpc2goJ3N0cmVhbXMnLCBmdW5jdGlvbihnZW5lcmF0ZWRTdHJlYW1zRnJvbVVzZXIpIHtcbiAgICBpZiAoUm9sZXMudXNlcklzSW5Sb2xlKHRoaXMudXNlcklkLCBbJ2FkbWluJ10sIFJvbGVzLkdMT0JBTF9HUk9VUCkpIHtcbiAgICAgICAgcmV0dXJuIFN0cmVhbXMuZmluZCgpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFnZW5lcmF0ZWRTdHJlYW1zRnJvbVVzZXIpIHtcbiAgICAgICAgICAgIGdlbmVyYXRlZFN0cmVhbXNGcm9tVXNlciA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTdHJlYW1zLmZpbmQoe1xuICAgICAgICAgICAgJG9yOiBbeyBcImlkXCI6IHsgXCIkaW5cIjogZ2VuZXJhdGVkU3RyZWFtc0Zyb21Vc2VyIH0gfSwgeyBcIm5hbWVcIjogXCJUZW1wbGF0ZXNcIiB9IC8vLCB7IFwibmFtZVwiOiBcIkV2ZXJ5b25lXCIgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9KTtcblxuICAgIH1cbiAgICB0aGlzLnJlYWR5KCk7XG59KTtcbk1ldGVvci5wdWJsaXNoKCd0ZW1wbGF0ZUFwcHMnLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gVGVtcGxhdGVBcHBzLmZpbmQoeyAnZ2VuZXJhdGlvblVzZXJJZCc6IHRoaXMudXNlcklkIH0pO1xuICAgIHRoaXMucmVhZHkoKTtcbn0pO1xuXG5NZXRlb3IucHVibGlzaCgnZ2VuZXJhdGVkUmVzb3VyY2VzJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEdlbmVyYXRlZFJlc291cmNlcy5maW5kKHsgJ2dlbmVyYXRpb25Vc2VySWQnOiB0aGlzLnVzZXJJZCB9KTtcbiAgICB0aGlzLnJlYWR5KCk7XG59KTtcblxuTWV0ZW9yLnB1Ymxpc2goJ2N1c3RvbWVycycsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBDdXN0b21lcnMuZmluZCh7ICdnZW5lcmF0aW9uVXNlcklkJzogdGhpcy51c2VySWQgfSk7XG4gICAgdGhpcy5yZWFkeSgpO1xufSk7XG5cbk1ldGVvci5wdWJsaXNoKCdhcGlMb2dzJywgZnVuY3Rpb24oKSB7XG4gICAgLy8gY29uc3Qgc2VsZWN0b3IgPSB7XG4gICAgLy8gICAgIFwiY3JlYXRlRGF0ZVwiOiB7XG4gICAgLy8gICAgICAgICAkbHQ6IG5ldyBEYXRlKCksXG4gICAgLy8gICAgICAgICAkZ3RlOiBuZXcgRGF0ZShuZXcgRGF0ZSgpLnNldERhdGUobmV3IERhdGUoKS5nZXREYXRlKCkgLSAwLjA1KSkgIC8vc2hvdyBvbmx5IHRoZSBsYXN0IGhvdXIgIG9mIGFwaSBsb2dzXG4gICAgLy8gICAgIH1cbiAgICAvL307XG4gICAgLy8gICAgIHRvZGF5OiBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgdmFyIG5vdyA9IG1vbWVudCgpLnRvRGF0ZSgpO1xuICAgIC8vICAgICByZXR1cm4gUG9zdHMuZmluZCh7Y3JlYXRlZEF0IDogeyAkZ3RlIDogbm93IH19KTtcbiAgICAvLyB9XG5cbiAgICBjb25zdCBzZWxlY3RvciA9IHtcbiAgICAgICAgc29ydDogeyBjcmVhdGVEYXRlOiAtMSB9LFxuICAgICAgICBsaW1pdDogMTVcbiAgICB9XG5cbiAgICByZXR1cm4gQVBJTG9ncy5maW5kKHsgJ2dlbmVyYXRpb25Vc2VySWQnOiB0aGlzLnVzZXJJZCB9LCBzZWxlY3Rvcik7XG4gICAgdGhpcy5yZWFkeSgpO1xufSk7XG5cbk1ldGVvci5wdWJsaXNoKCd1c2VycycsIGZ1bmN0aW9uKCkge1xuICAgIC8vU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hbGFubmluZy9tZXRlb3Itcm9sZXNcbiAgICBpZiAoUm9sZXMudXNlcklzSW5Sb2xlKHRoaXMudXNlcklkLCBbJ2FkbWluJ10sIFJvbGVzLkdMT0JBTF9HUk9VUCkpIHtcbiAgICAgICAgcmV0dXJuIE1ldGVvci51c2Vycy5maW5kKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdXNlciBub3QgYXV0aG9yaXplZC4gZG8gbm90IHB1Ymxpc2ggc2VjcmV0c1xuICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbn0pOyIsIi8vaHR0cHM6Ly9hdG1vc3BoZXJlanMuY29tL3NpbXBsZS9qc29uLXJvdXRlc1xuXG5Kc29uUm91dGVzLmFkZChcImdldFwiLCBcIi9PbmVDdXN0b21lcldpdGhVc2Vyc1wiLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICAgIC8vIHZhciBpZCA9IHJlcS5wYXJhbXMuaWQ7XG4gICAgdmFyIHNhbXBsZURhdGEgPSBjdXN0b21lcjFcblxuICAgIEpzb25Sb3V0ZXMuc2VuZFJlc3VsdChyZXMsIHtcbiAgICAgICAgZGF0YTogY3VzdG9tZXIxXG4gICAgfSk7XG59KTtcblxuSnNvblJvdXRlcy5hZGQoXCJnZXRcIiwgXCIvbXVsdGlwbGVDdXN0b21lcnNXaXRoVXNlcnNcIiwgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgICAvLyB2YXIgaWQgPSByZXEucGFyYW1zLmlkO1xuICAgIHZhciBzYW1wbGVEYXRhID0gW2N1c3RvbWVyMSwgY3VzdG9tZXIyXVxuXG4gICAgSnNvblJvdXRlcy5zZW5kUmVzdWx0KHJlcywge1xuICAgICAgICBkYXRhOiBbY3VzdG9tZXIxLCBjdXN0b21lcjJdXG4gICAgfSk7XG59KTtcblxudmFyIGN1c3RvbWVyMSA9IHtcbiAgICBcIl9pZFwiOiBcIkVYcGFwUnpaWGM1MkIzam9LXCIsXG4gICAgXCJuYW1lXCI6IFwiVWxscmljaCAtIEJhcnJvd3NcIixcbiAgICBcImNoZWNrZWRcIjogdHJ1ZSxcbiAgICBcInVzZXJzXCI6IFt7XG4gICAgICAgIFwibmFtZVwiOiBcIkpvaG5cIixcbiAgICAgICAgXCJncm91cFwiOiBcIkNvbnN1bWVyXCIsXG4gICAgICAgIFwiY3VycmVudGx5TG9nZ2VkSW5cIjogZmFsc2UsXG4gICAgICAgIFwiY291bnRyeVwiOiBcIkdlcm1hbnlcIlxuICAgIH0sIHtcbiAgICAgICAgXCJuYW1lXCI6IFwiTGluZGFcIixcbiAgICAgICAgXCJncm91cFwiOiBcIkNvbnRyaWJ1dG9yXCIsXG4gICAgICAgIFwiY3VycmVudGx5TG9nZ2VkSW5cIjogZmFsc2UsXG4gICAgICAgIFwiY291bnRyeVwiOiBcIlVuaXRlZCBTdGF0ZXNcIlxuICAgIH0sIHtcbiAgICAgICAgXCJuYW1lXCI6IFwiTWFydGluXCIsXG4gICAgICAgIFwiZ3JvdXBcIjogXCJEZXZlbG9wZXJcIixcbiAgICAgICAgXCJjdXJyZW50bHlMb2dnZWRJblwiOiBmYWxzZSxcbiAgICAgICAgXCJjb3VudHJ5XCI6IFwiSXRhbHlcIlxuICAgIH0sIHtcbiAgICAgICAgXCJuYW1lXCI6IFwiUGF1bFwiLFxuICAgICAgICBcImdyb3VwXCI6IFwiQWRtaW5cIixcbiAgICAgICAgXCJjdXJyZW50bHlMb2dnZWRJblwiOiBmYWxzZSxcbiAgICAgICAgXCJjb3VudHJ5XCI6IFwiSXRhbHlcIlxuICAgIH1dLFxuICAgIFwiZ2VuZXJhdGlvblVzZXJJZFwiOiBcInJaUFpZYmFXTTMzWkhOcjZaXCJcbn07XG5cbnZhciBjdXN0b21lcjIgPSB7XG4gICAgXCJfaWRcIjogXCJFWHBhcFJ6WlhjNTJCM2pvS1wiLFxuICAgIFwibmFtZVwiOiBcIlVsbHJpY2ggLSBCYXJyb3dzXCIsXG4gICAgXCJjaGVja2VkXCI6IHRydWUsXG4gICAgXCJ1c2Vyc1wiOiBbe1xuICAgICAgICBcIm5hbWVcIjogXCJKb2huXCIsXG4gICAgICAgIFwiZ3JvdXBcIjogXCJDb25zdW1lclwiLFxuICAgICAgICBcImN1cnJlbnRseUxvZ2dlZEluXCI6IGZhbHNlLFxuICAgICAgICBcImNvdW50cnlcIjogXCJHZXJtYW55XCJcbiAgICB9LCB7XG4gICAgICAgIFwibmFtZVwiOiBcIkxpbmRhXCIsXG4gICAgICAgIFwiZ3JvdXBcIjogXCJDb250cmlidXRvclwiLFxuICAgICAgICBcImN1cnJlbnRseUxvZ2dlZEluXCI6IGZhbHNlLFxuICAgICAgICBcImNvdW50cnlcIjogXCJVbml0ZWQgU3RhdGVzXCJcbiAgICB9LCB7XG4gICAgICAgIFwibmFtZVwiOiBcIk1hcnRpblwiLFxuICAgICAgICBcImdyb3VwXCI6IFwiRGV2ZWxvcGVyXCIsXG4gICAgICAgIFwiY3VycmVudGx5TG9nZ2VkSW5cIjogZmFsc2UsXG4gICAgICAgIFwiY291bnRyeVwiOiBcIkl0YWx5XCJcbiAgICB9LCB7XG4gICAgICAgIFwibmFtZVwiOiBcIlBhdWxcIixcbiAgICAgICAgXCJncm91cFwiOiBcIkFkbWluXCIsXG4gICAgICAgIFwiY3VycmVudGx5TG9nZ2VkSW5cIjogZmFsc2UsXG4gICAgICAgIFwiY291bnRyeVwiOiBcIkl0YWx5XCJcbiAgICB9XSxcbiAgICBcImdlbmVyYXRpb25Vc2VySWRcIjogXCJyWlBaWWJhV00zM1pITnI2WlwiXG59OyIsImltcG9ydCB7IFJFU1RfTG9nIH0gZnJvbSAnL2ltcG9ydHMvYXBpL0FQSUxvZ3MnO1xuXG5Sb3V0ZXIucm91dGUoJy91cGRhdGVTZW5zZUluZm8vYXBwcycsIGZ1bmN0aW9uKHJlcXVlc3QsIHJlc3BvbnNlLCBuZXh0KSB7XG4gICAgIC8vIGNvbnNvbGUubG9nKCcrKysrKysrKysrKytXZSBnb3QgYW4gaW5jb21pbmcgUkVTVCBDYWxsIGZyb20gdGhlIFNlbnNlIE5vdGlmaWNhdGlvbiBoYW5kbGVyIGZvciBBUFBTLCB0aGlzIG1lYW5zIHRoZSBTZW5zZSBSZXBvc2l0b3J5IGhhcyBjaGFuZ2VkJyk7XG4gICAgIC8vbG9nZ2luZyBvbmx5XG4gICAgIC8vIHZhciBjYWxsID0ge307XG4gICAgIC8vIGNhbGwuYWN0aW9uID0gJ05vdGlmaWNhdGlvbiBhcHBzJ1xuICAgICAvLyBjYWxsLnJlcXVlc3QgPSAnV2UgZ290IGFuIGluY29taW5nIFJFU1QgQ2FsbCBmcm9tIHRoZSBTZW5zZSBOb3RpZmljYXRpb24gaGFuZGxlciBmb3IgQVBQUywgdGhpcyBtZWFucyB0aGUgU2Vuc2UgUmVwb3NpdG9yeSBoYXMgY2hhbmdlZCc7XG4gICAgIC8vIFJFU1RfTG9nKGNhbGwpO1xuICAgICBNZXRlb3IuY2FsbCgndXBkYXRlTG9jYWxTZW5zZUNvcHlBcHBzJyk7XG4gfSwgeyB3aGVyZTogJ3NlcnZlcicgfSk7XG5cbiBSb3V0ZXIucm91dGUoJy91cGRhdGVTZW5zZUluZm8vc3RyZWFtcycsIGZ1bmN0aW9uKHJlcXVlc3QsIHJlc3BvbnNlLCBuZXh0KSB7XG4gICAgIC8vIGNvbnNvbGUubG9nKCcrKysrKysrKysrKytXZSBnb3QgYW4gaW5jb21pbmcgUkVTVCBDYWxsIGZyb20gdGhlIFNlbnNlIE5vdGlmaWNhdGlvbiBoYW5kbGVyIGZvciBTVFJFQU1TLCB0aGlzIG1lYW5zIHRoZSBTZW5zZSBSZXBvc2l0b3J5IGhhcyBjaGFuZ2VkJyk7XG4gICAgIC8vbG9nZ2luZyBvbmx5XG4gICAgIC8vIHZhciBjYWxsID0ge307XG4gICAgIC8vIGNhbGwuYWN0aW9uID0gJ05vdGlmaWNhdGlvbiBzdHJlYW1zJ1xuICAgICAvLyBjYWxsLnJlcXVlc3QgPSAnV2UgZ290IGFuIGluY29taW5nIFJFU1QgQ2FsbCBmcm9tIHRoZSBTZW5zZSBOb3RpZmljYXRpb24gaGFuZGxlciBmb3IgQVBQUywgdGhpcyBtZWFucyB0aGUgU2Vuc2UgUmVwb3NpdG9yeSBoYXMgY2hhbmdlZCc7XG4gICAgIC8vIFJFU1RfTG9nKGNhbGwpO1xuICAgICBNZXRlb3IuY2FsbCgndXBkYXRlTG9jYWxTZW5zZUNvcHlTdHJlYW1zJyk7XG4gfSwgeyB3aGVyZTogJ3NlcnZlcicgfSk7XG4iLCJpbXBvcnQge0N1c3RvbWVyc30gZnJvbSAnLi4vaW1wb3J0cy9hcGkvY3VzdG9tZXJzLmpzJztcblxudmFyIGN1c3RvbWVycyA9IFxuLy8gW3tcIm5hbWVcIjpcIkEmUiBQYXJ0bmVyc1wiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiQTJaIFNvbHV0aW9uc1wiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiQWFyb24gRC4gTWV5ZXIgJiBBc3NvY2lhdGVzXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJBYXJvbiBQcm9kdWN0c1wiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiQWN0aXZlIERhdGFcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIkJlbiBhbmQgSmVycnnigJlzXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJCZW5lZGljdFwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiQml6bWFydHNcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIkMgJiBDICBEZXNpZ25cIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIkMgJiBKIEVuZ2luZWVyaW5nXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJDQUYgU3lzdGVtaGF1c1wiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiQ0FNIEdyb3VwXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJDYXJpYmlhbiBTcGVjaWFsdGllc1wiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiQ2l0eSBGcmVzaCBGb29kc1wiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiQ2xlYXJvdXRcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIkRhdmlkIFNwZW5jZXIgTHRkLlwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiRGF5dG9uIE1hbGxlYWJsZSBJbmMuXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJEQ1AgUmVzZWFyY2hcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIkRDUyBJbnRlcm5hdGlvbmFsXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJEQ1MgTGFib3JhdG9yeVwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiRGVhay1QZXJlcmEgR3JvdXAuXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJFYXJ0aFwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiZURpc3RyaWN0XCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJFRFBcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIkV0aHlsIENvcnBvcmF0aW9uXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJGZWRlcmFsIEZvY3VzXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJGaWxsIEl0XCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJGaWxtb3R5cGVcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIkZpbnNcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIkdhdGVcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIkd1bGYgYW5kIFdlc3Rlcm4gSW5kdXN0cmllc1wiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiSGFydGUtSGFua3MgKGZvcm1lcmx5IExvY2F0b3IpXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJIYXJ2YXJkIFRydXN0IENvbXBhbnlcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIkhDSFNcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIkhlYWx0aGVvblwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiSGV0cmljayBTeXN0ZW1zXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJIb21lIFRlYW1cIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIkhvbWVib3VuZFwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiSUJWQVwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiSWNvblwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiSWNvbiBTaXRlIEJ1aWxkZXJzXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJJZHlsbHdpbGRcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIkouIFMuIExlZSBBc3NvY2lhdGVzXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJLIEludGVybmF0aW9uYWxcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIksuQy4gSXJ2aW5nXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJLYXJpICYgQXNzb2NpYXRlc1wiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiS2Fyc2luZ1wiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiS2F6aW5mb3JtY29tXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJLZW50SVNQXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJLb29sLVNlYWxcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIkxha2VyIEFpcndheXNcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIkxpdmVybW9yZSAgTGFib3JhdG9yaWVzIChMU0xJKVwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiTGl2ZVdpcmUgQkJTIGFuZCAgIEZhdm91cml0ZSBMaW5rc1wiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiTUFUUklYXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJNaWxlcyBMYWJvcmF0b3JpZXMsIEluYy5cIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIk5BQ1NDT1JQXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJPbmVzdGFyXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJQYWNlXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJQYWNpZmljIEdyb3VwXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJQYWNpZmljIE1hdGljc1wiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiUGFjaWZpYyBTaWVycmEgUmVzZWFyY2hcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIlBhY2lmaWMgVm9pY2VcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIlBhY2lmaWMgV2VzdCBFbnRlcnByaXNlc1wiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiUGFjaWZpY1NlcnZcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIlBhbm5nZWFcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIlBBUCAoTWFpbnRlbmFuY2UpXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJQYXJhY2VsXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJQYXRpZW50XCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJQaW5uYWNsZSBNaWNyb1wiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiUXVhbFNlcnZlXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJRdWFudHVtIDRYeXRlICBBcmNoaXRlY3RzXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJRd2VzdFwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiUiZSIEdyb3VwXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJSLkouIE1hdHRlciAmIEFzc29jaWF0ZXNcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIlJhIENvIEFtb1wiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiUkNcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIlJlYWR5LXRvLVJ1blwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiUmVtZWR5XCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJSZW5lZ2FkZSBpbmZvIENyZXdcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIlJldXRlcnMgVXNhYmlsaXR5IEdyb3VwXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJSZXZpZXdCb290aFwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiUkZJIENvcnBvcmF0aW9uXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJSb2FkIFdhcnJpb3IgSW50ZXJuYXRpb25hbFwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiUm9idXN0IENvZGVcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIlNhZ2VcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIlNhZ2VudFwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiU2FsYW1hbmRlciBKdW5jdGlvblwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiU2F0cm9uaXhcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIlNhdHlhbVwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiU2NpZW50aWZpYyBBdGxhbnRhXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJTY290R29sZCBQcm9kdWN0c1wiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiU2NyZWVuIFNhdmVyLmNvbVwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiU2lmdG9uIFByb3BlcnRpZXMgTGltaXRlZFwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiU2lnbWFcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIlNpZ25hdHVyZVwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiU2lnbmF0dXJlRmFjdG9yeVwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiU29sb21hbiBCcm90aGVyc1wiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiU291dGhlcm4gQ29tcGFueVwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiU3RvbmUgQ29uc29saWRhdGVkIENvcnBvcmF0aW9uXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJUYWxvdVwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiVGFtcGVyZVwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiVGFuZHkgQ29ycG9yYXRpb25cIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIlRhbmdlbnRcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIlRhbyBHcm91cFwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiVGFyZ2V0IE1hcmtldGluZ1wiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiVGVhbSBBU0FcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIlRlYW0gRmluYW5jaWFsIE1hbmFnZW1lbnQgU3lzdGVtc1wiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiVGVjYS1QcmludFwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiVGltZSBXYXJuZXJcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIlRvd21vdG9yIENvcnBvcmF0aW9uXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJUcmVkZWdhciBDb21wYW55XCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJUcmVuZCBMaW5lIENvcnBvcmF0aW9uXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJVLiBTLiBFeGNoYW5nZVwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiVW5pc29uIE1hbmFnZW1lbnQgQ29uY2VwdHNcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIlVuaXRlZCBTdGF0ZXMgIChVU0lUKVwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiVVVtYWlsXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJWYWxpQ2VydFwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiVmFsbGV5ICBTb2x1dGlvbnNcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIlZhbHBhdGtlblwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiVmFuc3RhclwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiVmVuYWJsZVwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiVmVucmVkXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJXYXRjb20gSW50ZXJuYXRpb25hbFwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiWGVudGVjXCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJYaWxpbnhcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIlhWVFwiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiWmVybyBBc3N1bXB0aW9uIFJlY292ZXJ5XCIsXCJjaGVja2VkXCI6dHJ1ZX0sXG4vLyB7XCJuYW1lXCI6XCJaaWxvZ1wiLFwiY2hlY2tlZFwiOnRydWV9LFxuLy8ge1wibmFtZVwiOlwiWml0ZWxcIixcImNoZWNrZWRcIjp0cnVlfSxcbi8vIHtcIm5hbWVcIjpcIlpvY2Fsb1wiLFwiY2hlY2tlZFwiOnRydWV9XVxuW3tcIm5hbWVcIjpcIlNoZWxsXCIsXCJjb2xsZWN0aW9uXCI6XCJTaGVsbFwifSxcbntcIm5hbWVcIjpcIkVzc29cIixcImNvbGxlY3Rpb25cIjpcIkVzc29cIn0sXG57XCJuYW1lXCI6XCJCUFwiLFwiY29sbGVjdGlvblwiOlwiQlBcIn1dO1xuXG4vL2lmIChDdXN0b21lcnMuZmluZCgpLmNvdW50KCkgPT09IDApeyBcbiAvLyBfLmVhY2goY3VzdG9tZXJzLCBmdW5jdGlvbihjdXN0b21lcil7XG4gIC8vICBDdXN0b21lcnMuaW5zZXJ0KGN1c3RvbWVyKTtcbi8vICAgIGNvbnNvbGUubG9nKFwiSW5zZXJ0ZWQgXCIrIGN1c3RvbWVyLm5hbWUpO1xuIC8vIH0pXG4vL31cblxuXG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tIFwibWV0ZW9yL21ldGVvclwiO1xuaW1wb3J0IHsgaHR0cCB9IGZyb20gXCJtZXRlb3IvbWV0ZW9yXCI7XG5pbXBvcnQgeyBBcHBzLCBUZW1wbGF0ZUFwcHMsIEdlbmVyYXRlZFJlc291cmNlcyB9IGZyb20gXCIvaW1wb3J0cy9hcGkvYXBwc1wiO1xuaW1wb3J0IHsgQVBJTG9ncywgUkVTVF9Mb2cgfSBmcm9tIFwiL2ltcG9ydHMvYXBpL0FQSUxvZ3NcIjtcbmltcG9ydCB7IFdlYkFwcCB9IGZyb20gJ21ldGVvci93ZWJhcHAnO1xuXG4vL2ltcG9ydCBtZXRlb3IgY29sbGVjdGlvbnNcbmltcG9ydCB7IFN0cmVhbXMgfSBmcm9tIFwiL2ltcG9ydHMvYXBpL3N0cmVhbXNcIjtcbmltcG9ydCB7IEN1c3RvbWVycyB9IGZyb20gXCIvaW1wb3J0cy9hcGkvY3VzdG9tZXJzXCI7XG5cbmltcG9ydCAqIGFzIFFTQXBwIGZyb20gXCIvaW1wb3J0cy9hcGkvc2VydmVyL1FSU0Z1bmN0aW9uc0FwcFwiO1xuaW1wb3J0ICogYXMgUVNTdHJlYW0gZnJvbSBcIi9pbXBvcnRzL2FwaS9zZXJ2ZXIvUVJTRnVuY3Rpb25zU3RyZWFtXCI7XG5pbXBvcnQgKiBhcyBRU0xpYyBmcm9tIFwiL2ltcG9ydHMvYXBpL3NlcnZlci9RUlNGdW5jdGlvbnNMaWNlbnNlXCI7XG5pbXBvcnQgKiBhcyBRU1Byb3h5IGZyb20gXCIvaW1wb3J0cy9hcGkvc2VydmVyL1FQU0Z1bmN0aW9uc1wiO1xuaW1wb3J0ICogYXMgUVNTeXN0ZW0gZnJvbSBcIi9pbXBvcnRzL2FwaS9zZXJ2ZXIvUVJTRnVuY3Rpb25zU3lzdGVtUnVsZXNcIjtcbmltcG9ydCAqIGFzIFFTRXh0ZW5zaW9ucyBmcm9tIFwiL2ltcG9ydHMvYXBpL3NlcnZlci9RUlNGdW5jdGlvbnNFeHRlbnNpb25cIjtcbmltcG9ydCAqIGFzIFFTQ3VzdG9tUHJvcHMgZnJvbSBcIi9pbXBvcnRzL2FwaS9zZXJ2ZXIvUVJTRnVuY3Rpb25zQ3VzdG9tUHJvcGVydGllc1wiO1xudmFyIG9zID0gcmVxdWlyZSgnb3MnKVxuXG4vL3N0b3Agb24gdW5oYW5kbGVkIGVycm9yc1xucHJvY2Vzcy5vbihcInVuaGFuZGxlZFJlamVjdGlvblwiLCB1cCA9PiB7XG4gICAgdGhyb3cgdXA7XG59KTtcblxuLy9pbXBvcnQgY29uZmlnIGZvciBRbGlrIFNlbnNlIFFSUyBhbmQgRW5naW5lIEFQSS5cbmltcG9ydCB7IHNlbnNlQ29uZmlnLCBhdXRoSGVhZGVycyB9IGZyb20gXCIvaW1wb3J0cy9hcGkvY29uZmlnXCI7XG5pbXBvcnQgXCIvaW1wb3J0cy9zdGFydHVwL2FjY291bnRzLWNvbmZpZy5qc1wiO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xudmFyIGZzID0gcmVxdWlyZShcImZzLWV4dHJhXCIpO1xuaW1wb3J0IHNoZWxsIGZyb20gXCJub2RlLXBvd2Vyc2hlbGxcIjtcblxudmFyIGNvbm5lY3RIYW5kbGVyID0gV2ViQXBwLmNvbm5lY3RIYW5kbGVyczsgLy8gZ2V0IG1ldGVvci1jb3JlJ3MgY29ubmVjdC1pbXBsZW1lbnRhdGlvblxuXG4vLyBhdHRhY2ggY29ubmVjdC1zdHlsZSBtaWRkbGV3YXJlIGZvciByZXNwb25zZSBoZWFkZXIgaW5qZWN0aW9uXG5NZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcbiAgICBXZWJBcHAuYWRkSHRtbEF0dHJpYnV0ZUhvb2soKCkgPT4gKHsgbGFuZzogJ2VuJyB9KSk7XG4gICAgY29ubmVjdEhhbmRsZXIudXNlKGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ2FjY2Vzcy1jb250cm9sLWFsbG93LW9yaWdpbicsICcqJyk7XG4gICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgfSlcbn0pXG5cblxuTWV0ZW9yLnN0YXJ0dXAoYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgLy8gcHJvY2Vzcy5lbnYuUk9PVF9VUkwgPSBcImh0dHA6Ly9cIiArIE1ldGVvci5zZXR0aW5ncy5wdWJsaWMucWxpa1NlbnNlSG9zdDtcbiAgICAvLyBjb25zb2xlLmxvZyhcbiAgICAvLyAgICAgXCIqKioqKioqKiogV2UgZXhwZWN0IFFsaWsgU2Vuc2UgdG8gcnVuIG9uIGhvc3Q6IFwiLFxuICAgIC8vICAgICBwcm9jZXNzLmVudi5ST09UX1VSTCArIFwiOlwiICsgTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5xbGlrU2Vuc2VQb3J0XG4gICAgLy8gKTtcbiAgICAvLyBjb25zb2xlLmxvZygnKioqKioqKioqIEZvciBFTkQgVVNFUlMgd2UgZXhwZWN0IFNlbnNlIHRvIHJ1biBvbiBob3N0OiAnLCBNZXRlb3Iuc2V0dGluZ3MucHVibGljLnFsaWtTZW5zZUhvc3QgKyAnOicgKyBNZXRlb3Iuc2V0dGluZ3MucHVibGljLnFsaWtTZW5zZVBvcnQpO1xuICAgIGF3YWl0IGluaXRRbGlrU2Vuc2UoKTtcbiAgICByZW1vdmVHZW5lcmF0ZWRSZXNvdXJjZXMoKTtcbiAgICBvcHRpbWl6ZU1vbmdvREIoKTtcbn0pO1xuXG4vL1xuLy8g4pSA4pSA4pSAIFNFVFVQIFFMSUsgU0VOU0UgQUZURVIgQSBDTEVBTiBRbElLIFNFTlNFIElOU1RBTEwg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4vL1xuXG4vL0NoZWNrIGlmIFFsaWsgU2Vuc2UgaGFzIGJlZW4gcHJvcGVybHkgc2V0dXAgZm9yIHRoaXMgTWV0ZW9yUVJTIHRvb2wuLlxuYXN5bmMgZnVuY3Rpb24gaW5pdFFsaWtTZW5zZSgpIHtcbiAgICBjb25zb2xlLmxvZyhcIi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVwiKTtcbiAgICBjb25zb2xlLmxvZyhcIklOSVQgUUxJSyBTRU5TRVwiKTtcbiAgICBjb25zb2xlLmxvZyhcIlByb2plY3Qgcm9vdCBmb2xkZXI6IFwiLCBNZXRlb3IuYWJzb2x1dGVQYXRoKTtcbiAgICBpZiAoIU1ldGVvci5zZXR0aW5ncy5icm9rZXIuYXV0b21hdGlvbkJhc2VGb2xkZXIpIHtcbiAgICAgICAgTWV0ZW9yLnNldHRpbmdzLmJyb2tlci5hdXRvbWF0aW9uQmFzZUZvbGRlciA9IHBhdGguam9pbihcbiAgICAgICAgICAgIE1ldGVvci5hYnNvbHV0ZVBhdGgsXG4gICAgICAgICAgICBcIi5hdXRvbWF0aW9uXCJcbiAgICAgICAgKTtcbiAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICBcIk1ldGVvci5zZXR0aW5ncy5icm9rZXIuYXV0b21hdGlvbkJhc2VGb2xkZXIgd2FzIGVtcHR5LCBzZXR0aW5nIGl0IHRvIGRlZmF1bHQ6IFwiLFxuICAgICAgICAgICAgTWV0ZW9yLnNldHRpbmdzLmJyb2tlci5hdXRvbWF0aW9uQmFzZUZvbGRlclxuICAgICAgICApO1xuICAgIH1cbiAgICBpZiAoIU1ldGVvci5zZXR0aW5ncy5icm9rZXIuY3VzdG9tZXJEYXRhRGlyKSB7XG4gICAgICAgIE1ldGVvci5zZXR0aW5ncy5icm9rZXIuY3VzdG9tZXJEYXRhRGlyID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgTWV0ZW9yLmFic29sdXRlUGF0aCxcbiAgICAgICAgICAgIFwiY3VzdG9tZXJEYXRhXCJcbiAgICAgICAgKTtcbiAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICBcIk1ldGVvci5zZXR0aW5ncy5icm9rZXIuY3VzdG9tZXJEYXRhRGlyIHdhcyBlbXB0eSwgc2V0dGluZyBpdCB0byBkZWZhdWx0OiBcIixcbiAgICAgICAgICAgIE1ldGVvci5zZXR0aW5ncy5icm9rZXIuY3VzdG9tZXJEYXRhRGlyXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKE1ldGVvci5zZXR0aW5ncy5icm9rZXIucnVuSW5pdGlhbFFsaWtTZW5zZVNldHVwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICBcIlRoZSBydW5Jbml0aWFsUWxpa1NlbnNlU2V0dXAgc2V0dGluZyBoYXMgYmVlbiBzZXQgdG8gdHJ1ZSwgc28gd2UgZXhwZWN0IHRvIGhhdmUgYSBmcmVzaCBRbGlrIFNlbnNlIGluc3RhbGxhdGlvbiBmb3Igd2hpY2ggd2Ugbm93IGF1dG9tYXRpY2FsbHkgcG9wdWxhdGUgd2l0aCB0aGUgYXBwcywgc3RyZWFtcywgbGljZW5zZSwgc2VjdXJpdHkgcnVsZXMgZXRjLlwiXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKE1ldGVvci5zZXR0aW5ncy5icm9rZXIucWxpa1NlbnNlLmluc3RhbGxRbGlrU2Vuc2UpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBpbnN0YWxsUWxpa1NlbnNlKCk7XG4gICAgICAgICAgICAgICAgLy8gYXdhaXQgdGltZW91dCgxMDAwICogNjAgKiAyMCk7IC8vd2FpdCAyMCBtaW51dGVzIHRpbGwgdGhlIFFsaWsgU2Vuc2UgaW5zdGFsbGF0aW9uIGhhcyBjb21wbGV0ZWQuLi5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFFTTGljLmluc2VydExpY2Vuc2UoKTtcbiAgICAgICAgICAgIFFTTGljLmluc2VydFVzZXJBY2Nlc3NSdWxlKCk7XG4gICAgICAgICAgICBRU1N5c3RlbS5kaXNhYmxlRGVmYXVsdFNlY3VyaXR5UnVsZXMoKTtcbiAgICAgICAgICAgIGF3YWl0IFFTUHJveHkuY3JlYXRlVmlydHVhbFByb3hpZXMoKTtcbiAgICAgICAgICAgIGF3YWl0IHRpbWVvdXQoNDAwMCk7IC8vd2FpdCB0aWxsIHRoZSBwcm94eSBoYXMgcmVzdGFydGVkLi4uXG4gICAgICAgICAgICBhd2FpdCBRU1N5c3RlbS5jcmVhdGVTZWN1cml0eVJ1bGVzKCk7XG4gICAgICAgICAgICBRU1N0cmVhbS5pbml0U2Vuc2VTdHJlYW1zKCk7XG4gICAgICAgICAgICBhd2FpdCBRU0FwcC51cGxvYWRBbmRQdWJsaXNoVGVtcGxhdGVBcHBzKCk7XG4gICAgICAgICAgICBRU0FwcC5zZXRBcHBJRHMoKTtcbiAgICAgICAgICAgIGF3YWl0IFFTQXBwLmNyZWF0ZUFwcENvbm5lY3Rpb25zKCk7IC8vaW1wb3J0IGV4dHJhIGNvbm5lY3Rpb25zXG4gICAgICAgICAgICBRU0V4dGVuc2lvbnMudXBsb2FkRXh0ZW5zaW9ucygpO1xuICAgICAgICAgICAgUVNMaWMuc2F2ZVN5c3RlbVJ1bGVzKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL3NldCB0aGUgYXBwIElkIGZvciB0aGUgc2VsZiBzZXJ2aWNlIGJpIGFuZCB0aGUgc2xpZGUgZ2VuZXJhdG9yIGFwcCwgZm9yIHVzZSBpbiB0aGUgSUZyYW1lcyBldGMuXG4gICAgICAgICAgICBRU0FwcC5zZXRBcHBJRHMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vbm93IHFsaWsgc2Vuc2UgaGFzIGJlZW4gaW5zdGFsbGVkLCB3ZSBjYW4gdHJ5IHRvIGNvbm5lY3QsIGFuZCBsb2FkIHRoZSBzdHJlYW1zIGFuZCBhcHBzIGludG8gb3VyIG1vbmdvREJcbiAgICAgICAgTWV0ZW9yLmNhbGwoXCJ1cGRhdGVMb2NhbFNlbnNlQ29weVwiKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgXCJNYWluLmpzLCBpbml0UWxpa1NlbnNlOiBGYWlsZWQgdG8gcnVuIHRoZSBpbml0aWFsaXphdGlvbiBvZiBRbGlrIFNlbnNlLiBNb3N0IGxpa2VseSByZWFzb24gaXMgdGhhdCBRbGlrIFNlbnNlIGhhcyBub3QgYmVlbiBpbnN0YWxsZWQsIHdyb25nIGhvc3RuYW1lcywgd3JvbmcgY2VydCBkaXJlY3RvcnkuLi5cIixcbiAgICAgICAgICAgIGVycm9yXG4gICAgICAgICk7XG4gICAgfVxufVxuXG4vL2hlbHBlciBmdW5jdGlvbnMgdG8gYXdhaXQgYSBzZXQgdGltZW91dFxuZnVuY3Rpb24gdGltZW91dChtcykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcbn1cbmFzeW5jIGZ1bmN0aW9uIHNsZWVwKGZuLCAuLi5hcmdzKSB7XG4gICAgYXdhaXQgdGltZW91dCgzMDAwKTtcbiAgICByZXR1cm4gZm4oLi4uYXJncyk7XG59XG5cbi8vXG4vLyDilIDilIDilIAgSU5TVEFMTCBRTElLIFNFTlNFIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuLy9cblxudmFyIGluc3RhbGxRbGlrU2Vuc2UgPSBhc3luYyBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgXCJpbnN0YWxsUWxpa1NlbnNlIGlzIHRydWUgaW4gdGhlIHNldHRpbmdzIGZpbGUgc28gc3RhcnQgY3JlYXRpbmcgdGhlIGNvbmZpZyBmaWxlIGZvciB0aGUgU2Vuc2Ugc2lsZW50IHNjcmlwdC4uLlwiXG4gICAgKTtcblxuICAgIC8vd2UgZHluYW1pY2FsbHkgcG9wdWxhdGUgdGhlIFFsaWsgc2Vuc2Ugc2lsZW50IGluc3RhbGxhdGlvbiBjb25maWcgZmlsZSwgdGhlIGhvc3RuYW1lIGlzIHRoZSB2YXJpYWJsZS4uLiBCZWNhdXNlIHdlIGNyZWF0ZSBhIGZvbGRlciBzaGFyZSB3aXRoIHRoaXMgbmFtZVxuICAgIHZhciBjb25maWdGaWxlID1cbiAgICAgICAgYDw/eG1sIHZlcnNpb249XCIxLjBcIj8+XG4gICAgPFNoYXJlZFBlcnNpc3RlbmNlQ29uZmlndXJhdGlvbiB4bWxuczp4c2k9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAxL1hNTFNjaGVtYS1pbnN0YW5jZVwiIHhtbG5zOnhzZD1cImh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hXCI+XG4gICAgPERiVXNlck5hbWU+dXNlcm5hbWU8L0RiVXNlck5hbWU+XG4gICAgPERiVXNlclBhc3N3b3JkPnBhc3N3b3JkPC9EYlVzZXJQYXNzd29yZD5cbiAgICA8RGJIb3N0PmAgK1xuICAgICAgICBvcy5ob3N0bmFtZSgpICtcbiAgICAgICAgYDwvRGJIb3N0PlxuICAgIDxEYlBvcnQ+NDQzMjwvRGJQb3J0PlxuICAgIDxSb290RGlyPlxcXFxcXFxcYCArXG4gICAgICAgIG9zLmhvc3RuYW1lKCkgK1xuICAgICAgICBgXFxcXFFsaWtTZW5zZVNoYXJlPC9Sb290RGlyPlxuICAgIDxTdGF0aWNDb250ZW50Um9vdERpcj5cXFxcXFxcXGAgK1xuICAgICAgICBvcy5ob3N0bmFtZSgpICtcbiAgICAgICAgYFxcXFxRbGlrU2Vuc2VTaGFyZVxcXFxTdGF0aWNDb250ZW50PC9TdGF0aWNDb250ZW50Um9vdERpcj5cbiAgICA8Q3VzdG9tRGF0YVJvb3REaXI+XFxcXFxcXFxgICtcbiAgICAgICAgb3MuaG9zdG5hbWUoKSArXG4gICAgICAgIGBcXFxcUWxpa1NlbnNlU2hhcmVcXFxcQ3VzdG9tRGF0YTwvQ3VzdG9tRGF0YVJvb3REaXI+XG4gICAgPEFyY2hpdmVkTG9nc0Rpcj5cXFxcXFxcXGAgK1xuICAgICAgICBvcy5ob3N0bmFtZSgpICtcbiAgICAgICAgYFxcXFxRbGlrU2Vuc2VTaGFyZVxcXFxBcmNoaXZlZExvZ3M8L0FyY2hpdmVkTG9nc0Rpcj5cbiAgICA8QXBwc0Rpcj5cXFxcXFxcXGAgK1xuICAgICAgICBvcy5ob3N0bmFtZSgpICtcbiAgICAgICAgYFxcXFxRbGlrU2Vuc2VTaGFyZVxcXFxBcHBzPC9BcHBzRGlyPlxuICAgIDxDcmVhdGVDbHVzdGVyPnRydWU8L0NyZWF0ZUNsdXN0ZXI+XG4gICAgPEluc3RhbGxMb2NhbERiPnRydWU8L0luc3RhbGxMb2NhbERiPlxuICAgIDxDb25maWd1cmVEYkxpc3RlbmVyPmZhbHNlPC9Db25maWd1cmVEYkxpc3RlbmVyPlxuICAgIDxMaXN0ZW5BZGRyZXNzZXM+KjwvTGlzdGVuQWRkcmVzc2VzPlxuICAgIDxJcFJhbmdlPjAuMC4wLjAvMDwvSXBSYW5nZT5cbiAgICA8L1NoYXJlZFBlcnNpc3RlbmNlQ29uZmlndXJhdGlvbj5gO1xuICAgIC8vU0FWRSBTaWxlbnQgaW5zdGFsbCBDT05GSUcgVE8gVEhFIEVYUE9SVCBGT0xERVJcbiAgICB2YXIgZmlsZSA9IHBhdGguam9pbihcbiAgICAgICAgTWV0ZW9yLnNldHRpbmdzLmJyb2tlci5hdXRvbWF0aW9uQmFzZUZvbGRlcixcbiAgICAgICAgXCJJbnN0YWxsYXRpb25Tb2Z0d2FyZVwiLFxuICAgICAgICBcInNwYy5jZmdcIlxuICAgICk7XG4gICAgZnMub3V0cHV0RmlsZShmaWxlLCBjb25maWdGaWxlLCBcInV0Zi04XCIpO1xuXG4gICAgY29uc29sZS5sb2coXCItLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cIik7XG4gICAgY29uc29sZS5sb2coXG4gICAgICAgICdjb25maWcgZmlsZSBjcmVhdGVkISB5b3UgY2FuIG5vdyBydW4gdGhlIFwic3RhcnQuYmF0XCIgaW4gdGhlIFwiQzpcXFxcR2l0SHViXFxRUlNNZXRlb3JcXFxcLmF1dG9tYXRpb25cXFxcSW5zdGFsbGF0aW9uU29mdHdhcmVcIiBmb2xkZXIgYXMgYWRtaW5pc3RyYXRvcidcbiAgICApO1xuICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgIFwiV2Ugbm93IGNyZWF0ZSBhbiBlcnJvciB0byBlbnN1cmUgUVJTTWV0ZW9yIHN0b3BzIGZ1cnRoZXIgc2V0dXAuICBUbyB0ZXN0IHRoZSBTZW5zZSBpbnN0YWxsYXRpb24sIHlvdSBjYW4gb3BlbiB0aGUgUU1DIChhbHNvIGNoZWNrIHRoZSBob3N0bmFtZSkuIFRoZSBRTUMgd2lsbCBhc2sgZm9yIHlvdSBsaWNlbnNlLiBCdXQgZG8gbm90IGRvIGFueXRoaW5nIGxpa2UgaW5zZXJ0aW5nIHRoZSBsaWNlbnNlLiBRUlNNZXRlb3Igd2lsbCBkbyB0aGlzIGZvciB5b3UuXCJcbiAgICApO1xuICAgIGNvbnNvbGUubG9nKFwiLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXCIpO1xuICAgIHRocm93IG5ldyBFcnJvcihcIkR1bW15IGVycm9yIHRvIG1ha2Ugc3VyZSBRUlNNZXRlb3Igc3RvcHMgcnVubmluZy4uLlwiKTtcbiAgICAvL3JlbW92ZWQgYXV0byBpbnN0YWxsIG9mIHNlbnNlLCB0byBwcmV2ZW50IGFuIGlzc3VlIHdpdGggdGhlIHJpZ2h0cy4uLlxuXG4gICAgLy8gdmFyIGV4ZWN1dGFibGUgPSAnc3RhcnRTaWxlbnRJbnN0YWxsLnBzMSc7XG4gICAgLy8gdmFyIGluc3RhbGxlciA9IHBhdGguam9pbihNZXRlb3Iuc2V0dGluZ3MuYnJva2VyLmF1dG9tYXRpb25CYXNlRm9sZGVyLCAnSW5zdGFsbGF0aW9uU29mdHdhcmUnLCBleGVjdXRhYmxlKTtcbiAgICAvLyBjb25zb2xlLmxvZygnaW5zdGFsbGVyJywgaW5zdGFsbGVyKVxuICAgIC8vIGF3YWl0IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIC8vICAgICB0cnkge1xuICAgIC8vICAgICAgICAgdmFyIHNwYXduID0gcmVxdWlyZShcImNoaWxkX3Byb2Nlc3NcIikuc3Bhd24sXG4gICAgLy8gICAgICAgICAgICAgY2hpbGQ7XG4gICAgLy8gICAgICAgICBjaGlsZCA9IHNwYXduKFwicG93ZXJzaGVsbC5leGVcIiwgW2luc3RhbGxlcl0pO1xuICAgIC8vICAgICAgICAgY2hpbGQuc3Rkb3V0Lm9uKFwiZGF0YVwiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgLy8gICAgICAgICAgICAgY29uc29sZS5sb2coXCJQb3dlcnNoZWxsIERhdGE6IFwiICsgZGF0YSk7XG4gICAgLy8gICAgICAgICB9KTtcbiAgICAvLyAgICAgICAgIGNoaWxkLnN0ZGVyci5vbihcImRhdGFcIiwgZnVuY3Rpb24oZGF0YSkge1xuICAgIC8vICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJQb3dlcnNoZWxsIEVycm9yczogXCIgKyBkYXRhKTtcbiAgICAvLyAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KCdFcnJvciBpbiBydW5uaW5nIHRoZSBzaWxlbnQgaW5zdGFsbGF0aW9uIHNjcmlwdCBvZiBxbGlrIHNlbnNlLi4uJyk7XG4gICAgLy8gICAgICAgICB9KTtcbiAgICAvLyAgICAgICAgIGNoaWxkLm9uKFwiZXhpdFwiLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBvd2Vyc2hlbGwgU2NyaXB0IGZpbmlzaGVkXCIpO1xuICAgIC8vICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKFwiUG93ZXJzaGVsbCBTY3JpcHQgZmluaXNoZWRcIik7XG4gICAgLy8gICAgICAgICB9KTtcbiAgICAvLyAgICAgICAgIGNoaWxkLnN0ZGluLmVuZCgpOyAvL2VuZCBpbnB1dC5cbiAgICAvLyAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAvLyAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2Vycm9yIGluIGNhbGxpbmcgdGhlIHN0YXJ0IG9mIHNpbGVudCBpbnN0YWxsIG9mIHFsaWsgc2Vuc2UsICcsIGVycm9yKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH0pO1xufTtcblxuLy8gbGV0IHBzID0gbmV3IHNoZWxsKHtcbi8vICAgICBleGVjdXRpb25Qb2xpY3k6ICdCeXBhc3MnLFxuLy8gICAgIG5vUHJvZmlsZTogdHJ1ZVxuLy8gfSk7XG4vLyB2YXIgZm9sZGVyID0gTWV0ZW9yLnNldHRpbmdzLmJyb2tlci5xbGlrU2Vuc2Uuc2hhcmVkUGVyc2lzdGFuY2VGb2xkZXI7XG4vLyB2YXIgbmFtZSA9IE1ldGVvci5zZXR0aW5ncy5icm9rZXIucWxpa1NlbnNlLnNoYXJlZFBlcnNpc3RhbmNlRm9sZGVyTmFtZTtcblxuLy8gLy8gcHMuYWRkQ29tbWFuZCgnV3JpdGUtSG9zdCBDcmVhdGluZyBhIHNoYXJlZCBmb2xkZXIgb246ICcgKyBmb2xkZXIpO1xuLy8gcHMuYWRkQ29tbWFuZCgnTmV3LUl0ZW0gXCJDOlxcXFx0ZXN0XCIg4oCTdHlwZSBkaXJlY3RvcnknKTtcbi8vIC8vIHBzLmFkZENvbW1hbmQoJ05ldy1TbWJTaGFyZSDigJNOYW1lICcgKyBuYW1lICsgJyDigJNQYXRoICcgKyBmb2xkZXIgKyAnIOKAk0Z1bGxBY2Nlc3MgRXZlcnlvbmUgICcpXG5cbi8vIHBzLmludm9rZSgpXG4vLyAgICAgLnRoZW4ob3V0cHV0ID0+IHtcbi8vICAgICAgICAgY29uc29sZS5sb2cob3V0cHV0KTtcbi8vICAgICB9KVxuLy8gICAgIC5jYXRjaChlcnIgPT4ge1xuLy8gICAgICAgICBjb25zb2xlLmVycm9yKCdJbnN0YWxsYXRpb24gb2YgUWxpayBTZW5zZSBmYWlsZWQsIG1ha2Ugc3VyZSB5b3UgY2hlY2sgdGhlIGxvZyBmaWxlIGluIEdpdEh1YlxcUVJTTWV0ZW9yXFwuYXV0b21hdGlvblxcSW5zdGFsbGF0aW9uU29mdHdhcmVcXGxvZy50eHQnLCBlcnIpXG4vLyAgICAgICAgIHBzLmRpc3Bvc2UoKTtcbi8vICAgICB9KTtcblxuLy9cbi8vIOKUgOKUgOKUgCBSRU1PVkUgU1RSRUFNUyBBTkQgQVBQUyBDUkVBVEVEIERVUklORyBUSEUgU0FBUyBERU1PIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuLy9cblxuZnVuY3Rpb24gcmVtb3ZlR2VuZXJhdGVkUmVzb3VyY2VzKCkge1xuICAgIC8vIGNvbnNvbGUubG9nKCdyZW1vdmUgdGhlIGFsbCBnZW5lcmF0ZWQgcmVzb3VyY2VzIG9uIGVhY2ggc2VydmVyIHN0YXJ0Jyk7XG4gICAgLy8gTWV0ZW9yLnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKCdyZW1vdmUgYWxsIGdlbmVyYXRlZCByZXNvdXJjZXMgaW4gbW9uZ28gYW5kIHFsaWsgc2Vuc2UgcGVyaW9kaWNhbGx5IGJ5IG1ha2luZyB1c2Ugb2YgYSBzZXJ2ZXIgc2lkZSB0aW1lcicpO1xuICAgIC8vICAgICBNZXRlb3IuY2FsbCgncmVtb3ZlR2VuZXJhdGVkUmVzb3VyY2VzJywge30pO1xuICAgIC8vIH0sIDApOyAvL3JlbW92ZSBhbGwgbG9ncyBkaXJlY3RseSBhdCBzdGFydHVwXG4gICAgaWYgKE1ldGVvci5zZXR0aW5ncy5icm9rZXIuYXV0b21hdGljQ2xlYW5VcEdlbmVyYXRlZEFwcHMgPT09IFwiWWVzXCIpIHtcbiAgICAgICAgTWV0ZW9yLnNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAgICAgXCJyZW1vdmUgYWxsIGdlbmVyYXRlZCByZXNvdXJjZXMgaW4gbW9uZ28gYW5kIHFsaWsgc2Vuc2UgcGVyaW9kaWNhbGx5IGJ5IG1ha2luZyB1c2Ugb2YgYSBzZXJ2ZXIgc2lkZSB0aW1lclwiXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgTWV0ZW9yLmNhbGwoXCJyZW1vdmVHZW5lcmF0ZWRSZXNvdXJjZXNcIiwge30pO1xuICAgICAgICB9LCAxICogODY0MDAwMDApOyAvL3JlbW92ZSBhbGwgbG9ncy9hcHBzL3N0cmVhbXMgZXZlcnkgMSBkYXlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG9wdGltaXplTW9uZ29EQigpIHtcbiAgICAvLyBjb25zb2xlLmxvZygnIyMgc2V0dGluZyB1cCBtb25nbyBpbmRleGVzIG9uIGdlbmVyYXRpb25Vc2VySWQgaW4gdGhlIGdlbmVyYXRlZCByZXNvdXJjZXMsIGN1c3RvbWVycyBhbmQgb3RoZXIgY29sbGVjdGlvbnMsIHRvIGluY3JlYXNlIG1vbmdvIHBlcmZvcm1hbmNlJyk7XG4gICAgVGVtcGxhdGVBcHBzLl9lbnN1cmVJbmRleCh7XG4gICAgICAgIGdlbmVyYXRpb25Vc2VySWQ6IDEsXG4gICAgICAgIGlkOiAxXG4gICAgfSk7XG4gICAgR2VuZXJhdGVkUmVzb3VyY2VzLl9lbnN1cmVJbmRleCh7XG4gICAgICAgIGdlbmVyYXRpb25Vc2VySWQ6IDEsXG4gICAgICAgIGlkOiAxXG4gICAgfSk7XG4gICAgQXBwcy5fZW5zdXJlSW5kZXgoe1xuICAgICAgICBpZDogMVxuICAgIH0pO1xuICAgIEN1c3RvbWVycy5fZW5zdXJlSW5kZXgoe1xuICAgICAgICBnZW5lcmF0aW9uVXNlcklkOiAxXG4gICAgfSk7XG4gICAgU3RyZWFtcy5fZW5zdXJlSW5kZXgoe1xuICAgICAgICBpZDogMVxuICAgIH0pO1xuICAgIEFQSUxvZ3MuX2Vuc3VyZUluZGV4KHtcbiAgICAgICAgY3JlYXRlZEJ5OiAxXG4gICAgfSk7XG4gICAgQVBJTG9ncy5fZW5zdXJlSW5kZXgoe1xuICAgICAgICBjcmVhdGVEYXRlOiAxXG4gICAgfSk7XG59XG5cbi8vXG4vLyDilIDilIDilIAgR0VUIEFOIFVQREFURSBXSEVOIFFMSUsgU0VOU0UgSEFTIENIQU5HRUQg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4vL1xuXG4vLyBmdW5jdGlvbiBjcmVhdGVOb3RpZmljYXRpb25MaXN0ZW5lcnMoKSB7XG4vLyAgICAgLy9DcmVhdGUgbm90aWZpY2F0aW9uIGxpc3RlbmVyIGluIFFsaWsgc2Vuc2UgaHR0cHM6Ly9oZWxwLnFsaWsuY29tL2VuLVVTL3NlbnNlLWRldmVsb3Blci8zLjEvU3Vic3lzdGVtcy9SZXBvc2l0b3J5U2VydmljZUFQSS9Db250ZW50L1JlcG9zaXRvcnlTZXJ2aWNlQVBJL1JlcG9zaXRvcnlTZXJ2aWNlQVBJLU5vdGlmaWNhdGlvbi1SZW1vdmUtQ2hhbmdlLVN1YnNjcmlwdGlvbi5odG1cbi8vICAgICAvL2NvbnNvbGUubG9nKCcqKioqKioqKiogT24gbWV0ZW9yIHN0YXJ0dXAsIE1ldGVvciB0b29sIHJlZ2lzdGVycyBpdHNlbGYgYXQgUWxpayBTZW5zZSB0byBnZXQgbm90aWZpY2F0aW9ucyBmcm9tIFNlbnNlIG9uIGNoYW5nZXMgdG8gYXBwcyBhbmQgc3RyZWFtcy4nKTtcbi8vICAgICAvL2NvbnNvbGUubG9nKCcqKioqKioqKiogd2UgdHJ5IHRvIHJlZ2lzdGVyIGEgbm90aWZpY2F0aW9uIG9uIHRoaXMgVVJMOiBIVFRQIHBvc3QgdG8gaHR0cDovLycgKyBzZW5zZUNvbmZpZy5TZW5zZVNlcnZlckludGVybmFsTGFuSVAgKyAnOicgKyBzZW5zZUNvbmZpZy5wb3J0ICsgJy8nICsgc2Vuc2VDb25maWcudmlydHVhbFByb3h5ICsgJy9xcnMvbm90aWZpY2F0aW9uP25hbWU9YXBwJyk7XG4vLyAgICAgLy9jb25zb2xlLmxvZygnKioqKioqKioqIFRoZSBub3RpZmljYXRpb24gVVJMIGZvciBTdHJlYW1zIGlzOiAnICsgTWV0ZW9yLnNldHRpbmdzLnByaXZhdGUubm90aWZpY2F0aW9uVVJMICsgJy9zdHJlYW1zJyk7XG5cbi8vICAgICB0cnkge1xuLy8gICAgICAgICBjb25zdCByZXN1bHRBcHAgPSBIVFRQLnBvc3QoJ2h0dHA6Ly8nICsgc2Vuc2VDb25maWcuU2Vuc2VTZXJ2ZXJJbnRlcm5hbExhbklQICsgJzonICsgc2Vuc2VDb25maWcucG9ydCArICcvJyArIHNlbnNlQ29uZmlnLnZpcnR1YWxQcm94eSArICcvcXJzL25vdGlmaWNhdGlvbj9uYW1lPWFwcCcsIHtcbi8vICAgICAgICAgICAgIGhlYWRlcnM6IGF1dGhIZWFkZXJzLFxuLy8gICAgICAgICAgICAgcGFyYW1zOiB7ICd4cmZrZXknOiBzZW5zZUNvbmZpZy54cmZrZXkgfSxcbi8vICAgICAgICAgICAgIGRhdGE6IE1ldGVvci5zZXR0aW5ncy5wcml2YXRlLm5vdGlmaWNhdGlvblVSTCArICcvYXBwcydcbi8vICAgICAgICAgfSlcblxuLy8gICAgICAgICBjb25zdCByZXN1bHRTdHJlYW0gPSBIVFRQLnBvc3QoJ2h0dHA6Ly8nICsgc2Vuc2VDb25maWcuU2Vuc2VTZXJ2ZXJJbnRlcm5hbExhbklQICsgJzonICsgc2Vuc2VDb25maWcucG9ydCArICcvJyArIHNlbnNlQ29uZmlnLnZpcnR1YWxQcm94eSArICcvcXJzL25vdGlmaWNhdGlvbj9uYW1lPXN0cmVhbScsIHtcbi8vICAgICAgICAgICAgICAgICBoZWFkZXJzOiBhdXRoSGVhZGVycyxcbi8vICAgICAgICAgICAgICAgICBwYXJhbXM6IHsgJ3hyZmtleSc6IHNlbnNlQ29uZmlnLnhyZmtleSB9LFxuLy8gICAgICAgICAgICAgICAgIGRhdGE6IE1ldGVvci5zZXR0aW5ncy5wcml2YXRlLm5vdGlmaWNhdGlvblVSTCArICcvc3RyZWFtcydcbi8vICAgICAgICAgICAgIH0pXG4vLyAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdSZWdpc3RlciBub3RpY2F0aW9uIHN1Y2Nlc3MnKTtcbi8vICAgICAgICAgICAgIC8vIC8vY29uc29sZS5sb2coJ3RoZSByZXN1bHQgZnJvbSBzZW5zZSByZWdpc3RlciBBcHAgbm90aWZpY2F0aW9uIHdhczogJywgcmVzdWx0QXBwKTtcbi8vICAgICAgICAgICAgIC8vIC8vY29uc29sZS5sb2coJ3RoZSByZXN1bHQgZnJvbSBzZW5zZSByZWdpc3RlciBTdHJlYW0gbm90aWZpY2F0aW9uIHdhczogJywgcmVzdWx0U3RyZWFtKTtcbi8vICAgICB9IGNhdGNoIChlcnIpIHtcbi8vICAgICAgICAgY29uc29sZS5lcnJvcignQ3JlYXRlIG5vdGlmaWNhdGlvbiBzdWJzY3JpcHRpb24gaW4gc2Vuc2UgcXJzIGZhaWxlZCcsIGVycik7XG4vLyAgICAgICAgIC8vIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ0NyZWF0ZSBub3RpZmljYXRpb24gc3Vic2NyaXB0aW9uIGluIHNlbnNlIHFycyBmYWlsZWQnLCBlcnIpO1xuLy8gICAgIH1cbi8vIH0iXX0=
