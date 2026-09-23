<template>
    <div class="rd-menubar">
        <div class="rd-menu-group">
            <template v-for="menu in menus">
                <b-button
                    v-if="!menu.items"
                    :key="menu.id"
                    variant="outline-secondary"
                    size="sm"
                    class="rd-menu-button"
                    @click="onButtonClick(menu)"
                >
                    {{ menu.label }}
                </b-button>
                <b-dropdown
                    v-else
                    :key="menu.id"
                    :text="menu.label"
                    variant="outline-secondary"
                    size="sm"
                    class="rd-menu"
                    menu-class="rd-menu-list"
                    toggle-class="rd-menu-toggle"
                >
                    <b-dropdown-item
                        v-for="item in menu.items"
                        :key="item.id"
                        @click="onSelect(menu, item)"
                    >
                        {{ item.label }}
                    </b-dropdown-item>
                </b-dropdown>
            </template>
        </div>
    </div>
</template>

<script>
export default {
    name: "DesignMenuBar",
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
                },
                {
                    id: "help",
                    label: "Help",
                    items: [
                        { id: "learnDesign", label: "Learn DESIGN" },
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
        onButtonClick(menu) {
            this.$emit("action", {
                menu: menu.id,
                action: "open",
                label: menu.label,
            });
        },
    },
};
</script>

<style scoped>
.rd-menubar {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 10px;
}

.rd-menu-group {
    display: flex;
    align-items: center;
    gap: 10px;
}

.rd-menu >>> .rd-menu-toggle,
.rd-menu-button {
    font-weight: 600;
    letter-spacing: 0.01em;
    border-radius: 6px;
    color: var(--cfde-blue, #2c5c97);
    border-color: var(--cfde-border, #e6e1d6);
    background: #ffffff;
}

.rd-menu >>> .rd-menu-toggle:hover,
.rd-menu >>> .show > .rd-menu-toggle,
.rd-menu-button:hover,
.rd-menu-button:focus,
.rd-menu-button:active {
    color: #ffffff;
    background: var(--cfde-blue, #2c5c97);
    border-color: var(--cfde-blue, #2c5c97);
}

.rd-menu >>> .dropdown-menu {
    z-index: 50;
}

.rd-menu >>> .rd-menu-list {
    min-width: 200px;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(20, 22, 30, 0.12);
}
</style>
