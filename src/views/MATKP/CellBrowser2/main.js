import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import Template from "./Template.vue";
//import store from "./store.js";

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);
Vue.config.productionTip = false;

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "../assets/matkp-styles.css"

import matkpNav from "../components/matkp-nav.vue";
import matkpFooter from "../components/matkp-footer.vue";
import StackedBarChart from '../components/StackedBarChart.vue';
import UMAPPlot from '../components/UMAPPlot.vue';
import BoxPlot from '../components/BoxPlot.vue';
import ViolinPlot from '../components/ViolinPlot.vue';
import RidgelinePlot from '../components/RidgelinePlot.vue';
import HeatmapDotPlot from '../components/HeatmapDotPlot.vue';

import * as d3 from "d3";
import * as _ from "lodash";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import keyParams from "@/utils/keyParams";
import { dropRightWhile } from "lodash";

//import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils"; 
const BIO_INDEX_HOST = 'https://bioindex-dev.hugeamp.org';

const colors = ["#007bff","#048845","#8490C8","#BF61A5","#EE3124","#FCD700","#5555FF","#7aaa1c","#F88084","#9F78AC","#F5A4C7","#CEE6C1","#cccc00","#6FC7B6","#D5A768","#d4d4d4"]

const datasetsTemp = {
    'SingleCell_Emont2022_Humans_SCP1376':{
        "study_design":"We collected subcutaneous WAT from nine women, isolated single cells from the SVF using collagenase digestion, and then performed whole-cell Drop-seq. Because different depots have been differentially linked to metabolic disease, for the second cohort we collected paired subcutaneous (SAT) and visceral (VAT) adipose tissue from ten individuals and SAT alone from three additional individuals (ten women and three men), and performed sNuc-seq. Doublet and low-quality filtering left 166,149 total cells (28,465 single cells and 137,684 single nuclei). The data from both approaches were integrated.",
        "cell_info":"The data from both approaches were integrated, enabling the identification of the canonical cell types found in WAT, including adipocytes, adipose stem and progenitor cells (ASPCs), vascular cells and immune cells. As expected, adipocytes were found only in the sNuc-seq dataset. The sNuc-seq data were also enriched for vascular cells and macrophages, probably because collagenase digestion did not fully dissociate these cell types. Mesothelial cells were not detected in the scRNA-seq data- set, which did not include visceral tissue.",
        "genes_info": "Marker genes for each cell population in the human WAT dataset.",
        "samples": "biosample_id",
        "donors": "donor_id",
        "study_characteristics": [["fat__type", "sex"], [ "fat__type", "library_preparation_protocol__ontology_label"]],
        "donor_characteristics": ["sex",  "organism_age__group", "bmi__group", "ethnicity__ontology_label", "race__ontology_label", "fat__type", "depot__ontology_label", "library_preparation_protocol__ontology_label"],
        "cellTypes": ["cell_type__custom", "cell_subtype__custom"],
        "conditions": ["bmi__group", "library_preparation_protocol__ontology_label", "sex"],
        "markerGenes": ["ADIPOQ", "PDGFRA", "MSLN", "JAM2", "PROX1", "STEAP4", "MYOCD", "MAFB", "CYBB", "FLT3", "CPA3", "CSF3R", "MS4A1", "KLRD1", "IL7R", "PRLR"],
        
    },
    'SingleCell_Emont2022_Mouse_SCP1376_SN_PG':{
        "samples": "biosample_id",
        "donors": "donor_id",
        "donor_characteristics": ["sex",  "diet__type", "depot__ontology_label", "cell_cycle__phase", "organism_weight" ],
        "cellTypes": ["cell_type__custom", "cell_subtype__custom"],
        "conditions": ["diet__type"],
        "markerGenes": ["Adipoq", "Pdgfra"],// "Msln", "Jam2", "Prox1", "Steap4", "Myocd", "Mafb", "Cybb", "Flt3", "Cpa3", "Csf3r", "Ms4a1", "Klrd1", "Il7r", "Dcdc2a", "Erbb4"],
    }
}
  

