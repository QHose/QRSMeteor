Data movement to cloud targets from on-premise and cloud sources
Based on a schedule your can move all changes in your source database to the cloud.
Once the data is refreshed your app is automatically refreshed with the most recent on premise data.

![image](https://github.com/QHose/QRSMeteor/assets/12411165/aa30edb5-8ffd-4915-8b42-cecb581a0532)

> The landing starts with a full load. You can then keep the data up-to-date using CDC (Change Data Capture) technology, or with full loads scheduled to reload periodically. CDC is supported by all sources, with some limitations. The database must support change processing and be configured adequately.

- [Read more on Qlik help](https://help.qlik.com/en-US/cloud-services/Subsystems/Hub/Content/Sense_Hub/Gateways/replication-gateway.htm)
- [Supported data sources when using Data Gateway - Data Movement](https://help.qlik.com/en-US/cloud-services/Subsystems/Hub/Content/Sense_Hub/DataIntegration/SourcesConnections/supported-sources.htm)

# Detailed data and communication flows

The high-level communication sequence is as follows:  
- The Data Movement gateway establishes a mutually authenticated and encrypted connection to Qlik Cloud, using HTTPS.  
- Qlik Cloud sends a landing task definition to the Data Movement gateway.  
- The Data Movement gateway pushes the data from the enterprise data source to the data warehouse target.

![image](https://github.com/QHose/QRSMeteor/assets/12411165/3828159a-3ec2-4cd0-8197-56ed097a4861)

# How to install the data gateway - data movement (Linux only)
[Visit this instruction video](https://youtu.be/auTmbSMfM4M)
[This guided walk through](https://webapps.qlik.com/agile-dw-automation-part1/index.html) demonstrates Qlik Replicate but has the same steps as the Gateway - data movement so it gives you a good basic understanding of the moving parts. For example a source and target database (schema), and the actual movement of the data. 
