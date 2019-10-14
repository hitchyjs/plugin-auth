---
prev: ../glossary.md
next: defining-models.md
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
Installing [hitchy-plugin-auth](https://www.npmjs.com/package/hitchy-auth) is implicitly fetching [hitchy-plugin-odem](https://www.npmjs.com/package/hitchy-plugin-odem) as a dependency. That's why you don't need to install it explicitly here while instantly benefitting from a REST API for accessing your data. 
:::

## Start Hitchy

At this point Hitchy is ready for managing blog posts via REST API. Thus, start it with:

```bash
hitchy start
```

:::warning Hitchy not found?
If hitchy isn't found this might be due to issues with your Node.js and npm setup. In most cases using **npx** solves this issue for now:

```bash
npx hitchy start
```
:::

Keep it running while trying out next.

:::tip
Whenever you want to stop Hitchy press Ctrl+C to gracefully shut it down.
:::


## Try It Out
