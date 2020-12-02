<template>
    <span>
        <div :id="`lz_${salt}`">
            <slot v-if="locuszoommounted"></slot>
        </div>
    </span>
</template>

<script>
import Vue from "vue";

import LocusZoom from "locuszoom";
import "locuszoom/dist/locuszoom.css";
import intervalTracks from "locuszoom/esm/ext/lz-intervals-track";
import credibleSets from "locuszoom/esm/ext/lz-credible-sets";
import toolbar_addons from "locuszoom/esm/ext/lz-widget-addons";

import { LZAssociationsPanel } from "@/components/lz/panels/LocusZoomAssociationsPanel";
import { LZAnnotationIntervalsPanel } from "@/components/lz/panels/LocusZoomAnnotationsPanel";
import { LZCredibleVariantsPanel } from "@/components/lz/panels/LocusZoomCredibleSetsPanel";
import { LZComputedCredibleVariantsPanel } from "@/components/lz/panels/LocusZoomComputedCredibleSetsPanel";
import { LZPhewasPanel } from "@/components/lz/panels/LocusZoomPhewasPanel";

import { makeSource, makeLayout, BASE_PANEL_OPTIONS } from "@/utils/lzUtils";
import { ToggleLogLog } from "./widgets"

import jsonQuery from "json-query";
import idCounter from "@/utils/idCounter";

import { decodeNamespace } from "@/utils/filterHelpers";

LocusZoom.use(intervalTracks);
LocusZoom.use(credibleSets);
LocusZoom.use(toolbar_addons);

LocusZoom.Widgets.add('toggleloglog', ToggleLogLog);

