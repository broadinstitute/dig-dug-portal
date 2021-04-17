import Vue from "vue";

import Template from "./Template.vue";
import store from "./store.js";
import LzPlot from "@/components/lz/beta/LzPlot"
import LzAssociations from "@/components/lz/beta/LzAssociationsPanel"

Vue.config.productionTip = false;
const HUMAN_GENOME_BUILD_VERSION = "GRCh37";

new Vue({
    store,
    components: {
        LzPlot,
        LzAssociations
    },

    async created() {
    },

    render(createElement) {
        return createElement(Template);
    },

    data() {
        return {
            geneLayout: {
                responsive_resize: "width",
                max_region_scale: 500000, // without this, zooming out will fail (circa LocusZoom v0.13.1)
                // state: {
                //     chr: this.chr,
                //     start: this.start,
                //     end: this.end,
                // },
                // toolbar: {
                //     // top-to-bottom in the array => right-to-left on the layout
                //     widgets,
                // },
            },
            // LocusZoom.Layouts.get("panel", "genes", {
            //     height: 200,
            //     min_height: 200,
            //     // bottom section
            //     y_index: 3,
            // }),
            dataSources: Object.entries({
                // "assoc": ["AssociationLZ", { url: "https://portaldev.sph.umich.edu/api/v1/statistic/single/", params: { source: 45, id_field: "variant" } }],
                catalog: [
                    "GwasCatalogLZ",
                    {
                        _enableCache: false,
                        url:
                            "https://portaldev.sph.umich.edu/api/v1/annotation/gwascatalog/results/?decompose=1&variant_format=colons",
                        params: {
                            build: HUMAN_GENOME_BUILD_VERSION,
                        },
                    },
                ],
                gene: [
                    "GeneLZ",
                    {
                        url: "https://portaldev.sph.umich.edu/api/v1/genes/",
                        params: {
                            build: HUMAN_GENOME_BUILD_VERSION,
                        },
                    },
                ],
                ld: [
                    "LDLZ2",
                    {
                        url: "https://portaldev.sph.umich.edu/ld/",
                        params: {
                            source: "1000G",
                            build: HUMAN_GENOME_BUILD_VERSION,
                            population: "ALL",
                        },
                    },
                ],
                recomb: [
                    "RecombLZ",
                    {
                        url:
                            "https://portaldev.sph.umich.edu/api/v1/annotation/recomb/results/",
                        params: {
                            build: HUMAN_GENOME_BUILD_VERSION,
                        },
                    },
                ],
                constraint: [
                    "GeneConstraintLZ",
                    {
                        url: "https://gnomad.broadinstitute.org/api",
                        params: {
                            build: HUMAN_GENOME_BUILD_VERSION,
                        },
                    },
                ],
            }),
        }
    },

    methods: {
    },

    computed: {
    },
    watch: {
    }
}).$mount("#app");
