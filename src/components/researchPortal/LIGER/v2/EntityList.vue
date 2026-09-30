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
        }
    },

    computed: {
        showMatches() {
            return !!this.matchLabel && this.items.some((item) => Number.isFinite(item.matchCount));
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

        <table v-else class="list-table">
            <thead>
                <tr>
                    <th class="col-name">Name</th>
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
    </div>
</template>

<style scoped>
.entity-list{
    padding: 16px 18px;
}

.list-intro{
    margin-bottom: 10px;
}
.intro-title{
    font-size: 13px;
    font-weight: 700;
    color: var(--ce-ink);
}
.intro-note{
    margin-top: 2px;
    font-size: 11px;
    line-height: 1.5;
    color: var(--ce-muted);
}

.list-empty{
    padding: 22px 0;
    font-size: 12px;
    color: var(--ce-muted);
}

.list-table{
    width: 100%;
    border-collapse: collapse;
}
.list-table th{
    padding: 5px 8px;
    border-bottom: 1px solid var(--ce-line);
    font-size: 10px;
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
    font-size: 12px;
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
