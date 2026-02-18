<template>
    <div class="matkp">
        <div class="f-col fill-height">
            <!-- NAV -->
            <matkp-nav glass :showSearch="false"/>
            <!-- BODY -->
            <div class="mat-body f-col" style="max-width: 1400px; margin: 0 auto">
                <div v-if="$parent.SCloaded" class="f-row" style="gap:40px; margin:40px 0;">
                    <div class="f-col" style="gap:10px;">
                        <div class="f-col">
                            <div style="font-weight: bold;">Dataset</div>
                            <select v-model="$parent.datasetId" @change="$parent.onDatasetChange" disabled>
                                <option v-for="dataset in $parent.SC.metadata" :key="dataset.datasetId" :value="dataset.datasetId">{{ dataset.datasetId }}</option>
                            </select>
                        </div>
                        <div class="f-col">
                            <div style="font-weight: bold;">Cell Type</div>
                            <select v-model="$parent.cellTypeLabel" @change="$parent.onCellTypeChange">
                                <option v-for="cellType in $parent.SC.fields.metadata_labels['cell_type__kp']" :key="cellType" :value="cellType">{{ cellType }}</option>
                            </select>
                        </div>
                        <!--
                        <div class="f-col">
                            <div style="font-weight: bold;">Model</div>
                            <div>{{ $parent.model }}</div>
                        </div>
                        -->
                        <div class="f-col" style="width:400px; gap:20px">
                            <div class="f-col" style="gap:5px;">
                                <div class="f-row spread-out">
                                    <div style="font-weight: bold;">UMAP</div>
                                    <div>colored by {{ $parent.factorCellLoadings ? 'factor loading' : 'cell type'}}</div>
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
                            </div>
                            <div class="f-col" style="gap:5px;">
                                <div class="histogram-note f-row spread-out" v-if="$parent.factorCellLoadings">
                                    <div style="font-weight: bold;">Factor loading distribution</div> 
                                    <div>Non-zero cells, log10 scale</div>
                                </div>
                                <div id="histogram"></div>
                            </div>
                        </div>
                        
                    </div>
                    <div v-if="$parent.factorsData" style="flex:1">
                        <div class="f-row spread-out">
                            <div style="font-weight: bold;">{{ $parent.cellTypeLabel }} factors</div>
                            <div>n={{ $parent.factorsData.length.toLocaleString() }}</div>
                        </div>
                        <b-table 
                            :items="$parent.factorsData"
                            :fields="[{key:'label', label:'Factor',  tdClass: 'font-weight-bold'}, 'top_cells', 'top_genes', 'importance', { key: 'actions', label: 'Actions' }]"
                            striped
                            small
                            sticky-header="700px"
                        >
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
                                <div style="padding:10px 50px;">{{ row.item.description }}</div>
                                <div class="f-row" style="gap:10px; padding:10px 50px 20px; background: #fff;">
                                    <div class="f-col" style="flex:1; gap:5px;">
                                        <div class="f-row spread-out">
                                            <div style="font-weight: bold;">All Cells</div>
                                            <div>n={{ row.item.cellsData.length.toLocaleString() }}</div>
                                        </div>
                                        <b-table
                                            :items="row.item.cellsData"
                                            :fields="['cell', 'value']"
                                            small
                                            bordered
                                            sticky-header="200px"
                                            style="flex:1"
                                        >
                                            <!-- Importance -->
                                            <template #cell(value)="row">
                                                {{ row.item.value.toFixed(4) }}
                                            </template>
                                        </b-table>
                                    </div>
                                    <div class="f-col" style="flex:1; gap:5px;">
                                        <div class="f-row spread-out">
                                            <div style="font-weight: bold;">All Genes</div>
                                            <div>n={{ row.item.genesData.length.toLocaleString() }}</div>
                                        </div>
                                        <b-table
                                            :items="row.item.genesData"
                                            :fields="['gene', 'value']"
                                            small
                                            bordered
                                            sticky-header="200px"
                                        ></b-table>
                                    </div>
                                </div>
                            </template>
                        </b-table>
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
</style>