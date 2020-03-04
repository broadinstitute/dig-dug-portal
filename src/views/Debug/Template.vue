<template>
    <div>
        <locuszoom-old
            v-bind:assoc="['StaticJSON', { data: [] }]"
            v-bind:panels="['association','genes','intervals']"

            v-bind:chrom="$store.state.chrom"
            v-bind:start="$store.state.start"
            v-bind:end="$store.state.end"
        >
        </locuszoom-old>
    </div>
</template>

<script>

</script>
