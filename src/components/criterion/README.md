These Vue components, here called Criterion components, are used for search, selecting and filtering for data based on... criterion.

A piece of Criterion is an object that looks like this:
```js
{
    field: String,  // the property inside of an object that the criterion operates on. Case-sensitive.
    threshold: [String, Number] // a value for the field

    // For the pill/tag being displayed underneath the Criterion Group
    label: [String, Function],  // description of the criterion, either given by hand or derived from the criterion's threshold and field.
    color: String,  // hexcode color of the pill

    // For filter function construction
    multiple: true,   // there can be multiples of this field with different thresholds
    inclusive: true,  // whether or not the predicate is to be applied disjunctively with other predicates
}
```

Filters are Criterion components, of a specific kind. They're used mainly to build filter functions for a given field and predicate when children for `<criterion-function-group>` but can also be used for populating a list of Criterion when placed inside of a `<criterion-list-group>`.

You can pre-populate a `<criterion-list-group>` by making an array of Criterion objects and passing them through with `v-model`. For this list, `field` and `threshold` are necessary; the remaining properties will tend to have defaults, but it's recommended that you provide them values. Pill styling is handled in `mdkp.css` and obeys the function `filter-pill-<field>` where `field` is of course the case-sensitive/exact field name given to the `Filter*.vue` component or its Criterion.

To see how `<criterion-function-group>` constructs filters by default, look at `@/utils/filterHelpers`: 

1. The function `predicateFromSpec` is mapped onto an array of Criterion, paired with comparators given by child components that correctly wrap `FilterControlTemplate.vue`. This map derives a predicate function that is equipped with a flag which says if it's supposed to be exclusive or inclusive with other predicates (i.e. whether it is used in conjunctively or disjunctively). 

2. These new predicates are reduced into a single function using the method `filterFromPredicates`. This function already knows how to apply these predicates disjunctively or conjunctively, with Criterion presumed conjuctive by default. In other words, the function is a logical statement that is like `p(x) OR q(x) AND r(x) AND s(x) OR t(x)...`, or any combination of `OR/AND` across the given predicates to test an object `x`.

The `template/<Criterion/Filter>-*-Template` components are not meant to be used inside of a page. Rather, they are extended by wrapping them inside of other components. See the existing components in `group`, or the `Filter*.vue` files, for examples.
