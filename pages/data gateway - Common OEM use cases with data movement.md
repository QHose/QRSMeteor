Below you will find an example OEM use case scenario where we convert source tables into active QVDs which can be consumed by a Qlik Sense app as usual. 
We use this approach if you have 
-  multiple on premise databases,  
- multiple Qlik Sense SaaS tenants (one for each your customers) 
- the data per customer/tenant is not that big for an analytics app. 
- you want almost real time data refreshes for the analytics apps without impacting the source database (CPU/Memory usage)
- 
data gateway - data movement introduction architecture.png

# Detailed architecture in a multitenant setup
https://raw.githubusercontent.com/QHose/QRSMeteor/Integration-v2/pages/data%20gateway%20-%20data%20movement%20OEM.md

# Complete architecture overview
In the beginning of this chapter we discussed the different methods of moving data into the cloud. Below we define an example integrated architecture for the scenario: - data gateway - data movement  

# Data gateway - data movement
The picture below outlines the complete integration 
- the embedding of content 
- the automatic provisioning using the APIs 
- the data replication to the cloud  

Your APIs connect to the Qlik Cloud. You setup the security first, next you copy the template apps from the source tenant to each of your customer tenants. Each app tries to reload from the S3 connection. So you only need to change the S3 connection once for each tenant.   Each Qlik Sense cloud tenant has access to on premise data via the Qlik Data Gateway - Data Movement. The data inside the buckets is being refreshed by a continious data replication process using change data capture (CDC) technology. 
SaaS integration charts - Data movement.png![image](https://github.com/QHose/QRSMeteor/assets/12411165/1d1161be-ef24-4a98-873c-df917591ce8d)
