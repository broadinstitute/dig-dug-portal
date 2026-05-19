<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body glens-page">
            <div class="glens-variant">
                <section class="glens-header-card">
                    <div class="glens-header-row">
                        <div>
                            <h1 class="glens-page-title">{{ variant.query.label }}</h1>
                            <div class="glens-inline-meta">
                            <span>{{ variant.query.window }}</span>
                                <span>|</span>
                                <span>{{ variant.query.build }}</span>
                            </div>
                        </div>
                        <div class="glens-summary-inline">
                            <span>18 carriers</span>
                            <span>|</span>
                            <span>3 genes</span>
                            <span>|</span>
                            <span>3 regions</span>
                        </div>
                    </div>
                </section>

                <section class="glens-panel-card">
                    <div class="glens-top-tools">
                        <div class="glens-pill-row">
                            <span class="glens-pill">Exact variant carriers shown</span>
                            <span class="glens-pill glens-pill--amber">Disease</span>
                            <span class="glens-pill">Gene</span>
                            <span class="glens-pill glens-pill--blue">Focal gene</span>
                            <span class="glens-pill glens-pill--coral">Variant</span>
                        </div>
                        <div class="glens-pill-row">
                            <a class="glens-link-pill" href="#variant-evidence">Variant Evidence</a>
                            <a class="glens-link-pill" href="#phenotype-details">Phenotype Details</a>
                            <span class="glens-link-pill">Disease Signals</span>
                        </div>
                    </div>

                    <div class="glens-locus-card" :style="locusGridStyle">
                        <div class="glens-axis-row">
                            <span v-for="tick in variant.axisTicks" :key="tick">{{ tick }}</span>
                        </div>
                        <div class="glens-band-label">15q11.3</div>
                        <div class="glens-focus-line"></div>

                        <div class="glens-track-row">
                            <div class="glens-track-label">Disease</div>
                            <div class="glens-track glens-track--disease">
                                <div
                                    v-for="region in variant.diseaseRegions"
                                    :key="region.label"
                                    class="glens-region"
                                    :class="`glens-region--${region.domainKey}`"
                                    :style="region.style"
                                >
                                    <span>{{ region.label }}</span>
                                    <span class="glens-region-domain">| {{ region.domain }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="glens-track-row">
                            <div class="glens-track-label">Gene</div>
                            <div class="glens-track">
                                <div
                                    v-for="gene in variant.genes"
                                    :key="gene.label"
                                    class="glens-gene"
                                    :class="{ 'glens-gene--focal': gene.focal }"
                                    :style="gene.style"
                                >
                                    {{ gene.label }}
                                </div>
                            </div>
                        </div>

                        <div class="glens-track-row">
                            <div class="glens-track-label">Variant</div>
                            <div class="glens-track">
                                <div
                                    v-for="marker in variant.markers"
                                    :key="marker.label + marker.left"
                                    class="glens-marker"
                                    :class="{ 'glens-marker--focus': marker.focal }"
                                    :style="{ left: marker.left }"
                                >
                                    <span v-if="marker.badge" class="glens-marker-badge">{{ marker.badge }}</span>
                                    <span class="glens-marker-shape">{{ marker.focal ? "●" : marker.label }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="glens-track-row glens-track-row--density">
                            <div class="glens-track-label">Density</div>
                            <div>
                                <div class="glens-density-head">
                                    <div class="glens-density-title">Per-position carrier stack</div>
                                    <label class="glens-select-label" for="density-investigator">
                                        Investigator
                                        <select
                                            id="density-investigator"
                                            v-model="activeInvestigator"
                                            class="glens-select"
                                        >
                                            <option
                                                v-for="investigator in investigatorOptions"
                                                :key="investigator.key"
                                                :value="investigator.key"
                                            >
                                                {{ investigator.label }}
                                            </option>
                                        </select>
                                    </label>
                                </div>
                                <div class="glens-density-track">
                                    <div
                                        v-for="series in renderedDensitySeries"
                                        :key="series.key"
                                        class="glens-density-series"
                                        :class="[
                                            `glens-density-series--${series.key}`,
                                            { 'glens-density-series--active': series.active }
                                        ]"
                                    >
                                        <span
                                            v-for="(height, index) in series.bins"
                                            :key="`${series.key}-${index}`"
                                            class="glens-density-bar"
                                            :style="{ height: densityBarHeight(height) }"
                                        ></span>
                                    </div>
                                </div>
                                <div class="glens-density-filters">
                                    <button
                                        v-for="mode in densityModes"
                                        :key="mode.key"
                                        class="glens-filter"
                                        :class="[
                                            `glens-filter--${mode.key}`,
                                            { 'glens-filter--active': activeDensity === mode.key }
                                        ]"
                                        type="button"
                                        @click="activeDensity = mode.key"
                                    >
                                        {{ mode.label }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="row glens-bottom-grid">
                    <div class="col-xl-4">
                        <div id="variant-evidence" class="glens-card">
                            <p class="glens-section-label">Variant Evidence</p>
                            <div class="glens-kv-grid">
                                <div v-for="item in variant.evidence" :key="item.label" class="glens-kv-row">
                                    <span>{{ item.label }}</span>
                                    <strong>{{ item.value }}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-8">
                        <div id="phenotype-details" class="glens-card">
                            <div class="row">
                                <div class="col-lg-6">
                                    <div class="glens-section-head">
                                        <p class="glens-section-label">Phenotype Summary</p>
                                        <label class="glens-select-label" for="phenotype-investigator">
                                            Investigator
                                            <select
                                                id="phenotype-investigator"
                                                v-model="activePhenotypeInvestigator"
                                                class="glens-select"
                                            >
                                                <option
                                                    v-for="investigator in investigatorOptions"
                                                    :key="`phenotype-${investigator.key}`"
                                                    :value="investigator.key"
                                                >
                                                    {{ investigator.label }}
                                                </option>
                                            </select>
                                        </label>
                                    </div>
                                    <div class="glens-legend">
                                        <span><i class="glens-dot glens-dot--blue"></i>All</span>
                                        <span><i class="glens-dot glens-dot--orange"></i>Proband</span>
                                    </div>
                                    <div
                                        v-for="phenotype in phenotypeRows"
                                        :key="phenotype.label"
                                        class="glens-bar-group"
                                        :class="{ 'glens-bar-group--active': activePhenotypeCategory === phenotype.label }"
                                        @click="activePhenotypeCategory = phenotype.label"
                                    >
                                        <div class="glens-bar-header">
                                            <span>{{ phenotype.label }}</span>
                                            <span>{{ phenotype.all }}% / {{ phenotype.proband }}%</span>
                                        </div>
                                        <div class="glens-bar-shell">
                                            <div class="glens-bar glens-bar--blue" :style="{ width: phenotype.all + '%' }"></div>
                                        </div>
                                        <div class="glens-bar-shell glens-bar-shell--sub">
                                            <div class="glens-bar glens-bar--orange" :style="{ width: phenotype.proband + '%' }"></div>
                                        </div>
                                    </div>
                                    <div class="glens-phenotype-detail">
                                        <div class="glens-detail-head">
                                            <strong>{{ activePhenotypeCategory }}</strong>
                                            <span>top phenotype terms</span>
                                        </div>
                                        <div
                                            v-for="item in activePhenotypeDetails"
                                            :key="item.label"
                                            class="glens-detail-row"
                                        >
                                            <span>{{ item.label }}</span>
                                            <strong>{{ item.value }}%</strong>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-lg-6">
                                    <div class="glens-section-head">
                                        <p class="glens-section-label">Demographic Summary</p>
                                        <span class="glens-small-meta">Age-first</span>
                                    </div>
                                    <div class="glens-age-card">
                                        <div class="glens-age-bars">
                                            <div
                                                v-for="bin in variant.demographics.ageBins"
                                                :key="bin.label"
                                                class="glens-age-col"
                                            >
                                                <div class="glens-age-count">{{ bin.total }}</div>
                                                <div class="glens-age-stack">
                                                    <div class="glens-age-female" :style="{ height: bin.femaleHeight }"></div>
                                                    <div class="glens-age-male" :style="{ height: bin.maleHeight }"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="glens-age-labels">
                                            <span v-for="bin in variant.demographics.ageBins" :key="bin.label">{{ bin.label }}</span>
                                        </div>
                                    </div>
                                    <div class="glens-demography-line">
                                        <span><i class="glens-dot glens-dot--female"></i>Female 56%</span>
                                        <span><i class="glens-dot glens-dot--male"></i>Male 44%</span>
                                        <span class="glens-mini-pill">Proband 68%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<script>
export default {
    name: "KrVariantTemplateV2",
    data() {
        return {
            activeDensity: "all",
            activeInvestigator: "all-investigators",
            activePhenotypeInvestigator: "all-investigators",
            activePhenotypeCategory: "Neuro",
            variant: {
                query: {
                    label: "chr15:22,000,220 G>C",
                    window: "UBE3A-centered locus | chr15:21.997M-22.006M",
                    build: "GRCh38",
                },
                axisTicks: ["21.997M", "21.999M", "22.001M", "22.003M", "22.005M"],
                diseaseRegions: [
                    { label: "Angelman syndrome", domain: "neural", domainKey: "neural", style: "left:8%; top:14%; width:46%;" },
                    { label: "15q11-q13 microdeletion", domain: "neurodevelopmental", domainKey: "neurodevelopmental", style: "left:25%; top:54%; width:58%;" },
                    { label: "Dup15q syndrome", domain: "neural", domainKey: "neural", style: "left:57%; top:14%; width:31%;" },
                ],
                genes: [
                    { label: "SNHG14", style: "left:8%; width:15%;" },
                    { label: "UBE3A", style: "left:39%; width:23%;", focal: true },
                    { label: "ATP10A", style: "left:73%; width:13%;" },
                ],
                markers: [
                    { label: "LP", left: "35.2%", badge: "LP" },
                    { label: "●", left: "50.5%", badge: "G>C", focal: true },
                    { label: "P", left: "63.1%", badge: "P" },
                ],
                densitySeries: {
                    "all-investigators": {
                        all: [0, 1, 1, 2, 2, 3, 4, 5, 4, 3, 5, 6, 7, 8, 9, 10, 12, 11, 10, 9, 11, 13, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 7, 8, 9, 10, 11, 12, 10, 9, 8, 7, 6, 5, 4, 3, 3, 2, 2, 1],
                        affected: [0, 0, 0, 1, 1, 1, 2, 2, 2, 1, 2, 3, 4, 5, 6, 7, 8, 7, 7, 6, 7, 8, 9, 10, 9, 8, 8, 7, 7, 6, 5, 4, 5, 5, 6, 7, 7, 8, 7, 6, 5, 4, 4, 3, 2, 2, 1, 1, 1, 0],
                        proband: [0, 0, 0, 0, 1, 1, 1, 2, 2, 1, 2, 2, 3, 4, 4, 5, 6, 6, 5, 5, 6, 7, 8, 8, 7, 7, 6, 6, 5, 5, 4, 3, 4, 4, 5, 5, 6, 6, 5, 5, 4, 3, 3, 2, 2, 1, 1, 1, 0, 0],
                    },
                    "investigator-1": {
                        all: [0, 0, 1, 1, 1, 2, 2, 3, 2, 2, 3, 4, 4, 5, 6, 7, 8, 8, 7, 6, 7, 8, 9, 10, 9, 8, 7, 7, 6, 5, 5, 4, 4, 5, 5, 6, 6, 7, 6, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0, 0],
                        affected: [0, 0, 0, 1, 1, 1, 1, 2, 2, 1, 2, 2, 3, 4, 4, 5, 6, 5, 5, 4, 5, 6, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 3, 4, 4, 5, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0, 0, 0],
                        proband: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 5, 5, 4, 4, 5, 5, 6, 6, 5, 5, 4, 4, 4, 3, 3, 2, 3, 3, 4, 4, 4, 4, 3, 3, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0],
                    },
                    "investigator-2": {
                        all: [0, 1, 1, 1, 2, 2, 3, 3, 2, 2, 3, 3, 4, 5, 5, 6, 7, 6, 6, 5, 6, 7, 8, 8, 7, 7, 7, 6, 6, 5, 4, 4, 5, 5, 6, 6, 7, 8, 7, 6, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0],
                        affected: [0, 0, 0, 0, 1, 1, 2, 2, 1, 1, 2, 2, 3, 4, 4, 4, 5, 5, 5, 4, 5, 5, 6, 6, 6, 5, 5, 5, 4, 4, 3, 3, 4, 4, 5, 5, 5, 6, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0, 0, 0],
                        proband: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 3, 3, 3, 4, 4, 4, 3, 4, 4, 5, 5, 5, 4, 4, 4, 4, 3, 3, 2, 3, 3, 4, 4, 4, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0, 0, 0],
                    },
                    "investigator-3": {
                        all: [0, 0, 0, 1, 1, 1, 2, 2, 3, 2, 2, 3, 3, 4, 5, 5, 6, 5, 5, 4, 5, 6, 7, 7, 6, 6, 5, 5, 5, 4, 4, 3, 4, 4, 5, 5, 6, 6, 5, 5, 4, 4, 3, 2, 2, 1, 1, 0, 0, 0],
                        affected: [0, 0, 0, 0, 0, 1, 1, 1, 2, 1, 1, 2, 2, 3, 3, 4, 5, 4, 4, 3, 4, 5, 5, 6, 5, 5, 4, 4, 4, 3, 3, 2, 3, 3, 4, 4, 4, 5, 4, 4, 3, 3, 2, 1, 1, 0, 0, 0, 0, 0],
                        proband: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 3, 3, 4, 4, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 3, 3, 3, 4, 4, 3, 3, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0],
                    },
                },
                evidence: [
                    { label: "Nearest gene", value: "UBE3A" },
                    { label: "Disease regions", value: "3 overlaps" },
                    { label: "ClinVar", value: "6 P/LP nearby" },
                    { label: "gnomAD AF", value: "0.00003" },
                    { label: "REVEL", value: "0.81" },
                    { label: "AlphaMissense", value: "0.94" },
                    { label: "LoFTEE", value: "HC" },
                ],
                phenotypes: {
                    "all-investigators": [
                        { label: "Neuro", all: 72, proband: 41 },
                        { label: "Tone", all: 64, proband: 48 },
                        { label: "Seizure", all: 48, proband: 20 },
                        { label: "Growth", all: 39, proband: 14 },
                        { label: "Sleep", all: 28, proband: 14 },
                    ],
                    "investigator-1": [
                        { label: "Neuro", all: 68, proband: 39 },
                        { label: "Tone", all: 59, proband: 43 },
                        { label: "Seizure", all: 44, proband: 18 },
                        { label: "Growth", all: 35, proband: 12 },
                        { label: "Sleep", all: 24, proband: 10 },
                    ],
                    "investigator-2": [
                        { label: "Neuro", all: 75, proband: 46 },
                        { label: "Tone", all: 61, proband: 47 },
                        { label: "Seizure", all: 52, proband: 23 },
                        { label: "Growth", all: 41, proband: 16 },
                        { label: "Sleep", all: 30, proband: 15 },
                    ],
                    "investigator-3": [
                        { label: "Neuro", all: 70, proband: 38 },
                        { label: "Tone", all: 67, proband: 51 },
                        { label: "Seizure", all: 43, proband: 19 },
                        { label: "Growth", all: 36, proband: 13 },
                        { label: "Sleep", all: 27, proband: 13 },
                    ],
                },
                phenotypeDetails: {
                    Neuro: [
                        { label: "Developmental delay", value: 58 },
                        { label: "Speech delay", value: 46 },
                        { label: "Hypotonia", value: 42 },
                    ],
                    Tone: [
                        { label: "Hypotonia", value: 51 },
                        { label: "Poor suck", value: 32 },
                        { label: "Motor delay", value: 29 },
                    ],
                    Seizure: [
                        { label: "Infantile spasms", value: 21 },
                        { label: "Generalized seizure", value: 18 },
                        { label: "EEG abnormality", value: 15 },
                    ],
                    Growth: [
                        { label: "Failure to thrive", value: 24 },
                        { label: "Short stature", value: 18 },
                        { label: "Poor weight gain", value: 16 },
                    ],
                    Sleep: [
                        { label: "Sleep disturbance", value: 19 },
                        { label: "Insomnia", value: 13 },
                        { label: "Fragmented sleep", value: 9 },
                    ],
                },
                demographics: {
                    ageBins: [
                        { label: "0-1", total: 5, femaleHeight: "10px", maleHeight: "14px" },
                        { label: "2-4", total: 9, femaleHeight: "16px", maleHeight: "24px" },
                        { label: "5-12", total: 15, femaleHeight: "25px", maleHeight: "35px" },
                        { label: "13-18", total: 20, femaleHeight: "34px", maleHeight: "46px" },
                        { label: "Adult", total: 15, femaleHeight: "26px", maleHeight: "30px" },
                    ],
                },
            },
        };
    },
    computed: {
        investigatorOptions() {
            return [
                { key: "all-investigators", label: "All investigators" },
                { key: "investigator-1", label: "Investigator 1" },
                { key: "investigator-2", label: "Investigator 2" },
                { key: "investigator-3", label: "Investigator 3" },
            ];
        },
        densityModes() {
            return [
                { key: "all", label: "All" },
                { key: "affected", label: "Affected" },
                { key: "proband", label: "Proband" },
            ];
        },
        activeDensityGroup() {
            return this.variant.densitySeries[this.activeInvestigator];
        },
        renderedDensitySeries() {
            return this.densityModes
                .map((mode) => ({
                    key: mode.key,
                    label: mode.label,
                    bins: this.activeDensityGroup[mode.key],
                    active: this.activeDensity === mode.key,
                }))
                .sort((left, right) => Number(left.active) - Number(right.active));
        },
        phenotypeRows() {
            return this.variant.phenotypes[this.activePhenotypeInvestigator];
        },
        activePhenotypeDetails() {
            return this.variant.phenotypeDetails[this.activePhenotypeCategory] || [];
        },
        locusGridStyle() {
            const majorSegments = Math.max(this.variant.axisTicks.length - 1, 1);
            const minorSegments = majorSegments * 10;

            return {
                "--major-step": `${100 / majorSegments}%`,
                "--minor-step": `${100 / minorSegments}%`,
            };
        },
    },
    methods: {
        densityBarHeight(count) {
            const allBins = Object.values(this.activeDensityGroup).flat();
            const max = Math.max(...allBins, 1);
            return `${Math.max((count / max) * 100, count > 0 ? 8 : 0)}%`;
        },
    },
};
</script>

