# TLDR
Install meteor.com then run this application and you will get the full integration.qlik.com environment including the SaaS app provisioning demo, documentation etc on your local server. 

With this project you can create apps for each customer based on a template app. (and much more). (In other words,you get software to get an 'app publisher' for Qlik Sense)
A live running instance of this code is visible at [integration.qlik.com](http://integration.qlik.com)
Also make sure you checkout the [slide generator](http://integration.qlik.com/slides), which explains SaaS integration using the Qlik Sense APIs.

# Welcome to the SaaS with Qlik Sense demo platfom

Assumption: you want to know you to use Qlik Sense in a multi-tenant scenario.
- you have customers
- you want to create a template apps
- automatically setup Qlik Sense for each customer.
Watch [this video](https://youtu.be/OulQS-1fH-A?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk) to learn the concept of what we automated here.

## App provisioning
![](http://integration.qlik.com/images/saas%20demo%20concept%20simple.png)

This platform shows you how to
- create a template app and publish into the templates stream
- Then use the template apps copy it to each customer/department
- reloading it by using a 'custom script' (e.g. find replace database connection)
- Publish it into the stream with the name of the customer
- We will forward the roles/groups of your SaaS platform to Qlik Sense and using a security rule (something like user.group = stream.name) we can authorize on streams with just one rule (!)
![alt tag](https://github.com/QHose/QRSMeteor/blob/master/public/images/simple%20intro%20to%20saas%20automation.gif)

## Automatic installation of Qlik Sense (new, almost completed)
We are lazy... and we hate errors, therefore this tool automatically sets up Qlik Sense. 

After you installed Qlik Sense, and you have installed this project [see this manual](https://github.com/QHose/QRSMeteor/blob/master/public/docs/Qlik%20Sense%20SaaS%20demo%20tool%20setup%20instructions.docx) (Manual needs to be updated to reflect the automatic installation, it still assumes  you hae to do it by hand)

This project will automatically create/set (based on what you define in your settings.json file in the project root)
- insert the license
- create the template streams 
- upload the template apps from the .automation\apps folder
- publish the template apps into the stream needed for this demo platform:
- upload the extensions from the .automation\extensions folder
- create security rules (to be completed)
- create and assign a custom property for each app and stream created (to be completed, only to be used for enterprise deployments. For OEM/multi-tenant scenarios we use the groups provided in the ticket to authorize on.)


## Other resources

![](http://integration.qlik.com/images/architecture%20-%20OEM%20%20SaaS%20scenario%20simple.png)

Watch [this playlist](https://www.youtube.com/playlist?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk) for a complete overview on Sense integration. The topics include security, web integration (QAP) and architecture.

See [qlik community](https://community.qlik.com/docs/DOC-9533) for an introduction to Qlik Sense integration

# Introduction
This "non Qlik" but Meteor.js based platform has been designed to demonstrate the power of the Qlik Sense APIs for companies that are looking to integrate Qlik Sense in their multi-tenant SaaS platform. Please look at the video's below for an introduction. In the demo you will see a screen divided into two parts.

The left side shows "the broker" in your SaaS platform; a piece of software that you already use today to mass maintain the SaaS applications for all of your customers. This broker executes its activities based on the list of your customers, their access rights and the relevant template apps (depending on what the customer has configured in your platform).
The right side shows you the result of the activities of the broker; the apps and streams automatically created in Qlik Sense. This is also the side where you have to select your first template app.
This demo tries to show you the activities from Sense that you can automate in your platform. Sense internally also works with the same REST APIs you can use, so you can record the REST call from each manual activity in the QMC and use this code to create/delete/reload/publish streams and apps in your software. We will not cover all the use cases, lets say we cover 80%, but the examples and code provided should give you enough convidence to build the remaining 20% yourself.

# How to use the demo?

The principle is very simple. This demo shows you how you can copy an app (dashboard) for each of your customers. Next to creating a copy, we will also reload the app with data from the customers database (by replacing the SQL based load script). Because you can insert a custom script you can also specify customer specific data models like "free fields and tables". In the end we make a stream (a way of grouping apps) per customer and publish the app into this stream. The demo consists of 4 steps.

You first have to enter some customers
Select a template
Press generate
Select a user, and test the single sing on.

# Authentication
The internal REST calls use both certificate (QPS logout for example) and header authentication only for demo purposes. In production you would normally only use certificates, unless you have a authenticating reverse proxy. The end users connect to Sense via the Meteor virtual proxy (Sense QMC config item). Make sure that you also logout the user on this proxy. (you can login/logout per proxy!)

## Setup your own SaaS provisioning system using this code

See [this manual](https://github.com/QHose/QRSMeteor/blob/master/public/docs/Qlik%20Sense%20SaaS%20demo%20tool%20setup%20instructions.docx) 

### Summary of the new automatic installation
- install meteor
- Clone QRSMeteor in some 'project root' directory
- make a copy of the settings-development-example.json and update it. Make sure you update at least the host, webIntegrationHost, internalLanIP (hostname of Qlik Sense inside your LAN, this is just your computer name for simple setups), and port settings. If you install everything (qlik sense and the 2 meteor project on one machine, use  the hostname, not localhost!). Update your Qlik Sense license. Set the customerDataDir, automationBaseFolder

### Docker 
I also created docker images but they are not yet ready to be used. (they can be used but contain an older version of this project) 
* docker pull qhose/qrsmeteor
* docker pull qhose/sensewebintegration

[See this flow chart](https://www.lucidchart.com/documents/embeddedchart/feaf7d0e-cd67-44f5-ad35-ea849ff6d274). If want to know how to build a node image from a windows meteor project. Mind the tabs in the top with build and run. 

# Install your own deployment using the source code 
[see this manual](https://github.com/QHose/QRSMeteor/blob/master/public/docs/Qlik%20Sense%20SaaS%20demo%20tool%20documentation%20of%20source%20code.docx) to learn more about this source code.
See this [sequence diagram](http://knsv.github.io/mermaid/live_editor/#/view/c2VxdWVuY2VEaWFncmFtCkJyb3dzZXItPj5pbnRybyBwYWdlOiBjbGllbnRcbWFpbi5qcwpOb3RlIHJpZ2h0IG9mIGludHJvIHBhZ2U6IChpcm9uKXJvdXRlciBsb2FkcyB0ZW1wbGF0ZSBmb3Igcm91dGUgcGF0aCAvLiBjbGllbnRcbWFpbi5qcyBsb2FkcyBhbGwganMgYW5kIGh0bWwgaW4gXGltcG9ydHMgaW5jbHVkaW5nIHJvdXRlci5qcyB0aGF0IG1hcHMgdXJscyB0byBibGF6ZSB0ZW1wbGF0ZXMuIEFsbCB0ZW1wbGF0ZXMgYXJlIGxvY2F0ZWQgaW4gaW1wb3J0c1x1aS4gQWxsIHBhZ2VzIHVzZSB0aGUgc2FtZSBsYXlvdXQgd2l0aCB0aGUgaGVhZGVyIGFuZCBmb290ZXIuIFRoZSBjZW50ZXIgY29udGVudCAoeWllbGQgaW4gbGF5b3V0Lmh0bWwpIGlzIHJlcGxhY2VkIGJ5IHRoZSByb3V0ZXIuIFRoZSBsYXlvdXQgZW5naW5lIHVzZWQgaXMgQmxhemUsIHdoaWNoIHVzZXMgc3BhY2ViYXJzIChhIGZvcmsgb2YgSGFuZGxlYmFycykKaW50cm8gcGFnZS0tPj4gQnJvd3Nlcjogc2hvdyBpbnRyb2R1Y3Rpb24gdmlkZW9zIHBhZ2UKQnJvd3Nlci0-PiBHZW5lcmF0aW9uIHRlbXBsYXRlOiB1c2VyIGNsaWNrcyBkZW1vIGJ1dHRvbiB3aGljaCBvcGVucyBcZ2VuZXJhdGlvbiBwYXRoIGFuZCAgY29ycmVzcG9uZGluZyB0ZW1wbGF0ZQpOb3RlIHJpZ2h0IG9mIEdlbmVyYXRpb24gdGVtcGxhdGU6IEVhY2ggdGVtcGxhdGUgaGFzIGV2ZW50cyBhbmQgaGVscGVycyB3aGljaCBjb21tdW5pY2F0ZSB3aXRoIHRoZSBzZXJ2ZXIuIEhlbHBlcnMgY3JlYXRlIHJlYWR5IHRvIHVzZSBkYXRhLCBzbyB0aGF0IHRoZSBIVE1MIHJlbWFpbnMgc2ltcGxlLiBFdmVudHMgYXJlIHRyaWdnZXJlZCB3aGVuIHRoZSB1c2VyIGNsaWNrcyBvbiBzb21ldGhpbmcuCkdlbmVyYXRpb24gdGVtcGxhdGUtPj5TZXJ2ZXI6TWV0ZW9yLmNhbGwoImdldEFwcHMiKSB0aGUgc2VydmVyIGhhcyBtZXRob2RzIGZvciBlYWNoIGZ1bmN0aW9uLgpOb3RlIHJpZ2h0IG9mIFNlcnZlcjogU2VydmVyIHNpZGUgb2YgbWV0ZW9yIHNzdGFydHMgd2l0aCBzZXJ2ZXIvbWFpbi5qcyB0aGlzIGZpbGUgY29udGFpbnMgdGhlIE1ldGVvciBtZXRob2RzLiBUaGlzIGZpbGUgYWxzbyBpbXBvcnRzIGl0cyBkZXBlbmRlbmNpZXMuIExpa2UgdGhlIFNlbnNlIGZ1bmN0aW9ucy4KU2VydmVyLT4-QXBwRnVuY3Rpb25zOiBhIGZpbGUgcGVyIFNlbnNlIHR5cGUKTm90ZSByaWdodCBvZiBTZXJ2ZXI6IGEgZmlsZSBmb3IgUVBTLCBhcHBzLCBzdHJlYW1zLCBzeXN0ZW1ydWxlcwpOb3RlIHJpZ2h0IG9mIEFwcEZ1bmN0aW9uczogTWV0ZW9yIHNlcnZlciBzaWRlIGNvbW11bmljYXRlcyB3aXRoIFFsaWsgU2Vuc2UgdXNpbmcgUVJTIFJFU1QgYW5kIGVuZ2luZSAocXNvY2tzKSBBUEkgZm9yIHJlbG9hZHMuIEFsbCBjYWxscyBiZXR3ZWVuIE1ldGVvciBhbmQgU2Vuc2UgZ28gdmlhIGpzIGluIGltcG9ydHNcYXBpXHNlcnZlci4gVGhlIGFwcEZ1bmN0aW9ucyBhbHNvIGNvbnRhaW4gdGhlIGFwcCBnZW5lcmF0aW9uIGNoYWluIG9mIGV2ZW50cy4gKENvcHksIGRlbGV0ZSwgcHVibGlzaCwgcmVsb2FkVmlhRW5naW5lIGV0Yy4pCkFwcEZ1bmN0aW9ucy0-PlFsaWsgU2Vuc2U6Y29ubmVjdCB0byBTZW5zZVxxcnNcYXBwXGZ1bGwKUWxpayBTZW5zZS0tPj5HZW5lcmF0aW9uIHRlbXBsYXRlOmFwcCBsaXN0IGluIEpTT04gZm9ybWF0CkdlbmVyYXRpb24gdGVtcGxhdGUtLT4-QnJvd3NlcjogZm9yIGVhY2ggImFwcCIgcHJpbnQgbmFtZSBldGMu) to view the flow in the source code of the application and with Qlik Sense engine and QRS API. See the QMC-API calls menu in the demo for the real time REST calls and their JSON messages.

Or this [sequence diagram](https://is.gd/iVtFG9) for the generation part 
Or this [sequence diagram](http://knsv.github.io/mermaid/live_editor/#/view/c2VxdWVuY2VEaWFncmFtCkJyb3dzZXItPj5NZXRlb3Igd2ViIGludGVncmF0aW9uIGRlbW86IFVzZXIgbG9ncyBpbiBpbnRvIE1ldGVvciAKQnJvd3Nlci0-PiBQcm94eTogSUZyYW1lIHRyaWVzIHRvIG9wZW4gU2Vuc2UgY29udGVudCB2aWEgbGluayB0aGF0IGNvbnRhaW5zIC9wcm94eS8KUHJveHktPj5NZXRlb3IgU1NPIGNsaWVudDogUmVkaXJlY3QgcmVxdWVzdCB0byB3ZWJwYWdlIG9uIHRoZSBjbGllbnQgKGNsaWVudCBzaWRlIHJvdXRlKS4KCk5vdGUgcmlnaHQgb2YgUHJveHk6IFByb3h5IGFsc28gaW5jbHVkZXMgdGFyZ2V0SWQgPSA8SUQgZm9yIHRoZSBvcmlnaW5hbCBVUkkgdGhhdCB0aGUgdXNlciB0cmllcyB0byBhY2Nlc3M-LCBhbmQgcHJveHlSZXN0VXJpID0gPHRoZSBVUkkgd2hlcmUgdGhlIGF1dGhlbnRpY2F0aW9uIG1vZHVsZSBjYW4gYWNjZXNzIHRoZSBSRVNUIEFQST4KTWV0ZW9yIFNTTyBjbGllbnQtPk1ldGVvciBzZXJ2ZXI6ICBjbGllbnQgY2FsbHMgKHVzZXIgYXdhcmUpIHNlcnZlciBzaWRlIG1ldGhvZApOb3RlIHJpZ2h0IG9mIE1ldGVvciBzZXJ2ZXI6IFNpbmNlIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIGluIE1ldGVvciwgd2UgY2FuIHJlcXVlc3QgdGhlIHVzZXJJRCBhbmQgZ3JvdXAgbWVtYmVyc2hpcCBmcm9tIHRoZSBNZXRlb3Igc2Vzc2lvbi4gVHJ1c3QgbWVjaGFuaXNtOiBTZXJ2ZXIgaW1wb3J0ZWQgUWxpayBTZW5zZSBjbGllbnQgY2VydGlmaWNhdGUuCk1ldGVvciBzZXJ2ZXItPj5RUFMgQVBJOiBSZXF1ZXN0IHRpY2tldCBhdCBRUFMgQVBJLCBwcm92aWRlIHRoZSB1c2VySWQgYW5kIGdyb3VwcyBpbiBKU09OLgpOb3RlIHJpZ2h0IG9mIE1ldGVvciBzZXJ2ZXI6IE9wdGlvbmFsbHkgaW5jbHVkZSB0aGUgcmVkaXJlY3QgcGFyYW1ldGVyIHRvIGZvcndhcmQgdGhlIHVzZXIgYmFjayB0byB0aGUgcGFnZSBoZSBpbml0aWFsbHkgdHJpZWQgdG8gYWNjZXNzLgpRUFMgQVBJLS0-Pk1ldGVvciBzZXJ2ZXI6IFFQUyBBUEkgcmV0dXJucyBhIHRpY2tldCBudW1iZXIgKGFuZCBwb3NzaWJseSByZWRpcmVjdCBVUkwpIHdoaWNoIHlvdSBoYXZlIHRvIGFwcGVuZCBpbiB0aGUgVVJMIApNZXRlb3Igc2VydmVyLS0-PiBNZXRlb3Igd2ViIGludGVncmF0aW9uIGRlbW86IENyZWF0ZSBhIHJlZGlyZWN0IFVSTCB3aGljaCB0aGUgY2xpZW50IGNvZGUgY2FuIHB1dCBpbiB0aGUgYnJvd3NlciBVUkwgYmFyLiAKTm90ZSByaWdodCBvZiBNZXRlb3Igd2ViIGludGVncmF0aW9uIGRlbW86IENsaWVudCBzaWRlIGNvZGUsIHJlcGxhY2VzIHRoZSB1cmwgaW4gYnJvd3NlciwgYW5kIGZvcndhcmRzIHRoZSB1c2VyIHRvIFFsaWsgU2Vuc2UuIFVzZXIgbm93IHJlY2VpdmVzIGEgUWxpayBTZW5zZSBzZXNzaW9uIGNvb2tpZSAoc2VlIHZpcnR1YWwgcHJveHkgY29uZmlnKSwgYW5kIGFuZCBzdWNoIHNpbmdsZSBzaWduIG9uIGlzIGNvbmZpZ3VyZWQu) to see how this demo platform has implemented single sign on, using Qlik Sense ticketing.

## Automation using the REST calls
The main connection between Meteor and Qlik Sense can be found [here](https://github.com/QHose/QRSMeteor/tree/master/imports/api/server)

# Thank you
For always being available to support us with this project: Johan Bäcklin, Alexander Karlsson, Jeffrey Goldberg, Rob Fallows (Centiq Ltd)
