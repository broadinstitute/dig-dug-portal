<template>
    <div class="scp-menubar">
        <div class="scp-menu-group">
            <b-dropdown
                v-for="menu in menus"
                :key="menu.id"
                :text="menu.label"
                variant="outline-secondary"
                size="sm"
                class="scp-menu"
                menu-class="scp-menu-list"
                toggle-class="scp-menu-toggle"
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
    </div>
</template>

<script>
import { ACTION_CATALOG } from "./scopeActionsCatalog.js";

export default {
    name: "ScopeMenuBar",
    data() {
        return {
            menus: [
                {
                    id: "session",
                    label: "Session",
                    items: [
                        { id: "resetSession", label: "Reset session" },
                        { id: "importSession", label: "Import session" },
                        { id: "exportSession", label: "Export session" },
                    ],
                },
                {
                    id: "actions",
                    label: "Actions",
                    items: ACTION_CATALOG.map((action) => ({ id: action.id, label: action.label })),
                },
                {
                    id: "help",
                    label: "Help",
                    items: [
                        { id: "learnScope", label: "Learn SCOPE" },
                        { id: "documentation", label: "Documentation" },
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
.scp-menubar {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 10px;
}

.scp-menu-group {
    display: flex;
    align-items: center;
    gap: 10px;
}

.scp-menu >>> .scp-menu-toggle {
    font-weight: 600;
    letter-spacing: 0.01em;
    border-radius: 6px;
    color: var(--cfde-blue, #2c5c97);
    border-color: var(--cfde-border, #e6e1d6);
    background: #ffffff;
}

.scp-menu >>> .scp-menu-toggle:hover,
.scp-menu >>> .show > .scp-menu-toggle {
    color: #ffffff;
    background: var(--cfde-blue, #2c5c97);
    border-color: var(--cfde-blue, #2c5c97);
}

.scp-menu >>> .dropdown-menu {
    z-index: 50;
}

.scp-menu >>> .scp-menu-list {
    min-width: 200px;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(20, 22, 30, 0.12);
}
</style>
