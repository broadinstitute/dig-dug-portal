<template>
    <result-card :title="title">
        <template #content>
            {{ region }}
            <locuszoom
                ref="locuszoom"
                :refSeq="true">
                <lz-phewas-panel
                    :varId="variant"
                    :phenotypeMap="phenotypesLookup"
                ></lz-phewas-panel>
            </locuszoom>
        </template>
    </result-card>
</template>
<script>
import Vue from "vue"

import regionUtils from "@/utils/regionUtils"

import ResultCardTemplate from "./ResultCardTemplate"
import AssociationsTable from "@/components/AssociationsTable"
import LocusZoom from "@/components/lz/LocusZoom"
import LocusZoomPhewasPanel from "@/components/lz/panels/LocusZoomPhewasPanel"

import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils"

export default Vue.component('variant-result-card', {
    // TODO: Phenotypes – should there be a default?
    props: [
        "title",
        "variant",
    ],
    data() {
        return {
            phenotypesLookup: null
        }
    },
    created() {
        let self = this;
        Promise.resolve(fetch(BIO_INDEX_HOST+'/api/portal/phenotypes').then(response => response.json()).then(json => {
            self.phenotypesLookup = json.data;
        }));
    },
    components: {
        ResultCardTemplate,
        LocusZoom,
        AssociationsTable,
        LocusZoomPhewasPanel,
    },
})
</script>
