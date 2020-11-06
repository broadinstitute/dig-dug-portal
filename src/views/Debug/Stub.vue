<template>
    <locuszoom
        :chr="chr"
        :start="start"
        :end="end"
        :salt="0"
        @regionchanged="() => spy('regionchanged')">
        <lz-associations-panel
            v-if="phenotype"
            :phenotype="phenotype"
            :finishHandler="() => spy('finishandler')"
        ></lz-associations-panel>
    </locuszoom>
</template>
<script>
import LocusZoom from "../../components/lz/LocusZoom"
import LocusZoomAssociationsPanel from "../../components/lz/panels/LocusZoomAssociationsPanel"

export default {
    components: {
        LocusZoom,
        LocusZoomAssociationsPanel
    },
    data() {
        return {
            chr: 8,
            start: 117962512,
            end: 118188952,
            phenotype: null,
        }
    },
    methods: {
        spy(message) {
            console.log(`spy ${message}`)
        }
    }
}
</script>
