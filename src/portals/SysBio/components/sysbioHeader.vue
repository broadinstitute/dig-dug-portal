<template>
    <div class="header f-row align-v-center spread-out ">
        <a class="logo f-row align-v-center" href="/">
            <img src="https://hugeampkpncms.org/sites/default/files/images/sysbio/logos/sb-color-h.svg">
        </a>
        <div class="menu f-row">
            <div
                v-for="item in nav.menuItems"
                class="menu-item-wrapper"
                :class="{ active: isActive(item.path) }"
            >
                <a class="menu-item" 
                   :href="item.path || null"
                   :target="item.external ? '_blank' : null"
                >
                    {{ item.label}}
                </a>
                <div v-if="item.subMenuItems" class="submenu">
                    <a
                        v-for="subItem in item.subMenuItems"
                        class="submenu-item"
                        :class="{ active: isActive(subItem.path) }"
                        :href="subItem.path || null"
                        :target="subItem.external ? '_blank' : null"
                    >
                        {{ subItem.label }}
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";

import sysbioMenu from "@/portals/SysBio/assets/sysbioMenu.json";
let menuItemActive = false;

export default Vue.component("sysbio-header", {
    components: {},
    props: {
    },
    data() {
        return {
            nav: sysbioMenu,
        };
    },
    computed: {},
    created() {
        this.injectFavicon(
            "https://hugeampkpncms.org/sites/default/files/images/sysbio/logos/sb-color-icon.svg"
        );
        this.injectFont(
            "https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap"
        );
    },
    methods: {
        injectFavicon(faviconUrl) {
            //todo: make util
            //faviconUrl eg: https://hugeampkpncms.org/sites/default/files/users/user32/matkp/favicon-32x32.png
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
            //fontUrl eg: https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap
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
            const currentPath = window.location.pathname+''+window.location.search;
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
.header {
    padding: 0 40px;
    background: white;
    box-shadow: 0 2px 2px 0px black;
    position:fixed;
    z-index: 100;
    width:100%;

    a, a:visited {
        color: black !important;
        text-decoration: none;
    }
    .logo {
        height: 75px;
        padding: 10px 0;
        gap: 10px;
        font-size: 22px;
    }
    .logo img {
        height: 100%;
    }

    /* menu */

    .menu {
        display: flex;
        font-size: 14px;
        letter-spacing: .2px;
        z-index: 5000;
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
        height: 50%;
    }
    .menu-item {
        position: relative;
        padding: 15px 10px;
        cursor: pointer;
        border-radius: 10px;
        font-weight: 600;
        color: var(--sysbio-black);
        font-weight: bold;
    }
    .menu-item-wrapper:has(.submenu) .menu-item{
        border-radius: 10px 10px 0 0;
    }
    .menu-item.menu-item-main {
        color: var(--sysbio-blue) !important;
    }
    .menu-item.menu-item-selected {
        color: var(--sysbio-blue);
    }
    .menu-item-wrapper:hover .menu-item,
    .menu-item-wrapper.active .menu-item,
    .menu-item-wrapper:has(.submenu-item.active) .menu-item,
    .menu-item-wrapper .submenu-item.active,
    .menu-item-wrapper .submenu-item:hover {
        color: var(--sysbio-blue) !important;
    }
    .menu-item-wrapper:hover .menu-item,
    .menu-item-wrapper:hover .submenu{
        background: white;
        box-shadow: 0 2px 2px 0px black;
    }
    .menu-item-wrapper:hover > .submenu {
        display: flex;
    }
    .submenu {
        position: absolute;
        top: 100%;
        right: 0;
        padding: 10px 10px 15px 15px;
        width: max-content;
        flex-direction: column;
        align-items: flex-end;
        gap: 5px;
        display: none;
        border-radius: 5px 0 5px 5px;
    }
    .submenu-item {
        color: black;
        width: -webkit-fill-available;
        text-align: right;
        font-weight: normal
    }
}
</style>