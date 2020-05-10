# AuthSpec
This model is used to save redundant specs. This can be created and then referenced by uuid for an AuthRule. Otherwise the AuthRule will automatically create AuthSpecs if an spec is provided and no corresponding existing AuthSpec is found. 
## Properties
### Spec
+ type String
 + type String
 + A string that list the Specification this Rule has. This is a list of "." separated terms that declare the specificity of the Rule.
 + e.g. "user.read"

