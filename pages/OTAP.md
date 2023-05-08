In the examples below we outline how you can implement an application Lifecycle Management process: from Development to Production

# Using a shared space
Below an example using a shared space in the middle. 

![image](https://user-images.githubusercontent.com/12411165/231542983-40487c95-ff32-45a2-a800-1b8f0eeabe67.png)

1. Individual(s) creates spaces, designates admin(s)
2. Admin(s) invites others as viewers, editors, publishers
3. Editor(s) create apps and publish sheets for other team members to validate. (Supports multi-user authoring of application UI)
4. Publisher(s) publish/republish app from lower environment
5. Viewers in Test perform validation
6. Publisher(s) publish/republish app from lower environment
7. viewers consume read only apps
8. editors can create self-service content

# Multiple managed spaces
In this example we now used multiple managed spaces. 

![image](https://user-images.githubusercontent.com/12411165/231550219-d0af863a-f5cd-4bb6-bf64-63cdf970e0f9.png)

1. Individual(s) creates spaces, designates admin(s)
2. Admin(s) invites others as viewers, editors, publishers
3. Editor(s) create apps and publish sheets for other team members to validate. (Supports multi-user authoring of application UI)
4. Publisher(s) publish/republish app from lower environment
5. Viewers in Test perform validation
6. Publisher(s) publish/republish app from lower environment
7. viewers consume read only apps
8. editors can create self-service content

# Source version control

Automations allow you to set up CI/CD pipelines for your Qlik Sense apps, using the Github connector. [Here we showcase various components of a CI/CD pipeline](https://community.qlik.com/t5/Official-Support-Articles/CI-CD-pipelines-for-Qlik-Sense-apps-with-automations-and-Github/ta-p/1860837), that can be combined and extended based on your own needs.