new Vue({
    //store,
    mounted() {
        //add scroll listener
        //window.addEventListener('scroll', this.handleScroll);

        //this.injectScript('https://cdn.jsdelivr.net/gh/stdlib-js/stats-ttest2@umd/browser.js');
        //this.injectScript('https://cdn.jsdelivr.net/gh/stdlib-js/stats-chi2test@umd/browser.js');
        //this.injectScript('https://cdn.jsdelivr.net/npm/jstat@latest/dist/jstat.min.js');
        //this.injectScript('https://cdn.jsdelivr.net/gh/stdlib-js/stats-chi2test@umd/browser.js');
    },
    render(createElement, context) {
        return createElement(Template);
    },
    components: {
        matkpNav,
        matkpFooter,
        StackedBarChart,
        UMAPPlot,
        BoxPlot,
        ViolinPlot,
        HeatmapDotPlot
    },
    data() {
      return {
        isLoading: false,
        preload: true, 
        preloadItem: '',
        showMore: false,

        colorScaleIndex: d3.scaleOrdinal(colors),
        colorScalePlasma: d3.scaleSequential(d3.interpolatePlasma),
        colorScalePlasmaColorsArray: [],
        colorIndex: 0,

        d: '::',
        datasets: null,
        rawData: null,
        fieldColors: null,

        parsedData: null,

        datasetConfig: null,
        datasetSettings: null,

        totalDonors: 0,
        totalSamples: 0,
        studyDesign: null,
        cellInfo: null,
        donorInfo: null,
        genesInfo: null,
        donorInfoGroups: null,
        expressionStats: [],
        combinedExpressionStats: [],

        donorsTable: null,
        
        cellTypeTable: null,
        cellTypeConditionTable: null,

        selectedConditions: [null, null],

        cellTypeInfo: null,
        cellTypeConditionsInfo: [],
        cellTypeByConditionsInfo: null,
        cellTypeByFattypeInfo: null,
    
        activeGene: '',
        geneNames: [],
        expressionData: [],
        statistics: null,
        geneExpressionA: null,
        geneExpressionB: null,
        combinedExpression: null,
        expressionRows: [],
        expressionHeaders: [],
        dgeRows: [],
        dgeHeaders: [],

        referenceField: null,

        chartStates: [],

        headers: [],
        headersA: [],
        headersB: [],
        headers2: [],

        rows: [],
        aRows: [],
        bRows: [],

        sortedRows: [],
        sortedRowsA: [],
        sortedRowsB: [],
        
        footer: [],

        coordinates: [],
        coordinateColorsA: [],
        coordinateColorsB: [],
        coordinateColorsGene: null,

        categoryCombos: {},
        categoriesLeft: [],
        categoriesRight: [],
        lastCategoriesLeft: [],
        lastCategoriesRight: [],

        doNormalize: true,
        doStack: true,
        combinedBarsFstat: null,
        combinedBarsPval: null,

        //sidebar
        scrollThreshhold: 65,
        fixedSidebar: false,

        cache: {},
      };
    },
    async created() {
        //start
        this.init();
    },
    watch:{
        activeGene: function (val){
            if(val !== '') {
                console.log('new activeGene', val);
                this.calcCombinedExpressionStats(val);
            }
        }
    },
    computed: {
        listOfCategories() {
            if(!this.rawData) return null;
            const source = this.rawData["metadata_labels"];
            const allCategories = Object.keys(source);
            const filtered = allCategories.filter(category => source[category].length>1);
            return filtered.sort();
        },
        categoryKeysLeft() {
            return this.categoryKeys(this.categoriesLeft, 'left');//.sort((a, b) => a.localeCompare(b));
        },
        categoryKeysRight() {
            return this.categoryKeys(this.categoriesRight, 'right');//.sort((a, b) => a.localeCompare(b));
        },
        currentDataset() {
            if(!this.datasets || !this.activeDataset) return null;
            return this.datasets.filter(dataset => dataset.datasetId === this.activeDataset)[0];
        },
        calcCombinedExpression(){
            const ce = this.getCombinedGeneExpression(this.activeGene);
            console.log('calcCombinedExpression', ce)
            return ce;
        },
        calcUmapExpressionColors(){
            return this.getUmapExpressionColors(this.activeGene);
        }
    },
    methods: {
        //setup and load
        async init(){
            //preload data
            this.preloadItem = 'metadata';
            this.datasets = await this.fetchDatasets();

            if(keyParams.dataset){
                this.activeDataset = keyParams.dataset
            }else{
                this.activeDataset = this.datasets[0].datasetId;
                keyParams.set({dataset: this.activeDataset});
            }

            this.preloadItem = 'fields';
            this.rawData = await this.fetchFields();

            this.preloadItem = 'coordinates';
            this.coordinates = await this.fetchCoordinates();

            await Vue.nextTick();

            this.preloadItem = '';
            this.preload = false;

            //pre-calculate colors for fields in each category
            this.fieldColors = this.calcFieldColors(this.rawData);
            this.colorScalePlasmaColorsArray = d3.range(0, 1.01, 0.1).map(t => this.colorScalePlasma(t)).join(', ')
            
            //all categories in dataset
            const allCategories = this.listOfCategories; 
            for(const [key, value] of Object.entries(this.rawData.metadata_labels)){
                this.sortArray(value);
            }
            
            //parse raw arrays, into json table object
            const parsedData = this.parseRawDataByCategory(this.rawData, allCategories);

            //get dataset config
            this.datasetConfig = datasetsTemp[this.activeDataset];

            //if a display config was not supplied
            if(!this.datasetConfig){
                //this tries to sniff out a minimum set of params from the fields list
                const donorsCategory = allCategories.filter(category => category.includes('donor'));
                const samplesCategory = allCategories.filter(category => category.includes('sample'));
                const cellClusterCategory = allCategories.filter(category => category.includes('cluster'));
                const cellTypeCategory = allCategories.filter(category => category.includes('cell') && category.includes('type'));
                const exclusionWords = [...donorsCategory, ...samplesCategory, ...cellClusterCategory, ...cellTypeCategory];
                const allCategoriesMinusExcluded = allCategories.filter(word => !exclusionWords.includes(word));
                this.datasetConfig = {
                    samples: samplesCategory,
                    donors: donorsCategory,
                    donor_characteristics: allCategoriesMinusExcluded,
                    cellTypes: cellClusterCategory,
                    conditions: allCategoriesMinusExcluded,
                }
                console.log('sniffed config', this.datasetConfig);
            }

            //create display based on config and fields data
            this.studyDesign = this.datasetConfig.study_design;
            this.cellInfo = this.datasetConfig.cell_info;
            this.genesInfo = this.datasetConfig.genes_info;

            this.datasetSettings = JSON.parse(JSON.stringify(this.datasetConfig));
            this.datasetSettings.selectedCellType = this.datasetConfig.cellTypes[0];

            const parsedDataDonors = this.filterUniqueByCategory(parsedData, this.datasetConfig.donors);
            const parsedDataSamples = this.filterUniqueByCategory(parsedData, this.datasetConfig.samples);
            this.totalDonors = parsedDataDonors.length;
            this.totalSamples = parsedDataSamples.length;

            //study
            if(this.datasetConfig.study_characteristics){
                const results = [];
                this.datasetConfig.study_characteristics.forEach(item => {
                    if(Array.isArray(item) && item.length===2){
                        const counts = this.getGroupedCounts(parsedDataDonors, item);
                        results.push({
                            key: item[0],
                            subKey: item[1],
                            data: counts
                        });
                    }
                })
                this.donorInfoGroups = results;
            }

            //donors
            const donorInfoSubset = this.datasetConfig.donor_characteristics.slice(0, 4);
            this.updateDonorsInfo(donorInfoSubset);
               
            //cell types
            this.datasetSettings.selectedConditions = [null, null];
            this.datasetSettings.selectedConditions[0] = this.datasetConfig.conditions[0];
            this.updateCellsInfo(this.datasetSettings.selectedCellType, this.datasetSettings.selectedConditions[0]);

            //marker genes
            if(this.datasetConfig.markerGenes && this.datasetConfig.markerGenes.length>0){
                this.datasetConfig.markerGenes.forEach(gene => {
                    this.fetchGeneExpression(gene);
                });
            }
            
            
            //TODO: clean code!
            

            return;

            //
            const datasetSetup = datasetsTemp[this.activeDataset];
            if(datasetSetup){
                console.log('we have set info', datasetSetup);
                const cellTypesCategory = Array.isArray(datasetSetup.cellTypes) ? datasetSetup.cellTypes[0] : datasetSetup.cellTypes;
                const conditionsCategory = Array.isArray(datasetSetup.conditions) ? datasetSetup.conditions[0] : datasetSetup.conditions;
                this.categoriesLeft.push(cellTypesCategory);
                this.categoriesRight.push(conditionsCategory);

                const characteristics = await this.processData({
                    left: Array.isArray(datasetSetup.donors) ? datasetSetup.donors : [datasetSetup.donors],
                    right: datasetSetup.donor_characteristics
                });

                this.processCharacterisitcs(characteristics, datasetSetup.donor_characteristics);
            }
    
            //
            await this.calculateTable({left:this.categoriesLeft, right:this.categoriesRight});

            //
            const rect = document.querySelector('.sidebar-parent').getBoundingClientRect();
            this.scrollThreshhold = rect.top + window.scrollY;
            console.log('scrollThreshhold', rect, window.scrollY, this.scrollThreshhold);

            //
            this.colorScalePlasmaColorsArray = d3.range(0, 1.01, 0.1).map(t => this.colorScalePlasma(t)).join(', ')

            //
            if(datasetSetup){
                datasetSetup.markerGenes.forEach(gene => {
                    this.fetchGeneExpression(gene);
                })
            }
            
        },
        async fetchDatasets(){
            console.log('getting datasets');
            try{
                const fetchPath = '/api/raw/file/single_cell_metadata/dataset_metadata.json.gz';
                const response = await fetch(`${BIO_INDEX_HOST}${fetchPath}`);
                const dataText = await response.text();
                const lines = dataText.split('\n').filter(line => line.trim() !== '');
                const jsonObjects = lines.map(line => JSON.parse(line));
                console.log('   datasets', jsonObjects);
                return jsonObjects;
            }catch (error){
                console.error('Error fetching datasets:', error);
            }
            
        },
        async fetchFields() {
            console.log('getting fields');
            try {
                const response = await fetch(`${BIO_INDEX_HOST}/api/raw/file/single_cell/${this.activeDataset}/fields.json.gz`);
                const rawData = await response.json();

                console.log('   fields', rawData);
                return rawData;
            } catch (error) {
                console.error('Error fetching fields:', error);
            }
        },
        async fetchCoordinates() {
            console.log('getting coordinates');
            try {
                const response = await fetch(`${BIO_INDEX_HOST}/api/raw/file/single_cell/${this.activeDataset}/coordinates.tsv.gz`)
                const json = this.tsvToJson(await response.text());
                console.log('   coordinates', json);
                return json;
            }catch (error){
                console.error('Error fetching coordinates:', error);
            }
        },
        async fetchGeneExpression(gene){
            console.log('fetchGeneExpression', gene);
            this.isLoading = true;
            await Vue.nextTick();
            try{
                const response = await fetch(`${BIO_INDEX_HOST}/api/bio/query/single-cell-lognorm?q=${this.activeDataset},${gene}`);
                const json = await response.json();
                const expression = json.data[0]['expression'];
                this.geneNames.push(gene);
                this.expressionData[gene] = expression;
                //console.log('   ', this.expressionData);

                this.isLoading = false;
                await Vue.nextTick();

                //this.parseGeneExpression();
                if(this.datasetSettings){
                    const geneStats = await this.getGeneExpression(this.expressionData[gene], this.datasetSettings.selectedCellType);
                    this.expressionStats.push({[gene]:geneStats});
                }else{
                    this.parseGeneExpression();
                }
                if(!this.activeGene || this.activeGene===''){
                    this.activeGene = gene;
                }
            }catch(error){
                console.error('   Error fetching gene expression', error);
            }
        },

        //new
        parseRawDataByCategory(rawData, categoryKeys){
            console.log('parseRawDataByCategory', categoryKeys);

            const { NAME, metadata, metadata_labels } = rawData;
            const parsedData = [];
          
            //process data based on user selected categories
            for (let i = 0; i < NAME.length; i++) {
                const record = {};
                for (const cat in categoryKeys) {
                    const category = categoryKeys[cat];
                    if (metadata.hasOwnProperty(category)) {
                        const labelIdx = metadata[category][i];
                        const label = metadata_labels[category][labelIdx];
                        record[category] = label;
                    }
                }
                parsedData.push(record);
            }
          
            //console.log('   parsedData', parsedData);

            return parsedData;
        },
        filterUniqueByCategory(parsedData, key){
            console.log('filterUniqueByCategory', key, typeof key);
            const seen = new Set();
            return parsedData.filter(item => {
              const keyValue = item[key];
              if (seen.has(keyValue)) {
                return false;
              }
              seen.add(keyValue);
              return true;
            });
        },
        filterUniqueByCategoryRows(parsedData, key) {
            const uniques = new Set();
            return parsedData.filter(obj => {
                if (uniques.has(obj[key])) {
                    return false;
                } else {
                    uniques.add(obj[key]);
                    return true;
                }
            });
        },
        getCounts(parsedData, categoryKeys, uniqueKey=null){
            console.log('getCounts', categoryKeys, uniqueKey);
            //get counts from parsed data by keys
            const calculateCounts = (data, keys) => {
                return keys.reduce((acc, key) => {
                    acc[key] = data.reduce((acc, donor) => {
                        acc[donor[key]] = (acc[donor[key]] || 0) + 1;
                        return acc;
                    }, {});
                    return acc;
                }, {});
            };
            const counts = calculateCounts(parsedData, categoryKeys);
            console.log('   total counts', counts);
            return counts;
        },
        getGroupedCounts(parsedData, categoryKeys, uniqueKey=null){
            console.log('getGroupedCounts', categoryKeys, uniqueKey);
            /*
            const groupAndCount = (data, keys) => {
                return data.reduce((acc, item) => {
                    let currentLevel = acc;
                  
                    keys.forEach((key, index) => {
                        const keyValue = item[key];
                        if (index === keys.length - 1) {
                            currentLevel[keyValue] = (currentLevel[keyValue] || 0) + 1;
                        } else {
                            currentLevel[keyValue] = currentLevel[keyValue] || {};
                            currentLevel = currentLevel[keyValue];
                        }
                    });

                    return acc;
                }, {});
            }*/
            const groupAndCount = (data, keys) => {
                return data.reduce((acc, item) => {
                    let currentLevel = acc;
                
                    keys.forEach((key, index) => {
                        const keyValue = item[key];
                        if (index === keys.length - 1) {
                            // At the last key, increment the count
                            currentLevel[keyValue] = (currentLevel[keyValue] || 0) + 1;
                        } else {
                            // For intermediate keys, ensure the structure exists
                            currentLevel[keyValue] = currentLevel[keyValue] || {};
                            currentLevel = currentLevel[keyValue];
                        }
                    });
                
                    return acc;
                }, {});
            };

            const groupedCounts = groupAndCount(parsedData, uniqueKey ? [uniqueKey, ...categoryKeys] : categoryKeys);
            console.log('   grouped counts', groupedCounts);
            return groupedCounts;
        },
        bTableFromCounts(countsData, category){
            console.log('bTableFromCoutns', countsData, category);

            const data = countsData[category];
            const rows = [];
            let grandTotal = 0;

            for(const [key, value] of Object.entries(data)){
                const row = {[category]: key, 'Total': value};
                grandTotal += value;
                rows.push(row);
            }

            let keys = Object.keys(rows[0]);
            const header = keys.map(key => (
                { key, label: key, sortable: true}
            ));

            const footer = {[category]: 'Total'};
            footer['Total'] = grandTotal;

            const result = {rows, header, footer};
            console.log('   result', result);

            return result;
        },
        getUniqueKeysAtEachLevel(obj){
            const result = [];
            const traverse = (currentObj, level) => {
                if (typeof currentObj !== 'object' || currentObj === null) return;
                if (!result[level]) result[level] = new Set();
                for (let key in currentObj) {
                    if (currentObj.hasOwnProperty(key)) {
                        result[level].add(key);
                        traverse(currentObj[key], level + 1);
                    }
                }
            }
            traverse(obj, 0);
            return result.map(set => Array.from(set));
        },
        bTableFromGroupedCounts(groupedCountsData){
            console.log('bTableFromGroupedCounts', groupedCountsData);
            //const rows = [];
            //const totals = {};
            //let grandTotal = 0;

            const uniqueKeys = this.getUniqueKeysAtEachLevel(groupedCountsData);
            console.log('   depthKeys', uniqueKeys);

            const depth = uniqueKeys.length;

            if (depth < 2 || depth > 3) {
                throw new Error("Object depth must be 2 or 3 for this table structure");
            }

            if (depth === 2) {
                let rows = [];
                let columns = [];
                let footerRow = { _rowVariant: 'footer', Category: 'Total' };

                if (depth === 2) {
                    columns = uniqueKeys[1].map(key => ({ key, label: key }));
                    columns.unshift({ key: '_rowVariant', label: this.datasetSettings.selectedCellType });
                    columns.push({ key: 'rowTotal', label: 'Total' });

                    for (let topKey of uniqueKeys[0]) {
                        let row = { _rowVariant: topKey };
                        let rowTotal = 0;
                        for (let colKey of uniqueKeys[1]) {
                            const value = groupedCountsData[topKey]?.[colKey] || 0;
                            row[colKey] = value;
                            rowTotal += value;
                            footerRow[colKey] = (footerRow[colKey] || 0) + value;
                        }
                        row.rowTotal = rowTotal;
                        rows.push(row);
                    }

                    // Calculate total for the Total column
                    footerRow.rowTotal = Object.values(footerRow)
                        .filter(val => typeof val === 'number')
                        .reduce((sum, val) => sum + val, 0);
                }

                const result = { 
                    rows, 
                    header: columns,
                    footer: [footerRow]  // wrap in array for bTable
                }

                console.log('   2', result);

                return result;

            } else if (depth === 3) {
                let rows = [];
                let columns = [{ key: 'depth_1', label: this.datasetSettings.selectedCellType }];
                let footerRow = { depth_1: 'Total' };

                if (depth === 3) {
                    // Create columns
                    for (let depth_0_key of uniqueKeys[0]) {
                        for (let depth_2_key of uniqueKeys[2]) {
                            columns.push({
                                key: `${depth_0_key}_${depth_2_key}`,
                                label: `${depth_0_key} & ${depth_2_key}`
                            });
                        }
                        columns.push({ key: `${depth_0_key}_total`, label: `${depth_0_key} Total` });
                        if (depth_0_key !== uniqueKeys[0][uniqueKeys[0].length - 1]) {
                            columns.push({ key: `spacer_${depth_0_key}`, label: '' });
                        }
                    }
                    columns.push({ key: 'grand_total', label: 'Grand Total' });

                    // Create rows
                    for (let depth_1_key of uniqueKeys[1]) {
                        let row = { depth_1: depth_1_key };
                        let grandTotal = 0;

                        for (let depth_0_key of uniqueKeys[0]) {
                            let sectionTotal = 0;
                            for (let depth_2_key of uniqueKeys[2]) {
                                const value = groupedCountsData[depth_0_key]?.[depth_1_key]?.[depth_2_key] || 0;
                                row[`${depth_0_key}_${depth_2_key}`] = value;
                                sectionTotal += value;
                                footerRow[`${depth_0_key}_${depth_2_key}`] = (footerRow[`${depth_0_key}_${depth_2_key}`] || 0) + value;
                            }
                            row[`${depth_0_key}_total`] = sectionTotal;
                            footerRow[`${depth_0_key}_total`] = (footerRow[`${depth_0_key}_total`] || 0) + sectionTotal;
                            grandTotal += sectionTotal;
                            if (depth_0_key !== uniqueKeys[0][uniqueKeys[0].length - 1]) {
                                row[`spacer_${depth_0_key}`] = '';
                                footerRow[`spacer_${depth_0_key}`] = '';
                            }
                        }
                        row.grand_total = grandTotal;
                        rows.push(row);
                    }

                    // Calculate grand total for footer
                    footerRow.grand_total = Object.values(footerRow)
                    .filter(val => typeof val === 'number')
                    .reduce((sum, val) => sum + val, 0);
                    footerRow.grand_total /= uniqueKeys[0].length;
                }

                const result = { 
                    rows, 
                    header: columns,
                    footer: [footerRow]  // wrap in array for bTable
                }

                console.log('   3', result);

                return result;
            }
        },
        bTableFromRowData(rowData){
            const fields = rowData.length > 0 ? Object.keys(rowData[0]).map(key => ({
                key,
                label: key
            })) : [];
        
            return { rows:rowData, header: fields };
        },

        getGeneExpression(expressionData, category){
            //const categories = side==='left'?this.categoriesLeft:this.categoriesRight;

            console.log('getGeneExpression', category);

            const categoryLabels = this.rawData['metadata_labels'][category];
            const categoryData = this.rawData['metadata'][category];
            const geneExpression = {};
            const sumstat = [];

            categoryData.forEach((labelIdx, cellIdx) => {
                const label = categoryLabels[labelIdx];
                if (!geneExpression[label]) {
                    geneExpression[label] = [];
                }
                geneExpression[label].push(expressionData[cellIdx]);
            });
            categoryLabels.forEach(label => {
                const sortedValues = geneExpression[label] ? geneExpression[label].sort(d3.descending) : [0];
                const key = label;
                const mean = d3.mean(sortedValues)
                const q1 = d3.quantile(sortedValues, .25)
                const median = d3.quantile(sortedValues, .5)
                const q3 = d3.quantile(sortedValues, .75)
                const interQuantileRange = q3 - q1
                const min = sortedValues[0]
                const max = sortedValues[sortedValues.length-1]
                const pctExpr = (sortedValues.filter(val => val > 0).length / sortedValues.length) * 100;//sortedValues.length / 166149;
                sumstat.push({ key, mean, q1, median, q3, interQuantileRange, min, max, pctExpr });
            
            })

            console.log('   ', {geneExpression, sumstat});

            return sumstat;
        },
        getGeneExpressionCombined(expressionData, categoryA, categoryB){
            console.log('getGeneExpressionCombined');

            const categoryLabelsA = this.rawData['metadata_labels'][categoryA];
            const categoryDataA = this.rawData['metadata'][categoryA];

            const categoryLabelsB = this.rawData['metadata_labels'][categoryB];
            const categoryDataB = this.rawData['metadata'][categoryB];

            const geneExpression = {};
            const sumstat = {};

            for(var i=0; i<expressionData.length; i++){
                const labelA = categoryLabelsA[categoryDataA[i]];
                const labelB = categoryLabelsB[categoryDataB[i]];
                if(!geneExpression[labelA]) geneExpression[labelA] = {}
                if(!geneExpression[labelA][labelB]) geneExpression[labelA][labelB] = [];
                geneExpression[labelA][labelB].push(expressionData[i])
            }

            for (const labelA in geneExpression) {
                if(!sumstat[labelA]) sumstat[labelA] = []
                for(const labelB in geneExpression[labelA]){
                    const values = geneExpression[labelA][labelB];
                    const sortedValues = values ? values.sort(d3.descending) : [0];
                    const key = labelB;
                    const mean = d3.mean(sortedValues)
                    const q1 = d3.quantile(sortedValues, .25)
                    const median = d3.quantile(sortedValues, .5)
                    const q3 = d3.quantile(sortedValues, .75)
                    const interQuantileRange = q3 - q1
                    const min = sortedValues[0]
                    const max = sortedValues[sortedValues.length-1]
                    const pctExpr = (sortedValues.filter(val => val > 0).length / sortedValues.length) * 100;//sortedValues.length / 166149;
                    sumstat[labelA].push({ key, mean, q1, median, q3, interQuantileRange, min, max, pctExpr });
                }
            }

            //const sortedSubLabels = {};
            //for (const labelA in geneExpression) {
            //    sortedSubLabels[labelA] = this.sortObjectKeysLocale(geneExpression[labelA]);
                //console.log('---', labelA, sortedSubLabels[labelA]);
            //}


            console.log('   geneExpression', geneExpression);
            console.log(' . . sumstat', sumstat);

            return {geneExpression, sumstat};
        },
        calcCombinedExpressionStats(gene){
            if(!this.donorInfo) return;
            const expressionData = this.expressionData[gene];
            console.log('calcCombinedExpressionStats', expressionData);
            const statsA = this.getGeneExpression(expressionData, this.datasetSettings.selectedCellType);
            const statsB = this.getGeneExpression(expressionData, this.datasetSettings.selectedConditions[0]);
            const combinedStats = this.getGeneExpressionCombined(expressionData, this.datasetSettings.selectedCellType, this.datasetSettings.selectedConditions[0]);
            this.combinedExpressionStats = [
                {[gene]:statsB},
                {[gene]:statsA},
                combinedStats.sumstat,
            ]
            console.log('   ', this.combinedExpressionStats);
        },

        calcUmapColorsByCategory(category, subset=null){
            const pointColors = [];
            console.log('calcUmapColorsByCategory', category, subset)
            for (let i = 0; i < this.rawData.NAME.length; i++) {
                const labelIdx = this.rawData.metadata[category][i];
                const label = this.rawData.metadata_labels[category][labelIdx];
                if(!subset || (subset && subset.includes(label)))
                    pointColors[i] = this.fieldColors[category][label];
            }
            return pointColors;
        },
        colorsByCategory(category){
            //TODO sort order?
            const categoryColors = this.fieldColors[category];
            const sortedColors = Object.values(this.sortObjectKeysLocale(categoryColors));
            //console.log('colorsByCategory', category, {categoryColors, sortedColors});
            return sortedColors;
        },

        

        updateDonorsInfo(categories){
            //FIX: "donor_id" should be reference
            const parsedData = this.parseRawDataByCategory(this.rawData, [this.datasetConfig.donors, ...categories]);
            const filterUniqueDonors = this.filterUniqueByCategory(parsedData, this.datasetConfig.donors);
            const countsByDonor =  this.getCounts(filterUniqueDonors, categories);
            this.donorInfo = countsByDonor;

            const filterUniqueDonorsRows = this.filterUniqueByCategoryRows(parsedData, this.datasetConfig.donors);
            const donorRowsTable = this.bTableFromRowData(filterUniqueDonorsRows);
            this.donorsTable = donorRowsTable;
            return;
        },
        async updateCellsInfo(cellTypeCategory, conditionA, conditionB){
            //cell types
            const parsedData = this.parseRawDataByCategory(this.rawData, [cellTypeCategory, conditionA, conditionB]);
            const counts = this.getCounts(parsedData, [cellTypeCategory]);
            this.cellTypeInfo = {
                key: cellTypeCategory, 
                data: counts,
                umapColors: this.calcUmapColorsByCategory(cellTypeCategory)
            };
            const bTableFromCounts = this.bTableFromCounts(counts, cellTypeCategory);
            this.cellTypeTable = bTableFromCounts;

            await Vue.nextTick();

            const d = (label, key, subKey, value, subKeySubset=null) => {
                return {
                    label,
                    key: key, 
                    subKey: subKey, 
                    subKeyFields: [], 
                    data: value,
                    umapColors: this.calcUmapColorsByCategory(subKey, subKeySubset)
                }
            }

            const test = this.getGroupedCounts(parsedData, [cellTypeCategory,  conditionA], conditionB);
            const cellTypeConditions = [];
            if(conditionB){
                for (const [key, value] of Object.entries(test)) {
                    //cellTypeConditions.push(d(key, cellTypeCategory, conditionB, value, [key]));
                    cellTypeConditions.push(d(key, cellTypeCategory, conditionA, value));
                }
            }else{
                cellTypeConditions.push(d('', cellTypeCategory, conditionA, test));
            }
            this.chartStates = cellTypeConditions.map(() => ({
                doStack: true,
                doNormalize: true,
              }));
            this.cellTypeConditionsInfo = cellTypeConditions;
            console.log('   cellTypeConditions', cellTypeConditions, this.chartStates);

            const bTableFromGroupedCounts = this.bTableFromGroupedCounts(test);
            this.cellTypeConditionTable = bTableFromGroupedCounts;
        },

        toggleCategorySelect(e){
            const selectParent = e.target.closest('.categories').id;
            const selected = e.target.dataset.category;
            console.log('toggleCategorySelect', selectParent, selected)

            //FIX: how to select appropriate methods by section
            if(selectParent === 'select-donor-categories'){
                if(this.donorInfo[selected]){
                    Vue.delete(this.donorInfo, selected);
                }else{
                    this.updateDonorsInfo([...Object.keys(this.donorInfo), selected]);
                }
            }

            if(selectParent === 'select-cell-types'){
                if(this.datasetSettings.selectedCellType !== selected){
                    this.datasetSettings.selectedCellType = selected;
                    this.updateCellsInfo(selected, this.datasetSettings.selectedConditions[0], this.datasetSettings.selectedConditions[1])
                    if(this.activeGene){
                        this.expressionStats = [];
                        this.geneNames.forEach(gene => {
                            const geneStats = this.getGeneExpression(this.expressionData[gene], this.datasetSettings.selectedCellType);
                            this.expressionStats.push({[gene]:geneStats});
                        });
                        this.calcCombinedExpressionStats(this.activeGene)
                    }
                }
            }

            if(selectParent === 'select-conditions'){
                const side = e.target.dataset.side;
                if(side === 'a'){
                    this.datasetSettings.selectedConditions[0] = selected;
                    if(this.activeGene){
                        this.calcCombinedExpressionStats(this.activeGene)
                    }
                }
                if(side === 'b'){
                    this.datasetSettings.selectedConditions[1] = this.datasetSettings.selectedConditions[1] === selected ? null : selected;
                }
                //console.log("   ???", this.selectedConditions);
                this.updateCellsInfo(this.cellTypeInfo.key, this.datasetSettings.selectedConditions[0], this.datasetSettings.selectedConditions[1]);
            }

            return;
        },
        toggleStackChart(index) {
            this.$set(this.chartStates, index, {
                ...this.chartStates[index],
                doStack: !this.chartStates[index].doStack
            });
        },
        toggleNormalizeChart(index) {
            this.$set(this.chartStates, index, {
                ...this.chartStates[index],
                doNormalize: !this.chartStates[index].doNormalize
            });
        },
        toggleMore(){
            this.showMore = !this.showMore;
        },

        //KEEP
        //field color methods
        calcFieldColors(rawData){
            const colors = {};
            for(const [key, value] of Object.entries(rawData["metadata_labels"])){
                colors[key] = {};
                for(var i=0; i<value.length; i++){
                    colors[key][value[i]] = this.colorScaleIndex(this.colorIndex)
                    this.colorIndex++;
                }
            }
            console.log('fieldColors', colors);
            return colors;
        },
        


        //parse categorical data
        async calculateTable(categories){
            //clear previous data
            this.headers = [];
            this.headersA = [];
            this.headersB = [];
            this.headers2 = [];
            this.rows = [];
            this.footer = [];
            this.sortedRows = [];
            this.sortedRowsA = [];
            this.sortedRowsB = [];
            this.aRows = [];
            this.bRows = [];
            
            //calculate new data
            const processedData = await this.processData(categories);

            //return;

            this.processCellCounts(processedData, categories);

            if(this.geneNames.length>0){
                this.parseGeneExpression();
            }

            this.$nextTick(() => this.updateTableDrawer());
        },

       

        async processData(categories) {
            const allUserSelectedCategories = categories.left.concat(categories.right);
            console.log('allUserSelectedCategories', allUserSelectedCategories, typeof allUserSelectedCategories);

            if(allUserSelectedCategories.length===0) return;

            //TODO: we dont need to whole NAME array, just its length
            const processedData = [];
            const { NAME, metadata, metadata_labels } = this.rawData;
          
            //process data based on user selected categories
            for (let i = 0; i < NAME.length; i++) {
                const record = {};
                for (const cat in allUserSelectedCategories) {
                    const category = allUserSelectedCategories[cat];
                    if (metadata.hasOwnProperty(category)) {
                        const labelIdx = metadata[category][i];
                        const label = metadata_labels[category][labelIdx];
                        record[category] = label;
                    }
                }
                processedData.push(record);
            }
          
            console.log('processData', processedData);

            return processedData;
        },
        processCellCounts(processedData, categories){
            const allUserSelectedCategories = categories.left.concat(categories.right);
            console.log('allUserSelectedCategories', allUserSelectedCategories);

            if(allUserSelectedCategories.length===0) return;

            console.log('processCellCounts');
            //TODO: we dont need to whole NAME array, just its length
            const { NAME, metadata, metadata_labels } = this.rawData;
            const hasLeft = categories.left.length>0;
            const hasRight = categories.right.length>0;
            const pointColors = {left:[], right:[]};

            const leftIsNew = !this.areArraysEqual(categories.left, this.lastCategoriesLeft);
            const rightIsNew = !this.areArraysEqual(categories.right, this.lastCategoriesRight);

            this.lastCategoriesLeft = categories.left;
            this.lastCategoriesRight = categories.right;

            if(categories.left.length > 0){
                console.log('   A- selected')
                const aFreq = this.frequencyDistribution(processedData, categories.left);
                const aTable = this.frequencyTable(aFreq, categories.left);
                this.aRows = aTable.rows;
                this.sortedRowsA = this.localSort(this.aRows, this.categoriesLeft.join('|'), false);
                this.headersA = aTable.header;
                console.log('      A frequency', aFreq);
                console.log('      A distribution', aTable);
                if(categories.right.length === 0){
                    this.headers = aTable.header;
                    this.rows = this.sortedRowsA;
                    this.sortedRows = this.sortedRowsA;
                }
            }

            if(categories.right.length > 0){
                console.log('   -B selected')
                const bFreq = this.frequencyDistribution(processedData, categories.right);
                const bTable = this.frequencyTable(bFreq, categories.right);
                this.bRows = bTable.rows;
                this.sortedRowsB = this.localSort(this.bRows, this.categoriesRight.join('|'), false);
                this.headersB = bTable.header;
                console.log('      B frequency', bFreq);
                console.log('      B distribution', bTable);
                if(categories.left.length === 0){
                    this.headers = bTable.header;
                    this.rows = this.sortedRowsB;
                    this.sortedRows = this.sortedRowsB;
                }
            }

             //generate tables from processed data
             if(categories.left.length > 0 && categories.right.length > 0){
                console.log('   AB selected')
                const crossTabData = this.crossTabulation(processedData, categories.left, categories.right);
                console.log('      crossTabulation', crossTabData);
                //this.crossTabAnalysis(crossTabData);
                this.frequencyCrossTable(crossTabData);
            }

            //set colors for umaps
            const categoryLeft = categories.left.join('|');
            const categoryLeftCount = categories.left.length;
            const categoryRight = categories.right.join('|');
            const categoryRightCount = categories.right.length;
            for (let i = 0; i < NAME.length; i++) {
                if(hasLeft && leftIsNew){
                    const labelIdx1 = metadata[categories.left[0]][i];
                    const label1 = metadata_labels[categories.left[0]][labelIdx1];
                    if(categoryLeftCount<2){
                        pointColors.left[i] = this.fieldColors[categoryLeft][`${label1}`];
                    }else{
                        const labelIdx2 = metadata[categories.left[1]][i];
                        const label2 = metadata_labels[categories.left[1]][labelIdx2];
                        pointColors.left[i] = this.fieldColors[categoryLeft][`${label1}|${label2}`];
                    }
                }
                if(hasRight && rightIsNew){
                    const labelIdx1 = metadata[categories.right[0]][i];
                    const label1 = metadata_labels[categories.right[0]][labelIdx1];
                    if(categoryRightCount<2){
                        pointColors.right[i] = this.fieldColors[categoryRight][`${label1}`];
                    }else{
                        const labelIdx2 = metadata[categories.right[1]][i];
                        const label2 = metadata_labels[categories.right[1]][labelIdx2];
                        pointColors.right[i] = this.fieldColors[categoryRight][`${label1}|${label2}`];
                    }
                }
            }
            if(leftIsNew) this.coordinateColorsA = pointColors.left;
            if(rightIsNew) this.coordinateColorsB = pointColors.right;
        },
        processCharacterisitcs(processedData, keys){
            //TODO: dedupe data earlier
            // Create a map to store unique donors
            const uniqueDonorsMap = processedData.reduce((acc, donor) => {
                acc[donor.donor_id] = donor;
                return acc;
            }, {});

            // Extract unique donors from the map
            const uniqueDonors = Object.values(uniqueDonorsMap);

            // Function to calculate statistics based on keys
            const calculateStats = (data, keys) => {
                return keys.reduce((acc, key) => {
                    acc[key] = data.reduce((acc, donor) => {
                        acc[donor[key]] = (acc[donor[key]] || 0) + 1;
                        return acc;
                    }, {});
                    return acc;
                }, {});
            };

            // Calculate statistics
            const stats = calculateStats(uniqueDonors, keys);

            const convertToTableArray = (stats, keyName, valueName) => {
                return Object.entries(stats).map(([key, value]) => {
                    return { [keyName]: key, [valueName]: value };
                });
            };
            
            const statsTables = {}
            for (const [key, value] of Object.entries(stats)) {
                statsTables[key] = convertToTableArray(value, key, 'Total');
            }

            //TODO: sort order?

            console.log("Total unique donors:", uniqueDonors.length);
            console.log("   Statistics by keys:", {stats, statsTables});

            this.totalDonors = uniqueDonors.length;
            this.donorInfo = statsTables;
        },
        frequencyDistribution(data, category) {
            const isMulti = Array.isArray(category) && category.length>1;
            const result = data.reduce((acc, record) => {
                //TODO: isMulti only assumes 2 catgories, make dynamic
                const label = !isMulti ? record[category] : `${record[category[0]]}|${record[category[1]]}`;
                if (!acc[label]) acc[label] = 0;
                acc[label]++;
                return acc;
            }, {});

            if(isMulti){
                const combinedCategoryLabel = category.join('|');
                const combinedFieldLabels = Object.keys(result);
                if(!this.fieldColors[combinedCategoryLabel]){
                    const combinedColors = this.calcCombinedFieldColors(combinedCategoryLabel, combinedFieldLabels);
                    Vue.set(this.fieldColors, combinedCategoryLabel, combinedColors[combinedCategoryLabel]);
                }
                if(!this.categoryCombos[combinedCategoryLabel]){
                    Vue.set(this.categoryCombos, combinedCategoryLabel, combinedFieldLabels);
                }
            }

            return result;
        },
        frequencyTable(data, categories){
            const rows = [];
            let grandTotal = 0;
            const category = categories.join('|');
            for(const [key, value] of Object.entries(data)){
                const row = {[category]: key, 'Total': value};
                grandTotal += value;
                rows.push(row);
            }
            let keys = Object.keys(rows[0]);
            const header = keys.map(key => (
                { key, label: key, sortable: true}
            ));
            const footer = {[category]: 'Total'};
            footer['Total'] = grandTotal;
            return {rows, header, footer};
        },
        crossTabulation(data, categoryA, categoryB) {
            const isMultiA = Array.isArray(categoryA) && categoryA.length>1;
            const isMultiB = Array.isArray(categoryB) && categoryB.length>1;
            return data.reduce((acc, record) => {
                //TODO: only assumes 2 catgories at most, make dynamic
                const label1 = !isMultiA ? record[categoryA] : `${record[categoryA[0]]}|${record[categoryA[1]]}`;
                const label2 = !isMultiB ? record[categoryB] : `${record[categoryB[0]]}|${record[categoryB[1]]}`;
            
                if (!acc[label1]) {
                    acc[label1] = {};
                }
                if (!acc[label1][label2]) {
                    acc[label1][label2] = 0;
                }
                acc[label1][label2]++;
            
                return acc;
            }, {});
        },
        frequencyCrossTable(data){
            const rows = [];
            const totals = {};
            let grandTotal = 0;

            // all possible column keys
            const allColumnKeys = new Set();
            for (const value of Object.values(data)) {
                for (const keyB of Object.keys(value)) {
                    allColumnKeys.add(keyB);
                }
            }

            //sort column keys
            const allColumnKeysSorted = Array.from(allColumnKeys).sort((a, b) => a.localeCompare(b));
            //const allColumnKeysSorted2 = this.localSort(allColumnKeys, 0, false);
            console.log('frequencyCrossTable');
            console.log('   columnKeys', allColumnKeys, Array.from(allColumnKeys), allColumnKeysSorted);

            // calculate the rows and keep track of column totals
            for(const [key, value] of Object.entries(data)){
                const row = {[this.categoriesLeft.join('|')]: key, 'Total': 0};

                for (const keyB of allColumnKeysSorted) {
                    if (value.hasOwnProperty(keyB)) {
                        row[keyB] = value[keyB];
                        row['Total'] += value[keyB];
                        if (!totals[keyB]) totals[keyB] = 0;
                        totals[keyB] += value[keyB];
                    } else {
                        row[keyB] = 0;
                    }
                }

                grandTotal += row['Total'];
                rows.push(row);
            }

            // Add footer row for totals
            const footerRow = {[this.categoriesLeft]: 'Total'};
            for (const [key, value] of Object.entries(totals)) {
                footerRow[key] = value;
            }
            footerRow['Total'] = grandTotal;

            const firstRow = rows[0];
            let keys = Object.keys(firstRow);
            keys = keys.filter(key => key !== 'Total');
            keys.push('Total');

            const headers = keys.map(key => (
                { key, label: key, sortable: true}
            ));

            //console.log('allColumnKeysSorted', allColumnKeysSorted, allColumnKeysSorted.length);

            //TODO: all additional headers should be added to a headers array of headers
            //that way we dont need to keep track of the layers
            const headers2 = [{label: '', colspan: 1}]
            headers2.push({label: this.categoriesRight.join('|'), colspan:allColumnKeys.size})
            //need an array of the B fields
            /*rightFields?.forEach(leftCategory => {
                headers2.push({label: `${leftCategory}`, colspan:categoryBCcolspan});
            });*/

            this.rows = rows;
            this.sortedRows = this.localSort(rows, this.categoriesLeft.join('|'), false);
            this.footer = footerRow;
            this.headers = headers;
            this.headers2 = headers2;
            console.log('   new head', headers);
            console.log('   new rows', this.sortedRows);
            console.log('   new foot', this.footer);


            //chi sqaured

            console.log('   chi2')
            const rowKeys = this.sortedRows.map(row => row[this.categoriesLeft.join('|')]);
            const columnKeys = [];
            const groups = [];

            allColumnKeysSorted.forEach(columnKey => {
                columnKeys.push(columnKey);
                const group = [];
                this.sortedRows.forEach(row => {
                    const value = row[columnKey] || 0;
                    group.push(value);
                });
                groups.push(group);
            });

            console.log('      groups', { columnKeys, rowKeys, groups });

            function calculateChiSquare(observed) {
                const total = observed.reduce((acc, val) => acc + val, 0);
                const expected = observed.map(() => total / observed.length);
                const chiSquare = observed.reduce((sum, obs, idx) => {
                    const exp = expected[idx];
                    return exp > 0 ? sum + Math.pow(obs - exp, 2) / exp : sum;
                }, 0);
                return chiSquare;
            }

            function getPValue(chiSquare, dof) {
                return 1 - jStat.chisquare.cdf(chiSquare, dof);
            }

            const pValues = rowKeys.map((rowKey, i) => {
                const observed = columnKeys.map((_, k) => groups[k][i]);
                const chiSquare = calculateChiSquare(observed);
                const pValue = getPValue(chiSquare, observed.length - 1);
                return { rowKey, pValue };
            });

            console.log('      pValues', pValues);

            const alpha = 0.01;
            const bonferroniCorrectedAlpha = alpha / pValues.length;

            const correctedPValues = pValues.map(({ rowKey, pValue }) => {
                const correctedPValue = pValue * pValues.length;
                return {
                    rowKey,
                    pValue: Math.min(correctedPValue, 1),
                    isSignificant: correctedPValue <= bonferroniCorrectedAlpha
                };
            });

            console.log('      pValues after Bonferroni correction', correctedPValues);

            function fdrCorrection(pValues, alpha = 0.01) {
                const sortedPValues = [...pValues].sort((a, b) => a.pValue - b.pValue);
                const n = pValues.length;
                let threshold = alpha;
            
                sortedPValues.forEach((item, index) => {
                    const rank = index + 1;
                    const fdrThreshold = (rank / n) * alpha;
                    item.isSignificant = item.pValue <= fdrThreshold;
                    threshold = fdrThreshold;
                });
            
                return sortedPValues.map((item, index) => ({
                    ...item,
                    fdrThreshold: (index + 1) / n * alpha,
                    isSignificant: item.pValue <= threshold
                }));
            }
            
            const correctedPValuesFDR = fdrCorrection(pValues);
            
            console.log('      pValues after FDR correction', correctedPValuesFDR);
            

            /*

            const observed = {};
            const columnTotals = []
            console.log('this.sortedRowsB', this.sortedRowsB);
            this.sortedRows.forEach((row, i) => {
                const rowLabel = row[this.categoriesLeft.join('|')];
                if(!observed[rowLabel]) observed[rowLabel] = [];
                allColumnKeysSorted.forEach((columnKey, k) => {
                    const value = !row[columnKey] ? 0 : row[columnKey];
                    //console.log(k, columnKey, this.sortedRowsB[k]['Total'])
                    columnTotals[k] = this.sortedRowsB[k]['Total'];
                    observed[rowLabel].push(value)
                })
            })

            console.log('observed', observed, columnTotals);

            for (const [key, value] of Object.entries(observed)) {
                console.log(key, value);
            
                // Prepare the data for chi2test
                // stdlib-js expects a flat array of observed frequencies
                const flatObserved = [value, columnTotals];

                console.log('flatObserved', flatObserved)
            
                
                // Calculate expected frequencies
                const rowTotals = flatObserved.reduce((a, b) => a + b, 0);//value.map(row => row[0] + row[1]);
                const colTotals = columnTotals.reduce((a, b) => a + b, 0);
                console.log('totals', {rowTotals, colTotals});
                const total = rowTotals + colTotals;
                console.log('Total', total);
                const expected = [];
                for (let i = 0; i < value.length; i++) {
                    for (let j = 0; j < 2; j++) {
                        expected.push((rowTotals[i] * colTotals[j]) / total);
                    }
                }
                
            
                // Perform chi-square test
                const result = chi2test(flatObserved);
            
                console.log(`Chi-square statistic: ${result.statistic}`);
                console.log(`p-value: ${result.pValue}`);
                console.log(`degrees of freedom: ${result.df}`);
            }

            //return;

            */

            /*

            const observed = {};

            console.log('this.sortedRowsB', this.sortedRowsB);
            this.sortedRows.forEach((row, i) => {
                const rowLabel = row[this.categoriesLeft.join('|')];
                if(!observed[rowLabel]) observed[rowLabel] = [];
                allColumnKeysSorted.forEach((columnKey, k) => {
                    const value = !row[columnKey] ? 0 : row[columnKey];
                    //console.log(k, columnKey, this.sortedRowsB[k]['Total'])
                    observed[rowLabel].push([value, this.sortedRowsB[k]['Total']])
                })
            })

            function calculateChiSquare(observed) {
                let total = observed.reduce((sum, row) => sum + row[0] + row[1], 0);
                let rowTotals = observed.map(row => row[0] + row[1]);
                let colTotals = [
                    observed.reduce((sum, row) => sum + row[0], 0),
                    observed.reduce((sum, row) => sum + row[1], 0)
                ];
                
                let chiSquare = 0;
                observed.forEach((row, i) => {
                    [0, 1].forEach(j => {
                        let expected = (rowTotals[i] * colTotals[j]) / total;
                        chiSquare += Math.pow(row[j] - expected, 2) / expected;
                    });
                });
                
                return chiSquare;
            }

            for (const [key, value] of Object.entries(observed)) {
                //console.log(key, value);
                // Calculate chi-square statistic
                const chiSquare = calculateChiSquare(value);
                //console.log('Chi-square result:', JSON.stringify(chiSquare, null, 2));
                // Calculate p-value
                // Degrees of freedom = (rows-1) * (columns-1) = (2-1) * (value.length-1)
                const dof = 1 * (value.length - 1);
                const pValue = 1 - jStat.chisquare.pdf(chiSquare, dof);
            
                //if(pValue < 0.05){
                    console.log(key);
                    console.log(`    Chi-square: ${chiSquare}, df: ${dof}, p-value: ${pValue}`);
                //}
                
            }
            */

            //return;

            /*
            //anova test for cell distribution variance
            const columnKeys = [];
            const groups = [];

            console.log('this.sortedRowsB', this.sortedRowsB);

            const refGroup = [];

            this.sortedRowsB.forEach(row => {
                //columnKeys.push(row[this.categoriesLeft.join('|')])
                //const group = [];
                //allColumnKeysSorted.forEach(columnKey => {
                    const value = !row['Total'] ? 0 : row['Total'];
                    refGroup.push(value);
                //})
                //refGroup.push(group);
            })

            console.log('refGroup', refGroup);
            
            allColumnKeysSorted.forEach((columnKey, i) => {
                columnKeys.push(columnKey)
                const group = [];
                this.sortedRows.forEach((row, k) => {
                    const value = !row[columnKey] ? 0 : row[columnKey];
                    group.push(value);
                })
                groups.push(group);
            })
            
            
            this.sortedRows.forEach(row => {
                columnKeys.push(row[this.categoriesLeft.join('|')])
                const group = [];
                allColumnKeysSorted.forEach(columnKey => {
                    const value = !row[columnKey] ? 0 : row[columnKey];
                    group.push(value);
                })
                groups.push(group);
            })
            

            console.log('columnKeys', columnKeys);
            console.log('groups', groups);
            
            // Perform one-way ANOVA
            const fStatistic = jStat.anovafscore(...groups);
            console.log(`F-statistic: ${fStatistic}`);

            // Degrees of freedom
            const dfb = groups.length-1;  // number of groups - 1
            const dfw = groups.reduce((sum, array) => sum + array.length, 0) - groups.length; // total number of data points - number of groups

            const pValue = jStat.ftest(fStatistic, dfb, dfw);
            console.log(`p-value: ${pValue}`);

            this.combinedBarsFstat = fStatistic;
            this.combinedBarspVal = pValue;

            //columnKeys.unshift('ref');
            //groups.unshift(refGroup);

            if (pValue < 1) {
                const tukeyResults = jStat.tukeyhsd(groups);

                console.log('tukeyResults results:', tukeyResults);

                const pairwiseResults = tukeyResults.map(result => {
                    if(result[1] < 0.05){
                        console.log('!!', result[0][0], columnKeys[result[0][0]], result[1]);
                        console.log('  !!', result[0][1], columnKeys[result[0][1]], result[1]);
                    }
                    return {
                        idx1: result[0][0],
                        idx2: result[0][1],
                        group1: columnKeys[result[0][0]],
                        group2: columnKeys[result[0][1]],
                        pValue: result[1]
                    }
                });

                console.log('Pairwise comparison results:', pairwiseResults);
            } else {
                console.log('ANOVA is not significant, no post-hoc tests performed.');
            }
            */
            

            return;
            
            

            /*

            // ChiSquared
            function chiSquaredTest(group1, group2) {
                const observed = [group1, group2];
                const total1 = jStat.sum(group1);
                const total2 = jStat.sum(group2);
                const grandTotal = total1 + total2;

                const expected = [
                    group1.map((_, i) => (group1[i] + group2[i]) * (total1 / grandTotal)),
                    group2.map((_, i) => (group1[i] + group2[i]) * (total2 / grandTotal))
                ];

                let chiSquared = 0;
                for (let i = 0; i < observed[0].length; i++) {
                    chiSquared += Math.pow(observed[0][i] - expected[0][i], 2) / expected[0][i];
                    chiSquared += Math.pow(observed[1][i] - expected[1][i], 2) / expected[1][i];
                }

                const df = observed[0].length - 1;
                const pValue = 1 - jStat.chisquare.cdf(chiSquared, df);

                return pValue;
            }
            
            // Perform pairwise Chi-squared tests
            const pairwiseResults = [];
            for (let i = 0; i < groups.length; i++) {
                for (let j = i + 1; j < groups.length; j++) {
                    const pValue = chiSquaredTest(groups[i], groups[j]);
                    pairwiseResults.push({
                        group1: allColumnKeysSorted[i],
                        group2: allColumnKeysSorted[j],
                        pValue: pValue
                    });
                }
            }
            
            console.log('Pairwise Chi-squared test results:', pairwiseResults);

            */
            
        },

        
        calcCombinedFieldColors(comboCategory, fields){
            const colors = {};
            colors[comboCategory] = {};
            for(var i=0; i<fields.length; i++){
                colors[comboCategory][fields[i]] = this.colorScaleIndex(this.colorIndex)
                this.colorIndex++;
            }
            console.log('combinedFieldColors', colors);
            return colors;
        },
       

        //helpers
        categoryString(category){
            return category.join('|');
        },
        categoryKeys2(category){
            return this.rawData["metadata_labels"][category];
        },
        categoryKeys(category, side) {
            if(!this.rawData || category.length<1) return [];
            const isMulti = Array.isArray(category) && category.length>1;
            console.log('categoryKeys', {category, side, isMulti, combos:this.categoryCombos, keys: this.rawData["metadata_labels"][category]})
            if(isMulti){
                return this.categoryCombos[category.join('|')];
            }else{
                if(side==='right') return this.sortedRowsB.map(item => item[category]);
                return this.sortedRowsA.map(item => item[category]);
            }
        },
        categoryColors(side){
            const category = side === 'left' ? this.categoriesLeft.join('|') : this.categoriesRight.join('|')
            if(!category) return [];
            //return this.fieldColors ? Object.values(this.fieldColors[category]) : [];
            //console.log('categoryColors', category, side, this.aRows.length);
            if(side === 'right') return this.sortedRowsB.map(item => this.fieldColors[category][item[category]]);
            return this.sortedRowsA.map(item => this.fieldColors[category][item[category]]);
        },
        categoryColorsByCategory(category){
            //TODO sort order?
            return Object.values(this.fieldColors[category]);
        },

        //gene expression
        parseGeneExpression(){
            //const categories = side==='left'?this.categoriesLeft:this.categoriesRight;

            console.log('parseGeneExpression');

            // Get expressinon values for user selected categories
            const expressionByCategory = (category) => {
                const categoryLabels = this.rawData['metadata_labels'][category].slice().sort((a, b) => a.localeCompare(b));
                const categoryData = this.rawData['metadata'][category];
                const geneExpression = {};
                const sumstat = {};

                //geneNames * 160000 + geneNames * labels
                this.geneNames.forEach(gene => {

                    if(!geneExpression[gene])  geneExpression[gene] = {}

                    categoryData.forEach((labelIdx, cellIdx) => {
                        const label = categoryLabels[labelIdx];
                        if (!geneExpression[gene][label]) {
                            geneExpression[gene][label] = [];
                        }
                        geneExpression[gene][label].push(this.expressionData[gene][cellIdx]);
                    });
                    geneExpression[gene] = this.sortObjectKeysLocale(geneExpression[gene]);

                    categoryLabels.forEach(label => {
                        const sortedValues = geneExpression[gene][label] ? geneExpression[gene][label].sort(d3.descending) : [0];
                        const key = label;
                        const mean = d3.mean(sortedValues)
                        const q1 = d3.quantile(sortedValues, .25)
                        const median = d3.quantile(sortedValues, .5)
                        const q3 = d3.quantile(sortedValues, .75)
                        const interQuantileRange = q3 - q1
                        const min = sortedValues[0]
                        const max = sortedValues[sortedValues.length-1]
                        const pctExpr = (sortedValues.filter(val => val > 0).length / sortedValues.length) * 100;//sortedValues.length / 166149;
                        if(!sumstat[gene]) sumstat[gene] = [];
                        sumstat[gene].push({ key, mean, q1, median, q3, interQuantileRange, min, max, pctExpr });
                    
                    })
                })

                return {sumstat};
            }

            //set individual category expression data
            if(this.categoriesLeft.length===1){
                this.geneExpressionA = expressionByCategory(this.categoriesLeft);
                //const sumStatsA = sumstatsByCategory(this.categoriesLeft);
                //console.log('sumStatsA', sumStatsA)
            }else{
                this.geneExpressionA = null;
            }
            if(this.categoriesRight.length===1){
                this.geneExpressionB = expressionByCategory(this.categoriesRight);
                //const sumStatsB = sumstatsByCategory(this.categoriesRight);
                //console.log('sumStatsA', sumStatsB)
            }else{
                this.geneExpressionB = null;
            }

            console.log('   A, B', this.geneExpressionA, this.geneExpressionB);

            if(this.activeGene===''){
                this.activeGene = this.geneNames[0];
            }
            
        },
        expressionByCategory (category, gene=null) {
            //called from template
            const categoryLabels = this.rawData['metadata_labels'][category].slice().sort((a, b) => a.localeCompare(b));
            const categoryData = this.rawData['metadata'][category];
            const geneExpression = {};
            const sumstat = {};

            const geneNames = gene ? [gene] : this.geneNames;

            //geneNames * 160000 + geneNames * labels
            geneNames.forEach(gene => {
                if(!geneExpression[gene])  geneExpression[gene] = {}

                categoryData.forEach((labelIdx, cellIdx) => {
                    const label = categoryLabels[labelIdx];
                    if (!geneExpression[gene][label]) {
                        geneExpression[gene][label] = [];
                    }
                    geneExpression[gene][label].push(this.expressionData[gene][cellIdx]);
                });
                geneExpression[gene] = this.sortObjectKeysLocale(geneExpression[gene]);

                categoryLabels.forEach(label => {
                    const sortedValues = geneExpression[gene][label] ? geneExpression[gene][label].sort(d3.descending) : [0];
                    const key = label;
                    const mean = d3.mean(sortedValues)
                    const q1 = d3.quantile(sortedValues, .25)
                    const median = d3.quantile(sortedValues, .5)
                    const q3 = d3.quantile(sortedValues, .75)
                    const interQuantileRange = q3 - q1
                    const min = sortedValues[0]
                    const max = sortedValues[sortedValues.length-1]
                    const pctExpr = (sortedValues.filter(val => val > 0).length / sortedValues.length) * 100;//sortedValues.length / 166149;
                    if(!sumstat[gene]) sumstat[gene] = [];
                    sumstat[gene].push({ key, mean, q1, median, q3, interQuantileRange, min, max, pctExpr });
                
                })
            })

            console.log('expressionByCategory', category, gene, sumstat)

            return sumstat;
        },
        getCombinedGeneExpression(gene){
            //if only one category was selected, stop here.
            if(this.categoriesLeft===0 || this.categoriesRight.length===0) return;

            //if both categories selected, parse combined gene expression

            //combined categories
            const expressionCombined = (gene) => {
                const categoryLabelsA = this.rawData['metadata_labels'][this.categoriesLeft];
                const categoryDataA = this.rawData['metadata'][this.categoriesLeft];

                const categoryLabelsB = this.rawData['metadata_labels'][this.categoriesRight];
                const categoryDataB = this.rawData['metadata'][this.categoriesRight];

                const geneExpression = {};
                const sumstat = {};

                for(var i=0; i<this.expressionData[gene].length; i++){
                    const labelA = categoryLabelsA[categoryDataA[i]];
                    const labelB = categoryLabelsB[categoryDataB[i]];
                    if(!geneExpression[labelA]) geneExpression[labelA] = {}
                    if(!geneExpression[labelA][labelB]) geneExpression[labelA][labelB] = [];
                    geneExpression[labelA][labelB].push(this.expressionData[gene][i])
                }

                const sortedSubLabels = {};
                for (const labelA in geneExpression) {
                    if(!sumstat[labelA]) sumstat[labelA] = []
                    for(const labelB in geneExpression[labelA]){
                        const values = geneExpression[labelA][labelB];
                        const sortedValues = values ? values.sort(d3.descending) : [0];
                        const key = labelB;
                        const mean = d3.mean(sortedValues)
                        const q1 = d3.quantile(sortedValues, .25)
                        const median = d3.quantile(sortedValues, .5)
                        const q3 = d3.quantile(sortedValues, .75)
                        const interQuantileRange = q3 - q1
                        const min = sortedValues[0]
                        const max = sortedValues[sortedValues.length-1]
                        const pctExpr = (sortedValues.filter(val => val > 0).length / sortedValues.length) * 100;//sortedValues.length / 166149;
                        sumstat[labelA].push({ key, mean, q1, median, q3, interQuantileRange, min, max, pctExpr });
                    }
                    sortedSubLabels[labelA] = this.sortObjectKeysLocale(sumstat[labelA]);
                }

                //const sortedSubLabels = {};
                //for (const labelA in geneExpression) {
                //    sortedSubLabels[labelA] = this.sortObjectKeysLocale(geneExpression[labelA]);
                    //console.log('---', labelA, sortedSubLabels[labelA]);
                //}

                const sortedExpression = this.sortObjectKeysLocale(sortedSubLabels);

                console.log('geneExpression', geneExpression);
                console.log('sumstat', sumstat);
                console.log('sortedExpression', sortedExpression);

                return {geneExpression, sumstat};
            }

            //loop through each gene and calc combined expressino data
            const combinedExpression = expressionCombined(gene);
            /*
            this.geneNames.forEach(gene => {
                const combinedGeneExpression = expressionCombined(gene);
                combinedExpression.sumstat[gene] = combinedGeneExpression;
            })
            */
            //this.combinedExpression = combinedExpression;
            console.log('   AB', combinedExpression);

            const results = dynamicTTest(combinedExpression.geneExpression);
            console.log(`   AB ${gene} pValues and effect sizes`, results);

            return combinedExpression.sumstat;


            //gene expression ttest

            // Function to calculate mean
            function mean(arr) {
                return arr.reduce((acc, val) => acc + val, 0) / arr.length;
            }

            // Function to calculate standard deviation
            function std(arr) {
                const mu = mean(arr);
                return Math.sqrt(arr.reduce((acc, val) => acc + Math.pow(val - mu, 2), 0) / (arr.length - 1));
            }

            // Function to calculate Cohen's d
            function cohenD(groupA, groupB) {
                const meanA = mean(groupA);
                const meanB = mean(groupB);
                const stdA = std(groupA);
                const stdB = std(groupB);
                const pooledStd = Math.sqrt(((groupA.length - 1) * Math.pow(stdA, 2) + (groupB.length - 1) * Math.pow(stdB, 2)) / (groupA.length + groupB.length - 2));
                return (meanA - meanB) / pooledStd;
            }

            // Function to perform t-test and calculate Cohen's d
            function dynamicTTest(data) {
                //console.log('***', data)//Object.values(data), Object.values(data)[0], Object.keys(Object.values(data)[0])
                const columnKeys = Object.keys(Object.values(data)[0]);
                const results = {};

                Object.keys(data).forEach(rowKey => {
                    const groupData = columnKeys.map(group => data[rowKey][group]);
                    results[rowKey] = {};

                    for (let i = 0; i < columnKeys.length; i++) {
                        for (let j = i + 1; j < columnKeys.length; j++) {
                            const groupA = groupData[i] || [0];
                            const groupB = groupData[j] || [0];
                            //console.log('+++++', columnKeys[i], 'v', columnKeys[j], groupA, groupB);
                            const pValue = ttest2(groupA, groupB).pValue;
                            const effectSize = cohenD(groupA, groupB);
                            results[rowKey][`${columnKeys[i]} vs ${columnKeys[j]}`] = { pValue, effectSize };
                        }
                    }
                });
                return results;
            }

            this.geneNames.forEach(gene => {
                const results = dynamicTTest(this.combinedExpression[gene]);
                console.log(`   AB ${gene} pValues and effect sizes`, results);
            });
        },
        getUmapExpressionColors(gene){
            const expressionColors = [];
            const geneData = this.expressionData[gene];
            //console.log('---', this.expressionData, this.geneNames, this.expressionData[gene])
            const color = d3.scaleSequential(d3.interpolatePlasma)
            .domain([d3.max(geneData), 0]);
                
            for(var i=0; i<geneData.length; i++){
                expressionColors[i] = color(geneData[i]);
            }
            return expressionColors;
        },

        //utils
        injectScript(scriptPath){
            // Dynamically create a <script> tag to load library from CDN
            const script = document.createElement('script');
            script.src = scriptPath;
            script.onload = () => {
                console.log('Library loaded', scriptPath);
            };
            script.onerror = () => {
                console.error('Error loading library', scriptPath);
            };
            document.head.appendChild(script);
        },
        tsvToJson (tsvString) {
            const lines = tsvString.split('\n');
            const headers = lines.shift().split('\t');
            const jsonArray = [];
            const ifNumber = (str) => {
                return !isNaN(str) && str.trim() !== '' ? Number(str) : str;
            }
            lines.forEach(line => {
                const values = line.split('\t');
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = ifNumber(values[index]);
                });
                jsonArray.push(obj);
            });
            return jsonArray;
        },

        //category sidebar ui
        toggleCategory(e){
            const categories = e.target.dataset.side==='left'?this.categoriesLeft:this.categoriesRight;
            const clickedCategory = e.target.dataset.category;
            if(categories.includes(clickedCategory)){
                categories.splice(categories.indexOf(clickedCategory), 1);
            }else{
                if(categories.length===1){
                    console.warn('reached category combo limit');
                    return;
                }
                categories.push(clickedCategory);
                //this.parseGeneExpression(e.target.dataset.side);
            }
            this.calculateTable({left:this.categoriesLeft, right:this.categoriesRight});
        },
        swapSides(){
            const categoriesLeftTmp = this.categoriesLeft;
            this.categoriesLeft = this.categoriesRight;
            this.categoriesRight = categoriesLeftTmp;
            this.calculateTable({left:this.categoriesLeft, right:this.categoriesRight});
        },

        //sort utils
        localSort(rows, sortBy, sortDesc){
            //console.log("localSort", rows);
            const compareType = typeof rows[0][sortBy];
            return rows.slice().sort((a, b) => {
                let result = 0;
                if(compareType === 'string'){
                    const valueA = a[sortBy].toString().toLowerCase();
                    const valueB = b[sortBy].toString().toLowerCase();
                    return sortDesc ? valueB.localeCompare(valueA) : valueA.localeCompare(valueB);
                }
                if (a[sortBy] < b[sortBy]) result = -1;
                if (a[sortBy] > b[sortBy]) result = 1;
                return sortDesc ? -result : result;
            });
        },
        sortObjectKeysLocale(obj){
            const sortedObj = {};
            const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
            keys.forEach(key => {
              sortedObj[key] = obj[key];
            });
            return sortedObj;
        },
        sortArray(arr){
            return arr.sort((a, b) => a.localeCompare(b));
        },
        areArraysEqual(arr1, arr2){
            if (arr1.length !== arr2.length) return false;
            const sortedArr1 = arr1.slice().sort();
            const sortedArr2 = arr2.slice().sort();
            for (let i = 0; i < sortedArr1.length; i++) {
                if (sortedArr1[i] !== sortedArr2[i]) return false;
            }
            return true;
        },

        //table drawer ui
        toggleTableDrawer(e=null){
            const el = !e ? document.querySelector('.table-drawer') : e.target.parentNode;
            const tableWidth = Math.floor(el.getBoundingClientRect().width)-20;
            if(el.dataset.state==='closed'){
                el.style.left = `calc(100% - ${tableWidth}px)`;
                el.dataset.state = 'open';
            }else{
                el.style.left = `calc(100% - 80px)`;
                el.dataset.state = 'closed';
            }
        },
        updateTableDrawer(){
            const els = document.querySelectorAll('.table-drawer');
            if(!els || els.length<1) return;
            els.forEach(el => {
                const tableWidth = Math.floor(el.getBoundingClientRect().width)-20;
                if(el.dataset.state==='open') el.style.left = `calc(100vw - ${tableWidth}px)`;
            });
            
        },

        //gene search ui
        searchGene(e){
            const parts = e.target.value.split(/[,\s]+/);
            e.target.value = '';
            //TODO: should be a queue
            parts.forEach(async (gene) => {
                await this.fetchGeneExpression(gene.toUpperCase());
            })
        },
        removeGene(gene){
            //const geneToRemove = e.target.dataset.gene;
            console.log("removing gene", gene);
            const genes = [...this.geneNames];
            const geneIndex = genes.indexOf(gene);
            genes.splice(geneIndex, 1);

            const index = this.expressionStats.findIndex(obj => obj.hasOwnProperty(gene));
            if (index !== -1) this.expressionStats.splice(index, 1);

            if(this.activeGene===gene) {
                this.geneNames = genes;
                this.activeGene = genes.length>0 ? genes[genes.length-1]: '';
                //console.log('switching active gene to', this.activeGene);
            }
        },
        setActiveGene(gene){
            this.activeGene = gene;
        },

        //contigency bar chart ui
        toggleStack() {
            this.doStack = !this.doStack;
            console.log('toggleStack', this.doStack)
        },
        toggleNormalize() {
            this.doNormalize = !this.doNormalize;
            console.log('toggleNormalize', this.doNormalize)
        },

        //event handlers
        handleScroll(){
            this.fixedSidebar = window.scrollY>this.scrollThreshhold;
        },
        onSortChanged(ctx) {
            const sortBy = ctx.sortBy;
            const sortDesc = ctx.sortDesc;
            this.sortedRows = this.localSort(this.rows, sortBy, sortDesc);
            if(this.aRows.length>0) this.sortedRowsA = this.localSort(this.aRows, sortBy, sortDesc);
            if(this.aRows.length<1 && this.bRows.length>0) this.sortedRowsB = this.localSort(this.bRows, sortBy, sortDesc);
            console.log('sorted', this.sortedRows);
        },

        //
        //
        //
        //
        //unused
        crossTabAnalysis(data){
            let rowTotals = {};
            let columnTotals = {};
            let grandTotal = 0;
            
            // row totals, column totals, and grand total
            for (let row in data) {
                rowTotals[row] = 0;
                for (let col in data[row]) {
                    rowTotals[row] += data[row][col];
                    columnTotals[col] = (columnTotals[col] || 0) + data[row][col];
                    grandTotal += data[row][col];
                }
            }

            // degrees of freedom
            //let numRows = Object.keys(data).length;
            //let numCols = Object.keys(columnTotals).length;
            //const degreesOfFreedom = (numRows - 1) * (numCols - 1);

            // expected frequencies, chi-squared statistic, and contributions
            const expected = {};
            const contributions = {};
            let observedArray = [];

            for (let row in data) {
                expected[row] = {};
                contributions[row] = {};
                let rowArray = [];
                for (let col in data[row]) {
                    let observedValue = data[row][col];
                    let expectedValue = (rowTotals[row] * columnTotals[col]) / grandTotal;
                    expected[row][col] = expectedValue;
                    
                    let contribution = Math.pow(observedValue - expectedValue, 2) / expectedValue;
                    contributions[row][col] = contribution;

                    rowArray.push(observedValue);
                }
                observedArray.push(rowArray);
            }
            
            console.log('observedArray', observedArray);
            //return;
            let testResult = chi2test(observedArray, {'correct': false});
            this.chiSquared = testResult.statistic;
            this.pValue = testResult.pValue;
            console.warn('crossTabAnalysis', testResult, testResult.toString({'decision': true}));
        },
        createHeatmapData() {
            const statistics = this.calculateStatistics();
            const tableData = [];
        
            for (const label in statistics) {
                const row = { label };
                this.geneNames.forEach(gene => {
                    row[`${gene}_mean`] = statistics[label][gene].mean;
                    row[`${gene}_percent`] = statistics[label][gene].pctExpressed;
                });
                tableData.push(row);
            }

            const fields = [
                { key: 'label', label: 'Label' },
                ...this.geneNames.map(gene => ({ key: `${gene}_mean`, label: `${gene} Mean Expression` })),
                ...this.geneNames.map(gene => ({ key: `${gene}_percent`, label: `${gene} % Expressed` }))
            ]

            this.expressionRows = tableData;
            this.expressionHeaders = fields;

            console.log('createHeatmapData', this.expressionRows, this.expressionHeaders);
        
            //return tableData;
        },
        calculateStatistics() {
            const categoryData = this.rawData['metadata'][this.categoriesLeft];
            const categoryLabels = this.rawData['metadata_labels'][this.categoriesLeft];
            const gene = this.activeGene;
        
            const geneExpressionByLabel = {};
        
            // Organize data points by category
            categoryData.forEach((labelIdx, cellIdx) => {
                const label = categoryLabels[labelIdx];
                if (!geneExpressionByLabel[label]) {
                    geneExpressionByLabel[label] = {};
                    //this.geneNames.forEach(gene => {
                        geneExpressionByLabel[label][gene] = [];
                    //});
                }
                //this.geneNames.forEach(gene => {
                    geneExpressionByLabel[label][gene].push(this.expressionData[gene][cellIdx]);
                //});
            });

            console.log('geneExpressionByLabel', geneExpressionByLabel);
        
            const statistics = {};
        
            for (const label in geneExpressionByLabel) {
                statistics[label] = {};
                this.geneNames.forEach(gene => {
                    const dataPoints = geneExpressionByLabel[label][gene];
                    dataPoints.sort((a, b) => a - b);
            
                    const n = dataPoints.length;
                    const mean = dataPoints.reduce((sum, val) => sum + val, 0) / n;
                    const median = (dataPoints[Math.floor((n - 1) / 2)] + dataPoints[Math.ceil((n - 1) / 2)]) / 2;
                    const min = dataPoints[0];
                    const max = dataPoints[n - 1];
                    const range = max - min;
                    const q1 = dataPoints[Math.floor((n - 1) / 4)];
                    const q3 = dataPoints[Math.floor((3 * (n - 1)) / 4)];
                    const iqr = q3 - q1;
                    const variance = dataPoints.reduce((sum, val) => sum + (val - mean) ** 2, 0) / n;
                    const stdDev = Math.sqrt(variance);
                    const pctExpressed = (dataPoints.filter(val => val > 0).length / n) * 100;

                    const kde = this.kernelDensityEstimator(this.kernelEpanechnikov(7), d3.range(min, max, (max-min) / 100));
                    const density = kde(dataPoints);
            
                    statistics[label][gene] = {
                        data:dataPoints,
                        mean,
                        median,
                        min,
                        max,
                        range,
                        q1,
                        q3,
                        iqr,
                        variance,
                        stdDev,
                        pctExpressed,
                        density
                    };
                });
            }
        
            this.statistics = statistics;
            console.log('statistics', statistics);
            return statistics;
        },
        kernelDensityEstimator(kernel, x){
            return function(sample){
                return x.map(function(xi) {
                    return [xi, d3.mean(sample, function(v){
                        return kernel(xi-v);
                    })]
                })
            }
        },
        kernelEpanechnikov(k){
            return function(v){
                return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
            }
        },
    }
}).$mount("#app");

