<template>
    <section v-if="isLoading || hasRows" class="donor-snapshot">
        <div v-if="isLoading" class="snapshot-strip">
            <article
                v-for="cardIndex in 5"
                :key="`snapshot-skeleton-${cardIndex}`"
                class="snapshot-card snapshot-card-skeleton"
                aria-hidden="true"
            >
                <div class="snapshot-skeleton-line snapshot-skeleton-line-kicker"></div>
                <div class="snapshot-skeleton-line snapshot-skeleton-line-title"></div>
                <div class="snapshot-skeleton-line snapshot-skeleton-line-copy"></div>
                <div class="snapshot-skeleton-line snapshot-skeleton-line-copy"></div>
                <div class="snapshot-skeleton-stack">
                    <div
                        v-for="rowIndex in 3"
                        :key="`snapshot-skeleton-${cardIndex}-${rowIndex}`"
                        class="snapshot-skeleton-row"
                    >
                        <div class="snapshot-skeleton-line snapshot-skeleton-line-label"></div>
                        <div class="snapshot-skeleton-line snapshot-skeleton-line-value"></div>
                    </div>
                </div>
            </article>
        </div>
        <div v-else class="snapshot-strip">
            <article class="snapshot-card snapshot-card-overview">
                <div class="snapshot-card-kicker">Cohort snapshot</div>
                <div class="snapshot-overview-value">{{ formatCount(donorRecords.length) }}</div>
                <div class="snapshot-overview-label">unique donors</div>
                <div class="snapshot-overview-meta">
                    <div v-if="medianAgeValue !== null">Median age {{ formatNumericValue(medianAgeValue, 1) }}</div>
                    <div v-if="assayTypeCount" :title="assayTypeTooltip">{{ assayTypeCount }} modalities</div>
                    <div v-if="nonDiabeticPercent !== null">{{ formatPercent(nonDiabeticPercent) }} non-diabetic</div>
                </div>
                <a class="snapshot-overview-link" href="/donors.html">See full donor summary</a>
            </article>

            <article class="snapshot-card">
                <div class="snapshot-card-heading">
                    <div class="snapshot-card-title">Assay coverage</div>
                    <span
                        v-b-tooltip.hover
                        class="snapshot-info"
                        tabindex="0"
                        title="Non-exclusive counts. A donor may contribute to multiple assay modalities."
                    >i</span>
                </div>
                <div v-if="availabilityMicroRows.length" class="snapshot-micro-bars">
                    <div
                        v-for="row in availabilityMicroRows"
                        :key="`assay-${row.label}`"
                        class="snapshot-micro-row snapshot-micro-row-compact"
                    >
                        <div class="snapshot-micro-meta">
                            <span class="snapshot-micro-label snapshot-micro-label-full" :title="row.label">{{ row.label }}</span>
                            <span class="snapshot-micro-value">{{ row.value }}</span>
                        </div>
                        <div class="snapshot-micro-track">
                            <div
                                class="snapshot-micro-fill"
                                :style="{ width: `${row.percent}%`, background: row.color }"
                                :title="`${row.label}: ${row.value} donors`"
                            ></div>
                        </div>
                    </div>
                </div>
                <div v-else class="snapshot-empty-state">No assay metadata found.</div>
            </article>

            <article class="snapshot-card">
                <div class="snapshot-card-heading">
                    <div class="snapshot-card-title">Diabetes status</div>
                </div>
                <div v-if="diabetesStatusSegments.length" class="snapshot-micro-bars">
                    <div
                        v-for="segment in diabetesStatusSegments"
                        :key="`status-${segment.label}`"
                        class="snapshot-micro-row snapshot-micro-row-compact"
                    >
                        <div class="snapshot-micro-meta">
                            <span class="snapshot-micro-label snapshot-micro-label-strong">
                                <span class="snapshot-dot" :style="{ background: segment.color }"></span>
                                <span>{{ shortenLabel(segment.label, 16) }}</span>
                            </span>
                            <span class="snapshot-micro-value">{{ segment.value }} · {{ formatPercent(segment.percent) }}</span>
                        </div>
                        <div class="snapshot-micro-track">
                            <div
                                class="snapshot-micro-fill"
                                :style="{ width: `${segment.percent}%`, background: segment.color }"
                                :title="`${segment.label}: ${segment.value} donors (${formatPercent(segment.percent)})`"
                            ></div>
                        </div>
                    </div>
                </div>
                <div v-else class="snapshot-empty-state">No disease-status field found.</div>
            </article>

            <article class="snapshot-card">
                <div class="snapshot-card-heading">
                    <div class="snapshot-card-title">Age by status</div>
                    <span
                        v-b-tooltip.hover
                        class="snapshot-info"
                        tabindex="0"
                        title="Whisker = full range, box = interquartile range, line = median age."
                    >i</span>
                </div>
                <div v-if="ageSummaryRows.length" class="snapshot-range-list">
                    <div
                        v-for="row in ageSummaryRows.slice(0, 4)"
                        :key="`age-${row.label}`"
                        class="snapshot-range-row snapshot-range-row-compact"
                    >
                        <div class="snapshot-range-head">
                            <span>{{ shortenLabel(row.label, 16) }}</span>
                            <span>median {{ formatNumericValue(row.median, 0) }}</span>
                        </div>
                        <div class="snapshot-range-track">
                            <div
                                class="snapshot-range-line"
                                :style="getWhiskerStyle(row, ageScale)"
                            ></div>
                            <div
                                class="snapshot-range-box"
                                :style="getBoxStyle(row, ageScale)"
                            ></div>
                            <div
                                class="snapshot-range-marker"
                                :style="getMedianStyle(row, ageScale)"
                            ></div>
                        </div>
                    </div>
                    <div class="snapshot-range-axis" aria-hidden="true">
                        <span class="snapshot-range-axis-spacer"></span>
                        <div class="snapshot-range-axis-values">
                            <span>{{ formatNumericValue(ageScale.min, 0) }}</span>
                            <span>{{ formatNumericValue(ageScale.max, 0) }}</span>
                        </div>
                    </div>
                </div>
                <div v-else class="snapshot-empty-state">Not enough age data.</div>
            </article>

            <article class="snapshot-card">
                <div class="snapshot-card-heading">
                    <div class="snapshot-card-title">Donors by collection</div>
                    <span
                        v-b-tooltip.hover
                        class="snapshot-info"
                        tabindex="0"
                        title="Counts are donor-level and may be non-exclusive when a donor is represented in multiple collections."
                    >i</span>
                </div>
                <div v-if="collectionMicroRows.length" class="snapshot-micro-bars snapshot-micro-bars-tight">
                    <div
                        v-for="row in collectionMicroRows"
                        :key="`collection-${row.label}`"
                        class="snapshot-micro-row snapshot-micro-row-compact"
                    >
                        <div class="snapshot-micro-meta">
                            <span class="snapshot-micro-label snapshot-micro-label-full" :title="row.label">{{ row.label }}</span>
                            <span class="snapshot-micro-value">{{ row.value }} · {{ formatPercent(row.percent) }}</span>
                        </div>
                        <div class="snapshot-micro-track">
                            <div
                                class="snapshot-micro-fill"
                                :style="{ width: `${row.percent}%`, background: row.color }"
                                :title="`${row.label}: ${row.value} donors (${formatPercent(row.percent)})`"
                            ></div>
                        </div>
                    </div>
                </div>
                <div v-else class="snapshot-empty-state">No collection metadata found.</div>
            </article>
        </div>
    </section>
