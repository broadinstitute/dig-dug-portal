<template>
    <div>
        <div class="igv-zooms-wrapper">
            Zoom:
            <button @click="zoomIn" class="igv-zoom">+</button>&nbsp;
            <button @click="zoomOut" class="igv-zoom">—</button>
        </div>

        <div id="igv-div"></div>
        <slot v-if="igvBrowser" />
    </div>
</template>
<script>
import Vue from "vue";
import lodash from "lodash";

import igv from "igv";
import IGVEvents, {
    IGV_ADD_TRACK,
    IGV_REMOVE_TRACK,
    IGV_CHILD_DESTROY_TRACK,
    IGV_LOCUSCHANGE
} from "@/components/igv/IGVEvents";

import IGVAssociationsTrack from "@/components/igv/tracks/IGVAssociationsTrack";
import IGVIntervalTrack from "@/components/igv/tracks/IGVIntervalTrack.vue";
import IGVCredibleVariantsTrack from "@/components/igv/tracks/IGVCredibleVariantsTrack.vue";

export default Vue.component("igv", {
    props: [
        // configuring initial coordinates and coordinate changes
        "chr",
        "start",
        "end",

        // filters
        "p-value",
        "fold",
        "scoring"
    ],

    data() {
        return {
            igvBrowser: null
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

    computed: {
        filter() {
            return {
                pValue: this.pValue,
                fold: this.fold
            };
        }
    },

    methods: {
        createEventHandlers(browser) {
            IGVEvents.$on(IGV_ADD_TRACK, trackConfiguration => {
                browser.loadTrack(trackConfiguration);
            });

            IGVEvents.$on(IGV_REMOVE_TRACK, trackName => {
                browser.removeTrackByName(trackName);
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

            browser.on(
                "locuschange",
                lodash.debounce(locus => {
                    IGVEvents.$emit(IGV_LOCUSCHANGE, locus);
                }, 300)
            );
        },

        addIGVTrack: function(IGVTrackComponentType, trackConfig) {
            if (this.igvBrowser != null) {
                let IGVTrackConstructor = Vue.extend(IGVTrackComponentType);

                const trackComponentInstance = new IGVTrackConstructor({
                    propsData: trackConfig,
                    parent: this // important! creating new instances doesn't give you the parent by default
                });

                let vueContainer = document.createElement("div");
                this.$el.appendChild(vueContainer);

                trackComponentInstance.$mount(vueContainer);
            }
        },

        addCredibleVariantsTrack(
            phenotype,
            credibleSetId,
            posteriorProbability,
            options = {}
        ) {
            this.addIGVTrack(IGVCredibleVariantsTrack, {
                phenotype: phenotype,
                credibleSetId: credibleSetId,
                posteriorProbability: posteriorProbability
            });
        },

        addIntervalsTrack(annotation, annotationMethod, options = {}) {
            this.addIGVTrack(IGVIntervalTrack, {
                annotations: [annotation],
                method: annotationMethod,
                ...options
            });
        },

        zoomIn() {
            return this.igvBrowser.zoomIn();
        },

        zoomOut() {
            return this.igvBrowser.zoomOut();
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
        filter() {
            this.updateViews();
        }
    }
});
</script>
