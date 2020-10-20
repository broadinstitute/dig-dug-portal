<template></template>
<script>
import Vue from "vue";
import gaUtils from "@/utils/gaUtils";
export default Vue.component("ga-pageview", {
    async created() {
        await gaUtils.logPageView();
    }
});
</script>
