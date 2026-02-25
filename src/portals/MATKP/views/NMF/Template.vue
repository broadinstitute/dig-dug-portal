<template>
    <div class="matkp">
        <div class="f-col fill-height">
            <!-- NAV -->
            <matkp-nav :showSearch="false"/>
            <!-- BODY -->
            <div class="mat-body f-col" style="width:100%; max-width: 1400px; margin: 0 auto">
                <!-- INFO -->
                 <div v-if="$parent.info">
                    <h2>{{ $parent.title }}</h2>
                    <div v-html="$parent.info"></div>
                 </div>
                 <!-- CONTENT -->
                <div v-if="$parent.SCloaded" class="f-col" style="gap:20px; margin:10px 0;">
                    <div class="f-col" style="gap:10px">
                        <div class="f-row" style="gap:20px">
                            <div class="f-col" style="width:400px">
                                <div style="font-weight: bold;">Dataset</div>
                                <select v-model="$parent.datasetId" @change="$parent.onDatasetChange">
                                    <option v-for="dataset in $parent.SC.metadata" :key="dataset.datasetId" :value="dataset.datasetId">{{ dataset.datasetId }}</option>
                                </select>
                            </div>
                        </div>
                        <div v-if="$parent.SC.datasetMetadata" class="f-col">
                            <research-single-cell-info 
                                :data="$parent.SC.datasetMetadata"
                            />
                        </div>
                    </div>
                    <div class="f-row" style="gap:20px">
                        <div class="f-col" style="width:400px; gap:20px">
                            <div class="f-col" style="gap:10px;">
                               
                               <!--
                               <div class="f-col">
                                   <div style="font-weight: bold;">Model</div>
                                   <div>{{ $parent.model }}</div>
                               </div>
                               -->
                               <div class="f-col" style="width:400px">
                                    <div style="font-weight: bold;">Cell Type</div>
                                    <select v-model="$parent.cellTypeLabel" @change="$parent.onCellTypeChange">
                                        <option v-for="cellType in $parent.SC.fields.metadata_labels['cell_type__kp']" :key="cellType" :value="cellType">{{ cellType }}</option>
                                    </select>
                                </div>
                               <div class="f-col" style="width:400px; gap:20px">
                                   <div class="f-col" style="gap:5px;">
                                       <div class="f-row spread-out">
                                           <div style="font-weight: bold;">UMAP</div>
                                           <div>Colored by {{ $parent.factorCellLoadings ? 'factor loading' : 'cell type'}}</div>
                                       </div>
                                       <research-umap-plot-gl 
                                           ref="umapPlot"
                                           :group="$parent.datasetId"
                                           :points="$parent.SC.coordinates"
                                           :labels="$parent.SC.fields"
                                           :colors="$parent.SC.labelColors"
                                           :cellTypeField="$parent.SC.cellTypeField"
                                           :colorByField="$parent.SC.colorByField"
                                           :expression="$parent.factorCellLoadings"
                                           :hoverFields="[]"
                                           :highlightLabel="$parent.SC.highlightLabel"
                                           :highlightLabels="[]"
                                           :width="400"
                                           :height="300"
                                       />
                                       <div v-if="$parent.factorCellLoadings" class="f-col info-box">
                                            <div class="f-row align-v-center" style="gap:5px">
                                                <b-icon icon="info-circle-fill" style="color:#4c6ef5"/> 
                                                <div class="bold">Spatial localization of program activity</div>
                                            </div>
                                            <em>Concentrated regions suggest discrete subpopulations; gradients suggest continuous activation states.</em>
                                       </div>
                                   </div>
                                   <div class="f-col" style="gap:5px;">
                                       <div class="histogram-note f-row spread-out" v-if="$parent.factorCellLoadings">
                                           <div style="font-weight: bold;">Factor loading distribution</div> 
                                           <div>Non-zero cells, log10 scale</div>
                                       </div>
                                       <div id="histogram"></div>
                                       <div class="histogram-note f-col info-box">
                                            <div class="f-row align-v-center" style="gap:5px">
                                                <b-icon icon="info-circle-fill" style="color:#4c6ef5"/> 
                                                <div class="bold">Population-level distribution of program intensity.</div>
                                            </div>
                                            <em>Long tails indicate rare, high-activity cells; broad or bimodal patterns suggest widespread or transitional programs.</em>
                                       </div>
                                       
                                   </div>
                               </div>
                               
                            </div>
                        </div> 
                        <div class="f-col" style="flex:1; gap:20px">
                            <div v-if="$parent.factorsData" class="f-col" style="flex:1; gap: 4px;">
                                <div class="f-row spread-out">
                                    <div style="font-weight: bold;">
                                        NMF Factors <span class="tooltip-bg"><b-icon icon="question-circle-fill" style="color:#ffd10c" v-b-tooltip.hover.right="`NMF (Non-negative Matrix Factorization) identifies coordinated gene expression patterns (“factors”) within this cell type. Each factor represents a gene program whose activity varies across cells.`"/></span>
                                    </div>
                                    <div>{{ $parent.factorsData.length.toLocaleString() }} total</div>
                                </div>
                                <b-table 
                                    :items="$parent.factorsData"
                                    :fields="[{key:'label', label:'Factor',  tdClass: 'font-weight-bold'}, 'top_genes', 'importance', { key: 'actions', label: 'Actions' }]"
                                    striped
                                    small
                                    sticky-header="735px"
                                    table-class="custom-padding"
                                >
                                    <template #head(label)="{ field }">
                                        <div style="white-space: nowrap;">
                                            {{ field.label }} <span class="tooltip-bg"><b-icon icon="question-circle-fill" style="color:#ffd10c" v-b-tooltip.hover.right="`An NMF-derived gene program. Each factor consists of a weighted set of genes and corresponding loadings across cells.`"/></span>
                                        </div>
                                    </template>
                                    <template #head(importance)="{ field }">
                                        <div style="white-space: nowrap;">
                                            {{ field.label }} <span class="tooltip-bg"><b-icon icon="question-circle-fill" style="color:#ffd10c" v-b-tooltip.hover.right="`Relative contribution of this factor within the selected cell type. Higher values indicate greater overall influence in the NMF model.`"/></span>
                                        </div>
                                    </template>
                                    <!-- TOP CELLS PILLS -->
                                    <template #cell(top_cells)="row">
                                        <div class="f-row" style="gap:3px; flex-wrap: wrap;">
                                            <b-badge
                                                v-for="cell in $parent.splitValues(row.item.top_cells)"
                                                :key="cell"
                                                :style="`background-color: ${$parent.SC.labelColors[$parent.SC.colorByField][$parent.SC.highlightLabel]};`"
                                            >
                                                {{ cell }}
                                            </b-badge>
                                        </div>
                                    </template>
                
                                    <!-- TOP GENES PILLS -->
                                    <template #cell(top_genes)="row">
                                        <div class="f-row" style="gap:3px; flex-wrap: wrap;">
                                            <b-badge
                                                v-for="gene in $parent.splitValues(row.item.top_genes)"
                                                :key="gene"
                                                style="background-color: #fff; color: #000;"
                                            >
                                                {{ gene }}
                                            </b-badge>
                                        </div>
                                    </template>
        
                                    <!-- Importance -->
                                    <template #cell(importance)="row">
                                        {{ row.item.importance.toFixed(4) }}
                                    </template>
                
                                    <!-- ACTION BUTTON -->
                                    <template #cell(actions)="row">
                                        <b-button
                                            size="sm"
                                            style="width:100%"
                                            :style="`${row.item._showDetails ? 'background:#4c6ef5':''}`"
                                            @click="$parent.loadDetails(row)"
                                        >
                                            <!-- Show spinner and text if loading -->
                                            <template v-if="row.item.detailsLoading">
                                                <b-spinner small></b-spinner>
                                            </template>
                                            <template v-else-if="row.item._showDetails">
                                                Close
                                            </template>
                                            <!-- Show default text if not loading -->
                                            <template v-else>
                                                Details
                                            </template>
                                        </b-button>
                                    </template>
                
                                    <!-- ROW DETAILS SUBTABLE -->
                                    <template #row-details="row">
                                        <!--
                                        <div style="padding:10px 50px;">
                                            <div style="font-weight: bold;">Gene Program <span class="tooltip-bg"><b-icon icon="question-circle-fill" style="color:#ffd10c" v-b-tooltip.hover.right="`Biological interpretation of this NMF factor. The gene program represents a coordinated gene expression pattern inferred from the model.`"/></span></div>
                                            {{ row.item.description }}
                                        </div>
                                        -->
                                        <div class="f-row" style="gap:10px; padding:10px 50px 20px;">
                                            <div class="f-col" style="flex:1; gap:5px;">
                                                <div class="f-row spread-out">
                                                    <div style="font-weight: bold;">All Cells</div>
                                                    <div>{{ row.item.cellsData.length.toLocaleString() }} total</div>
                                                </div>
                                                <b-table
                                                    :items="row.item.cellsData"
                                                    :fields="['cell', {key:'value', label:'Factor loading'}]"
                                                    :per-page="row.item.cellsPerPage"
                                                    :current-page="row.item.cellsCurrentPage"
                                                    small
                                                    bordered
                                                    sticky-header="200px"
                                                    style="flex:1"
                                                >
                                                    <template #head(value)="{ field }">
                                                        <div style="white-space: nowrap;">
                                                            {{ field.label }} <span class="tooltip-bg"><b-icon icon="question-circle-fill" style="color:#ffd10c" v-b-tooltip.hover.right="`Factor loading quantifies how strongly a cell expresses this gene program. Higher values indicate stronger program activity.`"/></span>
                                                        </div>
                                                    </template>
                                                    <template #cell(value)="row">
                                                        {{ row.item.value.toFixed(4) }}
                                                    </template>
                                                </b-table>
                                                <b-pagination
                                                    v-model="row.item.cellsCurrentPage"
                                                    :total-rows="row.item.cellsData.length"
                                                    :per-page="row.item.cellsPerPage"
                                                    size="sm"
                                                    class="mt-2"
                                                />
                                            </div>
                                            <div class="f-col" style="flex:1; gap:5px;">
                                                <div class="f-row spread-out">
                                                    <div style="font-weight: bold;">All Genes</div>
                                                    <div>{{ row.item.genesData.length.toLocaleString() }} total</div>
                                                </div>
                                                <b-table
                                                    :items="row.item.genesData"
                                                    :fields="['gene', 'value']"
                                                    :per-page="row.item.genesPerPage"
                                                    :current-page="row.item.genesCurrentPage"
                                                    small
                                                    bordered
                                                    sticky-header="200px"
                                                >
                                                    <template #head(value)="{ field }">
                                                        <div style="white-space: nowrap;">
                                                            {{ field.label }} <span class="tooltip-bg"><b-icon icon="question-circle-fill" style="color:#ffd10c" v-b-tooltip.hover.right="`Weight of this gene within the factor. Higher values indicate stronger contribution to the gene program.`"/></span>
                                                        </div>
                                                    </template>
                                                    <template #cell(value)="row">
                                                        {{ row.item.value.toFixed(4) }}
                                                    </template>
                                                </b-table>
                                                <b-pagination
                                                    v-model="row.item.genesCurrentPage"
                                                    :total-rows="row.item.cellsData.length"
                                                    :per-page="row.item.genesPerPage"
                                                    size="sm"
                                                    class="mt-2"
                                                />
                                            </div>
                                        </div>
                                    </template>
                                </b-table>
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
#histogram:empty + .histogram-note{
    display:none !important;
}

.info-box{
    background: #ddd;
    padding: 10px 20px;
}

.tooltip-bg{
    border-radius: 50%;
    background-color: #424242;
    display: inline-flex;
    vertical-align: text-top;
}

::v-deep .tooltip-inner{
    font-size: 12px;
    text-align: left;
    padding: 10px;
}

::v-deep .b-table-sticky-header > .table.b-table > thead > tr > th {
    top: -1px;
}

::v-deep .table.b-table > thead > tr > .table-b-table-default{
    background-color: #ccc;
}

::v-deep .pagination.b-pagination {
    border: 0;
    padding: 0;
    font-size: 12px;
    gap: 5px;
}
::v-deep .pagination.b-pagination .page-link {
    border: 0 !important;
    border-radius: 0px !important;
    min-width: 25px;
    height: 25px;
    text-align: center;
    font-size: 12px;
    border-bottom: 1px solid black;
    color: #000000;
    background-color: white;
}
::v-deep .page-item.disabled .page-link {
    background-color: #ddd;
    border-radius: 0px !important;
    color: #b1b1b1;
}
::v-deep .page-item.active .page-link {
    color: black;
    background-color: #ffd10c;
}
::v-deep .page-link:hover {
    outline: 2px solid #ffd10c;
}
</style>