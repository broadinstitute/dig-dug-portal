<script>

import Vue from "vue";
import LzPanel from "./LzPanel"
import LocusZoom from "locuszoom"
import { LZBioIndexSource } from "@/utils/lzUtils"
import idCounter from "@/utils/idCounter"

import { LzLayout, LzPanelClass, LzDataSource, bioIndexParams } from "@/components/lz/beta/lzConfiguration";

export default Vue.component('lz-coaccessibility-panel', {
    components: {
        LzPanel
    },
    props: {
        tissue: String,
    },
    created() {
        const namespace_id = `access_${idCounter.getUniqueId()}`
        this.panelClass = {
            layouts: [
                LocusZoom.Layouts.get('panel', 'coaccessibility', {
                    namespace: {
                        'access': namespace_id
                    },
                    title: {
                        text: this.tissue,
                        style: { "font-size": "18px" },
                    },
                    y_index: 2,
                })
            ],
            sources: [
                [namespace_id, new LZBioIndexSource({
                    index: "gene-links",
                    queryStringMaker: (chr, start, end) => `${this.tissue},${chr}:${start}-${end}`,
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
                    onLoad: event => this.$emit('input', event),
                    onResolve: event => this.$emit('resolve', event),
                    onError: event => this.$emit('error', event)
                })

                // ["StaticSource", {
                //     data: [
                //             {
                //                 "chrom": "10",
                //                 "start1": 114322794,
                //                 "end1": 114323649,
                //                 "start2": 114706031,
                //                 "end2": 114714217,
                //                 "target": "TCF7L2",
                //                 "score": 6.18,
                //                 "id": 0
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 114322794,
                //                 "end1": 114323649,
                //                 "start2": 115310233,
                //                 "end2": 115313458,
                //                 "target": "HABP2",
                //                 "score": 11.05,
                //                 "id": 1
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 114322794,
                //                 "end1": 114323649,
                //                 "start2": 115110830,
                //                 "end2": 115115149,
                //                 "target": "RNU7-165P",
                //                 "score": 11.05,
                //                 "id": 2
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 114373215,
                //                 "end1": 114373967,
                //                 "start2": 114706031,
                //                 "end2": 114714217,
                //                 "target": "TCF7L2",
                //                 "score": 6.43,
                //                 "id": 3
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 114552392,
                //                 "end1": 114553744,
                //                 "start2": 114706031,
                //                 "end2": 114714217,
                //                 "target": "TCF7L2",
                //                 "score": 11.05,
                //                 "id": 4
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 114563536,
                //                 "end1": 114564449,
                //                 "start2": 114706031,
                //                 "end2": 114714217,
                //                 "target": "TCF7L2",
                //                 "score": 11.05,
                //                 "id": 5
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 114675178,
                //                 "end1": 114676335,
                //                 "start2": 114706031,
                //                 "end2": 114714217,
                //                 "target": "TCF7L2",
                //                 "score": 11.05,
                //                 "id": 6
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 114717256,
                //                 "end1": 114718155,
                //                 "start2": 114706031,
                //                 "end2": 114714217,
                //                 "target": "TCF7L2",
                //                 "score": 11.05,
                //                 "id": 7
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 114736909,
                //                 "end1": 114737913,
                //                 "start2": 114706031,
                //                 "end2": 114714217,
                //                 "target": "TCF7L2",
                //                 "score": 11.05,
                //                 "id": 8
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 114757984,
                //                 "end1": 114758766,
                //                 "start2": 114706031,
                //                 "end2": 114714217,
                //                 "target": "TCF7L2",
                //                 "score": 11.05,
                //                 "id": 9
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 114778293,
                //                 "end1": 114778971,
                //                 "start2": 114706031,
                //                 "end2": 114714217,
                //                 "target": "TCF7L2",
                //                 "score": 6.63,
                //                 "id": 10
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 114779359,
                //                 "end1": 114780195,
                //                 "start2": 114706031,
                //                 "end2": 114714217,
                //                 "target": "TCF7L2",
                //                 "score": 6.63,
                //                 "id": 11
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 114780327,
                //                 "end1": 114781175,
                //                 "start2": 114706031,
                //                 "end2": 114714217,
                //                 "target": "TCF7L2",
                //                 "score": 11.05,
                //                 "id": 12
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 114805097,
                //                 "end1": 114805941,
                //                 "start2": 114706031,
                //                 "end2": 114714217,
                //                 "target": "TCF7L2",
                //                 "score": 5.49,
                //                 "id": 13
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 114807643,
                //                 "end1": 114808327,
                //                 "start2": 114706031,
                //                 "end2": 114714217,
                //                 "target": "TCF7L2",
                //                 "score": 5.49,
                //                 "id": 14
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 114819829,
                //                 "end1": 114820900,
                //                 "start2": 114706031,
                //                 "end2": 114714217,
                //                 "target": "TCF7L2",
                //                 "score": 5.32,
                //                 "id": 15
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 114846876,
                //                 "end1": 114847659,
                //                 "start2": 114706031,
                //                 "end2": 114714217,
                //                 "target": "TCF7L2",
                //                 "score": 11.05,
                //                 "id": 16
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 114853103,
                //                 "end1": 114853820,
                //                 "start2": 114706031,
                //                 "end2": 114714217,
                //                 "target": "TCF7L2",
                //                 "score": 11.05,
                //                 "id": 17
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 114873582,
                //                 "end1": 114874471,
                //                 "start2": 114706031,
                //                 "end2": 114714217,
                //                 "target": "TCF7L2",
                //                 "score": 15.82,
                //                 "id": 18
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 115300741,
                //                 "end1": 115301795,
                //                 "start2": 114706031,
                //                 "end2": 114714217,
                //                 "target": "TCF7L2",
                //                 "score": 11.05,
                //                 "id": 19
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 115310058,
                //                 "end1": 115310602,
                //                 "start2": 114706031,
                //                 "end2": 114714217,
                //                 "target": "TCF7L2",
                //                 "score": 11.05,
                //                 "id": 20
                //             },
                //             {
                //                 "chrom": "10",
                //                 "start1": 115311775,
                //                 "end1": 115313007,
                //                 "start2": 114706031,
                //                 "end2": 114714217,
                //                 "target": "TCF7L2",
                //                 "score": 11.05,
                //                 "id": 21
                //             }
                //         ]
                // }]
                ]
            ]
        }
        
        // hack - needs to be replaced
        this.addPanels = this.$parent.addPanels;
        this.plot = this.$parent.plot;
    }

});

