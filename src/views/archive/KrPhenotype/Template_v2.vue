<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body glens-page">
            <div class="glens-phenotype">
                <section class="glens-header-card">
                    <div class="glens-header-row">
                        <div class="glens-header-main">
                            <p class="glens-page-eyebrow">Phenotype-driven diagnostic exploration</p>
                            <h1 class="glens-page-title">{{ phenotype.query.primary }}</h1>
                            <p class="glens-subtitle">{{ phenotype.query.secondary }}</p>
                            <div class="glens-inline-meta">
                                <span>phenotype search</span>
                                <span>|</span>
                                <span>{{ phenotype.summary.matchedLabel }}</span>
                            </div>
                        </div>

                        <div class="glens-summary-stack">
                            <span class="glens-summary-chip">{{ phenotype.summary.cohortLabel }}</span>
                            <span class="glens-summary-chip">{{ phenotype.summary.probandLabel }}</span>
                            <span class="glens-summary-chip glens-summary-chip--blue">
                                {{ phenotype.summary.genesLabel }}
                            </span>
                        </div>
                    </div>
                </section>

                <section class="glens-card glens-card--hero">
                    <div class="glens-section-head glens-section-head--hero">
                        <div>
                            <p class="glens-section-label">Highest phenotype-frequency matches</p>
                            <h2 class="glens-section-title glens-section-title--hero">
                                Likely disease candidates
                            </h2>
                            <p class="glens-section-copy">
                                Top phenotype-aligned disease directions for this matched cohort.
                            </p>
                        </div>
                        <span class="glens-chip glens-chip--hero">
                            diagnostic entry point
                        </span>
                    </div>

                    <div class="glens-candidate-grid">
                        <article
                            v-for="row in phenotype.topDiseases"
                            :key="row.disease"
                            class="glens-candidate-card"
                        >
                            <div class="glens-candidate-topline">
                                <span class="glens-domain-pill">{{ row.category }}</span>
                                <span class="glens-frequency-pill">{{ row.queryLevel }}</span>
                            </div>

                            <h3 class="glens-candidate-title">{{ row.disease }}</h3>

                            <div class="glens-candidate-metrics">
                                <div class="glens-candidate-metric">
                                    <span class="glens-candidate-metric-label">Total phenotype terms</span>
                                    <strong>{{ row.totalPhenotypeTerms }}</strong>
                                </div>
                                <div class="glens-candidate-metric">
                                    <span class="glens-candidate-metric-label">Obligate phenotype terms</span>
                                    <strong>{{ row.obligatePhenotypeTerms }}</strong>
                                </div>
                            </div>

                            <div class="glens-frequency-composition">
                                <div class="glens-frequency-label-row">
                                    <span
                                        v-for="segment in row.frequencyComposition"
                                        :key="`${row.disease}-${segment.key}-label`"
                                        class="glens-frequency-label"
                                        :class="{ 'glens-frequency-label--active': segment.key === row.queryLevelKey }"
                                    >
                                        {{ segment.label }}
                                    </span>
                                </div>

                                <div class="glens-frequency-strip">
                                    <div
                                        v-for="segment in row.frequencyComposition"
                                        :key="`${row.disease}-${segment.key}`"
                                        class="glens-frequency-segment"
                                        :class="{ 'glens-frequency-segment--active': segment.key === row.queryLevelKey }"
                                    >
                                        {{ segment.count }}
                                    </div>
                                </div>
                            </div>
                        </article>
                    </div>
                </section>

                <section class="row glens-reasoning-grid">
                    <div class="col-xl-6">
                        <div class="glens-card glens-card--reasoning">
                            <div class="glens-section-head">
                                <div>
                                    <p class="glens-section-label">Phenotype-linked disease domains</p>
                                    <h2 class="glens-section-title">
                                        Broad disease-domain summary
                                    </h2>
                                </div>
                                <span class="glens-chip glens-chip--amber">
                                    phenotype frequency summary
                                </span>
                            </div>

                            <div class="glens-table mt-space">
                                <div class="glens-table-row glens-table-row--head glens-category-grid">
                                    <span>Rank</span>
                                    <span>Disease category</span>
                                    <span>Diseases with this phenotype</span>
                                    <span>Mean phenotype score</span>
                                    <span>Top disease examples</span>
                                </div>
                                <div
                                    v-for="row in phenotype.diseaseCategories"
                                    :key="row.rank"
                                    class="glens-category-row"
                                >
                                    <div class="glens-category-fill" :style="{ width: row.fillWidth }"></div>
                                    <div class="glens-table-row glens-category-grid glens-category-grid--body">
                                        <strong class="glens-rank">{{ row.rank }}</strong>
                                        <div>
                                            <strong class="glens-emphasis">{{ row.category }}</strong>
                                            <div class="glens-tag-row">
                                                <span
                                                    v-for="tag in row.tags"
                                                    :key="tag"
                                                    class="glens-mini-tag"
                                                >
                                                    {{ tag }}
                                                </span>
                                            </div>
                                        </div>
                                        <span>{{ row.diseasesWithPhenotype }}</span>
                                        <span>{{ row.meanScore }}</span>
                                        <span class="glens-muted">{{ row.examples }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-6">
                        <div class="glens-card glens-card--reasoning">
                            <div class="glens-section-head">
                                <div>
                                    <p class="glens-section-label">Frequent phenotype partners</p>
                                    <h2 class="glens-section-title">
                                        Co-observed phenotype pattern
                                    </h2>
                                </div>
                                <span class="glens-chip">observed matched-cohort context</span>
                            </div>

                            <div class="mt-space">
                                <div
                                    v-for="row in phenotype.coObserved"
                                    :key="row.label"
                                    class="glens-partner-row"
                                >
                                    <div class="glens-partner-main">
                                        <strong class="glens-emphasis">{{ row.label }}</strong>
                                    </div>
                                    <div class="glens-partner-meta">
                                        <div class="glens-muted">{{ row.group }}</div>
                                        <div>{{ row.count }}</div>
                                    </div>
                                    <div class="glens-partner-bar-shell">
                                        <div class="glens-partner-bar" :style="{ width: row.width }"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="glens-composition-card">
                                <div class="glens-section-head glens-section-head--compact">
                                    <p class="glens-section-label">Partner category composition</p>
                                    <span class="glens-small-meta">listed phenotype partners only</span>
                                </div>
                                <div class="glens-composition-bars">
                                    <div
                                        v-for="item in phenotype.partnerComposition"
                                        :key="item.label"
                                        class="glens-composition-col"
                                    >
                                        <div class="glens-age-count">{{ item.count }}</div>
                                        <div class="glens-composition-bar" :style="{ height: item.height }"></div>
                                        <span class="glens-composition-label">{{ item.label }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="gene-signal" class="glens-card glens-card--evidence">
                    <div class="glens-section-head">
                        <div>
                            <p class="glens-section-label">Gene-level signal within matched phenotype cohort</p>
                            <h2 class="glens-section-title">
                                Gene evidence layer
                            </h2>
                            <p class="glens-section-copy glens-section-copy--compact">
                                Recurrent carrier-level signal across phenotype-matched samples.
                            </p>
                        </div>
                        <span class="glens-chip glens-chip--blue">carrier-based summary</span>
                    </div>

                    <div class="glens-table mt-space">
                        <div class="glens-table-row glens-table-row--head glens-gene-grid">
                            <span>Rank</span>
                            <span>Carrier samples</span>
                            <span>Gene</span>
                            <span>Mean variant score</span>
                            <span>Associated disease</span>
                        </div>
                        <div
                            v-for="row in phenotype.genes"
                            :key="row.rank"
                            class="glens-table-row glens-gene-grid"
                        >
                            <strong class="glens-rank">{{ row.rank }}</strong>
                            <span>{{ row.carriers }}</span>
                            <strong class="glens-emphasis">{{ row.gene }}</strong>
                            <span>{{ row.meanVariantScore }}</span>
                            <span class="glens-muted">{{ row.domain }}</span>
                        </div>
                    </div>
                </section>

                <section class="glens-card glens-card--context">
                    <div class="glens-context-head">
                        <div>
                            <p class="glens-section-label">Matched phenotype cohort</p>
                            <h2 class="glens-section-title">
                                Context and trust layer
                            </h2>
                        </div>
                        <span class="glens-chip glens-chip--green">cohort context</span>
                    </div>

                    <div class="row glens-context-grid">
                        <div class="col-lg-5">
                            <div class="glens-summary-block">
                                <p>{{ phenotype.summary.matchedLabel }}</p>
                                <p>{{ phenotype.summary.cohortLabel }}</p>
                                <p>{{ phenotype.summary.probandLabel }}</p>
                                <p>{{ phenotype.summary.sexLabel }}</p>
                            </div>
                        </div>

                        <div class="col-lg-7">
                            <div class="glens-age-card">
                                <div class="glens-age-bars">
                                    <div
                                        v-for="bin in phenotype.ageBins"
                                        :key="bin.label"
                                        class="glens-age-col"
                                    >
                                        <div class="glens-age-pair">
                                            <div class="glens-age-bar-wrap">
                                                <div class="glens-age-count">{{ bin.female }}</div>
                                                <div
                                                    class="glens-age-bar glens-age-bar--female"
                                                    :style="{ height: bin.femaleHeight }"
                                                ></div>
                                            </div>
                                            <div class="glens-age-bar-wrap">
                                                <div class="glens-age-count">{{ bin.male }}</div>
                                                <div
                                                    class="glens-age-bar glens-age-bar--male"
                                                    :style="{ height: bin.maleHeight }"
                                                ></div>
                                            </div>
                                        </div>
                                        <span class="glens-age-label">{{ bin.label }}</span>
                                    </div>
                                </div>
                                <div class="glens-legend">
                                    <span><i class="glens-dot glens-dot--female"></i>Female</span>
                                    <span><i class="glens-dot glens-dot--male"></i>Male</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="glens-nav-card">
                    <a class="glens-link-pill" href="/krVariant.html">Open variant evidence</a>
                    <a class="glens-link-pill" href="#gene-signal">View related genes</a>
                    <span class="glens-link-pill">Patient similarity</span>
                </section>
            </div>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<script>
export default {
    name: "KrPhenotypeTemplateV2",
    data() {
        return {
            phenotype: {
                query: {
                    primary: "cleft palate [HP:0001250]",
                    secondary: "developmental delay",
                },
                summary: {
                    matchedLabel: "132 matched samples",
                    cohortLabel: "14.6% of cohort (132 / 904)",
                    probandLabel: "68% proband (90 / 132)",
                    genesLabel: "43 genes flagged",
                    sexLabel: "Female 58% (77 / 132) · Male 42% (55 / 132)",
                },
                genes: [
                    { rank: 1, carriers: "22 / 132", gene: "KMT2D", meanVariantScore: "0.82", domain: "craniofacial, neurodevelopmental" },
                    { rank: 2, carriers: "17 / 132", gene: "CHD7", meanVariantScore: "0.79", domain: "craniofacial, sensory" },
                    { rank: 3, carriers: "15 / 132", gene: "IRF6", meanVariantScore: "0.74", domain: "craniofacial" },
                    { rank: 4, carriers: "12 / 132", gene: "TBX1", meanVariantScore: "0.68", domain: "copy-number, craniofacial" },
                    { rank: 5, carriers: "10 / 132", gene: "SATB2", meanVariantScore: "0.77", domain: "craniofacial, speech" },
                ],
                diseaseCategories: [
                    { rank: 1, category: "Craniofacial", diseasesWithPhenotype: "18 / 120", meanScore: "0.82", examples: "Kabuki, Van der Woude, SATB2-associated", fillWidth: "82%", tags: ["orofacial", "structural"] },
                    { rank: 2, category: "Neurodevelopmental", diseasesWithPhenotype: "14 / 166", meanScore: "0.68", examples: "CHARGE, Smith-Lemli-Opitz, Pitt-Hopkins", fillWidth: "68%", tags: ["developmental", "multisystem"] },
                    { rank: 3, category: "Chromatin / transcription", diseasesWithPhenotype: "9 / 74", meanScore: "0.61", examples: "Kabuki, Bohring-Opitz, Wiedemann-Steiner", fillWidth: "61%", tags: ["epigenetic", "face / speech"] },
                    { rank: 4, category: "Copy-number syndromes", diseasesWithPhenotype: "7 / 58", meanScore: "0.56", examples: "22q11.2 deletion, 1p36 deletion, 3q29 deletion", fillWidth: "56%", tags: ["CNV"] },
                    { rank: 5, category: "Connective / skeletal", diseasesWithPhenotype: "6 / 92", meanScore: "0.44", examples: "Stickler, Loeys-Dietz, Aarskog-Scott", fillWidth: "44%", tags: ["skeletal"] },
                ],
                topDiseases: [
                    {
                        disease: "Kabuki syndrome",
                        category: "Craniofacial",
                        queryLevel: "Obligate",
                        queryLevelKey: "obligate",
                        totalPhenotypeTerms: 24,
                        obligatePhenotypeTerms: 4,
                        frequencyComposition: [
                            { key: "obligate", label: "Obligate", count: 4 },
                            { key: "very-frequent", label: "Very frequent", count: 5 },
                            { key: "frequent", label: "Frequent", count: 6 },
                            { key: "occasional", label: "Occasional", count: 7 },
                            { key: "rare", label: "Rare", count: 2 },
                        ],
                    },
                    {
                        disease: "Van der Woude syndrome",
                        category: "Craniofacial",
                        queryLevel: "Very frequent",
                        queryLevelKey: "very-frequent",
                        totalPhenotypeTerms: 14,
                        obligatePhenotypeTerms: 2,
                        frequencyComposition: [
                            { key: "obligate", label: "Obligate", count: 2 },
                            { key: "very-frequent", label: "Very frequent", count: 4 },
                            { key: "frequent", label: "Frequent", count: 3 },
                            { key: "occasional", label: "Occasional", count: 3 },
                            { key: "rare", label: "Rare", count: 2 },
                        ],
                    },
                    {
                        disease: "CHARGE syndrome",
                        category: "Neurodevelopmental",
                        queryLevel: "Frequent",
                        queryLevelKey: "frequent",
                        totalPhenotypeTerms: 22,
                        obligatePhenotypeTerms: 5,
                        frequencyComposition: [
                            { key: "obligate", label: "Obligate", count: 5 },
                            { key: "very-frequent", label: "Very frequent", count: 4 },
                            { key: "frequent", label: "Frequent", count: 6 },
                            { key: "occasional", label: "Occasional", count: 5 },
                            { key: "rare", label: "Rare", count: 2 },
                        ],
                    },
                    {
                        disease: "SATB2-associated syndrome",
                        category: "Craniofacial",
                        queryLevel: "Frequent",
                        queryLevelKey: "frequent",
                        totalPhenotypeTerms: 18,
                        obligatePhenotypeTerms: 3,
                        frequencyComposition: [
                            { key: "obligate", label: "Obligate", count: 3 },
                            { key: "very-frequent", label: "Very frequent", count: 3 },
                            { key: "frequent", label: "Frequent", count: 5 },
                            { key: "occasional", label: "Occasional", count: 5 },
                            { key: "rare", label: "Rare", count: 2 },
                        ],
                    },
                    {
                        disease: "22q11.2 deletion syndrome",
                        category: "Copy-number",
                        queryLevel: "Occasional",
                        queryLevelKey: "occasional",
                        totalPhenotypeTerms: 19,
                        obligatePhenotypeTerms: 4,
                        frequencyComposition: [
                            { key: "obligate", label: "Obligate", count: 4 },
                            { key: "very-frequent", label: "Very frequent", count: 4 },
                            { key: "frequent", label: "Frequent", count: 5 },
                            { key: "occasional", label: "Occasional", count: 4 },
                            { key: "rare", label: "Rare", count: 2 },
                        ],
                    },
                ],
                ageBins: [
                    { label: "0-4", female: 10, male: 8, femaleHeight: "34px", maleHeight: "28px" },
                    { label: "5-12", female: 16, male: 13, femaleHeight: "56px", maleHeight: "46px" },
                    { label: "13-18", female: 21, male: 15, femaleHeight: "74px", maleHeight: "52px" },
                    { label: "19-30", female: 19, male: 12, femaleHeight: "66px", maleHeight: "42px" },
                    { label: "30+", female: 11, male: 7, femaleHeight: "38px", maleHeight: "24px" },
                ],
                coObserved: [
                    { label: "Feeding difficulty [HP:0011968]", group: "Digestive [HP:0025031]", count: "61 / 132", width: "61%" },
                    { label: "Micrognathia [HP:0000347]", group: "HeadNeck [HP:0000152]", count: "54 / 132", width: "54%" },
                    { label: "Speech delay [HP:0000750]", group: "Nervous [HP:0000707]", count: "49 / 132", width: "49%" },
                    { label: "Hearing loss [HP:0000365]", group: "Ear [HP:0000598]", count: "37 / 132", width: "37%" },
                    { label: "Hypotonia [HP:0001252]", group: "Nervous [HP:0000707]", count: "32 / 132", width: "32%" },
                ],
                partnerComposition: [
                    { label: "Nervous", count: 2, height: "46px" },
                    { label: "Digestive", count: 1, height: "24px" },
                    { label: "HeadNeck", count: 1, height: "24px" },
                    { label: "Ear", count: 1, height: "24px" },
                ],
            },
        };
    },
};
</script>

<style scoped>
.glens-page {
    padding: 1.75rem 1rem 2.5rem;
    background: linear-gradient(180deg, #f6f9ff 0%, #eef4ff 52%, #edf6f1 100%);
}

.glens-phenotype {
    max-width: 1380px;
    margin: 0 auto;
}

.glens-header-card,
.glens-card,
.glens-nav-card {
    border-radius: 1.5rem;
    background: rgba(255, 255, 255, 0.78);
    box-shadow: 0 18px 40px rgba(22, 32, 51, 0.08);
}

.glens-header-card {
    padding: 1.3rem 1.5rem;
}

.glens-card {
    margin-top: 1rem;
    padding: 1.35rem;
}

.glens-card--hero {
    padding: 1.55rem;
    background: linear-gradient(160deg, rgba(244, 248, 255, 0.96), rgba(255, 255, 255, 0.94));
}

.glens-card--context {
    padding-bottom: 1.15rem;
}

.glens-header-row,
.glens-section-head,
.glens-section-head--compact,
.glens-context-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.glens-header-main {
    min-width: 0;
}

.glens-page-eyebrow,
.glens-section-label,
.glens-small-meta,
.glens-age-label,
.glens-composition-label,
.glens-candidate-metric-label {
    margin: 0;
    color: #526276;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
}

.glens-page-title,
.glens-section-title,
.glens-emphasis,
.glens-candidate-title {
    margin: 0;
    color: #162033;
    font-weight: 800;
}

.glens-page-title {
    font-size: 2rem;
}

.glens-section-title {
    font-size: 1.2rem;
}

.glens-section-title--hero {
    font-size: 1.55rem;
}

.glens-candidate-title {
    margin-top: 0.75rem;
    font-size: 1.18rem;
    line-height: 1.2;
}

.glens-subtitle,
.glens-muted,
.glens-inline-meta,
.glens-summary-stack,
.glens-summary-block p,
.glens-section-copy {
    color: #526276;
}

.glens-subtitle {
    margin: 0.45rem 0 0;
    font-size: 1rem;
    font-weight: 600;
}

.glens-inline-meta,
.glens-summary-stack,
.glens-summary-chip,
.glens-chip,
.glens-tag-row,
.glens-candidate-topline,
.glens-candidate-tags,
.glens-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
}

.glens-inline-meta {
    margin-top: 0.7rem;
    font-size: 0.88rem;
    font-weight: 700;
}

.glens-summary-stack {
    justify-content: flex-end;
}

.glens-summary-chip,
.glens-chip,
.glens-link-pill,
.glens-frequency-pill,
.glens-domain-pill,
.glens-mini-tag {
    display: inline-flex;
    align-items: center;
    padding: 0.42rem 0.8rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 700;
}

.glens-summary-chip {
    background: #f1f5f9;
    color: #526276;
}

.glens-summary-chip--blue,
.glens-chip--blue {
    background: #e5f0ff;
    color: #0d4d91;
}

.glens-chip {
    background: #f1f5f9;
    color: #526276;
}

.glens-chip--amber {
    background: #fff3d9;
    color: #a78333;
}

.glens-chip--green {
    background: #e7f5ee;
    color: #3f715b;
}

.glens-chip--hero {
    background: #edf2ff;
    color: #2f5ea8;
}

.glens-section-copy {
    margin: 0.45rem 0 0;
    max-width: 40rem;
    font-size: 0.92rem;
    line-height: 1.55;
}

.glens-section-copy--compact {
    max-width: 28rem;
}

.glens-candidate-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.9rem;
    margin-top: 1.15rem;
}

.glens-candidate-card {
    padding: 1rem;
    border: 1px solid rgba(219, 229, 239, 0.9);
    border-radius: 1.2rem;
    background: rgba(255, 255, 255, 0.9);
}

.glens-frequency-pill {
    background: #162033;
    color: #fff;
}

.glens-domain-pill {
    background: #eef3fb;
    color: #526276;
}

.glens-candidate-metrics {
    display: grid;
    gap: 0.7rem;
    margin-top: 0.9rem;
}

.glens-candidate-metric {
    padding: 0.7rem 0.8rem;
    border-radius: 0.95rem;
    background: #f8fbff;
}

.glens-candidate-metric strong {
    display: block;
    margin-top: 0.28rem;
    color: #162033;
    font-size: 0.96rem;
}

.glens-frequency-composition {
    margin-top: 0.95rem;
}

.glens-frequency-label-row {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.35rem;
}

.glens-frequency-label {
    padding: 0.28rem 0.18rem;
    border-radius: 0.55rem;
    color: #6b7b8d;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    line-height: 1.15;
    text-align: center;
}

.glens-frequency-label--active {
    color: #162033;
    background: #eef3fb;
}

.glens-frequency-strip {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.35rem;
    margin-top: 0.35rem;
}

.glens-frequency-segment {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 2.5rem;
    border: 1px solid rgba(203, 213, 225, 0.75);
    border-radius: 0.8rem;
    background: #f8fbff;
    color: #526276;
    font-size: 0.86rem;
    font-weight: 800;
}

.glens-frequency-segment--active {
    border: 2px solid #2f5ea8;
    background: #e8f0ff;
    color: #162033;
    box-shadow: 0 0 0 1px rgba(47, 94, 168, 0.08);
}

.glens-mini-tag {
    background: #f8fafc;
    color: #526276;
    padding: 0.28rem 0.6rem;
    font-size: 0.7rem;
}

.glens-reasoning-grid,
.glens-context-grid {
    margin-top: 0.1rem;
}

.mt-space {
    margin-top: 0.9rem;
}

.glens-table {
    display: grid;
    gap: 0.55rem;
}

.glens-table-row {
    display: grid;
    align-items: center;
    gap: 1rem;
    padding: 0.9rem 1rem;
    border-radius: 1rem;
    background: rgba(248, 250, 252, 0.92);
}

.glens-table-row--head {
    background: rgba(237, 242, 247, 0.92);
    color: #526276;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}

.glens-gene-grid {
    grid-template-columns: 0.55fr 1fr 0.9fr 1fr 1.35fr;
}

.glens-category-grid {
    grid-template-columns: 0.45fr 1.15fr 1fr 0.8fr 1.35fr;
}

.glens-category-row {
    position: relative;
    overflow: hidden;
    border-radius: 1rem;
}

.glens-category-fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: linear-gradient(90deg, rgba(248, 219, 124, 0.34), rgba(255, 255, 255, 0));
}

.glens-category-grid--body {
    position: relative;
    background: rgba(255, 255, 255, 0.74);
}

.glens-rank {
    color: #2f5ea8;
    font-size: 1rem;
}

.glens-partner-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.75rem 1rem;
    align-items: start;
    margin-top: 0.9rem;
}

