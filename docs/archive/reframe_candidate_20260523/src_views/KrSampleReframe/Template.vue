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
                        <strong>Sample search</strong>
                    </div>
                    <reframe-context-control
                        baseline-question="What are this sample's phenotype and genotype characteristics, and where does it lie within the CRDC cohort?"
                        baseline-purpose="Establish the searched sample profile, then inspect disease references, similar patients, cohort groups, genes, and variants."
                        active-question="How well does this sample match the active HPO context, and which patients, groups, diseases, genes, or variants support that context?"
                        active-purpose="Use the active HPO context as a clinical hypothesis while keeping sample similarity and context match as separate evidence."
                        @focus-changed="clinicalFocus = $event"
                    ></reframe-context-control>
                </div>

                <span class="glens-reframe-candidate-label">reframe candidate layout</span>

                <section class="glens-reframe-card">
                    <p class="glens-reframe-eyebrow">Searched sample</p>
                    <h1>{{ displaySampleId }}</h1>
                    <div class="glens-reframe-kv">
                        <span>Sex</span><span>{{ sample.sex }}</span>
                        <span>Age group</span><span>{{ displayAgeGroup }}</span>
                        <span>Proband</span><span>{{ sample.probandStatus }}</span>
                        <span>Affected</span><span>{{ sample.affectedStatus }}</span>
                        <span>GenDx diagnosis status</span><span>Diagnosed</span>
                        <span>Diagnosed disease</span><span>Kabuki syndrome</span>
                        <span>Diagnostic gene</span><span><a class="glens-reframe-link" href="/krVariant_reframe.html?query=KMT2D">{{ sample.gendx.gene }}</a></span>
                        <span>Diagnostic variant</span><span><a class="glens-reframe-link" :href="variantHref(sample.gendx.variantId)">{{ sample.gendx.variantId }}</a></span>
                    </div>
                </section>

                <section class="glens-reframe-card glens-reframe-summary-band" aria-label="Sample interpretation summary">
                    <p class="glens-reframe-eyebrow">Interpretation summary</p>
                    <div class="glens-reframe-summary-grid">
                        <div class="glens-reframe-summary-item">
                            <span>Sample phenotype burden</span>
                            <strong>{{ sample.overviewHpoTermCount }} HPO terms</strong>
                            <small>{{ sample.dominantPhenotypeDomain }}</small>
                        </div>
                        <div class="glens-reframe-summary-item">
                            <span>GenDx status</span>
                            <strong>Diagnosed</strong>
                            <small>{{ sample.gendx.gene }} · {{ sample.gendx.variantId }}</small>
                        </div>
                        <div class="glens-reframe-summary-item">
                            <span>Top disease profile match</span>
                            <strong>{{ topDiseaseProfile }}</strong>
                            <small>Core rare disease reference: Orphanet / HPO / OMIM</small>
                        </div>
                        <div class="glens-reframe-summary-item">
                            <span>Top phenotype group</span>
                            <strong>{{ topSimilarPhenotypeGroup }}</strong>
                            <small>Primary CRDC internal evidence from phenotype-similar samples</small>
                        </div>
                        <div class="glens-reframe-summary-item">
                            <span>Top recurrent gene / variant evidence</span>
                            <strong>{{ topRecurrentEvidence }}</strong>
                            <small>Keep same-variant recurrence and same-gene recurrence separate during review.</small>
                        </div>
                        <div v-if="hasActiveContext" class="glens-reframe-summary-item glens-reframe-summary-item--context">
                            <span>Sample-context HPO match</span>
                            <strong>{{ sampleContextSummary }}</strong>
                            <small>Active context compares against this sample HPO profile, not against variants directly.</small>
                        </div>
                    </div>
                    <p class="glens-reframe-next-step">
                        Inspect next: phenotype-similar patients and groups, then disease profile matches and gene / variant recurrence.
                    </p>
                </section>

                <section class="glens-reframe-section glens-reframe-grid">
                    <article class="glens-reframe-card">
                        <p class="glens-reframe-eyebrow">Primary CRDC internal evidence</p>
                        <h2>Sample phenotype profile</h2>
                        <p class="glens-reframe-note">
                            {{ sample.overviewHpoTermCount }} sample HPO terms. Context-overlapping terms are highlighted only when an active HPO context exists.
                        </p>
                        <div class="glens-reframe-mini-bars">
                            <div v-for="domain in sample.phenotypeDomains" :key="domain.name" class="glens-reframe-mini-bar">
                                <span>{{ domain.name }}</span>
                                <span class="glens-reframe-bar-shell"><i class="glens-reframe-bar-fill" :style="{ width: domain.width }"></i></span>
                                <span>{{ domain.count }}</span>
                            </div>
                        </div>
                        <div class="glens-reframe-term-list">
                            <span v-for="term in representativeTerms" :key="term">
                                {{ term }}<template v-if="hasActiveContext && contextTermNames.includes(termName(term))"> · match to active context</template>
                            </span>
                        </div>
                    </article>

                    <article class="glens-reframe-card">
                        <p class="glens-reframe-eyebrow">Primary CRDC internal evidence</p>
                        <h2>Sample genotype / GenDx profile</h2>
                        <div class="glens-reframe-kv">
                            <span>Candidate genes</span><span>KMT2D · CHD7 · SATB2</span>
                            <span>Rare coding variant carrier genes</span><span>{{ sample.rareCodingGenes }}</span>
                            <span>GenDx status</span><span>Diagnosed</span>
                            <span>Diagnostic gene</span><span>{{ sample.gendx.gene }}</span>
                            <span>Diagnostic variant</span><span><a class="glens-reframe-link" :href="variantHref(sample.gendx.variantId)">{{ sample.gendx.variantId }}</a></span>
                        </div>
                        <p class="glens-reframe-note">
                            GenDx is shown as reported clinical evidence, not as automatic proof for every downstream candidate.
                        </p>
                    </article>
                </section>

                <section class="glens-reframe-section glens-reframe-card">
                    <div class="glens-reframe-section-head">
                        <div>
                            <p class="glens-reframe-eyebrow">Core rare disease reference</p>
                            <h2>Disease profile matches</h2>
                            <p class="glens-reframe-note">
                                No context compares sample HPO vs disease HPO. Active context adds context vs disease and shared sample/context/disease HPO terms.
                            </p>
                        </div>
                    </div>
                    <div class="glens-reframe-table">
                        <div class="glens-reframe-table-head glens-sample-reframe-disease-row">
                            <span>Disease profile</span><span>Sample vs disease</span><span v-if="hasActiveContext">Context vs disease</span><span>Shared HPO evidence</span><span>Reference</span>
                        </div>
                        <div v-for="disease in sample.diseaseMatches" :key="disease.name" class="glens-reframe-row glens-sample-reframe-disease-row">
                            <a class="glens-reframe-link" :href="diseaseHref(disease.name)">{{ disease.name }}</a>
                            <span>{{ disease.overlap }}</span>
                            <span v-if="hasActiveContext">5 / 18 context terms</span>
                            <span>{{ disease.notes }}</span>
                            <span>Orphanet · HPO · OMIM</span>
                        </div>
                    </div>
                </section>

                <section class="glens-reframe-section glens-reframe-card">
                    <p class="glens-reframe-eyebrow">Primary CRDC internal evidence</p>
                    <h2>Similar patients / groups</h2>
                    <p class="glens-reframe-note">
                        Similarity to searched sample and match to active context are separate columns because they answer different questions.
                    </p>
                    <div class="glens-reframe-table">
                        <div class="glens-reframe-table-head glens-sample-reframe-similar-row">
                            <span>Sample</span><span>Similarity to searched sample</span><span v-if="hasActiveContext">Match to active context</span><span>Phenotype group</span><span>Investigator affinity</span>
                        </div>
                        <div v-for="row in sample.phenotypeMatches.slice(0, 4)" :key="row.sampleId" class="glens-reframe-row glens-sample-reframe-similar-row">
                            <a class="glens-reframe-link" :href="sampleHref(row.sampleId)">{{ row.sampleId }}</a>
                            <span>{{ row.similarityRank }} · {{ row.sharedPhenotypeCount }} shared terms</span>
                            <span v-if="hasActiveContext">{{ row.sharedPhenotypeCount }} context-overlap proxy</span>
                            <span>{{ row.notes }}</span>
                            <span>{{ row.investigator }}</span>
                        </div>
                    </div>
                </section>

                <section class="glens-reframe-section glens-reframe-card">
                    <p class="glens-reframe-eyebrow">Primary CRDC evidence + reference support</p>
                    <h2>Gene / variant evidence</h2>
                    <div class="glens-reframe-table">
                        <div class="glens-reframe-table-head glens-sample-reframe-gene-row">
                            <span>Gene</span><span>CRDC recurrence</span><span>Carrier phenotype overlap</span><span v-if="hasActiveContext">Carrier HPO vs context</span><span>Core reference</span><span>Secondary annotation</span>
                        </div>
                        <div v-for="gene in sample.candidateGenes" :key="gene.gene" class="glens-reframe-row glens-sample-reframe-gene-row">
                            <a class="glens-reframe-link" :href="variantHref(gene.gene)">{{ gene.gene }}</a>
                            <span>{{ gene.internalSupport }}</span>
                            <span>{{ gene.phenotypeFit }}</span>
                            <span v-if="hasActiveContext">Carrier HPO overlaps active context</span>
                            <span>{{ gene.diseaseLink }} · Orphanet/HPO/OMIM</span>
                            <span>PanelApp badge · pathway badge</span>
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
import { createKrSampleState } from "../KrSample/mockData";
import "../KrReframeCommon/style.css";
import "./style.css";

