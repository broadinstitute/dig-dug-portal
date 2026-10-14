<template>
    <aside class="side" aria-live="polite">
      <div v-if="method === 'all'" id="detailPanel" v-html="wholePanel"></div>
      <div v-else id="detailPanel">
        <method-heading :method="method"></method-heading>
        <div class="methodPanelBody" v-html="methodBody"></div>
      </div>
    </aside>
</template>
<script>
import Vue from "vue";
import MethodHeading from "./MethodHeading.vue";
import BIRD_PANEL_HTML from "../content/panels.js";

export default Vue.component("method-panel", {
  components : {
    MethodHeading
  },
  props: { method: String },
  computed: {
    wholePanel() {
      const panel = this.panelMarkup('all');
      const legend = [...panel.querySelectorAll('.panelSection')]
        .find(section => section.querySelector('h3').textContent === 'Legend');
      legend.remove();
      return panel.innerHTML;
    },
    methodBody() {
      return [...this.panelMarkup(this.method).querySelectorAll('.panelSection')]
        .map(section => section.outerHTML).join('');
    },
  },
  methods: {
    panelMarkup(method) {
        const panel = document.createElement('div');
        panel.innerHTML = BIRD_PANEL_HTML[method];
        return panel;
    }
  }
});
</script>
<style>
@import url("/css/birdcss/revisions.css");
@import url("/css/birdcss/style.css");
</style>
