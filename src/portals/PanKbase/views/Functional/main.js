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
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import FilterLessThan from "@/components/criterion/FilterLessThan.vue";
import FilterGreaterLess from "../../../../components/criterion/FilterGreaterLess.vue";
import TimeSeriesLinePlot from "../../components/TimeSeriesLinePlot.vue";
import DataDownload from "@/components/DataDownload.vue";
import FilterSlider from "../../components/FilterSlider.vue";
import FilterRadio from "../../components/FilterRadio.vue";
import keyParams from "@/utils/keyParams";
import regionUtils from "@/utils/regionUtils";
import dataConvert from "@/utils/dataConvert";
import BIO_INDEX_HOST from "@/utils/bioIndexUtils";
const PANKBASE_BIOINDEX = BIO_INDEX_HOST.BIO_INDEX_HOST.replace("hugeamp", "pankbase");
const timepointsFile = "/data/pankbase/HIPP_gcg_ieq.timepoints.txt";
const gcgTimepointsFile = `${PANKBASE_BIOINDEX}/api/raw/file/single_cell_time_series/HIPP/HIPP_gcg_ieq.timepoints.txt`;
const insTimepointsFile = `${PANKBASE_BIOINDEX}/api/raw/file/single_cell_time_series/HIPP/HIPP_ins_ieq.timepoints.txt`;

new Vue({
    store,
    components: {
        ResearchSingleSearch,
        CriterionFunctionGroup,
        FilterEnumeration,
        FilterGreaterThan,
        FilterLessThan,
        DataDownload,
        FilterGreaterLess,
        TimeSeriesLinePlot,
        FilterSlider,
        FilterRadio
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
            donorsWithData: [],
            filteredDonors: [],
            filteredMetadata: [],
            maxTimeIns: null,
            maxScoreIns: null,
            resultsIns: null,
            maxTimeGcg: null,
            maxScoreGcg: null,
            resultsGcg: null,
            gcgTimepoints: [],
            insTimepoints: [],
            gcgColor: "#2F67B1", // colorblind safe blue from UCSB
			insColor: "#BF2C23", // colorblind safe red from UCSB,
            fieldsObject: {
                accession: {
                    key: "Accession",
                    sortable: true
                },
                donorId: {
                    key: "Center Donor ID",
                    sortable: true
                },
                age: {
                    key: "Age (years)",
                    isNumeric: true,
                    sortable: true,
                },
                sex: {
                    key: "Gender",
                    sortable: true
                },
                bmi: {
                    key: "BMI",
                    isNumeric: true,
                    sortable: true
                },
                diabetesDesc: {
                    key: "Description of diabetes status",
                    sortable: true
                },
                diabetes: {
                    key: "Derived diabetes status",
                    sortable: true
                },
                hba1c: {
                    key: "HbA1C (percentage)",
                    isNumeric: true,
                    sortable: true
                },
                ethnicity: {
                    key: "Ethnicities",
                    sortable: true
                },
                isolation: {
                    key: "Isolation_center",
                    sortable: true
                },
                cultureTime: {
                    key: "Pre-Shipment Culture Time (hours)", // TODO ADD TRANSIT TIME
                    isNumeric: true,
                    sortable: true
                },
            },
            perPage: 10,
            currentPage: 1,
            filtersActive: [],
            selectedDonors: "",
            selectedDonorList: [],
            useSelectedDonors: true
        };
    },
    async created() {
        // TODO Use an invisible b-table to do the filtering 
        await this.$store.dispatch("populateData", this.files);
        this.donorsWithData = this.getDonorsWithData(this.$store.state.ins);
        console.log(JSON.stringify(this.donorsWithData.slice(0,10)));
        this.filteredMetadata = this.$store.state.metadata.filter(m => 
                this.donorsWithData.includes(m.Accession));
        const insTimepointsData = await fetch(insTimepointsFile).then(r => r.text());
        this.insTimepoints = dataConvert.tsv2Json(insTimepointsData);
        const gcgTimepointsData = await fetch(gcgTimepointsFile).then(r => r.text());
        this.gcgTimepoints = dataConvert.tsv2Json(gcgTimepointsData);
    },
    computed: {
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
        },
        filteredAccession(){
            if (this.selectedDonorList.length > 0 && this.useSelectedDonors){
                return this.selectedDonorList;
            }
            let results = this.filteredDonors.map(d => d.Accession);
            return results;
        },
    },
    methods: {
        getFilters(filters){
            console.log(JSON.stringify(filters));
            this.filtersActive = filters.map(filter => filter.field);
        },
        selectDonors(){
            let delimiters = /[,\s]/;
            let entries = this.selectedDonors.split(delimiters);
            let donorIdFinder = /[\w]+/
            entries = entries.map(e => e.match(donorIdFinder)[0]);
            entries.forEach(e => console.log(e));
            this.selectedDonorList = entries;
        },
        collateData(data){
            let maxTime = null;
            let maxScore = null;
            let results = [];
            
            this.donorsWithData.forEach(donor => {
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
        },
        getDonorsWithData(insData){
            let dataPoint = insData[0];
            let donors = Object.keys(dataPoint).filter(d =>!d.startsWith("time"));
            return donors;
        },
        getRange(field){
            let fieldKey = field.key;
            let min = this.filteredMetadata[0][fieldKey];
            let max = this.filteredMetadata[0][fieldKey];
            this.filteredMetadata.filter(d => !Number.isNaN(d[fieldKey]))
                .forEach(d => {
                    min = d[fieldKey] < min ? d[fieldKey] : min;
                    max = d[fieldKey] > max ? d[fieldKey] : max;
                });
            // TODO figure out why this is happening
            min = min === "" ? 0 : min;
            return [min, max];
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
        },
        filteredDonors(newList){
            console.log("Is this thing on?");
        },
        selectedDonorList(newList){

        }
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
