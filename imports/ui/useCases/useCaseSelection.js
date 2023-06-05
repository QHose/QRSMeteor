import "/imports/ui/useCases/useCaseSelection.html";
import "/imports/ui/slideGenerator/slides.html";
import "/imports/ui/slideGenerator/slides";
import "/imports/ui/slideGenerator/slides.css";
import * as nav from "/imports/ui/nav.js";
import { SenseSelections } from "/imports/api/logger";
import "./SSBI/SSBI.js";
import { Session } from "meteor/session";
import { senseConfig as config } from "/imports/api/config.js";
console.log("🚀 ~ file: useCaseSelection.js:10 ~ config:", config);
const schema = require("enigma.js/schemas/3.2.json");

// import {
//     APILogs,
//     REST_Log
// } from '/imports/api/APILogs';
const enigma = require("enigma.js");
// const schema = require("enigma.js/schemas/12.20.0.json");
const Cookies = require("js-cookie");
var Reveal = require("reveal.js");
var qix = null;

var possibleRoles = [
  "Developer",
  "Hosting Ops",
  "Business Analyst",
  "CTO",
  "C-Level - non-technical",
];

export async function initQlikSense() {
  //connect to qlik sense
  qix = await makeSureSenseIsConnected();
  // make sure we get a signal if something changes in qlik sense, like a selection in the iframe menu
  await setChangeListener(qix);
}

async function makeSureSenseIsConnected() {
  return await getSlideGenApp(await getTicket());
}
export async function getSlideGenApp(ticket) {
    var ticketUrl = ticket?"?QlikTicket="+ticket:"";
  const engineConfig = {
    schema,
    url: `${config.useSSL ? "wss" : "ws"}://${config.host}:${
      config.useSSL
        ? Meteor.settings.public.qlikSensePortSecure
        : Meteor.settings.public.qlikSensePort
    }/${Meteor.settings.public.slideGenerator.virtualProxy}/app/${
      config.slideGeneratorAppId}${ticketUrl}`,
  };
  try {
    // create a new session:
    const session = enigma.create(engineConfig);
    console.log(`Connecting to ${session.config.url}`);

    // bind traffic events to log what is sent and received on the socket:
    session.on("traffic:sent", (data) => console.log("sent:", data));
    session.on("traffic:received", (data) => console.log("received:", data));
    // Catch possible errors sent on WebSocket
    let possibleEnigmaErr;
    session.on("traffic:received", (res) => {
      if (res.params && res.params.severity === "fatal") {
        possibleEnigmaErr = res.params.message;
      }
    });

    session.on('traffic:received', async (data)  => {
        if (data.method === 'OnAuthenticationInformation' && data.params.mustAuthenticate === true) {
            console.error('User is not authenticated...')
        }
      })

    // open the socket and eventually receive the QIX global API, and then close
    // the session:
    

    try {
      var global = await session.open();
    } catch (error) {
      console.log("Error getting the global connection", error);
    }
    try {
      var doc = await global.openDoc(config.slideGeneratorAppId);
      console.log(`********** User is authenticated and connected to the app, Session: Document id: ${doc.id}`);
      return doc;
    } catch (error) {
      console.log("🚀 ~ file: useCaseSelection.js:68 ~ error:", error);
    }
  } catch (error) {
    if (err.enigmaError) {
      console.error("Enigma error:", possibleEnigmaErr || err);
    } else {
      console.error(err);
    }
    console.error(
      "Qlik Sense Qix error, cannot make a websocket connection from the browser to Sense. ",
      error
    );
    sAlert.error(error.message);
    // window.location.href = window.location.origin;
  }
}

//make sure you go to the first slide when we have new slide data
Tracker.autorun(() => {
  Session.get("slideHeaders");
  Meteor.setTimeout(function () {
    try {
      Reveal.slide(0);
    } catch (error) {}
  }, 500);
});

