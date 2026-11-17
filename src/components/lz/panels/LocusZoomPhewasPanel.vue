<script>

import Vue from "vue";
import LzPanel from "./LzPanel"
import { LZBioIndexSource } from "@/utils/lzUtils"
import { LzLayout, LzPanelClass, LzDataSource, bioIndexParams } from "@/components/lz/beta/lzConfiguration";

export default Vue.component('lz-phewas-panel', {
    components: {
        LzPanel
    },
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
    },
    created() {
        this.panelClass = makePhewasPanel(
            this.id, 
            this.type,
            this.phenotypeMap, 
            event => this.$emit('input', event),
            event => this.$emit('resolve', event),
            event => this.$emit('error', event)
        )
        this.addPanels = this.$parent.addPanels;
        this.plot = this.$parent.plot;
    },
    watch: {
        id(newVarOrGeneId) {
            if (!!this.panelId) {
                this.$parent.plot.removePanel(this.panelId);
            }
            this.$refs.panel.updatePanel();
        },
        type() {
            if (!!this.panelId) {
                this.$parent.plot.removePanel(this.panelId);
            }
            this.$refs.panel.updatePanel();
        },
    },
    
});

export function makePhewasPanel(varOrGeneId, idType, phenotypeMap, onLoad, onResolve, onError, initialData) {
    const index = ({ gene: 'gene-associations', variant: 'phewas-associations' })[idType];
    const dataLayerQ = '$..data_layers[?(@.id === "phewaspvalues")]';

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

    layout.setProperty(`${dataLayerQ}.tooltip`, {
        widgets: [
            {
                type: "toggleloglog",
                color: "gray",
                position: "right",
            },
        ],
    })

    const translator = associations => {
        const portalAssociations = associations.filter(a => {
            return !!phenotypeMap[a.phenotype];
        });
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

    const panel = new LzPanelClass(layout, datasource).initialize('phewas');
    return panel.unwrap;
}
</script>

<template>
    <lz-panel
        ref="panel"
        :panelClass="panelClass" 
        @updated="$event => this.panelId = $event.panelId">
    </lz-panel>
</template>