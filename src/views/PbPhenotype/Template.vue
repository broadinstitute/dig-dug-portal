<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>
        <main class="container-fluid mdkp-body pbp-page">
            <div class="pbp-shell">
                <div class="pbp-toolbar">
                    <div class="pbp-toolbar-left">
                        <a href="/pb_front2.html" class="pbp-home-link"><b-icon-house-door-fill aria-hidden="true" /><span>Home</span></a>
                        <span class="pbp-breadcrumb-sep">›</span><span class="pbp-breadcrumb-link">Phenotype search</span>
                    </div>
                    <div class="pbp-toolbar-right"><a href="/pb_gene2.html" class="pbp-nav-link">Gene search</a><a href="/pb_variant.html" class="pbp-nav-link">Variant search</a></div>
                </div>
                <section class="pbp-card pbp-search-results">
                    <phenotype-profile-editor ref="profileEditor" :ids="ids" :excluded="excluded" :rules="advancedRules" :match-mode="sampleMatchMode" :minimum="sampleMatchMinimum" :search-index="hpoSearchIndex" :terms="reference.terms"
                        :investigators="investigatorOptions" :projects="projectOptions" :sample-counts="hpoSampleCounts" :counts-status="hpoCountsStatus" :term-style="termStyle" @apply="applyProfile" @retry-counts="retryHpoAvailability" />
                </section>
                <single-phenotype-results v-if="singlePhenotypeView || multi" :key="ids.join(',')" :hpo="ids[0]" :profile-ids="ids" :match-mode="sampleMatchMode" :minimum="effectiveMatchMinimum" :term-style="termStyle" :multi-gene-result="multiGeneResult" :multi-gene-loading="multiGeneLoading" :multi-gene-error="multiGeneError" :terms="reference.terms" :samples="singlePhenotypeSamples"
                    :cohort-count="cohortSampleCount" :counts="hpoSampleCounts" :ready="matchesLoaded" :loading="sampleLoading" :error="sampleError"
                    :gene-rows="geneRows" :gene-release="genes" :gene-loading="geneLoading" :gene-error="geneError" :diseases="diseases" :sources="diseaseSources" :source="diseaseSource"
                    @require="requireSingleFeature" @exclude="excludeSingleFeature" @retry-comparison="loadMultiGeneComparison" @source="diseaseSource = $event" @retry-samples="loadSamples" @retry-genes="loadGenes" />
                <template v-else-if="ids.length">
                    <section class="pbp-card pbp-projects">
                        <div class="pbp-rowhead">
                            <div>
                                <span class="pbp-tag crdc">CRDC · OBSERVED HPO</span>
                                <h2>Project summary <span class="pbp-heading-count">· {{ cohortDiseaseSummary.length }} groups</span></h2>
                                <p class="pbp-project-selection" aria-live="polite">{{ selectedProjects.length ? `${selectedProjects.length} ${selectedProjects.length === 1 ? 'project' : 'projects'} selected` : 'All projects' }} · {{ matchesLoaded ? qualifyingSamples.length.toLocaleString() : '—' }} samples</p>
                            </div>
                            <button v-if="selectedProjects.length" type="button" class="pbp-btn" @click="selectedProjects = []">Show all projects</button>
                        </div>
                        <div v-if="selectedProjects.length" class="pbp-project-chips" aria-label="Selected projects">
                            <button v-for="project in selectedProjects" :key="project" type="button" class="pbp-btn small"
                                :aria-label="`Remove project filter ${project}`" @click="selectedProjects = selectedProjects.filter(name => name !== project)">
                                {{ project }} <span aria-hidden="true">×</span>
                            </button>
                        </div>
                        <p v-if="sampleInfoLoading" class="pbp-sub" role="status">Loading Project labels for matching samples…</p>

                        <p v-if="sampleLoading" class="pbp-status">
                            Loading CRDC samples…
                        </p>
                        <p v-else-if="sampleError" class="pbp-status">
                            {{ sampleError }}
                            <button type="button" @click="loadSamples">
                                Retry
                            </button>
                        </p>
                        <div v-if="matchesLoaded" class="pbp-project-table">

                            <phenotype-help label="Project summary">
                                <p class="pbp-sub">
                                    {{ selectedSampleLabel }}. Projects include matching samples after age, sex, affected and Exclude filters. Select project checkboxes to update the demographics and sample list below. With no projects selected, all projects are included. Project names use
                                    the same metadata as the sample rows. Age: median (25th–75th percentile), years. Sex: female / male /
                                    unknown. Hover over or focus an age or mean score to see how many samples contributed.
                                    An asterisk (*) indicates missing or unavailable values; those samples are omitted from that statistic.
                                    {{ projectMetadataSource === 'samples-info' ? 'Project and investigator labels use the same samples-info metadata as Gene and Variant.' : 'Project and investigator labels use the configured cohort mapping.' }}
                                    Missing project labels are shown as Unknown. Investigators are listed once per project.
                                </p></phenotype-help
                            >
                            <div class="pbp-table-scroll">
                                <table>
                                    <thead><tr>
                                        <th class="pbp-project-check"><span class="sr-only">Select project</span></th>
                                        <th><button class="pbp-sort" @click="toggleSort('cohorts', 'name')">Project / Investigator {{ sortIndicator('cohorts', 'name') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('cohorts', 'total')">Samples {{ sortIndicator('cohorts', 'total') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('cohorts', 'affected')">Affected {{ sortIndicator('cohorts', 'affected') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('cohorts', 'medianAge')">Age · median (Q1–Q3) {{ sortIndicator('cohorts', 'medianAge') }}</button></th>
                                        <th><button class="pbp-sort" title="Sort by female sample count" @click="toggleSort('cohorts', 'sex')">Sex · F / M / unknown {{ sortIndicator('cohorts', 'sex') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('cohorts', 'phers')">Mean rPheRS Z-score {{ sortIndicator('cohorts', 'phers') }}</button></th>
                                    </tr></thead>
                                    <tbody><tr v-for="item in visibleCohortDiseaseSummary" :key="item.name" :class="{ 'pbp-project-selected': selectedProjects.includes(item.name) }">
                                        <td class="pbp-project-check"><input type="checkbox" v-model="selectedProjects" :value="item.name" :aria-label="`Include project ${item.name}`" :disabled="sampleInfoLoading" /></td>
                                        <td>{{ item.name }}<small class="pbp-project-investigator">{{ item.investigators.length ? `Investigator: ${item.investigators.join(', ')}` : 'Investigator unavailable' }}</small></td><td>{{ item.total.toLocaleString() }}</td><td>{{ item.affected.toLocaleString() }}</td>
                                        <td class="pbp-cohort-stat">
                                            <span class="pbp-stat-help" tabindex="0" v-b-tooltip.hover.focus.top
                                                :title="`${item.ageKnown.toLocaleString()} / ${item.total.toLocaleString()} valid ages; ${item.total - item.ageKnown} missing or outside 0–100 years. Statistics use valid ages only.`"
                                                :aria-label="`Age: median ${ageStat(item.medianAge)}${item.medianAge != null ? `, Q1 ${ageStat(item.q1Age)}, Q3 ${ageStat(item.q3Age)}` : ''}. ${item.ageKnown} of ${item.total} valid ages; ${item.total - item.ageKnown} unavailable.`">
                                                {{ ageStat(item.medianAge) }}<template v-if="item.medianAge != null"> ({{ ageStat(item.q1Age) }}–{{ ageStat(item.q3Age) }})</template><sup v-if="item.ageKnown < item.total" class="pbp-stat-missing" aria-hidden="true">*</sup>
                                            </span>
                                        </td>
                                        <td class="pbp-cohort-stat">{{ item.sex.female.toLocaleString() }} / {{ item.sex.male.toLocaleString() }} / {{ item.sex.unknown.toLocaleString() }}</td>
                                        <td class="pbp-cohort-stat">
                                            <span class="pbp-stat-help" tabindex="0" v-b-tooltip.hover.focus.top
                                                :title="`${item.phersKnown.toLocaleString()} / ${item.total.toLocaleString()} scored; ${item.total - item.phersKnown} unavailable. Mean uses available rPheRS Z-scores only.`"
                                                :aria-label="`Mean rPheRS Z-score: ${item.meanResidualPhers == null ? 'unavailable' : score(item.meanResidualPhers)}. ${item.phersKnown} of ${item.total} scored; ${item.total - item.phersKnown} unavailable.`">
                                                {{ item.meanResidualPhers == null ? "—" : score(item.meanResidualPhers) }}<sup v-if="item.phersKnown < item.total" class="pbp-stat-missing" aria-hidden="true">*</sup>
                                            </span>
                                        </td>
                                    </tr></tbody>
                                </table>
                            </div>
                            <div class="pbp-pagination">
                                <button type="button" :disabled="cohortPage <= 1" @click="cohortPage--">Previous</button>
                                <span>Page {{ cohortPage }} / {{ cohortPageCount }} · {{ cohortDiseaseSummary.length }} groups</span>
                                <button type="button" :disabled="cohortPage >= cohortPageCount" @click="cohortPage++">Next</button>
                            </div>
                        </div>
                        <details class="pbp-query-details">
                            <summary>
                                <span>Phenotype counts and context</span>
                                <span v-if="ageBandFilter || sexFilter || affectedFilter || excluded.length || advancedRules.length" class="pbp-active-filters">Filters active</span>
                            </summary>
                            <div class="pbp-query-details-content">
                                <div class="pbp-term-summary" aria-label="Query term context">
                                    <p class="pbp-term-summary-note">Disease counts use external Orphanet annotations.</p>
                                    <div
                                        v-for="item in termSummaries"
                                        :key="item.id"
                                        class="pbp-term-summary-row"
                                        :style="termStyle(item.id)"
                                    >
                                        <span class="pbp-term-summary-name"><i></i>{{ name(item.id) }}</span>
                                        <span>{{ countChange(item.samples, item.remainingSamples, 'samples') }}{{ excluded.length || item.percent == null ? "" : ` (${item.percent}%)` }}</span>
                                        <span>{{ countChange(item.diseases, item.remainingDiseases, 'diseases') }}</span>
                                        <span>{{ countChange(item.veryFrequent, item.remainingVeryFrequent, 'diseases with ≥80% frequency') }}</span>
                                        <div v-for="excludedItem in item.exclusions" :key="excludedItem.id" class="pbp-term-summary-excluded">
                                            <span>− {{ name(excludedItem.id) }}</span>
                                            <span>{{ excludedItem.samples == null ? "—" : excludedItem.samples.toLocaleString() }} samples excluded</span>
                                            <span>{{ excludedItem.diseases.toLocaleString() }} {{ excludedItem.diseases === 1 ? "disease" : "diseases" }} excluded</span>
                                            <span>{{ excludedItem.veryFrequent.toLocaleString() }} high-frequency {{ excludedItem.veryFrequent === 1 ? "disease" : "diseases" }} excluded</span>
                                        </div>
                                    </div>
                                    <div v-if="multi" class="pbp-term-summary-total">
                                        <strong>All {{ ids.length }} together</strong>
                                        <span>{{ countChange(matchesLoaded ? allTermsSampleCount : null, matchingSampleGroups.all.length, 'samples', combinedCountRemovalLabel) }}</span>
                                        <span>≥2 of {{ ids.length }}: {{ countChange(matchesLoaded ? atLeastTwoSampleCount : null, matchingSampleGroups.atLeastTwo.length, 'samples', combinedCountRemovalLabel) }}</span>
                                        <span>{{ cohortSampleCount ? cohortSampleCount.toLocaleString() : "—" }} total samples</span>
                                    </div>
                                </div>
                                <div v-if="multi" class="pbp-scope-picker" role="group" aria-label="Choose sample matching group">
                                    <span>Show samples</span>
                                    <button type="button" class="pbp-btn" :class="{ 'scope-active': sampleMatchMode === 'all' || ids.length === 2 }" :aria-pressed="String(sampleMatchMode === 'all' || ids.length === 2)" @click="selectGeneSampleScope('all')">All {{ ids.length }} together · {{ matchesLoaded ? matchingSampleGroups.all.length.toLocaleString() : '—' }}</button>
                                    <button v-if="ids.length > 2" type="button" class="pbp-btn" :class="{ 'scope-active': sampleMatchMode === 'atLeastTwo' }" :aria-pressed="String(sampleMatchMode === 'atLeastTwo')" @click="selectGeneSampleScope('atLeastTwo')">≥2 of {{ ids.length }} · {{ matchesLoaded ? matchingSampleGroups.atLeastTwo.length.toLocaleString() : '—' }}</button>
                                    <small>Counts include current page filters and Exclude.</small>
                                </div>
                                <phenotype-help label="Counts and query">
                                    <p>
                                        Per-term counts show before → after Exclude. Combined sample counts also include current page filters and
                                        match the sample-group gene counts below. Disease counts use direct Orphanet annotations. High-frequency
                                        diseases list this phenotype as very frequent (80–99%) or obligate (100%).<template v-if="excluded.length">
                                            Red rows show each excluded term separately; overlapping exclusions are counted once in the remaining
                                            totals.</template
                                        >
                                    </p>
                                    <p v-if="multi">
                                        This set is scored as one profile. Samples are ranked by rPheRS Z-score. Genes are tested across the
                                        approved full gene-score source; reference databases provide phenotype-matched disease–gene links.
                                        {{
                                            isOrphanet
                                                ? "Orphanet profile scores combine query and disease phenotype coverage; diseases"
                                                : `${diseaseSourceLabel} results use unweighted HPO overlap; records`
                                        }}
                                        matching an excluded term are removed. None of this is a diagnosis.
                                    </p>
                                    <template v-else>
                                        <h3>Definition and ontology</h3>
                                        <p class="pbp-context-note">
                                            {{ term ? term[1] : "" }} Parent:
                                            {{ term ? (term[2] || []).map(name).join(", ") : "" }}
                                            ·
                                            <a :href="`https://hpo.jax.org/browse/term/${ids[0]}`" target="_blank" rel="noopener noreferrer"
                                                >Ontology and definition</a
                                            >
                                            · {{ reference.meta.hpoOBO }}
                                        </p>
                                    </template>
                                </phenotype-help>
                            </div>
                        </details>
                        <div v-if="matchesLoaded" class="pbp-sample-context">
                            <section class="pbp-context-panel pbp-age-panel" aria-label="Age at record">
                                <div class="pbp-context-heading">
                                    <h3>Age at record</h3>
                                    <span>{{ ageSummary.remaining.toLocaleString() }} / {{ ageSummary.before.toLocaleString() }} samples remain</span>
                                </div>
                                <phenotype-help label="Age and filters">
                                    <p class="pbp-sub">
                                        {{ selectedSampleLabel }} · {{ qualifyingSamples.length.toLocaleString() }} selected samples · current age,
                                        sex, affected and Project filters applied.
                                    </p>
                                    <p class="pbp-note">
                                        Age is measured at enrollment, not symptom onset. Gray shading shows samples removed by Exclude; each bar
                                        keeps its original length. Ages outside 0–100 or missing values are Unknown.
                                    </p>
                                </phenotype-help>
                                <div class="pbp-age-legend">
                                    <span><i class="remaining"></i>Remaining</span>
                                    <span><i class="excluded"></i>Excluded{{ ageSummary.excluded ? ` · ${ageSummary.excluded.toLocaleString()}` : "" }}</span>
                                </div>
                                <div class="pbp-age-labels"><span>Age band</span><span>Samples</span><span>Remaining / before</span></div>
                                <div class="pbp-age-list">
                                    <div v-for="bin in ageSummary.bins" :key="bin.label">
                                        <span>{{ bin.label }}</span>
                                        <div class="pbp-age-track" role="img" :aria-label="`${bin.label}: ${bin.remaining} remaining, ${bin.excluded} excluded, ${bin.before} before Exclude`" :title="`${bin.remaining} remaining + ${bin.excluded} excluded = ${bin.before} before Exclude`">
                                            <span class="remaining" :style="{ width: `${bin.remainingWidth}%` }"></span>
                                            <span class="excluded" :style="{ width: `${bin.excludedWidth}%` }"></span>
                                        </div>
                                        <span class="pbp-age-count"><b>{{ bin.remaining.toLocaleString() }}</b> / {{ bin.before.toLocaleString() }}<small v-if="bin.excluded">−{{ bin.excluded.toLocaleString() }}</small></span>
                                    </div>
                                </div>
                            </section>
                            <section class="pbp-context-panel pbp-sex-panel" aria-label="Sex and co-recorded phenotypes">
                                <h3>Sex · {{ qualifyingSamples.length.toLocaleString() }} selected samples</h3>
                                <div class="pbp-age-legend">
                                    <span><i class="remaining"></i>Remaining</span>
                                    <span><i class="excluded"></i>Excluded{{ sexSummary.excluded ? ` · ${sexSummary.excluded.toLocaleString()}` : "" }}</span>
                                </div>
                                <div class="pbp-age-labels"><span>Sex</span><span>Samples</span><span>Remaining / before</span></div>
                                <div class="pbp-age-list">
                                    <div v-for="bin in sexSummary.bins" :key="bin.label">
                                        <span>{{ bin.label }}</span>
                                        <div class="pbp-age-track" role="img" :aria-label="`${bin.label}: ${bin.remaining} remaining, ${bin.excluded} excluded, ${bin.before} before Exclude`" :title="`${bin.remaining} remaining + ${bin.excluded} excluded = ${bin.before} before Exclude`">
                                            <span class="remaining" :style="{ width: `${bin.remainingWidth}%` }"></span>
                                            <span class="excluded" :style="{ width: `${bin.excludedWidth}%` }"></span>
                                        </div>
                                        <span class="pbp-age-count"><b>{{ bin.remaining.toLocaleString() }}</b> / {{ bin.before.toLocaleString() }}<small v-if="bin.excluded">−{{ bin.excluded.toLocaleString() }}</small></span>
                                    </div>
                                </div>
                                <phenotype-help label="Sex and exclusions">
                                    <p class="pbp-note">
                                        Same samples and filters as Age at record. Gray shading shows samples removed by Exclude.
                                    </p></phenotype-help
                                >
                                <h3>Co-recorded phenotypes</h3>
                                <phenotype-help label="Co-recorded phenotypes">
                                    <p class="pbp-sub">
                                        {{ hpoKnownCount.toLocaleString() }} remaining samples with expanded HPO profiles. Select a term to add it
                                        to the query.
                                    </p></phenotype-help
                                >
                                <div class="pbp-coterms">
                                    <button v-for="item in coTerms" :key="item.id" type="button" @click="queueFeature(item.id)">
                                        {{ name(item.id) }}<em>{{ item.percent }}%</em>
                                    </button>
                                    <span v-if="!coTerms.length" class="pbp-muted">No co-recorded phenotypes are available.</span>
                                </div>
                            </section>
                        </div>
                        <div class="pbp-samples pbp-linked-samples">
                        <div class="pbp-rowhead">
                            <div>
                                <h2>
                                    Samples ranked by rPheRS Z-score
                                    <span class="pbp-heading-count">· {{ matchesLoaded ? qualifyingSamples.length.toLocaleString() : "—" }}</span>
                                </h2>
                                <phenotype-help label="About these samples">
                                    <p class="pbp-sub">
                                        {{
                                            multi
                                                ? `${selectedSampleLabel} · ${qualifyingSamples.length.toLocaleString()} selected samples, ranked by rPheRS Z-score.`
                                                : "Samples with this recorded HPO term, ranked by rPheRS Z-score."
                                        }}
                                    </p>
                                    <p v-if="matchesLoaded" class="pbp-sub">{{ rphersReferenceLabel(sampleStandardization) }}</p>
                                    <p class="pbp-note">
                                        Filled colour marks a recorded query HPO; a white box with a dashed outline means it was not recorded.
                                        Colours follow the query chips above. An unmatched term is unknown, not clinically absent. Matches use the
                                        parent-expanded CRDC HPO observations. rPheRS Z-scores use the full scoring-cohort reference above; page
                                        filters and Exclude do not change the scores or reference. Sample disease / project labels and cohort
                                        categories use their available source records.<template v-if="excluded.length">
                                            {{ hiddenCount }} returned samples were removed using confirmed recorded HPO terms;
                                            {{ unknownExclusionCount }} have no exposed HPO list for exclusion verification.</template
                                        >
                                    </p>
                                </phenotype-help>
                            </div>
                        </div>
                        <div class="pbp-table-scroll">
                            <table>
                                <thead>
                                    <tr>
                                        <th><button class="pbp-sort" @click="toggleSort('samples', 'rank')">Rank {{ sortIndicator('samples', 'rank') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('samples', 'sample')">Sample {{ sortIndicator('samples', 'sample') }}</button></th>
                                        <th><button class="pbp-sort" title="How many scoring-cohort sample SDs this patient's residual PheRS lies above or below that cohort's mean." @click="toggleSort('samples', 'phers')">rPheRS Z-score {{ sortIndicator('samples', 'phers') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('samples', 'matches')">Query HPOs matched {{ sortIndicator('samples', 'matches') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('samples', 'ageSex')">Age · sex {{ sortIndicator('samples', 'ageSex') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('samples', 'cohort')">Project {{ sortIndicator('samples', 'cohort') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('samples', 'affected')">Affected {{ sortIndicator('samples', 'affected') }}</button></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="sample in visibleSamples"
                                        :key="sampleKey(sample)"
                                    >
                                        <td>
                                            <span
                                                class="pbp-rank"
                                                >{{ sample.rank }}</span
                                            >
                                        </td>
                                        <td>
                                            <a
                                                :href="`/pb_sample.html?query=${encodeURIComponent(
                                                    sample.unique_sample_ID ||
                                                        sample.SampleInVCF
                                                )}`"
                                                >{{ sampleKey(sample) }}</a
                                            >
                                        </td>
                                        <td>
                                            {{ score(sample.rphers_z) }}
                                        </td>
                                        <td>
                                            <span class="pbp-segments" role="img" :aria-label="sampleMatchDescription(sample)">
                                                <i v-for="id in ids" :key="id" :class="{ missing: !sampleTerms(sample).includes(id) }" :style="termStyle(id)" :title="`${name(id)}: ${sampleTerms(sample).includes(id) ? 'recorded' : 'not recorded (unknown)'}`"></i>
                                            </span><b>{{ sample.matches || "—" }}</b>
                                        </td>
                                        <td>{{ sampleAge(sample) == null ? "—" : sampleAge(sample) }} · {{ sampleSex(sample) }}</td>
                                        <td>
                                            {{ sampleCohortDisease(sample) }}
                                        </td>
                                        <td>
                                            {{
                                                sample.initial_study_affected ===
                                                "Y"
                                                    ? "Yes"
                                                    : sample.initial_study_affected ===
                                                      "N"
                                                    ? "No"
                                                    : "Unknown"
                                            }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="pbp-pagination">
                            <button type="button" :disabled="samplePage <= 1" @click="samplePage--">Previous</button>
                            <span>Page {{ samplePage }} / {{ samplePageCount }} · {{ qualifyingSamples.length }} samples</span>
                            <button type="button" :disabled="samplePage >= samplePageCount" @click="samplePage++">Next</button>
                        </div>
                        <p v-if="matchesLoaded && !qualifyingSamples.length" class="pbp-status">No samples match the selected projects and filters.</p>
                        </div>
                    </section>
                    <section class="pbp-card">
                        <div class="pbp-rowhead">
                            <div>
                                <span class="pbp-tag crdc"
                                    >{{ multi ? "CRDC · ON-DEMAND" : "CRDC · PRECOMPUTED" }}</span
                                >
                                <h2>
                                    {{
                                        multi
                                            ? "Genes associated with this profile"
                                            : `Genes associated with ${name(
                                                  ids[0]
                                              )}`
                                    }}
                                    <span class="pbp-heading-count">· {{ multi ? (geneSampleScope === 'whole' ? 'Whole-cohort results' : `${selectedSampleLabel} · ${qualifyingSamples.length.toLocaleString()} samples`) : genes ? `${genes.total.toLocaleString()} significant` : '—' }}</span>
                                </h2>
                                <p v-if="multi" class="pbp-sub pbp-analysis-scope"><strong>Full-cohort association reference:</strong> {{ genes && genes.analysisSampleCount ? genes.analysisSampleCount.toLocaleString() + ' analysis samples' : scoreMembership ? scoreMembership.analysisSampleCount.toLocaleString() + ' analysis samples' : 'Loading analysis sample count' }} · {{ genes ? genes.nTests.toLocaleString() : '—' }} tested genes. β / p / q use the full cohort.</p>
                                <p v-if="rphersReferencesDiffer" class="pbp-sub">Sample scores and gene effects use different reference cohorts.</p>
                                <phenotype-help label="Methods and reference evidence">
                                    <p class="pbp-sub">
                                        {{
                                            multi
                                                ? geneSampleScope === "whole"
                                                    ? "Whole-cohort results are retained. Use the sample-group filters below to see genes with GRS Max > 0 in matching samples."
                                                    : "Rows are filtered to genes with GRS Max > 0 in the selected group. Shared by all requires score coverage for every selected sample."
                                                : "Existing approximate binary-HPO score-test β per 0.1 increase in Sum GRS. Sum GRS is the gene-level genetic risk score: summed ALT dosage × variant pathogenicity score. Coefficient, SE and 95% CI are rescaled by 0.1; release p/q values and analysis samples are unchanged. Reference database links are shown separately."
                                        }}
                                    </p>

                                    <p v-if="multi && scoreMembership" class="pbp-sub">
                                        Score coverage: ≥2/{{ ids.length }}: {{ atLeastGeneSummary.covered }} /
                                        {{ atLeastGeneSummary.total }} samples · All {{ ids.length }}: {{ allGeneSummary.covered }} /
                                        {{ allGeneSummary.total }} samples. Missing score coverage is unavailable, not zero.
                                    </p>
                                    <p v-if="multi && genes" class="pbp-sub">{{ rphersReferenceLabel(geneStandardization) }}</p>
                                    <p v-if="rphersReferencesDiffer" class="pbp-sub">
                                        Sample scores and gene effects use different existing scoring cohorts. Each SD value uses its own stated
                                        reference; they are not a shared-reference scale.
                                    </p>
                                    <p class="pbp-sub">
                                        Reference links match the entered HPOs and respect Exclude. Ranks are within each database; overlapping
                                        databases are not independent replications.<template
                                            v-if="!geneReferenceSources.find((source) => source.key === 'decipher').available"
                                        >
                                            DECIPHER gene mappings are unavailable in this reference release.</template
                                        >
                                    </p>
                                    <h3>Reference evidence criteria</h3>
                                    <p>
                                        For multiple HPOs, Orphanet retains its existing profile-score cutoff (≥0.10). OMIM and DDG2P links require
                                        at least one matching HPO. Excluded HPO matches remove the disease record in every database. These links do
                                        not alter CRDC β, p, q or sample-group counts.
                                    </p>
                                    <p v-if="multi">
                                        Changing the selected sample group filters gene rows; it does not refit the full-cohort association.
                                    </p>
                                </phenotype-help>
                            </div>
                            <div class="pbp-controls">
                                <input v-model.trim="geneSearch" class="pbp-gene-search" type="search" placeholder="Search gene" aria-label="Search gene results" />
                                <label class="pbp-reference-picker">Reference DB
                                    <select v-model="geneReferenceSource" aria-label="Filter gene reference database">
                                        <option value="all">All reference DBs</option>
                                        <option v-for="source in geneReferenceSources" :key="source.key" :value="source.key" :disabled="!source.available">{{ source.label }}{{ source.available ? '' : ' — gene mappings unavailable' }}</option>
                                    </select>
                                </label>
                                <button
                                    type="button"
                                    class="pbp-btn"
                                    @click="copyGenes"
                                >
                                    Copy gene list</button
                                ><button
                                    type="button"
                                    class="pbp-btn"
                                    @click="exportGenes"
                                >
                                    Export panel
                                </button>
                            </div>
                        </div>
                        <div v-if="multi" class="pbp-scope-picker" role="group" aria-label="Filter gene results by sample group">
                            <span>Gene result filter</span>
                            <button type="button" class="pbp-btn" :class="{ 'scope-active': geneSampleScope === 'whole' }" :aria-pressed="String(geneSampleScope === 'whole')" @click="selectGeneSampleScope('whole')">Whole-cohort results</button>
                            <button type="button" class="pbp-btn" :class="{ 'scope-active': geneSampleScope === 'atLeastTwo' }" :aria-pressed="String(geneSampleScope === 'atLeastTwo')" @click="selectGeneSampleScope('atLeastTwo')">≥2 of {{ ids.length }} · {{ matchingSampleGroups.atLeastTwo.length }}</button>
                            <button type="button" class="pbp-btn" :class="{ 'scope-active': geneSampleScope === 'all' }" :aria-pressed="String(geneSampleScope === 'all')" @click="selectGeneSampleScope('all')">All {{ ids.length }} · {{ matchingSampleGroups.all.length }}</button>
                        </div>
                        <div v-if="multi ? genes || scoreMembership : genes && !geneLoading && !geneError" class="pbp-filters">
                            <button
                                v-for="filter in geneFilters"
                                :key="filter.key"
                                type="button"
                                :class="{ on: geneFilter === filter.key }"
                                @click="geneFilter = filter.key; genePage = 1"
                            >
                                {{ filter.label }} ({{ filter.count }})
                            </button>
                        </div>
                        <div class="pbp-legend">
                            <span
                                ><i class="burden"></i>{{ multi ? "CRDC gene-score" : "CRDC burden" }} q &lt;
                                0.05</span
                            ><span v-for="source in geneReferenceSources.filter(item => item.available)" :key="source.key"><span class="pbp-reference-badge" :class="source.key">{{ source.label }}</span> disease link</span>
                        </div>
                        <p v-if="multi && membershipLoading" class="pbp-status" role="status">Loading selected samples' gene scores…</p>
                        <p v-if="multi && membershipError" class="pbp-status" role="alert">{{ membershipError }} <button type="button" @click="loadSampleGeneScores()">Retry</button></p>
                        <p v-if="geneLoading" class="pbp-status">
                            {{ multi ? 'Calculating gene associations… The first full-cohort calculation and download may take about a minute.' : 'Loading gene associations…' }}
                        </p>
                        <p v-else-if="geneError" class="pbp-status">
                            {{ geneError }} <button type="button" @click="loadGenes">Retry</button>
                        </p>
                        <div v-if="multi ? (geneSampleScope === 'whole' ? genes : scoreMembership && !membershipLoading) : !geneLoading && !geneError" class="pbp-table-scroll">
                            <table class="pbp-gene-table">
                                <thead>
                                    <tr v-if="multi" class="pbp-gene-scope-head"><th colspan="2" scope="colgroup">Gene</th><th colspan="3" scope="colgroup">Sample-group evidence · selected {{ selectedGeneSummary.total }} samples</th><th colspan="4" scope="colgroup">Full-cohort association · {{ genes && genes.analysisSampleCount ? genes.analysisSampleCount.toLocaleString() : scoreMembership ? scoreMembership.analysisSampleCount.toLocaleString() : '—' }} samples</th><th scope="colgroup">Literature</th></tr>
                                    <tr>
                                        <th><button class="pbp-sort" @click="toggleSort('genes', 'gene')">Gene {{ sortIndicator('genes', 'gene') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('genes', 'evidence')">Evidence {{ sortIndicator('genes', 'evidence') }}</button></th>
                                        <th v-if="multi" :class="{ 'pbp-selected-group-column': sampleMatchMode === 'atLeastTwo' }"><button class="pbp-sort" @click="toggleSort('genes', 'groupAtLeast')">GRS &gt; 0 · ≥2/{{ ids.length }} <small>{{ atLeastGeneSummary.total }} samples</small> {{ sortIndicator('genes', 'groupAtLeast') }}</button></th>
                                        <th v-if="multi" :class="{ 'pbp-selected-group-column': sampleMatchMode === 'all' }"><button class="pbp-sort" @click="toggleSort('genes', 'groupAll')">GRS &gt; 0 · {{ ids.length }}/{{ ids.length }} <small>{{ allGeneSummary.total }} samples</small> {{ sortIndicator('genes', 'groupAll') }}</button></th>
                                        <th v-if="multi"><button class="pbp-sort" @click="toggleSort('genes', 'projects')">Projects <small>Selected score-positive samples</small> {{ sortIndicator('genes', 'projects') }}</button></th>
                                        <th><button class="pbp-sort" v-b-tooltip.hover.focus.top title="β per 0.1 GRS summarizes the gene burden association. Sum GRS adds ALT allele dosage × pathogenicity score across a gene: 1 for LoFTEE high-confidence loss of function, otherwise available AlphaMissense." @click="toggleSort('genes', 'effect')">β {{ sortIndicator('genes', 'effect') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('genes', 'support')">{{ multi ? "GRS > 0 samples" : "95% CI" }} {{ sortIndicator('genes', 'support') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('genes', 'p')">p {{ sortIndicator('genes', 'p') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('genes', 'q')">q {{ sortIndicator('genes', 'q') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('genes', 'disease')">Reference diseases · matched HPOs {{ sortIndicator('genes', 'disease') }}</button></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="row in visibleGenes"
                                        :key="row.gene"
                                    >
                                        <td>
                                            <a
                                                :href="`/pb_gene2.html?query=${encodeURIComponent(
                                                    row.gene
                                                )}`"
                                                >{{ row.gene }}</a
                                            >
                                        </td>
                                        <td>
                                            <span v-if="significantGene(row)" class="pbp-reference-badge crdc" title="Full-cohort CRDC q < 0.05">CRDC</span>
                                            <span v-for="source in geneReferenceSources.filter(item => row.diseases.some(disease => disease.source === item.key))" :key="source.key" class="pbp-reference-badge" :class="source.key" :title="`${source.label}: phenotype-matched disease–gene reference link`">{{ source.label }}</span>
                                            <span v-if="!significantGene(row) && !row.diseases.length" class="pbp-muted">—</span>
                                        </td>
                                        <td v-if="multi" :class="{ 'pbp-selected-group-column': sampleMatchMode === 'atLeastTwo' }">{{ groupScoreCell(row.gene, atLeastGeneSummary) }}</td>
                                        <td v-if="multi" :class="{ 'pbp-selected-group-column': sampleMatchMode === 'all' }">{{ groupScoreCell(row.gene, allGeneSummary) }}</td>
                                        <td v-if="multi">{{ geneProjectCell(row.gene) }}</td>
                                        <td>
                                            <div
                                                v-if="row.association && !multi && row.association.betaPer0_1Grs != null"
                                                class="pbp-bar"
                                            >
                                                <i
                                                    class="teal"
                                                    :style="{
                                                        width: `${Math.max(
                                                            2,
                                                            (Math.abs(row.association
                                                                .betaPer0_1Grs) /
                                                                maxSingleBeta) *
                                                                100
                                                        )}%`,
                                                    }"
                                                ></i
                                                ><b>{{
                                                    stat(
                                                        row.association
                                                            .betaPer0_1Grs
                                                    )
                                                }}</b>
                                            </div>
                                            <span v-else>{{ row.association && multi ? stat(row.association.betaSdPer0_1Grs) : "—" }}</span>
                                        </td>
                                        <td>
                                            {{
                                                row.association && multi
                                                    ? Number(row.association.nPositive).toLocaleString()
                                                    : row.association
                                                    ? `${stat(
                                                          row.association.betaCiLowPer0_1Grs
                                                      )}–${stat(
                                                          row.association.betaCiHighPer0_1Grs
                                                      )}`
                                                    : "—"
                                            }}
                                        </td>
                                        <td>
                                            {{
                                                row.association
                                                    ? stat(
                                                          row.association.pValue
                                                      )
                                                    : "—"
                                            }}
                                        </td>
                                        <td
                                            :class="{
                                                'pbp-significant':
                                                    significantGene(row),
                                            }"
                                        >
                                            {{
                                                row.association
                                                    ? stat(
                                                          row.association.qValue
                                                      )
                                                    : "—"
                                            }}
                                        </td>
                                        <td>
                                            <template v-if="geneDiseaseLinks(row).length">
                                                <div v-for="disease in geneDiseaseLinks(row).slice(0, 2)" :key="disease.key" class="pbp-gene-reference">
                                                    <span class="pbp-reference-badge" :class="disease.source">{{ referenceSourceLabel(disease.source) }} #{{ disease.rank }}</span>
                                                    {{ disease.name }} <small>{{ disease.referenceId }} · {{ disease.matchedIds.length }}/{{ ids.length }} HPOs</small>
                                                </div>
                                                <details v-if="geneDiseaseLinks(row).length > 2" class="pbp-more-references" @toggle="toggleGeneReferences(row.gene, $event.target.open)">
                                                    <summary>+{{ geneDiseaseLinks(row).length - 2 }} more reference records</summary>
                                                    <template v-if="expandedGeneReferences.includes(row.gene)"><div v-for="disease in geneDiseaseLinks(row).slice(2)" :key="disease.key" class="pbp-gene-reference">
                                                        <span class="pbp-reference-badge" :class="disease.source">{{ referenceSourceLabel(disease.source) }} #{{ disease.rank }}</span>
                                                        {{ disease.name }} <small>{{ disease.referenceId }} · {{ disease.matchedIds.length }}/{{ ids.length }} HPOs</small>
                                                    </div></template>
                                                </details>
                                            </template>
                                            <span v-else class="pbp-muted">{{ significantGene(row) ? "Not linked — candidate" : "No reference link" }}</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <p v-if="!visibleGenes.length" class="pbp-status">
                                No genes match this selected sample group and filter.
                            </p>
                        </div>
                        <div v-if="multi ? (geneSampleScope === 'whole' ? genes : scoreMembership) : genes && !geneLoading && !geneError" class="pbp-pagination">
                            <button type="button" :disabled="genePage <= 1" @click="genePage--">Previous</button>
                            <span>Page {{ genePage }} / {{ genePageCount }} · {{ filteredGenes.length }} genes</span>
                            <button type="button" :disabled="genePage >= genePageCount" @click="genePage++">Next</button>
                        </div>
                    </section>
                    <div class="pbp-disease-layout" :class="{ profile: multi }">
                        <section class="pbp-card pbp-diseases">
                            <div class="pbp-rowhead">
                                <div>
                                    <span class="pbp-tag orpha"
                                        >{{ diseaseSourceLabel.toUpperCase() }} REFERENCE</span
                                    >
                                    <h2>
                                        {{
                                            multi
                                                ? "Differential diagnosis"
                                                : `Diseases with ${name(
                                                      ids[0]
                                                  )}`
                                        }}
                                        <span class="pbp-heading-count">· {{ diseases.length.toLocaleString() }} matched</span>
                                    </h2>
                                    <phenotype-help label="About these diseases">
                                        <p class="pbp-sub">
                                            {{
                                                !isOrphanet
                                                    ? "Ranked by the number of disease HPOs matched, then query terms matched and disease coverage. Frequency weights are not used."
                                                    : multi
                                                    ? "Orphanet disease profiles, ranked by harmonic coverage of query and disease phenotypes. Expand a row to inspect the calculation and annotations."
                                                    : "Orphanet disease profiles, sorted by phenotype frequency class and diagnostic criterion."
                                            }}
                                        </p>
                                        <p class="pbp-note">
                                            {{
                                                !isOrphanet
                                                    ? "Disease HPOs matched = matched phenotype annotations / all unique phenotype annotations for this record (for example, 2/8). Inheritance and clinical modifiers are omitted. Query terms matched uses the input term count as its denominator. A query also matches a more specific disease annotation; matching several queries counts an annotation once. Excluded phenotypes remove matching records. No frequency weights or Profile score are assigned. "
                                                    : multi
                                                    ? "Profile score is the harmonic mean of disease and query coverage. Diseases matching a user-excluded HPO are removed from these results. The score ranks the remaining diseases; it is not a probability. Orphanet Excluded (0%) annotations are ignored. "
                                                    : ""
                                            }}{{
                                                isOrphanet
                                                    ? "Orphadata Products 4 and 6 · July 2026 reference snapshot."
                                                    : diseaseSource === "ddg2p"
                                                    ? "DDG2P phenotype reference · local release; each row is a gene–condition record."
                                                    : "HPOA disease phenotype annotations · 2026-02-16 local release."
                                            }}
                                        </p>
                                        <p v-if="isOrphanet" class="pbp-note">
                                            * Included in an established diagnostic criteria set; this finding alone does not establish a diagnosis.
                                            Excluded (0%) annotations are omitted.
                                        </p>
                                    </phenotype-help>
                                </div>
                                <input
                                    v-model.trim="diseaseQuery"
                                    class="pbp-disease-search"
                                    placeholder="Filter disease or gene"
                                    aria-label="Filter disease or gene"
                                />
                            </div>
                            <div class="pbp-filters pbp-source-filters" role="group" aria-label="Disease reference source">
                                <button v-for="source in diseaseSources" :key="source.key" type="button"
                                    :class="{ on: diseaseSource === source.key }"
                                    :aria-pressed="diseaseSource === source.key"
                                    @click="diseaseSource = source.key">
                                    {{ source.label }} · {{ source.count.toLocaleString() }}
                                </button>
                            </div>
                            <div v-if="diseaseFilters.length" class="pbp-filters">
                                <button
                                    v-for="filter in diseaseFilters"
                                    :key="filter.key"
                                    type="button"
                                    :class="{
                                        on: diseaseFilter === filter.key,
                                    }"
                                    @click="
                                        diseaseFilter = filter.key;
                                        diseasePage = 1;
                                    "
                                >
                                    {{ filter.label }}<template v-if="filter.count != null"> {{ filter.count }}</template>
                                </button>
                            </div>
                            <div class="pbp-table-scroll">
                                <table>
                                    <thead>
                                        <tr>
                                            <th v-if="multi"><button class="pbp-sort" @click="toggleSort('diseases', 'rank')">Rank {{ sortIndicator('diseases', 'rank') }}</button></th>
                                            <th><button class="pbp-sort" @click="toggleSort('diseases', 'disease')">Disease {{ sortIndicator('diseases', 'disease') }}</button></th>
                                            <th><button class="pbp-sort" @click="toggleSort('diseases', 'score')">{{ !isOrphanet ? "Disease HPOs matched" : multi ? "Profile score" : "Frequency class" }} {{ sortIndicator('diseases', 'score') }}</button></th>
                                            <th><button class="pbp-sort" @click="toggleSort('diseases', 'matched')">{{ multi || !isOrphanet ? "Query terms matched" : "Criterion" }} {{ sortIndicator('diseases', 'matched') }}</button></th>
                                            <th v-if="!multi"><button class="pbp-sort" @click="toggleSort('diseases', 'genes')">Genes {{ sortIndicator('diseases', 'genes') }}</button></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <template
                                            v-for="row in visibleDiseases"
                                            ><tr
                                                :key="row.code"
                                                class="pbp-expand-row"
                                                @click="toggleDisease(row.code)"
                                            >
                                                <td v-if="multi">
                                                    <span
                                                        class="pbp-rank"
                                                        >{{ row.rank }}</span
                                                    >
                                                </td>
                                                <td>
                                                    <b>{{ row.name }}</b
                                                    ><span class="pbp-caret">{{
                                                        expandedDiseases.includes(
                                                            row.code
                                                        )
                                                            ? "▲"
                                                            : "▼"
                                                    }}</span
                                                    ><small
                                                        >{{ row.referenceId || `DDG2P · ${row.genes.map(gene => gene[0]).join(", ")}`
                                                        }}<template
                                                            v-if="
                                                                row.genes.length
                                                            "
                                                        >
                                                            ·
                                                            {{
                                                                row.genes
                                                                    .slice(0, 3)
                                                                    .map(
                                                                        (
                                                                            gene
                                                                        ) =>
                                                                            gene[0]
                                                                    )
                                                                    .join(", ")
                                                            }}</template
                                                        ></small
                                                    >
                                                </td>
                                                <td v-if="!isOrphanet">
                                                    <b>{{ row.overlapCount }}/{{ row.profile.length }}</b>
                                                </td>
                                                <td v-else-if="multi">
                                                    <b>{{ row.score.toFixed(2) }}</b>
                                                </td>
                                                <td v-else>
                                                    <span
                                                        class="pbp-frequency"
                                                        :class="
                                                            frequencyClass(
                                                                row.frequency
                                                            )
                                                        "
                                                        >{{
                                                            frequencyShort(
                                                                row.frequency
                                                            )
                                                        }}</span
                                                    >
                                                </td>
                                                <td v-if="multi || !isOrphanet">
                                                    <b
                                                        >{{
                                                            row.matchedIds
                                                                .length
                                                        }}/{{ ids.length }}</b
                                                    >
                                                </td>
                                                <td v-else>
                                                    {{
                                                        row.diagnostic
                                                            ? "Included *"
                                                            : "—"
                                                    }}
                                                </td>
                                                <td v-if="!multi">
                                                    <a
                                                        v-for="gene in row.genes.slice(
                                                            0,
                                                            3
                                                        )"
                                                        :key="gene[0]"
                                                        :href="`/pb_gene2.html?query=${encodeURIComponent(
                                                            gene[0]
                                                        )}`"
                                                        @click.stop
                                                        >{{ gene[0] }} </a
                                                    ><span
                                                        v-if="
                                                            row.genes.length > 3
                                                        "
                                                        >+{{
                                                            row.genes.length - 3
                                                        }}</span
                                                    >
                                                </td>
                                            </tr>
                                            <tr
                                                v-if="
                                                    expandedDiseases.includes(
                                                        row.code
                                                    )
                                                "
                                                :key="`${row.code}-detail`"
                                                class="pbp-expanded"
                                            >
                                                <td :colspan="multi ? 4 : 4">
                                                    <p>
                                                        <b
                                                            >Why this disease
                                                            appears:</b
                                                        >
                                                        {{ diseaseWhy(row) }}
                                                    </p>
                                                    <p v-if="row.mondoIds.length" class="pbp-note">MONDO mappings: {{ row.mondoIds.join(", ") }}</p>
                                                    <table
                                                        class="pbp-feature-table"
                                                    >
                                                        <tbody>
                                                            <tr
                                                                v-for="group in featureGroups(
                                                                    row
                                                                )"
                                                                :key="
                                                                    group.name
                                                                "
                                                            >
                                                                <th>
                                                                    {{
                                                                        group.short
                                                                    }}<small
                                                                        >{{
                                                                            group
                                                                                .items
                                                                                .length
                                                                        }}
                                                                        terms</small
                                                                    >
                                                                </th>
                                                                <td>
                                                                    <button
                                                                        v-for="item in group.items.slice(
                                                                            0,
                                                                            expandedFeatures.includes(
                                                                                row.code
                                                                            )
                                                                                ? undefined
                                                                                : 8
                                                                        )"
                                                                        :key="
                                                                            item.hpoId
                                                                        "
                                                                        type="button"
                                                                        class="pbp-feature"
                                                                        :class="{
                                                                            hit: ids.includes(item.hpoId) || (row.matchedProfileIds || []).includes(item.hpoId),
                                                                            miss: excluded.includes(
                                                                                item.hpoId
                                                                            ),
                                                                            ask: narrowingIds.includes(
                                                                                item.hpoId
                                                                            ),
                                                                        }"
                                                                        :disabled="
                                                                            ids.includes(item.hpoId) ||
                                                                            excluded.includes(item.hpoId)
                                                                        "
                                                                        @click.stop="
                                                                            queueFeature(
                                                                                item.hpoId
                                                                            )
                                                                        "
                                                                    >
                                                                        {{
                                                                            name(
                                                                                item.hpoId
                                                                            )
                                                                        }}
                                                                        {{
                                                                            ids.includes(
                                                                                item.hpoId
                                                                            )
                                                                                ? "✓"
                                                                                : narrowingIds.includes(
                                                                                      item.hpoId
                                                                                  )
                                                                                ? "+"
                                                                                : ""
                                                                        }}<small
                                                                            >{{
                                                                                item.hpoId
                                                                            }}</small
                                                                        >
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <button
                                                        v-if="
                                                            row.profile.length >
                                                            20
                                                        "
                                                        type="button"
                                                        class="pbp-link"
                                                        @click.stop="
                                                            toggleFeatures(
                                                                row.code
                                                            )
                                                        "
                                                    >
                                                        {{
                                                            expandedFeatures.includes(
                                                                row.code
                                                            )
                                                                ? "Show fewer features"
                                                                : "Show all annotated features"
                                                        }}
                                                    </button>
                                                </td>
                                            </tr></template
                                        >
                                    </tbody>
                                </table>
                                <p
                                    v-if="!visibleDiseases.length"
                                    class="pbp-status"
                                >
                                    No reference diseases match this selection.
                                </p>
                            </div>
                            <div class="pbp-pagination">
                                <button type="button" :disabled="diseasePage <= 1" @click="diseasePage--">Previous</button>
                                <span>Page {{ diseasePage }} / {{ diseasePageCount }} · {{ filteredDiseases.length }} {{ diseaseSource === "ddg2p" ? "gene–condition records" : "diseases" }}</span>
                                <button type="button" :disabled="diseasePage >= diseasePageCount" @click="diseasePage++">Next</button>
                            </div>
                        </section>
                        <aside v-if="multi" class="pbp-card pbp-narrow">
                            <span class="pbp-tag orpha"
                                >{{ diseaseSourceLabel.toUpperCase() }} REFERENCE</span
                            >
                            <h3>What would narrow this?</h3>
                            <phenotype-help label="Using these suggestions">
                                <p class="pbp-sub">
                                    Each row is a different phenotype. The count shows how many of the top
                                    {{ Math.min(10, candidates.length) }} {{ diseaseSourceLabel }} candidate
                                    {{ diseaseSource === "ddg2p" ? "gene–condition records" : "diseases" }} are annotated with it. + adds a
                                    recorded phenotype; - marks a confirmed excluded phenotype.
                                </p></phenotype-help
                            >
                            <table>
                                <thead>
                                    <tr>
                                        <th><button class="pbp-sort" @click="toggleSort('narrowing', 'phenotype')">Phenotype {{ sortIndicator('narrowing', 'phenotype') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('narrowing', 'count')">{{ diseaseSource === "ddg2p" ? "Records annotated" : "Diseases annotated" }} {{ sortIndicator('narrowing', 'count') }}</button></th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="item in sortedNarrowing"
                                        :key="item.hpoId"
                                    >
                                        <td>
                                            <b>{{ name(item.hpoId) }}</b
                                            ><small
                                                >{{ item.hpoId }} ·
                                                {{
                                                    item.diseaseNames
                                                        .slice(0, 2)
                                                        .join(", ")
                                                }}</small
                                            >
                                        </td>
                                        <td>
                                            {{ item.count }} of {{ item.total }}
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                class="pbp-narrow-add"
                                                title="Add as present"
                                                aria-label="Add as present phenotype"
                                                @click="queueFeature(item.hpoId)"
                                            >
                                                +</button
                                            ><button
                                                type="button"
                                                class="pbp-narrow-exclude"
                                                title="Add as excluded"
                                                aria-label="Add as excluded phenotype"
                                                @click="queueExcluded(item.hpoId)"
                                            >
                                                -
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <p v-if="!sortedNarrowing.length" class="pbp-note">No distinguishing phenotype is available among the top {{ diseaseSourceLabel }} records.</p>
                        </aside>
                    </div>
                </template>
                <section v-else class="pbp-card pbp-status">
                    <h2>Phenotype not found</h2>
                    <p>
                        Enter an HPO ID such as HP:0001250, an exact term such
                        as Seizure, or a selected term such as Seizure [HP:0001250].
                    </p>
                </section>
            </div>
        </main>
    </div>
</template>
<script>
import { ORPHANET_REFERENCE } from "./orphanetReference.generated";
import additionalReferences from "./additionalDiseaseReferences.generated.json";
import {
    FREQUENCIES,
    DISEASE_SOURCES,
    CANDIDATE_SCORE_THRESHOLD,
    AGE_BANDS,
    validAge,
    ageBand,
    ageExclusionSummary,
    sexExclusionSummary,
    sexCategory,
    cohortSampleSummary,
    TERM_COLORS,
    resolveHpoIds,
    diseaseRows,
    unweightedDiseaseRows,
    narrowingTerms,
    sampleMatchCount,
    formatStatistic,
    sortTableRows,
} from "./phenotypeModel";
import { request as bioIndexRequest } from "@/utils/bioIndexUtils";
import { fetchProfileGeneAssociations } from "./profileGeneApi";
import { fetchSampleGeneScores, summarizeSampleGenes } from "./sampleSelection";
import PhenotypeProfileEditor from "./PhenotypeProfileEditor.vue";
import SinglePhenotypeResults from "./SinglePhenotypeResults.vue";
import { loadCrdcHpoCounts, validateCrdcHpos } from '../../utils/crdcHpoAvailability';
import { isSinglePhenotypeView } from "./singlePhenotypeModel";
import { readRules, matchesRules } from "./profileFilters";
import PhenotypeHelp from "./PhenotypeHelp.vue";
import { createHpoSearchIndex } from "./hpoSearch";
import { buildGeneReferenceEvidence } from "./geneReferenceEvidence";
import { referenceAvailable, standardizedField, sameReference, contextMatches, referenceDescription } from "../../utils/rphersUnits";
const REF = Object.freeze({ ...ORPHANET_REFERENCE, terms: { ...ORPHANET_REFERENCE.terms, ...additionalReferences.terms } });
const HPO_SEARCH_INDEX = createHpoSearchIndex(REF.terms);
const GENE_REFERENCE_SOURCES = Object.freeze(DISEASE_SOURCES.map(source => Object.freeze({ ...source,
    available: source.key === 'orphanet' ? REF.diseases.some(row => row[2].length > 0)
        : additionalReferences.profiles.some(row => row[1] === source.key && row[5].length > 0),
})));
const sampleKey = (sample) => sample.SampleInVCF || sample.unique_sample_ID || sample.sample_id;
const normalizeTerms = (value) =>
    Array.isArray(value)
        ? value
              .map((item) =>
                  typeof item === "string"
                      ? item
                      : item.hpo_id || item.hpoId || item.id
              )
              .filter(Boolean)
        : [];
function leafTerms(ids) {
    const ancestors = new Set();
    const visit = (id) =>
        ((REF.terms[id] && REF.terms[id][2]) || []).forEach((parent) => {
            if (!ancestors.has(parent)) {
                ancestors.add(parent);
                visit(parent);
            }
        });
    ids.forEach(visit);
    return ids.filter((id) => !ancestors.has(id));
}
export default {
    name: "PbPhenotypeTemplate",
    components: { PhenotypeProfileEditor, PhenotypeHelp, SinglePhenotypeResults },
    data() {
        const params = new URLSearchParams(window.location.search);
        const query = params.has("query") ? params.get("query") : params.get("hpo") || "HP:0001250";
        const ids = resolveHpoIds(REF, query);
        const geneScope = ["any", "all", "atLeastTwo"].includes(params.get("gene_scope")) ? params.get("gene_scope") : "whole";
        const initialRules = readRules(params.get('filters'), value => { const resolved = resolveHpoIds(REF, value); return resolved.length === 1 ? resolved[0] : ''; });
        const requestedMinimum = Number(params.get('min_match'));
        const matchingMode = geneScope !== 'whole' ? geneScope : ['any', 'all', 'atLeastTwo'].includes(params.get('match')) ? params.get('match') : Number.isInteger(requestedMinimum) && requestedMinimum > 0 ? 'atLeastTwo' : 'all';
        return {
            reference: REF,
            ids,
            advancedRules: initialRules,
            excluded: [...new Set([...resolveHpoIds(REF, params.get('exclude') || ''), ...initialRules.filter(row => row.field === 'phenotype' && row.operator === 'exclude').map(row => row.value)])],
            colors: Object.fromEntries(ids.map((id, i) => [id, i % 8])),
            searchQuery: query,
            sampleMatchMode: matchingMode,
            sampleMatchMinimum: Number.isInteger(requestedMinimum) && requestedMinimum > 0 ? Math.min(requestedMinimum, Math.max(ids.length, 2)) : 2,
            hpoSampleCounts: null, hpoCountsStatus: 'loading',
            geneSampleScope: geneScope,
            scoreMembership: null, membershipLoading: false, membershipError: "", membershipRequest: 0,
            sampleInfoLoading: false,
            projectMetadataSource: "",
            ageBandFilter: "",
            sexFilter: "",
            selectedProjects: [],
            affectedFilter: "",
            samplePage: 1,
            cohortPage: 1,
            tableSort: {
                cohorts: { key: "total", dir: "desc" },
                samples: { key: "rank", dir: "asc" },
                genes: { key: ids.length > 1 && ["any", "all", "atLeastTwo"].includes(params.get("gene_scope")) ? (params.get("gene_scope") === "all" ? "groupAll" : params.get("gene_scope") === "any" ? "groupAny" : "groupAtLeast") : "", dir: "desc" },
                diseases: { key: "rank", dir: "asc" },
                narrowing: { key: "", dir: "asc" },
            },
            matches: [],
            matchesLoaded: false,
            cohortSampleCount: 0,
            sampleLoading: false,
            sampleError: "",
            sampleStandardization: null,
            geneStandardization: null,
            sampleRequest: 0,
            sampleInfo: {},
            sampleInfoChecked: {},
            infoRequest: 0,
            genes: null,
            multiGeneResult: null, multiGeneLoading: false, multiGeneError: "", multiComparisonRequest: 0,
            geneLoading: false,
            geneError: "",
            geneRequest: 0,
            geneFilter: ids.length > 1 && ["any", "all", "atLeastTwo"].includes(params.get("gene_scope")) ? "selected" : "significant",
            genePage: 1,
            geneSearch: "",
            geneReferenceSource: 'all',
            diseaseFilter: ids.length > 1 || ["omim", "decipher", "ddg2p"].includes(params.get("source")) ? "all" : "default",
            diseaseSource: DISEASE_SOURCES.some((source) => source.key === params.get("source")) ? params.get("source") : "orphanet",
            diseaseQuery: "",
            diseasePage: 1,
            expandedDiseases: [],
            expandedFeatures: [],
            expandedGeneReferences: [],
        };
    },
    mounted() {
        this.loadHpoCounts();
        if (this.ids.length) {
            this.loadSamples();
            this.loadGenes();
        }
    },
    watch: {
        qualifyingSamples() { if (this.multi && this._isMounted) this.scheduleMultiGeneComparison(); },
        ids: {
            deep: true,
            handler() {
                this.sampleRequest++; this.geneRequest++;
                this.sampleLoading = false; this.geneLoading = false;
                this.matches = [];
                this.scoreMembership = null;
                this.membershipRequest++;
                this.matchesLoaded = false;
                this.sampleStandardization = null;
                this.geneStandardization = null;
                this.genes = null;
                this.samplePage = 1;
                this.cohortPage = 1;
                this.selectedProjects = [];
                this.genePage = 1;
                this.diseasePage = 1;
                this.expandedGeneReferences = [];
                this.diseaseFilter = this.ids.length > 1 || !this.isOrphanet ? "all" : "default";
                this.loadSamples();
                this.loadGenes();
            },
        },
        advancedRules: { deep: true, handler() { this.resetSelectedPages(); } },
        ageBandFilter() { this.resetSelectedPages(); },
        sexFilter() { this.resetSelectedPages(); },
        affectedFilter() { this.resetSelectedPages(); },
        selectedProjects() { this.samplePage = 1; this.genePage = 1; },
        excluded: { deep: true, handler() {
            this.samplePage = 1;
            this.cohortPage = 1;
            this.genePage = 1;
            this.diseasePage = 1;
            if (this.multi) {
                this.diseaseFilter = "all";
                // Exclude updates the current sample-group gene view, while
                // whole-cohort association statistics remain its reference.
                if (this.geneSampleScope === 'whole') this.selectGeneSampleScope(this.sampleMatchMode, this.sampleMatchMinimum);
            }
        } },
        metadataSamples(samples) {
            this.loadSampleInfo(samples);
            this.loadSampleGeneScores(samples);
        },
        sampleMatchMinimum() { this.resetSelectedPages(); this.syncUrl(); },
        sampleMatchMode() {
            this.geneSampleScope = this.sampleMatchMode;
            this.geneFilter = 'selected';
            this.samplePage = 1; this.cohortPage = 1; this.genePage = 1;
            if (["groupAny", "groupAll", "groupAtLeast"].includes(this.tableSort.genes.key))
                this.$set(this.tableSort, "genes", {key: this.sampleMatchMode === "all" ? "groupAll" : this.sampleMatchMode === "any" ? "groupAny" : "groupAtLeast", dir: "desc"});
            this.syncUrl();
        },
        diseaseQuery() { this.diseasePage = 1; },
        geneSearch() { this.genePage = 1; },
        geneReferenceSource() { this.genePage = 1; },
        diseaseSource() {
            this.diseasePage = 1;
            this.diseaseFilter = this.multi || !this.isOrphanet ? "all" : "default";
            this.expandedDiseases = [];
            this.expandedFeatures = [];
            this.$set(this.tableSort, "diseases", { key: "rank", dir: "asc" });
            this.$set(this.tableSort, "narrowing", { key: "", dir: "asc" });
            this.syncUrl();
        },
    },
    beforeDestroy() { clearTimeout(this._multiComparisonTimer); if (this._multiComparisonAbort) this._multiComparisonAbort.abort(); this.multiComparisonRequest++; this.membershipRequest++; this.infoRequest++; this.sampleRequest++; this.geneRequest++; },
    computed: {
        singlePhenotypeView() { return isSinglePhenotypeView(this); },
        singlePhenotypeSamples() {
            return this.qualifyingSamples.map(row => ({
                id: sampleKey(row), project: this.sampleCohortDisease(row), investigator: this.sampleInvestigator(row),
                age: this.sampleAge(row), sex: this.sampleSex(row), affected: row.initial_study_affected,
                z: row.rphers_z, terms: this.sampleTerms(row), matchedCount: sampleMatchCount(row),
            }));
        },
        investigatorOptions() { return [...new Set(this.matches.map(row => this.sampleInvestigator(row)).filter(Boolean))].sort(); },
        projectOptions() { return [...new Set(this.matches.map(row => this.sampleCohortDisease(row)))].sort(); },
        ageBands() { return AGE_BANDS; },
        multi() {
            return this.ids.length > 1;
        },
        rphersReferencesDiffer() {
            return this.multi && referenceAvailable(this.sampleStandardization) && referenceAvailable(this.geneStandardization) &&
                !sameReference(this.sampleStandardization, this.geneStandardization);
        },
        isOrphanet() { return this.diseaseSource === "orphanet"; },
        diseaseSourceLabel() { return DISEASE_SOURCES.find((source) => source.key === this.diseaseSource).label; },
        term() {
            return REF.terms[this.ids[0]];
        },
        orphanetExclusions() {
            const all = new Set();
            const byTerm = Object.fromEntries(this.excluded.map(id => [id, new Set()]));
            if (this.excluded.length) this.allOrphanetDiseases.forEach(row => row.excludedBy.forEach(id => {
                all.add(row.code);
                if (byTerm[id]) byTerm[id].add(row.code);
            }));
            return { all, byTerm };
        },
        combinedCountRemovalLabel() {
            return this.ageBandFilter || this.sexFilter || this.affectedFilter || this.selectedProjects.length || this.advancedRules.some(row => row.field !== 'phenotype' || row.operator !== 'exclude') ? 'filtered out' : 'excluded';
        },
        termSummaries() {
            return this.ids.map((id) => {
                const diseases = new Set();
                const veryFrequent = new Set();
                (REF.associations[id] || []).forEach(([index, frequency]) => {
                    if (!FREQUENCIES.some(([name]) => name === frequency)) return;
                    const code = REF.diseases[index]?.[0];
                    if (!code) return;
                    diseases.add(code);
                    if (frequency === FREQUENCIES[0][0] || frequency === FREQUENCIES[1][0])
                        veryFrequent.add(code);
                });
                const matching = this.matches.filter(row => this.sampleTerms(row).includes(id));
                const samples = this.matchesLoaded ? matching.length : null;
                const rate = samples != null && this.cohortSampleCount
                    ? (samples / this.cohortSampleCount) * 100 : null;
                return {
                    id,
                    samples,
                    remainingSamples: this.matchesLoaded ? matching.filter(row => !this.excluded.some(excludedId => this.sampleTerms(row).includes(excludedId))).length : null,
                    percent: rate == null ? null : rate > 0 && rate < 1 ? "<1" : Math.round(rate),
                    diseases: diseases.size,
                    remainingDiseases: [...diseases].filter(code => !this.orphanetExclusions.all.has(code)).length,
                    veryFrequent: veryFrequent.size,
                    remainingVeryFrequent: [...veryFrequent].filter(code => !this.orphanetExclusions.all.has(code)).length,
                    exclusions: this.excluded.map((excludedId) => {
                        const removed = this.orphanetExclusions.byTerm[excludedId];
                        return {
                            id: excludedId,
                            samples: this.matchesLoaded
                                ? matching.filter(row => this.sampleTerms(row).includes(excludedId)).length
                                : null,
                            diseases: [...diseases].filter((code) => removed.has(code)).length,
                            veryFrequent: [...veryFrequent].filter((code) => removed.has(code)).length,
                        };
                    }),
                };
            });
        },
        allTermsSampleCount() {
            return this.matches.filter((row) => sampleMatchCount(row) === this.ids.length).length;
        },
        atLeastTwoSampleCount() {
            return this.matches.filter((row) => sampleMatchCount(row) >= 2).length;
        },
        hpoSearchIndex() { return HPO_SEARCH_INDEX; },
        metadataSamples() { return this.matches; },
        matchingSampleGroups() {
            const candidates = this.metadataSamples.filter(row => this.matchesSampleFilters(row) && !this.excluded.some(id => this.sampleTerms(row).includes(id)));
            return {any: candidates, atLeastTwo: candidates.filter(row => sampleMatchCount(row) >= Math.min(2, this.ids.length)), threshold: candidates.filter(row => sampleMatchCount(row) >= this.effectiveMatchMinimum), all: candidates.filter(row => sampleMatchCount(row) === this.ids.length)};
        },
        effectiveMatchMinimum() { return Math.max(1, Math.min(this.ids.length || 1, this.sampleMatchMinimum)); },
        selectedSampleLabel() { return this.multi ? this.sampleMatchMode === 'any' ? 'Any included HPO' : this.sampleMatchMode === 'all' ? `All ${this.ids.length} HPOs` : `≥${this.effectiveMatchMinimum} of ${this.ids.length} HPOs` : 'This HPO'; },
        selectedGeneSummary() { const mode = this.geneSampleScope === 'whole' ? this.sampleMatchMode : this.geneSampleScope; return mode === 'all' ? this.allGeneSummary : mode === 'any' ? this.anyGeneSummary : this.thresholdGeneSummary; },
        anyGeneSummary() { return summarizeSampleGenes(this.matchingSampleGroups.any, this.scoreMembership, sampleKey, this.sampleCohortDisease); },
        thresholdGeneSummary() { return summarizeSampleGenes(this.matchingSampleGroups.threshold, this.scoreMembership, sampleKey, this.sampleCohortDisease); },
        atLeastGeneSummary() { return summarizeSampleGenes(this.matchingSampleGroups.atLeastTwo, this.scoreMembership, sampleKey, this.sampleCohortDisease); },
        allGeneSummary() { return summarizeSampleGenes(this.matchingSampleGroups.all, this.scoreMembership, sampleKey, this.sampleCohortDisease); },
        cohortDiseases() { return [...new Set(this.metadataSamples.map(this.sampleCohortDisease))].sort(); },
        projectSamples() {
            return this.metadataSamples.filter(row => this.matchesSampleFilters(row, true)
                && this.matchesIncludedMode(row)
                && !this.excluded.some(id => this.sampleTerms(row).includes(id)));
        },
        cohortDiseaseSummary() {
            return cohortSampleSummary(this.projectSamples, {
                cohortOf: (row) => this.sampleCohortDisease(row),
                investigatorOf: (row) => this.sampleInvestigator(row),
                ageOf: (row) => this.sampleAge(row),
                sexOf: (row) => row.gender || (this.sampleInfo[sampleKey(row)] || {}).gender,
                affectedOf: (row) => row.initial_study_affected,
                scoreOf: (row) => row.rphers_z,
            });
        },
        sortedCohortDiseaseSummary() {
            return sortTableRows(this.cohortDiseaseSummary, this.tableSort.cohorts, {
                name: (row) => row.name,
                total: (row) => row.total,
                affected: (row) => row.affected,
                medianAge: (row) => row.medianAge,
                sex: (row) => row.sex.female,
                phers: (row) => row.meanResidualPhers,
            });
        },
        visibleCohortDiseaseSummary() {
            return this.sortedCohortDiseaseSummary.slice((this.cohortPage - 1) * 5, this.cohortPage * 5);
        },
        cohortPageCount() { return Math.max(1, Math.ceil(this.cohortDiseaseSummary.length / 5)); },
        ageSummary() {
            return ageExclusionSummary(this.samplesBeforeExclusion, this.excluded, {
                ageOf: (row) => this.sampleAge(row),
                termsOf: (row) => this.sampleTerms(row),
            });
        },
        sexSummary() {
            return sexExclusionSummary(this.samplesBeforeExclusion, this.excluded, {
                sexOf: (row) => row.gender || (this.sampleInfo[sampleKey(row)] || {}).gender,
                termsOf: (row) => this.sampleTerms(row),
            });
        },
        hpoKnownCount() {
            return this.filteredSamples.filter(
                (row) => this.sampleTerms(row).length
            ).length;
        },
        coTerms() {
            if (!this.hpoKnownCount) return [];
            const counts = new Map();
            this.filteredSamples.forEach((row) => {
                if (!this.sampleTerms(row).length) return;
                new Set(leafTerms(this.sampleTerms(row))).forEach((id) => {
                    if (!this.ids.includes(id) && !this.excluded.includes(id) && REF.terms[id])
                        counts.set(id, (counts.get(id) || 0) + 1);
                });
            });
            return [...counts]
                .map(([id, count]) => ({
                    id,
                    count,
                    percent: Math.round((count / this.hpoKnownCount) * 100),
                }))
                .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
                .slice(0, 8);
        },
        hiddenCount() {
            return this.samplesBeforeExclusion.filter((row) =>
                this.excluded.some((id) => this.sampleTerms(row).includes(id))
            ).length;
        },
        unknownExclusionCount() {
            return this.excluded.length
                ? this.samplesBeforeExclusion.filter((row) => !this.sampleTerms(row).length)
                      .length
                : 0;
        },
        samplesBeforeExclusion() {
            return this.metadataSamples.filter(row => this.matchesSampleFilters(row) && this.matchesIncludedMode(row));
        },
        filteredSamples() {
            return this.samplesBeforeExclusion.filter((row) =>
                !this.excluded.some((id) => this.sampleTerms(row).includes(id))
            );
        },
        qualifyingSamples() {
            return this.filteredSamples;
        },
        visibleSamples() {
            return this.sortedSamples.slice((this.samplePage - 1) * 4, this.samplePage * 4);
        },
        sortedSamples() {
            return sortTableRows(this.qualifyingSamples, this.tableSort.samples, {
                rank: (row) => row.rank,
                sample: (row) => sampleKey(row),
                phers: (row) => row.rphers_z,
                matches: (row) => sampleMatchCount(row),
                ageSex: (row) => {
                    const age = this.sampleAge(row);
                    return age == null ? null : `${String(age).padStart(7, "0")} · ${this.sampleSex(row)}`;
                },
                cohort: (row) => this.sampleCohortDisease(row),
                affected: (row) => row.initial_study_affected || null,
            });
        },
        samplePageCount() { return Math.max(1, Math.ceil(this.qualifyingSamples.length / 4)); },
        allOrphanetDiseases() {
            return diseaseRows(REF, this.ids, this.excluded).map((row) => ({
                ...row, source: "orphanet", referenceId: `ORPHA:${row.code}`, mondoIds: [],
            }));
        },
        allUnweightedDiseases() {
            return unweightedDiseaseRows(REF, additionalReferences, this.ids, this.excluded);
        },
        diseaseSources() {
            return DISEASE_SOURCES.map((source) => ({ ...source,
                count: (source.key === "orphanet" ? this.allOrphanetDiseases : this.allUnweightedDiseases.filter((row) => row.source === source.key))
                    .filter((row) => !row.excludedBy.length).length,
            }));
        },
        allDiseases() {
            return this.isOrphanet ? this.allOrphanetDiseases
                : this.allUnweightedDiseases.filter((row) => row.source === this.diseaseSource);
        },
        orphanetDiseases() {
            return this.allOrphanetDiseases.filter((row) => !row.excludedBy.length)
                .map((row, index) => ({ ...row, rank: index + 1 }));
        },
        diseases() {
            return this.allDiseases.filter((row) => !row.excludedBy.length)
                .map((row, index) => ({ ...row, rank: index + 1 }));
        },
        candidates() {
            return this.isOrphanet ? this.diseases.filter((row) => row.score >= CANDIDATE_SCORE_THRESHOLD) : this.diseases;
        },
        obligateCount() {
            return this.diseases.filter(
                (row) => row.frequency === FREQUENCIES[0][0]
            ).length;
        },
        veryFrequentCount() {
            return this.diseases.filter(
                (row) => row.frequency === FREQUENCIES[1][0]
            ).length;
        },
        significantGeneCount() {
            return this.referenceFilteredGeneRows.filter(this.significantGene).length;
        },
        geneReferenceSources() { return GENE_REFERENCE_SOURCES; },
        geneReferenceLinks() {
            return buildGeneReferenceEvidence(this.orphanetDiseases, this.allUnweightedDiseases,
                {multi: this.multi, threshold: CANDIDATE_SCORE_THRESHOLD});
        },
        geneRows() {
            const map = new Map();
            if (this.genes)
                this.genes.associations.forEach((association) =>
                    map.set(association.gene, {
                        gene: association.gene,
                        association,
                        diseases: [],
                    })
                );
            Object.entries(this.geneReferenceLinks).forEach(([gene, diseases]) => {
                if (!map.has(gene)) map.set(gene, {gene, association: null, diseases: []});
                map.get(gene).diseases = diseases;
            });
            if (this.multi) Object.keys(this.selectedGeneSummary.genes).forEach(gene => {
                if (!map.has(gene)) map.set(gene, {gene, association: null, diseases: []});
            });
            return [...map.values()].sort(
                (a, b) =>
                    Number(Boolean(b.association)) -
                        Number(Boolean(a.association)) ||
                    (a.association?.qValue ?? Infinity) -
                        (b.association?.qValue ?? Infinity) ||
                    a.gene.localeCompare(b.gene)
            );
        },
        referenceFilteredGeneRows() {
            return this.geneReferenceSource === 'all' ? this.geneRows
                : this.geneRows.filter(row => row.diseases.some(disease => disease.source === this.geneReferenceSource));
        },
        geneFilters() {
            if (this.multi && this.geneSampleScope !== 'whole') {
                const rows = this.referenceFilteredGeneRows.filter(row => this.selectedGeneCount(row.gene) > 0);
                return [
                    {key: 'selected', label: 'In selected samples', count: rows.length},
                    {key: 'shared', label: `Shared by all ${this.selectedGeneSummary.total}`, count: rows.filter(row => this.sharedByAllSelected(row.gene)).length},
                    {key: 'significant', label: 'Full-cohort q < 0.05', count: rows.filter(this.significantGene).length},
                    {key: 'linked', label: 'Also in references', count: rows.filter(row => row.diseases.length).length},
                ];
            }
            const filters = [
                {key: 'significant', label: 'q < 0.05', count: this.significantGeneCount},
                {key: 'all', label: this.multi ? 'All tested' : 'Available evidence', count: this.multi ? this.referenceFilteredGeneRows.filter(row => row.association).length : this.referenceFilteredGeneRows.length},
                {key: 'linked', label: 'Also in references', count: this.referenceFilteredGeneRows.filter(row => row.diseases.length && row.association).length},
            ];
            if (this.multi) filters.push({key: 'union', label: 'CRDC or references', count: this.referenceFilteredGeneRows.length});
            return filters;
        },
        filteredGenes() {
            return this.referenceFilteredGeneRows.filter(row => {
                if (this.geneSearch.trim() && !row.gene.toLowerCase().includes(this.geneSearch.trim().toLowerCase())) return false;
                if (this.multi && this.geneSampleScope !== 'whole' && !this.selectedGeneCount(row.gene)) return false;
                if (this.multi && this.geneSampleScope === 'whole' && this.geneFilter === 'all' && !row.association) return false;
                if (this.geneFilter === 'shared') return this.sharedByAllSelected(row.gene);
                if (this.geneFilter === 'significant') return this.significantGene(row);
                if (this.geneFilter === 'linked') return row.diseases.length && (this.geneSampleScope !== 'whole' || row.association);
                return true;
            });
        },
        visibleGenes() {
            return this.sortedGenes.slice((this.genePage - 1) * 4, this.genePage * 4);
        },
        sortedGenes() {
            return sortTableRows(this.filteredGenes, this.tableSort.genes, {
                gene: (row) => row.gene,
                groupAny: (row) => this.anyGeneSummary.covered ? (this.anyGeneSummary.genes[row.gene]?.count || 0) : null,
                groupAtLeast: (row) => this.atLeastGeneSummary.covered ? (this.atLeastGeneSummary.genes[row.gene]?.count || 0) : null,
                groupAll: (row) => this.allGeneSummary.covered ? (this.allGeneSummary.genes[row.gene]?.count || 0) : null,
                projects: (row) => this.selectedGeneSummary.genes[row.gene]?.projects.size ?? null,
                evidence: (row) => Number(this.significantGene(row)) * 2 + Number(Boolean(row.diseases.length)),
                effect: (row) => this.multi ? row.association?.betaSdPer0_1Grs : row.association?.betaPer0_1Grs,
                support: (row) => this.multi ? row.association?.nPositive : row.association?.betaCiLowPer0_1Grs,
                p: (row) => row.association?.pValue,
                q: (row) => row.association?.qValue,
                disease: (row) => Math.max(0, ...this.geneDiseaseLinks(row).map(disease => disease.matchedIds.length)),
            });
        },
        genePageCount() { return Math.max(1, Math.ceil(this.filteredGenes.length / 4)); },
        maxSingleBeta() {
            return Math.max(
                1e-12,
                ...this.geneRows.map((row) =>
                    row.association ? Math.abs(Number(row.association.betaPer0_1Grs)) || 0 : 0
                )
            );
        },
        diseaseFilters() {
            if (this.multi || !this.isOrphanet) {
                return [];
            }
            return [
                {
                    key: "default",
                    label: "Obligate + very frequent",
                    count: this.obligateCount + this.veryFrequentCount,
                },
                ...FREQUENCIES.map(([key, label]) => ({
                    key,
                    label,
                    count: this.diseases.filter((row) => row.frequency === key)
                        .length,
                })),
                { key: "all", label: "All", count: this.diseases.length },
                {
                    key: "diagnostic",
                    label: "Diagnostic criterion",
                    count: this.diseases.filter((row) => row.diagnostic).length,
                },
            ];
        },
        filteredDiseases() {
            const q = this.diseaseQuery.toLowerCase();
            return this.diseases.filter((row) => {
                const include = this.multi || !this.isOrphanet
                    ? true
                    : this.diseaseFilter === "all" ||
                      (this.diseaseFilter === "diagnostic" && row.diagnostic) ||
                      (this.diseaseFilter === "default" &&
                          [FREQUENCIES[0][0], FREQUENCIES[1][0]].includes(
                              row.frequency
                          )) ||
                      row.frequency === this.diseaseFilter;
                return (
                    include &&
                    (!q ||
                        row.name.toLowerCase().includes(q) ||
                        row.genes.some((gene) =>
                            gene[0].toLowerCase().includes(q)
                        ))
                );
            });
        },
        visibleDiseases() {
            return this.sortedDiseases.slice((this.diseasePage - 1) * 5, this.diseasePage * 5);
        },
        sortedDiseases() {
            return sortTableRows(this.filteredDiseases, this.tableSort.diseases, {
                rank: (row) => row.rank,
                disease: (row) => row.name,
                score: (row) => !this.isOrphanet ? row.overlapCount : this.multi ? row.score : FREQUENCIES.findIndex((item) => item[0] === row.frequency),
                matched: (row) => this.multi || !this.isOrphanet ? row.matchedIds.length : Number(row.diagnostic),
                genes: (row) => row.genes.map((gene) => gene[0]).join(", "),
            });
        },
        diseasePageCount() { return Math.max(1, Math.ceil(this.filteredDiseases.length / 5)); },
        narrowing() {
            return narrowingTerms(this.candidates, this.ids, this.excluded);
        },
        sortedNarrowing() {
            return sortTableRows(this.narrowing, this.tableSort.narrowing, {
                phenotype: (row) => this.name(row.hpoId),
                count: (row) => row.count,
            });
        },
        narrowingIds() {
            return this.narrowing.map((item) => item.hpoId);
        },
    },
    methods: {
        scheduleMultiGeneComparison() {
            clearTimeout(this._multiComparisonTimer);
            if (this._multiComparisonAbort) this._multiComparisonAbort.abort();
            this.multiComparisonRequest++; this.multiGeneResult = null;
            if (!this.multi || !this.matchesLoaded) { this.multiGeneLoading = false; return; }
            this.multiGeneLoading = true;
            this._multiComparisonTimer = setTimeout(() => this.loadMultiGeneComparison(), 180);
        },
        async loadMultiGeneComparison() {
            if (!this.multi || !this.matchesLoaded) return;
            const request = ++this.multiComparisonRequest;
            if (this._multiComparisonAbort) this._multiComparisonAbort.abort();
            const controller = new AbortController(); this._multiComparisonAbort = controller;
            this.multiGeneLoading = true; this.multiGeneError = '';
            try {
                const response = await fetch('/__hpo_gene_carrier_comparison__', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
                    body: JSON.stringify({ hpo_ids: [...this.ids], minimum: this.sampleMatchMode === 'any' ? 1 : this.sampleMatchMode === 'all' ? this.ids.length : this.effectiveMatchMinimum, sample_ids: this.qualifyingSamples.map(sampleKey) }) });
                if (!response.ok) throw new Error('Profile carrier comparison is unavailable.');
                const result = await response.json();
                if (!Array.isArray(result.rows) || result.adjusted !== false || result.matchingSampleCount !== this.qualifyingSamples.length) throw new Error('Unexpected profile comparison result.');
                if (request === this.multiComparisonRequest) this.multiGeneResult = Object.freeze(result);
            } catch (error) { if (request === this.multiComparisonRequest && !controller.signal.aborted) this.multiGeneError = error.message; }
            finally { if (request === this.multiComparisonRequest) this.multiGeneLoading = false; }
        },
        requireSingleFeature(id) {
            if (this.multi) {
                if (!this.advancedRules.some(row => row.field === 'phenotype' && row.operator === 'contains' && row.value === id))
                    this.applyProfile({ ids: [...this.ids], excluded: this.excluded.filter(value => value !== id), rules: [...this.advancedRules, { field: 'phenotype', operator: 'contains', value: id, required: true }], matchMode: this.sampleMatchMode, minimum: this.sampleMatchMinimum });
                return;
            }
            this.applyProfile({ ids: [...new Set([...this.ids, id])], excluded: [...this.excluded], rules: [...this.advancedRules], matchMode: 'all', minimum: 2 });
        },
        excludeSingleFeature(id) {
            this.applyProfile({ ids: [...this.ids], excluded: [...new Set([...this.excluded, id])], rules: this.advancedRules.filter(row => !(row.field === 'phenotype' && row.value === id)), matchMode: this.sampleMatchMode, minimum: this.sampleMatchMinimum });
        },
        referenceSourceLabel(source) { return DISEASE_SOURCES.find(item => item.key === source)?.label || source; },
        geneDiseaseLinks(row) { return this.geneReferenceSource === 'all' ? row.diseases : row.diseases.filter(disease => disease.source === this.geneReferenceSource); },
        toggleGeneReferences(gene, open) {
            this.expandedGeneReferences = open ? [...new Set([...this.expandedGeneReferences, gene])]
                : this.expandedGeneReferences.filter(item => item !== gene);
        },
        countChange(before, after, unit, reason = 'excluded') {
            if (before == null || after == null) return `— ${unit}`;
            const change = this.excluded.length || before !== after;
            return change
                ? `${before.toLocaleString()} → ${after.toLocaleString()} ${unit} (${(before - after).toLocaleString()} ${reason})`
                : `${before.toLocaleString()} ${unit}`;
        },
        selectGeneSampleScope(scope, minimum = 2) {
            if (!['whole', 'any', 'all', 'atLeastTwo'].includes(scope)) return;
            if (scope === 'atLeastTwo') this.sampleMatchMinimum = minimum;
            this.geneSampleScope = scope;
            this.geneFilter = scope === 'whole' ? 'all' : 'selected';
            this.genePage = 1;
            if (scope !== 'whole') this.sampleMatchMode = scope;
            this.$set(this.tableSort, 'genes', {key: scope === 'whole' ? '' : scope === 'all' ? 'groupAll' : scope === 'any' ? 'groupAny' : 'groupAtLeast', dir: 'desc'});
            this.syncUrl();
        },
        matchesIncludedMode(row) { const minimum = this.sampleMatchMode === 'any' ? 1 : this.sampleMatchMode === 'all' ? this.ids.length : this.effectiveMatchMinimum; return sampleMatchCount(row) >= minimum; },
        resetSelectedPages() { this.samplePage = 1; this.cohortPage = 1; this.genePage = 1; },
        matchesSampleFilters(row, ignoreProject = false) {
            return (ignoreProject || !this.selectedProjects.length || this.selectedProjects.includes(this.sampleCohortDisease(row))) &&
                (!this.affectedFilter || row.initial_study_affected === this.affectedFilter) &&
                (!this.ageBandFilter || this.sampleAgeBand(row) === this.ageBandFilter) &&
                (!this.sexFilter || sexCategory(row.gender || (this.sampleInfo[sampleKey(row)] || {}).gender).toLowerCase() === this.sexFilter) &&
                matchesRules(row, this.advancedRules, {
                    termsOf: sample => this.sampleTerms(sample), ageOf: sample => this.sampleAge(sample),
                    sexOf: sample => sexCategory(sample.gender || (this.sampleInfo[sampleKey(sample)] || {}).gender).toLowerCase(),
                    affectedOf: sample => sample.initial_study_affected || 'unknown',
                    investigatorOf: sample => this.sampleInvestigator(sample), projectOf: sample => this.sampleCohortDisease(sample),
                });
        },
        selectedGeneCount(gene) { return this.selectedGeneSummary.genes[gene]?.count || 0; },
        sharedByAllSelected(gene) {
            const group = this.selectedGeneSummary;
            return group.total > 0 && group.covered === group.total && this.selectedGeneCount(gene) === group.total;
        },
        groupScoreCell(gene, group) {
            if (this.membershipLoading) return '…';
            if (!this.scoreMembership || !group.covered) return '—';
            return `${group.genes[gene]?.count || 0}/${group.covered}`;
        },
        geneProjectCell(gene) {
            if (this.sampleInfoLoading || this.membershipLoading) return '…';
            const value = this.selectedGeneSummary.genes[gene];
            if (!value) return '—';
            return `${value.projects.size}${value.unknownProjectCount ? ' (partial)' : ''}`;
        },
        async loadSampleGeneScores(samples = this.metadataSamples) {
            if (this.multi && this._isMounted) return;
            const request = ++this.membershipRequest;
            this.scoreMembership = null; this.membershipError = ''; this.membershipLoading = false;
            if (!this.multi || !samples.length) return;
            this.membershipLoading = true;
            try {
                const membership = await fetchSampleGeneScores(samples.map(sampleKey));
                if (request === this.membershipRequest) this.scoreMembership = membership;
            } catch (error) {
                if (request === this.membershipRequest) this.membershipError = error.message;
            } finally {
                if (request === this.membershipRequest) this.membershipLoading = false;
            }
        },
        significantGene(row) {
            return row.association?.qValue != null && row.association.qValue < 0.05;
        },
        toggleSort(table, key) {
            const current = this.tableSort[table];
            const defaultDescending = (table === 'genes' && key === 'disease') || ["phers", "matches", "total", "affected", "effect", "evidence", "matched", "count", "sex", "groupAtLeast", "groupAll", "projects"].includes(key);
            this.$set(this.tableSort, table, {
                key,
                dir: current.key === key
                    ? current.dir === "asc" ? "desc" : "asc"
                    : defaultDescending ? "desc" : "asc",
            });
            if (table === "samples") this.samplePage = 1;
            if (table === "cohorts") this.cohortPage = 1;
            if (table === "genes") this.genePage = 1;
            if (table === "diseases") this.diseasePage = 1;
        },
        sortIndicator(table, key) {
            const sort = this.tableSort[table];
            return sort.key === key ? sort.dir === "asc" ? "▲" : "▼" : "▵";
        },
        name(id) {
            return REF.terms[id] ? REF.terms[id][0] : id;
        },
        sampleKey,
        stat: formatStatistic,
        termStyle(id) {
            const slot = TERM_COLORS[this.colors[id] ?? 0];
            return {
                "--tseg": slot[0],
                "--tc": slot[1],
                "--tbg": slot[2],
                "--tbd": slot[3],
            };
        },
        score(value) {
            return value == null || !Number.isFinite(Number(value))
                ? "—"
                : Number(value).toFixed(3);
        },
        rphersReferenceLabel(reference) { return referenceDescription(reference); },
        sampleTerms(sample) {
            if (Array.isArray(sample.expanded_hpo_ids)) return sample.expanded_hpo_ids;
            return normalizeTerms(
                (this.sampleInfo[sampleKey(sample)] || {}).phenotypes
            );
        },
        sampleMatchDescription(sample) {
            const recorded = new Set(this.sampleTerms(sample));
            return this.ids.map((id) => `${this.name(id)}: ${recorded.has(id) ? "recorded" : "not recorded (unknown)"}`).join("; ");
        },
        sampleSex(sample) {
            const gender = sample.gender || (this.sampleInfo[sampleKey(sample)] || {}).gender;
            const category = sexCategory(gender);
            return category === "Female" ? "F" : category === "Male" ? "M" : "—";
        },
        ageStat(value) { return value == null ? "—" : Number(value.toFixed(1)).toLocaleString(); },
        sampleAge(sample) {
            let raw = sample.age_at_enrollment;
            if (!Object.prototype.hasOwnProperty.call(sample, "age_at_enrollment")) {
                const info = this.sampleInfo[sampleKey(sample)] || {};
                raw = info.age_at_enrollment ?? info.age_for_portal ?? info.age;
            }
            return validAge(raw);
        },
        sampleAgeBand(sample) {
            return ageBand(this.sampleAge(sample));
        },
        sampleCohortDisease(sample) {
            // The profile service has already joined project metadata.
            // Keep selection and counts stable instead of replacing these labels
            // as hundreds of per-sample BioIndex requests finish.
            if (sample.profileMetadataComplete) {
                return typeof sample.cohort_category === "string" && sample.cohort_category.trim()
                    ? sample.cohort_category.trim() : "Unknown";
            }
            const info = this.sampleInfo[sampleKey(sample)] || {};
            const label =
                info.clean_name ||
                info.Project ||
                info.project ||
                info.project_name ||
                sample.cohort_category;
            return typeof label === "string" && label.trim()
                ? label.trim()
                : "Unknown";
        },
        sampleInvestigator(sample) {
            if (sample.profileMetadataComplete) return sample.investigator || '';
            const info = this.sampleInfo[sampleKey(sample)] || {};
            return sample.investigator || info.investigator || info.cohort || info.study || info.study_code || '';
        },
        syncUrl() {
            this.searchQuery = this.ids.join(",");
            const url = new URL(window.location.href);
            url.searchParams.set("query", this.searchQuery);
            if (this.multi) {
                url.searchParams.set("match", this.sampleMatchMode);
                if (this.sampleMatchMode === 'atLeastTwo' && this.effectiveMatchMinimum !== 2) url.searchParams.set('min_match', String(this.effectiveMatchMinimum));
                else url.searchParams.delete('min_match');
                url.searchParams.set("gene_scope", this.geneSampleScope);
            } else {
                url.searchParams.delete("match"); url.searchParams.delete("gene_scope"); url.searchParams.delete("min_match");
            }
            if (this.excluded.length)
                url.searchParams.set("exclude", this.excluded.join(","));
            else url.searchParams.delete("exclude");
            if (this.advancedRules.length) url.searchParams.set('filters', JSON.stringify(this.advancedRules));
            else url.searchParams.delete('filters');
            if (!this.isOrphanet) url.searchParams.set("source", this.diseaseSource);
            else url.searchParams.delete("source");
            window.history.replaceState({}, "", url.pathname + url.search);
        },
        queueFeature(id) { const editor = this.$refs.profileEditor; editor.setMode('include'); editor.choose(id); },
        queueExcluded(id) { const editor = this.$refs.profileEditor; editor.setMode('exclude'); editor.choose(id); },
        applyProfile(profile) {
            const changed = this.ids.join(',') !== profile.ids.join(',');
            if (profile.matchMode && this.sampleMatchMode !== profile.matchMode) this.sampleMatchMode = profile.matchMode;
            if (profile.minimum != null) this.sampleMatchMinimum = profile.minimum;
            if (!profile.ids.length) this.selectedProjects = [];
            if (JSON.stringify(this.advancedRules) !== JSON.stringify(profile.rules)) this.advancedRules = profile.rules;
            if (this.excluded.join(',') !== profile.excluded.join(',')) this.excluded = profile.excluded;
            this.ageBandFilter = ''; this.sexFilter = ''; this.affectedFilter = '';
            if (changed) this.ids = profile.ids;
            const colors = { ...this.colors };
            this.ids.forEach(id => { if (colors[id] == null) colors[id] = Object.keys(colors).length % 8; });
            this.colors = this.ids.length ? colors : {};
            this.resetSelectedPages(); this.diseasePage = 1;
            this.syncUrl();
        },
        submitSearch(query = this.searchQuery) {
            const ids = resolveHpoIds(REF, query);
            if (!ids.length) { this.$refs.profileEditor.error = 'Enter a valid phenotype name or HPO ID.'; return; }
            this.searchQuery = query;
            this.advancedRules = [];
            this.excluded = [];
            this.ageBandFilter = ''; this.sexFilter = ''; this.affectedFilter = '';
            this.ids = ids;
            this.colors = Object.fromEntries(ids.map((id, i) => [id, i % 8]));
            this.excluded = this.excluded.filter((id) => !ids.includes(id));
            this.syncUrl();
        },
        addFeature(id) {
            if (!this.ids.includes(id)) {
                this.ids.push(id);
                this.$set(this.colors, id, Object.keys(this.colors).length % 8);
            }
            if (this.excluded.includes(id)) this.excluded = this.excluded.filter((item) => item !== id);
            this.syncUrl();
        },
        addExcluded(id) {
            if (this.ids.length === 1 && this.ids.includes(id)) return;
            if (!this.excluded.includes(id)) this.excluded.push(id);
            if (this.ids.length > 1 && this.ids.includes(id))
                this.ids = this.ids.filter((item) => item !== id);
            this.syncUrl();
        },
        removeTerm(id) {
            this.ids = this.ids.filter((item) => item !== id);
            this.syncUrl();
        },
        removeExcluded(id) {
            this.advancedRules = this.advancedRules.filter(row => !(row.field === 'phenotype' && row.operator === 'exclude' && row.value === id));
            this.excluded = this.excluded.filter((item) => item !== id);
            this.syncUrl();
        },
        async loadHpoCounts() {
            this.hpoCountsStatus = 'loading';
            try { this.hpoSampleCounts = await loadCrdcHpoCounts(); this.hpoCountsStatus = 'ready'; }
            catch (_) { this.hpoCountsStatus = 'error'; }
        },
        async retryHpoAvailability() { await this.loadHpoCounts(); if (this.ids.length) { this.loadSamples(); this.loadGenes(); } },
        async checkSearchAvailability(ids) {
            if (this.hpoCountsStatus !== 'ready') await this.loadHpoCounts();
            validateCrdcHpos(ids, this.hpoSampleCounts, this.hpoCountsStatus, this.name);
        },
        async loadSamples() {
            if (!this.ids.length) return;
            const request = ++this.sampleRequest;
            this.sampleLoading = true;
            this.sampleError = "";
            try {
                await this.checkSearchAvailability([...this.ids, ...this.excluded, ...this.advancedRules.filter(row => row.field === 'phenotype').map(row => row.value)]);
                if (request !== this.sampleRequest) return;
                const endpoint = "/__pb_phenotype_profile__/profile";
                const fetchPage = async (page) => {
                    const response = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ hpo_ids: this.ids, page, page_size: 100 }),
                    });
                    if (!response.ok) throw new Error(`CRDC profile API returned ${response.status}.`);
                    const result = await response.json();
                    if (!Array.isArray(result.samples) || result.scoring_method !== "residual PheRS: rphers_fast.score_samples")
                        throw new Error("CRDC profile API returned an unexpected result.");
                    return result;
                };
                const first = await fetchPage(1);
                const reference = contextMatches(first.rphers_standardization, this.ids) ? first.rphers_standardization : null;
                const pages = Math.ceil(first.pagination.total / 100);
                const matches = [...first.samples];
                for (let start = 2; start <= pages; start += 8) {
                    if (request !== this.sampleRequest) return;
                    const batch = await Promise.all(
                        Array.from({ length: Math.min(8, pages - start + 1) }, (_, index) => fetchPage(start + index))
                    );
                    batch.forEach((result) => {
                        if (reference && !sameReference(reference, result.rphers_standardization))
                            throw new Error("CRDC profile pages returned different SD references; retry the request.");
                        matches.push(...result.samples);
                    });
                }
                if (request === this.sampleRequest) {
                    this.sampleStandardization = reference;
                    this.projectMetadataSource = first.project_metadata_source || "";
                    this.matches = matches.map((row, index) => ({ ...row, rank: index + 1,
                        profileMetadataComplete: ["cohort_category", "age_at_enrollment", "gender"].every(
                            field => Object.prototype.hasOwnProperty.call(row, field)
                        ) && Array.isArray(row.expanded_hpo_ids),
                        rphers_z: referenceAvailable(reference) && typeof row.rphers_z === "number" && Number.isFinite(row.rphers_z)
                            ? row.rphers_z : null }));
                    this.matchesLoaded = true;
                    this.cohortSampleCount = first.cohort_sample_count;
                }
            } catch (error) {
                if (request === this.sampleRequest)
                    this.sampleError = error.message;
            } finally {
                if (request === this.sampleRequest) this.sampleLoading = false;
            }
        },
        async loadSampleInfo(samples) {
            const request = ++this.infoRequest;
            const pending = samples.filter(sample => !sample.profileMetadataComplete && !this.sampleInfoChecked[sampleKey(sample)]);
            this.sampleInfoLoading = pending.length > 0;
            let cursor = 0;
            let received = {}, checked = {}, publishTimer = null;
            const publish = () => {
                publishTimer = null;
                if (request !== this.infoRequest) return;
                // A single metadata response used to invalidate both full
                // sample/gene summaries. Publish a batch at most once a second.
                if (Object.keys(received).length) this.sampleInfo = Object.freeze({ ...this.sampleInfo, ...received });
                if (Object.keys(checked).length) this.sampleInfoChecked = Object.freeze({ ...this.sampleInfoChecked, ...checked });
                received = {}; checked = {};
            };
            const worker = async () => {
                while (cursor < pending.length && request === this.infoRequest) {
                    const sample = pending[cursor++];
                    const key = sampleKey(sample);
                    for (const suffix of ["_E38", "_G38"]) {
                        const controller = new AbortController();
                        const timeout = setTimeout(() => controller.abort(), 20000);
                        try {
                            const id = `${key}${suffix}`;
                            const response = await bioIndexRequest("/api/bio/query/samples-info", { q: id, limit: 5 }, true, {signal: controller.signal});
                            if (!response.ok) continue;
                            const data = await response.json();
                            const exact = (data.data || []).find(row => row.SampleInVCF === id && row.sample_id === key);
                            if (request === this.infoRequest && exact) { received[key] = exact; break; }
                        } catch (_) { /* Keep the profile's cohort label when metadata is unavailable. */ }
                        finally { clearTimeout(timeout); }
                    }
                    if (request === this.infoRequest) {
                        checked[key] = true;
                        if (!publishTimer) publishTimer = setTimeout(publish, 1000);
                    }
                }
            };
            await Promise.all(Array.from({length: Math.min(8, pending.length)}, worker));
            clearTimeout(publishTimer);
            if (request === this.infoRequest) { publish(); this.sampleInfoLoading = false; }
        },
        async loadGenes() {
            if (this.multi) { this.genes = null; this.geneLoading = false; this.scheduleMultiGeneComparison(); return; }
            const request = ++this.geneRequest;
            if (!this.ids.length) {
                this.genes = null;
                this.geneFilter = "all";
                this.geneLoading = false;
                this.geneError = "";
                return;
            }
            const ids = [...this.ids];
            this.geneLoading = true;
            this.geneError = "";
            try {
                await this.checkSearchAvailability(ids);
                if (request !== this.geneRequest) return;
                let data;
                if (this.multi) {
                    data = await fetchProfileGeneAssociations(ids);
                } else {
                    const response = await fetch(`/__hpo_gene_associations__?hpo=${encodeURIComponent(ids[0])}&view=all-genes`);
                    if (!response.ok) throw new Error(`CRDC gene analysis returned ${response.status}.`);
                    data = await response.json();
                }
                let genes;
                if (this.multi) {
                    const received = data.query_hpo || [];
                    if (received.length !== ids.length ||
                        ids.some((id) => !received.includes(id)) ||
                        data.multiple_testing_scope !== "all valid genes in approved score source" ||
                        !data.gene_associations ||
                        Number(data.n_tests) !== Object.keys(data.gene_associations).length)
                        throw new Error("Gene analysis returned a different HPO profile.");
                    const reference = contextMatches(data.rphers_standardization, ids) ? data.rphers_standardization : null;
                    genes = {
                        rphersStandardization: reference,
                        nTests: Number(data.n_tests) || 0,
                        analysisSampleCount: new Set(Object.values(data.gene_associations).map(item => item.n_samples)).size === 1 ? Object.values(data.gene_associations)[0]?.n_samples : null,
                        associations: Object.entries(data.gene_associations).map(([gene, item]) => ({
                                gene: gene.toUpperCase(),
                                beta: item.beta,
                                betaSdPer0_1Grs: standardizedField(item, "beta_sd_per_0_1_grs", reference),
                                standardErrorSdPer0_1Grs: standardizedField(item, "standard_error_sd_per_0_1_grs", reference),
                                pValue: item.p_value,
                                qValue: item.fdr,
                                nPositive: item.n_positive,
                            })),
                    };
                } else {
                    if (data.hpoId !== ids[0] || !Array.isArray(data.associations))
                        throw new Error("Unexpected gene release result.");
                    genes = data;
                }
                if (request === this.geneRequest) {
                    this.genes = genes;
                    this.geneStandardization = this.multi ? genes.rphersStandardization : null;
                    this.geneFilter = this.multi && this.geneSampleScope !== 'whole' ? 'selected' : (this.multi ? 'all' : 'significant');
                }
            } catch (error) {
                if (request === this.geneRequest)
                    this.geneError = error.message;
            } finally {
                if (request === this.geneRequest) this.geneLoading = false;
            }
        },
        toggleDisease(code) {
            this.expandedDiseases = this.expandedDiseases.includes(code)
                ? this.expandedDiseases.filter((item) => item !== code)
                : [...this.expandedDiseases, code];
        },
        toggleFeatures(code) {
            this.expandedFeatures = this.expandedFeatures.includes(code)
                ? this.expandedFeatures.filter((item) => item !== code)
                : [...this.expandedFeatures, code];
        },
        frequencyShort(value) {
            const item = FREQUENCIES.find((row) => row[0] === value);
            return item ? item[1] : value;
        },
        frequencyClass(value) {
            return value === FREQUENCIES[0][0]
                ? "obligate"
                : value === FREQUENCIES[1][0]
                ? "very-frequent"
                : "";
        },
        diseaseWhy(row) {
            if (row.source !== "orphanet") {
                return `${row.overlapCount}/${row.profile.length} unique disease HPO annotations match the query; ${row.matchedIds.length}/${this.ids.length} input HPOs are explained. Matches include more specific annotations. Each disease annotation is counted once, even when several input terms match it. No frequency weighting is used.`;
            }
            return this.multi
                ? `${row.matchedIds.length}/${this.ids.length} query terms match this disease or a more specific annotation. How ${row.score.toFixed(2)} is calculated: N ${row.numerator.toFixed(4)} ÷ S(D) ${row.denominator.toFixed(4)} = Cov_D ${row.diseaseCoverage.toFixed(3)}; N ÷ ${this.ids.length} = Cov_Q ${row.queryCoverage.toFixed(3)}; harmonic mean ${row.rawScore.toFixed(3)} = ${row.score.toFixed(2)}.`
                : `${this.name(
                      this.ids[0]
                  )} is annotated as ${row.frequency.toLowerCase()}${
                      row.diagnostic
                          ? " and belongs to an established diagnostic criteria set"
                          : ""
                  }.`;
        },
        featureGroups(row) {
            if (row.source !== "orphanet") return [{name: "Annotated HPOs", short: "Annotated HPOs", items: row.profile}];
            return FREQUENCIES.map(([name, short]) => ({
                name,
                short,
                items: row.profile.filter((item) => item.frequency === name),
            })).filter((group) => group.items.length);
        },
        copyGenes() {
            navigator.clipboard.writeText(
                this.sortedGenes.map((row) => row.gene).join("\n")
            );
        },
        exportGenes() {
            const quote = (value) =>
                `"${String(value == null ? "" : value).replace(/"/g, '""')}"`;
            const lines = [
                [
                    "gene",
                    ...(this.multi ? ["gene_result_scope", "selected_sample_group", "selected_sample_n", "selected_score_coverage_n", "positive_in_at_least_two", "at_least_two_n", "at_least_two_coverage_n", "positive_in_all_terms", "all_terms_n", "all_terms_coverage_n", "selected_positive_projects", "association_scope", "analysis_sample_n"] : []),
                    this.multi ? "crdc_gene_score_q_significant" : "crdc_burden_q_significant",
                    "orphanet_link",
                    "omim_link", "ddg2p_link", "decipher_link", "reference_sources", "reference_db_filter",
                    this.multi ? "beta_sd_per_0_1_grs" : "beta_log_odds_per_0_1_grs",
                    this.multi ? "standard_error_sd_per_0_1_grs" : "standard_error_log_odds_per_0_1_grs",
                    this.multi ? "n_positive" : "beta_ci_low_log_odds_per_0_1_grs",
                    ...(this.multi ? [] : ["beta_ci_high_log_odds_per_0_1_grs"]),
                    "p",
                    "q",
                    "linked_diseases",
                    "reference_records",
                    ...(this.multi ? [] : ["analysis_n", "effect_model", "effect_unit", "effect_approximation", "source_release"]),
                    ...(this.multi ? ["rphers_reference_id", "rphers_reference_mean", "rphers_reference_sd", "rphers_reference_n", "rphers_standardization_version"] : []),
                ],
                ...this.sortedGenes.map((row) => [
                    row.gene,
                    ...(this.multi ? [this.geneSampleScope, this.selectedSampleLabel, this.selectedGeneSummary.total, this.selectedGeneSummary.covered,
                        this.atLeastGeneSummary.covered ? this.atLeastGeneSummary.genes[row.gene]?.count || 0 : null, this.atLeastGeneSummary.total, this.atLeastGeneSummary.covered,
                        this.allGeneSummary.covered ? this.allGeneSummary.genes[row.gene]?.count || 0 : null, this.allGeneSummary.total, this.allGeneSummary.covered,
                        this.selectedGeneSummary.genes[row.gene]?.projects.size ?? null, "full_cohort_reference", this.genes?.analysisSampleCount] : []),
                    this.significantGene(row),
                    row.diseases.some(item => item.source === 'orphanet'),
                    ...['omim', 'ddg2p', 'decipher'].map(source => this.geneReferenceSources.find(item => item.key === source).available ? row.diseases.some(item => item.source === source) : null),
                    [...new Set(row.diseases.map(item => this.referenceSourceLabel(item.source)))].join('; '), this.geneReferenceSource,
                    this.multi ? row.association?.betaSdPer0_1Grs : row.association?.betaPer0_1Grs,
                    this.multi ? row.association?.standardErrorSdPer0_1Grs : row.association?.standardErrorPer0_1Grs,
                    this.multi ? row.association?.nPositive : row.association?.betaCiLowPer0_1Grs,
                    ...(this.multi ? [] : [row.association?.betaCiHighPer0_1Grs]),
                    row.association?.pValue,
                    row.association?.qValue,
                    row.diseases.map((item) => item.name).join("; "),
                    JSON.stringify(row.diseases),
                    ...(this.multi ? [] : [row.association?.nSamples, row.association?.model, row.association?.effectUnit,
                        row.association?.effectApproximation, row.association?.sourceRelease]),
                    ...(this.multi ? [this.geneStandardization?.reference_id, this.geneStandardization?.reference_mean,
                        this.geneStandardization?.reference_sd, this.geneStandardization?.reference_n,
                        this.geneStandardization?.version] : []),
                ]),
            ].map((row) => row.map(quote).join(","));
            const url = URL.createObjectURL(
                new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" })
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = `phenotype-genes-${this.ids.join("-")}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        },
    },
};
</script>
<style src="./style.css"></style>
