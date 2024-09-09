import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import Template from "./Template.vue";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "../assets/matkp-styles.css"

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);
Vue.config.productionTip = false;

import matkpNav from "../components/matkp-nav.vue"
import matkpFooter from "../components/matkp-footer.vue"
import keyParams from "@/utils/keyParams";
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
            selectedFilters: {},
            searchedItems: [],
            perPage: 5,
            currentPage: 1,
            pageOptions: [{ value: 5, text: "5" }, { value: 10, text: "10" }, { value: 15, text: "20" }, { value: 100, text: "All" }],
            first: 2,
        }
    },

    mounted() {
        document.querySelector('.input-overlay').addEventListener('click', this.handleClickOutside);
    },

    async created() {
        this.getDatasets();
    },

    watch: {
        filterOptions: {
            handler(newVal) {
              Object.keys(newVal).forEach(key => {
                if (!this.selectedFilters[key]) {
                  this.$set(this.selectedFilters, key, []);
                }
              });
              this.updatePageFromQueryString();
            },
        },
        selectedFilters: {
            handler(newVal) {
                this.updateQueryStringFromPage(this.selectedFilters);
            },
            deep: true,
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
        rows() {
            if(!this.datasets) return 0;
            if(this.filter){
                if(this.searchedItems.length > 0 || this.filteredItems.length < this.datasets.length){
                    if(this.searchedItems.length > 0 && this.filteredItems.length < this.searchedItems.length) return this.filteredItems.length;
                    return this.searchedItems.length;
                }
                return 0;
            }
            if(this.filteredItems.length < this.datasets.length) return this.filteredItems.length;
            return this.datasets.length;
        }
    },

    

    methods: {
        async getDatasets(){
            const fetchPath = '/api/raw/file/single_cell_metadata/dataset_metadata.json.gz';
            const response = await fetch(`${BIO_INDEX_HOST}${fetchPath}`);
            const dataText = await response.text();
            console.log(dataText);
            const lines = dataText.split('\n').filter(line => line.trim() !== '');
            const jsonObjects = lines.map(line => JSON.parse(line));
            this.datasets = jsonObjects;
        },
        updateQueryStringFromPage(selectedFilters){
            const queryParams = [];
            for(const [key, value] of Object.entries(selectedFilters)){
                if(value.length>0) {
                    const encodedValues = value.map(v => encodeURIComponent(v.toLowerCase())).join(',');
                    queryParams.push(`${encodeURIComponent(key)}=${encodedValues}`);
                }
            }
            const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';
            const newUrl = `${window.location.origin}${window.location.pathname}${queryString}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
        },
        updatePageFromQueryString(){
            const urlSearchParams = new URLSearchParams(window.location.search);
            const params = Object.fromEntries(urlSearchParams.entries());
            for(const [key, value] of Object.entries(params)){
                const values = value.split(",");
                for(const v of values){
                    const options = this.filterOptions[key]
                        .map(option => option.value.toLowerCase());
                    const indices = options
                        .map((str, index) => (str.includes(v) ? index : -1))
                        .filter(index => index !== -1);
                    for(const i of indices){
                        this.selectedFilters[key].push(this.filterOptions[key][i].value);
                    }
                }
            }
        },
        onFiltered(filteredItems) {
            //unused
            this.searchedItems = filteredItems;
            this.filteredCount = filteredItems.length;
        },
        showInputOptions(e){
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
            if (index === -1) {
                this.selectedFilters[key].push(option);
                this.$nextTick(() => {
                    e.target.dispatchEvent(new Event('mouseover'));
                });
            }else{
                this.removeInputOption(e);
            }
        },
        highlightTableItems(e){
            const key = e.target.dataset.inputKey;
            const option = e.target.dataset.inputOption;
            const index = this.selectedFilters[key].indexOf(option);
            if (index !== -1) {
                document.querySelector(`.input-list > *[data-input-key="${key}"][data-input-option="${option}"]`).classList.add('highlight')
            }else{
                document.querySelector(`.filter .filter-count[data-input-key="${key}"]`).classList.add('highlight')
            }
        },
        unHighlightTableItems(e){
            const key = e.target.dataset.inputKey;
            const option = e.target.dataset.inputOption;
            const index = this.selectedFilters[key].indexOf(option);
            if (index !== -1) {
                document.querySelector(`.input-list > *[data-input-key="${key}"][data-input-option="${option}"]`).classList.remove('highlight')
            }else{
                document.querySelector(`.filter .filter-count[data-input-key="${key}"]`).classList.remove('highlight')
            }
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },

    
}).$mount("#app");