</template>

<script>
import Vue from "vue";
import { parseNumericValue } from "./datasetUtils";

const STATUS_COLORS = ["#0c5c63", "#1b8b8f", "#4eb8b4", "#82d0bc", "#e7c566", "#d98d58"];
const ASSAY_COLORS = ["#0f766e", "#1d8f7d", "#34a98d", "#6ec2a9", "#9dd9c8", "#cfeee3"];
const COLLECTION_COLORS = ["#1e6f64", "#379683", "#56ab91", "#86c3ab", "#b8ddcb", "#dceddf"];
const STATUS_ORDER = ["Normal", "Prediabetes", "T2D", "T1D", "Diabetes"];

const DATA_TYPE_LABELS = {
    dynamic_perifusion: "Dynamic perifusion",
    bulk_RNA_seq: "Bulk RNA-seq",
    "bulk_RNA-seq": "Bulk RNA-seq",
    "single_cell_RNA-seq": "Single-cell RNA-seq",
    "single_nuclear_ATAC-seq": "Single-nucleus ATAC-seq",
};

export default Vue.component("DonorSnapshot", {
    props: {
        preparedDataset: {
            type: Object,
            default: null,
        },
    },
    computed: {
        isLoading() {
            return !this.preparedDataset;
        },
        rows() {
            return this.preparedDataset && Array.isArray(this.preparedDataset.rows)
                ? this.preparedDataset.rows
                : [];
        },
        columns() {
            return this.preparedDataset && Array.isArray(this.preparedDataset.columns)
                ? this.preparedDataset.columns
                : [];
        },
        hasRows() {
            return this.rows.length > 0;
        },
        columnNames() {
            return this.columns.map((column) => column.name);
        },
        fieldMap() {
            return {
                donorId: this.findColumn(["Accession", "accession", "donor_id", "Center Donor ID"]),
                derivedDiabetesStatus: this.findColumn([
                    "Derived diabetes status",
                    "Diabetes status",
                    "Diabetes Status",
                    "diabetes_status",
                ]),
                diabetesStatusDescription: this.findColumn([
                    "Description of diabetes status",
                    "diabetes_status_description",
                    "Diabetes diagnosis",
                    "Diabetes subtype",
                ]),
                age: this.findColumn(["Age (years)", "custom__organism_age", "age"]),
                bmi: this.findColumn(["BMI", "bmi"]),
                collections: this.findColumn(["Collections", "Collection", "collections"]),
                availability: this.findColumn(["Data_available_Pankbase"]),
            };
        },
        donorRecords() {
            if (!this.rows.length) {
                return [];
            }

            const donorMap = {};

            this.rows.forEach((row, index) => {
                const donorId = this.getDonorId(row, index);
                const current = donorMap[donorId] || {
                    donorId,
                    diabetesStatus: "",
                    normalizedDiabetesStatus: "",
                    age: null,
                    bmi: null,
                    collections: new Set(),
                    dataTypes: new Set(),
                };

                const resolvedStatus = this.resolveDiabetesStatus(row);
                if (resolvedStatus.normalized && this.shouldReplaceDiabetesStatus(current.normalizedDiabetesStatus, resolvedStatus.normalized)) {
                    current.diabetesStatus = resolvedStatus.raw;
                    current.normalizedDiabetesStatus = resolvedStatus.normalized;
                }

                const ageValue = parseNumericValue(row[this.fieldMap.age]);
                if (current.age === null && ageValue !== null) {
                    current.age = ageValue;
                }

                const bmiValue = parseNumericValue(row[this.fieldMap.bmi]);
                if (current.bmi === null && bmiValue !== null) {
                    current.bmi = bmiValue;
                }

                this.parseCollectionsValue(row[this.fieldMap.collections]).forEach((value) => {
                    current.collections.add(value);
                });

                this.parseAvailabilityValues(row[this.fieldMap.availability]).forEach((value) => {
                    current.dataTypes.add(value);
                });

                donorMap[donorId] = current;
            });

            return Object.values(donorMap);
        },
        medianAgeValue() {
            const ageValues = this.donorRecords
                .map((record) => record.age)
                .filter((value) => value !== null)
                .sort((left, right) => left - right);

            return ageValues.length ? this.quantile(ageValues, 0.5) : null;
        },
        assayTypeCount() {
            const assayValues = this.donorRecords.reduce((values, record) => {
                record.dataTypes.forEach((dataType) => values.push(dataType));
                return values;
            }, []);

            return new Set(assayValues).size;
        },
        assayTypeTooltip() {
            const labels = this.availabilityPlotData.map((row) => row.label);
            return labels.length
                ? `Modalities: ${labels.join(", ")}`
                : "";
        },
        nonDiabeticPercent() {
            const segment = this.diabetesStatusSegments.find((entry) => entry.label === "Normal");
            return segment ? segment.percent : null;
        },
        diabetesStatusPlotData() {
            const ageStatusLabels = new Set(this.ageSummaryRows.map((row) => row.label));
            return this.buildCountPlotData(
                this.donorRecords
                    .map((record) => record.normalizedDiabetesStatus)
                    .filter((label) => label && ageStatusLabels.has(label)),
                { limit: STATUS_ORDER.length, includeOther: false }
            );
        },
        diabetesStatusSegments() {
            const total = this.diabetesStatusPlotData.reduce((sum, row) => sum + row.value, 0) || 1;

            return this.diabetesStatusPlotData.map((row, index) => ({
                ...row,
                percent: (row.value / total) * 100,
                color: STATUS_COLORS[index % STATUS_COLORS.length],
            }));
        },
        availabilityPlotData() {
            const counts = {};

            this.donorRecords.forEach((record) => {
                record.dataTypes.forEach((dataType) => {
                    counts[dataType] = (counts[dataType] || 0) + 1;
                });
            });

            return Object.keys(counts)
                .map((key) => ({
                    label: DATA_TYPE_LABELS[key] || key,
                    value: counts[key],
                }))
                .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));
        },
        availabilityMicroRows() {
            const maxValue = this.availabilityPlotData.length
                ? this.availabilityPlotData[0].value
                : 1;

            return this.availabilityPlotData.slice(0, 4).map((row, index) => ({
                ...row,
                percent: maxValue ? (row.value / maxValue) * 100 : 0,
                color: ASSAY_COLORS[index % ASSAY_COLORS.length],
            }));
        },
        ageSummaryRows() {
            return this.buildGroupedNumericSummaries("age");
        },
        ageScale() {
            return this.getSummaryScale(this.ageSummaryRows);
        },
        collectionPlotData() {
            const counts = {};

            this.donorRecords.forEach((record) => {
                record.collections.forEach((collection) => {
                    counts[collection] = (counts[collection] || 0) + 1;
                });
            });

            return Object.keys(counts)
                .map((label) => ({
                    label,
                    value: counts[label],
                }))
                .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));
        },
        collectionMicroRows() {
            return this.collectionPlotData.slice(0, 5).map((row, index) => ({
                ...row,
                percent: this.donorRecords.length ? (row.value / this.donorRecords.length) * 100 : 0,
                color: COLLECTION_COLORS[index % COLLECTION_COLORS.length],
            }));
        },
    },
    methods: {
        normalizeDiabetesLabel(value) {
            const label = this.normalizeCategoryLabel(value);
            if (!label) {
                return "";
            }

            const lowered = label.toLowerCase();
            if (lowered.includes("type 1") || lowered.includes("t1d") || lowered.includes("autoimmune diabetes")) {
                return "T1D";
            }
            if (lowered.includes("type 2") || lowered.includes("t2d")) {
                return "T2D";
            }
            if (lowered.includes("control") || lowered.includes("normal") || lowered.includes("non-diabetic") || lowered.includes("without diabetes")) {
                return "Normal";
            }
            if (lowered.includes("predi")) {
                return "Prediabetes";
            }
            if (lowered.includes("diabetes")) {
                return "Diabetes";
            }

            return label;
        },
        resolveDiabetesStatus(row) {
            const derivedRaw = this.normalizeCategoryLabel(row[this.fieldMap.derivedDiabetesStatus]);
            const descriptionRaw = this.normalizeCategoryLabel(row[this.fieldMap.diabetesStatusDescription]);
            const normalizedDerived = this.normalizeDiabetesLabel(derivedRaw);
            const normalizedDescription = this.normalizeDiabetesLabel(descriptionRaw);

            if (normalizedDerived === "Diabetes" && ["T1D", "T2D"].includes(normalizedDescription)) {
                return {
                    raw: descriptionRaw || derivedRaw,
                    normalized: normalizedDescription,
                };
            }

            if (normalizedDerived && STATUS_ORDER.includes(normalizedDerived)) {
                return {
                    raw: derivedRaw,
                    normalized: normalizedDerived,
                };
            }

            if (normalizedDescription && STATUS_ORDER.includes(normalizedDescription)) {
                return {
                    raw: descriptionRaw,
                    normalized: normalizedDescription,
                };
            }

            return {
                raw: "",
                normalized: "",
            };
        },
        shouldReplaceDiabetesStatus(currentValue, nextValue) {
            if (!nextValue) {
                return false;
            }
            if (!currentValue) {
                return true;
            }

            return this.getDiabetesStatusRank(nextValue) < this.getDiabetesStatusRank(currentValue);
        },
        getDiabetesStatusRank(value) {
            const index = STATUS_ORDER.indexOf(value);
            return index === -1 ? STATUS_ORDER.length : index;
        },
        findColumn(candidates) {
            if (!this.columnNames.length) {
                return "";
            }

            const exactMatch = candidates.find((candidate) => this.columnNames.includes(candidate));
            if (exactMatch) {
                return exactMatch;
            }

            const loweredColumns = this.columnNames.map((name) => ({
                original: name,
                lowered: String(name).trim().toLowerCase(),
            }));

            const loweredCandidate = candidates
                .map((candidate) => String(candidate).trim().toLowerCase())
                .find((candidate) => loweredColumns.some((column) => column.lowered === candidate));

            if (loweredCandidate) {
                const matchingColumn = loweredColumns.find((column) => column.lowered === loweredCandidate);
                return matchingColumn ? matchingColumn.original : "";
            }

            const containsCandidate = candidates
                .map((candidate) => String(candidate).trim().toLowerCase())
                .find((candidate) => loweredColumns.some((column) => column.lowered.includes(candidate)));

            if (!containsCandidate) {
                return "";
            }

            const matchingColumn = loweredColumns.find((column) => column.lowered.includes(containsCandidate));
            return matchingColumn ? matchingColumn.original : "";
        },
        getDonorId(row, index) {
            const candidateFields = [
                this.fieldMap.donorId,
                "Accession",
                "accession",
                "donor_id",
                "Center Donor ID",
            ].filter(Boolean);

            for (let fieldIndex = 0; fieldIndex < candidateFields.length; fieldIndex += 1) {
                const value = row[candidateFields[fieldIndex]];
                if (value !== null && value !== undefined && String(value).trim()) {
                    return String(value).trim();
                }
            }

            return `row-${index + 1}`;
        },
        normalizeCategoryLabel(value) {
            if (value === null || value === undefined) {
                return "";
            }

            const normalized = String(value).trim();
            if (!normalized) {
                return "";
            }

            const lowered = normalized.toLowerCase();
            if (["na", "n/a", "null", "none", "-", "(missing)", "missing"].includes(lowered)) {
                return "";
            }

            return normalized;
        },
        parseAvailabilityValues(value) {
            if (value === null || value === undefined) {
                return [];
            }

            return [...new Set(
                String(value)
                    .split(";")
                    .map((entry) => entry.trim())
                    .filter((entry) => {
                        if (!entry) {
                            return false;
                        }

                        const lowered = entry.toLowerCase();
                        return !["na", "n/a", "null", "none", "-", "missing"].includes(lowered);
                    })
            )];
        },
        parseCollectionsValue(value) {
            if (value === null || value === undefined) {
                return [];
            }

            return [...new Set(
                String(value)
                    .split(/[;,|]/)
                    .map((entry) => this.normalizeCategoryLabel(entry))
                    .filter(Boolean)
            )];
        },
        buildCountPlotData(values, options = {}) {
            const counts = values.reduce((map, value) => {
                map[value] = (map[value] || 0) + 1;
                return map;
            }, {});

            const sorted = Object.keys(counts)
                .map((label) => ({
                    label,
                    value: counts[label],
                }))
                .sort((left, right) => {
                    const rankDifference = this.getDiabetesStatusRank(left.label) - this.getDiabetesStatusRank(right.label);
                    return right.value - left.value || rankDifference || left.label.localeCompare(right.label);
                });

            const limit = options.limit || sorted.length;
            const topRows = sorted.slice(0, limit);

            if (!options.includeOther || sorted.length <= limit) {
                return topRows;
            }

            const otherCount = sorted.slice(limit).reduce((sum, row) => sum + row.value, 0);

            return otherCount
                ? topRows.concat({ label: "Other", value: otherCount })
                : topRows;
        },
        buildGroupedNumericSummaries(fieldName) {
            const grouped = this.donorRecords.reduce((map, record) => {
                const statusLabel = record.normalizedDiabetesStatus || this.normalizeDiabetesLabel(record.diabetesStatus);
                if (!statusLabel || record[fieldName] === null) {
                    return map;
                }

                if (!map[statusLabel]) {
                    map[statusLabel] = [];
                }

                map[statusLabel].push(record[fieldName]);
                return map;
            }, {});

            return Object.keys(grouped)
                .map((label) => {
                    const values = grouped[label].slice().sort((left, right) => left - right);
                    if (values.length < 3) {
                        return null;
                    }

                    return {
                        label,
                        count: values.length,
                        min: values[0],
                        q1: this.quantile(values, 0.25),
                        median: this.quantile(values, 0.5),
                        q3: this.quantile(values, 0.75),
                        max: values[values.length - 1],
                    };
                })
                .filter(Boolean)
                .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
                .slice(0, 4);
        },
        getSummaryScale(rows) {
            if (!rows.length) {
                return { min: 0, max: 1 };
            }

            const values = [];
            rows.forEach((row) => {
                values.push(row.min, row.max);
            });

            const min = Math.min(...values);
            const max = Math.max(...values);

            return min === max
                ? { min: min - 1, max: max + 1 }
                : { min, max };
        },
        toPercent(value, scale) {
            if (!scale || scale.max <= scale.min) {
                return 0;
            }

            const ratio = ((value - scale.min) / (scale.max - scale.min)) * 100;
            return Math.max(0, Math.min(100, ratio));
        },
        getWhiskerStyle(row, scale) {
            const left = this.toPercent(row.min, scale);
            const right = this.toPercent(row.max, scale);

            return {
                left: `${left}%`,
                width: `${Math.max(right - left, 0)}%`,
            };
        },
        getBoxStyle(row, scale) {
            const left = this.toPercent(row.q1, scale);
            const right = this.toPercent(row.q3, scale);

            return {
                left: `${left}%`,
                width: `${Math.max(right - left, 2)}%`,
            };
        },
        getMedianStyle(row, scale) {
            return {
                left: `${this.toPercent(row.median, scale)}%`,
            };
        },
        quantile(sortedValues, q) {
            if (!sortedValues.length) {
                return null;
            }

            if (sortedValues.length === 1) {
                return sortedValues[0];
            }

            const position = (sortedValues.length - 1) * q;
            const baseIndex = Math.floor(position);
            const remainder = position - baseIndex;
            const lower = sortedValues[baseIndex];
            const upper = sortedValues[baseIndex + 1] !== undefined
                ? sortedValues[baseIndex + 1]
                : lower;

            return lower + ((upper - lower) * remainder);
        },
        formatCount(value) {
            return Number(value || 0).toLocaleString();
        },
        formatNumericValue(value, digits = 1) {
            if (!Number.isFinite(value)) {
                return "N/A";
            }

            return Number(value).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: digits,
            });
        },
        formatPercent(value) {
            if (!Number.isFinite(value)) {
                return "N/A";
            }

            return `${Math.round(value)}%`;
        },
        shortenLabel(value, maxLength = 20) {
            const label = String(value || "");
            if (label.length <= maxLength) {
                return label;
            }

            return `${label.slice(0, Math.max(maxLength - 1, 1))}…`;
        },
    },
});
</script>

