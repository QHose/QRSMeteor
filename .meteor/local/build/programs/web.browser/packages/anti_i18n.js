//////////////////////////////////////////////////////////////////////////
//                                                                      //
// This is a generated file. You can view the original                  //
// source in your browser if your browser supports source maps.         //
// Source maps are supported by all recent versions of Chrome, Safari,  //
// and Firefox, and by Internet Explorer 11.                            //
//                                                                      //
//////////////////////////////////////////////////////////////////////////


(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var _ = Package.underscore._;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var i18n;

(function(){

//////////////////////////////////////////////////////////////////////////////
//                                                                          //
// packages/anti_i18n/packages/anti_i18n.js                                 //
//                                                                          //
//////////////////////////////////////////////////////////////////////////////
                                                                            //
(function () {

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/anti:i18n/i18n.js                                        //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
/*                                                                   // 1
  just-i18n package for Meteor.js                                    // 2
  author: Hubert OG <hubert@orlikarnia.com>                          // 3
*/                                                                   // 4
                                                                     // 5
                                                                     // 6
var maps            = {};                                            // 7
var language        = '';                                            // 8
var defaultLanguage = 'en';                                          // 9
var missingTemplate = '';                                            // 10
var showMissing     = false;                                         // 11
var dep             = new Deps.Dependency();                         // 12
                                                                     // 13
                                                                     // 14
/*                                                                   // 15
  Convert key to internationalized version                           // 16
*/                                                                   // 17
i18n = function() {                                                  // 18
  dep.depend();                                                      // 19
                                                                     // 20
  var label;                                                         // 21
  var args = _.toArray(arguments);                                   // 22
                                                                     // 23
  /* remove extra parameter added by blaze */                        // 24
  if(typeof args[args.length-1] === 'object') {                      // 25
    args.pop();                                                      // 26
  }                                                                  // 27
                                                                     // 28
  var label = args[0];                                               // 29
  args.shift();                                                      // 30
                                                                     // 31
                                                                     // 32
  if(typeof label !== 'string') return '';                           // 33
  var str = (maps[language] && maps[language][label]) ||             // 34
         (maps[defaultLanguage] && maps[defaultLanguage][label]) ||  // 35
         (showMissing && _.template(missingTemplate, {language: language, defaultLanguage: defaultLanguage, label: label})) ||
         '';                                                         // 37
  str = replaceWithParams(str, args)                                 // 38
  return str;                                                        // 39
};                                                                   // 40
                                                                     // 41
/*                                                                   // 42
  Register handlebars helper                                         // 43
*/                                                                   // 44
if(Meteor.isClient) {                                                // 45
  if(UI) {                                                           // 46
    UI.registerHelper('i18n', function () {                          // 47
      return i18n.apply(this, arguments);                            // 48
    });                                                              // 49
  } else if(Handlebars) {                                            // 50
    Handlebars.registerHelper('i18n', function () {                  // 51
      return i18n.apply(this, arguments);                            // 52
    });                                                              // 53
  }                                                                  // 54
}                                                                    // 55
                                                                     // 56
function replaceWithParams(string, params) {                         // 57
  var formatted = string;                                            // 58
  params.forEach(function(param , index){                            // 59
    var pos = index + 1;                                             // 60
    formatted = formatted.replace("{$" + pos + "}", param);          // 61
  });                                                                // 62
                                                                     // 63
  return formatted;                                                  // 64
};                                                                   // 65
                                                                     // 66
/*                                                                   // 67
  Settings                                                           // 68
*/                                                                   // 69
i18n.setLanguage = function(lng) {                                   // 70
  language = lng;                                                    // 71
  dep.changed();                                                     // 72
};                                                                   // 73
                                                                     // 74
i18n.setDefaultLanguage = function(lng) {                            // 75
  defaultLanguage = lng;                                             // 76
  dep.changed();                                                     // 77
};                                                                   // 78
                                                                     // 79
i18n.getLanguage = function() {                                      // 80
  dep.depend();                                                      // 81
  return language;                                                   // 82
};                                                                   // 83
                                                                     // 84
i18n.showMissing = function(template) {                              // 85
  if(template) {                                                     // 86
    if(typeof template === 'string') {                               // 87
      missingTemplate = template;                                    // 88
    } else {                                                         // 89
      missingTemplate = '[<%= label %>]';                            // 90
    }                                                                // 91
    showMissing = true;                                              // 92
  } else {                                                           // 93
    missingTemplate = '';                                            // 94
    showMissing = false;                                             // 95
  }                                                                  // 96
};                                                                   // 97
                                                                     // 98
/*                                                                   // 99
  Register map                                                       // 100
*/                                                                   // 101
i18n.map = function(language, map) {                                 // 102
  if(!maps[language]) maps[language] = {};                           // 103
  registerMap(language, '', false, map);                             // 104
  dep.changed();                                                     // 105
};                                                                   // 106
                                                                     // 107
var registerMap = function(language, prefix, dot, map) {             // 108
  if(typeof map === 'string') {                                      // 109
    maps[language][prefix] = map;                                    // 110
  } else if(typeof map === 'object') {                               // 111
    if(dot) prefix = prefix + '.';                                   // 112
    _.each(map, function(value, key) {                               // 113
      registerMap(language, prefix + key, true, value);              // 114
    });                                                              // 115
  }                                                                  // 116
};                                                                   // 117
                                                                     // 118
                                                                     // 119
///////////////////////////////////////////////////////////////////////

}).call(this);

//////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("anti:i18n", {
  i18n: i18n
});

})();
