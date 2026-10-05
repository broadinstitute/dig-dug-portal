<template>
    <div class="cfde-protein-page">
    </div>
</template>

<script>
export default {
    name: "cfdeProteinPage",
    props: {
        phenotypesInUse: {
            type: [Array, Object],
            default: () => [],
        },
        utilsBox: {
            type: Object,
            default: () => ({}),
        },
        sectionConfigs: {
            type: [Array, Object],
            default: () => ({}),
        },
    },
};
</script>

<style scoped>
</style>
