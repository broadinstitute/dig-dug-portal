<template>
    <!--
        As of 10/20/2020 our security policy in our server, excludes referers from the header when bringing in HTTPS traffic.
        This means Google Analytics looses tracback data that could be used to organize incoming pageviews, particularly by subdomain.

        Although this policy is generally good (https://developer.mozilla.org/en-US/docs/Web/Security/Referer_header:_privacy_and_security_concerns, to restore this information for just dig-dug-portal traffic I'm using this meta header.

        To see more on this problem of passing referers to Google Analytics see these resources:
        https://www.bmon.co.uk/2017/12/solving-the-https-to-http-referrer-problem-in-google-analytics/
    -->
    <meta name="referrer" content="origin" />
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
