<template>
    <section v-if="hasRows" class="donor-snapshot">
        <div class="snapshot-strip">
            <article class="snapshot-card snapshot-card-overview">
                <div class="snapshot-card-kicker">Cohort snapshot</div>
                <div class="snapshot-overview-value">{{ formatCount(donorRecords.length) }}</div>
                <div class="snapshot-overview-label">unique donors</div>
                <div class="snapshot-overview-meta">
                    <div v-if="medianAgeValue !== null">Median age {{ formatNumericValue(medianAgeValue, 1) }}</div>
                    <div v-if="assayTypeCount" :title="assayTypeTooltip">{{ assayTypeCount }} modalities</div>
                    <div v-if="nonDiabeticPercent !== null">{{ formatPercent(nonDiabeticPercent) }} non-diabetic</div>
                </div>
                <a class="snapshot-overview-link" href="/donors.html">Donor summary</a>
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
                    <div class="snapshot-card-title">Autoantibody landscape</div>
                    <span
                        v-b-tooltip.hover
                        class="snapshot-info"
                        tabindex="0"
                        :title="aabTestedDonorCount ? `Based on ${formatCount(aabTestedDonorCount)} donors tested for at least one autoantibody.` : 'No tested donors found.'"
                    >i</span>
                </div>
                <div
                    v-if="aabBurdenSegments.length"
                    class="snapshot-stacked-bar snapshot-stacked-bar-tight"
                    :title="aabBurdenTooltip"
                >
                    <div
                        v-for="segment in aabBurdenSegments"
                        :key="`aab-strip-${segment.label}`"
                        class="snapshot-stacked-segment"
                        :style="{
                            width: `${segment.percent}%`,
                            background: segment.color,
                        }"
                    ></div>
                </div>
                <div v-if="aabBurdenSegments.length" class="snapshot-inline-stats">
                    <div
                        v-for="segment in aabBurdenSegments"
                        :key="`aab-burden-${segment.label}`"
                        class="snapshot-inline-stat"
                    >
                        <span class="snapshot-inline-label">{{ segment.label }}</span>
                        <span class="snapshot-inline-value">{{ formatPercent(segment.percent) }}</span>
                    </div>
                </div>
                <div v-if="aabTypeRows.length" class="snapshot-micro-bars snapshot-micro-bars-tight">
                    <div
                        v-for="row in aabTypeRows"
                        :key="`aab-type-${row.label}`"
                        class="snapshot-micro-row snapshot-micro-row-compact"
                    >
                        <div class="snapshot-micro-meta">
                            <span class="snapshot-micro-label">{{ row.label }}</span>
                            <span class="snapshot-micro-value">{{ formatPercent(row.percent) }}</span>
                        </div>
                        <div class="snapshot-micro-track">
                            <div
                                class="snapshot-micro-fill"
                                :style="{ width: `${row.percent}%`, background: row.color }"
                                :title="`${row.label}: ${row.value} of ${aabTestedDonorCount} tested donors`"
                            ></div>
                        </div>
                    </div>
                </div>
                <div v-else class="snapshot-empty-state">No autoantibody fields found.</div>
            </article>
        </div>
    </section>
</template>

<script>
import Vue from "vue";
import { parseNumericValue } from "./datasetUtils";

