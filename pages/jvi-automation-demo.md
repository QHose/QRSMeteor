# Test Qlik SaaS Automation with your own tenant

On the following page you can test multitenancy with your own cloud tenant. The basic flow is like this

![image](https://user-images.githubusercontent.com/12411165/201087448-5b961bd9-958e-4b82-bdfc-ea340a9d54b6.png)


On a high level there are 2 steps
* First you execute the automatic provisioning (not needed if you just want to test the login)
* Next you can test the login using JWT 

# Prerequisites
There are following prerequisites before you can initiate the test:

1. You need a license file from Qlik with more than one tenant in it.
2. You need to create the first tenant (source tenant) by following the link in the welcome email from Qlik. You need the URL to that tenant in the next step.
3. Naviagte to <https://account.myqlik.qlik.com/account>.
4. Follow this guide https://qlik.dev/tutorials/create-a-tenant#1-generate-credentials to get you client ID and client secret.
5. Create an app and upload it to the source tenant. Copy the app ID (can be found in the URL when opening the app) for later use.
6. If you want to use your own private and public certificate for JWT authentication, please have them in ready. If you want to use some test certificates, you can create them directly in the form on the next page.

## You are now ready to test the provisioning
7. Move to the next page and enter the information in the form. The first four fields are values from the steps above. The following fields are described below:
   
    7.1. Name assigned to the copied app is the name the app will have in the target tenants after import.
    
    7.2. Space name is the name of the managed space in the target tenant where the final app should be published too.
    
    7.3. Group name is the name required in the login to see the space, it can be anything as soon as you test with the same group name when doing the login test.
    
    7.4. Select if you want to provide Analyzer or Professional licenses to the user on the first login.
    
    7.5. Integration name, the name which will be used to identify if the web integration record which will be create in the QMC, it can be any text.
    
    7.6. Valid origins are the web site the final login will be done from. If you want to test the login from here, just keep the default. If you want to test login from your own website, then your own portal url needs to be added.

    7.7. Number of target tenant you want to create. Start with a low number at least until you confirm the flow works in your setup.
    
    7.8. Paste in you public and private key or use the Generate keys button to create test certificates.

8.  Press Provision customer(s) to start the process.

When the provisioning is done, you can see the details about the target tenants in a json array.

## You are now ready to test the login
Go to the login page. The values all prefilled or random values where applicable and if you have created more than one target tenant the first tenant is used in the instance url field, you can changed it to any other tenant url if needed.

By default you will enter the tenant as an end-user. If you want to log into the tentant as a partner user with tenant admin access, then check the box "Make tenant Admin" and make sure your client ID and Client secret is in the form.