<style scoped>
.donor-snapshot {
    margin-top: 24px;
    width: 100%;
    min-width: 850px;
}

.snapshot-strip {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
}

.snapshot-card {
    min-width: 0;
    padding: 12px;
    border: 1px solid #d9e5df;
    border-radius: 16px;
    background:
        linear-gradient(180deg, rgba(249, 252, 250, 0.96) 0%, rgba(241, 247, 244, 0.96) 100%);
    box-shadow: 0 8px 20px rgba(21, 53, 47, 0.04);
}

.snapshot-card-overview {
    display: flex;
    flex-direction: column;
    background:
        radial-gradient(circle at top right, rgba(41, 170, 136, 0.12), transparent 42%),
        linear-gradient(180deg, rgba(249, 252, 250, 0.98) 0%, rgba(236, 245, 241, 0.98) 100%);
}

.snapshot-card-skeleton {
    gap: 8px;
}

.snapshot-skeleton-line {
    position: relative;
    overflow: hidden;
    border-radius: 999px;
    background: #dce8e2;
}

.snapshot-skeleton-line::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.8) 50%, transparent 100%);
    animation: snapshot-skeleton-shimmer 1.4s ease-in-out infinite;
}

.snapshot-skeleton-line-kicker {
    width: 34%;
    height: 10px;
}

