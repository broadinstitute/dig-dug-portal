<template>
    <div></div>
</template>

<script>
import Vue from "vue";
import { isEqual, isEmpty } from "lodash";

import LocusZoom from "locuszoom";
import idCounter from "@/utils/idCounter";
import { LZBioIndexSource, BASE_PANEL_OPTIONS } from "@/utils/lzUtils";
import { LzLayout, LzPanelClass, LzDataSource, bioIndexParams } from "../beta/lzConfiguration";

export default Vue.component("lz-phewas-panel", {
    props: {
        id: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        phenotypeMap: {
            type: Object,
            required: true,
        },
        // for use with v-model
        value: {
            required: false
        },
        onLoad: Function,
        onResolve: Function,
        onError: Function,
    },
    data() {
        return {
            panelId: null,
        };
    },
    mounted() {
        this.updatePanel();
    },
    methods: {
        updatePanel() {
            // NOTE: result.data is bioindex-shaped data, NOT locuszoom-shaped data (which is good)
            const onLoad = !!!this.onLoad ? result => this.$emit('input', result) : this.onLoad;
            this.panelId = this.$parent.addPanelAndDataSource(
                makePhewasPanel(
                    this.id,
                    this.type,
                    this.phenotypeMap,
                    onLoad,
                    this.onResolve,
                    this.onError,
                    this.value
                )
            );
        },
    },
    watch: {
        value(newVal, oldVal) {
            // the first clause prevents infinite loops
            // the second clause here prevents us from updating the panel twice when locuszoom pushes data to the page
            if (!isEqual(newVal, oldVal) && !isEmpty(oldVal)) {
                if (!!this.panelId) {
                    this.$parent.plot.removePanel(this.panelId);
                }
                this.updatePanel();
            }
        },
        id(newVarOrGeneId) {
            // this is good enough
            if (!!this.panelId) {
                this.$parent.plot.removePanel(this.panelId);
            }
            this.updatePanel();
        },
        type() {
            // this is good enough
            if (!!this.panelId) {
                this.$parent.plot.removePanel(this.panelId);
            }
            this.updatePanel();
        },
    },
});

export function makePhewasPanel(varOrGeneId, idType, phenotypeMap, onLoad, onResolve, onError, initialData) {
    const index = ({ gene: 'gene-associations', variant: 'phewas-associations' })[idType];
    const dataLayerQ = '$..data_layers[?(@.id === "phewaspvalues")]';

    // get a base layout, give it a title and add some fields under the 'assoc' namespace
    const layout = new LzLayout('phewas', {
        axes: {
            y1: {
                label: '-log10(p)',
            }
        }
    })
    .addFields(dataLayerQ, 'phewas', 
        ['pValue', 'phenotype'].concat(index=== 'phewas-associations' ? `beta` : [])
    );

    // modify one of the data layers
    // https://statgen.github.io/locuszoom/docs/guides/interactivity.html#helper-functions-for-modifying-nested-layouts
    layout.setProperty(`${dataLayerQ}.tooltip`, {
        widgets: [
            {
                type: "toggleloglog",
                color: "gray",
                position: "right",
            },
        ],
    })

    // TODO: eliminate the translator function with field renaming!
    const translator = associations => {
        const portalAssociations = associations.filter(a => {
            return !!phenotypeMap[a.phenotype];
        });
        // transform from bio index to locuszoom
        const phewas = portalAssociations.map(a => {
            const phenotypeInfo = phenotypeMap[a.phenotype];
            return {
                id: phenotypeInfo.name,
                log_pvalue: -Math.log10(a.pValue),
                trait_group: phenotypeInfo.group,
                trait_label: phenotypeInfo.description,
                pValue: a.pValue,
                phenotype: phenotypeInfo.name,
                beta: a.beta,
            };
        });
        return phewas;
    };

    const datasource = new LzDataSource(LZBioIndexSource)
        .withParams(
            bioIndexParams(
                index,
                varOrGeneId, 
                translator, 
                undefined,
                onLoad,
                onError,
                onResolve,
                initialData
            )
        );

    const panel = new LzPanelClass(layout, datasource).initialize('phewas'); // 'assoc' binds both the datasource presented and the layout given uniquely
    return panel.unwrap;
}

</script>
