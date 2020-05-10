---
prev: ./quickstart.md
next: ../api/
---


# Authorization
Plugin-auth provides [Policies](../api/policy) and [PolicyGenerators](../api/service/policy-generator.md) for a quick setup.

To configure those you can utilize hitchys config utility.

Create a file ``config/auth.js``:

```
"use strict"

module.exports = {
  auth: {
    rules: {
        
    },
    strategies: {
    
    },
    defaultStrategy: ""
  }
}
```

+ *rules* is an object or array
    + as an object it has to map "spec" to [AuthRules](../api/models/auth-rule.md) without spec property
    + as an array it has to be a list of [AuthRules](../api/models/auth-rule.md)
    + is used by the [authorize](../api/service/auth-library.md) service and the [requireAuthentication](../api/policy/auth.md) policy.
    + will be used if no AuthRules are in the database during startup
+ *strategies* is an object which maps properties to passport.js strategies.
    + if more than one strategy is provided a defaultStrategy has to be named, otherwise the first one will be used

There are multiple ways to utilize the authorization utilities of plugin-auth.
## Policies
If you want to protect an URL you can either use the predefined [policies](../api/policy) or a [policy generator](../api/service/policy-generator.md) to generate a policy.

### predefined Policies
Create a file ``config/policies.js``:
```
exports.policies = {
   "/api/user": "auth.requireAdmin",
}
```

### policyGenerator
Create a file ``config/policies.js``:
```
module.exports = function() {
    const { policyGenerator } = this.service
    rerturn {
        policies: {
            "/api/user": policyGenerator.hasRole("admin"),
        }
    }
}
```

## Service
If you need to authorize a User in a custom policy you can utilize the [AuthLibrary](../api/service/auth-library.md) 
service.
