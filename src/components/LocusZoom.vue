<template>
    <div id="locuszoom"></div>
</template>

<script>
import Vue from "vue";
import LocusZoom from "locuszoom";
import lzDataSources from "@/utils/lz/lzDataSources";

import {
    BioIndexLZSource,
    LazySource,
    LazyDataChain,
    LazyDataRef,
    DispatchSource,
    SimpleSource
} from "@/utils/lz/lzReader";
import { sortPanels, LZ_TYPE } from "@/utils/lz/lzUtils";

import * as _ from "lodash";

export default Vue.component("locuszoom", {
    props: [
        "panels",
        "modules",

        ...Object.values(LZ_TYPE),

        "chr",
        "start",
        "end"
    ],
    data() {
        return {
            myStart: this.start,
            myEnd: this.end,
            desired: {
                start: null,
                end: null
            },
            updatedTargets: []
        };
    },
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
                start: this.myStart,
                end: this.myEnd
            }
        };

        this.dataSources = new LocusZoom.DataSources();

        Object.values(LZ_TYPE).forEach(lzType => {
            if (this[lzType]) {
                const { name, data, translator } = this[lzType];
                this.dataSources.add(lzType, [
                    "SimpleSource",
                    {
                        positionUpdater: this.updatePosition,
                        store: this.$store,
                        data: translator(data)
                    }
                ]);
            } else if (lzDataSources.defaultSource[lzType]) {
                this.dataSources.add(
                    lzType,
                    lzDataSources.defaultSource[lzType]
                );
            }
        });

        this.lzplot = LocusZoom.populate(
            "#locuszoom",
            this.dataSources,
            this.layout
        );
    },
    methods: {
        updatePosition(lzState) {
            const { chr, start, end } = lzState;
            this.desired.start = start;
            this.desired.end = end;
            this.dataUpdated();
        },
        refresh() {
            this.lzplot.refresh();
        },
        dataUpdated(target) {
            if (target) {
                this.updatedTargets.push(target);
            } else {
                this.updatedTargets.push(
                    ...Object.values(LZ_TYPE).filter(lzType => this[lzType])
                );
            }

            const stillUpdating = Object.values(LZ_TYPE)
                .filter(lzType => this[lzType])
                .every(lzType => {
                    return !this.updatedTargets.includes(lzType);
                });

            if (!stillUpdating) {
                // if i'm not still updating, then dispatch desired coordinates
                this.$store.dispatch("onLocusZoomCoords", {
                    newChr: this.chr,
                    newStart: this.desired.start,
                    newEnd: this.desired.end
                });
                this.desired.start = null;
                this.desired.end = null;
                this.updatedTargets = [];
            }
        }
    },
    watch: {
        assoc(n, o) {
            if (this["assoc"] && n.data.length !== o.data.length) {
                this.dataSources.add("assoc", [
                    "SimpleSource",
                    {
                        positionUpdater: this.updatePosition,
                        store: this.$store,
                        data: n.translator(n.data)
                    }
                ]);
                this.refresh();
                this.dataUpdated("assoc");
            }
        }
        // gene(n, o) {
        //     if(this['gene'] && n.data.length !== o.data.length) {
        //         const resolve = this.dataResolvers['gene'];
        //         resolve(n.data);
        //     }
        // },
        // ld(n, o) {
        //     if(this['ld'] && n.data.length !== o.data.length) {
        //         const resolve = this.dataResolvers['ld'];
        //         resolve(n.data);
        //     }
        // },
        // phewas(n, o) {
        //     if(this['phewas'] && n.data.length !== o.data.length) {
        //         const resolve = this.dataResolvers['phewas'];
        //         resolve(n.data);
        //     }
        // },
        // recomb(n, o) {
        //     if(this['recomb'] && n.data.length !== o.data.length) {
        //         const resolve = this.dataResolvers['recomb'];
        //         resolve(n.data);
        //     }
        // },
        // constraint(n, o) {
        //     if(this['constraint'] && n.data.length !== o.data.length) {
        //         const resolve = this.dataResolvers['constraint'];
        //         resolve(n.data);
        //     }
        // },
        // intervals(n, o) {
        //     if(this['intervals'] && n.data.length !== o.data.length) {
        //         const resolve = this.dataResolvers['intervals'];
        //         resolve(n.data);
        //     }
        // },
    }
});
</script>
