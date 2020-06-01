<template>
    <div>
        <div id="igv-div"></div>
        <slot v-if="igvBrowser"/>
    </div>
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
} from "@/components/igv/IGVEvents";
import {
    igvError,
    // igvResolve,
    // igvFinish
} from "@/utils/igvUtils";
import IGVAssociationsTrack from "@/components/igv/tracks/IGVAssociationsTrack";

export default Vue.component('igv', {
  props: [
        'chr', 'start', 'end',
        'resolveHandler', 'finishHandler', 'errHandler'
  ],

  data() {
      return {
          igvBrowser: null,
      }
  },

  mounted() {

      const options = {
          genome: "hg19",
          visibilityWindow: 10000,
          showNavigation: false,
          locus: `chr${this.chr}:${this.start}-${this.end}`,
      };

      const div = document.getElementById("igv-div");

    igv.createBrowser(div, options).then(browser => {
        igv.browser = browser;
        this.igvBrowser = igv.browser;
        this.createEventHandlers(this.igvBrowser);
      })

  },
  methods: {
      createEventHandlers(browser) {

        IGVEvents.$on(IGV_BROWSER_FORCE_REFRESH, () => {
            console.log('force update/refresh for igv')
            // just go to the place we already are at
            // browser.search(`chr${this.chr}:${this.start}-${this.end}`);
            browser.updateViews();
        })

        IGVEvents.$on(IGV_ADD_TRACK, trackConfiguration => {
            browser.loadTrack(trackConfiguration);
        });

        IGVEvents.$on(IGV_REMOVE_TRACK, trackName => {
            browser.removeTrackByName(trackName);
        });

        // default handlers for tracks completing their data
        // TODO: this is the wierdest part of the application right now. It works out as long as we only have one instance of IGV per page.
        IGVEvents.$on(IGV_BIOINDEX_QUERY_RESOLVE, json => {
            if (!!this.resolveHandler) {
                this.resolveHandler(response);
            } else {
                // igvResolve(json);
            }
        })
        IGVEvents.$on(IGV_BIOINDEX_QUERY_ERROR, json => {
            if (!!this.errHandler) {
                this.errHandler(response);
            } else {
                igvError(json);
            }
        })
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
        browser.on('trackremoved', track => {
            console.log('removed track', track);
            IGVEvents.$emit(IGV_CHILD_DESTROY_TRACK, track)
        });

      },

    addIGVTrack: function(IGVTrackComponentType, trackConfig) {
          if (this.igvBrowser != null) {

              let IGVTrackConstructor = Vue.extend(IGVTrackComponentType);
              let vueContainer = document.createElement('div');

              this.$el.appendChild(vueContainer)

              const trackComponentInstance = new IGVTrackConstructor({
                  propsData: trackConfig.data
              }).$mount(vueContainer);

          }
      },

  },
  watch: {

  }
})
</script>
