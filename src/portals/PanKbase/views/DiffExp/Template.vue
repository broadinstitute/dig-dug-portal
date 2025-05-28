<template>
  <div class="pkb-wrapper">
      <div class="f-col fill-height">
          <!-- NAV -->
          <pkb-header></pkb-header>
          <!-- BODY -->
          <div class="mat-body f-col">
            <h2 class="static-content-title">Differential Gene Expression Browser</h2>
            <div class="tool-documentation" v-if="$parent.documentation?.body" v-html="$parent.documentation.body"></div>
              <div class="flex-column flex-small-gap">
                    <div id="center-width" class="flex-gap flex-column">
                        <div class="flex-gap flex-column" id="center-content">
                            <research-single-cell-info v-if="!!$store.state.selectedDataset"
                                :data="$parent.bulkMetadata"
                            />

                            <div v-if="$parent.dataReady" id="menu" class="flex-gap">
                                <!--left tab group-->
                                <div class="tabs-group">
                                    <div class="tabs-wrapper">
                                        <div class="tab">
                                            Select a dataset
                                        </div>
                                    </div>
                                    <div class="tabs-section-wrapper">
                                        <div class="tab-section" >
                                            <div class="flex-gap">
                                                <div class="top-block">
                                                    <select v-model="$store.state.selectedDataset">
                                                        <option value="">Select a dataset</option>
                                                        <!-- <option v-for="dataset in $parent.datasets"
                                                            :value="dataset">
                                                            {{ dataset.slice(0,30) }}
                                                            {{`${dataset.length > 30 ? '...':''}`}}
                                                        </option> -->
                                                        <option v-for="dataset in $parent.datasets">
                                                            {{ dataset }}
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="tabs-group">
                                    <div class="tabs-wrapper">
                                        <div class="tab">
                                            Select a comparison
                                        </div>
                                    </div>
                                    <div class="tabs-section-wrapper">
                                        <div class="tab-section" >
                                            <div  class="flex-gap">
                                                <div class="top-block">
                                                    <select v-model="$store.state.selectedComparison">
                                                        <option value="">Select a comparison</option>
                                                        <option v-for="comp in $parent.comparisons"
                                                            :value="comp">
                                                            {{ $store.state.currentComparisons[comp] }}
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="tabs-group">
                                    <div class="tabs-wrapper">
                                        <div class="tab">
                                            Select a gene
                                        </div>
                                    </div>
                                    <div class="tabs-section-wrapper">
                                        <div class="tab-section" >
                                            <div  class="flex-gap">
                                                <div class="top-block">
                                                    <mouse-gene-select
                                                        v-if="$parent.isMouse"
                                                        @onGeneChange="gene => $parent.highlight(gene)">
                                                    </mouse-gene-select>
                                                    <gene-selectpicker v-else
                                                        @onGeneChange="gene => $parent.highlight(gene)"
                                                    ></gene-selectpicker>
                                                </div>
                                                </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="tabs-group">
                                    <div class="tabs-wrapper">
                                        <div class="tab">
                                            Set p (adj.) threshold
                                        </div>
                                    </div>
                                    <div class="tabs-section-wrapper">
                                        <div class="tab-section" >
                                            <div  class="flex-gap">
                                                <div class="top-block">
                                                    <input type="number" step="0.01"
                                                        v-model="$parent.volcanoYCondition"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="tabs-group">
                                    <div class="tabs-wrapper">
                                        <div class="tab">
                                            Set &plusmn; log2(fold change) threshold
                                        </div>
                                    </div>
                                    <div class="tabs-section-wrapper">
                                        <div class="tab-section" >
                                            <div  class="flex-gap">
                                                <div class="top-block">
                                                    <input type="number" step="0.1"
                                                        v-model="$parent.volcanoXConditionGreater"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-if="$parent.dataReady">
                                <div id="visualization-wrapper" class="flex-gap">
                                    <!--left tab group-->
                                    <div class="tabs-group wide-group">
                                        <div class="tabs-wrapper">
                                            <div class="tab">
                                                Top 20 Differentially Expressed Genes
                                            </div>
                                        </div>
                                        
                                        <div class="tabs-section-wrapper">
                                            <div class="tab-section" >
                                                <div  class="flex-gap">
                                                    <div class="wide-block">
                                                        <div v-if="$parent.zNormData.length > 0">
                                                            <bulk-heatmap
                                                                :zNormData="$parent.zNormData"
                                                                :samplesColumns="$parent.samplesColumns"
                                                                :comparisonId="$parent.selectedComparison"
                                                                :margin="$parent.margin"
                                                                :sampleColors="$parent.colors"
                                                                :plotHeight="$parent.plotHeight"
                                                                :selectedGene="$parent.selectedGene"
                                                                @highlight="gene => $parent.highlight(gene)"
                                                                :plotId="$parent.kpDataset"
                                                            >
                                                            </bulk-heatmap>
                                                        </div>
                                                        <div v-else>
                                                            Heatmap coming soon
                                                        </div>
                                                    </div>
                                                    </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div id="bottom-group" class="tabs-group wide-group">
                                        <div class="tabs-wrapper">
                                            <div class="tab">
                                                Differentially Expressed Genes
                                            </div>
                                        </div>
                                        <div class="tabs-section-wrapper">
                                            <div class="tab-section" >
                                                <div class="flex-gap">
                                                    <div class="wide-block">
                                                        <div v-if="$parent.bulkData19K.length> 0">
                                                            <bulk-volcano-plot
                                                                :renderData="$parent.bulkData19K"
                                                                
                                                                :renderConfig="$parent.volcanoConfig"
                                                                :margin="$parent.margin"
                                                                sectionId="bulk"
                                                                :selectedGene="$parent.selectedGene"
                                                                @highlight="gene => $parent.highlight(gene)"
                                                                :plotId="$parent.kpDataset">

                                                            </bulk-volcano-plot>
                                                        </div>
                                                        <div v-else>
                                                            Select a dataset and a comparison to view the volcano plot.
                                                        </div>
                                                    </div>
                                                    </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>   
                                <div id="table-wrapper" class="flex-gap flex-column">
                                    <div class="flex-gap flex-column">
                                        <bulk-table
                                            :bulkData="$parent.bulkData19K"
                                            :dataset="$store.state.selectedDataset"
                                            :config="$parent.tableConfig"
                                            :scatterConfig="$parent.scatterplotConfig"
                                            :highlightedGene="$store.state.selectedGene"
                                            :regulationConditions="$parent.regulationConditions">
                                        </bulk-table>
                                    </div>
                                </div>
                            </div>
                            <div v-else>Loading...</div>
                        </div>
                    </div>
                </div>
          </div>
          <!-- FOOTER -->
          <pkb-footer></pkb-footer>
      </div>
  </div>
