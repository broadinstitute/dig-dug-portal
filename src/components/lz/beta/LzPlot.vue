  
<script>
import Vue from "vue"
import LocusZoom from 'locuszoom';
import { plotUpdatesUrl, plotWatchesUrl } from 'locuszoom/esm/ext/lz-dynamic-urls';
import { addPanels, stateUrlMapping } from '../beta/lz-helpers';
import "locuszoom/dist/locuszoom.css";

let uid = 0;
export default Vue.component('lz-plot',{
    name: 'LzPlot',
    props: {
        base_layout: { type: Object, default: () => ({}) },
        base_sources: { type: Array, default: () => [] },
        chr: { type: String, default: null },
        start: { type: Number, default: null },
        end: { type: Number, default: null },
        show_loading: { type: Boolean, default: false },
        dynamic_urls: { type: Boolean, default: false },
    },
    data() {
        return {
            onload: false
        }
    },
    computed: {
        region() {
            const { chr, start, end } = this;
            return { chr, start, end };
        },
    },
    watch: {
        region: {
            handler() {
                // WARNING: this component receives notifications of a value it changes, a design
                //   quirk that risks infinite update loops.
                //   Only apply new region information if it has changed
                const region = Object.assign({}, this.region);
                const diffs = Object.keys(region).reduce((acc, key) => {
                    const new_val = region[key];
                    if (new_val !== this.plot.state[key]) {
                        acc[key] = new_val;
                    }
                    return acc;
                }, {});
                if (Object.keys(diffs).length) {
                    this.plot.applyState(diffs);
                }
            },
            deep: true,
        },
    },
    beforeCreate() {
        uid += 1;
        this.dom_id = `lz-plot-${uid}`;
        this.plot_id = this.dom_id.replace(/-/g, '_');
        // This is important: plot must be assigned as a static property. If it were a field in
        //  `data`, vue would recursively wrap it as an observable, and Really Bad Things Happen.
        this.data_sources = null;
        this.plot = null;
        this.onload = false;
    },
    mounted() {
        this.createLZ(this.base_layout, this.base_sources);
    },
    beforeDestroy() {
        this.plot.destroy();
        delete this.plot;
        delete window[this.plot_id];
    },
    methods: {
        createLZ(base_layout, base_sources) {
            // The layout comes from properties assigned to a vue instance, which are automatically
            //   wrapped (deeply) with Vue observable getters/setters. This can confuse LocusZoom,
            //   so we will deep-copy to ensure this is just pure JS primitives
            const layout = JSON.parse(JSON.stringify(base_layout));
            const data_sources = new LocusZoom.DataSources();

            base_sources.forEach(([name, config]) => data_sources.add(name, config));
            console.log('create lz', layout, data_sources, base_sources)

            const plot = LocusZoom.populate(`#lz`, data_sources, {
                ...layout,
                state: {
                    ...this.region
                }
            });

            if (this.show_loading) {
                plot.layout.panels.forEach((panel) => plot.panels[panel.id].addBasicLoader());
            }
            this.plot = plot;
            this.data_sources = data_sources;
            window[this.plot_id] = plot;
            // IMPORTANT: never consume this value in a way that would wrap it as an observable
            //   (eg by assigning it to a field in `data`).
            this.connectListeners(plot);
            this.$emit('connected');
            this.onload=true
        },
        connectListeners(plot) {
            plot.on('any_lz_event', (eventData) => this.$emit(eventData.event_name, eventData));
            if (this.dynamic_urls) {
                plotUpdatesUrl(plot, stateUrlMapping);
                plotWatchesUrl(plot, stateUrlMapping);
            }
        },
        callPlot(callback) {
            return callback(this.plot);
        },
        callSources(callback) {
            return callback(this.data_sources);
        },
        addPanels(panel_options, source_options) {
            addPanels(this.plot, this.data_sources, panel_options, source_options);
        },
    },
});
</script>

<template>
  <div>
    <div
      :id="'lz'"
      class="lz-container-responsive">
        <slot v-if="onload"/>
    </div>
  </div>
</template>