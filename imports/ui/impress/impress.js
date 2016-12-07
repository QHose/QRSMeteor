import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { senseConfig as config } from '/imports/api/config';
import '/imports/ui/UIHelpers';

import 'impress';
import './impress.html';
import './impress.css';

Template.impress.onRendered(function() {
	console.log('impress is ', impress);
	var api = impress();
	
	api.init();
	console.log(api);

      Template.instance()
        .$('.ui.embed')
        .embed();
    
    // The `impress()` function also gives you access to the API that controls the presentation.
    
    // Just store the result of the call:
    
    //     var api = impress();
    
    // and you will get three functions you can call:
    
    //     `api.init()` - initializes the presentation,
    //     `api.next()` - moves to next step of the presentation,
    //     `api.prev()` - moves to previous step of the presentation,
    //     `api.goto( stepIndex | stepElementId | stepElement, [duration] )` - moves the presentation to the step given by its index number
    //             id or the DOM element; second parameter can be used to define duration of the transition in ms,
    //             but it's optional - if not provided default transition duration for the presentation will be used.
    
    // You can also simply call `impress()` again to get the API, so `impress().next()` is also allowed.
    // Don't worry, it wont initialize the presentation again.
    
    // For some example uses of this API check the last part of the source of impress.js where the API
    // is used in event handlers.
    

})


// <script>
// if ("ontouchstart" in document.documentElement) { 
//     document.querySelector(".hint").innerHTML = "<p>Tap on the left or right to navigate</p>";
// }
// </script>