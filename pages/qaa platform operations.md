Perform many Qlik Cloud platform backend tasks directly with Qlik Application Automation. Create spaces, add members and so much more!

This video shows you how to use Qlik Application Automation to perform common [Platform Operations on your Qlik Cloud tenant](https://youtu.be/76g-Wgtt14A?t=60). This can come in especially handy if you need to manage multiple Qlik Cloud tenants. Or use it for [version control with GIT](https://www.youtube.com/watch?v=brLxm8Liz5Y).

# Resources

- [Support Article]( https://community.qlik.com/t5/Official-Support-Articles/Qlik-Application-Automation-How-to-get-start)

- [Qlik Help](https://help.qlik.com/en-US/cloud-services/Subsystems/Hub/Content/Sense_Hub/Admin/mc-create-oauth-cl)

- [About OAuth](https://qlik.dev/authenticate/oauth)

![image](https://user-images.githubusercontent.com/12411165/236823380-76ce7e44-38a9-4ea4-9ca9-d70929ac640a.png)

# Deep dive

Qlik’s Platform Operations Connector, a native connector for Qlik Application Automation, provides a no-code way to deploy content across Qlik Cloud tenants. An OEM/ISV partner can now use a tenant or subscription level credential to build these automations with a few blocks in Qlik Application Automation to:
- Control Continuous Integration/Continuous Deployment (CI/CD) between their dev/test/acceptance/production environments, reducing time, cost and risk when releasing new applications or updating existing application deployments
- Drive deployments between Qlik Cloud regions to support multi-region deployments, solving for use cases where application performance and optimal latency is paramount, and ensuring all consumers have access to the same base content irrespective of which tenant they access
- Enable external and extranet use cases where separation between corporate and end customer tenants is a requirement, leveraging CI/CD or straight deployment, as well as tenant provisioning and configuration

## CI/CD 
Let's do a [quick look into a CI/CD flow](https://www.youtube.com/watch?v=brLxm8Liz5Y) and an automation within your DTAP environment, beginning with the new Platform Operations Connector block in Qlik Application Automation to initiate the automation:

![image](https://github.com/QHose/QRSMeteor/assets/12411165/c10b97cf-6f51-4236-8cf2-642e7cb9042b)



Followed by the Pull Request and subsequent deployment from Dev to Test below:

![image](https://github.com/QHose/QRSMeteor/assets/12411165/8472f08c-3dc4-4d7a-a701-b80df53a98b2)


And then finally deployed into Production through the automation.
![image](https://github.com/QHose/QRSMeteor/assets/12411165/0a4d064a-cf28-4c49-9781-229ce449a519)


Qlik’s OEM/ISV partners will also benefit from a simpler and faster time to market with their multitenant deployments employing this new connector.

Let’s review an example step by step for a new OEM/ISV partner for using the Platform Operations Connector to automate their initial multitenant deployment tasks below:

- Create a credential – more information on the credentials available for Platform Operations can be found in the Platform Operations tutorial series on qlik.dev
- On your source tenant, create a new automation
- Search for and select “Qlik Platform Operations” on the left pane
- Drag your first block onto the workspace, add the target tenant into the “Tenant” field, and configure the connection
- Run the automation!



