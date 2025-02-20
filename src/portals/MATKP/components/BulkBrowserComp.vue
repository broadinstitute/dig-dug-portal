<template>
  <div style="display:flex; flex-direction: column; gap:10px; ">
      <div v-if="!datasetId" style="color:red; margin:0 auto">
          Please Select a Dataset
      </div>
      <div v-if="datasetId && !dataLoaded" style="margin: 0 auto">
          Loading {{ preloadItem }}...
      </div>

      <div v-if="dataLoaded" style="display:flex; flex-direction: column; gap:20px; width: 100%;">
          <!-- layout 0 -->
          <div v-if="layout===0 || layout===2" style="display:flex; flex-direction:column; gap:20px; align-self:center; background:#f8f8f8; padding:20px;">
              <research-single-cell-info 
                  :data="metadata"
              />
              <div v-if="dataReady" class="" style="display:flex; gap:20px">
                  <!--left tab group-->
                  <div class="tabs-group">
                      <div class="tabs-wrapper">
                          <div class="tab" >
                              Cell Composition
                          </div>
                      </div>
                      <div class="tabs-section-wrapper">
                          <div class="tab-section" style="display:flex; flex-direction: column; gap:20px; background:white; padding:20px;">
                              <div class="" style="display:flex; gap:20px;">
                                  <div v-if="coordinates" style="display:flex; flex-direction: column; width: min-content;">
                                      <div style="display:flex; justify-content: space-between; align-items: baseline;">
                                          <strong style="font-size: 16px; margin: 0 0 5px;">UMAP</strong> {{ metadata.totalCells.toLocaleString() }} cells
                                      </div>
                                      <research-umap-plot-gl 
                                          :group="datasetId"
                                          :points="coordinates"
                                          :labels="fields"
                                          :colors="labelColors"
                                          :cellTypeField="cellTypeField"
                                          :colorByField="cellCompositionVars.colorByField"
                                          :hoverFields="[]"
                                          :highlightLabel="cellCompositionVars.highlightLabel"
                                          :highlightLabels="cellCompositionVars.highlightLabels"
                                          :width="400"
                                          :height="400"
                                      />
                                  </div>
                                  <div v-if="fieldsDisplayList" style="display:flex; flex-direction: column; align-self: flex-start; width:200px; height:400px">
                                      <strong style="font-size: 16px; margin: 0 0 5px;">Color By</strong>
                                      <research-single-cell-selector 
                                          :data="fields['metadata_labels']"
                                          :selectedField="cellCompositionVars.colorByField"
                                          layout="dropdown-list"
                                          :colors="labelColors"
                                          @on-update="handleSelectorUpdate($event)"
                                          @on-hover="handleSelectorHover($event)"
                                      />
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div class="tabs-group">
                      <div class="tabs-wrapper">
                          <div class="tab">
                              Gene Expression
                          </div>
                      </div>
                      <div class="tabs-section-wrapper">
                          <div class="tab-section" style="display:flex; flex-direction: column; gap:20px; background:white; padding:20px;">
                              <div class="" style="display:flex; gap:20px">
                                  <div v-if="coordinates" style="display:flex; flex-direction: column; width: min-content;">
                                      <div style="display:flex; justify-content: space-between; align-items: baseline;">
                                          <span style="font-size: 16px; margin: 0 0 5px;"><span style="font-weight: bold">UMAP</span> <span style="font-style: italic;">{{ geneExpressionVars.selectedGene ? `${geneExpressionVars.selectedGene}` : '' }}</span></span> {{ metadata.totalCells.toLocaleString() }} cells
                                      </div>
                                      <research-umap-plot-gl 
                                          :group="datasetId"
                                          :points="coordinates"
                                          :labels="fields"
                                          :colors="labelColors"
                                          :expression="expressionData[geneExpressionVars.selectedGene]"
                                          :cellTypeField="cellTypeField"
                                          :hoverFields="[]"
                                          :highlightLabel="cellCompositionVars.highlightLabel"
                                          :highlightLabels="cellCompositionVars.highlightLabels"
                                          :width="400"
                                          :height="400"
                                      />
                                  </div>


                                  <div style="display:flex; flex-direction: column; align-self: flex-start; width:200px">
                                      <strong style="font-size: 16px; margin: 0 0 5px;">Gene Search</strong>
                                      <div style="display:flex; flex-direction: column; height: 400px; gap:5px">
                                          <div style="display:flex; gap:5px;">
                                              <input type="text" placeholder="Gene name" @keyup.enter="searchGene(geneToSearch)" v-model="geneToSearch" style="width:100%; position:relative;"/>
                                              <button @click="searchGene(geneToSearch)">
                                                  <svg :style="`display:${!geneLoading?'block':'none'}`" style="width: 20px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000"><path fill-rule="evenodd" clip-rule="evenodd" d="M15 10.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm-.82 4.74a6 6 0 1 1 1.06-1.06l4.79 4.79-1.06 1.06-4.79-4.79Z" fill="#080341"/></svg>
                                                  <div :style="`display:${geneLoading?'block':'none'}`" class="geneLoader"></div>
                                              </button>
                                          </div>
                                          <div v-if="genesNotFound.length>0" style="display:flex; flex-direction:column; gap:1px; flex: 0 0 auto; max-height:100%; overflow-y: auto;">
                                              <div v-for="gene in genesNotFound" style="display:flex; gap:5px; width:100%; background:#ff4500; color:white">
                                                  <div style="display:flex; flex:1; align-items:center; padding:0 5px; font-size:12px;">{{gene}} not found.</div>
                                                  <div @click="clearGeneNotFound(gene)" style="width:28px; height: 28px; display:flex; align-items:center; justify-content: center; font-size:18px; line-height:18px; cursor:pointer">×</div>
                                              </div>
                                          </div>

                                          <research-single-cell-selector style="margin-top:4px; flex-grow:1; overflow-x: hidden; overflow-y: auto;"
                                              :data="sortedGeneNames"
                                              layout="list"
                                              listSelection="exclusive"
                                              :colors="null"
                                              :selectedField="geneExpressionVars.selectedGene"
                                              @on-update="geneClick($event.coloredLabels[0])"
                                          />
                                       
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
            </div>
      </div>
  </div>
