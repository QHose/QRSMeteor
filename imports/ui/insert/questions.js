import './questions.html'
import { Mongo } from 'meteor/mongo';
import { getAllSlideHeadersPlain, } from "/imports/ui/useCases/useCaseSelection";
import * as nav from "/imports/ui/nav.js";


export const questions = new Mongo.Collection(null);
var resultSet = [];

Template.questions.events({
    async 'click input'(event) {
        var checked = event.currentTarget.checked;
        var question = $(event.target).closest('tr').children('td:first').text().replace(/\s+/g,' ').trim();
        console.log('question: ', question)
        var answerImportance = $(event.currentTarget).attr("class");
        
        //get the slide headers and store it in the database
        if (checked) {            
            await nav.makeSelectionInField("Level 2", [{qText: question}]);            
            var slides = await getAllSlideHeadersPlain();
            questions.insert({ name: question, importance: answerImportance, slides: slides })
        } else {
            questions.remove({ name: question })
        }

        //@todo deselect the other checkbox
        // $(event.target).closest('tr').find(':checkbox').prop('checked', this.checked);
        // console.log(event);
    },
    'submit'(event) {
        event.preventDefault();

        questions.find({}).forEach(function(question){
            question.slides.forEach(function(slide){
                resultSet.push(slide)
            }) // we now have a full slide deck, next store it in the session so slides.js can render it.
            
            resultSet.sort(compare);
            console.log('resultSet', resultSet)
            Session.set('slideHeaders', resultSet);
            Router.go('slides');

        })

    }
});

function compare( a, b ) {
    if ( a.answerImportance < b.answerImportance ){
      return -1;
    }
    if ( a.answerImportance > b.answerImportance ){
      return 1;
    }
    return 0;
  }
  
  