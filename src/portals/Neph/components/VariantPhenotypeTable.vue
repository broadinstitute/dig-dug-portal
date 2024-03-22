<template>
    <div>
        <div v-if="rows > 0">
            <b-row>
                <b-col class="text-right mb-2">
                    <csv-download
                        v-if="tableData.length"
                        :data="tableData"
                        filename="phenotypes-table"
                    ></csv-download
                ></b-col>
            </b-row>
            <div v-show="tableData.length">
                <b-table
                    hover
                    small
                    sort-icon-left
                    responsive="sm"
                    :items="tableData"
                    :fields="fields"
                    :current-page="currentPage"
				    :per-page="perPage"
                    :tbody-tr-class="rowPickClass"
                    id="variantphenotype"
                    >
                    <template #cell(varId)="data">
                        <a :href="`/variant.html?variant=${data.item.varId}`">{{
                            data.item.varId
                        }}</a>
                    </template>
                    <!-- <template #head(transcriptId)="data">
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
                    <template #cell(position)="data">
                        {{
                            data.item.proteinStart !== data.item.proteinEnd
                                ? `${data.item.proteinStart}-${data.item.proteinEnd}`
                                : data.item.proteinStart
                        }}
                    </template>
                    <template #cell(consequenceTerms)="data">
                        <div class="border-color" :class="data.item.impact">
                            <span
                                v-for="(c, i) in data.item.consequenceTerms"
                                :key="c"
                                >{{ consequenceFormatter(c)
                                }}{{
                                    i < data.item.consequenceTerms.length - 1
                                        ? ", "
                                        : ""
                                }}</span
                            >
                        </div></template
                    >
                    <template #cell(siftPrediction)="data">
                        {{ siftFormatter(data.item.siftPrediction) }}
                    </template> -->
                    <template #cell(hpoterms)="data">
                        <a :href="`/phenotype.html?phenotype=${data.item.hp}`">{{
                            data.item.hpoterms
                        }}</a>
                    </template>
                    <template #cell(view)="data">
                        <b-btn
                            v-if="data.item.samples.length === 0"
                            disabled
                            size="sm"
                            class="btn-mini"
                            variant="outline-secondary"
                            >No Sample</b-btn
                        >
                        <b-btn
                            v-else
                            size="sm"
                            variant="outline-primary"
                            class="btn-mini showData"
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
                            Samples</span
                            >
                        </b-btn>
                    </template>
                    <template #row-details="row">
                        <div class="details">
                            <b-table
                                v-if="row.item.samples.length > 0 &&
								    showButton === 1"
                                :items="row.item.samples"
                                :fields="subFields"
                                :per-page="perPagephenotype"
                                :tbody-tr-class="rowPickClass"
                            >
                            
                            <template #cell(sample_ID)="row">
                                <a 
                                    v-if="row.item.sample_ID != '******'"
                                    :href="`/patient.html?patient=${row.item.sample_ID}`">{{
                                        row.item.sample_ID
                                    }}</a>
                                    <div v-if="row.item.sample_ID == '******'">{{
                                        row.item.sample_ID
                                    }}</div>
                            </template>
                                <!-- <template #cell(allelecount)="row">
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
                                <template #cell(TWO_ALT_GENO_CTS)="row">
                                    <div align="right">
                                        {{ row.item.TWO_ALT_GENO_CTS }}
                                    </div>
                                </template> -->
                                
                            </b-table>
                        </div>
                    </template>
                </b-table>
                <b-pagination
                    class="pagination-sm justify-content-center"
                    v-model="currentPage"
                    :total-rows="rows"
                    :per-page="perPage"
                    aria-controls="variantphenotype"
                ></b-pagination>
            </div>
        </div>
        <div v-else>
            <b-alert show variant="warning" class="text-center">
                <b-icon icon="exclamation-triangle"></b-icon> No predicted
                transcript consequences found.</b-alert
            >
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";
import { match, query } from "@/utils/bioIndexUtils";

