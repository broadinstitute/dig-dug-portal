<template>
    <div>
        <div :id="`lz_${salt}`"></div>
        <slot v-if="locuszoommounted"></slot>
    </div>
</template>

<script>
import Vue from "vue";

import LocusZoom from "locuszoom";
import "locuszoom/dist/locuszoom.css"
import intervalTracks from 'locuszoom/esm/ext/lz-intervals-track';
import credibleSets from 'locuszoom/esm/ext/lz-credible-sets';
import toolbar_addons from 'locuszoom/esm/ext/lz-widget-addons';

import LZDataSources from "@/utils/lz/lzDataSources";
import { LZAssociationsPanel, LZAnnotationIntervalsPanel, LZCredibleVariantsPanel, LZPhewasPanel, LZComputedCredibleVariantsPanel } from "@/utils/lz/lzPanels";

import idCounter from "@/utils/idCounter"
import jsonQuery from "json-query";

LocusZoom.use(intervalTracks);
LocusZoom.use(credibleSets);
LocusZoom.use(toolbar_addons);

export default Vue.component("locuszoom", {
    props: [
        "chr",
        "start",
        "end",
        "scoring",
        "refSeq",
    ],
    data() {
        return {
            locuszoommounted: false,
            yIndex: 0,
            salt: Math.floor(Math.random() * 10000).toString()
        }
    },
    mounted() {

        this.dataSources = new LocusZoom.DataSources();
        Object.keys(LZDataSources).forEach(lzType => {
            if (!!this[lzType]) {
                this.createSource(lzType, this[lzType]);
            } else {
                let source = LZDataSources[lzType];
                if (!!source) {
                    this.dataSources.add(lzType, source);
                }
            }
        });

        this.plot = LocusZoom.populate(`#lz_${this.salt}`, this.dataSources, {
            responsive_resize: "both",
            state: Object.assign({}, {
                chr: this.chr,
                start: this.start,
                end: this.end,
            })
        });
        this.locuszoommounted = true;

        if (this.refSeq) {
            // adding default panel for gene reference track
            this.plot.addPanel(LocusZoom.Layouts.get("panel", "genes", {
                min_height: 240,
                height: 240,
                y_index: 3
            }));
        }

        // event listeners
        let self = this;

        this.plot.on('panel_removed', function(event) {
            self.$emit('panelremoved', event);
        })

        // region change handler
        this.plot.on('state_changed', function(event) {
            // TODO: doesn't pass out chromosome!
            const { start, end } = event; // coordinates are in decimals
            self.$emit('regionchanged', event);
        })

        self.$on("LZ_ADD_PANEL", () => {
            console.log('load panel')
        });

    },
    methods: {

        addPanelAndDataSource: function(panelClass) {

            // DataSources and Panels/Layouts are linked together via namespaces.
            // A DataSource name is given to the panel, for a particular data type
            // The data that a Layout takes is defined in its "fields", which we leave equal to the key 'forDataSourceType'
            // However, the *specific data* for these fields, so the string <source.givingDataSourceName> must be equal to <panel.takingDataSourceName>

            const { panel, source } = panelClass;
            this.dataSources.add(source.givingDataSourceName, source.withDataSourceReader);

            let panelOptions = {
                namespace: { [panel.forDataSourceType]: panel.takingDataSourceName },
                id: panel.id,
                ...panel.locusZoomPanelOptions,             // other locuszoom configuration required for the panel, including overrides(?)
            }

            if (typeof panelClass.dataLayers !== 'undefined') {
                panelOptions = {
                    ...panelOptions,
                    data_layers: panelClass.dataLayers
                }
            }

            this.plot.addPanel(LocusZoom.Layouts.get("panel", panel.panelLayoutType, panelOptions)).addBasicLoader();

            // so we can figure out how to remove it later
            return panel.id;

        },

        // TODO: component system for LocusZoom
        addLZComponent: function(PanelComponentType, panelConfig) {
            if (this.plot != null) {
                let LZPanelConstructor = Vue.extend(PanelComponentType);

                let vueContainer = document.createElement('div');
                this.$el.appendChild(vueContainer)

                const trackComponentInstance = new LZPanelConstructor({
                    propsData: panelConfig,
                    parent: this,
                }).$mount(vueContainer);

            } else {
                console.log('lz is null right now')
            }
        },

        // remember that the handlers are optional (bioIndexUtils knows what to do without them) so you don't have to pass them into these functions
        // however the initial non-handler arguments are mandatory. anything that comes after the handler arguments will usually be optional
        addAssociationsPanel: function(phenotype, initialData, finishHandler, resolveHandler, errHandler) {
            const panelId = this.addPanelAndDataSource(
                new LZAssociationsPanel(
                    phenotype, { finishHandler, resolveHandler, errHandler },
                    initialData
                )
            );
            return panelId;
        },
        addAnnotationIntervalsPanel: function(annotation, method, initialData, finishHandler, resolveHandler, errHandler) {
            const panelId = this.addPanelAndDataSource(
                new LZAnnotationIntervalsPanel(
                    annotation, method, { finishHandler, resolveHandler, errHandler },
                    initialData,
                    this.scoring,
                )
            );
            return panelId;
        },
        addCredibleVariantsPanel: function(phenotype, credibleSetId, initialData, finishHandler, resolveHandler, errHandler) {
            const panelId = this.addPanelAndDataSource(
                new LZCredibleVariantsPanel(
                    phenotype, credibleSetId, { finishHandler, resolveHandler, errHandler },
                    initialData,
                )
            );
            return panelId;
        },
        addComputedCredibleVariantsPanel: function(phenotype) {
            const panelId = this.addPanelAndDataSource(
                new LZComputedCredibleVariantsPanel(
                    phenotype
                )
            );
            return panelId;
        },
        addPhewasPanel: function(varId, phenotypeMap, initialData, finishHandler, resolveHandler, errHandler) {
            const panelId = this.addPanelAndDataSource(
                new LZPhewasPanel(
                    varId,
                    phenotypeMap, { finishHandler, resolveHandler, errHandler },
                    initialData,
                )
            );
            return panelId;
        },
        // TODO: Refactor to use the filter function *directly as a function*
        applyFilter(filter) {
            // TODO: revisit, is there a faster way?
            // Auxiliary method within our json query for data layers in the LocusZoom plot
            // takes a list of objects of objects, and returns an array of the deepest objects - i.e. [{{*}}] => {*}
            // using flatmap because we need to work across many Object.keys
            // const forceKeys = el => el.flatMap(data_layer_set => Object.keys(data_layer_set).map(data_layer_name => data_layer_set[data_layer_name]));
            const forceKeys = el => el.flatMap(data_layer_set => Object.entries(data_layer_set).map(data_layer_pair => data_layer_pair[1]));

            // Do we need to calculate this every time?
            const data_layers = jsonQuery('panels[*].data_layers[*]:forceKeys', { data: this.plot, locals: { forceKeys } }).value;
            data_layers.forEach(data_layer => {

                const target = /*filter.target ||*/ data_layer.parent.id
                const filterTargetNames = Array.isArray(filter.fields) ? filter.fields.map(field => `${target}_src:${field}`) : [`${target}_src:${filter.fields}`];

                if (filterTargetNames.every(fieldTarget => data_layer.layout.fields.includes(fieldTarget))) {

                    if (filter.value != '') {
                        data_layer.setFilter(
                            vals => {
                                return filter.op(vals, filter.value);
                            }
                        );
                    } else {
                        // nullify filter if filter has no value (lets everything through)
                        data_layer.setFilter(item => true);
                    }

                } // no change in filter for data layers that don't match on the value

            });

            // refresh the plot in place
            // this should generally imply using cached data if possible (improving the filter performance since it won't make a new network call when used)
            this.plot.applyState();

        }
    },
    computed: {
        region() {
            return {
                chr: this.chr,
                start: this.start,
                end: this.end,
            }
        }
    },
    watch: {
        region(newRegion) {
            this.plot.applyState({ chr: newRegion.chr, start: newRegion.start, end: newRegion.end })
        }
    }
});

</script>
