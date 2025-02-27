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
                                    <div>
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
                                    </div>
                                    <div>
                                        <h6>Select gnomAD Frequency</h6>
                                        <b-form-select v-model="selected" :options="gnomADoptions"></b-form-select>
                                        <b-input type="number" name="gnomAD_filter" class="form-control" />
                                        
                                    </div>
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
                responsive="sm"
                :fields="fields"
                :items="tableData"
                :per-page="perPage"
                :current-page="currentPage"
                ><template #thead-top="data">
                    <b-tr>
                        <b-th colspan="4"
                            ><span class="sr-only"
                                >Variant, Consequence, Protein Position, Amino
                                Acids</span
                            ></b-th
                        >
                        <b-th colspan="2" class="text-center" variant="primary"
                            >RADIANT Allele</b-th
                        >

                        <b-th
                            v-b-tooltip.hover
                            colspan="1"
                            class="text-center"
                            variant="secondary"
                            style="border-left: 1px solid #dee2e6"
                            title="gnomAD exomes r2.0.1"
                            >gnomAD Allele</b-th
                        >
                        <b-th colspan="1"
                            ><span class="sr-only">View VEP Data</span></b-th
                        >
                    </b-tr>
                </template>
                <template #cell(varId)="data">
                    <a :href="`/variant.html?variant=${data.item.varId}`">{{
                        data.item.varId
                    }}</a> </template
                >
                <template #cell(dbSNP)="data">
                    <a :href="`/variant.html?variant=${data.item.dbSNP}`">{{
                        data.item.dbSNP
                    }}</a>
                </template>
                <template #cell(alleleCount)="data">
                    <div align="left">{{ data.item.alleleCount }}</div>
                </template>
                <template #cell(allelNumber)="data">
                    <div align="left">{{ data.item.allelNumber }}</div>
                </template>
                <template #cell(alleleFrequency)="data">
                    <div align="left">
                        {{ formatAlleleFrequency(data.item.alleleFrequency) }}
                    </div>
                </template>
                <template #cell(homozygousCount)="data">
                    <div align="left">{{ data.item.homozygousCount}}</div>
                </template>
                <template #cell(gnomAD_exomes_AC)="row">
                    <div align="right">
                        {{ row.item.gnomAD_exomes_AC }}
                    </div>
                </template>
                <template #cell(gnomAD_exomes_AN)="row">
                    <div align="right">
                        {{ row.item.gnomAD_exomes_AN }}
                    </div>
                </template>
                <template #cell(gnomAD_exomes_AF)="row">
                    <div align="left">
                        {{ format_freq(row.item.gnomAD_exomes_AF) }}
                    </div>
                </template>
                <template #cell(max_consequence)="data">
                    <div
                        v-if="data.item.Max_Impact"
                        class="border-color"
                        :class="data.item.Max_Impact"
                    >
                        {{ consequenceFormatter(data.item.max_consequence) }}
                    </div>
                    <div v-else class="border-color NONE"></div>
                </template>
                <template #cell(HGVSc)="data">
                    {{ format_hgvsc(data.item.HGVSc) }}</template
                >
                <template #cell(HGVSp)="data">
                    {{ format_hgvsp(data.item.HGVSp) }}
                </template>

                <template #cell(view)="data">
                    <b-btn
                        size="sm"
                        class="btn-mini mr-2"
                        variant="outline-primary"
                        @click="toToggle(data, 1)"
                    >
                        {{
                            data.detailsShowing && data.item.showButton === 1
                                ? "Hide"
                                : "Show"
                        }}
                        Phenotypes</b-btn
                    >
                    <b-btn
                        v-if="data.item.vepRecords.length === 0"
                        disabled
                        size="sm"
                        class="btn-mini"
                        variant="outline-secondary"
                        >No Annotation</b-btn
                    >
                    <b-btn
                        v-else
                        size="sm"
                        variant="outline-primary"
                        class="btn-mini showData"
                        @click="
                            //showVariantData(data.item.varid);
                            toToggle(data, 2)
                        "
                        ><span v-if="!!loadingData[data.item.varId]"
                            ><b-spinner small></b-spinner>
                            <span class="sr-only">Loading...</span></span
                        ><span v-else>
                            {{
                                data.detailsShowing &&
                                data.item.showButton === 2
                                    ? "Hide"
                                    : "Show"
                            }}
                            Annotations</span
                        >
                    </b-btn>
                </template>

                <template #row-details="row">
                    <div class="details">
                        <div v-if="row.item.showButton === 1" class="row">
                            <b-table
                                :items="row.item.hpdisplay"
                                :fields="hprecordFields"
                                :per-page="perPagephenotype"
                                :tbody-tr-class="rowPickClass"
                            >
                                <template #cell(alleleCountCases)="row">
                                    <div align="left">
                                        {{ row.item.alleleCountCases }}
                                    </div>
                                </template>
                                <template #cell(alleleNumber)="row">
                                    <div align="right">
                                        {{ row.item.alleleNumber }}
                                    </div>
                                </template>
                                <template #cell(alleleFrequency)="row">
                                    <div align="right">
                                        {{
                                            formatAlleleFrequency(
                                                row.item.alleleFrequency
                                            )
                                        }}
                                    </div>
                                </template>
                                <template #cell(homozygousCases)="row">
                                    <div align="right">
                                        {{ row.item.homozygousCases }}
                                    </div>
                                </template>
                            </b-table>
                        </div>

                        <div v-if="row.item.showButton === 2" class="row">
                            <b-table
                                v-if="row.item.vepRecords.length > 0"
                                :items="row.item.vepRecords"
                                :fields="subFields"
                                :per-page="perPage"
                                :tbody-tr-class="rowPickClass"
                                ><template #cell(varId)="data">
                                    <a
                                        :href="`/variant.html?variant=${data.item.varId}`"
                                        >{{ data.item.varId }}</a
                                    >
                                </template>
                                <template #head(Feature)="data">
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
                                <template #cell(consequence)="data">
                                    <div
                                        class="border-color"
                                        :class="data.item.impact"
                                    >
                                        <span>{{
                                            consequenceFormatter(
                                                data.item.consequence
                                            )
                                        }}</span>
                                    </div></template
                                >
                                <template #cell(hgvsc)="data">
                                    {{
                                        format_hgvsc(data.item.hgvsc)
                                    }}</template
                                >
                                <template #cell(hgvsp)="data">
                                    {{ format_hgvsp(data.item.hgvsp) }}
                                </template>
                                <template #cell(siftPrediction)="data">
                                    {{
                                        siftFormatter(data.item.siftPrediction)
                                    }}
                                </template>
                            </b-table>
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
import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import Formatters from "@/utils/formatters";
import Documentation from "@/components/Documentation";
import TooltipDocumentation from "@/components/TooltipDocumentation";
import DataDownload from "@/components/DataDownload";
import uiUtils from "@/utils/uiUtils";