export default Vue.component("variant-phenotype-table", {
    props: ["variantId", "samples","filter"],
    data() {
        return {
            HPOTerms: {
				"HP0000009":"Functional abnormality of the bladder",
                "HP0000020":"Urinary incontinence",
                "HP0000079":"Abnormality of the urinary system",
                "HP0000095":"Abnormal renal glomerulus morphology",
                "HP0000118":"Phenotypic abnormality",
                "HP0000119":"Abnormality of the genitourinary system",
                "HP0000152":"Abnormality of head or neck",
                "HP0000359":"Abnormality of the inner ear",
                "HP0000407":"Sensorineural hearing impairment",
                "HP0000478":"Abnormality of the eye",
                "HP0000486":"Strabismus",
                "HP0000598":"Abnormality of the ear",
                "HP0000707":"Abnormality of the nervous system",
                "HP0000709":"Psychosis",
                "HP0000716":"Depressivity",
                "HP0000717":"Autism",
                "HP0000725":"Psychotic episodes",
                "HP0000738":"Hallucinations",
                "HP0000769":"Abnormality of the breast",
                "HP0000787":"Nephrolithiasis",
                "HP0000795":"Abnormality of the urethra",
                "HP0000818":"Abnormality of the endocrine system",
                "HP0000826":"Precocious puberty",
                "HP0001197":"Abnormality of prenatal development or birth",
                "HP0001388":"Joint laxity",
                "HP0001507":"Growth abnormality",
                "HP0001574":"Abnormality of the integument",
                "HP0001608":"Abnormality of the voice",
                "HP0001622":"Premature birth",
                "HP0001626":"Abnormality of the cardiovascular system",
                "HP0001679":"Abnormal aortic morphology",
                "HP0001699":"Sudden death",
                "HP0001871":"Abnormality of blood and blood-forming tissues",
                "HP0001877":"Abnormal erythrocyte morphology",
                "HP0001903":"Anemia",
                "HP0001939":"Abnormality of metabolism/homeostasis",
                "HP0001945":"Fever",
                "HP0002028":"Chronic diarrhea",
                "HP0002032":"Esophageal atresia",
                "HP0002086":"Abnormality of the respiratory system",
                "HP0002088":"Abnormal lung morphology",
                "HP0002110":"Bronchiectasis",
                "HP0002186":"Apraxia",
                "HP0002197":"Generalized-onset seizure",
                "HP0002533":"Abnormal posturing",
                "HP0002589":"Gastrointestinal atresia",
                "HP0002664":"Neoplasm",
                "HP0002715":"Abnormality of the immune system",
                "HP0002836":"Bladder exstrophy",
                "HP0003011":"Abnormality of the musculature",
                "HP0004322":"Short stature",
                "HP0004386":"Gastrointestinal inflammation",
                "HP0005341":"Autonomic bladder dysfunction",
                "HP0005528":"Bone marrow hypocellularity",
                "HP0007018":"Attention deficit hyperactivity disorder",
                "HP0008373":"Puberty and gonadal disorders",
                "HP0008443":"Spinal deformities",
                "HP0009826":"Limb undergrowth",
                "HP0011035":"Abnormal renal cortex morphology",
                "HP0012639":"Abnormal nervous system morphology",
                "HP0020110":"Bone fracture",
                "HP0025031":"Abnormality of the digestive system",
                "HP0025142":"Constitutional symptom",
                "HP0025354":"Abnormal cellular phenotype",
                "HP0031263":"Abnormal renal corpuscle morphology",
                "HP0033127":"Abnormality of the musculoskeletal system",
                "HP0040064":"Abnormality of limbs",
                "HP0040069":"Abnormal lower limb bone morphology",
                "HP0045027":"Abnormality of the thoracic cavity",
                "HP0100021":"Cerebral palsy",
                "HP0100280":"Crohn's disease",
                "HP0100820":"Glomerulopathy",
                "HP0200134":"Epileptic encephalopathy",
				"isControl": "Controls",
                "isUnknown": "Unknown phenotype",
			},
            fields: [
                {
					key: "hpoterms",
					label: "Phenotype",
				},
				{
					key: "allelecount",
					label: "Allele Count",
					sortable: true,
                    thClass: 'text-right',
    				tdClass: 'text-right',
				},
				{
					key: "allelnumber",
					label: "Allele Number",
					sortable: true,
                    thClass: 'text-right',
    				tdClass: 'text-right',
				},

				{
					key: "allelefrequency",
					label: "Allele Frequency",
					sortable: true,
                    thClass: 'text-right',
    				tdClass: 'text-right',
				},
				{
					key: "TWO_ALT_GENO_CTS",
					label: "Homozygotes",
					sortable: true,
                    thClass: 'text-right',
    				tdClass: 'text-right',
				},
                {
					key: "view",
					label: "View Additional Data",
					class: "nowrap",
                    thClass: 'text-right',
    				tdClass: 'text-right',
				},
            ],
            subFields: [
				{
					key: "variant_ID",
					label: "Variant",
				},
				{
					key: "sample_ID",
					label: "Sample",
				},
				{
					key: "trioinfo",
					label: "Inheritance",
				},
				{
					key: "investigator",
					label: "Investigator",
				},
				{
					key: "N_alleles",
					label: "Alleles Number",
				},
				/*{
					key: "HPO_terms",
					label: "HPO Terms",
				},*/
			],
            hprecords: [],
            perPage: 10,
            perPagephenotype:5,
            currentPage: 1,
            //user: Vue.prototype.$useremail.toLowerCase(),
            //sampleIDaccessGroup: Vue.prototype.$sampleIDaccess,
        };
    },
    created() {
		if (this.variantId) {
			this.searchVariants();
		}
	},
	computed: {
        rows() {
            return this.tableData.length;
        },
        tableData() {
            if (this.hprecords && this.hprecords.length) {
                //console.log("here:"+this.hprecords);
				return this.hprecords;
			} else {
				return [];
			}
            /*let dataRows = this.variant.hprecords;
            if (!!this.filter) {
                dataRows = dataRows.filter((association) => {
                    return this.filter(association);
                });
            }
            return dataRows;*/
        },
    },
    methods: {
        consequenceFormatter: Formatters.consequenceFormatter,
        siftFormatter(name) {
            return Formatters.snakeFormatter(name);
        },
        async searchVariants() {
            //console.log("variant id:" + this.variantId);
            //let user = Vue.prototype.$useremail.toLowerCase();
            //console.log(user);
            let varinfo = this.variantId.split(":");
            let searchquery = varinfo[0]+":"+varinfo[1];
            this.variant = await query("gene-variants",searchquery,{},true);
            this.samples = await query("variant-sample", this.variantId, {}, true)
            //console.log("samples:"+JSON.stringify(this.samples));

            //console.log(JSON.stringify(this.variant))
            let hpdisplay = [];
            let j = 0;

            for (let k = 0;k < this.variant[0].hprecords.length;k++) {
                let hp = this.variant[0].hprecords[k];
                //if (hp.HP != "AllControl") {
                    hpdisplay[j] = {};
                    //hpdisplay[j].hpoterms = this.HPOTerms[hp.HP];
                    //hp.HP = hp.HP.replace("-","")
                    //console.log(hp.HP);
                    let hpindex = hp.phenotype;
                    hpindex = hpindex.replace("-", "");
                    //console.log(hpindex);
                    hpdisplay[j].hp = hp.phenotype;
                    hpdisplay[j].hpoterms =
                        Formatters.snakeFormatter(
                            //this.HPOTerms[hp.HP]
                            this.HPOTerms[hpindex]
                        );
                    if (hpdisplay[j].hp.length == 9){
                        hpdisplay[j].hp = hpdisplay[j].hp.replace("HP", "HP-")
                    }
                    
                    hpdisplay[j].allelecount =2 * parseInt(hp.twoAlterGenoCount) +parseInt(hp.herterozygousAltCount);
                    hpdisplay[j].allelnumber =2 *(parseInt(hp.homozygousCount) +parseInt(hp.herterozygousAltCount) +parseInt(hp.twoAlterGenoCount));
                    hpdisplay[j].allelefrequency =
                        this.formatAlleleFrequency(
                            hpdisplay[j].allelecount,
                            hpdisplay[j].allelnumber
                        );

                    hpdisplay[j].twoAlterGenoCount =
                        hp.twoAlterGenoCount;

                    hpdisplay[j].samples=[];
                    let n=0;
                    for(let m=0; m < this.samples.length; m++){
                        if (this.samples[m].HPO_terms.substring(this.samples[m].HPO_terms.length-7) == hpindex.substring(hpindex.length-7)){
                            hpdisplay[j].samples[n]=this.samples[m];
                            let user = Vue.prototype.$useremail.toLowerCase();
                            let accessgroup = Vue.prototype.$sampleIDaccess;
                            if (! accessgroup.includes(user)){
                                //if (!hpdisplay[j].samples[n]['sample_ID'].startsWith("BCH") || hpdisplay[j].samples[n]['investigator']=='clinical_sequencing'){
                                //console.log(hpdisplay[j].samples[n]['inCRDC']);
                                if (hpdisplay[j].samples[n]['inCRDC']=="no"){
                                    hpdisplay[j].samples[n]['sample_ID']='******'
                                }
                            }
                            n++;
                        }
                    }
                    j++;
                //}
            }
            //console.log(hpdisplay);
            hpdisplay = hpdisplay.sort(function (a, b) {
                //console.log(a.allelecount+"|"+b.allelecount+"|"+(a.allelecount>b.allelecount));
                if (a.allelecount > b.allelecount) {
                    return -1;
                } else if (a.allelecount < b.allelecount) {
                    return 1;
                }
                return 0;
            });
            this.hprecords = hpdisplay;

            //console.log("results:"+JSON.stringify(this.variant[0].hprecords));
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
        formatAlleleFrequency(count, number) {
			if (count === 0 || number === 0) return 0;
			else return Number.parseFloat(count / number).toExponential(2);
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
</style>
