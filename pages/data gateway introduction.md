
- Your data is on premise behind firewalls, and you can't open a port.
- Your software or Qlik is in the cloud
- How can you access your data?

![image](https://user-images.githubusercontent.com/12411165/236666972-84856b42-c822-43b9-9376-d7da36c39978.png)

# Solution 1 - direct access -  leave the data where it is
You can choose to leave your data on premise and  - use *data gateway - direct access*. Now you have access to your data from the cloud without the need to open ports in your firewall - create a REST API which exposes your on premise data and configure your firewall accordingly.
Note: you can always combine on premise data using the gateway and other data sources which are available via REST APIs in your analytics app.
# Solution 2 - data movement - replicate the data to a cloud target
You can choose to leave your data on premise and use *data gateway - data movement*. Now you can setup a task to keep your tables in sync or be better said "to be replicated" to the cloud.  
In the cloud you have 2 options: - create a QVD per table and use that in Qlik Sense SaaS - create a table in a cloud database provider
For both options you can set a data refresh schedule
Now your data is being replicated into the cloud without impacting your source system. 
data gateway introduction.png
> Operating behind your organization’s firewall, Qlik Data Gateway - Data Movement allows you to move data from your enterprise data sources to cloud targets, over a strictly outbound, encrypted and mutually authenticated connection. By eliminating the need to open inbound firewall ports, Qlik Data Gateway - Data Movement provides a secure and trusted means for accessing your enterprise data.
Note:  You can use the more traditional approach and open ports in your firewall and let Qlik Sense load data via a REST API as usual. But this is not recommended for security reasons. 
