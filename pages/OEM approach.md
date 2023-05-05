# Introduction

You will create one tenant for your development work (source tenants), next you will create a tenant for each of your customers (target tenants). On your development tenant you will create templates dashboards (apps), which you want to distribute to your target tenants (for each customer 1 tenant).

Each tenant is isolated and has no relationship to other tenants. 
![image](https://user-images.githubusercontent.com/12411165/236406238-e6bc5f15-5d44-4bc8-9f66-5a5881f44425.png)


# Create a dashboard templates for each module of your software
Qlik Sense offers a wide array of beautiful visualizations in order to show your data as you want it. With the open standard of Qlik Sense it is very easy to download or create additional visualizations. 
With our drag and drop and scalability possibilities it is very easy to create a beautiful and powerful dashboard.

In your OEM source tenant your team will create multiple templates.
* Define the modules for which you want to make a dashboard/app
* What are the typical answers your customers have around this topic? What do they want to see or know?
* Which tables do you need from all your sources?
* [Create a data model](https://learning.qlik.com/pluginfile.php/99033/mod_resource/content/9/Load_Data/Load_Data.html)
* [Design the front end](https://youtu.be/u54qqmRQ16w?t=61)

# provisioning your multitenant environment
* For each of your customers we will 
  * create a separate tenant. 
  * copy the template app from the source to the customer specific tenant. The idea of this step is that you can use a master layout and copy this to all of your customers. This layout is supported by you and locked (visible as "public sheets").If users want to create their own sheets they can copy your sheet and edit. or create a new one ![image](https://user-images.githubusercontent.com/12411165/236413583-a8832390-b82d-40a5-b08e-9e556dc45b78.png)

  * update the data loading logic inside the script of the app to connect to the correct database (or limit the dataset using a where clause)
  * reload the app to index the data from the source table into the app (a compressed copy of your source tables into the Qlik Sense app)
* 
