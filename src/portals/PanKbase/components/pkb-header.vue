<template>
    <div class="pkb-nav">
        <div class="logo">
            <img src="https://hugeampkpncms.org/sites/default/files/users/user32/pankbase/pkb-4.svg">
        </div>
        <div class="menu-wrapper">
            <div class="topmenu">
                <a class="topmenu-item">Login 
                    <img style="height:15px;width:15px" src="https://hugeampkpncms.org/sites/default/files/users/user32/pankbase/user-icon.svg">
                </a>
            </div>
            <div class="menu">
                <div class="menu-item-wrapper">
                    <a class="menu-item">Item</a>
                    <div class="submenu">
                        <a class="submenu-item">Item</a>
                        <a class="submenu-item">Long Item</a>
                        <a class="submenu-item">Item</a>
                    </div>
                </div>
                <div class="menu-item-wrapper">
                    <a class="menu-item menu-item-selected">Active Item</a>
                    <div class="submenu">
                        <a class="submenu-item">Item</a>
                        <a class="submenu-item">Long Item</a>
                        <a class="submenu-item">Another Long Item</a>
                    </div>
                </div>
                <div class="menu-item-wrapper">
                    <a class="menu-item">Long Item</a>
                </div>
                <div class="menu-item-wrapper">
                    <a class="menu-item">Item</a>
                </div>
                <div class="menu-item-wrapper">
                    <a class="menu-item">Another Item</a>
                    <div class="submenu">
                        <a class="submenu-item">Item</a>
                        <a class="submenu-item">Long Item</a>
                        <a class="submenu-item">Another Long Item</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("pkb-header", {
    components: {},
    props: {
    },
    data() {
        return {
        };
    },
    computed: {},
    created() {
    },
    methods: {
    },
});
</script>
<style scoped>
.pkb-nav{
    width: 100%;
    background: #fafafa;
    display: flex;
    justify-content: space-between;
    padding: 5px 20px 0 15px;
    border-bottom: 2px solid var(--pkb-primary-green);
    box-shadow: 0px 2px 5px var(--pkb-primary-green);
    z-index: 10;
    font-family: 'Open Sans', sans-serif;

    .logo {
        display: flex;
        align-items: baseline;
        cursor:pointer;
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
        gap: 10px;
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
        color: var(--pkb-secondary-green);
    }
    .topmenu-item:hover svg *{
        stroke:var(--pkb-secondary-green)
    }
    .menu {
        display: flex;
        font-weight: 600;
    }
    .menu-item-wrapper{
        position: relative;
        display: flex;
    }
    .menu-item {
        position: relative;
        padding: 5px 10px;
        cursor: pointer;
        border-radius: 10px 10px 0 0;
        font-weight: 600;
        color: var(--pkb-black)
    }
    .menu-item.menu-item-selected {
        color: var(--pkb-primary-green);
        border-bottom: 5px solid var(--pkb-primary-green);
    }
    .menu-item-wrapper:hover .menu-item {
        color: var(--pkb-secondary-green);
        border-bottom: 5px solid var(--pkb-secondary-green);
    }
    .menu-item-wrapper:hover > .submenu{
        display:flex;
    }
    .submenu {
        position: absolute;
        top: 100%;
        right: 0;
        background: var(--pkb-secondary-green);
        padding: 10px 10px 15px 15px;
        border-radius: 0 0 10px 10px;
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
    .submenu-item:hover{
        color:white;
        cursor: pointer;
    }
}
</style>