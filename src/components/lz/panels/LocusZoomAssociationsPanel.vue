<template>
    <div :ref="`${index}_${salt}`">
        <pre></pre>
    </div>
</template>
<script>
import Vue from "vue";
import LocusZoom from "locuszoom";

import {
    LZ_TYPE,
    BASE_PANEL_OPTIONS,
    PANEL_OPTIONS
} from "@/utils/lz/lzConstants";
import LZDataSources from "@/utils/lz/lzDataSources";
import { LZBioIndexSource } from "@/utils/lz/lzBioIndexSource";

import LZEvents, {
    LZ_BROWSER_FORCE_REFRESH,
    LZ_ADD_PANEL,
    LZ_REMOVE_PANEL,
    LZ_LOAD_PANEL,
    LZ_CHILD_DESTROY_PANEL,
    LZ_BIOINDEX_QUERY_RESOLVE,
    LZ_BIOINDEX_QUERY_ERROR,
    LZ_BIOINDEX_QUERY_FINISH,
} from "@/components/lz/LocusZoomEvents"

export default Vue.component('lz-associations-panel', {

    props: {

        phenotype: {
            type: String,
            // required: true
        },

        finishHandler: {
            type: Function,
            required: false
        },
        resolveHandler: {
            type: Function,
            required: false
        },
        errHandler: {
            type: Function,
            required: false
        }

    },

    data() {
        return {
            panel: 'association',   // locuszoom
            index: 'associations',  // bioindex
            salt: Math.floor((Math.random() * 10000)).toString(),
        }
    },

    computed: {

        panelName() {
            return `${this.phenotype} ${this.panel}`
        },

        queryStringMaker: function () {
            return (chr, start, end) => `${this.phenotype},${chr}:${start}-${end}`;
        },

    },
    created() {
        console.log('child created')
        LZEvents.$emit(LZ_LOAD_PANEL, this.buildPanel());
    },
    mounted() {
        LZEvents.$emit(LZ_ADD_PANEL, this.buildPanel());
        LZEvents.$on(LZ_CHILD_DESTROY_PANEL, panelName => {
            if (panelName === this.panelName) {
                this.$destroy();
            };
        });

    },

    beforeDestroy () {
        console.log('before destroy')

        LZEvents.$emit(LZ_REMOVE_PANEL, this.panelName);

    },
    destroy () {
        console.log('destroy')
    },

    methods: {

        buildPanel() {
            // console.log('hello', new LZBioIndexSource())
            let salt =  Math.floor((Math.random() * 10000)).toString();
            return {
                panel: {
                    type: this.panel,
                    takes: `assoc_${salt}`,
                    for: 'assoc',
                },
                source: {
                    gives: `assoc_${salt}`,
                    as: 'assoc',
                    // reader: ["StaticJSON", []]
                    reader: new LZBioIndexSource({
                        index: this.index,
                        queryStringMaker: this.queryStringMaker,
                        translator: this.associationsToLZ,
                    })
                }
            }
        },

        associationsToLZ: associations => {
            console.log(associations)
            const translation = associations.map(association => ({
                id: association.varId,
                chr: association.chromosome,
                start: association.position,
                end: association.position,
                position: association.position,
                pvalue: association.pValue,
                log_pvalue: calcLog(association.pValue).toPrecision(4),
                variant: association.varId,
                ref_allele: association.varId,
                // trait_group: association.phenotype.group,
                // trait_label: association.phenotype.description,
            }));
            return translation
        }

    },

    watch: {
        phenotype(newPhenotype, oldPhenotype) {
            LZEvents.$emit(LZ_REMOVE_PANEL, `${oldPhenotype} ${this.visualization}`);
            this.myPhenotype = newPhenotype;
            LZEvents.$emit(LZ_ADD_PANEL, this.buildPanel());
        }
    }

})

const calcLog = function (values) {
    return (-1) * Math.log10(values);
};

</script>

