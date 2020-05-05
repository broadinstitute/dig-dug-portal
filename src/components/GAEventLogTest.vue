<template>
    <button @click="fetchResults">Hello Google Analytics: {{ value }}</button>
</template>

<script>
    import Vue from "vue";
    import gaUtils from "@/utils/gaUtils";

    export default Vue.component(
        "ga-event-log",
        {

        data() {
            return {
                value: null

            }
        },

        methods: {
            async fetchResults() {
                console.log("GAEventLogTest.vue.fetchResults() called!");
                await gaUtils.logAnalyticsEvent("Testing Google Event Log", "GAEventLogTest.vue","Called?","True");
                this.value = ' Event Sent!'
            }
        },
    })

</script>
