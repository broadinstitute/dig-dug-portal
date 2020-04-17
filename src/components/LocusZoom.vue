<template>
    <div id="locuszoom"></div>
</template>

<script>
import Vue from "vue";
import LocusZoom from "locuszoom";
import lzDataSources from "@/utils/lz/lzDataSources";

import { BioIndexLZSource } from "@/utils/lz/lzReader";
import { sortPanels, LZ_TYPE } from "@/utils/lz/lzUtils";

import * as _ from "lodash"

export default Vue.component("locuszoom", {
    props: [
        "panels",
        "modules",

        ...Object.values(LZ_TYPE),

        "chr",
        "start",
        "end",
    ],
    data() {
        return {
            dataResolvers: {

            },
            dataCache: {
                // str (target + coordinates = (chr, start, end)) -> promise
            
            },
        }
    },
    mounted() {
        console.log('mounting')
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
                end: this.end,
            }
        };
        this.plot();
    },
    methods: {
        promiseMakerFor(target) {
            let that = this;
            return () => {
                return new Promise(resolve => {
                    Vue.set(that.dataResolvers, target, resolve);
                });
            }
        },
        plot() {
            this.dataSources = new LocusZoom.DataSources();
            this.modules.forEach(moduleObj => {
                const { module, translator, target } = moduleObj;
                this.dataSources.add(target, new BioIndexLZSource({
                    store: this.$store,
                    promiseMaker: this.promiseMakerFor(target),
                    module,
                    translator,
                }));
            });

            const configuredLzTypes = this.modules.map(module => module.target);
            
            Object.values(LZ_TYPE)
                .filter(lzType => !configuredLzTypes.includes(lzType))
                .forEach(dataType => {
                    if (this[dataType]) {
                        console.log(dataType)
                        const { module, translator } = this[dataType];
                        this.dataSources.add(dataType, new BioIndexLZSource({
                            store: this.$store,
                            promiseMaker: this.promiseMakerFor(dataType),
                            module,
                            translator,
                        }));
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
    },
    watch: {
        // ensure that the data is responsive
        modules(n, o) {
            n.forEach((module, index) => {
                if(module.data.length !== o[index].data.length) {
                    const resolve = this.dataResolvers[module.target];
                    resolve(module.data);
                    console.log('resolve module');
                }
            })
        },
        assoc(n, o) {
            // if(this.dataResolvers['assoc']) {
            //     const resolve = this.dataResolvers['assoc'];
            //     resolve(n.data);
            // }
        }
    }
    
});
</script>
