<template>
    <span>
        <EventListener
            @change="filterControlChange"
            @filter-mounted="onInitialFilterDefinition"
        >
            <slot name="header"></slot>
            <b-container v-show="!hide" fluid class="filtering-ui-wrapper">
                <b-row class="filtering-ui-content">
                    
                    <slot></slot>
                    <slot v-if="inlinePills && !noPills" name="pills">
                        <criterion-pills
                            v-if="filterListInternal != null && filterListInternal.length > 0"
                            :header="header"
                            :fitlerList="filterListInternal"
                            :clearable="clearable"
                            @unset="unsetFilter"
                        ></criterion-pills>
                    </slot>

                </b-row>
            </b-container>

            <slot v-if="!inlinePills && !noPills" name="pills">
                <criterion-pills
                    v-if="filterListInternal != null && filterListInternal.length > 0"
                    :header="header"
                    :filterList="filterListInternal"
                    :clearable="clearable"
                    @unset="unsetFilter"
                ></criterion-pills>
            </slot>

        </EventListener>
        <slot name="filtered" 
            :filter="criterion">
        </slot>
    </span>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import { isEqual, cloneDeep, groupBy } from "lodash";
import { filterFromPredicates, predicateFromSpec, unsetFilter } from "@/utils/filterHelpers";
import CriterionPills from "@/components/criterion/template/CriterionPills";

const EventListener = {
    render(createElement) {
        // The scoped-slot render API avoids including Vue's runtime template compiler.

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
        },

        filterList: Array,
        filterFunction: Function,

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
        clearable: {
            type: Boolean,
            default: true
        }
    },
    components: {
        EventListener,
    },
    data() {
        return {
            filterListInternal: null,
            filterFunctionInternal: null,


            makeFilter: this.filterMaker,
            makePredicate: this.predicateMaker,

            initialFilterDefinitions: [],
            initialFilterDefinitionMap: {},
        };
    },
    created() {

        if (typeof this.filterList !== 'undefined') {
            this.filterListInternal = this.filterList;
        } else if (!!this.value && Array.isArray(this.value)) {
            this.filterListInternal = this.value;
        } else {
            this.filterListInternal = [];
        }

        if (typeof this.filterFunction !== 'undefined') {
            this.filterFunctionInternal = this.filterFunction;
        } else if (!!this.value && typeof this.value === "function") {
            this.filterFunctionInternal = this.value;
        } else {
            this.filterFunctionInternal = (id) => true;
        }

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
                return this.filterFunctionInternal;
            } else if (this.filterType === "list") {
                if (
                    this.filterListInternal != null &&
                    Object.keys(this.initialFilterDefinitionMap).length > 0
                ) {
                    this.filterListInternal = this.filterListInternal.map((el) =>
                        Object.assign(
                            el,
                            this.initialFilterDefinitionMap[el.field][0]
                        )
                    );
                }

                return this.filterListInternal;
            }
        },
        combinedCriterion() {
            return {
                filter: this.criterion,
                filterList: this.filterListInternal,
                filterFunction: this.filterFunctionInternal,
            }
        }
    },
    methods: {
        onInitialFilterDefinition(filterDefinition) {
            this.initialFilterDefinitions.push(filterDefinition);
        },
        filterControlChange(threshold, filterDefinition) {
            // Vue 2 watchers need a new reference to retain distinct old and new filter values.
            let copiedArray = cloneDeep(this.filterListInternal);

            if (
                threshold !== null &&
                !this.filterListInternal
                    .map((filter) => filter.field)
                    .includes(filterDefinition.field)
            ) {
                this.filterListInternal = copiedArray.concat({
                    threshold,
                    ...filterDefinition,
                });
            } else {
                if (filterDefinition.multiple) {
                    if (
                        threshold !== null &&
                        !this.filterListInternal
                            .map((filter) => filter.threshold)
                            .includes(threshold)
                    ) {
                        this.filterListInternal = copiedArray.concat({
                            threshold,
                            ...filterDefinition,
                        });
                    }
                } else if (!filterDefinition.multiple) {
                    this.filterListInternal = copiedArray.map((filter) => {
                        if (filter.field === filterDefinition.field) {
                            const tempFilter = filter;
                            tempFilter.threshold = threshold;
                            return tempFilter;
                        } else {
                            return filter;
                        }
                    });
                }
            }
        },
        unsetFilter(filter) {
            this.filterListInternal = unsetFilter(this.filterListInternal, filter);
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
                    this.filterFunctionInternal = newCriterionValue;
                    if (!isEqual(newCriterionValue, this.filterFunctionInternal)) {
                        this.filterFunctionInternal = newCriterionValue;
                    }
                } else if (this.filterType === "list") {
                    if (!isEqual(newCriterionValue, this.filterListInternal)) {
                        this.filterListInternal = newCriterionValue;
                    }
                }
            },
            deep: true,
        },
        filterList: {
            handler: function(newFilterList) {
                this.filterListInternal = newFilterList;
            },
            deep: true,
        },
        filterFunction: {
            handler: function(newFilterFunction) {
                this.newFilterFunction = newFilterFunction;
            },
            deep: true,
        },
        filterListInternal: {
            handler: function (newfilterListInternal, oldfilterListInternal) {
                this.$emit('update:filter-list', newfilterListInternal)

                if (newfilterListInternal.length > 0) {
                    const predicates = newfilterListInternal.map((predicateSpec) =>
                        this.makePredicate(predicateSpec, {
                            strictCase: this.strictCase,
                            notStrictMatch: this.looseMatch,
                        })
                    );
                    this.filterFunctionInternal = this.makeFilter(
                        predicates,
                        !!this.inclusive
                    );
                } else {
                    this.filterFunctionInternal = function (id) {
                        return true;
                    };
                }

            },
            deep: true,
        },
        filterFunctionInternal: {
            handler: function(filterFunctionInternal) {
                this.$emit('update:filter-function', filterFunctionInternal);
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
