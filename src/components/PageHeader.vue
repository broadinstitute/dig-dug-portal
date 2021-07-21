<template>
    <div>
        <img v-if="bioindex_dev" src="/images/dev_flag.svg" class="dev-flag" />
        <analytics></analytics>
        <alert></alert>

        <!-- Menu header-->
        <div v-if="diseaseGroup" class="container-fluid">
            <div class="row amp-banner-2021" v-if="diseaseGroup.default">
                <a
                    href="https://fnih.org/our-programs/amp/accelerating-medicines-common-metabolic-diseases"
                    ><img
                        :src="'//kp4cd.org/sites/default/files/vueportal/amp_text.svg'"
                        style="
                            width: 500px;
                            margin-left: 15px;
                            margin-top: 15px;
                        "
                /></a>
            </div>
            <div
                class="row amp-banner-2021"
                v-if="!!diseaseGroup.portalGroup && (diseaseGroup.portalGroup != diseaseGroup.name)"
                style="height: 50px; display: block"
            >
                <a :href="url2Md">
                    <div style="padding: 5px; text-align: center; height: 50px">
                        <img
                            :src="'//kp4cd.org/sites/default/files/vueportal/portals2mdkp_banner.svg'"
                            :class="'portals-2-mdkp-logo'"
                        />
                    </div>
                </a>
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
        	if (!!this.diseaseGroup && !!this.diseaseGroup.portalGroup) {
            	return host.urlWithSubdomain(this.diseaseGroup.portalGroup).href;
         	} else {
         		return host.urlWithSubdomain().href;
         	}
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
