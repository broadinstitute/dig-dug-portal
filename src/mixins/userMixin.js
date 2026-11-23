import VueCookies from "vue-cookies";
import host from "@/utils/hostUtils";
import gaUtils from "@/utils/gaUtils"

export const userMixin = {
    computed: {
        user() {
            return this.$store.state.bioPortal.user;
        }
    },
    methods: {
        saveCurrentPage() {
            VueCookies.set("whereAmI", location.href, "", "", host.domain);
        },
        async loginUser() {
            this.saveCurrentPage();
            await gaUtils.logPageView(window.location.protocol+'//'+window.location.host+"/login", location.href);
            window.location.href = "/login";
        }
    }
};
