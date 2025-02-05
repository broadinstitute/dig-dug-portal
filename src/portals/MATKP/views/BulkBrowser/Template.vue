<template>
    <div class="matkp">
        <div class="f-col fill-height">
            <!-- NAV -->
            <matkp-nav></matkp-nav>
            <!-- BODY -->
            <div class="mat-body">
                <research-heatmap 
                v-if="$parent.heatmapData"
                :heatmapData="$parent.heatmapData"
                :renderConfig="$parent.heatmapConfig"
                :utils="$parent.utils"
                sectionId="test"
                />
            </div>
            <!-- FOOTER -->
            <matkp-footer></matkp-footer>
        </div>
    </div>
</template>