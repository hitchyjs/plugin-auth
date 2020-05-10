# AuthLibrary
A Library of AuthRules. The AuthRules are managed as a tree.  
## Methods
### addAuthRule
**Signature:** `addAuthRule( Authrule:{ authSpecUUID, role, userUUID, positive } )`

Adds a new AuthRule to the Library by searching its tree for the corresponding node ore creating a new one.

+ The **AuthRule** should be an instance of the AuthRule Model or an Object having the properties: authSpecUUID, role, userUUID, positive;
+ The **authSpecUUID** is a UUID that corresponds to an AuthSpec
+ The **role** is an Array of Strings
+ The **userUUID** is a UUID that corresponds to a User
+ The **positive** is a boolean that defines if the rule is positive or negative

### removeAuthRule
**Signature:** `removeAuthRule( Authrule:{ authSpecUUID, role, userUUID, positive } )`

Removes an AuthRule from the Library by traversing its tree and removing the values from the corresponding node.

+ The **AuthRule** should be an instance of the AuthRule Model or an Object having the properties: authSpecUUID, role, userUUID, positive;
+ The **authSpecUUID** is a UUID that corresponds to an AuthSpec
+ The **role** is an Array of Strings
+ The **userUUID** is a UUID that corresponds to a User
+ The **positive** is a boolean that defines if the rule is positive or negative

### listAuthRules
**Signature** `listAuthRules( listEmptyNodes )`

Lists all nodes from the tree used to manage the AuthRules.

+ **listEmptyNodes** is boolean that specifies wether the nodes with no rules should be added to the list.

Returns an Array of objects `{spec, values, children}`.

+ **spec** is a string
+ **values** is an object
+ **children** is an object

### authorize
**Signature** `authorize( User:{ uuid, roles }, authSpec )`

Checks whether a User is authorized to access the given authSpec. 
The tree is checked to find the AuthRules with the most similiar specification.
E.g. if there are authRules for "user" and non for "user.read" a request for authorize( User, "user.read" ) will user the "user" AuthRules.

Then it compares all known AuthRules for the authSpec to decide wether the User is authorized or not. For this decision config.prioritisePositiveRules is considered.

+ The **User** should be an instance of the User Model or an Object having the properties: uuid, roles;
+ The **uuid** is a UUID that corresponds to an User
+ The **role** is an Array of Strings

Returns a boolean.
