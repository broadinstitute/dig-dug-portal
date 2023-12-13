<template>
    <div>
        <div v-if="rows > 0">
            <b-row>
                <b-col class="text-right mb-2">
                    <csv-download
                        v-if="tableData.length"
                        :data="tableData"
                        filename="pvital-table"
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
                    id="pvital"
                    >
                    
                </b-table>
                <b-pagination
                    class="pagination-sm justify-content-center"
                    v-model="currentPage"
                    :total-rows="rows"
                    :per-page="perPage"
                    aria-controls="pvital"
                ></b-pagination>
            </div>
        </div>
        <div v-else>
            <b-alert show variant="warning" class="text-center">
                <b-icon icon="exclamation-triangle"></b-icon> No vital information found.</b-alert
            >
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";
import { match, query } from "@/utils/bioIndexUtils";

export default Vue.component("patient-vital-card", {
    props: ["patientId", "filter"],
    data() {
        return {
            HPOTerms: {
				"HP-0000119": "Abnormality of the genitourinary system",
				"HP-0000152": "Abnormality of head or neck",
				"HP-0000478": "Abnormality of the eye",
				"HP-0000598": "Abnormality of the ear",
				"HP-0000707": "Abnormality of the nervous system",
				"HP-0000769": "Abnormality of the breast",
				"HP-0000818": "Abnormality of the endocrine system",
				"HP-0001197": "Abnormality of prenatal development or birth",
				"HP-0001507": "Growth abnormality",
				"HP-0001574": "Abnormality of the integument",
				"HP-0001608": "Abnormality of the voice",
				"HP-0001626": "Abnormality of the cardiovascular system",
				"HP-0001871": "Abnormality of blood and blood-forming tissues",
				"HP-0001939": "Abnormality of metabolism/homeostasis",
				"HP-0002086": "Abnormality of the respiratory system",
				"HP-0002664": "Neoplasm",
				"HP-0002715": "Abnormality of the immune system",
				"HP-0025031": "Abnormality of the digestive system",
				"HP-0025142": "Constitutional symptom",
				"HP-0025354": "Abnormal cellular phenotype",
				"HP-0033127": "Abnormality of the musculoskeletal system",
				"HP-0040064": "Abnormality of limbs",
				"HP-0045027": "Abnormality of the thoracic cavity",
				"isControl": "Controls",
                "isUnknown": "Unknown phenotype",
			},
            fields: [
                {
					key: "PATIENT_NUM",
					label: "Patient",
				},
				{
					key: "START_DATE",
					label: "Start",
					sortable: true,
				},
				{
					key: "CODE",
					label: "CODE",
					sortable: true,
				},

				{
					key: "DESCRIP",
					label: "DESCRIP",
					sortable: true,
				},
                {
					key: "VAL_TYPE",
					label: "VAL_TYPE",
					sortable: true,
				},
                {
					key: "NUM_VAL",
					label: "NUM_VAL",
					sortable: true,
				},
                {
					key: "TEXT_VAL",
					label: "TEXT_VAL",
					sortable: true,
				},
                {
					key: "UNITS",
					label: "UNITS",
				},
            ],
            pvital: [],
            perPage: 10,
            currentPage: 1,
        };
    },
    created() {
		if (this.patientId) {
			this.searchVital();
		}
	},
	computed: {
        rows() {
            return this.tableData.length;
        },
        tableData() {
            if (this.pvital && this.pvital.length) {
                //console.log("here:"+this.hprecords);
				return this.pvital;
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
        async searchVital() {
            //console.log("variant id:" + this.variantId);
            this.pvital = await query("patient_vital",this.patientId,{},true);
            
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