.glens-partner-row:first-child {
    margin-top: 0;
}

.glens-partner-main {
    min-width: 0;
}

.glens-partner-meta {
    text-align: right;
    color: #526276;
    font-size: 0.86rem;
    font-weight: 700;
}

.glens-partner-bar-shell {
    grid-column: 1 / -1;
    height: 0.72rem;
    border-radius: 999px;
    background: #eef2f7;
    overflow: hidden;
}

.glens-partner-bar {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #5a84c2, #2f5ea8);
}

.glens-composition-card {
    margin-top: 1.15rem;
    padding: 1rem;
    border-radius: 1.15rem;
    background: #f8fbff;
}

.glens-composition-bars {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    margin-top: 0.9rem;
    min-height: 4.6rem;
}

.glens-composition-col {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
}

.glens-composition-bar {
    width: 1.75rem;
    border-radius: 0.55rem 0.55rem 0 0;
    background: linear-gradient(180deg, #7ea6ff, #2f5ea8);
}

.glens-summary-block {
    display: grid;
    gap: 0.75rem;
    padding: 1.05rem 1.1rem;
    border-radius: 1.15rem;
    background: #f8fbff;
}

.glens-summary-block p {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
}

.glens-age-card {
    padding: 1rem;
    border-radius: 1.15rem;
    border: 1px solid #dbe5ef;
    background: #fff;
}

.glens-age-bars {
    display: flex;
    align-items: flex-end;
    gap: 0.9rem;
    min-height: 7.6rem;
}

.glens-age-col {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    align-items: center;
    gap: 0.45rem;
}

.glens-age-pair {
    display: flex;
    align-items: flex-end;
    gap: 0.4rem;
}

.glens-age-bar-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
}

