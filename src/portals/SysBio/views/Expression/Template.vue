<template>
    <div class="sysbio f-layout">
        <!-- NAV -->
        <sysbio-header></sysbio-header>
        <!-- BODY -->
        <div class="sysbio-body">
            <div v-if="$parent.pageInfo" style="margin:0 0 40px">
                <h2>{{ $parent.pageInfo.title }}</h2>
                <div v-html="$parent.pageInfo.body"></div>
            </div>
            <h4>Differential gene expression across AMP programs</h4>
            <div v-if="$parent.deData" class="f-row" style="gap:50px; margin: 10px 0 0">
                <div class="f-col" style="gap:10px">
                    <div class="f-row fill-width spread-out align-v-bottom">
                        <div class="f-row" style="gap:20px">
                            <div class="f-col">
                                <div class="bold">Find Gene</div>
                                <gene-selectpicker 
                                    class="search"
                                    @onGeneChange="gene => $parent.highlight(gene)"
                                />
                            </div>
                            <div class="f-col">
                                <div class="bold">-log10(P) threshold</div>
                                <div class="f-row" style="gap:5px; height:26px">
                                    <input
                                        type="range"
                                        :min="$parent.pValMin"
                                        :max="$parent.pValMax"
                                        step="0.1" 
                                        v-model="$parent.pValThreshold"
                                    />
                                    <input type="text" class="slider-input"
                                        v-model="$parent.pValThreshold"/>
                                </div>
                            </div>
                        </div>
                        <div class="f-row" style="gap:10px">
                            <!--<div style="align-self:center; font-size:12px">n: {{ $parent.deData.length.toLocaleString() }}</div>-->
                            <download-chart 
                                class="download"
                                chartId="vector_volcano_plot__bulk"
                                style="width: 125px; align-self: flex-end;"
                            />
                        </div>
                    </div>
                    <bulk-volcano-plot v-if="$parent.deData"
                        :renderData="$parent.deData"
                        :renderConfig="$parent.bulkVolcanoConfig"
                        :margin="$parent.margin"
                        sectionId="_bulk"
                        :selectedGene="$parent.highlightGene"
                        @highlight="gene => $parent.highlight(gene)"
                    />
                </div>
                <div class="f-col" style="flex:1; gap:10px">
                    <div class="f-row fill-width spread-out align-v-bottom">
                        <div class="f-col">
                            <div class="bold">Filter Genes:</div>
                            <div class="f-row" style="gap:10px">
                                <label><input type="radio" name="radio-group" value="" v-model="$parent.showGenes" checked />All Genes</label>
                                <label><input type="radio" name="radio-group" :value="$parent.down" v-model="$parent.showGenes"/>Downregulated</label>
                                <label><input type="radio" name="radio-group" :value="$parent.up" v-model="$parent.showGenes"/>Upregulated</label>
                            </div>
                        </div>
                        <div class="f-row align-v-center" style="gap:10px">
                            <data-download
                                class="download"
                                :data="$parent.tableData"
                                :filename="`sysbio_dge`"
                                style="width: 125px; align-self: flex-end;"
                            />
                        </div>
                    </div>
                    <div style="align-self:flex-end">rows: {{ $parent.tableData.length.toLocaleString() }}</div>
                    <b-table
                        small
                        hover
                        responsive="sm"
                        :items="$parent.tableData"
                        :fields="$parent.deTableFields"
                        :sortBy="$parent.currentSort.sortBy"
                        :sortDesc="$parent.currentSort.sortDesc"
                        :sort-icon-left="true"
                        :per-page="10"
                        :current-page="$parent.dePage"
                        :tbody-tr-class="$parent.rowClasses"
                        @filtered="$parent.onFiltered"
                        @sort-changed="$parent.onSortChanged"
                    >
                        <template #cell(GENE)="data">
                            <span class="clickable-cell" @click="$parent.highlight(data.value)">
                                {{ data.value }}
                            </span>
                        </template>
                    </b-table>
                    <div class="f-row fill-width align-v-center align-h-center">
                        <b-pagination
                            v-model="$parent.dePage"
                            class="pagination-sm justify-content-center"
                            style="justify-self:center; margin: 0 !important"
                            :total-rows="$parent.rows"
                            :per-page="10"
                        />
                    </div>
                </div>
            </div>
        </div>
        <!-- FOOTER -->
        <sysbio-footer></sysbio-footer>
    </div>
</template>

<script>
export default {

}
</script>

<style scoped>
/* download button */
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
    border: 0;
    box-shadow: 0px 1px 2px 0 black;
    font-size: 12px;
}
::v-deep .download button:hover{
    color: black;
    background-color: #ccc;
}
/* search input */
::v-deep .search input {
    font-size: 12px;
    line-height: unset;
    padding: 0.25rem 0.5rem;
    height: unset;
    border:0;
    box-shadow: 0px 1px 2px 0 black;
}
/* de table rows */
.clickable-cell{
    cursor:pointer;
}
::v-deep tr.downregulated {
    border-left: 5px solid #12bdfe !important;
}
::v-deep tr.upregulated {
    border-left: 5px solid #ff00c7 !important;
}
::v-deep .row-highlight{
    background-color:#eee;
}

.slider-input{
    font-size: 12px;
    padding: 0;
    width: 30px;
    background: none;
    border: none;
}
</style>