<template>
    <div style="display:flex; flex-direction: column; gap:10px; ">
        <template v-if="false">
            <div style="display:flex; gap:10px; align-items: center;">
                <div>Select BioIndex:</div>
                <select v-model="selectedBI" @change="selectBioIndex($event.target.value)">
                    <option v-for="bi of singleCellBI" :value="bi.bioIndex">
                        {{ bi.name }}
                    </option>
                </select>
                <b-pagination 
                    v-model="currentDatasetsPage"
                    class="pagination justify-content-center"
                    :total-rows="totalDatasets"
                    :per-page="datasetsPerPage"
                ></b-pagination>
            </div>
            <b-table v-if="filteredMetadata"
                :items="filteredMetadata"
                :fields="tableColumns"
                striped
                hover
                responsive="sm"
                head-variant="light"
                :per-page="datasetsPerPage"
                :current-page="currentDatasetsPage"
            >
                <template #cell(datasetId)="data">
                    <button v-if="data.item.datasetId !== datasetId" @click="selectDataset(data.item.datasetId)">Select</button>
                    <div v-else>Selected</div>
                </template>
            </b-table>
            <div v-if="datasetId" style="display:flex; gap:10px; align-items: center;">
                <div>Select Layout:</div>
                <select v-model="layout" @change="selectLayout($event.target.value)">
                    <option v-for="layout of layoutOptions" :value="layout.value">
                        {{ layout.name }}
                    </option>
                </select>
            </div>
        </template>

        <template v-if="false">
            <div style="font-weight: bold;">Select Tissue</div>
            <!-- datasets dropdown -->
            <select @change="selectDataset(data.item.datasetId)" v-model="datasetId">
                <option :value="null">--Select--</option>
                <option v-for="item in singleCellMetadata" :value="item.datasetId">{{ item.tissue }} ({{ item.totalCells.toLocaleString() }} cells)</option>
            </select>
        </template>

        <div v-if="showDatasetSelect" style="display:flex; flex-direction: column; gap:10px;">
            <div>
                <div style="font-weight: bold; font-size:16px;">Select Tissue</div>
                <div>Click on a row to select</div>
            </div>
            <!-- datasets table -->
            <b-table v-if="singleCellMetadata"
                :items="singleCellMetadata"
                :fields="tableColumns"
                small
                striped
                hover
                responsive="sm"
                head-variant="light"
                sticky-header="300px"
                :per-page="datasetsPerPage"
                :current-page="currentDatasetsPage"
                :tbody-tr-class="datasetsRowClass"
                @row-clicked="item => selectDataset(item.datasetId)"
            >
                <template #cell(datasetId)="data">
                    <button v-if="data.item.datasetId !== datasetId" @click="selectDataset(data.item.datasetId)">Select</button>
                    <div v-else>Selected</div>
                </template>
            </b-table>
        </div>


        <div v-if="!datasetId" style="color:red; margin:0 auto">
            Please Select a Dataset
        </div>


        <div v-if="datasetId && !dataLoaded" style="margin: 0 auto">
            Loading {{ preloadItem }}...
        </div>


        <div v-if="dataLoaded" style="display:flex; flex-direction: column; gap:20px; width: 100%; max-width:100%; overflow-x: auto;">
            <!-- layout 0 (full)-->
            <div v-if="layout===0" style="display:flex; flex-direction:column; gap:20px; background:#f8f8f8; padding:20px; width:100%; min-width: 840px;">
                <research-single-cell-info 
                    v-if="metadata"
                    :data="metadata"
                />
                <div v-if="dataReady" class="" style="display:flex; flex-direction: column; gap:20px;">
                    <!-- UMAP feature plots-->
                    <div style="display: flex; gap:20px;">
                        <div v-if="coordinates" style="display:flex; gap:20px; flex:1; padding: 20px; background: white; max-width: 50%;">
                            <div style="display:flex; flex-direction: column; width: min-content; flex: 1;">
                                <div style="display:flex; justify-content: space-between; align-items: baseline; margin: 0 0 5px;">
                                    <div><strong style="font-size: 16px;">Embedding</strong> {{ embeddingType }}</div>
                                    <div>{{ totalCells.toLocaleString() }} cells</div>
                                </div>
                                <research-umap-plot-gl 
                                    :group="datasetId"
                                    :points="coordinates"
                                    :labels="fields"
                                    :colors="labelColors"
                                    :cellTypeField="cellCompositionVars.colorByField"
                                    :colorByField="cellCompositionVars.colorByField"
                                    :hoverFields="[]"
                                    :highlightLabel="cellCompositionVars.highlightLabel"
                                    :highlightLabels="cellCompositionVars.highlightLabels"
                                    :width="400"
                                    :height="400"
                                />
                            </div>
                            <div v-if="colorByFields" style="display:flex; flex-direction: column; align-self: flex-start; width:200px;">
                                <strong style="font-size: 16px; margin: 0 0 5px;">Color By</strong>
                                <div style="display:flex; flex-direction: column; height: 400px; gap:5px">
                                    <select style="width: 100%;" @change="selectColorBy($event.target.value)" v-model="cellCompositionVars.colorByField">
                                        <option value="">--Select--</option>
                                        <option v-for="(value, key) of colorByFields.show" :value="key">
                                            {{ displayLabel(key) }}
                                        </option>
                                    </select>
                                    <div style="width: 100%; flex-grow:1; overflow-x: hidden; overflow-y: auto;">
                                        <research-single-cell-selector 
                                            :data="fields['metadata_labels_sorted'] || fields['metadata_labels']"
                                            :displayData="displayFields"
                                            :selectedField="cellCompositionVars.colorByField"
                                            layout="list"
                                            :colors="labelColors"
                                            @on-update="handleSelectorUpdate($event)"
                                            @on-hover="handleSelectorHover($event)"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-if="coordinates" style="display:flex; gap:20px; flex:1; padding: 20px; background: white; max-width: 50%;">
                            <div style="display:flex; flex-direction: column; width: min-content;  flex: 1;">
                                <div style="display:flex; justify-content: space-between; align-items: baseline; margin: 0 0 5px;">
                                    <div><strong style="font-size: 16px;">{{ geneExpressionVars.selectedGene ? `${geneExpressionVars.selectedGene}` : 'Gene' }} Expression</strong> {{ embeddingType }}</div>
                                    <div>{{ totalCells.toLocaleString() }} cells</div>
                                </div>
                                <div style="position:relative; width:100%">
                                    <research-umap-plot-gl 
                                        :group="datasetId"
                                        :points="coordinates"
                                        :labels="fields"
                                        :colors="labelColors"
                                        :expression="expressionData[geneExpressionVars.selectedGene]"
                                        :expressionColorScale="expressionColorScale"
                                        :cellTypeField="cellCompositionVars.colorByField"
                                        :hoverFields="[]"
                                        :highlightLabel="cellCompositionVars.highlightLabel"
                                        :highlightLabels="cellCompositionVars.highlightLabels"
                                        :width="400"
                                        :height="400"
                                    />
                                    <!--
                                    <div v-if="expressionData[geneExpressionVars.selectedGene]" style="display:flex; flex-direction: column; position:absolute; top:4px; left:5px;" class="legend">
                                        <div class="label">Expression</div>
                                        <div class="gradient" :style="`background: linear-gradient(to right, ${colorScalePlasmaColorsArray}); height:5px;`"></div>
                                        <div style="display:flex" class="marks"><div>{{ minExpressionValue(geneExpressionVars.selectedGene) }}</div><div>{{ maxExpressionValue(geneExpressionVars.selectedGene) }}</div></div>
                                    </div>
                                    -->
                                </div>
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

                    <!-- Trait plots -->
                    <div style="display:flex; flex-direction: column; gap:5px;">
                        <!-- Trait select -->
                        <div style="display: flex; flex-direction: row; padding:20px; background: white; gap:20px;">

                            <div v-if="displayGroups?.cellType?.length>1" 
                                style="display: flex; flex-direction: column; gap:5px; width:300px;">
                                <div style="display: flex; gap:5px; align-items: center;">
                                    <div style="font-weight:bold; font-size: 16px; white-space:nowrap;">Group By</div> 
                                    <select v-model="activeGroup" @change="handleSampleChange" style="width: 100%; max-width: 500px;">
                                        <option v-for="option in displayGroups.cellType" :value="option">{{ displayLabel(option) }}</option>
                                    </select>
                                    <b-icon icon="info-circle-fill" variant="secondary" @mouseover="showTooltip('Select primary annotation<br/>by which to group the data.')" @mouseout="hideTooltip()"></b-icon>
                                </div>
                                <!--
                                <div style="font-size:13px;">
                                    Select primary annotation by which to group the data.
                                </div>
                                -->
                            </div>

                            <div style="display: flex; flex-direction: column; gap:5px; width:300px;">
                                <div style="display: flex; gap:5px; align-items: center;">
                                    <div style="font-weight:bold; font-size: 16px; white-space:nowrap;">Stratify By</div> 
                                    <select style="width: 100%; width:200px" @change="selectSegmentBy(cellCompositionVars.displayByLabel, $event.target.value)">
                                        <option value="">--Select--</option>
                                        <option v-for="(value, key) of traitFields.show" :value="key">
                                            {{ displayLabel(key) }}
                                        </option>
                                        <optgroup v-if="Object.keys(traitFields.hide).length>0" label="Unused">
                                            <option v-for="(value, key) of traitFields.hide" :value="key" disabled>
                                                {{ displayLabel(key) }}
                                            </option>
                                        </optgroup>
                                    </select>
                                    <b-icon icon="info-circle-fill" variant="secondary" @mouseover="showTooltip('Select secondary annotation<br/>by which to stratify grouped data.')" @mouseout="hideTooltip()"></b-icon>
                                </div>
                                <!--
                                <div style="font-size:13px;">
                                    Select secondary annotation by which to stratify grouped data.
                                </div>
                                -->
                            </div>

                        </div>
                        <div style="display: flex; gap:20px">
                            <!-- cell counts -->
                            <div style="display: flex; flex-direction: column; flex:1; max-width:50%; gap:20px; padding: 20px; background: white;">
                                <div style="display:flex; justify-content: space-between; gap:10px">
                                    <div style="font-size: 16px;">
                                        <span style="font-weight: bold">{{isATACseq ? 'Nuclei' : 'Cell'}} {{ isNormalized ? 'Proportion' : 'Count' }}</span> 
                                        <template v-if="displayFields && cellCompositionVars.segmentByLabel && displayFields[cellCompositionVars.segmentByLabel].dataType==='cat'">
                                            by <span style="font-style: italic;">{{ displayLabel(cellCompositionVars.displayByLabel) }}</span>
                                            per <span style="font-style: italic;">{{ displayLabel(cellCompositionVars.segmentByLabel) }}</span> 
                                            </template>
                                            <template v-else-if="cellCompositionVars.segmentByLabel">
                                            by <span style="font-style: italic;">{{ displayLabel(cellCompositionVars.segmentByLabel) }}</span> 
                                            per <span style="font-style: italic;">{{ displayLabel(cellCompositionVars.displayByLabel) }}</span>
                                        </template>
                                        <template v-else>
                                            by <span style="font-style: italic;">{{ displayLabel(cellCompositionVars.displayByLabel) }}</span>
                                        </template>
                                        <template v-if="displayFields && cellCompositionVars.segmentByLabel && displayFields[cellCompositionVars.segmentByLabel].dataType==='cont'">
                                            <div style="font-size: 12px;">
                                                Each point represents the average {{isATACseq ? 'nuclei' : 'cell'}} {{ isNormalized ? 'proportion' : 'distribution' }} per {{ this.aggregateType }}
                                            </div>
                                        </template>
                                    </div>

                                    <download-chart 
                                        class="download"
                                        :chartId="countDownloadChartId"
                                        :titleText="countSectionTitle"
                                        style="width: 125px; align-self: flex-start;"
                                        :style="`${countDownloadDisabled ? 'pointer-events:none; opacity:0.5' : ''}`"
                                    />
                                </div>
    
                                <div v-if="!cellCompositionVars.segmentByLabel || (displayFields && displayFields[cellCompositionVars.segmentByLabel].dataType==='cat')" style="display:flex; flex-direction: column; gap:5px">
                                    <research-stacked-bar-plot
                                        :data="cellCompositionVars.segmentByCounts2"
                                        :primaryKey="cellCompositionVars.segmentByLabel ? cellCompositionVars.segmentByLabel : cellCompositionVars.displayByLabel"
                                        :subsetKey="cellCompositionVars.segmentByLabel ? cellCompositionVars.displayByLabel : cellCompositionVars.segmentByLabel"
                                        :xAxisLabel="cellCompositionVars.segmentByLabel ? displayLabel(cellCompositionVars.segmentByLabel) : displayLabel(cellCompositionVars.displayByLabel)"
                                        :yAxisLabel="`${isNormalized?('Percent of ' + (isATACseq ? 'Nuclei' :'Cells')):('Number of ' + (isATACseq ? 'Nuclei' : 'Cells'))}`"
                                        :highlightKey="cellCompositionVars.highlightLabel"
                                        :normalize="isNormalized"
                                        :stack="cellCompositionVars.segmentByLabel ? true : false"
                                    />
                                    <div style="font-size:12px; opacity:0.5">{{ cellCompositionVars.segmentByLabel ? displayLabel(cellCompositionVars.displayByLabel) : displayLabel(cellCompositionVars.segmentByLabel) }}</div>
                                    <research-single-cell-selector 
                                        :data="fields['metadata_labels_sorted'] || fields['metadata_labels']"
                                        layout="list"
                                        listDirection="horizontal"
                                        listAlignment="start"
                                        :colors="labelColors"
                                        :selectedField="cellCompositionVars.segmentByLabel ? cellCompositionVars.displayByLabel : cellCompositionVars.segmentByLabel"
                                        @on-update="handleSelectorUpdate($event)"
                                        @on-hover="handleSelectorHover($event)"
                                    />
                                </div>
    
                                <div v-if="contCountResults" id="sc_count_scatter_group">
                                    <div style="font-size:12px; opacity:0.5">{{ displayLabel(cellCompositionVars.displayByLabel) }}</div>
                                    <div style="display:flex; flex-wrap: wrap; gap: 10px;">
                                        <div v-for="item in contCountResults" style="min-width: 250px; flex:1;">
                                            <div>{{ item.groupKey }}</div>
                                            <research-scatter-plot 
                                                :data="item.data"
                                                :width="300"
                                                :height="150"
                                                :xKey="cellCompositionVars.segmentByLabel"
                                                yKey="cell_proportion"
                                                :xLabel="displayLabel(cellCompositionVars.segmentByLabel)"
                                                yLabel="Cell Proportion"
                                                :yDomain="[0, 1]"
                                                renderAs="svg"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- gene expression -->
                            <div v-if="geneExpressionVars.expressionStats.length>0" style="display: flex; flex-direction: column; flex:1; max-width:50%; gap:20px; padding: 20px; background: white;">
                                <div style="display:flex; flex-direction: column; gap: 3px;">
                                    <div style="display:flex; justify-content: space-between; gap:10px">
                                        <span style="font-size: 16px;">
                                            <span style="font-weight: bold;">{{ geneExpressionVars.selectedGene }} {{ isATACseq ? 'Chromatin Accessibility' : 'Expression' }}</span>
                                            <template v-if="displayFields && cellCompositionVars.segmentByLabel && displayFields[cellCompositionVars.segmentByLabel].dataType==='cat'">
                                                by <span style="font-style: italic;">{{ displayLabel(cellCompositionVars.displayByLabel) }}</span>
                                                per <span style="font-style: italic;">{{ displayLabel(cellCompositionVars.segmentByLabel) }}</span> 
                                            </template>
                                            <template v-else-if="cellCompositionVars.segmentByLabel">
                                                by <span style="font-style: italic;">{{ displayLabel(cellCompositionVars.segmentByLabel) }}</span> 
                                                per <span style="font-style: italic;">{{ displayLabel(cellCompositionVars.displayByLabel) }}</span>
                                            </template>
                                            <template v-else>
                                                by <span style="font-style: italic;">{{ displayLabel(cellCompositionVars.displayByLabel) }}</span>
                                            </template>
                                            <template v-if="displayFields && cellCompositionVars.segmentByLabel && displayFields[cellCompositionVars.segmentByLabel].dataType==='cont'">
                                                <div style="font-size: 12px;">
                                                    Each point represents the average {{ isATACseq ? 'chromatin accessibility' : 'gene expression' }} per {{ this.aggregateType }}
                                                </div>
                                            </template>
                                            <div v-if="!coordinates" style="display:flex; flex-direction: column; gap:5px">
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
                                            </div>
                                        </span>

                                        <download-chart 
                                            class="download"
                                            :chartId="expressionDownloadChartId"
                                            :titleText="expressionSectionTitle"
                                            style="width: 125px; align-self: flex-start;"
                                            :style="`${expressionDownloadDisabled ? 'pointer-events:none; opacity:0.5' : ''}`"
                                        />
                                    </div>
                                    <div
                                        v-if="showStratifyPlotTypeSelect"
                                        style="display:flex; gap:5px; align-items:center; align-self: flex-end;"
                                    >
                                        <div style="font-size:12px; white-space:nowrap; opacity:0.7;">Plot type</div>
                                        <select
                                            v-model="stratifyPlotType"
                                            style="width: 125px;"
                                        >
                                            <option
                                                v-for="option in stratifyPlotTypeOptions"
                                                :key="option"
                                                :value="option"
                                            >
                                                {{ stratifyPlotTypeLabel(option) }}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                                
                                
    
    
                                <div v-if="!contExprResults" style="display:flex; flex-direction: column; gap:5px">
                                    <template v-if="cellCompositionVars.segmentByLabel===''">
                                        <research-violin-plot
                                            :data="geneExpressionVars.expressionStats"
                                            :primaryKey="geneExpressionVars.selectedLabel"
                                            :subsetKey="cellCompositionVars.segmentByLabel"
                                            :highlightKey="cellCompositionVars.highlightLabel"
                                            :height="300"
                                            xAxisLabel="Log-Normalized Expression"
                                            :xAxisLabel="isATACseq ? 'Gene Activity Score' : 'Log-Normalized Expression'"
                                            :yAxisLabel="displayLabel(geneExpressionVars.selectedLabel)"
                                        />
                                        <div style="font-size:12px; opacity:0.5">{{ displayLabel(cellCompositionVars.segmentByLabel) }}</div>
                                        <research-single-cell-selector
                                            :data="fields['metadata_labels_sorted'] || fields['metadata_labels']"
                                            layout="list"
                                            listDirection="horizontal"
                                            listAlignment="start"
                                            :colors="labelColors"
                                            :selectedField="cellCompositionVars.segmentByLabel"
                                            @on-update="handleSelectorUpdate($event)"
                                            @on-hover="handleSelectorHover($event)"
                                        />
                                    </template>
                                    <template v-else>
                                        <research-dot-plot v-if="stratifyPlotType==='dot'"
                                            style="display:flex; align-self: center"
                                            :data="getAllStats()"
                                            :xKey="cellCompositionVars.segmentByLabel"
                                            :yKey="geneExpressionVars.selectedLabel"
                                            :xLabel="displayLabel(cellCompositionVars.segmentByLabel)"
                                            :yLabel="displayLabel(geneExpressionVars.selectedLabel)"
                                            fillKey="mean"
                                            sizeKey="pctExpr"
                                            :fitToSize="true"
                                            :cellWidth="30"
                                            highlightKey=""
                                            :colorScale="expressionColorScale"
                                            :colorScaleMode="dotPlotColorScaleMode"
                                        />
                                        <research-violin-plot
                                            v-else-if="stratifyPlotType==='combined'"
                                            :data="geneExpressionVars.expressionStats"
                                            :primaryKey="cellCompositionVars.segmentByLabel"
                                            :subsetKey="geneExpressionVars.selectedLabel"
                                            :facetRows="true"
                                            :facetRowHeight="55"
                                            :facetAxisLabel="displayLabel(geneExpressionVars.selectedLabel)"
                                            :highlightKey="cellCompositionVars.highlightLabel"
                                            :height="320"
                                            xAxisLabel="Log-Normalized Expression"
                                            :xAxisLabel="isATACseq ? 'Gene Activity Score' : 'Log-Normalized Expression'"
                                            :yAxisLabel="displayLabel(cellCompositionVars.segmentByLabel)"
                                            :range="[minExpressionValue(geneExpressionVars.selectedGene), maxExpressionValue(geneExpressionVars.selectedGene)]"
                                        />
                                        <div id="sc_violin_plot_group" v-else>
                                            <div style="font-size:12px; opacity:0.5">{{ displayLabel(cellCompositionVars.segmentByLabel) }}</div>
                                            <div v-for="value in (fields['metadata_labels_sorted'] || fields['metadata_labels'])[cellCompositionVars.segmentByLabel]">
                                                <div style="display:flex; gap:3px; align-items: baseline;">
                                                    <div style="font-weight: bold;">{{ value }}</div>
                                                </div>
                                                <research-violin-plot
                                                    :data="getStatsByPropValue(geneExpressionVars.expressionStats, cellCompositionVars.segmentByLabel, value)"
                                                    :primaryKey="geneExpressionVars.selectedLabel" 
                                                    :highlightKey="cellCompositionVars.highlightLabel"
                                                    :height="300"
                                                    xAxisLabel="Log-Normalized Expression"
                                                    :yAxisLabel="displayLabel(geneExpressionVars.selectedLabel)"
                                                    :range="[minExpressionValue(geneExpressionVars.selectedGene), maxExpressionValue(geneExpressionVars.selectedGene)]"
                                                />
                                            </div>
                                        </div>
                                    </template>
                                </div>
    
                                <div v-if="contExprResults" id="sc_expression_scatter_group">
                                    <div style="font-size:12px; opacity:0.5">{{ displayLabel(cellCompositionVars.displayByLabel) }}</div>
                                    <div style="display:flex; flex-wrap: wrap; gap: 10px">
                                        <div v-for="item in contExprResults" style="min-width: 250px; flex:1;">
                                            <div>{{ item.groupKey }}</div>
                                            <research-scatter-plot 
                                                :data="item.data"
                                                :width="300"
                                                :height="150"
                                                :xKey="cellCompositionVars.segmentByLabel"
                                                :yKey="geneExpressionVars.selectedGene"
                                                :xLabel="displayLabel(cellCompositionVars.segmentByLabel)"
                                                yLabel="Log-Norm. Expression"
                                                :yDomain="[0, Math.ceil(maxExpressionValue(geneExpressionVars.selectedGene))]"
                                                renderAs="svg"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Marker genes -->
                    <div style="display:flex; gap:25px">
                        <div v-if="markers && (markerGenes || expressionStatsAll.length>0)" style="display:flex; flex-direction: column; gap:20px; background:white; padding:20px; width:100%">
                            <div style="display:flex; flex-direction: column; gap:20px; min-width: 50%;">
                                <div style="display:flex; justify-content: space-between;">
                                    <div style="display:flex; flex-direction: column;">
                                        <div style="display:flex; gap: 10px">
                                            <strong style="font-size: 16px;">
                                                <!--
                                                {{ dotPlotCellType!=""?`Marker Genes for ${dotPlotCellType}` : 'Top Marker Genes by Cell Type' }}
                                                -->
                                                Top Marker Genes for
                                            </strong>
                                            <select @change="showMarkersByCellType($event.target.value)" v-model="dotPlotCellType">
                                                <option value="">All</option>
                                                <option v-for="label in markerCellTypes" :value="label">
                                                    {{ label }}
                                                </option>
                                            </select>
                                            <select v-if="markerFileOptions.length" v-model="markerFile" @change="handleMarkerFileChange()">
                                                <option v-for="file in markerFileOptions" :value="file">{{ file.markerKeyLabel }}</option>
                                            </select>
                                            <strong v-else style="font-size: 16px;">Cell Types</strong>
                                        </div>
                                    </div>
                                    <download-chart 
                                    class="download"
                                    chartId="sc_marker_dot_plot"
                                    :titleText="markerDotPlotTitle"
                                    style="width: 125px; align-self: flex-start;"
                                    />
                                </div>
                                <div>
                                    <div style="font-size: 12px; opacity:0.5">Ranked by {{markersHaveZscores ? 'z-score' : 'mean expression'}}</div>
                                    <div style="font-size: 13px;">Select a type to view its full marker profile.</div>
                                </div>
                                
                                <!--
                                <div style="display:flex; justify-content: space-between;">
                                    <div style="display:flex; flex-direction: column;">
                                        <div style="display:flex; gap: 10px; align-items: baseline;">
                                            <div style="font-weight:bold; margin:0 0 5px">Type</div>
                                            <select @change="showMarkersByCellType($event.target.value)" v-model="dotPlotCellType">
                                                <option value="">All</option>
                                                <option v-for="label in markerCellTypes" :value="label">
                                                    {{ label }}
                                                </option>
                                            </select>
                                        </div>
                                        <div style="font-size: 13px;">Select a type to view its full marker profile.</div>
                                    </div>
                                    -->
                                    <!--
                                    <div style="display:flex; gap:5px" class="legends">
                                        <div style="display:flex; flex-direction: column;" class="legend">
                                            <div class="label">Mean Expression</div>
                                            <div class="gradient" :style="`background: linear-gradient(to right, ${colorScalePlasmaColorsArray});`"></div>
                                            <div style="display:flex" class="marks"><div>0.0</div><div>{{markerGenesMaxMean}}</div></div>
                                        </div>
                                        <div style="display:flex; flex-direction: column;" class="legend">
                                            <div class="label">% Cells Expressing</div>
                                            <div style="display:flex" class="circles">
                                                <div class="circleBorder"><div class="circle" style="height:20%"></div></div>
                                                <div class="circleBorder"><div class="circle" style="height:40%"></div></div>
                                                <div class="circleBorder"><div class="circle" style="height:60%"></div></div>
                                                <div class="circleBorder"><div class="circle" style="height:80%"></div></div>
                                                <div class="circleBorder"><div class="circle" style="height:100%"></div></div>
                                            </div>
                                            <div style="display:flex" class="marks"><div>0</div><div>100</div></div>
                                        </div>
                                    </div>
                                </div>
                                -->
    
                                <research-dot-plot
                                    style="display:flex; align-self: center"
                                    wrapperId="sc_marker_dot_plot"
                                    :data="markerGenes || expressionStatsAll"
                                    data-blah="pct_cells_expression"
                                    :yKey="markerFile.markerKey"
                                    xKey="gene"
                                    :yLabel="markerFile.markerKeyLabel"
                                    xLabel="Gene"
                                    fillKey="mean_expression"
                                    :sizeKey="markerGenesSizeKey"
                                    :fitToSize="true"
                                    :cellWidth="30"
                                    highlightKey=""
                                    :colorScale="expressionColorScale"
                                    :colorScaleMode="dotPlotColorScaleMode"
                                />
                            </div>
                            <b-table v-if="markerGenesTable"
                                    style="font-size:12px;"
                                    :items="markerGenesTable"
                                    :fields="markerTableColumns"
                                    striped
                                    hover
                                    small
                                    responsive="sm"
                                    head-variant="light"
                                    sticky-header="300px" 
                                >
                            </b-table>
                        </div>
                    </div>
                </div>

            </div>
            <!-- layout 1 (umap-expression, violins-expression/cell type)-->
            <div v-if="layout===1" style="display:flex; flex-direction:column; width:100%; align-self:center;">
                <research-single-cell-info 
                    :data="metadata"
                />
                <div v-if="dataReady" style="display:flex; gap:40px; flex:1">
                    <research-single-cell-selector 
                        :data="fields['metadata_labels_sorted'] || fields['metadata_labels']"
                        layout="dropdown-list"
                        :showSelect="false"
                        :colors="labelColors"
                        :selectedField="cellCompositionVars.colorByField"
                        @on-update="handleSelectorUpdate($event)"
                        @on-hover="handleSelectorHover($event)"
                        style="max-width: 200px;"
                    />
                    <div class="" style="display:flex; gap:20p; width:400px">
                        <div v-if="coordinates" style="display:flex; flex-direction: column; flex: 1">
                            <div style="display:flex; justify-content: space-between; align-items: baseline;">
                                <span style="font-size: 16px; margin: 0 0 5px;"><span style="font-weight: bold">{{ embeddingType }}</span> <span style="font-style: italic;">{{ geneExpressionVars.selectedGene ? `${geneExpressionVars.selectedGene}` : '' }}</span></span> {{ totalCells.toLocaleString() }} cells
                            </div>
                            <div style="display:flex; position: relative;">
                                <research-umap-plot-gl 
                                    :group="datasetId"
                                    :points="coordinates"
                                    :labels="fields"
                                    :colors="labelColors"
                                    :expression="expressionData[geneExpressionVars.selectedGene]"
                                    :expressionColorScale="expressionColorScale"
                                    :cellTypeField="cellCompositionVars.colorByField"
                                    :hoverFields="[]"
                                    :highlightLabel="cellCompositionVars.highlightLabel"
                                    :highlightLabels="cellCompositionVars.highlightLabels"
                                    :width="400"
                                    :height="400"
                                />
                                <!--
                                <research-umap-plot
                                    :sectionId="sectionId"
                                    title=""
                                    :points="coordinates"
                                    :fields="fields"
                                    :cellTypeField="cellTypeField"
                                    :colorByField="cellCompositionVars.colorByField"
                                    :hoverFields="['cell_label']"
                                    :expression="expressionData[geneExpressionVars.selectedGene]"
                                    :expressionGene="geneExpressionVars.selectedGene"
                                    :highlightLabel="cellCompositionVars.highlightLabel"
                                    :highlightLabels="cellCompositionVars.highlightLabels"
                                    :width="400"
                                    :labelSizePx="28"
                                />
                                -->
                                <!--
                                <div style="display:flex; flex-direction: column; position:absolute; top:4px; left:5px;" class="legend">
                                    <div class="label">Expression</div>
                                    <div class="gradient" :style="`background: linear-gradient(to right, ${colorScalePlasmaColorsArray}); height:5px;`"></div>
                                    <div style="display:flex" class="marks"><div>0.0</div><div>3.0</div></div>
                                </div>
                                -->
                            </div>
                        </div>
                    </div>
                    <div v-if="geneExpressionVars.expressionStats.length>0" style="display:flex; flex-direction: column; flex: 1">
                        <div style="display:flex; flex-direction: column; gap:5px">
                            <span style="font-size: 16px;"><span style="font-weight: bold;">Gene Expression</span> <span style="font-style: italic;">{{ geneExpressionVars.selectedGene ? `${geneExpressionVars.selectedGene}` : '' }}</span></span>
                        </div>
                        <research-violin-plot 
                            :data="geneExpressionVars.expressionStats"
                            :primaryKey="geneExpressionVars.selectedLabel"
                            :subsetKey="geneExpressionVars.subsetLabel"
                            :highlightKey="cellCompositionVars.highlightLabel"
                            :height="400"
                            xAxisLabel="Log-Normalized Expression"
                            :yAxisLabel="geneExpressionVars.selectedLabel"
                        />
                    </div>
                </div>
            </div>
            <!-- layout 2 (umap clusters)-->
            <div v-if="layout===2" style="display:flex; flex-direction:column; gap:20px; background:#f8f8f8; padding:20px; width:100%; min-width: 840px;">
                <div v-if="dataReady" class="" style="display:flex; flex-direction: column; gap:20px;">
                    <research-single-cell-info 
                        v-if="metadata"
                        :data="metadata"
                    />
                    <!-- UMAP feature plots-->
                    <div style="display: flex; gap:20px;">
                        <div v-if="coordinates" style="display:flex; gap:20px; flex:1; padding: 20px; background: white;">
                            <div v-if="colorByFields" style="display:flex; flex-direction: column; align-self: flex-start; width:400px;">
                                <strong style="font-size: 16px; margin: 0 0 5px;">Color By</strong>
                                <div style="display:flex; flex-direction: column; height: 400px; gap:5px">
                                    <select style="width: 100%;" @change="selectColorBy($event.target.value)" v-model="cellCompositionVars.colorByField">
                                        <option value="">--Select--</option>
                                        <option v-for="(value, key) of colorByFields.show" :value="key">
                                            {{ displayLabel(key) }}
                                        </option>
                                    </select>
                                    <div style="width: 100%; flex-grow:1; overflow-x: hidden; overflow-y: auto;">
                                        <research-single-cell-selector 
                                            :data="fields['metadata_labels_sorted'] || fields['metadata_labels']"
                                            :displayData="displayFields"
                                            :selectedField="cellCompositionVars.colorByField"
                                            layout="list"
                                            :colors="labelColors"
                                            @on-update="handleSelectorUpdate($event)"
                                            @on-hover="handleSelectorHover($event)"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div style="display:flex; flex-direction: column; width: min-content; flex: 1">
                                <div style="display:flex; justify-content: space-between; align-items: baseline; margin: 0 0 5px;">
                                    <div><strong style="font-size: 16px;">Embedding</strong> {{ embeddingType }}</div>
                                    <div>{{ totalCells.toLocaleString() }} cells</div>
                                </div>
                                <research-umap-plot-gl 
                                    :group="datasetId"
                                    :points="coordinates"
                                    :labels="fields"
                                    :colors="labelColors"
                                    :cellTypeField="cellCompositionVars.colorByField"
                                    :colorByField="cellCompositionVars.colorByField"
                                    :hoverFields="[]"
                                    :highlightLabel="cellCompositionVars.highlightLabel"
                                    :highlightLabels="cellCompositionVars.highlightLabels"
                                    :width="400"
                                    :height="400"
                                />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <!-- layout 1 (umap-expression, violins-expression/cell type)-->
            <div v-if="layout===3" style="display:flex; flex-direction:column; width:100%; align-self:center;">
                <research-single-cell-info 
                    :data="metadata"
                />
                <div v-if="dataReady" style="display:flex; gap:40px; flex:1">
                    <div style="display: flex; flex-direction: column; gap:20px; flex: 1;">
                        <!-- cell counts -->
                        <div style="display: flex; flex-direction: column; flex:1; gap:20px; padding:20px; background: white;">
                            <div style="display:flex; justify-content: space-between; gap:10px">
                                <div style="font-size: 16px;">
                                    <span style="font-weight: bold">{{isATACseq ? 'Nuclei' : 'Cell'}} {{ isNormalized ? 'Proportion' : 'Count' }}</span> 
                                    <template v-if="displayFields && cellCompositionVars.segmentByLabel && displayFields[cellCompositionVars.segmentByLabel].dataType==='cat'">
                                        by <span style="font-style: italic;">{{ displayLabel(cellCompositionVars.displayByLabel) }}</span>
                                        per <span style="font-style: italic;">{{ displayLabel(cellCompositionVars.segmentByLabel) }}</span> 
                                        </template>
                                        <template v-else-if="cellCompositionVars.segmentByLabel">
                                        by <span style="font-style: italic;">{{ displayLabel(cellCompositionVars.segmentByLabel) }}</span> 
                                        per <span style="font-style: italic;">{{ displayLabel(cellCompositionVars.displayByLabel) }}</span>
                                    </template>
                                    <template v-else>
                                        by <span style="font-style: italic;">{{ displayLabel(cellCompositionVars.displayByLabel) }}</span>
                                    </template>
                                    <template v-if="displayFields && cellCompositionVars.segmentByLabel && displayFields[cellCompositionVars.segmentByLabel].dataType==='cont'">
                                        <div style="font-size: 12px;">
                                            Each point represents the average {{isATACseq ? 'nuclei' : 'cell'}} {{ isNormalized ? 'proportion' : 'distribution' }} per {{ this.aggregateType }}
                                        </div>
                                    </template>
                                </div>

                                <download-chart 
                                    class="download"
                                    :chartId="countDownloadChartId"
                                    :titleText="countSectionTitle"
                                    style="width: 125px; align-self: flex-start;"
                                    :style="`${countDownloadDisabled ? 'pointer-events:none; opacity:0.5' : ''}`"
                                />
                            </div>

                            <div v-if="!cellCompositionVars.segmentByLabel || (displayFields && displayFields[cellCompositionVars.segmentByLabel].dataType==='cat')" style="display:flex; flex-direction: column; gap:5px">
                                <research-stacked-bar-plot
                                    :data="cellCompositionVars.segmentByCounts2"
                                    :primaryKey="cellCompositionVars.segmentByLabel ? cellCompositionVars.segmentByLabel : cellCompositionVars.displayByLabel"
                                    :subsetKey="cellCompositionVars.segmentByLabel ? cellCompositionVars.displayByLabel : cellCompositionVars.segmentByLabel"
                                    :xAxisLabel="cellCompositionVars.segmentByLabel ? displayLabel(cellCompositionVars.segmentByLabel) : displayLabel(cellCompositionVars.displayByLabel)"
                                    :yAxisLabel="`${isNormalized?('Percent of ' + (isATACseq ? 'Nuclei' :'Cells')):('Number of ' + (isATACseq ? 'Nuclei' : 'Cells'))}`"
                                    :highlightKey="cellCompositionVars.highlightLabel"
                                    :normalize="isNormalized"
                                    :stack="cellCompositionVars.segmentByLabel ? true : false"
                                />
                                <div style="font-size:12px; opacity:0.5">{{ cellCompositionVars.segmentByLabel ? displayLabel(cellCompositionVars.displayByLabel) : displayLabel(cellCompositionVars.segmentByLabel) }}</div>
                                <research-single-cell-selector 
                                    :data="fields['metadata_labels_sorted'] || fields['metadata_labels']"
                                    layout="list"
                                    listDirection="horizontal"
                                    listAlignment="start"
                                    :colors="labelColors"
                                    :selectedField="cellCompositionVars.segmentByLabel ? cellCompositionVars.displayByLabel : cellCompositionVars.segmentByLabel"
                                    @on-update="handleSelectorUpdate($event)"
                                    @on-hover="handleSelectorHover($event)"
                                />
                            </div>

                            <div v-if="contCountResults" id="sc_count_scatter_group">
                                    <div style="font-size:12px; opacity:0.5">{{ displayLabel(cellCompositionVars.displayByLabel) }}</div>
                                <div style="display:flex; flex-wrap: wrap; gap: 10px;">
                                    <div v-for="item in contCountResults" style="min-width: 250px; flex:1;">
                                        <div>{{ item.groupKey }}</div>
                                        <research-scatter-plot 
                                            :data="item.data"
                                            :width="300"
                                            :height="150"
                                            :xKey="cellCompositionVars.segmentByLabel"
                                            yKey="cell_proportion"
                                            :xLabel="displayLabel(cellCompositionVars.segmentByLabel)"
                                            yLabel="Cell Proportion"
                                            :yDomain="[0, 1]"
                                            renderAs="svg"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Marker genes -->
                        <div style="display:flex; gap:25px">
                            <div v-if="markers && (markerGenes || expressionStatsAll.length>0)" style="display:flex; flex-direction: column; gap:20px; background:white; padding:20px; width:100%">
                                <div style="display:flex; flex-direction: column; gap:20px; min-width: 50%;">
                                    <div style="display:flex; justify-content: space-between;">
                                        <div style="display:flex; flex-direction: column;">
                                            <strong style="font-size: 16px;">{{ dotPlotCellType!=""?`Marker Genes for ${dotPlotCellType}` : 'Top Marker Genes by Cell Type' }}</strong>
                                            <div  style="font-size:12px; opacity:0.5">Ranked by {{markersHaveZscores ? 'z-score' : 'mean expression'}}</div>
                                        </div>
                                        <div style="display:flex; gap:20px">
                                            <download-chart 
                                                class="download"
                                                chartId="sc_dot_plot"
                                                style="width: 125px; align-self: flex-start;"
                                            />
                                        </div>
                                        
                                    </div>

                                    <research-dot-plot
                                        style="display:flex; align-self: center"
                                        :data="markerGenes || expressionStatsAll"
                                        data-blah="pct_cells_expression"
                                        :yKey="markerFile.markerKey"
                                        xKey="gene"
                                        :yLabel="markerFile.markerKeyLabel"
                                        xLabel="Gene"
                                        fillKey="mean_expression"
                                        :sizeKey="markerGenesSizeKey"
                                        :fitToSize="true"
                                        :cellWidth="30"
                                        highlightKey=""
                                        :colorScale="expressionColorScale"
                                        :colorScaleMode="dotPlotColorScaleMode"
                                    />
                                </div>
                                <b-table v-if="markerGenesTable"
                                        style="font-size:12px;"
                                        :items="markerGenesTable"
                                        :fields="markerTableColumns"
                                        striped
                                        hover
                                        small
                                        responsive="sm"
                                        head-variant="light"
                                        sticky-header="300px" 
                                    >
                                </b-table>
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    </div>
</template>
  
