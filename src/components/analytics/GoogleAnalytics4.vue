<template>
    <div id="analytics"></div>
</template>
<script>
import Vue from "vue";
import VueGtag from "vue-gtag";

Vue.use(VueGtag, {
    config: {
        id: process.env.VUE_APP_GA4_ID || "G-D3G6XZYGBR",
        params: { send_page_view: true },
    },
    appName: "HuGeAMP",
    pageTrackerScreenviewEnabled: true,
});

export default {
    name: "GoogleAnalytics",
};
</script>
