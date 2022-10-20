import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
// import { senseConfig } from "/imports/api/config.js";
const enigma = require("enigma.js");
import "/imports/ui/nav.html";
import { getQix, getAllSlides, getLevel1 } from "/imports/ui/useCases/useCaseSelection";
import { MenuItems } from "/imports/ui/slideGenerator/slides"
import { Session } from "meteor/session";
import * as slideApp from "/imports/ui/useCases/useCaseSelection";


const Cookies = require("js-cookie");



Template.nav.helpers({
  isSlide() {
    var show = Router.current().route.getName() == 'useCaseSelection' ? false : true;
    return show;
  },
  items() {
    var items = MenuItems.find({});
    return items;
  },
  active(item){
    var text = item.qText;
    if(text === Session.get("currentSubjectArea"))  
    {
      return 'active'
    }     
  }
});

//
// ─── CLICK EVENTS ON MENU ITEMS ─────────────────────────────────────────────────
//
import { initQlikSense } from "/imports/ui/useCases/useCaseSelection";


Template.nav.events({
  "click #home": function(){
    window.location.replace('/');
  },
  "click a": async function (event, template) {
    Session.set("showSubjectAreaIntroduction", false);   
    var menuItem = event.currentTarget.id;
    Session.set("currentSubjectArea", menuItem);
    Session.set("currentChapter",null)
    console.log("🚀 ~ file: nav.js ~ line 36 ~ menuItem", menuItem)

    if (menuItem) {
      initQlikSense();
      event.preventDefault();      
      console.log('make selection based on id')
      await makeClearSelectionInField("Level 1");
      await selectInSense('Subject area', menuItem);
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

export async function selectInSense(field, selection) {
  console.log('make selection for field' + field + ' for value ' + selection);
  Session.set("slideHeaders", null);
  await makeSearchSelectionInField(field, selection);
  //get slides
  await getAllSlides(true);
  Router.go("slides");
}


// if people click on a menu item, you want a specific slide to be selected, so the slide is the value to search for...
export async function selectMenuItemInSense(slide) {
  // console.log("selectMenuItemInSense - slide", slide);
  Session.set("slideHeaders", null);
  await makeSearchSelectionInField("Level 2", slide);
  //get slides
  await getAllSlides(true);
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

export async function makeClearSelectionInField(fieldName) {
console.log("🚀 ~ file: nav.js ~ line 127 ~ makeClearSelectionInField ~ makeClearSelectionInField", fieldName)

  try {
    var qix = await slideApp.getQix();
    var myField = await qix.app.getField(fieldName);
    var result = await myField.clear();
  } catch (error) {
    var message =
      "make clear SelectionInField: Can not connect to the Qlik Sense Engine API via enigmaJS";
    console.error(message + " Sense reported the following error: ", error);
    sAlert.error(message, error);
  }
}

export async function makeClearAll() {
  console.log("🚀 ~ file: nav.js ~ line 142 ~ makeClearAll")
  
    try {
      var qix = await slideApp.getQix();
      await qix.app.clearAll();
    } catch (error) {
      var message =
        "clear all selections: Can not connect to the Qlik Sense Engine API via enigmaJS";
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
