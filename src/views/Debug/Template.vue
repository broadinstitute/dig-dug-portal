<template>
    <div>
        <locuszoom-wip
            v-bind:store="$store"
            v-bind:modules="['associations']"

            v-bind:assoc="['StaticJSON', { data: [] }]"
            v-bind:panels="['association','genes','intervals']"

            v-bind:chrom="$store.state.chrom"
            v-bind:start="$store.state.start"
            v-bind:end="$store.state.end"
        >
        </locuszoom-wip>
    </div>
</template>

<script>

</script>
