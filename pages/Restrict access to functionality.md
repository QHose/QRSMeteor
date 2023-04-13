
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

