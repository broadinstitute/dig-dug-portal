<template>
    <div style="display:flex; flex-direction: column; gap:10px;">
        <div v-if="!tissueDisplay" 
             style="color:red; margin:0 auto"
        >
            Please Select a Tissue
        </div>

        <div style="display:flex; gap:10px;">
            <div style="display:flex; flex-direction: column;">
                <research-umap-plot
                    :title="datasetName"
                    :points="coordinates"
                    :colors="umapColors"
                    :cellLabels="cellLabels"
                    :cellLabelsMap="cellLabelsMap"

                    :highlightLabel="highlightLabel"
                    :width="umapSize"
                    :labelSizePx="28"
                    :isLoading="isLoadingData"
                />
            </div>
            <div v-if="colorByOptions"
                 style="display:flex; flex-direction: column;"
            >
                <div>Color By</div>
                <select @change="selectColorBy">
                    <option v-for="option of colorByOptions" :value="option['raw field']">
                        {{ option['field label'] }}
                    </option>
                </select>
                <div>
                    <div v-for="(color, label) of labelColors[colorByLabel]"
                        style="display:flex; gap:5px; align-items: center;"
                        :data-label="label"
                        @mouseover="labelHover"
                    >
                        <div :style="`width:10px; height:10px; background:${color}; pointer-events:none`"></div><div style="pointer-events: none;">{{ label }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
  
<script>
    import * as d3 from 'd3';
    import Vue from 'vue';
    import ResearchUmapPlot from "@/components/researchPortal/ResearchUmapPlot.vue";

    const colors = ["#007bff","#048845","#8490C8","#BF61A5","#EE3124","#FCD700","#5555FF","#7aaa1c","#F88084","#9F78AC","#F5A4C7","#CEE6C1","#cccc00","#6FC7B6","#D5A768","#d4d4d4"]

    export default Vue.component('research-single-cell-browser', {
        components: {
            ResearchUmapPlot
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

                umapSize: 500,
                umapColors: null,

                datasetName: null,
                cellTypeField: null,

                preloadItem: '',
                tissueDisplay: '',
                highlightLabel: ''
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

                this.tissueDisplay = this.data[0]["Tissue"];
                this.datasetName = this.data[0]["Name"];

                this.preloadItem = 'fields';
                this.rawData = await this.fetchFields();

                this.preloadItem = 'coordinates';
                this.coordinates = await this.fetchCoordinates();

                this.preloadItem = false;

                //pre-calculate colors for fields in each category
                this.labelColors = this.calcLabelColors(this.rawData);
                this.colorScalePlasmaColorsArray = d3.range(0, 1.01, 0.1).map(t => this.colorScalePlasma(t)).join(', ')

                this.getColorByOptions();
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
                updatedUrl = updatedUrl.replace(`$datasetId`, this.data[0]['Tissue'].toLowerCase());

                //use below once metadata is fixed
                /*paramaters.forEach(param => {
                    updatedUrl = updatedUrl.replace(`$${param}`, this.data[0][param]);
                })*/
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
                const fieldsDataPoint = this.renderConfig["data points"].find(x => x.role === "coordinates");
                const coordinatesUrl = this.updateDataUrl(fieldsDataPoint.url, fieldsDataPoint.parameters);
                try {
                    const response = await fetch(coordinatesUrl);
                    const json = this.utils.dataConvert.tsv2Json(await response.text());
                    console.log('   coordinates', json);
                    return json;
                }catch (error){
                    console.error('Error fetching coordinates:', error);
                }
            },
            selectColorBy(e){
                const val = typeof e === 'object' ? e.target.value : e;
                console.log(val);
                this.colorByLabel = val;
                this.umapColors = this.getColorsByLabel(this.colorByLabel);
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
                //console.log('labelColors', colors);
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
                const label = e.target.dataset.label;
                this.highlightLabel = label;
            }
        },
    });
</script>

<style scoped>
select {
    background: white;
    font-size: 14px;
}
</style>
  