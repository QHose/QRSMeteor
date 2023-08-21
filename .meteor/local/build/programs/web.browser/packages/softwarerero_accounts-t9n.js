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
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;

/* Package-scope variables */
var __coffeescriptShare, T9n;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n.coffee.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
        

Meteor.startup(function() {
  if (Meteor.isClient) {
    return typeof Template !== "undefined" && Template !== null ? Template.registerHelper('t9n', function(x, params) {
      return T9n.get(x, true, params.hash);
    }) : void 0;
  }
});

T9n = (function() {
  function T9n() {}

  T9n.maps = {};

  T9n.defaultLanguage = 'en';

  T9n.language = '';

  T9n.dep = new Deps.Dependency();

  T9n.depLanguage = new Deps.Dependency();

  T9n.missingPrefix = ">";

  T9n.missingPostfix = "<";

  T9n.map = function(language, map) {
    if (!this.maps[language]) {
      this.maps[language] = {};
    }
    this.registerMap(language, '', false, map);
    return this.dep.changed();
  };

  T9n.get = function(label, markIfMissing, args, language) {
    var index, parent, ret, _ref, _ref1;
    if (markIfMissing == null) {
      markIfMissing = true;
    }
    if (args == null) {
      args = {};
    }
    this.dep.depend();
    this.depLanguage.depend();
    if (typeof label !== 'string') {
      return '';
    }
    if (language == null) {
      language = this.language;
    }
    ret = (_ref = this.maps[language]) != null ? _ref[label] : void 0;
    if (!ret) {
      index = language.lastIndexOf('_');
      if (index) {
        parent = language.substring(0, index);
        if (parent) {
          return this.get(label, markIfMissing, args, parent);
        }
      }
    }
    if (!ret) {
      ret = (_ref1 = this.maps[this.defaultLanguage]) != null ? _ref1[label] : void 0;
    }
    if (!ret) {
      if (markIfMissing) {
        return this.missingPrefix + label + this.missingPostfix;
      } else {
        return label;
      }
    }
    if (Object.keys(args).length === 0) {
      return ret;
    } else {
      return this.replaceParams(ret, args);
    }
  };

  T9n.registerMap = function(language, prefix, dot, map) {
    var key, value, _results;
    if (typeof map === 'string') {
      return this.maps[language][prefix] = map;
    } else if (typeof map === 'object') {
      if (dot) {
        prefix = prefix + '.';
      }
      _results = [];
      for (key in map) {
        value = map[key];
        _results.push(this.registerMap(language, prefix + key, true, value));
      }
      return _results;
    }
  };

  T9n.getLanguage = function() {
    this.depLanguage.depend();
    return this.language;
  };

  T9n.getLanguages = function() {
    this.dep.depend();
    return Object.keys(this.maps).sort();
  };

  T9n.getLanguageInfo = function() {
    var k, keys, _i, _len, _results;
    this.dep.depend();
    keys = Object.keys(this.maps).sort();
    _results = [];
    for (_i = 0, _len = keys.length; _i < _len; _i++) {
      k = keys[_i];
      _results.push({
        name: this.maps[k]['t9Name'],
        code: k
      });
    }
    return _results;
  };

  T9n.setLanguage = function(language) {
    if (this.language === language) {
      return;
    }
    language = language.replace(new RegExp('-', 'g'), '_');
    if (!this.maps[language]) {
      if (language.indexOf('_') > 1) {
        return this.setLanguage(language.substring(0, language.lastIndexOf('_')));
      } else {
        throw Error("language " + language + " does not exist");
      }
    }
    this.language = language;
    return this.depLanguage.changed();
  };

  T9n.replaceParams = function(str, args) {
    var key, re, value;
    for (key in args) {
      value = args[key];
      re = new RegExp("@{" + key + "}", 'g');
      str = str.replace(re, value);
    }
    return str;
  };

  return T9n;

})();

this.T9n = T9n;

