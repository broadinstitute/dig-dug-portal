<template>
    <div :ref="`${trackName}_${salt}`"></div>
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
    IGV_BIOINDEX_QUERY_FINISH
} from "@/components/igv/IGVEvents";
import { BioIndexReader } from "@/utils/igvUtils";
import * as _ from "lodash";

export default Vue.component("igv-intervals-track", {
    props: {
        annotations: {
            type: Array,
            required: false
        },
        method: {
            type: String,
            required: false
        },
        tissueScoring: {
            type: Object,
            required: false
        },
        colorScheme: {
            type: Function,
            required: false
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
            return `${this.annotations[0]}${
                !!this.method ? " " + this.method : ""
            }`;
        },
        igvFilter() {
            return this.$parent.filter;
        },
    },
    mounted() {
        IGVEvents.$emit(IGV_ADD_TRACK, this.buildTrack());

        IGVEvents.$on(IGV_CHILD_DESTROY_TRACK, trackName => {
            if (trackName === this.trackName) {
                this.$destroy();
            }
        });
    },

    beforeDestroy() {
        // clean up external data before destroying the component instance from memory
        IGVEvents.$emit(IGV_REMOVE_TRACK, this.trackName);
        this.$el.parentNode.removeChild(this.$el);
    },
    methods: {
        buildTrack: function(trackName, queryStringMaker, translator, type, index, events) {
            return {
                name: this.trackName,
                type: "annotation",
                reader: new BioIndexReader({
                    index: "annotated-regions",
                    queryString: this.queryStringMaker,
                    translator: this.intervalsForIGV,
                    queryHandlers: {
                        resolveHandler: json =>
                            IGVEvents.$emit(this.events.resolveEvent || IGV_BIOINDEX_QUERY_RESOLVE, {
                                track: this.trackName,
                                index: "annotated-regions",
                                data: json,
                            }),
                        errHandler: json =>
                            IGVEvents.$emit(this.events.errEvent || IGV_BIOINDEX_QUERY_ERROR, {
                                track: this.trackName,
                                index: "annotated-regions",
                                data: json,
                            }),
                        finishHandler: response =>
                            IGVEvents.$emit(this.events.finishEvent || IGV_BIOINDEX_QUERY_FINISH, {
                                track: this.trackName,
                                index: "annotated-regions",
                                data: response,
                            })
                    }
                }),
                height: 160,
                disableCache: true
            }
        },
        queryStringMaker: function(chr, start, end) {
            // TODO: ASSUMES UNIQUE ANNOTATION!!! Will not extend to multiple annotation inputs!
            return !!this.annotations
                ? `${this.annotations[0]},${chr}:${start}-${end}`
                : `${chr}:${start}-${end}`;
        },
        intervalsForIGV: function(intervals) {
            // NOTE: Sometimes a track might not have defined data for a tissue on an interval, but was already created
            // In such a case the bioindex is not going to return any data for a given tissue leaving the access of that data by the track undefined
            // Since we don't want to destroy the track (what if there is more data just around the corner?) we return an empty array
            // this.annotationScoring[this.tissue][interval.annotation]['pValue'] < 0.01 && this.annotationScoring[this.tissue][interval.annotation]['beta'] > 1.0
            if (!!intervals) {
                const newIntervals = intervals
                    .filter(interval => {
                        let k = `${interval.tissueId ||
                            "NA"}_${interval.method || "NA"}_${
                            interval.annotation
                        }`;

                        // TODO: Pick out of the filter only those predicates that matter to the object
                        let filterP =
                            !this.igvFilter.pValue ||
                            this.$parent.scoring[k].minP <= this.igvFilter.pValue;
                        let filterFold =
                            !this.igvFilter.fold ||
                            this.$parent.scoring[k].maxFold >= this.igvFilter.fold;
                        let filterMethod = this.method == interval.method;

                        return filterP && filterFold && filterMethod;
                    })
                    .map(interval => {
                        const color = this.colorScheme(interval.tissue);
                        return {
                            name: interval.tissue || interval.tissueId,
                            chr: interval.chromosome,
                            start: interval.start,
                            end: interval.end,
                            color: color
                        };
                    });
                return newIntervals;
            } else {
                return [];
            }
        }
    },
});
</script>
