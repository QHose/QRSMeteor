var SITES = {
    "answers": "Technical Insights",
    "sizing": "Sizing Advisor",
    "qmi": "QMI",
    "slidesgen": "Presentation Explorer"
};
var cbMessageTimeout;
var thisTool = "general";

function sendRequest(url, method, body, successFn, errorFn) {
    var xhr = new XMLHttpRequest();

    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function() {
        if (this.readyState !== 4) {
            return;
        }
        if (this.status !== 200) {
            if (errorFn) errorFn({ status: this.status, statusText: this.statusText });
            return; // or whatever error handling you want
        }
        successFn(this);
    };
    if (body && method === 'POST') {
        xhr.send(JSON.stringify(body));
    } else {
        xhr.send();
    }
}


function loadHTML(file, id) {
    sendRequest(file, 'GET', null, function(response) {
        document.getElementById(id).innerHTML = response.responseText;
        if (CustomEvent && document.dispatchEvent) {
            var event;
            if (file.indexOf("header.html") !== -1) {
                event = new CustomEvent("onepresales-frame-header", { "file": "header" });
            } else if (file.indexOf("footer.html") !== -1) {
                event = new CustomEvent("onepresales-frame-footer", { "file": "footer" });
            }
            document.dispatchEvent(event);
        }
    });
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



window.initOnePresales = function initOnePresales(website) {
    
    loadHTML('bower_components/onepresales-frame/html/header.html', 'headerContainer');
    loadHTML('bower_components/onepresales-frame/html/footer.html', 'footerContainer');

    var html1 = "",
        html2 = "",
        classActive = '';

    thisTool = website || "general";
    //if (!website) {
        for (let s in SITES) {
            classActive = '';
            if ( website === s ) {
                classActive = 'class="active"';
            }
            html1 += '<li '+classActive+'><a href="/' + s + '">' + SITES[s] + '</a></li>';
        }
    //} else {
    //    html1 = '<li><a href="/' + website + '">' + SITES[website] + '</a></li>';
    //    html2 = '<li><a href="/">More tools...</a></li>'
    //}

    document.addEventListener("onepresales-frame-header", function() {
        document.getElementById("navbar-onepresales-left").innerHTML = html1;
        document.getElementById("navbar-onepresales-right").innerHTML = html2;

        var cookieUser = getCookie("user");
        if (cookieUser) {
            var user = JSON.parse(cookieUser);
            var h = document.getElementById("user-container");
            h.innerHTML = "<span>" + user.firstname + " " + user.lastname + " <span class='caret'></span></span>";
        }

        //var l = document.getElementById("logout-href");
        //l.setAttribute("href", '/api/logout');
    });
}

document.addEventListener("onepresales-frame-footer", function(event) {

    document.getElementById('feedback-form').addEventListener('submit', (e) => {
        e.preventDefault();
        var about = document.getElementById("selectTool").value;
        if ( about !== 'general') {
            about = SITES[about];
        }
        var body = {
            about: about,
            name: document.getElementById("feedbackName").value,
            subject: document.getElementById("feedbackSubject").value,
            email: document.getElementById("feedbackEmail").value,
            message: document.getElementById("feedbackMessage").value,
            browser: detectBrowser(),
            os: osName()
        };

        if (body.name && body.email && body.subject && body.message) {
            var message = document.getElementById("cb-message");
            var cookieUser = getCookie("user");
            if (cookieUser) {
                var user = JSON.parse(cookieUser);
                body.qlikId_accountid = user.accountid;
                body.qlikId_email = user.email;
                body.qlikId_Id = user.qlikID;
                body.qlikId_firtname = user.firstname;
                body.qlikId_lastname = user.lastname;
            }

            sendRequest('/api/feedback', 'POST', body, function(response) {

                message.innerHTML = "<p class='text-success'>Feedback sent successfully. Thank you!</p>";
                message.style.display = 'block';

                clearTimeout(cbMessageTimeout);
                cbMessageTimeout = setTimeout(function() {
                    message.style.display = 'none';
                }, 3000);

            }, function(err) {

                message.innerHTML = "<p class='text-danger'><span class='fa fa-warning'></span> There was an error sending feedback. Please try later.</p>";
                message.style.display = 'block';

                clearTimeout(cbMessageTimeout);
                cbMessageTimeout = setTimeout(function() {
                    message.style.display = 'none';
                }, 3000);

            });
        }
    });

    
    addGtagScript();
    
});

function openFeedback(about) {
    about = about || thisTool;
    document.getElementById("feedback-form").reset();
    document.getElementById('selectTool').value = about.toLowerCase();
    document.getElementById("onepresales-feedback").style.display = 'block';
}

function hideFeedback() {
    document.getElementById("onepresales-feedback").style.display = 'none';
}

function addGtagAsync() {
    if ( window.location.href.indexOf("localhost") === -1 ) {
        var imported = document.createElement('script');
        imported.src = 'https://www.googletagmanager.com/gtag/js?id=UA-114136363-1';
        imported.setAttribute("type", "text/javascript");
        imported.async = true;
        document.head.appendChild(imported);
    }
}

function addGtagScript() {
    if ( window.location.href.indexOf("localhost") === -1 ) {
        window.dataLayer = window.dataLayer || [];

        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
        var gtagCode = "UA-114136363-1";
        if (window.location.href.indexOf("one.qlik.com") > -1) {
            gtagCode = "UA-114136363-2";
        }
        console.log("gtagCode", gtagCode);
        var cookieUser = getCookie("user");
        if (cookieUser) {
            var user = JSON.parse(cookieUser);
            gtag('config', gtagCode, {
                'user_id': user.qlikID
            });
        } else {
            gtag('config', gtagCode, );
        }
    }
}

function detectBrowser() {
    var nVer = navigator.appVersion;
    var nAgt = navigator.userAgent;
    var browserName = navigator.appName;
    var fullVersion = '' + parseFloat(navigator.appVersion);
    var majorVersion = parseInt(navigator.appVersion, 10);
    var nameOffset, verOffset, ix;

    // In Opera, the true version is after "Opera" or after "Version"
    if ((verOffset = nAgt.indexOf("Opera")) != -1) {
        browserName = "Opera";
        fullVersion = nAgt.substring(verOffset + 6);
        if ((verOffset = nAgt.indexOf("Version")) != -1)
            fullVersion = nAgt.substring(verOffset + 8);
    }
    // In MSIE, the true version is after "MSIE" in userAgent
    else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
        browserName = "Microsoft Internet Explorer";
        fullVersion = nAgt.substring(verOffset + 5);
    }
    // In Chrome, the true version is after "Chrome"
    else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
        browserName = "Chrome";
        fullVersion = nAgt.substring(verOffset + 7);
    }
    // In Safari, the true version is after "Safari" or after "Version"
    else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
        browserName = "Safari";
        fullVersion = nAgt.substring(verOffset + 7);
        if ((verOffset = nAgt.indexOf("Version")) != -1)
            fullVersion = nAgt.substring(verOffset + 8);
    }
    // In Firefox, the true version is after "Firefox"
    else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
        browserName = "Firefox";
        fullVersion = nAgt.substring(verOffset + 8);
    }
    // In most other browsers, "name/version" is at the end of userAgent
    else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) <
        (verOffset = nAgt.lastIndexOf('/'))) {
        browserName = nAgt.substring(nameOffset, verOffset);
        fullVersion = nAgt.substring(verOffset + 1);
        if (browserName.toLowerCase() == browserName.toUpperCase()) {
            browserName = navigator.appName;
        }
    }
    // trim the fullVersion string at semicolon/space if present
    if ((ix = fullVersion.indexOf(";")) != -1)
        fullVersion = fullVersion.substring(0, ix);
    if ((ix = fullVersion.indexOf(" ")) != -1)
        fullVersion = fullVersion.substring(0, ix);

    majorVersion = parseInt('' + fullVersion, 10);
    if (isNaN(majorVersion)) {
        fullVersion = '' + parseFloat(navigator.appVersion);
        majorVersion = parseInt(navigator.appVersion, 10);
    }

    return browserName + " - " + fullVersion;
}

function osName() {
    var OSName = "Unknown OS";
    if (navigator.appVersion.indexOf("Win") != -1) OSName = "Windows";
    if (navigator.appVersion.indexOf("Mac") != -1) OSName = "MacOS";
    if (navigator.appVersion.indexOf("X11") != -1) OSName = "UNIX";
    if (navigator.appVersion.indexOf("Linux") != -1) OSName = "Linux";

    return OSName;
}

// Create the event
if (CustomEvent && document.dispatchEvent) {
    var event = new CustomEvent("onepresales-frame-loaded", { "msg": "OnePresales is loaded" });
    document.dispatchEvent(event);
    console.log("OnePresales-Frame loaded!");
    addGtagAsync();
}