// ONRENDERED.
Template.useCaseSelection.onRendered(async function () {
  Session.set("showSelector", false);
  this.$("#flyoutnavkbfixed").focus();

  $(".ui.dropdown").dropdown("refresh");
  var textToShow = Cookies.get("currentMainRole")
    ? Cookies.get("currentMainRole")
    : "Your role?";
  $(".ui.dropdown").dropdown("set selected", textToShow);

  !(function () {
    var w = window,
      d = w.document;

    if (w.onfocusin === undefined) {
      d.addEventListener("focus", addPolyfill, true);
      d.addEventListener("blur", addPolyfill, true);
      d.addEventListener("focusin", removePolyfill, true);
      d.addEventListener("focusout", removePolyfill, true);
    }
    function addPolyfill(e) {
      var type = e.type === "focus" ? "focusin" : "focusout";
      var event = new CustomEvent(type, { bubbles: true, cancelable: false });
      event.c1Generated = true;
      e.target.dispatchEvent(event);
    }
    function removePolyfill(e) {
      if (!e.c1Generated) {
        // focus after focusin, so chrome will the first time trigger tow times focusin
        d.removeEventListener("focus", addPolyfill, true);
        d.removeEventListener("blur", addPolyfill, true);
        d.removeEventListener("focusin", removePolyfill, true);
        d.removeEventListener("focusout", removePolyfill, true);
      }
      setTimeout(function () {
        d.removeEventListener("focusin", removePolyfill, true);
        d.removeEventListener("focusout", removePolyfill, true);
      });
    }
  })();

  function hasClass(el, className) {
    if (el.classList) {
      return el.classList.contains(className);
    } else {
      return new RegExp("(^| )" + className + "( |$)", "gi").test(el.className);
    }
  }

  var menuItems1 = document.querySelectorAll(
    "#flyoutnavkbfixed li.has-submenu"
  );
  var timer1, timer2;

  Array.prototype.forEach.call(menuItems1, function (el, i) {
    el.addEventListener("mouseover", function (event) {
      this.className = "has-submenu open";
      clearTimeout(timer1);
    });
    el.addEventListener("mouseout", function (event) {
      timer1 = setTimeout(function (event) {
        var opennav = document.querySelector(
          "#flyoutnavkbfixed .has-submenu.open"
        );
        opennav.className = "has-submenu";
        opennav.querySelector("a").setAttribute("aria-expanded", "false");
      }, 1000);
    });
    el.querySelector("a").addEventListener("click", function (event) {
      if (this.parentNode.className == "has-submenu") {
        this.parentNode.className = "has-submenu open";
        this.setAttribute("aria-expanded", "true");
      } else {
        this.parentNode.className = "has-submenu";
        this.setAttribute("aria-expanded", "false");
      }
      event.preventDefault();
    });
    var links = el.querySelectorAll("a");
    Array.prototype.forEach.call(links, function (el, i) {
      el.addEventListener("focus", function () {
        if (timer2) {
          clearTimeout(timer2);
          timer2 = null;
        }
      });
      el.addEventListener("blur", function (event) {
        timer2 = setTimeout(function () {
          var opennav = document.querySelector(
            "#flyoutnavkbfixed .has-submenu.open"
          );
          if (opennav) {
            opennav.className = "has-submenu";
            opennav.querySelector("a").setAttribute("aria-expanded", "false");
          }
        }, 10);
      });
    });
  });
});

//
// ─── SLIDE GENERATOR BUTTON CLICK ─────────────────────────────────────────────────────────────────────
//

Template.useCaseSelection.events({
  "click .slides": async function (e, t) {
    Session.set("showSelector", true);
    Router.go("slides");
  },
  "click #CM": async function (e, t) {
    window.open("https://evaluation.qlik.com", "_blank").focus();
  },
  "click #videoButton": async function (e, t) {
    nav.selectMenuItemInSense("*Video overview:*");
  },
  "click #CM2SAAS": async function (e, t) {
    //if anaything happens with the dropdown box... adjust the selection, and get new slides.
    var selectedRole = "Client managed to SaaS"; //e.currentTarget.id;
    await getSlides(selectedRole);
  },
  "click #SAAS": async function (e, t) {
    //if anaything happens with the dropdown box... adjust the selection, and get new slides.
    var selectedRole = "Qlik Cloud"; //e.currentTarget.id;
    await getSlides(selectedRole);
  },
});

async function getSlides(selectedRole) {
  Cookies.set("currentMainRole", selectedRole);
  // await nav.makeClearAll(); already in set selection
  await setSelectionInSense("Partial Workshop", selectedRole);
  //get slides
//   await getAllSlides();
  Session.set("showSelector", false);
  Session.set("showSubjectAreaIntroduction", true);

  Router.go("slides");
  ////go to the first slide after a data refresh.
  // Reveal.slide(0);
}

async function setSelectionInSense(field, value) {
  try {
    var qix = await getSlideGenApp();
    console.log('qix', qix)
    await qix.clearAll();
    var myField = await qix.getField(field);
    var result = await myField.selectValues([
      {
        qText: value,
      },
    ]);
    // console.log('result of setting a selection in Sense', result)
  } catch (error) {
    console.error("Error making selection in Sense ", error);
  }
}

async function getTicket() {
  try {
    return await Meteor.callPromise(
      "getTicketNumber",
      { group: "notProvided" },
      Meteor.settings.public.slideGenerator.virtualProxy
    );
  } catch (error) {
    var message =
      "We could not setup single sing on with Qlik Sense. See your console window for more information";
    console.error(message, error);
    sAlert.error(
      "Could not get a ticket in order to enforce SSO to Qlik Sense."
    );
  }
}

