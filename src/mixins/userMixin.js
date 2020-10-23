import Vue from "vue";
import VueCookies from "vue-cookies";
import host from "@/utils/hostUtils";
import ga from "@/utils/gaUtils";
Vue.use(VueCookies);

export const userMixin = {
    computed: {
        user() {
            return this.$store.state.bioPortal.user;
        }
    },
    methods: {
        saveCurrentPage() {
            Vue.$cookies.set("whereAmI", location.href, "", "", host.domain);
        },
        loginUser() {
            this.saveCurrentPage();
            console.log('login', location.href)
            ga.logPageView(location.href, "/login");
            window.location.href = "/login";
        }
    }
};
