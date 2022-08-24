<template>
    <div id="bch-variant-search">
        <b-row>
            <b-col cols="9">
                <div class="legends" v-show="tableData.length">
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
                sort-icon-left
                responsive="sm"
                :fields="fields"
                :items="tableData"
                :per-page="perPage"
                :current-page="currentPage"
                ><template #thead-top="data">
                <!--    <b-tr>
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
                    </b-tr> -->
                </template>
                <template #cell(varID)="data">
                    <a :href="`/variant.html?variant=${data.item.varID}`">{{
                        data.item.varID
                    }}</a> </template
                >
                <template #cell(Phenotype)="data">
                    <b-btn
                        size="sm"
                        class="btn-mini"
                        variant="outline-primary"
                        @click="
                            showPhenoData(data.item.varID, data.item.hprecords);
                            data.toggleDetails();
                        ">Phenotype</b-btn>
                    
                </template>
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
                            showVariantData(data.item.varID);
                            data.toggleDetails();
                        "
                        ><span v-if="!!loadingData[data.item.varID]"
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
                                variantData[escapedVarID(row.item.varID)] &&
                                variantData[escapedVarID(row.item.varID)].length
                            "
                        >
                            <b-table
                                :items="
                                    variantData[escapedVarID(row.item.varID)]
                                "
                                :fields="subFields"
                                :per-page="perPage"
                                :tbody-tr-class="rowPickClass"
                                ><template #cell(varID)="data">
                                    <a
                                        :href="`/variant.html?variant=${data.item.varID}`"
                                        >{{ data.item.varID }}</a
                                    >
                                </template>
                                <template #head(transcriptId)="data">
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
                                <template #cell(transcriptId)="data">
                                    <a
                                        v-if="data.item.transcriptId"
                                        :href="`https://grch37.ensembl.org/Homo_sapiens/Transcript/Summary?db=core;t=${data.item.transcriptId}`"
                                        target="_blank"
                                        rel="noopener noreferrer nofollow"
                                        >{{ data.item.transcriptId }}</a
                                    >
                                </template>
                                <!-- <template #cell(gene_symbol)="data">
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
                                </template> -->
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
                                                i < data.item.consequenceTerms.length-1 ? ", ": ""
                                            }}</span>
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
                                variantData[escapedVarID(row.item.varID)] &&
                                variantData[escapedVarID(row.item.varID)]
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

var HPOTerms = [];
HPOTerms["HP-0000119"]="Abnormality of the genitourinary system";
HPOTerms["HP-0000152"]="Abnormality of head or neck";
HPOTerms["HP-0000478"]="Abnormality of the eye";
HPOTerms["HP-0000598"]="Abnormality of the ear";
HPOTerms["HP-0000707"]="Abnormality of the nervous system";
HPOTerms["HP-0000769"]="Abnormality of the breast";
HPOTerms["HP-0000818"]="Abnormality of the endocrine system";
HPOTerms["HP-0001197"]="Abnormality of prenatal development or birth";
HPOTerms["HP-0001507"]="Growth abnormality";
HPOTerms["HP-0001574"]="Abnormality of the integument";
HPOTerms["HP-0001608"]="Abnormality of the voice";
HPOTerms["HP-0001626"]="Abnormality of the cardiovascular system";
HPOTerms["HP-0001871"]="Abnormality of blood and blood-forming tissues";
HPOTerms["HP-0001939"]="Abnormality of metabolism/homeostasis";
HPOTerms["HP-0002086"]="Abnormality of the respiratory system";
HPOTerms["HP-0002664"]="Neoplasm";
HPOTerms["HP-0002715"]="Abnormality of the immune system";
HPOTerms["HP-0025031"]="Abnormality of the digestive system";
HPOTerms["HP-0025142"]="Constitutional symptom";
HPOTerms["HP-0025354"]="Abnormal cellular phenotype";
HPOTerms["HP-0033127"]="Abnormality of the musculoskeletal system";
HPOTerms["HP-0040064"]="Abnormality of limbs";
HPOTerms["HP-0045027"]="Abnormality of the thoracic cavity";
HPOTerms["AllControl"]="Controls"

