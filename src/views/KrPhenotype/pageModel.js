import { hasClinicalFocus } from "../KrClinicalFocus/focusComparison";
import { clearClinicalFocus } from "../KrClinicalFocus/focusStore";

export const phenotypeComputed = {
        currentPhenotypeTermsForFocus() {
            return this.phenotype.queryTerms.exact.map((term) => ({
                id: term.id,
                label: term.label,
            }));
        },
        hasActiveContext() {
            return hasClinicalFocus(this.clinicalFocus);
        },
        activeContextTerms() {
            return (this.clinicalFocus.hpoTerms || []).slice(0, 5);
        },
        queryContextOverlapText() {
            if (!this.hasActiveContext) return "";
            const queryIds = this.phenotype.queryTerms.exact.map((term) => term.id);
            const contextIds = (this.clinicalFocus.hpoTerms || []).map((term) => term.id);
            const shared = queryIds.filter((id) => contextIds.includes(id));
            return `${shared.length} / ${queryIds.length} query HPO terms overlap active context`;
        },
        cohortSummary() {
            const headline = this.phenotype.headline[0] || {};
            const value = headline.value || `${this.phenotype.topSamples.length} / —`;
            const [matchedRaw, eligibleRaw] = String(value).split("/").map((part) => part.trim());
            const matched = Number.parseInt(matchedRaw, 10);
            const eligible = Number.parseInt(eligibleRaw, 10);
            const percent = Number.isFinite(matched) && Number.isFinite(eligible) && eligible > 0
                ? ` (${((matched / eligible) * 100).toFixed(1)}%)`
                : "";
            const samples = this.phenotype.topSamples || [];
            const denominator = Number.isFinite(matched) ? matched : samples.length;
            const summaryUsesAllMatched = samples.length === denominator;
            const sexCounts = this.countByNormalized(samples, "sex");
            const probandYes = samples.filter((sample) => String(sample.proband).toLowerCase() === "yes").length;
            const probandNo = samples.filter((sample) => String(sample.proband).toLowerCase() === "no").length;
            const sexParts = [];
            if (sexCounts.female) sexParts.push(`${sexCounts.female} female`);
            if (sexCounts.male) sexParts.push(`${sexCounts.male} male`);
            const knownSex = (sexCounts.female || 0) + (sexCounts.male || 0);
            if (summaryUsesAllMatched && denominator > knownSex) sexParts.push(`${denominator - knownSex} sex not available`);
            const probandParts = [];
            if (probandYes) probandParts.push(`${probandYes} proband`);
            if (probandNo) probandParts.push(`${probandNo} non-proband`);
            if (summaryUsesAllMatched && denominator > probandYes + probandNo) {
                probandParts.push(`${denominator - probandYes - probandNo} proband status not available`);
            }
            const dbSummary = this.phenotype.matchedCohortSummary || {};
            return {
                value,
                primary: Number.isFinite(matched) ? `${matched} phenotype-matched samples` : `${samples.length} phenotype-matched samples`,
                eligible: Number.isFinite(eligible) ? `${value} eligible samples${percent}` : `${value} eligible samples`,
                sex: dbSummary.sex || `${summaryUsesAllMatched ? "Sex" : "Sex in displayed rows"}: ${sexParts.join(" · ") || "not available"}`,
                proband: dbSummary.proband || `${summaryUsesAllMatched ? "Proband status" : "Proband status in displayed rows"}: ${probandParts.join(" · ") || "not available"}`,
                matchedCount: Number.isFinite(matched) ? matched : samples.length,
                ageLabel: Number.isFinite(matched)
                    ? `Age at enrollment among ${matched} phenotype-matched samples`
                    : "Age at enrollment among phenotype-matched samples",
            };
        },
        cohortAgeBins() {
            const samples = this.phenotype.topSamples || [];
            const matchedCount = Number(this.cohortSummary.matchedCount) || samples.length;
            const missingRows = Math.max(0, matchedCount - samples.length);
            const rowsForHistogram = missingRows
                ? [
                    ...samples,
                    ...Array.from({ length: missingRows }, () => ({
                        ageAtEnrollment: null,
                        ageAtEnrollmentLabel: "-",
                        sex: "",
                    })),
                ]
                : samples;
            return this.ageAtEnrollmentHistogram(rowsForHistogram, this.activePhenotypeAgeRange);
        },
        cohortAgeUnknown() {
            const unknownBin = this.cohortAgeBins.find((bin) => bin.key === "unknown");
            return Number(unknownBin?.total || 0);
        },
        cohortHistogramScope() {
            const samples = this.phenotype.topSamples || [];
            const sexCounts = this.countByNormalized(samples, "sex");
            const sexSummary = String(this.phenotype.matchedCohortSummary?.sex || "");
            const summaryFemale = Number.parseInt(sexSummary.match(/(\d+)\s+female/i)?.[1], 10);
            const summaryMale = Number.parseInt(sexSummary.match(/(\d+)\s+male/i)?.[1], 10);
            const female = Number.isFinite(summaryFemale) ? summaryFemale : Number(sexCounts.female || 0);
            const male = Number.isFinite(summaryMale) ? summaryMale : Number(sexCounts.male || 0);
            const all = Number(this.cohortSummary.matchedCount) || samples.length;
            return {
                female,
                male,
                unknownSex: Math.max(0, all - female - male),
                all,
            };
        },
        phenotypeAgeRangeOptions() {
            return [
                { key: "0-9", label: "0-9" },
                { key: "10-17", label: "10-17" },
                { key: "0-17-plus", label: "0-17, 18+" },
                { key: "all", label: "All ages" },
            ];
        },
        annotationBurdenSummary() {
            const sample = this.phenotype.topSamples[0] || {};
            const residual = sample.residual || "not calculated";
            return {
                label: "Top matched sample check",
                value: sample.id || "No selected sample",
                detail: residual === "not calculated"
                    ? "Annotation-burden residual is not calculated in the current fixture"
                    : `${residual} after total HPO-term correction`,
            };
        },
        topPhenotypeDomainSummary() {
            const terms = this.specificCoObservedTerms.slice(0, 3);
            return {
                label: "Top phenotype domains in matched samples",
                domains: terms.map((term) => ({
                    label: this.termName(term.label),
                    count: term.count,
                })),
            };
        },
        referenceGeneCandidates() {
            return (this.phenotype.geneCandidates || []).filter((row) => this.geneExactQuerySupportCount(row) > 0);
        },
        crdcOnlyGeneNames() {
            const genes = (this.phenotype.candidateEvidenceSummary || []).map((item) => item.gene).filter(Boolean);
            return genes.length ? genes.join(", ") : "the CRDC-linked genes";
        },
        specificCoObservedTerms() {
            return (this.phenotype.coObserved || []).filter((term) => !this.isBroadOntologyTerm(term.label));
        },
        compactContextLabel() {
            if (!this.hasActiveContext) return "";
            const contextId = this.clinicalFocus.orphaId || this.clinicalFocus.sourceId || "";
            return [this.clinicalFocus.label, contextId].filter(Boolean).join(" · ");
        },
        activeResidualGroupData() {
            return this.phenotype.residualGroups.find(
                (group) => group.name === this.activeResidualGroup
            ) || this.phenotype.residualGroups[0];
        },
        selectedSampleData() {
            return this.phenotype.topSamples.find(
                (sample) => sample.id === this.activeOutlierSample
            ) || {
                id: this.activeOutlierSample,
                investigator: "Investigator 2",
                proband: "Yes",
                affected: "Yes",
                sex: "Female",
                ageBand: "13-18",
                ageAtEnrollment: null,
                ageAtEnrollmentLabel: "-",
                sexAge: "Female · 13-18",
                diagnosed: "Yes",
                diagnosedVariant: "KMT2D chr12:49,431,208 C>T | LP",
                queryTermsMatched: "2 / 2 query terms",
                scoringTermsMatched: "4 expanded scoring terms",
                totalTerms: 38,
                rawScore: "3.9",
                expectedScore: "2.1",
                residual: "+1.8",
                percentile: "top 6.2%",
                equalOrHigher: "18 / 904",
                signals: "KMT2D, CHD7",
                phenotypeProfile: [
                    { category: "Abnormality of the nervous system", terms: "18 terms", queryPhenotype: "Developmental delay [HP:0001263]", phenotypeTerms: ["Developmental delay [HP:0001263]", "Speech delay [HP:0000750]", "Seizure [HP:0001250]", "Hypotonia [HP:0001252]"] },
                    { category: "Abnormality of head or neck", terms: "9 terms", queryPhenotype: "Cleft palate [HP:0000175]", phenotypeTerms: ["Cleft palate [HP:0000175]", "Micrognathia [HP:0000347]", "Low-set ears [HP:0000369]"] },
                    { category: "Growth abnormality", terms: "8 terms", queryPhenotype: "", phenotypeTerms: ["Failure to thrive [HP:0001508]", "Short stature [HP:0004322]", "Poor weight gain [HP:0004325]"] },
                ],
            };
        },
        selectedSamplePhenotypeProfile() {
            const totalTerms = Number.parseInt(this.selectedSampleData.totalTerms, 10) || 0;
            if (this.selectedSampleData.phenotypeProfile && this.selectedSampleData.phenotypeProfile.length) {
                return this.selectedSampleData.phenotypeProfile.map((row) => ({
                    category: row.category,
                    terms: row.terms,
                    share: this.profileShare(row.terms, totalTerms),
                    queryMatch: row.queryPhenotype || "—",
                    phenotypeTerms: this.sortedPhenotypeTerms(row.phenotypeTerms || []).map((term) => this.termObject(term, this.isQueryTermText(term) ? "Query term" : "Selected sample term")),
                }));
            }
            const queryTerms = this.phenotype.queryTerms.exact.map((term) => ({
                ...this.termObject(`${term.label} [${term.id}]`, "Query term"),
                matched: true,
            }));
            const coObserved = this.specificCoObservedTerms.map((term) => this.termObject(term.label, "Co-observed in matched cohort"));
            const rowSpecs = [
                {
                    category: "Abnormality of head or neck [HP:0000152]",
                    count: Math.min(totalTerms || 107, 32),
                    queryMatch: queryTerms.find((term) => /oral|palate|head|neck/i.test(term.name)) ? "Query term present" : "—",
                    terms: [
                        ...queryTerms.filter((term) => /oral|palate|head|neck/i.test(term.name)),
                        ...coObserved.filter((term) => /head|neck|face|oral/i.test(term.name)).slice(0, 6),
                    ],
                },
                {
                    category: "Abnormality of metabolism/homeostasis [HP:0001939]",
                    count: Math.min(totalTerms || 107, 24),
                    queryMatch: queryTerms.find((term) => /purine|circulating|metabol/i.test(term.name)) ? "Query term present" : "—",
                    terms: [
                        ...queryTerms.filter((term) => /purine|circulating|metabol/i.test(term.name)),
                        ...coObserved.filter((term) => /metabol|circulating|blood|homeostasis/i.test(term.name)).slice(0, 5),
                    ],
                },
                {
                    category: "Abnormality of the nervous system [HP:0000707]",
                    count: Math.min(totalTerms || 107, 18),
                    queryMatch: "—",
                    terms: coObserved.filter((term) => /nervous|seizure|development|brain|neurolog/i.test(term.name)).slice(0, 6),
                },
                {
                    category: "Abnormality of the digestive system [HP:0025031]",
                    count: Math.min(totalTerms || 107, 9),
                    queryMatch: "—",
                    terms: coObserved.filter((term) => /digestive|feeding|reflux|constipation/i.test(term.name)).slice(0, 5),
                },
            ];
            return rowSpecs
                .map((row) => ({
                    category: row.category,
                    terms: `${row.count} / ${totalTerms || "—"} terms`,
                    share: totalTerms ? `${((row.count / totalTerms) * 100).toFixed(1)}%` : "Not available",
                    queryMatch: row.queryMatch,
                    phenotypeTerms: row.terms.length ? row.terms : [this.termObject("Term-level profile not available in current fixture", "Fixture gap")],
                }))
                .filter((row) => row.phenotypeTerms.length);
        },
        selectedScorePoint() {
            return this.phenotype.scorePoints.find(
                (point) => point.id === this.activeOutlierSample
            ) || this.phenotype.scorePoints[0];
        },
        selectedLabelStyle() {
            const left = parseFloat(this.selectedScorePoint.x || "76");
            const bottom = parseFloat(this.selectedScorePoint.y || "78");
            return {
                left: `${Math.min(Math.max(left - 18, 3), 62)}%`,
                bottom: `${Math.min(Math.max(bottom + 7, 10), 84)}%`,
            };
        },
        groupLabelStyle() {
            const left = parseFloat(this.activeResidualGroupData.x || "62");
            const bottom = parseFloat(this.activeResidualGroupData.y || "66");
            return {
                left: `${Math.min(Math.max(left - 12, 3), 68)}%`,
                bottom: `${Math.min(Math.max(bottom + 7, 10), 84)}%`,
            };
        },
    };

