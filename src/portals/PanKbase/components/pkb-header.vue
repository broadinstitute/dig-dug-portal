<template>
    <div style="width: 100%">
        <google-analytics></google-analytics>
        <div class="pkb-nav">
            <div class="logo">
                <a href="/">
                    <img
                        style="height: 50px"
                        src="https://hugeampkpncms.org/sites/default/files/users/user32/pankbase/PanKbase_logo-black-tagline.svg"
                    />
                </a>
            </div>
            <div style="display:flex; gap:10px; align-items: center;">
                <div class="menu-wrapper">
                    <div class="topmenu">
                        <a class="topmenu-item">
                            Search
                            <img
                                style="height: 15px; width: 15px"
                                src="https://hugeampkpncms.org/sites/default/files/users/user32/pankbase/search-icon.svg"
                            />
                        </a>
                        <a class="topmenu-item"> Analysis </a>
                        <a class="topmenu-item">
                            Login
                            <img
                                style="height: 15px; width: 15px"
                                src="https://hugeampkpncms.org/sites/default/files/users/user32/pankbase/user-icon.svg"
                            />
                        </a>
                    </div>
                    <div class="menu">
                        <div class="main-menu-items">
                            <div
                                v-for="item in pkbMenu.highlightItems"
                                class="menu-item-wrapper"
                                :class="{ active: isActive(item.path) }"
                            >
                                <a
                                    class="menu-item menu-item-main"
                                    :href="item.path"
                                    >{{ item.label }}</a
                                >
                            </div>
                        </div>
                        <div
                            v-for="item in pkbMenu.menuItems"
                            class="menu-item-wrapper"
                            :class="{ active: isActive(item.path) }"
                        >
                            <a class="menu-item" :href="item.path || null">{{
                                item.label
                            }}</a>
                            <div v-if="item.subMenuItems" class="submenu">
                                <a
                                    v-for="subItem in item.subMenuItems"
                                    class="submenu-item"
                                    :href="subItem.path || null"
                                    :class="{ active: isActive(subItem.path) }"
                                    :data-whatever="
                                        isActive(subItem.path).toString()
                                    "
                                    >{{ subItem.label }}</a
                                >
                            </div>
                        </div>
                    </div>
                </div>
                <a href="https://hirnetwork.org/" target="_blank">
                    <img style="height:37px" src="https://hugeampkpncms.org/sites/default/files/images/pankbase/logo-hirn.svg" />
                </a>
            </div>
            <div class="pkb-beta">beta</div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics4.vue";
import { pkbMenu } from "@/portals/PanKbase/assets/pkbMenu.js";

let menuItemActive = false;

export default Vue.component("PkbHeader", {
    components: {
        GoogleAnalytics,
    },
    props: {},
    data() {
        return {
            pkbMenu,
        };
    },
    computed: {},
    created() {
        this.injectFavicon(
            "https://hugeampkpncms.org/sites/default/files/users/user32/pankbase/PanKbase_logo-icon.png"
        );
        this.injectFont(
            "https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap"
        );
    },
    methods: {
        injectFavicon(faviconUrl) {
            //todo: make util
            let favicon = document.querySelector('link[rel="icon"]');
            if (!favicon) {
                favicon = document.createElement("link");
                favicon.setAttribute("rel", "icon");
                favicon.setAttribute("type", "image/png");
                document.head.appendChild(favicon);
            }
            favicon.setAttribute("href", faviconUrl);
        },
        injectFont(fontUrl) {
            //todo: make util
            const linkTag = document.createElement("link");
            linkTag.rel = "stylesheet";
            linkTag.href = fontUrl;
            document.head.appendChild(linkTag);
            linkTag.onload = () => {};
        },
        isActive(path) {
            //compare menu item's path to current path to set active
            //but only the first instance
            if (menuItemActive) return false;
            const currentPath = window.location.pathname;
            if (path === currentPath) {
                menuItemActive = true;
                return true;
            } else {
                return false;
            }
        },
    },
});
</script>
<style scoped>
.pkb-nav {
    position: relative;
    width: 100%;
    background: #fafafa;
    display: flex;
    justify-content: space-between;
    padding: 5px 20px 0 15px;
    border-bottom: 2px solid var(--pkb-primary-green);
    box-shadow: 0px 2px 5px var(--pkb-primary-green);
    z-index: 10;
    font-family: "Open Sans", sans-serif;
}
a,
a:visited {
    color: black !important;
}
a:hover {
    text-decoration: none;
}
.logo {
    display: flex;
    align-items: baseline;
    cursor: pointer;
    align-self: center;
}
.logo-text {
    position: relative;
    font-weight: 800;
    font-size: 18px;
    color: var(--pkb-primary-green);
    margin-left: -10px;
}
.logo-super {
    position: absolute;
    bottom: 17px;
    right: 0;
    font-weight: 500;
    font-size: 11px;
    color: var(--pkb-secondary-green);
}
.menu-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
}
.topmenu {
    display: flex;
    align-items: center;
    gap: 0px;
}
.topmenu-item {
    color: var(--pkb-black);
    padding: 5px 10px;
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    font-size: 12px;
}
.topmenu-item:hover {
    color: var(--pkb-secondary-green) !important;
}
.topmenu-item:hover svg * {
    stroke: var(--pkb-secondary-green) !important;
}
.menu {
    display: flex;
    font-weight: 600;
}
.menu-item-wrapper {
    position: relative;
    display: flex;
}
.main-menu-items {
    display: flex;
    position: relative;
    padding-right: 2px;
}
.main-menu-items:after {
    content: "";
    position: absolute;
    top: 7px;
    right: 0px;
    width: 2px;
    background-color: var(--pkb-primary-green);
    height: 50%;
}
.menu-item {
    position: relative;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 10px 10px 0 0;
    font-weight: 600;
    color: var(--pkb-black);
    border-bottom: 5px solid transparent;
}
.menu-item.menu-item-main {
    color: var(--pkb-primary-green) !important;
}
.menu-item.menu-item-selected {
    color: var(--pkb-primary-green);
    border-bottom: 5px solid var(--pkb-primary-green);
}
.menu-item-wrapper:hover .menu-item,
.menu-item-wrapper.active .menu-item,
.menu-item-wrapper:has(.submenu-item.active) .menu-item {
    color: var(--pkb-primary-green) !important;
    border-bottom: 5px solid var(--pkb-primary-green);
}
.menu-item-wrapper:hover > .submenu {
    display: flex;
}
.submenu {
    position: absolute;
    top: 100%;
    right: 0;
    background: var(--pkb-secondary-green);
    padding: 10px 10px 15px 15px;
    border-radius: 0 0 5px 5px;
    width: max-content;
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
    display: none;
    border-top: 2px solid var(--pkb-primary-green);
    box-shadow: inset 0 7px 5px -5px var(--pkb-primary-green);
}
.submenu-item {
    color: var(--pkb-black);
    width: -webkit-fill-available;
    text-align: right;
}
.submenu-item:hover,
.submenu-item.active {
    color: white !important;
    cursor: pointer;
}
.pkb-beta {
    height: 20px;
    line-height: 16px;
    background: #219197;
    color: white;
    padding: 2px 15px 0;
    position: absolute;
    bottom: -20px;
    left: 19px;
    mix-blend-mode: multiply;
    display:none;
}
</style>
