<template>
    <div class="pb-guide-page">
        <portal-guide section="sample" />
        <page-header
            hide-portal-chrome
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
                        <a href="/pb_gene2.html" class="pbg-nav-link">Gene</a>
                        <a href="/pb_variant.html" class="pbg-nav-link">Variant</a>
                    </nav>
                </div>

                <p v-if="fixtureMode || loading || patientStatus !== 'live'" class="pbs-preview-note" aria-live="polite">
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
                            <h1 id="sample-title"><span class="pbs-sample-mark pbs-searched-id">{{ displaySampleId }}</span></h1>
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
                            <div><dt>Project</dt><dd>{{ sample.projectName || 'Unavailable' }}<small class="pbs-project-investigator">{{ sample.investigator || 'Unavailable' }}</small></dd></div>
                            <div><dt>Total HPO term count</dt><dd>{{ fixtureMode || patientStatus === 'live' ? sample.phenotypeTotal : 'Unavailable' }}</dd></div>
                            <div class="pbs-metadata-wide">
                                <dt>Dominant HPO group</dt>
                                <dd v-if="dominantPhenotypeGroups.length">
                                    <span v-for="group in dominantPhenotypeGroups" :key="group.id" class="pbs-dominant-group">
                                        <template v-if="group.id !== 'other'"><span>{{ group.label }}</span> <a class="pbs-hpo-id" :href="phenotypeHref(group.id)">{{ group.id }}</a></template>
                                        <span v-else>{{ group.label }}</span>
                                    </span>
                                    <small>{{ dominantPhenotypeGroups[0].count }} recorded terms{{ dominantPhenotypeGroups.length > 1 ? ' · co-leading groups' : '' }}</small>
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
                            >Variant profile</button>
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
                                    <h2 id="sample-phenotype-title">Phenotype profile <SampleInfo label="Phenotype hierarchy" :text="help.hierarchy" /></h2>
                                    <p v-if="sample.phenotypeTotal">{{ sample.phenotypeTotal }} recorded HPO terms</p>
                                    <p v-else>No live sample HPO profile is connected.</p>
                                </div>
                                <a v-if="sample.phenotypeTotal && sample.phenotypeTotal <= 20" class="pbs-primary-link" :href="phenotypeProfileHref">Open phenotype page →</a>
                                <p v-else-if="sample.phenotypeTotal > 20">Choose an HPO term below to open its phenotype page. Combined profiles support up to 20 terms.</p>
                            </header>
                            <div class="pbs-phenotype-layout">
                                <div class="pbs-phenotype-groups" aria-label="Phenotype profile composition">
                                    <details class="pbs-hpo-root" open>
                                        <summary><span>Phenotypic abnormality</span> <a class="pbs-hpo-id" :href="phenotypeHref('HP:0000118')" @click.stop>HP:0000118</a></summary>
                                    <details v-for="group in visiblePhenotypeGroups" :key="group.id" class="pbs-phenotype-group" :open="orderedPhenotypeGroups.length === 1">
                                        <summary>
                                            <h3>{{ group.label }} <a v-if="group.id !== 'other'" class="pbs-hpo-id" :href="phenotypeHref(group.id)" @click.stop>{{ group.id }}</a></h3>
                                            <strong>{{ group.count }} / {{ sample.phenotypeTotal }}</strong>
                                        </summary>
                                        <div class="pbs-phenotype-terms">
                                            <SampleHpoTree :nodes="phenotypeTree(group)" />
                                            <p v-if="!phenotypeTree(group).length">No descendant terms recorded in this group.</p>
                                            <p v-if="group.count > group.terms.length">
                                                {{ group.count - group.terms.length }} additional terms are not loaded in this design fixture.
                                            </p>
                                        </div>
                                    </details>
                                    <p>Groups {{ (phenotypeGroupPage - 1) * 5 + 1 }}–{{ Math.min(phenotypeGroupPage * 5, orderedPhenotypeGroups.length) }} of {{ orderedPhenotypeGroups.length }}</p>
                                    <SummaryPager :page="phenotypeGroupPage" :total-pages="phenotypeGroupPageCount" label="HPO group pages" input-id="pbs-hpo-group-page" @change="phenotypeGroupPage = $event" />
                                    </details>
                                </div>

                                <section class="pbs-phenotype-matches" aria-labelledby="phenotype-match-title">
                                    <div class="pbs-phenotype-match-head">
                                        <div>
                                            <h3 id="phenotype-match-title">Similar phenotype profiles <SampleInfo label="Similar phenotype profiles" :text="help.similar" /></h3>
                                            <p v-if="sample.phenotypeMatchEligibleCount">{{ sample.phenotypeMatchEligibleCount.toLocaleString() }} samples<span v-if="phenotypeMatchScoredCount != null"> · {{ phenotypeMatchScoredCount.toLocaleString() }} with phenotype scores</span></p>
                                            <p v-else>{{ matchStatus === 'loading' ? 'Calculating similar profiles from the complete recorded HPO set…' : matchStatus === 'error' ? matchError : 'No HPO-annotated non-family candidates are available.' }}</p>
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

                                    <p v-if="referenceScores" class="pbs-reference-baseline"><span>Searched sample</span> <strong class="pbs-sample-mark pbs-searched-id">{{ displaySampleId }}</strong><span>rPheRS Z-score</span> <strong>{{ referenceScores.rphersZ == null ? 'Unavailable' : referenceScores.rphersZ.toFixed(2) }}</strong><SampleInfo label="Searched sample rPheRS Z-score" :text="help.referenceScore" /></p>

                                    <div
                                        v-show="activePhenotypeMatchView === 'samples'"
                                        id="phenotype-match-samples-panel"
                                        role="tabpanel"
                                        aria-labelledby="phenotype-match-samples-tab"
                                    >
                                        <div v-if="visiblePhenotypeMatches.length" class="pbs-match-table-wrap">
                                            <table class="pbs-match-table pbs-sample-match-table">
                                                <colgroup><col style="width:2.5%" /><col style="width:7%" /><col style="width:18%" /><col style="width:8%" /><col style="width:8%" /><col style="width:10%" /><col style="width:8%" /><col style="width:8%" /><col style="width:30.5%" /></colgroup>
                                                <thead>
                                                    <tr>
                                                        <th scope="col" class="pbs-match-pin" aria-label="Pin sample"><b-icon-pin-angle aria-hidden="true" /></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('samples', 'rank')"><div class="pbs-column-heading"><button type="button" class="pbs-sort-button" @click="toggleTableSort('samples', 'rank')">Rank <span aria-hidden="true">{{ tableSortIndicator('samples', 'rank') }}</span></button><SampleInfo label="Sample rank" :text="help.sampleRank" /></div></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('samples', 'sampleId')"><button type="button" class="pbs-sort-button" @click="toggleTableSort('samples', 'sampleId')">Sample <span aria-hidden="true">{{ tableSortIndicator('samples', 'sampleId') }}</span></button></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('samples', 'matchedHpo')"><div class="pbs-column-heading"><button type="button" class="pbs-sort-button" @click="toggleTableSort('samples', 'matchedHpo', 'desc')">Matched <span aria-hidden="true">{{ tableSortIndicator('samples', 'matchedHpo') }}</span></button><SampleInfo label="Matched HPO terms" :text="help.matched" /></div></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('samples', 'recordedHpoCount')"><div class="pbs-column-heading"><button type="button" class="pbs-sort-button" @click="toggleTableSort('samples', 'recordedHpoCount', 'desc')">Recorded HPO <span aria-hidden="true">{{ tableSortIndicator('samples', 'recordedHpoCount') }}</span></button><SampleInfo label="Recorded HPO count" :text="help.recordedHpo" /></div></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('samples', 'rphersZ')"><div class="pbs-column-heading"><button type="button" class="pbs-sort-button" @click="toggleTableSort('samples', 'rphersZ', 'desc')">rPheRS Z-score</button><SampleInfo label="rPheRS Z-score" :text="help.rphersZ" /></div></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('samples', 'sharedGenes')"><div class="pbs-column-heading"><button type="button" class="pbs-sort-button" @click="toggleTableSort('samples', 'sharedGenes', 'desc')">Shared genes <span aria-hidden="true">{{ tableSortIndicator('samples', 'sharedGenes') }}</span></button><SampleInfo label="Shared genes" :text="help.sharedGenes" /></div></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('samples', 'sharedVariants')"><div class="pbs-column-heading"><button type="button" class="pbs-sort-button" @click="toggleTableSort('samples', 'sharedVariants', 'desc')">Shared variants <span aria-hidden="true">{{ tableSortIndicator('samples', 'sharedVariants') }}</span></button><SampleInfo label="Shared variants" :text="help.sharedVariants" /></div></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('samples', 'project')"><button type="button" class="pbs-sort-button" @click="toggleTableSort('samples', 'project')">Project <span aria-hidden="true">{{ tableSortIndicator('samples', 'project') }}</span></button></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <template v-for="match in visiblePhenotypeMatches">
                                                    <tr :key="match.sampleId" :class="{ 'pbs-pinned-match': pinnedPhenotypeMatchIds.includes(match.sampleId) }">
                                                        <td class="pbs-match-pin"><button type="button" :aria-label="(pinnedPhenotypeMatchIds.includes(match.sampleId) ? 'Unpin ' : 'Pin ') + match.sampleId" :aria-pressed="String(pinnedPhenotypeMatchIds.includes(match.sampleId))" @click="togglePhenotypeMatchPin(match.sampleId)"><b-icon-pin-angle-fill v-if="pinnedPhenotypeMatchIds.includes(match.sampleId)" aria-hidden="true" /><b-icon-pin-angle v-else aria-hidden="true" /></button></td>
                                                        <td><strong>#{{ match.rank }}</strong></td>
                                                        <td><div class="pbs-sample-identity"><button type="button" class="pbs-disclosure" :aria-label="'Compare ' + match.sampleId" :aria-expanded="String(expandedMatchIds.includes(match.sampleId))" :aria-controls="'pbs-comparison-' + match.sampleId" @click="toggleMatchComparison(match.sampleId)"><b-icon-caret-down-fill v-if="expandedMatchIds.includes(match.sampleId)" aria-hidden="true"/><b-icon-caret-right-fill v-else aria-hidden="true"/></button><a class="pbs-sample-mark pbs-compared-id" :href="sampleHref(match.sampleId)">{{ match.sampleId }}</a></div></td>
                                                        <td><button v-if="match.matchedHpo != null" type="button" class="pbs-count-link" @click="toggleMatchComparison(match.sampleId)">{{ match.matchedHpo }} / {{ matchReferenceCount || sample.phenotypeTotal }}</button><span v-else>Unavailable</span></td>
                                                        <td>{{ match.recordedHpoCount == null ? 'Unavailable' : match.recordedHpoCount }}</td>
                                                        <td>{{ match.rphersZ == null ? 'Unavailable' : match.rphersZ.toFixed(2) }}</td>
                                                        <td><button v-if="match.sharedGenes != null" type="button" class="pbs-count-link" @click="toggleMatchComparison(match.sampleId)">{{ match.sharedGenes }}</button><span v-else>Unavailable</span></td>
                                                        <td><button v-if="match.sharedVariants != null" type="button" class="pbs-count-link" @click="toggleMatchComparison(match.sampleId)">{{ match.sharedVariants }}</button><span v-else>Unavailable</span></td>
                                                        <td>{{ match.project || 'Unavailable' }}<small class="pbs-project-investigator">{{ match.investigator || 'Unavailable' }}</small></td>
                                                    </tr>
                                                    <tr v-if="expandedMatchIds.includes(match.sampleId)" :key="match.sampleId + '-comparison'" class="pbs-comparison-row"><td colspan="9"><SampleComparison :reference-id="requestedSampleId" :candidate-id="match.sampleId" /></td></tr>
                                                    </template>
                                                </tbody>
                                            </table>
                                            <SamplePagination label="Similar phenotype sample pages" :page="phenotypeMatchPagination.page" :page-count="phenotypeMatchPagination.pageCount" @change="phenotypeMatchPage = $event" />
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
                                                <colgroup><col style="width:6%" /><col style="width:48%" /><col style="width:20%" /><col style="width:16%" /><col style="width:10%" /></colgroup>
                                                <thead>
                                                    <tr>
                                                        <th scope="col" :aria-sort="tableAriaSort('investigators', 'rank')"><div class="pbs-column-heading"><button type="button" class="pbs-sort-button" @click="toggleTableSort('investigators', 'rank')">Rank <span aria-hidden="true">{{ tableSortIndicator('investigators', 'rank') }}</span></button><SampleInfo label="Project rank" :text="help.projectRank" /></div></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('investigators', 'project')"><button type="button" class="pbs-sort-button" @click="toggleTableSort('investigators', 'project')">Project <span aria-hidden="true">{{ tableSortIndicator('investigators', 'project') }}</span></button></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('investigators', 'medianResidual')"><button type="button" class="pbs-sort-button" @click="toggleTableSort('investigators', 'medianResidual', 'desc')">Median residual PheRS <span aria-hidden="true">{{ tableSortIndicator('investigators', 'medianResidual') }}</span></button></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('investigators', 'iqr')"><button type="button" class="pbs-sort-button" @click="toggleTableSort('investigators', 'iqr')">IQR <span aria-hidden="true">{{ tableSortIndicator('investigators', 'iqr') }}</span></button></th>
                                                        <th scope="col" :aria-sort="tableAriaSort('investigators', 'n')"><button type="button" class="pbs-sort-button" @click="toggleTableSort('investigators', 'n', 'desc')">Scored n <span aria-hidden="true">{{ tableSortIndicator('investigators', 'n') }}</span></button><SampleInfo label="Project summary population" :text="help.projectComparison" /></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <template v-for="group in visibleInvestigatorSummary"><tr :key="group.project" :class="{ 'pbs-current-investigator-row': group.currentGroup }">
                                                        <td><strong>#{{ group.rank }}</strong></td>
                                                        <td><button type="button" class="pbs-project-toggle" :aria-label="'Project statistics for ' + group.project" :aria-expanded="String(expandedProjectNames.includes(group.project))" @click="toggleProjectComparison(group.project)"><span class="pbs-gene-chevron" aria-hidden="true"><b-icon-caret-down-fill v-if="expandedProjectNames.includes(group.project)"/><b-icon-caret-right-fill v-else/></span><strong>{{ group.project || 'Unavailable' }}</strong></button><small class="pbs-project-investigator">{{ projectInvestigators(group) }}</small><small v-if="group.currentGroup" class="pbs-current-project-label">Current sample project</small></td>
                                                        <td>{{ group.medianResidual.toFixed(2) }}</td>
                                                        <td>{{ group.iqr }}</td>
                                                        <td>{{ group.n.toLocaleString() }}</td>
                                                    </tr>
                                                    <tr v-if="expandedProjectNames.includes(group.project)" :key="group.project + '-statistics'" class="pbs-project-expanded"><td colspan="5"><ProjectComparison :project="group.project" :rows="projectMatchGroups.get(group.project) || []" :reference-id="requestedSampleId" :reference-hpo-count="matchReferenceCount || sample.phenotypeTotal" /></td></tr>
                                                    </template>
                                                </tbody>
                                            </table>
                                            <SamplePagination label="Similar phenotype project pages" :page="projectSummaryPage" :page-count="projectSummaryPageCount" @change="projectSummaryPage = $event" />
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
                                    <h2 id="sample-genetics-title">Variant profile <SampleInfo label="Variant dataset coverage" :text="help.variantScope" /></h2>
                                </div>
                            </header>
                            <div class="pbs-all-variants" role="region" aria-label="All sample variant calls">
                                <p v-if="variantStatus === 'loading'">Loading processed sample variant calls…</p>
                                <p v-else-if="variantStatus === 'error'">{{ variantError }} <button type="button" @click="loadSampleVariants">Retry variant loading</button></p>
                                <SampleVariants v-if="sample.allVariants.length" :variants="sample.allVariants" />
                            </div>
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
import PortalGuide from "@/components/pb/PortalGuide.vue";
import SummaryPager from "../PbGene/SummaryPager";
import SampleHpoTree from "./SampleHpoTree";
import SampleVariants from "./SampleVariants";
import SamplePagination from "./SamplePagination";
import SampleInfo from "./SampleInfo";
import SampleComparison from "./SampleComparison";
import ProjectComparison from "./ProjectComparison.vue";
import PrioritizedFindings from "./PrioritizedFindings";
import { PB_SAMPLE_MOCK } from "./mockData";
import { fetchPbSampleBioIndexState } from "./pbSampleBioIndexAdapter";
const { familyIdFromSampleId, sortFamilyMembers } = require("./familyModel");
const { emptyPbSample } = require("./sampleRecord");
const { burdenPathogenicScore } = require("./variantEvidence");
const { samplePhenotypeTree } = require("./samplePhenotypeHierarchy");
const { sortedRows, withPinnedRows, paginatePinnedRows } = require("./tableSort");
const { requestSampleEvidence, sampleVariantRows } = require("./sampleEvidence");
const help = require('./sampleHelp');
import "@/views/PbGene/style.css";
import "./style.css";

