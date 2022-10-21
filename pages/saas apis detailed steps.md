# Introduction

In the steps below we will outline how you can setup a multitenant Qlik Cloud analytics environment using the APIs. We also included a postman collection so you can directly start using the APIs.

# Step 1 - Create a  Target Tenant

- Generate client_id and client_secret Oauth credentials (OAuth clients and their associated credentials do not expire. Once created, you can regenerate the secret for the OAuth client, or delete the client altogether.)
- Request an access token for Source Tenant
- Retrieve the subscription license
- Request an access token for registering the new tenant
- Create the new tenant
- Request an access token for the newly created Target Tenant
- Send an API request to the Target Tenant as a test
- Retrieve the Email of the first created user on Source Tenant to use it as TenantAdmin in Target Tenant (optional)  see step 2.

![image](https://user-images.githubusercontent.com/12411165/197149856-a7030d8d-0526-453f-853f-db6cbccb2f75.png)

# Step 2 - Create a new Tenant Admin (optional)

When you create tenants programmatically, the tenant is provisioned free from any user accounts. It can therefore be helpful to add an interactive login to the tenant to validate the configuration, or to provide administrator access in case of any support questions from end users (depending on your use case).

-Request an access token for Source Tenant (if you don’t have a valid one)
- Get Tenant Admin’s subject from the Source Tenant
- Request an access token for the Target Tenant (if you don’t have a valid one)
- Retrieve the ID of the TenantAdmin role on the Target Tenant
- Create the new Tenant Admin user with the same subject ID of the Source Tenant (same user) and the Tenant Admin role ID of the Target tenant

![image](https://user-images.githubusercontent.com/12411165/197150490-4c9f14ef-25f8-44ef-9029-28c7459d39c3.png)


# Step 3 - Configure a Tenant

- Request an access token for Target Tenant (if you don’t have a valid one)
- Enable AutoCreation of Groups
- Set user license Automatic Assignment Rules (e.g. professional users not automatically assigned; analyzer users automatically assigned)
- Get the Target Tenant ID
- Create a new Web Integration ID
- Create a JSON Web Token Identity Provider
- Add the group you want to have in the tenant to secure the spaces
- Retrieve the ID of the created group
- Create a New Managed Space
- Add the group to the space

![image](https://user-images.githubusercontent.com/12411165/197151137-f3f6f6c9-050a-45cb-9fa4-375b4d94b78c.png)

# Step 4 - Deploy a Qlik Sense App to the Tenant

The pre-requisite to perform these steps is that you’ve already created/imported a Template App on the Source Tenant. If you don’t have one, you can download the Template_App.qvf from the Postman Collection link and import it into your Source Tenant.

- Request an access token for Source Tenant (if you don’t have a valid one)
- Retrieve the Source Tenant’s template apps via Items APIs
- Export the Template App you want to deploy
- Request an access token for Target Tenant (if you don’t have a valid one)
- Create a Shared Space on the Target Tenant (optional, can be imported in the Private Space as well)
- Import the app into the newly created Shared Space
- Publish the app to a Managed Space for end-users consumption

![image](https://user-images.githubusercontent.com/12411165/197152994-4aec46a9-de8d-484b-b5f9-4bd187b025f5.png)


