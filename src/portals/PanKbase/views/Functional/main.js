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
import DonorMetadataTable from "../../components/DonorMetadataTable.vue";
import TimeSeriesLinePlot from "../../components/TimeSeriesLinePlot.vue";
import DualSlider from "../../components/DualSlider.vue";
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
        FilterGreaterLess,
        DonorMetadataTable,
        TimeSeriesLinePlot,
        DualSlider
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
            donorsWithData: [],
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
                    isNumeric: false,
                    sortable: true,
                    filterValues: null,
                },
                age: {
                    key: "Age (years)",
                    sortable: true,
                    filterMin: null,
                    filterMax: null,
                    rangeMin: null,
                    rangeMax: null
                },
                sex: {
                    key: "Gender",
                    sortable: true,
                    filterValues: null,
                },
                bmi: {
                    key: "BMI",
                    sortable: true,
                    filterMin: null,
                    filterMax: null
                },
                diabetes: {
                    key: "Derived diabetes status",
                    sortable: true,
                    filterValues: null,
                },
                hba1c: {
                    key: "HbA1C (percentage)",
                    sortable: true,
                    filterMin: null,
                    filterMax: null,
                },
                ethnicity: {
                    key: "Ethnicities",
                    sortable: true,
                    filterValues: null,
                },
                isolation: {
                    key: "Isolation_center",
                    sortable: true,
                    filterValues: null,
                },
                cultureTime: {
                    key: "Pre-Shipment Culture Time (hours)", // TODO ADD TRANSIT TIME
                    sortable: true,
                    filterMin: null,
                    filterMax: null,
                },
            },
            minSuffix: "_DUPL"
        };
    },
    async created() {
        await this.$store.dispatch("populateData", this.files);
        this.donorsWithData = this.getDonorsWithData(this.$store.state.ins);
        this.filteredMetadata = this.$store.state.metadata.filter(m => 
                this.donorsWithData.includes(m.Accession));
        this.availableDonors = this.$store.state.metadata.map(m => m.Accession);
        this.getRanges(this.filteredMetadata);

        // Get data
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
        filteredDonors(){
            let allDonors = structuredClone(this.filteredMetadata);
            return allDonors.map(m => m.Accession);/* 
            let fields = Object.values(this.fieldsObject);
            fields.forEach(field => {
                if (!Number.isNaN(field.filterMin)){
                    allDonors = allDonors.filter(d => d[field.key] >= field.filterMin);
                }
                if (!Number.isNaN(field.filterMax)){
                    allDonors = allDonors.filter(d => d[field.key] <= field.filterMax);
                }
                console.log(field.key, allDonors.length);
            });
            console.log(JSON.stringify(allDonors));
            return allDonors.map(m => m.Accession); */
        }
    },
    methods: {
        getRanges(data){
            Object.values(this.fieldsObject).forEach(valEntry => {
                let fieldKey = valEntry.key;
                if (valEntry.rangeMin === null){
                    let useableData = data.filter(d=> !Number.isNaN(d[fieldKey]));
                    let min = useableData[0][fieldKey];
                    let max = useableData[0][fieldKey];
                    useableData.forEach(d => {
                        min = d[fieldKey] < min ? d[fieldKey] : min;
                        max = d[fieldKey] > max ? d[fieldKey] : max;
                    });
                    valEntry.rangeMin = min;
                    valEntry.rangeMax = max;
                }
            });
            console.log(JSON.stringify(this.fieldsObject));
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
        fieldKey(fieldData){
            let output = !fieldData.isMinimum ? fieldData.key : `${fieldData.key}${this.minSuffix}`;
            return output;
        },
        getDonorsWithData(insData){
            let dataPoint = insData[0];
            let donors = Object.keys(dataPoint).filter(d =>!d.startsWith("time"));
            return donors;
        },
        updateFilters(field, isRange, value){
            let fieldKey = field.key;
            let fieldEntry = Object.values(this.fieldsObject).find(f => f.key === fieldKey);
            if (isRange){
                fieldEntry.filterMin = value[0];
                fieldEntry.filterMax = value[1];
            } else if (typeof value !== "object") {
                fieldEntry.filterValues = [value];
            } else {
                fieldEntry.filterValues = value;
            }
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
