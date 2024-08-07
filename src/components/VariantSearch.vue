<template>
    <div id="variant-search">
        <b-row>
            <b-col cols="9">
                <div v-show="tableData.length" class="legends">
                    <strong class="mr-2">Impact:</strong>
                    <b-btn
                        disabled
                        variant="outline-danger"
                        size="sm"
                        class="mr-1 btn-mini"
                        >HIGH</b-btn
                    >
                    <b-btn
                        disabled
                        variant="outline-warning"
                        size="sm"
                        class="mr-1 btn-mini"
                        >MODERATE</b-btn
                    >
                    <b-btn
                        disabled
                        variant="outline-success"
                        size="sm"
                        class="mr-1 btn-mini"
                        >LOW</b-btn
                    >
                    <b-btn
                        disabled
                        variant="outline-secondary"
                        size="sm"
                        class="btn-mini"
                        >MODIFIER</b-btn
                    >
                    <b-form-checkbox
                        v-model="sortByImpacts"
                        name="sort-impacts"
                        switch
                        inline
                        size="sm"
                        class="ml-3"
                    >
                        Rank by Impact
                    </b-form-checkbox>
                </div>
            </b-col>
            <b-col class="text-right mb-2">
                <b-btn
                    class="btn btn-secondary btn-sm"
                    @click="showHideElement('filter_pop_up')"
                    >Filter Results</b-btn
                >
            </b-col>
            <b-col class="text-right mb-2">
                <data-download
                    v-if="tableData.length"
                    :data="tableData"
                    filename="variants"
                ></data-download
            ></b-col>
        </b-row>
        <b-row>
            <b-col>
                <div id="filter_pop_up_example">
                    <div id="filter_pop_up" class="hidden">
                        <div>
                            <h4 style="text-align: center; margin-bottom: 20px">
                                Filter variants
                            </h4>
                            <form>
                                <fieldset>
                                    <h6>Select impact</h6>
                                    <div
                                        style="
                                            padding-left: 15px;
                                            margin-bottom: 15px;
                                        "
                                    >
                                        <template
                                            v-for="(key, value) in disablebtn"
                                        >
                                            <b-form-checkbox
                                                :key="key + value"
                                                v-model="filters['impacts']"
                                                name="impact"
                                                :disabled="key"
                                                :value="value"
                                                inline
                                                ><b-btn
                                                    disabled
                                                    :variant="
                                                        disablebtnstyle[value]
                                                    "
                                                    size="sm"
                                                    class="mr-1 btn-mini"
                                                    >{{ value }}</b-btn
                                                >
                                            </b-form-checkbox>
                                        </template>
                                    </div>
                                    <!-- <div>
                                        <h6>Select phenotypes</h6>
                                        <b-btn
                                            class="btn btn-secondary btn-sm"
                                            @click="
                                                filters['phenotypes'] =
                                                    phenotypes
                                            "
                                            >Select All</b-btn
                                        >&nbsp;
                                        <b-btn
                                            class="btn btn-secondary btn-sm"
                                            @click="filters['phenotypes'] = []"
                                            >Unselect All</b-btn
                                        >
                                    </div> 

                                    <div style="padding-left: 15px">
                                        <template
                                            v-for="(key, value) in HPOTerms"
                                        >
                                            <b-form-checkbox
                                                :key="key"
                                                v-model="filters['phenotypes']"
                                                name="phenotypes"
                                                :value="value"
                                                >{{ key }}</b-form-checkbox
                                            >
                                        </template>
                                    </div>-->
                                </fieldset>
                            </form>
                        </div>
                        <div style="text-align: center; margin-top: 25px">
                            <b-btn
                                class="btn btn-warning btn-sm"
                                style="margin-right: 5px"
                                @click="showHideElement('filter_pop_up')"
                                >Cancel</b-btn
                            >
                            <b-btn
                                class="btn btn-success btn-sm"
                                :disabled="
                                    !filters['phenotypes'].length ||
                                    !filters['impacts'].length
                                "
                                @click="
                                    addfilter();
                                    showHideElement('filter_pop_up');
                                "
                                >Apply filter</b-btn
                            >
                        </div>
                    </div>
                </div>
            </b-col>
        </b-row>
        <div v-show="tableData.length">
            <b-table
                hover
                small
                sort-icon-left
                responsive="sm"
                :fields="fields"
                :items="tableData"
                :per-page="perPage"
                :current-page="currentPage"
                ><template #thead-top="data">
                    <b-tr>
                        <b-th colspan="3"
                            ><span class="sr-only"
                                >Variant, dbSNP, Consequence</span
                            ></b-th
                        >
                        <b-th
                            colspan="3"
                            class="text-center"
                            variant="secondary"
                            >Allele</b-th
                        >
                        <b-th><span class="sr-only">Max AF</span></b-th>
                        <b-th
                            colspan="2"
                            class="text-center"
                            variant="secondary"
                            >Heterozygous</b-th
                        >
                        <b-th
                            colspan="2"
                            class="text-center"
                            variant="secondary"
                            style="border-left: 1px solid #dee2e6"
                            >Homozygous</b-th
                        >
                        <b-th><span class="sr-only">View VEP Data</span></b-th>
                    </b-tr>
                </template>
                <template #cell(varId)="data">
                    <a :href="`/variant.html?variant=${data.item.varId}`">{{
                        data.item.varId
                    }}</a> </template
                ><template #cell(dbSNP)="data">
                    <a :href="`/variant.html?variant=${data.item.dbSNP}`">{{
                        data.item.dbSNP
                    }}</a>
                </template>
                <template #cell(max_consequence)="data">
                    <div
                        v-if="data.item.Max_Impact"
                        class="border-color"
                        :class="data.item.Max_Impact"
                    >
                    {{data.item.max_consequence.substring(1, data.item.max_consequence.length-1)}}
                    <!--    <span v-for="(c, i) in data.item.max_consequence"
                            :key="c">
                            {{ consequenceFormatter(c)}}{{i < data.item.max_consequence.length - 1 ? ", " : "" }}
                        </span> -->
                    </div>
                    <div v-else class="border-color NONE"></div>
                </template>
                
                
                <!-- <template #cell(consequence)="data">
                    <div class="border-color" :class="data.item.impact">
                        {{ consequenceFormatter(data.item.consequence) }}
                    </div></template
                > -->
                <template #cell(view)="data">
                    <b-btn
                        v-if="!data.item.consequence"
                        disabled
                        size="sm"
                        class="btn-mini"
                        variant="outline-secondary"
                        >No Annotation</b-btn
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
                                :tbody-tr-class="rowPickClass"
                                ><template #cell(varId)="data">
                                    <a
                                        :href="`/variant.html?variant=${data.item.varId}`"
                                        >{{ data.item.varId }}</a
                                    >
                                </template>
                                <template #head(transcriptId)="data">
                                    <span class="external_source"
                                        >Feature
                                    </span>
                                </template>
                                <template #cell(transcriptId)="data">
                                    <a
                                        v-if="data.item.transcriptId"
                                        :href="`https://grch37.ensembl.org/Homo_sapiens/Transcript/Summary?db=core;t=${data.item.transcriptId}`"
                                        target="_blank"
                                        rel="noopener noreferrer nofollow"
                                        >{{ data.item.transcriptId }}</a
                                    >
                                </template>

                                <template #cell(position)="data">
                                    {{
                                        data.item.proteinStart !==
                                        data.item.proteinEnd
                                            ? `${data.item.proteinStart}-${data.item.proteinEnd}`
                                            : data.item.proteinStart
                                    }}
                                </template>
                                <template #cell(consequenceTerms)="data">
                                    <div
                                        class="border-color"
                                        :class="data.item.impact"
                                    >
                                        <span
                                            v-for="(c, i) in data.item
                                                .consequenceTerms"
                                            :key="c"
                                            >{{ consequenceFormatter(c)
                                            }}{{
                                                i <
                                                data.item.consequenceTerms
                                                    .length -
                                                    1
                                                    ? ", "
                                                    : ""
                                            }}</span
                                        >
                                    </div></template
                                >
                                <template #cell(siftPrediction)="data">
                                    {{
                                        siftFormatter(data.item.siftPrediction)
                                    }}
                                </template>
                            </b-table>
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
                v-model="currentPage"
                size="sm"
                :total-rows="rows"
                :per-page="perPage"
                aria-controls="my-table"
            ></b-pagination>
        </div>
    </div>
