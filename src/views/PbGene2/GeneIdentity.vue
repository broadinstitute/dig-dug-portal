<template>
    <div class="pg2-identity">
        <div>
            <div class="pg2-title-line">
                <h1>{{ geneInfo.symbol }}</h1>
                <span>{{ geneInfo.location }} · {{ geneInfo.build }}</span>
            </div>
            <p class="pg2-fullname">{{ geneInfo.fullName }} · <a :href="geneHgncLink" target="_blank" rel="noopener noreferrer">HGNC {{ geneInfo.symbol }}</a></p>
            <p v-if="geneInfo.description" class="pg2-description">{{ geneInfo.description }}</p>
            <div class="pg2-reference-links">
                <a v-for="item in geneOmimLinks" :key="item.id" :href="item.href" target="_blank" rel="noopener noreferrer">OMIM {{ item.id }} <b-icon-box-arrow-up-right /></a>
                <a v-if="geneEnsemblLink" :href="geneEnsemblLink.href" target="_blank" rel="noopener noreferrer">Ensembl {{ geneEnsemblLink.id }} <b-icon-box-arrow-up-right /></a>
                <a v-if="geneRefseqLink" :href="geneRefseqLink.href" target="_blank" rel="noopener noreferrer">RefSeq {{ geneRefseqLink.id }} <b-icon-box-arrow-up-right /></a>
            </div>
        </div>
        <div class="pg2-references">
            <div class="pg2-reference-row">
                <strong>DDG2P</strong>
                <div v-if="annotation.ddg2p.support">
                    {{ annotation.ddg2p.confidenceCategories }}
                    <small>{{ annotation.ddg2p.diseaseNames }}</small>
                    <small v-if="annotation.ddg2p.allelicRequirements">{{ annotation.ddg2p.allelicRequirements }}</small>
                </div>
                <span v-else class="pg2-muted">No entry</span>
            </div>
            <div class="pg2-reference-row">
                <strong>PanelApp</strong>
                <div v-if="annotation.panelapp.greenSupport">
                    {{ annotation.panelapp.panelCount }} diagnostic-grade panel{{ annotation.panelapp.panelCount === 1 ? '' : 's' }}
                    <small>{{ panelNames.slice(0, 2).join(' · ') }}
                        <details v-if="panelNames.length > 2" class="pg2-inline-details"><summary>+{{ panelNames.length - 2 }} more</summary><div>{{ panelNames.slice(2).join(' · ') }}</div></details>
                    </small>
                    <details v-if="annotation.panelapp.modesOfInheritance" class="pg2-inheritance"><summary>Mode of inheritance</summary><small>{{ annotation.panelapp.modesOfInheritance }}</small></details>
                </div>
                <span v-else class="pg2-muted">No diagnostic-grade panel association</span>
            </div>
            <div class="pg2-reference-row">
                <strong>Pathways</strong>
                <div v-if="pathwayDetailItems.length">
                    {{ pathwayDetailItems[0].name }}
                    <details v-if="pathwayDetailItems.length > 1" class="pg2-inline-details"><summary>+{{ pathwayDetailItems.length - 1 }} more</summary>
                        <ul><li v-for="item in pathwayDetailItems.slice(1)" :key="item.source + item.name">{{ item.name }} <small>{{ item.source }}</small></li></ul>
                    </details>
                </div>
                <span v-else class="pg2-muted">No annotation</span>
            </div>
            <details class="pg2-source"><summary>Reference sources</summary><p>DDG2P · Genomics England PanelApp · Reactome / WikiPathways. Source: gene_annotation_summary. Release/download date is not supplied by this reference bundle.</p></details>
        </div>
    </div>
</template>
<script>
import GeneIdentityPanel from "../PbGene/GeneIdentityPanel";
export default {
    name: "Gene2Identity",
    extends: GeneIdentityPanel,
    computed: {
        annotation() { return this.geneInfo.referenceAnnotation; },
        panelNames() { return String(this.annotation.panelapp.panelNames || "").split(";").map(value => value.trim()).filter(Boolean); },
    },
};
</script>
