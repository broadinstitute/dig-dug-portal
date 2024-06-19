<template>
    <div class="matkp">
        <div class="f-col fill-height">
            <!-- NAV -->
            <matkp-nav></matkp-nav>
            <!-- BODY -->
            <div class="mat-body">
                <template>
                    <!-- CONTENT -->
                    <div class="f-row" style="margin: 80px 20px 20px; justify-content: space-between;">
                        <div class="f-col">
                            <div style="font-size: 20px; font-weight: bold;">Datasets</div>
                            <div :class="`loader ${!$parent.isLoading ? 'hidden' : ''}`">loading...</div>
                        </div>
                        <div class="col1" style="width:calc(100% - 265px)">
                            <b-input-group size="sm">
                                <input
                                    v-model="$parent.filter"
                                    type="text"
                                    placeholder="Filter datasets based on any text from the table below"
                                ></input>
                                <b-button class="button-lock-right" :disabled="!$parent.filter" @click="$parent.filter = null">Clear</b-button>
                            </b-input-group>
                        </div>
                    </div>
                    <div class="f-row content-wrap">
                        <div class="input-overlay hidden"></div>
                        <div class="f-col" style="min-width:250px; width:250px; gap:15px; font-size:14px">
                            <!--{{ $parent.selectedFilters }}-->
                            <div class="f-row align-v-center bold border-bottom" style="height:32px">
                                Filters 
                            </div>
                            <div class="f-col" style="position:relative" v-for="(options, key) in $parent.filterOptions" :key="key">
                                <div class="f-col filter">
                                    <div class="f-row matkp-input" style="height:auto;" :data-input-key="key" @click="$parent.showInputOptions($event)">
                                        <div class="f-row fill-width spread-out no-events">
                                            <div class="bold" style="text-transform:capitalize">{{$parent.fields.find(x => x.key === key)["label"]}}</div>
                                            <div class="f-row align-v-center" >
                                                <span class="filter-count" :data-input-key="key" :class="$parent.selectedFilters[key].length > 0 ? 'active' : ''">{{ $parent.selectedFilters[key].length > 0 ? $parent.selectedFilters[key].length + ' of ' : '' }}{{ $parent.filterOptions[key].length }}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="f-col input-options hidden" :data-input-options-key="key">
                                        <div class="f-row align-v-center input-option" style="gap:5px" v-for="option in options">
                                            <input
                                            type="checkbox"
                                            :id="`filter-${key}-${option.value}`"
                                            :value="option.value"
                                            v-model="$parent.selectedFilters[key]"
                                            />
                                            <label :for="`filter-${key}-${option.value}`">{{ option.text }}</label>
                                        </div>
                                    </div>
                                </div>
                                <div class="input-list">
                                    <div 
                                        class="input-list-item" 
                                        v-for="value in $parent.selectedFilters[key]" 
                                        @click="$parent.removeInputOption($event)"
                                        :data-input-key="key"
                                        :data-input-option="value"
                                    >
                                    {{ value }}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="f-col" style="width: 100%;">
                            <div class="f-row spread-out align-v-center border-bottom" style="height:32px;font-size: 14px;">
                                <div style="font-style: italic;" v-if="$parent.datasets">
                                    <span class="bold"><span :class="`${$parent.rows < $parent.datasets.length ? 'highlight-dataset-count' : ''}`">{{ $parent.rows }}</span> of {{ $parent.datasets.length }}</span> datasets
                                </div>
                                <div class="f-row align-v-center" style="gap:20px">
                                    <select class="matkp-input" v-model="$parent.perPage" style="height:31px;padding:5px;">
                                        <option v-for="option in $parent.pageOptions" :value="option.value">{{ option.text }}</option>
                                    </select>
                                    <span class="italic" style="white-space: nowrap;">per page</span>
                                    <b-pagination
                                    v-model="$parent.currentPage"
                                    :total-rows="$parent.rows"
                                    :per-page="$parent.perPage"
                                    aria-controls="matkp-datasets-table"
                                    size="sm"
                                    ></b-pagination>
                                </div>
                            </div>
                            <div class="table-wrap" style="min-height:500px;">
                                <b-table style="font-size:14px;margin-top:14px;"
                                    id="matkp-datasets-table"
                                    striped
                                    small
                                    sort-icon-left
                                    :items="$parent.filteredItems" 
                                    :fields="$parent.fields"
                                    :filter="$parent.filter"
                                    @filtered="$parent.onFiltered"
                                    :per-page="$parent.perPage"
                                    :current-page="$parent.currentPage"
                                >
                                    <template #table-colgroup="scope">
                                        <col
                                            v-for="field in scope.fields"
                                            :key="field.key"
                                            :style="{ width: field.key === 'Name' ? '400px' : field.key === 'Depot' ? '250px' : 'auto' }"
                                        >
                                    </template>
                                    <template #cell(Download)="data">
                                        <a :href="data.value" target="_blank">download</a>
                                    </template>
                                    <template #cell(datasetId)="data">
                                        <a class="dataset-explore-link" :href="`/matkp/cellbrowser.html?dataset=${data.value}`" style="font-weight:bold">explore ❯</a>
                                    </template>
                                    <template #cell(totalCells)="data">
                                        {{data.value.toLocaleString()}}
                                    </template>
                                    <template #cell()="data">
                                        <template v-if="Array.isArray(data.value)">
                                            <template v-for="item in data.value">
                                                <div 
                                                :class="`dataset-table-item`" 
                                                :data-tooltip="item" 
                                                :data-input-key="data.field.key" 
                                                :data-input-option="item" 
                                                @click="$parent.addInputOption($event)"
                                                @mouseover="$parent.highlightTableItems($event)"
                                                @mouseout="$parent.unHighlightTableItems($event)"
                                                >
                                                {{ item }}
                                                </div>
                                            </template>
                                        </template>
                                        <template v-else>
                                            {{ data.value }}
                                        </template>
                                    </template>
                                </b-table>
                            </div>
                            <div class="f-row spread-out align-v-center border-top" style="height:32px;font-size: 14px;">
                                <div style="font-style: italic;" v-if="$parent.datasets">
                                    showing <span class="bold"><span :class="`${$parent.rows < $parent.datasets.length ? 'highlight-dataset-count' : ''}`">{{ $parent.rows }}</span> of {{ $parent.datasets.length }}</span> datasets
                                </div>
                                <div class="f-row align-v-center" style="gap:20px">
                                    <select class="matkp-input" v-model="$parent.perPage" style="height:31px;padding:5px;">
                                        <option v-for="option in $parent.pageOptions" :value="option.value">{{ option.text }}</option>
                                    </select>
                                    <span class="italic" style="white-space: nowrap;">per page</span>
                                    <b-pagination
                                    v-model="$parent.currentPage"
                                    :total-rows="$parent.rows"
                                    :per-page="$parent.perPage"
                                    aria-controls="matkp-datasets-table"
                                    size="sm"
                                    ></b-pagination>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                </template>
            </div>
            <!-- FOOTER -->
            <matkp-footer></matkp-footer>
        </div>
    </div>
