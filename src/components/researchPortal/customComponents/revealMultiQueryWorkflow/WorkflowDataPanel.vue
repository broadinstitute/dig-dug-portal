<template>
    <div v-if="w" style="display:flex; flex-direction: column; gap: 12px; color: #555;">
                            <div v-if="(w.genesAndFactorValuesLoaded || w.loadComplete) && w.factorDataTableRows.length">
                                <workflow-step-gate
                                    v-if="w.stepApprovalGateActive && w.stepApprovalGateStepId === '2'"
                                    @continue="w.approveStepGate"
                                >
                                    Knowledge graph is ready. Please review the phenotypes, genes and gene sets retrieved with the search terms and research context.
                                    Select / unselect phenotypes x gene set cluster families if necessary. Please hit Continue button.
                                    REVEAL will generate mechanistic hypotheses using the data.
                                </workflow-step-gate>
                                <div class="mb-1">
                                    <div class="flex-grow-1">
                                        <div class="font-weight-bold mb-2" style="color: #FF6600; font-size: 1.2em;">
                                            Selected {{ w.phenotypeCount }} phenotype{{ w.phenotypeCount !== 1 ? 's' : '' }} and {{ w.factorCount }} gene set cluster{{ w.factorCount !== 1 ? 's' : '' }} relevant to research context.
                                        </div>
                                        <ul v-if="w.hybridSearchMetaSummaryLines.length" class="mb-2 pl-3 text-secondary small">
                                            <li v-for="(line, idx) in w.hybridSearchMetaSummaryLines" :key="`hybrid-meta-${idx}`">{{ line }}</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div v-for="step in w.revealDataSteps" :key="'reveal-data-' + step.id" class="status">
                                <div style="display:flex; gap: 5px; align-items: center;">
                                    <b-spinner v-if="w.dataStepShowsSpinner(step)" small></b-spinner>
                                    <span v-else-if="w.dataStepShowsGatePause(step)">▶</span>
                                    <span v-else-if="step.substeps && step.substeps.length">{{ w.dataFetchDirectionsExpanded ? '▼' : '▶' }}</span>
                                    <span v-else>♦</span>
                                    <button
                                        type="button"
                                        class="btn btn-link p-0 text-left font-weight-bold"
                                        :aria-expanded="w.dataFetchDirectionsExpanded ? 'true' : 'false'"
                                        aria-controls="data-fetch-directions-content"
                                        @click="w.dataFetchDirectionsExpanded = !w.dataFetchDirectionsExpanded"
                                    >
                                        {{ step.title }}
                                    </button>
                                    <span>{{ w.formatTime(step.time) || w.currStepTime(step) }}</span>
                                </div>
                                <div
                                    v-if="w.dataFetchDirectionsExpanded"
                                    id="data-fetch-directions-content"
                                    class="sub-status mt-1"
                                    style="display:flex; flex-direction: column; padding-left: 18px;"
                                >
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
                                            <div v-if="substep.result.title" v-html="substep.result.title"></div>
                                            <pre
                                                v-if="substep.id !== '2.h2' && substep.result.result != null"
                                                class="reveal-data-step-pre"
                                            >{{ substep.result.result }}</pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        <div v-if="(w.genesAndFactorValuesLoaded || w.loadComplete) && w.factorDataTableRows.length">
                            <!--
                            <div class="section-header d-flex justify-content-between align-items-start mb-2" @click="display_phenotypes_factors = !display_phenotypes_factors">
                                <div class="d-flex flex-column gap-2" style="max-width: calc(100% - 100px);">
                                    <div class="d-flex flex-wrap align-items-baseline gap-2">
                                        <strong>Phenotype:</strong>
                                        <span class="pill" v-for="p in phenotypeList" :key="p">{{ w.getPhenotypeDisplay(p) }}</span>
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
                                    <!-- Phenotype path: Selected Rationale section above table -->
                                    <div v-if="w.isPhenotypePath && w.phenotypeRationaleList.length" class="mb-3">
                                        <div class="font-weight-bold small text-muted mb-2">Selected Rationale</div>
                                        <ul class="list-unstyled small text-muted mb-0">
                                            <li v-for="item in w.phenotypeRationaleList" :key="item.phenotype" class="mb-2">
                                                <strong>{{ w.getPhenotypeDisplay(item.phenotype) }}:</strong> {{ item.rationale }}
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="d-flex justify-content-end mb-2">
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
                                            @click="w.downloadLastHybridSearchRawJson"
                                        >
                                            <b-icon icon="download" class="mr-1" aria-hidden="true" />
                                            Raw data
                                        </button>
                                    </div>
                                    <div>
                                        <!-- Phenotype path: custom table, no rationale column -->
                                        <b-table-simple v-if="w.isPhenotypePath" small striped hover class="mb-0">
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
                                            <tbody v-for="row in w.mainFactorTableRowsPaged" :key="w.getRowKey(row)">
                                                <tr>
                                                    <td>
                                                        <div class="text-center">
                                                    <input
                                                        type="checkbox"
                                                        :checked="w.isPairIncluded(row)"
                                                        class="form-check-input d-inline-block"
                                                        aria-label="Included"
                                                        @change="w.onPairIncludedToggle(row, $event.target.checked)"
                                                    />
                                                        </div>
                                                    </td>
                                                    <td>{{ w.getPhenotypeDisplay(row.phenotype) }}</td>
                                                    <td>{{ w.getFetchDirectionDisplay(row) }}</td>
                                                    <td class="text-center">{{ w.getGeneSetCountForRow(row) }}</td>
                                                    <td class="text-center">{{ w.getGeneCountForRow(row) }}</td>
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
                                                            @click="w.toggleFactorGenesRow({ item: row })"
                                                        >
                                                            {{ w.isFactorRowExpanded(row) ? 'Hide' : 'Show' }}
                                                        </button>
                                                    </td>
                                                </tr>
                                                <tr v-if="w.isFactorRowExpanded(row)">
                                                    <td colspan="6" class="p-0 border-0">
                                                        <div class="bg-light" style="display:flex; gap: 20px; flex-wrap: wrap;">
                                                            <div class="px-3 pt-2 pb-0 w-100">
                                                                <factor-base-reveal-network
                                                                    v-if="w.getFactorConnectivityNetwork(row) && w.getFactorConnectivityNetwork(row).nodes.length"
                                                                    :network="w.getFactorConnectivityNetwork(row)"
                                                                    :height="220"
                                                                    :show-popup-button="true"
                                                                    gene-node-metric-key="gwas_support"
                                                                    gene-color-by-gwas-support
                                                                    edge-distance-metric-key="functional_support"
                                                                    @open-popup="w.openFactorConnectivityPopup(row)"
                                                                />
                                                            </div>
                                                            <div v-if="w.getGenesetForFactor(row.phenotype, row.factor, row.fetched_direction)" class="py-2 px-3" style="display:flex; flex:1; flex-direction: column;">
                                                                <div class="small text-muted mb-2">Gene sets in cluster</div>
                                                                <!--
                                                                <div v-for="gs in w.getGenesetForFactor(row.phenotype, row.factor)" class="small" style="display: flex; gap: 5px">
                                                                    <span>{{ gs.geneset }}</span>
                                                                    <span>[{{ gs.program }}]</span>
                                                                    <a role="button" v-if="gs.program === 'gtex'" @click="getProvenance(gs.geneset, gs.program)">info</a>
                                                                </div>
                                                                -->
                                                                <b-table
                                                                    striped
                                                                    hover
                                                                    small
                                                                    responsive="sm"
                                                                    head-variant="light"
                                                                    :items="w.getGenesetForFactor(row.phenotype, row.factor, row.fetched_direction)"
                                                                    :fields="[
                                                                        { key: 'geneset', label: 'Gene Set', thClass: 'text-nowrap'},
                                                                        { key: 'program', label: 'Program', thClass: 'text-nowrap'},
                                                                        { key: 'actions', label: 'Source Data', thClass: 'text-nowrap'}
                                                                    ]"
                                                                >
                                                                    <template #cell(geneset)="gsRow">
                                                                        <a
                                                                            :href="w.cfdeExploreAssociationHref(row.phenotype, gsRow.item.geneset, gsRow.item.program)"
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            class="cfde-explore-geneset-link truncate-cell d-inline-block"
                                                                            :title="gsRow.item.geneset"
                                                                            style="max-width:350px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                                                                        >{{ gsRow.item.geneset }}</a>
                                                                    </template>
                                                                    <template #cell(actions)="gsRow">
                                                                        <button
                                                                            v-if="gsRow.item.program === 'gtex'"
                                                                            class="btn btn-sm btn-outline-primary"
                                                                            @click="w.onGeneSetRowToggled(gsRow)"
                                                                        >
                                                                            {{ gsRow.detailsShowing ? 'Hide' : 'Show' }}
                                                                        </button>
                                                                    </template>  
                                                                    <template #row-details="gsRow">
                                                                        <div style="padding: 10px;">
                                                                            <!--
                                                                            <a role="button" @click="getProvenance(gsRow.item.geneset, gsRow.item.program)">info</a>
                                                                            <pre>{{ w.gene_set_sources[gsRow.item.geneset] }}</pre>
                                                                            -->
                                                                            <div v-if="w.gene_set_sources[gsRow.item.geneset]">
                                                                                <b-card>
                                                                                    <a :href="w.gene_set_sources[gsRow.item.geneset].geneSetUrl" target="_blank">{{ w.gene_set_sources[gsRow.item.geneset].geneSet }}</a>

                                                                                    <ul>
                                                                                        <li v-for="(rel, i) in w.gene_set_sources[gsRow.item.geneset].relations" :key="i" class="text-muted small">
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
                                                            </div>
                                                            <div class="subtable-container py-2 px-3" style="flex:1">
                                                                <div v-if="w.loadingGenesForFactor[w.getRowKey(row)]" class="small text-muted mb-2">Loading genes…</div>
                                                                <div class="small text-muted mb-2">Genes share membership with anchor gene(s)</div>
                                                                <b-table
                                                                    v-if="!w.loadingGenesForFactor[w.getRowKey(row)]"
                                                                    striped
                                                                    hover
                                                                    small
                                                                    responsive="sm"
                                                                    head-variant="light"
                                                                    :items="w.getGenesForFactor(row.phenotype, row.factor, row.fetched_direction)"
                                                                    :fields="[
                                                                        { key: 'gene', label: 'Gene', thStyle: { width: '100px' } },
                                                                        { key: 'combined', label: 'Combined score', thStyle: { width: '110px' } },
                                                                        { key: 'gwasSupport', label: 'GWAS support', thStyle: { width: '110px' } },
                                                                        { key: 'geneSetSupport', label: 'Functional support', thStyle: { width: '120px' } }
                                                                    ]"
                                                                    :per-page="w.subtablePerPage"
                                                                    :current-page="w.getSubtableCurrentPage(row)"
                                                                />
                                                                <b-pagination
                                                                    v-if="!w.loadingGenesForFactor[w.getRowKey(row)] && w.getGenesForFactor(row.phenotype, row.factor, row.fetched_direction).length > w.subtablePerPage"
                                                                    v-model="w.subtableCurrentPages[w.getRowKey(row)]"
                                                                    class="pagination-sm justify-content-center mt-2"
                                                                    :total-rows="w.getGenesForFactor(row.phenotype, row.factor, row.fetched_direction).length"
                                                                    :per-page="w.subtablePerPage"
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
                                            :items="w.mainFactorTableRowsPaged"
                                            primary-key="_rowKey"
                                            :fields="[
                                                { key: 'included', label: 'Included', thStyle: { width: '72px' }, stickyColumn: false },
                                                { key: 'phenotype', label: 'Phenotype', thStyle: { width: '120px' } },
                                                { key: 'fetchDirection', label: 'Fetch direction', thStyle: { width: '180px' } },
                                                { key: 'geneSetCount', label: 'Number of gene sets', thStyle: { width: '120px' }, tdClass: 'text-center' },
                                                { key: 'geneCount', label: 'Number of genes', thStyle: { width: '110px' }, tdClass: 'text-center' },
                                                //{ key: 'top_gene_sets', label: 'Top gene sets', thStyle: { width: 'auto' } },
                                                { key: 'rationale', label: 'Selection rationale', thStyle: { width: '220px' } },
                                                { key: 'view_genes', label: 'Genes and gene sets in cluster', thStyle: { width: '140px' } }
                                            ]"
                                            small
                                            striped
                                            hover
                                            head-variant="light"
                                        >
                                            <template #cell(included)="row">
                                                <div class="text-center">
                                                    <input
                                                        type="checkbox"
                                                        :checked="w.isPairIncluded(row.item)"
                                                        class="form-check-input d-inline-block"
                                                        aria-label="Included in selection"
                                                        @change="w.onPairIncludedToggle(row.item, $event.target.checked)"
                                                    />
                                                </div>
                                            </template>
                                            <template #cell(phenotype)="row">
                                                {{ w.getPhenotypeDisplay(row.item.phenotype) }}
                                            </template>
                                            <template #cell(fetchDirection)="row">
                                                {{ w.getFetchDirectionDisplay(row.item) }}
                                            </template>
                                            <template #cell(geneSetCount)="row">
                                                {{ w.getGeneSetCountForRow(row.item) }}
                                            </template>
                                            <template #cell(geneCount)="row">
                                                {{ w.getGeneCountForRow(row.item) }}
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
                                                    @click="w.toggleFactorGenesRow(row)"
                                                >
                                                    {{ w.isFactorRowExpanded(row.item) ? 'Hide' : 'Show' }}
                                                </button>
                                            </template>
                                            <template #row-details="row">
                                                <div class="bg-light" style="display:flex; gap: 20px; flex-wrap: wrap;">
                                                    <div class="px-3 pt-2 pb-0 w-100">
                                                        <factor-base-reveal-network
                                                            v-if="w.getFactorConnectivityNetwork(row.item) && w.getFactorConnectivityNetwork(row.item).nodes.length"
                                                            :network="w.getFactorConnectivityNetwork(row.item)"
                                                            :height="220"
                                                            :show-popup-button="true"
                                                            gene-node-metric-key="gwas_support"
                                                            gene-color-by-gwas-support
                                                            edge-distance-metric-key="functional_support"
                                                            @open-popup="w.openFactorConnectivityPopup(row.item)"
                                                        />
                                                    </div>
                                                    <div v-if="w.getGenesetForFactor(row.item.phenotype, row.item.factor, row.item.fetched_direction)" class="py-2 px-3" style="display:flex; flex:1; flex-direction: column;">
                                                        <div class="small text-muted mb-2">Gene sets in cluster</div>
                                                        <!--
                                                        <div v-for="gs in w.getGenesetForFactor(row.phenotype, row.factor)" class="small" style="display: flex; gap: 5px">
                                                            <span>{{ gs.geneset }}</span>
                                                            <span>[{{ gs.program }}]</span>
                                                            <a role="button" v-if="gs.program === 'gtex'" @click="getProvenance(gs.geneset, gs.program)">info</a>
                                                        </div>
                                                        -->
                                                        <b-table
                                                            striped
                                                            hover
                                                            small
                                                            responsive="sm"
                                                            head-variant="light"
                                                            :items="w.getGenesetForFactor(row.item.phenotype, row.item.factor, row.item.fetched_direction)"
                                                            :fields="[
                                                                { key: 'geneset', label: 'Gene Set', thClass: 'text-nowrap'},
                                                                { key: 'program', label: 'Program', thClass: 'text-nowrap'},
                                                                { key: 'actions', label: 'Source Data', thClass: 'text-nowrap'}
                                                            ]"
                                                        >
                                                            <template #cell(geneset)="gsRow">
                                                                <a
                                                                    :href="w.cfdeExploreAssociationHref(row.item.phenotype, gsRow.item.geneset, gsRow.item.program)"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    class="cfde-explore-geneset-link truncate-cell d-inline-block"
                                                                    :title="gsRow.item.geneset"
                                                                    style="max-width:350px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                                                                >{{ gsRow.item.geneset }}</a>
                                                            </template>
                                                            <template #cell(actions)="gsRow">
                                                                <button
                                                                    v-if="gsRow.item.program === 'gtex'"
                                                                    class="btn btn-sm btn-outline-primary"
                                                                    @click="w.onGeneSetRowToggled(gsRow)"
                                                                >
                                                                    {{ gsRow.detailsShowing ? 'Hide' : 'Show' }}
                                                                </button>
                                                            </template>  
                                                            <template #row-details="gsRow">
                                                                <div style="padding: 10px;">
                                                                    <!--
                                                                    <a role="button" @click="getProvenance(gsRow.item.geneset, gsRow.item.program)">info</a>
                                                                    <pre>{{ w.gene_set_sources[gsRow.item.geneset] }}</pre>
                                                                    -->
                                                                    <div v-if="w.gene_set_sources[gsRow.item.geneset]">
                                                                        <b-card>
                                                                            <a :href="w.gene_set_sources[gsRow.item.geneset].geneSetUrl" target="_blank">{{ w.gene_set_sources[gsRow.item.geneset].geneSet }}</a>

                                                                            <ul>
                                                                                <li v-for="(rel, i) in w.gene_set_sources[gsRow.item.geneset].relations" :key="i" class="text-muted small">
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
                                                    </div>
                                                    <div class="subtable-container py-2" style="flex:1">
                                                        <div class="small text-muted mb-2">Genes share membership with anchor gene(s)</div>
                                                        <b-table
                                                            striped
                                                            hover
                                                            small
                                                            responsive="sm"
                                                            head-variant="light"
                                                            :items="w.getGenesForFactor(row.item.phenotype, row.item.factor, row.item.fetched_direction)"
                                                            :fields="[
                                                                { key: 'gene', label: 'Gene', thStyle: { width: '100px' } },
                                                                { key: 'combined', label: 'Combined score', thStyle: { width: '110px' } },
                                                                { key: 'gwasSupport', label: 'GWAS support', thStyle: { width: '110px' } },
                                                                { key: 'geneSetSupport', label: 'Functional support', thStyle: { width: '120px' } }
                                                            ]"
                                                            :per-page="w.subtablePerPage"
                                                            :current-page="w.getSubtableCurrentPage(row.item)"
                                                        />
                                                        <b-pagination
                                                            v-if="w.getGenesForFactor(row.item.phenotype, row.item.factor, row.item.fetched_direction).length > w.subtablePerPage"
                                                            v-model="w.subtableCurrentPages[w.getRowKey(row.item)]"
                                                            class="pagination-sm justify-content-center mt-2"
                                                            :total-rows="w.getGenesForFactor(row.item.phenotype, row.item.factor, row.item.fetched_direction).length"
                                                            :per-page="w.subtablePerPage"
                                                        />
                                                    </div>
                                                </div>
                                            </template>
                                        </b-table>
                                        <b-pagination
                                            v-if="(w.isPhenotypePath ? w.factorDataTableRowsWithRationaleMeta.length : w.factorDataTableRows.length) > w.mainTablePerPage"
                                            v-model="w.mainTableCurrentPage"
                                            class="pagination-sm justify-content-center mt-2"
                                            :total-rows="w.isPhenotypePath ? w.factorDataTableRowsWithRationaleMeta.length : w.factorDataTableRows.length"
                                            :per-page="w.mainTablePerPage"
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
    inject: {
        mqWorkflow: { default: null },
    },
    computed: {
        w() {
            return this.mqWorkflow;
        },
    },
};
</script>

<style src="./mqSharedStyles.css"></style>
