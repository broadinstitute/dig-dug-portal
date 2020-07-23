<template>
    <result-card-template :title="title" :parent="parent">
        <template #sidebar>
        </template>
        <template #content>
            <locuszoom
                v-if="region"
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
    </result-card-template>
</template>
<script>
import Vue from "vue"

import regionUtils from "@/utils/regionUtils"

import ResultCardTemplate from "./ResultCardTemplate"
import ResultsNav from "../navs/ResultsNav"

import AssociationsTable from "@/components/AssociationsTable"
import LocusZoom from "@/components/lz/LocusZoom"
import LocusZoomAssociationsPanel from "@/components/lz/panels/LocusZoomAssociationsPanel"

import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils"

export default Vue.component('associations-result-card', {
    // TODO: Phenotypes – should there be a default?
    props: [
        "title",
        "parent",
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
        console.log('locus',this.locus)
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
        ResultCardTemplate,
        LocusZoom,
        AssociationsTable,
        LocusZoomAssociationsPanel,
    },
})
</script>
