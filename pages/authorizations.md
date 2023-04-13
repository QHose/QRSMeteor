Authorizations are applied at 2 levels:
- Restrict access to functionality (by mapping an JWT group to a Qlik Sense role)
- Restrict data (rows and columns, even based on hierarchies by using a JWT group and linking/(inner joining) it to a field in you data)

A user logs in into your SaaS platform and using JWT, we will forward the user and his group memberships to Qlik Sense. Using the APIs you have mapped your groups to Qlik Sense roles and spaces. 

> For example, you have assigned your groups supplied via the JWT to a Qlik Sense Space. So if a user has the "finance" group he can see the "finance" space because you assigned the group finance to the finance space. 


## Restrict access to functionality

A security role grants a set of permissions to all users who have been assigned the role. When a user is assigned to more than one role, they are granted the permissions from each role. Permissions define what a user can see and do in Qlik Cloud.

Security roles control what users and administrators can do in the tenant or access in the Management Console. These roles do not control what you can do in spaces. Instead, your allowed actions on content in shared and managed spaces are determined by your space role in the specific space. For more information about space roles, see [Managing permissions in shared spaces](https://help.qlik.com/en-US/cloud-services/Subsystems/Hub/Content/Sense_Hub/Spaces/managing-shared-spaces.htm), [Managing permissions in managed spaces](https://help.qlik.com/en-US/cloud-services/Subsystems/Hub/Content/Sense_Hub/Spaces/managing-managed-spaces.htm) , and [Data space roles and permissions](https://help.qlik.com/en-US/cloud-services/Subsystems/Hub/Content/Sense_Hub/DataIntegration/DataSpaces/permissions-data-space.htm).

[visit Qlik help to learn more about Qlik Sense authorizations](https://help.qlik.com/en-US/cloud-services/Subsystems/Hub/Content/Sense_Hub/Admin/SaaS-user-permissions.htm)

### Managing permissions via spaces
Permissions in spaces are controlled by roles assigned to members when they are added to a space. A role gives that member a set of permissions in the space and on resources in the space.

> What actions that the permissions enable for members is determined by both your assigned space roles and your user entitlement. The permitted actions are more limited for users with Analyzer entitlement than for users with Professional entitlement.

## Private space
- An individual creates an application within personal space for sandbox or personal use. 
- Apps valuable to other users are moved to a Shared Space for collaboration / further development or a Managed Space as governed content
![image](https://user-images.githubusercontent.com/12411165/231541136-4b897434-e2b0-4652-a64a-cae43201d4b8.png)

## Shared space
A shared space is a section of the cloud Qlik Cloud Analytics hub used to develop apps collaboratively.

You can create new apps directly in a shared space. You can also move apps from your personal space to a shared space so other members can work on them. For more information on collaborating with users in a space, see [Using apps in shared spaces](https://help.qlik.com/en-US/cloud-services/Subsystems/Hub/Content/Sense_Hub/Spaces/managing-apps-in-spaces.htm).

## Application lifecycle - Team collaboration
![image](https://user-images.githubusercontent.com/12411165/231542379-0c90400c-1a87-4a30-b20c-d7c3f8fba6e1.png)
1. A SharedSpaceCreator creates a Shared Space, designates admin(s)
2. Admin(s) invite others as viewers, editors
3. Editors create apps and make public sheets for viewers to consume. (Supports multi-user authoring of application UI)
4. Viewers consume apps / sheets others have created


## Managed spaces
These are recommend for OEM use cases, and are "more controlled environments".

### Key limitations of managed spaces 
- You can only use master items when you duplicate a sheet in an app that is published in a managed space. Fields are not available in the assets panel.
- You cannot change the data model of a published app in a managed space.
- You cannot download apps from or upload apps to a managed space.

> Note that these limitations are considered to be good practices for OEM deployments, if you want more freedom please use a managed space. 

### Publishing sheets, bookmarks, and stories to Community in apps in managed spaces
Depending on your permissions for a managed space, you can add content to apps in the space. New content is always private. Private items are only visible to you. You can share your content by publishing it to Community. Shared content in apps in managed spaces are added to the Community section. In the app overview, you publish content to Community or make it private again.




## Restrict data using Qlik Section access

[Section Access](https://help.qlik.com/en-US/cloud-services/Subsystems/Hub/Content/Sense_Hub/Scripting/Security/manage-security-with-section-access.htm) is used to control the security of an application. It is basically a part of the data load script where you add a security table to define who gets to see what. Qlik Cloud uses this information to reduce data to the appropriate scope when the user opens the application, that is, some of the data in the app is hidden from the user based on their identity. Section Access is tightly integrated with the data in the app and relies upon it to control access. This form of dynamic data reduction can target table rows, columns, or a combination of both.

[View this video on YouTube](https://youtu.be/0VoJPiRrqKA)

The general idea can be seen in this image borrowed from the Qlik Sense on Windows environment (the userId is different there)

![image](https://user-images.githubusercontent.com/12411165/230038838-cb7d5098-a505-4ff0-878d-6d322415816a.png)

## Section Access in SaaS
SaaS also supports SA for dynamic data reduction. The mechanism works identical i.e. Qlik engine reducing the app's dataset on the fly when user logins, however, there are some differences compared to client-managed when building the security table in the load script. This difference is mainly in the systems fields available and data values to be used.

In SaaS the SA security table must contain, as a minimum, two system fields:
- ACCESS
- USERID or __USER.EMAIL__

The other system fields are optional:
- USERID
- NTNAME
- GROUP
- OMIT  

### **Important Considerations:**

- SERIAL system field is not available in SaaS
- USERID is not a mandatory system field 
- Use either USERID or USER.EMAIL (not both) for user-level security​
- Use GROUP for group-level security when using a custom IdP or JWT
- USERID is always compared to the value in the **IdP subject**. The **IdP subject** field can be used for distinguishing one user from another if the names are identical and the email field is not visible.
    - When using Qlik Account, the **IdP subject** can be viewed in the **Management Console** under the **Users** section.
    - When using a custom IdP, the **IdP subject** can be mapped to match your internal Windows identity e.g. DOMAIN/USERNAME
    - When using JWT authentication, the IdP subject will be set in the `sub` claim of the user payload. Example of JWT payload is shown below. Note that it uses the **email address** in both the `sub` and `email` claim, however, the subject could be mapped to the user's **internal Windows identity**.  

            {  
            "jti": "k5bU_cFI4_-vFfpJ3DjDsIZK-ZhJGRbBfusUWZ0ifBI"
            "sub": "mike.johnson@acme.com",   
            "subType": "user",    
            "name": "Mike Johnson",   
            "email": "mike.johnson@acme.com",    
            "email_verified": true,    
            "groups": ["Presales"]  
            }

> USER.EMAIL contains the user email address which will be obtained from the configured identity provider. If SA table in SaaS needs to apply restrictions at the user level, using USER.EMAIL rather than USERID is a good options since it avoids having to deal with the value set in the `subject claim` which may vary depending on the configure identity provider.

To learn more details about how to work with SA in SaaS please visit our [Online Help](https://help.qlik.com/en-US/cloud-services/Subsystems/Hub/Content/Sense_Hub/Scripting/Security/manage-security-with-section-access.htm)

&nbsp;
***
