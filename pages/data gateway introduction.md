
- Your data is on premise behind firewalls, and you can't open a port.
- Your software or Qlik is in the cloud
- How can you access your data?

![image](https://user-images.githubusercontent.com/12411165/236666972-84856b42-c822-43b9-9376-d7da36c39978.png)

# Solution 1 - direct access -  leave the data where it is
You can choose to leave your data on premise and  
- use *data gateway - direct access*. Now you have access to your data from the cloud without the need to open ports in your firewall 
- create a REST API which exposes your on premise data and configure your firewall accordingly.
Note: you can always combine on premise data using the gateway and other data sources which are available via REST APIs in your analytics app.

![image](https://github.com/QHose/QRSMeteor/assets/12411165/8999b0bf-4d31-4970-bd58-392236b8595c)


# Solution 2 - data movement - replicate the data to a cloud target
You can choose to leave your data on premise and use *data gateway - data movement*. Now you can setup a task to keep your tables in sync or be better said "to be replicated" to the cloud.  
In the cloud you have 2 options: 
- create a QVD per table and use that in Qlik Sense SaaS 
- create a table in a cloud database provider
For both options you can set a data refresh schedule. Now your data is being replicated into the cloud without impacting your source system. 

![image](https://github.com/QHose/QRSMeteor/assets/12411165/b1416ef1-5ce6-4c64-af9f-87befbe3faa1)


> Operating behind your organization’s firewall, Qlik Data Gateway Data Movement allows you to move data from your enterprise data sources to cloud targets, over a strictly outbound, encrypted and mutually authenticated connection. By eliminating the need to open inbound firewall ports, Qlik Data Gateway Data Movement provides a secure and trusted means for accessing your enterprise data.

# Overview of data loading scenarios
The picture below outlines the options mentoined above. 
- green lines are using the data gateway  - direct access
- blue lines are using the data gateway  - data movement (they replicate/move the data into a target which can be a cloud database or Qlik Cloud)
- the red line is red here because we assume your firewall is closed for inbound connections.
- purple lines are using a Qlik Sense app connector to load/index the data directly into the app. For example if your data sources are already in the cloud or if you opened your firewall.

![data gateway introduction](https://user-images.githubusercontent.com/12411165/236785092-3405e296-498e-4461-8265-36e48b81776c.png)

