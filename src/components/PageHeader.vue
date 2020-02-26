<template>
    <!-- Menu header-->
    <div class="container-fluid">
        <div class="row amp-header" v-if="diseaseGroup == 'md'">
            <div class="amp-banner-right">
                <div class="amp-banner-left">
                    <a
                        href="http://www.nih.gov/research-training/accelerating-medicines-partnership-amp/type-2-diabetes"
                    >ACCELERATING MEDICINES PARTNERSHIP (AMP)</a>
                </div>
            </div>
        </div>
        <div class="row amp-header" v-if="diseaseGroup != 'md'" style="height: 50px;">
            <div class="amp-banner-right" style="height: 50px;">
                <a :href="url2Md">
                    <div
                        class="amp-banner-left"
                        style="padding: 5px; text-align: center;height: 50px;"
                    >
                        <img :src="'images/portals2mdkp_banner.svg'" :class="'portals-2-mdkp-logo'" />
                    </div>
                </a>
            </div>
        </div>
        <div :class="'row '+diseaseGroup+'kp-header'">
            <div :class="diseaseGroup+'kp-logo-wrapper col-md-4'">
                <img
                    :src="'images/'+diseaseGroup+'kp_header_logo.svg'"
                    :class="diseaseGroup+'kp-logo'"
                />
                <div
                    :class="'header-disease-group-select-wrapper'"
                    v-if="diseaseGroup == 'md' && currentPage != '/' && currentPage != ''"
                >
                    <disease-group-select></disease-group-select>
                </div>
            </div>
            <div :class="diseaseGroup+'kp-menu-wrapper col-md-8'">
                <ul :class="diseaseGroup+'kp-menu'">
                    <li>
                        <a href>Home</a>
                    </li>
                    <li>
                        <a href>Data</a>
                    </li>
                    <li>
                        <a href>Tools</a>
                    </li>
                    <li>
                        <a href>Information</a>
                    </li>
                    <li>
                        <a href>Help</a>
                    </li>
                    <li v-if="user">
                        <a href="/logout" :class="diseaseGroup+'kp-login'">Logout</a>
                    </li>
                    <li v-else>
                        <a href="/login" :class="diseaseGroup+'kp-login'">Login</a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import VueCookies from "vue-cookies";

import DiseaseGroupSelect from "@/components/DiseaseGroupSelect.vue";

Vue.use(VueCookies);

export default Vue.component("page-header", {
    data() {
        return {};
    },
    created() {
        //simple cookie check for now
        this.user = Vue.$cookies.isKey("email") || false;
    },
    componenets: {
        DiseaseGroupSelect
    },
    data() {
        return {};
    },
    computed: {
        diseaseGroup() {
            return this.$store.state.diseaseGroup.id;
        },
        currentPage() {
            return this.$store.state.diseaseGroup.currentPath;
        },
        url2Md() {
            return this.$store.state.diseaseGroup.url2Md;
        }
    }
});
</script>
