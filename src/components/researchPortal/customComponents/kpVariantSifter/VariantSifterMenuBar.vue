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
            <template v-for="item in menu.items">
                <b-dropdown-divider
                    v-if="item.type === 'divider'"
                    :key="item.id"
                />
                <b-dropdown-header
                    v-else-if="item.type === 'header'"
                    :key="item.id"
                >
                    {{ item.label }}
                </b-dropdown-header>
                <b-dropdown-item
                    v-else
                    :key="item.id"
                    :disabled="Boolean(item.disabled)"
                    :title="item.title || item.label"
                    @click="onSelect(menu, item)"
                >
                    {{ item.label }}
                </b-dropdown-item>
            </template>
        </b-dropdown>
    </div>
</template>

<script>
import { formatRecentSearchLabel } from "./variantSifterRecentSearches.js";

export default {
    name: "VariantSifterMenuBar",
    props: {
        recentSearches: {
            type: Array,
            default: () => [],
        },
    },
    computed: {
        menus() {
            const recentItems =
                Array.isArray(this.recentSearches) && this.recentSearches.length
                    ? this.recentSearches.map((entry, index) => {
                          const label = formatRecentSearchLabel(entry);
                          return {
                              id: `recentSearch-${index}-${entry.timestamp || index}`,
                              action: "applyRecentSearch",
                              label,
                              title: label,
                              recentSearch: entry,
                          };
                      })
                    : [
                          {
                              id: "recentSearchesEmpty",
                              label: "No recent searches",
                              disabled: true,
                          },
                      ];

            return [
                {
                    id: "search",
                    label: "Search",
                    items: [
                        { id: "resetSearch", label: "Reset search" },
                        { id: "searchDivider", type: "divider" },
                        {
                            id: "recentSearchesHeader",
                            type: "header",
                            label: "Recent searches",
                        },
                        ...recentItems,
                    ],
                },
                {
                    id: "importExport",
                    label: "Import / Export",
                    items: [
                        { id: "importSession", label: "Import session" },
                        { id: "exportSession", label: "Export session" },
                        { id: "exportHtmlReport", label: "Export HTML report" },
                    ],
                },
                {
                    id: "help",
                    label: "Help",
                    items: [{ id: "gettingAround", label: "Getting Around" }],
                },
            ];
        },
    },
    methods: {
        onSelect(menu, item) {
            if (!item || item.disabled || item.type === "divider" || item.type === "header") {
                return;
            }
            this.$emit("action", {
                menu: menu.id,
                action: item.action || item.id,
                label: item.label,
                recentSearch: item.recentSearch || null,
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
    min-width: 220px;
    max-width: min(92vw, 420px);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(20, 22, 30, 0.12);
}

.vks-menu >>> .dropdown-item {
    font-size: 13px;
    white-space: normal;
    line-height: 1.35;
}

.vks-menu >>> .dropdown-header {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
