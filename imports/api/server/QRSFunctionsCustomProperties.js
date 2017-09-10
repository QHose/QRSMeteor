import { Meteor } from 'meteor/meteor';
import { myQRS } from '/imports/api/server/QRSAPI';

var fs = require('fs-extra');
const path = require('path');

import {
    senseConfig,
    qrs
} from '/imports/api/config.js';

// http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/RepositoryServiceAPI/Content/RepositoryServiceAPI/RepositoryServiceAPI-Custom-Property-Add.htm
export function createCustomProperty(name, choiceValues) {
    console.log('------------------------------------');
    console.log('createCustomProperty', name + ' ' + choiceValues.toString())
    console.log('------------------------------------');

    try {
        check(name, String);
        check(choiceValues, Array);
    } catch (err) {
        throw new Meteor.Error('Missing values', 'You did not specify a name or choice values for the custom property');
    }

    var customProperty = {
        "name": name,
        "valueType": "Text",
        "objectTypes": ["App", "ContentLibrary", "DataConnection", "ReloadTask", "Stream", "User"],
        "choiceValues": choiceValues
    }
    console.log('customProperty', customProperty)
    var result = qrs.post('/qrs/CustomPropertyDefinition', null, customProperty);
    console.log('result of create custom property: ', result);
}

// updateCustomPropertyByName('UpdatedName', getCustomProperties()[0])
export function updateCustomPropertyByName(name, newProperty) {
    console.log('%%%%%%%%%%%%%%%%%%%% updateCustomPropertyByName(name, newProperty)', updateCustomPropertyByName(name, newProperty));

    try {
        check(newName, String);
        check(newProperty, Object);
    } catch (err) {
        throw new Meteor.Error('Missing values', 'You did not specify a name or update object for the custom property');
    }

    var customProperty = getCustomProperties(name)[0];
    newProperty.modifiedDate = customProperty.modifiedDate; //you can only update when you supply the original modified date, otherwise you get a 409 error. 
    var result = qrs.put('/qrs/CustomPropertyDefinition/' + customProperty.id, null, result)
    console.log('result after update', result)

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
    var filter = name ? { filter: "Name eq '" + name + "'" } : null;
    var customProperties = qrs.get('/qrs/CustomPropertyDefinition/full', filter);

    var file = path.join(Meteor.settings.broker.automationBaseFolder, 'customProperties', 'export', 'ExtractedCustomProperties.json');

    // SAVE FILE TO DISK
    fs.outputFile(file, JSON.stringify(customProperties, null, 2), 'utf-8');

    return customProperties;
}