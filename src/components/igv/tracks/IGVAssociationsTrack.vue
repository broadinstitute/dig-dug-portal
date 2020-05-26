<template>
    <igv-track
        :num="num"
        :index="MY_BIO_INDEX_TYPE"
        :feature="feature"
        :translator="associationsForIGV"
    ></igv-track>
</template>
<script>
import igv from "igv";
import Vue from "vue";

import { BioIndexReader } from "@/utils/igvUtils"
import { cloneDeep } from "lodash";
import IGVTrack from "@/components/igv/IGVTrack.vue"

const MY_BIO_INDEX_TYPE = 'associations';

export default Vue.component('igv-associations-track', {
    components: {
        IGVTrack
    },
    methods: {
        associationsForIGV: function (associations) {
            return associations.map(association => {
                const annotation = cloneDeep(association);
                annotation['chromosome'] = undefined;
                annotation['position'] = undefined;
                return {
                    chr: association.chromosome,
                    start: association.position,
                    end: association.position,
                    ...annotation,
                    // for GWAS:
                    value: association.pValue,
                }
            });
        }
    }
})

</script>
