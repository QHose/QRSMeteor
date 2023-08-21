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
var Mongo = Package.mongo.Mongo;
var Template = Package['templating-runtime'].Template;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var _ = Package.underscore._;
var $ = Package.jquery.$;
var jQuery = Package.jquery.jQuery;
var Session = Package.session.Session;
var Spacebars = Package.spacebars.Spacebars;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var sAlert;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/juliancwirko_s-alert/client/s-alert.js                                                             //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
'use strict';

// helper functions
var conditionSet = function (self, msg, condition, customSettings) {
    var settings = {};
    var effects = ['jelly', 'genie', 'stackslide', 'scale', 'slide', 'flip', 'bouncyflip'];
    var currentEffect;
    var sAlertId;
    if (!_.isObject(customSettings)) {
        customSettings = {};
    }
    if (_.isObject(msg) && _.isString(condition)) {
        settings = _.extend(settings, self.settings, JSON.parse(JSON.stringify(msg)), {condition: condition}, customSettings);
    }
    if (_.isString(msg) && _.isString(condition)) {
        settings = _.extend(settings, self.settings, {message: msg}, {condition: condition}, customSettings);
    }
    currentEffect = settings && settings.effect;
    if (_.contains(effects, currentEffect) && !Package['juliancwirko:s-alert-' + currentEffect] && typeof console !== 'undefined') {
        console.info('Install "' + currentEffect + '" effect by running "meteor add juliancwirko:s-alert-' + currentEffect + '"');
    }
    if (_.isObject(settings) && !_.isEmpty(settings)) {
        sAlertId = sAlert.collection.insert(settings);
    }
    return sAlertId;
};

var EVENTS = 'webkitAnimationEnd oAnimationEnd animationEnd msAnimationEnd animationend';
var sAlertClose = function (alertId) {
    var closingTimeout;
    var onClose;
    var alertObj;
    var invokeOnCloseCb = function () {
        // invoke onClose callback
        if (onClose && _.isFunction(onClose)) {
            onClose();
        }
    };
    if (document.hidden || document.webkitHidden || !$('#' + alertId).hasClass('s-alert-is-effect')) {
        alertObj = sAlert.collection.findOne(alertId);
        if (alertObj && !_.isEmpty(alertObj)) {
            onClose = alertObj.onClose;
        }
        sAlert.collection.remove(alertId);
        invokeOnCloseCb();
    } else {
        $('.s-alert-box#' + alertId).removeClass('s-alert-show');
        closingTimeout = Meteor.setTimeout(function () {
            $('.s-alert-box#' + alertId).addClass('s-alert-hide');
        }, 100);
        $('.s-alert-box#' + alertId).off(EVENTS);
        $('.s-alert-box#' + alertId).on(EVENTS, function () {
            $(this).hide();
            alertObj = sAlert.collection.findOne(alertId);
            if (alertObj && !_.isEmpty(alertObj)) {
                onClose = alertObj.onClose;
            }
            sAlert.collection.remove(alertId);
            Meteor.clearTimeout(closingTimeout);
            invokeOnCloseCb();
        });
    }
    // stop audio when closing
    sAlert.audio && sAlert.audio.load();
    sAlert.audioInfo && sAlert.audioInfo.load();
    sAlert.audioError && sAlert.audioError.load();
    sAlert.audioSuccess && sAlert.audioSuccess.load();
    sAlert.audioWarning && sAlert.audioWarning.load();
};

