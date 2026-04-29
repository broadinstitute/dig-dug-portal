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
import dataConvert from "@/utils/dataConvert";
import BIO_INDEX_HOST from "@/utils/bioIndexUtils";
const PANKBASE_BIOINDEX = BIO_INDEX_HOST.BIO_INDEX_HOST.replace("hugeamp", "pankbase");
const timepointsFile = "/data/pankbase/HIPP_gcg_ieq.timepoints.txt";

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
            maxTimeIns: null,
            maxScoreIns: null,
            resultsIns: null,
            maxTimeGcg: null,
            maxScoreGcg: null,
            resultsGcg: null,
            timepoints: [],
        };
    },
    async created() {
        await this.$store.dispatch("populateData", this.files);
        this.availableDonors = this.$store.state.metadata.map(m => m.Accession);
        const timepointsData = await fetch(timepointsFile).then(r => r.text());
        this.timepoints = dataConvert.tsv2Json(timepointsData);
    },
    computed: {
        allMetadata(){
            return this.$store.state.metadata;
        },
        utilsBox() {
            let utils = {
                regionUtils: regionUtils,
            };
            return utils;
        },
        insData(){
            return this.collateData(this.$store.state.ins);
        },
        gcgData(){
            return this.collateData(this.$store.state.gcg);
        }
    },
    methods: {
        getDonors(donors){
            this.filteredDonors = donors;
        },
        collateData(data){
            let maxTime = null;
            let maxScore = null;
            let results = [];
            let donors = this.availableDonors.filter(d =>!d.startsWith("time"));
            donors.forEach(donor => {
                if (!data[0][donor]){
                    return;
                }
                data.forEach(timePoint => {
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
            this.maxTime = maxTime;
            this.maxScore = maxScore;
            let output = {
                results: results,
                maxTime: maxTime,
                maxScore: maxScore
            }
            return output;
        }
    },
    watch: {
        insData(newData){
            this.resultsIns = newData.results;
            this.maxScoreIns = newData.maxScore;
            this.maxTimeIns = newData.maxTime;
        },
        gcgData(newData){
            this.resultsGcg = newData.results;
            this.maxScoreGcg = newData.maxScore;
            this.maxTimeGcg = newData.maxTime;
        }
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
