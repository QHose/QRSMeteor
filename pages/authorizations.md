Authorizations are applied at 2 levels:
- Restrict access to functionality (by mapping an JWT group to a space and next to a Qlik Sense role to limit your actions)
- Restrict data (rows and columns, even based on hierarchies by using a JWT group and linking/(inner joining) it to a field in you data)

A user logs in into your SaaS platform and using JWT, we will forward the user and his group memberships to Qlik Sense. Using the APIs you have mapped your groups to Qlik Sense roles and spaces. 

For example, you have assigned a group supplied via the JWT to a Qlik Sense Space. 
- Next you selected a role (can view, can edit ...) to define what actions your group can execute inside Qlik Sense.  
- So if a user has the "finance" group and that group has been linked to the "can view" role,  he can see the "finance" space because you assigned the group finance to the finance space. 

![image](https://user-images.githubusercontent.com/12411165/231678546-d8ab49cc-c5f9-420d-be5e-1651b57ba29c.png)

