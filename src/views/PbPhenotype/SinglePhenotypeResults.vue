<template>
    <div class="pbs-results" :class="{ 'pbs-multi': multiple }">
        <section class="pbp-card pbs-summary" aria-labelledby="pbs-summary-title">
            <div class="pbp-rowhead"><h2 id="pbs-summary-title"><strong>{{ ready ? number(total) : '—' }} samples</strong> match in CRDC</h2><span :class="multiple ? 'pbs-match-label' : 'pbs-muted'">{{ multiple ? matchLabel : `${name(hpo)} · includes more specific terms` }}</span></div>
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

        <section v-show="(!error || ready) && (!ready || total > 0)" class="pbp-card" aria-labelledby="pbs-projects-title">
            <div class="pbp-rowhead"><h2 id="pbs-projects-title">Projects with matching samples</h2><span class="pbs-muted">{{ projects.length }} projects · who to contact for these {{ number(total) }} samples</span></div>
            <div class="pbs-table-wrap"><table class="pbs-table pbs-projects"><thead><tr>
                <th class="pbs-pin-column"><b-icon-pin-angle aria-label="Pin project"/></th><th><button class="pbp-sort" @click="sortBy('projects', 'name')">Project / Investigator {{ indicator('projects', 'name') }}</button></th>
                <th><button class="pbp-sort" @click="sortBy('projects', 'total')">Matching samples {{ indicator('projects', 'total') }}</button></th>
                <th><button class="pbp-sort" @click="sortBy('projects', 'affected')">Affected · Yes / No {{ indicator('projects', 'affected') }}</button></th>
                <th><button class="pbp-sort" @click="sortBy('projects', 'medianAge')">Age · median (Q1–Q3) {{ indicator('projects', 'medianAge') }}</button></th>
                <th><button class="pbp-sort" @click="sortBy('projects', 'sex')">Sex · F / M {{ indicator('projects', 'sex') }}</button></th><th><button class="pbp-sort" @click="sortBy('projects', 'meanResidualPhers')">Mean rPheRS Z-score {{ indicator('projects', 'meanResidualPhers') }}</button></th>
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
                        <div><h3>Also recorded in this project</h3><phenotype-count-table :rows="page('projectTerms', projectTerms, 5)" :terms="terms" :total="project.total"/><result-pagination arrows-only :page="pages.projectTerms" :total="projectTerms.length" :size="5" label="project phenotypes" @change="pages.projectTerms = $event"/></div>
                    </div></td></tr>
                </template>
                <tr v-if="ready && !projects.length"><td colspan="7">No matching projects.</td></tr>
            </tbody></table></div>
            <result-pagination :page="pages.projects" :total="unpinnedProjects.length" :size="5" label="projects" @change="pages.projects = $event"/>
        </section>

        <section v-show="(!error || ready) && (!ready || total > 0)" class="pbp-card" aria-labelledby="pbs-people-title">
            <div class="pbp-rowhead"><h2 id="pbs-people-title">Who the {{ ready ? number(total) : '—' }} matching samples are</h2></div>
            <p v-if="multiple" class="pbs-match-context">{{ matchLabel }} · all counts and “These samples” percentages below use these {{ number(total) }} matching samples.</p>
            <div class="pbs-people-grid">
                <div><h3>Age</h3><div v-for="bin in ages" :key="bin.label" class="pbs-distribution"><span>{{ bin.label }}</span><b>{{ number(bin.count) }}</b><div class="pbs-track"><span :style="{ width: `${bin.width}%` }"></span></div></div></div>
                <div><h3>Sex</h3><div v-for="bin in sexes" :key="bin.label" class="pbs-distribution"><span>{{ bin.label }}</span><b>{{ number(bin.count) }}</b><div class="pbs-track"><span :style="{ width: `${bin.width}%` }"></span></div></div><h3 class="pbs-affected-heading">Affected</h3><div v-for="bin in affected" :key="bin.label" class="pbs-distribution"><span>{{ bin.label }}</span><b>{{ number(bin.count) }}</b><div class="pbs-track"><span :style="{ width: `${bin.width}%` }"></span></div></div></div>

                <div><div class="pbs-table-wrap"><table class="pbs-table pbs-coterms"><thead><tr><th><button class="pbp-sort" @click="sortBy('terms', 'phenotype')">Phenotype {{ indicator('terms', 'phenotype') }}</button></th><th><button class="pbp-sort" @click="sortBy('terms', 'count')">These samples (%) {{ indicator('terms', 'count') }}</button></th><th><button class="pbp-sort" @click="sortBy('terms', 'all')">All CRDC (%) {{ indicator('terms', 'all') }}</button></th><th><button class="pbp-sort" @click="sortBy('terms', 'count')">Require {{ indicator('terms', 'count') }}</button></th><th><button class="pbp-sort" @click="sortBy('terms', 'exclude')">Exclude {{ indicator('terms', 'exclude') }}</button></th></tr></thead><tbody>
                    <tr v-for="item in page('terms', sortedCoTerms, 5)" :key="item.id"><td>{{ name(item.id) }}<small v-if="multiple && underTerms(item.id).length" class="pbs-under-terms" v-result-tooltip="'HPO subtype relationship. Counts and percentages use the complete matching sample group, not one input phenotype alone.'">Subtype of <span v-for="id in underTerms(item.id)" :key="id"><b-icon-square-fill :style="{color: queryColor(id)}" aria-hidden="true"/> {{ name(id) }} </span></small></td><td><b>{{ percent(item.count, total) }}</b></td><td class="pbs-muted">{{ allPercent(item.id) }}</td><td><refine-button :disabled="!searchableHpo(item.id)" :id="item.id" :name="name(item.id)" :count="item.count" @choose="$emit('require', $event)"/></td><td><refine-button exclude :disabled="!searchableHpo(item.id)" :id="item.id" :name="name(item.id)" :count="total - item.count" @choose="$emit('exclude', $event)"/></td></tr>
                    <tr v-if="ready && !coTerms.length"><td colspan="5">No other recorded phenotypes.</td></tr>
                </tbody></table></div><result-pagination :page="pages.terms" :total="coTerms.length" :size="5" label="phenotypes" @change="pages.terms = $event"/></div>
            </div>
        </section>

        <section v-show="(!error || ready) && (!ready || total > 0)" class="pbp-card" aria-labelledby="pbs-samples-title">
            <div class="pbp-rowhead"><h2 id="pbs-samples-title">Matching samples <span class="pbs-muted">· {{ ready ? number(total) : '—' }}</span></h2><div class="pbs-actions"><button type="button" class="pbp-btn" :disabled="!ready || !filteredSamples.length" @click="copySamples">Copy sample IDs</button><button type="button" class="pbp-btn" :disabled="!ready || !filteredSamples.length" @click="exportSamples">Export table</button></div></div>
            <p v-if="sampleProjectFilter !== null" class="pbs-filter-caption" role="status">Project filter: {{ number(filteredSamples.length) }} of {{ number(total) }} matching samples <button type="button" class="pbs-link" @click="sampleProjectFilter = null">Clear filter</button></p>
            <p v-if="copyStatus" role="status" class="pbs-muted">{{ copyStatus }}</p>
            <div class="pbs-table-wrap"><table class="pbs-table pbs-samples" :class="{ 'pbs-profile-samples': multiple }"><thead><tr><th class="pbs-pin-column"><b-icon-pin-angle aria-label="Pin sample"/></th><th><button class="pbp-sort" @click="sortBy('samples', 'sample')">Sample {{ indicator('samples', 'sample') }}</button></th><th v-if="multiple"><button class="pbp-sort" v-result-tooltip="'Number of included phenotypes matched / total included phenotypes. Matches include more specific recorded HPO terms.'" @click="sortBy('samples', 'matched')">Phenotype match {{ indicator('samples', 'matched') }}</button></th><th v-if="multiple"><button class="pbp-sort" v-result-tooltip="zHelp" @click="sortBy('samples', 'z')">rPheRS Z-score {{ indicator('samples', 'z') }}</button></th><th><button class="pbp-sort" @click="sortBy('samples', 'phenotypes')">Other recorded phenotypes {{ indicator('samples', 'phenotypes') }}</button></th><th><button class="pbp-sort" @click="sortBy('samples', 'age')">Age · sex {{ indicator('samples', 'age') }}</button></th><th><project-table-filter v-model="sampleProjectFilter" :options="sampleProjectOptions" :sort-direction="sort.samples.key === 'project' ? sort.samples.dir : ''" @sort="sortSampleProjects"/></th><th><button class="pbp-sort" @click="sortBy('samples', 'affected')">Affected {{ indicator('samples', 'affected') }}</button></th><th v-if="!multiple"><button class="pbp-sort" v-result-tooltip="zHelp" @click="sortBy('samples', 'z')">rPheRS Z-score {{ indicator('samples', 'z') }}</button></th></tr></thead><tbody>
                <template v-for="sample in displaySamples">
                <tr v-if="pinnedSamples.length && sample.id === displaySamples[0].id" :key="sample.id + '-pinned-heading'" class="pbs-pinned-heading"><td :colspan="multiple ? 8 : 7">Pinned samples · {{ pinnedSamples.length }}</td></tr>
                <tr v-if="pinnedSamples.length && sample.id === currentSamples[0]?.id" :key="sample.id + '-page-heading'" class="pbs-page-heading"><td :colspan="multiple ? 8 : 7">Current page results</td></tr>
                <tr :key="sample.id" :class="{ 'pbs-pinned-row': isPinned('samples', sample.id) }"><td class="pbs-pin-column"><button type="button" class="pbs-pin" :aria-pressed="String(isPinned('samples', sample.id))" :aria-label="(isPinned('samples', sample.id) ? 'Unpin sample ' : 'Pin sample ') + sample.id" v-result-tooltip="'Keep this sample visible across pages and sorting'" @click="togglePin('samples', sample.id)"><b-icon-pin-angle-fill v-if="isPinned('samples', sample.id)"/><b-icon-pin-angle v-else/></button></td><td><a :href="`/pb_sample.html?query=${encodeURIComponent(sample.id)}`">{{ sample.id }}</a></td><td v-if="multiple"><query-match-markers :ids="activeIds" :matched="activeIds.map(id => sample.terms.includes(id))" :name="name" :term-style="termStyle"/><span class="pbs-match-count">{{ sample.matchedCount }}/{{ activeIds.length }}</span></td><td v-if="multiple">{{ score(sample.z) }}</td><td><span v-for="id in sampleOtherTerms(sample).slice(0, 2)" :key="id" class="pbs-term-pill">{{ name(id) }}</span><details v-if="sampleOtherTerms(sample).length > 2" class="pbs-more-terms"><summary>+{{ sampleOtherTerms(sample).length - 2 }} more</summary><span v-for="id in sampleOtherTerms(sample).slice(2)" :key="id" class="pbs-term-pill">{{ name(id) }}</span></details><span v-if="!sampleOtherTerms(sample).length" class="pbs-muted">—</span></td><td>{{ age(sample.age) }} · {{ sample.sex }}</td><td>{{ sample.project }}<small v-if="sample.investigator">{{ sample.investigator }}</small></td><td>{{ sample.affected === 'Y' ? 'Yes' : sample.affected === 'N' ? 'No' : 'Unknown' }}</td><td v-if="!multiple">{{ score(sample.z) }}</td></tr>
                </template>
                <tr v-if="ready && !filteredSamples.length"><td :colspan="multiple ? 8 : 7">{{ total ? 'No samples in the selected projects.' : 'No matching samples.' }}</td></tr>
            </tbody></table></div><result-pagination :page="pages.samples" :total="unpinnedSamples.length" :size="5" label="samples" @change="pages.samples = $event"/>
        </section>

        <section v-if="!multiple" v-show="(!error || ready) && (!ready || total > 0)" class="pbp-card" aria-labelledby="pbs-genes-title">
            <div class="pbp-rowhead"><h2 id="pbs-genes-title">Single-gene burden results for {{ name(hpo) }} <button type="button" class="pbs-info" :aria-expanded="String(methodsOpen)" aria-controls="pbs-methods" aria-label="Single-gene burden methods" @click="methodsOpen = !methodsOpen"><b-icon-info-circle aria-hidden="true"/></button></h2><span class="pbs-muted">Precomputed · {{ number(deliveredGenes.length) }} genes at P &lt; 0.05</span></div>
            <div class="pbs-gene-controls"><span>{{ hpo }} · all-gene analysis</span><label>Show <select v-model="geneFilter" aria-label="Gene significance filter"><option value="p">P &lt; 0.05</option><option value="q">q &lt; 0.05</option></select></label></div>
            <div v-if="methodsOpen" id="pbs-methods" class="pbs-methods"><p>The original analysis fitted one binary-HPO null model per HPO and tested each gene's Sum GRS against that HPO. This table retrieves those existing results by HPO. Both positive and negative effects are retained; no model or q-value is recalculated.</p><p>β summarizes the association per 0.1 increase in Sum GRS. GRS is the gene-level genetic risk score: the sum of ALT allele dosage multiplied by the variant pathogenicity score. Higher Sum GRS indicates greater scored variant burden in that gene. q uses the original BH adjustment across PASS genes within this HPO (q_by_hpo), before the P &lt; 0.05 delivery filter. Gene pages query the same pairs by gene and display q_by_gene instead. The precomputed model uses {{ analysisN || 'its original' }} eligible samples.</p><p>Carrier = Sum GRS &gt; 0 in the original burden-analysis inputs. Gene carriers with phenotype counts samples that both have this phenotype and carry a positive Sum GRS for this gene, within that same analysis cohort. Stored β, CI, p and q are unchanged.</p></div>
            <p v-if="geneLoading" role="status" class="pbs-muted">Loading precomputed results…</p><p v-if="geneError" role="alert">{{ geneError }} <button type="button" class="pbp-btn" @click="$emit('retry-genes')">Retry</button></p>
            <div class="pbs-table-wrap"><table class="pbs-table pbs-genes"><thead><tr>
                <th><button class="pbp-sort" @click="sortBy('genes', 'gene')">Gene {{ indicator('genes', 'gene') }}</button></th>
                <th><button class="pbp-sort" @click="sortBy('genes', 'beta')" v-result-tooltip="betaHelp">β {{ indicator('genes', 'beta') }}</button></th>
                <th><button class="pbp-sort" @click="sortBy('genes', 'ci')">95% CI {{ indicator('genes', 'ci') }}</button></th>
                <th><button class="pbp-sort" @click="sortBy('genes', 'p')">p {{ indicator('genes', 'p') }}</button></th>
                <th><button class="pbp-sort" @click="sortBy('genes', 'q')">q {{ indicator('genes', 'q') }}</button></th>
                <th><button class="pbp-sort" @click="sortBy('genes', 'withPhenotype')">Gene carriers with phenotype {{ indicator('genes', 'withPhenotype') }}</button><small>of {{ number(burdenCarriers.nCases) }}</small></th>
                <th><button class="pbp-sort" @click="sortBy('genes', 'allCarriers')">Gene carriers {{ indicator('genes', 'allCarriers') }}</button></th>
                <th><button class="pbp-sort" @click="sortBy('genes', 'disease')">Reference disease {{ indicator('genes', 'disease') }}</button></th>
            </tr></thead><tbody>
                <tr v-for="row in visibleGenes" :key="row.gene"><td><a :href="`/pb_gene2.html?query=${encodeURIComponent(row.gene)}`"><b>{{ row.gene }}</b></a></td><td>{{ coefficient(row.association.betaPer0_1Grs) }}</td><td>{{ interval(row.association) }}</td><td>{{ statistic(row.association.pValue) }}</td><td :class="{ 'pbs-q': row.association.qValue != null && row.association.qValue < 0.05 }">{{ statistic(row.association.qValue) }}</td><td>{{ carrierLabel(row.gene, true) }}</td><td>{{ carrierLabel(row.gene, false) }}</td><td><template v-if="row.diseases.length"><a v-for="disease in row.diseases" :key="disease.key" :href="diseaseUrl(disease)" target="_blank" rel="noopener noreferrer" class="pbs-reference"><span class="pbp-reference-badge" :class="disease.source">{{ sourceLabel(disease.source) }}</span> {{ disease.name }}</a></template><span v-else class="pbs-muted">None linked</span></td></tr>
                <tr v-if="!geneLoading && !geneError && !filteredGenes.length"><td colspan="8">No precomputed associations match this significance filter.</td></tr>
            </tbody></table></div><result-pagination :page="pages.genes" :total="filteredGenes.length" :size="5" label="genes" @change="pages.genes = $event"/><small v-if="analysisN" class="pbs-carrier-coverage">Analysis N: {{ analysisN }} · original single-gene burden-analysis cohort</small>
        </section>

        <section v-else v-show="(!error || ready) && (!ready || total > 0)" class="pbp-card" aria-labelledby="pbs-profile-genes-title">
            <div class="pbp-rowhead"><h2 id="pbs-profile-genes-title">Genes carried more often by the matching samples <button type="button" class="pbs-info" v-result-tooltip="comparisonHelp" aria-label="About this gene comparison"><b-icon-info-circle aria-hidden="true"/></button></h2><span class="pbs-muted">{{ multiGeneResult ? number(multiGeneResult.nCompared) : '—' }} genes compared</span></div>
            <div class="pbs-gene-band"><span class="pbs-group pbs-have">{{ number(total) }} match</span><span>vs</span><span class="pbs-group pbs-rest">{{ number(rest) }} do not</span><span class="pbs-band-explanation">Do the matching samples carry scored variants in this gene more often?</span><b class="pbs-precomputed pbs-counted">Counted for this search</b></div>
            <p v-if="multiGeneLoading" role="status" class="pbs-muted">Comparing carrier counts…</p><p v-if="multiGeneError" role="alert">{{ multiGeneError }} <button type="button" class="pbp-btn" @click="$emit('retry-comparison')">Retry</button></p>
            <div class="pbs-table-wrap"><table class="pbs-table pbs-profile-genes"><thead><tr>
                <th><button class="pbp-sort" @click="sortBy('profileGenes','gene')">Gene {{ indicator('profileGenes','gene') }}</button></th>
                <th><button class="pbp-sort" @click="sortBy('profileGenes','matching')">Carriers among the {{ number(total) }} {{ indicator('profileGenes','matching') }}</button><small>matching samples</small></th>
                <th><button class="pbp-sort" @click="sortBy('profileGenes','other')">Carriers among the {{ number(rest) }} {{ indicator('profileGenes','other') }}</button><small>everyone else</small></th>
                <th><button class="pbp-sort" @click="sortBy('profileGenes','ratio')">How much more often {{ indicator('profileGenes','ratio') }}</button></th>
                <th><button class="pbp-sort" @click="sortBy('profileGenes','p')">p {{ indicator('profileGenes','p') }}</button><small>unadjusted</small></th>
                <th>Which of your phenotypes the carriers have</th><th>Reference disease</th>
            </tr></thead><tbody>
                <tr v-for="row in page('profileGenes', sortedProfileGenes, 5)" :key="row.gene"><td><a :href="`/pb_gene2.html?query=${encodeURIComponent(row.gene)}`"><b>{{ row.gene }}</b></a></td><td>{{ number(row.matchingCarriers) }} · {{ carrierPercent(row.matchingCarriers, multiGeneResult.matchingCoveredCount) }}</td><td>{{ number(row.comparisonCarriers) }} · {{ carrierPercent(row.comparisonCarriers, multiGeneResult.otherCoveredCount) }}</td><td><b>{{ row.ratio == null ? '—' : `${Number(row.ratio.toFixed(1))}×` }}</b></td><td>{{ statistic(row.pValue) }}</td><td><span v-for="(id,index) in activeIds.filter((id,index) => row.queryCarrierCounts[index] > 0)" :key="id" class="pbs-term-pill"><b-icon-square-fill :style="{color:queryColor(id)}" aria-hidden="true"/> {{ name(id) }} {{ row.queryCarrierCounts[activeIds.indexOf(id)] }} of {{ row.matchingCarriers }}</span></td><td><template v-if="row.diseases.length"><a v-for="disease in row.diseases" :key="disease.key" class="pbs-reference" :href="diseaseUrl(disease)" target="_blank" rel="noopener noreferrer"><span class="pbp-reference-badge" :class="disease.source">{{ sourceLabel(disease.source) }}</span> {{ disease.name }}</a></template><span v-else class="pbs-muted">None linked</span></td></tr>
                <tr v-if="!multiGeneLoading && !multiGeneError && !profileGenes.length"><td colspan="7">No genes are carried more often in the matching group with the available score coverage.</td></tr>
            </tbody></table></div><result-pagination :page="pages.profileGenes" :total="profileGenes.length" :size="5" label="profile genes" @change="pages.profileGenes = $event"/>
            <small v-if="multiGeneResult" class="pbs-carrier-coverage">GRS coverage: {{ number(multiGeneResult.matchingCoveredCount) }} / {{ number(total) }} matching samples and {{ number(multiGeneResult.otherCoveredCount) }} / {{ number(rest) }} everyone else. Percentages and comparisons use covered samples. Two-sided Fisher exact p; unadjusted for ancestry, project or family.</small>
        </section>

        <section v-show="!error || ready" class="pbp-card" aria-labelledby="pbs-diseases-title">
            <div class="pbp-rowhead"><h2 id="pbs-diseases-title">External diseases with {{ multiple ? 'similar phenotypes' : 'this phenotype' }}</h2><div class="pbs-source-tabs" aria-label="Disease source"><button v-for="item in sources" :key="item.key" type="button" class="pbp-btn" :class="{ active: source === item.key }" :aria-pressed="String(source === item.key)" @click="$emit('source', item.key)">{{ item.label }} · {{ item.count }}</button></div></div>
            <div class="pbs-disease-grid"><div><div class="pbs-table-wrap"><table class="pbs-table pbs-diseases"><thead><tr><th v-if="multiple" class="pbs-disease-rank">Rank</th><th>Disease</th><th>{{ multiple ? 'Your phenotypes matched' : 'How often it shows this phenotype' }}</th><th>Curated gene(s)</th></tr></thead><tbody>
                <tr v-for="disease in page('diseases', diseases, 5)" :key="disease.code"><td v-if="multiple">{{ disease.rank }}</td><td><a :href="diseaseUrl(disease)" target="_blank" rel="noopener noreferrer"><b>{{ disease.name }}</b></a><small>{{ disease.referenceId }}</small></td><td><template v-if="multiple"><query-match-markers :ids="activeIds" :matched="activeIds.map(id => disease.matchedIds.includes(id))" :name="name" :term-style="termStyle"/><span class="pbs-match-count">{{ disease.matchedIds.length }}/{{ activeIds.length }}</span></template><template v-else>{{ disease.frequency || '—' }}</template></td><td><template v-if="disease.genes.length"><template v-for="(gene, index) in disease.genes"><span v-if="index" :key="`${gene[0]}-comma`">, </span><a :key="gene[0]" :href="`/pb_gene2.html?query=${encodeURIComponent(gene[0])}`">{{ gene[0] }}</a></template></template><span v-else class="pbs-muted">—</span></td></tr>
                <tr v-if="!diseases.length"><td :colspan="multiple ? 4 : 3">No diseases linked in {{ sourceLabel(source) }}.</td></tr>
            </tbody></table></div><result-pagination :page="pages.diseases" :total="diseases.length" :size="5" label="diseases" @change="pages.diseases = $event"/><p class="pbs-muted">reference only, not a diagnosis</p></div>
            <div><h3>Phenotypes that would separate these diseases</h3><div class="pbs-table-wrap"><table class="pbs-table pbs-separators"><thead><tr><th>Phenotype</th><th>{{ multiple ? 'Top 10 diseases' : 'Diseases' }}</th><th>Matching samples</th><th>Require</th><th>Exclude</th></tr></thead><tbody>
                <tr v-for="item in page('separators', separators, 5)" :key="item.id"><td>{{ name(item.id) }}</td><td><b>{{ item.count }} of {{ item.total }}</b></td><td>{{ number(separatorSampleCount(item.id)) }}</td><td><refine-button :disabled="!searchableHpo(item.id)" :id="item.id" :name="name(item.id)" :count="separatorSampleCount(item.id)" @choose="$emit('require', $event)"/></td><td><refine-button exclude :disabled="!searchableHpo(item.id)" :id="item.id" :name="name(item.id)" :count="separatorSampleCount(item.id) == null ? null : total - separatorSampleCount(item.id)" @choose="$emit('exclude', $event)"/></td></tr>
                <tr v-if="!separators.length"><td colspan="5">No separating phenotypes for this disease set.</td></tr>
            </tbody></table></div><result-pagination :page="pages.separators" :total="separators.length" :size="5" label="separating phenotypes" @change="pages.separators = $event"/></div></div>
        </section>
    </div>
