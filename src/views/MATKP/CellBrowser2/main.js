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
    render(createElement, context) {
        return createElement(Template);
    },
    components: {
        matkpNav,
        matkpFooter,
        StackedBarChart
    },
    data() {
      return {
        colorScaleIndex: d3.scaleOrdinal(colors),
        colorIndex: 0,

        d: '::',
        rawData: null,
        fieldColors: null,
        categoryCombos: {},
        categoriesLeft: [],
        categoriesRight: [],
        lockedCategoriesLeft: [],
        lockedCategoriesRight: [],
        referenceField: null,
        sortedItems: [],

        headers: [],
        headers2: [],

        rows: [],
        aRows: [],
        bRows: [],
        
        footer: [],

        
      };
    },
    created() {
        this.activeDataset = keyParams.dataset ? keyParams.dataset : this.datasetsList[0];
        this.fetchFields();
    },
    watch:{
    },
    computed: {
        listOfCategories: function() {
            if(!this.rawData) return null;
            const source = this.rawData["metadata_labels"];
            const allCategories = Object.keys(source);
            const filtered = allCategories.filter(category => source[category].length>1);
            return filtered.sort();
        },
    },
    methods: {
        async fetchFields() {
            try {
                const response = await fetch(`${BIO_INDEX_HOST}/api/raw/file/single_cell/${this.activeDataset}/fields.json.gz`);
                const rawData = await response.json();

                console.log('rawData', rawData);

                this.rawData = rawData;
                this.fieldColors = this.calcFieldColors(rawData);
                console.log('fieldColors', this.fieldColors);

                this.calculateTable();
                
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        },
        calculateTable(){
            const categories = {
                left: this.categoriesLeft.filter(item => item !== null),
                right: this.categoriesRight.filter(item => item !== null)
            }
            
            this.processData(this.rawData, categories);
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
            if(!this.rawData) return [];
            const isMulti = Array.isArray(category) && category.length>1;
            if(!isMulti) return this.rawData["metadata_labels"][category];
            return this.categoryCombos[category.join('|')];
        },
        categoryColors(category){
            if(!category) return [];
            return this.fieldColors ? Object.values(this.fieldColors[category]) : [];
        },

        processData(rawData, categories) {
            const processedData = [];

            const { NAME, metadata, metadata_labels } = rawData;
            const allUserSelectedCategories = categories.left.concat(categories.right);

            console.log('allUserSelectedCategories', allUserSelectedCategories)
          
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

            //clear previous data
            this.headers = [];
            this.headers2 = [];
            this.rows = [];
            this.footer = [];
            this.sortedItems = [];
            this.aRows = [];
            this.bRows = [];

            //generate tables from processed data
            if(categories.left.length > 0 && categories.right.length > 0){
                console.log('AB selected')
                const crossTabData = this.crossTabulation(processedData, categories.left, categories.right);
                console.log('crossTabulation', crossTabData);
                this.frequencyCrossTable(crossTabData);
            }

            if(categories.left.length > 0){
                console.log('A- selected')
                const aFreq = this.frequencyDistribution(processedData, categories.left);
                const aTable = this.frequencyTable(aFreq, categories.left);
                this.aRows = aTable.rows;
                console.log('A frequency', aFreq);
                console.log('A distribution', aTable);
                if(categories.right.length === 0){
                    this.headers = aTable.header;
                    this.rows = aTable.rows;
                    this.sortedItems = aTable.rows;
                    this.headers2 = [];
                    this.footer = aTable.footer;
                }
            }

            if(categories.right.length > 0){
                console.log('-B selected')
                const bFreq = this.frequencyDistribution(processedData, categories.right);
                const bTable = this.frequencyTable(bFreq, categories.right);
                this.bRows = bTable.rows;
                console.log('B frequency', bFreq);
                console.log('B distribution', bTable);
                if(categories.left.length === 0){
                    this.headers = bTable.header;
                    this.rows = bTable.rows;
                    this.sortedItems = bTable.rows;
                    this.headers2 = [];
                    this.footer = bTable.footer;
                }
            }
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

            // calculate the rows and keep track of column totals
            for(const [key, value] of Object.entries(data)){
                const row = {[this.categoriesLeft.join('|')]: key, 'Total': 0};

                for (const keyB of allColumnKeys) {
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

            console.log('allColumnKeys', allColumnKeys, Object.keys(allColumnKeys).length)

            //TODO: all additional headers should be added to a headers array of headers
            //that way we dont need to keep track of the layers
            const headers2 = [{label: '', colspan: 1}]
            headers2.push({label: this.categoriesRight.join('|'), colspan:allColumnKeys.size})
            //need an array of the B fields
            /*rightFields?.forEach(leftCategory => {
                headers2.push({label: `${leftCategory}`, colspan:categoryBCcolspan});
            });*/

            this.rows = rows;
            this.sortedItems = rows;
            this.footer = footerRow;
            this.headers = headers;
            this.headers2 = headers2;
            console.log('new head', headers);
            console.log('new rows', rows);
            console.log('new foot', this.footer);
        },
        handleCategorySelect(e, side, index) {
            const categories = side==='left'?this.categoriesLeft:this.categoriesRight;
            //selected none
            categories[index] = e.target.value || null;
            console.log(side, categories, e.target.value);
            console.log('!!', this.categoriesLeft, this.categoriesRight);
            this.calculateTable();
        },
        addFactor(side) {
            const categories = side==='left'?this.categoriesLeft:this.categoriesRight;
            categories.push(null);
        },
        toggleCategory(e, side){
            const categories = side==='left'?this.categoriesLeft:this.categoriesRight;
            const lockedCategories = side==='left'?this.lockedCategoriesLeft:this.lockedCategoriesRight;
            const clickedCategory = e.target.dataset.category;
            const isLocked = lockedCategories.includes(clickedCategory);
            const lockedIdx = categories.indexOf(lockedCategories[0])
            if(isLocked) return;
            if(categories.includes(clickedCategory)){
                categories.splice(categories.indexOf(clickedCategory), 1);
            }else{
                if(lockedCategories.length>0){
                    if(categories.length===2){
                        categories[lockedIdx===0?1:0] = clickedCategory;
                    }else{
                        categories.push(clickedCategory);
                    }
                }else{
                    categories[0] = clickedCategory;
                }
            }
            this.calculateTable();
        },
        lockCategory(e, side){
            e.stopPropagation();
            const categories = side==='left'?this.categoriesLeft:this.categoriesRight;
            const lockedCategories = side==='left'?this.lockedCategoriesLeft:this.lockedCategoriesRight;
            const clickedCategory = e.target.parentNode.dataset.category;
            if(lockedCategories.includes(clickedCategory)){
                lockedCategories.splice(lockedCategories.indexOf(clickedCategory), 1);
                categories.splice(1,1);
            }else{
                lockedCategories.push(clickedCategory);
            }
            console.log('locked', side, lockedCategories)
        },
        swapSides(){
            const categoriesLeftTmp = this.categoriesLeft;
            const lockedCategoriesLeftTmp = this.lockedCategoriesLeft;
            this.categoriesLeft = this.categoriesRight;
            this.categoriesRight = categoriesLeftTmp;
            this.lockedCategoriesLeft = this.lockedCategoriesRight;
            this.lockedCategoriesRight = lockedCategoriesLeftTmp;
            this.calculateTable();
        },
        onSortChanged(ctx) {
            const sortBy = ctx.sortBy;
            const sortDesc = ctx.sortDesc;
            const compareType = typeof this.rows[0][sortBy];
            this.sortedItems = this.rows.slice().sort((a, b) => {
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
            console.log('sorted', this.sortedItems);
          },
          toggleTableDrawer(e){
            const el = e.target.parentNode;
            const tableWidth = Math.floor(el.getBoundingClientRect().width);
            const state = e.target.dataset.state;
            console.log('toggleTableDrawer', el, tableWidth, state);
            if(state==='closed'){
                el.style.left = `calc(100vw - ${tableWidth}px)`;
                e.target.dataset.state = 'open';
            }else{
                console.log('there')
                el.style.left = `calc(100vw - 60px)`;
                e.target.dataset.state = 'closed';
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
    {categoryA: "label", categoryB:"label"},
    {categoryA: "label", categoryB:"label"},
    {categoryA: "label", categoryB:"label"},
    {categoryA: "label", categoryB:"label"},
    ...
]

*/