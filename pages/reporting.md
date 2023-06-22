Reporting can be divided into two ways: 
- let the user subscribe to sheets or charts 
- let the system send a report or email via email/teams or some other system via Qlik Application Automation.

# Videos
  
- [Self-service reporting via a subscription capability](https://youtu.be/GY2045AZIyI)
- [Generate a report using Qlik Application Automation](https://youtu.be/RjbHlbkC7sI)
- [Sending a Personalized Email to Customers using Qlik App Automation](https://youtu.be/CC1evZTOZtI)
- [Create and distribute Excel reports in Office 365](https://www.youtube.com/watch?v=VuhiciZMNzE), [Article](https://community.qlik.com/t5/Official-Support-Articles/Using-Qlik-Application-Automation-to-create-and-distribute-Excel/ta-p/1847184)
  

Notice we used Qlik Application Automation (QAA) for any advanced use case, it basiscally lets you connect any cloud platform to each other. 

# How it works

Each integration is built as a workflow, called an automation. automations are built in the automation editor by using building blocks. Qlik Application Automation for OEM has 400+ connectors to a wide range of cloud applications, and for each connector, you have different blocks to read and write data.

automations can be executed manually, they can be triggered (using webhooks), they can be scheduled or they can be called through their API endpoint.

Next to the connector blocks, Qlik Application Automation for OEM has a wide range of blocks to build any type of integration, including loops, conditions, variables, filtering lists, doing lookups in lists and much more. You use field mapping to map data between blocks and you can apply formulas (transformations) to change data formats.
