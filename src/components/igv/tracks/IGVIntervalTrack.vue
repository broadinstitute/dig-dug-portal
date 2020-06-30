<template>
    <igv-track
        :track-name="trackName"
        :track-type="'annotation'"
        :index="'annotated-regions'"
        :query-string-maker="queryStringMaker"
        :translator="intervalsForIGV"
        :data-loaded="dataLoaded"
        :data-resolve="dataResolve"
        :data-error="dataError"
    ></igv-track>
</template>
<script>
import Vue from "vue";
import IGVTrack from "./IGVTrack"
export default Vue.component("igv-intervals-track", {
    components: {
        IGVTrack,
    },
    props: {
        annotations: {
            type: Array,
            required: false
        },
        method: {
            type: String,
            required: false
        },
        colorScheme: {
            type: Function,
            required: false
        },
        dataLoaded: {
            type: Function,
        },
        dataError: {
            type: Function,
        },
        dataResolve: {
            type: Function,
        }
    },
    computed: {
        trackName() {
            return `${this.annotations[0]}${
                !!this.method ? " " + this.method : ""
            }`;
        },
        filter() {
            return this.$parent.filter;
        },
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
                    .filter(interval => {
                        let k = `${interval.tissueId ||
                            "NA"}_${interval.method || "NA"}_${
                            interval.annotation
                        }`;

                        // TODO: Pick out of the filter only those predicates that matter to the object
                        let filterP =
                            !this.filter.pValue ||
                            this.$parent.scoring[k].minP <= this.filter.pValue;
                        let filterFold =
                            !this.filter.fold ||
                            this.$parent.scoring[k].maxFold >= this.filter.fold;
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
