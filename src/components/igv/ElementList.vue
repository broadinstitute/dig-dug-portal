<template>
    <div>
        <pre>ElementList xs: {{ xs }}, sm: {{ sm }}</pre>
        <slot v-if="igvBrowser" :xs="xs" :sm="sm"/>
        <div id="igv-div"></div>
    </div>
</template>
<script>
import igv from "igv";
import Vue from "vue";
export default Vue.component('element-list', {
  props: ['xs', 'sm'],
  data() {
      return {
          hello: "hello",
          igvBrowser: null,
      }
  },
  created() {
      console.log('element-list created')
  },
  mounted() {
      console.log('element-list mounted')
      const options = {
          genome: "hg19",
      };
      const div = document.getElementById("igv-div");
      igv.createBrowser(div, options).then(browser => {
        this.igvBrowser = browser;
      })
  },
  destroyed() {
      console.log('element-list destroyed')
  },
})
</script>
