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
import TimeSeriesLinePlot from "../../components/TimeSeriesLinePlot.vue";
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
        DonorMetadataTable,
        TimeSeriesLinePlot
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
            filteredDonors: [],
            insData: null,
            maxTime: null,
            maxScore: null,
        };
    },
    async created() {
        await this.$store.dispatch("populateData", this.files);
        this.availableDonors = Object.keys(this.$store.state.ins[0]);
        this.insData = this.collateInsData();
    },
    computed: {
        availableDonorsMetadata(){
            if (this.availableDonors.length === 0){
                return [];
            }
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
        linePlotConfig(){
            let config = {
                yField: "score",
                xMax: this.maxTime,
                xMin: 0,
                yMax: this.maxScore,
                yMin: 0,
                xField: "time",
                xAxisLabel: null,
                yAxisLabel: null,
                dotKey: "donor",
            };
            return config;
        }
    },
    methods: {
        getDonors(donors){
            this.filteredDonors = donors;
        },
        collateInsData(){
            let maxTime = null;
            let maxScore = null;
            let results = [];
            let donors = this.availableDonors.filter(d =>!d.startsWith("time"));
            donors.forEach(donor => {
                this.$store.state.ins.forEach(timePoint => {
                    let donorResults = {};
                    donorResults.donor = donor;
                    donorResults.time = timePoint.time;
                    donorResults.score = timePoint[donor];
                    results.push(donorResults);
                    if (maxTime === null || timePoint.time > maxTime){
                        maxTime = timePoint.time;
                    }
                    if (maxScore === null || timePoint[donor] > maxScore){
                        maxScore = timePoint[donor];
                    }
                });
            });
            console.log(JSON.stringify(results));
            this.maxTime = maxTime;
            this.maxScore = maxScore;
            return results;
        },
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
