var Reveal = require('reveal');
import 'reveal/index.css';
import 'reveal/theme/default.css';

// Full list of configuration options available here: 
// https://github.com/hakimel/reveal.js#configuration 
Template.slides.onCreated(function name() {

})
Template.slides.onRendered(function name() {
    console.log('slides rendered');

    Reveal.addEventListener('ready', function(event) {
        // event.currentSlide, event.indexh, event.indexv
        Session.set('slideLoading', true);
        console.log('------------------------------------');
        console.log('Reveal is ready to be used');
        console.log('------------------------------------');
    });

    Reveal.initialize({
        embedded: true,
        controls: true,
        progress: true,
        history: true,
        center: true,
        // default/cube/page/concave/zoom/linear/fade/none 
        transition: 'none',
    });
    Reveal.configure({ slideNumber: true });


})


Template.slides.helpers({
    create: function() {

    }
});

Template.slides.events({
    'click #foo': function(event, template) {

    }
});