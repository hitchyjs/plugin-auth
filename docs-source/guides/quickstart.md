---
prev: ../introduction.md
next: false
---

# Quick Start

This short tutorial is listing steps required to start a new project relying on Hitchy-Plugin-Auth and [Hitchy](https://hitchyjs.github.io/core/) to establish a server-side application that's exposing a REST API for Authentication and Authorization.

## Setup Project

First create a folder for your application and enter it:

```bash
mkdir my-new-app
cd my-new-app
```

Initialize your application's package management so dependencies are tracked:

```bash
npm init
```

Answer all the questions according to your needs.

Now install [hitchy](https://www.npmjs.com/package/hitchy) and [hitchy-plugin-auth](https://www.npmjs.com/package/hitchy-plugin-auth) as dependencies:

```bash
npm install hitchy hitchy-plugin-auth
```

:::tip
Installing [hitchy-plugin-auth](https://www.npmjs.com/package/hitchy-plugin-auth) is implicitly fetching [hitchy-plugin-odem](https://www.npmjs.com/package/hitchy-plugin-odem) as a dependency. That's why you don't need to install it explicitly here while instantly benefitting from a REST API for accessing your data. 
:::

## Start Hitchy

At this point Hitchy is ready for managing blog posts via REST API. Thus, start it with:

```bash
hitchy start
```

:::warning Hitchy not found?
If Hitchy isn't found this might be due to issues with your Node.js and npm setup. In most cases using **npx** solves this issue for now:

```bash
npx hitchy start
```
:::

Keep it running while trying out next.

:::tip
Whenever you want to stop Hitchy press Ctrl+C to gracefully shut it down.
:::


## Try It Out

The plugin injects special endpoints for managing a user's authentication.

| endpoint           | method | description                                                                                      |
|--------------------|--------|--------------------------------------------------------------------------------------------------|
| `/api/auth/login`  | POST   | Takes username and password in request body and uses them to authenticate selected user.         |
| `/api/auth/login`  | GET    | Does the same as the POST method and is mainly here as a redirect URI for external authorization |
| `/api/auth/logout` | GET    | Drops information on previously authenticated user.                                              |
| `/api/auth/check`  | GET    | Fetches status information on currently authenticated user.                                      |


# Authorization
Plugin-auth provides [Policies](../api/policy) and [PolicyGenerators](../api/service/policy-generator.md) for a quick setup.

To configure those you can utilize the config utility.

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
    + is used by the [authorization](../api/service/auth-library.md) service and the [requireAuthentication](../api/policy/auth.md) policy.
    + these will be used if there are no AuthRules in the DataBase
+ *strategies* is an object which maps properties to passport.js strategies.
    + if more than one strategy is provided a defaultStrategy has to be named, otherwise the first one will be used
