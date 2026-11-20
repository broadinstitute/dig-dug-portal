<template>
    <div class="pbs-results" :class="{ 'pbs-multi': multiple }">
        <section class="pbp-card pbs-summary" aria-labelledby="pbs-summary-title">
            <div class="pbp-rowhead"><h2 id="pbs-summary-title"><strong>{{ ready ? number(total) : '—' }} samples</strong> match in CRDC <result-info label="matching samples" :text="summaryHelp" /></h2><span :class="multiple ? 'pbs-match-label' : 'pbs-muted'">{{ multiple ? matchLabel : `${name(hpo)} · includes more specific terms` }}</span></div>
            <p v-if="loading" role="status">Loading CRDC samples…</p>
            <p v-if="error" role="alert">{{ error }} <button type="button" class="pbp-btn" @click="$emit('retry-samples')">Retry</button></p>
            <template v-if="ready">
                <p v-if="multiple" class="pbs-rule-description">{{ matchingRule.description }}</p>
                <div v-if="!total" class="pbs-empty-result" role="status"><strong>No samples match this search.</strong><span>{{ multiple ? `${matchingRule.label}: ${matchingRule.short}, together with the current filters.` : 'No samples satisfy the current search conditions.' }} Change the matching rule or filters in Advanced search.</span></div>
                <div class="pbs-cohort-bar" :style="cohortBarStyle" :aria-label="`${number(total)} matching samples; ${number(rest)} everyone else in CRDC`">
                    <span v-if="total" class="pbs-have">{{ number(total) }} {{ multiple ? 'match' : 'have it' }}</span><span v-if="rest || !total" class="pbs-rest">{{ number(rest) }} do not</span>
                </div>
                <div class="pbs-bar-labels"><span>matching samples</span><span>everyone else in CRDC</span></div>
                <div class="pbs-metrics pbs-cohort-metrics">
                    <div><span>Share of CRDC</span><b>{{ percent(total, cohortCount) }}</b><small>{{ number(total) }} of {{ number(cohortCount) }}</small></div>
                    <div><span>Projects</span><b>{{ projects.length }}</b><small>with at least one matching sample</small></div>
                    <div><span>Affected</span><b>{{ percent(summary.affected, total) }}</b><small>{{ total ? `${number(summary.affected)} of ${number(total)}` : 'No matching samples' }}</small></div>
                    <div><span>Median age</span><b>{{ age(summary.medianAge) }}</b><small v-if="summary.medianAge != null">Q1–Q3 {{ age(summary.q1Age) }}–{{ age(summary.q3Age) }}</small><small v-else>{{ total ? 'No recorded ages' : 'No matching samples' }}</small></div>
                </div>
                <div v-if="multiple && combinations.length" class="pbs-metrics pbs-combination-metrics"><div v-for="group in page('combinations', combinations, 4)" :key="group.key"><span>{{ group.matched === activeIds.length ? `Match all ${activeIds.length}` : activeIds.filter((id, index) => group.matches[index]).map(name).join(' + ') }}</span><b>{{ number(group.count) }}</b><query-match-markers :ids="activeIds" :matched="group.matches" :name="name" :term-style="termStyle"/></div></div>
                <result-pagination v-if="multiple && combinations.length > 4" arrows-only :page="pages.combinations" :total="combinations.length" :size="4" label="phenotype combinations" @change="pages.combinations = $event"/>
                <small class="pbs-muted pbs-scale-note">Bar segments are labeled with exact counts; small groups are widened for readability.</small>
            </template>
        </section>

        <section v-show="(!error || ready) && (!ready || total > 0)" class="pbp-card" aria-labelledby="pbs-people-title">
            <div class="pbp-rowhead"><h2 id="pbs-people-title">Who the {{ ready ? number(total) : '—' }} matching samples are <result-info label="sample characteristics and phenotype filters" :text="peopleHelp" /></h2></div>
            <p v-if="multiple" class="pbs-match-context">{{ matchLabel }} · all counts and “These samples” percentages below use these {{ number(total) }} matching samples.</p>
            <div class="pbs-people-grid" :class="{ 'pbs-people-tree-view': cohortPhenotypeView === 'tree' }">
                <div class="pbs-demographics">
                <div><h3>Age</h3><div v-for="bin in ages" :key="bin.label" class="pbs-distribution"><span>{{ bin.label }}</span><b>{{ number(bin.count) }}</b><div class="pbs-track"><span :style="{ width: `${bin.width}%` }"></span></div></div></div>
                <div><h3>Sex</h3><div v-for="bin in sexes" :key="bin.label" class="pbs-distribution"><span>{{ bin.label }}</span><b>{{ number(bin.count) }}</b><div class="pbs-track"><span :style="{ width: `${bin.width}%` }"></span></div></div></div><div><h3>Affected</h3><div v-for="bin in affected" :key="bin.label" class="pbs-distribution"><span>{{ bin.label }}</span><b>{{ number(bin.count) }}</b><div class="pbs-track"><span :style="{ width: `${bin.width}%` }"></span></div></div></div>
                </div>

                <div class="pbs-cohort-phenotypes">
                    <div class="pbs-cohort-view-controls"><h3>Phenotypes</h3><div class="pbs-view-switch" role="group" aria-label="Phenotype display"><button type="button" class="pbp-btn" :aria-pressed="String(cohortPhenotypeView === 'tree')" @click="cohortPhenotypeView = 'tree'">Hierarchy</button><button type="button" class="pbp-btn" :aria-pressed="String(cohortPhenotypeView === 'table')" @click="cohortPhenotypeView = 'table'">Table</button></div></div>
                    <template v-if="cohortPhenotypeView === 'tree'">
                        <p class="pbs-hierarchy-note">Samples with each phenotype / {{ number(total) }} matching samples. Includes more specific terms; each sample is counted once per term. Highlighted terms are your query.</p>
                        <p v-if="cohortCategoryFilter !== null" class="pbs-filter-caption">{{ cohortCategoryFilter.length }} of {{ cohortCategoryOptions.length }} categories selected <button type="button" class="pbs-link" @click="cohortCategoryFilter = null">Clear category filter</button></p>
                        <div class="pbs-hierarchy-controls"><project-table-filter v-model="cohortCategoryFilter" :options="cohortCategoryOptions" heading="Phenotype" filter-key="phenotype-categories" search-label="Find a top-level phenotype category" description="Choose categories directly below Phenotypic abnormality (HP:0000118). Shows their descendants; sample totals stay the same." :sortable="false"/><div class="pbs-hierarchy-order"><span>Order within branches:</span><button type="button" class="pbp-sort" @click="sortBy('terms', 'count')">Samples {{ indicator('terms', 'count') }}</button><button type="button" class="pbp-sort" @click="sortBy('terms', 'all')">All CRDC {{ indicator('terms', 'all') }}</button></div></div>
                        <div class="pbs-project-tree-scroll pbs-cohort-flow" tabindex="0" aria-label="Matching sample phenotype hierarchy">
                            <template v-if="selectedPhenotypeRows.length"><h4>Selected phenotypes</h4><project-phenotype-tree :nodes="selectedPhenotypeRows" :total="total" :selected="activeIds" :query-color="queryColor"/><h4>Phenotype hierarchy</h4></template>
                            <project-phenotype-tree :key="queryKey" :nodes="visibleCohortTree" :total="total" :selected="activeIds" :query-color="queryColor"/>
                            <p v-if="ready && !visibleCohortTree.length" class="pbs-hierarchy-note">{{ cohortCategoryFilter !== null ? 'No phenotype categories selected.' : 'No recorded phenotypes.' }}</p>
                        </div>
                    </template>
                    <template v-else><div class="pbs-table-wrap"><table class="pbs-table pbs-coterms"><thead><tr><th><button class="pbp-sort" @click="sortBy('terms', 'phenotype')">Phenotype {{ indicator('terms', 'phenotype') }}</button></th><th><button class="pbp-sort" @click="sortBy('terms', 'count')">These samples (%) {{ indicator('terms', 'count') }}</button></th><th><button class="pbp-sort" @click="sortBy('terms', 'all')">All CRDC (%) {{ indicator('terms', 'all') }}</button></th><th><button class="pbp-sort" @click="sortBy('terms', 'count')">Require {{ indicator('terms', 'count') }}</button></th><th><button class="pbp-sort" @click="sortBy('terms', 'exclude')">Exclude {{ indicator('terms', 'exclude') }}</button></th></tr></thead><tbody>
                    <tr v-for="item in displayedCoTerms" :key="item.id" :class="{ 'pbs-query-row': activeIds.includes(item.id) }" :style="activeIds.includes(item.id) ? { '--hpo-query-color': queryColor(item.id) } : null"><td><b-icon-square-fill v-if="activeIds.includes(item.id)" class="pbs-hpo-query-marker" aria-hidden="true"/>{{ name(item.id) }}<small v-if="multiple && underTerms(item.id).length" class="pbs-under-terms" v-result-tooltip="'HPO subtype relationship. Counts and percentages use the complete matching sample group, not one input phenotype alone.'">Subtype of <span v-for="id in underTerms(item.id)" :key="id"><b-icon-square-fill :style="{color: queryColor(id)}" aria-hidden="true"/> {{ name(id) }} </span></small></td><td><b>{{ percent(item.count, total) }}</b></td><td class="pbs-muted">{{ allPercent(item.id) }}</td><td><refine-button :disabled="!searchableHpo(item.id)" :id="item.id" :name="name(item.id)" :count="item.count" @choose="$emit('require', $event)"/></td><td><refine-button exclude :disabled="!searchableHpo(item.id)" :id="item.id" :name="name(item.id)" :count="total - item.count" @choose="$emit('exclude', $event)"/></td></tr>
                    <tr v-if="ready && !displayedCoTerms.length"><td colspan="5">No other recorded phenotypes.</td></tr>
                </tbody></table></div><result-pagination :page="pages.terms" :total="coTerms.length" :size="5" label="phenotypes" @change="pages.terms = $event"/></template></div>
            </div>
        </section>

        <section v-show="(!error || ready) && (!ready || total > 0)" class="pbp-card" aria-labelledby="pbs-projects-title">
            <div class="pbp-rowhead"><h2 id="pbs-projects-title">Projects with matching samples <result-info label="project summaries" :text="projectHelp" /></h2><span class="pbs-muted">{{ projects.length }} projects · who to contact for these {{ number(total) }} samples</span></div>
            <div class="pbs-table-wrap"><table class="pbs-table pbs-projects"><thead><tr>
                <th class="pbs-pin-column"><b-icon-pin-angle aria-label="Pin project"/></th><th><button class="pbp-sort" @click="sortBy('projects', 'name')">Project / Investigator {{ indicator('projects', 'name') }}</button></th>
                <th><button class="pbp-sort" @click="sortBy('projects', 'total')">Matching samples {{ indicator('projects', 'total') }}</button></th>
                <th><button class="pbp-sort" @click="sortBy('projects', 'affected')">Affected · Yes / No {{ indicator('projects', 'affected') }}</button></th>
                <th><button class="pbp-sort" @click="sortBy('projects', 'medianAge')">Age · median (Q1–Q3) {{ indicator('projects', 'medianAge') }}</button></th>
                <th><button class="pbp-sort" @click="sortBy('projects', 'sex')">Sex · F / M {{ indicator('projects', 'sex') }}</button></th><th><span class="pbs-heading-help"><button class="pbp-sort" @click="sortBy('projects', 'meanResidualPhers')">Mean rPheRS Z-score {{ indicator('projects', 'meanResidualPhers') }}</button><result-info label="mean rPheRS Z-score" :text="projectZHelp" /></span></th>
            </tr></thead><tbody>
                <template v-for="project in displayProjects">
                    <tr v-if="pinnedProjects.length && project.name === displayProjects[0].name" :key="project.name + '-pinned-heading'" class="pbs-pinned-heading"><td colspan="7">Pinned projects · {{ pinnedProjects.length }}</td></tr>
                    <tr v-if="pinnedProjects.length && project.name === currentProjects[0]?.name" :key="project.name + '-page-heading'" class="pbs-page-heading"><td colspan="7">Current page results</td></tr>
                    <tr :key="project.name" :class="{ 'pbs-pinned-row': isPinned('projects', project.name) }"><td class="pbs-pin-column"><button type="button" class="pbs-pin" :aria-pressed="String(isPinned('projects', project.name))" :aria-label="(isPinned('projects', project.name) ? 'Unpin project ' : 'Pin project ') + project.name" v-result-tooltip="'Keep this project visible across pages and sorting'" @click="togglePin('projects', project.name)"><b-icon-pin-angle-fill v-if="isPinned('projects', project.name)"/><b-icon-pin-angle v-else/></button></td><td><button type="button" class="pbs-project-toggle" :aria-expanded="String(expanded === project.name)" :aria-controls="projectPanelId(project)" @click="expanded = expanded === project.name ? '' : project.name"><b-icon-chevron-down v-if="expanded === project.name" aria-hidden="true"/><b-icon-chevron-right v-else aria-hidden="true"/>{{ project.name }}</button><small>{{ project.investigators.length ? `Investigator: ${project.investigators.join(', ')}` : 'Investigator unavailable' }}</small></td>
                    <td><div class="pbs-count-bar"><b>{{ number(project.total) }}</b><div class="pbs-track"><span :style="{ width: `${project.total / maxProject * 100}%` }"></span></div></div></td><td v-result-tooltip="`${number(project.affected)} Yes, ${number(project.unaffected)} No, ${number(project.affectedUnknown)} Unknown`">{{ number(project.affected) }} / {{ number(project.unaffected) }}<small v-if="project.affectedUnknown">{{ number(project.affectedUnknown) }} unknown</small></td>
                    <td v-result-tooltip="`${project.ageKnown} of ${project.total} valid ages`">{{ age(project.medianAge) }} <template v-if="project.medianAge != null">({{ age(project.q1Age) }}–{{ age(project.q3Age) }})</template></td>
                    <td v-result-tooltip="`${project.sex.unknown} unknown`">{{ number(project.sex.female) }} / {{ number(project.sex.male) }}<small v-if="project.sex.unknown">{{ project.sex.unknown }} unknown</small></td>
                    <td v-result-tooltip="`${project.phersKnown} of ${project.total} scored; mean uses available scores`">{{ score(project.meanResidualPhers) }}<small v-if="project.phersKnown < project.total">{{ project.phersKnown }} scored</small></td></tr>
                    <tr v-if="expanded === project.name" :key="`${project.name}-details`" class="pbs-project-details"><td colspan="7"><div :id="projectPanelId(project)" class="pbs-project-grid">
                        <div><h3>Age · {{ project.name }}</h3><div v-for="bin in projectAges" :key="bin.label" class="pbs-distribution"><span>{{ bin.label }}</span><b>{{ bin.count }}</b><div class="pbs-track"><span :style="{ width: `${bin.width}%` }"></span></div></div></div>
                        <div><h3>Phenotypes in this project</h3><p class="pbs-hierarchy-note">Samples with each phenotype / {{ number(project.total) }} matching samples in this project. Includes more specific terms; each sample is counted once per term. Highlighted terms are your query.</p><div class="pbs-project-tree-scroll" tabindex="0" aria-label="Project phenotype hierarchy"><project-phenotype-tree :key="project.name + queryKey" :nodes="projectTree" :total="project.total" :selected="activeIds" :query-color="queryColor"/></div></div>
                    </div></td></tr>
                </template>
                <tr v-if="ready && !projects.length"><td colspan="7">No matching projects.</td></tr>
            </tbody></table></div>
            <result-pagination :page="pages.projects" :total="unpinnedProjects.length" :size="5" label="projects" @change="pages.projects = $event"/>
        </section>

        <section v-show="(!error || ready) && (!ready || total > 0)" class="pbp-card" aria-labelledby="pbs-samples-title">
            <div class="pbp-rowhead"><h2 id="pbs-samples-title">Matching samples <span class="pbs-muted">· {{ ready ? number(total) : '—' }}</span> <result-info label="matching sample table" :text="samplesHelp" /></h2><div class="pbs-actions"><button type="button" class="pbp-btn" :disabled="!ready || !filteredSamples.length" @click="exportSamples">Export table</button></div></div>
            <p v-if="sampleProjectFilter !== null || samplePhenotypeFilter !== null" class="pbs-filter-caption" role="status">Table filters: {{ number(filteredSamples.length) }} of {{ number(total) }} matching samples <button type="button" class="pbs-link" @click="sampleProjectFilter = null; samplePhenotypeFilter = null">Clear filters</button></p>
            <div class="pbs-table-wrap"><table class="pbs-table pbs-samples" :class="{ 'pbs-profile-samples': multiple }"><thead><tr><th class="pbs-pin-column"><b-icon-pin-angle aria-label="Pin sample"/></th><th><button class="pbp-sort" @click="sortBy('samples', 'sample')">Sample {{ indicator('samples', 'sample') }}</button></th><th v-if="multiple"><project-table-filter v-model="samplePhenotypeFilter" :options="samplePhenotypeOptions" heading="Phenotype match" filter-key="phenotypes" search-label="Find an included phenotype" description="Show samples matching any checked phenotype, including more specific terms. Samples matching several checked terms appear once." :sortable="false"/></th><th v-if="multiple"><span class="pbs-heading-help"><button class="pbp-sort" @click="sortBy('samples', 'z')">rPheRS Z-score {{ indicator('samples', 'z') }}</button><result-info label="rPheRS Z-score" :text="zHelp" /></span></th><th><button class="pbp-sort" @click="sortBy('samples', 'phenotypes')">Other recorded phenotypes {{ indicator('samples', 'phenotypes') }}</button></th><th><button class="pbp-sort" @click="sortBy('samples', 'age')">Age · sex {{ indicator('samples', 'age') }}</button></th><th><project-table-filter v-model="sampleProjectFilter" :options="sampleProjectOptions" :sort-direction="sort.samples.key === 'project' ? sort.samples.dir : ''" @sort="sortSampleProjects"/></th><th><button class="pbp-sort" @click="sortBy('samples', 'affected')">Affected {{ indicator('samples', 'affected') }}</button></th><th v-if="!multiple"><span class="pbs-heading-help"><button class="pbp-sort" @click="sortBy('samples', 'z')">rPheRS Z-score {{ indicator('samples', 'z') }}</button><result-info label="rPheRS Z-score" :text="zHelp" /></span></th></tr></thead><tbody>
                <template v-for="sample in displaySamples">
                <tr v-if="pinnedSamples.length && sample.id === displaySamples[0].id" :key="sample.id + '-pinned-heading'" class="pbs-pinned-heading"><td :colspan="multiple ? 8 : 7">Pinned samples · {{ pinnedSamples.length }}</td></tr>
                <tr v-if="pinnedSamples.length && sample.id === currentSamples[0]?.id" :key="sample.id + '-page-heading'" class="pbs-page-heading"><td :colspan="multiple ? 8 : 7">Current page results</td></tr>
                <tr :key="sample.id" :class="{ 'pbs-pinned-row': isPinned('samples', sample.id) }"><td class="pbs-pin-column"><button type="button" class="pbs-pin" :aria-pressed="String(isPinned('samples', sample.id))" :aria-label="(isPinned('samples', sample.id) ? 'Unpin sample ' : 'Pin sample ') + sample.id" v-result-tooltip="'Keep this sample visible across pages and sorting'" @click="togglePin('samples', sample.id)"><b-icon-pin-angle-fill v-if="isPinned('samples', sample.id)"/><b-icon-pin-angle v-else/></button></td><td><a :href="`/sampleresult.html?query=${encodeURIComponent(sample.id)}`">{{ sample.id }}</a></td><td v-if="multiple"><query-match-markers :ids="activeIds" :matched="activeIds.map(id => sample.terms.includes(id))" :name="name" :term-style="termStyle"/><span class="pbs-match-count">{{ sample.matchedCount }}/{{ activeIds.length }}</span></td><td v-if="multiple">{{ score(sample.z) }}</td><td><span v-for="id in sampleOtherTerms(sample).slice(0, 2)" :key="id" class="pbs-term-pill">{{ name(id) }}</span><details v-if="sampleOtherTerms(sample).length > 2" class="pbs-more-terms"><summary>+{{ sampleOtherTerms(sample).length - 2 }} more</summary><span v-for="id in sampleOtherTerms(sample).slice(2)" :key="id" class="pbs-term-pill">{{ name(id) }}</span></details><span v-if="!sampleOtherTerms(sample).length" class="pbs-muted">—</span></td><td>{{ age(sample.age) }} · {{ sample.sex }}</td><td>{{ sample.project }}<small v-if="sample.investigator">{{ sample.investigator }}</small></td><td>{{ sample.affected === 'Y' ? 'Yes' : sample.affected === 'N' ? 'No' : 'Unknown' }}</td><td v-if="!multiple">{{ score(sample.z) }}</td></tr>
                </template>
                <tr v-if="ready && !filteredSamples.length"><td :colspan="multiple ? 8 : 7">{{ total ? 'No samples match the selected table filters.' : 'No matching samples.' }}</td></tr>
            </tbody></table></div><result-pagination :page="pages.samples" :total="unpinnedSamples.length" :size="5" label="samples" @change="pages.samples = $event"/>
        </section>

        <section v-if="!multiple" v-show="(!error || ready) && (!ready || total > 0)" class="pbp-card" aria-labelledby="pbs-genes-title">
            <div class="pbp-rowhead"><h2 id="pbs-genes-title">Single-gene burden results for {{ name(hpo) }} <result-info label="single-gene burden methods" :text="burdenHelp" /></h2><span class="pbs-muted">Precomputed · {{ number(deliveredGenes.length) }} genes at P &lt; 0.05</span></div>
            <div class="pbs-gene-controls"><span>{{ hpo }} · all-gene analysis</span><label>Show <select v-model="geneFilter" aria-label="Gene significance filter"><option value="p">P &lt; 0.05</option><option value="q">q &lt; 0.05</option></select></label></div>

            <p v-if="geneLoading" role="status" class="pbs-muted">Loading precomputed results…</p><p v-if="geneError" role="alert">{{ geneError }} <button type="button" class="pbp-btn" @click="$emit('retry-genes')">Retry</button></p>
            <div class="pbs-table-wrap"><table class="pbs-table pbs-genes"><thead><tr>
                <th><button class="pbp-sort" @click="sortBy('genes', 'gene')">Gene {{ indicator('genes', 'gene') }}</button></th>
                <th><span class="pbs-heading-help"><button class="pbp-sort" @click="sortBy('genes', 'beta')">β {{ indicator('genes', 'beta') }}</button><result-info label="beta and GRS" :text="betaHelp" /></span></th>
                <th><span class="pbs-heading-help"><button class="pbp-sort" @click="sortBy('genes', 'ci')">95% CI {{ indicator('genes', 'ci') }}</button><result-info label="95% confidence interval" :text="ciHelp" /></span></th>
                <th><span class="pbs-heading-help"><button class="pbp-sort" @click="sortBy('genes', 'p')">p {{ indicator('genes', 'p') }}</button><result-info label="p-value" :text="pHelp" /></span></th>
                <th><span class="pbs-heading-help"><button class="pbp-sort" @click="sortBy('genes', 'q')">q {{ indicator('genes', 'q') }}</button><result-info label="q-value" :text="qHelp" /></span></th>
                <th><span class="pbs-heading-help"><button class="pbp-sort" @click="sortBy('genes', 'withPhenotype')">Gene carriers with phenotype {{ indicator('genes', 'withPhenotype') }}</button><result-info label="gene carrier counts" :text="carrierHelp" /></span><small>of {{ number(burdenCarriers.nCases) }}</small></th>
                <th><span class="pbs-heading-help"><button class="pbp-sort" @click="sortBy('genes', 'allCarriers')">Gene carriers {{ indicator('genes', 'allCarriers') }}</button><result-info label="all gene carriers" :text="carrierHelp" /></span></th>
                <th><button class="pbp-sort" @click="sortBy('genes', 'disease')">Reference disease {{ indicator('genes', 'disease') }}</button></th>
            </tr></thead><tbody>
                <tr v-for="row in visibleGenes" :key="row.gene"><td><a :href="`/generesult.html?query=${encodeURIComponent(row.gene)}`"><b>{{ row.gene }}</b></a></td><td>{{ coefficient(row.association.betaPer0_1Grs) }}</td><td>{{ interval(row.association) }}</td><td>{{ statistic(row.association.pValue) }}</td><td :class="{ 'pbs-q': row.association.qValue != null && row.association.qValue < 0.05 }">{{ statistic(row.association.qValue) }}</td><td>{{ carrierLabel(row.gene, true) }}</td><td>{{ carrierLabel(row.gene, false) }}</td><td><template v-if="row.diseases.length"><a v-for="disease in row.diseases" :key="disease.key" :href="diseaseUrl(disease)" target="_blank" rel="noopener noreferrer" class="pbs-reference"><span class="pbp-reference-badge" :class="disease.source">{{ sourceLabel(disease.source) }}</span> {{ disease.name }}</a></template><span v-else class="pbs-muted">None linked</span></td></tr>
                <tr v-if="!geneLoading && !geneError && !filteredGenes.length"><td colspan="8">No precomputed associations match this significance filter.</td></tr>
            </tbody></table></div><result-pagination :page="pages.genes" :total="filteredGenes.length" :size="5" label="genes" @change="pages.genes = $event"/><small v-if="analysisN" class="pbs-carrier-coverage">Analysis N: {{ analysisN }} · original single-gene burden-analysis cohort</small>
        </section>

        <section v-else v-show="(!error || ready) && (!ready || total > 0)" class="pbp-card" aria-labelledby="pbs-profile-genes-title">
            <div class="pbp-rowhead"><h2 id="pbs-profile-genes-title">Genes carried more often by the matching samples <result-info label="this gene comparison" :text="comparisonHelp" /></h2><span class="pbs-muted">{{ multiGeneResult ? number(multiGeneResult.nCompared) : '—' }} genes compared</span></div>
            <div class="pbs-gene-band"><span class="pbs-group pbs-have">{{ number(total) }} match</span><span>vs</span><span class="pbs-group pbs-rest">{{ number(rest) }} do not</span><span class="pbs-band-explanation">Do the matching samples carry scored variants in this gene more often?</span><b class="pbs-precomputed pbs-counted">Counted for this search</b></div>
            <p v-if="multiGeneLoading" role="status" class="pbs-muted">Comparing carrier counts…</p><p v-if="multiGeneError" role="alert">{{ multiGeneError }} <button type="button" class="pbp-btn" @click="$emit('retry-comparison')">Retry</button></p>
            <div class="pbs-table-wrap"><table class="pbs-table pbs-profile-genes"><thead><tr>
                <th><button class="pbp-sort" @click="sortBy('profileGenes','gene')">Gene {{ indicator('profileGenes','gene') }}</button></th>
                <th><button class="pbp-sort" @click="sortBy('profileGenes','matching')">Carriers among the {{ number(total) }} {{ indicator('profileGenes','matching') }}</button><small>matching samples</small></th>
                <th><button class="pbp-sort" @click="sortBy('profileGenes','other')">Carriers among the {{ number(rest) }} {{ indicator('profileGenes','other') }}</button><small>everyone else</small></th>
                <th><span class="pbs-heading-help"><button class="pbp-sort" @click="sortBy('profileGenes','ratio')">How much more often {{ indicator('profileGenes','ratio') }}</button><result-info label="carrier frequency ratio" :text="ratioHelp"/></span></th>
                <th><span class="pbs-heading-help"><button class="pbp-sort" @click="sortBy('profileGenes','p')">Fisher p-value {{ indicator('profileGenes','p') }}</button><result-info label="Fisher p-value" :text="fisherHelp" :table="fisherTable"/></span><small>unadjusted</small></th>
                <th>Which of your phenotypes the carriers have</th><th><span class="pbs-heading-help">Phenotype-matched disease links <result-info label="phenotype-matched disease links" :text="referenceLinkHelp"/></span></th>
            </tr></thead><tbody>
                <tr v-for="row in page('profileGenes', sortedProfileGenes, 5)" :key="row.gene"><td><a :href="`/generesult.html?query=${encodeURIComponent(row.gene)}`"><b>{{ row.gene }}</b></a></td><td>{{ number(row.matchingCarriers) }} · {{ carrierPercent(row.matchingCarriers, multiGeneResult.matchingCoveredCount) }}</td><td>{{ number(row.comparisonCarriers) }} · {{ carrierPercent(row.comparisonCarriers, multiGeneResult.otherCoveredCount) }}</td><td><b>{{ row.ratio == null ? '—' : `${Number(row.ratio.toFixed(1))}×` }}</b></td><td>{{ statistic(row.pValue) }}</td><td><span v-for="(id,index) in activeIds.filter((id,index) => row.queryCarrierCounts[index] > 0)" :key="id" class="pbs-term-pill"><b-icon-square-fill :style="{color:queryColor(id)}" aria-hidden="true"/> {{ name(id) }} {{ row.queryCarrierCounts[activeIds.indexOf(id)] }} of {{ row.matchingCarriers }}</span></td><td><template v-if="row.diseases.length"><a v-for="disease in row.diseases" :key="disease.key" class="pbs-reference" :href="diseaseUrl(disease)" target="_blank" rel="noopener noreferrer"><span class="pbp-reference-badge" :class="disease.source">{{ sourceLabel(disease.source) }}</span> {{ disease.name }}</a></template><small v-else>No phenotype-matched link in loaded references</small></td></tr>
                <tr v-if="!multiGeneLoading && !multiGeneError && !profileGenes.length"><td colspan="7">No genes are carried more often in the matching group with the available score coverage.</td></tr>
            </tbody></table></div><result-pagination :page="pages.profileGenes" :total="profileGenes.length" :size="5" label="profile genes" @change="pages.profileGenes = $event"/>
            <small v-if="multiGeneResult" class="pbs-carrier-coverage">GRS coverage: {{ number(multiGeneResult.matchingCoveredCount) }} / {{ number(total) }} matching samples and {{ number(multiGeneResult.otherCoveredCount) }} / {{ number(rest) }} everyone else. Percentages and comparisons use covered samples. Two-sided Fisher exact p; unadjusted for ancestry, project or family.</small>
        </section>

        <section v-show="!error || ready" class="pbp-card" aria-labelledby="pbs-diseases-title">
            <div class="pbp-rowhead"><h2 id="pbs-diseases-title">External diseases with {{ multiple ? 'similar phenotypes' : 'this phenotype' }} <result-info label="external disease references" :text="diseaseHelp" /></h2><div class="pbs-source-tabs" aria-label="Disease source"><button v-for="item in sources" :key="item.key" type="button" class="pbp-btn" :class="{ active: source === item.key }" :aria-pressed="String(source === item.key)" @click="$emit('source', item.key)">{{ item.label }} · {{ item.count }}</button></div></div>
            <div class="pbs-disease-grid"><div><div class="pbs-table-wrap"><table class="pbs-table pbs-diseases"><thead><tr><th v-if="multiple" class="pbs-disease-rank"><span class="pbs-heading-help"><button class="pbp-sort" @click="sortBy('diseases', 'rank')">Rank {{ indicator('diseases', 'rank') }}</button><result-info label="disease rank" :text="rankHelp"/></span></th><th><button class="pbp-sort" @click="sortBy('diseases', 'name')">Disease {{ indicator('diseases', 'name') }}</button></th><th><button class="pbp-sort" @click="sortBy('diseases', 'matched')">{{ multiple ? 'Matched' : 'Frequency' }} {{ indicator('diseases', 'matched') }}</button></th><th><button class="pbp-sort" @click="sortBy('diseases', 'genes')">Curated gene(s) {{ indicator('diseases', 'genes') }}</button></th></tr></thead><tbody>
                <template v-for="disease in page('diseases', sortedDiseases, 5)"><tr :key="disease.code"><td v-if="multiple"><button type="button" class="pbs-rank-button" :aria-label="`Rank ${disease.rank}: show calculation for ${disease.name}`" :aria-expanded="String(expandedDisease === disease.code)" :aria-controls="`pbs-disease-evidence-${disease.code}`" @click="expandedDisease = expandedDisease === disease.code ? '' : disease.code">{{ disease.rank }}</button></td><td><a :href="diseaseUrl(disease)" target="_blank" rel="noopener noreferrer"><b>{{ disease.name }}</b></a><small>{{ disease.referenceId }}</small></td><td><template v-if="multiple"><query-match-markers :ids="activeIds" :matched="activeIds.map(id => disease.matchedIds.includes(id))" :name="name" :term-style="termStyle"/><span class="pbs-match-count">{{ disease.matchedIds.length }}/{{ activeIds.length }}</span></template><template v-else>{{ disease.frequency || '—' }}</template></td><td><template v-if="disease.genes.length"><template v-for="(gene, index) in disease.genes"><span v-if="index" :key="`${gene[0]}-comma`">, </span><a :key="gene[0]" :href="`/generesult.html?query=${encodeURIComponent(gene[0])}`">{{ gene[0] }}</a></template></template><span v-else class="pbs-muted">—</span></td></tr><tr v-if="multiple && expandedDisease === disease.code" :key="disease.code + '-evidence'" class="pbs-disease-evidence-row"><td colspan="4"><disease-rank-details :id="`pbs-disease-evidence-${disease.code}`" :disease="disease" :ids="activeIds" :terms="terms" :source-label="sourceLabel(source)"/></td></tr></template>
                <tr v-if="!diseases.length"><td :colspan="multiple ? 4 : 3">No diseases linked in {{ sourceLabel(source) }}.</td></tr>
            </tbody></table></div><result-pagination :page="pages.diseases" :total="diseases.length" :size="5" label="diseases" @change="pages.diseases = $event"/><p class="pbs-muted">reference only, not a diagnosis</p></div>
            <div><h3>Phenotypes that would separate these diseases</h3><div class="pbs-table-wrap"><table class="pbs-table pbs-separators"><thead><tr><th><button class="pbp-sort" @click="sortBy('separators', 'name')">Phenotype {{ indicator('separators', 'name') }}</button></th><th><button class="pbp-sort" @click="sortBy('separators', 'count')">{{ multiple ? 'Top 10 diseases' : 'Diseases' }} {{ indicator('separators', 'count') }}</button></th><th><button class="pbp-sort" @click="sortBy('separators', 'samples')">Samples {{ indicator('separators', 'samples') }}</button></th><th><button class="pbp-sort" @click="sortBy('separators', 'samples')">Require {{ indicator('separators', 'samples') }}</button></th><th><button class="pbp-sort" @click="sortBy('separators', 'exclude')">Exclude {{ indicator('separators', 'exclude') }}</button></th></tr></thead><tbody>
                <tr v-for="item in page('separators', sortedSeparators, 5)" :key="item.id"><td>{{ name(item.id) }}</td><td><b>{{ item.count }} of {{ item.total }}</b></td><td>{{ number(separatorSampleCount(item.id)) }}</td><td><refine-button :disabled="!searchableHpo(item.id)" :id="item.id" :name="name(item.id)" :count="separatorSampleCount(item.id)" @choose="$emit('require', $event)"/></td><td><refine-button exclude :disabled="!searchableHpo(item.id)" :id="item.id" :name="name(item.id)" :count="separatorSampleCount(item.id) == null ? null : total - separatorSampleCount(item.id)" @choose="$emit('exclude', $event)"/></td></tr>
                <tr v-if="!separators.length"><td colspan="5">No separating phenotypes for this disease set.</td></tr>
            </tbody></table></div><result-pagination :page="pages.separators" :total="separators.length" :size="5" label="separating phenotypes" @change="pages.separators = $event"/></div></div>
        </section>
    </div>
