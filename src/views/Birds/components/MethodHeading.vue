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
import BIRD_PANEL_HTML from "../content/panels.js";

export default Vue.component("method-heading", {
  props: { method: { type: String, required: true } },
  computed: {
    identity() { return this.panelMarkup(this.method).querySelector('.methodIdentity').outerHTML; },
    title() { return this.panelMarkup(this.method).querySelector('.detailTitle').outerHTML; }
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
