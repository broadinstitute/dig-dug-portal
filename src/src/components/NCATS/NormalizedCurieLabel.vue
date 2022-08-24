<template>
    <span>{{biolinkTypeFormatter(label)}}</span>
</template>
<script>
import Vue from "vue";
import trapi from "./trapi"
import Formatters from "@/utils/formatters";

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
    methods: {
        biolinkTypeFormatter(label) {
            const probablyHasPrefix = el => el.includes(':')
            if (label != null && probablyHasPrefix(label)) {
                return Formatters.capitalizedFormatter(trapi.identifiers._stripPrefix(label))
            } else {
                return label;
            }
        }
    }
})
</script>
