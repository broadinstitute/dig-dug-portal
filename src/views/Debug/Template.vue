<template>
    <div>
        <criterion-list-group v-model="$parent.queryGraphCriterion">
            <!-- <filter-enumeration-control
                v-for="node in $parent.nodes"
                :key="node"
                :field="node"
                :options="['NCBIGene:1803']">
                {{node}} <button @click="$parent.removeNode(node)">Remove Node</button>
            </filter-enumeration-control>

            <filter-enumeration-control
                v-for="node in $parent.nodes"
                :key="node"
                :field="node"
                :options="['NCBIGene:1803']">
                {{node}} <button @click="$parent.removeNode(node)">Remove Node</button>
            </filter-enumeration-control> -->

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
                {{$parent.results}}
            </template>
        </criterion-list-group>


        <div>
            <field-nav
                :knowledgeItem="$parent.geneInfo"
                :withFields="['pathway', 'go', 'homologene', 'summary']"
            ></field-nav>
            <b-tabs>
                <b-tab v-for="field in $parent.fields"
                       :title="field"
                       :key="field">
                    <ncats-predicate-table
                        :title="field"
                        :geneSymbol="'PCSK9'"
                        :field="field">
                    </ncats-predicate-table>
                </b-tab>
            </b-tabs>
        </div>



        <ncats-region-predicate-table
            :title="`Pathway Associations on ${8}:${117962512}-${118188952}`"
            :chr="8"
            :start="117962512"
            :end="118188952"
            :field="'pathway'">
        </ncats-region-predicate-table>
        <pre>
            {{$parent.results}}
        </pre>
    </div>
</template>
