<template>
    <div class="mat-wrap f-col fill-height">
        <!-- NAV -->
        <matkp-nav></matkp-nav>
        <!-- BODY -->
        <div class="mat-body">
            <template>
                <!-- HERO -->
                <matkp-hero></matkp-hero>
                <!-- CONTENT -->
                <div class="content-wrap f-col align-h-center">
                    
                    <b-input-group size="sm" style="padding:40px 0 60px 0; width: 600px;">
                        <b-form-input
                            v-model="$parent.filter"
                            type="text"
                            placeholder="Search Datasets (type any substring in the table below)"
                        ></b-form-input>
                        <b-input-group-append>
                            <b-button :disabled="!$parent.filter" @click="$parent.filter = ''">Clear</b-button>
                        </b-input-group-append>
                    </b-input-group>

                    <div class="table-wrap" style="min-height:500px;">
                        <b-table style="font-size:14px"
                            striped
                            small
                            sort-icon-left
                            :items="$parent.datasets" 
                            :fields="$parent.datasetsFields"
                            :filter="$parent.filter"
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
                
            </template>
        </div>
        <!-- FOOTER -->
        <matkp-footer></matkp-footer>
    </div>
</template>

<style scoped>
::v-deep .italic{
    font-style: italic;
}
.content-wrap{
    padding: 20px;
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
</style>