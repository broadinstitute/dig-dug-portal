<template>
    <result-card :title="title">
        <template #content>
            {{ region }}
            <locuszoom
                ref="locuszoom"
                :chr="region.chr"
                :start="region.start"
                :end="region.end"
                :refSeq="true">
                <lz-associations-panel
                    :phenotype="phenotype"
                ></lz-associations-panel>
            </locuszoom>
            <associations-table
                :associations="associations"
                :phenotype="phenotype"
            ></associations-table>
        </template>
    </result-card>
</template>
<script>
import Vue from "vue"

import regionUtils from "@/utils/regionUtils"

import ResultCard from "./ResultCard"
import AssociationsTable from "@/components/AssociationsTable"
import LocusZoom from "@/components/lz/LocusZoom"
import LocusZoomAssociationsPanel from "@/components/lz/panels/LocusZoomAssociationsPanel"

export default Vue.component('associations-result-card', {
    // TODO: Phenotypes – should there be a default?
    props: [
        "title",
        "phenotype",
        "associations",
        "locus"
    ],
    computed: {
        region() {
            return regionUtils.parseRegion(this.locus)
        }
    },
    components: {
        ResultCard,
        LocusZoom,
        AssociationsTable,
        LocusZoomAssociationsPanel,
    },
})
</script>
