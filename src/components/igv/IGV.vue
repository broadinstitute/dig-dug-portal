<template>
    <div>
        <slot v-if="igvBrowser"/>
        <div id="igv-div"></div>
    </div>
</template>
<script>

import igv from "igv";
import Vue from "vue";
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
        this.igvBrowser.on('trackremoved', event => {
            // TODO: check if the component corresponding to the track exists or not
                // TODO: give each component a ref corresponding to the name of the track (with e.g. the salt)
            // if it exists: then remove it (since the track itself was already removed)
            // if it doesn't exist: then do nothing, it should only be possible for the component to otherwise remove the track
            console.log('igv track removed', event)
        })
      })

  },
  destroyed() {
      console.log('igv destroyed')
  },
  methods: {
      // TODO: addIGVTrack
  },
  watch: {

  }
})
</script>
