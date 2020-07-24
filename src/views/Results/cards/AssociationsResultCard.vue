<template>
    <result-card-template :title="title" :parent="parent">
        <template #sidebar>
            <associations-results-sidebar
                :associations="associations"
            ></associations-results-sidebar>
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

import { parseRegionAsync } from "@/utils/regionUtils"

import ResultCardTemplate from "./ResultCardTemplate"
import ResultsNav from "../navs/ResultsNav"

import AssociationsTable from "@/components/AssociationsTable"
import LocusZoom from "@/components/lz/LocusZoom"
import LocusZoomAssociationsPanel from "@/components/lz/panels/LocusZoomAssociationsPanel"

import AssociationsResultSideBar from "./AssociationsResultSidebar"

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
            phenotypesLookup: null,
            region: null,
        }
    },
    async created() {
        let self = this;
        Promise.resolve(fetch(BIO_INDEX_HOST+'/api/portal/phenotypes').then(response => response.json()).then(json => {
            self.phenotypesLookup = json.data.filter(phenotypeInfo => phenotypeInfo.name === this.phenotype)[0];
        }));
        this.region = await parseRegionAsync(this.locus, true);
    },
    components: {
        ResultCardTemplate,
        LocusZoom,
        AssociationsTable,
        LocusZoomAssociationsPanel,
        AssociationsResultSideBar,
    },
})
</script>
