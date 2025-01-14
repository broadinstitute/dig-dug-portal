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
                            <div class="tab" 
                                :class="`${isSelectedTab('a','1')?'selected':''}`"
                                @click="selectTab('a','1')">
                                Cell Composition
                            </div>
                            <div v-if="false" class="tab" 
                                :class="`${isSelectedTab('a','2')?'selected':''}`"
                                @click="selectTab('a','2')">
                                Gene Expression
                            </div>
                        </div>
                        <div class="tabs-section-wrapper">
                            <div class="tab-section" v-if="isSelectedTab('a','1')" style="display:flex; flex-direction: column; gap:20px; background:white; padding:20px;">
                                <div class="" style="display:flex; gap:20px;">
                                    <div v-if="coordinates" style="display:flex; flex-direction: column; width: min-content;">
                                        <div style="display:flex; justify-content: space-between; align-items: baseline;">
                                            <strong style="font-size: 16px; margin: 0 0 5px;">UMAP</strong> {{ coordinates.length.toLocaleString() }} cells
                                        </div>
                                        <research-umap-plot-gl 
                                            :points="coordinates"
                                            :labels="fields"
                                            :colors="labelColors"
                                            :cellTypeField="cellTypeField"
                                            :colorByField="cellCompositionVars['a'].colorByField"
                                            :highlightLabel="cellCompositionVars['a'].highlightLabel"
                                            :highlightLabels="cellCompositionVars['a'].highlightLabels"
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
                                            :colorByField="cellCompositionVars['a'].colorByField"
                                            :hoverFields="['cell_label', 'Donor']"
                                            :highlightLabel="cellCompositionVars['a'].highlightLabel"
                                            :highlightLabels="cellCompositionVars['a'].highlightLabels"
                                            :width="400"
                                            :labelSizePx="28"
                                        />
                                        -->
                                    </div>
                                    <div v-if="fieldsDisplayList" style="display:flex; flex-direction: column; align-self: flex-start; width:200px; height:400px">
                                        <strong style="font-size: 16px; margin: 0 0 5px;">Color By</strong>
                                        <research-single-cell-selector 
                                            :data="fields['metadata_labels']"
                                            :selectedField="cellCompositionVars['a'].colorByField"
                                            layout="dropdown-list"
                                            :colors="labelColors"
                                            @on-update="handleSelectorUpdate($event, 'a', '1')"
                                            @on-hover="handleSelectorHover($event, 'a', '1')"
                                        />
                                    </div>
                                </div>
                                <div style="display:flex; flex-direction: column; width: min-content; gap:10px; width:620px">
                                    <div style="font-size: 16px;"><span style="font-weight: bold">Cell Proportion</span> <span style="font-style: italic;">{{ cellCompositionVars['a'].segmentByLabel }}</span> per <span style="font-style: italic;">{{ cellCompositionVars['a'].displayByLabel }}</span></div>
                                    <div style="display:flex; gap:20px;">
                                        <div style="flex-grow: 1;">
                                            <div>Display</div>
                                            <research-single-cell-selector 
                                                :data="fields['metadata_labels']"
                                                layout="dropdown"
                                                :showColor="false"
                                                :selectedField="cellCompositionVars['a'].displayByLabel"
                                                @on-update="selectSegmentBy($event.selectedField, cellCompositionVars['a'].segmentByLabel, 'a')"
                                            />
                                        </div>
                                        <div style="flex-grow: 1;">
                                            <div>Subset By</div>
                                            <research-single-cell-selector 
                                                :data="fields['metadata_labels']"
                                                layout="dropdown"
                                                :showColor="false"
                                                selectedField=""
                                                @on-update="selectSegmentBy(cellCompositionVars['a'].displayByLabel, $event.selectedField, 'a')"
                                            />
                                        </div>
                                    </div>

                                    <research-single-cell-selector 
                                        :data="fields['metadata_labels']"
                                        layout="list"
                                        listDirection="horizontal"
                                        listAlignment="end"
                                        :colors="labelColors"
                                        :selectedField="cellCompositionVars['a'].segmentByLabel"
                                        @on-update="handleSelectorUpdate($event, 'a', '1')"
                                        @on-hover="handleSelectorHover($event, 'a', '1')"
                                    />

                                    <research-stacked-bar-plot
                                        :data="cellCompositionVars['a'].segmentByCounts2"
                                        :primaryKey="cellCompositionVars['a'].displayByLabel"
                                        :subsetKey="cellCompositionVars['a'].segmentByLabel"
                                        :xAxisLabel="cellCompositionVars['a'].displayByLabel"
                                        yAxisLabel="Count"
                                        :highlightKey="cellCompositionVars['a'].highlightLabel"
                                    />
                                </div>
                            </div>
                            <div class="tab-section" v-if="isSelectedTab('a','2')" style="display:flex; flex-direction: column; gap:20px; background:white; padding:20px; width:620px;">
                                <div class="" style="display:flex; gap:20px">
                                    <div v-if="coordinates" style="display:flex; flex-direction: column; width: min-content;">
                                        <div style="display:flex; justify-content: space-between; align-items: baseline;">
                                            <span style="font-size: 16px; margin: 0 0 5px;"><span style="font-weight: bold">UMAP</span> <span style="font-style: italic;">{{ geneExpressionVars['a'].selectedGene ? `${geneExpressionVars['a'].selectedGene}` : '' }}</span></span> {{ coordinates.length.toLocaleString() }} cells
                                        </div>
                                        <research-umap-plot
                                            :sectionId="sectionId"
                                            title=""
                                            :points="coordinates"
                                            :fields="fields"
                                            :cellTypeField="cellTypeField"
                                            :colorByField="cellCompositionVars['b'].colorByField"
                                            :hoverFields="['cell_label', 'Donor']"
                                            :expression="expressionData[geneExpressionVars['a'].selectedGene]"
                                            :expressionGene="geneExpressionVars['a'].selectedGene"
                                            :highlightLabel="cellCompositionVars['b'].highlightLabel"
                                            :highlightLabels="cellCompositionVars['b'].highlightLabels"
                                            :width="400"
                                            :labelSizePx="28"
                                        />
                                    </div>
                                    <div style="display:flex; flex-direction: column; align-self: flex-start; width:200px">
                                        <strong style="font-size: 16px; margin: 0 0 5px;">Gene Search</strong>
                                        <div style="display:flex; flex-direction: column; height: 400px">
                                            <div style="display:flex; gap:5px;">
                                                <input type="text" placeholder="Gene name" @keyup.enter="searchGene(geneToSearch)" v-model="geneToSearch" style="width:-webkit-fill-available;"/>
                                                <button @click="searchGene(geneToSearch)">
                                                    <svg style="width: 20px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000"><path fill-rule="evenodd" clip-rule="evenodd" d="M15 10.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm-.82 4.74a6 6 0 1 1 1.06-1.06l4.79 4.79-1.06 1.06-4.79-4.79Z" fill="#080341"/></svg>
                                                </button>
                                            </div>

                                            <research-single-cell-selector style="margin-top:4px; flex-grow:1; overflow-x: hidden; overflow-y: auto;"
                                                :data="geneNames"
                                                layout="list"
                                                listSelection="exclusive"
                                                :colors="null"
                                                :selectedField="geneExpressionVars['a'].selectedGene"
                                                @on-update="geneClick($event.coloredLabels[0], 'a')"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div v-if="geneExpressionVars['a'].expressionStats.length>0" style="display:flex; flex-direction: column; gap:10px">
                                        <div style="display:flex; flex-direction: column; gap:10px">
                                            <span style="font-size: 16px;"><span style="font-weight: bold;">Gene Expression</span> <span style="font-style: italic;">{{ geneExpressionVars['a'].selectedGene ? `${geneExpressionVars['a'].selectedGene}` : '' }}</span></span>
                                            <div style="display:flex; gap:20px">
                                                <div style="display:flex; flex-direction: column; align-items: baseline; flex: 1">
                                                    <div>Display</div>
                                                    <div style="width:100%">
                                                        <select @change="selectExpressionBy($event, 'a')" v-model="geneExpressionVars['a'].selectedLabel" style="width: 100%;">
                                                            <option value="">-- Select --</option>
                                                            <option v-for="option of fieldsDisplayList" :value="option['raw field']">
                                                                {{ option['field label'] }}
                                                            </option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div style="display:flex; flex-direction: column; align-items: baseline; flex: 1">
                                                    <div>Subset by</div>
                                                    <div style="width:100%">
                                                        <select @change="selectExpressionBy($event, 'a')" v-model="geneExpressionVars['a'].subsetLabel" style="width: 100%;">
                                                            <option value="">-- Select --</option>
                                                            <option v-for="option of fieldsDisplayList" :value="option['raw field']">
                                                                {{ option['field label'] }}
                                                            </option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>


                                        <research-single-cell-selector 
                                            :data="fields['metadata_labels']"
                                            layout="list"
                                            listDirection="horizontal"
                                            listAlignment="end"
                                            :colors="labelColors"
                                            :selectedField="geneExpressionVars['a'].subsetLabel"
                                            @on-update="handleSelectorUpdate($event, 'b', '1')"
                                            @on-hover="handleSelectorHover($event, 'b', '1')"
                                        />

                                        <research-violin-plot 
                                            :data="geneExpressionVars['a'].expressionStats"
                                            :primaryKey="geneExpressionVars['a'].selectedLabel"
                                            :subsetKey="geneExpressionVars['a'].subsetLabel"
                                            :highlightKey="cellCompositionVars['b'].highlightLabel"
                                            :height="300"
                                            xAxisLabel="Log-Normalized Expression"
                                            :yAxisLabel="`${geneExpressionVars['a'].selectedLabel} ${geneExpressionVars['a'].subsetLabel!=''?' x '+geneExpressionVars['a'].subsetLabel:''}`"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                    <!--<div style="padding: 8px 0 0 0; font-size:16px;">vs</div>-->
                    <!--right tab group-->
                    <div class="tabs-group">
                        <div class="tabs-wrapper">
                            <div  v-if="false" class="tab" 
                                :class="`${isSelectedTab('b','1')?'selected':''}`"
                                @click="selectTab('b','1')">
                                Cell Composition
                            </div>
                            <div class="tab" 
                                :class="`${isSelectedTab('b','2')?'selected':''}`"
                                @click="selectTab('b','2')">
                                Gene Expression
                            </div>
                        </div>
                        <div class="tabs-section-wrapper">
                            <div class="tab-section" v-if="isSelectedTab('b','1')" style="display:flex; flex-direction: column; gap:20px; background:white; padding:20px;">
                                <div class="" style="display:flex; gap:20px;">
                                    <div v-if="coordinates" style="display:flex; flex-direction: column; width: min-content;">
                                        <div style="display:flex; justify-content: space-between; align-items: baseline;">
                                            <strong style="font-size: 16px; margin: 0 0 5px;">UMAP</strong> {{ coordinates.length.toLocaleString() }} cells
                                        </div>
                                        <research-umap-plot
                                            :sectionId="sectionId"
                                            title=""
                                            :points="coordinates"
                                            :fields="fields"
                                            :fieldColors="labelColors"
                                            :cellTypeField="cellTypeField"
                                            :colorByField="cellCompositionVars['b'].colorByField"
                                            :hoverFields="['cell_label', 'Donor']"
                                            :highlightLabel="cellCompositionVars['b'].highlightLabel"
                                            :highlightLabels="cellCompositionVars['b'].highlightLabels"
                                            :width="400"
                                            :labelSizePx="28"
                                        />
                                    </div>
                                    <div v-if="fieldsDisplayList" style="display:flex; flex-direction: column; align-self: flex-start; width:200px">
                                        <strong style="font-size: 16px; margin: 0 0 5px;">Color By</strong>
                                        <research-single-cell-selector 
                                            :data="fields['metadata_labels']"
                                            layout="dropdown-list"
                                            :colors="labelColors"
                                            :selectedField="cellCompositionVars['b'].colorByField"
                                            @on-update="handleSelectorUpdate($event, 'b', '1')"
                                            @on-hover="handleSelectorHover($event, 'b', '1')"
                                        />
                                    </div>
                                </div>
                                <div style="display:flex; flex-direction: column; width: min-content; gap:10px; width:620px">
                                    <div style="font-size: 16px;"><span style="font-weight: bold">Cell Proportion</span> <span style="font-style: italic;">{{ cellCompositionVars['b'].segmentByLabel }}</span> per <span style="font-style: italic;">{{ cellCompositionVars['b'].displayByLabel }}</span></div>
                                    <div style="display:flex; gap:20px;">
                                        <div style="flex-grow: 1;">
                                            <div>Display</div>
                                            <div>
                                                <select @change="selectSegmentBy($event, cellCompositionVars['b'].segmentByLabel, 'b')" v-model="cellCompositionVars['b'].displayByLabel" style="width: 100%;">
                                                    <option value="">-- Select --</option>
                                                    <option v-for="option of fieldsDisplayList" :value="option['raw field']">
                                                        {{ option['field label'] }}
                                                    </option>
                                                </select>
                                            </div>
                                        </div>
                                        <div style="flex-grow: 1;">
                                            <div>Subset By</div>
                                            <div>
                                                <select @change="selectSegmentBy(cellCompositionVars['b'].displayByLabel, $event, 'b')" v-model="cellCompositionVars['b'].segmentByLabel" style="width: 100%;">
                                                    <option value="">-- Select --</option>
                                                    <option v-for="option of fieldsDisplayList" :value="option['raw field']">
                                                        {{ option['field label'] }}
                                                    </option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>


                                    <research-single-cell-selector 
                                        :data="fields['metadata_labels']"
                                        layout="list"
                                        listDirection="horizontal"
                                        listAlignment="end"
                                        :colors="labelColors"
                                        :selectedField="cellCompositionVars['b'].segmentByLabel"
                                        @on-update="handleSelectorUpdate($event, 'b', '1')"
                                        @on-hover="handleSelectorHover($event, 'b', '1')"
                                    />

                                    <research-stacked-bar-plot
                                        :data="cellCompositionVars['b'].segmentByCounts2"
                                        :primaryKey="cellCompositionVars['b'].displayByLabel"
                                        :subsetKey="cellCompositionVars['b'].segmentByLabel"
                                        :xAxisLabel="cellCompositionVars['b'].displayByLabel"
                                        yAxisLabel="Count"
                                        :highlightKey="cellCompositionVars['b'].highlightLabel"
                                    />
                                </div>
                            </div>
                            <div class="tab-section" v-if="isSelectedTab('b','2')" style="display:flex; flex-direction: column; gap:20px; background:white; padding:20px;">
                                <div class="" style="display:flex; gap:20px">
                                    <div v-if="coordinates" style="display:flex; flex-direction: column; width: min-content;">
                                        <div style="display:flex; justify-content: space-between; align-items: baseline;">
                                            <span style="font-size: 16px; margin: 0 0 5px;"><span style="font-weight: bold">UMAP</span> <span style="font-style: italic;">{{ geneExpressionVars['b'].selectedGene ? `${geneExpressionVars['b'].selectedGene}` : '' }}</span></span> {{ coordinates.length.toLocaleString() }} cells
                                        </div>
                                        <research-umap-plot-gl 
                                            :points="coordinates"
                                            :labels="fields"
                                            :colors="labelColors"
                                            :expression="expressionData[geneExpressionVars['b'].selectedGene]"
                                            :cellTypeField="cellTypeField"
                                            :highlightLabel="cellCompositionVars['a'].highlightLabel"
                                            :highlightLabels="cellCompositionVars['a'].highlightLabels"
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
                                            :colorByField="cellCompositionVars['a'].colorByField"
                                            :hoverFields="['cell_label', 'Donor']"
                                            :expression="expressionData[geneExpressionVars['b'].selectedGene]"
                                            :expressionGene="geneExpressionVars['b'].selectedGene"
                                            :highlightLabel="cellCompositionVars['a'].highlightLabel"
                                            :highlightLabels="cellCompositionVars['a'].highlightLabels"
                                            :width="400"
                                            :labelSizePx="28"
                                        />
                                        -->
                                    </div>


                                    <div style="display:flex; flex-direction: column; align-self: flex-start; width:200px">
                                        <strong style="font-size: 16px; margin: 0 0 5px;">Gene Search</strong>
                                        <div style="display:flex; flex-direction: column; height: 400px">
                                            <div style="display:flex; gap:5px;">
                                                <input type="text" placeholder="Gene name" @keyup.enter="searchGene(geneToSearch)" v-model="geneToSearch" style="width:-webkit-fill-available;"/>
                                                <button @click="searchGene(geneToSearch)">
                                                    <svg style="width: 20px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000"><path fill-rule="evenodd" clip-rule="evenodd" d="M15 10.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm-.82 4.74a6 6 0 1 1 1.06-1.06l4.79 4.79-1.06 1.06-4.79-4.79Z" fill="#080341"/></svg>
                                                </button>
                                            </div>

                                            <research-single-cell-selector style="margin-top:4px; flex-grow:1; overflow-x: hidden; overflow-y: auto;"
                                                :data="geneNames"
                                                layout="list"
                                                listSelection="exclusive"
                                                :colors="null"
                                                :selectedField="geneExpressionVars['b'].selectedGene"
                                                @on-update="geneClick($event.coloredLabels[0], 'b')"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div v-if="geneExpressionVars['b'].expressionStats.length>0" style="display:flex; flex-direction: column; gap:10px; width:620px">
                                        <div style="display:flex; flex-direction: column; gap:10px">
                                            <span style="font-size: 16px;"><span style="font-weight: bold;">Gene Expression</span> <span style="font-style: italic;">{{ geneExpressionVars['b'].selectedGene ? `${geneExpressionVars['b'].selectedGene}` : '' }}</span></span>
                                            <div style="display:flex; gap:20px;">
                                                <div style="flex-grow: 1;">
                                                    <div>Display</div>
                                                    <research-single-cell-selector 
                                                        :data="fields['metadata_labels']"
                                                        layout="dropdown"
                                                        :showColor="false"
                                                        :selectedField="geneExpressionVars['b'].selectedLabel"
                                                        @on-update="selectExpressionBy($event.selectedField, geneExpressionVars['b'].subsetLabel, 'b')"
                                                    />
                                                </div>
                                                <div style="flex-grow: 1;">
                                                    <div>Subset By</div>
                                                    <research-single-cell-selector 
                                                        :data="fields['metadata_labels']"
                                                        layout="dropdown"
                                                        :showColor="false"
                                                        selectedField=""
                                                        @on-update="selectExpressionBy(geneExpressionVars['b'].selectedLabel, $event.selectedField, 'b')"
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
                                            :selectedField="geneExpressionVars['b'].subsetLabel"
                                            @on-update="handleSelectorUpdate($event, 'a', '1')"
                                            @on-hover="handleSelectorHover($event, 'a', '1')"
                                        />

                                        <research-violin-plot
                                            :data="geneExpressionVars['b'].expressionStats"
                                            :primaryKey="geneExpressionVars['b'].selectedLabel"
                                            :subsetKey="geneExpressionVars['b'].subsetLabel"
                                            :highlightKey="cellCompositionVars['a'].highlightLabel"
                                            :height="300"
                                            xAxisLabel="Log-Normalized Expression"
                                            :yAxisLabel="`${geneExpressionVars['b'].selectedLabel} ${geneExpressionVars['b'].subsetLabel!=''?' x '+geneExpressionVars['b'].subsetLabel:''}`"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display:flex; gap:25px">
                    <!-- marker genes-->
                    <div v-if="showMarkerGenes && expressionStatsAll.length>0" style="display:flex; flex-direction: column; gap:20px; background:white; padding:20px; width:100%">
                        <div style="display:flex; flex-direction: column; gap:20px;">
                            <div style="display:flex; justify-content: space-between;">
                                <strong style="font-size: 16px; margin: 0 0 5px;">Marker Genes</strong>
                                <div style="display:flex; gap:5px" class="legends">
                                    <div style="display:flex; flex-direction: column;" class="legend">
                                        <div class="label">Expression</div>
                                        <div class="gradient" :style="`background: linear-gradient(to left, ${colorScalePlasmaColorsArray});`"></div>
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
                        
                            <research-dot-plot
                                style="display:flex; align-self: center"
                                :data="expressionStatsAll"
                                :geneKey="this.cellTypeField"
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
                        :selectedField="cellCompositionVars['a'].colorByField"
                        @on-update="handleSelectorUpdate($event, 'a', '1')"
                        @on-hover="handleSelectorHover($event, 'a', '1')"
                    />
                    <div class="" style="display:flex; gap:20px">
                        <div v-if="coordinates" style="display:flex; flex-direction: column; width: min-content;">
                            <div style="display:flex; justify-content: space-between; align-items: baseline;">
                                <span style="font-size: 16px; margin: 0 0 5px;"><span style="font-weight: bold">UMAP</span> <span style="font-style: italic;">{{ geneExpressionVars['b'].selectedGene ? `${geneExpressionVars['b'].selectedGene}` : '' }}</span></span> {{ coordinates.length.toLocaleString() }} cells
                            </div>
                            <div style="display:flex; position: relative">
                                <research-umap-plot-gl 
                                    :points="coordinates"
                                    :labels="fields"
                                    :colors="labelColors"
                                    :expression="expressionData[geneExpressionVars['b'].selectedGene]"
                                    :cellTypeField="cellTypeField"
                                    :highlightLabel="cellCompositionVars['a'].highlightLabel"
                                    :highlightLabels="cellCompositionVars['a'].highlightLabels"
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
                                    :colorByField="cellCompositionVars['a'].colorByField"
                                    :hoverFields="['cell_label']"
                                    :expression="expressionData[geneExpressionVars['b'].selectedGene]"
                                    :expressionGene="geneExpressionVars['b'].selectedGene"
                                    :highlightLabel="cellCompositionVars['a'].highlightLabel"
                                    :highlightLabels="cellCompositionVars['a'].highlightLabels"
                                    :width="400"
                                    :labelSizePx="28"
                                />
                                -->
                                <div style="display:flex; flex-direction: column; position:absolute; top:4px; left:5px;" class="legend">
                                    <div class="label">Expression</div>
                                    <div class="gradient" :style="`background: linear-gradient(to left, ${colorScalePlasmaColorsArray}); height:5px;`"></div>
                                    <div style="display:flex" class="marks"><div>0.0</div><div>3.0</div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="geneExpressionVars['b'].expressionStats.length>0" style="display:flex; flex-direction: column; flex: 1">
                        <div style="display:flex; flex-direction: column; gap:5px">
                            <span style="font-size: 16px;"><span style="font-weight: bold;">Gene Expression</span> <span style="font-style: italic;">{{ geneExpressionVars['b'].selectedGene ? `${geneExpressionVars['b'].selectedGene}` : '' }}</span></span>
                        </div>
                        <research-violin-plot 
                            :data="geneExpressionVars['b'].expressionStats"
                            :primaryKey="geneExpressionVars['b'].selectedLabel"
                            :subsetKey="geneExpressionVars['b'].subsetLabel"
                            :highlightKey="cellCompositionVars['a'].highlightLabel"
                            :height="400"
                            xAxisLabel="Log-Normalized Expression"
                            :yAxisLabel="geneExpressionVars['b'].selectedLabel"
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
                                :selectedField="cellCompositionVars['a'].colorByField"
                                @on-update="handleSelectorUpdate($event, 'a', '1')"
                                @on-hover="handleSelectorHover($event, 'a', '1')"
                            />
                            <research-umap-plot-gl 
                                :points="coordinates"
                                :labels="fields"
                                :colors="labelColors"
                                :cellTypeField="cellTypeField"
                                :colorByField="cellCompositionVars['a'].colorByField"
                                :highlightLabel="cellCompositionVars['a'].highlightLabel"
                                :highlightLabels="cellCompositionVars['a'].highlightLabels"
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
                                :colorByField="cellCompositionVars['a'].colorByField"
                                :hoverFields="['cell_label', 'Donor']"
                                :highlightLabel="cellCompositionVars['a'].highlightLabel"
                                :highlightLabels="cellCompositionVars['a'].highlightLabels"
                                :width="400"
                                :labelSizePx="28"
                            />
                            -->
                        </div>
                    </div>
                    
                    <div style="display:flex; flex-direction: column; gap:10px; flex:1">
                        <div style="font-size: 16px;"><span style="font-weight: bold">Cell Proportion</span> <span style="font-style: italic;">{{ cellCompositionVars['a'].segmentByLabel }}</span> per <span style="font-style: italic;">{{ cellCompositionVars['a'].displayByLabel }}</span></div>
                        <div style="display:flex; gap:20px;">
                            <div style="flex-grow: 1;">
                                <div>Display</div>
                                <research-single-cell-selector 
                                    :data="fields['metadata_labels']"
                                    layout="dropdown"
                                    :showColor="false"
                                    :selectedField="cellCompositionVars['a'].colorByField"
                                    @on-update="selectSegmentBy($event.selectedField, cellCompositionVars['a'].segmentByLabel, 'a')"
                                />
                            </div>
                            <div style="flex-grow: 1;">
                                <div>Subset By</div>
                                <research-single-cell-selector 
                                    :data="fields['metadata_labels']"
                                    layout="dropdown"
                                    :showColor="false"
                                    selectedField=""
                                    @on-update="selectSegmentBy(cellCompositionVars['a'].displayByLabel, $event.selectedField, 'a')"
                                />
                            </div>
                        </div>

                        <research-stacked-bar-plot
                            :data="cellCompositionVars['a'].segmentByCounts2"
                            :primaryKey="cellCompositionVars['a'].displayByLabel"
                            :subsetKey="cellCompositionVars['a'].segmentByLabel"
                            :xAxisLabel="cellCompositionVars['a'].displayByLabel"
                            yAxisLabel="Count"
                            :highlightKey="cellCompositionVars['a'].highlightLabel"
                            :height="300"
                        />

                        <research-single-cell-selector 
                            :data="fields['metadata_labels']"
                            layout="list"
                            listDirection="horizontal"
                            listAlignment="center"
                            :colors="labelColors"
                            :selectedField="cellCompositionVars['a'].segmentByLabel"
                            @on-update="handleSelectorUpdate($event, 'a', '1')"
                            @on-hover="handleSelectorHover($event, 'a', '1')"
                        />
                    </div>
                </div>
                <div style="display:flex; gap:20px; background: white; padding: 20px;">
                    <div style="display:flex; flex-direction: column; gap:10px; flex: 1">
                        <div style="font-size: 16px;"><span style="font-weight: bold">Gene Expression</span> <em>{{geneExpressionVars['b'].selectedGene}}</em></div>
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
                                    :selectedField="geneExpressionVars['b'].selectedGene"
                                    @on-update="geneClick($event.coloredLabels[0], 'b')"
                                />
                            </div>
                            
                            <research-umap-plot-gl 
                                :points="coordinates"
                                :labels="fields"
                                :colors="labelColors"
                                :expression="expressionData[geneExpressionVars['b'].selectedGene]"
                                :cellTypeField="cellTypeField"
                                :highlightLabel="cellCompositionVars['a'].highlightLabel"
                                :highlightLabels="cellCompositionVars['a'].highlightLabels"
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
                                :colorByField="cellCompositionVars['a'].colorByField"
                                :hoverFields="['cell_label', 'Donor']"
                                :expression="expressionData[geneExpressionVars['b'].selectedGene]"
                                :expressionGene="geneExpressionVars['b'].selectedGene"
                                :highlightLabel="cellCompositionVars['a'].highlightLabel"
                                :highlightLabels="cellCompositionVars['a'].highlightLabels"
                                :width="400"
                                :labelSizePx="28"
                            />
                            -->
                            <div v-if="expressionData[geneExpressionVars['b'].selectedGene]" 
                                style="display:flex; flex-direction: column; gap:10px; flex:1;">
                                <div style="display:flex; gap:20px;">
                                    <div style="flex-grow: 1;">
                                        <div>Display</div>
                                        <research-single-cell-selector 
                                            :data="fields['metadata_labels']"
                                            layout="dropdown"
                                            :showColor="false"
                                            :selectedField="geneExpressionVars['b'].selectedLabel"
                                            @on-update="selectExpressionBy($event.selectedField, geneExpressionVars['b'].subsetLabel, 'b')"
                                        />
                                    </div>
                                    <div style="flex-grow: 1;">
                                        <div>Subset By</div>
                                        <research-single-cell-selector 
                                            :data="fields['metadata_labels']"
                                            layout="dropdown"
                                            :showColor="false"
                                            selectedField=""
                                            @on-update="selectExpressionBy(geneExpressionVars['b'].selectedLabel, $event.selectedField, 'b')"
                                        />
                                    </div>
                                </div>

                                <research-violin-plot
                                    :data="geneExpressionVars['b'].expressionStats"
                                    :primaryKey="geneExpressionVars['b'].selectedLabel"
                                    :subsetKey="geneExpressionVars['b'].subsetLabel"
                                    :highlightKey="cellCompositionVars['a'].highlightLabel"
                                    :height="300"
                                    xAxisLabel="Log-Normalized Expression"
                                    :yAxisLabel="`${geneExpressionVars['b'].selectedLabel} ${geneExpressionVars['b'].subsetLabel!=''?' x '+geneExpressionVars['b'].subsetLabel:''}`"
                                />

                                <research-single-cell-selector
                                    :data="fields['metadata_labels']"
                                    layout="list"
                                    listDirection="horizontal"
                                    listAlignment="center"
                                    :colors="labelColors"
                                    :selectedField="geneExpressionVars['b'].subsetLabel"
                                    @on-update="handleSelectorUpdate($event, 'a', '1')"
                                    @on-hover="handleSelectorHover($event, 'a', '1')"
                                />

                            </div>
                        </div>
                    </div>
                    
                </div>
                <div v-if="showMarkerGenes && expressionStatsAll.length>0" style="display:flex; flex-direction: column; gap:20px; background:white; padding:20px; width:100%">
                    <div style="display:flex; flex-direction: column; gap:20px;">
                        <div style="display:flex; justify-content: space-between;">
                            <strong style="font-size: 16px; margin: 0 0 5px;">Marker Genes</strong>
                            <div style="display:flex; gap:5px" class="legends">
                                <div style="display:flex; flex-direction: column;" class="legend">
                                    <div class="label">Expression</div>
                                    <div class="gradient" :style="`background: linear-gradient(to left, ${colorScalePlasmaColorsArray});`"></div>
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
                    
                        <research-dot-plot
                            style="display:flex; align-self: center"
                            :data="expressionStatsAll"
                            :geneKey="this.cellTypeField"
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
                metadata: null, //raw metadata
                fields: null,   //raw fields
                coordinates: null,  //raw coordinates
                markers: null, //raw marker genes

                allMetadata: null,
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
                colorScalePlasma: d3.scaleSequential(d3.interpolatePlasma),
                colorScalePlasmaColorsArray: [],

                labelColors: null,
                fieldsDisplayList: null,

                geneNames: [], //list of loaded gene names
                expressionData: {}, //obj, keys are gene names, values are arrays of raw expression per cell
                expressionStatsAll: [], //array of objects, each obj is gene, mean expr., pct. expressing
                geneToSearch: "",

                dataLoaded: false,
                preloadItem: '',
                dataReady: false,

                highlightHoverTimeout: null,

                selectedTabs: {"a":"1", "b":"2"},

                layout: -1,

                cellCompositionVars: {},
                geneExpressionVars: {}
            }
        },
        watch: {
            datasetId: function(newVal, oldVal){
                /*
                if(oldVal && oldVal != newVal){
                    keyParams.set({[this.renderConfig["parameters"].gene] : ""});
                }
                */
            },
            expressionData(){
                const expressionStats = [];
                Object.keys(this.expressionData).forEach(gene => {
                    //expressionStats.push(...this.calcExpressionStats(gene, this.cellTypeField, null, true));
                    expressionStats.push(...scUtils.calcExpressionStats(this.fields, this.labelColors, this.expressionData[gene], gene, this.cellTypeField, null, true))
                })
                this.expressionStatsAll = expressionStats;
                console.log('updated expression stats', this.expressionStatsAll);
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
                this.expressionStatsAll = [];
                this.cellCompositionVars = {
                    "a": {
                        colorByField: null,
                        highlightLabel: '',
                        highlightLabels: [],
                        segmentByCounts2: null,
                        displayByLabel: null,
                        subsetLabel: "",
                    },
                    "b": {
                        colorByField: null,
                        highlightLabel: '',
                        highlightLabels: [],
                        segmentByCounts2: null,
                        displayByLabel: null,
                        subsetLabel: "",
                    }
                },
                this.geneExpressionVars = {
                    "a": {
                        selectedGene: null,
                        expressionStats: [],
                        selectedLabel: null,
                        subsetLabel: "",
                    },
                    "b": {
                        selectedGene: null,
                        expressionStats: [],
                        selectedLabel: null,
                        subsetLabel: "",
                    }
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
                /*
                const datasetInfo = this.data.find(x => x.datasetId === this.datasetId);

                //make sure dataset exists in the metadata
                /*if(!datasetInfo){
                    console.log('dataset', this.datasetId, 'not in collection');
                    this.datasetId = null;
                    return;
                }

                console.log('   dataset info', datasetInfo);
                */

                //clear existing data
                this.clean();
                
                //fetch base data
                this.dataLoaded = false;
                this.preloadItem = 'metadata';
                const metadataUrl = this.renderConfig["data points"].find(x => x.role === "metadata");
                this.allMetadata = await scUtils.fetchMetadata(metadataUrl.url);
                console.log('addMetadata', this.allMetadata);
                this.metadata = this.allMetadata.find(x => x.datasetId === this.datasetId);
                console.log('metadata', this.metadata);
                //this.metadata = await this.fetchMetadata();

                this.preloadItem = 'fields';
                const fieldsUrl = this.renderConfig["data points"].find(x => x.role === "fields");
                this.fields = await scUtils.fetchFields(fieldsUrl.url, this.datasetId);
                console.log('fields', this.fields);
                //this.fields = await this.fetchFields();

                this.preloadItem = 'coordinates';
                const coordinatesUrl = this.renderConfig["data points"].find(x => x.role === "coordinates");
                this.coordinates = await scUtils.fetchCoordinates(coordinatesUrl.url, this.datasetId);
                console.log('coordinates', this.coordinates);
                //this.coordinates = await this.fetchCoordinates();

                this.preloadItem = 'markers list';
                const markersUrl = this.renderConfig["data points"].find(x => x.role === "markers");
                if(markersUrl){
                    this.markers = await scUtils.fetchMarkers(markersUrl.url, this.datasetId);
                    const markersList = this.markers ? Object.values(this.markers).flat() : null;
                    console.log('markers', {markers:this.markers, markersList});
                }

                this.preloadItem = '';
                this.dataLoaded = true;

                await Vue.nextTick();

                //pre-calculate colors for labels in each field
                this.labelColors = scUtils.calcLabelColors(this.fields, colors);
                //this.labelColors = this.calcLabelColors(this.fields);
                
                this.colorScalePlasmaColorsArray = d3.range(0, 1.01, 0.1).map(t => this.colorScalePlasma(t)).join(', ');
                
                this.fieldsDisplayList = scUtils.calcFieldsDisplayList(this.fields);
                //this.fieldsDisplayList = this.calcFieldsDisplayList();

                //which field designates cell types or fallback as first field
                const givenCellTypeLabel = this.presetsConfig?.["cell type label"];
                const fieldsList = Object.keys(this.fields.metadata_labels);
                if(!givenCellTypeLabel || !fieldsList.includes(givenCellTypeLabel)){
                    this.cellTypeField = this.findCellTypeField(fieldsList);
                }else{
                    this.cellTypeField = givenCellTypeLabel;
                }
                //this.cellTypeField = this.presetsConfig?.["cell type label"] || Object.keys(this.fields["metadata_labels"])[0];
                //this.cellTypeField = "Cell.Type";

                console.log("cellTypeField", this.cellTypeField);
                
                //preset base visualizers to display by cell type
                this.cellCompositionVars['a'].colorByField = this.cellTypeField;

                this.selectColorBy(this.cellTypeField, 'a');
                //this.selectColorBy(this.cellTypeField, 'b');

                this.selectSegmentBy(this.cellTypeField, "", 'a');
                //this.selectSegmentBy(this.cellTypeField, "", 'b');

                //this.geneExpressionVars['a'].selectedLabel = this.cellTypeField;
                this.geneExpressionVars['b'].selectedLabel = this.cellTypeField;

                this.dataReady = true;

                await Vue.nextTick();

                console.log('++++++++++++ READY')

                //return;
                
                if(this.markers){
                    //load gene data markers api
                    console.log('loading marker genes');
                    for(const [key, val] of Object.entries(this.markers)){
                        for(const gene of val){
                            await this.getGeneExpression(gene.toUpperCase(), false);
                            await Vue.nextTick();
                        }
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
                            await this.getGeneExpression(gene.toUpperCase());
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
                    console.log(`${gene} already loaded`);
                    return;
                }

                const expressionUrl = this.renderConfig["data points"].find(x => x.role === "expression");
                const expressionResult = await scUtils.fetchGeneExpression(expressionUrl.url, gene, this.datasetId);
                
                if(expressionResult){
                    this.geneNames.push(gene);
                    Vue.set(this.expressionData, gene, expressionResult);

                    console.log('getGeneExpression', gene);
                    //console.log('   expressionData', this.expressionData);

                    //update query string gene params 
                    if(addToKeyParams && this.renderConfig["parameters"]?.gene){
                        let paramGenes = decodeURIComponent(keyParams[this.renderConfig["parameters"].gene]);
                        if(paramGenes){
                            const paramGenesArray = paramGenes==='undefined' ? [] : paramGenes.toLowerCase().split(',');
                            console.log(`try adding: ${gene} to ${paramGenesArray}`)
                            if(!paramGenesArray.includes(gene.toLowerCase())){
                                paramGenesArray.push(gene);
                                console.log(`not in list, adding: ${gene} to ${paramGenesArray}`)
                                keyParams.set({[this.renderConfig["parameters"].gene] : paramGenesArray.toString()});
                            }
                        }
                    }

                    await Vue.nextTick();

                    /*if(!this.geneExpressionVars['a'].selectedGene || setAsSelected){
                        this.geneClick(gene, 'a');
                    }*/
                    if(!this.geneExpressionVars['b'].selectedGene || setAsSelected){
                        this.geneClick(gene, 'b');
                    }
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
            selectColorBy(e, group){
                const val = typeof e === 'object' ? e.target.value : e;
                const g = this.cellCompositionVars[group];
                console.log('color by:', val);
                g.colorByField = val;
            },
            selectSegmentBy(display, segment, group){
                const displayVal = typeof display === 'object' ? display.target.value : display;
                const segmentVal = typeof segment === 'object' ? segment.target.value : segment;
                const g = this.cellCompositionVars[group];
                console.log('segment by:', {displayVal, segmentVal, group});
                g.displayByLabel = displayVal
                g.segmentByLabel = segmentVal;
                //g.segmentByCounts2 = this.calcCellCounts(g.displayByLabel, g.segmentByLabel);
                g.segmentByCounts2 = scUtils.calcCellCounts(this.fields, this.labelColors, g.displayByLabel, g.segmentByLabel);
                console.log('segmentByCounts2', g.segmentByCounts2);
            },
            selectExpressionBy(display, segment, group){
                const displayVal = typeof display === 'object' ? display.target.value : display;
                const segmentVal = typeof segment === 'object' ? segment.target.value : segment;
                const g = this.geneExpressionVars[group];
                console.log('expression by:', {displayVal, segmentVal, group});
                g.selectedLabel = displayVal;
                g.subsetLabel = segmentVal;
                //g.expressionStats = this.calcExpressionStats(g.selectedGene, g.selectedLabel, g.subsetLabel);
                g.expressionStats = scUtils.calcExpressionStats(this.fields, this.labelColors, this.expressionData[g.selectedGene], g.selectedGene, g.selectedLabel, g.subsetLabel);
            },
            selectExpressionBy2(e, group){
                const val = typeof e === 'object' ? e.target.value : e;
                const g = this.geneExpressionVars[group];
                console.log('expression by:', val, group, g);
                //g.expressionStats = this.calcExpressionStats(g.selectedGene, g.selectedLabel, g.subsetLabel);
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
            labelClick(e, group){
                const label = e;//e.target.dataset.label;
                const g = this.cellCompositionVars[group];
                const labelIdx = g.highlightLabels.indexOf(label);
                if(labelIdx>-1){
                    g.highlightLabels.splice(labelIdx, 1);
                }else{
                    g.highlightLabels.push(label);
                }
                console.log('highlightLabels', g.highlightLabels);
            },
            resetLabels(group){
                const g = this.cellCompositionVars[group];
                g.highlightLabels = [];
                console.log('resetLabels', g.highlightLabels);
            },

            geneClick(e, group){
                console.log('geneClick', e, group)
                const gene = e;
                const g = this.geneExpressionVars[group];
                //g.expressionStats = this.calcExpressionStats(gene, g.selectedLabel, g.subsetLabel);
                g.expressionStats = scUtils.calcExpressionStats(this.fields, this.labelColors, this.expressionData[gene], gene, g.selectedLabel, g.subsetLabel);
                g.selectedGene = gene;
            },

            selectTab(group, id){
                if(!this.selectedTabs[group]){
                    this.selectedTabs[group] = id;
                }else if(this.selectedTabs[group] != id){
                    this.selectedTabs[group] = id;
                }
            },
            isSelectedTab(group, id){
                if(this.selectedTabs[group] && this.selectedTabs[group] === id){
                    return true;
                }
                return false;
            },

            handleSelectorUpdate(e, group, id){
                console.log('selector updated', group, id, e);
                this.cellCompositionVars[group].highlightLabels = e.coloredLabels;
                this.selectColorBy(e.coloredField, group);
            },

            handleSelectorHover(e, group, id){
                console.log('selector hovered', group, id, e);
                this.cellCompositionVars[group].highlightLabel = e.hoveredLabel;
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
</style>
  