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
				"HP0000119": "Abnormality of the genitourinary system",
				"HP0000152": "Abnormality of head or neck",
				"HP0000478": "Abnormality of the eye",
				"HP0000598": "Abnormality of the ear",
				"HP0000707": "Abnormality of the nervous system",
				"HP0000769": "Abnormality of the breast",
				"HP0000818": "Abnormality of the endocrine system",
				"HP0001197": "Abnormality of prenatal development or birth",
				"HP0001507": "Growth abnormality",
				"HP0001574": "Abnormality of the integument",
				"HP0001608": "Abnormality of the voice",
				"HP0001626": "Abnormality of the cardiovascular system",
				"HP0001871": "Abnormality of blood and blood-forming tissues",
				"HP0001939": "Abnormality of metabolism/homeostasis",
				"HP0002086": "Abnormality of the respiratory system",
				"HP0002664": "Neoplasm",
				"HP0002715": "Abnormality of the immune system",
				"HP0025031": "Abnormality of the digestive system",
				"HP0025142": "Constitutional symptom",
				"HP0025354": "Abnormal cellular phenotype",
				"HP0033127": "Abnormality of the musculoskeletal system",
				"HP0040064": "Abnormality of limbs",
				"HP0045027": "Abnormality of the thoracic cavity",
				"isControl": "Controls",
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
                if (!this.variantsample[n]['sample_ID'].startsWith('BCH')){
                    //console.log(this.variantsample[n]['sample_ID']);
                    this.variantsample[n]['sample_ID'] = '******';
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
