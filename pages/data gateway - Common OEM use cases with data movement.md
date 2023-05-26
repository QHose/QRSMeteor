Below you will find an example OEM use case scenario where we convert source tables into active QVDs which can be consumed by a Qlik Sense app as usual. 
We use this approach if you have 
-  multiple on premise databases,  
- multiple Qlik Sense SaaS tenants (one for each your customers) 
- the data per customer/tenant is not that big for an analytics app. 
- you want almost real time data refreshes for the analytics apps without impacting the source database (CPU/Memory usage)

![image](https://github.com/QHose/QRSMeteor/assets/12411165/13d1bf7d-cb81-4ae0-a084-de28903b95e5)

# Detailed architecture in a multitenant setup

In the beginning of this chapter we discussed the different methods of moving data into the cloud. Below we define an example integrated architecture for the scenario: data gateway - data movement  

The picture below outlines the complete integration 
- the embedding of content 
- the automatic provisioning using the APIs 
- the data replication to the cloud  

![image](https://github.com/QHose/QRSMeteor/assets/12411165/24e517a8-7814-49dc-940d-dfda1ad1ef46)

Your APIs connect to the Qlik Cloud. You setup the security first, next you copy the template apps from the source tenant to each of your customer tenants. Each app tries to reload from the S3 connection. So you only need to change the S3 connection once for each tenant. Each Qlik Sense cloud tenant has access to on premise data via the Qlik Data Gateway - Data Movement. The data inside the buckets is being refreshed by a continious data replication process using change data capture (CDC) technology. 

