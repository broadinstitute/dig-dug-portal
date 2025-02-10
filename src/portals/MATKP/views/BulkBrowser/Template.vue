<template>
    <div class="matkp">
        <div class="f-col fill-height">
            <!-- NAV -->
            <matkp-nav></matkp-nav>
            <!-- BODY -->
            <div class="mat-body">
                <h2>{{ $parent.selectedDataset }}</h2>
                <div id="bulk_heatmap">
                    <div v-if="$parent.loading">Loading...</div>
                </div>
                <div>
                    <div v-if="$parent.loading">Loading...</div>
                    <div v-else>
                        <research-volcano-plot-vector
                            :renderData="$parent.zNormData"
                            :renderConfig="$parent.volcanoConfig"
                            :margin="$parent.margin"
                            sectionId="_bulk"
                            :renderOnMount="true">

                        </research-volcano-plot-vector>
                    </div>
                </div>
            </div>
            <!-- FOOTER -->
            <matkp-footer></matkp-footer>
        </div>
    </div>
</template>