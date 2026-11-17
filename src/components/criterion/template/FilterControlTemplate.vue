<template>
    <div class="col" style="padding: 5px 7px 5px 7px">
        <slot>
            {{ field }}
        </slot>
        <autocomplete
            v-if="!!options && Array.isArray(options)"
            :matches="options"
            :labelFormatter="labelFormatter"
            @item-select="updateFilter($event)"
            @input-change="$parent.$emit('input-change', $event)"
            :disabled="disabled"
            :placeholder="placeholder"
        ></autocomplete>
        <b-form-input
            v-else
            v-model="filterThreshold"
            @keydown.enter="updateFilter(filterThreshold)"
            :disabled="disabled"
            :placeholder="placeholder"
        ></b-form-input>
    </div>
</template>

<script>
import Vue from "vue";
import Autocomplete from "@/components/Autocomplete.vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("filter-control-template", {
    props: {
        value: Object,
        field: String,
        placeholder: String,
        predicate: Function,
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
        },
        clear: {
            type: Boolean,
            default: true,
        },
        disabled: Boolean,
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
                multiple: !!this.multiple || !!this.splitBy ? true : false,
                inclusive: !!this.inclusive || !!this.splitBy ? true : false,
                computedField: this.computedField,
            },
            filterThreshold: this.default,
        };
    },
    created() {
        if (!!this.filterThreshold) {
            this.updateFilter(this.filterThreshold);
        }
    },
    mounted() {
        this.$parent.$parent.$emit('filter-mounted', this.filterDefinition);
    },
    methods: {
        validateInput(newInput) {
            if (!!this.type) {
                if (this.type === "number") {
                    return !isNaN(newInput);
                } else if (typeof newInput !== this.type) {
                    return false;
                }
            }
            return true;
        },
        updateFilter(newThreshold) {
            if (newThreshold !== null) {
                const isValid = this.validateInput(newThreshold);
                if (isValid) {
                    if (this.splitBy) {
                        newThreshold.split(",").forEach((thresholdElement) =>
                            this.$parent.$parent.$emit(
                                "change",
                                thresholdElement.trim(),
                                {
                                    ...this.filterDefinition,
                                }
                            )
                        );
                    } else {
                        this.$parent.$parent.$emit("change", newThreshold, {
                            ...this.filterDefinition,
                        });
                    }
                } else {
                    console.warn(
                        "invalid input given for type",
                        this.type,
                        ":",
                        newThreshold
                    );
                }
            }
            if (this.clear) {
                this.filterThreshold = null;
            }
        },
    },
});
</script>
