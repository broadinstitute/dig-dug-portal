<template>
    <div>
        <div class="text-right mb-2">
            <csv-download
                :data="variants"
                filename="annotated_regions"
            ></csv-download>
        </div>
        <div v-if="rows > 0">
            <b-table
                hover
                small
                bordered
                responsive="sm"
                :items="variants"
                :per-page="perPage"
                :current-page="currentPage"
            >
            </b-table>
            <b-pagination
                class="pagination-sm justify-content-center"
                v-model="currentPage"
                :total-rows="rows"
                :per-page="perPage"
            ></b-pagination>
        </div>
        <div v-else>
            <h4 v-if="regions.length > 0">No annotated regions</h4>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";

export default Vue.component("clumped-variants-table", {
    props: ["variants"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            fields: [
                {
                    key: "region",
                    label: "Region",
                },
                {
                    key: "annotation",
                    label: "Annotation",
                    formatter: Formatters.annotationFormatter,
                },
                {
                    key: "method",
                    label: "Method",
                    formatter: Formatters.capitalizedFormatter,
                },
                {
                    key: "tissue",
                    label: "Tissue",
                    formatter: Formatters.tissueFormatter,
                },
            ],

            annotations: [],
            methods: [],
            tissues: [],
        };
    },

    computed: {
        rows() {
            return this.variants.length;
        },
    },

    methods: {},
});
</script>
