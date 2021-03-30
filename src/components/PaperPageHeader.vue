<template>
    <div>
        <img v-if="bioindex_dev" src="/images/dev_flag.svg" class="dev-flag" />
        <analytics></analytics>
        <alert></alert>

        <!-- Menu header-->

        <div
            class="paper-header-menu-wrapper container-fluid"
            v-if="!!this.paperMenu"
            v-html="this.paperMenu"
        >
            {{ this.paperMenu }}
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import VueCookies from "vue-cookies";
import host from "@/utils/hostUtils";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import { userMixin } from "@/mixins/userMixin";
Vue.use(VueCookies);

export default Vue.component("paper-page-header", {
    props: ["diseaseGroup", "frontContents", "paperMenu"],
    components: {
        GoogleAnalytics,
    },
    mixins: [userMixin],
    data() {
        return {
            bioindex_dev: false,
        };
    },
    created() {
        if (Vue.$cookies.isKey("session")) {
            this.$store.dispatch(
                "bioPortal/getUser",
                Vue.$cookies.get("session")
            );
        }
        if (BIO_INDEX_HOST.indexOf("dev") != -1) this.bioindex_dev = true;
    },
    computed: {
        currentPage() {
            return window.location.pathname;
        },
        url2Md() {
            return host.urlWithSubdomain().href;
        },
    },
    watch: {
        diseaseGroup(group) {
            if (!!group && !!group.title) {
                let s = document.title.split(" - ");

                // NB: If the <title> changes in index.html to use a different
                //     separator other than ' - ', please update this code.
                s[0] = group.title;
                document.title = s.join(" - ");

                // find the shortcut icon
                let links = document.getElementsByTagName("link");

                for (let i = 0; i < links.length; i++) {
                    if (links[i].rel == "shortcut icon") {
                        links[
                            i
                        ].href = `https://kp4cd.org/sites/default/files/vueportal/favicon/${group.name}/favicon.png`;
                    }
                }
            }
        },
    },
});
</script>

<style>
.paper-header-menu-wrapper {
    background-color: cornflowerblue;
    padding-top: 10px;
    padding-bottom: 10px;
}

.paper-header-menu-wrapper ul {
    list-style: none;
    text-align: center;
    padding: 0;
    margin: 0;
}

.paper-header-menu-wrapper ul li {
    display: inline-block;
    margin: 0 8px;
}

.paper-header-menu-wrapper ul li a {
    color: #fff !important;
}

.paper-header-menu-wrapper ul li a:hover {
    color: #cdf !important;
}
</style>
