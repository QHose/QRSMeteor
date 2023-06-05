export var Reveal = require("reveal.js");
import MicroModal from 'micromodal';
import "./reveal.css";
import "./helper.css"; //accessibility plugin for reveal https://github.com/marcysutton/reveal-a11y
import lodash from "lodash";
import hljs from "highlight.js";
import { Logger } from "/imports/api/logger";
import { getSlideGenApp, getLevel1, getSubjectArea } from "/imports/ui/useCases/useCaseSelection";
import { selectInSense } from "/imports/ui/nav";
import "./slideSelectionSheet";
// import { fill } from 'core-js/core/array';

_ = lodash;
var Cookies = require("js-cookie");
var showdown = require("showdown");
showdown.setFlavor('github');
var converter = new showdown.Converter({tables:true, openLinksInNewWindow: true});
var marked = require('marked');
// console.log(converter.getOptions());
var numberOfActiveSlides = 10;
export const MenuItems = new Mongo.Collection(null);
export const ChapterItems = new Mongo.Collection(null);

//
// ─── SLIDES ─────────────────────────────────────────────────────────────────────
//

// console.log('SHOWDOWN SETTINGS: ', showdown.getDefaultOptions());

Template.registerHelper('chapterSlide', function (currentRow) {
    if (typeof (currentRow) === 'string') { //we got a chapter slide        
        return true
    }
});

Template.slides.onCreated(async function () {
    await populateNavMenuItems();

    $("body").css({
        overflow: "overlay"
    });
});

Template.slideShareModal.onRendered(function () {
    try {
        MicroModal.init({
            awaitCloseAnimation: true, // set to false, to remove close animation
            onShow: function (modal) {
                console.log("micromodal open");
                addModalContentHeight('short');
                var link = document.getElementById("shareRef")
                const range = document.createRange();
                range.selectNode(link);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                document.execCommand('copy');
                /**************************
                  For full screen scrolling modal, 
                  uncomment line below & comment line above
                 **************************/
                // addModalContentHeight('tall');               
            },
            onClose: function (modal) {
                // console.log("micromodal close");
            }
        });
    } catch (e) {
        // console.log("micromodal error: ", e);
    }

});




Template.slide.onCreated(async function () {
    await populateChapters();
});


async function populateChapters() {
    var qix = await getSlideGenApp();
    var items = await getLevel1(qix);

    ChapterItems.remove({});
    //insert items in a collection
    for (const item of items) {
        ChapterItems.insert(item[0]);
    }
};

Template.slides.onRendered(async function () {
    initializeReveal();
    Reveal.sync();
    this.$(".reveal").removeAttr("role"); //removed to comply with WCAG 4.1.2
});


Template.chapters.events({
    "click a": async function (event, template) {
        var menuItem = event.currentTarget.id;
        Session.set("currentChapter", menuItem);
        console.log('make selection in chapter based on id: ' + menuItem)
        await selectInSense('Level 1', menuItem);
    }
});


async function populateNavMenuItems() {
    var qix = await getSlideGenApp();
    var items = await getSubjectArea(qix);

    MenuItems.remove({});
    //insert items in a collection
    for (const item of items) {
        MenuItems.insert(item[0]);
    }
};

function addSlideChangedListener() {
    // console.log('!!!!!!!!!!!!! addSlideChangedListener')
    Reveal.addEventListener("slidechanged", function (evt) {
        Session.set("activeStepNr", evt.indexh);
        setTimeout(function () {
            $(".ui.embed").embed();
        }, 200)

        //set html title    
        document.title = $(".present h1").text()
    });
}

//
// ─── SLIDE CONTENT ──────────────────────────────────────────────────────────────────────
//
Template.slideContent.onCreated(async function () {
    var instance = this;
    instance.bullets = new ReactiveVar([]); //https://stackoverflow.com/questions/35047101/how-do-i-access-the-data-context-and-the-template-instance-in-each-case-event
    instance.comment = new ReactiveVar([]);
    instance.level2 = new ReactiveVar([]);

    //the header and sub header for which we want to load the slide data/bullets
    var level1 = Template.currentData().slide[0].qText;
    var level2 = Template.currentData().slide[1].qText;
    instance.level2.set(level2)
    // and now let's get the slide content:
    instance.bullets.set(await getLevel3(level1, level2));
    //get the comment of the page
    instance.comment.set(await getComment(level1, level2));
});

