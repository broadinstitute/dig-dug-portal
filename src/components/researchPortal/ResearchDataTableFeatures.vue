<template>
    <div class="research-data-table-features-wrapper">
        <div v-for="(value, index) in featuresFormat['features']" :key="index">
            <div>{{ value }}</div>
            <table class="table">
                <tr>
                    <th
                        v-for="(headerValue, headerIndex) in featuresFormat[
                            value
                        ]"
                        :key="headerIndex"
                        v-html="headerValue"
                    ></th>
                </tr>
                <tr
                    v-for="(featureValue, featureIndex) in featuresData[value]"
                    :key="featureIndex"
                >
                    <td
                        v-for="(contentValue, contentKey) in featureValue"
                        :key="contentKey"
                        v-html="contentValue"
                    ></td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("research-data-table-features", {
    props: ["featuresData", "featuresFormat"],
    data() {
        return {};
    },
    modules: {},
    components: {},
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
.clear-all-filters-bubble {
    background-color: #ff0000;
}
</style>
