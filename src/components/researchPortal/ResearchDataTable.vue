<template>
    <div class="research-data-table-wrapper">
        <table
            :class="
                'table table-sm table-bordered table-hover research-data-table ' +
                pageID
            "
            v-if="!!dataset && !!tableFormat"
        >
            <thead class="top-level-header">
                <tr>
                    <th
                        v-for="(value, index) in tableFormat['top rows']"
                        :key="index"
                        v-html="value"
                        class="top-level-header-item"
                    ></th>
                    <th
                        class="top-level-header-item"
                        v-if="tableFormat['features'] != undefined"
                    >
                        View evidence
                    </th>
                </tr>
            </thead>

            <tbody
                v-for="(value, index) in dataset"
                :key="index"
                class="top-level-value"
            >
                <tr>
                    <td
                        v-if="tableFormat['top rows'].includes(tdKey)"
                        v-for="(tdValue, tdKey) in value"
                        :key="tdKey"
                        v-html="tdValue"
                    ></td>
                    <td v-if="tableFormat['features'] != undefined">View</td>
                </tr>
                <tr
                    v-if="tableFormat['features'] != undefined"
                    :id="index"
                    :class="'hidden'"
                >
                    <td :colspan="topRowNumber">
                        <research-data-table-features
                            :featuresData="value.features"
                            :featuresFormat="tableFormat"
                        ></research-data-table-features>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
import Vue from "vue";
import ResearchDataTableFeatures from "@/components/researchPortal/ResearchDataTableFeatures.vue";

export default Vue.component("research-data-table", {
    props: ["pageID", "dataset", "tableFormat"],
    data() {
        return {};
    },
    modules: {},
    components: { ResearchDataTableFeatures },
    created() {},
    beforeMount() {},

    mounted() {},
    updated() {},
    computed: {
        topRowNumber() {
            let topRows =
                this.tableFormat["features"] != undefined
                    ? this.tableFormat["top rows"].length + 1
                    : this.tableFormat["top rows"].length;
            return topRows;
        },
    },
    watch: {},
    methods: {},
});
</script>

<style>
.research-data-table-wrapper {
    font-size: 14px;
    line-height: 18px;
}

.research-data-table {
    border: solid 1px #eee;
}
</style>
