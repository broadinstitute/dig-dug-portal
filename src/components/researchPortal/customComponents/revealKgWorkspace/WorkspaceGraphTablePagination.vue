<template>
    <nav
        v-if="totalPages > 1"
        class="wkb-graph-table-pagination"
        :aria-label="ariaLabel"
    >
        <div class="wkb-graph-table-pagination-pill">
            <button
                type="button"
                class="wkb-graph-table-pagination-btn"
                aria-label="First page"
                :disabled="currentPage <= 1"
                @click="goToPage(1)"
            >
                «
            </button>
            <button
                type="button"
                class="wkb-graph-table-pagination-btn"
                aria-label="Previous page"
                :disabled="currentPage <= 1"
                @click="goToPage(currentPage - 1)"
            >
                ‹
            </button>
            <template v-for="(item, index) in pageItems">
                <span
                    v-if="item === 'ellipsis'"
                    :key="`ellipsis-${index}`"
                    class="wkb-graph-table-pagination-ellipsis"
                    aria-hidden="true"
                >
                    …
                </span>
                <button
                    v-else
                    :key="`page-${item}`"
                    type="button"
                    class="wkb-graph-table-pagination-btn"
                    :class="{ 'is-active': item === currentPage }"
                    :aria-label="`Page ${item}`"
                    :aria-current="item === currentPage ? 'page' : undefined"
                    @click="goToPage(item)"
                >
                    {{ item }}
                </button>
            </template>
            <button
                type="button"
                class="wkb-graph-table-pagination-btn"
                aria-label="Next page"
                :disabled="currentPage >= totalPages"
                @click="goToPage(currentPage + 1)"
            >
                ›
            </button>
            <button
                type="button"
                class="wkb-graph-table-pagination-btn"
                aria-label="Last page"
                :disabled="currentPage >= totalPages"
                @click="goToPage(totalPages)"
            >
                »
            </button>
        </div>
    </nav>
</template>

<script>
function buildPageNumberItems(currentPage, totalPages) {
    if (totalPages <= 1) {
        return [1];
    }
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    const delta = 1;
    const range = [];
    const items = [];
    let previous = null;

    for (let page = 1; page <= totalPages; page += 1) {
        if (
            page === 1
            || page === totalPages
            || (page >= currentPage - delta && page <= currentPage + delta)
        ) {
            range.push(page);
        }
    }

    for (const page of range) {
        if (previous !== null) {
            if (page - previous === 2) {
                items.push(previous + 1);
            } else if (page - previous !== 1) {
                items.push("ellipsis");
            }
        }
        items.push(page);
        previous = page;
    }

    return items;
}

export default {
    name: "WorkspaceGraphTablePagination",
    props: {
        currentPage: {
            type: Number,
            default: 1,
        },
        totalPages: {
            type: Number,
            default: 1,
        },
        ariaLabel: {
            type: String,
            default: "Graph table pages",
        },
    },
    computed: {
        pageItems() {
            return buildPageNumberItems(this.currentPage, this.totalPages);
        },
    },
    methods: {
        goToPage(page) {
            const next = Math.min(Math.max(1, page), this.totalPages);
            if (next !== this.currentPage) {
                this.$emit("page-change", next);
            }
        },
    },
};
</script>

<style scoped>
.wkb-graph-table-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin: 0.65rem 0 0.15rem;
}

.wkb-graph-table-pagination-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.65rem;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 999px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.wkb-graph-table-pagination-btn {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--cfde-orange, #e07b39);
    font: inherit;
    font-size: 13px;
    line-height: 1;
    min-width: 2rem;
    min-height: 2rem;
    padding: 0.2rem 0.35rem;
    border-radius: 999px;
    cursor: pointer;
}

.wkb-graph-table-pagination-btn:hover:not(:disabled):not(.is-active) {
    background: var(--cfde-orange-soft, #fbeee3);
}

.wkb-graph-table-pagination-btn:focus-visible {
    outline: 2px solid var(--cfde-orange, #e07b39);
    outline-offset: 2px;
}

.wkb-graph-table-pagination-btn:disabled {
    color: var(--cfde-muted, #6b6b6b);
    cursor: not-allowed;
    opacity: 0.5;
}

.wkb-graph-table-pagination-btn.is-active {
    background: var(--cfde-orange, #e07b39);
    color: #fff;
    font-weight: 600;
    cursor: default;
}

.wkb-graph-table-pagination-ellipsis {
    color: var(--cfde-muted, #6b6b6b);
    font-size: 13px;
    padding: 0 0.15rem;
    user-select: none;
}
</style>
