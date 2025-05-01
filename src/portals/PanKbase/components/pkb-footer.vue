<template>
    <div class="pkb-footer">
        <div class="menu">
            <div class="main-menu-items">
                <div v-for="item in pkbMenu.highlightItems" class="menu-item-wrapper">
                    <a class="menu-item menu-item-main" :href="item.path">{{ item.label }}</a>
                </div>
            </div>
            <div v-for="item in pkbMenu.menuItems" class="menu-item-wrapper">
                <a class="menu-item" :href="item.path || null">{{ item.label }}</a>
                <div v-if="item.subMenuItems" class="submenu">
                    <a v-for="subItem in item.subMenuItems" class="submenu-item" :href="subItem.path || null">{{ subItem.label }}</a>
                </div>
            </div>
        </div>
        <div class="f-row" style="gap:20px">
            <a href="/">
                <img style="height:37px" src="https://hugeampkpncms.org/sites/default/files/users/user32/pankbase/PanKbase_logo-black.svg"/>
            </a>
            <div>
                Supported by <strong>National Institutes of Health (NIH)</strong> grants <strong>U24 DK138515</strong>, <strong>U24 DK138512</strong><br>
                Supplemental funds from the <strong>NIH Office of Data Science Strategies</strong>
            </div>
            <a href="https://hirnetwork.org/" target="_blank">
                <img style="height:37px" src="https://hugeampkpncms.org/sites/default/files/images/pankbase/logo-hirn.svg" />
            </a>
        </div>
        
        
    </div>
</template>

<script>
import Vue from "vue";
import { pkbMenu } from '@/portals/PanKbase/assets/pkbMenu.js';

export default Vue.component("PkbFooter", {
    components: {},
    props: {},
    data() { 
        return {
            pkbMenu
        } 
    },
    computed: {},
    created() {},
    methods: {},
});
</script>

<style scoped>
.pkb-footer {
    width: 100%;
    background: #fafafa;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 40px 20px;
    border-top: 3px solid var(--pkb-primary-green);
    box-shadow: 0px 2px 10px var(--pkb-primary-green);
    min-height: 70px;
    margin-top: auto;
    flex-direction: column;
    gap: 40px;

    .menu {
        display: flex;
        gap: 20px;
    }
    .menu a, .menu a:visited {
        color: black !important;
    }
    .menu a:hover{
        color: var(--pkb-secondary-green) !important;
        text-decoration: none;
    }
    .menu-item-wrapper {
        display: flex;
        flex-direction: column;
    }
    .submenu {
        display: flex;
        flex-direction: column;
    }
    a.submenu-item {
        font-weight: normal;
    }
}
</style>
