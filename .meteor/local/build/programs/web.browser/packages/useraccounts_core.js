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
var Accounts = Package['accounts-base'].Accounts;
var check = Package.check.check;
var Match = Package.check.Match;
var _ = Package.underscore._;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var ReactiveDict = Package['reactive-dict'].ReactiveDict;
var Template = Package['templating-runtime'].Template;
var $ = Package.jquery.$;
var jQuery = Package.jquery.jQuery;
var HTML = Package.htmljs.HTML;
var Spacebars = Package.spacebars.Spacebars;

/* Package-scope variables */
var capitalize, signedInAs, Field, STATE_PAT, ERRORS_PAT, INFO_PAT, INPUT_ICONS_PAT, ObjWithStringValues, TEXTS_PAT, CONFIG_PAT, FIELD_SUB_PAT, FIELD_PAT, AT, AccountsTemplates, markIfMissing, options;

(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/utils.js                                                                          //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
capitalize = function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

signedInAs =  function() {
  var user = Meteor.user();

  if (user) {
    if (user.username) {
      return user.username;
    } else if (user.profile && user.profile.name) {
      return user.profile.name;
    } else if (user.emails && user.emails[0]) {
      return user.emails[0].address;
    } else {
      return "Signed In";
    }
  }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/field.js                                                                          //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
// ---------------------------------------------------------------------------------
// Field object
// ---------------------------------------------------------------------------------

Field = function(field) {
  check(field, FIELD_PAT);
  _.defaults(this, field);

  this.validating = new ReactiveVar(false);
  this.status = new ReactiveVar(null);
};

if (Meteor.isClient) {
  Field.prototype.clearStatus = function() {
    return this.status.set(null);
  };
}

if (Meteor.isServer) {
  Field.prototype.clearStatus = function() {
    // Nothing to do server-side
    return;
  };
}

Field.prototype.fixValue = function(value) {
  if (this.type === "checkbox") {
    return !!value;
  }

  if (this.type === "select") {
    // TODO: something working...
    return value;
  }

  if (this.type === "radio") {
    // TODO: something working...
    return value;
  }

  // Possibly applies required transformations to the input value
  if (this.trim) {
    value = value.trim();
  }

  if (this.lowercase) {
    value = value.toLowerCase();
  }

  if (this.uppercase) {
    value = value.toUpperCase();
  }

  if (!!this.transform) {
    value = this.transform(value);
  }

  return value;
};

if (Meteor.isClient) {
  Field.prototype.getDisplayName = function(state) {
    var displayName = this.displayName;

    if (_.isFunction(displayName)) {
      displayName = displayName();
    } else if (_.isObject(displayName)) {
      displayName = displayName[state] || displayName["default"];
    }

    if (!displayName) {
      displayName = capitalize(this._id);
    }

    return displayName;
  };
}

if (Meteor.isClient) {
  Field.prototype.getPlaceholder = function(state) {
    var placeholder = this.placeholder;

    if (_.isObject(placeholder)) {
      placeholder = placeholder[state] || placeholder["default"];
    }

    if (!placeholder) {
      placeholder = capitalize(this._id);
    }

    return placeholder;
  };
}

Field.prototype.getStatus = function() {
  return this.status.get();
};

if (Meteor.isClient) {
  Field.prototype.getValue = function(templateInstance) {
    if (this.type === "checkbox") {
      return !!(templateInstance.$("#at-field-" + this._id + ":checked").val());
    }

    if (this.type === "radio") {
      return templateInstance.$("[name=at-field-"+ this._id + "]:checked").val();
    }

    return templateInstance.$("#at-field-" + this._id).val();
  };
}

if (Meteor.isClient) {
  Field.prototype.hasError = function() {
    return this.negativeValidation && this.status.get();
  };
}

if (Meteor.isClient) {
  Field.prototype.hasIcon = function() {
    if (this.showValidating && this.isValidating()) {
      return true;
    }

    if (this.negativeFeedback && this.hasError()) {
      return true;
    }

    if (this.positiveFeedback && this.hasSuccess()) {
      return true;
    }
  };
}

if (Meteor.isClient) {
  Field.prototype.hasSuccess = function() {
    return this.positiveValidation && this.status.get() === false;
  };
}

if (Meteor.isClient)
  Field.prototype.iconClass = function() {
    if (this.isValidating()) {
      return AccountsTemplates.texts.inputIcons["isValidating"];
    }

    if (this.hasError()) {
      return AccountsTemplates.texts.inputIcons["hasError"];
    }

    if (this.hasSuccess()) {
      return AccountsTemplates.texts.inputIcons["hasSuccess"];
    }
  };

if (Meteor.isClient) {
  Field.prototype.isValidating = function() {
    return this.validating.get();
  };
}

if (Meteor.isClient) {
  Field.prototype.setError = function(err) {
    check(err, Match.OneOf(String, undefined, Boolean));

    if (err === false) {
      return this.status.set(false);
    }

    return this.status.set(err || true);
  };
}

if (Meteor.isServer) {
  Field.prototype.setError = function(err) {
    // Nothing to do server-side
    return;
  };
}

if (Meteor.isClient) {
  Field.prototype.setSuccess = function() {
    return this.status.set(false);
  };
}

if (Meteor.isServer) {
  Field.prototype.setSuccess = function() {
    // Nothing to do server-side
    return;
  };
}

if (Meteor.isClient) {
  Field.prototype.setValidating = function(state) {
    check(state, Boolean);
    return this.validating.set(state);
  };
}

if (Meteor.isServer) {
  Field.prototype.setValidating = function(state) {
    // Nothing to do server-side
    return;
  };
}

if (Meteor.isClient) {
  Field.prototype.setValue = function(templateInstance, value) {
    if (this.type === "checkbox") {
      templateInstance.$("#at-field-" + this._id).prop('checked', true);
      return;
    }

    if (this.type === "radio") {
      templateInstance.$("[name=at-field-"+ this._id + "]").prop('checked', true);
      return;
    }

    templateInstance.$("#at-field-" + this._id).val(value);
  };
}

Field.prototype.validate = function(value, strict) {
  check(value, Match.OneOf(undefined, String, Boolean));
  this.setValidating(true);
  this.clearStatus();

  if (_.isUndefined(value) || value === '') {
    if (!!strict) {
      if (this.required) {
        this.setError(AccountsTemplates.texts.requiredField);
        this.setValidating(false);

        return AccountsTemplates.texts.requiredField;
      } else {
        this.setSuccess();
        this.setValidating(false);

        return false;
      }
    } else {
      this.clearStatus();
      this.setValidating(false);

      return null;
    }
  }

  var valueLength = value.length;
  var minLength = this.minLength;
  if (minLength && valueLength < minLength) {
    this.setError(AccountsTemplates.texts.minRequiredLength + ": " + minLength);
    this.setValidating(false);

    return AccountsTemplates.texts.minRequiredLength + ": " + minLength;
  }

  var maxLength = this.maxLength;
  if (maxLength && valueLength > maxLength) {
    this.setError(AccountsTemplates.texts.maxAllowedLength + ": " + maxLength);
    this.setValidating(false);

    return AccountsTemplates.texts.maxAllowedLength + ": " + maxLength;
  }

  if (this.re && valueLength && !value.match(this.re)) {
    this.setError(this.errStr);
    this.setValidating(false);

    return this.errStr;
  }

  if (this.func) {
    var result = this.func(value);
    var err = result === true ? this.errStr || true : result;

    if (_.isUndefined(result)) {
      return err;
    }

    this.status.set(err);
    this.setValidating(false);

    return err;
  }

  this.setSuccess();
  this.setValidating(false);

  return false;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/core.js                                                                           //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
// ---------------------------------------------------------------------------------
// Patterns for methods" parameters
// ---------------------------------------------------------------------------------

STATE_PAT = {
  changePwd: Match.Optional(String),
  enrollAccount: Match.Optional(String),
  forgotPwd: Match.Optional(String),
  resetPwd: Match.Optional(String),
  signIn: Match.Optional(String),
  signUp: Match.Optional(String),
  verifyEmail: Match.Optional(String),
  resendVerificationEmail: Match.Optional(String),
};

ERRORS_PAT = {
  accountsCreationDisabled: Match.Optional(String),
  cannotRemoveService: Match.Optional(String),
  captchaVerification: Match.Optional(String),
  loginForbidden: Match.Optional(String),
  mustBeLoggedIn: Match.Optional(String),
  pwdMismatch: Match.Optional(String),
  validationErrors: Match.Optional(String),
  verifyEmailFirst: Match.Optional(String),
};

INFO_PAT = {
  emailSent: Match.Optional(String),
  emailVerified: Match.Optional(String),
  pwdChanged: Match.Optional(String),
  pwdReset: Match.Optional(String),
  pwdSet: Match.Optional(String),
  signUpVerifyEmail: Match.Optional(String),
  verificationEmailSent: Match.Optional(String),
};

INPUT_ICONS_PAT = {
  hasError: Match.Optional(String),
  hasSuccess: Match.Optional(String),
  isValidating: Match.Optional(String),
};

ObjWithStringValues = Match.Where(function (x) {
  check(x, Object);
  _.each(_.values(x), function(value) {
      check(value, String);
  });
  return true;
});

TEXTS_PAT = {
  button: Match.Optional(STATE_PAT),
  errors: Match.Optional(ERRORS_PAT),
  info: Match.Optional(INFO_PAT),
  inputIcons: Match.Optional(INPUT_ICONS_PAT),
  maxAllowedLength: Match.Optional(String),
  minRequiredLength: Match.Optional(String),
  navSignIn: Match.Optional(String),
  navSignOut: Match.Optional(String),
  optionalField: Match.Optional(String),
  pwdLink_link: Match.Optional(String),
  pwdLink_pre: Match.Optional(String),
  pwdLink_suff: Match.Optional(String),
  requiredField: Match.Optional(String),
  resendVerificationEmailLink_pre: Match.Optional(String),
  resendVerificationEmailLink_link: Match.Optional(String),
  resendVerificationEmailLink_suff: Match.Optional(String),
  sep: Match.Optional(String),
  signInLink_link: Match.Optional(String),
  signInLink_pre: Match.Optional(String),
  signInLink_suff: Match.Optional(String),
  signUpLink_link: Match.Optional(String),
  signUpLink_pre: Match.Optional(String),
  signUpLink_suff: Match.Optional(String),
  socialAdd: Match.Optional(String),
  socialConfigure: Match.Optional(String),
  socialIcons: Match.Optional(ObjWithStringValues),
  socialRemove: Match.Optional(String),
  socialSignIn: Match.Optional(String),
  socialSignUp: Match.Optional(String),
  socialWith: Match.Optional(String),
  termsAnd: Match.Optional(String),
  termsPreamble: Match.Optional(String),
  termsPrivacy: Match.Optional(String),
  termsTerms: Match.Optional(String),
  title: Match.Optional(STATE_PAT),
};

// Configuration pattern to be checked with check
CONFIG_PAT = {
  // Behaviour
  confirmPassword: Match.Optional(Boolean),
  defaultState: Match.Optional(String),
  enablePasswordChange: Match.Optional(Boolean),
  enforceEmailVerification: Match.Optional(Boolean),
  focusFirstInput: Match.Optional(Boolean),
  forbidClientAccountCreation: Match.Optional(Boolean),
  lowercaseUsername: Match.Optional(Boolean),
  overrideLoginErrors: Match.Optional(Boolean),
  sendVerificationEmail: Match.Optional(Boolean),
  socialLoginStyle: Match.Optional(Match.OneOf("popup", "redirect")),

  // Appearance
  defaultLayout: Match.Optional(String),
  hideSignInLink: Match.Optional(Boolean),
  hideSignUpLink: Match.Optional(Boolean),
  showAddRemoveServices: Match.Optional(Boolean),
  showForgotPasswordLink: Match.Optional(Boolean),
  showResendVerificationEmailLink: Match.Optional(Boolean),
  showLabels: Match.Optional(Boolean),
  showPlaceholders: Match.Optional(Boolean),

  // Client-side Validation
  continuousValidation: Match.Optional(Boolean),
  negativeFeedback: Match.Optional(Boolean),
  negativeValidation: Match.Optional(Boolean),
  positiveFeedback: Match.Optional(Boolean),
  positiveValidation: Match.Optional(Boolean),
  showValidating: Match.Optional(Boolean),

  // Privacy Policy and Terms of Use
  privacyUrl: Match.Optional(String),
  termsUrl: Match.Optional(String),

  // Redirects
  homeRoutePath: Match.Optional(String),
  redirectTimeout: Match.Optional(Number),

  // Hooks
  onLogoutHook: Match.Optional(Function),
  onSubmitHook: Match.Optional(Function),
  preSignUpHook: Match.Optional(Function),
  postSignUpHook: Match.Optional(Function),

  texts: Match.Optional(TEXTS_PAT),

  //reCaptcha config
  reCaptcha: Match.Optional({
    data_type: Match.Optional(Match.OneOf("audio", "image")),
    secretKey: Match.Optional(String),
    siteKey: Match.Optional(String),
    theme: Match.Optional(Match.OneOf("dark", "light")),
  }),

  showReCaptcha: Match.Optional(Boolean),
};


FIELD_SUB_PAT = {
  "default": Match.Optional(String),
  changePwd: Match.Optional(String),
  enrollAccount: Match.Optional(String),
  forgotPwd: Match.Optional(String),
  resetPwd: Match.Optional(String),
  signIn: Match.Optional(String),
  signUp: Match.Optional(String),
};


// Field pattern
FIELD_PAT = {
  _id: String,
  type: String,
  required: Match.Optional(Boolean),
  displayName: Match.Optional(Match.OneOf(String, Match.Where(_.isFunction), FIELD_SUB_PAT)),
  placeholder: Match.Optional(Match.OneOf(String, FIELD_SUB_PAT)),
  select: Match.Optional([{text: String, value: Match.Any}]),
  minLength: Match.Optional(Match.Integer),
  maxLength: Match.Optional(Match.Integer),
  re: Match.Optional(RegExp),
  func: Match.Optional(Match.Where(_.isFunction)),
  errStr: Match.Optional(String),

  // Client-side Validation
  continuousValidation: Match.Optional(Boolean),
  negativeFeedback: Match.Optional(Boolean),
  negativeValidation: Match.Optional(Boolean),
  positiveValidation: Match.Optional(Boolean),
  positiveFeedback: Match.Optional(Boolean),

  // Transforms
  trim: Match.Optional(Boolean),
  lowercase: Match.Optional(Boolean),
  uppercase: Match.Optional(Boolean),
  transform: Match.Optional(Match.Where(_.isFunction)),

  // Custom options
  options: Match.Optional(Object),
  template: Match.Optional(String),
};

// -----------------------------------------------------------------------------
// AccountsTemplates object
// -----------------------------------------------------------------------------

// -------------------
// Client/Server stuff
// -------------------

// Constructor
AT = function() {

};

AT.prototype.CONFIG_PAT = CONFIG_PAT;

/*
  Each field object is represented by the following properties:
    _id:         String   (required)  // A unique field"s id / name
    type:        String   (required)  // Displayed input type
    required:    Boolean  (optional)  // Specifies Whether to fail or not when field is left empty
    displayName: String   (optional)  // The field"s name to be displayed as a label above the input element
    placeholder: String   (optional)  // The placeholder text to be displayed inside the input element
    minLength:   Integer  (optional)  // Possibly specifies the minimum allowed length
    maxLength:   Integer  (optional)  // Possibly specifies the maximum allowed length
    re:          RegExp   (optional)  // Regular expression for validation
    func:        Function (optional)  // Custom function for validation
    errStr:      String   (optional)  // Error message to be displayed in case re validation fails
*/


// Allowed input types
AT.prototype.INPUT_TYPES = [
  "checkbox",
  "email",
  "hidden",
  "password",
  "radio",
  "select",
  "tel",
  "text",
  "url",
];

// Current configuration values
AT.prototype.options = {
  // Appearance
  //defaultLayout: undefined,
  showAddRemoveServices: false,
  showForgotPasswordLink: false,
  showResendVerificationEmailLink: false,
  showLabels: true,
  showPlaceholders: true,

  // Behaviour
  confirmPassword: true,
  defaultState: "signIn",
  enablePasswordChange: false,
  focusFirstInput: !Meteor.isCordova,
  forbidClientAccountCreation: false,
  lowercaseUsername: false,
  overrideLoginErrors: true,
  sendVerificationEmail: false,
  socialLoginStyle: "popup",

  // Client-side Validation
  //continuousValidation: false,
  //negativeFeedback: false,
  //negativeValidation: false,
  //positiveValidation: false,
  //positiveFeedback: false,
  //showValidating: false,

  // Privacy Policy and Terms of Use
  privacyUrl: undefined,
  termsUrl: undefined,

  // Hooks
  onSubmitHook: undefined,
};

AT.prototype.texts = {
  button: {
    changePwd: "updateYourPassword",
    //enrollAccount: "createAccount",
    enrollAccount: "signUp",
    forgotPwd: "emailResetLink",
    resetPwd: "setPassword",
    signIn: "signIn",
    signUp: "signUp",
    resendVerificationEmail: "Send email again",
  },
  errors: {
    accountsCreationDisabled: "Client side accounts creation is disabled!!!",
    cannotRemoveService: "Cannot remove the only active service!",
    captchaVerification: "Captcha verification failed!",
    loginForbidden: "error.accounts.Login forbidden",
    mustBeLoggedIn: "error.accounts.Must be logged in",
    pwdMismatch: "error.pwdsDontMatch",
    validationErrors: "Validation Errors",
    verifyEmailFirst: "Please verify your email first. Check the email and follow the link!",
  },
  navSignIn: 'signIn',
  navSignOut: 'signOut',
  info: {
    emailSent: "info.emailSent",
    emailVerified: "info.emailVerified",
    pwdChanged: "info.passwordChanged",
    pwdReset: "info.passwordReset",
    pwdSet: "Password Set",
    signUpVerifyEmail: "Successful Registration! Please check your email and follow the instructions.",
    verificationEmailSent: "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.",
  },
  inputIcons: {
    isValidating: "fa fa-spinner fa-spin",
    hasSuccess: "fa fa-check",
    hasError: "fa fa-times",
  },
  maxAllowedLength: "Maximum allowed length",
  minRequiredLength: "Minimum required length",
  optionalField: "optional",
  pwdLink_pre: "",
  pwdLink_link: "forgotPassword",
  pwdLink_suff: "",
  requiredField: "Required Field",
  resendVerificationEmailLink_pre: "Verification email lost?",
  resendVerificationEmailLink_link: "Send again",
  resendVerificationEmailLink_suff: "",
  sep: "OR",
  signInLink_pre: "ifYouAlreadyHaveAnAccount",
  signInLink_link: "signin",
  signInLink_suff: "",
  signUpLink_pre: "dontHaveAnAccount",
  signUpLink_link: "signUp",
  signUpLink_suff: "",
  socialAdd: "add",
  socialConfigure: "configure",
  socialIcons: {
      "meteor-developer": "fa fa-rocket"
  },
  socialRemove: "remove",
  socialSignIn: "signIn",
  socialSignUp: "signUp",
  socialWith: "with",
  termsPreamble: "clickAgree",
  termsPrivacy: "privacyPolicy",
  termsAnd: "and",
  termsTerms: "terms",
  title: {
    changePwd: "changePassword",
    enrollAccount: "createAccount",
    forgotPwd: "resetYourPassword",
    resetPwd: "resetYourPassword",
    signIn: "signIn",
    signUp: "createAccount",
    verifyEmail: "",
    resendVerificationEmail: "Send the verification email again",
  },
};

AT.prototype.SPECIAL_FIELDS = [
  "password_again",
  "username_and_email",
];

// SignIn / SignUp fields
AT.prototype._fields = [
  new Field({
    _id: "email",
    type: "email",
    required: true,
    lowercase: true,
    trim: true,
    func: function(email) {
        return !_.contains(email, '@');
    },
    errStr: 'Invalid email',
  }),
  new Field({
    _id: "password",
    type: "password",
    required: true,
    minLength: 6,
    displayName: {
        "default": "password",
        changePwd: "newPassword",
        resetPwd: "newPassword",
    },
    placeholder: {
        "default": "password",
        changePwd: "newPassword",
        resetPwd: "newPassword",
    },
  }),
];


AT.prototype._initialized = false;

// Input type validation
AT.prototype._isValidInputType = function(value) {
    return _.indexOf(this.INPUT_TYPES, value) !== -1;
};

AT.prototype.addField = function(field) {
    // Fields can be added only before initialization
    if (this._initialized) {
      throw new Error("AccountsTemplates.addField should strictly be called before AccountsTemplates.init!");
    }

    field = _.pick(field, _.keys(FIELD_PAT));
    check(field, FIELD_PAT);
    // Checks there"s currently no field called field._id
    if (_.indexOf(_.pluck(this._fields, "_id"), field._id) !== -1) {
      throw new Error("A field called " + field._id + " already exists!");
    }
    // Validates field.type
    if (!this._isValidInputType(field.type)) {
      throw new Error("field.type is not valid!");
    }
    // Checks field.minLength is strictly positive
    if (typeof field.minLength !== "undefined" && field.minLength <= 0) {
      throw new Error("field.minLength should be greater than zero!");
    }
    // Checks field.maxLength is strictly positive
    if (typeof field.maxLength !== "undefined" && field.maxLength <= 0) {
      throw new Error("field.maxLength should be greater than zero!");
    }
    // Checks field.maxLength is greater than field.minLength
    if (typeof field.minLength !== "undefined" && typeof field.minLength !== "undefined" && field.maxLength < field.minLength) {
      throw new Error("field.maxLength should be greater than field.maxLength!");
    }

    if (!(Meteor.isServer && _.contains(this.SPECIAL_FIELDS, field._id))) {
      this._fields.push(new Field(field));
    }

    return this._fields;
};

AT.prototype.addFields = function(fields) {
  var ok;

  try { // don"t bother with `typeof` - just access `length` and `catch`
    ok = fields.length > 0 && "0" in Object(fields);
  } catch (e) {
    throw new Error("field argument should be an array of valid field objects!");
  }
  if (ok) {
    _.map(fields, function(field) {
      this.addField(field);
    }, this);
  } else {
    throw new Error("field argument should be an array of valid field objects!");
  }

  return this._fields;
};

AT.prototype.configure = function(config) {
  // Configuration options can be set only before initialization
  if (this._initialized) {
    throw new Error("Configuration options must be set before AccountsTemplates.init!");
  }

  // Updates the current configuration
  check(config, CONFIG_PAT);
  var options = _.omit(config, "texts", "reCaptcha");
  this.options = _.defaults(options, this.options);

  // Possibly sets up reCaptcha options
  var reCaptcha = config.reCaptcha;
  if (reCaptcha) {
    // Updates the current button object
    this.options.reCaptcha = _.defaults(reCaptcha, this.options.reCaptcha || {});
  }

  // Possibly sets up texts...
  if (config.texts) {
    var texts = config.texts;
    var simpleTexts = _.omit(texts, "button", "errors", "info", "inputIcons", "socialIcons", "title");

    this.texts = _.defaults(simpleTexts, this.texts);

    if (texts.button) {
      // Updates the current button object
      this.texts.button = _.defaults(texts.button, this.texts.button);
    }

    if (texts.errors) {
      // Updates the current errors object
      this.texts.errors = _.defaults(texts.errors, this.texts.errors);
    }

    if (texts.info) {
      // Updates the current info object
      this.texts.info = _.defaults(texts.info, this.texts.info);
    }

    if (texts.inputIcons) {
      // Updates the current inputIcons object
      this.texts.inputIcons = _.defaults(texts.inputIcons, this.texts.inputIcons);
    }

    if (texts.socialIcons) {
      // Updates the current socialIcons object
      this.texts.socialIcons = _.defaults(texts.socialIcons, this.texts.socialIcons);
    }

    if (texts.title) {
      // Updates the current title object
      this.texts.title = _.defaults(texts.title, this.texts.title);
    }
  }
};


AT.prototype.configureRoute = function(route, options) {
  console.warn('You now need a routing package like useraccounts:iron-routing or useraccounts:flow-routing to be able to configure routes!');
};


AT.prototype.hasField = function(fieldId) {
  return !!this.getField(fieldId);
};

AT.prototype.getField = function(fieldId) {
  var field = _.filter(this._fields, function(field) {
    return field._id === fieldId;
  });

  return (field.length === 1) ? field[0] : undefined;
};

AT.prototype.getFields = function() {
    return this._fields;
};

AT.prototype.getFieldIds = function() {
    return _.pluck(this._fields, "_id");
};

AT.prototype.getRoutePath = function(route) {
    return "#";
};

AT.prototype.oauthServices = function() {
  // Extracts names of available services
  var names;

  if (Meteor.isServer) {
    names = (Accounts.oauth && Accounts.oauth.serviceNames()) || [];
  } else {
    names = (Accounts.oauth && Accounts.loginServicesConfigured() && Accounts.oauth.serviceNames()) || [];
  }
  // Extracts names of configured services
  var configuredServices = [];

  if (Accounts.loginServiceConfiguration) {
    configuredServices = _.pluck(Accounts.loginServiceConfiguration.find().fetch(), "service");
  }

  // Builds a list of objects containing service name as _id and its configuration status
  var services = _.map(names, function(name) {
    return {
      _id : name,
      configured: _.contains(configuredServices, name),
    };
  });

  // Checks whether there is a UI to configure services...
  // XXX: this only works with the accounts-ui package
  var showUnconfigured = typeof Accounts._loginButtonsSession !== "undefined";

  // Filters out unconfigured services in case they"re not to be displayed
  if (!showUnconfigured) {
    services = _.filter(services, function(service) {
      return service.configured;
    });
  }

  // Sorts services by name
  services = _.sortBy(services, function(service) {
    return service._id;
  });

  return services;
};

AT.prototype.removeField = function(fieldId) {
  // Fields can be removed only before initialization
  if (this._initialized) {
    throw new Error("AccountsTemplates.removeField should strictly be called before AccountsTemplates.init!");
  }
  // Tries to look up the field with given _id
  var index = _.indexOf(_.pluck(this._fields, "_id"), fieldId);

  if (index !== -1) {
    return this._fields.splice(index, 1)[0];
  } else if (!(Meteor.isServer && _.contains(this.SPECIAL_FIELDS, fieldId))) {
    throw new Error("A field called " + fieldId + " does not exist!");
  }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/client.js                                                                         //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
/* global
  AT: false
*/
"use strict";

// Allowed Internal (client-side) States
AT.prototype.STATES = [
  "changePwd", // Change Password
  "enrollAccount", // Account Enrollment
  "forgotPwd", // Forgot Password
  "hide", // Nothing displayed
  "resetPwd", // Reset Password
  "signIn", // Sign In
  "signUp", // Sign Up
  "verifyEmail", // Email verification
  "resendVerificationEmail", // Resend verification email
];

AT.prototype._loginType = "";

// Flag telling whether the whole form should appear disabled
AT.prototype._disabled = false;

// State validation
AT.prototype._isValidState = function(value) {
  return _.contains(this.STATES, value);
};

// Flags used to avoid clearing errors and redirecting to previous route when
// signing in/up as a results of a call to ensureSignedIn
AT.prototype.avoidRedirect = false;
AT.prototype.avoidClearError = false;

// Token to be provided for routes like reset-password and enroll-account
AT.prototype.paramToken = null;

AT.prototype.loginType = function () {
  return this._loginType;
};

AT.prototype.getparamToken = function() {
  return this.paramToken;
};

// Getter for current state
AT.prototype.getState = function() {
  return this.state.form.get("state");
};

// Getter for disabled state
AT.prototype.disabled = function() {
  return this.state.form.equals("disabled", true) ? "disabled" : undefined;
};

// Setter for disabled state
AT.prototype.setDisabled = function(value) {
  check(value, Boolean);
  return this.state.form.set("disabled", value);
};

// Setter for current state
AT.prototype.setState = function(state, callback) {
  check(state, String);

  if (!this._isValidState(state) || (this.options.forbidClientAccountCreation && state === 'signUp')) {
    throw new Meteor.Error(500, "Internal server error", "accounts-templates-core package got an invalid state value!");
  }

  this.state.form.set("state", state);
  if (!this.avoidClearError) {
    this.clearState();
  }
  this.avoidClearError = false;

  if (_.isFunction(callback)) {
    callback();
  }
};

AT.prototype.clearState = function() {
  _.each(this._fields, function(field) {
    field.clearStatus();
  });

  var form = this.state.form;

  form.set("error", null);
  form.set("result", null);
  form.set("message", null);

  AccountsTemplates.setDisabled(false);
};

AT.prototype.clearError = function() {
  this.state.form.set("error", null);
};

AT.prototype.clearResult = function() {
  this.state.form.set("result", null);
};

AT.prototype.clearMessage = function() {
  this.state.form.set("message", null);
};

// Initialization
AT.prototype.init = function() {
  console.warn("[AccountsTemplates] There is no more need to call AccountsTemplates.init()! Simply remove the call ;-)");
};

AT.prototype._init = function() {
  if (this._initialized) {
    return;
  }

  var usernamePresent = this.hasField("username");
  var emailPresent = this.hasField("email");

  if (usernamePresent && emailPresent) {
    this._loginType = "username_and_email";
  } else {
    this._loginType = usernamePresent ? "username" : "email";
  }

  if (this._loginType === "username_and_email") {
    // Possibly adds the field username_and_email in case
    // it was not configured
    if (!this.hasField("username_and_email")) {
      this.addField({
        _id: "username_and_email",
        type: "text",
        displayName: "usernameOrEmail",
        placeholder: "usernameOrEmail",
        required: true,
      });
    }
  }

  // Only in case password confirmation is required
  if (this.options.confirmPassword) {
    // Possibly adds the field password_again in case
    // it was not configured
    if (!this.hasField("password_again")) {
      var pwdAgain = _.clone(this.getField("password"));

      pwdAgain._id = "password_again";
      pwdAgain.displayName = {
        "default": "passwordAgain",
        changePwd: "newPasswordAgain",
        resetPwd: "newPasswordAgain",
      };
      pwdAgain.placeholder = {
        "default": "passwordAgain",
        changePwd: "newPasswordAgain",
        resetPwd: "newPasswordAgain",
      };
      this.addField(pwdAgain);
    }
  } else {
    if (this.hasField("password_again")) {
      throw new Error("AccountsTemplates: a field password_again was added but confirmPassword is set to false!");
    }
  }

  // Possibly adds the field current_password in case
  // it was not configured
  if (this.options.enablePasswordChange) {
    if (!this.hasField("current_password")) {
      this.addField({
        _id: "current_password",
        type: "password",
        displayName: "currentPassword",
        placeholder: "currentPassword",
        required: true,
      });
    }
  }

  // Ensuser the right order of special fields
  var moveFieldAfter = function(fieldName, referenceFieldName) {
    var fieldIds = AccountsTemplates.getFieldIds();
    var refFieldId = _.indexOf(fieldIds, referenceFieldName);
    // In case the reference field is not present, just return...
    if (refFieldId === -1) {
      return;
    }

    var fieldId = _.indexOf(fieldIds, fieldName);
    // In case the sought field is not present, just return...
    if (fieldId === -1) {
      return;
    }

    if (fieldId !== -1 && fieldId !== (refFieldId + 1)) {
      // removes the field
      var field = AccountsTemplates._fields.splice(fieldId, 1)[0];
      // push the field right after the reference field position
      var newFieldIds = AccountsTemplates.getFieldIds();
      var newReferenceFieldId = _.indexOf(newFieldIds, referenceFieldName);
      AccountsTemplates._fields.splice(newReferenceFieldId + 1, 0, field);
    }
  };

  // Ensuser the right order of special fields
  var moveFieldBefore = function(fieldName, referenceFieldName) {
    var fieldIds = AccountsTemplates.getFieldIds();
    var refFieldId = _.indexOf(fieldIds, referenceFieldName);
    // In case the reference field is not present, just return...
    if (refFieldId === -1) {
      return;
    }

    var fieldId = _.indexOf(fieldIds, fieldName);
    // In case the sought field is not present, just return...
    if (fieldId === -1) {
      return;
    }

    if (fieldId !== -1 && fieldId !== (refFieldId - 1)) {
      // removes the field
      var field = AccountsTemplates._fields.splice(fieldId, 1)[0];
      // push the field right after the reference field position
      var newFieldIds = AccountsTemplates.getFieldIds();
      var newReferenceFieldId = _.indexOf(newFieldIds, referenceFieldName);
      AccountsTemplates._fields.splice(newReferenceFieldId, 0, field);
    }
  };

  // The final order should be something like:
  // - username
  // - email
  // - username_and_email
  // - password
  // - password_again
  //
  // ...so lets do it in reverse order...
  moveFieldAfter("username_and_email", "username");
  moveFieldAfter("username_and_email", "email");
  moveFieldBefore("current_password", "password");
  moveFieldAfter("password", "current_password");
  moveFieldAfter("password_again", "password");


  // Sets visibility condition and validation flags for each field
  var gPositiveValidation = !!AccountsTemplates.options.positiveValidation;
  var gNegativeValidation = !!AccountsTemplates.options.negativeValidation;
  var gShowValidating = !!AccountsTemplates.options.showValidating;
  var gContinuousValidation = !!AccountsTemplates.options.continuousValidation;
  var gNegativeFeedback = !!AccountsTemplates.options.negativeFeedback;
  var gPositiveFeedback = !!AccountsTemplates.options.positiveFeedback;

  _.each(this._fields, function(field) {
    // Visibility
    switch(field._id) {
      case "current_password":
        field.visible = ["changePwd"];
        break;
      case "email":
        field.visible = ["forgotPwd", "signUp", "resendVerificationEmail"];
        if (AccountsTemplates.loginType() === "email") {
          field.visible.push("signIn");
        }
        break;
      case "password":
        field.visible = ["changePwd", "enrollAccount", "resetPwd", "signIn", "signUp"];
        break;
      case "password_again":
        field.visible = ["changePwd", "enrollAccount", "resetPwd", "signUp"];
        break;
      case "username":
        field.visible = ["signUp"];
        if (AccountsTemplates.loginType() === "username") {
          field.visible.push("signIn");
        }
        break;
      case "username_and_email":
        field.visible = [];
        if (AccountsTemplates.loginType() === "username_and_email") {
          field.visible.push("signIn");
        }
        break;
      default:
        field.visible = ["signUp"];
    }

      // Validation
      var positiveValidation = field.positiveValidation;
      if (_.isUndefined(positiveValidation)) {
        field.positiveValidation = gPositiveValidation;
      }

      var negativeValidation = field.negativeValidation;
      if (_.isUndefined(negativeValidation)) {
        field.negativeValidation = gNegativeValidation;
      }

      field.validation = field.positiveValidation || field.negativeValidation;
      if (_.isUndefined(field.continuousValidation)) {
        field.continuousValidation = gContinuousValidation;
      }

      field.continuousValidation = field.validation && field.continuousValidation;
      if (_.isUndefined(field.negativeFeedback)) {
        field.negativeFeedback = gNegativeFeedback;
      }

      if (_.isUndefined(field.positiveFeedback)) {
        field.positiveFeedback = gPositiveFeedback;
      }

      field.feedback = field.negativeFeedback || field.positiveFeedback;
      // Validating icon
      var showValidating = field.showValidating;
      if (_.isUndefined(showValidating)) {
        field.showValidating = gShowValidating;
      }

      // Custom Template
      if (field.template) {
        if (field.template in Template) {
          Template[field.template].helpers(AccountsTemplates.atInputHelpers);
        } else {
          console.warn(
            "[UserAccounts] Warning no template " + field.template + " found!"
          );
        }
      }
  });

  // Initializes reactive states
  var form = new ReactiveDict();

  form.set("disabled", false);
  form.set("state", "signIn");
  form.set("result", null);
  form.set("error", null);
  form.set("message", null);
  this.state = {
    form: form,
  };

  // Possibly subscribes to extended user data (to get the list of registered services...)
  if (this.options.showAddRemoveServices) {
      Meteor.subscribe("userRegisteredServices");
  }

  //Check that reCaptcha site keys are available and no secret keys visible
  if (this.options.showReCaptcha) {
    var atSiteKey = null;
    var atSecretKey = null;
    var settingsSiteKey = null;
    var settingsSecretKey = null;

    if (AccountsTemplates.options.reCaptcha) {
      atSiteKey = AccountsTemplates.options.reCaptcha.siteKey;
      atSecretKey = AccountsTemplates.options.reCaptcha.secretKey;
    }

    if (Meteor.settings && Meteor.settings.public && Meteor.settings.public.reCaptcha) {
      settingsSiteKey = Meteor.settings.public.reCaptcha.siteKey;
      settingsSecretKey = Meteor.settings.public.reCaptcha.secretKey;
    }

    if (atSecretKey || settingsSecretKey) {
      //erase the secret key
      if (atSecretKey) {
          AccountsTemplates.options.reCaptcha.secretKey = null;
      }

      if (settingsSecretKey) {
          Meteor.settings.public.reCaptcha.secretKey = null;
      }

      var loc = atSecretKey ? "User Accounts configuration!" : "Meteor settings!";
      throw new Meteor.Error(401, "User Accounts: DANGER - reCaptcha private key leaked to client from " + loc
      + " Provide the key in server settings ONLY.");
    }

    if (!atSiteKey && !settingsSiteKey) {
      throw new Meteor.Error(401, "User Accounts: reCaptcha site key not found! Please provide it or set showReCaptcha to false.");
    }
  }

  // Marks AccountsTemplates as initialized
  this._initialized = true;
};

AT.prototype.linkClick = function(route) {
  if (AccountsTemplates.disabled()) {
    return;
  }

  AccountsTemplates.setState(route);

  if (AccountsTemplates.options.focusFirstInput) {
    var firstVisibleInput = _.find(this.getFields(), function(f) {
      return _.contains(f.visible, route);
    });

    if (firstVisibleInput) {
      $("input#at-field-" + firstVisibleInput._id).focus();
    }
  }
};

AT.prototype.logout = function() {
  var onLogoutHook = AccountsTemplates.options.onLogoutHook;

  Meteor.logout(function() {
    if (onLogoutHook) {
      onLogoutHook();
    }
  });
};

AT.prototype.submitCallback = function(error, state, onSuccess) {
  var onSubmitHook = AccountsTemplates.options.onSubmitHook;

  if (onSubmitHook) {
    onSubmitHook(error, state);
  }

  if (error) {
    if (_.isObject(error.details)) {
      // If error.details is an object, we may try to set fields errors from it
      _.each(error.details, function(error, fieldId) {
          AccountsTemplates.getField(fieldId).setError(error);
      });
    } else {
      var err = "error.accounts.Unknown error";

      if (error.reason) {
        err = error.reason;
      }

      if (err.substring(0, 15) !== "error.accounts.") {
        err = "error.accounts." + err;
      }

      AccountsTemplates.state.form.set("error", [err]);
    }

    AccountsTemplates.setDisabled(false);
    // Possibly resets reCaptcha form
    if (state === "signUp" && AccountsTemplates.options.showReCaptcha) {
      grecaptcha.reset();
    }
  } else {
    if (onSuccess) {
      onSuccess();
    }

    if (state) {
      AccountsTemplates.setDisabled(false);
    }
  }
};

AccountsTemplates = new AT();

// Initialization
Meteor.startup(function() {
  AccountsTemplates._init();
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/templates_helpers/at_error.js                                                     //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
AT.prototype.atErrorHelpers = {
    singleError: function() {
        var errors = AccountsTemplates.state.form.get("error");
        return errors && errors.length === 1;
    },
    error: function() {
        return AccountsTemplates.state.form.get("error");
    },
    errorText: function(){
        var field, err;
        if (this.field){
            field = T9n.get(this.field, markIfMissing=false);
            err = T9n.get(this.err, markIfMissing=false);
        }
        else
            err = T9n.get(this.valueOf(), markIfMissing=false);

        // Possibly removes initial prefix in case the key in not found inside t9n
        if (err.substring(0, 15) === "error.accounts.")
            err = err.substring(15);

        if (field)
            return field + ": " + err;
        return err;
    },
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/templates_helpers/at_form.js                                                      //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
AT.prototype.atFormHelpers = {
    hide: function(){
        var state = this.state || AccountsTemplates.getState();
        return state === "hide";
    },
    showTitle: function(next_state){
        var state = next_state || this.state || AccountsTemplates.getState();
        if (Meteor.userId() && state === "signIn")
          return false;
        return !!AccountsTemplates.texts.title[state];
    },
    showOauthServices: function(next_state){
        var state = next_state || this.state || AccountsTemplates.getState();
        if (!(state === "signIn" || state === "signUp"))
            return false;
        var services = AccountsTemplates.oauthServices();
        if (!services.length)
            return false;
        if (Meteor.userId())
            return AccountsTemplates.options.showAddRemoveServices;
        return true;
    },
    showServicesSeparator: function(next_state){
        var pwdService = Package["accounts-password"] !== undefined;
        var state = next_state || this.state || AccountsTemplates.getState();
        var rightState = (state === "signIn" || state === "signUp");
        return rightState && !Meteor.userId() && pwdService && AccountsTemplates.oauthServices().length;
    },
    showError: function(next_state) {
        return !!AccountsTemplates.state.form.get("error");
    },
    showResult: function(next_state) {
        return !!AccountsTemplates.state.form.get("result");
    },
    showMessage: function(next_state) {
        return !!AccountsTemplates.state.form.get("message");
    },
    showPwdForm: function(next_state) {
        if (Package["accounts-password"] === undefined)
            return false;
        var state = next_state || this.state || AccountsTemplates.getState();
        if ((state === "verifyEmail") || (state === "signIn" && Meteor.userId()))
            return false;
        return true;
    },
    showSignInLink: function(next_state){
        if (AccountsTemplates.options.hideSignInLink)
            return false;
        var state = next_state || this.state || AccountsTemplates.getState();
        if (AccountsTemplates.options.forbidClientAccountCreation && state === "forgotPwd")
            return true;
        return state === "signUp";
    },
    showSignUpLink: function(next_state){
        if  (AccountsTemplates.options.hideSignUpLink)
            return false;
        var state = next_state || this.state || AccountsTemplates.getState();
        return ((state === "signIn" && !Meteor.userId()) || state === "forgotPwd") && !AccountsTemplates.options.forbidClientAccountCreation;
    },
    showTermsLink: function(next_state){
        //TODO: Add privacyRoute and termsRoute as alternatives (the point of named routes is
        // being able to change the url in one place only)
        if (!!AccountsTemplates.options.privacyUrl || !!AccountsTemplates.options.termsUrl) {
            var state = next_state || this.state || AccountsTemplates.getState();
            if (state === "signUp" || state === "enrollAccount" ) {
              return true;
            }
        }
        /*
        if (state === "signIn"){
            var pwdService = Package["accounts-password"] !== undefined;
            if (!pwdService)
                return true;
        }
        */
        return false;
    },
    showResendVerificationEmailLink: function(){
        var parentData = Template.currentData();
        var state = (parentData && parentData.state) || AccountsTemplates.getState();
        return (state === "signIn" || state === "forgotPwd") && AccountsTemplates.options.showResendVerificationEmailLink;
    },
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/templates_helpers/at_input.js                                                     //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
AT.prototype.atInputRendered = [function(){
    var fieldId = this.data._id;

    var parentData = Template.currentData();
    var state = (parentData && parentData.state) || AccountsTemplates.getState();

    if (AccountsTemplates.options.focusFirstInput) {
      var firstVisibleInput = _.find(AccountsTemplates.getFields(), function(f){
        return _.contains(f.visible, state);
      });

      if (firstVisibleInput && firstVisibleInput._id === fieldId) {
        this.$("input#at-field-" + fieldId).focus();
      }
  }
}];

AT.prototype.atInputHelpers = {
    disabled: function() {
        return AccountsTemplates.disabled();
    },
    showLabels: function() {
        return AccountsTemplates.options.showLabels;
    },
    displayName: function() {
        var parentData = Template.parentData();
        var state = (parentData && parentData.state) || AccountsTemplates.getState();
        var displayName = this.getDisplayName(state);
        return T9n.get(displayName, markIfMissing=false);
    },
    optionalText: function(){
        return "(" + T9n.get(AccountsTemplates.texts.optionalField, markIfMissing=false) + ")";
    },
    templateName: function() {
        if (this.template)
            return this.template;
        if (this.type === "checkbox")
            return "atCheckboxInput";
        if (this.type === "select")
            return "atSelectInput";
        if (this.type === "radio")
            return "atRadioInput";
        if (this.type === "hidden")
            return "atHiddenInput";
        return "atTextInput";
    },
    values: function(){
        var id = this._id;
        return _.map(this.select, function(select){
            var s = _.clone(select);
            s._id = id + "-" + select.value;
            s.id = id;
            return s;
        });
    },
    errorText: function() {
        var err = this.getStatus();
        return T9n.get(err, markIfMissing=false);
    },
    placeholder: function() {
        if (AccountsTemplates.options.showPlaceholders) {
            var parentData = Template.parentData();
            var state = (parentData && parentData.state) || AccountsTemplates.getState();
            var placeholder = this.getPlaceholder(state);
            return T9n.get(placeholder, markIfMissing=false);
        }
    },
};

AT.prototype.atInputEvents = {
    "focusin input": function(event, t){
        this.clearStatus();
    },
    "focusout input, change select": function(event, t){
        var fieldId = this._id;
        var rawValue = this.getValue(t);
        var value = this.fixValue(rawValue);
        // Possibly updates the input value
        if (value !== rawValue) {
            this.setValue(t, value);
        }

        // Client-side only validation
        if (!this.validation)
            return;
        var parentData = Template.parentData();
        var state = (parentData && parentData.state) || AccountsTemplates.getState();
        // No validation during signIn
        if (state === "signIn")
            return;
        // Special case for password confirmation
        if (value && fieldId === "password_again"){
            if (value !== $("#at-field-password").val())
                return this.setError(AccountsTemplates.texts.errors.pwdMismatch);
        }
        this.validate(value);
    },
    "keyup input": function(event, t){
        // Client-side only continuous validation
        if (!this.continuousValidation)
            return;
        var parentData = Template.parentData();
        var state = (parentData && parentData.state) || AccountsTemplates.getState();
        // No validation during signIn
        if (state === "signIn")
            return;
        var fieldId = this._id;
        var rawValue = this.getValue(t);
        var value = this.fixValue(rawValue);
        // Possibly updates the input value
        if (value !== rawValue) {
            this.setValue(t, value);
        }
        // Special case for password confirmation
        if (value && fieldId === "password_again"){
            if (value !== $("#at-field-password").val())
                return this.setError(AccountsTemplates.texts.errors.pwdMismatch);
        }
        this.validate(value);
    },
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/templates_helpers/at_nav_button.js                                                //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
AT.prototype.atNavButtonHelpers = {
    text: function(){
        var key = Meteor.userId() ? AccountsTemplates.texts.navSignOut : AccountsTemplates.texts.navSignIn;
        return T9n.get(key, markIfMissing=false);
    }
};

AT.prototype.atNavButtonEvents = {
    'click #at-nav-button': function(event){
        event.preventDefault();
        if (Meteor.userId())
            AccountsTemplates.logout();
        else
            AccountsTemplates.linkClick("signIn");
    },
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/templates_helpers/at_oauth.js                                                     //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
AT.prototype.atOauthHelpers = {
    oauthService: function() {
        return AccountsTemplates.oauthServices();
    },
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/templates_helpers/at_pwd_form.js                                                  //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
AT.prototype.atPwdFormHelpers = {
    disabled: function() {
        return AccountsTemplates.disabled();
    },
    fields: function() {
        var parentData = Template.currentData();
        var state = (parentData && parentData.state) || AccountsTemplates.getState();
        return _.filter(AccountsTemplates.getFields(), function(s) {
            return _.contains(s.visible, state);
        });
    },
    showForgotPasswordLink: function() {
        var parentData = Template.currentData();
        var state = (parentData && parentData.state) || AccountsTemplates.getState();
        return state === "signIn" && AccountsTemplates.options.showForgotPasswordLink;
    },
    showReCaptcha: function() {
      var parentData = Template.currentData();
      var state = (parentData && parentData.state) || AccountsTemplates.getState();
      return state === "signUp" && AccountsTemplates.options.showReCaptcha;
    },
};


var toLowercaseUsername = function(value){
  return value.toLowerCase().replace(/\s+/gm, '');
};

AT.prototype.atPwdFormEvents = {
    // Form submit
    "submit #at-pwd-form": function(event, t) {
        event.preventDefault();
        t.$("#at-btn").blur();

        AccountsTemplates.setDisabled(true);

        var parentData = Template.currentData();
        var state = (parentData && parentData.state) || AccountsTemplates.getState();
        var preValidation = (state !== "signIn");

        // Client-side pre-validation
        // Validates fields values
        // NOTE: This is the only place where password validation can be enforced!
        var formData = {};
        var someError = false;
        var errList = [];
        _.each(AccountsTemplates.getFields(), function(field){
            // Considers only visible fields...
            if (!_.contains(field.visible, state))
                return;

            var fieldId = field._id;

            var rawValue = field.getValue(t);
            var value = field.fixValue(rawValue);
            // Possibly updates the input value
            if (value !== rawValue) {
                field.setValue(t, value);
            }
            if (value !== undefined && value !== "") {
                formData[fieldId] = value;
            }

            // Validates the field value only if current state is not "signIn"
            if (preValidation && field.getStatus() !== false){
                var validationErr = field.validate(value, "strict");
                if (validationErr) {
                    if (field.negativeValidation)
                        field.setError(validationErr);
                    else{
                        var fId = T9n.get(field.getDisplayName(), markIfMissing=false);
                        //errList.push(fId + ": " + err);
                        errList.push({
                            field: field.getDisplayName(),
                            err: validationErr
                        });
                    }
                    someError = true;
                }
                else
                    field.setSuccess();
            }
        });

        // Clears error and result
        AccountsTemplates.clearError();
        AccountsTemplates.clearResult();
        AccountsTemplates.clearMessage();
        // Possibly sets errors
        if (someError){
            if (errList.length)
                AccountsTemplates.state.form.set("error", errList);
            AccountsTemplates.setDisabled(false);
            //reset reCaptcha form
            if (state === "signUp" && AccountsTemplates.options.showReCaptcha) {
                grecaptcha.reset();
            }
            return;
        }

        // Extracts username, email, and pwds
        var current_password = formData.current_password;
        var email = formData.email;
        var password = formData.password;
        var password_again = formData.password_again;
        var username = formData.username;
        var username_and_email = formData.username_and_email;
        // Clears profile data removing username, email, and pwd
        delete formData.current_password;
        delete formData.email;
        delete formData.password;
        delete formData.password_again;
        delete formData.username;
        delete formData.username_and_email;

        if (AccountsTemplates.options.confirmPassword){
            // Checks passwords for correct match
            if (password_again && password !== password_again){
                var pwd_again = AccountsTemplates.getField("password_again");
                if (pwd_again.negativeValidation)
                    pwd_again.setError(AccountsTemplates.texts.errors.pwdMismatch);
                else
                    AccountsTemplates.state.form.set("error", [{
                        field: pwd_again.getDisplayName(),
                        err: AccountsTemplates.texts.errors.pwdMismatch
                    }]);
                AccountsTemplates.setDisabled(false);
                //reset reCaptcha form
                if (state === "signUp" && AccountsTemplates.options.showReCaptcha) {
                  grecaptcha.reset();
                }
                return;
            }
        }

        // -------
        // Sign In
        // -------
        if (state === "signIn") {
            var pwdOk = !!password;
            var userOk = true;
            var loginSelector;
            if (email) {
                if (AccountsTemplates.options.lowercaseUsername) {
                  email = toLowercaseUsername(email);
                }

                loginSelector = {email: email};
            }
            else if (username) {
                if (AccountsTemplates.options.lowercaseUsername) {
                  username = toLowercaseUsername(username);
                }
                loginSelector = {username: username};
            }
            else if (username_and_email) {
                if (AccountsTemplates.options.lowercaseUsername) {
                  username_and_email = toLowercaseUsername(username_and_email);
                }
                loginSelector = username_and_email;
            }
            else
                userOk = false;

            // Possibly exits if not both 'password' and 'username' are non-empty...
            if (!pwdOk || !userOk){
                AccountsTemplates.state.form.set("error", [AccountsTemplates.texts.errors.loginForbidden]);
                AccountsTemplates.setDisabled(false);
                return;
            }


            return Meteor.loginWithPassword(loginSelector, password, function(error) {
                AccountsTemplates.submitCallback(error, state);
            });
        }

        // -------
        // Sign Up
        // -------
        if (state === "signUp") {
            // Possibly gets reCaptcha response
            if (AccountsTemplates.options.showReCaptcha) {
              var response = grecaptcha.getResponse();
              if (response === "") {
                // recaptcha verification has not completed yet (or has expired)...
                // ...simply ignore submit event!
                AccountsTemplates.setDisabled(false);
                return;
              } else {
                formData.reCaptchaResponse = response;
              }
            }

            var hash = Accounts._hashPassword(password);
            var options = {
                username: username,
                email: email,
                password: hash,
                profile: formData,
            };

            // Call preSignUpHook, if any...
            var preSignUpHook = AccountsTemplates.options.preSignUpHook;
            if (preSignUpHook) {
              preSignUpHook(password, options);
            }

            return Meteor.call("ATCreateUserServer", options, function(error){
                if (error && error.reason === 'Email already exists.') {
                    if (AccountsTemplates.options.showReCaptcha) {
                      grecaptcha.reset();
                    }
                }
                AccountsTemplates.submitCallback(error, undefined, function(){
                    if (AccountsTemplates.options.sendVerificationEmail && AccountsTemplates.options.enforceEmailVerification){
                        AccountsTemplates.submitCallback(error, state, function () {
                            AccountsTemplates.state.form.set("result", AccountsTemplates.texts.info.signUpVerifyEmail);
                            // Cleans up input fields' content
                            _.each(AccountsTemplates.getFields(), function(field){
                                // Considers only visible fields...
                                if (!_.contains(field.visible, state))
                                    return;

                                var elem = t.$("#at-field-" + field._id);

                                // Naïve reset
                                if (field.type === "checkbox") elem.prop('checked', false);
                                else elem.val("");

                            });
                            AccountsTemplates.setDisabled(false);
                            AccountsTemplates.avoidRedirect = true;
                        });
                    }
                    else {
                        var loginSelector;

                        if (email) {
                            if (AccountsTemplates.options.lowercaseUsername) {
                              email = toLowercaseUsername(email);
                            }

                            loginSelector = {email: email};
                        }
                        else if (username) {
                            if (AccountsTemplates.options.lowercaseUsername) {
                              username = toLowercaseUsername(username);
                            }
                            loginSelector = {username: username};
                        }
                        else {
                            if (AccountsTemplates.options.lowercaseUsername) {
                              username_and_email = toLowercaseUsername(username_and_email);
                            }
                            loginSelector = username_and_email;
                        }

                        Meteor.loginWithPassword(loginSelector, password, function(error) {
                            AccountsTemplates.submitCallback(error, state, function(){
                                AccountsTemplates.setState("signIn");
                            });
                        });
                    }
                });
            });
        }

        //----------------
        // Forgot Password
        //----------------
        if (state === "forgotPwd"){
            return Accounts.forgotPassword({
                email: email
            }, function(error) {
                AccountsTemplates.submitCallback(error, state, function(){
                    AccountsTemplates.state.form.set("result", AccountsTemplates.texts.info.emailSent);
                    t.$("#at-field-email").val("");
                });
            });
        }

        //--------------------------------
        // Reset Password / Enroll Account
        //--------------------------------
        if (state === "resetPwd" || state === "enrollAccount") {
            var paramToken = AccountsTemplates.getparamToken();
            return Accounts.resetPassword(paramToken, password, function(error) {
                AccountsTemplates.submitCallback(error, state, function(){
                    var pwd_field_id;
                    if (state === "resetPwd")
                        AccountsTemplates.state.form.set("result", AccountsTemplates.texts.info.pwdReset);
                    else // Enroll Account
                        AccountsTemplates.state.form.set("result", AccountsTemplates.texts.info.pwdSet);
                    t.$("#at-field-password").val("");
                    if (AccountsTemplates.options.confirmPassword)
                        t.$("#at-field-password_again").val("");
                });
            });
        }

        //----------------
        // Change Password
        //----------------
        if (state === "changePwd"){
            return Accounts.changePassword(current_password, password, function(error) {
                AccountsTemplates.submitCallback(error, state, function(){
                    AccountsTemplates.state.form.set("result", AccountsTemplates.texts.info.pwdChanged);
                    t.$("#at-field-current_password").val("");
                    t.$("#at-field-password").val("");
                    if (AccountsTemplates.options.confirmPassword)
                        t.$("#at-field-password_again").val("");
                });
            });
        }

        //----------------
        // Resend Verification E-mail
        //----------------
        if (state === "resendVerificationEmail"){
            return Meteor.call("ATResendVerificationEmail", email, function (error) {
                AccountsTemplates.submitCallback(error, state, function(){
                    AccountsTemplates.state.form.set("result", AccountsTemplates.texts.info.verificationEmailSent);
                    t.$("#at-field-email").val("");

                    AccountsTemplates.avoidRedirect = true;
                });
            });
        }
    },
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/templates_helpers/at_pwd_form_btn.js                                              //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
AT.prototype.atPwdFormBtnHelpers = {
    submitDisabled: function(){
        var disable = _.chain(AccountsTemplates.getFields())
            .map(function(field){
                return field.hasError() || field.isValidating();
            })
            .some()
            .value()
        ;
        if (disable)
            return "disabled";
    },
    buttonText: function() {
        var parentData = Template.currentData();
        var state = (parentData && parentData.state) || AccountsTemplates.getState();
        return T9n.get(AccountsTemplates.texts.button[state], markIfMissing=false);
    },
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/templates_helpers/at_pwd_link.js                                                  //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
AT.prototype.atPwdLinkHelpers = {
    disabled: function() {
        return AccountsTemplates.disabled();
    },
    forgotPwdLink: function(){
        return AccountsTemplates.getRoutePath("forgotPwd");
    },
    preText: function(){
        return T9n.get(AccountsTemplates.texts.pwdLink_pre, markIfMissing=false);
    },
    linkText: function(){
        return T9n.get(AccountsTemplates.texts.pwdLink_link, markIfMissing=false);
    },
    suffText: function(){
        return T9n.get(AccountsTemplates.texts.pwdLink_suff, markIfMissing=false);
    },
};

AT.prototype.atPwdLinkEvents = {
    "click #at-forgotPwd": function(event, t) {
        event.preventDefault();
        AccountsTemplates.linkClick("forgotPwd");
    },
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/templates_helpers/at_reCaptcha.js                                                 //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
AT.prototype.atReCaptchaRendered = function() {
    $.getScript('//www.google.com/recaptcha/api.js?hl=' + T9n.getLanguage());
};

AT.prototype.atReCaptchaHelpers = {
    key: function() {
        if (AccountsTemplates.options.reCaptcha && AccountsTemplates.options.reCaptcha.siteKey)
            return AccountsTemplates.options.reCaptcha.siteKey;
        return Meteor.settings.public.reCaptcha.siteKey;
    },

    theme: function() {
        return AccountsTemplates.options.reCaptcha && AccountsTemplates.options.reCaptcha.theme;
    },

    data_type: function() {
        return AccountsTemplates.options.reCaptcha && AccountsTemplates.options.reCaptcha.data_type;
    },
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/templates_helpers/at_resend_verification_email_link.js                            //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
AT.prototype.atResendVerificationEmailLinkHelpers = {
    disabled: function () {
        return AccountsTemplates.disabled();
    },
    resendVerificationEmailLink: function () {
        return AccountsTemplates.getRoutePath("resendVerificationEmail");
    },
    preText: function(){
        return T9n.get(AccountsTemplates.texts.resendVerificationEmailLink_pre, markIfMissing=false);
    },
    linkText: function(){
        return T9n.get(AccountsTemplates.texts.resendVerificationEmailLink_link, markIfMissing=false);
    },
    suffText: function(){
        return T9n.get(AccountsTemplates.texts.resendVerificationEmailLink_suff, markIfMissing=false);
    },
};

AT.prototype.atResendVerificationEmailLinkEvents = {
    "click #at-resend-verification-email": function(event, t) {
        event.preventDefault();
        AccountsTemplates.linkClick('resendVerificationEmail');
    },
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/templates_helpers/at_result.js                                                    //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
AT.prototype.atResultHelpers = {
    result: function() {
        var resultText = AccountsTemplates.state.form.get("result");
        if (resultText)
            return T9n.get(resultText, markIfMissing=false);
    },
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/templates_helpers/at_sep.js                                                       //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
AT.prototype.atSepHelpers = {
    sepText: function(){
        return T9n.get(AccountsTemplates.texts.sep, markIfMissing=false);
    },
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/templates_helpers/at_signin_link.js                                               //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
AT.prototype.atSigninLinkHelpers = {
    disabled: function() {
        return AccountsTemplates.disabled();
    },
    signInLink: function(){
        return AccountsTemplates.getRoutePath("signIn");
    },
    preText: function(){
        return T9n.get(AccountsTemplates.texts.signInLink_pre, markIfMissing=false);
    },
    linkText: function(){
        return T9n.get(AccountsTemplates.texts.signInLink_link, markIfMissing=false);
    },
    suffText: function(){
        return T9n.get(AccountsTemplates.texts.signInLink_suff, markIfMissing=false);
    },
};

AT.prototype.atSigninLinkEvents = {
    "click #at-signIn": function(event, t) {
        event.preventDefault();
        AccountsTemplates.linkClick("signIn");
    },
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/templates_helpers/at_signup_link.js                                               //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
AT.prototype.atSignupLinkHelpers = {
    disabled: function() {
        return AccountsTemplates.disabled();
    },
    signUpLink: function(){
        return AccountsTemplates.getRoutePath("signUp");
    },
    preText: function(){
        return T9n.get(AccountsTemplates.texts.signUpLink_pre, markIfMissing=false);
    },
    linkText: function(){
        return T9n.get(AccountsTemplates.texts.signUpLink_link, markIfMissing=false);
    },
    suffText: function(){
        return T9n.get(AccountsTemplates.texts.signUpLink_suff, markIfMissing=false);
    },
};

AT.prototype.atSignupLinkEvents = {
    "click #at-signUp": function(event, t) {
        event.preventDefault();
        AccountsTemplates.linkClick('signUp');
    },
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/templates_helpers/at_social.js                                                    //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
AT.prototype.atSocialHelpers = {
    disabled: function() {
        if (AccountsTemplates.disabled())
            return "disabled";
        var user = Meteor.user();
        if (user){
            var numServices = 0;
            if (user.services)
                numServices = _.keys(user.services).length; // including "resume"
            if (numServices === 2 && user.services[this._id])
                return "disabled";
        }
    },
    name: function(){
        return this._id;
    },
    iconClass: function() {
        var ic = AccountsTemplates.texts.socialIcons[this._id];
        if (!ic)
            ic = "fa fa-" + this._id;
        return ic;
    },
    buttonText: function() {
        var service = this;
        var serviceName = this._id;
        if (serviceName === "meteor-developer")
            serviceName = "meteor";
        serviceName = capitalize(serviceName);
        if (!service.configured)
            return T9n.get(AccountsTemplates.texts.socialConfigure, markIfMissing=false) + " " + serviceName;
        var showAddRemove = AccountsTemplates.options.showAddRemoveServices;
        var user = Meteor.user();
        if (user && showAddRemove){
            if (user.services && user.services[this._id]){
                var numServices = _.keys(user.services).length; // including "resume"
                if (numServices === 2)
                    return serviceName;
                else
                    return T9n.get(AccountsTemplates.texts.socialRemove, markIfMissing=false) + " " + serviceName;
            } else
                    return T9n.get(AccountsTemplates.texts.socialAdd, markIfMissing=false) + " " + serviceName;
        }
        var parentData = Template.parentData();
        var state = (parentData && parentData.state) || AccountsTemplates.getState();
        var prefix = state === "signIn" ?
            T9n.get(AccountsTemplates.texts.socialSignIn, markIfMissing=false) :
            T9n.get(AccountsTemplates.texts.socialSignUp, markIfMissing=false);
        return prefix + " " + T9n.get(AccountsTemplates.texts.socialWith, markIfMissing=false) + " " + serviceName;
    },
};

AT.prototype.atSocialEvents = {
    "click button": function(event, t) {
        event.preventDefault();
        event.currentTarget.blur();
        if (AccountsTemplates.disabled())
            return;
        var user = Meteor.user();
        if (user && user.services && user.services[this._id]){
            var numServices = _.keys(user.services).length; // including "resume"
            if (numServices === 2)
                return;
            else{
                AccountsTemplates.setDisabled(true);
                Meteor.call("ATRemoveService", this._id, function(error){
                    AccountsTemplates.setDisabled(false);
                });
            }
        } else {
            AccountsTemplates.setDisabled(true);
            var parentData = Template.parentData();
            var state = (parentData && parentData.state) || AccountsTemplates.getState();
            var serviceName = this._id;
            var methodName;
            if (serviceName === 'meteor-developer')
                methodName = "loginWithMeteorDeveloperAccount";
            else
                methodName = "loginWith" + capitalize(serviceName);
            var loginWithService = Meteor[methodName];
            options = {
                loginStyle: AccountsTemplates.options.socialLoginStyle,
            };
            if (Accounts.ui) {
                if (Accounts.ui._options.requestPermissions[serviceName]) {
                    options.requestPermissions = Accounts.ui._options.requestPermissions[serviceName];
                }
                if (Accounts.ui._options.requestOfflineToken[serviceName]) {
                    options.requestOfflineToken = Accounts.ui._options.requestOfflineToken[serviceName];
                }
            }
            loginWithService(options, function(err) {
                AccountsTemplates.setDisabled(false);
                if (err && err instanceof Accounts.LoginCancelledError) {
                    // do nothing
                }
                else if (err && err instanceof ServiceConfiguration.ConfigError) {
                    if (Accounts._loginButtonsSession)
                        return Accounts._loginButtonsSession.configureService(serviceName);
                }
                else
                    AccountsTemplates.submitCallback(err, state);
            });
        }
    },
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/templates_helpers/at_terms_link.js                                                //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
AT.prototype.atTermsLinkHelpers = {
    disabled: function() {
        return AccountsTemplates.disabled();
    },
    text: function(){
        return T9n.get(AccountsTemplates.texts.termsPreamble, markIfMissing=false);
    },
    privacyUrl: function(){
        return AccountsTemplates.options.privacyUrl;
    },
    privacyLinkText: function(){
        return T9n.get(AccountsTemplates.texts.termsPrivacy, markIfMissing=false);
    },
    showTermsAnd: function(){
        return !!AccountsTemplates.options.privacyUrl && !!AccountsTemplates.options.termsUrl;
    },
    and: function(){
        return T9n.get(AccountsTemplates.texts.termsAnd, markIfMissing=false);
    },
    termsUrl: function(){
        return AccountsTemplates.options.termsUrl;
    },
    termsLinkText: function(){
        return T9n.get(AccountsTemplates.texts.termsTerms, markIfMissing=false);
    },
};

AT.prototype.atTermsLinkEvents = {
    "click a": function(event) {
        if (AccountsTemplates.disabled())
            event.preventDefault();
    },
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/templates_helpers/at_title.js                                                     //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
AT.prototype.atTitleHelpers = {
  title: function() {
    var parentData = Template.currentData();
    var state = (parentData && parentData.state) || AccountsTemplates.getState();
    return T9n.get(AccountsTemplates.texts.title[state], markIfMissing = false);
  },
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/templates_helpers/at_message.js                                                   //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
AT.prototype.atMessageHelpers = {
    message: function() {
        var messageText = AccountsTemplates.state.form.get("message");
        if (messageText)
            return T9n.get(messageText, markIfMissing=false);
    },
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/templates_helpers/template.ensure_signed_in.js                                    //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //

Template.__checkName("ensureSignedIn");
Template["ensureSignedIn"] = new Template("Template.ensureSignedIn", (function() {
  var view = this;
  return Blaze.If(function() {
    return Spacebars.call(view.lookup("signedIn"));
  }, function() {
    return [ "\n    ", Blaze._TemplateWith(function() {
      return {
        template: Spacebars.call(view.lookup("template"))
      };
    }, function() {
      return Spacebars.include(function() {
        return Spacebars.call(Template.__dynamic);
      });
    }), "\n  " ];
  }, function() {
    return [ "\n    ", Blaze.If(function() {
      return Spacebars.call(view.lookup("auth"));
    }, function() {
      return [ "\n      ", Blaze._TemplateWith(function() {
        return {
          template: Spacebars.call(view.lookup("auth"))
        };
      }, function() {
        return Spacebars.include(function() {
          return Spacebars.call(Template.__dynamic);
        });
      }), "\n    " ];
    }, function() {
      return [ "\n      ", Spacebars.include(view.lookupTemplate("fullPageAtForm")), "\n    " ];
    }), "\n  " ];
  });
}));

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/templates_helpers/ensure_signed_in.js                                             //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //

Template.ensureSignedIn.helpers({
  signedIn: function () {
    if (!Meteor.user()) {
      AccountsTemplates.setState(AccountsTemplates.options.defaultState, function(){
        var err = AccountsTemplates.texts.errors.mustBeLoggedIn;
        AccountsTemplates.state.form.set('error', [err]);
      });
      return false;
    } else {
      AccountsTemplates.clearError();
      return true;
    }
  }
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/useraccounts_core/lib/methods.js                                                                        //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
/* global
  AccountsTemplates: false
*/
"use strict";

Meteor.methods({
  ATRemoveService: function(serviceName) {
    check(serviceName, String);

    var userId = this.userId;

    if (userId) {
      var user = Meteor.users.findOne(userId);
      var numServices = _.keys(user.services).length; // including "resume"
      var unset = {};

      if (numServices === 2) {
        throw new Meteor.Error(403, AccountsTemplates.texts.errors.cannotRemoveService, {});
      }

      unset["services." + serviceName] = "";
      Meteor.users.update(userId, {$unset: unset});
    }
  },
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("useraccounts:core", {
  AccountsTemplates: AccountsTemplates
});

})();