export default {
    name: "PbSampleTemplate",
    components: { SummaryPager, PortalGuide, PrioritizedFindings, SampleVariants, SampleHpoTree, SamplePagination, SampleInfo, SampleComparison, ProjectComparison },
    data() {
        const params = new URLSearchParams(window.location.search);
        const fixtureMode = params.get("fixture") === "1";
        const requestedId = params.get("query") || params.get("sample_id") || (fixtureMode ? PB_SAMPLE_MOCK.sampleId : "");
        return {
            help,
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
            phenotypeMatchPage: 1,
            projectSummaryPage: 1,
            phenotypeMatchScoredCount: null,
            referenceScores: null,
            expandedMatchIds: [],
            expandedProjectNames: [],
            phenotypeMatchSort: { key: "rank", direction: "asc" },
            pinnedPhenotypeMatchIds: [],
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
        sortedPhenotypeMatches() {
            return withPinnedRows(sortedRows(this.sample.phenotypeMatches, this.phenotypeMatchSort), this.pinnedPhenotypeMatchIds);
        },
        phenotypeMatchPagination() { return paginatePinnedRows(this.sortedPhenotypeMatches, this.pinnedPhenotypeMatchIds, this.phenotypeMatchPage); },
        visiblePhenotypeMatches() { return this.phenotypeMatchPagination.rows; },
        projectMatchGroups() {
            const groups = new Map();
            for (const row of this.sample.phenotypeMatches) {
                const key = row.project || 'Unavailable';
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key).push(row);
            }
            return groups;
        },
        sortedInvestigatorSummary() {
            return sortedRows(this.sample.investigatorPhenotypeSummary, this.investigatorSort);
        },
        visibleInvestigatorSummary() {
            return this.sortedInvestigatorSummary.slice((this.projectSummaryPage - 1) * 5, this.projectSummaryPage * 5);
        },
        projectSummaryPageCount() { return Math.max(1, Math.ceil(this.sortedInvestigatorSummary.length / 5)); },
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
        togglePhenotypeMatchPin(id) { this.pinnedPhenotypeMatchIds = this.pinnedPhenotypeMatchIds.includes(id) ? this.pinnedPhenotypeMatchIds.filter(value => value !== id) : [...this.pinnedPhenotypeMatchIds, id]; },
        projectInvestigators(group) { return Array.isArray(group.investigators) && group.investigators.length ? group.investigators.join(', ') : group.investigator || 'Unavailable'; },
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
                this.phenotypeMatchPage = 1; this.projectSummaryPage = 1;
                this.pinnedPhenotypeMatchIds = this.pinnedPhenotypeMatchIds.filter(id => data.phenotypeMatches.some(row => row.sampleId === id));
                this.sample = { ...this.sample, phenotypeMatches: data.phenotypeMatches,
                    investigatorPhenotypeSummary: data.projectPhenotypeSummary,
                    phenotypeMatchEligibleCount: data.eligible_sample_count };
                this.matchReferenceCount = data.reference_hpo_count;
                this.referenceScores = data.reference_scores || null;
                this.phenotypeMatchScoredCount = data.phenotype_scored_sample_count;
                this.expandedMatchIds = [];
                this.expandedProjectNames = [];
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
        toggleProjectComparison(name) { this.expandedProjectNames = this.expandedProjectNames.includes(name) ? this.expandedProjectNames.filter(value => value !== name) : [...this.expandedProjectNames, name]; },
        toggleMatchComparison(id) { this.expandedMatchIds = this.expandedMatchIds.includes(id) ? this.expandedMatchIds.filter(value => value !== id) : [...this.expandedMatchIds, id]; },
        toggleTableSort(table, key, defaultDirection = "asc") {
            if (table === 'samples') this.phenotypeMatchPage = 1;
            else this.projectSummaryPage = 1;
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
            return `/pb_gene2.html?query=${encodeURIComponent(gene)}`;
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
