# AuthRule
An AuthRule is a rule used to authorize the user. 
It specifies which Users and Roles have access to what is protected by this Rule. 

A Rule can be either positive or negative. Positive Rules are used to grant access, negative Rules are used to deny access.
The spec of a rule define it specificity. Tha auth-plugin will use the most specific rule it can find to determine if access is granted or denied to a specified spec.
## Properties
### authSpecUUID
   + type uuid
   + a UUID that corresponds to a authSpec
   + automatically generated if missing and spec is provided
   + looks up uuid corresponding to the spec or create new AuthSpec if no existing AuthSpec matching the spec is found
### spec
   + type String
   + A string that list the Specification this Rule has. This is a list of "." separated terms that declare the specificity of the Rule.
   + e.g. "user.read"
### role
   + a string listing all roles separated by spaces
### userUUID
   + type uuid
   + a UUID that corresponds to a User
### positive 
   + type boolean
   + true if rule grants access, false if rule denies access
