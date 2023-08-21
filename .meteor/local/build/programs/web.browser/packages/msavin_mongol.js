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
var Template = Package['templating-runtime'].Template;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var Mongo = Package.mongo.Mongo;
var $ = Package.jquery.$;
var jQuery = Package.jquery.jQuery;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var Spacebars = Package.spacebars.Spacebars;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var MeteorToysDict, Mongol, updData, newId, self, MongolEditingStatus, Mongol_InlineEditor, current, content, DocumentPosition, CurrentCollection, a, b, colorized, MeteorToys_Sub, thisishack, sessionKey, CollectionName, CollectionCount, CurrentDocument, DocumentID, ValidatedCurrentDocument, list, docID, docIndex, currentDoc, newPosition;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/lib/common.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// Grab the Dict
if (Meteor.isClient) {
  Meteor.startup(function () {
    MeteorToysDict = Package["meteortoys:toykit"].MeteorToys;
  })
}

// Create object and reserve name across the package
if (Mongol === undefined) {  
  Mongol = {};
}

Mongol = {
  'getDocumentUpdate': function (data) {
    var elementID = 'MongolDoc_' + data,
      newData = false;
      updData = document.getElementById(elementID);
      if (updData) {
        newData = updData.textContent;
      }

    return newData;
  },
  'error': function (data) {
    switch (data) {
      case "json.parse":
        alert("There is an error with your JSON syntax.\n\nNote: keys and string values need double quotes.");
        break;
      case "duplicate":
        alert("Strange, there was an error duplicating your document.");
        break;
      case "remove":
        alert("Strange, there was an error removing your document.");
        break;
      case "insert":
        alert("Strange, there was an error inserting your document.");
        break;
      case "update":
        alert("There was an error updating your document. Please review your changes and try again.");
        break;
      default:
        return "Unknown Error";
        break;
    }
  },
  'parse': function (data) {
      var newObject = null;
      try { 
        var reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
        var dateParser = function (key, value) {
          if (_.isString(value)) {
            var a = reISO.exec(value);
            if (a) {
              return new Date(value);
            }
          }
          return value;
        }
        newObject = JSON.parse(data, dateParser);
      }
      catch (error) {
        Mongol.error("json.parse");
      }
      return newObject;
  },
  'detectCollections': function () {
    if (MeteorToysDict.get('Mongol') === undefined) {
        // Note: this returns the actual mongo collection name
        var collections = _.map(Mongo.Collection.getAll(), function (collection) {
        return collection.name;
      });

      var defaults = {
        'collections': collections,
      };

      MeteorToysDict.set("Mongol", defaults);

    }
  },
  'hideCollection': function (collectionName) {

    var MongolConfig = MeteorToysDict.get("Mongol"),
        collections  = MongolConfig.collections;

    collections = _.without(collections, collectionName);
    MongolConfig.collections = collections;
    MeteorToysDict.set("Mongol", MongolConfig);
    
  },
  'showCollection': function (collectionName) {
    // In case a collection does not get detected, like a local one
    var MongolConfig = MeteorToysDict.get("Mongol"),
        collections  = MongolConfig.collections;

    collections.push(collectionName);
    
    MeteorToysDict.set("Mongol", MongolConfig);
  },
  'hideVelocity': function () {
    this.hideCollection('velocityTestFiles');
    this.hideCollection('velocityFixtureFiles');
    this.hideCollection('velocityTestReports');
    this.hideCollection('velocityAggregateReports');
    this.hideCollection('velocityLogs');
    this.hideCollection('velocityMirrors');
    this.hideCollection('velocityOptions');
  },
  'hideMeteorToys': function () {
    this.hideCollection("MeteorToys.Impersonate");
    this.hideCollection("MeteorToys.JetSetter");
    this.hideCollection("MeteorToys.Mongol");
    this.hideCollection("MeteorToys.AutoPub");
    this.hideCollection("MeteorToys.Email");
    this.hideCollection("MeteorToys.Result");
    this.hideCollection("MeteorToys.Throttle");
  },
  'hideMeteor': function () {
    this.hideCollection("meteor_accounts_loginServiceConfiguration")
    this.hideCollection("meteor_autoupdate_clientVersions")
  },
  'Collection': function (collectionName) {

    // Go through a variety of means of trying to return the correct collection
    return Mongo.Collection.get(collectionName)
      // This should automatically match all collections by default
      // including namespaced collections

    || ((Meteor.isServer) ? eval(collectionName) : Meteor._get.apply(null,[window].concat(collectionName.split('.'))))
    // For user defined collection names
    // in the form of Meteor's Mongo.Collection names as strings

    || ((Meteor.isServer) ? eval(firstToUpper(collectionName)) : Meteor._get.apply(null,[window].concat(firstToUpper(collectionName).split('.'))))
    // For user defined collections where the user has typical upper-case collection names
    // but they've put actual mongodb collection names into the Mongol config instead of Meteor's Mongo.Collection names as strings

    || null;
    // If the user has gone for unconventional casing of collection names,
    // they'll have to get them right (i.e. Meteor's Mongo.Collection names as string) in the Mongol config manually

    // Changes the first character of a string to upper case

    function firstToUpper(text) {

      return text.charAt(0).toUpperCase() + text.substr(1);

    }
  },
  'insertDoc': function (MongolCollection, documentData) {

    check(MongolCollection, Match.Any);
    check(documentData, Match.Any);

    if (!!Package['aldeed:simple-schema'] && !!Package['aldeed:collection2'] && _.isFunction(MongolCollection.simpleSchema) && MongolCollection._c2) {
      // This is to nullify the effects of SimpleSchema/Collection2
      newId = MongolCollection.insert(documentData, {
        filter: false,
        autoConvert: false,
        removeEmptyStrings: false,
        validate: false
      });
    }
    else {
      newId = MongolCollection.insert(documentData);
    }
    return newId;
  }
}



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/row_header/template.header.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("Mongol_header");
Template["Mongol_header"] = new Template("Template.Mongol_header", (function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return {
      name: Spacebars.call("mongol_618")
    };
  }, function() {
    return Spacebars.include(view.lookupTemplate("Mongol_Component"), function() {
      return [ "\n\n    ", HTML.STRONG("Mongol"), HTML.BR(), "\n    ", HTML.DIV({
        class: "Mongol_contentView"
      }, "\n    ", HTML.Comment("  "), "\n      ", HTML.DIV({
        class: "Mongol_docMenu",
        style: "text-indent: 8px"
      }, "\n        In-App MongoDB Editor\n      "), "\n      ", HTML.DIV({
        class: "Mongol_documentViewer "
      }, "\n", HTML.PRE({
        class: "MeteorToys-off"
      }, "{ \n  ", HTML.SPAN({
        class: "MeteorToys_key"
      }, '"created_by"'), ': "', HTML.A({
        href: "http://maxsavin.com"
      }, "Max Savin"), '",\n  ', HTML.SPAN({
        class: "MeteorToys_key"
      }, '"docs_at"'), ':    "', HTML.A({
        href: "https://meteor.toys"
      }, "Meteor Toys"), '",\n  ', HTML.SPAN({
        class: "MeteorToys_key"
      }, '"license"'), ':    "', HTML.A({
        href: "https://github.com/MeteorToys/allthings/blob/master/LICENSE.md"
      }, "MT License"), '",\n}\n'), "\n      "), "\n    ", HTML.Comment("  "), "\n    "), "\n\n  " ];
    });
  });
}));

