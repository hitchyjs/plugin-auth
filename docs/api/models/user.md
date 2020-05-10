# User
## Properties
### name
   + is required
   + usually a string
### password
   + SSHA512 encoded password, base64 encoded
   + should only be set using the method setPassword
### role
   + a string listing all roles separated by spaces
### strategy
   + strategy used to authenticate the user
   + set by the plugin
### provider 
   + provider used to authenticate the user
   + set by the plugin
## Methods
### hashPassword
**Signature:** `hashPassword( cleartext, salt )`

Derives salted hash from provided password.

* The **cleartext** is the password that needs to be hashed as cleartext. Has type String.
* The **hash** is an already hashed password that can be used to extract the hash salt used to hash it. Or a custom salt. Has type string if it is a password or type Buffer if it custom salt. 

### setPassword
**Signature:** `hashPassword( password )`

Derives and saves salted hash from provided cleartext password. **The password should only be set using this method**.

* The **password** is the password as cleartext. It will be hashed and saved as this.password. Has type String.
