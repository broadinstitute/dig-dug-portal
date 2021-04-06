import Vue from "vue";

import Template from "./Template.vue";
import store from "./store.js";
import LZPlot from "@/components/lz/LZPlot"
import LocusZoom from "locuszoom"
import LocusZoomPlot from "@/components/lz/LocusZoom"

Vue.config.productionTip = false;

new Vue({
    store,
    components: {
        LZPlot,
        LocusZoom,

    },

    async created() {
    },

    render(createElement) {
        return createElement(Template);
    },

    data() {
        return {
            diseases: [],
        };
    },
    computed: {
        base_phewas_layout() {
            const layer = LocusZoom.Layouts.get('data_layer', 'phewas_pvalues', {
                unnamespaced: true,
                y_axis: { min_extent: [0, 10] },
            });
            const panel = LocusZoom.Layouts.get('panel', 'phewas', {
                unnamespaced: true,
                height: 300,
                min_height: 300,
                data_layers: [layer],
            });
            return LocusZoom.Layouts.get(
                'plot', 'standard_phewas',
                {
                    panels: [panel],
                    responsive_resize: true,
                    state: { variant: '', genome_build: 'GRCh37' },
                },
            );
        },
        base_phewas_sources() {
            return [
                ['phewas', ['PheWASLZ', { url: 'https://portaldev.sph.umich.edu/ukbb/v1/statistic/phewas/' }]],
            ];
        },
    },
    methods: {
        receivePlot() {
            // this.has_plot = true;
            // // Use listeners to warn when no variant data is available
            // this.$refs.phewas_plot.callPlot((plot) => {
            //     plot.subscribeToData(['phewas:id'], (data, plot) => {
            //         if (!data || !data.length) {
            //             plot.curtain.show('There is no PheWAS data available for the requested variant. Please try another variant.');
            //         }
            //     });
            // });
            // // Since the plot already has data, ensure the event fires immediately.
            // this.$refs.phewas_plot.callPlot((plot) => plot.emit('data_rendered'));
        },
    },
    watch: {
    }
}).$mount("#app");
