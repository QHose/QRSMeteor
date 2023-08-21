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
var check = Package.check.check;
var Match = Package.check.Match;
var ReactiveDict = Package['reactive-dict'].ReactiveDict;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var $ = Package.jquery.$;
var jQuery = Package.jquery.jQuery;
var Mongo = Package.mongo.Mongo;
var LocalCollection = Package.minimongo.LocalCollection;
var Minimongo = Package.minimongo.Minimongo;
var Session = Package.session.Session;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var Spacebars = Package.spacebars.Spacebars;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var CollectionExtensions, MeteorToysData, key, credz, collectionObjects, collections, total, MeteorToysRegistry, MeteorToysRegistryData, toyName, packageList, packageName, ToyKitData, ToyKit, password, email, MeteorToys, quote, MeteorToysDict, MeteorToys_JSON, MeteorToysNotifications, MeteorToysNotifyDict, Note, current, Counter, Data, item, NotifyClose, NotifyInternal, self, name, pixels, position, coordinate, data, keys, temp, em, pw;

(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteortoys_toykit/lib/collections.js                                                                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _0x51bc=["\x64\x62\x75\x72\x6C\x65\x73\x3A\x6D\x6F\x6E\x67\x6F\x2D\x63\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E\x2D\x69\x6E\x73\x74\x61\x6E\x63\x65\x73","\x5F\x65\x78\x74\x65\x6E\x73\x69\x6F\x6E\x73","\x61\x64\x64\x45\x78\x74\x65\x6E\x73\x69\x6F\x6E","\x66\x75\x6E\x63\x74\x69\x6F\x6E","\x63\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E\x2D\x65\x78\x74\x65\x6E\x73\x69\x6F\x6E\x2D\x77\x72\x6F\x6E\x67\x2D\x61\x72\x67\x75\x6D\x65\x6E\x74","\x59\x6F\x75\x20\x6D\x75\x73\x74\x20\x70\x61\x73\x73\x20\x61\x20\x66\x75\x6E\x63\x74\x69\x6F\x6E\x20\x0D\x20\x20\x20\x20\x20\x20\x20\x69\x6E\x74\x6F\x20\x43\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E\x45\x78\x74\x65\x6E\x73\x69\x6F\x6E\x73\x2E\x61\x64\x64\x45\x78\x74\x65\x6E\x73\x69\x6F\x6E\x28\x29\x2E","\x70\x75\x73\x68","\x75\x73\x65\x72\x73","\x75\x6E\x64\x65\x66\x69\x6E\x65\x64","\x61\x70\x70\x6C\x79","\x61\x64\x64\x43\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E\x45\x78\x74\x65\x6E\x73\x69\x6F\x6E","\x60\x4D\x65\x74\x65\x6F\x72\x2E\x61\x64\x64\x43\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E\x45\x78\x74\x65\x6E\x73\x69\x6F\x6E\x60\x20\x69\x73\x20\x64\x65\x70\x72\x65\x63\x61\x74\x65\x64\x2C\x20\x70\x6C\x65\x61\x73\x65\x20\x75\x73\x65\x20\x60\x43\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E\x45\x78\x74\x65\x6E\x73\x69\x6F\x6E\x73\x2E\x61\x64\x64\x45\x78\x74\x65\x6E\x73\x69\x6F\x6E\x60","\x77\x61\x72\x6E","\x61\x64\x64\x50\x72\x6F\x74\x6F\x74\x79\x70\x65","\x73\x74\x72\x69\x6E\x67","\x59\x6F\x75\x20\x6D\x75\x73\x74\x20\x70\x61\x73\x73\x20\x61\x20\x73\x74\x72\x69\x6E\x67\x20\x61\x73\x20\x74\x68\x65\x20\x66\x69\x72\x73\x74\x20\x61\x72\x67\x75\x6D\x65\x6E\x74\x20\x0D\x20\x20\x20\x20\x20\x20\x20\x69\x6E\x74\x6F\x20\x43\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E\x45\x78\x74\x65\x6E\x73\x69\x6F\x6E\x73\x2E\x61\x64\x64\x50\x72\x6F\x74\x6F\x74\x79\x70\x65\x28\x29\x2E","\x59\x6F\x75\x20\x6D\x75\x73\x74\x20\x70\x61\x73\x73\x20\x61\x20\x66\x75\x6E\x63\x74\x69\x6F\x6E\x20\x61\x73\x20\x74\x68\x65\x20\x73\x65\x63\x6F\x6E\x64\x20\x61\x72\x67\x75\x6D\x65\x6E\x74\x20\x0D\x20\x20\x20\x20\x20\x20\x20\x69\x6E\x74\x6F\x20\x43\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E\x45\x78\x74\x65\x6E\x73\x69\x6F\x6E\x73\x2E\x61\x64\x64\x50\x72\x6F\x74\x6F\x74\x79\x70\x65\x28\x29\x2E","\x70\x72\x6F\x74\x6F\x74\x79\x70\x65","\x43\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E","\x61\x64\x64\x43\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E\x50\x72\x6F\x74\x6F\x74\x79\x70\x65","\x60\x4D\x65\x74\x65\x6F\x72\x2E\x61\x64\x64\x43\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E\x50\x72\x6F\x74\x6F\x74\x79\x70\x65\x60\x20\x69\x73\x20\x64\x65\x70\x72\x65\x63\x61\x74\x65\x64\x2C\x20\x70\x6C\x65\x61\x73\x65\x20\x75\x73\x65\x20\x60\x43\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E\x45\x78\x74\x65\x6E\x73\x69\x6F\x6E\x73\x2E\x61\x64\x64\x50\x72\x6F\x74\x6F\x74\x79\x70\x65\x60","\x73\x65\x74\x50\x72\x6F\x74\x6F\x74\x79\x70\x65\x4F\x66","\x5F\x5F\x70\x72\x6F\x74\x6F\x5F\x5F","\x5F\x43\x6F\x6C\x6C\x65\x63\x74\x69\x6F\x6E\x50\x72\x6F\x74\x6F\x74\x79\x70\x65","\x63\x6F\x6E\x73\x74\x72\x75\x63\x74\x6F\x72","\x68\x61\x73\x4F\x77\x6E\x50\x72\x6F\x70\x65\x72\x74\x79","\x63\x61\x6C\x6C","\x73\x6C\x69\x63\x65","\x6C\x65\x6E\x67\x74\x68","\x67\x65\x74","\x63\x6F\x6E\x6E\x65\x63\x74\x69\x6F\x6E","\x6E\x61\x6D\x65","\x6F\x70\x74\x69\x6F\x6E\x73","\x5F\x6C\x61\x73\x74\x53\x65\x73\x73\x69\x6F\x6E\x49\x64","\x66\x69\x6E\x64","\x69\x6E\x73\x74\x61\x6E\x63\x65","\x67\x65\x74\x41\x6C\x6C","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x2E\x49\x6D\x70\x65\x72\x73\x6F\x6E\x61\x74\x65","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x2E\x4A\x65\x74\x53\x65\x74\x74\x65\x72","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x2E\x4D\x6F\x6E\x67\x6F\x6C","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x2E\x41\x75\x74\x6F\x50\x75\x62","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x2E\x45\x6D\x61\x69\x6C","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x2E\x52\x65\x73\x75\x6C\x74","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x2E\x54\x68\x72\x6F\x74\x74\x6C\x65","\x61\x6C\x6C\x6F\x77","\x49\x6D\x70\x65\x72\x73\x6F\x6E\x61\x74\x65","\x4A\x65\x74\x53\x65\x74\x74\x65\x72","\x4D\x6F\x6E\x67\x6F\x6C","\x41\x75\x74\x6F\x50\x75\x62","\x45\x6D\x61\x69\x6C","\x52\x65\x73\x75\x6C\x74","\x69\x73\x53\x65\x72\x76\x65\x72","\x63\x72\x65\x64\x65\x6E\x74\x69\x61\x6C\x73","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x2E\x43\x72\x65\x64\x65\x6E\x74\x69\x61\x6C\x73","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73","\x79\x65\x73","\x72\x65\x6D\x6F\x76\x65","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x44\x61\x74\x61","\x6D\x65\x74\x65\x6F\x72\x74\x6F\x79\x73\x3A\x74\x6F\x79\x6B\x69\x74","\x69\x6E\x73\x65\x72\x74","\x66\x69\x6E\x64\x4F\x6E\x65","\x53\x58\x47\x57\x4C\x5A\x50\x44\x4F\x4B","\x46\x49\x56\x55\x48\x4A\x59\x54\x51\x42\x4E\x4D\x41\x43\x45\x52\x78\x73\x77\x67\x7A\x6C\x64\x70\x6B\x6F\x69\x66\x75\x76","\x6A\x68\x74\x79\x62\x71\x6D\x6E\x63\x61\x72\x65","\x40","","\x72\x65\x70\x6C\x61\x63\x65","\x2E","\x63\x68\x61\x72\x41\x74","\x61","\x7A","\x41","\x5A","\x69\x6E\x64\x65\x78\x4F\x66","\x66\x72\x6F\x6D\x43\x68\x61\x72\x43\x6F\x64\x65","\x65\x6D\x61\x69\x6C","\x70\x61\x73\x73\x77\x6F\x72\x64","\x74\x6F\x55\x70\x70\x65\x72\x43\x61\x73\x65","\x6D\x65\x74\x68\x6F\x64\x73","\x61\x75\x74\x6F\x70\x75\x62\x6C\x69\x73\x68","\x6D\x61\x70","\x54\x68\x72\x6F\x74\x74\x6C\x65","\x70\x75\x62\x6C\x69\x73\x68","\x63\x6F\x72\x65","\x61\x64\x64\x6F\x6E","\x72\x65\x67\x69\x73\x74\x65\x72","\x74\x65\x6D\x70\x6C\x61\x74\x65","\x6F\x66\x66\x69\x63\x69\x61\x6C","\x73\x63\x61\x6E","\x6B\x65\x79\x73","\x6C\x61\x73\x74\x49\x6E\x64\x65\x78\x4F\x66","\x54\x6F\x79\x4B\x69\x74","\x73\x74\x61\x72\x74\x53\x63\x61\x6E","\x6D\x65\x74\x65\x6F\x72\x74\x6F\x79\x73\x3A","\x6D\x65\x74\x65\x6F\x72\x74\x6F\x79\x73\x61\x64\x64\x6F\x6E\x3A","\x73\x74\x61\x72\x74\x75\x70"];if(!Package[_0x51bc[0]]){CollectionExtensions={};CollectionExtensions[_0x51bc[1]]=[];CollectionExtensions[_0x51bc[2]]=function(_0x19bfx1){if( typeof _0x19bfx1!==_0x51bc[3]){throw  new Meteor.Error(_0x51bc[4],_0x51bc[5])};CollectionExtensions[_0x51bc[1]][_0x51bc[6]](_0x19bfx1);if( typeof Meteor[_0x51bc[7]]!==_0x51bc[8]){_0x19bfx1[_0x51bc[9]](Meteor[_0x51bc[7]],[_0x51bc[7]])}};Meteor[_0x51bc[10]]=function(){console[_0x51bc[12]](_0x51bc[11]);CollectionExtensions[_0x51bc[2]][_0x51bc[9]](null,arguments)};CollectionExtensions[_0x51bc[13]]=function(_0x19bfx2,_0x19bfx1){if( typeof _0x19bfx2!==_0x51bc[14]){throw  new Meteor.Error(_0x51bc[4],_0x51bc[15])};if( typeof _0x19bfx1!==_0x51bc[3]){throw  new Meteor.Error(_0x51bc[4],_0x51bc[16])};( typeof Mongo!==_0x51bc[8]?Mongo[_0x51bc[18]]:Meteor[_0x51bc[18]])[_0x51bc[17]][_0x19bfx2]=_0x19bfx1};Meteor[_0x51bc[19]]=function(){console[_0x51bc[12]](_0x51bc[20]);CollectionExtensions[_0x51bc[13]][_0x51bc[9]](null,arguments)};function reassignCollectionPrototype(_0x19bfx4,_0x19bfx5){var _0x19bfx6= typeof Object[_0x51bc[21]]===_0x51bc[3];if(!_0x19bfx5){_0x19bfx5= typeof Mongo!==_0x51bc[8]?Mongo[_0x51bc[18]]:Meteor[_0x51bc[18]]};if(_0x19bfx6){Object[_0x51bc[21]](_0x19bfx4,_0x19bfx5[_0x51bc[17]])}else {if(_0x19bfx4[_0x51bc[22]]){_0x19bfx4[_0x51bc[22]]=_0x19bfx5[_0x51bc[17]]}}}function wrapCollection(_0x19bfx8,_0x19bfx9){if(!_0x19bfx9[_0x51bc[23]]){_0x19bfx9[_0x51bc[23]]= new _0x19bfx9.Collection(null)};var _0x19bfxa=_0x19bfx9[_0x51bc[18]];var _0x19bfxb=_0x19bfx9[_0x51bc[23]];_0x19bfx8[_0x51bc[18]]=function(){var _0x19bfxc=_0x19bfxa[_0x51bc[9]](this,arguments);processCollectionExtensions(this,arguments);return _0x19bfxc};_0x19bfx8[_0x51bc[18]][_0x51bc[17]]=_0x19bfxb;_0x19bfx8[_0x51bc[18]][_0x51bc[17]][_0x51bc[24]]=_0x19bfx8[_0x51bc[18]];for(var _0x19bfxd in _0x19bfxa){if(_0x19bfxa[_0x51bc[25]](_0x19bfxd)){_0x19bfx8[_0x51bc[18]][_0x19bfxd]=_0x19bfxa[_0x19bfxd]}}}function processCollectionExtensions(_0x19bfxf,_0x19bfx10){var _0x19bfx10=_0x19bfx10?[][_0x51bc[27]][_0x51bc[26]](_0x19bfx10,0):undefined;var _0x19bfx11=CollectionExtensions[_0x51bc[1]];for(var _0x19bfx12=0,_0x19bfx13=_0x19bfx11[_0x51bc[28]];_0x19bfx12<_0x19bfx13;_0x19bfx12++){_0x19bfx11[_0x19bfx12][_0x51bc[9]](_0x19bfxf,_0x19bfx10)}}if( typeof Mongo!==_0x51bc[8]){wrapCollection(Meteor,Mongo);wrapCollection(Mongo,Mongo)}else {wrapCollection(Meteor,Meteor)};if( typeof Meteor[_0x51bc[7]]!==_0x51bc[8]){reassignCollectionPrototype(Meteor[_0x51bc[7]])};var instances=[];CollectionExtensions[_0x51bc[2]](function(_0x19bfx2,_0x19bfx15){instances[_0x51bc[6]]({name:_0x19bfx2,instance:this,options:_0x19bfx15})});Mongo[_0x51bc[18]][_0x51bc[29]]=function(_0x19bfx2,_0x19bfx15){_0x19bfx15=_0x19bfx15||{};var _0x19bfx16=_[_0x51bc[34]](instances,function(_0x19bfx4){if(_0x19bfx15[_0x51bc[30]]){return _0x19bfx4[_0x51bc[31]]===_0x19bfx2&&_0x19bfx4[_0x51bc[32]]&&_0x19bfx4[_0x51bc[32]][_0x51bc[30]][_0x51bc[33]]===_0x19bfx15[_0x51bc[30]][_0x51bc[33]]};return _0x19bfx4[_0x51bc[31]]===_0x19bfx2});return _0x19bfx16&&_0x19bfx16[_0x51bc[35]]};Mongo[_0x51bc[18]][_0x51bc[36]]=function(){return instances};Meteor[_0x51bc[18]]=Mongo[_0x51bc[18]]};MeteorToysData={"\x49\x6D\x70\x65\x72\x73\x6F\x6E\x61\x74\x65": new Mongo.Collection(_0x51bc[37]),"\x4A\x65\x74\x53\x65\x74\x74\x65\x72": new Mongo.Collection(_0x51bc[38]),"\x4D\x6F\x6E\x67\x6F\x6C": new Mongo.Collection(_0x51bc[39]),"\x41\x75\x74\x6F\x50\x75\x62": new Mongo.Collection(_0x51bc[40]),"\x45\x6D\x61\x69\x6C": new Mongo.Collection(_0x51bc[41]),"\x52\x65\x73\x75\x6C\x74": new Mongo.Collection(_0x51bc[42]),"\x54\x68\x72\x6F\x74\x74\x6C\x65": new Mongo.Collection(_0x51bc[43])};MeteorToysData[_0x51bc[45]][_0x51bc[44]]({insert:function(){return true},remove:function(){return true},update:function(){return true}});MeteorToysData[_0x51bc[46]][_0x51bc[44]]({insert:function(){return true},remove:function(){return true},update:function(){return true}});MeteorToysData[_0x51bc[47]][_0x51bc[44]]({insert:function(){return true},remove:function(){return true},update:function(){return true}});MeteorToysData[_0x51bc[48]][_0x51bc[44]]({insert:function(){return true},remove:function(){return true},update:function(){return true}});MeteorToysData[_0x51bc[49]][_0x51bc[44]]({insert:function(){return true},remove:function(){return true},update:function(){return true}});MeteorToysData[_0x51bc[50]][_0x51bc[44]]({insert:function(){return true},remove:function(){return true},update:function(){return true}});if(Meteor[_0x51bc[51]]){MeteorToysData[_0x51bc[52]]= new Mongo.Collection(_0x51bc[53]);Meteor[_0x51bc[78]]({Mongol_verifyDoc:function(_0x19bfx17,_0x19bfx18){check(_0x19bfx17,Match.Any);check(_0x19bfx18,Match.Any);var _0x19bfx19;if(_0x19bfx17){if(_0x19bfx17===_0x19bfx18){return false}};Meteor[_0x51bc[26]](_0x51bc[54],_0x19bfx17,_0x19bfx18,function(_0x19bfx1a,_0x19bfx1b){if(_0x19bfx1b===_0x51bc[55]){Package[_0x51bc[58]][_0x51bc[57]][_0x51bc[52]][_0x51bc[56]]({});var _0x19bfx1c=Package[_0x51bc[58]][_0x51bc[57]][_0x51bc[52]][_0x51bc[59]]({"\x65\x6D\x61\x69\x6C":_0x19bfx17,"\x70\x61\x73\x73\x77\x6F\x72\x64":_0x19bfx18});_0x19bfx19=true}else {_0x19bfx19=false}});return _0x19bfx19},MeteorToys_init:function(){return Package[_0x51bc[58]][_0x51bc[57]][_0x51bc[52]][_0x51bc[60]]()},MeteorToys_remove:function(){Package[_0x51bc[58]][_0x51bc[57]][_0x51bc[52]][_0x51bc[56]]({})},MeteorToys:function(_0x19bfx17,_0x19bfx18){check(_0x19bfx17,Match.Any);check(_0x19bfx18,Match.Any);key=_0x51bc[61];if(_0x19bfx17){if(_0x19bfx17===_0x19bfx18){return false}else {key+=_0x51bc[62]}}else {key+=_0x51bc[62]};key+=_0x51bc[63];function _0x19bfx1d(_0x19bfx1e){_0x19bfx1e=_0x19bfx1e[_0x51bc[66]](_0x51bc[64],_0x51bc[65]);_0x19bfx1e=_0x19bfx1e[_0x51bc[66]](_0x51bc[67],_0x51bc[65]);_0x19bfx1e=_0x19bfx1e[_0x51bc[66]](_0x51bc[67],_0x51bc[65]);_0x19bfx1e=_0x19bfx1e[_0x51bc[66]](_0x51bc[67],_0x51bc[65]);return _0x19bfx1e}function _0x19bfx1f(_0x19bfx20){_0x19bfx20=decodeURIComponent(_0x19bfx20);var _0x19bfx21=_0x51bc[65];var _0x19bfx22;for(var _0x19bfx12=_0x19bfx20[_0x51bc[28]]-1;_0x19bfx12>=0;_0x19bfx12--){_0x19bfx22=_0x19bfx20[_0x51bc[68]](_0x19bfx12);_0x19bfx21+=(_0x19bfx22>=_0x51bc[69]&&_0x19bfx22<=_0x51bc[70]||_0x19bfx22>=_0x51bc[71]&&_0x19bfx22<=_0x51bc[72])?String[_0x51bc[74]](65+key[_0x51bc[73]](_0x19bfx22)%26):_0x19bfx22};_0x19bfx21=_0x19bfx21[_0x51bc[66]](_0x51bc[64],_0x51bc[65]);_0x19bfx21=_0x19bfx21[_0x51bc[66]](_0x51bc[67],_0x51bc[65]);_0x19bfx21=_0x19bfx21[_0x51bc[66]](_0x51bc[67],_0x51bc[65]);_0x19bfx21=_0x19bfx21[_0x51bc[66]](_0x51bc[67],_0x51bc[65]);return _0x19bfx21}if( typeof _0x19bfx17===_0x51bc[8]){if(Package[_0x51bc[58]][_0x51bc[57]][_0x51bc[52]][_0x51bc[60]]()){credz=Package[_0x51bc[58]][_0x51bc[57]][_0x51bc[52]][_0x51bc[60]]();var _0x19bfx23=_0x19bfx1d(credz[_0x51bc[75]]),_0x19bfx24=_0x19bfx1f(credz[_0x51bc[76]]);if(_0x19bfx23===null){return false}else {if(_0x19bfx23[_0x51bc[77]]()===_0x19bfx24){return true}}}}else {if( typeof _0x19bfx17===_0x51bc[8]){}else {_0x19bfx23=_0x19bfx1d(_0x19bfx17[_0x51bc[77]]()),_0x19bfx24=_0x19bfx1f(_0x19bfx18);if(_0x19bfx23===_0x19bfx24){return _0x51bc[55]}}}}});if(Package[_0x51bc[79]]){}else {Meteor[_0x51bc[82]](_0x51bc[54],function(_0x19bfx25){check(_0x19bfx25,Match.Any);if(_0x19bfx25){collectionObjects=Mongo[_0x51bc[18]][_0x51bc[36]](),collections=[];collectionObjects[_0x51bc[80]](function(_0x19bfx26){if(_0x19bfx26[_0x51bc[31]]){collections[_0x51bc[6]](Mongo[_0x51bc[18]][_0x51bc[29]](_0x19bfx26[_0x51bc[31]])[_0x51bc[34]]())}});return collections}else {total=[MeteorToysData[_0x51bc[45]][_0x51bc[34]]({},{limit:15}),MeteorToysData[_0x51bc[46]][_0x51bc[34]](),MeteorToysData[_0x51bc[48]][_0x51bc[34]](),MeteorToysData[_0x51bc[81]][_0x51bc[34]](),MeteorToysData[_0x51bc[49]][_0x51bc[34]]({},{sort:{"\x74\x69\x6D\x65\x73\x74\x61\x6D\x70":1},limit:15}),MeteorToysData[_0x51bc[50]][_0x51bc[34]]({},{sort:{"\x74\x69\x6D\x65\x73\x74\x61\x6D\x70":-1},limit:15}),MeteorToysData[_0x51bc[47]][_0x51bc[34]]({},{sort:{"\x4D\x6F\x6E\x67\x6F\x6C\x5F\x64\x61\x74\x65":1},limit:15})];return total}})};MeteorToysRegistry={};MeteorToysRegistryData={};MeteorToysRegistryData[_0x51bc[83]]= new Object();MeteorToysRegistryData[_0x51bc[84]]= new Object();MeteorToysRegistry[_0x51bc[85]]=function(_0x19bfx27,_0x19bfx28){toyName=_0x19bfx27[_0x51bc[86]];if(_0x19bfx28===_0x51bc[87]){MeteorToysRegistryData[_0x51bc[83]][toyName]=_0x19bfx27}else {MeteorToysRegistryData[_0x51bc[84]][toyName]=_0x19bfx27}};MeteorToysRegistry[_0x51bc[88]]=function(_0x19bfx29,_0x19bfx28){packageList=Object[_0x51bc[89]](Package);for(var _0x19bfx12=0;_0x19bfx12<packageList[_0x51bc[28]];_0x19bfx12++){packageName=packageList[_0x19bfx12];if(packageName[_0x51bc[90]](_0x19bfx29,0)===0){if(Package[packageName][_0x51bc[91]]){MeteorToysRegistry[_0x51bc[85]](Package[packageName].ToyKit,_0x19bfx28)}}}};MeteorToysRegistry[_0x51bc[92]]=function(){MeteorToysRegistry[_0x51bc[88]](_0x51bc[93],_0x51bc[87]);MeteorToysRegistry[_0x51bc[88]](_0x51bc[94],_0x51bc[84])};Meteor[_0x51bc[95]](function(){MeteorToysRegistry[_0x51bc[92]]()});Meteor[_0x51bc[78]]({MeteorToysRegistry:function(){return MeteorToysRegistryData}})}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteortoys_toykit/lib/privateAPI.js                                                                       //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _0xae32=["\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x2F\x54\x6F\x79\x4B\x69\x74","\x74\x6F\x67\x67\x6C\x65\x44\x69\x73\x70\x6C\x61\x79","\x64\x69\x73\x70\x6C\x61\x79","\x67\x65\x74","\x73\x65\x74","\x66\x6F\x63\x75\x73","\x73\x74\x61\x72\x74\x53\x75\x62\x73\x63\x72\x69\x70\x74\x69\x6F\x6E","\x61\x75\x74\x6F\x70\x75\x62\x6C\x69\x73\x68","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x61\x75\x74\x6F\x70\x75\x62\x6C\x69\x73\x68","\x73\x75\x62\x73\x63\x72\x69\x62\x65","\x61\x75\x74\x6F\x72\x75\x6E","\x62\x69\x6E\x64\x48\x6F\x74\x4B\x65\x79\x73","\x6B\x65\x79\x43\x6F\x64\x65","\x63\x74\x72\x6C\x4B\x65\x79","\x6B\x65\x79\x64\x6F\x77\x6E","\x63\x68\x65\x63\x6B\x41\x75\x74\x68\x65\x6E\x74\x69\x63\x61\x74\x69\x6F\x6E","\x61\x75\x74\x68\x65\x6E\x74\x69\x63\x61\x74\x65\x64","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x70\x61\x73\x73\x77\x6F\x72\x64","\x67\x65\x74\x49\x74\x65\x6D","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x65\x6D\x61\x69\x6C","\x4D\x6F\x6E\x67\x6F\x6C\x5F\x76\x65\x72\x69\x66\x79\x44\x6F\x63","\x63\x61\x6C\x6C","\x54\x68\x65\x20\x73\x74\x6F\x72\x65\x64\x20\x61\x75\x74\x68\x65\x6E\x74\x69\x63\x61\x74\x69\x6F\x6E\x20\x6B\x65\x79\x73\x20\x66\x6F\x72\x20\x4D\x65\x74\x65\x6F\x72\x20\x54\x6F\x79\x73\x20\x61\x72\x65\x20\x69\x6E\x76\x61\x6C\x69\x64\x2E","\x6C\x6F\x67","\x72\x65\x62\x6F\x6F\x74\x41\x75\x74\x68\x65\x6E\x74\x69\x63\x61\x74\x69\x6F\x6E","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x69\x6E\x69\x74","\x70\x61\x73\x73\x77\x6F\x72\x64","\x73\x65\x74\x49\x74\x65\x6D","\x65\x6D\x61\x69\x6C","\x67\x72\x61\x62\x54\x6F\x79\x73","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x52\x65\x67\x69\x73\x74\x72\x79","\x72\x65\x67\x69\x73\x74\x72\x79","\x70\x61\x72\x73\x65","\x73\x74\x72\x69\x6E\x67","\x75\x6E\x66\x6F\x63\x75\x73","\x63\x6F\x6C\x6F\x72\x69\x7A\x65","\x75\x6E\x64\x65\x66\x69\x6E\x65\x64","\x3C\x65\x6D\x3E\x75\x6E\x64\x65\x66\x69\x6E\x65\x64\x3C\x2F\x65\x6D\x3E","\x26\x67\x74\x3B","\x72\x65\x70\x6C\x61\x63\x65","\x26\x6C\x74\x3B","\x26\x61\x6D\x70\x3B","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6E\x75\x6D\x62\x65\x72","\x74\x65\x73\x74","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6B\x65\x79","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x73\x74\x72\x69\x6E\x67","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x62\x6F\x6F\x6C\x65\x61\x6E","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6E\x75\x6C\x6C","\x3C\x73\x70\x61\x6E\x20\x63\x6C\x61\x73\x73\x3D\x22","\x22\x3E\x22\x3C\x2F\x73\x70\x61\x6E\x3E","","\x22\x20\x63\x6F\x6E\x74\x65\x6E\x74\x65\x64\x69\x74\x61\x62\x6C\x65\x3D\x22\x66\x61\x6C\x73\x65\x22\x3E","\x3C\x2F\x73\x70\x61\x6E\x3E","\x3A","\x6C\x65\x6E\x67\x74\x68","\x73\x75\x62\x73\x74\x72\x69\x6E\x67","\x63\x6F\x6C\x6F\x72\x69\x7A\x65\x45\x64\x69\x74\x61\x62\x6C\x65","\x3C\x65\x6D\x3E\x4E\x6F\x20\x64\x61\x74\x61\x3C\x2F\x65\x6D\x3E","\x5F\x69\x64","\x20\x22\x20\x3E","\x20\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x69\x6E\x6C\x69\x6E\x65\x22\x20\x63\x6F\x6E\x74\x65\x6E\x74\x65\x64\x69\x74\x61\x62\x6C\x65\x3D\x22\x74\x72\x75\x65\x22\x3E","\x20\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x69\x6E\x6C\x69\x6E\x65\x22\x20\x63\x6F\x6E\x74\x65\x6E\x74\x65\x64\x69\x74\x61\x62\x6C\x65\x3D\x22\x74\x72\x75\x65\x22\x3E\x22","\x22\x3C\x2F\x73\x70\x61\x6E\x3E","\x63\x6C\x6F\x73\x65\x54\x6F\x79","\x63\x75\x72\x72\x65\x6E\x74","\x63\x6C\x6F\x73\x65","\x73\x68\x6F\x75\x6C\x64\x4C\x6F\x67","\x6F\x70\x65\x6E\x54\x6F\x79","\x54\x6F\x79\x4B\x69\x74"];ToyKitData= new ReactiveDict(_0xae32[0]);ToyKit=ToyKitData;ToyKit[_0xae32[1]]=function(){var _0x5374x1=ToyKit[_0xae32[3]](_0xae32[2]);if(_0x5374x1){ToyKit[_0xae32[4]](_0xae32[2],false);ToyKit[_0xae32[4]](_0xae32[5],null)}else {ToyKit[_0xae32[4]](_0xae32[2],true);ToyKit[_0xae32[4]](_0xae32[5],null)}};ToyKit[_0xae32[6]]=function(){if(Package[_0xae32[7]]){return false};Tracker[_0xae32[11]](function(){Meteor[_0xae32[10]](_0xae32[8],MeteorToysDict[_0xae32[3]](_0xae32[9]))})};ToyKit[_0xae32[12]]=function(){$(document)[_0xae32[15]](function(_0x5374x2){if(_0x5374x2[_0xae32[13]]===77&&_0x5374x2[_0xae32[14]]){ToyKit[_0xae32[1]]()}})};ToyKit[_0xae32[16]]=function(){Meteor[_0xae32[22]](_0xae32[8],function(_0x5374x2,_0x5374x3){ToyKit[_0xae32[4]](_0xae32[17],_0x5374x3);if(!_0x5374x3){password=localStorage[_0xae32[19]](_0xae32[18]);email=localStorage[_0xae32[19]](_0xae32[20]);Meteor[_0xae32[22]](_0xae32[21],email,password,function(_0x5374x2,_0x5374x3){if(_0x5374x3){Meteor[_0xae32[22]](_0xae32[8],function(_0x5374x2,_0x5374x3){ToyKit[_0xae32[4]](_0xae32[17],_0x5374x3)})}else {if(localStorage[_0xae32[19]](_0xae32[20])){console[_0xae32[24]](_0xae32[23])}}})}else {password=localStorage[_0xae32[19]](_0xae32[18]);if(!password){ToyKit[_0xae32[25]]()}}})};ToyKit[_0xae32[25]]=function(){Meteor[_0xae32[22]](_0xae32[26],function(_0x5374x2,_0x5374x3){localStorage[_0xae32[28]](_0xae32[18],_0x5374x3[_0xae32[27]]);localStorage[_0xae32[28]](_0xae32[20],_0x5374x3[_0xae32[29]])})};ToyKit[_0xae32[30]]=function(){Meteor[_0xae32[22]](_0xae32[31],function(_0x5374x2,_0x5374x3){ToyKit[_0xae32[4]](_0xae32[32],_0x5374x3)})};MeteorToys= new ReactiveDict(_0xae32[8]);MeteorToys[_0xae32[33]]=function(_0x5374x4){var _0x5374x5=false;try{_0x5374x5=JSON[_0xae32[33]](_0x5374x4)}catch(error){_0x5374x5=String(_0x5374x4)};if( typeof _0x5374x5===_0xae32[34]){return _0x5374x4}else {return _0x5374x5}};MeteorToys[_0xae32[35]]=function(){ToyKit[_0xae32[4]](_0xae32[5])};MeteorToys[_0xae32[36]]=function(_0x5374x6){if( typeof _0x5374x6===_0xae32[37]){return _0xae32[38]};_0x5374x6=_0x5374x6[_0xae32[40]](/&/g,_0xae32[42])[_0xae32[40]](/</g,_0xae32[41])[_0xae32[40]](/>/g,_0xae32[39]);return _0x5374x6[_0xae32[40]](/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,function(_0x5374x7){var _0x5374x8=_0xae32[43];if(/^"/[_0xae32[44]](_0x5374x7)){if(/:$/[_0xae32[44]](_0x5374x7)){_0x5374x8=_0xae32[45]}else {_0x5374x8=_0xae32[46]}}else {if(/true|false/[_0xae32[44]](_0x5374x7)){_0x5374x8=_0xae32[47]}else {if(/null/[_0xae32[44]](_0x5374x7)){_0x5374x8=_0xae32[48]}}};quote=_0xae32[49]+_0x5374x8+_0xae32[50];switch(_0x5374x8){case _0xae32[45]:_0x5374x7=_0x5374x7[_0xae32[40]](/"/g,_0xae32[51]);_0x5374x7=_0x5374x7[_0xae32[40]](/:/g,_0xae32[51]);return quote+_0xae32[49]+_0x5374x8+_0xae32[52]+_0x5374x7+_0xae32[53]+quote+_0xae32[54];break;case _0xae32[43]:return _0xae32[49]+_0x5374x8+_0xae32[52]+_0x5374x7+_0xae32[53];break;case _0xae32[46]:_0x5374x7=_0x5374x7[_0xae32[56]](1,_0x5374x7[_0xae32[55]]-1);return quote+_0xae32[49]+_0x5374x8+_0xae32[52]+_0x5374x7+_0xae32[53]+quote;break;case _0xae32[47]:return _0xae32[49]+_0x5374x8+_0xae32[52]+_0x5374x7+_0xae32[53];break;case _0xae32[48]:return _0xae32[49]+_0x5374x8+_0xae32[52]+_0x5374x7+_0xae32[53];break}})};MeteorToys[_0xae32[57]]=function(_0x5374x6){if( typeof _0x5374x6===_0xae32[37]){return _0xae32[58]};_0x5374x6=_0x5374x6[_0xae32[40]](/&/g,_0xae32[42])[_0xae32[40]](/</g,_0xae32[41])[_0xae32[40]](/>/g,_0xae32[39]);return _0x5374x6[_0xae32[40]](/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,function(_0x5374x7){var _0x5374x8=_0xae32[43];if(/^"/[_0xae32[44]](_0x5374x7)){if(/:$/[_0xae32[44]](_0x5374x7)){_0x5374x8=_0xae32[45]}else {_0x5374x8=_0xae32[46]}}else {if(/true|false/[_0xae32[44]](_0x5374x7)){_0x5374x8=_0xae32[47]}else {if(/null/[_0xae32[44]](_0x5374x7)){_0x5374x8=_0xae32[48]}}};quote=_0xae32[49]+_0x5374x8+_0xae32[50];switch(_0x5374x8){case _0xae32[45]:_0x5374x7=_0x5374x7[_0xae32[40]](/"/g,_0xae32[51]);_0x5374x7=_0x5374x7[_0xae32[40]](/:/g,_0xae32[51]);if(_0x5374x7===_0xae32[59]){return quote+_0xae32[49]+_0x5374x8+_0xae32[60]+_0x5374x7+_0xae32[53]+quote+_0xae32[54]}else {return quote+_0xae32[49]+_0x5374x8+_0xae32[61]+_0x5374x7+_0xae32[53]+quote+_0xae32[54]};break;case _0xae32[43]:return _0xae32[49]+_0x5374x8+_0xae32[61]+_0x5374x7+_0xae32[53];break;case _0xae32[46]:_0x5374x7=_0x5374x7[_0xae32[56]](1,_0x5374x7[_0xae32[55]]-1);return _0xae32[49]+_0x5374x8+_0xae32[62]+_0x5374x7+_0xae32[63];break;case _0xae32[47]:return _0xae32[49]+_0x5374x8+_0xae32[61]+_0x5374x7+_0xae32[53];break;case _0xae32[48]:return _0xae32[49]+_0x5374x8+_0xae32[61]+_0x5374x7+_0xae32[53];break}})};MeteorToys[_0xae32[64]]=function(){if(ToyKit[_0xae32[3]](_0xae32[65])){ToyKit[_0xae32[4]](_0xae32[65],null)}else {window[_0xae32[8]][_0xae32[66]]()}};MeteorToys[_0xae32[67]]=function(){if( typeof METEORTOYS_DISABLE_LOGGING===_0xae32[37]){return true}else {return false}};MeteorToys[_0xae32[68]]=function(_0x5374x9){MeteorToys[_0xae32[4]](_0xae32[65],_0x5374x9)};MeteorToys[_0xae32[69]]=ToyKitData;MeteorToysDict=MeteorToys;MeteorToys_JSON=MeteorToys
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteortoys_toykit/client/template.main.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //

Template.__checkName("MeteorToys");
Template["MeteorToys"] = new Template("Template.MeteorToys", (function() {
  var view = this;
  return [ HTML.Raw("<!-- Meteor Toys Begin -->\n\t"), Blaze.If(function() {
    return Spacebars.call(view.lookup("MeteorToys"));
  }, function() {
    return [ "\n\t\t", Blaze.If(function() {
      return Spacebars.call(view.lookup("MeteorToysCordova"));
    }, function() {
      return [ "\n\t\t\t", Blaze.If(function() {
        return Spacebars.call(view.lookup("MeteorToys_Pro"));
      }, function() {
        return [ "\n\t\t\t\t", Spacebars.include(view.lookupTemplate("MeteorToysMobile")), "\n\t\t\t" ];
      }), "\n\t\t" ];
    }, function() {
      return [ " \n\t\t", Blaze.If(function() {
        return Spacebars.call(view.lookup("MeteorToys_Pro"));
      }, function() {
        return [ "\n\t\t\t\t", Spacebars.include(view.lookupTemplate("MeteorToys_tooltip")), "\n\t\t\t\t", HTML.DIV({
          class: "MeteorToys_orbs MeteorToysReset"
        }, "\n\t\t\n\t\t\t\t\t", Blaze.Each(function() {
          return Spacebars.call(view.lookup("MeteorToy"));
        }, function() {
          return [ "\n\t\t\t\t\t\t", Blaze._TemplateWith(function() {
            return {
              template: Spacebars.call(view.lookup("."))
            };
          }, function() {
            return Spacebars.include(function() {
              return Spacebars.call(Template.__dynamic);
            });
          }), "\n\t\t\t\t\t" ];
        }), "\n\t\t\n\t\t\t\t\t", Blaze.Each(function() {
          return Spacebars.call(view.lookup("MeteorToy_addon"));
        }, function() {
          return [ "\n\t\t\t\n\t\t\t\t\t\t\t", Blaze._TemplateWith(function() {
            return {
              template: Spacebars.call(view.lookup("."))
            };
          }, function() {
            return Spacebars.include(function() {
              return Spacebars.call(Template.__dynamic);
            });
          }), "\n\t\t\t\n\t\t\t\t\t" ];
        }), "\n\t\t\n\t\t\t\t"), "\n\t\t\t\t", Spacebars.include(view.lookupTemplate("MeteorToys_notifications")), "\n\t\t\t" ];
      }, function() {
        return [ "\n\t\t\t\t", HTML.DIV({
          class: "MeteorToys_orbs MeteorToysReset"
        }, "\n\t\t\t\t\t", Blaze._TemplateWith(function() {
          return {
            template: Spacebars.call(view.lookup("all"))
          };
        }, function() {
          return Spacebars.include(function() {
            return Spacebars.call(Template.__dynamic);
          });
        }), "\n\t\t\t\t\t", Blaze.Each(function() {
          return Spacebars.call(view.lookup("MeteorToy_addon"));
        }, function() {
          return [ "\n\t\t\t\n\t\t\t\t\t\t\t", Blaze._TemplateWith(function() {
            return {
              template: Spacebars.call(view.lookup("."))
            };
          }, function() {
            return Spacebars.include(function() {
              return Spacebars.call(Template.__dynamic);
            });
          }), "\n\t\t\t\n\t\t\t\t\t" ];
        }), "\n\t\t\t\t"), "\n\t\t\t" ];
      }), "\n\n\n\n\t\t\t", Blaze.Each(function() {
        return Spacebars.call(view.lookup("MeteorToysPackage"));
      }, function() {
        return [ "\n\t\t\t\t", Blaze._TemplateWith(function() {
          return {
            template: Spacebars.call(view.lookup("."))
          };
        }, function() {
          return Spacebars.include(function() {
            return Spacebars.call(Template.__dynamic);
          });
        }), "\n\t\t\t" ];
      }), "\n\n\t\t" ];
    }), "\n\t" ];
  }, function() {
    return [ "\n\t\t", Blaze.If(function() {
      return Spacebars.call(view.lookup("MTtoggle"));
    }, function() {
      return [ "\n\t\t\t", Spacebars.include(view.lookupTemplate("MeteorToysToggle")), "\n\t\t" ];
    }), "\n\t" ];
  }), "\n\t\n\t", Spacebars.include(view.lookupTemplate("MeteorToys_notification_widget")), HTML.Raw("\n<!-- Meteor Toys End -->") ];
}));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteortoys_toykit/client/notifications/template.notifications.js                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //

Template.__checkName("MeteorToys_notifications");
Template["MeteorToys_notifications"] = new Template("Template.MeteorToys_notifications", (function() {
  var view = this;
  return Blaze.If(function() {
    return Spacebars.call(view.lookup("notifications_exist"));
  }, function() {
    return [ "\n\t", HTML.DIV({
      id: "MeteorToys_notifications",
      class: "MeteorToys_notifications MeteorToys_hide_Notifications",
      oncontextmenu: '$(".MeteorToys_notification").addClass("MeteorToys_Notifier_hideAnimation"); window.setTimeout(function() {Package["meteortoys:toykit"].MeteorToysNotifications.remove({});}, 300); return false;'
    }, "\n\t\t", Blaze.Each(function() {
      return Spacebars.call(view.lookup("notifications"));
    }, function() {
      return [ "\n\t\t\t", Blaze._TemplateWith(function() {
        return {
          template: Spacebars.call(view.lookup("type"))
        };
      }, function() {
        return Spacebars.include(function() {
          return Spacebars.call(Template.__dynamic);
        });
      }), "\n\t\t" ];
    }), "\n\t"), "\n" ];
  });
}));

Template.__checkName("MeteorToys_notification_counter");
Template["MeteorToys_notification_counter"] = new Template("Template.MeteorToys_notification_counter", (function() {
  var view = this;
  return HTML.DIV({
    class: "MeteorToys_notification MeteorToys_notification_counter",
    id: function() {
      return [ "MeteorToys_", Spacebars.mustache(view.lookup("_id")) ];
    }
  }, "\n\t\t", HTML.DIV({
    class: "MeteorToys_notification_symbol"
  }, HTML.STRONG(Blaze.View("lookup:data", function() {
    return Spacebars.mustache(view.lookup("data"));
  }))), "\n\t\t", HTML.DIV({
    class: "MeteorToys_notification_text"
  }, Blaze.View("lookup:text", function() {
    return Spacebars.makeRaw(Spacebars.mustache(view.lookup("text")));
  })), "\n\t");
}));

Template.__checkName("MeteorToys_notification_text");
Template["MeteorToys_notification_text"] = new Template("Template.MeteorToys_notification_text", (function() {
  var view = this;
  return HTML.DIV({
    class: "MeteorToys_notification",
    id: function() {
      return [ "MeteorToys_", Spacebars.mustache(view.lookup("_id")) ];
    }
  }, HTML.Raw('\n\t\t<div class="MeteorToys_notification_symbol"><strong></strong></div>\n\t\t'), HTML.DIV({
    class: "MeteorToys_notification_text"
  }, Blaze.View("lookup:text", function() {
    return Spacebars.makeRaw(Spacebars.mustache(view.lookup("text")));
  })), "\n\t");
}));

Template.__checkName("MeteorToys_notification_data");
Template["MeteorToys_notification_data"] = new Template("Template.MeteorToys_notification_data", (function() {
  var view = this;
  return HTML.DIV({
    class: function() {
      return [ "MeteorToys_notification ", Spacebars.mustache(view.lookup("expanded")) ];
    },
    id: function() {
      return [ "MeteorToys_", Spacebars.mustache(view.lookup("_id")) ];
    }
  }, HTML.Raw('\n\t\t<div class="MeteorToys_notification_symbol">\n\t\t\t<div class="MeteorToys_notification_triangle"></div>\n\t\t</div>\n\t\t'), HTML.DIV({
    class: "MeteorToys_notification_text"
  }, Blaze.View("lookup:text", function() {
    return Spacebars.makeRaw(Spacebars.mustache(view.lookup("text")));
  })), "\n\t\t", Blaze.If(function() {
    return Spacebars.call(view.lookup("lazyload"));
  }, function() {
    return [ HTML.DIV({
      class: "MeteorToys_notification_data"
    }, "\n", HTML.PRE(Blaze.View("lookup:data", function() {
      return Spacebars.makeRaw(Spacebars.mustache(view.lookup("data")));
    })), "\n\t\t"), "\n\t\t" ];
  }), "\n\t");
}));

Template.__checkName("MeteorToys_notification_widget");
Template["MeteorToys_notification_widget"] = new Template("Template.MeteorToys_notification_widget", (function() {
  var view = this;
  return Blaze.If(function() {
    return Spacebars.call(view.lookup("count"));
  }, function() {
    return [ "\n\t", HTML.DIV({
      class: "MeteorToys_notification_widget"
    }, "\n\t\t", Blaze.View("lookup:count", function() {
      return Spacebars.mustache(view.lookup("count"));
    }), "\n\t"), "\n\t" ];
  });
}));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteortoys_toykit/client/welcome/template.welcome.js                                                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //

Template.__checkName("MeteorToys_basic");
Template["MeteorToys_basic"] = new Template("Template.MeteorToys_basic", (function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return {
      name: Spacebars.call("MeteorToys_basic")
    };
  }, function() {
    return Spacebars.include(view.lookupTemplate("MeteorToy"), function() {
      return [ "\n\t\t", HTML.DIV({
        class: "MeteorToys_Method_header"
      }, "\n\t\t\t", HTML.DIV({
        class: "MeteorToys_name"
      }, HTML.STRONG("Meteor Toys Pro")), "\n\t\t"), "\n\t\t", HTML.DIV({
        style: "padding-left: 8px"
      }, "\n\n\t\t", HTML.FORM("\n\t\t\t", HTML.DIV({
        class: "MeteorToys_row"
      }, "\n\t\t\t\t", HTML.INPUT({
        id: "meteortoyscadf"
      }), "\n\t\t\t\t", HTML.DIV({
        class: "MeteorToys_row_name"
      }, "Email"), "\n\t\t\t"), "\n\n\t\t\t", HTML.DIV({
        class: "MeteorToys_row"
      }, "\n\t\t\t\t", HTML.INPUT({
        id: "meteortoyspass"
      }), "\n\t\t\t\t", HTML.DIV({
        class: "MeteorToys_row_name"
      }, "Key"), "\n\t\t\t"), "\n\n\t\t\t", HTML.INPUT({
        type: "submit",
        value: "Activate",
        style: "margin-top: -4px; padding-right: 8px; margin-left: -8px; border-right: 8px sold transparent;"
      }), "\n\n\t\t\t", HTML.Comment(' <div style="position: absolute; bottom: 14px; left: 12px"> '), "\n\t\t\t", HTML.DIV({
        style: "height: 156px"
      }), "\n\t\t\tExperience the next level", HTML.BR(), " of Mongol and JetSetter. ", HTML.BR(), "\n\t\t\t", HTML.A({
        href: "http://bit.ly/1FqdsPM"
      }, "Upgrade to Meteor Toys Pro ", HTML.CharRef({
        html: "&raquo;",
        str: "»"
      })), "\n\t\t\t", HTML.Comment(" </div> "), "\n\n\t\t"), "\n\t\t"), "\n\t" ];
    });
  });
}));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteortoys_toykit/client/orb/template.orb.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //

