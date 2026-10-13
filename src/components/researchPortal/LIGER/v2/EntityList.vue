<script>
import Vue from "vue";

// The "nothing selected yet" body for the Gene program and Cell state tabs: pick
// one from what is in scope.
//
// The canvas is the primary way to select, but it requires finding a row in a
// pannable view. This is the same set as a plain list, which is the faster path when
// you know what you are looking for.
export default Vue.component("EntityList", {
    props: {
        // [{ key, label, absText, specText, specDirection, muted, color?, matchCount? }]
        items: {
            type: Array,
            default: () => []
        },
        title: {
            type: String,
            default: ""
        },
        // Explains what the list is showing, e.g. that it has been narrowed to the
        // matches of a selected program.
        note: {
            type: String,
            default: ""
        },
        emptyText: {
            type: String,
            default: "Nothing in scope."
        },
        // Column heading for `matchCount`, hidden when the items carry no counts.
        matchLabel: {
            type: String,
            default: ""
        },
        // Why the dimmed rows are dimmed. Supplied by the caller because the reason
        // differs per list -- a program is dimmed for its gene loading, a cell state
        // for its enrichment -- and a generic "below the filters" says neither.
        mutedLabel: {
            type: String,
            default: ""
        }
    },

    computed: {
        showMatches() {
            return !!this.matchLabel && this.items.some((item) => Number.isFinite(item.matchCount));
        },

        // Programs carry a gene loading; cell states do not. Driven off the data
        // rather than a prop, the same way the matches column is.
        showLoading() {
            return this.items.some((item) => Number.isFinite(item.geneLoading));
        },

        // This list never filters -- it is the full set, and `muted` is what marks
        // the rows the canvas is currently leaving out. Saying so matters, because
        // the count in the tab header will not match the canvas.
        mutedCount() {
            return this.items.filter((item) => item.muted).length;
        }
    }
});
</script>

<template>
    <div class="entity-list">
        <div class="list-intro">
            <div class="intro-title">{{ title }}</div>
            <div v-if="note" class="intro-note">{{ note }}</div>
        </div>

        <div v-if="!items.length" class="list-empty">{{ emptyText }}</div>

        <!-- The legend is NOT part of the table's conditional chain. It was written as
             a `v-else-if` between the two, which meant that any list with a dimmed row
             rendered the legend INSTEAD of the table -- the common case, and the table
             vanished entirely. -->
        <template v-else>
            <!-- This list is the full set and never filters, unlike the canvas.
                 Dimmed rows are the ones the canvas is currently leaving out, and
                 saying so is what stops the two counts looking like a bug. -->
            <div v-if="mutedCount && mutedLabel" class="list-legend">
                {{ mutedCount }} dimmed — {{ mutedLabel }}
            </div>

            <table class="list-table">
            <thead>
                <tr>
                    <th class="col-name">Name</th>
                    <th v-if="showLoading" class="col-num">Loading</th>
                    <th class="col-num">Expression</th>
                    <th class="col-num">Specificity</th>
                    <th v-if="showMatches" class="col-num">{{ matchLabel }}</th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="item in items"
                    :key="item.key"
                    class="list-row"
                    :class="{ muted: item.muted }"
                    @click="$emit('select', item)"
                >
                    <td class="col-name">
                        <span v-if="item.color" class="swatch" :style="{ background: item.color }"></span>
                        <span class="row-name">{{ item.label }}</span>
                    </td>
                    <td v-if="showLoading" class="col-num loading">{{ item.geneLoadingText || "—" }}</td>
                    <td class="col-num">{{ item.absText }}</td>
                    <td
                        class="col-num spec"
                        :class="item.specDirection ? 'dir-' + item.specDirection : 'dir-none'"
                    >{{ item.specText }}</td>
                    <td v-if="showMatches" class="col-num">
                        {{ Number.isFinite(item.matchCount) ? item.matchCount : "—" }}
                    </td>
                </tr>
            </tbody>
            </table>
        </template>
    </div>
</template>

<style scoped>
.entity-list{
    padding: 16px 18px;
}

.list-intro{
    margin-bottom: 10px;
}
.list-legend{
    margin-bottom: 8px;
    font-size: 11px;
    color: var(--ce-muted);
}
/* The loading is why a program is on the canvas at all, so it leads the numbers. */
.col-num.loading{
    font-weight: 700;
    color: var(--ce-ink);
}
.intro-title{
    font-size: 14px;
    font-weight: 700;
    color: var(--ce-ink);
}
.intro-note{
    margin-top: 2px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--ce-muted);
}

.list-empty{
    padding: 22px 0;
    font-size: 13px;
    color: var(--ce-muted);
}

.list-table{
    width: 100%;
    border-collapse: collapse;
}
.list-table th{
    padding: 5px 8px;
    border-bottom: 1px solid var(--ce-line);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
    color: var(--ce-muted);
    white-space: nowrap;
}
.list-row{
    cursor: pointer;
}
.list-row:hover{
    background: var(--ce-sunken);
}
/* p-value above the threshold. Still a real row, so dimmed rather than hidden. */
.list-row.muted{
    opacity: .6;
}
.list-table td{
    padding: 6px 8px;
    border-bottom: 1px solid var(--ce-line);
    font-size: 13px;
    color: var(--ce-ink);
}
.col-name{
    text-align: left;
    width: 100%;
}
.col-num{
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}
.swatch{
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    margin-right: 7px;
    vertical-align: baseline;
}
.row-name{
    font-weight: 700;
}
.spec.dir-up{ color: #2f5bea; }
.spec.dir-down{ color: #d92d20; }
.spec.dir-none{ color: var(--ce-muted); }
</style>
