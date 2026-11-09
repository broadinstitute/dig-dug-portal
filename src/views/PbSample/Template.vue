<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body pbg-page pbs-page">
            <div class="pbg-shell">
                <div class="pbg-toolbar">
                    <div class="pbg-toolbar-left">
                        <a href="/pb_Front.html" class="pbg-home-link" aria-label="PB portal home">
                            <b-icon-house-door-fill aria-hidden="true"></b-icon-house-door-fill>
                            <span>Home</span>
                        </a>
                        <span class="pbg-breadcrumb-sep">&gt;</span>
                        <span class="pbg-breadcrumb-link">Sample search</span>
                        <span class="pbg-breadcrumb-sep">&gt;</span>
                        <form class="pbg-gene-search-form" role="search" aria-label="Search another sample" @submit.prevent="submitSampleSearch">
                            <input
                                v-model.trim="searchQuery"
                                class="pbg-gene-search-input pbs-search-input"
                                type="search"
                                autocomplete="off"
                                spellcheck="false"
                                aria-label="CRDC sample ID"
                                placeholder="CRDC sample ID"
                            >
                            <button class="pbg-gene-search-submit" type="submit">Search</button>
                            <span v-if="searchError" class="pbg-gene-search-error" role="alert">{{ searchError }}</span>
                        </form>
                    </div>
                    <nav class="pbg-toolbar-right" aria-label="PB evidence pages">
                        <a href="/pb_phenotype.html" class="pbg-nav-link">Phenotype</a>
                        <a href="/pb_Gene.html" class="pbg-nav-link">Gene</a>
                        <a href="/pb_variant.html" class="pbg-nav-link">Variant</a>
                    </nav>
                </div>

                <p class="pbs-preview-note" aria-live="polite">
                    <template v-if="fixtureMode">
                        <strong>Illustrative mock data.</strong>
                        This page demonstrates how one sample connects to the existing PB phenotype, gene, and variant pages.
                    </template>
                    <template v-else-if="loading">
                        <strong>Connecting to private BioIndex.</strong>
                        Loading {{ requestedSampleId }}.
                    </template>
                    <template v-else>
                        <strong>Private BioIndex.</strong>
                        <span v-if="patientStatus === 'live'"> Sample metadata and recorded HPO terms loaded.</span>
                        <span v-if="patientStatus === 'unavailable'"> Sample metadata is unavailable: {{ patientError }}</span>
                        <span v-else-if="patientStatus === 'not-found'"> No patient/sample record was returned for {{ requestedSampleId }}.</span>
                    </template>
                </p>

                <main>
                    <section class="pbs-identity" aria-labelledby="sample-title">
                        <div>
                            <h1 id="sample-title">{{ displaySampleId }}</h1>
                            <div v-if="hasFamilyData" class="pbs-family">
                                <p>Family ID <strong>{{ familyId }}</strong></p>
                                <ul aria-label="Family members">
                                    <li v-for="member in orderedFamilyMembers" :key="member.sampleId">
                                        <span>{{ member.role }}</span>
                                        <a
                                            :href="sampleHref(member.sampleId)"
                                            :aria-current="member.sampleId === sample.sampleId ? 'page' : null"
                                        >{{ member.sampleId }}</a>
                                    </li>
                                </ul>
                            </div>
                            <p v-else class="pbs-no-family">No family data available for this sample.</p>
                        </div>
                        <dl class="pbs-metadata">
                            <div><dt>Affected</dt><dd>{{ sample.affected }}</dd></div>
                            <div><dt>Sex</dt><dd>{{ sample.sex }}</dd></div>
                            <div><dt>Age at enrollment</dt><dd>{{ sample.ageAtEnrollment }}</dd></div>
                            <div><dt>Project</dt><dd>{{ sample.projectName || 'Unavailable' }}</dd></div>
                            <div><dt>Total HPO term count</dt><dd>{{ fixtureMode || patientStatus === 'live' ? sample.phenotypeTotal : 'Unavailable' }}</dd></div>
                            <div class="pbs-metadata-wide">
                                <dt>Dominant HPO group</dt>
                                <dd v-if="dominantPhenotypeGroups.length">
                                    <span v-for="group in dominantPhenotypeGroups" :key="group.id" class="pbs-dominant-group">
                                        <a v-if="group.id !== 'other'" :href="phenotypeHref(group.id)">{{ group.label }} [{{ group.id }}]</a>
                                        <span v-else>{{ group.label }}</span>
                                    </span>
                                    <small>{{ dominantPhenotypeGroups[0].count }} distinct terms · {{ dominantPhenotypeGroups.length > 1 ? 'co-leading groups' : 'largest group' }} directly under HP:0000118</small>
                                </dd>
                                <dd v-else>Unavailable</dd>
                            </div>
                        </dl>
                    </section>

                    <div class="pbs-profile-tabs">
                        <div class="pbs-profile-tablist" role="tablist" aria-label="Sample profiles">
                            <button
                                id="sample-phenotype-tab"
                                type="button"
                                role="tab"
                                aria-controls="sample-phenotype-panel"
                                :aria-selected="activeProfileTab === 'phenotype' ? 'true' : 'false'"
                                @click="activeProfileTab = 'phenotype'"
                            >Phenotype profile</button>
                            <button
                                id="sample-genotype-tab"
                                type="button"
                                role="tab"
                                aria-controls="sample-genotype-panel"
                                :aria-selected="activeProfileTab === 'genotype' ? 'true' : 'false'"
                                @click="activeProfileTab = 'genotype'"
                            >Variants &amp; genotype</button>
                            <button id="sample-findings-tab" class="pbs-prioritized-tab" type="button" role="tab" aria-controls="sample-findings-panel" :aria-selected="activeProfileTab === 'findings' ? 'true' : 'false'" @click="activeProfileTab = 'findings'">Prioritized findings</button>
                        </div>

                        <section
                            v-show="activeProfileTab === 'phenotype'"
                            id="sample-phenotype-panel"
                            class="pbs-card"
                            role="tabpanel"
                            aria-labelledby="sample-phenotype-tab"
                        >
                            <header class="pbs-card-head">
                                <div>
                                    <h2 id="sample-phenotype-title">Phenotype profile</h2>
                                    <p v-if="sample.phenotypeTotal">{{ sample.phenotypeTotal }} recorded HPO terms · grouped directly under HP:0000118</p>
                                    <p v-else>No live sample HPO profile is connected.</p>
                                </div>
                                <a v-if="sample.phenotypeTotal && sample.phenotypeTotal <= 20" class="pbs-primary-link" :href="phenotypeProfileHref">Open phenotype page →</a>
                                <p v-else-if="sample.phenotypeTotal > 20">Choose an HPO term below to open its phenotype page. Combined profiles support up to 20 terms.</p>
                            </header>
                            <div class="pbs-phenotype-layout">
                                <div class="pbs-phenotype-groups" aria-label="Phenotype profile composition">
                                    <details v-for="group in visiblePhenotypeGroups" :key="group.id" class="pbs-phenotype-group">
                                        <summary
                                            :style="{ '--phenotype-fill': `${sample.phenotypeTotal ? Math.round(group.count / sample.phenotypeTotal * 100) : 0}%` }"
                                        >
                                            <h3>{{ group.label }} [{{ group.id }}]</h3>
                                            <strong>{{ group.count }} / {{ sample.phenotypeTotal }}</strong>
                                        </summary>
                                        <div class="pbs-phenotype-terms">
                                            <p class="pbs-hpo-tree-note">Recorded terms are marked. Additional parent terms show the hierarchy and do not increase the recorded term count.</p>
                                            <SampleHpoTree :nodes="phenotypeTree(group)" />
                                            <p v-if="!phenotypeTree(group).length">No descendant terms recorded in this group.</p>
                                            <p v-if="group.count > group.terms.length">
                                                {{ group.count - group.terms.length }} additional terms are not loaded in this design fixture.
                                            </p>
                                        </div>
                                    </details>
                                    <nav v-if="phenotypeGroupPageCount > 1" class="pbs-hpo-pagination" aria-label="HPO group pages">
                                        <span>Groups {{ (phenotypeGroupPage - 1) * 5 + 1 }}–{{ Math.min(phenotypeGroupPage * 5, orderedPhenotypeGroups.length) }} of {{ orderedPhenotypeGroups.length }}</span>
                                        <div><button type="button" :disabled="phenotypeGroupPage === 1" @click="phenotypeGroupPage--">Previous</button><span>{{ phenotypeGroupPage }} / {{ phenotypeGroupPageCount }}</span><button type="button" :disabled="phenotypeGroupPage >= phenotypeGroupPageCount" @click="phenotypeGroupPage++">Next</button></div>
                                    </nav>
                                </div>

                                <section class="pbs-phenotype-matches" aria-labelledby="phenotype-match-title">
                                    <div class="pbs-phenotype-match-head">
                                        <div>
                                            <h3 id="phenotype-match-title">Similar phenotype profiles</h3>
                                            <p v-if="sample.phenotypeMatchEligibleCount">{{ sample.phenotypeMatchEligibleCount.toLocaleString() }} PheRS-eligible samples · current sample and family excluded</p>
                                            <p v-else>{{ matchStatus === 'loading' ? 'Calculating similar profiles from the complete recorded HPO set…' : matchStatus === 'error' ? matchError : 'No HPO-annotated non-family candidates are available.' }}</p>
                                            <p v-if="matchStatus === 'ready'" class="pbs-match-method">Reference: {{ matchReferenceCount }} recorded HPO terms · ranked by residual PheRS · {{ matchExcludedCount }} self/family records excluded</p>
                                            <button v-if="matchStatus === 'error'" type="button" @click="loadSampleMatches">Retry profile calculation</button>
                                        </div>
                                        <div class="pbs-match-tabs" role="tablist" aria-label="Phenotype match summaries">
                                            <button
                                                id="phenotype-match-investigators-tab"
                                                type="button"
                                                role="tab"
                                                aria-controls="phenotype-match-investigators-panel"
                                                :aria-selected="activePhenotypeMatchView === 'investigators' ? 'true' : 'false'"
                                                @click="activePhenotypeMatchView = 'investigators'"
                                            >Projects</button>
                                            <button
                                                id="phenotype-match-samples-tab"
                                                type="button"
                                                role="tab"
                                                aria-controls="phenotype-match-samples-panel"
                                                :aria-selected="activePhenotypeMatchView === 'samples' ? 'true' : 'false'"
                                                @click="activePhenotypeMatchView = 'samples'"
                                            >Samples</button>
                                        </div>
                                    </div>

                                    <div
                                        v-show="activePhenotypeMatchView === 'samples'"
                                        id="phenotype-match-samples-panel"
                                        role="tabpanel"
                                        aria-labelledby="phenotype-match-samples-tab"
                                    >
                                        <div v-if="visiblePhenotypeMatches.length" class="pbs-match-table-wrap">
                                            <table class="pbs-match-table pbs-sample-match-table">
                                                <colgroup><col style="width:64px" /><col style="width:190px" /><col style="width:90px" /><col style="width:120px" /><col style="width:140px" /><col style="width:60px" /><col style="width:76px" /></colgroup>
                                                <thead>
                                                    <tr>
                                                        <th scope="col" :aria-sort="tableAriaSort('samples', 'rank')"><button type="button" class="pbs-sort-button" @click="toggleTableSort('samples', 'rank')">Rank <span aria-hidden="true">{{ tableSortIndicator('samples', 'rank') }}</span></button></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('samples', 'sampleId')"><button type="button" class="pbs-sort-button" @click="toggleTableSort('samples', 'sampleId')">Sample <span aria-hidden="true">{{ tableSortIndicator('samples', 'sampleId') }}</span></button></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('samples', 'matchedHpo')"><button type="button" class="pbs-sort-button" @click="toggleTableSort('samples', 'matchedHpo', 'desc')">Matched <span aria-hidden="true">{{ tableSortIndicator('samples', 'matchedHpo') }}</span></button></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('samples', 'rphersZ')"><button type="button" class="pbs-sort-button" @click="toggleTableSort('samples', 'rphersZ', 'desc')">rPheRS Z-score</button></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('samples', 'project')"><button type="button" class="pbs-sort-button" @click="toggleTableSort('samples', 'project')">Project <span aria-hidden="true">{{ tableSortIndicator('samples', 'project') }}</span></button></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('samples', 'age')"><button type="button" class="pbs-sort-button" @click="toggleTableSort('samples', 'age')">Age <span aria-hidden="true">{{ tableSortIndicator('samples', 'age') }}</span></button></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('samples', 'sex')"><button type="button" class="pbs-sort-button" @click="toggleTableSort('samples', 'sex')">Sex <span aria-hidden="true">{{ tableSortIndicator('samples', 'sex') }}</span></button></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="match in visiblePhenotypeMatches" :key="match.sampleId">
                                                        <td><strong>#{{ match.rank }}</strong></td>
                                                        <td><a :href="sampleHref(match.sampleId)">{{ match.sampleId }}</a></td>
                                                        <td><strong>{{ match.matchedHpo }} / {{ sample.phenotypeTotal }}</strong></td>
                                                        <td>{{ match.rphersZ == null ? 'Unavailable' : match.rphersZ.toFixed(2) }}</td>
                                                        <td>{{ match.project || 'Unavailable' }}</td>
                                                        <td>{{ match.age == null ? 'Unavailable' : match.age }}</td>
                                                        <td>{{ match.sex }}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <div class="pbs-match-table-actions" aria-live="polite">
                                                <span>Showing {{ visiblePhenotypeMatches.length }} of top {{ phenotypeMatchDisplayLimit }}</span>
                                                <div>
                                                    <button v-if="visiblePhenotypeMatches.length > 5" type="button" @click="visiblePhenotypeMatchCount = 5">Show first 5</button>
                                                    <button v-if="hasMorePhenotypeMatches" type="button" @click="showMorePhenotypeMatches">Show 5 more</button>
                                                </div>
                                            </div>
                                        </div>
                                        <p v-else class="pbs-match-empty">No eligible non-family phenotype matches are available.</p>
                                    </div>

                                    <div
                                        v-show="activePhenotypeMatchView === 'investigators'"
                                        id="phenotype-match-investigators-panel"
                                        role="tabpanel"
                                        aria-labelledby="phenotype-match-investigators-tab"
                                    >
                                        <div v-if="visibleInvestigatorSummary.length" class="pbs-match-table-wrap">
                                            <table class="pbs-match-table pbs-investigator-match-table">
                                                <thead>
                                                    <tr>
                                                        <th scope="col" :aria-sort="tableAriaSort('investigators', 'rank')"><button type="button" class="pbs-sort-button" @click="toggleTableSort('investigators', 'rank')">Rank <span aria-hidden="true">{{ tableSortIndicator('investigators', 'rank') }}</span></button></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('investigators', 'project')"><button type="button" class="pbs-sort-button" @click="toggleTableSort('investigators', 'project')">Project <span aria-hidden="true">{{ tableSortIndicator('investigators', 'project') }}</span></button></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('investigators', 'medianResidual')"><button type="button" class="pbs-sort-button" @click="toggleTableSort('investigators', 'medianResidual', 'desc')">Median residual PheRS <span aria-hidden="true">{{ tableSortIndicator('investigators', 'medianResidual') }}</span></button></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('investigators', 'iqr')"><button type="button" class="pbs-sort-button" @click="toggleTableSort('investigators', 'iqr')">IQR <span aria-hidden="true">{{ tableSortIndicator('investigators', 'iqr') }}</span></button></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('investigators', 'n')"><button type="button" class="pbs-sort-button" @click="toggleTableSort('investigators', 'n', 'desc')">n <span aria-hidden="true">{{ tableSortIndicator('investigators', 'n') }}</span></button></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="group in visibleInvestigatorSummary" :key="group.investigator" :class="{ 'pbs-current-investigator-row': group.currentGroup }">
                                                        <td><strong>#{{ group.rank }}</strong></td>
                                                        <td><strong>{{ group.project || 'Unavailable' }}</strong><small v-if="group.currentGroup">Current sample project</small></td>
                                                        <td>{{ group.medianResidual.toFixed(2) }}</td>
                                                        <td>{{ group.iqr }}</td>
                                                        <td>{{ group.n.toLocaleString() }}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <div class="pbs-match-table-actions" aria-live="polite">
                                                <span>Showing {{ visibleInvestigatorSummary.length }} of {{ sortedInvestigatorSummary.length }}</span>
                                                <div>
                                                    <button v-if="visibleInvestigatorSummary.length > 5" type="button" @click="visibleInvestigatorCount = 5">Show first 5</button>
                                                    <button v-if="hasMoreInvestigators" type="button" @click="showMoreInvestigators">Show 5 more</button>
                                                </div>
                                            </div>
                                            <p class="pbs-match-method">Calculated from all eligible samples, not only the top 50 displayed matches.</p>
                                        </div>
                                        <p v-else class="pbs-match-empty">No project-level phenotype summary is available.</p>
                                    </div>
                                </section>
                            </div>
                        </section>

                        <section
                            v-show="activeProfileTab === 'genotype'"
                            id="sample-genotype-panel"
                            class="pbs-card"
                            role="tabpanel"
                            aria-labelledby="sample-genotype-tab"
                        >
                            <header class="pbs-card-head">
                                <div>
                                    <h2 id="sample-genetics-title">Variants &amp; genotype</h2>
                                    <p>Sample variant calls in the processed evidence dataset</p>
                                </div>
                            </header>
                            <div class="pbs-all-variants" role="region" aria-label="All sample variant calls">
                                <p v-if="fixtureMode">{{ allVariantGeneGroups.length }} genes · {{ sample.allVariants.length }} variant calls in this design fixture</p>
                                <p v-else-if="variantStatus === 'loading'">Loading processed sample variant calls…</p>
                                <p v-else-if="variantStatus === 'error'">{{ variantError }} <button type="button" @click="loadSampleVariants">Retry variant loading</button></p>
                                <p v-else-if="variantStatus === 'ready'">{{ sample.allVariants.length }} variants across {{ allVariantGeneGroups.length }} genes · {{ variantScope }} · GRCh38</p>
                                <SampleVariants v-if="sample.allVariants.length" :variants="sample.allVariants" />
                            </div>
                            <p class="pbs-footnote">{{ fixtureMode ? 'Illustrative variant calls in this design fixture.' : 'This processed source contains nonsynonymous variants with DP ≥ 20 and cohort AF < 0.01. It does not contain every genome-wide variant call.' }}</p>
                        </section>
                        <PrioritizedFindings v-show="activeProfileTab === 'findings'" :variants="sample.variants" :connected="fixtureMode" :fixture-mode="fixtureMode" />
                    </div>
                </main>
            </div>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<script>
