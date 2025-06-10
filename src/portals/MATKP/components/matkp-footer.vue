<template>
    <div class="mat-footer f-col align-h-center" style="font-size: 14px; z-index:100; padding: 50px; gap: 40px">
        <div class="menu">
            <div v-for="item in menuItems" class="menu-item-wrapper">
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
        <div class="f-row align-v-center logos" style="gap:10px">
            <a href="https://x.com/matkportal" target="_blank" title="@PanKbase">
                <img src="https://hugeampkpncms.org/sites/default/files/images/logos/external/x-white.svg">
            </a>
            <a href="https://www.linkedin.com/groups/13287084/" target="_blank" title="LinkedIn">
                <img src="https://hugeampkpncms.org/sites/default/files/images/logos/external/linkedin-white.svg">
            </a>
            <!--
            <a href="" target="_blank" title="GitHub">
                <img src="https://hugeampkpncms.org/sites/default/files/images/logos/external/github-white.svg">
            </a>
            -->
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import matkpMenu from "@/portals/MATKP/assets/matkp-menu.json";

export default Vue.component("matkp-footer", {
    components: {
    },
    props: [],
    data() {
        return {
            menuItems: matkpMenu
        };
    },
    computed: {
    },
    created() {
    },
    methods: {
    },
});
</script>

<style scoped>
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
.logos img{
    width: 20px;
}
.logos a{
    opacity: 0.7;
}
.logos a:hover{
    opacity: 1;
}
</style>