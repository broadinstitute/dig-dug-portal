<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body pbg-page pbs-page">
            <div class="pbg-shell">
                <div class="pbg-toolbar">
                    <div class="pbg-toolbar-left">
                        <a href="/pb_Front.html" class="pbg-home-link" aria-label="PB portal home">
                            <b-icon-house-door-fill aria-hidden="true"></b-icon-house-door-fill>
                            <span>Home</span>
                        </a>
                        <span class="pbg-breadcrumb-sep">&gt;</span>
                        <span class="pbg-breadcrumb-link">Sample search</span>
                        <span class="pbg-breadcrumb-sep">&gt;</span>
                        <form class="pbg-gene-search-form" role="search" aria-label="Search another sample" @submit.prevent="submitSampleSearch">
                            <input
                                v-model.trim="searchQuery"
                                class="pbg-gene-search-input pbs-search-input"
                                type="search"
                                autocomplete="off"
                                spellcheck="false"
                                aria-label="CRDC sample ID"
                                placeholder="CRDC sample ID"
                            >
                            <button class="pbg-gene-search-submit" type="submit">Search</button>
                            <span v-if="searchError" class="pbg-gene-search-error" role="alert">{{ searchError }}</span>
                        </form>
                    </div>
                    <nav class="pbg-toolbar-right" aria-label="PB evidence pages">
                        <a href="/pb_phenotype.html" class="pbg-nav-link">Phenotype</a>
                        <a href="/pb_Gene.html" class="pbg-nav-link">Gene</a>
                        <a href="/pb_variant.html" class="pbg-nav-link">Variant</a>
                    </nav>
                </div>

                <p class="pbs-preview-note">
                    <template v-if="isMockFallback">
                        <strong>No mock record for {{ requestedSampleId }}.</strong>
                        Showing the {{ sample.sampleId }} design fixture; values below do not belong to the requested sample.
                    </template>
                    <template v-else>
                        <strong>Illustrative mock data.</strong>
                        This page demonstrates how one sample connects to the existing PB phenotype, gene, and variant pages.
                    </template>
                </p>

                <main>
                    <section class="pbs-identity" aria-labelledby="sample-title">
                        <div>
                            <p class="pbs-eyebrow">BCH sample</p>
                            <h1 id="sample-title">{{ displaySampleId }}</h1>
                            <div v-if="hasFamilyData" class="pbs-family">
                                <p>Family ID <strong>{{ familyId }}</strong></p>
                                <ul aria-label="Family members">
                                    <li v-for="member in orderedFamilyMembers" :key="member.sampleId">
                                        <span>{{ member.role }}</span>
                                        <a
                                            :href="sampleHref(member.sampleId)"
                                            :aria-current="member.sampleId === sample.sampleId ? 'page' : null"
                                        >{{ member.sampleId }}</a>
                                    </li>
                                </ul>
                            </div>
                            <p v-else class="pbs-no-family">No family data available for this sample.</p>
                        </div>
                        <dl class="pbs-metadata">
                            <div><dt>Affected</dt><dd>{{ sample.affected }}</dd></div>
                            <div><dt>Sex</dt><dd>{{ sample.sex }}</dd></div>
                            <div><dt>Age at enrollment</dt><dd>{{ sample.ageAtEnrollment }}</dd></div>
                            <div><dt>Investigator</dt><dd>{{ sample.investigator }}</dd></div>
                            <div><dt>Total HPO term count</dt><dd>{{ sample.phenotypeTotal }}</dd></div>
                            <div class="pbs-metadata-wide">
                                <dt>Dominant HPO group</dt>
                                <dd>
                                    <span v-for="(group, index) in dominantPhenotypeGroups" :key="group.id">
                                        <span v-if="index"> · </span>
                                        <a :href="phenotypeHref(group.id)">{{ group.label }} [{{ group.id }}]</a>
                                    </span>
                                    <small>{{ dominantPhenotypeGroups[0].count }} distinct terms · {{ dominantPhenotypeGroups.length > 1 ? 'co-leading groups' : 'largest group' }} directly under HP:0000118</small>
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <div class="pbs-profile-tabs">
                        <div class="pbs-profile-tablist" role="tablist" aria-label="Sample profiles">
                            <button
                                id="sample-phenotype-tab"
                                type="button"
                                role="tab"
                                aria-controls="sample-phenotype-panel"
                                :aria-selected="activeProfileTab === 'phenotype' ? 'true' : 'false'"
                                @click="activeProfileTab = 'phenotype'"
                            >Phenotype profile</button>
                            <button
                                id="sample-genotype-tab"
                                type="button"
                                role="tab"
                                aria-controls="sample-genotype-panel"
                                :aria-selected="activeProfileTab === 'genotype' ? 'true' : 'false'"
                                @click="activeProfileTab = 'genotype'"
                            >Genotype profile</button>
                        </div>

                        <section
                            v-show="activeProfileTab === 'phenotype'"
                            id="sample-phenotype-panel"
                            class="pbs-card"
                            role="tabpanel"
                            aria-labelledby="sample-phenotype-tab"
                        >
                            <header class="pbs-card-head">
                                <div>
                                    <h2 id="sample-phenotype-title">Phenotype profile</h2>
                                    <p>{{ sample.phenotypeTotal }} recorded HPO terms · grouped directly under HP:0000118</p>
                                </div>
                                <a class="pbs-primary-link" :href="phenotypeProfileHref">Open phenotype page →</a>
                            </header>
                            <div class="pbs-phenotype-groups" aria-label="Phenotype profile composition">
                                <details v-for="group in orderedPhenotypeGroups" :key="group.id" class="pbs-phenotype-group">
                                    <summary
                                        :style="{ '--phenotype-fill': `${sample.phenotypeTotal ? Math.round(group.count / sample.phenotypeTotal * 100) : 0}%` }"
                                    >
                                        <h3>{{ group.label }} [{{ group.id }}]</h3>
                                        <strong>{{ group.count }} / {{ sample.phenotypeTotal }}</strong>
                                    </summary>
                                    <div class="pbs-phenotype-terms">
                                        <ul>
                                            <li v-for="term in group.terms.slice(0, 5)" :key="term.id">
                                                <a :href="phenotypeHref(term.id)">{{ term.label }} [{{ term.id }}]</a>
                                            </li>
                                        </ul>
                                        <details v-if="group.terms.length > 5" class="pbs-phenotype-more">
                                            <summary>
                                                <span class="pbs-show-more">Show {{ group.terms.length - 5 }} more</span>
                                                <span class="pbs-show-fewer">Show fewer</span>
                                            </summary>
                                            <ul>
                                                <li v-for="term in group.terms.slice(5)" :key="term.id">
                                                    <a :href="phenotypeHref(term.id)">{{ term.label }} [{{ term.id }}]</a>
                                                </li>
                                            </ul>
                                        </details>
                                        <p v-if="group.count > group.terms.length">
                                            {{ group.count - group.terms.length }} additional terms are not loaded in this design fixture.
                                        </p>
                                    </div>
                                </details>
                            </div>
                        </section>

                        <section
                            v-show="activeProfileTab === 'genotype'"
                            id="sample-genotype-panel"
                            class="pbs-card"
                            role="tabpanel"
                            aria-labelledby="sample-genotype-tab"
                        >
                            <header class="pbs-card-head">
                                <div>
                                    <h2 id="sample-genetics-title">Genotype profile</h2>
                                    <p>All variant calls and prioritized Type 1–6 findings</p>
                                </div>
                            </header>
                            <div class="pbs-track-key" aria-label="Variant views">
                                <button type="button" title="All variant calls available for this sample" aria-label="All variants: complete per-sample variant call table" :aria-pressed="activeVariantView === 'all'" @click="toggleVariantView('all')">
                                    <strong>All</strong>
                                </button>
                                <button type="button" title="ClinVar RCV pathogenic or likely pathogenic variant evidence; Type 1 is cohort MATCH and Type 2 is OUTSIDE" aria-label="Types 1 to 2: ClinVar pathogenic or likely pathogenic variant evidence" :aria-pressed="activeVariantView === 'clinical'" @click="toggleVariantView('clinical')">
                                    <strong>Types 1–2</strong>
                                </button>
                                <button type="button" title="Qualifying known-gene evidence without Tier 1 ClinVar RCV P/LP evidence; Type 3 is cohort MATCH and Type 4 is OUTSIDE" aria-label="Types 3 to 4: qualifying known-gene evidence" :aria-pressed="activeVariantView === 'reanalysis'" @click="toggleVariantView('reanalysis')">
                                    <strong>Types 3–4</strong>
                                </button>
                                <button type="button" title="High-impact unknown-gene variants supported by phenotype and cohort evidence; Type 5 is own-cohort and Type 6 is cross-cohort" aria-label="Types 5 to 6: phenotype-supported unknown-gene discovery evidence" :aria-pressed="activeVariantView === 'discovery'" @click="toggleVariantView('discovery')">
                                    <strong>Types 5–6</strong>
                                </button>
                            </div>
                            <div v-if="activeVariantView === 'all'" class="pbs-all-variants" aria-label="All sample variant calls">
                                <p>{{ allVariantGeneGroups.length }} genes · {{ sample.allVariants.length }} variant calls in this design fixture</p>
                                <details v-for="group in allVariantGeneGroups" :key="group.gene" class="pbs-gene-variant-group">
                                    <summary>
                                        <span class="pbs-gene-title"><strong>{{ group.gene }}</strong><small>{{ group.transcript }}</small></span>
                                        <span class="pbs-gene-variant-count">{{ group.variants.length }} {{ group.variants.length === 1 ? 'variant' : 'variants' }}</span>
                                        <a :href="geneHref(group.gene)" :aria-label="`Open ${group.gene} gene page`" @click.stop>{{ group.gene }} →</a>
                                    </summary>
                                    <div class="pbs-gene-variant-body">
                                        <div class="pbg-variant-evidence-block pbs-sample-variant-evidence">
                                            <div class="pbg-ve-table-head pbs-sample-ve-head">
                                                <span>Variant</span>
                                                <span>GT</span>
                                                <span>CRDC carrier frequency</span>
                                                <span>Classification</span>
                                                <span>
                                                    Pathogenic Score
                                                    <button type="button"
                                                          class="pbg-score-help pbs-help-button"
                                                          v-b-tooltip.hover.focus.top
                                                          title="LoFTEE HC = 1.00; otherwise AlphaMissense is used. REVEL-only is excluded and shown as —*. — means no LoFTEE HC, AlphaMissense, or REVEL annotation."
                                                          aria-label="Pathogenic Score calculation: LoFTEE HC equals 1.00; otherwise AlphaMissense is used. REVEL-only is excluded."
                                                    >?</button>
                                                    <em>CRDC</em>
                                                </span>
                                                <span>
                                                    Match Score (Context-based)
                                                    <button type="button"
                                                            class="pbg-score-help pbs-help-button"
                                                            v-b-tooltip.hover.focus.top
                                                            title="Residual PheRS for this sample and selected disease context."
                                                            aria-label="Match Score: residual PheRS for this sample and selected disease context.">?</button>
                                                    <em>CRDC</em>
                                                </span>
                                            </div>
                                            <div v-for="variant in group.variants" :key="variant.id" class="pbg-ve-row pbs-sample-ve-row">
                                                <span class="pbg-variant-id pbs-sample-variant-id">
                                                    {{ variant.id }}
                                                    <a class="pbs-variant-page-badge"
                                                       :href="variantHref(variant)"
                                                       :aria-label="`Open ${variant.id} variant page`"
                                                       title="Open variant page">VAR ↗</a>
                                                </span>
                                                <strong class="pbg-ve-carriers pbs-sample-ve-gt"><span>GT</span>{{ variant.genotype }}</strong>
                                                <span class="pbg-ve-af pbs-sample-ve-af">{{ variant.crdcCarrierFrequency }}</span>
                                                <span class="pbg-ve-classification">
                                                    <span class="pbg-clinvar-badge">{{ variant.clinvar }}</span>
                                                    <small>{{ variant.consequence }}</small>
                                                </span>
                                                <span class="pbs-sample-ve-score">
                                                    <strong class="pbg-score-badge" :title="variant.burdenScore.title">{{ variant.burdenScore.display }}</strong>
                                                </span>
                                                <span class="pbg-no-context pbs-sample-ve-match">no context</span>
                                            </div>
                                        </div>
                                    </div>
                                </details>
                            </div>
                            <div v-else-if="filteredVariants.length" class="pbs-findings" role="tabpanel">
                                <details
                                    v-for="(variant, index) in filteredVariants"
                                    :key="variant.id"
                                    class="pbs-finding"
                                    :class="`pbs-finding-${variant.trackClass}`"
                                    :open="index === 0"
                                >
                                    <summary>
                                        <span class="pbs-type-badge">{{ variant.type }}</span>
                                        <span class="pbs-finding-title">
                                            <a :href="geneHref(variant.gene)" @click.stop>{{ variant.gene }}</a>
                                            <small>{{ variant.typeLabel }}</small>
                                        </span>
                                        <span class="pbs-finding-meta">
                                            <span class="pbs-tier-badge">{{ variant.tier }}</span>
                                            <span class="pbs-clinvar-review"
                                                  role="img"
                                                  :title="`VCV review status: ${variant.clinvarReview.label}`"
                                                  :aria-label="`ClinVar VCV review: ${variant.clinvarReview.stars} of 4 stars, ${variant.clinvarReview.label}`">
                                                ClinVar
                                                <strong aria-hidden="true">{{ '★'.repeat(variant.clinvarReview.stars) || '—' }}</strong>
                                            </span>
                                        </span>
                                    </summary>
                                    <dl class="pbs-finding-evidence">
                                        <div>
                                            <dt>Variant</dt>
                                            <dd><a :href="variantHref(variant)">{{ variant.id }}</a> · {{ variant.consequence }} · GT {{ variant.genotype }}</dd>
                                        </div>
                                        <div class="pbs-disease-phers-row">
                                            <dt>Disease / PheRS</dt>
                                            <dd class="pbs-disease-list">
                                                <article v-for="disease in variant.diseases" :key="disease.id" class="pbs-disease-match">
                                                    <a class="pbs-disease-link" :href="orphaHref(disease.id)" target="_blank" rel="noopener noreferrer">{{ disease.id }} ↗</a>
                                                    <strong class="pbs-phers-current"><span aria-hidden="true">●</span> Percentile {{ disease.samplePercentile }}</strong>
                                                    <div class="pbs-phers-track"
                                                         :style="{ '--sample-pct': `${disease.samplePercentile}%`, '--investigator-pct': `${disease.investigatorMeanPercentile}%` }"
                                                         aria-hidden="true">
                                                        <span class="pbs-phers-fill"></span>
                                                        <span class="pbs-phers-sample-marker"></span>
                                                        <span class="pbs-phers-investigator-marker"></span>
                                                    </div>
                                                    <span class="pbs-phers-investigator"><span aria-hidden="true">◆</span> {{ sample.investigator }} mean · percentile {{ disease.investigatorMeanPercentile }}</span>
                                                    <span class="pbs-phers-difference">{{ disease.differenceLabel }} percentile points</span>
                                                    <button type="button"
                                                            class="pbg-score-help pbs-help-button"
                                                            v-b-tooltip.hover.focus.top
                                                            :title="disease.matchTooltip"
                                                            :aria-label="disease.matchTooltip">?</button>
                                                </article>
                                            </dd>
                                        </div>
                                        <div><dt>Investigator cohort fit</dt><dd>{{ variant.cohortRelation }}</dd></div>
                                    </dl>
                                </details>
                            </div>
                            <p v-else-if="activeVariantView" class="pbs-empty-findings">No findings in this Type group for the design fixture.</p>
                            <p v-if="activeVariantView === 'all'" class="pbs-footnote">The production table requires the complete per-sample variant call set; this mock shows fixture rows only.</p>
                            <p v-else-if="activeVariantView" class="pbs-footnote">Types 1–2 use ClinVar RCV P/LP variant evidence; Types 3–4 use qualifying known-gene evidence; Types 5–6 use high-impact unknown-gene and phenotype/cohort evidence.</p>
                        </section>
                    </div>
                </main>
            </div>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<script>
