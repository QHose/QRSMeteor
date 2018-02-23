var SITES = {
    "answers": "Golden Answers",
    "sizing": "Hardware Configurator",
    "slidesgen": "Slides Generator",
    "qmi": "QMI"
};
var cbMessageTimeout;

function sendRequest( url, method, body, successFn, errorFn ) {
    var xhr = new XMLHttpRequest();

    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function() {
        if (this.readyState !== 4) {
            return;
        }
        if (this.status !== 200) {
            if ( errorFn) errorFn({status:this.status, statusText: this.statusText});
            return; // or whatever error handling you want
        }
        successFn(this);
    };
    if ( body && method === 'POST' ) {
        xhr.send(JSON.stringify(body));
    } else {
        xhr.send();
    }
}


function loadHTML(file, id) {
    sendRequest(file, 'GET', null, function(response){
        document.getElementById(id).innerHTML = response.responseText;
        if ( CustomEvent && document.dispatchEvent ) {
            var event;
            if ( file.indexOf("header.html") !== -1) {
                event = new CustomEvent("onepresales-frame-header", { "file": "header" });
            } else if ( file.indexOf("footer.html") !== -1 ) {
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



window.initOnePresales = function initOnePresales( website ) {

    loadHTML('bower_components/onepresales-frame/html/header.html', 'headerContainer');
    loadHTML('bower_components/onepresales-frame/html/footer.html', 'footerContainer');

    var html1 = "",
        html2 = "";
    if ( !website ) {
        for (let s in SITES){
             html1 += '<li><a href="/'+s+'">'+SITES[s]+'</a></li>';
        }
    } else {
        html1 ='<li><a href="/'+website+'">'+SITES[website]+'</a></li>';
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

document.addEventListener("onepresales-frame-footer", function(event) {
    document.getElementById('feedback-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      var body = {};
      formData.forEach(function(entry, key){
        body[key] = entry;
      })

      if ( body.name && body.email && body.subject && body.message ) {
          var message = document.getElementById("cb-message");
          sendRequest('/api/feedback', 'POST', body, function(response) {

            message.innerHTML = "<p class='text-success'>Thank you!</p>";
            message.style.display = 'block';

            clearTimeout(cbMessageTimeout);
            cbMessageTimeout = setTimeout(function(){
                message.style.display = 'none';
            }, 3000);

          }, function(err){

            message.innerHTML = "<p class='text-danger'><span class='fa fa-warning'></span> There was an error sending feedback. Please try later.</p>";
            message.style.display = 'block';

            clearTimeout(cbMessageTimeout);
            cbMessageTimeout = setTimeout(function(){
                message.style.display = 'none';
            }, 3000);

          })
      }
    });
});

function openFeedback(){
    document.getElementById("feedback-form").reset();
    document.getElementById("onepresales-feedback").style.display = 'block';
}

function hideFeedback(){
    document.getElementById("onepresales-feedback").style.display = 'none';
}

// Create the event
if ( CustomEvent && document.dispatchEvent ) {
    var event = new CustomEvent("onepresales-frame-loaded", { "msg": "OnePresales is loaded" });
    document.dispatchEvent(event);
    console.log("OnePresales-Frame loaded!");
}


