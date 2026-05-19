<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body glens-page">
            <main class="glens-sample" :class="{ 'glens-large-text': largeText }">
                <div class="glens-access-toolbar" aria-label="Display options">
                    <div class="glens-page-mode-label" aria-label="Current workflow">
                        <span>Workflow</span>
                        <strong>Sample search</strong>
                        <div class="glens-sample-info-tool" @click.stop>
                            <button
                                class="glens-sample-info-button"
                                type="button"
                                aria-label="Sample search explanation"
                                @click="sampleInfoOpen = !sampleInfoOpen"
                            >
                                i
                            </button>
                            <div v-if="sampleInfoOpen" class="glens-sample-info-popover">
                                <button
                                    class="glens-sample-info-close"
                                    type="button"
                                    aria-label="Close sample search explanation"
                                    @click="sampleInfoOpen = false"
                                >
                                    ×
                                </button>
                                <p>
                                    Similar-patient search excludes this sample itself. The main score asks which other CRDC samples best reproduce this sample's HPO profile; rarer HPO terms contribute more than common broad terms.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="glens-result-tools">
                        <div class="glens-result-context-tool" @click.stop>
                            <button
                                class="glens-result-tool-button"
                                type="button"
                                @click="contextPopoverOpen = !contextPopoverOpen; optionsPopoverOpen = false"
                            >
                                Edit Context
                            </button>
                            <div v-if="contextPopoverOpen" class="glens-result-context-popover">
                                <button
                                    class="glens-result-popover-close"
                                    type="button"
                                    aria-label="Close context editor"
                                    @click="contextPopoverOpen = false"
                                >
                                    ×
                                </button>
                                <clinical-focus-bar
                                    class="glens-result-focus-bar"
                                    :open-editor-on-mount="true"
                                    :hide-summary="true"
                                    @focus-confirmed="contextPopoverOpen = false"
                                    @focus-cancelled="contextPopoverOpen = false"
                                ></clinical-focus-bar>
                                <button
                                    v-if="hasActiveContext"
                                    class="glens-result-remove-context"
                                    type="button"
                                    @click="removeClinicalContext"
                                >
                                    Remove Context
                                </button>
                            </div>
                        </div>
                        <div class="glens-result-options-tool" @click.stop>
                            <button
                                class="glens-result-options-button"
                                type="button"
                                aria-label="Options"
                                @click="optionsPopoverOpen = !optionsPopoverOpen; contextPopoverOpen = false"
                            >
                                ⋮
                            </button>
                            <div v-if="optionsPopoverOpen" class="glens-result-options-popover">
                                <button
                                    class="glens-result-popover-close"
                                    type="button"
                                    aria-label="Close options"
                                    @click="optionsPopoverOpen = false"
                                >
                                    ×
                                </button>
                                <label class="glens-text-toggle glens-text-toggle--popover">
                                    <input v-model="largeText" type="checkbox" />
                                    Large text
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <section class="glens-hero-card">
                    <div class="glens-identity">
                        <h1>{{ displaySampleId }}</h1>
                        <div class="glens-sample-header-meta" aria-label="Sample metadata summary">
                            <span>{{ sample.sex }} | Age {{ displayAgeGroup }} | GenDx: {{ sample.gendx.shortStatus }}</span>
                            <span>{{ sample.hpoTotal }} HPO terms | {{ sample.rareCodingGenes }} genes with rare coding variants</span>
                        </div>
                    </div>

                    <div class="glens-answer-grid">
                        <article v-for="answer in topAnswers" :key="answer.label" class="glens-answer-card">
                            <span>{{ answer.label }}</span>
                            <strong>{{ answer.value }}</strong>
                            <p>{{ answer.text }}</p>
                        </article>
                    </div>
                </section>

                <section class="glens-tab-card">
                    <nav class="glens-tab-strip" aria-label="Sample evidence sections">
                        <button
                            v-for="tab in tabs"
                            :key="tab.id"
                            type="button"
                            class="glens-tab-button"
                            :class="{ 'glens-tab-button--active': activeTab === tab.id }"
                            @click="activeTab = tab.id"
                        >
                            {{ tab.label }}
                        </button>
                    </nav>

                    <section v-if="activeTab === 'overview'" class="glens-tab-panel">
                        <div class="glens-overview-layout">
                            <article class="glens-panel glens-panel--wide">
                                <div class="glens-section-head">
                                    <div>
                                        <p class="glens-eyebrow">Cohort position</p>
                                        <h2>Who is closest to this sample, and which investigator phenotype signatures fit this sample?</h2>
                                    </div>
                                </div>

                                <p class="glens-method-note">
                                    Score basis: similar-patient retrieval uses raw weighted phenotype similarity with self excluded. Investigator context is a separate signature-affinity analysis: each investigator group contributes an enriched HPO signature, and this sample is scored against those group signatures using annotation-burden-corrected z-scores.
                                </p>
                                <div class="glens-sim-mode-panel glens-sim-mode-panel--overview">
                                    <span>Similarity basis</span>
                                    <strong>Phenotype-based</strong>
                                </div>

                                <div class="glens-position-list">
                                    <div v-for="position in sample.positionMetrics" :key="position.label" class="glens-position-row">
                                        <button type="button" class="glens-position-summary" @click="toggleMetric(position.label)">
                                            <i>{{ openMetrics[position.label] ? "▾" : "▸" }}</i>
                                            <strong>{{ position.label }}</strong>
                                            <span>{{ position.value }}</span>
                                        </button>
                                        <p v-if="openMetrics[position.label]" class="glens-position-explain">{{ position.text }}</p>
                                    </div>
                                </div>

                                <div class="glens-affinity-box">
                                    <div class="glens-affinity-head">
                                        <div>
                                            <strong>Investigator phenotype-signature affinity</strong>
                                            <button type="button" class="glens-affinity-method" @click="affinityMethodOpen = !affinityMethodOpen">
                                                <i>{{ affinityMethodOpen ? "▾" : "▸" }}</i>
                                                {{ sample.groupScanSummary }}
                                            </button>
                                        </div>
                                        <em>Top 3 shown</em>
                                    </div>
                                    <p v-if="affinityMethodOpen" class="glens-source-note">
                                        Each investigator group is converted into a phenotype signature from HPO terms enriched in that group. {{ sample.sampleId }} is scored against every group signature, corrected for HPO annotation burden, and standardized against all CRDC samples for that signature. z = 0 means average similarity to that group signature; higher z means the sample is more group-like.
                                    </p>
                                    <div class="glens-affinity-columns">
                                        <span>Rank</span>
                                        <span>Investigator</span>
                                        <div class="glens-affinity-scale">
                                            <span>less group-like</span>
                                            <div class="glens-affinity-ruler" aria-hidden="true">
                                                <span>0</span>
                                            </div>
                                            <span>more group-like</span>
                                        </div>
                                        <span>z-score</span>
                                    </div>
                                    <div class="glens-affinity-list">
                                        <div v-for="group in sample.groupAffinityTop" :key="group.label" class="glens-affinity-row">
                                            <span class="glens-affinity-rank">{{ group.rank }}</span>
                                            <strong>{{ group.label }}</strong>
                                            <div class="glens-affinity-track" :aria-label="group.zScore">
                                                <i></i>
                                                <b :style="{ left: group.dotLeft }"></b>
                                            </div>
                                            <span>{{ group.zScore }}</span>
                                        </div>
                                    </div>
                                    <div class="glens-affinity-select">
                                        <label for="investigator-affinity-select">Inspect one investigator group</label>
                                        <select id="investigator-affinity-select" v-model="selectedInvestigatorGroup">
                                            <option v-for="group in allInvestigatorOptions" :key="group.label" :value="group.label">
                                                {{ group.label }}
                                            </option>
                                        </select>
                                        <p v-if="selectedInvestigatorAffinity">
                                            Rank {{ selectedInvestigatorAffinity.rank }} · z-score {{ selectedInvestigatorAffinity.zScore }}
                                        </p>
                                    </div>
                                </div>
                            </article>

                            <article class="glens-panel">
                                <div class="glens-section-head">
                                    <div>
                                        <p class="glens-eyebrow">Sample overview</p>
                                        <h2>Identity, phenotype load, and existing evidence</h2>
                                    </div>
                                </div>

                                <div class="glens-kv-grid">
                                    <div v-for="item in overviewItems" :key="item.label" class="glens-kv-row">
                                        <span>{{ item.label }}</span>
                                        <strong>{{ item.value }}</strong>
                                    </div>
                                </div>

                                <div class="glens-gendx-card">
                                    <div>
                                        <span>GenDX panel result</span>
                                        <strong>{{ sample.gendx.status }}</strong>
                                    </div>
                                    <div class="glens-gendx-evidence">
                                        <div>
                                            <span>Gene</span>
                                            <strong>{{ sample.gendx.gene }}</strong>
                                        </div>
                                        <div>
                                            <span>Variant</span>
                                            <strong>{{ sample.gendx.variantId }}</strong>
                                        </div>
                                        <div>
                                            <span>Pathogenicity</span>
                                            <strong>{{ sample.gendx.pathogenicity }}</strong>
                                        </div>
                                    </div>
                                    <p>{{ sample.gendx.interpretation }}</p>
                                    <a :href="variantHref(sample.gendx.variantId)">Review reported variant</a>
                                </div>
                            </article>
                        </div>
                    </section>

                    <section v-if="activeTab === 'phenotype'" class="glens-tab-panel">
                        <div class="glens-section-head">
                            <div>
                                <p class="glens-eyebrow">Phenotype similarity</p>
                                <h2>Who looks most like this sample?</h2>
                            </div>
                            <a class="glens-plain-link" :href="phenotypeQueryHref">Open phenotype workflow</a>
                        </div>
                        <p class="glens-method-note">
                            The searched sample is not compared to itself here. Rows show other CRDC samples ranked by raw weighted phenotype similarity: query-term overlap, rare phenotype weight, and semantic/related-term consistency. Residual is not used for this nearest-patient ranking.
                        </p>
                        <div class="glens-similar-table">
                            <div class="glens-table-head glens-table-head--phenotype">
                                <span>Sample</span>
                                <span>Similarity rank</span>
                                <span>Shared phenotype signal</span>
                                <span>Diagnosis</span>
                                <span>Best genetic clue</span>
                                <span>Why it matters</span>
                            </div>
                            <a
                                v-for="row in sample.phenotypeMatches"
                                :key="row.sampleId"
                                class="glens-table-row glens-table-row--phenotype"
                                :href="sampleHref(row.sampleId)"
                            >
                                <strong>{{ row.sampleId }}</strong>
                                <span>{{ row.similarityRank }}</span>
                                <span>{{ row.sharedSymptoms }}</span>
                                <span>{{ row.diagnosis }}</span>
                                <span>{{ row.topSignal }}</span>
                                <span>{{ row.notes }}</span>
                            </a>
                        </div>

                        <button class="glens-accordion-toggle" type="button" @click="togglePanel('phenotypeProfile')">
                            <span>{{ openPanels.phenotypeProfile ? "▾" : "▸" }}</span>
                            Phenotype profile composition
                        </button>
                        <div v-if="openPanels.phenotypeProfile" class="glens-accordion-body">
                            <div class="glens-domain-stack-grid" aria-label="Phenotype category composition">
                                <article v-for="domain in sample.phenotypeDomains" :key="domain.name" class="glens-domain-stack-card">
                                    <div class="glens-domain-stack-plot" aria-hidden="true">
                                        <div class="glens-domain-stack-fill" :style="{ height: domain.width }"></div>
                                    </div>
                                    <div class="glens-domain-stack-copy">
                                        <strong>{{ domain.name }}</strong>
                                        <span>{{ domain.count }} / {{ sample.hpoTotal }} HPO terms</span>
                                        <div class="glens-term-grid glens-term-grid--compact">
                                            <span v-for="term in domain.representativeTerms" :key="term">{{ term }}</span>
                                        </div>
                                    </div>
                                </article>
                            </div>

                            <button class="glens-accordion-toggle glens-accordion-toggle--small" type="button" @click="togglePanel('allHpo')">
                                <span>{{ openPanels.allHpo ? "▾" : "▸" }}</span>
                                Full HPO term list
                            </button>
                            <div v-if="openPanels.allHpo" class="glens-term-grid glens-term-grid--full">
                                <span v-for="term in sample.fullHpoTerms" :key="term">{{ term }}</span>
                            </div>
                        </div>
                    </section>

                    <section v-if="activeTab === 'genotype'" class="glens-tab-panel">
                        <div class="glens-section-head">
                            <div>
                                <p class="glens-eyebrow">Genotype similarity</p>
                                <h2>Who shares a relevant genetic mechanism?</h2>
                            </div>
                        </div>
                        <p class="glens-method-note">
                            This is genotype-first context for the same searched sample. Exact same variant, same gene, and same mechanism are separated because they imply different evidence strength and should not be interpreted as equivalent.
                        </p>

                        <div class="glens-genotype-groups">
                            <article v-for="group in sample.genotypeGroups" :key="group.label" class="glens-genotype-card">
                                <button class="glens-genotype-head" type="button" @click="toggleGenotypeGroup(group.label)">
                                    <span>{{ openGenotypeGroups[group.label] ? "▾" : "▸" }}</span>
                                    <strong>{{ group.label }}</strong>
                                    <small>{{ group.summary }}</small>
                                </button>
                                <div v-if="openGenotypeGroups[group.label]" class="glens-similar-table glens-similar-table--compact">
                                    <div class="glens-table-head glens-table-head--genotype">
                                        <span>Sample</span>
                                        <span>Genetic similarity</span>
                                        <span>Shared gene / class</span>
                                        <span>Phenotype overlap</span>
                                        <span>Diagnosis</span>
                                        <span>Key phenotypes</span>
                                    </div>
                                    <a
                                        v-for="row in group.rows"
                                        :key="row.sampleId"
                                        class="glens-table-row glens-table-row--genotype"
                                        :href="row.sampleId === 'none' ? '#' : sampleHref(row.sampleId)"
                                    >
                                        <strong>{{ row.sampleId }}</strong>
                                        <span>{{ row.similarity }}</span>
                                        <span>{{ row.sharedSignal }}</span>
                                        <span>{{ row.phenotypeOverlap }}</span>
                                        <span>{{ row.diagnosis }}</span>
                                        <span>{{ row.keyPhenotypes }}</span>
                                    </a>
                                </div>
                            </article>
                        </div>
                    </section>

                    <section v-if="activeTab === 'disease'" class="glens-tab-panel">
                        <div class="glens-section-head">
                            <div>
                                <p class="glens-eyebrow">Public disease hypotheses</p>
                                <h2>Does this sample resemble a disease profile outside CRDC?</h2>
                            </div>
                        </div>
                        <p class="glens-method-note">
                            Disease matches compare this sample's HPO profile and candidate genes against public disease phenotype annotations. They are review hypotheses, not diagnoses; GenDX evidence is shown as support only when phenotype consistency also fits.
                        </p>

                        <div class="glens-disease-list">
                            <article v-for="disease in sample.diseaseMatches" :key="disease.name" class="glens-disease-card">
                                <button class="glens-disease-head" type="button" @click="toggleDisease(disease.name)">
                                    <span>{{ openDiseases[disease.name] ? "▾" : "▸" }}</span>
                                    <strong>{{ disease.name }}</strong>
                                    <em>{{ disease.confidence }}</em>
                                </button>
                                <div class="glens-disease-summary">
                                    <span>{{ disease.matchedPhenotypes }}</span>
                                    <span>{{ disease.supportingGenes }}</span>
                                    <span>{{ disease.source }}</span>
                                </div>
                                <div v-if="openDiseases[disease.name]" class="glens-disease-detail">
                                    <div>
                                        <span>Matched features</span>
                                        <p>{{ disease.matchedDetail }}</p>
                                    </div>
                                    <div>
                                        <span>Missing or discordant</span>
                                        <p>{{ disease.discordant }}</p>
                                    </div>
                                    <div>
                                        <span>Interpretation</span>
                                        <p>{{ disease.interpretation }}</p>
                                    </div>
                                </div>
                            </article>
                        </div>
                    </section>

                    <section v-if="activeTab === 'genes'" class="glens-tab-panel">
                        <div class="glens-section-head">
                            <div>
                                <p class="glens-eyebrow">Candidate genetic explanations</p>
                                <h2>Which gene or variant best explains the sample?</h2>
                            </div>
                        </div>
                        <p class="glens-method-note">
                            Candidate genes are gene-level explanations first. A gene is prioritized when this sample's rare variants, phenotype-similar patients, same-gene carriers, public disease profiles, and GenDX evidence converge.
                        </p>

                        <div class="glens-gene-list">
                            <article v-for="gene in sample.candidateGenes" :key="gene.gene" class="glens-gene-card">
                                <button class="glens-gene-summary" type="button" @click="toggleGene(gene.gene)">
                                    <span>{{ expandedGenes[gene.gene] ? "▾" : "▸" }}</span>
                                    <strong>{{ gene.gene }}</strong>
                                    <em>{{ gene.reason }}</em>
                                </button>
                                <div class="glens-gene-grid">
                                    <div>
                                        <span>Rare coding variants</span>
                                        <strong>{{ gene.variantCount }}</strong>
                                    </div>
                                    <div>
                                        <span>Highest consequence</span>
                                        <strong>{{ gene.highestConsequence }}</strong>
                                    </div>
                                    <div>
                                        <span>Best pathogenicity evidence</span>
                                        <strong>{{ gene.bestEvidence }}</strong>
                                    </div>
                                    <div>
                                        <span>ClinVar</span>
                                        <strong>{{ gene.clinvar }}</strong>
                                    </div>
                                    <div>
                                        <span>MOI</span>
                                        <strong>{{ gene.inheritance }}</strong>
                                    </div>
                                    <div>
                                        <span>Linked disease</span>
                                        <strong>{{ gene.diseases }}</strong>
                                    </div>
                                    <div>
                                        <span>Phenotype support</span>
                                        <strong>{{ gene.phenotypeMatch }}</strong>
                                    </div>
                                    <div>
                                        <span>Similar samples same gene</span>
                                        <strong>{{ gene.similarCarrierSamples }}</strong>
                                    </div>
                                </div>

                                <div v-if="expandedGenes[gene.gene]" class="glens-variant-table">
                                    <div class="glens-table-head glens-table-head--variant">
                                        <span>Variant</span>
                                        <span>Consequence</span>
                                        <span>Transcript</span>
                                        <span>gnomAD AF</span>
                                        <span>DP</span>
                                        <span>REVEL</span>
                                        <span>AlphaMissense</span>
                                        <span>LoF</span>
                                        <span>ClinVar</span>
                                        <span>Tier</span>
                                        <span>Carriers</span>
                                        <span>Phenotype consistency</span>
                                    </div>
                                    <a
                                        v-for="variant in gene.variants"
                                        :key="variant.variantId"
                                        class="glens-table-row glens-table-row--variant"
                                        :href="variantHref(variant.variantId)"
                                    >
                                        <strong>{{ variant.variantId }}</strong>
                                        <span>{{ variant.consequence }}</span>
                                        <span>{{ variant.transcript }}</span>
                                        <span>{{ variant.gnomad }}</span>
                                        <span>{{ variant.dp }}</span>
                                        <span>{{ variant.revel }}</span>
                                        <span>{{ variant.alphaMissense }}</span>
                                        <span>{{ variant.lof }}</span>
                                        <span>{{ variant.clinvar }}</span>
                                        <span>{{ variant.tier }}</span>
                                        <span>{{ variant.carriers }}</span>
                                        <span>{{ variant.consistency }}</span>
                                    </a>
                                </div>
                            </article>
                        </div>
                    </section>

                </section>
            </main>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<script>