Template.__checkName("MeteorToy");
Template["MeteorToy"] = new Template("Template.MeteorToy", (function() {
  var view = this;
  return HTML.DIV({
    class: function() {
      return [ "MeteorToys_orb MeteorToys_hide_Orb ", Spacebars.mustache(view.lookup("type")), " ", Spacebars.mustache(view.lookup("state")) ];
    },
    id: function() {
      return Spacebars.mustache(view.lookup("name"));
    },
    oncontextmenu: "Package['meteortoys:toykit'].MeteorToys.closeToy();return false;"
  }, "\n\t\t", Blaze.If(function() {
    return Spacebars.call(view.lookup("empty"));
  }, function() {
    return [ "\n\t\t\t", Blaze._InOuterTemplateScope(view, function() {
      return Spacebars.include(function() {
        return Spacebars.call(view.templateContentBlock);
      });
    }), "\n\t\t" ];
  }, function() {
    return [ "\n\t\t\t", HTML.DIV({
      class: "MeteorToys_icon"
    }), "\n\t\t\t", HTML.DIV({
      class: "MeteorToys_orb_wrapper"
    }, "\n\t\t\t\t", Blaze.If(function() {
      return Spacebars.call(view.lookup("load"));
    }, function() {
      return [ "\n\t\t\t\t\t", Blaze._InOuterTemplateScope(view, function() {
        return Spacebars.include(function() {
          return Spacebars.call(view.templateContentBlock);
        });
      }), "\n\t\t\t\t" ];
    }), "\n\t\t\t"), "\n\t\t" ];
  }), "\n\t");
}));

