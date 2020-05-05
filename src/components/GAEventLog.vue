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
                await gaUtils.logAnalyticsEvent("test","GA_event_log_vue","called","true");
                this.value = "Event Sent!";
            }
        },
    })

</script>