// sAlert object
sAlert = {
    settings: {
        effect: '',
        position: 'top-right',
        timeout: 5000,
        html: false,
        onRouteClose: true,
        stack: true,
        // or you can pass an object:
        // stack: {
        //     spacing: 10 // in px
        //     limit: 3 // when fourth alert appears all previous ones are cleared
        // }
        offset: 0, // in px - will be added to first alert (bottom or top - depends of the position in config)
        beep: false,
        // beep: '/beep.mp3'  // or you can pass an object:
        // beep: {
        //     info: '/beep-info.mp3',
        //     error: '/beep-error.mp3',
        //     success: '/beep-success.mp3',
        //     warning: '/beep-warning.mp3'
        // }
        onClose: _.noop
    },
    config: function (configObj) {
        var self = this;
        if (_.isObject(configObj)) {
            self.settings = _.extend(self.settings, configObj);
        } else {
            throw new Meteor.Error(400, 'Config must be an object!');
        }
    },
    closeAll: function () {
        sAlert.collection.find({}).forEach(function (sAlertObj) {
            sAlert.collection.remove(sAlertObj._id);
            if (sAlertObj.onClose && _.isFunction(sAlertObj.onClose)) {
                sAlertObj.onClose();
            }
        });
    },
    close: function (id) {
        if (_.isString(id)) {
            sAlertClose(id);
        }
    },
    info: function (msg, customSettings) {
        return conditionSet(this, msg, 'info', customSettings);
    },
    error: function (msg, customSettings) {
        return conditionSet(this, msg, 'error', customSettings);
    },
    success: function (msg, customSettings) {
        return conditionSet(this, msg, 'success', customSettings);
    },
    warning: function (msg, customSettings) {
        return conditionSet(this, msg, 'warning', customSettings);
    }
};

