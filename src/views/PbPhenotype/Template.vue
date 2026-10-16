<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>
        <main class="container-fluid mdkp-body pbp-page">
            <div class="pbp-shell">
                <div class="pbp-toolbar">
                    <div class="pbp-crumb">
                        <a href="/pb_Front.html">Home</a><span>›</span
                        ><b>Phenotype search</b>
                    </div>
                    <form class="pbp-search" @submit.prevent="submitSearch">
                        <input
                            v-model.trim="searchQuery"
                            aria-label="HPO IDs"
                            placeholder="Comma-separated HPO IDs"
                        /><button class="pbp-btn primary">Search</button>
                    </form>
                </div>
                <template v-if="ids.length">
                    <section class="pbp-card pbp-context">
                        <div class="pbp-rowhead">
                            <div>
                                <span class="pbp-tag ont"
                                    >HPO CONTEXT · ON-DEMAND TOOL ·
                                    {{ ids.length }}
                                    {{
                                        ids.length === 1 ? "TERM" : "TERMS"
                                    }}</span
                                >
                                <div class="pbp-chips">
                                    <span
                                        v-for="id in ids"
                                        :key="id"
                                        class="pbp-chip"
                                        :class="{ neutral: ids.length > 8 }"
                                        :style="termStyle(id)"
                                        ><span
                                            ><b>{{ name(id) }}</b
                                            ><small>{{ id }}</small></span
                                        ><button
                                            type="button"
                                            :aria-label="`Remove ${name(id)}`"
                                            @click="removeTerm(id)"
                                        >
                                            ×
                                        </button></span
                                    >
                                    <form
                                        class="pbp-add"
                                        @submit.prevent="addTerm(false)"
                                    >
                                        <input
                                            v-model.trim="addQuery"
                                            aria-label="Add phenotype"
                                            placeholder="+ Add phenotype or HPO ID"
                                            list="pbp-options"
                                            @input="addIdAsTyped(false)"
                                            @change="addTerm(false)"
                                        /><button type="submit">+</button>
                                    </form>
                                </div>
                            </div>
                            <div class="pbp-patient">
                                <span>Patient context</span
                                ><select v-model="ageBandFilter" aria-label="Age range">
                                    <option value="">Any age</option>
                                    <option v-for="band in ageBands" :key="band.label" :value="band.label">{{ band.label }}</option>
                                    <option value="Unknown">Unknown age</option>
                                </select><select v-model="sexFilter" aria-label="Sex">
                                    <option value="">Any sex</option>
                                    <option value="female">Female</option>
                                    <option value="male">Male</option></select
                                ><select v-model="affectedFilter" aria-label="Affected">
                                    <option value="">Affected: any</option>
                                    <option value="Y">Affected: yes</option>
                                    <option value="N">Affected: no</option>
                                </select><button
                                    type="button"
                                    class="pbp-btn small"
                                    @click="saveProfile"
                                >
                                    {{ saved ? "Saved" : "Save profile" }}
                                </button>
                            </div>
                        </div>
                        <datalist id="pbp-options">
                            <option
                                v-for="item in hpoOptions"
                                :key="item.id"
                                :value="item.id"
                            >
                                {{ item.name }}
                            </option>
                        </datalist>
                        <div class="pbp-exrow">
                            <b>⊘ Exclude</b
                            ><span
                                v-for="id in excluded"
                                :key="id"
                                class="pbp-excluded"
                                >{{ name(id) }} <small>{{ id }}</small
                                ><button
                                    type="button"
                                    :aria-label="`Remove excluded ${name(id)}`"
                                    @click="removeExcluded(id)"
                                >
                                    ×
                                </button></span
                            >
                            <form
                                class="pbp-add exclude"
                                @submit.prevent="addTerm(true)"
                            >
                                <input
                                    v-model.trim="excludeQuery"
                                    aria-label="Exclude phenotype"
                                    placeholder="+ Add a phenotype to exclude"
                                    list="pbp-options"
                                    @input="addIdAsTyped(true)"
                                    @change="addTerm(true)"
                                /><button type="submit">+</button>
                            </form>
                            <span class="pbp-helper"
                                >Samples with the term in their expanded HPO profile are hidden;
                                diseases annotated with it are
                                down-ranked.</span
                            >
                        </div>
                        <p v-if="multi" class="pbp-banner">
                            This set is scored as one profile. Samples are
                            ranked by residual PheRS. Candidate genes follow
                            Orphanet disease links. Disease profile scores
                            combine query and disease phenotype coverage, then
                            subtract a penalty for user-excluded terms. None
                            of this is a diagnosis.
                        </p>
                        <p v-else class="pbp-context-note">
                            {{ term ? term[1] : "" }} Parent:
                            {{
                                term ? (term[2] || []).map(name).join(", ") : ""
                            }}
                            ·
                            <a
                                :href="`https://hpo.jax.org/browse/term/${ids[0]}`"
                                target="_blank"
                                rel="noopener noreferrer"
                                >Ontology and definition</a
                            >
                            · {{ reference.meta.hpoOBO }}
                        </p>
                    </section>
                    <div class="pbp-metrics">
                        <div class="pbp-metric teal">
                            <div class="label">
                                {{
                                    multi
                                        ? `Returned samples matching ≥2 of ${ids.length} terms`
                                            : `Samples matched to ${name(
                                              ids[0]
                                          )}`
                                }}
                            </div>
                            <div class="value">
                                {{
                                    matchesLoaded
                                        ? qualifyingSamples.length
                                        : "—"
                                }}
                            </div>
                            <div class="detail">
                                {{
                                    matchesLoaded
                                        ? `${matches.length} with ≥1 term · ${cohortSampleCount.toLocaleString()} cohort samples`
                                        : "CRDC HPO profile API"
                                }}
                            </div>
                        </div>
                        <div class="pbp-metric teal">
                            <div class="label">
                                {{ multi ? "Genes with profile signal" : "Genes with burden signal" }}
                            </div>
                            <div class="value">
                                {{ genes ? (multi ? geneRows.filter(significantGene).length : genes.total) : "—" }}
                            </div>
                            <div class="detail">
                                {{
                                    multi
                                        ? geneLoading ? "Calculating candidate genes…" : geneError ? "Gene analysis unavailable" : `q < 0.05 across ${genes ? genes.nTests : 0} tested candidates`
                                        : "q < 0.05 · positive direction"
                                }}
                            </div>
                        </div>
                        <div class="pbp-metric purple">
                            <div class="label">
                                {{
                                    multi
                                        ? "Candidate diseases"
                                        : `Diseases where ${name(
                                              ids[0]
                                          )} is obligate`
                                }}
                            </div>
                            <div class="value">
                                {{ multi ? candidates.length : obligateCount }}
                            </div>
                            <div class="detail">
                                {{
                                    multi
                                        ? "profile score ≥ 0.10"
                                        : `${veryFrequentCount} very frequent`
                                }}
                            </div>
                        </div>
                        <div class="pbp-metric purple">
                            <div class="label">
                                {{
                                    multi
                                        ? "Genes from top 10 candidates"
                                        : "Genes linked through diseases"
                                }}
                            </div>
                            <div class="value">{{ linkedSymbols.length }}</div>
                            <div class="detail">
                                {{
                                    !multi && genes
                                        ? `${burdenLinkedCount} overlap displayed burden genes`
                                        : "Orphanet disease–gene links"
                                }}
                            </div>
                        </div>
                    </div>
                    <section class="pbp-card">
                        <div class="pbp-rowhead">
                            <div>
                                <span class="pbp-tag crdc"
                                    >CRDC · OBSERVED HPO</span
                                >
                                <h2>
                                    {{
                                        multi
                                            ? "Samples ranked by residual PheRS"
                                            : `Samples with ${name(ids[0])}`
                                    }}
                                </h2>
                                <p class="pbp-sub">
                                    {{
                                        multi
                                            ? "Residual PheRS for the entered HPO profile, highest first."
                                            : "Samples with this recorded HPO term, ranked by residual PheRS."
                                    }}
                                </p>
                            </div>
                            <div class="pbp-controls">
                                <select
                                    v-model="cohortDiseaseFilter"
                                    aria-label="Cohort category"
                                >
                                    <option value="">All cohort categories</option>
                                    <option
                                        v-for="item in cohortDiseases"
                                        :key="item"
                                        :value="item"
                                    >
                                        {{ item }}
                                    </option></select
                                >
                            </div>
                        </div>
                        <p v-if="sampleLoading" class="pbp-status">
                            Loading CRDC samples…
                        </p>
                        <p v-else-if="sampleError" class="pbp-status">
                            {{ sampleError }}
                            <button type="button" @click="loadSamples">
                                Retry
                            </button>
                        </p>
                        <div v-if="!multi" class="pbp-summary-grid">
                            <div>
                                <h3>
                                    Terms in expanded profiles alongside {{ name(ids[0]) }}
                                </h3>
                                <p class="pbp-sub">
                                    {{ hpoKnownCount }} of
                                    {{ filteredSamples.length }} returned
                                    samples have expanded HPO profiles in the CRDC matrix.
                                    Percentages below use only those records.
                                </p>
                                <div class="pbp-coterms">
                                    <button
                                        v-for="item in coTerms"
                                        :key="item.id"
                                        type="button"
                                        @click="addFeature(item.id)"
                                    >
                                        {{ name(item.id) }}
                                        <em>{{ item.percent }}%</em></button
                                    ><span
                                        v-if="!coTerms.length"
                                        class="pbp-muted"
                                        >Co-recorded terms are not available for
                                        these samples.</span
                                    >
                                </div>
                                <h3>Cohort categories · matched samples</h3>
                                <div class="pbp-table-scroll">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th><button class="pbp-sort" @click="toggleSort('cohorts', 'name')">Cohort category {{ sortIndicator('cohorts', 'name') }}</button></th>
                                                <th><button class="pbp-sort" @click="toggleSort('cohorts', 'total')">Samples {{ sortIndicator('cohorts', 'total') }}</button></th>
                                                <th><button class="pbp-sort" @click="toggleSort('cohorts', 'affected')">Affected {{ sortIndicator('cohorts', 'affected') }}</button></th>
                                                <th><button class="pbp-sort" @click="toggleSort('cohorts', 'medianAge')">Median age {{ sortIndicator('cohorts', 'medianAge') }}</button></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr
                                                v-for="item in sortedCohortDiseaseSummary"
                                                :key="item.name"
                                            >
                                                <td>{{ item.name }}</td>
                                                <td>{{ item.total }}</td>
                                                <td>{{ item.affected }}</td>
                                                <td>{{ item.medianAge == null ? "—" : item.medianAge }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div>
                                <h3>Age at record</h3>
                                <p class="pbp-sub">
                                    {{ ageSummary.known }} of {{ filteredSamples.length }}
                                    returned samples have a valid age at enrollment.
                                </p>
                                <div v-if="ageSummary.known" class="pbp-age-list">
                                    <div v-for="bin in ageSummary.bins" :key="bin.label">
                                        <span>{{ bin.label }}</span>
                                        <i><b :style="{ width: `${Math.round(bin.count / ageSummary.known * 100)}%` }"></b></i>
                                        <strong>{{ bin.count }}</strong>
                                    </div>
                                </div>
                                <h3>Sex · returned matches</h3>
                                <div v-if="sexSummary.known" class="pbp-sex">
                                    <span
                                        :style="{
                                            width: `${
                                                (sexSummary.female /
                                                    sexSummary.known) *
                                                100
                                            }%`,
                                        }"
                                    ></span>
                                </div>
                                <p class="pbp-sub">
                                    {{ sexSummary.female }} female ·
                                    {{ sexSummary.male }} male ·
                                    {{
                                        filteredSamples.length -
                                        sexSummary.known
                                    }}
                                    unknown
                                </p>
                            </div>
                        </div>
                        <button
                            v-if="!multi"
                            type="button"
                            class="pbp-more"
                            @click="showSingleList = !showSingleList"
                        >
                            {{
                                showSingleList
                                    ? "Hide sample list"
                                    : `Open sample list (${filteredSamples.length} returned)`
                            }}
                        </button>
                        <div
                            v-if="multi || showSingleList"
                            class="pbp-table-scroll"
                        >
                            <table>
                                <thead>
                                    <tr>
                                        <th><button class="pbp-sort" @click="toggleSort('samples', 'rank')">Rank {{ sortIndicator('samples', 'rank') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('samples', 'sample')">Sample {{ sortIndicator('samples', 'sample') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('samples', 'phers')">Residual PheRS {{ sortIndicator('samples', 'phers') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('samples', 'matches')">Query HPOs matched {{ sortIndicator('samples', 'matches') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('samples', 'ageSex')">Age · sex {{ sortIndicator('samples', 'ageSex') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('samples', 'cohort')">Cohort disease / project {{ sortIndicator('samples', 'cohort') }}</button></th>
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
                                                :class="{ top: sample.rank <= 3 }"
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
                                            {{ score(sample.residual_phers) }}
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
                        <div v-if="multi || showSingleList" class="pbp-pagination">
                            <button type="button" :disabled="samplePage <= 1" @click="samplePage--">Previous</button>
                            <span>Page {{ samplePage }} / {{ samplePageCount }} · {{ filteredSamples.length }} samples</span>
                            <button type="button" :disabled="samplePage >= samplePageCount" @click="samplePage++">Next</button>
                        </div>
                        <p class="pbp-note">
                            Filled colour marks a recorded query HPO; a pale outline means it was not recorded. Colours follow the query chips above. An unmatched term is unknown, not clinically
                            absent. Matches and residual PheRS use the
                            parent-expanded CRDC HPO matrix and existing
                            rphers_fast calculation. Visible sample disease /
                            project labels come from BioIndex clean_name when
                            available; cohort filtering uses the local cohort
                            category mapping.<template v-if="excluded.length">
                                {{ hiddenCount }} returned samples were removed
                                using confirmed recorded HPO terms;
                                {{ unknownExclusionCount }} have no exposed HPO
                                list for exclusion verification.</template
                            >
                        </p>
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
                                </h2>
                                <p class="pbp-sub">
                                    {{
                                        multi
                                            ? `Calculated with the Gene/Variant pages' full-cohort gene-score API. β and p are model results; q is BH FDR across ${genes ? genes.nTests : 0} tested Orphanet candidate genes.`
                                            : "Positive burden associations from the same precomputed release as the Gene page. Orphanet links are independent evidence."
                                    }}
                                </p>
                            </div>
                            <div class="pbp-controls">
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
                        <div class="pbp-filters">
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
                            ><span
                                ><i class="orpha"></i>Orphanet disease
                                link</span
                            >
                        </div>
                        <p v-if="geneLoading" class="pbp-status">
                            Loading gene associations…
                        </p>
                        <p v-else-if="geneError" class="pbp-status">
                            {{ geneError }} <button type="button" @click="loadGenes">Retry</button>
                        </p>
                        <div v-else class="pbp-table-scroll">
                            <table>
                                <thead>
                                    <tr>
                                        <th><button class="pbp-sort" @click="toggleSort('genes', 'gene')">Gene {{ sortIndicator('genes', 'gene') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('genes', 'evidence')">Evidence {{ sortIndicator('genes', 'evidence') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('genes', 'effect')">{{ multi ? "β (gene score)" : "OR per 0.1 burden score" }} {{ sortIndicator('genes', 'effect') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('genes', 'support')">{{ multi ? "Positive-score samples" : "95% CI" }} {{ sortIndicator('genes', 'support') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('genes', 'p')">p {{ sortIndicator('genes', 'p') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('genes', 'q')">q {{ sortIndicator('genes', 'q') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('genes', 'disease')">{{ multi ? "Candidate disease (rank)" : `Orphanet diseases with ${name(ids[0])}` }} {{ sortIndicator('genes', 'disease') }}</button></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="row in visibleGenes"
                                        :key="row.gene"
                                    >
                                        <td>
                                            <a
                                                :href="`/pb_Gene.html?query=${encodeURIComponent(
                                                    row.gene
                                                )}`"
                                                >{{ row.gene }}</a
                                            >
                                        </td>
                                        <td>
                                            <span
                                                class="pbp-evidence"
                                                :class="{ on: significantGene(row) }"
                                            ></span
                                            ><span
                                                class="pbp-evidence orpha"
                                                :class="{
                                                    on: row.diseases.length,
                                                }"
                                            ></span>
                                        </td>
                                        <td>
                                            <div
                                                v-if="row.association && !multi"
                                                class="pbp-bar"
                                            >
                                                <i
                                                    class="teal"
                                                    :style="{
                                                        width: `${Math.max(
                                                            2,
                                                            (row.association
                                                                .oddsRatio /
                                                                maxOdds) *
                                                                100
                                                        )}%`,
                                                    }"
                                                ></i
                                                ><b>{{
                                                    stat(
                                                        row.association
                                                            .oddsRatio
                                                    )
                                                }}</b>
                                            </div>
                                            <span v-else>{{ row.association && multi ? stat(row.association.beta) : "—" }}</span>
                                        </td>
                                        <td>
                                            {{
                                                row.association && multi
                                                    ? row.association.nPositive.toLocaleString()
                                                    : row.association
                                                    ? `${stat(
                                                          row.association.ciLow
                                                      )}–${stat(
                                                          row.association.ciHigh
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
                                            <template v-if="row.diseases.length"
                                                ><span
                                                    v-for="(
                                                        disease, i
                                                    ) in row.diseases.slice(
                                                        0,
                                                        2
                                                    )"
                                                    :key="disease.code"
                                                    >{{ i ? ", " : ""
                                                    }}{{ disease.name
                                                    }}{{
                                                        multi
                                                            ? ` (#${disease.rank})`
                                                            : ""
                                                    }}</span
                                                ><span
                                                    v-if="
                                                        row.diseases.length > 2
                                                    "
                                                    class="pbp-muted"
                                                >
                                                    +{{
                                                        row.diseases.length - 2
                                                    }}</span
                                                ></template
                                            ><span v-else class="pbp-muted"
                                                >Not linked — candidate</span
                                            >
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <p v-if="!visibleGenes.length" class="pbp-status">
                                No genes match this filter.
                            </p>
                        </div>
                        <div class="pbp-pagination">
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
                                        >ORPHANET REFERENCE</span
                                    >
                                    <h2>
                                        {{
                                            multi
                                                ? "Differential diagnosis"
                                                : `Diseases with ${name(
                                                      ids[0]
                                                  )}`
                                        }}
                                    </h2>
                                    <p class="pbp-sub">
                                        {{
                                            multi
                                                ? "Ranked by harmonic coverage of query and disease phenotypes. Expand a row to inspect the calculation and annotations."
                                                : "Sorted by phenotype frequency class and diagnostic criterion."
                                        }}
                                    </p>
                                </div>
                                <input
                                    v-model.trim="diseaseQuery"
                                    class="pbp-disease-search"
                                    placeholder="Filter disease or gene"
                                    aria-label="Filter disease or gene"
                                />
                            </div>
                            <div class="pbp-filters">
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
                                            <th><button class="pbp-sort" @click="toggleSort('diseases', 'score')">{{ multi ? "Profile score" : "Frequency class" }} {{ sortIndicator('diseases', 'score') }}</button></th>
                                            <th><button class="pbp-sort" @click="toggleSort('diseases', 'matched')">{{ multi ? "Query terms annotated" : "Criterion" }} {{ sortIndicator('diseases', 'matched') }}</button></th>
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
                                                        :class="{
                                                            top: row.rank <= 3,
                                                        }"
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
                                                        >ORPHA:{{ row.code
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
                                                    ><small
                                                        v-if="
                                                            row.penalizedBy
                                                                .length
                                                        "
                                                        class="pbp-downrank"
                                                        >down-ranked: annotated
                                                        with excluded term
                                                        {{
                                                            row.penalizedBy
                                                                .map(name)
                                                                .join(", ")
                                                        }}</small
                                                    >
                                                </td>
                                                <td v-if="multi">
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
                                                <td v-if="multi">
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
                                                        :href="`/pb_Gene.html?query=${encodeURIComponent(
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
                                                                            hit: ids.includes(
                                                                                item.hpoId
                                                                            ),
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
                                                                            addFeature(
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
                                <span>Page {{ diseasePage }} / {{ diseasePageCount }} · {{ filteredDiseases.length }} diseases</span>
                                <button type="button" :disabled="diseasePage >= diseasePageCount" @click="diseasePage++">Next</button>
                            </div>
                            <p class="pbp-note">
                                {{
                                    multi
                                        ? "Profile score is the harmonic mean of disease and query coverage, minus 0.5 × the largest matching user-excluded term weight. It ranks diseases; it is not a probability. Orphanet Excluded (0%) annotations are ignored. "
                                        : ""
                                }}Orphadata Products 4 and 6 · July 2026
                                reference snapshot.
                            </p>
                            <p class="pbp-note">
                                * Included in an established diagnostic criteria
                                set; this finding alone does not establish a
                                diagnosis. Excluded (0%) annotations are
                                omitted.
                            </p>
                        </section>
                        <aside v-if="multi" class="pbp-card pbp-narrow">
                            <span class="pbp-tag orpha"
                                >ORPHANET REFERENCE</span
                            >
                            <h3>What would narrow this?</h3>
                            <p class="pbp-sub">
                                Terms that best split the top
                                {{ Math.min(10, candidates.length) }} candidates
                                by binary information gain. Mark present or
                                excluded to rerun the page.
                            </p>
                            <table>
                                <thead>
                                    <tr>
                                        <th><button class="pbp-sort" @click="toggleSort('narrowing', 'phenotype')">Phenotype {{ sortIndicator('narrowing', 'phenotype') }}</button></th>
                                        <th><button class="pbp-sort" @click="toggleSort('narrowing', 'count')">Splits top {{ sortIndicator('narrowing', 'count') }}</button></th>
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
                                            {{ item.count }} / {{ item.total }}
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                title="Add as present"
                                                @click="addFeature(item.hpoId)"
                                            >
                                                ✓</button
                                            ><button
                                                type="button"
                                                title="Add as excluded"
                                                @click="addExcluded(item.hpoId)"
                                            >
                                                ✗
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </aside>
                    </div>
                </template>
                <section v-else class="pbp-card pbp-status">
                    <h2>Phenotype not found</h2>
                    <p>
                        Enter an HPO ID such as HP:0001250 or an exact term such
                        as Seizure.
                    </p>
                </section>
            </div>
        </main>
    </div>
</template>
<script>
import { ORPHANET_REFERENCE } from "./orphanetReference.generated";
import {
    FREQUENCIES,
    CANDIDATE_SCORE_THRESHOLD,
    AGE_BANDS,
    validAge,
    ageBand,
    TERM_COLORS,
    resolveHpoId,
    resolveHpoIds,
    diseaseRows,
    narrowingTerms,
    sampleMatchCount,
    formatStatistic,
    sortTableRows,
} from "./phenotypeModel";
import { request as bioIndexRequest } from "@/utils/bioIndexUtils";
const REF = ORPHANET_REFERENCE;
const sampleKey = (sample) => sample.SampleInVCF || sample.unique_sample_ID;
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
    data() {
        const params = new URLSearchParams(window.location.search);
        const query = params.get("query") || params.get("hpo") || "HP:0001250";
        const ids = resolveHpoIds(REF, query);
        return {
            reference: REF,
            ids,
            excluded: resolveHpoIds(REF, params.get("exclude") || ""),
            colors: Object.fromEntries(ids.map((id, i) => [id, i % 8])),
            searchQuery: query,
            addQuery: "",
            excludeQuery: "",
            saved: false,
            ageBandFilter: "",
            sexFilter: "",
            cohortDiseaseFilter: "",
            affectedFilter: "",
            showSingleList: false,
            samplePage: 1,
            tableSort: {
                cohorts: { key: "total", dir: "desc" },
                samples: { key: "rank", dir: "asc" },
                genes: { key: "", dir: "asc" },
                diseases: { key: "rank", dir: "asc" },
                narrowing: { key: "", dir: "asc" },
            },
            matches: [],
            matchesLoaded: false,
            cohortSampleCount: 0,
            sampleLoading: false,
            sampleError: "",
            sampleRequest: 0,
            sampleInfo: {},
            sampleInfoChecked: {},
            infoRequest: 0,
            genes: null,
            geneLoading: false,
            geneError: "",
            geneRequest: 0,
            geneFilter: "significant",
            genePage: 1,
            diseaseFilter: ids.length > 1 ? "all" : "default",
            diseaseQuery: "",
            diseasePage: 1,
            expandedDiseases: [],
            expandedFeatures: [],
        };
    },
    mounted() {
        if (this.ids.length) {
            this.loadSamples();
            this.loadGenes();
        }
    },
    watch: {
        ids: {
            deep: true,
            handler() {
                this.matches = [];
                this.matchesLoaded = false;
                this.genes = null;
                this.samplePage = 1;
                this.cohortDiseaseFilter = "";
                this.genePage = 1;
                this.diseasePage = 1;
                this.diseaseFilter = this.ids.length > 1 ? "all" : "default";
                this.loadSamples();
                this.loadGenes();
            },
        },
        ageBandFilter() { this.samplePage = 1; },
        sexFilter() { this.samplePage = 1; },
        affectedFilter() { this.samplePage = 1; },
        cohortDiseaseFilter() { this.samplePage = 1; },
        excluded: { deep: true, handler() {
            this.samplePage = 1;
            this.diseasePage = 1;
            if (!this.excludedDiseaseCount) this.diseaseFilter = "all";
            this.loadGenes();
        } },
        visibleSamples(samples) { if (samples.length) this.loadSampleInfo(samples); },
        diseaseQuery() { this.diseasePage = 1; },
    },
    computed: {
        ageBands() { return AGE_BANDS; },
        multi() {
            return this.ids.length > 1;
        },
        term() {
            return REF.terms[this.ids[0]];
        },
        hpoOptions() {
            return Object.entries(REF.terms).map(([id, item]) => ({
                id,
                name: item[0],
            }));
        },
        cohortDiseases() {
            return [
                ...new Set(
                    this.matches
                        .map((row) => row.cohort_category || "Unknown")
                        .filter((name) => name !== "Unknown")
                ),
            ].sort();
        },
        cohortDiseaseSummary() {
            const map = new Map();
            this.filteredSamples.forEach((row) => {
                const name = row.cohort_category || "Unknown";
                if (!map.has(name))
                    map.set(name, { name, total: 0, affected: 0, ages: [] });
                const item = map.get(name);
                item.total++;
                if (row.initial_study_affected === "Y") item.affected++;
                const age = this.sampleAge(row);
                if (age != null) item.ages.push(age);
            });
            return [...map.values()].map((item) => {
                const ages = item.ages.sort((a, b) => a - b);
                const middle = Math.floor(ages.length / 2);
                return {
                    ...item,
                    medianAge: ages.length
                        ? ages.length % 2
                            ? ages[middle]
                            : (ages[middle - 1] + ages[middle]) / 2
                        : null,
                };
            }).sort(
                (a, b) => b.total - a.total || a.name.localeCompare(b.name)
            );
        },
        sortedCohortDiseaseSummary() {
            return sortTableRows(this.cohortDiseaseSummary, this.tableSort.cohorts, {
                name: (row) => row.name,
                total: (row) => row.total,
                affected: (row) => row.affected,
                medianAge: (row) => row.medianAge,
            });
        },
        ageSummary() {
            const bins = AGE_BANDS.map((band) => ({ ...band, count: 0 }));
            let known = 0;
            this.filteredSamples.forEach((row) => {
                const age = this.sampleAge(row);
                if (age == null) return;
                known++;
                const band = ageBand(age);
                const bin = bins.find((item) => item.label === band);
                if (bin) bin.count++;
            });
            return { known, bins };
        },
        sexSummary() {
            return this.filteredSamples.reduce(
                (out, row) => {
                    const sex = String(
                        row.gender || (this.sampleInfo[sampleKey(row)] || {}).gender || ""
                    ).toLowerCase();
                    if (sex === "female" || sex === "male") {
                        out[sex]++;
                        out.known++;
                    }
                    return out;
                },
                { female: 0, male: 0, known: 0 }
            );
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
                    if (id !== this.ids[0] && REF.terms[id])
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
            return this.matches.filter((row) =>
                this.excluded.some((id) => this.sampleTerms(row).includes(id))
            ).length;
        },
        unknownExclusionCount() {
            return this.excluded.length
                ? this.matches.filter((row) => !this.sampleTerms(row).length)
                      .length
                : 0;
        },
        filteredSamples() {
            return this.matches.filter(
                (row) =>
                    (!this.cohortDiseaseFilter ||
                        (row.cohort_category || "Unknown") ===
                            this.cohortDiseaseFilter) &&
                    (!this.affectedFilter ||
                        row.initial_study_affected === this.affectedFilter) &&
                    (!this.ageBandFilter ||
                        this.sampleAgeBand(row) === this.ageBandFilter) &&
                    (!this.sexFilter ||
                        String(row.gender || "").toLowerCase() === this.sexFilter) &&
                    !this.excluded.some((id) =>
                        this.sampleTerms(row).includes(id)
                    )
            );
        },
        qualifyingSamples() {
            return this.filteredSamples.filter(
                (row) => !this.multi || sampleMatchCount(row) >= 2
            );
        },
        visibleSamples() {
            return this.sortedSamples.slice((this.samplePage - 1) * 5, this.samplePage * 5);
        },
        sortedSamples() {
            return sortTableRows(this.filteredSamples, this.tableSort.samples, {
                rank: (row) => row.rank,
                sample: (row) => sampleKey(row),
                phers: (row) => row.residual_phers,
                matches: (row) => sampleMatchCount(row),
                ageSex: (row) => {
                    const age = this.sampleAge(row);
                    return age == null ? null : `${String(age).padStart(7, "0")} · ${this.sampleSex(row)}`;
                },
                cohort: (row) => this.sampleCohortDisease(row),
                affected: (row) => row.initial_study_affected || null,
            });
        },
        samplePageCount() { return Math.max(1, Math.ceil(this.filteredSamples.length / 5)); },
        diseases() {
            return diseaseRows(REF, this.ids, this.excluded)
                .map((row, index) => ({ ...row, rank: index + 1 }));
        },
        candidates() {
            return this.diseases.filter((row) => row.score >= CANDIDATE_SCORE_THRESHOLD);
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
        linkedSymbols() {
            return [
                ...new Set(
                    (this.multi
                        ? this.candidates.slice(0, 10)
                        : this.diseases
                    ).flatMap((row) => row.genes.map((gene) => gene[0]))
                ),
            ];
        },
        burdenLinkedCount() {
            return this.genes
                ? this.genes.associations.filter((row) =>
                      this.linkedSymbols.includes(row.gene) && row.qValue < 0.05
                  ).length
                : 0;
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
            (this.multi ? this.candidates.slice(0, 10) : this.diseases).forEach(
                (disease, rank) =>
                    disease.genes.forEach((gene) => {
                        const symbol = gene[0];
                        if (!map.has(symbol))
                            map.set(symbol, {
                                gene: symbol,
                                association: null,
                                diseases: [],
                            });
                        map.get(symbol).diseases.push({
                            code: disease.code,
                            name: disease.name,
                            rank: rank + 1,
                        });
                    })
            );
            return [...map.values()].sort(
                (a, b) =>
                    Number(Boolean(b.association)) -
                        Number(Boolean(a.association)) ||
                    (a.association?.qValue ?? Infinity) -
                        (b.association?.qValue ?? Infinity) ||
                    a.gene.localeCompare(b.gene)
            );
        },
        geneFilters() {
            return [
                {
                    key: "significant",
                    label: "q < 0.05",
                    count: this.geneRows.filter(this.significantGene)
                        .length,
                },
                {
                    key: "all",
                    label: this.multi
                        ? "Candidate genes"
                        : "Available evidence",
                    count: this.geneRows.length,
                },
                {
                    key: "linked",
                    label: "Also in Orphanet",
                    count: this.geneRows.filter(
                        (row) =>
                            row.diseases.length &&
                            (this.multi || row.association)
                    ).length,
                },
            ];
        },
        filteredGenes() {
            return this.geneRows.filter(
                (row) =>
                    this.geneFilter === "all" ||
                    (this.geneFilter === "linked" &&
                        row.diseases.length &&
                        (this.multi || row.association)) ||
                    (this.geneFilter === "significant" && this.significantGene(row))
            );
        },
        visibleGenes() {
            return this.sortedGenes.slice((this.genePage - 1) * 4, this.genePage * 4);
        },
        sortedGenes() {
            return sortTableRows(this.filteredGenes, this.tableSort.genes, {
                gene: (row) => row.gene,
                evidence: (row) => Number(Boolean(row.association)) * 2 + Number(Boolean(row.diseases.length)),
                effect: (row) => this.multi ? row.association?.beta : row.association?.oddsRatio,
                support: (row) => this.multi ? row.association?.nPositive : row.association?.ciLow,
                p: (row) => row.association?.pValue,
                q: (row) => row.association?.qValue,
                disease: (row) => row.diseases[0]?.rank ?? null,
            });
        },
        genePageCount() { return Math.max(1, Math.ceil(this.filteredGenes.length / 4)); },
        maxOdds() {
            return Math.max(
                1,
                ...this.geneRows.map((row) =>
                    row.association ? Number(row.association.oddsRatio) || 0 : 0
                )
            );
        },
        diseaseFilters() {
            if (this.multi) {
                const filters = [
                    {
                        key: "all",
                        label: "All annotated",
                        count: this.diseases.length,
                    },
                ];
                if (this.excluded.length && this.excludedDiseaseCount)
                    filters.push({
                        key: "notExcluded",
                        label: this.diseaseFilter === "notExcluded"
                            ? `${this.excludedDiseaseCount} diseases matching excluded terms hidden`
                            : `Hide ${this.excludedDiseaseCount} diseases matching excluded terms`,
                    });
                return filters;
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
        excludedDiseaseCount() {
            return this.excluded.length
                ? this.diseases.filter((row) => row.penalizedBy.length).length
                : 0;
        },
        filteredDiseases() {
            const q = this.diseaseQuery.toLowerCase();
            return this.diseases.filter((row) => {
                const include = this.multi
                    ? this.diseaseFilter !== "notExcluded" || !row.penalizedBy.length
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
                score: (row) => this.multi ? row.score : FREQUENCIES.findIndex((item) => item[0] === row.frequency),
                matched: (row) => this.multi ? row.matchedIds.length : Number(row.diagnostic),
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
        significantGene(row) {
            return row.association?.qValue != null && row.association.qValue < 0.05;
        },
        toggleSort(table, key) {
            const current = this.tableSort[table];
            const defaultDescending = ["phers", "matches", "total", "affected", "effect", "evidence", "matched", "count"].includes(key);
            this.$set(this.tableSort, table, {
                key,
                dir: current.key === key
                    ? current.dir === "asc" ? "desc" : "asc"
                    : defaultDescending ? "desc" : "asc",
            });
            if (table === "samples") this.samplePage = 1;
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
            return gender === "female" ? "F" : gender === "male" ? "M" : "—";
        },
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
        syncUrl() {
            this.searchQuery = this.ids.join(",");
            const url = new URL(window.location.href);
            url.searchParams.set("query", this.searchQuery);
            if (this.excluded.length)
                url.searchParams.set("exclude", this.excluded.join(","));
            else url.searchParams.delete("exclude");
            window.history.replaceState({}, "", url.pathname + url.search);
        },
        submitSearch() {
            const ids = resolveHpoIds(REF, this.searchQuery);
            this.ids = ids;
            this.colors = Object.fromEntries(ids.map((id, i) => [id, i % 8]));
            this.excluded = this.excluded.filter((id) => !ids.includes(id));
            this.syncUrl();
        },
        addTerm(exclude) {
            const id = resolveHpoId(
                REF,
                exclude ? this.excludeQuery : this.addQuery
            );
            if (!id) return;
            if (exclude) this.addExcluded(id);
            else this.addFeature(id);
            this.addQuery = "";
            this.excludeQuery = "";
        },
        addIdAsTyped(exclude) {
            const value = exclude ? this.excludeQuery : this.addQuery;
            if (/^HP:\d{7}$/i.test(value)) this.addTerm(exclude);
        },
        addFeature(id) {
            if (!this.ids.includes(id)) {
                this.ids.push(id);
                this.$set(this.colors, id, Object.keys(this.colors).length % 8);
            }
            this.excluded = this.excluded.filter((item) => item !== id);
            this.syncUrl();
        },
        addExcluded(id) {
            if (this.ids.length === 1 && this.ids.includes(id)) return;
            if (!this.excluded.includes(id)) this.excluded.push(id);
            if (this.ids.length > 1)
                this.ids = this.ids.filter((item) => item !== id);
            this.syncUrl();
        },
        removeTerm(id) {
            this.ids = this.ids.filter((item) => item !== id);
            this.syncUrl();
        },
        removeExcluded(id) {
            this.excluded = this.excluded.filter((item) => item !== id);
            this.syncUrl();
        },
        saveProfile() {
            localStorage.setItem(
                "pbPhenotypeProfile",
                JSON.stringify({
                    hpoIds: this.ids,
                    excludedIds: this.excluded,
                    ageBand: this.ageBandFilter,
                    sex: this.sexFilter,
                    affected: this.affectedFilter,
                })
            );
            this.saved = true;
        },
        async loadSamples() {
            if (!this.ids.length) return;
            const request = ++this.sampleRequest;
            this.sampleLoading = true;
            this.sampleError = "";
            try {
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
                const pages = Math.ceil(first.pagination.total / 100);
                const matches = [...first.samples];
                for (let start = 2; start <= pages; start += 8) {
                    if (request !== this.sampleRequest) return;
                    const batch = await Promise.all(
                        Array.from({ length: Math.min(8, pages - start + 1) }, (_, index) => fetchPage(start + index))
                    );
                    batch.forEach((result) => matches.push(...result.samples));
                }
                if (request === this.sampleRequest) {
                    this.matches = matches.map((row, index) => ({ ...row, rank: index + 1 }));
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
            for (let start = 0; start < samples.length; start += 5) {
                await Promise.all(
                    samples.slice(start, start + 5).map(async (sample) => {
                        const key = sampleKey(sample);
                        if (this.sampleInfoChecked[key]) return;
                        for (const suffix of ["_E38", "_G38"]) {
                            try {
                                const id = `${key}${suffix}`;
                                const response = await bioIndexRequest(
                                    "/api/bio/query/samples-info",
                                    { q: id, limit: 5 }, true
                                );
                                if (!response.ok) continue;
                                const data = await response.json();
                                const exact = (data.data || []).find(
                                    (row) => row.SampleInVCF === id && row.sample_id === key
                                );
                                if (request === this.infoRequest && exact) {
                                    this.$set(this.sampleInfo, key, exact);
                                    break;
                                }
                            } catch (_) {
                                /* The cohort category remains available if BioIndex fails. */
                            }
                        }
                        if (request === this.infoRequest) this.sampleInfoChecked[key] = true;
                    })
                );
                if (request !== this.infoRequest) return;
            }
        },
        async loadGenes() {
            const request = ++this.geneRequest;
            if (!this.ids.length) {
                this.genes = null;
                this.geneFilter = "all";
                this.geneLoading = false;
                this.geneError = "";
                return;
            }
            const ids = [...this.ids];
            const symbols = this.multi ? [...this.linkedSymbols] : [];
            if (this.multi && !symbols.length) {
                this.genes = { associations: [], nTests: 0 };
                this.geneFilter = "all";
                this.geneLoading = false;
                this.geneError = "";
                return;
            }
            this.geneLoading = true;
            this.geneError = "";
            try {
                const response = this.multi
                    ? await fetch("/phenotype-analyzer-api/co-gene-associations", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            gene: symbols[0],
                            terms: ids.join(","),
                            co_genes: symbols.slice(1),
                            score_type: "max",
                            affected_only: false,
                        }),
                    })
                    : await fetch(`/__hpo_gene_associations__?hpo=${encodeURIComponent(ids[0])}`);
                if (!response.ok)
                    throw new Error(
                        `CRDC gene analysis returned ${response.status}.`
                    );
                const data = await response.json();
                let genes;
                if (symbols.length) {
                    const received = data.query_hpo || [];
                    if (data.target_gene !== symbols[0] ||
                        received.length !== ids.length ||
                        ids.some((id) => !received.includes(id)) ||
                        !data.gene_associations)
                        throw new Error("Gene analysis returned a different HPO profile.");
                    genes = {
                        nTests: Number(data.n_tests) || 0,
                        associations: symbols.map((gene) => {
                            const item = data.gene_associations[gene];
                            if (item?.status !== "ok" || item.p_value == null) return null;
                            return {
                                gene,
                                beta: item.beta,
                                pValue: item.p_value,
                                qValue: item.fdr,
                                nPositive: item.n_positive,
                            };
                        }).filter(Boolean),
                    };
                } else {
                    if (data.hpoId !== ids[0] || !Array.isArray(data.associations))
                        throw new Error("Unexpected gene release result.");
                    genes = data;
                }
                if (request === this.geneRequest) {
                    this.genes = genes;
                    this.geneFilter = this.multi ? "all" : "significant";
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
            return this.multi
                ? `${row.matchedIds.length}/${this.ids.length} query terms match this disease or a more specific annotation. How ${row.score.toFixed(2)} is calculated: N ${row.numerator.toFixed(4)} ÷ S(D) ${row.denominator.toFixed(4)} = Cov_D ${row.diseaseCoverage.toFixed(3)}; N ÷ ${this.ids.length} = Cov_Q ${row.queryCoverage.toFixed(3)}; harmonic mean ${row.rawScore.toFixed(3)}${row.penaltyWeight ? ` − 0.5 × ${row.penaltyWeight.toFixed(4)} for excluded ${row.penalizedBy.map(this.name).join(", ")}` : ""} = ${row.score.toFixed(2)}.`
                : `${this.name(
                      this.ids[0]
                  )} is annotated as ${row.frequency.toLowerCase()}${
                      row.diagnostic
                          ? " and belongs to an established diagnostic criteria set"
                          : ""
                  }.`;
        },
        featureGroups(row) {
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
                    this.multi ? "crdc_gene_score_q_significant" : "crdc_burden_q_significant",
                    "orphanet_link",
                    this.multi ? "beta_gene_score" : "or_per_0.1",
                    this.multi ? "n_positive" : "ci_low",
                    ...(this.multi ? [] : ["ci_high"]),
                    "p",
                    "q",
                    "linked_diseases",
                ],
                ...this.sortedGenes.map((row) => [
                    row.gene,
                    this.significantGene(row),
                    Boolean(row.diseases.length),
                    this.multi ? row.association?.beta : row.association?.oddsRatio,
                    this.multi ? row.association?.nPositive : row.association?.ciLow,
                    ...(this.multi ? [] : [row.association?.ciHigh]),
                    row.association?.pValue,
                    row.association?.qValue,
                    row.diseases.map((item) => item.name).join("; "),
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
