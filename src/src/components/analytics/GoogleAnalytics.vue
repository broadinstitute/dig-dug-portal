<template>
    <div id="analytics">
        <ga-errors></ga-errors>
        <ga-pageview></ga-pageview>
    </div>
</template>
<script>
    import Vue from "vue";
    import gaUtils from "@/utils/gaUtils";
    import GAErrors from "@/components/analytics/GAErrors"
    import GAPageView from "@/components/analytics/GAPageView"

    export default Vue.component("analytics", {
        components: {
            GAErrors,
            GAPageView
        },
    });

</script>
