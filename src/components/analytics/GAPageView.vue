<template>
</template>
<script>
import Vue from "vue";
import gaUtils from "@/utils/gaUtils";
import { url, domain, subDomain } from "@/utils/hostUtils";

export default Vue.component("ga-pageview", {
    async created() {
        await gaUtils.logPageView(window.location.href);
    }
});
</script>
