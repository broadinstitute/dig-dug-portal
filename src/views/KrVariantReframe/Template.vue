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
                        <strong>Variant / gene search</strong>
                    </div>
                    <reframe-context-control
                        baseline-question="Who carries this variant or gene, and what phenotype, recurrence, disease, and group patterns are observed among those carriers?"
                        baseline-purpose="Inspect carrier counts, carrier HPO profiles, recurrence, disease references, and group patterns across CRDC."
                        active-question="Do carriers of this variant or gene match the active HPO context, and which carrier phenotypes or groups support that match?"
                        active-purpose="Compare the active HPO context against carrier sample HPO profiles and carrier HPO summaries, not against the variant directly."
                        @focus-changed="clinicalFocus = $event"
                    ></reframe-context-control>
                </div>

                <span class="glens-reframe-candidate-label">reframe candidate layout</span>

                <section class="glens-reframe-card">
                    <div class="glens-variant-reframe-header">
                        <div>
                            <p class="glens-reframe-eyebrow">Queried variant / gene</p>
                            <h1>{{ variant.query.label }}</h1>
                            <p class="glens-reframe-note">{{ variant.query.window }} · {{ variant.query.build }}</p>
                        </div>
                        <div class="glens-reframe-kv">
                            <span>Gene symbol</span><span>UBE3A</span>
                            <span>Consequence</span><span>missense · queried codon Gln to His</span>
                            <span>Allele frequency / rarity</span><span>gnomAD AF 0.00003</span>
                            <span>Pathogenicity score</span><span>REVEL 0.81 · AlphaMissense 0.94</span>
                            <span>GenDx diagnostic support</span><span>Exact queried variant used in GenDx: yes · 5 diagnosed carriers</span>
                        </div>
                    </div>
                </section>

                <section class="glens-reframe-section glens-reframe-grid">
                    <article class="glens-reframe-card">
                        <p class="glens-reframe-eyebrow">Queried locus window</p>
                        <h2>Disease, gene, base, and carrier-count view</h2>
                        <div class="glens-variant-reframe-locus">
                            <div class="glens-variant-reframe-axis">
                                <span v-for="tick in variant.axisTicks" :key="tick">{{ tick }}</span>
                            </div>
                            <div class="glens-variant-reframe-track">
                                <span>Disease track</span>
                                <b v-for="signal in variant.diseaseSignals" :key="signal.label">{{ signal.label }}</b>
                            </div>
                            <div class="glens-variant-reframe-track">
                                <span>Gene / exon / codon / base track</span>
                                <b>UBE3A · queried codon CAG → CAC</b>
                            </div>
                            <div class="glens-variant-reframe-density">
                                <i
                                    v-for="(count, index) in variant.densitySeries['all-investigators'].all.slice(8, 34)"
                                    :key="index"
                                    :style="{ height: `${Math.max(count * 3, 3)}px` }"
                                ></i>
                            </div>
                        </div>
                    </article>

                    <article class="glens-reframe-card">
                        <p class="glens-reframe-eyebrow">Primary CRDC internal evidence</p>
                        <h2>Carrier count summary</h2>
                        <div class="glens-reframe-kv">
                            <span>All carriers</span><span>{{ variant.summaryScopes.variant.all }}</span>
                            <span>Affected carriers</span><span>17</span>
                            <span>Proband carriers</span><span>{{ variant.summaryScopes.variant.proband }}</span>
                            <span>Diagnosed carriers</span><span>5</span>
                            <span>Undiagnosed / unavailable</span><span>13</span>
                            <span>Sex distribution</span><span>{{ variant.summaryScopes.variant.female }} female · {{ variant.summaryScopes.variant.male }} male</span>
                        </div>
                    </article>
                </section>

                <section class="glens-reframe-section glens-reframe-grid">
                    <article class="glens-reframe-card">
                        <p class="glens-reframe-eyebrow">Primary CRDC internal evidence</p>
                        <h2>Carrier phenotype profile</h2>
                        <p class="glens-reframe-note">
                            Frequent HPO categories among queried-variant carriers. Active context is compared to this carrier HPO profile.
                        </p>
                        <div class="glens-reframe-mini-bars">
                            <div v-for="category in variant.carrierPhenotypesByCategory" :key="category.category" class="glens-reframe-mini-bar">
                                <span>{{ category.category }}</span>
                                <span class="glens-reframe-bar-shell"><i class="glens-reframe-bar-fill" :style="{ width: `${Math.min((category.count / 18) * 100, 100)}%` }"></i></span>
                                <span>{{ category.count }} terms</span>
                            </div>
                        </div>
                        <div v-if="hasActiveContext" class="glens-reframe-term-list">
                            <strong>Carrier HPO overlap with active context</strong>
                            <span v-for="term in contextCarrierOverlap" :key="term">{{ term }}</span>
                        </div>
                    </article>

                    <article class="glens-reframe-card">
                        <p class="glens-reframe-eyebrow">Primary CRDC internal evidence</p>
                        <h2>Carrier group pattern</h2>
                        <p class="glens-reframe-note">
                            This is a group-finding view: whether carriers resemble a phenotype-defined or investigator cohort pattern.
                        </p>
                        <div class="glens-reframe-mini-bars">
                            <div v-for="group in variant.residualGroups" :key="group.name" class="glens-reframe-mini-bar">
                                <span>{{ group.name }}</span>
                                <span class="glens-reframe-bar-shell"><i class="glens-reframe-bar-fill" :style="{ width: group.selected }"></i></span>
                                <span>{{ group.extreme }}</span>
                            </div>
                        </div>
                    </article>
                </section>

                <section class="glens-reframe-section glens-reframe-card">
                    <p class="glens-reframe-eyebrow">Primary CRDC internal evidence</p>
                    <h2>Carrier reference set</h2>
                    <div class="glens-reframe-table">
                        <div class="glens-reframe-table-head glens-variant-reframe-carrier-row">
                            <span>Carrier sample</span><span>GenDx status</span><span>Phenotype match</span><span v-if="hasActiveContext">Match to context</span><span>Investigator group</span>
                        </div>
                        <div v-for="sample in variant.carrierSamples.slice(0, 8)" :key="sample.id" class="glens-reframe-row glens-variant-reframe-carrier-row">
                            <a class="glens-reframe-link" :href="sampleHref(sample.id)">{{ sample.id }}</a>
                            <span>{{ sample.diagnosed === 'Yes' ? 'Diagnosed' : 'Unknown / not available' }}</span>
                            <span>{{ sample.affected }} affected · {{ sample.proband }}</span>
                            <span v-if="hasActiveContext">Carrier HPO profile overlaps active context</span>
                            <span>{{ sample.group }}</span>
                        </div>
                    </div>
                </section>

                <section class="glens-reframe-section glens-reframe-card">
                    <p class="glens-reframe-eyebrow">Reference support and secondary annotation</p>
                    <h2>Gene / disease / annotation support</h2>
                    <div class="glens-reframe-evidence-band">
                        <div>
                            <h3>Primary CRDC evidence</h3>
                            <p class="glens-reframe-note">Same variant recurrence · same gene recurrence · carrier phenotype overlap · carrier group pattern.</p>
                        </div>
                        <div>
                            <h3>Core rare disease reference</h3>
                            <p class="glens-reframe-note">Angelman syndrome and UBE3A-related neurodevelopmental disorder from Orphanet, HPO, and OMIM references.</p>
                        </div>
                        <div>
                            <h3>Secondary annotation</h3>
                            <div class="glens-reframe-badge-row">
                                <span class="glens-reframe-badge">PanelApp badge</span>
                                <span class="glens-reframe-badge">Reactome annotation</span>
                                <span class="glens-reframe-badge">WikiPathways annotation</span>
                            </div>
                            <p class="glens-reframe-note">Badges support interpretation but do not filter out CRDC recurrent candidates.</p>
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
import { createKrVariantState } from "../KrVariant/mockData";
import "../KrReframeCommon/style.css";
import "./style.css";

export default {
    name: "KrVariantReframeTemplate",
    components: {
        ReframeContextControl,
    },
    data() {
        return {
            ...createKrVariantState(),
            clinicalFocus: readClinicalFocus(),
        };
    },
    computed: {
        hasActiveContext() {
            return hasClinicalFocus(this.clinicalFocus);
        },
        contextCarrierOverlap() {
            const terms = (this.clinicalFocus.hpoTerms || []).map((term) => term.label);
            const carrierTerms = this.variant.carrierPhenotypesByCategory.flatMap((category) => category.terms);
            return carrierTerms.filter((term) => terms.includes(term.replace(/\s*\[HP:[0-9]+\]/, ""))).slice(0, 5);
        },
    },
    methods: {
        sampleHref(sampleId) {
            return `/krSample_reframe.html?sample_id=${encodeURIComponent(sampleId)}`;
        },
    },
};
</script>
