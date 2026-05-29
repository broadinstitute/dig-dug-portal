<template>
    <section v-if="isLoading || hasRows" class="donor-snapshot">
        <div
            v-if="isLoading"
            class="snapshot-skeleton-rows"
        >
            <div
                v-for="rowIndex in 2"
                :key="`snapshot-skeleton-row-${rowIndex}`"
                class="snapshot-comparison snapshot-comparison-loading"
                :style="skeletonGridStyle"
            >
                <article
                    v-for="(cardType, columnIndex) in skeletonCardTypes"
                    :key="`snapshot-skeleton-${rowIndex}-${columnIndex}`"
                    class="snapshot-card snapshot-card-skeleton"
                    aria-hidden="true"
                >
                    <div v-if="cardType === 'summary'" class="snapshot-skeleton-special">
                        <div class="snapshot-skeleton-line snapshot-skeleton-line-kicker"></div>
                        <div class="snapshot-skeleton-line snapshot-skeleton-line-title"></div>
                        <div class="snapshot-skeleton-line snapshot-skeleton-line-value"></div>
                    </div>
                    <div v-else-if="cardType === 'histogram'" class="snapshot-skeleton-plot">
                        <div class="snapshot-skeleton-cap"></div>
                        <div class="snapshot-skeleton-histogram">
                            <div
                                v-for="miniRowIndex in 6"
                                :key="`snapshot-skeleton-${rowIndex}-${columnIndex}-${miniRowIndex}`"
                                class="snapshot-skeleton-histogram-bar"
                                :style="getSkeletonHistogramBarStyle(miniRowIndex)"
                            ></div>
                        </div>
                        <div class="snapshot-skeleton-axis">
                            <div class="snapshot-skeleton-line snapshot-skeleton-line-axis"></div>
                            <div class="snapshot-skeleton-line snapshot-skeleton-line-axis"></div>
                        </div>
                    </div>
                    <div v-else class="snapshot-skeleton-plot">
                        <div class="snapshot-skeleton-cap"></div>
                        <div class="snapshot-skeleton-chart">
                            <div
                                v-for="miniRowIndex in getSkeletonRowCount(cardType)"
                                :key="`snapshot-skeleton-${rowIndex}-${columnIndex}-${miniRowIndex}`"
                                class="snapshot-skeleton-chart-row"
                            >
                                <div class="snapshot-skeleton-line snapshot-skeleton-line-label"></div>
                                <div class="snapshot-skeleton-line snapshot-skeleton-line-bar"></div>
                            </div>
                        </div>
                    </div>
                </article>
            </div>
        </div>
        <div v-else class="snapshot-shell">
            <div class="snapshot-header">
                <div>
                    <div class="snapshot-title">Donor composition snapshot</div>
                    <div class="snapshot-subtitle">
                        Compare the full donor cohort with the subset that has assay data available in PanKbase.
                    </div>
                </div>
                <!--
                <a class="snapshot-overview-link" href="/donors.html">See full donor summary</a>
                -->
            </div>

            <div class="snapshot-scroll">
                <div class="snapshot-comparison" :style="comparisonGridStyle">
                    <template v-for="row in comparisonRows">
                        <article
                            :key="`${row.key}-special`"
                            class="snapshot-card snapshot-card-special"
                            :class="row.cardClass"
                        >
                            <div class="snapshot-card-kicker">{{ row.kicker }}</div>
                            <div class="snapshot-special-title">{{ row.label }}</div>
                            <div class="snapshot-overview-value">{{ formatCount(row.count) }}</div>
                            <div v-if="row.overviewLabel" class="snapshot-overview-label">{{ row.overviewLabel }}</div>

                            <div class="snapshot-overview-meta">
                                <div v-for="line in row.metaLines" :key="`${row.key}-${line}`">{{ line }}</div>
                            </div>

                            <div v-if="row.coverageBadge" class="snapshot-coverage-badge">
                                {{ row.coverageBadge }}
                            </div>

                            <div v-if="row.key === 'assay'" class="snapshot-card-link">
                                <a class="snapshot-overview-link" href="/donors.html">See full assay summary</a>
                            </div>
                            <div v-if="row.key === 'all'" class="snapshot-card-link">
                                <a class="snapshot-overview-link alt" href="https://data.pankbase.org/search/?type=HumanDonor&from=3700">See full donor metadata</a>
                            </div>

                        </article>

                        <article
                            v-for="card in comparisonCards"
                            :key="`${row.key}-${card.key}`"
                            class="snapshot-card"
                            :class="row.cardClass"
                        >
                            <div class="snapshot-card-heading">
                                <div class="snapshot-card-title">{{ card.title }}</div>
                                <span
                                    v-if="card.tooltip"
                                    v-b-tooltip.hover
                                    class="snapshot-info"
                                    tabindex="0"
                                    :title="card.tooltip"
                                >i</span>
                            </div>

                            <div v-if="card.kind === 'categorical' && card.rowsByCohort[row.key].rows.length" class="snapshot-micro-bars">
                                <div
                                    v-for="plotRow in card.rowsByCohort[row.key].rows"
                                    :key="`${row.key}-${card.key}-${plotRow.label}`"
                                    class="snapshot-micro-row"
                                >
                                    <div class="snapshot-micro-meta">
                                        <span class="snapshot-micro-label snapshot-micro-label-full" :title="plotRow.label">
                                            {{ plotRow.label }}
                                        </span>
                                        <span class="snapshot-micro-value">{{ plotRow.value }} · {{ formatPercent(plotRow.percent) }}</span>
                                    </div>
                                    <div class="snapshot-micro-track">
                                        <div
                                            class="snapshot-micro-fill"
                                            :style="{ width: `${plotRow.percent}%`, background: plotRow.color }"
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div v-else-if="card.kind === 'histogram' && card.rowsByCohort[row.key].bins.length" class="snapshot-histogram">
                                <div class="snapshot-histogram-bars" aria-hidden="true">
                                    <div
                                        v-for="(bin, binIndex) in card.rowsByCohort[row.key].bins"
                                        :key="`${row.key}-${card.key}-bin-${binIndex}`"
                                        class="snapshot-histogram-bar-wrap"
                                    >
                                        <div
                                            class="snapshot-histogram-bar"
                                            :style="{
                                                height: `${bin.heightPercent}%`,
                                                background: bin.color,
                                            }"
                                            :title="`${bin.label}: ${bin.count} donors (${formatPercent(bin.percent)})`"
                                        ></div>
                                    </div>
                                </div>
                                <div class="snapshot-histogram-axis">
                                    <span>{{ card.rowsByCohort[row.key].rangeLabel.min }}</span>
                                    <span>{{ card.rowsByCohort[row.key].rangeLabel.max }}</span>
                                </div>
                            </div>

                            <div v-else class="snapshot-empty-state">{{ card.emptyState }}</div>

                            <div v-if="card.rowsByCohort[row.key].footer" class="snapshot-card-footer">
                                <span
                                    v-for="(part, partIndex) in splitFooterParts(card.rowsByCohort[row.key].footer)"
                                    :key="`${row.key}-${card.key}-footer-${partIndex}`"
                                    class="snapshot-card-footer-part"
                                >
                                    {{ part }}
                                </span>
                            </div>
                        </article>
                    </template>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
