<template>
    <span>
        <EventListener
            @change="filterControlChange"
            @unset="unsetFilter"
            @filter-mounted="onInitialFilterDefinition"
        >
            <!-- Controls and their labels -->
            <slot name="header"></slot>
            <b-container v-show="!hide" fluid class="filtering-ui-wrapper">
                <b-row class="filtering-ui-content">
                    <!-- Filter Widget Control Slot -->
                    <!-- It's unnamed because multiple filter controls will be placed inside here -->
                    <slot></slot>
                    <slot v-if="!noPills && inlinePills" name="pills">
                        <criterion-pills
                            v-if="filterList != null && filterList.length > 0"
                            :header="header"
                            :filterList="filterList"
                        ></criterion-pills>
                    </slot>
                </b-row>
            </b-container>
            <slot v-if="!noPills && !inlinePills" name="pills">
                <criterion-pills
                    v-if="filterList != null && filterList.length > 0"
                    :header="header"
                    :filterList="filterList"
                ></criterion-pills>
            </slot>
        </EventListener>
        <!-- Spacer to prevent flicker when new pills are added to the UI -->
        <slot name="filtered" :filter="criterion"></slot>
    </span>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import { isEqual, cloneDeep, merge, groupBy } from "lodash";
import { filterFromPredicates, predicateFromSpec } from "@/utils/filterHelpers";
import CriterionPills from "@/components/criterion/template/CriterionPills";

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
     * In CriterionGroupTemplate we'll use 'change' as the event share between EventListener and the child components.
     *
     */
    render(createElement) {
        // Using Vue's createElement API with render functions to eliminate the need to define const EventListener in a separate component file.
        // Without using Vue's runtime compiler (bloat), we can't define scoped slots directly in it, so instead we use an undocumented internal
        // feature – of course – to give the element a default slot.
        // So don't touch this, it works great
        // https://stackoverflow.com/a/58859267

        return createElement("div", this.$scopedSlots.default());
    },
};

