import './questions.html'
import './questions.css'

import { Mongo } from 'meteor/mongo';
import { getAllSlideHeadersPlain, } from "/imports/ui/useCases/useCaseSelection";
import * as nav from "/imports/ui/nav.js";
const Cookies = require('js-cookie');

export const questions = new Mongo.Collection(null);


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
    async 'click input'(event, template) {
        var checked = event.currentTarget.checked;
        var question = $(event.target).closest('tr').children('td:first').text().replace(/\s+/g, ' ').trim(); //remove extra white spaces
        var answerImportance = $(event.currentTarget).attr("class");

        //get the slide headers and store it in the database
        if (checked) {
            await nav.makeSelectionInField("Level 2", [{ qText: question }]);
            var slides = await getAllSlideHeadersPlain();
            questions.insert({ name: question, importance: answerImportance, slides: slides })

            //uncheck other checkbox, a radio button would be better
            $(event.target).closest('tr').find(':checkbox').prop('checked', false);
            $(event.target).prop('checked', true);
        } else {
            questions.remove({ name: question })
            $(event.target).prop('checked', false);
        }
    },
    'click .view.button'(event) {
        event.preventDefault();

        if (!questions.find().count()){
            sAlert.error('Please select at least 1 requirement');     
            return;
        }

        var resultSet = []; // the master deck
        // we now have individual slides, merge them into 1 deck (1 array to be used by slides.js)
        questions.find({}).forEach(function (question) {
            question.slides.forEach(function (slide) {
                slide.importance = question.importance;
                resultSet.push(slide) //add slide to master deck
            }) // we now have a full slide deck, next store it in the session so slides.js can render it.            

        })

        resultSet.sort(compare);
        Session.set('slideHeaders', resultSet);
        Router.go('slides');

    },
    'click .clear.button'(event) {
        $('input:checkbox').removeAttr('checked');
    }
});

function compare(a, b) {
    if (a.importance < b.importance) {
        return -1;
    }
    if (a.importance > b.importance) {
        return 1;
    }
    return 0;
}