import Vue from "vue";
import { formatDataTypeLabel, normalizeDataTypeValue } from "./dataTypeUtils";
import { parseNumericValue } from "./datasetUtils";

const STATUS_ORDER = ["Control w/o diabetes", "Prediabetes", "T2D", "T1D"];
const ALL_DONOR_COLORS = ["#1a7b79", "#2f918e", "#47a8a1", "#68bcb0", "#8fd0c0"];
const ASSAY_DONOR_COLORS = ["#12647a", "#1a7ca0", "#2598c5", "#53b1dc", "#8fd0ee"];
const DATA_TYPE_COLORS = ["#0f766e", "#1d8f7d", "#34a98d", "#6ec2a9", "#9dd9c8"];

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
                sex: this.findColumn(["Sex", "sex", "Biological sex", "Gender", "gender"]),
                collections: this.findColumn(["Collections", "Collection", "collections"]),
                availability: this.findColumn(["Data_available_Pankbase", "Data available Pankbase"]),
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
                    sex: "",
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

                const sexValue = this.normalizeSexLabel(row[this.fieldMap.sex]);
                if (!current.sex && sexValue) {
                    current.sex = sexValue;
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
        allDonorRecords() {
            return this.donorRecords;
        },
        assayDonorRecords() {
            return this.donorRecords.filter((record) => record.dataTypes.size > 0);
        },
        assayCoveragePercent() {
            return this.allDonorRecords.length
                ? (this.assayDonorRecords.length / this.allDonorRecords.length) * 100
                : null;
        },
        comparisonRows() {
            return [
                {
                    key: "assay",
                    kicker: "Subset",
                    label: "Donors with assays",
                    overviewLabel: "",
                    count: this.assayDonorRecords.length,
                    cardClass: "snapshot-card-assay",
                    metaLines: [],
                    coverageBadge: null,
                },
                {
                    key: "all",
                    kicker: "Cohort",
                    label: "Donors with metadata",
                    overviewLabel: "",
                    count: this.allDonorRecords.length,
                    cardClass: "snapshot-card-all",
                    metaLines: [],
                    coverageBadge: null,
                },
            ];
        },
        comparisonCards() {
            const cards = [];

            if (this.allDonorRecords.length || this.assayDonorRecords.length) {
                cards.push({
                    key: "assay-profile",
                    title: "Assay profile",
                    kind: "categorical",
                    tooltip: "Assay modality counts are non-exclusive. A donor may contribute to multiple assay modalities.",
                    emptyState: "No assay metadata found.",
                    rowsByCohort: {
                        all: {
                            rows: this.buildCoverageRows(),
                            footer: "",
                        },
                        assay: {
                            rows: this.buildAssayTypeRows(this.assayDonorRecords),
                            footer: "",
                        },
                    },
                });
            }

            if (this.hasDonorData(this.allDonorRecords, "normalizedDiabetesStatus") || this.hasDonorData(this.assayDonorRecords, "normalizedDiabetesStatus")) {
                cards.push({
                    key: "diabetes",
                    title: "Diabetes status",
                    kind: "categorical",
                    tooltip: "",
                    emptyState: "No disease-status field found.",
                    rowsByCohort: {
                        all: this.buildCategoricalCardData(this.allDonorRecords, "normalizedDiabetesStatus", {
                            colors: ALL_DONOR_COLORS,
                            order: STATUS_ORDER,
                            limit: STATUS_ORDER.length,
                        }),
                        assay: this.buildCategoricalCardData(this.assayDonorRecords, "normalizedDiabetesStatus", {
                            colors: ASSAY_DONOR_COLORS,
                            order: STATUS_ORDER,
                            limit: STATUS_ORDER.length,
                        }),
                    },
                });
            }

            if (this.hasNumericData(this.allDonorRecords, "age") || this.hasNumericData(this.assayDonorRecords, "age")) {
                cards.push(this.buildHistogramComparisonCard("age", "Age", "years"));
            }

            if (this.hasDonorData(this.allDonorRecords, "sex") || this.hasDonorData(this.assayDonorRecords, "sex")) {
                cards.push({
                    key: "sex",
                    title: "Sex",
                    kind: "categorical",
                    tooltip: "",
                    emptyState: "No sex metadata found.",
                    rowsByCohort: {
                        all: this.buildCategoricalCardData(this.allDonorRecords, "sex", {
                            colors: ALL_DONOR_COLORS,
                            limit: 3,
                        }),
                        assay: this.buildCategoricalCardData(this.assayDonorRecords, "sex", {
                            colors: ASSAY_DONOR_COLORS,
                            limit: 3,
                        }),
                    },
                });
            }

            if (this.hasNumericData(this.allDonorRecords, "bmi") || this.hasNumericData(this.assayDonorRecords, "bmi")) {
                cards.push(this.buildHistogramComparisonCard("bmi", "BMI", ""));
            }

            if (this.hasCollectionData(this.allDonorRecords) || this.hasCollectionData(this.assayDonorRecords)) {
                cards.push({
                    key: "collections",
                    title: "Collections",
                    kind: "categorical",
                    tooltip: "Counts are donor-level and may be non-exclusive when a donor is represented in multiple collections.",
                    emptyState: "No collection metadata found.",
                    rowsByCohort: {
                        all: this.buildCategoricalCardData(this.allDonorRecords, "collections", {
                            colors: ALL_DONOR_COLORS,
                            multiValue: true,
                            limit: 5,
                        }),
                        assay: this.buildCategoricalCardData(this.assayDonorRecords, "collections", {
                            colors: ASSAY_DONOR_COLORS,
                            multiValue: true,
                            limit: 5,
                            order: this.collectionOrder,
                            sortByOrderOnly: true,
                        }),
                    },
                });
            }

            return cards;
        },
        comparisonColumnCount() {
            return this.comparisonCards.length + 1;
        },
        comparisonGridStyle() {
            return {
                gridTemplateColumns: `205px repeat(${this.comparisonColumnCount-1}, minmax(170px, 1fr))`,
            };
        },
        skeletonGridStyle() {
            return {
                gridTemplateColumns: `repeat(${this.skeletonCardTypes.length}, minmax(180px, 1fr))`,
            };
        },
        collectionOrder() {
            return this.buildCategoricalCardData(this.allDonorRecords, "collections", {
                multiValue: true,
                limit: 5,
            }).rows.map((row) => row.label);
        },
        skeletonCardTypes() {
            return ["summary", "bars-2", "bars-4", "histogram", "bars-2", "histogram", "bars-5"];
        },
    },
    methods: {
        buildAssayTypeRows(records) {
            const assayRows = this.buildCategoricalCardData(records, "dataTypes", {
                colors: DATA_TYPE_COLORS,
                multiValue: true,
                limit: 4,
                formatLabel: (value) => formatDataTypeLabel(value),
            });

            return assayRows.rows;
        },
        buildCoverageRows() {
            if (!this.allDonorRecords.length) {
                return [];
            }

            const withAssayCount = this.assayDonorRecords.length;
            const withoutAssayCount = Math.max(this.allDonorRecords.length - withAssayCount, 0);
            const total = this.allDonorRecords.length;

            return [
                {
                    label: "Donors with assays",
                    value: withAssayCount,
                    percent: total ? (withAssayCount / total) * 100 : 0,
                    color: ASSAY_DONOR_COLORS[1],
                },
                {
                    label: "Without assay in PanKbase",
                    value: withoutAssayCount,
                    percent: total ? (withoutAssayCount / total) * 100 : 0,
                    color: "#b8cec7",
                },
            ];
        },
        buildHistogramComparisonCard(fieldName, title, unitLabel) {
            const scale = this.getNumericScale(this.allDonorRecords, fieldName);
            const allData = this.buildHistogramCardData(this.allDonorRecords, fieldName, scale, ALL_DONOR_COLORS[1], unitLabel);
            const assayData = this.buildHistogramCardData(this.assayDonorRecords, fieldName, scale, ASSAY_DONOR_COLORS[1], unitLabel);
            const maxPercent = Math.max(
                1,
                ...allData.bins.map((bin) => bin.percent),
                ...assayData.bins.map((bin) => bin.percent)
            );

            return {
                key: fieldName,
                title,
                kind: "histogram",
                tooltip: "",
                emptyState: `No ${title.toLowerCase()} data found.`,
                rowsByCohort: {
                    all: this.applyHistogramHeights(allData, maxPercent),
                    assay: this.applyHistogramHeights(assayData, maxPercent),
                },
            };
        },
        buildCategoricalCardData(records, fieldName, options = {}) {
            const counts = {};
            const totalCount = records.length || 1;
            let knownCount = 0;

            records.forEach((record) => {
                let values = [];
                const rawValue = record[fieldName];

                if (options.multiValue) {
                    values = rawValue instanceof Set ? Array.from(rawValue) : [];
                } else if (rawValue) {
                    values = [rawValue];
                }

                if (values.length) {
                    knownCount += 1;
                }

                values.forEach((value) => {
                    const formattedValue = options.formatLabel ? options.formatLabel(value) : value;
                    if (!formattedValue) {
                        return;
                    }
                    counts[formattedValue] = (counts[formattedValue] || 0) + 1;
                });
            });

            const orderedRows = Object.keys(counts)
                .map((label) => ({
                    label,
                    value: counts[label],
                }))
                .sort((left, right) => {
                    const leftRank = options.order ? options.order.indexOf(left.label) : -1;
                    const rightRank = options.order ? options.order.indexOf(right.label) : -1;
                    const orderDifference = (leftRank === -1 ? 999 : leftRank) - (rightRank === -1 ? 999 : rightRank);
                    if (options.sortByOrderOnly && options.order) {
                        return orderDifference || left.label.localeCompare(right.label);
                    }
                    return right.value - left.value || orderDifference || left.label.localeCompare(right.label);
                })
                .slice(0, options.limit || 4);

            return {
                rows: orderedRows.map((row, index) => ({
                    ...row,
                    percent: (row.value / totalCount) * 100,
                    color: (options.colors || ALL_DONOR_COLORS)[index % (options.colors || ALL_DONOR_COLORS).length],
                })),
                footer: "",
            };
        },
        buildHistogramCardData(records, fieldName, scale, color, unitLabel) {
            const values = records
                .map((record) => record[fieldName])
                .filter((value) => Number.isFinite(value));

            if (!values.length) {
                return {
                    bins: [],
                    footer: "",
                    rangeLabel: { min: "", max: "" },
                };
            }

            const binCount = 6;
            const span = scale.max - scale.min || 1;
            const binWidth = span / binCount;
            const counts = new Array(binCount).fill(0);

            values.forEach((value) => {
                const normalized = Math.min(Math.max(value, scale.min), scale.max);
                const relativePosition = normalized === scale.max
                    ? binCount - 1
                    : Math.floor((normalized - scale.min) / binWidth);
                const index = Math.max(0, Math.min(binCount - 1, relativePosition));
                counts[index] += 1;
            });

            return {
                bins: counts.map((count, index) => {
                    const binStart = scale.min + (binWidth * index);
                    const binEnd = scale.min + (binWidth * (index + 1));
                    return {
                        count,
                        color,
                        percent: (count / records.length) * 100,
                        heightPercent: 0,
                        label: `${this.formatNumericValue(binStart, 0)}-${this.formatNumericValue(binEnd, 0)}${unitLabel ? ` ${unitLabel}` : ""}`,
                    };
                }),
                footer: `Median ${this.formatNumericValue(this.quantile(values.slice().sort((left, right) => left - right), 0.5), 1)}${unitLabel ? ` ${unitLabel}` : ""} · n=${values.length.toLocaleString()}`,
                rangeLabel: {
                    min: this.formatNumericValue(scale.min, 0),
                    max: this.formatNumericValue(scale.max, 0),
                },
            };
        },
        applyHistogramHeights(cardData, maxPercent) {
            return {
                ...cardData,
                bins: cardData.bins.map((bin) => ({
                    ...bin,
                    heightPercent: maxPercent ? (bin.percent / maxPercent) * 100 : 0,
                })),
            };
        },
        getNumericScale(records, fieldName) {
            const values = records
                .map((record) => record[fieldName])
                .filter((value) => Number.isFinite(value));

            if (!values.length) {
                return { min: 0, max: 1 };
            }

            const min = Math.min(...values);
            const max = Math.max(...values);

            if (min === max) {
                return { min: min - 1, max: max + 1 };
            }

            return { min, max };
        },
        hasDonorData(records, fieldName) {
            return records.some((record) => {
                const value = record[fieldName];
                if (value instanceof Set) {
                    return value.size > 0;
                }

                return value !== null && value !== undefined && String(value).trim();
            });
        },
        hasNumericData(records, fieldName) {
            return records.some((record) => Number.isFinite(record[fieldName]));
        },
        hasCollectionData(records) {
            return records.some((record) => record.collections && record.collections.size);
        },
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
                return "Control w/o diabetes";
            }
            if (lowered.includes("predi")) {
                return "Prediabetes";
            }

            return label;
        },
        normalizeSexLabel(value) {
            const label = this.normalizeCategoryLabel(value);
            if (!label) {
                return "";
            }

            const lowered = label.toLowerCase();
            if (["m", "male"].includes(lowered)) {
                return "Male";
            }
            if (["f", "female"].includes(lowered)) {
                return "Female";
            }
            if (lowered.includes("unknown") || lowered.includes("not reported")) {
                return "";
            }

            return label;
        },
        resolveDiabetesStatus(row) {
            const derivedRaw = this.normalizeCategoryLabel(row[this.fieldMap.derivedDiabetesStatus]);
            const descriptionRaw = this.normalizeCategoryLabel(row[this.fieldMap.diabetesStatusDescription]);
            const normalizedDerived = this.normalizeDiabetesLabel(derivedRaw);
            const normalizedDescription = this.normalizeDiabetesLabel(descriptionRaw);

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
                    .map((entry) => normalizeDataTypeValue(entry))
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
        splitFooterParts(footer) {
            if (!footer) {
                return [];
            }

            return String(footer)
                .split(" · ")
                .map((part) => part.trim())
                .filter(Boolean);
        },
        getSkeletonRowCount(cardType) {
            const match = String(cardType).match(/bars-(\d+)/);
            return match ? Number(match[1]) : 3;
        },
        getSkeletonHistogramBarStyle(index) {
            const heights = [16, 52, 72, 84, 24, 8];
            return {
                height: `${heights[index - 1] || 20}%`,
            };
        },
    },
});

