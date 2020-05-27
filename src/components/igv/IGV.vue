<template>
    <div>
        <div id="igv-div"></div>
        <slot v-if="igvBrowser"/>
    </div>
</template>
<script>

import Vue from "vue";

import igv from "igv";
import IGVEvents, { IGV_ADD_TRACK, IGV_REMOVE_TRACK } from "@/components/igv/IGVEvents";
import IGVAssociationsTrack from "./tracks/IGVAssociationsTrack";

export default Vue.component('igv', {
  props: ['chr', 'start', 'end', "igvupdate"],
  data() {
      return {
          igvBrowser: null,
      }
  },
  created() {
      console.log('igv created')
  },
  mounted() {
      console.log('igv mounted')

      const options = {
          genome: "hg19",
          visibilityWindow: 10000,
          locus: `chr${this.chr}:${this.start}-${this.end}`,
      };
      const div = document.getElementById("igv-div");
      igv.createBrowser(div, options).then(browser => {
        igv.browser = browser;
        this.igvBrowser = igv.browser;
        this.createEventHandlers(this.igvBrowser);
      })

  },
  destroyed() {
      console.log('igv destroyed')
  },
  methods: {
      createEventHandlers(browser) {

        IGVEvents.$on(IGV_ADD_TRACK, trackConfiguration => {
            console.log('adding track', trackConfiguration);
            browser.loadTrack(trackConfiguration);
        });

        IGVEvents.$on(IGV_REMOVE_TRACK, trackName => {
            console.log('removing track', trackName);
            browser.removeTrackByName(trackName);
        });

        browser.on('trackremoved', event => {
            // TODO: check if the component corresponding to the track exists or not
                // TODO: give each component a ref corresponding to the name of the track (with e.g. the salt)
            // if it exists: then remove it (since the track itself was already removed)
            // if it doesn't exist: then do nothing, it should only be possible for the component to otherwise remove the track
            console.log('igv track removed', event)
        });

      },
      // TODO: addIGVTrack as dispatch? (Real Golang hours whatsup)
      addAssociationsTrack: function(trackConfig) {
          console.log('addAssociationsTrack');
          if (this.igvBrowser != null) {
              let IGVAssociationsTrackConstructor = Vue.extend(IGVAssociationsTrack);
              let vueContainer = document.createElement('div');
              this.$el.appendChild(vueContainer)
              const vm = new IGVAssociationsTrackConstructor({
                  propsData: {
                      phenotype: trackConfig.phenotype,
                  }
              }).$mount(vueContainer);
          }
      },
  },
  watch: {

  }
})
</script>
