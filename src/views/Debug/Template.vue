<template>
    <div>
        <pre>
        {
            "message": {
                "query_graph": {
                    "edges": {
                        "e00": {
                            "subject": "n00",
                            "object": "n01",
                            "predicate": "biolink:gene_associated_with_condition"
                        }
                    },
                    "nodes": {
                        "n00": {
                            "id": "NCBIGene:1803",
                            "category": "biolink:Gene"
                        },
                        "n01": {
                            "category": "biolink:Disease"
                        }
                    }
                }
            }
        }
        </pre>

        <criterion-list-group>
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
                    :field="'s00'"
                    placeholder="biolink:Gene"
                    :options="['NCBIGene:1803']">
                </filter-enumeration-control>
            </span>

            <span style="display: inline-block">
                <div class="label">
                    Diseases <button @click="$parent.addNode">+</button>
                </div>
                <filter-enumeration-control
                    :field="'o01'"
                    placeholder="biolink:Disease"
                    :options="[]">
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
            <template slot=filtered slot-scope="{ filter }">
                {{$parent.makeQueryGraph(filter)}}
            </template>
        </criterion-list-group>

        <ncats-predicate-table
            :title="'Pathway'"
            :geneSymbol="'PCSK9'"
            :field="'pathway'">
        </ncats-predicate-table>
        <ncats-predicate-table
            :title="'GO Terms'"
            :geneSymbol="'PCSK9'"
            :field="'go'">
        </ncats-predicate-table>
        <ncats-region-predicate-table
            :title="`Pathway Associations on ${8}:${117962512}-${118188952}`"
            :chr="8"
            :start="117962512"
            :end="118188952"
            :field="'pathway'">
        </ncats-region-predicate-table>
    </div>
</template>
