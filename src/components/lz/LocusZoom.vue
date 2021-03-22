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
import { LZIntervalsPanel } from "@/components/lz/panels/LocusZoomIntervalsPanel";
import { LZCatalogAnnotationsPanel } from "@/components/lz/panels/LocusZoomCatalogAnnotationsPanel";
import { LZAnnotationIntervalsPanel } from "@/components/lz/panels/LocusZoomAnnotationsPanel";
import { LZCredibleVariantsPanel } from "@/components/lz/panels/LocusZoomCredibleSetsPanel";
import { LZComputedCredibleVariantsPanel } from "@/components/lz/panels/LocusZoomComputedCredibleSetsPanel";
import { LZPhewasPanel } from "@/components/lz/panels/LocusZoomPhewasPanel";

import { addPanel } from "@/components/lz/lzUtils"

import { ToggleLogLog, ldlz2_pop_selector_menu, download_png } from "./widgets";
import { decodeNamespace } from "@/utils/filterHelpers";

import jsonQuery from "json-query";

import idCounter from "@/utils/idCounter";

LocusZoom.use(intervalTracks);
LocusZoom.use(credibleSets);
LocusZoom.use(toolbar_addons);

LocusZoom.Widgets.add("toggleloglog", ToggleLogLog);
LocusZoom.Widgets.add();

