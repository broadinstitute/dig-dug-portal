<script>
import Vue from "vue";
import gaUtils from "@/utils/gaUtils";
import VueCookies from "vue-cookies";
Vue.use(VueCookies);

export default {
    name: "ga-pageview",
    render(h) {
        return h("div");
    },
    async created() {
        await gaUtils.logPageView(window.location.href, document.referrer);
    }
};
</script>
