# Step 1 - Create a  Target Tenant

- Generate client_id and client_secret Oauth credentials *
- Request an access token for Source Tenant
- Retrieve the subscription license
- Request an access token for registering the new tenant
- Create the new tenant
- Request an access token for the newly created Target Tenant
- Send an API request to the Target Tenant as a test
- Retrieve the Email of the first created user on Source Tenant to use it as TenantAdmin in Target Tenant (optional)  see step 2.

![image](https://user-images.githubusercontent.com/12411165/197149856-a7030d8d-0526-453f-853f-db6cbccb2f75.png)

[Download a postman collection with all the API calls](https://qliktechnologies365-my.sharepoint.com/:f:/g/personal/fqy_qlik_com/EjKLwxzxIG1Mho6W5Hdsi2QBZlA2U9T3i-k2Li-R8qMVvg?e=Za4cnX)

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




