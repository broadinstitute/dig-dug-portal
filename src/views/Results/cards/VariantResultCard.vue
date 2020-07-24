<template>
    <result-card-template :title="title" :parent="parent">
        <template #content>
            <locuszoom
                v-if="phenotypesLookup"
                ref="locuszoom"
                :refSeq="false">
                <lz-phewas-panel
                    :varId="variantName"
                    :phenotypeMap="phenotypesLookup"
                ></lz-phewas-panel>
            </locuszoom>
        </template>
    </result-card-template>
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
        "parent",
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
            self.phenotypesLookup = {}
            for (let i in json.data) {
                self.phenotypesLookup[json.data[i].name] = json.data[i];
            }
        }));
    },
    computed: {
        variantName() {
            return this.variant[0].varId
        }
    },
    components: {
        ResultCardTemplate,
        LocusZoom,
        AssociationsTable,
        LocusZoomPhewasPanel,
    },
})
</script>
