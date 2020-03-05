<template>
    <div>
        <locuszoom-wip
            v-bind:store="$store"
            v-bind:modules="['Associations']"

            v-bind:assoc="['StaticJSON', { data: [] }]"
            v-bind:panels="['intervals','genes', 'association',]"

            v-bind:chrom="$store.state.chrom"
            v-bind:start="$store.state.start"
            v-bind:end="$store.state.end"
        >
        </locuszoom-wip>
    </div>
</template>

<script>

</script>
