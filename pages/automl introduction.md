AutoML is an automated machine learning tool in a code free environment. Users can quickly generate models for classification and regression problems with business data. AutoML Automated machine learning finds patterns in your data and uses them to make predictions on future data. Machine learning experiments in the Qlik Cloud hub let you collaborate with other users and integrate your predictive analytics in Qlik Sense apps. In addition to making predictions, you can do an in-depth analysis of the key features that influence the predicted outcome.

- [AutoML in 60 seconds](https://youtu.be/VDYtNcF5jEk)
- [Qlik AutoML - What you should know](https://youtu.be/4TCGyiWfqT4)

# Types of Models Supported
AutoML supports [Classification](https://help.qlik.com/en-US/cloud-services/Subsystems/Hub/Content/Sense_Hub/AutoML/classification-problems.htm) and [Regression](https://help.qlik.com/en-US/cloud-services/Subsystems/Hub/Content/Sense_Hub/AutoML/regression-problems.htm) problems. 
- Binary Classification: used for models with a Target of only two unique values. Example payment default, customer churn.
- Multiclass Classification:  used for models with a Target of more than two unique values. Example grading gold, platinum/silver, milk grade. 
- Regression: used for models with a Target that is a number. Example how much will a customer purchase, predicting housing prices 

# Demo walkthrough 
- [Walkthrough using predictive data in an app](https://app.getreprise.com/launch/D6l9l0n/?trk=feed_main-feed-card_feed-article-content)

# Tutorial videos
- [Getting started with AutoML in Qlik Cloud -5M](https://youtu.be/T7dFQUs_-Ek)
- [Creating a Qlik Sense Predictive Analytics App - 24M](https://youtu.be/vwAt3aH4Hec)


# Trainings
Make sure you check the [free AutoML trainings](https://learning.qlik.com/mod/page/view.php?id=24708&price=free), search for "AutoML".

# Where does AutoML fit in the AI landscape?
![image](https://github.com/QHose/QRSMeteor/assets/12411165/b66b9531-b953-46c0-945d-7315a44eb883)

# Technical deep dive
Now we have an impression of the look and feel, lets take deeper dive...

## What are the steps to embed machine learning capabilities into your Saas platform?
- Source data from multiple sources
- Automatically profiles, indexes, and builds machine-learning ready data model across all that data
- AutoML engine automatically looks for patterns, associations, correlations across all that data, delivering rich predictions and reasons for business 
To predict outcomes
- Simple Deployment at scale into your business-critical apps and systems


![image](https://user-images.githubusercontent.com/12411165/236760266-56186559-30ab-4075-bfdd-ec51e21b6b8e.png)
## End-to-end AutoML Workflow


Putting it all together, the Qlik Cloud platform offers a complete, end-to-end workflow for AutoML.  Of course with Qlik, you can easily bring together data any and all data sources, and can leverage the power of our associative engine to create machine learning ready data sets.  Qlik AutoML then takes users through a simple, no-code workflow to create and deploy models and predictive analytics.  This includes selecting features, training, refining and deploying models, generating predictions and explainability data, publishing predictive data sets, and integrating models into Qlik Sense apps and dashboards for interactive exploration and what-if analysis.  And finally, with our active intelligence capabilities, you can directly trigger action based on predictive insights through alerts, automations, mobile analytics, and embedded analytics in workflows and mission critical applications.  With Qlik, you get the most complete platform available for automated machine learning, taking you rapidly from historical data to predictive insight and action.

![image](https://github.com/QHose/QRSMeteor/assets/12411165/63091552-96f0-46d8-92d4-93437fd1deb1)


## Predictive dashboard
Users can interact with the predictions in 2 ways:
- Load the prediction data in app. In the end you just generate extra data (columns) with AutoML which you want to add into your existing dataset. Next you can create a dashboard as usual and just load this extra data, in most cases its just an "extra column". 
- Using realtime-prediction API. Use sliders or other input objects to manipulate the values and use the real time APIs to analyse the prediction results. 
  - [Example with Postman](https://community.qlik.com/t5/Official-Support-Articles/Qlik-AutoML-How-to-test-API-realtime-predictions-from-Postman/ta-p/1992894)
  - [Example with Python](https://community.qlik.com/t5/Official-Support-Articles/Qlik-AutoML-How-to-generate-predictions-via-API-realtime/ta-p/1995683),
  - [Example in Qlik Sense App](https://community.qlik.com/t5/Official-Support-Articles/Qlik-AutoML-Generate-Predictions-with-AutoML-API-endpoint/ta-p/2045131) and [What if example](https://community.qlik.com/t5/Design/Building-What-If-Scenarios-using-SSE-and-the-Qlik-AutoML/ba-p/1907221).


![automl introduction image](https://user-images.githubusercontent.com/12411165/236759569-78aeaaa6-a707-4188-989f-3cee99fb99bc.png)

## Tutorials 
- [Get started with AutoML](https://community.qlik.com/t5/Official-Support-Articles/How-To-Get-Started-with-Qlik-AutoML/ta-p/1983296)
- Video [Deep dive Building a Predictive analysis dashboard using Qlik Sense & Qlik AutoML](https://youtu.be/bN5OaY3kc6o)
- [How to upload data, training, deploying and predicting a model](https://community.qlik.com/t5/Knowledge/Qlik-AutoML-How-to-upload-model-deploy-and-predict-on-Qlik-Cloud/ta-p/1960164)
- [Qlik help](https://help.qlik.com/en-US/cloud-services/Subsystems/Hub/Content/Sense_Hub/AutoML/home-automl.htm)
- [Community blog](https://community.qlik.com/t5/Official-Support-Articles/How-To-Get-Started-with-Qlik-AutoML/ta-p/1983296)


