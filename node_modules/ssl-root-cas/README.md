IMPORTANT: Try this first
=========

2015-Jul-13: I just discovered that the most common reason you would have the kind of problems this module solves is actually due to **failing to properly bundle the Intermediate CAs** with the server certificate.

**Incorrect Example**

```js
// INCORRECT (but might still work)
var server https.createServer({
  key: fs.readFileSync('privkey.pem', 'ascii')
, cert: fs.readFileSync('cert.pem', 'ascii')   // a PEM containing ONLY the SERVER certificate
});
```

**Correct Example**

```js
// CORRECT (should always work)
var server https.createServer({
  key: fs.readFileSync('privkey.pem', 'ascii')
, cert: fs.readFileSync('fullchain.pem', 'ascii') // a PEM containing the SERVER and ALL INTERMEDIATES
});
```

```bash
# Test your HTTPS effortlessly
npm -g install serve-https

serve-https --servername example.com --cert ./fullchain.pem --key ./privkey.pem
```

You can debug the certificate chain with `openssl`:

```bash
openssl s_client -showcerts \
  -connect example.com:443 \
  -servername example.com
```


**Example `fullchain.pem`**

```
cat \
 cert.pem \
 intermediate-twice-removed.pem \
 interemediate-once-removed.pem \
 > fullchain.pem
```

Note that you **should not** include the `root.pem` in the bundle and that the bundle should be constructed with the least authoritative certificate first - your server's certificate, followed by the furthest removed intermediate, and then the next closest to the root, etc.

Also note that in the case of cross-signed certificates (typically only issued from new root certificate authorities) there may be more than one intermediate at equal distances, in which case either in that tier may come first.

IMPORTANT: Try this next
========================

As of node.js v7.3 the `NODE_EXTRA_CA_CERTS` environment variable can accomplish what most people intend to do with this package. See nodejs/node#9139

```bash
NODE_EXTRA_CA_CERTS='./path/to/root-cas.pem' node example.js
```

SSL Root CAs
=================

The module you need to solve node's SSL woes when including a custom certificate. Particularly, if you need to add a **non-standard Root CA**, then this is the right module for you.