export default Vue.component("criterion-group-template", {
    components: {
        CriterionPills,
    },
    props: {
        value: [Function, Array],
        filterType: {
            type: String,
            // required: true,
        },

        inclusive: Boolean,
        strictCase: Boolean,
        looseMatch: Boolean,
        hide: Boolean,
        header: {
            type: String,
            default: "Selected Filters:\t",
        },

        filterMaker: {
            type: Function,
            default: filterFromPredicates,
        },
        predicateMaker: {
            type: Function,
            default: predicateFromSpec,
        },
        noPills: {
            type: Boolean,
            default: false,
        },
        inlinePills: {
            type: Boolean,
            default: false,
        },
    },
    components: {
        EventListener,
    },
    data() {
        return {
            // the filter on the end prevents malformed initial values from being used in the component
            filterList: null,
            filterFunction: (id) => true,

            // criterion: !!this.value ? this.value : this.filterType === 'function' ? id => true : [],

            // Vue doesn't identify anonymous functions of the same form with one another,
            // so we are turning these two props into data to prevent infinite loops that result
            // from passing in anonymous functions which become reidentified under each tick.

            // So if we use these functions in a computed property, it will keep on refreshing even when the output looks the same.
            // This will work as long as we don't want to update the filterMaker and predicateMaker at runtime,
            // which quite frankly seems unlikely.
            makeFilter: this.filterMaker,
            makePredicate: this.predicateMaker,
            initialFilterDefinitions: [], // THESE CAN CHANGE, THEY ARE NOT REAL-TIME FILTER DEFINITIONS
            initialFilterDefinitionMap: {},
        };
    },
    created() {
        this.filterList =
            !!this.value &&
            typeof this.value === "object" &&
            this.value.length > 0
                ? this.value
                : [];
        this.filterFunction =
            !!this.value && typeof this.value === "function"
                ? this.value
                : (id) => true;
    },
    mounted() {
        if (this.initialFilterDefinitions.length > 0) {
            this.initialFilterDefinitionMap = groupBy(
                this.initialFilterDefinitions,
                "field"
            );
        }
    },
    computed: {
        criterion() {
            if (this.filterType === "function") {
                return this.filterFunction;
            } else if (this.filterType === "list") {
                if (
                    this.filterList != null &&
                    Object.keys(this.initialFilterDefinitionMap).length > 0
                ) {
                    this.filterList = this.filterList.map((el) =>
                        Object.assign(
                            el,
                            this.initialFilterDefinitionMap[el.field][0]
                        )
                    );
                }

                return this.filterList;
            }
        },
    },
    methods: {
        onInitialFilterDefinition(filterDefinition) {
            this.initialFilterDefinitions.push(filterDefinition);
        },
        filterControlChange(threshold, filterDefinition) {
            // this is a workaround for a limitation Vue has when mutating arrays and objects that prevents watchers from detecting value changes
            // (they can detect that an update has occured, yet do not return old values unless we reinitialize the object/array entirely, against a new reference)
            // https://github.com/vuejs/vue/issues/2164
            let copiedArray = cloneDeep(this.filterList);

            if (
                threshold !== null &&
                !this.filterList
                    .map((filter) => filter.field)
                    .includes(filterDefinition.field)
            ) {
                // pass in the whole filter definition along with is propert threshold
                this.filterList = copiedArray.concat({
                    threshold,
                    ...filterDefinition,
                });
            } else {
                // if the definition already exists, and it's a multiple, then just push, since we can allow for multiple instances of the same filter
                if (filterDefinition.multiple) {
                    // check if value is unique
                    if (
                        threshold !== null &&
                        !this.filterList
                            .map((filter) => filter.threshold)
                            .includes(threshold)
                    ) {
                        this.filterList = copiedArray.concat({
                            threshold,
                            ...filterDefinition,
                        });
                    }
                    // if the definition already exists, and it's a not a multiple, then modify the existing definition in filterList that matches the field
                    // TODO: would be faster if we maintain a normalized version of filterList against the filter ID, refactor towards this for performance
                } else if (!filterDefinition.multiple) {
                    this.filterList = copiedArray.map((filter) => {
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
        unsetFilter({ filter, idx }) {
            // equiv to setFilter with no data => reduction by alias
            // this.filterData[obj] = "";
            // this.filterList = this.filterList.filter(filterSpec => filterSpec.field !== obj.field && filterSpec.threshold !== obj.threshold && filterSpec.threshold !== obj.threshold)
            this.filterList = this.filterList
                .slice(0, idx)
                .concat(this.filterList.slice(idx + 1, this.filterList.length));
        },
    },
    watch: {
        initialFilterDefinitions: {
            handler: function () {
                if (this.initialFilterDefinitions.length > 0) {
                    this.initialFilterDefinitionMap = groupBy(
                        this.initialFilterDefinitions,
                        "field"
                    );
                }
            },
            deep: true,
        },
        value: {
            handler: function (newCriterionValue) {
                if (this.filterType === "function") {
                    this.filterFunction = newCriterionValue;
                    if (!isEqual(newCriterionValue, this.filterFunction)) {
                        this.filterFunction = newCriterionValue;
                    }
                } else if (this.filterType === "list") {
                    if (!isEqual(newCriterionValue, this.filterList)) {
                        this.filterList = newCriterionValue;
                    }
                }
            },
            deep: true,
        },
        filterList: {
            handler: function (newFilterList, oldFilterList) {
                if (newFilterList.length > 0) {
                    const predicates = newFilterList.map((predicateSpec) =>
                        this.makePredicate(predicateSpec, {
                            strictCase: this.strictCase,
                            notStrictMatch: this.looseMatch,
                        })
                    );
                    this.filterFunction = this.makeFilter(
                        predicates,
                        !!this.inclusive
                    );
                } else {
                    this.filterFunction = function (id) {
                        return true;
                    };
                }
            },
            deep: true,
        },
        criterion: {
            handler: function (newCriterionValue, oldCriterionValue) {
                if (!isEqual(newCriterionValue, oldCriterionValue)) {
                    this.$emit("input", newCriterionValue);
                }
            },
            deep: true,
        },
    },
});
</script>
