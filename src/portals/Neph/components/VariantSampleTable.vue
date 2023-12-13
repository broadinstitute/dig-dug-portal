<template>
    <div>
        <div v-if="rows > 0">
            <b-row>
                <b-col class="text-right mb-2">
                    <csv-download
                        v-if="tableData.length"
                        :data="tableData"
                        filename="variant-sample-table"
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
                    id="variantsample"
                    >
                    <template #cell(sample_ID)="data">
                        
                        <a 
                        v-if="data.item.sample_ID != '******'"
                        :href="`/patient.html?patient=${data.item.sample_ID}`">{{
                            data.item.sample_ID
                        }}</a>
                        <div v-if="data.item.sample_ID == '******'">{{
                            data.item.sample_ID
                        }}</div>
                    </template>   
                </b-table>
                <b-pagination
                    class="pagination-sm justify-content-center"
                    v-model="currentPage"
                    :total-rows="rows"
                    :per-page="perPage"
                    aria-controls="variantsample"
                ></b-pagination>
            </div>
        </div>
        <div v-else>
            <b-alert show variant="warning" class="text-center">
                <b-icon icon="exclamation-triangle"></b-icon> No Sample information found.</b-alert
            >
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";
import { match, query } from "@/utils/bioIndexUtils";

export default Vue.component("variant-sample-table", {
    props: ["samples", "filter"],
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
				{
					key: "HPO_terms",
					label: "HPO Terms",
				},
            ],
            variantsample: [],
            perPage: 10,
            currentPage: 1,
            user: Vue.prototype.$useremail.toLowerCase(),
            sampleIDaccessGroup: Vue.prototype.$sampleIDaccess,
        };
    },
    created() {
		//if (this.patientId) {
			this.searchSample();
		//}
	},
	computed: {
        rows() {
            return this.tableData.length;
        },
        tableData() {
            if (this.variantsample && this.variantsample.length) {
                //console.log("here:"+this.hprecords);
				return this.variantsample;
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
        async searchSample() {
            //console.log("samples:" + JSON.stringify(this.samples));
            //variantsample = await query("patient_laboratory",this.patientId,{},true);
            let n = 0;
            //this.variantsample = [];
            for (let k = 0;k < this.samples.length;k++) {
                //console.log("samples:" + JSON.stringify(this.samples[k]));
                this.variantsample[n]=this.samples[k];
                let hp = this.variantsample[n]['HPO_terms'];
                //console.log(hp);
                //hp = hp.replace("HP","HP-");
                if (hp.substring(hp.length - 7) == "Control"){
                    hp = "isControl";
                } else {
                    hp = "HP" + hp.substring(hp.length - 7);
                }
                let user = Vue.prototype.$useremail.toLowerCase();
                let accessgroup = Vue.prototype.$sampleIDaccess;
                console.log(accessgroup);
                if (! accessgroup.includes(user)){
                    //if (!this.variantsample[n]['sample_ID'].startsWith('BCH') || this.variantsample[n]['investigator']=='clinical_sequencing'){
                    if (this.variantsample[n]['inCRDC']=="no"){
                        //console.log(this.variantsample[n]['sample_ID']);
                        this.variantsample[n]['sample_ID'] = '******';
                    }
                }
                this.variantsample[n]['HPO_terms'] = Formatters.snakeFormatter(
                            this.HPOTerms[hp]
                        );
                n++;
                //console.log(hp);
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
</style>