Template.slideContent.helpers({
    bullets: function () {
        return Template.instance().bullets.get();
    },
    comment: function () {
        var comment = Template.instance().comment.get();
        if (comment.length > 10) return createCommentBox(comment);
    }
});

Template.slideContent.onRendered(async function () {
    var template = this;

    // this.$("a:first").css.focus()
    this.$("a:first").attr("id", "maincontent");


    //if the slide is shown, log it into the database
    Logger.insert({
        userId: Meteor.userId,
        role: Cookies.get("currentMainRole"),
        userProfile: Meteor.user(),
        website: location.href,
        counter: 1,
        eventType: "slideRendered",
        topic: this.data.slide[0].qText,
        slide: this.data.slide[1].qText,
        currentSlideNr: Reveal.getIndices().h,
        slidesContainedInSelection: $(".slide").length,
        viewDate: new Date() // current time
    });

    Meteor.setTimeout(function () {

        //make sure all code gets highlighted using highlight.js
        // template.$("pre code").each(function (i, block) {
        //     hljs.highlightBlock(block);
        // });
        //ensure all links open on a new tab
        template.$('a[href^="http://"], a[href^="https://"]').attr("target", "_blank");

        //convert all h1 to h3 headers for accessibility reasons
        template.$('.slideContent .zBullet h1').replaceWith(function () {
            return $("<h3>", {
                "class": this.className,
                "html": $(this).html()
            });
        });

        template.$('.slideContent .zBullet h2').replaceWith(function () {
            return $("<h4>", {
                "class": this.className,
                "html": $(this).html()
            });
        });

        $('.commentBox h1').replaceWith(function () {
            return $("<h4>", {
                "class": this.className,
                "html": $(this).html()
            });
        });

        $('.commentBox h2').replaceWith(function () {
            return $("<h5>", {
                "class": this.className,
                "html": $(this).html()
            });
        });

        this.$('img').not('.ui.image').addClass('ui image');

    }, 2000);
});

Template.slideContent.events({
    "click a": function (e, t) {
        e.stopPropagation();
        Logger.insert({
            userId: Meteor.userId,
            userProfile: Meteor.user(),
            role: Cookies.get("currentMainRole"),
            counter: 1,
            eventType: "linkClick",
            topic: Template.parentData(1).slide[0].qText,
            slide: Template.parentData(1).slide[1].qText,
            linkName: e.currentTarget.innerText,
            linkSource: e.target.baseURI,
            viewDate: new Date() // current time
        });
    }
});

//
// ─── HELPERS ────────────────────────────────────────────────────────────────────
//
Template.slides.helpers({
    slideHeaders() {
        return Session.get("slideHeaders"); //only the level 1 and 2 colums, we need this for the headers of the slide
    },
    TableOfContentForChapter() {
        var headers = Session.get("slideHeaders"); //only the level 1 and 2 colums, we need this for the headers of the slide
        var currentChapter = this.toString();
        var toc = [];
        if (headers) {
            for (const element of headers) {
                var level1 = element[0].qText;
                var level2 = element[1].qText
                if (level1 === currentChapter) {
                    toc.push(level2)
                }
            }
        }
        return toc;
    },
    showSelector: function () {
        return Session.get("showSelector");
    },
    showSubjectAreaIntroduction: function () {
        return Session.get("showSubjectAreaIntroduction");
    },
    subjectAreas() {
        var items = MenuItems.find({});
        return items;
    }
});

Template.registerHelper('presentationName', function (object) {
    return Cookies.get("currentMainRole");
});

Template.registerHelper('currentSubjectArea', function (object) {
    return Session.get("currentSubjectArea")
});


