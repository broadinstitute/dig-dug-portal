<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body glens-reframe-page">
            <main class="glens-reframe-shell">
                <div class="glens-reframe-topbar">
                    <div class="glens-reframe-workflow">
                        <span>Current workflow</span>
                        <strong>Phenotype search</strong>
                    </div>
                    <reframe-context-control
                        baseline-question="Which patients, groups, diseases, genes, and variants are associated with this searched phenotype profile?"
                        baseline-purpose="Use the searched HPO profile to retrieve CRDC samples and groups, then overlay disease, gene, and variant evidence."
                        active-question="How does the searched phenotype profile relate to the active HPO context, and which patients, groups, diseases, genes, or variants are supported by both?"
                        active-purpose="Keep the searched phenotype HPO set and the active context HPO set visually separate, then compare their shared support."
                        @focus-changed="clinicalFocus = $event"
                    ></reframe-context-control>
                </div>

                <span class="glens-reframe-candidate-label">reframe candidate layout</span>

                <section class="glens-reframe-card">
                    <p class="glens-reframe-eyebrow">Phenotype query header</p>
                    <h1>Query phenotype profile</h1>
                    <div class="glens-phenotype-reframe-query-grid">
                        <div>
                            <h2>Searched HPO terms</h2>
                            <div class="glens-reframe-term-list">
                                <span v-for="term in phenotype.queryTerms.exact" :key="term.id">{{ term.label }} [{{ term.id }}]</span>
                            </div>
                        </div>
                        <div v-if="hasActiveContext">
                            <h2>Active context HPO terms</h2>
                            <div class="glens-reframe-term-list">
                                <span v-for="term in activeContextTerms" :key="term.id || term.label">
                                    {{ term.label }}<template v-if="term.id"> [{{ term.id }}]</template>
                                </span>
                            </div>
                        </div>
                    </div>
                    <p class="glens-reframe-note">
                        The searched phenotype profile and active context are both HPO sets. They are displayed separately and are not merged into one query.
                    </p>
                </section>

                <section class="glens-reframe-card glens-reframe-summary-band" aria-label="Phenotype interpretation summary">
                    <p class="glens-reframe-eyebrow">Interpretation summary</p>
                    <div class="glens-reframe-summary-grid">
                        <div class="glens-reframe-summary-item">
                            <span>What was searched</span>
                            <strong>{{ searchedHpoTerms }}</strong>
                            <small>User-entered HPO profile; exact, related, and broad HPO terms are scored differently.</small>
                        </div>
                        <div class="glens-reframe-summary-item">
                            <span>Matched CRDC samples</span>
                            <strong>{{ phenotype.headline[0].value }}</strong>
                            <small>Primary CRDC internal evidence from weighted phenotype-profile matching.</small>
                        </div>
                        <div class="glens-reframe-summary-item">
                            <span>Closest phenotype group</span>
                            <strong>{{ closestPhenotypeGroup }}</strong>
                            <small>Phenotype cluster signal; kept separate from genotype recurrence.</small>
                        </div>
                        <div class="glens-reframe-summary-item">
                            <span>Top co-occurring phenotypes</span>
                            <strong>{{ topCoOccurringPhenotypes }}</strong>
                            <small>Additional HPO terms recurring among phenotype-matched CRDC samples.</small>
                        </div>
                        <div class="glens-reframe-summary-item">
                            <span>Overlapping disease domains</span>
                            <strong>{{ overlappingDiseaseDomains }}</strong>
                            <small>Core rare disease reference support from Orphanet / HPO / OMIM profiles.</small>
                        </div>
                        <div class="glens-reframe-summary-item">
                            <span>Top candidate genes / variants</span>
                            <strong>{{ topCandidateGenes }}</strong>
                            <small>CRDC recurrence and reference support are shown as separate evidence fields below.</small>
                        </div>
                        <div v-if="hasActiveContext" class="glens-reframe-summary-item glens-reframe-summary-item--context">
                            <span>Query-context HPO overlap</span>
                            <strong>{{ queryContextOverlap }}</strong>
                            <small>The searched HPO set and active context HPO set remain visually separate.</small>
                        </div>
                    </div>
                    <p class="glens-reframe-next-step">
                        Inspect next: matched CRDC samples and groups, then disease profile matches and candidate genes / variants.
                    </p>
                </section>

                <section class="glens-reframe-section glens-reframe-card">
                    <p class="glens-reframe-eyebrow">Primary CRDC internal evidence</p>
                    <h2>Matched samples</h2>
                    <div class="glens-reframe-table">
                        <div class="glens-reframe-table-head glens-phenotype-reframe-sample-row">
                            <span>Sample</span><span>Adjusted phenotype score</span><span>Metadata summary</span><span>Candidate signals</span><span v-if="hasActiveContext">Supported by query + context</span>
                        </div>
                        <div v-for="sample in phenotype.topSamples" :key="sample.id" class="glens-reframe-row glens-phenotype-reframe-sample-row">
                            <a class="glens-reframe-link" :href="sampleHref(sample.id)">{{ sample.id }}</a>
                            <span>{{ sample.rawScore }} · residual {{ sample.residual }}</span>
                            <span>{{ sample.sex }} · {{ sample.ageBand }} · {{ sample.investigator }}</span>
                            <span>{{ sample.signals }}</span>
                            <span v-if="hasActiveContext">Shared HPO terms reviewed separately</span>
                        </div>
                    </div>
                </section>

                <section class="glens-reframe-section glens-reframe-grid">
                    <article class="glens-reframe-card">
                        <p class="glens-reframe-eyebrow">Primary CRDC internal evidence</p>
                        <h2>Matched groups</h2>
                        <p class="glens-reframe-note">
                            Phenotype-defined patient groups and investigator phenotype-signature matches.
                        </p>
                        <div class="glens-reframe-mini-bars">
                            <div v-for="group in phenotype.residualGroups" :key="group.name" class="glens-reframe-mini-bar">
                                <span>{{ group.name }}</span>
                                <span class="glens-reframe-bar-shell"><i class="glens-reframe-bar-fill" :style="{ width: group.selected }"></i></span>
                                <span>{{ group.extreme }}</span>
                            </div>
                        </div>
                    </article>

                    <article class="glens-reframe-card">
                        <p class="glens-reframe-eyebrow">Related phenotypes</p>
                        <h2>Co-occurring HPO terms</h2>
                        <p class="glens-reframe-note">
                            Additional phenotype terms recurring among phenotype-matched CRDC samples.
                        </p>
                        <div class="glens-reframe-term-list">
                            <span v-for="term in phenotype.coObserved.slice(0, 5)" :key="term.label">
                                {{ term.label }} · {{ term.count }}
                            </span>
                        </div>
                    </article>
                </section>

                <section class="glens-reframe-section glens-reframe-card">
                    <p class="glens-reframe-eyebrow">Core rare disease reference</p>
                    <h2>Disease profile matches</h2>
                    <p class="glens-reframe-note">
                        No context compares query phenotype vs disease HPO. Active context adds context vs disease and shared query/context/disease terms.
                    </p>
                    <div class="glens-reframe-table">
                        <div class="glens-reframe-table-head glens-phenotype-reframe-disease-row">
                            <span>Disease profile</span><span>Query vs disease</span><span v-if="hasActiveContext">Context vs disease</span><span>Linked genes</span><span>Reference source</span>
                        </div>
                        <div v-for="disease in phenotype.diseaseCandidates" :key="disease.disease" class="glens-reframe-row glens-phenotype-reframe-disease-row">
                            <span>{{ disease.disease }}</span>
                            <span>{{ disease.profileMatch }}</span>
                            <span v-if="hasActiveContext">Context-disease HPO overlap displayed separately</span>
                            <span>
                                <a
                                    v-for="gene in disease.linkedGenes"
                                    :key="`${disease.disease}-${gene}`"
                                    class="glens-reframe-link glens-phenotype-reframe-gene-link"
                                    :href="variantHref(gene)"
                                >
                                    {{ gene }}
                                </a>
                            </span>
                            <span>{{ disease.externalAnnotation }}</span>
                        </div>
                    </div>
                </section>

                <section class="glens-reframe-section glens-reframe-card">
                    <p class="glens-reframe-eyebrow">Candidate genes / variants</p>
                    <h2>Primary CRDC evidence + rare disease reference + secondary badges</h2>
                    <div class="glens-reframe-table">
                        <div class="glens-reframe-table-head glens-phenotype-reframe-gene-row">
                            <span>Gene / variant</span><span>HPO gene annotation</span><span>Orphanet / OMIM support</span><span>CRDC recurrence</span><span>Candidate label</span><span>Secondary annotation</span>
                        </div>
                        <div v-for="gene in phenotype.geneCandidates" :key="gene.gene" class="glens-reframe-row glens-phenotype-reframe-gene-row">
                            <a class="glens-reframe-link" :href="variantHref(gene.gene)">{{ gene.gene }}</a>
                            <span>{{ gene.profileMatch }}</span>
                            <span>{{ gene.externalAnnotation }}</span>
                            <span>{{ gene.cohortCarrierEvidence }}</span>
                            <span>{{ gene.externalAnnotation.includes('Orphanet') || gene.externalAnnotation.includes('OMIM') ? 'Reference supported candidate' : 'Uncurated recurrent candidate' }}</span>
                            <span>PanelApp / Reactome / WikiPathways badges only</span>
                        </div>
                    </div>
                    <div class="glens-reframe-table glens-phenotype-reframe-variant-table">
                        <div class="glens-reframe-table-head glens-phenotype-reframe-variant-row">
                            <span>Variant</span><span>Gene</span><span>Carriers among matched samples</span><span>Carrier phenotype fit</span><span>Annotation</span>
                        </div>
                        <div v-for="variant in phenotype.candidateVariants" :key="variant.id" class="glens-reframe-row glens-phenotype-reframe-variant-row">
                            <a class="glens-reframe-link" :href="variantHref(variant.gene)">{{ variant.id }}</a>
                            <a class="glens-reframe-link" :href="variantHref(variant.gene)">{{ variant.gene }}</a>
                            <span>{{ variant.carriers }}</span>
                            <span>{{ variant.coherence }}</span>
                            <span>{{ variant.pathogenicity }}</span>
                        </div>
                    </div>
                </section>
            </main>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<script>
