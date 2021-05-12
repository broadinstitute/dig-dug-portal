<template>
    <div class="research-header-menu-wrapper container-fluid">
        <!-- Menu header-->

        <ul v-if="!!this.researchMenu">
            <li
                v-for="menu in this.researchMenu"
                :key="menu.label"
                class="menu"
            >
                <a :href="menu.link">{{ menu.label }}</a>
            </li>
        </ul>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("research-page-header", {
    props: ["researchMenu"],
    components: {},

    data() {
        return {};
    },
    created() {},
    computed: {},
    watch: {},
});
</script>

<style>
.research-header-menu-wrapper {
    background-color: cornflowerblue;
    padding-top: 10px;
    padding-bottom: 10px;
}

.research-header-menu-wrapper ul {
    list-style: none;
    text-align: center;
    padding: 0;
    margin: 0;
}

.research-header-menu-wrapper ul li {
    display: inline-block;
    margin: 0 8px;
}

.research-header-menu-wrapper ul li a {
    color: #fff !important;
}

.research-header-menu-wrapper ul li a:hover {
    color: #cdf !important;
}

.research-portal-header-compact {
    width: fit-content !important;
    padding: 15px 15px 0 0 !important;
    margin: 0;
    border: none !important;
    background: none !important;
    float: right;
}

.research-portal-header-compact ul li a {
    color: #007bff !important;
}

.research-portal-header-compact ul li a:hover {
    color: #004bcf !important;
}
</style>