//
//TODO:
//

/*
methods:
    A, B      : chi**2(A,B)

visualizations:
    chi**2(A,B): heatmap (cell color by "contributions")
    points: UMAP (color by A), UMAP (color by B)
*/

//
//current data struct
//

/*
//step1 pull raw data from api
NAMES is the main index.
"metadata" categories are parallel arrays to NAMES and values are indeces of "metadat_labels" categories.

rawData = {
    NAMES: [cell_id, cell_id, ...],                 //len: all cells, type: string
    metadata: {
        category: [label_idx, label_idx, ...],      //len: all cells, type: int
        category: [label_idx, label_idx, ...],      //len: all cells, type: int
        ...
    },
    metadata_labels: {
        category: [label, label, ...],              //len: all labels in category, type: string
        category: [label, label, ...],              //len: all labels in gategory, type: string
        ...
    }
}

//step2 process raw data based on user selected categories
//processed data is a flattened array of objects, parallells NAMES, contains only user selected categories
processedData = [
    {categoryA: "label_a1", categoryB:"label_b1"},
    {categoryA: "label_a1", categoryB:"label_b1"},
    {categoryA: "label_a2", categoryB:"label_b2"},
    {categoryA: "label_a2", categoryB:"label_b2"},
    ...
]

//using processedData and user selected categories, create a gene expression table
//gene expression data, parallels NAMES
expression = {
    ['gene_name']: [0, 1.3, 0, 2.23, 1.2, .8, 0, ...]    //len: all cells, type: number
}


colors object mirrors metadata_labels

fieldColors = {
    category: {
        label: "#color", 
        label: "#color", 
        ...
    },
    ...
}

*/