Template.slide.helpers({
    active(slideNr) {
        var activeSlide = Session.get("activeStepNr") ? Session.get("activeStepNr") : $(".slide-number").text();
        var active =
            slideNr < activeSlide + numberOfActiveSlides &&
            slideNr > activeSlide - numberOfActiveSlides;
        return active;
    }
});


Template.chapters.helpers({
    chapters() {
        var chapters = ChapterItems.find({});
        return chapters;
    },
    active(chapter) {
        chapter = chapter.qText;
        // console.log("🚀 ~ file: slides.js ~ line 303 ~ active ~ chapter", chapter)
        if (chapter === Session.get("currentChapter")) {
            return 'active'
        }
    }
});


Template.registerHelper('debug', function (object) {
    console.log('td value: ', object)
    // return JSON.parse(object);
});

Template.slideShareModal.helpers({
    shareLinkURL: function () {
        var link = Session.get('shareLinkURL')
        return link;
    }
});



Template.registerHelper("level", function (level, slide) {
    level -= 1;
    return slide[level].qText;
});

Template.registerHelper("step", function () {
    return Session.get("activeStepNr");
});

//
// ─── FOR EACH SLIDE GET THE LEVEL 3 ITEMS USING SET ANALYSIS ────────────────────
//
async function getLevel3(level1, level2) {

    try {
        var qix = await getSlideGenApp();
        var sessionModel = await qix.createSessionObject({
            qInfo: {
                qType: 'cube'
            },
            qHyperCubeDef: {
                qDimensions: [{
                    qDef: {
                        qFieldDefs: ["Level 3"]
                    }
                }, {
                    qDef: {
                        qFieldDefs: ["CSVRowNo"]
                    }
                }],
                qMeasures: [{
                    qDef: {
                        qDef: 'sum({< "Level 1"={"' +
                            level1 +
                            '"}, "Level 2"={"' +
                            level2 +
                            '"}>}1)'
                    }
                }]
            }
        });
        sessionData = await sessionModel.getHyperCubeData('/qHyperCubeDef', [{
            qTop: 0,
            qLeft: 0,
            qWidth: 3,
            qHeight: 3333
        }]);

        var level3Temp = sessionData[0].qMatrix;
        sessionModel.removeAllListeners();

        var sortedLevel3Bullets = normalizeAndSortData(level3Temp);

        var newArray = [];

        for (const item of sortedLevel3Bullets) {
            newArray.push(await convertToHTML(item, level2));
        }

        return newArray;
    } catch (error) {
        //error happens when you select something else after your selection... not a real error
    }

}

export function normalizeAndSortData(senseArray) {
    var result = [];
    senseArray.sort(compare);

    for (const element of senseArray) {
        result.push(element[0].qText);
    }
    return result;
}

function compare(a, b) {
    if (a[1].qNum < b[1].qNum) {
        return -1;
    }
    if (a[1].qNum > b[1].qNum) {
        return 1;
    }
    return 0;
}

function createCommentBox(text) {
    // console.log('createCommentBox for text', text)
    var textAfterCommentMarker = text.split("!comment").pop();
    var messagebox =
        `
        <section class="commentBox">
            <div class="ui icon message">
            <i class="help icon"></i>
            <div class="content">
            <h3 class="header">
            Let's explain what we mean here...
            </h3>
            
                 ` +
        marked.parse(textAfterCommentMarker) +
        `
            </div>
        </div>
        </section>`; //select all text after the !comment... and print it in a nice text box

    return messagebox;
}

//
// ─── FOR EACH SLIDE GET THE COMMENT TEXT USING SET ANALYSIS ─────────────────────
//