</template>
<style scoped>
.tabs-group{
  display:flex;
  flex-direction: column;
}
.tabs-wrapper {
  display: flex;
  z-index: 1;
}
  .tab {
      padding: 10px 10px;
      margin: 0 -1px -1px 0;
      background: #eee;
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
  .mat-body {
    max-width: 1400px; 
    margin: 0 auto; 
    width: -webkit-fill-available;
  }
  .top-block {
    display:flex;
    flex-direction: column;
    min-width: 213px;
  }
  .top-block select {
    max-width: 213px;
  }
  .wide-block {
    display:flex;
    flex-direction: column;
    min-width: 600px;
  }
  .flex-gap {
    display:flex;
    gap:20px;
  }
  .flex-column {
    flex-direction: column;
  }
  .tab-section {
    display:flex;
    flex-direction: column;
    gap:20px;
    background:white;
    padding:20px;
  }
  #center-width {
    width: 100%;
  }
  #center-content {
    align-self:center;
    background:#f8f8f8;
    padding:20px;
  }
  #table-wrapper {
    background:white;
    padding:20px;
    width:100%;
  }
  .flex-small-gap {
    display:flex;
    gap:10px; 
  }
  .wide-group {
    width: 670px;
  }
  #bottom-group {
    margin-bottom: 25px;
  }
</style>