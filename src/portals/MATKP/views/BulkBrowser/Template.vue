<template>
    <div class="matkp">
        <div class="f-col fill-height">
            <!-- NAV -->
            <matkp-nav></matkp-nav>
            <!-- BODY -->
            <div class="mat-body">
                <select v-model="$store.state.selectedDataset">
                    <option value="">Select a dataset</option>
                    <option v-for="dataset in $parent.datasets"
                        :value="dataset">
                        {{ dataset }}
                    </option>
                </select>
                <select v-model="$store.state.selectedComparison">
                    <option value="">Select a comparison</option>
                    <option v-for="comparison in $parent.comparisons"
                        :value="comparison">
                        {{ comparison }}
                    </option>
                </select>
                <h4>{{ $parent.selectedDataset }}</h4>
                <div class="row">
                    <div id="bulk_heatmap" class="col-md-6">
                        <div v-if="$parent.loading">Loading...</div>
                    </div>
                    <div class="col-md-6">
                        <div v-if="$parent.bulkData19K.length> 0">
                            <bulk-volcano-plot
                                :renderData="$parent.bulkData19K"
                                :renderConfig="$parent.volcanoConfig"
                                :margin="$parent.margin"
                                sectionId="_bulk">

                            </bulk-volcano-plot>
                        </div>
                        <div v-else>Loading...</div>
                    </div>
                </div>
                <div>
                    <bulk-table
                        :bulkData="$parent.zNormData"
                        :config="$parent.tableConfig"
                        :scatterConfig="$parent.scatterplotConfig">

                    </bulk-table>
                </div>
            </div>
            <!-- FOOTER -->
            <matkp-footer></matkp-footer>
        </div>
    </div>
</template>