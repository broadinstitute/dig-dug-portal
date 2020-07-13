<template>
    <div>
        <result-card :title="title">
            <template #content>
                <!-- TODO: For posterity: would be interesting for tables to have selectable rows to trigger side-effects (like modifying sidebar or prompting popups/navs) -->
                <regions-table
                    :regions="regions"
                ></regions-table>
            </template>
            <template #sidebar>
                <regions-results-sidebar :regions="regions"></regions-results-sidebar>
            </template>
        </result-card>
    </div>
</template>
<script>
import Vue from "vue"
import ResultCard from "./ResultCard"
import RegionsResultsSidebar from "./RegionsResultSidebar"
import RegionsTable from "@/components/RegionsTable"

export default Vue.component('regions-result-card', {
    props: ["title", "regions"],
    components: {
        ResultCard,
        RegionsTable,
        RegionsResultsSidebar,
    },
})
</script>