export default Vue.component("bch-variant-search", {
    components: {
        CriterionListGroup,
        FilterEnumeration,
        Documentation,
        TooltipDocumentation,
        Formatters,
        CsvDownload,
    },
    props: ["variants", "filter", "gene"],
    data() {
        return {
            perPage: 24,
            currentPage: 1,

            //variants: [],
            consequences: {},
            fields: [
                {
                    key: "varID",
                    label: "Variant",
                },
                {
                    key: "Gene_Symbol",
                    label: "Gene Symbol"
                },
                {
                    key: "Max_Impact",
                    label: "Max Impact"
                },
                {
                    key: "max_consequence",
                    label: "Max Consequence"
                },
                {
                    key: "Protein_Position",
                    label: "Protein Position"
                },
                {
                    key: "Amino_Acids",
                    label: "Amino Acids"
                },
                {
                    key: "allelecount",
                    label: "Case Allele Count",
                },
                {
                    key: "allelnumber",
                    label: "Case Allele Number",
                },

                {
                    key: "allelefrequency",
                    label: "Case Allele Frequency",
                    sortable: true,
                },
                {
                    key: "TWO_ALT_GENO_CTS",
                    label: "Case Number of Homozygotes",
                    sortable: true,
                },

                {
                    key: "Phenotype",
                    label: "Phenotype Data",
                    class: "nowrap",
                },
//Max_Impact	Biotype Gene_Symbol	Transcript_count	Amino_Acids	Protein_Position	CDS_position	Refgene	max_consequence
                
                /*{
                    key: "view",
                    label: "View VEP Data",
                    class: "nowrap",
                }*/
                {
                    key: "c_allelecount",
                    label: "Control Allele Count",
                },
                {
                    key: "c_allelnumber",
                    label: "Control Allele Number",
                },

                {
                    key: "c_allelefrequency",
                    label: "Control Allele Frequency",
                    sortable: true,
                },
                {
                    key: "c_TWO_ALT_GENO_CTS",
                    label: "Control Number of Homozygotes",
                    sortable: true,
                },
            ],
            subFields: [
                {
                    key: "hpoterms",
                    label: "Phenotype",
                },
                {
                    key: "allelecount",
                    label: "Allele Count",
                    sortable: true
                },
                {
                    key: "allelnumber",
                    label: "Allele Number",
                },

                {
                    key: "allelefrequency",
                    label: "Allele Frequency",
                    sortable: true,
                },
                {
                    key: "TWO_ALT_GENO_CTS",
                    label: "Number of Homozygotes",
                    sortable: true,
                },
            ],
            /*subFields: [
                
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
            ],*/
            variantData: {},
            loadingData: {},
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
            /* if (this.variants && this.variants.length) {
                return this.variants;
            } else {
                return [];
            } */
            
            for(var i=0; i<this.variants.length; i++){
                this.variants[i].allelecount = 	2 * parseInt(this.variants[i].TWO_ALT_GENO_CTS) + parseInt(this.variants[i].GHET_REF_ALT_CTS);
                this.variants[i].allelnumber = 2 * (parseInt(this.variants[i].HOM_REF_CT) + parseInt(this.variants[i].GHET_REF_ALT_CTS) + parseInt(this.variants[i].TWO_ALT_GENO_CTS));
                this.variants[i].allelefrequency = this.variants[i].allelecount/this.variants[i].allelnumber;
                this.variants[i].allelefrequency = this.variants[i].allelefrequency.toExponential(2);
                for (var m=0; m<this.variants[i].hprecords.length; m++){
                    var hp = this.variants[i].hprecords[m];
                    if(hp.HP == "AllControl"){
                        
                        this.variants[i].c_allelecount = 2 * parseInt(hp.TWO_ALT_GENO_CTS) + parseInt(hp.HET_REF_ALT_CTS);
                        this.variants[i].c_allelnumber = 2 * (parseInt(hp.HOM_REF_CT) + parseInt(hp.HET_REF_ALT_CTS) + parseInt(this.variants[i].TWO_ALT_GENO_CTS));
                        this.variants[i].c_allelefrequency = this.variants[i].c_allelecount/this.variants[i].c_allelnumber;
                        this.variants[i].c_allelefrequency = this.variants[i].c_allelefrequency.toExponential(2);
                        this.variants[i].c_TWO_ALT_GENO_CTS = hp.TWO_ALT_GENO_CTS;
                    }
                }
                this.variants[i].vep = this.variants[i].veprecords.length;
                if(this.variants[i].vep >0){
                    
                    var varrecords = this.variants[i].veprecords;
                    for (var j=0; j<varrecords.length;j++){
                        if(varrecords[j].Gene_Symbol == this.gene[0]){
                            this.variants[i].Gene_Symbol = varrecords[j].Gene_Symbol;
                            this.variants[i].Max_Impact = varrecords[j].Max_Impact;
                            this.variants[i].max_consequence = varrecords[j].max_consequence;
                            this.variants[i].Protein_Position = varrecords[j].Protein_Position;
                            this.variants[i].Amino_Acids = varrecords[j].Amino_Acids;
                        }
                    }
//Max_Impact	Biotype Gene_Symbol	Transcript_count	Amino_Acids	Protein_Position	CDS_position	Refgene	max_consequence
                    
                }
                
                /*for(var j=0; j<varrecords.length;j++){
                    
                }*/
            }

            
            let dataRows = this.variants;
            /*dataRows = dataRows.filter((item) => {
                    return item.vep != 0;
                });*/

            /*if (!!this.filter) {
                dataRows = dataRows.filter((vep) => {
                    return this.filter(vep);
                });
            }*/
            return dataRows;
        },
        rows() {
            if (this.tableData) return this.tableData.length;
        },
        sortedData(hprecords) {
            console.log(hprecords);
            return hprecords.sort(function(a, b) {
                return a.allelecount > b.allelecount;
            })
        }
    },
    methods: {
        // async searchVariants() {
        //     this.currentPage = 1; //reset on new search
        //     this.variants = await query("variant-phenotype", this.geneRegion, query_private=false);
        //     console.log(this.variants);
        // },
        async getTranscriptConsequences(varID) {
            if (!!varID) {
                let data = await query("transcript-consequences", varID);
                return data;
            }
        },
        consequenceFormatter(consequence) {
            if (!!consequence) {
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
        showPhenoData(varID, hprecords){
            //console.log(varID);
            let escapedVarID = this.escapedVarID(varID);
            //alert(escapedVarID);
            var hpdisplay = [];
            var j = 0;
            if (this.variantData[escapedVarID] === undefined) {
                this.loadingData[escapedVarID] = true;
                
                for(var i=0; i< hprecords.length; i++){
                    var hp = hprecords[i];
                    if(hp.HP != "AllControl"){
                        hpdisplay[j]={};
                        hpdisplay[j].hpoterms = HPOTerms[hp.HP];
                        hpdisplay[j].allelecount = 	2 * hp.TWO_ALT_GENO_CTS + hp.HET_REF_ALT_CTS;
                        hpdisplay[j].allelnumber = 2 * (hp.HOM_REF_CT + hp.HET_REF_ALT_CTS + hp.TWO_ALT_GENO_CTS);
                        hpdisplay[j].allelefrequency = hpdisplay[j].allelecount/hpdisplay[j].allelnumber;
                        hpdisplay[j].allelefrequency = hpdisplay[j].allelefrequency.toExponential(2);
                        hpdisplay[j].TWO_ALT_GENO_CTS = hp.TWO_ALT_GENO_CTS;
                        j++;
                    }
                    
                }
                hpdisplay = hpdisplay.sort(function(a, b) {
                    //console.log(a.allelecount+"|"+b.allelecount+"|"+(a.allelecount>b.allelecount));
                    if (a.allelecount > b.allelecount){
                        return -1;
                    } else if (a.allelecount < b.allelecount){
                        return 1;
                    }
                    return 0;
                });
                //console.log(hprecords);
                Vue.set(this.variantData, escapedVarID, hpdisplay);
                this.loadingData[escapedVarID] = false;
            }
        }, 
        escapedVarID(varID) {
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
    watch: {
        // variants: {
        //     handler(val) {
        //         console.log("here:"+this.variants);
        //         if (!!val) this.searchVariants();
        //     },
        //     immediate: true,
        // },
    },
});
</script>
<style>
@import url("/css/table.css");
#bch-variant-search {
   overflow-y: scroll;
}
</style>
