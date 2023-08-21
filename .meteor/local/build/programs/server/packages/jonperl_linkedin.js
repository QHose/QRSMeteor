(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var OAuth = Package.oauth.OAuth;
var Oauth = Package.oauth.Oauth;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var _ = Package.underscore._;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;

/* Package-scope variables */
var LinkedIn, Linkedin;

(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                      //
// packages/jonperl_linkedin/packages/jonperl_linkedin.js                                               //
//                                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                        //
(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                               //
// packages/jonperl:linkedin/linkedin_common.js                                                  //
//                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                 //
LinkedIn = {};                                                                                   // 1
                                                                                                 // 2
// For compatibility with mondora                                                                // 3
Linkedin = LinkedIn;                                                                             // 4
///////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                               //
// packages/jonperl:linkedin/linkedin_server.js                                                  //
//                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                 //
var urlUtil = Npm.require('url');                                                                // 1
                                                                                                 // 2
OAuth.registerService('linkedin', 2, null, function (query) {                                    // 3
                                                                                                 // 4
    var response = getTokens(query);                                                             // 5
    var accessToken = response.accessToken;                                                      // 6
    var identity = getIdentity(accessToken);                                                     // 7
                                                                                                 // 8
    var profileUrl = identity.siteStandardProfileRequest.url;                                    // 9
    var urlParts = urlUtil.parse(profileUrl, true);                                              // 10
                                                                                                 // 11
    var serviceData = {                                                                          // 12
        id: urlParts.query.id || Random.id(),                                                    // 13
        accessToken: OAuth.sealSecret(accessToken),                                              // 14
        expiresAt: (+new Date) + (1000 * response.expiresIn)                                     // 15
    };                                                                                           // 16
                                                                                                 // 17
    var whiteListed = ['firstName', 'headline', 'lastName'];                                     // 18
                                                                                                 // 19
    // include all fields from linkedin                                                          // 20
    // https://developer.linkedin.com/documents/authentication                                   // 21
    var fields = _.pick(identity, whiteListed);                                                  // 22
                                                                                                 // 23
    fields.name = identity.firstName + ' ' + identity.lastName;                                  // 24
                                                                                                 // 25
    return {                                                                                     // 26
        serviceData: serviceData,                                                                // 27
        options: { profile: fields }                                                             // 28
    };                                                                                           // 29
});                                                                                              // 30
                                                                                                 // 31
// checks whether a string parses as JSON                                                        // 32
var isJSON = function (str) {                                                                    // 33
    try {                                                                                        // 34
        JSON.parse(str);                                                                         // 35
        return true;                                                                             // 36
    } catch (e) {                                                                                // 37
        return false;                                                                            // 38
    }                                                                                            // 39
};                                                                                               // 40
                                                                                                 // 41
// returns an object containing:                                                                 // 42
// - accessToken                                                                                 // 43
// - expiresIn: lifetime of token in seconds                                                     // 44
var getTokens = function (query) {                                                               // 45
    var config = ServiceConfiguration.configurations.findOne({service: 'linkedin'});             // 46
    if (!config)                                                                                 // 47
        throw new ServiceConfiguration.ConfigError('Service not configured');                    // 48
                                                                                                 // 49
    var responseContent;                                                                         // 50
    try {                                                                                        // 51
        // Request an access token                                                               // 52
        responseContent = HTTP.post(                                                             // 53
            'https://api.linkedin.com/uas/oauth2/accessToken', {                                 // 54
                params: {                                                                        // 55
                    grant_type: 'authorization_code',                                            // 56
                    code: query.code,                                                            // 57
                    client_id: config.clientId,                                                  // 58
                    client_secret: config.secret,                                                // 59
                    redirect_uri: OAuth._redirectUri('linkedin', config)                         // 60
                }                                                                                // 61
            }).content;                                                                          // 62
    } catch (err) {                                                                              // 63
        throw new Error('Failed to complete OAuth handshake with LinkedIn. ' + err.message);     // 64
    }                                                                                            // 65
                                                                                                 // 66
    // If 'responseContent' does not parse as JSON, it is an error.                              // 67
    if (!isJSON(responseContent)) {                                                              // 68
        throw new Error('Failed to complete OAuth handshake with LinkedIn. ' + responseContent); // 69
    }                                                                                            // 70
                                                                                                 // 71
    // Success! Extract access token and expiration                                              // 72
    var parsedResponse = JSON.parse(responseContent);                                            // 73
    var accessToken = parsedResponse.access_token;                                               // 74
    var expiresIn = parsedResponse.expires_in;                                                   // 75
                                                                                                 // 76
    if (!accessToken) {                                                                          // 77
        throw new Error("Failed to complete OAuth handshake with LinkedIn " +                    // 78
            "-- can't find access token in HTTP response. " + responseContent);                  // 79
    }                                                                                            // 80
                                                                                                 // 81
    return {                                                                                     // 82
        accessToken: accessToken,                                                                // 83
        expiresIn: expiresIn                                                                     // 84
    };                                                                                           // 85
};                                                                                               // 86
                                                                                                 // 87
var getIdentity = function (accessToken) {                                                       // 88
    try {                                                                                        // 89
        return HTTP.get('https://www.linkedin.com/v1/people/~', {                                // 90
            params: { oauth2_access_token: accessToken, format: 'json'}                          // 91
        }).data;                                                                                 // 92
    } catch (err) {                                                                              // 93
        throw new Error('Failed to fetch identity from LinkedIn. ' + err.message,                // 94
            {response: err.response});                                                           // 95
    }                                                                                            // 96
};                                                                                               // 97
                                                                                                 // 98
LinkedIn.retrieveCredential = function (credentialToken, credentialSecret) {                     // 99
    return OAuth.retrieveCredential(credentialToken, credentialSecret)                           // 100
};                                                                                               // 101
                                                                                                 // 102
///////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);

//////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("jonperl:linkedin", {
  LinkedIn: LinkedIn,
  Linkedin: Linkedin
});

})();
