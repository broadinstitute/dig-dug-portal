<template>
    <div :ref="`${trackName}_${salt}`">
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

export default Vue.component('igv-associations-track', {
    props: {
        phenotype: {
            type: String,
            required: true
        },
        events: {
            type: Object,
            default: {}
        }
    },
    data() {
        return {
            index: 'associations',
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
        this.$el.parentNode.removeChild(this.$el);
    },
    methods: {
        buildTrack: function (trackName, queryStringMaker, translator, type, index, events) {
            return {
                name: this.trackName,
                type: "gwas",
                reader: new BioIndexReader({
                    index: this.index,
                    queryString: this.queryStringMaker,
                    translator: this.associationsForIGV,
                    queryHandlers: {
                        resolveHandler: json =>
                            IGVEvents.$emit(this.events.resolveEvent || IGV_BIOINDEX_QUERY_RESOLVE, {
                                track: this.trackName,
                                index: this.index,
                                data: json,
                            }),
                        errHandler: json =>
                            IGVEvents.$emit(this.events.errEvent || IGV_BIOINDEX_QUERY_ERROR, {
                                track: this.trackName,
                                index: this.index,
                                data: json,
                            }),
                        finishHandler: response =>
                            IGVEvents.$emit(this.events.finishEvent || IGV_BIOINDEX_QUERY_FINISH, {
                                track: this.trackName,
                                index: this.index,
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
                    // for GWAS:
                    value: association.pValue,
                }
            });
        }
    },
})

</script>
