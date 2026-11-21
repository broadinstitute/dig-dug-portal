<template>
    <div id="analytics">
        <ga-errors></ga-errors>
        <ga-pageview></ga-pageview>
    </div>
</template>
<script>
    import gaUtils from "@/utils/gaUtils";
    import GAErrors from "@/components/analytics/GAErrors"
    import GAPageView from "@/components/analytics/GAPageView"

    export default {
        name: "analytics",
        components: {
            GAErrors,
            GAPageView,
            GaErrors: GAErrors,
            GaPageview: GAPageView,
        },
    };

</script>