export const phenotypeMethods = {
        closeToolPopovers() {
            this.contextPopoverOpen = false;
            this.optionsPopoverOpen = false;
            this.candidateInfoOpen = false;
            this.referenceInfoOpen = false;
            this.diseaseOverlapInfoOpen = false;
            this.cohortInfoOpen = false;
            this.activeReferenceDetail = "";
        },
        removeClinicalContext() {
            clearClinicalFocus();
            this.contextPopoverOpen = false;
        },
        countByNormalized(rows, key) {
            return rows.reduce((acc, row) => {
                const value = String(row[key] || "").toLowerCase();
                acc[value] = (acc[value] || 0) + 1;
                return acc;
            }, {});
        },
        candidateEvidenceDetail(gene) {
            const row = this.phenotype.geneCandidates.find((candidate) => candidate.gene === gene);
            return row ? row.cohortCarrierEvidence : "";
        },
        compactCandidateSourceLabel(gene, sources = []) {
            const hasExternal = sources.some((source) => /external/i.test(source));
            const row = this.phenotype.geneCandidates.find((candidate) => candidate.gene === gene);
            const carrierCount = row ? this.carrierCountLabel(row.cohortCarrierEvidence) : "";
            const parts = [];
            if (hasExternal) parts.push("External");
            if (carrierCount) parts.push(`CRDC ${carrierCount}`);
            if (!parts.length && sources.length) parts.push(sources.join(" | "));
            return parts.join(" | ") || "CRDC";
        },
        carrierCountLabel(value) {
            const match = String(value || "").match(/(\d+)\s*\/\s*(\d+)/);
            return match ? `${match[1]}/${match[2]}` : "";
        },
        readableCarrierEvidence(row) {
            const count = this.carrierCountLabel(row.cohortCarrierEvidence);
            if (count) {
                return `${count} phenotype-matched CRDC samples carry rare ${row.gene} variants`;
            }
            return row.cohortCarrierEvidence || "Not available";
        },
        normalizedExternalAnnotation(value) {
            if (!value || /shown when available/i.test(value)) {
                return "No Orphanet / HPO / OMIM annotation available in current fixture";
            }
            return value;
        },
        diseaseReferenceLabel(row) {
            const disease = String(row?.disease || "").trim();
            const id = this.normalizedDiseaseReferenceId(row);
            return id ? `${id} · ${disease}` : disease;
        },
        diseaseReferenceSource(row) {
            const source = String(row?.source || "").trim();
            if (source) return source;
            const parts = String(row?.externalAnnotation || "").split("·").map((part) => part.trim()).filter(Boolean);
            return parts.length > 1 ? parts.slice(1).join(" · ") : "Reference profile";
        },
        normalizedDiseaseReferenceId(row) {
            const raw = [
                row?.diseaseId,
                row?.sourceDisease,
                row?.externalAnnotation,
                row?.disease,
            ].filter(Boolean).join(" ");
            const orpha = raw.match(/(?:ORPHA:|Orpha[_\s]?)([0-9]+)/i);
            if (orpha) return `ORPHA:${orpha[1]}`;
            const omim = raw.match(/(?:OMIM:|OMIM[_\s]?)([0-9]+)/i);
            if (omim) return `OMIM:${omim[1]}`;
            const mondo = raw.match(/MONDO[:_ ]([0-9]+)/i);
            if (mondo) return `MONDO:${mondo[1]}`;
            const decipher = raw.match(/DECIPHER[:_ ]([A-Za-z0-9.-]+)/i);
            if (decipher) return `DECIPHER:${decipher[1]}`;
            return "";
        },
        diseaseReferenceHref(row) {
            const id = this.normalizedDiseaseReferenceId(row);
            const source = this.diseaseReferenceSource(row);
            const disease = String(row?.disease || "").trim();
            if (id.startsWith("ORPHA:")) {
                return `https://www.orpha.net/en/disease/detail/${encodeURIComponent(id.replace("ORPHA:", ""))}`;
            }
            if (id.startsWith("OMIM:")) {
                return `https://www.omim.org/entry/${encodeURIComponent(id.replace("OMIM:", ""))}`;
            }
            if (id.startsWith("MONDO:")) {
                return `https://monarchinitiative.org/${encodeURIComponent(id)}`;
            }
            if (id.startsWith("DECIPHER:")) {
                return `https://www.deciphergenomics.org/search?q=${encodeURIComponent(id.replace("DECIPHER:", ""))}`;
            }
            if (/orpha|orphanet|orphapacket/i.test(source)) {
                return `https://www.orpha.net/en/disease/search?name=${encodeURIComponent(disease)}`;
            }
            if (/omim/i.test(source)) {
                return `https://www.omim.org/search?index=entry&search=${encodeURIComponent(disease)}`;
            }
            if (/mondo/i.test(source)) {
                return `https://monarchinitiative.org/search/${encodeURIComponent(disease)}`;
            }
            if (/decipher/i.test(source)) {
                return `https://www.deciphergenomics.org/search?q=${encodeURIComponent(disease)}`;
            }
            return `https://www.google.com/search?q=${encodeURIComponent(`${disease} rare disease reference`)}`;
        },
        termName(value) {
            return String(value || "").replace(/\s*\[HP:\d+\]\s*$/, "");
        },
        termObject(value, role = "Phenotype term") {
            const text = String(value || "");
            const match = text.match(/^(.*?)\s*\[(HP:\d+)\]\s*$/);
            const name = match ? match[1].trim() : text;
            const id = match ? match[2] : "";
            return {
                name,
                id,
                role,
                matched: this.isQueryTermText(text),
            };
        },
        profileShare(termText, totalTerms) {
            const count = Number.parseInt(String(termText || "").match(/\d+/)?.[0], 10);
            if (!Number.isFinite(count) || !totalTerms) return "Not available";
            return `${((count / totalTerms) * 100).toFixed(1)}%`;
        },
        isBroadOntologyTerm(value) {
            const text = String(value || "").toLowerCase();
            return text.startsWith("all ") || text.startsWith("phenotypic abnormality");
        },
        diseaseHpoCount(value) {
            const match = String(value || "").match(/(\d+\s*\/\s*\d+)\s+disease HPO terms/i);
            return match ? `${match[1].replace(/\s/g, "")} disease HPO terms` : "Matched disease HPO terms";
        },
        referenceMatchedTerms(row) {
            const queryTerms = this.phenotype.queryTerms.exact.map((term) => `${term.label} [${term.id}]`);
            const coObservedTerms = this.specificCoObservedTerms.slice(0, 12).map((term) => term.label);
            if (row && row.gene) {
                return [...queryTerms, ...coObservedTerms.slice(0, 4)];
            }
            const target = Number.parseInt(String(row.profileMatch || "").match(/(\d+)\s*\//)?.[1], 10) || 6;
            return [...queryTerms, ...coObservedTerms].slice(0, target);
        },
        referenceDiseaseTermRows(row) {
            const matchedTerms = this.referenceMatchedTerms(row).map((term) => ({
                ...this.termObject(term, "Matched overlap"),
                matched: true,
                root: this.rootCategoryForTerm(term),
            }));
            const denominator = Number.parseInt(String(row.profileMatch || "").match(/\/\s*(\d+)/)?.[1], 10);
            const remaining = Number.isFinite(denominator)
                ? Math.max(denominator - matchedTerms.length, 0)
                : 0;
            if (remaining > 0) {
                matchedTerms.push({
                    matched: false,
                    name: `+${remaining} disease-profile terms not included in the current term-level fixture`,
                    id: "",
                    root: "Full reference profile",
                    role: "Fixture gap",
                });
            }
            return matchedTerms;
        },
        referenceGeneTermRows(row) {
            if (row && Array.isArray(row.hpoTerms) && row.hpoTerms.length) {
                return row.hpoTerms.map((term) => ({
                    matched: Boolean(term.matched),
                    name: term.hpoTerm || term.hpoId,
                    id: term.hpoId || "",
                    role: term.evidenceRole || (term.related ? "Related HPO term" : "Gene phenotype annotation"),
                }));
            }
            return this.phenotype.queryTerms.exact.map((term) => ({
                ...this.termObject(`${term.label} [${term.id}]`, "Original query HPO term not exported for this gene"),
                matched: false,
            }));
        },
        geneHpoSupportLabel(row) {
            if (row && row.profileMatch) return row.profileMatch;
            const terms = Array.isArray(row?.hpoTerms) ? row.hpoTerms : [];
            const exact = this.geneExactQuerySupportCount(row);
            const related = terms.filter((term) => term.related).length;
            const parts = [`${exact} / ${this.phenotype.queryTerms.exact.length} exact query HPO terms`];
            if (related) parts.push(`${related} related HPO terms`);
            return parts.join(" · ");
        },
        geneExactQuerySupportCount(row) {
            const terms = Array.isArray(row?.hpoTerms) ? row.hpoTerms : [];
            return terms.filter((term) => term.matched).length;
        },
        referenceCrdcSamples() {
            return (this.phenotype.topSamples || []).slice(0, 6);
        },
        rootCategoryForTerm(value) {
            const text = String(value || "").toLowerCase();
            if (/oral|palate|head|neck|face/.test(text)) return "Head or neck";
            if (/purine|circulating|metabol|blood|homeostasis/.test(text)) return "Metabolism / homeostasis";
            if (/nervous|seizure|development|brain|neurolog/.test(text)) return "Nervous system";
            if (/digestive|feeding|reflux|constipation/.test(text)) return "Digestive system";
            return "Other disease HPO category";
        },
        toggleReferenceDetail(key) {
            this.activeReferenceDetail = this.activeReferenceDetail === key ? "" : key;
        },
        activeReferenceDetailRow(id) {
            return this.activeReferenceDetail.endsWith(`-${id}`);
        },
        referenceDetailHeading(row) {
            if (this.activeReferenceDetail.includes("-crdc-")) {
                return row.gene ? `${row.gene} CRDC carrier evidence` : `${row.disease} CRDC overlay`;
            }
            if (this.activeReferenceDetail.includes("-terms-")) {
                return row.gene ? `${row.gene} matched HPO terms` : `${row.disease} matched disease HPO terms`;
            }
            return row.gene ? `${row.gene} query phenotype overlap` : `${row.disease} HPO profile overlap`;
        },
        referenceDetailNote(row) {
            if (this.activeReferenceDetail.includes("-crdc-")) {
                return row.gene
                    ? `${this.readableCarrierEvidence(row)}. Rows below show phenotype-matched CRDC samples currently available in the fixture.`
                    : `${row.crdcEvidence} means phenotype-matched CRDC samples whose profiles overlap this external disease reference in the current mock overlay. It is not the same object as the disease-HPO term list.`;
            }
            if (row.gene) {
                return "Rows show this gene's external HPO annotations from the test DB. Checkmarks mark exact searched HPO terms; related hierarchy terms are not counted as exact query support.";
            }
            return "The checkmark marks HPO terms that are currently represented as matched overlap terms. The full disease-profile denominator is shown, but the current fixture does not expose every disease HPO term.";
        },
        rowHasQueryTerm(row) {
            const joined = [
                row.queryPhenotype,
                ...(row.phenotypeTerms || []),
                row.category,
            ].join(" ");
            return this.isQueryTermText(joined);
        },
        sortedPhenotypeTerms(terms) {
            return [...terms].sort((a, b) => {
                const aBroad = this.isBroadOntologyTerm(a) ? 1 : 0;
                const bBroad = this.isBroadOntologyTerm(b) ? 1 : 0;
                if (aBroad !== bBroad) return aBroad - bBroad;
                const aQuery = this.isQueryTermText(a) ? 0 : 1;
                const bQuery = this.isQueryTermText(b) ? 0 : 1;
                if (aQuery !== bQuery) return aQuery - bQuery;
                return String(a).localeCompare(String(b));
            });
        },
        matchedQueryTermsForSample(sample) {
            const match = String(sample.queryTermsMatched || "").match(/^(\d+)\s*\/\s*(\d+)/);
            const matchedCount = match ? Number.parseInt(match[1], 10) : this.phenotype.queryTerms.exact.length;
            return this.phenotype.queryTerms.exact.slice(0, matchedCount);
        },
        unmatchedQueryTermsForSample(sample) {
            const matchedIds = new Set(this.matchedQueryTermsForSample(sample).map((term) => term.id));
            return this.phenotype.queryTerms.exact.filter((term) => !matchedIds.has(term.id));
        },
        splitTerms(value) {
            if (!value || value === "—") return ["—"];
            return String(value)
                .split(/[,·]/)
                .map((term) => term.trim())
                .filter(Boolean);
        },
        isQueryTermText(value) {
            return this.phenotype.queryTerms.exact.some((term) => (
                String(value).includes(term.id) || String(value).includes(term.label)
            ));
        },
        sampleRecord(sampleId) {
            return this.phenotype.topSamples.find((sample) => sample.id === sampleId);
        },
        sampleProband(sample) {
            const record = this.sampleRecord(sample.id);
            if (record && record.proband) return record.proband;
            const status = String(sample.status || "").toLowerCase();
            if (status.includes("non-proband")) return "No";
            if (status.includes("proband")) return "Yes";
            return "Not available";
        },
        sampleAffected(sample) {
            const record = this.sampleRecord(sample.id);
            if (record && record.affected) return record.affected;
            const status = String(sample.status || "").toLowerCase();
            if (status.includes("affected") || status.includes("proband")) return "Yes";
            return "Not available";
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
            return "Not available";
        },
        ageAtEnrollmentBucket(row) {
            const value = this.ageAtEnrollmentValue(row);
            if (value === null) return "unknown";
            if (value <= 4) return "0-4";
            if (value <= 9) return "5-9";
            if (value <= 17) return "10-17";
            return "18-plus";
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
            const maxCount = Math.max(1, ...binsWithTotals.map((bin) => bin.total));
            return binsWithTotals.map((bin) => ({
                ...bin,
                femaleHeight: `${Math.max((bin.female / maxCount) * 70, bin.female ? 12 : 2)}px`,
                maleHeight: `${Math.max((bin.male / maxCount) * 70, bin.male ? 12 : 2)}px`,
                unknownHeight: `${Math.max((bin.unknownSex / maxCount) * 70, bin.unknownSex ? 12 : 2)}px`,
                totalHeight: `${Math.max((bin.total / maxCount) * 70, bin.total ? 12 : 2)}px`,
            }));
        },
        investigatorPhenotypeSignature(group) {
            const terms = this.specificCoObservedTerms.slice(0, 3).map((term) => this.termName(term.label));
            return terms.length
                ? `${terms.join(" · ")}`
                : "Matched-set phenotype signature not available";
        },
        investigatorExampleSamples(group) {
            return (group.outliers || []).slice(0, 3).map((sample) => sample.id).join(" · ") || "Not available";
        },
        togglePanel(panel) {
            this.openPanels[panel] = !this.openPanels[panel];
        },
        togglePhenotype(label) {
            this.activePhenotype = this.activePhenotype === label ? "" : label;
        },
        toggleResidualGroup(groupName) {
            this.activeResidualGroup = this.activeResidualGroup === groupName ? "" : groupName;
        },
        toggleExactCategory(category) {
            this.activeExactCategory = this.activeExactCategory === category ? "" : category;
        },
        toggleSampleProfileCategory(category) {
            this.activeSampleProfileCategory = this.activeSampleProfileCategory === category ? "" : category;
        },
        selectSample(sampleId) {
            this.activeOutlierSample = sampleId;
            this.diagnosisOpen = false;
            this.activeSampleProfileCategory = "Abnormality of the nervous system";
        },
        phenotypeTermHref(term) {
            return `/krPhenotype.html?term=${encodeURIComponent(term.id)}&label=${encodeURIComponent(term.label)}`;
        },
        sampleHref(sampleId) {
            return `/krSample.html?sample_id=${encodeURIComponent(sampleId)}`;
        },
        variantHref(query) {
            return `/krVariant.html?query=${encodeURIComponent(query)}`;
        },
        signalGenes(signals) {
            return String(signals || "")
                .split(",")
                .map((signal) => signal.trim())
                .filter(Boolean);
        },
    };
