<template>
    <div>
        <pre>Grid xs: {{ xs }}, sm: {{ sm }}</pre>
        <pre>Parent: xs {{ $parent.xs }}, sm: {{ $parent.sm }}</pre>
    </div>
</template>
<script>
import igv from "igv";
import Vue from "vue";

export default Vue.component('grid', {
  props: ['xs', 'sm'],
  created() {
    console.log('grid created')
    this.$parent.igvBrowser.loadTrack({
        name: 'HG02450'+`_${this.xs}`,
        url: 'http://data.broadinstitute.org/igvdata/1KG/b37/data/HG02450/alignment/HG02450.mapped.ILLUMINA.bwa.ACB.low_coverage.20120522.bam',
    })
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