</template>
<script>
import ResultInfo from './ResultInfo.vue';
import DiseaseRankDetails from './DiseaseRankDetails.vue';
import ResultPagination from './ResultPagination.vue';
import resultTooltip from './resultTooltip';
import { describeMatchingRule } from './matchingRule';
import ProjectTableFilter from './ProjectTableFilter.vue';
import { AGE_BANDS, FREQUENCIES, formatStatistic, sortTableRows } from './phenotypeModel';
import { ancestorsOf, recordedTerms, separatingTerms, summarizeProjects, distribution, pageRows, sortSamples, splitPinnedRows, matchingCombinations, filterSampleProjects, filterSamplePhenotypes, projectPhenotypeTree, filterHierarchyCategories, orderPhenotypeHierarchy, hierarchyRows } from './singlePhenotypeModel';
import RefineButton from './RefineButton.vue';
import QueryMatchMarkers from './QueryMatchMarkers.vue';
import ProjectPhenotypeTree from './ProjectPhenotypeTree.vue';
import { burdenCarrierCounts } from './singleBurdenCarriers';
export default {
    name: 'SinglePhenotypeResults',
    directives: { resultTooltip },
    components: { ResultInfo, DiseaseRankDetails, ProjectTableFilter, ResultPagination, RefineButton, ProjectPhenotypeTree, QueryMatchMarkers },
    props: {
        profileIds: { type: Array, default: () => [] }, matchMode: String, minimum: Number, termStyle: Function, multiGeneResult: Object, multiGeneLoading: Boolean, multiGeneError: String,
        hpo: String, terms: Object, samples: Array, cohortCount: Number, counts: Object,
        ready: Boolean, loading: Boolean, error: String, geneRows: Array, geneLoading: Boolean,
        geneError: String, geneRelease: Object, diseases: Array, sources: Array, source: String,
    },
    data() { return ({
        pages: { combinations: 1, profileGenes: 1, projects: 1, terms: 1, samples: 1, genes: 1, diseases: 1, separators: 1 },
        sort: { diseases: { key: 'rank', dir: 'asc' }, separators: { key: 'gain', dir: 'desc' }, profileGenes: { key: 'p', dir: 'asc' }, terms: { key: 'count', dir: 'desc' }, projects: { key: 'total', dir: 'desc' }, samples: { key: this.profileIds.length > 1 ? 'z' : 'project', dir: this.profileIds.length > 1 ? 'desc' : 'asc' }, genes: { key: 'p', dir: 'asc' } },
        expandedDisease: '', cohortPhenotypeView: 'tree', cohortCategoryFilter: null, sampleProjectFilter: null, samplePhenotypeFilter: null, expanded: '', pinned: { projects: [], samples: [] }, geneFilter: 'p',
    }); },
    computed: {
        activeIds() { return this.profileIds.length ? this.profileIds : [this.hpo]; },
        multiple() { return this.activeIds.length > 1; },
        matchingRule() { return describeMatchingRule(this.matchMode, this.minimum, this.activeIds.length); },
        matchLabel() { return `${this.matchingRule.label} · ${this.matchingRule.short}`; },
        cohortBarStyle() { return { gridTemplateColumns: !this.total || !this.rest ? 'minmax(0, 1fr)' : `${Math.max(12, Math.min(88, this.total / this.cohortCount * 100))}% minmax(0, 1fr)` }; },
        combinations() { return matchingCombinations(this.samples, this.activeIds); },
        summaryHelp() { return 'Matching samples satisfy the current search and Advanced filters. A phenotype also matches its more specific HPO terms. All requires every included term; Any requires at least one; Custom uses the chosen minimum. The gray group is everyone outside this search, not proof that a phenotype is absent. Bar widths are adjusted for readability; use the printed counts.'; },
        projectHelp() { return 'Each row summarizes matching samples in one project. Affected shows recorded Yes / No counts; unknown values are separate. Age is the median with the middle 50% of known ages (Q1–Q3). Expand a project for age and phenotype details. Pins keep rows visible when you change pages.'; },
        projectZHelp() { return 'Mean of the available rPheRS Z-scores among this project’s matching samples. Missing scores are omitted, not treated as zero. All scores use the same full-cohort reference for this search; the mean is not a project-specific standardized score.'; },
        peopleHelp() { return 'Age, sex and affected status describe the complete matching group. These samples (%) uses that group; All CRDC (%) uses the full search cohort. Require (+) adds a mandatory phenotype to the existing search; Exclude (−) removes samples with it. The number beside each action predicts how many of the current samples will remain. Hierarchy shows observed branches, including query terms and their ancestors, with distinct sample counts. Expand a branch to see more specific terms. Table shows selected query terms first, followed by other terms with query ancestors omitted. Selected query phenotypes stay first in both views. Hierarchy filters show selected top-level categories only; the order controls sort siblings within each branch. Hierarchy is an overview with sample counts; use Table for percentages and Require / Exclude actions. Switch views to compare.'; },
        samplesHelp() { return 'Click a sample ID to open its detail page. Click a column heading to sort; use the Phenotype match and Project / Investigator checkboxes to narrow this table. Selected phenotypes are combined with OR, then intersected with selected projects. Both filters also apply to the export, but do not change the other cards. Pins remain visible across pages. Phenotype match is the number of included terms matched, not a probability.'; },
        burdenHelp() { return 'Existing single-gene burden results for this one HPO across genes. The default list contains delivered P < 0.05 results; use Show to select q < 0.05. Both positive and negative effects are retained. β is per 0.1 Sum GRS. q is adjusted across valid genes within this HPO before the delivery filter. Carrier means Sum GRS > 0 in that original analysis cohort. The analysis cohort can differ from the search cohort.'; },
        qHelp() { return 'The p-value adjusted for multiple testing by Benjamini–Hochberg across all valid gene tests for this HPO, before filtering the delivered results. Gene pages instead adjust across HPOs for one gene. The same gene–HPO pair can therefore have different q-values on the two pages.'; },
        pHelp() { return 'The original single-gene burden test p-value, before multiple-testing adjustment. A smaller p-value is stronger statistical evidence under the model; it is not the probability that this gene causes a patient’s symptoms.'; },
        ciHelp() { return '95% confidence interval for the displayed beta per 0.1 GRS, on the same effect scale. Wider intervals indicate less precise effect estimates.'; },
        carrierHelp() { return 'A carrier has Sum GRS > 0 for the gene in the original burden-analysis cohort. Gene carriers with phenotype counts carriers who also have this HPO; Gene carriers counts all carriers in that cohort, including those with the phenotype. These are not matching-group versus nonmatching-group counts.'; },
        diseaseHelp() { return 'Curated disease–phenotype references from the selected source. Source counts refer to diseases, not CRDC samples. Frequency describes how often a phenotype is reported for that disease; missing frequency stays unavailable. The separating-phenotype table counts diseases and current matching samples separately. These references do not establish a diagnosis.'; },
        betaHelp() { return 'β per 0.1 GRS summarizes how the gene burden is associated with this phenotype. Positive β indicates higher scored burden is associated with the phenotype being recorded more often; negative β indicates less often. GRS is the gene-level genetic risk score. Sum GRS adds ALT allele dosage × pathogenicity score across variants in a gene: 1 for LoFTEE high-confidence loss of function, otherwise the available AlphaMissense score.'; },
        zHelp() { return 'rPheRS is a residual phenotype risk score: phenotype matches are weighted and adjusted for the total HPO count. Z expresses this score in standard deviations from the full scoring cohort mean for this search. A higher value indicates a stronger phenotype match, not a disease probability. Missing scores display —; table filtering does not change the reference.'; },
        rankHelp() { return this.source === 'orphanet'
            ? 'Click a rank number to inspect matching HPO annotations, their reported frequencies and weights. Rank score = 2 × Q × D / (Q + D), where Q = matched frequency-weight sum / selected phenotype count, and D = min(1, matched weight sum / disease phenotype weight sum). The disease denominator reduces ancestor–descendant duplication. Highest score first; ties use Q, then disease name. A specific disease annotation also matches an ancestor query. This is a reference ranking, not a diagnostic probability.'
            : 'Click a rank number for matching phenotype annotations. Ranked by the number of disease annotations matching your query, then selected terms matched, then the fraction of the disease profile matched. Ties use disease name. This source does not supply frequency weights.'; },
        ratioHelp() { const row = this.sortedProfileGenes[0], result = this.multiGeneResult; return 'Simple carrier-frequency ratio = (matching carriers / matching samples with GRS data) ÷ (other carriers / other samples with GRS data). Carrier means Sum GRS > 0. Samples with missing GRS data are excluded from both denominators and the Fisher test. This is a descriptive comparison without adjustment for age, sex, ancestry, project or family.' + (row && result ? `\nExample — ${row.gene}: (${this.number(row.matchingCarriers)} / ${this.number(result.matchingCoveredCount)}) ÷ (${this.number(row.comparisonCarriers)} / ${this.number(result.otherCoveredCount)}) = ${row.ratio == null ? 'unavailable (zero carriers in comparison group)' : Number(row.ratio.toFixed(2)) + '×'}.` : ''); },
        fisherHelp() { const row = this.sortedProfileGenes[0]; return 'Two-sided Fisher exact test on carrier / non-carrier counts in the matching group versus everyone else. Uses only samples with GRS data. Non-carriers = covered samples − carriers. This is a simple, unadjusted comparison: no age, sex, ancestry, project or family covariates; no correction for the many genes tested.' + (row ? `\nThe example below uses ${row.gene}: Fisher p = ${this.statistic(row.pValue)}.` : ''); },
        fisherTable() { const row = this.sortedProfileGenes[0], result = this.multiGeneResult; return row && result ? { caption: `${row.gene} · actual 2 × 2 counts`, headings: ['Group', 'Carrier', 'Non-carrier'], rows: [['Matching', this.number(row.matchingCarriers), this.number(result.matchingCoveredCount - row.matchingCarriers)], ['Everyone else', this.number(row.comparisonCarriers), this.number(result.otherCoveredCount - row.comparisonCarriers)]] } : null; },
        referenceLinkHelp() { return 'Curated gene–disease links whose disease phenotypes match this search, from the loaded Orphanet, OMIM, DECIPHER and DDG2P references where gene mappings are available. Orphanet profile links also require rank score ≥ 0.1. These links provide reference context for the carrier comparison; they do not enter its ratio or Fisher p-value. No link means the loaded references have no qualifying gene–disease–phenotype link for this search. It does not mean that the gene has no known disease association.'; },
        comparisonHelp() { return 'Carrier = Sum GRS > 0. This is a count comparison between covered matching samples and covered everyone-else samples, using a two-sided Fisher exact test. p is unadjusted for ancestry, project, family and multiple testing. Original single-HPO burden results are not recalculated.'; },
        profileGenes() { const references = new Map(this.geneRows.map(row => [row.gene, row.diseases])); return (this.multiGeneResult?.rows || []).map(row => ({ ...row, diseases: references.get(row.gene) || [] })); },
        sortedProfileGenes() { return sortTableRows(this.profileGenes, this.sort.profileGenes, { gene: row => row.gene, matching: row => row.matchingCarriers, other: row => row.comparisonCarriers, ratio: row => row.ratio, p: row => row.pValue }); },
        total() { return this.samples.length; }, rest() { return Math.max(0, this.cohortCount - this.total); },
        projects() { return summarizeProjects(this.samples); },
        summary() { return summarizeProjects(this.samples.map(row => ({ ...row, project: 'All' })))[0] || { affected: 0 }; },
        sortedProjects() { return sortTableRows(this.projects, this.sort.projects, { ...Object.fromEntries(['name', 'total', 'affected', 'medianAge', 'meanResidualPhers'].map(key => [key, row => row[key]])), sex: row => row.sex.female }); },
        maxProject() { return Math.max(1, ...this.projects.map(row => row.total)); },
        ages() { return this.ageDistribution(this.samples); },
        sexes() { return distribution(this.samples, 'sex', ['Male', 'Female', 'Unknown']); },
        affected() { return distribution(this.samples, 'affected', ['Yes', 'No', 'Unknown']); },
        cohortTree() { return projectPhenotypeTree(this.samples, this.terms); },
        cohortCategoryOptions() { return (this.cohortTree.find(row => row.id === 'HP:0000118')?.children || []).map(row => ({ name: row.id, label: row.label, investigators: row.id, count: row.count })).sort((a, b) => a.label.localeCompare(b.label)); },
        visibleCohortTree() { return orderPhenotypeHierarchy(filterHierarchyCategories(this.cohortTree, this.cohortCategoryFilter), this.sort.terms, this.counts, this.total, this.activeIds); },
        selectedPhenotypeRows() { const lookup = new Map(hierarchyRows(this.visibleCohortTree).map(row => [row.id, row])); return this.activeIds.filter(id => lookup.has(id)).map(id => ({ ...lookup.get(id), children: [] })); },
        tableQueryRows() { const lookup = new Map(hierarchyRows(this.cohortTree).map(row => [row.id, row])); return this.activeIds.filter(id => lookup.has(id)).map(id => lookup.get(id)); },
        displayedCoTerms() { return [...this.tableQueryRows, ...this.page('terms', this.sortedCoTerms, 5)]; },
        coTerms() { return recordedTerms(this.samples, this.activeIds, this.terms); },
        sortedCoTerms() { return sortTableRows(this.coTerms, this.sort.terms, { phenotype: row => this.name(row.id), count: row => row.count, all: row => this.counts?.[row.id] ?? null, exclude: row => this.total - row.count }); },
        termCounts() { return Object.fromEntries(this.coTerms.map(row => [row.id, row.count])); },
        projectSamples() { return this.samples.filter(row => (row.project || 'Unknown') === this.expanded); },
        projectAges() { return this.ageDistribution(this.projectSamples); },
        projectTree() { return orderPhenotypeHierarchy(projectPhenotypeTree(this.projectSamples, this.terms), { key: 'count', dir: 'desc' }, this.counts, this.projectSamples.length, this.activeIds); },
        sampleProjectOptions() { return this.projects.map(row => ({ name: row.name, count: row.total, investigators: row.investigators.join(', ') })).sort((a,b) => a.name.localeCompare(b.name)); },
        samplePhenotypeOptions() { const rows = filterSampleProjects(this.samples, this.sampleProjectFilter); return this.activeIds.map(id => ({ name: id, label: this.name(id), investigators: id, count: rows.filter(row => row.terms.includes(id)).length })); },
        queryKey() { return this.activeIds.join(','); },
        filteredSamples() { return filterSamplePhenotypes(filterSampleProjects(this.samples, this.sampleProjectFilter), this.samplePhenotypeFilter); },
        sortedSamples() { return this.sort.samples.key === 'phenotypes' ? sortTableRows(this.filteredSamples, this.sort.samples, { phenotypes: row => row.terms.filter(id => !this.omitTerms.has(id)).map(this.name).sort().join('; ') }) : sortSamples(this.filteredSamples, this.sort.samples); },
        projectGroups() { return splitPinnedRows(this.sortedProjects, this.pinned.projects, row => row.name, this.pages.projects, 5); },
        pinnedProjects() { return this.projectGroups.pinned; }, unpinnedProjects() { return this.projectGroups.unpinned; }, currentProjects() { return this.projectGroups.page; }, displayProjects() { return this.projectGroups.display; },
        sampleGroups() { return splitPinnedRows(this.sortedSamples, this.pinned.samples, row => row.id, this.pages.samples, 5); },
        pinnedSamples() { return this.sampleGroups.pinned; }, unpinnedSamples() { return this.sampleGroups.unpinned; }, currentSamples() { return this.sampleGroups.page; }, displaySamples() { return this.sampleGroups.display; },
        deliveredGenes() { return this.geneRows.filter(row => row.association?.pValue != null && row.association.pValue < 0.05); },
        filteredGenes() { return this.geneFilter === 'q' ? this.deliveredGenes.filter(row => row.association.qValue != null && row.association.qValue < 0.05) : this.deliveredGenes; },
        analysisN() { return [...new Set(this.deliveredGenes.map(row => row.association.nSamples).filter(Boolean))].map(this.number).join('–'); },
        burdenCarriers() { return burdenCarrierCounts(this.hpo, this.deliveredGenes, this.geneRelease?.carrierCoverage?.sampleMembership); },
        sortedGenes() { return sortTableRows(this.filteredGenes, this.sort.genes, { gene: row => row.gene, beta: row => row.association.betaPer0_1Grs, ci: row => row.association.betaCiLowPer0_1Grs, p: row => row.association.pValue, q: row => row.association.qValue, withPhenotype: row => this.carrierValue(row.gene, true), allCarriers: row => this.carrierValue(row.gene, false), disease: row => row.diseases.map(item => item.name).join('; ') }); },
        visibleGenes() { return this.page('genes', this.sortedGenes, 5); },
        carrierByGene() { return new Map(this.geneRows.filter(row => row.association).map(row => [row.gene, row.association])); },
        sortedDiseases() { return sortTableRows(this.diseases, this.sort.diseases, { rank: row => row.rank, name: row => row.name, matched: row => this.multiple ? row.matchedIds.length : FREQUENCIES.find(item => item[0] === row.frequency)?.[2] ?? null, genes: row => row.genes.length ? row.genes.map(gene => gene[0]).sort().join(', ') : null }); },
        sortedSeparators() { return sortTableRows(this.separators, this.sort.separators, { name: row => this.name(row.id), count: row => row.count, gain: row => row.gain, samples: row => this.separatorSampleCount(row.id), exclude: row => this.separatorSampleCount(row.id) == null ? null : this.total - this.separatorSampleCount(row.id) }); },
        separators() { return separatingTerms(this.multiple ? this.diseases.slice(0,10) : this.diseases, this.activeIds, this.terms); },
        omitTerms() { const omit = new Set(); this.activeIds.forEach(id => { omit.add(id); ancestorsOf(id, this.terms).forEach(parent => omit.add(parent)); }); return omit; },
    },
    watch: { queryKey() { this.samplePhenotypeFilter = null; this.expandedDisease = ''; }, samplePhenotypeFilter() { this.pages.samples = 1; }, sampleProjectFilter() { this.pages.samples = 1; }, samples() { this.pages.samples = 1; this.pages.projects = 1; this.pages.terms = 1; this.pages.combinations = 1; }, multiGeneResult() { this.pages.profileGenes = 1; }, geneFilter() { this.pages.genes = 1; }, source() { this.pages.diseases = 1; this.pages.separators = 1; this.expandedDisease = ''; } },
    methods: {
        separatorSampleCount(id) { return this.ready && this.counts && Object.prototype.hasOwnProperty.call(this.counts, id) ? this.termCounts[id] || 0 : null; },
        searchableHpo(id) { return Number.isInteger(this.counts?.[id]) && this.counts[id] >= 1; },
        queryColor(id) { return this.termStyle ? this.termStyle(id)['--tseg'] : ['#E69F00','#56B4E9','#009E73'][this.activeIds.indexOf(id) % 3]; },
        underTerms(id) { const ancestors = ancestorsOf(id, this.terms); return this.activeIds.filter(query => ancestors.has(query)); },
        isPinned(table, id) { return this.pinned[table].includes(id); },
        togglePin(table, id) {
            this.$set(this.pinned, table, this.isPinned(table, id) ? this.pinned[table].filter(value => value !== id) : [...this.pinned[table], id]);
            const total = table === 'samples' ? this.filteredSamples.length : this.projects.length;
            const pinnedCount = table === 'samples' ? this.filteredSamples.filter(row => this.pinned.samples.includes(row.id)).length : this.pinned.projects.length;
            this.pages[table] = Math.min(this.pages[table], Math.max(1, Math.ceil((total - pinnedCount) / 5)));
        },
        carrierValue(gene, withPhenotype) {
            const row = this.burdenCarriers.byGene.get(gene);
            return row ? row[withPhenotype ? 'withPhenotype' : 'all'] : null;
        },
        carrierLabel(gene, withPhenotype) {
            return this.number(this.carrierValue(gene, withPhenotype));
        },
        number(value) { return value == null ? '—' : Number(value).toLocaleString(); },
        name(id) { return this.terms[id]?.[0] || id; },
        age(value) { return value == null ? '—' : Number(value.toFixed(1)).toLocaleString(); },
        score(value) { return value == null || !Number.isFinite(Number(value)) ? '—' : Number(value).toFixed(3); },
        percent(n, denominator) { if (!denominator || n == null) return '—'; const p = n / denominator * 100; return `${p > 0 && p < 1 ? p.toFixed(1) : Math.round(p)}%`; },
        carrierPercent(n, denominator) { return denominator ? `${(n / denominator * 100).toFixed(n > 0 && n / denominator < 0.001 ? 2 : 1)}%` : '—'; },
        allPercent(id) { return this.counts && Object.prototype.hasOwnProperty.call(this.counts, id) ? this.percent(this.counts[id], this.cohortCount) : '—'; },
        ageDistribution(samples) { return distribution(samples, 'age', [...AGE_BANDS.map(row => row.label), 'Unknown']); },
        page(key, rows, size) { return pageRows(rows, this.pages[key], size); },
        projectPanelId(project) { return `pbs-project-${this.projects.findIndex(row => row.name === project.name)}`; },
        sampleOtherTerms(sample) {
            const ids = sample.terms.filter(id => !this.omitTerms.has(id) && this.terms[id]);
            const ancestors = new Set(); ids.forEach(id => ancestorsOf(id, this.terms).forEach(parent => ancestors.add(parent)));
            return ids.filter(id => !ancestors.has(id));
        },
        sortSampleProjects(dir) { this.$set(this.sort, 'samples', { key: 'project', dir }); this.pages.samples = 1; },
        sortBy(table, key) { const old = this.sort[table]; this.$set(this.sort, table, { key, dir: old.key === key ? old.dir === 'asc' ? 'desc' : 'asc' : ['total', 'affected', 'z', 'meanResidualPhers', 'count', 'all', 'exclude', 'matched', 'matching', 'other', 'ratio', 'samples'].includes(key) ? 'desc' : 'asc' }); this.pages[table] = 1; },
        indicator(table, key) { return this.sort[table].key === key ? this.sort[table].dir === 'asc' ? '↑' : '↓' : ''; },
        coefficient(value) { return value == null ? '—' : Number(value).toFixed(2); },
        interval(row) { return row.betaCiLowPer0_1Grs == null || row.betaCiHighPer0_1Grs == null ? '—' : `${this.coefficient(row.betaCiLowPer0_1Grs)}–${this.coefficient(row.betaCiHighPer0_1Grs)}`; },
        statistic: formatStatistic,
        sourceLabel(key) { return this.sources.find(row => row.key === key)?.label || key; },
        diseaseUrl(row) {
            if (row.source === 'orphanet') return `https://www.orpha.net/en/disease/detail/${String(row.referenceId || row.code).replace('ORPHA:', '')}`;
            if (row.source === 'omim') return `https://omim.org/entry/${String(row.referenceId || row.code).replace('OMIM:', '')}`;
            if (row.source === 'decipher') return 'https://www.deciphergenomics.org/ddd/ddgenes';
            return 'https://www.ebi.ac.uk/gene2phenotype/';
        },
        exportSamples() {
            const quote = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
            const rows = [['Sample', ...(this.multiple ? ['Phenotype match count', 'Matched HPO IDs'] : []), 'Other recorded phenotypes', 'Age', 'Sex', 'Project', 'Investigator', 'Affected', 'rPheRS Z-score'],
                ...this.sortedSamples.map(row => [row.id, ...(this.multiple ? [row.matchedCount, this.activeIds.filter(id => row.terms.includes(id)).join('; ')] : []), this.sampleOtherTerms(row).map(this.name).join('; '), row.age, row.sex, row.project, row.investigator, row.affected, row.z])];
            const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(quote).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
            const link = document.createElement('a'); link.href = url; link.download = `phenotype-${this.activeIds.map(id => id.replace(':', '-')).join('_')}-samples.csv`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
    },
};
</script>
<style src="./singlePhenotypeResults.css"></style>
