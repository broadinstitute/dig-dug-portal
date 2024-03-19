<template>
    <div>
        <h4>
            {{ `Global enrichment for ${tissueFormatter(tissue)}` }}
        </h4>
        <documentation
            name="tissue.global-enrichment.subheader"
            :content-fill="$parent.documentationMap"
        ></documentation>
        <b-table
            hover
            small
            responsive="sm"
            :items="tableData[tissue]"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
        >
            <template #cell(phenotype)="r">
                <a v-if="phenotypeMap[r.item.phenotype]"
                    :href="`/phenotype.html?phenotype=${r.item.phenotype}`"
                    >
                    {{ phenotypeFormatter(phenotypeMap[r.item.phenotype]) }}
                </a>
                <span v-else>{{ r.item.phenotype }}</span>
            </template>
            <template #cell(biosample)="r"
                ><b-button
                    v-b-popover.hover="'View biosample'"
                    size="sm"
                    variant="outline-primary"
                    class=""
                    @click="r.toggleDetails()"
                >
                    {{ r.detailsShowing ? "Hide" : "Show" }}
                </b-button></template
            >
            <template #row-details="r">
                <div class="row">
                    <h6>Biosample</h6>
                    <!-- <div v-if="r.item.biosample" class="col-12">
                        <h6>Biosample</h6>
                        <b-table
                            :items="r.item.biosample"
                            :fields="biosampleFields"
                            :per-page="perPage"
                            :current-page="currentPage"
                        >
                        </b-table>
                    </div> -->
                </div></template
            >
        </b-table>
        <b-pagination
            v-model="currentPage"
            :total-rows="totalRows"
            :per-page="perPage"
        >
        </b-pagination>
    </div>
</template>

<script>
import Vue from "vue";
import { query } from "@/utils/bioIndexUtils";
import Formatters from "@/utils/formatters";
export default Vue.component("TissueHeritabilityTable", {
    props: {
        tissue: {
            type: String,
            required: true,
        },
        phenotypeMap: {
            type: Object
        }
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
        totalRows() {
            return this.tableData[this.tissue]?.length || 0;
        },
    },
    mounted() {
        if (this.tissue) {
            query(
                "partitioned-heritability-top-tissue",
                this.tissue.replaceAll("_", " ") + "," + this.ancestry,
                { limit: 1000 }
            ).then((data) => {
                console.log("retrieved data ", data);
                Vue.set(this.tableData, this.tissue, data);
            });
        }
    },
    methods: {
        tissueFormatter: Formatters.tissueFormatter,
        phenotypeFormatter: Formatters.phenotypeFormatter
    },
});
</script>

<style scoped>
.b-popover {
    background-color: #fff;
}
</style>
