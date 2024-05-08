import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import * as d3 from "d3";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
//import formatters from "@/utils/formatters";

//import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils"; 

const BIO_INDEX_HOST = 'https://bioindex-dev.hugeamp.org';
//const colors = ["#587c76","#f8d9fa","#8b6b8c","#82c2ff","#ffaa92","#00acdd","#ffb8f5","#01d7ee","#bdb0ff","#2b8647","#01d9bd","#bd4b8e","#aff590","#6f7e00","#0195fa","#af4fb1","#d43d4b","#02ffc3","#ae9800","#ff8efd","#ffae3e","#567bff","#ff5544","#e67500","#d71ba0","#9f6cff","#ff00ac","#b652ff","#82e900","#e600e3"];
//const colors = ["#696969","#8b4513","#228b22","#808000","#483d8b","#008b8b","#9acd32","#00008b","#7f007f","#8fbc8f","#b03060","#ff0000","#ff8c00","#ffff00","#deb887","#7fff00","#8a2be2","#00ff7f","#dc143c","#00ffff","#00bfff","#0000ff","#da70d6","#ff00ff","#1e90ff","#fa8072","#90ee90","#add8e6","#ff1493","#ffb6c1"];

new Vue({
    store,

    components: {

    },

    data() {
        return {
            colorScalePlasma: d3.scaleSequential(d3.interpolatePlasma),
            colorScaleIndex: d3.scaleOrdinal(d3.schemeCategory10),
            colorScaleRed: d3.scaleSequential(d3.interpolateReds),
            colorScaleRedBlue: d3.scaleLinear().domain([-1, 0, 1]).range(['red', 'white', 'blue']),
            colorScalePlasmaColorsArray: null,


            cellCountOptions: ["cell count", "cell %"],
            cellCountOption: 0,

            datasetsList: null,
            datasetsObj: null,
            activeDataset: null,
            activeField: null,
            compareField: null,
            compareSet: null,
            compareGene: null,
            compareGeneSet: null,
            compareDiffGeneSet: null,
            activeGene: null,

            isLoading: false,

            dimmedElements: null,
            hoverInfo: null,
            lockedHover: false,

            //umap canvas
            center: null,
            pointsCenter: null,
            calculatedScaleFactor: null,
            scaleFactor: null,
            scale: null,
            zoom: null,
            pointBounds: {n: 0, s: 0, e: 0, w: 0},
            pointBoundsCalculated: false,

            //scroll
            scrollThreshhold: 65,
            fixedSidebar: false,
        };
    },

    watch: {

    },

    computed: {
    },

    mounted() {
        //inject pako gzip library
        //this.injectScript('https://cdnjs.cloudflare.com/ajax/libs/pako/2.0.3/pako.min.js');
        
        //inject ttest lib
        this.injectScript('https://cdn.jsdelivr.net/gh/stdlib-js/stats-ttest2@umd/browser.js');

        //add scroll listener
        window.addEventListener('scroll', this.handleScroll);
    },

    async created() {
        await this.getDatasets();

        //TMP, auto select dataset and field on start
        this.activeDataset = this.datasetsList[0];
        await this.displayDataset();
        //this.selectField('cell_type__custom');

        //get position of info elements parent so we know where to set the 'fixed' breakpoint
        const rect = document.querySelector('.info-wrapper').getBoundingClientRect();
        this.scrollThreshhold = rect.top + window.scrollY - 20;

        //generate colors array from plasma color scale
        this.colorScalePlasmaColorsArray = d3.range(0, 1.01, 0.1).map(t => this.colorScalePlasma(t)).join(', ');
    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {
        ...uiUtils,
        pValueFormatter: Formatters.pValueFormatter,
        //(unused)
        generateColors(numColors) {
            const colors = [];
            const goldenAngle = 180 * (3 - Math.sqrt(5))
            for (var i = 0; i < numColors; i++) {
                //var hue = (360 / numColors) * i; // Distribute hues evenly
                var hue = i * 137.508; //golden angle
                var saturation = 50; // Keep saturation constant
                var lightness = 50; // Keep lightness constant
                var color = "hsl(" + hue + ", " + saturation + "%, " + lightness + "%)";
                colors.push(color);
            }
            return colors;
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
        async doFetch(fetchPath){
            console.log('fetching: ', fetchPath)
            this.isLoading = true;
            const response = await fetch(`${BIO_INDEX_HOST}${fetchPath}`);
            const contentType = response.headers.get("content-type");
            /*
                for gz data, Content-Encoding is set to gzip, and gets auto-inflated by the browser
                Content-Encoding is not visible in response.headers (but it is visible in dev-tools)
                look into 'Access-Control-Expose-Headers' server-side to expose Content-Encoding to js
            */
            console.log(response.headers.get("content-type"), response);
            if(contentType.includes('tab') || contentType.includes('tsv')){
                const data = await response.text();
                return this.tsvToJson(data);
            }else{
                return response.json();
            }
            
            /*
            // handle fetch without Content-Encoding: gzip
            // using pako library
            if(fetchPath.includes('.gz')){
                const blob = await response.blob();
                const decompressedData = await this.inflateGzip(blob);
                const data = await decompressedData.text();
                if(fetchPath.includes('.tsv')) {
                    return this.tsvToJson(data);
                }else{
                    return JSON.parse(data);
                }
            }else{
                return response.json();
            }
            */
        },
        //(unused)
        inflateGzip(blob) {
            console.log('decompressing gzip blob');
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function() {
                    const inflated = pako.inflate(new Uint8Array(reader.result));
                    resolve(new Blob([inflated]));
                };
                reader.onerror = function(error) {
                    reject(error);
                };
                reader.readAsArrayBuffer(blob);
            });
        },
        tsvToJson (tsvString) {
            const lines = tsvString.split('\n');
            const headers = lines.shift().split('\t');
            const jsonArray = [];
    
            lines.forEach(line => {
                const values = line.split('\t');
                const obj = {};
                
                headers.forEach((header, index) => {
                    //obj[header] = header==='X' || header==='Y' ? parseFloat(values[index]) : values[index];
                    obj[header] = values[index];
                });
    
                jsonArray.push(obj);
            });
    
            return jsonArray;
        },

        async getDatasets(){
            console.log('getting datasets');
            const json = await this.doFetch(`/api/bio/keys/single-cell-gene/2?columns=dataset`);
            //add to datasets list
            this.datasetsList = json.keys;
            //add to datasets object
            const datasetsObj = {};
            for(var i=0; i<this.datasetsList.length; i++){
                if(!datasetsObj[this.datasetsList[i]]) datasetsObj[this.datasetsList[i]] = {};
            }
            this.datasetsObj = datasetsObj;
            this.isLoading = false;
            console.log('datasets list', this.datasetsList);
            console.log('datasets object', this.datasetsObj);
        },

        async getFields(){
            if(this.datasetsObj[this.activeDataset]["cells"] && this.datasetsObj[this.activeDataset]["metadata"]){
                console.log('already have fields data for: ', this.activeDataset);
                return;
            }

            console.log('getting fields for: ', this.activeDataset);
            const json = await this.doFetch(`/api/raw/file/single_cell/${this.activeDataset}/fields.json.gz`);
            Vue.set(this.datasetsObj[this.activeDataset], "cells", json["NAME"]);
            Vue.set(this.datasetsObj[this.activeDataset], "metadata_labels", json["metadata_labels"]);
            Vue.set(this.datasetsObj[this.activeDataset], "metadata", json["metadata"]);

            this.calcFieldColors();
            this.calcCellCounts();

            this.isLoading = false;

            console.log('fields', json);
        },

        async getCoordinates(){
            if(this.datasetsObj[this.activeDataset]["coordinates"]){
                console.log('alreadt have coordinates data for: ', this.activeDataset);
                return;
            }

            console.log('getting coordinates for: ', this.activeDataset);
            const json = await this.doFetch(`/api/raw/file/single_cell/${this.activeDataset}/coordinates.tsv.gz`);
            Vue.set(this.datasetsObj[this.activeDataset], "coordinates", json);

            this.drawUMAP();

            this.isLoading = false;

            console.log('coordinates', json);
        },

        async getGeneExpression(gene){
            if(!this.datasetsObj[this.activeDataset]["genes"]) this.datasetsObj[this.activeDataset]["genes"] = {};
            if(!this.datasetsObj[this.activeDataset]["genes"][gene]) this.datasetsObj[this.activeDataset]["genes"][gene] = {
                raw: null,
                processed: null
            };

            if(this.datasetsObj[this.activeDataset]["genes"][gene]["raw"]){
                console.log('alreadt have expression data for: (', gene, ') in', this.activeDataset);
                return;
            }

            console.log('getting gene expression for: ', this.activeDataset, gene);
            const json = await this.doFetch(`/api/bio/query/single-cell-lognorm?q=${this.activeDataset},${gene}`);

            //TODO catch no gene data result

            Vue.set(this.datasetsObj[this.activeDataset]["genes"][gene], "raw", json.data[0].expression);

            console.log(gene, 'raw expression', json);

            this.activeGene = gene;

            this.calcGeneExpression(gene);

            this.isLoading = false;

            
        },

        selectDataset(e){
            console.log('setting new dataset: ', e.target.value);

            this.unselectCompareField();
            this.unselectField();

            this.activeDataset = e.target.value;
            this.displayDataset();
        },
        async displayDataset(){
            await this.getFields();
            this.getCoordinates();

            this.selectField('cell_type__custom');

            console.log('datasetsObj updated: ', this.datasetsObj);
        },

        selectField(e){
            const val = typeof e==='string' ? e : e.target.value;
            console.log('setting field: ', val);

            this.unselectCompareField();

            this.activeField = val;

            if(this.datasetsObj[this.activeDataset]["genes"]){
                console.log('genes exist');
                Object.keys(this.datasetsObj[this.activeDataset]["genes"]).forEach(key => {
                    console.log('...', key);
                    this.calcGeneExpression(key);
                });
            }
        },
        unselectField(){
            this.activeField = null;
            const activeSelectorEl = document.querySelector('.active-field-selector');
            if(activeSelectorEl) activeSelectorEl.value = "";
        },

        selectCompareField(e){
            console.log('setting compare field: ', e.target.value);

            this.compareField = e.target.value;

            this.calcCompareCellCounts();

            this.$nextTick(() => {
                this.drawUMAP(this.compareField);
            });
        },
        unselectCompareField(){
            this.compareField = null;
            this.compareSet = null;
            const compareSelectorEl = document.querySelector('.comapre-field-selector');
            if(compareSelectorEl) compareSelectorEl.value = "";
        },

        searchGene(e){
            console.log('searcing for gene: ', e.target.value);
            const parts = e.target.value.split(/[,\s]+/);
            e.target.value = '';
            //TODO: should be a queue
            parts.forEach(async (gene) => {
                await this.getGeneExpression(gene.toUpperCase());
            })
            
        },
        setActiveGene(e){
            const gene = e.target.value;
            console.log('setting active gene', gene);
            this.activeGene = gene;
            this.calcCompareGeneExpression(this.activeGene);
        },
        removeGene(e){
            const geneToRemove = e.target.dataset.gene;
            console.log("removing gene", geneToRemove);
            if(this.activeGene === geneToRemove){
                const keys = Object.keys(this.datasetsObj[this.activeDataset]["genes"]);
                if(keys.length>1){
                    this.activeGene = keys[0] !== geneToRemove ? keys[0] : keys[1];
                }else{
                    //all genes removed
                    this.activeGene = null;
                    Vue.delete(this.datasetsObj[this.activeDataset], "genes");
                    return;
                }
            }
            //delete gene
            Vue.delete(this.datasetsObj[this.activeDataset]["genes"], geneToRemove);
            //re-render hack
            document.querySelector(`[data-a-field]`).dispatchEvent(new Event('mouseover'));
            document.querySelector(`[data-a-field]`).dispatchEvent(new Event('mouseout'));
            //const tmpGenes = this.datasetsObj[this.activeDataset]["genes"];
            //delete tmpGenes[geneToRemove];
            //Vue.set(this.datasetsObj[this.activeDataset], "genes", tmpGenes);
            //Vue.set(this.datasetsObj[this.activeDataset], "genes", this.datasetsObj[this.activeDataset]["genes"])
            //delete this.datasetsObj[this.activeDataset]["genes"][geneToRemove];
            //this.$forceUpdate();
            //Vue.set(this.datasetsObj[this.activeDataset], geneToRemove, undefined);
        },

        drawUMAP(field){
            const canvasEl = document.querySelector(`canvas.umap`);
            const canvas = canvasEl;
            const ctx = canvas.getContext("2d");
            const canvasWidth = 250;

            canvas.width = canvasWidth*2;
            canvas.height = canvasWidth*2;
            canvas.style.width = canvasWidth+'px';
            canvas.style.height = canvasWidth+'px';

            const pointsField = field || this.activeField;
            const dataField = pointsField === this.compareField ? 'data-b-field' : 'data-a-field';

            console.log('pointsField', pointsField);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            this.resetPlot(canvas);

            if(!this.pointBoundsCalculated){
                //get point bounds by storing outermost points in each cardinal direction
                this.datasetsObj[this.activeDataset]["coordinates"].forEach(coord => {
                    var px = parseFloat(coord.X);
                    var py = parseFloat(coord.Y);
                    if(px>0) this.pointBounds.e = px > this.pointBounds.e ? px : this.pointBounds.e;
                    if(px<0) this.pointBounds.w = px < this.pointBounds.w ? px : this.pointBounds.w;
                    if(py>0) this.pointBounds.s = py > this.pointBounds.s ? py : this.pointBounds.s;
                    if(py<0) this.pointBounds.n = py < this.pointBounds.n ? py : this.pointBounds.n;
                })

                this.calculateScaleFactor(canvas);

                this.pointBoundsCalculated = true;
            }

            //draw points
            this.datasetsObj[this.activeDataset]["coordinates"].forEach((coord, index) => {
                const fieldIdx = this.datasetsObj[this.activeDataset]["metadata"][pointsField][index];
                const fieldName = this.labelNameFromIndex(pointsField, fieldIdx);

                if(fieldIdx===undefined) return;

                var px = parseFloat(coord.X);
                var py = parseFloat(coord.Y);

                var x = this.pointsCenter.x + px * this.zoom;
                var y = this.pointsCenter.y - py * this.zoom;

                const canvasEl = document.querySelector(`canvas.umap[${dataField}="${fieldName}"]`);
                const canvas = canvasEl;
                const ctx = canvas.getContext("2d");

                ctx.beginPath();
                ctx.arc(x, y, 1, 0, 2 * Math.PI);
                ctx.fillStyle = this.datasetsObj[this.activeDataset]["metadata_colors"][pointsField][fieldName]["color"];
                ctx.fill();
            });

            return;
            //debug
            ctx.beginPath();
            var x = this.center.x;
            var y = this.center.y;
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fillStyle = 'black';
            ctx.fill();

            ctx.beginPath();
            var x = this.pointsCenter.x;
            var y = this.pointsCenter.y;
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();

            
            const boundsWidth = (Math.abs(this.pointBounds.e)+Math.abs(this.pointBounds.w))*this.zoom;
            const boundsHeight = (Math.abs(this.pointBounds.s)+Math.abs(this.pointBounds.n))*this.zoom;

            ctx.strokeStyle = "green";
            ctx.strokeRect(this.center.x - boundsWidth/2, this.center.y - boundsHeight/2, boundsWidth, boundsHeight);
        },

        resetPlot(canvas){
            this.center = { x: canvas.width / 2, y: canvas.height / 2 };
            this.center.x += 0.5;
            this.center.y += 0.5;
            this.scaleFactor = this.calculatedScaleFactor ? this.calculatedScaleFactor : 1;
            this.scale = 1;
            this.zoom = this.scale * this.scaleFactor;  
        },

        calcFieldColors(){
            const fields = {};
            let colorIndex = 0;
            for(const [key, value] of Object.entries(this.datasetsObj[this.activeDataset]["metadata"])){
                fields[key] = {};
                for(var i=0; i<value.length; i++){
                    const labelName = this.labelNameFromIndex(key, value[i]);
                    fields[key][labelName] = {
                        idx: i.toString(),
                        color: this.colorScaleIndex(colorIndex)
                    }
                    colorIndex++;
                }
            }

            Vue.set(this.datasetsObj[this.activeDataset], "metadata_colors", fields);
            console.log('colors', fields);
        },

        calcCellCounts(){
            const counts = {};
            Object.entries(this.datasetsObj[this.activeDataset]["metadata"]).forEach(([key, value]) => {
                counts[key] = {};
                for(var i=0; i<value.length; i++){
                    const labelName = this.labelNameFromIndex(key, value[i]);
                    if(labelName === undefined) {
                        console.log('undefined', key, value[i])
                        continue;
                    }
                    if(!counts[key][labelName]){
                        counts[key][labelName] = {
                            count: 1,
                            pct: 0
                        }
                    }else{
                        counts[key][labelName].count++;
                    }
                }
                
            });
            Object.keys(counts).forEach(key => {
                const totalCounts = {};
                totalCounts[key] = Object.values(counts[key]).reduce((acc, curr) => acc + curr.count, 0);
                Object.keys(counts[key]).forEach(valueName => {
                    counts[key][valueName].pct = ((counts[key][valueName].count / totalCounts[key]) * 100).toFixed(2);
                });
            });

            Vue.set(this.datasetsObj[this.activeDataset], "metadata_counts", counts);
            console.log('counts', counts);
        },

        calcGeneExpression(gene){
            const expression = {};

            for(var i=0; i<this.datasetsObj[this.activeDataset]["genes"][gene]["raw"].length; i++){
                const value = this.datasetsObj[this.activeDataset]["genes"][gene]["raw"][i];
                const fieldIndex = this.datasetsObj[this.activeDataset]["metadata"][this.activeField][i];
                const labelName = this.labelNameFromIndex(this.activeField, fieldIndex);
                if(!expression[labelName]) {
                    expression[labelName] = {
                        count: 1,
                        exp: value > 0 ? 1 : 0,
                        expList: [value],
                        sum: value,
                        mean: 0,
                        meanNorm: 0,
                        pct: 0,
                        color: null
                    };
                }else{
                    expression[labelName].count++;
                    expression[labelName].sum += value;
                    expression[labelName].exp += value>0 ? 1 : 0;
                    expression[labelName].expList.push(value);
                }
            }
            Object.keys(expression).forEach(key => {
                expression[key].mean = (expression[key].sum / expression[key].count);
                expression[key].meanNorm = 1 - (expression[key].mean / 3);
                expression[key].pct = (expression[key].exp / expression[key].count);
                expression[key].color = this.colorScalePlasma(expression[key].meanNorm);
            });

            Vue.set(this.datasetsObj[this.activeDataset]["genes"][gene], "processed", expression);
            
            console.log('parsed expression', expression);

            this.compareGene = gene;

            if(this.compareField) this.calcCompareGeneExpression(gene);
        },

        calcCompareCellCounts(){
            const compareSet = {};
            for(var i=0; i<this.datasetsObj[this.activeDataset]["metadata"][this.activeField].length; i++){
                const fieldAname = this.labelNameFromIndex(this.activeField, this.datasetsObj[this.activeDataset]["metadata"][this.activeField][i]);
                const fieldBname = this.labelNameFromIndex(this.compareField, this.datasetsObj[this.activeDataset]["metadata"][this.compareField][i]);
                if(fieldAname === undefined || fieldBname === undefined) continue;
                if(!compareSet[fieldAname]) compareSet[fieldAname] = {};
                if (!compareSet[fieldAname][fieldBname]) {
                    compareSet[fieldAname][fieldBname] = {
                        count: 1,
                        pct: 0
                    }
                } else {
                    compareSet[fieldAname][fieldBname].count++;
                }
            }
            // Calculate pct for each pair of fieldAname and fieldBname
            Object.keys(compareSet).forEach(fieldAname => {
                Object.keys(compareSet[fieldAname]).forEach(fieldBname => {
                    const count = compareSet[fieldAname][fieldBname].count;
                    const totalCount = this.datasetsObj[this.activeDataset]["metadata_counts"][this.activeField][fieldAname].count;
                    compareSet[fieldAname][fieldBname].pct = ((count / totalCount) * 100).toFixed(2);
                });
            });
            this.compareSet = compareSet;
            console.log('compareSet', compareSet);

            if(this.compareGene) this.calcCompareGeneExpression(this.compareGene);
        },

        calcCompareGeneExpression(gene){
            const compareSet = {};
            for(var i=0; i<this.datasetsObj[this.activeDataset]["genes"][gene]["raw"].length; i++){
                const fieldAname = this.labelNameFromIndex(this.activeField, this.datasetsObj[this.activeDataset]["metadata"][this.activeField][i]);
                const fieldBname = this.labelNameFromIndex(this.compareField, this.datasetsObj[this.activeDataset]["metadata"][this.compareField][i]);
                if(fieldAname === undefined || fieldBname === undefined) continue;
                const value = this.datasetsObj[this.activeDataset]["genes"][gene]["raw"][i];
                if(!compareSet[fieldAname]) compareSet[fieldAname] = {};
                if (!compareSet[fieldAname][fieldBname]) {
                    compareSet[fieldAname][fieldBname] = {
                        count: 1,
                        exp: value > 0 ? 1 : 0,
                        expList: [value],
                        sum: value,
                        mean: 0,
                        meanNorm: 0,
                        pct: 0,
                        color: null
                    }
                } else {
                    compareSet[fieldAname][fieldBname].count++;
                    compareSet[fieldAname][fieldBname].sum += value;
                    compareSet[fieldAname][fieldBname].exp += value>0 ? 1 : 0;
                    compareSet[fieldAname][fieldBname].expList.push(value);
                }
            };
            Object.keys(compareSet).forEach(fieldAname => {
                Object.keys(compareSet[fieldAname]).forEach(fieldBname => {
                    const field = compareSet[fieldAname][fieldBname];
                    field.mean = field.sum / field.count;
                    field.meanNorm = 1 - (field.mean / 3);
                    field.pct = (field.exp / field.count);
                    field.color = this.colorScalePlasma(field.meanNorm);
                    
                });
            });

            this.compareGeneSet = compareSet;
            console.log('geneCompareSet', compareSet);

            this.calcDiffGeneExpression(gene);
        },

        calcDiffGeneExpression(gene){
            const compareSet = {};
            //collect all unique keys in comparison field
            //sometime some are missing, so we cant rely on a single sample
            const uniqueFields = this.getUniqueKeysAtDepth(this.compareGeneSet, 2);
            //uniqueFields.sort();
            //create combos for all comparison fields
            const uniqueCombos = this.generateUniqueCombinationsObject(uniqueFields);
            //this.colorScaleRedBlue.domain([-1, 1]);
            const effectSizes = [];
            console.log('uniqueFields', uniqueFields);
            console.log('uniqueCombos', uniqueCombos);

            //loop through main field (eg. cell types)
            for(const [key, value] of Object.entries(this.compareGeneSet)){
                //save field as key
                if(!compareSet[key]) compareSet[key] = {};
                //loop through each unique comparion field combo
                for(const [key2, value2] of Object.entries(uniqueCombos)){
                    //if this compare field has other that need comparing
                    if(value2.length>0){
                        //loop through them
                        value2.forEach(val => {
                            //if compare value doesnt exist in the data, skip it
                            if(!this.compareGeneSet[key][val]) return;
                            //comparison fields as key
                            const v = `${key2} x ${val}`;
                            //calculate
                            if(!compareSet[key][v]){
                                //perform a ttest
                                compareSet[key][v] = ttest2(
                                    this.compareGeneSet[key][key2].expList,
                                    this.compareGeneSet[key][val].expList
                                )
                                //calc standard deviation
                                compareSet[key][v].standardDeviation = this.calculateStandardDeviation(this.compareGeneSet[key][val].expList);
                                //calc effect size
                                compareSet[key][v].effectSize = compareSet[key][v].xmean - compareSet[key][v].ymean / compareSet[key][v].standardDeviation;
                                //get color from effect size
                                compareSet[key][v].effectSizeColor = this.colorScaleRedBlue(compareSet[key][v].effectSize);
                                //save
                                effectSizes.push(compareSet[key][v].effectSize);
                            }
                        })
                        
                    }
                }
            }
            console.log('calcDiffGeneExpression', compareSet)

            this.compareDiffGeneSet = compareSet;
        },

        calculateStandardDeviation(data) {
            const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
            const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
            const standardDeviation = Math.sqrt(variance);
            return standardDeviation;
        },

        getUniqueKeysAtDepth(obj, depth) {
            const keys = new Set();
            
            // Function to recursively traverse the object
            function traverse(obj, currentDepth) {
                if (currentDepth === depth) {
                    // If the desired depth is reached, collect keys
                    Object.keys(obj).forEach(key => {
                        keys.add(key);
                    });
                } else if (currentDepth < depth) {
                    // If the desired depth is not reached, continue traversal
                    Object.values(obj).forEach(value => {
                        if (typeof value === 'object' && value !== null) {
                            traverse(value, currentDepth + 1);
                        }
                });
                }
            }
            
            // Start traversal from the top-level object
            traverse(obj, 1);
            
            // Return an array of unique keys
            return Array.from(keys);
        },

        generateUniqueCombinationsObject(arr) {
            const combinations = {};
            
            // Loop through each element in the array
            for (let i = 0; i < arr.length; i++) {
                // Initialize the array for the current key
                combinations[arr[i]] = [];
            
                // Loop through the subsequent elements
                for (let j = i + 1; j < arr.length; j++) {
                    // Add the subsequent element to the array for the current key
                    combinations[arr[i]].push(arr[j]);
                }
            }
            
            return combinations;
        },

        labelNameFromIndex(key, idx){
            return this.datasetsObj[this.activeDataset]["metadata_labels"][key][idx];
        },

        formatXstring(string) {
            // Split the input string into individual ranges
            const ranges = string.split(' x ');
            
            // Join the ranges with <br> tags
            const formattedString = ranges.join('<br>');
            
            return formattedString;
        },

        //(unused)
        scaleElementByPvalue(pValue) {
            // Define the scaling parameters
            const baseScale = 1; // Original scale of the element
            const minScale = 0.1; // Minimum scale when p-value is high
            const maxPValue = 0.05; // Maximum p-value for intermediate scaling
            const scaleFactor = 1 / (1 + Math.exp(10 * (pValue - maxPValue))); // Exponential scaling function
          
            // Calculate the scaled value within the range [minScale, baseScale]
            const scaledValue = minScale + (baseScale - minScale) * scaleFactor;

            return scaledValue;
          
            // Apply the scaled value to the element's scale transformation
            element.style.transform = `scale(${scaledValue})`;
        },

        selectCellCount(e){
            console.log('setting cell count type: ', this.cellCountOptions[e.target.value]);
            this.cellCountOption = parseInt(e.target.value);
        },

        toggleCellCount(){
            this.cellCountOption = this.cellCountOption === 0 ? 1 : 0;
        },

        tableClickHandler(e){
            if(!this.lockedHover){
                this.lockedHover = true;
            }else{
                this.unlockHover(e);
                e.target.dispatchEvent(new Event('mouseover'));
            }
        },
        unlockHover(e){
            this.lockedHover = false;
            document.querySelector(`[data-a-field]`).dispatchEvent(new Event('mouseout'));
        },

        tableHoverOverHandler(e){
            if(this.lockedHover) {
                document.querySelector('.select-lock path').style.fill = 'red';
                return;
            }

            const aField = e.target.dataset.aField;
            const bField = e.target.dataset.bField;
            const bGene = e.target.dataset.bGene;
            const bDiff = e.target.dataset.bDiff;
            this.dimmedElements = [];
            //console.log(aField, bField, bGene, bDiff); 
            //dim static elements
            document.querySelectorAll(`.data-table .dim-hover`).forEach(el => {
                el.classList.add('dim-table-item');
            });
            //dim unmatched elements
            if(aField && bField){
                //have both A and B, but not this A and B
                document.querySelectorAll(`.data-table [data-a-field]:not([data-a-field="${aField}"])[data-b-field]:not([data-b-field="${bField}"])`).forEach(el => {
                    this.dimmedElements.push(el);
                    el.classList.add('dim-table-item');
                });
                //have A and its not this A, doesnt have B 
                document.querySelectorAll(`.data-table [data-a-field]:not([data-a-field="${aField}"]):not([data-b-field])`).forEach(el => {
                    this.dimmedElements.push(el);
                    el.classList.add('dim-table-item');
                });
                //have B and its not this B, doesnt have A 
                document.querySelectorAll(`.data-table [data-b-field]:not([data-b-field="${bField}"]):not([data-a-field])`).forEach(el => {
                    this.dimmedElements.push(el);
                    el.classList.add('dim-table-item');
                });
                //have both A and B, this A and B
                document.querySelectorAll(`.data-table [data-a-field][data-a-field="${aField}"][data-b-field][data-b-field="${bField}"]`).forEach(el => {
                    el.classList.add('outline-table-item');
                });
            }else if(!bField){
                document.querySelectorAll(`.data-table [data-a-field]:not([data-a-field="${aField}"])`).forEach(el => {
                    this.dimmedElements.push(el);
                    el.classList.add('dim-table-item');
                });
                document.querySelectorAll(`.data-table [data-b-field]:not([data-a-field])`).forEach(el => {
                    this.dimmedElements.push(el);
                    el.classList.add('dim-table-item');
                });
            }else{
                document.querySelectorAll(`.data-table [data-b-field]:not([data-b-field="${bField}"])`).forEach(el => {
                    this.dimmedElements.push(el);
                    el.classList.add('dim-table-item');
                });
                document.querySelectorAll(`.data-table [data-a-field]:not([data-b-field])`).forEach(el => {
                    this.dimmedElements.push(el);
                    el.classList.add('dim-table-item');
                });
            }

            if(aField || bField){
                const hoverInfo = {
                    cluster: {},
                    condition: {},
                    cell: {},
                    gene: {},
                    diff: {},
                    text: null
                };
                if(aField){
                    const cellCount = this.datasetsObj[this.activeDataset]["metadata_counts"][this.activeField][aField]["count"];
                    const cellPct = this.datasetsObj[this.activeDataset]["metadata_counts"][this.activeField][aField]["pct"];
                    hoverInfo.cluster = {
                        name: aField,
                        cellCount: cellCount,
                        cellPct: cellPct,
                        color: this.datasetsObj[this.activeDataset]["metadata_colors"][this.activeField][aField]["color"],
                        text: `This cluster consists of <span class="num bold">${cellCount.toLocaleString()}</span> <span class="num bold">${aField}</span> cells, representing <span class="num bold">${cellPct}%</span> of all cells in this dataset.`
                    }
                    if(!bField) this.highlightClusterInUmap(aField, null);
                }
                if(aField && bField){
                    if(!bGene){
                        //console.log("not gene")
                        if(!bDiff){
                            //console.log("not diff");

                            hoverInfo.condition = {
                                type: this.compareField,
                                name: bField,
                                cellCount: this.compareSet[aField][bField]["count"],
                                cellPct: this.compareSet[aField][bField]["pct"],
                                color: this.datasetsObj[this.activeDataset]["metadata_colors"][this.compareField][bField]["color"],
                                text: `The <span class="num bold">${aField}</span> cluster contains <span class="num bold">${this.compareSet[aField][bField]["count"].toLocaleString()}</span> cells with the <span class="num bold">${bField}</span> <span class="num bold">${this.labelFromAnnotation(this.compareField)}</span> condition. Representing <span class="num bold">${this.compareSet[aField][bField]["pct"]}%</span> of cells in this cluster.`
                            }
                            //
                            this.highlightClusterInUmap(aField, bField);
                        }else{
                            //console.log("diff")
                            hoverInfo.diff = {
                                name: `${this.activeGene} (${bField})`,
                                pValue: this.compareDiffGeneSet[aField][bField]["pValue"],
                                effectSize: this.compareDiffGeneSet[aField][bField]["effectSize"]
                            }
                        }
                    }else{
                        //console.log("gene")
                        if(bGene === bField){
                            hoverInfo.gene = {
                                name: bGene,
                                expMean: this.datasetsObj[this.activeDataset]['genes'][bGene]["processed"][aField]["mean"],
                                expPct: this.datasetsObj[this.activeDataset]['genes'][bGene]["processed"][aField]["pct"],
                                cellsExp: this.datasetsObj[this.activeDataset]['genes'][bGene]["processed"][aField]["exp"]
                            }
                        }else{
                            hoverInfo.gene = {
                                name: `${bGene} (${bField})`,
                                expMean: this.compareGeneSet[aField][bField]["mean"],
                                expPct: this.compareGeneSet[aField][bField]["pct"],
                                cellsExp: this.compareGeneSet[aField][bField]["exp"]
                            }
                        }
                    }
                    
                }else if(bField){
                    if(!bGene){
                        if(!bDiff){
                            const cellCount = this.datasetsObj[this.activeDataset]["metadata_counts"][this.compareField][bField]["count"];
                            const cellPct = this.datasetsObj[this.activeDataset]["metadata_counts"][this.compareField][bField]["pct"];
                            hoverInfo.condition = {
                                type: this.compareField,
                                name: bField,
                                cellCount: cellCount,
                                cellPct: cellPct,
                                color: this.datasetsObj[this.activeDataset]["metadata_colors"][this.compareField][bField]["color"],
                                text: `This cluster consists of <span class="num bold">${cellCount.toLocaleString()}</span> cells with the <span class="num bold">${bField}</span> <span class="num bold">${this.labelFromAnnotation(this.compareField)}</span> condition. Representing <span class="num bold">${cellPct}%</span> of all cells in this dataset.`
                            }
                            this.highlightClusterInUmap(null, bField);
                        }
                    }
                    
                }
                this.hoverInfo = hoverInfo;
            }
        },
        tableHoverOutHandler(e){
            if(this.lockedHover) {
                document.querySelector('.select-lock path').style.fill = 'black';
                return;
            }

            if(this.dimmedElements){
                this.dimmedElements.forEach(el => {
                    el.classList.remove('dim-table-item');
                })
            }
            document.querySelectorAll('.data-table .outline-table-item').forEach(el => { 
                el.classList.remove('outline-table-item');
            });
            this.hoverInfo = null;
            this.highlightClusterInUmap();
        },

        labelFromAnnotation(annotation){
            let clipDoubleUnderscore = annotation.replace(/__.*$/, ''); //clip after, including double underscore
            return clipDoubleUnderscore.replace('_', ' '); //underscores to spaces
        },

        highlightClusterInUmap(aField=null, bField=null){
            //console.log(aField, bField);
            if(aField && bField){
                document.querySelector('.umap-wrapper').classList.add('dim');
                document.querySelectorAll(`.umap-wrapper .umap[data-a-field="${aField}"]`).forEach(el => {
                    el.classList.add('highlight', 'over')
                })
                document.querySelectorAll(`.umap-wrapper .umap[data-b-field="${bField}"]`).forEach(el => {
                    el.classList.add('highlight')
                })
            }
            if(aField && !bField){
                document.querySelector('.umap-wrapper').classList.add('dim');
                document.querySelectorAll(`.umap-wrapper .umap[data-a-field="${aField}"]:not([data-b-field])`).forEach(el => {
                    el.classList.add('highlight')
                })
            }
            if(!aField && bField){
                document.querySelector('.umap-wrapper').classList.add('dim');
                document.querySelectorAll(`.umap-wrapper .umap[data-b-field="${bField}"]:not([data-a-field])`).forEach(el => {
                    el.classList.add('highlight')
                })
            }
            if(!aField && !bField){
                document.querySelector('.umap-wrapper').classList.remove('dim');
                document.querySelectorAll(`.umap-wrapper .umap`).forEach(el => {
                    el.classList.remove('highlight', 'over')
                })
            }
        },

        htmlTableToObject(tableSelector) {
            const table = document.querySelector(tableSelector);
            const tableInfo = {
                maxColumns: 0,
                headRowCount: 0,
                bodyRowCount: 0,
                rows: []
              };
            
              // Analyze the table head
            const headRows = Array.from(table.querySelectorAll('thead tr'));
            tableInfo.headRowCount = headRows.length;
            headRows.forEach(row => {
                const cells = Array.from(row.querySelectorAll('th, td'));
                const rowInfo = { columnCount: 0, columnSpans: [], cellContents: [] };
                cells.forEach(cell => {
                    const colspan = parseInt(cell.getAttribute('colspan') || 1);
                    rowInfo.columnSpans.push(colspan);
                    rowInfo.columnCount += colspan;
                    rowInfo.cellContents.push(cell.textContent.trim());
                });
                tableInfo.maxColumns = Math.max(tableInfo.maxColumns, rowInfo.columnCount);
                tableInfo.rows.push(rowInfo);
            });

            // Analyze the table body
            const bodyRows = Array.from(table.querySelectorAll('tbody tr'));
            tableInfo.bodyRowCount = bodyRows.length;
            bodyRows.forEach(row => {
                const cells = Array.from(row.querySelectorAll('td'));
                const rowInfo = { columnCount: 0, columnSpans: [], cellContents: [] };
                cells.forEach(cell => {
                    const colspan = parseInt(cell.getAttribute('colspan') || 1);
                    rowInfo.columnSpans.push(colspan);
                    rowInfo.columnCount += colspan;
                    rowInfo.cellContents.push(cell.textContent.trim());
                });
                tableInfo.maxColumns = Math.max(tableInfo.maxColumns, rowInfo.columnCount);
                tableInfo.rows.push(rowInfo);
            });
            console.log('tableInfo', tableInfo);
            this.htmlTableObjectToCSV(tableInfo);
            return tableInfo;
        },

        htmlTableObjectToCSV(tableData) {
            let csvContent = '';

            // Loop through each row
            tableData.rows.forEach(row => {
                let rowData = [];

                // Loop through each cell in the row
                for (let i = 0; i < row.columnCount; i++) {
                    // Check if the cell spans multiple columns
                    if (row.columnSpans && row.columnSpans[i] > 1) {
                        const centerCellInSpan = Math.floor(row.columnSpans[i]/2);
                        const filler = row.cellContents[i] ? '-' : '';
                        for (let j = 0; j < row.columnSpans[i]; j++) {
                            if(j===0){
                                // Add the content of the spanning cell to the first cell it spans
                                rowData.push(row.cellContents[i] || filler);
                            }else{
                                // Add empty cells for the remaining spanned columns
                                rowData.push(filler);
                            }
                        }
                    } else {
                        // If the cell does not span multiple columns, add its content
                        rowData.push(row.cellContents[i] || '');
                    }
                }

                // Join the row data with commas and add a new line
                csvContent += rowData.join(',') + '\n';
            });

            console.log('htmlTableObjectToCSV', csvContent);
            return csvContent;
        },

        calculateScaleFactor(canvas) {
            const paddingPct = 10;
            const pointsWidth = Math.abs(this.pointBounds.w) + Math.abs(this.pointBounds.e);
            const pointsHeight = Math.abs(this.pointBounds.n) + Math.abs(this.pointBounds.s);
            const scaleDiffWidth = canvas.width / pointsWidth;
            const scaleDiffHeight = canvas.height / pointsHeight;
            this.calculatedScaleFactor = Math.min(scaleDiffWidth, scaleDiffHeight) * ((100-paddingPct)/100);
            this.zoom = this.calculatedScaleFactor;
            this.pointsCenter = {
                x: this.center.x - scaleDiffWidth,
                y: this.center.y + scaleDiffHeight
            }
        },

        handleScroll(){
            this.fixedSidebar = window.scrollY>this.scrollThreshhold;
        },
        
    },
}).$mount("#app");
