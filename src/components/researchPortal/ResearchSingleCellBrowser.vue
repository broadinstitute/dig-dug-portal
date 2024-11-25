<template>
    <div style="display:flex; flex-direction: column; gap:10px;">
        <div v-if="!datasetId" style="color:red; margin:0 auto">
            Please Select a Dataset
        </div>
        <div v-if="datasetId && !dataLoaded" style="margin: 0 auto">
            Loading
        </div>
        <div v-if="dataLoaded" style="display:flex; flex-direction: column; gap:20px; width: min-content; align-self: center;">
            <div>
                <div style="display:flex; flex-direction:column; margin: 0 0 20px">
                    <strong style="font-size:20px">{{ this.datasetData["Name"] }}</strong>
                    <em>{{ this.datasetData["Authors"] || '' }}</em>
                </div>
                <div style="display:flex; flex-direction: column; gap:5px">
                    <div style="display:flex;">
                        <div style="font-weight: bold; width: 100px;">Species</div>
                        <div>{{ this.datasetData["Species"] || 'NA' }}</div>
                    </div>
                    <div style="display:flex;">
                        <div style="font-weight: bold; width: 100px;">Tissue</div>
                        <div>{{ this.datasetData["Tissue"] || 'NA' }}</div>
                    </div>
                    <div style="display:flex;">
                        <div style="font-weight: bold; width: 100px;">Depot</div>
                        <div>{{ this.datasetData["Depot"] || 'NA' }}</div>
                    </div>
                    <div style="display:flex;">
                        <div style="font-weight: bold; width: 100px;">Cell Count</div>
                        <div>{{ this.datasetData["Total Cells"]?.toLocaleString() || 'NA' }}</div>
                    </div>
                </div>
            </div>
            <div class="" style="display:flex; gap:5px">
                <div class="tabs-group">
                    <div class="tabs-wrapper" style="align-self:flex-end">
                        <div class="tab" 
                             :class="`${isSelectedTab('a','1')?'selected':''}`"
                             @click="selectTab('a','1')">
                            Cell Composition
                        </div>
                        <div class="tab" 
                             :class="`${isSelectedTab('a','2')?'selected':''}`"
                             @click="selectTab('a','2')">
                            Gene Expression
                        </div>
                    </div>
                    <div class="tabs-section-wrapper">
                        <div class="tab-section" v-if="isSelectedTab('a','1')" style="display:flex; flex-direction: column; gap:20px; border:1px solid #ddd; padding:20px;">
                            <div class="" style="display:flex; gap:20px;">
                                <div v-if="coordinates" style="display:flex; flex-direction: column; width: min-content;">
                                    <div style="display:flex; justify-content: space-between; align-items: baseline;">
                                        <strong style="font-size: 16px; margin: 0 0 5px;">UMAP</strong> {{ coordinates.length.toLocaleString() }} cells
                                    </div>
                                    <research-umap-plot
                                        :sectionId="sectionId"
                                        title=""
                                        :points="coordinates"
                                        :colors="cellCompositionVars['a'].umapColors"
                                        :fields="rawData"
                                        :cellTypeField="cellTypeField"
                                        :colorByField="cellCompositionVars['a'].colorByLabel"
                                        :hoverFields="['cell_label', 'Donor']"
                                        :highlightLabel="cellCompositionVars['a'].highlightLabel"
                                        :highlightLabels="cellCompositionVars['a'].highlightLabels"
                                        :width="400"
                                        :labelSizePx="28"
                                        :isLoading="isLoadingData"
                                    />
                                </div>
                                <div v-if="colorByOptions" style="display:flex; flex-direction: column; align-self: flex-start; width:200px">
                                    <strong style="font-size: 16px; margin: 0 0 5px;">Color By</strong>
                                    <div style="display:flex; flex-direction: column; height: 400px">
                                        <div style="display:flex; gap:5px;">
                                            <div class="colorize-option"
                                                :class="cellCompositionVars['a'].highlightLabels.length===0?'active':''"
                                                @click="resetLabels('a')"
                                            >
                                                <svg viewBox="0 -0.5 17 17" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.333C3 13.463 5.427 16 8.418 16 11.41 16 14 13.463 14 10.333 14 7.204 8.418 0 8.418 0S3 7.204 3 10.333Z" fill="#434343"/></svg>
                                            </div>
                                            <select @change="selectColorBy($event, 'a')" v-model="cellCompositionVars['a'].colorByLabel" style="width: 100%;">
                                                <option v-for="option of colorByOptions" :value="option['raw field']">
                                                    {{ option['field label'] }}
                                                </option>
                                            </select>
                                        </div>
                                        <div style="margin-top:4px; flex-grow: 1; overflow-x: hidden; overflow-y: auto;">
                                            <div v-for="(color, label) of labelColors[cellCompositionVars['a'].colorByLabel]"
                                                style="display:flex; gap:5px; align-items: center; flex-wrap: nowrap;"
                                                :style="`opacity:${(cellCompositionVars['a'].highlightLabel!==''&&cellCompositionVars['a'].highlightLabel!==label)?(cellCompositionVars['a'].highlightLabels.length>0&&!cellCompositionVars['a'].highlightLabels.includes(label))?'0.25':'0.5':'1'}`"
                                                :data-label="label"
                                                @mouseover="labelHover(label, 'a')"
                                                @mouseout="labelHoverOut(label, 'a')"
                                            >
                                                <div class="colorize-option"
                                                    :class="(cellCompositionVars['a'].highlightLabels.length===0||cellCompositionVars['a'].highlightLabels.includes(label))?'active':''"
                                                    @click="labelClick(label, 'a')"
                                                >
                                                    <svg viewBox="0 -0.5 17 17" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.333C3 13.463 5.427 16 8.418 16 11.41 16 14 13.463 14 10.333 14 7.204 8.418 0 8.418 0S3 7.204 3 10.333Z" :fill="color"/></svg>
                                                </div>
                                                <!--<div :style="`width:10px; height:21px; background:${color}; pointer-events:none;`"></div>-->
                                                <div style="white-space: nowrap; cursor:default"
                                                    :style="`opacity:${(cellCompositionVars['a'].highlightLabel!==''&&cellCompositionVars['a'].highlightLabel!==label)?'0.5':'1'}`"
                                                >
                                                    {{ label }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div v-if="cellCompositionVars['a'].cellTypeInfo" style="display:flex; flex-direction: column; align-self: flex-start;">
                                    <div style="font-size: 16px; margin: 0 0 5px;"><span style="font-weight: bold;">Cell Count</span> per <span style="font-style: italic">{{ cellCompositionVars['a'].cellTypeInfo.key }}</span></div>
                                    <research-bar-plot-v2
                                        :data="cellCompositionVars['a'].cellTypeInfo.data[cellCompositionVars['a'].cellTypeInfo.key]"
                                        :categoryKey="cellCompositionVars['a'].cellTypeInfo.key"
                                        totalKey="Total"
                                        :colors="cellCompositionVars['a'].cellTypeInfo.colors"
                                        orientation="horizontal"
                                        :width="620"
                                        :margins="{top: 30, right: 10, bottom: 150, left: 80}"
                                        :fitToSize="true"
                                        :showBarLabels="true"
                                        :showValues="true"
                                        :highlightKey="cellCompositionVars['a'].highlightLabel"
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="tab-section" v-if="isSelectedTab('a','2')" style="display:flex; flex-direction: column; gap:20px; border:1px solid #ddd; padding:20px;">
                            <div class="" style="display:flex; gap:20px">
                                <div v-if="coordinates" style="display:flex; flex-direction: column; width: min-content;">
                                    <div style="display:flex; justify-content: space-between; align-items: baseline;">
                                        <span style="font-size: 16px; margin: 0 0 5px;"><span style="font-weight: bold">UMAP</span> <span style="font-style: italic;">{{ geneExpressionVars['a'].selectedGene ? `${geneExpressionVars['a'].selectedGene}` : '' }}</span></span> {{ coordinates.length.toLocaleString() }} cells
                                    </div>
                                    <research-umap-plot
                                        :sectionId="sectionId"
                                        title=""
                                        :points="coordinates"
                                        :colors="geneExpressionVars['a'].umapGeneColors"
                                        :fields="rawData"
                                        :cellTypeField="cellTypeField"
                                        :colorByField="cellCompositionVars['b'].colorByLabel"
                                        :hoverFields="['cell_label', 'Donor']"
                                        :expression="expressionData[geneExpressionVars['a'].selectedGene]"
                                        :expressionGene="geneExpressionVars['a'].selectedGene"
                                        :highlightLabel="cellCompositionVars['b'].highlightLabel"
                                        :highlightLabels="cellCompositionVars['b'].highlightLabels"
                                        :width="400"
                                        :labelSizePx="28"
                                        :isLoading="isLoadingData"
                                    />
                                </div>
                                <div v-if="cellCompositionVars['b'].cellTypeInfo" style="display:flex; flex-direction: column; align-self: flex-start; width:200px">
                                    <strong style="font-size: 16px; margin: 0 0 5px;">Gene Search</strong>
                                    <div style="display:flex; flex-direction: column; height: 400px">
                                        <div style="display:flex; gap:5px;">
                                            <input type="text" placeholder="Gene name" @keyup.enter="searchGene" style="width:-webkit-fill-available;"/>
                                            <button @click="searchGene">
                                                <svg style="width: 20px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000"><path fill-rule="evenodd" clip-rule="evenodd" d="M15 10.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm-.82 4.74a6 6 0 1 1 1.06-1.06l4.79 4.79-1.06 1.06-4.79-4.79Z" fill="#080341"/></svg>
                                            </button>
                                        </div>
                                        <div v-if="expressionStats.length>0" style="margin-top:4px; flex-grow:1; overflow-x: hidden; overflow-y: auto;">
                                            <div  v-for="gene in Object.keys(expressionStats[0])" style="display:flex; flex-direction: column;">
                                                <div style="display:flex; gap: 5px;">
                                                    <div class="colorize-option" 
                                                        :class="geneExpressionVars['a'].selectedGene===gene?'active':''"
                                                        @click="geneClick(gene, 'a')"
                                                    >
                                                        <svg viewBox="0 -0.5 17 17" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.333C3 13.463 5.427 16 8.418 16 11.41 16 14 13.463 14 10.333 14 7.204 8.418 0 8.418 0S3 7.204 3 10.333Z" fill="#434343"/></svg>
                                                    </div>
                                                    <div>{{ gene }}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div v-if="geneExpressionVars['a'].expressionStats.length>0" style="display:flex; flex-direction: column;">
                                    <div style="display:flex; justify-content: space-between;">
                                        <span style="font-size: 16px; margin: 0 0 5px;"><span style="font-weight: bold;">Gene Expression</span> <span style="font-style: italic;">{{ geneExpressionVars['a'].selectedGene ? `${geneExpressionVars['a'].selectedGene}` : '' }}</span></span>
                                        <div style="display:flex; gap: 5px; align-items: baseline;">
                                            <div>Expression by</div>
                                            <div>
                                                <select @change="selectExpressionBy($event, 'a')" v-model="geneExpressionVars['a'].selectedLabel" style="width: 100%;">
                                                    <option value="">-- Select --</option>
                                                    <option v-for="option of colorByOptions" :value="option['raw field']">
                                                        {{ option['field label'] }}
                                                    </option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <research-violin-plot 
                                        :data="geneExpressionVars['a'].expressionStats[0][geneExpressionVars['a'].selectedGene]"
                                        :colors="cellCompositionVars['b'].cellTypeInfo.colors"
                                        :highlightKey="cellCompositionVars['b'].highlightLabel"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="padding: 4px 0 0 0">vs</div>
                <div class="tabs-group">
                    <div class="tabs-wrapper">
                        <div class="tab" 
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
                        <div class="tab-section" v-if="isSelectedTab('b','1')" style="display:flex; flex-direction: column; gap:20px; border:1px solid #ddd; padding:20px;">
                            <div class="" style="display:flex; gap:20px;">
                                <div v-if="coordinates" style="display:flex; flex-direction: column; width: min-content;">
                                    <div style="display:flex; justify-content: space-between; align-items: baseline;">
                                        <strong style="font-size: 16px; margin: 0 0 5px;">UMAP</strong> {{ coordinates.length.toLocaleString() }} cells
                                    </div>
                                    <research-umap-plot
                                        :sectionId="sectionId"
                                        title=""
                                        :points="coordinates"
                                        :colors="cellCompositionVars['b'].umapColors"
                                        :fields="rawData"
                                        :cellTypeField="cellTypeField"
                                        :colorByField="cellCompositionVars['b'].colorByLabel"
                                        :hoverFields="['cell_label', 'Donor']"
                                        :highlightLabel="cellCompositionVars['b'].highlightLabel"
                                        :highlightLabels="cellCompositionVars['b'].highlightLabels"
                                        :width="400"
                                        :labelSizePx="28"
                                        :isLoading="isLoadingData"
                                    />
                                </div>
                                <div v-if="colorByOptions" style="display:flex; flex-direction: column; align-self: flex-start; width:200px">
                                    <strong style="font-size: 16px; margin: 0 0 5px;">Color By</strong>
                                    <div style="display:flex; flex-direction: column; height: 400px">
                                        <div style="display:flex; gap:5px;">
                                            <div class="colorize-option"
                                                :class="cellCompositionVars['b'].highlightLabels.length===0?'active':''"
                                                @click="resetLabels('a')"
                                            >
                                                <svg viewBox="0 -0.5 17 17" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.333C3 13.463 5.427 16 8.418 16 11.41 16 14 13.463 14 10.333 14 7.204 8.418 0 8.418 0S3 7.204 3 10.333Z" fill="#434343"/></svg>
                                            </div>
                                            <select @change="selectColorBy($event, 'b')" v-model="cellCompositionVars['b'].colorByLabel" style="width: 100%;">
                                                <option v-for="option of colorByOptions" :value="option['raw field']">
                                                    {{ option['field label'] }}
                                                </option>
                                            </select>
                                        </div>
                                        <div style="margin-top:4px; flex-grow: 1; overflow-x: hidden; overflow-y: auto;">
                                            <div v-for="(color, label) of labelColors[cellCompositionVars['b'].colorByLabel]"
                                                style="display:flex; gap:5px; align-items: center; flex-wrap: nowrap;"
                                                :style="`opacity:${(cellCompositionVars['b'].highlightLabel!==''&&cellCompositionVars['b'].highlightLabel!==label)?(cellCompositionVars['b'].highlightLabels.length>0&&!cellCompositionVars['b'].highlightLabels.includes(label))?'0.25':'0.5':'1'}`"
                                                :data-label="label"
                                                @mouseover="labelHover(label, 'b')"
                                                @mouseout="labelHoverOut(label, 'b')"
                                            >
                                                <div class="colorize-option"
                                                    :class="(cellCompositionVars['b'].highlightLabels.length===0||cellCompositionVars['b'].highlightLabels.includes(label))?'active':''"
                                                    @click="labelClick(label, 'b')"
                                                >
                                                    <svg viewBox="0 -0.5 17 17" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.333C3 13.463 5.427 16 8.418 16 11.41 16 14 13.463 14 10.333 14 7.204 8.418 0 8.418 0S3 7.204 3 10.333Z" :fill="color"/></svg>
                                                </div>
                                                <!--<div :style="`width:10px; height:21px; background:${color}; pointer-events:none;`"></div>-->
                                                <div style="white-space: nowrap; cursor:default"
                                                    :style="`opacity:${(cellCompositionVars['b'].highlightLabel!==''&&cellCompositionVars['b'].highlightLabel!==label)?'0.5':'1'}`"
                                                >
                                                    {{ label }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div v-if="cellCompositionVars['b'].cellTypeInfo" style="display:flex; flex-direction: column; align-self: flex-start;">
                                    <div style="font-size: 16px; margin: 0 0 5px;"><span style="font-weight: bold;">Cell Count</span> per <span style="font-style: italic">{{ cellCompositionVars['b'].cellTypeInfo.key }}</span></div>
                                    <research-bar-plot-v2
                                        :data="cellCompositionVars['b'].cellTypeInfo.data[cellCompositionVars['b'].cellTypeInfo.key]"
                                        :categoryKey="cellCompositionVars['b'].cellTypeInfo.key"
                                        totalKey="Total"
                                        :colors="cellCompositionVars['b'].cellTypeInfo.colors"
                                        orientation="horizontal"
                                        :width="620"
                                        :margins="{top: 30, right: 10, bottom: 150, left: 80}"
                                        :fitToSize="true"
                                        :showBarLabels="true"
                                        :showValues="true"
                                        :highlightKey="cellCompositionVars['b'].highlightLabel"
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="tab-section" v-if="isSelectedTab('b','2')" style="display:flex; flex-direction: column; gap:20px; border:1px solid #ddd; padding:20px;">
                            <div class="" style="display:flex; gap:20px">
                                <div v-if="coordinates" style="display:flex; flex-direction: column; width: min-content;">
                                    <div style="display:flex; justify-content: space-between; align-items: baseline;">
                                        <span style="font-size: 16px; margin: 0 0 5px;"><span style="font-weight: bold">UMAP</span> <span style="font-style: italic;">{{ geneExpressionVars['b'].selectedGene ? `${geneExpressionVars['b'].selectedGene}` : '' }}</span></span> {{ coordinates.length.toLocaleString() }} cells
                                    </div>
                                    <research-umap-plot
                                        :sectionId="sectionId"
                                        title=""
                                        :points="coordinates"
                                        :colors="geneExpressionVars['b'].umapGeneColors"
                                        :fields="rawData"
                                        :cellTypeField="cellTypeField"
                                        :colorByField="cellCompositionVars['a'].colorByLabel"
                                        :hoverFields="['cell_label', 'Donor']"
                                        :expression="expressionData[geneExpressionVars['b'].selectedGene]"
                                        :expressionGene="geneExpressionVars['b'].selectedGene"
                                        :highlightLabel="cellCompositionVars['a'].highlightLabel"
                                        :highlightLabels="cellCompositionVars['a'].highlightLabels"
                                        :width="400"
                                        :labelSizePx="28"
                                        :isLoading="isLoadingData"
                                    />
                                </div>
                                <div v-if="cellCompositionVars['a'].cellTypeInfo" style="display:flex; flex-direction: column; align-self: flex-start; width:200px">
                                    <strong style="font-size: 16px; margin: 0 0 5px;">Gene Search</strong>
                                    <div style="display:flex; flex-direction: column; height: 400px">
                                        <div style="display:flex; gap:5px;">
                                            <input type="text" placeholder="Gene name" @keyup.enter="searchGene" style="width:-webkit-fill-available;"/>
                                            <button @click="searchGene">
                                                <svg style="width: 20px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000"><path fill-rule="evenodd" clip-rule="evenodd" d="M15 10.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm-.82 4.74a6 6 0 1 1 1.06-1.06l4.79 4.79-1.06 1.06-4.79-4.79Z" fill="#080341"/></svg>
                                            </button>
                                        </div>
                                        <div v-if="expressionStats.length>0" style="margin-top:4px; flex-grow:1; overflow-x: hidden; overflow-y: auto;">
                                            <div  v-for="gene in Object.keys(expressionStats[0])" style="display:flex; flex-direction: column;">
                                                <div style="display:flex; gap: 5px;">
                                                    <div class="colorize-option" 
                                                        :class="geneExpressionVars['b'].selectedGene===gene?'active':''"
                                                        @click="geneClick(gene, 'b')"
                                                    >
                                                        <svg viewBox="0 -0.5 17 17" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.333C3 13.463 5.427 16 8.418 16 11.41 16 14 13.463 14 10.333 14 7.204 8.418 0 8.418 0S3 7.204 3 10.333Z" fill="#434343"/></svg>
                                                    </div>
                                                    <div>{{ gene }}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div v-if="geneExpressionVars['b'].expressionStats.length>0" style="display:flex; flex-direction: column;">
                                    <div style="display:flex; justify-content: space-between;">
                                        <span style="font-size: 16px; margin: 0 0 5px;"><span style="font-weight: bold;">Gene Expression</span> <span style="font-style: italic;">{{ geneExpressionVars['b'].selectedGene ? `${geneExpressionVars['b'].selectedGene}` : '' }}</span></span>
                                        <div style="display:flex; gap: 5px; align-items: baseline;">
                                            <div>Expression by</div>
                                            <div>
                                                <select @change="selectExpressionBy($event, 'b')" v-model="geneExpressionVars['b'].selectedLabel" style="width: 100%;">
                                                    <option value="">-- Select --</option>
                                                    <option v-for="option of colorByOptions" :value="option['raw field']">
                                                        {{ option['field label'] }}
                                                    </option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <research-violin-plot 
                                        :data="geneExpressionVars['b'].expressionStats[0][ geneExpressionVars['b'].selectedGene ]"
                                        :colors="cellCompositionVars['a'].cellTypeInfo.colors"
                                        :highlightKey="cellCompositionVars['a'].highlightLabel"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style="display:flex; gap:20px">
                <div v-if="showCellProportion" style="display:flex; flex-direction: column; gap:20px; border:1px solid #ddd; padding:20px;">
                    <div v-if="segmentByCounts" style="display:flex; flex-direction: column; width: min-content; gap:20px;">
                        <div style="font-size: 16px; margin: 0 0 5px;"><span style="font-weight: bold">Cell Proportion</span> <span style="font-style: italic;">{{ segmentByLabel }}</span> per <span style="font-style: italic;">{{ displayByLabel }}</span></div>
                        <div style="display:flex; gap:20px;">
                            <div style="flex-grow: 1;">
                                <div>Display (x-axis)</div>
                                <div>
                                    <select @change="selectSegmentBy($event, segmentByLabel)" v-model="displayByLabel" style="width: 100%;">
                                        <option value="">-- Select --</option>
                                        <option v-for="option of colorByOptions" :value="option['raw field']">
                                            {{ option['field label'] }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                            <div style="flex-grow: 1;">
                                <div>Color/Group By (y-axis)</div>
                                <div>
                                    <select @change="selectSegmentBy(displayByLabel, $event)" v-model="segmentByLabel" style="width: 100%;">
                                        <option value="">-- Select --</option>
                                        <option v-for="option of colorByOptions" :value="option['raw field']">
                                            {{ option['field label'] }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; flex-wrap: wrap; justify-content: flex-end; column-gap:5px; margin: 0 15px 0 35px;">
                            <div v-for="(color, label) of labelColors[segmentByLabel]"
                                style="display:flex; gap:2px; align-items: center; flex-wrap: nowrap;"
                                :style="`opacity:${(cellCompositionVars['a'].highlightLabel!==''&&cellCompositionVars['a'].highlightLabel!==label)?(cellCompositionVars['a'].highlightLabels.length>0&&!cellCompositionVars['a'].highlightLabels.includes(label))?'0.25':'0.5':'1'}`"
                                :data-label="label"
                                @mouseover="labelHover(label, 'a')"
                                @mouseout="labelHoverOut(label, 'a')"
                            >
                                <div class="colorize-option"
                                    :class="(cellCompositionVars['a'].highlightLabels.length===0||cellCompositionVars['a'].highlightLabels.includes(label))?'active':''"
                                    @click="labelClick(label, 'a')"
                                >
                                    <svg viewBox="0 -0.5 17 17" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.333C3 13.463 5.427 16 8.418 16 11.41 16 14 13.463 14 10.333 14 7.204 8.418 0 8.418 0S3 7.204 3 10.333Z" :fill="color"/></svg>
                                </div>
                                <!--<div :style="`width:10px; height:21px; background:${color}; pointer-events:none;`"></div>-->
                                <div style="white-space: nowrap; cursor:default"
                                    :style="`opacity:${(cellCompositionVars['a'].highlightLabel!==''&&cellCompositionVars['a'].highlightLabel!==label)?'0.5':'1'}`"
                                >
                                    {{ label }}
                                </div>
                            </div>
                        </div>
                        <research-bar-plot-v2
                            :data="segmentByCounts"
                            :categoryKey="cellTypeField"
                            totalKey="Total"
                            :subCategoryKeys="this.rawData['metadata_labels'][segmentByLabel]"
                            :colors="Object.values(labelColors[segmentByLabel])"
                            :normalize="true"
                            :barType="'stacked'"
                            :orientation="`horizontal`"
                            :width="620"
                            :margins="{top: 30, right: 10, bottom: 150, left: 80}"
                            :fitToSize="true"
                        />
                    </div>
                </div>
                <div v-if="showMarkerGenes" style="display:flex; flex-direction: column; gap:20px; border:1px solid #ddd; padding:20px;">
                    <div v-if="expressionStats.length>0" style="display:flex; flex-direction: column; width: min-content;">
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
                    
                        <research-dot-plot v-for="(item, i) in expressionStats" :key="i"
                            :data="item"
                            orientation="horizontal"
                            :width="620"
                            :fitToSize="true"
                            :cellWidth="30"
                            :showYLabels="true"
                            :showXLabels="true"
                            :positionXLabelsOnTop="false"
                            :positionYLabelsOnRight="false"
                            :marginBottom="50"
                            :marginLeft="-20"
                            :marginTop="50"
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
    import ResearchUmapPlot from "@/components/researchPortal/ResearchUmapPlot.vue";
    import ResearchBarPlotV2 from "@/components/researchPortal/ResearchBarPlotV2.vue";
    import ResearchDotPlot from "@/components/researchPortal/ResearchDotPlot.vue";
    import ResearchViolinPlot from "@/components/researchPortal/ResearchViolinPlot.vue";

    const colors = ["#007bff","#048845","#8490C8","#BF61A5","#EE3124","#FCD700","#5555FF","#7aaa1c","#F88084","#9F78AC","#F5A4C7","#CEE6C1","#cccc00","#6FC7B6","#D5A768","#d4d4d4"]

    export default Vue.component('research-single-cell-browser', {
        components: {
            ResearchUmapPlot,
            ResearchBarPlotV2,
            ResearchDotPlot,
            ResearchViolinPlot
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
                rawData: null,
                coordinates: null,
                labels: null,
                counts: null,

                componentsConfig: null,
                presetsConfig: null,

                showCellInfo: true,
                showCellProportion: true,
                showGeneExpression: true,
                showMarkerGenes: true,

                colorScaleIndex: d3.scaleOrdinal(colors),
                colorScalePlasma: d3.scaleSequential(d3.interpolatePlasma),
                colorScalePlasmaColorsArray: [],
                colorIndex: 0,

                labelColors: null,
                colorByOptions: null, //rename?

                cellCompositionVars: {
                    "a": {
                        umapColors: null,
                        colorByLabel: null,
                        highlightLabel: '',
                        highlightLabels: [],
                        cellTypeInfo: null
                    },
                    "b": {
                        umapColors: null,
                        colorByLabel: null,
                        highlightLabel: '',
                        highlightLabels: [],
                        cellTypeInfo: null
                    }
                },

                geneExpressionVars: {
                    "a": {
                        umapGeneColors: null,
                        selectedGene: null,
                        expressionStats: [],
                        selectedLabel: null,
                    },
                    "b": {
                        umapGeneColors: null,
                        selectedGene: null,
                        expressionStats: [],
                        selectedLabel: null,
                    }
                },

                displayByLabel: '',
                segmentByLabel: '',
                segmentByCounts: null,

                datasetId: null,
                datasetName: null,
                cellTypeField: null,

                geneNames: [],
                expressionData: {},
                expressionStats: [],

                dataLoaded: false,
                preloadItem: '',
                tissueDisplay: '',
                highlightHoverTimeout: null,

                selectedTabs: {"a":"1", "b":"2"},
            }
        },
        watch: {
            data(){
                //this.init();
            }
        },
        mounted() {
            //load metadata from renderConfig
            console.log('renderConfig', this.renderConfig);
            console.log('data', this.data);
            EventBus.$on('on-select',this.handleSelectEvent);
            this.init();
        },
        beforeDestroy(){
            EventBus.$off('on-select',this.handleSelectEvent);
        },
        computed: {
            datasetData(){
                if(this.datasetId){
                    return this.data.find(row => row.datasetId === this.datasetId);
                }else{
                    return null;
                }
            },
            isLoadingData(){
                if(this.preloadItem != ''){
                    return true;
                }else{
                    return false;
                }
            }
        },
        methods: {
            handleSelectEvent(data) {
                if(data.id===this.sectionId){
                    console.log(this.sectionId, 'Received on-select event:', data);
                    this.datasetId = data.value;
                    this.init();
                }
            },
            async init(){
                /*
                if(this.data.length !== 1){
                    if(this.datasetData) {
                        console.log('--->', this.datasetData);
                    }else{
                        console.log("please select a dataset");
                        return;
                    }
                }else{
                    this.datasetId = this.data[0].datasetId;
                }
                */

                this.componentsConfig = this.renderConfig["components"];
                this.showCellInfo = this.componentsConfig?.["cell info"]?.enabled ?? true;
                this.showCellProportion = this.componentsConfig?.["cell proportion"]?.enabled ?? true;
                this.showGeneExpression = this.componentsConfig?.["gene expression"]?.enabled ?? true;
                this.showMarkerGenes = this.componentsConfig?.["marker genes"]?.enabled ?? true;

                this.presetsConfig = this.renderConfig["presets"];

                //if user has not selected a dataset from the list
                if(!this.datasetId || this.datasetId === ''){
                    if(this.presetsConfig?.datasetId){
                        this.datasetId = this.presetsConfig.datasetId
                    }else{
                        console.log('select a dataset');
                        return;
                    }
                }
                
                console.log(`loading dataset: ${this.datasetData.datasetId}`);
                console.log('   data', this.datasetData);

                this.tissueDisplay = this.datasetData["Tissue"];
                this.datasetName = this.datasetData["Name"];
                this.cellTypeField = this.presetsConfig?.["cell type label"];
                console.log("cellTypeField", this.cellTypeField, this.presetsConfig);
                this.cellCompositionVars['a'].colorByLabel = this.cellTypeField;

                this.dataLoaded = false;
                this.preloadItem = 'fields';
                this.rawData = await this.fetchFields();

                this.preloadItem = 'coordinates';
                this.coordinates = await this.fetchCoordinates();

                this.preloadItem = '';
                this.dataLoaded = true;

                this.labels = this.getCellLabels(this.rawData, Object.keys(this.rawData["metadata_labels"]));

                this.counts = this.getCountsByLabel(this.labels, Object.keys(this.rawData["metadata_labels"]));

                //pre-calculate colors for fields in each category
                this.labelColors = this.calcLabelColors(this.rawData);
                this.colorScalePlasmaColorsArray = d3.range(0, 1.01, 0.1).map(t => this.colorScalePlasma(t)).join(', ');
                
                this.getColorByOptions();

                this.selectColorBy(this.cellTypeField, 'a');
                this.selectColorBy(this.cellTypeField, 'b');
               
                this.updateCellsInfo(this.cellTypeField, 'a');
                this.updateCellsInfo(this.cellTypeField, 'b');

                this.geneExpressionVars['a'].selectedLabel = this.cellTypeField;
                this.geneExpressionVars['b'].selectedLabel = this.cellTypeField;


                if(this.showCellProportion){
                    if(this.rawData['metadata_labels']['Diabetes Status']) {
                        this.selectSegmentBy(this.cellTypeField, "Diabetes Status");
                    }else{
                        this.selectSegmentBy(this.cellTypeField, Object.keys(this.rawData["metadata_labels"])[0]);
                    }
                }else{
                    console.log('cell proportion component disabled')
                }

                this.expressionStats = [];
                

                if(keyParams.gene){
                    this.fetchGeneExpression(keyParams.gene.toUpperCase());
                }

                
                if(this.presetsConfig?.["genes"]){
                    this.presetsConfig["genes"].forEach(async (gene) => {
                        await this.fetchGeneExpression(gene.toUpperCase());
                    })
                }
                
            },
            getColorByOptions(){
                console.log('getColorByOptions');

                const colorByOptions2 = [];
                for(const [key, value] of Object.entries(this.rawData["metadata_labels"])){
                    colorByOptions2.push({"raw field": key, "field label": key.replaceAll("_", " ")});
                }

                console.log('   colorByOptions', colorByOptions2);

                this.colorByOptions = colorByOptions2;
            },
            updateDataUrl(url, paramaters){
                let updatedUrl = url;
                //tmp
                //updatedUrl = updatedUrl.replace(`$datasetId`, this.datasetData['Tissue'].toLowerCase());

                //use below once metadata is fixed
                paramaters.forEach(param => {
                    if(param !== 'gene')
                        updatedUrl = updatedUrl.replace(`$${param}`, this.datasetData[param]); //.toLowerCase().replaceAll(" ", "_")
                })
                return updatedUrl;
            },
            async fetchFields() {
                console.log('getting fields');
                const fieldsDataPoint = this.renderConfig["data points"].find(x => x.role === "fields");
                const fieldsUrl = this.updateDataUrl(fieldsDataPoint.url, fieldsDataPoint.parameters);
                try {
                    const response = await fetch(fieldsUrl);
                    const rawData = await response.json();

                    console.log('   fields', rawData);
                    return rawData;
                } catch (error) {
                    console.error('Error fetching fields:', error);
                }
            },
            async fetchCoordinates() {
                console.log('getting coordinates');
                const coordinatesDataPoint = this.renderConfig["data points"].find(x => x.role === "coordinates");
                const coordinatesUrl = this.updateDataUrl(coordinatesDataPoint.url, coordinatesDataPoint.parameters);
                try {
                    const response = await fetch(coordinatesUrl);
                    const json = this.utils.dataConvert.tsv2Json(await response.text());
                    console.log('   coordinates', json);
                    return json;
                }catch (error){
                    console.error('Error fetching coordinates:', error);
                }
            },
            async fetchGeneExpression(gene){
                console.log('fetchGeneExpression', gene);
                const expressionDataPoint = this.renderConfig["data points"].find(x => x.role === "expression");
                const expressionUrl = this.updateDataUrl(expressionDataPoint.url, expressionDataPoint.parameters);
                //this.isLoading = true;
                await Vue.nextTick();
                try{
                    const response = await fetch(expressionUrl+','+gene);
                    const json = await response.json();
                    const expression = json.data[0]['expression'];
                    this.geneNames.push(gene);
                    this.expressionData[gene] = expression;
                    //console.log('   ', expression);

                    //this.isLoading = false;
                    await Vue.nextTick();

                    //this.parseGeneExpression();
                    if(this.datasetSettings){
                        //const geneStats = await this.getGeneExpression(this.expressionData[gene], this.datasetSettings.selectedCellType);
                        //this.expressionStats.push({[gene]:geneStats});
                    }else{
                        this.expressionStats = this.parseGeneExpression(this.cellTypeField);
                        //this.expressionStats.push(geneStats);
                        console.log('expressionStats', this.expressionStats);
                    }
                    if(!this.geneExpressionVars['a'].selectedGene){
                        this.geneClick(gene, 'a');
                    }
                    if(!this.geneExpressionVars['b'].selectedGene){
                        this.geneClick(gene, 'b');
                    }
                }catch(error){
                    console.error('   Error fetching gene expression', error);
                }
            },
            selectColorBy(e, group){
                const val = typeof e === 'object' ? e.target.value : e;
                const g = this.cellCompositionVars[group];
                console.log('color by:', val);
                g.colorByLabel = val;
                g.umapColors = this.getColorsByLabel(g.colorByLabel);
                this.updateCellsInfo(g.colorByLabel, group);
            },
            selectSegmentBy(display, segment){
                const displayVal = typeof display === 'object' ? display.target.value : display;
                const segmentVal = typeof segment === 'object' ? segment.target.value : segment;
                console.log('segment by:', {displayVal, segmentVal});
                this.displayByLabel = displayVal
                this.segmentByLabel = segmentVal;
                this.segmentByCounts = this.getCountsByLabelSubset(this.labels, this.displayByLabel, this.segmentByLabel);
                console.log('segmentByCounts', this.segmentByCounts);
            },
            selectExpressionBy(e, group){
                const val = typeof e === 'object' ? e.target.value : e;
                const g = this.geneExpressionVars[group];
                console.log('expression by:', val);
                g.selectedLabel = val;
                g.expressionStats = this.parseGeneExpression(g.selectedLabel);
            },
            calcLabelColors(rawData){
                const colors = {};
                for(const [key, value] of Object.entries(rawData["metadata_labels"])){
                    colors[key] = {};
                    for(var i=0; i<value.length; i++){
                        colors[key][value[i]] = this.colorScaleIndex(this.colorIndex)
                        this.colorIndex++;
                    }
                }
                console.log('labelColors', colors);
                return colors;
            },
            getColorsByLabel(category, subset=null){
                console.log('getColorsByLabel', category, subset);

                if(!category) return null;

                const pointColors = [];
                
                for (let i = 0; i < this.rawData.NAME.length; i++) {
                    const labelIdx = this.rawData.metadata[category][i];
                    const label = this.rawData.metadata_labels[category][labelIdx];
                    if(!subset || (subset && subset.includes(label)))
                        pointColors[i] = this.labelColors[category][label];
                }
                //console.log(pointColors);
                return pointColors;
            },
            labelHover(e, group){
                clearTimeout(this.highlightHoverTimeout);
                const label = e;//e.target.dataset.label;
                this.cellCompositionVars[group].highlightLabel = label;
            },
            labelHoverOut(e, group){
                this.highlightHoverTimeout = setTimeout(() => {
                    this.cellCompositionVars[group].highlightLabel = '';
                }, 50);
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
                g.umapColors = this.getColorsByLabel(g.colorByLabel);
                console.log('resetLabels', g.highlightLabels);
            },

            geneClick(e, group){
                const gene = e;
                const g = this.geneExpressionVars[group];
                g.expressionStats = this.parseGeneExpression(g.selectedLabel);
                g.selectedGene = gene;
                g.umapGeneColors = this.getUmapExpressionColors(gene);
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

            /*
                cell composition
            */
            async updateCellsInfo(cellTypeCategory, group){
                //cell types
                //const parsedData = this.getCellLabels(this.rawData, [cellTypeCategory, conditionA, conditionB]);
                //const counts = this.getCountsByLabel(parsedData, [cellTypeCategory]);
                const g = this.cellCompositionVars[group];
                g.cellTypeInfo = {
                    key: cellTypeCategory, 
                    data: {[cellTypeCategory]: this.counts[cellTypeCategory]},
                    colors: Object.values(this.labelColors[cellTypeCategory])
                };
                console.log("   cellTypeInfo", g.cellTypeInfo);

                return;
            },
            getCellLabels(rawData, labelKeys){
                console.log('get CellAnnotations');

                const { NAME, metadata, metadata_labels } = rawData;
                const cellAnnotations = [];
            
                //loop through all cells
                for (let i = 0; i < NAME.length; i++) {
                    const record = {};
                    for (const n in labelKeys) {
                        const label = labelKeys[n];
                        if (metadata.hasOwnProperty(label)) {
                            const valueIdx = metadata[label][i];
                            const value = metadata_labels[label][valueIdx];
                            record[label] = value;
                        }
                    }
                    cellAnnotations.push(record);
                }
            
                console.log('   cellLabels', cellAnnotations);

                return cellAnnotations;
            },
            getCountsByLabel(cellLabels, labelsToCount){
                console.log('getCountsByLabel');
                //get counts from parsed data by keys
                const calculateCounts = (data, keys) => {
                    return keys.reduce((acc, key) => {
                        //console.log('   key', key);
                        acc[key] = data.reduce((acc, row) => {
                            acc[row[key]] = (acc[row[key]] || 0) + 1;
                            return acc;
                        }, {});
                        return acc;
                    }, {});
                };
                const cellCounts = calculateCounts(cellLabels, labelsToCount);
                console.log('   cellCounts', cellCounts);
                return cellCounts;
            },  
            getCountsByLabelSubset(cellLabels, mainLabel, subsetLabel){
                console.log("getCountsByLabelSubset");

                if(!subsetLabel || subsetLabel.trim() === ''){
                    console.log('no subset label given');
                    return null;
                }

                const result = cellLabels.reduce((acc, row) => {
                    const mainValue = row[mainLabel];
                    const subsetValue = row[subsetLabel];

                    // Ensure the main category exists in the accumulator
                    if (!acc[mainValue]) {
                        acc[mainValue] = {};
                    }

                    // Count occurrences of the subset label
                    acc[mainValue][subsetValue] = (acc[mainValue][subsetValue] || 0) + 1;

                    return acc;
                }, {});

                console.log("   result:", result);
                return result;
            },
            
            /*
                gene expression
            */
            searchGene(e){
                const parts = e.target.value.split(/[,\s]+/);
                e.target.value = '';
                //TODO: should be a queue
                parts.forEach(async (gene) => {
                    await this.fetchGeneExpression(gene.toUpperCase());
                })
            },
            parseGeneExpression(category){
                //const categories = side==='left'?this.categoriesLeft:this.categoriesRight;

                console.log('parseGeneExpression');

                // Get expressinon values for user selected categories
                const expressionByCategory = (category) => {
                    const categoryLabels = this.rawData['metadata_labels'][category];//.slice().sort((a, b) => a.localeCompare(b));
                    const categoryData = this.rawData['metadata'][category];
                    const geneExpression = {};
                    const sumstat = {};

                    //geneNames * 160000 + geneNames * labels
                    this.geneNames.forEach(gene => {

                        if(!geneExpression[gene])  geneExpression[gene] = {}

                        categoryData.forEach((labelIdx, cellIdx) => {
                            const label = categoryLabels[labelIdx];
                            if (!geneExpression[gene][label]) {
                                geneExpression[gene][label] = [];
                            }
                            geneExpression[gene][label].push(this.expressionData[gene][cellIdx]);
                        });
                        geneExpression[gene] = geneExpression[gene];//this.sortObjectKeysLocale(geneExpression[gene]);

                        categoryLabels.forEach(label => {
                            //const sortedValues = geneExpression[gene][label] ? geneExpression[gene][label].sort(d3.descending) : [0];
                            const exprValues = geneExpression[gene][label] ? geneExpression[gene][label].sort(d3.ascending) : [0];
                            const key = label;
                            const mean = d3.mean(exprValues)
                            const q1 = d3.quantile(exprValues, .25)
                            const median = d3.quantile(exprValues, .5)
                            const q3 = d3.quantile(exprValues, .75)
                            const interQuantileRange = q3 - q1
                            const min = exprValues[0]
                            const max = exprValues[exprValues.length-1]
                            const pctExpr = (exprValues.filter(val => val > 0).length / exprValues.length) * 100;//sortedValues.length / 166149;
                            if(!sumstat[gene]) sumstat[gene] = [];
                            sumstat[gene].push({ key, mean, q1, median, q3, interQuantileRange, min, max, pctExpr, exprValues });
                        
                        })
                    })

                    return sumstat;
                }

                const e = expressionByCategory(category);

                console.log('   expressionByCategory', e);

                return [e];
            },
            getUmapExpressionColors(gene){
                const expressionColors = [];
                const geneData = this.expressionData[gene];
                //console.log('---', this.expressionData, this.geneNames, this.expressionData[gene])
                const color = d3.scaleSequential(d3.interpolatePlasma)
                .domain([d3.max(geneData), 0]);
                    
                for(var i=0; i<geneData.length; i++){
                    expressionColors[i] = color(geneData[i]);
                }
                //console.log('expressionColors', expressionColors);
                return expressionColors;
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
        border: 1px solid #ccc;
        padding: 3px 10px;
        margin: 0 -1px -1px 0;
        background: #eee;
        cursor: pointer;
    }
    .tab:last-child {
        margin-right: 0;
    }
    .tab.selected {
        cursor: default;
        background: #fff;
        border-bottom: white;
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
.summary-grid{
    display: grid;
    grid-template-columns: 620px repeat(2, 1fr);
    grid-template-rows: 1fr;
    grid-column-gap: 20px;
    grid-row-gap: 0px;
    border:1px solid #ccc;
    padding:20px;
}
.summary-title{
    font-weight: bold;
}
.summary-item {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-column-gap: 5px;
    padding: 0 0 2px;
    margin: 0 0 2px;
    border-bottom: 1px solid #ccc;
}
.basics-grid{
    display: grid;
    grid-template-columns: 200px 400px 250px 350px;
    grid-template-rows: 1fr;
    grid-column-gap: 20px;
    grid-row-gap: 0px;
}
.counts-grid{
    display: grid;
    grid-template-columns: 200px 400px 620px;
    grid-template-rows: 1fr;
    grid-column-gap: 20px;
    grid-row-gap: 0px;
}

.legends {
    gap: 20px;
}
.legend {
    width: 125px;
    margin: 0 10px 0 0;
}
.legend .label {
    font-size: 11px !important;
}
.legend .gradient {
    height: 15px;
    width: -webkit-fill-available;
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
    margin-top: 3px;
}
</style>
  