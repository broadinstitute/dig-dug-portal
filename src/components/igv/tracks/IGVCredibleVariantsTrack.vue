<template>
    <div :ref="`${trackName}_${salt}`">
        <pre></pre>
    </div>
</template>
<script>
import Vue from "vue";

import igv from "igv";
import IGVEvents, {
    IGV_ADD_TRACK,
    IGV_REMOVE_TRACK,
    IGV_CHILD_DESTROY_TRACK,
    IGV_BIOINDEX_QUERY_RESOLVE,
    IGV_BIOINDEX_QUERY_ERROR,
    IGV_BIOINDEX_QUERY_FINISH,
    } from "@/components/igv/IGVEvents"
import { BioIndexReader } from "@/utils/igvUtils"

import { cloneDeep } from "lodash";

export default Vue.component('igv-credible-variants-track', {
    props: {
        phenotype: {
            type: String,
            required: true
        },
        credibleSetId: {
            type: String,
            required: true
        },
        posteriorProbability: {
            type: Boolean,
            require: false,
            default: false,
        },
        events: {
            type: Object,
            default: {}
        }
    },
    data() {
        return {
            salt: Math.floor((Math.random() * 10000)).toString(),
        }
    },
    computed: {
        trackName() {
            return `${this.phenotype} ${this.credibleSetId} Credible Set`
        },
        queryStringMaker: function () {
            return (chr, start, end) => `${this.phenotype},${this.credibleSetId}`;
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
        this.$el.parentNode.removeChild(this.$el);
    },

    methods: {
        buildTrack: function (trackName, queryStringMaker, translator, type, index, events) {
            return {
                name: this.trackName,
                type: 'gwas',
                posteriorProbability: this.posteriorProbability,
                reader: new BioIndexReader({
                    index: 'credible-variants',
                    queryString: this.queryStringMaker,
                    translator: this.associationsForIGV,
                    queryHandlers: {
                        resolveHandler: json =>
                            IGVEvents.$emit(this.events.resolveEvent || IGV_BIOINDEX_QUERY_RESOLVE, {
                                track: this.trackName,
                                index: 'credible-variants',
                                data: json,
                            }),
                        errHandler: json =>
                            IGVEvents.$emit(this.events.errEvent || IGV_BIOINDEX_QUERY_ERROR, {
                                track: this.trackName,
                                index: 'credible-variants',
                                data: json,
                            }),
                        finishHandler: response =>
                            IGVEvents.$emit(this.events.finishEvent || IGV_BIOINDEX_QUERY_FINISH, {
                                track: this.trackName,
                                index: 'credible-variants',
                                data: response,
                            })
                    }
                }),
                disableCache: true,
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
                    value: this.posteriorProbability ? association.posteriorProbability : association.pValue,
                }
            });
        }
    },
    watch: {
        phenotype(newPhenotype, oldPhenotype) {
            IGVEvents.$emit(IGV_REMOVE_TRACK, `${oldPhenotype} ${this.visualization}`);
            IGVEvents.$emit(IGV_ADD_TRACK, this.buildTrack());
        }
    }
})

</script>
