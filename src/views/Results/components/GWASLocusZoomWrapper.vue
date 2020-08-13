<template>
    <div v-if="phenotype">
        <locuszoom
            v-if="region"
            :chr="region.chr"
            :start="region.start"
            :end="region.end"
            :refSeq="true">
            <lz-associations-panel
                :phenotype="phenotype"
            ></lz-associations-panel>
        </locuszoom>
    </div>
</template>
<script>
import Vue from "vue"
import LocusZoom from "@/components/lz/LocusZoom";
import LocusZoomAssociationsPanel from "@/components/lz/panels/LocusZoomAssociationsPanel";
import { parseRegionAsync } from "@/utils/regionUtils";

export default Vue.component('locuszoom-gwas-wrapper', {
    props: ['phenotype','locus'],
    components: {
        LocusZoom,
        LocusZoomAssociationsPanel,
    },
    data() {
        return {
            region: null,
        }
    },
    async created() {
        this.region = await parseRegionAsync(this.locus, true);
    },
})
</script>
