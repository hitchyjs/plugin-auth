---
prev: false
next: ./guides/quickstart.md
---

# About Hitchy-Plugin-Auth

Hitchy-Plugin-Auth is a plugin for [Hitchy server-side framework](https://hitchyjs.github.io/core/). It provides request 
handlers and policies for implementing server-side authorization and authentication.

## Authentication

Hitchy-Plugin-Auth provides a basic authentication against a local database based on Hitchy's [ODM](https://hitchyjs.github.io/plugin-odem/) plugin.

::: tip
This plugin uses [Passport](http://www.passportjs.org/) to handle authentication. This is beneficial as Passport 
provides a wide array of [strategies](http://www.passportjs.org/packages/) that can handle authentication with external 
sources, as well. If no external authentication is needed Hitchy-Plugin-Auth has a built-in strategy for local authentication. 
:::

An optional server-side session can be used to track the authentication of a user. This is realized using Hitchy's [session](https://www.npmjs.com/package/hitchy-plugin-session) and [cookies](https://www.npmjs.com/package/hitchy-plugin-cookies) plugins. 

## Authorization

By default an admin [user](api/models/user.md) will be created on first start up. The admin user has access to all routes and all models. All new accounts will be treated as users and have restricted access to your app.

The [roles](api/models/user.md) and [authRules](api/models/auth-rule.md) Hitchy-Plugin-Auth knows are fully customizable to fit to your needs.

