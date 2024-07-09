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

import * as d3 from "d3";
import * as _ from "lodash";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import keyParams from "@/utils/keyParams";

//import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils"; 
const BIO_INDEX_HOST = 'https://bioindex-dev.hugeamp.org';

const colors = ["#007bff","#048845","#8490C8","#BF61A5","#EE3124","#FCD700","#5555FF","#7aaa1c","#F88084","#9F78AC","#F5A4C7","#CEE6C1","#cccc00","#6FC7B6","#D5A768","#d4d4d4"]

  

new Vue({
    //store,
    mounted() {
        this.injectScript('https://cdn.jsdelivr.net/gh/stdlib-js/stats-chi2test@umd/browser.js');
    },
    render(createElement, context) {
        return createElement(Template);
    },
    components: {
        matkpNav,
        matkpFooter,
        StackedBarChart,
        UMAPPlot
    },
    data() {
      return {
        colorScaleIndex: d3.scaleOrdinal(colors),
        colorIndex: 0,

        d: '::',
        datasets: null,
        rawData: null,
        fieldColors: null,
    
        expressionData: [],
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

        categoryCombos: {},
        categoriesLeft: [],
        categoriesRight: [],
        lastCategoriesLeft: [],
        lastCategoriesRight: [],
      };
    },
    async created() {
        this.fetchDatasets();
        this.activeDataset = keyParams.dataset ? keyParams.dataset : this.datasetsList[0];
        this.fetchCoordinates();
        this.fetchFields();
        //this.fetchGeneExpression('PPARG');
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
            return this.categoryKeys(this.categoriesLeft);
        },
        categoryKeysRight() {
            return this.categoryKeys(this.categoriesRight);
        },
        currentDataset() {
            if(!this.datasets || !this.activeDataset) return null;
            return this.datasets.filter(dataset => dataset.datasetId === this.activeDataset)[0];
        },
    },
    methods: {
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
            const fetchPath = '/api/raw/file/single_cell_metadata/dataset_metadata.json.gz';
            const response = await fetch(`${BIO_INDEX_HOST}${fetchPath}`);
            const dataText = await response.text();
            const lines = dataText.split('\n').filter(line => line.trim() !== '');
            const jsonObjects = lines.map(line => JSON.parse(line));
            this.datasets = jsonObjects;//.map(item => item["datasetId"]);
            console.log('datasets', this.datasets);

        },
        async fetchFields() {
            try {
                const response = await fetch(`${BIO_INDEX_HOST}/api/raw/file/single_cell/${this.activeDataset}/fields.json.gz`);
                const rawData = await response.json();

                console.log('rawData', rawData);

                this.rawData = rawData;
                this.fieldColors = this.calcFieldColors(rawData);
                console.log('fieldColors', this.fieldColors);

                //this.categoriesLeft.push(this.rawData["metadata_labels"]["cell_type__custom"] ? "cell_type__custom" : "cluster");
            
                this.calculateTable();
                
            } catch (error) {
                console.error('Error fetching fields:', error);
            }
        },
        async fetchCoordinates() {
            try {
                console.log('getting coordinates for: ', this.activeDataset);
                const response = await fetch(`${BIO_INDEX_HOST}/api/raw/file/single_cell/${this.activeDataset}/coordinates.tsv.gz`)
                const json = this.tsvToJson(await response.text());
                this.coordinates = json;
                console.log('fetchCoordinates', json);
            }catch (error){
                console.error('Error fetching coordinates:', error);
            }
        },
        async fetchGeneExpression(gene){
            try{
                console.log('getting gene expression for: ', gene, this.activeDataset);
                const response = await fetch(`${BIO_INDEX_HOST}/api/bio/query/single-cell-lognorm?q=${this.activeDataset},${gene}`);
                const json = await response.json();
                const expression = json.data[0]['expression'];
                this.expressionData[gene] = expression;
                console.log(gene, 'fetchGeneExpression', json);
            }catch(error){
                console.error('Error fetching gene expression', error);
            }
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
        categoryKeys(category) {
            if(!this.rawData || category.length<1) return [];
            const isMulti = Array.isArray(category) && category.length>1;
            return isMulti ? this.categoryCombos[category.join('|')] : this.rawData["metadata_labels"][category];
            /*
            if(!this.rawData) return [];
            const isMulti = Array.isArray(category) && category.length>1;
            const c = isMulti ? this.categoryCombos[category.join('|')] : this.rawData["metadata_labels"][category];
            sort ? c.sort() : c;
            console.log('categoryKeys', category, sort, c);
            return c;
            */
        },
        categoryColors(side){
            const category = side === 'left' ? this.categoriesLeft.join('|') : this.categoriesRight.join('|')
            if(!category) return [];
            //return this.fieldColors ? Object.values(this.fieldColors[category]) : [];
            console.log('categoryColors', category, side, this.aRows.length);
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

            //generate tables from processed data
            if(categories.left.length > 0 && categories.right.length > 0){
                console.log('AB selected')
                const crossTabData = this.crossTabulation(processedData, categories.left, categories.right);
                console.log('crossTabulation', crossTabData);
                //this.crossTabAnalysis(crossTabData);
                this.frequencyCrossTable(crossTabData);
            }

            if(categories.left.length > 0){
                console.log('A- selected')
                const aFreq = this.frequencyDistribution(processedData, categories.left);
                const aTable = this.frequencyTable(aFreq, categories.left);
                this.aRows = aTable.rows;
                this.sortedRowsA = this.localSort(this.aRows, this.categoriesLeft.join('|'), false);
                console.log('A frequency', aFreq);
                console.log('A distribution', aTable);
                if(categories.right.length === 0){
                    this.headers = aTable.header;
                    this.rows = this.sortedRowsA;
                    this.sortedRows = this.sortedRowsA;
                }
            }

            if(categories.right.length > 0){
                console.log('-B selected')
                const bFreq = this.frequencyDistribution(processedData, categories.right);
                const bTable = this.frequencyTable(bFreq, categories.right);
                this.bRows = bTable.rows;
                this.sortedRowsB = this.localSort(this.bRows, this.categoriesRight.join('|'), false);
                console.log('B frequency', bFreq);
                console.log('B distribution', bTable);
                if(categories.left.length === 0){
                    this.headers = bTable.header;
                    this.rows = this.sortedRowsB;
                    this.sortedRows = this.sortedRowsB;
                }
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
            const allColumnKeysSorted = Array.from(allColumnKeys).sort();

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

            console.log('allColumnKeysSorted', allColumnKeysSorted, allColumnKeysSorted.length);

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
            console.log('new head', headers);
            console.log('new rows', this.sortedRows);
            console.log('new foot', this.footer);
        },
        toggleCategory(e){
            const categories = e.target.dataset.side==='left'?this.categoriesLeft:this.categoriesRight;
            const clickedCategory = e.target.dataset.category;
            if(categories.includes(clickedCategory)){
                categories.splice(categories.indexOf(clickedCategory), 1);
            }else{
                if(categories.length===2){
                    console.warn('reached category combo limit');
                    return;
                }
                categories.push(clickedCategory);
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
        toggleTableDrawer(){
            const el = document.querySelector('.table-drawer');
            const tableWidth = Math.floor(el.getBoundingClientRect().width)+15;
            if(el.dataset.state==='closed'){
                el.style.left = `calc(100vw - ${tableWidth}px)`;
                el.dataset.state = 'open';
            }else{
                el.style.left = `calc(100vw - 80px)`;
                el.dataset.state = 'closed';
            }
        },
        updateTableDrawer(){
            const el = document.querySelector('.table-drawer');
            if(!el) return;
            const tableWidth = Math.floor(el.getBoundingClientRect().width)+15;
            if(el.dataset.state==='open') el.style.left = `calc(100vw - ${tableWidth}px)`;
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

colors object mirrors metadata_labels

fieldColors = {
    category: {
        label: "#color", 
        label: "#color", 
        ...
    },
    ...
}

//processed data is a flattened array of objects, parallells NAMES, contains only user selected categories

processedData = [
    {categoryA: "label_a1", categoryB:"label_b1"},
    {categoryA: "label_a1", categoryB:"label_b1"},
    {categoryA: "label_a2", categoryB:"label_b2"},
    {categoryA: "label_a2", categoryB:"label_b2"},
    ...
]

*/