Let's say you're trying to connect to a site with a cheap-o SSL cert -
such as RapidSSL certificate from [name.com](http://name.com) (the **best** place to get your domains, btw) -
you'll probably get an error like `UNABLE_TO_VERIFY_LEAF_SIGNATURE` and after you google around and figure that
out you'll be able to connect to that site just fine, but now when you try to connect to other sites you get
`CERT_UNTRUSTED` or possibly other errors.

**Common Errors**

* `CERT_UNTRUSTED` - the common root CAs are missing, this module fixes that.
* `UNABLE_TO_VERIFY_LEAF_SIGNATURE` could be either the same as the above, or the below
* `unable to verify the first certificate` - the intermediate certificate wasn't bundled along with the server certificate, you'll need to fix that

This module is the solution to your woes!

FYI, I'm merely the publisher, not the author of this module.
See here: https://groups.google.com/d/msg/nodejs/AjkHSYmiGYs/1LfNHbMhd48J

The script downloads the same root CAs that are included with
[Mozilla Firefox](http://www.mozilla.org/en-US/about/governance/policies/security-group/certs/included/),
[Google Chrome](http://www.chromium.org/Home/chromium-security/root-ca-policy),
[`libnss`](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/NSS#CA_certificates_pre-loaded_into_NSS),
and [OpenSSL](https://www.openssl.org/support/faq.html#USER16)\*:
<https://mxr.mozilla.org/nss/source/lib/ckfw/builtins/certdata.txt?raw=1>

\* OpenSSL doesn't actually bundle these CAs, but they suggest using them

**Other Implementations**

  * Golang <https://github.com/agl/extract-nss-root-certs>
  * Perl <https://github.com/bagder/curl/blob/master/lib/mk-ca-bundle.pl>

**Usage Examples**

  * https://github.com/coolaj86/nodejs-self-signed-certificate-example
  * https://github.com/coolaj86/nodejs-ssl-trusted-peer-example

Install
=====

```javascript
npm install ssl-root-cas --save
```

Usage
=====

General usage:

```js
'use strict';
var rootCas = require('ssl-root-cas/latest').create();

// default for all https requests
// (whether using https directly, request, or another module)
require('https').globalAgent.options.ca = rootCas;
```

### CERT_UNTRUSTED

`CERT_UNTRUSTED`

**Old Versions of node.js**:

If you have to run an old version of node, but need the latest CAs
(i.e. you get `CERT_UNTRUSTED` on well-known and properly configured websites)
then this alone should solve your problems:

```javascript
var rootCas = require('ssl-root-cas/latest').create();

// fixes ALL https requests (whether using https directly or the request module)
require('https').globalAgent.options.ca = rootCas;

var secureContext = require('tls').createSecureContext({
  ca: rootCas
// ...
});
```

**missing Root CA** (such as a company ca)

If you have a newer version of node and still get `CERT_UNTRUSTED`, it's probably
because you're testing against a self-signed or company-issued certificate.

Follow the instructions above, but also use `addFile`, like this:

```
var rootCas = require('ssl-root-cas/latest').create();

rootCas.addFile(__dirname + '/ssl/00-company-root-ca.pem');
```

### unable to verify the first certificate

`unable to verify the first certificate`

When you get this error it means that the webserver you are connecting to
is misconfigured and did not include the intermediate certificates in the certificate
it sent to you.

You can work around this by adding the missing certificate:

```javascript
'use strict';

var rootCas = require('ssl-root-cas/latest').create();

rootCas
  .addFile(__dirname + '/ssl/01-cheap-ssl-intermediary-a.pem')
  .addFile(__dirname + '/ssl/02-cheap-ssl-intermediary-b.pem')
  ;

// will work with all https requests will all libraries (i.e. request.js)
require('https').globalAgent.options.ca = rootCas;
```

### using the latest certificates

For the sake of version consistency this package ships with the CA certs that were
available at the time it was published,
but for the sake of security I recommend you use the latest ones.

If you want the latest certificates (downloaded as part of the postinstall process),
you can require those like so:

```
var rootCas = require('ssl-root-cas/latest').create();

require('https').globalAgent.options.ca = rootCas;
```

You can use the ones that shippped with package like so:

```
var rootCas = require('ssl-root-cas').create();

require('https').globalAgent.options.ca = rootCas;
```

API
---

### addFile(filepath)

This is just a convenience method so that you don't
have to require `fs` and `path` if you don't need them.

```javascript
require('ssl-root-cas/latest')
  .addFile(__dirname + '/ssl/03-cheap-ssl-site.pem')
  ;
```

is the same as

```javascript
var https = require('https');
var cas;

cas = https.globalAgent.options.ca || [];
cas.push(fs.readFileSync(path.join(__dirname, 'ssl', '03-cheap-ssl-site.pem')));
https.globalAgent.options.ca = cas;
```

### rootCas

If for some reason you just want to look at the array of Root CAs without actually injecting
them, or you just prefer to
`https.globalAgent.options.ca = require('ssl-root-cas').rootCas;`
yourself, well, you can.

### inject()

(deprecated)

I thought it might be rude to modify `https.globalAgent.options.ca` on `require`,
so I afford you the opportunity to `inject()` the certs at your leisure.

`inject()` keeps track of whether or not it's been run, so no worries about calling it twice.


Kinda Bad Ideas
=====

```javascript
    'use strict';

    var request = require('request');
    var agentOptions;
    var agent;

    agentOptions = {
      host: 'www.example.com'
    , port: '443'
    , path: '/'
    , rejectUnauthorized: false
    };

    agent = new https.Agent(agentOptions);

    request({
      url: "https://www.example.com/api/endpoint"
    , method: 'GET'
    , agent: agent
    }, function (err, resp, body) {
      // ...
    });
```

By using an `agent` with `rejectUnauthorized` you at limit the security vulnerability to the requests that deal with that one site instead of making your entire node process completely, utterly insecure.

### Other Options

If you were using a self-signed cert you would add this option:

```javascript
    agentOptions.ca = [ selfSignedRootCaPemCrtBuffer ];
```

For trusted-peer connections you would also add these 2 options:

```javascript
    agentOptions.key = clientPemKeyBuffer;
    agentOptions.cert = clientPemCrtSignedBySelfSignedRootCaBuffer;
```



REALLY Bad Ideas
===

Don't use dissolutions such as these. :-)

This will turn off SSL validation checking. This is not a good idea. Please do not do it.
(really I'm only providing it as a reference for search engine seo so that people who are trying
to figure out how to avoid doing that will end up here)

```javascript
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
```

The same dissolution from the terminal would be

```bash
export NODE_TLS_REJECT_UNAUTHORIZED="0"
node my-service.js
```

It's unfortunate that `process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';` is even documented. It should only be used for debugging and should never make it into in sort of code that runs in the wild. Almost every library that runs atop `https` has a way of passing agent options through. Those that don't should be fixed.


# Appendix

Other information you might want to know while you're here.

## Generating an SSL Cert

Just in case you didn't know, here's how you do it:

```
openssl req -new -sha256 -newkey rsa:2048 -nodes -keyout server.key -out server.csr
```

**DO NOT FILL OUT** email address, challenge password, or optional company name

However, you *should* fill out country name, FULL state name, locality name, organization name.

*organizational unit* is optional.

```
cat server.csr
```

That created a signing request with a sha-256 hash.

When you submit that to the likes of RapidSSL you'll get back an X.509 that you should call `server.crt.pem` (at least for the purposes of this mini-tutorial).

You **must** use a bundled certificate for your server (the server and intermediates, **not** root) and pass that as the `cert` option, **not** as the `ca` (which is used for peer-certificate checking).

### A single HTTPS server

Here's a complete working example:

```javascript
'use strict';

var https = require('https');
var fs = require('fs');
var express = require('express');
var app = express();
var sslOptions;
var server;
var port = 4080;

require('ssl-root-cas/latest')
  .inject()
  .addFile(__dirname + '/ssl/Geotrust Cross Root CA.txt')
  // NOTE: intermediate certificates should be bundled with
  // the site's certificate, which is issued by the server
  // when you connect. You only need to add them here if the
  // server is misconfigured and you can't change it
  //.addFile(__dirname + '/ssl/Rapid SSL CA.txt')
  ;

sslOptions = {
  key: fs.readFileSync('./ssl/privkey.pem')
, cert: fs.readFileSync('./ssl/fullchain.pem')
};

app.use('/', function (req, res) {
  res.end('<html><body><h1>Hello World</h1></body></html>');
});

server = https.createServer(sslOptions);
server.on('request', app);
server.listen(port, function(){
  console.log('Listening on https://' + server.address().address + ':' + server.address().port);
});
```

### Multiple HTTPS servers using SNI

I know this works - because I just bought two SSL certs from RapidSSL (through name.com),
a Digital Ocean VPS,
and played around for an hour until it did.

:-)

File hierarchy:

```
/etc/letsencrypt
└── live
    ├── aj.the.dj
    │   ├── cert.pem        // contains my server certificate
    │   ├── chain.pem       // contains RapidSSL intermediate
    │   ├── cert+chain.pem  // contains both
    │   └── privkey.pem     // my private key
    ├── ballprovo.com
    │   ├── cert.pem
    │   ├── chain.pem
    │   ├── cert+chain.pem
    │   └── privkey.pem
    ├── server.js
    └── ssl
        ├── Geotrust Cross Root CA.txt // the Root Authority
        └── Rapid SSL CA.txt           // the Intermediate Authority
```


#### `server.js`

```javascript
'use strict';

var https = require('https');
var http = require('http');
var fs = require('fs');
var crypto = require('crypto');
var express = require('express');
var vhost = require('vhost');

  // connect / express app
var app = express();

  // SSL Server
var secureContexts = {};
var secureOpts;
var secureServer;
var securePort = 4443;

  // force SSL upgrade server
var server;
var port = 4080;

  // the ssl domains I have
var domains = ['aj.the.dj', 'ballprovo.com'];

require('ssl-root-cas/latest')
  .inject()
  .addFile(__dirname + '/ssl/Geotrust Cross Root CA.txt')
  //.addFile(__dirname + '/ssl/Rapid SSL CA.txt')
  ;

function getAppContext(domain) {
  // Really you'd want to do this:
  // return require(__dirname + '/' + domain + '/app.js');

  // But for this demo we'll do this:
  return connect().use('/', function (req, res) {
    console.log('req.vhost', JSON.stringify(req.vhost));
    res.end('<html><body><h1>Welcome to ' + domain + '!</h1></body></html>');
  });
}

domains.forEach(function (domain) {
  secureContexts[domain] = crypto.createCredentials({
    key:  fs.readFileSync(__dirname + '/' + domain + '/privkey.pem')
  , cert: fs.readFileSync(__dirname + '/' + domain + '/cert+chain.pem')
  }).context;

  app.use(vhost('*.' + domain, getAppContext(domain)));
  app.use(vhost(domain, getAppContext(domain)));
});

// fallback / default domain
app.use('/', function (req, res) {
  res.end('<html><body><h1>Hello World</h1></body></html>');
});

//provide a SNICallback when you create the options for the https server
secureOpts = {
  //SNICallback is passed the domain name, see NodeJS docs on TLS
  SNICallback: function (domain) {
    console.log('SNI:', domain);
    return secureContexts[domain];
  }
  // fallback / default domain
  , key:  fs.readFileSync(__dirname + '/aj.the.dj/privkey.pem')
  , cert: fs.readFileSync(__dirname + '/aj.the.dj/cert+chain.pem')
};

secureServer = https.createServer(secureOpts, app).listen(securePort, function(){
  console.log("Listening on https://localhost:" + secureServer.address().port);
});

server = http.createServer(function (req, res) {
  res.setHeader(
    'Location'
  , 'https://' + req.headers.host.replace(/:\d+/, ':' + securePort)
  );
  res.statusCode = 302;
  res.end();
}).listen(port, function(){
  console.log("Listening on http://localhost:" + server.address().port);
});
```

Other SSL Resources
=========

Zero-Config clone 'n' run (tm) Repos:


* [io.js / node.js HTTPS SSL Example](https://github.com/coolaj86/nodejs-ssl-example)
* [io.js / node.js HTTPS SSL Self-Signed Certificate Example](https://github.com/coolaj86/nodejs-self-signed-certificate-example)
* [io.js / node.js HTTPS SSL Trusted Peer Client Certificate Example](https://github.com/coolaj86/nodejs-ssl-trusted-peer-example)
* [SSL Root CAs](https://github.com/coolaj86/node-ssl-root-cas)

Articles

* [Creating an SSL Certificate for node.js](http://greengeckodesign.com/blog/2013/06/15/creating-an-ssl-certificate-for-node-dot-js/)
* [HTTPS Trusted Peer Example](http://www.hacksparrow.com/express-js-https-server-client-example.html/comment-page-1)
* [How to Create a CSR for HTTPS SSL (demo with name.com, node.js)](http://blog.coolaj86.com/articles/how-to-create-a-csr-for-https-tls-ssl-rsa-pems/)
* [coolaj86/Painless-Self-Signed-Certificates-in-node](https://github.com/coolaj86/node-ssl-root-cas/wiki/Painless-Self-Signed-Certificates-in-node.js)
