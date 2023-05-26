If you don't want to or can't replicate your data to a cloud database or Qlik cloud you can also leave your data on premise
Now you have 2 options: 
- Using the direct access gateway you can connect to your source database like they were on premise (firewall closed for inbound connections) or  
- you can use your existing REST API (firewall open for this REST API port). 
This means you can still do a full load, a delta or a partial load like you did before (with Qlik Sense Client Managed)

# Data  gateway - direct access

Now you have 3 options: 
- Install a gateway per tenant 
- Use source tenant to *move apps* (QVF) 
- Use source tenant to *move tables* (QVD)

## Install a gateway per tenant
To access your data you will need to install a data gateway - direct access for each tenant. (so 1 gateway for 1 tenant. 2 gateways for 2 tenants). Each gateway needs to be run in a separate windows VM.

![image](https://github.com/QHose/QRSMeteor/assets/12411165/7b234564-b85a-4f0f-ba28-d7c1fee48009)



## Use source tenant to move apps (QVF)
In this scenario you will use 1 tenant (the source tenant) to connect to your on premise data source using the data gateway - direct access. (same as with moving tables (QVD)) 
Using the APIs you will copy the template app, connect to the tenant database, reload the app, and move the app (qvf) to the customer tenant. (and repeat this for all your customers)

![image](https://github.com/QHose/QRSMeteor/assets/12411165/b22c5067-afda-433d-9184-a92a533f1aae)


## Use source tenant to move tables (QVD)
In this scenario you will use 1 tenant (the source tenant) to connect to your on premise data source using the data gateway - direct access. (same as with moving apps) 
For each customer you will reload the template app. But in this case you will save the loaded tables (during a reload) to an S3 bucket. Since each customer tenant has access to his own bucket, it can now reload its copy of the template app with its own data. 

![image](https://github.com/QHose/QRSMeteor/assets/12411165/2f183dc8-a0d1-4492-bf6e-1899aebfe13f)


# REST API
You can also just load the data directly into the app if you have a REST connection available to your database. 

![image](https://github.com/QHose/QRSMeteor/assets/12411165/af0e755a-08b8-456b-950b-947a7e437808)


