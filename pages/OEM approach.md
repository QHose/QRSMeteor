# Introduction

If you partner with Qlik you will have to integrate Qlik Cloud into your software, multiple steps are involved which we try to outline here. 

You will create one tenant for your development work (source tenants), next you will create a tenant for each of your customers (target tenants). On your development tenant you will create templates dashboards (apps), which you want to distribute to your target tenants (for each customer 1 tenant).

Each tenant is isolated and has no relationship to other tenants. 
![image](https://user-images.githubusercontent.com/12411165/236406238-e6bc5f15-5d44-4bc8-9f66-5a5881f44425.png)


# Create a dashboard template for each module of your software
Qlik Sense offers a wide array of beautiful visualizations in order to show your data as you want it. With the open standard of Qlik Sense it is very easy to download or create additional visualizations. 
With our drag and drop and scalability possibilities it is very easy to create a beautiful and powerful dashboard.

In your OEM source tenant your team will create multiple templates.
* Define the modules for which you want to make a dashboard/app
* What are the typical answers your customers have around this topic? What do they want to see or know?
* Which tables do you need from all your sources?
* [Create a data model](https://learning.qlik.com/pluginfile.php/99033/mod_resource/content/9/Load_Data/Load_Data.html)
* [Design the front end](https://youtu.be/u54qqmRQ16w?t=61)

Now you created your template apps we can provision them to each of your customer tenants.

# Provisioning your multitenant environment
* For each of your customers we will 
  * create a separate tenant. 
  * copy the template app from the source to the customer specific tenant. The idea of this step is that you can use a master layout and copy this to all of your customers. This layout is supported by you and locked (visible as "public sheets"). If users want to create their own sheets they can copy your sheet and edit it or [create a new one using AI]() ![image](https://user-images.githubusercontent.com/12411165/236413583-a8832390-b82d-40a5-b08e-9e556dc45b78.png)

  * update the data loading logic inside the script of the app to connect to the correct database (or limit the dataset using a where clause)
  * reload the app to index the data from the source table into the app (a compressed copy of your source tables into the Qlik Sense app)

You can execute the API calls to do this in multiple ways
* use our [REST APIs](https://integration.qlik.com/?selection=iMxYBXhjSijBw9Rp4) or more specific in [this deployment guide](https://qlik.dev/manage/platform-operations/overview)
* use our [CLI](https://qlik.dev/toolkits/qlik-cli)
* use [Qlik application automation](https://integration.qlik.com/?selection=EeA3BBpZzZfGGPnQs)

## Your configuration data contains notes of Qlik settings per customer
In your SaaS platfrom you will keep a note of the following for each customer (tenant)
* Qlik tenantId
* AppId for your module (e.g. a sales app for the sales module inside your platform)

# Embed qlik content into your SaaS platform
Now the Qlik Sense environment has been provisioned (we created the tenants, and loaded/copied/indexed the customer specific data into customer specific apps), we have to embed the dashboads into your platform. 

There are [multiple ways](https://integration.qlik.com/?selection=qxT68oNhfBA8Nxz35), but the must easy way is to embed sheets using an IFrame, this has the main advantage that its quick and proven and you don't have to do that much development. 

In your platform you can make a menu linking to the apps inside Qlik. You will dynamically create the link, since each customer will link to a different sales app. (they all have their own copy of the "sales" template or whatever template app you made).

So in your menu you can create the links as follows:
![image](https://user-images.githubusercontent.com/12411165/236432587-ab1d2a41-a5c0-428f-9586-8a50a35a8f4e.png)
>These are the links which you can find in the [demo](https://integrationdemo2.qlik.com/) under the "Select page the embed" menu.

This will render the IFrame linke this:

![image](https://user-images.githubusercontent.com/12411165/236431992-4db8b92a-075e-486a-baed-eed363a3062a.png)

# Integrated architecture

The picture below outlines the complete integration

- the embedding of content
- the automatic provisioning using the APIs
- the data indexing into the cloud
- Your APIs connect to the Qlik Cloud. You setup the security first, next you copy the template apps from the source tenant to each of your customer tenants. Each app reloads (copies) data from your tenant specific source database. 
![image](https://user-images.githubusercontent.com/12411165/236435583-e13bb7ba-63ab-41ea-86d4-37900b3fb7f9.png)

If you can't connect to your source database because you don't want to open your firewall you can look the [Qlik Data Gateway](https://integration.qlik.com/?selection=6tnPFkfYjncwiQ4Ea).

# Security

When Qlik Sense is embedded, normally Single Sign-On must be provided for authentication using OIDC or JWT. After that, authorization must be applied (What can a user see and what rights does he have?). The good thing is that users, roles, groups,…. that are already defined in your SaaS platform, can be re-used in Qlik Sense.

We create a tenant for each of your customers (a completely seperate Qlik environment, there is no link between your customer tenants. You will record the tenant settings in your configuration database and use the information together with your APIs to provision Qlik Sense).
We will map your group membership to a predefined role in Qlik Sense (e.g. a view group from your platform supplied via the JWT token, gets the "can view" role in the customer specific Qlik Sense tenant.)

Read more in the [security section](https://integration.qlik.com/?selection=igvu7dEBSy5D2Mti3

# Qlik training
Visit [Qlik continous classroom](https://learning.qlik.com/mod/page/view.php?id=24708&) which includes a lot of free content or use [Qlik consulting](https://www.qlik.com/us/services/qlik-consulting)




