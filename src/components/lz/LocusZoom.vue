<template>
    <div>
        <div id="lz"></div>
        <slot></slot>
    </div>
</template>

<script>
import Vue from "vue";
import LocusZoom from "locuszoom";

import {
    LZ_TYPE,
    BASE_PANEL_OPTIONS,
    PANEL_OPTIONS
} from "@/utils/lz/lzConstants";
import LZDataSources from "@/utils/lz/lzDataSources";
import { LZBioIndexSource } from "@/utils/lz/lzBioIndexSource";
import LZEvents, {
    LZ_ADD_PANEL,
    LZ_LOAD_PANEL,
} from "@/components/lz/LocusZoomEvents"
import * as _ from "lodash";

export default Vue.component("locuszoom", {
    props: [
        "chr",
        "start",
        "end",
    ],
    data() {
        return {
            locuszoomMounted: false,
        };
    },
    beforeCreate() {
        // can't be data
        this.panelList = [{ type: 'genes', for: 'genes', takes: 'genes'}];
        this.dataSourceList = [];
    },
    created() {
        LZEvents.$on(LZ_LOAD_PANEL, config => {
            this.panelList.push(config.panel);
            this.dataSourceList.push(config.source);
        })
    },
    mounted() {
        this.dataSources = new LocusZoom.DataSources();
        Object.values(LZ_TYPE).forEach(lzType => {
            if (!!this[lzType]) {
                this.createSource(lzType, this[lzType]);
            } else {
                let source = LZDataSources[lzType];
                if (!!source) {
                    this.dataSources.add(lzType, source);
                }
            }
        });

        this.locuszoom = LocusZoom.populate("#lz", this.dataSources, {
            panels: [{ type: 'genes', for: 'genes', takes: 'genes'}],
            responsive_resize: "width_only",
            state: Object.assign({}, {
                chr: this.chr,
                start: this.start,
                end: this.end,
            })
        });
        LZEvents.$on(LZ_ADD_PANEL, this.addPanelAndDataSource);
        this.locuszoomMounted = true
    },
    methods: {
        addPanelAndDataSource: function(panelConfiguration) {
            const { panel, source } = panelConfiguration;
            this.dataSources.add(source.gives, source.reader);
            const myPanel = LocusZoom.Layouts.get("panel", panel.type, {
                // TODO: override/extend defaults here...
                namespace: { [panel.for]: panel.takes },
                id: panel.id,
                ...BASE_PANEL_OPTIONS,
                ...PANEL_OPTIONS[panel.type],
            });
            const newPanel = this.locuszoom.addPanel(myPanel);
            newPanel.addBasicLoader();
        },
        addIntervalsPanel: function() {
            console.log(LocusZoom)
            const panel_identification = `intervals_${1}`;
            const panel_source_namespace_symbol = `intervals_${1}_src`;
            this.addPanelAndDataSource({
                panel: {
                    id: panel_identification,
                    type: 'intervals',
                    takes: panel_source_namespace_symbol,
                    for: 'intervals',
                },
                source: {
                    gives: panel_source_namespace_symbol,
                    as: 'intervals',
                    reader: new LZBioIndexSource({
                        index: 'regions',
                        queryStringMaker: (chr, start, end) => `${chr}:${start}-${end}`,
                        translator: function(intervals) {
                            // NOTE: Sometimes a track might not have defined data for a tissue on an interval, but was already created
                            // In such a case the bioindex is not going to return any data for a given tissue leaving the access of that data by the track undefined
                            // Since we don't want to destroy the track (what if there is more data just around the corner?) we return an empty array
                            // this.annotationScoring[this.tissue][interval.annotation]['pValue'] < 0.01 && this.annotationScoring[this.tissue][interval.annotation]['beta'] > 1.0
                            if (!!intervals) {
                                const newIntervals = intervals
                                    // .filter(interval => {
                                    //     let k = `${interval.tissueId ||
                                    //         "NA"}_${interval.method || "NA"}_${
                                    //         interval.annotation
                                    //     }`;

                                    //     // TODO: Pick out of the filter only those predicates that matter to the object
                                    //     let filterP =
                                    //         !this.filter.pValue ||
                                    //         this.$parent.scoring[k].minP <= this.filter.pValue;
                                    //     let filterFold =
                                    //         !this.filter.fold ||
                                    //         this.$parent.scoring[k].maxFold >= this.filter.fold;
                                    //     let filterMethod = this.method == interval.method;

                                    //     return filterP && filterFold && filterMethod;
                                    // })
                                    .map(interval => {
                                        // const color = this.colorScheme(interval.tissue);
                                        return {
                                            name: interval.tissue || interval.tissueId,
                                            chr: interval.chromosome,
                                            start: interval.start,
                                            end: interval.end,
                                            // TODO: state_id, state_name?
                                            state_id: `${interval.annotation} ${interval.method}`,
                                            state_name: `${interval.annotation} ${interval.method}`,
                                            // color: color
                                        };
                                    });
                                return newIntervals;
                            } else {
                                return [];
                            }
                        },
                        resolveHandler: () => {},
                        errHandler: () => {},
                        finishHandler: () => {}
                    }),
                }
            });
        },
        addCredibleVariantsPanel: function() {
            const panel_identification = `assoc_${phenotype}`;
            const panel_source_namespace_symbol = `assoc_${phenotype}_src`;
            this.addPanelAndDataSource({
                panel: {
                    id: panel_identification,
                    type: 'association',
                    takes: panel_source_namespace_symbol,
                    for: 'assoc',
                },
                source: {
                    gives: panel_source_namespace_symbol,
                    as: 'assoc',
                    reader: new LZBioIndexSource({
                        index: 'associations',
                        queryStringMaker: (chr, start, end) => `${phenotype},${chr}:${start}-${end}`,
                        translator: associations => {
                            const translation = associations.map(association => ({
                                id: association.varId,
                                chr: association.chromosome,
                                start: association.position,
                                end: association.position,
                                position: association.position,
                                pvalue: association.pValue,
                                log_pvalue: ((-1) * Math.log10(association.pValue)).toPrecision(4),
                                variant: association.varId,
                                ref_allele: association.varId,
                            }));
                            return translation
                        },
                        resolveHandler: () => {},
                        errHandler: () => {},
                        finishHandler: () => {}
                    }),
                }
            });
        },
        addAssociationsPanel: function(phenotype) {
            const panel_identification = `assoc_${phenotype}`;
            const panel_source_namespace_symbol = `assoc_${phenotype}_src`;
            this.addPanelAndDataSource({
                panel: {
                    id: panel_identification,
                    type: 'association',
                    takes: panel_source_namespace_symbol,
                    for: 'assoc',
                },
                source: {
                    gives: panel_source_namespace_symbol,
                    as: 'assoc',
                    reader: new LZBioIndexSource({
                        index: 'associations',
                        queryStringMaker: (chr, start, end) => `${phenotype},${chr}:${start}-${end}`,
                        translator: associations => {
                            const translation = associations.map(association => ({
                                id: association.varId,
                                chr: association.chromosome,
                                start: association.position,
                                end: association.position,
                                position: association.position,
                                pvalue: association.pValue,
                                log_pvalue: ((-1) * Math.log10(association.pValue)).toPrecision(4),
                                variant: association.varId,
                                ref_allele: association.varId,
                            }));
                            return translation
                        },
                        resolveHandler: () => {},
                        errHandler: () => {},
                        finishHandler: () => {}
                    }),
                }
            });
        },
        addLZComponent: function(PanelComponentType, panelConfig) {
            if (this.lz != null) {
                let LZPanelConstructor = Vue.extend(PanelComponentType);
                let vueContainer = document.createElement('div');

                this.$el.appendChild(vueContainer)

                const trackComponentInstance = new LZPanelConstructor({
                    propsData: trackConfig.data
                }).$mount(vueContainer);
            }
        },
    },
});

</script>
