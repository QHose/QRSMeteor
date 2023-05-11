With multitenant provisioning, Qlik offers the ability to automate with flexible cloud APIs, key onboarding and maintenance tasks including tenant creation, configuration and ongoing content hydration at scale for both OEM ISV partners and enterprise customers.
A multitenant architecture/deployment approach provides the OEM partner the ability to customize each end customer individually with appropriate configurations, capability settings, and most importantly, many opportunities to flexibly cross-sell/upsell back to each end customer in a personalized fashion – meeting their needs uniquely allowing for different monetization routes.

To summarize: Using Qlik Cloud each end customer will get its own tenant. This is what we call "a tenant per tenant". 
![image](https://github.com/QHose/QRSMeteor/assets/12411165/e9de84e4-3d3d-4d6e-a457-3b3679274c46)

If you want to automate the complete provisioning of your platform you have two options
- Use the APIs to [setup a multitenant environment](https://qlik.dev/tutorials/platform-operations-overview). Or in addition to raw APIs, Qlik provides the 
- [Platform Operations connector](https://community.qlik.com/t5/Official-Support-Articles/Qlik-Application-Automation-How-to-get-started-with-the-Qlik/ta-p/2038740)  This provides you with a no-code method for deploying and managing content across your Qlik Cloud estate) in [Qlik Application Automation](https://www.qlik.com/us/products/application-automation).


# Distribute a template dashboard from your source to your target (customer) tenants
Let’s consider the goals of embedding Qlik Sense in a multi tenant SaaS environment. 
Ultimately you want to provide a unique dashboard to each of your end customers.  You might also want to enable your customers to extend their own dashboards with their own sheets and charts.  But you don’t want to maintain these separate dashboards. 

In the next few chapters we will explain how you can use our APIs or Qlik Application automation to provision your platform. We will create a separate tenant and make a copy of the template app for each of your customers and load it with customer-specific data. 
In this picture, we’ve made a few assumptions:
we’ve assumed you already have a multi-tenant SaaS platform and 
thus assume you have a piece of software which acts as a broker;  a software capability that you already use today to maintain your SaaS applications for all your customers.

The principle of SaaS automation is quite simple. You first create a template app, also called a dashboard, and you make a copy for each of the customer instances on your SaaS platform. The template app already contains a template with 80% of the functionality and we provide some predefined sheets, charts, dimensions and measures to get you started.

![image](https://github.com/QHose/QRSMeteor/assets/12411165/03024f61-f2cd-4987-aef3-d4656e721c0b)


# What are the steps for an individual (target) tenant?

Let’s do a deeper dive and understand each step. What are the activities that your SaaS broker or Qlik Application automation automates in the demo? What are the steps or stages?
- First it will create and configure a tenant for each customer. For example it will create the JWT configuration to enable the single sign on, set the license and upload your authorization groups. 
- Secondly it will copy the template app. 
- Next it replaces the script with a customer-specific one.  Or in most cases you just have to replace the database connection. 
- Using the new script, the app is reloaded.  This is where we basically make a compressed copy of the data and create the associative model. 
- In the final stage we publish the app in the managed space.

![image](https://github.com/QHose/QRSMeteor/assets/12411165/0f52f3fe-010c-4f71-904c-815f282d3397)


# The overal architecture
Here we see a visualization of a complete integration in a multi-tenant environment in action

![image](https://github.com/QHose/QRSMeteor/assets/12411165/d9500f8e-8c52-43c4-a449-ebc13d19df74)


On the left side you will see the current SaaS platform which needs its analytics update. We have implemented and integrated Qlik Sense which you will see on the lower right. 
In the middle you find the broker, a piece of software you already have to which we add some API calls so that Qlik Sense will also be controlled by your software. Or alternatively you can call a trigger URL inside Qlik application automation to do the setup for you. That simplifies the setup on your side.

We’ve assumed you have a database per customer instance and you also have a master database in the left corner which contains the customers, the database connections, user rights and possibly customer specific custom tables and fields.

Your software is now in control.  Your software selects the template apps that need to be copied to each customer tenant. In the demo platform we simulate this by pressing the ‘provision customers’ button. This button will execute the activities by making use of the REST and websocket based APIs. It then creates a customer specific tenant, copies, reloads and publishes the app into a managed space.

Now our end customer users John and Linda will get a personalized dashboard which shows only the data they are authorized/allowed to see.

If you want you can also allow users like Linda to create their own sheets.  In the self service demo you can try this by selecting Linda.


# Why does a Multitenant  approach  matter?
Qlik is recommending this approach to all of our OEM partners interested in moving to Qlik Cloud and all new prospects.  It will be a game changer for our OEM partners. 
- will enable a faster onboarding to the cloud providing faster time to market, 
- With less ongoing development overhead, 
- It will provide a clean separation of OEM’s customer tenants and the flexibility to integrate the partner’s solution(s) as needed, etc. 
- Again this approach provides that necessary security layer, segregation and data governance with data privacy compliance
![image](https://github.com/QHose/QRSMeteor/assets/12411165/b12c5347-4171-4069-be35-f5110ac93c29)
