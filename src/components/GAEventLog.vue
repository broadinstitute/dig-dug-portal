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
                this.value = await gaUtils.logAnalyticsEvent("Click","GAEventLog Test","Event Sent","True");
            }
        },
    })

</script>
