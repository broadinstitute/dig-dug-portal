# Welcome to DIG Portal - Frontend

This is the shared code base of the front-end-only resources for the new knowledge portals. It is served using the [DIG-DUG server](https://github.com/broadinstitute/dig-dug-server) project.

---

> **Note:** This code base make no assumption on how you choose to work with
> different portals. You can choose to work on them as separate
> branches, forked repos, etc ...

## Getting Started

### Installing npm

This project uses Javascript and uses `npm` for managing module dependencies and running the system which needs to be installed. Instructions for installing `npm` are [here](https://www.npmjs.com/get-npm}).

### Installing Javascript Dependencies

To install the project's Javascript module dependencies, type:

```
$ cd /path/to/your/project/dig-dug-portal
$ npm install
```

Installations on Microsoft Windows may wish to use the **--no-optional** flag to avoid installation warnings due to the installation of packages targeting MacOSX (i.e. fsevents).

#### Special Note to Mac OSX Developers

Before installing the above npm dependencies on MacOSX, you may need to ensure that `node-gyp` is properly configured. See [here](https://www.npmjs.com/package/node-gyp) for details. Note: if your Mac OSX is the Catalina release, see [the special note on properly configuring Catalina][https://github.com/nodejs/node-gyp/blob/HEAD/macOS_Catalina.md).

### Running the Portal

The portal is not "run" on its own but as noted above, it is run as an integral part of the
[back-end server](https://github.com/broadinstitute/dig-dug-server) which  needs to be installed and started first (refer to the *dig-dug-server* project README for details).

The portal code may, however, be watched by npm to enable updating of the front end code "on-the-fly" by typing the following command in a separate operating system terminal session, from within the *dig-dug-portal* project folder:

```
npm run watch
```

In this manner, as the *dig-dug-portal* code is modified locally, the changes are immediately incorporated into the web pages seen by the browser (upon browser page refresh).

### Which BioIndex to Connect To

When building the portal, you need to decide if you'd like to serve data from the development BioIndex or the production one. By default, the production BioIndex is used.

To choose the development BioIndex, set the `BIOINDEX_DEV` environment variable to any "truthy" NodeJS value before building. For example:

```
$ BIOINDEX_DEV=1 npm run watch
```

On Windows (PowerShell), it can be done like this:

```
C:\> $env:BIOINDEX_DEV=1
C:\> npm run watch
```

### Connecting a page or module to a secondary BioIndex host

By default every BioIndex request goes to the single compile-time host
(`BIO_INDEX_HOST`, set from `SERVER_IP_ADDRESS` / `BIOINDEX_DEV` at build time).
If a particular portal, page, or section needs to read from a **different**
BioIndex server, you no longer need to fork `bioIndexUtils.js` / `bioIndex.js`.
Both the transport helpers and the Vuex bioindex factory accept an optional
`host` that overrides the default for those calls only. The override is threaded
all the way through (`query`/`match` → `request` → `rawUrl` → `apiUrl`, including
continuation fetches), and everything that omits it keeps using the default host.

Per Vuex module (the common case) — pass `host` as the 3rd factory argument:

```js
import bioIndex from "@/modules/bioIndex";

export default new Vuex.Store({
    modules: {
        // default host (no change)
        genes:       bioIndex("gene"),
        // this module reads from a secondary host
        specialData: bioIndex("special-index", undefined, { host: "https://secondary.example.org" }),
    },
});
```

Per call — pass `host` in the options object:

```js
import { query } from "@/utils/bioIndexUtils";

let rows = await query("special-index", q, { host: "https://secondary.example.org", limit: 100 });
```

If the secondary host is the existing private/internal server, import the
`BIO_INDEX_HOST_PRIVATE` constant and pass it as the `host`:

```js
import { BIO_INDEX_HOST_PRIVATE } from "@/utils/bioIndexUtils";

privateData: bioIndex("bar", undefined, { host: BIO_INDEX_HOST_PRIVATE }),
```

> **Backward compatibility:** `host` is optional everywhere. Existing calls that
> omit it behave exactly as before, and the `BIO_INDEX_HOST` / `BIO_INDEX_HOST_PRIVATE`
> exports and the `query_private` flag on `apiUrl` are unchanged. Branches that pull
> these changes from `master` need no edits unless they want to use a secondary host.

## Front-end framework

### Vue.js / Vuex

[Vue.js](https://vuejs.org/) is an open-source JavaScript framework for building user interfaces and single-page
applications. It is the core of our front-end. Because it is based on javascript, it can be incorporated with any
javascript library like jQuery, lodash, etc ... or even plain javascript.

[Vuex](https://vuex.vuejs.org/) is a state management pattern + library for Vue.js applications. It serves as a
centralized store for all the components in an application, with rules ensuring that the state can only be mutated
in a predictable fashion.

## File structure

Currently files are placed inside the `www` folder for consistency with the backend setup. However, it can be named
anything. You just need to make sure that the corresponding folder/mount point is the same in the config file.

- `css` This folder contains all the stylesheets for the site.
- `js` This folder contains all the javascripts for the site.
- `js/components` This folder contains the components. More info below.
- `js/modules` This folder contains the modules. More info below.
- `js/utils` This folder contains helper functions.

### Components

Components are reusable Vue instances. They can accept the same options as a Vue object, such as `data`, `computed`,
`methods`, etc ... and lifecycle hooks.

### Modules

Due to using a single state tree, all state of our application is contained inside one big object. However, as our
application grows in scale, the store can get really bloated.

To help with that, Vuex allows us to divide our store into **modules**. Each module can contain its own state,
mutations, actions, getters, and even nested modules.
Each module is namespaced for example:  The benefit of being namespaced is - So in order to enable this you have the
option to define the module as namespaced, and then you can use the same method in different modules:

```
moduleA {
  actions:{
    save(){}
  },
  namespaced: true
}
```

```
moduleB {
  actions:{
    save(){}
  },
  namespaced: true
}
```
and then you call it like this:

`this.$store.dispatch('moduleA/save')`
this.$store.dispatch('moduleB/save')

In our project we currently have two modules:

1. datasetModule -  you can call this module anywhere using context.dispatch('datasetModule/getDatasets', selectedPhenotype);

2. phenotypeModule - this.$store.dispatch("phenotypeModule/getPhenotypes");



## Usage

### Getting Started

The easiest way to get started is by including Vue.js library into a project.

For development:

```
<!-- development version, includes helpful console warnings -->
<script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
```

or:

For production:

```
<!-- production version, optimized for size and speed -->
<script src="https://cdn.jsdelivr.net/npm/vue"></script>
```

### Declarative Rendering

At the core of Vue.js is a system that enables us to declaratively render data to the DOM using straightforward
template syntax:

Add an element with an **id** to the **html** part of the page.

```
<div id="app">
  {{ message }}
</div>
```

Attach a vue object to the element with chosen ID in the **<script>** section.

```
var app = new Vue({
    el: '#app',
    data: {
        message: 'Hello Word!'
    }
})
```

And we have our first Vue app! The data and the DOM are now linked, and everything is now **reactive**.

### Using Components

```
<div id="app">

    <phenotype></phenotype>

</div>
```
