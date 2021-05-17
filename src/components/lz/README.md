# Overview

LocusZoom is a data-visualization system used in the portal for PheWAS plots, GWAS plots, and genomic annotations. Its support for displaying many different datatypes and datasets makes it an integral part of how we deliver value in the portal.

## Why it looks the way it does

LocusZoom is very much a wholesale solution: it not only displays information, but also manages how data is drawn from remote APIs, and how it updates upon user interaction. Because of this, LocusZoom is often used in a standalone manner - it acts as its own model and controller, on top of being a view.

But as the Portal is its own application (with its own model, controller, etc), it often conflicts with LocusZoom in how, and when, data should be displayed. To combine LocusZoom with Vue, so that it can be used like any other Vue component, requires wrapping LocusZoom in a way which empowers each portal page to create panels and synchronize with their state, while also respecting the ways that LocusZoom handles its data. 

This results in two kinds of components: a wrapper for LocusZoom itself - `<locuszoom>`, implemented in the file `@/components/lz/LocusZoom.vue` - and components that manage LocusZoom panels - `<lz-*-panel>`, implementations found as `@/components/lz/panels/LocusZoom*Panel.vue`. Additionally, each `LocusZoom*Panel.vue` gets its own *`panelClass`*, a dataclass that configures the layout and datasource associated with the panel.

`<locuszoom>` treats LocusZoom as an "engine" - we give the Vue component methods that tell LocusZoom what we want it to do, like adding panels with datsources, removing these panels, or refreshing the data. 

Like `<filter-*-control>` for a criterion group component, `<lz-*-panel>`s are used as children for `<locuszoom>`, and only in this way. They mediate the relationship between a Vue component's lifecycle, and the lifecycle of a panel in LocusZoom. *In other words*, we need to guarantee that whenever this Vue component is added, a LocusZoom panel is created; whenever its props change, the panel's data changes; and whenever this Vue component is destroyed (like with `v-for`), LocusZoom destroys the corresponding panel. Maintaing this correspondence is the purpose of these child components.

`panelClass`es wrap LocusZoom configuration without any methods of their own. They exist just to keep configuring panels tidy. Each one contains: an field that holds a LocusZoom layout, a field that holds a LocusZoom datasource (also known as "adapter"), and a way to bind them together with a *namespace* specific to a component's instance.

LocusZoom's documentation describes how layouts/datasources/namespaces are related [here](https://statgen.github.io/locuszoom/docs/guides/rendering_layouts.html#using-namespaces). (Specifically notice how 'assoc_study1' and 'assoc_study2' are referenced in the layout, and how this is the only information in common between layouts and datasources)

