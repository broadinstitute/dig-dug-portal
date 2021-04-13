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
        <b-row
            ><b-col class="text-right mb-2">
                <csv-download
                    v-if="tableData.length"
                    :data="tableData"
                    filename="variants"
                ></csv-download
            ></b-col>
        </b-row>
        <div v-show="tableData.length">
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
                <template #cell(consequence)="data">
                    <div class="border-color" :class="data.item.impact">
                        {{ consequenceFormatter(data.item.consequence) }}
                    </div></template
                >
                <template #cell(view)="data">
                    <b-btn
                        v-if="!data.item.consequence"
                        disabled
                        size="sm"
                        class="btn-mini"
                        variant="outline-secondary"
                        >No Data</b-btn
                    >
                    <b-button
                        v-else
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
                            Annotations</span
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
                                :items="
                                    variantData[escapedVarID(row.item.varId)]
                                "
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
                                            data.item.gene_symbol_source ===
                                            'HGNC'
                                        "
                                        :href="`/gene.html?gene=${data.item.gene_symbol}`"
                                        >{{ data.item.gene_symbol }}</a
                                    ><span
                                        v-else-if="
                                            data.item.gene_id &&
                                            data.item.gene_id.indexOf(
                                                'ENSG'
                                            ) !== -1
                                        "
                                        class="external_source"
                                    >
                                        <a
                                            :href="`https://grch37.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=${data.item.gene_id}`"
                                            target="_blank"
                                            >{{ data.item.gene_symbol }}</a
                                        ><b-badge
                                            pill
                                            disabled
                                            class="ml-1"
                                            variant="secondary"
                                            title="Link to external source."
                                            >E</b-badge
                                        ></span
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
                                <template #cell(consequence_terms)="data">
                                    <div
                                        class="border-color"
                                        :class="data.item.impact"
                                    >
                                        <span
                                            v-for="c in data.item
                                                .consequence_terms"
                                            :key="c"
                                            >{{ consequenceFormatter(c) }}</span
                                        >
                                    </div></template
                                >
                            </b-table>
                            <b-pagination
                                v-if="variantData[escapedVarID(row.item.varId)]"
                                v-model="
                                    subCurrentPage[escapedVarID(row.item.varId)]
                                "
                                :total-rows="
                                    variantData[escapedVarID(row.item.varId)]
                                        .length
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
                                variantData[escapedVarID(row.item.varId)]
                                    .length === 0
                            "
                        >
                            <b-alert show variant="warning">
                                No predicted transcript consequences found for
                                this variant.</b-alert
                            >
                        </div>
                    </div>
                </template>
            </b-table>
            <b-pagination
                size="sm"
                v-model="currentPage"
                :total-rows="rows"
                :per-page="perPage"
                aria-controls="my-table"
            ></b-pagination>
        </div>
    </div>
</template>
<script>
import Vue from "vue";
import { match, query } from "@/utils/bioIndexUtils";
import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import Formatters from "@/utils/formatters";
import Documentation from "@/components/Documentation";
import TooltipDocumentation from "@/components/TooltipDocumentation";
import CsvDownload from "@/components/CsvDownload";

export default Vue.component("variant-search", {
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
                    key: "consequence",
                    label: "Consequence",
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

                { key: "view", label: "View VEP Data" },
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
                    tdClass: "border-color",
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
@import url("/css/table.css");
#variant-search thead tr:hover,
#variant-search tr.b-table-details:hover {
    background-color: inherit;
}
.row-pick {
    background-color: lightcyan;
}
.table thead th {
    vertical-align: top;
}
.external_source {
    white-space: nowrap;
}
.external_source .badge {
    vertical-align: middle;
    font-size: 0.5rem;
    cursor: help;
}
.border-color.MODIFIER {
    border-color: rgba(128, 128, 128, 0.822);
}
.border-color.LOW {
    border-color: rgb(3, 165, 30);
}
.border-color.MODERATE {
    border-color: rgb(221, 188, 2);
}
.border-color.HIGH {
    border-color: rgb(180, 2, 2);
}
</style>
