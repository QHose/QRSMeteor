Template.steps.helpers({
    completedStep1() {
        return Customers.find().count() ? 'Completed':'';
    },
    completedStep2() {
        return TemplateApps.find()
            .count() ? 'Completed':'';
    }
});