import { Meteor } from 'meteor/meteor';
import { myQRS } from '/imports/api/server/QRSAPI';


//
// ─── IMPORT CONFIG FOR QLIK SENSE QRS AND ENGINE API ────────────────────────────
//


import {
    senseConfig,
    qrs
} from '/imports/api/config.js';

var demoUserAccessRule = "SAAS DEMO - License rule to grant user access";

// http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-License-Add.htm

export function getLicense() {
    var lic = qrs.get('/qrs/license');
    return lic;
}

export function insertLicense() {
    console.log('------------------------------------');
    console.log('INSERT LICENSE');
    console.log('------------------------------------');
    var existingLicense = qrs.get('/qrs/license');
    var newLicense = Meteor.settings.private.license;

    if (newLicense) {
        try {
            console.log('Update the existing license');
            newLicense.id = existingLicense.id;
            var response = qrs.del('/qrs/license/' + existingLicense.id);
            // var response = qrs.put('/qrs/license/' + newLicense.id, newLicense, { control: Meteor.settings.private.LicenseControlNumber });
            // console.error('Stop license insertion, license for ' + lic.organization + ' is already included: ', lic.serial);
            // throw Error('You are trying to insert a license while the Qlik Sense is already licensed, please remove the existing one in the QMC');
        } catch (err) {
            // lic did not already exist.
        }
        var response = qrs.post('/qrs/license', newLicense, { control: Meteor.settings.private.LicenseControlNumber });
    }
}

export function insertUserAccessRule() {
    console.log('insert UserAccess Rule for all users');
    var licenseRule = {
        "name": demoUserAccessRule,
        "category": "License",
        "rule": "((user.name like \"*\"))",
        "type": "Custom",
        "privileges": ["create", "read", "update"],
        "resourceFilter": "License.UserAccessGroup_507c9aa5-8812-44d9-ade8-32809785eecf",
        "actions": 1,
        "ruleContext": "QlikSenseOnly",
        "disabled": false,
        "comment": "Rule to set up automatic user access for each user that has received a ticket via your SaaS platform",
        "disabledActions": ["useaccesstype"]
    }
    var ruleExist = getSystemRules(demoUserAccessRule);
    if (typeof ruleExist[0] == 'undefined' || ruleExist.length === 0) {
        console.log('Create a new user license rule since it did not exist.');
        var response = qrs.post('/qrs/SystemRule', licenseRule);
    }
}

export function getSystemRules(name) {
    var filter = name ? { filter: "Name eq '" + name + "'" } : null;
    var rules = qrs.get('/qrs/SystemRule', filter);

    return rules;
}

export function insertSecurityRules() {


}