function formatPercentValue(value) {
    if (!Number.isFinite(value)) {
        return "N/A";
    }

    return `${Math.round(value)}%`;
}
</script>

<style scoped>
.donor-snapshot {
    margin-top: 24px;
    width: 100%;
}

.snapshot-shell {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.snapshot-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
}

.snapshot-title {
    color: #173d39;
    font-size: 1.6em;
    font-weight: 700;
}

.snapshot-subtitle {
    margin-top: 2px;
    font-size: 1.2em;
    max-width: 720px;
}

.snapshot-scroll {
    overflow-x: auto;
    padding-bottom: 4px;
}

.snapshot-skeleton-rows {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.snapshot-comparison {
    display: grid;
    gap: 8px;
    min-width: 1100px;
}

.snapshot-comparison-loading {
    overflow: visible;
}

.snapshot-card {
    min-width: 0;
    padding: 10px;
    border: 1px solid #d8e6e1;
    border-top-width: 4px;
    background: #fbfbfb;
    box-shadow: 0 10px 24px rgba(19, 48, 44, 0.05);
    display: flex;
    flex-direction: column;
}

.snapshot-card-all {
    border-top-color: #4faea8;
}

.snapshot-card-assay {
    border-top-color: #3d9fd2;
}

.snapshot-card-special {
    background: #fbfbfb;
}

.snapshot-card-skeleton {
    border-top-color: #d8e6e1;
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
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.85) 50%, transparent 100%);
    animation: snapshot-skeleton-shimmer 1.4s ease-in-out infinite;
}