import ClinicalFocusBar from "../KrClinicalFocus/ClinicalFocusBar.vue";
import { hasClinicalFocus } from "../KrClinicalFocus/focusComparison";
import { clearClinicalFocus, onClinicalFocusChange, readClinicalFocus } from "../KrClinicalFocus/focusStore";
import { createKrSampleState } from "./mockData";
import "./style.css";

export default {
    name: "KrSampleTemplate",
    components: {
        ClinicalFocusBar,
    },
    data() {
        return {
            ...createKrSampleState(),
            clinicalFocus: readClinicalFocus(),
            contextPopoverOpen: false,
            optionsPopoverOpen: false,
            sampleInfoOpen: false,
            unsubscribeClinicalFocus: null,
        };
    },
    computed: {
        tabs() {
            return [
                { id: "overview", label: "Overview" },
                { id: "phenotype", label: "Similar by phenotype" },
                { id: "genotype", label: "Similar by genotype" },
                { id: "disease", label: "Disease hypotheses" },
                { id: "genes", label: "Gene / variant evidence" },
            ];
        },
        allInvestigatorOptions() {
            return [...this.sample.groupAffinityTop, ...this.sample.groupAffinityOther];
        },
        selectedInvestigatorAffinity() {
            return this.allInvestigatorOptions.find((group) => group.label === this.selectedInvestigatorGroup);
        },
        hasActiveContext() {
            return hasClinicalFocus(this.clinicalFocus);
        },
        compactContextLabel() {
            if (!this.hasActiveContext) return "";
            const contextId = this.clinicalFocus.orphaId || this.clinicalFocus.sourceId || "";
            return [this.clinicalFocus.label, contextId].filter(Boolean).join(" · ");
        },
        topAnswers() {
            return [
                {
                    label: "Closest phenotype match",
                    value: "BCH-12-34210-01 · 91% similar to this sample",
                    text: "The searched sample is 100% similar to itself and excluded; this is the nearest other sample by phenotype profile.",
                },
                {
                    label: "Group affinity",
                    value: "Investigator 2",
                    text: "Best match among 40 investigator phenotype signatures after annotation-burden correction.",
                },
                {
                    label: "Disease hypothesis to review",
                    value: "Kabuki syndrome-like",
                    text: "Phenotype-based public disease profile overlaps 11 / 18 expected features; GenDX reports a KMT2D LP variant.",
                },
            ];
        },
        overviewItems() {
            return [
                { label: "Affected / proband", value: `${this.sample.affected} · ${this.sample.proband}` },
                { label: "Sex / age", value: `${this.sample.sex} · ${this.sample.ageGroup}` },
                { label: "Investigator", value: this.sample.investigator },
                { label: "HPO profile", value: `${this.sample.hpoTotal} terms · ${this.sample.dominantPhenotypeDomain} ${this.sample.dominantPhenotypeCount}/${this.sample.hpoTotal}` },
                { label: "Genes with rare coding variants", value: `${this.sample.rareCodingGenes} genes` },
            ];
        },
        phenotypeQueryHref() {
            return `/krPhenotype.html?query=${encodeURIComponent(this.sample.fullHpoTerms.join(", "))}`;
        },
        displaySampleId() {
            const params = new URLSearchParams(window.location.search);
            const requestedSampleId = params.get("sample_id") || params.get("query");
            if (!requestedSampleId || requestedSampleId === "CRDC-2031") {
                return this.sample.sampleId;
            }
            return requestedSampleId;
        },
        displayAgeGroup() {
            return String(this.sample.ageGroup || "").replace("-", "–");
        },
    },
    mounted() {
        this.unsubscribeClinicalFocus = onClinicalFocusChange((focus) => {
            this.clinicalFocus = focus;
        });
        document.addEventListener("click", this.closeToolPopovers);
    },
    beforeDestroy() {
        if (this.unsubscribeClinicalFocus) this.unsubscribeClinicalFocus();
        document.removeEventListener("click", this.closeToolPopovers);
    },
    methods: {
        closeToolPopovers() {
            this.contextPopoverOpen = false;
            this.optionsPopoverOpen = false;
            this.sampleInfoOpen = false;
        },
        removeClinicalContext() {
            clearClinicalFocus();
            this.contextPopoverOpen = false;
        },
        sampleHref(sampleId) {
            return `/sample.html?sample_id=${encodeURIComponent(sampleId)}`;
        },
        variantHref(variantId) {
            return `/krVariant_V3.html?query=${encodeURIComponent(variantId)}`;
        },
        togglePanel(panel) {
            this.$set(this.openPanels, panel, !this.openPanels[panel]);
        },
        toggleMetric(metric) {
            this.$set(this.openMetrics, metric, !this.openMetrics[metric]);
        },
        toggleGene(gene) {
            this.$set(this.expandedGenes, gene, !this.expandedGenes[gene]);
        },
        toggleGenotypeGroup(group) {
            this.$set(this.openGenotypeGroups, group, !this.openGenotypeGroups[group]);
        },
        toggleDisease(disease) {
            this.$set(this.openDiseases, disease, !this.openDiseases[disease]);
        },
    },
};
</script>
