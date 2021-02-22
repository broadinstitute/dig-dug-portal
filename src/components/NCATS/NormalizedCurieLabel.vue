<template>
    <span>{{label}}</span>
</template>
<script>
import Vue from "vue";
import trapi from "./trapi"

export default Vue.component('curie-label', {
    props: ["curie"],
    data() {
        return {
            label: null,
        }
    },
    async mounted() {
        this.label = await trapi.normalize.curieLabel(this.curie);
    },
})
</script>
