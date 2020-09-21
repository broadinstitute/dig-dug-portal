<template>
    <div>
        <input type="checkbox" id="checkbox" v-model="$parent.inclusive">
        <label for="checkbox">{{ $parent.inclusive ? "inclusive filter" : "exclusive filter" }}</label>
        <!-- FilterContextGiver is required in the page and must wrap around components with a filter-context-receiver -->
        <filter-context v-model="$parent.filterFunction"></filter-context>

        <!-- FilterWidget -->
        <!-- "looseMatch=true" means objects that don't have all the properties will pass through by default
             On the Region page this is necessary
             "inclusive" means that the filter will be inclusive predicates (akin to a series of ORs) by default, unless the child controls override.
        -->
        <filter-widget
            v-model="$parent.filterFunction"
            :looseMatch="true">

            <filter-enumeration-control
                :field="'consequence'"
                :options="$parent.associationConsequences">
                Consequence
            </filter-enumeration-control>

            <filter-enumeration-control
                :field="'nearest'"
                :options="$parent.associationNearestGenes">
                Closest Genes
            </filter-enumeration-control>

            <filter-pvalue-control
                :field="'pValue'">
            </filter-pvalue-control>

            <filter-effect-direction-control
                :field="'beta'">
            </filter-effect-direction-control>

            <filter-multi-control
                :field="'nearest'"
                :options="$parent.associationNearestGenes">
            </filter-multi-control>

        </filter-widget>



        <!-- Div is dummy to fit components in slot -->
        <div>

            <locuszoom
                ref="locuszoom"
                :chr="$parent.chr"
                :start="$parent.start"
                :end="$parent.end"
                :refSeq="true">
                <lz-associations-panel
                    :phenotype="$parent.phenotypes[0].name"
                ></lz-associations-panel>
            </locuszoom>

            <associations-table
                :associations="$parent.associations"
                :phenotypes="$parent.phenotypes"
            ></associations-table>

        </div>


    </div>
</template>
