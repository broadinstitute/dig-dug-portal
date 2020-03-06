<template>
    <div>
        <b-pagination
            v-model="currentPage"
            :total-rows="rows"
            :per-page="perPage"
            aria-controls="variants-table"
        ></b-pagination>
        <b-table
            hover
            :items="variants"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
            :tbody-tr-class="rowClass"
        ></b-table>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("variants-table", {
    props: ["variants"],
    data() {
        return {
            // Note `isActive` is left out and will not appear in the rendered table
            perPage: 25,
            currentPage: 1,
            rows: 500,
            fields: [
                {
                    key: "varId",
                    label: "Variant ID",
                    sortable: false
                },
                {
                    key: "pValue",
                    label: "p-value",
                    sortable: true
                },
                {
                    key: "reference",
                    label: "Ref allele",
                    sortable: true
                },
                {
                    key: "alt",
                    label: "Effect allele",
                    sortable: true
                },
                {
                    key: "beta",
                    label: "Effect",
                    sortable: true
                }
            ]
        };
    },
    methods: {
        rowClass(item, type) {
            if (!item || type !== "row") return;
            if (item.pValue < 2.5e-6) {
                return "variant-table-row high";
            } else {
                return "variant-table-row test";
            }
        }
    }
});
</script>
