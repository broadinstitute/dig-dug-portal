<template>
    <div class="vks-menubar">
        <b-dropdown
            v-for="menu in menus"
            :key="menu.id"
            :text="menu.label"
            variant="outline-secondary"
            size="sm"
            class="vks-menu"
            menu-class="vks-menu-list"
            toggle-class="vks-menu-toggle"
        >
            <b-dropdown-item
                v-for="item in menu.items"
                :key="item.id"
                @click="onSelect(menu, item)"
            >
                {{ item.label }}
            </b-dropdown-item>
        </b-dropdown>
    </div>
</template>

<script>
export default {
    name: "VariantSifterMenuBar",
    data() {
        return {
            menus: [
                {
                    id: "search",
                    label: "Search",
                    items: [
                        { id: "resetSearch", label: "Reset search" },
                        { id: "recentSearches", label: "Recent searches" },
                    ],
                },
                {
                    id: "importExport",
                    label: "Import / Export",
                    items: [
                        { id: "importSession", label: "Import session" },
                        { id: "exportSession", label: "Export session" },
                        { id: "downloadTable", label: "Download variant table" },
                    ],
                },
                {
                    id: "help",
                    label: "Help",
                    items: [
                        { id: "gettingAround", label: "Getting Around" },
                    ],
                },
            ],
        };
    },
    methods: {
        onSelect(menu, item) {
            this.$emit("action", {
                menu: menu.id,
                action: item.id,
                label: item.label,
            });
        },
    },
};
</script>

<style scoped>
.vks-menubar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
}

.vks-menu >>> .vks-menu-toggle {
    font-weight: 600;
    letter-spacing: 0.01em;
    border-radius: 6px;
    color: var(--cfde-blue, #2c5c97);
    border-color: var(--cfde-border, #e6e1d6);
    background: #ffffff;
    font-size: 13px;
}

.vks-menu >>> .vks-menu-toggle:hover,
.vks-menu >>> .show > .vks-menu-toggle {
    color: #ffffff;
    background: var(--cfde-blue, #2c5c97);
    border-color: var(--cfde-blue, #2c5c97);
}

.vks-menu >>> .dropdown-menu {
    z-index: 50;
}

.vks-menu >>> .vks-menu-list {
    min-width: 200px;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(20, 22, 30, 0.12);
}

.vks-menu >>> .dropdown-item {
    font-size: 13px;
}
</style>