this.t9n = function(x, includePrefix, params) {
  return T9n.get(x);
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/ar.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var ar;

ar = {
  add: "اضف",
  and: "و",
  back: "رجوع",
  changePassword: "غير كلمة السر",
  choosePassword: "اختر كلمة السر",
  clickAgree: "بفتح حسابك انت توافق على",
  configure: "تعديل",
  createAccount: "افتح حساب جديد",
  currentPassword: "كلمة السر الحالية",
  dontHaveAnAccount: "ليس عندك حساب؟",
  email: "البريد الالكترونى",
  emailAddress: "البريد الالكترونى",
  emailResetLink: "اعادة تعيين البريد الالكترونى",
  forgotPassword: "نسيت كلمة السر؟",
  ifYouAlreadyHaveAnAccount: "اذا كان عندك حساب",
  newPassword: "كلمة السر الجديدة",
  newPasswordAgain: "كلمة السر الجديدة مرة اخرى",
  optional: "اختيارى",
  OR: "او",
  password: "كلمة السر",
  passwordAgain: "كلمة السر مرة اخرى",
  privacyPolicy: "سياسة الخصوصية",
  remove: "ازالة",
  resetYourPassword: "اعادة تعيين كلمة السر",
  setPassword: "تعيين كلمة السر",
  sign: "تسجيل",
  signIn: "تسجيل الدخول",
  signin: "تسجيل الدخول",
  signOut: "تسجيل الخروج",
  signUp: "افتح حساب جديد",
  signupCode: "رمز التسجيل",
  signUpWithYourEmailAddress: "سجل ببريدك الالكترونى",
  terms: "شروط الاستخدام",
  updateYourPassword: "جدد كلمة السر",
  username: "اسم المستخدم",
  usernameOrEmail: "اسم المستخدم او البريد الالكترونى",
  "with": "مع",
  info: {
    emailSent: "تم ارسال البريد الالكترونى",
    emailVerified: "تم تأكيد البريد الالكترونى",
    passwordChanged: "تم تغيير كلمة السر",
    passwordReset: "تم اعادة تعيين كلمة السر"
  },
  error: {
    emailRequired: "البريد الالكترونى مطلوب",
    minChar: "سبعة حروف هو الحد الادنى لكلمة السر",
    pwdsDontMatch: "كلمتين السر لا يتطابقان",
    pwOneDigit: "كلمة السر يجب ان تحتوى على رقم واحد على الاقل",
    pwOneLetter: "كلمة السر تحتاج الى حرف اخر",
    signInRequired: "عليك بتسجبل الدخول لفعل ذلك",
    signupCodeIncorrect: "رمز التسجيل غير صحيح",
    signupCodeRequired: "رمز التسجيل مطلوب",
    usernameIsEmail: "اسم المستخدم لا يمكن ان يكون بريد الكترونى",
    usernameRequired: "اسم المستخدم مطلوب",
    accounts: {
      "Email already exists.": "البريد الالكترونى مسجل",
      "Email doesn't match the criteria.": "البريد الالكترونى لا يتوافق مع الشروط",
      "Invalid login token": "رمز الدخول غير صالح",
      "Login forbidden": "تسجيل الدخول غير مسموح",
      "Service unknown": "خدمة غير معروفة",
      "Unrecognized options for login request": "اختيارات غير معلومة عند تسجيل الدخول",
      "User validation failed": "تأكيد المستخدم فشل",
      "Username already exists.": "اسم المستخدم مسجل",
      "You are not logged in.": "لم تسجل دخولك",
      "You've been logged out by the server. Please log in again.": "لقد تم تسجيل خروجك من قبل الخادم. قم بتسجيل الدخول مجددا.",
      "Your session has expired. Please log in again.": "لقد انتهت جلستك. قم بتسجيل الدخول مجددا.",
      "No matching login attempt found": "لم نجد محاولة دخول مطابقة",
      "Password is old. Please reset your password.": "كلمة السر قديمة. قم باعادة تعيين كلمة السر.",
      "Incorrect password": "كلمة السر غير صحيحة.",
      "Invalid email": "البريد الالكترونى غير صالح",
      "Must be logged in": "يجب ان تسجل دخولك",
      "Need to set a username or email": "يجب تعيين اسم مستخدم او بريد الكترونى",
      "old password format": "صيغة كلمة السر القديمة",
      "Password may not be empty": "كلمة السر لا يمكن ان تترك فارغة",
      "Signups forbidden": "فتح الحسابات غير مسموح",
      "Token expired": "انتهى زمن الرمز",
      "Token has invalid email address": "الرمز يحتوى على بريد الكترونى غير صالح",
      "User has no password set": "المستخدم لم يقم بتعيين كلمة سر",
      "User not found": "اسم المستخدم غير موجود",
      "Verify email link expired": "انتهى زمن رابط تأكيد البريد الالكترونى",
      "Verify email link is for unknown address": "رابط تأكيد البريد الالكترونى ينتمى الى بريد الكترونى غير معروف",
      "Match failed": "المطابقة فشلت",
      "Unknown error": "خطأ غير معروف"
    }
  }
};

T9n.map("ar", ar);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/ca.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var ca;

ca = {
  t9Name: 'Català',
  add: "afegir",
  and: "i",
  back: "enrere",
  changePassword: "Canviar contrasenya",
  choosePassword: "Escollir contrasenya",
  clickAgree: "Al fer clic a Subscriure aproves la",
  configure: "Disposició",
  createAccount: "Crear compte",
  currentPassword: "Contrasenya actual",
  dontHaveAnAccount: "No tens compte?",
  email: "Correu",
  emailAddress: "Adreça de correu",
  emailResetLink: "Restablir correu",
  forgotPassword: "Has oblidat la contrasenya?",
  ifYouAlreadyHaveAnAccount: "Si ja tens un compte",
  newPassword: "Nova contrasenya",
  newPasswordAgain: "Nova contrasenya (repetir)",
  optional: "Opcional",
  OR: "O",
  password: "Contrasenya",
  passwordAgain: "Contrasenya (repetir)",
  privacyPolicy: "Política de Privacitat",
  remove: "eliminar",
  resetYourPassword: "Restablir la teva contrasenya",
  setPassword: "Definir contrasenya",
  sign: "Entra",
  signIn: "Entra",
  signin: "entra",
  signOut: "Surt",
  signUp: "Subscriure's",
  signupCode: "Còdi de subscripció",
  signUpWithYourEmailAddress: "Subscriure-te amb el correu",
  terms: "Termes d'ús",
  updateYourPassword: "Actualitzar la teva contrasenya",
  username: "Usuari",
  usernameOrEmail: "Usuari o correu",
  "with": "amb",
  maxAllowedLength: "Longitud màxima permesa",
  minRequiredLength: "Longitud mínima requerida",
  resendVerificationEmail: "Envia el correu de nou",
  resendVerificationEmailLink_pre: "Correu de verificació perdut?",
  resendVerificationEmailLink_link: "Envia de nou",
  info: {
    emailSent: "Correu enviat",
    emailVerified: "Correu verificat",
    passwordChanged: "Contrasenya canviada",
    passwordReset: "Restablir contrasenya"
  },
  error: {
    emailRequired: "Es requereix el correu.",
    minChar: "7 caràcters mínim.",
    pwdsDontMatch: "Les contrasenyes no coincideixen",
    pwOneDigit: "mínim un dígit.",
    pwOneLetter: "mínim una lletra.",
    signInRequired: "Has d'iniciar sessió per a fer això.",
    signupCodeIncorrect: "El còdi de subscripció no coincideix.",
    signupCodeRequired: "Es requereix el còdi de subscripció.",
    usernameIsEmail: "L'usuari no pot ser el correu.",
    usernameRequired: "Es requereix un usuari.",
    accounts: {
      "Email already exists.": "El correu ja existeix.",
      "Email doesn't match the criteria.": "El correu no coincideix amb els criteris.",
      "Invalid login token": "Token d'entrada invàlid",
      "Login forbidden": "No es permet entrar en aquests moments",
      "Service unknown": "Servei desconegut",
      "Unrecognized options for login request": "Opcions desconegudes per la petició d'entrada",
      "User validation failed": "No s'ha pogut validar l'usuari",
      "Username already exists.": "L'usuari ja existeix.",
      "You are not logged in.": "No has iniciat sessió",
      "You've been logged out by the server. Please log in again.": "Has estat desconnectat pel servidor. Si us plau, entra de nou.",
      "Your session has expired. Please log in again.": "La teva sessió ha expirat. Si us plau, entra de nou.",
      "Already verified": "Ja està verificat",
      "No matching login attempt found": "No s'ha trobat un intent de login vàlid",
      "Password is old. Please reset your password.": "La contrasenya és antiga, si us plau, restableix una contrasenya nova",
      "Incorrect password": "Contrasenya invàlida",
      "Invalid email": "Correu invàlid",
      "Must be logged in": "Has d'iniciar sessió",
      "Need to set a username or email": "Has d'especificar un usuari o un correu",
      "old password format": "Format de contrasenya antic",
      "Password may not be empty": "La contrasenya no pot ser buida",
      "Signups forbidden": "Subscripció no permesa en aquest moment",
      "Token expired": "Token expirat",
      "Token has invalid email address": "El token conté un correu invàlid",
      "User has no password set": "Usuari no té contrasenya",
      "User not found": "Usuari no trobat",
      "Verify email link expired": "L'enllaç per a verificar el correu ha expirat",
      "Verify email link is for unknown address": "L'enllaç per a verificar el correu conté una adreça desconeguda",
      "At least 1 digit, 1 lowercase and 1 uppercase": "Al menys 1 dígit, 1 lletra minúscula i 1 majúscula",
      "Please verify your email first. Check the email and follow the link!": "Si us plau, verifica el teu correu primer. Comprova el correu i segueix l'enllaç que conté!",
      "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.": "Un nou correu ha estat enviat a la teva bústia. Si no reps el correu assegura't de comprovar la bústia de correu no desitjat.",
      "Match failed": "Comprovació fallida",
      "Unknown error": "Error desconegut"
    }
  }
};

T9n.map("ca", ca);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/cs.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var cs;

cs = {
  add: "přidat",
  and: "a",
  back: "zpět",
  changePassword: "Změnte heslo",
  choosePassword: "Zvolte heslo",
  clickAgree: "Stiskem tlačítka Registrovat souhlasíte s",
  configure: "Nastavit",
  createAccount: "Vytvořit účet",
  currentPassword: "Současné heslo",
  dontHaveAnAccount: "Nemáte účet?",
  email: "Email",
  emailAddress: "Emailová adresa",
  emailResetLink: "Odkaz na reset emailu",
  forgotPassword: "Zapomenuté heslo?",
  ifYouAlreadyHaveAnAccount: "Pokud již máte účet",
  newPassword: "Nové heslo",
  newPasswordAgain: "Nové heslo (zopakovat)",
  optional: "Volitelný",
  OR: "nebo",
  password: "Heslo",
  passwordAgain: "Heslo (zopakovat)",
  privacyPolicy: "Nastavení soukromí",
  remove: "odstranit",
  resetYourPassword: "Resetovat heslo",
  setPassword: "Nastavit heslo",
  sign: "Přihlášení",
  signIn: "Přihlásit se",
  signin: "přihlásit se",
  signOut: "Odhlásit se",
  signUp: "Registrovat",
  signupCode: "Registrační kód",
  signUpWithYourEmailAddress: "Registrovat se emailovou adresou",
  terms: "Podmínky použití",
  updateYourPassword: "Aktualizujte si své heslo",
  username: "Uživatelské jméno",
  usernameOrEmail: "Uživatelské jméno nebo email",
  "with": "s",
  info: {
    emailSent: "Email odeslán",
    emailVerified: "Email ověřen",
    passwordChanged: "Heslo změněno",
    passwordReset: "Heslo resetováno"
  },
  error: {
    emailRequired: "Email je povinný.",
    minChar: "minimální délka hesla je 7 znaků.",
    pwdsDontMatch: "Hesla nesouhlasí",
    pwOneDigit: "Heslo musí obsahovat alespoň jednu číslici.",
    pwOneLetter: "Heslo musí obsahovat alespoň 1 slovo.",
    signInRequired: "Musíte být příhlášeni.",
    signupCodeIncorrect: "Registrační kód je chybný.",
    signupCodeRequired: "Registrační kód je povinný.",
    usernameIsEmail: "Uživatelské jméno nemůže být emailová adresa.",
    usernameRequired: "Uživatelské jméno je povinné."
  },
  accounts: {
    "A login handler should return a result or undefined": "Přihlašovací rutina musí vracet výsledek nebo undefined",
    "Email already exists.": "Email již existuje.",
    "Email doesn't match the criteria.": "Email nesplňuje požadavky.",
    "Invalid login token": "Neplatný přihlašovací token",
    "Login forbidden": "Přihlášení je zakázáno",
    "Service unknown": "Neznámá služba",
    "Unrecognized options for login request": "Nerozpoznaná volba přihlašovacího požadavku",
    "User validation failed": "Validace uživatele selhala",
    "Username already exists.": "Uživatelské jméno již existuje.",
    "You are not logged in.": "Nejste přihlášený.",
    "You've been logged out by the server. Please log in again.": "Byl jste odhlášen. Prosím přihlašte se znovu.",
    "Your session has expired. Please log in again.": "Vaše připojení vypršelo. Prosím přihlašte se znovu.",
    "No matching login attempt found": "Nenalezen odpovídající způsob přihlášení",
    "Password is old. Please reset your password.": "Heslo je staré. Prosíme nastavte si ho znovu.",
    "Incorrect password": "Chybné heslo",
    "Invalid email": "Neplatný email",
    "Must be logged in": "Uživatel musí být přihlášen",
    "Need to set a username or email": "Je třeba zadat uživatelské jméno nebo email",
    "old password format": "starý formát hesla",
    "Password may not be empty": "Heslo nemůže být prázdné",
    "Signups forbidden": "Registrace je zakázaná",
    "Token expired": "Token vypršel",
    "Token has invalid email address": "Token má neplatnou emailovou adresu",
    "User has no password set": "Uživatel nemá nastavené heslo",
    "User not found": "Uživatel nenalezen",
    "Verify email link expired": "Odkaz pro ověření emailu vypršel",
    "Verify email link is for unknown address": "Odkaz pro ověření emailu má neznámou adresu",
    "Match failed": "Nesouhlasí",
    "Unknown error": "Neznámá chyba"
  }
};

T9n.map("cs", cs);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/da.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var da;

da = {
  add: "tilføj",
  and: "og",
  back: "tilbage",
  changePassword: "Skift kodeord",
  choosePassword: "Vælg kodeord",
  clickAgree: "Ved at klikke på tilmeld accepterer du vores",
  configure: "Konfigurer",
  createAccount: "Opret konto",
  currentPassword: "Nuværende kodeord",
  dontHaveAnAccount: "Har du ikke en konto?",
  email: "E-mail",
  emailAddress: "E-mail adresse",
  emailResetLink: "Nulstil E-mail Link",
  forgotPassword: "Glemt kodeord?",
  ifYouAlreadyHaveAnAccount: "Hvis jeg allerede har en konto",
  newPassword: "Nyt kodeord",
  newPasswordAgain: "Nyt kodeord (igen)",
  optional: "Frivilligt",
  OR: "eller",
  password: "Kodeord",
  passwordAgain: "Kodeord (igen)",
  privacyPolicy: "Privatlivspolitik",
  remove: "fjern",
  resetYourPassword: "Nulstil dit kodeord",
  setPassword: "Sæt kodeord",
  sign: "Log",
  signIn: "Log ind",
  signin: "Log ind",
  signOut: "Log ud",
  signUp: "Tilmeld",
  signupCode: "Tilmeldingskode",
  signUpWithYourEmailAddress: "Tilmeld med din e-mail adresse",
  terms: "Betingelser for brug",
  updateYourPassword: "Skift dit kodeord",
  username: "Brugernavn",
  usernameOrEmail: "Brugernavn eller e-mail",
  "with": "med",
  info: {
    emailSent: "E-mail sendt",
    emailVerified: "Email verificeret",
    passwordChanged: "Password ændret",
    passwordReset: "Password reset"
  },
  error: {
    emailRequired: "E-mail er påkrævet.",
    minChar: "Kodeordet skal være mindst 7 tegn.",
    pwdsDontMatch: "De to kodeord er ikke ens.",
    pwOneDigit: "Kodeord kræver mindste et tal.",
    pwOneLetter: "Kodeord kræver mindst et bogstav.",
    signInRequired: "Du skal være logget ind for at kunne gøre det.",
    signupCodeIncorrect: "Tilmeldingskode er forkert.",
    signupCodeRequired: "Tilmeldingskode er påkrævet.",
    usernameIsEmail: "Brugernavn kan ikke være en e-mail adresse.",
    usernameRequired: "Brugernavn skal udfyldes.",
    accounts: {
      "Email already exists.": "E-mail findes allerede.",
      "Email doesn't match the criteria.": "E-mail modsvarer ikke kriteriet.",
      "Invalid login token": "Invalid log ind token",
      "Login forbidden": "Log ind forbudt",
      "Service unknown": "Service ukendt",
      "Unrecognized options for login request": "Ukendte options for login forsøg",
      "User validation failed": "Bruger validering fejlede",
      "Username already exists.": "Brugernavn findes allerede.",
      "You are not logged in.": "Du er ikke logget ind.",
      "You've been logged out by the server. Please log in again.": "Du er blevet logget af serveren. Log ind igen.",
      "Your session has expired. Please log in again.": "Din session er udløbet. Log ind igen.",
      "No matching login attempt found": "Der fandtes ingen login forsøg",
      "Password is old. Please reset your password.": "Kodeordet er for gammelt. Du skal resette det.",
      "Incorrect password": "Forkert kodeord",
      "Invalid email": "Invalid e-mail",
      "Must be logged in": "Du skal være logget ind",
      "Need to set a username or email": "Du skal angive enten brugernavn eller e-mail",
      "old password format": "gammelt kodeord format",
      "Password may not be empty": "Kodeord skal være udfyldt",
      "Signups forbidden": "Tilmeldinger forbudt",
      "Token expired": "Token udløbet",
      "Token has invalid email address": "Token har en invalid e-mail adresse",
      "User has no password set": "Bruger har ikke angivet noget kodeord",
      "User not found": "Bruger ej fundet",
      "Verify email link expired": "Verify email link expired",
      "Verify email link is for unknown address": "Verificer e-mail link for ukendt adresse",
      "Match failed": "Match fejlede",
      "Unknown error": "Ukendt fejl"
    }
  }
};

T9n.map("da", da);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/de.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var de;

de = {
  t9Name: 'Deutsch',
  add: "hinzufügen",
  and: "und",
  back: "zurück",
  changePassword: "Passwort ändern",
  choosePassword: "Passwort auswählen",
  clickAgree: "Die Registrierung impliziert die Akzeptanz unserer",
  configure: "Konfigurieren",
  createAccount: "Konto erstellen",
  currentPassword: "Aktuelles Passwort",
  dontHaveAnAccount: "Noch kein Konto?",
  email: "E-Mail",
  emailAddress: "E-Mail Adresse",
  emailResetLink: "Senden",
  forgotPassword: "Passwort vergessen?",
  ifYouAlreadyHaveAnAccount: "Falls bereits ein Konto existiert, bitte hier",
  newPassword: "Neues Passwort",
  newPasswordAgain: "Neues Passwort (wiederholen)",
  optional: "Optional",
  OR: "ODER",
  password: "Passwort",
  passwordAgain: "Passwort (wiederholen)",
  privacyPolicy: "Datenschutzerklärung",
  remove: "entfernen",
  resetYourPassword: "Passwort zurücksetzen",
  setPassword: "Passwort festlegen",
  sign: "Anmelden",
  signIn: "Anmelden",
  signin: "anmelden",
  signOut: "Abmelden",
  signUp: "Registrieren",
  signupCode: "Registrierungscode",
  signUpWithYourEmailAddress: "Mit E-Mail registrieren",
  terms: "Geschäftsbedingungen",
  updateYourPassword: "Passwort aktualisieren",
  username: "Benutzername",
  usernameOrEmail: "Benutzername oder E-Mail",
  "with": "mit",
  "Verification email lost?": "Verifizierungsemail verloren?",
  "Send again": "Erneut senden",
  "Send the verification email again": "Verifizierungsemail erneut senden",
  "Send email again": "Email erneut senden",
  "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.": "Eine neue Email wurde verschickt. Sollte sich die Email nicht im Posteingang befinden, empfiehlt es sich, den Spamordner zu überprüfen.",
  info: {
    emailSent: "E-Mail gesendet",
    emailVerified: "E-Mail verifiziert",
    PasswordChanged: "Passwort geändert",
    PasswordReset: "Passwort zurückgesetzt"
  },
  error: {
    emailRequired: "E-Mail benötigt.",
    minChar: "Passwort muss mindestens 7 Zeichen lang sein.",
    pwdsDontMatch: "Passwörter stimmen nicht überein.",
    pwOneDigit: "Passwort muss mindestens eine Ziffer enthalten.",
    pwOneLetter: "Passwort muss mindestens einen Buchstaben enthalten.",
    signInRequired: "Eine Anmeldung ist erforderlich.",
    signupCodeIncorrect: "Registrierungscode ungültig.",
    signupCodeRequired: "Registrierungscode benötigt.",
    usernameIsEmail: "Benutzername darf keine E-Mail Adresse sein.",
    usernameRequired: "Benutzername benötigt.",
    accounts: {
      "Email already exists.": "Die E-Mail Adresse wird bereits verwendet.",
      "Email doesn't match the criteria.": "E-Mail Adresse erfüllt die Anforderungen nicht.",
      "Invalid login token": "Ungültiger Login-Token",
      "Login forbidden": "Anmeldedaten ungültig",
      "Service unknown": "Dienst unbekannt",
      "Unrecognized options for login request": "Unbekannte Optionen für Login Request",
      "User validation failed": "Die Benutzerdaten sind nicht korrekt",
      "Username already exists.": "Der Benutzer existiert bereits.",
      "You are not logged in.": "Eine Anmeldung ist erforderlich.",
      "You've been logged out by the server. Please log in again.": "Die Sitzung ist abgelaufen, eine neue Anmeldung ist nötig.",
      "Your session has expired. Please log in again.": "Die Sitzung ist abgelaufen, eine neue Anmeldung ist nötig.",
      "No matching login attempt found": "Kein passender Loginversuch gefunden.",
      "Password is old. Please reset your password.": "Das Passwort ist abgelaufen, ein Zurücksetzen ist erforderlich.",
      "Incorrect password": "Falsches Passwort",
      "Invalid email": "Ungültige E-Mail Adresse",
      "Must be logged in": "Eine Anmeldung ist erforderlich",
      "Need to set a username or email": "Benutzername oder E-Mail Adresse müssen angegeben werden",
      "Password may not be empty": "Das Passwort darf nicht leer sein",
      "Signups forbidden": "Anmeldungen sind nicht erlaubt",
      "Token expired": "Token ist abgelaufen",
      "Token has invalid email address": "E-Mail Adresse passt nicht zum Token",
      "User has no password set": "Kein Passwort für den Benutzer angegeben",
      "User not found": "Benutzer nicht gefunden",
      "Verify email link expired": "Link zur E-Mail Verifizierung ist abgelaufen",
      "Verify email link is for unknown address": "Link zur Verifizierung ist für eine unbekannte E-Mail Adresse",
      "Already verified": "Diese E-Mail-Adresse ist bereits verifiziert",
      "Match failed": "Abgleich fehlgeschlagen",
      "Unknown error": "Unbekannter Fehler"
    }
  }
};

T9n.map("de", de);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/el.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var el;

el = {
  add: "προσθέστε",
  and: "και",
  back: "πίσω",
  changePassword: "Αλλαγή Κωδικού",
  choosePassword: "Επιλογή Κωδικού",
  clickAgree: "Πατώντας Εγγραφή, συμφωνείτε σε",
  configure: "Διαμόρφωση",
  createAccount: "Δημιουργία Λογαριασμού",
  currentPassword: "Τρέχων Κωδικός",
  dontHaveAnAccount: "Δεν έχετε λογαριασμό;",
  email: "Email",
  emailAddress: "Ηλεκτρονική Διεύθυνση",
  emailResetLink: "Αποστολή Συνδέσμου Επαναφοράς",
  forgotPassword: "Ξεχάσατε τον κωδικό;",
  ifYouAlreadyHaveAnAccount: "Αν έχετε ήδη λογαριασμό",
  newPassword: "Νέος Κωδικός",
  newPasswordAgain: "Νέος Κωδικός (ξανά)",
  optional: "Προαιρετικά",
  OR: "Ή",
  password: "Κωδικός",
  passwordAgain: "Κωδικός (ξανά)",
  privacyPolicy: "Πολιτική Απορρήτου",
  remove: "αφαιρέστε",
  resetYourPassword: "Επαναφορά κωδικού",
  setPassword: "Ορίστε Κωδικό",
  sign: "Σύνδεση",
  signIn: "Είσοδος",
  signin: "συνδεθείτε",
  signOut: "Αποσύνδεση",
  signUp: "Εγγραφή",
  signupCode: "Κώδικας Εγγραφής",
  signUpWithYourEmailAddress: "Εγγραφή με την ηλεκτρονική σας διεύθυνση",
  terms: "Όροι Χρήσης",
  updateYourPassword: "Ανανεώστε τον κωδικό σας",
  username: "Όνομα χρήστη",
  usernameOrEmail: "Όνομα χρήστη ή email",
  "with": "με",
  info: {
    emailSent: "Το Email στάλθηκε",
    emailVerified: "Το Email επιβεβαιώθηκε",
    passwordChanged: "Ο Κωδικός άλλαξε",
    passwordReset: "Ο Κωδικός επαναφέρθηκε"
  },
  error: {
    emailRequired: "Το Email απαιτείται.",
    minChar: "7 χαρακτήρες τουλάχιστον.",
    pwdsDontMatch: "Οι κωδικοί δεν ταιριάζουν",
    pwOneDigit: "Ο κωδικός πρέπει να έχει τουλάχιστον ένα ψηφίο.",
    pwOneLetter: "Ο κωδικός πρέπει να έχει τουλάχιστον ένα γράμμα.",
    signInRequired: "Πρέπει να είστε συνδεδεμένος για να πραγματοποιήσετε αυτή την ενέργεια.",
    signupCodeIncorrect: "Ο κώδικας εγγραφής δεν είναι σωστός.",
    signupCodeRequired: "Ο κώδικας εγγραφής απαιτείται.",
    usernameIsEmail: "Το όνομα χρήστη δεν μπορεί να είναι μια διεύθυνση email.",
    usernameRequired: "Το όνομα χρήστη απαιτείται.",
    accounts: {
      "Email already exists.": "Αυτό το email υπάρχει ήδη.",
      "Email doesn't match the criteria.": "Το email δεν ταιριάζει με τα κριτήρια.",
      "Invalid login token": "Άκυρο διακριτικό σύνδεσης",
      "Login forbidden": "Η είσοδος απαγορεύεται",
      "Service unknown": "Άγνωστη υπηρεσία",
      "Unrecognized options for login request": "Μη αναγνωρίσιμες επιλογές για αίτημα εισόδου",
      "User validation failed": "Η επικύρωση του χρήστη απέτυχε",
      "Username already exists.": "Αυτό το όνομα χρήστη υπάρχει ήδη.",
      "You are not logged in.": "Δεν είστε συνδεδεμένος.",
      "You've been logged out by the server. Please log in again.": "Αποσυνδεθήκατε από τον διακομιστή. Παρακαλούμε συνδεθείτε ξανά.",
      "Your session has expired. Please log in again.": "Η συνεδρία έληξε. Παρακαλούμε συνδεθείτε ξανά.",
      "No matching login attempt found": "Δεν βρέθηκε καμία απόπειρα σύνδεσης που να ταιριάζει",
      "Password is old. Please reset your password.": "Ο κωδικός είναι παλιός. Παρακαλούμε επαναφέρετε τον κωδικό σας.",
      "Incorrect password": "Εσφαλμένος κωδικός",
      "Invalid email": "Εσφαλμένο email",
      "Must be logged in": "Πρέπει να είστε συνδεδεμένος",
      "Need to set a username or email": "Χρειάζεται να ορίσετε όνομα χρήστη ή email",
      "old password format": "κωδικός παλιάς μορφής",
      "Password may not be empty": "Ο κωδικός δεν μπορεί να είναι άδειος",
      "Signups forbidden": "Οι εγγραφές απαγορεύονται",
      "Token expired": "Το διακριτικό σύνδεσης έληξε",
      "Token has invalid email address": "Το διακριτικό σύνδεσης έχει άκυρη διεύθυνση email",
      "User has no password set": "Ο χρήστης δεν έχει ορίσει κωδικό",
      "User not found": "Ο χρήστης δεν βρέθηκε",
      "Verify email link expired": "Ο σύνδεσμος επαλήθευσης του email έληξε",
      "Verify email link is for unknown address": "Ο σύνδεσμος επαλήθευσης του email είναι για άγνωστη διεύθυνση",
      "Match failed": "Η αντιστοίχηση απέτυχε",
      "Unknown error": "Άγνωστο σφάλμα"
    }
  }
};

T9n.map("el", el);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/en.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var en;

en = {
  t9Name: 'English',
  add: "add",
  and: "and",
  back: "back",
  cancel: "Cancel",
  changePassword: "Change Password",
  choosePassword: "Choose a Password",
  clickAgree: "By clicking Register, you agree to our",
  configure: "Configure",
  createAccount: "Create an Account",
  currentPassword: "Current Password",
  dontHaveAnAccount: "Don't have an account?",
  email: "Email",
  emailAddress: "Email Address",
  emailResetLink: "Email Reset Link",
  forgotPassword: "Forgot your password?",
  ifYouAlreadyHaveAnAccount: "If you already have an account",
  newPassword: "New Password",
  newPasswordAgain: "New Password (again)",
  optional: "Optional",
  OR: "OR",
  password: "Password",
  passwordAgain: "Password (again)",
  privacyPolicy: "Privacy Policy",
  remove: "remove",
  resetYourPassword: "Reset your password",
  setPassword: "Set Password",
  sign: "Sign",
  signIn: "Sign In",
  signin: "sign in",
  signOut: "Sign Out",
  signUp: "Register",
  signupCode: "Registration Code",
  signUpWithYourEmailAddress: "Register with your email address",
  terms: "Terms of Use",
  updateYourPassword: "Update your password",
  username: "Username",
  usernameOrEmail: "Username or email",
  "with": "with",
  maxAllowedLength: "Maximum allowed length",
  minRequiredLength: "Minimum required length",
  resendVerificationEmail: "Send email again",
  resendVerificationEmailLink_pre: "Verification email lost?",
  resendVerificationEmailLink_link: "Send again",
  enterPassword: "Enter password",
  enterNewPassword: "Enter new password",
  enterEmail: "Enter email",
  enterUsername: "Enter username",
  enterUsernameOrEmail: "Enter username or email",
  orUse: "Or use",
  info: {
    emailSent: "Email sent",
    emailVerified: "Email verified",
    passwordChanged: "Password changed",
    passwordReset: "Password reset"
  },
  alert: {
    ok: 'Ok',
    type: {
      info: 'Notice',
      error: 'Error',
      warning: 'Warning'
    }
  },
  error: {
    emailRequired: "Email is required.",
    minChar: "7 character minimum password.",
    pwdsDontMatch: "Passwords don't match",
    pwOneDigit: "Password must have at least one digit.",
    pwOneLetter: "Password requires 1 letter.",
    signInRequired: "You must be signed in to do that.",
    signupCodeIncorrect: "Registration code is incorrect.",
    signupCodeRequired: "Registration code is required.",
    usernameIsEmail: "Username cannot be an email address.",
    usernameRequired: "Username is required.",
    accounts: {
      "Email already exists.": "Email already exists.",
      "Email doesn't match the criteria.": "Email doesn't match the criteria.",
      "Invalid login token": "Invalid login token",
      "Login forbidden": "Login forbidden",
      "Service unknown": "Service unknown",
      "Unrecognized options for login request": "Unrecognized options for login request",
      "User validation failed": "User validation failed",
      "Username already exists.": "Username already exists.",
      "You are not logged in.": "You are not logged in.",
      "You've been logged out by the server. Please log in again.": "You've been logged out by the server. Please log in again.",
      "Your session has expired. Please log in again.": "Your session has expired. Please log in again.",
      "Already verified": "Already verified",
      "Invalid email or username": "Invalid email or username",
      "Internal server error": "Internal server error",
      "undefined": "Something went wrong",
      "No matching login attempt found": "No matching login attempt found",
      "Password is old. Please reset your password.": "Password is old. Please reset your password.",
      "Incorrect password": "Incorrect password",
      "Invalid email": "Invalid email",
      "Must be logged in": "Must be logged in",
      "Need to set a username or email": "Need to set a username or email",
      "old password format": "old password format",
      "Password may not be empty": "Password may not be empty",
      "Signups forbidden": "Signups forbidden",
      "Token expired": "Token expired",
      "Token has invalid email address": "Token has invalid email address",
      "User has no password set": "User has no password set",
      "User not found": "User not found",
      "Verify email link expired": "Verify email link expired",
      "Verify email link is for unknown address": "Verify email link is for unknown address",
      "At least 1 digit, 1 lowercase and 1 uppercase": "At least 1 digit, 1 lowercase and 1 uppercase",
      "Please verify your email first. Check the email and follow the link!": "Please verify your email first. Check the email and follow the link!",
      "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.": "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.",
      "Match failed": "Match failed",
      "Unknown error": "Unknown error",
      "Error, too many requests. Please slow down. You must wait 1 seconds before trying again.": "Error, too many requests. Please slow down. You must wait 1 seconds before trying again."
    }
  }
};

T9n.map("en", en);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/es.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var es;

es = {
  t9Name: 'Español',
  add: "agregar",
  and: "y",
  back: "regresar",
  cancel: "Cancelar",
  changePassword: "Cambiar contraseña",
  choosePassword: "Eligir contraseña",
  clickAgree: "Al hacer clic en Suscribir apruebas la",
  configure: "Configurar",
  createAccount: "Crear cuenta",
  currentPassword: "Contraseña actual",
  dontHaveAnAccount: "¿No tienes una cuenta?",
  email: "Correo electrónico",
  emailAddress: "Dirección de correo electrónico",
  emailResetLink: "Resetear correo electrónico",
  forgotPassword: "¿Olvidó su contraseña?",
  ifYouAlreadyHaveAnAccount: "Si ya tienes una cuenta",
  newPassword: "Nueva contraseña",
  newPasswordAgain: "Nueva contraseña (repetir)",
  optional: "Opcional",
  OR: "O",
  password: "Contraseña",
  passwordAgain: "Contraseña (repetir)",
  privacyPolicy: "Póliza de Privacidad",
  remove: "remover",
  resetYourPassword: "Resetear contraseña",
  setPassword: "Eligir contraseña",
  sign: "Ingresar",
  signIn: "Entrar",
  signin: "entrar",
  signOut: "Salir",
  signUp: "Registrarse",
  signupCode: "Código de registro",
  signUpWithYourEmailAddress: "Registrate con tu dirección de correo electrónico",
  terms: "Términos de uso",
  updateYourPassword: "Actualizar contraseña",
  username: "Usuario",
  usernameOrEmail: "Usuario o correo electrónico",
  "with": "con",
  maxAllowedLength: "Longitud máxima permitida",
  minRequiredLength: "Longitud máxima requerida",
  resendVerificationEmail: "Mandar correo electrónico de nuevo",
  resendVerificationEmailLink_pre: "¿Perdiste tu correo de verificación?",
  resendVerificationEmailLink_link: "Volver a mandar",
  enterPassword: "Introducir contraseña",
  enterNewPassword: "Introducir contraseña nueva",
  enterEmail: "Introducir dirección de correo electrónico",
  enterUsername: "Introducir nombre de usuario",
  enterUsernameOrEmail: "Introducir nombre de usuario o dirección de correos",
  orUse: "O usar",
  info: {
    emailSent: "Correo enviado",
    emailVerified: "Dirección de correos verificada",
    passwordChanged: "Contraseña cambiada",
    passwordReset: "Resetear contraseña"
  },
  alert: {
    ok: 'Ok',
    type: {
      info: 'Aviso',
      error: 'Error',
      warning: 'Advertencia'
    }
  },
  error: {
    emailRequired: "Tu dirección de correos es requerida.",
    minChar: "7 caracteres mínimo.",
    pwdsDontMatch: "Las contraseñas no coinciden",
    pwOneDigit: "mínimo un dígito.",
    pwOneLetter: "mínimo una letra.",
    signInRequired: "Debes iniciar sesión para hacer eso.",
    signupCodeIncorrect: "El código de registro no coincide.",
    signupCodeRequired: "Se requiere el código de registro.",
    usernameIsEmail: "El nombre de usuario no puede ser una dirección de correos.",
    usernameRequired: "Se requiere un nombre de usuario.",
    accounts: {
      "Email already exists.": "La dirección de correo elecrónico ya existe.",
      "Email doesn't match the criteria.": "La dirección de correo electrónico no coincide con los criterios.",
      "Invalid login token": "Token de inicio de sesión inválido",
      "Login forbidden": "Inicio de sesión prohibido",
      "Service unknown": "Servicio desconocido",
      "Unrecognized options for login request": "Opciones desconocidas para solicitud de inicio de sesión",
      "User validation failed": "No se ha podido validar el usuario",
      "Username already exists.": "El usuario ya existe.",
      "You are not logged in.": "No estás autenticado.",
      "You've been logged out by the server. Please log in again.": "Has sido desconectado por el servidor. Por favor ingresa de nuevo.",
      "Your session has expired. Please log in again.": "Tu sesión ha expirado. Por favor ingresa de nuevo.",
      "Already verified": "Ya ha sido verificada",
      "Invalid email or username": "Dirección de correo o nombre de usuario no validos",
      "Internal server error": "Error interno del servidor",
      "undefined": "Algo ha ido mal",
      "No matching login attempt found": "No se encontró ningún intento de inicio de sesión coincidente",
      "Password is old. Please reset your password.": "Contraseña es vieja. Por favor resetea tu contraseña.",
      "Incorrect password": "Contraseña incorrecta.",
      "Invalid email": "Correo electrónico inválido",
      "Must be logged in": "Debes estar conectado",
      "Need to set a username or email": "Debes especificar un usuario o dirección de correo electrónico",
      "old password format": "formato viejo de contraseña",
      "Password may not be empty": "Contraseña no debe quedar vacía",
      "Signups forbidden": "Registro prohibido",
      "Token expired": "Token expirado",
      "Token has invalid email address": "Token contiene un correo electrónico inválido",
      "User has no password set": "Usuario no tiene contraseña",
      "User not found": "Usuario no encontrado",
      "Verify email link expired": "El enlace para verificar la dirección de correo ha expirado",
      "Verify email link is for unknown address": "El enlace para verificar el correo electrónico contiene una dirección desconocida",
      "At least 1 digit, 1 lowercase and 1 uppercase": "Al menos debe contener un número, una minúscula y una mayúscula",
      "Please verify your email first. Check the email and follow the link!": "Por favor comprueba tu dirección de correo primero. Sigue el link que te ha sido enviado.",
      "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.": "Un nuevo correo te ha sido enviado. Si no ves el correo en tu bandeja comprueba tu carpeta de spam.",
      "Match failed": "No se encontró pareja coincidente",
      "Unknown error": "Error desconocido",
      "Error, too many requests. Please slow down. You must wait 1 seconds before trying again.": "Error, demasiadas peticiones. Por favor ve más lento. Debes esperar al menos un segundo antes de probar otra vez."
    }
  }
};

T9n.map("es", es);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/et.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var et;

et = {
  t9Name: 'Estonian',
  add: "lisa",
  and: "ja",
  back: "tagasi",
  cancel: "Katkesta",
  changePassword: "Muuda salasõna",
  choosePassword: "Vali salasõna",
  clickAgree: "Vajutades nupule Registreeru, nõustud meie",
  configure: "Seadista",
  createAccount: "Loo konto",
  currentPassword: "Praegune salasõna",
  dontHaveAnAccount: "Sul ei ole kontot?",
  email: "E-post",
  emailAddress: "E-posti aadress",
  emailResetLink: "Saada lähestamise link",
  forgotPassword: "Unustasid salasõna?",
  ifYouAlreadyHaveAnAccount: "Kui Sul juba on konto",
  newPassword: "Uus salasõna",
  newPasswordAgain: "Uus salasõna (uuesti)",
  optional: "Valikuline",
  OR: "või",
  password: "salasõna",
  passwordAgain: "Salasõna (uuesti)",
  privacyPolicy: "Privaatsuspoliitika",
  remove: "eemalda",
  resetYourPassword: "Lähesta oma salasõna",
  setPassword: "Seadista salasõna",
  sign: "Logi",
  signIn: "Logi sisse ",
  signin: "logi sisse",
  signOut: "Logi välja",
  signUp: "Registreeru",
  signupCode: "Registreerumiskood",
  signUpWithYourEmailAddress: "Registreeru oma e-posti aadressiga",
  terms: "Kasutustingimused",
  updateYourPassword: "Uuenda oma salasõna",
  username: "Kasutajanimi",
  usernameOrEmail: "Kasutaja või e-post",
  "with": "koos",
  maxAllowedLength: "Suurim lubatud pikkus",
  minRequiredLength: "Väikseim lubatud pikkus",
  resendVerificationEmail: "Saada e-kiri uuesti",
  resendVerificationEmailLink_pre: "Kinnitus e-kiri on kadunud?",
  resendVerificationEmailLink_link: "Saada uuesti",
  enterPassword: "Sisesta salasõna",
  enterNewPassword: "Sisesta uus salasõna",
  enterEmail: "Sisesta e-posti aadress",
  enterUsername: "Sisesta kasutajanimi",
  enterUsernameOrEmail: "Sisesta kasutajanimi või e-posti aadress",
  orUse: "Või kasuta",
  info: {
    emailSent: "E-kiri saadetud",
    emailVerified: "E-posti aadress kinnitatud",
    passwordChanged: "Salasõna muudetud",
    passwordReset: "Salasõna lähestatud"
  },
  alert: {
    ok: 'OK',
    type: {
      info: 'Teate',
      error: 'Viga',
      warning: 'Hoiatus'
    }
  },
  error: {
    emailRequired: "E-post aadress on kohustuslik.",
    minChar: "Salasõna peab olema vähemalt 7 märgi pikkune.",
    pwdsDontMatch: "Salasõnad ei vasta",
    pwOneDigit: "Salasõna peab sisaldama vähemalt ühte numbrit.",
    pwOneLetter: "Salasõna peab sisaldama vähemalt ühte tähte.",
    signInRequired: "Selle jaoks pead olema sisse logitud.",
    signupCodeIncorrect: "Registreerimiskood on vale.",
    signupCodeRequired: "Registreerimiskood on kohustuslik.",
    usernameIsEmail: "Kasutajanimi ei saa olla e-posti aadress.",
    usernameRequired: "Kasutajanimi on kohustuslik.",
    accounts: {
      "Email already exists.": "See e-posti aadress on juba registreeritud.",
      "Email doesn't match the criteria.": "E-posti aadress ei vasta nõuetele.",
      "Invalid login token": "Vigane sisselogimise žetoon",
      "Login forbidden": "Sisse logimine keelatud",
      "Service unknown": "Tundmatu teenus",
      "Unrecognized options for login request": "Tundmatud seaded sisselogimise palves",
      "User validation failed": "Kasutaja kinnitamine ei õnnestunud",
      "Username already exists.": "See kasutajanimi on juba registreeritud.",
      "You are not logged in.": "Sa ei ole sisse logitud.",
      "You've been logged out by the server. Please log in again.": "Sa oled serveri poolt välja logitud. Palun logi uuesti sisse.",
      "Your session has expired. Please log in again.": "Sinu sessioon on aegunud. Palun logi uuesti sisse.",
      "Already verified": "Juba kinnitatud",
      "Invalid email or username": "Vale e-posti aadress või kasutajanimi",
      "Internal server error": "Sisemine serveri viga",
      "undefined": "Midagi läks valesti",
      "No matching login attempt found": "Sobivat logimisproovi ei leitud",
      "Password is old. Please reset your password.": "Salasõna on vana. Palun lähesta oma salasõna.",
      "Incorrect password": "Vale salasõna",
      "Invalid email": "Vale e-posti aadress",
      "Must be logged in": "Pead olema sisse logitud",
      "Need to set a username or email": "Vaja on seadistada kasutajanimi või e-post",
      "old password format": "vana salasõna formaat",
      "Password may not be empty": "Salasõna ei või olla tühi",
      "Signups forbidden": "Registreerumine on suletud",
      "Token expired": "Aegunud žetoon",
      "Token has invalid email address": "Žetoon on seotud vale e-posti aadressiga",
      "User has no password set": "Kasutajal on salasõna seadmata",
      "User not found": "Sellist kasutajat ei leitud",
      "Verify email link expired": "Kinnitus e-kirja viide on aegunud",
      "Verify email link is for unknown address": "Kinnitus e-kirja viide on tundmatule aadressile",
      "At least 1 digit, 1 lowercase and 1 uppercase": "Vähemalt 1 number, 1 väike täht ja 1 suur täht",
      "Please verify your email first. Check the email and follow the link!": "Palun kinnita oma e-posti aadress. E-kirjas vajuta viitele!",
      "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.": "Sulle on saadetud uus e-kiri. Kui sa kirja ei näe, vaata palun rämpsposti kausta.",
      "Match failed": "Ei sobi",
      "Unknown error": "Teadmata viga",
      "Error, too many requests. Please slow down. You must wait 1 seconds before trying again.": "Viga, liiga palju proovimisi. Palun võta aeg maha. Pead ootama vähemalt 1 sekundi, enne kui uuesti proovid."
    }
  }
};

T9n.map("et", et);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/es_ES.coffee.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var es_ES;

es_ES = {
  t9Name: 'Español-España',
  add: "agregar",
  and: "y",
  back: "regresar",
  cancel: "Cancelar",
  changePassword: "Cambiar Contraseña",
  choosePassword: "Eligir Contraseña",
  clickAgree: "Si haces clic en Crear Cuenta estás de acuerdo con la",
  configure: "Configurar",
  createAccount: "Crear cuenta",
  currentPassword: "Contraseña actual",
  dontHaveAnAccount: "¿No estás registrado?",
  email: "Correo electrónico",
  emailAddress: "Correo electrónico",
  emailResetLink: "Restaurar dirección de correo electrónico",
  forgotPassword: "¿Has olvidado tu contraseña?",
  ifYouAlreadyHaveAnAccount: "Si ya tienes una cuenta, ",
  newPassword: "Nueva Contraseña",
  newPasswordAgain: "Nueva Contraseña (repetición)",
  optional: "Opcional",
  OR: "O",
  password: "Contraseña",
  passwordAgain: "Contraseña (repetición)",
  privacyPolicy: "Póliza de Privacidad",
  remove: "remover",
  resetYourPassword: "Recuperar contraseña",
  setPassword: "Definir Contraseña",
  sign: "Entrar",
  signIn: "Entrar",
  signin: "entra",
  signOut: "Salir",
  signUp: "Regístrate",
  signupCode: "Código para registrarte",
  signUpWithYourEmailAddress: "Regístrate con tu correo electrónico",
  terms: "Términos de Uso",
  updateYourPassword: "Actualizar tu contraseña",
  username: "Usuario",
  usernameOrEmail: "Usuario o correo electrónico",
  "with": "con",
  maxAllowedLength: "Longitud máxima permitida",
  minRequiredLength: "Longitud máxima requerida",
  resendVerificationEmail: "Mandar correo de nuevo",
  resendVerificationEmailLink_pre: "Correo de verificación perdido?",
  resendVerificationEmailLink_link: "Volver a mandar",
  enterPassword: "Introducir contraseña",
  enterNewPassword: "Introducir contraseña nueva",
  enterEmail: "Introducir correo electrónico",
  enterUsername: "Introducir nombre de usuario",
  enterUsernameOrEmail: "Introducir nombre de usuario o correo electrónico",
  orUse: "O puedes usar",
  info: {
    emailSent: "Mensaje enviado",
    emailVerified: "Dirección de correo verificada",
    passwordChanged: "Contraseña cambiada",
    passwordReset: "Resetar Contraseña"
  },
  alert: {
    ok: 'Ok',
    type: {
      info: 'Aviso',
      error: 'Error',
      warning: 'Advertencia'
    }
  },
  error: {
    emailRequired: "La dirección de correo electrónico es necesaria.",
    minChar: "7 carácteres mínimo.",
    pwdsDontMatch: "Contraseñas no coinciden",
    pwOneDigit: "mínimo un dígito.",
    pwOneLetter: "mínimo una letra.",
    signInRequired: "Debes iniciar sesión para esta opción.",
    signupCodeIncorrect: "Código de registro inválido.",
    signupCodeRequired: "Se requiere un código de registro.",
    usernameIsEmail: "El usuario no puede ser una dirección de correo.",
    usernameRequired: "Se requiere nombre de usuario.",
    accounts: {
      "Email already exists.": "El correo ya existe.",
      "Email doesn't match the criteria.": "El correo no coincide.",
      "Invalid login token": "Token de inicio de sesión inválido",
      "Login forbidden": "Inicio de sesión prohibido",
      "Service unknown": "Servicio desconocido",
      "Unrecognized options for login request": "Opciones desconocidas para solicitud de inicio de sesión",
      "User validation failed": "No se ha podido validar el usuario",
      "Username already exists.": "El usuario ya existe.",
      "You are not logged in.": "No estás conectado.",
      "You've been logged out by the server. Please log in again.": "Has sido desconectado por el servidor. Por favor inicia sesión de nuevo.",
      "Your session has expired. Please log in again.": "Tu sesión ha expirado. Por favor inicia sesión de nuevo.",
      "Already verified": "Ya ha sido verificada",
      "Invalid email or username": "Dirección electrónica o nombre de usuario no validos",
      "Internal server error": "Error interno del servidor",
      "undefined": "Algo ha ido mal",
      "No matching login attempt found": "Ningún intento de inicio de sesión coincidente se encontró",
      "Password is old. Please reset your password.": "Contraseña es vieja. Por favor, resetea la contraseña.",
      "Incorrect password": "Contraseña inválida.",
      "Invalid email": "Correo electrónico inválido",
      "Must be logged in": "Debes ingresar",
      "Need to set a username or email": "Tienes que especificar un usuario o una dirección de correo",
      "old password format": "formato viejo de contraseña",
      "Password may not be empty": "Contraseña no debe quedar vacía",
      "Signups forbidden": "Registro prohibido",
      "Token expired": "Token expirado",
      "Token has invalid email address": "Token contiene una dirección electrónica inválido",
      "User has no password set": "Usuario no tiene contraseña",
      "User not found": "Usuario no encontrado",
      "Verify email link expired": "El enlace para verificar el correo electrónico ha expirado",
      "Verify email link is for unknown address": "El enlace para verificar el correo electrónico contiene una dirección desconocida",
      "At least 1 digit, 1 lowercase and 1 uppercase": "Al menos tiene que contener un número, una minúscula y una mayúscula",
      "Please verify your email first. Check the email and follow the link!": "Por favor comprueba tu correo electrónico primero. Sigue el link que te ha sido enviado.",
      "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.": "Un nuevo correo te ha sido enviado. Si no ves el correo en tu bandeja comprueba tu carpeta de spam.",
      "Match failed": "No ha habido ninguna coincidencia",
      "Unknown error": "Error desconocido",
      "Error, too many requests. Please slow down. You must wait 1 seconds before trying again.": "Error, demasiadas peticiones. Por favor no vayas tan rapido. Tienes que esperar al menos un segundo antes de probar otra vez."
    }
  }
};

T9n.map("es_ES", es_ES);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/fa.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var fa;

fa = {
  add: "افزودن",
  and: "و",
  back: "برگشت",
  changePassword: "تعویض گذرواژه",
  choosePassword: "انتخاب یک گذرواژه",
  clickAgree: "با انتخاب ثبت‌نام، شما موافق هستید با",
  configure: "پیکربندی",
  createAccount: "ایجاد یک حساب",
  currentPassword: "گذرواژه کنونی",
  dontHaveAnAccount: "یک حساب ندارید؟",
  email: "رایانامه",
  emailAddress: "آدرس رایانامه",
  emailResetLink: "پیوند بازنشانی رایانامه",
  forgotPassword: "گذرواژه‌تان را فراموش کرده‌اید؟",
  ifYouAlreadyHaveAnAccount: "اگر هم‌اکنون یک حساب دارید",
  newPassword: "گذرواژه جدید",
  newPasswordAgain: "گذرواژه جدید (تکرار)",
  optional: "اختيارى",
  OR: "یا",
  password: "گذرواژه",
  passwordAgain: "گذرواژه (دوباره)",
  privacyPolicy: "حریم خصوصی",
  remove: "حذف",
  resetYourPassword: "بازنشانی گذرواژه شما",
  setPassword: "تنظیم گذرواژه",
  sign: "نشان",
  signIn: "ورود",
  signin: "ورود",
  signOut: "خروج",
  signUp: "ثبت‌نام",
  signupCode: "کد ثبت‌نام",
  signUpWithYourEmailAddress: "با آدرس رایانامه‌تان ثبت‌نام کنید",
  terms: "قوانین استفاده",
  updateYourPassword: "گذرواژه‌تان را به روز کنید",
  username: "نام کاربری",
  usernameOrEmail: "نام کاربری یا رایانامه",
  "with": "با",
  info: {
    emailSent: "رایانامه ارسال شد",
    emailVerified: "رایانامه تایید شد",
    passwordChanged: "گذرواژه تغییر کرد",
    passwordReset: "گذرواژه بازنشانی شد"
  },
  error: {
    emailRequired: "رایانامه ضروری است.",
    minChar: "گذرواژه حداقل ۷ کاراکتر.",
    pwdsDontMatch: "گذرواژه‌ها تطابق ندارند",
    pwOneDigit: "گذرواژه باید لااقل یک رقم داشته باشد.",
    pwOneLetter: "گذرواژه یک حرف نیاز دارد.",
    signInRequired: "برای انجام آن باید وارد شوید.",
    signupCodeIncorrect: "کد ثبت‌نام نادرست است.",
    signupCodeRequired: "کد ثبت‌نام ضروری است.",
    usernameIsEmail: "نام کاربری نمی‌توان آدرس رایانامه باشد.",
    usernameRequired: "نام کاربری ضروری است.",
    accounts: {
      "Email already exists.": "رایانامه هم‌اکنون وجود دارد.",
      "Email doesn't match the criteria.": "رایانامه با ضوابط تطابق ندارد.",
      "Invalid login token": "علامت ورود نامعتبر است",
      "Login forbidden": "ورود ممنوع است",
      "Service unknown": "سرویس ناشناس",
      "Unrecognized options for login request": "گزینه‌های نامشخص برای درخواست ورود",
      "User validation failed": "اعتبارسنجی کاربر ناموفق",
      "Username already exists.": "نام کاربری هم‌اکنون وجود دارد.",
      "You are not logged in.": "شما وارد نشده‌اید.",
      "You've been logged out by the server. Please log in again.": "شما توسط سرور خارج شده‌اید. لطفأ دوباره وارد شوید.",
      "Your session has expired. Please log in again.": "جلسه شما منقضی شده است. لطفا دوباره وارد شوید.",
      "No matching login attempt found": "تلاش ورود مطابق یافت نشد",
      "Password is old. Please reset your password.": "گذرواژه قدیمی است. لطفأ گذرواژه‌تان را بازتنظیم کنید.",
      "Incorrect password": "گذرواژه نادرست",
      "Invalid email": "رایانامه نامعتبر",
      "Must be logged in": "باید وارد شوید",
      "Need to set a username or email": "یک نام کاربری یا ایمیل باید تنظیم شود",
      "old password format": "قالب گذرواژه قدیمی",
      "Password may not be empty": "گذرواژه نمی‌تواند خالی باشد",
      "Signups forbidden": "ثبت‌نام ممنوع",
      "Token expired": "علامت رمز منقظی شده است",
      "Token has invalid email address": "علامت رمز دارای آدرس رایانامه نامعتبر است",
      "User has no password set": "کاربر گذرواژه‌ای تنظیم نکرده است",
      "User not found": "کاربر یافت نشد",
      "Verify email link expired": "پیوند تایید رایانامه منقضی شده است",
      "Verify email link is for unknown address": "پیوند تایید رایانامه برای آدرس ناشناخته است",
      "Match failed": "تطابق ناموفق",
      "Unknown error": "خطای ناشناخته"
    }
  }
};

T9n.map("fa", fa);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/fi.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var fi;

fi = {
  t9Name: 'Finnish',
  add: "lisää",
  and: "ja",
  back: "takaisin",
  cancel: "Peruuta",
  changePassword: "Vaihda salasana",
  choosePassword: "Valitse salasana",
  clickAgree: "Klikkaamalla Rekisteröidy, hyväksyt meidän",
  configure: "Asetukset",
  createAccount: "Luo tili",
  currentPassword: "Nykyinen salasana",
  dontHaveAnAccount: "Eikö sinulla ole tiliä?",
  email: "Sähköposti",
  emailAddress: "Sähköpostiosoite",
  emailResetLink: "Lähetä salasanan palautuslinkki sähköpostissa",
  forgotPassword: "Unohditko salasanasi?",
  ifYouAlreadyHaveAnAccount: "Jos sinulla on jo tili",
  newPassword: "Uusi salasana",
  newPasswordAgain: "Uusi salasana (uudelleen)",
  optional: "Valinnainen",
  OR: "TAI",
  password: "Salasana",
  passwordAgain: "Salasana (uudelleen)",
  privacyPolicy: "Tietosuojakäytäntö",
  remove: "poista",
  resetYourPassword: "Nollaa salasanasi",
  setPassword: "Aseta salasana",
  sign: "Kirjaudu",
  signIn: "Kirjaudu sisään",
  signin: "kirjaudu sisään",
  signOut: "Kirjaudu ulos",
  signUp: "Rekisteröidy",
  signupCode: "Rekisteröinti koodi",
  signUpWithYourEmailAddress: "Rekisteröidy sähköpostiosoitteellasi",
  terms: "Käyttöehdot",
  updateYourPassword: "Päivitä salasanasi",
  username: "Käyttäjätunnus",
  usernameOrEmail: "Käyttäjätunnus tai sähköposti",
  "with": "kanssa",
  maxAllowedLength: "Maksimi sallittu pituus",
  minRequiredLength: "Minimi sallittu pituus",
  resendVerificationEmail: "Lähetä sähköposti uudelleen",
  resendVerificationEmailLink_pre: "Varmistus sähköposti kadonnut?",
  resendVerificationEmailLink_link: "Lähetä uudelleen",
  enterPassword: "Kirjoita salasana",
  enterNewPassword: "Kirjoita uusi salasana",
  enterEmail: "Kirjoita sähköposti",
  enterUsername: "Kirjoita käyttäjätunnus",
  enterUsernameOrEmail: "Kirjoita käyttäjätunnus tai sähköposti",
  orUse: "Tai käytä",
  info: {
    emailSent: "Sähköposti lähetetty",
    emailVerified: "Sähköposti varmistettu",
    passwordChanged: "Salasana vaihdettu",
    passwordReset: "Salasana nollattu"
  },
  alert: {
    ok: 'Ok',
    type: {
      info: 'Huomio',
      error: 'Virhe',
      warning: 'Varoitus'
    }
  },
  error: {
    emailRequired: "Sähköposti vaaditaan.",
    minChar: "7 merkkiä minimi salasana.",
    pwdsDontMatch: "Salasanat eivät täsmää",
    pwOneDigit: "Salasanassa tulee olla vähintään yksi numero.",
    pwOneLetter: "Salasana vaatii 1 kirjaimen.",
    signInRequired: "Sinun täytyy olla kirjautuneena sisään tehdäksesi tuon.",
    signupCodeIncorrect: "Rekisteröinti koodi on virheellinen.",
    signupCodeRequired: "Rekisteröinti koodi vaaditaan.",
    usernameIsEmail: "Käyttäjätunnus ei voi olla sähköpostiosoite.",
    usernameRequired: "Käyttäjätunnus vaaditaan.",
    accounts: {
      "Email already exists.": "Sähköposti on jo olemassa.",
      "Email doesn't match the criteria.": "Sähköposti ei täytä kriteeriä.",
      "Invalid login token": "Virheellinen kirjautumis token",
      "Login forbidden": "Kirjautuminen kielletty",
      "Service unknown": "Tuntematon palvelu",
      "Unrecognized options for login request": "Tunnistamattomat valinnat kirjautumispyynnössä",
      "User validation failed": "Käyttäjän varmistus epäonnistui",
      "Username already exists.": "Käyttäjänimi on jo olemassa.",
      "You are not logged in.": "Et ole kirjautuneena sisään.",
      "You've been logged out by the server. Please log in again.": "Palvelin on kirjannut sinut ulos. Ole hyvä ja kirjaudu uudelleen.",
      "Your session has expired. Please log in again.": "Istuntosi on vanhentunut. Ole hyvä ja kirjaudu uudelleen.",
      "Already verified": "On jo varmistettu",
      "Invalid email or username": "Virheellinen sähköposti tai käyttäjätunnus",
      "Internal server error": "Sisäinen palvelinvirhe",
      "undefined": "Jotain meni väärin",
      "No matching login attempt found": "Ei löytynyt täsmäävää kirjautumisyritystä",
      "Password is old. Please reset your password.": "Salasana on vanha. Ole hyvä ja nollaa salasanasi.",
      "Incorrect password": "Virheellinen salasana",
      "Invalid email": "Virheellinen sähköposti",
      "Must be logged in": "Täytyy olla kirjautuneena sisään",
      "Need to set a username or email": "Tarvitsee määrittää käyttäjätunnus tai sähköposti",
      "old password format": "vanha salasana muoto",
      "Password may not be empty": "Salasana ei voi olla tyhjä",
      "Signups forbidden": "Rekisteröityminen kielletty",
      "Token expired": "Token vanhentui",
      "Token has invalid email address": "Token sisältää virheellisen sähköpostiosoitteen",
      "User has no password set": "Käyttäjälle ei ole salasanaa määritettynä",
      "User not found": "Käyttäjää ei löyty",
      "Verify email link expired": "Varmistus sähköposti linkki on vanhentunut",
      "Verify email link is for unknown address": "Varmistus sähköposti linkki on tuntemattomalle osoitteelle",
      "At least 1 digit, 1 lowercase and 1 uppercase": "Ainakin 1 numero, 1 pieni ja 1 iso kirjain",
      "Please verify your email first. Check the email and follow the link!": "Ole hyvä ja varmista sähköpostisi ensin. Tarkista sähköpostisi ja seuraa linkkiä!",
      "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.": "Uusi sähköposti on lähetetty sinulle. Jos sähköposti ei näy saapuneissa, tarkista roskaposti kansio.",
      "Match failed": "Eivät täsmää",
      "Unknown error": "Tuntematon virhe",
      "Error, too many requests. Please slow down. You must wait 1 seconds before trying again.": "Virhe, liian monta pyyntöä. Ole hyvä ja hidasta. Sinun täytyy odottaa 1 sekunti ennenkuin yrität uudelleen."
    }
  }
};

T9n.map("fi", fi);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/fr.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var fr;

fr = {
  t9Name: 'Français',
  add: "Ajouter",
  and: "et",
  back: "retour",
  changePassword: "Modifier le mot de passe",
  choosePassword: "Choisir le mot de passe",
  clickAgree: "En cliquant sur « S'enregistrer », vous acceptez nos",
  configure: "Configurer",
  createAccount: "Créer un compte",
  currentPassword: "Mot de passe actuel",
  dontHaveAnAccount: "Vous n'avez pas de compte ?",
  email: "E-mail",
  emailAddress: "Adresse e-mail",
  emailResetLink: "Envoyer l'e-mail de réinitialisation",
  forgotPassword: "Mot de passe oublié ?",
  ifYouAlreadyHaveAnAccount: "Si vous avez déjà un compte",
  newPassword: "Nouveau mot de passe",
  newPasswordAgain: "Confirmer le nouveau mot de passe",
  optional: "Facultatif",
  OR: "OU",
  password: "Mot de passe",
  passwordAgain: "Confirmer le mot de passe",
  privacyPolicy: "Politique de confidentialité",
  remove: "Supprimer",
  resetYourPassword: "Reinitialiser votre mot de passe",
  setPassword: "Renseigner le mot de passe",
  sign: "S'enregistrer",
  signIn: "Se connecter",
  signin: "se connecter",
  signOut: "Se déconnecter",
  signUp: "S'enregistrer",
  signupCode: "Code d'inscription",
  signUpWithYourEmailAddress: "S'enregistrer avec votre adresse e-mail",
  terms: "Conditions d'utilisation",
  updateYourPassword: "Mettre à jour le mot de passe",
  username: "Nom d'utilisateur",
  usernameOrEmail: "Nom d'utilisateur ou adresse e-mail",
  "with": "avec",
  "Verification email lost?": "Vous n'avez pas reçu votre email de vérification?",
  "Send again": "Recevoir un nouvel email",
  "Send the verification email again": "Recevoir un nouvel email de vérification",
  "Send email again": "Renvoyer un email",
  "Minimum required length: 6": "Veuillez entrer au moins 6 caractères",
  "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.": "Un nouvel email vient de vous être envoyé. Si vous ne le trouvez pas dans votre boite de réception, vérifiez dans vos spams.",
  "Required Field": "Ce champ est obligatoire",
  "Successful Registration! Please check your email and follow the instructions.": "Votre compte est enregistré. Vous allez recevoir un email contenant les instructions pour valider votre compte",
  info: {
    emailSent: "E-mail envoyé",
    emailVerified: "Adresse e-mail verifiée",
    passwordChanged: "Mot de passe modifié",
    passwordReset: "Mot de passe réinitialisé",
    emailSent: "L'email est envoyé",
    emailVerified: "L'email est vérifié",
    passwordChanged: "Le mot de passe a été modifié",
    passwordReset: "Le mot de passe a été mis à jour"
  },
  error: {
    emailRequired: "Une adresse e-mail est requise.",
    minChar: "Votre mot de passe doit contenir au moins 7 caractères.",
    pwdsDontMatch: "Les mots de passe ne correspondent pas",
    pwOneDigit: "Votre mot de passe doit contenir au moins un chiffre.",
    pwOneLetter: "Votre mot de passe doit contenir au moins une lettre.",
    signInRequired: "Vous devez être connecté pour continuer.",
    signupCodeIncorrect: "Le code d'enregistrement est incorrect.",
    signupCodeRequired: "Un code d'inscription est requis.",
    usernameIsEmail: "Le nom d'utilisateur ne peut être le même que l'adresse email.",
    usernameRequired: "Un nom d'utilisateur est requis.",
    accounts: {
      "Email already exists.": "Adresse e-mail déjà utilisée.",
      "Email doesn't match the criteria.": "L'adresse e-mail ne correspond pas aux critères.",
      "Invalid login token": "Jeton d'authentification invalide",
      "Login forbidden": "Votre identifiant ou votre mot de passe est incorrect",
      "Service unknown": "Service inconnu",
      "Unrecognized options for login request": "Options inconnues pour la requête d'authentification",
      "User validation failed": "Échec de la validation de l'utilisateur",
      "Username already exists.": "Nom d'utilisateur déjà utilisé.",
      "You are not logged in.": "Vous n'êtes pas connecté.",
      "You've been logged out by the server. Please log in again.": "Vous avez été déconnecté par le serveur. Veuillez vous reconnecter.",
      "Your session has expired. Please log in again.": "Votre session a expiré. Veuillez vous reconnecter.",
      "No matching login attempt found": "Aucune tentative d'authentification ne correspond",
      "Password is old. Please reset your password.": "Votre mot de passe est trop ancien. Veuillez le modifier.",
      "Incorrect password": "Mot de passe incorrect",
      "Invalid email": "Adresse e-mail invalide",
      "Must be logged in": "Vous devez être connecté",
      "Need to set a username or email": "Vous devez renseigner un nom d'utilisateur ou une adresse e-mail",
      "old password format": "Ancien format de mot de passe",
      "Password may not be empty": "Le mot de passe ne peut être vide",
      "Signups forbidden": "Vous ne pouvez pas créer de compte",
      "Token expired": "Jeton expiré",
      "Token has invalid email address": "Le jeton contient une adresse e-mail invalide",
      "User has no password set": "L'utilisateur n'a pas de mot de passe",
      "User not found": "Utilisateur inconnu",
      "Verify email link expired": "Lien de vérification d'e-mail expiré",
      "Please verify your email first. Check the email and follow the link!": "Votre email n'est pas validé. Merci de cliquer sur le lien que vous avez reçu",
      "Verify email link is for unknown address": "Le lien de vérification d'e-mail réfère à une adresse inconnue",
      "Match failed": "La correspondance a échoué",
      "Unknown error": "Erreur inconnue"
    }
  }
};

T9n.map("fr", fr);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/fr_CA.coffee.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var fr_CA;

fr_CA = {
  t9Name: 'Français (Canada)',
  add: "Ajouter",
  and: "et",
  back: "retour",
  changePassword: "Modifier le mot de passe",
  choosePassword: "Choisir le mot de passe",
  clickAgree: "En cliquant sur «&nbsp;S'enregistrer&nbsp;», vous acceptez nos",
  configure: "Configurer",
  createAccount: "Créer un compte",
  currentPassword: "Mot de passe actuel",
  dontHaveAnAccount: "Vous n'avez pas de compte ?",
  email: "Courriel",
  emailAddress: "Adresse courriel",
  emailResetLink: "Envoyer un courriel de réinitialisation",
  forgotPassword: "Mot de passe oublié?",
  ifYouAlreadyHaveAnAccount: "Si vous avez déjà un compte",
  newPassword: "Nouveau mot de passe",
  newPasswordAgain: "Confirmer le nouveau mot de passe",
  optional: "Facultatif",
  OR: "OU",
  password: "Mot de passe",
  passwordAgain: "Confirmer le mot de passe",
  privacyPolicy: "Politique de confidentialité",
  remove: "Supprimer",
  resetYourPassword: "Reinitialiser votre mot de passe",
  setPassword: "Saisir le mot de passe",
  sign: "S'enregistrer",
  signIn: "Ouvrir une session",
  signin: "ouvrir une session",
  signOut: "Quitter",
  signUp: "S'enregistrer",
  signupCode: "Code d'inscription",
  signUpWithYourEmailAddress: "S'enregistrer avec une adresse courriel",
  terms: "Conditions d'utilisation",
  updateYourPassword: "Mettre à jour le mot de passe",
  username: "Nom d'utilisateur",
  usernameOrEmail: "Nom d'utilisateur ou adresse courriel",
  "with": "avec",
  "Verification email lost?": "Vous n'avez pas reçu de courriel de vérification?",
  "Send again": "Envoyer à nouveau",
  "Send the verification email again": "Renvoyer le courriel de vérification",
  "Send email again": "Renvoyer le courriel",
  "Minimum required length: 6": "Veuillez saisir au moins 6 caractères",
  "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.": "Un nouveau courriel vous a été envoyé. Si vous ne le recevez pas sous peu, vérifiez votre dossier destiné aux courriels indésirables.",
  "Required Field": "Ce champ est obligatoire",
  "Successful Registration! Please check your email and follow the instructions.": "Votre compte a été créé! Vous recevrez sous peu un courriel de confirmation et la marche à suivre pour valider votre inscription.",
  info: {
    emailSent: "Courriel envoyé",
    emailVerified: "Adresse courriel verifiée",
    passwordChanged: "Mot de passe modifié",
    passwordReset: "Mot de passe réinitialisé"
  },
  error: {
    emailRequired: "Une adresse courriel est requise.",
    minChar: "Votre mot de passe doit contenir au moins 7 caractères.",
    pwdsDontMatch: "Les mots de passe saisis ne correspondent pas",
    pwOneDigit: "Votre mot de passe doit contenir au moins un chiffre.",
    pwOneLetter: "Votre mot de passe doit contenir au moins une lettre.",
    signInRequired: "Vous devez ouvrir une session pour continuer.",
    signupCodeIncorrect: "Le code d'inscription est incorrect.",
    signupCodeRequired: "Un code d'inscription est requis.",
    usernameIsEmail: "Le nom d'utilisateur ne peut être identique à l'adresse courriel.",
    usernameRequired: "Un nom d'utilisateur est requis.",
    accounts: {
      "Email already exists.": "L'adresse courriel existe déjà.",
      "Email doesn't match the criteria.": "L'adresse courriel semble incorrectement formatée.",
      "Invalid login token": "Jeton d'authentification invalide",
      "Login forbidden": "Votre identifiant ou votre mot de passe est incorrect",
      "Service unknown": "Service inconnu",
      "Unrecognized options for login request": "Options inconnues pour la requête d'authentification",
      "User validation failed": "Échec de la validation de l'utilisateur",
      "Username already exists.": "Nom d'utilisateur déjà utilisé.",
      "You are not logged in.": "Vous n'êtes pas connecté.",
      "You've been logged out by the server. Please log in again.": "Vous avez été déconnecté par le serveur. Veuillez vous reconnecter.",
      "Your session has expired. Please log in again.": "Votre session a expiré. Veuillez vous reconnecter.",
      "No matching login attempt found": "Aucune tentative d'authentification ne correspond",
      "Password is old. Please reset your password.": "Votre mot de passe est périmé. Veuillez le modifier.",
      "Incorrect password": "Mot de passe incorrect",
      "Invalid email": "Adresse courriel invalide",
      "Must be logged in": "Vous devez être connecté",
      "Need to set a username or email": "Vous devez préciser un nom d'utilisateur ou une adresse courriel",
      "old password format": "Ancien format de mot de passe",
      "Password may not be empty": "Le mot de passe ne peut être vide",
      "Signups forbidden": "Vous ne pouvez pas créer de compte",
      "Token expired": "Jeton expiré",
      "Token has invalid email address": "Le jeton contient une adresse courriel invalide",
      "User has no password set": "L'utilisateur n'a pas de mot de passe",
      "User not found": "Utilisateur inconnu",
      "Verify email link expired": "Lien de vérification de courriel expiré",
      "Please verify your email first. Check the email and follow the link!": "Votre courriel n'a pas encore été vérifié. Veuillez cliquer le lien que vous avez reçu précédemment.",
      "Verify email link is for unknown address": "Le lien de vérification de courriel réfère à une adresse inconnue",
      "Match failed": "La correspondance a échoué",
      "Unknown error": "Erreur inconnue"
    }
  }
};

T9n.map("fr_CA", fr_CA);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/he.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var he;

he = {
  add: "הוסף",
  and: "ו",
  back: "חזרה",
  changePassword: "שינוי סיסמא",
  choosePassword: "בחירת סיסמא",
  clickAgree: "על ידי לחיצה על הירשם, הינך מסכים",
  configure: "הגדרות",
  createAccount: "הוספת חשבון",
  currentPassword: "סיסמא נוכחית",
  dontHaveAnAccount: "אין לך חשבון?",
  email: "דוא\"ל",
  emailAddress: "דוא\"ל",
  emailResetLink: "שלח קישור לאיפוס סיסמא",
  forgotPassword: "שכחת סיסמא?",
  ifYouAlreadyHaveAnAccount: "אם יש לך חשבון",
  newPassword: "סיסמא חדשה",
  newPasswordAgain: "סיסמא חדשה (שוב)",
  optional: "רשות",
  OR: "או",
  password: "סיסמא",
  passwordAgain: "סיסמא (שוב)",
  privacyPolicy: "למדיניות הפרטיות",
  remove: "הסרה",
  resetYourPassword: "איפוס סיסמא",
  setPassword: "עדכון סיסמא",
  signIn: "כניסה",
  signin: "כניסה",
  signOut: "יציאה",
  signUp: "הרשמה לחשבון",
  signupCode: "קוד הרשמה",
  signUpWithYourEmailAddress: "הירשם באמצעות הדוא\"ל",
  terms: "לתנאי השימוש",
  updateYourPassword: "עדכון סיסמא",
  username: "שם משתמש",
  usernameOrEmail: "שם משתמש או דוא\"ל",
  "with": "עם",
  info: {
    emailSent: "נשלחה הודעה לדוא\"ל",
    emailVerified: "כתובת הדוא\"ל וודאה בהצלחה",
    passwordChanged: "סיסמתך שונתה בהצלחה",
    passwordReset: "סיסמתך אופסה בהצלחה"
  },
  error: {
    emailRequired: "חובה להזין כתובת דוא\"ל",
    minChar: "חובה להזין סיסמא בעלת 7 תווים לפחות.",
    pwdsDontMatch: "הסיסמאות אינן זהות.",
    pwOneDigit: "הסיסמא חייבת לכלול ספרה אחת לפחות.",
    pwOneLetter: "הסיסמא חייבת לכלול אות אחת לפחות.",
    signInRequired: "חובה להיכנס למערכת כדי לבצע פעולה זו.",
    signupCodeIncorrect: "קוד ההרשמה שגוי.",
    signupCodeRequired: "חובה להזין את קוד ההרשמה.",
    usernameIsEmail: "של המשתמש לא יכול להיות כתובת דוא\"ל.",
    usernameRequired: "חובה להזין שם משתמש.",
    accounts: {
      "Email already exists.": "הדוא\"ל כבר רשום לחשבון.",
      "Email doesn't match the criteria.": "הדוא\"ל לא מקיים את הקריטריונים.",
      "Invalid login token": "Token כניסה שגוי",
      "Login forbidden": "הכניסה נאסרה",
      "Service unknown": "Service לא ידוע",
      "Unrecognized options for login request": "נסיון הכניסה כלל אופציות לא מזוהות",
      "User validation failed": "אימות המשתמש נכשל",
      "Username already exists.": "שם המשתמש כבר קיים.",
      "You are not logged in.": "לא נכנסת לחשבון.",
      "You've been logged out by the server. Please log in again.": "השרת הוציא אותך מהמערכת. נא להיכנס לחשבונך שוב.",
      "Your session has expired. Please log in again.": "ה-session שלך פג תוקף. נא להיכנס לחשבונך שוב.",
      "No matching login attempt found": "לא נמצא נסיון כניסה מתאים",
      "Password is old. Please reset your password.": "סיסמתך ישנה. נא להחליך אותה.",
      "Incorrect password": "סיסמא שגויה",
      "Invalid email": "דוא\"ל שגוי",
      "Must be logged in": "חובה להיכנס למערכת כדי לבצע פעולה זו.",
      "Need to set a username or email": "חובה להגדיר שם משתמש או דוא\"ל",
      "old password format": "פורמט סיסמא ישן",
      "Password may not be empty": "הסיסמא לא יכולה להיות ריקה",
      "Signups forbidden": "אסור להירשם",
      "Token expired": "ה-token פג תוקף",
      "Token has invalid email address": "ה-token מכיל כתובת דוא\"ל שגוייה",
      "User has no password set": "למשתמש אין סיסמא",
      "User not found": "המשתמש לא נמצא",
      "Verify email link expired": "קישור וידוי הדוא\"ל פג תוקף",
      "Verify email link is for unknown address": "קישור וידוי הדוא\"ל הוא לכתובת לא ידועה",
      "Match failed": "ההתאמה נכשלה",
      "Unknown error": "שגיאה לא ידועה"
    }
  }
};

T9n.map("he", he);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/hr.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var hr;

hr = {
  add: "dodaj",
  and: "i",
  back: "nazad",
  changePassword: "Promjeni zaporku",
  choosePassword: "Izaberi zaporku",
  clickAgree: "Klikom na Registracija, prihvatate naše",
  configure: "Podesi",
  createAccount: "Napravite račun",
  currentPassword: "Trenutna zaporka",
  dontHaveAnAccount: "Vi nemate račun?",
  email: "Email",
  emailAddress: "Email adresa",
  emailResetLink: "Email reset link",
  forgotPassword: "Zaboravili ste zaporku?",
  ifYouAlreadyHaveAnAccount: "Ako već imate račun",
  newPassword: "Nova zaporka",
  newPasswordAgain: "Nova zaporka (ponovno)",
  optional: "neobavezno",
  OR: "ili",
  password: "Zaporka",
  passwordAgain: "Zaporka (ponovno)",
  privacyPolicy: "Izjava o privatnosti",
  remove: "ukloni",
  resetYourPassword: "Resetirajte",
  setPassword: "Postavite zaporku",
  sign: "Prijava",
  signIn: "Prijavi se",
  signin: "prijavi se",
  signOut: "Odjavi se",
  signUp: "Registracija",
  signupCode: "Registracijski kod",
  signUpWithYourEmailAddress: "Registrirajte se sa vašom email adresom",
  terms: "Uslovi korištenja",
  updateYourPassword: "Ažurirajte lozinku",
  username: "Korisničko ime",
  usernameOrEmail: "Korisničko ime ili lozinka",
  "with": "sa",
  info: {
    emailSent: "Email je poslan",
    emailVerified: "Email je verificiran",
    passwordChanged: "Zaproka promjenjena",
    passwordReset: "Zaporka resetirana"
  },
  error: {
    emailRequired: "Email je potreban.",
    minChar: "Zaporka mora sadržavati više od 7 znakova.",
    pwdsDontMatch: "Zaporke se ne poklapaju.",
    pwOneDigit: "Zaporka mora sadržavati barem jednu brojku.",
    pwOneLetter: "Zaporka mora sadržavati barem jedno slovo.",
    signInRequired: "Morate biti prijavljeni za to.",
    signupCodeIncorrect: "Registracijski kod je netočan.",
    signupCodeRequired: "Registracijski kod je potreban.",
    usernameIsEmail: "Korisničko ime ne može biti email.",
    usernameRequired: "Korisničko ime je potrebno.",
    accounts: {
      "Email already exists.": "Email već postoji.",
      "Email doesn't match the criteria.": "Email ne zadovoljava kriterij.",
      "Invalid login token": "Nevažeći  token za prijavu",
      "Login forbidden": "Prijava zabranjena",
      "Service unknown": "Servis nepoznat",
      "Unrecognized options for login request": "Neprepoznate opcije zahtjeva za prijavu",
      "User validation failed": "Provjera valjanosti za korisnika neuspješna.",
      "Username already exists.": "Korisnik već postoji.",
      "You are not logged in.": "Niste prijavljeni.",
      "You've been logged out by the server. Please log in again.": "Odjavljeni ste sa servera. Molimo Vas ponovno se prijavite.",
      "Your session has expired. Please log in again.": "Vaša sesija je istekla. Molimo prijavite se ponovno.",
      "No matching login attempt found": "Pokušaj prijave se ne podudara sa podatcima u bazi.",
      "Password is old. Please reset your password.": "Zaporka je stara. Molimo resetujte zaporku.",
      "Incorrect password": "Netočna zaporka",
      "Invalid email": "Nevažeći email",
      "Must be logged in": "Morate biti prijavljeni",
      "Need to set a username or email": "Morate postaviti korisničko ime ili email",
      "old password format": "stari format zaporke",
      "Password may not be empty": "Zaporka ne može biti prazna",
      "Signups forbidden": "Prijave zabranjenje",
      "Token expired": "Token je istekao",
      "Token has invalid email address": "Token ima nevažeću email adresu",
      "User has no password set": "Korisnik nema postavljenu zaporku",
      "User not found": "Korisnik nije pronađen",
      "Verify email link expired": "Link za verifikaciju emaila je istekao",
      "Verify email link is for unknown address": "Link za verifikaciju emaila je za nepoznatu adresu",
      "Match failed": "Usporedba neuspjela",
      "Unknown error": "Nepoznata pogreška"
    }
  }
};

T9n.map("hr", hr);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/hu.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var hu;

hu = {
  add: "hozzáadás",
  and: "és",
  back: "vissza",
  changePassword: "Jelszó megváltoztatása",
  choosePassword: "Válassz egy jelszót",
  clickAgree: "A regisztráció gombra kattintva egyetértesz a mi",
  configure: "Beállítás",
  createAccount: "Felhasználó létrehozása",
  currentPassword: "Jelenlegi jelszó",
  dontHaveAnAccount: "Nincs még felhasználód?",
  email: "Email",
  emailAddress: "Email cím",
  emailResetLink: "Visszaállító link küldése",
  forgotPassword: "Elfelejtetted a jelszavadat?",
  ifYouAlreadyHaveAnAccount: "Ha már van felhasználód, ",
  newPassword: "Új jelszó",
  newPasswordAgain: "Új jelszó (ismét)",
  optional: "Opcionális",
  OR: "VAGY",
  password: "Jelszó",
  passwordAgain: "Jelszó (ismét)",
  privacyPolicy: "Adatvédelmi irányelvek",
  remove: "eltávolítás",
  resetYourPassword: "Jelszó visszaállítása",
  setPassword: "Jelszó beállítása",
  sign: "Bejelentkezés",
  signIn: "Bejelentkezés",
  signin: "jelentkezz be",
  signOut: "Kijelentkezés",
  signUp: "Regisztráció",
  signupCode: "Regisztrációs kód",
  signUpWithYourEmailAddress: "Regisztráció email címmel",
  terms: "Használati feltételek",
  updateYourPassword: "Jelszó módosítása",
  username: "Felhasználónév",
  usernameOrEmail: "Felhasználónév vagy email",
  "with": "-",
  info: {
    emailSent: "Email elküldve",
    emailVerified: "Email cím igazolva",
    passwordChanged: "Jelszó megváltoztatva",
    passwordReset: "Jelszó visszaállítva"
  },
  error: {
    emailRequired: "Email cím megadása kötelező.",
    minChar: "A jelszónak legalább 7 karakter hoszúnak kell lennie.",
    pwdsDontMatch: "A jelszavak nem egyeznek",
    pwOneDigit: "A jelszónak legalább egy számjegyet tartalmaznia kell.",
    pwOneLetter: "A jelszónak legalább egy betűt tartalmaznia kell.",
    signInRequired: "A művelet végrehajtásához be kell jelentkezned.",
    signupCodeIncorrect: "A regisztrációs kód hibás.",
    signupCodeRequired: "A regisztrációs kód megadása kötelező.",
    usernameIsEmail: "A felhasználónév nem lehet egy email cím.",
    usernameRequired: "Felhasználónév megadása kötelező.",
    accounts: {
      "Email already exists.": "A megadott email cím már létezik.",
      "Email doesn't match the criteria.": "Email cím nem felel meg a feltételeknek.",
      "Invalid login token": "Érvénytelen belépési token",
      "Login forbidden": "Belépés megtagadva",
      "Service unknown": "Ismeretlen szolgáltatás",
      "Unrecognized options for login request": "Ismeretlen beállítások a belépési kérelemhez",
      "User validation failed": "Felhasználó azonosítás sikertelen",
      "Username already exists.": "A felhasználónév már létezik.",
      "You are not logged in.": "Nem vagy bejelentkezve.",
      "You've been logged out by the server. Please log in again.": "A szerver kijelentkeztetett. Kérjük, jelentkezz be újra.",
      "Your session has expired. Please log in again.": "A munkamenet lejárt. Kérjük, jelentkezz be újra.",
      "No matching login attempt found": "Nem található megegyező belépési próbálkozás",
      "Password is old. Please reset your password.": "A jelszó túl régi. Kérjük, változtasd meg a jelszavad.",
      "Incorrect password": "Helytelen jelszó",
      "Invalid email": "Érvénytelen email cím",
      "Must be logged in": "A művelet végrehajtásához bejelentkezés szükséges",
      "Need to set a username or email": "Felhasználónév vagy email cím beállítása kötelező",
      "old password format": "régi jelszó formátum",
      "Password may not be empty": "A jelszó nem lehet üres",
      "Signups forbidden": "Regisztráció megtagadva",
      "Token expired": "Token lejárt",
      "Token has invalid email address": "A token érvénytelen email címet tartalmaz",
      "User has no password set": "A felhasználóhoz nincs jelszó beállítva",
      "User not found": "Felhasználó nem található",
      "Verify email link expired": "Igazoló email link lejárt",
      "Verify email link is for unknown address": "Az igazoló email link ismeretlen címhez tartozik",
      "Match failed": "Megegyeztetés sikertelen",
      "Unknown error": "Ismeretlen hiba"
    }
  }
};

T9n.map("hu", hu);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/id.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var id;

id = {
  add: "tambah",
  and: "dan",
  back: "kembali",
  changePassword: "Ganti Password",
  choosePassword: "Masukkan Password",
  clickAgree: "Dengan Anda mendaftar, Anda setuju dengan",
  configure: "Mengaturkan",
  createAccount: "Buat Account",
  currentPassword: "Password Anda Saat Ini",
  dontHaveAnAccount: "Tidak punya account?",
  email: "Email",
  emailAddress: "Alamat email",
  emailResetLink: "Link untuk email reset",
  forgotPassword: "Lupa password?",
  ifYouAlreadyHaveAnAccount: "Jika Anda sudah punya akun",
  newPassword: "Password Baru",
  newPasswordAgain: "Password Baru (ulang)",
  optional: "Opsional",
  OR: "ATAU",
  password: "Password",
  passwordAgain: "Password (ulang)",
  privacyPolicy: "Kebijakan Privasi",
  remove: "hapus",
  resetYourPassword: "Reset password anda",
  setPassword: "Masukkan Password",
  sign: "Sign",
  signIn: "Sign In",
  signin: "sign in",
  signOut: "Sign Out",
  signUp: "Mendaftar",
  signupCode: "Kode Registrasi",
  signUpWithYourEmailAddress: "Mendaftar dengan alamat email Anda",
  terms: "Persyaratan Layanan",
  updateYourPassword: "Perbarui password Anda",
  username: "Username",
  usernameOrEmail: "Username atau email",
  "with": "dengan",
  info: {
    emailSent: "Email terkirim",
    emailVerified: "Email diverifikasi",
    passwordChanged: "Password terganti",
    passwordReset: "Password direset"
  },
  error: {
    emailRequired: "Alamat email dibutuhkan.",
    minChar: "Minimum password 7 karakter.",
    pwdsDontMatch: "Password yang diulang tidak sama.",
    pwOneDigit: "Password harus ada minimum 1 angka.",
    pwOneLetter: "Password harus ada minimum 1 huruf.",
    signInRequired: "Anda harus sign in untuk melakukan itu.",
    signupCodeIncorrect: "Kode registrasi salah.",
    signupCodeRequired: "Kode registrasi dibutuhkan.",
    usernameIsEmail: "Username Anda tidak bisa sama dengan email address.",
    usernameRequired: "Username dibutuhkan.",
    accounts: {
      "Email already exists.": "Alamat email sudah dipakai.",
      "Email doesn't match the criteria.": "Alamat email tidak sesuai dengan kriteria.",
      "Invalid login token": "Login token tidak valid",
      "Login forbidden": "Login dilarang",
      "Service unknown": "Layanan unknown",
      "Unrecognized options for login request": "Options tidak tersedia untuk permintaan login",
      "User validation failed": "Validasi user gagal",
      "Username already exists.": "Username sudah dipakai.",
      "You are not logged in.": "Anda belum login.",
      "You've been logged out by the server. Please log in again.": "Anda belum dilogout oleh server. Silahkan coba login lagi.",
      "Your session has expired. Please log in again.": "Session Anda telah kadaluarsa. Silahkan coba login lagi.",
      "No matching login attempt found": "Usaha login tidak ditemukan.",
      "Password is old. Please reset your password.": "Password Anda terlalu tua. Silahkan ganti password Anda.",
      "Incorrect password": "Password salah",
      "Invalid email": "Alamat email tidak valid",
      "Must be logged in": "Anda harus login",
      "Need to set a username or email": "Anda harus masukkan username atau email",
      "old password format": "format password lama",
      "Password may not be empty": "Password tidak boleh kosong",
      "Signups forbidden": "Signup dilarang",
      "Token expired": "Token telah kadaluarsa",
      "Token has invalid email address": "Token memberikan alamat email yang tidak valid",
      "User has no password set": "User belum memasukkan password",
      "User not found": "User tidak ditemukan",
      "Verify email link expired": "Link untuk verifikasi alamat email telah kadaluarsa",
      "Verify email link is for unknown address": "Link untuk verifikasi alamat email memberikan alamat email yang tidak dikenalkan",
      "Match failed": "Mencocokan gagal",
      "Unknown error": "Error tidak dikenalkan"
    }
  }
};

T9n.map("id", id);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/it.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var it;

it = {
  t9Name: 'Italiano',
  add: "aggiungi",
  and: "e",
  back: "indietro",
  changePassword: "Cambia Password",
  choosePassword: "Scegli una Password",
  clickAgree: "Cliccando Registrati, accetti la nostra",
  configure: "Configura",
  createAccount: "Crea un Account",
  currentPassword: "Password Corrente",
  dontHaveAnAccount: "Non hai un account?",
  email: "Email",
  emailAddress: "Indirizzo Email",
  emailResetLink: "Invia Link di Reset",
  forgotPassword: "Hai dimenticato la password?",
  ifYouAlreadyHaveAnAccount: "Se hai già un account",
  newPassword: "Nuova Password",
  newPasswordAgain: "Nuova Password (di nuovo)",
  optional: "Opzionale",
  OR: "OPPURE",
  password: "Password",
  passwordAgain: "Password (di nuovo)",
  privacyPolicy: "Privacy Policy",
  remove: "rimuovi",
  resetYourPassword: "Reimposta la password",
  setPassword: "Imposta Password",
  sign: "Accedi",
  signIn: "Accedi",
  signin: "accedi",
  signOut: "Esci",
  signUp: "Registrati",
  signupCode: "Codice di Registrazione",
  signUpWithYourEmailAddress: "Registrati con il tuo indirizzo email",
  terms: "Termini di Servizio",
  updateYourPassword: "Aggiorna la password",
  username: "Username",
  usernameOrEmail: "Nome utente o email",
  "with": "con",
  "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.": "Ti è stata inviata una nuova email. Se non trovi l' email nella tua posta in arrivo controllate che non sia stata spostata nella cartella SPAM.",
  "Already verified": "Gi\à verificato",
  "At least 1 digit, 1 lowercase and 1 uppercase": "Almeno 1 numero, 1 carattere minuscolo e 1 maiuscolo",
  "Invalid email": "Email non valida",
  "Please verify your email first. Check the email and follow the link!": "Per favore, verifica prima la tua email. Controlla la tua email e segui il collegamento che ti è stato inviato.",
  "Required Field": "Campo richiesto",
  "Send again": "Invia di nuovo",
  "Send email again": "Invia di nuovo l' email",
  "Send the verification email again": "Invia di nuovo l' email di verifica",
  "Verification email lost?": "Hai smarrito l' email di verifica?",
  info: {
    emailSent: "Email inviata",
    emailVerified: "Email verificata",
    passwordChanged: "Password cambiata",
    passwordReset: "Password reimpostata"
  },
  error: {
    emailRequired: "L'Email è obbligatoria.",
    minChar: "La Password deve essere di almeno 7 caratteri.",
    pwdsDontMatch: "Le Password non corrispondono",
    pwOneDigit: "La Password deve contenere almeno un numero.",
    pwOneLetter: "La Password deve contenere 1 lettera.",
    signInRequired: "Per fare questo devi accedere.",
    signupCodeIncorrect: "Codice di Registrazione errato.",
    signupCodeRequired: "Il Codice di Registrazione è obbligatorio.",
    usernameIsEmail: "Il Nome Utente non può essere un indirizzo email.",
    usernameRequired: "Il Nome utente è obbligatorio.",
    accounts: {
      "Email already exists.": "Indirizzo email già esistente.",
      "Email doesn't match the criteria.": "L'indirizzo email non soddisfa i requisiti.",
      "Invalid login token": "Codice di accesso non valido",
      "Login forbidden": "Accesso non consentito",
      "Service unknown": "Servizio sconosciuto",
      "Unrecognized options for login request": "Opzioni per la richiesta di accesso non ricunosciute",
      "User validation failed": "Validazione utente fallita",
      "Username already exists.": "Nome utente già esistente.",
      "You are not logged in.": "Non hai effettuato l'accesso.",
      "You've been logged out by the server. Please log in again.": "Sei stato disconnesso dal server. Per favore accedi di nuovo.",
      "Your session has expired. Please log in again.": "La tua sessione è scaduta. Per favore accedi di nuovo.",
      "No matching login attempt found": "Tentativo di accesso corrispondente non trovato",
      "Password is old. Please reset your password.": "La password è vecchia. Per favore reimposta la tua password.",
      "Incorrect password": "Password non corretta",
      "Must be logged in": "Devi aver eseguito l'accesso",
      "Need to set a username or email": "È necessario specificare un nome utente o un indirizzo email",
      "old password format": "vecchio formato password",
      "Password may not be empty": "La password non può essere vuota",
      "Signups forbidden": "Registrazioni non consentite",
      "Token expired": "Codice scaduto",
      "Token has invalid email address": "Il codice ha un indirizzo email non valido",
      "User has no password set": "L'utente non ha una password impostata",
      "User not found": "Utente non trovato",
      "Verify email link expired": "Link per la verifica dell'email scaduto",
      "Verify email link is for unknown address": "Il link per la verifica dell'email fa riferimento ad un indirizzo sconosciuto",
      "Match failed": "Riscontro fallito",
      "Unknown error": "Errore Sconosciuto"
    }
  }
};

T9n.map("it", it);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/ja.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var ja;

ja = {
  t9Name: '日本語',
  add: "アカウント連携：",
  and: "と",
  back: "戻る",
  changePassword: "パスワードを変更する",
  choosePassword: "パスワードを選ぶ",
  clickAgree: "アカウント登録をクリックすると、次の内容に同意したことになります。",
  configure: "設定する",
  createAccount: "新しいアカウントの登録",
  currentPassword: "現在のパスワード",
  dontHaveAnAccount: "まだアカウントをお持ちでない場合は",
  Email: "メールアドレス",
  email: "メールアドレス",
  emailAddress: "メールアドレス",
  emailResetLink: "パスワードリセットのメールを送る",
  forgotPassword: "パスワードをお忘れですか？",
  ifYouAlreadyHaveAnAccount: "既にアカウントをお持ちの場合は",
  newPassword: "新しいパスワード",
  newPasswordAgain: "新しいパスワード（確認）",
  optional: "オプション",
  OR: "または",
  password: "パスワード",
  passwordAgain: "パスワード（確認）",
  privacyPolicy: "プライバシーポリシー",
  remove: "連携の解除：",
  resetYourPassword: "パスワードのリセット",
  setPassword: "パスワードを設定する",
  sign: "署名",
  signIn: "ログイン",
  signin: "ログイン",
  signOut: "ログアウト",
  signUp: "アカウント登録",
  signupCode: "登録用コード",
  signUpWithYourEmailAddress: "メールアドレスで登録する",
  terms: "利用規約",
  updateYourPassword: "パスワードを変更する",
  username: "ユーザー名",
  usernameOrEmail: "ユーザー名またはメールアドレス",
  "with": "：",
  maxAllowedLength: "最大文字数",
  minRequiredLength: "最低文字数",
  resendVerificationEmail: "認証メールの再送",
  resendVerificationEmailLink_pre: "認証メールが届いていない場合は",
  resendVerificationEmailLink_link: "再送",
  info: {
    emailSent: "メールを送りました",
    emailVerified: "メールアドレスを確認しました",
    passwordChanged: "パスワードを変更しました",
    passwordReset: "パスワードをリセットしました"
  },
  error: {
    emailRequired: "メールアドレスを入力してください。",
    minChar: "パスワードの文字数が足りません。",
    pwdsDontMatch: "パスワードが一致しません。",
    pwOneDigit: "パスワードに1文字以上の数字を含めてください。",
    pwOneLetter: "パスワードに1文字以上のアルファベットを含めてください。",
    signInRequired: "その操作にはログインが必要です。",
    signupCodeIncorrect: "登録用コードが間違っています。",
    signupCodeRequired: "登録用コードが必要です。",
    usernameIsEmail: "ユーザー名にメールアドレスは使えません。",
    usernameRequired: "ユーザー名が必要です。",
    accounts: {
      "Email already exists.": "そのメールアドレスは既に登録されています。",
      "Email doesn't match the criteria.": "正しいメールアドレスを入力してください。",
      "Invalid login token": "無効なログイントークンです。",
      "Login forbidden": "ログインできません。",
      "Service unknown": "不明なサービスです",
      "Unrecognized options for login request": "不明なログインオプションです",
      "User validation failed": "ユーザ認証に失敗しました",
      "Username already exists.": "そのユーザー名は既に使われています。",
      "You are not logged in.": "ログインしていません。",
      "You've been logged out by the server. Please log in again.": "既にログアウトしています。再度ログインしてください。",
      "Your session has expired. Please log in again.": "セッションが切れました。再度ログインしてください。",
      "Already verified": "認証済です",
      "No matching login attempt found": "対応するログイン試行が見つかりません",
      "Password is old. Please reset your password.": "古いパスワードです。パスワードをリセットしてください。",
      "Incorrect password": "パスワードが正しくありません",
      "Invalid email": "無効なメールアドレスです",
      "Must be logged in": "ログインが必要です",
      "Need to set a username or email": "ユーザー名かメールアドレスを入力してください",
      "old password format": "古いパスワード形式です",
      "Password may not be empty": "パスワードを入力してください",
      "Signups forbidden": "アカウントを登録できません",
      "Token expired": "無効なトークンです",
      "Token has invalid email address": "トークンに無効なメールアドレスが含まれています",
      "User has no password set": "パスワードが設定されていません",
      "User not found": "ユーザー名が見つかりません",
      "Verify email link expired": "期限の切れた認証メールのリンクです",
      "Verify email link is for unknown address": "不明なメールアドレスに対する認証メールのリンクです",
      "At least 1 digit, 1 lowercase and 1 uppercase": "数字、小文字、大文字をそれぞれ1文字以上入力してください",
      "Please verify your email first. Check the email and follow the link!": "まず認証メールが届いているか確認して、リンクを押してください！",
      "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.": "新しいメールを送信しました。もしメールが届いていなければ、迷惑メールに分類されていないか確認してください。",
      "Match failed": "一致しません",
      "Unknown error": "不明なエラー"
    }
  }
};

T9n.map("ja", ja);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/kh.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var kh;

kh = {
  add: "បន្ថែម",
  and: "និង",
  back: "ត្រឡប់ក្រោយ",
  changePassword: "ផ្លាស់ប្តូរពាក្យសម្ងាត់",
  choosePassword: "ជ្រើសពាក្យសម្ងាត់",
  clickAgree: "សូមចុះឈ្មោះ បើអ្នកយល់ព្រម",
  configure: "កំណត់រចនាសម្ព័ន្ធ",
  createAccount: "បង្កើតគណនី",
  currentPassword: "ពាក្យសម្ងាត់បច្ចុប្បន្ន",
  dontHaveAnAccount: "មិនមានគណនីទេឬ?",
  email: "អ៊ីម៉ែល",
  emailAddress: "អាសយដ្ឋានអ៊ីម៉ែល",
  emailResetLink: "អ៊ីម៉ែលតំណភ្ជាប់ សម្រាប់កំណត់ឡើងវិញ",
  forgotPassword: "ភ្លេចពាក្យសម្ងាត់?",
  ifYouAlreadyHaveAnAccount: "បើអ្នកមានគណនីមួយរួចទៅហើយ",
  newPassword: "ពាក្យសម្ងាត់ថ្មី",
  newPasswordAgain: "ពាក្យសម្ងាត់ថ្មី (ម្ដងទៀត)",
  optional: "ជម្រើស",
  OR: "ឬ",
  password: "ពាក្យសម្ងាត់",
  passwordAgain: "ពាក្យសម្ងាត់ (ម្ដងទៀត)",
  privacyPolicy: "គោលការណ៍ភាពឯកជន",
  remove: "លុប",
  resetYourPassword: "កំណត់ពាក្យសម្ងាត់ឡើងវិញ",
  setPassword: "កំណត់ពាក្យសម្ងាត់",
  sign: "ចូលគណនី",
  signIn: "ពិនិត្យចូល",
  signin: "ចូល",
  signOut: "ចាកចេញ",
  signUp: "ចុះឈ្មោះ",
  signupCode: "លេខ​កូដចុះឈ្មោះ",
  signUpWithYourEmailAddress: "ចុះឈ្មោះជាមួយអាសយដ្ឋានអ៊ីមែល",
  terms: "លក្ខខណ្ឌនៃការប្រើប្រាស់",
  updateYourPassword: "ធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់",
  username: "ឈ្មោះអ្នកប្រើ",
  usernameOrEmail: "ឈ្មោះអ្នកប្រើ ឬអ៊ីម៉ែល",
  "with": "ជាមួយនឹង",
  info: {
    emailSent: "អ៊ីម៉ែលដែលបានផ្ញើរ",
    emailVerified: "អ៊ីម៉ែលបានផ្ទៀងផ្ទាត់",
    passwordChanged: "ពាក្យសម្ងាត់បាន​ផ្លាស់ប្តូរ",
    passwordReset: "កំណត់ពាក្យសម្ងាត់ឡើងវិញ"
  },
  error: {
    emailRequired: "អ៊ីម៉ែលត្រូវបានទាមទារ",
    minChar: "ពាក្យសម្ងាត់អប្បបរមា ៧ តួអក្សរលេខ",
    pwdsDontMatch: "ពាក្យសម្ងាត់មិនត្រូវគ្នា",
    pwOneDigit: "ពាក្យសម្ងាត់ត្រូវតែមានយ៉ាងហោចណាស់ ១ តួលេខ",
    pwOneLetter: "ពាក្យសម្ងាត់ត្រូវតែមានយ៉ាងហោចណាស់ ១ តួអក្សរ​",
    signInRequired: "អ្នកត្រូវតែបានចូលគណនី ដើម្បីធ្វើការងារផ្សេងៗ",
    signupCodeIncorrect: "លេខកូដការចុះឈ្មោះមិនត្រឹមត្រូវ",
    signupCodeRequired: "លេខកូដការចុះឈ្មោះត្រូវបានទាមទារ",
    usernameIsEmail: "ឈ្មោះអ្នកប្រើមិនអាចជាអាសយដ្ឋានអ៊ីមែល",
    usernameRequired: "ឈ្មោះអ្នកប្រើត្រូវបានទាមទារ",
    accounts: {
      "Email already exists.": "អ៊ីម៉ែលមានរួចហើយ",
      "Email doesn't match the criteria.": "អ៊ីម៉ែលមិនផ្គូផ្គងនឹងលក្ខណៈវិនិច្ឆ័យ",
      "Invalid login token": "សញ្ញាសម្ងាត់ចូលមិនត្រឹមត្រូវ",
      "Login forbidden": "បានហាមឃាត់ការចូល",
      "Service unknown": "សេវាមិនស្គាល់",
      "Unrecognized options for login request": "មិនស្គាល់ជម្រើសសម្រាប់សំណើកត់ត្រាចូល",
      "User validation failed": "សុពលភាពរបស់អ្នកប្រើបានបរាជ័យ",
      "Username already exists.": "ឈ្មោះអ្នកប្រើមាន​រួចហើយ",
      "You are not logged in.": "អ្នកមិនបានចូលគណនីទេ",
      "You've been logged out by the server. Please log in again.": "អ្នកបានចាកចេញ ពីគណនី, សូមចូលម្តងទៀត",
      "Your session has expired. Please log in again.": "សុពលភាពរបស់អ្នកបានផុតកំណត់, សូមចូលម្តងទៀត",
      "No matching login attempt found": "គ្មានការផ្គូផ្គងចូលត្រូវបានរកឃើញ",
      "Password is old. Please reset your password.": "ពាក្យសម្ងាត់គឺចាស់,​ សូមកំណត់ពាក្យសម្ងាត់ឡើងវិញ",
      "Incorrect password": "ពាក្យសម្ងាត់មិនត្រឹមត្រូវ",
      "Invalid email": "អ៊ីម៉ែលមិនត្រឹមត្រូវ",
      "Must be logged in": "ត្រូវតែចូលគណនី",
      "Need to set a username or email": "ត្រូវកំណត់ឈ្មោះអ្នកប្រើ​ ឬអ៊ីម៉ែល",
      "old password format": "ទ្រង់ទ្រាយពាក្យសម្ងាត់ចាស់",
      "Password may not be empty": "ពាក្យសម្ងាត់ប្រហែលជាមិនអាចទទេ",
      "Signups forbidden": "ការចូលត្រូវបានហាមឃាត់",
      "Token expired": "សញ្ញាសម្ងាត់ផុតកំណត់",
      "Token has invalid email address": "សញ្ញាសម្ងាត់ដែលមានអាសយដ្ឋានអ៊ីមែលមិនត្រឹមត្រូវ",
      "User has no password set": "អ្នកប្រើមិនមានសំណុំពាក្យសម្ងាត់",
      "User not found": "រកមិនឃើញអ្នកប្រើ",
      "Verify email link expired": "ផ្ទៀងផ្ទាត់តំណភ្ជាប់អ៊ីម៉ែលផុតកំណត់",
      "Verify email link is for unknown address": "ផ្ទៀងផ្ទាត់តំណភ្ជាប់អ៊ីម៉ែល គឺសម្រាប់អាសយដ្ឋានមិនស្គាល់",
      "Match failed": "ការផ្ទៀងផ្ទាត់បានបរាជ័យ",
      "Unknown error": "មិនស្គាល់កំហុស"
    }
  }
};

T9n.map("kh", kh);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/ko.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var ko;

ko = {
  add: "추가",
  and: "그리고",
  back: "뒤로",
  changePassword: "비밀번호 변경",
  choosePassword: "비밀번호 선택",
  clickAgree: "클릭함으로써 위 약관에 동의합니다",
  configure: "설정",
  createAccount: "계정 생성",
  currentPassword: "현재 비밀번호",
  dontHaveAnAccount: "계정이 없으세요?",
  email: "이메일",
  emailAddress: "이메일 주소",
  emailResetLink: "이메일 리셋 링크",
  forgotPassword: "비밀번호를 잊으셨나요?",
  ifYouAlreadyHaveAnAccount: "이미 계정이 있으시면",
  newPassword: "새 비밀번호",
  newPasswordAgain: "새 비밀번호(확인)",
  optional: "선택",
  OR: "혹은",
  password: "비밀번호",
  passwordAgain: "비밀번호 (확인)",
  privacyPolicy: "개인정보보호정책",
  remove: "삭제",
  resetYourPassword: "비밀번호 초기화",
  setPassword: "비밀번호 선택",
  sign: "로그인",
  signIn: "로그인",
  signin: "로그인",
  signOut: "로그아웃",
  signUp: "회원가입",
  signupCode: "회원가입 코드",
  signUpWithYourEmailAddress: "이메일로 가입하기",
  terms: "약관",
  updateYourPassword: "비밀번호 업데이트",
  username: "아이디",
  usernameOrEmail: "아이디 혹은 이메일",
  "with": "와",
  info: {
    emailSent: "이메일 발송",
    emailVerified: "이메일 인증성공",
    passwordChanged: "비밀번호 변경됨",
    passwordReset: "비밀번호 초기화",
    error: {
      emailRequired: "이메일이 필요합니다.",
      minChar: "비밀번호는 최소 7자 이상입니다.",
      pwdsDontMatch: "비밀번호가 일치하지 않습니다",
      pwOneDigit: "비밀번호에 숫자 하나 이상이 필요합니다.",
      pwOneLetter: "비밀번호에 문자 하나 이상이 필요합니다.",
      signInRequired: "로그인이 필요한 서비스입니다.",
      signupCodeIncorrect: "가입 코드가 맞지 않습니다.",
      signupCodeRequired: "가입 코드가 필요합니다.",
      usernameIsEmail: "아이디와 이메일은 달라야 합니다.",
      usernameRequired: "아이디가 필요합니다.",
      accounts: {
        "Email already exists.": "중복된 이메일입니다.",
        "Email doesn't match the criteria.": "이메일이 요구 조건에 맞지 않습니다.",
        "Invalid login token": "잘못된 로그인 토큰",
        "Login forbidden": "허용되지 않은 로그인",
        "Service unknown": "알 수 없는 서비스",
        "Unrecognized options for login request": "알 수 없는 로그인 요청 정보입니다",
        "User validation failed": "인증 실패",
        "Username already exists.": "중복된 아이디입니다.",
        "You are not logged in.": "로그인 상태가 아닙니다.",
        "You've been logged out by the server. Please log in again.": "서버에 의해 로그아웃되었습니다. 다시 로그인해주세요.",
        "Your session has expired. Please log in again.": "세션이 만료되었습니다. 다시 로그인해주세요.",
        "No matching login attempt found": "해당 로그인 시도를 찾지 못했습니다",
        "Password is old. Please reset your password.": "오래된 비밀번호입니다. 변경해주세요.",
        "Incorrect password": "잘못된 비밀번호입니다",
        "Invalid email": "잘못된 이메일 주소입니다",
        "Must be logged in": "로그인이 필요합니다",
        "Need to set a username or email": "아이디나 이메일을 입력해주세요",
        "old password format": "오래된 비밀번호 형식입니다",
        "Password may not be empty": "비밀번호를 입력해주세요",
        "Signups forbidden": "가입이 거부되었습니다",
        "Token expired": "토큰이 만료되었습니다",
        "Token has invalid email address": "토큰에 포함된 이메일 주소가 유효하지 않습니다",
        "User has no password set": "설정된 암호가 없습니다",
        "User not found": "사용자를 찾을 수 없습니다",
        "Verify email link expired": "확인 코드가 만료되었습니다",
        "Verify email link is for unknown address": "알 수 없는 인증 메일 주소입니다",
        "Match failed": "매치되지 않습니다",
        "Unknown error": "알 수 없는 오류"
      }
    }
  }
};

T9n.map("ko", ko);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/nl.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var nl;

nl = {
  add: "toevoegen",
  and: "en",
  back: "terug",
  changePassword: "Wachtwoord wijzigen",
  choosePassword: "Wachtwoord kiezen",
  clickAgree: "Door te registreren accepteert u onze",
  configure: "Configureer",
  createAccount: "Account aanmaken",
  currentPassword: "Huidig wachtwoord",
  dontHaveAnAccount: "Nog geen account?",
  email: "E-mail",
  emailAddress: "E-mailadres",
  emailResetLink: "Verzenden",
  forgotPassword: "Wachtwoord vergeten?",
  ifYouAlreadyHaveAnAccount: "Heeft u al een account?",
  newPassword: "Nieuw wachtwoord",
  newPasswordAgain: "Nieuw wachtwoord (herhalen)",
  optional: "Optioneel",
  OR: "OF",
  password: "Wachtwoord",
  passwordAgain: "Wachtwoord (herhalen)",
  privacyPolicy: "privacyverklaring",
  remove: "verwijderen",
  resetYourPassword: "Wachtwoord resetten",
  setPassword: "Wachtwoord instellen",
  sign: "Aanmelden",
  signIn: "Aanmelden",
  signin: "Aanmelden",
  signOut: "Afmelden",
  signUp: "Registreren",
  signupCode: "Registratiecode",
  signUpWithYourEmailAddress: "Met e-mailadres registreren",
  terms: "gebruiksvoorwaarden",
  updateYourPassword: "Wachtwoord veranderen",
  username: "Gebruikersnaam",
  usernameOrEmail: "Gebruikersnaam of e-mailadres",
  "with": "met",
  info: {
    emailSent: "E-mail verzonden",
    emailVerified: "E-mail geverifieerd",
    PasswordChanged: "Wachtwoord gewijzigd",
    PasswordReset: "Wachtwoord gereset"
  },
  error: {
    emailRequired: "E-mailadres is verplicht",
    minChar: "Wachtwoord moet tenminste 7 tekens lang zijn.",
    pwdsDontMatch: "Wachtwoorden zijn niet gelijk.",
    pwOneDigit: "Wachtwoord moet tenminste 1 cijfer bevatten.",
    pwOneLetter: "Wachtwoord moet tenminste 1 letter bevatten.",
    signInRequired: "U moet aangemeld zijn.",
    signupCodeIncorrect: "Registratiecode is ongeldig.",
    signupCodeRequired: "Registratiecode is verplicht.",
    usernameIsEmail: "Gebruikersnaam is gelijk aan e-mail.",
    usernameRequired: "Gebruikersnaam is verplicht.",
    accounts: {
      "Email already exists.": "Dit e-mailadres is al in gebruik.",
      "Email doesn't match the criteria.": "e-mail voldoet niet aan de voorwaarden.",
      "Invalid login token": "Ongeldig inlogtoken",
      "Login forbidden": "Aanmelding geweigerd",
      "Service unknown": "Sevice onbekend",
      "Unrecognized options for login request": "Onbekende optie voor inlogverzoek",
      "User validation failed": "Gebruikersvalidatie mislukt",
      "Username already exists.": "Gebruikersnaam bestaat al.",
      "You are not logged in.": "U bent niet ingelogd.",
      "You've been logged out by the server. Please log in again.": "U bent door de server afgemeld. Meld a.u.b. opnieuw aan.",
      "Your session has expired. Please log in again.": "Uw sessie is verlopen. Meld a.u.b. opnieuw aan.",
      "No matching login attempt found": "Geen overeenkomstig inlogverzoek gevonden.",
      "Password is old. Please reset your Password.": "Wachtwoord is verlopen. Reset a.u.b. uw wachtwoord.",
      "Incorrect password": "Onjuist wachtwoord",
      "Invalid email": "Ongeldig e-mailadres",
      "Must be logged in": "U moet aangemeld zijn",
      "Need to set a username or email": "Gebruikersnaam of e-mailadres moet ingesteld zijn",
      "Password may not be empty": "Wachtwoord mag niet leeg zijn",
      "Signups forbidden": "Registratie verboden",
      "Token expired": "Token is verlopen",
      "Token has invalid email address": "Token heeft ongeldig e-mailadres",
      "User has no Password set": "Geen wachtwoord ingesteld voor gebruiker",
      "User not found": "Gebruiker niet gevonden",
      "Verify email link expired": "Verificatielink is verlopen",
      "Verify email link is for unknown address": "Verificatielink is voor onbekend e-mailadres",
      "Match failed": "Geen match",
      "Unknown error": "Onbekende fout"
    }
  }
};

T9n.map("nl", nl);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/no_NB.coffee.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var no_NB;

no_NB = {
  add: "legg til",
  and: "og",
  back: "tilbake",
  changePassword: "Bytt passord",
  choosePassword: "Velg passord",
  clickAgree: "Ved å klikke meld på godtar du vår",
  configure: "Konfigurer",
  createAccount: "Oprett konto",
  currentPassword: "Nåværende passord",
  dontHaveAnAccount: "Har du ikke en konto?",
  email: "E-post",
  emailAddress: "E-postadresse",
  emailResetLink: "Epost nullstillingslenke",
  forgotPassword: "Glemt passord?",
  ifYouAlreadyHaveAnAccount: "Hvis du allerede har en konto",
  newPassword: "Nytt passord",
  newPasswordAgain: "Gjengi nytt passord",
  optional: "Frivillig",
  OR: "eller",
  password: "Passord",
  passwordAgain: "Gjengi passord",
  privacyPolicy: "Personvern",
  remove: "fjern",
  resetYourPassword: "Nullstill passord",
  setPassword: "Sett passord",
  sign: "Logg",
  signIn: "Logg inn",
  signin: "Logg inn",
  signOut: "Logg ut",
  signUp: "Meld på",
  signupCode: "Påmeldingskode",
  signUpWithYourEmailAddress: "Meld på med din e-postadresse",
  terms: "Betingelser for bruk",
  updateYourPassword: "Oppdater passord",
  username: "Brukernavn",
  usernameOrEmail: "Brukernavn eller e-epost",
  "with": "med",
  info: {
    emailSent: "E-post sendt",
    emailVerified: "E-post bekreftet",
    passwordChanged: "Passord endret",
    passwordReset: "Passord nullstillt"
  },
  error: {
    emailRequired: "E-post obligatorisk.",
    minChar: "Passordet må ha minst 7 tegn.",
    pwdsDontMatch: "Passordene er ikke like.",
    pwOneDigit: "Passordet må ha minst ett tall.",
    pwOneLetter: "Passordet må ha minst en bokstav.",
    signInRequired: "Du må være logget inn for å gjøre dette.",
    signupCodeIncorrect: "Påmelding gikk galt.",
    signupCodeRequired: "Påmeldingskode kreves.",
    usernameIsEmail: "Brukernavn kan ikke være en e-postadresse.",
    usernameRequired: "Brukernavn må utfylles.",
    accounts: {
      "Email already exists.": "E-postadressen finnes allerede.",
      "Email doesn't match the criteria.": "E-postadressen møter ikke kriteriet.",
      "Invalid login token": "Ugyldig innloggingstegn",
      "Login forbidden": "Innlogging forbudt",
      "Service unknown": "Ukjent tjeneste",
      "Unrecognized options for login request": "Ukjendte valg ved innloggingsforsøk",
      "User validation failed": "Brukergodkjenning gikk galt",
      "Username already exists.": "Brukernavnet finnes allerede.",
      "You are not logged in.": "Du er ikke logget inn.",
      "You've been logged out by the server. Please log in again.": "Tjeneren loggt deg ut. Logg inn på ny.",
      "Your session has expired. Please log in again.": "Din økt er utløpt. Logg inn på ny.",
      "No matching login attempt found": "Fant ingen samsvarende innloggingsførsøk",
      "Password is old. Please reset your password.": "Passordet er for gammelt. Nullstill passordet ditt.",
      "Incorrect password": "Feil passord",
      "Invalid email": "Ugyldig e-postadresse",
      "Must be logged in": "Du må være innlogget",
      "Need to set a username or email": "Oppgi brukernavn eller e-postadresse",
      "old password format": "gammelt passordformat",
      "Password may not be empty": "Passord må være utfyllt",
      "Signups forbidden": "Påmeldinger ikke tillatt",
      "Token expired": "Økten er utløpt",
      "Token has invalid email address": "Innloggingstegnet har ugyldig e-postadresse",
      "User has no password set": "Brukeren har ikke angitt passord",
      "User not found": "Bruker ikke funnet",
      "Verify email link expired": "Lenke for e-postbekreftelse er utløpt",
      "Verify email link is for unknown address": "Lenke for e-postbekreftelse er for en ukjent adresse",
      "Match failed": "Ikke samsvar",
      "Unknown error": "Ukjent feil"
    }
  }
};

T9n.map("no_NB", no_NB);

T9n.map("no-NB", no_NB);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/pl.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var pl;

pl = {
  t9Name: 'Polski',
  add: "dodaj",
  and: "i",
  back: "powrót",
  cancel: "Anuluj",
  changePassword: "Zmień hasło",
  choosePassword: "Wybierz hasło",
  clickAgree: "Klikając na Zarejestruj się zgadzasz się z naszą",
  configure: "Konfiguruj",
  createAccount: "Utwórz konto",
  currentPassword: "Aktualne hasło",
  dontHaveAnAccount: "Nie masz konta?",
  email: "E-mail",
  emailAddress: "Adres e-mail",
  emailResetLink: "Wyślij e-mail z linkiem do zmiany hasła",
  forgotPassword: "Zapomniałeś hasła?",
  ifYouAlreadyHaveAnAccount: "Jeżeli już masz konto",
  newPassword: "Nowe hasło",
  newPasswordAgain: "Nowe hasło (powtórz)",
  optional: "Nieobowiązkowe",
  OR: "LUB",
  password: "Hasło",
  passwordAgain: "Hasło (powtórz)",
  privacyPolicy: "polityką prywatności",
  remove: "usuń",
  resetYourPassword: "Ustaw nowe hasło",
  setPassword: "Ustaw hasło",
  sign: "Podpisz",
  signIn: "Zaloguj się",
  signin: "zaloguj się",
  signOut: "Wyloguj się",
  signUp: "Zarejestruj się",
  signupCode: "Kod rejestracji",
  signUpWithYourEmailAddress: "Zarejestruj się używając adresu e-mail",
  terms: "warunkami korzystania z serwisu",
  updateYourPassword: "Zaktualizuj swoje hasło",
  username: "Nazwa użytkownika",
  usernameOrEmail: "Nazwa użytkownika lub adres e-mail",
  "with": "z",
  maxAllowedLength: "Maksymalna dopuszczalna długość",
  minRequiredLength: "Minimalna wymagana długość",
  resendVerificationEmail: "Wyślij maila ponownie",
  resendVerificationEmailLink_pre: "Zgubiłeś mail weryfikacyjny?",
  resendVerificationEmailLink_link: "Wyślij ponownie",
  enterPassword: "Wprowadź hasło",
  enterNewPassword: "Wprowadź nowe hasło",
  enterEmail: "Wprowadź adres e-mail",
  enterUsername: "Wprowadź nazwę użytkownika",
  enterUsernameOrEmail: "Wprowadź nazwę użytkownika lub adres e-mail",
  orUse: "Lub użyj",
  info: {
    emailSent: "Adres e-mail wysłany",
    emailVerified: "Adres e-mail zweryfikowany",
    passwordChanged: "Hasło zmienione",
    passwordReset: "Hasło wyzerowane"
  },
  alert: {
    ok: 'Ok',
    type: {
      info: 'Uwaga',
      error: 'Błąd',
      warning: 'Ostrzeżenie'
    }
  },
  error: {
    emailRequired: "Wymagany jest adres e-mail.",
    minChar: "7 znaków to minimalna długość hasła.",
    pwdsDontMatch: "Hasła są różne",
    pwOneDigit: "Hasło musi zawierać przynajmniej jedną cyfrę.",
    pwOneLetter: "Hasło musi zawierać 1 literę.",
    signInRequired: "Musisz być zalogowany, aby to zrobić.",
    signupCodeIncorrect: "Kod rejestracji jest nieprawidłowy.",
    signupCodeRequired: "Wymagany jest kod rejestracji.",
    usernameIsEmail: "Adres e-mail nie może być nazwą użytkownika.",
    usernameRequired: "Wymagana jest nazwa użytkownika.",
    accounts: {
      "Email already exists.": "Adres e-mail już istnieje.",
      "Email doesn't match the criteria.": "Adres e-mail nie spełnia kryteriów.",
      "Invalid login token": "Błędny token logowania",
      "Login forbidden": "Logowanie zabronione",
      "Service unknown": "Nieznana usługa",
      "Unrecognized options for login request": "Nieznane parametry w żądaniu logowania",
      "User validation failed": "Niepoprawna nazwa użytkownika",
      "Username already exists.": "Nazwa użytkownika już istnieje.",
      "You are not logged in.": "Nie jesteś zalogowany.",
      "You've been logged out by the server. Please log in again.": "Zostałeś wylogowane przez serwer. Zaloguj się ponownie.",
      "Your session has expired. Please log in again.": "Twoja sesja wygasła. Zaloguj się ponownie.",
      "Already verified": "Już zweryfikowano",
      "Invalid email or username": "Niewłaściwy adress e-mail lub nazwa użytkownika",
      "Internal server error": "Błąd wewnętrzny serwera",
      "undefined": "Ups, coś poszło nie tak",
      "No matching login attempt found": "Nie dopasowano danych logowania",
      "Password is old. Please reset your password.": "Hasło jest stare. Proszę wyzerować hasło.",
      "Incorrect password": "Niepoprawne hasło",
      "Invalid email": "Błędny adres e-mail",
      "Must be logged in": "Musisz być zalogowany",
      "Need to set a username or email": "Wymagane ustawienie nazwy użytkownika lub adresu e-mail",
      "old password format": "stary format hasła",
      "Password may not be empty": "Hasło nie może być puste",
      "Signups forbidden": "Rejestracja zabroniona",
      "Token expired": "Token wygasł",
      "Token has invalid email address": "Token ma niewłaściwy adres e-mail",
      "User has no password set": "Użytkownik nie ma ustawionego hasła",
      "User not found": "Nie znaleziono użytkownika",
      "Verify email link expired": "Link weryfikacyjny wygasł",
      "Verify email link is for unknown address": "Link weryfikacyjny jest dla nieznanego adresu",
      "At least 1 digit, 1 lowercase and 1 uppercase": "Przynajmniej jedna cyfra, 1 mała i 1 duża litera",
      "Please verify your email first. Check the email and follow the link!": "Proszę najpierw zweryfikowac adres e-mail. Sprawdź swojego maila i podążaj za linkiem!",
      "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.": "Nowy e-mail został wysłany na twój adres. Jeśli wiadomość nie pojawi się w skrzynce odbiorczej, proszę sprawdzić w folderze ze sapmem.",
      "Match failed": "Błędne dopasowanie",
      "Unknown error": "Nieznany błąd",
      "Error, too many requests. Please slow down. You must wait 1 seconds before trying again.": "Błąd, zbyt dużo żądań. Proszę zwolnić. Prosimy odczekać 1 sekundę przed kolejną próbą."
    }
  }
};

T9n.map("pl", pl);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/pt.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var pt;

pt = {
  t9Name: 'Português',
  add: "Adicionar",
  and: "e",
  back: "Voltar",
  cancel: "Cancelar",
  changePassword: "Alterar senha",
  choosePassword: "Escolha uma senha",
  clickAgree: "Ao clicar em Criar Conta, você estará reconhecendo que aceita nossos Termos de Uso",
  configure: "Configurar",
  createAccount: "Criar Conta",
  currentPassword: "Senha Atual",
  dontHaveAnAccount: "Não tem conta?",
  email: "E-mail",
  emailAddress: "Endereço de e-mail",
  emailResetLink: "E-mail com link para gerar Nova Senha",
  forgotPassword: "Esqueceu sua senha?",
  ifYouAlreadyHaveAnAccount: "Se você já tem uma conta",
  newPassword: "Nova Senha",
  newPasswordAgain: "Nova Senha (novamente)",
  optional: "Opcional",
  OR: "OU",
  password: "Senha",
  passwordAgain: "Senha (novamente)",
  privacyPolicy: "Política de Privacidade",
  remove: "remover",
  resetYourPassword: "Gerar nova senha",
  setPassword: "Cadastrar Senha",
  sign: "Entrar",
  signIn: "Entrar",
  signin: "entrar",
  signOut: "Sair",
  signUp: "Criar conta",
  signupCode: "Código de Registro",
  signUpWithYourEmailAddress: "Criar conta utilizando seu endereço de e-mail",
  terms: "Termos de Uso",
  updateYourPassword: "Atualizar senha",
  username: "Nome de usuário",
  usernameOrEmail: "Usuário ou e-mail",
  "with": "com",
  maxAllowedLength: "Tamanho máximo permitido",
  minRequiredLength: "Tamanho Mínimo requerido",
  resendVerificationEmail: "Reenviar e-mail de verificação",
  resendVerificationEmailLink_pre: "Perdeu o e-mail de verificação?",
  resendVerificationEmailLink_link: "Enviar novamente",
  enterPassword: "Digite a senha",
  enterNewPassword: "Digite a nova senha",
  enterEmail: "Digite o e-mail",
  enterUsername: "Digite o nome de usuário",
  enterUsernameOrEmail: "Digite o nome de usuário ou e-mail",
  orUse: "Ou use",
  info: {
    emailSent: "E-mail enviado",
    emailVerified: "E-mail verificado",
    passwordChanged: "Senha atualizada",
    passwordReset: "Senha alterada"
  },
  alert: {
    ok: 'Ok',
    type: {
      info: 'Aviso',
      error: 'Erro',
      warning: 'Atenção'
    }
  },
  error: {
    emailRequired: "E-mail é obrigatório.",
    minChar: "Senha requer um mínimo de 7 caracteres.",
    pwdsDontMatch: "Senhas não coincidem",
    pwOneDigit: "A Senha deve conter pelo menos um dígito.",
    pwOneLetter: "A Senha deve conter pelo menos uma letra.",
    signInRequired: "Você precisa estar logado para fazer isso.",
    signupCodeIncorrect: "Código de acesso incorreto.",
    signupCodeRequired: "É necessário um código de acesso.",
    usernameIsEmail: "Nome de usuário não pode ser um endereço de e-mail.",
    usernameRequired: "Nome de usuário é obrigatório.",
    accounts: {
      "Email already exists.": "E-mail já existe.",
      "Email doesn't match the criteria.": "E-mail inválido.",
      "Invalid login token": "Token de login inválido",
      "Login forbidden": "Login não permitido",
      "Service unknown": "Serviço desconhecido",
      "Unrecognized options for login request": "Opções desconhecidas para solicitação de login",
      "User validation failed": "Validação de usuário falhou",
      "Username already exists.": "Nome de usuário já existe.",
      "You are not logged in.": "Você não está logado.",
      "You've been logged out by the server. Please log in again.": "Você foi desconectado pelo servidor. Por favor, efetue login novamente.",
      "Your session has expired. Please log in again.": "Sua sessão expirou. Por favor, efetue login novamente.",
      "Already verified": "Já verificado",
      "Invalid email or username": "Nome de usuário ou e-mail inválido",
      "Internal server error": "Erro interno do servidor",
      "undefined": "Algo não está certo",
      "No matching login attempt found": "Não foi encontrada nenhuma tentativa de login que coincida.",
      "Password is old. Please reset your password.": "Senha expirou. Por favor, cadastre uma nova senha.",
      "Incorrect password": "Senha incorreta",
      "Invalid email": "E-mail inválido",
      "Must be logged in": "É necessário efetuar login",
      "Need to set a username or email": "É necessário configurar um Nome de Usuário ou E-mail",
      "old password format": "Formato de senha antigo",
      "Password may not be empty": "Senha não pode estar em branco",
      "Signups forbidden": "Não permitido Criar Conta",
      "Token expired": "Token expirou",
      "Token has invalid email address": "Token tem endereço de e-mail inválido",
      "User has no password set": "Usuário não possui senha cadastrada",
      "User not found": "Usuário não encontrado",
      "Verify email link expired": "O link de verificação de e-mail expirou",
      "Verify email link is for unknown address": "O link de verificação de e-mail está configurado para um endereço desconhecido",
      "At least 1 digit, 1 lowercase and 1 uppercase": "Pelo menos 1 número, 1 letra minúscula and 1 maiúscula",
      "Please verify your email first. Check the email and follow the link!": "Por favor, verifique seu e-mail primeiro. Verifique o e-mail e abra o link!",
      "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.": "Um novo e-mail foi enviado para você. Se o e-mail não aparecer na sua caixa de entrada, verifique a sua caixa de spam.",
      "Match failed": "Senhas não coincidem",
      "Unknown error": "Erro desconhecido",
      "Error, too many requests. Please slow down. You must wait 1 seconds before trying again.": "Erro, muitas tentativas. Por favor, diminua o ritmo. Você deve aguardar 1 segundo antes de tentar novamente."
    }
  }
};

T9n.map("pt", pt);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/pt_PT.coffee.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var pt_PT;

pt_PT = {
  add: "adicionar",
  and: "e",
  back: "voltar",
  changePassword: "Alterar palavra-passe",
  choosePassword: "Escolha uma palavra-passe",
  clickAgree: "Ao clicar em Registar, está a aceitar os nossos",
  configure: "Configurar",
  createAccount: "Criar uma Conta",
  currentPassword: "Palavra-passe Atual",
  dontHaveAnAccount: "Não tem conta?",
  email: "E-mail",
  emailAddress: "Endereço de e-mail",
  emailResetLink: "Enviar e-mail para redefinir a palavra-passe",
  forgotPassword: "Esqueci-me da palavra-passe",
  ifYouAlreadyHaveAnAccount: "Se já tem uma conta",
  newPassword: "Nova Palavra-passe",
  newPasswordAgain: "Nova Palavra-passe (novamente)",
  optional: "Opcional",
  OR: "OU",
  password: "Palavra-passe",
  passwordAgain: "Palavra-passe (novamente)",
  privacyPolicy: "Política de Privacidade",
  remove: "remover",
  resetYourPassword: "Redefinir a palavra-passe",
  setPassword: "Definir Palavra-passe",
  sign: "Iniciar",
  signIn: "Iniciar Sessão",
  signin: "iniciar sessão",
  signOut: "Sair",
  signUp: "Criar conta",
  signupCode: "Código de Registo",
  signUpWithYourEmailAddress: "Registar com o endereço de e-mail",
  terms: "Termos de Uso",
  updateYourPassword: "Alterar a palavra-passe",
  username: "Nome do ulilizador",
  usernameOrEmail: "Ulilizador ou e-mail",
  "with": "com",
  info: {
    emailSent: "E-mail enviado",
    emailVerified: "E-mail verificado",
    passwordChanged: "Palavra-passe alterada",
    passwordReset: "Palavra-passe redefinida"
  },
  error: {
    emailRequired: "O e-mail é obrigatório.",
    minChar: "A palavra-passe tem de ter no mínimo 7 caracteres.",
    pwdsDontMatch: "As palavra-passes não coincidem",
    pwOneDigit: "A palavra-passe tem de conter pelo menos um dígito.",
    pwOneLetter: "A palavra-passe tem de conter pelo menos uma letra.",
    signInRequired: "É necessário iniciar sessão para fazer isso.",
    signupCodeIncorrect: "Código de registo incorreto.",
    signupCodeRequired: "É necessário um código de registo.",
    usernameIsEmail: "O nome do utilizador não pode ser um endereço de e-mail.",
    usernameRequired: "O nome de usuário é obrigatório.",
    accounts: {
      "Email already exists.": "O e-mail já existe.",
      "Email doesn't match the criteria.": "E-mail inválido.",
      "Invalid login token": "Token de início de sessão inválido",
      "Login forbidden": "Início de sessão impedido",
      "Service unknown": "Serviço desconhecido",
      "Unrecognized options for login request": "Pedido de início de sessão com opções não reconhecidas",
      "User validation failed": "A validação do utilizador falhou",
      "Username already exists.": "O nome do utilizador já existe.",
      "You are not logged in.": "Não tem sessão iniciada.",
      "You've been logged out by the server. Please log in again.": "Sessão terminada pelo servidor. Por favor, inicie sessão novamente.",
      "Your session has expired. Please log in again.": "A sua sessão expirou. Por favor, inicie sessão novamente.",
      "No matching login attempt found": "Não foi encontrada nenhuma tentativa de início de sessão que coincida.",
      "Password is old. Please reset your password.": "A palavra-passe é antiga. Por favor, redefina a sua palavra-passe.",
      "Incorrect password": "Palavra-passe incorreta",
      "Invalid email": "E-mail inválido",
      "Must be logged in": "É necessário iniciar sessão",
      "Need to set a username or email": "É necessário definir um nome de utilizador ou e-mail",
      "old password format": "Formato de palavra-passe antigo",
      "Password may not be empty": "A palavra-passe não pode estar em branco",
      "Signups forbidden": "Criação de contas proibida",
      "Token expired": "O token expirou",
      "Token has invalid email address": "O token tem um endereço de e-mail inválido",
      "User has no password set": "O utilizador não defeniu a palavra-passe",
      "User not found": "Utilizador não encontrado",
      "Verify email link expired": "O link de verificação de e-mail expirou",
      "Verify email link is for unknown address": "O link de verificação de e-mail está definido para um endereço desconhecido",
      "Match failed": "Comparação falhou",
      "Unknown error": "Erro desconhecido"
    }
  }
};

T9n.map("pt_PT", pt_PT);

T9n.map("pt-PT", pt_PT);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/ro.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var ro;

ro = {
  add: "adaugă",
  and: "și",
  back: "înapoi",
  changePassword: "Schimbare parolă",
  choosePassword: "Alege o parolă",
  clickAgree: "Click pe Register, sunteți de acord",
  configure: "Configurare",
  createAccount: "Creați un cont",
  currentPassword: "Parola curentă",
  dontHaveAnAccount: "Nu ai un cont?",
  email: "E-mail",
  emailAddress: "Adresa de e-mail",
  emailResetLink: "Link de resetare parolă",
  forgotPassword: "Ți-ai uitat parola?",
  ifYouAlreadyHaveAnAccount: "Dacă ai deja un cont",
  newPassword: "Parolă nouă",
  newPasswordAgain: "Parolă nouă (din nou)",
  optional: "Opțional",
  OR: "SAU",
  password: "Parolă",
  passwordAgain: "Parolă (din nou)",
  privacyPolicy: "Politica de confidentialitate",
  remove: "Elimină",
  resetYourPassword: "Schimbati parola",
  setPassword: "Setati parola",
  sign: "Înregistrează",
  signIn: "Autentificare",
  signin: "Autentificare",
  signOut: "Deconectare",
  signUp: "Înregistrare",
  signupCode: "Codul de înregistrare",
  signUpWithYourEmailAddress: "Înregistrați-vă adresa de e-mail",
  terms: "Condiții de utilizare",
  updateYourPassword: "Actualizați parola dvs.",
  username: "Nume utilizator",
  usernameOrEmail: "Nume utilizator sau e-mail",
  "with": "cu",
  info: {
    emailSent: "Email trimis",
    emailVerified: "Email verificat",
    passwordChanged: "Parola a fost schimbata",
    passwordReset: "Resetare parola"
  },
  error: {
    emailRequired: "Introduceti Email-ul.",
    minChar: "Parolă minima de 7 caractere ",
    pwdsDontMatch: "Parolele nu se potrivesc",
    pwOneDigit: "Parola trebuie să contină cel puțin o cifră.",
    pwOneLetter: "Parola necesită o scrisoare.",
    signInRequired: "Autentificare.",
    signupCodeIncorrect: "Codul de înregistrare este incorectă.",
    signupCodeRequired: "Aveti nevoie de cod de înregistrare.",
    usernameIsEmail: "Numele de utilizator nu poate fi o adresă de e-mail.",
    usernameRequired: "Introduceti numele de utilizator.",
    accounts: {
      "Email already exists.": "E-mail există deja.",
      "Email doesn't match the criteria.": "E-mail nu se potrivește cu criteriile.",
      "Invalid login token": "Token invalid",
      "Login forbidden": "Autentificare interzisă",
      "Service unknown": "Service necunoscut",
      "Unrecognized options for login request": "Opțiuni nerecunoscute de cerere de conectare",
      "User validation failed": "Validare utilizator nereușit",
      "Username already exists.": "Numele de utilizator existent.",
      "You are not logged in.": "Nu sunteti autentificat.",
      "You've been logged out by the server. Please log in again.": "Ați fost deconectat de către server rugam sa va logati din nou.",
      "Your session has expired. Please log in again.": "Sesiunea a expirat rugam sa va logati din nou.",
      "No matching login attempt found": "Autentificare nereusită",
      "Password is old. Please reset your password.": "Parola expirata, Vă rugăm să resetati parola.",
      "Incorrect password": "Parola incorectă",
      "Invalid email": "E-mail invalid",
      "Must be logged in": "Trebuie sa fii logat",
      "Need to set a username or email": "Adaugati un nume utilizator sau un e-mail",
      "old password format": "Parola cu format vechi",
      "Password may not be empty": "Parola nu poate fi gol",
      "Signups forbidden": "Înscrieri interzisă",
      "Token expired": "Token expirat",
      "Token has invalid email address": "Token are adresă de email invalidă",
      "User has no password set": "Utilizator nu are parola setată",
      "User not found": "Utilizator nu a fost găsit",
      "Verify email link expired": "Link-ul de e-mail a expirat",
      "Verify email link is for unknown address": "Link-ul de e-mail nu corespunde",
      "Match failed": "Potrivire nereușită",
      "Unknown error": "Eroare necunoscută"
    }
  }
};

T9n.map("ro", ro);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/ru.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var ru;

ru = {
  add: "добавить",
  and: "и",
  back: "назад",
  changePassword: "Сменить пароль",
  choosePassword: "Придумайте пароль",
  clickAgree: "Нажав на Регистрация, вы соглашаетесь с условиями",
  configure: "Конфигурировать",
  createAccount: "Создать аккаунт",
  currentPassword: "Текущий пароль",
  dontHaveAnAccount: "Нет аккаунта?",
  email: "Email",
  emailAddress: "Email",
  emailResetLink: "Отправить ссылку для сброса",
  forgotPassword: "Забыли пароль?",
  ifYouAlreadyHaveAnAccount: "Если у вас уже есть аккаунт",
  newPassword: "Новый пароль",
  newPasswordAgain: "Новый пароль (еще раз)",
  optional: "Необязательно",
  OR: "ИЛИ",
  password: "Пароль",
  passwordAgain: "Пароль (еще раз)",
  privacyPolicy: "Политики безопасности",
  remove: "Удалить",
  resetYourPassword: "Сбросить пароль",
  setPassword: "Установить пароль",
  sign: "Подпись",
  signIn: "Войти",
  signin: "войти",
  signOut: "Выйти",
  signUp: "Регистрация",
  signupCode: "Регистрационный код",
  signUpWithYourEmailAddress: "Зарегистрируйтесь с вашим email адресом",
  terms: "Условиями пользования",
  updateYourPassword: "Обновить пароль",
  username: "Имя пользователя",
  usernameOrEmail: "Имя пользователя или email",
  "with": "через",
  info: {
    emailSent: "Email отправлен",
    emailVerified: "Email прошел проверку",
    passwordChanged: "Пароль изменен",
    passwordReset: "Пароль сброшен"
  },
  error: {
    emailRequired: "Email обязательно.",
    minChar: "Минимальное кол-во символов для пароля 7.",
    pwdsDontMatch: "Пароли не совпадают",
    pwOneDigit: "В пароле должна быть хотя бы одна цифра.",
    pwOneLetter: "В пароле должна быть хотя бы одна буква.",
    signInRequired: "Необходимо войти для чтобы продолжить.",
    signupCodeIncorrect: "Неправильный регистрационный код.",
    signupCodeRequired: "Необходим регистрационый код.",
    usernameIsEmail: "Имя пользователя не может быть адресом email.",
    usernameRequired: "Имя пользователя обязательно.",
    accounts: {
      "Email already exists.": "Email уже существует",
      "Email doesn't match the criteria.": "Email не соответствует критериям.",
      "Invalid login token": "Неверный токен для входа",
      "Login forbidden": "Вход запрещен",
      "Service unknown": "Cервис неизвестен",
      "Unrecognized options for login request": "Неизвестные параметры для запроса входа",
      "User validation failed": "Проверка пользователя неудалась",
      "Username already exists.": "Пользователь существует.",
      "You are not logged in.": "Вы не вошли.",
      "You've been logged out by the server. Please log in again.": "Сервер инициировал выход. Пожалуйста войдите еще раз.",
      "Your session has expired. Please log in again.": "Ваша сессия устарела. Пожалуйста войдите еще раз.",
      "No matching login attempt found": "Не было найдено соответствующей попытки войти",
      "Password is old. Please reset your password.": "Пароль устарел. Пожалуйста, сбросьте Ваш пароль.",
      "Incorrect password": "Неправильный пароль",
      "Invalid email": "Несуществующий Email",
      "Must be logged in": "Необходимо войти",
      "Need to set a username or email": "Необходимо имя пользователя или email",
      "old password format": "старый формат пароля",
      "Password may not be empty": "Пароль не может быть пустым",
      "Signups forbidden": "Регистрация отключена",
      "Token expired": "Время действия токена истекло",
      "Token has invalid email address": "У токена неправильный email адрес",
      "User has no password set": "У пользователя не установлен пароль",
      "User not found": "Пользователь не найден",
      "Verify email link expired": "Ссылка подтверждения email устарела",
      "Verify email link is for unknown address": "Ссылка подтверждения email для неизвестного адреса",
      "Match failed": "Не совпадают",
      "Unknown error": "Неизвестная ошибка"
    }
  }
};

T9n.map("ru", ru);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/sk.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var sk;

sk = {
  add: "pridať",
  and: "a",
  back: "späť",
  changePassword: "Zmena hesla",
  choosePassword: "Zvoľte si heslo",
  clickAgree: "Stlačením tlačidla \"Registrovať\" akceptujete",
  configure: "Nastaviť",
  createAccount: "Vytvoriť konto",
  currentPassword: "Súčasné heslo",
  dontHaveAnAccount: "Nemáte účet?",
  email: "Email",
  emailAddress: "Emailová adresa",
  emailResetLink: "Odoslať na email overovací odkaz",
  forgotPassword: "Zabudli ste heslo?",
  ifYouAlreadyHaveAnAccount: "Ak už máte vytvorený účet prejdite na",
  newPassword: "Nové heslo",
  newPasswordAgain: "Nové heslo (opakujte)",
  optional: "Voliteľné",
  OR: "alebo",
  password: "Heslo",
  passwordAgain: "Heslo (opakujte)",
  privacyPolicy: "pravidlá ochrany súkromia",
  remove: "odstrániť",
  resetYourPassword: "Obnovenie hesla",
  setPassword: "Nastaviť heslo",
  sign: "Prihlásiť",
  signIn: "Prihlásenie",
  signin: "prihlásenie",
  signOut: "Odhlásiť",
  signUp: "Registrovať",
  signupCode: "Registračný kód",
  signUpWithYourEmailAddress: "Registrácia pomocou emailovej adresy",
  terms: "pravidlá požívania",
  updateYourPassword: "Aktualizovať heslo",
  username: "Užívateľské meno",
  usernameOrEmail: "Užívateľské meno alebo email",
  "with": "s",
  info: {
    emailSent: "Email odoslaný",
    emailVerified: "Email bol overený",
    passwordChanged: "Heslo bolo zmenené",
    passwordReset: "Obnova hesla"
  },
  error: {
    emailRequired: "Email je vyžadovaný.",
    minChar: "minimálne 7 znakov heslo.",
    pwdsDontMatch: "Heslá sa nezhodujú",
    pwOneDigit: "Heslo musí mať aspoň jeden znak.",
    pwOneLetter: "Heslo musí mať aspoň 1 znak..",
    signInRequired: "Je vyžadované prihlásenie na túto akciu.",
    signupCodeIncorrect: "Registračný kód je nesprávny.",
    signupCodeRequired: "Je vyžadovaný registračný kód.",
    usernameIsEmail: "Užvateľské meno nemôže byť email.",
    usernameRequired: "Je vyžadované užívateľské meno.",
    accounts: {
      "Email already exists.": "Email už bol registrovaný.",
      "Email doesn't match the criteria.": "Email nevyhovuje kritériam.",
      "Invalid login token": "Neplatný token prihlásenia",
      "Login forbidden": "Prihlásenie neuspešné",
      "Service unknown": "Neznáma služba",
      "Unrecognized options for login request": "Neroznali sa podmienky pre požiadavku prihlásenia",
      "User validation failed": "Overenie užívateľa zlyhalo",
      "Username already exists.": "Užívateľ už existuje.",
      "You are not logged in.": "Vyžaduje sa prihlásenie.",
      "You've been logged out by the server. Please log in again.": "Boli ste odhlásený/á zo servera. Prosím prihláste sa znova.",
      "Your session has expired. Please log in again.": "Vaše príhlásenie expirovalo. Prosím prihláste sa znova.",
      "No matching login attempt found": "Prihlásenie nesúhlasí",
      "Password is old. Please reset your password.": "Heslo je zastaralé. Prosím obnovte si ho.",
      "Incorrect password": "Nesprávne heslo",
      "Invalid email": "Nesprávaný email",
      "Must be logged in": "Je vyžadované prihlásenie",
      "Need to set a username or email": "Je potrebné nastaviť užívateľské meno a email",
      "old password format": "formát starého hesla",
      "Password may not be empty": "Heslo nesmie byť prázdne",
      "Signups forbidden": "Prihlásenie je zakázané",
      "Token expired": "Token expiroval",
      "Token has invalid email address": "Token obsahuje nesprávnu emailovú adresu",
      "User has no password set": "Užívateľ nemá nastavené heslo",
      "User not found": "Užívateľ sa nenašiel",
      "Verify email link expired": "Odkazu pre overenie emailu vypršala platnosť.",
      "Verify email link is for unknown address": "Overovací odkaz je z nenámej adresy",
      "Match failed": "Nezhodné",
      "Unknown error": "Neznáma chyba"
    }
  }
};

T9n.map("sk", sk);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/sl.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var sl;

sl = {
  add: "dodaj",
  and: "in",
  back: "nazaj",
  changePassword: "Spremeni geslo",
  choosePassword: "Izberi geslo",
  clickAgree: "S klikom na Registracija se strinjaš",
  configure: "Nastavi",
  createAccount: "Nova registracija",
  currentPassword: "Trenutno geslo",
  dontHaveAnAccount: "Nisi registriran(a)?",
  email: "Email",
  emailAddress: "Email naslov",
  emailResetLink: "Pošlji ponastavitveno povezavo",
  forgotPassword: "Pozabljeno geslo?",
  ifYouAlreadyHaveAnAccount: "Če si že registriran(a),",
  newPassword: "Novo geslo",
  newPasswordAgain: "Novo geslo (ponovno)",
  optional: "Po želji",
  OR: "ALI",
  password: "Geslo",
  passwordAgain: "Geslo (ponovno)",
  privacyPolicy: "z našimi pogoji uporabe",
  remove: "briši",
  resetYourPassword: "Ponastavi geslo",
  setPassword: "Nastavi geslo",
  sign: "Prijava",
  signIn: "Prijava",
  signin: "se prijavi",
  signOut: "Odjava",
  signUp: "Registracija",
  signupCode: "Prijavna koda",
  signUpWithYourEmailAddress: "Prijava z email naslovom",
  terms: "Pogoji uporabe",
  updateYourPassword: "Spremeni geslo",
  username: "Uporabniško ime",
  usernameOrEmail: "Uporabniško ime ali email",
  "with": "z",
  info: {
    emailSent: "E-pošta poslana",
    emailVerified: "Email naslov preverjen",
    passwordChanged: "Geslo spremenjeno",
    passwordReset: "Geslo ponastavljeno"
  },
  error: {
    emailRequired: "Email je obvezen vnos.",
    minChar: "Geslo mora imeti vsaj sedem znakov.",
    pwdsDontMatch: "Gesli se ne ujemata",
    pwOneDigit: "V geslu mora biti vsaj ena številka.",
    pwOneLetter: "V geslu mora biti vsaj ena črka.",
    signInRequired: "Za to moraš biti prijavljen(a).",
    signupCodeIncorrect: "Prijavna koda je napačna.",
    signupCodeRequired: "Prijavna koda je obvezen vnos.",
    usernameIsEmail: "Uporabniško ime ne more biti email naslov.",
    usernameRequired: "Uporabniško ime je obvezen vnos.",
    accounts: {
      "Email already exists.": "Email že obstaja.",
      "Email doesn't match the criteria.": "Email ne odgovarja kriterijem.",
      "Invalid login token": "Napačen prijavni žeton",
      "Login forbidden": "Prijava ni dovoljena",
      "Service unknown": "Neznana storitev",
      "Unrecognized options for login request": "Neznane možnosti v prijavnem zahtevku",
      "User validation failed": "Preverjanje uporabnika neuspešno",
      "Username already exists.": "Uporabniško ime že obstaja",
      "You are not logged in.": "Nisi prijavljen(a).",
      "You've been logged out by the server. Please log in again.": "Odjavljen(a) si s strežnika. Ponovi prijavo.",
      "Your session has expired. Please log in again.": "Seja je potekla. Ponovi prijavo.",
      "No matching login attempt found": "Prijava ne obstaja",
      "Password is old. Please reset your password.": "Geslo je staro. Zamenjaj ga.",
      "Incorrect password": "Napačno geslo",
      "Invalid email": "Napačen email",
      "Must be logged in": "Moraš biti prijavljane(a)",
      "Need to set a username or email": "Prijava ali email sta obvezna",
      "old password format": "stara oblika gesla",
      "Password may not be empty": "Geslo ne sme biti prazno",
      "Signups forbidden": "Prijave onemogočene",
      "Token expired": "Žeton je potekel",
      "Token has invalid email address": "Žeton vsebuje napačen email",
      "User has no password set": "Uporabnik nima gesla",
      "User not found": "Uporabnik ne obstaja",
      "Verify email link expired": "Povezava za potrditev je potekla",
      "Verify email link is for unknown address": "Povezava za potrditev vsebuje neznan naslov",
      "Match failed": "Prijava neuspešna",
      "Unknown error": "Neznana napaka"
    }
  }
};

T9n.map("sl", sl);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/sv.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var sv;

sv = {
  add: "lägg till",
  and: "och",
  back: "tillbaka",
  cancel: "Avbryt",
  changePassword: "Ändra lösenord",
  choosePassword: "Välj lösenord",
  clickAgree: "När du väljer att bli medlem så godkänner du också vår",
  configure: "Konfigurera",
  createAccount: "Skapa ett konto",
  currentPassword: "Nuvarande lösenord",
  dontHaveAnAccount: "Har du inget konto?",
  email: "E-postadress",
  emailAddress: "E-postadress",
  emailResetLink: "Återställningslänk för e-post",
  forgotPassword: "Glömt ditt lösenord?",
  ifYouAlreadyHaveAnAccount: "Är du redan medlem?",
  newPassword: "Nytt lösenord",
  newPasswordAgain: "Nytt lösenord (upprepa)",
  optional: "Valfri",
  OR: "ELLER",
  password: "Lösenord",
  passwordAgain: "Lösenord (upprepa)",
  privacyPolicy: "integritetspolicy",
  remove: "ta bort",
  resetYourPassword: "Återställ ditt lösenord",
  setPassword: "Välj lösenord",
  sign: "Logga",
  signIn: "Logga in",
  signin: "logga in",
  signOut: "Logga ut",
  signUp: "Bli medlem",
  signupCode: "Registreringskod",
  signUpWithYourEmailAddress: "Bli medlem med e-postadress",
  terms: "användarvillkor",
  updateYourPassword: "Uppdatera ditt lösenord",
  username: "Användarnamn",
  usernameOrEmail: "Användarnamn eller e-postadress",
  "with": "med",
  enterPassword: "Lösenord",
  enterNewPassword: "Nytt lösenord",
  enterEmail: "E-post",
  enterUsername: "Användarnamn",
  enterUsernameOrEmail: "Användarnamn eller e-post",
  orUse: "Eller använd",
  info: {
    emailSent: "E-post skickades",
    emailVerified: "E-post verifierades",
    passwordChanged: "Lösenordet har ändrats",
    passwordReset: "Återställ lösenordet"
  },
  alert: {
    ok: 'Ok',
    type: {
      info: 'Info',
      error: 'Fel',
      warning: 'Varning'
    }
  },
  error: {
    emailRequired: "Det krävs en e-postaddress.",
    minChar: "Det krävs minst 7 tecken i ditt lösenord.",
    pwdsDontMatch: "Lösenorden matchar inte.",
    pwOneDigit: "Lösenordet måste ha minst 1 siffra.",
    pwOneLetter: "Lösenordet måste ha minst 1 bokstav.",
    signInRequired: "Inloggning krävs här.",
    signupCodeIncorrect: "Registreringskoden är felaktig.",
    signupCodeRequired: "Det krävs en registreringskod.",
    usernameIsEmail: "Användarnamnet kan inte vara en e-postadress.",
    usernameRequired: "Det krävs ett användarnamn.",
    accounts: {
      "Email already exists.": "E-postadressen finns redan.",
      "Email doesn't match the criteria.": "E-postadressen uppfyller inte kriterierna.",
      "Invalid login token": "Felaktig login-token",
      "Login forbidden": "Inloggning tillåts ej",
      "Service unknown": "Okänd service",
      "Unrecognized options for login request": "Okända val för inloggningsförsöket",
      "User validation failed": "Validering av användare misslyckades",
      "Username already exists.": "Användarnamn finns redan.",
      "You are not logged in.": "Du är inte inloggad.",
      "You've been logged out by the server. Please log in again.": "Du har loggats ut av servern. Vänligen logga in igen.",
      "Your session has expired. Please log in again.": "Din session har gått ut. Vänligen ligga in igen.",
      "Invalid email or username": "Ogiltig e-post eller användarnamn",
      "Internal server error": "Internt server problem",
      "undefined": "Något gick fel",
      "No matching login attempt found": "Inget matchande loginförsök kunde hittas",
      "Password is old. Please reset your password.": "Ditt lösenord är gammalt. Vänligen återställ ditt lösenord.",
      "Incorrect password": "Felaktigt lösenord",
      "Invalid email": "Ogiltig e-postadress",
      "Must be logged in": "Måste vara inloggad",
      "Need to set a username or email": "Ett användarnamn eller en e-postadress krävs.",
      "old password format": "gammalt lösenordsformat",
      "Password may not be empty": "Lösenordet får inte vara tomt",
      "Signups forbidden": "Registrering förbjuden",
      "Token expired": "Token har gått ut",
      "Token has invalid email address": "Token har ogiltig e-postadress",
      "User has no password set": "Användaren har inget lösenord",
      "User not found": "Användaren hittades inte",
      "Verify email link expired": "Länken för att verifera e-postadress har gått ut",
      "Verify email link is for unknown address": "Länken för att verifiera e-postadress är för en okänd adress.",
      "Match failed": "Matchning misslyckades",
      "Unknown error": "Okänt fel"
    }
  }
};

T9n.map("sv", sv);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/th.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var th;

th = {
  t9Name: 'Thai',
  add: "เพิ่ม",
  and: "และ",
  back: "ย้อนกลับ",
  cancel: "ยกเลิก",
  changePassword: "เปลี่ยนรหัสผ่าน",
  choosePassword: "เลือกรหัสผ่าน",
  clickAgree: "ด้วยการคลิกสมัครและยอมรับ",
  configure: "กำหนดค่า",
  createAccount: "สร้างบัญชี",
  currentPassword: "รหัสปัจจุบัน",
  dontHaveAnAccount: "ยังไม่มีบัญชีใช่ไหม",
  email: "อีเมล์",
  emailAddress: "ที่อยู่อีเมล์",
  emailResetLink: "อีเมล์สำหรับรหัสใหม่",
  forgotPassword: "คุณลืมรหัสใช่ไหม",
  ifYouAlreadyHaveAnAccount: "ถ้าคุณมีบัญชีแล้ว",
  newPassword: "รหัสใหม่",
  newPasswordAgain: "รหัสใหม่ (อีกครั้ง)",
  optional: "ไม่จำเป็น",
  OR: "หรือ",
  password: "รหัสผ่าน",
  passwordAgain: "รหัสผ่าน (อีกครั้ง)",
  privacyPolicy: "นโยบายความเป็นส่วนตัว",
  remove: "ลบ",
  resetYourPassword: "ตั้งรหัสผ่านใหม่",
  setPassword: "ตั้งรหัสผ่าน",
  sign: "สัญลักษณ์",
  signIn: "เข้าสู่ระบบ",
  signin: "เข้าสู่ระบบ",
  signOut: "ออกจากระบบ",
  signUp: "สมัคร",
  signupCode: "รหัสการลงทะเบียน",
  signUpWithYourEmailAddress: "สมัครด้วยอีเมล์",
  terms: "ข้อกำหนดใช้งาน",
  updateYourPassword: "แก้ไขรหัสของคุณ",
  username: "ชื่อผู้ใช้งาน",
  usernameOrEmail: "ชื่อผู้ใช้งานหรืออีเมล์",
  "with": "กับ",
  maxAllowedLength: "ความยาวสูงสุดที่อนุญาต",
  minRequiredLength: "ความยาวต่ำสุดที่อนุญาต",
  resendVerificationEmail: "ส่งอีเมล์อีกครั้ง",
  resendVerificationEmailLink_pre: "อีเมล์ยืนยัน",
  resendVerificationEmailLink_link: "ส่งอีกครั้ง",
  enterPassword: "ป้อนรหัสผ่าน",
  enterNewPassword: "ป้อนรหัสผ่านใหม่",
  enterEmail: "ป้อนอีเมล์",
  enterUsername: "ป้อนชื่อผู้ใช้งาน",
  enterUsernameOrEmail: "ป้อนชื่อผู้ใช้งานหรืออีเมล์",
  orUse: "หรือใช้",
  info: {
    emailSent: "ส่งอีเมล์",
    emailVerified: "ตรวจสอบอีเมล์",
    passwordChanged: "รหัสผ่านเปลี่ยนแล้ว",
    passwordReset: "ตั้งค่ารหัสผ่าน"
  },
  alert: {
    ok: 'ตกลง',
    type: {
      info: 'แจ้งให้ทราบ',
      error: 'ผิดพลาด',
      warning: 'เตือน'
    }
  },
  error: {
    emailRequired: "ต้องกรอกอีเมล์",
    minChar: "รหัสผ่านต้องมีอย่างน้อย 7 ตัวอักษร",
    pwdsDontMatch: "รหัสผ่านไม่ตรงกัน",
    pwOneDigit: "รหัสผ่านต้องมีอย่างน้อยหนึ่งหลัก",
    pwOneLetter: "รหัสผ่านต้องมีตัวอักษร 1 ตัว",
    signInRequired: "คุณต้องลงนามในการกระทำว่า",
    signupCodeIncorrect: "รหัสการลงทะเบียนไม่ถูกต้อง",
    signupCodeRequired: "ต้องการรหัสลงทะเบียน",
    usernameIsEmail: "ชื่อผู้ใช้งานไม่สามารถเป็นที่อยู่อีเมล์",
    usernameRequired: "ต้องการชื่อผู้ใช้งาน",
    accounts: {
      "Email already exists.": "อีเมล์มีอยู่แล้ว",
      "Email doesn't match the criteria.": "รูปแบบอีเมล์ไม่ถูกต้อง",
      "Invalid login token": "หลักฐานการเข้าสู่ระบบไม่ถูกต้อง",
      "Login forbidden": "ไม่อนุญาตให้เข้าสู่ระบบ",
      "Service unknown": "บริการที่ไม่รู้จัก",
      "Unrecognized options for login request": "ตัวเลือกที่ไม่รู้จักสำหรับคำขอเข้าสู่ระบบ",
      "User validation failed": "การตรวจสอบผู้ใช้ล้มเหลว",
      "Username already exists.": "ชื่อผู้ใช้มีอยู่แล้ว",
      "You are not logged in.": "คุณยังไม่ได้เข้าสู่ระบบ",
      "You've been logged out by the server. Please log in again.": "คุณได้ออกจากระบบโดยเซิร์ฟเวอร์ กรุณาเข้าสู่ระบบอีกครั้ง",
      "Your session has expired. Please log in again.": "session ของคุณหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง",
      "Already verified": "ยืนยันแล้ว",
      "Invalid email or username": "อีเมลหรือชื่อผู้ใช้ไม่ถูกต้อง",
      "Internal server error": "ข้อผิดพลาดภายในเซิร์ฟเวอร์",
      "undefined": "มีบางอย่างผิดพลาด",
      "No matching login attempt found": "ไม่พบการเข้าสู่ระบบ",
      "Password is old. Please reset your password.": "รหัสผ่านเก่า โปรดตั้งค่ารหัสผ่านของคุณใหม่",
      "Incorrect password": "รหัสผ่านผิดพลาด",
      "Invalid email": "อีเมล์ผิดพลาด",
      "Must be logged in": "ต้องเข้าสู่ระบบ",
      "Need to set a username or email": "จำเป็นที่จะต้องตั้งชื่อผู้ใช้หรืออีเมล์",
      "old password format": "รูปแบบรหัสผ่านเดิม",
      "Password may not be empty": "รหัสผ่านไม่เป็นค่าว่าง",
      "Signups forbidden": "ไม่อนุญาตให้สมัคร",
      "Token expired": "Token หมดอายุ",
      "Token has invalid email address": "Token มีที่อยู่อีเมลไม่ถูกต้อง",
      "User has no password set": "ผู้ใช้ยังไม่มีการตั้งรหัสผ่าน",
      "User not found": "ไม่พบชื่อผู้ใช้",
      "Verify email link expired": "ตรวจสอบการลิงค์อีเมลหมดอายุ",
      "Verify email link is for unknown address": "ไม่รู้จักลิงค์ตรวจสอบอีเมล์",
      "At least 1 digit, 1 lowercase and 1 uppercase": "อย่างน้อย 1 หลัก 1 ตัวอักษรเล็ก และ 1 ตัวอักษรใหญ่",
      "Please verify your email first. Check the email and follow the link!": "โปรดยืนยันอีเมลของคุณก่อน ตรวจสอบอีเมลและทำตามลิงค์!",
      "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.": "อีเมลใหม่ได้ถูกส่งไปให้คุณแล้ว ถ้าอีเมลไม่แสดงในกล่องจดหมายของคุณให้ตรวจสอบโฟลเดอร์ spam ของคุณ",
      "Match failed": "จับคู่ล้มเหลว",
      "Unknown error": "ไม่รู้ข้อผิดพลาด",
      "Error, too many requests. Please slow down. You must wait 1 seconds before trying again.": "ผิดพลาด ตอนนี้มีการร้องขอมากเกินไปโปรดรอ 1 วินาทีก่อนค่อยทำอีกครั้ง"
    }
  }
};

T9n.map("th", th);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/tr.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var tr;

tr = {
  add: "ekle",
  and: "ve",
  back: "geri",
  changePassword: "Şifre Değiştir",
  choosePassword: "Şifre Belirle",
  clickAgree: "Kayıta tıklayarak kabul etmiş olacağınız",
  configure: "Yapılandır",
  createAccount: "Hesap Oluştur",
  currentPassword: "Mevcut Şifre",
  dontHaveAnAccount: "Hesabın yok mu?",
  email: "Eposta",
  emailAddress: "Eposta Adresi",
  emailResetLink: "Email Reset Link",
  forgotPassword: "Şifreni mi unuttun?",
  ifYouAlreadyHaveAnAccount: "Zaten bir hesabın varsa",
  newPassword: "Yeni Şifre",
  newPasswordAgain: "Yeni Şifre (tekrar)",
  optional: "İsteğe Bağlı",
  OR: "VEYA",
  password: "Şifre",
  passwordAgain: "Şifre (tekrar)",
  privacyPolicy: "Gizlilik Politikası",
  remove: "kaldır",
  resetYourPassword: "Şifreni sıfırla",
  setPassword: "Şifre Belirle",
  sign: "Giriş",
  signIn: "Giriş",
  signin: "Giriş",
  signOut: "Çıkış",
  signUp: "Kayıt",
  signupCode: "Kayıt Kodu",
  signUpWithYourEmailAddress: "Eposta adresin ile kaydol",
  terms: "Kullanım Şartları",
  updateYourPassword: "Şifreni güncelle",
  username: "Kullanıcı adı",
  usernameOrEmail: "Kullanıcı adı veya şifre",
  "with": "için",
  info: {
    emailSent: "Eposta iletildi",
    emailVerified: "Eposta doğrulandı",
    passwordChanged: "Şifre değişti",
    passwordReset: "Şifre sıfırlandı"
  },
  error: {
    emailRequired: "Eposta gerekli.",
    minChar: "En az 7 karakterli şifre.",
    pwdsDontMatch: "Şifreler uyuşmuyor",
    pwOneDigit: "Şifre en az bir rakam içermeli.",
    pwOneLetter: "Şifre bir harf gerektiriyor.",
    signInRequired: "Bunun için önce giriş yapmış olmalısın.",
    signupCodeIncorrect: "Kayıt kodu hatalı.",
    signupCodeRequired: "Kayıt kodu gerekli.",
    usernameIsEmail: "Kullanıcı adı bir eposta adresi olamaz.",
    usernameRequired: "Kullanıcı adı gerekli.",
    accounts: {
      "Email already exists.": "Eposta zaten kayıtlı.",
      "Email doesn't match the criteria.": "Eposta kriterleri karşılamıyor.",
      "Invalid login token": "Geçersiz giriş işaretçisi",
      "Login forbidden": "Girişe izin verilmiyor",
      "Service unknown": "Servis tanınmıyor",
      "Unrecognized options for login request": "Giriş isteği için tanınmayan seçenekler",
      "User validation failed": "Kullanıcı doğrulama başarısız",
      "Username already exists.": "Kullanıcı adı zaten kayıtlı.",
      "You are not logged in.": "Kullanıcı girişi yapmadın.",
      "You've been logged out by the server. Please log in again.": "Sunucu tarafından çıkarıldın. Lütfen tekrar kullanıcı girişi yap.",
      "Your session has expired. Please log in again.": "Oturumun zaman aşımına uğradı. Lütfen tekrar kullanıcı girişi yap.",
      "No matching login attempt found": "Eşleşen bir giriş teşebbüsü bulunamadı",
      "Password is old. Please reset your password.": "Şifre eski. Lütfen şifreni sıfırla.",
      "Incorrect password": "Hatalı şifre",
      "Invalid email": "Hatalı eposta",
      "Must be logged in": "Giriş yapmış olmalısın",
      "Need to set a username or email": "Kullanıcı adı veya eposta tanımlamalısın",
      "old password format": "eski şifre biçimi",
      "Password may not be empty": "Şifre boş bırakılamaz",
      "Signups forbidden": "Kayıt yapmaya izin verilmiyor",
      "Token expired": "İşaretçinin süresi geçti",
      "Token has invalid email address": "İşaretçide geçersiz eposta adresi var",
      "User has no password set": "Kullanıcının şifresi tanımlanmamış",
      "User not found": "Kullanıcı bulunamadı",
      "Verify email link expired": "Eposta doğrulama bağlantısı zaman aşımına uğradı",
      "Verify email link is for unknown address": "Eposta doğrulama bağlantısı bilinmeyen bir adres içeriyor",
      "Match failed": "Eşleşme başarısız",
      "Unknown error": "Bilinmeyen hata"
    }
  }
};

T9n.map("tr", tr);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/uk.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var uk;

uk = {
  add: "додати",
  and: "та",
  back: "назад",
  changePassword: "Змінити пароль",
  choosePassword: "Придумайте пароль",
  clickAgree: "Натиснувши на Реєстрація ви погоджуєтеся з умовами",
  configure: "Налаштувати",
  createAccount: "Створити аккаунт",
  currentPassword: "Діючий пароль",
  dontHaveAnAccount: "Немає аккаунта?",
  email: "Email",
  emailAddress: "Email",
  emailResetLink: "Отримати посилання для оновлення паролю",
  forgotPassword: "Забули пароль?",
  ifYouAlreadyHaveAnAccount: "Якщо у вас вже є аккаунт:",
  newPassword: "Новий пароль",
  newPasswordAgain: "Новий пароль (ще раз)",
  optional: "Необов’язково",
  OR: "АБО",
  password: "Пароль",
  passwordAgain: "Пароль (ще раз)",
  privacyPolicy: "Політики безпеки",
  remove: "Видалити",
  resetYourPassword: "Відновити пароль",
  setPassword: "Встановити пароль",
  sign: "Підпис",
  signIn: "Увійти",
  signin: "увійти",
  signOut: "Вийти",
  signUp: "Зареєструватися",
  signupCode: "Реєстраційний код",
  signUpWithYourEmailAddress: "Зареєструйтесь з вашою email адресою",
  terms: "Умовами користування",
  updateYourPassword: "Оновити пароль",
  username: "Ім’я користувача",
  usernameOrEmail: "Ім’я користувача або email",
  "with": "з",
  info: {
    emailSent: "Email відправлено",
    emailVerified: "Email пройшов перевірку",
    passwordChanged: "Пароль змінено",
    passwordReset: "Пароль скинуто"
  },
  error: {
    emailRequired: "Email є обов’язковим.",
    minChar: "Мінімальна кіл-ть символів для паролю 7.",
    pwdsDontMatch: "Паролі не співпадають",
    pwOneDigit: "Пароль повинен містити хоча б одну цифру.",
    pwOneLetter: "Пароль повинен містити хоча б одну букву.",
    signInRequired: "Для продовження необхідно увійти.",
    signupCodeIncorrect: "Невірний реєстраційний код.",
    signupCodeRequired: "Необхідний реєстраційний код.",
    usernameIsEmail: "Ім’я користувача не може бути email адресою.",
    usernameRequired: "Ім’я користувача є обов’язковим.",
    accounts: {
      "Email already exists.": "Email вже існує",
      "Email doesn't match the criteria.": "Email відповідає критеріям.",
      "Invalid login token": "Невірний токен для входу",
      "Login forbidden": "Вхід заборонено",
      "Service unknown": "Невідомий сервіс",
      "Unrecognized options for login request": "Невідомі параметри для запиту входу",
      "User validation failed": "Перевірка користувача не вдалася",
      "Username already exists.": "Користувач існує.",
      "You are not logged in.": "Ви не ввійшли.",
      "You've been logged out by the server. Please log in again.": "Сервер ініціював вихід. Будь ласка увійдіть ще раз.",
      "Your session has expired. Please log in again.": "Ваша сесія застаріла. Будь ласка увійдіть ще раз.",
      "No matching login attempt found": "Не було знайдено відповідної спроби увійти",
      "Password is old. Please reset your password.": "Пароль застарів. Будь ласка, скиньте Ваш пароль.",
      "Incorrect password": "Невірний пароль",
      "Invalid email": "Неіснуючий Email",
      "Must be logged in": "Необхідно увійти",
      "Need to set a username or email": "Необхідно ім’я користувача або email",
      "old password format": "старий формат паролю",
      "Password may not be empty": "Пароль не може бути пустим",
      "Signups forbidden": "Реєстрацію відключено",
      "Token expired": "Час дії токена вичерпано",
      "Token has invalid email address": "Невірна email адреса для токена",
      "User has no password set": "У користувача не встановлено пароль",
      "User not found": "Користувач не знайдений",
      "Verify email link expired": "Посилання підтвердження email застаріло",
      "Verify email link is for unknown address": "Посилання підтвердження email для невідомої адреси",
      "Match failed": "Не співпадають",
      "Unknown error": "Невідома помилка"
    }
  }
};

T9n.map("uk", uk);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/vi.coffee.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var vi;

vi = {
  add: "thêm",
  and: "và",
  back: "trở lại",
  changePassword: "Đổi mật khẩu",
  choosePassword: "Chọn một mật khẩu",
  clickAgree: "Bằng cách nhấn vào Đăng ký, bạn đã đồng ý với",
  configure: "Cấu hình",
  createAccount: "Tạo Tài khoản",
  currentPassword: "Mật khẩu hiện tại",
  dontHaveAnAccount: "Chưa có tài khoản?",
  email: "Email",
  emailAddress: "Địa chỉ Email",
  emailResetLink: "Gửi",
  forgotPassword: "Quên mật khẩu?",
  ifYouAlreadyHaveAnAccount: "Nếu bạn đã có tài khoản",
  newPassword: "Mật khẩu mới",
  newPasswordAgain: "Mật khẩu mới (nhập lại)",
  optional: "Tùy chọn",
  OR: "Hoặc",
  password: "Mật khẩu",
  passwordAgain: "Mật khẩu (nhập lại)",
  privacyPolicy: "Chính sách bảo mật",
  remove: "xóa",
  resetYourPassword: "Lấy lại mật khẩu",
  setPassword: "Thiết lập mật khẩu",
  sign: "Ký",
  signIn: "Đăng nhập",
  signin: "đăng nhập",
  signOut: "Đăng xuất",
  signUp: "Đăng ký",
  signupCode: "Mã đăng ký",
  signUpWithYourEmailAddress: "Đăng ký với email của bạn",
  terms: "Điều khoản sử dụng",
  updateYourPassword: "Cập nhật mật khẩu",
  username: "Tên đăng nhập",
  usernameOrEmail: "Tên đăng nhập hoặc email",
  "with": "với",
  info: {
    emailSent: "Email đã được gửi đi!",
    emailVerified: "Email đã được xác minh",
    passwordChanged: "Đã đổi mật khẩu",
    passwordReset: "Lất lại mật khẩu"
  },
  error: {
    emailRequired: "Email phải có.",
    minChar: "Mật khẩu phải có ít nhất 7 ký tự.",
    pwdsDontMatch: "Mật khẩu không giống nhau",
    pwOneDigit: "Mật khẩu phải có ít nhất 1 chữ số.",
    pwOneLetter: "Mật khẩu phải có 1 ký tự chữ.",
    signInRequired: "Phải đăng nhập.",
    signupCodeIncorrect: "Mã số đăng ký sai.",
    signupCodeRequired: "Phải có mã số đăng ký.",
    usernameIsEmail: "Tên đăng nhập không thể là địa chỉ email.",
    usernameRequired: "Phải có tên đăng nhập.",
    accounts: {
      "A login handler should return a result or undefined": "Bộ xử lý đăng nhập phải trả về một kết quả hoặc undefined",
      "Email already exists.": "Email đã tồn tại.",
      "Email doesn't match the criteria.": "Email không phù hợp.",
      "Invalid login token": "Mã đăng nhập không đúng",
      "Login forbidden": "Đăng nhập bị cấm",
      "Service unknown": "Chưa biết Dịch vụ",
      "Unrecognized options for login request": "Tùy chọn không được công nhận đối với yêu cầu đăng nhập",
      "User validation failed": "Xác nhận người dùng thất bại",
      "Username already exists.": "Tên đăng nhập đã tồn tại.",
      "You are not logged in.": "Bạn chưa đăng nhập.",
      "You've been logged out by the server. Please log in again.": "Bạn đã bị đăng xuất bởi máy chủ. Vui lòng đăng nhập lại.",
      "Your session has expired. Please log in again.": "Thời gian đăng nhập đã hết. Vui lòng đăng nhập lại.",
      "No matching login attempt found": "Không tìm thấy đăng nhập phù hợp",
      "Password is old. Please reset your password.": "Mật khẩu đã cũ. Vui lòng lấy lại mật khẩu.",
      "Incorrect password": "Mật khẩu sai",
      "Invalid email": "Email sai",
      "Must be logged in": "Phải đăng nhập",
      "Need to set a username or email": "Phải điền tên đăng nhập hoặc email",
      "old password format": "định dạng mật khẩu cũ",
      "Password may not be empty": "mật khẩu không được để trống",
      "Signups forbidden": "Đăng ký đã bị cấm",
      "Token expired": "Hết phiên đăng nhập",
      "Token has invalid email address": "Phiên đăng nhập chứa địa chỉ email sai",
      "User has no password set": "Người dùng chưa có mật khẩu",
      "User not found": "Không tìm thấy người dùng",
      "Verify email link expired": "Đường dẫn xác nhận email đã hết hạn",
      "Verify email link is for unknown address": "Đường dẫn xác nhận email là cho địa chỉ chưa xác định",
      "Match failed": "Không đúng",
      "Unknown error": "Lỗi chưa được biết"
    }
  }
};

T9n.map("vi", vi);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/zh_CN.coffee.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var zh_CN;

zh_CN = {
  add: "添加",
  and: "和",
  back: "返回",
  cancel: "取消",
  changePassword: "修改密码",
  choosePassword: "新密码",
  clickAgree: "点击注册表示您同意",
  configure: "配置",
  createAccount: "创建账户",
  currentPassword: "当前密码",
  dontHaveAnAccount: "没有账户？",
  email: "电子邮箱",
  emailAddress: "电邮地址",
  emailResetLink: "邮件重置链接",
  forgotPassword: "忘记密码？",
  ifYouAlreadyHaveAnAccount: "如果您已有账户",
  newPassword: "新密码",
  newPasswordAgain: "再输一遍新密码",
  optional: "可选的",
  OR: "或",
  password: "密码",
  passwordAgain: "再输一遍密码",
  privacyPolicy: "隐私条例",
  remove: "移除",
  resetYourPassword: "重置您的密码",
  setPassword: "设置密码",
  sign: "登",
  signIn: "登录",
  signin: "登录",
  signOut: "登出",
  signUp: "注册",
  signupCode: "注册码",
  signUpWithYourEmailAddress: "用您的电子邮件地址注册",
  terms: "使用条例",
  updateYourPassword: "更新您的密码",
  username: "用户名",
  usernameOrEmail: "用户名或电子邮箱",
  "with": "与",
  enterPassword: "输入密码",
  enterNewPassword: "输入新密码",
  enterEmail: "输入电子邮件",
  enterUsername: "输入用户名",
  enterUsernameOrEmail: "输入用户名或电子邮件",
  orUse: "或是使用",
  info: {
    emailSent: "邮件已发出",
    emailVerified: "邮件验证成功",
    passwordChanged: "密码修改成功",
    passwordReset: "密码重置成功"
  },
  error: {
    emailRequired: "必须填写电子邮件",
    minChar: "密码至少7个字符长",
    pwdsDontMatch: "两次密码不一致",
    pwOneDigit: "密码中至少有一位数字",
    pwOneLetter: "密码中至少有一位字母",
    signInRequired: "您必须登录后才能查看",
    signupCodeIncorrect: "注册码错误",
    signupCodeRequired: "必须有注册码",
    usernameIsEmail: "是用户名而不是电子邮件地址",
    usernameRequired: "必须填写用户名。",
    accounts: {
      "Email already exists.": "该电子邮件地址已被使用。",
      "Email doesn't match the criteria.": "错误的的电子邮件地址。",
      "Invalid login token": "登录密匙错误",
      "Login forbidden": "登录被阻止",
      "Service unknown": "未知服务",
      "Unrecognized options for login request": "登录请求存在无法识别的选项",
      "User validation failed": "用户验证失败",
      "Username already exists.": "用户名已被占用。",
      "You are not logged in.": "您还没有登录。",
      "You've been logged out by the server. Please log in again.": "您被服务器登出了。请重新登录。",
      "Your session has expired. Please log in again.": "会话过期，请重新登录。",
      "Invalid email or username": "不合法的电子邮件或用户名",
      "Internal server error": "内部服务器错误",
      "undefined": "未知错误",
      "No matching login attempt found": "未发现对应登录请求",
      "Password is old. Please reset your password.": "密码过于老了，请重置您的密码。",
      "Incorrect password": "错误的密码",
      "Invalid email": "不合法的电子邮件地址",
      "Must be logged in": "必须先登录",
      "Need to set a username or email": "必须设置用户名或电子邮件地址",
      "old password format": "较老的密码格式",
      "Password may not be empty": "密码不应该为空",
      "Signups forbidden": "注册被禁止",
      "Token expired": "密匙过期",
      "Token has invalid email address": "密匙对应的电子邮箱地址不合法",
      "User has no password set": "用户没有密码",
      "User not found": "未找到该用户",
      "Verify email link expired": "激活验证邮件的链接已过期",
      "Verify email link is for unknown address": "验证邮件的链接去向未知地址",
      "Match failed": "匹配失败",
      "Unknown error": "未知错误"
    }
  }
};

T9n.map("zh_CN", zh_CN);

T9n.map("zh-CN", zh_CN);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/zh_TW.coffee.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var zh_TW;

zh_TW = {
  add: "添加",
  and: "和",
  back: "返回",
  cancel: "取消",
  changePassword: "修改密碼",
  choosePassword: "選擇密碼",
  clickAgree: "點擊註冊, 您同意我們的",
  configure: "配置",
  createAccount: "建立帳號",
  currentPassword: "當前密碼",
  dontHaveAnAccount: "還沒有賬戶?",
  email: "電子郵箱",
  emailAddress: "電郵地址",
  emailResetLink: "電子郵件重設連結",
  forgotPassword: "忘記密碼?",
  ifYouAlreadyHaveAnAccount: "如果您已有賬戶",
  newPassword: "新密碼",
  newPasswordAgain: "新密碼 (重新輸入)",
  optional: "可選的",
  OR: "或",
  password: "密碼",
  passwordAgain: "密碼 (重新輸入)",
  privacyPolicy: "隱私政策",
  remove: "刪除",
  resetYourPassword: "重置您的密碼",
  setPassword: "設置密碼",
  sign: "登",
  signIn: "登入",
  signin: "登入",
  signOut: "登出",
  signUp: "註冊",
  signupCode: "註冊碼",
  signUpWithYourEmailAddress: "使用您的電郵地址註冊",
  terms: "使用條款",
  updateYourPassword: "更新您的密碼",
  username: "用戶名",
  usernameOrEmail: "用戶名或電子郵箱",
  "with": "與",
  enterPassword: "輸入密碼",
  enterNewPassword: "輸入新密碼",
  enterEmail: "輸入電子郵件",
  enterUsername: "輸入用戶名",
  enterUsernameOrEmail: "輸入用戶名或電子郵件",
  orUse: "或是使用",
  info: {
    emailSent: "郵件已發送",
    emailVerified: "郵件已驗證",
    passwordChanged: "密碼已修改",
    passwordReset: "密碼重置"
  },
  error: {
    emailRequired: "必須填寫電子郵件。",
    minChar: "密碼至少需要7個字符。",
    pwdsDontMatch: "密碼不一致。",
    pwOneDigit: "密碼必須至少有一位數字。",
    pwOneLetter: "密碼必須至少有一位字母。",
    signInRequired: "您必須先登錄才能繼續。",
    signupCodeIncorrect: "註冊碼錯誤。",
    signupCodeRequired: "必須有註冊碼。",
    usernameIsEmail: "用戶名不能為電郵地址。",
    usernameRequired: "必須有用戶名。",
    accounts: {
      "Email already exists.": "電郵地址已被使用。",
      "Email doesn't match the criteria.": "電郵地址不符合條件。",
      "Invalid login token": "無效的登錄令牌",
      "Login forbidden": "禁止登錄",
      "Service unknown": "未知服務",
      "Unrecognized options for login request": "無法識別的登錄請求選項",
      "User validation failed": "用戶驗證失敗",
      "Username already exists.": "用戶名已經存在。",
      "You are not logged in.": "您尚未登入。",
      "You've been logged out by the server. Please log in again.": "你已被伺服器登出，請重新登入。",
      "Your session has expired. Please log in again.": "您的協定已過期，請重新登入。",
      "Invalid email or username": "無效的電子郵件或用戶名",
      "Internal server error": "内部服务器错误",
      "undefined": "未知錯誤",
      "No matching login attempt found": "沒有找到匹配的登入請求",
      "Password is old. Please reset your password.": "密碼是舊的。請重置您的密碼。",
      "Incorrect password": "密碼不正確",
      "Invalid email": "無效的電子郵件",
      "Must be logged in": "必須先登入",
      "Need to set a username or email": "必須設置用戶名或電郵地址",
      "old password format": "舊密碼格式",
      "Password may not be empty": "密碼不能為空的",
      "Signups forbidden": "註冊被禁止",
      "Token expired": "密匙過期",
      "Token has invalid email address": "密匙具有無效的電郵地址",
      "User has no password set": "用戶沒有設置密碼",
      "User not found": "找不到用戶",
      "Verify email link expired": "驗證電郵連結已過期",
      "Verify email link is for unknown address": "驗證電郵連結是未知的地址",
      "Match failed": "匹配失敗",
      "Unknown error": "未知錯誤"
    }
  }
};

T9n.map("zh_TW", zh_TW);

T9n.map("zh-TW", zh_TW);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/zh_HK.coffee.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var zh_HK;

zh_HK = {
  add: "新增",
  and: "和",
  back: "返回",
  changePassword: "修改密碼",
  choosePassword: "選擇密碼",
  clickAgree: "點擊註冊, 您同意我們的",
  configure: "設定",
  createAccount: "建立帳號",
  currentPassword: "現有密碼",
  dontHaveAnAccount: "還沒有賬號？",
  email: "電郵",
  emailAddress: "電郵地址",
  emailResetLink: "重設電郵連結",
  forgotPassword: "忘記密碼?",
  ifYouAlreadyHaveAnAccount: "如果已有賬號",
  newPassword: "新密碼",
  newPasswordAgain: "新密碼 (重新輸入)",
  optional: "可選填",
  OR: "或",
  password: "密碼",
  passwordAgain: "密碼（重新輸入）",
  privacyPolicy: "私隱條款",
  remove: "刪除",
  resetYourPassword: "重置密碼",
  setPassword: "設定密碼",
  sign: "登",
  signIn: "登入",
  signin: "登入",
  signOut: "登出",
  signUp: "註冊",
  signupCode: "註冊碼",
  signUpWithYourEmailAddress: "使用您的電郵地址註冊",
  terms: "使用條款",
  updateYourPassword: "更新您的密碼",
  username: "用戶名",
  usernameOrEmail: "用戶名或電子郵箱",
  "with": "與",
  info: {
    emailSent: "已發送郵件",
    emailVerified: "已驗證郵件",
    passwordChanged: "已修改密碼",
    passwordReset: "密碼重置"
  },
  error: {
    emailRequired: "必須填寫電子郵件。",
    minChar: "密碼至少需要 7 個字符。",
    pwdsDontMatch: "密碼不一致。",
    pwOneDigit: "密碼必須至少包括一個數字。",
    pwOneLetter: "密碼必須至少有包括一個字符。",
    signInRequired: "您必須先登錄才能繼續。",
    signupCodeIncorrect: "註冊碼不符。",
    signupCodeRequired: "必須有註冊碼。",
    usernameIsEmail: "用戶名不能設為電郵地址。",
    usernameRequired: "必須有用戶名。",
    accounts: {
      "Email already exists.": "電郵地址已在本服務登記使用。",
      "Email doesn't match the criteria.": "電郵地址不符合條件。",
      "Invalid login token": "無效的登錄編碼",
      "Login forbidden": "禁止登錄",
      "Service unknown": "未知服務",
      "Unrecognized options for login request": "無法識別的登錄請求",
      "User validation failed": "用戶驗證失敗",
      "Username already exists.": "用戶名已存在。",
      "You are not logged in.": "您尚未登入。",
      "You've been logged out by the server. Please log in again.": "您已被強制登出，請重新登入。",
      "Your session has expired. Please log in again.": "閒置時間過長，請重新登入。",
      "No matching login attempt found": "沒有找到匹配的登入請求",
      "Password is old. Please reset your password.": "密碼已失效，請重置。",
      "Incorrect password": "密碼不正確",
      "Invalid email": "無效的電子郵件",
      "Must be logged in": "必須先登入",
      "Need to set a username or email": "必須設置用戶名或電郵地址",
      "old password format": "舊密碼格式",
      "Password may not be empty": "密碼不能為空",
      "Signups forbidden": "註冊被禁止",
      "Token expired": "編碼已經過期",
      "Token has invalid email address": "編碼中的電郵地址無效",
      "User has no password set": "用戶尚未設置密碼",
      "User not found": "找不到用戶",
      "Verify email link expired": "驗證電郵連結已過期",
      "Verify email link is for unknown address": "驗證電郵連結是未知的地址",
      "Match failed": "無法配對",
      "Unknown error": "無法確認的系統問題"
    }
  }
};

T9n.map("zh_HK", zh_HK);

T9n.map("zh-HK", zh_HK);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/es_ES_formal.coffee.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var es_ES_formal;

es_ES_formal = {
  t9Name: 'Español-España',
  add: "agregar",
  and: "y",
  back: "regresar",
  cancel: "Cancelar",
  changePassword: "Cambiar Contraseña",
  choosePassword: "Eligir Contraseña",
  clickAgree: "Si hace clic en Crear Cuenta acepta la",
  configure: "Configurar",
  createAccount: "Crear cuenta",
  currentPassword: "Contraseña actual",
  dontHaveAnAccount: "¿No está registrado?",
  email: "Correo electrónico",
  emailAddress: "Correo electrónico",
  emailResetLink: "Restaurar dirección de correo electrónico",
  forgotPassword: "¿Ha olvidado su contraseña?",
  ifYouAlreadyHaveAnAccount: "Si ya tiene una cuenta, ",
  newPassword: "Nueva Contraseña",
  newPasswordAgain: "Nueva Contraseña (repetición)",
  optional: "Opcional",
  OR: "O",
  password: "Contraseña",
  passwordAgain: "Contraseña (repetición)",
  privacyPolicy: "Póliza de Privacidad",
  remove: "remover",
  resetYourPassword: "Recuperar contraseña",
  setPassword: "Definir Contraseña",
  sign: "Entrar",
  signIn: "Entrar",
  signin: "entra",
  signOut: "Salir",
  signUp: "Regístrarse",
  signupCode: "Código para registrarte",
  signUpWithYourEmailAddress: "Regístrarse con su correo electrónico",
  terms: "Términos de Uso",
  updateYourPassword: "Actualizar contraseña",
  username: "Usuario",
  usernameOrEmail: "Usuario o correo electrónico",
  "with": "con",
  maxAllowedLength: "Longitud máxima permitida",
  minRequiredLength: "Longitud máxima requerida",
  resendVerificationEmail: "Mandar correo de nuevo",
  resendVerificationEmailLink_pre: "Correo de verificación perdido?",
  resendVerificationEmailLink_link: "Volver a mandar",
  enterPassword: "Introducir contraseña",
  enterNewPassword: "Introducir contraseña nueva",
  enterEmail: "Introducir correo electrónico",
  enterUsername: "Introducir nombre de usuario",
  enterUsernameOrEmail: "Introducir nombre de usuario o correo electrónico",
  orUse: "O puedes usar",
  info: {
    emailSent: "Mensaje enviado",
    emailVerified: "Dirección de correo verificada",
    passwordChanged: "Contraseña cambiada",
    passwordReset: "Resetar Contraseña"
  },
  alert: {
    ok: 'Ok',
    type: {
      info: 'Aviso',
      error: 'Error',
      warning: 'Advertencia'
    }
  },
  error: {
    emailRequired: "La dirección de correo electrónico es necesaria.",
    minChar: "7 carácteres mínimo.",
    pwdsDontMatch: "Contraseñas no coinciden",
    pwOneDigit: "mínimo un dígito.",
    pwOneLetter: "mínimo una letra.",
    signInRequired: "Debe iniciar sesión para esta opción.",
    signupCodeIncorrect: "Código de registro inválido.",
    signupCodeRequired: "Se requiere un código de registro.",
    usernameIsEmail: "El nombre de usuario no puede ser una dirección de correo.",
    usernameRequired: "Se requiere nombre de usuario.",
    accounts: {
      "Email already exists.": "El correo ya existe.",
      "Email doesn't match the criteria.": "El correo no coincide.",
      "Invalid login token": "Token de inicio de sesión inválido",
      "Login forbidden": "Inicio de sesión prohibido",
      "Service unknown": "Servicio desconocido",
      "Unrecognized options for login request": "Opciones desconocidas para solicitud de inicio de sesión",
      "User validation failed": "No se ha podido validar el usuario",
      "Username already exists.": "El usuario ya existe.",
      "You are not logged in.": "No está conectado.",
      "You've been logged out by the server. Please log in again.": "Ha sido desconectado por el servidor. Por favor inicie sesión de nuevo.",
      "Your session has expired. Please log in again.": "Su sesión ha expirado. Por favor inicie sesión de nuevo.",
      "Already verified": "Ya ha sido verificada",
      "Invalid email or username": "Dirección electrónica o nombre de usuario no validos",
      "Internal server error": "Error interno del servidor",
      "undefined": "Algo ha ido mal",
      "No matching login attempt found": "Ningún intento de inicio de sesión coincidente se encontró",
      "Password is old. Please reset your password.": "Contraseña es vieja. Por favor, resetea la contraseña.",
      "Incorrect password": "Contraseña inválida.",
      "Invalid email": "Correo electrónico inválido",
      "Must be logged in": "Debe ingresar",
      "Need to set a username or email": "Tiene que especificar un usuario o una dirección de correo",
      "old password format": "formato viejo de contraseña",
      "Password may not be empty": "Contraseña no debe quedar vacía",
      "Signups forbidden": "Registro prohibido",
      "Token expired": "Token expirado",
      "Token has invalid email address": "Token contiene una dirección electrónica inválido",
      "User has no password set": "Usuario no tiene contraseña",
      "User not found": "Usuario no encontrado",
      "Verify email link expired": "El enlace para verificar el correo electrónico ha expirado",
      "Verify email link is for unknown address": "El enlace para verificar el correo electrónico contiene una dirección desconocida",
      "At least 1 digit, 1 lowercase and 1 uppercase": "Al menos tiene que contener un número, una minúscula y una mayúscula",
      "Please verify your email first. Check the email and follow the link!": "Por favor compruebe su correo electrónico primero. Siga el link que le ha sido enviado.",
      "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.": "Un nuevo correo le ha sido enviado. Si no ve el correo en su bandeja compruebe su carpeta de spam.",
      "Match failed": "No ha habido ninguna coincidencia",
      "Unknown error": "Error desconocido",
      "Error, too many requests. Please slow down. You must wait 1 seconds before trying again.": "Error, demasiadas peticiones. Por favor no vaya tan rapido. Tiene que esperar al menos un segundo antes de probar otra vez."
    }
  }
};

T9n.map("es_ES_formal", es_ES_formal);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/softwarerero_accounts-t9n/t9n/es_formal.coffee.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var es_formal;

es_formal = {
  t9Name: 'Español',
  add: "agregar",
  and: "y",
  back: "regresar",
  cancel: "Cancelar",
  changePassword: "Cambiar contraseña",
  choosePassword: "Eligir contraseña",
  clickAgree: "Al hacer clic en Suscribir aprueba la",
  configure: "Configurar",
  createAccount: "Crear cuenta",
  currentPassword: "Contraseña actual",
  dontHaveAnAccount: "¿No tiene una cuenta?",
  email: "Correo electrónico",
  emailAddress: "Dirección de correo electrónico",
  emailResetLink: "Resetear correo electrónico",
  forgotPassword: "¿Olvidó su contraseña?",
  ifYouAlreadyHaveAnAccount: "Si ya tiene una cuenta",
  newPassword: "Nueva contraseña",
  newPasswordAgain: "Nueva contraseña (repetir)",
  optional: "Opcional",
  OR: "O",
  password: "Contraseña",
  passwordAgain: "Contraseña (repetir)",
  privacyPolicy: "Póliza de Privacidad",
  remove: "remover",
  resetYourPassword: "Resetear contraseña",
  setPassword: "Definir contraseña",
  sign: "Ingresar",
  signIn: "Entrar",
  signin: "entrar",
  signOut: "Salir",
  signUp: "Registrarse",
  signupCode: "Código de registro",
  signUpWithYourEmailAddress: "Registrarse con su dirección de correo electrónico",
  terms: "Términos de uso",
  updateYourPassword: "Actualizar contraseña",
  username: "Usuario",
  usernameOrEmail: "Usuario o correo electrónico",
  "with": "con",
  maxAllowedLength: "Longitud máxima permitida",
  minRequiredLength: "Longitud máxima requerida",
  resendVerificationEmail: "Mandar correo electrónico de nuevo",
  resendVerificationEmailLink_pre: "¿Perdió su correo de verificación?",
  resendVerificationEmailLink_link: "Volver a mandar",
  enterPassword: "Introducir contraseña",
  enterNewPassword: "Introducir contraseña nueva",
  enterEmail: "Introducir dirección de correo electrónico",
  enterUsername: "Introducir nombre de usario",
  enterUsernameOrEmail: "Introducir nombre de usario o dirección de correos",
  orUse: "O usar",
  info: {
    emailSent: "Correo enviado",
    emailVerified: "Dirección de correos verificada",
    passwordChanged: "Contraseña cambiada",
    passwordReset: "Resetear contraseña"
  },
  alert: {
    ok: 'Ok',
    type: {
      info: 'Aviso',
      error: 'Error',
      warning: 'Advertencia'
    }
  },
  error: {
    emailRequired: "Su dirección de correos es requerida.",
    minChar: "7 caracteres mínimo.",
    pwdsDontMatch: "Las contraseñas no coinciden",
    pwOneDigit: "mínimo un dígito.",
    pwOneLetter: "mínimo una letra.",
    signInRequired: "Debe iniciar sesión para hacer eso.",
    signupCodeIncorrect: "El código de registro no coincide.",
    signupCodeRequired: "Se requiere el código de registro.",
    usernameIsEmail: "El nombre de usuario no puede ser una dirección de correos.",
    usernameRequired: "Se requiere un nombre de usuario.",
    accounts: {
      "Email already exists.": "La dirección de correo elecrónico ya existe.",
      "Email doesn't match the criteria.": "La dirección de correo electrónico no coincide con los criterios.",
      "Invalid login token": "Token de inicio de sesión inválido",
      "Login forbidden": "Inicio de sesión prohibido",
      "Service unknown": "Servicio desconocido",
      "Unrecognized options for login request": "Opciones desconocidas para solicitud de inicio de sesión",
      "User validation failed": "No se ha podido validar el usuario",
      "Username already exists.": "El usuario ya existe.",
      "You are not logged in.": "No está autenticado.",
      "You've been logged out by the server. Please log in again.": "Ha sido desconectado por el servidor. Por favor ingrese de nuevo.",
      "Your session has expired. Please log in again.": "Su sesión ha expirado. Por favor ingrese de nuevo.",
      "Already verified": "Ya ha sido verificada",
      "Invalid email or username": "Dirección de correo o nombre de usuario no validos",
      "Internal server error": "Error interno del servidor",
      "undefined": "Algo ha ido mal",
      "No matching login attempt found": "No se encontró ningún intento de inicio de sesión coincidente",
      "Password is old. Please reset your password.": "Contraseña es vieja. Por favor resetee su contraseña.",
      "Incorrect password": "Contraseña incorrecta.",
      "Invalid email": "Correo electrónico inválido",
      "Must be logged in": "Debe estar conectado",
      "Need to set a username or email": "Debe especificar un usuario o dirección de correo electrónico",
      "old password format": "formato viejo de contraseña",
      "Password may not be empty": "Contraseña no debe quedar vacía",
      "Signups forbidden": "Registro prohibido",
      "Token expired": "Token expirado",
      "Token has invalid email address": "Token contiene un correo electrónico inválido",
      "User has no password set": "Usuario no tiene contraseña",
      "User not found": "Usuario no encontrado",
      "Verify email link expired": "El enlace para verificar la dirección de correo ha expirado",
      "Verify email link is for unknown address": "El enlace para verificar el correo electrónico contiene una dirección desconocida",
      "At least 1 digit, 1 lowercase and 1 uppercase": "Al menos debe contener un número, una minúscula y una mayúscula",
      "Please verify your email first. Check the email and follow the link!": "Por favor compruebe su dirección de correo primero. Siga el link que le ha sido enviado.",
      "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.": "Un nuevo correo le ha sido enviado. Si no ve el correo en su bandeja compruebe su carpeta de spam.",
      "Match failed": "No se encontró pareja coincidente",
      "Unknown error": "Error desconocido",
      "Error, too many requests. Please slow down. You must wait 1 seconds before trying again.": "Error, demasiadas peticiones. Por favor vaya más lento. Debe esperar al menos un segundo antes de probar otra vez."
    }
  }
};

T9n.map("es_formal", es_formal);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("softwarerero:accounts-t9n", {
  T9n: T9n
});

})();