const STATUS_COLORS = ["#0c5c63", "#1b8b8f", "#4eb8b4", "#82d0bc", "#e7c566", "#d98d58"];
const ASSAY_COLORS = ["#0f766e", "#1d8f7d", "#34a98d", "#6ec2a9", "#9dd9c8", "#cfeee3"];

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
                diabetesStatus: this.findColumn([
                    "Derived diabetes status",
                    "Description of diabetes status",
                    "diabetes_status_description",
                ]),
                age: this.findColumn(["Age (years)", "custom__organism_age", "age"]),
                bmi: this.findColumn(["BMI", "bmi"]),
                collections: this.findColumn(["Collections", "Collection", "collections"]),
                availability: this.findColumn(["Data_available_Pankbase"]),
                aabGada: this.findColumn(["aab_gada", "AAB_GADA", "GADA", "gada"]),
                aabIa2: this.findColumn(["aab_ia2", "aab_ia-2", "AAB_IA2", "IA2", "ia2"]),
                aabIaa: this.findColumn(["aab_iaa", "AAB_IAA", "IAA", "iaa"]),
                aabZnt8: this.findColumn(["aab_znt8", "aab_znt-8", "AAB_ZNT8", "ZNT8", "znt8"]),
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
                    collections: "",
                    dataTypes: new Set(),
                    aab: {
                        GADA: false,
                        IA2: false,
                        IAA: false,
                        ZNT8: false,
                    },
                    aabTested: {
                        GADA: false,
                        IA2: false,
                        IAA: false,
                        ZNT8: false,
                    },
                };

                const statusValue = this.normalizeCategoryLabel(row[this.fieldMap.diabetesStatus]);
                if (!current.diabetesStatus && statusValue) {
                    current.diabetesStatus = statusValue;
                    current.normalizedDiabetesStatus = this.normalizeDiabetesLabel(statusValue);
                }

                const ageValue = parseNumericValue(row[this.fieldMap.age]);
                if (current.age === null && ageValue !== null) {
                    current.age = ageValue;
                }

                const bmiValue = parseNumericValue(row[this.fieldMap.bmi]);
                if (current.bmi === null && bmiValue !== null) {
                    current.bmi = bmiValue;
                }

                const collectionValue = this.normalizeCategoryLabel(row[this.fieldMap.collections]);
                if (!current.collections && collectionValue) {
                    current.collections = collectionValue;
                }

                this.parseAvailabilityValues(row[this.fieldMap.availability]).forEach((value) => {
                    current.dataTypes.add(value);
                });

                if (this.isKnownAabValue(row[this.fieldMap.aabGada])) {
                    current.aabTested.GADA = true;
                }
                if (this.isTruthyAabValue(row[this.fieldMap.aabGada])) {
                    current.aab.GADA = true;
                }

                if (this.isKnownAabValue(row[this.fieldMap.aabIa2])) {
                    current.aabTested.IA2 = true;
                }
                if (this.isTruthyAabValue(row[this.fieldMap.aabIa2])) {
                    current.aab.IA2 = true;
                }

                if (this.isKnownAabValue(row[this.fieldMap.aabIaa])) {
                    current.aabTested.IAA = true;
                }
                if (this.isTruthyAabValue(row[this.fieldMap.aabIaa])) {
                    current.aab.IAA = true;
                }

                if (this.isKnownAabValue(row[this.fieldMap.aabZnt8])) {
                    current.aabTested.ZNT8 = true;
                }
                if (this.isTruthyAabValue(row[this.fieldMap.aabZnt8])) {
                    current.aab.ZNT8 = true;
                }

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
            return this.buildCountPlotData(
                this.donorRecords.map((record) => this.normalizeDiabetesLabel(record.diabetesStatus)).filter(Boolean),
                { limit: 5, includeOther: true }
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
        aabTestedDonorCount() {
            return this.donorRecords.filter((record) => this.hasAnyAabField(record)).length;
        },
        aabDonorRows() {
            return this.donorRecords.filter((record) => {
                return Object.values(record.aab || {}).some((value) => value);
            });
        },
        aabBurdenSegments() {
            const donorsWithAnyAabField = this.donorRecords.filter((record) => this.hasAnyAabField(record));
            const total = donorsWithAnyAabField.length;

            if (!total) {
                return [];
            }

            const counts = {
                "0 AAB": 0,
                "1 AAB": 0,
                "2+ AAB": 0,
            };

            donorsWithAnyAabField.forEach((record) => {
                const positiveCount = this.getPositiveAabCount(record);
                if (positiveCount === 0) {
                    counts["0 AAB"] += 1;
                } else if (positiveCount === 1) {
                    counts["1 AAB"] += 1;
                } else {
                    counts["2+ AAB"] += 1;
                }
            });

            const colors = ["#d8e5de", "#73c3a4", "#0f766e"];
            return Object.keys(counts).map((label, index) => ({
                label,
                value: counts[label],
                percent: total ? (counts[label] / total) * 100 : 0,
                color: colors[index],
            }));
        },
        aabBurdenTooltip() {
            return this.aabBurdenSegments.map((segment) => {
                return `${segment.label}: ${segment.value} (${this.formatPercent(segment.percent)})`;
            }).join(", ");
        },
        aabTypeRows() {
            const donorsWithAnyAabField = this.donorRecords.filter((record) => this.hasAnyAabField(record));
            const total = donorsWithAnyAabField.length;

            if (!total) {
                return [];
            }

            const labels = ["GADA", "IA2", "IAA", "ZNT8"];
            const colors = ["#0c5c63", "#1b8b8f", "#4eb8b4", "#82d0bc"];

            return labels.map((label, index) => {
                const value = donorsWithAnyAabField.reduce((sum, record) => {
                    return sum + (record.aab && record.aab[label] ? 1 : 0);
                }, 0);

                return {
                    label,
                    value,
                    percent: total ? (value / total) * 100 : 0,
                    color: colors[index],
                };
            }).sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));
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
        isTruthyAabValue(value) {
            if (value === null || value === undefined) {
                return false;
            }

            const normalized = String(value).trim().toLowerCase();
            return ["true", "yes", "y", "1", "positive", "pos", "+"].includes(normalized);
        },
        isKnownAabValue(value) {
            if (value === null || value === undefined) {
                return false;
            }

            const normalized = String(value).trim().toLowerCase();
            return !!normalized && !["na", "n/a", "null", "none", "-", "missing", "(missing)", "unknown"].includes(normalized);
        },
        hasAnyAabField(record) {
            if (!record) {
                return false;
            }

            return Object.values(record.aabTested || {}).some((value) => value);
        },
        getPositiveAabCount(record) {
            if (!record || !record.aab) {
                return 0;
            }

            return Object.values(record.aab).reduce((sum, value) => sum + (value ? 1 : 0), 0);
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
                .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));

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

.snapshot-stacked-bar {
    display: flex;
    overflow: hidden;
    border-radius: 999px;
    background: #e4eeea;
}

.snapshot-stacked-bar-tight {
    height: 6px;
    margin-top: 8px;
}

.snapshot-stacked-segment {
    height: 100%;
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

.snapshot-inline-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    margin-top: 8px;
}

.snapshot-inline-stat {
    display: inline-flex;
    align-items: baseline;
    gap: 5px;
    color: #365652;
    font-size: 11px;
}

.snapshot-inline-label {
    color: #5f7c75;
}

.snapshot-inline-value {
    font-weight: 700;
}

.snapshot-empty-state {
    margin-top: 8px;
    color: #6f8780;
    font-size: 11px;
    line-height: 1.5;
}

@media (max-width: 1400px) {
    .snapshot-strip {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (max-width: 980px) {
    .snapshot-strip {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 640px) {
    .snapshot-strip {
        grid-template-columns: 1fr;
    }
}
</style>