import SampleHpoTree from "./SampleHpoTree";
import SampleVariants from "./SampleVariants";
import PrioritizedFindings from "./PrioritizedFindings";
import { PB_SAMPLE_MOCK } from "./mockData";
import { fetchPbSampleBioIndexState } from "./pbSampleBioIndexAdapter";
const { familyIdFromSampleId, sortFamilyMembers } = require("./familyModel");
const { emptyPbSample } = require("./sampleRecord");
const { burdenPathogenicScore } = require("./variantEvidence");
const { samplePhenotypeTree } = require("./samplePhenotypeHierarchy");
const { sortedRows } = require("./tableSort");
const { requestSampleEvidence, sampleVariantRows } = require("./sampleEvidence");
import "@/views/PbGene/style.css";
import "./style.css";

export default {
    name: "PbSampleTemplate",
    components: { PrioritizedFindings, SampleVariants, SampleHpoTree },
    data() {
        const params = new URLSearchParams(window.location.search);
        const fixtureMode = params.get("fixture") === "1";
        const requestedId = params.get("query") || params.get("sample_id") || (fixtureMode ? PB_SAMPLE_MOCK.sampleId : "");
        return {
            requestedSampleId: requestedId,
            sample: fixtureMode ? PB_SAMPLE_MOCK : emptyPbSample(requestedId),
            fixtureMode,
            loading: !fixtureMode && Boolean(requestedId),
            patientStatus: fixtureMode ? "fixture" : "idle",
            patientError: "",
            matchStatus: fixtureMode ? 'ready' : 'idle', matchError: '', matchReferenceCount: 0, matchExcludedCount: 0,
            variantStatus: fixtureMode ? 'ready' : 'idle', variantError: '', variantScope: '',
            activeProfileTab: ["phenotype", "genotype", "findings"].includes(params.get("tab")) ? params.get("tab") : "phenotype",
            activePhenotypeMatchView: "samples",
            phenotypeGroupPage: 1,
            visiblePhenotypeMatchCount: 5,
            visibleInvestigatorCount: 5,
            phenotypeMatchLimit: 50,
            phenotypeMatchSort: { key: "rank", direction: "asc" },
            investigatorSort: { key: "rank", direction: "asc" },
            activeVariantView: "all",
            searchQuery: requestedId,
            searchError: "",
        };
    },
    mounted() {
        if (!this.fixtureMode && this.requestedSampleId) this.loadLiveSample();
    },
    computed: {
        displaySampleId() {
            return this.sample.sampleId || this.requestedSampleId || "No sample selected";
        },
        orderedPhenotypeGroups() {
            return [...this.sample.phenotypeGroups].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
        },
        phenotypeGroupPageCount() { return Math.max(1, Math.ceil(this.orderedPhenotypeGroups.length / 5)); },
        visiblePhenotypeGroups() { return this.orderedPhenotypeGroups.slice((this.phenotypeGroupPage - 1) * 5, this.phenotypeGroupPage * 5); },
        dominantPhenotypeGroups() {
            if (!this.orderedPhenotypeGroups.length) return [];
            const largestCount = this.orderedPhenotypeGroups[0].count;
            return this.orderedPhenotypeGroups.filter((group) => group.count === largestCount);
        },
        phenotypeMatchDisplayLimit() {
            return Math.min(this.sample.phenotypeMatches.length, this.phenotypeMatchLimit);
        },
        sortedPhenotypeMatches() {
            return sortedRows(this.sample.phenotypeMatches, this.phenotypeMatchSort);
        },
        visiblePhenotypeMatches() {
            return this.sortedPhenotypeMatches.slice(0, Math.min(this.visiblePhenotypeMatchCount, this.phenotypeMatchDisplayLimit));
        },
        hasMorePhenotypeMatches() {
            return this.visiblePhenotypeMatches.length < this.phenotypeMatchDisplayLimit;
        },
        sortedInvestigatorSummary() {
            return sortedRows(this.sample.investigatorPhenotypeSummary, this.investigatorSort);
        },
        visibleInvestigatorSummary() {
            return this.sortedInvestigatorSummary.slice(0, this.visibleInvestigatorCount);
        },
        hasMoreInvestigators() {
            return this.visibleInvestigatorSummary.length < this.sortedInvestigatorSummary.length;
        },
        filteredVariants() {
            return this.sample.variants.filter((variant) => variant.trackClass === this.activeVariantView);
        },
        allVariantGeneGroups() {
            const groups = new Map();
            this.sample.allVariants.forEach((variant) => {
                if (!groups.has(variant.gene)) groups.set(variant.gene, []);
                groups.get(variant.gene).push(variant);
            });
            return [...groups]
                .map(([gene, variants]) => ({
                    gene,
                    transcript: variants.find((variant) => variant.transcript)?.transcript || "Unavailable",
                    variants: variants.map((variant) => ({ ...variant, burdenScore: burdenPathogenicScore(variant) })),
                }))
                .sort((a, b) => a.gene.localeCompare(b.gene));
        },
        familyId() {
            return familyIdFromSampleId(this.sample.sampleId);
        },
        orderedFamilyMembers() {
            return sortFamilyMembers(this.sample.familyMembers);
        },
        hasFamilyData() {
            return this.familyId && this.orderedFamilyMembers.length > 1;
        },
        phenotypeProfileHref() {
            const query = this.sample.phenotypeGroups
                .reduce((terms, group) => terms.concat(group.terms), [])
                .map((phenotype) => phenotype.id)
                .join(", ");
            return `/pb_phenotype.html?query=${encodeURIComponent(query)}`;
        },
    },
    methods: {
        phenotypeTree: samplePhenotypeTree,
        async loadLiveSample() {
            try {
                const state = await fetchPbSampleBioIndexState(this.requestedSampleId);
                this.sample = state.sample;
                this.phenotypeGroupPage = 1;
                this.patientStatus = state.patientStatus;
                this.patientError = state.patientError;
                if (state.patientStatus === 'live') {
                    this.loadSampleMatches();
                    this.loadSampleVariants();
                }
            } catch (error) {
                this.patientStatus = "unavailable";
                this.patientError = error.message || "Unable to load private BioIndex data.";
            } finally {
                this.loading = false;
            }
        },
        async loadSampleMatches() {
            this.matchStatus = 'loading'; this.matchError = '';
            try {
                const data = await requestSampleEvidence('sample-matches', this.requestedSampleId);
                this.sample = { ...this.sample, phenotypeMatches: data.phenotypeMatches,
                    investigatorPhenotypeSummary: data.projectPhenotypeSummary,
                    phenotypeMatchEligibleCount: data.eligible_sample_count };
                this.matchReferenceCount = data.reference_hpo_count;
                this.matchExcludedCount = data.excluded_self_family_count;
                this.matchStatus = 'ready';
            } catch (error) { this.matchError = error.message; this.matchStatus = 'error'; }
        },
        async loadSampleVariants() {
            this.variantStatus = 'loading'; this.variantError = '';
            try {
                const data = await requestSampleEvidence('sample-variants', this.requestedSampleId);
                if (!data.rows.length) throw Error('This sample has no rows in the processed variant dataset; variant coverage is unavailable.');
                this.sample = { ...this.sample, allVariants: sampleVariantRows(data.rows) };
                this.variantScope = data.scope;
                this.variantStatus = 'ready';
            } catch (error) { this.variantError = error.message; this.variantStatus = 'error'; }
        },
        showMorePhenotypeMatches() {
            this.visiblePhenotypeMatchCount = Math.min(this.visiblePhenotypeMatchCount + 5, this.phenotypeMatchDisplayLimit);
        },
        showMoreInvestigators() {
            this.visibleInvestigatorCount = Math.min(this.visibleInvestigatorCount + 5, this.sortedInvestigatorSummary.length);
        },
        toggleTableSort(table, key, defaultDirection = "asc") {
            const sort = table === "samples" ? this.phenotypeMatchSort : this.investigatorSort;
            const nextSort = {
                key,
                direction: sort.key === key ? (sort.direction === "asc" ? "desc" : "asc") : defaultDirection,
            };
            if (table === "samples") this.phenotypeMatchSort = nextSort;
            else this.investigatorSort = nextSort;
        },
        tableAriaSort(table, key) {
            const sort = table === "samples" ? this.phenotypeMatchSort : this.investigatorSort;
            if (sort.key !== key) return "none";
            return sort.direction === "asc" ? "ascending" : "descending";
        },
        tableSortIndicator(table, key) {
            const sort = table === "samples" ? this.phenotypeMatchSort : this.investigatorSort;
            if (sort.key !== key) return "↕";
            return sort.direction === "asc" ? "▲" : "▼";
        },
        toggleVariantView(view) {
            this.activeVariantView = this.activeVariantView === view ? "" : view;
        },
        submitSampleSearch() {
            const query = this.searchQuery.trim();
            if (!/^(?:BCH|CRDC)-[A-Za-z0-9-]+$/i.test(query)) {
                this.searchError = "Enter a BCH or CRDC sample ID.";
                return;
            }
            window.location.assign(`/pb_sample.html?query=${encodeURIComponent(query)}`);
        },
        phenotypeHref(hpoId) {
            return `/pb_phenotype.html?query=${encodeURIComponent(hpoId)}`;
        },
        sampleHref(sampleId) {
            return `/pb_sample.html?query=${encodeURIComponent(sampleId)}`;
        },
        geneHref(gene) {
            return `/pb_Gene.html?query=${encodeURIComponent(gene)}`;
        },
        variantHref(variant) {
            return `/pb_variant.html?query=${encodeURIComponent(variant.id)}&gene=${encodeURIComponent(variant.gene)}`;
        },
        orphaHref(diseaseId) {
            return `https://www.orpha.net/en/disease/detail/${diseaseId.replace("ORPHA:", "")}`;
        },
    },
};
</script>
