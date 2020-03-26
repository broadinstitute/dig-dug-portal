<template>
    <div v-on:updateplot="this.plot" id="locuszoom"></div>
</template>

<script>
import Vue from "vue";
import LocusZoom from "locuszoom";
import lzDataSources from "@/utils/lz/lzDataSources";

import {BioIndexLZSource, BioIndexLZSourceJIT} from "@/utils/lz/lzReader";
import {BIO_INDEX_TO_LZ} from "@/utils/lz/lzConstants";
import {BIO_INDEX_TYPE} from "@/utils/bioIndexUtils"

export default Vue.component("locuszoom", {
    props: [
        "gene",
        "recomb",
        "phewas",
        "constraint",
        "ld",
        "assoc",
        "intervals",

        "store",
        "panels",

        "phenotype",
        "chrom",
        "start",
        "end",
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

            if (this.assoc) {
                this.dataSources.add("assoc", this.assoc);
            } else {
                const store = this.store;
                const phenotype = this.phenotype;
                console.log('phenotype', phenotype)
                // this.dataSources.add("assoc", ['StaticJSON', {data:[]}]);
                this.dataSources.add("assoc", new BioIndexLZSource({
                    store: store,
                    module: BIO_INDEX_TYPE.Associations,
                    queryMaker: { phenotype },
                }));
            }

            if (this.constraint) {
                this.dataSources.add("constraint", this.constraint);
            } else {
                this.dataSources.add("constraint", lzDataSources.defaultSource.constraint);
            }

            if (this.ld) {
                this.dataSources.add("ld", this.ld);
            } else {
                this.dataSources.add("ld", lzDataSources.defaultSource.ld);
            }

            if (this.recomb) {
                this.dataSources.add("recomb", this.recomb);
            } else {
                this.dataSources.add("recomb", lzDataSources.defaultSource.recomb);
            }

            if (this.gene) {
                this.dataSources.add("gene", this.gene);
            } else {
                this.dataSources.add("gene", lzDataSources.defaultSource.gene);
            }

            if (this.intervals) {
                this.dataSources.add("intervals", this.intervals);
            } else {
                this.dataSources.add("intervals", lzDataSources.defaultSource.intervals);
            }

            this.lzplot = LocusZoom.populate(
                "#locuszoom",
                this.dataSources,
                this.layout
            );
        },
        updateLocus(chr, start, end) {
            this.lzplot.applyState({ chr, start, end });
        },
        updateVariants(assocData) {
            if (this.assoc) {
                this.assoc[1].data = assocData;
            }
        }
    }
});
</script>
