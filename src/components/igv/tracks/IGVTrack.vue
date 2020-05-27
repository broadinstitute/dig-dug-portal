<template>
    <div>
        <pre>Track Feature: {{ feature }}</pre>
    </div>
</template>
<script>
import Vue from "vue";

import igv from "igv";
import { BioIndexReader } from "@/utils/igvUtils"

// WARNING: DEPRECATED! Removing export.
Vue.component('igv-track', {
  props: [
      'num',
      'index',
      'feature',
      'translator',
    ],
    data() {
        return {
            salt: Math.floor((Math.random() * 10000)).toString()
        }
    },
    created() {
        console.log('igv track created', 'igv browser:', this.$parent.igvBrowser)
        if (this.$parent.igvBrowser != null) {
            this.$parent.igvBrowser.loadTrack({
                    name: `${this.index}_${this.salt}`,
                    type: 'annotation',
                    reader: new BioIndexReader({
                        index: this.index,
                        feature: this.feature,
                        translator: this.translator,
                    })
            })
        }
  },
  mounted() {
    console.log('igv track mounted')
  },
  updated() {
    console.log('igv track updated')
  },
  destroyed() {
    console.log('igv track destroyed')
    this.$parent.igvBrowser.removeTrackByName(`${this.index}_${this.salt}`);
  },
})

</script>