</template>

<script>
  import * as d3 from 'd3';
  import Vue from 'vue';
  import keyParams from "@/utils/keyParams";
  import EventBus from "@/utils/eventBus"
  import * as scUtils from "@/components/researchPortal/singleCellBrowser/singleCellUtils.js"
  import ResearchUmapPlot from "@/components/researchPortal/singleCellBrowser/ResearchUmapPlot.vue";
  import ResearchUmapPlotGL from "@/components/researchPortal/singleCellBrowser/ResearchUmapPlotGL.vue";
  import ResearchStackedBarPlot from "@/components/researchPortal/singleCellBrowser/ResearchStackedBarPlot.vue";
  import ResearchDotPlot from "@/components/researchPortal/singleCellBrowser/ResearchDotPlot.vue";
  import ResearchViolinPlot from "@/components/researchPortal/singleCellBrowser/ResearchViolinPlot.vue";
  import ResearchSingleCellSelector from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellSelector.vue";
  import ResearchSingleCellInfo from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellInfo.vue";

  const colors = ["#007bff","#048845","#8490C8","#BF61A5","#EE3124","#FCD700","#5555FF","#7aaa1c","#F88084","#9F78AC","#F5A4C7","#CEE6C1","#cccc00","#6FC7B6","#D5A768","#d4d4d4"]

  export default Vue.component('bulk-browser-comp', {
      components: {
          ResearchUmapPlot,
          ResearchUmapPlotGL,
          ResearchStackedBarPlot,
          ResearchDotPlot,
          ResearchViolinPlot,
          ResearchSingleCellSelector,
          ResearchSingleCellInfo
      },
      props: {
          sectionId: {
              type: String,
              required: false,
          },
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
              allMetadata: null, //raw metadata for all datasets
              metadata: null, //raw metadata for current dataset
              fields: null,   //raw fields
              coordinates: null,  //raw coordinates
              markers: null, //raw marker genes
              
              tableColumns: ["datasetName", "tissue", "method", "totalCells", { key: 'datasetId', label: 'View' }],

              componentsConfig: null,
              presetsConfig: null,

              showCellInfo: true,
              showCellProportion: true,
              showGeneExpression: true,
              showMarkerGenes: true,

              datasetId: null,
              cellTypeField: null,

              //colorIndex: 0,
              //colorScaleIndex: d3.scaleOrdinal(colors),
              colorscaleGreyBlue: d3.scaleLinear().domain([0, 1]).range(["lightgrey", "blue"]),
              colorScalePlasma: d3.scaleSequential(d3.interpolatePlasma),
              colorScalePlasmaColorsArray: [],
              colorScaleGreyBlueColorsArray: [],

              labelColors: null,
              fieldsDisplayList: null,

              geneNames: [], //list of loaded gene names
              sortedGeneNames: [],
              expressionData: {}, //obj, keys are gene names, values are arrays of raw expression per cell
              expressionStatsAll: [], //array of objects, each obj is gene, mean expr., pct. expressing
              geneToSearch: "",
              geneLoading: null,
              genesNotFound: [],

              markersList: null,
              markerGenes: null,
              markerGenesMaxMean: 3.0,

              geneLists: {
                  ["searched genes"]: [],
                  ["marker genes"]: []
              },

              dataLoaded: false,
              preloadItem: '',
              dataReady: false,

              highlightHoverTimeout: null,

              layout: -1,

              cellCompositionVars: {},
              geneExpressionVars: {}
          }
      },
      watch: {
          expressionData(){
              const expressionStats = [];
              Object.keys(this.expressionData).forEach(gene => {
                  expressionStats.push(...scUtils.calcExpressionStats(this.fields, this.labelColors, this.expressionData[gene], gene, this.cellTypeField, null, true))
              })
              this.expressionStatsAll = expressionStats;
              //console.log('updated expression stats', this.expressionStatsAll);
          },
          geneNames(){
              this.sortedGeneNames = [...this.geneNames].sort();
              this.geneLists["searched genes"] = this.geneNames;
          },
          markersList(){
              this.geneLists["marker genes"] = this.markersList;
          }
      },
      mounted() {
          console.log('renderConfig', this.renderConfig);
          console.log('data', this.data);
          
          EventBus.$on('on-select',this.handleSelectEvent);
          this.init();
      },
      beforeDestroy(){
          EventBus.$off('on-select',this.handleSelectEvent);
      },
      computed: {},
      methods: {
          clean(){
              this.dataLoaded = false;
              this.dataReady = false;
              this.expressionData = {};
              this.geneNames = [];
              this.markersList = [];
              this.expressionStatsAll = [];
              this.genesNotFound = [];
              this.cellCompositionVars = {
                  colorByField: null,
                  highlightLabel: '',
                  highlightLabels: [],
                  segmentByCounts2: null,
                  displayByLabel: null,
                  subsetLabel: "",
              },
              this.geneExpressionVars = {
                  selectedGene: null,
                  expressionStats: [],
                  selectedLabel: null,
                  subsetLabel: "",
              }
          },
          async init(){
              //check which components to enable based on config options
              //all are enabled by default if not set
              this.componentsConfig = this.renderConfig["components"];
              this.showCellInfo = this.componentsConfig?.["cell info"]?.enabled ?? true;
              this.showCellProportion = this.componentsConfig?.["cell proportion"]?.enabled ?? true;
              this.showGeneExpression = this.componentsConfig?.["gene expression"]?.enabled ?? true;
              this.showMarkerGenes = this.componentsConfig?.["marker genes"]?.enabled ?? true;

              this.presetsConfig = this.renderConfig["presets"];

              this.layout = this.presetsConfig?.["layout"] || 0;

              //check for requested datasetId
              /* it can come from multiple places
                  1. 'on-select' event from byor
                  2. query string param
                  3. config preset
              */
              if(!this.datasetId || this.datasetId === ''){
                  if(keyParams[this.renderConfig["parameters"]?.datasetId]){
                      this.datasetId = keyParams[this.renderConfig["parameters"].datasetId];
                  }else if(this.presetsConfig?.datasetId){
                      this.datasetId = this.presetsConfig.datasetId
                  }else{
                      console.log('select a dataset');
                      return;
                  }
              }

              console.log(`requested dataset: ${this.datasetId}`);

              //clear existing data
              this.clean();
              
              //fetch base data

              //metadata
              this.dataLoaded = false;
              this.preloadItem = 'metadata';
              const metadataUrl = this.renderConfig["data points"].find(x => x.role === "metadata");
              this.allMetadata = await scUtils.fetchMetadata(metadataUrl.url);
              console.log('addMetadata', this.allMetadata);
              this.metadata = this.allMetadata.find(x => x.datasetId === this.datasetId);
              console.log('metadata', this.metadata);

              //fields
              this.preloadItem = 'fields';
              const fieldsUrl = this.renderConfig["data points"].find(x => x.role === "fields");
              this.fields = await scUtils.fetchFields(fieldsUrl.url, this.datasetId);
              console.log('fields', this.fields);

              //coordinates
              this.preloadItem = 'coordinates';
              const coordinatesUrl = this.renderConfig["data points"].find(x => x.role === "coordinates");
              this.coordinates = await scUtils.fetchCoordinates(coordinatesUrl.url, this.datasetId);
              console.log('coordinates', this.coordinates);

              //markers

              /*TODO:
              -add list of marker genes to gene search history
                  -"searched genes", "marker genes"

              -dotpot
                  -view as table
                  -save dot plot 
                  -include other stats in hover (p-value, z-score, etc)
                  -add ability to click on genes from dot plot
                  -hovering cell type in dot plot should highlight umap, bar and violin
              */
              this.preloadItem = 'markers';
              const markersUrl = this.renderConfig["data points"].find(x => x.role === "markers");
              if(markersUrl){
                  const url = markersUrl.url;
                  this.markers = await scUtils.fetchMarkers(url, this.datasetId);
                  if(this.markers){
                      if(Array.isArray(this.markers)){
                          //latest markers includes gene stats
                          this.markersList = [...new Set(this.markers.map(x=>x.gene.toUpperCase()))];
                          const markersByGene = this.markers.reduce((acc, item) => {
                              if(!acc[item.gene]) acc[item.gene] = [];
                              acc[item.gene].push(item);
                              return acc;
                          }, {});
                          const markersByCellType = this.markers.reduce((acc, item) => {
                              if(!acc[item.cell_type]) acc[item.cell_type] = [];
                              acc[item.cell_type].push(item);
                              return acc;
                          }, {});

                          const topN = 5;
                          const topNStats = [];
                          for(const [cellType, genes] of Object.entries(markersByCellType)){
                              let topNgenes;
                              if (genes.every(gene => gene.z_score != null)) { 
                                  topNgenes = genes.sort((a, b) => b.z_score - a.z_score).slice(0, 5);
                              }else{
                                  topNgenes = genes.sort((a, b) => b.mean_expression - a.mean_expression).slice(0, 5);
                              }
                              
                              for(const gene of topNgenes){
                                  topNStats.push(...markersByGene[gene.gene]);
                              }
                          }
                          
                          const dotPlot = topNStats.map(item => ({
                              gene: item.gene,
                              cellType: item.cell_type,
                              color: null,
                              mean: item.mean_expression,
                              pctExpr: item.pct_nz_group * 100
                          }))
                          this.geneNames = this.markersList;
                          this.markerGenes = dotPlot;
                          this.markerGenesMaxMean = d3.max(this.markerGenes.map(d => d.mean)).toFixed(1);
                          console.log('markers', {markersByGene, markersByCellType, transformedData:this.markerGenes, markersList:this.markersList});
                      }else{
                          //fallback to just having a list of genes per cell type
                          const markersList = Object.values(this.markers).flat();
                          this.markersList = markersList;
                          console.log({markersList});
                      }
                  }else{
                      console.log('no markers returned');
                  }
              }

              this.preloadItem = '';
              this.dataLoaded = true;

              await Vue.nextTick();

              //pre-calculate colors for labels in each field
              this.labelColors = scUtils.calcLabelColors(this.fields, colors);
              
              //this.colorScalePlasmaColorsArray = d3.range(0, 1.01, 0.1).map(t => this.colorScalePlasma(t)).join(', ');
              this.colorScalePlasmaColorsArray = d3.range(0, 1.01, 0.1).map(t => this.colorscaleGreyBlue(t)).join(', ');
              
              this.fieldsDisplayList = scUtils.calcFieldsDisplayList(this.fields);

              //which field designates cell types or fallback as first field
              const givenCellTypeLabel = this.presetsConfig?.["cell type label"];
              const fieldsList = Object.keys(this.fields.metadata_labels);
              if(!givenCellTypeLabel || !fieldsList.includes(givenCellTypeLabel)){
                  this.cellTypeField = this.findCellTypeField(fieldsList);
              }else{
                  this.cellTypeField = givenCellTypeLabel;
              }

              console.log("cellTypeField", this.cellTypeField);
              
              //preset base visualizers to display by cell type
              this.cellCompositionVars.colorByField = this.cellTypeField;

              this.selectColorBy(this.cellTypeField);

              this.selectSegmentBy(this.cellTypeField, "");

              //this.geneExpressionVars['a'].selectedLabel = this.cellTypeField;
              this.geneExpressionVars.selectedLabel = this.cellTypeField;

              this.dataReady = true;

              await Vue.nextTick();

              console.log('++++++++++++ READY')

              //return;
              
              if(this.markerGenes){
                  await this.getGeneExpression(this.markerGenes[0].gene.toUpperCase(), false);
                  //this.geneClick(this.markerGenes[0].gene.toUpperCase());
              }else if(this.markersList){
                  //load gene data markers api
                  console.log('loading marker genes');
                  for(const gene of this.markersList){
                      await this.getGeneExpression(gene.toUpperCase(), false);
                      await Vue.nextTick();
                  }
              }
              //
              if(this.renderConfig["parameters"]?.gene){
                  //load genes from url key params
                  const paramGenes = decodeURIComponent(keyParams[this.renderConfig["parameters"].gene]);
                  if(paramGenes && paramGenes !== 'undefined'){
                      console.log('loading param genes');
                      const paramGenesArray = paramGenes.split(',');
                      for (const gene of paramGenesArray) {
                          await this.getGeneExpression(gene.toUpperCase(), false);
                          await Vue.nextTick();
                      }
                  }else if(this.presetsConfig?.["genes"]){
                      //load genes from config
                      console.log('loading config genes');
                      for (const gene of this.presetsConfig["genes"]) {
                          await this.getGeneExpression(gene.toUpperCase(), false);
                          await Vue.nextTick();
                      }
                  }
              }
          },
          async getGeneExpression(gene, addToKeyParams = true, setAsSelected = false){
              if(this.geneNames.includes(gene)) {
                  console.log(`${gene} already listed`);
                  if(this.expressionData[gene]){
                      console.log(`${gene} already loaded`);
                      if(setAsSelected) this.geneClick(gene);
                      return;
                  }
              }

              this.geneLoading = "gene";
              const expressionUrl = this.renderConfig["data points"].find(x => x.role === "expression");
              const expressionResult = await scUtils.fetchGeneExpression(expressionUrl.url, gene, this.datasetId);
              this.geneLoading = null;

              if(expressionResult){
                  if((this.markerGenes && !this.markersList.includes(gene)) || !this.markerGenes) {
                      this.geneNames.push(gene);
                  }
                  Vue.set(this.expressionData, gene, expressionResult);

                  console.log('getGeneExpression', gene);
                  //console.log('   expressionData', this.expressionData);

                  //update query string gene params 
                  if(addToKeyParams && this.renderConfig["parameters"]?.gene){
                      let paramGenes = decodeURIComponent(keyParams[this.renderConfig["parameters"].gene]);
                      if(paramGenes){
                          const paramGenesArray = paramGenes==='undefined' ? [] : paramGenes.toLowerCase().split(',');
                          console.log(`try adding: ${gene} to ${paramGenesArray}`)
                          if(!paramGenesArray.includes(gene.toLowerCase()) && !this.markersList.includes(gene)){
                              paramGenesArray.push(gene);
                              console.log(`not in list, adding: ${gene} to ${paramGenesArray}`)
                              keyParams.set({[this.renderConfig["parameters"].gene] : paramGenesArray.toString()});
                          }
                      }
                  }

                  await Vue.nextTick();

                  if(!this.geneExpressionVars.selectedGene || setAsSelected){
                      this.geneClick(gene);
                  }
              }else{
                  if(!this.genesNotFound.includes(gene)){
                      this.genesNotFound.push(gene);
                  }
                  await Vue.nextTick();
              }
          },

          findCellTypeField(list) {
              return list.reduce((bestMatch, str) => {
                  const normalizedStr = str.toLowerCase();
                  const score = (normalizedStr.includes("cell") ? 1 : 0) +
                                (normalizedStr.includes("type") ? 1 : 0) + 
                                (normalizedStr.includes("cluster") ? 1 : 0);
                  return score > bestMatch.score ? { string: str, score } : bestMatch;
              }, { string: null, score: 0 }).string;
          },

          /* handlers */
          selectDataset(datasetId){
              this.handleSelectEvent({id:this.sectionId, value: datasetId});
          },
          handleSelectEvent(data) {
              if(data.id===this.sectionId){
                  console.log(this.sectionId, 'Received on-select event:', data);
                  this.datasetId = data.value;
                  if(this.renderConfig["parameters"]?.datasetId){
                      keyParams.set({[this.renderConfig["parameters"]?.datasetId] : this.datasetId});
                  }
                  this.init();
              }
          },
          selectColorBy(field){
              console.log('color by:', field);
              this.cellCompositionVars.colorByField = field;
          },
          selectSegmentBy(display, segment){
              const g = this.cellCompositionVars;
              console.log('segment by:', {display, segment});
              g.displayByLabel = display
              g.segmentByLabel = segment;
              g.segmentByCounts2 = scUtils.calcCellCounts(this.fields, this.labelColors, g.displayByLabel, g.segmentByLabel);
          },
          selectExpressionBy(display, segment){
              const g = this.geneExpressionVars;
              console.log('expression by:', {display, segment});
              g.selectedLabel = display;
              g.subsetLabel = segment;
              g.expressionStats = scUtils.calcExpressionStats(this.fields, this.labelColors, this.expressionData[g.selectedGene], g.selectedGene, g.selectedLabel, g.subsetLabel);
          },
          searchGene(e){
              const parts = e.split(/[,\s]+/);
              //e.target.value = '';
              parts.forEach(async (gene) => {
                  await this.getGeneExpression(gene.toUpperCase(), true, true);
                  await Vue.nextTick();
              })
          },
          geneListClick(e){
              console.log('geneListClick', e)
          },
          geneClick(gene){
              console.log('geneClick', gene);
              if(!this.expressionData[gene]){
                  this.getGeneExpression(gene, false, true);
                  return;
              }
              const g = this.geneExpressionVars;
              g.expressionStats = scUtils.calcExpressionStats(this.fields, this.labelColors, this.expressionData[gene], gene, g.selectedLabel, g.subsetLabel);
              g.selectedGene = gene;
          },
          clearGeneNotFound(e){
              this.genesNotFound.splice(this.genesNotFound.indexOf(e), 1);
          },
          handleSelectorUpdate(e){
              console.log('selector updated', e);
              this.cellCompositionVars.highlightLabels = e.coloredLabels;
              this.selectColorBy(e.coloredField);
          },
          handleSelectorHover(e){
              console.log('selector hovered', e);
              this.cellCompositionVars.highlightLabel = e.hoveredLabel;
          },
      },
  });
