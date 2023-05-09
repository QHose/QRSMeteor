With multitenant provisioning, Qlik offers the ability to automate with flexible cloud APIs, key onboarding and maintenance tasks including tenant creation, configuration and ongoing content hydration at scale for both OEM ISV partners and enterprise customers.
A multitenant architecture/deployment approach provides the OEM partner the ability to customize each end customer individually with appropriate configurations, capability settings, and most importantly, many opportunities to flexibly cross-sell/upsell back to each end customer in a personalized fashion – meeting their needs uniquely allowing for different monetization routes.

To summarize: Using Qlik Cloud each end customer will get its own tenant. This is what we call "a tenant per tenant". If you want to automate the complete provisioning of your platform you have two options
- Use the APIs to [setup a multitenant environment](https://qlik.dev/tutorials/platform-operations-overview). Or in addition to raw APIs, Qlik provides the 
- [Platform Operations connector](https://community.qlik.com/t5/Official-Support-Articles/Qlik-Application-Automation-How-to-get-started-with-the-Qlik/ta-p/2038740)  This provides you with a no-code method for deploying and managing content across your Qlik Cloud estate) in [Qlik Application Automation](https://www.qlik.com/us/products/application-automation).

# Customer specific provisioning
Let's take a closer look at the detailed steps on how to provision the whole environment. 

![image](https://github.com/QHose/QRSMeteor/assets/12411165/0066552e-7d5e-471c-8b5b-e6885c474e6e)

Let’s do a deeper dive and understand each step. What are the activities that your SaaS broker or Qlik Application automation automates in the demo? What are the steps or stages?
- First it will create and configure a tenant for each customer. For example it will create the JWT configuration to enable the single sign on, set the license and upload your authorization groups. 
- Secondly it will copy the template app. 
- Next it replaces the script with a customer-specific one.  Or in most cases you just have to replace the database connection. 
- Using the new script, the app is reloaded.  This is where we basically make a compressed copy of the data and create the associative model. 
- In the final stage we publish the app in the managed space.

# Why does a Multitenant  approach  matter?
Qlik is recommending this approach to all of our OEM partners interested in moving to Qlik Cloud and all new prospects.  It will be a game changer for our OEM partners. 
- will enable a faster onboarding to the cloud providing faster time to market, 
- With less ongoing development overhead, 
- It will provide a clean separation of OEM’s customer tenants and the flexibility to integrate the partner’s solution(s) as needed, etc. 
- Again this approach provides that necessary security layer, segregation and data governance with data privacy compliance
![image](https://github.com/QHose/QRSMeteor/assets/12411165/b12c5347-4171-4069-be35-f5110ac93c29)