<script>
    /*
    sample render config:
    {
        "type": "cell browser",
        "label": "Single Cell Browser",

        ///
            (optional) url parameter names
            this is only really needed with 2+ cell browser components on same page
            TODO: check optionality - should have defaults if omitted
        ///
        "parameters":{
            "datasetId": "XXXdatasetId",
            "gene": "XXXgene"
        },

        ///
            (required) desired bioindex url where api enpoints are localed
            "bioIndexDev" will be used if detected subdomain contains 'dev' or port is 8000
            TODO: make something default?
            TODO: handle trailing slash
        ///
        "bioIndex": "https://bioindex.pankbase.org",
        "bioIndexDev": "https://bioindex-dev.pankbase.org",

        ///
            (optional) formatting params
            can be applied to all datasets in a bioindex
            and/or a specific dataset
            TODO: add a dataset specific example
        ///
        "format":{
            //"default" formatting for all datasets in a bioindex
            "default":{
                ///
                    displayMap allows you to define user readable labels 
                        for your dataset column names
                    each key in displayMap should match a key in fields.metadata_labels
                        from the fields enpoint of your bioindex
                    the value of each key should be the desired label to display
                    otherwise the key name will be used for display
                ///
                "displayMap":{
                    "biosample_id": "Biosample ID",
                    this.donorsField: "Donor ID",
                    "disease__ontology_label": "Disease",
                    "cell_type__author": "Cell Type",
                    "bmi": "BMI",
                    "bmi__group": "BMI Group",
                    "custom__cell_cycle__phase": "Cell Cycle Phase",
                    "custom__author_cell_substype": "Cell Sub-Type",
                    "custom__development_stage__ontology_label": "Development Stage",
                    "custom__organism_age": "Age (years)",
                    "custom__organism_age__group": "Age Group (years)"
                },

                ///
                    define the columns in your data for a few default categories
                    used for selecting the appropriate fields for display and visualizations
                ///
                "groups":{
                    "cellType": "cell_type__author",
                    "cellSubType": "custom__author_cell_substype",
                    "donors": this.donorsField,
                    "samples": "biosample_id"
                }
            }
            ///
                in addition to default settings, you can specify same settings per datasetId
            ///
            "<some_dataset_ID>":{
                "displayMap": {},
                "annotationGroups": {},    
            }
        }
    }
    */

    import * as d3 from 'd3';
    import Vue, { shallowRef } from 'vue';
    import keyParams from "@/utils/keyParams";
    import EventBus from "@/utils/eventBus";
    import {llog} from "./llog.js";
    import mouseTooltip from '@/components/researchPortal/singleCellBrowser/mouseTooltip.js';
    import * as scUtils from "@/components/researchPortal/singleCellBrowser/singleCellUtils.js"
    import ResearchUmapPlotGL from "@/components/researchPortal/singleCellBrowser/ResearchUmapPlotGL.vue";
    import ResearchStackedBarPlot from "@/components/researchPortal/singleCellBrowser/ResearchStackedBarPlot.vue";
    import ResearchStackedBarPlot2 from "@/components/researchPortal/singleCellBrowser/ResearchStackedBarPlot2.vue";
    import ResearchDotPlot from "@/components/researchPortal/singleCellBrowser/ResearchDotPlot.vue";
    import ResearchViolinPlot from "@/components/researchPortal/singleCellBrowser/ResearchViolinPlot.vue";
    import ResearchScatterPlot from "@/components/researchPortal/singleCellBrowser/ResearchScatterPlot.vue";
    import ResearchSingleCellSelector from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellSelector.vue";
    import ResearchSingleCellInfo from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellInfo.vue";
    import DownloadChart from "@/components/researchPortal/singleCellBrowser/DownloadChart.vue"

    const colors = ["#007bff","#048845","#8490C8","#BF61A5","#EE3124","#FCD700","#5555FF","#7aaa1c","#F88084","#9F78AC","#F5A4C7","#CEE6C1","#cccc00","#6FC7B6","#D5A768","#d4d4d4"]

    export default Vue.component('research-single-cell-browser', {
        components: {
            ResearchUmapPlotGL,
            ResearchStackedBarPlot,
            ResearchDotPlot,
            ResearchViolinPlot,
            ResearchScatterPlot,
            ResearchSingleCellSelector,
            ResearchSingleCellInfo,
            DownloadChart
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
                //TODOL move these to an external config
                singleCellBI:[
                    {
                        name: "PanKbase",
                        bioIndex: "https://skin.hugeampkpnbi.org"
                    },{
                        name: "CFDE",
                        bioIndex: "https://cfde.hugeampkpnbi.org"
                    },{
                        name: "MATKP",
                        bioIndex: "https://matkp.hugeampkpnbi.org"
                    },{
                        name: "FNIH",
                        bioIndex: "https://bioindex-dev.hugeamp.org"
                    }
                ],
                BIendpoints:{
                    metadata: "/api/raw/file/single_cell_all_metadata/dataset_metadata.json.gz",
                    fields: "/api/raw/file/single_cell/$datasetId/fields.json.gz",
                    coordinates: "/api/raw/file/single_cell/$datasetId/coordinates.tsv.gz",
                    expression: "/api/bio/query/single-cell-lognorm?q=$datasetId,$gene",
                    markers: "/api/raw/file/single_cell/$datasetId/"
                    //markers: "/api/raw/file/single_cell/$datasetId/marker_genes.json.gz"
                    //markers: "/api/raw/file/single_cell/$datasetId/marker_genes.ganglion.json.gz"
                },

                //if a dataset has multiple marker gene files
                //dataset_metadata.json will contain a field called marker_gene_files
                //their structure looks like this
                BImarkersDefaultFile: {
                    output_file: "marker_genes.json.gz",
                    marker_gene_level: "cell_type__kp",
                    markerKey: "cell_type",                 //this field is enriched later
                    markerKeyLabel: "Cell Type",            //this field is enriched later
                },

                allMetadata: null, //raw metadata for all datasets
                singleCellMetadata: null, //raw metadata for single-cell datasets
                metadata: null, //raw metadata for current dataset
                fields: null,   //raw fields
                coordinates: null,  //raw coordinates
                markers: null, //raw marker genes

                datasetId: null,

                totalCells: null,
                embeddingType: 'UMAP',

                cellTypeField: null,
                donorsField: null,
                samplesField: null,
                aggregateField: null,
                aggregateType: null,

                activeGroup: null,
                stratifyPlotType: "violin",
                stratifyPlotTypeOptions: ["violin", "combined", "dot"],
                expressionColorScale: "blue",
                expressionColorScaleOptions: ["red", "blue"],

                dotPlotColorScaleMode: null,

                displayFields: null,
                displayGroups: null,
                traitFields: null,
                colorByFields: null,

                contCountResults: null,
                contExprResults: null,

                viewType: 1,
                
                baseTableColumns: [
                    {key: "tissue", label: "Tissue", class:"capitalize"},
                    {key: "depot", label: "Depot", class:"capitalize"}, 
                    {key: "totalDonors", label: "Donors", formatter: (val) => val?.toLocaleString(), thClass: 'text-right', tdClass: 'text-right', thStyle: { width: '150px' }},
                    {key: "totalBiosamples", label: "Biosamples", formatter: (val) => val?.toLocaleString(), thClass: 'text-right', tdClass: 'text-right', thStyle: { width: '150px' }},
                    {key: "totalSamples", label: "Samples", formatter: (val) => val?.toLocaleString(), thClass: 'text-right', tdClass: 'text-right', thStyle: { width: '150px' }},
                ],
                currentDatasetsPage: 1,
                totalDatasets: null,
                datasetsPerPage: null,

                presetsConfig: null,

                showDatasetSelect: false,

                //colorIndex: 0,
                //colorScaleIndex: d3.scaleOrdinal(colors),
                colorscaleGreyBlue: d3.scaleLinear().domain([0, 1]).range(["lightgrey", "blue"]),
                colorScalePlasma: d3.scaleSequential(d3.interpolatePlasma),
                colorScalePlasmaColorsArray: [],
                colorScaleGreyBlueColorsArray: [],

                labelColors: null,
                fieldsDisplayList: null,

                isStacked: false,
                isNormalized: true,

                geneNames: [], //list of loaded gene names
                sortedGeneNames: [],
                expressionData: {}, //obj, keys are gene names, values are arrays of raw expression per cell
                expressionStatsAll: [], //array of objects, each obj is gene, mean expr., pct. expressing
                geneToSearch: "",
                geneLoading: null,
                genesNotFound: [],

                markersList: null,
                markerCellTypes: null,
                markerGenes: null,
                markerGenesTable: null,
                markersByGene: null,
                markersByCellType: null,
                markerGenesMaxMean: 3.0,
                dotPlotCellType: "",
                markerFileOptions: [],
                markerFile: null,
                markersHaveZscores: false,
                markerTableColumns: null,
                markerDesiredColumns: [
                    {
                        key: 'cell_type',
                        label: 'Cell Type'
                    },{
                        key: 'Ganglion',
                        label: 'Ganglion'
                    },{
                        key: 'gene',
                        label: 'Gene'
                    },{
                        key: 'mean_expression',
                        label: 'Mean Expression',
                        sortable: true,
                        formatter: (val) => typeof val === 'number' ? val.toPrecision(3) : ''
                    },{
                        key: 'pct_cells_expression',
                        label: '% Expressing',
                        sortable: true,
                        formatter: (val) => typeof val === 'number' ? (val * this.markersPctScaleAdjust).toFixed(1) + '%' : ''
                    },{
                        key: 'p_value_adj',
                        label: 'Adj. P-Value',
                        sortable: true,
                        formatter: (val) => typeof val === 'number' ? val.toPrecision(3) : ''
                    },{
                        key: 'log_fold_change',
                        label: 'Log Fold Change',
                        sortable: true,
                        formatter: (val) => typeof val === 'number' ? val.toPrecision(3) : ''
                    },{
                        key: 'z_score',
                        label: 'Z-score',
                        sortable: true,
                        formatter: (val) => typeof val === 'number' ? val.toPrecision(3) : ''
                    }
                ],

                geneLists: {
                    ["searched genes"]: [],
                    ["marker genes"]: []
                },

                dataLoaded: false,
                preloadItem: '',
                dataReady: false,

                highlightHoverTimeout: null,

                layout: -1,
                layoutOptions: [
                    {
                        name: 'option0',
                        value: 0
                    },{
                        name: 'option1',
                        value: 1
                    },{
                        name: 'option2',
                        value: 2
                    }
                ],

                cellCompositionVars: {},
                geneExpressionVars: {},

                testCellProportions: null,

                testCellStats: null,
            }
        },
        watch: {
            expressionData(){
                const expressionStats = [];
                Object.keys(this.expressionData).forEach(gene => {
                    expressionStats.push(...scUtils.calcExpressionStats(this.fields, this.labelColors, this.expressionData[gene], gene, this.cellTypeField, null, true))
                })
                this.expressionStatsAll = expressionStats;
                //llog('updated expression stats', this.expressionStatsAll);
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
            llog('renderConfig', this.renderConfig);
            llog('portal', this.portalGroup);
            llog('data', this.data);
            
            EventBus.$on('on-select',this.handleSelectEvent);
            this.init();
        },
        beforeDestroy(){
            EventBus.$off('on-select',this.handleSelectEvent);
        },
        computed: {
            isDev(){
                return keyParams['dev']===1;
            },
            portalGroup(){
                const hostname = window.location.hostname;
                const isHugeamp = (hostname === 'hugeamp.org') || hostname.endsWith('.hugeamp.org');
                const isLocalhost = hostname.includes('localhost');
                const parts = hostname.split('.');
                let subdomain = null;
                if(isLocalhost){
                    if (parts.length === 2 && parts[0] !== 'www' && parts[0] !== 'dev') {
                        subdomain = parts[0];
                    }
                }else if(isHugeamp){
                    if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'dev') {
                        subdomain = parts[0];
                    }
                }
                
                return subdomain;
            },
            isATACseq(){
                if(this.metadata?.["method"]?.toLowerCase().includes('atac')){
                    return true;
                }
                return false;
            },
            selectedBI(){
                const domain = window.location.hostname;
                const port = window.location.port;
                const isDev = domain.includes("localhost") || domain.includes('dev') || port === '8000';
                
                let bi;
                if(keyParams["bioIndex"]){
                    bi = keyParams["bioIndex"];
                }else if(isDev && this.renderConfig["bioIndexDev"]){
                    bi = this.renderConfig["bioIndexDev"];
                }else if(this.renderConfig["bioIndex"]){
                    bi = this.renderConfig["bioIndex"];
                }else{
                    llog("No BioIndex provided.")
                }

                llog("index", {
                    domain,
                    isDev: isDev,
                    biInUrlParam: keyParams["bioIndex"],
                    biInConfig: this.renderConfig["bioIndex"],
                    biDevInConfig: this.renderConfig["bioIndexDev"],
                    using: bi
                })

                return bi;
            },
            markerGenesSizeKey(){
                //todo: remove this after marker_genes endpoint data struct is standardized
                console.log('markerGenesSizeKey', this.markerGenes);
                if(!this.markerGenes) return null;
                if(this.markerGenes[0].pct_nz_group) return 'pct_nz_group';
                if(this.markerGenes[0].pct_cells_expression) return 'pct_cells_expression';
            },
            showDepotColumn() {
                //check if metadata has depot column values
                return (
                    Array.isArray(this.singleCellMetadata) && this.singleCellMetadata.some(
                        row => row.depot != null && row.depot !== ""
                    )
                )
            },
            tableColumns() {
                //updates dataset select table columns based on rules
                return this.baseTableColumns.filter(col => {
                    if (col.key === "depot") {
                        return this.showDepotColumn
                    }
                    return true
                })
            },
            markersPctScaleAdjust() {
                if(!this.markerGenes) return;
                const scaleAdjust = Math.max(...this.markerGenes.map(d => d.pct_cells_expression)) <= 1 ? 100 : 1;
                return scaleAdjust;
            },
            countDownloadChartId() {
                if(this.contCountResults){
                    return 'sc_count_scatter_group';
                }
                return 'sc_stacked_bar_plot';
            },
            countSectionTitle() {
                const metric = `${this.isATACseq ? 'Nuclei' : 'Cell'} ${this.isNormalized ? 'Proportion' : 'Count'}`;
                if(this.displayFields && this.cellCompositionVars.segmentByLabel && this.displayFields[this.cellCompositionVars.segmentByLabel].dataType === 'cat'){
                    return `${metric} by ${this.displayLabel(this.cellCompositionVars.displayByLabel)} per ${this.displayLabel(this.cellCompositionVars.segmentByLabel)}`;
                }
                if(this.cellCompositionVars.segmentByLabel){
                    return `${metric} by ${this.displayLabel(this.cellCompositionVars.segmentByLabel)} per ${this.displayLabel(this.cellCompositionVars.displayByLabel)}`;
                }
                return `${metric} by ${this.displayLabel(this.cellCompositionVars.displayByLabel)}`;
            },
            countDownloadDisabled() {
                return false;
            },
            markerDotPlotTitle() {
                return `Top Marker Genes for ${this.dotPlotCellType || 'All'} (${this.markerFile?.markerKeyLabel || 'Cell Types'})`;
            },
            expressionDownloadChartId() {
                if(this.contExprResults){
                    return 'sc_expression_scatter_group';
                }
                if(this.cellCompositionVars.segmentByLabel){
                    if(this.stratifyPlotType === 'dot'){
                        return 'sc_dot_plot';
                    }
                    if(this.stratifyPlotType === 'combined'){
                        return 'sc_violin_plot';
                    }
                    return 'sc_violin_plot_group';
                }
                return 'sc_violin_plot';
            },
            expressionSectionTitle() {
                const metric = `${this.geneExpressionVars.selectedGene || ''} ${this.isATACseq ? 'Chromatin Accessibility' : 'Expression'}`.trim();
                if(this.displayFields && this.cellCompositionVars.segmentByLabel && this.displayFields[this.cellCompositionVars.segmentByLabel].dataType === 'cat'){
                    return `${metric} by ${this.displayLabel(this.cellCompositionVars.displayByLabel)} per ${this.displayLabel(this.cellCompositionVars.segmentByLabel)}`;
                }
                if(this.cellCompositionVars.segmentByLabel){
                    return `${metric} by ${this.displayLabel(this.cellCompositionVars.segmentByLabel)} per ${this.displayLabel(this.cellCompositionVars.displayByLabel)}`;
                }
                return `${metric} by ${this.displayLabel(this.cellCompositionVars.displayByLabel)}`;
            },
            expressionDownloadDisabled() {
                return false;
            },
            showStratifyPlotTypeSelect() {
                return Boolean(
                    this.cellCompositionVars.segmentByLabel &&
                    this.displayFields &&
                    this.displayFields[this.cellCompositionVars.segmentByLabel]?.dataType === 'cat' &&
                    !this.contExprResults
                );
            }
        },
        methods: {
            showTooltip(text) {
                mouseTooltip.show(text);
            },
            hideTooltip() {
                mouseTooltip.hide();
            },
            datasetsRowClass(item){
                if (!item) return ''; // For header/footer rows
                return item.datasetId === this.datasetId ? 'selected-dataset-row' : 'dataset-row';
            },
            preprocessBoxPlotData(groupKey, contKey){
                return scUtils.preprocessBoxPlotData(this.fields.metadata, this.fields.metadata_labels, groupKey, contKey)
            },
            parseCellCountScatterData(groupKey, contKey, aggregateKey){
                return scUtils.parseCellCountScatterData(this.fields.metadata, this.fields.metadata_labels, groupKey, contKey, aggregateKey)
            },
            parseFacetedScatterData(groupKey, contKey, gene, aggregateKey){
                return scUtils.parseFacetedScatterData(this.fields.metadata, this.fields.metadata_labels, groupKey, contKey, this.expressionData[gene], gene, aggregateKey)
            },
            calcCellCounts(a,b,c){
                return scUtils.calcCellCounts2(this.fields,this.labelColors,a,b,c);
            },
            clean(){
                this.allMetadata = null;
                this.metadata = null;

                this.fields = null;
                this.coordinates = null;
                this.markers = null;

                this.markersList = null;
                this.markerCellTypes = null;
                this.markerGenes = null;
                this.markerGenesTable = null;
                this.markersByGene = null;
                this.markersByCellType = null;

                this.dataLoaded = false;
                this.dataReady = false;
                this.expressionData = {};
                this.geneNames = [];
                this.expressionStatsAll = [];
                this.genesNotFound = [];
                this.dotPlotCellType = "";
                this.markerFileOptions = [];
                this.markerFile = null;
                this.cellCompositionVars = {
                    colorByField: null,
                    highlightLabel: '',
                    highlightLabels: [],
                    segmentByCounts2: null,
                    displayByLabel: null,
                    subsetLabel: "",
                    segmentByLabel: null,
                    facetByLabel: null
                },
                this.geneExpressionVars = {
                    selectedGene: null,
                    expressionStats: [],
                    selectedLabel: null,
                    subsetLabel: "",
                }

                this.cellTypeField = null;
                this.donorsField = null;
                this.samplesField = null;
                this.aggregateField = null;
                this.aggregateType = null;

                this.displayFields = null;
                this.displayGroups = null;
                this.traitFields = null;
                this.colorByFields = null;

                this.contCountResults = null;
                this.contExprResults = null;
            },
            async init(){
                this.presetsConfig = this.renderConfig["presets"];
                llog('presets', this.presetsConfig);
                this.showDatasetSelect = this.presetsConfig?.["showDatasetSelect"] || false;

                this.layout = keyParams["layout"] || this.presetsConfig?.["layout"] || 0;
                llog('LAYOUT', this.layout)

                //check for requested datasetId
                /* it can come from multiple places
                    1. 'on-select' event
                    2. querystring param
                    3. config preset
                */
                if(!this.datasetId || this.datasetId === ''){
                    if(keyParams[this.renderConfig["parameters"]?.datasetId]){
                        this.datasetId = keyParams[this.renderConfig["parameters"].datasetId];
                    }else if(this.presetsConfig?.datasetId){
                        this.datasetId = this.presetsConfig.datasetId
                    }else{
                        llog('select a dataset');
                        return;
                    }
                }
                llog(`requested dataset: ${this.datasetId}`);

                //clear existing data
                this.clean();

                llog('++++++++++++ PREPARING')
                
                this.dataLoaded = false;

                //fetch metadata
                this.preloadItem = 'metadata';
                const metadataEnpoint = this.selectedBI+this.BIendpoints.metadata;
                this.allMetadata = await scUtils.fetchMetadata(metadataEnpoint);
                if(!this.allMetadata){
                    llog('there was an error getting metadata');
                    return;
                }
                llog('allMetadata', this.allMetadata);

                //filter metadata
                const filterSingleCellMetadata = () => {
                    let filteredMetadata = this.allMetadata;
                    //get only single-cell
                    if (this.allMetadata[0]?.data_type) {
                        filteredMetadata = this.allMetadata.filter(item => item.data_type === 'single_cell');
                    }
                    //get matching portals
                    if(this.portalGroup){
                        filteredMetadata =  filteredMetadata.filter(item => {
                            if(item.portals){
                                return item.portals.includes(this.portalGroup);
                            }
                        })
                    }
                    return filteredMetadata;
                };

                this.singleCellMetadata = filterSingleCellMetadata()
                llog('singleCellMetadata', this.singleCellMetadata);
                
                //find metadata for current dataset
                this.metadata = this.singleCellMetadata.find(x => x.datasetId === this.datasetId);
                if(!this.metadata){
                    llog(this.datasetId, 'not available in this collection');
                    if(this.singleCellMetadata.length>0){
                        //just load first dataset available
                        this.datasetId = this.singleCellMetadata[0].datasetId;
                        llog('loading first dataset', this.datasetId);
                        this.metadata = this.singleCellMetadata.find(x => x.datasetId === this.datasetId);
                    }else{
                        return;
                    }
                }
                llog('datasetMetadata', this.metadata);

                this.totalDatasets = this.singleCellMetadata.length;
                this.totalCells = this.metadata.totalCells;
                this.embeddingType = this.metadata.embedding_method ?? this.embeddingType;


                //get fields formatting from config
                const format = this.renderConfig.format;
                const format_dataset = format?.[this.datasetId];
                const format_default = format?.default;
                if(format_dataset?.stratifyPlotType){
                    if(this.stratifyPlotTypeOptions.includes(format_dataset.stratifyPlotType)){
                        this.stratifyPlotType = format_dataset.stratifyPlotType;
                    }
                }
                if(format_dataset?.expressionColorScale){
                    if(this.expressionColorScaleOptions.includes(format_dataset.expressionColorScale)){
                        this.expressionColorScale = format_dataset.expressionColorScale;
                    }
                }
                if(format_dataset?.dotPlotColorScaleMode){
                    this.dotPlotColorScaleMode = format_dataset.dotPlotColorScaleMode;
                }

                //get format options
                if(format_dataset){
                    //for this specific dataset if available
                    this.displayFields = format_dataset.displayMap || null;
                    this.displayGroups = format_dataset.groups || null;
                }else if(format_default){
                    //for this collection if available
                    this.displayFields = format_default.displayMap || null;
                    this.displayGroups = format_default.groups || null;
                }

                llog('display config', {
                    displayFields: this.displayFields, 
                    displayGroups: this.displayGroups
                });


                const arraysHaveSameElements = (a, b) => {
                    if (a.length !== b.length) return false;

                    const sortedA = [...a].sort();
                    const sortedB = [...b].sort();

                    return sortedA.every((val, i) => val === sortedB[i]);
                }

                //fetch fields
                this.preloadItem = 'fields';
                //const fieldsUrl = this.renderConfig["data points"].find(x => x.role === "fields");
                const fieldsEnpoint = this.selectedBI+this.BIendpoints.fields;
                this.fields = await scUtils.fetchFields(fieldsEnpoint, this.datasetId);
                if(this.fields){
                    this.fields.metadata_labels_sorted = {};
                    Object.keys(this.fields.metadata_labels).forEach(key => {
                        const customSortOrder = this.displayFields?.[key]?.customSortOrder;
                        const values = this.fields.metadata_labels[key];

                        if (
                            customSortOrder &&
                            arraysHaveSameElements(customSortOrder, values)
                        ) {
                            this.fields.metadata_labels_sorted[key] = [...customSortOrder];
                        } else {
                            this.fields.metadata_labels_sorted[key] = [...values].sort((a, b) =>
                                a.localeCompare(b, undefined, { numeric: true })
                            );
                        }
                    });
                    if(!this.totalCells){
                        this.totalCells = this.fields.NAME?.length | this.fields.ID?.length;
                    }
                    llog('fields', this.fields);
                }else{
                    llog('there was an error getting fields');
                }

                //fetch coordinates
                if(this.layout !== 3){
                    this.preloadItem = 'coordinates';
                    const coordinatesEnpoint = this.selectedBI+this.BIendpoints.coordinates;
                    this.coordinates = await scUtils.fetchCoordinates(coordinatesEnpoint, this.datasetId);
                    if(this.coordinates){
                        llog('coordinates', this.coordinates);
                    }else{
                        llog('there was an error getting coordinates');
                    }
                }

                //fetch markers
                /*
                TODO:
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
                this.markerFile = this.BImarkersDefaultFile;
                //some datasets have multiple marker gene files
                //check if dataset_metadata contains a list of available marker files
                if(this.metadata?.marker_gene_files?.length>1){
                    //add to list of marker gene files
                    this.markerFileOptions = this.metadata.marker_gene_files;
                    this.markerFileOptions.forEach(f => {
                        const s = f.marker_gene_level.toLowerCase();
                        const markersKeyIsCellType = s.includes("cell") && s.includes("type") && !s.includes("sub")
                        f.markerKey = markersKeyIsCellType ? 'cell_type' : f.marker_gene_level
                        f.markerKeyLabel = markersKeyIsCellType ? 'Cell Type' : f.marker_gene_level
                    })

                    this.markerFile = this.markerFileOptions[0];
                }





                await this.initMarkers(this.markerFile);

                



                this.preloadItem = '';
                this.dataLoaded = true;

                await Vue.nextTick();

                //configuration settings

                this.traitFields = this.filterDisplayFields();
                this.colorByFields = this.filterDisplayFields();

                llog('display lists', {
                    colorByFields: this.colorByFields, 
                    traitFields: this.traitFields
                });

                //pre-calculate colors for labels in each field
                this.labelColors = scUtils.calcLabelColors(this.fields, colors);
                
                //this.colorScalePlasmaColorsArray = d3.range(0, 1.01, 0.1).map(t => this.colorScalePlasma(t)).join(', ');
                this.colorScalePlasmaColorsArray = d3.range(0, 1.01, 0.1).map(t => this.colorscaleGreyBlue(t)).join(', ');

                //which field designates cell types or fallback as first field
                const fieldsList = Object.keys(this.fields.metadata_labels);

                const givenCellTypeLabel = this.displayGroups?.cellType?.[0];
                if(!givenCellTypeLabel || !fieldsList.includes(givenCellTypeLabel)){
                    this.cellTypeField = this.findCellTypeField(fieldsList);
                }else{
                    this.cellTypeField = givenCellTypeLabel;
                }
                this.activeGroup = this.cellTypeField;
                llog("cellTypeField:", this.cellTypeField);

                const givenSamplesLabel = this.displayGroups?.samples;
                if(!givenSamplesLabel || !fieldsList.includes(givenSamplesLabel)){
                    this.samplesField = this.findSamplesField(fieldsList);
                }else{
                    this.samplesField = givenSamplesLabel;
                    //aggregate field is used for continuous variable results
                    //set as sample first
                    this.aggregateField = this.samplesField;
                    this.aggregateType = 'sample';
                }
                llog("samplesField:", this.samplesField);

                const givenDonorsLabel = this.displayGroups?.donors;
                if(!givenDonorsLabel || !fieldsList.includes(givenDonorsLabel)){
                    this.donorsField = this.findDonorsField(fieldsList);
                }else{
                    this.donorsField = givenDonorsLabel;
                    //if we have donors use that for aggregate instead
                    if(this.fields.metadata_labels[this.donorsField].length>1){
                        //assuming theres more than 1 donor
                        this.aggregateField = this.donorsField;
                        this.aggregateType = 'donor';
                    }   
                }
                llog("donorsField:", this.donorsField);

                llog("aggregates", {
                    field: this.aggregateField,
                    type: this.aggregateType
                })

                llog('++++++++++++ PLOTTING')
                
                //
                //
                //preset base visualizers to display by cell type
                this.selectColorBy(this.cellTypeField);

                this.selectSegmentBy(this.cellTypeField, "");

                this.geneExpressionVars.selectedLabel = this.cellTypeField;

                this.dataReady = true;

                await Vue.nextTick();

                //return;
                
                //check if a gene was requested in config or url key params
                let geneRequested = false;
                if(this.renderConfig["parameters"]?.gene){
                    //load genes from url key params
                    const paramGenes = decodeURIComponent(keyParams[this.renderConfig["parameters"].gene]);
                    if(paramGenes && paramGenes !== 'undefined'){
                        llog('loading param genes');
                        const paramGenesArray = paramGenes.split(',');
                        for (const gene of paramGenesArray) {
                            await this.getGeneExpression(gene.toUpperCase(), false);
                            await Vue.nextTick();
                            geneRequested = true;
                        }
                    }else if(this.presetsConfig?.["genes"]){
                        //load genes from config
                        llog('loading config genes');
                        for (const gene of this.presetsConfig["genes"]) {
                            await this.getGeneExpression(gene.toUpperCase(), false);
                            await Vue.nextTick();
                            geneRequested = true;
                        }
                    }
                }

                //if no specific gene was requested
                if(!geneRequested){
                    //but we have marker genes
                    if(this.markerGenes){
                        //just load the first in the list
                        await this.getGeneExpression(this.markerGenes[0].gene.toUpperCase(), false);
                    }else if(this.markersList){
                        //no marker genes given, try loading genes from config list
                        llog('loading marker genes');
                        for(const gene of this.markersList){
                            await this.getGeneExpression(gene.toUpperCase(), false);
                            await Vue.nextTick();
                        }
                    }
                }
                
            },


            async initMarkers(markerFile){
                const markersEnpoint = this.selectedBI+this.BIendpoints.markers+markerFile.output_file;
                if(markersEnpoint){
                    const url = markersEnpoint;
                    const markersRaw = await scUtils.fetchMarkers(url, this.datasetId);
                    const markersCleaned =  markersRaw.filter(v => v !== null);
                    //remap params to handle older/newer versions
                    const markersNormalized = markersCleaned.map(m => ({
                        ...m,
                        mean_expression: m.mean_expression ?? m.mean_expression_raw ?? 0,
                        pct_cells_expression: m.pct_cells_expression ?? m.pct_nz_group ?? 0,
                        // Add other fallback mappings here if needed
                    }));
                    this.markers = markersNormalized;
                    llog('markers', this.markers);
                    if(this.markers){
                        if(Array.isArray(this.markers)){
                            //latest markers includes gene stats
                            this.markersList = [...new Set(this.markers.map(x=>x.gene.toUpperCase()))];
                            //this.markerCellTypes = [...new Set(this.markers.map(x=>x[markerFile.markerKey]))];
                            this.markerCellTypes =
                                this.fields.metadata_labels_sorted?.[markerFile.marker_gene_level] ||
                                this.fields.metadata_labels[markerFile.marker_gene_level]

                            /*
                            //sort metadata_labels naturally (alpha/num)
                    Object.keys(this.fields.metadata_labels).forEach(key => {
                        const customSortOrder = this.displayFields?.[key]?.customSortOrder;
                        const values = this.fields.metadata_labels[key];
                        //if config specifies a custom sort order
                        //and the config array is like the fields arrays
                        if (
                            customSortOrder &&
                            arraysHaveSameElements(customSortOrder, values)
                        ) {
                            //replace field sort order with custom sort order
                            this.fields.metadata_labels[key] = [...customSortOrder];
                        } else {
                            //otherwise, by default, sort naturally
                            this.fields.metadata_labels[key] = [...values].sort((a, b) =>
                                a.localeCompare(b, undefined, { numeric: true })
                            );
                        }
                    });
                            */

                           this.markersByGene = scUtils.groupByKey(this.markers, 'gene');
                           //this.markersByCellType = scUtils.groupByKey(this.markers, 'cell_type');
                           this.markersByCellType = scUtils.groupByKey(this.markers, markerFile.markerKey);

                           const topN = 80 / this.markerCellTypes.length;
                           const {markersMatrix, markersTable} = this.topNmarkersByCellType(topN);

                            this.geneNames = this.markersList;
                            this.markerGenes = markersMatrix;
                            this.markerGenesTable = markersTable;
                            this.markerGenesMaxMean = d3.max(this.markerGenes.map(d => d.mean_expression)).toFixed(1);
                            this.markerTableColumns = this.markerDesiredColumns.filter(f =>
                                this.markerGenes.some(row => row[f.key] !== null && row[f.key] !== undefined)
                            );
                            this.markersHaveZscores = this.markerGenes.some(row => row.z_score !== null && row.z_score !== undefined);
                            llog('markers', {markersByGene:this.markersByGene, markersByCellType:this.markersByCellType, markerGenes:this.markerGenes, markersList:this.markersList});
                            
                        }else{
                            //fallback to just having a list of genes per cell type
                            const markersList = Object.values(this.markers).flat();
                            this.markersList = markersList;
                            llog({markersList});
                        }
                    }else{
                        llog('no markers returned');
                    }
                }
            },

            async getGeneExpression(gene, addToKeyParams = true, setAsSelected = false){
                if(this.geneNames.includes(gene)) {
                    llog(`${gene} already listed`);
                    if(this.expressionData[gene]){
                        llog(`${gene} already loaded`);
                        if(setAsSelected) this.geneClick(gene);
                        return;
                    }
                }

                this.geneLoading = "gene";
                //const expressionUrl = this.renderConfig["data points"].find(x => x.role === "expression");
                const expressionEnpoint = this.selectedBI+this.BIendpoints.expression;
                const expressionResult = await scUtils.fetchGeneExpression(expressionEnpoint, gene, this.datasetId);
                this.geneLoading = null;

                if(expressionResult){
                    if((this.markerGenes && !this.markersList.includes(gene)) || !this.markerGenes) {
                        this.geneNames.push(gene);
                    }
                    Vue.set(this.expressionData, gene, expressionResult);

                    llog('getGeneExpression', gene);
                    //llog(addToKeyParams);

                    //update query string gene params 
                    if(addToKeyParams && this.renderConfig["parameters"]?.gene){
                        keyParams.set({[this.renderConfig["parameters"].gene] : gene});
                        /*
                        let paramGenes = decodeURIComponent(keyParams[this.renderConfig["parameters"].gene]);
                        if(paramGenes){
                            const paramGenesArray = paramGenes==='undefined' ? [] : paramGenes.toLowerCase().split(',');
                            llog(`try adding: ${gene} to ${paramGenesArray}`)
                            if(!paramGenesArray.includes(gene.toLowerCase())){// && !this.markersList.includes(gene)){
                                paramGenesArray.push(gene);
                                llog(`not in list, adding: ${gene} to ${paramGenesArray}`)
                                keyParams.set({[this.renderConfig["parameters"].gene] : paramGenesArray.toString()});
                            }
                        }
                            */
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
            maxCountValue(){
                const max = d3.max(this.cellCompositionVars.segmentByCounts2, d => d.count);
                //llog('max', max);
                return max;
            },
            minExpressionValue(gene){
                return d3.min(this.expressionData[gene])
            },
            maxExpressionValue(gene){
                //llog(gene, this.expressionData);
                return d3.max(this.expressionData[gene])
            },
            getStatsByPropValue(data, property, value){
                return data.filter(item => item[property] === value);
            },
            getAllStats(){
                const data = [];
                const displayLabels =
                    this.fields['metadata_labels_sorted']?.[this.cellCompositionVars.segmentByLabel] ||
                    this.fields['metadata_labels'][this.cellCompositionVars.segmentByLabel];
                for(const value of displayLabels){
                    const row = this.getStatsByPropValue(this.geneExpressionVars.expressionStats, this.cellCompositionVars.segmentByLabel, value);
                    data.push(...row);
                }
                return data;
            },
            stratifyPlotTypeLabel(type){
                const labels = {
                    violin: 'Violin list',
                    combined: 'Combined violin',
                    dot: 'Dot plot'
                };
                return labels[type] || type;
            },
            swapCountLabels(){
                const currSelected = this.cellCompositionVars.displayByLabel;
                const currSubset = this.cellCompositionVars.segmentByLabel;
                this.cellCompositionVars.displayByLabel = currSubset;
                this.cellCompositionVars.segmentByLabel = currSelected;
            },
            swapExpressionLabels(){
                const currSelected = this.geneExpressionVars.selectedLabel;
                const currSubset = this.geneExpressionVars.subsetLabel;
                this.geneExpressionVars.selectedLabel = currSubset;
                this.geneExpressionVars.subsetLabel = currSelected;
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

            findDonorsField(list){
                return list.reduce((bestMatch, str) => {
                    const normalizedStr = str.toLowerCase();
                    const score = (normalizedStr.includes("donor") ? 2 : 0) +
                                  (normalizedStr.includes("subject") ? 1 : 0) + 
                                  (normalizedStr.includes("individual") ? 1 : 0) +
                                  (normalizedStr.includes("participant") ? 1 : 0) +
                                  (normalizedStr.includes("patient") ? 1 : 0) +
                                  (normalizedStr.includes("library") ? 1 : 0) +
                                  (normalizedStr.includes("id") ? 0.5 : 0);
                    return score > bestMatch.score ? { string: str, score } : bestMatch;
                }, { string: null, score: 0 }).string;
            },

            findSamplesField(list){
                return list.reduce((bestMatch, str) => {
                    const normalizedStr = str.toLowerCase();
                    const score = (normalizedStr.includes("sample") ? 2 : 0) +
                                  (normalizedStr.includes("specimen") ? 1 : 0) + 
                                  (normalizedStr.includes("id") ? 0.5 : 0);
                    return score > bestMatch.score ? { string: str, score } : bestMatch;
                }, { string: null, score: 0 }).string;
            },

            displayLabel(rawLabel){
                //return rawLabel;
                if(this.displayFields?.[rawLabel]){
                    return this.displayFields[rawLabel].displayName;
                }else{
                    return rawLabel;
                }
            },
            topNmarkersByCellType(topN, cellTypeName=null){
                const markersMatrix = [];
                const markersTable = [];
                let topGenes = [];
                const keys = this.markerCellTypes//Object.keys(this.markersByCellType);
                //console.log('topNmarkersByCellType', this.markersByCellType, keys, Object.entries(this.markersByCellType));
                //for (const [cellType, genes] of Object.entries(this.markersByCellType)) {
                for (const key of keys) {
                    const cellType = key;
                    const genes = this.markersByCellType[key];
                    //for (const genes of this.markersByCellType[key]) {
                        if(!cellTypeName || (cellTypeName && cellType===cellTypeName)){
                            if (genes.every(gene => gene.z_score != null)) {
                                topGenes = genes
                                    .sort((a, b) => b.z_score - a.z_score)
                                    .filter(a => a.z_score > 0)
                            }else{
                                topGenes = genes
                                    .sort((a, b) => b.mean_expression - a.mean_expression)
                                    .filter(a => a.mean_expression > 0);
                            }

                            if(topN){
                                topGenes = topGenes.slice(0, topN);
                            }

                            for (const gene of topGenes) {
                                //console.log(gene.gene, gene.p_value_adj, gene.p_value_adj < 0.05, typeof gene.p_value_adj);
                                //if(gene.p_value_adj < 0.05){
                                    const matrix = [];
                                    for (const k of keys) {
                                        const marker = this.markersByGene[gene.gene].find(x => x[this.markerFile.markerKey] === k);
                                        if(marker) {
                                            matrix.push(marker);
                                        }else{
                                            matrix.push({
                                                [this.markerFile.markerKey]: k,
                                                gene: gene.gene,
                                                [this.markerGenesSizeKey]: "0",
                                                mean_expression: 0,

                                            });
                                        }
                                    }
                                    markersMatrix.push(...matrix);
                                    //markersMatrix.push(...this.markersByGene[gene.gene]);
                                    markersTable.push({...gene});
                                //}
                            }
                        }
                    //}
                }
                return {markersMatrix, markersTable};
            },
            //UNUSED
            filterRawFields(fields){
                /*
                const f = fields;
                const metadata_types = {}
                const metadata_to_remove = []
                f["metadata_types"] = {};
                Object.entries(fields.metadata_labels).forEach(([key, value]) => {
                    //include only fields with more than 1 value
                    if(value.length < 2) {
                        metadata_to_remove.push(key)
                    }else{
                        const fieldType = scUtils.inferDataType(value);
                        f["metadata_types"][key] = fieldType;
                    }
                })
                f["metadata_removed"] = {};
                metadata_to_remove.forEach(column => {
                    f["metadata_removed"][column] = [...f.metadata_labels[column]];
                    delete f.metadata_labels[column];
                })
                //llog({metadata_to_remove, metadata_types, f});
                return f;
                */
            },
            filterDisplayFields(all=false){
                //if no config given
                if(!this.displayFields){
                    //create a raw one
                    const rawDisplayFields = {};
                    Object.entries(this.fields.metadata_labels).forEach(([key, value]) => {
                        if(value.length < 2) {
                            //hide fields with <2 values
                            rawDisplayFields[key] = {
                                displayName: key,
                                dataType: 'cat',
                                display: false,
                                excludeReason: '1value'
                            };
                        }else if(key.toLowerCase().includes('ontology')){
                            //hide fields labeled as ontology
                            rawDisplayFields[key] = {
                                displayName: key,
                                dataType: 'cat',
                                display: false,
                                excludeReason: 'ontologyID'
                            };
                        }else{
                            //show all others
                            rawDisplayFields[key] = {
                                displayName: key,
                                dataType: scUtils.inferDataType(value), //TODO: simple heuristic to check for categorical or continuous
                                display: true,
                                excludeReason: null
                            };
                        }
                    });
                    this.displayFields = rawDisplayFields;
                }
                //sort it
                const sortedEntries = Object.entries(this.displayFields).sort(([, a], [, b]) =>
                    a.displayName?.localeCompare(b.displayName)
                );
                //create show and hide groups
                const show = {};
                const hide = {};
                //split into show/hide groups
                for (const [key, value] of sortedEntries) {
                    if(all){
                        if(this.displayGroups?.cellType?.includes(key)){
                            hide[key] = value;
                            continue;
                        }
                        if(this.displayGroups?.donors?.includes(key)){
                            hide[key] = value;
                            continue;
                        }
                        if(this.displayGroups?.samples?.includes(key)){
                            hide[key] = value;
                            continue;
                        }
                    }
                    //console.log(value.display, value.excludeReason, (value.display===false || (value.excludeReason && value.excludeReason!==undefined)))
                    if (value.display===false || (value.excludeReason && value.excludeReason!==undefined)) {
                        hide[key] = value;
                    } else {
                        show[key] = value;
                    }
                }

                const result = {
                    show,
                    hide
                };

                return result;
            },



            

            /* handlers */
            handleSampleChange(){
                console.log('activeGroup', this.activeGroup);
                this.cellTypeField = this.activeGroup;
                this.selectSegmentBy(this.cellTypeField, this.cellCompositionVars.segmentByLabel);
            },
            handleMarkerFileChange(){
                llog('changing markers file', this.markerFile);
                this.dotPlotCellType = "";
                this.initMarkers(this.markerFile);
            },
            showMarkersByCellType(cellType){
                if(cellType!=''){
                   // this.markerGenes = this.markersByCellType[cellType];
                    const {markersMatrix, markersTable} = this.topNmarkersByCellType(80, cellType);
                    this.markerGenes = markersMatrix;
                    this.markerGenesTable = markersTable;
                }else{
                    const {markersMatrix, markersTable} = this.topNmarkersByCellType(80 / this.markerCellTypes.length);
                    this.markerGenes = markersMatrix;
                    this.markerGenesTable = markersTable;
                }
            },
            selectBioIndex(bi){
                this.datasetId = null;
                keyParams.set({[this.renderConfig["parameters"]?.datasetId] : null});
                this.dataLoaded = false;
                this.dataReade = false;
                this.allMetadata = null;
                this.metadata = null;
                this.fields = null;
                this.coordinates = null;
                this.layout = -1;
                this.selecedBI = bi;
                keyParams.set({bioIndex : bi});
                this.getBImetadata();
            },
            selectDataset(datasetId){
                this.handleSelectEvent({id:this.sectionId, value: datasetId});
            },
            handleSelectEvent(data) {
                if(data.id===this.sectionId){
                    llog(this.sectionId, 'Received on-select event:', data);
                    this.datasetId = data.value;
                    if(this.renderConfig["parameters"]?.datasetId){
                        keyParams.set({[this.renderConfig["parameters"]?.datasetId] : this.datasetId});
                    }
                    this.init();
                }
            },
            selectLayout(layout){
                this.layout = Number(layout);
                keyParams.set({"layout" : this.layout});
                //this.init();
            },
            selectColorBy(field){
                llog('color by:', field);
                this.cellCompositionVars.colorByField = field;
            },
            selectSegmentBy(display, segment){
                const g = this.cellCompositionVars;
                this.contExprResults = null;
                this.contCountResults = null;
                llog('segment by:', {display, segment, gene: this.geneExpressionVars.selectedGene});
                g.displayByLabel = display
                g.segmentByLabel = segment;
                if(segment===""){
                    g.segmentByCounts2 = scUtils.calcCellCounts(this.fields, this.labelColors, g.displayByLabel, g.segmentByLabel);
                }else{
                    if(this.displayFields && this.displayFields[g.segmentByLabel].dataType==='cat'){
                        g.segmentByCounts2 = scUtils.calcCellCounts(this.fields, this.labelColors, g.segmentByLabel, g.displayByLabel);
                    }else if(this.displayFields && this.displayFields[g.segmentByLabel].dataType==='cont'){
                        this.contCountResults = this.parseCellCountScatterData(g.displayByLabel, g.segmentByLabel, this.donorsField);
                        llog('contCountResults', this.contCountResults)
                    }
                }

                if(segment===""){
                    if(this.geneExpressionVars.selectedGene){
                        this.selectExpressionBy(g.displayByLabel, g.segmentByLabel)
                    }
                }else{
                    if(this.displayFields && this.geneExpressionVars.selectedGene && this.displayFields[g.segmentByLabel].dataType==='cont'){
                        this.contExprResults =  this.parseFacetedScatterData(g.displayByLabel, g.segmentByLabel, this.geneExpressionVars.selectedGene, this.donorsField);
                    }else{
                        this.selectExpressionBy(g.displayByLabel, g.segmentByLabel)
                    }
                }
            },
            selectSegmentBy2(display, segment, facet){
                const g = this.cellCompositionVars;
                llog('segment by:', {display, segment, facet});
                g.displayByLabel = display
                g.segmentByLabel = segment;
                g.facetByLabel = facet;
                g.segmentByCounts2 = scUtils.calcCellCounts2(this.fields, this.labelColors, g.displayByLabel, g.segmentByLabel, g.facetByLabel);
            },
            selectExpressionBy(display, segment){
                const g = this.geneExpressionVars;
                llog('expression by:', {display, segment});
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
                llog('geneListClick', e)
            },
            geneClick(gene){
                llog('geneClick', gene);
                if(!this.expressionData[gene]){
                    this.getGeneExpression(gene, false, true);
                    return;
                }
                const g = this.geneExpressionVars;
                g.expressionStats = scUtils.calcExpressionStats(this.fields, this.labelColors, this.expressionData[gene], gene, g.selectedLabel, g.subsetLabel);
                g.selectedGene = gene;

                if(this.cellCompositionVars.segmentByLabel===""){
                    if(this.geneExpressionVars.selectedGene){
                        this.selectExpressionBy(this.cellCompositionVars.displayByLabel, this.cellCompositionVars.segmentByLabel)
                    }
                }else{
                    if(this.displayFields && this.geneExpressionVars.selectedGene && this.displayFields[this.cellCompositionVars.segmentByLabel].dataType==='cont'){
                        this.contExprResults =  this.parseFacetedScatterData(this.cellCompositionVars.displayByLabel, this.cellCompositionVars.segmentByLabel, this.geneExpressionVars.selectedGene, this.donorsField);
                    }else{
                        this.selectExpressionBy(this.cellCompositionVars.displayByLabel, this.cellCompositionVars.segmentByLabel)
                    }
                }
            },
            clearGeneNotFound(e){
                this.genesNotFound.splice(this.genesNotFound.indexOf(e), 1);
            },
            handleSelectorUpdate(e){
                llog('selector updated', e);
                this.cellCompositionVars.highlightLabels = e.coloredLabels;
                this.selectColorBy(e.coloredField);
            },
            handleSelectorHover(e){
                llog('selector hovered', e);
                this.cellCompositionVars.highlightLabel = e.hoveredLabel;
            }
        },
    });
</script>

<style scoped>
.pagination.b-pagination{
    margin:0;
    padding:0;
    font-size:14px;
    border:0;
}
.pagination.b-pagination .page-link{
    line-height: 1 !important;
    height:25px;
    min-width: 25px;
    border-radius: 50%;
}


.tabs-group{
    display:flex;
    flex-direction: column;
    flex:1;
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


.plot-toggle {
    display: flex;
    background: #ddd;
    border: 1px solid #ddd;
    border-radius: 10px;
    width: min-content;
    cursor: pointer;
    font-size: 12px;
  }
  .plot-toggle-btn {
    padding: 0 5px;
    border-radius: 10px;
    color: #8b8b8b;
  }
  .plot-toggle-btn.toggled {
    background: white;
    color: black;
  }

  .chart-label{
    font-size:12px;
    opacity:0.5;
  }

    .download {
        margin: 0;
        float: unset;
        margin: 0;
        float: unset;
        width: fit-content;
    }
    ::v-deep .download button{
        color: black;
        background-color: white;
        padding: 0.25rem 0.5rem;
        border: 1px solid rgba(0,0,0,.25);
        font-size: 12px;
    }
    ::v-deep .download button:hover{
        color: black;
        border: 1px solid rgba(0,0,0,1);
    }
    ::v-deep .download.show button{
        background: white;
        color:black;
    }
    ::v-deep .download.show ul li:nth-child(-n+2){
        display:none;
    }
    ::v-deep .download.show .dropdown-menu {
        min-width: 0;
        width: 100%;
        transform: none !important;
        top: 100% !important;
    }
    ::v-deep .download.show .dropdown-item{
        text-align: center;
    }

    ::v-deep .b-table-sticky-header {
        padding: 0 10px;
    }

    ::v-deep .b-table-sticky-header th.position-relative {
        position: sticky !important;
    }

    ::v-deep .dataset-row {
        cursor:pointer;
    }
    ::v-deep .selected-dataset-row {
        background-color: #d0ebff !important;
    }

    ::v-deep .capitalize{
        text-transform: capitalize;
    }
</style>