import { PB_SAMPLE_MOCK } from "./mockData";
const { familyIdFromSampleId, sortFamilyMembers } = require("./familyModel");
const { burdenPathogenicScore } = require("./variantEvidence");
import "@/views/PbGene/style.css";
import "./style.css";

export default {
    name: "PbSampleTemplate",
    data() {
        const params = new URLSearchParams(window.location.search);
        const requestedId = params.get("query") || params.get("sample_id") || PB_SAMPLE_MOCK.sampleId;
        return {
            requestedSampleId: requestedId,
            displaySampleId: PB_SAMPLE_MOCK.sampleId,
            sample: PB_SAMPLE_MOCK,
            activeProfileTab: "phenotype",
            activeVariantView: "all",
            searchQuery: requestedId,
            searchError: "",
        };
    },
    computed: {
        isMockFallback() {
            return this.requestedSampleId.toUpperCase() !== this.sample.sampleId.toUpperCase();
        },
        orderedPhenotypeGroups() {
            return [...this.sample.phenotypeGroups].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
        },
        dominantPhenotypeGroups() {
            const largestCount = this.orderedPhenotypeGroups[0].count;
            return this.orderedPhenotypeGroups.filter((group) => group.count === largestCount);
        },
        filteredVariants() {
            return this.sample.variants.filter((variant) => variant.trackClass === this.activeVariantView);
        },
        allVariantGeneGroups() {
            const groups = new Map();
            this.sample.allVariants.forEach((variant) => {
                if (!groups.has(variant.gene)) groups.set(variant.gene, []);
                groups.get(variant.gene).push(variant);
            });
            return [...groups]
                .map(([gene, variants]) => ({
                    gene,
                    transcript: variants.find((variant) => variant.transcript)?.transcript || "Unavailable",
                    variants: variants.map((variant) => ({ ...variant, burdenScore: burdenPathogenicScore(variant) })),
                }))
                .sort((a, b) => a.gene.localeCompare(b.gene));
        },
        familyId() {
            return familyIdFromSampleId(this.sample.sampleId);
        },
        orderedFamilyMembers() {
            return sortFamilyMembers(this.sample.familyMembers);
        },
        hasFamilyData() {
            return this.familyId && this.orderedFamilyMembers.length > 1;
        },
        phenotypeProfileHref() {
            const query = this.sample.phenotypeGroups
                .reduce((terms, group) => terms.concat(group.terms), [])
                .map((phenotype) => phenotype.id)
                .join(", ");
            return `/pb_phenotype.html?query=${encodeURIComponent(query)}`;
        },
    },
    methods: {
        toggleVariantView(view) {
            this.activeVariantView = this.activeVariantView === view ? "" : view;
        },
        submitSampleSearch() {
            const query = this.searchQuery.trim();
            if (!/^(?:BCH|CRDC)-[A-Za-z0-9-]+$/i.test(query)) {
                this.searchError = "Enter a BCH or CRDC sample ID.";
                return;
            }
            window.location.assign(`/pb_sample.html?query=${encodeURIComponent(query)}`);
        },
        phenotypeHref(hpoId) {
            return `/pb_phenotype.html?query=${encodeURIComponent(hpoId)}`;
        },
        sampleHref(sampleId) {
            return `/pb_sample.html?query=${encodeURIComponent(sampleId)}`;
        },
        geneHref(gene) {
            return `/pb_Gene.html?query=${encodeURIComponent(gene)}`;
        },
        variantHref(variant) {
            return `/pb_variant.html?query=${encodeURIComponent(variant.id)}&gene=${encodeURIComponent(variant.gene)}`;
        },
        orphaHref(diseaseId) {
            return `https://www.orpha.net/en/disease/detail/${diseaseId.replace("ORPHA:", "")}`;
        },
    },
};
</script>
