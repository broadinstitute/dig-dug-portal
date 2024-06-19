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
        matkpFooter
    },
    data() {
      return {
        colorScaleIndex: d3.scaleOrdinal(colors),
        d: '::',
        rawData: null,
        transformedData: null,
        fieldColors: null,
        categoryOptions: [], // Replace with dynamic options if needed
        calculationOptions: ['counts', 'relative_abundance', 'log2_fold_change'],
        selectedCategories: {
            categoryA: 'cell_type__custom', 
            categoryB: 'sex', 
            categoryC: 'bmi__group'
        },
        selectedCalculations: ['counts', 'relative_abundance'],
        leftSelects: 1,
        rightSelects: 1,
        categoriesLeft: ['cell_type__custom'],
        categoriesRight: ['sex'],
        referenceField: null,
        metrics: {},
        fields: [],
        items: [],
        headerColumns2: null,
        headerColumns3: null,
        calcDir: ['xBCyA', 'xAyBC']
      };
    },
    created() {
        this.activeDataset = keyParams.dataset ? keyParams.dataset : this.datasetsList[0];
        this.fetchFields();
    },
    watch:{
        selectedCategories: {
            handler(newVal, oldVal) {
                console.log('--', newVal, oldVal);
                this.calculateTable();
            },
            deep: true,
        },
        selectedCalculations: {
            handler(newVal) {
                this.calculateTable();
            },
            deep: true,
        }
    },
    methods: {
        async fetchFields() {
            try {
                const response = await fetch(`${BIO_INDEX_HOST}/api/raw/file/single_cell/${this.activeDataset}/fields.json.gz`);
                const rawData = await response.json();

                console.log('rawData', rawData);

                this.rawData = rawData;
                this.categoryOptions = this.getCategories(rawData);
                this.fieldColors = this.calcFieldColors(rawData);

                this.calculateTable();
                
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        },
        calculateTable(){
            //remove nulls
            const categories = {
                left: this.categoriesLeft.filter(item => item !== null),
                right: this.categoriesRight.filter(item => item !== null)
            }
            //this.categories = categories;
            

            console.log('!!',categories);

            //this.transformedData = this.transformData2(this.rawData, this.selectedCategories)
            this.transformedData = this.transformData3(this.rawData, categories);
            if(this.selectedCalculations.includes('relative_abundance')) 
                    this.calculatePercentages3(this.transformedData, categories);

            if(this.selectedCategories.categoryB){
                if(this.selectedCalculations.includes('log2_fold_change'))
                    this.calculateLog2FoldChange(this.transformedData);
            }

            console.log('final', this.transformedData)

            this.transformForBTable3(this.transformedData, categories);
        },
        getCategories(rawData){
             return Object.keys(rawData["metadata_labels"]);
        },
        calcFieldColors(rawData){
            const colors = {};
            let colorIndex = 0;
            for(const [key, value] of Object.entries(rawData["metadata_labels"])){
                colors[key] = {};
                for(var i=0; i<value.length; i++){
                    colors[key][value[i]] = {
                        idx: i,
                        color: this.colorScaleIndex(colorIndex)
                    }
                    colorIndex++;
                }
            }
            console.log('colors', colors);
            return colors;
        },

        transformData2(rawData, categories){
            let { categoryA, categoryB, categoryC } = categories;

            // populate labels arrays
            let labelsA = Object.values(rawData.metadata_labels[categoryA]);
            let labelsB = categoryB ? Object.values(rawData.metadata_labels[categoryB]) : [];
            let labelsC = categoryC ? Object.values(rawData.metadata_labels[categoryC]) : [];

            const matrix = {}
            rawData.NAME.forEach((cellId, index) => {
                const labelA = labelsA[rawData.metadata[categoryA][index]];
                const labelB = categoryB ? labelsB[rawData.metadata[categoryB][index]] : -1;
                const labelC = categoryC ? labelsC[rawData.metadata[categoryC][index]] : -1;

                if(categoryA){
                    const countLabelA = `${labelA}${this.d}_count`;
                    if(!matrix[countLabelA]) matrix[countLabelA] = 0;
                    matrix[countLabelA]++;
                }
                if(categoryB && !categoryC){
                    const countLabelB = `${labelA}${this.d}${labelB}${this.d}_count`;
                    if(!matrix[countLabelB]) matrix[countLabelB] = 0;
                    matrix[countLabelB]++;
                }
                if(categoryB && categoryC){
                    const countLabelC = `${labelA}${this.d}${labelB}${this.d}${labelC}${this.d}_count`;
                    if(!matrix[countLabelC]) matrix[countLabelC] = 0;
                    matrix[countLabelC]++;
                }
            });

            console.log('counts', matrix);
            return matrix;
        },

        //current data struct
        /*
        rawData = {
            NAMES: [cell_id, cell_id, ...],                 //len: all cells
            metadata: {
                category: [label_idx, label_idx, ...],      //len: all cells
                category: [label_idx, label_idx, ...],      //len: all cells
                ...
            },
            metadata_labels: {
                category: [label, label, ...],              //len: all labels in category
                category: [label, label, ...],              //len: all labels in gategory
                ...
            }
        }
        categories = {
            left: ["category", "category", ...],            //row (index)
            right: ["category", "category", ...]            //columns
        }
        */
        //TODO: add param to accept aggregation function (or multiple)
        //e.g. transformData2(rawData, categories, aggFunc)
        //aggregationType: SUM, MEAN, MIN, MAX ...           //aggregation function
        transformData3(rawData, categories) {
            const { left: leftCategories, right: rightCategories } = categories;
            const matrix = {};
        
            rawData.NAME.forEach((cellId, index) => {
                // Construct the label for each cell using the left categories
                const leftLabelParts = leftCategories.map(category => {
                    const labelIndex = rawData.metadata[category][index];
                    return rawData.metadata_labels[category][labelIndex];
                });
                const leftLabel = leftLabelParts.join(this.d);
        
                // Construct the label for each cell using the right categories
                const rightLabelParts = rightCategories.map(category => {
                    const labelIndex = rawData.metadata[category][index];
                    return rawData.metadata_labels[category][labelIndex];
                });
                const rightLabel = rightLabelParts.join(this.d);
        
                // Create the left label and update the matrix count
                const leftLabelCount = `${leftLabel}${this.d}_count`;
                if (!matrix[leftLabelCount]) {
                    matrix[leftLabelCount] = 0;
                }
                matrix[leftLabelCount]++;
        
                // Create the combined label for left and right and update the matrix count
                const combinedLabelCount = `${leftLabel}${this.d}${rightLabel}${this.d}_count`;
                if (!matrix[combinedLabelCount]) {
                    matrix[combinedLabelCount] = 0;
                }
                matrix[combinedLabelCount]++;
            });
        
            console.log('matrix', matrix);
            return matrix;
        },

        //TODO: generalize this method to perform calculations based on given category structure
        //currently assumes AxBC format. 
        //should be able to do BCxA, ABxBC
        //ideally any length of categories A..NxB..N
        calculatePercentages(flattenedObject, categories) {
            const percentagesData = {};

            for (const key in flattenedObject) {
                const parts = key.split(this.d);
                const depth = parts.length-1;
                
                if (depth===1) percentagesData[`${parts[0]}${this.d}_percent`] = (flattenedObject[key] / this.rawData.NAME.length * 100).toFixed(2);
                if (depth===2) percentagesData[`${parts[0]}${this.d}${parts[1]}${this.d}_percent`] = (flattenedObject[key] / flattenedObject[`${parts[0]}${this.d}_count`] * 100).toFixed(2);
                if (depth===3) percentagesData[`${parts[0]}${this.d}${parts[1]}${this.d}${parts[2]}${this.d}_percent`] = (flattenedObject[key] / flattenedObject[`${parts[0]}${this.d}_count`] * 100).toFixed(2);
            }
            console.log(percentagesData);
            this.transformedData  = {...this.transformedData, ...percentagesData};
            //return percentagesData;
        },

        calculatePercentages3(flattenedObject, categories) {
            const { left: leftCategories, right: rightCategories } = categories;
            const leftLength = leftCategories.length;
            const rightLength = rightCategories.length;
            const totalLength = leftLength + rightLength;
        
            const percentagesData = {};
        
            for (const key in flattenedObject) {
                const parts = key.split(this.d);
                const depth = parts.length - 1;
                
                if (depth <= leftLength) {
                    // Percentages for left categories only
                    const baseKey = parts.slice(0, depth).join(this.d) + this.d;
                    const percentageKey = baseKey + '_percent';
                    percentagesData[percentageKey] = (flattenedObject[key] / this.rawData.NAME.length * 100).toFixed(2);
                } else {
                    // Percentages for combined left and right categories
                    const baseKey = parts.slice(0, leftLength).join(this.d) + this.d;
                    const percentageKey = parts.slice(0, depth).join(this.d) + this.d + '_percent';
                    percentagesData[percentageKey] = (flattenedObject[key] / flattenedObject[baseKey + '_count'] * 100).toFixed(2);
                }
            }
            
            console.log('percentagesData', percentagesData);
            this.transformedData = { ...this.transformedData, ...percentagesData };
            // return percentagesData;
        },
        
        //TODO: same as above
        calculateLog2FoldChange(flattenedObject) {
            const log2FoldChangeData = {};
            let referenceField = null;

            if(this.selectedCategories.categoryB && !this.selectedCategories.categoryC){
                // Use first field in category if reference field if not provided
                if (!referenceField) {
                    const fieldsInCategoryB = Object.values(this.rawData.metadata_labels[this.selectedCategories.categoryB]).sort();
                    referenceField = fieldsInCategoryB[0];
                    this.referenceField = referenceField;
                }
            
                // Calculate log2 fold change relative to the reference field
                for (const key in flattenedObject) {
                    const parts = key.split(this.d);
                    const depth = parts.length - 1;
            
                    if (depth===2) {
                        const currentCategory = parts[0];
                        const currentField = parts[1];
                        const currentCount = flattenedObject[`${currentCategory}${this.d}${currentField}${this.d}_count`];
                        const referenceCount = flattenedObject[`${currentCategory}${this.d}${referenceField}${this.d}_count`];
                        if (referenceCount > 0) {
                            log2FoldChangeData[`${currentCategory}${this.d}${currentField}${this.d}_log2FoldChange`] = Math.log2(currentCount / referenceCount).toFixed(2);
                        } else {
                            log2FoldChangeData[`${currentCategory}${this.d}${currentField}${this.d}_log2FoldChange`] = '--';
                        }
                    }
                }
            }

            if(this.selectedCategories.categoryB && this.selectedCategories.categoryC){
                const categoryCombos = this.makeCategoryCombos(this.selectedCategories.categoryB, this.selectedCategories.categoryC).sort();
                // Use first field in category if reference field if not provided
                const combinedReferenceField = categoryCombos[0];
                this.referenceField = combinedReferenceField;

                for (const key in flattenedObject) {
                    const parts = key.split(this.d);
                    const depth = parts.length - 1;
            
                    if (depth===3) {
                        const currentCategory = parts[0];
                        const currentCombinedField = `${parts[1]}${this.d}${parts[2]}`;
                        const currentCount = flattenedObject[`${currentCategory}${this.d}${currentCombinedField}${this.d}_count`];
                        const referenceCount = flattenedObject[`${currentCategory}${this.d}${combinedReferenceField}${this.d}_count`];
                        if (referenceCount > 0) {
                            log2FoldChangeData[`${currentCategory}${this.d}${currentCombinedField}${this.d}_log2FoldChange`] = Math.log2(currentCount / referenceCount).toFixed(2);
                        } else {
                            log2FoldChangeData[`${currentCategory}${this.d}${currentCombinedField}${this.d}_log2FoldChange`] = '--';
                        }
                    }
                }
            }
        
            console.log(log2FoldChangeData);
            this.transformedData  = {...this.transformedData, ...log2FoldChangeData};
            return log2FoldChangeData;
        },
        makeCategoryCombos(category1, category2){
            const combinedLabels = [];
            const category1Labels = Object.values(this.rawData.metadata_labels[category1]);
            const category2Labels = Object.values(this.rawData.metadata_labels[category2]);
            category1Labels.forEach(label1 => {
                category2Labels.forEach(label2 => {
                    combinedLabels.push(`${label1}${this.d}${label2}`);
                })
            })
            return combinedLabels;
        },
        //TODO: generalize this method to perform calculations based on given category structure (same as above)
        transformForBTable(flattenedObject, categories) {
            const categoriesA = new Set();
            var categoriesBC = new Set();
            const data = {};

            const showCounts = this.selectedCalculations.includes('counts');
            const showPct = this.selectedCalculations.includes('relative_abundance');
            const showLog2FC = this.selectedCalculations.includes('log2_fold_change');
        
            // Extract unique categories
            for (const key in flattenedObject) {
                const parts = key.split(this.d);
                categoriesA.add(parts[0]);
                if (parts.length > 3) {
                    categoriesBC.add(`${parts[1]}${this.d}${parts[2]}`);
                }else if(parts.length > 2){
                    categoriesBC.add(`${parts[1]}`);
                }
            }
            categoriesBC = Array.from(categoriesBC).sort();

            console.log('categoriesA', categoriesA);
            console.log('categoriesBC', categoriesBC);
            console.log('selectedCalculations', this.selectedCalculations)
        
            // Populate rows
            categoriesA.forEach(categoryA => {
                //catA data
                const row = { [this.selectedCategories.categoryA]: categoryA };
                if(showCounts) row[`count`] = flattenedObject[`${categoryA}${this.d}_count`] || 0;
                if(showPct) row[`percent`] = (flattenedObject[`${categoryA}${this.d}_percent`] || 0)+'%';
                //catBC data
                categoriesBC.forEach(categoryBC => {
                    if(showCounts) row[`${categoryBC}${this.d}_count`] = flattenedObject[`${categoryA}${this.d}${categoryBC}${this.d}_count`] || 0;
                    if(showPct) row[`${categoryBC}${this.d}_percentage`] = (flattenedObject[`${categoryA}${this.d}${categoryBC}${this.d}_percent`] || 0)+'%';
                    if(showLog2FC) row[`${categoryBC}${this.d}_log2FoldChange`] = flattenedObject[`${categoryA}${this.d}${categoryBC}${this.d}_log2FoldChange`] || 0;
                });
                //add to data obj
                data[categoryA] = row;
            });
            console.log('data', data);
            // Convert data object to array
            const rows = Object.values(data);


            // Create headers
            //flat header
            //catA headers
            const headers = [{
                key: this.selectedCategories.categoryA,
                label: 'label',
                class: showCounts || showPct ? 'bold' : 'bold border-right2',
                thClass: showCounts || showPct ? '' : 'border-right2',
            }];
            if(showCounts) headers.push({key: `count`, label: 'count', class: `num bold ${!showPct ? 'border-right2' : ''}`, thClass: `${!showPct ? 'border-right2' : ''}`});
            if(showPct) headers.push({key: 'percent', label: 'percent', class: 'num border-right2', thClass: 'border-right2'});
            //catBC headers
            categoriesBC.forEach(category => {
                if(showCounts) headers.push({key: `${category}${this.d}_count`, label: 'count', class: 'num'});
                if(showPct) headers.push({key: `${category}${this.d}_percentage`, label: 'percent', class: 'num'});
                if(showLog2FC) headers.push({key: `${category}${this.d}_log2FoldChange`, label: 'log2FC', class: 'num', thClass: `${this.referenceField === category ? 'isRef' : ''}`});
            });

            //TODO calculate colspans dunamically

            const categoryAcolspan = 1 + showPct + showCounts;
            const categoryBCcolspan = showCounts + showPct + showLog2FC;

            const headers2 = [{label: this.selectedCategories.categoryA, colspan: categoryAcolspan}]
            categoriesBC.forEach(category => {
                headers2.push({label: `${category}`, colspan:categoryBCcolspan});
            });

            const headers3 = [{label: '', colspan: this.selectedCalculations.length + (this.selectedCalculations.includes('log2_fold_change') ? 0 : 1)}]
            headers3.push({label: `${this.selectedCategories.categoryB}${ this.selectedCategories.categoryC ? '::'+this.selectedCategories.categoryC : ''}`, colspan: categoriesBC.length * this.selectedCalculations.length});
            categoriesBC.forEach(category => {
                //headers3.push({label: `${category}`, colspan:9});
            });
            
            //set b-table data
            this.fields = headers.map(header => ({ key: header.key, label: header.label, sortable: true, tdClass: header.class || '', thClass: header.thClass || '' }));
            this.items = rows;

            this.headerColumns2 = headers2;
            this.headerColumns3 = headers3;

            console.log('headers3', this.headerColumns3)
            console.log('headers2', this.headerColumns2)
            console.log('headers', headers)
            console.log('rows', rows);
        },

        transformForBTable3(flattenedObject, categories) {
            const { left: leftCategories, right: rightCategories } = categories;
            const leftLength = leftCategories.length;

            const leftFields = new Set();
            var rightFields = new Set();

            const data = {};

            const showCounts = this.selectedCalculations.includes('counts');
            const showPct = this.selectedCalculations.includes('relative_abundance');
            const showLog2FC = this.selectedCalculations.includes('log2_fold_change');

            //aggregate left/right fields by category
            for (const key in flattenedObject) {
                const parts = key.split(this.d);
                const depth = parts.length - 1;
                if (depth <= leftLength) {
                    leftFields.add(parts.slice(0, depth).join(this.d));
                } else {
                    rightFields.add(parts.slice(leftLength, depth).join(this.d));
                }
            }
            //sort right side
            rightFields = Array.from(rightFields).sort();
            //set to null if right fields empty
            if(rightFields.length===1 && rightFields[0]==='') rightFields = null;

            //if no left fields, no table
            if(leftFields.size===0) {
                this.fields = null;
                this.items = null;
                return;
            }

            console.log('leftFields', leftFields);
            console.log('rightFields', rightFields);
            console.log('selectedCalculations', this.selectedCalculations)
        
            // Populate rows
            leftFields.forEach(leftCategory => {
                //catA data
                const row = { [leftCategories.join(this.d)]: leftCategory };
                if(showCounts) row[`count`] = flattenedObject[`${leftCategory}${this.d}_count`] || 0;
                if(showPct) row[`percent`] = (flattenedObject[`${leftCategory}${this.d}_percent`] || 0)+'%';
                //catBC data
                rightFields?.forEach(rightCategory => {
                    if(showCounts) row[`${rightCategory}${this.d}_count`] = flattenedObject[`${leftCategory}${this.d}${rightCategory}${this.d}_count`] || 0;
                    if(showPct) row[`${rightCategory}${this.d}_percentage`] = (flattenedObject[`${leftCategory}${this.d}${rightCategory}${this.d}_percent`] || 0)+'%';
                    if(showLog2FC) row[`${rightCategory}${this.d}_log2FoldChange`] = flattenedObject[`${leftCategory}${this.d}${rightCategory}${this.d}_log2FoldChange`] || 0;
                });
                //add to data obj
                data[leftCategory] = row;
            });
            console.log('data', data);
            // Convert data object to array
            const rows = Object.values(data);


            // Create headers
            //flat header
            //catA headers
            const headers = [{
                key: leftCategories.join(this.d),
                label: 'label',
                class: showCounts || showPct ? 'bold' : 'bold border-right2',
                thClass: showCounts || showPct ? '' : 'border-right2',
            }];
            if(showCounts) headers.push({key: `count`, label: 'count', class: `num bold ${!showPct ? 'border-right2' : ''}`, thClass: `${!showPct ? 'border-right2' : ''}`});
            if(showPct) headers.push({key: 'percent', label: 'percent', class: 'num border-right2', thClass: 'border-right2'});
            //catBC headers
            rightFields?.forEach(rightCategory => {
                if(showCounts) headers.push({key: `${rightCategory}${this.d}_count`, label: 'count', class: 'num'});
                if(showPct) headers.push({key: `${rightCategory}${this.d}_percentage`, label: 'percent', class: 'num'});
                if(showLog2FC) headers.push({key: `${rightCategory}${this.d}_log2FoldChange`, label: 'log2FC', class: 'num', thClass: `${this.referenceField === rightCategory ? 'isRef' : ''}`});
            });

            //TODO calculate colspans dunamically

            const categoryAcolspan = 1 + showPct + showCounts;
            const categoryBCcolspan = showCounts + showPct + showLog2FC;

            const headers2 = [{label: leftCategories.join(this.d), colspan: categoryAcolspan}]
            rightFields?.forEach(category => {
                headers2.push({label: `${category}`, colspan:categoryBCcolspan});
            });

            const headers3 = [{label: '', colspan: this.selectedCalculations.length + (this.selectedCalculations.includes('log2_fold_change') ? 0 : 1)}]
            headers3.push({label: rightCategories.join(this.d), colspan: rightFields?.length | 0 * this.selectedCalculations.length});
            rightFields?.forEach(category => {
                //headers3.push({label: `${category}`, colspan:9});
            });
            
            //set b-table data
            this.fields = headers.map(header => ({ key: header.key, label: header.label, sortable: true, tdClass: header.class || '', thClass: header.thClass || '' }));
            this.items = rows;

            this.headerColumns2 = headers2;
            //this.headerColumns3 = headers3;

            console.log('headers3', this.headerColumns3)
            console.log('headers2', this.headerColumns2)
            console.log('headers', headers)
            console.log('rows', rows);
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
        swapSides(){
            const categoriesleftTmp = this.categoriesLeft;
            this.categoriesLeft = this.categoriesRight;
            this.categoriesRight = categoriesleftTmp;
            this.calculateTable();
        }
    }
}).$mount("#app");