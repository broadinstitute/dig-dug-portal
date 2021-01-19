<template>
    <div></div>
</template>

<script>
import Vue from "vue";
import { isEqual, isEmpty } from "lodash";

import LocusZoom from "locuszoom";
import { GwasCatalogLZ } from "locuszoom/esm/data/adapters/";

import { LZBioIndexSource, BASE_PANEL_OPTIONS } from "@/utils/lzUtils"
import idCounter from "@/utils/idCounter";

export default Vue.component("lz-catalog-annotations-panel", {
    props: {
        // for use with v-model
        value: {
            required: false
        },
        finishHandler: Function,
        resolveHandler: Function,
        errHandler: Function,
    },
    data() {
        return {
            id: null
        };
    },
    mounted() {
        this.updatePanel();
        this.$parent.plot.on("panel_removed", panel => {
            // if (panel.data === this.id) {
            //     this.$destroy();
            // }
        });
    },
    methods: {
        updatePanel() {
            // TODO
            // NOTE: result.data is bioindex-shaped data, NOT locuszoom-shaped data (which is good)
            const finishHandler = !!!this.finishHandler ? result => this.$emit('input', result) : this.finishHandler;
            this.id = this.$parent.addCatalogAnnotationsPanel(
                this.phenotype,
                this.value,
                finishHandler,
                this.resolveHandler,
                this.errHandler,
            );

        }
    },
    watch: {
        value(newVal, oldVal) {
            // the first clause prevents infinite loops
            // the second clause here prevents us from updating the panel twice when locuszoom pushes data to the page
            if (!isEqual(newVal, oldVal) && !isEmpty(oldVal)) {
                if (!!this.id) {
                    this.$parent.plot.removePanel(this.id);
                };
                this.updatePanel();
            }
        },
        phenotype(newPhenotype, oldPhenotype) {
            if (!!this.id) {
                this.$parent.plot.removePanel(this.id);
            }
            this.updatePanel();
        }
    }
});


export class LZCatalogAnnotationsPanel {
    constructor(phenotype, finishHandler, resolveHandler, errHandler, initialData) {

        // panel_layout_type and datasource_type are not necessarily equal, and refer to different things
        // however they are also jointly necessary for LocusZoom –
        this.panel_layout_type = 'annotation_catalog';
        this.datasource_type = ['assoc', 'catalog'];

        // LocusZoom Layout configuration options
        // See the LocusZoom docs for how this works
        // https://github.com/statgen/locuszoom/wiki/Data-Layer#data-layer-layout
        // If there's not a lot in here it's because we're overriding defaults
        this.datasource_namespace_symbol_for_panel = 'catalog';
        this.locusZoomPanelOptions  = {
    // Identify GWAS hits that are present in the GWAS catalog
    namespace: { 'assoc': 'assoc', 'catalog': 'catalog' },
    id: 'annotation_catalog',
    type: 'annotation_track',
    id_field: '{{namespace[catalog]}}variant',
    x_axis: {
        field: '{{namespace[catalog]}}pos',
    },
    color: '#0000CC',
    fields: [
        '{{namespace[assoc]}}variant', '{{namespace[assoc]}}chromosome', '{{namespace[assoc]}}position',
        '{{namespace[catalog]}}variant', '{{namespace[catalog]}}rsid', '{{namespace[catalog]}}trait',
        '{{namespace[catalog]}}log_pvalue', '{{namespace[catalog]}}pos',
    ],
    filters: [
        // Specify which points to show on the track. Any selection must satisfy ALL filters
        { field: '{{namespace[catalog]}}rsid', operator: '!=', value: null },
        { field: '{{namespace[catalog]}}log_pvalue', operator: '>', value: 0.01 },
    ],
    behaviors: {
        onmouseover: [
            { action: 'set', status: 'highlighted' },
        ],
        onmouseout: [
            { action: 'unset', status: 'highlighted' },
        ],
        onclick: [
            { action: 'toggle', status: 'selected', exclusive: true },
        ],
    },
    tooltip: {
    namespace: { 'assoc': 'assoc', 'catalog': 'catalog' },
    closable: true,
    show: { or: ['highlighted', 'selected'] },
    hide: { and: ['unhighlighted', 'unselected'] },
    html: '<strong>{{{{namespace[catalog]}}variant|htmlescape}}</strong><br>'
        + 'Catalog entries: <strong>{{n_catalog_matches|htmlescape}}</strong><br>'
        + 'Top Trait: <strong>{{{{namespace[catalog]}}trait|htmlescape}}</strong><br>'
        + 'Top P Value: <strong>{{{{namespace[catalog]}}log_pvalue|logtoscinotation}}</strong><br>'
        // User note: if a different catalog is used, the tooltip will need to be replaced with a different link URL
        + 'More: <a href="https://www.ebi.ac.uk/gwas/search?query={{{{namespace[catalog]}}rsid|htmlescape}}" target="_blank" rel="noopener">GWAS catalog</a> / <a href="https://www.ncbi.nlm.nih.gov/snp/{{{{namespace[catalog]}}rsid|htmlescape}}" target="_blank" rel="noopener">dbSNP</a>',
},
    tooltip_positioning: 'top',
};;
        this.index = 'associations';
        this.initialData = initialData;
        this.queryStringMaker = (chr, start, end) => `${'T2D'},${chr}:${start}-${end}`
        this.translator = associations => {
            console.log(associations)
            return associations.map(association => ({
                chromosome: association.chromosome,

                id: association.varId,

                rsid: association.varId,
                trait: 'T2D',
                pos: association.position,

                position: association.position,
                pValue: association.pValue,
                log_pvalue: ((-1) * Math.log10(association.pValue)), // .toPrecision(4),
                variant: association.varId,
                ref_allele: association.varId,
                consequence: association.consequence,
                beta: association.beta,
                nearest: association.nearest,
            }))
        };
        this.bioIndexToLZReader = new LZBioIndexSource({
            index: this.index,
            queryStringMaker: this.queryStringMaker,
            translator: this.translator,
            finishHandler,
            resolveHandler,
            errHandler,
            initialData: this.initialData,
        });
    }
}


</script>
