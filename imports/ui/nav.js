import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { senseConfig } from "/imports/api/config.js";
const enigma = require("enigma.js");
import { getQix } from "/imports/ui/useCases/useCaseSelection";

import { Session } from "meteor/session";
import * as slideApp from "/imports/ui/useCases/useCaseSelection";
import './nav.html';

const Cookies = require("js-cookie");

Template.nav.helpers({
  isPage(page) {
    if (Router.current().route)
      return Router.current().route.getName() === page;
  }
});

Template.sheetSelector.onRendered(function () {
   //
  // ─── CREATE POPUP ───────────────────────────────────────────────────────────────
  //
  this.$("#sheetSelector").popup({
    title: "Select your content",
    content:
      "You are navigating in a 'presentation'. In this screen you can select the content based on your job (business or technical) and needs. If you are done, press the green button to start your personal presentation. You can press escape to get an overview, press ? for help or use your keyboard arrows to go to the next and previous slides.",
    delay: {
      show: 500,
      hide: 0
    }
  });

    this.$(".selectSlides").transition({
      animation: "bounce",
      duration: "16s"
    });
});

Template.nav.onRendered(function() {

});

//
// ─── CLICK EVENTS ON MENU ITEMS ─────────────────────────────────────────────────
//

Template.nav.events({
  "click a": function(event, template) {
    window.location.href = '/';

  }
});

export function showSlideSelector() {
  $(".ui.modal.sheetSelector")
    .modal("show")
    .css({
      position: "fixed",
      top: "30%",
      height: "700px"
    })
    .modal({
      onVisible: function() {
        $(".ui.modal.sheetSelector").modal("refresh");
      },
      onHide: function() {
        // console.log('hidden');
        Session.set("sheetSelectorSeen", true);
        abortQlikModalState();
      }
      // onShow: function() {
      //     console.log('shown');
      // },
    });
}
async function abortQlikModalState() {
  // console.log('slide selection modal closed');
  var qix = await getQix();
  qix.app.abortModal(true);
}

Template.yourSaasPlatformMenu.onRendered(function() {
  this.$(".ui.dropdown").dropdown();
});

export async function selectViaQueryId(mongoId) {
  console.log("selectViaQueryId(mongoId)", mongoId);
  var qSelection = await Meteor.callPromise("getSenseSelectionObject", mongoId);
  console.log("qSelection result from mongoDB", qSelection);
  if (qSelection) {
    await makeSelectionInFields(qSelection.selection);
  } else {
    sAlert.warning("We could not retreive a stored selection for this id...");
  }
}

// if people click on a menu item, you want a specific slide to be selected, so the slide is the value to search for...
export async function selectMenuItemInSense(slide) {
  console.log("selectMenuItemInSense - slide", slide);
  await makeSearchSelectionInField("Level 2", slide);
  Meteor.setTimeout(function() {
    Router.go("slides");
  }, 200);
}

//https://help.qlik.com/en-US/sense-developer/September2018/apis/EngineAPI/definitions-FieldValue.html
export async function makeSelectionInField(fieldName, value) {
  console.log("makeSelectionInField", fieldName + " : " + value.toString());
  try {
    var qix = await slideApp.getQix();
    var myField = await qix.app.getField(fieldName);
    var result = await myField.selectValues(value);
  } catch (error) {
    var message =
      "selectValues: Can not connect to the Qlik Sense Engine API via enigmaJS";
    console.error(message + " Sense reported the following error: ", error);
    sAlert.error(message, error);
  }
}

//https://qlikcore.com/docs/services/qix-engine/apis/qix/field/#select
export async function makeSearchSelectionInField(fieldName, value) {
  console.log(
    "make search SelectionInField",
    fieldName + " : " + value.toString()
  );
  try {
    var qix = await slideApp.getQix();
    var myField = await qix.app.getField(fieldName);
    var result = await myField.select(value);
  } catch (error) {
    var message =
      "make search SelectionInField: Can not connect to the Qlik Sense Engine API via enigmaJS";
    console.error(message + " Sense reported the following error: ", error);
    // location.reload(); //reload the page
    sAlert.error(message, error);
  }
}

//

export async function makeSelectionInFields(selections) {
  console.log("makeSelectionInFields(selections)", selections);
  //for each qField
  selections.forEach(function(selectionField) {
    console.log("selectionField", selectionField);
    //for each selected value (qSelectedFieldSelectionInfo) (e.g. country can have germany and france selected)
    var selectValues = [];
    selectionField.qSelectedFieldSelectionInfo.forEach(function(fieldValue) {
      console.log("fieldValue", fieldValue);
      selectValues.push({
        qText: fieldValue.qName,
        qIsNumeric: false,
        qNumber: 0
      });
      console.log("selectValues", selectValues);
    });
    makeSelectionInField(selectionField.qField, selectValues);
  });
}
