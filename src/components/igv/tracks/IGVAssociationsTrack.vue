<template>
    <div>
        <pre>Track Phenotype: {{ phenotype }}</pre>
    </div>
</template>
<script>
import Vue from "vue";

import igv from "igv";
import IGVEvents, { IGV_ADD_TRACK, IGV_REMOVE_TRACK } from "@/components/igv/IGVEvents"
import { BioIndexReader } from "@/utils/igvUtils"

import { cloneDeep } from "lodash";

export default Vue.component('igv-associations-track', {
    props: ['phenotype'],
    data() {
        return {
            index: 'associations',
            salt: Math.floor((Math.random() * 10000)).toString()
        }
    },
    created() {
        console.log('igv track created')
    },
    mounted() {
        console.log('igv track mounted')
        IGVEvents.$emit(IGV_ADD_TRACK, {
                name: `${this.index}_${this.salt}`,
                type: 'annotation',
                reader: new BioIndexReader({
                    index: this.index,
                    queryString: this.queryStringMaker,
                    translator: this.associationsForIGV,
                })
            });
    },
    updated() {
        console.log('igv track updated')
    },
    destroyed() {
        console.log('igv track destroyed')
        IGVEvents.$emit(IGV_REMOVE_TRACK, `${this.index}_${this.salt}`)
    },
    methods: {
        queryStringMaker: function (chr, start, end) {
            return `${this.phenotype},${chr}:${start}-${end}`;
        },
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
