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
var _ = Package.underscore._;
var $ = Package.jquery.$;
var jQuery = Package.jquery.jQuery;
var AutoForm = Package['aldeed:autoform'].AutoForm;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema;
var MongoObject = Package['aldeed:simple-schema'].MongoObject;
var Symbol = Package['ecmascript-runtime-client'].Symbol;
var Map = Package['ecmascript-runtime-client'].Map;
var Set = Package['ecmascript-runtime-client'].Set;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var Spacebars = Package.spacebars.Spacebars;
var HTML = Package.htmljs.HTML;

var require = meteorInstall({"node_modules":{"meteor":{"fabienb4:autoform-semantic-ui":{"templates":{"semantic-ui":{"semantic-ui.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/semantic-ui.js                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global AutoForm */
Template.autoForm.helpers({
  atts: function () {
    // After removing all of the props we know about, everything else should
    // become a form attribute unless it's an array or object.
    var val,
        htmlAttributes = {},
        context = this;
    context = AutoForm.Utility.addClass(context, "ui form");
    var removeProps = ["schema", "collection", "validation", "doc", "resetOnSuccess", "type", "template", "autosave", "autosaveOnKeyup", "meteormethod", "filter", "autoConvert", "removeEmptyStrings", "trimStrings"]; // Filter out any attributes that have a component prefix

    function hasComponentPrefix(prop) {
      return _.any(AutoForm.Utility.componentTypeList, function (componentType) {
        return prop.indexOf(componentType + "-") === 0;
      });
    } // Filter out arrays and objects, which are obviously not meant to be
    // HTML attributes.


    for (var prop in meteorBabelHelpers.sanitizeForInObject(context)) {
      if (context.hasOwnProperty(prop) && !_.contains(removeProps, prop) && !hasComponentPrefix(prop)) {
        val = context[prop];

        if (!_.isArray(val) && !_.isObject(val)) {
          htmlAttributes[prop] = val;
        }
      }
    } // By default, we add the `novalidate="novalidate"` attribute to our form,
    // unless the user passes `validation="browser"`.


    if (this.validation !== "browser" && !htmlAttributes.novalidate) {
      htmlAttributes.novalidate = "novalidate";
    }

    return htmlAttributes;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"components":{"quickForm":{"template.quickForm.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/components/quickForm/template.quickForm.js             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("quickForm_semanticUI");
Template["quickForm_semanticUI"] = new Template("Template.quickForm_semanticUI", (function() {
  var view = this;
  return Blaze._TemplateWith(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "qfAutoFormContext"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("autoForm"), function() {
      return [ "\n\n    ", Spacebars.With(function() {
        return Spacebars.call(view.lookup("grouplessFields"));
      }, function() {
        return [ "\n      ", Blaze._TemplateWith(function() {
          return Spacebars.call(view.lookup("quickFieldsAtts"));
        }, function() {
          return Spacebars.include(view.lookupTemplate("afQuickFields"));
        }), "\n    " ];
      }), "\n\n    ", Blaze.Each(function() {
        return Spacebars.call(view.lookup("fieldGroups"));
      }, function() {
        return [ "\n      ", HTML.DIV({
          class: "ui segment af-fieldGroup"
        }, "\n        ", Spacebars.With(function() {
          return Spacebars.call(view.lookup("fieldGroupLabel"));
        }, function() {
          return [ "\n          ", HTML.DIV({
            class: "ui top attached label af-fieldGroup-heading"
          }, Blaze.View("lookup:.", function() {
            return Spacebars.mustache(view.lookup("."));
          })), "\n        " ];
        }), "\n        ", Blaze._TemplateWith(function() {
          return Spacebars.call(view.lookup("quickFieldsAtts"));
        }, function() {
          return Spacebars.include(view.lookupTemplate("afQuickFields"));
        }), "\n      "), "\n    " ];
      }), "\n\n    ", Blaze.If(function() {
        return Spacebars.call(view.lookup("qfShouldRenderButton"));
      }, function() {
        return [ "\n      ", HTML.DIV({
          class: "field"
        }, "\n        ", HTML.BUTTON(HTML.Attrs({
          type: "submit"
        }, function() {
          return Spacebars.attrMustache(view.lookup("submitButtonAtts"));
        }), "\n        ", Spacebars.With(function() {
          return Spacebars.call(Spacebars.dot(view.lookup(".."), "atts", "buttonContent"));
        }, function() {
          return [ "\n          ", Blaze.View("lookup:.", function() {
            return Spacebars.mustache(view.lookup("."));
          }), "\n        " ];
        }, function() {
          return "\n          Submit\n        ";
        }), "\n        "), "\n      "), "\n    " ];
      }), "\n  " ];
    });
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"quickForm.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/components/quickForm/quickForm.js                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.quickForm_semanticUI.helpers({
  fieldGroupLabel: function () {
    var name = this.name; // if field group name is of the form XY_abcde where "XY" is a number, remove prefix

    if (!Number.isNaN(parseInt(name.substr(0, 2), 10)) && name.charAt(2) === "_") {
      name = name.substr(3);
    } // if SimpleSchema.defaultLabel is defined, use it


    if (typeof SimpleSchema.defaultLabel === "function") {
      return SimpleSchema.defaultLabel(name);
    } else {
      // else, just capitalise name
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  },
  quickFieldsAtts: function () {
    // These are the quickForm attributes that we want to forward to
    // the afQuickFields component.
    return _.pick(this.atts, "id-prefix");
  },
  submitButtonAtts: function () {
    var qfAtts = this.atts;
    var atts = {};

    if (typeof qfAtts.buttonClasses === "string") {
      atts["class"] = qfAtts.buttonClasses;
    } else {
      atts["class"] = "ui positive submit button";
    }

    return atts;
  },
  qfAutoFormContext: function () {
    var ctx = _.clone(this.qfAutoFormContext || {});

    ctx = AutoForm.Utility.addClass(ctx, "ui form");
    delete ctx["id-prefix"];
    return ctx;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"afArrayField":{"template.afArrayField.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/components/afArrayField/template.afArrayField.js       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afArrayField_semanticUI");
Template["afArrayField_semanticUI"] = new Template("Template.afArrayField_semanticUI", (function() {
  var view = this;
  return [ HTML.H4({
    class: "ui top attached block header"
  }, "\n    ", Blaze.View("lookup:afFieldLabelText", function() {
    return Spacebars.mustache(view.lookup("afFieldLabelText"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "atts", "name")
    }));
  }), "\n  "), "\n  ", HTML.DIV({
    class: "ui secondary bottom attached segment"
  }, "\n    ", Blaze.If(function() {
    return Spacebars.dataMustache(view.lookup("afFieldIsInvalid"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "atts", "name")
    }));
  }, function() {
    return [ "\n      ", HTML.DIV({
      class: "ui pointing red basic label"
    }, "\n        ", Blaze.View("lookup:afFieldMessage", function() {
      return Spacebars.makeRaw(Spacebars.mustache(view.lookup("afFieldMessage"), Spacebars.kw({
        name: Spacebars.dot(view.lookup("."), "atts", "name")
      })));
    }), "\n      "), "\n    " ];
  }), "\n    ", Blaze._TemplateWith(function() {
    return {
      name: Spacebars.call(Spacebars.dot(view.lookup("."), "atts", "name")),
      minCount: Spacebars.call(Spacebars.dot(view.lookup("."), "atts", "minCount")),
      maxCount: Spacebars.call(Spacebars.dot(view.lookup("."), "atts", "maxCount"))
    };
  }, function() {
    return Spacebars.include(view.lookupTemplate("afEachArrayItem"), function() {
      return [ "\n      ", HTML.DIV({
        class: "field autoform-array-item"
      }, "\n        ", Blaze.If(function() {
        return Spacebars.dataMustache(view.lookup("afArrayFieldHasMoreThanMinimum"), Spacebars.kw({
          name: Spacebars.dot(view.lookup(".."), "atts", "name"),
          minCount: Spacebars.dot(view.lookup(".."), "atts", "minCount"),
          maxCount: Spacebars.dot(view.lookup(".."), "atts", "maxCount")
        }));
      }, function() {
        return [ "\n          ", HTML.DIV({
          class: "ui mini red corner label autoform-remove-item"
        }, "\n            ", HTML.I({
          class: "icon minus"
        }), "\n          "), "\n        " ];
      }), "\n        ", Blaze._TemplateWith(function() {
        return {
          name: Spacebars.call(Spacebars.dot(view.lookup("."), "name")),
          label: Spacebars.call(false),
          options: Spacebars.call(view.lookup("afOptionsFromSchema"))
        };
      }, function() {
        return Spacebars.include(view.lookupTemplate("afQuickField"));
      }), "\n      "), "\n    " ];
    });
  }), "\n    ", Blaze.If(function() {
    return Spacebars.dataMustache(view.lookup("afArrayFieldHasLessThanMaximum"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "atts", "name"),
      minCount: Spacebars.dot(view.lookup("."), "atts", "minCount"),
      maxCount: Spacebars.dot(view.lookup("."), "atts", "maxCount")
    }));
  }, function() {
    return [ "\n      ", HTML.DIV({
      class: "field"
    }, "\n        ", HTML.DIV({
      class: "ui small green icon button autoform-add-item",
      "data-autoform-field": function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "atts", "name"));
      },
      "data-autoform-mincount": function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "atts", "minCount"));
      },
      "data-autoform-maxcount": function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "atts", "maxCount"));
      }
    }, "\n          ", HTML.I({
      class: "icon plus"
    }), "\n        "), "\n      "), "\n    " ];
  }), "\n  ") ];
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"afFormGroup":{"template.afFormGroup.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/components/afFormGroup/template.afFormGroup.js         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afFormGroup_semanticUI");
Template["afFormGroup_semanticUI"] = new Template("Template.afFormGroup_semanticUI", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs({
    class: function() {
      return [ Spacebars.mustache(view.lookup("afFormGroupClass")), " ", Spacebars.mustache(view.lookup("inputClass")), " field ", Spacebars.mustache(view.lookup("requiredClass")), Blaze.If(function() {
        return Spacebars.dataMustache(view.lookup("afFieldIsInvalid"), Spacebars.kw({
          name: Spacebars.dot(view.lookup("."), "name")
        }));
      }, function() {
        return " error";
      }) ];
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("afFormGroupAtts"));
  }), "\n    ", Blaze.Unless(function() {
    return Spacebars.call(view.lookup("skipLabel"));
  }, function() {
    return [ "\n      ", HTML.LABEL(HTML.Attrs(function() {
      return Spacebars.attrMustache(view.lookup("afFieldLabelAtts"));
    }), "\n        ", Blaze.If(function() {
      return Spacebars.call(Spacebars.dot(view.lookup("."), "labelText"));
    }, function() {
      return [ "\n          ", Blaze.View("lookup:..labelText", function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "labelText"));
      }), "\n        " ];
    }, function() {
      return [ "\n          ", Blaze.View("lookup:afFieldLabelText", function() {
        return Spacebars.mustache(view.lookup("afFieldLabelText"), Spacebars.kw({
          name: Spacebars.dot(view.lookup("."), "name")
        }));
      }), "\n        " ];
    }), "\n      "), "\n    " ];
  }), "\n    ", Blaze.If(function() {
    return Spacebars.call(view.lookup("leftLabel"));
  }, function() {
    return [ "\n      ", HTML.DIV({
      class: "ui label"
    }, Blaze.View("lookup:leftLabel", function() {
      return Spacebars.mustache(view.lookup("leftLabel"));
    })), "\n    " ];
  }, function() {
    return [ "\n      ", Blaze.If(function() {
      return Spacebars.call(view.lookup("leftIcon"));
    }, function() {
      return [ "\n        ", HTML.I({
        class: function() {
          return [ Spacebars.mustache(view.lookup("leftIcon")), " icon" ];
        }
      }), "\n      " ];
    }), "\n    " ];
  }), "\n    ", Blaze._TemplateWith(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "afFieldInputAtts"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("afFieldInput"));
  }), "\n    ", Blaze.If(function() {
    return Spacebars.call(view.lookup("rightLabel"));
  }, function() {
    return [ "\n      ", HTML.DIV({
      class: "ui label"
    }, Blaze.View("lookup:rightLabel", function() {
      return Spacebars.mustache(view.lookup("rightLabel"));
    })), "\n    " ];
  }, function() {
    return [ "\n      ", Blaze.If(function() {
      return Spacebars.call(view.lookup("rightIcon"));
    }, function() {
      return [ "\n        ", HTML.I({
        class: function() {
          return [ Spacebars.mustache(view.lookup("rightIcon")), " icon" ];
        }
      }), "\n      " ];
    }), "\n    " ];
  }), "\n    ", Blaze.If(function() {
    return Spacebars.dataMustache(view.lookup("afFieldIsInvalid"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "name")
    }));
  }, function() {
    return [ "\n      ", HTML.DIV({
      class: "ui pointing red basic label"
    }, "\n        ", Blaze.View("lookup:afFieldMessage", function() {
      return Spacebars.makeRaw(Spacebars.mustache(view.lookup("afFieldMessage"), Spacebars.kw({
        name: Spacebars.dot(view.lookup("."), "name")
      })));
    }), "\n      "), "\n    " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"afFormGroup.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/components/afFormGroup/afFormGroup.js                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.afFormGroup_semanticUI.helpers({
  skipLabel: function () {
    var self = this;
    var type = AutoForm.getInputType(self.afFieldInputAtts);
    return self.skipLabel || type === "boolean-checkbox";
  },
  requiredClass: function () {
    if (this.required) {
      return "required";
    }
  },
  inputClass: function () {
    var leftLabel = this.afFieldInputAtts.leftLabel;
    var rightLabel = this.afFieldInputAtts.rightLabel;
    var leftIcon = this.afFieldInputAtts.leftIcon;
    var rightIcon = this.afFieldInputAtts.rightIcon;

    if (leftLabel || rightLabel || leftIcon || rightIcon) {
      var className = "ui";

      if (leftLabel && rightIcon) {
        className += " labeled icon";
      } else if (leftIcon && rightLabel) {
        className += " left icon right labeled";
      } else if (leftLabel) {
        className += " labeled";
      } else if (rightLabel) {
        className += " right labeled";
      } else if (leftIcon) {
        className += " left icon";
      } else if (rightIcon) {
        className += " icon";
      }

      return className + " fluid input";
    }
  },
  leftLabel: function () {
    return this.afFieldInputAtts.leftLabel;
  },
  rightLabel: function () {
    return this.afFieldInputAtts.rightLabel;
  },
  leftIcon: function () {
    return this.afFieldInputAtts.leftIcon;
  },
  rightIcon: function () {
    return this.afFieldInputAtts.rightIcon;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"afObjectField":{"template.afObjectField.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/components/afObjectField/template.afObjectField.js     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afObjectField_semanticUI");
Template["afObjectField_semanticUI"] = new Template("Template.afObjectField_semanticUI", (function() {
  var view = this;
  return [ Spacebars.With(function() {
    return Spacebars.dataMustache(view.lookup("afFieldLabelText"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "name")
    }));
  }, function() {
    return [ "\n    ", HTML.H4({
      class: "ui top attached block header"
    }, Blaze.View("lookup:.", function() {
      return Spacebars.mustache(view.lookup("."));
    })), "\n  " ];
  }), "\n  ", HTML.DIV({
    class: function() {
      return [ "ui secondary bottom attached segment form", Blaze.If(function() {
        return Spacebars.dataMustache(view.lookup("afFieldIsInvalid"), Spacebars.kw({
          name: Spacebars.dot(view.lookup("."), "name")
        }));
      }, function() {
        return " error";
      }) ];
    }
  }, "\n    ", Blaze.If(function() {
    return Spacebars.dataMustache(view.lookup("afFieldIsInvalid"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "name")
    }));
  }, function() {
    return [ "\n      ", HTML.DIV({
      class: "ui pointing red basic label"
    }, "\n        ", Blaze.View("lookup:afFieldMessage", function() {
      return Spacebars.makeRaw(Spacebars.mustache(view.lookup("afFieldMessage"), Spacebars.kw({
        name: Spacebars.dot(view.lookup("."), "name")
      })));
    }), "\n      "), "\n    " ];
  }), "\n    ", Blaze._TemplateWith(function() {
    return Spacebars.call(view.lookup("quickFieldsAtts"));
  }, function() {
    return Spacebars.include(view.lookupTemplate("afQuickFields"));
  }), "\n  ") ];
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"afObjectField.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/components/afObjectField/afObjectField.js              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.afObjectField_semanticUI.helpers({
  quickFieldsAtts: function () {
    return _.pick(this, "name", "id-prefix");
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"inputTypes":{"basic-select":{"template.basic-select.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/basic-select/template.basic-select.js       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afBasicSelect_semanticUI");
Template["afBasicSelect_semanticUI"] = new Template("Template.afBasicSelect_semanticUI", (function() {
  var view = this;
  return HTML.SELECT(HTML.Attrs(function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }), "\n    ", Blaze.Each(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
  }, function() {
    return [ "\n      ", Blaze.If(function() {
      return Spacebars.call(Spacebars.dot(view.lookup("."), "optgroup"));
    }, function() {
      return [ "\n        ", HTML.OPTGROUP({
        label: function() {
          return Spacebars.mustache(Spacebars.dot(view.lookup("."), "optgroup"));
        }
      }, "\n          ", Blaze.Each(function() {
        return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
      }, function() {
        return [ "\n            ", HTML.OPTION(HTML.Attrs(function() {
          return Spacebars.attrMustache(view.lookup("afSelectOptionAtts"));
        }), Blaze.View("lookup:..label", function() {
          return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
        })), "\n          " ];
      }), "\n        "), "\n      " ];
    }, function() {
      return [ "\n        ", HTML.OPTION(HTML.Attrs(function() {
        return Spacebars.attrMustache(view.lookup("afSelectOptionAtts"));
      }), Blaze.View("lookup:..label", function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
      })), "\n      " ];
    }), "\n    " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"basic-select.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/basic-select/basic-select.js                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("basic-select", {
  template: "afBasicSelect",
  valueOut: function () {
    return this.val();
  },
  valueConverters: {
    stringArray: AutoForm.valueConverters.stringToStringArray,
    number: AutoForm.valueConverters.stringToNumber,
    numberArray: AutoForm.valueConverters.stringToNumberArray,
    "boolean": AutoForm.valueConverters.stringToBoolean,
    booleanArray: AutoForm.valueConverters.stringToBooleanArray,
    date: AutoForm.valueConverters.stringToDate,
    dateArray: AutoForm.valueConverters.stringToDateArray
  },
  contextAdjust: function (context) {
    // can fix issues with some browsers selecting the firstOption instead of the selected option
    context.atts.autocomplete = "off";

    var itemAtts = _.omit(context.atts, "firstOption");

    var firstOption = context.atts.firstOption; // build items list

    context.items = []; // If a firstOption was provided, add that to the items list first

    if (firstOption !== false) {
      context.items.push({
        name: context.name,
        label: typeof firstOption === "string" ? firstOption : "(Select One)",
        value: "",
        // _id must be included because it is a special property that
        // #each uses to track unique list items when adding and removing them
        // See https://github.com/meteor/meteor/issues/2174
        //
        // Setting this to an empty string caused problems if option with value
        // 1 was in the options list because Spacebars evaluates "" to 1 and
        // considers that a duplicate.
        // See https://github.com/aldeed/meteor-autoform/issues/656
        _id: "AUTOFORM_EMPTY_FIRST_OPTION",
        selected: false,
        atts: itemAtts
      });
    }

    var buildOption = function (option) {
      return {
        name: context.name,
        label: option.label,
        value: option.value,
        htmlAtts: _.omit(option, "label", "value"),
        // _id must be included because it is a special property that
        // #each uses to track unique list items when adding and removing them
        // See https://github.com/meteor/meteor/issues/2174
        //
        // The toString() is necessary because otherwise Spacebars evaluates
        // any string to 1 if the other values are numbers, and then considers
        // that a duplicate.
        // See https://github.com/aldeed/meteor-autoform/issues/656
        _id: option.value.toString(),
        selected: option.value === context.value,
        atts: itemAtts
      };
    }; // Add all defined options


    _.each(context.selectOptions, function (option) {
      if (option.optgroup) {
        var subOptions = _.map(option.items, buildOption);

        context.items.push({
          optgroup: option.optgroup,
          items: subOptions
        });
      } else {
        context.items.push(buildOption(option));
      }
    });

    return context;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"boolean-checkbox":{"template.boolean-checkbox.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/boolean-checkbox/template.boolean-checkbox. //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afCheckbox_semanticUI");
Template["afCheckbox_semanticUI"] = new Template("Template.afCheckbox_semanticUI", (function() {
  var view = this;
  return HTML.DIV({
    class: function() {
      return [ "ui ", Spacebars.mustache(Spacebars.dot(view.lookup("atts"), "checkboxType")), " checkbox" ];
    }
  }, "\n    ", HTML.INPUT(HTML.Attrs({
    type: "checkbox",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("inputAtts"));
  })), "\n    ", HTML.LABEL(Blaze.View("lookup:afFieldLabelText", function() {
    return Spacebars.mustache(view.lookup("afFieldLabelText"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "name")
    }));
  })), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"boolean-checkbox.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/boolean-checkbox/boolean-checkbox.js        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.afCheckbox_semanticUI.onRendered(function () {
  this.$(this.firstNode).checkbox(this.data.atts.settings);
});
Template.afCheckbox_semanticUI.helpers({
  inputAtts: function () {
    return _.omit(this.atts, "checkboxType");
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"button":{"template.button.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/button/template.button.js                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputButton_semanticUI");
Template["afInputButton_semanticUI"] = new Template("Template.afInputButton_semanticUI", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "button",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"button.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/button/button.js                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.afInputButton_semanticUI.helpers({
  atts: function () {
    var atts = _.clone(this.atts); // Add semantic-ui class


    atts = AutoForm.Utility.addClass(atts, "ui button");
    return atts;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"color":{"template.color.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/color/template.color.js                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputColor_semanticUI");
Template["afInputColor_semanticUI"] = new Template("Template.afInputColor_semanticUI", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "color",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"date":{"template.date.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/date/template.date.js                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputDate_semanticUI");
Template["afInputDate_semanticUI"] = new Template("Template.afInputDate_semanticUI", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "date",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"datetime":{"template.datetime.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/datetime/template.datetime.js               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputDateTime_semanticUI");
Template["afInputDateTime_semanticUI"] = new Template("Template.afInputDateTime_semanticUI", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "datetime",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"datetime-local":{"template.datetime-local.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/datetime-local/template.datetime-local.js   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputDateTimeLocal_semanticUI");
Template["afInputDateTimeLocal_semanticUI"] = new Template("Template.afInputDateTimeLocal_semanticUI", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "datetime-local",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"email":{"template.email.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/email/template.email.js                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputEmail_semanticUI");
Template["afInputEmail_semanticUI"] = new Template("Template.afInputEmail_semanticUI", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "email",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"month":{"template.month.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/month/template.month.js                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputMonth_semanticUI");
Template["afInputMonth_semanticUI"] = new Template("Template.afInputMonth_semanticUI", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "month",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"number":{"template.number.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/number/template.number.js                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputNumber_semanticUI");
Template["afInputNumber_semanticUI"] = new Template("Template.afInputNumber_semanticUI", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "number",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"password":{"template.password.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/password/template.password.js               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputPassword_semanticUI");
Template["afInputPassword_semanticUI"] = new Template("Template.afInputPassword_semanticUI", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "password",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"radio":{"template.radio.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/radio/template.radio.js                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afRadio_semanticUI");
Template["afRadio_semanticUI"] = new Template("Template.afRadio_semanticUI", (function() {
  var view = this;
  return HTML.DIV({
    class: "ui radio checkbox"
  }, "\n    ", HTML.LABEL("\n      ", HTML.INPUT(HTML.Attrs({
    type: "radio",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  })), "\n      ", Blaze.View("lookup:afFieldLabelText", function() {
    return Spacebars.mustache(view.lookup("afFieldLabelText"), Spacebars.kw({
      name: Spacebars.dot(view.lookup("."), "name")
    }));
  }), "\n    "), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"radio.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/radio/radio.js                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.afRadio_semanticUI.helpers({
  atts: function () {
    var atts = _.clone(this.atts);

    if (this.selected) {
      atts.checked = "";
    }

    return atts;
  }
});
Template.afRadio_semanticUI.onRendered(function () {
  this.$(this.firstNode).checkbox(this.data.atts.settings);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"range":{"template.range.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/range/template.range.js                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputRange_semanticUI");
Template["afInputRange_semanticUI"] = new Template("Template.afInputRange_semanticUI", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "range",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"reset":{"template.reset.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/reset/template.reset.js                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputReset_semanticUI");
Template["afInputReset_semanticUI"] = new Template("Template.afInputReset_semanticUI", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "reset",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"reset.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/reset/reset.js                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.afInputReset_semanticUI.helpers({
  atts: function () {
    var atts = _.clone(this.atts); // Add semantic-ui class


    atts = AutoForm.Utility.addClass(atts, "ui button");
    return atts;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"search":{"template.search.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/search/template.search.js                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputSearch_semanticUI");
Template["afInputSearch_semanticUI"] = new Template("Template.afInputSearch_semanticUI", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "search",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"select":{"template.select.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/select/template.select.js                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afSelect_semanticUI");
Template["afSelect_semanticUI"] = new Template("Template.afSelect_semanticUI", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs(function() {
    return Spacebars.attrMustache(view.lookup("divAtts"));
  }), "\n    ", HTML.INPUT(HTML.Attrs({
    type: "hidden",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("inputAtts"));
  })), "\n    ", Blaze.If(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "atts", "placeholder"));
  }, function() {
    return [ "\n      ", HTML.DIV({
      class: "default text"
    }, Blaze.View("lookup:..atts.placeholder", function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "atts", "placeholder"));
    })), "\n    " ];
  }, function() {
    return [ "\n      ", HTML.DIV({
      class: "text"
    }), "\n    " ];
  }), HTML.Raw('\n    <i class="dropdown icon"></i>\n    '), HTML.DIV({
    class: "menu"
  }, "\n      ", Blaze.If(function() {
    return Spacebars.call(view.lookup("showClearButton"));
  }, function() {
    return [ "\n        ", HTML.DIV({
      class: "ui fluid compact clear button"
    }, HTML.I({
      class: "erase icon"
    })), "\n      " ];
  }), "\n      ", Blaze.Each(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
  }, function() {
    return [ "\n        ", Spacebars.include(view.lookupTemplate("afSelectRecursive")), "\n      " ];
  }), "\n    "), "\n  ");
}));

Template.__checkName("afSelectRecursive");
Template["afSelectRecursive"] = new Template("Template.afSelectRecursive", (function() {
  var view = this;
  return Blaze.If(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "itemGroup"));
  }, function() {
    return [ "\n    ", HTML.DIV({
      class: "header"
    }, Blaze.View("lookup:..itemGroup", function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "itemGroup"));
    })), "\n    ", Blaze.Each(function() {
      return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
    }, function() {
      return [ "\n      ", Spacebars.include(view.lookupTemplate("afSelectRecursive")), "\n    " ];
    }), "\n  " ];
  }, function() {
    return [ "\n    ", Blaze.If(function() {
      return Spacebars.call(Spacebars.dot(view.lookup("."), "category"));
    }, function() {
      return [ "\n      ", HTML.DIV({
        class: "item",
        "data-value": function() {
          return Spacebars.mustache(Spacebars.dot(view.lookup("."), "category", "value"));
        }
      }, "\n        ", HTML.I({
        class: "dropdown icon"
      }), "\n        ", HTML.SPAN({
        class: "text"
      }, Blaze.View("lookup:..category.label", function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "category", "label"));
      })), "\n        ", HTML.DIV({
        class: "menu"
      }, "\n          ", Blaze.Each(function() {
        return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
      }, function() {
        return [ "\n            ", Spacebars.include(view.lookupTemplate("afSelectRecursive")), "\n          " ];
      }), "\n        "), "\n      "), "\n    " ];
    }, function() {
      return [ "\n      ", HTML.DIV(HTML.Attrs({
        "data-value": function() {
          return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
        }
      }, function() {
        return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "htmlAtts"));
      }), "\n        ", Blaze.If(function() {
        return Spacebars.call(Spacebars.dot(view.lookup("."), "icon"));
      }, function() {
        return [ "\n          ", HTML.I({
          class: function() {
            return Spacebars.mustache(Spacebars.dot(view.lookup("."), "icon"));
          }
        }), "\n        " ];
      }), "\n        ", Blaze.If(function() {
        return Spacebars.call(Spacebars.dot(view.lookup("."), "circularLabel"));
      }, function() {
        return [ "\n          ", HTML.DIV({
          class: function() {
            return [ "ui ", Spacebars.mustache(Spacebars.dot(view.lookup("."), "circularLabel")), " empty circular label" ];
          }
        }), "\n        " ];
      }), "\n        ", Blaze.If(function() {
        return Spacebars.call(Spacebars.dot(view.lookup("."), "description"));
      }, function() {
        return [ "\n          ", HTML.SPAN({
          class: "description"
        }, Blaze.View("lookup:..description", function() {
          return Spacebars.mustache(Spacebars.dot(view.lookup("."), "description"));
        })), "\n        " ];
      }), "\n        ", Blaze.View("lookup:..label", function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
      }), "\n      "), "\n    " ];
    }), "\n  " ];
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"select.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/select/select.js                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
AutoForm.addInputType("select", {
  template: "afSelect",
  valueOut: function () {
    return this.val();
  },
  valueConverters: {
    stringArray: AutoForm.valueConverters.stringToStringArray,
    number: AutoForm.valueConverters.stringToNumber,
    numberArray: AutoForm.valueConverters.stringToNumberArray,
    "boolean": AutoForm.valueConverters.stringToBoolean,
    booleanArray: AutoForm.valueConverters.stringToBooleanArray,
    date: AutoForm.valueConverters.stringToDate,
    dateArray: AutoForm.valueConverters.stringToDateArray
  },
  contextAdjust: function (context) {
    // can fix issues with some browsers selecting the firstOption instead of the selected option
    context.atts.autocomplete = "off"; // delete eventual option used in other templates

    delete context.atts.firstOption;

    var itemAtts = _.omit(context.atts, "placeholder"); // build items list


    context.items = [];

    var buildItem = function (item) {
      return {
        name: context.name,
        label: item.label,
        icon: item.icon || false,
        description: item.description || false,
        value: item.value,
        htmlAtts: _.extend({
          "class": "item"
        }, _.omit(item, "label", "value", "icon", "circularLabel", "description", "itemGroup", "category", "items")),
        // _id must be included because it is a special property that
        // #each uses to track unique list items when adding and removing them
        // See https://github.com/meteor/meteor/issues/2174
        //
        // The toString() is necessary because otherwise Spacebars evaluates
        // any string to 1 if the other values are numbers, and then considers
        // that a duplicate.
        // See https://github.com/aldeed/meteor-autoform/issues/656
        _id: item.value.toString(),
        atts: itemAtts
      };
    }; // Add all defined options


    _.each(context.selectOptions, function (item) {
      if (item.itemGroup) {
        var subItems = _.map(item.items, buildItem);

        context.items.push({
          itemGroup: item.itemGroup,
          items: subItems
        });
      } else if (item.category) {
        var _subItems = _.map(item.items, buildItem);

        context.items.push({
          category: item.category,
          items: _subItems
        });
      } else {
        context.items.push(buildItem(item));
      }
    });

    return context;
  }
});
Template.afSelect_semanticUI.helpers({
  divAtts: function () {
    var atts = {
      "class": "ui dropdown"
    }; // Add custom classes or default

    if (_.isString(this.atts.class)) {
      atts = AutoForm.Utility.addClass(atts, this.atts.class);
    } else {
      atts = AutoForm.Utility.addClass(atts, "fluid selection");
    } // Add the disabled class if required


    if (this.atts.disabled === "") {
      atts = AutoForm.Utility.addClass(atts, "disabled");
    } // Add search class, also add selection for proper design


    if (this.atts.search || this.atts.fullTextSearch) {
      atts = AutoForm.Utility.addClass(atts, "search selection");
    } // Add multiple class


    if (this.atts.multiple) {
      atts = AutoForm.Utility.addClass(atts, "multiple");
    }

    return atts;
  },
  inputAtts: function () {
    return _.pick(this.atts, "name", "id", "required", "data-schema-key", "autocomplete", "value");
  },
  showClearButton: function () {
    return this.atts.required !== "" && !this.atts.multiple;
  }
});
Template.afSelect_semanticUI.events({
  "click .ui.clear.button": function (event, template) {
    template.$(".ui.dropdown").dropdown("clear").dropdown("hide");
  }
});
Template.afSelect_semanticUI.onRendered(function () {
  var node = this.$(this.firstNode);
  node.dropdown(_.extend({
    fullTextSearch: this.data.atts.fullTextSearch || false,
    allowAdditions: this.data.atts.allowAdditions || false,
    maxSelections: this.data.atts.maxSelections || false,
    allowCategorySelection: this.data.atts.allowCategorySelection || false,
    useLabels: this.data.atts.useLabels === false ? false : true
  }, this.data.atts.settings));
  this.autorun(function (c) {
    var data = Template.currentData();

    if (data.value) {
      node.dropdown("set selected", data.value);
      c.stop();
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"select-checkbox":{"template.select-checkbox.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/select-checkbox/template.select-checkbox.js //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afCheckboxGroup_semanticUI");
Template["afCheckboxGroup_semanticUI"] = new Template("Template.afCheckboxGroup_semanticUI", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs({
    class: "grouped fields"
  }, function() {
    return Spacebars.attrMustache(view.lookup("dsk"));
  }), "\n  ", Blaze.Each(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
  }, function() {
    return [ "\n    ", HTML.DIV({
      class: "field"
    }, "\n      ", HTML.DIV({
      class: "ui checkbox"
    }, "\n        ", HTML.INPUT(HTML.Attrs({
      type: "checkbox",
      value: function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
      }
    }, function() {
      return Spacebars.attrMustache(view.lookup("atts"));
    })), "\n        ", HTML.LABEL(Blaze.View("lookup:label", function() {
      return Spacebars.mustache(view.lookup("label"));
    })), "\n      "), "\n    "), "\n  " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"select-checkbox.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/select-checkbox/select-checkbox.js          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.afCheckboxGroup_semanticUI.helpers({
  atts: function () {
    var atts = _.clone(this.atts);

    if (this.selected) {
      atts.checked = "checked";
    } // remove data-schema-key attribute because we put it
    // on the entire group


    delete atts["data-schema-key"];
    return atts;
  },
  dsk: function () {
    return {
      "data-schema-key": this.atts["data-schema-key"]
    };
  }
});
Template.afCheckboxGroup_semanticUI.onRendered(function () {
  this.$(this.firstNode).find(".ui.checkbox").checkbox(this.data.atts.settings);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"select-checkbox-inline":{"template.select-checkbox-inline.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/select-checkbox-inline/template.select-chec //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afCheckboxGroupInline_semanticUI");
Template["afCheckboxGroupInline_semanticUI"] = new Template("Template.afCheckboxGroupInline_semanticUI", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs({
    class: "inline fields"
  }, function() {
    return Spacebars.attrMustache(view.lookup("dsk"));
  }), "\n  ", Blaze.Each(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
  }, function() {
    return [ "\n    ", HTML.DIV({
      class: "field"
    }, "\n      ", HTML.DIV({
      class: "ui checkbox"
    }, "\n        ", HTML.INPUT(HTML.Attrs({
      type: "checkbox",
      value: function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
      }
    }, function() {
      return Spacebars.attrMustache(view.lookup("atts"));
    })), "\n        ", HTML.LABEL(Blaze.View("lookup:label", function() {
      return Spacebars.mustache(view.lookup("label"));
    })), "\n      "), "\n    "), "\n  " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"select-checkbox-inline.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/select-checkbox-inline/select-checkbox-inli //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.afCheckboxGroupInline_semanticUI.helpers({
  atts: function () {
    var atts = _.clone(this.atts);

    if (this.selected) {
      atts.checked = "checked";
    } // remove data-schema-key attribute because we put it
    // on the entire group


    delete atts["data-schema-key"];
    return atts;
  },
  dsk: function () {
    return {
      "data-schema-key": this.atts["data-schema-key"]
    };
  }
});
Template.afCheckboxGroupInline_semanticUI.onRendered(function () {
  this.$(this.firstNode).find(".ui.checkbox").checkbox(this.data.atts.settings);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"select-radio":{"template.select-radio.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/select-radio/template.select-radio.js       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afRadioGroup_semanticUI");
Template["afRadioGroup_semanticUI"] = new Template("Template.afRadioGroup_semanticUI", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs({
    class: "grouped fields"
  }, function() {
    return Spacebars.attrMustache(view.lookup("dsk"));
  }), "\n    ", Blaze.Each(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
  }, function() {
    return [ "\n      ", HTML.DIV({
      class: "field"
    }, "\n        ", HTML.DIV({
      class: "ui radio checkbox"
    }, "\n          ", HTML.INPUT(HTML.Attrs({
      type: "radio",
      value: function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
      }
    }, function() {
      return Spacebars.attrMustache(view.lookup("atts"));
    })), "\n          ", HTML.LABEL(Blaze.View("lookup:..label", function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
    })), "\n        "), "\n      "), "\n    " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"select-radio.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/select-radio/select-radio.js                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.afRadioGroup_semanticUI.helpers({
  atts: function () {
    var atts = _.clone(this.atts);

    if (this.selected) {
      atts.checked = "checked";
    } // remove data-schema-key attribute because we put it
    // on the entire group


    delete atts["data-schema-key"];
    return atts;
  },
  dsk: function () {
    return {
      "data-schema-key": this.atts["data-schema-key"]
    };
  }
});
Template.afRadioGroup_semanticUI.onRendered(function () {
  this.$(this.firstNode).find(".ui.radio.checkbox").checkbox(this.data.atts.settings);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"select-radio-inline":{"template.select-radio-inline.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/select-radio-inline/template.select-radio-i //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afRadioGroupInline_semanticUI");
Template["afRadioGroupInline_semanticUI"] = new Template("Template.afRadioGroupInline_semanticUI", (function() {
  var view = this;
  return HTML.DIV(HTML.Attrs({
    class: "inline fields"
  }, function() {
    return Spacebars.attrMustache(view.lookup("dsk"));
  }), "\n    ", Blaze.Each(function() {
    return Spacebars.call(Spacebars.dot(view.lookup("."), "items"));
  }, function() {
    return [ "\n      ", HTML.DIV({
      class: "field"
    }, "\n        ", HTML.DIV({
      class: "ui radio checkbox"
    }, "\n          ", HTML.INPUT(HTML.Attrs({
      type: "radio",
      value: function() {
        return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
      }
    }, function() {
      return Spacebars.attrMustache(view.lookup("atts"));
    })), "\n          ", HTML.LABEL(Blaze.View("lookup:..label", function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "label"));
    })), "\n        "), "\n      "), "\n    " ];
  }), "\n  ");
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"select-radio-inline.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/select-radio-inline/select-radio-inline.js  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.afRadioGroupInline_semanticUI.helpers({
  atts: function () {
    var atts = _.clone(this.atts);

    if (this.selected) {
      atts.checked = "checked";
    } // remove data-schema-key attribute because we put it
    // on the entire group


    delete atts["data-schema-key"];
    return atts;
  },
  dsk: function () {
    return {
      "data-schema-key": this.atts["data-schema-key"]
    };
  }
});
Template.afRadioGroupInline_semanticUI.onRendered(function () {
  this.$(this.firstNode).find(".ui.radio.checkbox").checkbox(this.data.atts.settings);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"submit":{"template.submit.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/submit/template.submit.js                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputSubmit_semanticUI");
Template["afInputSubmit_semanticUI"] = new Template("Template.afInputSubmit_semanticUI", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "submit",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(view.lookup("atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"submit.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/submit/submit.js                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Template.afInputSubmit_semanticUI.helpers({
  atts: function () {
    var atts = _.clone(this.atts); // Add semantic-ui class


    atts = AutoForm.Utility.addClass(atts, "ui positive button");
    return atts;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"tel":{"template.tel.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/tel/template.tel.js                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputTel_semanticUI");
Template["afInputTel_semanticUI"] = new Template("Template.afInputTel_semanticUI", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "tel",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"text":{"template.text.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/text/template.text.js                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputText_semanticUI");
Template["afInputText_semanticUI"] = new Template("Template.afInputText_semanticUI", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "text",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"textarea":{"template.textarea.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/textarea/template.textarea.js               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afTextarea_semanticUI");
Template["afTextarea_semanticUI"] = new Template("Template.afTextarea_semanticUI", (function() {
  var view = this;
  return HTML.TEXTAREA(HTML.Attrs(function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }, {
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"time":{"template.time.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/time/template.time.js                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputTime_semanticUI");
Template["afInputTime_semanticUI"] = new Template("Template.afInputTime_semanticUI", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "time",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"url":{"template.url.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/url/template.url.js                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputUrl_semanticUI");
Template["afInputUrl_semanticUI"] = new Template("Template.afInputUrl_semanticUI", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "url",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"week":{"template.week.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/fabienb4_autoform-semantic-ui/templates/semantic-ui/inputTypes/week/template.week.js                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("afInputWeek_semanticUI");
Template["afInputWeek_semanticUI"] = new Template("Template.afInputWeek_semanticUI", (function() {
  var view = this;
  return HTML.INPUT(HTML.Attrs({
    type: "week",
    value: function() {
      return Spacebars.mustache(Spacebars.dot(view.lookup("."), "value"));
    }
  }, function() {
    return Spacebars.attrMustache(Spacebars.dot(view.lookup("."), "atts"));
  }));
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".html",
    ".css"
  ]
});
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/semantic-ui.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/components/quickForm/template.quickForm.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/components/quickForm/quickForm.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/components/afArrayField/template.afArrayField.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/components/afFormGroup/template.afFormGroup.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/components/afFormGroup/afFormGroup.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/components/afObjectField/template.afObjectField.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/components/afObjectField/afObjectField.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/basic-select/template.basic-select.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/basic-select/basic-select.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/boolean-checkbox/template.boolean-checkbox.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/boolean-checkbox/boolean-checkbox.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/button/template.button.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/button/button.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/color/template.color.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/date/template.date.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/datetime/template.datetime.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/datetime-local/template.datetime-local.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/email/template.email.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/month/template.month.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/number/template.number.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/password/template.password.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/radio/template.radio.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/radio/radio.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/range/template.range.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/reset/template.reset.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/reset/reset.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/search/template.search.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/select/template.select.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/select/select.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/select-checkbox/template.select-checkbox.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/select-checkbox/select-checkbox.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/select-checkbox-inline/template.select-checkbox-inline.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/select-checkbox-inline/select-checkbox-inline.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/select-radio/template.select-radio.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/select-radio/select-radio.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/select-radio-inline/template.select-radio-inline.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/select-radio-inline/select-radio-inline.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/submit/template.submit.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/submit/submit.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/tel/template.tel.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/text/template.text.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/textarea/template.textarea.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/time/template.time.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/url/template.url.js");
require("/node_modules/meteor/fabienb4:autoform-semantic-ui/templates/semantic-ui/inputTypes/week/template.week.js");

/* Exports */
Package._define("fabienb4:autoform-semantic-ui");

})();
