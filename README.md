# Welcome to the SaaS with Qlik Sense demo platfom

Demo site http://92-111-9-190.static.chello.nl/

Watch [this video](https://youtu.be/RuL8p2DiPF4?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk) to learn the concept of the SaaS automation demo.
![alt tag](https://raw.githubusercontent.com/QHose/QRSMeteor/master/public/images/only generation explanation.gif)



Watch [this playlist](https://www.youtube.com/playlist?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk) for a complete overview on Sense integration. The topics include security, web integration (QAP) and architecture.

See [a sequence diagram](http://knsv.github.io/mermaid/live_editor/#/view/c2VxdWVuY2VEaWFncmFtCkJyb3dzZXItPj5NZXRlb3I6IGNsaWVudFxtYWluLmpzCk1ldGVvci0tPj4gQnJvd3Nlcjogc2hvdyBpbnRyb2R1Y3Rpb24gcGFnZQpCcm93c2VyLT4-IE1ldGVvcjogZ28gdG8gZGVtbyB3aGljaCBvcGVucyBcZ2VuZXJhdGlvbiBwYWdlCk5vdGUgcmlnaHQgb2YgTWV0ZW9yOiBNYWluIGxvYWRzIGFsbCBqcyBhbmQgaHRtbCBpbiBcaW1wb3J0cyBpbmNsdWRpbmcgcm91dGVyLmpzIHRoYXQgbWFwcyB1cmxzIHRvIGJsYXplIHRlbXBsYXRlcy4gQWxsIHRlbXBsYXRlcyBhcmUgbG9jYXRlZCBpbiBpbXBvcnRzXHVpCk5vdGUgcmlnaHQgb2YgR2VuZXJhdGlvbiB0ZW1wbGF0ZTogRWFjaCBUZW1wbGF0ZSBoYXMgRXZlbnRzIGFuZCBoZWxwZXJzIHdoaWNoIGNvbW11bmljYXRlIHdpdGggdGhlIHNlcnZlcgpNZXRlb3ItPj4gR2VuZXJhdGlvbiB0ZW1wbGF0ZTpvcGVuIGhlbHBlcnMgYW5kIGV2ZW50cwpHZW5lcmF0aW9uIHRlbXBsYXRlLT4-U2VydmVyOk1ldGVvci5jYWxsKCJnZXRBcHBzIikgdGhlIHNlcnZlciBoYXMgbWV0aG9kcyBmb3IgZWFjaCBmdW5jdGlvbi4KU2VydmVyLT4-QXBwRnVuY3Rpb25zOiBhIGZpbGUgcGVyIFNlbnNlIHR5cGUKTm90ZSByaWdodCBvZiBTZXJ2ZXI6IGEgZmlsZSBmb3IgUVBTLCBhcHBzLCBzdHJlYW1zLCBzeXN0ZW1ydWxlcwpOb3RlIHJpZ2h0IG9mIEFwcEZ1bmN0aW9uczogTWV0ZW9yIHNlcnZlciBzaWRlIGNvbW11bmljYXRlcyB3aXRoIFFsaWsgU2Vuc2UgdXNpbmcgUVJTIFJFU1QgYW5kIGVuZ2luZSAocXNvY2tzKSBBUEkgZm9yIHJlbG9hZHMuIEFsbCBjYWxscyBiZXR3ZWVuIE1ldGVvciBhbmQgU2Vuc2UgZ28gdmlhIGpzIGluIGltcG9ydHNcYXBpXHNlcnZlcgpBcHBGdW5jdGlvbnMtPj5RbGlrIFNlbnNlOmNvbm5lY3QgdG8gU2Vuc2VccXJzXGFwcFxmdWxsClFsaWsgU2Vuc2UtLT4-R2VuZXJhdGlvbiB0ZW1wbGF0ZTphcHAgbGlzdCBpbiBKU09OIGZvcm1hdApHZW5lcmF0aW9uIHRlbXBsYXRlLS0-PkJyb3dzZXI6IGZvciBlYWNoICJhcHAiIHByaW50IG5hbWUgZXRjLg) explaining the flow in the application and with Qlik Sense

See [qlik community](https://community.qlik.com/docs/DOC-9533) for an introduction to Qlik Sense integration

# Introduction
This "non Qlik" but Meteor.js based platform has been designed to demonstrate the power of the Qlik Sense API's for companies that are looking to integrate Qlik Sense in their multi-tenant SaaS platform. Please look at the video's below for an introduction. In the demo you will see a screen divided into two parts.

The left side shows "the broker" in your SaaS platform; a piece of software that you already use today to mass maintain the SaaS applications for all of your customers. This broker executes its activities based on the list of your customers, their access rights and the relevant template apps (depending on what the customer has configured in your platform).
The right side shows you the result of the activities of the broker; the apps and streams automatically created in Qlik Sense. This is also the side where you have to select your first template app.
This demo tries to show you the activities from Sense that you can automate in your platform. Sense internally also works with the same REST API's you can use, so you can record the REST call from each manual activity in the QMC and use this code to create/delete/reload/publish streams and apps in your software. We will not cover all the use cases, lets say we cover 80%, but the examples and code provided should give you enough convidence to build the remaining 20% yourself.

# How to use the demo?

The principle is very simple. This demo shows you how you can copy an app (dashboard) for each of your customers. Next to creating a copy, we will also reload the app with data from the customers database (by replacing the SQL based load script). Because you can insert a custom script you can also specify customer specific data models like "free fields and tables". In the end we make a stream (a way of grouping apps) per customer and publish the app into this stream. The demo consists of 4 steps.

![alt tag](https://raw.githubusercontent.com/QHose/QRSMeteor/master/public/images/quick intro to SaaS with Sense.gif)

You first have to enter some customers
Select the "my first template" app on the right of the screen (this is the Qlik Sense side)
Press generate
Select a user, and test the single sing on.

# Automation using the REST calls
The main connection between Meteor and Qlik Sense can be found here https://github.com/QHose/QRSMeteor/tree/master/imports/api/server
Don't get distracted by the API_LOG object. I only need that for the demo, to insert the request and response from the call in the database.

![alt tag](https://raw.githubusercontent.com/QHose/QRSMeteor/master/public/images/introduction to SaaS demo platform deep dive short.gif)


# Authentication
The internal REST calls use both certificate (QPS logout for example) and header authentication only for demo purposes. In production you would normally only use certificates, unless you have a authenticating reverse proxy. The end users connect to Sense via the Meteor virtual proxy (Sense QMC config item). Make sure that you also logout the user on this proxy. (you can login/logout per proxy!)

# Thank you
For always being available to support us with this project: Johan Bäcklin, Alexander Karlsson, Jeffrey Goldberg, Rob Fallows (Centiq Ltd)
