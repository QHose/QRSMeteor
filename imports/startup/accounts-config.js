import { Accounts } from 'meteor/accounts-base';

Accounts.ui.config({
    passwordSignupFields: 'USERNAME_ONLY',
});

AdminConfig = {
    adminEmails: ['bieshose@gmail.com'],
    collections: {
        Users: {},
        Apps: {},
        Streams: {},
        GeneratedResources: {}
    }
}
