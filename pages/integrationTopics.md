
# Introduction 

When embedding Qlik Sense in your platform, there are several integration topics to handle.  

# Data  
Load your data in a Qlik Sense app. The data can be a combination of different data sources. Qlik Sense has a range of connectors that allow you to analyze ALL your data in a Qlik Sense App. While loading the data, you have the possibility to create an optimized associative data model. That model is then loaded in the memory when the app opens. Next to preloading your data into an app, you can also choose to have realtime apps or specific charts which refresh based on your selections.

Depending on the location of your data, and the settings of your firewall we have multiple options to connect: 
- use our Data Gateway to connect to data behind a firewall. You have 2 options, with the [data gateway - direct access](https://integration.qlik.com/?selection=kzxGWW9PHDmKoBBhb] you can connect to your source like your were on premise, with the [data gateway - data movement](https://integration.qlik.com/?selection=RZj8vS8WH4N3WKdr6) you can replicate your data in almost real time fashion from your on premise data source to the cloud. (This can be Qlik cloud or any other database target)
- use a connector to connect to your cloud data source or on premise database (if you opened the firewall). 

## Direct access (in a multitenant setup)
![SaaS integration charts - Direct access](https://user-images.githubusercontent.com/12411165/227787196-64e46148-368e-4b9c-be26-4209c58595e1.png)
## Data movement (in a multitenant setup)
![image](https://user-images.githubusercontent.com/12411165/227787774-a048df3b-aa4f-4154-a1bb-5a4f2336d3b1.png)

# Security: 
When Qlik Sense is embedded, normally Single Sign-On must be provided for authentication using OIDC or JWT. After that, authorization must be applied (What can a user see and what rights does he have?). The good thing is that users, roles, groups,…. that are already defined in your SaaS platform, can be re-used in Qlik Sense. 
- We create a tenant for each of your customers (a completely seperate Qlik environment, there is no link between your customer tenants. You will record the tenant settings in your configuration database and use the information together with your APIs to provision Qlik Sense).
- We will map your group membership to a predefined role in Qlik Sense (e.g. a view group from your platform supplied via the JWT token, gets the "can view" role in the customer specific Qlik Sense tenant.) 

# Web 
Qlik Sense is built on the newest web technologies (HTML5, JavaScript, CSS). This allows you to create 1 app that can be easily integrated in your SaaS platform. This can be with IFrame, and using our APIs for DIV tag embedding or using Qlik Sense for just the data. Qlik Sense is also completely responsive. So there is no need to create mobile content. 1 App can be used on all platforms.  

# SaaS provisioning 
Our APIs allow the automatic creation of customer content. Creation of tenants, Identity Providers, apps, replacing the script with user specific script (to connect to customer specific database), copying apps, … can all be done automatically.  

# Architecture
Qlik delivers a cloud native enterprise architecture utilizing an elastic microservices architecture that utilizes Docker as our container platform, Kubernetes for orchestration and AWS as our cloud provider.

## Scalability
Qlik’s SaaS solution has been built using best of breed cloud native components
This allows for auto-scaling to meet the demands; from initial testing all the way to final form roll out to tens of thousands of users
We’ve built in resiliency and HA by default. There are no additional configurations / plans / tiers needed here
## Full SaaS
We heard you, you want to get out of the server game. Qlik’s SaaS solution is fully managed, maintained, supported, upgraded by Qlik

## Made for multitenant scenarios

Multitenant provisioning provides our OEM and ISV partners with a deployment model that fits their deployment patterns with each end customer receiving their own tenant. Using multiple tenants logically separates end customers, removing any potential data security issue and, importantly, allowing end customers to use all features in Qlik Cloud.

Multitenant Provisioning for our OEM and ISV partners addresses the following use cases for an OEM partner:   

- Creation of a new tenant
- Configuration of a tenant
- Hydration and updates of a tenant


## Global Tenants
We have tenants available to meet the geographically distributed needs of your users

# App/Dashboard
Qlik Sense offers a wide array of beautiful visualizations in order to show your data as you want it. With the open standard of Qlik Sense it is very easy to download or create additional visualizations. With our drag and drop and scalability possibilities it is very easy to create a beautiful and powerful dashboard.
