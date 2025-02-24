<template>
  <div class="matkp">
      <div class="f-col fill-height">
          <!-- NAV -->
          <matkp-nav></matkp-nav>
          <!-- BODY -->
          <div
              class="mat-body f-col"
              style="max-width: 1400px; margin: 0 auto; width: -webkit-fill-available"
          >
              <div style="display:flex; flex-direction: column; gap:10px; ">
                    <div v-if="!$store.state.selectedDataset" style="color:red; margin:0 auto">
                        Please Select a Dataset
                    </div>
                    <div v-else-if="!$parent.dataLoaded" style="margin: 0 auto">
                        Loading...
                    </div>
                    <div v-else style="display:flex; flex-direction: column; gap:20px; width: 100%;">
                        <div style="display:flex; flex-direction:column; gap:20px; align-self:center; background:#f8f8f8; padding:20px;">
                            <research-single-cell-info 
                                :data="$parent.bulkMetadata"
                            />

                            <div v-if="$parent.dataReady" class="" style="display:flex; gap:20px">
                                <!--left tab group-->
                                <div class="tabs-group">
                                    <div class="tabs-wrapper">
                                        <div class="tab">
                                            Select a dataset
                                        </div>
                                    </div>
                                    <div class="tabs-section-wrapper">
                                        <div class="tab-section" style="display:flex; flex-direction: column; gap:20px; background:white; padding:20px;">
                                            <div class="" style="display:flex; gap:20px">
                                                <div style="display:flex; flex-direction: column; min-width: 600px;">
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
                                        <div class="tab-section" style="display:flex; flex-direction: column; gap:20px; background:white; padding:20px;">
                                            <div class="" style="display:flex; gap:20px">
                                                <div style="display:flex; flex-direction: column; min-width: 600px;">
                                                    <select v-model="$store.state.selectedComparison">
                                                        <option value="">Select a comparison</option>
                                                        <option v-for="comparison in $parent.comparisons"
                                                            :value="comparison">
                                                            {{ comparison }}
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-if="$parent.dataReady" class="" style="display:flex; gap:20px">
                                <!--left tab group-->
                                <div class="tabs-group">
                                    <div class="tabs-wrapper">
                                        <div class="tab">
                                            Top 20 Differentially Expressed Genes
                                        </div>
                                    </div>
                                    <div class="tabs-section-wrapper">
                                        <div class="tab-section" style="display:flex; flex-direction: column; gap:20px; background:white; padding:20px;">
                                            <div class="" style="display:flex; gap:20px">
                                                <div style="display:flex; flex-direction: column; min-width: 600px;">
                                                    <div v-if="$parent.zNormData.length > 0">
                                                        <bulk-heatmap
                                                            :zNormData="$parent.zNormData"
                                                            :samplesColumns="$parent.samplesColumns"
                                                            :margin="$parent.margin"
                                                            :plotHeight="$parent.plotHeight"
                                                        >
                                                        </bulk-heatmap>
                                                    </div>
                                                    <div v-else-if="!$store.state.selectedDataset">
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
                                        <div class="tab-section" style="display:flex; flex-direction: column; gap:20px; background:white; padding:20px;">
                                            <div class="" style="display:flex; gap:20px">
                                                <div style="display:flex; flex-direction: column; min-width: 600px;">
                                                    <div v-if="$parent.bulkData19K.length> 0">
                                                        <bulk-volcano-plot
                                                            :renderData="$parent.bulkData19K"
                                                            :renderConfig="$parent.volcanoConfig"
                                                            :margin="$parent.margin"
                                                            sectionId="_bulk">

                                                        </bulk-volcano-plot>
                                                    </div>
                                                    <div v-else-if="!$store.state.selectedDataset">
                                                        Select a dataset to view the volcano plot.
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