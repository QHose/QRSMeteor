import './questions.html'
import { Mongo } from 'meteor/mongo';
import { getAllSlideHeadersPlain, } from "/imports/ui/useCases/useCaseSelection";
import * as nav from "/imports/ui/nav.js";


export const questions = new Mongo.Collection(null);
var resultSet = [];

Template.questions.events({
    async 'click input'(event) {
        var checked = event.currentTarget.checked;
        var question = $(event.target).closest('tr').children('td:first').text();
        var answerImportance = $(event.currentTarget).attr("class");
        
        //get the slide headers and store it in the database
        if (checked) {            
            await nav.makeSelectionInField("Level 2", [{qText: question}]);            
            var slides = await getAllSlideHeadersPlain();
            console.log('slides after checkbox click', slides)
            questions.insert({ name: question, importance: answerImportance, slides: slides })
        } else {
            questions.remove({ name: question })
        }

        //@todo deselect the other checkbox
        // $(event.target).closest('tr').find(':checkbox').prop('checked', this.checked);
        // console.log(event);
    },
    'submit'(event) {
        // Prevent default browser form submit
        event.preventDefault();
        // console.log('questions in collection: ', questions.find({}).fetch());
        questions.find({}).forEach(function(question){
            console.log('question', question)
            question.slides.forEach(function(slide){
                console.log('slide', slide)
                resultSet.push(slide)
            }) // we now have a full slide deck, next store it in the session so slides.js can render it.
            
            Session.set('slideHeaders', resultSet);
            Router.go('slides');

        })

    }
});

