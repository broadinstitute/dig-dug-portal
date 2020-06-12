<template>
    <div :ref="`${index}_${salt}`">
        <pre></pre>
    </div>
</template>
<script>
import Vue from "vue";

import igv from "igv";
import IGVEvents, {
    IGV_BROWSER_FORCE_REFRESH,
    IGV_ADD_TRACK,
    IGV_REMOVE_TRACK,
    IGV_CHILD_DESTROY_TRACK,
    IGV_BIOINDEX_QUERY_RESOLVE,
    IGV_BIOINDEX_QUERY_ERROR,
    IGV_BIOINDEX_QUERY_FINISH,
    } from "@/components/igv/IGVEvents"
import { BioIndexReader } from "@/utils/igvUtils"

import { cloneDeep } from "lodash";

export default Vue.component('igv-associations-track', {
    props: {

        phenotype: {
            type: String,
            required: true
        },

        // TODO: Problem with setting this as a prop is that the translation method depends on visualization type being targeted?
        visualization: {
            type: String,
            default: 'annotation',
            validator: function (value) {
                // The value must match one of these strings
                return ['annotation', 'gwas'].indexOf(value) !== -1
            }
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
            myVisualization: this.visualization,
            salt: Math.floor((Math.random() * 10000)).toString(),
        }
    },
    computed: {
        trackName() {
            return `${this.phenotype}`
        },
        queryStringMaker: function () {
            return (chr, start, end) => `${this.phenotype},${chr}:${start}-${end}`;
        },
    },

    mounted() {
        IGVEvents.$emit(IGV_ADD_TRACK, this.buildTrack());
        IGVEvents.$on(IGV_CHILD_DESTROY_TRACK, trackName => {
            if (trackName === this.trackName) {
                this.$destroy();
            };
        });

    },
    beforeDestroy () {
        // clean up external data before destroying the component instance from memory
        IGVEvents.$emit(IGV_REMOVE_TRACK, this.trackName);
        // console.log(this.$el);
        this.$el.parentNode.removeChild(this.$el);
    },

    methods: {
        buildTrack: function () {
            return {
                name: this.trackName,
                type: this.visualization,
                reader: new BioIndexReader({
                    index: this.index,
                    queryString: this.queryStringMaker,
                    translator: this.associationsForIGV,

                    // if the queryHandler is defined (i.e. passed as a prop), use it.
                    // Else, use whatever default queryhandler the parent IGV instance has (given that one is defined there).
                    queryHandlers: {
                        resolveHandler: this.resolveHandler ||
                            ((json) => IGVEvents.$emit(IGV_BIOINDEX_QUERY_RESOLVE, json)),
                        errHandler: this.errHandler ||
                            ((json) => IGVEvents.$emit(IGV_BIOINDEX_QUERY_ERROR, json)),
                        finishHandler: this.finishHandler ||
                            ((response) => IGVEvents.$emit(IGV_BIOINDEX_QUERY_FINISH, response)),
                    }

                })
            }
        },
        associationsForIGV: function (associations) {
            return associations.map(association => {
                const annotation = cloneDeep(association);
                annotation['chromosome'] = undefined;
                annotation['position'] = undefined;
                return {
                    name: association.varId,
                    chr: association.chromosome,
                    start: association.position,
                    end: association.position,
                    ...annotation,
                    // for GWAS:
                    value: association.pValue,
                }
            });
        }
    },
    watch: {
        phenotype(newPhenotype, oldPhenotype) {
            IGVEvents.$emit(IGV_REMOVE_TRACK, `${oldPhenotype}`);
            IGVEvents.$emit(IGV_ADD_TRACK, this.buildTrack());
        }
    }
})

</script>
