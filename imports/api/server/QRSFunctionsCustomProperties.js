import {
    Meteor
} from 'meteor/meteor';
import {
    myQRS
} from '/imports/api/server/QRSAPI';

var fs = require('fs-extra');
const path = require('path');

import {
    senseConfig,
    qrs
} from '/imports/api/config.js';

// http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-Custom-Property-Add.htm
export function createCustomProperty(name, newProperty) {
    console.log('------------------------------------');
    console.log('createCustomProperty', name + ' ' + newProperty.toString())
    console.log('------------------------------------');

    try {
        check(name, String);
        check(newProperty, Object);
    } catch (err) {
        throw new Meteor.Error('createCustomProperty: Missing values', 'You did not specify a name or choice values for the custom property');
    }

    var result = qrs.post('/qrs/CustomPropertyDefinition', null, newProperty);
    console.log('result of create custom property: ', result);
}

upsertCustomPropertyByName('UpdatedName', ['bies', 'bies2']);
export function upsertCustomPropertyByName(name, choiceValues) {
    console.log('%%%%%%%%%%%%%%%%%%%% updateCustomPropertyByName(name, newProperty)' + name + ' & values: ' + choiceValues.toString());

    try {
        check(name, String);
        check(choiceValues, Array);
    } catch (err) {
        throw new Meteor.Error('upsertCustomPropertyByName: Missing values', 'You did not specify a name or update object for the custom property');
    }
    try {
        var newProperty = {
            "name": name,
            "valueType": "Text",
            "objectTypes": ["App", "ContentLibrary", "DataConnection", "ReloadTask", "Stream", "User"],
            "choiceValues": choiceValues
        }

        var existingProperty = getCustomProperties(name)[0];
        console.log('existingProperty', existingProperty)
        if (existingProperty) { //update it
            var updatedProperty = Object.assign(existingProperty, newProperty);
            var result = qrs.put('/qrs/CustomPropertyDefinition/' + updatedProperty.id, null, updatedProperty); //you can only update when you supply the original modified date, otherwise you get a 409 error. 
            console.log('Result after updating custom property', result)
        } else { //create a new one
            createCustomProperty(name, newProperty);
        }
    } catch (error) {
        console.log('error upserting custom property', error);
    }
}

export function deleteCustomProperty(name) {
    console.log('deleteCustomProperty(name)', name);

    var customProperty = getCustomProperties(name)[0];
    if (customProperty) {
        var result = qrs.del('/qrs/CustomPropertyDefinition/' + customProperty.id);
        console.log('result after delete', result);
    }

}

export function getCustomProperties(name) {
    var filter = name ? {
        filter: "Name eq '" + name + "'"
    } : null;
    var customProperties = qrs.get('/qrs/CustomPropertyDefinition/full', filter);

    var file = path.join(Meteor.settings.broker.automationBaseFolder, 'customProperties', 'export', 'ExtractedCustomProperties.json');

    // SAVE FILE TO DISK
    fs.outputFile(file, JSON.stringify(customProperties, null, 2), 'utf-8');

    return customProperties;
}