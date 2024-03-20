<template>
    <div>
        <h4>
            Global enrichment for {{ tissueFormatter(tissue) }}
             (Ancestry: {{ ancestry === "Mixed" 
                ? "Mixed meta-analysis" 
                : ancestryFormatter(ancestry) }})
        </h4>
        <div class="filtering-ui-wrapper container-fluid">
            <div class="row filtering-ui-content">
                <div class="col filter-col-md">
                    <div class="label">Ancestry</div>
                    <ancestry-selectpicker
                        :defaultMixed="true"
                        :ancestries="
                            $store.state.bioPortal.datasets
                                .map((dataset) => dataset.ancestry)
                        "
                    ></ancestry-selectpicker>
                </div>
            </div>
        </div>
        <documentation
            name="tissue.global-enrichment.subheader"
            :content-fill="$parent.documentationMap"
        ></documentation>
        <b-table
            hover
            small
            responsive="sm"
            :items="tableData[`${tissue},${ancestry}`]"
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
                    @click="
                        toToggle(r, 1, r.detailsShowing)
                            ? r.toggleDetails()
                            : ''
                    "
                >
                    {{ r.detailsShowing && r.item.showButton === 1 
                        ? "Hide" 
                        : "Show" 
                    }}
                </b-button></template
            >
            <template #cell(tissue)="r">
                <b-button
                    v-b-popover.hover="'View evidence'"
                    size="sm"
                    variant="outline-primary"
                    class=""
                    @click="
                        toToggle(r, 2, r.detailsShowing)
                            ? r.toggleDetails()
                            : ''
                    "
                >
                    {{
                        r.detailsShowing && r.item.showButton === 2
                            ? "Hide"
                            : "Show"
                    }}
                </b-button>
            </template>
            <template #row-details="r">
                <div v-if="r.item.showButton === 1" class="row">
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
                </div>
                <div v-else-if="r.item.showButton === 2" class="row">
                    <div class="col-12" 
                    >
                        <b-table
                            :items="getSubTableData(r.item)"
                            :fields="subTableFields"
                            :per-page="perPage"
                            :current-page="r.item.currentPage"
                        >
                        </b-table>

                    </div>
                </div>
            </template>
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
import AncestrySelectpicker from "@/components/AncestrySelectPicker.vue";
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
                    key: "ancestry",
                    label: "Ancestry",
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
                {
                    key: "tissue",
                    label: "Evidence"
                }
            ],
            subTableFields: [
            {
                    key: "phenotype",
                    label: "Phenotype",
                },
                {
                    key: "annotation",
                    label: "Annotation",
                },
                {
                    key: "ancestry",
                    label: "Ancestry",
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
                {
                    key: "enrichment",
                    label: "Enrichment"
                }
            ],
            tableData: {},
            subTableData: {},
            ancestry: "Mixed"
        };
    },
    computed: {
        totalRows() {
            return this.tableData[`${this.tissue},${this.ancestry}`]?.length || 0;
        },
    },
    mounted() {
        this.queryHeritability();
        let ancestries = this.$store.state.bioPortal.datasets
            .map(dataset => dataset.ancestry);
        console.log(ancestries);
    },
    methods: {
        tissueFormatter: Formatters.tissueFormatter,
        phenotypeFormatter: Formatters.phenotypeFormatter,
        ancestryFormatter: Formatters.ancestryFormatter,
        queryHeritability(){
            let queryString = `${this.tissue.replaceAll("_", " ")},${this.ancestry}`;
            if (this.tissue && !this.tableData[queryString]) {
                query(
                    "partitioned-heritability-top-tissue", 
                    queryString,
                    { limit: 1000 }
                ).then((data) => {
                    Vue.set(this.tableData, queryString, data);
                });
            }
        },
        async queryPartitionedHeritability(item){
            let queryString = `${item.phenotype},${this.ancestry},${item.annotation},${this.tissue.replaceAll("_", " ")}`;
            console.log(queryString);
            if (!this.subTableData[queryString]){
                let data = await query(
                    "partitioned-heritability-tissue",
                    queryString,
                    { limit: 1000}
                );
                Vue.set(this.subTableData, queryString, data);
                
            }
        },
        toToggle(row, buttonClicked, isShowing) {
            if (isShowing) {
                if (buttonClicked === row.item.showButton) return true;
                else {
                    if (buttonClicked === 1) {
                        Vue.set(row.item, "showButton", 1);
                    } else if (buttonClicked === 2) {
                        this.queryPartitionedHeritability(row.item);
                        Vue.set(row.item, "showButton", 2);
                    }
                }
                Vue.set(row.item, "currentPage", 1);
                return false;
            } else {
                if (buttonClicked === 1) {
                    Vue.set(row.item, "showButton", 1);
                } else if (buttonClicked === 2) {
                    this.queryPartitionedHeritability(row.item);
                    Vue.set(row.item, "showButton", 2);
                }
                Vue.set(row.item, "currentPage", 1);
                return true;
            }
        },
        getSubTableData(item){
            let query = `${item.phenotype},${this.ancestry},${item.annotation},${this.tissue.replaceAll("_", " ")}`;
            console.log(query);
            console.log(this.subTableData[query]);
            return this.subTableData[query];
        }
    },
    watch: {
        "$store.state.selectedAncestry"(ancestry){
            this.ancestry = ancestry === "" ? "Mixed" : ancestry;
            this.queryHeritability();
        }
    }
});
</script>

<style scoped>
.b-popover {
    background-color: #fff;
}
</style>
