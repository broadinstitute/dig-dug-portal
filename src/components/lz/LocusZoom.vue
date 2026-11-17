<template>
    <span>
        <div :id="`lz_${salt}`">
            <div>
                <slot v-if="locuszoommounted"></slot>
            </div>
        </div>
    </span>
</template>

<script>
import Vue from "vue";
import LocusZoom from "locuszoom";
import tabix_source from "locuszoom/esm/ext/lz-tabix-source"
import intervalTracks from "locuszoom/esm/ext/lz-intervals-track";
import credibleSets from "locuszoom/esm/ext/lz-credible-sets";
import toolbar_addons from "locuszoom/esm/ext/lz-widget-addons";

import { makeIntervalsPanel } from "@/components/lz/panels/LocusZoomIntervalsPanel";
import { makeCatalogAnnotationsPanel } from "@/components/lz/panels/LocusZoomCatalogAnnotationsPanel";
import { LZCredibleVariantsPanel, makeCredibleVariantsPanel } from "@/components/lz/panels/LocusZoomCredibleSetsPanel";
import { LZComputedCredibleVariantsPanel, makeComputedCredibleVariantsPanel } from "@/components/lz/panels/LocusZoomComputedCredibleSetsPanel";
import { makePhewasPanel } from "@/components/lz/panels/LocusZoomPhewasPanel";
import { makeCoaccessibilityPanel } from "@/components/lz/panels/LocusZoomCoaccessibilityPanel";

import { ToggleLogLog, ldlz2_pop_selector_menu, download_png } from "./widgets";

import jsonQuery from "json-query";

import idCounter from "@/utils/idCounter";
import { decodeNamespace } from "@/utils/filterHelpers";

import "locuszoom/dist/locuszoom.css";

LocusZoom.use(intervalTracks);
LocusZoom.use(credibleSets);
LocusZoom.use(toolbar_addons);
LocusZoom.use(tabix_source);

LocusZoom.Widgets.add("toggleloglog", ToggleLogLog);

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
            max_region_scale: 500000,
            state: {
                chr: this.chr,
                start: this.start,
                end: this.end,
            },
            toolbar: {
                widgets,
            },
        });
        this.locuszoommounted = true;

        let self = this;

        this.plot.on("panel_removed", function (event) {
            self.$emit("panelremoved", event);
        });

        this.plot.on("state_changed", function (event) {
            self.$emit("regionchanged", event);
        });

        if (this.refSeq) {
            this.plot.addPanel(
                LocusZoom.Layouts.get("panel", "genes", {
                    height: 200,
                    min_height: 200,
                    y_index: 3,
                })
            );
        }

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
        addPanels: function ({ layouts, sources }) {
            const panelClass = { layouts, sources };
            if (
                !!!this.dataSources._items.has(
                    panelClass.sources[0][0]
                )
            ) {
                this.dataSources.add(
                    panelClass.sources[0][0],
                    panelClass.sources[0][1]
                );
            }

            let panel;
            if (!!panelClass.layouts) {
                let layouts = panelClass.layouts[0];
                panel = this.plot.addPanel(layouts).addBasicLoader();
            } else {
                let panelOptions = {
                    id: idCounter.getUniqueId(),
                    namespace: {
                        [panelClass.datasource_type]:
                            panelClass.datasource_namespace_symbol_for_panel,
                    },
                    ...panelClass.locusZoomPanelOptions,
                };
                panel = this.plot
                    .addPanel(
                        LocusZoom.Layouts.get(
                            "panel",
                            panelClass.panel_layout_type,
                            panelOptions
                        )
                    )
                    .addBasicLoader();
            }

            if (!!this.filter) this.applyFilter(this.filter);
            if (
                !!this.filterAssociations
            )
                this.applyFilter(this.filterAssociations, "association");
            if (
                !!this.filterAnnotations 
            )
                this.applyFilter(this.filterAnnotations, "intervals");
            this.plot.applyState();

            return panel.id;
        },
        getDataLayers() {
            const forceKeys = (el) =>
                el.flatMap((data_layer_set) =>
                    Object.entries(data_layer_set).map(
                        (data_layer_pair) => data_layer_pair[1]
                    )
                );

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
                    .filter((data_layer) => {
                        return data_layer.id.includes(panelType);
                    });
            }

            data_layers.forEach((data_layer) => {
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
        addAssociationsPanel: function (
            phenotype,
            title,
            initialData,
            onLoad,
            onResolve,
            onError
        ) {
            const panelId = this.addPanels(
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
            const panelId = this.addPanels(
                makeCatalogAnnotationsPanel(
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
            scoring,
            title,
            initialData,
            onLoad,
            onResolve,
            onError
        ) {
            const panelId = this.addPanels(
                makeIntervalsPanel(
                    index,
                    primaryKey,
                    secondaryKey,
                    scoring,
                    title,
                    onLoad,
                    onResolve,
                    onError,
                    initialData
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
            const panelId = this.addPanels(
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
            const panelId = this.addPanels(
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
            const panelId = this.addPanels(
                makePhewasPanel(
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
        addCoaccessibilityPanel: function (
            tissue,
            title,
            onLoad,
            onResolve,
            onError
        ) {
            const panelId = this.addPanels(
                makeCoaccessibilityPanel(
                    tissue,
                    title,
                    onLoad,
                    onResolve,
                    onError
                )
            );
            return panelId;
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
            this.plot.applyState();
        },
        filterAssociations(associationsFilter) {
            this.applyFilter(associationsFilter, "association");
            this.plot.applyState();
            let data_layers = this.getDataLayers();
        },
        filterAnnotations(annotationsFilter) {
            this.applyFilter(annotationsFilter, "intervals");
            this.plot.applyState();
        },
    },
});

const HUMAN_GENOME_BUILD_VERSION = "GRCh37";
const LZDataSources = {
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
