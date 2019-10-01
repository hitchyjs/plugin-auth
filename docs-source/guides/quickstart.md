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
npm install hitchy hitchy-plugin-odem-rest
```

:::tip
Installing [hitchy-plugin-odem-rest](https://www.npmjs.com/package/hitchy-plugin-odem-rest) is implicitly fetching [hitchy-plugin-odem](https://www.npmjs.com/package/hitchy-plugin-odem) as a dependency. That's why you don't need to install it explicitly here while instantly benefitting from a REST API for accessing your data. 
:::

## Define Models

Create a folder for your models:

```bash
mkdir -p api/models
```

Put all the model definition files in there.

Let's create something ravish like a blog ;). This would require definition of a **post**, thus create a file named **api/models/post.js** with the following content:

```javascript
module.exports = {
    props: {
        title: { required: true, },
        teaser: {},
        content: { required: true, },
        createdAt: { type: "date", index: true },
    },
    hooks: {
        afterCreate() {
            if ( this.$isNew ) {
                this.createdAt = new Date();
            }
        }
    },
};
```


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

Open your browser and enter URL displayed in output of running Hitchy. Let's assume it reads [http://127.0.0.1:3000](http://127.0.0.1:3000), so open this URL in your browser.
 
It will render very simple error page regarding request for unknown page. That's okay because automatic REST API is the only thing that's instantly available and this is using the configurable prefix **/api/**. So, try to fetch its base URL [http://127.0.0.1:3000/api](http://127.0.0.1:3000/api).
 
It will render the same error page. That's still okay because the exposed REST API needs to know a model you like to work with at least. The model's name is appended to the URL. We've created a model named **post**, so that's what you need to append to URL. Try fetching URL [http://127.0.0.1:3000/api/post](http://127.0.0.1:3000/api/post).

This time you get a different response. There is HTML document, but some JSON-formatted data. It reads similar to this one:

```json
{"items":[]}
```

It says to have no existing items for the selected model. Let's create one now by opening URL [http://127.0.0.1:3000/api/post/create?title=My First Blog Post&content=read this](http://127.0.0.1:3000/api/post/create?title=My%20First%20Blog%20Post&content=read%20this). This results in a different JSON-formatted response:

```json
{"uuid":"0ece354f-06d5-415c-8910-27ee72f380f7"}
```

Basically, this response is a good one for it's providing the unique ID of the actually created post. 

Return to the previous URL [http://127.0.0.1:3000/api/post](http://127.0.0.1:3000/api/post) and see the list isn't empty any more:

```json
{"items":[{"title":"My First Blog Post","content":"read this","createdAt":"2019-08-16T09:01:52.000Z","uuid":"0ece354f-06d5-415c-8910-27ee72f380f7"}]}
```

This time the list of **items** contains one object consisting of the properties **title** and **content** as provided on creating post. In addition there is a timestamp in property **createdAt** which is due to the [hook afterCreate()](../api/model.md#instance-aftercreate) included with the model's definition file above. Eventually there is the same UUID as returned on creating the post.

Append this UUID to the listing's URL to get that post's record, only. Open URL 
[http://127.0.0.1:3000/api/post/0ece354f-06d5-415c-8910-27ee72f380f7](http://127.0.0.1:3000/api/post/0ece354f-06d5-415c-8910-27ee72f380f7).

:::warning IDs are unique
Be aware that the UUID in this example is different from the one you've got before, most probably. Thus you have to replace it with your UUID.
:::

:::warning This is REST API?
Well, it's _sort of_ REST API.
 
[hitchy-plugin-odem-rest](https://www.npmjs.com/package/hitchy-plugin-odem-rest) comes with a set of GET-only requests to support instant and easy management of items by using browser, only. Apart from that there is a more sophisticated REST API supported as well.

So, instead of using URL given above long term you should stick with doing POST-requests for [http://127.0.0.1:3000/api/post](http://127.0.0.1:3000/api/post) with properties provided in request body for creating new items. 
:::
