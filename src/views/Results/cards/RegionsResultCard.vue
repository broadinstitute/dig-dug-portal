<template>
    <div>
        <result-card :title="title">
            <template #content>
                <regions-table
                    :regions="regions"
                ></regions-table>
            </template>
            <template #sidebar>
                <p>Sidebar</p>
            </template>
        </result-card>
    </div>
</template>
<script>
import Vue from "vue"
import ResultCard from "./ResultCard"
import RegionsTable from "@/components/RegionsTable"

export default Vue.component('regions-result-card', {
    props: ["title", "regions"],
    components: {
        ResultCard,
        RegionsTable,
    },
})
</script>
