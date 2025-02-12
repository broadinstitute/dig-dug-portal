<template>
    <div class="matkp">
        <div class="f-col fill-height">
            <!-- NAV -->
            <matkp-nav></matkp-nav>
            <!-- BODY -->
            <div class="mat-body">
                <h2>{{ $parent.selectedDataset }}</h2>
                <div class="row">
                    <div id="bulk_heatmap" class="col-md-6">
                        <div v-if="$parent.loading">Loading...</div>
                    </div>
                    <div class="col-md-6">
                        <div v-if="$parent.loading">Loading...</div>
                        <div v-else>
                            <bulk-volcano-plot
                                :renderData="$parent.zNormData"
                                :renderConfig="$parent.volcanoConfig"
                                :margin="$parent.margin"
                                sectionId="_bulk"
                                :renderOnMount="true">

                            </bulk-volcano-plot>
                        </div>
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