<template>
    <div class="wkb-menubar">
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
</template>

<script>
export default {
    name: "WorkspaceMenuBar",
    data() {
        return {
            // Disjoint taxonomy: Change = mutate, Analyze = interpret, Save = persist.
            menus: [
                {
                    id: "change",
                    label: "Change",
                    items: [
                        { id: "expand", label: "Expand KG" },
                        { id: "filter", label: "Filter KG" },
                        { id: "addNodes", label: "Add nodes" },
                    ],
                },
                {
                    id: "analyze",
                    label: "Analyze",
                    items: [
                        { id: "explain", label: "Explain KG" },
                        { id: "hypotheses", label: "Build hypotheses" },
                        { id: "dataProvenance", label: "Data provenance" },
                    ],
                },
                {
                    id: "save",
                    label: "Save",
                    items: [
                        { id: "newGraph", label: "New graph" },
                        { id: "saveKg", label: "Save KG" },
                        { id: "downloadSnapshot", label: "Download snapshot" },
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
.wkb-menubar {
    display: flex;
    align-items: center;
    gap: 10px;
}

.wkb-menu >>> .wkb-menu-toggle {
    font-weight: 600;
    letter-spacing: 0.01em;
    border-radius: 6px;
    color: var(--cfde-blue, #2c5c97);
    border-color: var(--cfde-border, #e6e1d6);
    background: #ffffff;
}

.wkb-menu >>> .wkb-menu-toggle:hover,
.wkb-menu >>> .show > .wkb-menu-toggle {
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
