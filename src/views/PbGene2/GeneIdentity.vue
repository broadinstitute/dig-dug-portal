<template>
    <div class="pg2-identity">
        <div>
            <div class="pg2-title-line">
                <h1>{{ geneInfo.symbol }}</h1>
                <span><span :class="{ 'pg2-unavailable': !hasInformation(geneInfo.location) }">{{ hasInformation(geneInfo.location) ? geneInfo.location : 'Location unavailable' }}</span> · <span :class="{ 'pg2-unavailable': !hasInformation(geneInfo.build) }">{{ hasInformation(geneInfo.build) ? geneInfo.build : 'Build unavailable' }}</span></span>
            </div>
            <div class="pg2-reference-links">
                <a :href="geneHgncLink" target="_blank" rel="noopener noreferrer">HGNC: {{ geneInfo.symbol }}</a>
                <a v-for="item in geneOmimLinks" :key="item.id" :href="item.href" target="_blank" rel="noopener noreferrer">OMIM: {{ item.id }} <b-icon-box-arrow-up-right /></a>
                <span v-if="!geneOmimLinks.length" class="pg2-unavailable">OMIM unavailable</span>
                <a v-if="geneEnsemblLink" :href="geneEnsemblLink.href" target="_blank" rel="noopener noreferrer">Ensembl: {{ geneEnsemblLink.id }} <b-icon-box-arrow-up-right /></a>
                <span v-else class="pg2-unavailable">Ensembl unavailable</span>
                <a v-if="geneRefseqLink" :href="geneRefseqLink.href" target="_blank" rel="noopener noreferrer">RefSeq: {{ geneRefseqLink.id }} <b-icon-box-arrow-up-right /></a>
                <span v-else class="pg2-unavailable">RefSeq unavailable</span>
            </div>
            <p class="pg2-description" :class="{ 'pg2-unavailable': !hasSummary }">{{ summaryText }}</p>
        </div>
        <div class="pg2-references">
            <h2>External reference evidence</h2>
            <div class="pg2-reference-row">
                <strong>DDG2P <help-tooltip info label="DDG2P reference source and date" :text="referenceProvenance.ddg2p.text" :links="referenceProvenance.ddg2p.links" /></strong>
                <div v-if="annotation.ddg2p.support">
                    <span :class="{ 'pg2-unavailable': !hasInformation(annotation.ddg2p.confidenceCategories) }">{{ hasInformation(annotation.ddg2p.confidenceCategories) ? annotation.ddg2p.confidenceCategories : 'Confidence unavailable' }}</span>
                    <small v-if="annotation.ddg2p.diseaseNames">{{ annotation.ddg2p.diseaseNames }}</small>
                    <small v-if="annotation.ddg2p.allelicRequirements">{{ annotation.ddg2p.allelicRequirements }}</small>
                </div>
                <span v-else class="pg2-unavailable">No entry</span>
            </div>
            <div class="pg2-reference-row">
                <strong>PanelApp <help-tooltip info label="PanelApp reference source and date" :text="referenceProvenance.panelapp.text" :links="referenceProvenance.panelapp.links" /></strong>
                <div v-if="annotation.panelapp.greenSupport">
                    {{ annotation.panelapp.panelCount }} diagnostic-grade panel{{ annotation.panelapp.panelCount === 1 ? '' : 's' }}
                </div>
                <span v-else class="pg2-unavailable">No diagnostic-grade panel association</span>
            </div>
            <div class="pg2-reference-row">
                <strong>Pathways <help-tooltip info label="Pathway reference sources and dates" :text="referenceProvenance.pathways.text" :links="referenceProvenance.pathways.links" /></strong>
                <div v-if="pathwayDetailItems.length">
                    {{ pathwayDetailItems[0].name }}
                    <details v-if="pathwayDetailItems.length > 1" class="pg2-inline-details"><summary>+{{ pathwayDetailItems.length - 1 }} more</summary>
                        <ul><li v-for="item in pathwayDetailItems.slice(1)" :key="item.source + item.name">{{ item.name }} <small>{{ item.source }}</small></li></ul>
                    </details>
                </div>
                <span v-else class="pg2-unavailable">No annotation</span>
            </div>
        </div>
    </div>
</template>
<script>
import GeneIdentityPanel from "../PbGene/GeneIdentityPanel";
import HelpTooltip from "./HelpTooltip";
import { GENE_REFERENCE_SOURCES } from "./referenceProvenance";
export default {
    name: "Gene2Identity",
    extends: GeneIdentityPanel,
    components: { HelpTooltip },
    computed: {
        referenceProvenance() { return GENE_REFERENCE_SOURCES; },
        annotation() {
            const annotation = this.geneInfo.referenceAnnotation || {};
            return { ...annotation, ddg2p: annotation.ddg2p || {}, panelapp: annotation.panelapp || {} };
        },
        hasSummary() { return this.hasInformation(this.geneInfo.description); },
        summaryText() { return this.hasSummary ? this.geneInfo.description : 'NCBI summary unavailable'; },
    },
    methods: {
        hasInformation(value) {
            const text = value == null ? '' : String(value).trim();
            return Boolean(text) && !/^(?:unavailable\b.*|(?:NCBI )?summary unavailable|no summary available|not available|n\/?a|none|null|undefined|[-–—])$/i.test(text);
        },
    },
};
</script>
