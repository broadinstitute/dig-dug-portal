<template>
    <div>
        <!-- <criterion-list-group 
            v-model="$parent.queryGraphCriterion">

            <span style="display: inline-block">
                <filter-enumeration-control 
                    :field="'association'"
                    :class="'filter-col-lg'"
                    :options="$parent.associationOptions">
                </filter-enumeration-control>
            </span>

            <span style="display: inline-block" v-if="$parent.slotsForAssociation !== null">
                <div class="label">
                    Genes <button @click="$parent.addNode">+</button>
                </div>
                <filter-enumeration-control
                    v-for="(subject, index) in $parent.subjects"
                    :key="subject+index"
                    :field="`subject`"
                    :placeholder="`${subject}`"
                    :options="['All', 'NCBIGene:1803']">
                </filter-enumeration-control>
            </span>

            <span style="display: inline-block" v-if="$parent.slotsForAssociation !== null">
                <div class="label">
                    Diseases <button @click="$parent.addNode">+</button>
                </div>
                <filter-enumeration-control
                    v-for="(object, index) in $parent.objects"
                    :key="object+index"
                    :field="`object`"
                    :placeholder="`${object}`"
                    :options="['All']">
                </filter-enumeration-control>
            </span>

            <button v-if="$parent.slotsForAssociation !== null">GO</button>

        </criterion-list-group> -->

        <!-- 
            NCATS Results Dashboard
            - Case: get a better definition and context for a particular biological entity
         -->
        <div class="card mdkp-card">
            <div class="card-body">
                <ncats-results-dashboard
                    :query_graph="$parent.query_graph.query_graph"
                ></ncats-results-dashboard>
            </div>
        </div>

        <!--
            NCATS Explanation Tool
            - Case: find a path
        -->

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
                    Gene to Disease
                    <div class="criteria">
                        <b-badge class="filter-pill-gene"></b-badge>
                        <b-badge class="filter-pill-mask"></b-badge>
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

                    </criterion-list-group>

                    <div v-if="$parent.geneToDiseaseQueryCriterion.length > 0 && $parent.geneToDiseaseQuery !== null">
                        <ncats-results-table
                            :query_graph="$parent.geneToDiseaseQuery.query_graph"
                            :selectable="true"
                            @change="$parent.selectedResults = $event">
                        </ncats-results-table>
                    </div>

                </b-card-body>
            </b-collapse>
        </b-card>

<!-- Divider -->
        <b-card no-body class="mb-1">
            <b-card-header
                header-tag="header"
                class="p-1"
                role="tab"
            >
                <b-button
                    block
                    v-b-toggle.accordion-2
                    >Disease to Phenotype
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
                        :header="'Search Criteria'">

                        <filter-enumeration-control
                            :field="'disease'"
                            placeholder="Select a disease ..."
                            :labelFormatter="el => $parent.diseaseMap[el]"
                            :options="$parent.diseaseOptions">
                            <div class="label">Disease</div>
                        </filter-enumeration-control>

                        <template #filtered="{filter}">
                            {{filter}}
                        </template>

                    </criterion-list-group>

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
                    v-b-toggle.accordion-3
                    >Phenotype to Variants
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
                id="accordion-3"
                accordion="my-accordion"
                role="tabpanel">
                <b-card-body>
                </b-card-body>
            </b-collapse>
        </b-card>
    </div>
</template>
