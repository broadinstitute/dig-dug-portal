<template>
    <div>
        <pre>
        {{$parent.results}}
        </pre>
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
