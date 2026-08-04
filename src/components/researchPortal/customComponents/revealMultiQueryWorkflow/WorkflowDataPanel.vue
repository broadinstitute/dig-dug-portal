<template>
    <div style="display:flex; flex-direction: column; gap: 12px; color: #555;">
                            <!-- Live data-fetch progress (text-query hybrid + genes-first). -->
                            <div
                                v-if="showFetchProgress"
                                class="mb-2"
                            >
                                <div
                                    class="d-flex align-items-center"
                                    style="gap: 5px; cursor: pointer; user-select: none;"
                                    role="button"
                                    :aria-expanded="fetchProgressExpanded ? 'true' : 'false'"
                                    @click="toggleFetchProgress"
                                >
                                    <b-spinner v-if="isDataFetchActive" small></b-spinner>
                                    <span v-else>{{ fetchProgressExpanded ? "▼" : "▶" }}</span>
                                    <span style="font-weight:bold">{{ fetchProgressHeaderTitle }}</span>
                                    <span
                                        v-if="fetchProgressHeaderTime"
                                        class="text-muted small"
                                    >{{ fetchProgressHeaderTime }}</span>
                                </div>
                                <div
                                    v-show="fetchProgressExpanded"
                                    class="mt-1"
                                >
                                    <div
                                        v-for="step in revealDataSteps"
                                        :key="'reveal-data-' + step.id"
                                        class="status mb-2"
                                    >
                                        <div class="sub-status" style="display:flex; flex-direction: column; padding-left: 18px;">
                                            <div
                                                v-for="(substep, ii) in (step.substeps || [])"
                                                :key="'ds-' + step.id + '-' + (substep && substep.id != null ? substep.id : ii) + '-' + ii"
                                                class="mb-2"
                                            >
                                                <div class="small font-weight-bold mb-1">{{ substep.title }}</div>
                                                <div
                                                    v-if="substep.result && (substep.result.title || (substep.id !== '2.h2' && substep.result.result != null))"
                                                    style="padding-left: 8px;"
                                                >
                                                    <div
                                                        v-if="substep.result.title"
                                                        class="small text-muted"
                                                        style="white-space: pre-line; line-height: 1.4;"
                                                    >{{ substep.result.title }}</div>
                                                    <pre
                                                        v-if="substep.id !== '2.h2' && substep.result.result != null"
                                                        style="background: #eee; padding: 10px; max-height: 160px; resize:vertical; overflow: auto;"
                                                    >{{ substep.result.result }}</pre>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        v-if="loadStatus"
                                        class="load-indicator d-flex align-items-center mb-1"
                                        style="gap: 8px; padding-left: 18px;"
                                    >
                                        <b-spinner
                                            v-if="showLoadStatusSpinner"
                                            small
                                        ></b-spinner>
                                        <span :class="loadComplete ? 'text-success' : 'text-muted'">
                                            {{ loadStatus }}{{ loadStepSeconds > 0 ? ' (' + loadStepSeconds + 's)' : '' }}
                                        </span>
                                    </div>
                                    <div
                                        v-if="geneEntryLoading && geneEntryProgress && geneEntryProgress.detail"
                                        class="small text-muted"
                                        style="white-space: pre-line; line-height: 1.4; padding-left: 18px;"
                                    >
                                        {{ geneEntryProgress.detail }}
                                    </div>
                                </div>
                            </div>

                            <div v-if="showFactorTable">
                                <workflow-step-gate
                                    v-if="gateActive && gateStepId === '2'"
                                    @continue="$emit('approve-gate')"
                                >
                                    <template v-if="showResearchIntention">
                                        Gene-derived evidence is ready. Review phenotypes, gene-set clusters, and genes below.
                                        Optionally add a research intention, then hit Continue.
                                        REVEAL will generate mechanistic hypotheses using the data.
                                    </template>
                                    <template v-else>
                                        Knowledge graph is ready. Please review the phenotypes, genes and gene sets retrieved with the search terms and research context.
                                        Select / unselect phenotypes x gene set cluster families if necessary. Please hit Continue button.
                                        REVEAL will generate mechanistic hypotheses using the data.
                                    </template>
                                    <template v-if="showResearchIntention" v-slot:extra>
                                        <label class="small font-weight-bold mb-1 d-block reveal-gate-text">
                                            Research intention (optional)
                                        </label>
                                        <textarea
                                            class="form-control form-control-sm"
                                            :value="researchIntention"
                                            rows="3"
                                            style="min-height: 5em; resize: vertical;"
                                            placeholder="Describe what you want to learn or hypothesize about these genes…"
                                            @input="$emit('update:researchIntention', $event.target.value)"
                                        ></textarea>
                                        <div class="small mt-1 reveal-gate-text" style="opacity: 0.9;">
                                            Used as research context when generating mechanistic hypotheses.
                                        </div>
                                    </template>
                                </workflow-step-gate>
                                <div class="mb-1">
                                    <div class="flex-grow-1">
                                        <div class="font-weight-bold mb-2" style="color: #FF6600; font-size: 1.2em;">
                                            Selected {{ phenotypeCount }} phenotype{{ phenotypeCount !== 1 ? 's' : '' }} and {{ factorCount }} gene set cluster{{ factorCount !== 1 ? 's' : '' }} relevant to research context.
                                        </div>
                                        <ul v-if="hybridSearchMetaSummaryLines.length" class="mb-2 pl-3 text-secondary small">
                                            <li v-for="(line, idx) in hybridSearchMetaSummaryLines" :key="`hybrid-meta-${idx}`">{{ line }}</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        <div v-if="showFactorTable">
                            <!--
                            <div class="section-header d-flex justify-content-between align-items-start mb-2" @click="display_phenotypes_factors = !display_phenotypes_factors">
                                <div class="d-flex flex-column gap-2" style="max-width: calc(100% - 100px);">
                                    <div class="d-flex flex-wrap align-items-baseline gap-2">
                                        <strong>Phenotype:</strong>
                                        <span class="pill" v-for="p in phenotypeList" :key="p">{{ helpers.getPhenotypeDisplay(p) }}</span>
                                    </div>
                                    <div class="d-flex flex-wrap align-items-baseline gap-2">
                                        <strong>Factors:</strong>
                                        <span class="pill" v-for="f in factorLabelsListDisplay" :key="f">{{ f }}</span>
                                    </div>
                                </div>
                                <span class="small text-muted">{{ display_phenotypes_factors ? 'show less' : 'show more' }}</span>
                            </div>
                            -->
                            <div class="criteria-detail">
                            <div class="mt-2">
                                <div class="mb-4" style="margin-top:20px;">
                                    <slot name="data-viz" />
                                </div>
                                    <!-- Phenotype path: Selected Rationale (text-query only; hidden on genes-first) -->
                                    <div
                                        v-if="isPhenotypePath && !isGeneEntryMode && phenotypeRationaleList.length"
                                        class="mb-3"
                                    >
                                        <div class="font-weight-bold small text-muted mb-2">Selected Rationale</div>
                                        <ul class="list-unstyled small text-muted mb-0">
                                            <li v-for="item in phenotypeRationaleList" :key="item.phenotype" class="mb-2">
                                                <strong>{{ helpers.getPhenotypeDisplay(item.phenotype) }}:</strong> {{ item.rationale }}
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="d-flex justify-content-end mb-2">
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
                                            @click="$emit('download-raw-json')"
                                        >
                                            <b-icon icon="download" class="mr-1" aria-hidden="true" />
                                            Raw data
                                        </button>
                                    </div>
                                    <div class="reveal-factor-table-wrap">
                                        <!-- Phenotype path: custom table, no rationale column (text-query only) -->
                                        <b-table-simple v-if="isPhenotypePath && !isGeneEntryMode" small striped hover class="mb-0">
                                            <thead variant="light">
                                                <tr>
                                                    <th style="width: 72px;">Included</th>
                                                    <th style="width: auto;">Phenotype</th>
                                                    <th style="width: auto;">Fetch direction</th>
                                                    <th style="width: 120px;">Number of gene sets</th>
                                                    <th style="width: 110px;">Number of genes</th>
                                                    <!--<th style="width: auto;">Top gene sets</th>-->
                                                    <th style="width: 300px;">Genes and gene sets in cluster</th>
                                                </tr>
                                            </thead>
                                            <tbody v-for="row in mainFactorTableRowsPaged" :key="helpers.getRowKey(row)">
                                                <tr>
                                                    <td>
                                                        <div class="text-center">
                                                    <input
                                                        type="checkbox"
                                                        :checked="helpers.isPairIncluded(row)"
                                                        class="form-check-input d-inline-block"
                                                        aria-label="Included"
                                                        @change="$emit('pair-included-toggle', row, $event.target.checked)"
                                                    />
                                                        </div>
                                                    </td>
                                                    <td>{{ helpers.getPhenotypeDisplay(row.phenotype) }}</td>
                                                    <td>{{ helpers.getFetchDirectionDisplay(row) }}</td>
                                                    <td class="text-center">{{ helpers.getGeneSetCountForRow(row) }}</td>
                                                    <td class="text-center">
                                                        <template v-if="emphasizeSearchContextGenes">{{ helpers.getGeneSearchContextCountDisplay(row) }}</template>
                                                        <template v-else>{{ helpers.getGeneCountForRow(row) }}</template>
                                                    </td>
                                                    <!--
                                                    <td>
                                                        <div style="display:flex; flex-direction: column; gap: 3px">
                                                            <div v-for="(geneset, index) in row.top_gene_sets" class="small" style="display: flex; gap: 5px">
                                                                <span>{{ geneset }}</span>
                                                                <span>[{{ row.top_gene_set_programs[index] }}]</span>
                                                                <a role="button" v-if="row.top_gene_set_programs[index] === 'gtex'" @click="getProvenance(geneset, row.top_gene_set_programs[index])">info</a>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    -->
                                                    <td style="text-align: center;">
                                                        <button
                                                            class="btn btn-sm btn-outline-primary"
                                                            @click="$emit('toggle-factor-row', { item: row })"
                                                        >
                                                            {{ helpers.isFactorRowExpanded(row) ? 'Hide' : 'Show' }}
                                                        </button>
                                                    </td>
                                                </tr>
                                                <tr v-if="helpers.isFactorRowExpanded(row)">
                                                    <td colspan="6" class="p-0 border-0">
                                                        <div class="bg-light" style="display:flex; gap: 20px; flex-wrap: wrap;">
                                                            <div class="px-3 pt-2 pb-0 w-100">
                                                                <factor-base-reveal-network
                                                                    v-if="helpers.getFactorConnectivityNetwork(row) && helpers.getFactorConnectivityNetwork(row).nodes.length"
                                                                    :network="helpers.getFactorConnectivityNetwork(row)"
                                                                    :height="220"
                                                                    :show-popup-button="true"
                                                                    gene-node-metric-key="gwas_support"
                                                                    gene-color-by-gwas-support
                                                                    edge-distance-metric-key="functional_support"
                                                                    @open-popup="$emit('open-factor-connectivity', row)"
                                                                />
                                                            </div>
                                                            <div
                                                                v-if="showGeneSetSubtable && helpers.getGenesetForFactor(row.phenotype, row.factor, row.fetched_direction).length"
                                                                class="py-2 px-3"
                                                                style="display:flex; flex:1; flex-direction: column;"
                                                            >
                                                                <div v-if="!isGeneEntryMode" class="small text-muted mb-2">Gene sets in cluster</div>
                                                                <b-table
                                                                    striped
                                                                    hover
                                                                    small
                                                                    responsive="sm"
                                                                    head-variant="light"
                                                                    :items="helpers.getGenesetForFactor(row.phenotype, row.factor, row.fetched_direction)"
                                                                    :fields="geneSetSubtableFields"
                                                                    :per-page="subtablePerPage"
                                                                    :current-page="helpers.getGeneSetSubtableCurrentPage(row)"
                                                                >
                                                                    <template #cell(geneset)="gsRow">
                                                                        <a
                                                                            v-if="!isGeneEntryMode"
                                                                            :href="helpers.cfdeExploreAssociationHref(row.phenotype, gsRow.item.geneset, gsRow.item.program)"
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            class="cfde-explore-geneset-link reveal-soft-wrap-cell"
                                                                            :title="gsRow.item.geneset"
                                                                        >{{ softWrapAtUnderscore(gsRow.item.geneset) }}</a>
                                                                        <span
                                                                            v-else
                                                                            class="reveal-soft-wrap-cell"
                                                                            :title="gsRow.item.geneset"
                                                                        >{{ softWrapAtUnderscore(gsRow.item.geneset) }}</span>
                                                                    </template>
                                                                    <template #cell(actions)="gsRow">
                                                                        <button
                                                                            v-if="gsRow.item.program === 'gtex'"
                                                                            class="btn btn-sm btn-outline-primary"
                                                                            @click="$emit('gene-set-row-toggle', gsRow)"
                                                                        >
                                                                            {{ gsRow.detailsShowing ? 'Hide' : 'Show' }}
                                                                        </button>
                                                                    </template>  
                                                                    <template #row-details="gsRow">
                                                                        <div style="padding: 10px;">
                                                                            <div v-if="geneSetSources[gsRow.item.geneset]">
                                                                                <b-card>
                                                                                    <a :href="geneSetSources[gsRow.item.geneset].geneSetUrl" target="_blank">{{ geneSetSources[gsRow.item.geneset].geneSet }}</a>

                                                                                    <ul>
                                                                                        <li v-for="(rel, i) in geneSetSources[gsRow.item.geneset].relations" :key="i" class="text-muted small">
                                                                                            <div>
                                                                                                <strong>{{rel.method.predicate}}: </strong><a :href="rel.file.dcc_url" target="_blank">{{ rel.file.filename }}</a>
                                                                                            </div>
                                                                                            <div>
                                                                                                via 
                                                                                                <a :href="rel.method.script" target="_blank">{{ rel.method.type }}</a>
                                                                                                ({{ rel.method.direction }})
                                                                                            </div>
                                                                                        </li>
                                                                                    </ul>
                                                                                </b-card>
                                                                            </div>
                                                                            <div v-else>
                                                                                no data available yet.
                                                                            </div>
                                                                        </div>
                                                                    </template>  
                                                                </b-table>
                                                                <b-pagination
                                                                    v-if="helpers.getGenesetForFactor(row.phenotype, row.factor, row.fetched_direction).length > subtablePerPage"
                                                                    :value="subtableCurrentPages[helpers.getRowKey(row) + '|gs']"
                                                                    @input="$emit('update:subtable-page', { rowKey: helpers.getRowKey(row) + '|gs', page: $event })"
                                                                    class="pagination-sm justify-content-center mt-2"
                                                                    :total-rows="helpers.getGenesetForFactor(row.phenotype, row.factor, row.fetched_direction).length"
                                                                    :per-page="subtablePerPage"
                                                                />
                                                            </div>
                                                            <div v-if="showGeneSubtable" class="subtable-container py-2 px-3" style="flex:1">
                                                                <div v-if="loadingGenesForFactor[helpers.getRowKey(row)]" class="small text-muted mb-2">Loading genes…</div>
                                                                <div v-if="!isGeneEntryMode" class="small text-muted mb-2">Genes share membership with anchor gene(s)</div>
                                                                <b-table
                                                                    v-if="!loadingGenesForFactor[helpers.getRowKey(row)]"
                                                                    striped
                                                                    hover
                                                                    small
                                                                    responsive="sm"
                                                                    head-variant="light"
                                                                    :items="helpers.getGenesForFactor(row.phenotype, row.factor, row.fetched_direction)"
                                                                    :fields="geneSubtableFields"
                                                                    :per-page="subtablePerPage"
                                                                    :current-page="helpers.getSubtableCurrentPage(row)"
                                                                >
                                                                    <template #cell(gene)="gRow">
                                                                        <span :style="emphasizeSearchContextGenes && (gRow.item.inSearch || gRow.item.userRequested === 'Yes') ? { fontWeight: 700 } : { fontWeight: 400 }">
                                                                            {{ gRow.item.gene }}
                                                                        </span>
                                                                    </template>
                                                                    <template #cell(inSearch)="gRow">
                                                                        <span v-if="gRow.item.inSearch" class="text-success" aria-label="In search">✓</span>
                                                                        <span v-else class="text-muted">—</span>
                                                                    </template>
                                                                </b-table>
                                                                <b-pagination
                                                                    v-if="!loadingGenesForFactor[helpers.getRowKey(row)] && helpers.getGenesForFactor(row.phenotype, row.factor, row.fetched_direction).length > subtablePerPage"
                                                                    :value="subtableCurrentPages[helpers.getRowKey(row)]" @input="$emit('update:subtable-page', { rowKey: helpers.getRowKey(row), page: $event })"
                                                                    class="pagination-sm justify-content-center mt-2"
                                                                    :total-rows="helpers.getGenesForFactor(row.phenotype, row.factor, row.fetched_direction).length"
                                                                    :per-page="subtablePerPage"
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </b-table-simple>
                                        <!-- Association path: standard b-table, one rationale per row -->
                                        <b-table
                                            v-else
                                            :items="mainFactorTableRowsPaged"
                                            primary-key="_rowKey"
                                            :fields="mainAssociationTableFields"
                                            small
                                            striped
                                            hover
                                            head-variant="light"
                                        >
                                            <template #cell(included)="row">
                                                <div class="text-center">
                                                    <input
                                                        type="checkbox"
                                                        :checked="helpers.isPairIncluded(row.item)"
                                                        class="form-check-input d-inline-block"
                                                        aria-label="Included in selection"
                                                        @change="$emit('pair-included-toggle', row.item, $event.target.checked)"
                                                    />
                                                </div>
                                            </template>
                                            <template #cell(factor)="row">
                                                <span class="reveal-soft-wrap-cell">{{ softWrapAtUnderscore(helpers.getFactorClusterDisplay(row.item)) }}</span>
                                            </template>
                                            <template #cell(phenotype)="row">
                                                <span class="reveal-soft-wrap-cell">{{ softWrapAtUnderscore(helpers.getPhenotypeDisplay(row.item.phenotype)) }}</span>
                                            </template>
                                            <template #cell(fetchDirection)="row">
                                                {{ helpers.getFetchDirectionDisplay(row.item) }}
                                            </template>
                                            <template #cell(geneSetCount)="row">
                                                {{ helpers.getGeneSetCountForRow(row.item) }}
                                            </template>
                                            <template #cell(geneCount)="row">
                                                <template v-if="emphasizeSearchContextGenes">{{ helpers.getGeneSearchContextCountDisplay(row.item) }}</template>
                                                <template v-else>{{ helpers.getGeneCountForRow(row.item) }}</template>
                                            </template>
                                            <template #cell(top_gene_sets)="row">
                                                <span class="small">{{ row.item.top_gene_sets }}</span>
                                            </template>
                                            <template #cell(rationale)="row">
                                                <span v-if="row.item.rationale" class="small text-muted" style="white-space: normal;">{{ row.item.rationale }}</span>
                                                <span v-else class="small text-muted">—</span>
                                            </template>
                                            <template #cell(view_genes)="row">
                                                <button
                                                    class="btn btn-sm btn-outline-primary"
                                                    @click="$emit('toggle-factor-row', row)"
                                                >
                                                    {{ helpers.isFactorRowExpanded(row.item) ? 'Hide' : 'Show' }}
                                                </button>
                                            </template>
                                            <template #row-details="row">
                                                <div class="bg-light" style="display:flex; gap: 20px; flex-wrap: wrap;">
                                                    <div class="px-3 pt-2 pb-0 w-100">
                                                        <factor-base-reveal-network
                                                            v-if="helpers.getFactorConnectivityNetwork(row.item) && helpers.getFactorConnectivityNetwork(row.item).nodes.length"
                                                            :network="helpers.getFactorConnectivityNetwork(row.item)"
                                                            :height="220"
                                                            :show-popup-button="true"
                                                            gene-node-metric-key="gwas_support"
                                                            gene-color-by-gwas-support
                                                            edge-distance-metric-key="functional_support"
                                                            @open-popup="$emit('open-factor-connectivity', row.item)"
                                                        />
                                                    </div>
                                                    <div
                                                        v-if="showGeneSetSubtable && helpers.getGenesetForFactor(row.item.phenotype, row.item.factor, row.item.fetched_direction).length"
                                                        class="py-2 px-3"
                                                        style="display:flex; flex:1; flex-direction: column;"
                                                    >
                                                        <div v-if="!isGeneEntryMode" class="small text-muted mb-2">Gene sets in cluster</div>
                                                        <b-table
                                                            striped
                                                            hover
                                                            small
                                                            responsive="sm"
                                                            head-variant="light"
                                                            :items="helpers.getGenesetForFactor(row.item.phenotype, row.item.factor, row.item.fetched_direction)"
                                                            :fields="geneSetSubtableFields"
                                                            :per-page="subtablePerPage"
                                                            :current-page="helpers.getGeneSetSubtableCurrentPage(row.item)"
                                                        >
                                                            <template #cell(geneset)="gsRow">
                                                                <a
                                                                    v-if="!isGeneEntryMode"
                                                                    :href="helpers.cfdeExploreAssociationHref(row.item.phenotype, gsRow.item.geneset, gsRow.item.program)"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    class="cfde-explore-geneset-link reveal-soft-wrap-cell"
                                                                    :title="gsRow.item.geneset"
                                                                >{{ softWrapAtUnderscore(gsRow.item.geneset) }}</a>
                                                                <span
                                                                    v-else
                                                                    class="reveal-soft-wrap-cell"
                                                                    :title="gsRow.item.geneset"
                                                                >{{ softWrapAtUnderscore(gsRow.item.geneset) }}</span>
                                                            </template>
                                                            <template #cell(actions)="gsRow">
                                                                <button
                                                                    v-if="gsRow.item.program === 'gtex'"
                                                                    class="btn btn-sm btn-outline-primary"
                                                                    @click="$emit('gene-set-row-toggle', gsRow)"
                                                                >
                                                                    {{ gsRow.detailsShowing ? 'Hide' : 'Show' }}
                                                                </button>
                                                            </template>  
                                                            <template #row-details="gsRow">
                                                                <div style="padding: 10px;">
                                                                    <div v-if="geneSetSources[gsRow.item.geneset]">
                                                                        <b-card>
                                                                            <a :href="geneSetSources[gsRow.item.geneset].geneSetUrl" target="_blank">{{ geneSetSources[gsRow.item.geneset].geneSet }}</a>

                                                                            <ul>
                                                                                <li v-for="(rel, i) in geneSetSources[gsRow.item.geneset].relations" :key="i" class="text-muted small">
                                                                                    <div>
                                                                                        <strong>{{rel.method.predicate}}: </strong><a :href="rel.file.dcc_url" target="_blank">{{ rel.file.filename }}</a>
                                                                                    </div>
                                                                                    <div>
                                                                                        via 
                                                                                        <a :href="rel.method.script" target="_blank">{{ rel.method.type }}</a>
                                                                                        ({{ rel.method.direction }})
                                                                                    </div>
                                                                                </li>
                                                                            </ul>
                                                                        </b-card>
                                                                    </div>
                                                                    <div v-else>
                                                                        no data available yet.
                                                                    </div>
                                                                </div>
                                                            </template>  
                                                        </b-table>
                                                        <b-pagination
                                                            v-if="helpers.getGenesetForFactor(row.item.phenotype, row.item.factor, row.item.fetched_direction).length > subtablePerPage"
                                                            :value="subtableCurrentPages[helpers.getRowKey(row.item) + '|gs']"
                                                            @input="$emit('update:subtable-page', { rowKey: helpers.getRowKey(row.item) + '|gs', page: $event })"
                                                            class="pagination-sm justify-content-center mt-2"
                                                            :total-rows="helpers.getGenesetForFactor(row.item.phenotype, row.item.factor, row.item.fetched_direction).length"
                                                            :per-page="subtablePerPage"
                                                        />
                                                    </div>
                                                    <div v-if="showGeneSubtable" class="subtable-container py-2" style="flex:1">
                                                        <div v-if="!isGeneEntryMode" class="small text-muted mb-2">Genes share membership with anchor gene(s)</div>
                                                        <b-table
                                                            striped
                                                            hover
                                                            small
                                                            responsive="sm"
                                                            head-variant="light"
                                                            :items="helpers.getGenesForFactor(row.item.phenotype, row.item.factor, row.item.fetched_direction)"
                                                            :fields="geneSubtableFields"
                                                            :per-page="subtablePerPage"
                                                            :current-page="helpers.getSubtableCurrentPage(row.item)"
                                                        >
                                                            <template #cell(gene)="gRow">
                                                                <span :style="emphasizeSearchContextGenes && (gRow.item.inSearch || gRow.item.userRequested === 'Yes') ? { fontWeight: 700 } : { fontWeight: 400 }">
                                                                    {{ gRow.item.gene }}
                                                                </span>
                                                            </template>
                                                            <template #cell(inSearch)="gRow">
                                                                <span v-if="gRow.item.inSearch" class="text-success" aria-label="In search">✓</span>
                                                                <span v-else class="text-muted">—</span>
                                                            </template>
                                                        </b-table>
                                                        <b-pagination
                                                            v-if="helpers.getGenesForFactor(row.item.phenotype, row.item.factor, row.item.fetched_direction).length > subtablePerPage"
                                                            :value="subtableCurrentPages[helpers.getRowKey(row.item)]" @input="$emit('update:subtable-page', { rowKey: helpers.getRowKey(row.item), page: $event })"
                                                            class="pagination-sm justify-content-center mt-2"
                                                            :total-rows="helpers.getGenesForFactor(row.item.phenotype, row.item.factor, row.item.fetched_direction).length"
                                                            :per-page="subtablePerPage"
                                                        />
                                                    </div>
                                                </div>
                                            </template>
                                        </b-table>
                                        <b-pagination
                                            v-if="factorTableRowCount > mainTablePerPage"
                                            :value="mainTableCurrentPage" @input="$emit('update:mainTableCurrentPage', $event)"
                                            class="pagination-sm justify-content-center mt-2"
                                            :total-rows="factorTableRowCount"
                                            :per-page="mainTablePerPage"
                                        />
                                    </div>
                            </div>
                            </div>
                        </div>

    </div>
