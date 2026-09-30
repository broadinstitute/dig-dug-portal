<script>
import Vue from "vue";

// One cell state, as a two-line row: the name on the first line, its one-line lede
// on the second.
//
// It is NOT structurally identical to ProgramRow any more, and the difference is
// deliberate. Both endpoints return the same expression / specificity shape, but the
// two lists answer different questions. A program's label is already descriptive
// ("Oxidative phosphorylation"), so the space beside it is best spent on its
// numbers. A cell state's name is a claim about biology ("Stressed", "Mature
// identity") that means little on its own, and the lede is what makes it legible --
// so the bar, the expression reading, the specificity arrow and the specificity
// reading are all gone from here.
//
// None of that data is lost: the state's detail panel carries all four, with room to
// label them, and the reader gets there by clicking the row.
//
// What stays is the color accent on the left edge. It is the same color as this
// state's edges, which makes the list its own legend: a reader traces a line to a
// color and finds the color at the head of a row.
export default Vue.component("StateRow", {
    props: {
        // one item from buildExpressionItems(), plus `color`, `matchCount`, `lede`
        state: {
            type: Object,
            required: true
        },
        selected: {
            type: Boolean,
            default: false
        },
        // false while some other row is hovered, so unrelated rows recede with
        // their edges instead of staying at full strength
        dimmed: {
            type: Boolean,
            default: false
        }
    }
});
</script>

<template>
    <div
        class="state-row"
        :class="{ selected, muted: state.muted, dimmed }"
        :style="{ '--state-color': state.color }"
        @click="$emit('select', state)"
        @mouseenter="$emit('hover', state)"
        @mouseleave="$emit('hover', null)"
    >
        <div class="accent"></div>

        <div class="row-body">
            <div class="row-label" :title="state.label">{{ state.label }}</div>

            <!-- The lede is not always present: it comes from the state's metadata
                 row, and the catalogue's rows are not uniform. An empty line reads
                 as a short row rather than as missing data, which is right -- there
                 is nothing to report. -->
            <div v-if="state.lede" class="row-lede" :title="state.lede">{{ state.lede }}</div>
        </div>
    </div>
</template>

<style scoped>
.state-row{
    display: grid;
    grid-template-columns: 3px 1fr;
    align-items: center;
    gap: 8px;
    height: var(--ce-row-height, 46px);
    padding: 0 10px 0 0;
    border-top: 1px solid var(--ce-line);
    cursor: pointer;
    transition: opacity .12s ease;
}
.state-row:first-child{
    border-top: none;
}
.state-row:hover{
    background: var(--ce-sunken);
}
.state-row.selected{
    background: var(--ce-accent-soft);
}
/* p-value fails the threshold. Rows with no p-value are NOT dimmed by this --
   missing is not the same as non-significant. */
.state-row.muted{
    opacity: .55;
}
/* Something else is hovered. Separate from `.muted`, which is about the data. */
.state-row.dimmed{
    opacity: .3;
}

.accent{
    align-self: stretch;
    background: var(--state-color);
}

.row-body{
    min-width: 0;
    /* The accent is the first grid column, so the text needs its own inset. */
    padding-left: 2px;
}
.row-label{
    font-size: 12px;
    font-weight: 700;
    line-height: 1.35;
    color: var(--ce-ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
/* One line, ellipsized, with the full text on the title attribute. The row height is
   fixed and shared with the canvas edge math, so this cannot be allowed to wrap --
   see the LIST_ROW_HEIGHT comment in CellEvolutionBrowser.vue. */
.row-lede{
    font-size: 10px;
    line-height: 1.35;
    color: var(--ce-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
