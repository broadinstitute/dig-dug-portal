<template>

    <div class="page">
      <div class="header">
        <h1>From genetic associations to mechanisms: A bird's-eye view</h1>
        <div class="controls"><div class="statControls">
          <button class="btn" :class="{ active: method === 'all' }" data-method="all"
            type="button" @click="focus('all')">Whole model</button>
          <button class="btn methodTab" :class="{ active: method === 'falcon' }"
            data-method="falcon" type="button" @click="focus('falcon')">Direct genetic support<span class="btnSub">association signals → associated genes</span></button>
          <button class="btn methodTab" :class="{ active: method === 'pigean' }"
            data-method="pigean" type="button" @click="focus('pigean')">Indirect genetic support<span class="btnSub">associated genes + shared biology → relevant genes</span></button>
          <button class="btn methodTab" :class="{ active: method === 'eaggl' }"
            data-method="eaggl" type="button" @click="focus('eaggl')">Latent genetic factors<span class="btnSub">associated &amp; relevant genes → potential mechanisms</span></button>
        </div></div>
      </div>
      <div class="birdframe">
        <div class="canvasWrap" ref="canvasWrap">
          <div id="tooltip" class="tip" :style="{ opacity: tooltip.visible ? 1 : 0, left: tooltip.left, top: tooltip.top }"><strong>{{ tooltip.text }}</strong></div>
          <modelgraph :method="method"
            @show-tip="showTip" @hide-tip="tooltip.visible = false" @move-tip="moveTip"></modelgraph>
          <div class="graphLegend" aria-label="Graph legend">
            <strong>Legend</strong>
            <div v-html="graphLegend"></div>
          </div>
        </div>
        <div class="detail-section-wrapper">
            <section class="detailSection" aria-label="Method details">
          <div class="detailTabs" role="tablist" aria-label="Method detail view">
            <button id="overview-tab" class="detailTab" :class="{ active: detailTab === 'overview' }"
              type="button" role="tab" :aria-selected="detailTab === 'overview' ? 'true' : 'false'"
              aria-controls="overview-view" @click="showDetail('overview')">Overview</button>
            <button v-if="method !== 'all'" id="validation-tab" class="detailTab"
              :class="{ active: detailTab === 'validation' }" type="button" role="tab"
              :aria-selected="detailTab === 'validation' ? 'true' : 'false'"
              aria-controls="validation-view" @click="showDetail('validation')">Validation</button>
          </div>
          <div id="overview-view" role="tabpanel" aria-labelledby="overview-tab"
            v-show="detailTab === 'overview'"><method-panel :method="method"></method-panel></div>
          <div v-if="method !== 'all'" v-show="detailTab === 'validation'"
            id="validation-view" class="side" role="tabpanel" aria-labelledby="validation-tab">
            <validation-gallery :method="method"></validation-gallery>
          </div>
        </section>
        </div>
      </div>
      <div class="footerNote">Local dashboard — no internet connection or external library required.</div>
    </div>
</template>
<script>
import Vue from "vue";
import ModelGraph from "./ModelGraph.vue";
import ValidationGallery from "./ValidationGallery.vue";
import MethodPanel from "./MethodPanel.vue";
import BIRD_PANEL_HTML from "../content/panels.js";

export default Vue.component("birds-dashboard", {
    components: {
        ModelGraph,
        ValidationGallery,
        MethodPanel
    },
  data() {
    return {
      method: 'all', detailTab: 'overview',
      tooltip: { text: '', left: '0px', top: '0px', visible: false }
    };
  },
  computed: {
    graphLegend() {
      const legend = [...this.panelMarkup('all').querySelectorAll('.panelSection')]
        .find(section => section.querySelector('h3').textContent === 'Legend')
        .querySelector('.legend');
      const factor = legend.querySelector('.swatch.mechanism').closest('.leg');
      const greenArrow = legend.querySelector('.swatch.membership').closest('.leg');
      legend.insertBefore(greenArrow, factor);
      return legend.outerHTML;
    }
  },
  mounted() {
    console.log(typeof BIRD_PANEL_HTML);
    const initial = location.hash.slice(1);
    this.focus(BIRD_PANEL_HTML[initial] ? initial : 'all');
    window.addEventListener('keydown', this.onShortcut);
  },
  beforeDestroy() { window.removeEventListener('keydown', this.onShortcut); },
  methods: {
    focus(method) {
      if (!BIRD_PANEL_HTML[method]) return;
      this.method = method;
      if (method === 'all') this.detailTab = 'overview';
      this.tooltip.visible = false;
    },
    showDetail(tab) {
      if (tab === 'overview' || (tab === 'validation' && this.method !== 'all')) {
        this.detailTab = tab;
      }
    },
    onShortcut(event) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
      const target = event.target;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      const method = { '0': 'all', '1': 'falcon', '2': 'pigean', '3': 'eaggl' }[event.key];
      if (method) this.focus(method);
    },
    moveTip(event) {
      const rect = this.$refs.canvasWrap.getBoundingClientRect();
      this.tooltip.left = (event.clientX - rect.left) + 'px';
      this.tooltip.top = (event.clientY - rect.top) + 'px';
    },
    showTip(payload) {
      this.tooltip.text = payload.text;
      this.tooltip.visible = true;
      this.moveTip(payload.event);
    },
    panelMarkup(method) {
        const panel = document.createElement('div');
        panel.innerHTML = BIRD_PANEL_HTML[method];
        return panel;
    }
  },
});
</script>
<style>
@import url("/css/birdcss/revisions.css");
@import url("/css/birdcss/style.css");
.detail-section-wrapper {
    display: block !important;
}
.birdframe {
    margin-left: 25%;
    max-width: 50%;
}
</style>
