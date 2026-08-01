<template>
    <div class="pbg-hero-identity">
        <div class="pbg-gene-title-row">
            <h1 class="pbg-gene-symbol">{{ geneInfo.symbol }}</h1>
        </div>
        <p class="pbg-gene-fullname">
            <a class="pbg-gene-fullname-link"
               :href="geneHgncLink"
               target="_blank"
               rel="noopener noreferrer"
               :aria-label="'Open the HGNC symbol report for ' + geneInfo.symbol + ' in a new tab'">
                <span>HGNC:</span> {{ geneInfo.fullName }}
            </a>
        </p>
        <p v-if="geneInfo.description" class="pbg-gene-description"><span>NCBI:</span> {{ geneInfo.description }}</p>
        <p class="pbg-gene-location">{{ geneInfo.location }} <span>{{ geneInfo.build }}</span></p>

        <div class="pbg-gene-meta-row">
            <a v-for="item in geneOmimLinks"
               :key="'omim-' + item.id"
               class="pbg-meta-pill pbg-meta-pill--link"
               :href="item.href"
               target="_blank"
               rel="noopener noreferrer"
               :aria-label="'Open OMIM gene entry ' + item.id + ' in a new tab'">
                OMIM {{ item.id }} ↗
            </a>
            <span v-if="!geneOmimLinks.length" class="pbg-meta-pill">OMIM Unavailable</span>
            <a v-if="geneEnsemblLink"
               class="pbg-meta-pill pbg-meta-pill--link"
               :href="geneEnsemblLink.href"
               target="_blank"
               rel="noopener noreferrer"
               :aria-label="'Open Ensembl gene entry ' + geneEnsemblLink.id + ' in a new tab'">
                Ensembl {{ geneEnsemblLink.id }} ↗
            </a>
            <span v-else class="pbg-meta-pill">Ensembl Unavailable</span>
            <a v-if="geneRefseqLink"
               class="pbg-meta-pill pbg-meta-pill--link"
               :href="geneRefseqLink.href"
               target="_blank"
               rel="noopener noreferrer"
               :aria-label="'Open NCBI RefSeq transcript ' + geneRefseqLink.id + ' in a new tab'">
                RefSeq {{ geneRefseqLink.id }} ↗
            </a>
            <span v-else class="pbg-meta-pill">RefSeq Unavailable</span>
        </div>

        <table class="pbg-ref-table">
            <tbody>
                <tr>
                    <td class="pbg-ref-source">DDG2P</td>
                    <td>
                        <span v-if="geneInfo.referenceAnnotation.ddg2p.support" class="pbg-ref-val pbg-ref-val--pos">
                            {{ geneInfo.referenceAnnotation.ddg2p.confidenceCategories }}
                            · {{ geneInfo.referenceAnnotation.ddg2p.diseaseNames }}
                        </span>
                        <span v-else class="pbg-ref-val pbg-ref-val--none">No entry</span>
                    </td>
                </tr>
                <tr>
                    <td class="pbg-ref-source"
                        title="Diagnostic-grade panels contain expert-reviewed genes with strong evidence for a specific disorder and can support clinical diagnosis.">PanelApp</td>
                    <td>
                        <span v-if="geneInfo.referenceAnnotation.panelapp.greenSupport" class="pbg-ref-val pbg-ref-val--pos">
                            {{ geneInfo.referenceAnnotation.panelapp.panelCount }} diagnostic-grade
                            panel{{ geneInfo.referenceAnnotation.panelapp.panelCount === 1 ? '' : 's' }}
                            <small v-if="geneInfo.referenceAnnotation.panelapp.panelNames" class="pbg-ref-detail">
                                {{ geneInfo.referenceAnnotation.panelapp.panelNames }}
                            </small>
                            <small v-if="geneInfo.referenceAnnotation.panelapp.modesOfInheritance" class="pbg-ref-detail">
                                MOI: {{ geneInfo.referenceAnnotation.panelapp.modesOfInheritance }}
                            </small>
                        </span>
                        <span v-else class="pbg-ref-val pbg-ref-val--none">No diagnostic-grade panel association found</span>
                        <small class="pbg-ref-detail">Source: Genomics England PanelApp</small>
                    </td>
                </tr>
                <tr>
                    <td class="pbg-ref-source">Pathway</td>
                    <td>
                        <div v-if="geneInfo.referenceAnnotation.pathways.count > 0" class="pbg-ref-val pbg-ref-val--pathway">
                            <span>{{ geneInfo.referenceAnnotation.pathways.displayNames.join(" · ") }}</span>
                            <button v-if="geneInfo.referenceAnnotation.pathways.moreCount > 0"
                                    class="pbg-ref-more"
                                    type="button"
                                    :aria-expanded="showPathwayDetails ? 'true' : 'false'"
                                    @click="showPathwayDetails = !showPathwayDetails">
                                +{{ geneInfo.referenceAnnotation.pathways.moreCount }} more
                            </button>
                            <div v-if="showPathwayDetails" class="pbg-pathway-list">
                                <div v-for="item in pathwayDetailItems" :key="item.source + '-' + item.name" class="pbg-pathway-item">
                                    <span>{{ item.source }}</span>
                                    <strong>{{ item.name }}</strong>
                                </div>
                            </div>
                        </div>
                        <span v-else class="pbg-ref-val pbg-ref-val--none">No annotation</span>
                    </td>
                </tr>
            </tbody>
        </table>
        <p class="pbg-ref-source-note">Source: gene_annotation_summary (DDG2P / Genomics England PanelApp / Reactome / WikiPathways)</p>
    </div>
</template>

<script>
export default {
    name: "GeneIdentityPanel",
    props: {
        geneInfo: { type: Object, required: true },
    },
    data() {
        return { showPathwayDetails: false };
    },
    computed: {
        geneHgncLink() {
            return `https://www.genenames.org/data/gene-symbol-report/#!/symbol/${encodeURIComponent(this.geneInfo.symbol)}`;
        },
        geneOmimLinks() {
            return String(this.geneInfo.omim || "")
                .split(",")
                .map(id => id.trim())
                .filter(id => /^\d+$/.test(id))
                .map(id => ({ id, href: `https://omim.org/entry/${encodeURIComponent(id)}` }));
        },
        geneEnsemblLink() {
            const id = String(this.geneInfo.ensemblId || "").trim();
            return /^ENSG\d+$/.test(id)
                ? { id, href: `https://www.ensembl.org/Homo_sapiens/Gene/Summary?g=${encodeURIComponent(id)}` }
                : null;
        },
        geneRefseqLink() {
            const maneRefseq = String(this.geneInfo.maneSelect || "").split("|")
                .find(value => /^N[MR]_\d+(?:\.\d+)?$/.test(value));
            const id = maneRefseq || String(this.geneInfo.refseqAccession || "").split(",")[0].trim();
            return /^N[MR]_\d+(?:\.\d+)?$/.test(id)
                ? { id, href: `https://www.ncbi.nlm.nih.gov/nuccore/${encodeURIComponent(id)}` }
                : null;
        },
        pathwayDetailItems() {
            const pathways = (this.geneInfo.referenceAnnotation || {}).pathways || {};
            const items = Array.isArray(pathways.items) && pathways.items.length
                ? pathways.items
                : (pathways.allNames || pathways.displayNames || []).map(name => ({ name }));
            return items.map(item => {
                const raw = item.raw || item.name || "";
                return {
                    source: item.source || (String(raw).indexOf("WP_") === 0 || /wikipath/i.test(raw) ? "WikiPathways" : "Reactome"),
                    name: item.name || item.raw || "",
                };
            });
        },
    },
};
</script>
