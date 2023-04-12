Authorizations are applied at 2 levels:
- Restrict access to functionality (by mapping an JWT group to a Qlik Sense role)
- Restrict data (rows and columns, even based on hierarchies by using a JWT group and linking/(inner joining) it to a field in you data)

A user logs in into your SaaS platform and using JWT, we will forward the user and his group memberships to Qlik Sense. Using the APIs you have mapped your groups to Qlik Sense roles and spaces. 

> For example, you have assigned your groups supplied via the JWT to a Qlik Sense Space. So if a user has the "finance" group he can see the "finance" space because you assigned the group finance to the finance space. 


## Restrict access to functionality

A security role grants a set of permissions to all users who have been assigned the role. When a user is assigned to more than one role, they are granted the permissions from each role. Permissions define what a user can see and do in Qlik Cloud.

Security roles control what users and administrators can do in the tenant or access in the Management Console. These roles do not control what you can do in spaces. Instead, your allowed actions on content in shared and managed spaces are determined by your space role in the specific space. For more information about space roles, see [Managing permissions in shared spaces](https://help.qlik.com/en-US/cloud-services/Subsystems/Hub/Content/Sense_Hub/Spaces/managing-shared-spaces.htm), [Managing permissions in managed spaces](https://help.qlik.com/en-US/cloud-services/Subsystems/Hub/Content/Sense_Hub/Spaces/managing-managed-spaces.htm) , and [Data space roles and permissions](https://help.qlik.com/en-US/cloud-services/Subsystems/Hub/Content/Sense_Hub/DataIntegration/DataSpaces/permissions-data-space.htm).

[visit Qlik help to learn more about Qlik Sense authorizations](https://help.qlik.com/en-US/cloud-services/Subsystems/Hub/Content/Sense_Hub/Admin/SaaS-user-permissions.htm)

### Managing permissions in managed spaces
Permissions in spaces are controlled by roles assigned to members when they are added to a space. A role gives that member a set of permissions in the space and on resources in the space.

> What actions that the permissions enable for members is determined by both your assigned space roles and your user entitlement. The permitted actions are more limited for users with Analyzer entitlement than for users with Professional entitlement.


### Key limitations of managed spaces (recommended for OEM use cases)
- You can only use master items when you duplicate a sheet in an app that is published in a managed space. Fields are not available in the assets panel.
- You cannot change the data model of a published app in a managed space.
- You cannot download apps from or upload apps to a managed space.

> Note that these limitations are considered to be good practices for OEM deployments, if you want more freedom please use a managed space. 

### Publishing sheets, bookmarks, and stories to Community in apps in managed spaces
Depending on your permissions for a managed space, you can add content to apps in the space. New content is always private. Private items are only visible to you. You can share your content by publishing it to Community. Shared content in apps in managed spaces are added to the Community section. In the app overview, you publish content to Community or make it private again.




## Restrict data using Qlik Section access

[Section Access](https://help.qlik.com/en-US/cloud-services/Subsystems/Hub/Content/Sense_Hub/Scripting/Security/manage-security-with-section-access.htm) is used to control the security of an application. It is basically a part of the data load script where you add a security table to define who gets to see what. Qlik Cloud uses this information to reduce data to the appropriate scope when the user opens the application, that is, some of the data in the app is hidden from the user based on their identity. Section Access is tightly integrated with the data in the app and relies upon it to control access. This form of dynamic data reduction can target table rows, columns, or a combination of both.

[View this video on YouTube](https://youtu.be/0VoJPiRrqKA)

![image](https://user-images.githubusercontent.com/12411165/230038838-cb7d5098-a505-4ff0-878d-6d322415816a.png)
