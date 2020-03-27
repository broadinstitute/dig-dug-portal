<template>
    <div v-on:updateplot="this.plot" id="locuszoom"></div>
</template>

<script>
import Vue from "vue";
import LocusZoom from "locuszoom";
import lzDataSources from "@/utils/lz/lzDataSources";

import {BioIndexLZSourceJIT} from "@/utils/lz/lzReader";
import {BIO_INDEX_TO_LZ, LZ_TYPE} from "@/utils/lz/lzConstants";

export default Vue.component("locuszoom", {
    props: [
        "panels",
        "modules",
        "phenotype",
    ],
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
                chr: this.$store.state.chr,
                start: this.$store.state.start,
                end: this.$store.state.end
            }
        };
        this.plot();
    },
    methods: {
        plot() {
            console.log('lz plot');
            this.dataSources = new LocusZoom.DataSources();

            const phenotype = this.phenotype.name;
            console.log(phenotype);
            this.modules.forEach(module => {
                this.dataSources.add(BIO_INDEX_TO_LZ[module], new BioIndexLZSourceJIT({
                    store: this.$store,
                    module: module,
                    queryMaker: { phenotype },
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
