<template>
</template>
<script>
export default {
    data() {
        return {
            chr: 8,
            start: 117962512,
            end: 118188952,
            phenotype: 'BMI'
        }
    },
    methods: {
        spy(message) {
            console.log(`spy ${message}`)
        }
    }
}
</script>
