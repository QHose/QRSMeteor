Below you will find an example OEM use case scenario where we convert source tables into active QVDs which can be consumed by a Qlik Sense app as usual. 
We use this approach if you have 
-  multiple on premise databases,  
- multiple Qlik Sense SaaS tenants (one for each your customers) 
- the data per customer/tenant is not that big for an analytics app. 
- you want almost real time data refreshes for the analytics apps without impacting the source database (CPU/Memory usage)

![image](https://github.com/QHose/QRSMeteor/assets/12411165/cff1b8a5-4166-4781-900b-2e0317b2d0b9)


# Detailed flow of the multitenant data pipeline

For each customer you will 
- configure a data gateway task connecting to his database
- create a bucket
- create a tenant with an app
- create a database connection to the bucket
- load the data into the app. Please note that there is nothing special about the loading of the data into the app. The whole "real time magic" happens before, this is what the data gateway does for you. On the Qlik Sense side you just load the data from an S3 bucket. 

![image](https://github.com/QHose/QRSMeteor/assets/12411165/2242c771-2713-4db0-a6e6-2af43d426d4a)



# Detailed architecture in a multitenant setup

In the beginning of this chapter we discussed the different methods of moving data into the cloud. Below we define an example integrated architecture for the scenario: data gateway - data movement  

The picture below outlines the complete integration 
- the embedding of content 
- the automatic provisioning using the APIs 
- the data replication to the cloud  

![image](https://github.com/QHose/QRSMeteor/assets/12411165/24e517a8-7814-49dc-940d-dfda1ad1ef46)

Your APIs connect to the Qlik Cloud. You setup the security first, next you copy the template apps from the source tenant to each of your customer tenants. Each app tries to reload from the S3 connection. So you only need to change the S3 connection once for each tenant. Each Qlik Sense cloud tenant has access to on premise data via the Qlik Data Gateway - Data Movement. The data inside the buckets is being refreshed by a continious data replication process using change data capture (CDC) technology. 

