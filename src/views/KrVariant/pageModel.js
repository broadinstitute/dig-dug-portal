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
        carrierSubsetOptions() {
            return [
                { key: "all", label: "All carriers" },
                { key: "proband", label: "Proband only" },
                { key: "non-proband", label: "Non-proband only" },
                { key: "affected", label: "Affected only" },
                { key: "diagnosed", label: "GenDx diagnosed only" },
            ];
        },
        carrierInvestigatorFilterOptions() {
            const groups = [...new Set(this.activeCarrierSamples.map((sample) => sample.group).filter(Boolean))].sort();
            return [
                { key: "all", label: "All investigators" },
                ...groups.map((group) => ({ key: group, label: group })),
            ];
        },
        carrierGeneFilterOptions() {
            const genes = [...new Set(
                this.activeCarrierSamples
                    .flatMap((sample) => Array.isArray(sample.variantGenes) ? sample.variantGenes : [])
                    .filter((gene) => gene && gene !== this.queryGeneLabel),
            )].sort();
            return [
                { key: "all", label: "All co-carrier genes" },
                ...genes.map((gene) => ({ key: gene, label: gene })),
            ];
        },
        activeCarrierSubsetLabel() {
            return this.carrierSubsetOptions.find((option) => option.key === this.carrierSubsetFilter)?.label || "All carriers";
        },
        activeCarrierInvestigatorLabel() {
            return this.carrierInvestigatorFilterOptions.find((option) => option.key === this.carrierInvestigatorFilter)?.label || "All investigators";
        },
        activeCarrierSexLabel() {
            return this.densitySexOptions.find((option) => option.key === this.activeCarrierSexFilter)?.label || "All";
        },
        activeCarrierGeneLabel() {
            return this.carrierGeneFilterOptions.find((option) => option.key === this.carrierGeneFilter)?.label || "All co-carrier genes";
        },
        carrierPhenotypeSummaryScopeLabel() {
            const filtered = this.filteredCarrierSamples.length;
            const total = this.activeCarrierSamples.length || Number(this.carrierReference.sampleCount) || filtered;
            return `${this.activeCarrierSubsetLabel} · ${this.activeCarrierSexLabel} · ${this.activeCarrierGeneLabel} · ${this.activeCarrierInvestigatorLabel} · ${filtered} / ${total} carriers`;
        },
        investigatorOptions() {
            const densityGroups = Object.keys(this.variant.densitySeries || {});
            if (!densityGroups.length) return [{ key: "all-investigators", label: "All investigators" }];
            return densityGroups.map((key) => ({
                key,
                label: key === "all-investigators" ? "All investigators" : key,
            }));
        },
        densityModes() {
            return [
                { key: "all", label: "All" },
                { key: "affected", label: "Affected" },
                { key: "proband", label: "Proband" },
            ];
        },
        densitySexOptions() {
            return [
                { key: "all", label: "All" },
                { key: "female", label: "Female" },
                { key: "male", label: "Male" },
                { key: "unknown", label: "n/a" },
            ];
        },
        carrierAgeOptions() {
            return [
                { key: "all-ages", label: "All ages" },
                { key: "0-4", label: "0-4" },
                { key: "5-9", label: "5-9" },
                { key: "10-17", label: "10-17" },
                { key: "0-17", label: "0-17" },
                ...Array.from({ length: 18 }, (_, age) => ({ key: String(age), label: String(age) })),
                { key: "18-plus", label: "18+" },
                { key: "unknown", label: "n/a" },
            ];
        },
        demographicAgeRangeOptions() {
            return [
                { key: "0-9", label: "0-9" },
                { key: "10-17", label: "10-17" },
                { key: "0-17-plus", label: "0-17, 18+" },
                { key: "all", label: "All ages" },
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
            const samples = this.activeSummaryLevel === "variant"
                ? this.variant.carrierSamples
                : this.variant.geneCarrierSamples;
            const cleaned = this.uniqueCarrierSamples(samples || []);
            if (this.activeSummaryLevel !== "variant") return cleaned;
            return cleaned.filter((sample) => String(sample.genotype || "").trim() !== "0/0");
        },
        filteredCarrierSamples() {
            return this.activeCarrierSamples.filter((sample) => {
                const subsetMatches = {
                    all: true,
                    proband: sample.proband === "Proband",
                    "non-proband": sample.proband !== "Proband",
                    affected: sample.affected === "Yes",
                    diagnosed: sample.diagnosed === "Yes",
                }[this.carrierSubsetFilter] ?? true;
                const investigatorMatches = this.carrierInvestigatorFilter === "all"
                    || sample.group === this.carrierInvestigatorFilter;
                const sexMatches = this.activeCarrierSexFilter === "all"
                    || this.normalizedSex(sample) === this.activeCarrierSexFilter;
                const geneMatches = this.carrierGeneFilter === "all"
                    || (Array.isArray(sample.variantGenes) && sample.variantGenes.includes(this.carrierGeneFilter));
                const ageMatches = this.carrierAgeMatches(sample);
                return subsetMatches && investigatorMatches && sexMatches && geneMatches && ageMatches;
            });
        },
        sortedCarrierSamples() {
            return this.sortRows(this.filteredCarrierSamples, this.carrierSampleSort.key, this.carrierSampleSort.direction);
        },
        visibleCarrierSamples() {
            return this.sortedCarrierSamples.slice(0, this.carrierSampleVisibleCount);
        },
        hasMoreCarrierSamples() {
            return this.visibleCarrierSamples.length < this.sortedCarrierSamples.length;
        },
        remainingCarrierSampleCount() {
            return Math.max(0, this.sortedCarrierSamples.length - this.visibleCarrierSamples.length);
        },
        nextCarrierSampleCount() {
            return Math.min(5, this.remainingCarrierSampleCount);
        },
        isCarrierFilterActive() {
            return this.carrierSubsetFilter !== "all"
                || this.carrierInvestigatorFilter !== "all"
                || this.activeCarrierSexFilter !== "all"
                || this.carrierGeneFilter !== "all"
                || this.activeCarrierAge !== "all-ages";
        },
        filteredCarrierHpoIds() {
            const ids = this.filteredCarrierSamples.flatMap((sample) => Array.isArray(sample.hpoIds) ? sample.hpoIds : []);
            return [...new Set(ids.filter(Boolean))];
        },
        carrierSampleCountDisplay() {
            const filtered = this.filteredCarrierSamples.length;
            const total = this.activeCarrierSamples.length || Number(this.carrierReference.sampleCount) || filtered;
            return this.isCarrierFilterActive ? `${filtered} / ${total}` : `${total}`;
        },
        carrierHpoCountDisplay() {
            const total = Number(this.carrierReference.hpoCount) || this.filteredCarrierHpoIds.length;
            const filtered = this.filteredCarrierHpoIds.length;
            return this.isCarrierFilterActive ? `${filtered} / ${total}` : `${total}`;
        },
        carrierProfileDenominator() {
            return this.filteredCarrierSamples.length;
        },
        carrierPhenotypeCategories() {
            return this.activeSummaryLevel === "variant"
                ? this.variant.carrierPhenotypesByCategory
                : this.variant.geneCarrierPhenotypesByCategory;
        },
        sortedCarrierPhenotypeCategories() {
            const allIds = new Set(this.activeCarrierSamples.map((sample) => sample.id));
            const filteredIds = new Set(this.filteredCarrierSamples.map((sample) => sample.id));
            const allDenominator = this.activeCarrierSamples.length;
            const subsetDenominator = this.filteredCarrierSamples.length;
            const percentFor = (count, denominator) => denominator > 0
                ? Math.max(0, Math.min(100, Math.round((count / denominator) * 100)))
                : 0;
            const categories = this.carrierPhenotypeCategories.map((category) => {
                const categoryMatchesSample = (sample) => (sample.rootCategories || []).includes(category.category);
                const supportIds = Array.isArray(category.sampleIds) ? category.sampleIds : [];
                const samplesWithRootMembership = this.activeCarrierSamples
                    .filter((sample) => Array.isArray(sample.rootCategories) && sample.rootCategories.length);
                const allCount = supportIds.length
                    ? supportIds.filter((sampleId) => allIds.has(sampleId)).length
                    : samplesWithRootMembership.length
                        ? samplesWithRootMembership.filter(categoryMatchesSample).length
                        : Number(category.support || category.count || 0);
                const filteredCount = supportIds.length
                    ? supportIds.filter((sampleId) => filteredIds.has(sampleId)).length
                    : samplesWithRootMembership.length
                        ? samplesWithRootMembership
                            .filter((sample) => filteredIds.has(sample.id))
                            .filter(categoryMatchesSample).length
                        : this.isCarrierFilterActive
                            ? 0
                            : allCount;
                return {
                    ...category,
                    allCount,
                    allPercent: percentFor(allCount, allDenominator),
                    allDenominator,
                    filteredCount,
                    filteredPercent: percentFor(filteredCount, subsetDenominator),
                    filteredDenominator: subsetDenominator,
                };
            });
            return this.sortRows(categories, this.carrierHpoSort.key, this.carrierHpoSort.direction);
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
        carrierSexSummaryItems() {
            const counts = this.filteredCarrierSamples.reduce((summary, sample) => {
                const sex = this.normalizedSex(sample);
                summary[sex] = (summary[sex] || 0) + 1;
                return summary;
            }, { female: 0, male: 0, unknown: 0 });
            const total = (counts.female || 0) + (counts.male || 0) + (counts.unknown || 0);
            return [
                { key: "all", label: "All", count: total },
                { key: "female", label: "Female", count: counts.female || 0 },
                { key: "male", label: "Male", count: counts.male || 0 },
                { key: "unknown", label: "n/a", count: counts.unknown || 0 },
            ];
        },
        carrierSummarySexFilterActive() {
            return this.activeCarrierSummarySex !== "all";
        },
        carrierAgeSummaryBins() {
            const counts = this.filteredCarrierSamples.reduce((summary, sample) => {
                const age = this.ageAtEnrollmentValue(sample);
                const key = age === null ? "n/a" : String(Math.floor(age));
                const sex = this.normalizedSex(sample);
                if (!summary[key]) summary[key] = { female: 0, male: 0, unknown: 0 };
                summary[key][sex] = (summary[key][sex] || 0) + 1;
                return summary;
            }, {});
            const numericKeys = Object.keys(counts)
                .filter((key) => key !== "n/a")
                .map((key) => Number(key))
                .filter((value) => Number.isFinite(value))
                .sort((left, right) => left - right);
            const bins = [
                ...numericKeys.map((age) => ({
                    label: String(age),
                    counts: counts[String(age)] || { female: 0, male: 0, unknown: 0 },
                })),
                {
                    label: "n/a",
                    counts: counts["n/a"] || { female: 0, male: 0, unknown: 0 },
                },
            ].filter((bin) => {
                const total = Number(bin.counts.female || 0) + Number(bin.counts.male || 0) + Number(bin.counts.unknown || 0);
                return total > 0 || bin.label === "n/a";
            });
            const selectedCount = (bin) => this.activeCarrierSummarySex === "all"
                ? Number(bin.counts.female || 0) + Number(bin.counts.male || 0) + Number(bin.counts.unknown || 0)
                : Number(bin.counts[this.activeCarrierSummarySex] || 0);
            const maxCount = this.activeCarrierSummarySex === "all"
                ? Math.max(1, ...bins.flatMap((bin) => ["female", "male", "unknown"].map((sex) => Number(bin.counts[sex] || 0))))
                : Math.max(1, ...bins.map(selectedCount));
            return bins.map((bin) => ({
                ...bin,
                count: selectedCount(bin),
                segments: ["female", "male", "unknown"].map((sex) => {
                    const count = Number(bin.counts[sex] || 0);
                    const visibleCount = this.activeCarrierSummarySex === "all" || this.activeCarrierSummarySex === sex
                        ? count
                        : 0;
                    return {
                        key: sex,
                        count,
                        visibleCount,
                        height: `${Math.max((visibleCount / maxCount) * 58, visibleCount ? 8 : 0)}px`,
                    };
                }).filter((segment) => segment.count > 0 || this.activeCarrierSummarySex === segment.key),
                height: `${Math.max((selectedCount(bin) / maxCount) * 58, selectedCount(bin) ? 8 : 2)}px`,
            }));
        },
        carrierInvestigatorSummaryRows() {
            const denominator = this.filteredCarrierSamples.length;
            const counts = this.filteredCarrierSamples.reduce((summary, sample) => {
                const label = sample.group || "Investigator NA";
                summary[label] = (summary[label] || 0) + 1;
                return summary;
            }, {});
            return Object.entries(counts)
                .map(([label, count]) => ({
                    label,
                    count,
                    percent: denominator > 0 ? Math.round((count / denominator) * 100) : 0,
                }))
                .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
        },
        visibleCarrierInvestigatorSummaryRows() {
            return this.carrierInvestigatorSummaryExpanded
                ? this.carrierInvestigatorSummaryRows
                : this.carrierInvestigatorSummaryRows.slice(0, 5);
        },
        hiddenCarrierInvestigatorSummaryCount() {
            return Math.max(0, this.carrierInvestigatorSummaryRows.length - this.visibleCarrierInvestigatorSummaryRows.length);
        },
        currentCarrierGeneSet() {
            return new Set([
                this.queryGeneLabel,
                ...this.filteredCarrierSamples.flatMap((sample) => Array.isArray(sample.variantGenes) ? sample.variantGenes : []),
            ].filter(Boolean));
        },
        coCarrierGeneRows() {
            const queryGene = this.queryGeneLabel;
            const denominator = this.filteredCarrierSamples.length;
            if (!denominator) return [];
            const byGene = new Map();
            this.filteredCarrierSamples.forEach((sample) => {
                const genes = [...new Set(Array.isArray(sample.variantGenes) ? sample.variantGenes : [])]
                    .filter((gene) => gene && gene !== queryGene);
                genes.forEach((gene) => {
                    if (!byGene.has(gene)) byGene.set(gene, { gene, sampleIds: new Set(), categories: new Map() });
                    const row = byGene.get(gene);
                    row.sampleIds.add(sample.id);
                    (sample.rootCategories || []).forEach((category) => {
                        row.categories.set(category, (row.categories.get(category) || 0) + 1);
                    });
                });
            });
            return [...byGene.values()]
                .map((row) => {
                    const count = row.sampleIds.size;
                    const topCategories = [...row.categories.entries()]
                        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
                        .slice(0, 2)
                        .map(([category, categoryCount]) => `${this.termName(category)} ${categoryCount}`);
                    return {
                        gene: row.gene,
                        count,
                        denominator,
                        percent: Math.round((count / denominator) * 100),
                        phenotypeSummary: topCategories.length ? topCategories.join(" · ") : "No HPO category in fixture",
                        diseaseReference: this.coCarrierGeneReference(row.gene).diseaseReference,
                        diseaseReferenceHref: this.coCarrierGeneReference(row.gene).diseaseReferenceHref,
                        secondaryAnnotation: this.coCarrierGeneReference(row.gene).secondaryAnnotation,
                        sampleIds: [...row.sampleIds].sort(),
                    };
                })
                .sort((left, right) => right.count - left.count || left.gene.localeCompare(right.gene));
        },
        sortedCoCarrierGeneRows() {
            return this.sortRows(this.coCarrierGeneRows, this.coCarrierGeneSort.key, this.coCarrierGeneSort.direction);
        },
        visibleCoCarrierGeneRows() {
            return this.sortedCoCarrierGeneRows.slice(0, this.coCarrierGeneVisibleCount);
        },
        hasMoreCoCarrierGeneRows() {
            return this.visibleCoCarrierGeneRows.length < this.sortedCoCarrierGeneRows.length;
        },
        remainingCoCarrierGeneCount() {
            return Math.max(0, this.sortedCoCarrierGeneRows.length - this.visibleCoCarrierGeneRows.length);
        },
        nextCoCarrierGeneCount() {
            return Math.min(5, this.remainingCoCarrierGeneCount);
        },
        activeCoCarrierGeneSamples() {
            if (!this.activeCoCarrierGene) return [];
            const activeRow = this.coCarrierGeneRows.find((row) => row.gene === this.activeCoCarrierGene);
            if (!activeRow) return [];
            const sampleIds = new Set(activeRow.sampleIds || []);
            return this.sortedCarrierSamples.filter((sample) => sampleIds.has(sample.id));
        },
        visibleActiveCoCarrierGeneSamples() {
            return this.activeCoCarrierGeneSamples.slice(0, this.coCarrierSampleVisibleCount);
        },
        hasMoreActiveCoCarrierGeneSamples() {
            return this.visibleActiveCoCarrierGeneSamples.length < this.activeCoCarrierGeneSamples.length;
        },
        nextCoCarrierSampleCount() {
            return Math.min(5, Math.max(0, this.activeCoCarrierGeneSamples.length - this.visibleActiveCoCarrierGeneSamples.length));
        },
        demographicPanelScope() {
            return this.variant.summaryScopes[this.activeDemographicLevel];
        },
        demographicPanelAgeBins() {
            return this.ageAtEnrollmentHistogram(this.demographicPanelSamples, this.activeDemographicAgeRange);
        },
        demographicPanelAgeUnknown() {
            const unknownBin = this.demographicPanelAgeBins.find((bin) => bin.key === "unknown");
            return Number(unknownBin?.total || 0);
        },
        demographicPanelSexUnknown() {
            const scope = this.demographicPanelScope || {};
            const all = Number(scope.all || 0);
            const knownSex = Number(scope.female || 0) + Number(scope.male || 0);
            return Math.max(0, all - knownSex);
        },
        activeDensityGroup() {
            const length = this.densitySeriesLength;
            const focusIndex = this.queryDensityIndex;
            const counts = this.queryDensityCountsForCurrentFilters;
            return this.densityModes.reduce((group, mode) => {
                const bins = Array.from({ length }, () => 0);
                bins[focusIndex] = counts[mode.key] || 0;
                group[mode.key] = bins;
                return group;
            }, {});
        },
        densitySeriesLength() {
            const allBins = this.variant.densitySeries?.["all-investigators"]?.all;
            return Array.isArray(allBins) && allBins.length ? allBins.length : 51;
        },
        queryDensityIndex() {
            return Math.floor(this.densitySeriesLength / 2);
        },
        queryDensitySamples() {
            return this.uniqueCarrierSamples(this.variant.carrierSamples || [])
                .filter((sample) => String(sample.genotype || "").trim() !== "0/0")
                .filter((sample) => {
                    const investigatorMatches = this.activeInvestigator === "all-investigators"
                        || sample.group === this.activeInvestigator
                        || String(sample.group || "").toLowerCase().replace(/\s+/g, "-") === this.activeInvestigator;
                    const sexMatches = this.activeDensitySex === "all"
                        || this.normalizedSex(sample) === this.activeDensitySex;
                    return investigatorMatches && sexMatches && this.carrierAgeMatches(sample);
                });
        },
        queryDensityCountsForCurrentFilters() {
            const samples = this.queryDensitySamples;
            return {
                all: samples.length,
                affected: samples.filter((sample) => sample.affected === "Yes").length,
                proband: samples.filter((sample) => sample.proband === "Proband").length,
            };
        },
        queriedVariantCarrierCountLabel() {
            const count = this.queryDensityCountsForCurrentFilters[this.activeDensity] || 0;
            const suffix = this.activeInvestigator === "all-investigators"
                && this.activeCarrierAge === "all-ages"
                && this.activeDensitySex === "all"
                ? "at queried variant"
                : "at queried variant in current density filter";
            return `${count} carriers ${suffix}`;
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
            const visibleCounts = this.renderedDensitySeries.flatMap((series) => series.bins || []);
            const maxCount = Math.max(1, ...visibleCounts.map((count) => Number(count) || 0));
            return Math.max(5, Math.ceil(maxCount / 5) * 5);
        },
        densityYAxisLabels() {
            const midpoint = Math.round((this.densityMax / 2) / 5) * 5;
            return [...new Set([this.densityMax, midpoint, 0])];
        },
        phenotypeRows() {
            const rowsFromCategories = this.sortedCarrierPhenotypeCategories
                .filter((category) => {
                    const label = String(category.category || "").toLowerCase();
                    if (label.includes("no carrier hpo terms")) return false;
                    return Number(category.allCount || 0) > 0 || Number(category.filteredCount || 0) > 0;
                })
                .slice(0, this.carrierPhenotypeVisibleCount)
                .map((category) => ({
                label: category.category,
                all: category.allPercent,
                allCount: category.allCount,
                allDenominator: category.allDenominator,
                subset: category.filteredPercent,
                subsetCount: category.filteredCount,
                subsetDenominator: category.filteredDenominator,
            }));
            return rowsFromCategories;
        },
        hasMoreCarrierPhenotypes() {
            return this.sortedCarrierPhenotypeCategories
                .filter((category) => {
                    const label = String(category.category || "").toLowerCase();
                    if (label.includes("no carrier hpo terms")) return false;
                    return Number(category.allCount || 0) > 0 || Number(category.filteredCount || 0) > 0;
                }).length > this.phenotypeRows.length;
        },
        nextCarrierPhenotypeCount() {
            const informativeCount = this.sortedCarrierPhenotypeCategories
                .filter((category) => {
                    const label = String(category.category || "").toLowerCase();
                    if (label.includes("no carrier hpo terms")) return false;
                    return Number(category.allCount || 0) > 0 || Number(category.filteredCount || 0) > 0;
                }).length;
            return Math.min(5, Math.max(0, informativeCount - this.phenotypeRows.length));
        },
        activePhenotypeDetails() {
            const selectedCategory = this.sortedCarrierPhenotypeCategories.find((category) => category.category === this.activePhenotypeCategory);
            if (selectedCategory?.terms?.length) {
                return selectedCategory.terms.slice(0, 12).map((label) => {
                    const hpoId = this.hpoIdFromText(label);
                    const supportSamples = hpoId
                        ? this.filteredCarrierSamples.filter((sample) => (sample.hpoIds || []).includes(hpoId))
                        : [];
                    const supportCount = supportSamples.length;
                    const sampleIds = supportSamples.map((sample) => sample.id).sort();
                    return {
                        label,
                        supportCount,
                        supportLabel: supportCount ? `${supportCount} / ${this.carrierProfileDenominator}` : "-",
                        sampleIds,
                        samplePreview: sampleIds.slice(0, 5),
                        hiddenSampleCount: Math.max(0, sampleIds.length - 5),
                        shared: supportCount > 0,
                    };
                });
            }
            return this.variant.phenotypeDetails[this.activePhenotypeCategory] || [];
        },
        demographicAgeBins() {
            return this.ageAtEnrollmentHistogram(this.activeCarrierSamples);
        },
        demographicPanelSamples() {
            const samples = this.activeDemographicLevel === "variant"
                ? this.variant.carrierSamples
                : this.variant.geneCarrierSamples;
            return this.samplesForDemographicMode(samples || [], this.activeDemographic);
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
        uniqueCarrierSamples(samples) {
            const byId = new Map();
            (samples || []).forEach((sample) => {
                if (!sample?.id) return;
                if (!byId.has(sample.id)) {
                    byId.set(sample.id, {
                        ...sample,
                        variantGenes: [...new Set(Array.isArray(sample.variantGenes) ? sample.variantGenes : [])],
                        hpoIds: [...new Set(Array.isArray(sample.hpoIds) ? sample.hpoIds : [])],
                        rootCategories: [...new Set(Array.isArray(sample.rootCategories) ? sample.rootCategories : [])],
                    });
                    return;
                }
                const existing = byId.get(sample.id);
                byId.set(sample.id, {
                    ...existing,
                    ...sample,
                    variantGenes: [...new Set([
                        ...(existing.variantGenes || []),
                        ...(Array.isArray(sample.variantGenes) ? sample.variantGenes : []),
                    ])],
                    hpoIds: [...new Set([
                        ...(existing.hpoIds || []),
                        ...(Array.isArray(sample.hpoIds) ? sample.hpoIds : []),
                    ])],
                    rootCategories: [...new Set([
                        ...(existing.rootCategories || []),
                        ...(Array.isArray(sample.rootCategories) ? sample.rootCategories : []),
                    ])],
                });
            });
            return [...byId.values()];
        },
        normalizedSex(sample) {
            const value = String(sample?.sex || sample?.gender || "").trim().toLowerCase();
            if (value === "female" || value === "f") return "female";
            if (value === "male" || value === "m") return "male";
            return "unknown";
        },
        carrierSexLabel(sample) {
            const sex = this.normalizedSex(sample);
            if (sex === "female") return "Female";
            if (sex === "male") return "Male";
            return "-";
        },
        coCarrierGeneReference(gene) {
            const reference = this.variant.coCarrierGeneReferences?.[gene] || {};
            const primaryReference = Array.isArray(reference.diseaseReferences) && reference.diseaseReferences.length
                ? reference.diseaseReferences[0]
                : null;
            const diseaseGenes = Array.isArray(primaryReference?.diseaseGenes) ? primaryReference.diseaseGenes : [];
            const overlapGenes = diseaseGenes.filter((item) => this.currentCarrierGeneSet.has(item));
            const overlapLabel = primaryReference && diseaseGenes.length
                ? `${overlapGenes.length}/${Number(primaryReference.linkedGeneCount) || diseaseGenes.length} genes`
                : "";
            const diseaseLabel = primaryReference
                ? [primaryReference.id, primaryReference.name, overlapLabel].filter(Boolean).join(" · ")
                : reference.diseaseReference;
            return {
                diseaseReference: diseaseLabel || "-",
                diseaseReferenceHref: primaryReference ? this.diseaseReferenceHref(primaryReference) : "",
                secondaryAnnotation: reference.secondaryAnnotation || "-",
            };
        },
        carrierSampleHpoCount(sample) {
            return new Set(Array.isArray(sample?.hpoIds) ? sample.hpoIds.filter(Boolean) : []).size;
        },
        carrierSampleGeneCount(sample) {
            if (Number.isFinite(Number(sample?.variantGeneCount))) return Number(sample.variantGeneCount);
            return new Set(Array.isArray(sample?.variantGenes) ? sample.variantGenes.filter(Boolean) : []).size;
        },
        termName(label) {
            return String(label || "").replace(/\s*\[HP:[0-9]+\]/, "").trim();
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
        ageAtEnrollmentValue(row) {
            const rawValue = row?.ageAtEnrollment;
            if (rawValue === null || rawValue === undefined || rawValue === "" || rawValue === "-") return null;
            const value = Number(rawValue);
            return Number.isFinite(value) ? value : null;
        },
        ageAtEnrollmentLabel(row) {
            const value = this.ageAtEnrollmentValue(row);
            if (value !== null) return String(value);
            const label = String(row?.ageAtEnrollmentLabel || "").trim();
            if (label && label !== "-") return label.replace(/\s*years?$/i, "");
            return "-";
        },
        ageAtEnrollmentSortValue(row) {
            const value = this.ageAtEnrollmentValue(row);
            return value !== null ? value : Number.MAX_SAFE_INTEGER;
        },
        ageAtEnrollmentBucket(row) {
            const value = this.ageAtEnrollmentValue(row);
            if (value === null) return "unknown";
            if (value <= 17) return String(Math.floor(value));
            return "18-plus";
        },
        carrierAgeMatches(sample) {
            if (this.activeCarrierAge === "all-ages") return true;
            const value = this.ageAtEnrollmentValue(sample);
            if (this.activeCarrierAge === "unknown") return value === null;
            if (value === null) return false;
            if (this.activeCarrierAge === "0-4") return value >= 0 && value <= 4;
            if (this.activeCarrierAge === "5-9") return value >= 5 && value <= 9;
            if (this.activeCarrierAge === "10-17") return value >= 10 && value <= 17;
            if (this.activeCarrierAge === "0-17") return value >= 0 && value <= 17;
            if (this.activeCarrierAge === "18-plus") return value >= 18;
            return this.ageAtEnrollmentBucket(sample) === this.activeCarrierAge;
        },
        samplesForDemographicMode(samples, mode) {
            if (mode === "affected") return samples.filter((sample) => sample.affected === "Yes");
            if (mode === "proband") return samples.filter((sample) => sample.proband === "Proband");
            return samples;
        },
        ageAtEnrollmentHistogram(samples, range = "0-17-plus") {
            const values = (samples || [])
                .map((sample) => this.ageAtEnrollmentValue(sample))
                .filter((value) => value !== null && value >= 0);
            const integerAge = (value) => Math.floor(value);
            const makeAgeBins = (start, end) => Array.from({ length: end - start + 1 }, (_, index) => {
                const age = start + index;
                return { key: String(age), label: String(age), min: age, max: age };
            });
            let binDefinitions;
            if (range === "0-9") {
                binDefinitions = makeAgeBins(0, 9);
            } else if (range === "10-17") {
                binDefinitions = makeAgeBins(10, 17);
            } else if (range === "all") {
                const maxAge = values.length ? Math.max(...values.map(integerAge)) : 17;
                binDefinitions = makeAgeBins(0, Math.max(17, maxAge));
            } else {
                binDefinitions = [
                    ...makeAgeBins(0, 17),
                    { key: "18-plus", label: "18+", min: 18, max: Number.POSITIVE_INFINITY },
                ];
            }
            binDefinitions = [
                ...binDefinitions,
                { key: "unknown", label: "Unknown", unknown: true },
            ];
            const bins = binDefinitions.map((bin) => ({ ...bin, female: 0, male: 0, unknownSex: 0 }));
            const byKey = new Map(bins.map((bin) => [bin.key, bin]));
            (samples || []).forEach((sample) => {
                const value = this.ageAtEnrollmentValue(sample);
                let bin;
                if (value === null) {
                    bin = byKey.get("unknown");
                } else {
                    const age = integerAge(value);
                    bin = bins.find((candidate) => !candidate.unknown && age >= candidate.min && age <= candidate.max);
                }
                if (!bin) return;
                const sex = String(sample.sex || "").trim().toLowerCase();
                if (sex === "female" || sex === "f") {
                    bin.female += 1;
                } else if (sex === "male" || sex === "m") {
                    bin.male += 1;
                } else {
                    bin.unknownSex += 1;
                }
            });
            const populatedBins = bins.filter((bin) => {
                if (bin.key !== "unknown") return true;
                return bin.female + bin.male + bin.unknownSex > 0;
            });
            return this.withAgeBinHeights(populatedBins);
        },
        hasAgeBinCounts(bins) {
            return (bins || []).some((bin) => (
                Number(bin.female || 0) + Number(bin.male || 0) + Number(bin.unknownSex || 0)
            ) > 0);
        },
        hasAgeAtEnrollmentRows(samples) {
            return (samples || []).some((sample) => {
                const value = this.ageAtEnrollmentValue(sample);
                return value !== null && value >= 0;
            });
        },
        withAgeBinHeights(bins) {
            const binsWithTotals = (bins || []).map((bin) => {
                const female = Number(bin.female || 0);
                const male = Number(bin.male || 0);
                const unknownSex = Number(bin.unknownSex || 0);
                return {
                    ...bin,
                    female,
                    male,
                    unknownSex,
                    total: female + male + unknownSex,
                };
            });
            const maxCount = Math.max(
                1,
                ...binsWithTotals.map((bin) => bin.total),
            );
            return binsWithTotals.map((bin) => ({
                ...bin,
                femaleHeight: `${Math.max((bin.female / maxCount) * 70, bin.female ? 12 : 2)}px`,
                maleHeight: `${Math.max((bin.male / maxCount) * 70, bin.male ? 12 : 2)}px`,
                unknownHeight: `${Math.max((bin.unknownSex / maxCount) * 70, bin.unknownSex ? 12 : 2)}px`,
                totalHeight: `${Math.max((bin.total / maxCount) * 70, bin.total ? 12 : 2)}px`,
            }));
        },
        reshapeGeneratedAgeBinsForRange(bins, range) {
            if (!Array.isArray(bins) || !bins.length) return [];
            const normalized = bins.map((bin) => ({
                label: bin.label,
                female: Number(bin.female || 0),
                male: Number(bin.male || 0),
                unknownSex: 0,
            }));
            if (range === "all" || range === "0-17-plus") return normalized;
            const allowed = {
                "0-9": ["0-1", "2-4", "0-4", "5-9", "5-12"],
                "10-17": ["10-17", "13-18"],
            }[range] || [];
            return normalized.filter((bin) => allowed.includes(bin.label));
        },
        generatedDemographicBinsForLevel(level, mode = "all") {
            if (mode !== "all") return [];
            const source = level === "variant" ? this.variant.variantDemographics : this.variant.demographics;
            return Array.isArray(source?.all) ? source.all : [];
        },
        variantEvidenceHref(item) {
            if (!item) return "";
            const label = String(item.label || "").toLowerCase();
            const variantId = this.variant.query.rawId
                || this.variant.variantEvidence?.find((entry) => entry.label === "Search Variant")?.value
                || this.variant.query.label
                || "";
            if (label === "clinvar") return this.clinVarHref(variantId);
            if (label === "gnomad af") return this.gnomadHref(variantId);
            return "";
        },
        clinVarHref(variantId) {
            const term = this.normalizedVariantSearchTerm(variantId);
            return term ? `https://www.ncbi.nlm.nih.gov/clinvar/?term=${encodeURIComponent(term)}` : "";
        },
        gnomadHref(variantId) {
            const normalized = this.normalizedVariantForGnomad(variantId);
            return normalized ? `https://gnomad.broadinstitute.org/variant/${encodeURIComponent(normalized)}?dataset=gnomad_r4` : "";
        },
        diseaseReferenceDisplay(reference) {
            if (!reference) return "";
            return reference.label || reference.name || reference.id || reference.rawId || "";
        },
        diseaseReferenceHref(reference) {
            const id = String(reference?.id || reference?.rawId || reference?.label || reference?.name || "").trim();
            const orphanet = id.match(/(?:ORPHA:|Orpha[_ ]?)([0-9]+)/i);
            if (orphanet) return `https://www.orpha.net/en/disease/detail/${orphanet[1]}`;
            const omim = id.match(/(?:OMIM:|OMIM[_ ]?)([0-9]+)/i);
            if (omim) return `https://www.omim.org/entry/${omim[1]}`;
            const mondo = id.match(/MONDO:([0-9]+)/i);
            if (mondo) return `https://monarchinitiative.org/MONDO:${mondo[1]}`;
            const decipher = id.match(/DECIPHER:([0-9]+)/i);
            if (decipher) return `https://www.deciphergenomics.org/syndrome/${decipher[1]}`;
            return "";
        },
        normalizedVariantSearchTerm(variantId) {
            return String(variantId || "")
                .replace(/^chr/i, "")
                .replace(/,/g, "")
                .trim();
        },
        normalizedVariantForGnomad(variantId) {
            const parts = this.normalizedVariantSearchTerm(variantId).split(":");
            if (parts.length < 4) return "";
            return `${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}`;
        },
        sampleHref(sampleId) {
            return `krSample.html?sample_id=${encodeURIComponent(sampleId)}`;
        },
        variantHref(query) {
            return `krVariant.html?query=${encodeURIComponent(query)}`;
        },
        setSummaryLevel(level) {
            this.activeSummaryLevel = level;
            this.activeDemographicLevel = level;
            this.activePhenotypeCategory = "";
            this.carrierGeneFilter = "all";
            if (level === "gene" && this.carrierSampleSort.key === "genotype") {
                this.carrierSampleSort = { key: "id", direction: "asc" };
            }
            this.clearCarrierContextSelection();
            this.resetCarrierSampleLimit();
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
        setCarrierProfileTab(tab) {
            this.activeCarrierProfileTab = tab;
            if (tab === "phenotype" && !this.activeCarrierDetail) {
                this.activeCarrierDetail = "phenotypes";
            }
            if (tab === "phenotype" && this.activeCarrierDetail === "phenotypes") {
                const firstCategory = this.carrierPhenotypeCategories[0];
                this.activePhenotypeCategory = firstCategory ? firstCategory.category : "";
            }
        },
        togglePhenotypeCategory(label) {
            this.activePhenotypeCategory = this.activePhenotypeCategory === label ? "" : label;
            this.activePhenotypeDetailLabel = "";
        },
        togglePhenotypeDetailSamples(label) {
            this.activePhenotypeDetailLabel = this.activePhenotypeDetailLabel === label ? "" : label;
        },
        setCarrierSampleSort(key) {
            this.carrierSampleSort = {
                key,
                direction: this.carrierSampleSort.key === key && this.carrierSampleSort.direction === "asc" ? "desc" : "asc",
            };
            this.resetCarrierSampleLimit();
        },
        setCarrierHpoSort(key) {
            this.carrierHpoSort = {
                key,
                direction: this.carrierHpoSort.key === key && this.carrierHpoSort.direction === "asc" ? "desc" : "asc",
            };
        },
        setCoCarrierGeneSort(key) {
            this.coCarrierGeneSort = {
                key,
                direction: this.coCarrierGeneSort.key === key && this.coCarrierGeneSort.direction === "asc" ? "desc" : "asc",
            };
            this.resetCoCarrierGeneLimit();
        },
        resetCarrierFilters() {
            this.carrierSubsetFilter = "all";
            this.carrierInvestigatorFilter = "all";
            this.activeCarrierSexFilter = "all";
            this.carrierGeneFilter = "all";
            this.activeCarrierAge = "all-ages";
            this.activePhenotypeInvestigator = "all-investigators";
            this.resetCarrierSampleLimit();
        },
        sortIndicator(type, key) {
            const sortState = type === "sample"
                ? this.carrierSampleSort
                : type === "coGene"
                    ? this.coCarrierGeneSort
                    : this.carrierHpoSort;
            if (sortState.key !== key) return "↕";
            return sortState.direction === "asc" ? "↑" : "↓";
        },
        residualGroupLabel(group) {
            if (group.name === "All CRDC") return group.extreme;
            const count = this.activeCarrierSamples.filter((sample) => sample.group === group.name).length;
            return `${count} carrier samples`;
        },
        showMoreCarrierSamples() {
            this.carrierSampleVisibleCount = Math.min(this.sortedCarrierSamples.length, this.carrierSampleVisibleCount + 5);
        },
        resetCarrierSampleLimit() {
            this.carrierSampleVisibleCount = 5;
            this.carrierInvestigatorSummaryExpanded = false;
            this.carrierPhenotypeVisibleCount = 5;
            this.activePhenotypeDetailLabel = "";
            this.resetCoCarrierGeneLimit();
            if (this.carrierInvestigatorFilter !== "all") {
                this.activePhenotypeInvestigator = this.carrierInvestigatorFilter;
            }
        },
        setCarrierSummarySex(sex) {
            this.activeCarrierSummarySex = this.activeCarrierSummarySex === sex ? "all" : sex;
        },
        showMoreCarrierPhenotypes() {
            this.carrierPhenotypeVisibleCount += 5;
        },
        showMoreCoCarrierGeneRows() {
            this.coCarrierGeneVisibleCount = Math.min(this.sortedCoCarrierGeneRows.length, this.coCarrierGeneVisibleCount + 5);
        },
        resetCoCarrierGeneLimit() {
            this.coCarrierGeneVisibleCount = 5;
            this.activeCoCarrierGene = "";
            this.coCarrierSampleVisibleCount = 5;
        },
        toggleCoCarrierGeneSamples(gene) {
            this.activeCoCarrierGene = this.activeCoCarrierGene === gene ? "" : gene;
            this.coCarrierSampleVisibleCount = 5;
        },
        showMoreCoCarrierGeneSamples() {
            this.coCarrierSampleVisibleCount = Math.min(this.activeCoCarrierGeneSamples.length, this.coCarrierSampleVisibleCount + 5);
        },
        toggleCarrierInvestigatorSummary() {
            this.carrierInvestigatorSummaryExpanded = !this.carrierInvestigatorSummaryExpanded;
        },
        sortRows(rows, key, direction) {
            const valueForSort = (row) => {
                if (key === "id") return row.id || "";
                if (key === "topTerms") return (row.topTerms || []).join(" ");
                if (key === "count") return Number(row.filteredCount ?? row.count ?? 0);
                if (key === "age") return this.ageAtEnrollmentSortValue(row);
                if (key === "sex") return this.carrierSexLabel(row);
                if (key === "genotype") return row.genotype || "";
                if (key === "hpoCount") return this.carrierSampleHpoCount(row);
                if (key === "geneCount") return this.carrierSampleGeneCount(row);
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
