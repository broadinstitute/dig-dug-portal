<template>
    <div>
        <criterion-list-group v-model="$parent.queryGraphCriterion">
            <span style="display: inline-block">
                <div class="label">
                    Genes <button @click="$parent.addNode">+</button>
                </div>
                <filter-enumeration-control
                    v-for="(subject, index) in $parent.subjects"
                    :key="subject+index"
                    :field="`s${index}`"
                    :placeholder="`${subject}`"
                    :options="['All', 'NCBIGene:1803']">
                </filter-enumeration-control>
            </span>

            <span style="display: inline-block">
                <div class="label">
                    Diseases <button @click="$parent.addNode">+</button>
                </div>
                <filter-enumeration-control
                    v-for="(object, index) in $parent.objects"
                    :key="object+index"
                    :field="`o${index}`"
                    :placeholder="`${object}`"
                    :options="['All']">
                </filter-enumeration-control>
            </span>

            <span style="display: inline-block">
                <div class="label">
                    Predicates
                </div>
                <filter-enumeration-control 
                    :field="'e00'"
                    :options="['biolink:gene_associated_with_condition']">
                </filter-enumeration-control>
            </span>

            <template slot=filtered>
            </template>
        </criterion-list-group>
        
        <ncats-knowledge-graph
            v-if="$parent.results.length > 0"
            :query_graph="$parent.query_graph.query_graph"
            :results="$parent.results"
        ></ncats-knowledge-graph>
        <b-table
            v-if="$parent.results.length > 0"
            :items="$parent.tableItems">
            <template #cell()="data">
                <resolved-curie-link
                    :curie="data.value">
                </resolved-curie-link>
            </template>
        </b-table>

    </div>
</template>
