<template>
    <div v-on:updateplot="this.plot" id="locuszoom"></div>
</template>

<script>
import Vue from "vue";
import LocusZoom from "locuszoom";

export default Vue.component("locuszoom", {
    props: [
        "gene",
        "recomb",
        "phewas",
        "constraint",
        "ld",
        "assoc",
        "panels",
        "chrom",
        "start",
        "end",
        "intervals"
    ],
    data() {
        return {};
    },
    mounted() {
        let panelOptions = {
            //unnamespaced: true,
            proportional_height: 0.5,
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

            if (this.assoc) {
                this.dataSources.add("assoc", this.assoc);
            }
            if (this.constraint) {
                this.dataSources.add("constraint", this.constraint);
            }
            if (this.ld) {
                this.dataSources.add("ld", this.ld);
            }
            if (this.recomb) {
                this.dataSources.add("recomb", this.recomb);
            }
            if (this.gene) {
                this.dataSources.add("gene", this.gene);
            }
            if (this.intervals) {
                this.dataSources.add("intervals", this.intervals);
            }
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
