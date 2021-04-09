<template>
    <div id="variant-search">
        <transition name="fade"
            ><b-alert show v-if="selectedGene.length === 0"
                >Please select a gene.</b-alert
            >

            <b-alert show v-else-if="selectedDataset.length === 0"
                >Please select a dataset.</b-alert
            ></transition
        >
        <criterion-list-group
            v-model="searchCriteria"
            :header="'Search Criteria'"
        >
            <filter-enumeration-control
                ref="gene"
                :field="'gene'"
                placeholder="Select a gene ..."
                :options="matchingGenes"
                @input-change="lookupGenes($event)"
            >
                <div class="label">Gene</div>
            </filter-enumeration-control>
            <b-col class="divider"></b-col>
            <filter-enumeration-control
                ref="dataset"
                :field="'dataset'"
                placeholder="Select a dataset ..."
                :options="datasets"
                :multiple="true"
            >
                <div class="label">Dataset</div></filter-enumeration-control
            >
        </criterion-list-group>
        <div class="function text-center mb-4">
            <b-button
                variant="primary"
                @click="searchVariants"
                :disabled="!selectedGene.length || !selectedDataset.length"
                >Search Variants</b-button
            >
        </div>
        <b-table
            hover
            small
            responsive="sm"
            :fields="fields"
            :items="tableData"
            :per-page="perPage"
            :current-page="currentPage"
            ><template #cell(varId)="data">
                <a :href="`/variant.html?variant=${data.item.varId}`">{{
                    data.item.varId
                }}</a> </template
            ><template #cell(dbSNP)="data">
                <a :href="`/variant.html?variant=${data.item.dbSNP}`">{{
                    data.item.dbSNP
                }}</a>
            </template>
            <template #cell(consequence)="data">{{
                consequenceFormatter(data.item.consequence)
            }}</template>
            <template #cell(view)="data">
                <b-button
                    size="sm"
                    variant="outline-primary"
                    class="btn-mini showData"
                    @click="
                        showVariantData(data.item.varId);
                        data.toggleDetails();
                    "
                    ><span v-if="!!loadingData[data.item.varId]"
                        ><b-spinner small></b-spinner>
                        <span class="sr-only">Loading...</span></span
                    ><span v-else>
                        {{ data.detailsShowing ? "Hide" : "Show" }}
                        Variants</span
                    >
                </b-button>
            </template>

            <template #row-details="row">
                <div class="details">
                    <div
                        v-if="
                            variantData[escapedVarID(row.item.varId)] &&
                            variantData[escapedVarID(row.item.varId)].length
                        "
                    >
                        <b-table
                            :items="variantData[escapedVarID(row.item.varId)]"
                            :fields="subFields"
                            :per-page="perPage"
                            :current-page="
                                subCurrentPage[escapedVarID(row.item.varId)]
                            "
                            :tbody-tr-class="rowPickClass"
                            ><template #cell(varId)="data">
                                <a
                                    :href="`/variant.html?variant=${data.item.varId}`"
                                    >{{ data.item.varId }}</a
                                >
                            </template>
                            <template #cell(gene_symbol)="data">
                                <a
                                    v-if="
                                        data.item.gene_symbol_source === 'HGNC'
                                    "
                                    :href="`/gene.html?gene=${data.item.gene_symbol}`"
                                    >{{ data.item.gene_symbol }}</a
                                >
                                <span
                                    v-else
                                    title="There's no data available for this gene."
                                    >{{ data.item.gene_symbol }}</span
                                >
                            </template>
                            <template #cell(position)="data">
                                {{
                                    data.item.protein_start !==
                                    data.item.protein_end
                                        ? `${data.item.protein_start}-${data.item.protein_end}`
                                        : data.item.protein_start
                                }}
                            </template>
                            <template #cell(consequence_terms)="data"
                                ><span
                                    v-for="c in data.item.consequence_terms"
                                    :key="c"
                                    >{{ consequenceFormatter(c) }}</span
                                ></template
                            >
                        </b-table>
                        <b-pagination
                            v-if="variantData[escapedVarID(row.item.varId)]"
                            v-model="
                                subCurrentPage[escapedVarID(row.item.varId)]
                            "
                            :total-rows="
                                variantData[escapedVarID(row.item.varId)].length
                            "
                            :per-page="perPage"
                            size="sm"
                            align="fill"
                            class="sub-details"
                        ></b-pagination>
                    </div>
                    <div
                        v-else-if="
                            variantData[escapedVarID(row.item.varId)] &&
                            variantData[escapedVarID(row.item.varId)].length ===
                                0
                        "
                    >
                        <b-alert show variant="warning">
                            No predicted transcript consequences found for this
                            variant.</b-alert
                        >
                    </div>
                </div>
            </template>
        </b-table>
        <b-pagination
            v-model="currentPage"
            :total-rows="rows"
            :per-page="perPage"
            aria-controls="my-table"
        ></b-pagination>
    </div>
</template>
<script>
import Vue from "vue";
import { match, query } from "@/utils/bioIndexUtils";
import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import testData from "@/views/VariantSearch/data.json";
import Formatters from "@/utils/formatters";
import Documentation from "@/components/Documentation";
import TooltipDocumentation from "@/components/TooltipDocumentation";
import CsvDownload from "@/components/CsvDownload";

