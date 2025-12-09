<template> 
    <div class="reset">
        <div style="display:none">
            <div style="font-size: 2em; font-weight: bold; line-height: 1em;">CFDE REVEAL</div>
            <div style="font-size: 1.2em; font-weight: bold;">Turn your research question into mechanistic leads</div>
            <div style="width: 450px; margin: 5px 0 0">Explore gene expression signatures linked to phenotypes, <br/>and get evidence-backed hypotheses about the biology behind them.</div>
            <div><a role="button" onClick="alert('TODO: documentation about the data, associations, and methods')">Learn more</a>.</div>
        </div>

        <div style="display:flex; flex-direction: column; gap:5px">
            <div style="display:flex; align-items: baseline; justify-content: space-between; position: relative;">
                <div class="dot dot1 on"></div>
                <div style="font-size: 1.2em; font-weight: bold; color: #FF6600;">Tell us what you're studying or curious about:</div>
                <fieldset style="display:flex; align-items: center; gap:10px">
                    <div>mode:</div>
                    <div style="display: flex; align-items: center; gap:5px;">
                        <input type="radio" id="search_auto" name="search_mode" value="auto" v-model="searchMode"/>
                        <label for="search_auto">auto <span class="info-icon" v-b-tooltip.hover="'Allow this tool to run automatically to the end.'">?</span></label>
                    </div>
                    <div style="display: flex; align-items: center; gap:5px;">
                        <input type="radio" id="seach_step" name="search_mode" value="step" v-model="searchMode"/>
                        <label for="seach_step">step <span class="info-icon" v-b-tooltip.hover="'Tool will pause and confirm with you at each step before proceeding.'">?</span></label>
                    </div>
                </fieldset>
            </div>
            <div style="display:flex; gap:10px">
                <input type="textarea" placeholder="" ref="query" style="flex:1; padding: 10px;" v-model="userQuery"></input>
                <button class="btn btn-primary" style="width: 200px;" @click="queryParse($refs.query.value)">Search</button>
            </div>
            
            <div style="display:flex; gap: 5px; align-items: center; justify-content: space-between;">
                <a role="button" @click="display_examples = !display_examples">{{!display_examples ? 'show' : 'hide'}} examples</a>
                <fieldset style="display:none; align-items: center; gap:10px">
                    <div>(DEV) semantic api:</div>
                    <div style="display: flex; align-items: center; gap:5px">
                        <input type="radio" id="search_phenotypes" name="seach_type" value="old" v-model="searchApi"/>
                        <label for="search_phenotypes">old <span style="display:none" class="info-icon" v-b-tooltip.hover="'Runs semantic search against phenotypes, then gets associated gene-sets for each.'">?</span></label>
                    </div>
                    <div style="display: flex; align-items: center; gap:5px">
                        <input type="radio" id="seach_terms" name="seach_type" value="new" v-model="searchApi"/>
                        <label for="seach_terms">new <span style="display:none" class="info-icon" v-b-tooltip.hover="'Runs semantic search against phenotype/gene-set associations.'">?</span></label>
                    </div>
                </fieldset>
            </div>
            <div :class="{collapsed: !display_examples}" style="display:flex; gap:10px;">
                <div v-for="example in exampleQueries" class="query-sample" @click="useExample(example)">{{ example }}</div>
            </div>
        </div>

        <div style="position: relative;">
            <div class="dot dot2"></div>
            <div v-if="search_step < 1" style="display:flex; flex-direction: column; gap:5px; min-height: 75px">
                <div style="font-size:1.2em; font-weight: bold; color: #FF6600;">We'll understand your query.</div>
                <div>
                    <div></div>
                    <div>You don't need to sift through keywords or ontologies in order to get going.</div>
                    <div>We extract terms, research context, and suggest related CFDE programs to provide tailored results.</div>
                </div>
            </div>
    
            <div v-if="search_step >= 1" style="display: flex; flex-direction: column; gap:10px">
                <div v-if="loading_search_criteria" class="loading-text" style="display:flex; align-items: baseline; gap:5px; min-height: 75px;">
                    <div style="font-size:1.2em;"><strong>Action:</strong> Extracting research criteria based on your query.</div><div v-if="elapsed" style="font-size: 1em;">{{ `${elapsed}` }} (usually takes about 30 seconds)</div>
                </div>
                <div v-if="error_search_criteria" style="display:flex; align-items: baseline; gap:5px; min-height: 75px;">
                    <div style="font-size:1.2em; color:red"><strong>Error:</strong> {{ error_msg_search_criteria }}</div><button v-if="allow_retry" @click="beginFlow()" class="btn btn-sm btn-primary">Retry</button>
                </div>
    
                <div v-if="searchCriteria" style="display:flex; flex-direction: column; gap: 5px">
                    <div style="font-size: 1.2em; font-weight: bold; color: #FF6600;">Extracted research criteria from your Query</div>
                    <div class="section-header" @click="display_search_criteria = !display_search_criteria">
                        <div style="display: grid; gap: 5px; width: calc(100% - 200px);">
                            <div style="display:grid; grid-template-columns: 170px auto; gap:5px;">
                                <strong>Search Terms: </strong> 
                                <div style="display:flex; flex-wrap: wrap; gap: 5px">
                                    <span class="pill" v-for="item in searchCriteria[0].values">{{ item }}</span>
                                </div>
                            </div>
                            <div style="display:grid; grid-template-columns: 170px auto; gap:5px;">
                                <strong>Your Research Context: </strong> 
                                <span class="pill">{{ searchCriteria[1].values }}</span>
                            </div>
                            <!--
                            <div style="display:grid; grid-template-columns: 170px auto; gap:5px;">
                                <strong>Relevant CFDE Programs: </strong> 
                                <div style="display:flex; flex-wrap: wrap; gap: 5px">
                                    <span class="pill" v-for="item in searchCriteria[2].values">{{ item }}</span>
                                </div>
                            </div>
                            -->
                        </div>
                        <div class="section-header-state">
                            {{ !display_search_criteria ? 'show more' : 'show less' }}
                        </div>
                    </div>
                </div>
    
                <div :class="{collapsed: !display_search_criteria, editing: edit_search_criteria}" style="padding: 0 40px; display:flex; flex-direction: column; gap: 10px;">
                    <div style="display:flex; align-items: center; justify-content: flex-end;">
                        <button v-if="!edit_search_criteria" @click="editSearchCriteria()" class="btn btn-info">✎ Edit search criteria</button>
                        <div v-if="edit_search_criteria" style="display: flex; gap: 5px;">
                            <button @click="cancelEditSearchCriteria()" class="btn btn-warning">Cancel</button>
                            <button @click="saveSearchCriteria()" class="btn btn-success">Save search criteria</button>
                        </div>
                    </div>
                    <div style="display:flex; align-items: center;">
                        <div style="font-size: 1.2em; font-weight: bold;">The values below will be used to inform subsequent steps</div>
                    </div>
                    <b-table
                        :items="searchCriteria"
                        small
                        striped
                        hover
                        responsive="sm"
                        head-variant="light"
                    >
                        <template #cell(values)="row">
                            <span v-if="Array.isArray(row.item.values)" style="display:inline-flex; gap: 5px; flex-wrap: wrap;">
                                <span class="pill" :class="{editable: edit_search_criteria}" v-for="item in row.item.values" @click="removeSearchTerm(item)">{{ item }}</span>
                                <input class="pill new" placeholder="+" v-if="edit_search_criteria" @keyup.enter="addSearchTerm($event)" @blur="addSearchTerm($event)"/>
                            </span>
                            <textarea id="context-edit-1" v-else class="pill" style="width:100%; field-sizing: content;" :disabled="!edit_search_criteria" v-model="row.item.values"></textarea>
                        </template>
                        <template #cell(why)="data">
                            <span v-html="data.value"></span>
                        </template>
                    </b-table>
                    <div style="display:flex; align-items: center; justify-content: flex-end;">
                        <button @click="associationSearch(searchTerm)" class="btn btn-primary" :disabled="edit_search_criteria || search_step>1 || (search_step>1 && !user_edited_search_criteria)">
                            {{ searchMode==="step" ? "Continue" : "Re-search" }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div style="position: relative;">
            <div class="dot dot3"></div>
            <div v-if="search_step < 2" :class="{muted: search_step > 0}" style="display:flex; flex-direction: column; gap:5px; position: relative; min-height: 75px">
                <div style="font-size:1.2em; font-weight: bold; color: #FF6600;">Retrieve relevant associations.</div>
                <div>
                    <div>Our associations contain over 6,000 common & rare disease phenotypes and 150,000 signatures.</div>
                    <div>We use <a role="button" @click="showByorTab()">semantic search</a> to find those most relevant, and gather the strongest links.</div>
                </div>
            </div>
            <div v-if="search_step >= 2" style="display: flex; flex-direction: column; gap:10px">
                <div v-if="loading_associations" class="loading-text" style="display:flex; gap:10px; min-height: 75px">
                    <div style="font-size:1.2em;">
                        <strong>Action:</strong> Searching for phenotype↔signature associations related to <strong>{{ searchTerm }}</strong>
                    </div>
                </div>
                <div v-if="error_associations" style="display:flex; align-items: baseline; gap:5px; min-height: 75px;">
                    <div style="font-size:1.2em; color:red"><strong>Error:</strong> {{ error_msg_associations }}</div><button v-if="allow_retry" @click="associationSearch(searchTerm)" class="btn btn-sm btn-primary">Retry</button>
                </div>
    
                <div v-if="associations && relevantAssociations" style="display:flex; flex-direction: column; gap: 5px">
                    <div style="font-size: 1.2em; font-weight: bold; color: #FF6600;">Found <strong>{{ associations.length }} phenotype↔signature</strong> associations related to the Search Terms</div>
                    <div class="section-header" @click="display_associations = !display_associations">
                        <div style="max-width: calc(100% - 200px);">Across <strong>{{ total_phenotypes }} phenotypes</strong>, <strong>{{ total_signatures }} expression signatures</strong>, and <strong>{{ total_programs }} CFDE programs</strong>.</div>
                        <div style="max-width: calc(100% - 200px);">Selected <strong>{{ relevantAssociations.length }}</strong> associations.
                        
                        <!--
                        <div>Including <strong>{{ total_strong_associations }} strong</strong>, <strong>{{ total_moderate_associations }} moderate</strong>, and <strong>{{ total_low_associations }} low</strong> association stengths.</div>
                        <div>Selected <strong>{{ total_relevant_associations }} <span v-for="(strength, idx) in filtered_association_strengths" style="text-transform: lowercase;">{{ association_strengths_list[strength].label }}{{ idx < filtered_association_strengths.length-1 ? ',' : '' }}</span></strong> associations.
                        -->
                            <!--
                            <template v-if="filtered_programs.length>0">
                                from <strong>
                                    <span v-if="filtered_programs.length === programs_list.length">All CFDE programs</span>
                                    <span v-else>{{ filtered_programs.join(', ') }}</span>
                                </strong>
                            </template> for analysis.
                            -->
                        </div>
                        <div class="section-header-state">
                            {{ !display_associations ? 'show more' : 'show less' }}
                        </div>
                    </div>
                </div>
    
                <div :class="{collapsed: !display_associations}" style="display:flex; flex-direction: column; gap:10px; padding: 0 40px;">
                    <div class="note" v-if="!user_selected_associations">
                        By default, we sort the resulting associations by sematic similarity to the Search Terms, then use the top 300 associations for analysis.<br/>
                        You may change the associations selected for analysis by clicking <strong>Edit Selected Associations</strong> button and choosing your own.
                    </div>
                    <div style="display:flex; align-items: center; justify-content: flex-end;">
                        <button v-if="!edit_associations" @click="editAssociations()" class="btn btn-info">✎ Edit selected associations</button>
                        <div v-if="edit_associations" style="display: flex; gap: 5px;">
                            <button @click="cancelEditAssociations()" class="btn btn-warning">Cancel</button>
                            <button @click="saveAssociations()" class="btn btn-success">Apply {{ temp_selected_associations }} selected associations</button>
                        </div>
                    </div>
                    <!-- FILTERS hidden -->
                    <div v-if="edit_associations" style="display: flex; flex-direction: column; gap: 10px; padding: 10px; border: 1px solid #ccc; border-radius: 10px; margin: 10px 0;">
                        <div style="display:flex; gap: 20px">
                            <div style="display:flex; flex-direction: column; width:120px; gap: 5px;">
                                <div style="font-weight: bold;">Select</div>
                                <div style="height:100px;">{{ temp_selected_associations }} of {{ associations.length }} associations selected</div>
                                
                                <div style="display:flex; gap: 10px;">
                                    <button @click="selectAll()" class="btn btn-sm btn-outline-dark">All</button>
                                    <button @click="deselectAll()" class="btn btn-sm btn-outline-dark">None</button>
                                </div>
                                
                            </div>
                            <div style="display:flex; flex-direction: column; flex:1; gap:5px">
                                <div style="display:flex; justify-content: space-between;"><strong>Phenotypes</strong> {{ `${filtered_phenotypes.length}/${phenotypes_list.length}` }}</div>
                                <div style="height:100px; display:flex; flex-direction: column; gap: 3px; overflow: auto; background: #eee; padding: 5px 10px;">
                                    <div v-for="(option, idx) in phenotypes_list" :key="option" style="display:flex; gap:5px">
                                        <input type="checkbox" :id="`phenotype_${idx}`" :value="option" v-model="filtered_phenotypes">
                                        <label :for="`phenotype_${idx}`">{{ option }}</label>
                                    </div>
                                </div>
                                <!--
                                <div style="display:flex; gap: 10px; justify-content: flex-start;">
                                    <button @click="selectAll('phenotypes')" class="btn btn-sm btn-outline-dark">All</button>
                                    <button @click="deselectAll('phenotypes')" class="btn btn-sm btn-outline-dark">None</button>
                                </div>
                                -->
                            </div>
                            <div style="display:flex; flex-direction: column; width:300px; gap:5px">
                                <div style="display:flex; justify-content: space-between;"><strong>Association strength</strong>  {{ `${filtered_association_strengths.length}/${association_strengths_list.length}` }}</div>
                                <div style="height:100px; display:flex; flex-direction: column; gap: 3px; overflow: auto; background: #eee; padding: 5px 10px;">
                                    <div v-for="(option, idx) in association_strengths_list" :key="idx" style="display:flex; gap:5px">
                                        <input type="checkbox" :id="`strength_${idx}`" :value="idx" v-model="filtered_association_strengths" :disabled="option.total===0">
                                        <label :for="`strength_${idx}`" style="display:flex; justify-content: space-between; width: 100%;" :style="`opacity:${option.total===0?'0.5':'1'}`">
                                            <div>{{ option.label }}</div>
                                            <div>{{ option.text }}</div>
                                        </label>
                                    </div>
                                </div>
                                <!--
                                <div style="display:flex; gap: 10px; justify-content: flex-start;">
                                    <button @click="selectAll('strengths')" class="btn btn-sm btn-outline-dark">All</button>
                                    <button @click="deselectAll('strengths')" class="btn btn-sm btn-outline-dark">None</button>
                                </div>
                                -->
                            </div>
                            <div style="display:flex; flex-direction: column; width: 300px; gap:5px">
                                <div style="display:flex; justify-content: space-between;"><strong>Sources</strong> {{ `${filtered_programs.length}/${programs_list.length}` }}</div>
                                <div style="height:100px; display:flex; flex-direction: column; gap: 3px; overflow:auto; background: #eee; padding: 5px 10px;">
                                    <div v-for="(option, idx) in programs_list" :key="option" style="display:flex; gap:5px">
                                        <input type="checkbox" :id="`program_${idx}`" :value="option" v-model="filtered_programs">
                                        <label :for="`program_${idx}`">{{ option.replace(';', ' x ') }}</label>
                                    </div>
                                </div>
                                <!--
                                <div style="display:flex; gap: 10px; justify-content: flex-start;">
                                    <button @click="selectAll('sources')" class="btn btn-sm btn-outline-dark">All</button>
                                    <button @click="deselectAll('sources')" class="btn btn-sm btn-outline-dark">None</button>
                                </div>
                                -->
                            </div>
                        </div>
                        <!--
                        <div style="display:flex; gap: 20px">
                            <div style="font-weight: bold; width:120px">Select for analysis</div>
                            <div style="display:flex; gap: 10px">
                                <div v-for="(option, idx) in select_list" style="display:flex; gap: 5px;">
                                    <input type="radio" :id="`select_${idx}`" :value="option" v-model="selected_select">
                                    <label :for="`select_${idx}`">{{option}}</label>
                                </div>
                            </div>
                        </div>
                        <div style="display:flex; gap: 20px">
                            <div style="font-weight: bold; width:120px">Display in table</div>
                            <div style="display:flex; gap: 10px">
                                <div v-for="(option, idx) in show_list" style="display:flex; gap: 5px;">
                                    <input type="radio" :id="`show_${idx}`" :value="option" v-model="selected_show">
                                    <label :for="`show_${idx}`">{{option}}</label>
                                </div>
                            </div>
                        </div>
                        -->
                    </div>
                    <div style="display:flex; align-items: center;">
                        <div style="font-size: 1.2em; font-weight: bold;">All associations for <em>{{ searchTerm }}</em></div>
                    </div>
                    <!--
                        :filter="all_filters"
                        :filter-function="associationsFilter"
                    -->
                    <b-table 
                        :items="associations"
                        :fields="[
                            {key: 'selected', label: 'Select', thStyle: { width: '70px' }},
                            {key: 'phenotype', label: 'Phenotype', sortable: true}, 
                            {key: 'score', label: 'Similarity Score', sortable: true},
                            {key: 'beta_uncorrected', label: 'Association (beta uncorrected)', sortable: true}, 
                            {key: 'gene_set_label', label: 'Signature (gene set)'}, 
                            {key: 'source_label', label: 'Source', sortable: true},
                            'actions'
                        ]"
                        small
                        striped
                        hover
                        responsive="sm"
                        head-variant="light"
                        sticky-header="400px"
                        sort-icon-left
                        sort-by="score"
                        :sort-desc="true"
                        show-details
                        >
                            <template #head(selected)="data">
                                {{ data.label }} <span class="info-icon" v-b-tooltip.hover="'Include this association in mechanistic discovery.'">?</span>
                            </template>
                            <template #head(phenotype)="data">
                                {{ data.label }} <span class="info-icon" v-b-tooltip.hover="'The trait or condition linked to the genes in this signature.'">?</span>
                            </template>
                            <template #head(score)="data">
                                {{ data.label }} <span class="info-icon" v-b-tooltip.hover="'Semantic similarity of search terms to phenotype & signature. Range is form -1 to 1, being least to most similar.'">?</span>
                            </template>
                            <template #head(beta_uncorrected)="data">
                                {{ data.label }} <span class="info-icon" v-b-tooltip.hover="'How strongly the signature\'s genes overlap with the genes linked to the phenotype.'">?</span>
                            </template>
                            <template #head(gene_set)="data">
                                {{ data.label }} <span class="info-icon" v-b-tooltip.hover="'The set of genes that turned on or off in a specific dataset or experiment giving a snapshot of a biological state. The label encodes the source (e.g. dataset, tissue, condition) and whether genes are up- or down-regulated.'">?</span>
                            </template>
                            <template #head(gene_set_label)="data">
                                {{ data.label }} <span class="info-icon" v-b-tooltip.hover="'The set of genes that turned on or off in a specific dataset or experiment giving a snapshot of a biological state. The label encodes the source (e.g. dataset, tissue, condition) and whether genes are up- or down-regulated.'">?</span>
                            </template>
                            <template #head(source)="data">
                                {{ data.label }} <span class="info-icon" v-b-tooltip.hover="'Which CFDE program this signature came from so you know the context of the data.'">?</span>
                            </template>
                            <template #head(source_label)="data">
                                {{ data.label }} <span class="info-icon" v-b-tooltip.hover="'Which CFDE program this signature came from so you know the context of the data.'">?</span>
                            </template>
                            <template #head(datasets)="data">
                                {{ data.label }} <span class="info-icon" v-b-tooltip.hover="'Links to the datasets from which these signatures were generated.'">?</span>
                            </template>
                            
                            <template #cell(selected)="row">
                                <div style="text-align: center;">
                                    <input type="checkbox" v-model="row.item.selected" :disabled="!edit_associations" @click="customSelect()"/>
                                </div>
                            </template>
                            <template #cell(score)="row">
                                {{ row.item.score.toFixed(3) }}
                            </template>
                            <template #cell(beta_uncorrected)="row">
                                <div v-if="row.item.beta_uncorrected<0.1">low ({{ row.item.beta_uncorrected }})</div>
                                <div v-if="row.item.beta_uncorrected>=0.1 && row.item.beta_uncorrected<1">moderate ({{ row.item.beta_uncorrected }})</div>
                                <div v-if="row.item.beta_uncorrected>=1">strong ({{ row.item.beta_uncorrected }})</div>
                            </template>
                            <template #cell(genes_in_set)="row">
                                <button v-if="row.item.genes && row.item.genes.length > 0" @click="row.toggleDetails">
                                    {{ row.detailsShowing ? 'Hide' : 'Show' }} {{ (row.item.genes || []).length }} Genes
                                </button>
                                <div v-else>no results</div>
                            </template>
                            <template #cell(datasets)="row">
                                <button @click="alert('NEED: links to source datasets')">
                                    View
                                </button>
                            </template>
                            <template #cell(actions)="row">
                                <div style="display:flex; flex-direction: column;">
                                    <!--<a role="button" onClick="alert('TODO: load and show genes for signature')">View Genes</a>-->
                                    <a :href="getsetLink(row.item)" target="_blank" disabled>View Geneset</a>
                                </div>
                            </template>
                            <template #row-details="{ item }">
                                <b-table
                                    small
                                    sticky-header="300px"
                                    :items="item.genes"
                                    :fields="['gene', 'combined', 'beta', 'beta_uncorrected', 'log_bf', 'prior', 'trait_group']"
                                />
                            </template>
                    </b-table>
                    <div style="display:flex; align-items: center; justify-content: flex-end;">
                        <button @click="mechanismsReveal()" class="btn btn-primary" :disabled="edit_associations || search_step>2 || (search_step>2 && !user_selected_associations)">
                            {{ searchMode==="step" ? "Continue" : "Re-analyze" }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div style="position: relative;">
            <div class="dot dot4"></div>
            <div v-if="search_step < 3" :class="{muted:search_step > 0}" style="display:flex; flex-direction: column; gap:5px; position: relative; min-height: 75px">
                <div style="font-size:1.2em; font-weight: bold; color: #FF6600;">Interpret the results.</div>
                <div>
                    <div>An expert LLM reviews the data and proposes mechanistic hypotheses in the context of your research.</div>
                    <div>You can explore or validate the results with access to the underlying source data.</div>
                </div>
            </div>
            <div v-if="search_step >= 3" style="display: flex; flex-direction: column; gap:10px">
                <div v-if="loading_genes" class="loading-text" style="display:flex; gap:5px; align-items: baseline; min-height: 75px">
                    <div style="font-size:1.2em;"><strong>Action:</strong> Loading genes for </div><div style="font-size: 1em;">{{ association_genes_loaded }} / {{ relevantAssociations.length }} selected associations</div>
                </div>
                <div v-if="loading_mechanisms" class="loading-text" style="display:flex; gap:5px; align-items: baseline; min-height: 75px">
                    <div style="font-size:1.2em;"><strong>Action:</strong> Generating mechanistic hypotheses </div><div v-if="elapsed" style="font-size: 1em;">{{ `${elapsed}` }} (usually takes  about 1-2 minutes)</div>
                </div>
                <div v-if="error_mechanisms" style="display:flex; align-items: baseline; gap:5px; min-height: 75px;">
                    <div style="font-size:1.2em; color:red"><strong>Error:</strong> {{ error_msg_mechanisms }}</div><button @click="mechanismsReveal()" class="btn btn-sm btn-primary">Retry</button>
                </div>

                <div v-if="mechanisms" style="display:flex; flex-direction: column; gap: 5px">
                    <div style="font-size: 1.2em; font-weight: bold; color: #FF6600;">Generated {{ mechanisms.length }} mechanistic hypotheses.</div>
                    <div class="section-header" @click="display_mechanisms = !display_mechanisms">
                        <div style="max-width: calc(100% - 200px);">In the context of <strong>{{ searchCriteria[1].values }}</strong></div>
                        <div class="section-header-state">
                            {{ !display_mechanisms ? 'show more' : 'show less' }}
                        </div>
                    </div>
                </div>
    
                <div :class="{collapsed: !display_mechanisms, editing: edit_search_criteria}" style="display:flex; flex-direction: column; gap:5px; padding: 0 40px;">
                    <div v-if="mechanisms" style="display:flex; flex-direction: column; gap: 20px">
                        <div class="note" style="display: flex; gap:20px;">
                            <div style="display: flex; flex-direction: column; flex: 1;">
                                <strong>The following mechanistic hypotheses were generated using the selected associations in the context of:</strong>
                                <input id="context-edit-2" class="pill" style="width:100%; height:100%; align-items: center;" v-model="searchCriteria[1].values" :disabled="!edit_context">
                            </div>
                            <div style="display:flex; flex-direction: column; gap:5px; align-self: flex-end;">
                                <button v-if="!edit_context" @click="editContext()" class="btn btn-info">✎ Edit context</button>
                                <button v-else @click="cancelEditContext()" class="btn btn-warning">Cancel</button>
                                <button :disabled="!edit_context" @click="mechanismsReveal()" class="btn btn-primary">Re-analyze</button>
                            </div>
                        </div>
                        <div style="display:flex; justify-content: flex-end;">
                            <button class="btn btn-primary btn-sm" @click="downloadHypotheses()">Download Hypotheses</button>
                        </div>
                        <div v-if="mechanisms_summary" style="display:flex; flex-direction: column; margin-bottom:20px;">
                            <strong style="font-size:1.2em;">Summary:</strong>
                            <div>{{ mechanisms_summary }}</div>
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr; gap: 40px">
                            <div v-for="mechanism in mechanisms" style="display: flex;flex-direction: column;gap: 20px;border: 1px solid #ccc;border-radius: 10px;box-shadow: rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px;">
                                <div style="padding: 20px;background: #ccc;margin: -1px;border-radius: 10px 10px 0px 0px;display: flex;flex-direction: column;gap: 10px;">
                                    <div style="font-size:1.2em; line-height: 1.2em; font-weight: bold;">{{ mechanism.group_name }}</div>
                                    <div style="display:flex; flex-direction: column; padding: 5px;">
                                        <div style="font-size: .8em;">
                                            <div style="font-weight: bold;">mechanistic hypothesis <span class="info-icon" style="color:gold" v-b-tooltip.hover="`${mechanism.relevance}`">♦</span></div>
                                        </div>
                                        <div style="font-size: 1.1em;">{{ mechanism.hypothesis }}</div>
                                    </div>
                                </div>
                                
                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 40px; padding:20px">
                                    <div style="display:flex; flex-direction: column; padding: 5px;">
                                        <div style="font-size: .8em; font-weight: bold;">candidate genes <span class="info-icon" style="color:gold" v-b-tooltip.hover="`${mechanism.genes_reason}`">♦</span></div>
                                        <div style="display: flex; gap:5px; flex-wrap: wrap;">
                                            <span v-for="gene in mechanism.genes" style="display:grid; grid-template-columns: 100px auto; gap: 20px">
                                                <div>{{ gene.gene }}</div>
                                                <div>{{ gene.reason }}</div>
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div style="display: flex;flex-direction: column;gap: 20px;">
                                        <div style="display:flex; flex-direction: column; padding: 5px;">
                                            <div style="font-size: .8em; font-weight: bold;">contributing CFDE programs</div>
                                            <div style="display: flex; gap:5px; flex-wrap: wrap;">
                                                <span class="pill" v-for="program in mechanism.programs">{{ program }}</span>
                                            </div>
                                        </div>
                                        <div style="display:flex; flex-direction: column; padding: 5px;">
                                            <div style="font-size: .8em;">
                                                <div style="font-weight: bold;">relevant associations <span class="info-icon" style="color:gold" v-b-tooltip.hover="`${mechanism.justification}`">♦</span></div>
                                            </div>
                                            <div style="height:calc(225px + 1rem)">
                                                <b-table
                                                    small
                                                    sticky-header="225px"
                                                    :items="mechanism.associations"
                                                    :fields="[
                                                        'phenotype', 
                                                        {key: 'gene_set_label', label: 'Gene Set'}, 
                                                        {key: 'source_label', label: 'Source'}, 
                                                        'actions'
                                                    ]"
                                                    style="font-size: 0.9em;"
                                                >
                                                    <template #cell(actions)="row">
                                                        <div style="display:flex; flex-direction: column;">
                                                            <a :href="getsetLink(row.item)" target="_blank" disabled style="white-space: nowrap;">View Geneset</a>
                                                            <!-- New button to toggle row details -->
                                                            <a role="button" @click="row.toggleDetails">{{ row.detailsShowing ? 'Hide Genes' : 'Show Genes' }}</a>
                                                        </div>
                                                    </template>
        
                                                    <!-- ROW DETAILS SLOT -->
                                                    <template #row-details="row">
                                                        <b-card body-class="p-2">
                                                            <!-- Show genes in a mini table -->
                                                            <b-table
                                                                small
                                                                :items="row.item.genes"
                                                                :fields="[
                                                                    'gene',
                                                                    {key: 'combined', label: 'Combined'},
                                                                    {key: 'log_bf', label: 'GWAS Support'},
                                                                    {key: 'prior', label: 'Gene Set Support'}
                                                                ]"
                                                                head-variant="light"
                                                            ></b-table>
                                                        </b-card>
                                                    </template>
                                                </b-table>
                                            </div>
                                        </div>
                                    </div>
    
                                    <!--
                                    <div style="display: flex;flex-direction: column;gap: 20px;">
                                        <div style="display:flex; flex-direction: column; padding: 5px;">
                                            <div style="font-size: .8em; font-weight: bold;">linking genes</div>
                                            <div style="display: flex; gap:5px; flex-wrap: wrap;">
                                                <span v-for="gene in mechanism.genes" style="white-space: nowrap;">{{ gene }}</span>
                                            </div>
                                        </div>
                                        <div style="display:flex; flex-direction: column; padding: 5px;">
                                            <div style="font-size: .8em;">
                                                <div style="font-weight: bold;">associated genes</div>
                                            </div>
                                            <div>
                                                <b-table
                                                    small
                                                    sticky-header="225px"
                                                    :items="mechanism.aggregateGenes"
                                                    :fields="[
                                                        'gene',
                                                        {key: 'combined', label: 'Combined'},
                                                        {key: 'log_bf', label: 'GWAS Support'},
                                                        {key: 'prior', label: 'Gene Set Support'},
                                                        {key:'assocId', label: 'Association'}
                                                    ]"
                                                    style="font-size: 0.9em;"
                                                >
                                                </b-table>
                                            </div>
                                            <div>{{ mechanism.aggregateGenes.length }} total</div>
                                        </div>
                                    </div>
                                    -->
                                </div>

                                <div style="display:flex; flex-direction: column; padding: 20px; margin-top: auto;">
                                    <div style="font-size: .8em; font-weight: bold;">next steps</div>
                                    <div style="display: flex; gap:10px;">
                                        <a :href="genesLink(mechanism)" target="_blank" class="btn btn-info" style="flex:1; color:white !important; padding:10px">explore genes from this hypothesis</a>
                                        <a :href="validationLink(mechanism)" target="_blank" class="btn btn-primary" style="flex:1; color:white !important; padding:10px">plan a validation experiment</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
        
        <svg id="lines"></svg>
    </div>
