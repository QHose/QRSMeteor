var Cookies = require("js-cookie");

// Load a authentication check handler, depending on which domain it runs.
if (window.location.href.indexOf("qlik.com") > -1) {
  //turned off, moved to useCaseSelection, onStarted server
  // Router.onBeforeAction(mustBeSignedInQlik);
} else {
  //localhost dev environment
  Router.onBeforeAction(mustBeSignedInDEV, {
    except: [undefined, "documentation"]
  });
}

//Layout Configuration. http://stackoverflow.com/questions/28864942/meteor-use-2-different-layouts-ironrouter
Router.configure({
  layoutTemplate: "containerlayout",
  notFoundTemplate: "notFound"
});

Router.route("/slides", {
  template: "slides",
  layoutTemplate: "emptyLayout"
});

// //map paths to blaze templates
Router.route("/", function() {
  Router.go("useCaseSelection");
});

//GENERATION
Router.route("/generation");
Router.route("/generation_embedded", {
  template: "generation",
  layoutTemplate: "emptyContainerLayout"
});
Router.route("/users", {
  template: "users",
  layoutTemplate: "emptyContainerLayout"
});

//SELF SERVICE
Router.route("/selfService", function() {
  this.layout("SSBILayout");
  this.render("nav", { to: "nav" });
  this.render("SSBIUsers", { to: "aside" });
  // this.render('SSBIFooter', { to: 'footer' });
  this.render("SSBISenseApp");
});

Router.route("/selfService_embedded", function() {
  this.layout("SSBILayout");
  this.render("SSBIUsers", { to: "aside" });
  this.render("SSBISenseApp");
});

//API
Router.route("/APILogs");
Router.route("/API_embedded", {
  template: "APILogs",
  layoutTemplate: "SSOLayout"
});

Router.route("/ApiLogsTable");
Router.route("/ApiLogsTable_embedded", {
  template: "ApiLogsTable",
  layoutTemplate: "SSOLayout"
});
//SECURITY
Router.route("/introductionSecurity");
Router.route("/security_embedded", {
  template: "introductionSecurity",
  layoutTemplate: "SSOLayout"
});

//WEB
Router.route("/webIntegration");
Router.route("/webIntegration_embedded", {
  template: "webIntegration",
  layoutTemplate: "SSOLayout"
});

//ARCHITECTURE
Router.route("/architecture");
Router.route("/architecture_embedded", {
  template: "architecture",
  layoutTemplate: "SSOLayout"
});

//generic overview
Router.route("/generic_links_embedded", {
  template: "genericDocumentation",
  layoutTemplate: "SSOLayout"
});

Router.route("/sequenceDiagramOverview");
Router.route("/sequenceDiagramGeneration");
Router.route("/legal");

Router.route("/notFound");
Router.route("/userOverview");
Router.route("/homeAbout");
Router.route("/introduction");
Router.route("/SecurityDeepDive");

//VIDEO OVERVIEW
Router.route("/videoOverview", {
  template: "videoOverview",
  layoutTemplate: "containerlayout"
});
Router.route("/videoOverview_embedded", {
  template: "videoOverview",
  layoutTemplate: "SSOLayout"
});

Router.route("/documentation", {
  template: "documentation",
  layoutTemplate: "containerlayout"
});

Router.route("/templateOverview", {
  template: "templateOverview",
  layoutTemplate: "SSOLayout"
});

Router.route("/slidegeneratorSlides", {
  template: "slidegeneratorSlides",
  layoutTemplate: "ImpressLayout"
});

Router.route("/securityRules", {
  template: "securityRules",
  layoutTemplate: "SSOLayout"
});

Router.route("/QMC", {
  template: "QMC",
  layoutTemplate: "SSOLayout"
});

// Single sing on integration route, this is the route you configure in Qlik sense proxy
Router.route("/SSO", {
  template: "SSO",
  layoutTemplate: "SSOLayout"
});

//SLIDES FOR THE SAAS AUTOMATION INTRODUCTION (/GENERATION)
// Router.route('/impress', {
//     template: 'impress',
//     layoutTemplate: 'SSOLayout'
// });
Router.route("/SaaSIntroduction", function() {
  this.layout("SlideGenerator");
  this.render("impress");
});

//users for the slide generator have their own virtual proxy redirect path
Router.route("/presentationsso", {
  template: "SSO",
  layoutTemplate: "SSOLayout"
});

//SLIDE GENERATOR LANDING PAGES
Router.route("/presentation", {
  template: "landingPage",
  layoutTemplate: "presentationLayout"
});

Router.route("/integration", {
  template: "landingPage",
  layoutTemplate: "presentationLayout"
});

Router.route("/slideSorter", {
  template: "ppt_slideSorter",
  layoutTemplate: "presentationLayout"
});

//START THE SLIDE SHOW
Router.route("/slideGenerator", {
  template: "slidegeneratorSlidesMain",
  layoutTemplate: "presentationLayout"
});

Router.route("/useCaseSelection", function() {
  this.layout("containerlayout");
  this.render("useCaseSelection");
});

//redirect users from saasdemo.qlik.com to integration.qlik.com
if (window.location.href.indexOf("saasdemo") > -1) {
  // var newURL = 'http://'+window.location.protocol + "//" + window.location.host + "/" + window.location.pathname;
  window.location = "http://integration.qlik.com" + window.location.pathname;
}

function mustBeSignedInDEV() {
  var user = {
    // email: "mbj2@test.com",
    email: "mbj2@qlik.com",
    profile: { name: { first: "Martijn", last: "Biesbroek" } },
    roles: ["Base"], // Array.from("Base,Employee,CPEFEmployee"),
    password: "test"
  };

  // addRolesBasedonEmail(user);

  // "Logout"-Hook: Manual implementation, wait a bit to prevent multiple page loads, because the database needs to be update
  Tracker.autorun(function() {
    console.log("------------------------------------");
    console.log("tracker: login status changed...", Meteor.userId());
    console.log("------------------------------------");
    if (!Meteor.userId()) {
      Meteor.setTimeout(loginDEV.bind(null, user), 3000);
    }
  });

  this.next();
}

function loginDEV(user) {
  if (!Meteor.userId()) {
    //if not yet logged in into Meteor, create a new meteor account, or log him via a token.
    console.log("user is not yet logged in into meteor", user);

    Meteor.call("resetPasswordOrCreateUser", user, function(err, res) {
      if (err) {
        sAlert.error(err.message);
        console.error(err);
      } else {
        console.log("------------------------------------");
        console.log("password reset..");
        console.log("------------------------------------");
        Meteor.loginWithPassword(user.email, user.password, function(err, res) {
          //
          if (err) {
            sAlert.error(err.message);
            console.error(err);
          } else {
            // sAlert.success('You are now logged in with your Qlik.com account. You now have your "private demo environment". So feel free to create/change/delete anything you would like...');
            console.log("user successfully logged in", Meteor.userId());
          }
        });
      }
    });
  }
}

function mustBeSignedInQlik() {
  // "Logout"-Hook: Manual implementation, wait a bit to prevent multiple page loads, because the database needs to be update
  Tracker.autorun(function() {
    Meteor.setTimeout(async function() {
      if (!Meteor.userId()) {
        loginQlik();
      }
    }, 1000); //give the browser some time to log the user in...
  });

  this.next();
}

