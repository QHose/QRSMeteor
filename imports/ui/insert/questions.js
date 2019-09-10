import './questions.html'
import { Mongo } from 'meteor/mongo';

export const questions = new Mongo.Collection();
var importantAnswers = [];
var normalAnswers = [];


Template.questions.events({
    'change .normalAnswer'(event) {
        var checked = event.currentTarget.checked;
        var feature = $(event.target).closest('tr').children('td:first').text();

        console.log('checked:', checked)
        if (checked) {
            questions.upsert({})
        }


        console.log(event);
    },
    'submit'(event, template) {
        // Prevent default browser form submit
        event.preventDefault();
        console.log('submit clicked')
        // for each important answer checkbox checked, add to array 
        template.find('tr input:checkbox:first').each(function () {
            console.log('for each tr ', this);
            if (this.checked) {
                b = true;
            }

            // for each normal answer checkbox checked, add to array 

        })
    }
});

