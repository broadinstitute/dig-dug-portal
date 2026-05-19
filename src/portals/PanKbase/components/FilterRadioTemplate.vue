<template>
    <div class="col" style="padding: 5px 7px 5px 7px">
            <!-- e.g. P-Value (&le;) if using documentation component or override in page; but pValue as default -->
            <slot>{{ field }}</slot>
        <div v-if="!!options && Array.isArray(options)" class="radio-button-wrapper">
            <div v-for="option in options">
                <input type="checkbox" class="form-control-sm"
                        :id="`button_${option}`"
                        name="radioButtons" 
                        :value="option"
                        v-model="filterThreshold"/>
                <label :for="`button_${option}`">
                    {{ option === "-" ? "N/A" : option }}
                    
                </label>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("filter-radio-template", {
    props: {
        value: Object,
        field: String,
        label: String,
        placeholder: String,
        predicate: Function,
        options: Array,
        multiple: Boolean,
        inclusive: Boolean,
        valueCleared: Boolean,
        color: {
            type: String,
        },
        pillFormatter: {
            type: Function,
            default: (filterDefinition) =>
                `${filterDefinition.field} = ${filterDefinition.threshold}`,
        },
        labelFormatter: {
            type: Function,
            default: (id) => id,
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
        presets: Array
    },
    components: {
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
            filterThreshold: this.options, // DONE: is this sensible? to synchronize with the CriterionGroupTemplate we need to push up an event immediately on created... i guess not too bad, just a bit leaky.
        };
    },
    created() {
        if (this.presets.length > 0){
            let preset = this.presets.find(p => p.name === this.field);
            if (preset !== undefined){
                this.filterThreshold = preset.values;
                this.updateFilter(this.filterThreshold);
            }
        }
    },
    mounted() {
        this.$parent.$parent.$emit('filter-mounted', this.filterDefinition);
    },
    methods: {
        updateFilter(newThreshold) {
            // NOTE: Presumes existence of EventListener component in parent, which will be true in the current (09/04/20) implementation of CriterionGroupTemplate
            // TODO: apply checker function here to prevent submission on conditional including blank (to allow positive filters to stay positive, for instance; or membership of options in autocomplete)
            if (newThreshold !== null) {
                // double parent since we're only using this component as a template inside of another component
                        this.$parent.$parent.$emit("change", newThreshold, {
                            // label: this.pillFormatter,
                            // color: this.color,
                            ...this.filterDefinition,
                        });
            }
        },
    },
    watch: {
        filterThreshold(newThreshold){
            this.updateFilter(newThreshold);
        },
        valueCleared(isCleared){
            if (isCleared){
                this.filterThreshold = null;
            }
        }
    }
});
</script>
<style scoped>
    .col {
        vertical-align: text-top;
    }
    .format-fix-textfield{
        display: block;
    }
    .radio-button-wrapper {
        /*display: inline;*/
    }
    input {
        height: inherit !important;
        width: inherit !important;
        margin-right: 10px !important;
    }
    .invisible-button {
        display: none !important;
    }
    label {
        display: inline !important;
    }
</style>
