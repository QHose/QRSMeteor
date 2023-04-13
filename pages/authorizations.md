Authorizations are applied at 2 levels:
- Restrict access to functionality (by mapping an JWT group to a Qlik Sense role)
- Restrict data (rows and columns, even based on hierarchies by using a JWT group and linking/(inner joining) it to a field in you data)

A user logs in into your SaaS platform and using JWT, we will forward the user and his group memberships to Qlik Sense. Using the APIs you have mapped your groups to Qlik Sense roles and spaces. 

> For example, you have assigned your groups supplied via the JWT to a Qlik Sense Space. So if a user has the "finance" group he can see the "finance" space because you assigned the group finance to the finance space. 

