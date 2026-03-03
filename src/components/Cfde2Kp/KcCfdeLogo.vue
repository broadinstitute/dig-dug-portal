<template>
    <div class="rp-header-logo">
        <p>
            <a href="https://cfdeknowledge.org/r/kc_landing">
                <img :src="kcLogo">
            </a>
            <span>|</span>
            <img :src="cfdeLogo">
        </p>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVue } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.use(BootstrapVue);

export default Vue.component("kc-cfde-logo", {
    name: "KcCfdeLogo",
    props: {
        kcLogo: {
            type: String,
            default: "https://hugeampkpncms.org/sites/default/files/users/user32/cfde_kc_logo_d_beta.svg",
        },
        cfdeLogo: {
            type: String,
            default: "https://hugeampkpncms.org/sites/default/files/users/user32/kc_icons/CFDE_logo.png",
        },
    },
});
</script>

<style scoped>
.rp-header-logo {
    display: block;
    justify-content: center;
    align-items: center;
    position: absolute;
    right: 15px;
    top: 15px;
}
.rp-header-logo img {
    height: 40px;
}

.rp-header-logo span {
    display: inline-block;
    color: white;
    background: #ccc;
    height: 100%;
    width: 1px;
    margin: 0 5px;
}
</style>