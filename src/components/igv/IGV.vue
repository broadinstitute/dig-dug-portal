<template>
    <div>
        <!--
        <div class="igv-zooms-wrapper">
            Zoom:
            <button style="z-index:10000" @click="zoomIn" class="igv-zoom">+</button>&nbsp;
            <button style="z-index:10000" @click="zoomOut" class="igv-zoom">—</button>
        </div>
        -->
        <div id="igv-div"></div>
        <slot v-if="igvBrowser" />
    </div>
</template>
<script>
import Vue from "vue";
import lodash from "lodash";

import igv from "igv";
import IGVEvents, {
    IGV_BROWSER_FORCE_REFRESH,
    IGV_ADD_TRACK,
    IGV_REMOVE_TRACK,
    IGV_CHILD_DESTROY_TRACK,
    IGV_BIOINDEX_QUERY_RESOLVE,
    IGV_BIOINDEX_QUERY_ERROR,
    IGV_BIOINDEX_QUERY_FINISH,
    IGV_ZOOM_IN,
    IGV_ZOOM_OUT
} from "@/components/igv/IGVEvents";

import {
    igvError
    // igvResolve,
    // igvFinish
} from "@/utils/igvUtils";
import IGVAssociationsTrack from "@/components/igv/tracks/IGVAssociationsTrack";

import * as _ from "lodash";

export default Vue.component("igv", {
    props: [
        // configuring initial coordinates and coordinate changes
        "chr",
        "start",
        "end",
        // handlers for network requests
        "resolveHandler",
        "finishHandler",
        "errHandler",
        // handlers on global IGV behavior
        "popupHandler",
        "regionHandler",
        // filters
        "pValue",
        "beta"
    ],

    data() {
        return {
            igvBrowser: null,
            currentChr: this.chr,
            currentStart: this.start,
            currentEnd: this.end
        };
    },

    mounted() {
        const options = {
            genome: "hg19",
            visibilityWindow: 1000,
            showNavigation: false,
            locus: `chr${this.chr}:${this.start}-${this.end}`
        };

        const div = document.getElementById("igv-div");

        igv.createBrowser(div, options).then(browser => {
            igv.browser = browser;
            this.igvBrowser = igv.browser;
            this.createEventHandlers(this.igvBrowser);
        });
    },
    methods: {
        createEventHandlers(browser) {
            IGVEvents.$on(IGV_ADD_TRACK, trackConfiguration => {
                browser.loadTrack(trackConfiguration);
            });

            IGVEvents.$on(IGV_REMOVE_TRACK, trackName => {
                browser.removeTrackByName(trackName);
            });

            // TODO
            IGVEvents.$on(IGV_BROWSER_FORCE_REFRESH, () => {
                console.log("forcing igv refresh");
                // just go to the place we already are at
                browser.search(
                    `chr${this.currentChr}:${this.currentStart}-${this.currentEnd}`
                );
            });

            IGVEvents.$on(IGV_ZOOM_IN, () => {
                browser.zoomIn();
            });

            IGVEvents.$on(IGV_ZOOM_OUT, () => {
                browser.zoomOut();
            });

            // default handlers for tracks completing their data
            // TODO: this is the wierdest part of the application right now. It works out as long as we only have one instance of IGV per page.
            IGVEvents.$on(IGV_BIOINDEX_QUERY_RESOLVE, json => {
                if (!!this.resolveHandler) {
                    this.resolveHandler(response);
                } else {
                    // igvResolve(json);
                }
            });
            IGVEvents.$on(IGV_BIOINDEX_QUERY_ERROR, json => {
                if (!!this.errHandler) {
                    this.errHandler(response);
                } else {
                    igvError(json);
                }
            });
            IGVEvents.$on(IGV_BIOINDEX_QUERY_FINISH, response => {
                if (!!this.finishHandler) {
                    this.finishHandler(response);
                } else {
                    // igvFinish(json);
                }
            });

            // 'trackremoved' is an igv.js event
            // Since it can execute independently of the track component being destroyed, we have to
            // either emit or re-emit the destruction signal to ensure 1-1 correspondence between the Vue component and the igvBrowser track.
            // In the worst case, where the track is removed but there is no corresponding Vue component,
            // nothing catches the IGV_CHILD_DESTROY_TRACK event and so there is no side-effect.
            // This is mediated by the track name and Vue component internal name being the same.
            browser.on("trackremoved", track => {
                IGVEvents.$emit(IGV_CHILD_DESTROY_TRACK, track);
            });

            // browser.on('trackclick', (track, popupData) => {
            //     if (!!this.popupHandler) {
            //         this.popupHandler(track, popupData);
            //     } else {
            //         popupData.forEach(nameValuePair => {
            //             if (!!nameValuePair.name) {
            //                 if (!!nameValuePair.value) {
            //                     // EITHER:
            //                     // Build popup
            //                     // OR
            //                     // Run popup handler
            //                 }
            //             }
            //         });
            //     }
            //     return false;
            // });

            browser.on(
                "locuschange",
                _.debounce(locus => {
                    if (!!this.regionHandler) {
                        this.regionHandler(locus);
                    } else {
                        //console.log(locus);
                    }
                    this.currentChr = locus.chr.charAt(3);
                    this.currentStart = locus.start.replace(/,/g, "");
                    this.currentEnd = locus.end.replace(/,/g, "");
                }, 300)
            );
        },

        addIGVTrack: function(IGVTrackComponentType, trackConfig) {
            if (this.igvBrowser != null) {
                let IGVTrackConstructor = Vue.extend(IGVTrackComponentType);
                let vueContainer = document.createElement("div");

                this.$el.appendChild(vueContainer);

                const trackComponentInstance = new IGVTrackConstructor({
                    propsData: trackConfig.data,
                    parent: this // important! creating new instances doesn't give you the parent by default
                }).$mount(vueContainer);
            }
        },

        zoomIn() {
            return IGVEvents.$emit(IGV_ZOOM_IN);
        },

        zoomOut() {
            return IGVEvents.$emit(IGV_ZOOM_OUT);
        },

        updateViews() {
            let igvBrowser = this.igvBrowser;

            lodash.debounce(function() {
                igvBrowser.trackViews.forEach(v =>
                    v.track.trackView.viewports.forEach(v => (v.tile = null))
                );
                igvBrowser.updateViews(undefined, undefined, true);
            }, 300)();
        }
    },
    watch: {
        pValue(newP) {
            this.updateViews();
        },
        beta(newB) {
            this.updateViews();
        }
    }
});
</script>
