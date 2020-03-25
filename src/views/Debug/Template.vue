<template>
    <div>
        hello
        <locuszoom
            v-bind:store="$store"
            v-bind:modules="['TopAssociations',]"
            v-bind:panels="['intervals', 'genes', 'association',]"

            v-bind:chromosome="$store.state.chrom"
            v-bind:start="$store.state.start"
            v-bind:end="$store.state.end">
        </locuszoom>
    </div>
</template>
