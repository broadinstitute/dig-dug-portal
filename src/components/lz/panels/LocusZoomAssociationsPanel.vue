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
import { calcLog } from "@/utils/lz/lzUtils";

import LZEvents, {
    LZ_BROWSER_FORCE_REFRESH,
    LZ_ADD_PANEL,
    LZ_REMOVE_PANEL,
    LZ_CHILD_DESTROY_PANEL,
    LZ_BIOINDEX_QUERY_RESOLVE,
    LZ_BIOINDEX_QUERY_ERROR,
    LZ_BIOINDEX_QUERY_FINISH,
} from "@/components/lz/LocusZoomEvents"

export default Vue.component('locuszoom-associations-panel', {

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
            index: 'associations',  // bioindex
            panel: 'association',   // locuszoom
            myPhenotype: this.phenotype,
            myPanel: this.panel,
            salt: Math.floor((Math.random() * 10000)).toString(),
        }
    },

    computed: {

        panelName() {
            return `${this.myPhenotype} ${this.myPanel}`
        },

        queryStringMaker: function () {
            return (chr, start, end) => `${this.myPhenotype},${chr}:${start}-${end}`;
        },

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

        LZEvents.$emit(LZ_REMOVE_PANEL, this.panelName);

    },

    methods: {

        buildPanel() {
            return {
                panel: this.panel,
                source: new LZBioIndexSource({
                    index: this.index,
                    queryStringMaker: this.queryStringMaker,
                    translator: this.associationsToLZ,
                })
            }
        },

        associationsToLZ: associations => {
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

</script>

