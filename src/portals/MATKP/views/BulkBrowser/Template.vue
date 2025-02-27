<template>
  <div class="matkp">
      <div class="f-col fill-height">
          <!-- NAV -->
          <matkp-nav></matkp-nav>
          <!-- BODY -->
          <div class="mat-body f-col">
              <div class="flex-column flex-small-gap">
                    <div id="center-width" class="flex-gap flex-column">
                        <div class="flex-gap flex-column" id="center-content">
                            <research-single-cell-info v-if="!!$store.state.selectedDataset"
                                :data="$parent.bulkMetadata"
                            />

                            <div v-if="$parent.dataReady" class="" class="flex-gap">
                                <!--left tab group-->
                                <div class="tabs-group">
                                    <div class="tabs-wrapper">
                                        <div class="tab">
                                            Select a dataset
                                        </div>
                                    </div>
                                    <div class="tabs-section-wrapper">
                                        <div class="tab-section" >
                                            <div class="" class="flex-gap">
                                                <div class="top-block">
                                                    <select v-model="$store.state.selectedDataset">
                                                        <option value="">Select a dataset</option>
                                                        <option v-for="dataset in $parent.datasets"
                                                            :value="dataset">
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
                                            <div class="" class="flex-gap">
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
                            </div>
                            <div v-if="$parent.dataReady" class="" class="flex-gap">
                                <!--left tab group-->
                                <div class="tabs-group">
                                    <div class="tabs-wrapper">
                                        <div class="tab">
                                            Top 20 Differentially Expressed Genes
                                        </div>
                                    </div>
                                    <div class="tabs-section-wrapper">
                                        <div class="tab-section" >
                                            <div class="" class="flex-gap">
                                                <div class="top-block">
                                                    <div v-if="$parent.zNormData.length > 0">
                                                        <bulk-heatmap
                                                            :zNormData="$parent.zNormData"
                                                            :samplesColumns="$parent.samplesColumns"
                                                            :margin="$parent.margin"
                                                            :plotHeight="$parent.plotHeight"
                                                        >
                                                        </bulk-heatmap>
                                                    </div>
                                                    <div v-else>
                                                        Select a dataset and a comparison to view the heatmap.
                                                    </div>
                                                </div>
                                                </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="tabs-group">
                                    <div class="tabs-wrapper">
                                        <div class="tab">
                                            Differentially Expressed Genes
                                        </div>
                                    </div>
                                    <div class="tabs-section-wrapper">
                                        <div class="tab-section" >
                                            <div class="" class="flex-gap">
                                                <div class="top-block">
                                                    <div v-if="$parent.bulkData19K.length> 0">
                                                        <bulk-volcano-plot
                                                            :renderData="$parent.bulkData19K"
                                                            :renderConfig="$parent.volcanoConfig"
                                                            :margin="$parent.margin"
                                                            sectionId="_bulk">

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
                        
                            <div v-if="$parent.dataReady" id="table-wrapper" class="flex-gap flex-column">
                                <div class="flex-gap flex-column">
                                    <bulk-table
                                        :bulkData="$parent.bulkData19K"
                                        :dataset="$store.state.selectedDataset"
                                        :config="$parent.tableConfig"
                                        :scatterConfig="$parent.scatterplotConfig"
                                        :highlightedGene="$store.state.selectedGene">

                                    </bulk-table>
                                </div>
                            </div>
                            <div v-else>Loading...</div>
                        </div>
                    </div>
                </div>
          </div>
          <!-- FOOTER -->
          <matkp-footer></matkp-footer>
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
    min-width: 600px;;
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
</style>