.snapshot-skeleton-line-title {
    width: 62%;
    height: 26px;
    margin-top: 6px;
}

.snapshot-skeleton-line-copy {
    width: 76%;
    height: 11px;
}

.snapshot-skeleton-stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 8px;
}

.snapshot-skeleton-row {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.snapshot-skeleton-line-label {
    width: 58%;
    height: 10px;
}

.snapshot-skeleton-line-value {
    width: 100%;
    height: 6px;
}

.snapshot-card-kicker,
.snapshot-card-title {
    color: #1d4f4b;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.3;
}

.snapshot-card-kicker {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #237262;
    font-size: 10px;
}

.snapshot-overview-value {
    margin-top: 10px;
    color: #183c3a;
    font-size: 30px;
    font-weight: 700;
    line-height: 1;
}

.snapshot-overview-label {
    margin-top: 4px;
    color: #55706a;
    font-size: 13px;
}

.snapshot-overview-meta {
    margin-top: 10px;
    color: #64807a;
    font-size: 11px;
    line-height: 1.4;
}

.snapshot-overview-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 12px;
    align-self: flex-end;
    padding: 7px 10px;
    border: 1px solid #b8d7ce;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.72);
    color: #1d5f56;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    text-decoration: none;
}

.snapshot-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 10px;
}

