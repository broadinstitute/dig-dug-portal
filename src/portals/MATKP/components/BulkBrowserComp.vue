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
                  :data="bulkMetadata"
              />
              <div v-if="dataReady" class="" style="display:flex; gap:20px">
                  <!--left tab group-->
                  <div class="tabs-group">
                      <div class="tabs-wrapper">
                          <div class="tab">
                              Gene Expression
                          </div>
                      </div>
                      <div class="tabs-section-wrapper">
                          <div class="tab-section" style="display:flex; flex-direction: column; gap:20px; background:white; padding:20px;">
                              <div class="" style="display:flex; gap:20px">
                                  <div v-if="coordinates" style="display:flex; flex-direction: column; min-width: 600px;">
                                      
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
                                  <div v-if="coordinates" style="display:flex; flex-direction: column; min-width: 600px;">
                                      
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
  import ResearchSingleCellInfo from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellInfo.vue";
  import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";

  const colors = ["#007bff","#048845","#8490C8","#BF61A5","#EE3124","#FCD700","#5555FF","#7aaa1c","#F88084","#9F78AC","#F5A4C7","#CEE6C1","#cccc00","#6FC7B6","#D5A768","#d4d4d4"]

  export default Vue.component('bulk-browser-comp', {
      components: {
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
          },
          bulkDataset: {
            type: String,
            required: true
          }
      },
      data() {
          return {
              allMetadata: null, //raw metadata for all datasets
              bulkMetadata: null,
              fields: null,   //raw fields
              coordinates: null,  //raw coordinates
              markers: null, //raw marker genes

              datasetId: null,
              cellTypeField: null,

              labelColors: null,
              fieldsDisplayList: null,

              dataLoaded: false,
              preloadItem: '',
              dataReady: false,

              layout: 0,
          }
      },
      mounted() {
          
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
              await this.getBulkMetadata();
              //check which components to enable based on config options
              //all are enabled by default if not set
              this.componentsConfig = this.renderConfig["components"];
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
                      return;
                  }
              }

              //clear existing data
              this.clean();
              
              //fetch base data

              //metadata
              this.dataLoaded = false;
              this.preloadItem = 'metadata';
              const metadataUrl = this.renderConfig["data points"].find(x => x.role === "metadata");
              this.allMetadata = await scUtils.fetchMetadata(metadataUrl.url);
              this.metadata = this.allMetadata.find(x => x.datasetId === this.datasetId);

              //fields
              this.preloadItem = 'fields';
              const fieldsUrl = this.renderConfig["data points"].find(x => x.role === "fields");
              this.fields = await scUtils.fetchFields(fieldsUrl.url, this.datasetId);

              //coordinates
              this.preloadItem = 'coordinates';
              const coordinatesUrl = this.renderConfig["data points"].find(x => x.role === "coordinates");
              this.coordinates = await scUtils.fetchCoordinates(coordinatesUrl.url, this.datasetId);


              this.preloadItem = '';
              this.dataLoaded = true;

              await Vue.nextTick();

              //which field designates cell types or fallback as first field
              const givenCellTypeLabel = this.presetsConfig?.["cell type label"];
              const fieldsList = Object.keys(this.fields.metadata_labels);
              
              this.cellTypeField = givenCellTypeLabel;
              
              
              //preset base visualizers to display by cell type
              this.cellCompositionVars.colorByField = this.cellTypeField;

              this.geneExpressionVars.selectedLabel = this.cellTypeField;

              this.dataReady = true;

              await Vue.nextTick();

          },
          async getBulkMetadata(){
            if (!this.allMetadata){
              let metadataUrl = "https://bioindex-dev.hugeamp.org/api/raw/file/single_cell_all_metadata/dataset_metadata.json.gz";
           let myMetadata = await scUtils.fetchMetadata(metadataUrl);
           this.allMetadata = myMetadata;
            }
          
           this.bulkMetadata = this.allMetadata.find(x => x.datasetId === this.datasetId);
           console.log(this.allMetadata);
        },
  }});
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