async function getComment(level1, level2) {
    var qix = await getSlideGenApp();
    var sessionModel = await qix.createSessionObject({
        qInfo: {
            qType: "cube"
        },
        qHyperCubeDef: {
            qDimensions: [{
                qDef: {
                    qFieldDefs: ["Comment"]
                }
            }],
            qMeasures: [{
                qDef: {
                    qDef: 'sum({< "Level 1"={"' +
                        level1 +
                        '"}, "Level 2"={"' +
                        level2 +
                        '"} >}1)'
                }
            }]
        }
    });
    sessionData = await sessionModel.getHyperCubeData("/qHyperCubeDef", [{
        qTop: 0,
        qLeft: 0,
        qWidth: 2,
        qHeight: 1000
    }]);

    var comment = sessionData[0].qMatrix[0][0].qText;
    return comment != "null" ? comment : "";
}

function normalizeAndSortData(senseArray) {
    var result = [];
    senseArray.sort(compare);
    senseArray.forEach(element => {
        result.push(element[0].qText);
    });
    return result;
}

async function convertToHTML(text, level2) {

    // console.log('convertToHTML text', text)
    var commentMarker = "!comment";
    var embeddedImageMarker = `!embeddedImage`;
    var altText = ''

    //define image url
    var split = text.indexOf('.') + 4;
    var url = text.substr(0, split);  //before . plus 4
    // console.log('image url', url)

    //check if alt text comment exists
    //myimg.jpg my commment bla bla
    altText = text.slice(text.indexOf('.') + 4).trim(); //after img extension
    // console.log('IMAGE altText', altText)

    if (altText.length < 2) {
        altText = level2 + ' ' + text.substr(0, text.indexOf('.'));
    }
    // console.log('image altText', altText)


    //
    // ─── YOUTUBE ────────────────────────────────────────────────────────────────────
    //
    if (containsYouTube(text)) {
        var hasComment = text.trim().indexOf(' ');
        if (hasComment < 0) {
            altText = level2
        } else {
            altText = text.slice(text.indexOf(' ') + 1).trim(); //after space
        }
        var url = text.split(" ")[0] //before space
        var link = '<div class="zBullet"> <a href="' + url + '"> YouTube video: ' + altText + '</a> <br> </div>'
        return link;
    }

    //
    // ─── IFRAME ─────────────────────────────────────────────────────────────────────
    //
    else if (text.startsWith("iframe ")) {
        var urlWithDescription = text.substr(text.indexOf(" ") + 1); //everything after iframe 
        var url = urlWithDescription.split(" ")[0]
        var description = text.substr(text.indexOf(" ") + 1); //everything after iframe 

        return (
            '<iframe  title="' + description + '" src="' +
            url +
            '"frameborder="0"></iframe>'
        );
    }

    //
    // ─── IMAGE ──────────────────────────────────────────────────────────────────────
    // first check if alt text description is present
    //
    else if (checkTextIsImage(text) && text.includes("https://")) {
        return (
            '<div class="ui container"> <img alt="" class="ui centered massive rounded bordered image"  src="' +
            text +
            '"/></div>'
        );
    } else if (checkTextIsImage(text)) {
        return (
            '<div class="ui container"> <img alt="' + altText + '" class="ui centered massive rounded bordered image" src="images/' +
            url +
            '"/></div>'
        );
    } else if (text.startsWith(embeddedImageMarker)) {
        //embedded image in text
        var textMarker = text.split(embeddedImageMarker).pop();
        return (
            '<div class="ui container"><img class="ui massive rounded bordered image"   style="width: 100%;"  alt="Embedded Image" src="data:image/png;base64,' +
            textMarker +
            '"/> </div>'
        );
    }
    //
    // ─── COMMENT ────────────────────────────────────────────────────────────────────
    //
    else if (text.startsWith(commentMarker)) {
        //vertical slide with comments
        //ignore, comments are added on another place
    }

    //
    // ─── CUSTOM HTML ────────────────────────────────────────────────────────────────
    //
    else if (text.startsWith("<")) {
        //custom HTML
        return text;
    }

    //
    // ─── TEXT TO BE CONVERTED TO VIA MARKDOWN ───────────────────────────────────────
    //
    else {
        //text, convert the text (which can include markdown syntax) to valid HTML
        var result = '';
        if (text.endsWith('.md')) { //get content from external url on the server                
            result = await Meteor.callPromise('getHTMLFromMarkdownUrl', text)
            // return result;
            return '<div class="ui container">' + result + "</div>";
        } else { //convert it locally
            result = marked.parse(text);
            if (result.substring(1, 11) === "blockquote") {
                return '<div class="ui green segment">' + result + "</div>";
            } else {
                return '<div class="zBullet">' + result + "<br> </div>";
            }
        }
    }
}


