import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { senseConfig } from "/imports/api/config.js";
const enigma = require("enigma.js");
import "/imports/ui/nav.html";
import { getQix, getAllSlides } from "/imports/ui/useCases/useCaseSelection";

import { Session } from "meteor/session";
import * as slideApp from "/imports/ui/useCases/useCaseSelection";

const Cookies = require("js-cookie");

Template.nav.helpers({
  isPage() {
    var show = Router.current().route.getName() == 'useCaseSelection' ? false : true;
    return show;
  }
});

// Template.sheetSelector.onRendered(function () {
//   //
//   // ─── CREATE POPUP ───────────────────────────────────────────────────────────────
//   //
//   this.$("#sheetSelector").popup({
//     title: "Select your content",
//     content:
//       "You are navigating in a 'presentation'. In this screen you can select the content based on your job (business or technical) and needs. If you are done, press the green button to start your personal presentation. You can press escape to get an overview, press ? for help or use your keyboard arrows to go to the next and previous slides.",
//     delay: {
//       show: 500,
//       hide: 0
//     }
//   });

//   this.$(".selectSlides").transition({
//     animation: "flash",
//     duration: "16s"
//   });
// });

//
// ─── CLICK EVENTS ON MENU ITEMS ─────────────────────────────────────────────────
//
import { initQlikSense } from "/imports/ui/useCases/useCaseSelection";


Template.nav.events({
  "click a": function (event, template) {
    var menuItem = event.currentTarget.id;
    initQlikSense();
    if (menuItem) {
      event.preventDefault();
      switch (menuItem) {
        case "home":
          window.location.replace('https://evaluation.qlik.com');
          break;
        case "SSBI":
          selectMenuItemInSense("*What is governed self service with Qlik Sense*");
          break;
        case "generation":
          selectMenuItemInSense("*multi-tenant SaaS platform with Qlik Sense*");
          break;
        case "embedding":
          selectMenuItemInSense("*embed Qlik Sense*");
          break;
        case "video":
          var win = window.open('https://www.youtube.com/playlist?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk', '_blank');
          win.focus();
          break;
        case "sheetSelectorMenu":
          Session.set("showSelector", true);
          break;
        case "sharePresentation":
          var id = Session.get('currentSelectionId');
          var shareLinkURL = window.location.origin + '/?selection=' + id;
          //update the value of the helper for the share link popup
          Session.set('shareLinkURL', shareLinkURL);
      }
    } else{
      //set focus on main content
      $(".present #maincontent").focus();
    }
  }
});

Template.yourSaasPlatformMenu.onRendered(function () {
  this.$(".ui.dropdown").dropdown();
});

export async function selectViaQueryId(mongoId) {
  var qSelection = await Meteor.callPromise("getSenseSelectionObject", mongoId);
  if (qSelection) {
    await makeSelectionInFields(qSelection.selection);
  } else {
    sAlert.warning("We could not retreive a stored selection for this id...");
  }
}

// if people click on a menu item, you want a specific slide to be selected, so the slide is the value to search for...
export async function selectMenuItemInSense(slide) {
  // console.log("selectMenuItemInSense - slide", slide);
  Session.set("slideHeaders", null);
  await makeSearchSelectionInField("Level 2", slide);
  //get slides
  await getAllSlides(false);
  Router.go("slides");
}

export async function makeSelectionInField(fieldName, value) {
  // console.log("makeSelectionInField", fieldName + " : " + value.toString());
  try {
    var qix = await slideApp.getQix();
    var myField = await qix.app.getField(fieldName);
    var result = await myField.selectValues(value);
  } catch (error) {
    var message =
      "makeSelectionInField: Can not connect to the Qlik Sense Engine API via enigmaJS";
    console.error(message + " Sense reported the following error: ", error);
    sAlert.error(message, error);
  }
}

//https://qlikcore.com/docs/services/qix-engine/apis/qix/field/#select
export async function makeSearchSelectionInField(fieldName, value) {
  // console.log(
  //   "make search SelectionInField",
  //   fieldName + " : " + value.toString()
  // );
  try {
    var qix = await slideApp.getQix();
    var myField = await qix.app.getField(fieldName);
    var result = await myField.select(value);
  } catch (error) {
    var message =
      "make search SelectionInField: Can not connect to the Qlik Sense Engine API via enigmaJS";
    console.error(message + " Sense reported the following error: ", error);
    sAlert.error(message, error);
  }
}

//

export async function makeSelectionInFields(selections) {
  // console.log("makeSelectionInFields(selections)", selections);
  //for each qField
  selections.forEach(function (selectionField) {
    // console.log("selectionField", selectionField);
    //for each selected value (qSelectedFieldSelectionInfo) (e.g. country can have germany and france selected)
    var selectValues = [];
    selectionField.qSelectedFieldSelectionInfo.forEach(function (fieldValue) {
      // console.log("fieldValue", fieldValue);
      selectValues.push({
        qText: fieldValue.qName,
        qIsNumeric: false,
        qNumber: 0
      });
      // console.log("selectValues", selectValues);
    });
    makeSelectionInField(selectionField.qField, selectValues);
  });
}
