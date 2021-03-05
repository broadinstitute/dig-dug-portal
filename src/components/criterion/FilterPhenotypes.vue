<template>
    <filter-control-template
        class="filter-col-md"
        :field="field"
        :placeholder="placeholder"
        :predicate="predicate"
        :pillFormatter="pillFormatter"
        :labelFormatter="labelFormatter"
        :options="selectionOptions"
        @input-change="$emit('input-change', $event)"
        :color="color"
        :multiple="!!multiple"
        :inclusive="!!inclusive || !!multiple"
        :disabled="disabled"
        :computedField="computedField">
        <slot></slot>
    </filter-control-template>
</template>
<script>
import Vue from "vue";
import FilterControlTemplate from "@/components/criterion/template/FilterControlTemplate";

import queryString from "query-string"
import host from "@/utils/hostUtils"
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import { groupBy } from "lodash";

export default Vue.component("filter-phenotypes-control", {
    props: {
        field: String,
        placeholder: String,
        color: String,
        multiple: {
            type: Boolean,
            default: false,
        },
        inclusive: {
            type: Boolean,
            default: false,
        },
        computedField: {
            type: Function,
            default: phenotypeInfo => phenotypeInfo
        },
        predicate: {
            type: Function,
            default: (string, selection) => string === selection.name
        },
        labelFormatter: {
            type: Function,
            default: phenotypeInfo => phenotypeInfo.description,
        },
        pillFormatter: {
            type: Function,
            default: (filterDefinition) => `phenotype = ${filterDefinition.threshold.name}`
        },
        disableSort: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    components: {
        FilterControlTemplate,
    },
    data() {
        return {
            phenotypes: [],
        }
    },
    async created() {
        let qs = queryString.stringify(
            { q: host.subDomain },
            { skipNull: true }
        );
        this.phenotypes = await fetch(
            `${BIO_INDEX_HOST}/api/portal/phenotypes?${qs}`
        ).then(resp => resp.json()
        ).then(json => json.data);
    },
    computed: {
        // phenotypeMap() {
        //     return groupBy(this.phenotypes, 'name');
        // },
        options() {
            // return this.phenotypes.map(phenotype => phenotype.name);
            return this.phenotypes.map(phenotype => phenotype);
        },
        // Make options unique and sorted by default, and always
        // NOTE: Assumes that they are just strings! change?
        selectionOptions() {
            let options = this.options
                .filter((v, i, arr) => arr.indexOf(v) == i)
                .filter((v) => v != undefined);
            if (!this.disableSort) {
                options = options.sort();
            }
            return options;
        },
    },
});
</script>
