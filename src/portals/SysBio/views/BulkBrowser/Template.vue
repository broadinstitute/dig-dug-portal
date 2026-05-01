<template>
  <div class="sysbio f-layout">
        <div class="f-col fill-height">
          <!-- NAV -->
          <sysbio-header></sysbio-header>
          <!-- BODY -->
          <div class="sysbio-body f-col">
            <h2>Differential Gene Expression Browser</h2>
            <div v-html="$parent.docs" class="docs">
            </div>
            <div class="flex-column flex-small-gap">
                <div id="center-width" class="flex-gap flex-column">
                    <div class="flex-gap flex-column" id="center-content">
                        <div v-if="$parent.dataReady" id="menu">
                            <!--left tab group-->
                            <div class="tabs-group">
                                <div class="tabs-wrapper">
                                    <div class="tab">
                                        Select a comparison
                                    </div>
                                </div>
                                <div class="tabs-section-wrapper">
                                    <div class="tab-section">
                                        <select v-model="$store.state.selectedAMP"
                                            class="form-control">
                                            <option value="">Select a comparison</option>
                                            <option v-for="amp in $parent.amps"
                                                :value="amp">
                                                {{ amp.replaceAll("ROSMAP", "AD") }}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="tabs-group">
                                <div class="tabs-wrapper">
                                    <div class="tab">
                                        Select a cell type
                                    </div>
                                </div>
                                <div class="tabs-section-wrapper">
                                    <div class="tab-section">
                                        <select v-model="$store.state.selectedComparison"
                                            class="form-control">
                                            <option value="">Select a cell type</option>
                                            <option v-for="comp in $parent.comparisons"
                                                :value="comp">
                                                {{ $store.state.currentComparisons[comp].cellType
                                                }}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="$parent.dataReady">
                        <div class="flex-gap" id="visualizers">
                            <!--left tab group-->
                            <div class="tabs-group volcano">
                                <div class="tabs-wrapper">
                                    <div class="tab">
                                        Differentially Expressed Genes
                                    </div>
                                </div>
                                <div class="tabs-section-wrapper row" id="diff-exp-menu">
                                    <div class="col-md-4 menu-item">
                                        <div class="label">Search for a gene</div>
                                        <gene-selectpicker @onGeneChange="gene => $parent.highlight(gene)">
                                        </gene-selectpicker>
                                    </div>
                                    <div class="col-md-4 menu-item">
                                        <div class="label">Set X-axis threshold for up/down regulation</div>
                                            <input type="number" step="0.1" class="form-control"
                                            :value=$parent.volcanoXConditionGreater
                                            @change="event => $parent.setVolcano(event.target.value, $parent.volcanoYCondition)"/>
                                    </div>
                                    <div class="col-md-4 menu-item">
                                        <div class="label">Set Y-axis threshold for up/down regulation</div>
                                            <input type="number" step="0.1" class="form-control"
                                            :value=$parent.volcanoYCondition
                                            @change="event => $parent.setVolcano($parent.volcanoXConditionGreater, event.target.value)"/>
                                    </div>
                                </div>
                                <div class="tabs-section-wrapper">
                                    <div class="gene-not-found" v-if="!$parent.foundGene">
                                        Gene not found.
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
                                                        :selectedGene="$store.state.selectedGene"
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
                                    @geneFound="v => $parent.geneFound(v)"
                                    @highlightRow="gene => $parent.highlight(gene)"
                                    :dataset="$store.state.selectedDataset"
                                    :config="$parent.tableConfig"
                                    :scatterConfig="$parent.scatterplotConfig"
                                    :highlightedGene="$store.state.selectedGene"
                                    :regulationConditions="$parent.regulationConditions">
                                </bulk-table>
                            </div>
                        </div>
                                <div class="flex-gap" id="enrichr-legend">
                                    <div class="tabs-group" v-if="$parent.enrichrReady && $parent.dataReady">
                                        <div class="tabs-wrapper">
                                            <div class="tab">
                                                ENRICHR: Top pathways for differentially expressed genes
                                            </div>
                                        </div>
                                        <div class="tabs-section-wrapper">
                                          <div class="tab-section">
                                            <div class="row">
                                                <p id="enrichr-explain">The top 10 pathways from the selected gene set library are provided
                                                for all differentially expressed genes from the above-selected dataset
                                                and p-value filters (<strong>{{ $parent.upGenes.length }}</strong> upregulated,
                                                <strong>{{ $parent.downGenes.length}}</strong> downregulated genes).
                                                If you use data from this tool, please review our <a href="about.html?page=policies">Citation
                                                Policies</a> to ensure proper citation of the underlying resource(s)
                                                used to generate these analyses.</p>
                                            </div>
                                            <div class="row select-library">
                                                <div class="col-md-3">
                                                    <div class="label">Select a library type</div>
                                                    <select v-model="$parent.selectedLibraryType" class="form-control">
                                                        <option :value="''">
                                                            Select a library type
                                                        </option>
                                                        <option v-for="libraryType in $parent.enrichrLibraryTypes"
                                                            :value="libraryType">
                                                            {{ libraryType }}
                                                        </option>
                                                    </select>
                                                </div>
                                                <div class="col-md-4"></div>
                                                <div class="col-md-5">
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
                                                </div>
                                            </div>
                                            <div class="row" v-if="!!$parent.selectedLibraryType">
                                                <div class="col-md-12">
                                                    <b-table
                                                    :hidden="$parent.tableHidden"
                                                    id="select-library-table"
                                                    small
                                                    :items="$parent.librariesForType"
                                                    :current-page="$parent.libraryPage"
                                                    :per-page="5"
                                                    :tbody-tr-class="(library) => $parent.getClass(library)"
                                                    >
                                                        <template #head(type)="item">
                                                            Select
                                                            <button class="btn btn-sm hide-table"
                                                                @click="$parent.hideTable()">
                                                                &#x2715;
                                                            </button>
                                                        </template>
                                                        <template #cell(type)="item">
                                                            <button class="btn btn-sm btn-primary select-library"
                                                                @click="$parent.selectLibrary(item)">
                                                                Select library
                                                            </button>
                                                        </template>
                                                    </b-table>
                                                    <b-pagination v-if="$parent.librariesForType.length > 5"
                                                        small
                                                        v-model="$parent.libraryPage"
                                                        :total-rows="$parent.librariesForType.length"
                                                        :per-page="5"
                                                        aria-controls="select-library-table"
                                                    ></b-pagination>
                                                </div>
                                            </div>
                                          </div>
                                        <h4 id="enrichrResults">Results for gene set library {{ $parent.enrichrLibrary }}</h4>
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
                                                            v-if="$parent.enrichrReady && $parent.dataReady"
                                                            ref="DownregulatedGenes"
                                                            :phenotypesData="$parent.enrichrDown"
                                                            :colors="$parent.colors"
                                                            :colorScale="$parent.enrichrColorScale"
                                                            canvasId="Downregulated"
                                                            :utils="$parent.utils"
                                                            :truncate="$parent.truncateEnrichr"
                                                        ></enrichr-plot>
                                                        <div v-else>
                                                            Loading ENRICHR...
                                                        </div>
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
                                                            v-if="$parent.enrichrReady && $parent.dataReady"
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
                    <div v-else>
                        Loading...
                    </div>
                </div>
            </div>
        </div>
        <!-- FOOTER -->
        <sysbio-footer></sysbio-footer>
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
    margin: 0 auto;
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
    background: #ffffff;
    width: 100%;
    border-top: 5px solid #eeeeee;
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
    background: white;
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
button.hide-table {
    background-color: red;
    color: white;
    float: right;
    border-radius: 20px;
    padding-top: 1px;
    padding-bottom: 1px;
    padding-left: 5px;
    padding-right: 5px;
    font-weight: bold;
    font-size: smaller;
}
#enrichr-explain {
    margin-left: 15px;
    margin-right: 15px;
}
.volcano {
    width: 100%;
    background-color: white;
}
.top-menu-item {
    max-width: 25%;
}
#menu {
    display: flex;
    /*border-radius: 5px;
    border: 1px solid darkgray;
    background-color: lightgray;
    padding: 10px;*/
    margin: auto;
}
#menu div.tabs-group {
    margin: 10px;
    border: 1px solid #eeeeee;
}
#menu div.tabs-group:last-child {
    min-width: 20%;
}
#gene-box {
    padding: 10px !important;
}
#diff-exp-menu {
    padding: 20px;
    margin: 20px;
    background-color: #efefef;
    border-radius: 5px;
}
#diff-exp-menu > .menu-item {
    font-size: larger;
}
.gene-not-found {
    margin: 20px;
    padding: 20px;
    border: 1px solid goldenrod;
    background-color: gold;
}
</style>