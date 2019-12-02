---
prev: false
next: glossary.md
---

# About Hitchy-Plugin-Auth

[Hitchy](https://hitchyjs.github.io/core/) is a server-side framework purely written in Javascript. It consists of a core which comes with limited abilities as it is basically capable of essentially handling requests via HTTP and discovering plugins to provide some actual request handlers.

Hitchy-Plugin-Auth is an authorization manager integrating with Hitchy as a discoverable plugin. It provides request handler and policies that handle authorization and authentication.   

## Authentication

Hitchy-Plugin-Auth provides a basic authorization against a local database based on Hitchy's [ODM](https://hitchyjs.github.io/plugin-odem/) plugin.

::: tip
This plugin uses [passportjs](http://www.passportjs.org/) to handle authentication. This is beneficial as passportjs 
provides a wide array of [strategies](http://www.passportjs.org/packages/) that can handle authentication with external 
sources. If no external authentication is needed Hitchy-Plugin-Auth has a build in Strategy for local authentication. 
:::

An optional server-side session can be used to track the authentication of a user. This is realized using Hitchy's [session]() and [cockie]() plugin. 

## Authorization

By default an Admin user will be created on first start up. The Admin has access to all routes and all Models. All new 
accounts will be treated as Users and have restricted access to your App.

The roles and  authRules Hitchy-Plugin-Auth knows are fully customizable to fit to your needs.

