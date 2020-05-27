<template>
    <div>
        <pre>Track Phenotype: {{ phenotype }}</pre>
    </div>
</template>
<script>
import igv from "igv";
import Vue from "vue";

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
            console.log('igv track created', 'igv browser:', this.$parent.igvBrowser)
            if (this.$parent.igvBrowser != null) {
                this.$parent.igvBrowser.loadTrack({
                        name: `${this.index}_${this.salt}`,
                        type: 'annotation',
                        reader: new BioIndexReader({
                            index: this.index,
                            feature: this.phenotype,
                            translator: this.associationsForIGV,
                        })
                })
            }
    },
    mounted() {
        console.log('igv track mounted')
    },
    updated() {
        console.log('igv track updated')
    },
    destroyed() {
        console.log('igv track destroyed')
        this.$parent.igvBrowser.removeTrackByName(`${this.index}_${this.salt}`);
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
