<template>
    <div>
        <img v-if="bioindex_dev" src="/images/dev_flag.svg" class="dev-flag" />
        <analytics></analytics>
        <alert></alert>

        <!-- Menu header-->
        <div v-if="diseaseGroup" class="container-fluid">
            <div class="row amp-header" v-if="diseaseGroup.default">
                <div class="amp-banner-right">
                    <div class="amp-banner-left">
                        <a
                            href="https://www.nih.gov/research-training/accelerating-medicines-partnership-amp/type-2-diabetes"
                            >ACCELERATING MEDICINES PARTNERSHIP (AMP)</a
                        >
                    </div>
                </div>
            </div>
            <div
                class="row amp-header"
                v-if="!diseaseGroup.default && diseaseGroup.memberCMD"
                style="height: 50px"
            >
                <div class="amp-banner-right" style="height: 50px">
                    <a :href="url2Md">
                        <div
                            class="amp-banner-left"
                            style="
                                padding: 5px;
                                text-align: center;
                                height: 50px;
                            "
                        >
                            <img
                                :src="'//kp4cd.org/sites/default/files/vueportal/portals2mdkp_banner.svg'"
                                :class="'portals-2-mdkp-logo'"
                            />
                        </div>
                    </a>
                </div>
            </div>
            <div :class="'row ' + diseaseGroup.name + 'kp-header'">
                <div :class="diseaseGroup.name + 'kp-logo-wrapper col-md-4'">
                    <a href="/">
                        <img
                            v-if="frontContents.field_banner_logo"
                            :src="
                                '//kp4cd.org/sites/default/files/vueportal/' +
                                frontContents.field_banner_logo
                            "
                            :class="diseaseGroup.name + 'kp-logo'"
                        />
                        <img
                            v-else
                            src="//kp4cd.org/sites/default/files/vueportal/mdkp_header_logo.svg"
                            class="mdkp-logo"
                        />
                    </a>
                </div>
                <div :class="'kp-menu-wrapper col-md-8'">
                    <menu-item
                        v-if="!!diseaseGroup.name"
                        :group="diseaseGroup.name"
                        name="header.menu"
                    ></menu-item>
                    <div class="login-menu-wrapper">
                        <ul>
                            <li v-if="!!user">
                                <a
                                    href="/logout"
                                    :class="diseaseGroup.name + 'kp-login'"
                                    :title="user"
                                    >Logout</a
                                >
                            </li>
                            <li v-else>
                                <a
                                    href="/login"
                                    @click.prevent="loginUser"
                                    :class="diseaseGroup.name + 'kp-login'"
                                    >Login</a
                                >
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import VueCookies from "vue-cookies";
import host from "@/utils/hostUtils";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import MenuItem from "@/components/MenuItem.vue";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import { userMixin } from "@/mixins/userMixin";
Vue.use(VueCookies);

export default Vue.component("page-header", {
    props: ["diseaseGroup", "frontContents"],
    components: {
        GoogleAnalytics,
        MenuItem,
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
                document.title = group.title;

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
