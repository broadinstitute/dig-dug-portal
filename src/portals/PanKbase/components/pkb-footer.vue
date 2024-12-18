<template>
    <div class="pkb-footer">
        <!-- for now, just copy/paste this element (class="menu") from pkb-header -->
        <!-- TODO: create menu component that reads menu content from object then renders -->
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
                    <a class="submenu-item" href="/analytical-library.html">Analytical Library</a>
                    <a class="submenu-item" href="/publications.html">Publications</a>
                </div>
            </div>
            <div class="menu-item-wrapper">
                <a class="menu-item" href="/">About</a>
                <div class="submenu">
                    <a class="submenu-item" href="/programs.html">Programs</a>
                    <a class="submenu-item" href="/projects.html">Project</a>
                    <a class="submenu-item" href="/people.html">People</a>
                    <a class="submenu-item" href="/collaborate.html">Collaborate</a>
                    <a class="submenu-item" href="/policies.html">Policies</a>
                </div>
            </div>
            <div class="menu-item-wrapper">
                <a class="menu-item" href="/">Help</a>
                <div class="submenu">
                    <a class="submenu-item" href="/contact.html">Contact</a>
                    <a class="submenu-item" href="/metadata-data-standards.html">Metadata | Data Standards</a>
                    <a class="submenu-item" href="/tools-pipelines.html">Tools | Pipelines</a>
                    <a class="submenu-item" href="/tutorials.html">Tutorials</a>
                    <a class="submenu-item" href="/">Blog</a>
                </div>
            </div>
        </div>
        <div class="f-row" style="gap:20px">
            <div class="logo">
                <a href="/">
                    <img style="height:37px" src="https://hugeampkpncms.org/sites/default/files/users/user32/pankbase/pkb-4.svg"/>
                </a>
            </div>
            <div>
                Supported by <strong>National Institutes of Health (NIH)</strong> grants <strong>U24 DK138515</strong>, <strong>U24 DK138512</strong><br>
                Supplemental funds from the <strong>NIH Office of Data Science Strategies</strong>
            </div>
        </div>
        
        
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("PkbFooter", {
    components: {},
    props: {},
    data() { return {} },
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
