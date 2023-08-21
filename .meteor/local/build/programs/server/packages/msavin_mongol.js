(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var _ = Package.underscore._;
var check = Package.check.check;
var Match = Package.check.Match;

/* Package-scope variables */
var MeteorToysDict, Mongol, updData, newId, targetCollection, trashDocument, revisedDocument, collectionObjects, collections;

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
// packages/msavin_mongol/server/methods.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _0x6617=["\x5F\x69\x64","\x66\x69\x6E\x64\x4F\x6E\x65","\x4D\x6F\x6E\x67\x6F\x6C\x5F\x69\x6E\x73\x65\x72\x74","\x63\x61\x6C\x6C","\x64\x69\x66\x66\x44\x6F\x63\x75\x6D\x65\x6E\x74\x44\x61\x74\x61","\x61\x6C\x64\x65\x65\x64\x3A\x73\x69\x6D\x70\x6C\x65\x2D\x73\x63\x68\x65\x6D\x61","\x61\x6C\x64\x65\x65\x64\x3A\x63\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E\x32","\x73\x69\x6D\x70\x6C\x65\x53\x63\x68\x65\x6D\x61","\x69\x73\x46\x75\x6E\x63\x74\x69\x6F\x6E","\x5F\x63\x32","\x75\x70\x64\x61\x74\x65","\x75\x6E\x64\x65\x66\x69\x6E\x65\x64","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x2E\x4D\x6F\x6E\x67\x6F\x6C","\x4D\x6F\x6E\x67\x6F\x6C\x5F\x6F\x72\x69\x67\x69\x6E","\x4D\x6F\x6E\x67\x6F\x6C\x5F\x64\x61\x74\x65","\x69\x6E\x73\x65\x72\x74","\x72\x65\x6D\x6F\x76\x65","\x69\x6E\x73\x65\x72\x74\x44\x6F\x63","\x44\x75\x70\x6C\x69\x63\x61\x74\x65\x20\x5F\x69\x64\x20\x66\x6F\x75\x6E\x64","\x6C\x6F\x67","\x67\x65\x74\x41\x6C\x6C","\x43\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E","\x6E\x61\x6D\x65","\x70\x75\x73\x68","\x6D\x61\x70","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73","\x67\x65\x74","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x2E\x49\x6D\x70\x65\x72\x73\x6F\x6E\x61\x74\x65","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x2E\x4A\x65\x74\x53\x65\x74\x74\x65\x72","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x2E\x41\x75\x74\x6F\x50\x75\x62","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x2E\x45\x6D\x61\x69\x6C","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x2E\x52\x65\x73\x75\x6C\x74","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x2E\x54\x68\x72\x6F\x74\x74\x6C\x65","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x2E\x43\x72\x65\x64\x65\x6E\x74\x69\x61\x6C\x73","\x6D\x65\x74\x68\x6F\x64\x73"];Meteor[_0x6617[34]]({Mongol_update:function(_0xa65fx1,_0xa65fx2,_0xa65fx3){check(_0xa65fx1,String);check(_0xa65fx2,Object);check(_0xa65fx3,Object);var _0xa65fx4=Mongol.Collection(_0xa65fx1),_0xa65fx5=_0xa65fx2[_0x6617[0]],_0xa65fx6=_0xa65fx3[_0x6617[0]];var _0xa65fx7=_0xa65fx4[_0x6617[1]]({_id:_0xa65fx5},{transform:null});if(!_0xa65fx7){Meteor[_0x6617[3]](_0x6617[2],_0xa65fx1,_0xa65fx2);return};delete _0xa65fx2[_0x6617[0]];delete _0xa65fx3[_0x6617[0]];delete _0xa65fx7[_0x6617[0]];var _0xa65fx8=Mongol[_0x6617[4]](_0xa65fx7,_0xa65fx2,_0xa65fx3);if(!!Package[_0x6617[5]]&&!!Package[_0x6617[6]]&&_[_0x6617[8]](_0xa65fx4[_0x6617[7]])&&_0xa65fx4[_0x6617[9]]){_0xa65fx4[_0x6617[10]]({_id:_0xa65fx5},{$set:_0xa65fx8},{filter:false,autoConvert:false,removeEmptyStrings:false,validate:false});return};_0xa65fx4[_0x6617[10]]({_id:_0xa65fx5},_0xa65fx8)},Mongol_remove:function(_0xa65fx1,_0xa65fx5,_0xa65fx9){check(_0xa65fx1,String);check(_0xa65fx5,String);check(_0xa65fx9,Match.Any);var _0xa65fx4=Mongol.Collection(_0xa65fx1);var _0xa65fxa=_0xa65fx4[_0x6617[1]](_0xa65fx5,{transform:null});if( typeof _0xa65fx9===_0x6617[11]){targetCollection=Mongol.Collection(_0x6617[12]);trashDocument=_0xa65fxa;trashDocument[_0x6617[13]]=String(_0xa65fx1);trashDocument[_0x6617[14]]= new Date();targetCollection[_0x6617[15]](trashDocument)};_0xa65fx4[_0x6617[16]](_0xa65fx5);return _0xa65fxa},Mongol_duplicate:function(_0xa65fx1,_0xa65fx5){check(_0xa65fx1,String);check(_0xa65fx5,String);var _0xa65fx4=Mongol.Collection(_0xa65fx1),_0xa65fxb=_0xa65fx4[_0x6617[1]](_0xa65fx5,{transform:null});if(_0xa65fxb){delete _0xa65fxb[_0x6617[0]];var _0xa65fxc=_0xa65fxb;var _0xa65fxd=Mongol[_0x6617[17]](_0xa65fx4,_0xa65fxc);return _0xa65fxd}},Mongol_insert:function(_0xa65fx1,_0xa65fx2){check(_0xa65fx1,String);check(_0xa65fx2,Object);var _0xa65fx4=Mongol.Collection(_0xa65fx1),_0xa65fxe=null;if(_0xa65fx2[_0x6617[0]]&&_0xa65fx4[_0x6617[1]]({_id:_0xa65fx2[_0x6617[0]]},{transform:null})){console[_0x6617[19]](_0x6617[18]);return null};revisedDocument=_0xa65fx2;var _0xa65fxe=Mongol[_0x6617[17]](_0xa65fx4,revisedDocument);return _0xa65fxe},Mongol_getCollections:function(){collectionObjects=Mongo[_0x6617[21]][_0x6617[20]](),collections=[];collectionObjects[_0x6617[24]](function(_0xa65fxf){if(_0xa65fxf[_0x6617[22]]){collections[_0x6617[23]](_0xa65fxf[_0x6617[22]])}});return collections},Mongol_resetCollection:function(_0xa65fx10){check(_0xa65fx10,Match.Any);var _0xa65fx11=false;Meteor[_0x6617[3]](_0x6617[25],function(_0xa65fx12,_0xa65fx13){_0xa65fx11=_0xa65fx13});if(!_0xa65fx11){return false};Meteor[_0x6617[21]][_0x6617[26]](_0xa65fx10)[_0x6617[16]]({});return true},Mongol_resetMeteorToys:function(){var _0xa65fx14=false;Meteor[_0x6617[3]](_0x6617[25],function(_0xa65fx12,_0xa65fx13){_0xa65fx14=_0xa65fx13});if(!_0xa65fx14){return false};Meteor[_0x6617[21]][_0x6617[26]](_0x6617[27])[_0x6617[16]]({});Meteor[_0x6617[21]][_0x6617[26]](_0x6617[28])[_0x6617[16]]({});Meteor[_0x6617[21]][_0x6617[26]](_0x6617[12])[_0x6617[16]]({});Meteor[_0x6617[21]][_0x6617[26]](_0x6617[29])[_0x6617[16]]({});Meteor[_0x6617[21]][_0x6617[26]](_0x6617[30])[_0x6617[16]]({});Meteor[_0x6617[21]][_0x6617[26]](_0x6617[31])[_0x6617[16]]({});Meteor[_0x6617[21]][_0x6617[26]](_0x6617[32])[_0x6617[16]]({});return true},Mongol_resetAll:function(){var _0xa65fx14=false;Meteor[_0x6617[3]](_0x6617[25],function(_0xa65fx12,_0xa65fx13){_0xa65fx14=_0xa65fx13});if(!_0xa65fx14){return false};collectionObjects=Mongo[_0x6617[21]][_0x6617[20]](),collections=[];collectionObjects[_0x6617[24]](function(_0xa65fxf){if(_0xa65fxf[_0x6617[22]]){if(_0xa65fxf[_0x6617[22]]!==_0x6617[33]){Mongo[_0x6617[21]][_0x6617[26]](_0xa65fxf[_0x6617[22]])[_0x6617[16]]({})}}});return true}})
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/msavin_mongol/server/utilities.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// This function takes three data points into account:

// 1) the actual document as it stands on the server, prior to being updated
// 2) the oldData that was on the client before the user pressed save
// 3) the newData that the client is trying to save

// This function decides which fields it is going to make writes to on this basis:
// 1) The field(s) being overwritten must appear in the db doc and on the client oldData
//(if they only appear in the oldData these must have been added dynamically on the client
// and we don't want to save these fields to the db)
//-- this includes fields that are being removed (i.e. they must appear in the db doc and the oldData)
// 2) Only fields that appear in the newData, but not the oldData or db doc can be added
//(if it appears in the db doc, throw an error that says:
// "There is an unpublished field in the database with that name. Update cannot be made.")

// The ramifications of all this:
// You can only update/remove fields that are published
// You can only add new fields if they don't exist in the db already


Mongol.diffDocumentData = function (dbDoc, newData, oldData) {

  var finalData = {};

  var dbDocFields = _.keys(dbDoc);
  var newDataFields = _.keys(newData);
  var oldDataFields = _.keys(oldData); // console.log("dbDocFields",dbDocFields); console.log("newDataFields",newDataFields); console.log("oldDataFields",oldDataFields);

  // First get the set of fields that we won't be saving because they were dynamically added on the client

  var dynamicallyAddedFields = _.difference(oldDataFields, dbDocFields);

  // Then get the fields that must retain their dbDoc field value, because they we'ren't published

  var unpublishedFields = _.difference(dbDocFields, oldDataFields); // console.log("unpublishedFields",unpublishedFields);

  // iterate over all fields, old and new, and ascertain the field value that must be added to the final data object

  var oldAndNewFields = _.union(dbDocFields, newDataFields);

  _.each(oldAndNewFields, function(field) {

    if (_.contains(dynamicallyAddedFields, field)) {
  
      // We don't want to add this field to the actual mongodb document
      console.log("'" + field + "' appears to be a dynamically added field. This field was not updated.");
      return;

    }

    if (_.contains(unpublishedFields, field)) {

      // We don't want to overwrite the existing mondodb document value
      if (newData[field]) {
        // Give a message to user as to why that field wasn't updated
        console.log("'" + field + "' is an unpublished field. This field's value was not overwritten.");
      }
      // Make sure the old value is retained
      finalData[field] = dbDoc[field];
      return;

    }

    if (!_.isUndefined(newData[field])) {
        
      finalData[field] = (_.isObject(newData[field]) && !_.isArray(newData[field]) && !_.isDate(newData[field])) ? Mongol.diffDocumentData(dbDoc[field] || {}, newData[field], oldData[field] || {}) : newData[field];
      
    }

    // This will let unpublished fields into the database,
    // so the user may be confused by the lack of an update in the client
    // simply because the added field isn't published
    // The following solves that problem, but doesn't allow new fields to be added at all:
    // finalData[field] = oldData[field] && newData[field];
    // We actually need to know the set of fields published by the publication that the client side doc came from
    // but how do we get that?

  });

  return finalData;

};

// Test code for Mongol.diffDocumentData

/*Meteor.startup(function() {

  // Take a user document
  var sampleDbDoc = { "_id" : "exampleuser1", "createdAt" : 1375253926213, "defaultPrograms" : { "514d75dc97095578800" : "MYP", "515be068c708000000" : "PYP" }, "department_id" : [  "GMsv9YzaCuL6dFBYL" ], "emails" : [  {  "address" : "aaa@aaa.com",  "verified" : true } ], "myCourses" : [  "QqofEtQPgFb72",  "fvTxhAyfMxFbhzwK7",  "jcPtgwN6pTMQDEp" ], "organization_id" : [  "51f76bcbfb1e0d3100" ], "permContexts" : [     {     "department_id" : "GMsv9YzCuL6dFBYL", "perms" : [     "editRoles",     "editCourses",     "editUnits",     "editAssessments",     "editDepartments" ] } ], "roleContexts" : [     {     "organization_id" : "51f76bc23dfb1e0d3100",     "school_id" : "514d75d9562095578800",     "department_id" : "GMsv9YzaCuL6dFBYL",     "roles" : [     "iQD4BhnB8PFWwHCcg" ] },     {     "organization_id" : "2BjJbMyRLWa4iofQm" } ], "school_id" : [  "514d75dc97d95095578800" ], "services" : { "password" : { "bcrypt" : "$M4235dfre5.5ijyU3.ilpYZQFmtO" }, "resume" : { "loginTokens" : [     {     "when" : "2014-12-24T12:00:06.725Z",     "hashedToken" : "not/telling=" },     {     "when" : "2015-01-16T04:45:10.574Z",     "hashedToken" : "bigbadhashedtoken=" },     {     "when" : "2015-01-22T02:01:57.671Z",     "hashedToken" : "9HSC98hWA9OByHPA6LbBB8=" } ] } }, "superuser" : [  "51f76bb1e0d3100",  "2BjJbMyRiofQm",  "ZkeEcp72bAFQY" ], "transaction_id" : "shQ9fzcZYSgLLnptC" };

  // Simulate the oldData getting sent back from the client (the fields should be a subset of the db fields)
  var sampleOldData = _.extend(_.clone(sampleDbDoc),{dynamicallyAddedField:true, secondDynamicallyAddedField: "Dynamically added value"}); // Simulate two dynamically added fields
  delete sampleOldData.services; // Simulate an unpublished field

  // Simulate the newData getting sent back from the client
  // e.g. user adds a new field
  var sampleNewData = _.extend(_.clone(sampleOldData),{brandNewField: true});
  // brandNewField should be added
  delete sampleNewData.createdAt; // This should be gone
  sampleNewData.secondDynamicallyAddedField = "Dynamically added value overwritten by user"; // seconddynamicallyAddedField should be gone
  sampleNewData.transaction_id = "overwritten transaction id"; // This field should be changed

  // Run the test

  console.log(Mongol.diffDocumentData(sampleDbDoc, sampleNewData, sampleOldData));

});*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("msavin:mongol");

})();
