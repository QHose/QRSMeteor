import { Meteor } from 'meteor/meteor';
// import { APILogs } from '/imports/api/APILogs';

import {
    qrs
} from '/imports/api/config.js';

export function getSecurityRules() {
    return qrs.get('/qrs/SystemRule');
};