//HELPERS
Template.useCaseSelection.helpers({
  userRole() {
    return Cookies.get("currentMainRole");
  },
});

//
// ─── MAIN TOPICS LEVEL 1 AND 2 ─────────────────────────────────────────────────
//
export async function getAllSlideHeaders(qix) {
  //get all level 1 and 2 fields in a table: these are the individual slides (titles). The bullets are contained in level 3.
  // return insertSectionBreakers(await getAllSlideHeadersPlain(qix));
  var headers = await getAllSlideHeadersPlain(qix);
  var headersWithBreakers = insertSectionBreakers(headers);
  return headersWithBreakers;
}
export async function getSubjectArea(qix) {
  var sessionModel = await qix.createSessionObject({
    qInfo: {
      qType: "cube",
    },
    qHyperCubeDef: {
      qDimensions: [
        {
          qDef: {
            qFieldDefs: ["Subject area"],
            qSortCriterias: [
              {
                qSortByState: 0,
                qSortByFrequency: 0,
                qSortByNumeric: 0,
                qSortByAscii: 1,
                qSortByLoadOrder: 0,
                qSortByExpression: 0,
                qExpression: {
                  qv: "max(CSVRowNo)",
                },
                qSortByGreyness: 0,
              },
            ],
          },
        },
      ],
    },
  });
  sessionData = await sessionModel.getHyperCubeData("/qHyperCubeDef", [
    {
      qTop: 0,
      qLeft: 0,
      qWidth: 3,
      qHeight: 3333,
    },
  ]);
  console.log(
    "🚀 ~ file: useCaseSelection.js:322 ~ getSubjectArea ~ sessionData[0].qMatrix:",
    sessionData[0].qMatrix
  );
  return sessionData[0].qMatrix;
}

export async function getLevel2(qix) {
  var sessionModel = await qix.createSessionObject({
    qInfo: {
      qType: "cube",
    },
    qHyperCubeDef: {
      qDimensions: [
        {
          qDef: {
            qFieldDefs: ["Level 2"],
          },
        },
      ],
    },
  });
  sessionData = await sessionModel.getHyperCubeData("/qHyperCubeDef", [
    {
      qTop: 0,
      qLeft: 0,
      qWidth: 3,
      qHeight: 3333,
    },
  ]);
  return sessionData[0].qMatrix;
}

export async function getLevel1(qix) {
  //chapters
  var sessionModel = await qix.createSessionObject({
    qInfo: {
      qType: "cube",
    },
    qHyperCubeDef: {
      qDimensions: [
        {
          qDef: {
            qFieldDefs: ["Level 1"],
          },
        },
      ],
      qMeasures: [
        {
          qDef: {
            qDef: "Sum({1} 1)",
          },
          qLabel: "sum({1}1)",
          qLibraryId: null,
          qSortBy: {
            qSortByState: 0,
            qSortByFrequency: 0,
            qSortByNumeric: 0,
            qSortByAscii: 0,
            qSortByLoadOrder: 0,
            qSortByExpression: 1,
            qExpression: {
              qv: "min(CSVRowNo)",
            },
          },
        },
      ],
    },
  });
  sessionData = await sessionModel.getHyperCubeData("/qHyperCubeDef", [
    {
      qTop: 0,
      qLeft: 0,
      qWidth: 3,
      qHeight: 3333,
    },
  ]);
  return sessionData[0].qMatrix;
  // return SortSenseData(sessionData[0].qMatrix);
}

// function SortSenseData(senseArray) {
//     var result = [];
//     senseArray.sort(compare);

//     for (const element of senseArray) {
//         result.push(element);
//     }
//     console.log("🚀  SortSenseData ~ result", result)
//     return result;
// }

// function compare(a, b) {
//     if (a[1].qNum < b[1].qNum) {
//         return -1;
//     }
//     if (a[1].qNum > b[1].qNum) {
//         return 1;
//     }
//     return 0;
// }