</template>


<script>
import WorkflowStepGate from "./WorkflowStepGate.vue";
import FactorBaseRevealNetwork from "../FactorBaseRevealNetwork2.vue";

export default {
    name: "WorkflowDataPanel",
    components: {
        WorkflowStepGate,
        FactorBaseRevealNetwork,
    },
    props: {
        showFactorTable: { type: Boolean, default: false },
        gateActive: { type: Boolean, default: false },
        gateStepId: { type: String, default: "" },
        phenotypeCount: { type: Number, default: 0 },
        factorCount: { type: Number, default: 0 },
        hybridSearchMetaSummaryLines: { type: Array, default: () => [] },
        isPhenotypePath: { type: Boolean, default: false },
        phenotypeRationaleList: { type: Array, default: () => [] },
        mainFactorTableRowsPaged: { type: Array, default: () => [] },
        factorTableRowCount: { type: Number, default: 0 },
        mainTablePerPage: { type: Number, default: 10 },
        mainTableCurrentPage: { type: Number, default: 1 },
        subtablePerPage: { type: Number, default: 10 },
        subtableCurrentPages: { type: Object, default: () => ({}) },
        loadingGenesForFactor: { type: Object, default: () => ({}) },
        geneSetSources: { type: Object, default: () => ({}) },
        /** Genes-first only: research intention input under the Data Continue gate. */
        showResearchIntention: { type: Boolean, default: false },
        researchIntention: { type: String, default: "" },
        /** Genes-first table columns (Factor before Phenotype; no Fetch direction). */
        isGeneEntryMode: { type: Boolean, default: false },
        /** Bold genes of interest vs context (genes-first or text-query with GOI). */
        emphasizeSearchContextGenes: { type: Boolean, default: false },
        /** Genes-entry heatmap ↔ table view filters (view-only). */
        heatmapViewFilters: {
            type: Object,
            default: () => ({
                showGeneSets: true,
                showGenes: true,
                genesInSearchOnly: false,
                onlySelected: false,
            }),
        },
        /** Data-step timeline while retrieving (hybrid + genes-first). */
        revealDataSteps: { type: Array, default: () => [] },
        loadStatus: { type: String, default: "" },
        loadComplete: { type: Boolean, default: false },
        loadStepSeconds: { type: Number, default: 0 },
        geneEntryProgress: {
            type: Object,
            default: () => ({ message: "", detail: "" }),
        },
        geneEntryLoading: { type: Boolean, default: false },
        helpers: { type: Object, required: true },
    },
    data() {
        return {
            fetchProgressExpanded: true,
        };
    },
    watch: {
        isDataFetchActive: {
            immediate: true,
            handler(active) {
                // Open while fetching; collapse once data is ready (header remains a manual toggle).
                this.fetchProgressExpanded = !!active;
            },
        },
    },
    computed: {
        showFetchProgress() {
            return (
                (this.revealDataSteps && this.revealDataSteps.length > 0) ||
                !!String(this.loadStatus || "").trim() ||
                this.geneEntryLoading
            );
        },
        /** True while APIs are still running (before factor table is available). */
        isDataFetchActive() {
            if (this.geneEntryLoading) return true;
            if (this.showFactorTable) return false;
            return (
                (this.revealDataSteps && this.revealDataSteps.length > 0) ||
                !!String(this.loadStatus || "").trim()
            );
        },
        fetchProgressHeaderTitle() {
            const step = Array.isArray(this.revealDataSteps) ? this.revealDataSteps[0] : null;
            return (step && step.title) || "Retrieving data";
        },
        fetchProgressHeaderTime() {
            const step = Array.isArray(this.revealDataSteps) ? this.revealDataSteps[0] : null;
            if (!step || !this.helpers) return "";
            return this.helpers.formatTime(step.time) || this.helpers.currStepTime(step) || "";
        },
        showLoadStatusSpinner() {
            if (this.loadComplete) return false;
            if (this.gateActive && this.gateStepId === "2") return false;
            return !!(this.loadStatus || this.geneEntryLoading);
        },
        showGeneSetSubtable() {
            if (!this.isGeneEntryMode) return true;
            return !!(this.heatmapViewFilters && this.heatmapViewFilters.showGeneSets);
        },
        showGeneSubtable() {
            if (!this.isGeneEntryMode) return true;
            const vf = this.heatmapViewFilters || {};
            return !!(vf.showGenes || vf.genesInSearchOnly);
        },
        geneSetSubtableFields() {
            if (this.isGeneEntryMode) {
                return [
                    {
                        key: "geneset",
                        label: "Gene set",
                        thStyle: { minWidth: "140px", maxWidth: "360px", width: "45%" },
                        tdClass: "reveal-soft-wrap-td",
                    },
                    {
                        key: "factor_value_display",
                        label: "Overall factor value",
                        thStyle: { width: "140px" },
                        thClass: "text-center",
                        tdClass: "text-center",
                    },
                    {
                        key: "p_value_display",
                        label: "P-value",
                        thStyle: { width: "110px" },
                        thClass: "text-center",
                        tdClass: "text-center",
                    },
                ];
            }
            return [
                {
                    key: "geneset",
                    label: "Gene Set",
                    thStyle: { minWidth: "140px", maxWidth: "360px", width: "45%" },
                    tdClass: "reveal-soft-wrap-td",
                },
                { key: "program", label: "Program", thClass: "text-nowrap" },
                { key: "actions", label: "Source Data", thClass: "text-nowrap" },
            ];
        },
        geneSubtableFields() {
            if (this.isGeneEntryMode) {
                return [
                    { key: "gene", label: "Gene", thStyle: { width: "100px" } },
                    {
                        key: "factor_value_display",
                        label: "Overall factor value",
                        thStyle: { width: "140px" },
                        thClass: "text-center",
                        tdClass: "text-center",
                    },
                    {
                        key: "gene_score_display",
                        label: "Gene score",
                        thStyle: { width: "110px" },
                        thClass: "text-center",
                        tdClass: "text-center",
                    },
                    {
                        key: "inSearch",
                        label: "In Search",
                        thStyle: { width: "90px" },
                        thClass: "text-center",
                        tdClass: "text-center",
                    },
                ];
            }
            return [
                { key: "gene", label: "Gene", thStyle: { width: "100px" } },
                {
                    key: "combined",
                    label: "Combined score",
                    thStyle: { width: "110px" },
                    thClass: "text-center",
                    tdClass: "text-center",
                },
                {
                    key: "gwasSupport",
                    label: "GWAS support",
                    thStyle: { width: "110px" },
                    thClass: "text-center",
                    tdClass: "text-center",
                },
                {
                    key: "geneSetSupport",
                    label: "Functional support",
                    thStyle: { width: "120px" },
                    thClass: "text-center",
                    tdClass: "text-center",
                },
            ];
        },
        mainAssociationTableFields() {
            const included = {
                key: "included",
                label: "Included",
                thStyle: { width: "72px" },
                thClass: "text-center",
                tdClass: "text-center",
                stickyColumn: false,
            };
            const phenotype = {
                key: "phenotype",
                label: "Phenotype",
                thStyle: { minWidth: "100px", maxWidth: "220px", width: "18%" },
                tdClass: "reveal-soft-wrap-td",
            };
            const factor = {
                key: "factor",
                label: "Factor",
                thStyle: { minWidth: "120px", maxWidth: "320px", width: "28%" },
                tdClass: "reveal-soft-wrap-td",
            };
            const fetchDirection = {
                key: "fetchDirection",
                label: "Fetch direction",
                thStyle: { width: "180px" },
            };
            const geneSetCount = {
                key: "geneSetCount",
                label: "Number of gene sets",
                thStyle: { width: "120px" },
                thClass: "text-center",
                tdClass: "text-center",
            };
            const geneCount = {
                key: "geneCount",
                label: this.emphasizeSearchContextGenes
                    ? "Number of genes (search:context)"
                    : "Number of genes",
                thStyle: { width: this.emphasizeSearchContextGenes ? "150px" : "110px" },
                thClass: "text-center",
                tdClass: "text-center",
            };
            const rationale = {
                key: "rationale",
                label: "Selection rationale",
                thStyle: { width: "220px" },
            };
            const viewGenes = {
                key: "view_genes",
                label: "Genes and gene sets in cluster",
                thStyle: { width: "140px" },
                thClass: "text-center",
                tdClass: "text-center",
            };
            if (this.isGeneEntryMode) {
                return [included, factor, geneSetCount, geneCount, viewGenes];
            }
            return [included, phenotype, fetchDirection, geneSetCount, geneCount, rationale, viewGenes];
        },
    },
    methods: {
        toggleFetchProgress() {
            this.fetchProgressExpanded = !this.fetchProgressExpanded;
        },
        /** Insert break opportunities after `_` so long ontology IDs wrap cleanly. */
        softWrapAtUnderscore(text) {
            return String(text == null ? "" : text).replace(/_/g, "_\u200B");
        },
    },
};
</script>
<style src="./mqSharedStyles.css"></style>
