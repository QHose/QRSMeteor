import { Accounts } from 'meteor/accounts-base';

Accounts.ui.config({
    passwordSignupFields: 'USERNAME_ONLY',
});

AdminConfig = {
    collections: {
        Users: {},
        Apps: {},
        Streams: {},
        GeneratedResources: {}
    }
}
