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
</style>
