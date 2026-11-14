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

## Local PB portal: automatic private GT setup

Keep using the existing launch command (Python 3 and OpenSSH are required):

```bash
PHENOTYPE_ANALYZER_HOST_PRIVATE=http://127.0.0.1:8092 \
NODE_OPTIONS=--openssl-legacy-provider \
npm run serve:pb-phenotype
```

Both `serve:pb-phenotype` and `serve:pb-gene` prepare the GT cache before starting
Vue. On first use, the launcher downloads the pinned processed release over SSH
from the company server (default SSH alias: `e3`), verifies its SHA-256, and builds
the private lookup. Later launches verify and reuse the local index without a
server connection. An interrupted or unauthorized download installs no GT data;
the launcher explains the failure and continues with GT unavailable. Existing
BioIndex, phenotype and cohort-input prerequisites still apply independently.

The cache is in `.pb-private-data/genotypes/2025_crdc_16366_dp20_af001_20260907/`
under this checkout. It contains the original processed source and `index/`;
the entire `.pb-private-data/` directory is ignored by Git and is outside the
public assets. Setup uses the developer's own SSH identity and existing trusted
host configuration. No password, private key or dataset is included in Git.
Someone without company SSH/file permissions cannot download this source.
An authorized machine can keep using its already downloaded cache offline.

For a different company SSH alias, set `PB_GT_SSH_HOST=user@company-host` in the
launch command or shell environment. The default original source is
`/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/ref/dig-dug-portal/bioindex_handoff_20260907/sample_variant_gene.jsonl.gz`.
`PB_GT_REMOTE_SOURCE` can point to a copy of that same release; a different
release is rejected by checksum. SSH must already work non-interactively and
the host must already be in `known_hosts`.

Optional settings: `PB_GENOTYPE_INDEX` selects a custom private index directory;
`PB_GT_AUTO_DOWNLOAD=0` uses only cached files; `PB_GT_PYTHON` selects Python.
These are shell settings for the launcher. No machine-specific GT setting is
needed in `.env.development.local`. To prepare or retry GT alone, run
`npm run setup:pb-genotypes` (a failed setup exits nonzero).

The first setup downloads approximately 138 MB and retains approximately 201 MB
for source plus index. GT remains limited to the processed release's exact
variant/sample coverage; missing calls remain unavailable.

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
