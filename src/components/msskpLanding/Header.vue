<template>
    <header class="msskp-landing-header">
        <div class="msskp-landing-header-logo">
            <img
                src="//kp4cd.org/sites/default/files/vueportal/mskkp_header_logo.png"
                alt="MSK-KP"
            />
        </div>
        <nav class="msskp-landing-header-menu">
            <span
                v-for="item in menuItems"
                :key="item"
            >{{ item }}</span>
        </nav>
    </header>
</template>

<script>
import Vue from "vue";

export default Vue.component("msskp-landing-header", {
    props: ["diseaseGroup", "frontContents"],
    data() {
        return {
            menuItems: ["Home", "Data", "Tools", "About"],
        };
    },
});
</script>

<style>
.msskp-landing-header {
    height: 50px;
    width: 100%;
    background-color: #bcafd6;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.msskp-landing-header-logo {
    display: flex;
    align-items: center;
    height: 50px;
    padding-left: 20px;
}

.msskp-landing-header-logo img {
    height: 50px;
    width: auto;
    display: block;
}

.msskp-landing-header-menu {
    margin-right: 50px;
    display: flex;
    align-items: center;
}

.msskp-landing-header-menu span {
    color: #fff;
    padding: 0 10px;
    font-size: 16px;
    font-weight: 300;
}
</style>
