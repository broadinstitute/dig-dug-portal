<template>
  <div class="matkp">
      <div class="f-col fill-height">
          <!-- NAV -->
          <matkp-nav></matkp-nav>
          <!-- BODY -->
          <div class="mat-body f-col">
            <h2 class="matkp-static-content-title">Differential Gene Expression Browser</h2>
            <div class="matkp-tool-documentation" v-if="$parent.documentation?.body" v-html="$parent.documentation.body"></div>
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
                                            <div  class="flex-gap">
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
                                            <div  class="flex-gap">
                                                <div class="top-block">
                                                    <select v-model="$store.state.selectedComparison">
                                                        <option value="">Select a comparison</option>
                                                        <option v-for="comp in $parent.comparisons"
                                                            :value="comp">
                                                            {{ comp === "dea_comp_1" 
                                                                ? "insulin resistant vs. insulin sensitive"
                                                                :$store.state.currentComparisons[comp] 
                                                            }}
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
                                            Set -log10(FDR adj. p) threshold
                                        </div>
                                    </div>
                                    <div class="tabs-section-wrapper">
                                        <div class="tab-section" >
                                            <div  class="flex-gap">
                                                <div class="top-block">
                                                    <input type="number" step="0.1"
                                                        :value=$parent.volcanoYCondition
                                                        @change="event => $parent.setVolcano(event.target.value)"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-if="$parent.dataReady">
                                <div class="flex-gap" id="visualizers">
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
                                    <div class="tabs-group wide-group">
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
                                                                sectionId="_bulk"
                                                                :selectedGene="$parent.selectedGene"
                                                                :upregulatedIn="$parent.upregulatedIn"
                                                                @highlight="gene => $parent.highlight(gene)">

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
                                <div class="flex-gap" id="enrichr-legend" v-if="$parent.dataReady">
                                    <div class="tabs-group">
                                        <div class="tabs-wrapper">
                                            <div class="tab">
                                                ENRICHR: Pathways for {{ $parent.upGenes.length }} upregulated
                                                and {{ $parent.downGenes.length}} downregulated genes.
                                            </div>
                                        </div>
                                        <div class="tabs-section-wrapper">
                                          <div class="tab-section" >
                                            <div style="display:flex; gap:5px" class="legends">
                                                <div style="display:inline-block" class="legend">
                                                   <strong>-log10(P adj.)</strong>
                                                    <div style="display:flex; margin-top:10px" class="marks">
                                                        <span>{{ $parent.colorScaleEndpoints[0]?.toFixed(4) }}</span>
                                                        <div class="gradient" :style="`background: linear-gradient(to right, ${$parent.colorScaleArray});`">
                                                        </div>
                                                        <span>{{ $parent.colorScaleEndpoints[1]?.toFixed(4) }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div id="note">
                                                Combined score = log(p) * z, where z represents deviation from expected rank.
                                            </div>
                                            <div class="row select-library">
                                                <div class="col-md-3">
                                                    <div class="label">Select a library type</div>
                                                    <select v-model="$parent.selectedLibraryType">
                                                        <option :value="''">
                                                            Select a library type
                                                        </option>
                                                        <option v-for="libraryType in $parent.enrichrLibraryTypes"
                                                            :value="libraryType">
                                                            {{ libraryType }}
                                                        </option>
                                                    </select>
                                                </div>
                                                <div class="col-md-9"></div>
                                            </div>
                                            <div class="row" v-if="!!$parent.selectedLibraryType">
                                                <div class="col-md-12">
                                                    <b-table
                                                    id="select-library-table"
                                                    small
                                                    :items="$parent.librariesForType"
                                                    :current-page="$parent.libraryPage"
                                                    :per-page="5"
                                                    >
                                                        <template #cell(type)="item">
                                                            <button class="btn btn-sm btn-primary select-library"
                                                                @click="$parent.selectLibrary(item)">
                                                                Select library
                                                            </button>
                                                        </template>
                                                    </b-table>
                                                    <b-pagination
                                                        small
                                                        v-model="$parent.libraryPage"
                                                        :total-rows="$parent.librariesForType.length"
                                                        :per-page="5"
                                                        aria-controls="select-library-table"
                                                    ></b-pagination>
                                                </div>
                                            </div>
                                          </div>
                                        <h4 id="enrichrResults">Results for gene set library {{ $parent.displayLibrary }}</h4>
                                        </div>
                                    </div>
                                </div>
                                <div id="enrichr">
                                    <div class="tabs-group">
                                        <div class="tabs-section-wrapper">
                                            <div class="tab-section" >
                                                <div class="flex-gap">
                                                    <div class="wide-block">
                                                        <enrichr-plot
                                                            v-if="$parent.dataReady"
                                                            ref="DownregulatedGenes"
                                                            :phenotypesData="$parent.enrichrDown"
                                                            :colors="$parent.colors"
                                                            :colorScale="$parent.enrichrColorScale"
                                                            canvasId="Downregulated"
                                                            :utils="$parent.utils"
                                                            :truncate="$parent.truncateEnrichr"
                                                        ></enrichr-plot>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="tabs-group">
                                        <div class="tabs-section-wrapper">
                                            <div class="tab-section" >
                                                <div class="flex-gap">
                                                    <div class="wide-block">
                                                        <enrichr-plot
                                                            v-if="$parent.dataReady"
                                                            ref="UpregulatedGenes"
                                                            :phenotypesData="$parent.enrichrUp"
                                                            :colors="$parent.colors"
                                                            :colorScale="$parent.enrichrColorScale"
                                                            canvasId="Upregulated"
                                                            :utils="$parent.utils"
                                                            :truncate="$parent.truncateEnrichr"
                                                        ></enrichr-plot>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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
    min-width: 285px;
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
  #enrichr {
    margin-bottom: 25px;
    display: flex;
  }
  #enrichr .tabs-group{
    width: 680px;
    height: 345px;
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
    height: 20px;
    width: 200px;
    border-radius: 20px;
}
.legend span {
  padding-left: 15px;
  padding-right: 15px;
}

.group-legend-box {
    display: inline-block;
    width: 15px;
    height: 15px;
    padding: 0 !important;
}

.group-legend-name {
    padding-left: 5px !important;
    padding-right: 15px !important;
    vertical-align: text-bottom;
}
#enrichr-legend {
    margin-top: 25px;
    width: 100%;
}
#enrichr-legend .tabs-group {
    width: 100%;
}
#enrichrResults {
    background-color: white;
    margin-bottom: 0;
    padding-left: 25px;
}
button.select-library {
    padding-top: 1px;
    padding-bottom: 1px;
}
#select-library-table td {
    padding: 0.2rem;
}
#select-library-table {
    background: #efefef;
}
</style>