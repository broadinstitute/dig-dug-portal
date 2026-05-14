<template>
    <div class="col" style="padding: 5px 7px 5px 7px">
            <!-- e.g. P-Value (&le;) if using documentation component or override in page; but pValue as default -->
            <slot>{{ field }}</slot>
        <!--
            Go between a select component or a simple text input based on whether or not we have options
            Note how this is separate from whether or not the filter is a multiple; the conditional for that case is irrelevant here.
        -->
        <div>
            <select v-model="filterThreshold" class="form-control"
                @change="updateFilter(filterThreshold)">
                <option :value="null">Any</option>
                <option v-for="item in options" :value="item">
                    {{ item === "-" ? "Unavailable" : labelFormatter(item) }}
                </option>
            </select>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import Autocomplete from "@/components/Autocomplete.vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Formatter from "@/utils/formatters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("filter-enum-any-template", {
    props: {
        value: Object,
        field: String,
        label: String,
        placeholder: String,
        predicate: {
            type: Function,
            default: (string, selection) => selection === null || string === selection,
        },
        labelFormatter: {
            type: Function,
            default: Formatter.capitalizedFormatter,
        },
        options: Array,
        multiple: Boolean,
        inclusive: Boolean,
        color: {
            type: String,
        },
        pillFormatter: {
            type: Function,
            default: (filterDefinition) =>
                `${filterDefinition.field} = ${filterDefinition.threshold}`,
        },
        splitBy: {
            type: String,
            default: "",
        },
        type: {
            type: String,
            // 'string', 'number', 'boolean', 'object', 'function'...
        },
        clear: {
            type: Boolean,
            default: true,
        },
        disabled: Boolean,
        // called "computedField" instead of "computed" to prevent terminology collisions
        computedField: Function,
    },
    components: {
        Autocomplete,
    },
    data() {
        return {
            filterDefinition: {
                field: this.field,
                placeholder: this.placeholder,
                label: this.pillFormatter,
                pillFormatter: this.pillFormatter,
                labelFormatter: this.labelFormatter,
                color: this.color,
                predicate: this.predicate,
                multiple: !!this.multiple || !!this.splitBy ? true : false, // if undefined, default to false
                inclusive: !!this.inclusive || !!this.splitBy ? true : false, // if undefined, default to false. split forces this to work (because a split of multiples is redundant and ambiguous if not inclusive)
                computedField: this.computedField,
            },
            filterThreshold: null, // DONE: is this sensible? to synchronize with the CriterionGroupTemplate we need to push up an event immediately on created... i guess not too bad, just a bit leaky.
        };
    },
    created() {
        // set initial filter value in the widget
        if (!!this.filterThreshold) {
            this.updateFilter(this.filterThreshold);
        }
    },
    mounted() {
        this.$parent.$parent.$emit('filter-mounted', this.filterDefinition);
    },
    methods: {
        updateFilter(newThreshold) {
            // NOTE: Presumes existence of EventListener component in parent, which will be true in the current (09/04/20) implementation of CriterionGroupTemplate
            // TODO: apply checker function here to prevent submission on conditional including blank (to allow positive filters to stay positive, for instance; or membership of options in autocomplete)
            this.$parent.$parent.$emit("change", newThreshold, {
                        // label: this.pillFormatter,
                        // color: this.color,
                        ...this.filterDefinition,
                    });
            
        },
    },
});
</script>
<style scoped>
    .col {
        vertical-align: text-top;
    }
    .format-fix-textfield{
        display: block;
    }
</style>