<style scoped>
.glens-page {
    padding: 1.75rem 1rem 2.25rem;
    background: linear-gradient(180deg, #f6f9ff 0%, #eef4ff 50%, #edf6f1 100%);
}

.glens-variant {
    max-width: 1380px;
    margin: 0 auto;
}

.glens-header-card,
.glens-panel-card,
.glens-card {
    border-radius: 1.5rem;
    background: rgba(255, 255, 255, 0.76);
    box-shadow: 0 18px 40px rgba(22, 32, 51, 0.08);
}

.glens-header-card {
    padding: 1.2rem 1.5rem;
}

.glens-header-row,
.glens-top-tools {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.glens-page-title,
.glens-section-label {
    margin: 0;
    color: #162033;
    font-weight: 800;
}

.glens-page-title {
    font-size: 2rem;
}

.glens-inline-meta,
.glens-summary-inline,
.glens-small-meta,
.glens-density-title,
.glens-kv-row span {
    color: #526276;
    font-weight: 600;
}

.glens-inline-meta,
.glens-summary-inline,
.glens-pill-row,
.glens-density-filters,
.glens-demography-line,
.glens-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.glens-inline-meta {
    margin-top: 0.35rem;
}

.glens-summary-inline span:nth-child(2n) {
    color: #cbd5e1;
}

.glens-panel-card,
.glens-card {
    margin-top: 0.9rem;
    padding: 1.25rem;
}

.glens-pill,
.glens-link-pill,
.glens-filter,
.glens-mini-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.45rem 0.8rem;
    border-radius: 999px;
    background: #f1f5f9;
    color: #526276;
    font-size: 0.8rem;
    font-weight: 700;
}

.glens-pill--amber { background: #fff4db; color: #a78333; }
.glens-pill--blue { background: #e6f0ff; color: #0d4d91; }
.glens-pill--coral { background: #fef0ec; color: #be5b51; }
.glens-link-pill { background: #fff; border: 1px solid #dbe5ef; text-decoration: none; }
.glens-filter--active { background: #0d4d91; color: #fff; }
.glens-mini-pill { background: #fff; color: #162033; }

.glens-locus-card {
    position: relative;
    margin-top: 1rem;
    padding: 1.25rem;
    border: 1px solid #dbe5ef;
    border-radius: 1.35rem;
    background:
        repeating-linear-gradient(to right, rgba(148, 163, 184, 0.18) 0 1px, transparent 1px var(--minor-step)),
        repeating-linear-gradient(to right, rgba(41, 90, 145, 0.28) 0 1px, transparent 1px var(--major-step));
    background-size: 100% 100%, 100% 100%;
}

.glens-axis-row,
.glens-age-labels {
    display: flex;
    justify-content: space-between;
}

.glens-axis-row {
    position: relative;
    z-index: 1;
    padding: 0.75rem 0.9rem;
    border: 1px solid rgba(57, 96, 140, 0.22);
    border-radius: 0.95rem;
    background: rgba(226, 236, 251, 0.78);
    color: #526276;
    font-size: 0.75rem;
    font-weight: 700;
}

.glens-band-label {
    position: absolute;
    left: 50.5%;
    top: 0.2rem;
    transform: translateX(-50%);
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    background: #f1f5f9;
    color: #526276;
    font-size: 0.65rem;
    font-weight: 700;
}

.glens-focus-line {
    position: absolute;
    left: 50.5%;
    top: 1.2rem;
    width: 2px;
    height: 11rem;
    background: rgba(13, 77, 145, 0.78);
}

.glens-track-row {
    display: grid;
    grid-template-columns: 5rem 1fr;
    gap: 1rem;
    align-items: center;
    margin-top: 1rem;
}

.glens-track-label,
.glens-section-label {
    color: #526276;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
}

.glens-track-label {
    display: flex;
    align-items: center;
    min-height: 3rem;
    padding: 0 0.75rem;
    border-radius: 0.9rem;
    background: rgba(234, 241, 251, 0.86);
    color: #55657a;
}

.glens-track {
    position: relative;
    height: 3rem;
    border-radius: 999px;
    background: transparent;
}

.glens-track--disease {
    height: 3.4rem;
}

.glens-region,
.glens-gene {
    position: absolute;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 0.9rem;
    padding: 0.1rem 0.35rem;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 700;
}

.glens-region {
    background: #f7d55f;
    color: #a78333;
}

.glens-region--neural {
    background: #bdebd2;
    color: #2f6d50;
}

.glens-region--neurodevelopmental {
    background: #d9e8ff;
    color: #2f5ea8;
}

.glens-region-domain {
    margin-left: 0.35rem;
    opacity: 0.82;
}

.glens-gene {
    top: 1rem;
    background: #cbd5e1;
    color: #526276;
}

.glens-gene--focal {
    background: #0d4d91;
    color: #fff;
}

.glens-marker {
    position: absolute;
    top: 0.5rem;
    transform: translateX(-50%);
    color: #be5b51;
    text-align: center;
}

.glens-marker--focus { top: 0.25rem; }

.glens-marker-badge {
    display: block;
    padding: 0.15rem 0.35rem;
    border-radius: 0.45rem;
    background: #be5b51;
    color: #fff;
    font-size: 0.58rem;
    font-weight: 700;
}

.glens-marker-shape {
    display: block;
    margin-top: 0.15rem;
    font-size: 0.85rem;
    font-weight: 800;
}

.glens-track-row--density {
    padding-top: 0.9rem;
}

.glens-density-title {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.16em;
}

.glens-density-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.glens-density-track {
    position: relative;
    height: 3.5rem;
    margin-top: 0.65rem;
    padding: 0.35rem;
    border: 1px solid rgba(148, 163, 184, 0.24);
    border-radius: 1rem;
    overflow: hidden;
    background: transparent;
}

.glens-density-series {
    position: absolute;
    inset: 0.35rem;
    display: grid;
    grid-template-columns: repeat(50, minmax(0, 1fr));
    gap: 2px;
    align-items: end;
    opacity: 0.22;
    transition: opacity 0.18s ease, transform 0.18s ease;
}

.glens-density-series--active {
    opacity: 1;
    transform: translateY(-1px);
    z-index: 2;
}

.glens-density-bar {
    width: 100%;
    min-height: 2px;
    border-radius: 0.35rem 0.35rem 0 0;
    background: currentColor;
}

.glens-density-series--all {
    color: #2f5ea8;
}

.glens-density-series--affected {
    color: #5c7f9e;
}

.glens-density-series--proband {
    color: #de7b41;
}

.glens-density-series--active .glens-density-bar {
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.16) inset;
}

.glens-bottom-grid { margin-top: 0.2rem; }

.glens-card { height: 100%; }

.glens-kv-grid { margin-top: 0.75rem; }

.glens-kv-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.7rem 0;
    border-bottom: 1px solid #eef2f7;
}

.glens-kv-row:last-child { border-bottom: 0; }

.glens-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.glens-small-meta {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.16em;
}

.glens-bar-group { margin-top: 0.9rem; }

.glens-bar-group {
    padding: 0.45rem 0.55rem;
    border-radius: 0.8rem;
    cursor: pointer;
}

.glens-bar-group--active {
    background: #f8fbff;
    box-shadow: inset 3px 0 0 #2f5ea8;
}

.glens-bar-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.35rem;
    color: #162033;
    font-size: 0.82rem;
    font-weight: 700;
}

.glens-bar-shell {
    height: 0.7rem;
    border-radius: 999px;
    background: #eef2f7;
    overflow: hidden;
}

.glens-bar-shell--sub { margin-top: 0.35rem; }

.glens-bar { height: 100%; border-radius: 999px; }
.glens-bar--blue { background: #2f5ea8; }
.glens-bar--orange { background: #de7b41; }

.glens-dot {
    display: inline-block;
    width: 0.65rem;
    height: 0.65rem;
    margin-right: 0.35rem;
    border-radius: 999px;
}

.glens-dot--blue,
.glens-dot--female { background: #5a84c2; }
.glens-dot--orange { background: #de7b41; }
.glens-dot--male { background: #355f83; }

.glens-age-card {
    margin-top: 0.8rem;
    padding: 1rem;
    border: 1px solid #dbe5ef;
    border-radius: 1.15rem;
    background: #fff;
}

.glens-age-bars {
    display: flex;
    align-items: flex-end;
    gap: 0.8rem;
    height: 7rem;
}

.glens-age-col {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 0.3rem;
}

.glens-age-count {
    color: #526276;
    font-size: 0.68rem;
    font-weight: 700;
}

.glens-age-stack {
    display: flex;
    width: 2rem;
    flex-direction: column-reverse;
    overflow: hidden;
    border: 1px solid #cbd5e1;
    border-radius: 0.45rem 0.45rem 0 0;
}

.glens-age-female { background: #5a84c2; }
.glens-age-male { background: #355f83; }

.glens-age-labels {
    margin-top: 0.6rem;
    color: #526276;
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
}

.glens-select-label {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    color: #526276;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

.glens-select {
    max-width: 11rem;
    padding: 0.38rem 0.65rem;
    border: 1px solid #dbe5ef;
    border-radius: 999px;
    background: #fff;
    color: #162033;
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: none;
}

.glens-phenotype-detail {
    margin-top: 1rem;
    padding: 0.85rem;
    border: 1px solid #dbe5ef;
    border-radius: 1rem;
    background: #f8fbff;
}

.glens-detail-head,
.glens-detail-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
}

.glens-detail-head {
    color: #526276;
    font-size: 0.78rem;
}

.glens-detail-head strong {
    color: #162033;
}

.glens-detail-row {
    margin-top: 0.6rem;
    color: #526276;
    font-size: 0.8rem;
}

.glens-detail-row strong {
    color: #162033;
}

.glens-filter {
    border: 1px solid transparent;
    cursor: pointer;
}

.glens-filter--all:not(.glens-filter--active) {
    background: rgba(47, 94, 168, 0.08);
    color: #2f5ea8;
}

.glens-filter--affected:not(.glens-filter--active) {
    background: rgba(92, 127, 158, 0.1);
    color: #5c7f9e;
}

.glens-filter--proband:not(.glens-filter--active) {
    background: rgba(222, 123, 65, 0.1);
    color: #de7b41;
}

.glens-filter--active {
    border-color: transparent;
}

.glens-filter--all.glens-filter--active {
    background: #2f5ea8;
}

.glens-filter--affected.glens-filter--active {
    background: #5c7f9e;
    color: #fff;
}

.glens-filter--proband.glens-filter--active {
    background: #de7b41;
    color: #fff;
}

@media (max-width: 991.98px) {
    .glens-header-row,
    .glens-top-tools {
        display: block;
    }

    .glens-summary-inline,
    .glens-pill-row:last-child {
        margin-top: 0.75rem;
    }
}

@media (max-width: 767.98px) {
    .glens-track-row {
        grid-template-columns: 1fr;
        gap: 0.4rem;
    }

    .glens-focus-line,
    .glens-band-label {
        display: none;
    }

    .glens-locus-card {
        overflow-x: auto;
    }

    .glens-density-series {
        min-width: 46rem;
    }
}
</style>
