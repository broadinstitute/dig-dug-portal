/* Standalone Vue 2.7 implementation of the reviewed BIRDS dashboard. */

Vue.component('modelgraph', {
  template: window.BirdModelTemplate,
  props: { method: { type: String, required: true } },
  data() { return { activeHover: null }; },
  mounted() { this.applyFocus(); },
  watch: { method() { this.$nextTick(this.applyFocus); } },
  methods: {
    applyFocus() {
      const viz = this.$el;
      const method = this.method;
      const sourceMethods = {
        associations: ['falcon', 'pigean', 'eaggl'],
        annotations: ['falcon', 'pigean', 'eaggl'],
        geneSets: ['pigean', 'eaggl']
      };
      viz.classList.toggle('mechanisms-dimmed', method === 'falcon' || method === 'pigean');
      viz.querySelectorAll('.dataSource').forEach(source => {
        const active = method === 'all' || sourceMethods[source.dataset.source].includes(method);
        source.classList.toggle('focus-dim', !active);
      });
      viz.querySelectorAll('.node').forEach(node => {
        const active = method === 'all' || (node.dataset.methods || '').split(/\s+/).includes(method);
        node.classList.toggle('focus-dim', !active);
        node.classList.toggle('focus-node', method !== 'all' && active);
      });
      viz.querySelectorAll('.edge').forEach(edge => {
        const active = method === 'all' || edge.dataset.method === method ||
          (edge.dataset.methods || '').split(/\s+/).includes(method);
        edge.classList.toggle('focus-dim', !active);
        edge.classList.toggle('focus-edge', method !== 'all' && active);
      });
    },
    onModelOver(event) {
      const node = event.target.closest('.node');
      if (!node || !this.$el.contains(node) || node.contains(event.relatedTarget)) return;
      this.activeHover = node;
      this.$emit('show-tip', { text: node.dataset.hover || node.dataset.title || '', event });
    },
    onModelOut(event) {
      if (!this.activeHover || this.activeHover.contains(event.relatedTarget)) return;
      this.activeHover = null;
      this.$emit('hide-tip');
    },
    onModelMove(event) {
      if (this.activeHover) this.$emit('move-tip', event);
    }
  }
});

function panelMarkup(method) {
  const panel = document.createElement('div');
  panel.innerHTML = window.BirdPanelHtml[method];
  return panel;
}

Vue.component('method-heading', {
  props: { method: { type: String, required: true } },
  computed: {
    identity() { return panelMarkup(this.method).querySelector('.methodIdentity').outerHTML; },
    title() { return panelMarkup(this.method).querySelector('.detailTitle').outerHTML; }
  },
  template: `
    <div class="methodHeading">
      <div class="methodHeaderRow">
        <div class="methodIdentitySlot" v-html="identity"></div>
        <p class="manuscriptNotice">Manuscript in preparation. Stay tuned!</p>
      </div>
      <div v-html="title"></div>
    </div>`
});

Vue.component('method-panel', {
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
  template: `
    <aside class="side" aria-live="polite">
      <div v-if="method === 'all'" id="detailPanel" v-html="wholePanel"></div>
      <div v-else id="detailPanel">
        <method-heading :method="method"></method-heading>
        <div class="methodPanelBody" v-html="methodBody"></div>
      </div>
    </aside>`
});

Vue.component('validation-gallery', {
  props: { method: { type: String, required: true } },
  computed: {
    config() { return window.BirdValidationData[this.method]; },
    title() { return this.config.name + ' validation'; }
  },
  template: `
    <div id="validationView" class="validationView" aria-live="polite">
      <method-heading :method="method"></method-heading>
      <div class="panelSection validationSection">
        <h3>5. Validation</h3>
        <div class="validationGallery" role="group" :aria-label="title + ' figures'">
          <section v-for="figure in config.figures" :key="figure.src" class="validationFigurePanel">
            <h3 class="validationFigureHeading">{{ figure.heading }}</h3>
            <div class="validationFigureStage"><img :src="figure.src" :alt="figure.alt"></div>
            <div class="validationDescription"><p>{{ figure.description }}</p></div>
          </section>
        </div>
      </div>
    </div>`
});

Vue.component('birds-dashboard', {
  data() {
    return {
      method: 'all', detailTab: 'overview',
      tooltip: { text: '', left: '0px', top: '0px', visible: false }
    };
  },
  computed: {
    graphLegend() {
      const legend = [...panelMarkup('all').querySelectorAll('.panelSection')]
        .find(section => section.querySelector('h3').textContent === 'Legend')
        .querySelector('.legend');
      const factor = legend.querySelector('.swatch.mechanism').closest('.leg');
      const greenArrow = legend.querySelector('.swatch.membership').closest('.leg');
      legend.insertBefore(greenArrow, factor);
      return legend.outerHTML;
    }
  },
  mounted() {
    const initial = location.hash.slice(1);
    this.focus(window.BirdPanelHtml[initial] ? initial : 'all');
    window.addEventListener('keydown', this.onShortcut);
  },
  beforeDestroy() { window.removeEventListener('keydown', this.onShortcut); },
  methods: {
    focus(method) {
      if (!window.BirdPanelHtml[method]) return;
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
  },
  template: `
    <div class="page">
      <div class="header">
        <h1>From genetic associations to mechanisms: A birds-eye's view</h1>
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
      <div class="frame">
        <div class="canvasWrap" ref="canvasWrap">
          <div id="tooltip" class="tip" :style="{ opacity: tooltip.visible ? 1 : 0, left: tooltip.left, top: tooltip.top }"><strong>{{ tooltip.text }}</strong></div>
          <modelgraph :method="method"
            @show-tip="showTip" @hide-tip="tooltip.visible = false" @move-tip="moveTip"></modelgraph>
          <div class="graphLegend" aria-label="Graph legend">
            <strong>Legend</strong>
            <div v-html="graphLegend"></div>
          </div>
        </div>
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
      <div class="footerNote">Local dashboard — no internet connection or external library required.</div>
    </div>`
});

new Vue({ el: '#app' });
