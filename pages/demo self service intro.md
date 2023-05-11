On the next slide you will find a live demo. We created 4 sample users, each with separate group memberships from "your SaaS Platform" which wants to embed Qlik Sense. 

# Typical users in your customer specific tenant  
- John, can only display 
- Linda, can copy and create private sheets 
- Martin and Paul would normally create content or manage the environment (but are limited here because we are in a public demo environment). 

# Detaled use case description

Let's imagine a partner deploying Qlik in their product. They want to deliver dashboards to the end-users. Some of them can also add new Qlik sheets in the dashboard.
This analytics self-service must be governed :
- Core product must not be impacted by user content.
- New dashboard release must not impact user content.
- A global supervisor can be able to manage user content.
- End-customers cannot add their own data in the tenant. They work on a Qlik application with a data model built by the partner.

# Identify your user profiles, roles and responsabilities

First step is to identify the different user profiles you need on your tenant(s).

![image](https://user-images.githubusercontent.com/24877503/236837192-fa8b3df8-ecb2-4967-a7b4-3a2b6a99e56c.png)
