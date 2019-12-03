<template>
    <div v-on:updateplot="this.plot" id="locuszoom" data-region="10:114550452-115067678"></div>
</template>

<script>
import Vue from "vue";
import LocusZoom from "locuszoom";
//import LocusZoom from "../../node_modules/locuszoom/dist/locuszoom.app";

export default Vue.component("locuszoom", {
    props: ["gene", "recomb", "phewas", "constraint", "ld", "assoc", "panels"],
    data() {
        return {};
    },
    mounted() {
        this.layout = {
            width: 100,
            height: 100,
            responsive_resize: "both",
            panels: this.panels.map(p => LocusZoom.Layouts.get("panel", p))
        };

        this.plot();
    },
    methods: {
        plot() {
            this.dataSources = new LocusZoom.DataSources();

            if (this.assoc) {
                this.dataSources.add("assoc", this.assoc);
            }
            // if (this.constraint) {
            //     this.dataSources.add("constraint", this.constraint);
            // }
            if (this.ld) {
                this.dataSources.add("ld", this.ld);
            }
            if (this.recomb) {
                this.dataSources.add("recomb", this.recomb);
            }
            if (this.gene) {
                this.dataSources.add("gene", this.gene);
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
