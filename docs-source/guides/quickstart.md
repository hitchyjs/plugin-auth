---
prev: ../introduction.md
next: ./authorization.md
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
Installing [hitchy-plugin-auth](https://www.npmjs.com/package/hitchy-plugin-auth) is 
implicitly fetching [hitchy-plugin-odem](https://www.npmjs.com/package/hitchy-plugin-odem), [hitchy-plugin-session](https://www.npmjs.com/package/hitchy-plugin-session) and [hitchy-plugin-cookies](https://www.npmjs.com/package/hitchy-plugin-cookies) as a dependency. That's why you don't need to install it explicitly here. 
:::

## Start Hitchy

At this point Hitchy is ready. Thus, start it with:

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
