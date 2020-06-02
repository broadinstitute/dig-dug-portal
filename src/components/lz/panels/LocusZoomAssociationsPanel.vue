<template>
    <div :ref="`${index}_${salt}`">
        <pre></pre>
    </div>
</template>
<script>
import Vue from "vue";
import LocusZoom from "locuszoom";

import LZEvents, {
    LZ_BROWSER_FORCE_REFRESH,
    LZ_ADD_PANEL,
    LZ_REMOVE_PANEL,
    LZ_CHILD_DESTROY_PANEL,
    LZ_BIOINDEX_QUERY_RESOLVE,
    LZ_BIOINDEX_QUERY_ERROR,
    LZ_BIOINDEX_QUERY_FINISH,
    } from "@/components/lz/LocusZoomEvents"

import { BioIndexReader } from "@/utils/igvUtils"

import { cloneDeep } from "lodash";

export default Vue.component('locuszoom-associations-panel', {
    
    props: {

        phenotype: {
            type: String,
            required: true
        },

        // TODO: Problem with setting this as a prop is that the translation method depends on visualization type being targeted?
        panel: {
            type: String,
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
            index: 'associations',
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
        LZEvents.$emit(LZ_ADD_PANEL, this.buildTrack());
        LZEvents.$on(LZ_CHILD_DESTROY_PANEL, panelName => {
            if (panelName === this.panelName) {
                this.$destroy();
            };
        });

    },

    beforeDestroy () {
        LZEvents.$emit(LZ_REMOVE_TRACK, this.panelName);
    },

    methods: {

    },

    watch: {
        phenotype(newPhenotype, oldPhenotype) {
            LZEvents.$emit(LZ_REMOVE_TRACK, `${oldPhenotype} ${this.visualization}`);
            LZEvents.$emit(LZ_ADD_TRACK, this.buildTrack());
        }
    }

})

</script>

