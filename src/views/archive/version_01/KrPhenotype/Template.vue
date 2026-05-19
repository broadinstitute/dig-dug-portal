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
                            <h1 class="glens-page-title">{{ phenotype.query.primary }}</h1>
                            <p class="glens-subtitle">{{ phenotype.query.secondary }}</p>
                            <div class="glens-inline-meta">
                                <span>phenotype search</span>
                                <span>|</span>
                                <span>{{ phenotype.summary.matchedLabel }}</span>
                            </div>
                        </div>
                        <div class="glens-summary-inline">
                            <span>{{ phenotype.summary.cohortLabel }}</span>
                            <span>|</span>
                            <span>{{ phenotype.summary.probandLabel }}</span>
                            <span>|</span>
                            <span>{{ phenotype.summary.genesLabel }}</span>
                        </div>
                    </div>
                </section>

                <section class="row glens-main-grid">
                    <div class="col-xl-7">
                        <div class="glens-card">
                            <div class="glens-section-head">
                                <div>
                                    <p class="glens-section-label">Genes Enriched In Matched Samples</p>
                                    <h2 class="glens-section-title">
                                        Gene-level signal within matched phenotype cohort
                                    </h2>
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
                        </div>

                        <div class="glens-card glens-card--mt">
                            <div class="glens-section-head">
                                <div>
                                    <p class="glens-section-label">Related Disease Categories</p>
                                    <h2 class="glens-section-title">Phenotype-linked disease domains</h2>
                                </div>
                                <span class="glens-chip glens-chip--amber">ranked by mean phenotype score</span>
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

                        <div class="glens-card glens-card--mt">
                            <div class="glens-section-head">
                                <div>
                                    <p class="glens-section-label">Top Specific Diseases</p>
                                    <h2 class="glens-section-title">Highest phenotype-frequency matches</h2>
                                </div>
                                <span class="glens-chip">frequency-first ordering</span>
                            </div>
                            <div class="glens-table mt-space">
                                <div class="glens-table-row glens-table-row--head glens-disease-grid">
                                    <span>Frequency level</span>
                                    <span>Disease</span>
                                    <span>Category</span>
                                </div>
                                <div
                                    v-for="row in phenotype.topDiseases"
                                    :key="row.disease"
                                    class="glens-table-row glens-disease-grid"
                                >
                                    <span>{{ row.frequency }}</span>
                                    <strong class="glens-emphasis">{{ row.disease }}</strong>
                                    <span>{{ row.category }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-5">
                        <div class="glens-card">
                            <div class="glens-section-head">
                                <div>
                                    <p class="glens-section-label">Cohort Overview</p>
                                    <h2 class="glens-section-title">Matched phenotype cohort</h2>
                                </div>
                                <span class="glens-chip glens-chip--green">summary + age split</span>
                            </div>

                            <div class="glens-summary-block mt-space">
                                <p>{{ phenotype.summary.matchedLabel }}</p>
                                <p>{{ phenotype.summary.cohortLabel }}</p>
                                <p>{{ phenotype.summary.probandLabel }}</p>
                                <p>{{ phenotype.summary.sexLabel }}</p>
                            </div>

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
                                                <div class="glens-age-bar glens-age-bar--female" :style="{ height: bin.femaleHeight }"></div>
                                            </div>
                                            <div class="glens-age-bar-wrap">
                                                <div class="glens-age-count">{{ bin.male }}</div>
                                                <div class="glens-age-bar glens-age-bar--male" :style="{ height: bin.maleHeight }"></div>
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

                        <div class="glens-card glens-card--mt">
                            <div class="glens-section-head">
                                <div>
                                    <p class="glens-section-label">Co-observed Phenotypes</p>
                                    <h2 class="glens-section-title">Frequent phenotype partners</h2>
                                </div>
                                <span class="glens-chip">top representative terms</span>
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
                                    <p class="glens-section-label">Partner Category Composition</p>
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

                <section class="glens-nav-card">
                    <a class="glens-link-pill" href="/krVariant_V3.html">Open variant evidence</a>
                    <a class="glens-link-pill" href="#related-genes">View related genes</a>
                    <span class="glens-link-pill">Patient similarity</span>
                </section>
            </div>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<script>
export default {
    name: "KrPhenotypeTemplate",
    data() {
        return {
            phenotype: {
                query: {
                    primary: "cleft palate [HP:0000175]",
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
                    { frequency: "Obligate", disease: "Kabuki syndrome", category: "Craniofacial" },
                    { frequency: "Very frequent", disease: "Van der Woude syndrome", category: "Craniofacial" },
                    { frequency: "Frequent", disease: "CHARGE syndrome", category: "Neurodevelopmental" },
                    { frequency: "Frequent", disease: "SATB2-associated syndrome", category: "Craniofacial" },
                    { frequency: "Occasional", disease: "22q11.2 deletion syndrome", category: "Copy-number" },
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
    padding: 1.75rem 1rem 2.25rem;
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
    background: rgba(255, 255, 255, 0.76);
    box-shadow: 0 18px 40px rgba(22, 32, 51, 0.08);
}

.glens-header-card {
    padding: 1.2rem 1.5rem;
}

.glens-header-row,
.glens-section-head,
.glens-section-head--compact {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.glens-header-main {
    min-width: 0;
}

.glens-page-title,
.glens-section-title,
.glens-emphasis {
    margin: 0;
    color: #162033;
    font-weight: 800;
}

.glens-page-title { font-size: 2rem; }
.glens-section-title { font-size: 1.2rem; }

.glens-subtitle,
.glens-muted,
.glens-small-meta,
.glens-inline-meta,
.glens-summary-inline,
.glens-summary-block p,
.glens-age-label,
.glens-composition-label {
    color: #526276;
    font-weight: 600;
}

.glens-subtitle {
    margin: 0.3rem 0 0;
    font-size: 1.05rem;
}

.glens-inline-meta,
.glens-summary-inline,
.glens-legend,
.glens-nav-card {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.glens-inline-meta { margin-top: 0.55rem; }

.glens-summary-inline span:nth-child(2n) {
    color: #cbd5e1;
}

.glens-main-grid { margin-top: 0.15rem; }

.glens-main-grid > [class*="col-"] {
    display: flex;
    flex-direction: column;
}

.glens-card {
    margin-top: 0.9rem;
    padding: 1.25rem;
}

.glens-main-grid > [class*="col-"] > .glens-card:first-child {
    margin-top: 0.9rem;
}

.glens-card--mt { margin-top: 1rem; }

.glens-section-label {
    margin: 0;
    color: #526276;
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
}

.glens-chip,
.glens-link-pill,
.glens-mini-tag {
    display: inline-flex;
    align-items: center;
    padding: 0.45rem 0.8rem;
    border-radius: 999px;
    background: #f1f5f9;
    color: #526276;
    font-size: 0.8rem;
    font-weight: 700;
}

.glens-chip--blue { background: #e6f0ff; color: #0d4d91; }
.glens-chip--amber { background: #fff4db; color: #a78333; }
.glens-chip--green { background: #eaf5ef; color: #3f715b; }

.mt-space { margin-top: 0.9rem; }

.glens-table {
    overflow: hidden;
    border: 1px solid #dbe5ef;
    border-radius: 1.25rem;
    background: #fff;
}

.glens-table-row {
    display: grid;
    gap: 0.9rem;
    align-items: center;
    padding: 0.95rem 1rem;
    border-bottom: 1px solid #eef2f7;
    font-size: 0.85rem;
}

.glens-table-row:last-child { border-bottom: 0; }

.glens-table-row--head {
    background: #f8fafc;
    color: #526276;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
}

.glens-gene-grid {
    grid-template-columns: 3.25rem 6.5rem minmax(0, 0.9fr) 7rem minmax(0, 1fr);
}

.glens-category-grid {
    grid-template-columns: 3.25rem minmax(0, 1.2fr) 7.5rem 6.5rem minmax(0, 1fr);
}

.glens-category-grid--body {
    position: relative;
    z-index: 1;
}

.glens-disease-grid {
    grid-template-columns: 7.5rem minmax(0, 1.15fr) 7rem;
}

.glens-rank {
    color: #0d4d91;
    font-size: 1.1rem;
    font-weight: 800;
}

.glens-tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.35rem;
}

.glens-mini-tag {
    padding: 0.2rem 0.5rem;
    font-size: 0.62rem;
}

.glens-category-row {
    position: relative;
    overflow: hidden;
    border-bottom: 1px solid #eef2f7;
}

.glens-category-row:last-child { border-bottom: 0; }

.glens-category-fill {
    position: absolute;
    top: 0.3rem;
    bottom: 0.3rem;
    left: 0.35rem;
    border-radius: 0.9rem;
    background: linear-gradient(90deg, rgba(251, 191, 36, 0.22) 0%, rgba(253, 230, 138, 0.12) 100%);
}

.glens-summary-block {
    padding: 1rem;
    border: 1px solid #dbe5ef;
    border-radius: 1.15rem;
    background: #fff;
}

.glens-summary-block p {
    margin: 0 0 0.45rem;
    font-size: 0.95rem;
}

.glens-summary-block p:last-child { margin-bottom: 0; }

.glens-age-card,
.glens-composition-card {
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid #dbe5ef;
    border-radius: 1.15rem;
    background: #fff;
}

.glens-age-bars,
.glens-composition-bars {
    display: flex;
    align-items: flex-end;
    gap: 0.9rem;
}

.glens-age-bars { min-height: 8.5rem; }

.glens-age-col,
.glens-composition-col {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 0.35rem;
}

.glens-age-pair {
    display: flex;
    align-items: flex-end;
    gap: 0.35rem;
}

.glens-age-bar-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
}

.glens-age-count {
    color: #526276;
    font-size: 0.68rem;
    font-weight: 700;
}

.glens-age-bar,
.glens-composition-bar {
    width: 1rem;
    border-radius: 0.35rem 0.35rem 0 0;
}

.glens-age-bar--female { background: #5a84c2; }
.glens-age-bar--male { background: #355f83; }
.glens-composition-bar { width: 2rem; background: #3f715b; }

.glens-age-label,
.glens-composition-label {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    text-align: center;
}

.glens-dot {
    display: inline-block;
    width: 0.65rem;
    height: 0.65rem;
    margin-right: 0.35rem;
    border-radius: 999px;
}

.glens-dot--female { background: #5a84c2; }
.glens-dot--male { background: #355f83; }

.glens-partner-row {
    margin-bottom: 1rem;
}

.glens-partner-main,
.glens-partner-meta {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
}

.glens-partner-meta {
    justify-content: flex-end;
    min-width: 11rem;
    margin-top: -1.1rem;
    margin-left: auto;
    text-align: right;
}

.glens-partner-bar-shell {
    height: 0.7rem;
    margin-top: 0.45rem;
    border-radius: 999px;
    background: #eef2f7;
    overflow: hidden;
}

.glens-partner-bar {
    height: 100%;
    border-radius: 999px;
    background: #3f715b;
}

.glens-nav-card {
    align-items: center;
    gap: 0.65rem;
    margin-top: 0.9rem;
    padding: 1rem 1.25rem;
}

.glens-link-pill {
    border: 1px solid #dbe5ef;
    background: #fff;
    text-decoration: none;
}

@media (max-width: 1199.98px) {
    .glens-partner-meta {
        margin-top: 0.25rem;
    }

    .glens-main-grid > [class*="col-"] {
        display: block;
    }
}

@media (max-width: 991.98px) {
    .glens-header-row,
    .glens-section-head {
        display: block;
    }

    .glens-summary-inline,
    .glens-chip {
        margin-top: 0.75rem;
    }

    .glens-page {
        padding: 1.35rem 0.85rem 2rem;
    }
}

@media (max-width: 767.98px) {
    .glens-gene-grid,
    .glens-category-grid,
    .glens-disease-grid {
        grid-template-columns: 1fr;
    }

    .glens-partner-meta {
        min-width: 0;
        margin-top: 0.4rem;
        text-align: left;
    }

    .glens-header-card,
    .glens-card,
    .glens-nav-card {
        border-radius: 1.15rem;
    }

    .glens-age-bars,
    .glens-composition-bars {
        gap: 0.5rem;
    }
}
</style>
