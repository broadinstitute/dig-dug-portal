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

  

new Vue({
    //store,
    mounted() {
        //add scroll listener
        window.addEventListener('scroll', this.handleScroll);

        this.injectScript('https://cdn.jsdelivr.net/gh/stdlib-js/stats-ttest2@umd/browser.js');
        this.injectScript('https://cdn.jsdelivr.net/gh/stdlib-js/stats-chi2test@umd/browser.js');
        this.injectScript('https://cdn.jsdelivr.net/npm/jstat@latest/dist/jstat.min.js');
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
        colorScaleIndex: d3.scaleOrdinal(colors),
        colorIndex: 0,

        d: '::',
        datasets: null,
        rawData: null,
        fieldColors: null,
    
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

        headers: [],
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

        doNormalize: false,
        doStack: false,
        combinedBarsFstat: null,
        combinedBarsPval: null,

        //sidebar
        scrollThreshhold: 65,
        fixedSidebar: false,
      };
    },
    async created() {
        //start
        this.init();
    },
    watch:{
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
    },
    methods: {
        async init(){
            this.datasets = await this.fetchDatasets();
            this.activeDataset = keyParams.dataset ? keyParams.dataset : this.datasetsList[0];
            await this.fetchCoordinates();
            this.rawData = await this.fetchFields();
            this.fieldColors = this.calcFieldColors(this.rawData);

            this.calculateTable();

            const rect = document.querySelector('.sidebar-parent').getBoundingClientRect();
            this.scrollThreshhold = rect.top + window.scrollY;
            console.log('scrollThreshhold', rect, window.scrollY, this.scrollThreshhold);
        },
        toggleStack() {
            this.doStack = !this.doStack;
            console.log('toggleStack', this.doStack)
        },
        toggleNormalize() {
            this.doNormalize = !this.doNormalize;
            console.log('toggleNormalize', this.doNormalize)
        },
        handleScroll(){
            this.fixedSidebar = window.scrollY>this.scrollThreshhold;
        },
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
                this.coordinates = json;
                
            }catch (error){
                console.error('Error fetching coordinates:', error);
            }
        },
        async fetchGeneExpression(gene){
            console.log('fetchGeneExpression', gene);
            try{
                const response = await fetch(`${BIO_INDEX_HOST}/api/bio/query/single-cell-lognorm?q=${this.activeDataset},${gene}`);
                const json = await response.json();
                const expression = json.data[0]['expression'];
                this.geneNames.push(gene);
                this.expressionData[gene] = expression;
                console.log('   ', this.expressionData);

                this.parseGeneExpression();
            }catch(error){
                console.error('   Error fetching gene expression', error);
            }
        },
        parseGeneExpression(){
            //const categories = side==='left'?this.categoriesLeft:this.categoriesRight;

            console.log('parseGeneExpression');

            
            const sortObjectKeysLocale = (obj) => {
                const sortedObj = {};
                const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
                keys.forEach(key => {
                  sortedObj[key] = obj[key];
                });
                return sortedObj;
            };

            // Get expressinon values for user selected categories
            const expressionByCategory = (category) => {
                const categoryLabels = this.rawData['metadata_labels'][category];

                const categoryData = this.rawData['metadata'][category];
                const geneExpression = {};

                this.geneNames.forEach(gene => {
                    if(!geneExpression[gene]) geneExpression[gene] = {};
                    categoryData.forEach((labelIdx, cellIdx) => {
                        const label = categoryLabels[labelIdx];
                        if (!geneExpression[gene][label]) {
                            geneExpression[gene][label] = [];
                        }
                        geneExpression[gene][label].push(this.expressionData[gene][cellIdx]);
                    });
                    geneExpression[gene] = sortObjectKeysLocale(geneExpression[gene]);
                })

                return geneExpression;
            }

            //set individual category expression data
            if(this.categoriesLeft.length===1){
                this.geneExpressionA = expressionByCategory(this.categoriesLeft);
            }
            if(this.categoriesRight.length===1){
                this.geneExpressionB = expressionByCategory(this.categoriesRight);
            }

            console.log('   A, B', this.geneExpressionA, this.geneExpressionB);


            //if only one category was selected, stop here.
            if(this.categoriesLeft===0 || this.categoriesRight.length===0) return;


            //if both categories selected, parse combined gene expression

            //combined categories
            const expressionCombined = (gene) => {
                const categoryLabelsA = this.rawData['metadata_labels'][this.categoriesLeft];
                const categoryDataA = this.rawData['metadata'][this.categoriesLeft];

                const categoryLabelsB = this.rawData['metadata_labels'][this.categoriesRight];
                const categoryDataB = this.rawData['metadata'][this.categoriesRight];

                const geneExpression = [];

                for(var i=0; i<this.expressionData[gene].length; i++){
                    const labelA = categoryLabelsA[categoryDataA[i]];
                    const labelB = categoryLabelsB[categoryDataB[i]];
                    if(!geneExpression[labelA]) geneExpression[labelA] = {}
                    if(!geneExpression[labelA][labelB]) geneExpression[labelA][labelB] = [];
                    geneExpression[labelA][labelB].push(this.expressionData[gene][i])
                }

                const sortedGeneExpression = {};
                for (const labelA in geneExpression) {
                    if (geneExpression.hasOwnProperty(labelA)) {
                        sortedGeneExpression[labelA] = sortObjectKeysLocale(geneExpression[labelA]);
                    }
                }

                const sortedExpression = sortObjectKeysLocale(sortedGeneExpression);

                //console.log('sortedExpression', sortedExpression);

                return sortedExpression;
            }

            //loop through each gene and calc combined expressino data
            const combinedExpression = {};
            this.geneNames.forEach(gene => {
                const combinedGeneExpression = expressionCombined(gene);
                combinedExpression[gene] = combinedGeneExpression;
            })
            this.combinedExpression = combinedExpression;
            console.log('   AB', combinedExpression);

            //umap colors for expression data by each gene
            const expressionColors = {};
            this.geneNames.forEach(gene => {
                expressionColors[gene] = [];
                const geneData = this.expressionData[gene];
                //console.log('---', this.expressionData, this.geneNames, this.expressionData[gene])
                const color = d3.scaleSequential(d3.interpolatePlasma)
                    .domain([d3.max(geneData), 0]);
                    
                for(var i=0; i<geneData.length; i++){
                    expressionColors[gene][i] = color(geneData[i]);
                }
            })
            this.coordinateColorsGene = expressionColors;
            console.log('   AB UMAP expressionColors', this.coordinateColorsGene);


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
        calculateTable(){
            //get selected categories
            const categories = {
                left: this.categoriesLeft.filter(item => item !== null),
                right: this.categoriesRight.filter(item => item !== null)
            }

            //clear previous data
            this.headers = [];
            this.headers2 = [];
            this.rows = [];
            this.footer = [];
            this.sortedRows = [];
            this.sortedRowsA = [];
            this.sortedRowsB = [];
            this.aRows = [];
            this.bRows = [];
            
            //calculate new data
            this.processData(this.rawData, categories);

            if(this.geneNames.length>0){
                this.parseGeneExpression();
            }

            this.$nextTick(() => this.updateTableDrawer());
        },
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
        calcCombinedFieldColors(comboCategory, fields){
            const colors = {};
            colors[comboCategory] = {};
            for(var i=0; i<fields.length; i++){
                colors[comboCategory][fields[i]] = this.colorScaleIndex(this.colorIndex)
                this.colorIndex++;
            }
            console.log('calcCombinedFieldColors', colors);
            return colors;
        },
        categoryString(category){
            return category.join('|');
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
        
        areArraysEqual(arr1, arr2){
            if (arr1.length !== arr2.length) return false;
            const sortedArr1 = arr1.slice().sort();
            const sortedArr2 = arr2.slice().sort();
            for (let i = 0; i < sortedArr1.length; i++) {
                if (sortedArr1[i] !== sortedArr2[i]) return false;
            }
            return true;
        },

        processData(rawData, categories) {
            const allUserSelectedCategories = categories.left.concat(categories.right);
            console.log('allUserSelectedCategories', allUserSelectedCategories);

            if(allUserSelectedCategories.length===0) return;

            const processedData = [];
            const { NAME, metadata, metadata_labels } = rawData;
            const hasLeft = categories.left.length>0;
            const hasRight = categories.right.length>0;
            const pointColors = {left:[], right:[]};

            const leftIsNew = !this.areArraysEqual(categories.left, this.lastCategoriesLeft);
            const rightIsNew = !this.areArraysEqual(categories.right, this.lastCategoriesRight);
          
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

            this.lastCategoriesLeft = categories.left;
            this.lastCategoriesRight = categories.right;

            if(categories.left.length > 0){
                console.log('   A- selected')
                const aFreq = this.frequencyDistribution(processedData, categories.left);
                const aTable = this.frequencyTable(aFreq, categories.left);
                this.aRows = aTable.rows;
                this.sortedRowsA = this.localSort(this.aRows, this.categoriesLeft.join('|'), false);
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
                console.log('total', total);
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
            this.calculateTable();
        },
        swapSides(){
            const categoriesLeftTmp = this.categoriesLeft;
            this.categoriesLeft = this.categoriesRight;
            this.categoriesRight = categoriesLeftTmp;
            this.calculateTable();
        },
        onSortChanged(ctx) {
            const sortBy = ctx.sortBy;
            const sortDesc = ctx.sortDesc;
            this.sortedRows = this.localSort(this.rows, sortBy, sortDesc);
            if(this.aRows.length>0) this.sortedRowsA = this.localSort(this.aRows, sortBy, sortDesc);
            if(this.aRows.length<1 && this.bRows.length>0) this.sortedRowsB = this.localSort(this.bRows, sortBy, sortDesc);
            console.log('sorted', this.sortedRows);
        },
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

        searchGene(e){
            const parts = e.target.value.split(/[,\s]+/);
            e.target.value = '';
            //TODO: should be a queue
            parts.forEach(async (gene) => {
                await this.fetchGeneExpression(gene.toUpperCase());
            })
        },
        removeGene(e){
            const geneToRemove = e.target.dataset.gene;
            console.log("removing gene", geneToRemove);
            this.geneNames.splice(this.geneNames.indexOf(geneToRemove), 1);
            //TODO: remove gene from data and visualizations
        }
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