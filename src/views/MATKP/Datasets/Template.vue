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
                            <div style="font-style: italic; line-height: 12px;" v-if="$parent.datasets">
                                {{ $parent.filteredItems.length > 0 || $parent.filteredCount > 0  ? $parent.filteredCount > 0 && $parent.filteredCount < $parent.filteredItems.length ? $parent.filteredCount + ' of ' : $parent.filteredItems.length + ' of ' : '' }} {{ $parent.datasets.length }}
                            </div>
                            <div :class="`loader ${!$parent.isLoading ? 'hidden' : ''}`">loading...</div>
                        </div>
                        <div class="col1" style="width:calc(100% - 265px)">
                            <b-input-group size="sm">
                                <input
                                    v-model="$parent.filter"
                                    type="text"
                                    placeholder="Search Datasets using any text from the table below"
                                ></input>
                                <b-button class="button-lock-right" :disabled="!$parent.filter" @click="$parent.filter = ''">Clear</b-button>
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
                                <div class="f-row matkp-input" style="height:auto;" :data-input-key="key" @click="$parent.showInputOptions($event)">
                                    <div class="f-row fill-width spread-out no-events">
                                        <div class="label bold" style="text-transform:capitalize">{{$parent.fields.find(x => x.key === key)["label"]}}</div>
                                        <div style="font-size:12px;">
                                        {{ $parent.selectedFilters[key].length > 0 ? $parent.selectedFilters[key].length + ' of ' : '' }}{{ $parent.filterOptions[key].length }} ❯
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
                                <div class="f-col input-options hidden" :data-input-options-key="key">
                                    <div class="f-row align-v-center input-option" style="gap:5px" v-for="option in options">
                                        <input
                                        type="checkbox"
                                        :id="`filter-${key}-${option.value}`"
                                        :value="option.value"
                                        v-model="$parent.selectedFilters[key]"
                                        />
                                        <label style="white-space: nowrap;" :for="`filter-${key}-${option.value}`">{{ option.text }}</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="f-col">
                            <div class="table-wrap" style="min-height:500px;">
                                <b-table style="font-size:14px"
                                    striped
                                    small
                                    sort-icon-left
                                    :items="$parent.filteredItems" 
                                    :fields="$parent.fields"
                                    :filter="$parent.filter"
                                    @filtered="$parent.onFiltered"
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
                                        <a :href="`/matkp/cellbrowser.html?dataset=${data.value}`" style="font-weight:bold">explore</a>
                                    </template>
                                    <template #cell(totalCells)="data">
                                        {{data.value.toLocaleString()}}
                                    </template>
                                    <template #cell()="data">
                                        <template v-if="Array.isArray(data.value)">
                                            <template v-for="item in data.value">
                                                <div class="dataset-table-item" :data-tooltip="item">{{ item }}</div>
                                            </template>
                                        </template>
                                        <template v-else>
                                            {{ data.value }}
                                        </template>
                                    </template>
                                </b-table>
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
    padding: 20px;
    gap: 15px;
}
.b-table th {
    white-space: nowrap;
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
</style>