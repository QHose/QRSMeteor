var Reveal = require('reveal');
// Full list of configuration options available here: 
// https://github.com/hakimel/reveal.js#configuration 
Reveal.initialize({
    controls: true,
    progress: true,
    history: true,
    center: true,
    // default/cube/page/concave/zoom/linear/fade/none 
    transition: 'none',
});

Template.slides.onRendered(function name() {
    console.log('created');
})

Template.slides.helpers({
    create: function() {

    }
});

Template.slides.events({
    'click #foo': function(event, template) {

    }
});