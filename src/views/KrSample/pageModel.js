import { hasClinicalFocus } from "../KrClinicalFocus/focusComparison";
import { clearClinicalFocus } from "../KrClinicalFocus/focusStore";

export const sampleComputed = {
        tabs() {
            return [
                { id: "overview", label: "Overview" },
                { id: "phenotype", label: "Similar by phenotype" },
                { id: "genotype", label: "Similar by genotype" },
                { id: "disease", label: "Disease profile matches" },
                { id: "genes", label: "Gene / variant evidence" },
            ];
        },
        overviewCardTabs() {
            return [
                { id: "summary", label: "Sample overview" },
                { id: "phenotype", label: "Phenotype profile" },
            ];
        },
        allInvestigatorOptions() {
            return [...this.sample.groupAffinityTop, ...this.sample.groupAffinityOther];
        },
        selectedInvestigatorAffinity() {
            return this.allInvestigatorOptions.find((group) => group.label === this.selectedInvestigatorGroup);
        },
        hasActiveContext() {
            return hasClinicalFocus(this.clinicalFocus);
        },
        compactContextLabel() {
            if (!this.hasActiveContext) return "";
            const contextId = this.clinicalFocus.orphaId || this.clinicalFocus.sourceId || "";
            return [this.clinicalFocus.label, contextId].filter(Boolean).join(" · ");
        },
        topAnswers() {
            const metricByLabel = (needle) => this.sample.positionMetrics.find((metric) => metric.label.toLowerCase().includes(needle));
            const closest = metricByLabel("closest");
            const group = metricByLabel("investigator");
            const disease = metricByLabel("disease profile");
            return [
                {
                    label: "Closest phenotype profile match",
                    value: closest ? closest.value : "-",
                },
                {
                    label: "Group affinity",
                    value: group ? group.value : "-",
                },
                {
                    label: "Disease profile reference",
                    value: disease ? disease.value : "-",
                },
            ];
        },
        overviewItems() {
            return [
                { label: "Proband", value: this.sample.probandStatus },
                { label: "Affected", value: this.sample.affectedStatus },
                { label: "Sex", value: this.sample.sex },
                { label: "Age at enrollment", value: this.displayAgeAtEnrollment },
                { label: "Investigator", value: this.sample.investigator },
                { label: "Total HPO term count", value: this.sample.overviewHpoTermCount },
                { label: "Dominant HPO group", value: this.sample.overviewDominantHpoGroup },
                { label: "Rare coding variant carrier genes", value: this.sample.rareCodingGenes },
            ];
        },
        contextComparisonItems() {
            return [
                { label: "Context HPO term count", value: this.sample.contextComparison.hpoTermCount },
                { label: "Context dominant HPO group", value: this.sample.contextComparison.dominantHpoGroup },
                { label: "Sample-context HPO overlap", value: this.sample.contextComparison.overlap },
                { label: "Dominant overlap group", value: this.sample.contextComparison.dominantOverlapGroup },
            ];
        },
        gendxPanelTitle() {
            return "GenDx panel";
        },
        gendxRows() {
            return [
                { label: "Status", value: this.sample.gendx.status },
                { label: "Gene", value: this.sample.gendx.gene },
                { label: "Variant", value: this.sample.gendx.variantId, href: this.variantHref(this.sample.gendx.variantId) },
                { label: "Pathogenicity", value: this.sample.gendx.pathogenicity },
            ];
        },
        candidateGenesForDisplay() {
            return (this.sample.candidateGenes || []).map((gene) => {
                const gendxSupport = String(gene.gendxSupport || "").trim();
                const panelAppGreen = /panelapp\s+green/i.test(gendxSupport);
                const notPanelAppGreen = /not\s+panelapp\s+green/i.test(gendxSupport);
                const additionalAnnotations = [];
                if (panelAppGreen && !notPanelAppGreen) {
                    additionalAnnotations.push({
                        source: "PanelApp",
                        value: "Green annotation",
                        info: "PanelApp Green means this gene is listed as high confidence for a relevant panel. It is a secondary annotation, not a GenDx diagnosis, filter, exclusion criterion, or causal-strength label.",
                    });
                }
                return {
                    ...gene,
                    gendxDisplay: panelAppGreen || notPanelAppGreen
                        ? "No GenDx diagnostic match in fixture"
                        : (gendxSupport || "Not available"),
                    additionalAnnotations,
                };
            });
        },
        sampleVariantQueryOptions() {
            const rows = [];
            const pushVariant = (variant, gene, sourceLabel) => {
                if (!variant || !variant.variantId || variant.variantId === "-") return;
                const isGendx = /^GenDx/i.test(sourceLabel || "");
                rows.push({
                    gene: gene || variant.gene || this.sample.gendx.gene || "-",
                    variantId: variant.variantId,
                    consequence: variant.consequence || "-",
                    pathogenicity: variant.clinvar || variant.pathogenicity || "-",
                    sourceLabel,
                    isGendx,
                });
            };

            pushVariant({
                variantId: this.sample.gendx.variantId,
                consequence: this.sample.gendx.consequence,
                pathogenicity: this.sample.gendx.pathogenicity,
            }, this.sample.gendx.gene, this.sample.gendx.resultCount > 0 ? "GenDx reported" : "Default query");

            (this.sample.sampleVariantOptions || []).forEach((variant) => {
                pushVariant(variant, variant.gene, variant.sourceLabel || "Sample rare coding variant");
            });

            (this.sample.geneEvidence || this.sample.candidateGenes || []).forEach((gene) => {
                (gene.variants || []).forEach((variant) => pushVariant(variant, gene.gene, "Sample rare coding variant"));
            });

            const seen = new Set();
            return rows.filter((row) => {
                const key = `${row.gene}:${row.variantId}:${row.consequence}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        },
        hasGenDxVariantQuery() {
            return this.sampleVariantQueryOptions.some((option) => option.isGendx);
        },
        sampleVariantGeneOptions() {
            return [...new Set(this.sampleVariantQueryOptions.map((row) => row.gene).filter(Boolean))];
        },
        activeGenotypeQueryGenes() {
            return [...new Set((this.variantQueryRows || [])
                .map((row) => row.gene)
                .filter((gene) => gene && gene !== "-"))];
        },
        activeGenotypeQueryVariants() {
            return [...new Set((this.variantQueryRows || [])
                .map((row) => row.variantId)
                .filter((variantId) => variantId && variantId !== "-"))];
        },
        genotypeGroupsForDisplay() {
            const sourceGroups = this.sample.genotypeGroups || [];
            const selectedGenes = this.activeGenotypeQueryGenes.length
                ? this.activeGenotypeQueryGenes
                : this.sampleVariantGeneOptions.slice(0, 1);
            const selectedVariants = this.activeGenotypeQueryVariants;
            return sourceGroups.map((group) => {
                if (group.label === "Same gene") {
                    const rows = this.sameGeneRowsForSelectedGenes(selectedGenes);
                    return {
                        ...group,
                        summary: selectedGenes.length
                            ? `Same-gene carriers for ${selectedGenes.join(", ")}`
                            : "Same-gene carriers for selected gene",
                        rows,
                    };
                }
                if (group.label === "Same variant") {
                    const rows = this.sameVariantRowsForSelectedVariants(group.rows || [], selectedVariants);
                    return {
                        ...group,
                        summary: selectedVariants.length
                            ? `Exact same-variant carriers for ${selectedVariants.join(", ")}`
                            : group.summary,
                        rows,
                    };
                }
                return group;
            });
        },
        sortedPhenotypeMatches() {
            const sort = this.tableSorts.phenotype || { key: "similarity", direction: "desc" };
            return this.sortRows(this.sample.phenotypeMatches || [], sort.key, sort.direction, "phenotype");
        },
        sortedDiseaseMatches() {
            const sort = this.tableSorts.disease || { key: "matched", direction: "desc" };
            return this.sortRows(this.sample.diseaseMatches || [], sort.key, sort.direction, "disease");
        },
        phenotypeQueryHref() {
            return `/krPhenotype.html?query=${encodeURIComponent(this.sample.fullHpoTerms.join(", "))}`;
        },
        displaySampleId() {
            const params = new URLSearchParams(window.location.search);
            const requestedSampleId = params.get("sample_id") || params.get("query");
            if (!requestedSampleId || requestedSampleId === "CRDC-2031") {
                return this.sample.sampleId;
            }
            return requestedSampleId;
        },
        displayAgeGroup() {
            return this.formatAgeBand(this.sample.ageGroup || this.sample.ageBand || this.sample.age || "Unknown / not available");
        },
        displayAgeAtEnrollment() {
            return this.ageAtEnrollmentLabel(this.sample) || this.displayAgeGroup;
        },
    };

export const sampleMethods = {
        closeToolPopovers() {
            this.contextInfoOpen = false;
            this.contextPopoverOpen = false;
            this.optionsPopoverOpen = false;
            this.sampleInfoOpen = false;
            this.gendxInfoOpen = false;
            this.overviewInfoOpen = false;
            this.activeMetricInfoLabel = null;
            this.phenotypeInfoOpen = false;
            this.genotypeInfoOpen = false;
            this.activeSharedPhenotypeSampleId = null;
            this.activeSharedGeneSampleId = null;
            this.activeDiseaseMatchName = null;
            this.activeGenePhenotypeFit = null;
            this.activeGenotypeHpoKey = null;
        },
        removeClinicalContext() {
            clearClinicalFocus();
            this.contextPopoverOpen = false;
        },
        sampleHref(sampleId) {
            return `/krSample.html?sample_id=${encodeURIComponent(sampleId)}`;
        },
        variantHref(variantId) {
            return `/krVariant.html?query=${encodeURIComponent(variantId)}`;
        },
        phenotypeMatchHref(row) {
            return `/krPhenotype.html?query=${encodeURIComponent(row.sharedHpoTerms.join(", "))}`;
        },
        diseaseProfileHref(diseaseName) {
            return `/krSample.html?sample_id=${encodeURIComponent(this.displaySampleId)}&view=disease&profile=${encodeURIComponent(diseaseName)}`;
        },
        diseaseReferenceHref(reference, source = "") {
            const raw = typeof reference === "object"
                ? [reference.diseaseId, reference.name].filter(Boolean).join(" ")
                : String(reference || "");
            const sourceText = typeof reference === "object" ? reference.source || source : source;
            const orpha = raw.match(/(?:ORPHA:|Orpha[_\s]?)([0-9]+)/i);
            if (orpha || /orpha|orphanet|orphapacket/i.test(sourceText)) {
                return orpha
                    ? `https://www.orpha.net/en/disease/detail/${orpha[1]}`
                    : `https://www.orpha.net/en/disease/search?name=${encodeURIComponent(this.referenceSearchText(raw))}`;
            }
            const omim = raw.match(/(?:OMIM:|OMIM[_\s]?)([0-9]+)/i);
            if (omim || /omim/i.test(sourceText)) {
                return omim
                    ? `https://www.omim.org/entry/${omim[1]}`
                    : `https://www.omim.org/search?index=entry&search=${encodeURIComponent(this.referenceSearchText(raw))}`;
            }
            const mondo = raw.match(/MONDO[:_ ]([0-9]+)/i);
            if (mondo || /mondo/i.test(sourceText)) {
                return mondo
                    ? `https://monarchinitiative.org/MONDO:${mondo[1]}`
                    : `https://monarchinitiative.org/search/${encodeURIComponent(this.referenceSearchText(raw))}`;
            }
            if (/decipher/i.test(sourceText) || /decipher/i.test(raw)) {
                return `https://www.deciphergenomics.org/search?q=${encodeURIComponent(this.referenceSearchText(raw))}`;
            }
            return `https://www.google.com/search?q=${encodeURIComponent(`${this.referenceSearchText(raw)} rare disease reference`)}`;
        },
        referenceSearchText(value) {
            return String(value || "")
                .split(";")[0]
                .replace(/ORPHA:[0-9]+\s*·?\s*/i, "")
                .replace(/Orpha[_\s]?[0-9]+\s*·?\s*/i, "")
                .replace(/OMIM:[0-9]+\s*·?\s*/i, "")
                .replace(/MONDO:[0-9]+\s*·?\s*/i, "")
                .trim();
        },
        clinVarHref(variantId) {
            return `https://www.ncbi.nlm.nih.gov/clinvar/?term=${encodeURIComponent(this.normalizedVariantSearchTerm(variantId))}`;
        },
        normalizedVariantSearchTerm(variantId) {
            return String(variantId || "")
                .replace(/^chr/i, "")
                .replace(/,/g, "")
                .trim();
        },
        toggleSharedPhenotypes(sampleId) {
            this.activeSharedPhenotypeSampleId = this.activeSharedPhenotypeSampleId === sampleId ? null : sampleId;
        },
        visibleSharedHpoTerms(row) {
            return this.isSharedHpoExpanded(row.sampleId) ? row.sharedHpoTerms : row.sharedHpoTerms.slice(0, 5);
        },
        sharedHpoMoreCount(row) {
            return Math.max((row.sharedHpoTerms || []).length - 5, 0);
        },
        isSharedHpoExpanded(sampleId) {
            return Boolean(this.expandedSharedHpoSampleIds[sampleId]);
        },
        toggleSharedHpoExpanded(sampleId) {
            this.$set(this.expandedSharedHpoSampleIds, sampleId, !this.expandedSharedHpoSampleIds[sampleId]);
        },
        sharedGenesLabel(row) {
            const genes = this.sharedGeneItems(row).map((item) => item.gene);
            if (genes.length === 1) return genes[0];
            if (genes.length <= 3) return `${genes.length} genes: ${genes.join(", ")}`;
            return `${genes.length} genes: ${genes.slice(0, 3).join(", ")} +${genes.length - 3} more`;
        },
        sharedGeneItems(row) {
            const genes = Array.isArray(row.sharedGenes) && row.sharedGenes.length
                ? row.sharedGenes
                : [row.gene].filter(Boolean);
            return [...new Set(genes.filter((gene) => gene && gene !== "-"))].map((gene) => ({ gene }));
        },
        visibleSharedGeneItems(row) {
            const genes = this.sharedGeneItems(row);
            return this.activeSharedGeneSampleId === row.sampleId ? genes : genes.slice(0, 3);
        },
        sharedGeneMoreCount(row) {
            const genes = this.sharedGeneItems(row);
            return Math.max(genes.length - 3, 0);
        },
        toggleSharedGenes(sampleId) {
            this.activeSharedGeneSampleId = this.activeSharedGeneSampleId === sampleId ? null : sampleId;
        },
        toggleDiseaseMatchTerms(diseaseName, anchor) {
            const key = `${diseaseName}:${anchor}`;
            this.activeDiseaseMatchName = this.activeDiseaseMatchName === key ? null : key;
        },
        toggleGenePhenotypeFit(gene) {
            this.activeGenePhenotypeFit = this.activeGenePhenotypeFit === gene ? null : gene;
        },
        formatAgeBand(ageBand) {
            return String(ageBand || "").replace("-", "–");
        },
        ageAtEnrollmentLabel(row) {
            const value = Number(row?.ageAtEnrollment);
            if (Number.isFinite(value)) return String(value);
            const label = String(row?.ageAtEnrollmentLabel || "").trim();
            return label && label !== "-" ? label.replace(/\s*years?$/i, "") : "";
        },
        hpoTermName(term) {
            return String(term).replace(/\s*\[[^\]]+\]\s*$/, "");
        },
        hpoTermId(term) {
            const match = String(term).match(/\[([^\]]+)\]$/);
            return match ? match[1] : "";
        },
        domainFillPercent(domain) {
            const ratio = this.sample.hpoTotal ? (domain.count / this.sample.hpoTotal) * 100 : 0;
            return `${Math.max(0, Math.min(100, ratio))}%`;
        },
        isDomainExpanded(domainName) {
            return Boolean(this.expandedDomainTerms[domainName]);
        },
        visibleDomainTerms(domain) {
            const terms = domain.representativeTerms || [];
            return this.isDomainExpanded(domain.name) ? terms : terms.slice(0, 2);
        },
        domainMoreCount(domain) {
            const terms = domain.representativeTerms || [];
            return Math.max(terms.length - 2, 0);
        },
        toggleDomainTerms(domainName) {
            this.$set(this.expandedDomainTerms, domainName, !this.expandedDomainTerms[domainName]);
        },
        togglePanel(panel) {
            this.$set(this.openPanels, panel, !this.openPanels[panel]);
        },
        toggleMetric(metric) {
            this.$set(this.openMetrics, metric, !this.openMetrics[metric]);
        },
        toggleMetricInfo(metric) {
            this.activeMetricInfoLabel = this.activeMetricInfoLabel === metric ? null : metric;
        },
        toggleGene(gene) {
            this.$set(this.expandedGenes, gene, !this.expandedGenes[gene]);
        },
        toggleGenotypeGroup(group) {
            this.$set(this.openGenotypeGroups, group, !this.openGenotypeGroups[group]);
        },
        initializeVariantQueryRows() {
            if (this.variantQueryRows.length) return;
            const first = this.sampleVariantQueryOptions[0] || {
                gene: this.sample.gendx.gene || "-",
                variantId: this.sample.gendx.variantId || "-",
                consequence: this.sample.gendx.consequence || "-",
                sourceLabel: "Default query",
                isGendx: false,
            };
            this.variantQueryRows = [{
                id: this.variantQueryNextId,
                sourceLabel: first.sourceLabel,
                gene: first.gene,
                variantId: first.variantId,
                consequence: first.consequence,
                isGendx: first.isGendx,
            }];
            this.variantQueryNextId += 1;
        },
        variantQueryOptionLabel(variant) {
            return `${variant.variantId}${variant.isGendx ? " *" : ""}`;
        },
        variantOptionsForGene(gene) {
            return this.sampleVariantQueryOptions.filter((row) => row.gene === gene);
        },
        consequenceOptionsForGeneVariant(gene, variantId) {
            const consequences = this.sampleVariantQueryOptions
                .filter((row) => row.gene === gene && row.variantId === variantId)
                .map((row) => row.consequence || "-");
            return [...new Set(consequences.length ? consequences : ["-"])];
        },
        setVariantQueryGene(rowId, gene) {
            const variants = this.variantOptionsForGene(gene);
            const nextVariant = variants[0] || { variantId: "-", consequence: "-", sourceLabel: "Sample rare coding variant" };
            this.variantQueryRows = this.variantQueryRows.map((row) => row.id === rowId
                ? {
                    ...row,
                    gene,
                    variantId: nextVariant.variantId,
                    consequence: nextVariant.consequence,
                    sourceLabel: nextVariant.sourceLabel || row.sourceLabel,
                    isGendx: Boolean(nextVariant.isGendx),
                }
                : row);
        },
        setVariantQueryVariant(rowId, variantId) {
            this.variantQueryRows = this.variantQueryRows.map((row) => {
                if (row.id !== rowId) return row;
                const match = this.sampleVariantQueryOptions.find((option) => option.gene === row.gene && option.variantId === variantId);
                return {
                    ...row,
                    variantId,
                    consequence: match ? match.consequence : "-",
                    sourceLabel: match ? match.sourceLabel : row.sourceLabel,
                    isGendx: Boolean(match && match.isGendx),
                };
            });
        },
        setVariantQueryConsequence(rowId, consequence) {
            this.variantQueryRows = this.variantQueryRows.map((row) => row.id === rowId ? { ...row, consequence } : row);
        },
        addVariantQueryRow() {
            const firstUnused = this.sampleVariantQueryOptions.find((option) => !this.variantQueryRows.some((row) => row.variantId === option.variantId && row.gene === option.gene))
                || this.sampleVariantQueryOptions[0];
            if (!firstUnused) return;
            this.variantQueryRows = [
                ...this.variantQueryRows,
                {
                    id: this.variantQueryNextId,
                    sourceLabel: firstUnused.sourceLabel,
                    gene: firstUnused.gene,
                    variantId: firstUnused.variantId,
                    consequence: firstUnused.consequence,
                    isGendx: Boolean(firstUnused.isGendx),
                },
            ];
            this.variantQueryNextId += 1;
        },
        setTableSort(table, key) {
            const current = this.tableSorts[table] || { key, direction: "asc" };
            const direction = current.key === key && current.direction === "asc" ? "desc" : "asc";
            this.$set(this.tableSorts, table, { key, direction });
        },
        tableSortIndicator(table, key) {
            const current = this.tableSorts[table] || {};
            if (current.key !== key) return "↕";
            return current.direction === "asc" ? "↑" : "↓";
        },
        setVariantSort(gene, key) {
            const current = this.variantSorts[gene] || { key, direction: "asc" };
            const direction = current.key === key && current.direction === "asc" ? "desc" : "asc";
            this.$set(this.variantSorts, gene, { key, direction });
        },
        variantSortIndicator(gene, key) {
            const current = this.variantSorts[gene] || {};
            if (current.key !== key) return "↕";
            return current.direction === "asc" ? "↑" : "↓";
        },
        sortedGeneVariants(gene) {
            const sort = this.variantSorts[gene.gene] || { key: "variantId", direction: "asc" };
            return this.sortRows(gene.variants || [], sort.key, sort.direction, "variant");
        },
        setGenotypeSort(groupLabel, key) {
            const current = this.genotypeSorts[groupLabel] || { key: "profileSimilarity", direction: "desc" };
            const direction = current.key === key && current.direction === "desc" ? "asc" : "desc";
            this.$set(this.genotypeSorts, groupLabel, { key, direction });
        },
        groupHasVariantEvidence(group) {
            return group.label !== "Same gene";
        },
        sameVariantRowsForSelectedVariants(rows, selectedVariants) {
            const realRows = (rows || []).filter((row) => row.sampleId !== "none");
            if (!selectedVariants.length) return rows || [];
            const filtered = realRows.filter((row) => {
                const evidence = `${row.queryVariantEvidence || ""} ${row.matchedVariantEvidence || ""}`;
                return selectedVariants.some((variantId) => evidence.includes(variantId));
            });
            if (filtered.length) return filtered;
            return [this.emptyGenotypeRow(`No exact same-variant carrier rows in the current fixture for ${selectedVariants.join(", ")}`)];
        },
        sameGeneRowsForSelectedGenes(selectedGenes) {
            const genes = selectedGenes.length ? selectedGenes : this.sampleVariantGeneOptions.slice(0, 1);
            const rows = [];
            genes.forEach((gene) => {
                const phenotypeRows = (this.sample.phenotypeMatches || [])
                    .filter((row) => this.sharedGeneItems(row).some((item) => item.gene === gene));
                phenotypeRows.forEach((row) => {
                    rows.push({
                        sampleId: row.sampleId,
                        similarity: "Same gene",
                        ageBand: row.ageBand,
                        ageAtEnrollment: row.ageAtEnrollment,
                        ageAtEnrollmentLabel: row.ageAtEnrollmentLabel,
                        ageSource: row.ageSource,
                        sharedGene: gene,
                        phenotypeOverlap: this.sharedPhenotypeCountLabel(row),
                        phenotypeProfileSimilarityLabel: row.phenotypeProfileSimilarityLabel || "-",
                        keyPhenotypes: this.keyPhenotypeLabel(row.sharedHpoTerms),
                        sharedHpoTerms: row.sharedHpoTerms || [],
                    });
                });
            });
            if (rows.length) return rows;
            return [this.emptyGenotypeRow(`No same-gene carrier rows in the current fixture for ${genes.join(", ")}`)];
        },
        emptyGenotypeRow(label) {
            return {
                sampleId: "none",
                sampleLabel: label,
                similarity: "-",
                ageBand: "-",
                ageAtEnrollment: null,
                ageAtEnrollmentLabel: "-",
                ageSource: "-",
                sharedGene: "",
                queryVariantEvidence: "-",
                matchedVariantEvidence: "-",
                queryMatchSummary: "-",
                phenotypeOverlap: "-",
                phenotypeProfileSimilarityLabel: "-",
                keyPhenotypes: "-",
                sharedHpoTerms: [],
            };
        },
        sharedPhenotypeCountLabel(row) {
            const value = String(row?.sharedPhenotypeCount || "").trim();
            if (value) return `${value} shared HPO terms`;
            const terms = Array.isArray(row?.sharedHpoTerms) ? row.sharedHpoTerms.length : 0;
            const denominator = Number(this.sample?.hpoTotal) || terms;
            return `${terms} / ${denominator} shared HPO terms`;
        },
        keyPhenotypeLabel(terms) {
            const values = Array.isArray(terms) ? terms.filter(Boolean) : [];
            return values.length ? values.slice(0, 3).join("; ") : "-";
        },
        variantEvidenceLabel(row) {
            const matched = this.extractVariantEvidence(row.matchedVariantEvidence);
            const queried = this.extractVariantEvidence(row.queryVariantEvidence);
            return matched || queried || "-";
        },
        extractVariantEvidence(value) {
            const text = String(value || "").trim();
            if (!text || text === "-") return "";
            const match = text.match(/(?:Matched sample:|Queried sample:)\s*(.+)$/i);
            return (match ? match[1] : text).trim();
        },
        genotypeSharedHpoKey(groupLabel, row) {
            return `${groupLabel}:${row.sampleId}:${row.sharedGene || ""}:${this.variantEvidenceLabel(row)}`;
        },
        toggleGenotypeSharedHpo(groupLabel, row) {
            const key = this.genotypeSharedHpoKey(groupLabel, row);
            this.activeGenotypeHpoKey = this.activeGenotypeHpoKey === key ? null : key;
        },
        genotypeSharedHpoTerms(row) {
            const terms = Array.isArray(row.sharedHpoTerms) ? row.sharedHpoTerms.filter(Boolean) : [];
            if (terms.length) return terms;
            if (row.keyPhenotypes && row.keyPhenotypes !== "-") {
                return String(row.keyPhenotypes).split(";").map((term) => term.trim()).filter(Boolean);
            }
            return [];
        },
        isGenotypeSharedHpoExpanded(groupLabel, row) {
            return Boolean(this.expandedGenotypeHpoKeys[this.genotypeSharedHpoKey(groupLabel, row)]);
        },
        visibleGenotypeSharedHpoTerms(groupLabel, row) {
            const terms = this.genotypeSharedHpoTerms(row);
            return this.isGenotypeSharedHpoExpanded(groupLabel, row) ? terms : terms.slice(0, 5);
        },
        genotypeSharedHpoMoreCount(row) {
            return Math.max(this.genotypeSharedHpoTerms(row).length - 5, 0);
        },
        toggleGenotypeSharedHpoExpanded(groupLabel, row) {
            const key = this.genotypeSharedHpoKey(groupLabel, row);
            this.$set(this.expandedGenotypeHpoKeys, key, !this.expandedGenotypeHpoKeys[key]);
        },
        genotypeHpoPopoverNote(row) {
            const terms = this.genotypeSharedHpoTerms(row);
            if (terms.length) return "Computed from sample_hpo after excluding HP:0000001 and HP:0000118.";
            return "No non-broad shared HPO terms are present in the current sample_hpo export.";
        },
        genotypeSortIndicator(groupLabel, key) {
            const current = this.genotypeSorts[groupLabel] || {};
            if (current.key !== key) return "↕";
            return current.direction === "asc" ? "↑" : "↓";
        },
        sortedGenotypeRows(group) {
            const current = this.genotypeSorts[group.label] || { key: "profileSimilarity", direction: "desc" };
            const rows = [...(group.rows || [])];
            const valueFor = (row) => {
                if (row.sampleId === "none") return Number.NEGATIVE_INFINITY;
                if (current.key === "phenotypeOverlap") return this.numericPrefix(row.phenotypeOverlap);
                if (current.key === "profileSimilarity") return this.numericPrefix(row.phenotypeProfileSimilarityLabel);
                if (current.key === "age") return this.ageSortValue(row);
                if (current.key === "sampleId") return row.sampleId || "";
                if (current.key === "sharedGene") return row.sharedGene || "";
                if (current.key === "keyPhenotypes") return row.keyPhenotypes || "";
                return row[current.key] || "";
            };
            rows.sort((left, right) => {
                return this.compareSortValues(valueFor(left), valueFor(right), current.direction);
            });
            return rows;
        },
        numericPrefix(value) {
            const match = String(value || "").match(/-?[0-9]+(?:\.[0-9]+)?/);
            return match ? Number(match[0]) : Number.NEGATIVE_INFINITY;
        },
        genotypeAgeLabel(row) {
            return this.ageAtEnrollmentLabel(row) || this.formatAgeBand(row.ageBand || row.age || "-");
        },
        removeVariantQueryRow(rowId) {
            if (this.variantQueryRows.length === 1) return;
            this.variantQueryRows = this.variantQueryRows.filter((row) => row.id !== rowId);
        },
        toggleDisease(disease) {
            this.$set(this.openDiseases, disease, !this.openDiseases[disease]);
        },
        sortRows(rows, key, direction, table) {
            const sorted = [...rows];
            sorted.sort((left, right) => this.compareSortValues(
                this.sortValue(left, key, table),
                this.sortValue(right, key, table),
                direction,
            ));
            return sorted;
        },
        sortValue(row, key, table) {
            if (table === "phenotype") {
                if (key === "sampleId") return row.sampleId || "";
                if (key === "similarity") return this.numericPrefix(row.phenotypeProfileSimilarityLabel || row.phenotypeProfileSimilarity || row.similarityRank);
                if (key === "sharedCount") return this.numericPrefix(row.sharedPhenotypeCount);
                if (key === "sharedGenes") return this.sharedGeneItems(row).map((item) => item.gene).join(", ");
                if (key === "investigator") return row.investigator || "";
                if (key === "sex") return row.sex || "";
                if (key === "age") return this.ageSortValue(row);
                if (key === "notes") return row.notes || "";
            }
            if (table === "disease") {
                if (key === "name") return row.name || "";
                if (key === "source") return row.source || "";
                if (key === "matched") return Number(row.matchedHpoCount) || 0;
                if (key === "total") return Number(row.totalDiseaseHpoTerms) || 0;
                if (key === "overlap") return this.numericPrefix(row.overlap);
                if (key === "notes") return row.notes || "";
            }
            if (table === "variant") {
                if (["gnomad", "dp", "revel", "alphaMissense", "carriers"].includes(key)) return this.numericPrefix(row[key]);
                return row[key] || "";
            }
            return row[key] || "";
        },
        compareSortValues(left, right, direction = "asc") {
            const leftNumber = typeof left === "number" && Number.isFinite(left);
            const rightNumber = typeof right === "number" && Number.isFinite(right);
            let result;
            if (leftNumber || rightNumber) {
                result = (leftNumber ? left : Number.NEGATIVE_INFINITY) - (rightNumber ? right : Number.NEGATIVE_INFINITY);
            } else {
                result = String(left || "").localeCompare(String(right || ""), undefined, { numeric: true, sensitivity: "base" });
            }
            return direction === "asc" ? result : -result;
        },
        ageSortValue(row) {
            const value = Number(row?.ageAtEnrollment);
            if (Number.isFinite(value)) return value;
            return Number.POSITIVE_INFINITY;
        },
    };
