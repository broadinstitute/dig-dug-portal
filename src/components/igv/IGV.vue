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
      })
  },
  destroyed() {
      console.log('igv destroyed')
  },
  watch: {

  }
})
</script>