.snapshot-card-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.snapshot-info {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #dcebe5;
    color: #456760;
    font-size: 9px;
    font-weight: 700;
    cursor: help;
    flex: 0 0 auto;
}

.snapshot-list-row,
.snapshot-micro-meta,
.snapshot-range-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.snapshot-list-label {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
    color: #365652;
    font-size: 11px;
}

.snapshot-list-value,
.snapshot-micro-value,
.snapshot-range-head {
    color: #365652;
    font-size: 11px;
    font-weight: 700;
}

.snapshot-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex: 0 0 auto;
}

.snapshot-micro-bars,
.snapshot-range-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;
}

.snapshot-list-tight {
    margin-top: 6px;
}

.snapshot-micro-bars-tight {
    margin-top: 8px;
}

.snapshot-micro-row-compact {
    gap: 2px;
}

.snapshot-micro-label-strong {
    font-weight: 600;
}

.snapshot-micro-label,
.snapshot-range-head span:first-child {
    min-width: 0;
    color: #365652;
    font-size: 11px;
}

.snapshot-micro-label-full {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.snapshot-micro-track,
.snapshot-range-track {
    position: relative;
    height: 6px;
    margin-top: 2px;
    overflow: hidden;
    border-radius: 999px;
    background: #e7f0ec;
}

.snapshot-micro-fill {
    height: 100%;
    border-radius: 999px;
}

.snapshot-range-line {
    position: absolute;
    top: 50%;
    height: 2px;
    margin-top: -1px;
    border-radius: 999px;
    background: #6fa79b;
}

.snapshot-range-box {
    position: absolute;
    top: 0;
    height: 6px;
    border-radius: 999px;
    background: linear-gradient(90deg, #44a28d 0%, #7ecdb6 100%);
}

.snapshot-range-marker {
    position: absolute;
    top: -1px;
    width: 2px;
    height: 8px;
    margin-left: -1px;
    border-radius: 999px;
    background: #163b39;
}

.snapshot-range-row-compact {
    gap: 4px;
}

.snapshot-range-axis {
    display: grid;
    grid-template-columns: 1fr;
    gap: 4px;
    margin-top: 2px;
}

.snapshot-range-axis-spacer {
    display: none;
}

.snapshot-range-axis-values {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #7a9089;
    font-size: 10px;
    line-height: 1;
}

.snapshot-empty-state {
    margin-top: 8px;
    color: #6f8780;
    font-size: 11px;
    line-height: 1.5;
}

@keyframes snapshot-skeleton-shimmer {
    100% {
        transform: translateX(100%);
    }
}
</style>