import ReframeContextControl from "../KrReframeCommon/ReframeContextControl.vue";
import { hasClinicalFocus } from "../KrClinicalFocus/focusComparison";
import { readClinicalFocus } from "../KrClinicalFocus/focusStore";
import { createKrPhenotypeState } from "../KrPhenotype/mockData";
import "../KrReframeCommon/style.css";
import "./style.css";

export default {
    name: "KrPhenotypeReframeTemplate",
    components: {
        ReframeContextControl,
    },
    data() {
        return {
            ...createKrPhenotypeState(),
            clinicalFocus: readClinicalFocus(),
        };
    },
    computed: {
        hasActiveContext() {
            return hasClinicalFocus(this.clinicalFocus);
        },
        activeContextTerms() {
            return (this.clinicalFocus.hpoTerms || []).slice(0, 6);
        },
        searchedHpoTerms() {
            return this.phenotype.queryTerms.exact.map((term) => `${term.label} [${term.id}]`).join(" + ");
        },
        closestPhenotypeGroup() {
            const group = this.phenotype.headline.find((item) => item.label === "Dominant phenotype structure");
            return group ? group.value : "No phenotype group";
        },
        topCoOccurringPhenotypes() {
            return this.phenotype.coObserved.slice(0, 3).map((term) => term.label).join(" · ");
        },
        overlappingDiseaseDomains() {
            return this.phenotype.diseaseCandidates.slice(0, 2).map((disease) => disease.disease).join(" · ");
        },
        topCandidateGenes() {
            return this.phenotype.candidateEvidenceSummary
                .map((item) => {
                    const sourceLabel = item.sources.length > 1 ? item.sources.join(" | ") : item.sources[0];
                    return `${item.gene} [${sourceLabel}]`;
                })
                .join(" · ");
        },
        queryContextOverlap() {
            const queryLabels = this.phenotype.queryTerms.exact.map((term) => term.label);
            const contextLabels = (this.clinicalFocus.hpoTerms || []).map((term) => term.label);
            const shared = queryLabels.filter((label) => contextLabels.includes(label));
            return shared.length ? `${shared.length} / ${queryLabels.length} searched HPO terms overlap active context` : `0 / ${queryLabels.length} searched HPO terms overlap active context`;
        },
    },
    methods: {
        sampleHref(sampleId) {
            return `/krSample_reframe.html?sample_id=${encodeURIComponent(sampleId)}`;
        },
        variantHref(query) {
            return `/krVariant_reframe.html?query=${encodeURIComponent(query)}`;
        },
    },
};
</script>
