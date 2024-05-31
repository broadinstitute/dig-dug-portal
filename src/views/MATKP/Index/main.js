import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import '../assets/styles.css';

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);
Vue.config.productionTip = false;

import matkpNav from "../components/matkp-nav.vue"
import matkpHero from "../components/matkp-hero.vue"
import matkpFooter from "../components/matkp-footer.vue"
import * as d3 from "d3";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";

//import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils"; 

const BIO_INDEX_HOST = 'https://bioindex-dev.hugeamp.org';

const DATASETS = `ID	Name	Species	Depot	Tissue	Sample type	Method	Platform	Total Cells	Authors	Publication Date	Publication	Doi	Download
SingleCell_Emont2022_Humans_SCP1376	A single cell atlas of human and mouse white adipose tissue	Human	Omental fat pad, Subcutaneous adipose tissue	Subcutaneous adipose tissue (SAT), Visceral adipose tissue (VAT)	Subcutaneous stromal vascular fraction (SVF)	Single-nucleus RNA-seq	10x 3' v3 sequencing	166,149	Emont MP et al.	2022 Mar	Nature	10.1038/s41586-022-04518-2	https://singlecell.broadinstitute.org/single_cell/study/SCP1376/a-single-cell-atlas-of-human-and-mouse-white-adipose-tissue#study-summary
SingleCell_Emont2022_Mouse_SCP1376_SN_ING	A single cell atlas of human and mouse white adipose tissue	Mouse	Inguinal fat pad	Inguinal adipose tissue (ING)		Single-nucleus RNA-seq	10x 3' v3 sequencing	91,252	Emont MP et al.	2022 Mar	Nature	10.1038/s41586-022-04518-3	https://singlecell.broadinstitute.org/single_cell/study/SCP1376/a-single-cell-atlas-of-human-and-mouse-white-adipose-tissue#study-summary
SingleCell_Emont2022_Mouse_SCP1376_SN_PG	A single cell atlas of human and mouse white adipose tissue	Mouse	Epididymal fat pad, periovarian fat pad	Perigonadal adipose tissue (PG)		Single-nucleus RNA-seq	10x 3' v3 sequencing	106,469	Emont MP et al.	2022 Mar	Nature	10.1038/s41586-022-04518-4	https://singlecell.broadinstitute.org/single_cell/study/SCP1376/a-single-cell-atlas-of-human-and-mouse-white-adipose-tissue#study-summary
SingleCell_Li2022_Mouse_SCP708_WC_BAT	Neurotensin is an anti-thermogenic peptide produced by lymphatic endothelial cells	Mouse	Brown adipose tissue	Brown adipose tissue (BAT)		Single-cell RNA-seq	Drop-seq	3,364	Li J et al.	2021 Jul	Cell Metab	10.1016/j.cmet.2021.04.019	https://singlecell.broadinstitute.org/single_cell/study/SCP708/mouse-adipose-stromal-vascular-fraction#study-summary
SingleCell_Li2022_Mouse_SCP708_WC_EPI	Neurotensin is an anti-thermogenic peptide produced by lymphatic endothelial cells	Mouse	Epididymal fat pad	Epididymal fat pad (EPI)		Single-cell RNA-seq	Drop-seq	11,828	Li J et al.	2021 Jul	Cell Metab	10.1016/j.cmet.2021.04.020	https://singlecell.broadinstitute.org/single_cell/study/SCP708/mouse-adipose-stromal-vascular-fraction#study-summary
SingleCell_Li2022_Mouse_SCP708_WC_ING	Neurotensin is an anti-thermogenic peptide produced by lymphatic endothelial cells	Mouse	Inguinal fat pad	Inguinal fat pad (ING)		Single-cell RNA-seq	Drop-seq	7,608	Li J et al.	2021 Jul	Cell Metab	10.1016/j.cmet.2021.04.021	https://singlecell.broadinstitute.org/single_cell/study/SCP708/mouse-adipose-stromal-vascular-fraction#study-summary
SingleCell_Li2022_MouseSVF_SCP708	Neurotensin is an anti-thermogenic peptide produced by lymphatic endothelial cells	Mouse	Brown adipose tissue, Epididymal fat pad, Inguinal fat pad	Brown adipose tissue (BAT), Epididymal fat pad (EPI), Inguinal fat pad (ING)		Single-cell RNA-seq	Drop-seq	22,800	Li J et al.	2021 Jul	Cell Metab	10.1016/j.cmet.2021.04.022	https://singlecell.broadinstitute.org/single_cell/study/SCP708/mouse-adipose-stromal-vascular-fraction#study-summary`;

