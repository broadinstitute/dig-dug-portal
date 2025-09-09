<template>
    <div class="footer">
        <div class="footer-top">
            <div class="footer-contact">
                <div class="footer-title">Get in Touch</div>
                <div>We welcome any questions or feedback, invite collaborations, and value input about SysBio FAIRplex.</div>
                <a href="mailto:support@sysbio-fairplex.org">support@sysbio-fairplex.org</a>
            </div>
            <div class="menu">
                <div v-for="item in nav.menuItems" class="menu-item-wrapper">
                    <a class="menu-item" 
                       :href="item.path || null" 
                       :target="item.external ? '_blank' : null"
                    >
                        {{ item.label }}
                    </a>
                    <div v-if="item.subMenuItems" class="submenu">
                        <a v-for="subItem in item.subMenuItems" 
                           class="submenu-item" 
                           :href="subItem.path || null"
                           :target="subItem.external ? '_blank' : null"
                        >
                            {{ subItem.label }}
                        </a>
                    </div>
                </div>
            </div>
            <div class="footer-logo">
                <img src="/images/sysbio/logos/sb-white-v.svg" />
            </div>
        </div>
        <div class="colophon">
            Sysbio FAIRplex is supported by the NIH Common Fund under Award Number OT2OD037975 as part of the Common Fund's Venture Program SysBio Initiative. 
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import sysbioMenu from "@/portals/SysBio/assets/sysbioMenu.json";

export default Vue.component("sysbioFooter", {
    components: {},
    props: {},
    data() { 
        return {
            nav: sysbioMenu
        } 
    },
    computed: {},
    created() {},
    methods: {},
});
</script>

<style scoped>
.footer {
    width: 100%;
    background: var(--sysbio-blue);
    color: var(--sysbio-white-blue);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 40px 40px;
    margin-top: auto;
    flex-direction: column;
    gap: 40px;
    font-size: 14px;

    .footer-top{
        display:flex;
        width: 100%;
        justify-content: space-between;
    }
    .footer-title{
        font-size: 18px;
        font-weight: bold;
    }
    .footer-logo{
        width: 250px;
        display: flex;
        justify-content: flex-end;
    }
    .footer-logo img {
        height: 100px;
        mix-blend-mode: hard-light;
    }
    .footer-contact{
        width:250px;
    }
    .footer-contact a, .footer-contact a:visited {
        margin-top:10px;
        color: var(--sysbio-white-blue) !important;
        font-weight: bold;
    }
    .footer-contact a:hover{
        text-decoration: underline;
    }
    .menu {
        display: flex;
        gap: 50px;
    }
    .menu a, .menu a:visited {
        color: var(--sysbio-white-blue) !important;
    }
    .menu a:hover{
        text-decoration: none;
    }
    .menu a[href]:not([href=""]):hover{
        text-decoration: underline;
    }
    .menu-item-wrapper {
        display: flex;
        flex-direction: column;
    }
    .menu-item{
        font-weight: bold;
    }
    .submenu {
        display: flex;
        flex-direction: column;
    }
    a.submenu-item {
        font-weight: normal;
    }
    .colophon{
        font-size: 12px;
    }
}
</style>
