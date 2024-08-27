import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "../assets/matkp-styles.css"

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

            depotsByCategory: null,
            anatomyScale: 1.85, //svg display size / svg actual size
            depots: {
                human:[
                    {
                        "name": "craniofacial",
                        "ontology": "h1",
                        "category": "cranio-cervical",
                        "pos": [[55.671,15.214],[51.291,0.461]]
                    },{
                        "name": "retroorbital",
                        "ontology": "h2",
                        "category": "cranio-cervical",
                        "pos": [[47.873,11.424]]
                    },{
                        "name": "submental",
                        "ontology": "h3",
                        "category": "subcutaneous",
                        "pos": [[51.140,27.393]]
                    },{
                        "name": "perithyroidal",
                        "ontology": "h4",
                        "category": "cranio-cervical",
                        "pos": [[49.803,29.329]]
                    },{
                        "name": "cervical",
                        "ontology": "h5",
                        "category": "subcutaneous",
                        "pos": [[55.858,25.095]]
                    },{
                        "name": "superclavicular",
                        "ontology": "h6",
                        "category": "subcutaneous",
                        "pos": [[58.641,31.386]]
                    },{
                        "name": "periaortic",
                        "ontology": "h7",
                        "category": "visceral",
                        "pos": [[53.075,39.370]]
                    },{
                        "name": "axillary",
                        "ontology": "h8",
                        "category": "subcutaneous",
                        "pos": [[34.807,39.975]]
                    },{
                        "name": "intercostal",
                        "ontology": "h9",
                        "category": "thoracic",
                        "pos": [[43.397,42.152]]
                    },{
                        "name": "mediastinal",
                        "ontology": "h10",
                        "category": "thoracic",
                        "pos": [[49.567,46.508]]
                    },{
                        "name": "paravertebral",
                        "ontology": "h11",
                        "category": "thoracic",
                        "pos": [[49.083,52.436],[53.559,52.436]]
                    },{
                        "name": "epicardial",
                        "ontology": "h12",
                        "category": "thoracic",
                        "pos": [[55.495,44.452]]
                    },{
                        "name": "pericardial",
                        "ontology": "h13",
                        "category": "thoracic",
                        "pos": [[55.311,47.092]]
                    },{
                        "name": "retoperitoneal",
                        "ontology": "h14",
                        "category": "visceral",
                        "pos": [[52.547,56.243]]
                    },{
                        "name": "epineural",
                        "ontology": "h15",
                        "category": "specialized",
                        "pos": [[51.319,55.813]]
                    },{
                        "name": "perineural",
                        "ontology": "h16",
                        "category": "specialized",
                        "pos": [[51.319,55.813]]
                    },{
                        "name": "suprarenal",
                        "ontology": "h17",
                        "category": "visceral",
                        "pos": [[58.504,56.734]]
                    },{
                        "name": "perirenal",
                        "ontology": "h18",
                        "category": "visceral",
                        "pos": [[59.610,58.700]]
                    },{
                        "name": "omental",
                        "ontology": "h19",
                        "category": "visceral",
                        "pos": [[46.099,59.744]]
                    },{
                        "name": "superficial abdominal",
                        "ontology": "h20",
                        "category": "subcutaneous",
                        "pos": [[39.528,62.200]]
                    },{
                        "name": "deep abdominal",
                        "ontology": "h21",
                        "category": "subcutaneous",
                        "pos": [[41.861,65.946]]
                    },{
                        "name": "mesenteric",
                        "ontology": "h22",
                        "category": "visceral",
                        "pos": [[56.846,62.262]]
                    },{
                        "name": "epiploic",
                        "ontology": "h23",
                        "category": "visceral",
                        "pos": [[56.355,66.745]]
                    },{
                        "name": "mammary",
                        "ontology": "h24",
                        "category": "subcutaneous",
                        "pos": [[39.528,49.672]]
                    },{
                        "name": "gluteal",
                        "ontology": "h25",
                        "category": "subcutaneous",
                        "pos": [[34.628,83.639]]
                    },{
                        "name": "periprostatic",
                        "ontology": "h26",
                        "category": "visceral",
                        "pos": [[54.552,88.103]]
                    },{
                        "name": "femoral",
                        "ontology": "h27",
                        "category": "subcutaneous",
                        "pos": [[67.507,108.026]]
                    },{
                        "name": "bone marrow",
                        "ontology": "h28",
                        "category": "specialized",
                        "pos": [[61.628,114.994]]
                    },{
                        "name": "intraarticular",
                        "ontology": "h29",
                        "category": "specialized",
                        "pos": [[62.172,137.421]]
                    },{
                        "name": "inter-muscular",
                        "ontology": "h30",
                        "category": "specialized",
                        "pos": [[64.568,119.566]]
                    },{
                        "name": "intra-muscular",
                        "ontology": "h31",
                        "category": "specialized",
                        "pos": [[64.568,119.566]]
                    },{
                        "name": "perivascular",
                        "ontology": "h32",
                        "category": "specialized",
                        "pos": [[41.814,161.045]]
                    },{
                        "name": "dermal",
                        "ontology": "h33",
                        "category": "specialized",
                        "pos": [[70.004,153.853]]
                    },{
                        "name": "subq",
                        "ontology": "h34",
                        "category": "subcutaneous",
                        "pos": [[70.004,153.853]]
                    },{
                        "name": "specialized fat",
                        "ontology": "h35",
                        "category": "specialized",
                        "pos": [[48.666,188.256],[58.355,182.704]]
                    }
                ],
                "mouse":[
                    {
                        "name": "craniofacial",
                        "ontology": "m1",
                        "category": "specialized"
                    },{
                        "name": "dermal",
                        "ontology": "m2",
                        "category": "specialized"
                    },{
                        "name": "subq",
                        "ontology": "m3",
                        "category": "subcutaneous"
                    },{
                        "name": "suprascapular",
                        "ontology": "m4",
                        "category": "subcutaneous"
                    },{
                        "name": "intrascapular",
                        "ontology": "m5",
                        "category": "subcutaneous"
                    },{
                        "name": "triceps",
                        "ontology": "m6",
                        "category": "subcutaneous"
                    },{
                        "name": "cardiac",
                        "ontology": "m7",
                        "category": "perivascular"
                    },{
                        "name": "anterior axillary",
                        "ontology": "m8",
                        "category": "subcutaneous"
                    },{
                        "name": "retroperitoneal",
                        "ontology": "m9",
                        "category": "perivascular"
                    },{
                        "name": "perirenal",
                        "ontology": "m10",
                        "category": "perivascular"
                    },{
                        "name": "mesenteric",
                        "ontology": "m11",
                        "category": "perivascular"
                    },{
                        "name": "inguinal",
                        "ontology": "m12",
                        "category": "subcutaneous"
                    },{
                        "name": "perigonadal",
                        "ontology": "m13",
                        "category": "perivascular"
                    },{
                        "name": "epididymal",
                        "ontology": "m14",
                        "category": "perivascular"
                    },{
                        "name": "periovarian",
                        "ontology": "m15",
                        "category": "perivascular"
                    },{
                        "name": "superclavicular",
                        "ontology": "m16",
                        "category": "subcutaneous"
                    },{
                        "name": "cervical",
                        "ontology": "m17",
                        "category": "subcutaneous"
                    },{
                        "name": "intrascapular",
                        "ontology": "m18",
                        "category": "visceral"
                    },{
                        "name": "axillary",
                        "ontology": "m19",
                        "category": "visceral"
                    },{
                        "name": "mediastinal",
                        "ontology": "m20",
                        "category": "visceral"
                    },{
                        "name": "perivascular",
                        "ontology": "m21",
                        "category": "specialized"
                    },{
                        "name": "perirenal",
                        "ontology": "m22",
                        "category": "visceral"
                    },{
                        "name": "popliteal",
                        "ontology": "m23",
                        "category": "specialized"
                    },{
                        "name": "bone marrow",
                        "ontology": "m24",
                        "category": "specialized"
                    }
                ]
            }
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
        this.parseDepotsByCategory();
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

        parseDepotsByCategory(){
            const depotsByCategory = this.depots.human.reduce((acc, depot) => {
                const category = depot.category;
                if (!acc[category]) acc[category] = [];
                acc[category].push(depot);
                return acc;
            }, {});
            console.log('depotsByCategory',depotsByCategory);
            this.depotsByCategory = depotsByCategory;
        },

        highlightDepot(depot){
            const els = document.querySelectorAll('.depot-point');
            els.forEach(el=>{
                el.classList.remove('on');
            })
            const el = document.querySelectorAll(`.depot-point[data-depot="${depot}"]`);
            el.forEach(ell=>{
                ell.classList.add('on');
            })
        },
        highlightDepotCategory(category){
            const els = document.querySelectorAll('.depot-point');
            els.forEach(el=>{
                el.classList.remove('on');
            })
            const el = document.querySelectorAll(`.depot-point[data-category="${category}"]`);
            el.forEach(ell=>{
                ell.classList.add('on');
            })
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },

    
}).$mount("#app");