Configuring layouts, datasources and namespaces are how LocusZoom features are built - so when creating a new panel, it is important to be familiar with this process. It is possible to describe this process step-by-step, so that it can be followed procedurally when a developer wants to write a new panel for LocusZoom on the portal. Importantly, reading (or skimming!) [LocusZoom's own guides](https://statgen.github.io/locuszoom/docs/) guarantees a smooth transition when it comes to modifying panels for use in the Portal.

## Using LocusZoom components

Although by this time there are many examples of LocusZoom being used in the Portal, the syntax for using LocusZoom was chosen to make it behave like other Vue components as closely as possible. Examples of each syntactic choice are given here, as well as a brief description of why.

### Declaring Components in LocusZoom

Adding panels to LocusZoom works like other Vue components. Although you can add panels to LocusZoom with functions (i.e. programmatically), this notation was chosen so that using LocusZoom felt as close as possible to using other Vue components.

```vue
<template>
    <locuszoom
        :chr="chr"
        :start="start"
        :end="end"
        @regionchange="handleRegionChange">

        <!-- span doesn't render in LocusZoom or in the DOM, making it an ideal candidate for encapsulating LocusZoom components for use with v-for. -->
        <span v-for="phenotype in phenotypes"
              :key="phenotype">

            <lz-associations-panel
                :phenotype="phenotype"
                @input="onAssociationsChange(phenotype)">
            </lz-associations-panel>
            
        </span>
    </locuszoom>
</template>
```

### Pulling LocusZoom's data when it updates

```vue
<template>
    <locuszoom
        :chr="chr"
        :start="start"
        :end="end">
        <lz-associations-panel
            :phenotype="phenotype"
            @input="onAssociationsChange(phenotype)">
        </lz-associations-panel>
    </locuszoom>
</template>
```

### Pushing data into LocusZoom (UNSUPPORTED)

_This case is not currently supported by our components._ I leave it here to illustrate why `@input` makes sense as a handler for capturing data requested by LocusZoom. In the future, if we decide to use Vuex to populate LocusZoom with data (making it completely a "view") then this is how the data would be passed to a LocusZoom panel.

```vue
<template>
    <locuszoom
        :chr="chr"
        :start="start"
        :end="end">

        <lz-associations-panel
            :phenotype="phenotype"
            :value="$parent.pageAssociations">
        </lz-associations-panel>

        <!-- Combining "Push" and "Pull" with "v-model", given @input for the pull case, and :value for the push case -->
        <lz-associations-panel
            :phenotype="phenotype"
            v-model="$parent.pageAssociations">
        </lz-associations-panel>

    </locuszoom>
</template>
```

### Binding filters onto LocusZoom

```vue
<template>

    <locuszoom
        // ...other props...
        :filterAssociations="associationsFilterFunction">
        <lz-associations-panel
            :phenotype="phenotype">
        </lz-associations-panel>
        <!-- IDEAL? 
            <lz-associations-panel
                :phenotype="phenotype"
                :filter="associationsFilterFunction">
            </lz-associations-panel>
        -->
    </locuszoom>

</template>
```

## Writing LocusZoom panels

Through trial-and-error a boilerplate-y means of writing new panels was converged upon. It takes place in three steps:

1) Defining Namespaces
2) Configuring Layouts
3) Configuring the Datasource