.glens-age-count {
    color: #526276;
    font-size: 0.7rem;
    font-weight: 700;
}

.glens-age-bar {
    width: 1.1rem;
    border-radius: 0.4rem 0.4rem 0 0;
}

.glens-age-bar--female,
.glens-dot--female {
    background: #5a84c2;
}

.glens-age-bar--male,
.glens-dot--male {
    background: #355f83;
}

.glens-dot {
    display: inline-block;
    width: 0.68rem;
    height: 0.68rem;
    margin-right: 0.35rem;
    border-radius: 999px;
}

.glens-age-label {
    font-size: 0.68rem;
}

.glens-nav-card {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1rem;
    padding: 1rem 1.2rem;
}

.glens-link-pill {
    background: #fff;
    border: 1px solid #dbe5ef;
    color: #526276;
    text-decoration: none;
}

@media (max-width: 1399.98px) {
    .glens-candidate-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (max-width: 1199.98px) {
    .glens-candidate-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .glens-gene-grid,
    .glens-category-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 991.98px) {
    .glens-header-row,
    .glens-section-head,
    .glens-context-head {
        display: block;
    }

    .glens-summary-stack,
    .glens-chip,
    .glens-section-copy {
        margin-top: 0.75rem;
    }

    .glens-summary-stack {
        justify-content: flex-start;
    }
}

@media (max-width: 767.98px) {
    .glens-page {
        padding: 1.2rem 0.75rem 2rem;
    }

    .glens-header-card,
    .glens-card,
    .glens-nav-card {
        border-radius: 1.15rem;
    }

    .glens-candidate-grid {
        grid-template-columns: 1fr;
    }

    .glens-age-bars,
    .glens-composition-bars {
        overflow-x: auto;
        padding-bottom: 0.25rem;
    }
}
</style>
