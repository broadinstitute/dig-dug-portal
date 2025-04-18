<template>
    <div style="display:flex; flex-direction: column; gap:10px; ">
        <template v-if="false">
            <b-table v-if="allMetadata"
                :items="allMetadata"
                :fields="tableColumns"
                striped
                hover
                responsive="sm"
                head-variant="light"
            >
                <template #cell(datasetId)="data">
                    <button v-if="data.item.datasetId !== datasetId" @click="selectDataset(data.item.datasetId)">Select</button>
                    <div v-else>Selected</div>
                </template>
            </b-table>
            <!--
            <b-pagination
                v-model=""
                class="pagination justify-content-center"
                :total-rows=""
                :per-page=""
            ></b-pagination>
            -->
        </template>
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
                                            :selectedField="cellCompositionVars.colorByField"
                                            layout="dropdown-list"
                                            :colors="labelColors"
                                            @on-update="handleSelectorUpdate($event)"
                                            @on-hover="handleSelectorHover($event)"
                                        />
                                    </div>
                                </div>
                                <div style="display:flex; flex-direction: column; width: min-content; gap:10px; width:620px">
                                    <div style="font-size: 16px;"><span style="font-weight: bold">Cell Proportion</span> <span style="font-style: italic;">{{ cellCompositionVars.segmentByLabel }}</span> per <span style="font-style: italic;">{{ cellCompositionVars.displayByLabel }}</span></div>
                                    <div style="display:flex; gap:20px;">
                                        <div style="flex-grow: 1;">
                                            <div>Display</div>
                                            <research-single-cell-selector 
                                                :data="fields['metadata_labels']"
                                                layout="dropdown"
                                                :showColor="false"
                                                :selectedField="cellCompositionVars.displayByLabel"
                                                @on-update="selectSegmentBy($event.selectedField, cellCompositionVars.segmentByLabel)"
                                            />
                                        </div>
                                        <div style="flex-grow: 1;">
                                            <div>Subset By</div>
                                            <research-single-cell-selector 
                                                :data="fields['metadata_labels']"
                                                layout="dropdown"
                                                :showColor="false"
                                                selectedField=""
                                                @on-update="selectSegmentBy(cellCompositionVars.displayByLabel, $event.selectedField)"
                                            />
                                        </div>
                                    </div>

                                    <research-single-cell-selector 
                                        :data="fields['metadata_labels']"
                                        layout="list"
                                        listDirection="horizontal"
                                        listAlignment="end"
                                        :colors="labelColors"
                                        :selectedField="cellCompositionVars.segmentByLabel"
                                        @on-update="handleSelectorUpdate($event)"
                                        @on-hover="handleSelectorHover($event)"
                                    />

                                    <research-stacked-bar-plot
                                        :data="cellCompositionVars.segmentByCounts2"
                                        :primaryKey="cellCompositionVars.displayByLabel"
                                        :subsetKey="cellCompositionVars.segmentByLabel"
                                        :xAxisLabel="cellCompositionVars.displayByLabel"
                                        yAxisLabel="Count"
                                        :highlightKey="cellCompositionVars.highlightLabel"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <!--<div style="padding: 8px 0 0 0; font-size:16px;">vs</div>-->
                    <!--right tab group-->
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
                                    <div v-if="geneExpressionVars.expressionStats.length>0" style="display:flex; flex-direction: column; gap:10px; width:620px">
                                        <div style="display:flex; flex-direction: column; gap:10px">
                                            <span style="font-size: 16px;"><span style="font-weight: bold;">Gene Expression</span> <span style="font-style: italic;">{{ geneExpressionVars.selectedGene ? `${geneExpressionVars.selectedGene}` : '' }}</span></span>
                                            <div style="display:flex; gap:20px;">
                                                <div style="flex-grow: 1;">
                                                    <div>Display</div>
                                                    <research-single-cell-selector 
                                                        :data="fields['metadata_labels']"
                                                        layout="dropdown"
                                                        :showColor="false"
                                                        :selectedField="geneExpressionVars.selectedLabel"
                                                        @on-update="selectExpressionBy($event.selectedField, geneExpressionVars.subsetLabel)"
                                                    />
                                                </div>
                                                <div style="flex-grow: 1;">
                                                    <div>Subset By</div>
                                                    <research-single-cell-selector 
                                                        :data="fields['metadata_labels']"
                                                        layout="dropdown"
                                                        :showColor="false"
                                                        selectedField=""
                                                        @on-update="selectExpressionBy(geneExpressionVars.selectedLabel, $event.selectedField)"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <research-single-cell-selector
                                            :data="fields['metadata_labels']"
                                            layout="list"
                                            listDirection="horizontal"
                                            listAlignment="end"
                                            :colors="labelColors"
                                            :selectedField="geneExpressionVars.subsetLabel"
                                            @on-update="handleSelectorUpdate($event)"
                                            @on-hover="handleSelectorHover($event)"
                                        />

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
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display:flex; gap:25px">
                    <!-- marker genes-->
                    <div v-if="showMarkerGenes && (markerGenes || expressionStatsAll.length>0)" style="display:flex; flex-direction: column; gap:20px; background:white; padding:20px; width:100%">
                        <div style="display:flex; flex-direction: column; gap:20px;">
                            <div style="display:flex; justify-content: space-between;">
                                <strong style="font-size: 16px; margin: 0 0 5px;">Marker Genes</strong>
                                <div style="display:flex; gap:5px" class="legends">
                                    <div style="display:flex; flex-direction: column;" class="legend">
                                        <div class="label">Expression</div>
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
                            <research-dot-plot
                                style="display:flex; align-self: center"
                                :data="markerGenes || expressionStatsAll"
                                :geneKey="expressionStatsAll.length>0 ? cellTypeField : 'cellType'"
                                primaryKey="gene"
                                orientation="horizontal"
                                :width="1300"
                                :fitToSize="true"
                                :cellWidth="30"
                                :showYLabels="true"
                                :showXLabels="true"
                                :positionXLabelsOnTop="true"
                                :positionYLabelsOnRight="false"
                                :marginBottom="50"
                                :marginLeft="-20"
                                :marginTop="10"
                                :marginRight="10"
                                highlightKey=""
                            />
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
                    <div class="" style="display:flex; gap:20px">
                        <div v-if="coordinates" style="display:flex; flex-direction: column; width: min-content;">
                            <div style="display:flex; justify-content: space-between; align-items: baseline;">
                                <span style="font-size: 16px; margin: 0 0 5px;"><span style="font-weight: bold">UMAP</span> <span style="font-style: italic;">{{ geneExpressionVars.selectedGene ? `${geneExpressionVars.selectedGene}` : '' }}</span></span> {{ metadata.totalCells.toLocaleString() }} cells
                            </div>
                            <div style="display:flex; position: relative">
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
            <div v-if="dataReady && layout===3" style="display:flex; flex-direction:column; width:100%; background: #f8f8f8; padding: 20px; gap: 20px;">
                <research-single-cell-info 
                    :data="metadata"
                />
                <div style="display:flex; gap:20px; background: white; padding: 20px;">
                    <div style="display:flex; flex-direction: column; gap:10px;">
                        <div style="font-size: 16px;"><span style="font-weight: bold">Cell Composition</span></div>
                        <div style="display:flex; gap:20px">
                            <research-single-cell-selector style="width:200px"
                                :data="fields['metadata_labels']"
                                layout="dropdown-list"
                                :colors="labelColors"
                                :selectedField="cellCompositionVars.colorByField"
                                @on-update="handleSelectorUpdate($event)"
                                @on-hover="handleSelectorHover($event)"
                            />
                            <research-umap-plot-gl 
                                :group="datasetId"
                                :points="coordinates"
                                :labels="fields"
                                :colors="labelColors"
                                :cellTypeField="cellTypeField"
                                :hoverFields="[]"
                                :colorByField="cellCompositionVars.colorByField"
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
                    </div>
                    
                    <div style="display:flex; flex-direction: column; gap:10px; flex:1">
                        <div style="font-size: 16px;"><span style="font-weight: bold">Cell Proportion</span> <span style="font-style: italic;">{{ cellCompositionVars.segmentByLabel }}</span> per <span style="font-style: italic;">{{ cellCompositionVars.displayByLabel }}</span></div>
                        <div style="display:flex; gap:20px;">
                            <div style="flex-grow: 1;">
                                <div>Display</div>
                                <research-single-cell-selector 
                                    :data="fields['metadata_labels']"
                                    layout="dropdown"
                                    :selectedField="cellCompositionVars.colorByField"
                                    @on-update="selectSegmentBy($event.selectedField, cellCompositionVars.segmentByLabel)"
                                />
                            </div>
                            <div style="flex-grow: 1;">
                                <div>Subset By</div>
                                <research-single-cell-selector 
                                    :data="fields['metadata_labels']"
                                    layout="dropdown"
                                    selectedField=""
                                    @on-update="selectSegmentBy(cellCompositionVars.displayByLabel, $event.selectedField)"
                                />
                            </div>
                        </div>

                        <research-stacked-bar-plot
                            :data="cellCompositionVars.segmentByCounts2"
                            :primaryKey="cellCompositionVars.displayByLabel"
                            :subsetKey="cellCompositionVars.segmentByLabel"
                            :xAxisLabel="cellCompositionVars.displayByLabel"
                            yAxisLabel="Count"
                            :highlightKey="cellCompositionVars.highlightLabel"
                            :height="300"
                        />

                        <research-single-cell-selector 
                            :data="fields['metadata_labels']"
                            layout="list"
                            listDirection="horizontal"
                            listAlignment="center"
                            :colors="labelColors"
                            :selectedField="cellCompositionVars.segmentByLabel"
                            @on-update="handleSelectorUpdate($event)"
                            @on-hover="handleSelectorHover($event)"
                        />
                    </div>
                </div>
                <div style="display:flex; gap:20px; background: white; padding: 20px;">
                    <div style="display:flex; flex-direction: column; gap:10px; flex: 1">
                        <div style="font-size: 16px;"><span style="font-weight: bold">Gene Expression</span> <em>{{geneExpressionVars.selectedGene}}</em></div>
                        <div style="display:flex; gap:20px;">

                            <div style="display:flex; flex-direction: column; height: 400px">
                                <div style="display:flex; gap:5px;">
                                    <input type="text" placeholder="Gene name" @keyup.enter="searchGene(geneToSearch)" v-model="geneToSearch" style="width:-webkit-fill-available;"/>
                                    <button @click="searchGene(geneToSearch)">
                                        <svg style="width: 20px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000"><path fill-rule="evenodd" clip-rule="evenodd" d="M15 10.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm-.82 4.74a6 6 0 1 1 1.06-1.06l4.79 4.79-1.06 1.06-4.79-4.79Z" fill="#080341"/></svg>
                                    </button>
                                </div>

                                <research-single-cell-selector style="margin-top:4px; flex-grow:1; overflow-x: hidden; overflow-y: auto; width:200px;"
                                    :data="geneNames"
                                    layout="list"
                                    listSelection="exclusive"
                                    :colors="null"
                                    :selectedField="geneExpressionVars.selectedGene"
                                    @on-update="geneClick($event.coloredLabels[0])"
                                />
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
                            <div v-if="expressionData[geneExpressionVars.selectedGene]" 
                                style="display:flex; flex-direction: column; gap:10px; flex:1;">
                                <div style="display:flex; gap:20px;">
                                    <div style="flex-grow: 1;">
                                        <div>Display</div>
                                        <research-single-cell-selector 
                                            :data="fields['metadata_labels']"
                                            layout="dropdown"
                                            :showColor="false"
                                            :selectedField="geneExpressionVars.selectedLabel"
                                            @on-update="selectExpressionBy($event.selectedField, geneExpressionVars.subsetLabel)"
                                        />
                                    </div>
                                    <div style="flex-grow: 1;">
                                        <div>Subset By</div>
                                        <research-single-cell-selector 
                                            :data="fields['metadata_labels']"
                                            layout="dropdown"
                                            :showColor="false"
                                            selectedField=""
                                            @on-update="selectExpressionBy(geneExpressionVars.selectedLabel, $event.selectedField)"
                                        />
                                    </div>
                                </div>

                                <research-violin-plot
                                    :data="geneExpressionVars.expressionStats"
                                    :primaryKey="geneExpressionVars.selectedLabel"
                                    :subsetKey="geneExpressionVars.subsetLabel"
                                    :highlightKey="cellCompositionVars.highlightLabel"
                                    :height="300"
                                    xAxisLabel="Log-Normalized Expression"
                                    :yAxisLabel="`${geneExpressionVars.selectedLabel} ${geneExpressionVars.subsetLabel!=''?' x '+geneExpressionVars.subsetLabel:''}`"
                                />

                                <research-single-cell-selector
                                    :data="fields['metadata_labels']"
                                    layout="list"
                                    listDirection="horizontal"
                                    listAlignment="center"
                                    :colors="labelColors"
                                    :selectedField="geneExpressionVars.subsetLabel"
                                    @on-update="handleSelectorUpdate($event)"
                                    @on-hover="handleSelectorHover($event)"
                                />

                            </div>
                        </div>
                    </div>
                    
                </div>
                <div v-if="showMarkerGenes && (markerGenes || expressionStatsAll.length>0)" style="display:flex; flex-direction: column; gap:20px; background:white; padding:20px; width:100%">
                    <div style="display:flex; flex-direction: column; gap:20px;">
                        <div style="display:flex; justify-content: space-between;">
                            <strong style="font-size: 16px; margin: 0 0 5px;">Marker Genes</strong>
                            <div style="display:flex; gap:5px" class="legends">
                                <div style="display:flex; flex-direction: column;" class="legend">
                                    <div class="label">Expression</div>
                                    <div class="gradient" :style="`background: linear-gradient(to right, ${colorScalePlasmaColorsArray});`"></div>
                                    <div style="display:flex" class="marks"><div>0.0</div><div>3.0</div></div>
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
                        
                        <!--:data="expressionStatsAll"-->
                        <!--:geneKey="cellTypeField"-->
                        <research-dot-plot
                            style="display:flex; align-self: center"
                            :data="markerGenes || expressionStatsAll"
                            :geneKey="expressionStatsAll.length>0 ? cellTypeField : 'cellType'"
                            primaryKey="gene"
                            orientation="horizontal"
                            :width="620"
                            :fitToSize="false"
                            :cellWidth="30"
                            :showYLabels="true"
                            :showXLabels="true"
                            :positionXLabelsOnTop="true"
                            :positionYLabelsOnRight="false"
                            :marginBottom="50"
                            :marginLeft="-20"
                            :marginTop="10"
                            :marginRight="10"
                            highlightKey=""
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
        "parameters":{
          "datasetId": "PKBdatasetId",
          "gene": "PKBgene"
        },
        "data points":[ 
          {
            "role": "metadata",
            "url": "https://skin.hugeampkpnbi.org/api/raw/file/single_cell_metadata/dataset_metadata.json.gz"
          },{
            "role": "fields",
            "url": "https://skin.hugeampkpnbi.org/api/raw/file/single_cell/$datasetId/fields.json.gz"
          },{
            "role": "coordinates",
            "url": "https://skin.hugeampkpnbi.org/api/raw/file/single_cell/$datasetId/coordinates.tsv.gz"
          },{
            "role": "expression",
            "url": "https://skin.hugeampkpnbi.org/api/bio/query/single-cell-lognorm?q=$datasetId,$gene"
          },{
            "role": "markers",
            "url": "https://skin.hugeampkpnbi.org/api/raw/file/single_cell/$datasetId/marker_genes.json.gz"
          }
        ],
        "components": {
          "cell info": {
            "enabled": true
          },
          "cell proportion": {
            "enabled": true
          },
          "gene expression": {
            "enabled": true
          },
          "marker genes": {
            "enabled": true
          }
        },
        "presets": {
          "cell type label": "Cell Type",
          "samples label": "Samples",

          "genes": []
        }
    }


    proposed render config
    {
        "type": "cell browser",
        "label": "Single Cell Browser",
        "parameters":{
          "datasetId": "PKBdatasetId",
          "gene": "PKBgene"
        },
        "bio_index": "skin",
        "fields":["field.A", "field.B", "field.C"],
        "fields":[
            {
                "raw": "field.A",
                "clean": "Field A",
                "type": "cont"
            }
        ],
        "data points":[ 
          {
            "role": "metadata",
            "url": "https://skin.hugeampkpnbi.org/api/raw/file/single_cell_metadata/dataset_metadata.json.gz"
          },{
            "role": "fields",
            "url": "https://skin.hugeampkpnbi.org/api/raw/file/single_cell/$datasetId/fields.json.gz"
          },{
            "role": "coordinates",
            "url": "https://skin.hugeampkpnbi.org/api/raw/file/single_cell/$datasetId/coordinates.tsv.gz"
          },{
            "role": "expression",
            "url": "https://skin.hugeampkpnbi.org/api/bio/query/single-cell-lognorm?q=$datasetId,$gene"
          },{
            "role": "markers",
            "url": "https://skin.hugeampkpnbi.org/api/raw/file/single_cell/$datasetId/marker_genes.json.gz"
          }
        ],
        "components": {
          "cell info": {
            "enabled": true
          },
          "cell proportion": {
            "enabled": true
          },
          "gene expression": {
            "enabled": true
          },
          "marker genes": {
            "enabled": true
          }
        },
        "presets": {
          "cell type label": "Cell Type",
          "genes": []
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
    import ResearchDotPlot from "@/components/researchPortal/singleCellBrowser/ResearchDotPlot.vue";
    import ResearchViolinPlot from "@/components/researchPortal/singleCellBrowser/ResearchViolinPlot.vue";
    import ResearchSingleCellSelector from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellSelector.vue";
    import ResearchSingleCellInfo from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellInfo.vue";

    const colors = ["#007bff","#048845","#8490C8","#BF61A5","#EE3124","#FCD700","#5555FF","#7aaa1c","#F88084","#9F78AC","#F5A4C7","#CEE6C1","#cccc00","#6FC7B6","#D5A768","#d4d4d4"]

    export default Vue.component('research-single-cell-browser', {
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

                //metadata
                this.dataLoaded = false;
                this.preloadItem = 'metadata';
                const metadataUrl = this.renderConfig["data points"].find(x => x.role === "metadata");
                this.allMetadata = await scUtils.fetchMetadata(metadataUrl.url);
                llog('addMetadata', this.allMetadata);
                this.metadata = this.allMetadata.find(x => x.datasetId === this.datasetId);
                llog('metadata', this.metadata);

                //fields
                this.preloadItem = 'fields';
                const fieldsUrl = this.renderConfig["data points"].find(x => x.role === "fields");
                this.fields = await scUtils.fetchFields(fieldsUrl.url, this.datasetId);
                llog('fields', this.fields);

                //coordinates
                this.preloadItem = 'coordinates';
                const coordinatesUrl = this.renderConfig["data points"].find(x => x.role === "coordinates");
                this.coordinates = await scUtils.fetchCoordinates(coordinatesUrl.url, this.datasetId);
                llog('coordinates', this.coordinates);

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
                            llog('markers', {markersByGene, markersByCellType, transformedData:this.markerGenes, markersList:this.markersList});
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
                const expressionUrl = this.renderConfig["data points"].find(x => x.role === "expression");
                const expressionResult = await scUtils.fetchGeneExpression(expressionUrl.url, gene, this.datasetId);
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
                    llog(this.sectionId, 'Received on-select event:', data);
                    this.datasetId = data.value;
                    if(this.renderConfig["parameters"]?.datasetId){
                        keyParams.set({[this.renderConfig["parameters"]?.datasetId] : this.datasetId});
                    }
                    this.init();
                }
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
                Object.entries(fields.metadata_labels).forEach(([key, value]) => {
                    //const colType = scUtils.detectVarType(value);
                    //metadata_types[key] = colType;

                    //include only fields with more than 1 value
                    if(value.length < 2) metadata_to_remove.push(key)
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
  