//metadata all datasets https://bioindex-dev.hugeamp.org/api/raw/file/single_cell_metadata/dataset_metadata.json.gz
//metadata 1   dataset  https://bioindex-dev.hugeamp.org/api/bio/query/single-cell-metadata?q=[dataset_id]

new Vue({
    store,

    components: {
        matkpHero,
        matkpNav,
        matkpFooter
    },

    data() {
        return{
            datasetsFields: [
                {key:"datasetName", label:"Name", tdClass: 'italic', sortable: true}, 
                {key:"species", label:"Species", sortable: true}, 
                {key:"depot", label:"Depot", sortable: false},
                {key:"tissue", label:"Tissue", sortable: false},
                {key:"sampleType", label:"Sample", sortable: false},
                {key:"sex", label:"Sex", sortable: false},
                {key:"ethnicity", label:"Ethnicity", sortable: false},
                {key:"method", label:"Method", sortable: false}, 
                {key:"platform", label:"Platform", sortable: false}, 
                {key:"totalCells", label:"Cells", sortable: true}, 
                //{key:"Download", label:"", sortable: false},
                {key:"datasetId", label:"", sortable: false},
            ],
            datasets: null,
            filter: null,
        }
    },

    watch: {

    },

    computed: {
    },

    mounted() {
    },

    async created() {
        this.getDatasets();
    },

    methods: {
        async getDatasets(){
            const fetchPath = '/api/raw/file/single_cell_metadata/dataset_metadata.json.gz';
            const response = await fetch(`${BIO_INDEX_HOST}${fetchPath}`);
            const dataText = await response.text();
            const lines = dataText.split('\n').filter(line => line.trim() !== '');
            const jsonObjects = lines.map(line => JSON.parse(line));

            //let datasets = this.tsvToJson(DATASETS);
            //datasets = this.checkForLists(datasets);
            //datasets = this.filterColumns(datasets, this.datasetsFields);
            /*this.datasetsFields = this.datasetsFields.map(field => ({
                key: field,
                sortable: true
            }));*/
            this.datasets = jsonObjects
            console.log(this.datasets);
        },
        tsvToJson (tsvString) {
            const lines = tsvString.split('\n');
            const headers = lines.shift().split('\t');
            const jsonArray = [];
    
            lines.forEach(line => {
                const values = line.split('\t');
                const obj = {};
                
                headers.forEach((header, index) => {
                    obj[header] = values[index];
                });
    
                jsonArray.push(obj);
            });
    
            return jsonArray;
        },
        checkForLists(array){
            array.forEach(item => {
                for(const [key, value] of Object.entries(item)){
                    const isNumberWithCommas = /^\d{1,3}(,\d{3})*(\.\d+)?$/.test(item[key]);
                    if(item[key].indexOf(',')>0 && !isNumberWithCommas) item[key] = value.split(',');
                }
            })
            return array;
        },
        filterColumns(data, fields) {
            return data.map(row => {
                return fields.reduce((filteredRow, field) => {
                    if (row.hasOwnProperty(field)) {
                        filteredRow[field] = row[field];
                    }
                    return filteredRow;
                }, {});
            });
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },

    
}).$mount("#app");
