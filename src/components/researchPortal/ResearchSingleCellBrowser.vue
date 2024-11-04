<template>
    <div style="display:flex; flex-direction: column; gap:10px;">
        <div v-if="!tissueDisplay" 
             style="color:red; margin:0 auto"
        >
            Please Select a Tissue
        </div>
        <div style="display:flex; flex-direction: column; gap:20px">
            <div v-if="tissueDisplay" class="summary-grid">
                <div style="display:flex; flex-direction:column; gap:5px;">
                    <div class="summary-item">
                        <div class="summary-title">Title</div>
                        <div>{{ this.data[0]["Name"] }}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-title">Authors</div>
                        <div>{{ this.data[0]["Authors"] || 'N/A' }}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-title">Summary</div>
                        <div>{{ this.data[0]["Summary"] }}</div>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:5px;">
                    <div class="summary-item">
                        <div class="summary-title">Species</div>
                        <div>{{ this.data[0]["Species"] }}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-title">Tissue</div>
                        <div>{{ this.data[0]["Tissue"] }}</div>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:5px;">
                    <div class="summary-item">
                        <div class="summary-title">Source</div>
                        <div>{{ this.data[0]["Source"] }}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-title">Method</div>
                        <div>{{ this.data[0]["Method"] }}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-title">Platform</div>
                        <div>{{ this.data[0]["Platform"] }}</div>
                    </div>
                </div>
            </div>
            <div class="basics-grid">
                <div v-if="tissueDisplay" style="display:flex; flex-direction: column; width: min-content;">
                    <strong>{{ this.data?.length === 1 ? this.data[0]["Tissue"] : "" }}</strong>
                    <div style="display:flex; align-items: center; justify-content: center; width: 200px; height:400px; border:1px solid #ccc">
                        anatomogram
                    </div>
                </div>
                <div v-if="coordinates" style="display:flex; flex-direction: column; width: min-content;">
                    <div style="display:flex; justify-content: space-between;">
                        <strong>UMAP</strong> {{ coordinates.length.toLocaleString() }} cells
                    </div>
                    <research-umap-plot
                        title=""
                        :points="coordinates"
                        :colors="umapColors"
                        :cellLabels="cellLabels"
                        :cellLabelsMap="cellLabelsMap"

                        :highlightLabel="highlightLabel"
                        :width="400"
                        :labelSizePx="28"
                        :isLoading="isLoadingData"
                    />
                </div>
                <div v-if="colorByOptions" style="display:flex; flex-direction: column; align-self: flex-start;">
                    <strong>Annotations</strong>
                    <div style="display:flex; gap:5px;">
                        <div class="colorize-option active">
                            <svg viewBox="0 -0.5 17 17" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.333C3 13.463 5.427 16 8.418 16 11.41 16 14 13.463 14 10.333 14 7.204 8.418 0 8.418 0S3 7.204 3 10.333Z" fill="#434343"/></svg>
                        </div>
                        <select @change="selectColorBy" style="width: -webkit-fill-available;">
                            <option v-for="option of colorByOptions" :value="option['raw field']">
                                {{ option['field label'] }}
                            </option>
                        </select>
                    </div>
                    
                    <div style="margin-top:4px">
                        <div v-for="(color, label) of labelColors[colorByLabel]"
                            style="display:flex; gap:5px; align-items: center; flex-wrap: nowrap"
                            :style="`opacity:${highlightLabel!==''&&highlightLabel!==label?'0.25':'1'}`"
                            :data-label="label"
                            @mouseover="labelHover"
                            @mouseout="labelHoverOut"
                        >
                            <div class="colorize-option active">
                                <svg viewBox="0 -0.5 17 17" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.333C3 13.463 5.427 16 8.418 16 11.41 16 14 13.463 14 10.333 14 7.204 8.418 0 8.418 0S3 7.204 3 10.333Z" :fill="color"/></svg>
                            </div>
                            <!--<div :style="`width:10px; height:21px; background:${color}; pointer-events:none;`"></div>-->
                            <div style="pointer-events: none; white-space: nowrap;">{{ label }}</div>
                        </div>
                    </div>
                </div>
                <div v-if="cellTypeInfo" style="display:flex; flex-direction: column; align-self: flex-start;">
                    <strong>Gene Search</strong>
                    <div style="display:flex; gap:5px;">
                        <div class="colorize-option">
                            <svg viewBox="0 -0.5 17 17" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.333C3 13.463 5.427 16 8.418 16 11.41 16 14 13.463 14 10.333 14 7.204 8.418 0 8.418 0S3 7.204 3 10.333Z" fill="#434343"/></svg>
                        </div>
                        <input type="text" placeholder="Gene name" @keyup.enter="searchGene"/>
                        <button @click="searchGene">
                            <svg style="width: 20px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000"><path fill-rule="evenodd" clip-rule="evenodd" d="M15 10.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm-.82 4.74a6 6 0 1 1 1.06-1.06l4.79 4.79-1.06 1.06-4.79-4.79Z" fill="#080341"/></svg>
                        </button>
                    </div>
                    <div v-if="expressionStats.length>0" style="margin-top:4px">
                        <div  v-for="gene in Object.keys(expressionStats[0])" style="display:flex; flex-direction: column;">
                            <div style="display:flex; gap: 5px;">
                                <div class="colorize-option">
                                    <svg viewBox="0 -0.5 17 17" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.333C3 13.463 5.427 16 8.418 16 11.41 16 14 13.463 14 10.333 14 7.204 8.418 0 8.418 0S3 7.204 3 10.333Z" fill="#434343"/></svg>
                                </div>
                                <div>{{ gene }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="counts-grid">
                <div v-if="cellTypeInfo">
                    <strong>Cell Composition</strong>
                    <research-bar-plot-v2
                        :data="cellTypeInfo.data[cellTypeInfo.key]"
                        :categoryKey="cellTypeInfo.key"
                        totalKey="Total"
                        :colors="cellTypeInfo.colors"
                        orientation="horizontal"
                        :width="620"
                        :barWidth="21"
                        :margins="{top: 30, right: 10, bottom: 100, left: 80}"
                        :fitToSize="true"
                        :showBarLabels="true"
                        :showValues="true"
                        :highlightKey="highlightLabel"
                    />
                </div>
                <div v-if="expressionStats.length>0" style="display:flex; flex-direction: column;">
                    <strong>Gene Expression</strong>
                    <research-dot-plot v-for="(item, i) in expressionStats"
                        :data="item"
                        orientation="horizontal"
                        :width="620"
                        :fitToSize="true"
                        :cellWidth="30"
                        :showYLabels="true"
                        :showXLabels="true"
                        :positionXLabelsOnTop="false"
                        :positionYLabelsOnRight="false"
                        :marginBottom="50"
                        :marginLeft="-20"
                        :highlightKey="highlightLabel"
                    />
                </div>
            </div>
        </div>
    </div>
</template>
  
<script>
    import * as d3 from 'd3';
    import Vue from 'vue';
    import ResearchUmapPlot from "@/components/researchPortal/ResearchUmapPlot.vue";
    import ResearchBarPlotV2 from "@/components/researchPortal/ResearchBarPlotV2.vue";
    import ResearchDotPlot from "@/components/researchPortal/ResearchDotPlot.vue";

    const colors = ["#007bff","#048845","#8490C8","#BF61A5","#EE3124","#FCD700","#5555FF","#7aaa1c","#F88084","#9F78AC","#F5A4C7","#CEE6C1","#cccc00","#6FC7B6","#D5A768","#d4d4d4"]

    export default Vue.component('research-single-cell-browser', {
        components: {
            ResearchUmapPlot,
            ResearchBarPlotV2,
            ResearchDotPlot
        },
        props: {
            renderConfig: {
                type: Object,
                required: true,
            },
            utils: {
                type: Object,
                required: true
            },
            data: {
                type: Array,
                required: true
            }
        },
        data() {
            return {
                rawData: null,
                coordinates: null,

                colorScaleIndex: d3.scaleOrdinal(colors),
                colorScalePlasma: d3.scaleSequential(d3.interpolatePlasma),
                colorScalePlasmaColorsArray: [],
                colorIndex: 0,
                labelColors: null,
                colorByLabel: null,
                colorByOptions: null,

                umapColors: null,

                datasetName: null,
                cellTypeField: null,
                cellTypeInfo: null,

                geneNames: [],
                expressionData: {},
                expressionStats: [],

                preloadItem: '',
                tissueDisplay: '',
                highlightLabel: '',
                highlightHoverTimeout: null,
            }
        },
        watch: {
            data(){
                this.init();
            }
        },
        mounted() {
            //load metadata from renderConfig
            console.log('renderConfig', this.renderConfig);
            console.log('data', this.data);
            this.init();
        },
        computed: {
            cellLabels(){
                if(this.rawData && this.cellTypeField){
                    return this.rawData.metadata_labels[this.cellTypeField];
                }else{
                    return null;
                }
            },
            cellLabelsMap(){
                if(this.rawData && this.cellTypeField){
                    return this.rawData.metadata[this.cellTypeField];
                }else{
                    return null;
                }
            },
            isLoadingData(){
                if(this.preloadItem != ''){
                    return true;
                }else{
                    return false;
                }
            }
        },
        methods: {
            async init(){
                if(this.data.length !== 1){
                    console.log("please select a dataset");
                    return;
                }
                
                console.log(`loading dataset: ${this.data[0].datasetId}`);
                console.log('   data', this.data[0]);

                this.tissueDisplay = this.data[0]["Tissue"];
                this.datasetName = this.data[0]["Name"];

                this.preloadItem = 'fields';
                this.rawData = await this.fetchFields();

                this.preloadItem = 'coordinates';
                this.coordinates = await this.fetchCoordinates();

                this.preloadItem = false;

                //pre-calculate colors for fields in each category
                this.labelColors = this.calcLabelColors(this.rawData);
                this.colorScalePlasmaColorsArray = d3.range(0, 1.01, 0.1).map(t => this.colorScalePlasma(t)).join(', ');

                this.expressionStats = [];

                this.getColorByOptions();

                this.updateCellsInfo(this.cellTypeField);

                if(this.renderConfig["data fields"]?.["genes"]){
                    this.renderConfig["data fields"]["genes"].forEach(async (gene) => {
                        await this.fetchGeneExpression(gene.toUpperCase());
                    })
                }
            },
            getColorByOptions(){
                const dataFields = this.renderConfig["data fields"];

                if(dataFields["celltypes"]){
                    this.cellTypeField = dataFields["celltypes"][0]["raw field"];
                }

                const colorByOptions = [];
                for(const [key, value] of Object.entries(dataFields)){
                    colorByOptions.push(...value);
                }

                this.colorByOptions = colorByOptions;

                this.selectColorBy(this.cellTypeField);

            },
            updateDataUrl(url, paramaters){
                let updatedUrl = url;
                //tmp
                //updatedUrl = updatedUrl.replace(`$datasetId`, this.data[0]['Tissue'].toLowerCase());

                //use below once metadata is fixed
                paramaters.forEach(param => {
                    if(param !== 'gene')
                        updatedUrl = updatedUrl.replace(`$${param}`, this.data[0][param].toLowerCase().replaceAll(" ", "_"));
                })
                return updatedUrl;
            },
            async fetchFields() {
                console.log('getting fields');
                const fieldsDataPoint = this.renderConfig["data points"].find(x => x.role === "fields");
                const fieldsUrl = this.updateDataUrl(fieldsDataPoint.url, fieldsDataPoint.parameters);
                try {
                    const response = await fetch(fieldsUrl);
                    const rawData = await response.json();

                    console.log('   fields', rawData);
                    return rawData;
                } catch (error) {
                    console.error('Error fetching fields:', error);
                }
            },
            async fetchCoordinates() {
                console.log('getting coordinates');
                const coordinatesDataPoint = this.renderConfig["data points"].find(x => x.role === "coordinates");
                const coordinatesUrl = this.updateDataUrl(coordinatesDataPoint.url, coordinatesDataPoint.parameters);
                try {
                    const response = await fetch(coordinatesUrl);
                    const json = this.utils.dataConvert.tsv2Json(await response.text());
                    console.log('   coordinates', json);
                    return json;
                }catch (error){
                    console.error('Error fetching coordinates:', error);
                }
            },
            async fetchGeneExpression(gene){
                console.log('fetchGeneExpression', gene);
                const expressionDataPoint = this.renderConfig["data points"].find(x => x.role === "expression");
                const expressionUrl = this.updateDataUrl(expressionDataPoint.url, expressionDataPoint.parameters);
                //this.isLoading = true;
                await Vue.nextTick();
                try{
                    const response = await fetch(expressionUrl+','+gene);
                    const json = await response.json();
                    const expression = json.data[0]['expression'];
                    this.geneNames.push(gene);
                    this.expressionData[gene] = expression;
                    console.log('   ', expression);

                    //this.isLoading = false;
                    await Vue.nextTick();

                    //this.parseGeneExpression();
                    if(this.datasetSettings){
                        //const geneStats = await this.getGeneExpression(this.expressionData[gene], this.datasetSettings.selectedCellType);
                        //this.expressionStats.push({[gene]:geneStats});
                    }else{
                        this.expressionStats = this.parseGeneExpression(this.cellTypeField);
                        //this.expressionStats.push(geneStats);
                        console.log('expressionStats', this.expressionStats);
                    }
                    if(!this.activeGene || this.activeGene===''){
                        this.activeGene = gene;
                    }
                }catch(error){
                    console.error('   Error fetching gene expression', error);
                }
            },
            selectColorBy(e){
                const val = typeof e === 'object' ? e.target.value : e;
                console.log(val);
                this.colorByLabel = val;
                this.umapColors = this.getColorsByLabel(this.colorByLabel);
                this.updateCellsInfo(this.colorByLabel);
            },
            calcLabelColors(rawData){
                const colors = {};
                for(const [key, value] of Object.entries(rawData["metadata_labels"])){
                    colors[key] = {};
                    for(var i=0; i<value.length; i++){
                        colors[key][value[i]] = this.colorScaleIndex(this.colorIndex)
                        this.colorIndex++;
                    }
                }
                console.log('labelColors', colors);
                return colors;
            },
            getColorsByLabel(category, subset=null){
                const pointColors = [];
                console.log('getColorsByLabel', category, subset)
                for (let i = 0; i < this.rawData.NAME.length; i++) {
                    const labelIdx = this.rawData.metadata[category][i];
                    const label = this.rawData.metadata_labels[category][labelIdx];
                    if(!subset || (subset && subset.includes(label)))
                        pointColors[i] = this.labelColors[category][label];
                }
                //console.log(pointColors);
                return pointColors;
            },
            labelHover(e){
                clearTimeout(this.highlightHoverTimeout);
                const label = e.target.dataset.label;
                this.highlightLabel = label;
            },
            labelHoverOut(e){
                this.highlightHoverTimeout = setTimeout(() => {
                    this.highlightLabel = '';
                }, 50);
                
            },

            /*
                cell composition
            */
            async updateCellsInfo(cellTypeCategory, conditionA, conditionB){
                //cell types
                const parsedData = this.parseRawDataByCategory(this.rawData, [cellTypeCategory, conditionA, conditionB]);
                const counts = this.getCounts(parsedData, [cellTypeCategory]);
                this.cellTypeInfo = {
                    key: cellTypeCategory, 
                    data: counts,
                    colors: Object.values(this.labelColors[cellTypeCategory])
                };
                console.log("cellTypeInfo", this.cellTypeInfo);

                return;
            },
            parseRawDataByCategory(rawData, categoryKeys){
                console.log('parseRawDataByCategory', categoryKeys);

                const { NAME, metadata, metadata_labels } = rawData;
                const parsedData = [];
            
                //process data based on user selected categories
                for (let i = 0; i < NAME.length; i++) {
                    const record = {};
                    for (const n in categoryKeys) {
                        const category = categoryKeys[n];
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
            getCounts(parsedData, categoryKeys, uniqueKey=null){
                console.log('getCounts', parsedData, categoryKeys, uniqueKey);
                //get counts from parsed data by keys
                const calculateCounts = (data, keys) => {
                    return keys.reduce((acc, key) => {
                        console.log('   key', key);
                        acc[key] = data.reduce((acc, row) => {
                            acc[row[key]] = (acc[row[key]] || 0) + 1;
                            return acc;
                        }, {});
                        return acc;
                    }, {});
                };
                const counts = calculateCounts(parsedData, categoryKeys);
                console.log('   total counts', counts);
                return counts;
            },  
            
            /*
                gene expression
            */
            searchGene(e){
                const parts = e.target.value.split(/[,\s]+/);
                e.target.value = '';
                //TODO: should be a queue
                parts.forEach(async (gene) => {
                    await this.fetchGeneExpression(gene.toUpperCase());
                })
            },
            parseGeneExpression(category){
                //const categories = side==='left'?this.categoriesLeft:this.categoriesRight;

                console.log('parseGeneExpression');

                // Get expressinon values for user selected categories
                const expressionByCategory = (category) => {
                    const categoryLabels = this.rawData['metadata_labels'][category];//.slice().sort((a, b) => a.localeCompare(b));
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
                        geneExpression[gene] = geneExpression[gene];//this.sortObjectKeysLocale(geneExpression[gene]);

                        categoryLabels.forEach(label => {
                            //const sortedValues = geneExpression[gene][label] ? geneExpression[gene][label].sort(d3.descending) : [0];
                            const sortedValues = geneExpression[gene][label] ? geneExpression[gene][label] : [0];
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

                    return sumstat;
                }

                const e = expressionByCategory(category);

                console.log('eeeeeeee', e)

                return [e];

                /*
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
                */
            }
        },
    });
</script>

<style scoped>
select {
    background: white;
    font-size: 14px;
}
button {
    border: 1px solid rgba(0, 0, 0, .25);
    background: white;
    color: #4e4e4e;
    padding: 1px 3px;
    font-size: 14px !important;
}
button:hover {
    border: 1px solid rgba(0, 0, 0, .5);
}
.colorize-option{
    cursor:pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    svg{
        width:14px;
    }
    path{
        /*fill:transparent;*/
        opacity: .25;
        /*stroke:#434343;*/
    }
}
.colorize-option.active{
    path{
        /*fill:#434343;*/
        opacity: 1;
    }
}
.summary-grid{
    display: grid;
    grid-template-columns: 620px repeat(2, 1fr);
    grid-template-rows: 1fr;
    grid-column-gap: 20px;
    grid-row-gap: 0px;
}
.summary-title{
    font-weight: bold;
}
.basics-grid{
    display: grid;
    grid-template-columns: 200px 400px repeat(2, 1fr);
    grid-template-rows: 1fr;
    grid-column-gap: 20px;
    grid-row-gap: 0px;
}
.counts-grid{
    display: grid;
    grid-template-columns: repeat(2, 620px);
    grid-template-rows: 1fr;
    grid-column-gap: 20px;
    grid-row-gap: 0px;
}
</style>
  