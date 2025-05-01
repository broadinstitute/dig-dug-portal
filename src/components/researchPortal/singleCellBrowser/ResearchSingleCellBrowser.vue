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


        <div v-if="!datasetId" style="color:red; margin:0 auto">
            Please Select a Dataset
        </div>


        <div v-if="datasetId && !dataLoaded" style="margin: 0 auto">
            Loading {{ preloadItem }}...
        </div>


        <div v-if="dataLoaded" style="display:flex; flex-direction: column; gap:20px; width: 100%;">
            <!-- layout 0 -->
            <div v-if="layout===0" style="display:flex; flex-direction:column; gap:20px; align-self:center; background:#f8f8f8; padding:20px; width:100%">
                <research-single-cell-info v-if="this.metadata"
                    :data="metadata"
                />
                <div v-if="dataReady" class="" style="display:flex; gap:20px;">
                    <!--left tab group-->
                    <div class="tabs-group">
                        <div class="tabs-wrapper">
                            <div class="tab" >
                                {{isATACseq ? 'Nucleus' : 'Cell'}} Composition
                            </div>
                        </div>
                        <div class="tabs-section-wrapper">
                            <div class="tab-section" style="display:flex; flex-direction: column; gap:20px; background:white; padding:20px;">
                                <div v-if="coordinates" style="display:flex; gap:20px;">
                                    <div style="display:flex; flex-direction: column; width: min-content; flex: 1">
                                        <div style="display:flex; justify-content: space-between; align-items: baseline;">
                                            <strong style="font-size: 16px; margin: 0 0 5px;">UMAP</strong> {{ totalCells.toLocaleString() }} cells
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
                                        <!--
                                        <research-umap-plot
                                            :sectionId="sectionId"
                                            title=""
                                            :points="coordinates"
                                            :fields="fields"
                                            :fieldColors="labelColors"
                                            :cellTypeField="cellTypeField"
                                            :colorByField="cellCompositionVars.colorByField"
                                            :hoverFields="['cell_label', 'Donor']"
                                            :highlightLabel="cellCompositionVars.highlightLabel"
                                            :highlightLabels="cellCompositionVars.highlightLabels"
                                            :width="400"
                                            :labelSizePx="28"
                                        />
                                        -->
                                    </div>
                                    <div v-if="fieldsDisplayList" style="display:flex; flex-direction: column; align-self: flex-start; width:200px; height:400px">
                                        <strong style="font-size: 16px; margin: 0 0 5px;">Color By</strong>
                                        <research-single-cell-selector 
                                            :data="fields['metadata_labels']"
                                            :displayData="fields['metadata_display_labels']"
                                            :selectedField="cellCompositionVars.colorByField"
                                            layout="dropdown-list"
                                            :colors="labelColors"
                                            @on-update="handleSelectorUpdate($event)"
                                            @on-hover="handleSelectorHover($event)"
                                        />
                                    </div>
                                </div>
                                <div style="display:flex; flex-direction: column; gap:20px;">
                                    <div style="font-size: 16px;">
                                        <span style="font-weight: bold">{{isATACseq ? 'Nucleus' : 'Cell'}} {{ isNormalized ? 'Proportion' : 'Distribution' }}</span> 
                                        per-<span style="font-style: italic;">{{ displayLabel(cellCompositionVars.displayByLabel) }}</span>
                                        <template v-if="cellCompositionVars.segmentByLabel">
                                            per-<span style="font-style: italic;">{{ displayLabel(cellCompositionVars.segmentByLabel) }}</span> 
                                        </template>
                                    </div>

                                    <div style="display:flex; gap:10px">
                                        <div style="flex-grow: 1;">
                                            <div style="display: flex; gap: 10px; justify-content: space-between; margin:0 0 5px">
                                                <div style="font-weight:bold">X-axis</div>
                                            </div>
                                            <research-single-cell-selector 
                                                :data="fields['metadata_labels']"
                                                :displayData="fields['metadata_display_labels']"
                                                layout="dropdown"
                                                :showColor="false"
                                                :selectedField="cellCompositionVars.displayByLabel"
                                                @on-update="selectSegmentBy($event.selectedField, cellCompositionVars.segmentByLabel)"
                                            />
                                        </div>
                                        <div @click="swapCountLabels" style="display:flex;align-items:end;cursor:pointer">
                                            ↔
                                        </div>
                                        <div style="display:flex; flex-direction: column; flex-grow: 1;">
                                            <div style="display: flex; gap: 10px; justify-content: space-between; margin:0 0 5px">
                                                <div style="font-weight:bold">Y-axis</div>
                                            </div>
                                            <research-single-cell-selector 
                                                :data="fields['metadata_labels']"
                                                :displayData="fields['metadata_display_labels']"
                                                layout="dropdown"
                                                :showColor="false"
                                                :selectedField="cellCompositionVars.segmentByLabel || ''"
                                                @on-update="selectSegmentBy(cellCompositionVars.displayByLabel, $event.selectedField)"
                                            />
                                        </div>
                                    </div>

                                    <div style="display:flex; gap:20px; align-items: center; justify-content: space-between;">
                                        <div style="display:flex; gap:10px; height: fit-content">
                                            <div class="plot-toggle" @click="isStacked = !isStacked">
                                                <div class="plot-toggle-btn" :class="`${isStacked?'':'toggled'}`">group</div>
                                                <div class="plot-toggle-btn" :class="`${isStacked?'toggled':''}`">stack</div>
                                            </div>
                                            <div class="plot-toggle" @click="isNormalized = !isNormalized">
                                                <div class="plot-toggle-btn" :class="`${isNormalized?'':'toggled'}`">count</div>
                                                <div class="plot-toggle-btn" :class="`${isNormalized?'toggled':''}`">pct.</div>
                                            </div>
                                        </div>
                                        <download-chart 
                                            class="download"
                                            chartId="sc_stacked_bar_plot"
                                            style="width: 125px; align-self: flex-end;"
                                        />
                                    </div>

                                    <div style="display:flex; flex-direction: column; gap:5px">
                                        <research-stacked-bar-plot
                                            :data="cellCompositionVars.segmentByCounts2"
                                            :primaryKey="cellCompositionVars.displayByLabel"
                                            :subsetKey="cellCompositionVars.segmentByLabel"
                                            :xAxisLabel="displayLabel(cellCompositionVars.displayByLabel)"
                                            :yAxisLabel="`${isNormalized?('Percent of ' + (isATACseq ? 'Nuclei' :'Cells')):('Number of ' + (isATACseq ? 'Nuclei' : 'Cells'))}`"
                                            :highlightKey="cellCompositionVars.highlightLabel"
                                            :normalize="isNormalized"
                                            :stack="isStacked"
                                        />
                                        <div style="font-size:12px; opacity:0.5">{{ displayLabel(cellCompositionVars.segmentByLabel) }}</div>
                                        <research-single-cell-selector 
                                            :data="fields['metadata_labels']"
                                            layout="list"
                                            listDirection="horizontal"
                                            listAlignment="start"
                                            :colors="labelColors"
                                            :selectedField="cellCompositionVars.segmentByLabel"
                                            @on-update="handleSelectorUpdate($event)"
                                            @on-hover="handleSelectorHover($event)"
                                        />
                                    </div>



                                    <!--
                                    <div v-if="!cellCompositionVars.segmentByLabel">
                                        <research-stacked-bar-plot
                                            :data="cellCompositionVars.segmentByCounts2"
                                            :primaryKey="cellCompositionVars.displayByLabel"
                                            :subsetKey="cellCompositionVars.segmentByLabel"
                                            :xAxisLabel="cellCompositionVars.displayByLabel"
                                            :yAxisLabel="`${isNormalized?'Percent of Cells':'Number of Cells'}`"
                                            :highlightKey="cellCompositionVars.highlightLabel"
                                            :normalize="isNormalized && isStacked"
                                            :stack="isStacked"
                                        />
                                    </div>
                                    <div v-else>
                                        <div v-for="value in fields['metadata_labels'][cellCompositionVars.displayByLabel]">
                                            <div style="display:flex; gap:3px; align-items: baseline;">
                                                <div style="font-weight: bold;">{{ value }}</div>
                                            </div>
                                            <research-stacked-bar-plot
                                                :data="getStatsByPropValue(cellCompositionVars.segmentByCounts2, cellCompositionVars.displayByLabel, value)"
                                                :primaryKey="cellCompositionVars.segmentByLabel"
                                                :xAxisLabel="cellCompositionVars.segmentByLabel"
                                                :yAxisLabel="`${isNormalized?'Percent of Cells':'Number of Cells'}`"
                                                :highlightKey="cellCompositionVars.highlightLabel"
                                                :normalize="isNormalized && isStacked"
                                                :stack="isStacked"
                                                :range="[0, maxCountValue()]"
                                            />
                                        </div>
                                    </div>
                                    -->
                                </div>
                            </div>
                        </div>
                    </div>
                    <!--<div style="padding: 8px 0 0 0; font-size:16px;">vs</div>-->
                    <!--right tab group-->
                    <div class="tabs-group">
                        <div class="tabs-wrapper">
                            <div class="tab">
                                {{ isATACseq ? 'Gene Activity' : 'Gene Expression' }}
                            </div>
                        </div>
                        <div class="tabs-section-wrapper">
                            <div class="tab-section" style="display:flex; flex-direction: column; gap:20px; background:white; padding:20px;">
                                <div v-if="coordinates" style="display:flex; gap:20px">
                                    <div style="display:flex; flex-direction: column; width: min-content;  flex: 1">
                                        <div style="display:flex; justify-content: space-between; align-items: baseline;">
                                            <span style="font-size: 16px; margin: 0 0 5px;"><span style="font-weight: bold">UMAP</span> <span style="font-style: italic;">{{ geneExpressionVars.selectedGene ? `${geneExpressionVars.selectedGene}` : '' }}</span></span> {{ totalCells.toLocaleString() }} cells
                                        </div>
                                        <div style="position:relative; width:100%">
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
                                            <div v-if="expressionData[geneExpressionVars.selectedGene]" style="display:flex; flex-direction: column; position:absolute; top:4px; left:5px;" class="legend">
                                                <div class="label">Expression</div>
                                                <div class="gradient" :style="`background: linear-gradient(to right, ${colorScalePlasmaColorsArray}); height:5px;`"></div>
                                                <div style="display:flex" class="marks"><div>0.0</div><div>{{ maxExpressionValue(geneExpressionVars.selectedGene) }}</div></div>
                                            </div>
                                        </div>
                                        <!--
                                        <research-umap-plot
                                            :sectionId="sectionId"
                                            title=""
                                            :points="coordinates"
                                            :fields="fields"
                                            :cellTypeField="cellTypeField"
                                            :colorByField="cellCompositionVars.colorByField"
                                            :hoverFields="['cell_label', 'Donor']"
                                            :expression="expressionData[geneExpressionVars.selectedGene]"
                                            :expressionGene="geneExpressionVars.selectedGene"
                                            :highlightLabel="cellCompositionVars.highlightLabel"
                                            :highlightLabels="cellCompositionVars.highlightLabels"
                                            :width="400"
                                            :labelSizePx="28"
                                        />
                                        -->
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
                                <div>
                                    <div v-if="geneExpressionVars.expressionStats.length>0" style="display:flex; flex-direction: column; gap:20px;">
                                        <span style="font-size: 16px;">
                                            <span style="font-weight: bold;">{{ isATACseq ? 'Chromatin Accessibility' : 'Gene Expression' }}</span> 
                                            <span style="font-style: italic;"> {{ geneExpressionVars.selectedGene ? `${geneExpressionVars.selectedGene}` : '' }}</span>
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
                                        
                                        <div style="display:flex; gap:10px;">
                                            <div style="flex-grow: 1;">
                                                <div style="font-weight:bold; margin:0 0 5px">X-axis</div>
                                                <research-single-cell-selector 
                                                    :data="fields['metadata_labels']"
                                                    :displayData="fields['metadata_display_labels']"
                                                    layout="dropdown"
                                                    :showColor="false"
                                                    :selectedField="geneExpressionVars.selectedLabel"
                                                    @on-update="selectExpressionBy($event.selectedField, geneExpressionVars.subsetLabel)"
                                                />
                                            </div>
                                            <div @click="swapExpressionLabels" style="display:flex;align-items:end;cursor:pointer">
                                                ↔
                                            </div>
                                            <div style="flex-grow: 1;">
                                                <div style="font-weight:bold; margin:0 0 5px">Y-axis</div>
                                                <research-single-cell-selector 
                                                    :data="fields['metadata_labels']"
                                                    :displayData="fields['metadata_display_labels']"
                                                    layout="dropdown"
                                                    :showColor="false"
                                                    :selectedField="geneExpressionVars.subsetLabel || ''"
                                                    @on-update="selectExpressionBy(geneExpressionVars.selectedLabel, $event.selectedField)"
                                                />
                                            </div>
                                        </div>

                                        <download-chart 
                                            class="download"
                                            chartId="sc_violin_plot"
                                            style="width: 125px; align-self: flex-end;"
                                        />

                                        <div style="display:flex; flex-direction: column; gap:5px">
                                            <research-violin-plot
                                                :data="geneExpressionVars.expressionStats"
                                                :primaryKey="geneExpressionVars.selectedLabel"
                                                :subsetKey="geneExpressionVars.subsetLabel"
                                                :highlightKey="cellCompositionVars.highlightLabel"
                                                :height="300"
                                                xAxisLabel="Log-Normalized Expression"
                                                :xAxisLabel="isATACseq ? 'Gene Activity Score' : 'Log-Normalized Expression'"
                                                :yAxisLabel="displayLabel(geneExpressionVars.selectedLabel)"
                                            />
                                            <div style="font-size:12px; opacity:0.5">{{ displayLabel(geneExpressionVars.subsetLabel) }}</div>
                                            <research-single-cell-selector
                                                :data="fields['metadata_labels']"
                                                layout="list"
                                                listDirection="horizontal"
                                                listAlignment="start"
                                                :colors="labelColors"
                                                :selectedField="geneExpressionVars.subsetLabel"
                                                @on-update="handleSelectorUpdate($event)"
                                                @on-hover="handleSelectorHover($event)"
                                            />
                                        </div>

                                        
                                        <!--
                                        <div v-if="!geneExpressionVars.subsetLabel">
                                            <research-violin-plot
                                                :data="geneExpressionVars.expressionStats"
                                                :primaryKey="geneExpressionVars.selectedLabel"
                                                :subsetKey="geneExpressionVars.subsetLabel"
                                                :highlightKey="cellCompositionVars.highlightLabel"
                                                :height="300"
                                                xAxisLabel="Log-Normalized Expression"
                                                :yAxisLabel="`${geneExpressionVars.selectedLabel} ${geneExpressionVars.subsetLabel!=''?' x '+geneExpressionVars.subsetLabel:''}`"
                                            />
                                        </div>
                                        <div v-else>
                                            <div v-for="value in fields['metadata_labels'][geneExpressionVars.selectedLabel]">
                                                <div style="display:flex; gap:3px; align-items: baseline;">
                                                    <div style="font-weight: bold;">{{ value }}</div>
                                                </div>
                                                <research-violin-plot
                                                    :data="getStatsByPropValue(geneExpressionVars.expressionStats, geneExpressionVars.selectedLabel, value)"
                                                    :primaryKey="geneExpressionVars.subsetLabel"
                                                    :highlightKey="cellCompositionVars.highlightLabel"
                                                    :height="300"
                                                    xAxisLabel="Log-Normalized Expression"
                                                    :yAxisLabel="geneExpressionVars.subsetLabel"
                                                    :range="[0, maxExpressionValue(geneExpressionVars.selectedGene)]"
                                                />
                                            </div>
                                        </div>
                                        -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display:flex; gap:25px">
                    <!-- marker genes-->
                    <div v-if="markers && showMarkerGenes && (markerGenes || expressionStatsAll.length>0)" style="display:flex; flex-direction: column; gap:20px; background:white; padding:20px; width:100%">
                        <div style="display:flex; flex-direction: column; gap:20px;">
                            <div style="display:flex; justify-content: space-between;">
                                <div style="display:flex; flex-direction: column;">
                                    <strong style="font-size: 16px;">Marker Genes {{ dotPlotCellType!=""?`for ${dotPlotCellType}` : '' }}</strong>
                                    <div v-if="dotPlotCellType===''">Top 5 per Cell Type</div>
                                    <div  style="font-size:12px; opacity:0.5">Ranked by z-score</div>
                                </div>
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
                            <!--geneKey="cellType"-->

                            <div style="display:flex; justify-content: space-between;">
                                <div style="display:flex; gap: 10px; align-items: baseline;">
                                    <div style="font-weight:bold; margin:0 0 5px">Cell Type</div>
                                    <select @change="showMarkersByCellType($event.target.value)" v-model="dotPlotCellType">
                                        <option value="">All</option>
                                        <option v-for="label in markerCellTypes" :value="label">
                                            {{ label }}
                                        </option>
                                    </select>
                                </div>
                                <download-chart 
                                    class="download"
                                    chartId="sc_dot_plot"
                                    style="width: 125px; align-self: flex-end;"
                                />
                            </div>

                            <research-dot-plot
                                style="display:flex; align-self: center"
                                :data="markerGenes || expressionStatsAll"
                                yKey="cell_type"
                                xKey="gene"
                                yLabel="Cell Type"
                                xLabel="Gene"
                                :fitToSize="true"
                                :cellWidth="30"
                                highlightKey=""
                            />

                            <b-table v-if="markerGenesTable"
                                style="font-size:12px"
                                :items="markerGenesTable"
                                :fields="['cell_type', 'gene', 'mean_expression', 'p_value_adj', 'log_fold_change', 'z_score']"
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
            <!-- layout 1 -->
            <div v-if="layout===1" style="display:flex; flex-direction:column; width:100%; align-self:center;">
                <research-single-cell-info 
                    :data="metadata"
                />
                <div v-if="dataReady" style="display:flex; gap:40px; flex:1">
                    <research-single-cell-selector 
                        :data="fields['metadata_labels']"
                        layout="dropdown-list"
                        :showSelect="false"
                        :colors="labelColors"
                        :selectedField="cellCompositionVars.colorByField"
                        @on-update="handleSelectorUpdate($event)"
                        @on-hover="handleSelectorHover($event)"
                    />
                    <div class="" style="display:flex; gap:20p; width:400px">
                        <div v-if="coordinates" style="display:flex; flex-direction: column; flex: 1">
                            <div style="display:flex; justify-content: space-between; align-items: baseline;">
                                <span style="font-size: 16px; margin: 0 0 5px;"><span style="font-weight: bold">UMAP</span> <span style="font-style: italic;">{{ geneExpressionVars.selectedGene ? `${geneExpressionVars.selectedGene}` : '' }}</span></span> {{ totalCells.toLocaleString() }} cells
                            </div>
                            <div style="display:flex; position: relative;">
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
                                <div style="display:flex; flex-direction: column; position:absolute; top:4px; left:5px;" class="legend">
                                    <div class="label">Expression</div>
                                    <div class="gradient" :style="`background: linear-gradient(to right, ${colorScalePlasmaColorsArray}); height:5px;`"></div>
                                    <div style="display:flex" class="marks"><div>0.0</div><div>3.0</div></div>
                                </div>
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
            <!-- layout 2 -->
            <div v-if="layout===999" style="display:flex; flex-direction:column; width:100%; background: #f8f8f8; padding: 20px; gap: 20px;">
                <!--
                <research-single-cell-info 
                    :data="metadata"
                />
                -->
                <div v-if="this.fieldsDisplayList" style="display:flex; gap:10px">
                    <div>Count</div>
                    <div style="display:flex; flex-direction: column;">
                        <div>across</div>
                        <select v-model="cellCompositionVars.displayByLabel" @change="selectSegmentBy2(cellCompositionVars.displayByLabel, cellCompositionVars.segmentByLabel, cellCompositionVars.facetByLabel)">
                            <optgroup label="">
                                <option value="">--Select--</option>
                                <option v-for="(value, key) in fields['metadata_labels']" :value="key">
                                    {{ displayLabel(key) }}
                                </option>
                            </optgroup>
                            <optgroup label="removed < 1">
                                <option v-for="(value, key) in fields['metadata_removed']" :value="key" disabled>
                                    {{ displayLabel(key) }}
                                </option>
                            </optgroup>
                        </select>
                    </div>
                    <div style="display:flex; flex-direction: column;">
                        <div>group by</div>
                        <select v-model="cellCompositionVars.segmentByLabel" @change="selectSegmentBy2(cellCompositionVars.displayByLabel, cellCompositionVars.segmentByLabel, cellCompositionVars.facetByLabel)">
                            <optgroup label="">
                                <option value="">--Select--</option>
                                <option v-for="(value, key) in fields['metadata_labels']" :value="key">
                                    {{ displayLabel(key) }}
                                </option>
                            </optgroup>
                            <optgroup label="removed < 1">
                                <option v-for="(value, key) in fields['metadata_removed']" :value="key" disabled>
                                    {{ displayLabel(key) }}
                                </option>
                            </optgroup>
                        </select>
                    </div>
                    <div style="display:flex; flex-direction: column;">
                        <div>facet by</div>
                        <select v-model="cellCompositionVars.facetByLabel" @change="selectSegmentBy2(cellCompositionVars.displayByLabel, cellCompositionVars.segmentByLabel, cellCompositionVars.facetByLabel)">
                            <optgroup label="">
                                <option value="">--Select--</option>
                                <option v-for="(value, key) in fields['metadata_labels']" :value="key">
                                    {{ displayLabel(key) }}
                                </option>
                            </optgroup>
                            <optgroup label="removed < 1">
                                <option v-for="(value, key) in fields['metadata_removed']" :value="key" disabled>
                                    {{ displayLabel(key) }}
                                </option>
                            </optgroup>
                        </select>
                    </div>
                    <div style="display:flex; flex-direction: column;">
                        <div>gene search</div>
                        <div style="display:flex; gap:5px;">
                            <input type="text" placeholder="Gene name" @keyup.enter="searchGene(geneToSearch)" v-model="geneToSearch" style="width:100%; position:relative;"/>
                            <button @click="searchGene(geneToSearch)">
                                <svg :style="`display:${!geneLoading?'block':'none'}`" style="width: 20px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000"><path fill-rule="evenodd" clip-rule="evenodd" d="M15 10.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm-.82 4.74a6 6 0 1 1 1.06-1.06l4.79 4.79-1.06 1.06-4.79-4.79Z" fill="#080341"/></svg>
                                <div :style="`display:${geneLoading?'block':'none'}`" class="geneLoader"></div>
                            </button>
                        </div>
                    </div>
                </div>
                <div v-if="dataReady" style="display:flex; flex-direction: column; gap:20px; max-width: 800px;">
                    <div style="font-weight: bold;">Cell Type Abundance</div>
                    <div v-if="!cellCompositionVars.facetByLabel" style="flex:1">
                        <research-stacked-bar-plot
                            :data="cellCompositionVars.segmentByCounts2"
                            :primaryKey="cellCompositionVars.displayByLabel"
                            :subsetKey="cellCompositionVars.segmentByLabel"
                            :xAxisLabel="displayLabel(cellCompositionVars.displayByLabel)"
                            :yAxisLabel="`${cellCompositionVars.segmentByLabel?'Percent of Cells':'Number of Cells'}`"
                            :highlightKey="cellCompositionVars.highlightLabel"
                            :normalize="cellCompositionVars.segmentByLabel?true:false"
                            :stack="cellCompositionVars.segmentByLabel?true:false"
                        />
                    </div>
                    <div v-else  style="flex:1">
                        <div style="font-size:12px; opacity:0.5">{{ displayLabel(cellCompositionVars.facetByLabel) }}</div>
                        <div v-for="value in fields['metadata_labels'][cellCompositionVars.facetByLabel]">
                            <div style="display:flex; gap:3px; align-items: baseline;">
                                <div style="font-weight: bold;">{{ value }}</div>
                            </div>
                            <research-stacked-bar-plot
                                :data="getStatsByPropValue(cellCompositionVars.segmentByCounts2, cellCompositionVars.facetByLabel, value)"
                                :primaryKey="cellCompositionVars.displayByLabel"
                                :subsetKey="cellCompositionVars.segmentByLabel"
                                :xAxisLabel="displayLabel(cellCompositionVars.displayByLabel)"
                                :yAxisLabel="`${true?'Percent of Cells':'Number of Cells'}`"
                                :highlightKey="cellCompositionVars.highlightLabel"
                                :normalize="true"
                                :stack="true"
                                :range="[0, maxCountValue()]"
                            />
                        </div>
                    </div>
                    <div v-if="cellCompositionVars.segmentByLabel" style="display:flex; flex-direction: column; min-width: min-content;">
                        <div style="font-size:12px; opacity:0.5">{{ displayLabel(cellCompositionVars.segmentByLabel) }}</div>
                        <research-single-cell-selector 
                            :data="fields['metadata_labels']"
                            layout="list"
                            listDirection="vertical"
                            listAlignment="start"
                            :colors="labelColors"
                            :selectedField="cellCompositionVars.segmentByLabel"
                            @on-update="handleSelectorUpdate($event)"
                            @on-hover="handleSelectorHover($event)"
                        />
                    </div>
                </div>
                <div v-if="dataReady" style="display:flex; flex-direction:column; gap:10px;">
                    <div style="font-weight: bold;">Cell Type Proportion across Donors by Age</div>
                    <div style="display:flex; gap:20px;">
                        <research-stacked-bar-plot-2
                            :proportions="testCellProportions"
                            :colors="labelColors"
                        />
                        <research-single-cell-selector 
                            :data="fields['metadata_labels']"
                            layout="list"
                            listDirection="vertical"
                            listAlignment="start"
                            :colors="labelColors"
                            :selectedField="renderConfig.format.default.annotationGroups.cellType"
                            @on-update="handleSelectorUpdate($event)"
                            @on-hover="handleSelectorHover($event)"
                        />
                    </div>
                    
                </div>
                <div v-if="dataReady">
                    <div style="font-weight: bold;">Cell Type Proportion across Samples by Condition</div>
                    <div style="display:flex">
                        <div style="display:flex; flex-direction: column; gap:10px; width: 800px;">
                            <research-violin-plot
                                :data="testCellStats"
                                :primaryKey="renderConfig.format.default.annotationGroups.cellType"
                                :subsetKey="renderConfig.format.default.annotationGroups.conditions[2]"
                                :highlightKey="cellCompositionVars.highlightLabel"
                                :colors="labelColors[renderConfig.format.default.annotationGroups.conditions[2]]"
                                :height="300"
                                xAxisLabel="Percent of Cells"
                                :yAxisLabel="displayLabel(renderConfig.format.default.annotationGroups.cellType)"
                                :range="[0,1]"
                                :showViolins="false"
                            />
                            <div v-for="value in fields['metadata_labels'][renderConfig.format.default.annotationGroups.cellType]" style="max-width: 800px;">
                                <div style="display:flex; gap:3px; align-items: baseline;">
                                    <div style="font-weight: bold;">{{ value }}</div>
                                </div>
                                <research-violin-plot
                                    :data="testCellStats.filter(d => d[renderConfig.format.default.annotationGroups.cellType] === value)"
                                    :primaryKey="renderConfig.format.default.annotationGroups.conditions[2]"
                                    :highlightKey="cellCompositionVars.highlightLabel"
                                    :height="300"
                                    xAxisLabel="Percent of Cells"
                                    :yAxisLabel="renderConfig.format.default.annotationGroups.conditions[2]"
                                    :range="[0, 1]"
                                    :showViolins="false"
                                />
                            </div>
                        </div>
                        <research-single-cell-selector 
                            :data="fields['metadata_labels']"
                            layout="list"
                            listDirection="vertical"
                            listAlignment="start"
                            :colors="labelColors"
                            :selectedField="renderConfig.format.default.annotationGroups.conditions[2]"
                            @on-update="handleSelectorUpdate($event)"
                            @on-hover="handleSelectorHover($event)"
                        />
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
            TODO: make something default?
            TODO: handle trailing slash
        ///
        "bioIndex": "https://matkp.hugeampkpnbi.org",

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
                    the value of each key should be the desired label to show users
                    otherwise the key name will be used
                ///
                "displayMap":{
                    "biosample_id": "Biosample ID",
                    "donor_id": "Donor ID",
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
                "annotationGroups":{
                    "cellType": "cell_type__author",
                    "cellSubType": "custom__author_cell_substype",
                    "donors": "donor_id",
                    "conditions": ["disease__ontology_label", "bmi", "bmi__group", "custom__development_stage__ontology_label", "custom__organism_age", "custom__organism_age__group"],
                    "experimental": ["custom__cell_cycle__phase"],
                    "samples": "biosample_id"
                }
            }
        }
    }
    */

    import * as d3 from 'd3';
    import Vue from 'vue';
    import keyParams from "@/utils/keyParams";
    import EventBus from "@/utils/eventBus";
    import {llog} from "./llog.js";
    import * as scUtils from "@/components/researchPortal/singleCellBrowser/singleCellUtils.js"
    import ResearchUmapPlot from "@/components/researchPortal/singleCellBrowser/ResearchUmapPlot.vue";
    import ResearchUmapPlotGL from "@/components/researchPortal/singleCellBrowser/ResearchUmapPlotGL.vue";
    import ResearchStackedBarPlot from "@/components/researchPortal/singleCellBrowser/ResearchStackedBarPlot.vue";
    import ResearchStackedBarPlot2 from "@/components/researchPortal/singleCellBrowser/ResearchStackedBarPlot2.vue";
    import ResearchDotPlot from "@/components/researchPortal/singleCellBrowser/ResearchDotPlot.vue";
    import ResearchViolinPlot from "@/components/researchPortal/singleCellBrowser/ResearchViolinPlot.vue";
    import ResearchSingleCellSelector from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellSelector.vue";
    import ResearchSingleCellInfo from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellInfo.vue";
    import DownloadChart from "@/components/DownloadChart"

    const colors = ["#007bff","#048845","#8490C8","#BF61A5","#EE3124","#FCD700","#5555FF","#7aaa1c","#F88084","#9F78AC","#F5A4C7","#CEE6C1","#cccc00","#6FC7B6","#D5A768","#d4d4d4"]

    export default Vue.component('research-single-cell-browser', {
        components: {
            ResearchUmapPlot,
            ResearchUmapPlotGL,
            ResearchStackedBarPlot,
            ResearchDotPlot,
            ResearchViolinPlot,
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
                selectedBI: null,

                BIendpoints:{
                    metadata: "/api/raw/file/single_cell_all_metadata/dataset_metadata.json.gz",
                    fields: "/api/raw/file/single_cell/$datasetId/fields.json.gz",
                    coordinates: "/api/raw/file/single_cell/$datasetId/coordinates.tsv.gz",
                    expression: "/api/bio/query/single-cell-lognorm?q=$datasetId,$gene",
                    markers: "/api/raw/file/single_cell/$datasetId/marker_genes.json.gz"
                },

                allMetadata: null, //raw metadata for all datasets
                metadata: null, //raw metadata for current dataset
                fields: null,   //raw fields
                coordinates: null,  //raw coordinates
                markers: null, //raw marker genes
                
                tableColumns: ["datasetName", "tissue", "method", "totalCells", { key: 'datasetId', label: 'View' }],
                currentDatasetsPage: 1,
                totalDatasets: null,
                datasetsPerPage: 3,

                componentsConfig: null,
                presetsConfig: null,

                showCellInfo: true,
                showCellProportion: true,
                showGeneExpression: true,
                showMarkerGenes: true,

                datasetId: null,
                cellTypeField: null,

                totalCells: null,

                //colorIndex: 0,
                //colorScaleIndex: d3.scaleOrdinal(colors),
                colorscaleGreyBlue: d3.scaleLinear().domain([0, 1]).range(["lightgrey", "blue"]),
                colorScalePlasma: d3.scaleSequential(d3.interpolatePlasma),
                colorScalePlasmaColorsArray: [],
                colorScaleGreyBlueColorsArray: [],

                labelColors: null,
                fieldsDisplayList: null,

                isStacked: false,
                isNormalized: false,

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
            llog('data', this.data);
            
            EventBus.$on('on-select',this.handleSelectEvent);
            this.init();
        },
        beforeDestroy(){
            EventBus.$off('on-select',this.handleSelectEvent);
        },
        computed: {
            isDev(){
                return keyParams['log']===1;
            },
            isATACseq(){
                if(this.metadata?.["method"]?.toLowerCase().includes('atac')){
                    return true;
                }
                return false;
            },
            filteredMetadata() {
                if(!this.allMetadata){
                    return;
                }
                if(this.allMetadata[0].data_type){
                    return this.allMetadata.filter(item => item.data_type === 'single_cell');
                }
                return this.allMetadata;
            }
        },
        methods: {
            calcCellCounts(a,b,c){
                return scUtils.calcCellCounts2(this.fields,this.labelColors,a,b,c);
            },
            clean(){
                this.allMetadata = null;
                this.metadata = null;
                this.dataLoaded = false;
                this.dataReady = false;
                this.expressionData = {};
                this.geneNames = [];
                this.markersList = [];
                this.expressionStatsAll = [];
                this.genesNotFound = [];
                this.dotPlotCellType = "",
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
            },
            async getBImetadata(){
                if(!this.selecedBI){
                    this.givenBI = keyParams["bioIndex"];
                    this.selectedBI = keyParams["bioIndex"] || this.renderConfig["bioIndex"];
                }
                const metadataEnpoint = this.selectedBI+this.BIendpoints.metadata;
                this.allMetadata = await scUtils.fetchMetadata(metadataEnpoint);
                if(!this.allMetadata){
                    llog('there was an error getting metadata');
                    return;
                }
                llog('allMetadata', this.allMetadata);
                this.totalDatasets = this.filteredMetadata.length;
                llog('filteredMetadata', this.filteredMetadata);
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

                const givenLayout = keyParams["layout"];
                this.layout = givenLayout ? givenLayout : this.presetsConfig?.["layout"] || 0;

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
                
                //fetch base data
                await this.getBImetadata();

                //metadata
                this.dataLoaded = false;
                this.preloadItem = 'metadata';
                //const metadataUrl = this.renderConfig["data points"].find(x => x.role === "metadata");
                //const metadataEnpoint = this.selectedBI+this.BIendpoints.metadata;
                //this.allMetadata = await scUtils.fetchMetadata(metadataEnpoint);
                //llog('addMetadata', this.allMetadata);
                if(this.allMetadata){
                    this.metadata = this.allMetadata.find(x => x.datasetId === this.datasetId);
                    llog('metadata', this.metadata);
                    this.totalCells = this.metadata.totalCells;
                }
                

                //fields
                this.preloadItem = 'fields';
                //const fieldsUrl = this.renderConfig["data points"].find(x => x.role === "fields");
                const fieldsEnpoint = this.selectedBI+this.BIendpoints.fields;
                this.fields = await scUtils.fetchFields(fieldsEnpoint, this.datasetId);
                if(this.fields){
                    this.fields["metadata_display_labels"] = this.renderConfig["format"]?.["default"]?.["displayMap"];
                    if(!this.totalCells){
                        this.totalCells = this.fields.NAME.length;
                    }
                    llog('fields', this.fields);
                }else{
                    llog('there was an error getting fields');
                }
                

                //coordinates
                this.preloadItem = 'coordinates';
                //const coordinatesUrl = this.renderConfig["data points"].find(x => x.role === "coordinates");
                const coordinatesEnpoint = this.selectedBI+this.BIendpoints.coordinates;
                this.coordinates = await scUtils.fetchCoordinates(coordinatesEnpoint, this.datasetId);
                if(this.coordinates){
                    llog('coordinates', this.coordinates);
                }else{
                    llog('there was an error getting coordinates');
                }

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
                //const markersUrl = this.renderConfig["data points"].find(x => x.role === "markers");
                const markersEnpoint = this.selectedBI+this.BIendpoints.markers;
                if(markersEnpoint){
                    const url = markersEnpoint;
                    this.markers = await scUtils.fetchMarkers(url, this.datasetId);
                    llog('markers', this.markers);
                    if(this.markers){
                        if(Array.isArray(this.markers)){
                            //latest markers includes gene stats
                            this.markersList = [...new Set(this.markers.map(x=>x.gene.toUpperCase()))];
                            this.markerCellTypes = [...new Set(this.markers.map(x=>x.cell_type))];

                           this.markersByGene = scUtils.groupByKey(this.markers, 'gene');
                           this.markersByCellType = scUtils.groupByKey(this.markers, 'cell_type');

                           const topN = 5;
                           const {markersMatrix, markersTable} = this.topNmarkersByCellType(topN);

                            this.geneNames = this.markersList;
                            this.markerGenes = markersMatrix;
                            this.markerGenesTable = markersTable;
                            this.markerGenesMaxMean = d3.max(this.markerGenes.map(d => d.mean_expression)).toFixed(1);
                            llog('markers', {markersByGene:this.markersByGene, markersByCellType:this.markersByCellType, transformedData:this.markerGenes, markersList:this.markersList});
                            
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

                this.preloadItem = '';
                this.dataLoaded = true;

                await Vue.nextTick();

                this.prepFields(this.fields);

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

                llog("cellTypeField", this.cellTypeField);
                
                //preset base visualizers to display by cell type
                this.cellCompositionVars.colorByField = this.cellTypeField;

                this.selectColorBy(this.cellTypeField);

                this.selectSegmentBy(this.cellTypeField, "");

                /*
                const cellProportion1 = scUtils.computeCellProportions(
                    this.fields.metadata, 
                    this.fields.metadata_labels,
                    [this.renderConfig.format.default.annotationGroups.cellType]
                )
                llog('cellProportions - cellType');
                console.table(cellProportion1.data);

                const cellProportion2 = scUtils.computeCellProportions(
                    this.fields.metadata, 
                    this.fields.metadata_labels,
                    [
                        this.renderConfig.format.default.annotationGroups.conditions[2],
                        this.renderConfig.format.default.annotationGroups.cellType
                    ]
                )
                llog('cellProportions - condition, cellType');
                console.table(cellProportion2.data);

                this.testCellProportions = scUtils.computeCellProportions(
                    this.fields.metadata, 
                    this.fields.metadata_labels,
                    [
                        this.renderConfig.format.default.annotationGroups.donors,
                        this.renderConfig.format.default.annotationGroups.cellType,
                        this.renderConfig.format.default.annotationGroups.conditions[5]
                    ],
                    false
                )
                llog('cellProportions - cellType, donors, condition');
                console.table(this.testCellProportions.data);

                this.testCellStats = scUtils.computeCellStats(
                    this.fields.metadata, 
                    this.fields.metadata_labels,
                    [this.renderConfig.format.default.annotationGroups.cellType],
                    this.renderConfig.format.default.annotationGroups.samples,
                    this.renderConfig.format.default.annotationGroups.conditions[2]
                )
                llog('cellStats - cellType, samples, condition', this.testCellStats);
                */

                //this.geneExpressionVars['a'].selectedLabel = this.cellTypeField;
                this.geneExpressionVars.selectedLabel = this.cellTypeField;

                this.dataReady = true;

                await Vue.nextTick();

                llog('++++++++++++ READY')

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
                    llog(addToKeyParams);

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
                llog('max', max);
                return max;
            },
            maxExpressionValue(gene){
                llog(gene, this.expressionData);
                return d3.max(this.expressionData[gene])
            },
            getStatsByPropValue(data, property, value){
                return data.filter(item => item[property] === value);
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

            displayLabel(rawLabel){
                if(this.fields['metadata_display_labels']?.[rawLabel]){
                    return this.fields['metadata_display_labels'][rawLabel];
                }else{
                    return rawLabel;
                }
            },
            topNmarkersByCellType(topN, cellTypeName){
                const markersMatrix = [];
                const markersTable = [];
                let topGenes = [];
                for (const [cellType, genes] of Object.entries(this.markersByCellType)) {
                    if(!cellTypeName || (cellTypeName && cellType===cellTypeName)){
                        if (genes.every(gene => gene.z_score != null)) {
                            topGenes = genes.sort((a, b) => b.z_score - a.z_score).slice(0, topN);
                        }else{
                            topGenes = genes.sort((a, b) => b.mean_expression - a.mean_expression).slice(0, topN);
                        }

                        for (const gene of topGenes) {
                            //console.log(gene.gene, gene.p_value_adj, gene.p_value_adj < 0.05, typeof gene.p_value_adj);
                            //if(gene.p_value_adj < 0.05){
                                markersMatrix.push(...this.markersByGene[gene.gene]);
                                markersTable.push({...gene});
                            //}
                        }
                    }
                }
                return {markersMatrix, markersTable};
            },



            

            /* handlers */
            showMarkersByCellType(cellType){
                if(cellType!=''){
                   // this.markerGenes = this.markersByCellType[cellType];
                    const {markersMatrix, markersTable} = this.topNmarkersByCellType(50, cellType);
                    this.markerGenes = markersMatrix;
                    this.markerGenesTable = markersTable;
                }else{
                    const {markersMatrix, markersTable} = this.topNmarkersByCellType(5);
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
                llog('segment by:', {display, segment});
                g.displayByLabel = display
                g.segmentByLabel = segment;
                g.segmentByCounts2 = scUtils.calcCellCounts(this.fields, this.labelColors, g.displayByLabel, g.segmentByLabel);
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
            },


            prepFields(fields){
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
</style>
  