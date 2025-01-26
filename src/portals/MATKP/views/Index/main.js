import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "../../assets/matkp-styles.css";

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);
Vue.config.productionTip = false;

import matkpNav from "../components/matkp-nav.vue";
import matkpHero from "../components/matkp-hero.vue";
import matkpFooter from "../components/matkp-footer.vue";
import * as d3 from "d3";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";

//import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
const BIO_INDEX_HOST = "https://bioindex-dev.hugeamp.org";

new Vue({
    store,

    components: {
        matkpHero,
        matkpNav,
        matkpFooter,
    },

    data() {
        return {
            config: null,
            datasets: null,
            fields: [
                {
                    key: "datasetName",
                    label: "Name",
                    tdClass: "italic",
                    sortable: true,
                },
                { key: "species", label: "Species", sortable: true },
                { key: "depot", label: "Depot", sortable: false },
                { key: "tissue", label: "Tissue", sortable: false },
                { key: "sampleType", label: "Sample", sortable: false },
                { key: "sex", label: "Sex", sortable: false },
                { key: "ethnicity", label: "Ethnicity", sortable: false },
                { key: "method", label: "Method", sortable: false },
                { key: "platform", label: "Platform", sortable: false },
                { key: "totalCells", label: "Cells", sortable: true },
                //{key:"Download", label:"", sortable: false},
                { key: "datasetId", label: "", sortable: false },
            ],

            anatomyWidth: 250,
            selectedSpecies: "Homo sapiens",
            anatomyImages: {
                ["Homo sapiens"]: {
                    male: "https://hugeampkpncms.org/sites/default/files/users/user32/matkp/homo_sapiens.male_.svg",
                    female: "https://hugeampkpncms.org/sites/default/files/users/user32/matkp/homo_sapiens.female.svg",
                    scale: 2.35, //svg display size / svg intrinsic size (TODO: calculate on the fly) 106
                },
                ["Mus musculus"]: {
                    male: "https://hugeampkpncms.org/sites/default/files/users/user32/matkp/mus_musculus.male_.svg",
                    female: "https://hugeampkpncms.org/sites/default/files/users/user32/matkp/mus_musculus.female.svg",
                    scale: 3.05, //svg display size / svg intrinsic size (TODO: calculate on the fly) 81
                },
            },

            adiposeInfo: null,

            depotsBySpecies: null,

            depotsByCategory: null,

            depotDescription: "",

            depots: {
                ["Homo sapiens"]: [
                    {
                        name: "craniofacial",
                        ontology: "h1",
                        category: "subcutaneous",
                        description: "Fat in the face and cranial area",
                        pos: [
                            [55.671, 15.214],
                            [51.291, 0.461],
                        ],
                    },
                    {
                        name: "retroorbital",
                        ontology: "h2",
                        category: "subcutaneous",
                        description: "Fat around the eyes",
                        pos: [[47.873, 11.424]],
                    },
                    {
                        name: "submental",
                        ontology: "h3",
                        category: "subcutaneous",
                        description: "Fat under the skin below the chin",
                        pos: [[51.14, 27.393]],
                    },
                    {
                        name: "perithyroidal",
                        ontology: "h4",
                        category: "specialized",
                        description: "Fat around the thyroid gland in the neck",
                        pos: [[49.803, 29.329]],
                    },
                    {
                        name: "cervical",
                        ontology: "h5",
                        category: "subcutaneous",
                        description: "Fat under the skin of the neck",
                        pos: [[55.858, 25.095]],
                    },
                    {
                        name: "superclavicular",
                        ontology: "h6",
                        category: "subcutaneous",
                        description: "Fat above the clavicle",
                        pos: [[58.641, 31.386]],
                    },
                    {
                        name: "periaortic",
                        ontology: "h7",
                        category: "visceral",
                        description:
                            "Fat around the aorta in the abdominal cavity",
                        pos: [[53.075, 39.37]],
                    },
                    {
                        name: "axillary",
                        ontology: "h8",
                        category: "subcutaneous",
                        description: "Fat under the skin of the armpit area",
                        pos: [[34.807, 39.975]],
                    },
                    {
                        name: "intercostal",
                        ontology: "h9",
                        category: "visceral",
                        description: "Fat between the ribs",
                        pos: [[43.397, 42.152]],
                    },
                    {
                        name: "mediastinal",
                        ontology: "h10",
                        category: "visceral",
                        description:
                            "Fat within the mediastinum (central thoracic cavity)",
                        pos: [[49.567, 46.508]],
                    },
                    {
                        name: "paravertebral",
                        ontology: "h11",
                        category: "visceral",
                        description: "Fat alongside the vertebrae",
                        pos: [
                            [49.083, 52.436],
                            [53.559, 52.436],
                        ],
                    },
                    {
                        name: "epicardial",
                        ontology: "h12",
                        category: "visceral",
                        description: "Fat on the surface of the heart",
                        pos: [[55.495, 44.452]],
                    },
                    {
                        name: "pericardial",
                        ontology: "h13",
                        category: "visceral",
                        description:
                            "Fat around the pericardium (heart’s protective sac)",
                        pos: [[55.311, 47.092]],
                    },
                    {
                        name: "retoperitoneal",
                        ontology: "h14",
                        category: "visceral",
                        pos: [[52.547, 56.243]],
                    },
                    {
                        name: "epineural",
                        ontology: "h15",
                        category: "specialized",
                        description: "Fat within nerve sheaths",
                        pos: [[51.319, 55.813]],
                    },
                    {
                        name: "perineural",
                        ontology: "h16",
                        category: "specialized",
                        description: "Fat around nerves",
                        pos: [[51.319, 55.813]],
                    },
                    {
                        name: "suprarenal",
                        ontology: "h17",
                        category: "visceral",
                        description:
                            "Fat around the adrenal glands, above the kidneys",
                        pos: [[58.504, 56.734]],
                    },
                    {
                        name: "perirenal",
                        ontology: "h18",
                        category: "visceral",
                        description: "Fat around the kidneys",
                        pos: [[59.61, 58.7]],
                    },
                    {
                        name: "omental",
                        ontology: "h19",
                        category: "visceral",
                        description: "Fat within the omentum (abdominal fold)",
                        pos: [[46.099, 59.744]],
                    },
                    {
                        name: "superficial abdominal",
                        ontology: "h20",
                        category: "subcutaneous",
                        description:
                            "Fat beneath the skin in the abdominal area",
                        pos: [[39.528, 62.2]],
                    },
                    {
                        name: "deep abdominal",
                        ontology: "h21",
                        category: "visceral",
                        description:
                            "Fat beneath the skin but deeper in the abdominal area",
                        pos: [[41.861, 65.946]],
                    },
                    {
                        name: "mesenteric",
                        ontology: "h22",
                        category: "visceral",
                        description:
                            "Fat within the mesentery (attaches intestines to the abdominal wall)",
                        pos: [[56.846, 62.262]],
                    },
                    {
                        name: "epiploic",
                        ontology: "h23",
                        category: "visceral",
                        description: "Fat-filled pouches along the colon",
                        pos: [[56.355, 71.745]],
                    },
                    {
                        name: "mammary",
                        ontology: "h24",
                        category: "subcutaneous",
                        description: "Fat in the breasts",
                        pos: [[61.0, 49.672]],
                    },
                    {
                        name: "gluteal",
                        ontology: "h25",
                        category: "subcutaneous",
                        description: "Fat under the skin of the buttocks",
                        pos: [[34.628, 83.639]],
                    },
                    {
                        name: "periprostatic",
                        ontology: "h26",
                        category: "visceral",
                        description: "Fat around the prostate",
                        pos: [[54.552, 88.103]],
                    },
                    {
                        name: "femoral",
                        ontology: "h27",
                        category: "subcutaneous",
                        description: "Fat under the skin of the thighs",
                        pos: [[67.507, 108.026]],
                    },
                    {
                        name: "bone marrow",
                        ontology: "h28",
                        category: "specialized",
                        description: "Fat within the bone marrow",
                        pos: [[61.628, 114.994]],
                    },
                    {
                        name: "intraarticular",
                        ontology: "h29",
                        category: "specialized",
                        description: "Fat within joints",
                        pos: [[60.172, 137.421]],
                    },
                    {
                        name: "inter-muscular",
                        ontology: "h30",
                        category: "specialized",
                        description: "Fat between muscles",
                        pos: [[64.568, 119.566]],
                    },
                    {
                        name: "intra-muscular",
                        ontology: "h31",
                        category: "specialized",
                        description: "Fat within muscles",
                        pos: [[64.568, 119.566]],
                    },
                    {
                        name: "perivascular",
                        ontology: "h32",
                        category: "specialized",
                        description: "Fat around blood vessels",
                        pos: [[41.814, 161.045]],
                    },
                    {
                        name: "dermal",
                        ontology: "h33",
                        category: "specialized",
                        description: "Fat associated with the skin",
                        pos: [[66.004, 153.853]],
                    },
                    {
                        name: "subq",
                        ontology: "h34",
                        category: "subcutaneous",
                        description: "Fat under the skin throughout the body",
                        pos: [[65.004, 153.853]],
                    },
                    {
                        name: "structural fat",
                        ontology: "h35",
                        category: "specialized",
                        description:
                            "Fat providing specific structural support",
                        pos: [
                            [45.666, 188.256],
                            [55.355, 182.704],
                        ],
                    },
                ],
                ["Mus musculus"]: [
                    {
                        name: "craniofacial",
                        ontology: "m1",
                        category: "subcutaneous",
                        description: "Fat in the face and cranial area",
                        pos: [
                            [41.988, 14.864],
                            [43.235, 24.597],
                        ],
                    },
                    {
                        name: "dermal",
                        ontology: "m2",
                        category: "specialized",
                        pos: [[30.009, 16.86]],
                    },
                    {
                        name: "subq",
                        ontology: "m3",
                        category: "subcutaneous",
                        description: "Fat under the skin throughout the body",
                        pos: [[30.009, 16.86]],
                    },
                    {
                        name: "suprascapular",
                        ontology: "m4",
                        category: "subcutaneous",
                        pos: [[37.593, 43.411]],
                    },
                    {
                        name: "intrascapular",
                        ontology: "m5",
                        category: "specialized",
                        pos: [[35.596, 50.149]],
                    },
                    {
                        name: "triceps",
                        ontology: "m6",
                        category: "subcutaneous",
                        pos: [[21.122, 42.412]],
                    },
                    {
                        name: "cardiac",
                        ontology: "m7",
                        category: "visceral",
                        pos: [[40.088, 56.138]],
                    },
                    {
                        name: "anterior axillary",
                        ontology: "m8",
                        category: "subcutaneous",
                        pos: [[25.614, 58.134]],
                    },
                    {
                        name: "retroperitoneal",
                        ontology: "m9",
                        category: "visceral",
                        pos: [[33.849, 68.616]],
                    },
                    {
                        name: "perirenal",
                        ontology: "m10",
                        category: "visceral",
                        description: "Fat around the kidneys",
                        pos: [
                            [30.106, 89.08],
                            [48.92, 87.582],
                        ],
                    },
                    {
                        name: "mesenteric",
                        ontology: "m11",
                        category: "visceral",
                        pos: [[36.345, 95.069]],
                    },
                    {
                        name: "inguinal",
                        ontology: "m12",
                        category: "subcutaneous",
                        pos: [[25.961, 113.037]],
                    },
                    {
                        name: "perigonadal",
                        ontology: "m13",
                        category: "visceral",
                        pos: [[35.444, 117.03]],
                    },
                    {
                        name: "epididymal",
                        ontology: "m14",
                        category: "visceral",
                        pos: [[36.442, 119.026]],
                    },
                    {
                        name: "periovarian",
                        ontology: "m15",
                        category: "visceral",
                        pos: [[43.929, 119.026]],
                    },
                    {
                        name: "superclavicular",
                        ontology: "m16",
                        category: "subcutaneous",
                        description: "Fat above the clavicle",
                        pos: [[51.166, 42.163]],
                    },
                    {
                        name: "cervical",
                        ontology: "m17",
                        category: "subcutaneous",
                        description: "Fat under the skin of the neck",
                        pos: [[40.989, 33.081]],
                    },
                    {
                        name: "intrascapular",
                        ontology: "m18",
                        category: "visceral",
                        pos: [[47.672, 49.4]],
                    },
                    {
                        name: "axillary",
                        ontology: "m19",
                        category: "subcutaneous",
                        description: "Fat under the skin of the armpit area",
                        pos: [[53.662, 51.896]],
                    },
                    {
                        name: "mediastinal",
                        ontology: "m20",
                        category: "visceral",
                        description:
                            "Fat within the mediastinum (central thoracic cavity)",
                        pos: [[46.175, 59.133]],
                    },
                    {
                        name: "perivascular",
                        ontology: "m21",
                        category: "specialized",
                        description: "Fat around blood vessels",
                        pos: [[42.931, 65.122]],
                    },
                    {
                        name: "popliteal",
                        ontology: "m22",
                        category: "subcutaneous",
                        pos: [[65.391, 117.779]],
                    },
                    {
                        name: "bone marrow",
                        ontology: "m23",
                        category: "specialized",
                        description: "Fat within the bone marrow",
                        pos: [[64.393, 134.449]],
                    },
                ],
            },
        };
    },

    watch: {},

    computed: {
        filterOptions() {
            const filterOptions = {};

            if (!this.datasets) return filterOptions;

            // Get field keys for easy checking
            const fieldKeys = this.fields.map((field) => field.key);

            this.datasets.forEach((item) => {
                Object.keys(item).forEach((key) => {
                    if (Array.isArray(item[key]) && fieldKeys.includes(key)) {
                        if (!filterOptions[key]) {
                            filterOptions[key] = new Set();
                        }
                        item[key].forEach((value) => {
                            filterOptions[key].add(value);
                        });
                    }
                });
            });

            // Convert Sets to arrays and create options for select
            Object.keys(filterOptions).forEach((key) => {
                filterOptions[key] = Array.from(filterOptions[key]).map(
                    (value) => ({ value, text: value })
                );
            });

            return filterOptions;
        },
    },

    mounted() {
        //this.getAdiposeInfo();
    },

    async created() {
        await this.getConfig();
        this.getDatasets();
    },

    methods: {
        async getConfig() {
            const dataPoint =
                "https://hugeampkpncms.org/rest/data?pageid=matkp_config";
            const result = await fetch(dataPoint).then((resp) => resp.json());
            const json = JSON.parse(result[0]["field_data_points"]);
            this.config = json;
            console.log("config", json);
        },

        async getDatasets() {
            const fetchPath =
                "/api/raw/file/single_cell_metadata/dataset_metadata.json.gz";
            const response = await fetch(`${BIO_INDEX_HOST}${fetchPath}`);
            const dataText = await response.text();
            const lines = dataText
                .split("\n")
                .filter((line) => line.trim() !== "");
            const jsonObjects = lines.map((line) => JSON.parse(line));
            this.datasets = jsonObjects;
            //this.filteredCount = this.datasets.length;
            console.log(this.datasets);
            console.log(this.filterOptions);

            this.depotsBySpecies = this.parseDatasetsBySpeciesAndDepot();
            console.log("dataset depots by species", this.depotsBySpecies);

            this.displaySpecies(this.selectedSpecies);
        },

        selectSpecies(e) {
            console.log(e.target.value);
            this.displaySpecies(e.target.value);
        },

        displaySpecies(species) {
            this.selectedSpecies = species;
            const depotsByCategory = this.parseDepotsByCategory(
                this.selectedSpecies,
                this.depotsBySpecies
            );
            console.log("depotsByCategory", depotsByCategory);

            this.depotsByCategory = depotsByCategory;
        },

        parseDatasetsBySpeciesAndDepot() {
            const speciesDepotsMap = {};
            this.datasets.forEach((dataset) => {
                const species = dataset.species;
                const depot1 = dataset.depot.includes("subcutaneous")
                    ? "subq"
                    : dataset.depot;
                const depot2 = dataset.depot2.includes("subcutaneous")
                    ? "subq"
                    : dataset.depot2;
                const depots = [depot1, depot2];
                if (!speciesDepotsMap[species]) {
                    speciesDepotsMap[species] = {};
                }
                depots.forEach((depot) => {
                    if (depot === "") return;
                    if (!speciesDepotsMap[species][depot]) {
                        speciesDepotsMap[species][depot] = 0;
                    }
                    speciesDepotsMap[species][depot] += 1;
                });
                /*
                dataset.species.forEach(species => {
                    if (!speciesDepotsMap[species]) {
                        speciesDepotsMap[species] = {};
                    }
                    dataset.depot.forEach(depot => {
                        if (!speciesDepotsMap[species][depot]) {
                            speciesDepotsMap[species][depot] = 0;
                        }
                        speciesDepotsMap[species][depot] += 1;
                    });
                });
                */
            });
            const result = {};
            for (const [species, depotsObj] of Object.entries(
                speciesDepotsMap
            )) {
                result[species] = depotsObj;
            }

            return result;
        },

        parseDepotsByCategory(species, available) {
            //const mouseDepots = [];
            //this.depots['mouse'].forEach(depot=>mouseDepots.push(depot.name));
            //console.log("mouseDepots", mouseDepots)

            const speciesCap = species.charAt(0).toUpperCase() + species.slice(1);
            const speciesDepots = Object.keys(available[speciesCap]);
            console.log({species}, this.depots)
            this.depots[species].forEach((depot) => {
                depot.count = 0;
                speciesDepots.forEach((dbDepot) => {
                    if (dbDepot.includes(depot.name)) {
                        depot.count = available[speciesCap][dbDepot];
                    }
                });
            });

            const depotsByCategory = this.depots[species].reduce(
                (acc, depot) => {
                    const category = depot.category;
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(depot);
                    return acc;
                },
                {}
            );

            for (const [key, value] of Object.entries(depotsByCategory)) {
                value.sort((a, b) => a.name.localeCompare(b.name));
            }
            return depotsByCategory;
        },

        goToDatasets(e, depot) {
            if (depot.count > 0)
                window.location.href = `/datasets.html?species=${this.selectedSpecies}&depot2=${depot.name}`;
        },
        highlightDepot(e, depot) {
            const btns = document.querySelectorAll(".depot-item");
            btns.forEach((el) => {
                el.classList.remove("on");
            });
            e.target.classList.add("on");

            const els = document.querySelectorAll(".depot-point");
            els.forEach((el) => {
                el.classList.remove("on");
            });

            const el = document.querySelectorAll(
                `.depot-point[data-depot="${depot.ontology}"]`
            );
            el.forEach((ell) => {
                ell.classList.add("on");
            });
            this.depotDescription = depot.description;
        },
        highlightDepotCategory(category) {
            const btns = document.querySelectorAll(".depot-item");
            btns.forEach((el) => {
                el.classList.remove("on");
            });

            const els = document.querySelectorAll(".depot-point");
            els.forEach((el) => {
                el.classList.remove("on");
            });

            const el = document.querySelectorAll(
                `.depot-point[data-category="${category}"]`
            );
            el.forEach((ell) => {
                ell.classList.add("on");
            });
        },
        async getAdiposeInfo() {
            const json = await fetch(
                "https://hugeampkpncms.org/view/rest/get_research_page?pageid=matkp_static_info"
            ).then((resp) => resp.json());
            this.adiposeInfo = json;
            console.log(this.adiposeInfo);
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
