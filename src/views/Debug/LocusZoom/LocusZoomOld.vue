<template>
    <div v-on:updateplot="this.plot" id="locuszoom"></div>
</template>

<script>
import Vue from "vue";
import LocusZoom from "locuszoom";
import lzDataSources from "../../../utils/lzDataSources";

export default Vue.component("locuszoom-old", {
    props: [
        ...Object.keys(lzDataSources.defaultSource),
        "panels",
        "chrom",
        "start",
        "end"
    ],
    data() {
        return {};
    },
    mounted() {
        let panelOptions = {
            //unnamespaced: true,
            proportional_height: 1,
            dashboard: null
        };
        let panels = this.panels.map(p =>
            LocusZoom.Layouts.get("panel", p, { ...panelOptions })
        );

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
                .map(dataSource => this.dataSources.add(dataSource, this[dataSource] || lzDataSources.defaultSource[dataSource]))

            this.lzplot = LocusZoom.populate(
                "#locuszoom",
                this.dataSources,
                this.layout
            );

        },
        updateVariants(assocData) {
            this.assoc[1].data = assocData;
        }
    }
});
</script>
