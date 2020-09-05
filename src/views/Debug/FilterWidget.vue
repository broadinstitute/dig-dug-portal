<template>
    <div>
        <!-- Controls and their labels -->
        <b-container fluid class="filtering-ui-wrapper">
            <b-row class="filtering-ui-content">
                <EventListener @change="dispatchFilterControlChange">
                    <!-- Filter Widget Control Slot -->
                    <!-- It's unnamed because multiple filter controls will be placed inside here -->
                    <slot></slot>
                </EventListener>
            </b-row>
        </b-container>

        <!-- Pills for everything -->
        <b-container fluid class="selected-filters-ui-wrapper">
            <b-row v-if="select_pValue || select_beta">
                <b-col>

                    <span>Selected Filters:&nbsp;&nbsp;</span>
                    <!-- TODO: Color Scheme for Pills via Variant => use the colorUtils instead? -->
                    <b-badge
                        v-for="filter in filterList"
                        :key="filter.field+filter.op+filter.threshold"
                        pill
                        variant="danger"
                        @click="unsetFilter(filter.field)"
                        class="btn">
                        {{filter.field}}
                        <span class="remove">X</span>
                    </b-badge>

                    <!-- Derive this from current filter state?
                         Might lose coloring - unless we use something like my planned colorUtils with real-time schema generation on a cycle
                         It would be deterministic upto the compile-time declaration of the FilterWidget controls which would lead to predicatable results at runtime
                     -->
                    <!-- <template v-if="select_pValue.length > 0">
                        <b-badge
                            pill
                            variant="danger"
                            @click="unsetFilter('select_pValue')"
                            class="btn">
                            {{select_pValue}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>

                    <template v-if="select_beta">
                        <b-badge
                            pill
                            variant="primary"
                            @click="unsetFilter('select_beta')"
                            class="btn">
                            {{select_beta_options.find(e => e.value === select_beta).text}}
                            <span
                                class="remove"
                            >X</span>
                        </b-badge>
                    </template> -->

                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Formatters from "@/utils/formatters";
import Filters from "@/utils/filters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

// TODO: Define a interface or a service (a filter interaction and creation protocol) that can be used with 
// filter-widget-controls (as children!) as well as derived/computed pills
// first thing is that for each filter-wiget-control, it needs a corresponding item in a object so it can be dynamically referenced in the template (as well as the component methods)
// could define the child component it in here for file cohesion (although that disobeys convention that one component = one file)
// ditto with the event-listener component on the slot

const EventListener = {
    /*
     * 
     * Dummy component that we use to help pass out and dispatch events for children inside its slot.
     * This way we don't have to bind a listener to all of its children, and keep all the bindings inside this component.
     * (This will be useful in other contexts like the Results Page later)
     * 
     * It's used by child components to dispatch an event of whatever type,  using the function `this.$parent.$emit(<event>)`
     * 
     * If you want someone to blame for this, it's the Vue devs, for not allowing v-on with slots: https://github.com/vuejs/vue/issues/4781
     * And we're doing this as our response: https://github.com/vuejs/vue/issues/4781#issuecomment-501217642
     * 
     * In FilterWidget we'll use 'change' as the event share between EventListener and the child components.
     * 
     */
    render(createElement) {
        
        // Using Vue's createElement API with render functions to eliminate the need to define const EventListener in a separate component file.
        // Without using Vue's runtime compiler (bloat), we can't define scoped slots directly in it, so instead we use an undocumented internal 
        // feature – of course – to give the element a default slot.
        // So don't touch this, it works great
        // https://stackoverflow.com/a/58859267

        return createElement("div", this.$scopedSlots.default());
    }
    
}

export default Vue.component("filter-widget", {
    props: ["value"],
    components: {
        EventListener,
    },
    data() {
        return {
            // TODO: These need to be dynamically registered or collected
            // For collection, use slot scopes for modifying a shared object on event binding?
            select_pValue: "",
            select_pValue_text: "",
            select_beta: "",
            select_beta_options: [
                { value: "p", text: "Positive" },
                { value: "n", text: "Negative" },
            ],

            filterList: [],
            filterData: {},

        };
    },

    computed: {

        filterFunction() {
            const predicates = this.filterList.map(this.predicateFromSpec);
            return this.filterFromPredicates(predicates);
        }

    },

    methods: {

        dispatchFilterControlChange() {

            // todo: refactor down to just threshold and filterDefinition, maybe filterControlFunction dispatch as well?
            // 'addCompound', newThreshold, this.filterDefinition.ref, this.filterDefinition.id, !!this.multiple, this.filterDefinition
            const [b, threshold, c, d, multiple, filterDefinition] = arguments;
                        
            // DONE: create filter if not there? (issue in multiples case)
            // could get children to modify registry at runtime during create...
            // or emitted later?
            if (!this.filterList.map(filter => filter.field).includes(filterDefinition.field)) {
                // TODO: Refactor. equiv to addFilter. we need to use this at least once if we're using filters as lists
                this.filterList.push({
                    ...filterDefinition,
                    threshold,
                });
            } else {
                // if the definition already exists, and it's a multiple, then just push, since we can allow for multiple instances of the same filter
                // TODO: enforce uniqueness of threshold value?
                if (filterDefinition.multiple) {

                    // TODO: Refactor. equiv to addFilter in older code
                    this.filterList.push({
                        ...filterDefinition,
                        threshold,
                    });

                // if the definition already exists, and it's a not a multiple, then modify the existing definition in filterList that matches the field
                // TODO: would be faster if we maintain a normalized version of filterList against the filter ID, refactor towards this for performance
                } else if (!filterDefinition.multiple) {

                    // TODO: Refactor. equiv to setFilter in older code
                    // if match, then modify, else return through
                    this.filterList = this.filterList.map(filter => {
                        if (filter.field === filterDefinition.field) {
                            const tempFilter = filter;
                            tempFilter.threshold = threshold;
                            return tempFilter;
                        } else {
                            // no need to modify because no signaling of a new threshold for this field
                            return filter;
                        }
                    });

                }
            }
            // NOTE: As a result of this.filterList being modified, the computed property for the filterFunction should reactively producing a new version of itself.

            // NOTE: saving this code snippet because i'm pleased with myself and it looks useful
            // // thanks to how Vue works we can ask the object directly for a method, as it's registered in `this[..]`.
            // // this looks evil but on the other hand it lets us avoid having to do case-splitting which would be harder to maintain (duplication).
            
            // // the filterControl keywords here include: addSingle, addCompound, etc.
            // // TODO: these are methods which do...?

            // const [filterControl, ...rest] = arguments;
            // if (!!this[filterControl]) {
            //     this[filterControl](...rest);
            // }

        },

        filterFromPredicates(predicates) {
            console.log('filterFromPredicates', predicates)
            // TODO: just use `_.overEvery` from Lodash instead?
            return function filterFunction(object) {
                // NOTE: Filter policy is innocent until proven guilty. 
                // Guilt is terminal: we break our investigation as soon as
                // we've found evidence that the object isn't innocent.
                let innocence = true;
                if (predicates !== []) {
                    for (predicate in predicates) {
                        innocence = predicate(object);
                        if (innocence === false) break;
                    }
                }
                return innocence;
            }
        },

        predicateFromSpec({ field, op, threshold }) {
            console.log('predicateFromSpec', { field, op, threshold })
            // DONE: lookup/DISPATCH operation function for given `op` (unless `op` is also a function)
            // TODO: is there an advantage to using Lodash operations instead?
            const operationMap = {
                "==": (a, b) => a === b,  // we know what they mean, anyone who means `==` would want javascript operational semantics versus domain-semantics of numbers or lexigraphical information. unlikely for scientists. we could alternately model this case as a hard error.
                "===": (a, b) => a === b,
                ">=": (a, b) => a >= b,
                ">": (a, b) => a > b,
                "<": (a, b) => a < b,
                "<=": (a, b) => a <= b,
            }
            const operation = operationMap[op];

            // NOTE: the policy of this filter is to disallow all objects that could never satisfy it in theory (ie lacking properties required). 
            // TODO: replace !!datum.field with loose matcher logic (capitaliation, dashes, prefixes and suffixes)
            return datum => (!!datum[field]) ? operation(datum[field], threshold) : false;
        },

        // TODO: what's the distinction between addFilter and setFilter?
        // TODO: what's the distinction between filterData[obj] and filterData[obj+"_text"]?
        addFilter(event, obj) {
            this.filterData[obj].push(event.trim());
            this.filterData[obj + "_text"] = "";
        },
        setFilter(event, obj) {
            this.filterData[obj] = event;
            this.filterData[obj + "_text"] = "";
        },

        removeFilter(index, obj) {
            this.filterData[obj].splice(index, 1);
        },
        unsetFilter(obj) {
            // equiv to setFilter with no data => reduction by alias
            this.filterData[obj] = "";
        },

        addCompound(event, obj, id, multiple) {

            // the branch is: are we stacking a new filter constraint, or are we modifying a single filter value?
            if (multiple) this.addFilter(event, obj);
            else this.setFilter(event, obj);

            // Clear out filter-widget-control after adding new data
            let element = document.getElementById(id);
            element.value = "";

        },

        // clear out entire filter
        clearCompound() {
            this.filterList = [];
            this.filterData = {};
        },

    },
    watch: {
        filterFunction(newFilterFunction) {
            this.$emit('input', newFilterFunction);
        }
    }
});
</script>