> TODO: For the future: it is feasible and likely desirable to write a small set of helper classes that can make these tasks more routine. When LocusZoom v0.14.0 is release, a `mutate_attr` function will have been written that could help make this task easy. Its progress can be tracked [here](https://github.com/statgen/locuszoom/pull/243) with discussion [here](https://github.com/statgen/locuszoom/issues/242).

### Configuring the layout

Custom configuration for LocusZoom layouts can seem difficult at first. However, each panel shares much of the same kind of configuration problems:

* They all need to have an existing LocusZoom panel to be based on;
* They all need to have a unique datasource connected to them via a name and a "shared field";
* Mostly, they need to add fields to a data layer that weren't there before;
* Sometimes, they need to be configured with features like tooltips, color matching, different axis labels... etc.

The following example is taken from the constructor of `LZAssociationsPanel` (a `panelClass`), which takes `(phenotype, title, onLoad, onResolve, onError, initialData)` as its arguments.

```js
this.layouts = [
    LocusZoom.Layouts.get("panel", this.panel_layout_type, {
        // TASK: ID: make sure the panel_id is provided
        id: `${this.panel_id}`,
        title: {
            text: !!title
                ? `${title} Variant Associations`
                : "Variant Associations",
            style: { "font-size": "18px" },
            x: -0.5,
        },
        y_index: 0,
        data_layers: [
            LocusZoom.Layouts.get("panel", this.panel_layout_type)
                .data_layers[0],
            LocusZoom.Layouts.get("panel",this.panel_layout_type)
                .data_layers[1],
            LocusZoom.Layouts.get(
                "data_layer",
                "association_pvalues_catalog",

                // TODO: for all of this fidgeting with the namespace, replace with rewriting a layout's fields with helper method
                // TASK: Wherever the data_layer needs to reference a particular adapter, bind the adapter's name to the namespace
                {
                    namespace: {
                        ...LocusZoom.Layouts.get(
                            "data_layer",
                            "association_pvalues_catalog"
                        ).namespace,
                        [this.datasource_type]: this
                            .datasource_namespace_symbol_for_panel,
                    },
                // TASK: Important! Fields only draw data that they need. Sometimes filters need data which isn't explicitly displayed. 
                //  SO: Add these extra fields to the "fields" part of a datalayer. Since it's a list, you need to make sure all the previous items still exist.
                    fields: [
                        // adding back other items
                        ...LocusZoom.Layouts.get(
                            "data_layer",
                            "association_pvalues_catalog",
                            { unnamespaced: true }
                        ).fields,

                        // creating new (unnamespaced) fields
                        `{{namespace[${this.datasource_type}]}}position`, // adding this piece of data irrelevant to the graphic will help us filter later
                        `{{namespace[${this.datasource_type}]}}pValue`, // adding this piece of data irrelevant to the graphic will help us filter later
                        `{{namespace[${this.datasource_type}]}}consequence`, // adding this piece of data irrelevant to the graphic will help us filter later
                        `{{namespace[${this.datasource_type}]}}nearest`, // adding this piece of data irrelevant to the graphic will help us filter later
                        // we need to call out the fields directly since merge algorithm doesn't combine arrays
                        `{{namespace[${this.datasource_type}]}}beta`,
                    ],
                    y_axis: {
                        axis: 1,
                        field: `{{namespace[${this.datasource_type}]}}log_pvalue`, // Bad field name. The api actually sends back -log10, so this really means "log10( -log10 (p))"
                        upper_buffer: 0.1,
                    },

                    // Finally: defining extra parts of the data_layer 

                    toolbar: {
                        widgets: [
                            {
                                type: "remove_panel",
                                color: "red",
                                position: "right",
                            },
                            {
                                type: "toggle_legend",
                                position: "right",
                            },
                            {
                                type: "toggleloglog",
                                color: "gray",
                                position: "right",
                            },
                        ],
                    },
                    // matching property so that data can be selected across panels
                    match: {
                        send: `assoc:position`,
                        receive: `assoc:position`,
                    },
                    color: [
                        // declarative rule for what should happen in matching state
                        {
                            field: "lz_highlight_match", // Special field name whose presence triggers custom rendering
                            scale_function: "if",
                            parameters: {
                                field_value: true,
                                then: "#FF00FF",
                            },
                        },
                        // remember other color rules
                        ...LocusZoom.Layouts.get(
                            "data_layer",
                            "association_pvalues_catalog",
                            { unnamespaced: true }
                        ).color,
                    ],
                }
            ),
        ],
    }),
];
```

### Defining Namespaces

The following example is taken from the constructor of `LZAssociationsPanel` (a `panelClass`), which takes `(phenotype, title, onLoad, onResolve, onError, initialData)` as its arguments.

```js
/* Identify the resources from LocusZoom to use */

// Use the `association_catalog` layout. This is one of the default LocusZoom layouts.
this.panel_layout_type = "association_catalog";

// Use the datasources in the "assoc" namespace (we'll be replacing them)
this.datasource_type = "assoc";  

/* Define namespace-binding information */
//
// These two pieces of ID information can be defined arbitrarily and independent from everything else;
// however, we'll define them in terms of:
//    (a) the layout's parameter (in this case phenotype) and visualization as the ID, and
//    (b) the ID combined with the adapter type as the name for the panel's datasource.
//
// * `panel_id` is used by LocusZoom to e.g. know which panel to delete on a delete event.
// * `datasource_namespace_symbol_for_panel` is used by LocusZoom to know what datasource to call
//    when the state of the visualization changes (such as when you shift a region).
//
// Both `panel_id` and `datasource_namespace_symbol_for_panel` are used within the "Configuring Layouts" step.
// 
// Importantly: when `datasource_namespace_symbol_for_panel` is applied to a layout, either indirectly through
// the namespace property of the layout object, or directly through rewriting the fields from e.g. "{{namespace[assoc]}}:log_pvalue"
// to "T2D_association_src:log_pvalue", it will draw information from a datasource with that name.
//
// Later when we "Create Adapters" (step 3), we use `datasource_namespace_symbol_for_panel` as the name for the register, which will be
// registed for the datasource to call.
//
// By having `datasource_namespace_symbol_for_panel` depend on `panel_id`, we can guarantee a unique datasource for each panel. This way,
// different panels can show different information of the same type (e.g. multiple GWAS plots for different phenotypes).
//

this.panel_id = `${phenotype}_${this.panel_layout_type}`;
this.datasource_namespace_symbol_for_panel = `${this.panel_id}_${this.datasource_type}_src`;
```

As this part of the code is thoroughly commented, no further elucidation is made here.

#### Finding your base layout

- Choosing your base layout from existing layouts
  - Look at existing examples
  - Deciding on the shared fields
  - Thinking about alternative customizations
  - Seeking the specific data layer to be modified from the source
  - Providing the panel ID and namespace information

When creating a new panel for the Portal, your first task is to find the right layout. The LocusZoom project creates new layouts through a combination of custom code written in D3, and configuration on that code written in plain old JSON. You can find the layout closest to yours by looking at LocusZoom's examples, [here](https://statgen.github.io/locuszoom/#examples). 

For instance, this is the panel used for `LocusZoomAssociationsPanel.vue`, which incorporates three data layers that define its layout:

```js
// An example of this layout in use is here: https://statgen.github.io/locuszoom/examples/gwas_catalog.html?chrom=9&start=21751670&end=22351670
LocusZoom.Layouts.get("panel", "association_catalog", { /* configuration options to override layout here */ })
```

Once you find the layout, you need to find plan your customization for the Portal by finding certain information first. When you find the example that works for you, there are two pieces of information you need to extract from the spec.

* You need to find the data layer that encodes that data you want to display. For instance, `association_pvalues_catalog`: [1](https://github.com/statgen/locuszoom/blob/5190f5985027a0fd6b939d3456981d579e19b659/esm/layouts/index.js#L291) [2](https://github.com/statgen/locuszoom/blob/5190f5985027a0fd6b939d3456981d579e19b659/esm/layouts/index.js#L439)
* You need to find the the namespace that the fields you want to modify uses. Here, `assoc`: [1](https://github.com/statgen/locuszoom/blob/5190f5985027a0fd6b939d3456981d579e19b659/esm/layouts/index.js#L441) [2](https://github.com/statgen/locuszoom/blob/5190f5985027a0fd6b939d3456981d579e19b659/esm/layouts/index.js#L450)

These pieces of information are used to give values to `this.panel_layout_type` and `this.datasource_type`, which are referenced in the configuration below.

###### Namespace the layout

One essential, simple customization must be made to any chosen layout: namespacing.

Namespaces are what glue datasources and layouts together. Every time a field annotated by `this.datasource_type` is referenced inside of the layout (e.g. `assoc:pvalue`), it will try to draw its data from whatever datasource is named `this.datsource_namespace_symbol_for_panel`. Typically for panels on the Portal, this datasource will only give data to this specific layout.

```js
{
    namespace: {
        ...LocusZoom.Layouts.get(
            "data_layer",
            "association_pvalues_catalog"
        ).namespace,
        [this.datasource_type]: this.datasource_namespace_symbol_for_panel,
    },
}
```

Since we're overriding a JSON object via this configuration, we need to make sure that we aren't overriding the properties we need. Thus we call `LocusZoom.Layouts.get("data_layer", "association_pvalues_catalog")` and spread it before the we add another field to the namespace. This way we are only overriding one field, and not removing any of them.

#### Adding fields

It is important to know that a LocusZoom panel *only stores data from datasources that match its fields*. For instance, if our datasource gives `pValue`, `log_pvalue`, `position`, and `consequence`, but the data layer only requires `pvalue` and `position`, then `consequence`, `log_pvalue` and `pValue` will be stripped from the data (the latter because fields are case sensitive).

This becomes a problem when e.g. using filters from our `criterion` components. LocusZoom layouts are generally configured to use only the data that they visually display. But sometimes datapoints have information which you can't render, or otherwise act as joins to other datasets. To have filters work on the original data drawn from the datasource, we need to explicitly declare these extra fields in the layout.

The following example is taken from the constructor of `LZAssociationsPanel` (a `panelClass`), which takes `(phenotype, title, onLoad, onResolve, onError, initialData)` as its arguments.

```js
{
    // TASK: Important! Fields only draw data that they need. Sometimes filters need data which isn't explicitly displayed. 
    //  SO: Add these extra fields to the "fields" part of a datalayer. Since it's a list, you need to make sure all the previous items still exist.
    fields: [
        // adding back other items
        ...LocusZoom.Layouts.get(
            "data_layer",
            "association_pvalues_catalog",
            { unnamespaced: true }
        ).fields,
        // creating new (unnamespaced) fields
        `{{namespace[${this.datasource_type}]}}position`, // adding this piece of data irrelevant to the graphic will help us filter later
        `{{namespace[${this.datasource_type}]}}pValue`, // adding this piece of data irrelevant to the graphic will help us filter later
        `{{namespace[${this.datasource_type}]}}consequence`, // adding this piece of data irrelevant to the graphic will help us filter later
        `{{namespace[${this.datasource_type}]}}nearest`, // adding this piece of data irrelevant to the graphic will help us filter later
        // we need to call out the fields directly since merge algorithm doesn't combine arrays
        `{{namespace[${this.datasource_type}]}}beta`,
    ],
}
```

#### Tooltips, colors and other customizations

_Curse of the layouts_. As seen in the other two configurations, for namespaces and fields, because merging two JSON objects together could mean one overrides the properties of the other, we need to duplicate the properties of the object (with e.g. `...LocusZoom.Layouts.get('data_layer', 'association_pvalues_catalog').namespace` for duplicating and spreading the default namespace) before adding properties underneath as overrides. 

The same holds for other configuration properties like `color` or `fields`, which are arrays. Even though some object merging algorithms can have consistent override rules - say, the second object dominates the first - this can't hold in the case of arrays where whether or not some data is overriden becomes dependent on its position, which is arbitrary.

So in the case where arrays must have properties added to them, one must always make sure to do something like `...LocusZoom.Layouts.get('data_layer', 'association_pvalues_catalog').<fieldname>` to guarantee that the rest of the display is unchanged.

Below is an example of `color` being changed for `association_pvalues_catalog`.

```js
color: [
    // declarative rule for what should happen in matching state
    {
        field: "lz_highlight_match", // Special field name whose presence triggers custom rendering
        scale_function: "if",
        parameters: {
            field_value: true,
            then: "#FF00FF",
        },
    },
    // remember other color rules
    ...LocusZoom.Layouts.get(
        "data_layer",
        "association_pvalues_catalog",
        { unnamespaced: true }
    ).color,
],
```

### Configuring the datasource

All of the Portal's panels (with one exception) use a `LZBioIndexSource` designed to call the [BioIndex](https://bioindex.hugeamp.org). The `LZBioIndexSource` takes the name of an index (like `associations` or `gene-links`), and a means of producing a query to that index, both required to figure out what data to give a layout when LocusZoom queries datasources for its current region. Its implementation uses the same function for queries that the Portal's BioIndex modules uses, which means it gives similar results. If the same of the data needs to change before, it takes a `translator` function which can do the transformation.

(The only panel that doesn't use a `LZBioIndexSource` is `LocusZoomComputedCredibleSet.vue`. A special datasource is created that calls a method which can find credible variants relative to the current region. As it's only relevant to that particular panel, I won't elaborate on it here.)

The following example is taken from the constructor of `LZAssociationsPanel` (a `panelClass`), which takes `(phenotype, title, onLoad, onResolve, onError, initialData)` as its arguments.

```js
// the index used against BioIndex
this.index = "associations";

// TASK: the query will receive LocusZoom's state, mainly chr,start,end; but this isn't typically sufficient to specify
//      a BioIndex query, which will typically be indexed on a single paramter (in this case Phenotype)
//      So we make a function which is a closure for the indexing parameter, and used to build the query for BioIndex.
    // TODO: Potentially, this could be eliminated in favor of using URL params (like with AssociationLZ Adapters)
this.queryStringMaker = (chr, start, end) => `${phenotype},${chr}:${start}-${end}`

// TASK: Translate the data into a form that the LocusZoom panel layout will except (due to its definitions for fields in its data_layers)
    // TODO: Potentially, this ETL could be eliminated in favor of renaming the fields in the layout with helper
this.translator = (associations) => {
    return associations.map((association) => ({
        chromosome: association.chromosome,
        id: varId2OtherVarId(association.varId),
        position: association.position,
        pValue: association.pValue,
        log_pvalue: -1 * Math.log10(association.pValue), // .toPrecision(4),
        variant: varId2OtherVarId(association.varId),
        ref_allele: association.reference,
        consequence: association.consequence,
        beta: association.beta,
        nearest: association.nearest,
    }));
};

this.initialData = initialData;

// TODO: To eliminate this datasource, we could possible register the dataSource *once* for LocusZoom, then just refer 
//  to it by name along with a params object.
this.bioIndexToLZReader = new LZBioIndexSource({
    index: this.index,
    queryStringMaker: this.queryStringMaker,
    translator: this.translator,
    // TODO: remove onLoad/onResolve/onError and find another way to bind them?
    onLoad,
    onResolve,
    onError,
    // TODO: remove push-based code?
    initialData: this.initialData,
});
```

The important things to note are:

* `index` must be a valid index from BioIndex.
* `queryStringMaker` is a closure which always takes region-based coordinates as arguments. These coordinates often form the second part of a BioIndex query, but do not have to. It's OK to ignore these coordinates if they aren't necessary for the query (like e.g. PheWAS data for variants).
* `translator` is a function that converts BioIndex data into something compatible with the layout's fields.
* `onLoad`, `onResolve` and `onError` are used to bind functions that do things when data is first loaded, when it's completely loaded, and if it fails to load.
* `initialData` is the first data that gets returned regardless of the initial query to BioIndex. (this is generally not used.)

The `LZBioIndexSource` uses all this information to query `index` whenever LocusZoom refreshes (like when its region changes). The data is collected, translated with `translator`, then emitted into whatever optional function was bound to `onLoad`.

## The lifecycle of lz-associations-panel

During debugging and development, it is useful to know how and when certain events are meant to occur.

Say we had this LocusZoom configuration on the Region Page:

```vue
<template>
    <!-- Other region page components here -->
    
    <locuszoom
        :chr="chr"
        :start="start"
        :end="end">

        <span v-for="phenotype in phenotypes" :key="phenotype">
            <lz-associations-panel
                :phenotype="phenotype"
                @input="onAssociationsChange(phenotype)">
            </lz-associations-panel>
        </span>

    </locuszoom>

    <!-- Other region page components here -->
</template>
```

What is the full behavior between `<locuszoom>` and `<lz-associations-panel>` when the page renders, in terms of their component lifecycles?

1) `<locuszoom>` is mounted.
2) Using the LocusZoom library, a LocusZoom plot is instantiated for `<locuszoom>` in `data` as `this.plot`.
3) When the plot is finished initializing, a flag is set marking that the plot has been created.
4) Once the flag is set, `<locuszoom>`'s slot is mounted (since it was controlled by the flag with `v-if`).
5) Once the slot is mounted, all of its children are created and mounted.
6) Since `<lz-associations-panel>` is a child of `<locuszoom>`, it's created and mounted.
7) When `<lz-associations-panel>` is created, it initializes a panelClass for `LZAssociationsPanel` (typically inside of the Vue file) using information from its props, such as `:phenotype`, along with event handlers which emit the panel's data on `@input` (or `@load`, `@error`).
8) When `<lz-associations-panel>` is mounted, `updatePanel` is called, and the panelClass is directly passed to `<locuszoom>` using `this.$parent.addPanelAndDatasource`.
9) `<locuszoom>` takes `panelClass` apart into `layouts` and `datasources`, adding the `datasources` to the plot (if they aren't already there), then adding the `layouts`. 
10) The plot refreshes, and the panel calls for its data from `datsources`, pulling it from BioIndex (in this case, from the `associations` index).
11) `@input` is called when the data arrive, carrying the associations with it. Here, `onAssociationsChange(phenotype)` is a higher-order function that takes these associations and does something with them. On the region page, they (a) get stored into a map, and (b) are used to synchronize LocusZoom with the Associations Table component. In other words, LocusZoom pulls the data, and we push it into other components; rather than using a Vuex module to do the same.

If the LocusZoom plot's region changes - say if the user dragged the plot around, or the page changes its region because its gene changed - then the panels ask for new data in that region. This refreshes the state of the application, causing datasources to be queried, going through all of the events from |10| onwards.

If phenotype changes, then `v-for` kicks in and destroys the component. LocusZoom then removes its corresponding panel. If more phenotypes are added to the list, `v-for` creates a new `<lz-associations-panel>` and the page undergoes all the events from |6| onwards.