export default Vue.component("variant-search", {
    testData,
    components: {
        CriterionListGroup,
        FilterEnumeration,
        Documentation,
        TooltipDocumentation,
        Formatters,
        CsvDownload,
    },
    data() {
        return {
            searchCriteria: [],
            matchingGenes: [],
            perPage: 10,
            currentPage: 1,
            subCurrentPage: {},
            datasets: ["Farhan2019_ALS_eu"],
            variants: [],
            consequences: {},
            fields: [
                {
                    key: "varId",
                    label: "Variant",
                },
                {
                    key: "dbSNP",
                    label: "dbSNP",
                },
                {
                    key: "position",
                    label: "Position",
                },
                {
                    key: "consequence",
                    label: "Consequence",
                },
                {
                    key: "reference",
                    label: "Reference Allele",
                },
                {
                    key: "alt",
                    label: "Effect Allelle",
                },
                {
                    key: "heterozygousCases",
                    label: "Heterozygous Cases",
                },
                {
                    key: "heterozygousControls",
                    label: "Heterozygous Controls",
                },
                {
                    key: "homozygousCases",
                    label: "Homozygous Cases",
                },
                {
                    key: "homozygousControls",
                    label: "Homozygous Controls",
                },
                {
                    key: "alleleCount",
                    label: "Allele Count",
                },
                {
                    key: "alleleCountCases",
                    label: "Allele Count Cases",
                },
                {
                    key: "alleleCountControls",
                    label: "Allele Count Controls",
                },

                { key: "view", label: "View Variants" },
            ],
            subFields: [
                {
                    key: "varId",
                    label: "Variant",
                },
                {
                    key: "gene_symbol",
                    label: "Gene",
                },
                {
                    key: "position",
                    label: "Position",
                },
                {
                    key: "amino_acids",
                    label: "Amino Acids",
                },
                {
                    key: "consequence_terms",
                    label: "Consequence",
                },
                {
                    key: "impact",
                    label: "Impact",
                },
                {
                    key: "polyphen2_hdiv_pred",
                    label: "PolyPhen (HDIV)",
                },
                {
                    key: "polyphen2_hvar_pred",
                    label: "PolyPhen (HVAR)",
                },
                {
                    key: "sift_prediction",
                    label: "SIFT Prediction",
                },
                {
                    key: "lrt_pred",
                    label: "LRT",
                },
                {
                    key: "mutation_taster",
                    label: "Mutation Taster",
                },
                {
                    key: "cadd_raw_rankscore",
                    label: "CADD-Phred Score",
                },
                {
                    key: "gnomad_genomes_popmax_af",
                    label: "gnomAD AF",
                },
            ],
            variantData: {},
            loadingData: {},
        };
    },
    computed: {
        selectedGene() {
            return this.searchCriteria
                .filter((v) => {
                    return v.field === "gene";
                })
                .map((v) => v.threshold);
        },
        selectedDataset() {
            return this.searchCriteria
                .filter((v) => {
                    return v.field === "dataset";
                })
                .map((v) => v.threshold);
        },
        baseFields() {
            let fields = Object.keys(testData[0]);
            return fields.filter((v) => v !== "datasets");
        },
        datasetFields() {
            let data1Fields = testData[0].datasets[0].data;
        },
        tableFields() {
            if (this.selectedDataset.length > 0) {
                return testData.filter((v) => {
                    console.log(v);

                    return this.selectedDataset.every((d) => {
                        console.log("d", d.name);
                        console.log("selected", this.selectedDataset);
                        let ans = this.selectedDataset.includes(d.name);
                        console.log("ans", ans);
                        return ans;
                    });
                });
                //return testData[0].datasets;
            } else return [];
        },
        //This works to display all data fro BI
        tableData() {
            if (this.variants && this.variants.length) {
                return this.variants;
            } else {
                return [];
            }
        },
        rows() {
            if (this.tableData) return this.tableData.length;
        },
    },
    methods: {
        async lookupGenes(input) {
            if (!!input) {
                let matches = await match("gene", input, { limit: 10 });
                this.matchingGenes = matches;
            }
        },
        async searchVariants() {
            // this.$store.dispatch("variants/query", {
            //     q: this.selectedGene,
            // });
            let variants = await query("gene-variants", this.selectedGene);
            //console.log("variants", variants);
            this.variants = variants; //need to add columns from TC
            // if (variants.length) {
            //     for (let i = 0; i < variants.length; i++) {
            //         let data = await this.getTranscriptConsequences(
            //             variants[i].varId
            //         );
            //         //console.log("adding", variants[i].varId);
            //         this.consequences[variants[i].varId] = data;
            //     }
            // } else {
            //     this.variants = [];
            // }
        },
        async getTranscriptConsequences(varID) {
            if (!!varID) {
                let data = await query("transcript-consequences", varID);
                return data;
            }
        },
        consequenceFormatter(consequence) {
            return Formatters.consequenceFormatter(consequence);
        },
        async showVariantData(varID) {
            let escapedVarID = this.escapedVarID(varID);
            console.log("escaped", escapedVarID);
            if (this.variantData[escapedVarID] === undefined) {
                this.loadingData[escapedVarID] = true;
                let tcQuery = await this.getTranscriptConsequences(varID);
                console.log("data back", tcQuery);
                Vue.set(this.variantData, escapedVarID, tcQuery);
                Vue.set(this.subCurrentPage, escapedVarID, 1);
                this.loadingData[escapedVarID] = false;
            }
        },
        escapedVarID(varID) {
            console.log("escaping", varID);
            if (!!varID) return varID.replace(/:\s*/g, "_");
            else {
                return "";
            }
        },
        rowPickClass(item, type) {
            if (!item || type !== "row") return;
            if (item.pick === 1) return "row-pick";
        },
    },
});
</script>
<style>
.row-pick {
    background-color: lightcyan;
}
</style>
