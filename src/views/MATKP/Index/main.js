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

new Vue({
    store,

    components: {
        matkpHero,
        matkpNav,
        matkpFooter
    },

    data() {
        return{
            datasets: null,
            fields: [
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
        }
    },

    watch: {

    },

    computed: {
        filterOptions() {
            const filterOptions = {};

            if (!this.datasets) return filterOptions;
        
            // Get field keys for easy checking
            const fieldKeys = this.fields.map(field => field.key);
        
            this.datasets.forEach(item => {
                Object.keys(item).forEach(key => {
                if (Array.isArray(item[key]) && fieldKeys.includes(key)) {
                    if (!filterOptions[key]) {
                        filterOptions[key] = new Set();
                    }
                    item[key].forEach(value => {
                        filterOptions[key].add(value);
                    });
                }
                });
            });
        
            // Convert Sets to arrays and create options for select
            Object.keys(filterOptions).forEach(key => {
                filterOptions[key] = Array.from(filterOptions[key]).map(value => ({ value, text: value }));
            });
        
            return filterOptions;
        },
    },

    mounted() {
        this.getDatasets();
    },

    async created() {
        
    },

    methods: {
        async getDatasets(){
            const fetchPath = '/api/raw/file/single_cell_metadata/dataset_metadata.json.gz';
            const response = await fetch(`${BIO_INDEX_HOST}${fetchPath}`);
            const dataText = await response.text();
            const lines = dataText.split('\n').filter(line => line.trim() !== '');
            const jsonObjects = lines.map(line => JSON.parse(line));
            this.datasets = jsonObjects;
            //this.filteredCount = this.datasets.length;
            console.log(this.datasets);
            console.log(this.filterOptions);
            //this.filterOptions(jsonObjects);
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },

    
}).$mount("#app");
