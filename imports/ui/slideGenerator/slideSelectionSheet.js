import "./slideSelectionSheet.html";
import { getQix, getAllSlides } from "/imports/ui/useCases/useCaseSelection";
import { Reveal } from "/imports/ui/slideGenerator/slides";


Template.slideSelectionSheet.onRendered(function () {
    var iFrame = document.getElementById('selectionSlide');
    // console.log('!!!!!!!!!!!!!!!! resize selection sheet')
    resizeIFrameToFitContent(iFrame);
});


Template.slideSelectionSheet.events({
    "click #sheetSelector": async function (event, template) {
        event.preventDefault();
        Session.set("showSelector", false);

        //RESET SENSE SELECTION OBJECT
        var qix = await getQix();
        qix.app.abortModal(true);

        //reset the slideheaders to ensure all slide content templates are re-rendered.
        Session.set("slideHeaders", null); 
        
        //get slides
        await getAllSlides();

        ////go to the first slide after a data refresh.           
        Reveal.slide(0); 
    }
});

function resizeIFrameToFitContent(iFrame) {
    iFrame.width = document.body.scrollWidth * .9;
    iFrame.height = document.body.scrollHeight * .7
}
