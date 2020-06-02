<template>
    <div>
        <div id="lz"></div>
    </div>
</template>
<script>
import Vue from "vue";

import LocusZoom from "locuszoom";
import LZEvents from "@/components/lz/LocusZoomEvents"
import LZDefaultDataSources from "@/utils/lz/lzDataSources"



export default Vue.component('locuszoom', {
    props: [
        'chr', 'start', 'end',
        'resolveHandler', 'finishHandler', 'errHandler'
  ],

  data() {
      return {
          lz: null,
      }
  },

  mounted() {
    let dataSources = new LocusZoom.DataSources();
    dataSources.add("gene", ["GeneLZ", {
        url:
            'https://portaldev.sph.umich.edu/api/v1/annotation/genes/',
        params: {
            build: 'GRCh37',
        }
    }]);
    dataSources.add("constraint", ["GeneConstraintLZ",
        {
            url: 'http://gnomad.broadinstitute.org/api',
            params: {
                build: 'GRCh37',
            }
        }]);

    // Define a reusable layout, and then retrieve it so that the namespaces get filled in
    const BASE_PANEL_OPTIONS = {
        proportional_height: 1,
        dashboard: {
            components: [
                {
                    type: "resize_to_data",
                    position: "right"
                },
                {
                    type: "region_scale",
                    position: "left"
                }
            ]
        }
    }

    const PANEL_OPTIONS = {
        'association': { min_height: 240, height: 240 },
        'genes': { min_height: 240, height: 240 },
    };

    let panels = ['genes'].map(p => LocusZoom.Layouts.get("panel", p, {
        ...BASE_PANEL_OPTIONS,
        ...PANEL_OPTIONS[p]
        // TODO: override/extend defaults here...
    }))
    this.lzplot = LocusZoom.populate("#lz", dataSources, {
        responsive_resize: "width_only",
        panels: panels,
        state: {
            chr: this.chr,
            start: this.start,
            end: this.end,
        }
    });

  },
  methods: {
    createEventHandlers(browser) {

        LZEvents.$on(LZ_BROWSER_FORCE_REFRESH, () => {
            console.log('force refresh')
        })

        LZEvents.$on(LZ_ADD_PANEL, panelConfiguration => {
            console.log('add panel')
        });

        LZEvents.$on(LZ_REMOVE_PANEL, panelName => {
            console.log('remove panel')
        });

        // default handlers for tracks completing their data
        // TODO: this is the wierdest part of the application right now. It works out as long as we only have one instance of IGV per page.
        LZEvents.$on(LZ_BIOINDEX_QUERY_RESOLVE, json => {
            if (!!this.resolveHandler) {
                this.resolveHandler(response);
            } else {
                // igvResolve(json);
            }
        })
        LZEvents.$on(LZ_BIOINDEX_QUERY_ERROR, json => {
            if (!!this.errHandler) {
                this.errHandler(response);
            } else {
            }
        })
        LZEvents.$on(LZ_BIOINDEX_QUERY_FINISH, response => {
            if (!!this.finishHandler) {
                this.finishHandler(response);
            } else {
            }
        });


      },

    addLZPanel: function(PanelComponentType, panelConfig) {
          if (this.lz != null) {

              let LZPanelConstructor = Vue.extend(PanelComponentType);
              let vueContainer = document.createElement('div');

              this.$el.appendChild(vueContainer)

              const trackComponentInstance = new LZPanelConstructor({
                  propsData: trackConfig.data
              }).$mount(vueContainer);

          }
      },

  },
  watch: {

  }
})
</script>