</template>
<script>
import ResultPagination from './ResultPagination.vue';
import resultTooltip from './resultTooltip';
import { describeMatchingRule } from './matchingRule';
import ProjectTableFilter from './ProjectTableFilter.vue';
import { AGE_BANDS, formatStatistic, sortTableRows } from './phenotypeModel';
import { ancestorsOf, recordedTerms, separatingTerms, summarizeProjects, distribution, pageRows, sortSamples, splitPinnedRows, matchingCombinations, filterSampleProjects } from './singlePhenotypeModel';
import RefineButton from './RefineButton.vue';
import QueryMatchMarkers from './QueryMatchMarkers.vue';
import PhenotypeCountTable from './PhenotypeCountTable.vue';
import { burdenCarrierCounts } from './singleBurdenCarriers';
export default {
    name: 'SinglePhenotypeResults',
    directives: { resultTooltip },
    components: { ProjectTableFilter, ResultPagination, RefineButton, PhenotypeCountTable, QueryMatchMarkers },
    props: {
        profileIds: { type: Array, default: () => [] }, matchMode: String, minimum: Number, termStyle: Function, multiGeneResult: Object, multiGeneLoading: Boolean, multiGeneError: String,
        hpo: String, terms: Object, samples: Array, cohortCount: Number, counts: Object,
        ready: Boolean, loading: Boolean, error: String, geneRows: Array, geneLoading: Boolean,
        geneError: String, geneRelease: Object, diseases: Array, sources: Array, source: String,
    },
    data() { return ({
        pages: { combinations: 1, profileGenes: 1, projects: 1, projectTerms: 1, terms: 1, samples: 1, genes: 1, diseases: 1, separators: 1 },
        sort: { profileGenes: { key: 'p', dir: 'asc' }, terms: { key: 'count', dir: 'desc' }, projects: { key: 'total', dir: 'desc' }, samples: { key: this.profileIds.length > 1 ? 'z' : 'project', dir: this.profileIds.length > 1 ? 'desc' : 'asc' }, genes: { key: 'p', dir: 'asc' } },
        sampleProjectFilter: null, expanded: '', methodsOpen: false, copyStatus: '', pinned: { projects: [], samples: [] }, geneFilter: 'p',
    }); },
    computed: {
        activeIds() { return this.profileIds.length ? this.profileIds : [this.hpo]; },
        multiple() { return this.activeIds.length > 1; },
        matchingRule() { return describeMatchingRule(this.matchMode, this.minimum, this.activeIds.length); },
        matchLabel() { return `${this.matchingRule.label} · ${this.matchingRule.short}`; },
        cohortBarStyle() { return { gridTemplateColumns: !this.total || !this.rest ? 'minmax(0, 1fr)' : `${Math.max(12, Math.min(88, this.total / this.cohortCount * 100))}% minmax(0, 1fr)` }; },
        combinations() { return matchingCombinations(this.samples, this.activeIds); },
        betaHelp() { return 'β per 0.1 GRS summarizes how the gene burden is associated with this phenotype. Positive β indicates higher scored burden is associated with the phenotype being recorded more often; negative β indicates less often. GRS is the gene-level genetic risk score. Sum GRS adds ALT allele dosage × pathogenicity score across variants in a gene: 1 for LoFTEE high-confidence loss of function, otherwise the available AlphaMissense score.'; },
        zHelp() { return 'rPheRS Z-score: the sample residual phenotype score standardized using the full scoring cohort mean and sample SD for this HPO profile. Missing scores display —. Filtering and pagination do not change this reference.'; },
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
        coTerms() { return recordedTerms(this.samples, this.activeIds, this.terms); },
        sortedCoTerms() { return sortTableRows(this.coTerms, this.sort.terms, { phenotype: row => this.name(row.id), count: row => row.count, all: row => this.counts?.[row.id] ?? null, exclude: row => this.total - row.count }); },
        termCounts() { return Object.fromEntries(this.coTerms.map(row => [row.id, row.count])); },
        projectSamples() { return this.samples.filter(row => row.project === this.expanded); },
        projectAges() { return this.ageDistribution(this.projectSamples); },
        projectTerms() { return recordedTerms(this.projectSamples, this.activeIds, this.terms); },
        sampleProjectOptions() { return this.projects.map(row => ({ name: row.name, count: row.total, investigators: row.investigators.join(', ') })).sort((a,b) => a.name.localeCompare(b.name)); },
        filteredSamples() { return filterSampleProjects(this.samples, this.sampleProjectFilter); },
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
        separators() { return separatingTerms(this.multiple ? this.diseases.slice(0,10) : this.diseases, this.activeIds, this.terms); },
        omitTerms() { const omit = new Set(); this.activeIds.forEach(id => { omit.add(id); ancestorsOf(id, this.terms).forEach(parent => omit.add(parent)); }); return omit; },
    },
    watch: { sampleProjectFilter() { this.pages.samples = 1; this.copyStatus = ''; }, samples() { this.pages.samples = 1; this.pages.projects = 1; this.pages.terms = 1; this.pages.combinations = 1; }, multiGeneResult() { this.pages.profileGenes = 1; }, geneFilter() { this.pages.genes = 1; }, source() { this.pages.diseases = 1; this.pages.separators = 1; }, expanded() { this.pages.projectTerms = 1; } },
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
        sortBy(table, key) { const old = this.sort[table]; this.$set(this.sort, table, { key, dir: old.key === key ? old.dir === 'asc' ? 'desc' : 'asc' : ['total', 'affected', 'z', 'meanResidualPhers', 'count', 'all', 'exclude', 'matched', 'matching', 'other', 'ratio'].includes(key) ? 'desc' : 'asc' }); this.pages[table] = 1; },
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
        async copySamples() {
            try { await navigator.clipboard.writeText(this.sortedSamples.map(row => row.id).join('\n')); this.copyStatus = `Copied ${this.number(this.sortedSamples.length)} sample IDs.`; }
            catch (_) { this.copyStatus = 'Copy unavailable. Export the table to save sample IDs.'; }
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
