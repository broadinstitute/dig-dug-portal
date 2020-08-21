<template>
    <div v-if="phenotypes">
        <locuszoom
            v-if="region"
            :chr="region.chr"
            :start="region.start"
            :end="region.end"
            :refSeq="true">
            <lz-associations-panel
                v-for="phenotype in phenotypes"
                :key="phenotype"
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
    props: ['phenotypes','locus'],
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
