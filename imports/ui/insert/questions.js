import './questions.html'
import './questions.css'

import { Mongo } from 'meteor/mongo';
import { getAllSlideHeadersPlain, } from "/imports/ui/useCases/useCaseSelection";
import * as nav from "/imports/ui/nav.js";
const Cookies = require('js-cookie');

export const questions = new Mongo.Collection(null);
var resultSet = [];

//@todo get them from usecaseselection
export var possibleRoles = [
    "Developer",
    "Hosting Ops",
    "Business Analyst",
    "CTO",
    "C-Level - non-technical"
];

var developerSections = ['data', 'dashboard'];
var hostingOpsSections = ['security', 'automation', 'architecture'];
var businessAnalystSections = ['dashboard'];
var CTOSections = ['data', 'dashboard', 'embedding', 'security', 'automation'];
var nonTechnicalSections = ['dashboard'];

Template.questions.onRendered(async function () {
    console.log('selectie in database ',questions.find({}).fetch())
})

Template.questions.helpers({
    applicableForRole: function (featureGroup) {
        var activeRole = Cookies.get("currentMainRole");
        //check if values of activerole exists in array
        switch (activeRole) {
            case "Developer":
                return developerSections.includes(featureGroup);
            case "Hosting Ops":
                return hostingOpsSections.includes(featureGroup);
            case "Business Analyst":
                return businessAnalystSections.includes(featureGroup);
            case "CTO":
                return CTOSections.includes(featureGroup);
            case "C-Level - non-technical":
                return nonTechnicalSections.includes(featureGroup);
        }

    }

});


Template.questions.events({
    async 'click input'(event) {
        var checked = event.currentTarget.checked;
        var question = $(event.target).closest('tr').children('td:first').text().replace(/\s+/g, ' ').trim(); //remove extra white spaces
        var answerImportance = $(event.currentTarget).attr("class");

        //get the slide headers and store it in the database
        if (checked) {
            await nav.makeSelectionInField("Level 2", [{ qText: question }]);
            var slides = await getAllSlideHeadersPlain();
            console.log('slides', slides)
            questions.insert({ name: question, importance: answerImportance, slides: slides })
        } else {
            questions.remove({ name: question })
        }

        //@todo deselect the other checkbox
        // $(event.target).closest('tr').find(':checkbox').prop('checked', this.checked);
        // console.log(event);
    },
    'click .button'(event) {
        event.preventDefault();
        questions.find({}).forEach(function (question) {
            question.slides.forEach(function (slide) {
                resultSet.push(slide)
            }) // we now have a full slide deck, next store it in the session so slides.js can render it.

            resultSet.sort(compare);
            Session.set('slideHeaders', resultSet);
            Router.go('slides');

        })

    }
});

function compare(a, b) {
    if (a.answerImportance < b.answerImportance) {
        return -1;
    }
    if (a.answerImportance > b.answerImportance) {
        return 1;
    }
    return 0;
}

