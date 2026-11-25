<template>
    <button @click="fetchResults">Hello Google Analytics: {{ value }}</button>
</template>

<script>
    import gaUtils from "@/utils/gaUtils";

    export default {
        name: "ga-event-log",

        data() {
            return {
                value: null

            }
        },

        methods: {
            async fetchResults() {
                await gaUtils.logAnalyticsEvent("GA Event Log Vue","Test Event","Special Number",42);
                this.value = "Event Sent!";
            }
        },
    }

</script>