// export function makeCoaccessibilityPanel(varOrGeneId, idType, phenotypeMap, onLoad, onResolve, onError, initialData) {
//     // get a base layout, give it a title and add some fields under the 'assoc' namespace
//     const layout = new LzLayout('coaccessibility')


//     // TODO: eliminate the translator function with field renaming!
//     const translator = associations => {
//         const portalAssociations = associations.filter(a => {
//             return !!phenotypeMap[a.phenotype];
//         });
//         // transform from bio index to locuszoom
//         const phewas = portalAssociations.map(a => {
//             const phenotypeInfo = phenotypeMap[a.phenotype];
//             return {
//                 id: phenotypeInfo.name,
//                 log_pvalue: -Math.log10(a.pValue),
//                 trait_group: phenotypeInfo.group,
//                 trait_label: phenotypeInfo.description,
//                 pValue: a.pValue,
//                 phenotype: phenotypeInfo.name,
//                 beta: a.beta,
//             };
//         });
//         return phewas;
//     };

//     const datasource = new LzDataSource(LZBioIndexSource)
//         .withParams(
//             bioIndexParams(
//                 index,
//                 undefined, 
//                 translator, 
//                 undefined,
//                 onLoad,
//                 onError,
//                 onResolve,
//                 initialData
//             )
//         );

//     const panel = new LzPanelClass(layout, datasource).initialize('phewas'); // 'assoc' binds both the datasource presented and the layout given uniquely
//     return panel.unwrap;
// }

</script>

<template>
    <lz-panel
        ref="panel"
        :panelClass="panelClass" 
        @updated="$event => this.panelId = $event.panelId">
    </lz-panel>
</template>