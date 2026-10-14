<template>
  <div>
    <img src="/images/birdimages/modelgraph.svg"/>
  </div>
</template>
<script>
import Vue from "vue";

export default Vue.component("modelgraph", {
  components: {
  },
  props: { method: { type: String, required: true } },
  data() { return { activeHover: null }; },
  mounted() { this.applyFocus(); },
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
  },
  watch: { method() { this.$nextTick(this.applyFocus); } },
});
</script>
<style>
@import url("/css/birdcss/revisions.css");
@import url("/css/birdcss/style.css");
</style>