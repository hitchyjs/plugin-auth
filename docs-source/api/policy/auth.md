# Auth Policies 
## Policies 
### Auth.initialize
Is used to initialize the passport.js authentication. Should always be the first policy to be evaluated by hitchy. Auth-Plugin will register this policy as "/". 
### Auth.authenticate
Is used to authenticate a user. 

req.params.strategy can be used to specify the strategy used to authenticate.

### Auth.requireAuthentication
Blocks access if no user is authenticated. Can be used to protect an URL. 

**This will also block all URLs with higher specificity.** 
E.g. if "/User" is protected by this policy, then "/User/:uuid" will also be protected by this policy. 
If do not want this behaviour you can either move the policy to a more specific url or use plugin-auth-policies.

### Auth.requireAdmin
Blocks access if no authenticated user is not an admin. Can be used to protect an URL.

**This will also block all URLs with higher specificity.** 
E.g. if "/User" is protected by this policy, then "/User/:uuid" will also be protected by this policy. 
If do not want this behaviour you can either move the policy to a more specific url or use plugin-auth-policies.
