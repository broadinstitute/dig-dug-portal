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
                { label: "Age group", value: this.displayAgeGroup },
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
    };

export const sampleMethods = {
        closeToolPopovers() {
            this.contextInfoOpen = false;
            this.contextPopoverOpen = false;
            this.optionsPopoverOpen = false;
            this.sampleInfoOpen = false;
            this.gendxInfoOpen = false;
            this.overviewInfoOpen = false;
            this.phenotypeInfoOpen = false;
            this.genotypeInfoOpen = false;
            this.activeSharedPhenotypeSampleId = null;
            this.activeSharedGeneSampleId = null;
            this.activeDiseaseMatchName = null;
            this.activeGenePhenotypeFit = null;
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
        toggleSharedPhenotypes(sampleId) {
            this.activeSharedPhenotypeSampleId = this.activeSharedPhenotypeSampleId === sampleId ? null : sampleId;
        },
        visibleSharedHpoTerms(row) {
            return this.isSharedHpoExpanded(row.sampleId) ? row.sharedHpoTerms : row.sharedHpoTerms.slice(0, 5);
        },
        sharedHpoMoreCount(row) {
            return Math.max(row.sharedHpoTerms.length - 5, 0);
        },
        isSharedHpoExpanded(sampleId) {
            return Boolean(this.expandedSharedHpoSampleIds[sampleId]);
        },
        toggleSharedHpoExpanded(sampleId) {
            this.$set(this.expandedSharedHpoSampleIds, sampleId, !this.expandedSharedHpoSampleIds[sampleId]);
        },
        sharedGenesLabel(row) {
            const genes = row.sharedGenes || [row.gene];
            if (genes.length === 1) return genes[0];
            if (genes.length <= 3) return `${genes.length} genes: ${genes.join(", ")}`;
            return `${genes.length} genes: ${genes.slice(0, 3).join(", ")} +${genes.length - 3} more`;
        },
        sharedGeneMoreCount(row) {
            const genes = row.sharedGenes || [row.gene];
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
        toggleGene(gene) {
            this.$set(this.expandedGenes, gene, !this.expandedGenes[gene]);
        },
        toggleGenotypeGroup(group) {
            this.$set(this.openGenotypeGroups, group, !this.openGenotypeGroups[group]);
        },
        toggleDisease(disease) {
            this.$set(this.openDiseases, disease, !this.openDiseases[disease]);
        },
    };