.snapshot-skeleton-cap {
    width: 52%;
    height: 8px;
    border-radius: 999px;
    background: #dce8e2;
}

.snapshot-skeleton-special,
.snapshot-skeleton-plot {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
}

.snapshot-skeleton-special {
    justify-content: flex-start;
}

.snapshot-skeleton-chart {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;
    flex: 1 1 auto;
}

.snapshot-skeleton-histogram {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    align-items: end;
    gap: 4px;
    height: 54px;
    margin-top: 8px;
}

.snapshot-skeleton-axis {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 6px;
}

.snapshot-skeleton-chart-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.snapshot-skeleton-line-kicker {
    width: 32%;
    height: 8px;
}

.snapshot-skeleton-line-title {
    width: 64%;
    height: 14px;
    margin-top: 8px;
}

.snapshot-skeleton-line-label {
    width: 38%;
    height: 7px;
}

.snapshot-skeleton-line-value {
    width: 48%;
    height: 24px;
    margin-top: 12px;
}

.snapshot-skeleton-line-bar {
    width: 100%;
    height: 6px;
}

.snapshot-skeleton-line-axis {
    width: 20px;
    height: 7px;
}

.snapshot-skeleton-histogram-bar {
    border-radius: 5px 5px 2px 2px;
    background: #dce8e2;
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

.snapshot-special-title {
    margin-top: 4px;
    color: #163c39;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.1;
}

.snapshot-overview-value {
    margin-top: 8px;
    color: #183c3a;
    font-size: 26px;
    font-weight: 700;
    line-height: 1;
}

.snapshot-overview-label {
    margin-top: 2px;
    color: #55706a;
    font-size: 12px;
}

.snapshot-overview-meta {
    margin-top: 6px;
    color: #64807a;
    font-size: 10px;
    line-height: 1.35;
}

.snapshot-overview-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 7px 10px;
    border: 1px solid var(--pkb-primary-green);
    border-radius: 999px;
    background: var(--pkb-primary-green);
    color: white !important;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    text-decoration: none;
    white-space: nowrap;
}
.snapshot-overview-link.alt{
    color: var(--pkb-primary-green) !important;
    background: white ;
    border: 1px solid var(--pkb-primary-green);

}

