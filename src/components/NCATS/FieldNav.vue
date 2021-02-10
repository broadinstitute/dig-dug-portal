<template>

</template>
<script>
import Vue from "vue";
import PredicateTable from "@/components/NCATS/PredicateTable"
export default Vue.component('ncats-predicates', {
    props: ["knowledgeSource", "withFields", "withoutFields"],
    components: {
        PredicateTable
    }
})
</script>