export default Vue.component("VariantSearch", {
    components: {
        CriterionListGroup,
        FilterEnumeration,
        Documentation,
        TooltipDocumentation,
        Formatters,
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
            gnomADoptions: [
                { value: 0, text: "=" },
                { value: 1, text: ">" },
                { value: -1, text: "<" },
            ],
            HPOTerms: {
                "Antibody_negative":"Antibody Negative Insulin Deficient (abr. ANID)",
                "Lipodystrophic":"Lipodystrophic",
                "Non_obese_insulin_insufficient_DM":"Non-Obese Inulin Insufficient (abr. NOII)",
                "Possible_monogenic":"Possible Monogenic or Oligogenic (abr. PMO)",
                "Non_progressive":"Non-Progressive",
                "Syndromic":"Syndromic",
                "Very_low_insulin_requirements":"Very Low Insulin Requirements (abr. VLIR)",
                "A_B__ketosis_prone":"Antibody Negative Beta Cell Negative Ketosis-Prone DM (abr. A (-) B (-) KPDM)",
                "A_B__ketosis_prone_1":"Antibody Negative Beta Cell Positive Ketosis-Prone DM (abr. A (-) B (+) KPDM)",
                "Severe_insulin_resistance":"Severe Insulin Resistance (SIR)",
                "Beta_Cell_Dysfunction":"Beta Cell Dysfunction",
                "IGF1R_variant":"IGF1R",
                "INS_variant":"INS",
                "NFKB1_variant":"NFKB1",
                "PAX6_variant":"PAX6",
                "PTPMT1_variant":"PTPMT1",
                "SMAD5_variant":"SMAD5",
                "INSR_variant":"INSR",
                "LMNTD2_variant":"LMNTD2",
                "SLIT2_ROBO1_variant":"SLIT2 or ROB1",
                "CERS2_variant":"CERS2",
                "IDH2_variant":"IDH2",
                "IRS2_Haploinsufficiency_variant":"IRS2 Haploinsufficiency",
                "EIF2S1_variant":"EIF2S1",
                "mTor_Pathway":"Mammalian Target of Rapamycin Pathway (abr. mTOR pathway)",
                "GLUT4_variant":"GLUT4",
            },
            filters: {
                impacts: ["HIGH", "MODERATE", "LOW"],
                phenotypes: [
                    "Antibody Negative Insulin Deficient (abr. ANID)",
                    "Lipodystrophic",
                    "Non-Obese Inulin Insufficient (abr. NOII)",
                    "Possible Monogenic or Oligogenic (abr. PMO)",
                    "Non-Progressive",
                    "Syndromic",
                    "Very Low Insulin Requirements (abr. VLIR)",
                    "Antibody Negative Beta Cell Negative Ketosis-Prone DM (abr. A (-) B (-) KPDM)",
                    "Antibody Negative Beta Cell Positive Ketosis-Prone DM (abr. A (-) B (+) KPDM)",
                    "Severe Insulin Resistance (SIR)",
                    "Beta Cell Dysfunction",
                    "IGF1R",
                    "INS",
                    "NFKB1",
                    "PAX6",
                    "PTPMT1",
                    "SMAD5",
                    "INSR",
                    "LMNTD2",
                    "SLIT2 or ROB1",
                    "CERS2",
                    "IDH2",
                    "IRS2 Haploinsufficiency",
                    "EIF2S1",
                    "Mammalian Target of Rapamycin Pathway (abr. mTOR pathway)",
                    "GLUT4",
                ],
            },

            perPage: 10,
            perPagephenotype: 23,
            currentPage: 1,
            variants: [],
            consequences: {},
            // currentSort: "allelecount",
            // currentSortDir: "desc",
            fields: [
                {
                    key: "varId",
                    label: "Variant",
                },
                {
                    key: "max_consequence",
                    label: "Consequence",
                    tdClass: "border-color",
                },
                {
                    key: "HGVSc",
                    label: "HGVSc",
                },
                {
                    key: "HGVSp",
                    label: "HGVSp",
                },
                {
                    key: "alleleCount",
                    label: "Count",
                    sortable: true,
                    tdClass: "text-right pr-3",
                    thClass: "text-right",
                },
                /*{
                    key: "alleleNumber",
                    label: "Number",
                    sortable: true,
                    tdClass: "text-right pr-3",
                    thClass: "text-right",
                },*/

                {
                    key: "alleleFrequency",
                    label: "Frequency",
                    sortable: true,
                    tdClass: "text-right pr-3",
                    thClass: "text-right",
                    formatter: "formatAlleleFrequency",
                },
                /*{
                    key: "homozygousCount",
                    label: " Homozygotes",
                    sortable: true,
                    tdClass: "text-right pr-3",
                    thClass: "text-right",
                },*/
                /*{
                    key: "gnomadGenomesPopmaxAc",
                    label: "Count",
                    sortable: true,
                    tdClass: "text-right pr-3",
                    thClass: "text-right",
                },
                {
                    key: "gnomadGenomesPopmaxAn",
                    label: "Number",
                    sortable: true,
                    tdClass: "text-right pr-3",
                    thClass: "text-right",
                },*/
                {
                    key: "gnomadGenomesPopmaxAf",
                    label: "Frequency",
                    sortable: true,
                    tdClass: "text-right pr-3",
                    thClass: "text-right",
                },
                {
                    key: "view",
                    label: "View Additional Data",
                    class: "nowrap",
                    tdClass: "text-center",
                    thClass: "text-center",
                },
            ],
            subFields: [
                {
                    key: "transcriptId",
                    label: "Feature",
                },
                {
                    key: "consequence",
                    label: "Consequence",
                    tdClass: "border-color",
                },
                {
                    key: "HGVSc",
                    label: "HGVSc",
                },
                {
                    key: "HGVSp",
                    label: "HGVSp",
                },
            ],
            hprecordFields: [
                {
                    key: "phenotype",
                    label: "Phenotype",
                },
                {
                    key: "alleleCountCases",
                    label: "Allele Count",
                    sortable: true,
                    tdClass: "text-right pr-4",
                    thClass: "text-right",
                },
                /*{
                    key: "alleleNumber",
                    label: "Allele Number",
                    sortable: true,
                    tdClass: "text-right pr-4",
                    thClass: "text-right",
                },
                {
                    key: "homozygousCases",
                    label: "Homozygotes",
                    sortable: true,
                    tdClass: "text-right pr-4",
                    thClass: "text-right",
                },
                {
                    key: "alleleFrequency",
                    label: "Allele Frequency",
                    sortable: true,
                    tdClass: "text-right pr-4",
                    thClass: "text-right",
                    formatter: "formatAlleleFrequency",
                },*/
            ],
            variantData: null,
            loadingData: {},
            sortByImpacts: false,
        };
    },
    computed: {
        tableData() {
            if (this.sortByImpacts && this.variantData.length) {
                let sortedVariants = structuredClone(this.variantData);
                //console.log("sortedVariants", sortedVariants);
                return sortedVariants.sort((a, b) => {
                    return this.sortImpacts(a, b);
                });
            } else return this.variantData || [];
            // return this.variants || [];
        },
        rows() {
            if (this.tableData) return this.tableData.length;
            else return [];
        },
        phenotypes() {
            return Object.keys(this.HPOTerms) || [];
        },
    },
    watch: {
        gene: {
            handler(val) {
                if (val) this.searchVariants();
            },
            //immediate: true,
        },
    },
    created() {
        if (this.gene) {
            this.searchVariants();
        }
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

            this.variants = await query("gene-variants", this.gene, {query_private:true}, true);

            if (this.variants && this.variants.length) {
                //console.log("Variant Search:"+this.variants.length);
                
                
                for (let i = 0; i < this.variants.length; i++) {
                    //console.log(this.variants[i].varId);
                    //get data from HP record AllSamples
                    /*let AllSamples = this.variants[i].hprecords.find(
                        (x) => x.HP === "AllSamples"
                    );
                    //copy all properties from AllSamples to variants[i]
                    for (let prop in AllSamples) {
                        this.variants[i][prop] = AllSamples[prop];
                    } */

                    //this.variants[i].allelecount =this.variants[i].alleleCount;
                    //this.variants[i].allelnumber = this.variants[i].alleleNumber;
                    //this.variants[i].allelefrequency =this.variants[i].allelecount / this.variants[i].allelnumber;
                    //this.variants[i].allelefrequency = this.variants[i].allelefrequency.toExponential(2);
                    /*if (this.variants[i].gnomAD_info) {
                        this.variants[i].gnomAD_exomes_AC =
                            this.variants[i].gnomAD_info.gnomADg_AC;
                        this.variants[i].gnomAD_exomes_AN =
                            this.variants[i].gnomAD_info.gnomADg_AN;
                        this.variants[i].gnomAD_exomes_AF =
                            this.variants[i].gnomAD_info.gnomADg_AF;
                        //alert("gnomAD_exomes_AC"+this.variants[i].gnomAD_exomes_AC);
                    }*/

                    /*for (let m = 0;m < this.variants[i].hprecords.length; m++) {
                        let hp = this.variants[i].hprecords[m];
                        if (hp.HP == "AllSamples") {
                            this.variants[i].c_allelecount = hp.alleleCount;
                            this.variants[i].allelecount +=
                                this.variants[i].c_allelecount;
                            this.variants[i].c_allelnumber = hp.alleleNumber;
                            this.variants[i].allelnumber +=
                                this.variants[i].c_allelnumber;
                            this.variants[i].allelefrequency = hp.alleleFrequency;
                            // this.variants[i].allelefrequency =
                            //     this.variants[i].allelefrequency.toExponential(
                            //         2
                            //     );
                            //this.variants[i].c_allelefrequency =this.variants[i].c_allelecount / this.variants[i].c_allelnumber;
                            //this.variants[i].c_allelefrequency =this.variants[i].c_allelefrequency.toExponential(2);
                            //this.variants[i].c_TWO_ALT_GENO_CTS =hp.n_hom_var_case;
                            this.variants[i].homozygouscount = parseInt(
                                hp.heterozygousCount
                                //this.variants[i].n_hom_var_case
                            );
                        } 
                    }*/
                    //do we need vep count?
                    //this.variants[i].vep = this.variants[i].veprecords.length;
                    if (this.variants[i].vepRecords.length > 0) {
                        //console.log("vepRecords:"+this.variants[i].vepRecords.length);
                        let varrecords = this.variants[i].vepRecords;

                        for (let j = 0; j < varrecords.length; j++) {
                            this.variants[i].vepRecords[j].consequence = varrecords[j].consequenceTerms.toString();
                            this.variants[i].vepRecords[j].consequence = this.variants[i].vepRecords[j].consequence.substring(1, this.variants[i].vepRecords[j].consequence.length-1);
                                
                            if (varrecords[j].pick == "1") {
                                //console.log(this.variants[i].varId);
                                this.variants[i].Gene_Symbol =
                                    varrecords[j].Gene_Symbol;
                                this.variants[i].Max_Impact =
                                    varrecords[j].impact;
                                if (this.variants[i].Max_Impact == "LOWEST") {
                                    this.variants[i].Max_Impact = "MODIFIER";
                                }

                                this.variants[i].max_consequence =
                                    varrecords[j].consequenceTerms.toString();
                                this.variants[i].max_consequence = this.variants[i].max_consequence.substring(1, this.variants[i].max_consequence.length-1);
                                this.variants[i].Protein_Position =
                                    varrecords[j].proteinStart;
                                this.variants[i].Amino_Acids =
                                    varrecords[j].aminoAcids;

                                this.disablebtn[
                                    this.variants[i].Max_Impact
                                ] = false;

                                this.variants[i].HGVSc = varrecords[j].hgvsc;
                                this.variants[i].HGVSp = varrecords[j].hgvsp;
                                this.variants[i].gnomadGenomesPopmaxAf = varrecords[j].gnomadGenomesPopmaxAf;
                            }
                        }
                        //Max_Impact	Biotype Gene_Symbol	Transcript_count	Amino_Acids	Protein_Position	CDS_position	Refgene	max_consequence
                    } 
                    
                    if (this.variants[i].hprecords.length > 0) {
                        let hpdisplay = [];
                        let j = 0;

                        for (let k = 0;k < this.variants[i].hprecords.length;k++) {
                            let hp = this.variants[i].hprecords[k];
                            //if (hp.HP != "AllControl") {
                            hpdisplay[j] = {};
                            //hpdisplay[j].hpoterms = this.HPOTerms[hp.HP];
                            hpdisplay[j].hp = hp.phenotype;
                            hpdisplay[j].phenotype = this.HPOTerms[hp.phenotype];
                            //console.log(hpdisplay[j].hp+":"+hpdisplay[j].phenotype);
                            //hpdisplay[j].phenotype = Formatters.snakeFormatter(
                            //    this.HPOTerms[hp.phenotype]
                            //);
                            hpdisplay[j].alleleCountCases = hp.alleleCountCases;
                            hpdisplay[j].alleleNumber =hp.alleleNumber;
                            hpdisplay[j].alleleFrequency =hp.alleleFrequency;

                            hpdisplay[j].homozygousCases = hp.homozygousCases;
                            j++;
                            //}
                        }
                        //no longer sort by allelecount
                        // hpdisplay = hpdisplay.sort(function (a, b) {
                        //     //console.log(a.allelecount+"|"+b.allelecount+"|"+(a.allelecount>b.allelecount));
                        //     if (a.allelecount > b.allelecount) {
                        //         return -1;
                        //     } else if (a.allelecount < b.allelecount) {
                        //         return 1;
                        //     }
                        //     return 0;
                        // });
                        let sortOrder = [
                            "Antibody Negative Insulin Deficient (abr. ANID)",
                            "Lipodystrophic",
                            "Non-Obese Inulin Insufficient (abr. NOII)",
                            "Possible Monogenic or Oligogenic (abr. PMO)",
                            "Non-Progressive",
                            "Syndromic",
                            "Very Low Insulin Requirements (abr. VLIR)",
                            "Antibody Negative Beta Cell Negative Ketosis-Prone DM (abr. A (-) B (-) KPDM)",
                            "Antibody Negative Beta Cell Positive Ketosis-Prone DM (abr. A (-) B (+) KPDM)",
                            "Severe Insulin Resistance (SIR)",
                            "Beta Cell Dysfunction",
                            "IGF1R",
                            "INS",
                            "NFKB1",
                            "PAX6",
                            "PTPMT1",
                            "SMAD5",
                            "INSR",
                            "LMNTD2",
                            "SLIT2 or ROB1",
                            "CERS2",
                            "IDH2",
                            "IRS2 Haploinsufficiency",
                            "EIF2S1",
                            "Mammalian Target of Rapamycin Pathway (abr. mTOR pathway)",
                            "GLUT4",
                        ];
                        hpdisplay = hpdisplay.sort(function (a, b) {
                            return (
                                sortOrder.indexOf(a.phenotype) -
                                sortOrder.indexOf(b.phenotype)
                            );
                        });
                        hpdisplay = hpdisplay.filter((item) =>
							item.alleleCountCases > 0
						);
						this.variants[i].hpdisplay2 = hpdisplay;
                        this.variants[i].hpdisplay = hpdisplay;
                    } 
                    //console.log(this.variants[i]);
                }
                //console.log("Variant Search done");
                //if default filters are set, filter the variants
                /*if (this.filters.impacts.length > 0 ||this.filters.phenotypes.length > 0) {
                    this.addfilter();
                }*/
                this.variantData = structuredClone(this.variants); //copy data

                //add showButton property to each variant
                this.variantData.map((variant) => {
                    variant.showButton = 0;
                });
            }
        },
        async getTranscriptConsequences(varid) {
            if (varid) {
                let data = await query("transcript-consequences", varid);
                return data;
            }
        },
        consequenceFormatter(consequence) {
            if (consequence) {
                let trim = consequence
                    .replaceAll(",", ", ")
                    .replace("_prime_", "' ")
                    .replace("_variant", "");
                return Formatters.snakeFormatter(trim);
            }
            return;
        },
        siftFormatter(name) {
            return Formatters.snakeFormatter(name);
        },
        /*async showVariantData(varid) {
            let escapedVarID = this.escapedVarID(varid);

            if (this.variantData[escapedVarID] === undefined) {
                this.loadingData[escapedVarID] = true;
                let tcQuery = await this.getTranscriptConsequences(varid);
                Vue.set(this.variantData, escapedVarID, tcQuery);
                this.loadingData[escapedVarID] = false;
            }
        },*/
        escapedVarID(varid) {
            if (varid) return varid.replace(/:\s*/g, "_");
            else {
                return "";
            }
        },
        rowPickClass(item, type) {
            if (!item || type !== "row") return;
            if (item.PICK === true) return "row-pick";
        },
        calculateAlleleFrequency(count, number) {
            if (count === 0 || number === 0) return "";
            else return count / number;
        },
        formatAlleleFrequency(frequency) {
            if (!frequency) return "";
            if (frequency < 0.0001) {
                return parseFloat(frequency).toExponential(5);
            } else {
                return parseFloat(frequency).toFixed(5);
            }
        },

        toToggle(row, buttonClicked) {
            if (!row.detailsShowing || buttonClicked === row.item.showButton) {
                row.toggleDetails();
            }

            Vue.set(row.item, "showButton", buttonClicked);
        },

        addfilter() {
            let dataRows = this.variants;
            if (this.filters["impacts"].length > 0) {
                dataRows = dataRows.filter((item) =>
                    this.filters["impacts"].includes(item.Max_Impact)
                );
            }
            if (this.filters["phenotypes"].length > 0) {
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
            }
            this.variantData = dataRows;
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
        format_hgvsc(hgvsc) {
            return hgvsc?.split(":")[1] || "";
        },
        format_hgvsp(hgvsp) {
            return hgvsp?.split(":")[1].replace("%3D", "=") || "";
        },
        format_freq(frequency) {
            return frequency?.toFixed(5) || "";
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
