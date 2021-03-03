
<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>
        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card dataset-page-header">
                <div class="row card-body">
                    <div class="col-md-12">
                        <h2>
                            Translator
                        </h2>
                    </div>
                </div>
            </div>

            <div>

                <!-- 
                    NCATS Results Dashboard
                    - Case: get a better definition and context for a particular biological entity
                -->
                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4>{{`Functional Associations for ${'Gene'}`}}</h4>
                        <translator-results-dashboard
                            :query_graph="$parent.query_graph.query_graph"
                            :mock="$parent.mock"
                        ></translator-results-dashboard>
                    </div>
                </div>


                <!-- Divider -->
                <hr/>


                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4>{{`Compare Genes`}}</h4>

                        <criterion-list-group
                            v-model="$parent.selectedGeneCriterion">
                                <filter-enumeration-control
                                    :field="'gene'"
                                    placeholder="Select genes..."
                                    :options="$parent.matchingGenes"
                                    :multiple="true"
                                    @input-change="$parent.lookupGenes($event)">
                                    <div class="label">Genes</div>
                                </filter-enumeration-control>
                        </criterion-list-group>

                        <b-row v-if="!!$parent.geneQueries && $parent.geneQueries.length > 0">
                            <b-col v-for="geneQuery in $parent.geneQueries" :key="JSON.stringify(geneQuery)">
                                <translator-results-dashboard
                                    :query_graph="geneQuery.query_graph"
                                    :mock="$parent.mock"
                                ></translator-results-dashboard>
                            </b-col>
                        </b-row>

                    </div>
                </div>



                <!-- Divider -->
                <hr/>

                <!--
                    NCATS Explanation Tool
                    - Case: find a path
                -->

                <b-row>
                    <b-col>
                        <translator-knowledge-graph
                            v-if="$parent.globalKnowledgeGraph != null"
                            :knowledge_graph="$parent.globalKnowledgeGraph"
                        ></translator-knowledge-graph>
                        <b-card style="height: 100%;" v-else>
                            <h5>Knowledge Graph</h5><br>
                            Use the controls on the left to construct a Knowledge Graph query.<br>
                            Constrain the graph by selecting or de-selecting rows in the tables.
                        </b-card>
                    </b-col>
                    <b-col>
                        <b-card no-body class="mb-1">
                            <b-card-header
                                header-tag="header"
                                class="p-1"
                                role="tab">
                                <b-button
                                    block
                                    v-b-toggle.accordion-1
                                    variant="outline-primary"
                                    >
                                    Gene 🠖 Disease
                                    <div class="criteria">

                                    </div>
                                </b-button>
                            </b-card-header>

                            <b-collapse
                                id="accordion-1"
                                visible
                                accordion="my-accordion"
                                role="tabpanel">
                                <b-card-body>

                                    <criterion-list-group
                                        v-model="$parent.geneToDiseaseQueryCriterion"
                                        :header="'Search Criteria'">

                                        <filter-enumeration-control
                                            :field="'gene'"
                                            placeholder="Select a gene ..."
                                            :options="$parent.matchingGenes"
                                            @input-change="$parent.lookupGenes($event)">
                                            <div class="label">Gene</div>
                                        </filter-enumeration-control>

                                        <b-col class="divider"></b-col>

                                        <filter-enumeration-control
                                            :field="'gene'"
                                            placeholder="Select predicates ..."
                                            :options="$parent.geneToDiseasePredicates"
                                            :multiple="true">
                                            <div class="label">Filter by predicates</div>
                                        </filter-enumeration-control>

                                    </criterion-list-group>

                                    <div v-if="$parent.geneToDiseaseQueryCriterion.length > 0 && $parent.geneToDiseaseQuery !== null">
                                        <translator-results-table
                                            :query_graph="$parent.geneToDiseaseQuery.query_graph"
                                            :selectable="true"
                                            :mock="$parent.mock"
                                            @change="$parent.selectedResults = $event"
                                            @change-knowledge-graph="$parent.globalKnowledgeGraph = $event">
                                        </translator-results-table>
                                    </div>

                                </b-card-body>
                            </b-collapse>
                        </b-card>

                        <b-card no-body class="mb-1">
                            <b-card-header
                                header-tag="header"
                                class="p-1"
                                role="tab"
                            >
                                <b-button
                                    block
                                    v-b-toggle.accordion-2
                                    >Disease 🠖 Pathway
                                    <div class="criteria">
                                        <b-badge
                                            class="filter-pill-dataset"
                                        >
                                        </b-badge>
                                        <b-badge
                                            class="filter-pill-phenotype">
                                        </b-badge>
                                    </div>
                                </b-button>
                            </b-card-header>
                            <b-collapse
                                id="accordion-2"
                                accordion="my-accordion"
                                role="tabpanel">
                                <b-card-body>

                                    <criterion-list-group
                                        v-model="$parent.diseaseToPhenotypeQueryCriterion"
                                        :header="'Search Criteria'">
                                        <filter-enumeration-control
                                            :field="'disease'"
                                            placeholder="Select a disease ..."
                                            :labelFormatter="el => $parent.diseaseMap[el]"
                                            :options="$parent.diseaseOptions">
                                            <div class="label">Disease</div>
                                        </filter-enumeration-control>
                                    </criterion-list-group>

                                    <div v-if="$parent.diseaseToPhenotypeQueryCriterion.length > 0 && $parent.diseaseToPhenotypeQuery !== null">
                                        <translator-results-table
                                            :query_graph="$parent.diseaseToPhenotypeQuery.query_graph"
                                            :selectable="true"
                                            :mock="true"
                                            @change="$parent.selectedResults = $event">
                                        </translator-results-table>
                                    </div>

                                </b-card-body>
                            </b-collapse>
                        </b-card>
                    </b-col>
                </b-row>
            </div>



            <div class="card mdkp-card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-12" v-if="$parent.pageInfo[0]">
                            <static-page-info-section
                                :pageInfo="$parent.pageInfo"
                            ></static-page-info-section>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