</template>

<script>

import Vue from "vue";
import BootstrapVue from "bootstrap-vue";

import keyParams from "@/utils/keyParams";
import { kcURL } from "@/utils/cfdeUtils";
import { createLLMClient } from "@/utils/llmClient";
import uiUtils from "@/utils/uiUtils";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import { geoAlbers } from "d3";


Vue.use(BootstrapVue);


export default Vue.component("cfde-mechanism-discovery", {

    components: {
    },
    
    data() {
        return {
            search_step: 0, //0: search not started, 1: parsing query; 2: getting associations; 3: generating hypotheses
            searchMode: "auto",
            searchType: "terms", //terms or phenotypes
            searchApi: "new",
            associationSelectStrategy: "",
            geneSelectStrategy: "",

            userQuery: '',
            searchCriteria: null,
            associations: null,
            filteredAssociations: null,
            associationGroups: null,
            mechanisms: null,
            mechanisms_summary: null,
            association_genes_loaded: 0,

            semanticPhenotypes: null,

            loading_search_criteria: false,
            loading_associations: false,
            loading_genes: false,
            loading_mechanisms: false,

            error_search_criteria: false,
            error_msg_search_criteria: '',
            error_mechanisms: false,
            error_msg_mechanisms: '',
            error_associations: false,
            error_msg_associations: '',

            allow_retry: true,

            retry_mechanisms: 0,
            retry_extract: 0,
            retry_max: 1,

            display_examples: false,
            display_search_criteria: false,
            display_associations: false,
            display_mechanisms: true,

            edit_search_criteria: false,
            edit_associations: false,
            edit_context: false,

            total_strong_associations: null,
            total_moderate_associations: null,
            total_low_associations: null,
            total_relevant_associations: null,
            relevantAssociations: null,
            phenotypes_list: [],
            association_strengths_list: [
                { label: "Strong", text: ">1.0", total: 0 },
                { label: "Moderate ", text: "~0.1", total: 0 },
                { label: "Low", text: "<0.1", total: 0 }
            ],
            programs_list: [],
            all_filters: null,
            filtered_phenotypes: [],
            filtered_association_strengths: [],
            filtered_programs: [],

            prev_associations: null,
            prev_filtered_phenotypes: [],
            prev_filtered_association_strengths: [],
            prev_filtered_programs: [],
            prev_context: null,
            prev_search_criteria: null,
            user_selected_associations: false,
            user_edited_search_criteria: false,

            select_list: ["All", "Filtered", "Custom", "None"],
            selected_select: "Filtered",

            show_list: ["All", "Filtered", "Selected"],
            selected_show: "All",

            associations_to_select: null,
            associations_to_show: null,

            total_phenotypes: null,
            total_signatures: null,
            total_programs: null,

            terms: null,
            termsCSV: null,
            llmGroupState: '',
            llmExtractState: '',
            llmAnalysisState: '',
            parsedResponse: null,
            searchTerm: '',
            userContext: '',
            response: null,
            streamResponse: null,
            analysisGroupIdx: null,

            timer: null,
            elapsed: null,

            dots: null,
            line: null,
            lineObserver: null,

            llmExtract: null,
            llmAnalyze: null,

            fullResults: null,
            textResults: null,

            suppressFilterWatch: false,

            exampleQueries: [
                "I study motor neuron degeneration and its role in progressive neuromotor disorders",
                "Human accelerated regions and want to know how they contribute to neurodevelopment and cognition",
                "What are druggable targets for obesity?",
                "I'm looking to find mechanisms that underlie body mass index in humans and the tissues involved",
                "What novel genes might be candidates for rare congenital myopathies"
            ],

            extractSystemPropmpt: `You extract key research concepts from free-text queries.

Return a JSON object with:

* 'search_terms': a targeted list of keywords to use in a semantic search. (terms to output: min=1, max=5)
* 'research_context': a short, self-contained description of the research setting that **includes the search terms naturally**.
* 'cfde_programs': a list of CFDE programs either mentioned by the user. if none mentioned, suggest programs that may be relevant to the user's query. Each entry must be an object with:
  - 'program': program name
  - 'reason': 'requested' if specifcally mentioned in query | 'suggested' if program is relevant but not explicitly mentioned in query
  - 'relevance': a short explanation of why the program is relevant.

Guidelines:

* User queries may be verbose or contain multiple traits.
* 'Context' must be inferred from the users query, keep it short, dont add more context than absolutely necessary.
* 'Programs' - if query mentions specific CFDE Programs, select *only* those program as 'requested'. Otherwise select relevant programs as 'suggested'.
* 'Search terms' will be used to search an embedding space consisting of labels like 'gene expression siganture associated with phenotype'.
  -Heres a tiny sample of the kinds of terms that sematic search will check against:
 'abnormal sternum morphology mp associated with gcat trait bmi-adjusted hip circumference
  npy6r idg gpcr archs4 coexpression heart - left ventricle female 70-79 up associated with cardiac mri latent space
  heart - left ventricle female 40-49 up associated with cardiac mri latent space
  gpr42 idg gpcr archs4 coexpression associated with crohn's disease
  p2ry10 idg gpcr archs4 coexpression associated with eczematoid dermatitis'
 - 'search terms' should be selected to work well against this type of embedding space. 
 - **always** use 'search terms' directly asked for in the users query.
 - **avoid** duplicate keywords in 'search terms'
 - **avoid** listing program names in 'search terms'
 - **avoid** 'search terms' that do not aid in searcing for a phenotype or expression signature
* Return only JSON. No extra text or explanation.

---

### CFDE Programs

* 'komp': (KOMP) Knockout mouse **phenotype** data spanning **metabolism**, **clinical chemistry**, **immunology**, **cardiovascular**, **neurology**, **vision**, **auditory**, **skeletal**, and **pathology** assays. Includes **genotypes**, **lacZ reporter patterns**, and models for **cancer**, **diabetes**, and **obesity**.  
* 'motrpac': (MoTrPAC) **Multi-omics** from **rats** and **humans** before and after **exercise**. Covers **genomics**, **epigenomics**, **transcriptomics**, **proteomics**, and **metabolomics** from **blood and plasma**, revealing molecular markers of **fitness**, **insulin sensitivity**, and **metabolic adaptation**.  
* 'glygen': (GlyGen) Integrated data on **glycans** and **glycoconjugates** (e.g., **glycoproteins**, **glycolipids**). Includes **structures**, **enzymes** (glycosyltransferases, glycosidases), and links from **glycomics/proteomics** to **tissue expression** and diseases (**cancer**, **infection**, **CDG**).  
* 'gtex_tissues': (GTEx tissues) Reference **RNA-seq** dataset on **human tissues**, linking **gene expression** to **genotypes** via **eQTLs** and **sQTLs**. If including 'gtex_tissues' **always** include 'kc_diffexp' program and use the same reason.
* 'gtex_aging': (GTEx aging) Subset of GTEx focusing on **age-related** changes in **gene expression** to define **molecular aging signatures**.  
* 'idg_targets': (IDG target proteins) Data on **understudied druggable proteins** (GPCRs, ion channels, kinases), with tools like **probes** and **antibodies** supporting **drug discovery**.  
* 'idg_coexp': (IDG coexpression) **RNA-seq**-based **co-expression networks** used to infer **functions** of **understudied proteins**.  
* 'lincs_chem': (LINCS chemical compounds) **Gene/protein signatures** from cell lines exposed to **drugs/compounds** (via **L1000 assay**). Used to study **mechanisms**, **toxicology**, and **drug repurposing**.  
* 'lics_ko': (LINCS gene knockout) **Cellular signatures** from **gene knockouts/perturbations** (CRISPR, shRNA, overexpression), linking to **gene function**.  
* 'kc_diffexp': (Knowledge Center GTEx differential expression) **More GTEx tissues**, like 'gtex_tissues' referenceing **RNA-seq** dataset on **human tissues**, linking **gene expression** to **genotypes** via **eQTLs** and **sQTLs**.  
---

### Example

**Input:**
energy balance with indirect calorimetry  

**Output:**
{
  "search_terms": ["energy balance"],
  "research_context": "investigating energy balance using indirect calorimetry",
  "cfde_programs": [
    {
      "program": "komp",
      "reason": "suggested",
      "relevance": "includes metabolic and physiology phenotypes such as energy balance"
    },
    {
      "program": "motrpac",
      "reason": "suggested",
      "relevance": "captures metabolic adaptation and physiology through multi-omics"
    }
  ]
}

--

**IMPORTANT**: if a users query is completely unrelated to the subject of biological research, return only the following:
{
   "error": "Query unrelated to biological research."
}

`,

            extractSystemPropmpt2: `You extract key research concepts from free-text queries.

Return a JSON object with:

* 'search_terms': a targeted list of keywords to use in a semantic search. (terms to output: min=1, max=5)
* 'research_context': a short, self-contained description of the research setting that **includes the search terms naturally**.
* 'search_type': a classification of whether the users query intent is centering on 'phenotypes' or 'mechanisms'


Guidelines:

* User queries may be verbose or contain multiple traits.
* 'Context' must be inferred from the users query, keep it short, dont add more context than absolutely necessary.
* 'Search terms' will be used to search an embedding space consisting of either:
 - a. 'phenotypes': phenotype labels
 -- for example: 'Motor neuron disease', 'Parkinson's disease progression', etc.
 - b. 'mechanisms': phenoptype and associated gene set signature labels
 -- for example: 'Genetic neurodegenerative disease. Genes whose knockout in mice results in abnormal locomotor behavior.', 'Rare dementia. Genes whose knockout in mice results in abnormal locomotor behavior.'
 - 'search terms' should be selected to work well against this type of embedding space. 
 - **always** use 'search terms' directly asked for in the users query.
 - **avoid** duplicate keywords in 'search terms'
 - **avoid** listing program names in 'search terms'
 - **avoid** 'search terms' that do not aid in searcing for a phenotype or expression signature
* Return only JSON. No extra text or explanation.

---

### Example

**Input:**
energy balance with indirect calorimetry  

**Output:**
{
  "search_terms": ["energy balance"],
  "research_context": "investigating energy balance using indirect calorimetry",
  "search_type": "mechanisms"
}

--

**IMPORTANT**: if a users query is completely unrelated to the subject of biological research, return only the following:
{
   "error": "Query unrelated to biological research."
}

`,

            extractSystemPropmpt3: `You extract key biological research concepts from free-text queries.

The following inference will be used to semnatically search a database of phentoypes and associated functional annotations
and in a subsequest step, to select associations and their genes from those search results relevant to a given query.

Return a JSON object with:
* 'phenotype_terms': a targeted list of phenotype-related keywords to use for semantic search. (terms: min=1, max=3)
* 'mechanism_terms': a targeted list of mechanism- or process-related keywords to use for semantic search. (terms: min=1, max=3)
* 'association_selection_strategy': A short set of 1-3 concise sentences describing what kinds of associations subsequent step should prioritize based on the query. Instructions should reference phenotype alignment, mechanism alignment, tissue/assay relevance, and gene-pattern relevance.
* 'gene_selection_strategy': A short set of 1-3 concise sentences describing what kinds of genes LLM #2 should prioritize when forming hypotheses. Instructions should reference recurrence across associations, mechanistic fit, phenotype relevance, and experimental suitability.
* 'search_type': a classification of whether the core intent of the query centers on 'phenotypes', 'mechanisms', or 'both'.
* 'research_context': a short, self-contained description of the research setting that naturally incorporates the phenotype and mechanism terms.

Guidelines:

* 'Context' must be inferred from the users query, keep it short, dont add more context than absolutely necessary.
* 'phenotype_terms' will be used to search an embedding space consisting of labels like:
    'Motor neuron disease', 'Parkinson's disease progression', etc.
* 'phenotype_terms' will be used to search an embedding space consisting of labels like:
    'Genetic neurodegenerative disease. Genes whose knockout in mice results in abnormal locomotor behavior.', 'Rare dementia. Genes whose knockout in mice results in abnormal locomotor behavior.'
 - **always** use 'terms' directly asked for in the users query when you can.
 - **avoid** duplicate keywords in 'search terms'
 - **avoid** listing program names in 'search terms'
 - **avoid** 'search terms' that do not aid in searcing for a phenotype or expression signature
* Return only JSON. No extra text or explanation.

---

### Example

**Input:**
energy balance with indirect calorimetry  

**Output:**
{ 
    "phenotype_terms": ["energy balance"], 
    "mechanism_terms": ["indirect calorimetry"], 
    "association_selection_strategy": "Prioritize associations involving metabolic rate or whole-body energy balance. Look for signatures describing energy expenditure or mitochondrial function. Select associations related to metabolic tissues such as adipose or liver when relevant.", 
    "gene_selection_strategy": "Highlight genes recurring in energy-expenditure signatures that relate to metabolic regulation. Emphasize genes linked to mitochondrial activity or whole-body energy balance.", 
    "search_type": "mechanisms", 
    "research_context": "investigating energy balance using indirect calorimetry" 
}

--

**IMPORTANT**: if a users query is completely unrelated to the subject of biological research, return only the following:
{
   "error": "Query unrelated to biological research."
}

`,

            groupSystemPrompt2: `You are an expert in **bioinformatics** and **semantic annotation**.

You will be given a csv table of **gene set-phenotype associations**, each with:

* a unique **id**
* a **source** representing the CFDE program the signature was derived from
* a **phenotype** containing a phenotype
* a **signature** containing a gene expression signature
* a list of **genes** which are associated with both the signature and the phenotype

You will also be given a **research context** describing the biological topic of interest.

Your task is to generate **mechanistic hypotheses** that integrate across associations and are relevant to the research context.

---

## Mechanistic Hypothesis Rules

* Hypotheses should integrate **multiple associations** to suggest plausible **mechanisms** linking gene signatures, phenotypes, and programs.
* Mechanisms should be **inferred** from the associations, not just restatements. For example:
  * GOOD “Reduced expression of mitochondrial complex I genes across adipose and brain tissues suggests impaired oxidative phosphorylation, leading to altered substrate oxidation and reduced metabolic rate.”
  * BAD “Association between ND1 and disorder of energy metabolism” (too literal, no mechanistic inference).
* Groupings should prioritize **shared phenotypes** or **shared source programs** that yield the strongest mechanistic story.
* Each grouping should highlight a **subset of genes** that are common across its associations (not the full list).
* Prefer hypotheses that link to the **research context** (e.g., energy balance, substrate oxidation, metabolic rate).
* Group names should be written in **headline style** (short, punchy, minimal jargon).
* The 'hypothesis' field should be a **short-form version** (1-2 sentences, concise, plain-language).
* Include a 'validation' field suggesting a brief experiment or analysis that could be used to test the hypothesis.
* Include a 'justification' field for each hypothesis that explains why this particular group of associations was selected from the overall set.
* **Never** use 'term ids' in your explanations, mention either the 'signature' or 'phenotype' instead.
* **IMPORTANT** **NEVER** select any term / association for analysis that does not include genes
---

## CFDE Program Details

* **komp**: (KOMP) Knockout mouse **phenotype** data spanning **metabolism**, **clinical chemistry**, **immunology**, **cardiovascular**, **neurology**, **vision**, **auditory**, **skeletal**, and **pathology** assays. Includes **genotypes**, **lacZ reporter patterns**, and models for **cancer**, **diabetes**, and **obesity**.
* **motrpac**: (MoTrPAC) **Multi-omics** from **rats** and **humans** before and after **exercise**. Covers **genomics**, **epigenomics**, **transcriptomics**, **proteomics**, and **metabolomics** from **blood and plasma**, revealing molecular markers of **fitness**, **insulin sensitivity**, and **metabolic adaptation**.
* **glygen**: (GlyGen) Integrated data on **glycans** and **glycoconjugates** (e.g., **glycoproteins**, **glycolipids**). Includes **structures**, **enzymes** (glycosyltransferases, glycosidases), and links from **glycomics/proteomics** to **tissue expression** and diseases (**cancer**, **infection**, **CDG**).
* **gtex_tissues**: (GTEx tissues) Reference **RNA-seq** dataset on **human tissues**, linking **gene expression** to **genotypes** via **eQTLs** and **sQTLs**. 
* **gtex_aging**: (GTEx aging) Subset of GTEx focusing on **age-related** changes in **gene expression** to define **molecular aging signatures**.
* **idg_targets**: (IDG target proteins) Data on **understudied druggable proteins** (GPCRs, ion channels, kinases), with tools like **probes** and **antibodies** supporting **drug discovery**.
* **idg_coexp**: (IDG coexpression) **RNA-seq**-based **co-expression networks** used to infer **functions** of **understudied proteins**.
* **lincs_chem**: (LINCS chemical compounds) **Gene/protein signatures** from cell lines exposed to **drugs/compounds** (via **L1000 assay**). Used to study **mechanisms**, **toxicology**, and **drug repurposing**.
* **lics_ko**: (LINCS gene knockout) **Cellular signatures** from **gene knockouts/perturbations** (CRISPR, shRNA, overexpression), linking to **gene function**.
* **kc_diffexp**: (Knowledge Center GTEx differential expression) **More GTEx tissues**, like 'gtex\_tissues' referencing **RNA-seq** dataset on **human tissues**, linking **gene expression** to **genotypes** via **eQTLs** and **sQTLs**.

---

## Output Format

Return a structured **JSON object** following this schema:
{
    "overall_summary": "High-level explanation (<3 sentences, plain language) of how the generated hypotheses connect to the research context and CFDE programs used",
    "hypotheses": [
        {
            "group_name": "Short, headline-style descriptive name",
            "hypothesis": "Concise, plain-language mechanistic hypothesis (1-2 sentences)",
            "relevance": "Brief reason this matters for the research context",
            "validation": "Suggested experiment or analysis to test this hypothesis",
            "justification": "Brief reason why this particular group of associations was chosen from the full set"
            "impact_score": 1,
            "novelty_score": 1,
            "ids": ["term_xxxx", "term_yyyy", "..."],
            "genes": ["GENE1", "GENE2", "GENE3"]
        }
    ]
}


---

## Scoring Guidelines

* **impact_score**: 1-5 (1 = low, 5 = very high). Reflects how impactful this finding would be for the research field.
* **novelty_score**: 1-5 (1 = well established, 5 = highly novel). Reflects how novel this finding would be relative to known research.
* **relevance**: Keep concise; focus on why this hypothesis matters for the specific research context.

---

## Guidelines

* Use only information from the input (no fabrication).
* Every group must include at least one **term id** in 'ids'.
* Always include at least **2-5 shared genes** in 'genes' if possible.
* **NEVER** include genes that are not part of a term / association.
* Return only the raw JSON array as plain text — no explanations, markdown, or code block syntax.`,

            groupSystemPrompt3: `You are an expert in **bioinformatics** and **semantic annotation**.

You will be given a csv list of of **gene set-phenotype associations**, each with:

* a unique **id**
* a **source** representing the CFDE program the signature was derived from
* a **phenotype** containing a phenotype
* a **signature** containing an annotation of a gene set
* a list of **genes** which are associated with both the gene set and the phenotype

some phenotypes will be association with multiple, various gene sets

You will also be given a **research context** describing the biological topic of interest.

Your task is to generate up to 3 **mechanistic hypotheses** that integrate groups of associations that are **relevant to the research context**.
And to suggest a set of candiadate genes from the group of associations selected for each hypothesis for further analysis that are also **relevant to the research context**

---

## Mechanistic Hypothesis Rules

* Hypotheses should integrate **multiple associations** to suggest plausible **mechanisms** linking gene signatures, phenotypes, programs, and genes.
* Mechanisms should be **inferred** from the associations, not just restatements. For example:
  * GOOD “Reduced expression of mitochondrial complex I genes across adipose and brain tissues suggests impaired oxidative phosphorylation, leading to altered substrate oxidation and reduced metabolic rate.”
  * BAD “Association between ND1 and disorder of energy metabolism” (too literal, no mechanistic inference).
* Groupings should prioritize **shared phenotypes** or **shared source programs** that yield the strongest mechanistic story.
* Each grouping should highlight a **subset of condidate genes** that are common across its associations (not the full list).
* Each candidate gene should include a rason why it was chosen as a candidate.
* Prefer hypotheses that link to the **research context** (e.g., energy balance, substrate oxidation, metabolic rate).
* Group names should be written in **headline style** (short, punchy, minimal jargon).
* The 'hypothesis' field should be a **short-form version** (1-2 sentences, concise, plain-language).
* Include a 'justification' field for each hypothesis that explains why this particular group of associations was selected from the overall set.
* **Never** use 'term ids' in your explanations, mention either the 'signature' or 'phenotype' instead.
* **IMPORTANT** **NEVER** select any term / association for analysis that does not include genes
---

## CFDE Program Details

* **komp**: (KOMP) Knockout mouse **phenotype** data spanning **metabolism**, **clinical chemistry**, **immunology**, **cardiovascular**, **neurology**, **vision**, **auditory**, **skeletal**, and **pathology** assays. Includes **genotypes**, **lacZ reporter patterns**, and models for **cancer**, **diabetes**, and **obesity**.
* **motrpac**: (MoTrPAC) **Multi-omics** from **rats** and **humans** before and after **exercise**. Covers **genomics**, **epigenomics**, **transcriptomics**, **proteomics**, and **metabolomics** from **blood and plasma**, revealing molecular markers of **fitness**, **insulin sensitivity**, and **metabolic adaptation**.
* **glygen**: (GlyGen) Integrated data on **glycans** and **glycoconjugates** (e.g., **glycoproteins**, **glycolipids**). Includes **structures**, **enzymes** (glycosyltransferases, glycosidases), and links from **glycomics/proteomics** to **tissue expression** and diseases (**cancer**, **infection**, **CDG**).
* **gtex_tissues**: (GTEx tissues) Reference **RNA-seq** dataset on **human tissues**, linking **gene expression** to **genotypes** via **eQTLs** and **sQTLs**. 
* **gtex_aging**: (GTEx aging) Subset of GTEx focusing on **age-related** changes in **gene expression** to define **molecular aging signatures**.
* **idg_targets**: (IDG target proteins) Data on **understudied druggable proteins** (GPCRs, ion channels, kinases), with tools like **probes** and **antibodies** supporting **drug discovery**.
* **idg_coexp**: (IDG coexpression) **RNA-seq**-based **co-expression networks** used to infer **functions** of **understudied proteins**.
* **lincs_chem**: (LINCS chemical compounds) **Gene/protein signatures** from cell lines exposed to **drugs/compounds** (via **L1000 assay**). Used to study **mechanisms**, **toxicology**, and **drug repurposing**.
* **lics_ko**: (LINCS gene knockout) **Cellular signatures** from **gene knockouts/perturbations** (CRISPR, shRNA, overexpression), linking to **gene function**.
* **kc_diffexp**: (Knowledge Center GTEx differential expression) **More GTEx tissues**, like 'gtex\_tissues' referencing **RNA-seq** dataset on **human tissues**, linking **gene expression** to **genotypes** via **eQTLs** and **sQTLs**.

---

## Output Format

Return a structured **JSON object** following this schema:
{
    "overall_summary": "High-level explanation (<3 sentences, plain language) of how the generated hypotheses connect to the research context and CFDE programs used",
    "hypotheses": [
        {
            "group_name": "Short, headline-style descriptive name",
            "hypothesis": "Concise, plain-language mechanistic hypothesis (1-2 sentences)",
            "relevance": "Brief reason this hypothesis matters for the research context",
            "justification": "Brief reason why this particular group of associations was chosen from the full set",
            "ids": ["term_xxxx", "term_yyyy", "..."],
            "genes": [{
                "gene": "GENE1",
                "reason": "Short, reason why this gene was selected in relation to hypothesis and users research context."
            }, ...],
            "genes_reason": "Very brief, explanation of what the selected genes collectively indicate about the proposed mechanism—such as the pathway they point to, the biological process they highlight, or how they provide a focused starting point for downstream analysis related to the research context."
        }
    ]
}


---

## Guidelines

* Use only information from the input (no fabrication).
* Every group must include at least one **term id** in 'ids'.
* **NEVER** include genes that are not part of a term / association.
* Return only the raw JSON array as plain text — no explanations, markdown, or code block syntax.`,
        };
    },
    
    created() {
        this.llmExtract = createLLMClient({
            llm: "openai",
            model: "gpt-5-nano",
            system_prompt: this.extractSystemPropmpt3
        });

        this.llmAnalyze = createLLMClient({
            llm: "openai",
            model: "gpt-5-mini",
            system_prompt: this.groupSystemPrompt3
        });
    },

    mounted() {
        if(keyParams.query){
            this.userQuery = keyParams.query;
        }
        this.$refs.query.focus();
        this.initLines();
        window.addEventListener("resize", this.updateLinePositions);
        window.addEventListener("scroll", this.updateLinePositions);
    },

    beforeDestroy() {
        this.stopTimer();
        window.removeEventListener("resize", this.updateLinePositions);
        window.removeEventListener("scroll", this.updateLinePositions);
    },

    computed: {
        temp_selected_associations(){
            if(!this.associations) return;
            return this.associations.filter(item => item.selected).length;
        }
    },

    watch: {
        /*filtered_programs: 'updateSelectedRows',
        filtered_phenotypes: 'updateSelectedRows',
        filtered_association_strengths: 'updateSelectedRows',*/
        filtered_phenotypes(newVal, oldVal) {
            if (this.suppressFilterWatch) return;
            const diff = this.diffArray(newVal, oldVal);
            if (diff) this.updateSelectedRows('phenotype', diff);
        },
        filtered_programs(newVal, oldVal) {
            if (this.suppressFilterWatch) return;
            const diff = this.diffArray(newVal, oldVal);
            if (diff) this.updateSelectedRows('source', diff);
        },
        filtered_association_strengths(newVal, oldVal) {
            if (this.suppressFilterWatch) return;
            const diff = this.diffArray(newVal, oldVal);
            if (diff) this.updateSelectedRows('strength', diff);
        }
    },

    methods: {
        kcURL,
        ...uiUtils,
        alert(text){
            alert(text);
        },
        wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        showByorTab(){
            const TAB = 'research_method';
			const CONTENT = 'research_method_content';
			const TAB_WRAPPER = 'rp_tabs';
			const CONTENT_WRAPPER = 'rp_tabs_contents';
            uiUtils.showTabContent(TAB, CONTENT, TAB_WRAPPER, CONTENT_WRAPPER);
            
        },
        clean(){
            this.search_step = 0;
            this.searchTerm = '';
            this.associationSelectStrategy = '';
            this.geneSelectStrategy = '';

            this.searchCriteria = null;
            this.associations = null;
            this.filteredAssociations = null;
            this.associationGroups = null;
            this.response = null;
            this.mechanisms = null;
            this.mechanisms_summary = null;
            this.association_genes_loaded = 0;

            this.semanticPhenotypes = null;

            this.total_strong_associations = null;
            this.total_moderate_associations = null;
            this.total_low_associations = null;
            this.total_relevant_associations = null;
            this.relevantAssociations = null;
            this.phenotypes_list = [];
            this.programs_list = [];
            this.association_strengths_list = [
                { label: "Strong", text: ">1.0", total: 0 },
                { label: "Moderate ", text: "~0.1", total: 0 },
                { label: "Low", text: "<0.1", total: 0 }
            ],
            this.all_filters = null;
            this.filtered_phenotypes = [];
            this.filtered_association_strengths = [];
            this.filtered_programs = [];

            this.prev_associations = null;
            this.prev_filtered_phenotypes = [];
            this.prev_filtered_association_strengths = [];
            this.prev_filtered_programs = [];
            this.prev_context = null;
            this.prev_search_criteria = null;
            this.user_selected_associations = false;
            this.user_edited_search_criteria = false;

            this.selected_select = "Filtered";
            this.selected_show = "All";

            this.associations_to_select = null;
            this.associations_to_show = null;

            this.loading_search_criteria = false;
            this.loading_associations = false;
            this.loading_genes = false;
            this.loading_mechanisms = false;

            this.error_search_criteria = false,
            this.error_msg_search_criteria = '',
            this.error_mechanisms = false;
            this.error_msg_mechanisms = '';
            this.error_associations = false;
            this.error_msg_associations = '';

            this.allow_retry = true;

            this.retry_mechanisms = 0;
            this.retry_extract = 0;

            this.edit_search_criteria = false;
            this.edit_associations = false;
            this.edit_context = false;

            this.display_examples = false;
            this.display_search_criteria = false;
            this.display_associations = false;
            this.display_mechanisms = true;

            this.total_phenotypes = null;
            this.total_signatures = null;
            this.total_programs = null;

            this.fullResults = null;
            this.textResults = null;

            this.setLineDotted(1);
            this.setLineDotted(2);
            this.setLineDotted(3);

            this.stopTimer();
        },

        //
        //
        //
        // flow handlers
        //
        //
        //
        queryParse(query){
            this.clean();

            console.log('parse query', query);
            if(!query.trim()){
                console.log('query missing');
                return;
            }

            //keyParams.query = query;
            this.userQuery = query;

            this.beginFlow();
        },

        async beginFlow(){
            this.updateStep(1, 'start');

            this.startTimer(1, () => {this.handleExtractTimeout()});

            this.llmExtract.sendPrompt({
                userPrompt: this.userQuery,
                onToken: this.onExtractToken,
                onResponse: this.onExtractResponse,
                onState: this.onExtractState,
                onError: this.onExtractError,
                onEnd: this.onExtractEnd
            });
        },

        async phenotypeSearch(term){
            //semantic search for phenotypes
            //const url = `https://api.kpndataregistry.org:5002/api/search/phenotypes?q=${encodeURIComponent(term)}&similarity_threshold=-0.1`
            const url = `https://search.hugeamp.org/api/search/pgvector/phenotypes?q=${encodeURIComponent(term)}&portal=cfde`
            const response =  await fetch(url);

            if (!response.ok) {
                this.updateStep(this.search_step, 'error', "An error occured");
                //new Error("Fetch error:" + response.statusText);
                return;
            }

            const res = await response.json();
            const data = res.results;
            data.sort((a, b) => b.score - a.score);
            console.log('raw phenotype search results', data);

            const trimmedData = structuredClone(data);

            //return;

            if(trimmedData.length > 10){
                console.log('more than 10 phenotypes returned, sorting by score and trimming to 10 max');
                trimmedData.splice(10);
            }

            console.log('trimmed phenotype search results', trimmedData);

            this.semanticPhenotypes = trimmedData;

            const associations = [];

            //get the associations for those phenotypes
            console.log(`getting associations for ${trimmedData.length} phenotypes`);
            await Promise.allSettled(
                trimmedData.map(async item => {
                    const url = `https://cfde-dev.hugeampkpnbi.org/api/bio/query/pigean-gene-set-phenotype?q=${item.id},cfde`
                    const response =  await fetch(url);

                    if (!response.ok) {
                        new Error("Fetch error:" + response.statusText);
                        return;
                    }

                    const res = await response.json();
                    //const data = res.data;
                    const sortedData = res.data.slice(0,100).sort((a, b) => b.beta_uncorrected - a.beta_uncorrected);
                    const data = sortedData.map(d => ({ ...d, score: item.score, description: item.description }));

                    associations.push(...data, item.score);
                })
            )

            //const sortedArray = [...associations].sort((a, b) => b.beta_uncorrected - a.beta_uncorrected);
            const sortedArray = [...associations].sort((a, b) => b.score - a.score);

            //console.log('associations by phenotype', sortedArray);

            return sortedArray;
        },

        async termSearch(term){
            //semantic search for trait associations
            //const url = this.searchApi==='new' ? `https://api.kpndataregistry.org:5002/api/search/terms?q=${encodeURIComponent(term)}&similarity_threshold=-0.5`
            //                                   : `https://api.kpndataregistry.org:8000/api/search/terms?q=${encodeURIComponent(term)}&similarity_threshold=-0.5`
            const url = `https://search.hugeamp.org/api/search/pgvector/terms?q=${encodeURIComponent(term)}&table-name=terms_cfde_all_mpnet_base_v2&top_k=1000`;
            
            try{
                const response =  await fetch(url);
    
                if (!response.ok) {
                    this.updateStep(this.search_step, 'error', "An error occured");
                    //new Error("Fetch error:" + response.statusText);
                    return;
                }
    
                const res = await response.json();
                const data = res.results;
    
                console.log('raw term search results', data);
    
                //sort by similarity score
                //const sortedArray = [...data].sort((a, b) => b.beta_uncorrected - a.beta_uncorrected);
                const sortedArray = [...data].sort((a, b) => b.score - a.score);

                //console.log('associations by term', sortedArray)
    
                return sortedArray;
            }catch(err){
                this.updateStep(this.search_step, 'error', "An error occured");
                return;
            }
        },

        async associationSearch(term){
            console.log('searching for', term);
            this.updateStep(2, 'start');
            this.display_search_criteria = false;
            this.searchTerm = term;
            console.log('searchType', this.searchType);
            if(this.searchType==="terms"){
                const termAssociations = await this.termSearch(term);
                console.log('associations by term', termAssociations);
                //todo, some associations dont contain any genes
                //for now, remove those by excluding associations where beta=0
                //unfortunately terms endpoint doesnt inlcude beta score, only beta_uncorrected
                //const termAssociationsFiltered = termAssociations.filter(x => x.beta !== 0)
                if(!termAssociations || termAssociations.length===0) return;
                const termAssociationsTransformed = this.transformTermAssociations(termAssociations);
                console.log('associations by term transformed', termAssociationsTransformed);
                this.associations = termAssociationsTransformed;
            }else{
                const phenotypeAssociations = await this.phenotypeSearch(term);
                console.log('associations by phenotype', phenotypeAssociations);
                if(!phenotypeAssociations || phenotypeAssociations.length===0) return;
                const phenotypeAssociationsTransformed = this.transformPhenotypeAssociations(phenotypeAssociations);
                const phenotypeAssociationsSorted = [...phenotypeAssociationsTransformed].sort((a, b) => {
                    //console.log('score', typeof a.score);
                    return (b.score ?? 0) - (a.score ?? 0)
                });
                console.log('associations by phenotype transformed', phenotypeAssociationsSorted);
                this.associations = phenotypeAssociationsSorted;
            }
            //await this.wait(3000);

            //console.log('transformed search results', this.associations);

            //initial filtering for analysis

            const allPhenotypeGroup = this.groupBy(this.associations, 'phenotype');
            const allSenesetGroup = this.groupBy(this.associations, 'gene_set');
            let allSourceGroup = null;
            if(this.searchType==="terms"){
                allSourceGroup = this.groupBy(this.associations, 'source');
            }else{
                allSourceGroup = this.groupBy(this.associations, 'gene_set_program');
            }

            this.total_phenotypes = Object.keys(allPhenotypeGroup).length;
            this.total_signatures = Object.keys(allSenesetGroup).length;
            //this.total_programs = Object.keys(allSourceGroup).length;

            console.log({allPhenotypeGroup, allSenesetGroup, allSourceGroup})

            this.phenotypes_list = [...new Set(this.associations.map(d => d.phenotype))];//Object.keys(allPhenotypeGroup).sort();
            this.programs_list = Object.keys(allSourceGroup).sort();    

            //this.total_programs = [...new Set(this.programs_list.flatMap(s => s.split('_x_')))].length;
            const programs_list_set = [...new Set(this.programs_list.flatMap(s => s.split(';')))];
            
            this.total_programs = programs_list_set.length;

            console.log({programs_list_set});

            this.all_filters = {
                phenotypes: this.filtered_phenotypes, 
                strengths: this.filtered_association_strengths,
                sources: this.filtered_programs
            }

            this.filtered_phenotypes = this.phenotypes_list;
        
            this.filtered_programs = this.programs_list;

            //console.log('getting strong associations');

            //first get only strong associations
            //this.filtered_association_strengths.push(0);
            const strongAssociations = this.associations.filter(association => association.beta_uncorrected >= 1);
            const moderateAssociations = this.associations.filter(association => association.beta_uncorrected >= 0.1 && association.beta_uncorrected < 1);
            const lowAssociations = this.associations.filter(association => association.beta_uncorrected < 0.1);

            //this.total_strong_associations = strongAssociations.length;
            //this.total_moderate_associations = moderateAssociations.length;
            //this.total_low_associations = lowAssociations.length;

            this.association_strengths_list[0].total = strongAssociations.length;
            this.association_strengths_list[1].total = moderateAssociations.length;
            this.association_strengths_list[2].total = lowAssociations.length;

            if(strongAssociations.length>0) this.filtered_association_strengths.push(0);
            if(moderateAssociations.length>0) this.filtered_association_strengths.push(1);
            if(lowAssociations.length>0) this.filtered_association_strengths.push(2);
            
            //this.filtered_association_strengths = [0,1,2];

            let relevantAssociations = [];
            /*
            if(strongAssociations.length>0){
                this.filtered_association_strengths.push(0);
                relevantAssociations.push(...strongAssociations);
            }

            if(relevantAssociations.length<25 && moderateAssociations.length>0){
                this.filtered_association_strengths.push(1);
                relevantAssociations.push(...moderateAssociations);
            }

            if(relevantAssociations.length<25 && lowAssociations.length>0){
                this.filtered_association_strengths.push(2);
                relevantAssociations.push(...lowAssociations);
            }

            //from those, get only requested programs (if any)
            if(this.filtered_programs.length > 0){
                console.log('filtering sources', this.filtered_programs)
                relevantAssociations = relevantAssociations.filter(item => this.filtered_programs.includes(item.source));
            }else{
                //otherwise, select all programs
                this.filtered_programs = this.programs_list;
            }

            console.log('filters', this.all_filters)

            this.total_strong_associations = strongAssociations.length;
            this.total_moderate_associations = moderateAssociations.length;
            this.total_low_associations = lowAssociations.length;

            if(relevantAssociations.length>300){
                console.log(`selected ${relevantAssociations.length} associations, trimming down to 300`);
                relevantAssociations.splice(300);
            }
            */
            relevantAssociations = this.associations.slice(0, 300);

            this.total_relevant_associations = relevantAssociations.length;

            console.log('associations for analysis', relevantAssociations);

            //update selected associations in full list
            const idsToSelect = new Set(relevantAssociations.map(item => item.id));
            this.associations.forEach(item => {
                if (idsToSelect.has(item.id)) {
                    item.selected = true;
                }
            });

            this.associations = [...this.associations];

            console.log('selected associations', this.associations.filter(item => item.selected).length);

            this.relevantAssociations = relevantAssociations;

            this.updateSelectedFilters();

            this.updateStep(2, 'end');

            //return;
            if(this.searchMode==='step'){
                this.display_associations = true;
                return;
            }else{
                this.mechanismsReveal();
            }
        },

        diffArray(newVal, oldVal) {
            const added   = newVal.filter(v => !oldVal.includes(v));
            const removed = oldVal.filter(v => !newVal.includes(v));

            if (added.length)   return { type: 'add', values: added };
            if (removed.length) return { type: 'remove', values: removed };

            return null;
        },

        updateSelectedFilters(doSuppressWatch=false){
            //suppress watchers to prevent infinite loop
            if(doSuppressWatch) this.suppressFilterWatch = true;

            const strengthRanges = {
                0: [1, Infinity],   // strong
                1: [0.1, 1],        // moderate
                2: [0, 0.1]         // low
            };
            const selectedAssociations = this.associations.filter(d => d.selected);
            const selectedPhenotypes = [...new Set(selectedAssociations.map(d => d.phenotype))];
            let selectedSources;
            if(this.searchType==='terms'){
                selectedSources = [...new Set(selectedAssociations.map(d => d.source))];
            }else{
                selectedSources = [...new Set(selectedAssociations.map(d => d.gene_set_program))];
            }
            const selectedStrengths = [...new Set(selectedAssociations.map(d => {
                        const val = parseFloat(d.beta_uncorrected);

                        // Find which range it falls into
                        for (const [strength, [min, max]] of Object.entries(strengthRanges)) {
                            if (val >= min && val < max) {
                                return Number(strength);   // ensure numeric key
                            }
                        }
                        return null; // fallback if no range matches
                    }).filter(s => s !== null)
                )
            ];
            this.filtered_programs = selectedSources;
            this.filtered_phenotypes = selectedPhenotypes;
            this.filtered_association_strengths = selectedStrengths;
            
            this.$nextTick(() => {
                this.suppressFilterWatch = false;
            });
        },
        updateSelectedRows(filterType=null, diff=null) {
            if(!this.associations) return;
            if(!this.edit_associations) return;

            const sources = this.filtered_programs;
            const phenotypes = this.filtered_phenotypes;
            const strengths = this.filtered_association_strengths;
            const strengthRanges = {
                0: [1, Infinity],   // strong
                1: [0.1, 1],        // moderate
                2: [0, 0.1]         // low
            };

            if(!filterType && !diff){
                this.associations.forEach(row => {
                    const beta = parseFloat(row.beta_uncorrected);
                    let rowSource = row.source;
                    if(this.searchType!=='terms'){
                        rowSource = row.gene_set_program;
                    }
                    const sourceMatch = sources.length > 0 && sources.includes(rowSource);
                    const phenoMatch  = phenotypes.length > 0 && phenotypes.includes(row.phenotype);
                    const strengthMatch =
                    strengths.length > 0 &&
                    strengths.some(opt => {
                        const [min, max] = strengthRanges[opt];
                        return beta >= min && beta <= max;
                    });
    
                    row.selected = sourceMatch && phenoMatch && strengthMatch;
                    //row.selected = phenoMatch;
                });
            }

            if(!diff) return;

            const { type, values } = diff;

            this.associations.forEach(row => {

                if (filterType === 'phenotype') {
                    if (type === 'add' && values.includes(row.phenotype)) row.selected = true;
                    if (type === 'remove' && values.includes(row.phenotype)) row.selected = false;
                }

                if (filterType === 'source') {
                    let rowSource = row.source
                    if(this.searchType!=='terms'){
                        rowSource = row.gene_set_program;
                    }
                    if (type === 'add' && values.includes(rowSource)) row.selected = true;
                    if (type === 'remove' && values.includes(rowSource)) row.selected = false;
                }

                if (filterType === 'strength') {
                    const beta = parseFloat(row.beta_uncorrected);
                    const rowStrength = Object.entries(strengthRanges).find(([key, [min, max]]) => {
                        return beta >= min && beta < max;
                    })?.[0];

                    if (type === 'add' && values.includes(Number(rowStrength))) row.selected = true;
                    if (type === 'remove' && values.includes(Number(rowStrength))) row.selected = false;
                }
            });

            this.updateSelectedFilters(true);
        },

        selectAll(group=null){
            if(group==='sources' || !group) this.filtered_programs = this.programs_list;
            if(group==='phenotypes' || !group) this.filtered_phenotypes = this.phenotypes_list;
            if(group==='strengths' || !group) this.filtered_association_strengths = this.association_strengths_list.map((obj, i) => (obj.total > 0 ? i : -1)).filter(i => i !== -1);
            this.updateSelectedRows();
        },
        deselectAll(group=null){
            if(group==='sources' || !group) this.filtered_programs = [];
            if(group==='phenotypes' || !group) this.filtered_phenotypes = [];
            if(group==='strengths' || !group) this.filtered_association_strengths = [];
            this.updateSelectedRows();
        },

        associationsFilter(row, filters) {
            // guard against missing filter object
            if (!filters) return true;

            // beta_uncorrected / strength range filter (if defined)

            if (Array.isArray(filters.strengths) && filters.strengths.length) {
                const beta = parseFloat(row.beta_uncorrected);
                let min = 0;
                if(filters.strengths.includes(2)) min = 0;
                if(filters.strengths.includes(1)) min = 0.1;
                if(filters.strengths.includes(0)) min = 1;
                let max = Infinity
                if(filters.strengths.includes(2)) max = 0.1;
                if(filters.strengths.includes(1)) max = 1;
                if(filters.strengths.includes(0)) max = Infinity;
                console.log({min, max})
                if (isFinite(min) && beta < min) return false;
                if (isFinite(max) && beta > max) return false;
            }

            // phenotype filter
            if (filters.phenotypes?.length && !filters.phenotypes.includes(row.phenotype)) {
                return false;
            }

            // source filter
            if (filters.sources?.length && !filters.sources.includes(row.source)) {
                return false;
            }

            return true;
        },

        async mechanismsReveal(){
            this.updateStep(3, 'start');
            this.display_associations = false;
            this.display_mechanisms = true;
            this.association_genes_loaded = 0;
            this.mechanisms = null;
            this.mechanisms_summary = null;
            this.response = null;
            this.edit_context = false;
            this.error_mechanisms = false;

            let associationsWithAnyGenes = 0;
            let associationsWithNoGenes = 0;
            let associationsWithSignificantGenes = 0;

            console.log('getting genes for strong associations');

            const relevantAssociations = this.relevantAssociations;

            const allHaveGenes = relevantAssociations.every(obj => Array.isArray(obj.genes));

            //BEGIN get genes for relevantAssociations
            //via mutiquery api

            //get query params for each association
            const multiQueryList = relevantAssociations.map(item => `${item.phenotype_id},${item.gene_set},cfde`);

            //console.log({multiQueryList});

            function chunkArray(arr, chunkSize) {
                const chunkedArray = [];
                for (let i = 0; i < arr.length; i += chunkSize) {
                    const chunk = arr.slice(i, i + chunkSize); 
                    chunkedArray.push(chunk);
                }
                return chunkedArray;
            }

            function buildResultMap(flattened) {
                const map = new Map();

                for (const r of flattened) {
                    const key = `${r.phenotype}|${r.gene_set}`;
                    if (!map.has(key)) map.set(key, []);
                    map.get(key).push(r);
                }

                return map;
            }

            //chuck the query params list into groups of 10
            const multiQueryChunks = chunkArray(multiQueryList, 10);
            const multiQueryResults = [];

            //run multiQuery api for each chuck
            await Promise.allSettled(
                multiQueryChunks.map(async (chunk, idx) => {
                    const results = await this.runMultiQuery('pigean-joined-gene-set', chunk);
                    //console.log(`received chunk ${idx} of ${multiQueryChunks.length}`);
                    this.association_genes_loaded += chunk.length;
                    multiQueryResults.push(results.data);
                })
            );

            //flatted the results
            const multiQueryResultsFlat = multiQueryResults.flat();
            //group by association (phenotype id | gene set id)
            const multiQueryResultGroups = buildResultMap(multiQueryResultsFlat);

            console.log({multiQueryResultsFlat});

            //enrich results back into associations
            relevantAssociations.map(item => {
                const key = `${item.phenotype_id}|${item.gene_set}`;
                const genes = multiQueryResultGroups.get(key) || [];
                (genes.length>0) ? associationsWithAnyGenes++ : associationsWithNoGenes++;
                const genesData = genes.map(({ gene, combined, log_bf, prior }) => ({
                    gene,
                    combined,
                    log_bf,
                    prior
                }));
                this.$set(item, 'genes', genesData);
            });

            //console.log({relevantAssociations});

            //END get genes for relevantAssociations
            
            //return;
            if(false){
                //load genes from relevant associations one at a time.
                if(!allHaveGenes){
                    await Promise.allSettled(
                        relevantAssociations.map(async item => {
                            const genes = await this.fetchGenesForTerm(item.phenotype_id, item.gene_set);
                            console.log('--', item.phenotype_id, item.gene_set);
                            console.log('   genes', genes);
                            if(genes.length>0){
                                associationsWithAnyGenes++;
                                const sorted = genes.sort((a, b) => b.combined - a.combined)
                                //keep non-redundant gene info
                                const genesData = sorted.map(({ gene, combined, log_bf, prior }) => ({
                                    gene,
                                    combined,
                                    log_bf,
                                    prior
                                }));
    
                                //item.genes = genesData;
                                this.$set(item, 'genes', genesData);
                                /*
                                //sort genes by combined score
                                const sorted = genes.sort((a, b) => b.combined - a.combined)
                                //get those above a score of 2
                                const filtered = sorted.filter(g => g.combined > 2);
                                let geneArray = [];
                                if(filtered.length>0){
                                    //if we have those, just use the gene names
                                    geneArray = filtered.map(gene => gene.gene);
                                }else{
                                    //otherwise grab top 10, and use just the gene names
                                    geneArray = sorted.slice(0, 10).map(gene => gene.gene);
                                }
                                item.genes = geneArray;
                                */
                            }else{
                                associationsWithNoGenes++;
                                //item.genes = [];
                                this.$set(item, 'genes', []);
                            }
                            this.association_genes_loaded += 1;
                        })
                    )
                }else{
                    this.association_genes_loaded  = relevantAssociations.length;
                }
            }

            console.log({relevantAssociations});

            //temp, exclude associations where there are not associated genes
            const filteredAssociations = relevantAssociations.filter(x => x.genes.length > 0);

            console.log({filteredAssociations});

            const relevantAssociationsSimplified = filteredAssociations.map(item => {
                let source = item.source;
                if(this.searchType!=="terms"){
                    source = item.gene_set_program;
                }
                const genes = item.genes;
                let genesArray = [];
                if(genes.length>0){
                    //filter down associated genes to those which have a combined score > 1
                    const filtered = genes.filter(g => g.combined > 1);
                    if(filtered.length>0) associationsWithSignificantGenes++;
                    genesArray = filtered.map(gene => gene.gene);
                }
                return { 
                    id: item.id,
                    source: source,
                    phenotype: item.phenotype,
                    signature: item.gene_set_label,
                    genes: genesArray.join(";")
                }
            });

            console.log({relevantAssociationsSimplified})

            console.log({associationsWithAnyGenes, associationsWithNoGenes, associationsWithSignificantGenes});

            const relevantAssociationsSimplifiedCSV = this.objToCSV(relevantAssociationsSimplified);

            console.log(relevantAssociationsSimplifiedCSV);

            this.updateStep(3, 'end');

            this.updateStep(4, 'start');

            this.prepareMechanismPrompt(relevantAssociationsSimplifiedCSV, this.searchCriteria[1].values)
        },

        objToCSV(data) {
            const headers = Object.keys(data[0]).join(","); 
            const rows = data.map(obj =>
                Object.values(obj)
                .map(value => `"${String(value).replace(/"/g, '""')}"`) // quote + escape
                .join(",")
            );
            return [headers, ...rows].join("\n");
        },

        prepareMechanismPrompt(associations, context){
            //compose prompt
            let fullPrompt = `**associations:**\n`
            fullPrompt += associations
            fullPrompt += `\n\n**Research context:** ${context}`
            fullPrompt += `\n\n**Association selecttion strategy:** ${this.associationSelectStrategy}`
            fullPrompt += `\n\n**Gene selecttion strategy:** ${this.geneSelectStrategy}`
            
            console.log('fullPrompt', fullPrompt);

            this.startTimer(3, () => {this.handleAnalyzeTimeout()});

            this.llmAnalyze.sendPrompt({
                userPrompt: fullPrompt,
                onToken: this.onGroupToken,
                onResponse: this.onGroupResponse,
                onState: this.onGroupState,
                onError: this.onGroupError,
                onEnd: this.onGroupEnd
            });
        },

        transformTermAssociations(arr) {
            return arr.map(item => {
                const geneSet = item.gene_set.includes(":")
                            ? item.gene_set.split(":")[0]
                            : item.gene_set
                let geneSetName, phenotypeName, sourceName;
                if(this.searchApi==="new"){
                    const lastDotIdx = item.term.lastIndexOf('.');
                    const set = item.term.slice(0, lastDotIdx + 1);
                    geneSetName = set.replace(';', " & ");
                    phenotypeName = item.term.slice(lastDotIdx + 1).trim();
                    sourceName = item.source.replace(';', ' x ');
                }else{
                    // Extract phenotype name from term
                    const match = item.term.match(/associated with (.+)$/i);
                    phenotypeName = match ? match[1].trim() : null;
                    geneSetName = geneSet;
                    sourceName = item.source.replace('_x_', ' x ');
                }
                
                return {
                    ...item,
                    //used for selection for analysis
                    selected: false,
                    // 1. rename phenotype → phenotype_id
                    phenotype_id: item.phenotype,
                    // 2. add phenotype (extracted text)
                    phenotype: phenotypeName,
                    // 3. gene_set without ":" and everything after
                    gene_set: geneSet,
                    gene_set_label: geneSetName,
                    source_label: sourceName
                };
            });
        },

        transformPhenotypeAssociations(arr) {
            let count = 0;
            const objectOnlyArr = arr.filter(item => typeof item === 'object' && item !== null);
            console.log(`objects only ${objectOnlyArr.length} of ${arr.length}`);
            return objectOnlyArr.map(item => {
                //const match = this.semanticPhenotypes.find(phenotype => phenotype.id===item.phenotype)
                count++;
                return {
                    ...item,
                    //id to match to later
                    id: `term_${count}`,
                    //used for selection for analysis
                    selected: false,
                    // 1. rename phenotype → phenotype_id
                    phenotype_id: item.phenotype,
                    // 2. add phenotype (extracted text)
                    phenotype: item.description,

                    gene_set: item.gene_set,
                    gene_set_label: item.gene_set_description,
                    source_label: item.gene_set_program
                };
            });
        },

        groupBy(array, key) {
            return array.reduce((result, item) => {
                const groupKey = item[key];
                if (!result[groupKey]) {
                    result[groupKey] = [];
                }
                result[groupKey].push(item);
                return result;
            }, {});
        },

        aggregateGenes(associations){
            //combine genes from associations into single list + association id
            const allGenes = associations.flatMap(assoc =>
                assoc.genes.map(gene => ({
                    ...gene,
                    assocId: assoc.id
                }))
            );

            allGenes.sort((a, b) => b.combined - a.combined);

            return allGenes;

            //count how many associations a gene appears in
            const geneMap = {};
            for (const g of allGenes) {
                if (!geneMap[g.gene]) {
                    geneMap[g.gene] = {
                        gene: g.gene,
                        occurrences: 0,
                        associations: new Set(),
                        entries: []
                    };
                }
                geneMap[g.gene].occurrences += 1;
                geneMap[g.gene].associations.add(g.assocId);
                geneMap[g.gene].entries.push(g);
            }

            //convert back into array
            const aggregatedGenes = Object.values(geneMap).map(g => ({
                gene: g.gene,
                count: g.occurrences,
                shared: g.associations.size > 1,
                associationIds: [...g.associations],
                //entries: g.entries   // if you want the full data
            }));

            return aggregatedGenes;
        },

        extractPhenotypeLabel(term) {
            const parts = term.split("associated with");
            return parts.length > 1 ? parts[1].trim() : null;
        },

        parseLLMResponse(rawString) {
            //parses llm text response to json object
            const cleanString = rawString.replace(/```json|```/g, '').replace(/[\r\n]+/g, " ").trim()
            try {
                return JSON.parse(cleanString)
            } catch (e) {
                console.error('Failed to parse LLM JSON:', e)
                return []
            }
        },

        async fetchGenesForTerm(phenotype, geneset){
            console.log('getting genes for', phenotype, geneset);

            const url = `https://cfde-dev.hugeampkpnbi.org/api/bio/query/pigean-joined-gene-set?q=${phenotype},${geneset},cfde&limit=100`
            try{
                const response =  await fetch(url);
    
                if (!response.ok) {
                    //new Error("Fetch error:" + response.statusText);
                    return [];
                }
    
                const res = await response.json();
                const data = res.data;
    
                return data;
            }catch(error){
                return [];
            }
        },

        //this endpoint can query another endpoint in batches
        //e.g. runMultiQuery('pigean-joined-gene-set', [`${entry.phenotype},${entry.gene_set},cfde`, ...])
        async runMultiQuery(index, queries){
            const url = 'https://cfde-dev.hugeampkpnbi.org/api/bio/multiquery';

            // Build the queries array just like your Python list comprehension
            /*
            const queries = multipleSemanticSearchResults.map(entry => 
                `${entry.phenotype},${entry.gene_set},cfde`
            );
            */

            const payload = {
                index, //e.g. string, 'pigean-joined-gene-set'
                queries //e.g. array, [`${phenotype_id},${gene_set_id},cfde`, ...]
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const json = await response.json();

            return json;
        },

        //
        //
        //
        // ui handlers
        //
        //
        //

        useExample(text){
            this.userQuery = text;
        },

        editSearchCriteria(){
            this.prev_search_criteria = JSON.parse(JSON.stringify(this.searchCriteria));
            this.edit_search_criteria = true;
            this.user_edited_search_criteria = false;
        },
        cancelEditSearchCriteria(){
            this.edit_search_criteria = false;
            this.searchCriteria = JSON.parse(JSON.stringify(this.prev_search_criteria));
        },
        removeSearchTerm(term){
            if(!this.edit_search_criteria) return;
            const idx = this.searchCriteria[0].values.indexOf(term);
            if (idx !== -1) {
                this.searchCriteria[0].values.splice(idx, 1);
            }
        },
        addSearchTerm(event){
            const val = event.target.value;
            if(val.trim() !== ''){
                this.searchCriteria[0].values.push(event.target.value);
            }
            event.target.value = "";
            event.target.blur();
        },
        saveSearchCriteria(){
            this.edit_search_criteria = false;
            this.user_edited_search_criteria = true;
            this.searchTerm = this.searchCriteria[0].values.join(', ');
            this.updateStep(1, 'end');
        },

        editAssociations(){
            this.prev_associations = structuredClone(this.associations);
            this.prev_filtered_phenotypes = structuredClone(this.filtered_phenotypes);
            this.prev_filtered_programs = structuredClone(this.filtered_programs);
            this.prev_filtered_association_strengths = structuredClone(this.filtered_association_strengths);
            this.edit_associations = true;
            this.user_selected_associations = false;
        },
        cancelEditAssociations(){
            this.edit_associations = false;
            this.filtered_association_strengths = structuredClone(this.prev_filtered_association_strengths);
            this.filtered_programs = structuredClone(this.prev_filtered_programs);
            this.filtered_phenotypes = structuredClone(this.prev_filtered_phenotypes);
            this.associations = structuredClone(this.prev_associations);
        },
        saveAssociations(){
            this.user_selected_associations = true;
            this.relevantAssociations = this.associations.filter(item => item.selected);
            this.edit_associations = false;
            this.updateStep(2, 'end');
        },

        editContext(){
            this.prev_context = this.searchCriteria[1].values;
            this.edit_context = true;
            this.$nextTick(() => {
                const input = document.querySelector('#context-edit-2')
                input.focus();
            });
        },
        cancelEditContext(){
            this.edit_context = false;
            this.searchCriteria[1].values = this.prev_context;
        },

        updateStep(step, status, note=null){
            this.search_step = step;

            if(step===1){
                if(status==='start'){
                    this.display_examples = false;
                    this.error_search_criteria = false;
                    this.loading_search_criteria = true;
                    this.setLineAnimated(1);
                    document.querySelector(`.dot${step+1}`).classList.remove("error");
                    document.querySelector(`.dot${step+1}`).classList.add("loading");
                }
                if(status==='end'){
                    this.error_search_criteria = false;
                    this.loading_search_criteria = false;
                    this.setLineSolid(1);
                    this.setLineDotted(2);
                    this.setLineDotted(3);
                    document.querySelector(`.dot${step+1}`).classList.remove("loading");
                    document.querySelector(`.dot${step+1}`).classList.add("on");
                }
                if(status==='error'){
                    this.loading_search_criteria = false;
                    this.setLineError(1);
                    document.querySelector(`.dot${step+1}`).classList.remove("loading");
                    document.querySelector(`.dot${step+1}`).classList.add("error");
                    this.error_msg_search_criteria = note;
                    this.error_search_criteria = true;
                }
            }
            if(step===2){
                if(status==='start'){
                    this.loading_associations = true;
                    this.error_associations = false;
                    this.setLineAnimated(2);
                    document.querySelector(`.dot${step+1}`).classList.remove("error");
                    document.querySelector(`.dot${step+1}`).classList.add("loading");
                }
                if(status==='end'){
                    this.loading_associations = false;
                    this.error_associations = false;
                    this.setLineSolid(2);
                    this.setLineDotted(3);
                    document.querySelector(`.dot${step+1}`).classList.remove("loading");
                    document.querySelector(`.dot${step+1}`).classList.add("on");
                }
                if(status==='error'){
                    this.loading_associations = false;
                    this.setLineError(2);
                    document.querySelector(`.dot${step+1}`).classList.remove("loading");
                    document.querySelector(`.dot${step+1}`).classList.add("error");
                    this.error_msg_associations = note;
                    this.error_associations = true;
                }
            }
            if(step===3){
                if(status==='start'){
                    this.loading_genes = true;
                    this.setLineAnimated(3);
                    document.querySelector(`.dot4`).classList.remove("error");
                    document.querySelector(`.dot4`).classList.add("loading");
                }
                if(status==='end'){
                    this.loading_genes = false;
                    //this.setLineSolid(step);
                    //document.querySelector(`.dot${step+1}`).classList.remove("loading");
                    //document.querySelector(`.dot${step+1}`).classList.add("on");
                }
                if(status==='error'){
                    this.loading_genes = false;
                    this.setLineError(3);
                    document.querySelector(`.dot4`).classList.remove("loading");
                    document.querySelector(`.dot4`).classList.add("error");
                }
            }
            if(step===4){
                if(status==='start'){
                    this.loading_mechanisms = true;
                    this.error_mechanisms = false;
                    document.querySelector(`.dot4`).classList.remove("error");
                    //this.setLineAnimated(step);
                    //document.querySelector(`.dot${step+1}`).classList.add("loading");
                }
                if(status==='end'){
                    this.loading_mechanisms = false;
                    this.error_mechanisms = false;
                    this.setLineSolid(3);
                    document.querySelector(`.dot4`).classList.remove("loading");
                    document.querySelector(`.dot4`).classList.add("on");
                }
                if(status==='error'){
                    this.loading_mechanisms = false;
                    this.setLineError(3);
                    document.querySelector(`.dot4`).classList.remove("loading");
                    document.querySelector(`.dot4`).classList.add("error");
                    this.error_msg_mechanisms = note;
                    this.error_mechanisms = true;
                }
            }
            
        },


        //
        //
        //
        // Url processing
        //
        //
        //
        getsetLink(association){
            const geneset = `${association.phenotype},${association.gene_set},${association.source}`
            const url = kcURL(`/r/cfde_explore?associations=${geneset}`);
            return url;
        },

        genesLink(mechanism){
            const hypothesis = mechanism.hypothesis;
            const genes = mechanism.associations.flatMap(item => item.genes?.map(gene => gene?.gene));
            const url = kcURL(`/r/cfde_explore?researchContext=${this.fullResults.context}&hypothesis=${hypothesis}&genes=${genes}`);
            return url;
        },

        validationLink(mechanism){
            const hypothesis = mechanism.hypothesis;
            const associations = mechanism.associations.map(item => {
                    // Handle possible missing fields gracefully
                    const phenotype = item.phenotype || "";
                    const geneSet = item.gene_set || "";
                    const source = item.source || "";
                    return `${phenotype},${geneSet},${source}`;
                }).join(';');
            const genes = mechanism.genes.map(gene => gene.gene).join(',');
            const url = kcURL(`/r/cfde_design?researchContext=${this.fullResults.context}&hypothesis=${hypothesis}&associations=${associations}&genes=${genes}`);
            return url;
        },


        //
        //
        //
        //Timing
        //
        //
        //
        startTimer(timeoutMinutes = null, onTimeout = null) {
            // Reset state
            this.stopTimer();
            const startTime = Date.now();
            this.elapsed = null;

            // Compute timeout in ms (if provided)
            const timeoutMs = timeoutMinutes ? timeoutMinutes * 60 * 1000 : null;

            this.timer = setInterval(() => {
                const diff = Date.now() - startTime;
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                this.elapsed = 
                    String(minutes).padStart(2, "0") + ":" + 
                    String(seconds).padStart(2, "0") + " elapsed";

                // Check for timeout
                if (timeoutMs && diff >= timeoutMs) {
                    this.stopTimer(); // Stop the interval
                    if (typeof onTimeout === "function") {
                        onTimeout(); // Call the handler
                    } else {
                        console.warn("Timer timeout reached!");
                    }
                }
            }, 1000);
        },
        stopTimer() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        },

        //
        //
        //
        //Lines
        //
        //
        //
        getCenter(el) {
            const rect = el.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2 + window.scrollX,
                y: rect.top + rect.height / 2 + window.scrollY
            };
        },
        getCenterRelative(el, parentRect) {
            const rect = el.getBoundingClientRect();
            return {
                x: rect.left - parentRect.left + rect.width / 2,
                y: rect.top - parentRect.top + rect.height / 2
            };
        },
        initLines() {
            this.dots = document.querySelectorAll('.dot');
            this.line = document.getElementById('lines');
            for (let i = 0; i < this.dots.length - 1; i++) {
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("id", `line${i + 1}`);
                this.line.appendChild(line);
            }
            this.setLineDotted(1);
            this.setLineDotted(2);
            this.setLineDotted(3);
            this.updateLinePositions();
            this.lineObserver = new ResizeObserver(this.updateLinePositions);
            this.lineObserver.observe(document.querySelector('.reset'));
        },
        updateLinePositions() {
            this.dots = document.querySelectorAll('.dot');
            this.line = document.getElementById('lines');
            const parent = document.querySelector('.reset');
            const parentRect = parent.getBoundingClientRect();
            this.line.setAttribute("width", parentRect.width);
            this.line.setAttribute("height", parentRect.height);
            //this.line.setAttribute("width", window.innerWidth + window.scrollX);
            //this.line.setAttribute("height", window.innerHeight + window.scrollY);
            for (let i = 0; i < this.dots.length - 1; i++) {
                //const a = this.getCenter(this.dots[i]);
                //const b = this.getCenter(this.dots[i + 1]);
                const a = this.getCenterRelative(this.dots[i], parentRect);
                const b = this.getCenterRelative(this.dots[i + 1], parentRect);
                const line = document.getElementById(`line${i + 1}`);
                line.setAttribute("x1", a.x);
                line.setAttribute("y1", a.y);
                line.setAttribute("x2", b.x);
                line.setAttribute("y2", b.y);
            }
        },
        
        setLineColor(index, color) {
            document.getElementById(`line${index}`).setAttribute("stroke", color);
        }, 
        setLineSolid(index) {
            const line = document.getElementById(`line${index}`);
            line.classList.remove("dotted", "animated", "error");
        },
        setLineDotted(index) {
            const line = document.getElementById(`line${index}`);
            line.classList.add("dotted");
            line.classList.remove("animated", "error");
        },
        setLineError(index) {
            const line = document.getElementById(`line${index}`);
            line.classList.add("error");
            line.classList.remove("animated", "dotted");
        },
        setLineAnimated(index) {
            const line = document.getElementById(`line${index}`);
            line.classList.add("animated");
            line.classList.remove("dotted", "error");
        },


        //
        //
        //
        //llmExtract handlers
        //
        //
        //
        handleExtractTimeout(){
            console.log("Extract TIMEOUT");
            /*if(this.retry_extract < this.retry_max){
                this.retry_extract++;
                console.log(`   retrying ${this.retry_extract}/${this.retry_max}`)
                this.llmExtract.abort();
                this.beginFlow();
            }else{*/
                this.llmExtract.abort();
                this.updateStep(this.search_step, 'error', "Request is taking too long.");
                //console.log('   could be systemic, try again later.');
            //}
        },
        onExtractToken(token){
            console.log('onToken', token);
        },
        onExtractResponse(response){
            this.stopTimer();
            this.llmExtractState = '';
            console.log('onResponse', response);
            if(response){
                const json = this.parseLLMResponse(response);
                console.log('response json', json);
                //return;
                if(json.error){
                    this.updateStep(this.search_step, 'error', json.error);
                    this.allow_retry = false;
                    return;
                }
                this.associationSelectStrategy = json.association_selection_strategy;
                this.geneSelectStrategy = json.gene_selection_strategy;

                this.searchType = json.search_type==="mechanisms" || json.search_type==="both"?'terms':'phenotypes';
                const searchTerms = [...json.phenotype_terms, ...json.mechanism_terms]
                this.searchCriteria = [
                    {
                        search_criteria: 'Search Terms',
                        values: searchTerms,
                        why: 'We extraced this from your search query.',
                        purpose: 'These terms will be used to search for related phenotype↔signature associations via semantic search.'
                    },
                    {
                        search_criteria: 'Research Context',
                        values: json.research_context,
                        why: 'We inferred this from on your search query.',
                        purpose: 'This context will be used to tailor mechanistic hypotheses to your research.'
                    }
                    /*{
                        search_criteria: 'relevant cfde programs',
                        values: json.cfde_programs.map(p => p.program),
                        why: 'You indicated these programs were of interest to you, or we believe these programs might be of interest to you:<br/>' + json.cfde_programs.map(p => `<strong>${p.program}</strong>: [${p.reason}] ${p.relevance}`).join('<br/>'),
                        purpose: 'These may be used to filter association results and will help tailor mechanistic hypothesis to your research.'
                    }*/
                ];


                //this.searchCriteria[0].values = json.search_terms;
                //this.searchCriteria[1].values = json.research_context;
                //this.searchCriteria[2].values = json.cfde_programs.map(p => p.program);
                //this.searchCriteria[2].purpose = json.cfde_programs.map(p => p.program + ': ' + p.reason);
                console.log(this.searchCriteria);
                //this.searchTerm = json.search_terms.join(',');
                //this.userContext = json.context;
                //this.termSearch(this.searchTerm);
                this.updateStep(1, 'end');
                this.searchTerm = searchTerms.join(', ');
                /*
                const requestedPrograms = json.cfde_programs
                    .filter(item => item.reason === "requested")
                    .map(item => item.program);
                this.filtered_programs = requestedPrograms;
                */
                if(this.searchMode==='auto'){
                    this.associationSearch(this.searchTerm);
                }else{
                    this.display_search_criteria = true;
                }
                
            }
        },
        onExtractEnd(end){
            this.stopTimer();
            this.llmExtractState = '';
            console.log('End');
        },
        onExtractError(error){
            this.stopTimer();
            this.llmExtractState = error;
            console.log('onError', error);
            this.updateStep(this.search_step, 'error', "An error occured");
        },
        onExtractState(state){
            this.llmExtractState = state;
            console.log('onState', state);
        },


        //
        //
        //
        //llmAnalyze handlers
        //
        //
        //
        handleAnalyzeTimeout(){
            console.log("Analyze TIMEOUT");
            /*if(this.retry_mechanisms <= this.retry_max){
                this.retry_mechanisms++;
                console.log(`   retrying ${this.retry_mechanisms}/${this.retry_max}`)
                this.llmAnalyze.abort();
                mechanismsReveal();
            }else{*/
                this.llmAnalyze.abort();
                this.updateStep(this.search_step, 'error', "Request is taking too long.");
                //console.log('   could be systemic, try again later.');
            //}
        },
        onGroupToken(token){
            //NOTE:
            //langflow streams the entire response string with updated parts (use +)
            //gemini streams only updated segments of the response string (so use +=)
            //these should be handled differently.
            console.log('onToken', token);
            if(!this.streamResponse) this.streamResponse = '';
            this.streamResponse += token;
        },
        onGroupResponse(response){
            this.stopTimer();
            this.retry_mechanisms = 0;
            this.llmGroupState = '';
            console.log('onResponse', response);
            this.response = response;
            if(this.response){
                const json = this.parseLLMResponse(this.response);
                console.log('response json', json);
                //return;
                if(json && json.hypotheses.length>0){
                    const updated = json.hypotheses.map(item => {
                        const associations = this.associations.filter(a => item.ids.includes(a.id));
                        const allPrograms = associations.flatMap(a => {
                            if(this.searchType==="terms"){
                                if(this.searchApi==="new") {
                                    return a.source.split(';');
                                }
                                return a.source.split('_x_');
                            }else{
                                return a.gene_set_program.split(';');
                            }
                            
                        });
                        const programs = [...new Set(allPrograms)];
                        // = this.aggregateGenes(associations);
                        return {
                            ...item,
                            associations,
                            programs,
                            //aggregateGenes,
                            display_associations: false,
                            display_relevance: false,
                            display_validation: false,
                            display_justification: false,
                        };
                    });
                    this.mechanisms = updated;
                    this.mechanisms_summary = json.overall_summary;

                    this.updateStep(4, 'end');
                    console.log('response parsed', this.mechanisms);

                    this.fullResults = {
                        query: this.userQuery,
                        terms: this.searchCriteria[0].values,
                        context: this.searchCriteria[1].values,
                        associations: this.associations,
                        mechanisms: {
                            summary: this.mechanisms_summary,
                            results: this.mechanisms
                        }
                    }
                    console.log('full results', this.fullResults);
                    
                    const md = this.convertToMarkdown(this.fullResults);
                    this.textResults = md;
                    console.log('markdown', md);
                }
            }
        },

        onGroupEnd(end){
            this.stopTimer();
            this.llmGroupState = '';
            console.log('End');
            return;
            if(this.streamResponse){
                const json = this.parseLLMResponse(this.streamResponse);
                console.log('response json', json);
                if(json.length>0){
                    this.parsedResponse = this.enrichGroups(json, this.associations);
                    console.log('response parsed', this.parsedResponse);
                }
            }
        },
        onGroupError(error){
            this.stopTimer();
            this.llmGroupState = error;
            console.log('onError', error);
            this.updateStep(this.search_step, 'error', "An error occured");
        },
        onGroupState(state){
            this.llmGroupState = state;
            console.log('onState', state);
        },

        //
        //
        // markdown
        //
        //

        convertToMarkdown(data) {
            let md = '';
            md += `CFDE REVEAL via The Knowledge Center https://cfdeknowledge.org\n`;
            md += `================\n`
            md += `Generated on: ${new Date().toLocaleString()}\n\n`;
            md += `The following hypotheses were generated in the context of:\n`;
            md += `"${data.context}"\n\n`
            md += `---\n\n`;
            md += `Integrated Mechanistic Summary\n`;
            md += `================\n\n`
            md += `${data.mechanisms.summary}\n\n`;
            md += `---\n\n`;
            md += `Hypotheses\n`;
            md += `================\n\n`

            data.mechanisms.results.forEach((r) => {
                md += this.resultToMarkdown(r);
                md += `---\n\n`;
            });

            return md.trim();
        },

        resultToMarkdown(result) {
            let md = `${result.group_name}\n`;
            md += `----------------\n\n`
            md += `Hypothesis:\n${result.hypothesis}\n\n`;
            if (result.programs?.length) {
                md += `Contributing CFDE Programs:\n${result.programs.join(", ")}\n\n`;
            }
            if (result.genes?.length) {
                md += `Linking Genes:\n${result.genes.join(", ")}\n\n`;
            }
            if (result.associations?.length) {
                md += `Relevant Associations:\n`;
                let idx = 1;
                result.associations.forEach((assoc) => {
                    const genesArray = assoc.genes?.map(gene => gene.gene) || [];
                    md += `${idx}.\n`;
                    md += `- Phenotype: ${assoc.phenotype}\n- Gene Set: ${assoc.gene_set_label}\n- Source: ${assoc.source?.replace(';', ' & ')}\n- Genes: ${genesArray.join(", ")}\n\n`;
                    idx++;
                });
            }

            return md;
        },
        downloadHypotheses() {
            const text = this.textResults;
            const timestamp = new Date().toISOString().split('T')[0];

            const blob = new Blob([text], { type: "text/plain" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `cfde_reveal_mechanistic_summary-${timestamp}.txt`;
            a.click();

            URL.revokeObjectURL(url);
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
});


</script>

<style scoped>
/*
::v-deep .btn-primary:hover:not(:disabled) {
    background-color: #0056b3;
}
::v-deep .btn-info:hover:not(:disabled) {
    background-color: #157d8e;
}
::v-deep .btn-success:hover:not(:disabled) {
    background-color: #237d37;
}
::v-deep .btn-warning:hover:not(:disabled) {
    background-color: #d5a40e;
}
*/

.section-header{
    background: #eee;
    border-radius: 5px;
    padding: 10px 5px;
    cursor: pointer;
    position: relative;
    margin: 0 0 20px;
    display:flex;
    flex-direction: column;
    gap:5px;
}
.section-header:hover{
    background-color: #ddd;
}
.section-header-state{
    position: absolute;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
    color: #ff6600;
}

.query-sample {
    background: #eee;
    padding: 3px 10px;
    border-radius: 10px;
    cursor: pointer;
}
.query-sample:hover{
    background: #ddd;
}

.note{
    display: block;
    color: #777777;
    font-size: 1em;
    margin: 4px 0 8px 0;
    padding: 4px 8px;
    background-color: #F8F8F8;
    border-left: 3px solid #7c757d;
}

.pill {
    background: white;
    padding: 0 8px;
    border-radius: 10px;
    border: 0.5px solid #ddd;
    display: inline-flex;
    width: fit-content;
    position: relative;
}
.pill.editable:hover:after {
    content: '✖';
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: #fff;
    border-radius: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    color: red;
    cursor: pointer;
}
.pill.new{
    text-align: center;
    width: 50px;
}
.pill.new:focus{
    width: 100px;
}
.editing .pill {
    border: 1px solid #ff6600;
}

.next_step {
    border: 1px solid #ccc;
    border-radius: 10px;
    padding: 10px;
    text-align: center;
    color: black !important;
    font-weight: bold;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
}
.next_step:hover{
    background: #ccc;
}

.collapsed{
    display: none !important;
}
.info-icon {
    background: #9c9c9c;
    color: white;
    display: inline-flex;
    width: 1.2em;
    height: 1.2em;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: .8em;
    user-select: none;
    vertical-align: text-top;
}
.info-icon:hover{
    background:gold;
    color:black;
}

label{
    margin-bottom: 0;
}

/*
button:hover{
    background: #ddd;
}
*/

.muted{
    opacity: 1;
}

.loading-text {
    /*background: linear-gradient(
        90deg,
        #a2a2a2 20%,
        #343434 40%,
        #343434 60%,
        #a2a2a2 80%
    );*/
    background: linear-gradient(
        90deg,
        #a7a7a7 20%,
        #6b6b6b 40%,
        #6b6b6b 60%,
        #a7a7a7 80%
    );
    background-size: 200% 100%;
    color: transparent;
    background-clip: text;
    -webkit-background-clip: text;
    animation: shimmer 2.5s infinite linear;
}

@keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}

.new-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 1px solid #ccc;
    border-radius: 10px;
    padding: 20px;
    color: #aaa;
    cursor: pointer;
}

.new-group:hover{
    background: #ddd;
}

.dot {
    position: absolute;
    background: #eee;
    border: 2px solid #35669a;
    width: 8px;
    height: 8px;
    top: 1.2em;
    transform: translate(-200%, -.6em);
    border-radius: 50%;
    z-index: 1;
}
.dot.on{
    background: #35669a;
}
.dot.loading {
    border-bottom-color: transparent;
    animation: rotation 1s linear infinite;
}
@keyframes rotation {
    0% {transform: translate(-200%, -.6em) rotate(0deg);}
    100% {transform: translate(-200%, -.6em) rotate(360deg);}
}
.dot.error {
    border: 2px solid red;
}
.dot.error::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 1px;
    background-color: red;
    transform: translateY(-50%) rotate(45deg);
}