// routers clean
Meteor.startup(function () {
    if (typeof Iron !== 'undefined' && typeof Router !== 'undefined') {
        Router.onStop(function () {
            sAlert.collection.remove({onRouteClose: true});
        });
    }
    if (typeof FlowRouter !== 'undefined' && _.isObject(FlowRouter.triggers)) {
        FlowRouter.triggers.enter([function () {
            sAlert.collection.remove({onRouteClose: true});
        }]);
    }
    if (typeof FlowRouter !== 'undefined' && !_.isObject(FlowRouter.triggers)) {
        FlowRouter.middleware(function (path, next) {
            sAlert.collection.remove({onRouteClose: true});
            next();
        });
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/juliancwirko_s-alert/client/s-alert-collection.js                                                  //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
'use strict';

// only client side collections for now..
sAlert.collection = new Mongo.Collection(null);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/juliancwirko_s-alert/client/template.s-alert-template.js                                           //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //

Template.__checkName("sAlert");
Template["sAlert"] = new Template("Template.sAlert", (function() {
  var view = this;
  return [ Blaze.Each(function() {
    return Spacebars.call(view.lookup("sAlertDataLeft"));
  }, function() {
    return [ "\n        ", Spacebars.include(view.lookupTemplate("sAlertContent")), "\n    " ];
  }), "\n    ", Blaze.Each(function() {
    return Spacebars.call(view.lookup("sAlertDataRight"));
  }, function() {
    return [ "\n        ", Spacebars.include(view.lookupTemplate("sAlertContent")), "\n    " ];
  }), "\n    ", Blaze.Each(function() {
    return Spacebars.call(view.lookup("sAlertDataFullTop"));
  }, function() {
    return [ "\n        ", Spacebars.include(view.lookupTemplate("sAlertContent")), "\n    " ];
  }), "\n    ", Blaze.Each(function() {
    return Spacebars.call(view.lookup("sAlertDataFullBottom"));
  }, function() {
    return [ "\n        ", Spacebars.include(view.lookupTemplate("sAlertContent")), "\n    " ];
  }) ];
}));

Template.__checkName("sAlertContent");
Template["sAlertContent"] = new Template("Template.sAlertContent", (function() {
  var view = this;
  return Blaze.If(function() {
    return Spacebars.call(Spacebars.dot(view.lookup(".."), "template"));
  }, function() {
    return [ "\n        ", Blaze._TemplateWith(function() {
      return {
        template: Spacebars.call(Spacebars.dot(view.lookup(".."), "template")),
        data: Spacebars.call(view.lookup("."))
      };
    }, function() {
      return Spacebars.include(function() {
        return Spacebars.call(Template.__dynamic);
      });
    }), "\n    " ];
  }, function() {
    return [ "\n        ", HTML.DIV({
      class: function() {
        return [ "s-alert-box s-alert-", Spacebars.mustache(view.lookup("condition")), " s-alert-", Spacebars.mustache(view.lookup("position")), " ", Blaze.If(function() {
          return Spacebars.call(view.lookup("effect"));
        }, function() {
          return [ "s-alert-is-effect s-alert-effect-", Blaze.View("lookup:effect", function() {
            return Spacebars.mustache(view.lookup("effect"));
          }) ];
        }), " s-alert-show" ];
      },
      id: function() {
        return Spacebars.mustache(view.lookup("_id"));
      },
      style: function() {
        return Spacebars.mustache(view.lookup("boxPosition"));
      }
    }, "\n            ", HTML.DIV({
      class: "s-alert-box-inner"
    }, "\n                ", HTML.P(Blaze.If(function() {
      return Spacebars.call(view.lookup("isHtml"));
    }, function() {
      return Blaze.View("lookup:message", function() {
        return Spacebars.makeRaw(Spacebars.mustache(view.lookup("message")));
      });
    }, function() {
      return Blaze.View("lookup:message", function() {
        return Spacebars.mustache(view.lookup("message"));
      });
    })), "\n            "), "\n            ", HTML.SPAN({
      class: "s-alert-close"
    }), "\n        "), "\n    " ];
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/juliancwirko_s-alert/client/s-alert-template.js                                                    //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
'use strict';

var getAlertData = function (currentData, sAlertPosition) {
    var positionTop = 0;
    var positionBottom = 0;
    var padding = 0;
    var alerts = {};
    var style;
    var sAlertBoxHTML;
    var sAlertBox;
    var docElement;
    var sAlertBoxHeight;
    var templateOverwrite = currentData && currentData.template;
    var positionTypeTop;
    var positionTypeBottom;
    var stackLimit;
    var alertsCount;
    var checkFirst = function (type, objId) {
        var collectionOfType = sAlertCollection.filter(function(obj) {
            return obj.position === type;
        });
        return collectionOfType && collectionOfType[0]._id === objId;
    };
    var positionFunc = function (position, positionType, alert, sAlertBox) {
        padding = alert.stack.spacing || sAlertBox.find('.s-alert-box').css(positionType);
        if (checkFirst(alert.position, alert._id) && alert.offset) {
            position = 0;
            position = position + parseInt(alert.offset);
        }
        if (checkFirst(alert.position, alert._id) && alert.stack.spacing) {
            position = position;
        } else {
            position = position + parseInt(padding);
        }
        style = positionType + ': ' + position + 'px;';
        position = position + sAlertBoxHeight;
        return position;
    };

    var query = {};
    if (sAlertPosition === 'left') {
        query = {$or: [{position: 'top-left'}, {position: 'bottom-left'}]};
    }
    if (sAlertPosition === 'right') {
        query = {$or: [{position: 'top-right'}, {position: 'bottom-right'}]};
    }
    if (sAlertPosition === 'full-top') {
        query = {position: 'top'};
    }
    if (sAlertPosition === 'full-bottom') {
        query = {position: 'bottom'};
    }
    var sAlertCollection = sAlert.collection.find(query).fetch();

    return sAlertCollection.map(function (alert) {
        positionTypeTop = alert.position && /top/g.test(alert.position);
        positionTypeBottom = alert.position && /bottom/g.test(alert.position);
        if (alert.stack) {
            stackLimit = alert.stack && alert.stack.limit;
            alertsCount = sAlert.collection.find(query).count();
            // limit check
            if (stackLimit && alertsCount > stackLimit) {
                sAlert.close(sAlert.collection.findOne(query)._id);
            }
            // checking alert box height - needed to calculate position
            docElement = document.createElement('div');
            $(docElement).addClass('s-alert-box-height');
            if (_.isString(templateOverwrite)) {
                sAlertBoxHTML = Blaze.toHTMLWithData(Template[templateOverwrite], alert);
            } else {
                sAlertBoxHTML = Blaze.toHTMLWithData(Template.sAlertContent, alert);
            }
            sAlertBox = $(docElement).html(sAlertBoxHTML);
            $('body').append(sAlertBox);
            sAlertBoxHeight = sAlertBox.find('.s-alert-box').outerHeight(true);
            if (positionTypeTop) {
                positionTop = positionFunc(positionTop, 'top', alert, sAlertBox);
            }
            if (positionTypeBottom) {
                positionBottom = positionFunc(positionBottom, 'bottom', alert, sAlertBox);
            }
            sAlertBox.remove();
            if (sAlertPosition === 'left') {
                style = style + 'left: ' + (alert.stack.spacing || sAlertBox.find('.s-alert-box').css('left')) + 'px;';
            }
            if (sAlertPosition === 'right') {
                style = style + 'right: ' + (alert.stack.spacing || sAlertBox.find('.s-alert-box').css('right')) + 'px;';
            }
            alerts = _.extend(alert, {boxPosition: style});
        } else if (alert.offset && positionTypeTop) {
            alerts = _.extend(alert, {boxPosition: 'top: ' + parseInt(alert.offset) + 'px;'});
        } else if (alert.offset && positionTypeBottom) {
            alerts = _.extend(alert, {boxPosition: 'bottom: ' + parseInt(alert.offset) + 'px;'});
        } else {
            alerts = alert;
        }
        return alerts;
    });
};

Template.sAlert.helpers({
    sAlertDataLeft: function () {
        return getAlertData(Template.currentData(), 'left');
    },
    sAlertDataRight: function () {
        return getAlertData(Template.currentData(), 'right');
    },
    sAlertDataFullTop: function () {
        return getAlertData(Template.currentData(), 'full-top');
    },
    sAlertDataFullBottom: function () {
        return getAlertData(Template.currentData(), 'full-bottom');
    }
});

Template.sAlertContent.onRendered(function () {
    var tmpl = this;
    var data = Template.currentData();
    var sAlertTimeout = data.timeout;
    var beep = data.beep;
    // audio
    if (beep && _.isString(beep)) {
        sAlert.audio = new Audio(data.beep);
        sAlert.audio.load();
        sAlert.audio.play();
    }
    if (beep && _.isObject(beep) && data.condition === 'info') {
        sAlert.audioInfo = new Audio(data.beep.info);
        sAlert.audioInfo.load();
        sAlert.audioInfo.play();
    }
    if (beep && _.isObject(beep) && data.condition === 'error') {
        sAlert.audioError = new Audio(data.beep.error);
        sAlert.audioError.load();
        sAlert.audioError.play();
    }
    if (beep && _.isObject(beep) && data.condition === 'success') {
        sAlert.audioSuccess = new Audio(data.beep.success);
        sAlert.audioSuccess.load();
        sAlert.audioSuccess.play();
    }
    if (beep && _.isObject(beep) && data.condition === 'warning') {
        sAlert.audioWarning = new Audio(data.beep.warning);
        sAlert.audioWarning.load();
        sAlert.audioWarning.play();
    }
    if (sAlertTimeout && sAlertTimeout !== 'none') {
        sAlertTimeout = parseInt(sAlertTimeout);
        if (tmpl.sAlertCloseTimeout) {
            Meteor.clearTimeout(tmpl.sAlertCloseTimeout);
        }
        tmpl.sAlertCloseTimeout = Meteor.setTimeout(function () {
            sAlert.close(data._id);
        }, sAlertTimeout);
    }
});
Template.sAlertContent.onDestroyed(function () {
    if (this.sAlertCloseTimeout) {
        Meteor.clearTimeout(this.sAlertCloseTimeout);
    }
});

Template.sAlertContent.events({
    'click .s-alert-close': function (e, tmpl) {
        e.preventDefault();
        Meteor.clearTimeout(tmpl.sAlertCloseTimeout);
        sAlert.close(this._id);
    }
});

Template.sAlertContent.helpers({
    isHtml: function () {
        var data = Template.currentData();
        return data && data.html;
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("juliancwirko:s-alert", {
  sAlert: sAlert
});

})();
