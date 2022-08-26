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
                <csv-download
                    v-if="tableData.length"
                    :data="tableData"
                    filename="variants"
                ></csv-download
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
                                                selectAllElements(
                                                    'phenotypes',
                                                    true
                                                )
                                            "
                                            >Select All</b-btn
                                        >&nbsp;
                                        <b-btn
                                            class="btn btn-secondary btn-sm"
                                            @click="
                                                selectAllElements(
                                                    'phenotypes',
                                                    false
                                                )
                                            "
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
                        <b-th
                            colspan="4"
                            class="text-center"
                            variant="secondary"
                            >Allele</b-th
                        >

                        <b-th
                            colspan="3"
                            class="text-center"
                            variant="secondary"
                            style="border-left: 1px solid #dee2e6"
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
                    <div align="right">{{ data.item.allelefrequency }}</div>
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
                        {{ row.item.gnomAD_exomes_AF }}
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

                <template #cell(view)="data">
                    <b-btn
                        size="sm"
                        class="btn-mini mr-2"
                        variant="outline-primary"
                        @click="
                            toToggle(data.detailsShowing, 1)
                                ? data.toggleDetails()
                                : ''
                        "
                    >
                        {{
                            data.detailsShowing && showButton === 1
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
                            toToggle(data.detailsShowing, 2)
                                ? data.toggleDetails()
                                : ''
                        "
                        ><span v-if="!!loadingData[data.item.varid]"
                            ><b-spinner small></b-spinner>
                            <span class="sr-only">Loading...</span></span
                        ><span v-else>
                            {{
                                data.detailsShowing && showButton === 2
                                    ? "Hide"
                                    : "Show"
                            }}
                            Annotations</span
                        >
                    </b-btn>
                </template>

                <template #row-details="row">
                    <div class="details">
                        <b-table
                            v-if="showButton === 1"
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
                                    {{ row.item.allelefrequency }}
                                </div>
                            </template>
                            <template #cell(n_hom_var_case)="row">
                                <div align="right">
                                    {{ row.item.n_hom_var_case }}
                                </div>
                            </template>
                        </b-table>

                        <b-table
                            v-if="
                                row.item.veprecords.length > 0 &&
                                showButton === 2
                            "
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
                                    <b-badge
                                        pill
                                        disabled
                                        class="ml-1"
                                        variant="secondary"
                                        title="Link to external source."
                                        >E</b-badge
                                    ></span
                                >
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
                            <template #cell(siftPrediction)="data">
                                {{ siftFormatter(data.item.siftPrediction) }}
                            </template>
                        </b-table>
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
import { match, query } from "@/utils/bioIndexUtils";
import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import Formatters from "@/utils/formatters";
import Documentation from "@/components/Documentation";
import TooltipDocumentation from "@/components/TooltipDocumentation";
import CsvDownload from "@/components/CsvDownload";
//import PhenotypePicker from "@/components/PhenotypePicker.vue";
//import FilterWrapper from "@/portals/Neph/components/FilterWrapper.vue";
//import Multiselect from 'vue-multiselect';

import uiUtils from "@/utils/uiUtils";

// register globally
//Vue.component('multiselect', Multiselect)

export default Vue.component("VariantSearch", {
    components: {
        CriterionListGroup,
        FilterEnumeration,
        Documentation,
        TooltipDocumentation,
        Formatters,
        CsvDownload,
        //PhenotypePicker,
        //FilterWrapper,
    },
    props: {
        gene: [String, Array],
    },
    data() {
        return {
            filters: {
                impacts: ["HIGH", "MODERATE", "LOW"],
                phenotypes: [],
            },
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
                Healthy: "Healthy",
                NephSyndSteroidSensitive:
                    "Steroid Sensitive Nephrotic Syndrome",
                NephSyndUncategorized: "Uncategorized Nephrotic Syndrome",
                NephSyndSteroidResistant:
                    "Steroid Resistant Nephrotic Syndrome",
                AllNephroticSyndCases: "All Cases Nephrotic Syndrome",
                FSGS: "Focal Segmental Glomerulosclerosis",
                MCD: "Minimal Change Disease",
                AllSamples: "All Samples",
            },

            perPage: 10,
            perPagephenotype: 23,
            currentPage: 1,
            showButton: null,
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
                    key: "Protein_Position",
                    label: "Protein Position",
                },
                {
                    key: "Amino_Acids",
                    label: "Amino Acids",
                },
                {
                    key: "c_allelecount",
                    label: "Count",
                    sortable: true,
                    tdClass: "text-right",
                    thClass: "text-right",
                },
                {
                    key: "c_allelnumber",
                    label: "Number",
                    sortable: true,
                    tdClass: "text-right",
                    thClass: "text-right",
                },

                {
                    key: "allelefrequency",
                    label: "Frequency",
                    sortable: true,
                    tdClass: "text-right",
                    thClass: "text-right",
                },
                {
                    key: "homozygouscount",
                    label: " Homozygotes",
                    sortable: true,
                    tdClass: "text-right",
                    thClass: "text-right",
                },
                {
                    key: "gnomAD_exomes_AC",
                    label: "Count",
                    sortable: true,
                },
                {
                    key: "gnomAD_exomes_AN",
                    label: "Number",
                    sortable: true,
                },
                {
                    key: "gnomAD_exomes_AF",
                    label: "Frequency",
                    sortable: true,
                },
                {
                    key: "view",
                    label: "View Additional Data",
                    class: "nowrap",
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
                    key: "Protein_position",
                    label: "Position",
                },
                {
                    key: "Amino_acids",
                    label: "Amino Acids",
                },
                {
                    key: "HGNC",
                    label: "HGNC",
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
                    tdClass: "text-right",
                    thClass: "text-right",
                },
                {
                    key: "allelnumber",
                    label: "Allele Number",
                    sortable: true,
                    tdClass: "text-right",
                    thClass: "text-right",
                },
                {
                    key: "n_hom_var_case",
                    label: "Homozygotes",
                    sortable: true,
                    tdClass: "text-right",
                    thClass: "text-right",
                },
                {
                    key: "allelefrequency",
                    label: "Allele Frequency",
                    sortable: true,
                    tdClass: "text-right",
                    thClass: "text-right",
                },
            ],
            variantData: null,
            loadingData: {},
        };
    },
    computed: {
        //This works to display all data fro BI
        tableData() {
            // if (this.variantData && this.variantData.length) {
            //     return this.variantData;
            // } else {
            //     return [];
            // }
            return this.variantData || [];
            // return this.variants || [];
        },
        rows() {
            //alert("call rows");
            if (this.tableData) return this.tableData.length;
            else return [];
        },
        // sortedData(hprecords) {
        //     console.log(hprecords);
        //     return hprecords.sort(function (a, b) {
        //         return a.allelecount > b.allelecount;
        //     });
        // },
    },
    watch: {
        gene: {
            handler(val) {
                if (val) this.searchVariants();
            },
            //immediate: true,
        },
        variantData: {
            handler(val) {
                if (val) console.log("changed", val);
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
                console.log("DATAAAA", this.variantData);

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
                            this.variants[
                                i
                            ].gnomAD_info.gnomADg_AF?.toExponential(2);
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
                            this.variants[i].allelefrequency =
                                this.variants[i].allelefrequency.toExponential(
                                    2
                                );
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
                                //helen test 2022-01-17
                                this.variants[i].max_consequence =
                                    varrecords[j].Consequence;
                                this.variants[i].Protein_Position =
                                    varrecords[j].Protein_position;
                                this.variants[i].Amino_Acids =
                                    varrecords[j].Amino_acids;

                                this.disablebtn[
                                    this.variants[i].Max_Impact
                                ] = false;
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
                                this.formatAlleleFrequency(
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

                console.log("DATAAAA INSIDE", this.variantData);
            }
            console.log("DATAAAA AGAIN", this.variantData);
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
        formatAlleleFrequency(count, number) {
            if (count === 0 || number === 0) return "0.00000";
            else return Number.parseFloat(count / number).toFixed(5);
        },
        toToggle(isShowing, buttonClicked) {
            if (isShowing) {
                if (this.showButton === buttonClicked) return true;
                else {
                    this.showButton = buttonClicked;
                    return false;
                }
            } else {
                this.showButton = buttonClicked;
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
