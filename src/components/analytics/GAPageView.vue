<script>
import gaUtils from "@/utils/gaUtils";

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