function containsYouTube(target) {
    var pattern = ['youtube.com', 'youtu.be'];
    var value = 0;
    pattern.forEach(function (word) {
        value = value + target.includes(word);
    });
    //contains a string with youtube, but is not markdown, and not custom html...
    return (value === 1 && !target.startsWith("<") && !target.startsWith("["))
}

function checkTextIsImage(target) {
    var pattern = ['.jpeg', '.jpg', '.svg', '.png', '.gif', '.ashx'];
    var value = 0;
    pattern.forEach(function (word) {
        value = value + target.includes(word);
    });
    return (value === 1)
}

/* -------------------------------------------------------------------------- */
/*                                 init reveal                                */
/* -------------------------------------------------------------------------- */

function initializeReveal() {

    if (!window.Reveal) {
        try {
            window.Reveal = Reveal;
            console.log('initializeReveal', Reveal);

            Reveal.initialize({
                dependencies: [
                    {
                        src: 'plugin/accessibility/helper.js', async: true, condition: function () {
                            return !!document.body.classList;
                        }
                    }],
                // slide size
                width: '100%',
                height: '100%',
                // Bounds for smallest/largest possible scale to apply to content
                // minScale: 1,
                // maxScale: 1,
                // Factor of the display size that should remain empty around the content
                margin: 0.1,

                // Bounds for smallest/largest possible scale to apply to content
                minScale: 0.2,
                maxScale: 1.0,

                // Display presentation control arrows
                controls: true,

                // Help the user learn the controls by providing hints, for example by
                // bouncing the down arrow when they first encounter a vertical slide
                controlsTutorial: true,

                // Determines where controls appear, "edges" or "bottom-right"
                controlsLayout: 'edges',

                // Visibility rule for backwards navigation arrows; "faded", "hidden"
                // or "visible"
                controlsBackArrows: 'visible',

                // Display a presentation progress bar
                progress: false,

                // Display the page number of the current slide
                slideNumber: true,

                // Add the current slide number to the URL hash so that reloading the
                // page/copying the URL will return you to the same slide
                hash: false,

                // Push each slide change to the browser history. Implies `hash: true`
                history: false,

                // Enable keyboard shortcuts for navigation
                keyboard: true,

                // Enable the slide overview mode
                overview: true,

                // Vertical centering of slides
                center: false,

                // Enables touch navigation on devices with touch input
                touch: true,

                // Loop the presentation
                loop: false,

                // Change the presentation direction to be RTL
                rtl: false,

                // See https://github.com/hakimel/reveal.js/#navigation-mode
                navigationMode: 'default',

                // Randomizes the order of slides each time the presentation loads
                shuffle: false,

                // Turns fragments on and off globally
                fragments: false,

                // Flags whether to include the current fragment in the URL,
                // so that reloading brings you to the same fragment position
                fragmentInURL: false,

                // Flags if the presentation is running in an embedded mode,
                // i.e. contained within a limited portion of the screen
                embedded: true,

                // Flags if we should show a help overlay when the questionmark
                // key is pressed
                help: true,

                // Flags if speaker notes should be visible to all viewers
                showNotes: false,

                // Global override for autoplaying embedded media (video/audio/iframe)
                // - null: Media will only autoplay if data-autoplay is present
                // - true: All media will autoplay, regardless of individual setting
                // - false: No media will autoplay, regardless of individual setting
                autoPlayMedia: null,

                // Global override for preloading lazy-loaded iframes
                // - null: Iframes with data-src AND data-preload will be loaded when within
                //   the viewDistance, iframes with only data-src will be loaded when visible
                // - true: All iframes with data-src will be loaded when within the viewDistance
                // - false: All iframes with data-src will be loaded only when visible
                preloadIframes: null,

                // Number of milliseconds between automatically proceeding to the
                // next slide, disabled when set to 0, this value can be overwritten
                // by using a data-autoslide attribute on your slides
                autoSlide: 0,

                // Stop auto-sliding after user input
                autoSlideStoppable: true,

                // Use this method for navigation when auto-sliding
                autoSlideMethod: Reveal.navigateNext,

                // Specify the average time in seconds that you think you will spend
                // presenting each slide. This is used to show a pacing timer in the
                // speaker view
                defaultTiming: 120,

                // Enable slide navigation via mouse wheel
                mouseWheel: false,

                // Hide cursor if inactive
                hideInactiveCursor: true,

                // Time before the cursor is hidden (in ms)
                hideCursorTime: 5000,

                // Hides the address bar on mobile devices
                hideAddressBar: true,

                // Opens links in an iframe preview overlay
                // Add `data-preview-link` and `data-preview-link="false"` to customise each link
                // individually
                previewLinks: false,

                // Transition style
                transition: 'slide', // none/fade/slide/convex/concave/zoom

                // Transition speed
                transitionSpeed: 'default', // default/fast/slow

                // Transition style for full page slide backgrounds
                backgroundTransition: 'fade', // none/fade/slide/convex/concave/zoom

                // Number of slides away from the current that are visible, changing this causes scroll issues with iframes
                viewDistance: 1,

                // Parallax background image
                parallaxBackgroundImage: '', // e.g. "'https://s3.amazonaws.com/hakim-static/reveal-js/reveal-parallax-1.jpg'"

                // Parallax background size
                parallaxBackgroundSize: '', // CSS syntax, e.g. "2100px 900px"

                // Number of pixels to move the parallax background per slide
                // - Calculated automatically unless specified
                // - Set to 0 to disable movement along an axis
                parallaxBackgroundHorizontal: null,
                parallaxBackgroundVertical: null,

                // The display mode that will be used to show slides
                display: 'block'
            });


            Session.set("activeStepNr", 0);
            addSlideChangedListener();
        } catch (error) { }
    }
}