</script>

<style scoped>
.tabs-group{
  display:flex;
  flex-direction: column;
}
.tabs-wrapper {
  display: flex;
  z-index: 1;

  .tab {
      padding: 10px 10px;
      margin: 0 -1px -1px 0;
      background: #eee;
      cursor: pointer;
      font-size: 16px;
      flex: 1;
  }
  .tab:last-child {
      margin-right: 0;
  }
  .tab.selected {
      cursor: default;
      background: #fff;
      border-bottom: white;
      font-weight: bold;
  }
}


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

.legends {
  gap: 20px;
}
.legend {
  margin: 0 10px 0 0;
  gap:1px;
}
.legend .label {
  font-size: 11px !important;
  line-height: 11px;
}
.legend .gradient {
  height: 15px;
  width: 100px;
  border-radius: 20px;
}
.legend .gradient-tall {
  height: 100px;
  width: 15px;
  border-radius: 20px;
}
.legend .circles {
  height: 15px;
  width: -webkit-fill-available;
  justify-content: space-between;
  padding: 0 0;
}
.legend .circleBorder {
  border: 1px solid #ccc;
  border-radius: 50%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.legend .circle {
  aspect-ratio: 1;
  background: #ccc;
  border-radius: 50%;
  align-self: center;
}
.legend .marks {
  justify-content: space-between;
  font-size: 11px;
  line-height: 11px;
}

.geneLoader {
  width: 20px;
  height: 20px;
  border: 3px solid black;
  border-bottom-color: #ccc;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% {
      transform: rotate(0deg);
  }
  100% {
      transform: rotate(360deg);
}
} 
</style>