Template.__checkName("MeteorToys_tooltip");
Template["MeteorToys_tooltip"] = new Template("Template.MeteorToys_tooltip", (function() {
  var view = this;
  return Blaze.If(function() {
    return Spacebars.call(view.lookup("display"));
  }, function() {
    return [ "\n\t", HTML.DIV({
      class: "MeteorToys_tooltip_wrapper MeteorToys_notification_fadeInUp",
      style: function() {
        return [ "left: ", Spacebars.mustache(view.lookup("position")), "px;" ];
      }
    }, "\n\t\t", HTML.DIV({
      class: "MeteorToys_tooltip "
    }, "\n\t\t\t", HTML.DIV({
      class: "MeteorToys_tooltip_arrow1"
    }), "\n\t\t\t", HTML.DIV({
      class: "MeteorToys_tooltip_arrow2"
    }), "\n\t\t\t", Blaze.View("lookup:name", function() {
      return Spacebars.mustache(view.lookup("name"));
    }), "\n\t\t"), "\n\t"), "\n\t" ];
  });
}));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/meteortoys_toykit/client/main.js                                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _0x2449=["\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x4E\x6F\x74\x69\x66\x79","\x63\x6F\x75\x6E\x74\x65\x72","\x73\x65\x74","\x64\x69\x73\x70\x6C\x61\x79","\x67\x65\x74","\x6C\x6F\x67","\x75\x70\x64\x61\x74\x65","\x69\x6E\x73\x65\x72\x74","\x66\x69\x6E\x64\x4F\x6E\x65","\x5F\x69\x64","\x69\x6E\x63\x72\x65\x6D\x65\x6E\x74\x43\x6F\x75\x6E\x74\x65\x72","\x74\x65\x78\x74","\x75\x6E\x72\x65\x61\x64","\x74\x79\x70\x65","\x64\x61\x74\x61","\x63\x75\x72\x72\x65\x6E\x74","\x66\x6F\x63\x75\x73","\x66\x6F\x63\x75\x73\x32","\x65\x71\x75\x61\x6C\x73","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x4E\x6F\x74\x69\x66\x69\x65\x72\x5F\x68\x69\x64\x65\x41\x6E\x69\x6D\x61\x74\x69\x6F\x6E","\x61\x64\x64\x43\x6C\x61\x73\x73","\x23\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F","\x72\x65\x6D\x6F\x76\x65","\x73\x65\x74\x54\x69\x6D\x65\x6F\x75\x74","\x65\x78\x70\x61\x6E\x64","\x2E\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6E\x6F\x74\x69\x66\x69\x63\x61\x74\x69\x6F\x6E","\x61\x75\x74\x6F\x72\x75\x6E","\x66\x69\x6E\x64","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6E\x6F\x74\x69\x66\x69\x63\x61\x74\x69\x6F\x6E\x5F","\x68\x65\x6C\x70\x65\x72\x73","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6E\x6F\x74\x69\x66\x69\x63\x61\x74\x69\x6F\x6E\x73","\x65\x78\x70\x61\x6E\x64\x4F\x72\x52\x65\x6D\x6F\x76\x65","\x73\x74\x6F\x70\x50\x72\x6F\x70\x61\x67\x61\x74\x69\x6F\x6E","\x73\x68\x72\x69\x6E\x6B","\x65\x76\x65\x6E\x74\x73","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6E\x6F\x74\x69\x66\x69\x63\x61\x74\x69\x6F\x6E\x5F\x64\x61\x74\x61\x5F\x65\x78\x70\x61\x6E\x64\x65\x64","\x63\x6F\x6C\x6F\x72\x69\x7A\x65","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6E\x6F\x74\x69\x66\x69\x63\x61\x74\x69\x6F\x6E\x5F\x64\x61\x74\x61","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6E\x6F\x74\x69\x66\x69\x63\x61\x74\x69\x6F\x6E\x5F\x77\x69\x64\x67\x65\x74","\x6B\x65\x79\x43\x6F\x64\x65","\x63\x74\x72\x6C\x4B\x65\x79","\x63\x6C\x65\x61\x72\x41\x6C\x6C\x44\x61\x74\x61","\x6B\x65\x79\x64\x6F\x77\x6E","\x6E\x61\x6D\x65","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x61\x75\x74\x6F\x70\x75\x62","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x72\x65\x6C\x6F\x61\x64","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6F\x72\x62\x5F\x61\x63\x74\x69\x76\x65","\x68\x61\x73\x43\x6C\x61\x73\x73","\x23","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79","\x62\x75\x74\x74\x6F\x6E","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x62\x75\x74\x74\x6F\x6E","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6F\x72\x62\x5F\x63\x6F\x6E\x64\x65\x6E\x73\x65\x64","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x65\x6D\x61\x69\x6C","\x63\x6F\x72\x65","\x72\x65\x67\x69\x73\x74\x72\x79","\x61\x64\x64\x6F\x6E","\x55\x4E\x4B\x4E\x4F\x57\x4E","\x6C\x65\x66\x74","\x70\x6F\x73\x69\x74\x69\x6F\x6E","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x74\x6F\x6F\x6C\x74\x69\x70","\x6D\x65\x74\x65\x6F\x72\x74\x6F\x79\x73\x3A\x6E\x6F\x74\x69\x66\x69\x63\x61\x74\x69\x6F\x6E\x73","\x4E\x6F\x74\x65","\x54\x6F\x20\x75\x73\x65\x20\x4D\x65\x74\x65\x6F\x72\x20\x54\x6F\x79\x73\x20\x6E\x6F\x74\x69\x66\x69\x63\x61\x74\x69\x6F\x6E\x73\x2C\x20\x79\x6F\x75\x20\x6D\x75\x73\x74\x20\x69\x6E\x73\x74\x61\x6C\x6C\x20\x74\x68\x65\x20\x6E\x6F\x74\x69\x66\x69\x63\x61\x74\x69\x6F\x6E\x73\x20\x70\x61\x63\x6B\x61\x67\x65\x2E","\x46\x6F\x72\x20\x74\x68\x65\x20\x77\x68\x79\x20\x61\x6E\x64\x20\x68\x6F\x77\x2C\x20\x67\x6F\x20\x74\x6F\x3A\x20\x68\x74\x74\x70\x73\x3A\x2F\x2F\x67\x69\x74\x68\x75\x62\x2E\x63\x6F\x6D\x2F\x6D\x65\x74\x65\x6F\x72\x74\x6F\x79\x73\x2F\x6E\x6F\x74\x69\x66\x69\x63\x61\x74\x69\x6F\x6E\x73","\x62\x6F\x64\x79","\x72\x65\x6E\x64\x65\x72","\x64\x65\x66\x65\x72","\x63\x68\x65\x63\x6B\x41\x75\x74\x68\x65\x6E\x74\x69\x63\x61\x74\x69\x6F\x6E","\x73\x74\x61\x72\x74\x53\x75\x62\x73\x63\x72\x69\x70\x74\x69\x6F\x6E","\x62\x69\x6E\x64\x48\x6F\x74\x4B\x65\x79\x73","\x67\x72\x61\x62\x54\x6F\x79\x73","\x73\x74\x61\x72\x74\x75\x70","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x50\x72\x6F","\x61\x75\x74\x68\x65\x6E\x74\x69\x63\x61\x74\x65\x64","\x72\x65\x67\x69\x73\x74\x65\x72\x48\x65\x6C\x70\x65\x72","\x6B\x65\x79\x73","\x6D\x73\x61\x76\x69\x6E\x3A\x6D\x6F\x6E\x67\x6F\x6C","\x4D\x6F\x6E\x67\x6F\x6C","\x70\x75\x73\x68","\x6D\x73\x61\x76\x69\x6E\x3A\x6A\x65\x74\x73\x65\x74\x74\x65\x72","\x4A\x65\x74\x53\x65\x74\x74\x65\x72","\x6D\x65\x74\x65\x6F\x72\x74\x6F\x79\x73\x3A\x61\x6C\x6C\x74\x68\x69\x6E\x67\x73","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x62\x61\x73\x69\x63","\x6D\x65\x74\x65\x6F\x72\x74\x6F\x79\x73\x3A\x6D\x6F\x62\x69\x6C\x65","\x6F\x62\x6A\x65\x63\x74","\x70\x6C\x61\x74\x66\x6F\x72\x6D","\x69\x50\x68\x6F\x6E\x65","\x6D\x65\x74\x65\x6F\x72\x74\x6F\x79\x73\x3A\x74\x6F\x67\x67\x6C\x65","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73","\x63\x6C\x65\x61\x72","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x70\x61\x73\x73\x77\x6F\x72\x64","\x67\x65\x74\x49\x74\x65\x6D","\x73\x65\x74\x49\x74\x65\x6D","\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x72\x65\x6D\x6F\x76\x65","\x54\x68\x65\x72\x65\x20\x77\x61\x73\x20\x61\x6E\x20\x65\x72\x72\x6F\x72\x20\x72\x65\x6D\x6F\x76\x69\x6E\x67\x20\x74\x68\x65\x20\x4D\x65\x74\x65\x6F\x72\x20\x54\x6F\x79\x73\x20\x6B\x65\x79\x73\x2E","\x72\x65\x6D\x6F\x76\x65\x49\x74\x65\x6D","\x4D\x65\x74\x65\x6F\x72\x20\x54\x6F\x79\x73\x20\x68\x61\x73\x20\x62\x65\x65\x6E\x20\x72\x65\x6D\x6F\x76\x65\x64\x20\x66\x72\x6F\x6D\x20\x74\x68\x69\x73\x20\x62\x72\x6F\x77\x73\x65\x72\x2E\x20\x42\x65\x20\x73\x75\x72\x65\x20\x74\x6F\x20\x72\x75\x6E\x20\x74\x68\x69\x73\x20\x66\x6F\x72\x20\x65\x61\x63\x68\x20\x62\x72\x6F\x77\x73\x65\x72\x20\x79\x6F\x75\x20\x75\x73\x65\x20\x66\x6F\x72\x20\x64\x65\x62\x75\x67\x67\x69\x6E\x67\x2E","\x72\x65\x6C\x6F\x61\x64","\x6C\x6F\x63\x61\x74\x69\x6F\x6E","\x63\x61\x6C\x6C","\x6F\x70\x65\x6E","\x63\x6C\x6F\x73\x65","\x70\x72\x65\x76\x65\x6E\x74\x44\x65\x66\x61\x75\x6C\x74","\x76\x61\x6C","\x23\x6D\x65\x74\x65\x6F\x72\x74\x6F\x79\x73\x63\x61\x64\x66","\x23\x6D\x65\x74\x65\x6F\x72\x74\x6F\x79\x73\x70\x61\x73\x73","","\x50\x6C\x65\x61\x73\x65\x20\x65\x6E\x74\x65\x72\x20\x61\x6E\x20\x65\x6D\x61\x69\x6C","\x50\x6C\x65\x61\x73\x65\x20\x65\x6E\x74\x65\x72\x20\x61\x20\x6C\x69\x63\x65\x6E\x73\x65","\x4D\x6F\x6E\x67\x6F\x6C\x5F\x76\x65\x72\x69\x66\x79\x44\x6F\x63","\x54\x68\x61\x6E\x6B\x73\x20\x66\x6F\x72\x20\x62\x75\x79\x69\x6E\x67\x20\x4D\x65\x74\x65\x6F\x72\x20\x54\x6F\x79\x73\x21","\x49\x6E\x76\x61\x6C\x69\x64\x20\x43\x72\x65\x64\x65\x6E\x74\x69\x61\x6C\x73\x2E\x20\x50\x6C\x65\x61\x73\x65\x20\x74\x72\x79\x20\x61\x67\x61\x69\x6E\x2E"];MeteorToysNotifications= new Mongo.Collection(null);MeteorToysNotifyDict= new ReactiveDict(_0x2449[0]);MeteorToysNotifyDict[_0x2449[2]](_0x2449[1],0);Note=function(_0xd6b5x1,_0xd6b5x2){if(_0xd6b5x2===_0x2449[1]){Counter(_0xd6b5x1)}else {Data(_0xd6b5x1,_0xd6b5x2)};if(ToyKit[_0x2449[4]](_0x2449[3])===false){current=MeteorToysNotifyDict[_0x2449[4]](_0x2449[1]);MeteorToysNotifyDict[_0x2449[4]](_0x2449[1],current+1);console[_0x2449[5]](MeteorToysNotifyDict[_0x2449[4]](_0x2449[1]))}};Counter=function(_0xd6b5x1){var _0xd6b5x3;var _0xd6b5x4=function(){MeteorToysNotifications[_0x2449[6]]({type:_0x2449[1],text:_0xd6b5x1},{$inc:{data:+1}})};var _0xd6b5x5=function(){var _0xd6b5x6=MeteorToysNotifications[_0x2449[7]]({type:_0x2449[1],data:1,text:_0xd6b5x1,unread:true});_0xd6b5x3=_0xd6b5x6};var _0xd6b5x2=MeteorToysNotifications[_0x2449[8]]({"\x74\x79\x70\x65":_0x2449[1],"\x74\x65\x78\x74":_0xd6b5x1});if(_0xd6b5x2){_0xd6b5x4();_0xd6b5x3=_0xd6b5x2[_0x2449[9]]}else {_0xd6b5x5()};NotifyInternal[_0x2449[10]]()};Data=function(_0xd6b5x1,_0xd6b5x2){item={};item[_0x2449[11]]=_0xd6b5x1;item[_0x2449[12]]=true;if(_0xd6b5x2){item[_0x2449[13]]=_0x2449[14];item[_0x2449[14]]=_0xd6b5x2}else {item[_0x2449[13]]=_0x2449[11]};var _0xd6b5x7=MeteorToysNotifications[_0x2449[7]](item);NotifyInternal[_0x2449[10]]()};NotifyClose=function(){MeteorToysNotifyDict[_0x2449[2]](_0x2449[15],null);MeteorToysNotifyDict[_0x2449[2]](_0x2449[16],null);MeteorToysNotifyDict[_0x2449[2]](_0x2449[17],null)};NotifyInternal={"\x65\x78\x70\x61\x6E\x64":function(){MeteorToysNotifyDict[_0x2449[2]](_0x2449[15],self._id)},"\x72\x65\x6D\x6F\x76\x65":function(){if(MeteorToysNotifyDict[_0x2449[18]](_0x2449[15],self._id)){MeteorToysNotifyDict[_0x2449[2]](_0x2449[15],false)};$(_0x2449[21]+self[_0x2449[9]])[_0x2449[20]](_0x2449[19]);window[_0x2449[23]](function(){MeteorToysNotifications[_0x2449[22]](self._id)},300)},"\x65\x78\x70\x61\x6E\x64\x4F\x72\x52\x65\x6D\x6F\x76\x65":function(){if(MeteorToysNotifyDict[_0x2449[18]](_0x2449[15],self._id)){NotifyInternal[_0x2449[22]](self._id)}else {NotifyInternal[_0x2449[24]]()}},"\x73\x68\x72\x69\x6E\x6B":function(){MeteorToysNotifyDict[_0x2449[2]](_0x2449[15],false)},"\x63\x6C\x65\x61\x72\x41\x6C\x6C\x44\x61\x74\x61":function(){$(_0x2449[25])[_0x2449[20]](_0x2449[19]);window[_0x2449[23]](function(){MeteorToysNotifications[_0x2449[22]]({})},300)},"\x69\x6E\x63\x72\x65\x6D\x65\x6E\x74\x43\x6F\x75\x6E\x74\x65\x72":function(){if(ToyKit[_0x2449[4]](_0x2449[3])){return};current=MeteorToysNotifyDict[_0x2449[4]](_0x2449[1]);if(current){MeteorToysNotifyDict[_0x2449[2]](_0x2449[1],current+1)}else {MeteorToysNotifyDict[_0x2449[2]](_0x2449[1],1)}}};Tracker[_0x2449[26]](function(){if(ToyKit[_0x2449[4]](_0x2449[3])){MeteorToysNotifyDict[_0x2449[2]](_0x2449[1],0)}});Template[_0x2449[30]][_0x2449[29]]({"\x6E\x6F\x74\x69\x66\x69\x63\x61\x74\x69\x6F\x6E\x73\x5F\x65\x78\x69\x73\x74":function(){if(MeteorToysNotifications[_0x2449[8]]()){return true}},"\x6E\x6F\x74\x69\x66\x69\x63\x61\x74\x69\x6F\x6E\x73":function(){return MeteorToysNotifications[_0x2449[27]]()},"\x74\x79\x70\x65":function(){return _0x2449[28]+this[_0x2449[13]]}});Template[_0x2449[30]][_0x2449[34]]({"\x63\x6C\x69\x63\x6B\x20\x2E\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6E\x6F\x74\x69\x66\x69\x63\x61\x74\x69\x6F\x6E":function(){self=this;if(self[_0x2449[13]]===_0x2449[14]){NotifyInternal[_0x2449[31]]()}else {NotifyInternal[_0x2449[22]]()}},"\x63\x6C\x69\x63\x6B\x20\x2E\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6E\x6F\x74\x69\x66\x69\x63\x61\x74\x69\x6F\x6E\x5F\x73\x79\x6D\x62\x6F\x6C":function(_0xd6b5x8){_0xd6b5x8[_0x2449[32]]();self=this;if(MeteorToysNotifyDict[_0x2449[18]](_0x2449[15],this._id)){NotifyInternal[_0x2449[33]]()}else {if(self[_0x2449[13]]===_0x2449[14]){NotifyInternal[_0x2449[24]]()}}},"\x63\x6C\x69\x63\x6B\x20\x2E\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6E\x6F\x74\x69\x66\x69\x63\x61\x74\x69\x6F\x6E\x5F\x64\x61\x74\x61":function(_0xd6b5x8){_0xd6b5x8[_0x2449[32]]()},"\x6D\x6F\x75\x73\x65\x6F\x76\x65\x72\x20\x2E\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6E\x6F\x74\x69\x66\x69\x63\x61\x74\x69\x6F\x6E":function(){MeteorToysNotifyDict[_0x2449[2]](_0x2449[16],this._id)},"\x6D\x6F\x75\x73\x65\x6F\x75\x74\x20\x2E\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6E\x6F\x74\x69\x66\x69\x63\x61\x74\x69\x6F\x6E":function(){MeteorToysNotifyDict[_0x2449[2]](_0x2449[16],false);current=MeteorToysNotifyDict[_0x2449[4]](_0x2449[15]);MeteorToysNotifyDict[_0x2449[2]](_0x2449[17],current)}});Template[_0x2449[37]][_0x2449[29]]({"\x65\x78\x70\x61\x6E\x64\x65\x64":function(){if(MeteorToysNotifyDict[_0x2449[18]](_0x2449[15],this._id)){return _0x2449[35]}else {return false}},"\x6C\x61\x7A\x79\x6C\x6F\x61\x64":function(){if(MeteorToysNotifyDict[_0x2449[18]](_0x2449[15],this._id)){return true};if(MeteorToysNotifyDict[_0x2449[18]](_0x2449[16],this._id)){return true};if(MeteorToysNotifyDict[_0x2449[18]](_0x2449[17],this._id)){return true}},"\x64\x61\x74\x61":function(){return MeteorToys[_0x2449[36]](this[_0x2449[14]])}});Template[_0x2449[38]][_0x2449[29]]({"\x63\x6F\x75\x6E\x74":function(){return MeteorToysNotifyDict[_0x2449[4]](_0x2449[1])}});Template[_0x2449[38]][_0x2449[34]]({"\x63\x6C\x69\x63\x6B":function(){ToyKit[_0x2449[2]](_0x2449[3],true)}});$(document)[_0x2449[42]](function(_0xd6b5x8){if(_0xd6b5x8[_0x2449[39]]===67&&_0xd6b5x8[_0x2449[40]]){NotifyInternal[_0x2449[41]]();MeteorToysNotifyDict[_0x2449[2]](_0x2449[15])}});Template[_0x2449[49]][_0x2449[34]]({"\x63\x6C\x69\x63\x6B\x20\x2E\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6F\x72\x62":function(){if(this[_0x2449[43]]===_0x2449[44]){return false};if(this[_0x2449[43]]===_0x2449[45]){return false};if(ToyKit[_0x2449[4]](_0x2449[15])===this[_0x2449[43]]){ToyKit[_0x2449[2]](_0x2449[15],false)}else {ToyKit[_0x2449[2]](_0x2449[15],this[_0x2449[43]])}},"\x63\x6C\x69\x63\x6B\x20\x2E\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6F\x72\x62\x5F\x77\x72\x61\x70\x70\x65\x72":function(_0xd6b5x9,_0xd6b5xa){if($(_0x2449[48]+this[_0x2449[43]])[_0x2449[47]](_0x2449[46])){_0xd6b5x9[_0x2449[32]]()}},"\x63\x6C\x69\x63\x6B\x20\x2E\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6E\x61\x6D\x65":function(){ToyKit[_0x2449[2]](_0x2449[15],false)},"\x6D\x6F\x75\x73\x65\x6F\x76\x65\x72\x20\x2E\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6F\x72\x62":function(){ToyKit[_0x2449[2]](_0x2449[16],this[_0x2449[43]])},"\x6D\x6F\x75\x73\x65\x6F\x75\x74\x20\x2E\x4D\x65\x74\x65\x6F\x72\x54\x6F\x79\x73\x5F\x6F\x72\x62":function(){ToyKit[_0x2449[2]](_0x2449[16])}});Template[_0x2449[49]][_0x2449[29]]({type:function(){if(this[_0x2449[13]]===_0x2449[50]){return _0x2449[51]}},state:function(){if(ToyKit[_0x2449[18]](_0x2449[15],this[_0x2449[43]])){return _0x2449[46]}else {return _0x2449[52]}},load:function(){if(this[_0x2449[43]]===_0x2449[53]){return true};if(ToyKit[_0x2449[18]](_0x2449[15],this[_0x2449[43]])){return true};if(ToyKit[_0x2449[18]](_0x2449[16],this[_0x2449[43]])){return true}},tmpName:function(){}});Template[_0x2449[60]][_0x2449[29]]({display:function(){var _0xd6b5xb=ToyKit[_0x2449[4]](_0x2449[16]);if(ToyKit[_0x2449[18]](_0x2449[15],_0xd6b5xb)){return false};if(ToyKit[_0x2449[4]](_0x2449[16])){return true}},name:function(){var _0xd6b5xb=ToyKit[_0x2449[4]](_0x2449[16]);if(_0xd6b5xb){if(ToyKit[_0x2449[4]](_0x2449[55])[_0x2449[54]][_0xd6b5xb]){return ToyKit[_0x2449[4]](_0x2449[55])[_0x2449[54]][_0xd6b5xb][_0x2449[43]]}else {if(ToyKit[_0x2449[4]](_0x2449[55])[_0x2449[56]][_0xd6b5xb]){return ToyKit[_0x2449[4]](_0x2449[55])[_0x2449[56]][_0xd6b5xb][_0x2449[43]]}else {return _0x2449[57]}}}},position:function(){name=ToyKit[_0x2449[4]](_0x2449[16]);pixels=$(_0x2449[48]+name)[_0x2449[59]]()[_0x2449[58]];current=ToyKit[_0x2449[4]](_0x2449[16]);position=$(_0x2449[48]+name)[_0x2449[59]]()[_0x2449[58]]+7,coordinate=(200-46)* -0.5,pixels=coordinate+position;return pixels}});if(Package[_0x2449[61]]){}else {window[_0x2449[62]]=function(){console[_0x2449[5]](_0x2449[63]);console[_0x2449[5]](_0x2449[64])}};Meteor[_0x2449[72]](function(){Meteor[_0x2449[67]](function(){Blaze[_0x2449[66]](Template.MeteorToys,document[_0x2449[65]])});ToyKit[_0x2449[68]]();ToyKit[_0x2449[69]]();ToyKit[_0x2449[2]](_0x2449[16],null);ToyKit[_0x2449[70]]();ToyKit[_0x2449[71]]()});UI[_0x2449[75]](_0x2449[73],function(_0xd6b5xc){return ToyKit[_0x2449[4]](_0x2449[74])});Template[_0x2449[89]][_0x2449[29]]({MeteorToys:function(){return ToyKit[_0x2449[4]](_0x2449[3])},MeteorToy:function(){data=ToyKit[_0x2449[4]](_0x2449[55])[_0x2449[54]];keys=Object[_0x2449[76]](data);return keys},MeteorToy_addon:function(){data=ToyKit[_0x2449[4]](_0x2449[55])[_0x2449[56]];keys=Object[_0x2449[76]](data);return keys},MeteorToysPackage:function(){temp=[];if(Package[_0x2449[77]]){temp[_0x2449[79]](_0x2449[78])};if(Package[_0x2449[80]]){temp[_0x2449[79]](_0x2449[81])};if(ToyKit[_0x2449[4]](_0x2449[74])){temp[_0x2449[79]](_0x2449[30])};return temp},all:function(){if(Package[_0x2449[82]]){return _0x2449[83]}},MeteorToysCordova:function(){if(Package[_0x2449[84]]){if( typeof cordova===_0x2449[85]||navigator[_0x2449[86]]===_0x2449[87]){return true}}},MTtoggle:function(){if(Package[_0x2449[88]]){return true}}});window[_0x2449[89]]={};window[_0x2449[89]][_0x2449[90]]=function(){password=localStorage[_0x2449[92]](_0x2449[91]);email=localStorage[_0x2449[92]](_0x2449[53]);localStorage[_0x2449[90]]();localStorage[_0x2449[93]](_0x2449[91],password);localStorage[_0x2449[93]](_0x2449[53],email)};window[_0x2449[89]][_0x2449[22]]=function(){Meteor[_0x2449[100]](_0x2449[94],function(_0xd6b5x8,_0xd6b5xd){if(_0xd6b5x8){alert(_0x2449[95])}else {localStorage[_0x2449[96]](_0x2449[91]);localStorage[_0x2449[96]](_0x2449[53]);alert(_0x2449[97]);window[_0x2449[99]][_0x2449[98]]()}})};window[_0x2449[89]][_0x2449[101]]=function(){ToyKit[_0x2449[2]](_0x2449[3],true);ToyKit[_0x2449[2]](_0x2449[16],null)};window[_0x2449[89]][_0x2449[102]]=function(){ToyKit[_0x2449[2]](_0x2449[3],false);ToyKit[_0x2449[2]](_0x2449[16],null)};Template[_0x2449[83]][_0x2449[34]]({"\x73\x75\x62\x6D\x69\x74":function(_0xd6b5x8,_0xd6b5xa){_0xd6b5x8[_0x2449[103]]();em=$(_0x2449[105])[_0x2449[104]](),pw=$(_0x2449[106])[_0x2449[104]]();if(em===_0x2449[107]){alert(_0x2449[108]);return false};if(pw===_0x2449[107]){alert(_0x2449[109]);return false};Meteor[_0x2449[100]](_0x2449[110],em,pw,function(_0xd6b5x8,_0xd6b5xd){if(_0xd6b5xd){Meteor[_0x2449[100]](_0x2449[89],function(_0xd6b5x8,_0xd6b5xd){ToyKit[_0x2449[2]](_0x2449[74],_0xd6b5xd)});alert(_0x2449[111]);localStorage[_0x2449[93]](_0x2449[53],em);localStorage[_0x2449[93]](_0x2449[91],pw)}else {alert(_0x2449[112])}})}})
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("meteortoys:toykit", {
  MeteorToysData: MeteorToysData,
  MeteorToys: MeteorToys,
  ToyKit: ToyKit,
  Note: Note,
  MeteorToys_JSON: MeteorToys_JSON,
  MeteorToysDict: MeteorToysDict
});

})();
