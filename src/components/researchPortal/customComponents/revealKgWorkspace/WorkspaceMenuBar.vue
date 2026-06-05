<template>
    <div class="wkb-menubar">
        <div class="wkb-menu-group wkb-menu-group-left">
            <b-dropdown
                v-for="menu in menus"
                :key="menu.id"
                :text="menu.label"
                variant="outline-secondary"
                size="sm"
                class="wkb-menu"
                menu-class="wkb-menu-list"
                toggle-class="wkb-menu-toggle"
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

        <div class="wkb-menu-group wkb-menu-group-right">
            <b-button
                variant="outline-secondary"
                size="sm"
                class="wkb-library-button"
                @click="onLibrary"
            >
                {{ libraryMenu.label }}
            </b-button>
            <b-button
                variant="outline-secondary"
                size="sm"
                class="wkb-library-button"
                @click="onDocumentation"
            >
                Documentation
            </b-button>
        </div>
    </div>
</template>

<script>
export default {
    name: "WorkspaceMenuBar",
    data() {
        return {
            // Disjoint taxonomy: Analyze = interpret, Manage = persist.
            menus: [
                {
                    id: "analyze",
                    label: "Analyze",
                    items: [
                        { id: "explain", label: "Explain graph" },
                        { id: "hypotheses", label: "Build hypotheses" },
                        { id: "dataProvenance", label: "Find related datasets" },
                    ],
                },
                {
                    id: "save",
                    label: "Manage",
                    items: [
                        { id: "newGraph", label: "New graph" },
                        { id: "saveKg", label: "Save graph to library…" },
                        { id: "exportGraph", label: "Export graph" },
                        { id: "importGraph", label: "Import graph" },
                        { id: "downloadSnapshot", label: "Download review snapshot…" },
                    ],
                },
            ],
            libraryMenu: {
                id: "library",
                label: "My library",
            },
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
        onLibrary() {
            this.$emit("action", {
                menu: "library",
                action: "open",
                label: "My library",
            });
        },
        onDocumentation() {
            this.$emit("action", {
                menu: "documentation",
                action: "open",
                label: "Documentation",
            });
        },
    },
};
</script>

<style scoped>
.wkb-menubar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
}

.wkb-menu-group {
    display: flex;
    align-items: center;
    gap: 10px;
}

.wkb-menu-group-right {
    margin-left: auto;
}

.wkb-menu >>> .wkb-menu-toggle,
.wkb-library-button {
    font-weight: 600;
    letter-spacing: 0.01em;
    border-radius: 6px;
    color: var(--cfde-blue, #2c5c97);
    border-color: var(--cfde-border, #e6e1d6);
    background: #ffffff;
}

.wkb-menu >>> .wkb-menu-toggle:hover,
.wkb-menu >>> .show > .wkb-menu-toggle,
.wkb-library-button:hover,
.wkb-library-button:focus,
.wkb-library-button:active {
    color: #ffffff;
    background: var(--cfde-blue, #2c5c97);
    border-color: var(--cfde-blue, #2c5c97);
}

.wkb-menu >>> .wkb-menu-list {
    min-width: 200px;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(20, 22, 30, 0.12);
}
</style>
