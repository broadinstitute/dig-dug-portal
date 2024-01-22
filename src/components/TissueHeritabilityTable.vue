<template>
    <div>
        <h3>Gobal Enrichment</h3>
        <b-table
            hover
            small
            responsive="sm"
            :items="tableData[tissue]"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
        >
            <!-- <template #cell(biosample)="r"
                ><b-button
                    v-b-popover.hover="'View biosample'"
                    size="sm"
                    variant="outline-primary"
                    class=""
                    @click="r.toggleDetails()"
                >
                    View
                </b-button></template
            >
            <template #row-details="r">
                <div class="row">
                    <h4>Biosample</h4>
                    <div v-if="r.item.biosample" class="col-12">
                        <h6>Biosample</h6>
                        <b-table
                            :items="r.item.biosample"
                            :fields="biosampleFields"
                            :per-page="perPage"
                            :current-page="currentPage"
                        >
                        </b-table>
                    </div></div
            ></template> -->
        </b-table>
        <b-pagination
            v-model="currentPage"
            :total-rows="tableData[tissue].length || 0"
            :per-page="perPage"
        >
        </b-pagination>
    </div>
</template>

<script>
import Vue from "vue";
import { query } from "@/utils/bioIndexUtils";
export default Vue.component("TissueHeritabilityTable", {
    props: {
        tissue: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            fields: [
                {
                    key: "phenotype",
                    label: "Phenotype",
                },
                {
                    key: "annotation",
                    label: "Annotation",
                },
                {
                    key: "pValue",
                    label: "P-value",
                },
                {
                    key: "expectedSNPs",
                    label: "Expected SNPs",
                },
                {
                    key: "SNPs",
                    label: "SNPs",
                },
                {
                    key: "biosample",
                    label: "Biosample",
                },
            ],
            tableData: {},
            ancestry: "Mixed",
        };
    },
    computed: {
        // Computed properties go here
    },
    watch: {
        // Watchers go here
    },
    mounted() {
        if (this.tissue) {
            query(
                "partitioned-heritability-tissue",
                this.tissue + "," + this.ancestry,
                { limit: 1000 }
            ).then((data) => {
                console.log("retrieved data ", data);
                Vue.set(this.tableData, this.tissue, data);
            });
        }
    },
    methods: {
        // Methods go here
    },
});
</script>

<style scoped>
/* Component styles go here */
</style>