export default Vue.component("locuszoom", {
    props: [
        "chr",
        "start",
        "end",
        "scoring",
        "refSeq",
        "ldpop",
        "filter",
        "filterAssociations",
        "filterAnnotations",
    ],
    data() {
        return {
            locuszoommounted: false,
            salt: Math.floor(Math.random() * 10000).toString(),
            plot: null,
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

        let widgets = [download_png];
        if (!!this.ldpop) widgets.push(ldlz2_pop_selector_menu);

        this.plot = LocusZoom.populate(`#lz_${this.salt}`, this.dataSources, {
            responsive_resize: "width",
            state: {
                chr: this.chr,
                start: this.start,
                end: this.end,
            },
            toolbar: {
                // top-to-bottom in the array => right-to-left on the layout
                widgets,
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
                    height: 200,
                    min_height: 200,
                    // bottom section
                    y_index: 3,
                })
            );
        }

        // this lets us treat "regionchanged" as a "locuszoom is ready" hook
        this.$emit("regionchanged", {
            data: {
                start: this.start,
                end: this.end,
            }
        });

    },
    methods: {
        zoomOut(expandLeft = 50000, expandRight = 50000) {
            this.plot.applyState({
                start: this.plot.state.start - expandLeft,
                end: this.plot.state.end + expandRight,
            });
            return [this.plot.state.start, this.plot.state.end];
        },
        addPanelAndDataSource: function (panelClass) {
            const panelId = addPanel(this.plot, this.dataSources, panelClass);
            refreshFilters(panelClass.panel_layout_type);
            // return the panelId so we can know what panels to delete later (for whomever wanted the panel in the first place)
            return panelId;
        },
        // remember that the handlers are optional (bioIndexUtils knows what to do without them) so you don't have to pass them into these functions
        // however the initial non-handler arguments are mandatory. anything that comes after the handler arguments will usually be optional
        addAssociationsPanel: function (
            phenotype,
            title,
            initialData,
            onLoad,
            onResolve,
            onError
        ) {
            const panelId = this.addPanelAndDataSource(
                new LZAssociationsPanel(
                    phenotype,
                    title,
                    onLoad,
                    onResolve,
                    onError,
                    initialData
                )
            );
            return panelId;
        },
        addCatalogAnnotationsPanel: function (
            phenotype,
            title,
            initialData,
            onLoad,
            onResolve,
            onError
        ) {
            const panelId = this.addPanelAndDataSource(
                new LZCatalogAnnotationsPanel(
                    phenotype,
                    title,
                    onLoad,
                    onResolve,
                    onError,
                    initialData
                )
            );
            return panelId;
        },
        addIntervalsPanel: function (
            index,
            primaryKey,
            secondaryKey,
            title,
            initialData,
            onLoad,
            onResolve,
            onError
        ) {
            const panelId = this.addPanelAndDataSource(
                new LZIntervalsPanel(
                    index,
                    primaryKey,
                    secondaryKey,
                    title,
                    onLoad,
                    onResolve,
                    onError,
                    initialData
                )
            );
            return panelId;
        },
        addAnnotationIntervalsPanel: function (
            annotation,
            title,
            scoring,
            initialData,
            onLoad,
            onResolve,
            onError
        ) {
            const panelId = this.addPanelAndDataSource(
                new LZAnnotationIntervalsPanel(
                    annotation,
                    title,
                    onLoad,
                    onResolve,
                    onError,
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
            onLoad,
            onResolve,
            onError
        ) {
            const panelId = this.addPanelAndDataSource(
                new LZCredibleVariantsPanel(
                    phenotype,
                    credibleSetId,
                    onLoad,
                    onResolve,
                    onError,
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
            onLoad,
            onResolve,
            onError
        ) {
            const panelId = this.addPanelAndDataSource(
                new LZPhewasPanel(
                    varOrGeneId,
                    index,
                    phenotypeMap,
                    onLoad,
                    onResolve,
                    onError,
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
            // YES: number of data_layers is dynamic, can't really memoize.
            let data_layers = jsonQuery("panels[*].data_layers[*]:forceKeys", {
                data: this.plot,
                locals: { forceKeys },
            }).value;
            return data_layers;
        },
        applyFilter(filter, panelType = "") {
            let data_layers = this.getDataLayers();

            // TODO needs a rework
            if (panelType !== "") {
                data_layers = data_layers
                    .map((data_layer) => {
                        return data_layer;
                    })
                    .filter((data_layer) => {
                        return data_layer.id.includes(panelType);
                    });
            }

            data_layers.forEach((data_layer) => {
                // HACK until matching in LocusZoom 0.13.4 figured out.
                if (!(data_layer.id === "annotation_catalog")) {
                    data_layer.setFilter((obj) => {
                        let regularObject = decodeNamespace(obj, {
                            prefix: new RegExp(".+:"),
                        });
                        return filter(regularObject);
                    });
                }
            });
        },
        refreshFilters(layout='') {
            // TODO: make this more abstract
            // CAN USE NAMED V-MODEL/BINDINGS in Vue3?
            // This is optimized to only run filters that are actually associated with the layout being added
            // applyState runs on the end so we don't refresh this multiple times on accident.
            if (!!this.filter) 
                this.applyFilter(this.filter);
            if (
                !!this.filterAssociations &&
                layout.includes("association")
            )
                this.applyFilter(this.filterAssociations, "association");
            if (
                !!this.filterAnnotations &&
                layout.includes("intervals")
            )
                this.applyFilter(this.filterAnnotations, "intervals");
            this.plot.applyState();
        }
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
            this.plot.applyState();
        },
        filterAssociations(associationsFilter) {
            this.applyFilter(associationsFilter, "association");
            // refresh the plot in place
            // this should generally imply using cached data if possible (improving the filter performance since it won't make a new network call when used)
            this.plot.applyState();
            let data_layers = this.getDataLayers();
            console.log(data_layers);
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
    // "assoc": ["AssociationLZ", { url: "https://portaldev.sph.umich.edu/api/v1/annotation/statistic/single/", params: { source: 45, id_field: "variant" } }],
    catalog: [
        "GwasCatalogLZ",
        {
            _enableCache: false,
            url:
                "https://portaldev.sph.umich.edu/api/v1/annotation/gwascatalog/results/?decompose=1&variant_format=colons",
            params: {
                build: HUMAN_GENOME_BUILD_VERSION,
            },
        },
    ],
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
