<template>
    <div class="scp-lit">
        <div v-if="!loading" class="scp-lit-sources">
            <div v-for="source in sources" :key="source.id" class="scp-lit-source-block">
                <div class="scp-lit-source-head">
                    <span class="scp-lit-source-label">{{ source.label }}</span>
                </div>
                <div
                    v-for="(row, index) in queries"
                    :key="row.id"
                    class="scp-lit-query-row"
                >
                    <div class="scp-lit-query-meta">
                        <span class="scp-lit-query-label">{{ row.label || `Search ${index + 1}` }}</span>
                        <p v-if="row.reason" class="scp-lit-query-reason">{{ row.reason }}</p>
                    </div>
                    <input
                        v-model="row.query"
                        type="text"
                        class="scp-lit-source-input"
                        :aria-label="(row.label || `Search ${index + 1}`) + ' query'"
                        @input="emitQueryChange"
                    />
                    <button
                        type="button"
                        class="scp-lit-source-open"
                        :disabled="!row.query.trim()"
                        @click="onOpen(source, row.query)"
                    >
                        Open in {{ source.label }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { LITERATURE_SOURCES } from "./scopeLiteratureSources.js";
import {
    extractLiteratureQuery,
    normalizeLiteratureQueries,
} from "./scopeLiteratureQuery.js";

export default {
    name: "ScopeLiteratureLauncher",
    props: {
        hypothesisText: {
            type: String,
            default: "",
        },
        /**
         * Legacy string, string[], or { queries: [...] } from a previous session.
         */
        preloadedQuery: {
            type: [String, Array, Object],
            default: null,
        },
    },
    data() {
        return {
            loading: false,
            sources: LITERATURE_SOURCES,
            queries: normalizeLiteratureQueries(this.preloadedQuery, this.hypothesisText),
        };
    },
    mounted() {
        if (this.preloadedQuery != null && this.preloadedQuery !== "") {
            this.emitQueryChange();
            return;
        }
        this.loadQuery();
    },
    methods: {
        emitQueryChange() {
            this.$emit(
                "query-change",
                this.queries.map((row) => ({
                    label: row.label,
                    reason: row.reason,
                    query: row.query,
                }))
            );
        },
        async loadQuery() {
            this.loading = true;
            this.$emit("loading", true);
            try {
                const result = await extractLiteratureQuery(this.hypothesisText);
                this.queries = normalizeLiteratureQueries(result, this.hypothesisText);
                this.emitQueryChange();
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn("[ScopeLiteratureLauncher] falling back to raw hypothesis text", error);
                this.queries = normalizeLiteratureQueries(null, this.hypothesisText);
                this.emitQueryChange();
            } finally {
                this.loading = false;
                this.$emit("loading", false);
            }
        },
        onOpen(source, query) {
            const term = String(query || "").trim();
            if (!term) return;
            window.open(source.buildUrl(term), "_blank", "noopener");
        },
    },
};
</script>

<style scoped>
.scp-lit {
    padding: 18px;
    background-color: #ffffff;
    border-radius: 15px;
    border-top: solid 1px #dddddd;
}

.scp-lit-sources {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.scp-lit-source-block {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 10px;
    background: #fff;
}

.scp-lit-source-head {
    display: flex;
    align-items: center;
}

.scp-lit-source-label {
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.scp-lit-query-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
}

.scp-lit-query-meta {
    flex: 0 0 220px;
}

.scp-lit-query-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
    line-height: 1.3;
}

.scp-lit-query-reason {
    margin: 4px 0 0;
    font-size: 13px;
    font-weight: 400;
    line-height: 1.35;
    color: var(--cfde-muted, #6b6b6b);
}

.scp-lit-source-input {
    flex: 1;
    font-size: 13px;
    padding: 7px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    color: var(--cfde-ink, #33363d);
    margin-top: 1px;
}

.scp-lit-source-open {
    flex: 0 0 auto;
    font-size: 13px;
    font-weight: 600;
    padding: 7px 14px;
    border: 1px solid var(--cfde-blue, #2c5c97);
    border-radius: 6px;
    color: var(--cfde-blue, #2c5c97);
    background: #fff;
    cursor: pointer;
    white-space: nowrap;
    margin-top: 1px;
}

.scp-lit-source-open:hover:not(:disabled) {
    color: #fff;
    background: var(--cfde-blue, #2c5c97);
}

.scp-lit-source-open:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

@media (max-width: 720px) {
    .scp-lit-query-row {
        flex-wrap: wrap;
    }

    .scp-lit-query-meta {
        flex: 1 1 100%;
    }
}
</style>
