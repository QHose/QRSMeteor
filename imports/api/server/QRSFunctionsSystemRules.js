import {
    Meteor
} from 'meteor/meteor';
// import { APILogs } from '/imports/api/APILogs';
var fs = require('fs-extra');
const path = require('path');

import {
    qrs,
    validateJSON
} from '/imports/api/config.js';
import * as QSLic from '/imports/api/server/QRSFunctionsLicense';

export function getSecurityRules(name) {
    return QSLic.getSystemRules(name);
}

export function disableDefaultSecurityRules() {

    Meteor.settings.security.rulesToDisable.forEach(function(rule) {
        console.log('Disable security rule: ', rule)

        var rule = QSLic.getSystemRules(rule.name);
        rule.disabled = true;
        var response = qrs.put('/qrs/SystemRule', rule);
    });
}

export async function createSecurityRules() {
    console.log('------------------------------------');
    console.log('create security rules in Qlik Sense based on import file');
    console.log('------------------------------------');

    var file = path.join(Meteor.settings.broker.automationBaseFolder, 'securityrules', 'import', 'securityRuleSettings.json');

    // READ THE FILE 
    var securityRules = await fs.readJson(file);
    try {
        validateJSON(securityRules)
    } catch (err) {
        throw new Error('Cant read the security rule definitions file: ' + file);
    }

    securityRules.forEach(function(rule) {
        console.log('QSLic.getSystemRules(rule.name)', QSLic.getSystemRules(rule.name).length)
        if (!QSLic.getSystemRules(rule.name).length) {
            var response = qrs.post('/qrs/SystemRule', rule);
        } else {
            console.log('Security rule "' + rule.name + '" already existed');
        }
    });

}

function stringToJSON(myString) {
    var myJSONString = JSON.stringify(myString);
    var myEscapedJSONString = myJSONString.replace(/\\n/g, "\\n")
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, "\\&")
        .replace(/\\r/g, "\\r")
        .replace(/\\t/g, "\\t")
        .replace(/\\b/g, "\\b")
        .replace(/\\f/g, "\\f");

    console.log('myEscapedJSONString', myEscapedJSONString)
}