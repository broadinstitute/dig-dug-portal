<template>
    <div class="pkb-nav">
        <div class="logo">
            <a href="/">
                <img src="https://hugeampkpncms.org/sites/default/files/users/user32/pankbase/pkb-4.svg"/>
            </a>
        </div>
        <div class="menu-wrapper">
            <div class="topmenu">
                <a class="topmenu-item">
                    Search <img style="height: 15px; width: 15px" src="https://hugeampkpncms.org/sites/default/files/users/user32/pankbase/search-icon.svg"/>
                </a>
                <a class="topmenu-item">
                    Analysis 
                </a>
                <a class="topmenu-item">
                    Login <img style="height: 15px; width: 15px" src="https://hugeampkpncms.org/sites/default/files/users/user32/pankbase/user-icon.svg"/>
                </a>
            </div>
            <div class="menu">
                <div class="main-menu-items">
                    <div class="menu-item-wrapper">
                        <a class="menu-item menu-item-main" href="https://dev.pankgraph.org/">PanKgraph</a>
                    </div>
                    <div class="menu-item-wrapper">
                        <a class="menu-item menu-item-main" href="/single-cell.html">Integrated Cell Browser</a>
                    </div>
                    <div class="menu-item-wrapper">
                        <a class="menu-item menu-item-main" href="http://tools.cmdga.org:3838/metadata_analysis/">Donor Metadata</a>
                    </div>
                </div>
                <div class="menu-item-wrapper">
                    <a class="menu-item"  href="/">Data</a>
                    <div class="submenu">
                        <a class="submenu-item" href="/projects.html">Data Browser</a>
                        <a class="submenu-item" href="/single-cell.html">Integrated Cell Browser</a>
                        <a class="submenu-item" href="http://tools.cmdga.org:3838/metadata_analysis/">Donor Metadata</a>
                        <a class="submenu-item" href="/">APIs</a>
                    </div>
                </div>
                <div class="menu-item-wrapper">
                    <a class="menu-item" href="/">Resources</a>
                    <div class="submenu">
                        <a class="submenu-item" href="/">Analytical Library</a>
                        <a class="submenu-item" href="/publications.html">Publications</a>
                    </div>
                </div>
                <div class="menu-item-wrapper">
                    <a class="menu-item" href="/">About</a>
                    <div class="submenu">
                        <a class="submenu-item" href="/programs.html">Programs</a>
                        <a class="submenu-item" href="/projects.html">Project</a>
                        <a class="submenu-item" href="/people.html">People</a>
                        <a class="submenu-item" href="/">Collaborate</a>
                        <a class="submenu-item" href="/">Policies</a>
                    </div>
                </div>
                <div class="menu-item-wrapper">
                    <a class="menu-item" href="/">Help</a>
                    <div class="submenu">
                        <a class="submenu-item" href="/contact.html">Contact</a>
                        <a class="submenu-item" href="/">Metadata | Data Standards</a>
                        <a class="submenu-item" href="/">Tools | Pipelines</a>
                        <a class="submenu-item" href="/">Tutorials</a>
                        <a class="submenu-item" href="/">Blog</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("PkbHeader", {
    components: {},
    props: {},
    data() { return {} },
    computed: {},
    created() {
        this.injectFavicon(
            "https://hugeampkpncms.org/sites/default/files/users/user32/pankbase/favicon-32x32.png"
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
                favicon.setAttribute("id", "alex");
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
    },
});
</script>
<style scoped>
.pkb-nav {
    width: 100%;
    background: #fafafa;
    display: flex;
    justify-content: space-between;
    padding: 5px 20px 0 15px;
    border-bottom: 2px solid var(--pkb-primary-green);
    box-shadow: 0px 2px 5px var(--pkb-primary-green);
    z-index: 10;
    font-family: "Open Sans", sans-serif;

    a,
    a:visited {
        color: black !important;
    }
    a:hover{
        text-decoration: none;
    }
    .logo {
        display: flex;
        align-items: baseline;
        cursor: pointer;
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
    .main-menu-items{
        display:flex;
        position: relative;
        padding-right:2px;
    }
    .main-menu-items:after {
        content: '';
        position: absolute;
        top:7px;
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
    .menu-item-wrapper:hover .menu-item {
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
    .submenu-item:hover {
        color: white !important;
        cursor: pointer;
    }
}
</style>
