# Welcome to the SaaS with Qlik Sense demo platfom

See http://92-111-9-190.static.chello.nl for a real demo.
Watch https://youtu.be/RuL8p2DiPF4 to understand the concept. Or this playlist to learn more about the security and complete integration setup, https://www.youtube.com/playlist?list=PLqJfqgR62cVAZxS34WGnByjASKrGf0Fpk

This "non Qlik" but Meteor.js based platform has been designed to demonstrate the power of the Qlik Sense API's for companies that are looking to integrate Qlik Sense in their multi-tenant SaaS platform. Please look at the video's below for an introduction. In the demo you will see a screen divided into two parts.

The left side shows "the broker" in your SaaS platform; a piece of software that you already use today to mass maintain the SaaS applications for all of your customers. This broker executes its activities based on the list of your customers, their access rights and the relevant template apps (depending on what the customer has configured in your platform).
The right side shows you the result of the activities of the broker; the apps and streams automatically created in Qlik Sense. This is also the side where you have to select your first template app.
This demo tries to show you the activities from Sense that you can automate in your platform. Sense internally also works with the same REST API's you can use, so you can record the REST call from each manual activity in the QMC and use this code to create/delete/reload/publish streams and apps in your software. We will not cover all the use cases, lets say we cover 80%, but the examples and code provided should give you enough convidence to build the remaining 20% yourself.

# How to use the demo?

The principle is very simple. This demo shows you how you can copy an app (dashboard) for each of your customers. Next to creating a copy, we will also reload the app with data from the customers database (by replacing the SQL based load script). Because you can insert a custom script you can also specify customer specific data models like "free fields and tables". In the end we make a stream (a way of grouping apps) per customer and publish the app into this stream. The demo consists of 4 steps.

You first have to enter some customers
Select the "my first template" app on the right of the screen (this is the Qlik Sense side)
Press generate
Select a user, and test the single sing on.

# REST calls
The main connection between Meteor and Qlik Sense can be found here https://github.com/QHose/QRSMeteor/tree/master/imports/api/server
Don't get distracted by the API_LOG object. I only need that for the demo, to insert the request and response from the call in the database. so you can view the results here http://saaswithqlik.com/APILogs. 

# Authentication
The internal REST calls use both certificate (QPS logout for example) and header authentication only for demo purposes. In production you would normally only use certificates, unless you have a authenticating reverse proxy. The end users connect to Sense via the Meteor virtual proxy (Sense QMC config item). Make sure that you also logout the user on this proxy. (you can login/logout per proxy!)
