<template>
    <div :ref="`${index}_${salt}`"></div>
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
import { BioIndexReader, colorIntervalAnnotation } from "@/utils/igvUtils"

import * as _ from "lodash";

export default Vue.component('igv-intervals-track', {
    props: {

        tissue: {
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
            index: 'regions',
            salt: Math.floor((Math.random() * 10000)).toString(),
        }
    },
    computed: {
        trackName() {
            return `${this.tissue} ${this.visualization}`
        }
    },
    mounted() {
        IGVEvents.$emit(IGV_ADD_TRACK, {
                name: this.trackName,
                type: this.visualization,
                reader: new BioIndexReader({
                    index: this.index,
                    queryString: this.queryStringMaker,
                    translator: this.intervalsForIGV,

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
            });

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
        // this.$el.parentNode.removeChild(this.$el);
    },

    methods: {
        queryStringMaker: function (chr, start, end) {
            return `${chr}:${start}-${end}`;
        },
        intervalsForIGV: function (intervals) {
            // NOTE: Sometimes a track might not have defined data for a tissue on an interval, but was already created
            // In such a case the bioindex is not going to return any data for a given tissue leaving the access of that data by the track undefined
            // Since we don't want to destroy the track (what if there is more data just around the corner?) we return an empty array
            const tissuesOnRange = _.groupBy(intervals.filter(interval => !!interval.tissue), 'tissue.description');
            if (!!tissuesOnRange[this.tissue]) {
                return tissuesOnRange[this.tissue].map(interval => ({
                    chr: interval.chromosome,
                    start: interval.start,
                    end: interval.end,
                    name: interval.annotation,
                    color: colorIntervalAnnotation(interval.annotation),
                }))
            } else {
                return [];
            }
        }
    },
})

</script>
