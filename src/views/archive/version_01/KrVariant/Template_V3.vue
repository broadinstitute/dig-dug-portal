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
                            <div class="glens-title-row">
                                <h1 class="glens-page-title">{{ variant.query.label }}</h1>
                                <span class="glens-pathogenicity-badge">{{ variant.query.pathogenicity }}</span>
                            </div>
                            <div class="glens-inline-meta">
                            <span>{{ variant.query.window }}</span>
                                <span>|</span>
                                <span>{{ variant.query.build }}</span>
                            </div>
                        </div>
                        <div class="glens-summary-inline">
                            <span>18 carriers</span>
                            <span>|</span>
                            <span>1 gene</span>
                            <span>|</span>
                            <span>2 disease signals</span>
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
                        <div class="glens-minor-axis-row">
                            <span
                                v-for="tick in variant.minorTicks"
                                :key="tick.label"
                                class="glens-minor-tick"
                                :class="{ 'glens-minor-tick--labeled': tick.label }"
                                :style="{ left: tick.left }"
                            >
                                <span v-if="tick.label">{{ tick.label }}</span>
                            </span>
                        </div>
                        <div class="glens-band-label">15q11.3</div>
                        <div
                            class="glens-query-position-band"
                            :style="{
                                left: focusOverlayLeft,
                                width: variant.query.focusBandWidth,
                            }"
                        ></div>
                        <div class="glens-focus-line" :style="{ left: focusOverlayLeft }"></div>

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
                                    <div class="glens-gene-model">
                                        <span class="glens-gene-line"></span>
                                        <span
                                            v-for="exon in gene.exons"
                                            :key="exon.left"
                                            class="glens-exon"
                                            :style="{ left: exon.left, width: exon.width }"
                                        ></span>
                                    </div>
                                    <span class="glens-gene-label">{{ gene.label }}</span>
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
                                    :class="{
                                        'glens-marker--focus': marker.focal,
                                        'glens-marker--nearby': !marker.focal,
                                    }"
                                    :style="{ left: marker.left }"
                                >
                                    <span v-if="marker.badge" class="glens-marker-badge">{{ marker.badge }}</span>
                                    <span class="glens-marker-shape">{{ marker.focal ? "●" : marker.label }}</span>
                                    <span v-if="marker.pathogenicity" class="glens-marker-status">
                                        {{ marker.pathogenicity }}
                                    </span>
                                    <span class="glens-marker-coordinate">
                                        {{ marker.coordinate }} | {{ marker.classification }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="glens-track-row glens-track-row--density">
                            <div class="glens-track-label">Carrier count</div>
                            <div>
                                <div class="glens-density-title">
                                    Per-position carrier count
                                    <span>bar height = carriers at each variant position; queried variant = 18 carriers</span>
                                </div>
                                <div class="glens-density-track">
                                    <div class="glens-density-y-axis">
                                        <span>20</span>
                                        <span>10</span>
                                        <span>0</span>
                                    </div>
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
                                            :data-count="height"
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
                                    <label class="glens-select-label glens-select-label--inline" for="density-investigator">
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
                                    <label class="glens-select-label glens-select-label--inline" for="carrier-age">
                                        Age
                                        <select
                                            id="carrier-age"
                                            v-model="activeCarrierAge"
                                            class="glens-select glens-select--compact"
                                        >
                                            <option
                                                v-for="age in carrierAgeOptions"
                                                :key="age.key"
                                                :value="age.key"
                                            >
                                                {{ age.label }}
                                            </option>
                                        </select>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="row glens-bottom-grid">
                    <div class="col-xl-4">
                        <div id="variant-evidence" class="glens-card">
                            <div class="glens-evidence-panel">
                                <p class="glens-section-label">Gene / Locus Context</p>
                                <div class="glens-kv-grid">
                                    <div v-for="item in variant.geneContext" :key="item.label" class="glens-kv-row">
                                        <span>{{ item.label }}</span>
                                        <strong>{{ item.value }}</strong>
                                    </div>
                                    <button
                                        class="glens-kv-row glens-kv-row--button"
                                        type="button"
                                        @click="showDiseaseRegions = !showDiseaseRegions"
                                    >
                                        <span>Disease regions</span>
                                        <strong>2 signals</strong>
                                    </button>
                                </div>
                                <div v-if="showDiseaseRegions" class="glens-disease-list">
                                    <div
                                        v-for="disease in variant.relatedDiseases"
                                        :key="disease.name"
                                        class="glens-disease-item"
                                    >
                                        <strong>{{ disease.name }}</strong>
                                        <span>{{ disease.domain }} | {{ disease.signal }}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="glens-evidence-panel glens-evidence-panel--variant">
                                <p class="glens-section-label">Queried Variant Evidence</p>
                                <div class="glens-kv-grid">
                                    <div v-for="item in variant.variantEvidence" :key="item.label" class="glens-kv-row">
                                        <span>{{ item.label }}</span>
                                        <strong>{{ item.value }}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-xl-8">
                        <div id="phenotype-details" class="glens-card">
                            <div class="row">
                                <div class="col-lg-6">
                                    <div class="glens-section-head">
                                        <div class="glens-section-title-group">
                                            <p class="glens-section-label">Phenotype Summary</p>
                                            <div class="glens-level-toggle">
                                                <button
                                                    v-for="level in summaryLevels"
                                                    :key="level.key"
                                                    class="glens-level-button"
                                                    :class="{ 'glens-level-button--active': activeSummaryLevel === level.key }"
                                                    type="button"
                                                    @click="activeSummaryLevel = level.key"
                                                >
                                                    {{ level.label }}
                                                </button>
                                            </div>
                                        </div>
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
                                            <span>
                                                All {{ phenotype.all }}% ({{ phenotypeCount(phenotype.all, summaryScope.all) }} / {{ summaryScope.all }})
                                                |
                                                Proband {{ phenotype.proband }}% ({{ phenotypeCount(phenotype.proband, summaryScope.proband) }} / {{ summaryScope.proband }})
                                            </span>
                                        </div>
                                        <div class="glens-bar-shell">
                                            <div class="glens-bar glens-bar--blue" :style="{ width: phenotype.all + '%' }"></div>
                                        </div>
                                        <div class="glens-bar-shell glens-bar-shell--sub">
                                            <div class="glens-bar glens-bar--orange" :style="{ width: phenotype.proband + '%' }"></div>
                                        </div>
                                        <div
                                            v-if="activePhenotypeCategory === phenotype.label"
                                            class="glens-phenotype-detail"
                                        >
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
                                </div>

                                <div class="col-lg-6">
                                    <div class="glens-section-head">
                                        <p class="glens-section-label">Demographic Summary</p>
                                        <span class="glens-small-meta">Age-first</span>
                                    </div>
                                    <div class="glens-age-card">
                                        <div class="glens-age-bars">
                                            <div
                                                v-for="bin in demographicAgeBins"
                                                :key="bin.label"
                                                class="glens-age-col"
                                            >
                                                <div class="glens-age-pair">
                                                    <div class="glens-age-sex-col">
                                                        <div class="glens-age-sex-count">{{ bin.female }}</div>
                                                        <div class="glens-age-female" :style="{ height: bin.femaleHeight }"></div>
                                                    </div>
                                                    <div class="glens-age-sex-col">
                                                        <div class="glens-age-sex-count">{{ bin.male }}</div>
                                                        <div class="glens-age-male" :style="{ height: bin.maleHeight }"></div>
                                                    </div>
                                                </div>
                                                <div class="glens-age-bin-label">{{ bin.label }}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="glens-demography-line">
                                        <span><i class="glens-dot glens-dot--female"></i>Female {{ summaryScope.female }}</span>
                                        <span><i class="glens-dot glens-dot--male"></i>Male {{ summaryScope.male }}</span>
                                        <button
                                            class="glens-demo-toggle"
                                            :class="{ 'glens-demo-toggle--active': activeDemographic === 'all' }"
                                            type="button"
                                            @click="activeDemographic = 'all'"
                                        >
                                            All {{ summaryScope.all }}
                                        </button>
                                        <button
                                            class="glens-demo-toggle"
                                            :class="{ 'glens-demo-toggle--active': activeDemographic === 'proband' }"
                                            type="button"
                                            @click="activeDemographic = 'proband'"
                                        >
                                            Proband {{ summaryScope.proband }} ({{ summaryScope.probandPercent }}%)
                                        </button>
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
    name: "KrVariantTemplateV3",
    data() {
        return {
            activeDensity: "all",
            activeInvestigator: "all-investigators",
            activeCarrierAge: "all-ages",
            activePhenotypeInvestigator: "all-investigators",
            activeSummaryLevel: "variant",
            activePhenotypeCategory: "Neuro",
            activeDemographic: "all",
            showDiseaseRegions: false,
            variant: {
                query: {
                    label: "chr15:22,000,220 G>C",
                    pathogenicity: "Pathogenic",
                    focusLeft: "40.7%",
                    focusBandWidth: "0.55rem",
                    window: "UBE3A gene locus | chr15:21.999M-22.002M",
                    build: "GRCh38",
                },
                axisTicks: ["21.999M", "22.000M", "22.001M", "22.002M"],
                minorTicks: [
                    { left: "6.7%", label: "" },
                    { left: "13.3%", label: "21.9994M" },
                    { left: "20%", label: "" },
                    { left: "26.7%", label: "21.9998M" },
                    { left: "33.3%", label: "" },
                    { left: "40%", label: "22.0002M" },
                    { left: "46.7%", label: "" },
                    { left: "53.3%", label: "22.0006M" },
                    { left: "60%", label: "" },
                    { left: "66.7%", label: "22.0010M" },
                    { left: "73.3%", label: "" },
                    { left: "80%", label: "22.0014M" },
                    { left: "86.7%", label: "" },
                    { left: "93.3%", label: "22.0018M" },
                ],
                diseaseRegions: [
                    { label: "Angelman syndrome", domain: "neural", domainKey: "neural", style: "left:7%; top:14%; width:70%;" },
                    { label: "UBE3A-related neurodevelopmental disorder", domain: "neurodevelopmental", domainKey: "neurodevelopmental", style: "left:18%; top:54%; width:66%;" },
                ],
                genes: [
                    {
                        label: "UBE3A",
                        style: "left:12%; width:76%;",
                        focal: true,
                        exons: [
                            { left: "5%", width: "7%" },
                            { left: "18%", width: "5%" },
                            { left: "30%", width: "8%" },
                            { left: "47%", width: "6%" },
                            { left: "62%", width: "9%" },
                            { left: "82%", width: "10%" },
                        ],
                    },
                ],
                markers: [
                    {
                        label: "●",
                        left: "40.7%",
                        badge: "G>C",
                        coordinate: "chr15:22,000,220 G>C",
                        pathogenicity: "Pathogenic",
                        classification: "P",
                        focal: true,
                    },
                    {
                        label: "◆",
                        left: "70.7%",
                        badge: "A>T",
                        coordinate: "chr15:22,001,120 A>T",
                        pathogenicity: "Likely pathogenic",
                        classification: "LP",
                    },
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
                geneContext: [
                    { label: "Nearest gene", value: "UBE3A" },
                    { label: "UBE3A variant carriers", value: "132 samples" },
                    { label: "P/LP variants in UBE3A", value: "9 variants" },
                ],
                relatedDiseases: [
                    { name: "Angelman syndrome", domain: "neural", signal: "UBE3A-linked" },
                    { name: "UBE3A-related neurodevelopmental disorder", domain: "neurodevelopmental", signal: "gene-level overlap" },
                ],
                variantEvidence: [
                    { label: "Coordinate / allele", value: "chr15:22,000,220 G>C" },
                    { label: "ClinVar", value: "Pathogenic" },
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
                variantPhenotypes: {
                    "all-investigators": [
                        { label: "Neuro", all: 67, proband: 58 },
                        { label: "Tone", all: 56, proband: 50 },
                        { label: "Seizure", all: 33, proband: 25 },
                        { label: "Growth", all: 28, proband: 17 },
                        { label: "Sleep", all: 22, proband: 17 },
                    ],
                    "investigator-1": [
                        { label: "Neuro", all: 60, proband: 50 },
                        { label: "Tone", all: 50, proband: 42 },
                        { label: "Seizure", all: 30, proband: 17 },
                        { label: "Growth", all: 20, proband: 8 },
                        { label: "Sleep", all: 20, proband: 8 },
                    ],
                    "investigator-2": [
                        { label: "Neuro", all: 71, proband: 63 },
                        { label: "Tone", all: 57, proband: 50 },
                        { label: "Seizure", all: 43, proband: 25 },
                        { label: "Growth", all: 29, proband: 13 },
                        { label: "Sleep", all: 29, proband: 13 },
                    ],
                    "investigator-3": [
                        { label: "Neuro", all: 63, proband: 55 },
                        { label: "Tone", all: 63, proband: 45 },
                        { label: "Seizure", all: 25, proband: 18 },
                        { label: "Growth", all: 25, proband: 18 },
                        { label: "Sleep", all: 13, proband: 9 },
                    ],
                },
                phenotypeDetails: {
                    Neuro: [
                        { label: "Developmental delay [HP:0001263]", value: 58 },
                        { label: "Speech delay [HP:0000750]", value: 46 },
                        { label: "Hypotonia [HP:0001252]", value: 42 },
                    ],
                    Tone: [
                        { label: "Hypotonia [HP:0001252]", value: 51 },
                        { label: "Poor suck [HP:0002033]", value: 32 },
                        { label: "Motor delay [HP:0001270]", value: 29 },
                    ],
                    Seizure: [
                        { label: "Infantile spasms [HP:0012469]", value: 21 },
                        { label: "Generalized seizure [HP:0002197]", value: 18 },
                        { label: "EEG abnormality [HP:0002353]", value: 15 },
                    ],
                    Growth: [
                        { label: "Failure to thrive [HP:0001508]", value: 24 },
                        { label: "Short stature [HP:0004322]", value: 18 },
                        { label: "Poor weight gain [HP:0004325]", value: 16 },
                    ],
                    Sleep: [
                        { label: "Sleep disturbance [HP:0002360]", value: 19 },
                        { label: "Insomnia [HP:0100785]", value: 13 },
                        { label: "Fragmented sleep [HP:5200044]", value: 9 },
                    ],
                },
                demographics: {
                    all: [
                        { label: "0-1", female: 2, male: 3, femaleHeight: "12px", maleHeight: "18px" },
                        { label: "2-4", female: 4, male: 5, femaleHeight: "22px", maleHeight: "28px" },
                        { label: "5-12", female: 8, male: 7, femaleHeight: "44px", maleHeight: "38px" },
                        { label: "13-18", female: 11, male: 9, femaleHeight: "60px", maleHeight: "50px" },
                        { label: "Adult", female: 8, male: 7, femaleHeight: "44px", maleHeight: "38px" },
                    ],
                    proband: [
                        { label: "0-1", female: 1, male: 2, femaleHeight: "10px", maleHeight: "18px" },
                        { label: "2-4", female: 3, male: 4, femaleHeight: "24px", maleHeight: "32px" },
                        { label: "5-12", female: 6, male: 5, femaleHeight: "48px", maleHeight: "40px" },
                        { label: "13-18", female: 8, male: 6, femaleHeight: "64px", maleHeight: "48px" },
                        { label: "Adult", female: 5, male: 4, femaleHeight: "40px", maleHeight: "32px" },
                    ],
                },
                variantDemographics: {
                    all: [
                        { label: "0-1", female: 1, male: 1, femaleHeight: "16px", maleHeight: "16px" },
                        { label: "2-4", female: 2, male: 1, femaleHeight: "30px", maleHeight: "16px" },
                        { label: "5-12", female: 3, male: 2, femaleHeight: "44px", maleHeight: "30px" },
                        { label: "13-18", female: 3, male: 3, femaleHeight: "44px", maleHeight: "44px" },
                        { label: "Adult", female: 1, male: 1, femaleHeight: "16px", maleHeight: "16px" },
                    ],
                    proband: [
                        { label: "0-1", female: 1, male: 0, femaleHeight: "18px", maleHeight: "0px" },
                        { label: "2-4", female: 1, male: 1, femaleHeight: "18px", maleHeight: "18px" },
                        { label: "5-12", female: 2, male: 2, femaleHeight: "36px", maleHeight: "36px" },
                        { label: "13-18", female: 2, male: 2, femaleHeight: "36px", maleHeight: "36px" },
                        { label: "Adult", female: 1, male: 0, femaleHeight: "18px", maleHeight: "0px" },
                    ],
                },
                summaryScopes: {
                    variant: { all: 18, proband: 12, probandPercent: 67, female: 10, male: 8 },
                    gene: { all: 132, proband: 90, probandPercent: 68, female: 74, male: 58 },
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
        carrierAgeOptions() {
            return [
                { key: "all-ages", label: "All ages" },
                { key: "0-1", label: "0-1" },
                { key: "2-4", label: "2-4" },
                { key: "5-12", label: "5-12" },
                { key: "13-18", label: "13-18" },
                { key: "adult", label: "Adult" },
            ];
        },
        summaryLevels() {
            return [
                { key: "variant", label: "Variant level" },
                { key: "gene", label: "Gene level" },
            ];
        },
        summaryScope() {
            return this.variant.summaryScopes[this.activeSummaryLevel];
        },
        activeDensityGroup() {
            const baseGroup = this.variant.densitySeries[this.activeInvestigator];
            const ageScale = {
                "all-ages": 1,
                "0-1": 0.18,
                "2-4": 0.28,
                "5-12": 0.46,
                "13-18": 0.58,
                adult: 0.38,
            }[this.activeCarrierAge] || 1;

            return Object.keys(baseGroup).reduce((group, key) => {
                group[key] = baseGroup[key].map((count) => {
                    if (this.activeCarrierAge === "all-ages") return count;
                    return Math.max(0, Math.round(count * ageScale));
                });
                return group;
            }, {});
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
            const source = this.activeSummaryLevel === "variant"
                ? this.variant.variantPhenotypes
                : this.variant.phenotypes;

            return source[this.activePhenotypeInvestigator];
        },
        activePhenotypeDetails() {
            return this.variant.phenotypeDetails[this.activePhenotypeCategory] || [];
        },
        demographicAgeBins() {
            const source = this.activeSummaryLevel === "variant"
                ? this.variant.variantDemographics
                : this.variant.demographics;

            return source[this.activeDemographic];
        },
        locusGridStyle() {
            const majorSegments = Math.max(this.variant.axisTicks.length - 1, 1);
            const minorSegments = majorSegments * 10;

            return {
                "--major-step": `${100 / majorSegments}%`,
                "--minor-step": `${100 / minorSegments}%`,
            };
        },
        focusOverlayLeft() {
            const ratio = Number.parseFloat(this.variant.query.focusLeft) / 100;
            const trackLeftRem = 7.25;
            const trackRightRem = 1.25;
            const leftRem = ((1 - ratio) * trackLeftRem) - (ratio * trackRightRem);

            return `calc(${this.variant.query.focusLeft} + ${leftRem.toFixed(3)}rem)`;
        },
    },
    methods: {
        densityBarHeight(count) {
            const max = 20;
            return `${Math.max((count / max) * 100, count > 0 ? 8 : 0)}%`;
        },
        phenotypeCount(percent, denominator) {
            return Math.round((percent / 100) * denominator);
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

.glens-title-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
}

.glens-pathogenicity-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.35rem 0.7rem;
    border-radius: 999px;
    background: #fee2e2;
    color: #b42318;
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
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
    background: #fff;
}

.glens-axis-row,
.glens-age-labels {
    display: flex;
    justify-content: space-between;
}

.glens-axis-row {
    position: relative;
    z-index: 3;
    padding: 0.75rem 0.9rem;
    border: 1px solid rgba(57, 96, 140, 0.22);
    border-radius: 0.95rem;
    background: rgba(226, 236, 251, 0.78);
    color: #526276;
    font-size: 0.75rem;
    font-weight: 700;
}

.glens-minor-axis-row {
    position: relative;
    z-index: 3;
    height: 1.2rem;
    margin: 0.2rem 0 0.1rem;
}

.glens-minor-tick {
    position: absolute;
    top: 0;
    width: 1px;
    height: 0.55rem;
    background: rgba(82, 98, 118, 0.34);
}

.glens-minor-tick--labeled {
    height: 0.85rem;
    background: rgba(13, 77, 145, 0.5);
}

.glens-minor-tick span {
    position: absolute;
    top: 0.8rem;
    left: 50%;
    transform: translateX(-50%);
    color: #526276;
    font-size: 0.56rem;
    font-weight: 700;
    white-space: nowrap;
}

.glens-band-label {
    position: absolute;
    z-index: 4;
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
    z-index: 3;
    top: 1.2rem;
    bottom: 1.25rem;
    width: 2px;
    background: rgba(13, 77, 145, 0.78);
}

.glens-query-position-band {
    position: absolute;
    z-index: 1;
    top: 1.25rem;
    bottom: 1.25rem;
    transform: translateX(-50%);
    border-right: 1px solid rgba(190, 91, 81, 0.32);
    border-left: 1px solid rgba(190, 91, 81, 0.32);
    background:
        linear-gradient(
            180deg,
            rgba(190, 91, 81, 0.08) 0%,
            rgba(190, 91, 81, 0.14) 48%,
            rgba(47, 94, 168, 0.12) 100%
        );
    pointer-events: none;
}

.glens-track-row {
    position: relative;
    z-index: 2;
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
    overflow: visible;
    background: transparent;
    color: #0d4d91;
}

.glens-gene-model {
    position: absolute;
    inset: 0;
}

.glens-gene-line {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 2px;
    transform: translateY(-50%);
    background: #0d4d91;
}

.glens-exon {
    position: absolute;
    top: 50%;
    height: 0.95rem;
    transform: translateY(-50%);
    border-radius: 0.25rem;
    background: #0d4d91;
}

.glens-gene-label {
    position: absolute;
    left: 50%;
    top: -1.05rem;
    transform: translateX(-50%);
    color: #0d4d91;
    font-size: 0.68rem;
    font-weight: 800;
}

.glens-marker {
    position: absolute;
    top: 0.5rem;
    width: 8rem;
    transform: translateX(-50%);
    color: #be5b51;
    text-align: center;
}

.glens-marker--focus { top: 0.25rem; }

.glens-marker--nearby {
    top: 0.85rem;
    color: #9f5a50;
}

.glens-marker-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.9rem;
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

.glens-marker-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 0.12rem;
    padding: 0.12rem 0.35rem;
    border-radius: 999px;
    background: #fee2e2;
    color: #b42318;
    font-size: 0.56rem;
    font-weight: 800;
    text-transform: uppercase;
}

.glens-marker-coordinate {
    display: block;
    width: fit-content;
    margin-top: 0.14rem;
    margin-right: auto;
    margin-left: auto;
    padding: 0.12rem 0.3rem;
    border-radius: 0.4rem;
    background: rgba(255, 255, 255, 0.82);
    color: #526276;
    font-size: 0.54rem;
    font-weight: 800;
    white-space: nowrap;
}

.glens-track-row--density {
    padding-top: 0.9rem;
}

.glens-density-title {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.16em;
}

.glens-density-title span {
    display: block;
    margin-top: 0.2rem;
    color: #64748b;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: none;
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

.glens-density-y-axis {
    position: absolute;
    z-index: 4;
    top: 0.35rem;
    bottom: 0.35rem;
    left: 0.35rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: #64748b;
    font-size: 0.52rem;
    font-weight: 800;
    line-height: 1;
    pointer-events: none;
}

.glens-density-y-axis::before,
.glens-density-y-axis::after {
    content: "";
    position: absolute;
    left: 1.25rem;
    right: -74rem;
    height: 1px;
    background: rgba(100, 116, 139, 0.14);
}

.glens-density-y-axis::before {
    top: 0;
}

.glens-density-y-axis::after {
    top: 50%;
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
    position: relative;
    width: 100%;
    min-height: 2px;
    border-radius: 0.35rem 0.35rem 0 0;
    background: currentColor;
}

.glens-density-bar::after {
    content: attr(data-count);
    position: absolute;
    left: 50%;
    bottom: calc(100% + 0.25rem);
    z-index: 8;
    min-width: 1.25rem;
    padding: 0.12rem 0.25rem;
    border-radius: 0.35rem;
    background: #162033;
    color: #fff;
    font-size: 0.55rem;
    font-weight: 800;
    line-height: 1;
    opacity: 0;
    transform: translateX(-50%) translateY(0.2rem);
    transition: opacity 0.14s ease, transform 0.14s ease;
    pointer-events: none;
}

.glens-density-bar:hover::after {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
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

.glens-evidence-panel {
    padding: 1rem;
    border: 1px solid #dbe5ef;
    border-radius: 1rem;
    background: rgba(248, 251, 255, 0.72);
}

.glens-evidence-panel--variant {
    margin-top: 1rem;
    background: rgba(255, 255, 255, 0.72);
}

.glens-kv-grid { margin-top: 0.75rem; }

.glens-kv-row {
    display: flex;
    width: 100%;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.7rem 0;
    border-bottom: 1px solid #eef2f7;
}

.glens-kv-row:last-child { border-bottom: 0; }

.glens-kv-row--button {
    border-top: 0;
    border-right: 0;
    border-left: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    text-align: left;
}

.glens-kv-row--button strong::after {
    content: " view";
    color: #2f5ea8;
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
}

.glens-disease-list {
    display: grid;
    gap: 0.55rem;
    margin-top: 0.65rem;
    padding-top: 0.75rem;
    border-top: 1px dashed #dbe5ef;
}

.glens-disease-item {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.75rem;
    align-items: center;
    padding: 0.55rem 0.65rem;
    border-radius: 0.75rem;
    background: #fff;
    color: #526276;
    font-size: 0.76rem;
}

.glens-disease-item strong {
    color: #162033;
}

.glens-disease-item span {
    color: #2f6d50;
    font-weight: 800;
}

.glens-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.85rem;
}

.glens-section-title-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.65rem;
}

.glens-level-toggle {
    display: inline-flex;
    gap: 0.25rem;
    padding: 0.2rem;
    border-radius: 999px;
    background: #eef4fb;
}

.glens-level-button {
    padding: 0.32rem 0.55rem;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: #526276;
    font-size: 0.68rem;
    font-weight: 800;
    cursor: pointer;
}

.glens-level-button--active {
    background: #2f5ea8;
    color: #fff;
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

.glens-dot--blue { background: #5a84c2; }
.glens-dot--female { background: #d65f5f; }
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
    height: 8rem;
}

.glens-age-col {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 0.3rem;
}

.glens-age-bin-label {
    margin-top: 0.25rem;
    color: #526276;
    font-size: 0.68rem;
    font-weight: 800;
    text-transform: uppercase;
}

.glens-age-sex-count {
    color: #526276;
    font-size: 0.68rem;
    font-weight: 700;
    line-height: 1;
}

.glens-age-pair {
    display: flex;
    align-items: flex-end;
    gap: 0.25rem;
}

.glens-age-sex-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 0.25rem;
    width: 0.9rem;
}

.glens-age-female,
.glens-age-male {
    width: 100%;
    border-radius: 0.35rem 0.35rem 0 0;
}

.glens-age-female { background: #d65f5f; }
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

.glens-select--compact {
    max-width: 7rem;
}

.glens-select-label--inline {
    margin-left: 0.25rem;
}

.glens-demo-toggle {
    display: inline-flex;
    align-items: center;
    padding: 0.45rem 0.8rem;
    border: 1px solid transparent;
    border-radius: 999px;
    background: #fff;
    color: #162033;
    font-size: 0.8rem;
    font-weight: 800;
    cursor: pointer;
}

.glens-demo-toggle--active {
    background: #2f5ea8;
    color: #fff;
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
