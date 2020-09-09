<template>
    <div>
        <analytics></analytics>
        <alert></alert>

        <!-- Menu header-->
        <div v-if="diseaseGroup" class="container-fluid">
            <div class="row amp-header" v-if="diseaseGroup.default">
                <div class="amp-banner-right">
                    <div class="amp-banner-left">
                        <a
                            href="http://www.nih.gov/research-training/accelerating-medicines-partnership-amp/type-2-diabetes"
                        >ACCELERATING MEDICINES PARTNERSHIP (AMP)</a>
                    </div>
                </div>
            </div>
            <div
                class="row amp-header"
                v-if="!diseaseGroup.default && diseaseGroup.memberCMD"
                style="height: 50px;"
            >
                <div class="amp-banner-right" style="height: 50px;">
                    <a :href="url2Md">
                        <div
                            class="amp-banner-left"
                            style="padding: 5px; text-align: center;height: 50px;"
                        >
                            <img
                                :src="'https://kp4cd.org/sites/default/files/vueportal/portals2mdkp_banner.svg'"
                                :class="'portals-2-mdkp-logo'"
                            />
                        </div>
                    </a>
                </div>
            </div>
            <div :class="'row '+diseaseGroup.name+'kp-header'">
                <div :class="diseaseGroup.name+'kp-logo-wrapper col-md-4'">
                    <a href="/">
                        <img
                            v-if="frontContents.field_banner_logo"
                            :src="'https://kp4cd.org/sites/default/files/vueportal/'+frontContents.field_banner_logo"
                            :class="diseaseGroup.name+'kp-logo'"
                        />
                        <img
                            v-else
                            src="https://kp4cd.org/sites/default/files/vueportal/mdkp_header_logo.svg"
                            class="mdkp-logo"
                        />
                    </a>
                </div>
                <div :class="diseaseGroup.name+'kp-menu-wrapper col-md-8'">
                    <ul :class="diseaseGroup.name+'kp-menu kp-menu'">
                        <li class="am-menu">
                            <a href="/">Home</a>
                        </li>
                        <li class="am-menu">
                            <a href>Data</a>
                            <ul class="am-submenu">
                                <li
                                    page="data"
                                    v-if="diseaseGroup.name && diseaseGroup.name == 'v2f'"
                                >
                                    <a :href="'/epigeneticdatasets.html'">Epigenetic Datasets</a>
                                </li>
                                <li page="data">
                                    <a :href="'/datasets.html'">Genetic association datasets</a>
                                </li>
                                <li page="data">
                                    <a :href="'/downloads.html'">Downloads</a>
                                </li>
                                <li
                                    page="data"
                                    v-if="diseaseGroup.name && (diseaseGroup.name == 't2d' || diseaseGroup.name == 'md')"
                                >
                                    <a :href="'/apis.html'">APIs</a>
                                </li>
                            </ul>
                        </li>
                        <li class="am-menu">
                            <a href>Tools</a>
                            <ul class="am-submenu">
                                <li
                                    page="tools"
                                    v-if="diseaseGroup.name == 'md' || diseaseGroup.name == 't2d'"
                                >
                                    <a href="/effectorgenes.html">Predicted Effector Genes</a>
                                </li>
                            </ul>
                        </li>
                        <li class="am-menu">
                            <a href>Information</a>
                            <ul class="am-submenu">
                                <li page="information">
                                    <a href="/about.html">About</a>
                                </li>
                                <li
                                    page="information"
                                    v-if="diseaseGroup.name && (diseaseGroup.name != 'v2f' && diseaseGroup.name != 'cvd' && diseaseGroup.name != 'cd' && diseaseGroup.name != 'sleep')"
                                >
                                    <a href="/collaborate.html">Collaborate</a>
                                </li>
                                <li page="information">
                                    <a href="/policies.html">Policies</a>
                                </li>
                                <li page="information">
                                    <a href="/resources.html">Resources</a>
                                </li>
                                <li
                                    page="information"
                                    v-if="diseaseGroup.name && (diseaseGroup.name != 'cvd' && diseaseGroup.name != 'cd' && diseaseGroup.name != 'sleep')"
                                >
                                    <a href="/publications.html">Publications</a>
                                </li>
                                <li page="information">
                                    <a href="/news.html">News</a>
                                </li>
                                <!--<li page="information">
                                    <a href="/contacts.html">Contacts</a>
                                </li>-->
                            </ul>
                        </li>
                        <li class="am-menu">
                            <a href="https://kp4cd.org/contact">Contact</a>
                        </li>
                        <li v-if="user">
                            <a
                                href="/logout"
                                :class="diseaseGroup.name+'kp-login'"
                                :title="user"
                            >Logout</a>
                        </li>
                        <li v-else>
                            <a
                                href="/login"
                                @click="saveCurrentPage"
                                :class="diseaseGroup.name+'kp-login'"
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

Vue.use(VueCookies);

export default Vue.component("page-header", {
    props: ["diseaseGroup", "frontContents"],

    components: {
        GoogleAnalytics,
    },

    data() {
        return {};
    },
    created() {
        //this.user = Vue.$cookies.isKey("session") || false;
        this.user = false;

        if (Vue.$cookies.isKey("session")) {
            fetch(
                "https://oauth2.googleapis.com/tokeninfo?access_token=" +
                    Vue.$cookies.get("session")
            )
                .then((response) => response.json())
                .then((data) => (this.user = data.email));
        }
    },
    computed: {
        currentPage() {
            return window.location.pathname;
        },
        url2Md() {
            return host.urlWithSubdomain().href;
        },
    },
    methods: {
        saveCurrentPage() {
            Vue.$cookies.set("whereAmI", location.href, "", "", host.domain);
        },
        async verifyToken() {
            if (Vue.$cookies.isKey("session")) {
                const response = await fetch(
                    "https://oauth2.googleapis.com/tokeninfo?access_token=" +
                        Vue.$cookies.get("session")
                );
                const data = await response.json();
                console.log("data", data);
                return data.email;
            }
            return false;
        },
    },
});
</script>
