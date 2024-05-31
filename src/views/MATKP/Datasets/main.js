import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import Template from "./Template.vue";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import '../assets/styles.css';

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);
Vue.config.productionTip = false;

import matkpNav from "../components/matkp-nav.vue"
import matkpFooter from "../components/matkp-footer.vue"
import * as d3 from "d3";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";

//import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils"; 

const BIO_INDEX_HOST = 'https://bioindex-dev.hugeamp.org';

new Vue({
    components: {
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
            filteredCount: 0,
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
        },
        onFiltered(filteredItems) {
            console.log(filteredItems);
            this.filteredCount = filteredItems.length;
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },

    
}).$mount("#app");
