<template>
    <div :ref="this.trackName"></div>
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
    IGV_BIOINDEX_QUERY_FINISH
} from "@/components/igv/IGVEvents";
import { BioIndexReader, colorIntervalAnnotation } from "@/utils/igvUtils";

import * as _ from "lodash";

export default Vue.component("igv-intervals-track", {
    props: {
        tissue: {
            type: Array,
            required: false
        },
        annotations: {
            type: Array,
            required: false
        },
        ancestry: {
            type: String,
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
        pValue: {
            type: Number,
            required: false,
            default: 1.0
        },
        beta: {
            type: Number,
            required: false,
            default: 1.0
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
        },

        colorScheme: {
            type: Function,
            required: false
        },

        // TODO: Problem with setting this as a prop is that the translation method depends on visualization type being targeted?
        visualization: {
            type: String,
            default: "annotation",
            validator: function(value) {
                // The value must match one of these strings
                return ["annotation", "gwas"].indexOf(value) !== -1;
            }
        },

        index: {
            type: String,
            default: "annotated-regions",
            validator: function(value) {
                // The value must match one of these strings
                return ["regions", "annotated-regions"].indexOf(value) !== -1;
            }
        }
    },
    data() {
        return {
            salt: Math.floor(Math.random() * 10000).toString(),
            padding: 0
        };
    },
    computed: {
        trackName() {
            return `${this.annotations[0]}${!!this.method ? ' '+this.method : ''}: p>${this.pValue}, β>${this.beta}`; //`${this.annotations[0]}__pValue<${this.pValue}__beta>${this.beta}`
        },
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
                    resolveHandler:
                        this.resolveHandler ||
                        (json =>
                            IGVEvents.$emit(IGV_BIOINDEX_QUERY_RESOLVE, json)),
                    errHandler:
                        this.errHandler ||
                        (json =>
                            IGVEvents.$emit(IGV_BIOINDEX_QUERY_ERROR, json)),
                    finishHandler:
                        this.finishHandler ||
                        (response =>
                            IGVEvents.$emit(
                                IGV_BIOINDEX_QUERY_FINISH,
                                response
                            ))
                }
            }),
            height: 160
        });

        IGVEvents.$on(IGV_CHILD_DESTROY_TRACK, trackName => {
            if (trackName === this.trackName) {
                this.$destroy();
            }
        });

        // add watchers for p-value and beta
        // this.$watch('pValue', function(pValue) { this.updatePValueFilter(pValue) }, { immediate: true });
        // this.$watch('beta', beta => this.updateBetaFilter(beta), { immediate: true });
    },

    beforeDestroy() {
        // clean up external data before destroying the component instance from memory
        IGVEvents.$emit(IGV_REMOVE_TRACK, this.trackName);
        this.$el.parentNode.removeChild(this.$el);
        // console.log(this.$el);
    },

    methods: {
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
                    .filter(
                        interval => {
                            let k = `${interval.tissueId || "NA"}_${interval.method || "NA"}_${interval.annotation}`;

                            let filterP = !this.pValue || this.tissueScoring[k].minP <= this.pValue;
                            let filterB = !this.beta || this.tissueScoring[k].maxB >= this.beta;
                            let filterMethod = this.method == interval.method;

                            return filterP && filterB && filterMethod;
                        }
                    )
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
                console.log(intervals.length, newIntervals.length, this.pValue, this.beta)
                return newIntervals;
            } else {
                return [];
            }
        }
    },
    watch: {
        // pValue(newPValue) {

        // },
        // beta(newBeta) {

        // }
    }
});
</script>
