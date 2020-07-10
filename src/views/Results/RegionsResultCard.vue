<template>
    <div>
        <h4>{{title}}</h4>
        <regions-table
            :regions="regions"
        ></regions-table>
    </div>
</template>
<script>
import Vue from "vue"
import RegionsTable from "@/components/RegionsTable"

export default Vue.component('regions-result-card', {
    props: ["title", "regions"],
    components: {
        RegionsTable
    },
})
</script>
