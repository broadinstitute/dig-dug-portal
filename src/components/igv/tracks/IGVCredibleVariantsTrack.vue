<template>
    <igv-track
        :track-name="trackName"
        :track-type="'gwas'"
        :index="'credible-variants'"
        :query-string-maker="queryStringMaker"
        :translator="associationsForIGV"
        :data-loaded="dataLoaded"
        :data-resolve="dataResolve"
        :data-error="dataError"
        :track-options="{ posteriorProbability }"
    ></igv-track>
</template>
<script>
import Vue from "vue";
import IGVTrack from "./IGVTrack"
import { cloneDeep } from "lodash"

export default Vue.component('igv-credible-variants-track', {
    components: {
        IGVTrack,
    },
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
    methods: {
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
})

</script>
