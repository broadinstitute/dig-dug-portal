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
                        >ACCELERATING MEDICINES PARTNERSHIP (AMP)</a>
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
                <div :class="diseaseGroup.name + 'kp-menu-wrapper col-md-8'">
                    <ul :class="diseaseGroup.name + 'kp-menu kp-menu'">
                        <li class="am-menu">
                            <a href="/">Home</a>
                        </li>
                        <li class="am-menu">
                            <a href>Data</a>
                            <ul class="am-submenu">
                                <menu-item
                                    :group="diseaseGroup.name"
                                    name="page.data.epigeneticdatasets"
                                    menu="Epigenetic Datasets"
                                    link="/epigeneticdatasets.html"
                                ></menu-item>
                                <li page="data">
                                    <a :href="'/datasets.html'">Genetic association datasets</a>
                                </li>
                                <li page="data">
                                    <a :href="'/downloads.html'">Downloads</a>
                                </li>
                                <menu-item
                                    :group="diseaseGroup.name"
                                    name="page.data.apis"
                                    menu="APIs"
                                    link="/apis.html"
                                ></menu-item>
                            </ul>
                        </li>
                        <li class="am-menu">
                            <a href>Tools</a>
                            <ul class="am-submenu">
                                <!-- <li page="hugecalculator">
                                    <a href="/hugecalculator.html">HuGe Calculator</a>
                                </li>-->
                                <li page="hugecalculator">
                                    <a href="/hugecalculator.html?gene=SLC30A8">HuGe Calculator</a>
                                </li>
                                <menu-item
                                    :group="diseaseGroup.name"
                                    name="page.tools.effectorgenes"
                                    menu="Predicted Effector Genes"
                                    link="/effectorgenes.html"
                                ></menu-item>
                            </ul>
                        </li>
                        <li class="am-menu">
                            <a href>Information</a>
                            <ul class="am-submenu">
                                <li page="information">
                                    <a href="/about.html">About</a>
                                </li>
                                <menu-item
                                    :group="diseaseGroup.name"
                                    name="page.information.collaborate"
                                    menu="Collaborate"
                                    link="/collaborate.html"
                                ></menu-item>
                                <li page="information">
                                    <a href="/policies.html">Policies</a>
                                </li>
                                <li page="information">
                                    <a href="/resources.html">Resources</a>
                                </li>
                                <menu-item
                                    :group="diseaseGroup.name"
                                    name="page.information.publications"
                                    menu="Publications"
                                    link="/publications.html"
                                ></menu-item>
                                <li page="information">
                                    <a href="/news.html">News</a>
                                </li>
                                <!--<li page="information">
                                    <a href="/contacts.html">Contacts</a>
                                </li>-->
                            </ul>
                        </li>
                        <li class="am-menu">
                            <a href="//kp4cd.org/contact">Contact</a>
                        </li>
                        <li v-if="!!user">
                            <a
                                href="/logout"
                                :class="diseaseGroup.name + 'kp-login'"
                                :title="user"
                            >Logout</a>
                        </li>
                        <li v-else>
                            <a
                                href="/login"
                                @click.prevent="loginUser"
                                :class="diseaseGroup.name + 'kp-login'"
                            >Login</a>
                        </li>
                    </ul>
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
});
</script>