export default {
    name: "KrSampleReframeTemplate",
    components: {
        ReframeContextControl,
    },
    data() {
        return {
            ...createKrSampleState(),
            clinicalFocus: readClinicalFocus(),
        };
    },
    computed: {
        hasActiveContext() {
            return hasClinicalFocus(this.clinicalFocus);
        },
        displaySampleId() {
            const params = new URLSearchParams(window.location.search);
            return params.get("sample_id") || this.sample.sampleId;
        },
        displayAgeGroup() {
            return String(this.sample.ageGroup || "").replace("-", "–");
        },
        representativeTerms() {
            return this.sample.phenotypeDomains.flatMap((domain) => domain.representativeTerms).slice(0, 10);
        },
        contextTermNames() {
            return (this.clinicalFocus.hpoTerms || []).map((term) => term.label);
        },
        topDiseaseProfile() {
            const disease = this.sample.diseaseMatches[0];
            return disease ? `${disease.name} · ${disease.overlap}` : "No disease profile reference";
        },
        topSimilarPhenotypeGroup() {
            const match = this.sample.phenotypeMatches[0];
            return match ? `${match.notes} · ${match.sharedPhenotypeCount}` : "No similar phenotype group";
        },
        topRecurrentEvidence() {
            const gene = this.sample.candidateGenes[0];
            return gene ? `${gene.gene} · ${gene.internalSupport}` : this.sample.topCandidate;
        },
        sampleContextSummary() {
            return `${this.sample.contextComparison.overlap} · ${this.sample.contextComparison.dominantOverlapGroup}`;
        },
    },
    methods: {
        termName(term) {
            return term.replace(/\s*\[HP:[0-9]+\]/, "");
        },
        sampleHref(sampleId) {
            return `/krSample_reframe.html?sample_id=${encodeURIComponent(sampleId)}`;
        },
        variantHref(query) {
            return `/krVariant_reframe.html?query=${encodeURIComponent(query)}`;
        },
        diseaseHref(diseaseName) {
            return `/krSample_reframe.html?sample_id=${encodeURIComponent(this.displaySampleId)}&view=disease&profile=${encodeURIComponent(diseaseName)}`;
        },
    },
};
</script>
