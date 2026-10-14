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

export default Vue.component("method-panel", {
  props: { method: String },
  computed: {
    wholePanel() {
      const panel = panelMarkup('all');
      const legend = [...panel.querySelectorAll('.panelSection')]
        .find(section => section.querySelector('h3').textContent === 'Legend');
      legend.remove();
      return panel.innerHTML;
    },
    methodBody() {
      return [...panelMarkup(this.method).querySelectorAll('.panelSection')]
        .map(section => section.outerHTML).join('');
    }
  },
});
</script>

