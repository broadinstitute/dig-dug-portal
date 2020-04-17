# Welcome to DIG Portal - Frontend

This is the shared code base of the front-end-only resources for the new knowledge portals. 

> **Note:** This code base make no assumption on how you choose to work with
> different portals. You can choose to work on them as separate
> branches, forked repos, etc ...

## Prerequisites

### Server

The portal requires the [back-end server](https://github.com/broadinstitute/dig-dug-server) to be installed and started first.

### Local project module dependencies

The portal code is Javascript, the dependencies for which are managed using the node package manager `npm`,  which needs to be installed before building the project. Information about how to install the node package manager can be found [here](https://www.npmjs.com/get-npm}).

Once `npm` is installed, the portal code dependencies may be installed by typing the following:

```shell script
cd /path/to/your/project/dig-dug-portal
npm install
```

Installations on Microsoft Windows may wish to use the **--no-optional** flag to avoid installation warnings due to the installation of packages targeting MacOSX (i.e. fsevents). In addition, you may initially get some errors of the form:

```  
npm WARN <some-package> requires a peer of <some-other-package> but none is installed. You must install peer dependencies yourself.
```

This issue is generally resolved by installing the *<some-other-package>* independently as follows:

``` 
npm install <some-other-package>
```

### Running the portal

Assuming that the server is running (in another terminal) then run the portal code as follows:

```shell script
npm run watch
```

In this manner, as the *dig-dug-portal* code is modified locally, the changes are immediately incorporated into the web pages seen by the browser (upon browser page refresh). This command also (re-)compiles the portal distribution into a /dist for access by the running server.

## Front-end framework

### Vue.js / Vuex

[Vue.js](https://vuejs.org/) is an open-source JavaScript framework for building user interfaces and single-page applications. It is the core of our front-end. Because it is based on javascript, it can be incorporated with any javscript library like jQuery, lodash, etc ... or even plain javascript.

[Vuex](https://vuex.vuejs.org/) is a state management pattern + library for Vue.js applications. It serves as a centralized store for all the components in an application, with rules ensuring that the state can only be mutated in a predictable fashion.

## File structure

Currently files are placed inside the `www` folder for consistency with the backend setup. However, it can be named anything. You just need to make sure that the corresponding folder/mount point is the same in the config file.

- `css` This folder contains all the stylesheets for the site.
- `js` This folder contains all the javascripts for the site.
- `js/components` This folder contains the components. More info below.
- `js/modules` This folder contains the modules. More info below.
- `js/utils` This folder contains helper functions.

### Components

Components are reusable Vue instances. They can accept the same options as a Vue object, such as `data`, `computed`, `methods`, etc ... and lifecycle hooks.

### Modules

Due to using a single state tree, all state of our application is contained inside one big object. However, as our application grows in scale, the store can get really bloated.

To help with that, Vuex allows us to divide our store into **modules**. Each module can contain its own state, mutations, actions, getters, and even nested modules.
Each module is namespaced for example:  The benefit of being namespaced is - So in order to enable this you have the option to define the module as namespaced, and then you can use the same method in different modules:

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

At the core of Vue.js is a system that enables us to declaratively render data to the DOM using straightforward template syntax:

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
