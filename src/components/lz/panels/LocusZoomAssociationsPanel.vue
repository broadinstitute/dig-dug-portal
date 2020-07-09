<template>
    <div :ref="`${index}_${salt}`">
        <pre></pre>
    </div>
</template>
<script>
import Vue from "vue";
import LocusZoom from "locuszoom";

import LZDataSources from "@/utils/lz/lzDataSources";
import { LZBioIndexSource } from "@/utils/lz/lzBioIndexSource";

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
            datasource: 'assoc',
            index: 'associations',  // bioindex
            salt: Math.floor((Math.random() * 10000)).toString(),
        }
    },
    computed: {
        panelId() {
            return `${this.phenotype}_${this.salt}`
        },
        queryStringMaker: function () {
            return (chr, start, end) => `${this.phenotype},${chr}:${start}-${end}`;
        },
    },
    created() {
        $parent.$emit("LZ_LOAD_PANEL", this.buildPanel());
    },
    mounted() {
        $parent.$emit("LZ_ADD_PANEL", this.buildPanel());
        $parent.$on("LZ_CHILD_DESTROY_PANEL", panelId => {
            if (panelId === this.panelId) {
                this.$destroy();
            };
        });
    },
    beforeDestroy () {
        console.log('before destroy')
        $parent.$emit("LZ_REMOVE_PANEL", this.panelId);
    },
    destroy () {
        console.log('destroy')
    },
    methods: {
        buildPanel() {
            return {
                panel: {
                    type: this.panel,
                    id: this.panelId,
                    takes: `assoc_${this.salt}`,
                    for: 'assoc',
                },
                source: {
                    gives: `assoc_${this.salt}`,
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
            }));
            return translation
        }

    },

    watch: {
        phenotype(newPhenotype, oldPhenotype) {
            $parent.$emit("LZ_REMOVE_PANEL", `${oldPhenotype} ${this.visualization}`);
            this.myPhenotype = newPhenotype;
            $parent.$emit("LZ_ADD_PANEL", this.buildPanel());
        }
    }

})

const calcLog = function (values) {
    return (-1) * Math.log10(values);
};

</script>

