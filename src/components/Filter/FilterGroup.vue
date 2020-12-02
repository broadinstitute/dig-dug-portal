<template>
    <span>
        <!-- Controls and their labels -->
        <slot name="header"></slot>
        <b-container fluid class="filtering-ui-wrapper">
            <b-row class="filtering-ui-content">
                <EventListener @change="filterControlChange">
                    <!-- Filter Widget Control Slot -->
                    <!-- It's unnamed because multiple filter controls will be placed inside here -->
                    <slot></slot>
                </EventListener>
            </b-row>
        </b-container>

        <!-- Pills for everything -->
        <div v-if="filterList.length > 0" class="filter-pill-collection center">
            {{this.header}}:&nbsp;&nbsp;
            <!-- Derive pills from current filter state?
                        Might lose coloring - unless we use something like my planned colorUtils with real-time schema generation on a cycle
                        It would be deterministic upto the compile-time declaration of the FilterGroup controls which would lead to predicatable results at runtime
            -->
            <b-badge
                pill
                v-for="(filter, idx) in filterList"
                :key="filter.field + filter.predicate + filter.threshold + idx"
                :class="`btn filter-pill-${filter.field}`"
                :style="{ 'background-color': `${ !!filter.pill && !!filter.pill.color ? `${filter.pill.color} !important` : '' }` }"
                @click="unsetFilter(filter, idx)">
                {{ !!filter.pill && !!filter.pill.label ? filter.pill.label(filter) : `${filter.field} = ${filter.threshold}` }}
                <span class="remove">X</span>
            </b-badge>
        </div>
        <!-- Spacer to prevent flicker when new pills are added to the UI -->
        <br v-else />
        <slot name="filtered" :filter="filterFunction"></slot>
    </span>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import { isEqual, cloneDeep } from "lodash";
import { filterFromPredicates, predicateFromSpec } from "@/utils/filterHelpers";

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
     * In FilterGroup we'll use 'change' as the event share between EventListener and the child components.
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
};

export default Vue.component("filter-group", {
    props: {
        value: null, // any type, since filterMaker might return any type even though by default it should return a function
        inclusive: Boolean,
        strictCase: Boolean,
        looseMatch: Boolean,
        header: {
            type: String,
            default: "Selected Filters"
        },
        filterMaker: {
            type: Function,
            default: filterFromPredicates
        },
        predicateMaker: {
            type: Function,
            default: predicateFromSpec
        }
    },
    components: {
        EventListener
    },
    data() {
        return {
            // the filter on the end prevents malformed initial values from being used in the component
            filterList: (this.value !== null && Array.isArray(this.value) ? this.value : []).filter(filterDefinition => !!filterDefinition.field && !!filterDefinition.threshold),

            // Vue doesn't identify anonymous functions of the same form with one another,
            // so we are turning these two props into data to prevent infinite loops that result
            // from passing in anonymous functions which become reidentified under each tick.

            // So if we use these functions in a computed property, it will keep on refreshing even when the output looks the same.
            // This will work as long as we don't want to update the filterMaker and predicateMaker at runtime,
            // which quite frankly seems unlikely.
            makeFilter: this.filterMaker,
            makePredicate: this.predicateMaker
        };
    },

    computed: {
        filterFunction() {
            const predicates = this.filterList.map(obj =>
                this.makePredicate(
                    { ...obj },
                    {
                        strictCase: this.strictCase,
                        notStrictMatch: this.looseMatch
                    }
                )
            );
            return this.makeFilter(predicates, !!this.inclusive);
        },
    },

    methods: {
        filterControlChange(threshold, filterDefinition) {
            if (
                threshold !== null &&
                !this.filterList
                    .map(filter => filter.field)
                    .includes(filterDefinition.field)
            ) {
                this.filterList.push({
                    ...filterDefinition,
                    threshold
                });
            } else {
                // if the definition already exists, and it's a multiple, then just push, since we can allow for multiple instances of the same filter
                if (filterDefinition.multiple) {
                    // check if value is unique
                    if (
                        threshold !== null &&
                        !this.filterList
                            .map(filter => filter.threshold)
                            .includes(threshold)
                    ) {
                        this.filterList.push({
                            ...filterDefinition,
                            threshold
                        });
                    }
                    // if the definition already exists, and it's a not a multiple, then modify the existing definition in filterList that matches the field
                    // TODO: would be faster if we maintain a normalized version of filterList against the filter ID, refactor towards this for performance
                } else if (!filterDefinition.multiple) {
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
        },

        unsetFilter(obj, idx) {
            // equiv to setFilter with no data => reduction by alias
            // this.filterData[obj] = "";
            // this.filterList = this.filterList.filter(filterSpec => filterSpec.field !== obj.field && filterSpec.threshold !== obj.threshold && filterSpec.threshold !== obj.threshold)
            this.filterList = this.filterList
                .slice(0, idx)
                .concat(this.filterList.slice(idx + 1, this.filterList.length));
        }
    },
    watch: {
        value: {
            handler: function(newFilterValue, oldFilterValue) {
                if (!_.isEqual(newFilterValue, oldFilterValue)) {
                    this.filterList = this.value;
                }
            },
            deep: true,
        },
        filterFunction: {
            handler: function(newFilterFunction, oldFilterFunction) {
                this.$emit("input", newFilterFunction);
            },
            deep: true
        }
    }
});
</script>