#lines {
    position: absolute;
    top: 0; left: 0;
    pointer-events: none;
}
::v-deep line {
    stroke: #ff6600;
    stroke-width: 1;
}
::v-deep line.dotted {
    stroke: black;
    stroke-dasharray: 4, 6;
}
::v-deep line.error {
    stroke: red;
}
::v-deep line.animated {
    stroke: black;
    stroke-dasharray: 4, 6;
    stroke-dashoffset: 16;
    animation: dash-move 1s linear infinite;
}
@keyframes dash-move {
    to {
        stroke-dashoffset: 0;
    }
}

::v-deep .tooltip-inner{
    text-align: left;
}


.reset{
    font-size: 14px !important;
    padding: 40px;
    display:flex;
    flex-direction: column;
    gap:20px;
    position: relative;

    .group {
        background: #ffffff;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .title{
        font-size: 16px;
        font-weight: bold;
    }

    .tag{
        font-size: 12px;
        background: #eeeeee;
        border-radius: 5px;
        padding: 0 5px;
    }
}
::v-deep .table td, 
::v-deep .table th {
    max-width: 200px;
    overflow: hidden;
    /*text-overflow: ellipsis;
    white-space: nowrap;*/
}
::v-deep tr.b-table-details > td {
    padding: 20px 40px;
}
</style>