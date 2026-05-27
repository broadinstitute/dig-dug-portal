import { hasClinicalFocus } from "../KrClinicalFocus/focusComparison";
import { clearClinicalFocus, readClinicalFocus, writeClinicalFocus } from "../KrClinicalFocus/focusStore";

export const variantComputed = {
        hasActiveContext() {
            return hasClinicalFocus(this.clinicalFocus);
        },
        compactContextLabel() {
            if (!this.hasActiveContext) return "";
            const contextId = this.clinicalFocus.orphaId || this.clinicalFocus.sourceId || "";
            return [this.clinicalFocus.label, contextId].filter(Boolean).join(" · ");
        },
        normalizedContextHpoTerms() {
            if (!this.hasActiveContext) return [];
            return (this.clinicalFocus.hpoTerms || [])
                .map((term) => {
                    if (typeof term === "string") return this.termObjectFromLabel(term);
                    const label = term.label || term.name || term.hpoName || "";
                    const id = term.id || term.hpoId || this.hpoIdFromText(label);
                    return {
                        id,
                        label: label.replace(/\s*\[HP:[0-9]+\]/, ""),
                    };
                })
                .filter((term) => term.id || term.label);
        },
        carrierProfileTermObjects() {
            return this.carrierPhenotypeCategories
                .flatMap((category) => [
                    this.termObjectFromLabel(category.category),
                    ...(category.terms || []).map((term) => this.termObjectFromLabel(term)),
                ])
                .filter((term) => term.id || term.label);
        },
        carrierContextOverlapTerms() {
            if (!this.hasActiveContext) return [];
            const carrierById = new Map();
            const carrierByLabel = new Map();
            this.carrierProfileTermObjects.forEach((term) => {
                if (term.id) carrierById.set(term.id, term);
                if (term.label) carrierByLabel.set(term.label.toLowerCase(), term);
            });
            const seen = new Set();
            return this.normalizedContextHpoTerms
                .map((term) => carrierById.get(term.id) || carrierByLabel.get((term.label || "").toLowerCase()))
                .filter((term) => {
                    if (!term) return false;
                    const key = term.id || term.label;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
        },
        carrierContextMatchValue() {
            if (!this.hasActiveContext) return "No active context";
            const total = this.normalizedContextHpoTerms.length;
            if (!total) return "Active context has no HPO terms";
            return `${this.carrierContextOverlapTerms.length} / ${total} context HPO terms`;
        },
        carrierContextOverlapPreview() {
            return this.carrierContextOverlapTerms
                .slice(0, 4)
                .map((term) => this.formatHpoTerm(term));
        },
        variantContextPanel() {
            if (!this.hasActiveContext) {
                return {
                    label: "Context comparison",
                    value: "No active HPO context",
                    note: "Carrier samples and carrier HPO profile are shown as cohort-wide summaries only.",
                };
            }
            return {
                label: "Context comparison",
                value: this.carrierContextMatchValue,
                note: `Active context: ${this.compactContextLabel || "selected HPO context"}. This is HPO-profile overlap, not variant similarity.`,
            };
        },
        carrierContextSelectionType() {
            if (this.selectedCarrierSampleIds.length) return "samples";
            if (this.selectedCarrierPhenotypeLabels.length) return "phenotypes";
            return "";
        },
        hasCarrierContextSelection() {
            return Boolean(this.carrierContextSelectionType);
        },
        carrierContextSelectionMessage() {
            if (this.carrierContextSelectionType === "samples") {
                return `${this.selectedCarrierSampleIds.length} carrier sample${this.selectedCarrierSampleIds.length === 1 ? "" : "s"} selected. Phenotype row selection is disabled until samples are cleared.`;
            }
            if (this.carrierContextSelectionType === "phenotypes") {
                return `${this.selectedCarrierPhenotypeLabels.length} phenotype item${this.selectedCarrierPhenotypeLabels.length === 1 ? "" : "s"} selected. Carrier sample selection is disabled until phenotype items are cleared.`;
            }
            return "";
        },
        carrierContextDraftAddOptions() {
            if (this.carrierContextDraftType === "samples") {
                return this.sortedCarrierSamples
                    .filter((sample) => !this.carrierContextDraftItems.includes(sample.id))
                    .map((sample) => ({ value: sample.id, label: sample.id }));
            }
            if (this.carrierContextDraftType === "phenotypes") {
                const options = [
                    ...this.phenotypeRows.map((phenotype) => ({ value: phenotype.label, label: phenotype.label })),
                    ...Object.values(this.variant.phenotypeDetails)
                        .flat()
                        .map((term) => ({ value: term.label, label: term.label })),
                ];
                const seen = new Set();
                return options.filter((option) => {
                    if (seen.has(option.value) || this.carrierContextDraftItems.includes(option.value)) return false;
                    seen.add(option.value);
                    return true;
                });
            }
            return [];
        },
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
        variantHeaderSubline() {
            const scope = this.variant.summaryScopes.variant;
            const parts = [
                `${scope.all} queried-variant carriers`,
                `${scope.proband} probands`,
                `${scope.affected} affected`,
            ];
            if (scope.diagnosed !== undefined) parts.push(`${scope.diagnosed} GenDx diagnosed`);
            return parts.join(" · ");
        },
        queryWindowLabel() {
            return this.variant.queryWindow || "Queried window not available";
        },
        queryGeneLabel() {
            return this.variant.query.window.replace(/\s+Variant$/, "");
        },
        carrierReference() {
            const references = {
                variant: {
                    levelLabel: "queried-variant carrier",
                    sampleCount: this.variant.summaryScopes.variant.all,
                    hpoCount: this.variant.newFixtureStatus?.exactCarrierHpoCount || this.variant.carrierPhenotypesByCategory.reduce((sum, category) => sum + Number(category.count || 0), 0),
                    contextRank: "top 9.1%",
                    description: `Variant level: inspect the ${this.variant.summaryScopes.variant.all} exact queried-variant carriers, then the carrier HPO profile, then context position in CRDC.`,
                    contextDescription: `The ${this.variant.newFixtureStatus?.exactCarrierHpoCount || "carrier"}-term queried-variant carrier phenotype profile is compared with the active clinical context, then positioned against CRDC background profiles after total HPO-term correction.`,
                    contextPosition: {
                        activeContext: "Kabuki syndrome profile",
                        carrierReference: `${this.variant.summaryScopes.variant.all} queried-variant carriers`,
                        contextMatch: this.carrierContextMatchValue,
                        crdcPosition: "top 9.1%",
                    },
                },
                gene: {
                    levelLabel: `${this.queryGeneLabel} gene carrier`,
                    sampleCount: this.variant.summaryScopes.gene.all,
                    hpoCount: this.variant.newFixtureStatus?.sameGeneCarrierHpoCount || this.variant.geneCarrierPhenotypesByCategory.reduce((sum, category) => sum + Number(category.count || 0), 0),
                    contextRank: "top 13.4%",
                    description: `Gene level: inspect ${this.queryGeneLabel} carrier samples, then the gene-carrier HPO profile, then context position in CRDC.`,
                    contextDescription: "The gene carrier phenotype profile is compared with the active clinical context, then positioned against CRDC background profiles after total HPO-term correction.",
                    contextPosition: {
                        activeContext: "Kabuki syndrome profile",
                        carrierReference: `${this.variant.summaryScopes.gene.all} ${this.queryGeneLabel} gene carriers`,
                        contextMatch: this.carrierContextMatchValue,
                        crdcPosition: "top 13.4%",
                    },
                },
            };

            return references[this.activeSummaryLevel];
        },
        activeCarrierSamples() {
            return this.activeSummaryLevel === "variant"
                ? this.variant.carrierSamples
                : this.variant.geneCarrierSamples;
        },
        sortedCarrierSamples() {
            return this.sortRows(this.activeCarrierSamples, this.carrierSampleSort.key, this.carrierSampleSort.direction);
        },
        carrierPhenotypeCategories() {
            return this.activeSummaryLevel === "variant"
                ? this.variant.carrierPhenotypesByCategory
                : this.variant.geneCarrierPhenotypesByCategory;
        },
        sortedCarrierPhenotypeCategories() {
            return this.sortRows(this.carrierPhenotypeCategories, this.carrierHpoSort.key, this.carrierHpoSort.direction);
        },
        activeResidualGroups() {
            return this.activeSummaryLevel === "variant"
                ? this.variant.residualGroups
                : this.variant.geneResidualGroups;
        },
        residualCarrierSamples() {
            if (this.activeResidualGroupName === "All CRDC") return this.sortedCarrierSamples;
            return this.sortedCarrierSamples.filter((sample) => sample.group === this.activeResidualGroupName);
        },
        demographicPanelScope() {
            return this.variant.summaryScopes[this.activeDemographicLevel];
        },
        demographicPanelAgeBins() {
            const source = this.activeDemographicLevel === "variant"
                ? this.variant.variantDemographics
                : this.variant.demographics;

            return source[this.activeDemographic];
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
                const investigatorScale = {
                    "all-investigators": 1,
                    "investigator-1": 0.55,
                    "investigator-2": 0.62,
                    "investigator-3": 0.45,
                }[this.activeInvestigator] || 1;
                const queriedVariantCount = {
                    all: this.variant.summaryScopes.variant.all,
                    affected: this.variant.summaryScopes.variant.affected || 0,
                    proband: this.variant.summaryScopes.variant.proband,
                }[key];
                group[key][25] = Math.max(
                    1,
                    Math.round(queriedVariantCount * investigatorScale * ageScale),
                );
                return group;
            }, {});
        },
        visibleMarkers() {
            return this.variant.markers.filter((marker) => marker.visibleInWindow);
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
        densityMax() {
            return Math.max(
                20,
                this.variant.summaryScopes.variant.all || 0,
                this.variant.summaryScopes.gene.all || 0,
            );
        },
        densityYAxisLabels() {
            return [this.densityMax, Math.round(this.densityMax / 2)];
        },
        phenotypeRows() {
            return this.phenotypeRowsForInvestigator(this.activePhenotypeInvestigator);
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
            const ratio = parseFloat(this.variant.query.focusLeft) / 100;
            return `calc(var(--locus-pad) + (100% - (var(--locus-pad) * 2)) * ${ratio})`;
        },
        variantNewSummary() {
            const exactScope = this.variant.summaryScopes.variant;
            const geneScope = this.variant.summaryScopes.gene;
            const topCarrierDomains = this.carrierPhenotypeCategories
                .slice(0, 3)
                .map((category) => category.category)
                .join(" · ");
            const references = this.variant.relatedDiseases
                .slice(0, 2)
                .map((disease) => disease.name)
                .join(" · ");
            return [
                {
                    label: "Query mode",
                    value: this.activeSummaryLevel === "variant" ? "Exact queried variant" : "Same-gene carrier set",
                    note: `Exact queried variant: ${exactScope.all} carriers · same gene: ${geneScope.all} carriers`,
                },
                {
                    label: "Primary CRDC evidence",
                    value: `${exactScope.all} exact-variant carriers`,
                    note: `${exactScope.proband} probands · ${exactScope.affected} affected · ${exactScope.diagnosed} GenDx diagnosed`,
                },
                {
                    label: "Carrier phenotype group",
                    value: topCarrierDomains || "Carrier HPO profile unavailable",
                    note: "Shown from carrier HPO profiles, not from variant similarity.",
                },
                {
                    label: "Rare disease reference",
                    value: references || "No reference shown",
                    note: "Core reference is shown separately from CRDC recurrence.",
                },
                {
                    label: "Context use",
                    value: this.hasActiveContext ? this.carrierContextMatchValue : "No active context",
                    note: this.hasActiveContext
                        ? "Carrier HPO profile compared with active HPO context."
                        : "Set context to compare active HPO terms against carrier HPO profiles.",
                },
            ];
        },
    };

export const variantMethods = {
        closeToolPopovers() {
            this.contextPopoverOpen = false;
            this.optionsPopoverOpen = false;
        },
        removeClinicalContext() {
            clearClinicalFocus();
            this.contextPopoverOpen = false;
        },
        toggleCarrierSampleContext(sampleId) {
            if (this.carrierContextSelectionType === "phenotypes") return;
            const selectedSampleIds = this.selectedCarrierSampleIds.includes(sampleId)
                ? this.selectedCarrierSampleIds.filter((id) => id !== sampleId)
                : [...this.selectedCarrierSampleIds, sampleId];
            this.selectedCarrierSampleIds = selectedSampleIds;
            if (selectedSampleIds.length) {
                this.syncCarrierContextDraft("samples", selectedSampleIds);
            } else {
                this.closeCarrierContextDraft();
            }
        },
        toggleCarrierPhenotypeContext(label) {
            if (this.carrierContextSelectionType === "samples") return;
            const selectedPhenotypeLabels = this.selectedCarrierPhenotypeLabels.includes(label)
                ? this.selectedCarrierPhenotypeLabels.filter((item) => item !== label)
                : [...this.selectedCarrierPhenotypeLabels, label];
            this.selectedCarrierPhenotypeLabels = selectedPhenotypeLabels;
            if (selectedPhenotypeLabels.length) {
                this.syncCarrierContextDraft("phenotypes", selectedPhenotypeLabels);
            } else {
                this.closeCarrierContextDraft();
            }
        },
        isCarrierSampleContextDisabled(sampleId) {
            return this.carrierContextSelectionType === "phenotypes" && !this.selectedCarrierSampleIds.includes(sampleId);
        },
        isCarrierPhenotypeContextDisabled(label) {
            return this.carrierContextSelectionType === "samples" && !this.selectedCarrierPhenotypeLabels.includes(label);
        },
        clearCarrierContextSelection() {
            this.selectedCarrierSampleIds = [];
            this.selectedCarrierPhenotypeLabels = [];
            this.closeCarrierContextDraft();
        },
        openCarrierContextDraft() {
            if (!this.hasCarrierContextSelection) return;
            const type = this.carrierContextSelectionType;
            this.syncCarrierContextDraft(type, type === "samples" ? this.selectedCarrierSampleIds : this.selectedCarrierPhenotypeLabels);
        },
        syncCarrierContextDraft(type, items) {
            this.carrierContextDraftType = type;
            this.carrierContextDraftItems = [...items];
            this.carrierContextDraftAddValue = "";
            this.carrierContextDraftOpen = true;
        },
        closeCarrierContextDraft() {
            this.carrierContextDraftOpen = false;
            this.carrierContextDraftType = "";
            this.carrierContextDraftItems = [];
            this.carrierContextDraftAddValue = "";
        },
        addCarrierContextDraftItem() {
            if (!this.carrierContextDraftAddValue || this.carrierContextDraftItems.includes(this.carrierContextDraftAddValue)) return;
            const nextItems = [...this.carrierContextDraftItems, this.carrierContextDraftAddValue];
            this.carrierContextDraftItems = nextItems;
            if (this.carrierContextDraftType === "samples") {
                this.selectedCarrierSampleIds = nextItems;
            }
            if (this.carrierContextDraftType === "phenotypes") {
                this.selectedCarrierPhenotypeLabels = nextItems;
            }
            this.carrierContextDraftAddValue = "";
        },
        removeCarrierContextDraftItem(item) {
            const nextItems = this.carrierContextDraftItems.filter((current) => current !== item);
            this.carrierContextDraftItems = nextItems;
            if (this.carrierContextDraftType === "samples") {
                this.selectedCarrierSampleIds = nextItems;
            }
            if (this.carrierContextDraftType === "phenotypes") {
                this.selectedCarrierPhenotypeLabels = nextItems;
            }
        },
        clearCarrierContextDraftItems() {
            this.carrierContextDraftItems = [];
            if (this.carrierContextDraftType === "samples") {
                this.selectedCarrierSampleIds = [];
            }
            if (this.carrierContextDraftType === "phenotypes") {
                this.selectedCarrierPhenotypeLabels = [];
            }
            this.carrierContextDraftAddValue = "";
        },
        confirmCarrierContextDraft() {
            if (!this.carrierContextDraftItems.length) return;
            const type = this.carrierContextDraftType;
            const items = [...this.carrierContextDraftItems];
            const label = type === "samples"
                ? `${items.length} selected ${this.carrierReference.levelLabel} sample${items.length === 1 ? "" : "s"}`
                : `${items.length} selected carrier phenotype item${items.length === 1 ? "" : "s"}`;
            const hpoTerms = type === "phenotypes"
                ? this.hpoTermsFromPhenotypeRows(items)
                : this.hpoTermsFromCarrierProfile();
            writeClinicalFocus({
                source: type === "samples" ? "carrier-sample-selection" : "carrier-phenotype-selection",
                label,
                sourceDetail: type === "samples"
                    ? `Mock context created from selected ${this.carrierReference.levelLabel} samples: ${items.join(", ")}.`
                    : `Mock context created from selected carrier phenotype rows: ${items.join(", ")}.`,
                sourceQuery: items.join(", "),
                hpoTerms,
            });
            this.clinicalFocus = readClinicalFocus();
            this.activeCarrierDetail = "residual";
            if (type === "samples") {
                this.selectedCarrierSampleIds = items;
                this.selectedCarrierPhenotypeLabels = [];
            } else {
                this.selectedCarrierPhenotypeLabels = items;
                this.selectedCarrierSampleIds = [];
            }
            this.closeCarrierContextDraft();
        },
        hpoTermsFromPhenotypeRows(labels) {
            const selectedTerms = labels
                .flatMap((label) => {
                    const categoryTerms = this.variant.phenotypeDetails[label];
                    return categoryTerms ? categoryTerms.map((term) => term.label) : [label];
                });
            return [...new Set(selectedTerms)]
                .slice(0, 12)
                .map((termLabel) => ({
                    id: termLabel.match(/\[(HP:[0-9]+)\]/)?.[1] || "",
                    label: termLabel.replace(/\s*\[HP:[0-9]+\]/, ""),
                }));
        },
        hpoTermsFromCarrierProfile() {
            return this.sortedCarrierPhenotypeCategories
                .flatMap((category) => category.terms || [])
                .slice(0, 12)
                .map((term) => ({
                    id: term.match(/\[(HP:[0-9]+)\]/)?.[1] || "",
                    label: term.replace(/\s*\[HP:[0-9]+\]/, ""),
                }));
        },
        hpoIdFromText(text) {
            return (text || "").match(/HP:[0-9]+/)?.[0] || "";
        },
        termObjectFromLabel(text) {
            const label = text || "";
            return {
                id: this.hpoIdFromText(label),
                label: label.replace(/\s*\[HP:[0-9]+\]/, "").trim(),
            };
        },
        formatHpoTerm(term) {
            if (!term) return "";
            return term.id ? `${term.label} [${term.id}]` : term.label;
        },
        sampleHref(sampleId) {
            return `krSample.html?sample_id=${encodeURIComponent(sampleId)}`;
        },
        setSummaryLevel(level) {
            this.activeSummaryLevel = level;
            this.activeDemographicLevel = level;
            this.activePhenotypeCategory = "";
            this.clearCarrierContextSelection();
            this.syncPhenotypeSummaryToResidualGroup();
        },
        setResidualGroup(groupName) {
            this.activeResidualGroupName = groupName;
            this.syncPhenotypeSummaryToResidualGroup();
        },
        syncPhenotypeSummaryToResidualGroup() {
            const investigatorKey = this.residualGroupToInvestigatorKey(this.activeResidualGroupName);
            if (this.phenotypeRowsForInvestigator(investigatorKey).length) {
                this.activePhenotypeInvestigator = investigatorKey;
            }
        },
        residualGroupToInvestigatorKey(groupName) {
            if (!groupName || groupName === "All CRDC") return "all-investigators";
            const normalized = groupName.toLowerCase().replace(/\s+/g, "-");
            return this.investigatorOptions.some((option) => option.key === normalized)
                ? normalized
                : "all-investigators";
        },
        phenotypeRowsForInvestigator(investigatorKey) {
            const source = this.activeSummaryLevel === "variant"
                ? this.variant.variantPhenotypes
                : this.variant.phenotypes;
            return source[investigatorKey] || [];
        },
        selectPhenotypeCategory(label) {
            this.activePhenotypeCategory = label;
        },
        densityBarHeight(count) {
            const max = this.densityMax;
            return `${Math.max((count / max) * 100, count > 0 ? 8 : 0)}%`;
        },
        phenotypeCount(percent, denominator) {
            return Math.round((percent / 100) * denominator);
        },
        toggleCarrierDetail(panel) {
            this.activeCarrierDetail = this.activeCarrierDetail === panel ? "" : panel;
            if (this.activeCarrierDetail === "phenotypes") {
                const firstCategory = this.carrierPhenotypeCategories[0];
                this.activePhenotypeCategory = firstCategory ? firstCategory.category : "";
            }
        },
        togglePhenotypeCategory(label) {
            this.activePhenotypeCategory = this.activePhenotypeCategory === label ? "" : label;
        },
        setCarrierSampleSort(key) {
            this.carrierSampleSort = {
                key,
                direction: this.carrierSampleSort.key === key && this.carrierSampleSort.direction === "asc" ? "desc" : "asc",
            };
        },
        setCarrierHpoSort(key) {
            this.carrierHpoSort = {
                key,
                direction: this.carrierHpoSort.key === key && this.carrierHpoSort.direction === "asc" ? "desc" : "asc",
            };
        },
        sortIndicator(type, key) {
            const sortState = type === "sample" ? this.carrierSampleSort : this.carrierHpoSort;
            if (sortState.key !== key) return "↕";
            return sortState.direction === "asc" ? "↑" : "↓";
        },
        residualGroupLabel(group) {
            if (group.name === "All CRDC") return group.extreme;
            const count = this.activeCarrierSamples.filter((sample) => sample.group === group.name).length;
            return `${count} carrier samples`;
        },
        sortRows(rows, key, direction) {
            const ageOrder = { "0-1": 1, "2-4": 2, "5-12": 3, "13-18": 4, Adult: 5 };
            const valueForSort = (row) => {
                if (key === "id") return row.id || "";
                if (key === "topTerms") return (row.topTerms || []).join(" ");
                if (key === "age") return ageOrder[row.age] || row.age || "";
                return row[key] || "";
            };
            return [...rows].sort((left, right) => {
                const leftValue = valueForSort(left);
                const rightValue = valueForSort(right);
                const result = typeof leftValue === "number" && typeof rightValue === "number"
                    ? leftValue - rightValue
                    : String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true });
                return direction === "asc" ? result : -result;
            });
        },
    };
