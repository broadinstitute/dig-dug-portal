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
import DonorMetadataTable from "../../components/DonorMetadataTable.vue";
import keyParams from "@/utils/keyParams";
import regionUtils from "@/utils/regionUtils";
import BIO_INDEX_HOST from "@/utils/bioIndexUtils";
const PANKBASE_BIOINDEX = BIO_INDEX_HOST.BIO_INDEX_HOST.replace("hugeamp", "pankbase");
new Vue({
    store,
    components: {
        ResearchSingleSearch,
        CriterionFunctionGroup,
        FilterEnumeration,
        DonorMetadataTable
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            files: {
                allTraits: "HIPP_all_traits.pankbase.txt",
                gcg: "HIPP_gcg_ieq.pankbase.txt",
                ins: "HIPP_ins_ieq.pankbase.txt",
                metadata: "meta-data.merged.pankbase.txt"
            },
            availableDonors: [],
            filteredDonors: []
        };
    },
    async created() {
        await this.$store.dispatch("populateData", this.files);
        this.availableDonors = Object.keys(this.$store.state.ins[0]);
        console.log(this.availableDonors);
    },
    computed: {
        availableDonorsMetadata(){
            if (this.availableDonors.length === 0){
                return [];
            }
            console.log("Available donors:", this.availableDonors.length);
            return this.$store.state.metadata.filter(m => 
                this.availableDonors.includes(m.Accession)
            );
        },
        utilsBox() {
            let utils = {
                regionUtils: regionUtils,
            };
            return utils;
        },
        donorInsData(){
            let results = [];
            this.filteredDonors.forEach(donor => {
                let donorResults = {};
                donorResults.donor = donor;
                this.$store.state.ins.forEach(timePoint => {
                    donorResults[`${timePoint.time}`] = timePoint[donor];
                });
                results.push(donorResults);
            });
            return results;
        }
    },
    methods: {
        getDonors(donors){
            this.filteredDonors = donors;
        }
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
