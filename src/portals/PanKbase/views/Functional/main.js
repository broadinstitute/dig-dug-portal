import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import "../../assets/phewas.css";
import "../../assets/filtering.css";
import "../../assets/atacseq.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getPankbaseContent } from "@/portals/PanKbase/utils/content";
import ResearchSingleSearch from "@/components/researchPortal/ResearchSingleSearch.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import keyParams from "@/utils/keyParams";
import regionUtils from "@/utils/regionUtils";
import BIO_INDEX_HOST from "@/utils/bioIndexUtils";
const PANKBASE_BIOINDEX = BIO_INDEX_HOST.BIO_INDEX_HOST.replace("hugeamp", "pankbase");
new Vue({
    store,
    components: {
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            currentPage: 1,
            perPage: 10,
            files: {
                allTraits: "HIPP_all_traits.pankbase.txt",
                gcg: "HIPP_gcg_ieq.pankbase.txt",
                ins: "HIPP_ins_ieq.pankbase.txt",
                metadata: "meta-data.merged.pankbase.txt"
            },
        };
    },
    async created() {
        await this.$store.dispatch("populateData", this.files);
        console.log(this.$store.state.allTraits.length);
        console.log(JSON.stringify(Object.keys(this.$store.state.metadata[0])));
        let available = new Set(this.$store.state.metadata.map(m => m.Data_available_Pankbase));
        console.log(JSON.stringify(Array.from(available)));
    },
    computed: {
        utilsBox() {
            let utils = {
                regionUtils: regionUtils,
            };
            return utils;
        },
        fields(){
            let rawFields = 
                [
                    "Accession",
                    "Center Donor ID",
                    "RRID",
                    "Collections",
                    "Ethnicities",
                    "Age (years)",
                    "Gender","BMI",
                    "C-Peptide (ng/ml)",
                    "Derived diabetes status",
                    "Diabetes Duration (years)",
                    "Donation Type",
                    "HbA1C (percentage)",
                    "Predicted Genetic Ancestry"
                ]
            return rawFields;
        }
    },
    methods: {
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
