<template>
    <div v-on:updateplot="this.plot" id="locuszoom"></div>
</template>

<script>
import Vue from "vue";
import LocusZoom from "locuszoom";
import lzDataSources from "@/utils/lz/lzDataSources";

import {BioIndexLZSourceJIT} from "@/utils/lz/lzReader";
import {BIO_INDEX_TO_LZ, LZ_TYPE} from "@/utils/lz/lzSchemas";
import {sortPanels} from "../utils/lz/lzUtils";

export default Vue.component("locuszoom", {
    props: [
        "panels",
        "modules",
        "chr",
        "start",
        "end",
    ],
    mounted() {
        let panelOptions = {
            //unnamespaced: true,
            proportional_height: 1,
            dashboard: null
        };
        let panels = sortPanels(this.panels).map(p =>
            LocusZoom.Layouts.get("panel", p, { ...panelOptions })
        );

        this.layout = {
            responsive_resize: "both",
            panels,
            state: {
                chr: this.chr,
                start: this.start,
                end: this.end
            }
        };
        this.plot();
    },
    methods: {
        plot() {
            this.dataSources = new LocusZoom.DataSources();
            this.modules.forEach(module => {
                this.dataSources.add(BIO_INDEX_TO_LZ[module], new BioIndexLZSourceJIT({
                    store: this.$store,
                    module: module,
                }));
            });

            Object.values(LZ_TYPE).filter(dataType => !this.modules.map(m => BIO_INDEX_TO_LZ[m]).includes(dataType))
                .forEach(dataType => {
                    if (this[dataType]) {
                        this.dataSources.add(dataType, this[dataType]);
                    } else {
                        this.dataSources.add(dataType, lzDataSources.defaultSource[dataType]);
                    }
                });

            this.lzplot = LocusZoom.populate(
                "#locuszoom",
                this.dataSources,
                this.layout
            );
        },
        updateLocus(chr, start, end) {
            this.lzplot.applyState({ chr, start, end });
        },
    }
});
</script>