Template.__checkName("Mongol_header_pro");
Template["Mongol_header_pro"] = new Template("Template.Mongol_header_pro", (function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return {
      name: Spacebars.call("cmongol_618")
    };
  }, function() {
    return Spacebars.include(view.lookupTemplate("Mongol_Component"), function() {
      return [ "\n    ", HTML.STRONG("Mongol Pro"), HTML.BR(), "\n    ", HTML.DIV({
        class: "Mongol_contentView"
      }, "\n      ", HTML.Comment("  "), "\n      ", HTML.DIV({
        class: "Mongol_docMenu",
        style: "text-indent: 8px"
      }, "\n        Reset a Collection\n      "), "\n      ", HTML.DIV({
        class: "Mongol_documentViewer ",
        style: "padding-top: 0px"
      }, "\n        ", HTML.Comment(' <div class="MeteorToys_row Mongol_Impersonation MeteorToys_row_hoverable" style="margin-top: 0px">\n          Reset All Collections\n        </div> '), "\n        ", HTML.DIV({
        class: "MeteorToys_row Mongol_All MeteorToys_row_hoverable",
        style: "margin-top: 0px; line-height: 20px"
      }, "\n          All Collections + localStorage\n        "), "\n        ", HTML.DIV({
        class: "MeteorToys_row Mongol_MeteorToys MeteorToys_row_hoverable",
        style: "margin-top: 0px; line-height: 20px"
      }, "\n          Meteor Toys\n        "), "\n        ", HTML.DIV({
        class: "MeteorToys_row Mongol_Impersonation MeteorToys_row_hoverable",
        style: "margin-top: 0px; line-height: 20px"
      }, "\n          Authenticate Toy\n        "), "\n        ", Blaze.Each(function() {
        return Spacebars.call(view.lookup("collection"));
      }, function() {
        return [ "\n          ", Blaze.If(function() {
          return Spacebars.call(view.lookup("."));
        }, function() {
          return [ "\n            ", HTML.DIV({
            class: "MeteorToys_row MeteorToys_row_reset MeteorToys_row_hoverable",
            style: "margin-top: 0px; line-height: 20px"
          }, "\n              ", Blaze.View("lookup:.", function() {
            return Spacebars.mustache(view.lookup("."));
          }), " \n            "), "\n          " ];
        }), "\n        " ];
      }), "\n      "), "\n    "), "\n  " ];
    });
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/row_header/header.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.Mongol_header_pro.events({
  'click .MeteorToys_row_reset': function () {
    self = String(this);
    if (confirm('This will permanently remove all the documents in ' + self  + '.')) {
      Meteor.call('Mongol_resetCollection', self, function (e, r) {
        if (e) {
          alert("Sorry, there was an error removing " + self + '.')
        }
      })
    }
  },
  'click .MeteorToys_row_reset_all': function () {
    // self = String(this);
    if (confirm('This will permanently remove all the documents in your collections.')) {
      Meteor.call('Mongol_resetCollections', self, function (e, r) {
        if (e) {
          alert("Sorry, there was an error removing your collections.");
        }
      })
    }
  },
  'click .Mongol_Impersonation': function () {
    self = "MeteorToys.Impersonate";
    if (confirm('This will reset your Authentication recents list')) {
      Meteor.call('Mongol_resetCollection', self, function (e, r) {
        if (e) {
          alert("Sorry, there was an error removing " + self + '.')
        }
      })
    }
  },
  'click .Mongol_MeteorToys': function (){
    if (confirm('This will reset all your Meteor Toys data.')) {
      Meteor.call('Mongol_resetMeteorToys', self, function (e, r) {
        if (e) {
          alert("Sorry, there was an error removing " + self + '.')
        }
      })
    }
  },
  'click .Mongol_All': function () {
    if (confirm('This will reset all your Meteor collections and localStorage.')) {
      Meteor.call('Mongol_resetAll', function (e, r) {
        if (e) {
          alert("Sorry, there was an error removing " + self + '.')
        }
        if (r) {
          MeteorToys.clear();
          window.location.reload()
        }
      })
    }
  }
});

Template.Mongol_header_pro.helpers({
  collection: function () {
    var x = MeteorToysDict.get("Mongol");
    return x.collections;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/doc_editor/template.docViewer.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("Mongol_docViewer");
Template["Mongol_docViewer"] = new Template("Template.Mongol_docViewer", (function() {
  var view = this;
  return Blaze.If(function() {
    return Spacebars.call(view.lookup("notEmpty"));
  }, function() {
    return [ "\n    ", Spacebars.include(view.lookupTemplate("Mongol_docControls")), "\n    ", Spacebars.With(function() {
      return Spacebars.call(view.lookup("activeDocument"));
    }, function() {
      return [ "\n      ", Blaze.If(function() {
        return Spacebars.call(view.lookup("editStyle"));
      }, function() {
        return [ "\n        ", HTML.DIV({
          class: function() {
            return [ "Mongol_documentViewer ", Spacebars.mustache(view.lookup("editStyle")) ];
          },
          id: function() {
            return [ "MongolDoc_", Spacebars.mustache(view.lookup("..")) ];
          },
          contenteditable: function() {
            return Spacebars.mustache(view.lookup("editContent"));
          }
        }, "  \n          ", HTML.PRE({
          spellcheck: "false"
        }, Blaze.View("lookup:normalJSON", function() {
          return Spacebars.makeRaw(Spacebars.mustache(view.lookup("normalJSON")));
        })), "\n        "), "\n      " ];
      }, function() {
        return [ "\n        ", HTML.DIV({
          class: function() {
            return [ "Mongol_documentViewer ", Spacebars.mustache(view.lookup("editStyle")) ];
          },
          id: function() {
            return [ "MongolDoc_", Spacebars.mustache(view.lookup("..")) ];
          },
          contenteditable: function() {
            return Spacebars.mustache(view.lookup("editContent"));
          }
        }, "  \n            ", HTML.PRE({
          spellcheck: "false"
        }, Blaze.View("lookup:editableJSON", function() {
          return Spacebars.makeRaw(Spacebars.mustache(view.lookup("editableJSON")));
        })), "\n        "), "\n      " ];
      }), "\n    " ];
    }, function() {
      return [ "\n      ", HTML.DIV({
        class: "Mongol_documentViewer",
        id: function() {
          return [ "MongolDoc_", Spacebars.mustache(view.lookup(".")) ];
        }
      }, "  \n        ", HTML.PRE("No document found"), "\n      "), "\n    " ];
    }), "\n  " ];
  }, function() {
    return [ "\n    ", Spacebars.include(view.lookupTemplate("Mongol_docInsert")), "\n  " ];
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/doc_editor/docViewer.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.Mongol_docViewer.helpers({
  activeDocument: function () {
    var collectionName = String(this);
    var currentCollection = Mongol.Collection(collectionName);
    var documents = currentCollection.find({}, {transform: null}).fetch();
    var sessionKey = "Mongol_" + String(this);
    var docNumber = MeteorToysDict.get(sessionKey);
    var docCurrent = documents[docNumber];
    return docCurrent;
  },
  editableJSON: function () {
    var docCurrent = this;
    var json_output = JSON.stringify(docCurrent, null, 2), colorize;

    if (!(json_output === undefined)) {
      colorize = Package["meteortoys:toykit"].MeteorToys_JSON.colorizeEditable(json_output);
    } else {
      colorize = json_output;
    }

    return colorize;
  },
  normalJSON: function () {
    var docCurrent  = this,
        json_output = JSON.stringify(docCurrent, null, 2);

    return json_output;
  },
  editContent: function () {
    var editMode = MeteorToysDict.get("Mongol_editMode");

    if (editMode) {
      return "true";
    }
  },
  editStyle: function () {
    var editMode = MeteorToysDict.get("Mongol_editMode");

    if (editMode) {
      return "Mongol_editable";
    }
  },
  notEmpty: function () {
    var documentCount = Mongol.Collection(String(this)) && Mongol.Collection(String(this)).find().count() || 0;
    
    if (documentCount >= 1) {
      return true;
    }
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/doc_editor/inline.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// There are four actions that the inline editor leverages:
//  - focus in         - set editing state
//  - focus out        - save update
//  - enter key        - focus out
//  - escape key       - cancel

// Loop for empty keys, if present remove it 
// toggle true and false

MongolEditingStatus = false; 

Mongol_InlineEditor = {
  createBackup: function () {
    current = MeteorToysDict.get("Mongol_currentCollection");
    content = $("#MongolDoc_" + current).html();
    MeteorToysDict.set("Mongol_backup", content);
  },
  restoreBackup: function () {
    // Mongol_InlineEditor.removeTextSelection
    current = MeteorToysDict.get("Mongol_currentCollection");
    content = MeteorToysDict.get("Mongol_backup");
    $("#MongolDoc_" + current).html(content);
  },
  clearBackup: function () {
    MeteorToysDict.set("Mongol_backup", null);
  },
  getData: function () {
    var target = MeteorToysDict.get("Mongol_currentCollection"),
        data   = $("#Mongol_c" + target + " pre").text();

    var newObject = null;

    try { 
      var reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
      var dateParser = function (key, value) {
        if (_.isString(value)) {
          var a = reISO.exec(value);
          if (a) {
            return new Date(value);
          }
        }
        return value;
      }
      newObject = JSON.parse(data, dateParser);
    }
    catch (error) {
      Mongol_InlineEditor.restoreBackup();
    }

    return newObject;
  },
  updateData: function () {
    
    var collectionName = (MeteorToysDict.equals("Mongol_currentCollection", "account_618")) ? "users" : MeteorToysDict.get("Mongol_currentCollection"),
      oldObject,
      newObject,
      newData;
    if (MeteorToysDict.equals("Mongol_currentCollection", "account_618")) {
      newData = Mongol.getDocumentUpdate("account_618");
      // var newObject = Mongol.parse(newData);
      newObject = Mongol_InlineEditor.getData();
      oldObject = Meteor.user();
      // console.log(targetCollection);
      // console.log(newData);
      // console.log(newObject);
    } else {
      var sessionKey = "Mongol_" + collectionName;
      DocumentPosition = MeteorToysDict.get(sessionKey),
      CurrentCollection = Mongol.Collection(collectionName).find({}, {transform: null}).fetch();
      newData   = Mongol.getDocumentUpdate(collectionName);
      // var newObject = Mongol.parse(newData);
      newObject = Mongol_InlineEditor.getData();
      oldObject = CurrentCollection[DocumentPosition];
    }

    // 
    delete newObject[""];
    delete newObject[" "];

    if (newObject) {
      Meteor.call("Mongol_update", collectionName, newObject, Mongol.validateDocument(oldObject), function(error, result) {
        if (!error) {
          // MeteorToysDict.set('Mongol_editMode', null);
          // Mongol_InlineEditor.removeTextSelection();
        } else {
          Mongol.error('update');
          Mongol_InlineEditor.restoreBackup();
        }
      });
    }
  },
  bindHotkeys: function () {
    $('.MeteorToys_inline').keydown(function(event) {
      if (event.keyCode == 10 || event.keyCode == 13) {
        event.preventDefault();
        $('.MeteorToys_inline:focus').blur();
      }

      if (event.keyCode == 27) {
        Mongol_InlineEditor.restoreBackup();
        $('.MeteorToys_inline:focus').blur();
      }
    });
  },
  removeTextSelection: function () {
    if (window.getSelection) {
      if (window.getSelection().empty) {  // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {  // Firefox
        window.getSelection().removeAllRanges();
      }
    } else if (document.selection) {  // IE?
      document.selection.empty();
    }
  }
}

Template.Mongol_docViewer.events({
  'dblclick .Mongol_documentViewer': function () {
    MeteorToysDict.set("Mongol_editMode", true);
  },
  'focusout .MeteorToys_inline': function () {
    a = Mongol_InlineEditor.updateData();
    b = Mongol_InlineEditor.removeTextSelection();
    // console.log("focusedout");
  },
  'focusin .MeteorToys_inline': function () {
    a = Mongol_InlineEditor.bindHotkeys();
    b = Mongol_InlineEditor.createBackup();
    // console.log("focusedin");
  },
  'dblclick .MeteorToys_inline': function (e,t) {
    e.stopPropagation();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/row_account/template.account.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("Mongol_account");
Template["Mongol_account"] = new Template("Template.Mongol_account", (function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return {
      name: Spacebars.call("account_618")
    };
  }, function() {
    return Spacebars.include(view.lookupTemplate("Mongol_Component"), function() {
      return [ "\n\n\t\t\t", HTML.Comment(" Display sign in status "), "\n\t\t\t", Blaze.If(function() {
        return Spacebars.call(view.lookup("currentUser"));
      }, function() {
        return [ "\n\t\t\t\t", HTML.DIV({
          class: "Mongol_account_state MeteorToys-background-green"
        }), "\n\t\t\t" ];
      }, function() {
        return [ "\n\t\t\t\t", HTML.DIV({
          class: "Mongol_account_state MeteorToys-background-red"
        }), "\n\t\t\t" ];
      }), "\n\n\t\t\t", HTML.Comment(" Row Name "), "\n\t\t\t", HTML.DIV({
        class: "Mongol_icon Mongol_icon_user"
      }), "\n\t\t\tAccount\n     \n        ", HTML.DIV({
        class: "Mongol_contentView"
      }, "\n\n\t\t\t", HTML.Comment(" Document Viewer "), "\n\t\t\t", Blaze.If(function() {
        return Spacebars.call(view.lookup("currentUser"));
      }, function() {
        return [ "\n\t\t\t\t", Spacebars.include(view.lookupTemplate("Mongol_accountViewer")), "\n\t\t\t" ];
      }, function() {
        return [ "\n\t\t\t\t", Spacebars.include(view.lookupTemplate("Mongol_accountViewer_notSignedIn")), "\n\t\t\t" ];
      }), "\n\n\t\t"), "\n\n\t" ];
    });
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/row_account/account.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/row_account/template.accountViewer.js                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("Mongol_accountViewer");
Template["Mongol_accountViewer"] = new Template("Template.Mongol_accountViewer", (function() {
  var view = this;
  return [ Spacebars.include(view.lookupTemplate("Mongol_docControls")), "\n\n\t", HTML.DIV({
    class: function() {
      return [ "Mongol_documentViewer ", Spacebars.mustache(view.lookup("editStyle")) ];
    },
    id: "MongolDoc_account_618",
    contenteditable: function() {
      return Spacebars.mustache(view.lookup("editContent"));
    }
  }, "\t\n\t\t", HTML.PRE(Blaze.View("lookup:accountData", function() {
    return Spacebars.makeRaw(Spacebars.mustache(view.lookup("accountData")));
  })), "\n\t") ];
}));

Template.__checkName("Mongol_accountViewer_notSignedIn");
Template["Mongol_accountViewer_notSignedIn"] = new Template("Template.Mongol_accountViewer_notSignedIn", (function() {
  var view = this;
  return HTML.Raw('<div class="Mongol_docMenu">\n\t\t\t<div class="Mongol_docBar1" style="text-indent: 8px">\n\t\t\t\tNot Signed In\n\t\t\t</div>\n\t\t</div>\n\t<div class="Mongol_documentViewer">\t\n\t\t<!-- Nothing -->\n\t</div>');
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/row_account/accountViewer.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.Mongol_accountViewer.helpers({
  accountData: function () {
    
    var docCurrent  = Meteor.user(),
        json_output = JSON.stringify(docCurrent, null, 2);

        if (MeteorToysDict.get("Mongol_editMode")) {
          colorized = json_output
        } else {
          colorized = Package["meteortoys:toykit"].MeteorToys.colorizeEditable(json_output);
        }
    return colorized;

  },
  editContent: function () {

    var editMode = MeteorToysDict.get("Mongol_editMode");

    if (editMode) {
      return "true";
    }

  },
  editStyle: function () {

    var editMode = MeteorToysDict.get("Mongol_editMode");

    if (editMode) {
      return "Mongol_editable";
    }

  },
  usercode: function () {
    
    return Meteor.userId();

  },
});


Template.Mongol_accountViewer.events({
    'dblclick .Mongol_documentViewer': function () {
    MeteorToysDict.set("Mongol_editMode", true);
  },
  'focusout .MeteorToys_inline': function () {
    a = Mongol_InlineEditor.updateData();
    b = Mongol_InlineEditor.removeTextSelection();
    // console.log("focusedout");
  },
  'focusin .MeteorToys_inline': function () {
    a = Mongol_InlineEditor.bindHotkeys();
    b = Mongol_InlineEditor.createBackup();
    // console.log("focusedin");
  },
  'dblclick .MeteorToys_inline': function (e,t) {
    e.stopPropagation();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/row_collection_notFound/template.notFound.js                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("Mongol_collection_notFound");
Template["Mongol_collection_notFound"] = new Template("Template.Mongol_collection_notFound", (function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return {
      name: Spacebars.call("no_collections")
    };
  }, function() {
    return Spacebars.include(view.lookupTemplate("Mongol_Component"), function() {
      return [ "\n\n    ", HTML.DIV({
        class: "Mongol_icon Mongol_icon_collection"
      }), "No Collections", HTML.BR(), "\n    ", HTML.DIV({
        class: "Mongol_contentView"
      }, "\n    ", HTML.Comment("  "), "\n      ", HTML.DIV({
        class: "Mongol_docMenu",
        style: "text-indent: 8px"
      }, "\n        None Detected\n      "), "\n      ", HTML.DIV({
        class: "Mongol_documentViewer "
      }, "\n\n        If you think this is an error,", HTML.BR(), "\n        please report it on ", HTML.A({
        href: "https://github.com/msavin/Mongol",
        style: "color: #cc0000"
      }, "GitHub"), ".\n        \n      "), "\n    ", HTML.Comment("  "), "\n    "), "\n\n  " ];
    });
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/row_collection_notFound/notFound.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/row_collection/template.collections.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("Mongol_collection");
Template["Mongol_collection"] = new Template("Template.Mongol_collection", (function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return {
      name: Spacebars.call(view.lookup("."))
    };
  }, function() {
    return Spacebars.include(view.lookupTemplate("Mongol_Component"), function() {
      return [ "\n\n\t\t", HTML.Comment(" Collection Count "), "\n\t\t", HTML.DIV({
        class: "Mongol_counter"
      }, "\n\t\t\t", Blaze.If(function() {
        return Spacebars.call(view.lookup("collectionCount"));
      }, function() {
        return [ "\n\t\t\t", HTML.SPAN({
          class: "MongolHide"
        }, Blaze.View("lookup:currentPosition", function() {
          return Spacebars.mustache(view.lookup("currentPosition"));
        }), "/") ];
      }), Blaze.View("lookup:collectionCount", function() {
        return Spacebars.mustache(view.lookup("collectionCount"));
      }), "\n\t\t"), "\n\n\t\t", HTML.Comment(" Collection Name "), "\n\t\t", HTML.DIV({
        class: "Mongol_row_name"
      }, HTML.DIV({
        class: "Mongol_icon Mongol_icon_collection"
      }), Blaze.View("lookup:.", function() {
        return Spacebars.mustache(view.lookup("."));
      }), Blaze.If(function() {
        return Spacebars.call(view.lookup("xf"));
      }, function() {
        return Blaze.View("lookup:xf", function() {
          return Spacebars.mustache(view.lookup("xf"));
        });
      })), "\n    \t    \n\t\t", HTML.Comment(" Document Viewer "), "\n\t\t", HTML.DIV({
        class: "Mongol_contentView"
      }, "\n\t\t\t", Spacebars.include(view.lookupTemplate("Mongol_docViewer")), "\n\t\t"), "\n\t\t\n\t" ];
    });
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/row_collection/collections.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.Mongol_collection.events({
  'click': function () {

    var targetCollection = String(this),
        sessionKey       = "Mongol_" + targetCollection;

    if (MeteorToysDict.equals("Mongol_currentCollection", targetCollection)) {
      
      // do nothing
    
    } else {
      
      // If the collection doesn't have an index key set,
      // start it from the first document
      
      if (!MeteorToysDict.get(String(sessionKey))) {
        MeteorToysDict.set(String(sessionKey), 0);
      }
      
    }

  },
});

Template.Mongol_collection.helpers({
  collectionCount: function () {

    var collectionName = String(this);
    var collectionVar = Mongol.Collection(collectionName);

    var count = collectionVar && collectionVar.find().count() || 0;

    return count;

  },
  currentPosition: function () {

    var targetCollection = String(this);
    var sessionKey = "Mongol_" + targetCollection;

    var current = MeteorToysDict.get(sessionKey);
    var count = current + 1;

    return count;

  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/row_trash/template.main.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("Mongol_trash");
Template["Mongol_trash"] = new Template("Template.Mongol_trash", (function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return {
      name: Spacebars.call("trash")
    };
  }, function() {
    return Spacebars.include(view.lookupTemplate("Mongol_Component"), function() {
      return [ "\n\t  \n\t\t", HTML.DIV({
        class: "Mongol_counter"
      }, "\n\t\t\t", Blaze.If(function() {
        return Spacebars.call(view.lookup("collectionCount"));
      }, function() {
        return [ "\n\t\t\t\t", HTML.SPAN({
          class: "MongolHide"
        }, Blaze.View("lookup:currentPosition", function() {
          return Spacebars.mustache(view.lookup("currentPosition"));
        }), "/") ];
      }), Blaze.View("lookup:collectionCount", function() {
        return Spacebars.mustache(view.lookup("collectionCount"));
      }), "\n\t\t"), "\n\n\t\t", HTML.DIV({
        class: "Mongol_row_name"
      }, HTML.DIV({
        class: "Mongol_icon Mongol_icon_trash"
      }), "Trash"), "\n\n\t\t", Blaze.If(function() {
        return Spacebars.call(view.lookup("collectionCount"));
      }, function() {
        return [ "\n\t\t\t", Spacebars.include(view.lookupTemplate("Mongol_trash_viewer")), "\n\t\t" ];
      }, function() {
        return [ "\n\t\t\t", Spacebars.include(view.lookupTemplate("Mongol_trash_empty")), "\n\t\t" ];
      }), "\n\n\t" ];
    });
  });
}));

Template.__checkName("Mongol_trash_menu");
Template["Mongol_trash_menu"] = new Template("Template.Mongol_trash_menu", (function() {
  var view = this;
  return HTML.DIV({
    class: "Mongol_docMenu"
  }, HTML.Raw('\n\t\t<div class="Mongol_m_edit MeteorToys_action">Restore</div>\n\t\t'), HTML.DIV({
    class: function() {
      return [ Spacebars.mustache(view.lookup("disable_right")), " Mongol_m_right MeteorToys_action" ];
    }
  }, HTML.Raw("&rsaquo;")), "\n\t\t", HTML.DIV({
    class: function() {
      return [ Spacebars.mustache(view.lookup("disable_left")), " Mongol_m_left MeteorToys_action" ];
    }
  }, HTML.Raw("&lsaquo;")), "\n\t");
}));

Template.__checkName("Mongol_trash_viewer");
Template["Mongol_trash_viewer"] = new Template("Template.Mongol_trash_viewer", (function() {
  var view = this;
  return HTML.DIV({
    class: "Mongol_contentView"
  }, "\n\t\t", Spacebars.include(view.lookupTemplate("Mongol_trash_menu")), "\n\t    ", HTML.DIV({
    class: "Mongol_documentViewer"
  }, "\n", HTML.PRE("From ", Blaze.View("lookup:collectionName", function() {
    return Spacebars.mustache(view.lookup("collectionName"));
  }), " ", Blaze.View("lookup:currentDocument", function() {
    return Spacebars.makeRaw(Spacebars.mustache(view.lookup("currentDocument")));
  })), "\n\t    "), "\n\t");
}));

Template.__checkName("Mongol_trash_empty");
Template["Mongol_trash_empty"] = new Template("Template.Mongol_trash_empty", (function() {
  var view = this;
  return HTML.Raw('<div class="Mongol_contentView">\n\t\t<div class="Mongol_docMenu" style="text-indent: 8px">Empty</div>\n\t\t<div class="Mongol_documentViewer">\n<pre>When you remove documents,\nthey will appear here.</pre></div>\n\t</div>');
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/row_trash/main.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _0x92fe=["\x4D\x6F\x6E\x67\x6F\x6C\x5F\x54\x72\x61\x73\x68\x5F\x43\x6F\x75\x6E\x74","\x67\x65\x74","\x73\x65\x74","\x65\x76\x65\x6E\x74\x73","\x4D\x6F\x6E\x67\x6F\x6C\x5F\x74\x72\x61\x73\x68","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x2E\x4D\x6F\x6E\x67\x6F\x6C","\x4D\x6F\x6E\x67\x6F\x6C","\x6D\x73\x61\x76\x69\x6E\x3A\x6D\x6F\x6E\x67\x6F\x6C","\x63\x6F\x75\x6E\x74","\x66\x69\x6E\x64","\x54\x72\x61\x73\x68\x5F\x43\x6F\x75\x6E\x74","\x4D\x6F\x6E\x67\x6F\x6C\x5F","\x68\x65\x6C\x70\x65\x72\x73","\x66\x65\x74\x63\x68","\x4D\x6F\x6E\x67\x6F\x6C\x5F\x6F\x72\x69\x67\x69\x6E","\x4D\x6F\x6E\x67\x6F\x6C\x5F\x64\x61\x74\x65","\x73\x74\x72\x69\x6E\x67\x69\x66\x79","\x63\x6F\x6C\x6F\x72\x69\x7A\x65","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73","\x6D\x65\x74\x65\x6F\x72\x74\x6F\x79\x73\x3A\x74\x6F\x79\x6B\x69\x74","\x4D\x6F\x6E\x67\x6F\x6C\x5F\x74\x72\x61\x73\x68\x5F\x76\x69\x65\x77\x65\x72","\x5F\x69\x64","\x4D\x6F\x6E\x67\x6F\x6C\x5F\x69\x6E\x73\x65\x72\x74","\x54\x68\x65\x72\x65\x20\x77\x61\x73\x20\x61\x6E\x20\x65\x72\x72\x6F\x72\x20\x72\x65\x73\x74\x6F\x72\x69\x6E\x67\x20\x79\x6F\x75\x72\x20\x64\x6F\x63\x75\x6D\x65\x6E\x74\x2E","\x63\x61\x6C\x6C","\x4D\x6F\x6E\x67\x6F\x6C\x5F\x72\x65\x6D\x6F\x76\x65","\x54\x68\x65\x72\x65\x20\x77\x61\x73\x20\x61\x6E\x20\x65\x72\x72\x6F\x72\x20\x72\x65\x6D\x6F\x76\x69\x6E\x67\x20\x64\x6F\x63\x75\x6D\x65\x6E\x74\x20\x66\x72\x6F\x6D\x20\x74\x72\x61\x73\x68\x2C","\x63\x6C\x69\x63\x6B","\x2E\x4D\x6F\x6E\x67\x6F\x6C\x5F\x6D\x5F\x6C\x65\x66\x74","\x4D\x6F\x6E\x67\x6F\x6C\x5F\x6D\x5F\x64\x69\x73\x61\x62\x6C\x65\x64","\x68\x61\x73\x43\x6C\x61\x73\x73","\x2E\x4D\x6F\x6E\x67\x6F\x6C\x5F\x6D\x5F\x72\x69\x67\x68\x74","\x4D\x6F\x6E\x67\x6F\x6C\x5F\x74\x72\x61\x73\x68\x5F\x6D\x65\x6E\x75"];Template[_0x92fe[4]][_0x92fe[3]]({"\x63\x6C\x69\x63\x6B":function(){if(!MeteorToysDict[_0x92fe[1]](_0x92fe[0])){MeteorToysDict[_0x92fe[2]](_0x92fe[0],0)}}});Template[_0x92fe[4]][_0x92fe[12]]({collectionCount:function(){var _0x1e90x1=_0x92fe[5];var _0x1e90x2=Package[_0x92fe[7]][_0x92fe[6]].Collection(_0x1e90x1);var _0x1e90x3=_0x1e90x2&&_0x1e90x2[_0x92fe[9]]()[_0x92fe[8]]()||0;return _0x1e90x3},currentPosition:function(){var _0x1e90x4=_0x92fe[10];var _0x1e90x5=_0x92fe[11]+_0x1e90x4;var _0x1e90x6=MeteorToysDict[_0x92fe[1]](_0x1e90x5);var _0x1e90x3=_0x1e90x6+1;return _0x1e90x3}});Template[_0x92fe[20]][_0x92fe[12]]({currentDocument:function(){var _0x1e90x1=_0x92fe[5],_0x1e90x7=MeteorToysDict[_0x92fe[1]](_0x92fe[0]),_0x1e90x8=Package[_0x92fe[7]][_0x92fe[6]].Collection(_0x92fe[5])[_0x92fe[9]]()[_0x92fe[13]]()[_0x1e90x7];if(_0x1e90x8){delete _0x1e90x8[_0x92fe[14]];delete _0x1e90x8[_0x92fe[15]];var _0x1e90x9=Package[_0x92fe[19]][_0x92fe[18]][_0x92fe[17]](JSON[_0x92fe[16]](_0x1e90x8,undefined,2));return _0x1e90x9}},collectionName:function(){var _0x1e90x1=_0x92fe[5],_0x1e90x7=MeteorToysDict[_0x92fe[1]](_0x92fe[0]),_0x1e90x8=Package[_0x92fe[7]][_0x92fe[6]].Collection(_0x92fe[5])[_0x92fe[9]]()[_0x92fe[13]]()[_0x1e90x7];if(_0x1e90x8){return _0x1e90x8[_0x92fe[14]]}}});Template[_0x92fe[32]][_0x92fe[3]]({"\x63\x6C\x69\x63\x6B\x20\x2E\x4D\x6F\x6E\x67\x6F\x6C\x5F\x6D\x5F\x65\x64\x69\x74":function(){var _0x1e90x1=_0x92fe[5],_0x1e90x7=MeteorToysDict[_0x92fe[1]](_0x92fe[0]),_0x1e90x8=Package[_0x92fe[7]][_0x92fe[6]].Collection(_0x92fe[5])[_0x92fe[9]]()[_0x92fe[13]]()[_0x1e90x7];var _0x1e90x4=_0x1e90x8[_0x92fe[14]];var _0x1e90xa=_0x1e90x8[_0x92fe[21]];delete _0x1e90x8[_0x92fe[14]];delete _0x1e90x8[_0x92fe[15]];Meteor[_0x92fe[24]](_0x92fe[22],_0x1e90x4,_0x1e90x8,function(_0x1e90xb,_0x1e90xc){if(_0x1e90xb){alert(_0x92fe[23])}});Meteor[_0x92fe[24]](_0x92fe[25],_0x92fe[5],_0x1e90xa,true,function(_0x1e90xb,_0x1e90xc){if(_0x1e90xb){alert(_0x92fe[26])}});var _0x1e90x5=_0x92fe[0];var _0x1e90xd=MeteorToysDict[_0x92fe[1]](_0x1e90x5);var _0x1e90x2=Package[_0x92fe[7]][_0x92fe[6]].Collection(_0x92fe[5]);var _0x1e90xe=_0x1e90x2[_0x92fe[9]]()[_0x92fe[8]]()-1;if(_0x1e90xe===_0x1e90xd){$(_0x92fe[28])[_0x92fe[27]]()}},"\x63\x6C\x69\x63\x6B\x20\x2E\x4D\x6F\x6E\x67\x6F\x6C\x5F\x6D\x5F\x72\x69\x67\x68\x74":function(){if(!$(_0x92fe[31])[_0x92fe[30]](_0x92fe[29])){var _0x1e90x5=_0x92fe[0];var _0x1e90xd=MeteorToysDict[_0x92fe[1]](_0x1e90x5);var _0x1e90x2=Package[_0x92fe[7]][_0x92fe[6]].Collection(_0x92fe[5]);var _0x1e90xe=_0x1e90x2[_0x92fe[9]]()[_0x92fe[8]]()-1;if(_0x1e90xd>_0x1e90xe){MeteorToysDict[_0x92fe[2]](_0x1e90x5,0);return};if(_0x1e90xe===_0x1e90xd){MeteorToysDict[_0x92fe[2]](_0x1e90x5,0)}else {var _0x1e90xf=MeteorToysDict[_0x92fe[1]](_0x1e90x5)+1;MeteorToysDict[_0x92fe[2]](_0x1e90x5,_0x1e90xf)}}},"\x63\x6C\x69\x63\x6B\x20\x2E\x4D\x6F\x6E\x67\x6F\x6C\x5F\x6D\x5F\x6C\x65\x66\x74":function(){if(!$(_0x92fe[28])[_0x92fe[30]](_0x92fe[29])){var _0x1e90x5=_0x92fe[0];var _0x1e90xd=MeteorToysDict[_0x92fe[1]](_0x1e90x5);var _0x1e90x2=Package[_0x92fe[7]][_0x92fe[6]].Collection(_0x92fe[5]);var _0x1e90xe=_0x1e90x2[_0x92fe[9]]()[_0x92fe[8]]()-1;if(_0x1e90xd>_0x1e90xe){MeteorToysDict[_0x92fe[2]](_0x1e90x5,_0x1e90xe);return};if(MeteorToysDict[_0x92fe[1]](_0x1e90x5)===0){MeteorToysDict[_0x92fe[2]](_0x1e90x5,_0x1e90xe)}else {var _0x1e90xf=MeteorToysDict[_0x92fe[1]](_0x1e90x5)-1;MeteorToysDict[_0x92fe[2]](_0x1e90x5,_0x1e90xf)}}}})
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/row_subscriptions/template.main.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("Mongol_subscriptions");
Template["Mongol_subscriptions"] = new Template("Template.Mongol_subscriptions", (function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return {
      name: Spacebars.call("subscriptions_618")
    };
  }, function() {
    return Spacebars.include(view.lookupTemplate("Mongol_Component"), function() {
      return [ "\n\n\t\t\n        ", HTML.DIV({
        class: "Mongol_toggle_selected_collection"
      }, "\n\t\t\t", HTML.Comment(" Name "), "\n\t\t\t", HTML.DIV({
        class: "Mongol_icon Mongol_icon_sub"
      }), "Subscriptions\n        "), "\n\n\t\t", HTML.DIV({
        class: "Mongol_contentView"
      }, "\n\t\t", HTML.DIV({
        class: "Mongol_docMenu",
        style: "text-indent: 8px"
      }, "\n\t\t\t", Blaze.View("lookup:subType", function() {
        return Spacebars.mustache(view.lookup("subType"));
      }), "\n\t\t"), "\n\t\t", HTML.Comment(" Document Viewer "), "\n\t\t", HTML.DIV({
        class: "Mongol_documentViewer",
        style: "Padding: 0px 7px !important"
      }, "\n\t\t\t", Blaze.Each(function() {
        return Spacebars.call(view.lookup("subscription"));
      }, function() {
        return [ "\n\t\t\t\t", HTML.DIV({
          class: "Mongol_pubsub_row"
        }, "\n\t\t\t\t\t", HTML.DIV({
          class: "Mongol_pubsub_row_toggle"
        }, HTML.CharRef({
          html: "&times;",
          str: "×"
        })), "\n\t\t\t\t\t", HTML.DIV({
          class: "Mongol_pubsub_row_name"
        }, Blaze.View("lookup:name", function() {
          return Spacebars.mustache(view.lookup("name"));
        })), "\n\t\t\t\t\tParams: ", Blaze.View("lookup:params", function() {
          return Spacebars.mustache(view.lookup("params"));
        }), " \n\t\t\t\t"), "\n\t\t\t" ];
      }, function() {
        return "\n\t\t\t\tNo subscriptions available\n\t\t\t";
      }), "\n\t\t"), "\n\t\t", HTML.Comment("  "), "\n\t"), "\n\t\t\n\n\t" ];
    });
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/row_subscriptions/main.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _0x93de=["\x6D\x65\x74\x65\x6F\x72\x74\x6F\x79\x73\x3A\x73\x75\x62","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73","\x6D\x65\x74\x65\x6F\x72\x74\x6F\x79\x73\x3A\x74\x6F\x79\x6B\x69\x74","\x72\x75\x6E\x50\x75\x62\x53\x75\x62","\x64\x65\x66\x61\x75\x6C\x74\x5F\x63\x6F\x6E\x6E\x65\x63\x74\x69\x6F\x6E","\x6F\x62\x73\x65\x72\x76\x65","\x6D\x73\x61\x76\x69\x6E\x3A\x73\x75\x62","\x6D\x73\x61\x76\x69\x6E\x3A\x6D\x6F\x6E\x67\x6F\x6C","\x5F\x73\x75\x62\x73\x63\x72\x69\x70\x74\x69\x6F\x6E\x73","\x6B\x65\x79\x73","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x2F\x50\x75\x62\x53\x75\x62","\x73\x65\x74","\x67\x65\x74","\x6E\x61\x6D\x65","\x70\x61\x72\x61\x6D\x73","\x6C\x65\x6E\x67\x74\x68","\x6E\x6F\x6E\x65","\x50\x6F\x6C\x6C\x69\x6E\x67\x20\x65\x76\x65\x72\x79\x20\x33\x20\x73\x65\x63\x6F\x6E\x64\x73","\x68\x65\x6C\x70\x65\x72\x73","\x4D\x6F\x6E\x67\x6F\x6C\x5F\x73\x75\x62\x73\x63\x72\x69\x70\x74\x69\x6F\x6E\x73","\x73\x74\x6F\x70","\x65\x76\x65\x6E\x74\x73"];if(!Package[_0x93de[0]]){MeteorToysDict=Package[_0x93de[2]][_0x93de[1]];MeteorToys_Sub={observe:function(){MeteorToys_Sub[_0x93de[3]]();thisishack=true;if(thisishack){setInterval(function(){MeteorToys_Sub[_0x93de[3]]()},3000)}else {Object[_0x93de[5]](Meteor[_0x93de[4]]._subscriptions,function(){MeteorToys_Sub[_0x93de[3]]()})}},runPubSub:function(){if(Package[_0x93de[6]]||Package[_0x93de[7]]){var _0x8721x1=Meteor[_0x93de[4]][_0x93de[8]],_0x8721x2=Object[_0x93de[9]](_0x8721x1);MeteorToysDict[_0x93de[11]](_0x93de[10],_0x8721x2)}}};MeteorToys_Sub[_0x93de[5]]()};Template[_0x93de[19]][_0x93de[18]]({subscription:function(){var _0x8721x3=MeteorToysDict[_0x93de[12]](_0x93de[10]);return _0x8721x3},name:function(){var _0x8721x4=Meteor[_0x93de[4]][_0x93de[8]][this]&&Meteor[_0x93de[4]][_0x93de[8]][this][_0x93de[13]];return _0x8721x4},params:function(){var _0x8721x5=Meteor[_0x93de[4]][_0x93de[8]][this]&&Meteor[_0x93de[4]][_0x93de[8]][this][_0x93de[14]];if(_0x8721x5&&_0x8721x5[_0x93de[15]]>0){return _0x8721x5}else {return _0x93de[16]}},subType:function(){return _0x93de[17]}});Template[_0x93de[19]][_0x93de[21]]({"\x63\x6C\x69\x63\x6B\x20\x2E\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x70\x75\x62\x73\x75\x62\x5F\x72\x6F\x77\x5F\x74\x6F\x67\x67\x6C\x65":function(){Meteor[_0x93de[4]][_0x93de[8]][this][_0x93de[20]]()}})
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/doc_insert/template.docInsert.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("Mongol_docInsert");
Template["Mongol_docInsert"] = new Template("Template.Mongol_docInsert", (function() {
  var view = this;
  return [ HTML.Raw('<div class="Mongol_docMenu">\n\t\t<div class="MeteorToys_action Mongol_docMenu_insert" style="float: right">Submit</div>\n\t\t&nbsp;Insert a Document\n\t</div>\n\n\t'), HTML.DIV({
    class: "Mongol_documentViewer ",
    id: function() {
      return [ "Mongol_", Spacebars.mustache(view.lookup(".")), "_newEntry" ];
    },
    tabindex: "-1",
    contenteditable: "true"
  }, "\t\n", HTML.Raw("<pre>{\n\n}</pre>"), "\n\n\t") ];
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/doc_insert/docInsert.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.Mongol_docInsert.events({
  'click .Mongol_docMenu_insert': function (e, t) {

    var CollectionName = String(this),
        newDataID      = "Mongol_" + String(this) + "_newEntry",
        newData        = document.getElementById(newDataID).textContent,
        newObject      = Mongol.parse(newData);

    if (newObject) {
      Meteor.call('Mongol_insert', CollectionName, newObject, function (error, result) {
        if (!error) {
          sessionKey = "Mongol_" + CollectionName;
          MeteorToysDict.set(sessionKey, 0);
          alert("Document successfully inserted.");
          t.$("#Mongol_" + CollectionName + "_newEntry").html("{<br><br>}");
        } else {
          Mongol.error("insert");
        }
      });
    }

  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/_component/template.component.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("Mongol_Component");
Template["Mongol_Component"] = new Template("Template.Mongol_Component", (function() {
  var view = this;
  return HTML.DIV({
    class: function() {
      return [ "Mongol_row ", Spacebars.mustache(view.lookup("active")) ];
    },
    id: function() {
      return [ "Mongol_c", Spacebars.mustache(view.lookup("name")) ];
    }
  }, "\n\t\t", Blaze._InOuterTemplateScope(view, function() {
    return Spacebars.include(function() {
      return Spacebars.call(view.templateContentBlock);
    });
  }), "\n\t");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/_component/component.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _0x34af=["\x4D\x6F\x6E\x67\x6F\x6C","\x63\x6C\x6F\x73\x65","\x4D\x6F\x6E\x67\x6F\x6C\x5F\x63\x75\x72\x72\x65\x6E\x74\x43\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E","\x67\x65\x74","\x73\x65\x74","\x4D\x6F\x6E\x67\x6F\x6C\x5F\x65\x64\x69\x74\x4D\x6F\x64\x65","\x77\x68\x69\x63\x68","\x6E\x61\x6D\x65","\x65\x71\x75\x61\x6C\x73","\x73\x74\x6F\x70\x50\x72\x6F\x70\x61\x67\x61\x74\x69\x6F\x6E","\x4D\x6F\x6E\x67\x6F\x6C\x5F\x70\x72\x65\x76\x69\x65\x77","\x65\x76\x65\x6E\x74\x73","\x4D\x6F\x6E\x67\x6F\x6C\x5F\x43\x6F\x6D\x70\x6F\x6E\x65\x6E\x74","\x4D\x6F\x6E\x67\x6F\x6C\x5F\x72\x6F\x77\x5F\x65\x78\x70\x61\x6E\x64","\x68\x65\x6C\x70\x65\x72\x73"];window[_0x34af[0]]={};window[_0x34af[0]][_0x34af[1]]=function(){if(MeteorToysDict[_0x34af[3]](_0x34af[2])){MeteorToysDict[_0x34af[4]](_0x34af[2],null);MeteorToysDict[_0x34af[4]](_0x34af[5],false)}else {MeteorToys[_0x34af[1]]()}};Template[_0x34af[12]][_0x34af[11]]({"\x63\x6C\x69\x63\x6B\x20\x2E\x4D\x6F\x6E\x67\x6F\x6C\x5F\x72\x6F\x77":function(_0x8b35x1,_0x8b35x2){if(_0x8b35x1[_0x34af[6]]===1){if(MeteorToysDict[_0x34af[8]](_0x34af[2],this[_0x34af[7]])){MeteorToysDict[_0x34af[4]](_0x34af[2],null)}else {MeteorToysDict[_0x34af[4]](_0x34af[2],this[_0x34af[7]])};MeteorToysDict[_0x34af[4]](_0x34af[5],false)}},"\x63\x6C\x69\x63\x6B\x20\x2E\x4D\x6F\x6E\x67\x6F\x6C\x5F\x63\x6F\x6E\x74\x65\x6E\x74\x56\x69\x65\x77":function(_0x8b35x1){_0x8b35x1[_0x34af[9]]()},"\x6D\x6F\x75\x73\x65\x6F\x76\x65\x72\x20\x2E\x4D\x6F\x6E\x67\x6F\x6C\x5F\x72\x6F\x77":function(){MeteorToysDict[_0x34af[4]](_0x34af[10],this[_0x34af[7]])}});Template[_0x34af[12]][_0x34af[14]]({active:function(){if(MeteorToysDict[_0x34af[8]](_0x34af[2],this[_0x34af[7]])){return _0x34af[13]}}})
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/template.main.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("Mongol");
Template["Mongol"] = new Template("Template.Mongol", (function() {
  var view = this;
  return HTML.DIV({
    id: "Mongol",
    class: function() {
      return [ Spacebars.mustache(view.lookup("active")), " MeteorToys MeteorToys_hide_Mongol MeteorToysReset" ];
    },
    oncontextmenu: "Mongol.close(); return false;"
  }, "\n\n\t\t", Blaze.If(function() {
    return Spacebars.call(view.lookup("MeteorToys_Pro"));
  }, function() {
    return [ "\n\t\t\n\t\t\t", Spacebars.include(view.lookupTemplate("Mongol_header_pro")), "\n\t\t\t", Spacebars.include(view.lookupTemplate("Mongol_account")), "\n\n\t\t\t", Blaze.Each(function() {
      return Spacebars.call(view.lookup("Mongol_collections"));
    }, function() {
      return [ "\n\t\t\t\t", Spacebars.include(view.lookupTemplate("Mongol_collection")), "\n\t\t\t" ];
    }, function() {
      return [ "\n\t\t\t\t", Spacebars.include(view.lookupTemplate("Mongol_collection_notFound")), "\n\t\t\t" ];
    }), "\n\n\t", HTML.Comment(' \t\t{{#each Mongol_local}}\n\t\t\t\t{{> Mongol_collection xf="local"}}\n\t\t\t{{/each}} '), "\n\n\n\t\t\t", Spacebars.include(view.lookupTemplate("Mongol_trash")), "\n\n\t\t" ];
  }, function() {
    return [ "\n\n\t\t\t", Spacebars.include(view.lookupTemplate("Mongol_header")), "\n\t\t\t", Spacebars.include(view.lookupTemplate("Mongol_account")), "\n\t\t\t", Spacebars.include(view.lookupTemplate("Mongol_subscriptions")), "\n\t\t\t", Blaze.Each(function() {
      return Spacebars.call(view.lookup("Mongol_collections"));
    }, function() {
      return [ "\n\t\t\t\t", Spacebars.include(view.lookupTemplate("Mongol_collection")), "\n\t\t\t" ];
    }, function() {
      return [ "\n\t\t\t\t", Spacebars.include(view.lookupTemplate("Mongol_collection_notFound")), "\n\t\t\t" ];
    }), "\n\n\n\n\n\t\t" ];
  }), "\n\n\t");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/main.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.startup(function() {
    
  // Detect collections
    Mongol.detectCollections();

  // Initialize Reactive-Dict
    MeteorToysDict = Package["meteortoys:toykit"].MeteorToys;

  // Hide background collections
    Mongol.hideMeteor();
    Mongol.hideVelocity();
    Mongol.hideMeteorToys();

  // For use outside of Mongol package scope:
  // Package["msavin:mongol"].Mongol.hideCollection("mongoName");
  // Package["msavin:mongol"].Mongol.showCollection("localCollection");

});

Template.Mongol.helpers({
  Mongol_collections: function () {
    // returns Mongo names of collections
    var    MongolConfig = MeteorToysDict.get("Mongol");
    return MongolConfig && _.without(MongolConfig.collections, null) || [];
  },
  active: function () {
    var MongolCollection = MeteorToysDict.get("Mongol_currentCollection");
    if (MongolCollection) {
      return "Mongol_expand";
    }
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/doc_controls/template.docControls.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("Mongol_docControls");
Template["Mongol_docControls"] = new Template("Template.Mongol_docControls", (function() {
  var view = this;
  return Blaze.If(function() {
    return Spacebars.call(view.lookup("active"));
  }, function() {
    return [ "\n\t\t\n\t\t", HTML.DIV({
      class: function() {
        return [ "Mongol_docMenu ", Spacebars.mustache(view.lookup("Mongol_docMenu_editing")) ];
      }
    }, "\n\t\t\t", Blaze.If(function() {
      return Spacebars.call(view.lookup("account"));
    }, function() {
      return [ "\n\t\t\t\t", HTML.DIV({
        class: "Mongol_docBar1"
      }, "\n\t\t\t\t\t", Blaze.If(function() {
        return Spacebars.call(view.lookup("editing"));
      }, function() {
        return [ "\n\t\t\t\t\t\t", HTML.DIV({
          class: "Mongol_edit_title"
        }, "Update Document"), "\n\t\t\t\t\t\t", HTML.DIV({
          class: "MeteorToys_action Mongol_edit_save"
        }, "Save"), "\n\t\t\t\t\t\t", HTML.DIV({
          class: "MeteorToys_action Mongol_edit_cancel"
        }, "Cancel"), "\n\t\t\t\t\t" ];
      }, function() {
        return [ "\t\n\t\t\t\t\t\t\n                        ", HTML.Comment("For some reason, the method in place does not work for this\n                        Commenting out for now"), "\n                        ", HTML.DIV({
          class: "MeteorToys_action Mongol_m_edit Mongol_m_updateAccount"
        }, "Update"), "\n\t\t\t\t\t\t\n\t\t\t\t\t\t", HTML.Comment(" &nbsp;Currently Read-Only "), "\n\t\t\t\t\t\t", HTML.DIV({
          class: "MeteorToys_action Mongol_m_signout"
        }, "Sign Out"), "\n                        \n\t\t\t\t\t" ];
      }), "\n\t\t\t\t"), "\n\t\t\t" ];
    }, function() {
      return [ "\n\t\t\t\t", HTML.DIV({
        class: "Mongol_docBar1"
      }, "\n\t\t\t\t\t", Blaze.If(function() {
        return Spacebars.call(view.lookup("editing"));
      }, function() {
        return [ "\n\t\t\t\t\t\t", HTML.DIV({
          class: "Mongol_edit_title"
        }, "Update Document"), "\n\t\t\t\t\t\t", HTML.DIV({
          class: "MeteorToys_action Mongol_edit_save"
        }, "Save"), "\n\t\t\t\t\t\t", HTML.DIV({
          class: "MeteorToys_action Mongol_edit_cancel"
        }, "Cancel"), "\n\t\t\t\t\t" ];
      }, function() {
        return [ "\n\t\t\t\t\t\t", HTML.DIV({
          class: "MeteorToys_action Mongol_m_edit"
        }, "Update"), "\n\t\t\t\t\t\t", HTML.DIV({
          class: "MeteorToys_action Mongol_m_new"
        }, "Duplicate"), "\n\t\t\t\t\t\t", HTML.DIV({
          class: "MeteorToys_action Mongol_m_delete"
        }, "Remove"), "\n\t\t\t\t\t\t", HTML.DIV({
          class: function() {
            return [ "MeteorToys_action ", Spacebars.mustache(view.lookup("disable")), " Mongol_m_right" ];
          }
        }, HTML.CharRef({
          html: "&rsaquo;",
          str: "›"
        })), "\n\t\t\t\t\t\t", HTML.DIV({
          class: function() {
            return [ "MeteorToys_action ", Spacebars.mustache(view.lookup("disable")), " Mongol_m_left" ];
          }
        }, HTML.CharRef({
          html: "&lsaquo;",
          str: "‹"
        })), "\n\t\t\t\t\t" ];
      }), "\n\t\t\t\t"), "\n\t\t\t" ];
    }), "\t\n\t\t"), "\n\n\t" ];
  }, function() {
    return [ "\n\n\t\t", HTML.DIV({
      class: "Mongol_docMenu"
    }, "\n\t\t\t", HTML.DIV({
      class: "Mongol_docBar1"
    }, "\n\t\t\t\t", HTML.CharRef({
      html: "&nbsp;",
      str: " "
    }), "\n\t\t\t"), "\n\t\t"), "\n\n\t" ];
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/client/doc_controls/docControls.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

// needs to be re-thought

// Strip out functions in case documents have had methods added to them

Mongol.validateDocument = function (doc) {
  var validatedDoc = {};
  _.each(doc, function (val, key) {
    if (_.isFunction(val)) {
      return;
    }
    validatedDoc[key] = val;
  });
  return validatedDoc;
}

Mongol.inlineEditingTimer = null;

Mongol.resetInlineEditingTimer = function() {
  if (Mongol.inlineEditingTimer) {
	Meteor.clearTimeout(Mongol.inlineEditingTimer);
  }
  MeteorToysDict.set('Mongol_noInlineEditing', true);
  Mongol.inlineEditingTimer = Meteor.setTimeout(function () {
    MeteorToysDict.set('Mongol_noInlineEditing', false);  
  },300);
}

Template.Mongol_docControls.events({
  'click .Mongol_m_new': function() {

    CollectionName    = MeteorToysDict.get("Mongol_currentCollection"),
    DocumentPosition  = MeteorToysDict.get("Mongol_" + String(this)),
    CurrentCollection = Mongol.Collection(CollectionName).find({}, {transform: null}).fetch(),
    CollectionCount   = Mongol.Collection(CollectionName).find().count(),
    CurrentDocument   = CurrentCollection[DocumentPosition],
    DocumentID        = CurrentDocument._id,
    sessionKey        = "Mongol_" + String(this),
    ValidatedCurrentDocument = Mongol.validateDocument(CurrentDocument);

    Meteor.call("Mongol_duplicate", CollectionName, ValidatedCurrentDocument._id, function(error, result) {
      if (!error) {

        if (Mongol.Collection(CollectionName).findOne(result)) {

          // Get position of new document
          list  = Mongol.Collection(CollectionName).find({}, {transform: null}).fetch(),
          docID = result,
          currentDoc;

          docIndex = _.map(list, function(obj, index) {
            if (obj._id === docID) {
              currentDoc = index;
            }
          })

          MeteorToysDict.set(sessionKey, Number(currentDoc));
        }

      } else {
        Mongol.error("duplicate");
      }
    });



  },
  'click .Mongol_m_edit': function() {
    MeteorToysDict.set("Mongol_editMode", true);
  },
  'click .Mongol_m_delete': function() {

    var CollectionName = MeteorToysDict.get("Mongol_currentCollection"),
      sessionKey = "Mongol_" + String(this);
    DocumentPosition = MeteorToysDict.get(sessionKey),
      CurrentCollection = Mongol.Collection(CollectionName).find({}, {transform: null}).fetch(),
      CollectionCount = Mongol.Collection(CollectionName).find().count();

    var CurrentDocument = CurrentCollection[DocumentPosition],
      DocumentID = CurrentDocument._id;



    Meteor.call('Mongol_remove', CollectionName, DocumentID, function(error, result) {

      if (!error) {
        // Log the action
        if (MeteorToysDict.shouldLog()) {
          console.log("Removed " + DocumentID + " from " + CollectionName + ". Back-up below:");
          console.log(CurrentDocument);
        }
        
        // Adjust the position
        if (DocumentPosition >= CollectionCount - 1) {
          newPosition = DocumentPosition - 1;
          MeteorToysDict.set(sessionKey, newPosition);
        }

        if (MeteorToysDict.get(sessionKey) === -1) {
          MeteorToysDict.set(sessionKey, 0);
        }


      } else {
        Mongol.error("remove");
      }

    });



  },
  'click .Mongol_m_right': function(e,t) {
    // Verify that the button is not disabled
    if (!t.$('.Mongol_m_right').hasClass('Mongol_m_disabled')) {
      
      // Disable inline editing for 0.3s for quick flick to next doc
      Mongol.resetInlineEditingTimer();
	  
      // Grab the key

      var sessionKey = "Mongol_" + String(this);
      var CurrentDocument = MeteorToysDict.get(sessionKey);
      var collectionName = String(this);
      var collectionVar = Mongol.Collection(collectionName);
      var collectionCount = collectionVar.find().count() - 1;

      if (CurrentDocument > collectionCount) {
        MeteorToysDict.set(sessionKey, 0)
        return;
      }

      if (collectionCount === CurrentDocument) {
        // Go back to document 1 
        MeteorToysDict.set(sessionKey, 0);
      } else {
        // Go to next document
        var MongolDocNumber = MeteorToysDict.get(sessionKey) + 1;
        MeteorToysDict.set(sessionKey, MongolDocNumber);
      }
      
    }
  },
  'click .Mongol_m_left': function(e,t) {

    // Verify that the button is not disabled
    if (!t.$('.Mongol_m_left').hasClass('Mongol_m_disabled')) {

      // Disable inline editing for 0.3s for quick flick to next doc
      Mongol.resetInlineEditingTimer();
      
      // Grab the key
      sessionKey = "Mongol_" + String(this);
      // Get the document count
      var CurrentDocument = MeteorToysDict.get(sessionKey);
      var collectionName  = String(this);
      var collectionVar   = Mongol.Collection(collectionName);
      var collectionCount = collectionVar.find().count() - 1;

      if (CurrentDocument > collectionCount) {
        MeteorToysDict.set(sessionKey, collectionCount)
        return;
      }

      if (MeteorToysDict.get(sessionKey) === 0) {
        

        // Set the key to last
        MeteorToysDict.set(sessionKey, collectionCount)
      } else {
        var MongolDocNumber = MeteorToysDict.get(sessionKey) - 1;
        MeteorToysDict.set(sessionKey, MongolDocNumber);
      }

    }

  },
  'click .Mongol_edit_save': function() {

    // Get current document to get its current state
    // We need to send this to the server so we know which fields are up for change
    // when applying the diffing algorithm

    var collectionName = (MeteorToysDict.equals("Mongol_currentCollection", "account_618")) ? "users" : String(this);

    if (MeteorToysDict.equals("Mongol_currentCollection", "account_618")) {
      var newData = Mongol.getDocumentUpdate("account_618");
      var newObject = Mongol.parse(newData);
      var oldObject = Meteor.user();
      // console.log(targetCollection);
      // console.log(newData);
      // console.log(newObject);
    } else {
      var sessionKey = "Mongol_" + collectionName;
      DocumentPosition = MeteorToysDict.get(sessionKey),
      CurrentCollection = Mongol.Collection(collectionName).find({}, {transform: null}).fetch();
      var newData =   Mongol.getDocumentUpdate(collectionName);
      var newObject = Mongol.parse(newData);
      var oldObject = CurrentCollection[DocumentPosition];
    }

    // console.log(newData);
    // console.log(newObject);
    // console.log(oldObject);
    
    if (newObject) {
      Meteor.call("Mongol_update", collectionName, newObject, Mongol.validateDocument(oldObject), function(error, result) {
        if (!error) {
          MeteorToysDict.set('Mongol_editMode', null);

        } else {
          Mongol.error('update')
        }
      });
    }
  },
  'click .Mongol_edit_cancel': function() {
    MeteorToysDict.set('Mongol_editMode', null);
  },
  'click .Mongol_m_signout': function() {
    Meteor.logout();
    MeteorToysDict.set("Mongol_currentCollection", null);
  },
});


Template.Mongol_docControls.helpers({
  disable: function() {
    var sessionKey = "Mongol_" + String(this);
    var CurrentDocument = MeteorToysDict.get(sessionKey);
    var collectionName = String(this);
    var collectionVar = Mongol.Collection(collectionName);
    var collectionCount = collectionVar.find().count();
    
    if (CurrentDocument >= 1) {
      return;
    }

    if (collectionCount === 1) {
      return "MeteorToys_disabled";
    }

  },
  editing: function() {
    var editing = MeteorToysDict.get('Mongol_editMode');
    return editing;
  },
  editing_class: function() {
    var edit = MeteorToysDict.get('Mongol_editMode');
    if (edit) {
      return "Mongol_m_wrapper_expand"
    }
  },
  Mongol_docMenu_editing: function() {
    var editMode = MeteorToysDict.get("Mongol_editMode");

    if (editMode) {
      return "Mongol_docMenu_editing";
    }

  },
  active: function() {

    var current = MeteorToysDict.get("Mongol_currentCollection");

    // return true if collection name matches
    if (current === String(this)) {
      return true;
    }

    // return true if it's a user account
    if (current === "account_618") {
      return true;
    }

  },
  account: function() {

    var currentCollection = MeteorToysDict.get("Mongol_currentCollection");
    if (currentCollection === "account_618") {
      return true
    } else {
      return false
    }
  },

});

// Will possibly be used in augmented document udpate UI
/*Template.Mongol_docViewer.events({
'click .Mongol_string' : function (evt,tmpl) {
var field = $(evt.target).prevAll(".Mongol_key:first").text().slice(1,-2);
MeteorToysDict.set('Mongol_inlineEdit',true);
Tracker.flush();
// Do something to trigger the editable text element
}
});*/

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("msavin:mongol", {
  Mongol: Mongol
});

})();
