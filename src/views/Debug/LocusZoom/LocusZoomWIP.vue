<template>
    <div v-on:updateplot="this.plot" id="locuszoom"></div>
</template>

<script>
import Vue from "vue";
import LocusZoom from "locuszoom";
import lzDataSources from "../../../utils/lzDataSources";
import {sortPanels} from "../utils/lzUtils";
import {BIO_INDEX_TYPE} from "../utils/lzConstants";
import {BioIndexLZSource} from "../utils/lzReader";

export default Vue.component("locuszoom-wip", {
    props: [
        "store", "modules", "phenotype",
        ...Object.keys(lzDataSources.defaultSource),
        "panels",

        // TODO can these be eliminated?
        "chrom",
        "start",
        "end"
    ],
    data() {
        return {

        };
    },
    created() {

    },
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
            // for (let i = 0; i < this.modules.length; i++) {
            //     const dataSourceType = this.modules[i];
            //     // TODO utils like lzReader are used here
            //     const bioIndexDataSource = makeDataSourceFromModule(this.store, this.modules[i]);
            //     this.dataSources.add(dataSourceType, [`${dataSourceType}LZ`, bioIndexDataSource]);
            // }

            this.dataSources.add("assoc", new BioIndexLZSource({
                store: this.store,
                module: 'test',
                indexObj: { phenotype: 'T2D' },
            }));
            console.log(this.dataSources);

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
