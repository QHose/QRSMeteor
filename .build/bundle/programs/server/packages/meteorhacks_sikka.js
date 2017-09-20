(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var _ = Package.underscore._;
var MeteorX = Package['meteorhacks:meteorx'].MeteorX;
var Picker = Package['meteorhacks:picker'].Picker;

/* Package-scope variables */
var Sikka, Config;

(function(){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/meteorhacks_sikka/packages/meteorhacks_sikka.js          //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteorhacks:sikka/lib/server/init.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Sikka = {};                                                                                                            // 1
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteorhacks:sikka/lib/server/config.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Sikka._getConfig = function (key, meteorSettingsKey, defaultValue) {                                                   // 1
  var envVar = process.env[key];                                                                                       // 2
  if(envVar) {                                                                                                         // 3
    return envVar;                                                                                                     // 4
  }                                                                                                                    // 5
                                                                                                                       // 6
  if(Meteor.settings) {                                                                                                // 7
    var parts = meteorSettingsKey.split('.');                                                                          // 8
    var value = Meteor.settings;                                                                                       // 9
    parts.forEach(function(key) {                                                                                      // 10
      if(value) {                                                                                                      // 11
        value = value[key];                                                                                            // 12
      }                                                                                                                // 13
    });                                                                                                                // 14
                                                                                                                       // 15
    if(value) {                                                                                                        // 16
      return value;                                                                                                    // 17
    }                                                                                                                  // 18
  }                                                                                                                    // 19
                                                                                                                       // 20
  return defaultValue;                                                                                                 // 21
};                                                                                                                     // 22
                                                                                                                       // 23
Config = {};                                                                                                           // 24
Config.captcha = {                                                                                                     // 25
  siteKey: Sikka._getConfig("SIKKA_CAPTCHA_SITE_KEY", "sikka.captcha.siteKey", "6LdkcgMTAAAAAJosMQhYSfKeFldhn644i9w9c4Oi"),
  secret: Sikka._getConfig("SIKKA_CAPTCHA_SECRET", "sikka.captcha.secret", "6LdkcgMTAAAAADftIWaISsvQ7SqIeLqHM3PWu79Q") // 27
};                                                                                                                     // 28
                                                                                                                       // 29
var perIpLimit = Sikka._getConfig("SIKKA_PER_IP_MAX_RPS", "sikka.rateLimits.perIp", 20);                               // 30
Config.rateLimits = {                                                                                                  // 31
  perIp: perIpLimit,                                                                                                   // 32
  perHuman: Sikka._getConfig("SIKKA_PER_HUMAN_MAX_RPS", "sikka.rateLimits.perHuman", perIpLimit),                      // 33
  perSession: Sikka._getConfig("SIKKA_PER_HUMAN_MAX_RPS", "sikka.rateLimits.perSession", perIpLimit),                  // 34
};                                                                                                                     // 35
                                                                                                                       // 36
Config.times = {                                                                                                       // 37
  blockIpFor: Sikka._getConfig("SIKKA_BLOCK_IP_FOR_MILLIS", "sikka.times.blockIpFor", 1000 * 60 * 2),                  // 38
  humanLivesUpto: Sikka._getConfig("SIKKA_HUMAN_LIVES_UPTO_MILLIS", "sikka.times.humanLivesUpto", 1000 * 60 * 60)      // 39
};                                                                                                                     // 40
                                                                                                                       // 41
Config.onlyForHumans = Sikka._getConfig('SIKKA_ONLY_FOR_HUMANS', 'sikka.onlyForHumans', false);                        // 42
                                                                                                                       // 43
console.log("Sikka: starting with these configurations:", JSON.stringify(Config));                                     // 44
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteorhacks:sikka/lib/server/core.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Sikka._rebuildStats = function() {                                                                                     // 1
  var stats = {                                                                                                        // 2
    perIp: {},                                                                                                         // 3
    perSession: {},                                                                                                    // 4
    perHuman: {}                                                                                                       // 5
  };                                                                                                                   // 6
                                                                                                                       // 7
  return stats;                                                                                                        // 8
};                                                                                                                     // 9
                                                                                                                       // 10
Sikka.stats = {};                                                                                                      // 11
                                                                                                                       // 12
Sikka._blackList = {};                                                                                                 // 13
Sikka._humanTokens = {};                                                                                               // 14
                                                                                                                       // 15
Sikka._getIp = function _getIp(headers, remoteAddress) {                                                               // 16
  var xForwardedFor = headers['x-forwarded-for'];                                                                      // 17
  if(xForwardedFor) {                                                                                                  // 18
    var firstIp = xForwardedFor.split(",")[0];                                                                         // 19
    return firstIp;                                                                                                    // 20
  } else {                                                                                                             // 21
    return remoteAddress;                                                                                              // 22
  }                                                                                                                    // 23
};                                                                                                                     // 24
                                                                                                                       // 25
Sikka._updateStats = function _updateStats(ip, sessionId, humanToken) {                                                // 26
  Sikka._ensureStats('perIp', ip, 1000 * 5);                                                                           // 27
  Sikka._ensureStats('perSession', sessionId, 1000 * 5);                                                               // 28
  Sikka._ensureStats('perHuman', humanToken, 1000 * 5);                                                                // 29
                                                                                                                       // 30
  Sikka._incStat('perIp', ip);                                                                                         // 31
  Sikka._incStat('perSession', sessionId);                                                                             // 32
  Sikka._incStat('perHuman', humanToken);                                                                              // 33
                                                                                                                       // 34
  var blocked = false;                                                                                                 // 35
  if(Sikka._rateExceeds("perIp", ip, Config.rateLimits.perIp)) {                                                       // 36
    console.log("Sikka: IP Blocked.", ip);                                                                             // 37
    Sikka._blockIpFor(ip, Config.times.blockIpFor);                                                                    // 38
    blocked = true;                                                                                                    // 39
  }                                                                                                                    // 40
                                                                                                                       // 41
  if(Sikka._isValidHuman(humanToken)) {                                                                                // 42
    var perHumanMaxRate = Config.rateLimits.perHuman;                                                                  // 43
    if(Sikka._rateExceeds("perHuman", humanToken, perHumanMaxRate)) {                                                  // 44
      console.log("Sikka: Human Blocked", humanToken);                                                                 // 45
      Sikka._deleteHuman(humanToken);                                                                                  // 46
      blocked = true;                                                                                                  // 47
    } else {                                                                                                           // 48
      blocked = false;                                                                                                 // 49
    }                                                                                                                  // 50
  } else if(Config.onlyForHumans) {                                                                                    // 51
    blocked = true;                                                                                                    // 52
  }                                                                                                                    // 53
                                                                                                                       // 54
  return blocked;                                                                                                      // 55
};                                                                                                                     // 56
                                                                                                                       // 57
Sikka._rateExceeds = function(type, key, maxValue) {                                                                   // 58
  var stats = Sikka._getStat(type, key);                                                                               // 59
  if(!stats) {                                                                                                         // 60
    return false;                                                                                                      // 61
  }                                                                                                                    // 62
                                                                                                                       // 63
  var timeDiffSecs = (Date.now() - stats.startedAt) / 1000;                                                            // 64
  if(timeDiffSecs < 1) {                                                                                               // 65
    return false;                                                                                                      // 66
  }                                                                                                                    // 67
                                                                                                                       // 68
  var rate = (stats.count) / timeDiffSecs;                                                                             // 69
  return rate > maxValue;                                                                                              // 70
}                                                                                                                      // 71
                                                                                                                       // 72
Sikka._blockIpFor = function(ip, millis) {                                                                             // 73
  millis = millis || 1000 * 60;                                                                                        // 74
  if(Sikka._blackList[ip]) {                                                                                           // 75
    clearTimeout(Sikka._blackList[ip]);                                                                                // 76
  }                                                                                                                    // 77
                                                                                                                       // 78
  Sikka._blackList[ip] = setTimeout(function() {                                                                       // 79
    delete Sikka._blackList[ip];                                                                                       // 80
  }, millis);                                                                                                          // 81
};                                                                                                                     // 82
                                                                                                                       // 83
Sikka._isBlocked = function(ip) {                                                                                      // 84
  return !!Sikka._blackList[ip];                                                                                       // 85
};                                                                                                                     // 86
                                                                                                                       // 87
Sikka._addHumanFor = function(token, millis) {                                                                         // 88
  if(Sikka._humanTokens[token]) {                                                                                      // 89
    clearTimeout(Sikka._humanTokens[token]);                                                                           // 90
  }                                                                                                                    // 91
                                                                                                                       // 92
  millis = millis || 1000 * 60 * 60;                                                                                   // 93
  Sikka._humanTokens[token] = setTimeout(function() {                                                                  // 94
    delete Sikka._humanTokens[token];                                                                                  // 95
  }, millis);                                                                                                          // 96
};                                                                                                                     // 97
                                                                                                                       // 98
Sikka._deleteHuman = function(token) {                                                                                 // 99
  if(Sikka._humanTokens[token]) {                                                                                      // 100
    clearTimeout(Sikka._humanTokens[token]);                                                                           // 101
  }                                                                                                                    // 102
                                                                                                                       // 103
  delete Sikka._humanTokens[token];                                                                                    // 104
};                                                                                                                     // 105
                                                                                                                       // 106
Sikka._isValidHuman = function(humanToken) {                                                                           // 107
  return !!Sikka._humanTokens[humanToken];                                                                             // 108
};                                                                                                                     // 109
                                                                                                                       // 110
Sikka._ensureStats = function(type, key, resetMillis) {                                                                // 111
  resetMillis = resetMillis || 1000 * 5;                                                                               // 112
  if(!Sikka.stats[type]) {                                                                                             // 113
    Sikka.stats[type] = {};                                                                                            // 114
  }                                                                                                                    // 115
                                                                                                                       // 116
  if(!Sikka.stats[type][key]) {                                                                                        // 117
    Sikka.stats[type][key] = {                                                                                         // 118
      startedAt: Date.now(),                                                                                           // 119
      count: 0                                                                                                         // 120
    };                                                                                                                 // 121
                                                                                                                       // 122
    setTimeout(function() {                                                                                            // 123
      delete Sikka.stats[type][key];                                                                                   // 124
    }, resetMillis);                                                                                                   // 125
  }                                                                                                                    // 126
};                                                                                                                     // 127
                                                                                                                       // 128
Sikka._incStat = function(type, key, value) {                                                                          // 129
  value = value || 1;                                                                                                  // 130
  Sikka.stats[type][key].count += value;                                                                               // 131
};                                                                                                                     // 132
                                                                                                                       // 133
Sikka._getStat = function(type, key) {                                                                                 // 134
  if(Sikka.stats[type] && Sikka.stats[type][key]) {                                                                    // 135
    return Sikka.stats[type][key];                                                                                     // 136
  } else {                                                                                                             // 137
    return null;                                                                                                       // 138
  }                                                                                                                    // 139
};                                                                                                                     // 140
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteorhacks:sikka/lib/server/session_hooks.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var sessionProto = MeteorX.Session.prototype;                                                                          // 1
var Fiber = Npm.require('fibers');                                                                                     // 2
                                                                                                                       // 3
var originalProcessMessage = sessionProto.processMessage;                                                              // 4
sessionProto.processMessage = function processMessage(msg) {                                                           // 5
  var self = this;                                                                                                     // 6
  var ip = Sikka._getIp(self.socket.headers, self.socket.remoteAddress);                                               // 7
  if(msg.msg === "method" && msg.method === "setSikkaHumanToken") {                                                    // 8
    var token = msg.params[0];                                                                                         // 9
    if(token) {                                                                                                        // 10
      this._sikkaHumanToken = token;                                                                                   // 11
    }                                                                                                                  // 12
                                                                                                                       // 13
    // complete the method                                                                                             // 14
    self.send({msg: "updated", methods: [msg.id]});                                                                    // 15
    self.send({msg: "result", id: msg.id});                                                                            // 16
    return;                                                                                                            // 17
  }                                                                                                                    // 18
                                                                                                                       // 19
  var sessionId = this.id;                                                                                             // 20
  var blocked = Sikka._updateStats(ip, sessionId, this._sikkaHumanToken);                                              // 21
  if(blocked) {                                                                                                        // 22
    console.info("Sikka: Closing current connection", sessionId);                                                      // 23
    Fiber(function() {                                                                                                 // 24
      // ask to reload the page or cordova app                                                                         // 25
      self.send({                                                                                                      // 26
        msg: "added",                                                                                                  // 27
        collection: "sikka-commands",                                                                                  // 28
        id: "reload",                                                                                                  // 29
        fields: {}                                                                                                     // 30
      });                                                                                                              // 31
                                                                                                                       // 32
      // Don't close the socket.                                                                                       // 33
      // Just ignore the load.                                                                                         // 34
      // If we try to close the socket, it'll try to reconnect again.                                                  // 35
      // That leads to a lot of requests and make the DOS attempt worst                                                // 36
      self.socket.removeAllListeners('data');                                                                          // 37
    }).run();                                                                                                          // 38
    return;                                                                                                            // 39
  }                                                                                                                    // 40
                                                                                                                       // 41
  originalProcessMessage.call(self, msg);                                                                              // 42
}                                                                                                                      // 43
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteorhacks:sikka/lib/server/routes.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var captchaPageTemplate = Assets.getText('lib/server/captcha_page.html');                                              // 1
var genCaptchaPage = _.template(captchaPageTemplate);                                                                  // 2
var urlParse = Npm.require("url").parse;                                                                               // 3
var request = Npm.require("request");                                                                                  // 4
var Cookies = Npm.require("cookies");                                                                                  // 5
                                                                                                                       // 6
Sikka.routes = {};                                                                                                     // 7
Sikka.routes._validationMiddleware =                                                                                   // 8
function _validationMiddleware(req, res, next) {                                                                       // 9
  // check for cookies                                                                                                 // 10
  var ip = Sikka._getIp(req.headers, req.socket.remoteAddress);                                                        // 11
  var cookies = new Cookies(req, res);                                                                                 // 12
  var humanToken = cookies.get('sikka-human-token');                                                                   // 13
                                                                                                                       // 14
  if(Sikka._isValidHuman(humanToken)) {                                                                                // 15
    return next();                                                                                                     // 16
  }                                                                                                                    // 17
                                                                                                                       // 18
  if(req.url.match(/\/verify-captcha/)) {                                                                              // 19
    return next();                                                                                                     // 20
  }                                                                                                                    // 21
                                                                                                                       // 22
  // Now this request is not coming from a human                                                                       // 23
  // And check if this app is only for humans                                                                          // 24
  if(Config.onlyForHumans) {                                                                                           // 25
    return Sikka.routes._sendCaptchPage(req, res);                                                                     // 26
  }                                                                                                                    // 27
                                                                                                                       // 28
  if(!Sikka._isBlocked(ip)) {                                                                                          // 29
    return next();                                                                                                     // 30
  }                                                                                                                    // 31
                                                                                                                       // 32
  Sikka.routes._sendCaptchPage(req, res);                                                                              // 33
};                                                                                                                     // 34
                                                                                                                       // 35
Sikka.routes._verifyCaptchaMiddleware =                                                                                // 36
function _verifyCaptchaMiddleware(params, req, res) {                                                                  // 37
  Sikka.routes._processCaptcha(req, res);                                                                              // 38
};                                                                                                                     // 39
                                                                                                                       // 40
Sikka.routes._sendCaptchPage = function _sendCaptchPage(req, res) {                                                    // 41
  res.writeHead(200, {'Content-Type': 'html'});                                                                        // 42
  var tmplValues = {                                                                                                   // 43
    captchaSiteKey: Config.captcha.siteKey,                                                                            // 44
    redirectUrl: req.url                                                                                               // 45
  };                                                                                                                   // 46
  var captchPage = genCaptchaPage(tmplValues);                                                                         // 47
  res.end(captchPage);                                                                                                 // 48
  return true;                                                                                                         // 49
};                                                                                                                     // 50
                                                                                                                       // 51
Sikka.routes._processCaptcha = function _processCaptcha(req, res) {                                                    // 52
  var parsedUrl = urlParse(req.url, true);                                                                             // 53
  var captchResponse = parsedUrl.query['g-recaptcha-response'];                                                        // 54
  var redirectUrl = parsedUrl.query['redirect-url'];                                                                   // 55
                                                                                                                       // 56
  request.post("https://www.google.com/recaptcha/api/siteverify", {                                                    // 57
    formData: {                                                                                                        // 58
      secret: Config.captcha.secret,                                                                                   // 59
      response: captchResponse                                                                                         // 60
    }                                                                                                                  // 61
  }, withResponse);                                                                                                    // 62
                                                                                                                       // 63
  function withResponse(err, r, body) {                                                                                // 64
    if(err) {                                                                                                          // 65
      console.error("Sikka: Captcha verification error: ", err.message);                                               // 66
      res.writeHead(500);                                                                                              // 67
      return res.end("Captcha verification errored!");                                                                 // 68
    }                                                                                                                  // 69
                                                                                                                       // 70
    var response = JSON.parse(body);                                                                                   // 71
                                                                                                                       // 72
    if(response.success) {                                                                                             // 73
      Sikka.routes._setSikkaHumanToken(req, res);                                                                      // 74
      res.writeHead(301, {                                                                                             // 75
        "Location": redirectUrl                                                                                        // 76
      });                                                                                                              // 77
      res.end();                                                                                                       // 78
    } else {                                                                                                           // 79
      console.error("Sikka: Captch verification failed!", response);                                                   // 80
      res.writeHead(401);                                                                                              // 81
      res.end("Captch verification failed!");                                                                          // 82
    }                                                                                                                  // 83
  }                                                                                                                    // 84
};                                                                                                                     // 85
                                                                                                                       // 86
Sikka.routes._setSikkaHumanToken = function _setSikkaHumanToken(req, res) {                                            // 87
  var cookies = new Cookies(req, res);                                                                                 // 88
  var token = Random.id();                                                                                             // 89
  // We need to make the load balancing sticky for this                                                                // 90
  Sikka._addHumanFor(token, Config.times.humanLivesUpto);                                                              // 91
  cookies.set("sikka-human-token", token, {httpOnly: false});                                                          // 92
};                                                                                                                     // 93
                                                                                                                       // 94
// Main Logic                                                                                                          // 95
Picker.middleware(Sikka.routes._validationMiddleware);                                                                 // 96
Picker.route('/verify-captcha', Sikka.routes._verifyCaptchaMiddleware);                                                // 97
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);

///////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package['meteorhacks:sikka'] = {}, {
  Sikka: Sikka
});

})();
