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
            datasets: null,
            filter: null,
            filteredCount: 0,
            selectedFilters: {},
        }
    },

    watch: {
        filterOptions: {
            handler(newVal) {
              Object.keys(newVal).forEach(key => {
                if (!this.selectedFilters[key]) {
                  this.$set(this.selectedFilters, key, []);
                }
              });
            },
            immediate: true
        }
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
        filteredItems() {
            if (!this.datasets) return [];
            return this.datasets.filter(item => {
                return Object.keys(this.selectedFilters).every(key => {
                    if (this.selectedFilters[key].length === 0) return true;
                    return this.selectedFilters[key].some(filterValue => item[key].includes(filterValue));
                });
            });
        },
    },

    mounted() {
        document.querySelector('.input-overlay').addEventListener('click', this.handleClickOutside);
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
            this.datasets = jsonObjects;
            //this.filteredCount = this.datasets.length;
            console.log(this.datasets);
            //this.filterOptions(jsonObjects);
        },
        onFiltered(filteredItems) {
            this.filteredCount = filteredItems.length === 0 ? 0 : filteredItems.length;
            console.log(this.filteredCount);
        },
        showInputOptions(e){
            console.log(e.target);
            const key = e.target.dataset.inputKey;
            document.querySelector(`[data-input-options-key="${key}"`).classList.remove('hidden');
            document.querySelector('.input-overlay').classList.remove('hidden');
        },
        handleClickOutside(e){
            document.querySelectorAll('.input-options').forEach(input => {
                if(!input.classList.contains('hidden'))input.classList.add('hidden');
            });
            document.querySelector('.input-overlay').classList.add('hidden');
        },
        removeInputOption(e){
            const key = e.target.dataset.inputKey;
            const option = e.target.dataset.inputOption;
            const index = this.selectedFilters[key].indexOf(option);
            if (index !== -1) this.selectedFilters[key].splice(index, 1);
        },
        addInputOption(e){
            const key = e.target.dataset.inputKey;
            const option = e.target.dataset.inputOption;
            const index = this.selectedFilters[key].indexOf(option);
            if (index !== -1) this.selectedFilters[key].splice(index, 1);
        }
        /*filterOptions(items) {
            const filterOptions = {};
      
            items.forEach(item => {
              Object.keys(item).forEach(key => {
                if (Array.isArray(item[key])) {
                  if (!filterOptions[key]) {
                    filterOptions[key] = new Set();
                  }
                  item[key].forEach(value => {
                    filterOptions[key].add(value);
                  });
                }
              });
            });
      
            // Convert Sets to arrays and create options for b-form-select
            Object.keys(filterOptions).forEach(key => {
              filterOptions[key] = Array.from(filterOptions[key]).map(value => ({ value, text: value }));
            });
      
            console.log(filterOptions);
        },*/
    },

    render(createElement, context) {
        return createElement(Template);
    },

    
}).$mount("#app");
