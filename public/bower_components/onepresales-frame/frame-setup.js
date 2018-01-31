function loadHTML(file, id) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', file, true);
    xhr.onreadystatechange = function() {
        if (this.readyState !== 4) return;
        if (this.status !== 200) return; // or whatever error handling you want
        document.getElementById(id).innerHTML = this.responseText;

        if ( file.indexOf("header.html") !== -1) {
            var event = new CustomEvent("onepresales-frame-header", { "file": "header" });
            // Dispatch/Trigger/Fire the event
            document.dispatchEvent(event);
        }

    };
    xhr.send();
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;
}



window.initOnePresales = function initOnePresales( website ) {

    loadHTML('bower_components/onepresales-frame/html/header.html', 'headerContainer');
    loadHTML('bower_components/onepresales-frame/html/footer.html', 'footerContainer');

    var sites = {
        "answers": "Golden Answers",
        "sizing": "Hardware Configurator",
        "slides": "Slides Generator",
        "qmi": "QMI"
    };

    var html1 = "",
        html2 = "";
    if ( !website ) {
        for (let s in sites){
             html1 += '<li><a href="/'+s+'">'+sites[s]+'</a></li>';
        }
    } else {
        html1 ='<li><a href="/'+website+'">'+sites[website]+'</a></li>';
        html2 = '<li><a href="/">More tools...</a></li>'
    }

    document.addEventListener("onepresales-frame-header", function(){
        document.getElementById("navbar-onepresales-left").innerHTML = html1;
        document.getElementById("navbar-onepresales-right").innerHTML = html2;

        var cookieUser = getCookie("user");
        if ( cookieUser ) {
            var user = JSON.parse(cookieUser);
            var h = document.getElementById("user-container");
            h.innerHTML = "<span>"+user.firstname +" " + user.lastname + " <span class='caret'></span></span>";
        }

        //var l = document.getElementById("logout-href");
        //l.setAttribute("href", '/api/logout');
    });
}

// Create the event
if ( CustomEvent && document.dispatchEvent ) {
    console.log("OnePresales-Frame loaded!");
    var event = new CustomEvent("onepresales-frame-loaded", { "msg": "OnePresales is loaded" });
    // Dispatch/Trigger/Fire the event
    document.dispatchEvent(event);
}


