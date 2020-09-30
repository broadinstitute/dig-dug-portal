<template>
    <div id="analytics">
        <ga-errors></ga-errors>
    </div>
</template>
<script>
    import Vue from "vue";

    import gaUtils from "@/utils/gaUtils";
    import GAErrors from "@/components/analytics/GAErrors"

    export default Vue.component("analytics", {
        props: ['page'],
        components: {
            GAErrors,
        },
        mounted() {

        },
        methods: {
            async fetchResults() {
                await gaUtils.logAnalyticsEvent(
                    "GA Event Log Vue",
                    "Test Event",
                    {
                        page: this.page,
                        label: "Special Number"
                    },
                    42);
                this.value = "Event Sent!";
            }
        },
    });

</script>
