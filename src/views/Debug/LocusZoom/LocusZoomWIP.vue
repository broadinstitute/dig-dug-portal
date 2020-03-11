<template>
    <div v-on:updateplot="this.plot" id="locuszoom"></div>
</template>

<script>
import Vue from "vue";
import LocusZoom from "locuszoom";
import lzDataSources from "../../../utils/lzDataSources";
import {sortPanels} from "../utils/lzUtils";
import {BIO_INDEX_TO_LZ, LZ_TYPE} from "../utils/lzConstants";
import {BioIndexLZSource} from "../utils/lzReader";

export default Vue.component("locuszoom-wip", {
    props: [
        "store", "modules",
        ...Object.keys(LZ_TYPE),
        "panels",

        // TODO can these be eliminated?
        "chrom",
        "start",
        "end"
    ],
    mounted() {

        let panelOptions = {
            //unnamespaced: true,
            proportional_height: 1,
            dashboard: null
        };
        let panels = sortPanels(this.panels).map(p => {
            return LocusZoom.Layouts.get("panel", p, {...panelOptions})
        });

        this.layout = {
            responsive_resize: "both",
            panels,
            state: {
                chr: this.chrom,
                start: this.start,
                end: this.end
            }
        };

        this.plot();

    },
    methods: {
        plot() {

            this.dataSources = new LocusZoom.DataSources();

            let lzDataSourceList = Object.keys(lzDataSources.defaultSource);
            lzDataSourceList
                .map(dataSourceType => this.dataSources.add(dataSourceType, this[dataSourceType] || lzDataSources.defaultSource[dataSourceType]))

            // initialize custom locuszoom datasources based on page-scoped modules
            for (let i = 0; i < this.modules.length; i++) {
                const module = this.modules[i];
                this.dataSources.add(BIO_INDEX_TO_LZ[module], new BioIndexLZSource({
                    store: this.store,
                    module: module,
                }));
            }

            this.lzplot = LocusZoom.populate(
                "#locuszoom",
                this.dataSources,
                this.layout
            );

        }
    }
});
</script>
