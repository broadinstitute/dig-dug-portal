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
} from "@/components/igv/IGVEvents";
import { BioIndexReader } from "@/utils/igvUtils";
import * as _ from "lodash";

export default Vue.component("igv-track", {
    props: {
        index: {
            type: String,
            required: true,
        },
        trackType: {
            type: String,
            required: true,
        },
        trackName: {
            type: String,
            required: true,
        },
        queryStringMaker: {
            type: Function,
            required: true,
        },
        translator: {
            type: Function,
            required: true,
        },
        colorScheme: {
            type: Function,
        },
        dataLoaded: {
            type: Function,
        },
        dataError: {
            type: Function,
        },
        dataResolve: {
            type: Function,
        },
        trackOptions: {
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
        filter() {
            return this.$parent.filter;
        },
    },
    mounted() {
        IGVEvents.$emit(IGV_ADD_TRACK, this.buildTrack(
            this.trackName,
            this.queryStringMaker,
            this.translator,
            this.trackType,
            this.index,
            this.dataResolve,
            this.dataLoaded,
            this.dataError,
            this.trackOptions
        ));
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
        buildTrack: function(trackName, queryStringMaker, translator, trackType, index, dataResolve, dataLoaded, dataError, options={}) {
            // let self = this;
            return {
                name: trackName,
                type: trackType,
                reader: new BioIndexReader({
                    index: index,
                    queryString: queryStringMaker,
                    translator: translator,
                    queryHandlers: {
                        resolveHandler: json => !!dataResolve &&
                            dataResolve({
                                    track: trackName,
                                    data: json,
                                }),
                        errHandler: json => !!dataError &&
                            dataError({
                                track: trackName,
                                data: json,
                            }),
                        finishHandler: json => !!dataLoaded &&
                            dataLoaded({
                                track: trackName,
                                data: json,
                            }),
                    }
                }),
                height: 160,
                disableCache: true,
                ...options,
            }
        },
    },
});
</script>