</template>
<script>
import Vue from "vue";
import { query } from "@/utils/bioIndexUtils";
import Formatters from "@/utils/formatters";
import DataDownload from "@/components/DataDownload";
import uiUtils from "@/utils/uiUtils";

export default Vue.component("VariantSearch", {
    components: {
        DataDownload,
    },
    props: {
        gene: [String, Array],
    },
    data() {
        return {
            applyfilter: false,
            disablebtn: {
                HIGH: true,
                MODERATE: true,
                LOW: true,
                MODIFIER: true,
            },
            disablebtnstyle: {
                HIGH: "outline-danger",
                MODERATE: "outline-warning",
                LOW: "outline-success",
                MODIFIER: "outline-secondary",
            },
            filters: {
                impacts: ["HIGH", "MODERATE", "LOW"],
                phenotypes: [
                    "AllSamples",
                    "Resistant",
                    "AdultResistant",
                    "PediatricResistant",
                    "Sensitive",
                    "AdultSensitive",
                    "PediatricSensitive",
                    "Uncategorized",
                    "AdultUncategorized",
                    "PediatricUncategorized",
                ],
            },
            perPage: 10,
            currentPage: 1,

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
                    key: "max_consequence",
                    label: "Consequence",
                    tdClass: "border-color",
                },
                /*{
                    key: "consequence",
                    label: "Consequence",
                },*/

                {
                    key: "alleleCountCases",
                    label: "Cases",
                    sortable: true,
                },
                {
                    key: "alleleCountControls",
                    label: "Controls",
                    sortable: true,
                },
                {
                    key: "alleleCount",
                    label: "Count",
                    sortable: true,
                },
                {
                    key: "maf",
                    label: "Max AF",
                    sortable: true,
                    thStyle: "min-width: 120px;",
                },
                {
                    key: "heterozygousCases",
                    label: "Cases",
                    sortable: true,
                },
                {
                    key: "heterozygousControls",
                    label: "Controls",
                    sortable: true,
                },
                {
                    key: "homozygousCases",
                    label: "Cases",
                    sortable: true,
                },
                {
                    key: "homozygousControls",
                    label: "Controls",
                    sortable: true,
                },

                {
                    key: "view",
                    label: "View VEP Data",
                    class: "nowrap",
                },
            ],
            subFields: [
                {
                    key: "transcriptId",
                    label: "Feature",
                },
                {
                    key: "position",
                    label: "Position",
                },
                {
                    key: "aminoAcids",
                    label: "Amino Acids",
                },
                {
                    key: "consequenceTerms",
                    label: "Consequence",
                    tdClass: "border-color",
                },
                {
                    key: "hgncId",
                    label: "HGNC",
                },
                {
                    key: "hgvsc",
                    label: "HGVSc",
                },
                {
                    key: "hgvsp",
                    label: "HGVSp",
                },
                {
                    key: "polyphen2HdivPred",
                    label: "PolyPhen (HDIV)",
                },
                {
                    key: "polyphen2HvarPred",
                    label: "PolyPhen (HVAR)",
                },
                {
                    key: "siftPrediction",
                    label: "SIFT Prediction",
                },
                {
                    key: "lrtPred",
                    label: "LRT",
                },
                {
                    key: "mutationTaster",
                    label: "Mutation Taster",
                },
                {
                    key: "caddRawRankscore",
                    label: "CADD-Phred Score",
                },
                {
                    key: "gnomadGenomesPopmaxAf",
                    label: "gnomAD AF",
                },
            ],
            variantData: {},
            loadingData: {},
            sortByImpacts: false,
        };
    },
    // created() {
    //     if (this.gene) {
    //         this.searchVariants();
    //     }
    // },
    computed: {
        //This works to display all data fro BI
        tableData() {
            if (this.sortByImpacts && this.variantData.length) {
                let sortedVariants = structuredClone(this.variantData);
                //console.log("sortedVariants", sortedVariants);
                return sortedVariants.sort((a, b) => {
                    return this.sortImpacts(a, b);
                });
            } else return this.variantData || [];

            /*if (this.variants && this.variants.length) {
                return this.variants;
            } else {
                return [];
            }*/
        },
        rows() {
            if (this.tableData) return this.tableData.length;
        },
    },
    watch: {
        gene: {
            handler(val) {
                if (val) this.searchVariants();
            },
            immediate: true,
        },
    },
    methods: {
        ...uiUtils,
        showHideElement(ELEMENT) {
            uiUtils.showHideElement(ELEMENT);
        },
        selectAllElements(name, flag) {
            //alert(name);
            const allcheckbox = document.getElementsByName(name);
            //alert(allcheckbox.length);
            for (let c in allcheckbox) {
                if (parseInt(c) >= 0) {
                    if (flag) {
                        allcheckbox[c].checked = true;
                    } else {
                        allcheckbox[c].checked = false;
                    }
                }
            }
        },
        async searchVariants() {
            this.currentPage = 1; //reset on new search
            this.variants = await query("gene-variants", this.gene);
            if (this.variants && this.variants.length) {
                //this.variantData = structuredClone(this.variants); //copy data

                //add showButton property to each variant
                /*this.variantData.map((variant) => {
                    variant.showButton = 0;
                });*/

                for (let i = 0; i < this.variants.length; i++) {
                    if (this.variants[i].gnomAD_info) {
                        this.variants[i].gnomAD_exomes_AC =
                            this.variants[i].gnomAD_info.gnomADg_AC;
                        this.variants[i].gnomAD_exomes_AN =
                            this.variants[i].gnomAD_info.gnomADg_AN;
                        this.variants[i].gnomAD_exomes_AF =
                            this.variants[i].gnomAD_info.gnomADg_AF;
                        //alert("gnomAD_exomes_AC"+this.variants[i].gnomAD_exomes_AC);
                    }

                    //do we need vep count?
                    //this.variants[i].vep = this.variants[i].veprecords.length;
                    if (this.variants[i].vepRecords.length > 0) {
                        let varrecords = this.variants[i].vepRecords;

                        for (let j = 0; j < varrecords.length; j++) {
                            //console.log("pick:"+varrecords[j].pick);
                            if (varrecords[j].pick == "1") {
                                //console.log("var:"+varrecords[j].consequenceTerms);
                                this.variants[i].Gene_Symbol =
                                    varrecords[j].Gene_Symbol;
                                this.variants[i].Max_Impact =
                                    varrecords[j].impact;
                                if (this.variants[i].Max_Impact == "LOWEST") {
                                    this.variants[i].Max_Impact = "MODIFIER";
                                }

                                this.variants[i].max_consequence =
                                    varrecords[j].consequenceTerms;

                                this.variants[i].Protein_Position =
                                    varrecords[j].Protein_position;
                                this.variants[i].Amino_Acids =
                                    varrecords[j].Amino_acids;

                                this.disablebtn[
                                    this.variants[i].Max_Impact
                                ] = false;

                                this.variants[i].HGVSc = varrecords[j].HGVSc;
                                this.variants[i].HGVSp = varrecords[j].HGVSp;
                            }
                        }
                        //Max_Impact	Biotype Gene_Symbol	Transcript_count	Amino_Acids	Protein_Position	CDS_position	Refgene	max_consequence
                    }
                }
                
                this.variantData = structuredClone(this.variants);
                //if default filters are set, filter the variants
                if (this.filters.impacts.length > 0 || this.filters.phenotypes.length > 0) {
                    this.addfilter();
                }
            }
        },
        addfilter() {
            let dataRows = this.variants;
            if (this.filters["impacts"].length > 0) {
                dataRows = dataRows.filter((item) =>
                    this.filters["impacts"].includes(item.Max_Impact)
                );
            }
            /*if (this.filters["phenotypes"].length > 0) {
                for (let i = 0; i < dataRows.length; i++) {
                    dataRows[i].hpdisplay = dataRows[i].hpdisplay2;
                    dataRows[i].hpdisplay = dataRows[i].hpdisplay.filter((v) =>
                        this.filters["phenotypes"].includes(v.hp)
                    );
                }
            } else {
                for (let i = 0; i < dataRows.length; i++) {
                    dataRows[i].hpdisplay = dataRows[i].hpdisplay2;
                }
            } */
            this.variantData = dataRows;
        },
        async getTranscriptConsequences(varID) {
            if (varID) {
                let data = await query("transcript-consequences", varID);
                return data;
            }
        },
        consequenceFormatter(consequence) {
            if (consequence) {
                let trim = consequence
                    .replace("_prime_", "' ")
                    .replace("_variant", "");
                return Formatters.snakeFormatter(trim);
            }
            return;
        },
        siftFormatter(name) {
            return Formatters.snakeFormatter(name);
        },
        async showVariantData(varID) {
            let escapedVarID = this.escapedVarID(varID);

            if (this.variantData[escapedVarID] === undefined) {
                this.loadingData[escapedVarID] = true;
                let tcQuery = await this.getTranscriptConsequences(varID);
                Vue.set(this.variantData, escapedVarID, tcQuery);
                this.loadingData[escapedVarID] = false;
            }
        },
        escapedVarID(varID) {
            if (varID) return varID.replace(/:\s*/g, "_");
            else {
                return "";
            }
        },
        rowPickClass(item, type) {
            if (!item || type !== "row") return;
            if (item.pick === 1) return "row-pick";
        },
        sort(s) {
            //if s == current sort, reverse
            //console.log("sort", this.currentSort);
            if (s === this.currentSort) {
                this.currentSortDir =
                    this.currentSortDir === "asc" ? "desc" : "asc";
            }
            this.currentSort = s;
        },
        //function to sort variants by impact severity
        sortImpacts(a, b) {
            let impactOrder = ["HIGH", "MODERATE", "LOW", "MODIFIER", "LOWEST"];
            let aImpact = a.Max_Impact;
            let bImpact = b.Max_Impact;
            let aIndex = impactOrder.indexOf(aImpact);
            let bIndex = impactOrder.indexOf(bImpact);
            if (aIndex < bIndex) {
                return -1;
            } else if (aIndex > bIndex) {
                return 1;
            }
            return 0;
        },
        format_hgvsc(hgvsc) {
            return hgvsc?.split(":")[1] || "";
        },
        format_hgvsp(hgvsp) {
            return hgvsp?.split(":")[1].replace("%3D", "=") || "";
        },
        format_freq(frequency) {
            return frequency?.toFixed(5) || "";
        },
    },
});
</script>
<style>
@import url("/css/table.css");

#filter_pop_up {
    position: fixed;
    width: 40%;
    height: 50%;
    overflow: auto;
    margin-left: -5px;
    top: 200px;
    background-color: #fff;
    border: solid 1px #ddd;
    border-radius: 5px;
    padding: 25px 15px;
    left: 25%;
    top: 25%;
    box-shadow: 0px 7px 5px 5px rgba(100, 100, 100, 0.35);
    z-index: 10;
    font-size: 14px;
}
</style>
