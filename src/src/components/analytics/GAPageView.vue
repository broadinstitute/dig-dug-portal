<template>
</template>
<script>
import Vue from "vue";
import gaUtils from "@/utils/gaUtils";
import VueCookies from "vue-cookies";
Vue.use(VueCookies);

export default Vue.component("ga-pageview", {
    async created() {
        await gaUtils.logPageView(window.location.href, document.referrer);
    }
});
</script>
