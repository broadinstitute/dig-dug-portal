<template>
    <result-card :title="title">
        <template #sidebar>
        </template>
        <template #content>
            {{ region }}
            <locuszoom
                ref="locuszoom"
                :key="title"
                :chr="region.chr"
                :start="region.start"
                :end="region.end"
                :refSeq="true">
                <lz-associations-panel
                    :key="title+'_panel'"
                    :phenotype="phenotype"
                ></lz-associations-panel>
            </locuszoom>
            <associations-table
                v-if="phenotypesLookup"
                :associations="associations"
                :phenotypes="[phenotypesLookup]"
            ></associations-table>
        </template>
    </result-card>
</template>
<script>
import Vue from "vue"

import regionUtils from "@/utils/regionUtils"

import ResultCard from "./ResultCard"
import ResultsNav from "../navs/ResultsNav"

import AssociationsTable from "@/components/AssociationsTable"
import LocusZoom from "@/components/lz/LocusZoom"
import LocusZoomAssociationsPanel from "@/components/lz/panels/LocusZoomAssociationsPanel"

import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils"

export default Vue.component('associations-result-card', {
    // TODO: Phenotypes – should there be a default?
    props: [
        "title",
        "phenotype",
        "associations",
        "locus"
    ],
    data() {
        return {
            phenotypesLookup: null
        }
    },
    created() {
        let self = this;
        Promise.resolve(fetch(BIO_INDEX_HOST+'/api/portal/phenotypes').then(response => response.json()).then(json => {
            self.phenotypesLookup = json.data.filter(phenotypeInfo => phenotypeInfo.name === this.phenotype)[0];
        }));
    },
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