function addModalContentHeight(type) {
    var type = (arguments[0] != null) ? arguments[0] : 'short';
    var modalContainer = $("#modal-container");
    var modalHeader = $("#modal-header");
    var modalContentContent = $("#modal-content-content");
    var modalContent = $("#modal-content");
    var modalFooter = $("#modal-footer");

    var modalIsDefined =
        modalContainer.length &&
        modalHeader.length &&
        modalContent.length &&
        modalFooter.length;

    if (modalIsDefined) {
        var modalContainerHeight = modalContainer.outerHeight();
        var modalHeaderHeight = modalHeader.outerHeight();
        var modalFooterHeight = modalFooter.outerHeight();

        console.log("modalContainerHeight: ", modalContainerHeight);
        console.log("modalHeaderHeight: ", modalHeaderHeight);
        console.log("modalFooterHeight: ", modalFooterHeight);

        var offset = 80;

        var height = modalContainerHeight - (modalHeaderHeight + modalFooterHeight + offset);

        console.log('height: ', height);

        if (!isNaN(height)) {
            height = height > 0 ? height : 20;
            if (type == 'short') {
                modalContent.css({ 'height': height + 'px' });
            }
            else {
                modalContainer.css({ 'height': '100%', 'overflow-y': 'hidden', 'margin-top': '40px' });
                modalContentContent.css({ 'height': '100%', 'overflow-y': 'auto' });
                modalContent.css({ 'overflow-y': 'visible' });
                modalFooter.css({ 'margin-bottom': '120px' });
            }
            setTimeout(function () {
                modalContent.css({ 'display': 'block' });
                var modalContentDOM = document.querySelector('#modal-content');
                modalContentDOM.scrollTop = 0;
            });
        }

    }

}