export default Vue.component("locuszoom", {
    props: [
        "chr",
        "start",
        "end",
        "scoring",
        "refSeq",
        "filter",
        "filterAssociations",
        "filterAnnotations",
    ],
    data() {
        return {
            locuszoommounted: false,
            salt: Math.floor(Math.random() * 10000).toString(),
        };
    },
    mounted() {
        this.dataSources = new LocusZoom.DataSources();
        Object.keys(LZDataSources).forEach((lzType) => {
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
            state: {
                chr: this.chr,
                start: this.start,
                end: this.end,
            },
            toolbar: {
                widgets: [
                    {
                        type: "download_png",
                        color: "green",
                        position: "right"
                    }
                ]
            },
        });
        this.locuszoommounted = true;

        // event listeners
        let self = this;

        this.plot.on("panel_removed", function (event) {
            self.$emit("panelremoved", event);
        });

        // region change handler
        this.plot.on("state_changed", function (event) {
            // NOTE: doesn't pass out chromosome!
            self.$emit("regionchanged", event);
        });

        if (this.refSeq) {
            // adding default panel for gene reference track
            this.plot.addPanel(
                LocusZoom.Layouts.get("panel", "genes", {
                    height: 120,
                    // `min_height` is authoratative to locuszoom on what the "natural" height of the track ought to be; i.e. `height` can change, but `min_height` cannot, and so `min_height` can be the layout's default height without any other information.
                    // this means when we delete a panel in between two other panels, locuszoom knows what height each other panel ought to be, the `min_height`, rather than resizing both panels to fill the space left in the middle.
                    // so we should define min_height across all panels if we want to stop them from changing each other's sizes when any of them are removed.
                    min_height: 120,
                    // bottom section
                    y_index: 3,
                })
            );
        }
    },
    methods: {
        addPanelAndDataSource: function (panelClass) {
            // DataSources and Panels/Layouts are linked together via namespaces.
            // A DataSource name is given to the panel, for a particular data type
            // The data that a Layout takes is defined in its "fields", which we leave equal to the key 'forDataSourceType'
            // However, the *specific data* for these fields, so the string <source.givingDataSourceName> must be equal to <layout.takingDataSourceName>

            const layout = makeLayout(panelClass);
            const source = makeSource(panelClass);

            this.dataSources.add(
                source.givingDataSourceName,
                source.withDataSourceReader
            );

            let panelOptions = {
                namespace: {
                    [layout.forDataSourceType]: layout.takingDataSourceName,
                },
                id: layout.id,
                ...layout.locusZoomPanelOptions, // other locuszoom configuration required for the panel, including overrides(?)
            };

            this.plot
                .addPanel(
                    LocusZoom.Layouts.get(
                        "panel",
                        layout.panelLayoutType,
                        panelOptions
                    )
                )
                .addBasicLoader();

            // TODO: make this more abstract
                // CAN USE NAMED V-MODEL/BINDINGS in Vue3?
            // This is optimized to only run filters that are actually associated with the layout being added
            // applyState runs on the end so we don't refresh this multiple times on accident.
            if (!!this.filter) this.applyFilter(this.filter);
            if (!!this.filterAssociations && layout.panelLayoutType === "association")
                this.applyFilter(this.filterAssociations, "associations");
            if (!!this.filterAnnotations && layout.panelLayoutType === "intervals")
                this.applyFilter(this.filterAnnotations, "intervals");
            this.plot.applyState();

            // so we can figure out how to remove it later
            return layout.id;
        },
        // remember that the handlers are optional (bioIndexUtils knows what to do without them) so you don't have to pass them into these functions
        // however the initial non-handler arguments are mandatory. anything that comes after the handler arguments will usually be optional
        addAssociationsPanel: function (
            phenotype,
            initialData,
            finishHandler,
            resolveHandler,
            errHandler
        ) {
            const panelId = this.addPanelAndDataSource(
                new LZAssociationsPanel(
                    phenotype,
                    finishHandler,
                    resolveHandler,
                    errHandler,
                    initialData
                )
            );
            return panelId;
        },
        addAnnotationIntervalsPanel: function (
            annotation,
            method,
            scoring,
            initialData,
            finishHandler,
            resolveHandler,
            errHandler
        ) {
            const panelId = this.addPanelAndDataSource(
                new LZAnnotationIntervalsPanel(
                    annotation,
                    method,
                    finishHandler,
                    resolveHandler,
                    errHandler,
                    initialData,
                    scoring
                )
            );
            return panelId;
        },
        addCredibleVariantsPanel: function (
            phenotype,
            credibleSetId,
            initialData,
            finishHandler,
            resolveHandler,
            errHandler
        ) {
            const panelId = this.addPanelAndDataSource(
                new LZCredibleVariantsPanel(
                    phenotype,
                    credibleSetId,
                    finishHandler, resolveHandler, errHandler,
                    initialData
                )
            );
            return panelId;
        },
        addComputedCredibleVariantsPanel: function (phenotype) {
            const panelId = this.addPanelAndDataSource(
                new LZComputedCredibleVariantsPanel(phenotype)
            );
            return panelId;
        },
        addPhewasPanel: function (
            varOrGeneId,
            index,
            phenotypeMap,
            initialData,
            finishHandler,
            resolveHandler,
            errHandler
        ) {
            const panelId = this.addPanelAndDataSource(
                new LZPhewasPanel(
                    varOrGeneId,
                    index,
                    phenotypeMap,
                    finishHandler,
                    resolveHandler,
                    errHandler,
                    initialData
                )
            );
            return panelId;
        },
        getDataLayers() {
            // Auxiliary method within our json query for data layers in the LocusZoom plot
            // takes a list of objects of objects, and returns an array of the deepest objects - i.e. [{{*}}] => {*}
            // using flatmap because we need to work across many Object.keys
            const forceKeys = (el) =>
                el.flatMap((data_layer_set) =>
                    Object.entries(data_layer_set).map(
                        (data_layer_pair) => data_layer_pair[1]
                    )
                );

            // Do we need to calculate this forceKeys every time?
            let data_layers = jsonQuery("panels[*].data_layers[*]:forceKeys", {
                data: this.plot,
                locals: { forceKeys },
            }).value;
            return data_layers;
        },
        applyFilter(filter, panelType = "") {
            let data_layers = this.getDataLayers();

            if (panelType !== "") {
                data_layers = data_layers
                    .map((data_layer) => {
                        return data_layer;
                    })
                    .filter((data_layer) =>
                        data_layer.parent.id.includes(panelType)
                    );
            }

            data_layers.forEach((data_layer) => {
                const target = data_layer.parent.id;
                const namespaceTag = `${target}_src`;

                data_layer.setFilter((obj) => {
                    let regularObject = decodeNamespace(obj, {
                        prefix: `${namespaceTag}:`,
                    });
                    return filter(regularObject);
                });
            });


        },
    },
    computed: {
        region() {
            return {
                chr: this.chr,
                start: this.start,
                end: this.end,
            };
        },
    },
    watch: {
        region(newRegion) {
            this.plot.applyState({
                chr: newRegion.chr,
                start: newRegion.start,
                end: newRegion.end,
            });
        },
        filter(filter) {
            this.applyFilter(filter);
            // refresh the plot in place
            // this should generally imply using cached data if possible (improving the filter performance since it won't make a new network call when used)
            this.plot.applyState();
        },
        filterAssociations(associationsFilter) {
            this.applyFilter(associationsFilter, "association");
            // refresh the plot in place
            // this should generally imply using cached data if possible (improving the filter performance since it won't make a new network call when used)
            this.plot.applyState();
        },
        filterAnnotations(annotationsFilter) {
            this.applyFilter(annotationsFilter, "intervals");
            // refresh the plot in place
            // this should generally imply using cached data if possible (improving the filter performance since it won't make a new network call when used)
            this.plot.applyState();
        },
    },
});

const HUMAN_GENOME_BUILD_VERSION = "GRCh37";
const LZDataSources = {
    gene: [
        "GeneLZ",
        {
            url: "https://portaldev.sph.umich.edu/api/v1/annotation/genes/",
            params: {
                build: HUMAN_GENOME_BUILD_VERSION,
            },
        },
    ],
    ld: [
        "LDLZ2",
        {
            url: "https://portaldev.sph.umich.edu/ld/",
            params: {
                source: "1000G",
                build: HUMAN_GENOME_BUILD_VERSION,
                population: "ALL",
            },
        },
    ],
    recomb: [
        "RecombLZ",
        {
            url:
                "https://portaldev.sph.umich.edu/api/v1/annotation/recomb/results/",
            params: {
                build: HUMAN_GENOME_BUILD_VERSION,
            },
        },
    ],
    constraint: [
        "GeneConstraintLZ",
        {
            url: "https://gnomad.broadinstitute.org/api",
            params: {
                build: HUMAN_GENOME_BUILD_VERSION,
            },
        },
    ],
};
</script>
