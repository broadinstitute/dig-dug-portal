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
                        <b-th colspan="4" class="text-center" variant="primary"
                            >NephKP Allele</b-th
                        >

                        <b-th
                            v-b-tooltip.hover
                            colspan="3"
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
                <template #cell(varid)="data">
                    <a :href="`/variant.html?variant=${data.item.varid}`">{{
                        data.item.varid
                    }}</a> </template
                ><template #cell(dbSNP)="data">
                    <a :href="`/variant.html?variant=${data.item.dbSNP}`">{{
                        data.item.dbSNP
                    }}</a>
                </template>
                <template #cell(allelecount)="data">
                    <div align="right">{{ data.item.allelecount }}</div>
                </template>
                <template #cell(allelnumber)="data">
                    <div align="right">{{ data.item.allelnumber }}</div>
                </template>
                <template #cell(allelefrequency)="data">
                    <div align="right">
                        {{ formatAlleleFrequency(data.item.allelefrequency) }}
                    </div>
                </template>
                <template #cell(homozygouscount)="data">
                    <div align="right">{{ data.item.homozygouscount }}</div>
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
                    <div align="right">
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
                        @click="
                            toToggle(data, 1, data.detailsShowing)
                                ? data.toggleDetails()
                                : ''
                        "
                    >
                        {{
                            data.detailsShowing && data.item.showButton === 1
                                ? "Hide"
                                : "Show"
                        }}
                        Phenotypes</b-btn
                    >
                    <b-btn
                        v-if="data.item.veprecords.length === 0"
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
                            toToggle(data, 2, data.detailsShowing)
                                ? data.toggleDetails()
                                : ''
                        "
                        ><span v-if="!!loadingData[data.item.varid]"
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
                                <template #cell(allelecount)="row">
                                    <div align="right">
                                        {{ row.item.allelecount }}
                                    </div>
                                </template>
                                <template #cell(allelnumber)="row">
                                    <div align="right">
                                        {{ row.item.allelnumber }}
                                    </div>
                                </template>
                                <template #cell(allelefrequency)="row">
                                    <div align="right">
                                        {{
                                            formatAlleleFrequency(
                                                row.item.allelefrequency
                                            )
                                        }}
                                    </div>
                                </template>
                                <template #cell(n_hom_var_case)="row">
                                    <div align="right">
                                        {{ row.item.n_hom_var_case }}
                                    </div>
                                </template>
                            </b-table>
                        </div>

                        <div v-if="row.item.showButton === 2" class="row">
                            <b-table
                                v-if="row.item.veprecords.length > 0"
                                :items="row.item.veprecords"
                                :fields="subFields"
                                :per-page="perPage"
                                :tbody-tr-class="rowPickClass"
                                ><template #cell(varID)="data">
                                    <a
                                        :href="`/variant.html?variant=${data.item.varID}`"
                                        >{{ data.item.varID }}</a
                                    >
                                </template>
                                <template #head(Feature)="data">
                                    <span class="external_source"
                                        >Feature
                                    </span>
                                </template>
                                <template #cell(Feature)="data">
                                    <a
                                        v-if="data.item.Feature"
                                        :href="`https://grch37.ensembl.org/Homo_sapiens/Transcript/Summary?db=core;t=${data.item.Feature}`"
                                        target="_blank"
                                        rel="noopener noreferrer nofollow"
                                        >{{ data.item.Feature }}</a
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
                                <template #cell(max_consequence)="data">
                                    <div
                                        class="border-color"
                                        :class="data.item.IMPACT"
                                    >
                                        <span>{{
                                            consequenceFormatter(
                                                data.item.Consequence
                                            )
                                        }}</span>
                                    </div></template
                                >
                                <template #cell(HGVSc)="data">
                                    {{
                                        format_hgvsc(data.item.HGVSc)
                                    }}</template
                                >
                                <template #cell(HGVSp)="data">
                                    {{ format_hgvsp(data.item.HGVSp) }}
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
            HPOTerms: {
                Sensitive: "Steroid Sensitive Nephrotic Syndrome",
                AdultSensitive: "Steroid Sensitive Nephrotic Syndrome (Adult)",
                PediatricSensitive:
                    "Steroid Sensitive Nephrotic Syndrome (Pediatric)",
                Uncategorized: "Uncategorized Nephrotic Syndrome",
                AdultUncategorized: "Uncategorized Nephrotic Syndrome (Adult)",
                PediatricUncategorized:
                    "Uncategorized Nephrotic Syndrome (Pediatric)",
                Resistant: "Steroid Resistant Nephrotic Syndrome",
                AdultResistant: "Steroid Resistant Nephrotic Syndrome (Adult)",
                PediatricResistant:
                    "Steroid Resistant Nephrotic Syndrome (Pediatric)",
                AllSamples: "All Samples",
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
            perPagephenotype: 23,
            currentPage: 1,
            variants: [],
            consequences: {},
            currentSort: "allelecount",
            currentSortDir: "desc",
            fields: [
                {
                    key: "varid",
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
                    key: "c_allelecount",
                    label: "Count",
                    sortable: true,
                    tdClass: "text-right pr-3",
                    thClass: "text-right",
                },
                {
                    key: "c_allelnumber",
                    label: "Number",
                    sortable: true,
                    tdClass: "text-right pr-3",
                    thClass: "text-right",
                },

                {
                    key: "allelefrequency",
                    label: "Frequency",
                    sortable: true,
                    tdClass: "text-right pr-3",
                    thClass: "text-right",
                    formatter: "formatAlleleFrequency",
                },
                {
                    key: "homozygouscount",
                    label: " Homozygotes",
                    sortable: true,
                    tdClass: "text-right pr-3",
                    thClass: "text-right",
                },
                {
                    key: "gnomAD_exomes_AC",
                    label: "Count",
                    sortable: true,
                    tdClass: "text-right pr-3",
                    thClass: "text-right",
                },
                {
                    key: "gnomAD_exomes_AN",
                    label: "Number",
                    sortable: true,
                    tdClass: "text-right pr-3",
                    thClass: "text-right",
                },
                {
                    key: "gnomAD_exomes_AF",
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
                    key: "Feature",
                    label: "Feature",
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
            ],
            hprecordFields: [
                {
                    key: "HP",
                    label: "Phenotype",
                },
                {
                    key: "allelecount",
                    label: "Allele Count",
                    sortable: true,
                    tdClass: "text-right pr-4",
                    thClass: "text-right",
                },
                {
                    key: "allelnumber",
                    label: "Allele Number",
                    sortable: true,
                    tdClass: "text-right pr-4",
                    thClass: "text-right",
                },
                {
                    key: "n_hom_var_case",
                    label: "Homozygotes",
                    sortable: true,
                    tdClass: "text-right pr-4",
                    thClass: "text-right",
                },
                {
                    key: "allelefrequency",
                    label: "Allele Frequency",
                    sortable: true,
                    tdClass: "text-right pr-4",
                    thClass: "text-right",
                    formatter: "formatAlleleFrequency",
                },
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
                console.log("sortedVariants", sortedVariants);
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

            this.variants = await query("variants", this.gene, {}, true);

            if (this.variants && this.variants.length) {
                this.variantData = [...this.variants]; //copy data

                //add showButton property to each variant
                this.variantData.map((variant) => {
                    variant.showButton = 0;
                });

                for (let i = 0; i < this.variants.length; i++) {
                    //get data from HP record AllSamples
                    let AllSamples = this.variants[i].hprecords.find(
                        (x) => x.HP === "AllSamples"
                    );
                    //copy all properties from AllSamples to variants[i]
                    for (let prop in AllSamples) {
                        this.variants[i][prop] = AllSamples[prop];
                    }

                    this.variants[i].allelecount =
                        2 * parseInt(AllSamples.n_hom_var_case) +
                        parseInt(AllSamples.n_het_case);
                    this.variants[i].allelnumber =
                        2 *
                        (parseInt(AllSamples.n_hom_ref_case) +
                            parseInt(AllSamples.n_het_case) +
                            parseInt(AllSamples.n_hom_var_case));
                    //this.variants[i].allelefrequency =this.variants[i].allelecount / this.variants[i].allelnumber;
                    //this.variants[i].allelefrequency = this.variants[i].allelefrequency.toExponential(2);
                    if (this.variants[i].gnomAD_info) {
                        this.variants[i].gnomAD_exomes_AC =
                            this.variants[i].gnomAD_info.gnomADg_AC;
                        this.variants[i].gnomAD_exomes_AN =
                            this.variants[i].gnomAD_info.gnomADg_AN;
                        this.variants[i].gnomAD_exomes_AF =
                            this.variants[i].gnomAD_info.gnomADg_AF;
                        //alert("gnomAD_exomes_AC"+this.variants[i].gnomAD_exomes_AC);
                    }

                    for (
                        let m = 0;
                        m < this.variants[i].hprecords.length;
                        m++
                    ) {
                        let hp = this.variants[i].hprecords[m];
                        if (hp.HP == "AllSamples") {
                            this.variants[i].c_allelecount =
                                2 * parseInt(hp.n_hom_var_case) +
                                parseInt(hp.n_het_case);
                            this.variants[i].allelecount +=
                                this.variants[i].c_allelecount;
                            this.variants[i].c_allelnumber =
                                2 *
                                (parseInt(hp.n_hom_ref_case) +
                                    parseInt(hp.n_het_case) +
                                    parseInt(hp.n_hom_var_case));
                            this.variants[i].allelnumber +=
                                this.variants[i].c_allelnumber;
                            this.variants[i].allelefrequency =
                                this.variants[i].c_allelecount /
                                this.variants[i].c_allelnumber;
                            // this.variants[i].allelefrequency =
                            //     this.variants[i].allelefrequency.toExponential(
                            //         2
                            //     );
                            //this.variants[i].c_allelefrequency =this.variants[i].c_allelecount / this.variants[i].c_allelnumber;
                            //this.variants[i].c_allelefrequency =this.variants[i].c_allelefrequency.toExponential(2);
                            //this.variants[i].c_TWO_ALT_GENO_CTS =hp.n_hom_var_case;
                            this.variants[i].homozygouscount = parseInt(
                                hp.n_hom_var_case
                                //this.variants[i].n_hom_var_case
                            );
                        }
                    }
                    //do we need vep count?
                    //this.variants[i].vep = this.variants[i].veprecords.length;
                    if (this.variants[i].veprecords.length > 0) {
                        let varrecords = this.variants[i].veprecords;

                        for (let j = 0; j < varrecords.length; j++) {
                            if (varrecords[j].PICK === true) {
                                this.variants[i].Gene_Symbol =
                                    varrecords[j].Gene_Symbol;
                                this.variants[i].Max_Impact =
                                    varrecords[j].IMPACT;
                                if (this.variants[i].Max_Impact == "LOWEST") {
                                    this.variants[i].Max_Impact = "MODIFIER";
                                }

                                this.variants[i].max_consequence =
                                    varrecords[j].Consequence;
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

                    if (this.variants[i].hprecords.length > 0) {
                        let hpdisplay = [];
                        let j = 0;

                        for (
                            let k = 0;
                            k < this.variants[i].hprecords.length;
                            k++
                        ) {
                            let hp = this.variants[i].hprecords[k];
                            //if (hp.HP != "AllControl") {
                            hpdisplay[j] = {};
                            //hpdisplay[j].hpoterms = this.HPOTerms[hp.HP];
                            hpdisplay[j].hp = hp.HP;
                            hpdisplay[j].HP = Formatters.snakeFormatter(
                                this.HPOTerms[hp.HP]
                            );
                            hpdisplay[j].allelecount =
                                2 * hp.n_hom_var_case + hp.n_het_case;
                            hpdisplay[j].allelnumber =
                                2 *
                                (hp.n_hom_ref_case +
                                    hp.n_het_case +
                                    hp.n_hom_var_case);
                            hpdisplay[j].allelefrequency =
                                this.calculateAlleleFrequency(
                                    hpdisplay[j].allelecount,
                                    hpdisplay[j].allelnumber
                                );

                            hpdisplay[j].n_hom_var_case = hp.n_hom_var_case;
                            j++;
                            //}
                        }
                        hpdisplay = hpdisplay.sort(function (a, b) {
                            //console.log(a.allelecount+"|"+b.allelecount+"|"+(a.allelecount>b.allelecount));
                            if (a.allelecount > b.allelecount) {
                                return -1;
                            } else if (a.allelecount < b.allelecount) {
                                return 1;
                            }
                            return 0;
                        });
                        this.variants[i].hpdisplay2 = hpdisplay;
                        this.variants[i].hpdisplay = hpdisplay;
                    }
                }

                //if default filters are set, filter the variants
                if (
                    this.filters.impacts.length > 0 ||
                    this.filters.phenotypes.length > 0
                ) {
                    this.addfilter();
                }
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
        toToggle(row, buttonClicked, isShowing) {
            console.log(
                "toToggle",
                row.item.showButton,
                buttonClicked,
                isShowing
            );
            if (isShowing) {
                if (buttonClicked === row.item.showButton) return true;
                else {
                    Vue.set(row.item, "showButton", buttonClicked);
                    console.log(
                        "after set",
                        row.item.showButton,
                        buttonClicked,
                        isShowing
                    );
                    return false;
                }
            } else {
                Vue.set(row.item, "showButton", buttonClicked);
                console.log(
                    "after set",
                    row.item.showButton,
                    buttonClicked,
                    isShowing
                );
                return true;
            }
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
            console.log("sort", this.currentSort);
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
