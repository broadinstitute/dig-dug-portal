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
        components: {
            GAErrors,
        },
    });

</script>
