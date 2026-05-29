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
import FunctionalViolinPlot from "../../components/FunctionalViolinPlot.vue";
import keyParams from "@/utils/keyParams";
import regionUtils from "@/utils/regionUtils";
import dataConvert from "@/utils/dataConvert";
import BIO_INDEX_HOST from "@/utils/bioIndexUtils";
import colors from "@/utils/colors";
const PANKBASE_BIOINDEX = BIO_INDEX_HOST.BIO_INDEX_HOST.replace("hugeamp", "pankbase");
const timepointsFile = "/data/pankbase/HIPP_gcg_ieq.timepoints.txt";
const gcgTimepointsFile = `${PANKBASE_BIOINDEX}/api/raw/file/single_cell_time_series/HIPP/HIPP_gcg_ieq.timepoints.txt`;
const insTimepointsFile = `${PANKBASE_BIOINDEX}/api/raw/file/single_cell_time_series/HIPP/HIPP_ins_ieq.timepoints.txt`;
const dashFormatter = function(item){
    return item === '-' ? "N/A" : item;
};

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
        FilterRadio,
        FunctionalViolinPlot
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            pageId: "pankbase_functionalbrowser",
            about: "",
            files: {
                allTraits: "HIPP_all_traits.pankbase.txt",
                gcg: "HIPP_gcg_ieq.pankbase.txt",
                ins: "HIPP_ins_ieq.pankbase.txt",
                metadata: "meta-data.merged.pankbase.combined.final.txt",
                gcgContent: "HIPP_gcg_content.pankbase.txt",
                insContent: "HIPP_ins_content.pankbase.txt"
            },
            assoc_filenames: [
                "HIPP_Age_skipped.csv",
                "HIPP_Age.csv",
                "HIPP_BMI_skipped.csv",
                "HIPP_BMI.csv",
                "HIPP_Derived-Diabetes-Status_skipped.csv",
                "HIPP_Derived-Diabetes-Status.csv",
                "HIPP_Diabetes-status_skipped.csv",
                "HIPP_Diabetes-status.csv",
                "HIPP_Ethnicities_skipped.csv",
                "HIPP_Ethnicities.csv",
                "HIPP_Gender_skipped.csv",
                "HIPP_Gender.csv",
                "HIPP_Genetic-sex_skipped.csv",
                "HIPP_Genetic-sex.csv",
                "HIPP_HbA1c_skipped.csv",
                "HIPP_HbA1c.csv",
                // "HIPP_T1D-stage_skipped.csv",
                // "HIPP_T1D-stage.csv" Not using this for now
            ],
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
            fieldsObject: {
                accession: {
                    key: "Accession",
                    sortable: true,
                    noSidebar: true,
                },
                donorId: {
                    key: "Center Donor ID",
                    sortable: true,
                    noSidebar: true,
                },
                age: {
                    key: "Age (years)",
                    isNumeric: true,
                    sortable: true,
                },
                sex: {
                    key: "Gender",
                    label: "Reported gender",
                    sortable: true
                },
                bmi: {
                    key: "BMI",
                    isNumeric: true,
                    customStep: 0.01,
                    sortable: true
                },
                diabetesDesc: {
                    key: "Description of diabetes status",
                    sortable: true
                },
                diabetes: {
                    key: "Derived diabetes status",
                    label: "Hba1c-derived diabetes status",
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
            advancedFields: {
                cPeptide: {
                    key: "C-Peptide (ng/ml)",
                    isNumeric: true,
                    sortable: true,
                },
                aabGada: {
                    key: "AAB GADA value (unit/ml)",
                    isNumeric: true,
                    sortable: true,
                },
                aabIa2: {
                    key: "AAB IA2 value (unit/ml)",
                    isNumeric: true,
                    sortable: true,
                },
                aabIaa: {
                    key: "AAB IAA value (unit/ml)",
                    isNumeric: true,
                    sortable: true
                },
                aabZnt8: {
                    key: "AAB ZNT8 value (unit/ml)",
                    isNumeric: true,
                    sortable: true
                },
                numberAab: {
                    key: "Number AAB",
                    isNumeric: true,
                    sortable: true,
                },
                hospitalStay: {
                    key: "Hospital Stay (hours)",
                    isNumeric: true,
                    sortable: true,
                },
                collections: {
                    key: "Collections",
                    isNumeric: false,
                    sortable: true,
                },
                donationType: {
                    key: "Donation Type",
                    isNumeric: false,
                    sortable: true,
                },
                aabGadaPositive: {
                    key: "AAB GADA POSITIVE",
                    isNumeric: false,
                    sortable: true
                },
                aabIa2Positive: {
                    key: "AAB IA2 POSITIVE",
                    isNumeric: false,
                    sortable: true
                },
                aabIaaPositive: {
                    key: "AAB IAA POSITIVE",
                    isNumeric: false,
                    sortable: true
                },
                aabZnt8Positive: {
                    key: "AAB ZNT8 POSITIVE",
                    isNumeric: false,
                    sortable: true,
                },
                multiAab: {
                    key: "Multi AAB",
                    isNumeric: false,
                    sortable: true
                },
                onlyAabGada: {
                    key: "Only AAB GADA",
                    isNumeric: false,
                    sortable: true,
                },
                onlyAabIa2: {
                    key: "Only AAB IA2",
                    isNumeric: false,
                    sortable: true,
                },
                onlyAabIaa: {
                    key: "Only AAB IAA",
                    isNumeric: false,
                    sortable: true,
                },
                onlyAabZnt8: {
                    key: "Only AAB ZNT8",
                    isNumeric: false,
                    sortable: true,
                },
                causeOfDeath: {
                    key: "Cause of Death",
                    isNumeric: false,
                    sortable: true
                },
                familyHistory: {
                    key: "Family History of Diabetes",
                    isNumeric: false,
                    sortable: true
                },
                geneticSex: {
                    key: "Genetic Sex",
                    isNumeric: false,
                    sortable: true
                },
                t1dStage: {
                    key: "T1D stage",
                    isNumeric: false,
                    sortable: true
                },
                otherTherapy: {
                    key: "Other Therapy",
                    isNumeric: false,
                    sortable: true
                }


            },
            perPage: 10,
            currentPage: 1,
            selectedDonors: "",
            selectedDonorList: [],
            useSelected: false,
            linkedFilters: null,
            showAdvanced: false,
            functionalTrait: null,
            functionalAssocTrait: null,
            vlnConditions: [],
            showContent: false,
            assocTraits: []
        };
    },
    async created() {
        let content = await getPankbaseContent(this.pageId, true);
        this.about = content;
        await this.$store.dispatch("populateData", this.files);
        let aucData = this.$store.state.allTraits;
        let violinConditions = Object.keys(aucData[0])
            .filter(c => c !== "Pankbase_ID" && c !== "Donor ID");
        this.vlnConditions = violinConditions;
        if (!!keyParams.donorFilters){
            this.linkedFilters = JSON.parse(keyParams.donorFilters);
        }
        this.donorsWithData = this.getDonorsWithData(this.$store.state.ins);
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
            let sourceData = 
                this.showContent ? this.$store.state.insContent : 
                this.$store.state.ins;
            return this.collateData(sourceData);
        },
        gcgData(){
            let sourceData = 
                this.showContent ? this.$store.state.gcgContent : 
                this.$store.state.gcg;
            return this.collateData(sourceData);
        },
        filteredAccession(){
            let results = this.tableItems.map(d => d.Accession);
            if (results.length >= this.donorsWithData.length - 5){
                let missingDonors = this.donorsWithData.filter(d => !results.includes(d));
                missingDonors.forEach(m => {
                    let donorMetadata = this.filteredMetadata.find(fm => fm.Accession === m);
                });
            }
            return results;
        },
        tableItems(){
            // If only sidebar filters are used, apply sidebar filters
            let selection = this.filteredMetadata.filter(d => 
                this.selectedDonorList.includes(d.Accession) ||
                this.selectedDonorList.includes(d[this.fieldsObject.donorId.key])
            );
            // If the pasted-in donor list is applied, use that
            let results = !this.useSelected ? structuredClone(this.filteredDonors) : selection;
            return results;
        },
        tableFields(){
            let fields = structuredClone(Object.values(this.fieldsObject));
            fields.forEach(f =>
                f.formatter = dashFormatter
            );
            return fields;
        },
        presets(){
            return this.linkedFilters === null ? [] : this.linkedFilters;
        },
        filteredAucData(){
            if (this.functionalTrait === null){
                return [];
            }
            let results = structuredClone(this.$store.state.allTraits);
            results = results.filter(d => this.filteredAccession.includes(d.Pankbase_ID));
            results.forEach(r => {
                let demoData = this.filteredMetadata.find(m => m.Accession === r.Pankbase_ID);
                r[this.functionalTrait] = demoData[this.functionalTrait];
            });
            return results;
        },
        violinTrait(){
            // Needs to be computed for the plot to update in real time
            return this.functionalTrait;
        },
        assocTraitData(){
            if (this.functionalAssocTrait === null){
                return [];
            }
            return this.$store.state.assoc_data[this.functionalAssocTrait];
        },
        functionalAssocFields(){
            if (this.assocTraitData.length === 0){
                return [];
            }
            let fields = Object.keys(this.assocTraitData[0]);
            let lastField = "covariates";
            if (fields.includes(lastField)){
                fields = fields.filter(f => f !== lastField);
                fields.push(lastField);
            }
            return fields.map(f => {
                let definition = {
                    key: f,
                    formatter: f => isNaN(f) ? f : Number(f).toPrecision(3)
                }
                return definition;
            })
        },
        functionalColorMap(){
            let xField = this.functionalTrait;
            let empty = "-";
            let categories = Array.from(new Set(
                this.filteredAucData.map(d => d[xField]).filter(d => d !== empty)));
            
            // Map colors
            let colorMap = {};
            for (let i = 0; i < categories.length; i++){
                let category = categories[i];
                let color = colors[i] || colors[colors.length % i];
                colorMap[category] = color;
            }
            return colorMap;
        }
    },
    methods: {
        async populateAssoc(){
            await this.$store.dispatch("populateAssocData", this.assoc_filenames);
            this.assocTraits = Object.keys(this.$store.state.assoc_data)
                .filter(t => !t.includes("skipped"));
        },
        useSelectedDonors(useSelected){
            this.useSelected = useSelected;
        },
        selectDonors(){
            let delimiters = /[,\s]/;
            let entries = this.selectedDonors.split(delimiters)
                .filter(e => e.length > 0);
            let donorIdFinder = /[\w]+/;
            entries = entries.map(e => e.match(donorIdFinder)[0]);
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
                let badData = false;
                let singleDonorResults = [];
                // TODO ask Kyle how we want to handle this
                data.forEach(timePoint => {
                    let donorResults = {};
                    donorResults.donor = donor;
                    donorResults.time = timePoint.time;
                    donorResults.score = timePoint[donor];
                    if (donorResults.score === "-"){
                        badData = true;
                    }
                    singleDonorResults.push(donorResults);
                    if (maxTime === null || timePoint.time > maxTime){
                        maxTime = timePoint.time;
                    }
                    if (maxScore === null || timePoint[donor] > maxScore){
                        maxScore = timePoint[donor];
                    }
                });
                singleDonorResults.forEach(r => r.donorHasGaps = badData);
                results = results.concat(singleDonorResults)
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
        clearPresets(){
            this.linkedFilters = [];
            let presetButton = document.getElementById("clearPresets");
            presetButton.setAttribute("disabled", true);
        },
        getDonorsWithData(insData){
            let dataPoint = insData[0];
            let donors = Object.keys(dataPoint).filter(d =>!d.startsWith("time"));
            return donors;
        },
        getRange(field){
            let fieldKey = field.key;
            let availableEntries = this.filteredMetadata.filter(d => 
                typeof d[fieldKey] === "number");
            let min = availableEntries[0][fieldKey];
            let max = availableEntries[0][fieldKey];
            availableEntries.forEach(d => {
                    min = d[fieldKey] < min ? d[fieldKey] : min;
                    max = d[fieldKey] > max ? d[fieldKey] : max;
                });
            return {min: min, max: max};
        },
        applyLinkedFilters(data){
            if (this.linkedFilters === null){
                return data;
            }
            let results = structuredClone(data);
            for (let i = 0; i < this.linkedFilters.length; i++){
                let filter = this.linkedFilters[i];
                let field = filter.name;
                if (!!filter.values){
                    results = results.filter(r => filter.values.includes(r[field]));
                }
            }
            return results;
        },
        toggleAdvanced(){
            this.showAdvanced = !this.showAdvanced;
        },
        updateFilterList(filterList){
            let filterParams = [];
            filterList.forEach(filter => {
                let param = { name: filter.field };
                if (!isNaN(filter.threshold.min) && !isNaN(filter.threshold.max)){
                    param.min = filter.threshold.min;
                    param.max = filter.threshold.max;
                } else {
                    param.values = filter.threshold;
                }
                filterParams.push(param);
            });
            let donorFilters = JSON.stringify(filterParams);
            keyParams.set({donorFilters: donorFilters});
        },
        copyResults(){
            window.navigator.clipboard.writeText(window.location);
            console.log(window.location);
        },
        replaceFieldNames(names){
            return names.replaceAll("Gender", "Reported gender")
                .replaceAll("Derived", "HbA1c-derived");
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
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
