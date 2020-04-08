<template>
    <div v-on:updateplot="this.plot" id="locuszoom"></div>
</template>

<script>
import Vue from "vue";
import LocusZoom from "locuszoom";
import lzDataSources from "@/utils/lz/lzDataSources";

import {BioIndexLZSource} from "@/utils/lz/lzReader";
import {sortPanels, LZ_TYPE, BIO_INDEX_TO_LZ} from "@/utils/lz/lzUtils";

export default Vue.component("locuszoom", {
    props: [
        "panels",
        "modules",

        ...Object.values(LZ_TYPE),

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
            this.modules.forEach(moduleObj => {
                const { module, translator, layer } = moduleObj;
                console.log(moduleObj);
                this.dataSources.add(layer, new BioIndexLZSource({
                    store: this.$store,
                    module,
                    translator,
                }));
            });

            const configuredLzTypes = Object.keys(this.modules).flatMap(m => BIO_INDEX_TO_LZ[m]);
            Object.values(LZ_TYPE)
                .filter(lzType => !configuredLzTypes.includes(lzType))
                .forEach(dataType => {
                    if (this[dataType]) {
                        this.dataSources.add(dataType, this[dataType]);
                    } else if(lzDataSources.defaultSource[dataType]) {
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
