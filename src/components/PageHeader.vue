<template>
    <!-- Menu header-->
    <div class="container-fluid">
        <div
            class="row amp-header"
            :style="this.$store.state.diseaseGroup == 'md' || this.$store.state.diseaseGroup == 't2d'? 'display: block':'display: none'"
        >
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
            :style="this.$store.state.diseaseGroup != 'md' && this.$store.state.diseaseGroup != 't2d'? 'display: block;height: 50px;':'display: none;'"
        >
            <div class="amp-banner-right">
                <a href="./">
                    <div class="amp-banner-left" style="padding: 5px; text-align: center;">
                        <img :src="'images/portals2mdkp_banner.svg'" :class="'portals-2-mdkp-logo'" />
                    </div>
                </a>
            </div>
        </div>
        <div :class="'row '+this.$store.state.diseaseGroup+'kp-header'">
            <div :class="this.$store.state.diseaseGroup+'kp-logo-wrapper col-md-4'">
                <img
                    :src="'images/'+this.$store.state.diseaseGroup+'KP_header_logo.svg'"
                    :class="this.$store.state.diseaseGroup+'kp-logo'"
                />
            </div>
            <div :class="this.$store.state.diseaseGroup+'kp-menu-wrapper col-md-8'">
                <ul :class="this.$store.state.diseaseGroup+'kp-menu'">
                    <li>
                        <a href>Home</a>
                    </li>
                    <li>
                        <a href>Data</a>
                    </li>
                    <li>
                        <a href>Analysis Modules</a>
                    </li>
                    <li>
                        <a href>Disease Specific Resources</a>
                    </li>
                    <li>
                        <a href>Contacts</a>
                    </li>
                    <li v-if="user">
                        <a href="/logout" :class="this.$store.state.diseaseGroup+'kp-login'">Logout</a>
                    </li>
                    <li v-else>
                        <a href="/login" :class="this.$store.state.diseaseGroup+'kp-login'">Login</a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import VueCookies from "vue-cookies";
Vue.use(VueCookies);

export default Vue.component("page-header", {
    data() {
        return {};
    },
    created() {
        //simple cookie check for now
        this.user = Vue.$cookies.isKey("email") || false;
    }
});
</script>