export async function getAllSlideHeadersPlain(qix) {
  //get all level 1 and 2 fields in a table: these are the individual slides (titles). The bullets are contained in level 3.
  var sessionModel = await qix.createSessionObject({
    qInfo: {
      qType: "cube",
    },
    qHyperCubeDef: {
      qDimensions: [
        {
          qDef: {
            qFieldDefs: ["Level 1"],
          },
        },
        {
          qDef: {
            qFieldDefs: ["Level 2"],
            qSortCriterias: [
              {
                qSortByState: 0,
                qSortByFrequency: 0,
                qSortByNumeric: 0,
                qSortByAscii: 0,
                qSortByLoadOrder: 1,
                qSortByExpression: 1,
                qExpression: {
                  qv: "min(CSVRowNo)",
                },
                qSortByGreyness: 0,
              },
            ],
          },
        },
      ],
    },
  });
  sessionData = await sessionModel.getHyperCubeData("/qHyperCubeDef", [
    {
      qTop: 0,
      qLeft: 0,
      qWidth: 3,
      qHeight: 3333,
    },
  ]);
  return sessionData[0].qMatrix;
}
//
// ─── GET LEVEL 1 TO 3 ────────────────────────────────────────────
//
//by default add extra slides (extra items in the data array), so you will get nice dynamic chapter breakers
var sectionBreakerConfig = true;
export async function getAllSlides(
  insertSectionBreakers = sectionBreakerConfig
) {
  var qix = await getSlideGenApp();
  //insert breakers before a change of topic? YES/NO... breakers are annoying when you make a menu selection or want to link to a sheet
  sectionBreakerConfig = insertSectionBreakers;
  var table = insertSectionBreakers
    ? await getAllSlideHeaders(qix)
    : await getAllSlideHeadersPlain(qix);
  Session.set("slideHeaders", table);
}

export async function getComment(qix) {
  var sessionModel = await qix.createSessionObject({
    qInfo: {
      qType: "cube",
    },
    qHyperCubeDef: {
      qDimensions: [
        {
          qDef: {
            qFieldDefs: ["Comment"],
          },
        },
      ],
    },
  });
  sessionData = await sessionModel.getHyperCubeData("/qHyperCubeDef", [
    {
      qTop: 0,
      qLeft: 0,
      qWidth: 3,
      qHeight: 3333,
    },
  ]);
  Session.set("slideComment", sessionData[0].qMatrix);
  // console.log('sessionModel', sessionModel)
  // console.log('slide Comment', Session.get('slideComment'));
}

//this code does not work since enigma v2...
export async function setChangeListener(qix) {
  // console.log('We are connected to Qlik Sense via the APIs, now setChangeListener', qix)
  //   try {
  //     qix.on("changed", async () => {
  //       // console.log('QIX instance change event received, so get the new data set out of Qlik Sense, and store the current selection in the database.');
  //       await getCurrentSelections();
  //       // Session.set("slideHeaders", null); //reset the slideheaders to ensure all slide content templates are re-rendered.
  //       // Meteor.setTimeout(async function wait() {
  //       //     await getAllSlides();
  //       //     Reveal.slide(0); //go to the first slide after a data refresh.
  //       // }, 100)
  //     });
  //   } catch (error) {
  //     console.error("failed to set change listener: ", error);
  //   }
}

function insertSectionBreakers(table) {
  var currentLevel1,
    previousLevel1 = "";
  var newTableWithChapter = [];

  table.forEach(function (currentRow) {
    var currentLevel1 = textOfLevel(currentRow, 1);
    if (previousLevel1 !== currentLevel1) {
      newTableWithChapter.push(currentLevel1);
      previousLevel1 = currentLevel1;
    }
    newTableWithChapter.push(currentRow);
  });
  // console.log('table with chapters is', newTableWithChapter);
  return newTableWithChapter;
}

function textOfLevel(row, level) {
  level -= 1;
  return row[level].qText;
}

//http://help.qlik.com/en-US/sense-developer/September2017/Subsystems/EngineAPI/Content/DiscoveringAndAnalysing/MakeSelections/get-current-selections.htm
async function getCurrentSelections() {
  // console.log('function: getCurrentSelections');
  try {
    var qix = await getSlideGenApp();
    var genericObject = await qix.createSessionObject({
      qInfo: {
        qType: "SessionLists",
      },
      qSelectionObjectDef: {},
    });
    // console.log("sessionObject", genericObject);

    var layout = await genericObject.getLayout();
    // console.log('genericObject layout', layout)
    var currentSelections = layout.qSelectionObject.qSelections;
    SenseSelections.insert(
      {
        userId: Meteor.userId,
        userName: Meteor.user().profile.name,
        eventType: "selectionChanged",
        selection: currentSelections,
        selectionDate: new Date(), // current time
      },
      function (err, currentSelectionId) {
        if (err) {
          console.error("Failed to store the selection in mongoDb");
        }
        Session.set("currentSelectionId", currentSelectionId);
        return currentSelections;
      }
    );
  } catch (error) {
    var message =
      "getCurrentSelections: Can not connect to the Qlik Sense Engine API via enigmaJS";
    console.error(message, error);
    // sAlert.error(message, error);
  }
}
