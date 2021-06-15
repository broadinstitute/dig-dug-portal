<script>

import Vue from "vue";
import LzPanel from "./LzPanel"
import LocusZoom from "locuszoom"
import { LZBioIndexSource } from "@/utils/lzUtils"
import idCounter from "@/utils/idCounter"
import Formatters from "@/utils/formatters"
import { LzLayout, LzPanelClass, LzDataSource, bioIndexParams } from "@/components/lz/beta/lzConfiguration";

export default Vue.component('lz-coaccessibility-panel', {
    components: {
        LzPanel
    },
    props: {
        title: String,
        tissue: String,
    },
    created() {
        this.panelClass = makeCoaccessibilityPanel(
            this.tissue,
            this.title,
            event => this.$emit('input', event),
            event => this.$emit('resolve', event),
            event => this.$emit('error', event)
        );
        
        // hack - needs to be replaced
        this.addPanels = this.$parent.addPanels;
        this.plot = this.$parent.plot;
    }

});

export function makeCoaccessibilityPanel(tissue, title, onLoad, onResolve, onError) {
    const namespace_id = `access_${idCounter.getUniqueId()}`
    return {
            layouts: [
                LocusZoom.Layouts.get('panel', 'coaccessibility', {
                    id: namespace_id,
                    namespace: {
                        'access': namespace_id
                    },
                    title: {
                        text: title || `${Formatters.snakeFormatter(tissue)} Gene Links`,
                        style: { "font-size": "18px" },
                    },
                    y_index: 2,
                })
            ],
            sources: [
                [
                    namespace_id, new LZBioIndexSource({
                        index: "gene-links",
                        queryStringMaker: (chr, start, end) => `${tissue},${chr}:${start}-${end}`,
                        translator: geneLinkArray => {
                            return geneLinkArray.map(geneLink => ({
                                "id": geneLink.tissueId,
                                "chrom": geneLink.chromosome,
                                "start1": geneLink.start,
                                "end1": geneLink.end,
                                "start2": geneLink.targetGeneStart,
                                "end2": geneLink.targetGeneEnd,
                                "target": geneLink.targetGene,
                                "score": 1
                            }))
                        },
                        onLoad,
                        onError,
                        onResolve
                    })
                ]
            ]
        }
}

</script>

<template>
    <lz-panel
        ref="panel"
        :panelClass="panelClass" 
        @updated="$event => this.panelId = $event.panelId">
    </lz-panel>
</template>