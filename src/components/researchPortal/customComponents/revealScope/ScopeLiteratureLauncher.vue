<template>
    <div class="scp-lit">
        <div v-if="!loading" class="scp-lit-sources">
            <div v-for="source in sources" :key="source.id" class="scp-lit-source">
                <span class="scp-lit-source-label">{{ source.label }}</span>
                <input
                    v-model="queryBySource[source.id]"
                    type="text"
                    class="scp-lit-source-input"
                />
                <button type="button" class="scp-lit-source-open" @click="onOpen(source)">
                    Open in {{ source.label }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { LITERATURE_SOURCES } from "./scopeLiteratureSources.js";
import { extractLiteratureQuery } from "./scopeLiteratureQuery.js";

export default {
    name: "ScopeLiteratureLauncher",
    props: {
        hypothesisText: {
            type: String,
            default: "",
        },
        preloadedQuery: {
            type: String,
            default: null,
        },
    },
    data() {
        return {
            loading: false,
            sources: LITERATURE_SOURCES,
            queryBySource: LITERATURE_SOURCES.reduce((acc, source) => {
                acc[source.id] = this.preloadedQuery || this.hypothesisText;
                return acc;
            }, {}),
        };
    },
    watch: {
        queryBySource: {
            deep: true,
            handler() {
                this.$emit("query-change", this.queryBySource[this.sources[0].id]);
            },
        },
    },
    mounted() {
        if (this.preloadedQuery) {
            this.$emit("query-change", this.queryBySource[this.sources[0].id]);
            return;
        }
        this.loadQuery();
    },
    methods: {
        async loadQuery() {
            this.loading = true;
            this.$emit("loading", true);
            try {
                const query = await extractLiteratureQuery(this.hypothesisText);
                this.sources.forEach((source) => {
                    this.queryBySource[source.id] = query;
                });
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn("[ScopeLiteratureLauncher] falling back to raw hypothesis text", error);
            } finally {
                this.loading = false;
                this.$emit("loading", false);
            }
        },
        onOpen(source) {
            const query = this.queryBySource[source.id];
            window.open(source.buildUrl(query), "_blank", "noopener");
        },
    },
};
</script>

<style scoped>
.scp-lit {
    padding: 18px;
}

.scp-lit-sources {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.scp-lit-source {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 10px;
    background: #fff;
}

.scp-lit-source-label {
    flex: 0 0 70px;
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.scp-lit-source-input {
    flex: 1;
    font-size: 13px;
    padding: 7px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    color: var(--cfde-ink, #33363d);
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
}

.scp-lit-source-open:hover {
    color: #fff;
    background: var(--cfde-blue, #2c5c97);
}
</style>
