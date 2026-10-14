<template>
  <div class="methodHeading">
      <div class="methodHeaderRow">
        <div class="methodIdentitySlot" v-html="identity"></div>
        <p class="manuscriptNotice">Manuscript in preparation. Stay tuned!</p>
      </div>
      <div v-html="title"></div>
    </div>
</template>
<script>
import Vue from "vue";
import BirdPanelHtml from "../content/panels.js";

export default Vue.component("method-heading", {
  props: { method: { type: String, required: true } },
  computed: {
    identity() { return panelMarkup(this.method).querySelector('.methodIdentity').outerHTML; },
    title() { return panelMarkup(this.method).querySelector('.detailTitle').outerHTML; }
  },
  methods: {
    panelMarkup(method) {
        const panel = document.createElement('div');
        panel.innerHTML = BirdPanelHtml[method];
        return panel;
    }
  }
});
</script>

