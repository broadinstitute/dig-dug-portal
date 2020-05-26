<template>
    <div>
        <pre>Grid xs: {{ xs }}, sm: {{ sm }}</pre>
        <pre>Parent: xs {{ $parent.xs }}, sm: {{ $parent.sm }}</pre>
    </div>
</template>
<script>
import igv from "igv";
import { makeBioIndexIGVTrack, makeBioIndexIGVTrackWithReader } from "@/utils/igvUtils"

import Vue from "vue";

export default Vue.component('igv-track', {
  props: ['xs', 'sm'],
  created() {
    console.log('grid created')



    this.$parent.igvBrowser.loadTrack(
        makeBioIndexIGVTrackWithReader({ store: this.$store, module, track, translator })
)
  },
  mounted() {
    console.log('grid mounted')
  },
  updated() {
    console.log('grid updated')
  },
  destroyed() {
    console.log('grid destroyed')
    this.$parent.igvBrowser.removeTrackByName('HG02450'+`_${this.xs}`);
  },
})


</script>
