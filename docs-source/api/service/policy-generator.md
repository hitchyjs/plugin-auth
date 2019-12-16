# PolicyGenerator
A generator for policies that can be used to protect URLs.
## Generator
### hasRole
Generates a policy that only allows access if the authenticated user has one of the listed Roles or is an Admin.

**Signature:** `hasRole( roles )`
+ **roles** is either a string, an array of strings, or an Object where the properties are the allowed roles.

### hasAuthorization
Generates a policy that only allows access if the [AuthRule](../models/auth-rule.md)s with a matching spec allow access 
to the authenticated user.

**Signature:** `hasRole( authSpecs )`
+ **authSpecs** is either a string or an array of strings that are specs that should be matched.
