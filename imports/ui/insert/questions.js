import './questions.html'
import { Mongo } from 'meteor/mongo';
import { getAllSlideHeadersPlain, } from "/imports/ui/useCases/useCaseSelection";
import * as nav from "/imports/ui/nav.js";


export const questions = new Mongo.Collection(null);

Template.questions.events({
    'click input'(event) {
        var checked = event.currentTarget.checked;
        // console.log('checked:', checked)
        //get the value of the question answered
        var question = $(event.target).closest('tr').children('td:first').text();
        // console.log('question', question)
        var answerImportance = $(event.currentTarget).attr("class");
        // console.log('answerImportance', answerImportance)

        //store it in the database
        if (checked) {
            questions.insert({ name: question, sort: answerImportance })
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
        console.log('submit clicked', questions.find({}).fetch())
        var answerSet = [];
        // for each answer get GetData  
        try {
            // questions.find({ sort: 'importantAnswer' }).forEach(async function (question) {

            questions.find().forEach(async function (question) {
                console.log('question', question)
                //make a selection
                await nav.makeSearchSelectionInField("Level 2", question.name);
                //get the data
                var slides = await getAllSlideHeadersPlain();
                console.log('slides', slides)
                //add to answerSet

            })
        } catch (error) {
            console.error(error)
        }




    }
});

