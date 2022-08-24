## Overview

These Vue components, here called **Criterion components**, are used for search, selecting and filtering for data based on... criterion.

Filters are Criterion components, of a specific kind. They're used mainly to build filter functions for a given field and predicate when children for `<criterion-function-group>` but can also be used for populating a list of Criterion when placed inside of a `<criterion-list-group>`.

A piece of **Criterion** is an object that looks like this:
```js
{
    field: String,  // the property inside of an object that the criterion operates on. Case-sensitive.
    threshold: [String, Number] // a value for the field

    // For the pill/tag being displayed underneath the Criterion Group
    label: [String, Function],  // description of the criterion, either given by hand or derived from the criterion's threshold and field. If it's a function it will be passed the criterion's own definition before being evaluated.
    color: String,  // hexcode color of the pill

    // For filter function construction
    multiple: true,   // there will be multiples of this field with different thresholds
    inclusive: true,  // whether or not the predicate is to be applied disjunctively with other predicates
}
```

You can pre-populate a `<criterion-list-group>` by making an array of Criterion objects and passing them through with `v-model`. For this list, `field` and `threshold` are necessary; the remaining properties will tend to have defaults, but it's recommended that you provide them values. Pill styling is handled in `mdkp.css` and obeys the function `filter-pill-<field>` where `field` is of course the case-sensitive/exact field name given to the `Filter*.vue` component or its Criterion.

If you have a group of components that are using only one filter function, it is *most performant* to place them inside of a template for the `filtered` slot inside of the Criterion Group. For instance, with `<criterion-function-group>`:
```vue
<template>

    <!-- Page Content -->

    <criterion-function-group>
        <template slot=filtered slot-scope="{ filter }">
            <!-- Target the slot for components using the function, with the property `filter` a part of slot-scope -->
            <example-table
                :data="$parent.exampleData"
                :filter="filter">
            </example-table>
        </template>

        <!-- filter controls can go here -->
    </criterion-function-group>

</template>
```
If you want the list of criterion from `<criterion-list-group>` into a child component like above, it uses the same template, with the same props.

### Multiple Filters

Currently, `<criterion-function-group>` supports the creation of only one filter function. To share a filter function between components, like when a component requires two filters but cannot be inside of the `<criterion-function-group>` for one of them, you may need to use `v-model` with a function defined on the page scope:
```vue
<template>

    <!-- Page Content -->

    <criterion-function-group v-model="$parent.sharedFilter">
        <!-- filter controls go here -->
        <!-- another component can be inserted here -->
    </criterion-function-group>
        
    <!-- Notice the table is NOT a child of criterion-filter-group above, but $parent.sharedFilter is in a scope shared by both -->
    <!-- you could put this table in another criterion-filter-group if you wanted -->
    <example-table 
        :data="$parent.exampleData" 
        :filter="$parent.sharedFilter">
    </example-table>
</template>
```

### How Filters are Made

To see how `<criterion-function-group>` constructs filters by default, look at `@/utils/filterHelpers`: 

1. The function `predicateFromSpec` is mapped onto an array of Criterion, paired with comparators given by child components that correctly wrap `FilterControlTemplate.vue`. This map derives a predicate function that is equipped with a flag which says if it's supposed to be exclusive or inclusive with other predicates (i.e. whether it is used in conjunctively or disjunctively). 

2. These new predicates are reduced into a single function using the method `filterFromPredicates`. This function already knows how to apply these predicates disjunctively or conjunctively, with Criterion presumed conjuctive by default. In other words, the function is a logical statement that is like `p(x) OR q(x) AND r(x) AND s(x) OR t(x)...`, or any combination of `OR/AND` across the given predicates to test an object `x` for properties with values, i.e. satisfying criterion.

The `template/<Criterion/Filter>-*-Template` components are not meant to be used inside of a page. Rather, they are extended by wrapping them inside of other components. See the existing components in `group`, or the `Filter*.vue` files, for examples.

### Pattern: Turning a Filter into a Controlled Component to get matches dynamically

Due to the potentially large number of options that a filter control may have, which can either affect page performance or clutter the UI, one might ask if it is possible to only get options relevant to what the user has given as input up to that point.

With the `@input-change` event, used on `filter-enumeration-control`, `filter-multi-control`, and `filter-basic-control`, we can respond to the user's matches to affect changes on the page. If we write a function that looks up or otherwise changes the list of options passed into these filters, then we can update the options dynamically based on closest matches to the string. For example:

```vue
<template>

    <!-- This example is taken from the GAIT page -->
    <!-- $parent.lookupGenes dispatches an action to the store for every keystroke on the filter control, 
        passing in the current value of filter-enumeration-control's input field to act as a string match -->
    <!-- $parent.matchingGenes is a computed property that carries a flat list of gene names based on elements in the store -->
    
    <!-- the <criterion-list-control> is not relevant to illustrate `@input-change`, but is provided to illustrate correct use of the filter -->
    <criterion-list-control v-model="$parent.criterionList">
        <!-- other filters would go here -->
        <filter-enumeration-control
            ref="gene"
            :field="'gene'"
            placeholder="Select a gene ..."
            :options="$parent.matchingGenes"
            @input-change="
                $parent.lookupGenes($event)
            ">
        </filter-enumeration-control>
        <!-- other filters would go here -->
    </criterion-list-control>

</template>
```

This is similar to how the `<autocomplete>` component works on the Index page, as Filters are in fact based on this component.

### Filter Template Props

| Property  | Type |  Notes        |
| :-------: |:----:| :-----------: |
| multiple   |Boolean | Allow a list of Criterion produced by a Filter to produce multiple thresholds for the same field, as in `[{ field: "phenotype", threshold: "T2D",... }, { field: "phenotype", threshold: "BMI",... }]` (i.e. a multiselect) |
