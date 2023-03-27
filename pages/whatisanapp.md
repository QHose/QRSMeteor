
# Introduction to the concept of an app
In order to grasp the concept of an app, it might by a good idea to compare an app with an "Excel file". Both use some kind of connector (e.g. an ODBC connection) to connect to your database, and "copy" the data into the app/Excel file. Also, both the app and the file contain the sheets with vizualizations. So to summarize both an app and an Excel file:
- contain the data loaded by a connector
- contain vizualizations

And at this point the comparison stops...

# What is the unique about the Qlik Associative data engine?
So we now know that you load data into the Qlik associative engine. But what is it exactly? 

The QIX Engine is Qlik’s technology that underpins their data discovery tools like QlikView and Qlik Sense. It is a powerful, in-memory data engine that enables us to rapidly explore relationships in various sources of data, without having to write queries. This experience leverages QIX’s Associative Model. If you’ve ever used a Qlik dashboard before, you are familiar with the Associative Model. Try this example dashboard to get a better feel for it. Click on any data point to filter it and watch how the rest of the data in the application updates in response. This is the true power of data association: exploring the data in a quick and unbounded way.

While Qlik’s core products use this under the hood, we can leverage the power of QIX in any type of solution thanks to Qlik’s APIs. These APIs give us direct access to the QIX Engine, enabling us to incorporate the Associative Model into other technologies. Before we jump into the Engine and the APIs though, let’s get a better understanding of what the Associative Model is and why we might use it over traditional data solutions.

## The Associative Model: An Overview
In the Associative Model, all data points are associated. These associations exist even across tables, allowing us to model complex relationships between various data sources and tables. With these associations in place, the model can provide numerous benefits:
- searching: the model can search on any set of search terms and rapidly return related items from across the model
- querying: the model performs fast calculations across the data set, even working across tables to produce results without requiring any joins
- filtering: because all data is associated, the model can seamlessly apply filters on any piece of data in the model and update the rest of the model to reflect the filter
- speed: all of these operations are performed fast thanks to the associative model and its underlying technology

Contrast these attributes with your typical database. In order to query across tables, you need to write complicated joins to get your results in the format you need. If you want to filter across multiple sets of data, you need to update all of your queries that yield those data sets to keep them in sync with your filters. Highlighting relationships or searching across entire models is typically not even possible with these tools. In general, these solutions require you to build and manage functionality like dynamic calculation and filtering from the application side; in contrast, Qlik’s Associative Model handles these functions for you in the Engine, making it quick and easy for a user to explore data.

![image](https://user-images.githubusercontent.com/12411165/227788244-865618c5-7165-4179-9923-b2fa03d91777.png)

- [Comparison between the Qlik Engine and SQL/Query based tools](https://youtu.be/wlkML7Hys6o?t=4)
- [For a very technical deep dive into our Engine, watch this video](https://youtu.be/wevhFK_AID8?t=163)

## How to connect to your data sources?
There are 2 ways to connect to your data on a high level:
- Let Qlik help you via AI
- Use the data load editor, the editor contains a script with SQL/REST like statements combined with additional Qlik logic to transform and prepare your data

### Use AI
- [How to load your data enhanced by AI 2M](https://youtu.be/b2wFIjqV8U8)
- [Overview of data connectors](https://youtu.be/SUN4P9FQwhQ)

### Use the data load editor
Qlik Sense uses a [data load script]((https://youtu.be/EBRgBsXLA4Y?t=5) ), which is managed in the data load editor, to connect to and retrieve data from various data sources. A data source can be a data file, for example an Excel file or a .csv file. A data source can also be a database, for example a Google BigQuery or Salesforce database.

You can load data into Qlik Sense using the LOAD and SELECT statements. Each of these statements generates a compressed internal table. In the script, the fields and tables to load are specified. Scripting is often used to specify what data to load from your data sources. You can also manipulate the data structure by using script statements.

We devide this section into two parts:
- Load simple tables without manipulation
- Use logic to transform tables

#### Load simple tables without manipulation

![image](https://user-images.githubusercontent.com/12411165/227897060-edca4833-c08a-4fcc-9ba4-55a809750677.png)
https://help.qlik.com/en-US/cloud-services/Subsystems/Hub/Content/Sense_Hub/LoadData/select-load-file-data.htm?

After you loaded your table, all fields and the data from the source is available so you can start building your dashboard (charts).


#### Use logic to transform tables

- [The Power of Qlik Script - Reshaping Data - Part 1](https://youtu.be/xkBFyNys1LI)
- [The Power of Qlik Script - Reshaping Data - Part 2](https://youtu.be/YjATejfEOxc)
- [The Power of Qlik Script - Reshaping Data - Part 3](https://youtu.be/dhJv4A2eQz8)

![image](https://user-images.githubusercontent.com/12411165/227707170-8ea253cd-b10f-45ca-959a-115657d30721.png)

[View Qlik help to learn more about data modelling functions](https://help.qlik.com/en-US/sense/November2022/Subsystems/Hub/Content/Sense_Hub/DataModeling/best-practices-data-modeling.htm)