</template>

<style scoped>
.content-wrap{
    padding: 20px 20px 150px;
    gap: 15px;
}
.b-table th {
    white-space: nowrap;
}
::v-deep .b-table thead th {
    padding: 10px 0.3rem;
    background: #dddddd;
    border-bottom: 1px solid black;
}
::v-deep .pagination.b-pagination{
    border: 0;
    padding: 0;
    font-size: 14px;
    gap: 10px;
}
::v-deep .pagination.b-pagination .page-link {
    border: 0 !important;
    border-radius: 0px !important;
    min-width: 31px;
    height: 31px;
    text-align: center;
    font-size: 14px;
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
.dataset-table-item{
    background: white;
    border-radius: 5px;
    padding: 0 5px;
    margin: 2px 0 0;
    /*text-wrap: nowrap;
    min-width: 10px;
    max-width: 120px;
    overflow: hidden;*/
    text-overflow: ellipsis;
    cursor: pointer;
}
.dataset-table-item:hover{
    outline: 2px solid #ffd10c;
}
[data-tooltip]::before {
    position : absolute;
    background: white;
    box-shadow: 0 0 5px 0 black;
    border-radius: 5px;
    padding: 0 5px;
    content : attr(data-tooltip);
    opacity : 0;
}
[data-tooltip]:hover::before {
    /*opacity : 1;*/
}
.button-lock-right{
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    z-index: 1;
    border-radius: 0;
}
.filter:hover .input-options {
    display: flex !important;
}
.input-options {
    padding: 10px 0;
}
.input-option,
.input-option > *{
    cursor: pointer;
    padding: 0 10px;
}
.input-option label {
    width: 100%;
    padding: 0 0 0 5px;
    white-space: nowrap;
}
.input-option:hover{
    background:#eeeeee;
}
.filter-count {
    background: white;
    border-radius: 10px;
    padding: 0 10px;
    font-size: 12px;
}
.filter:hover .filter-count {
    outline: 2px solid #ffd10c;
}
.filter-count.active{
    background:#ffd10c;
}
.dataset-explore-link {
    background: #ffd10c;
    padding: 5px 10px;
    border-radius: 10px;
    color: black !important;
    white-space: nowrap;
}
.input-list-item.highlight,
.filter-count.highlight{
    background: #ffd10c;
}
.highlight-dataset-count {
    background: #ffd10c;
    padding: 0 5px;
    border-radius: 5px;
}
</style>