.snapshot-card-link {
    align-self: flex-start;
    margin-top: auto;
}

.snapshot-card-heading {
    display: flex;
    align-items: flex-start;
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

.snapshot-coverage-badge {
    display: inline-flex;
    align-self: flex-start;
    margin-top: 6px;
    padding: 3px 7px;
    border-radius: 999px;
    background: rgba(19, 126, 188, 0.1);
    color: #145776;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.02em;
}

.snapshot-micro-bars {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 6px;
}

.snapshot-micro-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.snapshot-micro-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.snapshot-micro-label,
.snapshot-micro-value {
    color: #365652;
    font-size: 10px;
}

.snapshot-micro-value {
    font-weight: 700;
    white-space: nowrap;
}

.snapshot-micro-label-full {
    min-width: 0;
    line-height: 1.2;
    white-space: normal;
}

.snapshot-micro-track {
    position: relative;
    height: 5px;
    overflow: hidden;
    border-radius: 999px;
    background: #e7f0ec;
}

.snapshot-micro-fill {
    height: 100%;
    border-radius: 999px;
}

.snapshot-histogram {
    margin-top: 6px;
    flex: 1 1 auto;
}

.snapshot-histogram-bars {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    align-items: end;
    gap: 4px;
    height: 52px;
    padding: 0 1px;
}

.snapshot-histogram-bar-wrap {
    display: flex;
    align-items: flex-end;
    height: 100%;
}

.snapshot-histogram-bar {
    width: 100%;
    min-height: 3px;
    border-radius: 6px 6px 2px 2px;
    box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.3);
}

.snapshot-histogram-axis {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 5px;
    color: #7a9089;
    font-size: 10px;
    line-height: 1;
}

.snapshot-card-footer {
    margin-top: auto;
    padding-top: 8px;
    color: #6f8780;
    font-size: 10px;
    line-height: 1.25;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.snapshot-card-footer-part {
    white-space: nowrap;
}

.snapshot-card-footer-part:last-child {
    margin-left: auto;
    text-align: right;
}

.snapshot-empty-state {
    margin-top: 6px;
    color: #6f8780;
    font-size: 10px;
    line-height: 1.35;
}

@keyframes snapshot-skeleton-shimmer {
    100% {
        transform: translateX(100%);
    }
}
</style>
