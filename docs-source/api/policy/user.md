# User Policies
## Policies
### user.self
Will block requests were request.params.uuid does not match the authenticated users uuid. Grants access to Users with the role "admin". 
### user.changePassword
#### Methods
+ POST
+ PATCH
#### BODY
The request Body should look as follows:

* old:
   * required
   * the old password
   * has to match the current password
* old2
   * repetition of the old password
   * if provided the policy will check if the 2 passwords match
* newPw:
   * the new password
