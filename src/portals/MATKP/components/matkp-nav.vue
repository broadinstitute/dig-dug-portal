<template>
    <div class="mat-header f-row spread-out align-v-center" :class="glass ? 'glass' : ''">
        <a class="logo f-row align-v-center" href="/">
            <img src="https://hugeampkpncms.org/sites/default/files/users/user32/matkp/matkplll.png"/>
            <span style="font-weight: 600">MAT<span style="font-weight: 300">KP</span><span class="tagline">The place for fat.</span></span>
        </a>
        <div class="f-row menu">
            <div
                v-for="item in menuItems"
                class="menu-item-wrapper"
                :class="{ active: isActive(item.path) }"
            >
                <a class="menu-item" :href="item.path || null">
                    {{ item.label}}
                </a>
                <div v-if="item.subMenuItems" class="submenu">
                    <a
                        v-for="subItem in item.subMenuItems"
                        class="submenu-item"
                        :href="subItem.path || null"
                        :class="{ active: isActive(subItem.path) }"
                        :data-whatever="isActive(subItem.path).toString()"
                    >
                        {{ subItem.label }}
                    </a>
                </div>
            </div>
            <!--
            <a href="/info.html?page=about">About</a>
            <a href="/datasets.html">Datasets</a>
            <a href="/cellbrowser.html">Cell Browser</a>
            <a href="/info.html?page=adipose">Adipose Tissue</a>
            <a href="/info.html?page=collaborate">Collaborate</a>
            <a href="/info.html?page=news">News</a>
            <a href="/info.html?page=help">Help</a>
            -->
        </div>
    </div>
</template>

<script>
import Vue from "vue";

let menuItemActive = false;

export default Vue.component("matkp-nav", {
    components: {},
    props: {
        glass: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            menuItems: [
                {
                    label: "Data",
                    path: "/datasets.html"
                },
                {
                    label: "Resources",
                    path: "",
                    subMenuItems: [
                        { label: "Single Cell Browser", path: "/cellbrowser.html" },
                        { label: "Bulk Browser", path: "/bulkbrowser.html" },
                    ],
                },
                {
                    label: "About",
                    path: "",
                    subMenuItems: [
                        { label: "MATKP", path: "/info.html?page=about" },
                        { label: "Adipose Tissue", path: "/info.html?page=adipose" },
                        { label: "Collaborate", path: "/info.html?page=collaborate" },
                    ],
                },
                {
                    label: "Help",
                    path: "",
                    subMenuItems: [
                        { label: "Contact", path: "/info.html?page=collaborate" },
                        { label: "News", path: "/info.html?page=news" },
                    ],
                },
            ],
        };
    },
    computed: {},
    created() {
        this.injectFavicon(
            "https://hugeampkpncms.org/sites/default/files/users/user32/matkp/favicon-32x32.png"
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
.mat-header {
    padding: 0 40px;
}
.mat-header a,
.mat-header a:visited {
    color: white !important;
    text-decoration: none;
}
.mat-header.glass {
    background: #ffffff50;
    backdrop-filter: blur(10px);
    position: fixed;
    width: 100vw;
    z-index: 100;
    box-shadow: 0 0 10px 0 #42424220;
}
.mat-header.glass a,
.mat-header.glass a:visited {
    color: black !important;
    text-decoration: none;
}
.logo {
    height: 40px;
    gap: 10px;
    font-size: 22px;
}
.logo img {
    height: inherit;
}
/*
.menu {
    font-size: 14px;
    gap: 10px;
}
.menu a:hover {
    text-decoration: underline;
}
*/

.tagline {
    color: #ffd10c;
    font-size: 12px;
    margin: 0 0 0 10px;
    font-style: italic;
}
.glass .tagline {
    color: #ff6c02;
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
    background-color: var(--matkp-orange);
    height: 50%;
}
.menu-item {
    position: relative;
    padding: 15px 10px;
    cursor: pointer;
    border-radius: 10px 10px 0 0;
    font-weight: 600;
    color: var(--pkb-black);
    font-weight: bold;
    /*border-bottom: 5px solid transparent;*/
}
.menu-item.menu-item-main {
    color: var(--matkp-orange) !important;
}
.menu-item.menu-item-selected {
    color: var(--matkp-orange);
    /*border-bottom: 5px solid var(--matkp-orange-b);*/
}
.menu-item-wrapper:hover .menu-item,
.menu-item-wrapper.active .menu-item,
.menu-item-wrapper:has(.submenu-item.active) .menu-item {
    color: var(--matkp-yellow-b) !important;
    /*border-bottom: 5px solid var(--matkp-orange-b);*/
}
.mat-header.glass .menu-item-wrapper:hover .menu-item{
    color: var(--matkp-orange) !important;
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
    box-shadow: 0 5px 10px 0 #42424220;
}
.mat-header.glass .submenu{
    background: var(--matkp-glass);
}
.mat-header .submenu{
    background: #424242;
}
.submenu-item {
    color: black;
    width: -webkit-fill-available;
    text-align: right;
    font-weight: normal
}
.mat-header .submenu-item:hover,
.mat-header .submenu-item.active {
    color: var(--matkp-yellow-b) !important;
    cursor: pointer;
}
.mat-header.glass .submenu-item:hover,
.mat-header.glass .submenu-item.active {
    color: var(--matkp-orange)  !important;
    cursor: pointer;
}
</style>
